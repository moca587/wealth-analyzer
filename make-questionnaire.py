# -*- coding: utf-8 -*-
"""Generate the Wealth Analyzer client intake questionnaire PDF (4 pages, A4).

Paper-fillable form mirroring the app's data model, enriched with
goals-based-wealth-management intake questions (marital status, dependents'
relationship, per-account yearly contributions, current vs retirement tax
rates, retirement lifestyle E/I/A split) plus a dedicated Goals & Projected
Expenses page (per-goal priority continuum, owner, duration, trade-offs,
inflation assumption) and a firm disclosure block. Risk ladder: 5 levels.
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import Color, white
from reportlab.pdfgen import canvas

BLUE   = Color(0/255, 87/255, 184/255)      # app accent #0057b8
BLUE_L = Color(232/255, 240/255, 252/255)
INK    = Color(22/255, 33/255, 62/255)
GREY   = Color(120/255, 130/255, 150/255)
LINE   = Color(170/255, 185/255, 210/255)

W, H = A4
M = 46
CW = W - 2 * M
N_PAGES = 4

OUT = "Wealth-Analyzer-Client-Questionnaire.pdf"
c = canvas.Canvas(OUT, pagesize=A4)
c.setTitle("Wealth Analyzer by Private Wealth Intelligence - Client Questionnaire")
c.setAuthor("Private Wealth Intelligence")
c.setSubject("Client intake questionnaire for Wealth Analyzer by Private Wealth Intelligence")

y = 0
page_no = 0


def footer():
    c.setFont("Helvetica", 7.5)
    c.setFillColor(GREY)
    c.drawString(M, 24, "Wealth Analyzer by Private Wealth Intelligence · Confidential")
    c.drawCentredString(W / 2, 24, "Produced by Momir Ivetic")
    c.drawRightString(W - M, 24, f"Page {page_no} of {N_PAGES}")
    c.setFillColor(INK)


def new_page(title=None):
    global y, page_no
    if page_no > 0:
        footer()
        c.showPage()
    page_no += 1
    if page_no == 1:
        c.setFillColor(BLUE)
        c.rect(0, H - 96, W, 96, stroke=0, fill=1)
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 24)
        c.drawString(M, H - 44, "WealthAnalyzer")
        c.setFont("Helvetica-Bold", 10)
        c.drawString(M + 200, H - 44, "by  PRIVATE  WEALTH  INTELLIGENCE")
        c.setFont("Helvetica", 10.5)
        c.drawString(M, H - 64, "Client Questionnaire — the starting point of your personal wealth analysis")
        c.setFillColor(INK)
        y = H - 96 - 22
    else:
        c.setFillColor(BLUE)
        c.rect(0, H - 38, W, 38, stroke=0, fill=1)
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 12)
        c.drawString(M, H - 25, "WealthAnalyzer")
        c.setFont("Helvetica", 8.5)
        c.drawString(M + 110, H - 25, "by Private Wealth Intelligence — Client Questionnaire")
        if title:
            c.setFont("Helvetica", 9.5)
            c.drawRightString(W - M, H - 25, title)
        c.setFillColor(INK)
        y = H - 38 - 22


def section(letter, label):
    global y
    y -= 4
    c.setFillColor(BLUE_L)
    c.rect(M, y - 7, CW, 19, stroke=0, fill=1)
    c.setFillColor(BLUE)
    c.rect(M, y - 7, 3, 19, stroke=0, fill=1)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(M + 10, y - 1, f"{letter}.  {label}")
    c.setFillColor(INK)
    y -= 22


def note(text, size=7.6):
    global y
    c.setFont("Helvetica-Oblique", size)
    c.setFillColor(GREY)
    c.drawString(M, y, text)
    c.setFillColor(INK)
    y -= size + 4


def field_row(fields, gap=22):
    """fields = list of (label, width_fraction)."""
    global y
    x = M
    base = y - 11
    for label, frac in fields:
        w = CW * frac
        c.setFont("Helvetica", 7.6)
        c.setFillColor(GREY)
        c.drawString(x, base + 10, label)
        c.setFillColor(INK)
        c.setStrokeColor(LINE)
        c.setLineWidth(0.7)
        c.line(x, base, x + w - 12, base)
        x += w
    y = base - 11


def checkbox(x, yy, size=8.5):
    c.setStrokeColor(INK)
    c.setLineWidth(0.9)
    c.rect(x, yy, size, size, stroke=1, fill=0)


def inline_checks(prefix, items, item_w=None, bold=False, size=8.5):
    """One row: optional prefix text then evenly spaced checkbox+label items."""
    global y
    x = M
    if prefix:
        c.setFont("Helvetica", 8.5)
        c.drawString(x, y - 7, prefix)
        x += c.stringWidth(prefix, "Helvetica", 8.5) + 10
    avail = (M + CW) - x
    w = item_w if item_w else avail / len(items)
    for label in items:
        checkbox(x, y - 9)
        c.setFont("Helvetica-Bold" if bold else "Helvetica", size)
        c.drawString(x + 12.5, y - 7, label)
        x += w
    y -= 19


def check_list(items, line_h=15, desc_offset=None):
    global y
    for label, desc in items:
        checkbox(M, y - 9)
        c.setFont("Helvetica-Bold", 8.6)
        c.drawString(M + 13, y - 7, label)
        if desc:
            c.setFont("Helvetica", 7.8)
            c.setFillColor(GREY)
            off = desc_offset or (M + 13 + c.stringWidth(label, "Helvetica-Bold", 8.6) + 6)
            c.drawString(off, y - 7, desc)
            c.setFillColor(INK)
        y -= line_h


def table(headers, widths, n_rows, row_h=18):
    global y
    xs = [M]
    for f in widths:
        xs.append(xs[-1] + CW * f)
    c.setFillColor(BLUE)
    c.rect(M, y - 14, CW, 14, stroke=0, fill=1)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 7.6)
    for i, h in enumerate(headers):
        c.drawString(xs[i] + 4, y - 10, h)
    c.setFillColor(INK)
    y -= 14
    c.setStrokeColor(LINE)
    c.setLineWidth(0.6)
    for r in range(n_rows):
        if r % 2 == 1:
            c.setFillColor(Color(0.965, 0.973, 0.99))
            c.rect(M, y - row_h, CW, row_h, stroke=0, fill=1)
            c.setFillColor(INK)
        c.line(M, y - row_h, M + CW, y - row_h)
        y -= row_h
    top = y + n_rows * row_h + 14
    for x in xs:
        c.line(x, top, x, y)
    c.line(M, top, M + CW, top)
    y -= 8


def goal_block(n):
    """One Merrill-style goal block: name/owner, priority continuum,
    amount + timing, and per-goal trade-offs."""
    global y
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(BLUE)
    c.drawString(M, y - 2, f"Goal {n}")
    c.setFillColor(INK)
    y -= 10
    field_row([("Goal name", 0.46), ("Goal owner (C1 / C2 / Joint)", 0.27), ("Amount per year (today's money)", 0.27)])
    field_row([("First year (or age)", 0.27), ("Duration (number of years, or 'lifetime')", 0.37), ("Target amount or range (optional)", 0.36)])
    # Priority continuum — mark an X on the line
    c.setFont("Helvetica", 7.6)
    c.setFillColor(GREY)
    c.drawString(M, y - 6, "Priority — mark an X on the line:")
    c.setFillColor(INK)
    lx = M + 150
    rx = M + CW - 12
    ly = y - 9
    c.setStrokeColor(INK)
    c.setLineWidth(0.8)
    c.line(lx, ly, rx, ly)
    for t in (lx, (lx + rx) / 2, rx):
        c.line(t, ly - 3, t, ly + 3)
    c.setFont("Helvetica-Bold", 7.4)
    c.drawString(lx - 6, ly - 12, "Essential")
    c.drawCentredString((lx + rx) / 2, ly - 12, "Important")
    c.drawRightString(rx + 6, ly - 12, "Aspirational")
    y -= 28
    inline_checks("To pursue this goal I'd be willing to:", ["Retire later", "Reduce spending", "Save more", "Take more risk"], size=8)
    y -= 4


# ════════════════ PAGE 1 — YOU & YOUR INCOME ════════════════
new_page()
c.setFont("Helvetica", 8.6)
c.setFillColor(GREY)
c.drawString(M, y, "Please complete as much as you can — approximate figures are fine and can be refined together later.")
y -= 11
c.drawString(M, y, "All amounts per year, in your main currency, unless noted. Fields marked (optional) may be left blank.")
c.setFillColor(INK)
y -= 12

field_row([("Date", 0.25), ("Financial advisor / team (optional)", 0.45), ("Advisor phone / email (optional)", 0.30)])

section("A", "Client 1 — Primary")
field_row([("Full name (first, middle, last)", 0.46), ("Date of birth (DD.MM.YYYY)", 0.27), ("Planned retirement age", 0.27)])
field_row([("Street address", 0.46), ("City", 0.27), ("Postal / ZIP code", 0.27)])
field_row([("State / Province / Canton", 0.33), ("Country of residence", 0.33), ("Email / phone (optional)", 0.34)])
inline_checks("Marital status:", ["Single", "Married", "Dom. partner", "Separated", "Divorced", "Widowed"], size=8)

section("B", "Client 2 — Partner / Spouse  (leave blank if not applicable)")
field_row([("Full name (first, middle, last)", 0.46), ("Date of birth (DD.MM.YYYY)", 0.27), ("Planned retirement age", 0.27)])
field_row([("Country of residence (if different)", 0.5), ("Relationship to Client 1", 0.5)])

section("C", "Children & Dependants")
table(["Name (first and last)", "Date of birth", "Relationship"], [0.46, 0.27, 0.27], 3, 17)

section("D", "Income  (per year, before tax)")
field_row([("Client 1 — salary / main income", 0.34), ("Bonus / other income", 0.33), ("Other income duration (years)", 0.33)])
field_row([("Client 2 — salary / main income", 0.34), ("Bonus / other income", 0.33), ("Other income duration (years)", 0.33)])
field_row([("Expected yearly raise (%)", 0.34), ("Annual savings target", 0.33), ("Main currency (CHF, EUR, USD...)", 0.33)])

section("E", "Annual Living Expenses  (today)")
field_row([("Living (housing, food, transport...)", 0.34), ("Insurance & health", 0.33), ("Other expenses", 0.33)])

# ════════════════ PAGE 2 — ASSETS, LIABILITIES, RETIREMENT ════════════════
new_page("Assets · Liabilities · Retirement")

section("F", "Accounts & Assets")
note("One per row: bank, brokerage, pension/retirement accounts, crypto... Tax type: T = taxable, D = tax-deferred (401(k), Pillar 2), F = tax-free (Roth, Pillar 3a).")
table(["Description (e.g. UBS savings, Pillar 3a)", "Tax type (T/D/F)", "Country", "Current value", "Yearly contribution"],
      [0.34, 0.15, 0.11, 0.20, 0.20], 7, 17)
field_row([("Primary residence / property value (if owned)", 0.5), ("Other assets (car, art, collectibles...)", 0.5)])

section("G", "Loans & Liabilities")
table(["Loan type (mortgage, card, student...)", "Current balance", "Interest rate %", "Years left", "Monthly payment"],
      [0.32, 0.20, 0.14, 0.12, 0.22], 3, 17)

section("H", "Retirement")
note("Essential expenses are basics you need (housing, utilities, health care, food). Important are critical but flexible (e.g. education). Aspirational are wants (travel, gifts).")
field_row([("Desired yearly spending in retirement (today's money)", 0.5), ("Of that: % Essential", 0.17), ("% Important", 0.16), ("% Aspirational", 0.17)])
field_row([("Client 1 — pension / social security (source)", 0.5), ("Amount per year", 0.27), ("From age", 0.23)])
field_row([("Client 2 — pension / social security (source)", 0.5), ("Amount per year", 0.27), ("From age", 0.23)])

# ════════════════ PAGE 3 — GOALS & PROJECTED EXPENSES ════════════════
new_page("Goals & Projected Expenses")

section("I", "Goals & Projected Expenses")
inline_checks("How do you feel about your financial picture?  I have:", ["Not enough money", "Just enough", "More than enough"], size=8)
note("Think about what's important to you — retirement lifestyle, education, a home, travel, helping family. List each goal below;")
note("your advisor will use these to identify, define, and prioritize your goals and track your progress toward them.")
y -= 4

goal_block(1)
goal_block(2)
goal_block(3)
goal_block(4)

c.setFont("Helvetica", 7.6)
c.setFillColor(GREY)
c.drawString(M, y - 4, "Inflation: unless you specify an assumption below, a standard annual inflation rate is used to adjust goal amounts and income sources over time.")
c.setFillColor(INK)
y -= 14
field_row([("Inflation assumption (% per year — leave blank for standard)", 0.5), ("Attach additional sheets for more goals", 0.5)])

# ════════════════ PAGE 4 — RISK, TAX, DISCLOSURE ════════════════
new_page("Risk · Tax · Disclosure")

section("J", "Risk Profile — how would you describe yourself as an investor?  (tick ONE; C1 left box / C2 right)")
profiles = [
    ("Conservative",            "Stability first; small market swings are acceptable."),
    ("Moderately conservative", "Some growth, but losses should stay limited."),
    ("Moderate",                "Balanced growth and risk; I can sit through normal downturns."),
    ("Moderately aggressive",   "Growth focus; I tolerate meaningful temporary losses."),
    ("Aggressive",              "High growth; large swings don't change my plan."),
]
c.setFont("Helvetica-Bold", 7); c.setFillColor(GREY)
c.drawString(M + 1, y - 1, "C1"); c.drawString(M + 19, y - 1, "C2")
c.setFillColor(INK)
y -= 8
for label, desc in profiles:
    checkbox(M, y - 9); checkbox(M + 18, y - 9)
    c.setFont("Helvetica-Bold", 8.6)
    c.drawString(M + 32, y - 7, label)
    c.setFont("Helvetica", 7.8)
    c.setFillColor(GREY)
    c.drawString(M + 170, y - 7, desc)
    c.setFillColor(INK)
    y -= 15
y -= 10

section("K", "Time Horizon & Experience")
inline_checks("Money mostly needed in:", ["Under 5 years", "5 - 10 years", "10 - 20 years", "Over 20 years"], size=8)
inline_checks("Investing experience:", ["None", "Some (funds/ETFs)", "Experienced", "Professional"], size=8)

section("L", "Tax")
field_row([("Country of tax residence", 0.5), ("State / Province / Canton (for local tax)", 0.5)])
field_row([("Income tax — current rate (%)", 0.25), ("Expected in retirement (%)", 0.25), ("Capital gains — current rate (%)", 0.25), ("Expected in retirement (%)", 0.25)])
yy = y - 1
c.setFont("Helvetica", 8.5)
c.drawString(M, yy, "Include taxes in the wealth projections?")
checkbox(M + 200, yy - 2); c.drawString(M + 213, yy, "Yes")
checkbox(M + 248, yy - 2); c.drawString(M + 261, yy, "No")
y = yy - 18

section("M", "Anything else we should know?")
note("Expected inheritances, planned property purchase or sale, business ownership, stock options, special family circumstances...")
for _ in range(2):
    c.setStrokeColor(LINE)
    c.setLineWidth(0.7)
    c.line(M, y - 5, M + CW, y - 5)
    y -= 18

section("N", "Disclosure")
c.setFont("Helvetica", 7.4)
c.setFillColor(GREY)
for line in [
    "Private Wealth Intelligence provides this questionnaire and the resulting Wealth Analyzer report for educational and financial-planning purposes only. They do",
    "not constitute investment, legal, tax, or accounting advice, nor an offer or solicitation to buy or sell any security or financial instrument. Projections - including",
    "Monte Carlo simulations - are hypothetical, rely on assumptions and on the information you provide, and do not predict or guarantee future results; actual",
    "outcomes will differ. Neither Private Wealth Intelligence nor its representatives provide legal or tax advice - please consult your own legal and/or tax advisor",
    "before making financial decisions. The information you provide is treated as confidential and is used solely to prepare your personal analysis.",
]:
    c.drawString(M, y, line)
    y -= 9.5
y -= 4
strip_w = (CW - 16) / 3
labels = ["Not insured by any government agency", "No bank or firm guarantee", "Investments may lose value"]
x = M
c.setFont("Helvetica-Bold", 7.4)
for lbl in labels:
    c.setStrokeColor(INK)
    c.setLineWidth(0.8)
    c.rect(x, y - 14, strip_w, 16, stroke=1, fill=0)
    c.drawCentredString(x + strip_w / 2, y - 9, lbl)
    x += strip_w + 8
c.setFillColor(INK)
y -= 26

c.setFont("Helvetica", 8.2)
c.drawString(M, y, "I confirm the information provided is accurate to the best of my knowledge and I have read the disclosure above.")
y -= 22
field_row([("Client 1 — signature", 0.38), ("Client 2 — signature", 0.38), ("Place / date", 0.24)])

footer()
c.save()
print("OK wrote", OUT)
