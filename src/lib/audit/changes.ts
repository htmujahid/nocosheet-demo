import { AUDIT_CHANGES_LIMIT, AUDIT_VALUE_LIMIT, type AuditChange } from "./actions";

type AuditColumn = { columnName: string; name: string; format: string };

const trim = (value: unknown): unknown => {
  if (value === undefined || value === null) return null;
  const text =
    typeof value === "string" ? value : typeof value === "object" ? JSON.stringify(value) : null;
  if (text === null) return value;
  return text.length > AUDIT_VALUE_LIMIT
    ? `${text.slice(0, AUDIT_VALUE_LIMIT)}…`
    : typeof value === "string"
      ? text
      : value;
};

const present = (column: AuditColumn, value: unknown): unknown => {
  const reference = column.format === "relation" ? idOf(value) : undefined;
  return trim(reference === undefined ? value : { id: reference });
};

const idOf = (value: unknown) =>
  value !== null && typeof value === "object" && "id" in value
    ? (value as { id: unknown }).id
    : undefined;

const same = (column: AuditColumn, a: unknown, b: unknown) =>
  JSON.stringify(column.format === "relation" ? (idOf(a) ?? null) : (a ?? null)) ===
  JSON.stringify(column.format === "relation" ? (idOf(b) ?? null) : (b ?? null));

export function diffRecord(
  columns: AuditColumn[],
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): AuditChange[] {
  return columns
    .filter((column) => !same(column, before[column.columnName], after[column.columnName]))
    .slice(0, AUDIT_CHANGES_LIMIT)
    .map((column) => ({
      column: column.name,
      from: present(column, before[column.columnName]),
      to: present(column, after[column.columnName]),
    }));
}

export function snapshotRecord(
  columns: AuditColumn[],
  record: Record<string, unknown>,
): AuditChange[] {
  return columns
    .filter((column) => column.format !== "binary" && record[column.columnName] != null)
    .slice(0, AUDIT_CHANGES_LIMIT)
    .map((column) => ({
      column: column.name,
      from: null,
      to: present(column, record[column.columnName]),
    }));
}
