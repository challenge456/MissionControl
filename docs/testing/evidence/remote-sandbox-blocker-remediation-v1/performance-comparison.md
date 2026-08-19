# Hardened image performance comparison

The hardened run did not reach supervisor or Codex startup, so it cannot quantify baked-Codex startup consistency. Unknown phases remain `null`; they are not reported as zero.

| Workload | Candidate allocation ms | Candidate readiness ms | Candidate startup ms | Candidate execution ms | Candidate teardown ms | Candidate total cycle ms | Prior preview total cycle ms |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Bug fix | 12,983 | 1,293 | null | null | null | 23,102 | 88,900 |
| Security policy | 3,793 | 1,182 | null | null | null | 13,613 | 89,437 |
| Data migration | 3,424 | 1,146 | null | null | null | 13,081 | 230,971 |

The candidate total-cycle measurements end after fail-closed bootstrap cleanup and are therefore not comparable to successful prior workload cycles. The prior Preview evidence did not expose startup separately; that historical field remains `null` rather than being inferred from readiness or execution.
