---
name: promote-to-testing
description: The old name for `freeze-for-testing`. Freeze a branch onto the user-test site and hand back the participant and moderator links. Follow `.claude/skills/freeze-for-testing/SKILL.md`; it is the whole skill. Trigger on "/promote-to-testing".
version: 3.0.0
author: UX Design — Colibri
last_updated: 2026-11-01
status: alias
---

# Skill: promote-to-testing → `freeze-for-testing`

**Read `.claude/skills/freeze-for-testing/SKILL.md` and follow it.** Nothing else lives
here on purpose — two copies is how a step gets fixed in one and not the
other (the same reasoning as `promote-to-refinement` → `share-branch`).

Renamed 2026-11-01, when "promote" stopped being a designer word on this
project: it had named four different acts (share a component, share a
branch, decide a surface's defaults, freeze a test build), and only one of
them was anything like a promotion. The three *share* routines put work where
people can see it; `decide-defaults` records a decision; `freeze-for-testing`
pins a build; `release` is the design lead's. This name is kept because it
is in commit messages, archive rows and muscle memory, and it still works.
