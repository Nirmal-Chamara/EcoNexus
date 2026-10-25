/**
 * testDb.ts
 * Shared helpers for managing a live PostgreSQL connection during integration tests.
 * Tests that require a real DB connection call `checkDb()` first. If the DB is
 * unreachable the test is skipped gracefully via Jest's `test.skip`.
 */
import { Pool } from 'pg';

// Use a dedicated test database URL if provided, otherwise fall back to the
// default connection so CI can point at the real test schema.
const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  process.env.DATABASE_URL ||
  'postgres://postgres:postgres@localhost:5432/econexus';

export const testPool = new Pool({ connectionString: TEST_DATABASE_URL });

let _dbReachable: boolean | null = null;

/**
 * Returns true if the test database is reachable.
 * Result is cached so we only probe once per process.
 */
export async function isDbReachable(): Promise<boolean> {
  if (_dbReachable !== null) return _dbReachable;
  try {
    await testPool.query('SELECT 1');
    _dbReachable = true;
  } catch {
    _dbReachable = false;
  }
  return _dbReachable;
}

/**
 * Purge all test-created rows for a given list of emails.
 * Call in afterAll / afterEach to keep the schema clean.
 */
export async function cleanupUsers(emails: string[]): Promise<void> {
  if (emails.length === 0) return;
  try {
    // Refresh tokens cascade on user deletion if FK with CASCADE is set;
    // otherwise delete them explicitly first.
    await testPool.query(
      `DELETE FROM refresh_tokens
       WHERE user_id IN (SELECT id FROM users WHERE email = ANY($1::text[]))`,
      [emails]
    );
    await testPool.query('DELETE FROM users WHERE email = ANY($1::text[])', [emails]);
  } catch {
    // Ignore cleanup errors – they should not fail the test run.
  }
}

/**
 * End the pool connection. Call once in the outermost afterAll.
 */
export async function closeDb(): Promise<void> {
  await testPool.end();
}
