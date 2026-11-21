import { toastManager } from "@/components/ui/toast";
import { buildCreate, toDefaultFormValues } from "@/lib/records/form";

import type { ViewerColumn } from "../columns";
import { useRecordWrites } from "../use-record-writes";
import { useRecordForm } from "./use-record-form";

export function useCreateRecord({
  tableId,
  columns,
  onCreated,
}: {
  tableId: number;
  columns: ViewerColumn[];
  onCreated: () => void;
}) {
  const writes = useRecordWrites(tableId);

  const form = useRecordForm({
    initial: toDefaultFormValues(columns),
    validate: (value) => buildCreate(columns, value).errors,
    onSubmit: (value) => {
      writes.create(buildCreate(columns, value).payload);
      toastManager.add({ type: "success", title: "Record created" });
      onCreated();
    },
  });

  return { form };
}
