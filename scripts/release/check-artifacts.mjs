#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// check-artifacts.mjs — validates the generated legacy artifacts against their
// sources, WITHOUT rebuilding. Catches the failure modes that have actually
// bitten this repo:
//   • APP_VERSION drift between source / version file / standalone
//     (the class of bug that caused the live auto-reload loop)
//   • a standalone that still points at an external CDN/font (breaks the
//     offline guarantee)
//   • a standalone that lost its embedded data blocks (COUNTRY_ACCOUNTS /
//     FUND_UNIVERSE) or came out implausibly small
//
// Exit 0 = all good; exit 1 = at least one problem. Safe to run in CI.
// ─────────────────────────────────────────────────────────────────────────────

import { readFileSync, existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const p = (f) => join(ROOT, f);

// Each app: which source it's built from, the standalone it produces, the
// version file that must agree with both, a size floor, and whether it embeds
// the data blocks.
const APPS = [
  { name: "Wealth Analyzer",          source: "wealth-analyzer.html",          standalone: "wealth-analyzer-standalone.html",          versionFile: "version.json",         minBytes: 2_000_000, requireData: true },
  { name: "Wealth Analyzer (Avaloq)", source: "wealth-analyzer-avaloq.html",   standalone: "wealth-analyzer-avaloq-standalone.html",   versionFile: "version-avaloq.json",  minBytes: 2_000_000, requireData: true },
  { name: "Admin",                    source: "admin.html",                    standalone: "admin-standalone.html",                    versionFile: "version.json",         minBytes:   200_000, requireData: false },
];

const VENDOR = ["chart.min.js", "jspdf.min.js", "autotable.min.js", "pdf.min.js", "pdf.worker.min.js"];

const APP_VERSION_RE = /const\s+APP_VERSION\s*=\s*"([^"]*)"/;
const VERSION_FMT_RE = /^\d{8}-\d{4}$/;

// LIVE external references only — a bare "cdnjs.cloudflare.com" substring also
// appears inside minified vendor code as a fallback string, which is harmless.
// We flag actual loadable <script src> / <link href> tags and a CDN workerSrc.
const LIVE_CDN_SCRIPT = /<script\b[^>]*\bsrc\s*=\s*"https:\/\/cdnjs\.cloudflare\.com[^"]*"/i;
const LIVE_FONT_LINK  = /<link\b[^>]*\bhref\s*=\s*"https:\/\/fonts\.googleapis\.com[^"]*"/i;
const CDN_WORKER      = /workerSrc\s*=\s*"https:\/\/cdnjs\.cloudflare\.com[^"]*"/i;

const errors = [];
const notes = [];
const fail = (app, msg) => errors.push(`✗ [${app}] ${msg}`);
const ok = (msg) => notes.push(`✓ ${msg}`);

function appVersion(text) {
  const m = text.match(APP_VERSION_RE);
  return m ? m[1] : null;
}

// ── Vendor files present (the builds inline these) ──
for (const v of VENDOR) {
  if (!existsSync(p(join("vendor", v)))) fail("vendor", `missing vendor/${v} — standalone build cannot inline it`);
}
if (!errors.length) ok(`vendor/ has all ${VENDOR.length} required libraries`);

// ── Per-app checks ──
for (const app of APPS) {
  const srcPath = p(app.source), stPath = p(app.standalone), verPath = p(app.versionFile);

  for (const [label, path] of [["source", srcPath], ["standalone", stPath], ["version file", verPath]]) {
    if (!existsSync(path)) fail(app.name, `${label} not found: ${app === APPS[0] ? app.source : path.replace(ROOT, "").replace(/^[\\/]/, "")}`);
  }
  if (!existsSync(srcPath) || !existsSync(stPath) || !existsSync(verPath)) continue;

  const src = readFileSync(srcPath, "utf8");
  const st = readFileSync(stPath, "utf8");

  // Version file parses and is well-formed
  let ver;
  try { ver = JSON.parse(readFileSync(verPath, "utf8")); }
  catch { fail(app.name, `${app.versionFile} is not valid JSON`); continue; }
  if (!ver.version || !VERSION_FMT_RE.test(ver.version)) fail(app.name, `${app.versionFile} version "${ver.version}" is missing or not YYYYMMDD-HHMM`);
  if (!ver.builtAt) fail(app.name, `${app.versionFile} is missing builtAt`);
  if (!ver.channel) fail(app.name, `${app.versionFile} is missing channel`);

  // The crown-jewel check: source APP_VERSION === version file === standalone.
  const srcV = appVersion(src), stV = appVersion(st);
  if (!srcV) fail(app.name, `no APP_VERSION constant in ${app.source}`);
  if (!stV) fail(app.name, `no APP_VERSION constant in ${app.standalone}`);
  if (srcV && stV && ver.version) {
    if (srcV !== ver.version) fail(app.name, `source APP_VERSION (${srcV}) ≠ ${app.versionFile} (${ver.version}) — rebuild, or the live poller will loop`);
    if (stV !== ver.version) fail(app.name, `standalone APP_VERSION (${stV}) ≠ ${app.versionFile} (${ver.version}) — stale standalone, rebuild`);
    if (srcV === ver.version && stV === ver.version) ok(`${app.name}: versions aligned (${ver.version})`);
  }

  // Standalone must be self-contained (offline).
  if (LIVE_CDN_SCRIPT.test(st)) fail(app.name, `standalone has a live <script src="cdnjs…"> — not offline-safe`);
  if (LIVE_FONT_LINK.test(st)) fail(app.name, `standalone has a live Google Fonts <link> — not offline-safe`);
  if (CDN_WORKER.test(st)) fail(app.name, `standalone pdf workerSrc still points at cdnjs — worker won't load offline`);

  // Plausible size (fully-vendored files are multi-MB; a tiny one lost its inlines).
  const bytes = statSync(stPath).size;
  if (bytes < app.minBytes) fail(app.name, `standalone is ${(bytes / 1024).toFixed(0)}KB, below the ${(app.minBytes / 1024).toFixed(0)}KB floor — probably lost its vendored blocks`);

  // Embedded data blocks survived the build.
  if (app.requireData) {
    for (const block of ["COUNTRY_ACCOUNTS", "FUND_UNIVERSE"]) {
      if (!src.includes(block)) fail(app.name, `source is missing ${block}`);
      if (!st.includes(block)) fail(app.name, `standalone is missing ${block} — data block dropped in build`);
    }
  }
}

// ── Report ──
console.log("\nArtifact validation\n" + "─".repeat(50));
for (const n of notes) console.log("  " + n);
if (errors.length) {
  console.log("\n" + "─".repeat(50));
  for (const e of errors) console.log("  " + e);
  console.error(`\n${errors.length} problem(s) found. Run \`npm run legacy:build\` to regenerate, then re-check.\n`);
  process.exit(1);
}
console.log("\nAll artifacts valid — sources, version files, and standalones are in sync.\n");
