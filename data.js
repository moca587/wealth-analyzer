// ─── Country account types ───────────────────────────────────────────────────
const COUNTRY_ACCOUNTS = {
  US: { flag:"🇺🇸", name:"United States", groups:[
    { group:"Cash & banking", accounts:[
      { value:"checking", label:"Checking account", note:"Standard transactional account. FDIC insured up to $250k.", liquid:true },
      { value:"savings", label:"Savings account", note:"Interest-bearing deposit. FDIC insured up to $250k.", liquid:true },
      { value:"money_market", label:"Money market account", note:"Higher-yield savings with check-writing. FDIC insured.", liquid:true },
      { value:"cd", label:"Certificate of deposit (CD)", note:"Fixed-term deposit. FDIC insured. Early withdrawal penalty.", liquid:false }
    ]},
    { group:"Investment accounts", accounts:[
      { value:"brokerage", label:"Taxable brokerage account", note:"General investment account. Capital gains taxed.", liquid:true },
      { value:"529", label:"529 college savings plan", note:"Tax-advantaged education savings. Qualified withdrawals tax-free.", liquid:false },
      { value:"hsa", label:"HSA (Health Savings Account)", note:"Triple tax-advantaged. Contributions, growth, and qualified medical withdrawals all tax-free.", liquid:false }
    ]},
    { group:"Retirement accounts", accounts:[
      { value:"401k", label:"401(k)", note:"Employer-sponsored plan. Pre-tax contributions. 2024 limit: $23,000 (+$7,500 catch-up).", liquid:false },
      { value:"roth_401k", label:"Roth 401(k)", note:"After-tax employer plan. Tax-free qualified withdrawals.", liquid:false },
      { value:"ira", label:"Traditional IRA", note:"Pre-tax contributions. 2024 limit: $7,000 (+$1,000 catch-up).", liquid:false },
      { value:"roth_ira", label:"Roth IRA", note:"After-tax IRA. Tax-free qualified withdrawals. Income limits apply.", liquid:false },
      { value:"sep_ira", label:"SEP-IRA", note:"For self-employed. Up to 25% of compensation.", liquid:false },
      { value:"pension", label:"Defined benefit pension", note:"Employer-funded guaranteed monthly benefit in retirement.", liquid:false },
      { value:"social_security", label:"Social Security (estimated annual)", note:"Government retirement benefit.", liquid:false }
    ]},
    { group:"Other assets", accounts:[
      { value:"annuity", label:"Annuity", note:"Insurance product providing periodic payments.", liquid:false },
      { value:"crypto", label:"Cryptocurrency", note:"Digital assets. High volatility.", liquid:true },
      { value:"other_asset", label:"Other asset", note:"Any other asset.", liquid:true }
    ]}
  ]},
  CA: { flag:"🇨🇦", name:"Canada", groups:[
    { group:"Cash & banking", accounts:[
      { value:"chequing", label:"Chequing account", note:"Standard transactional account. CDIC insured up to $100k per category.", liquid:true },
      { value:"savings", label:"Savings account", note:"Interest-bearing deposit. CDIC insured.", liquid:true },
      { value:"gic", label:"GIC (Guaranteed Investment Certificate)", note:"Fixed-term deposit. CDIC insured.", liquid:false }
    ]},
    { group:"Registered accounts", accounts:[
      { value:"rrsp", label:"RRSP", note:"Registered Retirement Savings Plan. Pre-tax. 2024 limit: 18% of prior income, max $31,560.", liquid:false },
      { value:"tfsa", label:"TFSA", note:"Tax-Free Savings Account. 2024 annual limit: $7,000.", liquid:false },
      { value:"fhsa", label:"FHSA", note:"First Home Savings Account. $8,000/yr. Tax-deductible, tax-free first-home withdrawals.", liquid:false },
      { value:"resp", label:"RESP", note:"Education savings. Government grants (CESG) of 20% on first $2,500/yr.", liquid:false },
      { value:"rrif", label:"RRIF", note:"Retirement Income Fund. Converted from RRSP at age 71.", liquid:false }
    ]},
    { group:"Pension & workplace", accounts:[
      { value:"cpp", label:"CPP/QPP (estimated annual)", note:"Canada/Quebec Pension Plan government benefit.", liquid:false },
      { value:"dbpp", label:"Defined benefit pension plan", note:"Employer-funded guaranteed monthly benefit.", liquid:false },
      { value:"dcpp", label:"Defined contribution pension plan", note:"Employee + employer contributions.", liquid:false }
    ]},
    { group:"Investment & other", accounts:[
      { value:"non_reg", label:"Non-registered investment account", note:"Taxable brokerage. Capital gains at 50% inclusion rate.", liquid:true },
      { value:"crypto", label:"Cryptocurrency", note:"Taxed as property in Canada.", liquid:true },
      { value:"other_asset", label:"Other asset", note:"Any other asset.", liquid:true }
    ]}
  ]},
  GB: { flag:"🇬🇧", name:"United Kingdom", groups:[
    { group:"Cash & banking", accounts:[
      { value:"current", label:"Current account", note:"Standard UK account. FSCS protected up to £85,000.", liquid:true },
      { value:"savings", label:"Savings account", note:"Interest-bearing deposit. FSCS protected.", liquid:true },
      { value:"cash_isa", label:"Cash ISA", note:"Tax-free savings. £20,000/yr allowance.", liquid:true },
      { value:"fixed_bond", label:"Fixed-rate bond", note:"Fixed-term savings. FSCS protected.", liquid:false }
    ]},
    { group:"Investment accounts", accounts:[
      { value:"stocks_isa", label:"Stocks & Shares ISA", note:"Tax-free investment. Up to £20,000/yr. No CGT or dividend tax.", liquid:true },
      { value:"lifetime_isa", label:"Lifetime ISA (LISA)", note:"25% government bonus up to £1,000/yr. £4,000/yr limit.", liquid:false },
      { value:"gia", label:"General investment account (GIA)", note:"Taxable brokerage account.", liquid:true }
    ]},
    { group:"Pension & retirement", accounts:[
      { value:"sipp", label:"SIPP", note:"Self-Invested Personal Pension. 25% tax-free lump sum at retirement.", liquid:false },
      { value:"workplace_pension", label:"Workplace pension", note:"Auto-enrolment. Minimum 8% total contribution.", liquid:false },
      { value:"db_pension", label:"Defined benefit pension", note:"Guaranteed income based on salary and service years.", liquid:false },
      { value:"state_pension", label:"State pension (estimated annual)", note:"Full new state pension: £11,502/yr (2024/25).", liquid:false }
    ]},
    { group:"Other assets", accounts:[
      { value:"premium_bonds", label:"Premium bonds", note:"NS&I tax-free monthly prize draws. Max £50,000.", liquid:true },
      { value:"crypto", label:"Cryptocurrency", note:"HMRC treats as property. CGT applies.", liquid:true },
      { value:"other_asset", label:"Other asset", note:"Any other asset.", liquid:true }
    ]}
  ]},
  AU: { flag:"🇦🇺", name:"Australia", groups:[
    { group:"Cash & banking", accounts:[
      { value:"transaction", label:"Transaction account", note:"Standard account. APRA/FGCS protected up to $250k.", liquid:true },
      { value:"savings", label:"Savings account", note:"Interest-bearing deposit.", liquid:true },
      { value:"term_deposit", label:"Term deposit", note:"Fixed-term at guaranteed rate.", liquid:false },
      { value:"offset", label:"Mortgage offset account", note:"Linked to mortgage; balance offsets interest.", liquid:true }
    ]},
    { group:"Superannuation", accounts:[
      { value:"super_accum", label:"Superannuation (accumulation)", note:"Employer + voluntary contributions. Concessional limit: $30,000/yr (2024-25).", liquid:false },
      { value:"super_pension", label:"Superannuation (pension phase)", note:"Account-based pension. Tax-free earnings after age 60.", liquid:false },
      { value:"smsf", label:"SMSF", note:"Self-Managed Super Fund. Up to 6 members. ATO regulated.", liquid:false },
      { value:"age_pension", label:"Age pension (estimated annual)", note:"Government means-tested pension.", liquid:false }
    ]},
    { group:"Investment accounts", accounts:[
      { value:"brokerage", label:"Brokerage / share trading account", note:"Taxable account. 50% CGT discount after 12 months.", liquid:true },
      { value:"managed_fund", label:"Managed fund / unit trust", note:"Pooled investment vehicle.", liquid:true }
    ]},
    { group:"Other assets", accounts:[
      { value:"crypto", label:"Cryptocurrency", note:"CGT asset per ATO. 50% discount after 12 months.", liquid:true },
      { value:"other_asset", label:"Other asset", note:"Any other asset.", liquid:true }
    ]}
  ]},
  CH: { flag:"🇨🇭", name:"Switzerland", groups:[
    { group:"Banking", accounts:[
      { value:"private_account", label:"Privatkonto / Compte privé", note:"Standard Swiss account. esisuisse protected up to CHF 100,000.", liquid:true },
      { value:"savings_account", label:"Sparkonto / Compte d'épargne", note:"Interest-bearing savings.", liquid:true },
      { value:"fixed_deposit", label:"Festgeld / Dépôt à terme", note:"Fixed-term deposit.", liquid:false }
    ]},
    { group:"Pension system (3 pillars)", accounts:[
      { value:"ahv_avs", label:"AHV/AVS – 1st pillar (estimated annual)", note:"State pension. Max CHF 29,400/yr (2024).", liquid:false },
      { value:"bvg_lpp", label:"BVG/LPP – 2nd pillar (occupational)", note:"Mandatory occupational pension fund.", liquid:false },
      { value:"pillar_3a", label:"Pillar 3a – tied pension", note:"Tax-deductible. 2024 limit: CHF 7,056 (employed).", liquid:false },
      { value:"pillar_3b", label:"Pillar 3b – free pension", note:"Flexible non-tied savings. No contribution limits.", liquid:true },
      { value:"vested_benefits", label:"Vested benefits account", note:"Preserved BVG assets during career gap.", liquid:false }
    ]},
    { group:"Investment & securities", accounts:[
      { value:"depot", label:"Securities account (Depot)", note:"Swiss brokerage. Capital gains largely tax-free for private investors.", liquid:true },
      { value:"fund_account", label:"Investment fund account", note:"Swiss-domiciled collective investment.", liquid:true }
    ]},
    { group:"Other assets", accounts:[
      { value:"crypto", label:"Cryptocurrency", note:"Wealth tax asset. Gains typically tax-free for private investors.", liquid:true },
      { value:"other_asset", label:"Other asset", note:"Any other asset.", liquid:true }
    ]}
  ]},
  EU: { flag:"🇪🇺", name:"Euro zone", groups:[
    { group:"Banking", accounts:[
      { value:"current", label:"Current / checking account", note:"EU Deposit Guarantee Scheme protects up to €100,000.", liquid:true },
      { value:"savings", label:"Savings account", note:"Interest-bearing deposit. Protected up to €100,000.", liquid:true },
      { value:"term_deposit", label:"Term / fixed deposit", note:"Fixed-term savings. Protected up to €100,000.", liquid:false },
      { value:"livret_a", label:"Livret A (France)", note:"Tax-free regulated savings. Cap €22,950.", liquid:true }
    ]},
    { group:"Investment accounts", accounts:[
      { value:"pea", label:"PEA (France)", note:"Equity savings plan. Tax-free after 5 years. Max €150,000.", liquid:true },
      { value:"securities_depot", label:"Securities depot", note:"Standard taxable brokerage.", liquid:true }
    ]},
    { group:"Pension & retirement", accounts:[
      { value:"state_pension", label:"State pension (estimated annual)", note:"Country-specific public pension.", liquid:false },
      { value:"occupational_pension", label:"Occupational pension", note:"Employer-sponsored pension scheme.", liquid:false },
      { value:"private_pension", label:"Private pension plan", note:"Personal pension product (Riester, Rürup, PEP, etc.).", liquid:false }
    ]},
    { group:"Other assets", accounts:[
      { value:"crypto", label:"Cryptocurrency", note:"Tax treatment varies by EU member state.", liquid:true },
      { value:"other_asset", label:"Other asset", note:"Any other asset.", liquid:true }
    ]}
  ]},
  JP: { flag:"🇯🇵", name:"Japan", groups:[
    { group:"Banking", accounts:[
      { value:"futsu", label:"普通預金 (Futsū yokin)", note:"Standard bank deposit. Insurance up to ¥10M.", liquid:true },
      { value:"teiki", label:"定期預金 (Teiki yokin)", note:"Fixed-term deposit.", liquid:false }
    ]},
    { group:"Investment & tax-advantaged", accounts:[
      { value:"nisa", label:"NISA (新NISA)", note:"New NISA (2024+): ¥3.6M/yr growth limit. Lifetime cap ¥18M. Tax-free.", liquid:true },
      { value:"ideco", label:"iDeCo (個人型確定拠出年金)", note:"Individual pension. Tax-deductible. Accessible at age 60.", liquid:false },
      { value:"general_brokerage", label:"General brokerage account", note:"Taxable. 20.315% tax on gains.", liquid:true }
    ]},
    { group:"Pension & retirement", accounts:[
      { value:"kosei_nenkin", label:"厚生年金 (Employee pension)", note:"Social insurance pension for employees.", liquid:false },
      { value:"kokumin_nenkin", label:"国民年金 (National pension)", note:"Basic flat-rate pension.", liquid:false },
      { value:"corporate_pension", label:"企業年金 Corporate pension", note:"Employer defined benefit or contribution plan.", liquid:false }
    ]},
    { group:"Other assets", accounts:[
      { value:"crypto", label:"仮想通貨 Cryptocurrency", note:"Taxed as miscellaneous income. Up to 55% marginal rate.", liquid:true },
      { value:"other_asset", label:"Other asset", note:"Any other asset.", liquid:true }
    ]}
  ]},
  SG: { flag:"🇸🇬", name:"Singapore", groups:[
    { group:"Banking", accounts:[
      { value:"savings", label:"Savings account", note:"SDIC insured up to SGD 100,000.", liquid:true },
      { value:"fixed_deposit", label:"Fixed deposit", note:"Fixed-term savings. SDIC insured.", liquid:false }
    ]},
    { group:"CPF (Central Provident Fund)", accounts:[
      { value:"cpf_oa", label:"CPF Ordinary Account (OA)", note:"2.5% p.a. For housing, education, insurance.", liquid:false },
      { value:"cpf_sa", label:"CPF Special Account (SA)", note:"4% p.a. Long-term retirement savings.", liquid:false },
      { value:"cpf_ma", label:"CPF Medisave Account (MA)", note:"4% p.a. For healthcare and MediShield Life.", liquid:false },
      { value:"cpf_ra", label:"CPF Retirement Account (RA)", note:"Formed at age 55. Funds CPF LIFE payouts.", liquid:false },
      { value:"srs", label:"SRS (Supplementary Retirement Scheme)", note:"Voluntary. Tax relief. SGD 15,300/yr limit.", liquid:false }
    ]},
    { group:"Investment accounts", accounts:[
      { value:"cdp", label:"CDP securities account", note:"Central Depository for SGX-listed stocks and bonds.", liquid:true },
      { value:"brokerage", label:"Brokerage account", note:"For local and global equities, ETFs.", liquid:true }
    ]},
    { group:"Other assets", accounts:[
      { value:"crypto", label:"Cryptocurrency", note:"Capital gains generally not taxed for individuals in Singapore.", liquid:true },
      { value:"other_asset", label:"Other asset", note:"Any other asset.", liquid:true }
    ]}
  ]},
  HK: { flag:"🇭🇰", name:"Hong Kong", groups:[
    { group:"Banking", accounts:[
      { value:"savings", label:"Savings account", note:"HKDPS protects up to HKD 500,000.", liquid:true },
      { value:"time_deposit", label:"Time deposit", note:"Fixed-term savings.", liquid:false },
      { value:"multi_currency", label:"Multi-currency account", note:"Holds HKD, USD, CNH, etc.", liquid:true }
    ]},
    { group:"MPF (Mandatory Provident Fund)", accounts:[
      { value:"mpf", label:"MPF – employee mandatory", note:"5% employee + 5% employer. Accessible at 65.", liquid:false },
      { value:"mpf_voluntary", label:"MPF – voluntary (TVC)", note:"Tax-deductible up to HKD 60,000/yr.", liquid:false }
    ]},
    { group:"Investment accounts", accounts:[
      { value:"securities", label:"Securities account (HKEx)", note:"No capital gains tax in HK.", liquid:true },
      { value:"unit_trust", label:"Unit trust / mutual fund", note:"Pooled investment fund.", liquid:true }
    ]},
    { group:"Other assets", accounts:[
      { value:"crypto", label:"Cryptocurrency", note:"Capital gains generally not taxed for individuals in HK.", liquid:true },
      { value:"other_asset", label:"Other asset", note:"Any other asset.", liquid:true }
    ]}
  ]},
  CN: { flag:"🇨🇳", name:"China", groups:[
    { group:"Banking", accounts:[
      { value:"demand_deposit", label:"活期存款 Demand deposit", note:"Deposit insurance up to RMB 500,000.", liquid:true },
      { value:"time_deposit", label:"定期存款 Time deposit", note:"Fixed-term savings.", liquid:false }
    ]},
    { group:"Social insurance & pension", accounts:[
      { value:"basic_pension", label:"基本养老保险 Basic pension", note:"Mandatory. 15 years contributions required.", liquid:false },
      { value:"enterprise_annuity", label:"企业年金 Enterprise annuity", note:"Voluntary employer supplemental pension.", liquid:false },
      { value:"personal_pension", label:"个人养老金 Personal pension", note:"New (2022+). Max RMB 12,000/yr tax-deductible.", liquid:false }
    ]},
    { group:"Investment", accounts:[
      { value:"a_shares", label:"A-share brokerage", note:"Shanghai/Shenzhen equities. No CGT for individuals.", liquid:true },
      { value:"fund_account", label:"公募基金 Mutual fund", note:"Regulated public funds.", liquid:true }
    ]},
    { group:"Other assets", accounts:[
      { value:"crypto", label:"Cryptocurrency", note:"Note: crypto trading is restricted in mainland China.", liquid:true },
      { value:"other_asset", label:"Other asset", note:"Any other asset.", liquid:true }
    ]}
  ]},
  TW: { flag:"🇹🇼", name:"Taiwan", groups:[
    { group:"Banking", accounts:[
      { value:"demand", label:"活期存款 Demand deposit", note:"CDIC covers up to NTD 3,000,000.", liquid:true },
      { value:"time_deposit", label:"定期存款 Time deposit", note:"Fixed-term. Deposit insured.", liquid:false }
    ]},
    { group:"Pension", accounts:[
      { value:"labour_pension_new", label:"勞工退休金 (New DC system)", note:"6% employer + voluntary employee. Portable.", liquid:false },
      { value:"national_pension", label:"國民年金 National pension", note:"Basic retirement income.", liquid:false }
    ]},
    { group:"Investment", accounts:[
      { value:"twse_brokerage", label:"TWSE brokerage account", note:"Taiwan Stock Exchange equities.", liquid:true },
      { value:"fund", label:"共同基金 Mutual fund", note:"Domestic or offshore funds.", liquid:true }
    ]},
    { group:"Other assets", accounts:[
      { value:"crypto", label:"Cryptocurrency", note:"Treated as property. Gains may be taxable.", liquid:true },
      { value:"other_asset", label:"Other asset", note:"Any other asset.", liquid:true }
    ]}
  ]},
  KR: { flag:"🇰🇷", name:"South Korea", groups:[
    { group:"Banking", accounts:[
      { value:"demand_deposit", label:"보통예금 Demand deposit", note:"KDIC insured up to KRW 50,000,000.", liquid:true },
      { value:"time_deposit", label:"정기예금 Time deposit", note:"Fixed-term. KDIC insured.", liquid:false }
    ]},
    { group:"Pension", accounts:[
      { value:"nps", label:"국민연금 NPS", note:"Mandatory social pension. 9% of salary.", liquid:false },
      { value:"irp", label:"IRP (개인형퇴직연금)", note:"Up to KRW 9M/yr tax deduction.", liquid:false },
      { value:"dc", label:"DC 확정기여형 퇴직연금", note:"Defined contribution workplace pension.", liquid:false }
    ]},
    { group:"Investment", accounts:[
      { value:"isa", label:"ISA (개인종합자산관리계좌)", note:"KRW 20M/yr. Tax exemption on first KRW 2M gains.", liquid:true },
      { value:"brokerage", label:"증권계좌 Securities account", note:"KRX equities.", liquid:true }
    ]},
    { group:"Other assets", accounts:[
      { value:"crypto", label:"가상자산 Cryptocurrency", note:"20% tax on gains over KRW 2.5M annually.", liquid:true },
      { value:"other_asset", label:"Other asset", note:"Any other asset.", liquid:true }
    ]}
  ]},
  IN: { flag:"🇮🇳", name:"India", groups:[
    { group:"Banking", accounts:[
      { value:"savings", label:"Savings bank account", note:"DICGC insured up to ₹5 lakh per bank.", liquid:true },
      { value:"fd", label:"Fixed deposit (FD)", note:"Insured up to ₹5 lakh. Interest taxed as income.", liquid:false },
      { value:"rd", label:"Recurring deposit (RD)", note:"Monthly fixed savings with compound interest.", liquid:false }
    ]},
    { group:"Provident fund & pension", accounts:[
      { value:"epf", label:"EPF (Employees' Provident Fund)", note:"Mandatory. 12% employer + 12% employee.", liquid:false },
      { value:"ppf", label:"PPF (Public Provident Fund)", note:"7.1% p.a. Max ₹1.5L/yr. 15-year lock-in. EEE tax treatment.", liquid:false },
      { value:"nps", label:"NPS (National Pension System)", note:"Tax deduction up to ₹2L/yr (Tier I).", liquid:false }
    ]},
    { group:"Investment accounts", accounts:[
      { value:"demat", label:"Demat + trading account", note:"BSE/NSE equities. Long-term CGT 12.5% above ₹1.25L.", liquid:true },
      { value:"mutual_fund", label:"Mutual fund / SIP", note:"ELSS funds offer ₹1.5L/yr tax deduction (Sec 80C).", liquid:true }
    ]},
    { group:"Other assets", accounts:[
      { value:"sgb", label:"Sovereign Gold Bond (SGB)", note:"Government gold bond. 2.5% interest. CGT-exempt at maturity.", liquid:false },
      { value:"crypto", label:"Cryptocurrency", note:"30% flat tax on gains + 1% TDS.", liquid:true },
      { value:"other_asset", label:"Other asset", note:"Any other asset.", liquid:true }
    ]}
  ]},
  ID: { flag:"🇮🇩", name:"Indonesia", groups:[
    { group:"Banking", accounts:[
      { value:"tabungan", label:"Tabungan (Savings)", note:"LPS insures up to IDR 2 billion.", liquid:true },
      { value:"deposito", label:"Deposito (Time deposit)", note:"20% final withholding tax on interest.", liquid:false }
    ]},
    { group:"Pension & social insurance", accounts:[
      { value:"bpjs_hari_tua", label:"BPJS JHT (Old Age Insurance)", note:"Accessible at age 56 or upon resignation.", liquid:false },
      { value:"bpjs_pensiun", label:"BPJS JP (Pension program)", note:"Monthly benefit at age 57.", liquid:false }
    ]},
    { group:"Investment", accounts:[
      { value:"reksa_dana", label:"Reksa Dana (Mutual fund)", note:"OJK regulated.", liquid:true },
      { value:"saham", label:"IDX equities account", note:"0.1% STT on sales.", liquid:true },
      { value:"obligasi", label:"SBN (Gov't bonds)", note:"Retail government bonds. Tax-free for retail investors.", liquid:false }
    ]},
    { group:"Other assets", accounts:[
      { value:"crypto", label:"Cryptocurrency", note:"0.11% VAT + 0.1% income tax per transaction.", liquid:true },
      { value:"other_asset", label:"Other asset", note:"Any other asset.", liquid:true }
    ]}
  ]},
  MX: { flag:"🇲🇽", name:"Mexico", groups:[
    { group:"Banking", accounts:[
      { value:"cuenta_debito", label:"Cuenta de débito", note:"IPAB insures up to 400,000 UDIs (~MXN 3.4M).", liquid:true },
      { value:"ahorro", label:"Cuenta de ahorro (Savings)", note:"Interest-bearing savings account.", liquid:true }
    ]},
    { group:"Retirement (Afore)", accounts:[
      { value:"afore", label:"AFORE retirement account", note:"Mandatory individual retirement account.", liquid:false },
      { value:"ppe", label:"PPE / PPI (Voluntary pension)", note:"Tax-deductible up to 10% of gross income.", liquid:false }
    ]},
    { group:"Investment", accounts:[
      { value:"casa_bolsa", label:"Casa de bolsa (Brokerage)", note:"BMV-listed equities and funds.", liquid:true },
      { value:"cetes", label:"CETES (Gov't bonds)", note:"Treasury bills via cetesdirecto.com.", liquid:true }
    ]},
    { group:"Other assets", accounts:[
      { value:"crypto", label:"Cryptocurrency", note:"Subject to ISR as miscellaneous income.", liquid:true },
      { value:"other_asset", label:"Other asset", note:"Any other asset.", liquid:true }
    ]}
  ]},
  BR: { flag:"🇧🇷", name:"Brazil", groups:[
    { group:"Banking", accounts:[
      { value:"conta_corrente", label:"Conta corrente (Current account)", note:"FGC insures up to R$250,000 per CPF.", liquid:true },
      { value:"poupanca", label:"Poupança (Savings)", note:"Tax-free returns. Regulated rate.", liquid:true },
      { value:"cdb", label:"CDB (Bank deposit certificate)", note:"FGC protected. IR tax on gains.", liquid:false }
    ]},
    { group:"Pension", accounts:[
      { value:"inss", label:"INSS (Social security pension)", note:"Enter estimated monthly benefit × 12.", liquid:false },
      { value:"pgbl", label:"PGBL (Pension plan)", note:"Deductible up to 12% of gross income.", liquid:false },
      { value:"vgbl", label:"VGBL (Life pension plan)", note:"No IR deduction but tax only on gains.", liquid:false }
    ]},
    { group:"Investment", accounts:[
      { value:"tesouro_direto", label:"Tesouro Direto (Gov't bonds)", note:"SELIC, IPCA+, pre-fixed options.", liquid:true },
      { value:"acoes", label:"B3 brokerage account", note:"Monthly gains over R$20k taxed at 15%.", liquid:true },
      { value:"lci_lca", label:"LCI / LCA", note:"Tax-free for individuals. FGC protected.", liquid:false }
    ]},
    { group:"Other assets", accounts:[
      { value:"crypto", label:"Cryptocurrency", note:"15–22.5% IR on monthly gains over R$35k.", liquid:true },
      { value:"other_asset", label:"Other asset", note:"Any other asset.", liquid:true }
    ]}
  ]},
  SA: { flag:"🇸🇦", name:"Saudi Arabia", groups:[
    { group:"Banking", accounts:[
      { value:"current", label:"Current account (حساب جارٍ)", note:"SAMA regulated.", liquid:true },
      { value:"savings", label:"Savings account (حساب توفير)", note:"Shariah-compliant profit-sharing deposit.", liquid:true }
    ]},
    { group:"Pension & social insurance", accounts:[
      { value:"gosi", label:"GOSI (التأمينات الاجتماعية)", note:"9% employer + 9% employee for Saudi nationals.", liquid:false },
      { value:"ppa", label:"PPA (Public Pension Agency)", note:"For government employees. Defined benefit.", liquid:false }
    ]},
    { group:"Investment", accounts:[
      { value:"tadawul", label:"Tadawul brokerage (تداول)", note:"Saudi Exchange equities. No CGT for Saudi nationals.", liquid:true },
      { value:"sukuk", label:"Sukuk (صكوك)", note:"Shariah-compliant bonds.", liquid:false }
    ]},
    { group:"Other assets", accounts:[
      { value:"crypto", label:"Cryptocurrency", note:"Regulatory status evolving. SAMA has cautioned against use.", liquid:true },
      { value:"other_asset", label:"Other asset", note:"Any other asset.", liquid:true }
    ]}
  ]},
  ZA: { flag:"🇿🇦", name:"South Africa", groups:[
    { group:"Banking", accounts:[
      { value:"cheque", label:"Cheque / current account", note:"No formal government DGS in South Africa.", liquid:true },
      { value:"savings", label:"Savings account", note:"Interest taxed above annual exemption (R23,800).", liquid:true },
      { value:"fixed_deposit", label:"Fixed deposit", note:"Fixed-term savings.", liquid:false }
    ]},
    { group:"Tax-advantaged savings", accounts:[
      { value:"tfsa", label:"TFSA (Tax-Free Savings Account)", note:"R36,000/yr limit. R500,000 lifetime cap. Fully tax-free growth.", liquid:true },
      { value:"retirement_annuity", label:"Retirement annuity (RA)", note:"Tax-deductible (27.5% of income, max R350,000/yr). Accessible from age 55.", liquid:false }
    ]},
    { group:"Pension & provident funds", accounts:[
      { value:"pension_fund", label:"Pension fund", note:"1/3 lump sum + 2/3 annuity at retirement.", liquid:false },
      { value:"provident_fund", label:"Provident fund", note:"Harmonised with pension from 2024.", liquid:false },
      { value:"living_annuity", label:"Living annuity", note:"Post-retirement drawdown. 2.5–17.5% annual drawdown.", liquid:false }
    ]},
    { group:"Investment", accounts:[
      { value:"discretionary", label:"Discretionary investment account", note:"CGT inclusion rate 40% for individuals.", liquid:true },
      { value:"unit_trust", label:"Unit trust", note:"CISCA-regulated pooled fund.", liquid:true }
    ]},
    { group:"Other assets", accounts:[
      { value:"crypto", label:"Cryptocurrency", note:"Taxed as income or CGT depending on trading intent.", liquid:true },
      { value:"other_asset", label:"Other asset", note:"Any other asset.", liquid:true }
    ]}
  ]},
  OTHER: { flag:"🌍", name:"Other", groups:[
    { group:"Cash & banking", accounts:[
      { value:"checking", label:"Checking / current account", note:"Standard transactional account.", liquid:true },
      { value:"savings", label:"Savings account", note:"Interest-bearing deposit.", liquid:true },
      { value:"term_deposit", label:"Term / fixed deposit", note:"Fixed-term savings.", liquid:false }
    ]},
    { group:"Investment accounts", accounts:[
      { value:"brokerage", label:"Brokerage / investment account", note:"Taxable investment account.", liquid:true },
      { value:"mutual_fund", label:"Mutual fund / unit trust", note:"Pooled investment vehicle.", liquid:true }
    ]},
    { group:"Pension & retirement", accounts:[
      { value:"state_pension", label:"State pension (estimated annual)", note:"Government retirement benefit.", liquid:false },
      { value:"occupational_pension", label:"Occupational pension", note:"Employer-sponsored pension.", liquid:false },
      { value:"private_pension", label:"Private pension plan", note:"Individual retirement savings.", liquid:false }
    ]},
    { group:"Other", accounts:[
      { value:"crypto", label:"Cryptocurrency", note:"Digital assets.", liquid:true },
      { value:"other_asset", label:"Other asset", note:"Any other asset.", liquid:true }
    ]}
  ]}
};

// ─── Group display colors ─────────────────────────────────────────────────────
const GROUP_COLORS = {
  "Cash & banking":      { bg:"rgba(76,175,125,0.15)",  text:"#4caf7d",  border:"rgba(76,175,125,0.3)"  },
  "Banking":             { bg:"rgba(76,175,125,0.15)",  text:"#4caf7d",  border:"rgba(76,175,125,0.3)"  },
  "Investment accounts": { bg:"rgba(91,155,213,0.15)",  text:"#5b9bd5",  border:"rgba(91,155,213,0.3)"  },
  "Investment & tax-advantaged":{ bg:"rgba(91,155,213,0.15)", text:"#5b9bd5", border:"rgba(91,155,213,0.3)" },
  "Investment":          { bg:"rgba(91,155,213,0.15)",  text:"#5b9bd5",  border:"rgba(91,155,213,0.3)"  },
  "Investment & other":  { bg:"rgba(91,155,213,0.15)",  text:"#5b9bd5",  border:"rgba(91,155,213,0.3)"  },
  "Investment & securities":{ bg:"rgba(91,155,213,0.15)", text:"#5b9bd5", border:"rgba(91,155,213,0.3)" },
  "Retirement accounts": { bg:"rgba(139,109,206,0.15)", text:"#8b6dce",  border:"rgba(139,109,206,0.3)" },
  "Pension & retirement":{ bg:"rgba(139,109,206,0.15)", text:"#8b6dce",  border:"rgba(139,109,206,0.3)" },
  "Superannuation":      { bg:"rgba(139,109,206,0.15)", text:"#8b6dce",  border:"rgba(139,109,206,0.3)" },
  "CPF (Central Provident Fund)": { bg:"rgba(139,109,206,0.15)", text:"#8b6dce", border:"rgba(139,109,206,0.3)" },
  "MPF (Mandatory Provident Fund)":{ bg:"rgba(139,109,206,0.15)", text:"#8b6dce", border:"rgba(139,109,206,0.3)" },
  "Pension & provident funds":{ bg:"rgba(139,109,206,0.15)", text:"#8b6dce", border:"rgba(139,109,206,0.3)" },
  "Pension system (3 pillars)":{ bg:"rgba(139,109,206,0.15)", text:"#8b6dce", border:"rgba(139,109,206,0.3)" },
  "Pension":             { bg:"rgba(139,109,206,0.15)", text:"#8b6dce",  border:"rgba(139,109,206,0.3)" },
  "Pension & workplace": { bg:"rgba(139,109,206,0.15)", text:"#8b6dce",  border:"rgba(139,109,206,0.3)" },
  "Registered accounts": { bg:"rgba(139,109,206,0.15)", text:"#8b6dce",  border:"rgba(139,109,206,0.3)" },
  "Tax-advantaged savings":{ bg:"rgba(139,109,206,0.15)", text:"#8b6dce", border:"rgba(139,109,206,0.3)" },
  "Social insurance & pension":{ bg:"rgba(139,109,206,0.15)", text:"#8b6dce", border:"rgba(139,109,206,0.3)" },
  "Pension (Afore)":     { bg:"rgba(139,109,206,0.15)", text:"#8b6dce",  border:"rgba(139,109,206,0.3)" },
  "Retirement (Afore)":  { bg:"rgba(139,109,206,0.15)", text:"#8b6dce",  border:"rgba(139,109,206,0.3)" },
  "Pension & social insurance":{ bg:"rgba(139,109,206,0.15)", text:"#8b6dce", border:"rgba(139,109,206,0.3)" }
};

function getGroupColor(group) {
  if (GROUP_COLORS[group]) return GROUP_COLORS[group];
  if (group.toLowerCase().includes("pension") || group.toLowerCase().includes("retire") || group.toLowerCase().includes("super") || group.toLowerCase().includes("cpf") || group.toLowerCase().includes("mpf"))
    return { bg:"rgba(139,109,206,0.15)", text:"#8b6dce", border:"rgba(139,109,206,0.3)" };
  if (group.toLowerCase().includes("invest") || group.toLowerCase().includes("broker") || group.toLowerCase().includes("securit"))
    return { bg:"rgba(91,155,213,0.15)", text:"#5b9bd5", border:"rgba(91,155,213,0.3)" };
  if (group.toLowerCase().includes("bank") || group.toLowerCase().includes("cash"))
    return { bg:"rgba(76,175,125,0.15)", text:"#4caf7d", border:"rgba(76,175,125,0.3)" };
  return { bg:"rgba(160,152,144,0.15)", text:"#a09890", border:"rgba(160,152,144,0.3)" };
}

// ─── Inflation regions ────────────────────────────────────────────────────────
const REGIONS = {
  us:{ rate:3.8, flag:"🇺🇸", name:"United States",  note:"50-yr avg CPI-U (1974–2024): 3.8%" },
  ca:{ rate:3.7, flag:"🇨🇦", name:"Canada",          note:"50-yr avg CPI (1974–2024): 3.7%" },
  mx:{ rate:15.2,flag:"🇲🇽", name:"Mexico",          note:"50-yr avg CPI (1974–2024): 15.2% — includes high-inflation decades of 1980s–90s. Adjust manually for current outlook." },
  eu:{ rate:3.1, flag:"🇪🇺", name:"Euro zone",       note:"50-yr avg HICP blended (1974–2024): 3.1%" },
  uk:{ rate:4.8, flag:"🇬🇧", name:"United Kingdom",  note:"50-yr avg RPI/CPI (1974–2024): 4.8%" },
  ch:{ rate:2.1, flag:"🇨🇭", name:"Switzerland",     note:"50-yr avg CPI (1974–2024): 2.1% — among the world's lowest" },
  jp:{ rate:2.0, flag:"🇯🇵", name:"Japan",            note:"50-yr avg CPI (1974–2024): 2.0% — prolonged deflation era 1998–2012 pulls average down" },
  cn:{ rate:3.9, flag:"🇨🇳", name:"China & Taiwan",  note:"50-yr blended avg CPI (1974–2024): 3.9% — China ~4.2%, Taiwan ~3.3%" },
  sg:{ rate:2.8, flag:"🇸🇬", name:"Singapore",       note:"50-yr avg CPI (1974–2024): 2.8%" },
  au:{ rate:4.4, flag:"🇦🇺", name:"Australia",       note:"50-yr avg CPI (1974–2024): 4.4%" },
  hk:{ rate:4.1, flag:"🇭🇰", name:"Hong Kong",       note:"50-yr avg CPI (1974–2024): 4.1%" },
  kr:{ rate:5.2, flag:"🇰🇷", name:"South Korea",     note:"50-yr avg CPI (1974–2024): 5.2%" },
  in:{ rate:7.4, flag:"🇮🇳", name:"India",           note:"50-yr avg CPI (1974–2024): 7.4%" },
  id:{ rate:11.6,flag:"🇮🇩", name:"Indonesia",       note:"50-yr avg CPI (1974–2024): 11.6% — includes 1998 hyperinflationary spike" },
  sa:{ rate:2.5, flag:"🇸🇦", name:"Saudi Arabia",    note:"50-yr avg CPI (1974–2024): 2.5% — oil-pegged economy keeps inflation subdued" },
  za:{ rate:8.9, flag:"🇿🇦", name:"South Africa",    note:"50-yr avg CPI (1974–2024): 8.9%" },
  br:{ rate:58.5,flag:"🇧🇷", name:"Brazil",          note:"50-yr avg CPI (1974–2024): 58.5% — hyperinflation 1980s–1994. Post-Real Plan avg ~7%. Adjust manually for current outlook." }
};

// ─── Risk profiles ────────────────────────────────────────────────────────────
const RISK_PROFILES = {
  very_conservative:     { label:"Very conservative",     color:"#5b9bd5", bg:"rgba(91,155,213,0.15)",  border:"rgba(91,155,213,0.3)",  retMean:3.5,  retVol:4,  note:"Capital preservation focus. Mostly bonds and cash. Minimal equity exposure." },
  conservative:          { label:"Conservative",          color:"#5b9bd5", bg:"rgba(91,155,213,0.15)",  border:"rgba(91,155,213,0.3)",  retMean:4.5,  retVol:7,  note:"Income-oriented. Heavy fixed income, small equity allocation (~20–30%)." },
  moderately_conservative:{ label:"Moderately conservative",color:"#4caf7d",bg:"rgba(76,175,125,0.15)",border:"rgba(76,175,125,0.3)",  retMean:5.5, retVol:9,  note:"Balanced tilt toward safety. ~40% equities, 60% fixed income." },
  moderate:              { label:"Moderate",              color:"#4caf7d", bg:"rgba(76,175,125,0.15)",  border:"rgba(76,175,125,0.3)",  retMean:7.0,  retVol:12, note:"Classic 60/40 balanced portfolio. Equal focus on growth and stability." },
  moderately_aggressive: { label:"Moderately aggressive", color:"#c9a96e", bg:"rgba(201,169,110,0.15)", border:"rgba(201,169,110,0.3)", retMean:8.5, retVol:15, note:"Growth-oriented. ~70–75% equities, 25–30% bonds." },
  aggressive:            { label:"Aggressive",            color:"#d4956a", bg:"rgba(212,149,106,0.15)", border:"rgba(212,149,106,0.3)", retMean:10.0, retVol:18, note:"Primarily equities (~85–90%). Accepts significant short-term volatility." },
  very_aggressive:       { label:"Very aggressive",       color:"#e05c5c", bg:"rgba(224,92,92,0.15)",   border:"rgba(224,92,92,0.3)",   retMean:12.0, retVol:22, note:"Concentrated equity / alternative investments. High risk, high potential return." }
};

// ─── Time horizons ────────────────────────────────────────────────────────────
const HORIZON_PROFILES = {
  "1_3":    { label:"1–3 years",   color:"#5b9bd5", bg:"rgba(91,155,213,0.15)",  note:"Short-term focus. Preserve capital. Avoid volatile assets." },
  "3_5":    { label:"3–5 years",   color:"#4caf7d", bg:"rgba(76,175,125,0.15)",  note:"Near-term goal. Moderate stability required. Limited equity exposure." },
  "5_10":   { label:"5–10 years",  color:"#4caf7d", bg:"rgba(76,175,125,0.15)",  note:"Medium-term. Balanced approach with measured growth strategy." },
  "10_15":  { label:"10–15 years", color:"#c9a96e", bg:"rgba(201,169,110,0.15)", note:"Medium-to-long term. Can tolerate moderate volatility for compound growth." },
  "15_20":  { label:"15–20 years", color:"#d4956a", bg:"rgba(212,149,106,0.15)", note:"Long-term planning. Equity-heavy allocation is appropriate." },
  "20_30":  { label:"20–30 years", color:"#d4956a", bg:"rgba(212,149,106,0.15)", note:"Long horizon. Maximize growth through diversified equity portfolio." },
  "30_plus":{ label:"30+ years",   color:"#e05c5c", bg:"rgba(224,92,92,0.15)",   note:"Very long horizon. Aggressive growth strategy is well-suited." }
};

// ─── Loan data ────────────────────────────────────────────────────────────────
const LOAN_DEFAULTS = {
  mortgage_primary:   { rate:6.5,  yrs:25 },
  mortgage_secondary: { rate:7.5,  yrs:15 },
  heloc:              { rate:8.5,  yrs:10 },
  auto:               { rate:7.0,  yrs:5  },
  personal:           { rate:11.0, yrs:4  },
  student:            { rate:5.5,  yrs:10 },
  business:           { rate:8.0,  yrs:7  },
  cc:                 { rate:20.0, yrs:3  },
  payday:             { rate:36.0, yrs:0.5},
  other:              { rate:8.0,  yrs:5  }
};

const LOAN_LABELS = {
  mortgage_primary:"Primary mortgage", mortgage_secondary:"Secondary mortgage",
  heloc:"HELOC", auto:"Auto loan", personal:"Personal loan", student:"Student loan",
  business:"Business loan", cc:"Credit card", payday:"Payday loan", other:"Other"
};

const REL_LABELS = {
  spouse:"Spouse", domestic_partner:"Domestic partner", significant_other:"Significant other",
  partner:"Partner", fiance:"Fiancé / Fiancée", co_applicant:"Co-applicant",
  dependent:"Dependent", parent:"Parent", sibling:"Sibling",
  business_partner:"Business partner", other:"Other"
};
