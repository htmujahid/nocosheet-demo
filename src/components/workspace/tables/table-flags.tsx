import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

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
