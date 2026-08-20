# Attempt credential revocation root cause

## Frozen failure

The prior hardened live cohort recorded exact OpenRouter deletion requests for all three Attempt keys. Two stale-key probes reached `401`; the bug-fix Attempt returned `200` six times. The qualification wrapper polled immediately and then every 750 ms, so its complete observation window was only about 3.75 seconds.

`GET https://openrouter.ai/api/v1/key` is the authenticated current-key endpoint. A `200` therefore proved that the deleted key still authenticated at that instant; this was not a probe against the public model catalog.

## Controlled timing qualification

One fresh, spend-capped (`$0.01`), five-minute Attempt key was created. Its non-secret hash and issue metadata were atomically journaled before deletion. The key was validated with `/api/v1/key`, deleted by its exact hash, and the deletion receipt was atomically journaled before stale-key polling.

| Absolute checkpoint | HTTP status | Interpretation |
| ---: | ---: | --- |
| Before delete | 200 | Control key authenticated |
| Immediate | 200 | Provider invalidation had not propagated |
| +1 second | 200 | Provider invalidation had not propagated |
| +5 seconds | 200 | Provider invalidation had not propagated |
| +15 seconds | 200 | Provider invalidation had not propagated |
| +30 seconds | 401 | Exact stale key rejected; stop |
| +60 seconds | Not called | Unnecessary after conclusive denial |

Raw evidence: `openrouter-revocation-timing.json`.

## Root cause and bounded semantics

OpenRouter accepted deletion synchronously, but authentication invalidation was observably eventually consistent for roughly 30 seconds. The old qualification limit was shorter than the real propagation interval. It incorrectly treated “deletion accepted but propagation pending” as a permanent revocation failure.

For an in-process Attempt lifecycle, `revoked: true` must now mean both:

1. the exact provider key hash was deleted (or already absent), and
2. the one-time stale secret was rejected with `401` or `403` by the authenticated current-key endpoint.

The allowed absolute confirmation checkpoints are 0, 1, 5, 15, 30, and 60 seconds, stopping at first denial. A `200` means propagation is pending. Other statuses are inconclusive. No denial by 60 seconds is a cleanup failure; VM teardown must still proceed. Recovery without the one-time secret can re-delete the durably journaled key hash and prove provider-side absence, but cannot claim a stale-secret rejection that it did not observe.

This changes no authority boundary: the management credential remains control-plane only, and the workload receives only its one-time Attempt inference key.
