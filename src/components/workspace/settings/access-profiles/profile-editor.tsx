import { useState } from "react";

import { useDbClient } from "@tanstack/react-db";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";

import { SettingsRow } from "@/components/shared/settings-row";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardFrame,
  CardFrameDescription,
  CardFrameHeader,
  CardFrameTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toastManager } from "@/components/ui/toast";
import { grantsCollection } from "@/data/workspace/access";
import {
  grantTargetsQueryOptions,
  accessProfilesQueryOptions,
  updateProfileMutationOptions,
} from "@/data/workspace/access-profiles";
import { workspaceKeys } from "@/data/workspace/keys";
import type { AccessGrant, ProfileKind } from "@/lib/access/grants";
import { grantsToMatrix, type Matrix, matrixToGrants } from "@/lib/access/matrix";

import { type GrantTarget, GrantMatrix } from "./grant-matrix";

export function ProfileEditor({ workspace, profileId }: { workspace: string; profileId: number }) {
  const queryClient = useQueryClient();
  const dbClient = useDbClient();
  const router = useRouter();
  const { data: profiles } = useSuspenseQuery(accessProfilesQueryOptions(workspace));
  const { data: targets } = useSuspenseQuery(grantTargetsQueryOptions(workspace));
  const profile = profiles.find((item) => item.id === profileId);

  if (!profile)
    return (
      <Alert variant="error">
        <AlertDescription>This access profile doesn't exist any more.</AlertDescription>
      </Alert>
    );

  return (
    <EditorForm
      key={`${profile.id}:${JSON.stringify(profile.grants)}:${profile.name}:${profile.description}`}
      workspace={workspace}
      profile={profile}
      targets={targets}
      onSaved={async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: workspaceKeys.accessProfiles() }),
          dbClient.collection(grantsCollection).utils.refetch(),
          router.invalidate(),
        ]);
      }}
    />
  );
}

function EditorForm({
  workspace,
  profile,
  targets,
  onSaved,
}: {
  workspace: string;
  profile: {
    id: number;
    name: string;
    description: string | null;
    isSystem: boolean;
    isDefault: boolean;
    kind: ProfileKind;
    memberCount: number;
    grants: AccessGrant[];
  };
  targets: GrantTarget[];
  onSaved: () => Promise<unknown>;
}) {
  const initialGrants = profile.grants;
  const [name, setName] = useState(profile.name);
  const [description, setDescription] = useState(profile.description ?? "");
  const [isDefault, setIsDefault] = useState(profile.isDefault);
  const [matrix, setMatrix] = useState<Matrix>(() => grantsToMatrix(initialGrants));

  const grants = matrixToGrants(matrix);
  const dirty =
    name !== profile.name ||
    description !== (profile.description ?? "") ||
    isDefault !== profile.isDefault ||
    JSON.stringify(grants) !== JSON.stringify(matrixToGrants(grantsToMatrix(initialGrants)));

  const save = useMutation({
    ...updateProfileMutationOptions,
    onSuccess: async () => {
      await onSaved();
      toastManager.add({ type: "success", title: "Access profile saved" });
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <CardFrame>
        <CardFrameHeader>
          <div className="flex items-center gap-2">
            <CardFrameTitle>{profile.name}</CardFrameTitle>
            {profile.isSystem && (
              <Badge variant="secondary" size="sm">
                Built-in
              </Badge>
            )}
          </div>
          <CardFrameDescription>
            {profile.kind === "authenticated"
              ? "Applies to every signed-in member, on top of their own profile. A table setting here is used unless the member's profile sets that table itself."
              : `${profile.memberCount} ${profile.memberCount === 1 ? "member has" : "members have"} this profile.`}
          </CardFrameDescription>
        </CardFrameHeader>
        <Card>
          <SettingsRow
            title="Name"
            description={
              profile.isSystem ? "Built-in profiles can't be renamed." : "How the profile is shown."
            }
          >
            <Input
              aria-label="Profile name"
              value={name}
              disabled={profile.isSystem}
              onChange={(event) => setName(event.target.value)}
            />
          </SettingsRow>
          <SettingsRow title="Description" description="What this profile is for.">
            <Textarea
              aria-label="Profile description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </SettingsRow>
          {profile.kind === "custom" && (
            <SettingsRow
              title="Default profile"
              description="Given to members who have no profile of their own, including new ones."
            >
              <div>
                <Switch
                  aria-label="Default profile"
                  checked={isDefault}
                  disabled={profile.isDefault}
                  onCheckedChange={setIsDefault}
                />
              </div>
            </SettingsRow>
          )}
        </Card>
      </CardFrame>

      <GrantMatrix matrix={matrix} targets={targets} onChange={setMatrix} />

      {save.error && (
        <Alert variant="error">
          <AlertDescription>{save.error.message}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-end gap-2">
        <Button
          variant="ghost"
          disabled={!dirty || save.isPending}
          onClick={() => {
            setName(profile.name);
            setDescription(profile.description ?? "");
            setIsDefault(profile.isDefault);
            setMatrix(grantsToMatrix(initialGrants));
            save.reset();
          }}
        >
          Discard changes
        </Button>
        <Button
          disabled={!dirty || name.trim() === ""}
          loading={save.isPending}
          onClick={() =>
            save.mutate({
              workspace,
              id: profile.id,
              values: {
                ...(name.trim() !== profile.name ? { name: name.trim() } : {}),
                description: description.trim() || null,
                ...(isDefault && !profile.isDefault ? { isDefault: true } : {}),
                grants,
              },
            })
          }
        >
          Save changes
        </Button>
      </div>
    </div>
  );
}
