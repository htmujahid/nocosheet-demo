import { useDbClient } from "@tanstack/react-db";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";

import { ShieldCheckIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardFrame,
  CardFrameDescription,
  CardFrameHeader,
  CardFrameTitle,
} from "@/components/ui/card";
import { toastManager } from "@/components/ui/toast";
import { ConfirmAction } from "@/components/workspace/settings/members/confirm-action";
import { grantsCollection } from "@/data/workspace/access";
import {
  deleteProfileMutationOptions,
  accessProfilesQueryOptions,
  updateProfileMutationOptions,
} from "@/data/workspace/access-profiles";
import { workspaceKeys } from "@/data/workspace/keys";

import { ProfileSummary } from "./profile-summary";

export function ProfilesList({ workspace }: { workspace: string }) {
  const queryClient = useQueryClient();
  const dbClient = useDbClient();
  const router = useRouter();
  const { data: profiles } = useSuspenseQuery(accessProfilesQueryOptions(workspace));

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: workspaceKeys.accessProfiles() }),
      dbClient.collection(grantsCollection).utils.refetch(),
      router.invalidate(),
    ]);

  const makeDefault = useMutation({
    ...updateProfileMutationOptions,
    onSuccess: async () => {
      await refresh();
      toastManager.add({ type: "success", title: "Default profile updated" });
    },
    onError: (error) =>
      toastManager.add({
        type: "error",
        title: "Couldn't change the default",
        description: error.message,
      }),
  });

  const deleteProfile = useMutation({
    ...deleteProfileMutationOptions,
    onSuccess: async () => {
      await refresh();
      toastManager.add({ type: "success", title: "Access profile deleted" });
    },
    onError: (error) =>
      toastManager.add({
        type: "error",
        title: "Couldn't delete the access profile",
        description: error.message,
      }),
  });

  return (
    <CardFrame>
      <CardFrameHeader>
        <CardFrameTitle>Access profiles</CardFrameTitle>
        <CardFrameDescription>
          An access profile decides what a member can do with records. Members without one get the
          default profile. Authenticated applies to every signed-in member on top of their own.
        </CardFrameDescription>
      </CardFrameHeader>
      <Card>
        <div className="flex items-center justify-between gap-4 p-4 not-last:border-b md:px-6">
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="size-4 text-muted-foreground" />
              <span className="font-medium text-sm">Administrator</span>
              <Badge variant="info" size="sm">
                Built-in
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              Full access to everything, including table structure. Access profiles don't apply to
              administrators.
            </p>
          </div>
        </div>
        {profiles.map((profile) => (
          <div
            key={profile.id}
            className="flex flex-col gap-3 p-4 not-last:border-b md:flex-row md:items-center md:justify-between md:px-6"
          >
            <div className="flex min-w-0 flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to="/workspaces/$workspace/settings/access/$profileId"
                  params={{ workspace, profileId: String(profile.id) }}
                  className="font-medium text-sm hover:underline"
                >
                  {profile.name}
                </Link>
                {profile.isSystem && (
                  <Badge variant="secondary" size="sm">
                    Built-in
                  </Badge>
                )}
                {profile.kind !== "custom" && (
                  <Badge variant="info" size="sm">
                    Everyone
                  </Badge>
                )}
                {profile.isDefault && (
                  <Badge variant="success" size="sm">
                    Default
                  </Badge>
                )}
                {profile.kind === "custom" && (
                  <span className="text-muted-foreground text-xs">
                    {profile.memberCount} {profile.memberCount === 1 ? "member" : "members"}
                  </span>
                )}
              </div>
              {profile.description && (
                <p className="text-muted-foreground text-sm">{profile.description}</p>
              )}
              <ProfileSummary grants={profile.grants} />
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {!profile.isDefault && profile.kind === "custom" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  loading={makeDefault.isPending && makeDefault.variables?.id === profile.id}
                  onClick={() =>
                    makeDefault.mutate({ workspace, id: profile.id, values: { isDefault: true } })
                  }
                >
                  Make default
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                render={
                  <Link
                    to="/workspaces/$workspace/settings/access/$profileId"
                    params={{ workspace, profileId: String(profile.id) }}
                  />
                }
              >
                Edit
              </Button>
              {!profile.isSystem && !profile.isDefault && (
                <ConfirmAction
                  label="Delete"
                  destructive
                  title={`Delete ${profile.name}?`}
                  description="Members can't have this profile any more. A profile that is still assigned can't be deleted."
                  confirmLabel="Delete profile"
                  pending={deleteProfile.isPending && deleteProfile.variables?.id === profile.id}
                  onConfirm={() => deleteProfile.mutateAsync({ workspace, id: profile.id })}
                />
              )}
            </div>
          </div>
        ))}
      </Card>
    </CardFrame>
  );
}
