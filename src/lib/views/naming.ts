import { newKey } from "../tables/naming";

export const newViewName = () => newKey("v");

export const physicalViewName = (workspace: string, viewName: string) =>
  `${workspace}__${viewName}`;

export const filteredViewSource = (
  workspace: string,
  view?: { viewName: string; whereExpression: string | null },
) => (view?.whereExpression ? physicalViewName(workspace, view.viewName) : undefined);
