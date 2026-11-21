import { createFileRoute, getRouteApi, Outlet } from "@tanstack/react-router";

import { WorkspaceContent, WorkspaceHeader } from "@/components/layout/workspace-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TableGridView } from "@/components/workspace/records/grid/table-grid-view";
import { ViewGridView } from "@/components/workspace/records/grid/view-grid-view";
import { TableActions } from "@/components/workspace/records/table-actions";
import { ViewActions } from "@/components/workspace/views/view-actions";
import { recordsCollection } from "@/data/workspace/records";
import { useAccess } from "@/hooks/use-access";
import { scopeFor } from "@/lib/access/grants";

const viewRoute = getRouteApi("/workspaces/$workspace/_core/tables/$table/views/$view");

export const Route = createFileRoute(
  "/workspaces/$workspace/_core/tables/$table/views/$view/_viewer",
)({
  validateSearch: (search: Record<string, unknown>) => search,
  loader: ({ context, params }) => {
    const table = Number(params.table);
    if (scopeFor(context.access, table, "read") === "none") return;
    void context.dbClient
      .collection(recordsCollection(table))
      .preload()
      .catch(() => undefined);
  },
  component: ViewerPage,
});

function ViewerPage() {
  const view = viewRoute.useLoaderData();
  return view ? <SavedViewViewer view={view} /> : <TableViewer />;
}

function SavedViewViewer({
  view,
}: {
  view: {
    id: number;
    selectColumns: Parameters<typeof ViewGridView>[0]["view"]["selectColumns"];
    whereExpression: Parameters<typeof ViewGridView>[0]["view"]["whereExpression"];
  };
}) {
  const { workspace, table, view: viewParam } = Route.useParams();
  const navigate = Route.useNavigate();

  return (
    <>
      <WorkspaceHeader workspace={workspace}>
        <ViewActions workspace={workspace} table={table} view={view.id} />
      </WorkspaceHeader>
      <WorkspaceContent className="flex max-w-none flex-col px-0 pb-0 md:px-0">
        <ViewGridView
          workspace={workspace}
          tableId={Number(table)}
          view={{
            id: view.id,
            selectColumns: view.selectColumns,
            whereExpression: view.whereExpression,
          }}
          onOpenRecord={(id) =>
            navigate({
              to: "/workspaces/$workspace/tables/$table/views/$view/$record",
              params: { workspace, table, view: viewParam, record: String(id) },
              search: (previous) => previous,
            })
          }
        />
      </WorkspaceContent>
      <Outlet />
    </>
  );
}

function TableViewer() {
  const { workspace, table, view: viewParam } = Route.useParams();
  const navigate = Route.useNavigate();
  const access = useAccess();
  const readable = access.can(Number(table), "read");

  if (!readable) {
    return (
      <>
        <WorkspaceHeader workspace={workspace}>
          <TableActions workspace={workspace} table={table} />
        </WorkspaceHeader>
        <WorkspaceContent>
          <Alert variant="info">
            <AlertDescription>You don't have access to the records of this table.</AlertDescription>
          </Alert>
        </WorkspaceContent>
      </>
    );
  }

  return (
    <>
      <WorkspaceHeader workspace={workspace}>
        <TableActions workspace={workspace} table={table} />
      </WorkspaceHeader>
      <WorkspaceContent className="flex max-w-none flex-col px-0 pb-0 md:px-0">
        <TableGridView
          workspace={workspace}
          tableId={Number(table)}
          onOpenRecord={(id) =>
            navigate({
              to: "/workspaces/$workspace/tables/$table/views/$view/$record",
              params: { workspace, table, view: viewParam, record: String(id) },
              search: (previous) => previous,
            })
          }
        />
      </WorkspaceContent>
      <Outlet />
    </>
  );
}
