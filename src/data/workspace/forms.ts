import { mutationOptions, queryOptions } from "@tanstack/react-query";

import { fetch } from "void/client";

import type { FormInput } from "@/lib/forms/validation";

import { unwrapFetch } from "./api-error";
import { workspaceKeys } from "./keys";

/** Every form of a table the user can fill in; `limit` caps how many come back. */
export const formsQueryOptions = (workspace: string, tableId: number, limit?: number) =>
  queryOptions({
    queryKey: limit ? [...workspaceKeys.forms(tableId), "limit", limit] : workspaceKeys.forms(tableId),
    queryFn: () =>
      unwrapFetch(
        fetch("/api/workspaces/:workspace/tables/:table/forms", {
          params: { workspace, table: String(tableId) },
          query: limit ? { limit } : {},
        }),
      ),
    staleTime: 30_000,
    retry: false,
  });

export const formQueryOptions = (workspace: string, tableId: number, formId: number) =>
  queryOptions({
    queryKey: workspaceKeys.form(tableId, formId),
    queryFn: () =>
      unwrapFetch(
        fetch("/api/workspaces/:workspace/tables/:table/forms/:form", {
          params: { workspace, table: String(tableId), form: String(formId) },
        }),
      ),
    staleTime: 30_000,
    retry: false,
  });

export const createFormMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("create-form"),
  mutationFn: ({
    workspace,
    tableId,
    ...values
  }: { workspace: string; tableId: number } & FormInput) =>
    unwrapFetch(
      fetch("/api/workspaces/:workspace/tables/:table/forms", {
        method: "POST",
        params: { workspace, table: String(tableId) },
        body: values,
      }),
    ),
});

export const updateFormMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("update-form"),
  mutationFn: ({
    workspace,
    tableId,
    formId,
    ...values
  }: { workspace: string; tableId: number; formId: number } & FormInput) =>
    unwrapFetch(
      fetch("/api/workspaces/:workspace/tables/:table/forms/:form", {
        method: "PATCH",
        params: { workspace, table: String(tableId), form: String(formId) },
        body: values,
      }),
    ),
});

export const deleteFormMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("delete-form"),
  mutationFn: ({
    workspace,
    tableId,
    formId,
  }: {
    workspace: string;
    tableId: number;
    formId: number;
  }) =>
    unwrapFetch(
      fetch("/api/workspaces/:workspace/tables/:table/forms/:form", {
        method: "DELETE",
        params: { workspace, table: String(tableId), form: String(formId) },
      }),
    ),
});

export const submitFormMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("submit-form"),
  mutationFn: ({
    workspace,
    tableId,
    formId,
    values,
  }: {
    workspace: string;
    tableId: number;
    formId: number;
    values: Record<string, unknown>;
  }) =>
    unwrapFetch(
      fetch("/api/workspaces/:workspace/tables/:table/forms/:form/records", {
        method: "POST",
        params: { workspace, table: String(tableId), form: String(formId) },
        body: { values },
      }),
    ),
});

export const deleteFormsMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("delete-forms"),
  mutationFn: ({
    workspace,
    tableId,
    ids,
  }: {
    workspace: string;
    tableId: number;
    ids: number[];
  }) =>
    unwrapFetch(
      fetch("/api/workspaces/:workspace/tables/:table/forms", {
        method: "DELETE",
        params: { workspace, table: String(tableId) },
        body: { ids },
      }),
    ),
});

export const deletedFormsQueryOptions = (workspace: string, tableId: number) =>
  queryOptions({
    queryKey: workspaceKeys.formsTrash(tableId),
    queryFn: () =>
      unwrapFetch(
        fetch("/api/workspaces/:workspace/tables/:table/forms/trash", {
          params: { workspace, table: String(tableId) },
        }),
      ),
    staleTime: 15_000,
    retry: false,
  });

export const restoreFormMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("restore-form"),
  mutationFn: ({
    workspace,
    tableId,
    formId,
  }: {
    workspace: string;
    tableId: number;
    formId: number;
  }) =>
    unwrapFetch(
      fetch("/api/workspaces/:workspace/tables/:table/forms/:form/trash/restore", {
        method: "POST",
        params: { workspace, table: String(tableId), form: String(formId) },
      }),
    ),
});

export const purgeFormMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("purge-form"),
  mutationFn: ({
    workspace,
    tableId,
    formId,
  }: {
    workspace: string;
    tableId: number;
    formId: number;
  }) =>
    unwrapFetch(
      fetch("/api/workspaces/:workspace/tables/:table/forms/:form/trash", {
        method: "DELETE",
        params: { workspace, table: String(tableId), form: String(formId) },
      }),
    ),
});
