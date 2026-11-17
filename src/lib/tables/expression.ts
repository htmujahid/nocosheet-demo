export class ExpressionError extends Error {}

type Token =
  | { kind: "literal"; text: string }
  | { kind: "ref"; name: string }
  | { kind: "char"; text: string };

function tokenize(expression: string) {
  const tokens: Token[] = [];
  let index = 0;

  while (index < expression.length) {
    const char = expression[index];

    if (char === "'" || char === '"') {
      let end = index + 1;
      for (;;) {
        if (end >= expression.length) throw new ExpressionError("Close every quote");
        if (expression[end] === char) {
          if (expression[end + 1] !== char) break;
          end += 2;
          continue;
        }
        end++;
      }
      tokens.push({ kind: "literal", text: expression.slice(index, end + 1) });
      index = end + 1;
    } else if (char === "{") {
      const end = expression.indexOf("}", index);
      if (end === -1) throw new ExpressionError("Close every { with a }");
      tokens.push({ kind: "ref", name: expression.slice(index + 1, end).trim() });
      index = end + 1;
    } else {
      tokens.push({ kind: "char", text: char });
      index++;
    }
  }

  return tokens;
}

function hasSafeStructure(tokens: Token[]) {
  let depth = 0;

  for (const [position, token] of tokens.entries()) {
    if (token.kind !== "char") continue;
    const next = tokens[position + 1];
    const following = next?.kind === "char" ? next.text : "";

    if (token.text === "(") depth++;
    else if (token.text === ")" && --depth < 0) return false;
    else if ([";", "`", "[", "]"].includes(token.text)) return false;
    else if (token.text === "-" && following === "-") return false;
    else if (token.text === "/" && following === "*") return false;
  }

  return depth === 0;
}

export function isSafeExpression(expression: string) {
  if (expression.trim().length === 0) return false;
  try {
    return hasSafeStructure(tokenize(expression));
  } catch (error) {
    if (error instanceof ExpressionError) return false;
    throw error;
  }
}

export function compileExpression(expression: string, columns: Map<string, string>) {
  let sql = "";
  let stored = "";

  for (const token of tokenize(expression)) {
    if (token.kind === "ref") {
      const key = columns.get(token.name.toLowerCase());
      if (!key) throw new ExpressionError(`"${token.name}" isn't a column of this table`);
      sql += `"${key}"`;
      stored += `{${key}}`;
    } else {
      sql += token.text;
      stored += token.text;
    }
  }

  if (!isSafeExpression(sql)) throw new ExpressionError("Enter a valid SQL expression");

  return { sql, stored };
}
