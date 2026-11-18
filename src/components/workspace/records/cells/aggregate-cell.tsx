import type { Aggregate } from "@/lib/records/aggregates";

import type { ViewerColumn } from "../columns";
import { NumberCell } from "./number-cell";
import { precisionOf } from "./shared";

export function AggregateCell({
  column,
  aggregate,
}: {
  column: ViewerColumn;
  aggregate: Aggregate | undefined;
}) {
  if (!aggregate) return null;

  let value: React.ReactNode;
  if (aggregate.type === "count") {
    value = <span className="tabular-nums">{aggregate.value.toLocaleString()}</span>;
  } else if (aggregate.value === null) {
    value = <span className="text-muted-foreground">—</span>;
  } else if (aggregate.type === "average") {
    value = (
      <NumberCell
        column={column}
        value={aggregate.value}
        digits={Math.max(precisionOf(column.options, 0), 1)}
      />
    );
  } else {
    value = <NumberCell column={column} value={aggregate.value} />;
  }

  return <span className="truncate">{value}</span>;
}
