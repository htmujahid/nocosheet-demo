import { Link } from "@tanstack/react-router";

import { ArrowLeftIcon } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavBack({ workspace }: { workspace: string }) {
  return (
    <SidebarGroup className="mt-auto">
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="sm"
              tooltip="Back to app"
              render={
                <Link
                  to="/workspaces/$workspace"
                  params={{ workspace }}
                  viewTransition={{ types: ["sidebar-back"] }}
                />
              }
            >
              <ArrowLeftIcon />
              <span>Back to app</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
