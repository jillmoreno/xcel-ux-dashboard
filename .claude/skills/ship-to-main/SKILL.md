---
name: ship-to-main
description: The old name for `release`. Jillienne merges `stage` into `main` and pushes, so the Hub rebuilds. Follow `.claude/skills/release/SKILL.md`; it is the whole skill. Trigger on "ship it", "ship to main", "merge to main", "push this to main", "put this live", "/ship-to-main".
version: 2.0.0
author: UX Design — Colibri
last_updated: 2026-11-01
status: alias
---

# Skill: Ship to main → `release`

**Read `.claude/skills/release/SKILL.md` and follow it.** There is nothing
else here on purpose — two copies is how a step gets fixed in one and not the
other (the same reasoning as `promote-to-refinement` → `share-branch`).

## Why it was renamed (2026-11-01)

`ship-to-main` merged a *designer's branch* into main, which made Jillienne's
merge the first moment anyone could see decided work as the product. The
`stage` branch now sits in between: owners `/share-to-stage`, everyone can
open the stage build from Prototypes → Stage, and what Jillienne merges is
`stage`, not a branch. The act is the same; its input changed, and "release"
is what a stakeholder calls it.

⚠ **The one thing this alias must never do is the old thing.** If someone asks
to "ship feat/x to main", the answer is: share it to stage first
(`/share-to-stage`, the owner's step), then release. A branch never goes to
main directly any more — that skipped the one build everyone can see first.

The name is kept because it is written in places that outlive a rename —
`protect-main.mjs`'s message, three guides, and muscle memory. Both names
work; `/release` is the one the guides teach.
