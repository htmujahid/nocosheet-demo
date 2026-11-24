import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetDescription,
  SheetHeader,
  SheetPanel,
  SheetPopup,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AuditAction, AuditChange } from "@/lib/audit/actions";
import { summarizeAudit } from "@/lib/audit/format";
import { cn } from "@/lib/utils";

export type AuditEntry = {
  action: AuditAction;
  count: number;
  recordIds: number[];
  changes: AuditChange[];
  actorName: string | null;
  tableLabel: string;
  createdAt: string | Date;
};

const isEmpty = (value: unknown) =>
  value === null ||
  value === undefined ||
  value === "" ||
  (Array.isArray(value) && value.length === 0);

function Value({ value }: { value: unknown }) {
  if (isEmpty(value)) return <span className="text-muted-foreground italic">Empty</span>;
  if (typeof value === "boolean") return <>{value ? "Yes" : "No"}</>;
  if (value === null || typeof value !== "object") return <>{String(value)}</>;
  const keys = Object.keys(value);
  if (!Array.isArray(value) && keys.length === 1 && keys[0] === "id")
    return <span className="tabular-nums">#{String((value as { id: unknown }).id)}</span>;
  if (Array.isArray(value) && value.every((item) => typeof item !== "object"))
    return <>{value.join(", ")}</>;
  return <code className="text-xs">{JSON.stringify(value)}</code>;
}

const ROW_HOVER =
  "not-in-data-[variant=card]:hover:bg-accent dark:not-in-data-[variant=card]:hover:bg-accent";

const valueCell = "whitespace-normal break-words align-top leading-normal";

function Marked({ dot, value }: { dot?: string; value: unknown }) {
  return (
    <div className="flex items-start gap-2">
      {dot && (
        <span
          aria-hidden="true"
          className={cn("mt-[0.45rem] size-1.5 shrink-0 rounded-full", dot)}
        />
      )}
      <span className="min-w-0 whitespace-pre-wrap">
        <Value value={value} />
      </span>
    </div>
  );
}

function Changes({ entry }: { entry: AuditEntry }) {
  const diff = entry.action === "update";

  return (
    <section className="flex flex-col gap-1">
      <h3 className="font-medium text-sm">
        {diff ? "What changed" : "Values"}
        <span className="ms-1.5 font-normal text-muted-foreground tabular-nums">
          {entry.changes.length}
        </span>
      </h3>
      <Table className="table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead className="w-36">Field</TableHead>
            {diff ? (
              <>
                <TableHead>Before</TableHead>
                <TableHead>After</TableHead>
              </>
            ) : (
              <TableHead>Value</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {entry.changes.map((change) => (
            <TableRow key={change.column} className={ROW_HOVER}>
              <TableCell className={cn(valueCell, "font-medium")}>{change.column}</TableCell>
              {diff ? (
                <>
                  <TableCell className={cn(valueCell, "text-muted-foreground")}>
                    <Marked dot="bg-red-500" value={change.from} />
                  </TableCell>
                  <TableCell className={valueCell}>
                    <Marked dot="bg-emerald-500" value={change.to} />
                  </TableCell>
                </>
              ) : (
                <TableCell className={valueCell}>
                  <Marked value={change.to} />
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}

function Records({ entry }: { entry: AuditEntry }) {
  const more = entry.count - entry.recordIds.length;

  return (
    <section className="flex flex-col gap-2">
      <h3 className="font-medium text-sm">
        Records
        <span className="ms-1.5 font-normal text-muted-foreground tabular-nums">{entry.count}</span>
      </h3>
      <div className="flex max-h-48 flex-wrap gap-1.5 overflow-auto">
        {entry.recordIds.map((id) => (
          <Badge key={id} variant="outline" className="tabular-nums">
            #{id}
          </Badge>
        ))}
        {more > 0 && <span className="text-muted-foreground text-sm">and {more} more</span>}
      </div>
    </section>
  );
}

export function AuditEntrySheet({ entry }: { entry: AuditEntry }) {
  const when = new Date(entry.createdAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" size="sm" />}>View details</SheetTrigger>
      <SheetPopup variant="inset" className="max-w-2xl">
        <SheetHeader>
          <SheetTitle>{summarizeAudit(entry)}</SheetTitle>
          <SheetDescription>
            {entry.actorName ?? "Deleted user"} · {entry.tableLabel} · {when}
          </SheetDescription>
        </SheetHeader>
        <SheetPanel className="flex flex-col gap-5">
          {entry.recordIds.length > 1 && <Records entry={entry} />}
          {entry.changes.length > 0 && <Changes entry={entry} />}
        </SheetPanel>
      </SheetPopup>
    </Sheet>
  );
}
