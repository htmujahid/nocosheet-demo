import { useSuspenseQuery } from "@tanstack/react-query";

import { sidebarQueryOptions } from "@/data/workspace/sidebar";
import { useAccess } from "@/hooks/use-access";

import { TableShortcuts } from "./overview/table-shortcuts";
import { TeamCard } from "./overview/team-card";
import { TemplateGallery } from "./overview/template-gallery";
import { Welcome } from "./overview/welcome";
import { WorkspaceStats } from "./overview/workspace-stats";

export function WorkspaceOverview({ workspace }: { workspace: string }) {
  const { data: sidebar } = useSuspenseQuery(sidebarQueryOptions(workspace));
  const access = useAccess();
  const tables = sidebar.groups.flatMap((group) => group.tables);
  const showTemplates = access.admin && tables.length === 0;

  return (
    <div className="flex flex-col gap-8">
      <Welcome workspace={workspace} />
      <WorkspaceStats workspace={workspace} />
      {showTemplates ? (
        <TemplateGallery workspace={workspace} />
      ) : (
        <TableShortcuts workspace={workspace} tables={tables} />
      )}
      <TeamCard workspace={workspace} />
    </div>
  );
}
