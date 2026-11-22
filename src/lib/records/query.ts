import {
  type inferParserType,
  parseAsInteger,
  parseAsNumberLiteral,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";
import { z } from "zod";

import { createSearchValidator } from "../search-params";
import type { FilterCondition } from "./filters";

export const RECORD_PAGE_SIZES = [10, 25, 50, 100] as const;

export const RECORD_QUERY_PAGE_SIZES = [5, ...RECORD_PAGE_SIZES] as const;

export const recordsSearchParams = {
  pageSize: parseAsNumberLiteral(RECORD_QUERY_PAGE_SIZES).withDefault(25),
  sort: parseAsString,
  order: parseAsStringLiteral(["asc", "desc"] as const).withDefault("asc"),
  q: parseAsString.withDefault(""),
  filter: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
};

export type RecordsQuery = inferParserType<typeof recordsSearchParams>;

export const RECORDS_MAX_PAGE = 1000;

export const resolveRecordsQuery = (search: Partial<RecordsQuery>) => ({
  page: Math.min(Math.max(search.page ?? 1, 1), RECORDS_MAX_PAGE),
  pageSize: search.pageSize ?? recordsSearchParams.pageSize.defaultValue,
  sort: search.sort ?? null,
  order: search.order ?? recordsSearchParams.order.defaultValue,
  q: search.q ?? recordsSearchParams.q.defaultValue,
  filter: search.filter ?? "",
});

export type ResolvedRecordsQuery = ReturnType<typeof resolveRecordsQuery>;

export const recordsKeyOf = (query: ResolvedRecordsQuery) => ({
  page: query.page,
  pageSize: query.pageSize,
  sort: query.sort,
  order: query.order,
  q: query.q,
  filter: query.filter,
});

export type TypedRecordsQuery = Omit<ResolvedRecordsQuery, "filter"> & {
  filters: FilterCondition[];
};

export function withFilters(
  query: ResolvedRecordsQuery,
  filters: FilterCondition[],
): TypedRecordsQuery {
  const { filter: _wire, ...rest } = query;
  return { ...rest, filters };
}

export const validateRecordsSearch = createSearchValidator(recordsSearchParams);

export const recordsApiSchema = z.object({
  page: z.coerce.number().int().min(1).max(RECORDS_MAX_PAGE).optional(),
  pageSize: z.coerce
    .number()
    .pipe(z.union([z.literal(5), z.literal(10), z.literal(25), z.literal(50), z.literal(100)]))
    .optional(),
  sort: z.string().max(64).optional(),
  order: z.enum(["asc", "desc"]).optional(),
  q: z.string().max(100).optional(),
  filter: z.string().max(2000).optional(),
});

export const recordsDeleteSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1).max(100),
});

export const RECORDS_COUNT_LIMIT = 1000;
