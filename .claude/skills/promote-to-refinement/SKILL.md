---
name: promote-to-refinement
description: The old name for `share-branch`. Put the branch you are on in front of the team — check it, commit, push, wait for the build, and open Refinement's Add form prefilled. Follow `.claude/skills/share-branch/SKILL.md`; it is the whole skill. Trigger on "promote to refinement", "add this to refinement", "share this branch", "put this up for review", "/promote-to-refinement".
version: 2.1.0
author: UX Design — Colibri
last_updated: 2026-10-16
status: alias
---

# Skill: Promote to Refinement → `share-branch`

**Read `.claude/skills/share-branch/SKILL.md` and follow it.** There is nothing
else here on purpose: two copies is how a step gets fixed in one and not the
other, which is the same reasoning that makes `netlify/lib/linkBoard.ts` one
factory for four boards rather than four hand-copied functions.

## Two renames, and the second one was forced

**2026-10-15 — `promote-to-refinement` → `share`** (Jillienne: *"can we make
promote to refinement an easier command, like share"*).

**2026-10-16 — `share` → `share-branch`**, because `/share` NEVER LOADED. The
bare name is Claude Code's own, so typing `/share` reached Claude's feedback
flow and the skill was not offered at all — not listed, not invocable, silently.
It had been written into CLAUDE.md and both guides for a day before anyone
noticed, because the plain-English triggers ("share this branch") kept working
the whole time and hid it.

⚠ **THE LESSON IS THE CLASS OF NAME, not this name.** A skill named after a
word the harness already owns does not error — it disappears. If a skill ever
seems not to exist, check whether its name collides before looking anywhere
else: the tell is that every sibling skill is listed and that one is not.

The name on THIS file is kept because it is written down in places that outlive
a rename — the Contributing guide, `docs/gateway.md`, `promote-to-prototype`'s
closing step, and three designers' muscle memory. `/promote-to-refinement` has
always worked and still does. `/share-branch` is shorter; `/share` is not ours.
