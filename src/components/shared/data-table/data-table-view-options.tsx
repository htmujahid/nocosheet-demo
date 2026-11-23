import type { ReactTable, RowData } from "@tanstack/react-table";

import { Settings2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Menu,
  MenuCheckboxItem,
  MenuGroup,
  MenuGroupLabel,
  MenuPopup,
  MenuTrigger,
} from "@/components/ui/menu";

import type { dataTableFeatures } from "./features";

export function DataTableViewOptions<TData extends RowData, TSelected>({
  table,
}: {
  table: ReactTable<typeof dataTableFeatures, TData, TSelected>;
}) {
  const columns = table.getAllColumns().filter((column) => column.getCanHide());

  return (
    <Menu>
      <MenuTrigger render={<Button variant="outline" aria-label="View" />}>
        <Settings2Icon />
        <span className="max-sm:hidden">View</span>
      </MenuTrigger>
      <MenuPopup align="end">
        <MenuGroup>
          <MenuGroupLabel>Columns</MenuGroupLabel>
          {columns.map((column) => (
            <MenuCheckboxItem
              key={column.id}
              checked={column.getIsVisible()}
              closeOnClick={false}
              onCheckedChange={(value) => column.toggleVisibility(!!value)}
            >
              {typeof column.columnDef.header === "string" ? column.columnDef.header : column.id}
            </MenuCheckboxItem>
          ))}
        </MenuGroup>
      </MenuPopup>
    </Menu>
  );
}
