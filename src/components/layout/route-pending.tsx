import { Logo } from "@/components/brand/logo";
import { Skeleton } from "@/components/ui/skeleton";

export function AppPending() {
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center gap-6"
      aria-busy="true"
      aria-live="polite"
    >
      <Logo className="text-xl" />
      <Skeleton className="h-1 w-40 rounded-full" />
    </div>
  );
}

export function RoutePending() {
  return (
    <div className="flex-1" aria-busy="true" aria-live="polite">
      <div className="h-0.5 w-full overflow-hidden">
        <div className="h-full w-1/3 animate-route-progress rounded-full bg-primary" />
      </div>
    </div>
  );
}
