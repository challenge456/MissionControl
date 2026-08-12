export interface RepositoryScope {
  includePaths: string[];
  excludePaths?: string[];
}

export interface RepositoryScopeViolation {
  path: string;
  reason: "OUTSIDE_APPROVED_SCOPE" | "EXCLUDED_BY_SCOPE" | "INVALID_PATH";
}

/**
 * Validate the complete Git change set before any commit is pushed. Scope
 * patterns are repository-relative glob patterns such as `apps/ui/**`.
 */
export function validateChangedFileScope(
  changedFiles: string[],
  scopes: RepositoryScope[]
): RepositoryScopeViolation[] {
  return [...new Set(changedFiles)]
    .sort()
    .flatMap<RepositoryScopeViolation>((candidate) => {
      const normalized = normalizeRepositoryPath(candidate);
      if (!normalized) {
        return [{ path: candidate, reason: "INVALID_PATH" }];
      }
      const included = scopes.some((scope) =>
        scope.includePaths.some((pattern) => matchesRepositoryGlob(normalized, pattern))
      );
      if (!included) {
        return [{ path: normalized, reason: "OUTSIDE_APPROVED_SCOPE" }];
      }
      const excluded = scopes.some((scope) =>
        scope.excludePaths?.some((pattern) => matchesRepositoryGlob(normalized, pattern))
      );
      return excluded
        ? [{ path: normalized, reason: "EXCLUDED_BY_SCOPE" }]
        : [];
    });
}

export function normalizeRepositoryPath(candidate: string): string | null {
  const normalized = candidate.trim().replace(/\\/g, "/").replace(/^\.\//, "");
  if (!normalized || normalized.startsWith("/") || normalized.includes("\0")) return null;
  const parts = normalized.split("/");
  if (parts.some((part) => !part || part === "." || part === "..")) return null;
  return parts.join("/");
}

export function matchesRepositoryGlob(candidate: string, rawPattern: string): boolean {
  const path = normalizeRepositoryPath(candidate);
  const pattern = normalizeScopePattern(rawPattern);
  if (!path || !pattern) return false;
  let expression = "";
  for (let index = 0; index < pattern.length; index += 1) {
    const character = pattern[index];
    if (character === "*" && pattern[index + 1] === "*") {
      if (pattern[index + 2] === "/") {
        expression += "(?:.*/)?";
        index += 2;
      } else {
        expression += ".*";
        index += 1;
      }
    } else if (character === "*") {
      expression += "[^/]*";
    } else if (character === "?") {
      expression += "[^/]";
    } else {
      expression += /[.+^${}()|[\]\\]/.test(character) ? `\\${character}` : character;
    }
  }
  return new RegExp(`^${expression}$`).test(path)
    || (!pattern.includes("*") && (path === pattern || path.startsWith(`${pattern}/`)));
}

function normalizeScopePattern(candidate: string): string | null {
  const normalized = candidate.trim().replace(/\\/g, "/").replace(/^\.\//, "").replace(/\/$/, "");
  if (!normalized || normalized.startsWith("/") || normalized.includes("\0")) return null;
  if (normalized.split("/").some((part) => !part || part === "." || part === "..")) return null;
  return normalized;
}
