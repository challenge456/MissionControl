import * as path from "node:path";

const PERSONA_NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;
const MAX_PUBLIC_ERROR_LENGTH = 500;

/** Resolve a persona only inside the configured persona directory. */
export function resolvePersonaPath(personaDirectory: string, personaName: unknown): string {
  if (typeof personaName !== "string" || !PERSONA_NAME_PATTERN.test(personaName)) {
    throw new Error("Persona name must contain only letters, numbers, underscores, and hyphens");
  }

  const root = path.resolve(personaDirectory);
  const candidate = path.resolve(root, `${personaName}.yaml`);
  const relative = path.relative(root, candidate);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Persona path is outside the configured persona directory");
  }

  return candidate;
}

/** Keep operator-facing errors useful without returning credentials or host paths. */
export function safeClientError(error: unknown, fallback = "Request failed"): string {
  const raw = error instanceof Error ? error.message : typeof error === "string" ? error : fallback;
  const withoutControls = raw.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ");
  const withoutPem = withoutControls.replace(
    /-----BEGIN [^-\r\n]+-----[\s\S]*?-----END [^-\r\n]+-----/g,
    "[REDACTED CREDENTIAL]"
  );
  const withoutKnownTokens = withoutPem
    .replace(/\bgh[pousr]_[A-Za-z0-9]{36,}\b/g, "[REDACTED CREDENTIAL]")
    .replace(/\bAKIA[0-9A-Z]{16}\b/g, "[REDACTED CREDENTIAL]")
    .replace(/\bsk-(?:proj-)?[A-Za-z0-9_-]{24,}\b/g, "[REDACTED CREDENTIAL]")
    .replace(/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, "[REDACTED CREDENTIAL]");
  const withoutHeaders = withoutKnownTokens.replace(
    /\b(authorization|cookie)\b\s*[:=]\s*(?:bearer\s+)?[^,;\r\n]+/gi,
    "$1=[REDACTED]"
  );
  const withoutSecrets = withoutHeaders.replace(
    /\b(authorization|cookie|token|secret|password|api[-_ ]?key|private[-_ ]?key)\b\s*[:=]\s*([^\s,;]+)/gi,
    "$1=[REDACTED]"
  );
  const withoutPosixPaths = withoutSecrets.replace(
    /(?:\/Users|\/home|\/private|\/tmp|\/var|\/opt|\/srv)\/[^\s,;:)]+/g,
    "[REDACTED PATH]"
  );
  const redacted = withoutPosixPaths.replace(/[A-Za-z]:\\[^\s,;:)]+/g, "[REDACTED PATH]").trim();
  return (redacted || fallback).slice(0, MAX_PUBLIC_ERROR_LENGTH);
}
