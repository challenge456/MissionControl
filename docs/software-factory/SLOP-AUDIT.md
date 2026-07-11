# UI Slop Audit (kill-ai-slop scan, 2026-07-11)

Baseline scan of `apps/mission-control-ui/src` — the de-slop worklist for the
page-redesign PRs. The v2 shell (`shellV2/`, `components/factory/`, v2 tokens)
scanned clean (1 false positive); all findings below are legacy-view debt.

## Binding rules for PRs 18–20 (and any view touched earlier)

- Migrate to v2 tokens; no new usage of `Neon*`, `GlassPanel`, glow shadows,
  gradient backgrounds, or `backdrop-blur`.
- Status = flat dot or StatusBadge + a word. No halos (slop 16).
- One radius scale (v2 tokens); no glass (19), no oversized shadows (20).
- Badges only for real state; kill decorative pills (22).
- Mono only for code, hashes, ids, scores (32).
- No invented-stat copy; fix `MissionModal.tsx:109` placeholder coaching
  "24/7 / 10x" (27).
- Uppercase micro-labels only for nav-rail sections and table headers.

## Defended choices (not slop — do not "fix")

- Inter + JetBrains Mono (approved plan §8, visual-reference match)
- Semantic status palette #32E875/#F3C744/#FF5C5C/#5E8BFF on real states
- Rail section labels in 11px uppercase (reference pattern)

## Baseline counts (rerun `node ~/.claude/skills/kill-ai-slop/scripts/scan.mjs apps/mission-control-ui/src` and drive to ~0 through PRs 18–20)

slop 03 warm ‘cozy’ palette  → neutral base + one warm accent
slop 04 default semantic palette  → one palette: neutrals + a couple of chosen states
slop 05 one-hue status box  → state in words; one muted accent on neutral
slop 06 gradients as atmosphere  → one flat bg; depth from a hairline
slop 09 decorative strikes & highlights  → strike for edits, underline for links
slop 10 kicker above every heading  → delete kickers that restate the heading
slop 11 full-sentence display headline  → few words big; specifics in a subline
slop 12 flat type hierarchy  → few steps, ≥1.25× between them
slop 13 highlighted keywords  → let structure carry emphasis
slop 15 emoji everywhere  → cut emoji from product copy
slop 16 glowing status dot  → flat dot + a word; no halo
slop 17 left-border callout  → one aside, rest is body
slop 18 pastel icon tiles  → labelled list with specifics
slop 19 max-radius / glassmorphism  → one small radius, solid surfaces
slop 20 oversized drop shadow  → tight elevation, never bigger than the element
slop 21 corners that don't nest  → inner = outer − padding
slop 22 badge / pill spam  → badges only for real status
slop 23 AI-drawn SVG icon  → a real, high-quality icon (a designer, or a strong image model)
slop 24 icon in a tint of itself  → no tinted tile; inherit text color
slop 25 springy hover  → transition what changes, 120–200ms, standard ease
slop 26 all-caps card grid  → show the one key thing fully
slop 27 invented stat row  → only measured, sourced numbers
slop 31 Inter everywhere  → compare faces; be able to say why this one
slop 32 tasteful-terminal  → mono for code only
→ 24 groups, 2010 hits. Confirm each by reading the code, then fix per references/fixes.md.
