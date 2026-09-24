// Screenshot the demo's tabs and components for the catalogue in
// docs/style-guide.md. Re-run it to refresh the images.
//
//   node docs/style-guide-assets/capture.mjs
//
// Drives headless Chrome over CDP, so it needs no Playwright dependency. Needs
// Node 22+ (global WebSocket), `google-chrome` on PATH (override with CHROME=...)
// and network access for the CDN scripts the demo loads.
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as sleep } from "node:timers/promises";

const OUT = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(OUT, "../..");
const PROFILE = JSON.parse(readFileSync(`${REPO}/Sample Client profiles/beatrice-keller-swiss-profile.json`, "utf8"));
mkdirSync(OUT, { recursive: true });

const port = 9333;
const chrome = spawn(process.env.CHROME || "google-chrome", [
  "--headless=new", `--remote-debugging-port=${port}`, "--no-first-run", "--no-default-browser-check",
  "--allow-file-access-from-files", "--hide-scrollbars", "--window-size=1440,900",
  `--user-data-dir=${mkdtempSync(join(tmpdir(), "wa-capture-"))}`,
  "about:blank",
], { stdio: "ignore" });

let targets;
for (let i = 0; i < 50; i++) {
  try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); break; } catch { await sleep(200); }
}
const page = targets.find(t => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener("open", r, { once: true }));
let id = 0; const pending = new Map();
ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (expr) => {
  const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.result?.exceptionDetails) throw new Error(`${expr.slice(0, 80)}: ${JSON.stringify(r.result.exceptionDetails.exception?.description)}`);
  return r.result?.result?.value;
};

await send("Page.enable"); await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
// Reduced motion so entrance animations don't catch panels half-faded.
await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
await send("Page.navigate", { url: `file://${REPO}/wealth-analyzer.html` });
for (let i = 0; i < 100; i++) { if (await evaluate("document.readyState==='complete' && typeof restoreProfile==='function' && typeof Chart!=='undefined'")) break; await sleep(200); }
await sleep(800);

await evaluate(`Chart.defaults.animation=false`);
await evaluate(`restoreProfile(${JSON.stringify(PROFILE)})`);
await sleep(300); // short: the onboarding card removes itself 2.6s after its steps are done

const shot = async (name, clip) => {
  const params = { format: "png", captureBeyondViewport: true };
  if (clip) params.clip = { ...clip, scale: 1 };
  const r = await send("Page.captureScreenshot", params);
  writeFileSync(`${OUT}/${name}.png`, Buffer.from(r.result.data, "base64"));
  console.log("wrote", name);
};
// Element clip, scrolled into view, with a small margin. Skips silently if the selector is absent/hidden.
const shotEl = async (name, sel, pad = 8) => {
  const box = await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(sel)}); if(!el) return null;
    el.scrollIntoView({block:'center'}); const r=el.getBoundingClientRect(); if(!r.width||!r.height) return null;
    return {x:r.left+scrollX, y:r.top+scrollY, width:r.width, height:r.height};})()`);
  if (!box) { console.log("skip", name, sel); return; }
  await sleep(150);
  await shot(name, { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad), width: box.width + pad * 2, height: box.height + pad * 2 });
};
// Hover the element matching `sel` (real mouse move, so :hover rules apply), then
// clip the union of it and `popSel` (the tooltip it reveals).
const shotHover = async (name, sel, popSel, pad = 10) => {
  const c = await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(sel)}); if(!el) return null;
    el.scrollIntoView({block:'center'}); const r=el.getBoundingClientRect(); return {x:r.left+r.width/2, y:r.top+r.height/2};})()`);
  if (!c) { console.log("skip", name, sel); return; }
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: c.x, y: c.y });
  await sleep(500);
  const box = await evaluate(`(()=>{const rs=[document.querySelector(${JSON.stringify(sel)}), document.querySelector(${JSON.stringify(popSel)})]
      .filter(Boolean).map(e=>e.getBoundingClientRect()).filter(r=>r.width&&r.height);
    if(rs.length<2) return null;
    const x=Math.min(...rs.map(r=>r.left)), y=Math.min(...rs.map(r=>r.top)), x2=Math.max(...rs.map(r=>r.right)), y2=Math.max(...rs.map(r=>r.bottom));
    return {x:x+scrollX, y:y+scrollY, width:x2-x, height:y2-y};})()`);
  if (!box) { console.log("skip (no popup)", name, popSel); return; }
  await shot(name, { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad), width: box.width + pad * 2, height: box.height + pad * 2 });
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 1, y: 1 });
};
const tab = async (t) => { await evaluate(`showTab(${JSON.stringify(t)}, document.querySelector('.nav-item[onclick*="${t}"]'))`); await sleep(700); };

// Splash screen, before it is dismissed (§5.21).
await evaluate(`(()=>{const s=document.getElementById('introScreen'); if(s){s.classList.remove('intro-hide'); s.style.display='';}})()`);
await sleep(1200);
await shot("5.21-intro-splash");
await evaluate(`(()=>{const s=document.getElementById('introScreen'); if(s) s.remove(); document.body.style.overflow='';})()`);
await sleep(300);

// The onboarding card dismisses itself once every step is done, so catch it first.
await shotEl("5.11-onboarding", "#onboardCard");

// Full tab views (viewport only: the app shell scrolls inside .main, not the document).
const tabs = ["household", "income", "expenses", "assets", "liabilities", "goals", "simulation", "portfolio", "proposal", "report"];
for (const t of tabs) {
  try { await tab(t); await evaluate(`document.querySelector('.main')?.scrollTo(0,0)`); await shot(`tab-${t}`); }
  catch (e) { console.log("tab failed", t, e.message); }
}

// Components (§5 of the style guide).
await tab("household");
// Evidence for G-30: the hero clips its overflow, so a popover inside it is cut off.
await shotHover("5.9-info-popover-clipped-in-hero", ".wh-right-title .info-ic", ".wh-right-title .info-pop");
await shotEl("5.20-callout-tax-preview", ".tax-preview");
await shotEl("5.1-topbar", ".topbar", 0);
await shotEl("5.1-sidebar", ".sidebar", 0);
await shotEl("5.13-wealth-hero", ".wealth-hero");
await shotEl("5.2-panel", "#tab-household .panel");
await shotEl("5.5-form-row", "#tab-household .frow");
await shotEl("5.7-risk-badge", ".rbadge");

await shotEl("5.4-btn-add", "#tab-household .btn-add");
await shotEl("5.11-empty-state", "#childEmpty");
await shotEl("5.18-avatars-client-card", ".client-card");
await tab("income");
await shotHover("5.9-info-popover", "#tab-income .info-ic", "#tab-income .info-ic .info-pop", 16);
await tab("assets");
await shotEl("5.7-asset-item", "#tab-assets .asset-item");
await shotEl("5.15-loan-item", ".loan-item");

await tab("goals");
await shotEl("5.7-goal-tags", "#tab-goals .gtag");
await shotEl("5.15-goal-item", "#tab-goals .goal-item");

await tab("portfolio");
await shotEl("5.19-pill-tabs", ".pf-switcher");
await shotEl("5.6-pf-mc", ".pf-summary");
await shotEl("5.15-portfolio-row", ".pf-row + .pf-row");
await shotEl("5.17-allocation-pies", ".alloc-pies");
await shotEl("5.16-bar-rows", ".pf-bar-wrap");

await tab("proposal");
await shotEl("5.15-proposal-row", ".pr-row");
await shotEl("5.7-alloc-status", ".alloc-status");
await shotEl("5.8-grid-table", ".ov-tbl");

await tab("simulation");
try { await evaluate(`typeof runSim==='function' && runSim()`); await sleep(4000); } catch (e) { console.log("runSim failed", e.message); }
await evaluate(`document.querySelector('.main')?.scrollTo(0,0)`);
await shot("tab-simulation-after-run");
await shotEl("5.3-sim-toolbar", ".sim-toolbar");
await shotEl("5.3-sim-group", ".sim-group");
await shotEl("5.4-btn-primary-full", "#tab-simulation .btn-primary");
await shotEl("5.6-ss-card", ".ss-card");
await shotEl("5.12-chart", ".chart-wrap");
await evaluate(`expandAllSim(true)`); await sleep(1500);
await shotEl("5.3-section-dropdown-open", "#tab-simulation .ptitle.section-dropdown");
await shotEl("5.6-mc", ".mc");
await shotEl("5.7-fund-tag", ".fund-tag");
await shotEl("5.16-funding-bar", ".fund-bar", 40);
await shotEl("5.16-tax-score-bar", ".tax-score-bar", 30);
await shotEl("5.8-cash-flow-table", ".cf-tbl-wrap");
await shotEl("5.8-compare-table", ".cfc-tbl-wrap");

await evaluate(`document.getElementById('settingsPanel') && (window.openSettings ? openSettings() : null)`);
await sleep(600);
await shotEl("5.10-settings-drawer", "#settingsPanel", 0);
await shotEl("5.5-set-switch", ".set-switch");
await shotEl("5.4-band-buttons", ".band-btns");
await evaluate(`typeof closeSettings==='function' && closeSettings()`); await sleep(500);
await evaluate(`typeof closeShareModal==='function' && closeShareModal()`).catch(()=>{});
await evaluate(`typeof openShareModal==='function' && openShareModal()`); await sleep(800);
await shotEl("5.10-share-modal", "#shareModal", 0);
await evaluate(`typeof closeShareModal==='function' && closeShareModal()`); await sleep(500);

// Large modal + code block: the data-feed spec opens in a .da-modal with a <pre>.
await tab("portfolio");
await evaluate(`typeof fdShowSpec==='function' && fdShowSpec()`); await sleep(800);
await shotEl("5.10-large-modal", "#fdSpecModal .da-modal", 0);
await shotEl("5.14-code-block", "#fdSpecModal pre");

ws.close(); chrome.kill();
