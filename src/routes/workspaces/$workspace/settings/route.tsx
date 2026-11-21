import { createFileRoute, Outlet } from "@tanstack/react-router";

import { ImpersonationBanner } from "@/components/layout/impersonation-banner";
import { ReadonlyFieldset } from "@/components/layout/readonly-fieldset";
import { SettingsSidebar } from "@/components/layout/settings-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { readSidebarDefaultOpen } from "@/hooks/use-preferences";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/workspaces/$workspace/settings")({
  staticData: { crumb: "Settings" },
  component: SettingsLayout,
});

function SettingsLayout() {
  const { workspace } = Route.useParams();
  const session = useSession();

  return (
    <SidebarProvider defaultOpen={readSidebarDefaultOpen()}>
      <SettingsSidebar workspace={workspace} user={session!.user} />
      <SidebarInset>
        <ImpersonationBanner />
        <ReadonlyFieldset className="flex-1 gap-0">
          <Outlet />
        </ReadonlyFieldset>
      </SidebarInset>
    </SidebarProvider>
  );
}
