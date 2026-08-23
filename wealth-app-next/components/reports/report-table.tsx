// components/reports/report-table.tsx

type Align = "left" | "center" | "right";

type Props = {
  headers?: string[];
  rows: React.ReactNode[][]; // each inner array represents one row
  align?: Align[];
};

export function ReportTable({ headers, rows, align }: Props) {
  return (
    <table className="w-full border-collapse text-[10.5px]">
      {headers && ( // only create headers if they are provided
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th
                key={header}
                className={`border border-[#d2d7de] bg-[#0867b9] px-3 py-2.5 font-bold text-white ${alignmentClass(
                  align?.[index],
                )}`}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
      )}

      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((cell, cellIndex) => (
              // each cell
              <td
                key={cellIndex}
                className={`border border-[#d2d7de] px-3 py-2.5 text-[#40464d] ${alignmentClass(
                  align?.[cellIndex],
                )}`}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function alignmentClass(align?: Align) {
  if (align === "right") {
    return "text-right";
  }

  if (align === "center") {
    return "text-center";
  }

  return "text-left";
}
