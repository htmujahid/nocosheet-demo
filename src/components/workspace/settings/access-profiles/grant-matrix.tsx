import { SettingsRow } from "@/components/shared/settings-row";
import {
  Card,
  CardFrame,
  CardFrameDescription,
  CardFrameHeader,
  CardFrameTitle,
} from "@/components/ui/card";
import { ACTIONS, type Action, ACTION_LABELS } from "@/lib/access/grants";
import type { Matrix } from "@/lib/access/matrix";

import { OverrideCard } from "./override-card";
import { ScopeSelect, type ScopeValue } from "./scope-select";

const DESCRIPTIONS: Record<Action, string> = {
  create: "Add new records.",
  read: "See records and open their details.",
  update: "Change the values of records.",
  delete: "Move records to the trash.",
  export: "Download a whole table as a CSV file.",
};

export type GrantTarget = {
  id: number;
  name: string;
  icon: string | null;
};

export function GrantMatrix({
  matrix,
  targets,
  onChange,
}: {
  matrix: Matrix;
  targets: GrantTarget[];
  onChange: (matrix: Matrix) => void;
}) {
  const setWorkspace = (action: Action, value: ScopeValue) =>
    value !== "inherit" &&
    onChange({ ...matrix, workspace: { ...matrix.workspace, [action]: value } });

  return (
    <>
      <CardFrame>
        <CardFrameHeader>
          <CardFrameTitle>Workspace-wide access</CardFrameTitle>
          <CardFrameDescription>
            What this profile can do in every table, unless a table below says otherwise. Changing
            table structure is always for administrators only.
          </CardFrameDescription>
        </CardFrameHeader>
        <Card>
          {ACTIONS.map((action) => (
            <SettingsRow
              key={action}
              title={ACTION_LABELS[action]}
              description={DESCRIPTIONS[action]}
            >
              <ScopeSelect
                action={action}
                label={ACTION_LABELS[action]}
                value={matrix.workspace[action]}
                onValueChange={(value) => setWorkspace(action, value)}
              />
            </SettingsRow>
          ))}
        </Card>
      </CardFrame>

      <OverrideCard
        title="Table overrides"
        description='Give this profile different access to specific tables. Anything left on "Same as workspace" follows the settings above.'
        addLabel="Add a table"
        emptyLabel={
          targets.length === 0
            ? "There are no tables yet. Create a table to set access for it."
            : "No table overrides yet. Use Add a table to give this profile different access to a table."
        }
        items={targets}
        matrix={matrix}
        actions={ACTIONS}
        inheritLabel="Same as workspace"
        onChange={onChange}
      />
    </>
  );
}
