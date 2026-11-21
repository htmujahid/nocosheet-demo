import {
  ACTIONS,
  type Action,
  actionOf,
  grantFor,
  isScopedAction,
  levelOf,
  ACTION_LABELS,
  type AccessGrant,
  type Scope,
} from "./grants";

export type Matrix = {
  workspace: Record<Action, Scope>;
  tables: Record<number, Partial<Record<Action, Scope>>>;
};

export function grantsToMatrix(grants: AccessGrant[]): Matrix {
  const workspace = Object.fromEntries(
    ACTIONS.map((action) => [action, levelOf(grants, null, action) ?? "none"]),
  ) as Record<Action, Scope>;

  const tables: Matrix["tables"] = {};
  for (const entry of grants) {
    if (entry.resourceId === null) continue;
    const action = actionOf(entry.grant);
    const row = (tables[entry.resourceId] ??= {});
    row[action] = levelOf([entry], entry.resourceId, action) ?? "none";
  }

  return { workspace, tables };
}

export function matrixToGrants(matrix: Matrix): AccessGrant[] {
  const grants: AccessGrant[] = [];

  for (const action of ACTIONS) {
    const scope = matrix.workspace[action];
    if (scope !== "none") grants.push({ resourceId: null, grant: grantFor(action, scope) });
  }

  for (const [id, cells] of Object.entries(matrix.tables))
    for (const action of ACTIONS) {
      const scope = cells[action];
      if (scope !== undefined)
        grants.push({ resourceId: Number(id), grant: grantFor(action, scope) });
    }

  return grants;
}

export function scopeLabel(action: Action, scope: Scope) {
  if (!isScopedAction(action)) return scope === "none" ? "Not allowed" : "Allowed";
  return scope === "none" ? "None" : scope === "own" ? "Own records" : "All records";
}

export function summarizeGrants(grants: AccessGrant[], tableId: number | null = null) {
  return ACTIONS.map((action) => ({
    action,
    label: ACTION_LABELS[action],
    scope: levelOf(grants, tableId, action) ?? "none",
  }));
}
