export function formatPercent(
  value: number | undefined,
  digits = 2
): string {
  if (value == null) {
    return "—";
  }

  return `${value.toFixed(digits)}%`;
}

export function formatSignedPercent(
  value: number | undefined,
  digits = 2
): string {
  if (value == null) {
    return "—";
  }

  const sign =
    value > 0
      ? "+"
      : "";

  return `${sign}${value.toFixed(digits)}%`;
}

export function percentToneClass(
  value: number | undefined
): string {
  if (value == null) {
    return "text-[#9ca3af]";
  }

  if (value > 0) {
    return "font-semibold text-[#00875a]";
  }

  if (value < 0) {
    return "font-semibold text-red-500";
  }

  return "font-semibold text-[#64748b]";
}

export function formatSuccess(
  value: number | undefined
): string {
  if (value == null) {
    return "—";
  }

  return `${value.toFixed(0)}%`;
}

export function formatPointDelta(
  value: number | undefined
): string {
  if (value == null) {
    return "—";
  }

  const sign = value > 0 ? "+" : "";

  return `${sign}${value.toFixed(0)} pts`;
}