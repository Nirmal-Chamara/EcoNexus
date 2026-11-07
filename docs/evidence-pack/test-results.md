# Automated validation evidence

Recorded: 2026-10-29

## Mobile

Command:

```powershell
cd mobile
npm run test:coverage
npm run type-check
```

Latest result:

- 13 Jest suites passed.
- 87 tests passed.
- Global coverage: 85.36% statements, 74.27% branches, 75.60% functions, 87.26% lines.
- `src/api/`: 100% statements/branches/functions/lines.
- `src/schemas/`: 100% statements/branches/functions/lines.
- Coverage thresholds are enforced in [mobile/package.json](../../mobile/package.json).

## Backend

Command:

```powershell
cd backend
npm test -- --runInBand
npm run build
```

Latest result:

- 5 Jest suites passed.
- 86 tests passed.
- TypeScript build passed.
- The live seed-admin database assertion was skipped because PostgreSQL was not running during the recorded run.

## Reproduction notes

Run the commands again before submission and replace this summary with the current date/counts if they change. Keep the terminal output or CI URL alongside this file when the evidence pack is archived.
