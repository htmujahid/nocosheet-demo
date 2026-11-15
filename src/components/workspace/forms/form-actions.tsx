import { useState } from "react";

import { useNavigate } from "@tanstack/react-router";

import { EllipsisIcon, PencilIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Menu,
  MenuGroup,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu";
import { useAccess } from "@/hooks/use-access";

import { DeleteFormDialog } from "./delete-form-dialog";
import { FormDialog, type FormSummary } from "./form-dialog";

export function FormActions({
  workspace,
  table,
  form,
}: {
  workspace: string;
  table: string;
  form: FormSummary;
}) {
  const access = useAccess();
  const navigate = useNavigate();
  const [dialog, setDialog] = useState<"edit" | "delete" | null>(null);
  const tableId = Number(table);

  if (!access.admin) return null;

  return (
    <>
      <Menu>
        <MenuTrigger render={<Button size="icon-sm" variant="outline" aria-label="Form actions" />}>
          <EllipsisIcon aria-hidden="true" />
        </MenuTrigger>
        <MenuPopup align="end">
          <MenuGroup>
            <MenuItem onClick={() => setDialog("edit")}>
              <PencilIcon aria-hidden="true" />
              Edit form
            </MenuItem>
          </MenuGroup>
          <MenuSeparator />
          <MenuGroup>
            <MenuItem variant="destructive" onClick={() => setDialog("delete")}>
              <Trash2Icon aria-hidden="true" />
              Delete form
            </MenuItem>
          </MenuGroup>
        </MenuPopup>
      </Menu>
      <FormDialog
        workspace={workspace}
        tableId={tableId}
        open={dialog === "edit"}
        onOpenChange={(open) => !open && setDialog(null)}
        form={form}
      />
      <DeleteFormDialog
        workspace={workspace}
        tableId={tableId}
        form={form}
        open={dialog === "delete"}
        onOpenChange={(open) => !open && setDialog(null)}
        onDeleted={() =>
          void navigate({
            to: "/workspaces/$workspace/tables/$table/forms",
            params: { workspace, table },
          })
        }
      />
    </>
  );
}
