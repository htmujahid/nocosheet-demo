import { LayoutGridIcon, TextAlignStartIcon } from "lucide-react";

import { SettingsRow } from "@/components/shared/settings-row";
import {
  Card,
  CardFrame,
  CardFrameDescription,
  CardFrameHeader,
  CardFrameTitle,
} from "@/components/ui/card";
import type { Matrix } from "@/lib/roles/matrix";
import {
  ACTIONS,
  type Action,
  FORM_ACTIONS,
  PERMISSION_LABELS,
} from "@/lib/roles/permissions";

import { OverrideCard } from "./override-card";
import { ScopeSelect, type ScopeValue } from "./scope-select";

const DESCRIPTIONS: Record<Action, string> = {
  create: "Add new records.",
  read: "See records and open their details.",
  update: "Change the values of records.",
  delete: "Move records to the trash.",
  export: "Download records as a CSV file.",
};

export type GrantTarget = {
  id: number;
  name: string;
  icon: string | null;
  views: { id: number; name: string; icon: string | null }[];
  forms: { id: number; name: string; icon: string | null }[];
};

export function PermissionMatrix({
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
          <CardFrameTitle>Workspace-wide permissions</CardFrameTitle>
          <CardFrameDescription>
            What this role can do in every table, unless a table, view or form below says
            otherwise. Changing table structure is always for administrators only.
          </CardFrameDescription>
        </CardFrameHeader>
        <Card>
          {ACTIONS.map((action) => (
            <SettingsRow
              key={action}
              title={PERMISSION_LABELS[action]}
              description={DESCRIPTIONS[action]}
            >
              <ScopeSelect
                action={action}
                label={PERMISSION_LABELS[action]}
                value={matrix.workspace[action]}
                onValueChange={(value) => setWorkspace(action, value)}
              />
            </SettingsRow>
          ))}
        </Card>
      </CardFrame>

      <OverrideCard
        title="Table overrides"
        description='Give this role different permissions for specific tables. Anything left on "Same as workspace" follows the settings above.'
        addLabel="Add a table"
        emptyLabel={
          targets.length === 0
            ? "There are no tables yet. Create a table to set permissions for it."
            : "No table overrides yet. Use Add a table to give this role different permissions for a table."
        }
        items={targets}
        matrix={matrix}
        actions={ACTIONS}
        inheritLabel="Same as workspace"
        onChange={onChange}
      />

      <OverrideCard
        title="View overrides"
        description='What this role can do through a view. A view only shows its own columns and records. Anything left on "Same as table" follows the table.'
        addLabel="Add a view"
        emptyLabel={
          views.length === 0
            ? "There are no views yet. Create a view to set permissions for it."
            : "No view overrides yet. Use Add a view to give this role different permissions through a view."
        }
        items={views}
        matrix={matrix}
        actions={ACTIONS}
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
            ? "There are no forms yet. Create a form to set permissions for it."
            : "No form overrides yet. Use Add a form to let this role fill in a form."
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
