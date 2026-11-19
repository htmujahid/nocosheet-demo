import { useId, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardFrame,
  CardFrameDescription,
  CardFrameHeader,
  CardFrameTitle,
  CardPanel,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { toastManager } from "@/components/ui/toast";
import { NamedIcon } from "@/components/workspace/tables/named-icon";
import { workspaceKeys } from "@/data/workspace/keys";
import { applyTemplateMutationOptions, templatesQueryOptions } from "@/data/workspace/templates";
import type { TemplateSummary } from "@/lib/templates/catalog";

const count = (value: number, noun: string) => `${value} ${noun}${value === 1 ? "" : "s"}`;

function describe(template: TemplateSummary) {
  const columns = template.tables.reduce((sum, table) => sum + table.columns, 0);
  return `${count(template.tables.length, "table")} · ${count(columns, "column")}`;
}

function UseTemplateDialog({
  workspace,
  template,
  onClose,
}: {
  workspace: string;
  template: TemplateSummary | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const switchId = useId();
  const [sampleData, setSampleData] = useState(true);

  const apply = useMutation({
    ...applyTemplateMutationOptions,
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.tables() });
      onClose();
      toastManager.add({ type: "success", title: `${template?.name ?? "Template"} created` });
      const first = result.tables[0];
      if (first)
        await navigate({
          to: "/workspaces/$workspace/tables/$table",
          params: { workspace, table: String(first.id) },
        });
    },
  });

  const totalRows = template?.tables.reduce((sum, table) => sum + table.rows, 0) ?? 0;

  return (
    <Dialog
      open={template !== null}
      onOpenChange={(open) => {
        if (open || apply.isPending) return;
        apply.reset();
        onClose();
      }}
    >
      <DialogPopup className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{template?.name}</DialogTitle>
          <DialogDescription>{template?.description}</DialogDescription>
        </DialogHeader>
        <DialogPanel className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="font-medium text-sm">This will create</p>
            {template?.tables.map((table) => (
              <div key={table.name} className="flex items-center gap-3 rounded-lg border p-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <NamedIcon name={table.icon} className="size-4" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium text-sm">{table.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {[
                      count(table.columns, "column"),
                      table.views ? count(table.views, "view") : null,
                      table.forms ? count(table.forms, "form") : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {totalRows > 0 && (
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <Label htmlFor={switchId}>Include sample data</Label>
                <p className="text-muted-foreground text-xs">
                  Adds {count(totalRows, "example record")} you can edit or delete.
                </p>
              </div>
              <Switch id={switchId} checked={sampleData} onCheckedChange={setSampleData} />
            </div>
          )}
          {apply.error && (
            <Alert variant="error">
              <AlertDescription>{apply.error.message}</AlertDescription>
            </Alert>
          )}
        </DialogPanel>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="ghost" />}>Cancel</DialogClose>
          <Button
            loading={apply.isPending}
            onClick={() =>
              template && apply.mutate({ workspace, template: template.id, sampleData })
            }
          >
            Use template
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}

export function TemplateGallery({ workspace }: { workspace: string }) {
  const { data: templates, isError } = useQuery(templatesQueryOptions(workspace));
  const [selected, setSelected] = useState<TemplateSummary | null>(null);

  return (
    <CardFrame>
      <CardFrameHeader>
        <CardFrameTitle>Templates</CardFrameTitle>
        <CardFrameDescription>
          Pick a template to create your first table, view and form.
        </CardFrameDescription>
      </CardFrameHeader>
      <Card>
        <CardPanel className="grid gap-3 sm:grid-cols-2">
          {(isError || templates?.length === 0) && (
            <p className="text-muted-foreground text-sm sm:col-span-2">
              {isError ? "Couldn't load templates." : "No templates available."}
            </p>
          )}
          {!templates && !isError &&
            Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-24" />)}
          {templates?.map((template) => (
            <button
              key={template.id}
              type="button"
              className="flex items-start gap-3 rounded-xl border p-4 text-left transition-colors hover:bg-accent/40 focus-visible:outline-2 focus-visible:outline-ring"
              onClick={() => setSelected(template)}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <NamedIcon name={template.icon} className="size-4" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="font-medium text-sm">{template.name}</span>
                <span className="line-clamp-2 text-muted-foreground text-xs">
                  {template.description}
                </span>
                <span className="mt-1 flex flex-wrap items-center gap-1.5">
                  <Badge variant="secondary" size="sm">
                    {describe(template)}
                  </Badge>
                </span>
              </span>
            </button>
          ))}
        </CardPanel>
      </Card>
      <UseTemplateDialog
        key={selected?.id}
        workspace={workspace}
        template={selected}
        onClose={() => setSelected(null)}
      />
    </CardFrame>
  );
}
