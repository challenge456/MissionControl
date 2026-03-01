import { ExternalLink, FileText, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "./components/PageHeader";

const DOC_LINKS = [
  { title: "PRD V2",               path: "docs/PRD_V2.md",                          icon: "📋", description: "Product requirements" },
  { title: "App Flow",             path: "docs/APP_FLOW.md",                         icon: "🔄", description: "Application architecture" },
  { title: "Backend Structure",    path: "docs/BACKEND_STRUCTURE.md",               icon: "🏗️", description: "Backend overview" },
  { title: "Frontend Guidelines",  path: "docs/FRONTEND_GUIDELINES.md",             icon: "🎨", description: "UI/UX standards" },
  { title: "Tech Stack",           path: "docs/TECH_STACK.md",                      icon: "⚙️", description: "Technologies used" },
  { title: "Quick Start",          path: "docs/guides/QUICK_START_NOW.md",          icon: "🚀", description: "Get up and running" },
  { title: "Runbook",              path: "docs/runbook/RUNBOOK.md",                  icon: "📖", description: "Operations runbook" },
  { title: "Implementation Plan",  path: "docs/planning/IMPLEMENTATION_PLAN.md",   icon: "📝", description: "Implementation roadmap" },
];

const QUICK_LINKS = [
  { label: "GitHub Repository",    href: "https://github.com/jaydubya818/MissionControl",                    icon: "🐙" },
  { label: "Convex Dashboard",     href: "https://dashboard.convex.dev",                                     icon: "⚡" },
  { label: "Notion Workspace",     href: "https://notion.so",                                                icon: "📓" },
  { label: "Obsidian Vault",       href: "obsidian://open",                                                  icon: "🪨" },
  { label: "Vercel Dashboard",     href: "https://vercel.com/jaydubya818/mission-control-mission-control-ui", icon: "▲" },
  { label: "Vercel Deployment",    href: "https://mission-control-lb526p6dl-jaydubya818.vercel.app",         icon: "🚀" },
  { label: "Taskmaster Tasks",     href: "https://github.com/jaydubya818/MissionControl/blob/main/.taskmaster/tasks/tasks.json", icon: "✅" },
  { label: "Cursor IDE",          href: "cursor://",                                                          icon: "🖱️" },
];

export function DocsView() {
  return (
    <main className="flex-1 overflow-auto">
      <PageHeader title="Documentation" description="Project guides and technical references" />

      <div className="px-6 pb-6">
        {/* Doc grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-8">
          {DOC_LINKS.map((doc) => (
            <a
              key={doc.path}
              href={`/${doc.path}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block group"
            >
              <Card className="p-4 h-full flex items-center gap-3 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group-hover:bg-muted/30">
                <div className="h-10 w-10 rounded-xl bg-muted border border-border flex items-center justify-center text-xl shrink-0">
                  {doc.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{doc.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{doc.description}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
              </Card>
            </a>
          ))}
        </div>

        {/* Quick links */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Quick Links
          </h2>
          <Card className="divide-y divide-border">
            {QUICK_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target={link.href.startsWith("obsidian://") || link.href.startsWith("cursor://") ? "_self" : "_blank"}
                rel="noopener noreferrer"
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors group"
              >
                <span className="flex items-center gap-3 text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  <span className="text-base">{link.icon}</span>
                  {link.label}
                </span>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
              </a>
            ))}
          </Card>
        </div>
      </div>
    </main>
  );
}
