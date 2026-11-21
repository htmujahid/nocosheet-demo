import { describe, expect, it } from "vite-plus/test";

import { checkTemplate, templateSchema } from "./schema";

const files = import.meta.glob("../../../templates/*.json", {
  eager: true,
  import: "default",
}) as Record<string, unknown>;

const entries = Object.entries(files).map(([path, json]) => ({
  file: path.split("/").pop() as string,
  json,
}));

describe("bundled templates", () => {
  it("are present", () => {
    expect(entries.length).toBeGreaterThan(0);
  });

  it("use unique ids that match their file name", () => {
    const ids = entries.map(({ json }) => (json as { id?: string }).id);
    expect(entries.map(({ file }) => file)).toEqual(ids.map((id) => `${id}.json`));
    expect(new Set(ids).size).toBe(ids.length);
  });

  describe.each(entries)("$file", ({ json }) => {
    it("matches the template format", () => {
      const parsed = templateSchema.safeParse(json);
      expect(
        parsed.success ? [] : parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
      ).toEqual([]);
    });

    it("has consistent tables, columns, views and rows", () => {
      const parsed = templateSchema.safeParse(json);
      expect(parsed.success).toBe(true);
      if (parsed.success) expect(checkTemplate(parsed.data)).toEqual([]);
    });
  });
});
