// Generates: INTRODUCER-ADVISOR-AGREEMENT-US.docx  (bulletproof version)
// Font: Times New Roman throughout
// No em/en dashes (replaced with commas, colons, "to")
// US business English
const path = require('path');
const fs   = require('fs');
const dPath = 'C:\\Users\\moca5\\AppData\\Roaming\\npm\\node_modules';
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, PageOrientation, LevelFormat, HeadingLevel,
  BorderStyle, WidthType, ShadingType, PageBreak, PageNumber,
  Header, Footer, TabStopType, TabStopPosition
} = require(dPath + '\\docx');

// ─────────────────────────────────────────────────────────────
// Style helpers
// ─────────────────────────────────────────────────────────────
const FONT = 'Times New Roman';
const BODY = 24;   // half-points → 12pt
const H1SZ = 32;   // 16pt
const H2SZ = 28;   // 14pt
const H3SZ = 24;   // 12pt bold

function runs(text, extra = {}) {
  return [new TextRun({ text, font: FONT, size: BODY, ...extra })];
}
function P(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120, line: 300, ...(opts.spacing || {}) },
    alignment: opts.alignment,
    children: runs(text, opts.run || {}),
  });
}
function PR(parts, opts = {}) {
  return new Paragraph({
    spacing: { after: 120, line: 300, ...(opts.spacing || {}) },
    alignment: opts.alignment,
    children: parts.map(p =>
      new TextRun({ font: FONT, size: BODY, ...p })
    ),
  });
}
function H1(text) {
  return new Paragraph({
    spacing: { before: 320, after: 180 },
    children: [new TextRun({ text, font: FONT, size: H1SZ, bold: true })],
  });
}
function H2(text) {
  return new Paragraph({
    spacing: { before: 260, after: 140 },
    children: [new TextRun({ text, font: FONT, size: H2SZ, bold: true })],
  });
}
function TITLE(text) {
  return new Paragraph({
    spacing: { before: 240, after: 240 },
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text, font: FONT, size: 40, bold: true })],
  });
}
function ITAL(text) {
  return new Paragraph({
    spacing: { after: 120, line: 300 },
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text, font: FONT, size: BODY, italics: true })],
  });
}
function BLANK() {
  return new Paragraph({ children: [new TextRun({ text: '', font: FONT, size: BODY })] });
}
function HR() {
  return new Paragraph({
    spacing: { before: 120, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '888888', space: 1 } },
    children: [new TextRun({ text: '', font: FONT, size: BODY })],
  });
}

function TCELL(text, opts = {}) {
  const border = { style: BorderStyle.SINGLE, size: 4, color: '888888' };
  return new TableCell({
    borders: { top: border, bottom: border, left: border, right: border },
    width: { size: opts.width || 4680, type: WidthType.DXA },
    shading: opts.shade
      ? { fill: opts.shade, type: ShadingType.CLEAR, color: 'auto' }
      : undefined,
    margins: { top: 100, bottom: 100, left: 140, right: 140 },
    verticalAlign: 'center',
    children: [
      new Paragraph({
        alignment: opts.alignment || AlignmentType.LEFT,
        children: [new TextRun({
          text,
          font: FONT,
          size: BODY,
          bold: !!opts.bold,
        })],
      }),
    ],
  });
}

// ─────────────────────────────────────────────────────────────
// Document content
// ─────────────────────────────────────────────────────────────
const children = [];

children.push(TITLE('Introducer and Advisor Agreement'));
children.push(ITAL('Working draft. For review and discussion prior to signature.'));
children.push(ITAL('Version: [Date]'));
children.push(BLANK());

children.push(PR([
  { text: 'Note before signature: ', bold: true },
  { text: 'This is a discussion draft designed to reflect the commercial understanding between the parties. Before signature, both sides should have it reviewed by their own Swiss counsel, particularly the compensation mechanics (sections 4 through 6), the attribution mechanics (section 3), the anti-corruption and compliance clauses (sections 11 and 20), the warranties and indemnities (sections 19 and 21), and the Advisor’s independent contractor and self-employment status (section 12). Nothing in this draft creates any binding obligation until countersigned by both parties.' },
], { spacing: { after: 200 } }));

children.push(HR());

// PARTIES
children.push(H1('Parties'));
children.push(P('This Introducer and Advisor Agreement (the “Agreement”) is entered into between:'));
children.push(BLANK());

children.push(PR([{ text: 'Private Wealth Intelligence GmbH', bold: true }, { text: ' (in formation)' }]));
children.push(P('[Registered office / c/o address]'));
children.push(P('CH-[postal code] Zurich, Switzerland'));
children.push(PR([{ text: 'Represented by: ' }, { text: 'Momir Ivetic', bold: true }, { text: ', Founder and Managing Director' }]));
children.push(P('(hereinafter “PWI”)'));
children.push(BLANK());
children.push(P('and'));
children.push(BLANK());
children.push(PR([{ text: 'Petros Diamantogiannis', bold: true }]));
children.push(P('[Address]'));
children.push(P('[Country]'));
children.push(P('(hereinafter the “Advisor”)'));
children.push(BLANK());
children.push(P('Each a “Party” and together the “Parties.”'));

children.push(PR([
  { text: 'Note: ', italics: true, bold: true },
  { text: 'If PWI has not yet been entered into the Commercial Register at the time of signature, this Agreement is signed by Momir Ivetic personally on behalf of PWI in formation, and is automatically assigned to PWI GmbH upon its registration. The Advisor consents to this assignment.', italics: true },
]));

// RECITALS
children.push(H1('Recitals'));
children.push(PR([{ text: 'A. ', bold: true }, { text: 'PWI develops and commercializes “Wealth Analyzer,” a browser-based Monte Carlo financial planning software product (the “Software”) and adjacent services.' }]));
children.push(PR([{ text: 'B. ', bold: true }, { text: 'The Advisor holds a professional network in the enterprise banking software and wealth management sector, including in particular relationships with senior representatives at Avaloq Group AG and other enterprise potential customers.' }]));
children.push(PR([{ text: 'C. ', bold: true }, { text: 'The Parties wish to formalize a commercial arrangement under which the Advisor introduces PWI to enterprise prospects and provides strategic advisory support on the resulting relationships, in exchange for a tiered revenue share and milestone bonuses on customers he sources, without granting equity or ownership rights in PWI.' }]));
children.push(PR([{ text: 'D. ', bold: true }, { text: 'This Agreement sets out the terms on which the Advisor is engaged as an independent contractor.' }]));

// 1. DEFINITIONS  (EXPANDED)
children.push(H1('1. Definitions'));
children.push(P('For the purposes of this Agreement:'));

const def = (term, body) => children.push(PR([
  { text: term, bold: true },
  { text: ' means ' + body },
]));

def('“Advisor Introduction”', 'a written introduction (by email, in-person meeting with follow-up written confirmation, or comparable documented means) from the Advisor to a named individual at a Prospective Customer, satisfying the requirements of section 3.1 and confirmed to PWI in writing within five (5) Business Days of the introduction.');

def('“Affiliate”', 'in relation to any person, any entity that directly or indirectly controls, is controlled by, or is under common control with that person, where “control” means the direct or indirect ownership of more than 50% of the voting rights, share capital, or equivalent economic interest.');

def('“AML Laws”', 'the Swiss Anti-Money-Laundering Act (AMLA) and all other applicable anti-money-laundering, counter-terrorist-financing, and know-your-customer laws and regulations.');

def('“Anti-Bribery Laws”', 'all applicable anti-bribery and anti-corruption laws, including but not limited to the Swiss Criminal Code (in particular Arts. 322septies and 322octies), the U.S. Foreign Corrupt Practices Act (FCPA), the U.K. Bribery Act 2010, and their respective implementing regulations.');

def('“Attribution Window”', 'the period of twelve (12) months starting on the date the Advisor Introduction is delivered to the named individual, during which a Qualifying Contract must be signed for that Prospective Customer to become an Attributed Customer.');

def('“Attributed Customer”', 'a Prospective Customer that (i) was the subject of a valid Advisor Introduction, (ii) was Materially Caused by that Advisor Introduction to enter into commercial discussions with PWI, and (iii) signed a Qualifying Contract with PWI within the Attribution Window. Once attributed, the customer (and its Affiliates that become party to related Qualifying Contracts) remains an Attributed Customer for the full Revenue Share Period, regardless of later renewals, extensions, or expansions.');

def('“Attributable Revenue”', 'Net Revenue received by PWI from Attributed Customers under Qualifying Contracts and any renewals, expansions, upsells, and add-on modules of those contracts, during the Revenue Share Period.');

def('“Business Day”', 'any day other than a Saturday, Sunday, or public holiday in Zurich, Switzerland.');

def('“Change of Control”', 'any transaction or series of related transactions resulting in (i) a person (or group acting in concert) acquiring more than 50% of the voting rights or share capital of a Party, (ii) the sale of all or substantially all of the business or assets of a Party, or (iii) a merger, consolidation, or similar reorganization producing an equivalent result.');

def('“Confidential Information”', 'all non-public information of a Party disclosed to the other Party, whether marked confidential or not, including in particular: business plans; product roadmaps; source code and technical specifications; pricing and commercial terms; customer identities, negotiations, and contracts; financial information; the terms and existence of this Agreement (except as permitted by section 13.4); and any other information that a reasonable person would consider confidential.');

def('“Materially Caused”', 'that the Advisor Introduction was the primary and reasonably necessary trigger of PWI’s commercial discussions with the Prospective Customer. An introduction is not Materially Caused where PWI had, prior to the Advisor Introduction, (i) an existing commercial relationship with the Prospective Customer, (ii) an active documented sales opportunity, or (iii) prior substantive written contact traceable to a directly sourced lead.');

def('“Net Revenue”', 'gross revenue actually collected by PWI from an Attributed Customer, less: (i) applicable VAT and other pass-through taxes, (ii) refunds, credit notes, and chargebacks, and (iii) direct third-party pass-through costs mandatorily deducted at the point of sale (for example, payment processing fees or marketplace commissions imposed by a distribution partner). For clarity, PWI’s own operating costs, staff salaries, cost of goods, marketing expenses, and general overheads are not deducted.');

def('“Prospective Customer”', 'an enterprise entity that (i) meets the eligibility requirements set out in section 3, and (ii) is not, at the date of the Advisor Introduction, an existing PWI customer, an active PWI sales opportunity, or subject to prior substantive written contact traceable to a directly sourced lead. Non-limiting examples of eligible categories include: Avaloq Group AG and its Affiliates; Temenos, Finnova, ERI Bancaire, and other core banking software vendors; Swiss and international private banks; family offices; and wealth-tech and RegTech firms.');

def('“Qualifying Contract”', 'a legally binding contract signed with an Attributed Customer for the paid supply of the Software, related services, subscriptions, integrations, or licenses, with a first-year committed value of at least CHF 20,000, entered into on arms-length terms.');

def('“Restricted Business”', 'the business of developing, marketing, distributing, or selling browser-based or on-premise financial planning, Monte Carlo wealth projection, or goals-based wealth analysis software targeted at Swiss or international private banks, wealth managers, or family offices, and directly and materially competitive with the Software.');

def('“Revenue Share Period”', 'in respect of each Attributed Customer, the period of seven (7) years starting on the date PWI issues the first paid invoice under the first Qualifying Contract with that customer.');

def('“Sanctioned Person”', 'any person, entity, or country that is (i) listed on any sanctions list maintained by the Swiss State Secretariat for Economic Affairs (SECO), the U.S. Office of Foreign Assets Control (OFAC), the European Union, or the United Nations Security Council, or (ii) owned or controlled 50% or more by any such listed person or entity.');

// 2. THE ADVISOR'S ROLE
children.push(H1('2. The Advisor’s Role'));
children.push(P('2.1 The Advisor’s role under this Agreement combines two functions:'));
children.push(PR([{ text: '(a) Introducer: ', bold: true }, { text: 'identifying and introducing PWI to Prospective Customers, using the Advisor’s own network and professional standing, in a manner that is timely, warm, and Materially Caused.' }]));
children.push(PR([{ text: '(b) Advisor: ', bold: true }, { text: 'providing ongoing strategic advisory support with respect to Attributed Customers throughout the commercial cycle, including but not limited to: attending or supporting sales meetings on reasonable request, sharing informed commentary on customer dynamics, and helping PWI navigate the customer relationship.' }]));
children.push(P('2.2 The Advisor shall perform the services with reasonable care, skill, and diligence, in a professional manner, and in accordance with all applicable laws. The Advisor commits to a reasonable and good-faith effort. The Parties acknowledge that enterprise sales cycles typically span 6 to 18 months and that no minimum activity, revenue outcome, or number of introductions is guaranteed by the Advisor.'));
children.push(P('2.3 The Advisor does not hold authority to bind PWI, negotiate commercial terms on PWI’s behalf, sign contracts, make pricing commitments, or make legally binding representations to any Prospective Customer. Any such statements must be expressly authorized by PWI in writing on a case by case basis. Any unauthorized commitment made by the Advisor is void as against PWI and is the sole responsibility of the Advisor.'));
children.push(P('2.4 The Advisor does not have any development, product management, product support, engineering, employment, or fiduciary role with PWI, and shall make no representation to the contrary.'));

// 3. INTRODUCTIONS AND ATTRIBUTION  (TIGHTENED)
children.push(H1('3. Introductions and Attribution'));
children.push(P('3.1 For an introduction to qualify as an Advisor Introduction, all of the following must be satisfied:'));
children.push(P('(a) it is documented in writing (email or equivalent);'));
children.push(P('(b) it is made to a specifically named individual at the Prospective Customer, not to a general company address or generic function inbox;'));
children.push(P('(c) it is accompanied by, or immediately followed by, a written notice to PWI (delivered no later than five (5) Business Days after the introduction) identifying the Prospective Customer, the named individual, the individual’s role, and the date of introduction;'));
children.push(P('(d) at the date of introduction, the Prospective Customer meets the eligibility requirements in the definition of “Prospective Customer”; and'));
children.push(P('(e) the introduction is Materially Caused, evidenced by documented follow-up between PWI and the named individual within ninety (90) days of the introduction.'));
children.push(P('3.2 PWI will maintain a shared “Introductions Register”: a simple ledger listing each Advisor Introduction, its date, the Prospective Customer, the named contact, and the status of any follow-up. PWI will share the Introductions Register with the Advisor no less than quarterly. Entries in the Introductions Register are presumed accurate absent written objection by the Advisor within thirty (30) days of receipt.'));
children.push(P('3.3 If PWI is already in active discussions with a Prospective Customer at the time of an Advisor Introduction, PWI will inform the Advisor within fourteen (14) days and the introduction shall not create an attribution claim. PWI will provide reasonable evidence (for example, dated correspondence, CRM entries, or prior meeting records) sufficient to establish prior contact. In the case of a good-faith dispute over prior contact, the Parties shall attempt to resolve the dispute in good faith within thirty (30) days; failing agreement, the matter is subject to the dispute-resolution mechanics of section 18.'));
children.push(P('3.4 After the end of the Attribution Window, if no Qualifying Contract has been signed with the Prospective Customer, that Advisor Introduction lapses and no revenue share arises. The Advisor may make a fresh Advisor Introduction to the same customer at any later date, restarting a new Attribution Window, provided the requirements of section 3.1 are again satisfied.'));
children.push(P('3.5 An Advisor Introduction may be attributed to only one commercial arrangement between the Parties at any time. Duplicate or overlapping claims by the Advisor for the same Prospective Customer or transaction are not permitted.'));

// 4. TIERED REVENUE SHARE
children.push(H1('4. Compensation: Tiered Revenue Share'));
children.push(P('4.1 In consideration of the services under section 2, PWI shall pay the Advisor a revenue share on Attributable Revenue, calculated on a cumulative lifetime basis across all Attributed Customers under the following tiered structure:'));

children.push(new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [5760, 3600],
  rows: [
    new TableRow({ children: [
      TCELL('Cumulative Attributable Revenue (lifetime, all customers)', { width: 5760, shade: 'DCE6F1', bold: true }),
      TCELL('Advisor’s share', { width: 3600, shade: 'DCE6F1', bold: true, alignment: AlignmentType.CENTER }),
    ]}),
    new TableRow({ children: [
      TCELL('CHF 0 to 1,000,000', { width: 5760 }),
      TCELL('22%', { width: 3600, alignment: AlignmentType.CENTER, bold: true }),
    ]}),
    new TableRow({ children: [
      TCELL('CHF 1,000,001 to 3,000,000', { width: 5760 }),
      TCELL('17%', { width: 3600, alignment: AlignmentType.CENTER, bold: true }),
    ]}),
    new TableRow({ children: [
      TCELL('Above CHF 3,000,000', { width: 5760 }),
      TCELL('12%', { width: 3600, alignment: AlignmentType.CENTER, bold: true }),
    ]}),
  ],
}));
children.push(BLANK());
children.push(P('4.2 For clarity: the tiers apply to cumulative Attributable Revenue across all Attributed Customers combined, not per customer. Each incremental CHF of Attributable Revenue is compensated at the tier applicable to the cumulative total at the time PWI collects that revenue.'));
children.push(P('4.3 The revenue share applies to renewals, expansions, upsells, add-on modules, additional users, additional entities within the same corporate group, and other extensions of the initial Qualifying Contract with an Attributed Customer, provided the corresponding Net Revenue is collected within that customer’s Revenue Share Period. Contracts with Affiliates of an Attributed Customer are included where the Affiliate becomes a party to, or a beneficiary of, the same or a related Qualifying Contract chain.'));
children.push(P('4.4 The revenue share is calculated only on Net Revenue actually collected by PWI. Uncollected receivables, bad debts, refunded amounts, and chargebacks do not trigger a revenue share; where a revenue share has already been paid on amounts subsequently refunded or written off, the corresponding amount is credited against future amounts payable to the Advisor or, if none is expected to arise within twelve (12) months, invoiced back to the Advisor.'));
children.push(P('4.5 Non-cash consideration. Where PWI receives non-cash consideration (for example, equity, credits, or barter) as consideration for a Qualifying Contract, that consideration is valued at fair market value at the time of receipt, and included in Net Revenue on that basis. Where fair market value is disputed, the Parties shall obtain a third-party valuation at PWI’s cost, binding on both Parties absent manifest error.'));
children.push(P('4.6 Reseller and marketplace transactions. Where PWI sells the Software through a reseller, marketplace, or distribution partner, Net Revenue is the net amount actually collected by PWI after the deduction of the reseller or marketplace share, not the gross customer-paid price.'));

// 5. MILESTONE BONUSES
children.push(H1('5. Compensation: Milestone Bonuses'));
children.push(P('In addition to the revenue share under section 4, PWI shall pay the Advisor the following one-time milestone bonuses, each payable once during the term of this Agreement:'));

children.push(new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [6300, 3060],
  rows: [
    new TableRow({ children: [
      TCELL('Milestone', { width: 6300, shade: 'DCE6F1', bold: true }),
      TCELL('Bonus', { width: 3060, shade: 'DCE6F1', bold: true, alignment: AlignmentType.CENTER }),
    ]}),
    new TableRow({ children: [
      TCELL('Signature of the first Qualifying Contract with any Attributed Customer', { width: 6300 }),
      TCELL('CHF 15,000', { width: 3060, alignment: AlignmentType.CENTER, bold: true }),
    ]}),
    new TableRow({ children: [
      TCELL('Cumulative Attributable Revenue reaches CHF 250,000', { width: 6300 }),
      TCELL('CHF 35,000', { width: 3060, alignment: AlignmentType.CENTER, bold: true }),
    ]}),
    new TableRow({ children: [
      TCELL('Cumulative Attributable Revenue reaches CHF 1,000,000', { width: 6300 }),
      TCELL('CHF 75,000', { width: 3060, alignment: AlignmentType.CENTER, bold: true }),
    ]}),
  ],
}));
children.push(BLANK());
children.push(P('Each milestone bonus is payable within thirty (30) days of the milestone being met. If a milestone is triggered by a payment later refunded or written off, the corresponding milestone bonus is repayable to PWI (or netted against future amounts payable to the Advisor).'));

// 6. PAYMENT TERMS  (STRENGTHENED)
children.push(H1('6. Payment Terms and Set-Off'));
children.push(P('6.1 The revenue share is calculated and paid quarterly in arrears. Within thirty (30) days after the end of each calendar quarter, PWI will send the Advisor a written statement setting out, for that quarter:'));
children.push(P('(a) Attributable Revenue collected during the quarter, itemized by Attributed Customer;'));
children.push(P('(b) the running cumulative Attributable Revenue and the applicable tier(s);'));
children.push(P('(c) the amount of revenue share payable for the quarter;'));
children.push(P('(d) any adjustments (for example, refunds, chargebacks, corrections, set-off amounts); and'));
children.push(P('(e) any milestone bonus triggered during the quarter.'));
children.push(P('6.2 The Advisor shall invoice PWI for the amounts shown in the statement within a reasonable time, and PWI shall pay the invoice within thirty (30) days of receipt, subject to the invoice complying with applicable formal, tax, and VAT requirements and to the set-off rights in section 6.7.'));
children.push(P('6.3 All amounts are in Swiss Francs (CHF). Amounts collected by PWI in other currencies are converted to CHF at PWI’s applicable accounting exchange rate for the relevant period, using the mid-market rate as of the last business day of the quarter.'));
children.push(P('6.4 All amounts are stated exclusive of any VAT and other taxes that may be owed by the Advisor. Where the Advisor is subject to VAT, the invoice shall separately show VAT.'));
children.push(P('6.5 Payment shall be made by SEPA or SIC bank transfer to a bank account nominated by the Advisor in writing.'));
children.push(P('6.6 In case of undisputed late payment by PWI, default interest of 5% per annum under Art. 104 CO applies from the date the invoice was due, without further notice being required.'));
children.push(P('6.7 Right to withhold and set off. PWI is entitled to withhold or set off, against amounts otherwise payable to the Advisor under this Agreement, any of the following: (i) amounts owed by the Advisor to PWI under this Agreement (including refunds under section 4.4, milestone repayments under section 5, indemnity claims under section 21, and audit shortfalls); (ii) amounts subject to a bona fide dispute, until the dispute is resolved; and (iii) amounts equal to withholding taxes or social-security contributions that any competent authority requires PWI to withhold. Where PWI withholds under (ii), PWI shall promptly release any amount ultimately determined to be owed to the Advisor, with default interest at 5% per annum from the original due date.'));

// 7. PREFERRED CHANNEL STATUS  (TIGHTENED)
children.push(H1('7. Preferred Channel Status'));
children.push(P('7.1 During the term of this Agreement, and provided that the Advisor is Actively Engaged (as defined below), PWI shall not:'));
children.push(P('(a) engage another external introducer, finder, agent, or channel partner on materially similar economic terms with respect to enterprise customers in the banking software and wealth management sector, without first offering the Advisor a reasonable opportunity (not less than sixty (60) days) to source the same customer; or'));
children.push(P('(b) hire a dedicated internal enterprise business development or channel partnerships lead without giving the Advisor at least ninety (90) days’ prior written notice.'));
children.push(P('7.2 “Actively Engaged” means that the Advisor has delivered at least one bona-fide Advisor Introduction of a Prospective Customer that satisfies the requirements of section 3.1 in each rolling six-month period. If the Advisor is not Actively Engaged for two (2) consecutive six-month periods, PWI may, on thirty (30) days’ written notice, terminate the Advisor’s preferred channel status without affecting any other right, including revenue share on Attributed Customers already in place.'));
children.push(P('7.3 For clarity, PWI remains fully free to (i) sell the Software directly to any customer sourced by PWI’s own efforts, (ii) run inbound marketing and advertising, (iii) sell via any online store, marketplace, or distribution channel, and (iv) engage engineering, product, marketing, or support staff of any nature.'));

// 8. NON-SOLICITATION  (STRENGTHENED)
children.push(H1('8. Non-Solicitation and Non-Competition'));
children.push(P('8.1 Competing software during the term. During the term of this Agreement, the Advisor shall not knowingly introduce, promote, or actively facilitate the sale of any software product forming part of the Restricted Business to any Attributed Customer, Prospective Customer, or PWI customer.'));
children.push(P('8.2 Non-solicitation of PWI customers (post-termination). For a period of twelve (12) months after termination or expiry of this Agreement, the Advisor shall not, directly or indirectly, solicit, entice away, or attempt to solicit or entice away, any Attributed Customer or other PWI customer with which the Advisor had material contact during the term, for any purpose involving the Restricted Business or any product materially competitive with the Software.'));
children.push(P('8.3 Non-solicitation of PWI personnel (post-termination). For a period of twelve (12) months after termination or expiry of this Agreement, the Advisor shall not, directly or indirectly, solicit for employment or engage as a contractor any person who was an employee, director, or contractor of PWI at any point in the twelve (12) months prior to termination. General public advertising not specifically targeting PWI personnel is not a breach of this section.'));
children.push(P('8.4 For clarity, this section 8 does not prevent the Advisor from (i) accepting other consulting or advisory roles, including in the broader financial services sector, provided they do not involve the Restricted Business, (ii) working with core banking, CRM, portfolio management, or other adjacent software vendors that are not directly and materially competitive with the Software, or (iii) informing customers about alternatives if directly asked and it would be a breach of professional duty to remain silent.'));
children.push(P('8.5 The restrictions in this section 8 are agreed by the Parties to be reasonable in scope, duration, and geography, given the specialized nature of the market, the value of PWI’s customer relationships, and the compensation payable to the Advisor. The Advisor acknowledges that these restrictions are a material inducement for PWI to enter into this Agreement.'));

// 9. TERM  (ENHANCED)
children.push(H1('9. Term and Termination'));
children.push(P('9.1 This Agreement takes effect on [effective date] (the “Effective Date”).'));
children.push(P('9.2 The Agreement is entered into for an initial term of three (3) years from the Effective Date, automatically renewing for successive one-year terms, unless either Party gives written notice of non-renewal at least ninety (90) days before the end of the then-current term.'));
children.push(P('9.3 Either Party may terminate the Agreement:'));
children.push(P('(a) at any time by giving the other Party ninety (90) days’ prior written notice;'));
children.push(P('(b) with immediate effect for cause, in the event of a material breach by the other Party that is not cured within thirty (30) days of written notice describing the breach in reasonable detail (or, where the breach is incapable of cure, without a cure period);'));
children.push(P('(c) with immediate effect on the other Party’s insolvency, filing for bankruptcy, appointment of a liquidator or receiver, moratorium, composition with creditors, or comparable proceeding under any applicable law;'));
children.push(P('(d) with immediate effect for a breach of the anti-corruption obligations (section 11), the compliance obligations (section 20), or the confidentiality obligations (section 13); or'));
children.push(P('(e) by the Advisor on a Change of Control of PWI, provided the Advisor gives written notice within thirty (30) days of becoming aware of the Change of Control. In that case, the Advisor’s right to revenue share and milestone bonuses on Attributed Customers already in place at the effective date of termination continues in accordance with sections 4 through 6 and 10.1.'));
children.push(P('9.4 Death or permanent incapacity of the Advisor. On the death or permanent incapacity of the Advisor, this Agreement terminates automatically. Amounts already accrued and payable at the date of termination are payable to the Advisor’s estate or legal successors, and rights to revenue share and milestone bonuses on Attributed Customers already in place continue for the remaining Revenue Share Period, subject to the Advisor’s estate providing PWI with reasonable identification of the entitled recipient and any documents necessary for payment.'));

// 10. CONSEQUENCES OF TERMINATION
children.push(H1('10. Consequences of Termination'));
children.push(P('10.1 Upon termination or expiry of this Agreement, the Advisor’s right to receive revenue share and any earned but unpaid milestone bonuses on Attributed Customers already in place at the date of termination survives and continues throughout the applicable Revenue Share Period of each such customer, subject to the terms of sections 4 through 6 and to the clawback and set-off rights in this Agreement.'));
children.push(P('10.2 No new Advisor Introductions may be made after termination, and no attribution may arise from any introduction made after the termination date.'));
children.push(P('10.3 Termination for cause by PWI following a material and uncured breach by the Advisor (in particular, a breach of section 11 (Anti-Corruption), section 13 (Confidentiality), section 19 (Warranties), or section 20 (Compliance)) entitles PWI, in addition to any other remedy: (i) to suspend all further payments; (ii) to require the Advisor to repay any revenue share or milestone bonus already paid in respect of transactions tainted by the breach; and (iii) to recover from the Advisor all costs, damages, and reasonable legal fees arising from the breach.'));
children.push(P('10.4 On termination for any reason, the Advisor shall promptly (i) return or destroy all Confidential Information in the Advisor’s possession, at PWI’s option, and certify in writing that this has been done; (ii) cease all representations of any advisory relationship with PWI; and (iii) transition his active files and open matters back to PWI in an orderly manner.'));
children.push(P('10.5 Sections 6.7 (Set-Off), 8 (Non-Solicitation and Non-Competition), 10 (Consequences of Termination), 11 (Anti-Corruption), 13 (Confidentiality), 14 (Intellectual Property), 15 (Data Protection), 16 (Records and Audit), 18 (Governing Law and Jurisdiction), 19 (Warranties), 20 (Compliance with Laws), 21 (Indemnification), 22 (Liability), 25 (Injunctive Relief), and any provision expressly stated to survive, survive termination or expiry of this Agreement.'));

// 11. ANTI-CORRUPTION  (STRENGTHENED)
children.push(H1('11. Anti-Corruption and Ethical Conduct'));
children.push(P('11.1 The Advisor confirms and warrants that:'));
children.push(P('(a) all consideration payable under this Agreement is due exclusively to the Advisor in his personal capacity, or through a commercial entity wholly owned and controlled by the Advisor and disclosed to PWI in writing;'));
children.push(P('(b) no portion of any payment under this Agreement has been, is being, or will be onward-paid, shared, gifted, or otherwise made available, directly or indirectly, to any employee, director, agent, officer, family member, or connected person of any Prospective Customer or Attributed Customer, including but not limited to the “senior Avaloq employee” and any equivalent contact at any other Prospective Customer;'));
children.push(P('(c) no benefit, favor, gift, entertainment, or other advantage (in excess of ordinary business courtesies of a modest value permitted by applicable Anti-Bribery Laws) has been or will be provided by the Advisor to any such person in connection with facilitating an introduction, decision, or transaction;'));
children.push(P('(d) the Advisor will disclose to PWI any actual or apparent conflict of interest that could reasonably affect the Advisor’s introductions or advice, promptly upon becoming aware of it; and'));
children.push(P('(e) the Advisor is not a “politically exposed person” (PEP) or family member of a PEP whose engagement would expose PWI to enhanced due-diligence obligations, and will notify PWI promptly if that status changes.'));
children.push(P('11.2 PWI reserves the right, in serious commercial discussions with a Prospective Customer, to disclose the existence and structure of this Agreement to that customer’s compliance function or equivalent, where PWI reasonably considers it appropriate. The Advisor consents to such disclosure and agrees to cooperate.'));
children.push(P('11.3 Audit rights on Advisor’s records. Once per calendar year, on at least thirty (30) days’ prior written notice, PWI (or an independent auditor bound by professional confidentiality) may inspect the Advisor’s records solely to verify compliance with sections 11.1 and 20. The audit shall be conducted during normal business hours, at PWI’s cost, save where the audit reveals a material breach of this Agreement, in which case the Advisor shall bear the reasonable cost of the audit.'));
children.push(P('11.4 Cooperation with investigations. The Advisor shall cooperate reasonably with any internal or external investigation, regulatory inquiry, or audit relating to compliance with Anti-Bribery Laws, AML Laws, or sanctions, in each case at no cost to PWI, and shall promptly provide any information reasonably requested.'));
children.push(P('11.5 A breach of sections 11.1 through 11.4 constitutes a material breach permitting immediate termination for cause under section 9.3(d), and entitles PWI to recover any payments made in respect of transactions tainted by the breach, plus all costs, damages, and reasonable legal fees.'));

// 12. INDEPENDENT CONTRACTOR STATUS  (STRENGTHENED)
children.push(H1('12. Independent Contractor Status, Tax, and Insurance'));
children.push(P('12.1 The Advisor is engaged as an independent contractor and is not, and shall not be treated as, an employee, worker, agent (in a legally binding sense), officer, or partner of PWI. The Advisor is not entitled to any employee benefits (including holiday pay, sick pay, pension contributions, unemployment insurance, or occupational-accident coverage) from PWI.'));
children.push(P('12.2 The Advisor is solely responsible for:'));
children.push(P('(a) registering with the relevant Swiss social security authorities as Selbstaendigerwerbender (self-employed), or invoicing PWI through his own commercial entity;'));
children.push(P('(b) paying all applicable income tax, social security contributions (AHV, IV, EO, BVG, KTG, and similar), and VAT (MWST) attributable to payments under this Agreement; and'));
children.push(P('(c) maintaining his own insurance coverage as required by law and prudence.'));
children.push(P('12.3 The Advisor confirms his self-employment or business status by providing PWI, before the first invoice is paid, with a copy of his valid registration as Selbstaendigerwerbender with the competent SVA (or comparable non-Swiss registration), or evidence of the commercial entity through which he will invoice. The Advisor covenants to maintain such registration throughout the term of this Agreement and to notify PWI promptly of any change in status.'));
children.push(P('12.4 If the Advisor’s tax or social security status is subsequently reclassified by any competent authority such that PWI becomes liable for social security contributions on payments already made, the Advisor shall indemnify and hold PWI harmless for any such contributions, plus interest, penalties, and reasonable legal fees, save where the reclassification results from PWI’s own contractual arrangement or instructions.'));
children.push(P('12.5 Professional liability insurance. From the date PWI reasonably requests, and throughout the term of this Agreement, the Advisor shall maintain professional liability (errors and omissions) insurance with a reputable insurer with a per-claim limit of not less than CHF 500,000. The Advisor shall provide PWI with a certificate of insurance on written request.'));
children.push(P('12.6 The Advisor is free to render services to third parties in parallel, subject to the limitations set out in sections 8 and 11.'));

// 13. CONFIDENTIALITY  (STRENGTHENED)
children.push(H1('13. Confidentiality'));
children.push(P('13.1 Each Party shall treat as strictly confidential all Confidential Information of the other Party. Confidential Information shall be used only for the purposes of this Agreement and shall not be disclosed to any third party without the prior written consent of the disclosing Party, save as expressly permitted by this section 13.'));
children.push(P('13.2 The receiving Party shall apply at least the same standard of care to protect the Confidential Information as it applies to its own confidential information of similar sensitivity, and in any event no less than a reasonable standard of care.'));
children.push(P('13.3 The confidentiality obligation continues for five (5) years after termination or expiry of this Agreement. Confidential Information that qualifies as a trade secret remains protected for as long as it retains that status.'));
children.push(P('13.4 Excluded from the confidentiality obligation is information that (i) is already publicly known through no breach of this Agreement, (ii) was already known to the receiving Party without a duty of confidence, (iii) has been independently developed without use of the disclosing Party’s Confidential Information, or (iv) must be disclosed to comply with mandatory law, court order, or a regulatory obligation (in which case the disclosing Party will, where lawful, notify the other Party in advance and cooperate with any lawful attempts to limit or resist disclosure).'));
children.push(P('13.5 The Advisor may disclose the existence of this Agreement and his role in general terms (for example, on his professional CV or public profile), but shall not disclose commercial terms, revenue figures, customer identities, or the identity of Attributed Customers.'));
children.push(P('13.6 Return or destruction. On termination or on the disclosing Party’s written request, the receiving Party shall promptly return or, at the disclosing Party’s option, destroy all Confidential Information in the receiving Party’s possession or control, and certify in writing that this has been done. The receiving Party may retain (i) one copy for legal or regulatory record-keeping purposes, and (ii) automated backup copies that cannot reasonably be deleted, in each case subject to the continuing confidentiality obligations of this section 13.'));
children.push(P('13.7 Breach notification. Each Party shall notify the other in writing without undue delay upon becoming aware of any actual or suspected breach of this section 13 or any unauthorized access to Confidential Information, and shall cooperate reasonably to investigate and mitigate the breach.'));

// 14. INTELLECTUAL PROPERTY
children.push(H1('14. Intellectual Property'));
children.push(P('14.1 All intellectual property in and to the Software, PWI’s brand, its marketing materials, its documentation, and its client-facing outputs remains the exclusive property of PWI or its licensors.'));
children.push(P('14.2 The Advisor is granted no license or right to the Software or PWI’s trademarks beyond a personal, non-transferable, non-sublicensable right to use and demonstrate the Software as reasonably required to perform his services under this Agreement. No implied licenses are granted.'));
children.push(P('14.3 The Advisor shall not use, register, or attempt to register any name, trademark, domain name, or social media handle that is identical or confusingly similar to PWI, “Private Wealth Intelligence,” “Wealth Analyzer,” or any of PWI’s trademarks.'));
children.push(P('14.4 Any strategic input, feedback, ideas, or suggestions provided by the Advisor to PWI shall be non-confidential and freely usable by PWI without compensation beyond that provided under this Agreement. The Advisor hereby assigns to PWI, to the extent legally permissible, all intellectual property rights in any such feedback.'));

// 15. DATA PROTECTION
children.push(H1('15. Data Protection'));
children.push(P('15.1 Each Party shall comply with the Swiss Federal Act on Data Protection (revFADP or nDSG) and, where applicable, the EU General Data Protection Regulation (GDPR).'));
children.push(P('15.2 Where the Advisor obtains any personal data of PWI representatives or Prospective Customers in the course of his work, he shall process it strictly for the purposes of this Agreement, apply reasonable technical and organizational safeguards, and not share it with any third party without lawful basis.'));
children.push(P('15.3 On PWI’s reasonable written request, the Parties shall promptly enter into a data-processing agreement in a form reasonably required by applicable data-protection law.'));
children.push(P('15.4 Each Party shall notify the other in writing without undue delay of any personal data breach known to it that involves the other Party’s data or representatives.'));

// 16. RECORDS AND AUDIT
children.push(H1('16. Records and Audit'));
children.push(P('16.1 PWI shall maintain accurate books and records of all Attributable Revenue for the duration of the Revenue Share Period for each Attributed Customer, plus three (3) years thereafter.'));
children.push(P('16.2 The Advisor shall maintain accurate records of Advisor Introductions, communications with Prospective Customers, and any actual or potential conflicts of interest, for the duration of this Agreement plus three (3) years thereafter.'));
children.push(P('16.3 Once per calendar year, on at least thirty (30) days’ prior written notice, the Advisor may appoint an independent Swiss-qualified auditor (bound by professional confidentiality) to review PWI’s records relevant to the calculation of amounts payable under this Agreement.'));
children.push(P('16.4 The audit is at the Advisor’s cost, save where the audit reveals an underpayment of more than 5% of the amount actually due for the period audited, in which case PWI shall bear the reasonable cost of the audit and pay the shortfall plus default interest at 5% per annum.'));
children.push(P('16.5 The Advisor may not appoint an auditor that (i) has an ongoing business or personal relationship with any Attributed Customer or Prospective Customer, or (ii) is a direct competitor of PWI.'));

// 17. GENERAL PROVISIONS
children.push(H1('17. General Provisions'));
children.push(PR([{ text: '17.1 Entire Agreement. ', bold: true }, { text: 'This Agreement (together with any exhibits) contains the entire agreement between the Parties on its subject matter and replaces any prior understandings, whether oral or written.' }]));
children.push(PR([{ text: '17.2 Amendments. ', bold: true }, { text: 'Any amendment must be in writing and signed by both Parties (or their duly authorized representatives). Email exchanges do not constitute an amendment unless expressly agreed in writing to that effect. Any purported oral modification is void.' }]));
children.push(PR([{ text: '17.3 Assignment. ', bold: true }, { text: 'Neither Party may assign or transfer its rights or obligations under this Agreement without the prior written consent of the other Party, which shall not be unreasonably withheld. Notwithstanding the foregoing, PWI may assign this Agreement to (i) an Affiliate of PWI, or (ii) a successor entity in connection with a Change of Control or a sale of all or substantially all of its business or assets, provided the assignee assumes all obligations toward the Advisor in writing.' }]));
children.push(PR([{ text: '17.4 Notices. ', bold: true }, { text: 'Notices under this Agreement shall be in writing and sent by email (with confirmation of receipt) or by registered post to the addresses shown in the preamble, or such other address as either Party may notify to the other in writing. Notices are deemed received (i) on delivery when sent by hand, (ii) on the next Business Day when sent by email, provided no “undeliverable” message is received, or (iii) three (3) Business Days after posting when sent by registered post within Switzerland (seven (7) Business Days for cross-border post).' }]));
children.push(PR([{ text: '17.5 Force Majeure. ', bold: true }, { text: 'Neither Party shall be liable for failure to perform its obligations under this Agreement to the extent that performance is prevented by events beyond its reasonable control, including natural disasters, war, terrorism, large-scale cyberattacks or ransomware incidents, government measures, pandemics, sanctions and export-control actions, and material failures of essential infrastructure or third-party providers, provided that the affected Party gives prompt notice and uses reasonable efforts to mitigate the effect.' }]));
children.push(PR([{ text: '17.6 Severability. ', bold: true }, { text: 'If any provision of this Agreement is held to be invalid or unenforceable, the remaining provisions shall remain in full force and effect and the Parties shall replace the invalid provision with a valid one that reflects the original commercial intent as closely as possible.' }]));
children.push(PR([{ text: '17.7 No Waiver. ', bold: true }, { text: 'Failure or delay by either Party to enforce any right does not constitute a waiver of that right. Any waiver must be in writing and signed by the waiving Party.' }]));
children.push(PR([{ text: '17.8 Electronic Signature and Counterparts. ', bold: true }, { text: 'This Agreement may be executed in counterparts, each of which is an original and all of which together constitute one and the same instrument. The Parties agree that this Agreement may be validly executed by qualified electronic signature (Swiss ZertES / EU eIDAS) or advanced electronic signature, and that scanned or photographed handwritten signatures transmitted by email are also valid and binding for the purposes of this Agreement.' }]));
children.push(PR([{ text: '17.9 Interpretation. ', bold: true }, { text: 'Headings are for convenience only and do not affect interpretation. Words in the singular include the plural and vice versa. “Including” means “including without limitation.” References to statutes are to the statute as amended or replaced from time to time. No rule of construction against the drafting Party applies.' }]));
children.push(PR([{ text: '17.10 No Partnership. ', bold: true }, { text: 'Nothing in this Agreement creates a partnership, joint venture, or fiduciary relationship between the Parties. Neither Party has authority to bind the other except as expressly provided in this Agreement.' }]));
children.push(PR([{ text: '17.11 Publicity. ', bold: true }, { text: 'Neither Party shall issue any public press release, marketing statement, or promotional material referring to the other Party or to this Agreement, or use the other Party’s name or logo, without the other Party’s prior written consent. This section 17.11 does not restrict the Advisor’s disclosure permitted under section 13.5.' }]));

// 18. GOVERNING LAW  (ENHANCED)
children.push(H1('18. Governing Law, Dispute Resolution, and Jurisdiction'));
children.push(P('18.1 This Agreement is governed by, and shall be construed in accordance with, the substantive laws of Switzerland, to the exclusion of its rules of conflict of laws and to the exclusion of the United Nations Convention on Contracts for the International Sale of Goods (CISG).'));
children.push(P('18.2 Negotiation and mediation. In the event of any dispute arising from or in connection with this Agreement, the Parties shall first attempt in good faith to resolve the dispute through direct negotiation between senior representatives of each Party. If the dispute is not resolved within thirty (30) days, either Party may refer the dispute to mediation under the Swiss Rules of Commercial Mediation of the Swiss Chambers’ Arbitration Institution. The mediation shall take place in Zurich in English, unless the Parties otherwise agree.'));
children.push(P('18.3 Jurisdiction. If the dispute is not resolved by mediation within sixty (60) days from the request for mediation, or if either Party declines to participate in mediation, the exclusive place of jurisdiction for the dispute is Zurich, Switzerland.'));
children.push(P('18.4 Language. The proceedings shall be conducted in English or German, at the choice of the claimant.'));
children.push(P('18.5 Notwithstanding the foregoing, either Party may apply to any competent court for interim, provisional, or protective measures, including injunctive relief, in respect of any breach or threatened breach of section 8 (Non-Solicitation), section 11 (Anti-Corruption), section 13 (Confidentiality), section 14 (Intellectual Property), or section 20 (Compliance), without first attempting negotiation or mediation.'));

// 19. WARRANTIES AND REPRESENTATIONS  (NEW)
children.push(H1('19. Warranties and Representations'));
children.push(P('19.1 The Advisor represents and warrants to PWI, on the Effective Date and on a continuing basis throughout the term of this Agreement, that:'));
children.push(P('(a) the Advisor has full right, authority, and capacity to enter into and perform this Agreement;'));
children.push(P('(b) execution and performance of this Agreement does not conflict with, or breach, any agreement, obligation, undertaking, or duty of the Advisor to any third party, including any employer, prior client, or confidentiality obligation;'));
children.push(P('(c) the Advisor has no undisclosed material conflict of interest that would affect his ability to perform his obligations under this Agreement;'));
children.push(P('(d) the Advisor is not currently subject to any regulatory proceedings, judgments, or restrictions that materially affect his ability to perform this Agreement;'));
children.push(P('(e) all information provided by the Advisor to PWI in connection with the negotiation and execution of this Agreement is true, accurate, and not misleading in any material respect;'));
children.push(P('(f) the Advisor has, or will obtain, all licenses, permits, and registrations required by law to perform his obligations under this Agreement, including in relation to Selbstaendigerwerbender status per section 12; and'));
children.push(P('(g) the Advisor and, to his knowledge, his family members are not Sanctioned Persons.'));
children.push(P('19.2 PWI represents and warrants to the Advisor, on the Effective Date and on a continuing basis, that:'));
children.push(P('(a) PWI has full right, authority, and capacity to enter into and perform this Agreement;'));
children.push(P('(b) execution and performance of this Agreement does not conflict with, or breach, any agreement or obligation of PWI to any third party;'));
children.push(P('(c) PWI owns or is properly licensed to use the Software and the intellectual property associated with it in a manner sufficient to grant the rights and perform the obligations set out in this Agreement; and'));
children.push(P('(d) PWI is not a Sanctioned Person.'));
children.push(P('19.3 Each Party shall notify the other in writing without undue delay of any event or circumstance that makes any of its warranties or representations no longer true or accurate.'));

// 20. COMPLIANCE WITH LAWS  (NEW)
children.push(H1('20. Compliance with Laws, Sanctions, and Export Controls'));
children.push(P('20.1 Each Party shall comply with all laws, regulations, and orders applicable to it in connection with the performance of this Agreement, including Anti-Bribery Laws, AML Laws, competition and antitrust laws, data-protection laws, tax laws, and applicable export-control and sanctions laws (including those of Switzerland, the European Union, the United Kingdom, and the United States).'));
children.push(P('20.2 Each Party warrants that it will not, directly or indirectly, engage in any transaction under this Agreement with or for the benefit of a Sanctioned Person, or in violation of applicable sanctions or export-control laws.'));
children.push(P('20.3 If a Party becomes a Sanctioned Person, or if performance of this Agreement would violate applicable sanctions or export-control laws, the other Party may suspend performance and, if the situation is not remedied within thirty (30) days, terminate this Agreement for cause with immediate effect.'));
children.push(P('20.4 Each Party shall promptly notify the other in writing of any actual or threatened investigation, enforcement action, or civil claim relating to compliance with Anti-Bribery Laws, AML Laws, or sanctions that could reasonably affect this Agreement.'));

// 21. INDEMNIFICATION  (NEW)
children.push(H1('21. Indemnification'));
children.push(P('21.1 Advisor indemnity. The Advisor shall indemnify, defend, and hold harmless PWI, its officers, employees, and Affiliates against all losses, damages, claims, penalties, and reasonable legal fees arising out of, or in connection with:'));
children.push(P('(a) any breach by the Advisor of the anti-corruption obligations in section 11, the compliance obligations in section 20, the confidentiality obligations in section 13, or the warranties in section 19.1;'));
children.push(P('(b) any claim by a third party (including a tax or social-security authority) that arises out of the Advisor’s status as an employee, worker, or partner of PWI, or that arises from the reclassification described in section 12.4;'));
children.push(P('(c) any unauthorized statement or commitment made by the Advisor to a Prospective Customer or third party in breach of section 2.3; and'));
children.push(P('(d) any negligent or wilful act or omission of the Advisor in connection with this Agreement.'));
children.push(P('21.2 PWI indemnity. PWI shall indemnify, defend, and hold harmless the Advisor against all losses, damages, claims, and reasonable legal fees arising out of any third-party claim that the Software or PWI’s use of the Software infringes the intellectual property rights of that third party, save where the infringement arises from (i) modifications to the Software not made by PWI, (ii) combination of the Software with materials not supplied or approved by PWI, or (iii) the Advisor’s breach of this Agreement.'));
children.push(P('21.3 Procedure. The Party seeking indemnity (the “Indemnified Party”) shall (i) notify the other Party (the “Indemnifying Party”) promptly of any claim, (ii) allow the Indemnifying Party to control the defense and settlement (provided the settlement does not impose non-monetary obligations on the Indemnified Party without its consent), and (iii) provide reasonable cooperation at the Indemnifying Party’s cost.'));

// 22. LIABILITY  (NEW)
children.push(H1('22. Limitation of Liability'));
children.push(P('22.1 Neither Party excludes or limits its liability for (i) death or personal injury caused by its negligence, (ii) fraud or fraudulent misrepresentation, (iii) gross negligence or wilful misconduct, or (iv) any other liability that cannot lawfully be excluded or limited under Swiss law.'));
children.push(P('22.2 Subject to section 22.1, and save in respect of a Party’s indemnity obligations under section 21 or a Party’s breach of sections 8 (Non-Solicitation), 11 (Anti-Corruption), 13 (Confidentiality), 14 (Intellectual Property), or 20 (Compliance), each Party’s aggregate liability to the other under or in connection with this Agreement is limited to the greater of (i) the total amounts paid or payable by PWI to the Advisor under this Agreement in the twelve (12) months immediately preceding the event giving rise to the claim, or (ii) CHF 100,000.'));
children.push(P('22.3 Subject to section 22.1, neither Party is liable to the other for any (i) loss of profits, (ii) loss of revenue, (iii) loss of business or business opportunity, (iv) loss of anticipated savings, or (v) indirect, consequential, or punitive loss.'));

// 23. NOTICES CONTACT LIST  (NEW SMALL SECTION)
children.push(H1('23. Notices Contact Details'));
children.push(P('Legal notices under this Agreement shall be sent to the following addresses (each Party may update its details by notice to the other):'));
children.push(BLANK());
children.push(PR([{ text: 'For PWI:', bold: true }]));
children.push(P('Attention: Momir Ivetic, Founder / Managing Director'));
children.push(P('Address: [Registered office / c/o address], CH-[postal code] Zurich, Switzerland'));
children.push(P('Email (legal notices): [legal@…]'));
children.push(P('Email (operational): [ops@…]'));
children.push(BLANK());
children.push(PR([{ text: 'For the Advisor:', bold: true }]));
children.push(P('Petros Diamantogiannis'));
children.push(P('Address: [Address], [Country]'));
children.push(P('Email: [email@…]'));

// 24. INJUNCTIVE RELIEF (moved up from earlier draft)
children.push(H1('24. Acknowledgment of Irreparable Harm'));
children.push(P('The Advisor acknowledges that any breach of sections 8 (Non-Solicitation), 11 (Anti-Corruption), 13 (Confidentiality), 14 (Intellectual Property), or 20 (Compliance) may cause irreparable harm to PWI for which monetary damages would be an inadequate remedy. Accordingly, PWI is entitled, without prejudice to any other remedy, to seek and obtain interim, provisional, protective, and injunctive relief from any court of competent jurisdiction in relation to any actual or threatened breach of those sections, without the need to post bond or prove actual damages.'));

// 25. INJUNCTIVE RELIEF placeholder as reference in survival — but redundant with 24 above
// (Keeping single section)

// SIGNATURES
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(H1('Signatures'));
children.push(P('The Parties have signed this Agreement in two originals, one for each Party, or by qualified electronic signature under section 17.8.'));
children.push(BLANK());
children.push(PR([{ text: 'For Private Wealth Intelligence GmbH (in formation)', bold: true }]));
children.push(BLANK()); children.push(BLANK());
children.push(P('______________________________________'));
children.push(PR([{ text: 'Momir Ivetic', bold: true }]));
children.push(P('Founder / Managing Director'));
children.push(P('Place, date: _______________________'));
children.push(BLANK()); children.push(BLANK());
children.push(PR([{ text: 'Petros Diamantogiannis', bold: true }]));
children.push(BLANK()); children.push(BLANK());
children.push(P('______________________________________'));
children.push(P('Place, date: _______________________'));

// EXHIBIT A
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(H1('Exhibit A: Introductions Register (template)'));
children.push(ITAL('To be maintained jointly by the Parties. Updated at least quarterly.'));
children.push(BLANK());

const exAHeader = ['#','Date of Introduction','Prospective Customer','Named Contact (Title)','Written Record','Attribution Window Ends','Status','Signed Qualifying Contract? (Date)','Notes'];
const exACols = [500, 1100, 1400, 1200, 900, 1200, 900, 1200, 960];
children.push(new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: exACols,
  rows: [
    new TableRow({ tableHeader: true, children: exAHeader.map((t,i)=>TCELL(t,{width:exACols[i],shade:'DCE6F1',bold:true,alignment:AlignmentType.CENTER})) }),
    ...Array.from({length:4}).map(()=>new TableRow({ children: exACols.map(w=>TCELL(' ', {width:w})) })),
  ],
}));

// EXHIBIT B
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(H1('Exhibit B: Sample Quarterly Revenue Share Statement'));
children.push(ITAL('Illustrative only. Actual statements will be provided by PWI to the Advisor within 30 days of quarter-end per section 6.1.'));
children.push(BLANK());

const exBHeader = ['Attributed Customer','Qualifying Contract signed','First invoice','Revenue Share Period ends','Net Revenue this quarter (CHF)','Cumulative Attributable Revenue to date (CHF)','Applicable tier','Revenue share this quarter (CHF)'];
const exBCols = [1400, 1200, 1000, 1200, 1200, 1300, 900, 1160];
children.push(new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: exBCols,
  rows: [
    new TableRow({ tableHeader: true, children: exBHeader.map((t,i)=>TCELL(t,{width:exBCols[i],shade:'DCE6F1',bold:true,alignment:AlignmentType.CENTER})) }),
    new TableRow({ children: ['[Customer A]', ' ', ' ', ' ', ' ', ' ', ' ', ' '].map((t,i)=>TCELL(t,{width:exBCols[i]})) }),
    new TableRow({ children: ['[Customer B]', ' ', ' ', ' ', ' ', ' ', ' ', ' '].map((t,i)=>TCELL(t,{width:exBCols[i]})) }),
    new TableRow({ children: exBCols.map((w,i)=>TCELL(i===0?'Subtotal (revenue share)':' ', {width:w,bold:i===0,shade:'F2F2F2'})) }),
    new TableRow({ children: exBCols.map((w,i)=>TCELL(i===0?'Plus: milestone bonus triggered this quarter':' ', {width:w,shade:'F2F2F2'})) }),
    new TableRow({ children: exBCols.map((w,i)=>TCELL(i===0?'Total due to Advisor this quarter':' ', {width:w,bold:true,shade:'DCE6F1'})) }),
  ],
}));

children.push(BLANK());
children.push(ITAL('End of Agreement.'));

// ─────────────────────────────────────────────────────────────
// Build & save
// ─────────────────────────────────────────────────────────────
const doc = new Document({
  creator: 'Private Wealth Intelligence GmbH',
  title: 'Introducer and Advisor Agreement',
  styles: {
    default: {
      document: {
        run: { font: FONT, size: BODY },
        paragraph: { spacing: { after: 120, line: 300 } },
      },
    },
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 }, // US Letter
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'Introducer and Advisor Agreement    |    Page ', font: FONT, size: 20, color: '888888' }),
              new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 20, color: '888888' }),
              new TextRun({ text: ' of ', font: FONT, size: 20, color: '888888' }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, size: 20, color: '888888' }),
            ],
          }),
        ],
      }),
    },
    children,
  }],
});

const outPath = 'D:\\Claude PWA\\legal\\INTRODUCER-ADVISOR-AGREEMENT-US.docx';
Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(outPath, buf);
  console.log('OK  wrote  ' + outPath + '  (' + (buf.length/1024).toFixed(1) + ' KB)');
}).catch(err => { console.error('FAIL', err); process.exit(1); });
