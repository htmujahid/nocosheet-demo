import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";

import { RecordFieldList } from "./record-sheet/record-form";
import { useCreateRecord } from "./record-sheet/use-create-record";
import { useRecordScope } from "./use-record-scope";

export function CreateRecordPage({
  workspace,
  tableId,
  cancel,
  onCreated,
}: {
  workspace: string;
  tableId: number;
  cancel: React.ReactElement<{ className?: string }>;
  onCreated: () => void;
}) {
  const scope = useRecordScope(workspace, tableId);
  const { form } = useCreateRecord({ tableId, columns: scope.columns, onCreated });

  return (
    <Form
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <Frame>
        <FrameHeader>
          <FrameTitle>New record</FrameTitle>
          <FrameDescription>{scope.tableName}</FrameDescription>
        </FrameHeader>
        <FramePanel>
          <RecordFieldList
            form={form}
            workspace={workspace}
            tableId={tableId}
            columns={scope.columns}
          />
        </FramePanel>
        <FrameFooter className="flex items-center justify-end gap-2 px-3 py-3">
          <Button type="button" variant="ghost" render={cancel}>
            Cancel
          </Button>
          <Button type="submit">Create record</Button>
        </FrameFooter>
      </Frame>
    </Form>
  );
}
