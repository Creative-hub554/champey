#!/bin/sh
# One-shot database bootstrap (run manually or via freebuff-env --restart hook):
#   sh ./scripts/db-init.sh
# Requires DATABASE_URL in the environment (e.g. Neon connection string).
# - prisma generate is safe to re-run; db push syncs the schema; seed is idempotent.

set -eu

if [ -z "${DATABASE_URL:-}" ]; then
  echo "[db-init] DATABASE_URL is not set — nothing to do." >&2
  exit 1
fi

echo "[db-init] generating prisma client"
pnpm --filter @theo/database exec prisma generate

echo "[db-init] pushing schema"
pnpm --filter @theo/database exec prisma db push --skip-generate

echo "[db-init] seeding (idempotent)"
pnpm --filter @theo/database exec prisma db seed

echo "[db-init] done"
