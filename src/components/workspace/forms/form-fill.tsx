import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { CheckCircle2Icon } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FrameTitle,
  FramePanel,
} from "@/components/ui/frame";
import { submitFormMutationOptions } from "@/data/workspace/forms";
import { workspaceKeys } from "@/data/workspace/keys";
import { buildCreate, toDefaultFormValues } from "@/lib/records/form";

import { buildViewerColumns } from "../records/columns";
import { RecordFieldList } from "../records/record-sheet/record-form";
import { useRecordForm } from "../records/record-sheet/use-record-form";

type FormDefinition = {
  id: number;
  name: string;
  description: string | null;
  isOpen: boolean;
  selectColumns: string[];
  titleColumnId: number | null;
  columns: Parameters<typeof buildViewerColumns>[0]["columns"];
};

const SYSTEM_FORMATS = ["id", "created_at", "updated_at", "user"];

function FormFields({
  workspace,
  tableId,
  definition,
  onSubmitted,
}: {
  workspace: string;
  tableId: number;
  definition: FormDefinition;
  onSubmitted: () => void;
}) {
  const queryClient = useQueryClient();
  const columns = buildViewerColumns(definition)
    .filter((column) => !SYSTEM_FORMATS.includes(column.format) && !column.readOnly)
    .sort(
      (a, b) => definition.selectColumns.indexOf(a.key) - definition.selectColumns.indexOf(b.key),
    );

  const submit = useMutation({
    ...submitFormMutationOptions,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: workspaceKeys.table(tableId),
        predicate: (query) => query.queryKey[3] !== "forms",
      });
      onSubmitted();
    },
  });

  const form = useRecordForm({
    initial: toDefaultFormValues(columns),
    validate: (value) => buildCreate(columns, value).errors,
    onSubmit: (value) =>
      submit.mutate({
        workspace,
        tableId,
        formId: definition.id,
        values: buildCreate(columns, value).payload,
      }),
  });

  return (
    <Form
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <Frame>
        <FrameHeader>
          <FrameTitle>{definition.name}</FrameTitle>
          {definition.description && <FrameDescription>{definition.description}</FrameDescription>}
        </FrameHeader>
        <FramePanel>
          <div className="flex flex-col gap-4">
            {!definition.isOpen && (
              <Alert variant="warning">
                <AlertDescription>
                  This form isn't accepting responses. Edit the form to turn it back on.
                </AlertDescription>
              </Alert>
            )}
            <RecordFieldList
              form={form}
              workspace={workspace}
              tableId={tableId}
              columns={columns}
              disabled={submit.isPending || !definition.isOpen}
              error={submit.error}
            />
          </div>
        </FramePanel>
        <FrameFooter className="flex justify-end">
          <Button type="submit" loading={submit.isPending} disabled={!definition.isOpen}>
            Submit
          </Button>
        </FrameFooter>
      </Frame>
    </Form>
  );
}

export function FormFill({
  workspace,
  tableId,
  definition,
}: {
  workspace: string;
  tableId: number;
  definition: FormDefinition;
}) {
  const [round, setRound] = useState(0);
  const [done, setDone] = useState(false);

  if (done)
    return (
      <Frame>
        <FramePanel className="flex flex-col items-center gap-3 py-10 text-center">
          <CheckCircle2Icon aria-hidden="true" className="size-8 text-success-foreground" />
          <div className="flex flex-col gap-1">
            <p className="font-semibold">Response submitted</p>
            <p className="text-muted-foreground text-sm">Your answers were added to the table.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setRound((previous) => previous + 1);
              setDone(false);
            }}
          >
            Submit another response
          </Button>
        </FramePanel>
      </Frame>
    );

  return (
    <FormFields
      key={round}
      workspace={workspace}
      tableId={tableId}
      definition={definition}
      onSubmitted={() => setDone(true)}
    />
  );
}
