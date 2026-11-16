import { Badge } from "@/components/ui/badge";
import type { AuditAction } from "@/lib/audit/actions";
import { AUDIT_ACTION_LABELS } from "@/lib/audit/format";
import { cn } from "@/lib/utils";

const DOTS: Record<AuditAction, string> = {
  create: "bg-emerald-500",
  update: "bg-sky-500",
  delete: "bg-red-500",
  restore: "bg-amber-500",
  purge: "bg-red-700",
  import: "bg-muted-foreground/64",
};

export function AuditActionBadge({ action }: { action: AuditAction }) {
  return (
    <Badge variant="outline">
      <span aria-hidden="true" className={cn("size-1.5 rounded-full", DOTS[action])} />
      {AUDIT_ACTION_LABELS[action]}
    </Badge>
  );
}
