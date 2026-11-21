import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite-plus";
import { voidPlugin } from "void";

const STATIC_FILES = [
  "/manifest.webmanifest",
  "/icons.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
];

function serviceWorker(): Plugin {
  return {
    name: "nocosheet-service-worker",
    apply: "build",
    generateBundle(_options, bundle) {
      if (this.environment?.name !== "client") return;
      const built = Object.keys(bundle)
        .filter((file) => !file.endsWith(".map"))
        .map((file) => `/${file}`);
      const precache = ["/", ...STATIC_FILES, ...built];
      const version = createHash("sha256").update(precache.join("\n")).digest("hex").slice(0, 12);
      const template = readFileSync(
        fileURLToPath(new URL("./sw.template.js", import.meta.url)),
        "utf8",
      );
      this.emitFile({
        type: "asset",
        fileName: "sw.js",
        source: template
          .replace('"__PRECACHE__"', JSON.stringify(precache))
          .replace('"__VERSION__"', JSON.stringify(version)),
      });
    },
  };
}

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@db": fileURLToPath(new URL("./db", import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ["@tanstack/browser-db-sqlite-persistence"],
  },
  plugins: [
    tailwindcss(),
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    voidPlugin(),
    serviceWorker(),
  ],
  fmt: {
    ignorePatterns: ["src/routeTree.gen.ts", "pnpm-lock.yaml", ".void/**", ".cloudflare/**"],
    sortPackageJson: true,
    sortImports: {
      newlinesBetween: true,
      customGroups: [
        { groupName: "react", elementNamePattern: ["react", "react-dom", "react-dom/*"] },
        { groupName: "tanstack", elementNamePattern: ["@tanstack/*"] },
      ],
      groups: [
        "react",
        "tanstack",
        ["builtin", "external"],
        "internal",
        ["parent", "sibling", "index"],
        "unknown",
      ],
    },
  },
  lint: {
    ignorePatterns: ["src/routeTree.gen.ts", ".void/**", ".cloudflare/**"],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
});
