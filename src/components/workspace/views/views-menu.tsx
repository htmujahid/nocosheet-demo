import { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";

import {
  CheckIcon,
  ChevronDownIcon,
  ClipboardListIcon,
  LayoutGridIcon,
  ListChecksIcon,
  ListIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuLinkItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu";
import { formsQueryOptions } from "@/data/workspace/forms";
import { viewsQueryOptions } from "@/data/workspace/views";
import { useAccess } from "@/hooks/use-access";

import { DeleteFormDialog } from "../forms/delete-form-dialog";
import { FormDialog } from "../forms/form-dialog";
import { NamedIcon } from "../tables/named-icon";
import { DeleteViewDialog } from "./delete-view-dialog";
import { ViewDialog } from "./view-dialog";

type Dialog = "create" | "edit" | "delete" | "create-form" | "edit-form" | "delete-form" | null;

export function ViewsMenu({
  workspace,
  table,
  activeView,
  activeForm,
}: {
  workspace: string;
  table: string;
  activeView?: number;
  activeForm?: number;
}) {
  const tableId = Number(table);
  const access = useAccess();
  const navigate = useNavigate();
  const { data: views = [] } = useQuery(viewsQueryOptions(workspace, tableId));
  const { data: forms = [] } = useQuery({
    ...formsQueryOptions(workspace, tableId),
    enabled: access.can("create", tableId),
  });
  const [dialog, setDialog] = useState<Dialog>(null);
  const active = views.find((view) => view.id === activeView);
  const activeFormRow = forms.find((form) => form.id === activeForm);

  return (
    <>
      <Menu>
        <MenuTrigger render={<Button size="sm" variant="outline" aria-label="Views" />}>
          {activeFormRow ? <ClipboardListIcon /> : <LayoutGridIcon />}
          <span className="max-w-40 truncate max-sm:hidden">
            {active?.name ?? activeFormRow?.name ?? "All records"}
          </span>
          <ChevronDownIcon />
        </MenuTrigger>
        <MenuPopup align="start" className="min-w-56">
          <MenuGroup>
            <MenuLinkItem
              render={
                <Link to="/workspaces/$workspace/tables/$table" params={{ workspace, table }} />
              }
            >
              <LayoutGridIcon className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate">All records</span>
              {!active && !activeFormRow && <CheckIcon className="ms-auto" />}
            </MenuLinkItem>
            {views.map((view) => (
              <MenuLinkItem
                key={view.id}
                render={
                  <Link
                    to="/workspaces/$workspace/tables/$table/views/$view"
                    params={{ workspace, table, view: String(view.id) }}
                  />
                }
              >
                <NamedIcon
                  name={view.icon}
                  fallback={LayoutGridIcon}
                  className="size-4 shrink-0 text-muted-foreground"
                />
                <span className="truncate">{view.name}</span>
                {view.id === activeView && <CheckIcon className="ms-auto" />}
              </MenuLinkItem>
            ))}
            <MenuLinkItem
              render={
                <Link
                  to="/workspaces/$workspace/tables/$table/views"
                  params={{ workspace, table }}
                />
              }
            >
              <ListIcon aria-hidden="true" />
              All views
            </MenuLinkItem>
            {access.admin && (
              <MenuItem onClick={() => setDialog("create")}>
                <PlusIcon aria-hidden="true" />
                New view
              </MenuItem>
            )}
          </MenuGroup>
          {access.admin && active && (
            <>
              <MenuSeparator />
              <MenuGroup>
                <MenuItem onClick={() => setDialog("edit")}>
                  <PencilIcon aria-hidden="true" />
                  Edit view
                </MenuItem>
                <MenuItem variant="destructive" onClick={() => setDialog("delete")}>
                  <Trash2Icon aria-hidden="true" />
                  Delete view
                </MenuItem>
              </MenuGroup>
            </>
          )}
          {(forms.length > 0 || access.admin) && (
            <>
              <MenuSeparator />
              <MenuGroup>
                <MenuGroupLabel>Forms</MenuGroupLabel>
                {forms.map((form) => (
                  <MenuLinkItem
                    key={form.id}
                    render={
                      <Link
                        to="/workspaces/$workspace/tables/$table/forms/$form"
                        params={{ workspace, table, form: String(form.id) }}
                      />
                    }
                  >
                    <NamedIcon
                      name={form.icon}
                      fallback={ClipboardListIcon}
                      className="size-4 shrink-0 text-muted-foreground"
                    />
                    <span className="truncate">{form.name}</span>
                    {!form.isOpen && (
                      <span className="ms-auto text-muted-foreground text-xs">Closed</span>
                    )}
                    {form.id === activeForm && <CheckIcon className="ms-auto" />}
                  </MenuLinkItem>
                ))}
                <MenuLinkItem
                  render={
                    <Link
                      to="/workspaces/$workspace/tables/$table/forms"
                      params={{ workspace, table }}
                    />
                  }
                >
                  <ListChecksIcon aria-hidden="true" />
                  All forms
                </MenuLinkItem>
                {access.admin && (
                  <MenuItem onClick={() => setDialog("create-form")}>
                    <PlusIcon aria-hidden="true" />
                    New form
                  </MenuItem>
                )}
              </MenuGroup>
              {access.admin && activeFormRow && (
                <>
                  <MenuSeparator />
                  <MenuGroup>
                    <MenuItem onClick={() => setDialog("edit-form")}>
                      <PencilIcon aria-hidden="true" />
                      Edit form
                    </MenuItem>
                    <MenuItem variant="destructive" onClick={() => setDialog("delete-form")}>
                      <Trash2Icon aria-hidden="true" />
                      Delete form
                    </MenuItem>
                  </MenuGroup>
                </>
              )}
            </>
          )}
        </MenuPopup>
      </Menu>
      {access.admin && (
        <ViewDialog
          workspace={workspace}
          tableId={tableId}
          open={dialog === "create" || dialog === "edit"}
          onOpenChange={(open) => !open && setDialog(null)}
          view={dialog === "edit" ? active : undefined}
        />
      )}
      {access.admin && (
        <FormDialog
          workspace={workspace}
          tableId={tableId}
          open={dialog === "create-form" || dialog === "edit-form"}
          onOpenChange={(open) => !open && setDialog(null)}
          form={dialog === "edit-form" ? activeFormRow : undefined}
        />
      )}
      {access.admin && activeFormRow && (
        <DeleteFormDialog
          workspace={workspace}
          tableId={tableId}
          form={activeFormRow}
          open={dialog === "delete-form"}
          onOpenChange={(open) => !open && setDialog(null)}
          onDeleted={() =>
            void navigate({
              to: "/workspaces/$workspace/tables/$table",
              params: { workspace, table },
            })
          }
        />
      )}
      {access.admin && active && (
        <DeleteViewDialog
          workspace={workspace}
          tableId={tableId}
          view={active}
          open={dialog === "delete"}
          onOpenChange={(open) => !open && setDialog(null)}
          onDeleted={() =>
            void navigate({
              to: "/workspaces/$workspace/tables/$table",
              params: { workspace, table },
            })
          }
        />
      )}
    </>
  );
}
