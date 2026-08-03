# Glossary

| Term | Definition |
| --- | --- |
| **Company / Tenant** | Human membership and authorization boundary above one or more workspaces (`tenants`) |
| **Workspace / Project** | Company-scoped operating context for Missions, repositories, work, and evidence (`projects`) |
| **Repository** | Explicitly authorized source-code target, code scope, and host binding (`workspaceRepositories`) |
| **Software Factory** | Thin, versioned configuration that references approved repositories, workflows, executors, agents, policies, budgets, and verifiers; not a second execution lifecycle |
| **Mission** | Desired outcome with constraints, sources, stop condition, budget, and a versioned plan (`missions`) |
| **Plan** | Versioned Mission proposal whose approved revision materializes governed WorkOrders (`missionPlans`) |
| **WorkOrder** | Versioned delivery contract that owns outcome, criteria, authority, and acceptance (`workOrders`) |
| **Task** | Operational unit assigned and transitioned while executing a WorkOrder (`tasks`) |
| **Attempt / WorkflowRun** | One bounded execution against a Task and WorkOrder version (`workflowRuns`, linked `runs`) |
| **Evidence** | Retained event, artifact, receipt, or external result supporting a criterion or decision |
| **VerificationReceipt** | Criterion-level evidence with producer/verifier and execution lineage |
| **Pull request** | External review artifact correlated to exact repository, branch/head, WorkOrder, and Attempt lineage |
| **Merge** | Separate human/GitHub decision that does not imply deployment or production verification |
| **Deployment** | Environment action for a merged version; distinct from activation and verification |
| **Activation** | Decision to expose or enable a deployed version for an intended scope |
| **Production verification** | Post-activation evidence that determines retain, disable, or rollback recommendation |
| **Context package** | Versioned skill, rule, or doc in the registry (`scope/name`) |
| **Context CDL** | Draft → publish → install → deprecate lifecycle for packages |
| **Harness** | Change review, merge gates, mutation testing, and wizard flows |
| **Meta-loop** | Feedback from production runs into new verifiers, scenarios, or skill updates |
| **ARM** | Agent Runtime Management — templates, versions, instances, identities |
| **EOS** | Engineering OS — outcome-oriented sidebar (Command Center preview) |
| **Human touch** | Manual override, approval, or takeover during agent execution |
| **Merge gate** | Composite PR readiness check (CI + lenses + mutation + policy) |
| **Receipt packet** | Pi/Hermes artifact bundle proving execution within envelope |

The authoritative hierarchy and current contract mapping are maintained in
[Mission Control Existing-System Assessment](../../mission-control-existing-system-assessment.md).

See also Tessl glossary for shared agentic vocabulary: https://docs.tessl.io/reference/glossary
