import { createFileRoute, Link } from "@tanstack/react-router";

import { LockIcon } from "lucide-react";

import { AuthDivider } from "@/components/auth/auth-divider";
import { AuthFooter } from "@/components/auth/auth-footer";
import { AuthHeader } from "@/components/auth/auth-header";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export const Route = createFileRoute("/auth/sign-up")({
  component: SignUpPage,
});

function SignUpPage() {
  const signupEnabled = String(import.meta.env.VITE_ENABLE_SIGNUP) === "true";

  if (!signupEnabled) {
    return (
      <Empty className="p-0 md:py-0">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <LockIcon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>Sign-up is disabled</EmptyTitle>
          <EmptyDescription>
            Sign-up is invite-only. Ask an administrator to create an account for you.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" render={<Link to="/auth/sign-in" search={(prev) => prev} />}>
            Back to sign in
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <>
      <AuthHeader title="Create your account" description="Get started in a few seconds." />
      <div className="flex flex-col gap-5">
        <GoogleSignInButton />
        <AuthDivider />
        <SignUpForm />
      </div>
      <AuthFooter>
        Already have an account?{" "}
        <Link
          to="/auth/sign-in"
          search={(prev) => prev}
          className="text-foreground underline underline-offset-4"
        >
          Sign in
        </Link>
      </AuthFooter>
    </>
  );
}
