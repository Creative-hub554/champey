/**
 * Black-box tests for scripts/check-wrangler-jsonc.mjs using Node's built-in
 * test runner (no dependencies — the script itself must stay zero-dep, and
 * `scripts/` sits outside every vitest workspace project, so vitest never
 * picks files up here).
 *
 * Each case spawns the checker against a fixture config (and, for --post-build,
 * a fake .open-next tree) and asserts the exit code and the ::error/::warning
 * annotations it emits.
 *
 * Run: node --test scripts/check-wrangler-jsonc.test.mjs
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const CHECKER = fileURLToPath(new URL("./check-wrangler-jsonc.mjs", import.meta.url));
const REPO_ROOT = fileURLToPath(new URL("..", import.meta.url));
const WORKER = "champey-frontend";

function makeFixtureDir() {
  return mkdtempSync(join(tmpdir(), "wrangler-check-"));
}

/** Runs the checker; returns { status, stdout, stderr }. */
function runChecker(args) {
  try {
    const stdout = execFileSync(process.execPath, [CHECKER, ...args], {
      encoding: "utf8",
      cwd: REPO_ROOT,
    });
    return { status: 0, stdout, stderr: "" };
  } catch (err) {
    return { status: err.status ?? 1, stdout: err.stdout ?? "", stderr: err.stderr ?? "" };
  }
}

/** Builds a fake OpenNext output tree next to a wrangler.jsonc fixture. */
function makePostBuildFixture({ workerBytes = 24 * 1024, withNextStatic = true, workerBody = "" } = {}) {
  const dir = makeFixtureDir();
  mkdirSync(join(dir, ".open-next", "assets"), { recursive: true });
  if (withNextStatic) {
    mkdirSync(join(dir, ".open-next", "assets", "_next", "static"), { recursive: true });
    writeFileSync(join(dir, ".open-next", "assets", "_next", "static", "chunk.abc123.js"), "1;");
  }
  // Realistic bundle: > 10KB and references the R2 binding unless told not to.
  const content =
    workerBody ||
    `export default { fetch() {} };\n// env.NEXT_INC_CACHE_R2_BUCKET.get(key)\n`.repeat(
      Math.ceil(workerBytes / 60)
    );
  writeFileSync(join(dir, ".open-next", "worker.js"), content);
  const config = `{
  "name": "${WORKER}",
  "main": ".open-next/worker.js",
  "compatibility_date": "2026-08-01",
  "assets": { "directory": ".open-next/assets", "binding": "ASSETS" },
  "services": [{ "binding": "WORKER_SELF_REFERENCE", "service": "${WORKER}" }],
  "r2_buckets": [{ "binding": "NEXT_INC_CACHE_R2_BUCKET", "bucket_name": "b" }]
}
`;
  const file = join(dir, "wrangler.jsonc");
  writeFileSync(file, config);
  return { dir, file };
}

function cleanup(dir) {
  rmSync(dir, { recursive: true, force: true });
}

const VALID_CONFIG = `{
  // comments must be tolerated
  "name": "${WORKER}",
  "main": ".open-next/worker.js",
  "compatibility_date": "2026-08-01",
  "compatibility_flags": ["nodejs_compat"],
  "assets": { "directory": ".open-next/assets", "binding": "ASSETS" },
  "services": [{ "binding": "WORKER_SELF_REFERENCE", "service": "${WORKER}" }],
  "r2_buckets": [{ "binding": "NEXT_INC_CACHE_R2_BUCKET", "bucket_name": "b" }]
}
`;

function makeConfigFixture(body) {
  const dir = makeFixtureDir();
  const file = join(dir, "wrangler.jsonc");
  writeFileSync(file, body);
  return { dir, file };
}

test("valid production-style config passes with no annotations", () => {
  const { dir, file } = makeConfigFixture(VALID_CONFIG);
  try {
    const { status, stdout, stderr } = runChecker([file]);
    assert.equal(status, 0);
    assert.match(stdout, /✓/);
    assert.ok(!stdout.includes("::error::"), "no ::error expected");
    assert.ok(!stdout.includes("::warning::"), "no ::warning expected");
    assert.equal(stderr, "");
  } finally {
    cleanup(dir);
  }
});

test("the images:{} regression fails with the actionable message", () => {
  const { dir, file } = makeConfigFixture(
    VALID_CONFIG.replace(/\}\n$/, `,\n  "images": {}\n}\n`)
  );
  try {
    const { status, stdout } = runChecker([file]);
    assert.equal(status, 1);
    assert.match(stdout, /::error::.*`images` entry is missing a string "binding" field/);
    assert.match(stdout, /remove the whole `images` block/);
  } finally {
    cleanup(dir);
  }
});

test("binding entry missing the binding field fails", () => {
  const { dir, file } = makeConfigFixture(
    VALID_CONFIG.replace(
      /"r2_buckets": \[\{ "binding": "NEXT_INC_CACHE_R2_BUCKET", "bucket_name": "b" \}\]/,
      `"r2_buckets": [{ "bucket_name": "b" }]`
    )
  );
  try {
    const { status, stdout } = runChecker([file]);
    assert.equal(status, 1);
    assert.match(stdout, /::error::.*r2_buckets\[0\].*missing a string "binding"/);
  } finally {
    cleanup(dir);
  }
});

test("WORKER_SELF_REFERENCE pointing at another worker fails", () => {
  const { dir, file } = makeConfigFixture(
    VALID_CONFIG.replace(`"name": "${WORKER}"`, `"name": "${WORKER}-pr-7"`)
  );
  try {
    const { status, stdout } = runChecker([file]);
    assert.equal(status, 1);
    assert.match(stdout, /::error::.*WORKER_SELF_REFERENCE points at/);
    assert.match(stdout, /must match/);
  } finally {
    cleanup(dir);
  }
});

test("duplicate binding names across blocks fail", () => {
  const { dir, file } = makeConfigFixture(
    VALID_CONFIG.replace(
      /"r2_buckets": \[\{ "binding": "NEXT_INC_CACHE_R2_BUCKET", "bucket_name": "b" \}\]/,
      `"kv_namespaces": [{ "binding": "DUP", "id": "x" }],\n  "r2_buckets": [{ "binding": "DUP", "bucket_name": "b" }]`
    )
  );
  try {
    const { status, stdout } = runChecker([file]);
    assert.equal(status, 1);
    assert.match(stdout, /::error::.*duplicate binding name "DUP"/);
  } finally {
    cleanup(dir);
  }
});

test("invalid JSONC syntax fails with a syntax message", () => {
  const { dir, file } = makeConfigFixture("{ not json at all ]]");
  try {
    const { status, stdout } = runChecker([file]);
    assert.equal(status, 1);
    assert.match(stdout, /::error::.*invalid JSONC syntax/);
  } finally {
    cleanup(dir);
  }
});

test("missing required top-level fields fail", () => {
  const { dir, file } = makeConfigFixture(`{ "compatibility_date": "2026-08-01" }`);
  try {
    const { status, stdout } = runChecker([file]);
    assert.equal(status, 1);
    assert.match(stdout, /::error::.*"name" must be a non-empty string/);
    assert.match(stdout, /::error::.*"main" must be a non-empty string/);
  } finally {
    cleanup(dir);
  }
});

test("stale compatibility_date is a non-fatal warning (exit 0)", () => {
  const { dir, file } = makeConfigFixture(
    VALID_CONFIG.replace(`"compatibility_date": "2026-08-01"`, `"compatibility_date": "2024-12-30"`)
  );
  try {
    const { status, stdout } = runChecker([file]);
    assert.equal(status, 0);
    assert.match(stdout, /::warning::.*more than 6 months old/);
    assert.match(stdout, /✓/);
  } finally {
    cleanup(dir);
  }
});

test("trailing commas are tolerated like wrangler's parser", () => {
  const { dir, file } = makeConfigFixture(
    VALID_CONFIG.replace(
      /"r2_buckets": \[\{ "binding": "NEXT_INC_CACHE_R2_BUCKET", "bucket_name": "b" \}\]/,
      `"r2_buckets": [{ "binding": "NEXT_INC_CACHE_R2_BUCKET", "bucket_name": "b", },]`
    )
  );
  try {
    const { status, stdout } = runChecker([file]);
    assert.equal(status, 0);
    assert.match(stdout, /✓/);
  } finally {
    cleanup(dir);
  }
});

test("missing file fails with a readable error", () => {
  const dir = makeFixtureDir();
  const gone = join(dir, "nope.jsonc");
  try {
    const { status, stdout } = runChecker([gone]);
    assert.equal(status, 1);
    assert.match(stdout, /::error::.*(ENOENT|no such file|No such file)/i);
  } finally {
    cleanup(dir);
  }
});

// ---------------------------------------------------------------------------
// --post-build mode
// ---------------------------------------------------------------------------

test("post-build passes on a realistic .open-next tree", () => {
  const { dir, file } = makePostBuildFixture();
  try {
    const { status, stdout } = runChecker(["--post-build", file]);
    assert.equal(status, 0, `expected pass:\n${stdout}`);
    assert.match(stdout, /✓/);
    assert.ok(!stdout.includes("::error::"), `no ::error expected:\n${stdout}`);
  } finally {
    cleanup(dir);
  }
});

test("post-build fails when the worker bundle is missing", () => {
  const { dir, file } = makePostBuildFixture();
  rmSync(join(dir, ".open-next", "worker.js"));
  try {
    const { status, stdout } = runChecker(["--post-build", file]);
    assert.equal(status, 1);
    assert.match(stdout, /::error::.*did not produce a worker bundle/);
  } finally {
    cleanup(dir);
  }
});

test("post-build fails on a truncated (undersized) worker bundle", () => {
  const { dir, file } = makePostBuildFixture({ workerBytes: 100 });
  try {
    const { status, stdout } = runChecker(["--post-build", file]);
    assert.equal(status, 1);
    assert.match(stdout, /::error::.*not a real worker bundle/);
  } finally {
    cleanup(dir);
  }
});

test("post-build fails when _next/static is missing from assets", () => {
  const { dir, file } = makePostBuildFixture({ withNextStatic: false });
  try {
    const { status, stdout } = runChecker(["--post-build", file]);
    assert.equal(status, 1);
    assert.match(stdout, /::error::.*no _next\/static/);
  } finally {
    cleanup(dir);
  }
});

test("post-build warns when a declared R2 binding is not referenced by the bundle", () => {
  const { dir, file } = makePostBuildFixture({
    workerBody: `export default { fetch() {} };\n`.repeat(1000), // >10KB, no binding ref
  });
  try {
    const { status, stdout } = runChecker(["--post-build", file]);
    assert.equal(status, 0, "binding-reference miss is a warning, not an error");
    assert.match(stdout, /::warning::.*"NEXT_INC_CACHE_R2_BUCKET" is declared in the config but never referenced/);
  } finally {
    cleanup(dir);
  }
});

test("post-build fails when the assets directory is missing entirely", () => {
  const { dir, file } = makePostBuildFixture();
  rmSync(join(dir, ".open-next", "assets"), { recursive: true, force: true });
  try {
    const { status, stdout } = runChecker(["--post-build", file]);
    assert.equal(status, 1);
    assert.match(stdout, /::error::.*were\s+not emitted|::error::.*does not exist/);
  } finally {
    cleanup(dir);
  }
});

// ---------------------------------------------------------------------------
// Repo drift guards
// ---------------------------------------------------------------------------

test("the real apps/frontend/wrangler.jsonc passes (guards against config drift)", () => {
  const real = fileURLToPath(new URL("../apps/frontend/wrangler.jsonc", import.meta.url));
  const { status, stdout } = runChecker([real]);
  assert.equal(status, 0, `real config should pass:\n${stdout}`);
  assert.match(stdout, /✓/);
});

test("default invocation (no args) validates the repo's frontend config", () => {
  const { status, stdout } = runChecker([]);
  assert.equal(status, 0, `default run should pass:\n${stdout}`);
  assert.match(stdout, /apps\/frontend\/wrangler\.jsonc/);
});
