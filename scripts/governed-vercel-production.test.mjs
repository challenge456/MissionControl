import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./governed-vercel-production.mjs", import.meta.url), "utf8");

test("production runner requires eligibility, exact deployment, and disabled auto-alias", () => {
  assert.match(source, /eligibility\.eligible/);
  assert.match(source, /candidateVerified/);
  assert.match(source, /verifiedReleaseCount < 3/);
  assert.match(source, /autoAssignCustomDomains !== false/);
  assert.match(source, /githubCommitSha !== commitSha/);
  assert.match(source, /inspect\.target !== "production"/);
  assert.match(source, /values\.providerDeploymentId/);
});

test("production runner verifies before promote and records the same provider deployment", () => {
  const verifyIndex = source.indexOf("factory/releases:verifyProductionDeployment");
  const promoteIndex = source.indexOf('["promote", providerDeploymentId');
  const recordIndex = source.indexOf("factory/releases:recordProductionPromotion");
  assert.ok(verifyIndex > 0);
  assert.ok(promoteIndex > verifyIndex);
  assert.ok(recordIndex > promoteIndex);
  assert.match(source, /if \(!verified\)/);
  assert.match(source, /providerPromotionId: providerDeploymentId/);
  assert.match(source, /project\.targets\?\.production\?\.id !== providerDeploymentId/);
});

test("production runner requires an explicit confirmation flag", () => {
  assert.match(source, /--confirm-production/);
  assert.match(source, /Refusing production release/);
});
