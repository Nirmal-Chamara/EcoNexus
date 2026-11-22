import { pool } from '../config/database';
import { decryptMail, EncryptedMail } from './mail-payload.service';
import { hashSha256 } from '../utils/crypto';
import { sendTransactionalEmail, MailDeliveryError } from './email.service';

interface MailJob {
  id: string;
  user_id: string;
  purpose: 'VERIFY_EMAIL' | 'RESET_PASSWORD';
  challenge_hash: string;
  provider: 'resend' | 'smtp';
  payload: EncryptedMail;
  attempts: number;
}

export async function processEmailBatch(limit = 5): Promise<number> {
  // Expired payloads and abandoned final attempts cannot remain indefinitely.
  await pool.query(
    "UPDATE email_outbox SET status = 'CANCELLED', payload = '{}'::jsonb WHERE status IN ('PENDING','PROCESSING') AND expires_at <= NOW()"
  );
  await pool.query(
    "UPDATE email_outbox SET status = 'FAILED', payload = '{}'::jsonb, last_error_code = 'EMAIL_LEASE_EXHAUSTED' WHERE status = 'PROCESSING' AND attempts >= 5 AND locked_at < NOW() - INTERVAL '2 minutes'"
  );
  const client = await pool.connect();
  let jobs: MailJob[];
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `WITH candidates AS (
      SELECT id FROM email_outbox WHERE expires_at > NOW() AND attempts < 5
      AND ((status = 'PENDING' AND available_at <= NOW()) OR
           (status = 'PROCESSING' AND locked_at < NOW() - INTERVAL '2 minutes'))
      ORDER BY created_at, id LIMIT $1 FOR UPDATE SKIP LOCKED
    ) UPDATE email_outbox e SET status = 'PROCESSING', locked_at = NOW(), attempts = e.attempts + 1
      FROM candidates c WHERE e.id = c.id RETURNING e.*`,
      [Math.min(Math.max(limit, 1), 20)]
    );
    jobs = result.rows;
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
  for (const job of jobs) {
    try {
      let payload;
      try {
        payload = decryptMail(job.id, job.payload);
      } catch {
        throw new MailDeliveryError('EMAIL_PAYLOAD_INVALID', false);
      }
      if (
        payload.purpose !== job.purpose ||
        hashSha256(payload.token) !== job.challenge_hash
      )
        throw new MailDeliveryError('EMAIL_PAYLOAD_INVALID', false);
      const eligible =
        job.purpose === 'VERIFY_EMAIL'
          ? await pool.query(
              `SELECT t.user_id FROM email_verification_tokens t JOIN users u ON u.id = t.user_id
          WHERE t.token_hash = $1 AND t.user_id = $2 AND t.email = $3 AND u.email = $3
          AND t.used_at IS NULL AND t.expires_at > NOW()`,
              [job.challenge_hash, job.user_id, payload.email]
            )
          : await pool.query(
              `SELECT t.user_id FROM password_reset_tokens t JOIN users u ON u.id = t.user_id
          WHERE t.token_hash = $1 AND t.user_id = $2 AND u.email = $3 AND u.password_hash IS NOT NULL
          AND t.used_at IS NULL AND t.expires_at > NOW()`,
              [job.challenge_hash, job.user_id, payload.email]
            );
      if (!eligible.rows.length) {
        await pool.query(
          "UPDATE email_outbox SET status = 'CANCELLED', payload = '{}'::jsonb WHERE id = $1 AND status = 'PROCESSING' AND attempts = $2",
          [job.id, job.attempts]
        );
        continue;
      }
      const providerId = await sendTransactionalEmail(
        job.provider,
        job.id,
        payload.email,
        payload.subject,
        payload.text,
        payload.from
      );
      await pool.query(
        "UPDATE email_outbox SET status = 'SENT', sent_at = NOW(), provider_id = $1, payload = '{}'::jsonb, last_error_code = NULL WHERE id = $2 AND status = 'PROCESSING' AND attempts = $3",
        [providerId, job.id, job.attempts]
      );
    } catch (error) {
      const code =
        error instanceof MailDeliveryError
          ? error.code
          : 'EMAIL_PROCESSING_FAILED';
      const retry =
        (!(error instanceof MailDeliveryError) || error.retryable) &&
        job.attempts < 5;
      await pool.query(
        `UPDATE email_outbox SET status = $1, last_error_code = $2,
        available_at = NOW() + ($3 * INTERVAL '1 second'), locked_at = NULL,
        payload = CASE WHEN $1 = 'FAILED' THEN '{}'::jsonb ELSE payload END
        WHERE id = $4 AND status = 'PROCESSING' AND attempts = $5`,
        [
          retry ? 'PENDING' : 'FAILED',
          code,
          Math.min(30 * 2 ** (job.attempts - 1), 300),
          job.id,
          job.attempts,
        ]
      );
    }
  }
  return jobs.length;
}

export function startEmailWorker() {
  let stopped = false;
  let timer: NodeJS.Timeout | undefined;
  let running: Promise<void> = Promise.resolve();
  const tick = () => {
    running = processEmailBatch(2)
      .then(() => {})
      .catch(() => {
        console.error(
          'Email worker unavailable; verify database migrations and email configuration'
        );
      })
      .finally(() => {
        if (!stopped) {
          timer = setTimeout(tick, 5000);
          timer.unref();
        }
      });
  };
  tick();
  return async () => {
    stopped = true;
    if (timer) clearTimeout(timer);
    await running;
  };
}
