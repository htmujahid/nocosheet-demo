import { defineHandler } from "void";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { conflictOrBadRequest, httpError, NOT_FOUND } from "@/lib/http";
import { TITLE_FORMATS } from "@/lib/tables/formats";
import { findColumnByName, findTable, updateTable } from "@/lib/tables/repository";
import { tableUpdateSchema } from "@/lib/tables/validation";

const params = z.object({ workspace: z.string(), table: z.coerce.number().int().positive() });

export const PATCH = defineHandler.withValidator({ params, body: tableUpdateSchema })(async (
  c,
  { params, body },
) => {
  requireAdmin(c);
  const table = await findTable(params.table);
  if (!table) throw httpError(404, NOT_FOUND);
  const { titleColumn, ...fields } = body;

  let titleColumnId: number | null | undefined;
  if (titleColumn === null) titleColumnId = null;
  else if (titleColumn !== undefined) {
    const match = await findColumnByName(table.id, titleColumn);
    if (!match || !TITLE_FORMATS.includes(match.format as never))
      throw httpError(400, "Pick a column that can be used as the title.");
    titleColumnId = match.id;
  }

  try {
    return await updateTable(table.id, { ...fields, titleColumnId });
  } catch (error) {
    conflictOrBadRequest(error, "A table with this name already exists.");
  }
});
