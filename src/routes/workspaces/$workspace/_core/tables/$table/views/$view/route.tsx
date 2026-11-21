import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";

import { viewsCollection } from "@/data/workspace/views";
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
  loader: async ({ context, params }) => {
    if (context.viewId === null) return null;

    const views = context.dbClient.collection(viewsCollection(Number(params.table)));
    await views.preload();
    let view = views.get(context.viewId);
    if (!view && navigator.onLine) {
      await views.utils.refetch().catch(() => undefined);
      view = views.get(context.viewId);
    }
    if (!view) throw notFound();
    return view;
  },
  component: Outlet,
});
