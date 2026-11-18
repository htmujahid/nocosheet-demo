import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export const READONLY_SETTINGS = String(import.meta.env.VITE_DISABLE_SETTINGS) === "true";

export function ReadonlyFieldset({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <fieldset
      disabled={READONLY_SETTINGS}
      className={cn("m-0 flex min-w-0 flex-col gap-6 border-0 p-0", className)}
    >
      {children}
    </fieldset>
  );
}
