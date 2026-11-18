import { useQuery } from "@tanstack/react-query";
import { createFileRoute, getRouteApi, redirect } from "@tanstack/react-router";

import { DetailRecordSheet } from "@/components/workspace/records/record-sheet/detail-record-sheet";
import { UpdateRecordSheet } from "@/components/workspace/records/record-sheet/update-record-sheet";
import { recordQueryOptions } from "@/data/workspace/records";
import { useAccess } from "@/hooks/use-access";
import { scopeFor } from "@/lib/access/grants";
import { ALL_VIEW } from "@/lib/views/constants";

const viewRoute = getRouteApi("/workspaces/$workspace/_core/tables/$table/views/$view");

export const Route = createFileRoute(
  "/workspaces/$workspace/_core/tables/$table/views/$view/_viewer/$record",
)({
  pendingComponent: () => null,
  beforeLoad: async ({ context, params }) => {
    const tableId = Number(params.table);
    const viewId = params.view === ALL_VIEW ? undefined : Number(params.view);
    const back = () =>
      redirect({
        to: "/workspaces/$workspace/tables/$table/views/$view",
        params: { workspace: params.workspace, table: params.table, view: params.view },
        search: (previous) => previous,
        replace: true,
      });

    const scope = scopeFor(context.access, "read", tableId, viewId);
    if (scope === "none") throw back();

    // The record must exist and be readable; with `read:own` it must also be the user's own.
    const record = await context.queryClient
      .query(recordQueryOptions(params.workspace, tableId, Number(params.record), viewId))
      .catch(() => undefined);
    if (!record) throw back();
    if (scope === "own") {
      const owner = (record.created_by as { id?: string } | null | undefined)?.id;
      if (!owner || owner !== context.session?.user.id) throw back();
    }
  },
  component: RecordPage,
});

function RecordPage() {
  const { workspace, table, view: viewParam, record } = Route.useParams();
  const loaded = viewRoute.useLoaderData();
  const navigate = Route.useNavigate();
  const access = useAccess();
  const tableId = Number(table);
  // `loaded` is null on the table grid: no view scoping for access or columns.
  const viewId = loaded?.id;
  const { data } = useQuery(recordQueryOptions(workspace, tableId, Number(record), viewId));

  const owner = (data?.created_by as { id?: string } | null | undefined)?.id;
  const editable = access.canOn("update", tableId, owner, viewId);
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

  const canDelete = access.canOn("delete", tableId, owner, viewId);

  return editable ? (
    <UpdateRecordSheet {...sheetProps} canDelete={canDelete} />
  ) : (
    <DetailRecordSheet {...sheetProps} canDelete={canDelete} />
  );
}
