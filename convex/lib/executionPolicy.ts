export function resolveApprovedVerificationCommands(args: {
  implementationPolicy?: { allowedCommands?: unknown };
  policyRules?: { allowedCommands?: unknown };
  constraints?: string[];
}) {
  const explicit = normalizeCommands(args.implementationPolicy?.allowedCommands);
  if (explicit.length > 0) return explicit;

  const policy = normalizeCommands(args.policyRules?.allowedCommands);
  if (policy.length > 0) return policy;

  return (args.constraints ?? [])
    .map((constraint) => constraint.match(/^Verification command:\s*(.+)$/i)?.[1]?.trim())
    .filter((command): command is string => Boolean(command));
}

function normalizeCommands(value: unknown) {
  return Array.isArray(value)
    ? value
        .filter((command): command is string => typeof command === "string")
        .map((command) => command.trim())
        .filter(Boolean)
    : [];
}
