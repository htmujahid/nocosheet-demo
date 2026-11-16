import { Link } from "@tanstack/react-router";

import {
  CreditCardIcon,
  KeyRoundIcon,
  PaletteIcon,
  ScrollTextIcon,
  ShieldCheckIcon,
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

const items = [
  {
    to: "/workspaces/$workspace/settings",
    label: "General",
    icon: SlidersHorizontalIcon,
    path: "",
    exact: true,
  },
  {
    to: "/workspaces/$workspace/settings/appearance",
    label: "Appearance",
    icon: PaletteIcon,
    path: "/appearance",
  },
  {
    to: "/workspaces/$workspace/settings/members",
    label: "Members",
    icon: UsersIcon,
    path: "/members",
  },
  {
    to: "/workspaces/$workspace/settings/role",
    label: "Role & Permissions",
    icon: ShieldCheckIcon,
    path: "/role",
  },
  {
    to: "/workspaces/$workspace/settings/api",
    label: "API Keys",
    icon: KeyRoundIcon,
    path: "/api",
  },
  {
    to: "/workspaces/$workspace/settings/audit-log",
    label: "Audit Log",
    icon: ScrollTextIcon,
    path: "/audit-log",
    adminOnly: true,
  },
  {
    to: "/workspaces/$workspace/settings/billing",
    label: "Billing",
    icon: CreditCardIcon,
    path: "/billing",
  },
] as const;

export function NavSettings({ workspace }: { workspace: string }) {
  const isActive = useIsActivePath();
  const { isAdmin } = useWorkspace();

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {items
            .filter((item) => isAdmin || !("adminOnly" in item))
            .map((item) => (
              <SidebarMenuItem key={item.to}>
                <SidebarMenuButton
                  tooltip={item.label}
                  isActive={isActive(
                    `/workspaces/${workspace}/settings${item.path}`,
                    "exact" in item && item.exact,
                  )}
                  render={<Link to={item.to} params={{ workspace }} />}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
