import { Link } from "@tanstack/react-router";

import {
  CreditCardIcon,
  PaletteIcon,
  ShieldCheckIcon,
  ScrollTextIcon,
  SlidersHorizontalIcon,
  UsersIcon,
} from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useIsActivePath } from "@/hooks/use-is-active-path";
import { useWorkspace } from "@/hooks/use-workspace";

export function NavSettings({ workspace }: { workspace: string }) {
  const isActive = useIsActivePath();
  const { isAdmin } = useWorkspace();

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="General"
              isActive={isActive(`/workspaces/${workspace}/settings`, true)}
              render={<Link to="/workspaces/$workspace/settings" params={{ workspace }} />}
            >
              <SlidersHorizontalIcon />
              <span>General</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Appearance"
              isActive={isActive(`/workspaces/${workspace}/settings/appearance`)}
              render={
                <Link to="/workspaces/$workspace/settings/appearance" params={{ workspace }} />
              }
            >
              <PaletteIcon />
              <span>Appearance</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Members"
              isActive={isActive(`/workspaces/${workspace}/settings/members`)}
              render={<Link to="/workspaces/$workspace/settings/members" params={{ workspace }} />}
            >
              <UsersIcon />
              <span>Members</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {isAdmin && (
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Access"
                isActive={isActive(`/workspaces/${workspace}/settings/access`)}
                render={<Link to="/workspaces/$workspace/settings/access" params={{ workspace }} />}
              >
                <ShieldCheckIcon />
                <span>Access</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          {isAdmin && (
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Audit Log"
                isActive={isActive(`/workspaces/${workspace}/settings/audit-log`)}
                render={
                  <Link to="/workspaces/$workspace/settings/audit-log" params={{ workspace }} />
                }
              >
                <ScrollTextIcon />
                <span>Audit Log</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Billing"
              isActive={isActive(`/workspaces/${workspace}/settings/billing`)}
              render={<Link to="/workspaces/$workspace/settings/billing" params={{ workspace }} />}
            >
              <CreditCardIcon />
              <span>Billing</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
