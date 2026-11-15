import { z } from "zod";

import { isEditableColumn } from "../records/values";
import { iconName } from "../tables/validation";

export const formInputSchema = z.object({
  icon: iconName,
  name: z.string().trim().min(1, "Name is required").max(64, "Name must be 64 characters or fewer"),
  description: z
    .string()
    .trim()
    .max(500)
    .nullish()
    .transform((value) => value || null),
  selectColumns: z
    .array(z.string().min(1).max(64))
    .min(1, "Pick at least one column")
    .max(200)
    .transform((value) => [...new Set(value)]),
  isOpen: z.boolean().default(true),
});

export const formsDeleteSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1).max(100),
});

export type FormInput = z.input<typeof formInputSchema>;
export type FormValues = z.output<typeof formInputSchema>;

type DefinitionColumn = {
  columnName: string;
  name: string;
  format: string;
  isRequired: boolean;
  defaultValue: string | null;
  generatedExpression: string | null;
};

export function checkFormDefinition(columns: DefinitionColumn[], form: FormValues) {
  const byName = new Map(columns.map((column) => [column.columnName, column]));

  for (const name of form.selectColumns) {
    const column = byName.get(name);
    if (!column) return `"${name}" isn't a column of this table.`;
    if (!isEditableColumn(column)) return `${column.name} can't be filled in through a form.`;
  }

  const missing = columns.find(
    (column) =>
      column.isRequired &&
      isEditableColumn(column) &&
      column.defaultValue === null &&
      !form.selectColumns.includes(column.columnName),
  );
  if (missing) return `${missing.name} is required, so the form has to include it.`;
  return undefined;
}
