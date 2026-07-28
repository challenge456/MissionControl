export const PRD_TASK_TYPES = [
  "CONTENT",
  "SOCIAL",
  "EMAIL_MARKETING",
  "CUSTOMER_RESEARCH",
  "SEO_RESEARCH",
  "ENGINEERING",
  "DOCS",
  "OPS",
] as const;

export type ParsedPrdTask = {
  title: string;
  description?: string;
  type: (typeof PRD_TASK_TYPES)[number];
  priority: 1 | 2 | 3 | 4;
  dependencyIndices?: number[];
};

type HeadingKind = "requirement" | "markdown" | "uppercase" | "numbered";

type Heading = {
  index: number;
  title: string;
  kind: HeadingKind;
};

const REQUIREMENT_HEADING = /^\s*(?:#{1,6}\s*)?(FR-\d+\s*:\s*.+?)\s*$/i;
const MARKDOWN_HEADING = /^\s*#{2,3}\s+(.+?)\s*$/;
const UPPERCASE_HEADING = /^[A-Z][A-Z0-9 &/()'-]{2,80}$/;
const NUMBERED_HEADING = /^\s*(\d+)\.\s+(.+?)\s*$/;

export function normalizePrdContent(content: string): string {
  return content.replace(/\r\n?/g, "\n").trim();
}

export function fingerprintPrdContent(content: string): string {
  const normalized = normalizePrdContent(content);
  let hash = 0x811c9dc5;

  for (let index = 0; index < normalized.length; index++) {
    hash ^= normalized.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export function derivePrdTitle(content: string): string {
  const normalized = normalizePrdContent(content);
  const productName = normalized.match(
    /(?:^|\n)\s*(?:\d+\.\s+)?Product Name\s*\n+\s*([^\n]+)/i
  )?.[1]?.trim();

  if (productName) return productName.slice(0, 120);

  const markdownTitle = normalized.match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (markdownTitle) return markdownTitle.slice(0, 120);

  return normalized.split("\n").find((line) => line.trim())?.trim().slice(0, 120) || "Imported PRD";
}

function isNumberedSectionTitle(title: string): boolean {
  const trimmed = title.trim();
  if (!trimmed || /[.!?;:]$/.test(trimmed)) return false;
  return trimmed.split(/\s+/).length <= 12;
}

function collectHeadings(lines: string[], kind: HeadingKind): Heading[] {
  const headings: Heading[] = [];

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index].trim();
    let title: string | null = null;

    if (kind === "requirement") {
      title = line.match(REQUIREMENT_HEADING)?.[1]?.trim() ?? null;
    } else if (kind === "markdown") {
      title = line.match(MARKDOWN_HEADING)?.[1]?.trim() ?? null;
    } else if (kind === "uppercase" && UPPERCASE_HEADING.test(line)) {
      title = line;
    } else if (kind === "numbered") {
      const match = line.match(NUMBERED_HEADING);
      if (match && isNumberedSectionTitle(match[2])) {
        title = `${match[1]}. ${match[2].trim()}`;
      }
    }

    if (title) headings.push({ index, title, kind });
  }

  return headings;
}

function inferTaskType(title: string): ParsedPrdTask["type"] {
  const text = title.toLowerCase();

  if (/(report|document|brief|readme|architecture)/.test(text)) return "DOCS";
  if (/(research|source|evidence|landscape|freshness|benchmark)/.test(text)) {
    return "CUSTOMER_RESEARCH";
  }
  if (/(governance|approval|policy|security|cost|economics)/.test(text)) return "OPS";
  return "ENGINEERING";
}

function inferPriority(title: string): ParsedPrdTask["priority"] {
  const requirementNumber = Number(title.match(/^FR-(\d+)/i)?.[1]);
  if (Number.isFinite(requirementNumber) && requirementNumber <= 3) return 2;
  return 3;
}

function tasksFromHeadings(
  lines: string[],
  headings: Heading[],
  maxTasks: number
): ParsedPrdTask[] {
  const seenTitles = new Set<string>();
  const tasks: ParsedPrdTask[] = [];

  for (let headingIndex = 0; headingIndex < headings.length; headingIndex++) {
    const heading = headings[headingIndex];
    const nextHeading = headings[headingIndex + 1];
    const description = lines
      .slice(heading.index + 1, nextHeading?.index ?? lines.length)
      .join("\n")
      .trim()
      .slice(0, 1500);
    const titleKey = heading.title.toLowerCase();

    if (seenTitles.has(titleKey)) continue;
    seenTitles.add(titleKey);
    tasks.push({
      title: heading.title.slice(0, 200),
      description: description || undefined,
      type: inferTaskType(heading.title),
      priority: inferPriority(heading.title),
    });

    if (tasks.length >= maxTasks) break;
  }

  return tasks;
}

export function parsePrdHeuristically(
  content: string,
  maxTasks = 20
): ParsedPrdTask[] {
  const normalized = normalizePrdContent(content);
  if (!normalized) return [];

  const lines = normalized.split("\n");
  const headingKinds: HeadingKind[] = [
    "requirement",
    "markdown",
    "uppercase",
    "numbered",
  ];

  for (const kind of headingKinds) {
    const headings = collectHeadings(lines, kind);
    if (headings.length > 0) {
      return tasksFromHeadings(lines, headings, maxTasks);
    }
  }

  return [];
}
