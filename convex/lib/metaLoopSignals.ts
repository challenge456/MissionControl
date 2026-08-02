const INSTRUCTION_PATTERN = /\b(ignore (?:all |any )?(?:previous|prior) instructions?|system prompt|developer message|tool call|exfiltrat(?:e|ion)|reveal (?:a )?secret)\b/i;

/** External review and CI text is evidence, never executable instruction. */
export function sanitizeMetaSignalText(value: string, maxLength = 1_000): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .split(/\r?\n/)
    .map((line) => INSTRUCTION_PATTERN.test(line) ? "[untrusted instruction removed]" : line)
    .join("\n")
    .trim()
    .slice(0, maxLength);
}
