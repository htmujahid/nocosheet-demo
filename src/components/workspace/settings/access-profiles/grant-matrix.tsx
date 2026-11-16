import { LayoutGridIcon, TextAlignStartIcon } from "lucide-react";

import { SettingsRow } from "@/components/shared/settings-row";
import {
  Card,
  CardFrame,
  CardFrameDescription,
  CardFrameHeader,
  CardFrameTitle,
} from "@/components/ui/card";
import type { Matrix } from "@/lib/access/matrix";
import {
  ACTIONS,
  type Action,
  FORM_ACTIONS,
  ACTION_LABELS,
  VIEW_ACTIONS,
} from "@/lib/access/grants";

import { OverrideCard } from "./override-card";
import { ScopeSelect, type ScopeValue } from "./scope-select";

const DESCRIPTIONS: Record<Action, string> = {
  create: "Add new records.",
  read: "See records and open their details.",
  update: "Change the values of records.",
  delete: "Move records to the trash.",
  export: "Download a whole table or view as a CSV file.",
};

export type GrantTarget = {
  id: number;
  name: string;
  icon: string | null;
  views: { id: number; name: string; icon: string | null }[];
  forms: { id: number; name: string; icon: string | null }[];
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

  const views = targets.flatMap((table) =>
    table.views.map((view) => ({ ...view, group: table.name })),
  );
  const forms = targets.flatMap((table) =>
    table.forms.map((form) => ({ ...form, group: table.name })),
  );

  return (
    <>
      <CardFrame>
        <CardFrameHeader>
          <CardFrameTitle>Workspace-wide access</CardFrameTitle>
          <CardFrameDescription>
            What this profile can do in every table, unless a table, view or form below says otherwise.
            Changing table structure is always for administrators only.
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

      <OverrideCard
        title="View overrides"
        description='What this profile can do through a view. A view only shows its own columns and records. New records are always added to the table, so creating follows the table or a form. Anything left on "Same as table" follows the table.'
        addLabel="Add a view"
        emptyLabel={
          views.length === 0
            ? "There are no views yet. Create a view to set access for it."
            : "No view overrides yet. Use Add a view to give this profile different access through a view."
        }
        items={views}
        matrix={matrix}
        actions={VIEW_ACTIONS}
        inheritLabel="Same as table"
        fallback={LayoutGridIcon}
        onChange={onChange}
      />

      <OverrideCard
        title="Form overrides"
        description='Who can fill in a form. Anything left on "Same as table" follows the table. A form only ever creates records.'
        addLabel="Add a form"
        emptyLabel={
          forms.length === 0
            ? "There are no forms yet. Create a form to set access for it."
            : "No form overrides yet. Use Add a form to let this profile fill in a form."
        }
        items={forms}
        matrix={matrix}
        actions={FORM_ACTIONS}
        inheritLabel="Same as table"
        fallback={TextAlignStartIcon}
        onChange={onChange}
      />
    </>
  );
}
