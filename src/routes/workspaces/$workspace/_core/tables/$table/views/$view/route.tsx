import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";

import { viewQueryOptions } from "@/data/workspace/views";
import { ALL_VIEW } from "@/lib/views/constants";

export const Route = createFileRoute("/workspaces/$workspace/_core/tables/$table/views/$view")({
  staticData: {
    crumb: (loaderData) =>
      (loaderData as { name?: string } | null | undefined)?.name ?? "All records",
  },
  // `null` means all records (`ALL_VIEW`): the table itself, not a saved view.
  loader: async ({ context, params }) => {
    if (params.view === ALL_VIEW) return null;

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
