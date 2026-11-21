import { useAccess } from "@/hooks/use-access";
import { useSession } from "@/hooks/use-session";

export function useReadOwner(tableId: number) {
  const access = useAccess();
  const session = useSession();
  return access.scope(tableId, "read") === "own" ? session?.user.id : undefined;
}
