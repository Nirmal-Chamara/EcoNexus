#!/usr/bin/env bash
# Applies migrations then seeds reference data (categories, reward rules, environmental factors).
set -e
for f in database/migrations/*.sql; do
  echo "Applying $f"
  psql "$DATABASE_URL" -f "$f"
done
for f in database/seeds/*.sql; do
  [ -f "$f" ] || continue
  echo "Seeding $f"
  psql "$DATABASE_URL" -f "$f"
done

echo "Seeding system admin..."
(cd backend && npm run seed:admin)
