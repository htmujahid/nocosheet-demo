import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";

import { WorkspaceContent, WorkspaceHeader } from "@/components/layout/workspace-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TableGridView } from "@/components/workspace/records/grid/table-grid-view";
import { TableActions } from "@/components/workspace/records/table-actions";
import { recordsQueryOptions } from "@/data/workspace/records";
import { viewsQueryOptions } from "@/data/workspace/views";
import { useAccess } from "@/hooks/use-access";
import { resolveRecordsQuery, validateRecordsSearch } from "@/lib/records/query";

export const Route = createFileRoute("/workspaces/$workspace/_core/tables/$table/_viewer")({
  validateSearch: (search: Record<string, unknown>) => search,
  loaderDeps: ({ search }) => resolveRecordsQuery(validateRecordsSearch(search)),
  loader: async ({ context, deps, params }) => {
    await context.queryClient
      .query(recordsQueryOptions(params.workspace, Number(params.table), deps))
      .catch(() => undefined);
  },
  component: ViewerPage,
});

function ViewerPage() {
  const { workspace, table } = Route.useParams();
  const navigate = Route.useNavigate();
  const access = useAccess();
  const readable = access.can("read", Number(table));
  const { data: views } = useQuery({
    ...viewsQueryOptions(workspace, Number(table)),
    enabled: !readable,
  });

  if (!readable) {
    if (views?.[0])
      return (
        <Navigate
          to="/workspaces/$workspace/tables/$table/views/$view"
          params={{ workspace, table, view: String(views[0].id) }}
          replace
        />
      );
    return (
      <>
        <WorkspaceHeader workspace={workspace}>
          <TableActions workspace={workspace} table={table} />
        </WorkspaceHeader>
        <WorkspaceContent>
          {views && (
            <Alert variant="info">
              <AlertDescription>
                You don't have access to the records of this table.
              </AlertDescription>
            </Alert>
          )}
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
              to: "/workspaces/$workspace/tables/$table/$record",
              params: { workspace, table, record: String(id) },
              search: (previous) => previous,
            })
          }
        />
      </WorkspaceContent>
      <Outlet />
    </>
  );
}
