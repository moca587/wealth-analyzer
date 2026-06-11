// ─── State ────────────────────────────────────────────────────────────────────
let client2Visible = false;
let children = [], childIdSeq = 0;
let assets = [], assetIdSeq = 0;
let loans = [
  { type:"mortgage_primary", label:"Primary home", bal:280000, rate:4.5, yrs:25 },
  { type:"auto",             label:"Car loan",     bal:15000,  rate:6.5, yrs:4  },
  { type:"cc",               label:"Credit card",  bal:5000,   rate:19.0,yrs:3  }
];
let goals = [
  { name:"Retirement fund", amt:500000, yr:25 },
  { name:"Emergency fund",  amt:30000,  yr:2  },
  { name:"Vacation home",   amt:80000,  yr:10 }
];
let mcChart = null;
let activeBandPreset = "standard";
let customBands = { low:10, mid:50, high:90 };
let lastPaths = [];

// ─── Init ─────────────────────────────────────────────────────────────────────
window.addEventListener("DOMContentLoaded", () => {
  populateCountryDropdowns();
  populateRiskDropdowns();
  populateHorizonDropdowns();
  populateRegionDropdown();
  populateAssetCountryDropdown();
  refreshAssetTypes();
  onTypeChange();
  renderLoans();
  renderGoalsList();
  renderChildren();
  renderAssets();
  updateRiskDisplay(1);
  updateHorizonDisplay(1);
  updateHouseholdRiskSummary();
  updateDisplays();
  setBandPreset("standard");
  onRegionChange();
  setTimeout(runSim, 300);
});

// ─── Tab navigation ───────────────────────────────────────────────────────────
function showTab(name) {
  document.querySelectorAll(".tab-section").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
  document.getElementById("tab-" + name).classList.add("active");
  event && event.currentTarget && event.currentTarget.classList.add("active");
  // find and activate nav item
  document.querySelectorAll(".nav-item").forEach(n => {
    if (n.getAttribute("onclick") && n.getAttribute("onclick").includes("'" + name + "'")) {
      n.classList.add("active");
    }
  });
}

// ─── Populate dropdowns ───────────────────────────────────────────────────────
function populateCountryDropdowns() {
  const countries = [
    { v:"", label:"— Country —" },
    { v:"US", label:"🇺🇸 United States" }, { v:"CA", label:"🇨🇦 Canada" }, { v:"MX", label:"🇲🇽 Mexico" },
    { v:"EU", label:"🇪🇺 Euro zone" }, { v:"GB", label:"🇬🇧 United Kingdom" }, { v:"CH", label:"🇨🇭 Switzerland" },
    { v:"JP", label:"🇯🇵 Japan" }, { v:"CN", label:"🇨🇳 China" }, { v:"TW", label:"🇹🇼 Taiwan" },
    { v:"SG", label:"🇸🇬 Singapore" }, { v:"AU", label:"🇦🇺 Australia" }, { v:"HK", label:"🇭🇰 Hong Kong" },
    { v:"KR", label:"🇰🇷 South Korea" }, { v:"IN", label:"🇮🇳 India" }, { v:"ID", label:"🇮🇩 Indonesia" },
    { v:"SA", label:"🇸🇦 Saudi Arabia" }, { v:"ZA", label:"🇿🇦 South Africa" }, { v:"BR", label:"🇧🇷 Brazil" },
    { v:"OTHER", label:"🌍 Other" }
  ];
  ["c1-country", "c2-country"].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    sel.innerHTML = countries.map(c => `<option value="${c.v}">${c.label}</option>`).join("");
  });
}

function populateRiskDropdowns() {
  const html = `
    <optgroup label="Conservative">
      <option value="very_conservative">Very conservative</option>
      <option value="conservative">Conservative</option>
    </optgroup>
    <optgroup label="Moderate">
      <option value="moderately_conservative">Moderately conservative</option>
      <option value="moderate" selected>Moderate</option>
      <option value="moderately_aggressive">Moderately aggressive</option>
    </optgroup>
    <optgroup label="Aggressive">
      <option value="aggressive">Aggressive</option>
      <option value="very_aggressive">Very aggressive</option>
    </optgroup>`;
  ["c1-risk", "c2-risk"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  });
}

function populateHorizonDropdowns() {
  const html = `
    <optgroup label="Short term">
      <option value="1_3">1–3 years</option>
      <option value="3_5">3–5 years</option>
    </optgroup>
    <optgroup label="Medium term">
      <option value="5_10">5–10 years</option>
      <option value="10_15" selected>10–15 years</option>
    </optgroup>
    <optgroup label="Long term">
      <option value="15_20">15–20 years</option>
      <option value="20_30">20–30 years</option>
      <option value="30_plus">30+ years</option>
    </optgroup>`;
  ["c1-horizon", "c2-horizon"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  });
}

function populateRegionDropdown() {
  const sel = document.getElementById("region-select");
  const groups = {
    "North America": ["us","ca","mx"],
    "Europe": ["eu","uk","ch"],
    "Asia Pacific": ["jp","cn","sg","au","hk","kr","in","id"],
    "Middle East & Africa": ["sa","za"],
    "Latin America": ["br"]
  };
  sel.innerHTML = Object.entries(groups).map(([grp, keys]) =>
    `<optgroup label="${grp}">${keys.map(k => `<option value="${k}">${REGIONS[k].flag} ${REGIONS[k].name}</option>`).join("")}</optgroup>`
  ).join("");
}

function populateAssetCountryDropdown() {
  const sel = document.getElementById("asset-country");
  const countries = Object.entries(COUNTRY_ACCOUNTS).map(([k, v]) => `<option value="${k}">${v.flag} ${v.name}</option>`);
  sel.innerHTML = countries.join("");
}

// ─── Collapsible ─────────────────────────────────────────────────────────────
function toggleCollapse(id) {
  const content = document.getElementById(id);
  const arrow = document.getElementById(id + "-arrow");
  const open = content.classList.toggle("open");
  if (arrow) arrow.textContent = open ? "▼" : "▶";
}

// ─── Client 2 ─────────────────────────────────────────────────────────────────
function showClient2() {
  client2Visible = true;
  document.getElementById("client2-card").style.display = "block";
  document.getElementById("add-c2-wrap").style.display = "none";
  document.getElementById("rel-select-wrap").style.display = "flex";
  document.getElementById("inc-label-2").textContent = "Client 2";
  updateRiskDisplay(2);
  updateHorizonDisplay(2);
  updateDisplays();
}

function hideClient2() {
  client2Visible = false;
  document.getElementById("client2-card").style.display = "none";
  document.getElementById("add-c2-wrap").style.display = "block";
  document.getElementById("rel-select-wrap").style.display = "none";
  document.getElementById("rel-badge-wrap").querySelector(".rel-badge").style.display = "none";
  document.getElementById("inc-label-2").textContent = "";
  document.getElementById("inc1b").value = 0;
  document.getElementById("inc2b").value = 0;
  updateHouseholdRiskSummary();
  updateDisplays();
}

function toggleSameAddress() {
  const same = document.getElementById("same-address").checked;
  document.getElementById("addr2-same-note").style.display = same ? "block" : "none";
  document.getElementById("addr2-inputs").style.display = same ? "none" : "block";
}

// ─── Children ─────────────────────────────────────────────────────────────────
function addChild() {
  const id = "child-" + (++childIdSeq);
  children.push({ id, first:"", last:"", dob:"" });
  renderChildren();
  setTimeout(() => { const el = document.getElementById("cf-" + id); if (el) el.focus(); }, 50);
}

function removeChild(id) {
  children = children.filter(c => c.id !== id);
  renderChildren();
}

function updateChildField(id, field, val) {
  const c = children.find(x => x.id === id);
  if (c) { c[field] = val; renderChildren(); }
}

function renderChildren() {
  const list = document.getElementById("children-list");
  const empty = document.getElementById("children-empty");
  empty.style.display = children.length ? "none" : "block";
  list.innerHTML = children.map((c, i) => {
    const age = calcAge(c.dob);
    const ini = initials(c.first, c.last) || String(i + 1);
    const name = (c.first + " " + c.last).trim() || "Child " + (i + 1);
    return `<div class="child-card">
      <div class="child-header">
        <div style="display:flex;align-items:center;gap:8px">
          <div class="child-avatar">${ini}</div>
          <div>
            <div style="font-size:13px;font-weight:500;color:var(--text)">${name}</div>
            <div style="font-size:11px;color:var(--text3)">${age !== null ? "Age " + age : "Age unknown"}</div>
          </div>
        </div>
        <button class="remove-x" onclick="removeChild('${c.id}')">✕</button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:6px">
        <input class="form-input" style="width:100%;font-size:12px" id="cf-${c.id}" value="${c.first}" placeholder="First name" oninput="updateChildField('${c.id}','first',this.value)">
        <input class="form-input" style="width:100%;font-size:12px" value="${c.last}" placeholder="Last name" oninput="updateChildField('${c.id}','last',this.value)">
      </div>
      <div style="display:flex;align-items:center;gap:6px">
        <label style="font-size:11px;color:var(--text3);white-space:nowrap">Date of birth</label>
        <input type="date" class="form-input" style="flex:1;font-size:12px" value="${c.dob}" oninput="updateChildField('${c.id}','dob',this.value)">
      </div>
    </div>`;
  }).join("");
}

// ─── Display updates ──────────────────────────────────────────────────────────
function updateDisplays() {
  const f1 = (document.getElementById("c1-first").value || "").trim();
  const l1 = (document.getElementById("c1-last").value || "").trim();
  const age1 = calcAge(document.getElementById("c1-dob").value);
  document.getElementById("av1").textContent = initials(f1, l1) || "C1";
  document.getElementById("name-display-1").textContent = (f1 || l1) ? (f1 + " " + l1).trim() : "Client 1";
  document.getElementById("age-display-1").textContent = age1 !== null ? "Age " + age1 : "Primary client";
  document.getElementById("inc-label-1").textContent = f1 || "Client 1";

  if (client2Visible) {
    const f2 = (document.getElementById("c2-first").value || "").trim();
    const l2 = (document.getElementById("c2-last").value || "").trim();
    const age2 = calcAge(document.getElementById("c2-dob").value);
    document.getElementById("av2").textContent = initials(f2, l2) || "C2";
    document.getElementById("name-display-2").textContent = (f2 || l2) ? (f2 + " " + l2).trim() : "Client 2";
    document.getElementById("age-display-2").textContent = age2 !== null ? "Age " + age2 : "Secondary client";
    document.getElementById("inc-label-2").textContent = f2 || "Client 2";
    const rel = document.getElementById("relationship").value;
    const badge = document.getElementById("rel-display");
    if (rel) {
      badge.style.display = "inline-flex";
      badge.textContent = (f1 || "Client 1") + " & " + (f2 || "Client 2") + " — " + REL_LABELS[rel];
    } else {
      badge.style.display = "none";
    }
  }
}

// ─── Risk & Horizon ───────────────────────────────────────────────────────────
function updateRiskDisplay(n) {
  const v = document.getElementById("c" + n + "-risk").value;
  const r = RISK_PROFILES[v];
  const badge = document.getElementById("c" + n + "-risk-badge");
  badge.textContent = r.label;
  badge.style.background = r.bg;
  badge.style.color = r.color;
  badge.style.border = "1px solid " + r.border;
  document.getElementById("c" + n + "-risk-note").textContent = r.note;
  updateHouseholdRiskSummary();
}

function updateHorizonDisplay(n) {
  const v = document.getElementById("c" + n + "-horizon").value;
  const h = HORIZON_PROFILES[v];
  const badge = document.getElementById("c" + n + "-horizon-badge");
  badge.textContent = h.label;
  badge.style.background = h.bg;
  badge.style.color = h.color;
  document.getElementById("c" + n + "-horizon-note").textContent = h.note;
}

function updateHouseholdRiskSummary() {
  const r1 = RISK_PROFILES[document.getElementById("c1-risk").value];
  const r2 = client2Visible ? RISK_PROFILES[document.getElementById("c2-risk").value] : null;
  let label, color;
  if (r2) {
    const avg = (r1.retMean + r2.retMean) / 2;
    const match = Object.values(RISK_PROFILES).reduce((b, r) => Math.abs(r.retMean - avg) < Math.abs(b.retMean - avg) ? r : b);
    label = "Blended: " + match.label; color = match.color;
  } else {
    label = r1.label; color = r1.color;
  }
  const el = document.getElementById("m-risk");
  el.textContent = label; el.style.color = color;
}

function getHouseholdReturnParams() {
  const r1 = RISK_PROFILES[document.getElementById("c1-risk").value];
  const r2 = client2Visible ? RISK_PROFILES[document.getElementById("c2-risk").value] : null;
  if (r2) return { mean:(r1.retMean + r2.retMean) / 2 / 100, vol:(r1.retVol + r2.retVol) / 2 / 100 };
  return { mean:r1.retMean / 100, vol:r1.retVol / 100 };
}

// ─── Region / Inflation ───────────────────────────────────────────────────────
function onRegionChange() {
  const k = document.getElementById("region-select").value;
  const r = REGIONS[k];
  if (!r) return;
  document.getElementById("inflation").value = r.rate;
  document.getElementById("region-note").textContent = r.flag + " " + r.note;
}

function onCountryChange() {
  const c = document.getElementById("c1-country").value;
  if (c) {
    document.getElementById("asset-country").value = c;
    refreshAssetTypes();
  }
}

// ─── Assets ───────────────────────────────────────────────────────────────────
function refreshAssetTypes() {
  const c = document.getElementById("asset-country").value || "US";
  const d = COUNTRY_ACCOUNTS[c] || COUNTRY_ACCOUNTS["OTHER"];
  const sel = document.getElementById("asset-type");
  sel.innerHTML = "";
  d.groups.forEach(g => {
    const og = document.createElement("optgroup");
    og.label = g.group;
    g.accounts.forEach(a => {
      const o = document.createElement("option");
      o.value = a.value + "|" + g.group;
      o.textContent = a.label;
      og.appendChild(o);
    });
    sel.appendChild(og);
  });
  document.getElementById("asset-country-label").textContent = d.flag + " " + d.name + " account types";
  updateAssetNote();
}

function updateAssetNote() {
  const c = document.getElementById("asset-country").value || "US";
  const d = COUNTRY_ACCOUNTS[c] || COUNTRY_ACCOUNTS["OTHER"];
  const v = (document.getElementById("asset-type").value || "").split("|")[0];
  const note = document.getElementById("asset-type-note");
  for (const g of d.groups) {
    const a = g.accounts.find(x => x.value === v);
    if (a) { note.style.display = "block"; note.textContent = a.note; return; }
  }
  note.style.display = "none";
}

function addAsset() {
  const raw = document.getElementById("asset-type").value || "";
  const [typeVal, groupName] = raw.split("|");
  const c = document.getElementById("asset-country").value || "US";
  const d = COUNTRY_ACCOUNTS[c] || COUNTRY_ACCOUNTS["OTHER"];
  let baseLabel = "", liquid = true, note = "";
  for (const g of d.groups) {
    const a = g.accounts.find(x => x.value === typeVal);
    if (a) { baseLabel = a.label; liquid = a.liquid; note = a.note; break; }
  }
  const customLabel = document.getElementById("asset-label").value.trim();
  const val = parseFloat(document.getElementById("asset-value").value);
  if (!val || val <= 0) return;
  const id = "asset-" + (++assetIdSeq);
  assets.push({ id, type:typeVal, group:groupName || "Other", label:customLabel || baseLabel, baseLabel, value:val, liquid, country:c, note });
  document.getElementById("asset-label").value = "";
  document.getElementById("asset-value").value = "";
  renderAssets();
  updateTotalAssetsDisplay();
}

function removeAsset(id) {
  assets = assets.filter(a => a.id !== id);
  renderAssets();
  updateTotalAssetsDisplay();
}

function renderAssets() {
  const el = document.getElementById("assets-list");
  if (!assets.length) { el.innerHTML = '<div class="empty-state">No accounts added yet.</div>'; return; }
  const grouped = {};
  assets.forEach(a => { if (!grouped[a.group]) grouped[a.group] = []; grouped[a.group].push(a); });
  el.innerHTML = Object.entries(grouped).map(([grp, items]) => {
    const gc = getGroupColor(grp);
    return `<div class="asset-group-header">${grp}</div>` +
      items.map(a => `
        <div class="asset-item">
          <div class="asset-row">
            <span class="asset-badge" style="background:${gc.bg};color:${gc.text};border:1px solid ${gc.border}">${a.baseLabel}</span>
            <span style="flex:1;padding:0 8px;font-size:12px;color:var(--text2)">${a.label !== a.baseLabel ? a.label : ""}</span>
            <span style="color:var(--green);font-weight:500">${fmtC(a.value)}</span>
            <span class="liquid-tag">${a.liquid ? "liquid" : "illiquid"}</span>
            <button class="remove-x" onclick="removeAsset('${a.id}')">✕</button>
          </div>
        </div>`).join("");
  }).join("");
}

function getTotalAccountAssets() { return assets.reduce((s, a) => s + a.value, 0); }
function updateTotalAssetsDisplay() {
  document.getElementById("m-total-assets").textContent = fmtC(getTotalAccountAssets() + gv("a-prop") + gv("a-other"));
}

// ─── Loans ────────────────────────────────────────────────────────────────────
function onTypeChange() {
  const t = document.getElementById("loan-type").value;
  const d = LOAN_DEFAULTS[t];
  document.getElementById("l-rate").value = d.rate;
  document.getElementById("l-yrs").value = d.yrs;
}

function renderLoans() {
  const el = document.getElementById("loans-list");
  if (!loans.length) { el.innerHTML = '<div class="empty-state">No loans added.</div>'; return; }
  el.innerHTML = loans.map((l, i) => `
    <div class="loan-item">
      <div class="asset-row">
        <span class="loan-badge">${LOAN_LABELS[l.type] || l.type}</span>
        <span style="flex:1;padding:0 8px;color:var(--text)">${l.label || ""}</span>
        <span style="color:var(--red);font-weight:500">${fmtC(l.bal)}</span>
        <button class="remove-x" onclick="removeLoan(${i})">✕</button>
      </div>
      <div class="asset-meta">
        <span>${l.rate}% APR</span>
        <span>${l.yrs} yrs remaining</span>
        <span>~${fmtC(monthlyPayment(l.bal, l.rate, l.yrs))}/mo</span>
      </div>
    </div>`).join("");
}

function addLoan() {
  const t = document.getElementById("loan-type").value;
  const bal = parseFloat(document.getElementById("l-bal").value);
  const rate = parseFloat(document.getElementById("l-rate").value);
  const yrs = parseFloat(document.getElementById("l-yrs").value);
  const lbl = document.getElementById("l-label").value.trim();
  if (!bal || !rate || !yrs) return;
  loans.push({ type:t, label:lbl || LOAN_LABELS[t], bal, rate, yrs });
  document.getElementById("l-bal").value = "";
  document.getElementById("l-label").value = "";
  onTypeChange();
  renderLoans();
}

function removeLoan(i) { loans.splice(i, 1); renderLoans(); }

// ─── Goals ────────────────────────────────────────────────────────────────────
function renderGoalsList() {
  document.getElementById("goals-list").innerHTML = goals.length === 0
    ? '<div class="empty-state">No goals added.</div>'
    : goals.map((g, i) => `
      <div class="goal-item">
        <span style="flex:1">${g.name}</span>
        <span style="color:var(--text2);margin-right:12px;font-size:12px">${fmtC(g.amt)} · yr ${g.yr}</span>
        <button class="remove-x" onclick="removeGoal(${i})">✕</button>
      </div>`).join("");
}

function addGoal() {
  const n = document.getElementById("g-name").value.trim();
  const a = parseFloat(document.getElementById("g-amt").value);
  const y = parseFloat(document.getElementById("g-yr").value);
  if (!n || !a || !y) return;
  goals.push({ name:n, amt:a, yr:y });
  document.getElementById("g-name").value = "";
  document.getElementById("g-amt").value = "";
  document.getElementById("g-yr").value = "";
  renderGoalsList();
}

function removeGoal(i) { goals.splice(i, 1); renderGoalsList(); }

// ─── Band presets ─────────────────────────────────────────────────────────────
function getBands() {
  if (activeBandPreset === "standard")    return { low:10, mid:50, high:80 };
  if (activeBandPreset === "alternative") return { low:20, mid:60, high:90 };
  return customBands;
}

function setBandPreset(p) {
  activeBandPreset = p;
  document.querySelectorAll(".band-btn").forEach(b => b.classList.remove("active"));
  document.getElementById("btn-" + p).classList.add("active");
  const wrap = document.getElementById("custom-band-wrap");
  wrap.classList.toggle("show", p === "custom");
  const descs = {
    standard:    "10th–80th percentile band. Centre line is the median (50th).",
    alternative: "20th–90th percentile band. Centre line is the 60th percentile.",
    custom:      "Custom bands — set your own low, mid, and high percentiles above."
  };
  document.getElementById("band-desc").textContent = descs[p];
  if (p !== "custom" && lastPaths.length) redrawChart(lastPaths);
}

function applyCustomBands() {
  customBands = {
    low:  parseInt(document.getElementById("band-low").value)  || 10,
    mid:  parseInt(document.getElementById("band-mid").value)  || 50,
    high: parseInt(document.getElementById("band-high").value) || 90
  };
  if (lastPaths.length) redrawChart(lastPaths);
}

function buildLegend(bands) {
  document.getElementById("band-legend").innerHTML = `
    <span><span class="legend-dot" style="background:#4caf7d"></span>${bands.high}th pct (optimistic)</span>
    <span><span class="legend-dot" style="background:#5b9bd5"></span>${bands.mid}th pct (median)</span>
    <span><span class="legend-dot" style="background:#e05c5c"></span>${bands.low}th pct (pessimistic)</span>
    <span><span class="legend-dot" style="background:rgba(91,155,213,0.2)"></span>Probability band</span>`;
}

// ─── Chart ────────────────────────────────────────────────────────────────────
function redrawChart(allPaths) {
  const simYears = allPaths[0].length - 1;
  const bands = getBands();
  buildLegend(bands);
  const labels = Array.from({ length:simYears + 1 }, (_, i) => i === 0 ? "Now" : "Yr " + i);
  const pLow = [], pMidLow = [], pMid = [], pMidHigh = [], pHigh = [];
  const iL = Math.round((100 - (bands.high - bands.low)) / 2);
  const iH = 100 - iL;
  for (let y = 0; y <= simYears; y++) {
    const col = allPaths.map(p => p[y]).sort((a, b) => a - b);
    const qi = pct => col[Math.min(Math.floor(pct / 100 * (col.length - 1)), col.length - 1)];
    pLow.push(qi(bands.low));
    pMidLow.push(qi(iL));
    pMid.push(qi(bands.mid));
    pMidHigh.push(qi(iH));
    pHigh.push(qi(bands.high));
  }
  if (mcChart) mcChart.destroy();
  const ctx = document.getElementById("mc-chart").getContext("2d");
  mcChart = new Chart(ctx, {
    type: "line",
    data: { labels, datasets: [
      { label:bands.high+"th pct", data:pHigh,    borderColor:"#4caf7d", borderWidth:2,   pointRadius:0, fill:false,  tension:0.3, borderDash:[5,3] },
      { label:"outer band",        data:pHigh,    borderWidth:0,         pointRadius:0,   fill:"+1",     tension:0.3, backgroundColor:"rgba(76,175,125,0.08)" },
      { label:"inner top",         data:pMidHigh, borderWidth:0,         pointRadius:0,   fill:"+1",     tension:0.3, backgroundColor:"rgba(91,155,213,0.14)" },
      { label:bands.mid+"th pct",  data:pMid,     borderColor:"#5b9bd5", borderWidth:2.5, pointRadius:0, fill:false,  tension:0.3 },
      { label:"inner bot",         data:pMidLow,  borderWidth:0,         pointRadius:0,   fill:"+1",     tension:0.3, backgroundColor:"rgba(91,155,213,0.14)" },
      { label:"outer bot",         data:pLow,     borderWidth:0,         pointRadius:0,   fill:"+1",     tension:0.3, backgroundColor:"rgba(76,175,125,0.08)" },
      { label:bands.low+"th pct",  data:pLow,     borderColor:"#e05c5c", borderWidth:2,   pointRadius:0, fill:false,  tension:0.3, borderDash:[5,3] }
    ]},
    options: {
      responsive:true, maintainAspectRatio:false,
      interaction:{ mode:"index", intersect:false },
      plugins: {
        legend:{ display:false },
        tooltip:{
          backgroundColor:"rgba(22,22,22,0.95)",
          borderColor:"rgba(255,255,255,0.1)", borderWidth:1,
          titleColor:"#c9a96e", bodyColor:"#a09890",
          callbacks:{
            label: c => {
              const skip = ["outer band","inner top","inner bot","outer bot"];
              return skip.includes(c.dataset.label) ? null : " " + c.dataset.label + ": " + fmtC(c.parsed.y);
            }
          },
          filter: i => !["outer band","inner top","inner bot","outer bot"].includes(i.dataset.label)
        }
      },
      scales: {
        x: { grid:{ color:"rgba(255,255,255,0.04)" }, ticks:{ color:"#6a6260", font:{ size:11 }, maxTicksLimit:10, autoSkip:true } },
        y: { grid:{ color:"rgba(255,255,255,0.04)" }, ticks:{ callback:v => fmtC(v), color:"#6a6260", font:{ size:11 } } }
      }
    }
  });
}

// ─── Monte Carlo simulation ───────────────────────────────────────────────────
function runSim() {
  const rp = getHouseholdReturnParams();
  document.getElementById("ret-mean").value = (rp.mean * 100).toFixed(1);
  document.getElementById("ret-vol").value  = (rp.vol  * 100).toFixed(1);

  const inc = gv("inc1") + gv("inc2") + (client2Visible ? gv("inc1b") + gv("inc2b") : 0);
  const raise     = gv("raise")     / 100;
  const expBase   = gv("exp-living") + gv("exp-ins") + gv("exp-other");
  const inflation = gv("inflation") / 100;
  const aProp     = gv("a-prop");
  const aOther    = gv("a-other");
  const retMean   = rp.mean;
  const retVol    = rp.vol;
  const simYears  = Math.round(gv("sim-years"));
  const simN      = parseInt(document.getElementById("sim-n").value);

  const totalAcct  = getTotalAccountAssets();
  const totalAssets = totalAcct + aProp + aOther;
  const totalLiab  = loans.reduce((s, l) => s + l.bal, 0);
  const annualDebt = loans.reduce((s, l) => s + monthlyPayment(l.bal, l.rate, l.yrs) * 12, 0);
  const nwNow      = totalAssets - totalLiab;
  const surplusNow = inc - expBase - annualDebt;

  const nwEl = document.getElementById("m-nw");
  nwEl.textContent = fmtC(nwNow);
  nwEl.className = "metric-val " + (nwNow >= 0 ? "positive" : "negative");

  const surplusEl = document.getElementById("m-surplus");
  surplusEl.textContent = fmtC(surplusNow / 12) + "/mo";
  surplusEl.className = "metric-val " + (surplusNow >= 0 ? "positive" : "negative");

  document.getElementById("m-total-assets").textContent = fmtC(totalAssets);

  const aInv = assets.filter(a => a.group && (a.group.toLowerCase().includes("invest") || a.group.toLowerCase().includes("brok"))).reduce((s, a) => s + a.value, 0);

  const allPaths = [];
  for (let s = 0; s < simN; s++) {
    let inv = Math.max(aInv, totalAcct * 0.3);
    let cash = totalAcct - inv;
    let prop = aProp, income = inc, expenses = expBase;
    let lb = loans.map(l => l.bal);
    const path = [nwNow];
    for (let y = 1; y <= simYears; y++) {
      const annRet = (retMean - 0.5 * retVol * retVol) + retVol * boxMuller();
      prop *= (1 + (0.03 + 0.02 * boxMuller()));
      income *= (1 + raise);
      expenses *= (1 + inflation);
      let dp = 0;
      lb = lb.map((b, i) => {
        if (b <= 0) return 0;
        const l = loans[i];
        const pmt = monthlyPayment(l.bal, l.rate, l.yrs) * 12;
        const nb = Math.max(0, b * (1 + l.rate / 100) - pmt);
        dp += Math.min(pmt, b * (1 + l.rate / 100));
        return nb;
      });
      const surplus = income - expenses - dp;
      const sp = surplus > 0 ? 0.3 : 0;
      cash += surplus * (1 - sp);
      inv = inv * (1 + annRet) + surplus * sp;
      path.push(cash + inv + prop + aOther - lb.reduce((a, b) => a + b, 0));
    }
    allPaths.push(path);
  }

  lastPaths = allPaths;
  const bands = getBands();
  const finalCol = allPaths.map(p => p[simYears]).sort((a, b) => a - b);
  const qi = pct => finalCol[Math.min(Math.floor(pct / 100 * (finalCol.length - 1)), finalCol.length - 1)];

  document.getElementById("m-med").textContent = fmtC(qi(bands.mid));

  const gr = goals.map(g => {
    const yr = Math.min(Math.round(g.yr), simYears);
    return Math.round(allPaths.filter(p => p[yr] >= g.amt).length / simN * 100);
  });
  const avg = gr.length ? Math.round(gr.reduce((a, b) => a + b, 0) / gr.length) : null;

  const probEl = document.getElementById("m-prob");
  probEl.textContent = avg !== null ? avg + "%" : "N/A";
  probEl.className = "metric-val " + (avg >= 70 ? "positive" : avg >= 40 ? "" : "negative");
  if (avg !== null && avg >= 40 && avg < 70) probEl.style.color = "#c9a96e";
  else probEl.style.color = "";

  if (goals.length) {
    document.getElementById("goals-results").style.display = "block";
    const cols = [];
    for (let y = 0; y <= simYears; y++) {
      const c = allPaths.map(p => p[y]).sort((a, b) => a - b);
      cols.push(pct => c[Math.min(Math.floor(pct / 100 * (c.length - 1)), c.length - 1)]);
    }
    document.getElementById("goals-result-list").innerHTML = goals.map((g, i) => {
      const rate = gr[i];
      const cls = rate >= 70 ? "tag-green" : rate >= 40 ? "tag-amber" : "tag-red";
      const yr = Math.min(Math.round(g.yr), simYears);
      return `<div class="goal-item">
        <span style="flex:1">${g.name}</span>
        <span style="color:var(--text2);margin-right:8px;font-size:12px">${fmtC(g.amt)} · yr ${g.yr}</span>
        <span style="color:var(--text3);margin-right:8px;font-size:12px">median yr ${yr}: ${fmtC(cols[yr](bands.mid))}</span>
        <span class="goal-tag ${cls}">${rate}% likely</span>
      </div>`;
    }).join("");
  }

  redrawChart(allPaths);
  showTab("simulation");
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function calcAge(dob) {
  if (!dob) return null;
  const d = new Date(dob), now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) a--;
  return a >= 0 ? a : null;
}

function initials(f, l) {
  return ((f || "").charAt(0) + (l || "").charAt(0)).toUpperCase() || "?";
}

function fmtC(n) {
  if (Math.abs(n) >= 1e6) return (n < 0 ? "-" : "") + "$" + Math.abs(n / 1e6).toFixed(2) + "M";
  if (Math.abs(n) >= 1e3) return (n < 0 ? "-$" : "$") + Math.abs(n / 1e3).toFixed(0) + "k";
  return (n < 0 ? "-$" : "$") + Math.abs(Math.round(n)).toLocaleString();
}

function gv(id) { return parseFloat(document.getElementById(id).value) || 0; }

function monthlyPayment(p, r, y) {
  if (!p || !r || !y) return 0;
  const mr = r / 100 / 12, n = y * 12;
  if (mr === 0) return p / n;
  return p * (mr * Math.pow(1 + mr, n)) / (Math.pow(1 + mr, n) - 1);
}

function boxMuller() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
