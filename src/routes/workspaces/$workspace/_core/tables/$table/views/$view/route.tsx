import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";

import { viewQueryOptions } from "@/data/workspace/views";

export const Route = createFileRoute("/workspaces/$workspace/_core/tables/$table/views/$view")({
  staticData: { crumb: (loaderData) => (loaderData as { name?: string } | undefined)?.name },
  loader: async ({ context, params }) => {
    const viewId = Number(params.view);
    if (!Number.isInteger(viewId) || viewId < 1) throw notFound();

    return context.queryClient
      .query(viewQueryOptions(params.workspace, Number(params.table), viewId))
      .catch(() => {
        throw notFound();
      });
  },
  component: Outlet,
});
