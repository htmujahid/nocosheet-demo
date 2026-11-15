import { ClipboardListIcon, PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useAccess } from "@/hooks/use-access";

export function FormsEmpty({ onCreate }: { onCreate: () => void }) {
  const access = useAccess();

  return (
    <Card>
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ClipboardListIcon />
          </EmptyMedia>
          <EmptyTitle>No forms yet</EmptyTitle>
          <EmptyDescription>
            {access.admin
              ? "A form collects new records for this table through a chosen set of columns."
              : "An administrator can create forms for this table."}
          </EmptyDescription>
        </EmptyHeader>
        {access.admin && (
          <Button onClick={onCreate}>
            <PlusIcon />
            New form
          </Button>
        )}
      </Empty>
    </Card>
  );
}
