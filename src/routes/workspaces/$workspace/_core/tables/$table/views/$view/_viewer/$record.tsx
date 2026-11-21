import { createFileRoute, getRouteApi, redirect } from "@tanstack/react-router";

import { useRecord } from "@/components/workspace/records/grid/use-record-rows";
import { DetailRecordSheet } from "@/components/workspace/records/record-sheet/detail-record-sheet";
import { UpdateRecordSheet } from "@/components/workspace/records/record-sheet/update-record-sheet";
import { useRecordScope } from "@/components/workspace/records/use-record-scope";
import { useAccess } from "@/hooks/use-access";
import { scopeFor } from "@/lib/access/grants";

const back = (params: { workspace: string; table: string; view: string }) =>
  redirect({
    to: "/workspaces/$workspace/tables/$table/views/$view",
    params: { workspace: params.workspace, table: params.table, view: params.view },
    search: (previous) => previous,
    replace: true,
  });

const viewRoute = getRouteApi("/workspaces/$workspace/_core/tables/$table/views/$view");

export const Route = createFileRoute(
  "/workspaces/$workspace/_core/tables/$table/views/$view/_viewer/$record",
)({
  pendingComponent: () => null,
  beforeLoad: ({ context, params }) => {
    if (scopeFor(context.access, Number(params.table), "read") === "none") throw back(params);
  },
  component: RecordPage,
});

function RecordPage() {
  const { workspace, table, view: viewParam, record } = Route.useParams();
  const loaded = viewRoute.useLoaderData();
  const navigate = Route.useNavigate();
  const access = useAccess();
  const tableId = Number(table);
  const scope = useRecordScope(workspace, tableId, loaded ?? undefined);
  const { record: data } = useRecord(tableId, Number(record), scope.columns);

  const owner = (data?.created_by as { id?: string } | null | undefined)?.id;
  const editable = access.canOn(tableId, "update", owner);
  const sheetProps = {
    workspace,
    tableId,
    recordId: Number(record),
    view: loaded ? { id: loaded.id, selectColumns: loaded.selectColumns } : undefined,
    onClose: () =>
      navigate({
        to: "/workspaces/$workspace/tables/$table/views/$view",
        params: { workspace, table, view: viewParam },
        search: (previous) => previous,
      }),
  };

  const canDelete = access.canOn(tableId, "delete", owner);

  return editable ? (
    <UpdateRecordSheet {...sheetProps} canDelete={canDelete} />
  ) : (
    <DetailRecordSheet {...sheetProps} canDelete={canDelete} />
  );
}
