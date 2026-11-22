import { useDbClient } from "@tanstack/react-db";
import { Link } from "@tanstack/react-router";

import {
  ExternalLinkIcon,
  LinkIcon,
  MoreHorizontalIcon,
  StarIcon,
  SlidersHorizontalIcon,
  StarOffIcon,
} from "lucide-react";

import {
  Menu,
  MenuItem,
  MenuLinkItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu";
import { SidebarMenuAction, useSidebar } from "@/components/ui/sidebar";
import { toastManager } from "@/components/ui/toast";
import { favoritesCollection, setFavoriteAction } from "@/data/workspace/favorites";
import { useOffline } from "@/hooks/use-offline";
import { useSession } from "@/hooks/use-session";
import { useWorkspace } from "@/hooks/use-workspace";

export function TableMenu({
  table,
  favorite,
  workspace,
}: {
  table: { id: number; name: string };
  favorite: boolean;
  workspace: string;
}) {
  const { isMobile } = useSidebar();
  const { isAdmin } = useWorkspace();
  const dbClient = useDbClient();
  const session = useSession();
  const offline = useOffline();

  const toggleFavorite = () => {
    const favorites = dbClient.collection(favoritesCollection);
    const transaction = setFavoriteAction(
      offline.executor,
      favorites,
      session!.user.id,
    )({
      tableId: table.id,
      favorite: !favorite,
    });
    transaction.when("settled").catch((error: Error) =>
      toastManager.add({
        type: "error",
        title: "Couldn't update favorites",
        description: error.message,
      }),
    );
  };

  const path = `/workspaces/${workspace}/tables/${table.id}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`);
      toastManager.add({ type: "success", title: "Link copied" });
    } catch {
      toastManager.add({ type: "error", title: "Couldn't copy the link" });
    }
  };

  return (
    <Menu>
      <MenuTrigger
        render={<SidebarMenuAction showOnHover aria-label={`Options for ${table.name}`} />}
      >
        <MoreHorizontalIcon />
      </MenuTrigger>
      <MenuPopup
        side={isMobile ? "bottom" : "right"}
        align={isMobile ? "end" : "start"}
        className="min-w-52"
      >
        <MenuItem onClick={toggleFavorite}>
          {favorite ? <StarOffIcon /> : <StarIcon />}
          {favorite ? "Remove from Favorites" : "Add to Favorites"}
        </MenuItem>
        <MenuSeparator />
        <MenuItem onClick={copyLink}>
          <LinkIcon />
          Copy link
        </MenuItem>
        <MenuLinkItem render={<a href={path} target="_blank" rel="noreferrer" />}>
          <ExternalLinkIcon />
          Open in new tab
        </MenuLinkItem>
        <MenuSeparator />
        <MenuLinkItem
          render={
            <Link
              to="/workspaces/$workspace/tables/$table/definition"
              params={{ workspace, table: String(table.id) }}
            />
          }
        >
          <SlidersHorizontalIcon />
          {isAdmin ? "Edit definition" : "View definition"}
        </MenuLinkItem>
      </MenuPopup>
    </Menu>
  );
}
