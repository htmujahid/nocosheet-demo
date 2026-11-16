import { decodeCursor, encodeCursor } from "../records/cursor";

export type AuditCursor = { createdAt: number; id: number };

export const encodeAuditCursor = (row: { createdAt: Date; id: number }) =>
  encodeCursor([row.createdAt.getTime(), row.id]);

export function parseAuditCursor(text: string): AuditCursor | null {
  const cursor = decodeCursor(text);
  if (!cursor || cursor.length !== 2) return null;
  const [createdAt, id] = cursor;
  return typeof createdAt === "number" && Number.isInteger(createdAt) && typeof id === "number"
    ? { createdAt, id }
    : null;
}
