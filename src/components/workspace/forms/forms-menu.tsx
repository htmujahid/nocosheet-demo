import { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { ClipboardListIcon, EllipsisIcon, ListChecksIcon, PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GroupSeparator } from "@/components/ui/group";
import {
  Menu,
  MenuGroup,
  MenuItem,
  MenuLinkItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu";
import { formsQueryOptions } from "@/data/workspace/forms";
import { useAccess } from "@/hooks/use-access";

import { NamedIcon } from "../tables/named-icon";
import { FormDialog } from "./form-dialog";

export function FormsMenu({
  workspace,
  table,
  grouped = false,
}: {
  workspace: string;
  table: string;
  grouped?: boolean;
}) {
  const tableId = Number(table);
  const access = useAccess();
  const [creating, setCreating] = useState(false);
  const { data: forms = [] } = useQuery(formsQueryOptions(workspace, tableId));

  if (!access.admin && forms.length === 0) return null;

  return (
    <>
      {grouped && <GroupSeparator />}
      <Menu>
        <MenuTrigger render={<Button size="icon" variant="outline" aria-label="Forms" />}>
          <EllipsisIcon aria-hidden="true" />
        </MenuTrigger>
        <MenuPopup align="end" className="min-w-56">
          {forms.length > 0 && (
            <MenuGroup>
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
                </MenuLinkItem>
              ))}
            </MenuGroup>
          )}
          {forms.length > 0 && <MenuSeparator />}
          <MenuGroup>
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
              <MenuItem onClick={() => setCreating(true)}>
                <PlusIcon aria-hidden="true" />
                New form
              </MenuItem>
            )}
          </MenuGroup>
        </MenuPopup>
      </Menu>
      {access.admin && (
        <FormDialog
          workspace={workspace}
          tableId={tableId}
          open={creating}
          onOpenChange={setCreating}
        />
      )}
    </>
  );
}
