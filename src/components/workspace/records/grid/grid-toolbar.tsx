import { type ReactNode, useEffect, useMemo, useState } from "react";

import { PlusIcon, SearchIcon } from "lucide-react";

import { DataTableViewOptions } from "@/components/shared/data-table/data-table-view-options";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { toColumnFilters } from "@/lib/records/column-filters";
import { SYSTEM_FILTER_COLUMNS } from "@/lib/records/filters";

import type { ViewerColumn } from "../columns";
import type { FilterField } from "../filter-builder";
import { RecordFilters } from "../record-filters";
import type { DraftRow } from "../use-draft-row";
import type { GridTable } from "./use-grid-table";
import type { RecordsQuery } from "./use-records-query";

export function GridToolbar({
  grid,
  columns,
  query,
  draft,
  children,
}: {
  grid: GridTable;
  columns: ViewerColumn[];
  query: RecordsQuery;
  draft?: DraftRow;
  children?: ReactNode;
}) {
  const searchable = columns.some((column) => column.searchable);
  const [search, setSearch] = useState(query.q);
  useEffect(() => setSearch(query.q), [query.q]);

  const filterColumns = useMemo<FilterField[]>(
    () => [
      ...columns,
      ...SYSTEM_FILTER_COLUMNS.map((column) => ({
        key: column.columnName,
        name: column.name,
        format: column.format,
        filterable: true,
        options: {},
      })),
    ],
    [columns],
  );

  return (
    <div className="flex flex-wrap items-center gap-2 border-t px-4 py-2">
      {searchable && (
        <form
          role="search"
          className="w-full sm:w-64"
          onSubmit={(event) => {
            event.preventDefault();
            if (search !== query.q) grid.setGlobalFilter(search);
          }}
        >
          <InputGroup>
            <InputGroupInput
              type="search"
              enterKeyHint="search"
              aria-label="Search records"
              placeholder="Search records"
              className="[&::-webkit-search-cancel-button]:appearance-none"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <InputGroupAddon align="inline-end">
              <Button type="submit" variant="ghost" size="icon-xs" aria-label="Search">
                <SearchIcon aria-hidden="true" />
              </Button>
            </InputGroupAddon>
          </InputGroup>
        </form>
      )}
      <RecordFilters
        columns={filterColumns}
        value={query.filters}
        onApply={(filters) => grid.setColumnFilters(toColumnFilters(filters))}
      />
      {children}
      <div className="ms-auto flex items-center gap-2">
        {draft && (
          <Button variant="outline" disabled={draft.row !== null} onClick={() => draft.new()}>
            <PlusIcon aria-hidden="true" />
            New row
          </Button>
        )}
        <DataTableViewOptions table={grid} />
      </div>
    </div>
  );
}
