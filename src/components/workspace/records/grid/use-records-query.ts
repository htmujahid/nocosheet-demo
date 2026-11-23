import { useQueryStates } from "nuqs";

import { parseFilters, serializeFilters, targetsOfColumns } from "@/lib/records/filter-param";
import { SYSTEM_FILTER_COLUMNS } from "@/lib/records/filters";
import { recordsSearchParams, resolveRecordsQuery } from "@/lib/records/query";
import { sortKeyOf } from "@/lib/records/sort-param";

import type { ViewerColumn } from "../columns";

export function useRecordsQuery(columns: ViewerColumn[]) {
  const [urlQuery, setUrlQuery] = useQueryStates(recordsSearchParams, { history: "replace" });

  const resolved = resolveRecordsQuery(urlQuery);
  const sortKey = sortKeyOf(
    columns.filter((column) => column.sortable).map((c) => ({ columnName: c.key, name: c.name })),
    resolved.sort,
  );

  const nameByKey = new Map(columns.map((column) => [column.key, column.name]));
  const { filters } = parseFilters(
    resolved.filter,
    targetsOfColumns([
      ...columns
        .filter((column) => column.filterable)
        .map((column) => ({ columnName: column.key, name: column.name, format: column.format })),
      ...SYSTEM_FILTER_COLUMNS.map((column) => ({ ...column })),
    ]),
  );

  const query = {
    ...resolved,
    filters,
    filter: serializeFilters(filters, (key) => nameByKey.get(key) ?? key),
    sort: sortKey ? (nameByKey.get(sortKey) ?? null) : null,
    sortKey: sortKey ?? null,
  };

  const setQuery = (values: { [K in keyof typeof urlQuery]?: (typeof urlQuery)[K] | null }) =>
    setUrlQuery({ page: null, ...values });

  return {
    query,
    setUrlQuery: setQuery,
    setPage: setUrlQuery,
  };
}

export function useRecordsPaging({
  hasMore,
  query,
  setPage,
}: {
  hasMore: boolean;
  query: RecordsQuery;
  setPage: SetRecordsPage;
}) {
  const goTo = (page: number) => void setPage({ page }, { history: "push" });

  return {
    page: query.page,
    hasPrevious: query.page > 1,
    canNext: hasMore,
    next: () => hasMore && goTo(query.page + 1),
    previous: () => query.page > 1 && goTo(query.page - 1),
  };
}

export type RecordsPaging = ReturnType<typeof useRecordsPaging>;

export type RecordsQuery = ReturnType<typeof useRecordsQuery>["query"];
export type SetRecordsPage = ReturnType<typeof useRecordsQuery>["setPage"];
export type SetRecordsQuery = ReturnType<typeof useRecordsQuery>["setUrlQuery"];
