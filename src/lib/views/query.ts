import { type inferParserType, parseAsString, parseAsStringLiteral } from "nuqs/server";

import { createSearchValidator } from "../search-params";

export const VIEW_SORTS = ["name", "columnCount", "createdAt", "updatedAt"] as const;

export const viewsSearchParams = {
  sort: parseAsStringLiteral(VIEW_SORTS).withDefault("name"),
  order: parseAsStringLiteral(["asc", "desc"] as const).withDefault("asc"),
  q: parseAsString.withDefault(""),
};

export type ViewsQuery = inferParserType<typeof viewsSearchParams>;

export const validateViewsSearch = createSearchValidator(viewsSearchParams);
