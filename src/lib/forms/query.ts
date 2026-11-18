import {
  type inferParserType,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";
import { z } from "zod";

import { createSearchValidator } from "../search-params";

export const FORM_SORTS = ["name", "columnCount", "createdAt", "updatedAt"] as const;

/** List state kept in the URL. Forms are few, so the page sorts and filters them locally. */
export const formsSearchParams = {
  sort: parseAsStringLiteral(FORM_SORTS).withDefault("name"),
  order: parseAsStringLiteral(["asc", "desc"] as const).withDefault("asc"),
  q: parseAsString.withDefault(""),
};

export type FormsQuery = inferParserType<typeof formsSearchParams>;

export const validateFormsSearch = createSearchValidator(formsSearchParams);

/** Query of `GET .../forms`: an optional cap on how many forms come back. */
export const formsLimitSchema = z.object({ limit: z.coerce.number().int().positive().max(100).optional() });
