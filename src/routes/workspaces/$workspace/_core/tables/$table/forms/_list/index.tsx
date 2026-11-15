import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/workspaces/$workspace/_core/tables/$table/forms/_list/")({
  component: () => null,
});
