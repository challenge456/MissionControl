import { cn } from "@/lib/utils";
import {
  Home,
  Crosshair,
  Bot,
  MessageSquare,
  FileText,
  Radio,
  BookOpen,
  Code2,
  ShieldCheck,
  LayoutGrid,
  type LucideIcon,
} from "lucide-react";
import type { CommandSection } from "../TopNav";

interface CommandNavItem {
  id: CommandSection;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
}

const navItems: CommandNavItem[] = [
  { id: "home", label: "Home", shortLabel: "Home", icon: Home },
  { id: "ops", label: "Operations", shortLabel: "Ops", icon: Crosshair },
  { id: "agents", label: "Agents", shortLabel: "Agents", icon: Bot },
  { id: "chat", label: "Chat", shortLabel: "Chat", icon: MessageSquare },
  { id: "content", label: "Content", shortLabel: "Content", icon: FileText },
  { id: "comms", label: "Comms", shortLabel: "Comms", icon: Radio },
  { id: "knowledge", label: "Knowledge", shortLabel: "KB", icon: BookOpen },
  { id: "code", label: "Code", shortLabel: "Code", icon: Code2 },
  { id: "quality", label: "Quality", shortLabel: "QC", icon: ShieldCheck },
  { id: "platform", label: "Platform", shortLabel: "Platform", icon: LayoutGrid },
];

interface CommandNavProps {
  activeSection: CommandSection;
  onSectionChange: (section: CommandSection) => void;
  className?: string;
}

export function CommandNav({
  activeSection,
  onSectionChange,
  className,
}: CommandNavProps) {
  return (
    <nav
      className={cn(
        "relative flex items-center gap-3 border-b border-line bg-rail px-3 py-2",
        className
      )}
      aria-label="Command center navigation"
    >
      <div className="relative flex min-w-0 flex-1 items-center overflow-x-auto">
        <div className="hidden shrink-0 items-center gap-3 rounded-xl border border-line bg-surface-1 px-3 py-2 xl:flex">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface-2 text-ink-secondary">
            <Crosshair className="h-4 w-4" />
          </div>
          <div className="leading-none">
            <div className="text-[11px] font-medium text-ink-muted">
              Command Grid
            </div>
            <div className="text-sm font-semibold text-ink">
              SellerFi Ops
            </div>
          </div>
        </div>

        <div className="ml-3 flex min-w-0 flex-1 rounded-lg border border-line p-0.5">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={cn(
                  "relative flex h-9 min-w-[64px] flex-1 items-center justify-center gap-2 rounded-md px-2.5",
                  "text-[12.5px] font-medium",
                  "transition-colors duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                  isActive
                    ? "bg-surface-2 text-ink"
                    : "text-ink-secondary hover:text-ink"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="relative h-3.5 w-3.5 shrink-0" />
                <span className="relative hidden md:inline">{item.label}</span>
                <span className="relative hidden sm:inline md:hidden">{item.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
