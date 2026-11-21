# The simple Hub — the strip-down, step by step

**Branch `feat/hub-simple-mode`, started 2026-11-21.** Jillienne: "completely
kill all the over-complicated features for this hub. Store it somewhere I can
bring back and reference at a later time, but the whole hub needs to be
stripped down to the most simplistic version." No toggle back to an advanced
mode — the earlier proposal for one was dropped the same day.

What a designer needs from it: share a link, from inside the repo (a branch
build) or outside it (Figma, a document), and say whether it is Design,
Research or PRD. Development stays for now.

## Where the advanced Hub is

Branch **`hub-advanced`** and tag **`hub-advanced-2026-11-21`**, both on
`7b83b7a5` — `main` as it stood before the strip. Netlify builds the branch
like any other, so the whole thing is viewable behind the site password.
Nothing is kept in this branch "just in case"; a restore is a checkout.

## The steps

| # | Step | Status |
|---|---|---|
| 1 | Save the advanced Hub whole: branch + tag, pushed | done |
| 2 | Six pages — Design (the Refinement board renamed) · Research · PRDs · Development · Done · Archive. Design rows match Research's compact shape; Cody off the roster; Hide → Archive, archived rows listed on the Archive page | done |
| 3 | Two routines. **"Share my work"** (anyone): branch if needed, checks, commit, push, one link to paste on Design, zero questions. **"Ship"** (Jillienne): a branch, a name or a Design link; the flag review, grouped by component and calling out any with more than one flag; per-flag yes/no; per decided flag, retire it by the archive convention; build, tests, fast-forward merge, push. A quiet **Demo build** link at the rail foot opens the product on main | done |
| 4 | Unwire the eight hidden sections by the archive convention, one Archive row each naming `hub-advanced` | |
| 5 | Retire the stage-only routines; keep `share-branch`, `archive-a-feature`, `dev-handoff-notes` | |
| 6 | One guide: Contributing as the intern's first day; the other two go with the advanced Hub | |
| 7 | Rewrite CLAUDE.md and `docs/` for the six-page Hub; replace the smoke test's pinned list | |

Each step pauses for Jillienne to clarify and tweak before the next.

## Step 2, what changed

- `SIMPLE_SECTIONS` in `UxDashboardPage.tsx` is the one place that decides
  what the rail draws; `DEFAULT_SECTION` is Design. Hidden sections' code
  still stands until step 4.
- The `demo` section is labelled Design. Its id, store and endpoint did not
  change, so the rows already on it and every `?section=demo` link survive.
- `DemoPanel`'s presentation is Research's: no product tag, no feature
  grouping, no Replaces, no big tile, compact row, Updated stamp, roster
  pills. Each is one line to put back.
- `DESIGNERS` is four names. The To Do Board's seed and the stage-card plugin
  roster match it (the seed runs once per store, so a seeded board keeps
  whoever it has).
- The kebab says Archive / Unarchive. The board has no "Show hidden" door;
  the Archive page mounts each board in `archiveView` and lists its archived
  rows under its own heading, with Unarchive and Edit. Research and PRDs are
  archivable too, server side as well.
- Found on the way: Research was silently writing a supersession the hidden
  Replaces control could not clear (`change` in `LinksPanel.tsx` gated on
  `showFeature`, not `showSupersedes`). Fixed.
- Tests of the hidden sections and of the old Refinement shape were removed;
  they live on `hub-advanced`.

## Step 3, what changed

- `.claude/skills/share-my-work/` and `.claude/skills/ship/` are the two
  routines. `share-branch`, `promote-to-refinement`, `release` and
  `ship-to-main` are aliases pointing at them.
- Ship's flag review replaces decide-defaults: the same two diffs
  (`FeatureFlagContext.tsx`, `dashboardVersions.ts`), grouped by the
  component each flag gates, with every component carrying more than one
  flag called out first. Then, per decided flag, the cleanup question:
  retire it — call sites take the winning path, the flag leaves the catalog
  and `REBRAND_FLAGS`, the losing file stays with an Archive row.
- The main guard's message now points at "share my work".
- The rail foot carries one Demo build link, above Appearance, opening
  `/dashboard-rebrand?demo=1&journey=full` in a new tab. Not a section.
- No Prototypes page: a demo link a designer wants to share is something
  they stitch together and put on Design.
