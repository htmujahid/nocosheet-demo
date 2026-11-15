import {
  createStandardSchemaV1,
  type inferParserType,
  parseAsInteger,
  parseAsNumberLiteral,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";
import { z } from "zod";

import { createSearchValidator } from "../search-params";
import { PAGE_SIZES } from "../tables/query";

export const VIEW_SORTS = ["name", "columnCount", "createdAt", "updatedAt"] as const;

export const viewsSearchParams = {
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsNumberLiteral(PAGE_SIZES).withDefault(10),
  sort: parseAsStringLiteral(VIEW_SORTS).withDefault("name"),
  order: parseAsStringLiteral(["asc", "desc"] as const).withDefault("asc"),
  q: parseAsString.withDefault(""),
};

export type ViewsQuery = inferParserType<typeof viewsSearchParams>;

export const viewsSearchSchema = createStandardSchemaV1(viewsSearchParams, {
  partialOutput: true,
});

export const resolveViewsQuery = (search: Partial<ViewsQuery>): ViewsQuery => ({
  page: Math.max(1, search.page ?? viewsSearchParams.page.defaultValue),
  pageSize: search.pageSize ?? viewsSearchParams.pageSize.defaultValue,
  sort: search.sort ?? viewsSearchParams.sort.defaultValue,
  order: search.order ?? viewsSearchParams.order.defaultValue,
  q: search.q ?? viewsSearchParams.q.defaultValue,
});

export const validateViewsSearch = createSearchValidator(viewsSearchParams);

export const viewScopeSchema = z.object({ view: z.coerce.number().int().positive().optional() });
