import { useMemo, useSyncExternalStore } from "react";

import { eq, useDbClient, useLiveQuery, useLiveSuspenseQuery } from "@tanstack/react-db";

import { columnsCollection } from "@/data/workspace/columns";
import { recordsCollection } from "@/data/workspace/records";
import { tablesCollection } from "@/data/workspace/tables";
import { useAccess } from "@/hooks/use-access";
import { useSession } from "@/hooks/use-session";
import { type FilterCondition, SYSTEM_FILTER_COLUMNS } from "@/lib/records/filters";
import { type LocalRow, pageRows, selectRows } from "@/lib/records/local";

import type { ViewerColumn } from "../columns";
import type { ViewerRow } from "../records-grid-columns";
import { useReadOwner } from "../use-read-owner";

export type RecordsView = {
  filters: FilterCondition[];
  q: string;
  sortKey: string | null;
  order: "asc" | "desc";
  page: number;
  pageSize: number;
};

type Label = (targetId: number, recordId: number) => string | null;

export function useRelationLabels(columns: ViewerColumn[]): Label {
  const dbClient = useDbClient();
  const access = useAccess();
  const session = useSession();
  const userId = session?.user.id;
  const targetKey = columns
    .filter((column) => column.format === "relation")
    .map((column) => Number(column.options.tableId))
    .sort((a, b) => a - b)
    .join(",");

  const collections = useMemo(() => {
    const ids = targetKey ? targetKey.split(",").map(Number) : [];
    return {
      tables: dbClient.collection(tablesCollection),
      byTarget: new Map(
        [...new Set(ids)].map((id) => [
          id,
          {
            columns: dbClient.collection(columnsCollection(id)),
            records: dbClient.collection(recordsCollection(id)),
          },
        ]),
      ),
    };
  }, [dbClient, targetKey]);

  const store = useMemo(() => {
    let version = 0;
    const watched = [
      collections.tables,
      ...[...collections.byTarget.values()].flatMap((entry) => [entry.columns, entry.records]),
    ];
    return {
      subscribe: (notify: () => void) => {
        const subscriptions = (
          watched as { subscribeChanges: (callback: () => void) => { unsubscribe: () => void } }[]
        ).map((collection) =>
          collection.subscribeChanges(() => {
            version++;
            notify();
          }),
        );
        return () => subscriptions.forEach((subscription) => subscription.unsubscribe());
      },
      snapshot: () => version,
    };
  }, [collections]);

  const version = useSyncExternalStore(store.subscribe, store.snapshot);

  return useMemo(() => {
    void version;
    return (targetId, recordId) => {
      const target = collections.byTarget.get(targetId);
      const record = target?.records.get(recordId) as LocalRow | undefined;
      if (!target || !record) return null;
      const level = access.scope(targetId, "read");
      if (level === "none" || (level === "own" && record.created_by !== userId)) return null;
      const titleColumnId = collections.tables.get(targetId)?.titleColumnId;
      const title = titleColumnId == null ? undefined : target.columns.get(titleColumnId);
      const value = title ? record[title.columnName] : record.id;
      if (value === null || value === undefined) return null;
      return typeof value === "object" ? JSON.stringify(value) : String(value as string | number);
    };
  }, [collections, version, access, userId]);
}

const reference = (id: unknown, label: unknown) => (id ? { id, label: label ?? null } : null);

export function shapeViewerRow(row: LocalRow, columns: ViewerColumn[], label: Label): ViewerRow {
  const shaped: ViewerRow = {
    id: row.id as number,
    created_at: row.created_at,
    updated_at: row.updated_at,
    created_by: reference(row.created_by, row.created_by_label),
    updated_by: reference(row.updated_by, row.updated_by_label),
  };
  for (const column of columns) {
    const value = row[column.key];
    if (column.format === "relation")
      shaped[column.key] =
        value === null || value === undefined
          ? null
          : { id: value, label: label(Number(column.options.tableId), Number(value)) };
    else if (!(column.key in shaped)) shaped[column.key] = value ?? null;
  }
  return shaped;
}

export function useRecordRows({
  tableId,
  columns,
  view,
  scope,
}: {
  tableId: number;
  columns: ViewerColumn[];
  view: RecordsView;
  scope?: FilterCondition[];
}) {
  const ownerId = useReadOwner(tableId);
  const { data } = useLiveSuspenseQuery((q) => q.from({ record: recordsCollection(tableId) }));
  const { data: tableColumns } = useLiveSuspenseQuery((q) =>
    q.from({ column: columnsCollection(tableId) }),
  );
  const label = useRelationLabels(columns);

  return useMemo(() => {
    const local = [
      ...tableColumns.map((column) => ({
        columnName: column.columnName,
        format: column.format,
        isSearchable: column.isSearchable,
      })),
      ...SYSTEM_FILTER_COLUMNS.map((column) => ({
        columnName: column.columnName,
        format: column.format as string,
        isSearchable: false,
      })),
    ];
    const selected = selectRows(data as LocalRow[], local, {
      filters: view.filters,
      q: view.q,
      sort: { key: view.sortKey, order: view.order },
      scope,
      ownerId,
    });
    const paged = pageRows(selected, view.page, view.pageSize);
    return {
      rows: paged.rows.map((row) => shapeViewerRow(row, columns, label)),
      hasMore: paged.hasMore,
      total: paged.total,
      all: selected,
    };
  }, [
    data,
    tableColumns,
    columns,
    label,
    scope,
    ownerId,
    view.filters,
    view.q,
    view.sortKey,
    view.order,
    view.page,
    view.pageSize,
  ]);
}

export function useRecord(tableId: number, recordId: number, columns: ViewerColumn[]) {
  const { data, isReady } = useLiveQuery((q) =>
    q
      .from({ record: recordsCollection(tableId) })
      .where(({ record }) => eq(record.id, recordId))
      .findOne(),
  );
  const ownerId = useReadOwner(tableId);
  const label = useRelationLabels(columns);
  const record = useMemo(() => {
    if (!data || (ownerId && data.created_by !== ownerId)) return undefined;
    return shapeViewerRow(data as LocalRow, columns, label);
  }, [data, columns, label, ownerId]);
  return { record, ready: isReady };
}
