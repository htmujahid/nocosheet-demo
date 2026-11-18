import { tableTable } from "@db/schema";
import { db, isNull } from "void/db";

import { formInputSchema } from "../forms/validation";
import { createForm } from "../forms/repository";
import { createRecordRows } from "../records/repository";
import { parseRecordValues } from "../records/values";
import type { RelationTarget } from "../tables/ddl";
import {
  type Column,
  createColumn,
  createTable,
  dropTables,
  type Table,
  updateTable,
} from "../tables/repository";
import { columnInputSchema, tableInputSchema } from "../tables/validation";
import { createView } from "../views/repository";
import { viewInputSchema } from "../views/validation";
import { relativeDate, type Template, type TemplateTable } from "./schema";

const DAY = 86_400_000;
const CHUNK = 50;

type Built = { def: TemplateTable; table: Table; columns: Column[] };

function resolveValue(format: string, value: unknown) {
  const date = relativeDate.safeParse(value);
  if (!date.success) return value;
  const now = new Date();
  const midnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const at = midnight + date.data.$days * DAY + (date.data.$hour ?? 0) * 3_600_000;
  if (format === "datetime") return at;
  if (format === "datetime_tz") return new Date(at).toISOString();
  return new Date(at).toISOString().slice(0, 10);
}

function insertionOrder(tables: TemplateTable[]) {
  const names = new Set(tables.map((table) => table.name.toLowerCase()));
  const done = new Set<string>();
  const ordered: TemplateTable[] = [];
  const visit = (table: TemplateTable, trail: Set<string>) => {
    const key = table.name.toLowerCase();
    if (done.has(key) || trail.has(key)) return;
    trail.add(key);
    for (const column of table.columns) {
      const target = column.relation?.toLowerCase();
      const found = target && names.has(target) && tables.find((t) => t.name.toLowerCase() === target);
      if (found) visit(found, trail);
    }
    done.add(key);
    ordered.push(table);
  };
  for (const table of tables) visit(table, new Set());
  return ordered;
}

export async function applyTemplate(
  workspace: string,
  template: Template,
  userId: string,
  options: { sampleData: boolean },
) {
  const taken = new Set(
    (await db.select({ name: tableTable.name }).from(tableTable).where(isNull(tableTable.deletedAt))).map(
      (row) => row.name.toLowerCase(),
    ),
  );
  const uniqueName = (name: string) => {
    let candidate = name;
    for (let n = 2; taken.has(candidate.toLowerCase()); n++) candidate = `${name} ${n}`;
    taken.add(candidate.toLowerCase());
    return candidate;
  };

  const built = new Map<string, Built>();

  try {
    for (const def of template.tables) {
      const table = await createTable(
        workspace,
        tableInputSchema.parse({
          name: uniqueName(def.name),
          icon: def.icon,
          groupName: def.group,
          description: def.description,
          isAudit: def.audit ?? false,
          isHidden: def.hidden ?? false,
        }),
        userId,
      );
      built.set(def.name.toLowerCase(), { def, table, columns: [] });
    }

    for (const entry of built.values()) {
      const { def } = entry;
      for (const [position, spec] of def.columns.entries()) {
        const target = spec.relation ? built.get(spec.relation.toLowerCase()) : undefined;
        const input = columnInputSchema.parse({
          name: spec.name,
          description: spec.description,
          icon: spec.icon,
          format: spec.format,
          options: target
            ? { tableId: target.table.id, onDelete: "set null", ...spec.options }
            : (spec.options ?? {}),
          isRequired: spec.required,
          isUnique: spec.unique,
          isHidden: spec.hidden,
          isSearchable: spec.searchable,
          isFilterable: spec.filterable ?? false,
          isSortable: spec.sortable ?? false,
          defaultValue: spec.default,
          generatedExpression: spec.generated,
          checkExpression: spec.check,
          position,
        });
        const targets = new Map<number, RelationTarget>();
        if (target)
          targets.set(target.table.id, {
            physicalName: `${workspace}__${target.table.tableName}`,
          });
        entry.columns.push(await createColumn(workspace, entry.table, input, targets));
      }

      const title = entry.columns.find((column) => column.name === def.title);
      if (title) entry.table = (await updateTable(entry.table.id, { titleColumnId: title.id })) ?? entry.table;

      const byName = new Map(entry.columns.map((column) => [column.name, column]));
      const physical = (name: string) => (byName.get(name) as Column).columnName;

      for (const view of def.views ?? [])
        await createView(
          entry.table,
          entry.columns,
          viewInputSchema.parse({
            name: view.name,
            icon: view.icon,
            description: view.description,
            selectColumns: view.columns.map(physical),
            filters: (view.filters ?? []).map((filter) => ({
              ...filter,
              column: physical(filter.column),
            })),
          }),
          userId,
        );

      for (const form of def.forms ?? [])
        await createForm(
          entry.table,
          formInputSchema.parse({
            name: form.name,
            icon: form.icon,
            description: form.description,
            selectColumns: form.columns.map(physical),
            isOpen: form.open ?? true,
          }),
          userId,
        );
    }

    if (options.sampleData) {
      const titles = new Map<string, Map<string, number>>();
      for (const def of insertionOrder(template.tables)) {
        const entry = built.get(def.name.toLowerCase()) as Built;
        const byName = new Map(entry.columns.map((column) => [column.name, column]));
        const parsedRows = (def.rows ?? []).map((row) => {
          const values: Record<string, unknown> = {};
          for (const [key, raw] of Object.entries(row)) {
            const column = byName.get(key) as Column;
            if (raw === null || raw === undefined) continue;
            const spec = def.columns.find((item) => item.name === key);
            if (spec?.relation) {
              const id = titles.get(spec.relation.toLowerCase())?.get(String(raw));
              if (id !== undefined) values[column.columnName] = id;
            } else {
              values[column.columnName] = resolveValue(column.format, raw);
            }
          }
          const parsed = parseRecordValues(entry.columns, values);
          if (!parsed.ok) throw new Error(`${def.name}: ${parsed.message}`);
          return parsed.values;
        });

        const ids: number[] = [];
        for (let start = 0; start < parsedRows.length; start += CHUNK)
          ids.push(
            ...(await createRecordRows(
              workspace,
              entry.table,
              parsedRows.slice(start, start + CHUNK),
              userId,
            )),
          );

        const byTitle = new Map<string, number>();
        (def.rows ?? []).forEach((row, index) => byTitle.set(String(row[def.title]), ids[index]));
        titles.set(def.name.toLowerCase(), byTitle);
      }
    }
  } catch (error) {
    if (built.size)
      await dropTables(
        workspace,
        [...built.values()].map(({ table }) => ({ id: table.id, tableName: table.tableName })),
      ).catch(() => undefined);
    throw error;
  }

  return { tables: [...built.values()].map(({ table }) => ({ id: table.id, name: table.name })) };
}
