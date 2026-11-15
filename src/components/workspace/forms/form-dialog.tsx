import { useId, useMemo, useState } from "react";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { IconPicker } from "@/components/workspace/tables/icon-picker";
import {
  createFormMutationOptions,
  formsQueryOptions,
  updateFormMutationOptions,
} from "@/data/workspace/forms";
import { workspaceKeys } from "@/data/workspace/keys";
import { tableQueryOptions } from "@/data/workspace/tables";
import { formInputSchema, type FormInput } from "@/lib/forms/validation";
import { formSchema } from "@/lib/tables/form";

import { buildViewerColumns } from "../records/columns";

export type FormSummary = {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  isOpen: boolean;
  selectColumns: string[];
};

type FormDraft = {
  icon: string | null;
  name: string;
  description: string;
  selectColumns: string[];
  isOpen: boolean;
};

export function FormDialog({
  workspace,
  tableId,
  open,
  onOpenChange,
  form,
}: {
  workspace: string;
  tableId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form?: FormSummary;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{form ? "Edit form" : "Create a form"}</DialogTitle>
          <DialogDescription>
            A form collects new records for this table through a chosen set of columns.
          </DialogDescription>
        </DialogHeader>
        <FormEditor
          workspace={workspace}
          tableId={tableId}
          form={form}
          onSaved={() => onOpenChange(false)}
        />
      </DialogPopup>
    </Dialog>
  );
}

function FormEditor({
  workspace,
  tableId,
  form: existing,
  onSaved,
}: {
  workspace: string;
  tableId: number;
  form?: FormSummary;
  onSaved: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const openId = useId();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: table } = useSuspenseQuery(tableQueryOptions(workspace, tableId));
  const { data: forms } = useQuery(formsQueryOptions(workspace, tableId));
  const createForm = useMutation(createFormMutationOptions);
  const updateForm = useMutation(updateFormMutationOptions);

  const fillable = useMemo(
    () =>
      buildViewerColumns(table).filter(
        (column) =>
          !column.readOnly && table.columns.some((item) => item.columnName === column.key),
      ),
    [table],
  );
  const items = useMemo(
    () => fillable.map((column) => ({ value: column.key, label: column.name })),
    [fillable],
  );

  const taken = useMemo(
    () =>
      (forms ?? [])
        .filter((item) => item.id !== existing?.id)
        .map((item) => item.name.toLowerCase()),
    [forms, existing],
  );
  const schema = useMemo(
    () =>
      formInputSchema.superRefine((value, ctx) => {
        if (taken.includes(value.name.toLowerCase()))
          ctx.addIssue({
            code: "custom",
            path: ["name"],
            message: "A form with this name already exists",
          });
        const missing = fillable.find(
          (column) =>
            column.required &&
            column.defaultValue === null &&
            !value.selectColumns.includes(column.key),
        );
        if (missing)
          ctx.addIssue({
            code: "custom",
            path: ["selectColumns"],
            message: `${missing.name} is required, so the form has to include it`,
          });
      }),
    [taken, fillable],
  );

  const form = useForm({
    defaultValues: {
      icon: existing?.icon ?? null,
      name: existing?.name ?? "",
      description: existing?.description ?? "",
      selectColumns:
        existing?.selectColumns ??
        fillable
          .filter((column) => column.required && column.defaultValue === null)
          .map((column) => column.key),
      isOpen: existing?.isOpen ?? true,
    } satisfies FormDraft as FormDraft,
    validators: { onSubmit: formSchema<FormDraft>(schema) },
    onSubmit: async ({ value }) => {
      setError(null);
      const values: FormInput = { ...value, name: value.name.trim() };
      try {
        if (existing) {
          await updateForm.mutateAsync({ workspace, tableId, formId: existing.id, ...values });
          await queryClient.invalidateQueries({ queryKey: workspaceKeys.forms(tableId) });
          onSaved();
          return;
        }
        const created = await createForm.mutateAsync({ workspace, tableId, ...values });
        await queryClient.invalidateQueries({ queryKey: workspaceKeys.forms(tableId) });
        onSaved();
        void navigate({
          to: "/workspaces/$workspace/tables/$table/forms/$form",
          params: { workspace, table: String(tableId), form: String(created.id) },
        });
      } catch (failure) {
        setError(failure instanceof Error ? failure.message : "Something went wrong");
      }
    },
  });

  return (
    <>
      <DialogPanel>
        <Form
          id="form-editor"
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
                    label="Form icon"
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
                    placeholder="Support request"
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
                  value={field.state.value.flatMap((key) =>
                    items.filter((item) => item.value === key),
                  )}
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
                <FieldDescription>
                  The columns people fill in, in this order. Required columns must be included.
                </FieldDescription>
                <FieldError match={field.state.meta.isTouched && !field.state.meta.isValid}>
                  {field.state.meta.errors.map((item) => item?.message).join(", ")}
                </FieldError>
              </Field>
            )}
          </form.Field>

          <form.Field name="isOpen">
            {(field) => (
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <Label htmlFor={openId}>Accepting responses</Label>
                  <p className="text-muted-foreground text-xs">
                    Turn off to stop members from submitting this form.
                  </p>
                </div>
                <Switch
                  id={openId}
                  checked={field.state.value}
                  onCheckedChange={field.handleChange}
                />
              </div>
            )}
          </form.Field>
        </Form>
        {error && (
          <Alert variant="error" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </DialogPanel>
      <DialogFooter>
        <DialogClose render={<Button type="button" variant="ghost" />}>Cancel</DialogClose>
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(submitting) => (
            <Button type="submit" form="form-editor" loading={submitting}>
              {existing ? "Save" : "Create form"}
            </Button>
          )}
        </form.Subscribe>
      </DialogFooter>
    </>
  );
}
