import { defineHandler } from "void";
import { requireAuth } from "void/auth";
import { z } from "zod";

import { classifyDbError } from "@/lib/db-errors";
import { httpError, writeFailure } from "@/lib/http";
import {
  convertCell,
  type ImportResult,
  type ImportRowError,
  isImportableFormat,
  MAX_IMPORT_ERRORS,
  recordsImportSchema,
} from "@/lib/records/import";
import { createRecordRows, findExistingRecordIds } from "@/lib/records/repository";
import type { ParsedValue } from "@/lib/records/values";
import { findMissingRequired, isEditableColumn, parseRecordValues } from "@/lib/records/values";
import { authorize } from "@/lib/roles/guard";
import { type Column, findTable, listColumns } from "@/lib/tables/repository";
import { viewScopeSchema } from "@/lib/views/query";

const params = z.object({ workspace: z.string(), table: z.coerce.number().int().positive() });

export const POST = defineHandler.withValidator({
  params,
  query: viewScopeSchema,
  body: recordsImportSchema,
})(async (c, { params, query, body }) => {
  const workspace = c.get("workspaceId");
  const user = requireAuth(c);
  await authorize(user, "create", params.table, query.view);
  const table = await findTable(params.table);
  if (!table) throw httpError(404, "Table not found.");
  const columns = await listColumns(table.id);
  const importable = new Map(
    columns
      .filter((column) => isEditableColumn(column) && isImportableFormat(column.format))
      .map((column) => [column.columnName, column]),
  );

  const errors: ImportRowError[] = [];
  const fail = (row: number, message: string) => {
    if (errors.length < MAX_IMPORT_ERRORS) errors.push({ row, message });
  };
  let failed = 0;
  const parsedRows: { row: number; values: ParsedValue<Column>[] }[] = [];

  for (const [index, input] of body.rows.entries()) {
    const row = index + 1;
    const values: Record<string, unknown> = {};
    let message: string | undefined;

    for (const [key, text] of Object.entries(input)) {
      const column = importable.get(key);
      if (!column) {
        message = `"${key}" can't be imported.`;
        break;
      }

      const result = convertCell(column, text);
      if (result === null) continue;
      if (!result.ok) {
        message = `${column.name}: ${result.message}`;
        break;
      }
      values[key] = result.value;
    }

    if (!message) {
      const parsed = parseRecordValues(columns, values);
      if (!parsed.ok) message = parsed.message;
      else {
        const missing = findMissingRequired(columns, parsed.values);
        if (missing) message = `${missing.name}: This field is required`;
        else parsedRows.push({ row, values: parsed.values });
      }
    }

    if (message) {
      failed++;
      fail(row, message);
    }
  }

  if (failed) return { created: 0, errors, failed } satisfies ImportResult;

  try {
    const created = await createRecordRows(
      workspace,
      table,
      parsedRows.map((item) => item.values),
      user.id,
    );
    return { created, errors, failed: 0 } satisfies ImportResult;
  } catch (error) {
    if (classifyDbError(error).kind === "foreign_key") {
      const linked = new Map<number, Set<number>>();
      for (const { values } of parsedRows)
        for (const { column, value } of values) {
          if (column.format !== "relation" || value === null) continue;
          const targetId = Number((column.options as { tableId?: number }).tableId);
          linked.set(targetId, (linked.get(targetId) ?? new Set()).add(Number(value)));
        }
      const existing = new Map<number, Set<number>>();
      for (const [targetId, ids] of linked)
        existing.set(targetId, await findExistingRecordIds(workspace, targetId, [...ids]));

      for (const { row, values } of parsedRows)
        for (const { column, value } of values) {
          if (column.format !== "relation" || value === null) continue;
          const targetId = Number((column.options as { tableId?: number }).tableId);
          if (existing.get(targetId)?.has(Number(value))) continue;
          failed++;
          fail(row, `${column.name}: no linked record has the ID ${value}.`);
          break;
        }
      if (failed) return { created: 0, errors, failed } satisfies ImportResult;
    }
    writeFailure(error, columns);
  }
});
