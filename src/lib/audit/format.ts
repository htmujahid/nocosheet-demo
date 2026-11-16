import type { AuditAction } from "./actions";

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  create: "Created",
  update: "Edited",
  delete: "Deleted",
  restore: "Restored",
  purge: "Deleted forever",
  import: "Imported",
};

const plural = (count: number) => `${count} ${count === 1 ? "record" : "records"}`;

export function summarizeAudit(entry: { action: AuditAction; count: number; recordIds: number[] }) {
  const target =
    entry.count === 1 && entry.recordIds[0] ? `record #${entry.recordIds[0]}` : plural(entry.count);
  switch (entry.action) {
    case "create":
      return `Created ${target}`;
    case "update":
      return `Edited ${target}`;
    case "delete":
      return `Deleted ${target}`;
    case "restore":
      return `Restored ${target}`;
    case "purge":
      return `Permanently deleted ${target}`;
    case "import":
      return `Imported ${plural(entry.count)}`;
  }
}
