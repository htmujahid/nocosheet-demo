import { mutationOptions, queryOptions } from "@tanstack/react-query";

import { fetch } from "void/client";

import type { ProfileCreateInput, ProfileUpdateInput } from "@/lib/access/validation";

import { unwrapFetch } from "./api-error";
import { workspaceKeys } from "./keys";

export const accessProfilesQueryOptions = (workspace: string) =>
  queryOptions({
    queryKey: workspaceKeys.accessProfiles(),
    queryFn: () =>
      unwrapFetch(fetch("/api/workspaces/:workspace/access/profiles", { params: { workspace } })),
    staleTime: 15_000,
    retry: false,
  });

export const grantTargetsQueryOptions = (workspace: string) =>
  queryOptions({
    queryKey: [...workspaceKeys.accessProfiles(), "targets"] as const,
    queryFn: () =>
      unwrapFetch(
        fetch("/api/workspaces/:workspace/access/profiles/targets", { params: { workspace } }),
      ),
    staleTime: 15_000,
    retry: false,
  });

export const profileAssignmentsQueryOptions = (workspace: string) =>
  queryOptions({
    queryKey: workspaceKeys.profileAssignments(),
    queryFn: () =>
      unwrapFetch(
        fetch("/api/workspaces/:workspace/access/profiles/assignments", { params: { workspace } }),
      ),
    staleTime: 15_000,
    retry: false,
  });

export const createProfileMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("create-access-profile"),
  mutationFn: ({ workspace, ...body }: { workspace: string } & ProfileCreateInput) =>
    unwrapFetch(
      fetch("/api/workspaces/:workspace/access/profiles", {
        method: "POST",
        params: { workspace },
        body,
      }),
    ),
});

export const updateProfileMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("update-access-profile"),
  mutationFn: ({
    workspace,
    id,
    values,
  }: {
    workspace: string;
    id: number;
    values: ProfileUpdateInput;
  }) =>
    unwrapFetch(
      fetch("/api/workspaces/:workspace/access/profiles/:profile", {
        method: "PATCH",
        params: { workspace, profile: String(id) },
        body: values,
      }),
    ),
});

export const deleteProfileMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("delete-access-profile"),
  mutationFn: ({ workspace, id }: { workspace: string; id: number }) =>
    unwrapFetch(
      fetch("/api/workspaces/:workspace/access/profiles/:profile", {
        method: "DELETE",
        params: { workspace, profile: String(id) },
      }),
    ),
});

export const assignProfileMutationOptions = mutationOptions({
  mutationKey: workspaceKeys.mutation("assign-access-profile"),
  mutationFn: ({
    workspace,
    userId,
    profileId,
  }: {
    workspace: string;
    userId: string;
    profileId: number;
  }) =>
    unwrapFetch(
      fetch("/api/workspaces/:workspace/access/profiles/assignments", {
        method: "PUT",
        params: { workspace },
        body: { userId, profileId },
      }),
    ),
});
