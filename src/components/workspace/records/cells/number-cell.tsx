import { precisionOf, text } from "./shared";
import type { CellProps } from "./types";

const formatNumber = (value: number, digits: number) =>
  new Intl.NumberFormat(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);

function formatDuration(seconds: number, display: unknown) {
  if (display === "seconds") return String(seconds);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return display === "h:mm:ss"
    ? `${hours}:${pad(minutes)}:${pad(rest)}`
    : `${hours}:${pad(minutes)}`;
}

export function NumberCell({ column, value, digits }: CellProps & { digits?: number }) {
  switch (column.format) {
    case "integer":
      return <span className="tabular-nums">{formatNumber(Number(value), digits ?? 0)}</span>;
    case "decimal":
      return (
        <span className="tabular-nums">
          {formatNumber(Number(value), digits ?? precisionOf(column.options, 2))}
        </span>
      );
    case "percent":
      return (
        <span className="tabular-nums">
          {formatNumber(Number(value), digits ?? precisionOf(column.options, 0))}%
        </span>
      );
    case "currency":
      return (
        <span className="tabular-nums">
          {new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: text(column.options.currency) || "USD",
            minimumFractionDigits: digits ?? precisionOf(column.options, 2),
            maximumFractionDigits: digits ?? precisionOf(column.options, 2),
          }).format(Number(value))}
        </span>
      );
    case "duration":
      return (
        <span className="tabular-nums">
          {formatDuration(Number(value), column.options.display)}
        </span>
      );
    default:
      return (
        <span className="tabular-nums">
          {digits === undefined ? text(value) : formatNumber(Number(value), digits)}
        </span>
      );
  }
}
