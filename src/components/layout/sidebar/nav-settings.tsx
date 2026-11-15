import { Link } from "@tanstack/react-router";

import {
  CreditCardIcon,
  KeyRoundIcon,
  PaletteIcon,
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

const items = [
  {
    to: "/workspaces/$workspace/settings",
    label: "General",
    icon: SlidersHorizontalIcon,
    path: "",
    exact: true,
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
    to: "/workspaces/$workspace/settings/billing",
    label: "Billing",
    icon: CreditCardIcon,
    path: "/billing",
  },
  {
    to: "/workspaces/$workspace/settings/appearance",
    label: "Appearance",
    icon: PaletteIcon,
    path: "/appearance",
  },
  { to: "/workspaces/$workspace/settings/api", label: "API", icon: KeyRoundIcon, path: "/api" },
] as const;

export function NavSettings({ workspace }: { workspace: string }) {
  const isActive = useIsActivePath();

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
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
