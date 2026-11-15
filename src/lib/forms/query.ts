import {
  createStandardSchemaV1,
  type inferParserType,
  parseAsInteger,
  parseAsNumberLiteral,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";

import { createSearchValidator } from "../search-params";
import { PAGE_SIZES } from "../tables/query";

export const FORM_SORTS = ["name", "columnCount", "createdAt", "updatedAt"] as const;

export const formsSearchParams = {
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsNumberLiteral(PAGE_SIZES).withDefault(10),
  sort: parseAsStringLiteral(FORM_SORTS).withDefault("name"),
  order: parseAsStringLiteral(["asc", "desc"] as const).withDefault("asc"),
  q: parseAsString.withDefault(""),
};

export type FormsQuery = inferParserType<typeof formsSearchParams>;

export const formsSearchSchema = createStandardSchemaV1(formsSearchParams, {
  partialOutput: true,
});

export const resolveFormsQuery = (search: Partial<FormsQuery>): FormsQuery => ({
  page: Math.max(1, search.page ?? formsSearchParams.page.defaultValue),
  pageSize: search.pageSize ?? formsSearchParams.pageSize.defaultValue,
  sort: search.sort ?? formsSearchParams.sort.defaultValue,
  order: search.order ?? formsSearchParams.order.defaultValue,
  q: search.q ?? formsSearchParams.q.defaultValue,
});

export const validateFormsSearch = createSearchValidator(formsSearchParams);
