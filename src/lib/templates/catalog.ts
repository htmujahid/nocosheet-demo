import type { Template } from "./schema";

const files = import.meta.glob("../../../templates/*.json", {
  eager: true,
  import: "default",
}) as Record<string, Template>;

export const TEMPLATES = Object.values(files);

export const findTemplate = (id: string) => TEMPLATES.find((template) => template.id === id);

export type TemplateSummary = {
  id: string;
  name: string;
  description: string;
  icon: string | null;
  tags: string[];
  tables: { name: string; icon: string | null; columns: number; views: number; forms: number; rows: number }[];
};

export const summarize = (template: Template): TemplateSummary => ({
  id: template.id,
  name: template.name,
  description: template.description,
  icon: template.icon,
  tags: template.tags ?? [],
  tables: template.tables.map((table) => ({
    name: table.name,
    icon: table.icon,
    columns: table.columns.length,
    views: table.views?.length ?? 0,
    forms: table.forms?.length ?? 0,
    rows: table.rows?.length ?? 0,
  })),
});
