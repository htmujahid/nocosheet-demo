import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound, redirect } from "@tanstack/react-router";

import { WorkspaceContent, WorkspaceHeader } from "@/components/layout/workspace-header";
import { FormActions } from "@/components/workspace/forms/form-actions";
import { FormFill } from "@/components/workspace/forms/form-fill";
import { formQueryOptions } from "@/data/workspace/forms";
import { scopeFor } from "@/lib/access/grants";
import { ALL_VIEW } from "@/lib/views/constants";

export const Route = createFileRoute("/workspaces/$workspace/_core/tables/$table/forms/$form")({
  staticData: { crumb: (loaderData) => (loaderData as { name?: string } | undefined)?.name },
  beforeLoad: ({ context, params }) => {
    if (scopeFor(context.access, "create", Number(params.table), Number(params.form)) === "none")
      throw redirect({
        to: "/workspaces/$workspace/tables/$table/views/$view",
        params: { workspace: params.workspace, table: params.table, view: ALL_VIEW },
        replace: true,
      });

    const formId = Number(params.form);
    if (!Number.isInteger(formId) || formId < 1) throw notFound();
  },
  // A form that can't be loaded is not found, so its detail is awaited.
  loader: ({ context, params }) =>
    context.queryClient
      .query(formQueryOptions(params.workspace, Number(params.table), Number(params.form)))
      .catch(() => {
        throw notFound();
      }),
  component: FormPage,
});

function FormPage() {
  const { workspace, table, form: formParam } = Route.useParams();
  const { data: form } = useSuspenseQuery(
    formQueryOptions(workspace, Number(table), Number(formParam)),
  );
  const tableId = Number(table);

  return (
    <>
      <WorkspaceHeader workspace={workspace}>
        <FormActions workspace={workspace} table={table} form={form} />
      </WorkspaceHeader>
      <WorkspaceContent className="max-w-2xl">
        <FormFill workspace={workspace} tableId={tableId} definition={form} />
      </WorkspaceContent>
    </>
  );
}
