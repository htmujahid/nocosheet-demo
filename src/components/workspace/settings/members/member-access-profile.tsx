import { useDbClient } from "@tanstack/react-db";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";

import { SettingsRow } from "@/components/shared/settings-row";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardFrame,
  CardFrameDescription,
  CardFrameHeader,
  CardFrameTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toastManager } from "@/components/ui/toast";
import { grantsCollection } from "@/data/workspace/access";
import {
  assignProfileMutationOptions,
  profileAssignmentsQueryOptions,
  accessProfilesQueryOptions,
} from "@/data/workspace/access-profiles";
import { workspaceKeys } from "@/data/workspace/keys";
import { isAdmin } from "@/lib/auth/access";
import { DEFAULT_WORKSPACE } from "@/lib/workspace";

export function MemberAccessProfile({
  userId,
  name,
  role,
}: {
  userId: string;
  name: string;
  role?: string | null;
}) {
  const queryClient = useQueryClient();
  const dbClient = useDbClient();
  const router = useRouter();
  const { data: profiles } = useQuery(accessProfilesQueryOptions(DEFAULT_WORKSPACE));
  const { data: assignments } = useQuery(profileAssignmentsQueryOptions(DEFAULT_WORKSPACE));

  const assign = useMutation({
    ...assignProfileMutationOptions,
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: workspaceKeys.accessProfiles() }),
        dbClient.collection(grantsCollection).utils.refetch(),
        router.invalidate(),
      ]);
      const label = profiles?.find((item) => item.id === variables.profileId)?.name;
      toastManager.add({
        type: "success",
        title: label ? `${name} now has the ${label} profile` : "Access profile updated",
      });
    },
    onError: (error) =>
      toastManager.add({
        type: "error",
        title: "Couldn't change the access profile",
        description: error.message,
      }),
  });

  const admin = isAdmin({ role });
  const items = (profiles ?? [])
    .filter((item) => item.kind === "custom")
    .map((item) => ({ value: String(item.id), label: item.name }));
  const current =
    assignments?.find((item) => item.userId === userId)?.profileId ??
    profiles?.find((item) => item.isDefault)?.id;

  return (
    <CardFrame>
      <CardFrameHeader>
        <CardFrameTitle>Access profile</CardFrameTitle>
        <CardFrameDescription>
          What this member can do with records. Administrators ignore access profiles.
        </CardFrameDescription>
      </CardFrameHeader>
      <Card>
        <SettingsRow
          title="Profile"
          description={
            admin
              ? "Administrators have full access to everything."
              : "Change it any time. It applies the next time they load the app."
          }
          badge={
            admin ? (
              <Badge variant="info" size="sm">
                Administrator
              </Badge>
            ) : undefined
          }
        >
          {!admin && (
            <Select
              value={current !== undefined ? String(current) : ""}
              items={items}
              disabled={!profiles || assign.isPending}
              onValueChange={(next) =>
                next &&
                assign.mutate({ workspace: DEFAULT_WORKSPACE, userId, profileId: Number(next) })
              }
            >
              <SelectTrigger aria-label="Access profile">
                <SelectValue placeholder="Loading profiles…" />
              </SelectTrigger>
              <SelectPopup>
                {items.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectPopup>
            </Select>
          )}
        </SettingsRow>
      </Card>
    </CardFrame>
  );
}
