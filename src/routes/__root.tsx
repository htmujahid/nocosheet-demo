import { Suspense, lazy } from "react";

import type { QueryClient } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";

import { NuqsAdapter } from "nuqs/adapters/tanstack-router";

import { ToastProvider } from "@/components/ui/toast";
import { sessionQueryOptions } from "@/data/auth/session";

// Only included in dev builds; tree-shaken from production.
const Devtools = import.meta.env.DEV ? lazy(() => import("@/components/devtools")) : null;

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  beforeLoad: async ({ context }) => ({
    session: await context.queryClient.query(sessionQueryOptions),
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <ToastProvider>
      <NuqsAdapter>
        <Outlet />
      </NuqsAdapter>
      {Devtools && (
        <Suspense fallback={null}>
          <Devtools />
        </Suspense>
      )}
    </ToastProvider>
  );
}
