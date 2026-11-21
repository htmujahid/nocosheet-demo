import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { AccountTabs } from "@/components/account/account-tabs";
import { AppHeader } from "@/components/layout/app-header";
import { ReadonlyFieldset } from "@/components/layout/readonly-fieldset";
import { accountsQueryOptions } from "@/data/auth/accounts";
import { requireOnline } from "@/lib/require-online";

export const Route = createFileRoute("/account")({
  beforeLoad: ({ context, location }) => {
    requireOnline(location);
    if (!context.session)
      throw redirect({ to: "/auth/sign-in", search: { redirect: location.href } });
  },
  loader: ({ context }) => {
    void context.queryClient
      .query({ ...accountsQueryOptions, staleTime: "static" })
      .catch(() => undefined);
  },
  component: AccountLayout,
});

function AccountLayout() {
  return (
    <div className="flex min-h-svh flex-col">
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-6">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h1 className="font-semibold text-2xl tracking-tight">Account Settings</h1>
            <p className="text-muted-foreground text-sm">
              Update your profile, security and devices.
            </p>
          </div>
          <AccountTabs />
          <ReadonlyFieldset>
            <Outlet />
          </ReadonlyFieldset>
        </div>
      </main>
    </div>
  );
}
