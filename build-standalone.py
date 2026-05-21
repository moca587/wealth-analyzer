#!/usr/bin/env python3
"""
Build standalone single-file version of wealth-analyzer.html
Inlines all CDN dependencies so the app works with no internet connection.
"""
import re, base64, os, datetime

SRC  = "wealth-analyzer.html"
DEST = "wealth-analyzer-standalone.html"
V    = "vendor"

# ── Read files ────────────────────────────────────────────────────────────────
with open(SRC, "r", encoding="utf-8") as f:
    html = f.read()

def read(name):
    with open(os.path.join(V, name), "r", encoding="utf-8") as f:
        return f.read()

chart_js     = read("chart.min.js")
jspdf_js     = read("jspdf.min.js")
autotable_js = read("autotable.min.js")
pdfjs_main   = read("pdf.min.js")

with open(os.path.join(V, "pdf.worker.min.js"), "rb") as f:
    worker_bytes = f.read()

# Worker encoded as base64 — safe to embed inside any <script> tag
worker_b64 = base64.b64encode(worker_bytes).decode("ascii")

# ── 0. Stamp APP_VERSION with current build timestamp ────────────────────────
version = datetime.datetime.now().strftime("%Y%m%d-%H%M")
html = re.sub(r'const APP_VERSION\s*=\s*"[^"]*"', f'const APP_VERSION = "{version}"', html)
print(f"   Version: {version}")

# ── 1. Remove Google Fonts link, replace with system fonts ───────────────────
html = html.replace(
    '<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap" rel="stylesheet">',
    "<!-- Google Fonts removed — system fonts used instead (standalone mode) -->"
)

# Swap font-family values in CSS custom properties and class rules
html = html.replace("'DM Serif Display',serif",   "Georgia,'Times New Roman',serif")
html = html.replace("'DM Serif Display', serif",  "Georgia,'Times New Roman',serif")
html = html.replace('"DM Serif Display",serif',   "Georgia,'Times New Roman',serif")
html = html.replace("'DM Sans',sans-serif",       "-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,Arial,sans-serif")
html = html.replace("'DM Sans', sans-serif",      "-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,Arial,sans-serif")
html = html.replace('"DM Sans",sans-serif',       "-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,Arial,sans-serif")
html = html.replace("'DM Sans',monospace",        "'Courier New',Courier,monospace")
html = html.replace("'DM Sans', monospace",       "'Courier New',Courier,monospace")

# ── 2. Inline Chart.js ───────────────────────────────────────────────────────
html = html.replace(
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"></script>',
    f'<script>/* Chart.js 4.4.1 — inlined */\n{chart_js}\n</script>'
)

# ── 3. Inline pdf.js + embed worker as base64 blob ──────────────────────────
pdfjs_block = (
    f'<script>/* pdf.js 3.11.174 — inlined */\n{pdfjs_main}\n</script>\n'
    f'<script>/* pdf.js worker — base64 encoded for offline use */\n'
    f'(function(){{\n'
    f'  var b64="{worker_b64}";\n'
    f'  var bin=atob(b64);\n'
    f'  var arr=new Uint8Array(bin.length);\n'
    f'  for(var i=0;i<bin.length;i++) arr[i]=bin.charCodeAt(i);\n'
    f'  var blob=new Blob([arr],{{type:"application/javascript"}});\n'
    f'  window._pdfWorkerBlobUrl=URL.createObjectURL(blob);\n'
    f'}})();\n'
    f'</script>'
)
html = html.replace(
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>',
    pdfjs_block
)

# Point workerSrc at the blob URL we created above
html = html.replace(
    'pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";',
    'pdfjsLib.GlobalWorkerOptions.workerSrc=window._pdfWorkerBlobUrl||"";'
)

# ── 4. Inline jsPDF ─────────────────────────────────────────────────────────
html = html.replace(
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>',
    f'<script>/* jsPDF 2.5.1 — inlined */\n{jspdf_js}\n</script>'
)

# ── 5. Inline jsPDF-autotable ────────────────────────────────────────────────
html = html.replace(
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js"></script>',
    f'<script>/* jsPDF-autotable 3.8.2 — inlined */\n{autotable_js}\n</script>'
)

# ── 6. Add offline indicator meta + title suffix ─────────────────────────────
html = html.replace(
    '<meta charset="UTF-8">',
    '<meta charset="UTF-8">\n  <meta name="standalone" content="true">'
)

# ── Write output ─────────────────────────────────────────────────────────────
with open(DEST, "w", encoding="utf-8") as f:
    f.write(html)

size_kb = os.path.getsize(DEST) / 1024
print(f"✓  {DEST}")
print(f"   Size: {size_kb:,.0f} KB  ({size_kb/1024:.1f} MB)")

# Sanity checks
missing = []
for cdn in ["cdnjs.cloudflare.com", "fonts.googleapis.com", "fonts.gstatic.com"]:
    if cdn in html:
        missing.append(cdn)
if missing:
    print(f"⚠  Still references CDN: {missing}")
else:
    print("   No remaining CDN references — fully offline ✓")
