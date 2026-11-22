import { useLiveSuspenseQuery, eq } from "@tanstack/react-db";
import { notFound } from "@tanstack/react-router";

import { SettingsRow } from "@/components/shared/settings-row";
import {
  Card,
  CardFrame,
  CardFrameDescription,
  CardFrameHeader,
  CardFrameTitle,
  CardPanel,
} from "@/components/ui/card";
import { columnsCollection } from "@/data/workspace/columns";
import { tablesCollection } from "@/data/workspace/tables";
import { useSession } from "@/hooks/use-session";

import { ColumnsList } from "./columns-list";
import { NamedIcon } from "./named-icon";

export function TableDefinitionView({
  workspace,
  tableId,
}: {
  workspace: string;
  tableId: number;
}) {
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

  const titleColumn = columns.find((column) => column.id === table.titleColumnId);

  return (
    <div className="flex flex-col gap-6">
      <CardFrame>
        <CardFrameHeader>
          <CardFrameTitle>{table.name}</CardFrameTitle>
          <CardFrameDescription>
            How this table is set up. Only admins can edit it.
          </CardFrameDescription>
        </CardFrameHeader>
        <Card>
          <SettingsRow title="Name" description="How the table is labelled in the app.">
            <span className="flex items-center gap-2 text-sm">
              <NamedIcon name={table.icon} className="size-4 text-muted-foreground" />
              {table.name}
            </span>
          </SettingsRow>
          <SettingsRow title="Group" description="Where the table is listed in the sidebar.">
            <span className="text-sm">{table.groupName ?? "No group"}</span>
          </SettingsRow>
          <SettingsRow title="Description" description="What the table is for.">
            <span className="text-sm">{table.description ?? "—"}</span>
          </SettingsRow>
          <SettingsRow title="Title column" description="Names each record and shows in links.">
            <span className="text-sm">{titleColumn?.name ?? "Records are shown by id"}</span>
          </SettingsRow>
        </Card>
      </CardFrame>

      <CardFrame>
        <CardFrameHeader>
          <CardFrameTitle>Columns</CardFrameTitle>
          <CardFrameDescription>
            {columns.length} {columns.length === 1 ? "column" : "columns"}
          </CardFrameDescription>
        </CardFrameHeader>
        <Card>
          <CardPanel>
            <ColumnsList
              columns={columns}
              titleColumnId={table.titleColumnId}
              empty="This table has no columns yet."
            />
          </CardPanel>
        </Card>
      </CardFrame>
    </div>
  );
}
