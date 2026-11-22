import { z } from "zod";

import { type SelectChoice } from "../tables/formats";

export const MAX_IMPORT_ROWS = 100;
export const MAX_IMPORT_ERRORS = 25;

const SKIPPED_FORMATS = ["file", "image", "binary"];

export const isImportableFormat = (format: string) => !SKIPPED_FORMATS.includes(format);

export const recordsImportSchema = z.object({
  rows: z
    .array(z.record(z.string(), z.string()))
    .min(1, "The file has no records.")
    .max(MAX_IMPORT_ROWS, `Import up to ${MAX_IMPORT_ROWS} records at a time.`),
});

export type ImportRowError = { row: number; message: string };

export type ImportResult = { created: number; failed: number; errors: ImportRowError[] };

type ImportColumn = { format: string; options: Record<string, unknown> };

export type CellResult = { ok: true; value: unknown } | { ok: false; message: string };

const ok = (value: unknown): CellResult => ({ ok: true, value });
const fail = (message: string): CellResult => ({ ok: false, message });

const NUMBER_FORMATS = ["integer", "decimal", "percent", "currency", "rating", "duration"];
const TRUE_WORDS = ["true", "yes", "y", "1", "checked", "x"];
const FALSE_WORDS = ["false", "no", "n", "0", "unchecked"];

const choicesOf = (options: Record<string, unknown>) =>
  (options.choices as SelectChoice[] | undefined) ?? [];

function matchChoice(options: Record<string, unknown>, text: string) {
  const wanted = text.trim().toLowerCase();
  return choicesOf(options).find(
    (choice) => choice.label.toLowerCase() === wanted || choice.value.toLowerCase() === wanted,
  );
}

export function unescapeCell(text: string) {
  return /^'[=+\-@\t\r]/.test(text) ? text.slice(1) : text;
}

export function convertCell(column: ImportColumn, raw: string): CellResult | null {
  const text = unescapeCell(raw).trim();
  if (text === "") return null;

  if (NUMBER_FORMATS.includes(column.format)) {
    const number = Number(text.replaceAll(",", ""));
    return Number.isNaN(number) ? fail("Enter a number") : ok(number);
  }

  switch (column.format) {
    case "relation": {
      const id = Number(text);
      return Number.isInteger(id) && id > 0 ? ok(id) : fail("Enter the linked record's ID");
    }
    case "checkbox": {
      const word = text.toLowerCase();
      if (TRUE_WORDS.includes(word)) return ok(true);
      if (FALSE_WORDS.includes(word)) return ok(false);
      return fail("Use true or false");
    }
    case "single_select": {
      const choice = matchChoice(column.options, text);
      return choice ? ok(choice.value) : fail(`"${text}" isn't one of the choices`);
    }
    case "multi_select": {
      const values: string[] = [];
      for (const part of text.split(/[;|]/)) {
        const label = part.trim();
        if (!label) continue;
        const choice = matchChoice(column.options, label);
        if (!choice) return fail(`"${label}" isn't one of the choices`);
        if (!values.includes(choice.value)) values.push(choice.value);
      }
      return values.length ? ok(values) : null;
    }
    case "date": {
      if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return ok(text);
      const date = new Date(text);
      return Number.isNaN(date.getTime())
        ? fail("Enter a valid date")
        : ok(date.toISOString().slice(0, 10));
    }
    case "datetime": {
      const date = new Date(/^-?\d+$/.test(text) ? Number(text) : text);
      return Number.isNaN(date.getTime())
        ? fail("Enter a valid date and time")
        : ok(date.getTime());
    }
    case "datetime_tz": {
      const date = new Date(text);
      return Number.isNaN(date.getTime())
        ? fail("Enter a valid date and time")
        : ok(date.toISOString());
    }
    case "json":
      try {
        return ok(JSON.parse(text) as unknown);
      } catch {
        return fail("Enter valid JSON");
      }
    default:
      return ok(unescapeCell(raw));
  }
}

export function parseCsv(input: string) {
  const text = input.replace(/^﻿/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        cell += '"';
        index++;
      } else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[index + 1] === "\n") index++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += char;
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }

  return rows.filter((items) => items.some((item) => item.trim() !== ""));
}

type MappableColumn = { key: string; name: string };

export function matchHeaders(headers: string[], columns: MappableColumn[]) {
  const taken = new Set<string>();
  return headers.map((header) => {
    const wanted = header.trim().toLowerCase();
    const column = columns.find(
      (item) =>
        !taken.has(item.key) &&
        (item.name.toLowerCase() === wanted || item.key.toLowerCase() === wanted),
    );
    if (column) taken.add(column.key);
    return column?.key ?? null;
  });
}
