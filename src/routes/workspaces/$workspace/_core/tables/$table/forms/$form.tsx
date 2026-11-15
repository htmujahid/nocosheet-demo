import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Navigate, notFound } from "@tanstack/react-router";

import { WorkspaceContent, WorkspaceHeader } from "@/components/layout/workspace-header";
import { FormFill } from "@/components/workspace/forms/form-fill";
import { ViewsMenu } from "@/components/workspace/views/views-menu";
import { formQueryOptions } from "@/data/workspace/forms";
import { useAccess } from "@/hooks/use-access";

export const Route = createFileRoute("/workspaces/$workspace/_core/tables/$table/forms/$form")({
  staticData: { crumb: (loaderData) => (loaderData as { name?: string } | undefined)?.name },
  loader: async ({ context, params }) => {
    const formId = Number(params.form);
    if (!Number.isInteger(formId) || formId < 1) throw notFound();

    return context.queryClient
      .query(formQueryOptions(params.workspace, Number(params.table), formId))
      .catch(() => {
        throw notFound();
      });
  },
  component: FormPage,
});

function FormPage() {
  const { workspace, table, form: formParam } = Route.useParams();
  const { data: form } = useSuspenseQuery(
    formQueryOptions(workspace, Number(table), Number(formParam)),
  );
  const access = useAccess();
  const tableId = Number(table);

  if (!access.can("create", tableId))
    return (
      <Navigate to="/workspaces/$workspace/tables/$table" params={{ workspace, table }} replace />
    );

  return (
    <>
      <WorkspaceHeader workspace={workspace}>
        <ViewsMenu workspace={workspace} table={table} activeForm={form.id} />
      </WorkspaceHeader>
      <WorkspaceContent className="max-w-2xl">
        <FormFill workspace={workspace} tableId={tableId} definition={form} />
      </WorkspaceContent>
    </>
  );
}
