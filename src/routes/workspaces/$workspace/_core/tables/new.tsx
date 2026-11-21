import { createFileRoute, notFound, redirect } from "@tanstack/react-router";

import { z } from "zod";

import { WorkspaceContent, WorkspaceHeader } from "@/components/layout/workspace-header";
import { Frame, FrameDescription, FrameHeader, FrameTitle } from "@/components/ui/frame";
import { ColumnsStep } from "@/components/workspace/tables/columns-step";
import { TableStep } from "@/components/workspace/tables/table-step";
import { tablesCollection } from "@/data/workspace/tables";
import { requireOnline } from "@/lib/require-online";

const searchSchema = z.object({
  step: z.union([z.literal(1), z.literal(2)]).catch(1),
  table: z.coerce.number().int().positive().optional().catch(undefined),
});

export const Route = createFileRoute("/workspaces/$workspace/_core/tables/new")({
  staticData: { crumb: "New table" },
  validateSearch: searchSchema,
  beforeLoad: ({ context, location, search, params }) => {
    requireOnline(location);
    if (!context.workspace.isAdmin)
      throw redirect({ to: "/workspaces/$workspace", params: { workspace: params.workspace } });
    if (search.step === 2 && !search.table)
      throw redirect({ to: "/workspaces/$workspace/tables/new", params, search: { step: 1 } });
    if (search.step === 1 && search.table)
      throw redirect({
        to: "/workspaces/$workspace/tables/new",
        params,
        search: { step: 2, table: search.table },
      });
  },
  loaderDeps: ({ search }) => ({ table: search.table }),
  loader: async ({ context, deps }) => {
    if (!deps.table) return null;
    const tables = context.dbClient.collection(tablesCollection);
    await tables.preload();
    const table = tables.get(deps.table);
    if (!table) throw notFound();
    return table;
  },
  component: NewTablePage,
});

function NewTablePage() {
  const { workspace } = Route.useParams();
  const { step, table: tableId } = Route.useSearch();
  const table = Route.useLoaderData();
  const navigate = Route.useNavigate();

  return (
    <>
      <WorkspaceHeader workspace={workspace} />
      <WorkspaceContent className="max-w-3xl">
        <Frame>
          <FrameHeader>
            <FrameTitle>{table ? table.name : "New table"}</FrameTitle>
            <FrameDescription>Set up the table, then define its columns.</FrameDescription>
          </FrameHeader>

          {step === 1 || !tableId || !table ? (
            <TableStep onDone={(id) => navigate({ search: { step: 2, table: id } })} />
          ) : (
            <ColumnsStep
              tableId={tableId}
              onDiscarded={() =>
                navigate({ to: "/workspaces/$workspace/tables", params: { workspace } })
              }
              onFinished={() =>
                navigate({ to: "/workspaces/$workspace/tables", params: { workspace } })
              }
            />
          )}
        </Frame>
      </WorkspaceContent>
    </>
  );
}
