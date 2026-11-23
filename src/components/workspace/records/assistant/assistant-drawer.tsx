import { type CSSProperties, useMemo, useState } from "react";

import { eq, useLiveSuspenseQuery } from "@tanstack/react-db";
import { notFound } from "@tanstack/react-router";

import { ArrowUpIcon, SparklesIcon } from "lucide-react";
import { useQueryStates } from "nuqs";

import { Button } from "@/components/ui/button";
import {
  Composer,
  ComposerActionGroup,
  ComposerActions,
  ComposerInput,
  ComposerSubmit,
} from "@/components/ui/composer";
import {
  Drawer,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerPanel,
  DrawerPopup,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Spinner } from "@/components/ui/spinner";
import { columnsCollection } from "@/data/workspace/columns";
import { tablesCollection } from "@/data/workspace/tables";
import { type ComposerValue, getComposerText } from "@/lib/composer-editor";
import { serializeFilters } from "@/lib/records/filter-param";
import { recordsSearchParams } from "@/lib/records/query";

import { buildViewerColumns, withoutIdColumn } from "../columns";
import { type ApplyView, type AssistantMessage, useAssistant } from "./use-assistant";

const SUGGESTIONS = [
  "Show records created this week",
  "Sort by name ascending",
  "Records created by me",
];

export function AssistantDrawer({ tableId, onClose }: { tableId: number; onClose: () => void }) {
  const [open, setOpen] = useState(true);

  const { data: table } = useLiveSuspenseQuery((q) =>
    q
      .from({ table: tablesCollection })
      .where(({ table }) => eq(table.id, tableId))
      .findOne(),
  );
  if (!table) throw notFound();
  const { data: tableColumns } = useLiveSuspenseQuery((q) =>
    q.from({ column: columnsCollection(tableId) }).orderBy(({ column }) => column.position),
  );
  const columns = useMemo(
    () =>
      withoutIdColumn(
        buildViewerColumns({ titleColumnId: table.titleColumnId, columns: tableColumns }),
      ),
    [table.titleColumnId, tableColumns],
  );

  const [, setUrlQuery] = useQueryStates(recordsSearchParams, { history: "replace" });
  const applyView: ApplyView = ({ filters, sort, order, search }) => {
    const names = new Map(columns.map((column) => [column.key, column.name]));
    void setUrlQuery({
      page: null,
      filter: filters.length ? serializeFilters(filters, (key) => names.get(key) ?? key) : null,
      sort,
      order,
      q: search || null,
    });
  };

  const assistant = useAssistant({ tableId, columns, applyView });
  const [draft, setDraft] = useState<ComposerValue>([]);

  const submit = (value: ComposerValue) => {
    const text = getComposerText(value).trim();
    if (!text) return;
    setDraft([]);
    void assistant.send(text);
  };

  return (
    <Drawer
      position="right"
      open={open}
      onOpenChange={setOpen}
      onOpenChangeComplete={(next) => {
        if (!next) onClose();
      }}
    >
      <DrawerPopup className="max-w-md" variant="inset" showCloseButton>
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <SparklesIcon className="size-4.5" aria-hidden="true" />
            Assistant
          </DrawerTitle>
          <DrawerDescription>
            Ask in plain language to filter, sort or search records.
          </DrawerDescription>
        </DrawerHeader>

        <DrawerPanel className="flex flex-col gap-3">
          {assistant.messages.length === 0 && (
            <div className="flex flex-col items-start gap-2 text-muted-foreground text-sm">
              <p>Try one of these:</p>
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className="rounded-lg border px-3 py-1.5 text-left text-foreground text-sm hover:bg-accent"
                  onClick={() => void assistant.send(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
          {assistant.messages.map((message) => (
            <MessageRow key={message.id} message={message} />
          ))}
          {assistant.pending && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Spinner className="size-4" />
              Thinking…
            </div>
          )}
        </DrawerPanel>

        <DrawerFooter variant="bare" className="flex-col gap-2 sm:flex-col sm:justify-stretch">
          <Composer
            layout="stacked"
            value={draft}
            onValueChange={setDraft}
            onSubmit={submit}
            submitOnEnter="desktop"
            submitDisabled={assistant.pending}
            aria-label="Message the assistant"
            style={{ "--composer-min-rows": 3 } as CSSProperties}
          >
            <ComposerInput render={<textarea />} placeholder="Message the assistant…" />
            <ComposerActions>
              <ComposerActionGroup align="end">
                <ComposerSubmit
                  render={<Button size="icon" className="size-8 rounded-full" aria-label="Send" />}
                >
                  <ArrowUpIcon aria-hidden="true" />
                </ComposerSubmit>
              </ComposerActionGroup>
            </ComposerActions>
          </Composer>
          <p className="px-1 text-end text-muted-foreground text-xs">
            Enter to send, Shift + Enter for a new line
          </p>
        </DrawerFooter>
      </DrawerPopup>
    </Drawer>
  );
}

function MessageRow({ message }: { message: AssistantMessage }) {
  if (message.role === "user")
    return (
      <div className="max-w-[85%] self-end whitespace-pre-wrap rounded-2xl rounded-br-md bg-primary px-3.5 py-2 text-primary-foreground text-sm leading-relaxed">
        {message.content}
      </div>
    );

  return (
    <div className="flex max-w-[90%] flex-col gap-2 self-start">
      {message.content && (
        <div className="whitespace-pre-wrap rounded-2xl rounded-bl-md bg-muted px-3.5 py-2 text-foreground text-sm leading-relaxed">
          {message.content}
        </div>
      )}
      {message.proposal?.kind === "filter" && (
        <p className="text-muted-foreground text-xs">
          <span className="font-medium text-foreground">Filtered the grid</span> ·{" "}
          {message.proposal.summary}
        </p>
      )}
      {message.proposal?.kind === "error" && (
        <div className="rounded-xl border border-destructive/24 bg-destructive/4 px-3 py-2 text-destructive-foreground text-sm">
          {message.proposal.errors.join(" ")}
        </div>
      )}
    </div>
  );
}
