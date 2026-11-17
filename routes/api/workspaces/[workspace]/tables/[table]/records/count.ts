import { defineHandler } from "void";
import { z } from "zod";

import { requireAccess } from "@/lib/access/require-access";
import { httpError, NOT_FOUND } from "@/lib/http";
import { RECORDS_COUNT_LIMIT } from "@/lib/records/query";
import { countRecordsUpTo } from "@/lib/records/repository";
import { findTable } from "@/lib/tables/repository";

const params = z.object({ workspace: z.string(), table: z.coerce.number().int().positive() });

export const GET = defineHandler.withValidator({ params })(async (c, { params }) => {
  const { ownerId } = await requireAccess(c, "read", params.table);
  const table = await findTable(params.table);
  if (!table) throw httpError(404, NOT_FOUND);

  const found = await countRecordsUpTo(
    c.get("workspaceId"),
    table,
    RECORDS_COUNT_LIMIT + 1,
    ownerId,
  );
  return { count: Math.min(found, RECORDS_COUNT_LIMIT), capped: found > RECORDS_COUNT_LIMIT };
});
