const RISK_ROWS = [
  ["Very conservative", "3.5%", "4%"],
  ["Conservative", "4.5%", "7%"],
  ["Moderately conservative", "5.5%", "9%"],
  ["Moderate", "7.0%", "12%"],
  ["Moderately aggressive", "8.5%", "15%"],
  ["Aggressive", "10.0%", "18%"],
  ["Very aggressive", "12.0%", "22%"],
] as const;

export function MethodologySection() {
  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>Methodology & Disclaimer</h2>

      <div className="mt-5">
        <h3 className={subTitleClass}>Inputs the simulation reads</h3>

        <p className={bodyClass}>
          Income (sum of all income fields), annual raise %, base expenses
          (Living + Insurance + Other), inflation rate, property value, other
          assets, the sum of every entry on the Assets tab, and each loan&apos;s
          balance / rate / remaining years. Projection length and number of
          simulations come from the Settings panel.
        </p>
      </div>

      <div className="mt-6">
        <h3 className={subTitleClass}>Return parameters by risk profile</h3>

        <div className="mt-3 overflow-x-auto rounded-xl border border-[rgba(0,87,184,.08)]">
          <table className="w-full border-collapse text-[12px]">
            <thead className="bg-[#f8faff]">
              <tr>
                <th className={thClass}>Profile</th>

                <th className={numberThClass}>Mean return</th>

                <th className={numberThClass}>Volatility</th>
              </tr>
            </thead>

            <tbody>
              {RISK_ROWS.map(([profile, mean, volatility]) => (
                <tr key={profile}>
                  <td className={tdClass}>{profile}</td>

                  <td className={numberTdClass}>{mean}</td>

                  <td className={numberTdClass}>{volatility}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-[10px] leading-5 text-[#9ca3af]">
          When two clients are in the household, the mean and volatility are
          averaged.
        </p>
      </div>

      <div className="mt-6">
        <h3 className={subTitleClass}>
          Stochastic engine — what happens each year
        </h3>

        <p className={bodyClass}>
          Investment return is sampled log-normally via Box–Muller using{" "}
          <code className={codeClass}>exp((μ − 0.5σ²) + σ × N(0,1)) − 1</code>.
          Property appreciates by a random{" "}
          <strong className="text-[#16213e]">3% ± 2%</strong> each year. Income
          grows by the configured raise rate and expenses grow by inflation.
          Each loan amortizes using its balance, rate, and remaining term.
        </p>

        <p className={`${bodyClass} mt-3`}>
          When a year ends with positive savings, the simulation allocates the
          surplus according to the engine&apos;s cash/investment rules. Net
          worth is calculated from assets less remaining liabilities.
        </p>
      </div>

      <div className="mt-6">
        <h3 className={subTitleClass}>How goals are scored</h3>

        <p className={bodyClass}>
          For each goal, the engine measures the share of simulation paths that
          can meet the scheduled goal outflows through the goal&apos;s end year
          without producing a funding shortfall.
        </p>
      </div>

      <div className="mt-6 rounded-xl border border-[rgba(0,87,184,.08)] bg-[#f8faff] p-5">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#64748b]">
          Disclaimer
        </h3>

        <p className="mt-2 text-[11px] leading-5 text-[#64748b]">
          This tool is for educational and planning purposes only. It is{" "}
          <strong className="text-[#16213e]">not</strong> investment, tax, or
          legal advice. Historical averages and randomly sampled returns do not
          predict actual market behaviour; real outcomes can differ materially
          due to sequence-of-returns risk, tax drag, behavioural decisions,
          fees, and unmodeled life events. Consult a licensed financial
          professional before acting on any projection shown here.
        </p>
      </div>
    </section>
  );
}

const sectionClass =
  "rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm";

const titleClass =
  "text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]";

const subTitleClass =
  "text-[11px] font-bold uppercase tracking-[0.08em] text-[#64748b]";

const bodyClass = "text-[12px] leading-5 text-[#64748b]";

const codeClass =
  "rounded bg-[#eef3fb] px-1.5 py-0.5 text-[11px] font-semibold text-[#16213e]";

const thClass =
  "border-b border-[rgba(0,87,184,.10)] px-3 py-2 text-left text-[10px] font-bold uppercase tracking-[0.05em] text-[#64748b]";

const numberThClass =
  "border-b border-[rgba(0,87,184,.10)] px-3 py-2 text-right text-[10px] font-bold uppercase tracking-[0.05em] text-[#64748b]";

const tdClass = "border-b border-[rgba(0,87,184,.06)] px-3 py-2 text-[#16213e]";

const numberTdClass =
  "border-b border-[rgba(0,87,184,.06)] px-3 py-2 text-right tabular-nums text-[#16213e]";
