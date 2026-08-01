export type AuthMode = "clerk" | "demo" | "legacy" | "invalid";

export interface AuthModeResolution {
  mode: AuthMode;
  error?: string;
}

export function resolveAuthMode({
  configuredMode,
  clerkPublishableKey,
}: {
  configuredMode?: string;
  clerkPublishableKey?: string;
}): AuthModeResolution {
  const normalizedMode = configuredMode?.trim().toLowerCase();

  if (!normalizedMode) {
    // Preserve existing deployments during the staged rollout. Production
    // operators must explicitly select Clerk after its deployment values are
    // configured; once selected, Clerk configuration still fails closed.
    return { mode: "legacy" };
  }

  if (!["clerk", "demo", "legacy"].includes(normalizedMode)) {
    return {
      mode: "invalid",
      error: "VITE_AUTH_MODE must be clerk, demo, or legacy.",
    };
  }

  if (normalizedMode === "clerk" && !clerkPublishableKey?.trim()) {
    return {
      mode: "invalid",
      error: "Clerk mode requires VITE_CLERK_PUBLISHABLE_KEY.",
    };
  }

  return { mode: normalizedMode as Exclude<AuthMode, "invalid"> };
}
