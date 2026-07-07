#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// build-legacy.mjs — one command to regenerate every legacy standalone
// artifact from source, in the right order, via the existing Perl builders.
//
//   node scripts/release/build-legacy.mjs
//
// Order matters: the main build owns admin-standalone and writes version.json;
// the Avaloq build writes version-avaloq.json. Running main first keeps admin
// consistent with version.json. After building, it runs check-artifacts so a
// broken build fails loudly instead of committing a stale/mismatched file.
//
// Requires Perl on PATH (Strawberry/Git-for-Windows on Windows, system perl on
// Linux/macOS). If Perl is unavailable this exits non-zero with a clear message
// rather than silently skipping.
// ─────────────────────────────────────────────────────────────────────────────

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

function run(cmd, args, label) {
  console.log(`\n▶ ${label}\n  ${cmd} ${args.join(" ")}`);
  const r = spawnSync(cmd, args, { cwd: ROOT, stdio: "inherit", shell: false });
  if (r.error) {
    if (r.error.code === "ENOENT") {
      console.error(`\n✗ '${cmd}' not found on PATH. Install Perl (Strawberry Perl on Windows) and retry.`);
      process.exit(2);
    }
    console.error(`\n✗ ${label} failed to start: ${r.error.message}`);
    process.exit(2);
  }
  if (r.status !== 0) {
    console.error(`\n✗ ${label} exited with code ${r.status}`);
    process.exit(r.status || 1);
  }
}

// Perl builders, in dependency order.
const BUILDERS = [
  { file: "build-standalone.pl",        label: "Main app + admin standalone" },
  { file: "build-standalone-avaloq.pl", label: "Avaloq edition standalone" },
];

for (const b of BUILDERS) {
  if (!existsSync(join(ROOT, b.file))) {
    console.error(`\n✗ missing builder ${b.file}`);
    process.exit(2);
  }
  run("perl", [b.file], b.label);
}

// Validate what we just produced.
run(process.execPath, [join(ROOT, "scripts", "release", "check-artifacts.mjs")], "Validate artifacts");

console.log("\n✓ Legacy artifacts rebuilt and validated.\n");
