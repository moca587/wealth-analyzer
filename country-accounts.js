// ════════════════════════════════════════════════════════════════════
// COUNTRY_ACCOUNTS — comprehensive per-country account taxonomy
// Coverage: every eurozone member individually, plus the existing
// 19 countries enriched with more account types where material.
// Structure per country:
//   {flag, name, groups:[{group, accounts:[{value, label, note, liquid, withdrawAge?}]}]}
// ════════════════════════════════════════════════════════════════════
const COUNTRY_ACCOUNTS = {

// ─── UNITED STATES ────────────────────────────────────────────────
US:{flag:"🇺🇸",name:"United States",groups:[
{group:"Cash & banking",accounts:[
  {value:"checking",label:"Checking account",note:"Standard transactional account. FDIC insured up to $250k per depositor.",liquid:true},
  {value:"savings",label:"Savings account",note:"Interest-bearing deposit. FDIC insured up to $250k.",liquid:true},
  {value:"money_market",label:"Money market account (MMA)",note:"Higher-yield savings with check-writing. FDIC insured.",liquid:true},
  {value:"mmf",label:"Money market fund (MMF)",note:"SEC-regulated short-term debt fund. Not FDIC-insured but Treasury-style yields.",liquid:true},
  {value:"cd",label:"Certificate of deposit (CD)",note:"Fixed-term deposit. FDIC insured. Early withdrawal penalty.",liquid:false},
  {value:"treasury_bills",label:"Treasury bills / direct TreasuryDirect",note:"Short-term government debt. State-tax-exempt interest.",liquid:true},
  {value:"i_bonds",label:"Series I Savings Bonds",note:"$10k/yr cap. Inflation-linked. Tax-deferred. 1-year minimum hold.",liquid:false},
  {value:"hysab",label:"High-yield savings (online bank)",note:"FDIC insured online savings — typically 4-5% APY.",liquid:true}
]},
{group:"Investment accounts",accounts:[
  {value:"brokerage",label:"Taxable brokerage account",note:"General investment account. Capital gains taxed; long-term at 0/15/20%.",liquid:true},
  {value:"529",label:"529 college savings plan",note:"State-sponsored. Tax-advantaged education savings. Qualified withdrawals tax-free.",liquid:false},
  {value:"esa",label:"Coverdell ESA",note:"Education savings account. $2,000/yr limit. Tax-free qualified withdrawals.",liquid:false},
  {value:"hsa",label:"HSA (Health Savings Account)",note:"Triple tax-advantaged. Contributions, growth & qualified medical withdrawals all tax-free.",liquid:false,withdrawAge:65},
  {value:"utma",label:"UGMA/UTMA custodial account",note:"Minor's account. Kiddie tax applies. Becomes child's at age of majority.",liquid:true},
  {value:"abletrust",label:"ABLE account (special needs)",note:"For disability-related expenses. State-sponsored. $18,000/yr.",liquid:false}
]},
{group:"Retirement accounts",accounts:[
  {value:"401k",label:"401(k) — Traditional",note:"Employer-sponsored plan. Pre-tax contributions. 2024 limit: $23,000 (+$7,500 catch-up at 50).",liquid:false,withdrawAge:59.5},
  {value:"roth_401k",label:"Roth 401(k)",note:"After-tax employer plan. Tax-free qualified withdrawals.",liquid:false,withdrawAge:59.5},
  {value:"403b",label:"403(b) (non-profit / educators)",note:"For schools, hospitals, non-profits. Similar limits to 401(k).",liquid:false,withdrawAge:59.5},
  {value:"457b",label:"457(b) plan (gov't / non-profit)",note:"Government & non-profit deferred comp. Combined separate limit from 401(k).",liquid:false,withdrawAge:0},
  {value:"ira",label:"Traditional IRA",note:"Pre-tax contributions. 2024 limit: $7,000 (+$1,000 catch-up at 50).",liquid:false,withdrawAge:59.5},
  {value:"roth_ira",label:"Roth IRA",note:"After-tax IRA. Tax-free qualified withdrawals. Income limits apply.",liquid:false,withdrawAge:59.5},
  {value:"sep_ira",label:"SEP-IRA (self-employed)",note:"Up to 25% of compensation or $69,000 in 2024.",liquid:false,withdrawAge:59.5},
  {value:"simple_ira",label:"SIMPLE IRA (small business)",note:"Up to $16,000/yr (2024) + employer match.",liquid:false,withdrawAge:59.5},
  {value:"solo_401k",label:"Solo 401(k)",note:"For self-employed with no employees. Up to $69,000/yr.",liquid:false,withdrawAge:59.5},
  {value:"pension_db",label:"Defined benefit pension",note:"Employer-funded guaranteed monthly benefit.",liquid:false,withdrawAge:65},
  {value:"cash_balance",label:"Cash balance pension plan",note:"Hybrid DB/DC. Stated account balance + guaranteed return.",liquid:false,withdrawAge:65},
  {value:"social_security",label:"Social Security (estimated annual)",note:"Government retirement benefit. Enter estimated annual amount.",liquid:false,withdrawAge:67}
]},
{group:"Other assets",accounts:[
  {value:"annuity_fixed",label:"Fixed annuity",note:"Insurance product with guaranteed periodic payments.",liquid:false,withdrawAge:59.5},
  {value:"annuity_var",label:"Variable annuity",note:"Insurance wrapper around mutual funds. Tax-deferred growth.",liquid:false,withdrawAge:59.5},
  {value:"life_insurance",label:"Permanent life insurance (cash value)",note:"Whole/universal/VUL. Tax-deferred cash value growth.",liquid:false},
  {value:"crypto",label:"Cryptocurrency",note:"Digital assets. Taxed as property; capital gains apply.",liquid:true},
  {value:"precious_metals",label:"Physical precious metals",note:"Gold, silver, platinum bullion/coins. Collectible CGT.",liquid:true},
  {value:"private_equity",label:"Private equity / VC fund interest",note:"Limited partnership in private fund.",liquid:false},
  {value:"reit_private",label:"Private REIT / real estate fund",note:"Non-traded REIT or private real-estate fund.",liquid:false},
  {value:"other_asset",label:"Other asset",note:"Any other asset.",liquid:true}
]}]},

// ─── CANADA ────────────────────────────────────────────────────────
CA:{flag:"🇨🇦",name:"Canada",groups:[
{group:"Cash & banking",accounts:[
  {value:"chequing",label:"Chequing account",note:"Standard transactional account. CDIC insured up to $100k per category.",liquid:true},
  {value:"savings",label:"Savings account",note:"Interest-bearing deposit. CDIC insured.",liquid:true},
  {value:"hisa",label:"High-interest savings (HISA)",note:"Online bank account. CDIC insured.",liquid:true},
  {value:"gic",label:"GIC (Guaranteed Investment Certificate)",note:"Fixed-term deposit. CDIC insured up to $100k.",liquid:false}
]},
{group:"Registered accounts",accounts:[
  {value:"rrsp",label:"RRSP",note:"Registered Retirement Savings Plan. Pre-tax. 2024 limit: 18% of prior income, max $31,560.",liquid:false,withdrawAge:71},
  {value:"spousal_rrsp",label:"Spousal RRSP",note:"Income-split for retirement. Contributor takes deduction; spouse owns.",liquid:false,withdrawAge:71},
  {value:"tfsa",label:"TFSA (Tax-Free Savings Account)",note:"2024 annual limit: $7,000. Lifetime cumulative ~$95,000 (since 2009).",liquid:false},
  {value:"fhsa",label:"FHSA (First Home Savings Account)",note:"$8,000/yr, $40,000 lifetime. Tax-deductible, tax-free first-home withdrawals.",liquid:false},
  {value:"resp",label:"RESP (Education)",note:"Up to $50,000 per child. Gov't CESG grant 20% on first $2,500/yr.",liquid:false},
  {value:"rdsp",label:"RDSP (Disability)",note:"For Canadians with disabilities. Gov't matching grants + bonds.",liquid:false},
  {value:"rrif",label:"RRIF (Retirement Income Fund)",note:"Converted from RRSP at age 71. Mandatory annual withdrawal.",liquid:false,withdrawAge:71},
  {value:"lif",label:"LIF (Life Income Fund)",note:"From locked-in retirement account (LIRA). Max + min withdrawal rules.",liquid:false,withdrawAge:55}
]},
{group:"Pension & workplace",accounts:[
  {value:"cpp",label:"CPP / QPP (estimated annual)",note:"Canada/Quebec Pension Plan government benefit. Max ~$1,365/mo at 65.",liquid:false,withdrawAge:65},
  {value:"oas",label:"OAS — Old Age Security (estimated annual)",note:"Universal benefit at 65. Clawback above ~$90k income.",liquid:false,withdrawAge:65},
  {value:"gis",label:"GIS — Guaranteed Income Supplement",note:"Top-up for low-income OAS recipients.",liquid:false,withdrawAge:65},
  {value:"dbpp",label:"Defined benefit pension plan",note:"Employer-funded guaranteed monthly benefit.",liquid:false,withdrawAge:55},
  {value:"dcpp",label:"Defined contribution pension plan",note:"Employee + employer contributions to invested account.",liquid:false,withdrawAge:55},
  {value:"lira",label:"LIRA — Locked-In Retirement Account",note:"Pension assets locked until 55. Converts to LIF at retirement.",liquid:false,withdrawAge:55}
]},
{group:"Investment & other",accounts:[
  {value:"non_reg",label:"Non-registered investment account",note:"Taxable brokerage. Capital gains at 50% inclusion rate.",liquid:true},
  {value:"crypto",label:"Cryptocurrency",note:"Taxed as property in Canada.",liquid:true},
  {value:"private_business",label:"Private business / small business shares",note:"LCGE up to $1.25M lifetime exemption on QSBC shares.",liquid:false},
  {value:"life_insurance",label:"Permanent life insurance (cash value)",note:"Tax-sheltered growth within policy.",liquid:false},
  {value:"other_asset",label:"Other asset",note:"Any other asset.",liquid:true}
]}]},

// ─── UNITED KINGDOM ────────────────────────────────────────────────
GB:{flag:"🇬🇧",name:"United Kingdom",groups:[
{group:"Cash & banking",accounts:[
  {value:"current",label:"Current account",note:"Standard UK account. FSCS protected up to £85,000 per bank.",liquid:true},
  {value:"savings",label:"Savings account",note:"Easy-access interest-bearing deposit. FSCS protected.",liquid:true},
  {value:"cash_isa",label:"Cash ISA",note:"Tax-free savings. £20,000/yr ISA allowance.",liquid:true},
  {value:"premium_bonds",label:"Premium bonds (NS&I)",note:"Tax-free monthly prize draws. Max £50,000.",liquid:true},
  {value:"fixed_bond",label:"Fixed-rate bond / fixed savings",note:"Fixed-term savings. FSCS protected.",liquid:false},
  {value:"regular_saver",label:"Regular saver account",note:"High-rate savings with monthly deposit cap.",liquid:true}
]},
{group:"Investment accounts (tax-wrapped)",accounts:[
  {value:"stocks_isa",label:"Stocks & Shares ISA",note:"Tax-free investment wrapper. Up to £20,000/yr. No CGT or dividend tax.",liquid:true},
  {value:"lifetime_isa",label:"Lifetime ISA (LISA)",note:"25% government bonus up to £1,000/yr. £4,000/yr limit. First home or age 60.",liquid:false,withdrawAge:60},
  {value:"junior_isa",label:"Junior ISA (JISA)",note:"For under-18s. £9,000/yr. Child accesses at 18.",liquid:false},
  {value:"innovative_finance_isa",label:"Innovative Finance ISA (IFISA)",note:"P2P lending wrapped in ISA. £20,000 combined allowance.",liquid:false},
  {value:"gia",label:"General investment account (GIA)",note:"Taxable brokerage account.",liquid:true},
  {value:"vct",label:"Venture Capital Trust (VCT)",note:"30% income tax relief. 5-yr hold. Tax-free dividends.",liquid:false},
  {value:"eis",label:"EIS / SEIS investment",note:"30-50% income tax relief for early-stage company investing.",liquid:false},
  {value:"premium_bond_isa",label:"Help to Buy ISA (legacy)",note:"Closed to new accounts. Existing holders only.",liquid:false}
]},
{group:"Pension & retirement",accounts:[
  {value:"sipp",label:"SIPP (Self-Invested Personal Pension)",note:"25% tax-free lump sum at retirement. Up to £60,000/yr.",liquid:false,withdrawAge:55},
  {value:"workplace_pension",label:"Workplace pension (auto-enrolment)",note:"Minimum 8% total contribution (3% employer / 5% employee).",liquid:false,withdrawAge:55},
  {value:"db_pension",label:"Defined benefit pension (DB)",note:"Guaranteed income based on salary and service years.",liquid:false,withdrawAge:55},
  {value:"sass",label:"SSAS (Small Self-Administered Scheme)",note:"For directors/owners. Up to 11 members.",liquid:false,withdrawAge:55},
  {value:"state_pension",label:"State pension (estimated annual)",note:"Full new state pension: £11,502/yr (2024/25).",liquid:false,withdrawAge:66}
]},
{group:"Other assets",accounts:[
  {value:"crypto",label:"Cryptocurrency",note:"HMRC treats as property. CGT applies on disposals.",liquid:true},
  {value:"life_assurance",label:"Whole-of-life / endowment policy",note:"Tax-deferred growth within UK life-assurance bonds.",liquid:false},
  {value:"property_investment",label:"Buy-to-let investment property",note:"Residential rental. Section 24 mortgage interest restriction.",liquid:false},
  {value:"other_asset",label:"Other asset",note:"Any other asset.",liquid:true}
]}]},

// ─── AUSTRALIA ────────────────────────────────────────────────────
AU:{flag:"🇦🇺",name:"Australia",groups:[
{group:"Cash & banking",accounts:[
  {value:"transaction",label:"Transaction account",note:"Standard account. APRA/FCS protected up to $250k per ADI.",liquid:true},
  {value:"savings",label:"High-interest savings account",note:"Interest-bearing deposit. APRA protected.",liquid:true},
  {value:"term_deposit",label:"Term deposit",note:"Fixed-term at guaranteed rate.",liquid:false},
  {value:"offset",label:"Mortgage offset account",note:"Linked to mortgage; balance offsets interest.",liquid:true},
  {value:"redraw",label:"Mortgage redraw account",note:"Extra mortgage repayments that can be redrawn.",liquid:true}
]},
{group:"Superannuation",accounts:[
  {value:"super_accum",label:"Superannuation (accumulation)",note:"Concessional cap: $30,000/yr (2024-25). Non-concessional: $120,000.",liquid:false,withdrawAge:60},
  {value:"super_pension",label:"Superannuation (account-based pension)",note:"Pension phase. Tax-free earnings after 60.",liquid:false,withdrawAge:60},
  {value:"smsf",label:"SMSF (Self-Managed Super Fund)",note:"Up to 6 members. ATO regulated.",liquid:false,withdrawAge:60},
  {value:"defined_benefit_super",label:"Defined benefit super fund",note:"Mostly government & legacy schemes. Guaranteed benefit.",liquid:false,withdrawAge:60},
  {value:"age_pension",label:"Age Pension (estimated annual)",note:"Government means-tested pension at 67.",liquid:false,withdrawAge:67}
]},
{group:"Investment accounts",accounts:[
  {value:"brokerage",label:"Brokerage / share trading account",note:"ASX equities. 50% CGT discount after 12 months.",liquid:true},
  {value:"managed_fund",label:"Managed fund / unit trust",note:"Pooled investment vehicle.",liquid:true},
  {value:"investment_bond",label:"Investment bond (insurance bond)",note:"10-year rule for tax-free withdrawals. 30% internal tax rate.",liquid:false},
  {value:"chess_sponsored",label:"CHESS-sponsored brokerage",note:"Direct ASX holding via CHESS.",liquid:true}
]},
{group:"Other assets",accounts:[
  {value:"crypto",label:"Cryptocurrency",note:"CGT asset per ATO. 50% discount after 12 months.",liquid:true},
  {value:"first_home_super",label:"First Home Super Saver Scheme (FHSSS)",note:"Voluntary super for first home. Withdraw up to $50,000.",liquid:false},
  {value:"investment_property",label:"Investment property",note:"Negative gearing rules apply. CGT on sale.",liquid:false},
  {value:"other_asset",label:"Other asset",note:"Any other asset.",liquid:true}
]}]},

// ─── SWITZERLAND ──────────────────────────────────────────────────
CH:{flag:"🇨🇭",name:"Switzerland",groups:[
{group:"Banking",accounts:[
  {value:"private_account",label:"Privatkonto / Compte privé",note:"Standard Swiss account. esisuisse protected up to CHF 100,000.",liquid:true},
  {value:"savings_account",label:"Sparkonto / Compte d'épargne",note:"Interest-bearing savings.",liquid:true},
  {value:"savings_3a_bank",label:"Vorsorgekonto 3a Bank",note:"Cash 3a — bank pillar-3a account, ~1% interest.",liquid:false,withdrawAge:60},
  {value:"fixed_deposit",label:"Festgeld / Dépôt à terme",note:"Fixed-term deposit.",liquid:false},
  {value:"savings_youth",label:"Jugendkonto / Compte jeunes",note:"Youth savings (often higher rates).",liquid:true}
]},
{group:"Pension system (3 pillars)",accounts:[
  {value:"ahv_avs",label:"AHV/AVS – 1st pillar (estimated annual)",note:"State pension. Max CHF 29,400/yr (2024).",liquid:false,withdrawAge:65},
  {value:"bvg_lpp",label:"BVG/LPP – 2nd pillar (occupational)",note:"Mandatory occupational pension fund.",liquid:false,withdrawAge:65},
  {value:"pillar_3a_bank",label:"Pillar 3a — Bank (Vorsorgekonto)",note:"Tax-deductible. 2024 limit: CHF 7,056 (employed) / CHF 35,280 (self-employed).",liquid:false,withdrawAge:60},
  {value:"pillar_3a_fund",label:"Pillar 3a — Fund / Securities",note:"Pillar 3a via securities account (higher long-term return potential).",liquid:false,withdrawAge:60},
  {value:"pillar_3a_insurance",label:"Pillar 3a — Insurance (lebensversicherung)",note:"Pillar 3a via life insurance. Death/disability benefit included.",liquid:false,withdrawAge:60},
  {value:"pillar_3b",label:"Pillar 3b – Free pension",note:"Flexible non-tied savings. No contribution limits, no tax deduction.",liquid:true},
  {value:"vested_benefits",label:"Vested benefits / Freizügigkeitskonto",note:"Preserved BVG assets during career gap.",liquid:false,withdrawAge:60}
]},
{group:"Investment & securities",accounts:[
  {value:"depot",label:"Securities account (Depot)",note:"Swiss brokerage. Capital gains tax-free for private investors.",liquid:true},
  {value:"fund_account",label:"Investment fund account",note:"Swiss-domiciled collective investment.",liquid:true},
  {value:"structured_products",label:"Structured products",note:"Bank-issued certificates. Counterparty risk.",liquid:false},
  {value:"private_banking",label:"Private banking mandate",note:"Discretionary mandate at private bank.",liquid:true}
]},
{group:"Other assets",accounts:[
  {value:"crypto",label:"Cryptocurrency",note:"Wealth tax asset. Gains tax-free for private investors.",liquid:true},
  {value:"physical_gold",label:"Physical gold / precious metals",note:"Swiss gold holdings (banks/safe deposit). VAT-exempt.",liquid:true},
  {value:"life_insurance",label:"Whole-of-life insurance (gemischte LV)",note:"Mixed savings + life cover product.",liquid:false},
  {value:"other_asset",label:"Other asset",note:"Any other asset.",liquid:true}
]}]},

// ─── EU / EURO ZONE (generic — switches to specific country) ──────
EU:{flag:"🇪🇺",name:"Euro zone (generic)",groups:[
{group:"Banking",accounts:[
  {value:"current",label:"Current / checking account",note:"EU Deposit Guarantee Scheme protects up to €100,000 per bank.",liquid:true},
  {value:"savings",label:"Savings account",note:"Interest-bearing deposit. Protected up to €100,000.",liquid:true},
  {value:"term_deposit",label:"Term / fixed deposit",note:"Fixed-term savings. Protected up to €100,000.",liquid:false}
]},
{group:"Investment accounts",accounts:[
  {value:"securities_depot",label:"Securities depot",note:"Standard taxable brokerage.",liquid:true},
  {value:"ucits_fund",label:"UCITS fund account",note:"Tax treatment varies by member state.",liquid:true}
]},
{group:"Pension & retirement",accounts:[
  {value:"state_pension",label:"State pension (estimated annual)",note:"Country-specific public pension.",liquid:false,withdrawAge:66},
  {value:"occupational_pension",label:"Occupational pension",note:"Employer-sponsored pension scheme.",liquid:false,withdrawAge:60},
  {value:"private_pension",label:"Private pension plan",note:"Personal pension product. See country-specific tab for detail.",liquid:false,withdrawAge:60}
]},
{group:"Other assets",accounts:[
  {value:"crypto",label:"Cryptocurrency",note:"Tax treatment varies by EU member state.",liquid:true},
  {value:"other_asset",label:"Other asset",note:"Any other asset.",liquid:true}
]}]},

// ═══ EUROZONE — INDIVIDUAL COUNTRIES ═══

DE:{flag:"🇩🇪",name:"Germany",groups:[
{group:"Banking",accounts:[
  {value:"girokonto",label:"Girokonto (current)",note:"EdB protected up to €100,000.",liquid:true},
  {value:"tagesgeld",label:"Tagesgeldkonto (overnight savings)",note:"Higher-yield savings. EdB protected.",liquid:true},
  {value:"festgeld",label:"Festgeldkonto (term deposit)",note:"Fixed-term savings.",liquid:false},
  {value:"sparbuch",label:"Sparbuch (passbook savings)",note:"Traditional German savings book.",liquid:true},
  {value:"bausparvertrag",label:"Bausparvertrag (building savings)",note:"Pre-saving for housing loan. Wohnungsbauprämie state subsidy.",liquid:false}
]},
{group:"Investment accounts",accounts:[
  {value:"depot",label:"Wertpapierdepot (securities depot)",note:"Standard brokerage. €1,000/yr Sparerpauschbetrag tax-free.",liquid:true},
  {value:"vl_sparen",label:"Vermögenswirksame Leistungen (VL)",note:"Capital-forming benefit. €40/mo employer + state Arbeitnehmer-Sparzulage.",liquid:false},
  {value:"junior_depot",label:"Juniordepot (child's depot)",note:"In child's name. Own tax allowance €11,604.",liquid:true}
]},
{group:"Pension (3 layers)",accounts:[
  {value:"gesetzliche_rente",label:"Gesetzliche Rentenversicherung (1st)",note:"Statutory pension. Estimated monthly × 12.",liquid:false,withdrawAge:67},
  {value:"riester",label:"Riester-Rente",note:"State-subsidized pension. Tax deduction + Zulagen.",liquid:false,withdrawAge:62},
  {value:"ruerup",label:"Rürup / Basisrente",note:"For self-employed. Up to €27,565/yr tax-deductible.",liquid:false,withdrawAge:62},
  {value:"bav",label:"Betriebliche Altersvorsorge (bAV)",note:"Occupational pension. Direktversicherung, Pensionskasse, etc.",liquid:false,withdrawAge:62},
  {value:"direktversicherung",label:"Direktversicherung",note:"Group life insurance funded via salary conversion.",liquid:false,withdrawAge:62}
]},
{group:"Other assets",accounts:[
  {value:"crypto",label:"Kryptowährung",note:"Tax-free after 1-year hold for private investors.",liquid:true},
  {value:"immobilie",label:"Investment property",note:"Tax-free after 10-yr hold (private).",liquid:false},
  {value:"physical_gold",label:"Physisches Gold",note:"VAT-exempt. Tax-free after 1-yr hold.",liquid:true},
  {value:"other_asset",label:"Other asset",note:"Any other asset.",liquid:true}
]}]},

FR:{flag:"🇫🇷",name:"France",groups:[
{group:"Banking",accounts:[
  {value:"compte_courant",label:"Compte courant",note:"FGDR garanti jusqu'à €100,000.",liquid:true},
  {value:"livret_a",label:"Livret A",note:"Livret réglementé. Plafond €22,950. Taux 3% net d'impôt.",liquid:true},
  {value:"ldds",label:"LDDS (Développement durable et solidaire)",note:"€12,000 plafond. Tax-free.",liquid:true},
  {value:"lep",label:"LEP (Livret d'épargne populaire)",note:"€10,000 plafond. Conditional on income. 5% taux.",liquid:true},
  {value:"livret_jeune",label:"Livret Jeune",note:"12-25 ans. €1,600 plafond.",liquid:true},
  {value:"cel",label:"CEL (Compte épargne logement)",note:"Logement-linked savings.",liquid:true},
  {value:"pel",label:"PEL (Plan épargne logement)",note:"10-yr term. €61,200 plafond. Logement-linked.",liquid:false}
]},
{group:"Investment accounts",accounts:[
  {value:"compte_titres",label:"Compte-titres ordinaire (CTO)",note:"Taxable brokerage. PFU 30% on gains.",liquid:true},
  {value:"pea",label:"PEA (Plan d'épargne en actions)",note:"EU equities. Tax-free after 5 yrs. Max €150,000.",liquid:true},
  {value:"pea_pme",label:"PEA-PME",note:"PME equities only. €225,000 combined with PEA.",liquid:true},
  {value:"assurance_vie",label:"Assurance-Vie",note:"Life insurance wrapper. Favorable taxation after 8 yrs.",liquid:false},
  {value:"per_individuel",label:"PER Individuel",note:"Plan d'épargne retraite (2019+). Tax-deductible contributions.",liquid:false,withdrawAge:62}
]},
{group:"Pension & retirement",accounts:[
  {value:"regime_general",label:"Régime général (Sécu)",note:"Pension de base. Annual estimate.",liquid:false,withdrawAge:64},
  {value:"agirc_arrco",label:"AGIRC-ARRCO (complémentaire)",note:"Mandatory complementary pension.",liquid:false,withdrawAge:64},
  {value:"per_entreprise",label:"PER Entreprise (collectif)",note:"Employer-sponsored PER. PERCO legacy + new PER Co.",liquid:false,withdrawAge:62},
  {value:"madelin",label:"Contrat Madelin (TNS)",note:"For self-employed (legacy → PER).",liquid:false,withdrawAge:62}
]},
{group:"Other assets",accounts:[
  {value:"crypto",label:"Crypto-actifs",note:"PFU 30% on gains for occasional investors.",liquid:true},
  {value:"scpi",label:"SCPI (real estate fund)",note:"Société Civile de Placement Immobilier. Real estate income.",liquid:false},
  {value:"per_obl",label:"Obligations / Tresor direct",note:"State bond direct purchases.",liquid:true},
  {value:"other_asset",label:"Other asset",note:"Any other asset.",liquid:true}
]}]},

IT:{flag:"🇮🇹",name:"Italy",groups:[
{group:"Banking",accounts:[
  {value:"conto_corrente",label:"Conto corrente",note:"FITD garantito fino a €100,000.",liquid:true},
  {value:"conto_deposito",label:"Conto deposito",note:"High-yield online savings. FITD protected.",liquid:true},
  {value:"libretto_postale",label:"Libretto postale",note:"Poste Italiane state-backed savings.",liquid:true},
  {value:"buoni_postali",label:"Buoni Fruttiferi Postali",note:"State-backed fixed-yield postal bonds.",liquid:false}
]},
{group:"Investment accounts",accounts:[
  {value:"deposito_titoli",label:"Deposito titoli (brokerage)",note:"Standard taxable brokerage. 26% tax on gains.",liquid:true},
  {value:"pir",label:"PIR (Piani Individuali di Risparmio)",note:"Tax-free if held 5+ yrs. €30,000/yr cap.",liquid:false},
  {value:"polizza_vita",label:"Polizza vita / Ramo I-III",note:"Life insurance wrapper. Favorable taxation.",liquid:false}
]},
{group:"Pension & retirement (3 pillars)",accounts:[
  {value:"inps",label:"INPS pensione di vecchiaia",note:"State pension (1st pillar). 67 yrs general.",liquid:false,withdrawAge:67},
  {value:"tfr",label:"TFR (Trattamento di Fine Rapporto)",note:"Severance pay accumulation. Can transfer to pension fund.",liquid:false,withdrawAge:0},
  {value:"fondo_pensione_negoziale",label:"Fondo pensione negoziale (2nd pillar)",note:"Industry-wide pension fund (e.g. Cometa, Fonchim).",liquid:false,withdrawAge:62},
  {value:"fondo_pensione_aperto",label:"Fondo pensione aperto",note:"Open pension fund — anyone can join.",liquid:false,withdrawAge:62},
  {value:"pip",label:"PIP (Piani Individuali Pensionistici)",note:"Individual pension plan via insurance.",liquid:false,withdrawAge:62}
]},
{group:"Other assets",accounts:[
  {value:"crypto",label:"Crypto-attività",note:"26% tax on gains above €2,000/yr.",liquid:true},
  {value:"oro_fisico",label:"Oro fisico",note:"Investment gold VAT-exempt.",liquid:true},
  {value:"immobile_locato",label:"Immobile locato (rental property)",note:"Cedolare secca regime available.",liquid:false},
  {value:"other_asset",label:"Other asset",note:"Any other asset.",liquid:true}
]}]},

ES:{flag:"🇪🇸",name:"Spain",groups:[
{group:"Banking",accounts:[
  {value:"cuenta_corriente",label:"Cuenta corriente",note:"FGD garantizado hasta €100,000.",liquid:true},
  {value:"cuenta_ahorro",label:"Cuenta de ahorro",note:"Interest-bearing savings. FGD protected.",liquid:true},
  {value:"deposito_plazo",label:"Depósito a plazo",note:"Fixed-term deposit.",liquid:false}
]},
{group:"Investment accounts",accounts:[
  {value:"cuenta_valores",label:"Cuenta de valores",note:"Standard brokerage. 19-28% CGT.",liquid:true},
  {value:"fondo_inversion",label:"Fondo de inversión",note:"Tax-deferred via traspasos between funds.",liquid:true},
  {value:"sicav",label:"SICAV",note:"Sociedad de Inversión Colectiva. Min 100 shareholders.",liquid:true}
]},
{group:"Pension & retirement",accounts:[
  {value:"seguridad_social",label:"Seguridad Social pensión",note:"Public pension. Annual estimate.",liquid:false,withdrawAge:65},
  {value:"plan_pensiones",label:"Plan de Pensiones Individual",note:"€1,500/yr tax-deductible cap (post-2022 reform).",liquid:false,withdrawAge:65},
  {value:"plan_empleo",label:"Plan de Pensiones de Empleo",note:"Employer-sponsored. €8,500/yr cap.",liquid:false,withdrawAge:65},
  {value:"epsv",label:"EPSV (Basque Country)",note:"Entidades de Previsión Social Voluntaria. Higher contribution limits in País Vasco.",liquid:false,withdrawAge:60},
  {value:"plan_previsión_asegurado",label:"PPA (insured)",note:"Plan de Previsión Asegurado. Combines pension + insurance.",liquid:false,withdrawAge:65}
]},
{group:"Other assets",accounts:[
  {value:"crypto",label:"Criptomonedas",note:"19-28% CGT. Modelo 721 if held abroad.",liquid:true},
  {value:"inmueble",label:"Inmueble (property)",note:"Investment property. IRPF + IBI municipal.",liquid:false},
  {value:"other_asset",label:"Other asset",note:"Any other asset.",liquid:true}
]}]},

NL:{flag:"🇳🇱",name:"Netherlands",groups:[
{group:"Banking",accounts:[
  {value:"betaalrekening",label:"Betaalrekening (current)",note:"DGS garanti €100,000.",liquid:true},
  {value:"spaarrekening",label:"Spaarrekening (savings)",note:"Interest-bearing deposit.",liquid:true},
  {value:"deposito",label:"Deposito",note:"Fixed-term deposit.",liquid:false}
]},
{group:"Investment accounts",accounts:[
  {value:"effectenrekening",label:"Effectenrekening (brokerage)",note:"Subject to Box 3 wealth tax (asset value × deemed return).",liquid:true},
  {value:"vermogensbeheer",label:"Vermogensbeheer (managed)",note:"Discretionary asset management.",liquid:true}
]},
{group:"Pension & retirement",accounts:[
  {value:"aow",label:"AOW (state pension)",note:"Universal old-age benefit at 67.",liquid:false,withdrawAge:67},
  {value:"pensioenfonds",label:"Pensioenfonds (occupational)",note:"Industry-wide or company pension. Mandatory in many sectors.",liquid:false,withdrawAge:67},
  {value:"lijfrente",label:"Lijfrente / annuïteit",note:"Personal pension (banks/insurers). Tax-deferred.",liquid:false,withdrawAge:65},
  {value:"banksparen_pension",label:"Banksparen (pension banking)",note:"Bank-based pension product. Tax-deferred.",liquid:false,withdrawAge:65}
]},
{group:"Other assets",accounts:[
  {value:"crypto",label:"Crypto-activa",note:"Box 3 wealth tax on holdings.",liquid:true},
  {value:"box3_assets",label:"Box 3 vermogen (general)",note:"Generic Box 3 assets — wealth tax.",liquid:true},
  {value:"other_asset",label:"Other asset",note:"Any other asset.",liquid:true}
]}]},

BE:{flag:"🇧🇪",name:"Belgium",groups:[
{group:"Banking",accounts:[
  {value:"compte_a_vue",label:"Compte à vue / Zichtrekening",note:"FGGS €100,000.",liquid:true},
  {value:"livret",label:"Livret réglementé / Gereglementeerde spaarrekening",note:"Tax-free up to €1,020 of interest per person.",liquid:true},
  {value:"compte_a_terme",label:"Compte à terme / Termijnrekening",note:"Fixed-term.",liquid:false}
]},
{group:"Investment accounts",accounts:[
  {value:"compte_titres",label:"Compte-titres / Effectenrekening",note:"Taxable brokerage. TOCA wealth tax on €1M+.",liquid:true},
  {value:"branch_21",label:"Branche 21 (life insurance savings)",note:"Capital guaranteed life insurance. 30% tax if redeemed <8yr.",liquid:false},
  {value:"branch_23",label:"Branche 23 (unit-linked life)",note:"Investment-linked life insurance.",liquid:false}
]},
{group:"Pension & retirement",accounts:[
  {value:"pension_legale",label:"Pension légale / Wettelijk pensioen",note:"1st pillar state pension.",liquid:false,withdrawAge:65},
  {value:"plan_collectif",label:"Plan collectif / Groepsverzekering",note:"Occupational pension via employer.",liquid:false,withdrawAge:60},
  {value:"pli",label:"Pension Libre Complémentaire Indépendants (PLCI)",note:"For self-employed. Tax-deductible up to 8.17%.",liquid:false,withdrawAge:60},
  {value:"epargne_pension",label:"Épargne-pension / Pensioensparen",note:"3rd pillar. 30% tax credit. €1,020/yr cap.",liquid:false,withdrawAge:60}
]},
{group:"Other assets",accounts:[
  {value:"crypto",label:"Cryptomonnaies",note:"Diverse income (33%) or normal management (0%).",liquid:true},
  {value:"other_asset",label:"Other asset",note:"Any other asset.",liquid:true}
]}]},

AT:{flag:"🇦🇹",name:"Austria",groups:[
{group:"Banking",accounts:[
  {value:"girokonto",label:"Girokonto",note:"DGS €100,000.",liquid:true},
  {value:"sparbuch",label:"Sparbuch",note:"Passbook savings.",liquid:true},
  {value:"festgeld",label:"Festgeld",note:"Fixed-term deposit.",liquid:false},
  {value:"bausparvertrag",label:"Bausparvertrag",note:"Building savings + state premium.",liquid:false}
]},
{group:"Investment accounts",accounts:[
  {value:"wertpapierdepot",label:"Wertpapierdepot",note:"Taxable brokerage. 27.5% KESt on gains.",liquid:true},
  {value:"prämienbegünstigte_zukunftsvorsorge",label:"Prämienbegünstigte Zukunftsvorsorge (PZV)",note:"State-subsidized pension product.",liquid:false,withdrawAge:62}
]},
{group:"Pension & retirement",accounts:[
  {value:"alterspension",label:"Alterspension (state)",note:"1st pillar. Annual estimate.",liquid:false,withdrawAge:65},
  {value:"betriebliche_vorsorge",label:"Betriebliche Vorsorge (Abfertigung Neu)",note:"Severance/pension via Vorsorgekasse.",liquid:false,withdrawAge:62}
]},
{group:"Other assets",accounts:[
  {value:"crypto",label:"Kryptowährungen",note:"27.5% KESt on gains.",liquid:true},
  {value:"other_asset",label:"Other asset",note:"Any other asset.",liquid:true}
]}]},

IE:{flag:"🇮🇪",name:"Ireland",groups:[
{group:"Banking",accounts:[
  {value:"current",label:"Current account",note:"DGS €100,000.",liquid:true},
  {value:"regular_saver",label:"Regular saver account",note:"Monthly deposit cap savings.",liquid:true},
  {value:"deposit",label:"Term deposit",note:"Fixed-term.",liquid:false},
  {value:"prize_bonds",label:"Prize Bonds (NTMA)",note:"State savings. Monthly prize draw.",liquid:true},
  {value:"state_savings",label:"State Savings / An Post",note:"Tax-free state-backed savings products.",liquid:false}
]},
{group:"Investment accounts",accounts:[
  {value:"brokerage",label:"Brokerage account",note:"33% CGT. €1,270/yr exemption.",liquid:true},
  {value:"ucits",label:"UCITS fund (Exit Tax 41%)",note:"Subject to Irish exit tax (41%) on gains.",liquid:true},
  {value:"life_assurance",label:"Life assurance investment bond",note:"Subject to Exit Tax 41%.",liquid:false}
]},
{group:"Pension & retirement",accounts:[
  {value:"state_pension_ie",label:"State Pension (Contributory)",note:"~€289/wk full rate. Age 66.",liquid:false,withdrawAge:66},
  {value:"prsa",label:"PRSA (Personal Retirement Savings Account)",note:"Portable personal pension. Tax-relief on contributions.",liquid:false,withdrawAge:60},
  {value:"occupational_pension",label:"Occupational pension",note:"Employer-sponsored DC or DB.",liquid:false,withdrawAge:60},
  {value:"arf",label:"ARF (Approved Retirement Fund)",note:"Post-retirement drawdown vehicle.",liquid:false,withdrawAge:60},
  {value:"avc",label:"AVC (Additional Voluntary Contributions)",note:"Top-up to occupational pension. Tax-deductible.",liquid:false,withdrawAge:60}
]},
{group:"Other assets",accounts:[
  {value:"crypto",label:"Cryptocurrency",note:"33% CGT on disposals.",liquid:true},
  {value:"other_asset",label:"Other asset",note:"Any other asset.",liquid:true}
]}]},

PT:{flag:"🇵🇹",name:"Portugal",groups:[
{group:"Banking",accounts:[
  {value:"conta_a_ordem",label:"Conta à ordem",note:"FGD €100,000.",liquid:true},
  {value:"conta_poupanca",label:"Conta poupança",note:"Savings account.",liquid:true},
  {value:"deposito_prazo",label:"Depósito a prazo",note:"Fixed-term.",liquid:false},
  {value:"certificados_aforro",label:"Certificados de Aforro",note:"State-backed inflation-linked savings.",liquid:false}
]},
{group:"Investment accounts",accounts:[
  {value:"conta_titulos",label:"Conta de títulos (brokerage)",note:"28% IRS on capital gains.",liquid:true},
  {value:"fundos",label:"Fundos de investimento",note:"Tax on fund: dividends 28%.",liquid:true}
]},
{group:"Pension & retirement",accounts:[
  {value:"seguranca_social_pt",label:"Segurança Social (state)",note:"Public pension. Annual estimate.",liquid:false,withdrawAge:66},
  {value:"ppr",label:"PPR (Plano Poupança Reforma)",note:"Tax-deductible up to 20% (income-tested).",liquid:false,withdrawAge:60},
  {value:"ppr_empresa",label:"PPR-Empresa (occupational)",note:"Employer-sponsored PPR variant.",liquid:false,withdrawAge:60}
]},
{group:"Other assets",accounts:[
  {value:"crypto",label:"Criptoativos",note:"28% CGT on short-term (<1 yr); exempt long-term.",liquid:true},
  {value:"other_asset",label:"Other asset",note:"Any other asset.",liquid:true}
]}]},

LU:{flag:"🇱🇺",name:"Luxembourg",groups:[
{group:"Banking",accounts:[
  {value:"compte_a_vue",label:"Compte à vue",note:"FGDL €100,000.",liquid:true},
  {value:"compte_epargne",label:"Compte épargne",note:"Savings.",liquid:true},
  {value:"compte_terme",label:"Compte à terme",note:"Fixed-term.",liquid:false}
]},
{group:"Investment accounts",accounts:[
  {value:"compte_titres",label:"Compte-titres",note:"Brokerage. CGT-exempt after 6-mo hold for non-substantial holdings.",liquid:true},
  {value:"sicav",label:"SICAV (UCITS)",note:"Standard UCITS investment.",liquid:true}
]},
{group:"Pension & retirement",accounts:[
  {value:"pension_publique",label:"Pension publique (CNAP)",note:"Public pension. Annual estimate.",liquid:false,withdrawAge:65},
  {value:"pension_complementaire",label:"Pension complémentaire (employer)",note:"Occupational pension.",liquid:false,withdrawAge:60},
  {value:"prevoyance_vieillesse",label:"Prévoyance-vieillesse 111bis",note:"Personal pension. Tax-deductible up to €3,200/yr.",liquid:false,withdrawAge:60}
]},
{group:"Other assets",accounts:[
  {value:"crypto",label:"Crypto-actifs",note:"CGT 0-42% based on holding period.",liquid:true},
  {value:"other_asset",label:"Other asset",note:"Any other asset.",liquid:true}
]}]},

FI:{flag:"🇫🇮",name:"Finland",groups:[
{group:"Banking",accounts:[
  {value:"käyttötili",label:"Käyttötili (current)",note:"TVR €100,000.",liquid:true},
  {value:"sijoitustili",label:"Säästötili (savings)",note:"Savings.",liquid:true},
  {value:"määräaikaistalletus",label:"Määräaikaistalletus",note:"Term deposit.",liquid:false}
]},
{group:"Investment accounts",accounts:[
  {value:"osakesäästötili",label:"Osakesäästötili (OST)",note:"Equity savings account. Tax-free until withdrawal. €100,000 cap.",liquid:true},
  {value:"arvo_osuustili",label:"Arvo-osuustili",note:"Standard taxable brokerage.",liquid:true}
]},
{group:"Pension & retirement",accounts:[
  {value:"tyel",label:"TyEL (work pension)",note:"Mandatory employee pension. Annual estimate.",liquid:false,withdrawAge:65},
  {value:"kansaneläke",label:"Kansaneläke (national pension)",note:"Means-tested top-up. Age 65.",liquid:false,withdrawAge:65},
  {value:"voluntary_pension",label:"Vapaaehtoinen eläkevakuutus",note:"Personal pension insurance.",liquid:false,withdrawAge:65}
]},
{group:"Other assets",accounts:[
  {value:"crypto",label:"Kryptovaluutta",note:"30-34% CGT on gains.",liquid:true},
  {value:"other_asset",label:"Other asset",note:"Any other asset.",liquid:true}
]}]},

GR:{flag:"🇬🇷",name:"Greece",groups:[
{group:"Banking",accounts:[
  {value:"tameaki_logariasmos",label:"Ταμειακός λογαριασμός",note:"TEKE €100,000.",liquid:true},
  {value:"apotamieftikos",label:"Αποταμιευτικός λογαριασμός",note:"Savings.",liquid:true},
  {value:"prothesmiakos",label:"Προθεσμιακός λογαριασμός",note:"Term deposit.",liquid:false}
]},
{group:"Investment accounts",accounts:[
  {value:"chrematistirio",label:"Χρηματιστηριακός λογαριασμός",note:"ATHEX brokerage. 15% CGT.",liquid:true},
  {value:"amoiveio_kefalaio",label:"Αμοιβαία κεφάλαια (mutual funds)",note:"Greek mutual fund.",liquid:true}
]},
{group:"Pension & retirement",accounts:[
  {value:"efka",label:"EFKA (state pension)",note:"Unified social security fund.",liquid:false,withdrawAge:62},
  {value:"epaggelmatiki_synatxi",label:"Επαγγελματικό ταμείο",note:"Occupational pension fund.",liquid:false,withdrawAge:62},
  {value:"prosthetiko_synatxiodotiko",label:"Ιδιωτικό συνταξιοδοτικό πρόγραμμα",note:"Private pension plan.",liquid:false,withdrawAge:60}
]},
{group:"Other assets",accounts:[
  {value:"crypto",label:"Κρυπτονομίσματα",note:"15% CGT.",liquid:true},
  {value:"other_asset",label:"Other asset",note:"Any other asset.",liquid:true}
]}]},

CY:{flag:"🇨🇾",name:"Cyprus",groups:[
{group:"Banking",accounts:[
  {value:"current",label:"Current account",note:"DPS €100,000.",liquid:true},
  {value:"savings",label:"Savings account",note:"Savings.",liquid:true},
  {value:"notice",label:"Notice account",note:"Higher rate, notice period required.",liquid:false}
]},
{group:"Investment & retirement",accounts:[
  {value:"brokerage",label:"Brokerage account",note:"CSE equities. Tax treatment favorable for individuals.",liquid:true},
  {value:"provident_fund",label:"Provident fund",note:"Employer-sponsored lump-sum scheme.",liquid:false,withdrawAge:60},
  {value:"social_insurance",label:"Social Insurance pension",note:"State pension. Annual estimate.",liquid:false,withdrawAge:65},
  {value:"voluntary_pension",label:"Voluntary pension scheme",note:"Private personal pension.",liquid:false,withdrawAge:60}
]},
{group:"Other assets",accounts:[
  {value:"crypto",label:"Cryptocurrency",note:"Generally not subject to CGT for individuals.",liquid:true},
  {value:"other_asset",label:"Other asset",note:"Any other asset.",liquid:true}
]}]},

HR:{flag:"🇭🇷",name:"Croatia",groups:[
{group:"Banking",accounts:[
  {value:"tekuci_racun",label:"Tekući račun",note:"DGS €100,000.",liquid:true},
  {value:"stedni_racun",label:"Štedni račun",note:"Savings.",liquid:true},
  {value:"orocena_stednja",label:"Oročena štednja",note:"Term deposit.",liquid:false}
]},
{group:"Investment accounts",accounts:[
  {value:"brokerski_racun",label:"Brokerski račun",note:"ZSE brokerage. Tax 10-12%.",liquid:true},
  {value:"investicijski_fond",label:"Investicijski fond",note:"Croatian mutual fund.",liquid:true}
]},
{group:"Pension (3 pillars)",accounts:[
  {value:"hzmo",label:"HZMO (1st pillar)",note:"Generational solidarity public pension.",liquid:false,withdrawAge:65},
  {value:"mandatory_pension_fund",label:"Obvezni mirovinski fond (2nd)",note:"Mandatory individual pension fund.",liquid:false,withdrawAge:65},
  {value:"voluntary_pension_fund",label:"Dobrovoljni mirovinski fond (3rd)",note:"Voluntary pension fund. State subsidy 15% max €99/yr.",liquid:false,withdrawAge:55}
]},
{group:"Other assets",accounts:[
  {value:"crypto",label:"Kriptovalute",note:"10-12% CGT.",liquid:true},
  {value:"other_asset",label:"Other asset",note:"Any other asset.",liquid:true}
]}]},

EE:{flag:"🇪🇪",name:"Estonia",groups:[
{group:"Banking",accounts:[
  {value:"arvelduskonto",label:"Arvelduskonto",note:"Tagatisfond €100,000.",liquid:true},
  {value:"hoiukonto",label:"Hoiukonto",note:"Savings.",liquid:true},
  {value:"tahtajaline",label:"Tähtajaline hoius",note:"Term deposit.",liquid:false}
]},
{group:"Investment accounts",accounts:[
  {value:"investeerimiskonto",label:"Investeerimiskonto (II)",note:"Investment account regime. Tax-deferred via reinvestment.",liquid:true},
  {value:"brokerage",label:"Standard brokerage",note:"20% flat tax on gains.",liquid:true}
]},
{group:"Pension (3 pillars)",accounts:[
  {value:"first_pillar",label:"I sammas (state)",note:"Public pension.",liquid:false,withdrawAge:65},
  {value:"second_pillar",label:"II sammas (mandatory)",note:"Mandatory funded pension (made voluntary 2021).",liquid:false,withdrawAge:65},
  {value:"third_pillar",label:"III sammas (voluntary)",note:"Voluntary pension. 20% tax deduction on contributions.",liquid:false,withdrawAge:55}
]},
{group:"Other assets",accounts:[
  {value:"crypto",label:"Krüptovaluuta",note:"20% flat tax on gains.",liquid:true},
  {value:"other_asset",label:"Other asset",note:"Any other asset.",liquid:true}
]}]},

LV:{flag:"🇱🇻",name:"Latvia",groups:[
{group:"Banking",accounts:[
  {value:"norekinu_konts",label:"Norēķinu konts",note:"NGA €100,000.",liquid:true},
  {value:"krajkonts",label:"Krājkonts",note:"Savings.",liquid:true},
  {value:"terminetais",label:"Termiņnoguldījums",note:"Term deposit.",liquid:false}
]},
{group:"Investment accounts",accounts:[
  {value:"brokeru_konts",label:"Brokeru konts",note:"Riga SE brokerage. 20% CGT.",liquid:true},
  {value:"investiciju_konts",label:"Ieguldījumu konts",note:"Investment account regime — tax-deferred.",liquid:true}
]},
{group:"Pension (3 pillars)",accounts:[
  {value:"first_pillar_lv",label:"1. līmenis (state)",note:"Public pension.",liquid:false,withdrawAge:65},
  {value:"second_pillar_lv",label:"2. līmenis (mandatory funded)",note:"Mandatory individual pension fund.",liquid:false,withdrawAge:65},
  {value:"third_pillar_lv",label:"3. līmenis (voluntary)",note:"Voluntary pension. Tax-deductible.",liquid:false,withdrawAge:55}
]},
{group:"Other assets",accounts:[
  {value:"crypto",label:"Kriptovalūta",note:"20% CGT.",liquid:true},
  {value:"other_asset",label:"Other asset",note:"Any other asset.",liquid:true}
]}]},

LT:{flag:"🇱🇹",name:"Lithuania",groups:[
{group:"Banking",accounts:[
  {value:"einamoji_saskaita",label:"Einamoji sąskaita",note:"IDF €100,000.",liquid:true},
  {value:"taupymo_saskaita",label:"Taupymo sąskaita",note:"Savings.",liquid:true},
  {value:"terminuotas",label:"Terminuotasis indėlis",note:"Term deposit.",liquid:false}
]},
{group:"Investment accounts",accounts:[
  {value:"investicine_saskaita",label:"Investicinė sąskaita",note:"Investment account — tax deferral.",liquid:true},
  {value:"brokerinė",label:"Brokerinė sąskaita",note:"Vilnius SE brokerage. 15% CGT.",liquid:true}
]},
{group:"Pension (3 pillars)",accounts:[
  {value:"first_pillar_lt",label:"I pakopa (Sodra)",note:"Public pension.",liquid:false,withdrawAge:65},
  {value:"second_pillar_lt",label:"II pakopa (mandatory)",note:"Funded pension (now opt-in for new entrants).",liquid:false,withdrawAge:65},
  {value:"third_pillar_lt",label:"III pakopa (voluntary)",note:"Voluntary pension fund.",liquid:false,withdrawAge:55}
]},
{group:"Other assets",accounts:[
  {value:"crypto",label:"Kriptovaliuta",note:"15-20% CGT.",liquid:true},
  {value:"other_asset",label:"Other asset",note:"Any other asset.",liquid:true}
]}]},

SK:{flag:"🇸🇰",name:"Slovakia",groups:[
{group:"Banking",accounts:[
  {value:"bezny_ucet",label:"Bežný účet",note:"FOV €100,000.",liquid:true},
  {value:"sporiaci_ucet",label:"Sporiaci účet",note:"Savings.",liquid:true},
  {value:"terminovany_vklad",label:"Termínovaný vklad",note:"Term deposit.",liquid:false}
]},
{group:"Pension (3 pillars)",accounts:[
  {value:"socialna_poistovna",label:"Sociálna poisťovňa (1st)",note:"Public pension.",liquid:false,withdrawAge:62},
  {value:"opf",label:"OPF (II pillar) — DSS",note:"Mandatory funded pension (DSS).",liquid:false,withdrawAge:62},
  {value:"dds",label:"DDS (III pillar)",note:"Voluntary supplementary pension. Tax-deductible.",liquid:false,withdrawAge:55}
]},
{group:"Investment & other",accounts:[
  {value:"brokerage_sk",label:"Brokerage účet",note:"BSSE brokerage. 19% on gains (exempt after 1-yr hold).",liquid:true},
  {value:"crypto",label:"Kryptomeny",note:"19% on gains.",liquid:true},
  {value:"other_asset",label:"Other asset",note:"Any other asset.",liquid:true}
]}]},

SI:{flag:"🇸🇮",name:"Slovenia",groups:[
{group:"Banking",accounts:[
  {value:"transakcijski",label:"Transakcijski račun",note:"JS €100,000.",liquid:true},
  {value:"hranilna",label:"Hranilna knjižica",note:"Passbook savings.",liquid:true},
  {value:"vezana_vloga",label:"Vezana vloga",note:"Term deposit.",liquid:false}
]},
{group:"Pension & retirement",accounts:[
  {value:"zpiz",label:"ZPIZ (state pension)",note:"Mandatory state pension.",liquid:false,withdrawAge:60},
  {value:"prostovoljno_dodatno",label:"Prostovoljno dodatno PZ",note:"Supplementary pension. Tax-relief up to 5.844% of gross.",liquid:false,withdrawAge:55}
]},
{group:"Investment & other",accounts:[
  {value:"brokerage_si",label:"Brokerage račun",note:"LSE brokerage. CGT 25% (decreasing with hold time).",liquid:true},
  {value:"crypto",label:"Kriptovalute",note:"Generally tax-free for occasional retail investors.",liquid:true},
  {value:"other_asset",label:"Other asset",note:"Any other asset.",liquid:true}
]}]},

MT:{flag:"🇲🇹",name:"Malta",groups:[
{group:"Banking",accounts:[
  {value:"current",label:"Current account",note:"DGS €100,000.",liquid:true},
  {value:"savings",label:"Savings account",note:"Savings.",liquid:true},
  {value:"deposit",label:"Fixed deposit",note:"Term deposit.",liquid:false}
]},
{group:"Investment & retirement",accounts:[
  {value:"brokerage_mt",label:"Brokerage account",note:"MSE equities. No CGT on listed shares for residents.",liquid:true},
  {value:"vops",label:"VOPS (Voluntary Occupational Pension)",note:"Employer pension scheme. Tax incentives.",liquid:false,withdrawAge:61},
  {value:"prs",label:"PRS (Personal Retirement Scheme)",note:"Personal pension. €3,000/yr tax credit.",liquid:false,withdrawAge:61}
]},
{group:"Other assets",accounts:[
  {value:"crypto",label:"Cryptocurrency",note:"Treated based on use — trading vs investment.",liquid:true},
  {value:"other_asset",label:"Other asset",note:"Any other asset.",liquid:true}
]}]},

// ─── REMAINING NON-EUROZONE COUNTRIES (existing structure preserved) ─

JP:{flag:"🇯🇵",name:"Japan",groups:[
{group:"Banking",accounts:[
  {value:"futsu",label:"普通預金 (Futsū yokin)",note:"Standard bank deposit. Insurance up to ¥10M.",liquid:true},
  {value:"teiki",label:"定期預金 (Teiki yokin)",note:"Fixed-term deposit.",liquid:false},
  {value:"yucho",label:"ゆうちょ銀行 (Japan Post Bank)",note:"Postal savings — ¥13M max per person.",liquid:true}
]},
{group:"Investment & tax-advantaged",accounts:[
  {value:"nisa",label:"NISA (新NISA)",note:"New NISA (2024+): ¥3.6M/yr growth limit. Lifetime cap ¥18M. Tax-free.",liquid:true},
  {value:"tsumitate_nisa",label:"つみたて NISA (legacy)",note:"Pre-2024 legacy account. Closed to new contributions.",liquid:true},
  {value:"ideco",label:"iDeCo (個人型確定拠出年金)",note:"Individual pension. Tax-deductible. Accessible at 60.",liquid:false,withdrawAge:60},
  {value:"general_brokerage",label:"General brokerage account",note:"Taxable. 20.315% tax on gains.",liquid:true}
]},
{group:"Pension & retirement",accounts:[
  {value:"kosei_nenkin",label:"厚生年金 (Employee pension)",note:"Social insurance pension for employees.",liquid:false,withdrawAge:65},
  {value:"kokumin_nenkin",label:"国民年金 (National pension)",note:"Basic flat-rate pension.",liquid:false,withdrawAge:65},
  {value:"corporate_pension",label:"企業年金 Corporate pension",note:"Employer DB or DC plan.",liquid:false,withdrawAge:60},
  {value:"kokumin_nenkin_kikin",label:"国民年金基金",note:"Supplementary pension for self-employed.",liquid:false,withdrawAge:65}
]},
{group:"Other assets",accounts:[
  {value:"crypto",label:"仮想通貨 Cryptocurrency",note:"Taxed as miscellaneous income. Up to 55% marginal rate.",liquid:true},
  {value:"japanese_real_estate",label:"Real estate investment",note:"REITs (J-REIT) or direct property.",liquid:false},
  {value:"other_asset",label:"Other asset",note:"Any other asset.",liquid:true}
]}]},

SG:{flag:"🇸🇬",name:"Singapore",groups:[
{group:"Banking",accounts:[
  {value:"savings",label:"Savings account",note:"SDIC insured up to SGD 100,000.",liquid:true},
  {value:"current",label:"Current account",note:"Standard transactional account. SDIC insured.",liquid:true},
  {value:"fixed_deposit",label:"Fixed deposit",note:"Fixed-term savings. SDIC insured.",liquid:false},
  {value:"multi_currency_sg",label:"Multi-currency account",note:"Holds SGD, USD, EUR etc.",liquid:true}
]},
{group:"CPF (Central Provident Fund)",accounts:[
  {value:"cpf_oa",label:"CPF Ordinary Account (OA)",note:"2.5% p.a. For housing, education, insurance.",liquid:false,withdrawAge:55},
  {value:"cpf_sa",label:"CPF Special Account (SA)",note:"4% p.a. Long-term retirement savings.",liquid:false,withdrawAge:55},
  {value:"cpf_ma",label:"CPF Medisave Account (MA)",note:"4% p.a. For healthcare.",liquid:false},
  {value:"cpf_ra",label:"CPF Retirement Account (RA)",note:"Formed at age 55. Funds CPF LIFE payouts.",liquid:false,withdrawAge:65},
  {value:"srs",label:"SRS (Supplementary Retirement Scheme)",note:"Voluntary. SGD 15,300/yr limit.",liquid:false,withdrawAge:62}
]},
{group:"Investment accounts",accounts:[
  {value:"cdp",label:"CDP securities account",note:"Central Depository for SGX-listed stocks and bonds.",liquid:true},
  {value:"brokerage_sg",label:"Brokerage account (cash)",note:"For local and global equities, ETFs.",liquid:true},
  {value:"sgs_bonds",label:"SGS bonds / T-bills",note:"Government securities.",liquid:true},
  {value:"ssb",label:"Singapore Savings Bonds (SSB)",note:"Step-up rate gov't bonds. SGD 200,000 max.",liquid:true}
]},
{group:"Other assets",accounts:[
  {value:"crypto",label:"Cryptocurrency",note:"Capital gains generally not taxed for individuals.",liquid:true},
  {value:"property_sg",label:"Property investment",note:"ABSD on additional properties for residents.",liquid:false},
  {value:"other_asset",label:"Other asset",note:"Any other asset.",liquid:true}
]}]},

HK:{flag:"🇭🇰",name:"Hong Kong",groups:[
{group:"Banking",accounts:[
  {value:"savings",label:"Savings account",note:"HKDPS protects up to HKD 800,000.",liquid:true},
  {value:"current",label:"Current account",note:"Standard transactional.",liquid:true},
  {value:"time_deposit",label:"Time deposit",note:"Fixed-term savings.",liquid:false},
  {value:"multi_currency",label:"Multi-currency account",note:"Holds HKD, USD, CNH, etc.",liquid:true}
]},
{group:"MPF (Mandatory Provident Fund)",accounts:[
  {value:"mpf",label:"MPF — employee mandatory",note:"5% employee + 5% employer. Age 65.",liquid:false,withdrawAge:65},
  {value:"mpf_voluntary",label:"MPF — voluntary (TVC)",note:"Tax-deductible up to HKD 60,000/yr.",liquid:false,withdrawAge:65},
  {value:"orso",label:"ORSO (legacy occupational)",note:"Older scheme — many migrated to MPF.",liquid:false,withdrawAge:65}
]},
{group:"Investment accounts",accounts:[
  {value:"securities",label:"Securities account (HKEx)",note:"No capital gains tax in HK.",liquid:true},
  {value:"unit_trust",label:"Unit trust / mutual fund",note:"Pooled investment fund.",liquid:true},
  {value:"exchange_fund_notes",label:"Exchange Fund Notes / HK Gov Bonds",note:"HKMA-issued government bonds.",liquid:true}
]},
{group:"Other assets",accounts:[
  {value:"crypto",label:"Cryptocurrency",note:"Capital gains generally not taxed for individuals.",liquid:true},
  {value:"property_hk",label:"Property investment",note:"Stamp duty significant for non-first-home.",liquid:false},
  {value:"other_asset",label:"Other asset",note:"Any other asset.",liquid:true}
]}]},

CN:{flag:"🇨🇳",name:"China",groups:[
{group:"Banking",accounts:[
  {value:"demand_deposit",label:"活期存款 Demand deposit",note:"Deposit insurance up to RMB 500,000.",liquid:true},
  {value:"time_deposit",label:"定期存款 Time deposit",note:"Fixed-term savings.",liquid:false},
  {value:"large_certificate",label:"大额存单 Large CD",note:"High-denomination CDs (RMB 200k+).",liquid:false}
]},
{group:"Social insurance & pension",accounts:[
  {value:"basic_pension",label:"基本养老保险 Basic pension",note:"Mandatory. 15 years contributions required.",liquid:false,withdrawAge:60},
  {value:"enterprise_annuity",label:"企业年金 Enterprise annuity",note:"Voluntary employer supplemental pension.",liquid:false,withdrawAge:60},
  {value:"personal_pension",label:"个人养老金 Personal pension",note:"New (2022+). Max RMB 12,000/yr tax-deductible.",liquid:false,withdrawAge:60}
]},
{group:"Investment",accounts:[
  {value:"a_shares",label:"A-share brokerage",note:"Shanghai/Shenzhen equities. No CGT for individuals.",liquid:true},
  {value:"fund_account",label:"公募基金 Mutual fund",note:"Regulated public funds.",liquid:true},
  {value:"wealth_management",label:"理财产品 Wealth management",note:"Bank-issued WMPs.",liquid:false}
]},
{group:"Other assets",accounts:[
  {value:"crypto",label:"Cryptocurrency",note:"Note: crypto trading is restricted in mainland China.",liquid:true},
  {value:"other_asset",label:"Other asset",note:"Any other asset.",liquid:true}
]}]},

TW:{flag:"🇹🇼",name:"Taiwan",groups:[
{group:"Banking",accounts:[
  {value:"demand",label:"活期存款 Demand deposit",note:"CDIC covers up to NTD 3,000,000.",liquid:true},
  {value:"time_deposit",label:"定期存款 Time deposit",note:"Fixed-term.",liquid:false}
]},
{group:"Pension",accounts:[
  {value:"labour_pension_new",label:"勞工退休金 (New DC system)",note:"6% employer + voluntary employee. Portable.",liquid:false,withdrawAge:60},
  {value:"national_pension",label:"國民年金 National pension",note:"Basic retirement income.",liquid:false,withdrawAge:65},
  {value:"voluntary_individual",label:"自願提繳 Voluntary contribution",note:"Up to 6% of salary, tax-deductible.",liquid:false,withdrawAge:60}
]},
{group:"Investment",accounts:[
  {value:"twse_brokerage",label:"TWSE brokerage account",note:"Taiwan Stock Exchange equities.",liquid:true},
  {value:"fund",label:"共同基金 Mutual fund",note:"Domestic or offshore funds.",liquid:true}
]},
{group:"Other assets",accounts:[
  {value:"crypto",label:"Cryptocurrency",note:"Treated as property. Gains may be taxable.",liquid:true},
  {value:"other_asset",label:"Other asset",note:"Any other asset.",liquid:true}
]}]},

KR:{flag:"🇰🇷",name:"South Korea",groups:[
{group:"Banking",accounts:[
  {value:"demand_deposit",label:"보통예금 Demand deposit",note:"KDIC insured up to KRW 50,000,000.",liquid:true},
  {value:"time_deposit",label:"정기예금 Time deposit",note:"Fixed-term. KDIC insured.",liquid:false},
  {value:"installment_savings",label:"적금 Installment savings",note:"Monthly contribution savings.",liquid:false}
]},
{group:"Pension",accounts:[
  {value:"nps",label:"국민연금 NPS",note:"Mandatory social pension. 9% of salary.",liquid:false,withdrawAge:63},
  {value:"irp",label:"IRP (개인형퇴직연금)",note:"Up to KRW 9M/yr tax deduction.",liquid:false,withdrawAge:55},
  {value:"dc",label:"DC 확정기여형 퇴직연금",note:"Defined contribution workplace pension.",liquid:false,withdrawAge:55},
  {value:"db",label:"DB 확정급여형 퇴직연금",note:"Defined benefit workplace pension.",liquid:false,withdrawAge:55}
]},
{group:"Investment",accounts:[
  {value:"isa_kr",label:"ISA (개인종합자산관리계좌)",note:"KRW 20M/yr. Tax exemption on first KRW 2M gains.",liquid:true},
  {value:"brokerage_kr",label:"증권계좌 Securities account",note:"KRX equities.",liquid:true}
]},
{group:"Other assets",accounts:[
  {value:"crypto",label:"가상자산 Cryptocurrency",note:"20% tax on gains over KRW 2.5M (delayed implementation).",liquid:true},
  {value:"other_asset",label:"Other asset",note:"Any other asset.",liquid:true}
]}]},

IN:{flag:"🇮🇳",name:"India",groups:[
{group:"Banking",accounts:[
  {value:"savings",label:"Savings bank account",note:"DICGC insured up to ₹5 lakh per bank.",liquid:true},
  {value:"current",label:"Current account",note:"Standard transactional for businesses.",liquid:true},
  {value:"fd",label:"Fixed deposit (FD)",note:"Insured up to ₹5 lakh. Interest taxed as income.",liquid:false},
  {value:"rd",label:"Recurring deposit (RD)",note:"Monthly fixed savings with compound interest.",liquid:false},
  {value:"nro_nre",label:"NRO / NRE / FCNR (NRI accounts)",note:"For Non-Resident Indians.",liquid:true}
]},
{group:"Provident fund & pension",accounts:[
  {value:"epf",label:"EPF (Employees' Provident Fund)",note:"Mandatory. 12% employer + 12% employee.",liquid:false,withdrawAge:58},
  {value:"ppf",label:"PPF (Public Provident Fund)",note:"7.1% p.a. Max ₹1.5L/yr. 15-year lock-in. EEE tax treatment.",liquid:false,withdrawAge:0},
  {value:"vpf",label:"VPF (Voluntary PF)",note:"Top-up of EPF. Same 8.25% tax-free return.",liquid:false,withdrawAge:58},
  {value:"nps",label:"NPS (National Pension System)",note:"Tax deduction up to ₹2L/yr (Tier I).",liquid:false,withdrawAge:60},
  {value:"sukanya_samriddhi",label:"Sukanya Samriddhi Yojana",note:"For girl child. 8.2%. Tax-free.",liquid:false,withdrawAge:18}
]},
{group:"Investment accounts",accounts:[
  {value:"demat",label:"Demat + trading account",note:"BSE/NSE equities. LTCG 12.5% above ₹1.25L.",liquid:true},
  {value:"mutual_fund",label:"Mutual fund / SIP",note:"ELSS funds offer ₹1.5L/yr tax deduction (Sec 80C).",liquid:true},
  {value:"elss",label:"ELSS (tax-saving mutual funds)",note:"3-yr lock-in. ₹1.5L Sec 80C deduction.",liquid:false}
]},
{group:"Other assets",accounts:[
  {value:"sgb",label:"Sovereign Gold Bond (SGB)",note:"Gov't gold bond. 2.5% interest. CGT-exempt at maturity.",liquid:false},
  {value:"crypto",label:"Cryptocurrency",note:"30% flat tax on gains + 1% TDS.",liquid:true},
  {value:"reits",label:"REITs",note:"Indian REITs listed on BSE/NSE.",liquid:true},
  {value:"other_asset",label:"Other asset",note:"Any other asset.",liquid:true}
]}]},

ID:{flag:"🇮🇩",name:"Indonesia",groups:[
{group:"Banking",accounts:[
  {value:"tabungan",label:"Tabungan (Savings)",note:"LPS insures up to IDR 2 billion.",liquid:true},
  {value:"giro",label:"Giro (Current account)",note:"Business transactional account.",liquid:true},
  {value:"deposito",label:"Deposito (Time deposit)",note:"20% final withholding tax on interest.",liquid:false}
]},
{group:"Pension & social insurance",accounts:[
  {value:"bpjs_hari_tua",label:"BPJS JHT (Old Age Insurance)",note:"Accessible at 56 or upon resignation.",liquid:false,withdrawAge:56},
  {value:"bpjs_pensiun",label:"BPJS JP (Pension program)",note:"Monthly benefit at 57.",liquid:false,withdrawAge:57},
  {value:"dpln",label:"DPLN (Voluntary pension)",note:"Private voluntary pension fund.",liquid:false,withdrawAge:55}
]},
{group:"Investment",accounts:[
  {value:"reksa_dana",label:"Reksa Dana (Mutual fund)",note:"OJK regulated.",liquid:true},
  {value:"saham",label:"IDX equities account",note:"0.1% STT on sales.",liquid:true},
  {value:"obligasi",label:"SBN (Gov't bonds)",note:"Retail gov't bonds.",liquid:false},
  {value:"sukuk_ritel",label:"Sukuk Ritel",note:"Retail sukuk — Shariah-compliant.",liquid:false}
]},
{group:"Other assets",accounts:[
  {value:"crypto",label:"Cryptocurrency",note:"0.11% VAT + 0.1% income tax per transaction.",liquid:true},
  {value:"emas",label:"Emas (gold)",note:"Physical gold widely used in Indonesia.",liquid:true},
  {value:"other_asset",label:"Other asset",note:"Any other asset.",liquid:true}
]}]},

MX:{flag:"🇲🇽",name:"Mexico",groups:[
{group:"Banking",accounts:[
  {value:"cuenta_debito",label:"Cuenta de débito",note:"IPAB insures up to 400,000 UDIs (~MXN 3.4M).",liquid:true},
  {value:"ahorro",label:"Cuenta de ahorro (Savings)",note:"Interest-bearing savings.",liquid:true},
  {value:"pagaré",label:"Pagaré bancario",note:"Bank-issued promissory note.",liquid:false}
]},
{group:"Retirement (Afore)",accounts:[
  {value:"afore",label:"AFORE retirement account",note:"Mandatory individual retirement account.",liquid:false,withdrawAge:65},
  {value:"ppe",label:"PPE / PPI (Voluntary pension)",note:"Tax-deductible up to 10% of gross income.",liquid:false,withdrawAge:65}
]},
{group:"Investment",accounts:[
  {value:"casa_bolsa",label:"Casa de bolsa (Brokerage)",note:"BMV-listed equities and funds.",liquid:true},
  {value:"cetes",label:"CETES (Gov't bonds)",note:"Treasury bills via cetesdirecto.com.",liquid:true},
  {value:"fibras",label:"FIBRAS",note:"Mexican REITs.",liquid:true}
]},
{group:"Other assets",accounts:[
  {value:"crypto",label:"Cryptocurrency",note:"Subject to ISR as miscellaneous income.",liquid:true},
  {value:"other_asset",label:"Other asset",note:"Any other asset.",liquid:true}
]}]},

BR:{flag:"🇧🇷",name:"Brazil",groups:[
{group:"Banking",accounts:[
  {value:"conta_corrente",label:"Conta corrente (Current account)",note:"FGC insures up to R$250,000 per CPF.",liquid:true},
  {value:"poupanca",label:"Poupança (Savings)",note:"Tax-free returns. Regulated rate.",liquid:true},
  {value:"cdb",label:"CDB (Bank deposit certificate)",note:"FGC protected. IR tax on gains.",liquid:false},
  {value:"lci_lca",label:"LCI / LCA",note:"Tax-free for individuals. FGC protected.",liquid:false}
]},
{group:"Pension",accounts:[
  {value:"inss",label:"INSS (Social security pension)",note:"Enter estimated monthly benefit × 12.",liquid:false,withdrawAge:65},
  {value:"pgbl",label:"PGBL (Pension plan)",note:"Deductible up to 12% of gross income.",liquid:false,withdrawAge:60},
  {value:"vgbl",label:"VGBL (Life pension plan)",note:"No IR deduction but tax only on gains.",liquid:false}
]},
{group:"Investment",accounts:[
  {value:"tesouro_direto",label:"Tesouro Direto (Gov't bonds)",note:"SELIC, IPCA+, pre-fixed options.",liquid:true},
  {value:"acoes",label:"B3 brokerage account",note:"Monthly gains over R$20k taxed at 15%.",liquid:true},
  {value:"fundos_imobiliarios",label:"FIIs (Real estate funds)",note:"Tax-free dividends to retail investors.",liquid:true}
]},
{group:"Other assets",accounts:[
  {value:"crypto",label:"Cryptocurrency",note:"15-22.5% IR on monthly gains over R$35k.",liquid:true},
  {value:"other_asset",label:"Other asset",note:"Any other asset.",liquid:true}
]}]},

SA:{flag:"🇸🇦",name:"Saudi Arabia",groups:[
{group:"Banking",accounts:[
  {value:"current",label:"Current account (حساب جارٍ)",note:"SAMA regulated.",liquid:true},
  {value:"savings",label:"Savings account (حساب توفير)",note:"Shariah-compliant profit-sharing deposit.",liquid:true},
  {value:"murabaha",label:"Murabaha deposit",note:"Shariah-compliant fixed-term.",liquid:false}
]},
{group:"Pension & social insurance",accounts:[
  {value:"gosi",label:"GOSI (التأمينات الاجتماعية)",note:"9% employer + 9% employee for Saudi nationals.",liquid:false,withdrawAge:60},
  {value:"ppa",label:"PPA (Public Pension Agency)",note:"For government employees. Defined benefit.",liquid:false,withdrawAge:60}
]},
{group:"Investment",accounts:[
  {value:"tadawul",label:"Tadawul brokerage (تداول)",note:"Saudi Exchange equities. No CGT for Saudi nationals.",liquid:true},
  {value:"sukuk",label:"Sukuk (صكوك)",note:"Shariah-compliant bonds.",liquid:false},
  {value:"reits_sa",label:"REITs (صناديق الريت)",note:"Tadawul-listed REITs.",liquid:true}
]},
{group:"Other assets",accounts:[
  {value:"crypto",label:"Cryptocurrency",note:"Regulatory status evolving. SAMA cautious.",liquid:true},
  {value:"physical_gold_sa",label:"Physical gold",note:"Common store-of-value.",liquid:true},
  {value:"other_asset",label:"Other asset",note:"Any other asset.",liquid:true}
]}]},

ZA:{flag:"🇿🇦",name:"South Africa",groups:[
{group:"Banking",accounts:[
  {value:"cheque",label:"Cheque / current account",note:"No formal government DGS in South Africa.",liquid:true},
  {value:"savings",label:"Savings account",note:"Interest taxed above annual exemption (R23,800).",liquid:true},
  {value:"fixed_deposit",label:"Fixed deposit",note:"Fixed-term savings.",liquid:false}
]},
{group:"Tax-advantaged savings",accounts:[
  {value:"tfsa_za",label:"TFSA (Tax-Free Savings Account)",note:"R36,000/yr limit. R500,000 lifetime cap. Fully tax-free growth.",liquid:true},
  {value:"retirement_annuity",label:"Retirement Annuity (RA)",note:"Tax-deductible (27.5% of income, max R350,000/yr).",liquid:false,withdrawAge:55}
]},
{group:"Pension & provident funds",accounts:[
  {value:"pension_fund",label:"Pension fund",note:"1/3 lump sum + 2/3 annuity at retirement.",liquid:false,withdrawAge:55},
  {value:"provident_fund",label:"Provident fund",note:"Harmonised with pension from 2024.",liquid:false,withdrawAge:55},
  {value:"living_annuity",label:"Living annuity",note:"Post-retirement drawdown. 2.5–17.5% annual drawdown.",liquid:false,withdrawAge:55},
  {value:"preservation_fund",label:"Preservation fund",note:"Holds pension/provident assets when changing employers.",liquid:false,withdrawAge:55}
]},
{group:"Investment",accounts:[
  {value:"discretionary",label:"Discretionary investment account",note:"CGT inclusion rate 40% for individuals.",liquid:true},
  {value:"unit_trust",label:"Unit trust",note:"CISCA-regulated pooled fund.",liquid:true},
  {value:"reits_za",label:"REITs (JSE)",note:"JSE-listed REITs.",liquid:true}
]},
{group:"Other assets",accounts:[
  {value:"crypto",label:"Cryptocurrency",note:"Taxed as income or CGT depending on intent.",liquid:true},
  {value:"krugerrand",label:"Krugerrand (gold)",note:"Iconic SA gold coin. CGT applies.",liquid:true},
  {value:"other_asset",label:"Other asset",note:"Any other asset.",liquid:true}
]}]},

OTHER:{flag:"🌍",name:"Other",groups:[
{group:"Cash & banking",accounts:[
  {value:"checking",label:"Checking / current account",note:"Standard transactional account.",liquid:true},
  {value:"savings",label:"Savings account",note:"Interest-bearing deposit.",liquid:true},
  {value:"term_deposit",label:"Term / fixed deposit",note:"Fixed-term savings.",liquid:false}
]},
{group:"Investment accounts",accounts:[
  {value:"brokerage",label:"Brokerage / investment account",note:"Taxable investment account.",liquid:true},
  {value:"mutual_fund",label:"Mutual fund / unit trust",note:"Pooled investment vehicle.",liquid:true}
]},
{group:"Pension & retirement",accounts:[
  {value:"state_pension",label:"State pension (estimated annual)",note:"Government retirement benefit.",liquid:false,withdrawAge:66},
  {value:"occupational_pension",label:"Occupational pension",note:"Employer-sponsored pension.",liquid:false,withdrawAge:60},
  {value:"private_pension",label:"Private pension plan",note:"Individual retirement savings.",liquid:false,withdrawAge:60}
]},
{group:"Other",accounts:[
  {value:"crypto",label:"Cryptocurrency",note:"Digital assets.",liquid:true},
  {value:"other_asset",label:"Other asset",note:"Any other asset.",liquid:true}
]}]}

};
