import fs from 'fs';
import os from 'os';
import path from 'path';
import type { PoolClient } from 'pg';
import { migrate, readMigrations } from '../services/migration.service';
import { requireTestDatabaseUrl } from '../utils/testDatabase';

describe('migration safety', () => {
  let directory: string;
  let history: { name: string; checksum: string }[];
  let query: jest.Mock;
  let client: Pick<PoolClient, 'query'>;
  beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'econexus-migrations-'));
    fs.writeFileSync(path.join(directory, '001_initial.sql'), 'SELECT 101');
    history = [];
    query = jest.fn(async (sql: string, values?: string[]) => {
      if (sql.includes('to_regclass'))
        return { rows: [{ ledger: 'schema_migrations', users: null }] };
      if (sql.startsWith('SELECT name')) return { rows: history };
      if (sql.startsWith('INSERT INTO public.schema_migrations'))
        history.push({ name: values![0], checksum: values![1] });
      return { rows: [] };
    });
    client = { query } as unknown as Pick<PoolClient, 'query'>;
  });
  afterEach(() => {
    // Only the mkdtemp directory created by this test is removed.
    fs.rmSync(directory, { recursive: true, force: true });
  });
  it('applies pending SQL atomically and skips it on repeat runs', async () => {
    expect(await migrate(client, directory)).toEqual(['001_initial.sql']);
    expect(await migrate(client, directory)).toEqual([]);
    expect(
      query.mock.calls.filter(([sql]) => sql === 'SELECT 101')
    ).toHaveLength(1);
    expect(query.mock.calls.map(([sql]) => sql)).toEqual(
      expect.arrayContaining(['BEGIN', 'COMMIT'])
    );
  });
  it('rejects edited history before executing pending SQL', async () => {
    history.push({ name: '001_initial.sql', checksum: 'incorrect' });
    await expect(migrate(client, directory)).rejects.toThrow(
      'missing or changed'
    );
    expect(query).not.toHaveBeenCalledWith('SELECT 101');
    expect(query).toHaveBeenLastCalledWith(
      'SELECT pg_advisory_unlock(51904001)'
    );
  });
  it('refuses to replay migrations over an untracked application schema', async () => {
    query.mockImplementation(async (sql: string) => ({
      rows: sql.includes('to_regclass')
        ? [{ ledger: null, users: 'users' }]
        : [],
    }));
    await expect(migrate(client, directory)).rejects.toThrow(
      'Audit and baseline'
    );
    expect(query).not.toHaveBeenCalledWith('SELECT 101');
  });
  it('rolls back failed SQL and releases the lock', async () => {
    const implementation = query.getMockImplementation()!;
    query.mockImplementation(async (...args) => {
      if (args[0] === 'SELECT 101') throw new Error('DDL failure');
      return implementation(...args);
    });
    await expect(migrate(client, directory)).rejects.toThrow('DDL failure');
    expect(query).toHaveBeenCalledWith('ROLLBACK');
    expect(query).not.toHaveBeenCalledWith('COMMIT');
    expect(history).toEqual([]);
  });
  it('keeps full historical filenames as IDs', () => {
    fs.writeFileSync(path.join(directory, '002_a.sql'), 'SELECT 2');
    fs.writeFileSync(path.join(directory, '002_b.sql'), 'SELECT 3');
    expect(readMigrations(directory).map((file) => file.name)).toEqual([
      '001_initial.sql',
      '002_a.sql',
      '002_b.sql',
    ]);
  });
});

describe('integration database selection', () => {
  it.each([
    undefined,
    '',
    'postgres://localhost/econexus',
    'https://localhost/econexus_test',
  ])('rejects an unsafe or missing explicit URL: %s', (value) => {
    expect(() => requireTestDatabaseUrl(value ?? '')).toThrow();
  });
  it('accepts an explicitly named test database', () => {
    expect(requireTestDatabaseUrl('postgres://localhost/econexus_test')).toBe(
      'postgres://localhost/econexus_test'
    );
  });
});
