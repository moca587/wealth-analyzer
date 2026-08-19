import type {
  PlanRecommendation,
  RecommendationSeverity,
} from "@/lib/engine/recommendations";

type Props = {
  recommendations: PlanRecommendation[];
};

export function PlanRecommendationsSection({ recommendations }: Props) {
  return (
    <section className="rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]">
          Plan Recommendations
        </h2>

        <div className="h-px flex-1 bg-[rgba(0,87,184,.10)]" />
      </div>

      <p className="mb-5 text-[12px] leading-5 text-[#64748b]">
        Automated checks across your whole plan — concentration risk, IPS drift,
        cash buffer, goal funding, retirement success probability, and
        asset-location efficiency — surfaced here and ranked by severity.
      </p>

      <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.08em] text-[#64748b]">
        Flags
      </div>

      {recommendations.length === 0 ? (
        <div className="rounded-xl border border-[rgba(0,87,184,.08)] bg-[#f8faff] p-5">
          <div className="text-[12px] font-semibold text-[#16213e]">
            No material flags detected
          </div>

          <p className="mt-1 text-[11px] text-[#64748b]">
            The current checks did not identify any planning issues.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {recommendations.map((recommendation) => (
            <RecommendationCard
              key={recommendation.id}
              recommendation={recommendation}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function RecommendationCard({
  recommendation,
}: {
  recommendation: PlanRecommendation;
}) {
  return (
    <div className="rounded-xl border border-[rgba(0,87,184,.08)] bg-[#f8faff] p-5">
      <div className="flex items-start gap-3">
        <div
          className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${severityColor(
            recommendation.severity,
          )}`}
        />

        <div>
          <div className="text-[12px] font-bold text-[#16213e]">
            {recommendation.title}
          </div>

          <p className="mt-1 text-[11px] leading-5 text-[#64748b]">
            {recommendation.description}
          </p>
        </div>
      </div>
    </div>
  );
}

function severityColor(severity: RecommendationSeverity): string {
  switch (severity) {
    case "high":
      return "bg-red-500";

    case "medium":
      return "bg-amber-500";

    case "low":
      return "bg-[#0057b8]";
  }
}
