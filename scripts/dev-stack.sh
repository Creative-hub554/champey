#!/bin/sh
# KhmerOnlineShop preview stack.
#
# - With DATABASE_URL set: NestJS backend (BACKEND_PORT, default 4000) plus the
#   Next.js storefront on 0.0.0.0:$PORT.
# - Without DATABASE_URL: storefront only; API-backed sections degrade
#   gracefully in the UI (guest/browse mode).
#
# Freebuff runs this as `sh ./scripts/dev-stack.sh` (uploaded files lose the
# executable bit, so it is never invoked directly).

set -u

FRONTEND_PORT="${PORT:-3000}"
BACKEND_PORT="${BACKEND_PORT:-4000}"

BACKEND_PID=""

cleanup() {
  if [ -n "$BACKEND_PID" ]; then
    kill "$BACKEND_PID" 2>/dev/null
  fi
}
trap cleanup TERM INT

if [ -n "${DATABASE_URL:-}" ]; then
  echo "[dev-stack] DATABASE_URL present — starting backend on :$BACKEND_PORT"
  # The backend also reads PORT; pin it so it never collides with $PORT.
  PORT="$BACKEND_PORT" pnpm --filter backend dev &
  BACKEND_PID=$!
  echo "[dev-stack] backend pid $BACKEND_PID"
else
  echo "[dev-stack] DATABASE_URL not set — storefront-only (guest mode); set DATABASE_URL to enable the API"
fi

echo "[dev-stack] starting storefront on 0.0.0.0:$FRONTEND_PORT"
cd apps/frontend
# `next` lives in the workspace's node_modules/.bin — reach it via pnpm.
exec pnpm exec next dev -H 0.0.0.0 -p "$FRONTEND_PORT"
