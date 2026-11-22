import { NOCASE_FORMATS, SEARCHABLE_FORMATS } from "../tables/formats";
import { type FilterCondition, filterKind } from "./filters";
import { SYSTEM_SORT_KEYS } from "./sort-param";

export type LocalRow = Record<string, unknown>;

export type LocalColumn = {
  columnName: string;
  format: string;
  isSearchable?: boolean;
};

const DAY_MS = 86_400_000;

const isNil = (value: unknown) => value === null || value === undefined;

const sameText = (a: unknown, b: string) =>
  typeof a === "string" && a.toLowerCase() === b.toLowerCase();

const dayOf = (column: LocalColumn, value: unknown): string | number | null => {
  if (isNil(value)) return null;
  if (column.format === "datetime_tz") {
    const date = new Date(value as string | number);
    return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
  }
  return value as string | number;
};

function dateMatches(column: LocalColumn, op: string, text: string, value: unknown) {
  if (isNil(value)) return false;
  if (column.format !== "datetime") {
    const target = dayOf(column, value);
    if (target === null) return false;
    switch (op) {
      case "eq":
        return target === text;
      case "before":
        return target < text;
      case "after":
        return target > text;
      case "on_or_before":
        return target <= text;
      default:
        return target >= text;
    }
  }
  const target = Number(value);
  const start = Date.parse(`${text}T00:00:00Z`);
  switch (op) {
    case "eq":
      return target >= start && target < start + DAY_MS;
    case "before":
      return target < start;
    case "after":
      return target >= start + DAY_MS;
    case "on_or_before":
      return target < start + DAY_MS;
    default:
      return target >= start;
  }
}

const isEmpty = (kind: string, value: unknown) => {
  if (isNil(value)) return true;
  if (kind === "multi_select") return Array.isArray(value) && value.length === 0;
  if (kind === "text" || kind === "single_select") return value === "";
  return false;
};

export function matchesCondition(row: LocalRow, column: LocalColumn, condition: FilterCondition) {
  const kind = filterKind(column.format);
  if (!kind) return false;
  const value = row[column.columnName];
  const operand = condition.value;
  const text = typeof operand === "string" ? operand : "";
  const list = Array.isArray(operand) ? operand.map(String) : [];
  const number = Number(operand);

  switch (condition.op) {
    case "is_empty":
      return isEmpty(kind, value);
    case "is_not_empty":
      return !isEmpty(kind, value);
    case "equals":
      return sameText(value, text);
    case "not_equals":
      return isNil(value) || !sameText(value, text);
    case "eq":
      return kind === "date"
        ? dateMatches(column, "eq", text, value)
        : !isNil(value) && Number(value) === number;
    case "neq":
      return isNil(value) || Number(value) !== number;
    case "gt":
      return !isNil(value) && Number(value) > number;
    case "gte":
      return !isNil(value) && Number(value) >= number;
    case "lt":
      return !isNil(value) && Number(value) < number;
    case "lte":
      return !isNil(value) && Number(value) <= number;
    case "before":
    case "after":
    case "on_or_before":
    case "on_or_after":
      return dateMatches(column, condition.op, text, value);
    case "is":
      if (kind === "checkbox") return (value === true) === (operand === true);
      return !isNil(value) && value === text;
    case "is_not":
      return isNil(value) || value !== text;
    case "is_any_of":
      return !isNil(value) && list.includes(String(value as string | number));
    case "is_none_of":
      return isNil(value) || !list.includes(String(value as string | number));
    case "has_any_of":
      return (
        Array.isArray(value) && value.some((item) => list.includes(String(item as string | number)))
      );
    case "has_none_of":
      return (
        !Array.isArray(value) ||
        !value.some((item) => list.includes(String(item as string | number)))
      );
  }
}

export function matchesFilters(
  row: LocalRow,
  columns: Map<string, LocalColumn>,
  filters: FilterCondition[],
  strict = false,
) {
  for (const condition of filters) {
    const column = columns.get(condition.column);
    if (!column || !filterKind(column.format)) {
      if (strict) return false;
      continue;
    }
    if (!matchesCondition(row, column, condition)) return false;
  }
  return true;
}

export function matchesSearch(row: LocalRow, columns: LocalColumn[], term: string) {
  if (!term) return true;
  const searchable = columns.filter(
    (column) => column.isSearchable && SEARCHABLE_FORMATS.includes(column.format as never),
  );
  if (searchable.length === 0) return true;
  const needle = term.toLowerCase();
  return searchable.some((column) => {
    const value = row[column.columnName];
    return typeof value === "string" && value.toLowerCase().includes(needle);
  });
}

export type LocalSort = { key: string | null; order: "asc" | "desc" };

function compareValues(a: unknown, b: unknown, nocase: boolean) {
  if (isNil(a) && isNil(b)) return 0;
  if (isNil(a)) return -1;
  if (isNil(b)) return 1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (typeof a === "boolean" || typeof b === "boolean") return Number(a) - Number(b);
  const left = nocase ? (a as string).toLowerCase() : (a as string);
  const right = nocase ? (b as string).toLowerCase() : (b as string);
  return left < right ? -1 : left > right ? 1 : 0;
}

export function compareRows(
  columns: Map<string, LocalColumn>,
  sort: LocalSort,
): (a: LocalRow, b: LocalRow) => number {
  const direction = sort.order === "desc" ? -1 : 1;
  const key = sort.key ?? "id";
  const column = columns.get(key);
  const nocase = column ? NOCASE_FORMATS.includes(column.format as never) : false;
  const system = SYSTEM_SORT_KEYS.includes(key);
  return (a, b) => {
    if (key !== "id" && (system || column)) {
      const compared = compareValues(a[key], b[key], nocase);
      if (compared !== 0) return compared * direction;
    }
    return (Number(a.id) - Number(b.id)) * direction;
  };
}

export type LocalQuery = {
  filters: FilterCondition[];
  q: string;
  sort: LocalSort;
  scope?: FilterCondition[];
  ownerId?: string;
};

export function selectRows(rows: LocalRow[], columns: LocalColumn[], query: LocalQuery) {
  const byName = new Map(columns.map((column) => [column.columnName, column]));
  const filtered = rows.filter(
    (row) =>
      (!query.ownerId || row.created_by === query.ownerId) &&
      (!query.scope || matchesFilters(row, byName, query.scope, true)) &&
      matchesFilters(row, byName, query.filters) &&
      matchesSearch(row, columns, query.q),
  );
  return filtered.sort(compareRows(byName, query.sort));
}

export function pageRows<T>(rows: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize;
  return {
    rows: rows.slice(start, start + pageSize),
    hasMore: rows.length > start + pageSize,
    total: rows.length,
  };
}
