# Migration execution and existing database adoption

`backend/migrations` is the runtime API schema source used by `npm run migrate`.
`database/migrations` contains a separate earlier schema and must not be applied
to the same database. Reconcile any missing business tables through new backend
migrations after reviewing their owners' requirements.

The runner now uses full filenames as IDs, SHA-256 checksums, a PostgreSQL
advisory lock, and one transaction per pending file. Preserve historical SQL,
including both existing `002` filenames. New filenames must have a unique prefix
and sort after the current history. PostgreSQL statements that require execution
outside a transaction need a separately reviewed migration strategy.

For a fresh empty database, run `npm run migrate` from `backend`. Repeating the
command skips recorded files. A missing/edited applied file fails the run.

An existing application database without a ledger is deliberately refused. The
runner cannot infer which SQL files really ran simply because `users` exists.
Do not add an unconditional “mark all applied” option or replay every old file.

Existing database adoption is a one-time deployment operation:

1. Back up the database and record the application commit and a schema-only dump.
2. Restore the backup to an isolated database and inspect extensions, enum values,
   columns, nullability, indexes, constraints, and any data transformations against
   each historical backend migration. Check both old migration directories for drift.
3. Prepare a reviewed baseline manifest listing the full filename and SHA-256 of
   each migration whose complete effects are present. Do not include partially
   applied files. Resolve differences on the clone before production adoption.
4. Under the same advisory lock (`51904001`), transactionally create
   `public.schema_migrations(name TEXT PRIMARY KEY, checksum CHAR(64) NOT NULL,
   applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())` and insert only the verified
   manifest records with parameterized SQL. Keep this manifest with deployment
   evidence; it is an assertion about inspected schema, not an application shortcut.
5. Run the normal runner on the clone twice, verify pending upgrades and unchanged
   second-run history, run integration acceptance, and test backup restoration.
6. Schedule the reviewed adoption and upgrade on the target database. Preserve
   the evidence and checksums. Roll back through the tested backup/forward-fix
   procedure, not by deleting ledger entries and replaying historical files.

This adoption has not been executed by the module implementation. It needs the
actual target schema and backup evidence; never infer it from repository files.

## Isolated local integration database (PowerShell)

Run at the repository root with Docker Desktop's Linux engine running:

```powershell
docker compose -f docker-compose.test.yml up -d --wait
$env:TEST_DATABASE_URL = 'postgres://econexus_test:econexus_test_local_only@localhost:55432/econexus_test'
```

The compose service binds only to localhost and stores test data in tmpfs.
Stopping/removing it loses its disposable data. It does not mount app data.
Integration helpers require `TEST_DATABASE_URL` with a database name ending in
`_test`; missing configuration and unavailable databases must fail required suites.
Do not set the test URL to an application database. Run migrations with a test
connection selected explicitly; the standard migration CLI otherwise uses the
application's configured `DATABASE_URL`.

No live test database was started during the baseline work because the Docker
Linux engine was unavailable. Unit migration tests validate orchestration; actual
PostgreSQL DDL, locking, upgrades, and recovery remain acceptance requirements.
