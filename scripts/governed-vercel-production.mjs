#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const COMMIT_SHA_PATTERN = /^[0-9a-f]{40}$/;

function parseArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key?.startsWith("--")) throw new Error(`Unexpected argument: ${key}`);
    if (key === "--confirm-production") {
      values.confirmProduction = true;
      continue;
    }
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for ${key}`);
    values[key.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = value;
    index += 1;
  }
  return values;
}

function required(values, key) {
  const value = values[key]?.trim();
  if (!value) throw new Error(`Missing required --${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`);
  return value;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: "utf8",
    input: options.input,
    env: process.env,
    maxBuffer: 10 * 1024 * 1024,
  });
  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || `${command} failed`).trim();
    throw new Error(detail.slice(0, 2_000));
  }
  return result.stdout.trim();
}

function parseJson(output, label) {
  try {
    return JSON.parse(output);
  } catch {
    throw new Error(`${label} did not return JSON.`);
  }
}

function convex(functionName, args, deployment, identityJson) {
  return parseJson(run("npx", [
    "convex",
    "run",
    functionName,
    JSON.stringify(args),
    "--deployment",
    deployment,
    "--identity",
    identityJson,
  ]), functionName);
}

function vercelApi(path, input) {
  const args = ["api", path];
  if (input !== undefined) args.push("-X", "POST", "--input", "-");
  return parseJson(run("vercel", args, input === undefined ? {} : { input: JSON.stringify(input) }), path);
}

function assertExactDeployment(inspect, providerDeployment, commitSha) {
  if (inspect.readyState !== "READY") throw new Error(`Vercel deployment is ${inspect.readyState ?? "not READY"}.`);
  if (inspect.target !== "production") throw new Error("Vercel deployment was not built for Production.");
  if (providerDeployment.meta?.githubCommitSha !== commitSha) {
    throw new Error("Vercel production deployment does not name the exact approved merge commit.");
  }
}

const values = parseArgs(process.argv.slice(2));
if (!values.confirmProduction) {
  throw new Error("Refusing production release without --confirm-production.");
}

const releaseId = required(values, "releaseId");
const projectId = required(values, "projectId");
const repositoryId = required(values, "repositoryId");
const productionEnvironmentId = required(values, "productionEnvironmentId");
const convexDeployment = required(values, "convexDeployment");
const identityJson = required(values, "identityJson");
const approvalRationale = required(values, "approvalRationale");
const vercelProjectId = required(values, "vercelProjectId");
const vercelProjectName = required(values, "vercelProjectName");
const githubRepositoryId = Number(required(values, "githubRepositoryId"));
const gitRef = required(values, "gitRef");
const commitSha = required(values, "commitSha").toLowerCase();
if (!COMMIT_SHA_PATTERN.test(commitSha)) throw new Error("--commit-sha must be a full Git commit SHA.");
if (!Number.isSafeInteger(githubRepositoryId)) throw new Error("--github-repository-id must be an integer.");

const eligibility = convex("factory/releases:getProductionEligibility", {
  projectId,
  repositoryId,
  candidateMergeCommitSha: commitSha,
}, convexDeployment, identityJson);
if (!eligibility.eligible || !eligibility.candidateVerified || eligibility.verifiedReleaseCount < 3) {
  throw new Error(`Production candidate is not eligible (${eligibility.blocker ?? "unknown"}).`);
}

convex("factory/releases:approveProductionDeployment", {
  releaseId,
  productionEnvironmentId,
  expectedMergeCommitSha: commitSha,
  rationale: approvalRationale,
}, convexDeployment, identityJson);

let project = vercelApi(`/v9/projects/${vercelProjectId}`);
if (project.autoAssignCustomDomains !== false) {
  throw new Error("Vercel auto-assignment of production domains must be disabled before governed deployment.");
}

let detail = convex("factory/releases:getDetail", { releaseId }, convexDeployment, identityJson);
if (detail.release?.productionState === "PROMOTED") {
  process.stdout.write(`${JSON.stringify({
    releaseId,
    commitSha,
    providerDeploymentId: detail.release.productionProviderDeploymentId,
    productionUrl: detail.release.productionDeploymentUrl,
    verified: true,
    productionState: "PROMOTED",
  }, null, 2)}\n`);
  process.exit(0);
}

let providerDeploymentId = values.providerDeploymentId?.trim()
  || detail.release?.productionProviderDeploymentId;
if (!providerDeploymentId) {
  const created = vercelApi("/v13/deployments?forceNew=1", {
    name: vercelProjectName,
    project: vercelProjectId,
    target: "production",
    gitSource: {
      type: "github",
      repoId: githubRepositoryId,
      ref: gitRef,
      sha: commitSha,
    },
  });
  providerDeploymentId = created.id;
  if (!providerDeploymentId) throw new Error("Vercel did not return a production deployment ID.");
  process.stderr.write(`Staged Vercel production deployment: ${providerDeploymentId}\n`);
}

const inspect = parseJson(
  run("vercel", ["inspect", providerDeploymentId, "--wait", "--timeout", "5m", "--json"]),
  "vercel inspect",
);
const deployment = vercelApi(`/v13/deployments/${providerDeploymentId}`);
assertExactDeployment(inspect, deployment, commitSha);
const origin = `https://${deployment.url}`;

if (detail.release?.productionState === "ELIGIBLE") {
  convex("factory/releases:configureProductionVerification", {
    projectId,
    environmentId: productionEnvironmentId,
    allowedOrigin: origin,
  }, convexDeployment, identityJson);
  convex("factory/releases:recordProductionDeployment", {
    releaseId,
    commitSha,
    provider: "vercel",
    providerDeploymentId,
    deploymentUrl: `${origin}/`,
    provenanceUrl: `${origin}/api/release`,
    smokeUrl: `${origin}/`,
    healthUrl: `${origin}/api/health`,
    idempotencyKey: `governed-production:${releaseId}:deploy:${providerDeploymentId}`,
  }, convexDeployment, identityJson);
  detail = convex("factory/releases:getDetail", { releaseId }, convexDeployment, identityJson);
}

let verified = detail.release?.productionState === "VERIFIED";
if (detail.release?.productionState === "DEPLOYED") {
  const verification = convex("factory/releases:verifyProductionDeployment", {
    releaseId,
  }, convexDeployment, identityJson);
  verified = verification.verified === true;
  if (!verified) {
    throw new Error(`Production verification failed (${verification.reason ?? "unknown"}); deployment was not promoted.`);
  }
  detail = convex("factory/releases:getDetail", { releaseId }, convexDeployment, identityJson);
}
if (detail.release?.productionState !== "VERIFIED") {
  throw new Error(`Production release is ${detail.release?.productionState ?? "unavailable"}, not VERIFIED.`);
}

project = vercelApi(`/v9/projects/${vercelProjectId}`);
if (project.targets?.production?.id !== providerDeploymentId) {
  run("vercel", ["promote", providerDeploymentId, "--yes", "--timeout", "5m"]);
  project = vercelApi(`/v9/projects/${vercelProjectId}`);
  if (project.targets?.production?.id !== providerDeploymentId) {
    throw new Error("Vercel did not make the verified deployment current.");
  }
}
const promotion = convex("factory/releases:recordProductionPromotion", {
  releaseId,
  providerDeploymentId,
  providerPromotionId: providerDeploymentId,
  evidenceUrl: `${origin}/`,
  humanConfirmed: true,
  idempotencyKey: `governed-production:${releaseId}:promote:${providerDeploymentId}`,
}, convexDeployment, identityJson);

process.stdout.write(`${JSON.stringify({
  releaseId,
  commitSha,
  providerDeploymentId,
  productionUrl: origin,
  verified,
  productionState: promotion.release?.productionState,
}, null, 2)}\n`);
