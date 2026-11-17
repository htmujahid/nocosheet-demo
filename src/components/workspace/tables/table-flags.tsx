import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

/** Table-level flags, rendered as checkboxes like the column flags in the column dialog. */
export const TABLE_FLAGS = [
  { name: "isAudit", label: "Auditable" },
  { name: "isHidden", label: "Hidden" },
] as const;

export function TableFlag({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <Label>
      <Checkbox checked={checked} onCheckedChange={(next) => onChange(next === true)} />
      {label}
    </Label>
  );
}
