import { filterKind } from "./filters";

export type Aggregate =
  | { type: "sum"; value: number }
  | { type: "average"; value: number | null }
  | { type: "count"; value: number };

const isFilled = (value: unknown) => value !== null && value !== undefined;

const toNumber = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") return Number(value);
  return Number.NaN;
};

export function aggregate(format: string, values: readonly unknown[]): Aggregate {
  const filled = values.filter(isFilled);
  if (filterKind(format) !== "number") return { type: "count", value: filled.length };

  const numbers = filled.map(toNumber).filter(Number.isFinite);
  const sum = numbers.reduce((total, value) => total + value, 0);
  if (format === "percent")
    return { type: "average", value: numbers.length > 0 ? sum / numbers.length : null };
  return { type: "sum", value: sum };
}
