import {
  canonicalHash,
  canonicalJson,
  sha256Hex as sharedSha256Hex,
} from "@mission-control/shared";

export interface GenomePayload {
  modelConfig: {
    provider: string;
    modelId: string;
    temperature?: number;
    maxTokens?: number;
  };
  promptBundleHash: string;
  toolManifestHash: string;
  provenance: {
    createdBy: string;
    source: string;
    createdAt: number;
  };
}

export const canonicalize = canonicalJson;
export const sha256Hex = sharedSha256Hex;

export function computeGenomeHash(genome: GenomePayload): string {
  return computeCanonicalHash(genome);
}

export function computeCanonicalHash(value: unknown): string {
  return canonicalHash(value);
}

export function verifyGenomeHash(genome: GenomePayload, hash: string): boolean {
  return computeGenomeHash(genome) === hash;
}
