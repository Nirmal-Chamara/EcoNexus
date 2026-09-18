#!/usr/bin/env bash
# Applies migrations then seeds reference data (categories, reward rules, environmental factors).
set -e
for f in database/migrations/*.sql; do
  echo "Applying $f"
  psql "$DATABASE_URL" -f "$f"
done
for f in database/seeds/*.sql; do
  echo "Seeding $f"
  psql "$DATABASE_URL" -f "$f"
done
