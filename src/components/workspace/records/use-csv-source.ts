import { useMemo, useState } from "react";

import { parseCsv } from "@/lib/records/import";

export const MAX_FILE_BYTES = 5 * 1024 * 1024;

export type CsvSourceKind = "upload" | "paste";

export function useCsvSource(onChange?: () => void) {
  const [source, setSource] = useState<CsvSourceKind>("upload");
  const [uploadText, setUploadText] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [fileName, setFileName] = useState<string>();
  const [fileError, setFileError] = useState<string>();
  const [hasHeader, setHasHeader] = useState(true);
  const text = source === "upload" ? uploadText : pasteText;

  const grid = useMemo(() => (text.trim() ? parseCsv(text) : []), [text]);
  const width = grid.reduce((max, row) => Math.max(max, row.length), 0);
  const headers = useMemo(
    () =>
      grid.length === 0
        ? []
        : hasHeader
          ? Array.from({ length: width }, (_, index) => grid[0][index] ?? "")
          : Array.from({ length: width }, (_, index) => `Column ${index + 1}`),
    [grid, hasHeader, width],
  );
  const rows = hasHeader ? grid.slice(1) : grid;

  async function chooseFile(file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) return setFileError("The file is larger than 5 MB.");
    setFileError(undefined);
    setFileName(file.name);
    setUploadText(await file.text());
    onChange?.();
  }

  function removeFile() {
    setFileName(undefined);
    setFileError(undefined);
    setUploadText("");
    onChange?.();
  }

  return {
    source,
    switchSource: (next: CsvSourceKind) => {
      setSource(next);
      onChange?.();
    },
    pasteText,
    changePaste: (next: string) => {
      setPasteText(next);
      onChange?.();
    },
    fileName,
    fileError,
    chooseFile,
    removeFile,
    hasHeader,
    setHasHeader,
    grid,
    headers,
    rows,
  };
}

export type CsvSource = ReturnType<typeof useCsvSource>;
