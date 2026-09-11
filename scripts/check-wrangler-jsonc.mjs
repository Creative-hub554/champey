#!/usr/bin/env node
/**
 * Lightweight JSONC + schema check for wrangler.jsonc — no dependencies.
 *
 * Why this exists: wrangler validates its config deep inside the OpenNext
 * build (`opennextjs-cloudflare build` → readConfig), so a malformed binding
 * used to fail a 3-minute CI build ~1 second in with an opaque
 * "binding should have a string \"binding\" field" (regression: an empty
 * "images": {} placeholder). This check runs BEFORE the build and fails fast
 * with actionable messages.
 *
 * Checks:
 *   1. JSONC parses (comments + trailing commas tolerated, like wrangler).
 *   2. Every binding-carrying block (assets, services, r2_buckets,
 *      kv_namespaces, d1_databases, durable_objects.bindings, queues,
 *      hyperdrive, vectorize, mtls_certificates, images, browser, ai, analytics_engine_datasets)
 *      has a string "binding" — mirroring wrangler's own validation.
 *   3. images is either absent or a non-empty object with a string binding
 *      (the exact regression this script was written for).
 *   4. Consistency wrangler doesn't check clearly:
 *        - WORKER_SELF_REFERENCE.service must equal the worker "name"
 *          (OpenNext internal self-fetches would otherwise target the
 *          wrong Worker — the PR-preview rewrite depends on this).
 *        - no duplicate binding names across blocks.
 *        - compatibility_date present and not older than ~6 months
 *          (the adapter warns at build time; here it is an explicit note).
 *
 * Post-build mode (--post-build): additionally verifies the artifacts the
 * OpenNext build produced (".open-next") match the config — the bootstrap
 * worker and the real server bundle (server-functions/default) exist and are
 * non-trivial, static assets were emitted, and declared R2/service bindings
 * are actually referenced by the generated server chunks (an unreferenced R2
 * cache binding usually means the open-next.config.ts override is not wired).
 *
 * Usage: node scripts/check-wrangler-jsonc.mjs [--post-build] [paths...]
 *        (default path: apps/frontend/wrangler.jsonc)
 * Exit 0 = all checks pass; exit 1 with ::error annotations = failure.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(scriptDir); // scripts/ lives at the repo root

const argv = process.argv.slice(2);
const postBuild = argv.includes("--post-build");
const pathArgs = argv.filter((a) => a !== "--post-build");
// No explicit paths: default to the repo-root-relative frontend config no
// matter where the script is invoked from. Explicit args stay cwd-relative
// (e.g. the preview workflow passes wrangler.preview.jsonc from apps/frontend).
const paths =
  pathArgs.length > 0
    ? pathArgs
    : [join(relative(process.cwd(), repoRoot) || ".", "apps/frontend/wrangler.jsonc")];

// The real Next.js server lives in .open-next/server-functions/default/
// (usually MBs); the top-level worker.js is only a tiny bootstrap. Anything
// below this across the server bundle is not a real build (truncated/failed).
const MIN_SERVER_BYTES = 100 * 1024;

// ---------------------------------------------------------------------------
// Minimal JSONC parser: strips // and /* */ comments and trailing commas, then
// defers to JSON.parse for syntax validation. Good enough for wrangler config
// files; wrangler itself does the same normalize-and-parse trick internally.
// ---------------------------------------------------------------------------
function parseJsonc(source, file) {
  let out = "";
  let i = 0;
  const n = source.length;
  let inString = false;
  let stringQuote = "";
  while (i < n) {
    const ch = source[i];
    if (inString) {
      out += ch;
      if (ch === "\\") {
        // copy escape sequence verbatim (\" inside strings etc.)
        if (i + 1 < n) {
          out += source[i + 1];
          i += 2;
          continue;
        }
      } else if (ch === stringQuote) {
        inString = false;
      }
      i += 1;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inString = true;
      stringQuote = ch;
      out += ch;
      i += 1;
      continue;
    }
    if (ch === "/" && source[i + 1] === "/") {
      while (i < n && source[i] !== "\n") i += 1;
      continue;
    }
    if (ch === "/" && source[i + 1] === "*") {
      i += 2;
      while (i < n && !(source[i] === "*" && source[i + 1] === "/")) i += 1;
      i += 2;
      continue;
    }
    out += ch;
    i += 1;
  }

  // Tolerate trailing commas (JSON5-style, accepted by wrangler's parser).
  out = out.replace(/,(\s*[}\]])/g, "$1");

  try {
    return JSON.parse(out);
  } catch (err) {
    const line = err.message.match(/position (\d+)/);
    let lineNo = "?";
    if (line) {
      const upto = out.slice(0, Number(line[1]));
      lineNo = String(upto.split("\n").length);
    }
    throw new Error(
      `${file}: invalid JSONC syntax near line ${lineNo} — ${err.message}`
    );
  }
}

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------
const BINDING_BLOCKS = [
  ["assets", { object: true }],
  ["services", { array: true }],
  ["r2_buckets", { array: true }],
  ["kv_namespaces", { array: true }],
  ["d1_databases", { array: true }],
  ["durable_objects.bindings", { array: true, nested: true }],
  ["queues", { special: "queues" }],
  ["hyperdrive", { array: true }],
  ["vectorize", { array: true }],
  ["mtls_certificates", { array: true }],
  ["images", { object: true }],
  ["browser", { object: true }],
  ["ai", { object: true }],
  ["analytics_engine_datasets", { array: true }],
];

function getPath(obj, dotted) {
  return dotted.split(".").reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

const errors = [];
const warnings = [];
const seenBindingNames = new Map(); // name -> where declared

function requireStringBinding(where, entry, blockKey) {
  if (entry == null || typeof entry !== "object") {
    errors.push(`${where}: \`${blockKey}\` entry must be an object`);
    return null;
  }
  if (typeof entry.binding !== "string" || entry.binding.length === 0) {
    errors.push(
      `${where}: \`${blockKey}\` entry is missing a string "binding" field. ` +
        `If the binding is intentionally disabled, remove the whole \`${blockKey}\` block — ` +
        `do not leave it empty (e.g. \`"images": {}\` fails wrangler validation).`
    );
    return null;
  }
  const prev = seenBindingNames.get(entry.binding);
  if (prev) {
    errors.push(
      `${where}: duplicate binding name "${entry.binding}" (also declared in ${prev})`
    );
  } else {
    seenBindingNames.set(entry.binding, where);
  }
  return entry.binding;
}

for (const file of paths) {
  const abs = resolve(process.cwd(), file);
  let config;
  try {
    const raw = readFileSync(abs, "utf8");
    config = parseJsonc(raw, file);
  } catch (err) {
    errors.push(err.message);
    continue;
  }

  if (typeof config.name !== "string" || config.name.length === 0) {
    errors.push(`${file}: "name" must be a non-empty string (the Worker name)`);
  }
  if (typeof config.main !== "string" || config.main.length === 0) {
    errors.push(`${file}: "main" must be a non-empty string (the entry-point path)`);
  }
  if (typeof config.compatibility_date !== "string") {
    errors.push(`${file}: "compatibility_date" is required (e.g. "2026-08-01")`);
  } else {
    // Non-fatal note if the date drifts (the adapter warns at build time).
    const date = new Date(config.compatibility_date);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    if (!Number.isNaN(date.valueOf()) && date < sixMonthsAgo) {
      warnings.push(
        `${file}: compatibility_date "${config.compatibility_date}" is more than 6 months old — ` +
          `the OpenNext adapter logs a warning for stale dates; consider bumping it.`
      );
    }
  }

  for (const [blockKey, opts] of BINDING_BLOCKS) {
    const block = getPath(config, blockKey);
    if (block === undefined || block === null) continue;

    if (opts.special === "queues") {
      const producers = block.producers;
      const consumers = block.consumers;
      for (const [kind, list] of [
        ["producers", producers],
        ["consumers", consumers],
      ]) {
        if (!Array.isArray(list)) continue;
        for (const [idx, entry] of list.entries()) {
          requireStringBinding(`${file} ${blockKey}.${kind}[${idx}]`, entry, blockKey);
        }
      }
      continue;
    }

    if (opts.object) {
      // e.g. images / browser / ai: single object with a binding. An object
      // that carries no string binding is exactly the failure mode we hit
      // (wrangler: binding should have a string "binding" field).
      requireStringBinding(`${file} ${blockKey}`, block, blockKey);
      continue;
    }

    if (!Array.isArray(block)) {
      errors.push(`${file}: \`${blockKey}\` must be an array when present`);
      continue;
    }
    for (const [idx, entry] of block.entries()) {
      requireStringBinding(`${file} ${blockKey}[${idx}]`, entry, blockKey);
    }
  }

  // Cross-check: the OpenNext self-reference service binding must point at
  // this very Worker, or internal self-fetches target the wrong Worker.
  if (Array.isArray(config.services)) {
    const selfRef = config.services.find(
      (s) => s && s.binding === "WORKER_SELF_REFERENCE"
    );
    if (selfRef && typeof config.name === "string" && selfRef.service !== config.name) {
      errors.push(
        `${file}: services binding WORKER_SELF_REFERENCE points at "${selfRef.service}" ` +
          `but the Worker is named "${config.name}" — these must match (OpenNext ` +
          `internal self-fetches use this binding; the PR-preview sed rewrite depends on it).`
      );
    }
  }

  if (postBuild) {
    checkBuildArtifacts(file, config, dirname(abs));
  }
}

// ---------------------------------------------------------------------------
// Post-build (--post-build): config ↔ .open-next artifact consistency.
// Wrangler validates bindings at deploy time, but it cannot tell you that the
// OpenNext build silently produced no assets or an empty worker — this can.
// ---------------------------------------------------------------------------
function checkBuildArtifacts(file, config, baseDir) {
  // 1. Worker entry point + server bundle. In @opennextjs/cloudflare v1.x the
  // top-level worker.js is a ~2KB bootstrap that imports
  // ./server-functions/default/handler.mjs — the real Next.js server. The
  // size check therefore applies to the server-functions output, not the
  // bootstrap (which is small by design).
  const openNextDir =
    typeof config.main === "string" && config.main.includes("/")
      ? join(baseDir, dirname(config.main))
      : baseDir;
  if (typeof config.main === "string" && config.main.length > 0) {
    if (!existsSync(join(baseDir, config.main))) {
      errors.push(
        `${file}: main entry "${config.main}" does not exist — the OpenNext build ` +
          `did not produce a worker bundle. Run the build (pnpm --filter frontend run build:cf) before this check.`
      );
    }
  }
  const serverDir = join(openNextDir, "server-functions", "default");
  checkBuildArtifacts._serverDir = serverDir;
  checkBuildArtifacts._serverSources = [];
  if (existsSync(serverDir)) {
    let totalBytes = 0;
    const sources = [];
    for (const rel of readdirSync(serverDir, { recursive: true })) {
      const p = join(serverDir, rel);
      if (!statSync(p).isFile()) continue;
      totalBytes += statSync(p).size;
      if (!p.endsWith(".map")) sources.push(p);
    }
    if (totalBytes < MIN_SERVER_BYTES) {
      errors.push(
        `${file}: ${relative(baseDir, serverDir)} is only ${totalBytes} bytes — not a real ` +
          `server bundle (truncated or failed build).`
      );
    }
    checkBuildArtifacts._serverSources = sources;
  } else {
    errors.push(
      `${file}: ${relative(baseDir, serverDir)} does not exist — the OpenNext build ` +
        `produced no server bundle (the adapter's server-functions output is missing).`
    );
  }

  // 2. Static assets: the assets directory must exist and contain _next/static.
  const assetsDir = config.assets && typeof config.assets.directory === "string"
    ? config.assets.directory
    : null;
  if (assetsDir) {
    const dir = join(baseDir, assetsDir);
    if (!existsSync(dir) || !statSync(dir).isDirectory()) {
      errors.push(
        `${file}: assets.directory "${assetsDir}" does not exist — static assets were ` +
          `not emitted by the build (the site would deploy without JS/CSS).`
      );
    } else {
      const nextStatic = join(dir, "_next", "static");
      if (!existsSync(nextStatic)) {
        errors.push(
          `${file}: assets directory "${assetsDir}" has no _next/static — hashed Next.js ` +
            `JS/CSS chunks are missing from the bundle.`
        );
      }
    }
  }

  // 3. Binding-reference heuristic: every declared R2 bucket / service binding
  // should appear somewhere in the generated server chunks (the bootstrap
  // worker does not reference bindings directly). An unreferenced
  // NEXT_INC_CACHE_R2_BUCKET typically means open-next.config.ts no longer
  // wires the override.
  const serverSources = checkBuildArtifacts._serverSources;
  const declared = [];
  if (Array.isArray(config.r2_buckets)) {
    for (const b of config.r2_buckets) {
      if (b && typeof b.binding === "string") declared.push(b.binding);
    }
  }
  if (Array.isArray(config.services)) {
    for (const s of config.services) {
      if (s && typeof s.binding === "string" && s.binding !== "WORKER_SELF_REFERENCE") {
        declared.push(s.binding);
      }
    }
  }
  if (serverSources.length > 0 && declared.length > 0) {
    let haystack = "";
    try {
      for (const p of serverSources) haystack += readFileSync(p, "utf8") + "\n";
    } catch {
      return; // unreadable bundle: already reported above if missing/too small
    }
    for (const binding of declared) {
      if (!haystack.includes(binding)) {
        warnings.push(
          `${file}: binding "${binding}" is declared in the config but never referenced ` +
            `by the generated server bundle — if this is the incremental cache, check ` +
            `that open-next.config.ts still wires the override.`
        );
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
for (const w of warnings) console.log(`::warning::${w}`);
for (const e of errors) console.log(`::error::${e}`);

if (errors.length > 0) {
  console.error(`\n✘ ${errors.length} wrangler.jsonc problem(s) found (see above).`);
  console.error(`  Fix the config, then re-run: node scripts/check-wrangler-jsonc.mjs`);
  process.exit(1);
}

console.log(`✓ ${paths.join(", ")}: JSONC parses, all bindings valid, no duplicates.`);
if (warnings.length > 0) {
  console.log(`  (${warnings.length} warning(s) above are non-fatal.)`);
}
