import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/workspaces/$workspace/settings/access")({
  staticData: { crumb: "Access" },
  component: Outlet,
});
