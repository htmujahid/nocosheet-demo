import type { ReactNode } from "react";

import { LayoutGridIcon, PlusIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardFrame,
  CardFrameAction,
  CardFrameDescription,
  CardFrameHeader,
  CardFrameTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NamedIcon } from "@/components/workspace/tables/named-icon";
import { type Action, ACTION_LABELS } from "@/lib/access/grants";
import type { Matrix } from "@/lib/access/matrix";

import { ScopeSelect, type ScopeValue } from "./scope-select";

export type OverrideItem = { id: number; name: string; icon: string | null; group?: string };

export function OverrideCard({
  title,
  description,
  addLabel,
  emptyLabel,
  items,
  matrix,
  actions,
  inheritLabel,
  fallback,
  onChange,
}: {
  title: string;
  description: string;
  addLabel: string;
  emptyLabel: ReactNode;
  items: OverrideItem[];
  matrix: Matrix;
  actions: readonly Action[];
  inheritLabel: string;
  fallback?: typeof LayoutGridIcon;
  onChange: (matrix: Matrix) => void;
}) {
  const overridden = items.filter((item) => matrix.tables[item.id]);
  const available = items.filter((item) => !matrix.tables[item.id]);
  const label = (item: OverrideItem) => (item.group ? `${item.group} / ${item.name}` : item.name);

  const setCell = (id: number, action: Action, value: ScopeValue) => {
    const row = { ...matrix.tables[id] };
    if (value === "inherit") delete row[action];
    else row[action] = value;
    onChange({ ...matrix, tables: { ...matrix.tables, [id]: row } });
  };

  const remove = (id: number) => {
    const { [id]: _removed, ...rest } = matrix.tables;
    onChange({ ...matrix, tables: rest });
  };

  return (
    <CardFrame>
      <CardFrameHeader>
        <CardFrameTitle>{title}</CardFrameTitle>
        <CardFrameDescription>{description}</CardFrameDescription>
        <CardFrameAction>
          <Select
            value=""
            disabled={available.length === 0}
            items={available.map((item) => ({ value: String(item.id), label: label(item) }))}
            onValueChange={(next) => {
              if (next) onChange({ ...matrix, tables: { ...matrix.tables, [Number(next)]: {} } });
            }}
          >
            <SelectTrigger aria-label={addLabel} size="sm" className="w-fit">
              <PlusIcon />
              <SelectValue placeholder={addLabel} />
            </SelectTrigger>
            <SelectPopup>
              {available.map((item) => (
                <SelectItem key={item.id} value={String(item.id)}>
                  {label(item)}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </CardFrameAction>
      </CardFrameHeader>
      <Card>
        {overridden.length === 0 && (
          <p className="p-6 text-center text-muted-foreground text-sm">{emptyLabel}</p>
        )}
        {overridden.map((item) => (
          <div key={item.id} className="flex flex-col gap-3 p-4 not-last:border-b md:px-6">
            <div className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2 font-medium text-sm">
                <NamedIcon
                  name={item.icon}
                  fallback={fallback}
                  className="size-4 shrink-0 text-muted-foreground"
                />
                <span className="truncate">{label(item)}</span>
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove overrides for ${label(item)}`}
                onClick={() => remove(item.id)}
              >
                <XIcon />
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {actions.map((action) => (
                <div key={action} className="flex flex-col gap-1">
                  <span className="text-muted-foreground text-xs">{ACTION_LABELS[action]}</span>
                  <ScopeSelect
                    inherit
                    inheritLabel={inheritLabel}
                    action={action}
                    label={`${ACTION_LABELS[action]} in ${label(item)}`}
                    value={matrix.tables[item.id]?.[action] ?? "inherit"}
                    onValueChange={(value) => setCell(item.id, action, value)}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </Card>
    </CardFrame>
  );
}
