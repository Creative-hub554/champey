# Deployment

How the CompusMarket / champey.com platform is deployed. Two paths:

1. **Cloudflare Workers (frontend, current)** — `apps/frontend` deploys via
   OpenNext (`build:cf`/`deploy:cf` scripts, `wrangler.jsonc`,
   `open-next.config.ts`). See the "Cloudflare Workers (frontend)" section.
2. **Self-hosted Docker Compose (full stack)** — the full stack exists in-repo
   (`docker/compose.prod.yml`), but **no production host is reachable yet** —
   DNS for `champey.com` resolves (AWS) but nothing answers HTTPS, and no CI
   deploy secrets are configured. This doc is the runbook for standing up the
   stack on a fresh host and for enabling the CI deploy jobs.

## Cloudflare Workers (frontend)

The storefront is an SSR Next.js app, so it **cannot** deploy as a static
`dist/` folder on Cloudflare Pages — that fails with
`Output directory "dist" not found`. Use OpenNext → Workers instead.

Commit `f4f84b7` ("Add files via upload", 2026-09-04) was a root-only upload
with no `apps/`/`packages/` — never pin a Cloudflare deploy to it. If a
Cloudflare deployment keeps rebuilding that SHA, the project is pinned (or a
cached "Retry deployment" is being clicked); re-point it at `main`.

### Automated deploys (GitHub Actions)

`.github/workflows/cloudflare-deploy.yml` builds the OpenNext bundle and
deploys the Worker on every push to `main` via `wrangler-action` — no
dashboard clicks needed. It is inert until two repo secrets exist:

| Secret | Where to get it |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare dashboard → My Profile → API Tokens → template "Edit Cloudflare Workers" (needs Workers Scripts:Edit + Account Settings:Read) |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard → Workers & Pages → right sidebar "Account ID" |

Optional build-time (`NEXT_PUBLIC_*`) secrets: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`,
`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_API_URL` — these are inlined at build
time, so set them as repo secrets too, matching the Worker values.

The OpenNext build and a `wrangler deploy --dry-run` bundle validation run on
every push regardless of credentials (dry-run needs no auth), so `build:cf`
is continuously exercised on CI infra — the first real deploy is never the
first execution of that build path. Only the final `wrangler deploy` is
gated: until the token is set, the workflow builds, validates, prints a skip
message, and exits green (same pattern as the gated Docker jobs).

### One-time setup (Cloudflare dashboard)

Only the secrets + webhook are dashboard work once CI is wired:

1. Create the Worker once by pushing to `main` (or run the workflow via
   "Run workflow"); `wrangler.jsonc` names it `champey-frontend`. A manual
   first run via `pnpm --filter frontend run deploy:cf` (`wrangler login`)
   also works.
2. Worker → Settings → Variables and Secrets:
   `DATABASE_URL` (public TCP-reachable Postgres — Neon/Supabase pooler, not
   localhost), `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`,
   `NEXT_PUBLIC_SITE_URL` (the worker URL), `CLERK_WEBHOOK_SECRET`,
   `JWT_SECRET`, `AUTH_SECRET`, `SENTRY_DSN` +
   `NEXT_PUBLIC_SENTRY_DSN` (if Sentry used), MinIO/S3 vars for uploads.
3. Point the Clerk webhook at `https://<worker>/api/webhooks/clerk`.

(The full dashboard-import path — Workers & Pages → Create → Workers →
Import a repository → branch `main`, build `pnpm run build:cf`, deploy
`npx wrangler deploy` — remains an alternative if you prefer Cloudflare's
git integration over GitHub Actions. Do **not** reuse the old Pages project
pinned to `f4f84b7`.)

### Local commands

```bash
pnpm --filter frontend run build:cf     # next build + opennextjs-cloudflare build
pnpm --filter frontend run preview:cf   # serve the Worker locally via wrangler
pnpm --filter frontend run deploy:cf    # build + deploy to Cloudflare
```

ISR caching across isolates is wired: `open-next.config.ts` uses the
`r2IncrementalCache` override and `wrangler.jsonc` binds
`NEXT_INC_CACHE_R2_BUCKET` → bucket `champey-isr-cache`. Create the bucket
once (the API token from the CI section needs R2 Edit for this):

```bash
pnpm --filter frontend exec wrangler r2 bucket create champey-isr-cache
```

Cache entries can be scoped with the `NEXT_INC_CACHE_R2_PREFIX` Worker var
(defaults to `incremental-cache`).

### Config audit (2026-09-11, against @opennextjs/cloudflare 1.20.6)
Verified from the installed adapter's source, not just docs:

- **compatibility_date `2026-08-01`** — matches the adapter's own template
  default; the build warns when the date is >6 months old (previously
  `2024-12-30` triggered that warning on every build).
- **Next.js 15.5 + wrangler 4.131** — supported (adapter floor is Next 14.2;
  the wrangler ≥4.59.2 warning only applies to Next 16.1+).
- **`output: "standalone"`** — expected by the adapter's `createServerBundle`
  (it reads `.next/standalone`), do not remove it.
- **No `runtime = "edge"`** exports anywhere in the app (get-started step 9).
- **next/image** — 23 files use it, only 3 pass `unoptimized`. Without an
  `IMAGES` binding, `/_next/image` **degrades gracefully** (adapter template
  logs `env.IMAGES binding is not defined` and returns the original image);
  with the binding set but Image Transformations disabled on the account it
  fails hard. The binding is left commented in `wrangler.jsonc` until Image
  Transformations is enabled — flip it on, then redeploy.
- **tag cache / queue** — the adapter's `dummy` defaults are fine: the app
  never calls `revalidateTag`/`revalidatePath`. Revisit only if ISR with
  tags/`on-demand revalidation` is added (needs Durable Objects + DO queue).
- **`.dev.vars` / `.wrangler/`** — gitignored so local `preview:cf` secrets
  can't be committed.
- **Env vars** — the adapter reads config from `open-next.config.ts`; keep
  runtime secrets in the dashboard/`wrangler secret put`, never in the repo.

### wrangler.jsonc fast-check (CI)

`scripts/check-wrangler-jsonc.mjs` is a zero-dependency Node script that
validates `apps/frontend/wrangler.jsonc` in ~1 second — before any build runs.
It exists because an empty `"images": {}` once failed wrangler's config parse
~1s into a 3-minute OpenNext build with an opaque
`binding should have a string "binding" field`.

It checks: JSONC syntax (comments + trailing commas, like wrangler's parser),
string `binding` on every binding-carrying block, duplicate binding names,
`WORKER_SELF_REFERENCE.service === name` (the PR-preview `sed` rewrite
depends on it), and warns on a `compatibility_date` older than ~6 months.
With `--post-build` (run in CI after the OpenNext build) it also verifies the
worker bundle exists and is non-trivial, `_next/static` was emitted, and
declared R2/service bindings are actually referenced by the generated bundle.

- CI wiring: `ci.yml` verify, `cloudflare-deploy.yml` (pre-build and
  post-build), and the preview deploy step (validates the rewritten preview
  config before deploying).
- Tests: `scripts/check-wrangler-jsonc.test.mjs` (`pnpm test:scripts`,
  Node's built-in runner) — 18 cases including the `images: {}` regression
  and a drift guard asserting the real config still passes.

### Pull-request previews (Cloudflare)

`.github/workflows/cloudflare-preview.yml` deploys a preview Worker per PR
and comments the workers.dev URL on the PR. Same repo secrets as the main
deploy path (`CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID`); nothing runs
until they exist, so PRs stay green without credentials.

- Preview Workers are named `champey-frontend-pr-<num>` — a temp wrangler
  config rewrites both the worker name and the `WORKER_SELF_REFERENCE`
  binding, so preview self-fetches never touch the production Worker.
- ISR cache entries are isolated via `NEXT_INC_CACHE_R2_PREFIX=pr-<num>`
  inside the shared `champey-isr-cache` bucket.
- Runtime secrets (`DATABASE_URL`, `CLERK_*`, `JWT_SECRET`, `AUTH_SECRET`)
  are forwarded to the preview only if they exist as repo secrets **and**
  the PR is from a same-repo branch (fork PRs never receive secrets and run
  in guest mode).
- The preview Worker is deleted when the PR closes (REST call, no
  interactive prompt).

## Target topology

One host runs the whole platform behind nginx:

```
                 ┌───────────────────────── host ─────────────────────────┐
  internet ─ 80/443 ─ nginx (docker/nginx) ──┬─ frontend (Next.js :3000)  │
                                             ├─ admin    (Next.js :3001)  │
                                             └─ backend  (NestJS  :4000)  │
                                             postgres / minio / redis /   │
                                             meilisearch (+ monitoring/    │
                                             backup profiles, optional)   │
                 └────────────────────────────────────────────────────────┘
```

- `docker/compose.prod.yml` — the production composition (builds the three app
  images from each app's Dockerfile; stock images for postgres/minio/redis/meili).
- `docker/nginx/default.conf` — routes `champey.com`, `www.`, `admin.`, `api.`
  subdomains; TLS certs are generated by `docker/nginx/ssl/generate-letsencrypt.sh`
  (or `generate-selfsigned.sh`).
- `docker/compose.prod.yml --profile monitoring` — Prometheus/Grafana/Loki.
- `docker/compose.prod.yml --profile backup` — nightly backup cron container.

## Secrets inventory

### Host secrets — `docker/.env`
Copy `docker/.env.example` → `docker/.env` and fill in (never commit):

| Variable | Used by |
|---|---|
| `POSTGRES_PASSWORD` | postgres, backend `DATABASE_URL` |
| `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` | minio, backend `MINIO_*` |
| `REDIS_PASSWORD` | redis, backend `REDIS_URL` |
| `MEILI_MASTER_KEY` | meilisearch, backend `MEILI_API_KEY` |
| `AUTH_SECRET` / `JWT_SECRET` | backend (also root `.env`) |
| `CLERK_SECRET_KEY` | backend auth (optional if Clerk unused) |
| `CORS_ORIGIN` | backend CORS |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | first-boot seed |
| `METRICS_TOKEN` | `/metrics` endpoint |

### App build secrets — root `.env`
Copy `.env.example` → `.env` for `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`,
`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, etc. These bake into the
frontend/admin images at build time.

### GitHub Actions secrets
The CI deploy jobs are inert until these exist (see "CI wiring" below):

| Secret | Consumed by | Purpose |
|---|---|---|
| `DOCKER_USERNAME`, `DOCKER_PASSWORD` | ci.yml `docker` + docker-build.yml `build` | Push images to `docker.io/creative-hub554/compusmarket-{backend,frontend,admin}` |
| `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL` | ci.yml `docker` (frontend build args) | Correct runtime URLs in the pushed frontend image |
| `DEPLOY_HOST` | ci.yml `deploy-*` + docker-build.yml `deploy` | SSH target for the deploy step (runs compose stack) |
| `DEPLOY_USER` | same | SSH user on the host |
| `DEPLOY_SSH_KEY` | same | Private key (PEM) for `ssh`; public key installed in host `~/.ssh/authorized_keys` |

## Manual runbook (fresh host)

1. **Provision** an Ubuntu 24.04+ host with Docker Engine + compose plugin, and
   open ports 80/443 in its security group/firewall.
2. **Clone** the repo to the canonical path used by the deploy steps:
   ```bash
   sudo install -d -o "$USER" /srv/champey
   git clone https://github.com/Creative-hub554/CompusMarket.git /srv/champey
   cd /srv/champey
   ```
3. **Populate secrets** (see inventory above):
   ```bash
   cp docker/.env.example docker/.env   # edit with strong values
   cp .env.example .env                 # app build secrets
   ```
4. **Install the deploy key** if CI deploys from GitHub:
   ```bash
   # On the host: append the CI public key (derived from DEPLOY_SSH_KEY) to ~/.ssh/authorized_keys
   ```
5. **Build and start**:
   ```bash
   docker compose -f docker/compose.prod.yml build --pull
   docker compose -f docker/compose.prod.yml up -d
   docker compose -f docker/compose.prod.yml ps
   ```
   First boot runs `backend-db-init` (Prisma `db push` + idempotent seed).
6. **TLS**: `docker/nginx/ssl/generate-letsencrypt.sh` (certbot) or
   `generate-selfsigned.sh`; nginx mounts `docker/nginx/ssl` read-only, then
   reload nginx:
   ```bash
   docker compose -f docker/compose.prod.yml exec nginx nginx -s reload
   ```
7. **Verify**:
   ```bash
   curl -fsS https://champey.com/en/feed
   curl -fsS https://api.champey.com/api/health
   curl -fsS https://admin.champey.com
   ```
8. **Optional profiles**: `docker compose -f docker/compose.prod.yml --profile monitoring up -d`
   and `--profile backup up -d`.

## Upgrading / rolling back

- Upgrade: `git pull --ff-only origin main && docker compose -f docker/compose.prod.yml build --pull && docker compose -f docker/compose.prod.yml up -d`
- Rollback: `git checkout <previous-sha> && docker compose -f docker/compose.prod.yml build && docker compose -f docker/compose.prod.yml up -d`

## CI wiring

The deploy steps in `.github/workflows/ci.yml` (`deploy-staging`,
`deploy-production`) and `.github/workflows/docker-build.yml` (`deploy`) run a
gated SSH deploy: they trigger on `push` to `develop`/`main`, and inside the
script they exit 0 with a skip message while `DEPLOY_HOST` is unset — so CI
stays green until a host is configured. Once `DEPLOY_HOST`/`DEPLOY_USER`/
`DEPLOY_SSH_KEY` are added, the step runs:

```bash
ssh -i ~/.ssh/deploy_key "${DEPLOY_USER}@${DEPLOY_HOST}" bash -s <<'EOS'
cd /srv/champey
git pull --ff-only origin main
docker compose -f docker/compose.prod.yml build --pull
docker compose -f docker/compose.prod.yml up -d
docker compose -f docker/compose.prod.yml ps
EOS
```

Sequence of required steps to go live, in order:

1. Add `DOCKER_USERNAME`/`DOCKER_PASSWORD` (+ `NEXT_PUBLIC_*`) → CI pushes images.
2. Provision the host per the runbook above; install the SSH public key.
3. Add `DEPLOY_HOST`/`DEPLOY_USER`/`DEPLOY_SSH_KEY` → deploy jobs start
   deploying on `main`/`develop` pushes.