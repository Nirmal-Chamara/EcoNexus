import { z } from 'zod';
import { pool } from '../config/database';
import { env } from '../config/env';
import { hashPassword } from '../utils/password';
import { isSafeProvisioningPassword } from '../utils/credentialPolicy';
import { AppError } from '../utils/AppError';
import { accountTransaction } from '../services/account-policy.service';

export async function seedAdmin(): Promise<void> {
  const email = env.ADMIN_EMAIL.trim().toLowerCase();
  const password = env.ADMIN_PASSWORD;
  const operator = env.ADMIN_PROVISIONED_BY.trim();
  const reason = env.ADMIN_PROVISION_REASON.trim();
  if (!z.string().email().safeParse(email).success || !operator || !reason) {
    throw new AppError(
      400,
      'Configure ADMIN_EMAIL, ADMIN_PROVISIONED_BY and ADMIN_PROVISION_REASON explicitly',
      'ADMIN_PROVISION_CONFIG'
    );
  }
  if (!isSafeProvisioningPassword(password)) {
    throw new AppError(
      400,
      'Configure a nondefault admin password of 12-72 bytes with upper, lower and numeric characters',
      'ADMIN_PROVISION_CONFIG'
    );
  }
  try {
    await accountTransaction(async (client) => {
      const existing = await client.query(
        'SELECT id, role, status FROM users WHERE email = $1 FOR UPDATE',
        [email]
      );
      if (existing.rows.length) {
        const user = existing.rows[0];
        if (user.role === 'ADMIN' && user.status === 'ACTIVE') return;
        throw new AppError(
          409,
          'An existing account cannot be promoted or reactivated by provisioning',
          'ADMIN_IDENTITY_CONFLICT'
        );
      }
      const hash = await hashPassword(password);
      const result = await client.query(
        `INSERT INTO users (name, email, password_hash, role, status, token_version)
         VALUES ($1, $2, $3, 'ADMIN', 'ACTIVE', 0) RETURNING id`,
        [env.ADMIN_NAME, email, hash]
      );
      await client.query(
        'INSERT INTO audit_logs (actor_id, action, target_id, meta) VALUES ($1, $2, $3, $4)',
        [
          null,
          'ADMIN_PROVISIONED',
          result.rows[0].id,
          { source: 'operator-cli', operator, reason },
        ]
      );
    });
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505'
    ) {
      throw new AppError(
        409,
        'An account already exists for the provisioning identity',
        'ADMIN_IDENTITY_CONFLICT'
      );
    }
    throw error;
  }
}

async function main() {
  try {
    await seedAdmin();
    console.log(
      '[Admin Seed] Provisioning completed; existing active admins remain unchanged.'
    );
  } catch (error) {
    console.error(
      '[Admin Seed] Provisioning failed:',
      error instanceof AppError ? error.code : 'PROVISIONING_FAILED'
    );
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
if (require.main === module) void main();
