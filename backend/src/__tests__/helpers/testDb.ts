/**
 * testDb.ts
 * Shared helpers for managing a live PostgreSQL connection during integration tests.
 * Requires an explicitly selected test database. Missing/unreachable databases
 * fail the suite instead of silently skipping integration coverage.
 */
import { Pool } from 'pg';
import { requireTestDatabaseUrl } from '../../utils/testDatabase';

// Never fall back to the application database.
const TEST_DATABASE_URL = requireTestDatabaseUrl();

export const testPool = new Pool({
  connectionString: TEST_DATABASE_URL,
  connectionTimeoutMillis: 5000,
});

let _dbReachable: boolean | null = null;

/**
 * Returns true if reachable; otherwise throws so required integration tests fail.
 * Result is cached so we only probe once per process.
 */
export async function isDbReachable(): Promise<boolean> {
  if (_dbReachable !== null) return _dbReachable;
  try {
    await testPool.query('SELECT 1');
    _dbReachable = true;
  } catch {
    throw new Error('Required integration test database is unreachable');
  }
  return _dbReachable;
}

/**
 * Purge all test-created rows for a given list of emails.
 * Call in afterAll / afterEach to keep the schema clean.
 */
export async function cleanupUsers(emails: string[]): Promise<void> {
  if (emails.length === 0) return;
  // Delete refresh tokens explicitly before their owning users.
  await testPool.query(
    `DELETE FROM refresh_tokens
     WHERE user_id IN (SELECT id FROM users WHERE email = ANY($1::text[]))`,
    [emails]
  );
  await testPool.query('DELETE FROM users WHERE email = ANY($1::text[])', [
    emails,
  ]);
}

/**
 * End the pool connection. Call once in the outermost afterAll.
 */
export async function closeDb(): Promise<void> {
  await testPool.end();
}
