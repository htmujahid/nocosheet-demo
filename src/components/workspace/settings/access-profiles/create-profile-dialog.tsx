import { useState } from "react";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { PlusIcon } from "lucide-react";
import { z } from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { workspaceKeys } from "@/data/workspace/keys";
import { createProfileMutationOptions } from "@/data/workspace/access-profiles";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(64, "Name must be 64 characters or fewer"),
  description: z.string().trim().max(300, "Description must be 300 characters or fewer"),
});

export function CreateProfileDialog({ workspace }: { workspace: string }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const createProfile = useMutation({
    ...createProfileMutationOptions,
    onSuccess: async (profile) => {
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.accessProfiles() });
      setOpen(false);
      await navigate({
        to: "/workspaces/$workspace/settings/access/$profileId",
        params: { workspace, profileId: String(profile.id) },
      });
    },
  });

  const form = useForm({
    defaultValues: { name: "", description: "" },
    validators: { onSubmit: schema },
    onSubmit: ({ value }) =>
      createProfile.mutate({
        workspace,
        name: value.name.trim(),
        description: value.description.trim() || null,
      }),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          form.reset();
          createProfile.reset();
        }
      }}
    >
      <DialogTrigger render={<Button size="sm" />}>
        <PlusIcon />
        New access profile
      </DialogTrigger>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>New access profile</DialogTitle>
          <DialogDescription>
            Name the profile now and choose what it gives access to on the next screen.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <Form
            id="create-profile-form"
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
                    autoFocus
                    autoComplete="off"
                    placeholder="Support"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                  <FieldError match={field.state.meta.isTouched && !field.state.meta.isValid}>
                    {field.state.meta.errors.map((item) => item?.message).join(", ")}
                  </FieldError>
                </Field>
              )}
            </form.Field>
            <form.Field name="description">
              {(field) => (
                <Field name={field.name}>
                  <FieldLabel>Description</FieldLabel>
                  <Textarea
                    placeholder="Optional"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                </Field>
              )}
            </form.Field>
            {createProfile.error && (
              <Alert variant="error">
                <AlertDescription>{createProfile.error.message}</AlertDescription>
              </Alert>
            )}
          </Form>
        </DialogPanel>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
          <Button type="submit" form="create-profile-form" loading={createProfile.isPending}>
            Create profile
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
