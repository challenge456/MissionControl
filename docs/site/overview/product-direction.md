# Product direction

Mission Control is the operating system for human-directed, agent-executed
software development. Humans own intent, judgment, governance, and approval.
Agents own bounded execution, iteration, validation, recovery, and evidence
collection.

The product is organized around one authoritative chain:

`Mission → WorkOrder → Task → Attempt → evidence → pull request → release`

## V1 promise

A developer can define an outcome, approve a versioned plan, allow agents to
work safely through the day or overnight, and return to a review-ready pull
request with enough evidence to make a confident decision.

## Product principles

- Intent over activity.
- Exceptions over feeds.
- Evidence over assertions.
- Durable state over chat history.
- Policy before autonomy.
- Independent validation for material claims.
- Merge, deployment, activation, and production verification remain distinct.

## Immediate priorities

1. Complete the Mission plan, approval, revision, and WorkOrder-release journey.
2. Enforce authenticated identity, workspace authority, and separation of duties.
3. Bind execution to an approved repository, executor, environment, tools,
   secrets, budget, and recovery policy.
4. Unite criteria, tests, CI, security, UI proof, waivers, and production checks
   in one evidence gate.
5. Produce a durable review package linked to commits, changed files, pull
   requests, decisions, risks, uncertainty, and rollback.
6. Make overnight execution resumable, bounded, observable, and capable of
   escalating a precise decision packet.

## V1 boundary

Content operations, CRM, meetings, voice, virtual offices, hiring, and
demo-only intelligence are not primary V1 pillars. Experimental pages remain
Preview or Labs until they support the governed delivery lifecycle and meet the
same authorization, audit, recovery, and browser-evidence bar.

The canonical repository documents are:

- `docs/product/mission-control-north-star.md`
- `docs/product/mission-control-v1-product-strategy.md`
