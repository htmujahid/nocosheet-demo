import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";

import { AuthBrandPanel } from "@/components/auth/auth-brand-panel";
import { Logo } from "@/components/brand/logo";
import { Card, CardPanel } from "@/components/ui/card";
import { setupStatusQueryOptions } from "@/data/auth/setup-status";
import { authSearchSchema } from "@/lib/auth/redirect";
import { requireOnline } from "@/lib/require-online";

export const Route = createFileRoute("/auth")({
  validateSearch: authSearchSchema,
  beforeLoad: async ({ context, location, search }) => {
    requireOnline(location);
    if (context.session) throw redirect({ href: search.redirect ?? "/" });

    // First run: no users yet, so every auth page funnels into setup, and setup closes afterwards.
    const { needsSetup } = await context.queryClient.query(setupStatusQueryOptions);
    const onSetupPage = location.pathname === "/auth/setup";
    if (needsSetup && !onSetupPage) throw redirect({ to: "/auth/setup", search });
    if (!needsSetup && onSetupPage) throw redirect({ to: "/auth/sign-in", search });
  },
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 md:max-w-4xl">
        <Link to="/" aria-label="Nocosheet home">
          <Logo className="text-xl" />
        </Link>
        <Card className="w-full overflow-hidden">
          <CardPanel className="grid p-0 md:grid-cols-2">
            <main className="flex flex-col justify-center gap-8 p-6 md:p-10">
              <Outlet />
            </main>
            <AuthBrandPanel />
          </CardPanel>
        </Card>
      </div>
    </div>
  );
}
