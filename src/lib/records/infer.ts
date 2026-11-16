import { type ColumnFormat } from "../tables/formats";

export const IMPORT_COLUMN_FORMATS: ColumnFormat[] = [
  "text",
  "long_text",
  "email",
  "url",
  "phone",
  "color",
  "integer",
  "decimal",
  "percent",
  "currency",
  "rating",
  "duration",
  "checkbox",
  "date",
  "time",
  "datetime",
  "datetime_tz",
  "json",
];

const BOOLEAN_WORDS = ["true", "false", "yes", "no"];
const INTEGER = /^-?(0|[1-9]\d{0,14})$/;
const DECIMAL = /^-?(0|[1-9]\d*)\.\d+$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const DATETIME = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_LIKE = /^https?:\/\/\S+$/i;

const validDate = (text: string) => !Number.isNaN(new Date(text).getTime());

export function inferFormat(values: string[]): ColumnFormat {
  const samples = values.map((value) => value.trim()).filter((value) => value !== "");
  if (samples.length === 0) return "text";
  const every = (test: (value: string) => boolean) => samples.every(test);

  if (every((value) => BOOLEAN_WORDS.includes(value.toLowerCase()))) return "checkbox";
  if (every((value) => INTEGER.test(value))) return "integer";
  if (every((value) => INTEGER.test(value) || DECIMAL.test(value))) return "decimal";
  if (every((value) => DATE.test(value) && validDate(value))) return "date";
  if (every((value) => DATETIME.test(value) && validDate(value))) return "datetime_tz";
  if (every((value) => EMAIL.test(value))) return "email";
  if (every((value) => URL_LIKE.test(value))) return "url";
  if (samples.some((value) => value.length > 200 || value.includes("\n"))) return "long_text";
  return "text";
}
