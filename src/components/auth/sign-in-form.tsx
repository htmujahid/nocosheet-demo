import { useEffect } from "react";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";

import { z } from "zod";

import { DEMO_MODE } from "@/components/layout/readonly-fieldset";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { AuthError } from "@/data/auth/auth-error";
import { signInMutationOptions } from "@/data/auth/sign-in";
import { signInPasskeyMutationOptions } from "@/data/auth/sign-in-passkey";
import { useCompleteSignIn } from "@/hooks/use-complete-sign-in";

import { AuthErrorAlert } from "./auth-error-alert";

const DEMO_CREDENTIALS = { identifier: "admin@example.com", password: "password123" };

const schema = z.object({
  identifier: z.string().trim().min(1, "Enter your email or username"),
  password: z.string().min(1, "Password is required"),
});

export function SignInForm() {
  const completeSignIn = useCompleteSignIn();
  const navigate = useNavigate();

  const mutation = useMutation({
    ...signInMutationOptions,
    onSuccess: async (data) => {
      // Accounts with two-factor enabled get a pending challenge instead of a session.
      if ("twoFactorRedirect" in data && data.twoFactorRedirect) {
        await navigate({ to: "/auth/two-factor", search: (prev) => prev });
        return;
      }
      await completeSignIn();
    },
    onError: (error, { identifier }) => {
      if (
        error instanceof AuthError &&
        error.code === "EMAIL_NOT_VERIFIED" &&
        identifier.includes("@")
      ) {
        navigate({ to: "/auth/verify-email", search: { email: identifier } });
      }
    },
  });

  // Conditional UI: lets the browser offer saved passkeys from the email field.
  const passkeyAutofill = useMutation({
    ...signInPasskeyMutationOptions,
    onSuccess: completeSignIn,
  });
  const startAutofill = passkeyAutofill.mutate;

  useEffect(() => {
    if (typeof PublicKeyCredential === "undefined") return;
    PublicKeyCredential.isConditionalMediationAvailable?.().then((available) => {
      if (available) startAutofill({ autoFill: true });
    });
  }, [startAutofill]);

  const form = useForm({
    defaultValues:
      DEMO_MODE || import.meta.env.DEV ? DEMO_CREDENTIALS : { identifier: "", password: "" },
    validators: { onSubmit: schema },
    onSubmit: ({ value }) => mutation.mutate({ ...value, identifier: value.identifier.trim() }),
  });

  return (
    <Form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.Field name="identifier">
        {(field) => (
          <Field
            name={field.name}
            invalid={field.state.meta.isTouched && !field.state.meta.isValid}
          >
            <FieldLabel>Email or username</FieldLabel>
            <Input
              type="text"
              autoComplete="username webauthn"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
            />
            <FieldError match={field.state.meta.isTouched && !field.state.meta.isValid}>
              {field.state.meta.errors.map((error) => error?.message).join(", ")}
            </FieldError>
          </Field>
        )}
      </form.Field>
      <form.Field name="password">
        {(field) => (
          <Field
            name={field.name}
            invalid={field.state.meta.isTouched && !field.state.meta.isValid}
          >
            <div className="flex w-full items-center justify-between">
              <FieldLabel>Password</FieldLabel>
              <Link
                to="/auth/forgot-password"
                className="text-muted-foreground text-xs hover:text-foreground"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              type="password"
              autoComplete="current-password webauthn"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
            />
            <FieldError match={field.state.meta.isTouched && !field.state.meta.isValid}>
              {field.state.meta.errors.map((error) => error?.message).join(", ")}
            </FieldError>
          </Field>
        )}
      </form.Field>
      <AuthErrorAlert error={mutation.error} />
      <Button type="submit" className="w-full" loading={mutation.isPending}>
        Sign in
      </Button>
    </Form>
  );
}
