import { z } from "zod";

import { conditionError, filterKind, filtersSchema } from "../records/filters";
import { COLUMN_FORMATS, SEARCHABLE_FORMATS } from "../tables/formats";
import { columnInputSchema, iconName } from "../tables/validation";
import { viewInputSchema } from "../views/validation";

export const TEMPLATE_VERSION = 1;

const name = z.string().trim().min(1).max(64);
const text = (max: number) => z.string().trim().max(max);

const templateColumn = z.object({
  name,
  format: z.enum(COLUMN_FORMATS),
  description: text(500).optional(),
  icon: iconName.optional(),
  options: z.record(z.string(), z.unknown()).optional(),
  relation: name.optional(),
  required: z.boolean().optional(),
  unique: z.boolean().optional(),
  hidden: z.boolean().optional(),
  searchable: z.boolean().optional(),
  filterable: z.boolean().optional(),
  sortable: z.boolean().optional(),
  default: text(500).optional(),
  generated: text(500).optional(),
  check: text(500).optional(),
});

const templateView = z.object({
  name,
  icon: iconName,
  description: text(500).optional(),
  columns: z.array(name).min(1).max(200),
  filters: filtersSchema.optional(),
});

export const relativeDate = z.object({
  $days: z.number().int(),
  $hour: z.number().int().min(0).max(23).optional(),
});

const templateTable = z.object({
  name,
  icon: iconName,
  group: name.optional(),
  description: text(500).optional(),
  title: name,
  audit: z.boolean().optional(),
  hidden: z.boolean().optional(),
  columns: z.array(templateColumn).min(1).max(200),
  views: z.array(templateView).max(50).optional(),
  rows: z.array(z.record(z.string(), z.unknown())).max(2000).optional(),
});

export const templateSchema = z.object({
  version: z.literal(TEMPLATE_VERSION),
  id: z
    .string()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use a lowercase slug")
    .max(64),
  name,
  description: text(300),
  icon: iconName,
  tags: z.array(name).max(10).optional(),
  tables: z.array(templateTable).min(1).max(50),
});

export type Template = z.infer<typeof templateSchema>;
export type TemplateTable = Template["tables"][number];
export type TemplateColumn = z.infer<typeof templateColumn>;

export function checkTemplate(template: Template): string[] {
  const problems: string[] = [];
  const tables = new Map(template.tables.map((table) => [table.name.toLowerCase(), table]));
  if (tables.size !== template.tables.length) problems.push("Table names must be unique");

  for (const table of template.tables) {
    const at = (rest: string) => `${table.name}: ${rest}`;
    const columns = new Map(table.columns.map((column) => [column.name, column]));
    if (columns.size !== table.columns.length) problems.push(at("column names must be unique"));
    if (!columns.has(table.title)) problems.push(at(`title column "${table.title}" doesn't exist`));

    table.columns.forEach((column, position) => {
      const target = column.relation;
      if ((column.format === "relation") !== (target !== undefined))
        problems.push(at(`${column.name} needs "relation" if and only if its format is relation`));
      if (target !== undefined && !tables.has(target.toLowerCase()))
        problems.push(at(`${column.name} links to unknown table "${target}"`));
      if (column.searchable && !SEARCHABLE_FORMATS.includes(column.format))
        problems.push(at(`${column.name} can't be searchable`));

      const parsed = columnInputSchema.safeParse({
        name: column.name,
        description: column.description,
        icon: column.icon,
        format: column.format,
        options: target ? { tableId: 1, ...column.options } : (column.options ?? {}),
        isRequired: column.required,
        isUnique: column.unique,
        isHidden: column.hidden,
        isSearchable: column.searchable,
        isFilterable: column.filterable ?? false,
        isSortable: column.sortable ?? false,
        defaultValue: column.default,
        generatedExpression: column.generated,
        checkExpression: column.check,
        position,
      });
      if (!parsed.success)
        problems.push(at(`${column.name}: ${parsed.error.issues[0]?.message ?? "invalid"}`));
    });

    const choices = (columnName: string) =>
      (columns.get(columnName)?.options?.choices as { value: string }[] | undefined)?.map(
        (choice) => choice.value,
      );

    for (const view of table.views ?? []) {
      const parsed = viewInputSchema.safeParse({ ...view, selectColumns: view.columns });
      if (!parsed.success)
        problems.push(at(`view "${view.name}": ${parsed.error.issues[0]?.message}`));
      for (const columnName of view.columns)
        if (!columns.has(columnName))
          problems.push(at(`view "${view.name}" uses unknown column ${columnName}`));
      for (const condition of view.filters ?? []) {
        const column = columns.get(condition.column);
        const kind = column ? filterKind(column.format) : null;
        if (!column || !kind) {
          problems.push(at(`view "${view.name}" filters on ${condition.column}`));
          continue;
        }
        if (!column.filterable)
          problems.push(
            at(`view "${view.name}" filters on ${condition.column}, which isn't filterable`),
          );
        const error = conditionError(kind, condition);
        if (error) problems.push(at(`view "${view.name}", ${condition.column}: ${error}`));
        const known = choices(condition.column);
        const values = Array.isArray(condition.value) ? condition.value : [condition.value];
        if (known && values.some((value) => typeof value === "string" && !known.includes(value)))
          problems.push(at(`view "${view.name}" has an unknown choice for ${condition.column}`));
      }
    }

    const writable = new Set(
      table.columns.filter((column) => !column.generated).map((c) => c.name),
    );
    for (const [index, row] of (table.rows ?? []).entries())
      for (const key of Object.keys(row))
        if (!writable.has(key))
          problems.push(at(`row ${index + 1} has unknown or computed column ${key}`));

    for (const column of table.columns) {
      const known = choices(column.name);
      if (!known) continue;
      for (const [index, row] of (table.rows ?? []).entries()) {
        const raw = row[column.name];
        const values = Array.isArray(raw) ? raw : [raw];
        for (const value of values)
          if (value !== undefined && value !== null && !known.includes(String(value)))
            problems.push(
              at(`row ${index + 1}: "${String(value)}" isn't a choice of ${column.name}`),
            );
      }
    }

    for (const column of table.columns) {
      if (!column.relation) continue;
      const target = tables.get(column.relation.toLowerCase());
      if (!target) continue;
      const titles = new Set((target.rows ?? []).map((row) => String(row[target.title])));
      for (const [index, row] of (table.rows ?? []).entries()) {
        const value = row[column.name];
        if (value !== undefined && value !== null && !titles.has(String(value)))
          problems.push(at(`row ${index + 1}: no ${target.name} titled "${String(value)}"`));
      }
    }
  }
  return problems;
}
