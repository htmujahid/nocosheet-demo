import {
  type inferParserType,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";
import { z } from "zod";

import { createSearchValidator } from "../search-params";

export const VIEW_SORTS = ["name", "columnCount", "createdAt", "updatedAt"] as const;

/** List state kept in the URL. Views are few, so the page sorts and filters them locally. */
export const viewsSearchParams = {
  sort: parseAsStringLiteral(VIEW_SORTS).withDefault("name"),
  order: parseAsStringLiteral(["asc", "desc"] as const).withDefault("asc"),
  q: parseAsString.withDefault(""),
};

export type ViewsQuery = inferParserType<typeof viewsSearchParams>;

export const validateViewsSearch = createSearchValidator(viewsSearchParams);

/** Query of `GET .../views`: an optional cap on how many views come back. */
export const viewsLimitSchema = z.object({ limit: z.coerce.number().int().positive().max(100).optional() });

export const viewScopeSchema = z.object({ view: z.coerce.number().int().positive().optional() });
