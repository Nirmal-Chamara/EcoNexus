import { pool } from '../config/database';
import { seedAdmin } from '../scripts/seedAdmin';
import { env } from '../config/env';

describe('Admin Seeding Script (seedAdmin)', () => {
  const testAdminEmail = 'test_seed_admin@econexus.com';

  beforeAll(() => {
    // Override env for test
    (env as any).ADMIN_EMAIL = testAdminEmail;
    (env as any).ADMIN_PASSWORD = 'TestAdminPassword123!';
    (env as any).ADMIN_NAME = 'Test Admin User';
  });

  afterAll(async () => {
    // Clean up created test admin user
    try {
      await pool.query('DELETE FROM users WHERE email = $1', [testAdminEmail]);
    } catch (err) {
      // Ignore cleanup error if DB is not reachable during isolated unit test
    }
    await pool.end();
  });

  it('should be a valid function export', () => {
    expect(typeof seedAdmin).toBe('function');
  });

  it('should run seedAdmin idempotently', async () => {
    // Check if DB is reachable before attempting query
    try {
      await pool.query('SELECT 1');
    } catch (err) {
      console.warn('PostgreSQL database not running. Skipping live DB test assertion.');
      return;
    }

    // Clean any pre-existing test user
    await pool.query('DELETE FROM users WHERE email = $1', [testAdminEmail]);

    // First execution: should insert new user
    await seedAdmin();

    const userRes = await pool.query('SELECT id, name, email, role, status FROM users WHERE email = $1', [testAdminEmail]);
    expect(userRes.rows.length).toBe(1);
    expect(userRes.rows[0].email).toBe(testAdminEmail);
    expect(userRes.rows[0].role).toBe('ADMIN');
    expect(userRes.rows[0].status).toBe('ACTIVE');

    // Second execution: should be idempotent and handle existing user gracefully
    await seedAdmin();

    const userRes2 = await pool.query('SELECT id, name, email, role, status FROM users WHERE email = $1', [testAdminEmail]);
    expect(userRes2.rows.length).toBe(1);
  });
});
