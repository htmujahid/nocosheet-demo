import { formInputSchema, type FormValues } from "../forms/validation";
import { parseRecordValues, type ParsedValue, type WriteColumn } from "../records/values";
import {
  buildColumnIndexes,
  buildCreateTable,
  columnDefinition,
  columnSqliteType,
  compileExpressions,
  type RelationTarget,
} from "../tables/ddl";
import { newColumnName, newTableName, physicalTableName } from "../tables/naming";
import {
  columnInputSchema,
  tableInputSchema,
  type ColumnValues,
  type TableValues,
} from "../tables/validation";
import { viewInputSchema, type ViewValues } from "../views/validation";
import { relativeDate, type Template, type TemplateTable } from "./schema";

const DAY = 86_400_000;

export type PlannedColumn = WriteColumn & {
  body: ColumnValues;
  sqliteType: string;
  generated: { stored: string } | null;
  check: { stored: string } | null;
  relationTable?: number;
};

export type PlannedTable = {
  input: TableValues;
  tableName: string;
  ddl: string[];
  columns: PlannedColumn[];
  titleColumn: string | undefined;
  views: ViewValues[];
  forms: FormValues[];
  rows: { id: number; values: ParsedValue[] }[];
};

export type TemplatePlan = {
  tables: PlannedTable[];
  rowOrder: number[];
};

function resolveValue(format: string, value: unknown, now: Date) {
  const date = relativeDate.safeParse(value);
  if (!date.success) return value;
  const midnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const at = midnight + date.data.$days * DAY + (date.data.$hour ?? 0) * 3_600_000;
  if (format === "datetime") return at;
  if (format === "datetime_tz") return new Date(at).toISOString();
  return new Date(at).toISOString().slice(0, 10);
}

function insertionOrder(tables: TemplateTable[]) {
  const done = new Set<number>();
  const ordered: number[] = [];
  const indexOf = (name: string) =>
    tables.findIndex((table) => table.name.toLowerCase() === name.toLowerCase());
  const visit = (index: number, trail: Set<number>) => {
    if (done.has(index) || trail.has(index)) return;
    trail.add(index);
    for (const column of tables[index].columns) {
      const target = column.relation ? indexOf(column.relation) : -1;
      if (target !== -1) visit(target, trail);
    }
    done.add(index);
    ordered.push(index);
  };
  tables.forEach((_, index) => visit(index, new Set()));
  return ordered;
}

export function planTemplate(
  workspace: string,
  template: Template,
  taken: Set<string>,
  options: { sampleData: boolean; now?: Date },
): TemplatePlan {
  const now = options.now ?? new Date();
  const indexByName = new Map(template.tables.map((table, index) => [table.name.toLowerCase(), index]));

  const uniqueName = (name: string) => {
    let candidate = name;
    for (let n = 2; taken.has(candidate.toLowerCase()); n++) candidate = `${name} ${n}`;
    taken.add(candidate.toLowerCase());
    return candidate;
  };

  const tables = template.tables.map((def) => ({
    def,
    tableName: newTableName(),
    name: uniqueName(def.name),
  }));
  const physical = (index: number) => physicalTableName(workspace, tables[index].tableName);

  const planned = tables.map(({ def, tableName, name }, tableIndex): PlannedTable => {
    const columnNames = def.columns.map(() => newColumnName());
    const references = new Map(
      def.columns.map((spec, index) => [spec.name.toLowerCase(), columnNames[index]]),
    );
    const targets = new Map<number, RelationTarget>();

    const columns = def.columns.map((spec, position): PlannedColumn => {
      const target = spec.relation ? indexByName.get(spec.relation.toLowerCase()) : undefined;
      if (target !== undefined) targets.set(target + 1, { physicalName: physical(target) });
      const body = columnInputSchema.parse({
        name: spec.name,
        description: spec.description,
        icon: spec.icon,
        format: spec.format,
        options:
          target !== undefined
            ? { tableId: target + 1, onDelete: "set null", ...spec.options }
            : (spec.options ?? {}),
        isRequired: spec.required,
        isUnique: spec.unique,
        isHidden: spec.hidden,
        isSearchable: spec.searchable,
        isFilterable: spec.filterable ?? true,
        isSortable: spec.sortable ?? true,
        defaultValue: spec.default,
        generatedExpression: spec.generated,
        checkExpression: spec.check,
        position,
      });
      const { generated, check } = compileExpressions(body, references);
      return {
        id: position + 1,
        columnName: columnNames[position],
        name: body.name,
        format: body.format,
        options: body.options,
        isRequired: body.isRequired,
        defaultValue: body.defaultValue,
        generatedExpression: generated?.stored ?? null,
        body,
        sqliteType: columnSqliteType(body, targets),
        generated,
        check,
        relationTable: target,
      };
    });

    const physicalName = physical(tableIndex);
    const ddl = [
      buildCreateTable(
        physicalName,
        columns.map((column) => columnDefinition(column.columnName, column.body, targets, references)),
      ),
      ...columns.flatMap((column) =>
        buildColumnIndexes(workspace, physicalName, column.columnName, column.body),
      ),
    ];

    const byName = new Map(columns.map((column) => [column.name, column]));
    const columnName = (name: string) => (byName.get(name) as PlannedColumn).columnName;

    return {
      input: tableInputSchema.parse({
        name,
        icon: def.icon,
        groupName: def.group,
        description: def.description,
        isAudit: def.audit ?? false,
        isHidden: def.hidden ?? false,
      }),
      tableName,
      ddl,
      columns,
      titleColumn: byName.get(def.title)?.columnName,
      views: (def.views ?? []).map((view) =>
        viewInputSchema.parse({
          name: view.name,
          icon: view.icon,
          description: view.description,
          selectColumns: view.columns.map(columnName),
          filters: (view.filters ?? []).map((filter) => ({
            ...filter,
            column: columnName(filter.column),
          })),
        }),
      ),
      forms: (def.forms ?? []).map((form) =>
        formInputSchema.parse({
          name: form.name,
          icon: form.icon,
          description: form.description,
          selectColumns: form.columns.map(columnName),
          isOpen: form.open ?? true,
        }),
      ),
      rows: [],
    };
  });

  const rowOrder = options.sampleData ? insertionOrder(template.tables) : [];
  const idsByTitle = new Map<number, Map<string, number>>();

  for (const tableIndex of rowOrder) {
    const def = template.tables[tableIndex];
    const table = planned[tableIndex];
    const byName = new Map(table.columns.map((column) => [column.name, column]));
    const rows = def.rows ?? [];

    table.rows = rows.map((row, index) => {
      const values: Record<string, unknown> = {};
      for (const [key, raw] of Object.entries(row)) {
        const column = byName.get(key) as PlannedColumn;
        if (raw === null || raw === undefined) continue;
        if (column.relationTable !== undefined) {
          const id = idsByTitle.get(column.relationTable)?.get(String(raw));
          if (id !== undefined) values[column.columnName] = id;
        } else {
          values[column.columnName] = resolveValue(column.format, raw, now);
        }
      }
      const parsed = parseRecordValues(table.columns, values);
      if (!parsed.ok) throw new Error(`${def.name}: ${parsed.message}`);
      return { id: index + 1, values: parsed.values };
    });

    const titles = new Map<string, number>();
    rows.forEach((row, index) => titles.set(String(row[def.title]), index + 1));
    idsByTitle.set(tableIndex, titles);
  }

  return { tables: planned, rowOrder };
}
