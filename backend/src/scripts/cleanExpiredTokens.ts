import { pool } from '../config/database';
import { logger } from '../utils/logger';

export async function cleanExpiredTokens(): Promise<{ resetTokensDeleted: number; refreshTokensDeleted: number }> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Delete password reset tokens older than 1 day past expiry or already used
    const resetResult = await client.query(
      `DELETE FROM password_reset_tokens
       WHERE expires_at < NOW() - INTERVAL '1 day'
          OR (used_at IS NOT NULL AND used_at < NOW() - INTERVAL '7 days')`
    );

    // Delete refresh tokens expired more than 30 days ago or revoked more than 30 days ago
    const refreshResult = await client.query(
      `DELETE FROM refresh_tokens
       WHERE expires_at < NOW() - INTERVAL '30 days'
          OR (revoked_at IS NOT NULL AND revoked_at < NOW() - INTERVAL '30 days')`
    );

    await client.query('COMMIT');

    const result = {
      resetTokensDeleted: resetResult.rowCount ?? 0,
      refreshTokensDeleted: refreshResult.rowCount ?? 0,
    };

    logger.info(
      `[Token Cleanup] Purged ${result.resetTokensDeleted} expired password reset tokens and ${result.refreshTokensDeleted} expired refresh tokens.`
    );

    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('[Token Cleanup Error]:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Allow direct CLI invocation: ts-node src/scripts/cleanExpiredTokens.ts
if (require.main === module) {
  cleanExpiredTokens()
    .then(() => {
      logger.info('[Token Cleanup] Completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Token Cleanup Failed]:', err);
      process.exit(1);
    });
}

