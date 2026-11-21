import { Link } from "@tanstack/react-router";

import { PlusIcon, TableIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useWorkspace } from "@/hooks/use-workspace";

export function TablesEmpty({ workspace }: { workspace: string }) {
  const { isAdmin } = useWorkspace();

  return (
    <Card>
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <TableIcon />
          </EmptyMedia>
          <EmptyTitle>No tables yet</EmptyTitle>
          <EmptyDescription>
            {isAdmin
              ? "Create a table, define its columns and start modeling your data without code."
              : "Tables you can access will show up here."}
          </EmptyDescription>
        </EmptyHeader>
        {isAdmin && (
          <Button
            render={
              <Link
                to="/workspaces/$workspace/tables/new"
                params={{ workspace }}
                search={{ step: 1 }}
              />
            }
          >
            <PlusIcon />
            New table
          </Button>
        )}
      </Empty>
    </Card>
  );
}
