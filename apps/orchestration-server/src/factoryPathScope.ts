import path from "node:path";

export interface FrozenCodeScope {
  allowedPaths: string[];
  excludedPaths: string[];
}

export function validateChangedFileScope(changedFiles: string[], scope: FrozenCodeScope) {
  const normalized = Array.from(new Set(changedFiles.map(normalizeRepositoryPath).filter(Boolean))).sort();
  const outsideScope = normalized.filter((file) =>
    !scope.allowedPaths.some((pattern) => matchesRepositoryPattern(file, pattern))
    || scope.excludedPaths.some((pattern) => matchesRepositoryPattern(file, pattern))
  );
  return { ok: outsideScope.length === 0, changedFiles: normalized, outsideScope };
}

export function assertWorktreeBoundary(checkoutRoot: string, worktree: string) {
  const root = path.resolve(checkoutRoot);
  const target = path.resolve(worktree);
  const requiredRoot = path.join(root, ".mission-control", "worktrees");
  const relative = path.relative(requiredRoot, target);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("The Factory worktree must be attempt-specific and remain inside .mission-control/worktrees.");
  }
  return { checkoutRoot: root, worktree: target, worktreeRoot: requiredRoot };
}

export function normalizeRepositoryPath(value: string) {
  const normalized = value.replace(/\\/g, "/").replace(/^\.\//, "").replace(/\/+$/, "");
  if (!normalized || normalized.startsWith("/") || normalized.split("/").includes("..")) return "";
  return normalized;
}

export function matchesRepositoryPattern(file: string, rawPattern: string) {
  const pattern = normalizeRepositoryPath(rawPattern);
  if (!pattern) return false;
  if (!pattern.includes("*")) return file === pattern || file.startsWith(`${pattern}/`);
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, "\u0000")
    .replace(/\*/g, "[^/]*")
    .replace(/\u0000/g, ".*");
  return new RegExp(`^${escaped}$`).test(file);
}
