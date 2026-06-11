#!/usr/bin/perl
use strict; use warnings; use Encode qw(encode_utf8 decode_utf8);
binmode STDOUT, ":utf8";

# Read the file
open my $fh, "<:encoding(UTF-8)", "wealth-analyzer.html" or die $!;
local $/; my $src = <$fh>; close $fh;

# Build the new section-map block (the hh body's duplicated start + all
# remaining old if-blocks → one clean SECTIONS map + iteration loop)
my $new_block = <<'PERL_END';
        // (Household profile body)
        const hhRows=[
          ["Client 1 name",(val("c1f")||"\x{2014}")+" "+(val("c1l")||"")],
          ["Client 1 age",a1age+" years"],
          ["Country / region",COUNTRY_ACCOUNTS[val("c1co")]?.name||val("c1co")||"\x{2014}"],
          ["Risk profile",RISK_PROFILES[val("c1r")]?.label||"\x{2014}"],
          ["Time horizon",HORIZON_PROFILES[val("c1h")]?.label||"\x{2014}"],
          ["Desired retirement age",num("retAge",65)+" years"],
        ];
        if(showC2){
          hhRows.push(["Client 2 name",(val("c2f")||"\x{2014}")+" "+(val("c2l")||"")]);
          hhRows.push(["Client 2 age",(ageFromDOB(val("c2d"))||"\x{2014}")+" years"]);
          hhRows.push(["Client 2 risk",RISK_PROFILES[val("c2r")]?.label||"\x{2014}"]);
        }
        if(children.length>0){
          hhRows.push(["Children",children.map(c=>(c.first||"Child")+(c.dob?" (age "+ageFromDOB(c.dob)+")":"")).join(", ")]);
        }
        kv(hhRows);
      },
      // \x{2500}\x{2500}\x{2500} INCOME, EXPENSES & TAX \x{2500}\x{2500}
      inc: () => {
        if(val("rptIncInc") === "no") return;
        checkY(30);
        sectionH2("Income, Expenses & Tax");
        const incRows=[
          ["Client 1 salary",          fmt(num("inc1",0))],
          ["Client 1 bonus / other",   fmt(num("inc2",0))],
        ];
        if(showC2){
          incRows.push(["Client 2 salary",   fmt(num("inc1b",0))]);
          incRows.push(["Client 2 bonus",    fmt(num("inc2b",0))]);
        }
        incRows.push(["Gross household income",  fmt(inc)]);
        incRows.push(["Estimated income tax",    fmt(tax)+" ("+(inc>0?(tax/inc*100).toFixed(1):0)+"% effective)"]);
        if(children.length>0) incRows.push(["Child / family benefit saving", fmt(getChildTaxSaving(inc))]);
        incRows.push(["Net after-tax income",    fmt(inc-tax)]);
        incRows.push(["",""]);
        incRows.push(["Living expenses",         fmt(num("expL",0))]);
        incRows.push(["Insurance / health",      fmt(num("expI",0))]);
        incRows.push(["Other expenses",          fmt(num("expO",0))]);
        incRows.push(["Total annual expenses",   fmt(exp)]);
        incRows.push(["Annual savings target",   fmt(sav)]);
        incRows.push(["Annual surplus / deficit",fmt(surplus)+(surplus<0?" \x{26A0}":"")]);
        kv(incRows);
      },
      // \x{2500}\x{2500}\x{2500} ASSETS & LIABILITIES \x{2500}\x{2500}
      assets: () => {
        if(val("rptIncAssets") === "no") return;
        checkY(30);
        sectionH2("Assets");
        if(assets.length>0){
          const aRows=assets.map(a=>[a.label, a.baseLabel||a.type, fmt(a.value), a.liquid?"Liquid":"Locked"]);
          if(num("aProp",0)>0) aRows.push(["Property / Real estate","Real estate",fmt(num("aProp",0)),"Illiquid"]);
          if(num("aOther",0)>0) aRows.push(["Other assets","Misc.",fmt(num("aOther",0)),"Illiquid"]);
          aRows.push(["TOTAL","",fmt(totA),""]);
          tbl(["Account / Asset","Type","Value","Liquidity"],aRows);
        } else { para("No assets entered."); }
        checkY(24);
        sectionH2("Liabilities");
        if(loans.length>0){
          tbl(["Loan","Balance","Rate","Remaining yrs","Monthly payment"],
            loans.map(l=>[l.label,fmt(l.bal),(l.rate*100).toFixed(2)+"%",l.yrs,fmt(loanMonthly(l))]));
        } else { para("No loans entered."); }
      },
      // \x{2500}\x{2500}\x{2500} GOALS & RETIREMENT \x{2500}\x{2500}
      goals: () => {
        if(val("rptIncGoals") === "no") return;
        checkY(30);
        sectionH2("Goals & Retirement Plan");
        if(goals.length>0){
          tbl(["Goal","Annual amount","Year range","Duration","Category","Tier"],
            goals.map(g=>[g.name, fmt(g.amt)+"/yr", g.startYear+"\x{2013}"+g.endYear,
              (g.endYear-g.startYear+1)+" yrs", g.cat||"\x{2014}", g.tier||"\x{2014}"]));
        } else { para("No goals defined."); }
        checkY(20);
        const retRows=[
          ["Desired retirement age",num("retAge",65)+" years"],
          ["Retirement spend (today's $)",fmt(num("retSpend",0))+" / yr"],
          ["Inflation rate assumption",num("inf",3.8).toFixed(1)+"% / yr"],
          ["Retirement account pool (seed)",fmt(retirementAccountSeed())],
          ["Pension / SS source",val("penSrc")||"\x{2014}"],
          ["Pension / SS start age",num("penStartAge",67)+" years"],
          ["Annual pension / SS",fmt(num("penAnnual",0))+" / yr"],
        ];
        if(showC2){
          retRows.push(["Client 2 pension source",val("penSrc2")||"\x{2014}"]);
          retRows.push(["Client 2 pension start",num("penStartAge2",67)+" years"]);
          retRows.push(["Client 2 annual pension",fmt(num("penAnnual2",0))+" / yr"]);
        }
        checkY(30); sectionH2("Retirement Parameters"); kv(retRows);
      },
      // \x{2500}\x{2500}\x{2500} PORTFOLIO \x{2500}\x{2500}
      port: () => {
        if(val("rptIncPort") === "no" || investments.length === 0) return;
        checkY(30);
        sectionH2("Portfolio Analysis ("+investments.length+" holdings)");
        const pfTot=portfolioInvestmentSeed();
        tbl(["Position","Ticker","Asset class","Value","Weight"],
          investments.map(i=>[i.name||"\x{2014}", i.tkr||"\x{2014}", INV_CLASS_LABELS[i.cls]||i.cls,
            fmt(i.val), pfTot>0?(i.val/pfTot*100).toFixed(1)+"%":"\x{2014}"]));
        kv([["Total portfolio value",fmt(pfTot)]]);
      },
      // \x{2500}\x{2500}\x{2500} INVESTMENT VEHICLE FACT SHEETS (Morningstar) \x{2500}\x{2500}
      factsheets: () => {
        if(!(wantFactsheets && factPositions.length>0)) return;
        newPage();
        sectionH2("Investment Vehicle Fact Sheets");
        const anyLive = Object.values(factSheets).some(d => d !== null);
        if(!anyLive){
          para("Fact sheet data unavailable \x{2014} configure Morningstar Direct proxy in admin \x{2192} API Keys to enable live fact sheets. Falling back to ticker-only summary.",[120,90,30]);
        } else {
          para("Live Morningstar Direct data shown where available. Positions without live data fall back to the ticker-only summary.",[80,80,80]);
        }
        const propTotalAlloc = proposals.reduce((s,p)=>s+(p.alloc||0),0) || 100;
        factPositions.forEach((p, idx)=>{
          const tkr = p.tkr.trim().toUpperCase();
          const data = factSheets[tkr] || null;
          checkY(40);
          if(idx>0) y += 2;
          doc.setFillColor(...acL);
          doc.rect(M, y-3, CW, 7, "F");
          doc.setFontSize(10); doc.setFont(undefined,"bold"); doc.setTextColor(...ac);
          doc.text(`${tkr} \x{2014} ${p.name||"Unnamed"}`, M+2, y+2);
          doc.setFont(undefined,"normal"); doc.setTextColor(40);
          y += 9;
          const ratingStr = data && data.rating!=null
            ? `${"\x{2605}".repeat(data.rating)}${"\x{2606}".repeat(5-data.rating)} (${data.rating} stars)`
            : "Not available";
          const fmtPct = v => (v!=null) ? v.toFixed(1)+"%" : "\x{2014}";
          const fmtNum = v => (v!=null) ? v.toFixed(2) : "\x{2014}";
          const dollar = (num("prAmount",0) || 0) * (p.alloc||0) / 100;
          const body = [
            ["Ticker", tkr],
            ["Name", p.name || "\x{2014}"],
            ["Vehicle", PROP_VEHICLE_LABELS[p.vehicle] || p.vehicle || "\x{2014}"],
            ["Asset class", INV_CLASS_LABELS[p.cls] || p.cls || "\x{2014}"],
            ["Region", p.region || "\x{2014}"],
            ["Allocation", (p.alloc||0).toFixed(1)+"%" + (dollar>0?"  ("+fmt(dollar)+")":"")],
            ["Annual yield", p.yld!=null ? p.yld.toFixed(2)+"%" : "\x{2014}"],
            ["Expense ratio", p.er!=null ? p.er.toFixed(2)+"%" : "\x{2014}"],
            ["Morningstar rating", ratingStr],
            ["Risk profile", (data && data.risk) || "Not available"],
            ["Trailing P/E", fmtNum(data?.pe)],
            ["1Y return", fmtPct(data?.ret1y)],
            ["3Y return", fmtPct(data?.ret3y)],
            ["5Y return", fmtPct(data?.ret5y)]
          ];
          doc.autoTable({
            startY: y,
            head: [["Field","Value"]],
            body: body,
            margin: {left:M, right:M},
            theme: "grid",
            styles: {fontSize: Math.max(7,fsz-1), cellPadding: 1.6, overflow:"linebreak"},
            headStyles: {fillColor: ac, textColor:[255,255,255], fontStyle:"bold", fontSize: Math.max(7,fsz-1)},
            columnStyles: {0:{fontStyle:"bold", cellWidth: CW*0.40}, 1:{cellWidth: CW*0.60}}
          });
          y = doc.lastAutoTable.finalY + 3;
          checkY(20);
          doc.setFontSize(8); doc.setFont(undefined,"bold"); doc.setTextColor(...ac);
          doc.text("OVERVIEW (sourced from Morningstar):", M, y); y += 4;
          doc.setFont(undefined,"normal"); doc.setTextColor(60);
          const overviewText = (data && data.overview)
            ? data.overview
            : `No live overview available for ${tkr}. Configure the Morningstar Direct proxy in admin \x{2192} API Keys to populate this section. Position data shown above is sourced from the proposal entry.`;
          const ovLines = doc.splitTextToSize(overviewText, CW);
          ovLines.forEach(l => { checkY(5); doc.text(l, M, y); y += 4; });
          y += 2;
          checkY(16);
          doc.setFontSize(8); doc.setFont(undefined,"bold"); doc.setTextColor(...ac);
          doc.text("ANALYST OPINION:", M, y); y += 4;
          doc.setFont(undefined,"normal"); doc.setTextColor(60);
          const opinionText = (data && data.analystOpinion)
            ? data.analystOpinion
            : `No live analyst opinion available for ${tkr}. Live Morningstar analyst commentary requires an active Direct subscription wired through the configured proxy endpoint.`;
          const opLines = doc.splitTextToSize(opinionText, CW);
          opLines.forEach(l => { checkY(5); doc.text(l, M, y); y += 4; });
          y += 4;
          doc.setTextColor(40);
        });
      },
      // \x{2500}\x{2500}\x{2500} MONTE CARLO \x{2500}\x{2500}
      sim: () => {
        if(val("rptIncSim") === "no") return;
        checkY(30);
        sectionH2("Monte Carlo Projection");
        if(lastSimPaths&&lastSimPaths.length>0){
          const yrs=lastSimYrs;
          const inf=num("inf",3.8)/100;
          const df=v=>v/Math.pow(1+inf,yrs);
          const params=getReturnParams();
          kv([
            ["Simulation count",lastSimPaths.length.toLocaleString()],
            ["Projection horizon",yrs+" years"],
            ["Portfolio mean return",(params.mu*100).toFixed(1)+"% / yr"],
            ["Volatility (\x{03C3})",(params.sig*100).toFixed(1)+"% / yr"],
            ["Inflation assumption",num("inf",3.8).toFixed(1)+"% / yr"],
          ]);
          checkY(40);
          tbl(["Percentile","Nominal wealth","Real (inflation-adj.)","vs Median"],
            [10,25,50,75,90].map(p=>{
              const v=percentileAt(lastSimPaths,yrs,p);
              const med=percentileAt(lastSimPaths,yrs,50);
              return [p+"th", fmt(v), fmt(df(v)), p===50?"\x{2014}":(v>=med?"+":"")+((v/med-1)*100).toFixed(0)+"%"];
            }));
        } else {
          para("Run the simulation to include Monte Carlo results.",[136,136,136]);
        }
      },
      // \x{2500}\x{2500}\x{2500} FUNDING STATUS \x{2500}\x{2500}
      fund: () => {
        if(val("rptIncFund") === "no" || goals.length === 0) return;
        checkY(30);
        sectionH2("Goal Funding Status");
        if(lastSimPaths&&lastSimPaths.length>0){
          const fundEl=$("goalResultList");
          const rows=goals.map(g=>{
            const el=fundEl?fundEl.querySelector("[data-gid='"+g.id+"']"):null;
            const pct=el?el.querySelector(".grs-pct")?.textContent||"\x{2014}":"\x{2014}";
            return [g.name, fmt(g.amt)+"/yr", g.startYear+"\x{2013}"+g.endYear, pct];
          });
          tbl(["Goal","Annual amount","Years","Success probability"],rows);
        } else {
          para("Run the simulation to populate funding status.");
        }
      },
      // \x{2500}\x{2500}\x{2500} CASH FLOW \x{2500}\x{2500}
      cf: () => {
        if(val("rptIncCF") === "no") return;
        checkY(30);
        const cfMode=val("rptIncCF");
        sectionH2("Cash-Flow Projection"+(cfMode==="summary"?" (5-year intervals)":""));
        const cfBody=$("cfBody");
        if(cfBody&&cfBody.rows.length>1&&cfBody.rows[0].cells.length>3){
          const step=cfMode==="summary"?5:1;
          const filtered=Array.from(cfBody.rows).filter((_,i)=>i%step===0);
          tbl(["Year","Age","Phase","Earned income","Pension/RMD","Tax","Expenses","Surplus","Net worth"],
            filtered.map(r=>{
              const c=r.cells;
              if(c.length<14) return Array(9).fill("\x{2014}");
              return [c[0]?.textContent||"",c[1]?.textContent||"",c[2]?.textContent||"",
                c[3]?.textContent||"",c[4]?.textContent||"",c[5]?.textContent||"",
                c[6]?.textContent||"",c[9]?.textContent||"",c[14]?.textContent||""];
            }));
        } else {
          para("Run the simulation to populate the cash-flow table.");
        }
      },
      // \x{2500}\x{2500}\x{2500} METHODOLOGY \x{2500}\x{2500}
      method: () => {
        if(val("rptIncMethod") === "no") return;
        checkY(30);
        sectionH2("Methodology & Assumptions");
        para("Return simulation: Log-normal returns sampled via Box-Muller transform. Each annual return is drawn as (\x{03BC} \x{2212} 0.5\x{03C3}\x{00B2}) + \x{03C3}\x{00D7}N(0,1), producing the full distribution of outcomes rather than a single deterministic path.");
        para("Asset growth: Investment accounts grow at the sampled portfolio return. Property appreciates stochastically at 3% \x{00B1} 2% per year. Retirement pool grows at a fixed 3.5% nominal across both accumulation and retirement (intentionally conservative, decoupled from household risk and AI portfolio). Cash earns no explicit return.");
        para("Savings & surplus: The annual savings target is deposited to cash each year if surplus allows. Positive residual surplus (above savings) is treated as discretionary spending. Deficits draw from cash first, then investments.");
        para("Debt amortisation: Each loan amortises annually using standard mortgage math. Interest and principal separation is computed per loan at each simulation step.");
        para("Tax: Income tax is estimated from configurable bracket tables for the selected country. Child/family benefit offsets are applied per country rules. Tax drag on investment returns is modelled through a CGT turnover drag.");
        para("Retirement drawdown: Voluntary 4% drawdown begins at the configured retirement age. When two clients are present, the pool is split equally and each half draws independently based on each client's own retirement age. Mandatory drawdown rules (IRS RMD, RRIF, Australian Super) apply from the relevant statutory age.");
        para("Inflation: All expenses, retirement spend, and pension COLA adjustments compound at the configured annual inflation rate.");
      },
      // \x{2500}\x{2500}\x{2500} DISCLOSURES \x{2500}\x{2500}
      disc: () => {
        const discLvl = val("rptDiscLvl") || "standard";
        const customDisc = (function(){ try { return (localStorage.getItem("wa_rpt_custom_disc")||"").trim(); } catch(_) { return ""; } })();
        if(discLvl === "none" && !customDisc) return;
        checkY(30);
        sectionH2("Important Disclosures");
        if(customDisc){
          // Custom user-provided disclosure REPLACES the standard one
          customDisc.split(/\n\s*\n/).forEach(block => {
            const txt = block.trim();
            if(txt) para(txt, [80,80,80]);
          });
        } else {
          const DISC = {
            standard:"This report has been prepared for educational and planning purposes only. It does not constitute investment, tax, or legal advice. Monte Carlo projections rely on randomly sampled returns based on configurable assumptions and do not predict actual future market behaviour. Past performance is not a reliable indicator of future results. All projections are estimates and actual results will differ, potentially significantly. Inflation, tax, and regulatory changes are not modelled dynamically. Consult a licensed financial professional before making any financial decisions. This document is not a prospectus or offering document.",
            advisor:"PROFESSIONAL USE NOTICE. This report has been prepared for advisor use and client presentation purposes only. It relies on client-supplied data and capital market assumptions that may differ materially from actual outcomes. Monte Carlo projections model stochastic return paths and carry inherent uncertainty \x{2014} actual results will differ. Sequence-of-returns risk, behavioural factors, unexpected expenses, and changes in tax law are not fully captured in the model. This document does not constitute investment advice, a personal financial plan, or a prospectus. The advisor should review all assumptions, validate all data inputs, and disclose all material conflicts of interest to the client prior to use. Not for redistribution to third parties.",
            minimal:"For educational purposes only. Not financial advice. Consult a licensed advisor before making financial decisions.",
          };
          para(DISC[discLvl]||DISC.standard, [80,80,80]);
        }
      }
    };

    // \x{2550}\x{2550}\x{2550} Iterate the user-defined section order \x{2550}\x{2550}\x{2550}
    // (saved via the Page Order panel in the PDF Report tab \x{2014} drag \x{2191}\x{2193} to reorder)
    userOrder.forEach(k => {
      try { SECTIONS[k] && SECTIONS[k](); }
      catch(e){ console.warn("PDF section '"+k+"' failed:", e); }
    });
PERL_END

# Decode the perl-escaped block to actual Unicode chars
$new_block =~ s/\\x\{([0-9A-Fa-f]+)\}/chr(hex($1))/ge;

# Replace from the duplicated 'checkY(30);\n      sectionH2("Household Profile");' line through the end of DISCLOSURES (the close of `if(discLvl!=="none"){...}`)
# Strategy: find "      checkY(30);\n      sectionH2(\"Household Profile\");\n      const hhRows=[" — the orphaned duplicate
# Continue capturing until "      para(DISC[discLvl]||DISC.standard,[80,80,80]);\n    }"
my $start = '      checkY\(30\);\n      sectionH2\("Household Profile"\);\n      const hhRows=\[';
my $end   = 'para\(DISC\[discLvl\]\|\|DISC\.standard,\[80,80,80\]\);\n    \}';

my $count = ($src =~ s/$start.*?$end/$new_block/s);
if($count == 1){
  open my $w, ">:encoding(UTF-8)", "wealth-analyzer.html" or die $!;
  print $w $src; close $w;
  print "OK rewrote section block ($count match)\n";
} else {
  print "FAIL: matched $count times (expected 1)\n"; exit 1;
}
