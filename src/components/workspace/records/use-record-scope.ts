import { useMemo } from "react";

import { eq, useLiveSuspenseQuery } from "@tanstack/react-db";
import { notFound } from "@tanstack/react-router";

import { columnsCollection } from "@/data/workspace/columns";
import { tablesCollection } from "@/data/workspace/tables";

import { buildScopedColumns, type ViewScope } from "./columns";

export function useRecordScope(
  _workspace: string,
  tableId: number,
  view?: Pick<ViewScope, "selectColumns">,
) {
  const { data: table } = useLiveSuspenseQuery((q) =>
    q
      .from({ table: tablesCollection })
      .where(({ table }) => eq(table.id, tableId))
      .findOne(),
  );
  if (!table) throw notFound();
  const { data: columns } = useLiveSuspenseQuery((q) =>
    q.from({ column: columnsCollection(tableId) }).orderBy(({ column }) => column.position),
  );
  const selectColumns = view?.selectColumns;

  return useMemo(
    () => ({
      tableName: table.name,
      columns: buildScopedColumns({ titleColumnId: table.titleColumnId, columns }, selectColumns),
    }),
    [table.name, table.titleColumnId, columns, selectColumns],
  );
}
