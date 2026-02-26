import { motion } from "framer-motion";
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
        "relative flex items-center h-12 px-2 border-b border-border bg-background/95 backdrop-blur-sm",
        className
      )}
      aria-label="Command center navigation"
    >
      <div className="flex items-center flex-1 overflow-x-auto">
        {/* Brand mark */}
        <div className="hidden lg:flex items-center gap-2 pl-3 pr-5 mr-2 border-r border-border/60 shrink-0">
          <div className="h-6 w-6 rounded-lg bg-primary flex items-center justify-center shadow-sm">
            <Crosshair className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-xs font-bold tracking-widest uppercase text-foreground/70">
            MC
          </span>
        </div>

        {/* Nav items */}
        <div className="flex flex-1 min-w-0">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={cn(
                  "relative flex-1 flex items-center justify-center gap-1.5 h-12 min-w-[52px] px-2",
                  "text-[11px] font-semibold tracking-wide uppercase",
                  "transition-all duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background rounded-md",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                {/* Active background pill */}
                {isActive && (
                  <motion.div
                    layoutId="command-nav-bg"
                    className="absolute inset-x-0.5 inset-y-1.5 rounded-md bg-primary/10"
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  />
                )}

                <Icon className={cn("h-3.5 w-3.5 shrink-0 relative", isActive && "drop-shadow-sm")} />
                <span className="hidden md:inline relative">{item.label}</span>
                <span className="hidden sm:inline md:hidden relative">{item.shortLabel}</span>

                {/* Bottom indicator */}
                {isActive && (
                  <motion.div
                    layoutId="command-nav-active"
                    className="absolute inset-x-2 bottom-0 h-[2.5px] rounded-full bg-primary"
                    style={{ boxShadow: "0 0 6px currentColor" }}
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
