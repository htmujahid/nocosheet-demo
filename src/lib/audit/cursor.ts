export type AuditCursor = { createdAt: number; id: number };

export const encodeAuditCursor = (row: { createdAt: Date; id: number }) =>
  `${row.createdAt.getTime()}:${row.id}`;

export function parseAuditCursor(text: string): AuditCursor | null {
  const match = /^(\d+):([1-9]\d*)$/.exec(text);
  return match ? { createdAt: Number(match[1]), id: Number(match[2]) } : null;
}
