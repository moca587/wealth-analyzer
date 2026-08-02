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

// ─────────────────────────────────────────────────────────────────────────────
// Fund-universe invariants
//
// fund-universe.js is the CANONICAL source; inject-universe.pl copies it into
// admin.html and wealth-analyzer.html, and a separate step syncs the Avaloq
// edition. Nothing else checks that the copies agree, or that the data itself
// is coherent — and the failure mode here is not a crash but a plausible wrong
// number reaching a client's proposal, so it is worth asserting explicitly.
// ─────────────────────────────────────────────────────────────────────────────
function loadUniverse(text, globalName) {
  const start = text.indexOf(`const ${globalName} = [`);
  if (start < 0) return null;
  const enrich = /function\s+\w*[eE]nrich\w*\s*\(\)/.exec(text.slice(start));
  if (!enrich) return null;
  const end = text.indexOf("})();", start + enrich.index);
  if (end < 0) return null;
  const body = text.slice(start, end + "})();".length);
  // The block is self-contained data + a pure enrichment pass over it.
  return Function(`"use strict";${body};return ${globalName};`)();
}

{
  const APP = "fund-universe";
  const canonical = loadUniverse(readFileSync(p("fund-universe.js"), "utf8"), "FUND_UNIVERSE");
  if (!canonical) {
    fail(APP, "could not evaluate FUND_UNIVERSE from fund-universe.js");
  } else {
    // 1. No duplicate tickers. A collision silently shadows one fund: the
    //    universe still looks the right size while a real fund is unreachable.
    const seen = new Map();
    const dupes = [];
    for (const f of canonical) {
      if (seen.has(f.tkr)) dupes.push(f.tkr);
      seen.set(f.tkr, f);
    }
    if (dupes.length) fail(APP, `duplicate ticker(s): ${[...new Set(dupes)].join(", ")}`);

    // 2. Every fund is fully enriched. A NaN here propagates into the Monte
    //    Carlo and into the blended portfolio metrics on a client proposal.
    const numeric = ["mu", "sigma", "beta", "sharpe", "maxDD", "aum", "holdings", "te", "er", "yld"];
    const broken = canonical.filter((f) => numeric.some((k) => !Number.isFinite(f[k])));
    if (broken.length) fail(APP, `${broken.length} fund(s) with non-finite metrics, e.g. ${broken.slice(0, 3).map((f) => f.tkr).join(", ")}`);
    const badSigma = canonical.filter((f) => f.sigma <= 0);
    if (badSigma.length) fail(APP, `${badSigma.length} fund(s) with non-positive sigma: ${badSigma.slice(0, 3).map((f) => f.tkr).join(", ")}`);

    // 3. Hedged share classes must carry the SAME Sharpe as their base class.
    //    Hedging swaps one currency's risk-free for another and leaves excess
    //    return alone (covered interest parity), so a gap here means either the
    //    hedged mu no longer nets the true hedge carry or the currency-aware
    //    risk-free table drifted — both of which would quietly mis-rank the
    //    hedged line against its own base.
    const families = new Map();
    for (const f of canonical) if (f.family) {
      if (!families.has(f.family)) families.set(f.family, []);
      families.get(f.family).push(f);
    }
    const sharpeGaps = [];
    for (const [fam, members] of families) {
      const lo = Math.min(...members.map((m) => m.sharpe));
      const hi = Math.max(...members.map((m) => m.sharpe));
      if (hi - lo > 0.01) sharpeGaps.push(`${fam} (${lo}–${hi})`);
    }
    if (sharpeGaps.length) fail(APP, `share classes of one fund disagree on Sharpe: ${sharpeGaps.join("; ")}`);

    // 4. Every share-class family must declare exactly one currency per member,
    //    or the dedup has nothing to prefer between them.
    const ccyDupes = [];
    for (const [fam, members] of families) {
      const ccys = members.map((m) => (m.ccy || "USD").toUpperCase());
      if (new Set(ccys).size !== ccys.length) ccyDupes.push(fam);
    }
    if (ccyDupes.length) fail(APP, `share-class family with two members in the same currency: ${ccyDupes.join(", ")}`);

    if (!errors.some((e) => e.includes(APP))) {
      ok(`fund universe: ${canonical.length} funds, no duplicates, all enriched, ${families.size} share-class families Sharpe-consistent`);
    }

    // 5. The injected copies must match the canonical file exactly. Drift here
    //    is how an app ships a universe the release notes do not describe.
    const key = (u) => u.map((f) => [f.tkr, f.cls, f.er, f.yld, f.mu, f.sigma, f.beta, f.sharpe, f.ccy || "", f.family || ""].join(":")).sort().join("|");
    const canonKey = key(canonical);
    for (const [file, globalName] of [
      ["admin.html", "FUND_UNIVERSE"],
      ["wealth-analyzer.html", "AI_FUND_UNIVERSE"],
      ["wealth-analyzer-avaloq.html", "AI_FUND_UNIVERSE"],
    ]) {
      const u = loadUniverse(readFileSync(p(file), "utf8"), globalName);
      if (!u) { fail(APP, `could not evaluate ${globalName} from ${file}`); continue; }
      if (u.length !== canonical.length) fail(APP, `${file} has ${u.length} funds, canonical has ${canonical.length} — re-run inject-universe.pl`);
      else if (key(u) !== canonKey) fail(APP, `${file} fund data differs from fund-universe.js — re-run inject-universe.pl`);
      else ok(`${file}: universe matches fund-universe.js (${u.length} funds)`);
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
