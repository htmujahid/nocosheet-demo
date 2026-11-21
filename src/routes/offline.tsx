import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { WifiOffIcon } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

const searchSchema = z.object({
  redirect: z
    .unknown()
    .transform((value) =>
      typeof value === "string" &&
      value.startsWith("/") &&
      !value.startsWith("//") &&
      !value.includes("\\") &&
      !value.startsWith("/offline")
        ? value
        : undefined,
    )
    .optional(),
});

export const Route = createFileRoute("/offline")({
  validateSearch: searchSchema,
  component: OfflinePage,
});

function OfflinePage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();

  return (
    <Empty className="min-h-svh">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <WifiOffIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>You're offline</EmptyTitle>
        <EmptyDescription>
          Signing in and your account need a connection. Reconnect and try again.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={() => void navigate({ href: redirect ?? "/" })}>Try again</Button>
      </EmptyContent>
    </Empty>
  );
}
