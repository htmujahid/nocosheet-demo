import { Link, useLocation } from "@tanstack/react-router";

import { LaptopIcon, ShieldIcon, UserIcon } from "lucide-react";

import { Tabs, TabsList, TabsTab } from "@/components/ui/tabs";

const tabs = [
  { to: "/workspaces/$workspace/settings/members/$userId", label: "Profile", icon: UserIcon },
  {
    to: "/workspaces/$workspace/settings/members/$userId/security",
    label: "Security",
    icon: ShieldIcon,
  },
  {
    to: "/workspaces/$workspace/settings/members/$userId/devices",
    label: "Devices",
    icon: LaptopIcon,
  },
] as const;

export function MemberTabs({ workspace, userId }: { workspace: string; userId: string }) {
  const pathname = useLocation({ select: (location) => location.pathname });
  const value =
    tabs.slice(1).find((tab) => pathname.endsWith(tab.to.slice(tab.to.lastIndexOf("/"))))?.to ??
    tabs[0].to;

  return (
    <Tabs value={value}>
      <TabsList>
        {tabs.map(({ to, label, icon: Icon }) => (
          <TabsTab
            key={to}
            value={to}
            nativeButton={false}
            render={<Link to={to} params={{ workspace, userId }} />}
          >
            <Icon />
            {label}
          </TabsTab>
        ))}
      </TabsList>
    </Tabs>
  );
}
