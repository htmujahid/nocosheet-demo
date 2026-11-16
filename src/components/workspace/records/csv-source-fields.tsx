import { useId } from "react";

import { FileTextIcon } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import { type CsvSource, type CsvSourceKind } from "./use-csv-source";

export function CsvSourceFields({ csv, hint }: { csv: CsvSource; hint?: string }) {
  const headerSwitchId = useId();

  return (
    <>
      <Tabs value={csv.source} onValueChange={(value) => csv.switchSource(value as CsvSourceKind)}>
        <TabsList className="w-full">
          <TabsTab value="upload">Upload file</TabsTab>
          <TabsTab value="paste">Paste text</TabsTab>
        </TabsList>
        <TabsPanel value="upload" className="pt-2">
          <Field>
            <FieldLabel>CSV file</FieldLabel>
            {csv.fileName ? (
              <div className="flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2">
                <span className="flex min-w-0 items-center gap-2 text-sm">
                  <FileTextIcon
                    aria-hidden="true"
                    className="size-4 shrink-0 text-muted-foreground"
                  />
                  <span className="truncate">{csv.fileName}</span>
                </span>
                <Button type="button" variant="ghost" size="sm" onClick={csv.removeFile}>
                  Remove
                </Button>
              </div>
            ) : (
              <Input
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => void csv.chooseFile(event.target.files?.[0])}
              />
            )}
            {hint && <FieldDescription>{hint}</FieldDescription>}
          </Field>
          {csv.fileError && (
            <Alert variant="error" className="mt-3">
              <AlertDescription>{csv.fileError}</AlertDescription>
            </Alert>
          )}
        </TabsPanel>
        <TabsPanel value="paste" className="pt-2">
          <Field>
            <FieldLabel>Data</FieldLabel>
            <Textarea
              rows={8}
              className="font-mono text-xs"
              placeholder={"Name,Email\nMaya Chen,maya@example.com"}
              value={csv.pasteText}
              onChange={(event) => csv.changePaste(event.target.value)}
            />
            <FieldDescription>
              Paste comma-separated rows, including the header row.
            </FieldDescription>
          </Field>
        </TabsPanel>
      </Tabs>

      {csv.grid.length > 0 && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <Label htmlFor={headerSwitchId}>First row has column names</Label>
            <p className="text-muted-foreground text-xs">
              Turn off if the first row is already data.
            </p>
          </div>
          <Switch id={headerSwitchId} checked={csv.hasHeader} onCheckedChange={csv.setHasHeader} />
        </div>
      )}
    </>
  );
}
