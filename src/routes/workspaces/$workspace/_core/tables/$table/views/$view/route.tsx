import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";

import { viewQueryOptions } from "@/data/workspace/views";
import { ALL_VIEW } from "@/lib/views/constants";

export const Route = createFileRoute("/workspaces/$workspace/_core/tables/$table/views/$view")({
  staticData: {
    crumb: (loaderData) =>
      (loaderData as { name?: string } | null | undefined)?.name ?? "All records",
  },
  beforeLoad: ({ params }) => {
    if (params.view === ALL_VIEW) return { viewId: null };

    const viewId = Number(params.view);
    if (!Number.isInteger(viewId) || viewId < 1) throw notFound();
    return { viewId };
  },
  loader: ({ context, params }) => {
    if (context.viewId === null) return null;

    return context.queryClient
      .query(viewQueryOptions(params.workspace, Number(params.table), context.viewId))
      .catch(() => {
        throw notFound();
      });
  },
  component: Outlet,
});
