import { LockIcon, MousePointerClickIcon, Table2Icon, WifiOffIcon } from "lucide-react";

const features = [
  {
    icon: MousePointerClickIcon,
    title: "No code needed",
    description: "Set up tables, fields and links between them in a few clicks.",
  },
  {
    icon: Table2Icon,
    title: "Feels like a spreadsheet",
    description: "Browse and edit your tables the way you already work.",
  },
  {
    icon: WifiOffIcon,
    title: "Works offline",
    description: "Open your tables anywhere and your changes are saved when you reconnect.",
  },
  {
    icon: LockIcon,
    title: "Your data stays yours",
    description: "Open source, with full control over who in your team sees what.",
  },
];

export function AuthBrandPanel() {
  return (
    <aside className="hidden flex-col justify-center gap-8 border-l bg-muted/50 p-10 md:flex">
      <div className="flex flex-col gap-2">
        <h2 className="font-semibold text-2xl leading-tight tracking-tight">
          Track anything with your team, no code needed.
        </h2>
        <p className="text-muted-foreground text-sm">
          An open-source, offline-first no-code tool that feels like a spreadsheet.
        </p>
      </div>
      <ul className="flex flex-col gap-5">
        {features.map(({ icon: Icon, title, description }) => (
          <li key={title} className="flex gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-background">
              <Icon className="size-4" />
            </span>
            <div className="flex flex-col gap-0.5">
              <p className="font-medium text-sm">{title}</p>
              <p className="text-muted-foreground text-sm">{description}</p>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
