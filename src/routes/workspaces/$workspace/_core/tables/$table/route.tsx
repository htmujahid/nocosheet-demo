import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";

import { formsQueryOptions } from "@/data/workspace/forms";
import { tableQueryOptions } from "@/data/workspace/tables";
import { viewsQueryOptions } from "@/data/workspace/views";

export const Route = createFileRoute("/workspaces/$workspace/_core/tables/$table")({
  staticData: { crumb: (loaderData) => (loaderData as { name?: string } | undefined)?.name },
  loader: async ({ context, params }) => {
    const id = Number(params.table);
    if (!Number.isInteger(id) || id < 1) throw notFound();
    const [table, views, forms] = await Promise.all([
      context.queryClient
        .query({ ...tableQueryOptions(params.workspace, id), staleTime: 0 })
        .catch(() => undefined),
      context.queryClient.query(viewsQueryOptions(params.workspace, id)).catch(() => undefined),
      context.queryClient.query(formsQueryOptions(params.workspace, id)).catch(() => undefined),
    ]);
    if (!table && !views?.length && !forms?.length) throw notFound();
    return table;
  },
  component: Outlet,
});
