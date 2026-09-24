// Screenshot admin console tabs for docs/style-guide.md (and for the Phase 2
// before/after check, P2-14). Same CDP approach and requirements as capture.mjs.
//
//   node docs/style-guide-assets/capture-admin.mjs            # catalogue: admin-dashboard, admin-agent
//   node docs/style-guide-assets/capture-admin.mjs <dir> all  # every tab into <dir>, e.g. before/after a change
import { spawn } from "node:child_process";
import { writeFileSync, mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as sleep } from "node:timers/promises";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "../..");
const OUT = process.argv[2] || HERE; const ALL = process.argv[3] === "all";
const CATALOGUE = ["dashboard", "agent"];
mkdirSync(OUT, { recursive: true });
const port = 9344;
const chrome = spawn(process.env.CHROME || "google-chrome", [
  "--headless=new", `--remote-debugging-port=${port}`, "--no-first-run", "--no-default-browser-check",
  "--allow-file-access-from-files", "--hide-scrollbars", "--window-size=1440,900",
  `--user-data-dir=${mkdtempSync(join(tmpdir(), "wa-admin-"))}`, "about:blank",
], { stdio: "ignore" });
let targets;
for (let i = 0; i < 50; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); break; } catch { await sleep(200); } }
const ws = new WebSocket(targets.find(t => t.type === "page").webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener("open", r, { once: true }));
let id = 0; const pending = new Map(); const errors = [];
ws.addEventListener("message", e => { const m = JSON.parse(e.data);
  if (m.method === "Runtime.exceptionThrown") errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
  if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errors.push(m.params.args.map(a => a.value ?? a.description).join(" "));
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (expr) => (await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;
await send("Page.enable"); await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
await send("Page.navigate", { url: `file://${REPO}/admin.html` });
for (let i = 0; i < 100; i++) { if (await evaluate("document.readyState==='complete' && typeof showTab==='function'")) break; await sleep(200); }
await sleep(1000);
const tabs = ALL ? await evaluate(`[...document.querySelectorAll('[data-tab]')].map(n=>n.dataset.tab)`) : CATALOGUE;
for (const t of tabs) {
  await evaluate(`showTab(${JSON.stringify(t)}); document.querySelector('.main').scrollTop=0`);
  await sleep(700);
  const r = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(`${OUT}/${ALL ? t : "admin-" + t}.png`, Buffer.from(r.result.data, "base64"));
}
console.log("tabs:", tabs.length, "errors:", JSON.stringify(errors));
ws.close(); chrome.kill();
