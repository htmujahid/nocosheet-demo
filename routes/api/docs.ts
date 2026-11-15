import { Scalar } from "@scalar/hono-api-reference";
import { defineHandler } from "void";

const SCALAR_CDN = "https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.76.4";

export const GET = defineHandler(async (c) => {
  const render = Scalar({
    pageTitle: "Nocosheet API",
    cdn: SCALAR_CDN,
    _integration: null,
    hideClientButton: true,
    showDeveloperTools: "never",
    agent: { disabled: true },
    operationTitleSource: "path",
    sources: [
      { title: "Nocosheet", slug: "nocosheet", url: "/openapi.yaml", default: true },
      {
        title: "Authentication",
        slug: "authentication",
        url: "/api/auth/open-api/generate-schema",
      },
    ],
  });
  return render(c as never, async () => undefined);
});
