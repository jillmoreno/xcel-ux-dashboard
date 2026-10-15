---
name: promote-to-prototype
description: At merge time, decide which of a branch's changes become the PROTOTYPES baseline — the live XCEL product build stakeholders see. Run it ON THE PR, BEFORE MERGING. Diffs the branch against main, surfaces every flag whose committed default the branch changed (including flags gating new components) AND any change to the default DASHBOARD VERSION, asks per candidate whether — and to which variant — it becomes the baseline, asks which `wip` versions stakeholders should be able to pick, lists `surface: 'design'` controls separately because they never reach Prototypes, groups every candidate by the Prototypes ROW it reaches (end to end · Compass · invite) and asks for the scope owner's sign-off where that is not the caller, applies the FEATURE_FLAGS / dashboardVersions edits plus the docs note, commits, and reminds you to retire the branch's Refinement row. Each group is its scope OWNER's to decide and commit on the branch — Anjani for Compass, Jillienne for end to end and invite — and `maturity` is the version owner's; the default dashboard version and the merge itself (`ship-to-main`) are Jillienne's alone. Never moves tiles. Formerly "promote-to-demo" — that name still works as an alias. Trigger on "promote to prototype", "promote to demo", "merge this branch", "which changes go in the prototype", "ready to merge", "include in the prototype", "/promote-to-prototype", "/promote-to-demo".
version: 1.2.0
author: UX Design — Colibri
last_updated: 2026-10-14
status: active
---

# Skill: Promote to Prototype

The gate between a **designer's branch** and the **Prototypes** section — the
live XCEL product build at its committed flag baseline, which is what
stakeholders are sent to see on the public site.

## Vocabulary, because it moved on 2026-09-18

The XCEL UX Dashboard has two ungated sections and they are different acts:

| Section | What it is | How things get in |
|---|---|---|
| **Refinement** (section id `demo`) | The review inbox. A designer's branch, built by Netlify at its own URL, put up for the team (and, once flipped public, stakeholders) to discuss. | Added on the page — Refinement → Add link. No commit. |
| **Prototypes** | The product as it stands, one row per surface — `xcel-dashboard` → `/dashboard-rebrand?demo=1`, `xcel-compass` → the same build at `?section=compass` — rendering the committed defaults in `FEATURE_FLAGS`. | **This skill.** A flag-baseline change on `main`. Never a new row for a surface that has one. |

Until 2026-09-18 the product build sat in a section called Demo and this skill
was `promote-to-demo`. The logic is unchanged; the words are not. If you see
"Demo" in older commit messages or CLAUDE.md notes about the baseline, read
"Prototypes".

## ⚠ ONE row per SCOPE, every row the same build — and that is the point

Prototypes answers *what is the product right now?* for developers and
stakeholders. Until 2026-10-14 it held exactly one row, because two rows
pointing at two BUILDS of the same thing destroy the answer — everyone then
has to ask which one is real.

Since 2026-10-14 it holds one row per product SURFACE, declared in
`PROTOTYPE_SCOPES` in `prototypeFeatures.ts`: how a learner gets in (`invite`,
`xcel-invite`, Eric's End-to-End Demo at `/end-to-end-demo`), what they land in (`end-to-end`,
`xcel-dashboard`), where they study (`compass`, `xcel-compass`). Every row is
`main`'s build at `?demo=1` — the smoke test pins that none is a branch URL, an
`?ff=` pin, or a pinned `version=` — so there is still nothing to ask "which one
is real?" about. **This skill still never adds a row.** A row arrives when a
scope's build first exists on `main`, by Jillienne's hand, and this skill's
job on every branch after that is unchanged: decide which flag defaults ship.

So **"I need more than one of the SAME surface visible" is always a Refinement
job.** Refinement takes any number of rows, is authored in the browser with no
code or deploy, and is visible to stakeholders too (it carries no `gate`). A
row there can pin a configuration of `main` (`?demo=1&ff=…`), point at a branch
build, or open a `/review` page of one component's variants.

There is deliberately no "create a second prototype" skill. A new SCOPE is a
`PROTOTYPE_SCOPES` decision, not a skill; a second row for an existing scope is
Refinement. See CLAUDE.md, "Prototypes is the source of truth".

## ⚠ Every candidate is grouped by the ROW it reaches, and each row has an owner

Added 2026-10-14 with the second row. One list of flags was fine when there
was one row to reach; with three, "promote this" has to say promote it WHERE,
and the person whose design it is differs by row.

| Scope | Row | Owner — decides AND runs this skill for the group | Merges it |
|---|---|---|---|
| `end-to-end` | `xcel-dashboard` | Jillienne | Jillienne |
| `compass` | `xcel-compass` | **Anjani** | Jillienne |
| `invite` | `xcel-invite` | Jillienne | Jillienne |
| `atlas` | `xcel-atlas-learning` — Home and the learning pages, Eric's | **Eric** | Jillienne |
| `admin` | `xcel-admin-coming-soon` — a placeholder until the surface is built | Jillienne | Jillienne |

The table is `PROTOTYPE_SCOPES` in `prototypeFeatures.ts` — read `owner` from
there, not from here, if they ever disagree. The last column never varies: a
promotion is a commit on the designer's BRANCH and reaches nobody until
`ship-to-main`, which is Jillienne's. That is what makes the middle column safe
to hand out.

**How a candidate gets its scope** — mechanical first, judgement second:

```bash
grep -rl "<flag-key>" src/components src/pages | head     # where is it read?
```

- Read under `src/components/compass/` or `src/components/learning/Compass*`,
  or a key beginning `compass-` → **`compass`**.
- Read under `src/components/compass/AtlasHome*`, `src/components/compass/Hybrid*`
  or the Atlas My Courses / Certificates / Quick Links surfaces → **`atlas`**
  (row `xcel-atlas-learning`, Eric's): the learner's Home and the learning
  pages around it. ⚠ These reach the end-to-end row too — it is the same
  build — so list them under `atlas` (where the owner is) and cross-reference
  from end-to-end.
- Everything else, including every dashboard VERSION → **`end-to-end`**. The
  version decides which dashboard renders; that is the end-to-end row's
  question.
- ⚠ **A VERSION CAN REACH BOTH ROWS.** Hybrid draws Anjani's Compass rail, so a
  version swap moves what the Compass row opens as well. List it under
  end-to-end (where the lever is) AND name its Compass effect in the Compass
  group, so Anjani's sign-off covers it.
- Read under `src/pages/Invited*`, `src/pages/endToEndDemo.ts` or the
  `/end-to-end-demo` routes → **`invite`** (row `xcel-invite`, Jillienne's).
- **`admin` has no candidates yet.** Its row is a `coming-soon` placeholder;
  the surface is not built. When it is — a React route behind a flag — its
  flags are read under that route and this bullet names the path.

**What the owner column means in step 3.** The owner runs this skill on the
branch and answers their group's questions; a group the caller does NOT own
is listed, not asked — it waits for its owner, and `ship-to-main` will not
merge a branch with an undecided group. So Anjani runs this on her Compass
branch and commits her defaults; Jillienne ships. The one exception is the
shipper applying a decision the owner has already made — see step 3 — in
which case both names go in the commit body: *Compass decisions Anjani's,
applied by Jillienne.*

## ⚠ The baseline has TWO levers, and only one of them is a flag

Added 2026-10-05, after a promotion where the skill surfaced none of this and
the version change was caught by hand.

| Lever | Lives in | What it decides |
|---|---|---|
| **Flag defaults** | `FEATURE_FLAGS` in `src/context/FeatureFlagContext.tsx` | how a surface is drawn |
| **The default dashboard VERSION** | `defaultDiscoverabilityVersionFor()` in `src/data/dashboardVersions.ts` | **which dashboard renders at all** |

The version is the bigger of the two and it is **not in the flag catalog**, so
the first place anyone looks for "what does Prototypes render" does not contain
the answer. Every flag below it is read INSIDE whichever version is rendering —
several have no effect at all under the others.

**THREE different acts get called "promoting a version", and only the last two
are this skill's. Separate them before asking anything:**

| Act | What changes | This skill? |
|---|---|---|
| **Reachable** | a new entry in `DISCOVERABILITY_DASHBOARD_VERSIONS`, carrying `owner` | **No** — rides in on the merge. Do not ask. |
| **Pickable by stakeholders** | `maturity: 'ready'` on that entry | **Yes** — the usual case |
| **The default** | `defaultDiscoverabilityVersionFor` returns it | **Yes** — owner only |

- **Reachable** is just code merging. The version appears in the design site's
  picker immediately (that list is unfiltered) and in its owner's tab. Nothing
  about Prototypes moves. Do not raise it.
- **Pickable** is `maturity`, added 2026-10-05 with the version control on the
  demo bar. The demo site lists `ready` versions only
  (`dashboardVersionsForAudience`); absent means `wip`, so it fails CLOSED and a
  version nobody marked stays design-site-only. The design site badges those
  rows "Design site only" so a designer can see which is which. **This is the
  question most of Eric's work needs, and it is the version OWNER's** — Eric's
  for his versions — see the owner section below.
- **The default** is `defaultDiscoverabilityVersionFor`. That IS the baseline,
  and it is a SWAP — see below.

⚠ **ONLY ONE VERSION CAN BE THE DEFAULT, so promoting one DISPLACES another.**
Say that out loud at the point of asking, naming the version being displaced.
The designer tabs let two designers each own versions; Prototypes still has
exactly one answer, and an ask phrased as "add Eric's" when it means "replace
Jill's" is how that gets decided by accident.

### ⚠ Owner action — each group is its owner's; the default version and the merge are Jillienne's

Work out who is running this, once, before step 3 — **the PR's author first,
git identity second:**

```bash
gh pr view --json author --jq .author.login 2>/dev/null   # who opened the PR for this branch
git config user.email; git config user.name                # fallback when there is no PR yet
```

⚠ **THE PR AUTHOR IS THE SIGNAL, NOT THE COMMIT AUTHOR.** Anjani works through
the Claude web app, and its GitHub app writes her commits as
`Claude <noreply@anthropic.com>` — PR #3 (2026-09-28, her Compass prototype) is
exactly that: two commits by "claude", PR by `Anjanisatya5`. `git log` will
never name her, and `git config` inside her session may not either. The PR
does. The same is true of anyone else who commits through Claude on the web.

| Who | GitHub login | Git identity (fallback) | May decide |
|---|---|---|---|
| Jillienne | `jillmoreno` | `jilliennemoreno@gmail.com`, `jill.moreno@scorebuilders.com` | end-to-end and invite groups · `maturity` on her versions · **the default dashboard version** |
| Eric | `EnormanColibri` | `eric.norman@simplenursing.com` | the `atlas` group · `maturity` on his versions (`owner: 'eric'`) |
| Anjani | `Anjanisatya5` | none in the history — her commits are authored as Claude, see above | the Compass group |

No PR and a `Claude <noreply@anthropic.com>` git identity means the skill
cannot tell who is asking: say so and ask, naming the three, rather than
guessing from the branch name.

A group the caller does not own is **listed, not asked** — not "shall I?", not
"she will need to": raising a decision somebody cannot make reads as an
invitation. Write it in the hand-off as waiting on its owner and change
nothing in it. The default dashboard version is the same: if the caller is not
Jillienne, promote what they own and name that line as hers.

⚠ **THIS MOVED TWICE ON 2026-10-14, and both moves are worth having in front
of you.** At noon the whole skill became Jillienne-only, on a first reading of
"only I can promote". By the afternoon she had drawn the line where it belongs:
**only she promotes to MAIN** — `ship-to-main` — and a promotion is not that.
It is a commit of defaults on the designer's own branch that reaches no
stakeholder until she merges it, so the person whose design it is can make it.
What stays hers is the merge, and the one lever that chooses which dashboard
renders for everyone. The 2026-10-05 argument for leaving `maturity` with the
version's owner — gating it would leave designers unable to show anyone
anything — stands again, narrowed to the owner rather than anyone.

This is a skill-level boundary, not a hook: `dashboardVersions.ts` and
`FeatureFlagContext.tsx` are deliberately NOT in CLAUDE.md's protected table,
because adding a version or a flag — the reachable act above — is something
any designer must be able to do. The merge is where the lock is.

## ⚠ A DESIGN CONTROL IS NOT A BASELINE CANDIDATE

Added 2026-10-05 with the Design controls bar, and this is the mistake the skill
would otherwise make on the very next branch it sees.

A flag marked **`surface: 'design'`** renders on the GREEN bar — design site
only, scoped to one dashboard version. It never reaches Prototypes, under any
default, so "should this become the baseline?" is a question with no meaning
attached to it.

⚠ **AND ANSWERING IT "NO" DOES HARM.** A reviewer declining a design control the
way they decline a product flag sets `defaultEnabled: false` — which turns the
control OFF on its author's own bar, for a reason that had nothing to do with
their bar. The decline is not neutral here; it reaches into somebody else's
workspace.

So design flags are listed **separately** and asked a narrower question:

> *What should this default to when someone opens <version>?*

That is a statement about the author's own exploration. The usual answer is "as
the branch has it" — they chose it while building — and the reason to differ is
that the default is a bad STARTING POINT for a reviewer, not that it is wrong
for Prototypes.

### Moving a design control to the DEMO bar

The one genuinely new decision the two bars created, and it has no other home.

Sometimes a design axis turns out to be worth showing stakeholders — a font
switch that becomes part of the pitch. That means moving it from the green bar
to the amber one, which is:

1. drop `surface: 'design'` from the flag;
2. add a `DemoControlsBar` control and a `DEMO_CONTROLS` row for it;
3. decide its `maturity`, as for any demo control.

⚠ **OWNER ONLY.** Step 2 edits protected chrome — `DemoControlsBar.tsx` and
`demoControlMaturity.ts` are in CLAUDE.md's table. If the caller is not
Jillienne, do not ask: note it in the hand-off as hers, the way the default
version is noted.

⚠ **IT IS NOT DATA-ONLY**, unlike everything else this skill does. The bar has
to draw the control, which is component code. Say so when you raise it — this is
the one promotion that is a BUILD rather than an edit, and it should be a
separate commit from the flag decisions around it.

⚠ **ASK ONLY WHEN SOMEONE RAISES IT.** Do not offer this for every design flag
on a branch; most design controls are design controls permanently. A design
flag's presence is not a proposal.

## Core principle — promotion is a flag-baseline change, not a tile move

Every change starts invisible to Prototypes: behind a flag whose default on
`main` is OFF (or its non-demo variant). On the designer's BRANCH that default
is typically ON — that is what makes their branch deploy show the work. To
promote, you keep that ON default when the branch merges; to decline, you set
it back to the `main` value so the feature lands in the sandbox (Development
section, full site only) without reaching Prototypes.

**Do NOT change a feature or dev-handoff tile's `category` to `'prototype'`.**
Prototypes holds one row per scope and `UxDashboard.smoke.test.tsx` compares the
whole section in both directions, so a row it does not expect fails a test —
and a row without a `prototypeScope`, or a second row for a scope, fails
another. Feature tiles
(`kind: 'guided' | 'explore'`) and dev-handoff tiles live in the sandbox
sections permanently — that is where reviewers explore individual features and
read handoffs.

## When to run it

**On the PR, before merging.** Merging to `main` publishes to BOTH Netlify
sites, so the flag defaults have to be decided before the merge, not after.
The sequence is: designer opens PR → you run this skill on their branch →
it commits the decided defaults to the branch → you merge → both sites
rebuild → you retire the Refinement row.

## Steps

### 1. Establish the diff

```bash
git fetch origin main --quiet
git rev-parse --abbrev-ref HEAD                 # the designer's branch
git diff --stat origin/main...HEAD              # what changed
git diff origin/main...HEAD -- src/context/FeatureFlagContext.tsx
git diff origin/main...HEAD -- src/data/dashboardVersions.ts
```

⚠ **BOTH FILES, and the second one is the one this skill used to miss.** On
2026-10-02 a promotion moved XCEL's default from Testing to Testing 3 and this
step surfaced nothing — the change was spotted by reading the file by hand. A
diff that touches only the flag catalog will silently promote (or silently
decline) a whole dashboard.

In the `dashboardVersions.ts` diff, look for TWO things:

1. **`defaultDiscoverabilityVersionFor` returning a different id** — the swap.
2. **A version in the catalog whose `maturity` is not `ready`** — a candidate to
   make pickable. Check the whole list, not just the diff: a version added on an
   earlier branch and never marked is still sitting there design-site-only, and
   it will not show up in THIS diff at all.

A new ENTRY in `DISCOVERABILITY_DASHBOARD_VERSIONS` is not itself a candidate —
see the three acts above. It becomes one only through its `maturity`.

Read the `FeatureFlagContext.tsx` diff closely — that is where the rest of the
candidates are decided.

⚠ **SEPARATE THE `surface: 'design'` FLAGS OUT AS YOU READ.** They look like
ordinary new flags in the diff and they are not candidates for the baseline at
all — see the section above. Sorting them here is what stops them being asked
the wrong question in step 3. Also scan `--stat` for **new components** and grep each for the flag
key that gates it. New feature/dev-handoff tiles in `prototypeFeatures.ts` are
not promotion candidates themselves, but their `featureFlags` list is your
shortlist.

### 2. Build the candidate list

For each flag whose `defaultEnabled` / `defaultVariant` differs between the
branch and `main`, or which gates a new component, write one line: *what the
flag does*, *the `main` default*, *what the branch set it to*. Everything else
— refactors, fixes, sandbox-only tweaks, handoff docs, tile questions — is
no-promotion; note it and move on.

**If the default VERSION moved, it is the first candidate on the list**, and
write it differently from the flags: name the version arriving, the version
being **displaced**, and which of the flag candidates below it have no effect
under any other version. That last part is what makes the list readable — a
reviewer deciding four Testing 3 flags needs to know they stand or fall with
the version above them.

**Design controls go in their own short list**, named with the version they sit
on: *"`atlas-fonts` — Eric's, on the Atlas/Compass bar. Branch default: DM
Serif."* They are not baseline candidates and the list exists so a reviewer can
see what arrived without being asked to rule on it.

**Each `wip` version is its own candidate too**, written as what it actually
asks: *should stakeholders be able to pick this?* Name who owns it and what it
is, and say plainly that the default does not move — the most common answer is
"yes, pickable, and Testing 3 is still the baseline", and an ask that does not
make that obvious invites a no out of caution.

**Then group the whole list by scope** — end-to-end · Compass · invite — using
the rule in the scope section above, and head each group with its row and its
owner: *"Compass (`xcel-compass`) — Anjani decides, Jillienne applies."* A
candidate that reaches two rows appears under the one with the lever and is
cross-referenced from the other. An empty group is omitted, not shown empty.

### 3. Ask which to include (never assume)

Present the candidates with **AskUserQuestion**, `multiSelect: true`, one
option per flag, each label naming the flag and the baseline it would set.
Selecting nothing is a valid answer (everything lands sandbox-only). For a flag
with variants, confirm WHICH variant unless the branch makes it obvious.

**The DEFAULT version gets its OWN question, not a row in the multiSelect**,
because it is not the same kind of choice: it displaces something, the flags do
not. Phrase it as the swap it is — *"Prototypes renders X today; make it Y?"* —
and if the caller is not Jillienne, do not ask it at all: promote what they can
and name it in the hand-off as hers.

**`maturity` candidates go in a multiSelect of their own**, phrased as
visibility rather than promotion: *"Which versions should stakeholders be able
to pick?"*, with the current default named in the question so nobody reads a yes
as a swap.

**A group the caller does not own gets NO multiSelect.** It is written into
the hand-off as that owner's, with its candidates listed, and nothing in it
changes — the owner runs this skill on the branch for it. ⚠ **ONE EXCEPTION,
for the shipper only.** When Jillienne is running this on someone else's branch
at merge time and the owner has already decided — in Refinement, in a review,
in a message — she may apply it rather than send the branch back for a
redundant commit. Ask it as a sign-off, not a promotion: *"These reach the
Compass row, which is Anjani's. Has she decided these are what Compass should
be?"* — *yes, as the branch has them* · *yes, with changes (say which)* ·
*not yet — leave the group for her*. "Not yet" means the group is left exactly
as the branch has it and named as undecided, which `ship-to-main` treats as not
ready. Do not fold this into the promotion multiSelect: a reviewer ticking
boxes is deciding flags, and "did someone else agree" is not a flag.

**Design controls get asked only when a default looks like a bad starting
point** — *"`atlas-fonts` opens on DM Serif; is that where a reviewer should
start?"* If the branch's defaults look deliberate, say so and ask nothing. ⚠ DO
NOT put them in the baseline multiSelect: an option sitting in a list of
promotions reads as a promotion, and a reviewer declining one would turn off a
control on its author's own bar.

⚠ **NEVER PUT THE TWO IN ONE QUESTION.** "Promote Eric's version" means
`maturity` to one reader and the default to another, and the two answers are
unrelated — one adds a choice, the other takes the choice away from everyone by
making it unnecessary.

### 4. Apply the coordinated edits — on the branch

For each **approved** flag: leave (or set) `defaultEnabled` / `defaultVariant`
to the approved state in `FEATURE_FLAGS`.

For each **declined** flag: set it back to the `main` value. The designer
turned it on to see their work; that must not ride into `main` unreviewed.

For a group the caller does **not own**: touch nothing in it, approved or not.
Its defaults stay as the branch has them and the hand-off says the group is
waiting on its owner. That is a visible "not ready", and `ship-to-main`
checks for it — an undecided group is the one thing that must not merge,
because the owner's "on" would become the baseline by default.

**If the DEFAULT was approved** (owner only): leave
`defaultDiscoverabilityVersionFor` returning the branch's id. **If it was
declined**, set it back to `main`'s — a branch that made its own version the
default must have that reverted, or merging promotes a whole dashboard by
accident. This is the same rule as a declined flag and it is easier to miss,
because nothing in the flag catalog shows it.

**For each version made pickable**: set `maturity: 'ready'` on its entry. **For
each declined**, leave the field ABSENT rather than writing `maturity: 'wip'` —
absent is the default and says "not decided yet", while an explicit `wip` reads
as "decided against", and the two want different conversations next time.

⚠ **THE PICKER BADGES WHAT YOU LEAVE.** A version without `ready` shows "Design
site only" in `DashboardVersionsPanel` on the design site, so a decline is
visible to designers rather than silent. There is nothing to update by hand.

Then update the **COMMITTED REBRAND DEMO DEFAULTS** table — it lives in
[`docs/product-app.md`](../../docs/product-app.md), not in CLAUDE.md, which this
skill said until 2026-10-05. Two things there, not one:

- the table's own rows, for each promoted or declined flag;
- the paragraph ABOVE it that names which version a fresh `?demo=1` lands on.
  ⚠ That note has now been wrong twice in the same way — it still said "Testing"
  after the default had moved to Testing 3. It is the line readers trust most
  and the one nothing tests.

And — if the branch added a `NAV_SECTION_FLAGS` entry or changed one's
`defaultEnabled` — check `NavSectionFlags.test.tsx`, which asserts the whole
demo rail in order and will need the new row added deliberately.

**For a design control**: change `defaultVariant` / `defaultEnabled` only if the
starting point was actually discussed. ⚠ LEAVING IT ALONE IS THE DEFAULT ACTION
— unlike a declined product flag, which must be reverted. There is nothing to
revert: it never reached Prototypes.

⚠ **SET `owner` ON ANYTHING NEW** (2026-10-05, with the designer tabs). A flag
or version with no `owner` resolves to Jill, so a row authored by someone else
lands in HER tab of the Feature Flag panel and is invisible in theirs. It is not
a promotion decision — it is whose exploration the row belongs to — but this is
the moment it gets noticed, because nothing on screen says a row is in the
wrong tab.

⚠ **TESTS THAT PIN A BRANCH DEFAULT WILL FAIL, AND THAT IS THE POINT.** This
repo writes them on purpose, with a note saying this skill might flip them one
day. Flip them deliberately, record the decision in the test's own comment, and
keep driving the arm that lost — a declined arm is not a retired one.

Data-only. If a change cannot be surfaced in Prototypes without touching
component code, it is not ready; say so and stop.

### 5. Verify, then commit — to the branch

```bash
npm run build        # NOT `tsc --noEmit` — see ship-to-main for why
npx vitest run
```

⚠ **`npm run lint` IS NOT A GATE** and this step used to say it was. It reports
over a thousand pre-existing problems on `main`; a promotion that waited for it
to pass would never ship. Lint the files you touched and compare any finding
against `main`'s copy of the same file before calling it yours.

Commit the promotion as its own step so it is reviewable and reversible:

```bash
git add src/context/FeatureFlagContext.tsx src/data/dashboardVersions.ts \
        docs/product-app.md src/test/NavSectionFlags.test.tsx
git commit -m "prototype: promote <what> to the Prototypes baseline"
git push
```

The commit body is where the ARGUMENT goes — for each declined candidate, what
was actually wrong with it. "Not promoted" is worthless in six months; the
reason is what tells the next reader whether it still holds. **Head each
group with its row and the owner who decided it.** When the shipper applied an
owner's decision (the step 3 exception) name both — *Compass: Anjani's
decision, applied by Jillienne* — because the row's `owner` says who decides
and the commit's author says who typed, and the two being different is
exactly the fact worth recording.

Then tell Jillienne the branch is ready to merge, and summarise: which flag
defaults now ship in Prototypes, and what stayed sandbox-only.

### 6. After the merge — retire the Refinement row

The branch's Refinement row points at a branch URL that will go stale once the
branch is deleted, and the work it showed is now in Prototypes (or the sandbox).

**Run `retire-from-refinement`.** It is the skill for exactly this step: it reads
the row, asks whether the branch (and therefore the build) is kept or deleted,
writes the Archive row from what the reviewer wrote, and then removes the row —
in that order, so a crash between the two cannot lose the record.

If discussion is still live, leave the row and **edit** it to point at the merged
surface instead. Retiring it is for when the conversation is over.

## Guardrails

- **Never move tiles.** Promotion is a flag-baseline change, not a `category`
  edit. Prototypes has one row per scope and a two-directional test.
- **Diff `dashboardVersions.ts` too.** The default version is the biggest lever
  on the baseline and is not in the flag catalog.
- **Each group is its scope owner's — to decide AND to run this for.** Anjani
  promotes the Compass group on her own branch; Jillienne the end-to-end and
  invite groups. A group you do not own is listed and left alone.
- **Only Jillienne merges.** A promotion is a commit on a branch; `ship-to-main`
  is where it becomes the product, and that skill is hers. It refuses a branch
  with an undecided group.
- **The default dashboard version is Jillienne's alone.** The one lever that
  chooses what renders for everyone, in every scope.
- **Promoting a version displaces one.** Name the one being replaced when you
  ask, or the decision gets made by accident.
- **`maturity` and the default are DIFFERENT QUESTIONS.** One adds a choice for
  stakeholders; the other changes what the product is. Never one question.
- **`maturity` is the version OWNER's.** Eric marks Eric's versions pickable.
  Not anyone (the 2026-10-05 wording), not Jillienne alone (the noon
  2026-10-14 wording) — the owner.
- **A `surface: 'design'` flag is NOT a baseline candidate.** It never reaches
  Prototypes, and declining it the way you decline a product flag turns off a
  control on its author's own bar.
- **Moving a design control to the DEMO bar is owner-only and is a BUILD**, not
  a data edit — and only ever when someone raises it.
- **Ask, don't guess.** No flag default changes without an explicit yes; confirm
  variants.
- **Declined means reverted.** A branch that set a default ON for review must
  have it set back before merge, or merging promotes by accident.
- **Data-only.** `FEATURE_FLAGS`, `dashboardVersions.ts`, the `docs/product-app.md` note, and the rail test if the
  rail changed — nothing else.
- **On the branch, before the merge.** Never on `main` after: `main` is live on
  two sites.
- **Retire the Refinement row.** Say it every time.

## The other half

`promote-to-refinement` is the skill that PUT the row on Refinement in the
first place — from the designer's branch, opening the full site's Add form
prefilled with the branch URL. This skill takes it off. Run that one on the
branch when the work is ready to show; run this one on the PR when it is ready
to ship.
