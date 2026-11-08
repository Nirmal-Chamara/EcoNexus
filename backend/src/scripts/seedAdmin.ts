import { pool } from '../config/database';
import { env } from '../config/env';
import { hashPassword } from '../utils/password';

export async function seedAdmin(): Promise<void> {
  const client = await pool.connect();
  try {
    console.log('[Admin Seed] Starting system admin initialization...');

    const email = (env.ADMIN_EMAIL || 'admin@econexus.com').toLowerCase().trim();
    const password = env.ADMIN_PASSWORD || 'AdminPass123!';
    const name = env.ADMIN_NAME || 'System Administrator';

    if (!email || !password) {
      throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be configured in environment variables');
    }

    if (password.length < 8) {
      throw new Error('ADMIN_PASSWORD must be at least 8 characters long');
    }

    // Check if user already exists
    const existingUserRes = await client.query(
      `SELECT id, role, status FROM users WHERE email = $1`,
      [email]
    );

    if (existingUserRes.rows.length > 0) {
      const existingUser = existingUserRes.rows[0];
      if (existingUser.role === 'ADMIN' && existingUser.status === 'ACTIVE') {
        console.log(`[Admin Seed] Admin account (${email}) already exists and is active. No changes needed.`);
        return;
      }

      // Ensure account is set to ADMIN role and ACTIVE status
      await client.query(
        `UPDATE users SET role = 'ADMIN', status = 'ACTIVE', updated_at = NOW() WHERE id = $1`,
        [existingUser.id]
      );
      console.log(`[Admin Seed] Updated existing user (${email}) role to ADMIN and status to ACTIVE.`);
      return;
    }

    // Hash password and create new admin account
    const passwordHash = await hashPassword(password);

    const insertRes = await client.query(
      `INSERT INTO users (name, email, password_hash, role, status, token_version)
       VALUES ($1, $2, $3, 'ADMIN', 'ACTIVE', 0)
       RETURNING id, name, email, role, status, created_at`,
      [name, email, passwordHash]
    );

    const admin = insertRes.rows[0];
    console.log(`[Admin Seed] Admin account initialized successfully!`);
    console.log(`[Admin Seed] ID: ${admin.id}`);
    console.log(`[Admin Seed] Email: ${admin.email}`);
    console.log(`[Admin Seed] Role: ${admin.role}`);
    console.log(`[Admin Seed] Status: ${admin.status}`);
  } catch (err) {
    console.error('[Admin Seed Error]: Failed to seed system admin:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

// Execute directly when run as script
if (require.main === module) {
  seedAdmin()
    .then(() => {
      console.log('[Admin Seed] Done.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Admin Seed] Execution failed:', err);
      process.exit(1);
    });
}
