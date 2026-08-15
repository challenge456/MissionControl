export interface TraceObservationRecord {
  _id: string;
  parentObservationId?: string;
  name: string;
  type: string;
  status: "RUNNING" | "SUCCESS" | "FAILED";
  startedAt: number;
  endedAt?: number;
  durationMs?: number;
  [key: string]: unknown;
}

export interface TraceObservationNode extends TraceObservationRecord {
  children: TraceObservationNode[];
  depth: number;
}

export function buildObservationTree(observations: TraceObservationRecord[]): TraceObservationNode[] {
  const nodes = new Map<string, TraceObservationNode>();
  for (const observation of observations) nodes.set(String(observation._id), { ...observation, _id: String(observation._id), children: [], depth: 0 });
  const roots: TraceObservationNode[] = [];
  for (const node of nodes.values()) {
    const parent = node.parentObservationId ? nodes.get(String(node.parentObservationId)) : undefined;
    if (parent && parent._id !== node._id && !wouldCreateCycle(parent, node, nodes)) parent.children.push(node);
    else roots.push(node);
  }
  const assignDepth = (node: TraceObservationNode, depth: number) => {
    node.depth = depth;
    node.children.sort(byStartTime);
    node.children.forEach((child) => assignDepth(child, depth + 1));
  };
  roots.sort(byStartTime).forEach((root) => assignDepth(root, 0));
  return roots;
}

export function flattenObservationTree(nodes: TraceObservationNode[]): TraceObservationNode[] {
  return nodes.flatMap((node) => [node, ...flattenObservationTree(node.children)]);
}

export function timelinePosition(input: {
  traceStartedAt: number;
  traceEndedAt?: number;
  observationStartedAt: number;
  observationEndedAt?: number;
  observationDurationMs?: number;
}) {
  const traceEnd = Math.max(input.traceEndedAt ?? Date.now(), input.traceStartedAt + 1);
  const traceDuration = traceEnd - input.traceStartedAt;
  const startedAt = Math.min(Math.max(input.observationStartedAt, input.traceStartedAt), traceEnd);
  const endedAt = Math.min(Math.max(input.observationEndedAt ?? (input.observationDurationMs !== undefined ? startedAt + input.observationDurationMs : traceEnd), startedAt), traceEnd);
  const leftPercent = ((startedAt - input.traceStartedAt) / traceDuration) * 100;
  const widthPercent = Math.max(((endedAt - startedAt) / traceDuration) * 100, 0.75);
  return { leftPercent, widthPercent: Math.min(widthPercent, 100 - leftPercent) };
}

export function formatDuration(ms?: number): string {
  if (ms === undefined || !Number.isFinite(ms)) return "—";
  if (ms < 1_000) return `${Math.round(ms)}ms`;
  if (ms < 60_000) return `${(ms / 1_000).toFixed(ms < 10_000 ? 1 : 0)}s`;
  const minutes = ms / 60_000;
  if (minutes < 60) return `${minutes.toFixed(minutes < 10 ? 1 : 0)}m`;
  return `${(minutes / 60).toFixed(1)}h`;
}

export function formatTokens(value?: number): string {
  if (value === undefined || !Number.isFinite(value)) return "—";
  if (value < 1_000) return Math.round(value).toLocaleString();
  return `${(value / 1_000).toFixed(value < 10_000 ? 1 : 0)}k`;
}

export function displayEvalValue(value: number | boolean | string): string {
  if (typeof value === "boolean") return value ? "PASS" : "FAIL";
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : value.toFixed(2);
  return value;
}

function byStartTime(left: TraceObservationNode, right: TraceObservationNode) {
  return left.startedAt - right.startedAt || left.name.localeCompare(right.name);
}

function wouldCreateCycle(parent: TraceObservationNode, child: TraceObservationNode, nodes: Map<string, TraceObservationNode>) {
  let cursor: TraceObservationNode | undefined = parent;
  const visited = new Set<string>();
  while (cursor) {
    if (cursor._id === child._id || visited.has(cursor._id)) return true;
    visited.add(cursor._id);
    cursor = cursor.parentObservationId ? nodes.get(String(cursor.parentObservationId)) : undefined;
  }
  return false;
}
