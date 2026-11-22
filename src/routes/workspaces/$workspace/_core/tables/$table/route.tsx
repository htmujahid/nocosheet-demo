import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";

import { tablesCollection } from "@/data/workspace/tables";

export const Route = createFileRoute("/workspaces/$workspace/_core/tables/$table")({
  staticData: { crumb: (loaderData) => (loaderData as { name?: string } | undefined)?.name },
  beforeLoad: ({ params }) => {
    const id = Number(params.table);
    if (!Number.isInteger(id) || id < 1) throw notFound();
  },
  loader: async ({ context, params }) => {
    const tables = context.dbClient.collection(tablesCollection);
    await tables.preload();
    const table = tables.get(Number(params.table));
    if (!table) throw notFound();
    await context.offline.ensure(table.id);
    return { name: table.name };
  },
  component: Outlet,
});
