import { mutationOptions } from "@tanstack/react-query";

import { fetch } from "void/client";

import { unwrapFetch } from "@/lib/api-error";

export const uploadFileMutationOptions = mutationOptions({
  mutationFn: ({
    workspace,
    tableId,
    column,
    file,
  }: {
    workspace: string;
    tableId: number;
    column: string;
    file: File;
  }) => {
    const body = new FormData();
    body.set("file", file);
    body.set("column", column);
    return unwrapFetch(
      fetch("/api/workspaces/:workspace/tables/:table/files", {
        method: "POST",
        params: { workspace, table: String(tableId) },
        body,
      }),
    );
  },
});
