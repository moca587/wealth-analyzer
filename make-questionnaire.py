# -*- coding: utf-8 -*-
"""Generate the Wealth Analyzer client intake questionnaire PDF.

Paper-fillable A4 form whose sections mirror the app's data model
(Household, Income, Expenses, Assets, Liabilities, Goals, Retirement,
Risk profile, Tax) so a completed form maps 1:1 onto app fields.
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import Color, white
from reportlab.pdfgen import canvas

BLUE   = Color(0/255, 87/255, 184/255)      # app accent #0057b8
BLUE_L = Color(232/255, 240/255, 252/255)   # light tint for section bars
INK    = Color(22/255, 33/255, 62/255)      # app text #16213e
GREY   = Color(120/255, 130/255, 150/255)
LINE   = Color(170/255, 185/255, 210/255)

W, H = A4
M = 46                       # page margin
CW = W - 2 * M               # content width

OUT = "Wealth-Analyzer-Client-Questionnaire.pdf"
c = canvas.Canvas(OUT, pagesize=A4)
c.setTitle("Wealth Analyzer by Private Wealth Intelligence - Client Questionnaire")
c.setAuthor("Private Wealth Intelligence")
c.setSubject("Client intake questionnaire for Wealth Analyzer by Private Wealth Intelligence")

y = 0                        # cursor (set per page)
page_no = 0


def footer():
    c.setFont("Helvetica", 7.5)
    c.setFillColor(GREY)
    c.drawString(M, 24, "Wealth Analyzer by Private Wealth Intelligence · Confidential")
    c.drawCentredString(W / 2, 24, "Produced by Momir Ivetic")
    c.drawRightString(W - M, 24, f"Page {page_no} of 4")
    c.setFillColor(INK)


def new_page(title=None):
    global y, page_no
    if page_no > 0:
        footer()
        c.showPage()
    page_no += 1
    y = H - M
    if page_no == 1:
        # Brand header bar
        c.setFillColor(BLUE)
        c.rect(0, H - 100, W, 100, stroke=0, fill=1)
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 24)
        c.drawString(M, H - 46, "WealthAnalyzer")
        c.setFont("Helvetica-Bold", 10)
        c.drawString(M + 200, H - 46, "by  PRIVATE  WEALTH  INTELLIGENCE")
        c.setFont("Helvetica", 10.5)
        c.drawString(M, H - 66, "Client Questionnaire — the starting point of your personal wealth analysis")
        c.setFillColor(INK)
        y = H - 100 - 26
    else:
        c.setFillColor(BLUE)
        c.rect(0, H - 40, W, 40, stroke=0, fill=1)
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 12)
        c.drawString(M, H - 26, "WealthAnalyzer")
        c.setFont("Helvetica", 8.5)
        c.drawString(M + 110, H - 26, "by Private Wealth Intelligence — Client Questionnaire")
        if title:
            c.setFont("Helvetica", 9.5)
            c.drawRightString(W - M, H - 26, title)
        c.setFillColor(INK)
        y = H - 40 - 26


def section(letter, label):
    global y
    y -= 6
    c.setFillColor(BLUE_L)
    c.rect(M, y - 7, CW, 20, stroke=0, fill=1)
    c.setFillColor(BLUE)
    c.rect(M, y - 7, 3, 20, stroke=0, fill=1)
    c.setFont("Helvetica-Bold", 10.5)
    c.drawString(M + 10, y - 1, f"{letter}.  {label}")
    c.setFillColor(INK)
    y -= 24


def note(text, size=8):
    global y
    c.setFont("Helvetica-Oblique", size)
    c.setFillColor(GREY)
    c.drawString(M, y, text)
    c.setFillColor(INK)
    y -= size + 5


def field_row(fields, row_h=24):
    """fields = list of (label, width_fraction). Draws label + write-in line."""
    global y
    x = M
    base = y - 12
    for label, frac in fields:
        w = CW * frac
        c.setFont("Helvetica", 8)
        c.setFillColor(GREY)
        c.drawString(x, base + 11, label)
        c.setFillColor(INK)
        c.setStrokeColor(LINE)
        c.setLineWidth(0.7)
        c.line(x, base, x + w - 14, base)
        x += w
    y = base - 12


def checkbox(x, yy, size=9):
    c.setStrokeColor(INK)
    c.setLineWidth(0.9)
    c.rect(x, yy, size, size, stroke=1, fill=0)


def check_list(items, cols=1, line_h=17, desc_offset=None):
    """items = list of (label, description-or-None)."""
    global y
    col_w = CW / cols
    rows = (len(items) + cols - 1) // cols
    for r in range(rows):
        for col in range(cols):
            i = r + col * rows
            if i >= len(items):
                continue
            label, desc = items[i]
            x = M + col * col_w
            checkbox(x, y - 9)
            c.setFont("Helvetica-Bold", 9)
            c.drawString(x + 14, y - 7, label)
            if desc:
                c.setFont("Helvetica", 8)
                c.setFillColor(GREY)
                off = desc_offset if desc_offset else (x + 14 + c.stringWidth(label, "Helvetica-Bold", 9) + 6)
                c.drawString(off, y - 7, desc)
                c.setFillColor(INK)
        y -= line_h


def table(headers, widths, n_rows, row_h=20):
    """Empty write-in table. widths = fractions of CW."""
    global y
    xs = [M]
    for f in widths:
        xs.append(xs[-1] + CW * f)
    # header
    c.setFillColor(BLUE)
    c.rect(M, y - 15, CW, 15, stroke=0, fill=1)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 8)
    for i, h in enumerate(headers):
        c.drawString(xs[i] + 4, y - 11, h)
    c.setFillColor(INK)
    y -= 15
    # rows
    c.setStrokeColor(LINE)
    c.setLineWidth(0.6)
    for r in range(n_rows):
        if r % 2 == 1:
            c.setFillColor(Color(0.965, 0.973, 0.99))
            c.rect(M, y - row_h, CW, row_h, stroke=0, fill=1)
            c.setFillColor(INK)
        c.line(M, y - row_h, M + CW, y - row_h)
        y -= row_h
    # verticals
    top = y + n_rows * row_h + 15
    for x in xs:
        c.line(x, top, x, y)
    c.line(M, top, M + CW, top)
    y -= 10


# ════════════════════════ PAGE 1 — HOUSEHOLD ════════════════════════
new_page()
c.setFont("Helvetica", 9)
c.setFillColor(GREY)
c.drawString(M, y, "Please complete as much as you can. Approximate figures are fine — they can be refined together later.")
y -= 13
c.drawString(M, y, "All amounts in your main currency unless noted. Fields marked (optional) may be left blank.")
c.setFillColor(INK)
y -= 16

section("A", "Client 1 — Primary")
field_row([("First name", 0.34), ("Last name", 0.34), ("Date of birth (DD.MM.YYYY)", 0.32)])
field_row([("Email (optional)", 0.5), ("Phone (optional)", 0.5)])
field_row([("Street address", 0.68), ("Postal / ZIP code", 0.32)])
field_row([("City", 0.34), ("State / Province / Canton", 0.34), ("Country of residence", 0.32)])

section("B", "Client 2 — Partner / Spouse  (leave blank if not applicable)")
field_row([("First name", 0.34), ("Last name", 0.34), ("Date of birth (DD.MM.YYYY)", 0.32)])
field_row([("Country of residence (if different)", 0.5), ("Relationship to Client 1", 0.5)])

section("C", "Children / Dependants")
table(["First name", "Last name", "Date of birth"], [0.4, 0.34, 0.26], 4, 19)

section("D", "Household Income  (per year, before tax)")
field_row([("Client 1 — salary / main income", 0.5), ("Client 1 — bonus / other income", 0.5)])
field_row([("Client 2 — salary / main income", 0.5), ("Client 2 — bonus / other income", 0.5)])
field_row([("Expected yearly raise (%)", 0.34), ("Annual savings target (amount you aim to put aside)", 0.66)])

# ═══════════ PAGE 2 — EXPENSES, ASSETS, LIABILITIES ═══════════
new_page("Expenses · Assets · Liabilities")

section("E", "Annual Living Expenses")
field_row([("Living expenses (housing, food, transport...)", 0.4), ("Insurance & health", 0.3), ("Other expenses", 0.3)])
field_row([("Main currency (e.g. CHF, EUR, USD)", 0.5), ("Approx. monthly rent / mortgage payment", 0.5)])

section("F", "Accounts & Assets")
note("List bank accounts, brokerage/custody accounts, pension or retirement accounts, crypto, etc. — one per row.")
table(["Description (e.g. UBS savings, 401(k), Pillar 3a)", "Type", "Country", "Current value"],
      [0.44, 0.2, 0.14, 0.22], 8, 19)
field_row([("Primary residence / property value (if owned)", 0.5), ("Other assets (car, art, collectibles...)", 0.5)])

section("G", "Loans & Liabilities")
table(["Loan type (mortgage, car, student...)", "Current balance", "Interest rate %", "Years left", "Monthly payment"],
      [0.32, 0.20, 0.14, 0.12, 0.22], 4, 19)

section("H", "Financial Goals")
note("E.g. retirement income, children's education, buying a home, a sabbatical. Priority: E = Essential, I = Important, A = Aspirational.")
table(["Goal", "Amount per year", "First year", "Last year", "Priority (E/I/A)"],
      [0.38, 0.2, 0.13, 0.13, 0.16], 5, 19)

# ═══════════ PAGE 3 — RETIREMENT & RISK ═══════════
new_page("Retirement · Risk Profile")

section("I", "Retirement")
field_row([("Client 1 — desired retirement age", 0.5), ("Client 2 — desired retirement age", 0.5)])
field_row([("Desired yearly spending in retirement (today's money)", 1.0)])
field_row([("Client 1 — expected pension / social security (source)", 0.55), ("Amount per year", 0.25), ("From age", 0.2)])
field_row([("Client 2 — expected pension / social security (source)", 0.55), ("Amount per year", 0.25), ("From age", 0.2)])

section("J", "Risk Profile — how would you describe yourself as an investor?  (tick ONE per client; mark C1 / C2)")
check_list([
    ("Very conservative",      "Protecting capital matters most; I accept very low returns."),
    ("Conservative",           "Mostly stability; small market swings are acceptable."),
    ("Moderately conservative","Some growth, but losses should stay limited."),
    ("Moderate",               "Balanced growth and risk; I can sit through normal downturns."),
    ("Moderately aggressive",  "Growth focus; I tolerate meaningful temporary losses."),
    ("Aggressive",             "High growth; large swings don't change my plan."),
    ("Very aggressive",        "Maximum growth; I accept the largest ups and downs."),
], cols=1, line_h=18, desc_offset=M + 150)
y -= 8

section("K", "Investment Time Horizon — when will you need most of this money?")
check_list([
    ("Under 5 years", None),
    ("5 – 10 years", None),
    ("10 – 20 years", None),
    ("More than 20 years", None),
], cols=4, line_h=18)
y -= 8

section("L", "Investing Experience  (optional)")
check_list([
    ("None — new to investing", None),
    ("Some — funds / ETFs", None),
    ("Experienced — stocks, bonds", None),
    ("Professional", None),
], cols=2, line_h=17)
y -= 8
field_row([("Current investments you'd like reviewed (tickers / fund names, optional)", 1.0)])

# ═══════════ PAGE 4 — TAX, NOTES, SIGNATURE ═══════════
new_page("Tax · Notes · Confirmation")

section("M", "Tax")
field_row([("Country of tax residence", 0.5), ("State / Province / Canton (for local tax)", 0.5)])
yy = y - 2
c.setFont("Helvetica", 9)
c.drawString(M, yy, "Include taxes in the wealth projections?")
checkbox(M + 215, yy - 2); c.drawString(M + 229, yy, "Yes")
checkbox(M + 270, yy - 2); c.drawString(M + 284, yy, "No")
y = yy - 22

section("N", "Anything else we should know?")
note("Expected inheritances, planned house purchase or sale, business ownership, stock options, special family circumstances...")
for _ in range(5):
    c.setStrokeColor(LINE)
    c.setLineWidth(0.7)
    c.line(M, y - 6, M + CW, y - 6)
    y -= 21

section("O", "Confirmation")
c.setFont("Helvetica", 8.5)
c.setFillColor(GREY)
for line in [
    "The information in this questionnaire is provided voluntarily and is used solely to prepare your personal wealth analysis.",
    "All figures are estimates for planning purposes; the resulting analysis is educational and does not constitute investment,",
    "tax, or legal advice. Your data is processed locally in the Wealth Analyzer application and is not shared with third parties.",
]:
    c.drawString(M, y, line)
    y -= 11
c.setFillColor(INK)
y -= 14

field_row([("Client 1 — signature", 0.55), ("Place / date", 0.45)])
y -= 6
field_row([("Client 2 — signature", 0.55), ("Place / date", 0.45)])
y -= 6
field_row([("Advisor (optional)", 0.55), ("Place / date", 0.45)])

footer()
c.save()
print("OK wrote", OUT)
