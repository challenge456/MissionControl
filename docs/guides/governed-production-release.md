# Governed Production Release

Mission Control promotes a Vercel production deployment only after the exact
merge has three-release staging qualification and a fresh human production
approval.

## Provider setup

Vercel production domain auto-assignment must be disabled. Git integration may
continue creating builds, but it is not allowed to point the production domains
at a new deployment. The Factory runner checks this provider setting and fails
before deployment if it is enabled.

The isolated Factory control plane stores Vercel's automation bypass secret as
`VERCEL_AUTOMATION_BYPASS_SECRET`. The secret is sent only to allowlisted HTTPS
`*.vercel.app` verification URLs and is never stored in release evidence.

## Authentication preflight

Before approving a Clerk-authenticated candidate:

1. Confirm `convex/auth.config.ts` uses the issuer paired with the deployed
   `VITE_CLERK_PUBLISHABLE_KEY`.
2. Confirm `VITE_AUTH_MODE=clerk` in both the staging and production Vercel
   environments and `MC_ALLOW_ANONYMOUS_COMPANY_CONTEXT` remains unset.
3. Configure `MC_BOOTSTRAP_OWNER_SUBJECT` with the exact first-owner Clerk user
   ID only while bootstrapping; email address matching is not authorization.
4. Sign in on the staged deployment and prove the governed Releases view loads
   through an authorized Convex query before promotion.
5. Keep production aliases unchanged until the staged production deployment
   passes provenance, smoke, health, and authenticated browser checks.

A Clerk development instance and `pk_test_...` key are acceptable only for an
internal production-path qualification. A public launch requires a production
Clerk instance, custom domain, `pk_live_...` key rotation, and a fresh governed
release through this same path.

## Release command

Run `node scripts/governed-vercel-production.mjs --confirm-production` with the
required release, Factory, Convex, GitHub, and Vercel identifiers shown by the
command's missing-argument errors. Supply the human identity JSON and a specific
approval rationale. Do not place either value in Git.

The runner performs one ordered transaction across provider boundaries:

1. Confirm the exact candidate is staging-verified and at least three distinct
   staging merge commits qualify.
2. Record fresh human production approval for that merge and environment.
3. Refuse to continue unless Vercel production auto-aliasing is disabled.
4. Create a Git-sourced Production deployment for the exact merge.
5. Record the provider receipt and independently verify production provenance,
   smoke, and health while the deployment is staged.
6. Promote that same deployment and record immutable promotion evidence.

Any failed verification leaves the release in production `DEPLOYED` and does
not call `vercel promote`.

## Rollback

Use `vercel rollback <last-known-good-production-deployment> --yes`, then call
`factory/releases:recordProductionRollback` with the restored full commit SHA,
provider rollback/deployment ID, Vercel evidence URL, rationale, explicit human
confirmation, and a unique idempotency key. A rollback moves the production
release to `ROLLED_BACK` and requires a corrective WorkOrder.

For an authentication failure, restore the last known-good production
deployment first. Do not enable anonymous company context. Record the provider
rollback receipt, verify the restored commit and health endpoint, and keep the
failed release evidence intact for diagnosis.
