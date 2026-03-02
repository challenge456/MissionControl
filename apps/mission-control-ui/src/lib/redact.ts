/**
 * Redact sensitive text when privacy/demo mode is on.
 * Use for project names, task titles, agent names in screenshots or demos.
 */

export function redact(value: string, isPrivate: boolean): string {
  if (!isPrivate) return value;
  return "●".repeat(Math.min(value.length, 12));
}
