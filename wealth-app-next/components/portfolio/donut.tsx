// // ─────────────────────────────────────────────────────────────────
// // One allocation donut, shared by the compare panel and the report.
// //
// // Built from stroke-dasharray arcs on concentric circles — crisp at any
// // size, no arc-path math, and no chart library. The track uses
// // currentColor at low opacity so it reads on either a themed screen or the
// // report's fixed white page; the slices use the per-class colours.
// // ─────────────────────────────────────────────────────────────────

// import { CLASS_COLOR, ASSET_CLASSES, type AssetClass } from "@/lib/portfolio/asset-class";

// export interface DonutSlice {
//   cls: AssetClass;
//   pct: number;
// }

// export function Donut({ slices, size = 132, stroke = 16 }: { slices: DonutSlice[]; size?: number; stroke?: number }) {
//   const r = (size - stroke) / 2;
//   const c = 2 * Math.PI * r;
//   let offset = 0;
//   const drawable = slices.filter((s) => s.pct > 0);
//   return (
//     <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0" role="img"
//       aria-label="Allocation by asset class">
//       <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
//         <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor"
//           strokeOpacity={0.12} strokeWidth={stroke} />
//         {drawable.map((s) => {
//           const len = (s.pct / 100) * c;
//           const el = (
//             <circle key={s.cls} cx={size / 2} cy={size / 2} r={r} fill="none"
//               stroke={CLASS_COLOR[s.cls]} strokeWidth={stroke}
//               strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset} />
//           );
//           offset += len;
//           return el;
//         })}
//       </g>
//     </svg>
//   );
// }

// /** Build canonical-ordered slices from a class→value map (any-keyed), so a
//  *  donut always draws classes in the same order regardless of input. */
// export function slicesFromValues(byClass: Map<AssetClass, number>, total: number): DonutSlice[] {
//   return ASSET_CLASSES
//     .map((cls) => ({ cls, pct: total > 0 ? ((byClass.get(cls) ?? 0) / total) * 100 : 0 }))
//     .filter((s) => s.pct > 0);
// }


export interface DonutSlice {
  key: string;
  pct: number;
  color: string;
}

export function Donut({
  slices,
  size = 132,
  stroke = 16,
}: {
  slices: DonutSlice[];
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  let offset = 0;

  const drawable =
    slices.filter(
      (slice) =>
        slice.pct > 0
    );

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="shrink-0"
      role="img"
      aria-label="Allocation"
    >
      <g
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.12}
          strokeWidth={stroke}
        />

        {drawable.map(
          (slice) => {
            const len =
              (slice.pct / 100) *
              c;

            const element = (
              <circle
                key={slice.key}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={
                  slice.color
                }
                strokeWidth={
                  stroke
                }
                strokeDasharray={`${len} ${
                  c - len
                }`}
                strokeDashoffset={
                  -offset
                }
              />
            );

            offset += len;

            return element;
          }
        )}
      </g>
    </svg>
  );
}