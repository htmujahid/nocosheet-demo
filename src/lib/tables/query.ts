import {
  type inferParserType,
  parseAsInteger,
  parseAsNumberLiteral,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";

import { createSearchValidator } from "../search-params";

export const TABLE_SORTS = ["name", "groupName", "updatedAt"] as const;
export const PAGE_SIZES = [10, 20, 50, 100] as const;

export const tablesSearchParams = {
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsNumberLiteral(PAGE_SIZES).withDefault(10),
  sort: parseAsStringLiteral(TABLE_SORTS).withDefault("name"),
  order: parseAsStringLiteral(["asc", "desc"] as const).withDefault("asc"),
  q: parseAsString.withDefault(""),
};

export type TablesQuery = inferParserType<typeof tablesSearchParams>;

export const validateTablesSearch = createSearchValidator(tablesSearchParams);
