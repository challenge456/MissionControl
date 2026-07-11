import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

/**
 * Feature-flag hook. Resolution:
 *   1. `VITE_FLAG_<KEY>` env override ("true"/"1" = on) — for CI and local dev
 *   2. Convex `featureFlags` table (global scope)
 *   3. false while loading or when the flag is unknown
 *
 * Key transform for the env override: dots/dashes → underscores, uppercased.
 * e.g. `ui.shell.v2` → `VITE_FLAG_UI_SHELL_V2`.
 */
export function useFlag(key: string): boolean {
  const envKey = `VITE_FLAG_${key.replace(/[.-]/g, "_").toUpperCase()}`;
  const envValue = (
    import.meta.env as unknown as Record<string, string | undefined>
  )[envKey];
  const hasEnvOverride = envValue !== undefined;

  const remote = useQuery(
    api.featureFlags.isEnabled,
    hasEnvOverride ? "skip" : { key }
  );

  if (hasEnvOverride) {
    return envValue === "true" || envValue === "1";
  }
  return remote ?? false;
}
