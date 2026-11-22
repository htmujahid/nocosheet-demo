import { useMemo, useState } from "react";

import { eq, useDbClient, useLiveQuery, useLiveSuspenseQuery } from "@tanstack/react-db";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { notFound } from "@tanstack/react-router";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  ComboboxValue,
} from "@/components/ui/combobox";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { IconPicker } from "@/components/workspace/tables/icon-picker";
import { columnsCollection } from "@/data/workspace/columns";
import { tablesCollection } from "@/data/workspace/tables";
import {
  createViewMutationOptions,
  updateViewMutationOptions,
  viewsCollection,
} from "@/data/workspace/views";
import type { FilterCondition } from "@/lib/records/filters";
import { formSchema } from "@/lib/tables/form";
import { viewInputSchema, viewPatchSchema, type ViewInput } from "@/lib/views/validation";

import { buildViewerColumns } from "../records/columns";
import { FilterBuilder, filterErrors } from "../records/filter-builder";

export type ViewSummary = {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
};

type ViewDraft = {
  icon: string | null;
  name: string;
  description: string;
  selectColumns: string[];
  filters: FilterCondition[];
};

const draftOf = (view?: ViewSummary): ViewDraft => ({
  icon: view?.icon ?? null,
  name: view?.name ?? "",
  description: view?.description ?? "",
  selectColumns: [],
  filters: [],
});

export function ViewDialog({
  workspace,
  tableId,
  open,
  onOpenChange,
  view,
}: {
  workspace: string;
  tableId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  view?: ViewSummary;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{view ? "Edit view" : "Create a view"}</DialogTitle>
          <DialogDescription>
            {view
              ? "A view's columns and filters can't change. Delete it and create a new one to change them."
              : "A view shows a chosen set of columns and only the records that match its filters. It can't be edited afterwards."}
          </DialogDescription>
        </DialogHeader>
        <ViewForm
          workspace={workspace}
          tableId={tableId}
          view={view}
          onSaved={() => onOpenChange(false)}
        />
      </DialogPopup>
    </Dialog>
  );
}

function ViewForm({
  workspace,
  tableId,
  view,
  onSaved,
}: {
  workspace: string;
  tableId: number;
  view?: ViewSummary;
  onSaved: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const dbClient = useDbClient();
  const viewRows = dbClient.collection(viewsCollection(tableId));
  const { data: table } = useLiveSuspenseQuery((q) =>
    q
      .from({ table: tablesCollection })
      .where(({ table }) => eq(table.id, tableId))
      .findOne(),
  );
  if (!table) throw notFound();
  const { data: tableColumns } = useLiveSuspenseQuery((q) =>
    q.from({ column: columnsCollection(tableId) }).orderBy(({ column }) => column.position),
  );
  const { data: views } = useLiveQuery((q) => q.from({ view: viewsCollection(tableId) }));
  const createView = useMutation(createViewMutationOptions);
  const updateView = useMutation(updateViewMutationOptions);

  const columns = useMemo(
    () => buildViewerColumns({ titleColumnId: table.titleColumnId, columns: tableColumns }),
    [table.titleColumnId, tableColumns],
  );
  const userColumns = useMemo(
    () => columns.filter((column) => tableColumns.some((item) => item.columnName === column.key)),
    [columns, tableColumns],
  );
  const items = useMemo(
    () => userColumns.map((column) => ({ value: column.key, label: column.name })),
    [userColumns],
  );

  const taken = useMemo(
    () =>
      (views ?? []).filter((item) => item.id !== view?.id).map((item) => item.name.toLowerCase()),
    [views, view],
  );
  const schema = useMemo(
    () =>
      (view ? viewPatchSchema : viewInputSchema).superRefine((value, ctx) => {
        if (taken.includes(value.name.toLowerCase()))
          ctx.addIssue({
            code: "custom",
            path: ["name"],
            message: "A view with this name already exists",
          });
      }),
    [taken],
  );

  const form = useForm({
    defaultValues: draftOf(view),
    validators: { onSubmit: formSchema<ViewDraft>(schema) },
    onSubmit: async ({ value }) => {
      setError(null);
      const values: ViewInput = { ...value, name: value.name.trim() };
      try {
        if (view) {
          const updated = await updateView.mutateAsync({
            workspace,
            tableId,
            viewId: view.id,
            icon: values.icon,
            name: values.name,
            description: values.description,
          });
          viewRows.utils.writeUpsert(updated);
        } else {
          const created = await createView.mutateAsync({ workspace, tableId, ...values });
          viewRows.utils.writeUpsert(created);
        }
        onSaved();
      } catch (failure) {
        setError(failure instanceof Error ? failure.message : "Something went wrong");
      }
    },
  });

  return (
    <>
      <DialogPanel>
        <Form
          id="view-form"
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <div className="flex items-start gap-3">
            <form.Field name="icon">
              {(field) => (
                <Field name={field.name} className="w-auto">
                  <FieldLabel>Icon</FieldLabel>
                  <IconPicker
                    label="View icon"
                    value={field.state.value}
                    onChange={field.handleChange}
                  />
                </Field>
              )}
            </form.Field>
            <form.Field name="name">
              {(field) => (
                <Field
                  name={field.name}
                  className="flex-1"
                  invalid={field.state.meta.isTouched && !field.state.meta.isValid}
                >
                  <FieldLabel>Name</FieldLabel>
                  <Input
                    autoFocus
                    autoComplete="off"
                    placeholder="Active clients"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                  <FieldError match={field.state.meta.isTouched && !field.state.meta.isValid}>
                    {field.state.meta.errors.map((item) => item?.message).join(", ")}
                  </FieldError>
                </Field>
              )}
            </form.Field>
          </div>

          <form.Field name="description">
            {(field) => (
              <Field name={field.name}>
                <FieldLabel>Description</FieldLabel>
                <Textarea
                  placeholder="Optional"
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
              </Field>
            )}
          </form.Field>

          {!view && (
            <>
              <form.Field name="selectColumns">
                {(field) => (
                  <Field
                    name={field.name}
                    invalid={field.state.meta.isTouched && !field.state.meta.isValid}
                  >
                    <FieldLabel>Columns</FieldLabel>
                    <Combobox
                      multiple
                      items={items}
                      value={items.filter((item) => field.state.value.includes(item.value))}
                      onValueChange={(next) => field.handleChange(next.map((item) => item.value))}
                    >
                      <ComboboxChips>
                        <ComboboxValue>
                          {(picked: { value: string; label: string }[]) => (
                            <>
                              {picked.map((item) => (
                                <ComboboxChip aria-label={item.label} key={item.value}>
                                  {item.label}
                                </ComboboxChip>
                              ))}
                              <ComboboxChipsInput
                                aria-label="Columns"
                                placeholder={picked.length > 0 ? undefined : "Pick columns"}
                                onBlur={field.handleBlur}
                              />
                            </>
                          )}
                        </ComboboxValue>
                      </ComboboxChips>
                      <ComboboxPopup>
                        <ComboboxEmpty>No columns found.</ComboboxEmpty>
                        <ComboboxList>
                          {(item: { value: string; label: string }) => (
                            <ComboboxItem key={item.value} value={item}>
                              {item.label}
                            </ComboboxItem>
                          )}
                        </ComboboxList>
                      </ComboboxPopup>
                    </Combobox>
                    <FieldDescription>The columns this view shows.</FieldDescription>
                    <FieldError match={field.state.meta.isTouched && !field.state.meta.isValid}>
                      {field.state.meta.errors.map((item) => item?.message).join(", ")}
                    </FieldError>
                  </Field>
                )}
              </form.Field>

              <form.Field name="filters">
                {(field) => (
                  <Field name={field.name}>
                    <FieldLabel>Filters</FieldLabel>
                    <FilterBuilder
                      columns={userColumns}
                      value={field.state.value}
                      onChange={field.handleChange}
                    />
                    <FieldDescription>
                      Only records matching these conditions belong to the view.
                    </FieldDescription>
                  </Field>
                )}
              </form.Field>
            </>
          )}
        </Form>
        {error && (
          <Alert variant="error" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </DialogPanel>
      <DialogFooter>
        <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
        <form.Subscribe
          selector={(state) => ({
            submitting: state.isSubmitting,
            invalid: filterErrors(userColumns, state.values.filters).some(Boolean),
          })}
        >
          {({ submitting, invalid }) => (
            <Button type="submit" form="view-form" loading={submitting} disabled={invalid}>
              {view ? "Save" : "Create view"}
            </Button>
          )}
        </form.Subscribe>
      </DialogFooter>
    </>
  );
}
