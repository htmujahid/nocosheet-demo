import { Fragment, useEffect, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import {
  ArrowDownIcon,
  ArrowUpIcon,
  CornerDownLeftIcon,
  CreditCardIcon,
  HomeIcon,
  PaletteIcon,
  ScrollTextIcon,
  SearchIcon,
  ShieldCheckIcon,
  SlidersHorizontalIcon,
  TableIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandCollection,
  CommandDialog,
  CommandDialogPopup,
  CommandDialogTrigger,
  CommandEmpty,
  CommandFooter,
  CommandGroup,
  CommandGroupLabel,
  CommandInput,
  CommandItem,
  CommandList,
  CommandPanel,
  CommandSeparator,
} from "@/components/ui/command";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { NamedIcon } from "@/components/workspace/tables/named-icon";
import { sidebarQueryOptions } from "@/data/workspace/sidebar";
import { useWorkspace } from "@/hooks/use-workspace";

type Item = {
  value: string;
  label: string;
  icon?: LucideIcon;
  tableIcon?: string | null;
  path: string;
};
type Group = { value: string; items: Item[] };

const homePage: Item = { value: "home", label: "Home", icon: HomeIcon, path: "" };
const allTablesPage: Item = {
  value: "all-tables",
  label: "All tables",
  icon: TableIcon,
  path: "/tables",
};

type SettingsItem = Item & { adminOnly?: boolean };

const settings: SettingsItem[] = [
  { value: "general", label: "General", icon: SlidersHorizontalIcon, path: "/settings" },
  { value: "appearance", label: "Appearance", icon: PaletteIcon, path: "/settings/appearance" },
  { value: "members", label: "Members", icon: UsersIcon, path: "/settings/members" },
  { value: "access", label: "Access", icon: ShieldCheckIcon, path: "/settings/access" },
  {
    value: "audit-log",
    label: "Audit Log",
    icon: ScrollTextIcon,
    path: "/settings/audit-log",
    adminOnly: true,
  },
  { value: "billing", label: "Billing", icon: CreditCardIcon, path: "/settings/billing" },
];

/** Outline trigger plus command palette to jump to a page, table or settings section. */
export function SearchDialog({ workspace }: { workspace: string }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { isAdmin } = useWorkspace();
  const { data: sidebar } = useQuery(sidebarQueryOptions(workspace));
  const tables = sidebar?.groups.flatMap((group) => group.tables) ?? [];

  const groups: Group[] = [
    { value: "Pages", items: isAdmin ? [homePage, allTablesPage] : [homePage] },
    {
      value: "Tables",
      items: tables.map((table) => ({
        value: `table-${table.id}`,
        label: table.name,
        tableIcon: table.icon,
        path: `/tables/${table.id}`,
      })),
    },
    { value: "Settings", items: settings.filter((item) => isAdmin || !item.adminOnly) },
  ].filter((group) => group.items.length > 0);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen(!open);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function handleItemClick(item: Item) {
    setOpen(false);
    navigate({ href: `/workspaces/${workspace}${item.path}` });
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandDialogTrigger
        render={
          <Button
            variant="outline"
            className="w-full justify-start gap-2 text-muted-foreground group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
            aria-label="Search"
          />
        }
      >
        <SearchIcon />
        <span className="group-data-[collapsible=icon]:hidden">Search</span>
        <KbdGroup className="ms-auto group-data-[collapsible=icon]:hidden">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </CommandDialogTrigger>
      <CommandDialogPopup aria-label="Search">
        <Command items={groups}>
          <CommandInput placeholder="Search pages, tables and settings..." />
          <CommandPanel>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandList>
              {(group: Group) => (
                <Fragment key={group.value}>
                  <CommandGroup items={group.items}>
                    <CommandGroupLabel>{group.value}</CommandGroupLabel>
                    <CommandCollection>
                      {(item: Item) => (
                        <CommandItem
                          key={item.value}
                          value={item.value}
                          className="gap-2.5 [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-muted-foreground"
                          onClick={() => handleItemClick(item)}
                        >
                          {item.icon ? <item.icon /> : <NamedIcon name={item.tableIcon} />}
                          <span className="flex-1">{item.label}</span>
                        </CommandItem>
                      )}
                    </CommandCollection>
                  </CommandGroup>
                  <CommandSeparator />
                </Fragment>
              )}
            </CommandList>
          </CommandPanel>
          <CommandFooter>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <KbdGroup>
                  <Kbd>
                    <ArrowUpIcon />
                  </Kbd>
                  <Kbd>
                    <ArrowDownIcon />
                  </Kbd>
                </KbdGroup>
                <span>Navigate</span>
              </div>
              <div className="flex items-center gap-2">
                <Kbd>
                  <CornerDownLeftIcon />
                </Kbd>
                <span>Open</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Kbd>Esc</Kbd>
              <span>Close</span>
            </div>
          </CommandFooter>
        </Command>
      </CommandDialogPopup>
    </CommandDialog>
  );
}
