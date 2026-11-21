import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export const DEMO_MODE = String(import.meta.env.VITE_DEMO_MODE) === "true";

export function ReadonlyFieldset({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <fieldset
      disabled={DEMO_MODE}
      className={cn("m-0 flex min-w-0 flex-col gap-6 border-0 p-0", className)}
    >
      {children}
    </fieldset>
  );
}
