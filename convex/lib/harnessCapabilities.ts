import type { HarnessCapabilityManifest, HarnessCapabilityRequirement } from "@mission-control/workflow-engine/harness-contract";
import {
  findKnownHarnessManifest,
  harnessCapabilityManifestDigest,
  harnessManifestIssues,
} from "@mission-control/workflow-engine/harness-contract";

export function resolveFrozenHarnessBinding(input: {
  executor: { adapter: string; version: string };
  harnessCapabilityManifest?: unknown;
  harnessCapabilityManifestDigest?: string;
  harnessEffectiveConfigSha256?: string;
}) {
  const known = findKnownHarnessManifest(input.executor.adapter, input.executor.version);
  const manifest = (input.harnessCapabilityManifest ?? known) as HarnessCapabilityManifest | undefined;
  if (!manifest || harnessManifestIssues(manifest).length > 0) {
    throw new Error(`Unknown or invalid harness adapter ${input.executor.adapter}/${input.executor.version}.`);
  }
  if (manifest.identity.adapterId !== input.executor.adapter || manifest.identity.adapterVersion !== input.executor.version) {
    throw new Error("Harness capability identity does not match the selected executor adapter.");
  }
  const digest = harnessCapabilityManifestDigest(manifest);
  if (input.harnessCapabilityManifestDigest && input.harnessCapabilityManifestDigest !== digest) {
    throw new Error("Frozen harness capability manifest digest is invalid.");
  }
  if (input.harnessEffectiveConfigSha256 && input.harnessEffectiveConfigSha256 !== manifest.effectiveConfigSha256) {
    throw new Error("Frozen harness effective configuration digest is invalid.");
  }
  return {
    adapter: input.executor.adapter,
    version: input.executor.version,
    capabilityManifest: manifest,
    capabilityManifestSha256: digest,
    effectiveConfigSha256: manifest.effectiveConfigSha256,
  };
}

export function factoryHarnessCapabilityRequirements(
  isolation: "READ_ONLY" | "WORKSPACE_WRITE",
): HarnessCapabilityRequirement[] {
  return [
    { capability: "filesystem.read", minimumSupport: "SUPPORTED" },
    ...(isolation === "WORKSPACE_WRITE"
      ? [{ capability: "filesystem.write", minimumSupport: "SUPPORTED" } as const]
      : []),
    { capability: "filesystem.pathAllowlist", minimumSupport: "PARTIAL" },
    { capability: "shell.available", minimumSupport: "PARTIAL" },
    { capability: "shell.processTreeCancellation", minimumSupport: "PARTIAL" },
    { capability: "git.status", minimumSupport: "SUPPORTED" },
    { capability: "git.diff", minimumSupport: "SUPPORTED" },
    { capability: "tools.structuredOutput", minimumSupport: "PARTIAL" },
    { capability: "headless.support", minimumSupport: "PARTIAL" },
    { capability: "cancellation.support", minimumSupport: "PARTIAL" },
  ];
}
