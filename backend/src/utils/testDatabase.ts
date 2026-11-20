/** Test helpers must never inherit DATABASE_URL or silently use the application DB. */
export function requireTestDatabaseUrl(
  value = process.env.TEST_DATABASE_URL
): string {
  if (!value)
    throw new Error(
      'TEST_DATABASE_URL is required for database integration tests'
    );
  const url = new URL(value);
  const databaseName = decodeURIComponent(url.pathname.slice(1));
  if (
    !['postgres:', 'postgresql:'].includes(url.protocol) ||
    !databaseName.endsWith('_test')
  ) {
    throw new Error(
      'TEST_DATABASE_URL must use PostgreSQL and a database name ending in _test'
    );
  }
  return value;
}
