import { createLoader, type inferParserType, type ParserMap } from "nuqs/server";

const textOf = (raw: unknown) =>
  typeof raw === "string" || typeof raw === "number"
    ? String(raw)
    : raw && typeof raw === "object"
      ? JSON.stringify(raw)
      : undefined;

export function createSearchValidator<Parsers extends ParserMap>(parsers: Parsers) {
  const load = createLoader(parsers);
  const keys = Object.keys(parsers) as (keyof Parsers & string)[];

  return (search: Record<string, unknown>): Partial<inferParserType<Parsers>> => {
    const input: Record<string, string> = {};
    for (const key of keys) {
      const text = textOf(search[key]);
      if (text !== undefined) input[key] = text;
    }
    const loaded = load(input) as Record<string, unknown>;
    return Object.fromEntries(
      Object.keys(input)
        .map((key) => [key, loaded[key]] as const)
        .filter(([, value]) => value !== null),
    ) as Partial<inferParserType<Parsers>>;
  };
}
