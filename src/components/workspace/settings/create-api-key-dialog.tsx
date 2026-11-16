import { useState } from "react";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { CheckIcon, CopyIcon, PlusIcon } from "lucide-react";
import { z } from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toastManager } from "@/components/ui/toast";
import { apiKeysQueryOptions } from "@/data/auth/api-keys";
import { createApiKeyMutationOptions } from "@/data/auth/create-api-key";
import { API_KEY_EXPIRY_OPTIONS, API_KEY_NAME_MAX, apiKeyExpiresIn } from "@/lib/auth/api-keys";

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Give the key a name")
    .max(API_KEY_NAME_MAX, `Use ${API_KEY_NAME_MAX} characters or fewer`),
  expiry: z.string(),
});

const DEFAULT_EXPIRY = "90";

export function CreateApiKeyDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const createKey = useMutation({
    ...createApiKeyMutationOptions,
    onSuccess: async (key) => {
      setCreated(key.key);
      await queryClient.invalidateQueries(apiKeysQueryOptions);
    },
  });

  const form = useForm({
    defaultValues: { name: "", expiry: DEFAULT_EXPIRY },
    validators: { onSubmit: schema },
    onSubmit: ({ value }) =>
      createKey.mutate({ name: value.name.trim(), expiresIn: apiKeyExpiresIn(value.expiry) }),
  });

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) return;
    form.reset();
    createKey.reset();
    setCreated(null);
    setCopied(false);
  }

  async function copy() {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toastManager.add({ type: "error", title: "Couldn't copy the key" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button type="button" />}>
        <PlusIcon />
        Create key
      </DialogTrigger>
      <DialogPopup>
        {created ? (
          <>
            <DialogHeader>
              <DialogTitle>Copy your API key</DialogTitle>
              <DialogDescription>
                This is the only time it's shown. Store it somewhere safe, because it can't be
                retrieved later.
              </DialogDescription>
            </DialogHeader>
            <DialogPanel className="flex flex-col gap-3">
              <div className="flex gap-2">
                <Input readOnly aria-label="API key" value={created} className="font-mono" />
                <Button type="button" variant="outline" onClick={copy}>
                  {copied ? <CheckIcon /> : <CopyIcon />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </DialogPanel>
            <DialogFooter variant="bare">
              <Button type="button" onClick={() => handleOpenChange(false)}>
                Done
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Create API key</DialogTitle>
              <DialogDescription>
                The key acts as you, with your role and access profile.
              </DialogDescription>
            </DialogHeader>
            <DialogPanel>
              <Form
                id="create-api-key-form"
                className="flex flex-col gap-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  void form.handleSubmit();
                }}
              >
                <form.Field name="name">
                  {(field) => (
                    <Field
                      name={field.name}
                      invalid={field.state.meta.isTouched && !field.state.meta.isValid}
                    >
                      <FieldLabel>Name</FieldLabel>
                      <Input
                        autoComplete="off"
                        placeholder="e.g. Reporting script"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                      />
                      <FieldDescription>Helps you recognize the key later.</FieldDescription>
                      <FieldError match={field.state.meta.isTouched && !field.state.meta.isValid}>
                        {field.state.meta.errors.map((item) => item?.message).join(", ")}
                      </FieldError>
                    </Field>
                  )}
                </form.Field>
                <form.Field name="expiry">
                  {(field) => (
                    <Field name={field.name}>
                      <FieldLabel>Expires</FieldLabel>
                      <Select
                        value={field.state.value}
                        items={API_KEY_EXPIRY_OPTIONS}
                        onValueChange={(value) => value !== null && field.handleChange(value)}
                      >
                        <SelectTrigger aria-label="Expiration">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectPopup>
                          {API_KEY_EXPIRY_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectPopup>
                      </Select>
                      <FieldDescription>
                        An expired key stops working. Shorter is safer.
                      </FieldDescription>
                    </Field>
                  )}
                </form.Field>
                {createKey.error && (
                  <Alert variant="error">
                    <AlertDescription>{createKey.error.message}</AlertDescription>
                  </Alert>
                )}
              </Form>
            </DialogPanel>
            <DialogFooter variant="bare">
              <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" form="create-api-key-form" loading={createKey.isPending}>
                Create key
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogPopup>
    </Dialog>
  );
}
