import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";

import { formsQueryOptions } from "@/data/workspace/forms";
import { tableQueryOptions } from "@/data/workspace/tables";
import { viewsQueryOptions } from "@/data/workspace/views";

export const Route = createFileRoute("/workspaces/$workspace/_core/tables/$table")({
  staticData: { crumb: (loaderData) => (loaderData as { name?: string } | undefined)?.name },
  beforeLoad: ({ params }) => {
    const id = Number(params.table);
    if (!Number.isInteger(id) || id < 1) throw notFound();
  },
  loader: async ({ context, params }) => {
    const id = Number(params.table);
    const views = context.queryClient
      .query(viewsQueryOptions(params.workspace, id))
      .catch(() => undefined);
    const forms = context.queryClient
      .query(formsQueryOptions(params.workspace, id))
      .catch(() => undefined);

    const table = await context.queryClient
      .query(tableQueryOptions(params.workspace, id))
      .catch(() => undefined);
    if (table) return table;

    const [visibleViews, visibleForms] = await Promise.all([views, forms]);
    if (!visibleViews?.length && !visibleForms?.length) throw notFound();
  },
  component: Outlet,
});
