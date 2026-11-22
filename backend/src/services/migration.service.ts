import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';
import type { PoolClient } from 'pg';

type MigrationClient = Pick<PoolClient, 'query'>;

/** Filenames are the migration IDs, including the two historical 002 files. */
export function readMigrations(directory: string) {
  return fs
    .readdirSync(directory)
    .filter((file) => file.endsWith('.sql'))
    .sort()
    .map((name) => {
      const sql = fs.readFileSync(path.join(directory, name), 'utf8');
      return {
        name,
        sql,
        checksum: createHash('sha256').update(sql).digest('hex'),
      };
    });
}

export async function migrate(
  client: MigrationClient,
  directory: string
): Promise<string[]> {
  const migrations = readMigrations(directory);
  const applied: string[] = [];
  // One connection holds the lock for the complete run, including initial setup.
  await client.query('SELECT pg_advisory_lock(51904001)');
  try {
    const state = await client.query(
      `SELECT to_regclass('public.schema_migrations') AS ledger,
              to_regclass('public.users') AS users`
    );
    if (!state.rows[0].ledger && state.rows[0].users) {
      throw new Error(
        'Existing users schema has no migration ledger. Audit and baseline it using docs/database/migration-baseline.md before upgrading.'
      );
    }
    await client.query(`CREATE TABLE IF NOT EXISTS public.schema_migrations (
      name TEXT PRIMARY KEY, checksum CHAR(64) NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
    const history = await client.query(
      'SELECT name, checksum FROM public.schema_migrations ORDER BY name'
    );
    const known = new Map(
      migrations.map((migration) => [migration.name, migration])
    );
    for (const record of history.rows) {
      if (known.get(record.name)?.checksum !== record.checksum) {
        throw new Error(
          `Applied migration missing or changed: ${record.name}. Restore historical SQL; add a new migration for changes.`
        );
      }
    }
    const completed = new Set(history.rows.map((record) => record.name));
    for (const migration of migrations) {
      if (completed.has(migration.name)) continue;
      await client.query('BEGIN');
      try {
        await client.query(migration.sql);
        await client.query(
          'INSERT INTO public.schema_migrations (name, checksum) VALUES ($1, $2)',
          [migration.name, migration.checksum]
        );
        await client.query('COMMIT');
        applied.push(migration.name);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
    return applied;
  } finally {
    await client.query('SELECT pg_advisory_unlock(51904001)');
  }
}
