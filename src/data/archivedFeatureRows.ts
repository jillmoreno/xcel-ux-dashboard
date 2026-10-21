/**
 * ROWS REMOVED FROM `PROTOTYPE_FEATURES`, kept verbatim and UNREFERENCED — the
 * archive convention (CLAUDE.md): unwire it, keep the file, write the
 * `ARCHIVED_ITEMS` row. Nothing imports this module; it compiles so the blocks
 * stay honest against the types, and so a restore is a cut-and-paste back into
 * `PROTOTYPE_FEATURES` at the marked spot (plus the placement map in
 * `UxDashboard.smoke.test.tsx`), never a rewrite.
 *
 * 2026-10-15 — four rows, all Jillienne's call on the preview the day the
 * Designers group was retired. From Explorations, `xcel-lms` and
 * `xcel-admin-tool` ("remove this"). From Development, `xcel-course-entry` and
 * `atlas-home-course-card` ("remove these 2 items in development, they were
 * not ready"), taking with them the two handoff component specs the first one
 * referenced. Each has its own `archivedItems.ts` row: `desktop-platform-row`,
 * `admin-tool-row`, `course-entry-handoff`, `home-course-card-handoff`.
 */
import type { DevHandoffComponent, PrototypeFeature } from './prototypeFeatures'

/** Mirrors the un-exported constant in `prototypeFeatures.ts`, so the rows
 *  below read exactly as they did there. */
const PROTOTYPE_BASE = '/prototypes'

/* ─── The Testing home screen's course-entry pair ──────────────────────────
 *
 * Declared ABOVE `PROTOTYPE_FEATURES` because they are referenced inside it and
 * `const` is not hoisted for use at module-evaluation time — moving these below
 * the array is a TDZ crash at import, not a lint nit.
 *
 * ⚠ `quickSummary` AND `userStory` ARE DELIBERATELY UNSET on both. The handoff
 * skill's rule: the Quick Summary is the designer's own words and is ASKED FOR,
 * never inferred from the code, and an invented user story reads as a decision
 * nobody made. Un-authored, each renders its own "add your notes here" box —
 * an honest gap. Filling them in from this file would be the one failure on the
 * page nobody would think to check.
 * ───────────────────────────────────────────────────────────────────────── */

const COURSE_HEADER_HANDOFF: DevHandoffComponent = {
  id: 'course-progress-header',
  /* Opens on ON TRACK — the state that shows every part this component has
     (figure, rule, both stat pairs). The 0% state omits three of them, so it is
     the wrong frame to lead with even though it is the fixture's default. */
  previewUrl:
    '/dashboard-rebrand?version=discoverability-testing&ff=dashboard-progress-state:progress-on-track',
  order: 1,
  name: 'Course Progress Header',
  tabLabel: 'Course header',
  badge: 'NEW',
  badgeDate: '2026-09-24',
  location:
    'src/components/membership/v5/MembershipOverview.tsx (the `narrowHeader` branch, ~line 689) + `.cre-course-header-narrow` in src/styles/tokens.css',
  summary:
    'The band at the top of the Testing home screen: cover art, the COURSE PROGRESS eyebrow, the course name, and a stat row carrying the completion figure and the remaining-time / lessons-completed pairs. It is the page’s statement of where the learner stands.',
  variants: [
    {
      name: 'Not Started · 0%',
      when: '`dashboard-progress-state: not-started` — `headerPct` resolves 0.',
      detail:
        'NO percentage figure and no left rule: `showHeaderPercent` is `headerPct > 0`, and the rule plus its 15px inset belong to the figure, so with nothing on its left the stat pairs start at the row’s edge. The text column also gains `HEADER_BAR_RESERVE` (10px) of top padding to hold the space the absent progress bar would occupy, so the title does not jump when progress begins.',
      why: 'A percentage figure at 0% occupies the most prominent slot on the band to say nothing. Dropping it lets the course NAME lead, which is the useful fact before any work has been done.',
      action: 'Details → (opens the course overview). No progress-specific control.',
    },
    {
      name: 'On Track · ~63%',
      when: '`dashboard-progress-state: progress-on-track`.',
      detail:
        'The figure leads the stat row, separated from the pairs by a 1px `--color-neutral-300` rule. In the narrow column the pairs stack, so the rule spans both lines and reads as grouping them against the figure.',
      why: 'The figure earns its slot the moment it is non-zero, and the rule beside it is what stops it reading as a fourth stat pair rather than the row’s headline.',
      action: 'Details →',
    },
    {
      name: 'At Risk · ~15%',
      when: '`dashboard-progress-state: progress-at-risk`.',
      detail:
        '⚠ STRUCTURALLY IDENTICAL to On Track — same figure, same pairs, same rule. The header carries NO risk treatment: no colour change, no chip, no warning. The warning lives in the Study Pace tile below ("The work left won’t fit before your access ends."). Documented because "at risk" sounds like it should change this component and does not.',
    },
    {
      name: 'Completed · 100%',
      when: '`dashboard-progress-state: complete-100`.',
      detail:
        'Figure reads 100%, the lessons pair reads `42 of 42`. A completion band renders BELOW the header (target date / time remaining / completed count, plus a Completed chip) — that band is part of the band component, not this header.',
      why: 'The same layout holding a finished number is the point — a learner should be able to see the shape they have been watching for weeks resolve, rather than be moved to a different component.',
      action: 'Details →',
    },
    {
      name: 'Completed · nothing queued ⚠',
      when: '`dashboard-progress-state: completed-empty`.',
      detail:
        '⚠ NEEDS DESIGN. The header is correct here (100%, 42 of 42) but the card below it disagrees — see the decisions log. Also note the cover art does not render in this fixture, so the header falls to its text-only layout with no art column. Whether that is intended has not been decided.',
    },
    {
      name: 'Expired',
      when: '`dashboard-progress-state: progress-expired`.',
      detail:
        '⚠ THIS COMPONENT DOES NOT RENDER. The whole band is replaced by a dark "Current Progress" card (Expired chip, expiry date, progress-at-expiry, Begin New Cycle). Listed so the absence reads as a decision rather than a gap — see the decisions log.',
    },
  ],
  designSpec: {
    tokens: [
      { role: 'Course name', token: '--font-heading, --color-text-primary' },
      { role: 'Eyebrow (COURSE PROGRESS)', token: '--font-body (via .cre-eyebrow-ink)' },
      { role: 'Stat figure', token: '--font-heading, --color-text-primary' },
      { role: 'Stat caption', token: '--font-body, --color-text-tertiary' },
      {
        role: 'Figure rule + pair dots',
        token:
          '--color-neutral-300 — the "line you can actually see". ⚠ NOT --color-border-subtle, documented in source as 1.29:1 light / 1.38:1 dark, i.e. a rule that vanishes in one theme.',
      },
      { role: 'Cover radius', token: '--radius-md (top-right and bottom-left only; the other two are 0)' },
    ],
    states: [
      'Figure present / absent (`headerPct > 0`) — takes its left rule and 15px inset with it.',
      'Lessons pair present / absent (`headerTotal > 0`).',
      'Cover present / errored / absent.',
      'Narrow (Testing) vs wide layout — a `narrowHeader` boolean, true only for `dashboardLayout === "testing"`.',
    ],
    responsive: [
      '≤1100px: `.cre-course-header-narrow` flips `flex-direction` to column and the cover stacks above the text, left-aligned. The stretched cover height is removed at the same breakpoint.',
      'Above 1100px: row, cover 130px wide with height stretched to the header’s content.',
      '⚠ The breakpoint rule is scoped to `.cre-course-header-narrow`, so it applies to the Testing layout ONLY. The wide layout has no responsive rule of its own.',
      'No motion.',
    ],
    sources: [
      'src/components/membership/v5/MembershipOverview.tsx — `narrowHeader`, `headerStats`, `showHeaderPercent`, `COURSE_HEADER_COVER` (130), `COURSE_HEADER_COVER_GAP` (16), `HEADER_BAR_RESERVE` (10)',
      'src/styles/tokens.css — `.cre-course-header-narrow` and its 1100px query',
      'src/data/dashboardProgressFixtures.ts — every state’s numbers',
    ],
  },
  statesMatrix: [
    { question: 'What if: Loading?', answer: '⚠ NOT DESIGNED. No skeleton or placeholder exists; the band renders once fixtures resolve. Needs a design before build.' },
    { question: 'What if: No cover art?', answer: '`onError` substitutes the path default. A fixture with no cover at all renders text-only — ⚠ NOT DESIGNED as an intentional state.' },
    { question: 'What if: No category breakdown?', answer: 'Lessons pair omitted; the time-remaining pair renders alone.' },
    { question: 'What if: Long course title?', answer: 'Wraps to two (or more) lines. The stat row moves down; the figure stays beside its pairs.' },
    { question: 'What if: 0% progress?', answer: 'Figure, rule and inset all absent. 10px top padding reserved in the text column.' },
    { question: 'What if: 100% + nothing queued?', answer: '⚠ NEEDS DESIGN. Header is correct; the card below contradicts it. See the decisions log.' },
    { question: 'What if: Expired?', answer: '⚠ COMPONENT DOES NOT RENDER — a different surface replaces the band. Decided, not a gap.' },
    { question: 'What if: Narrow viewport (≤1100px)?', answer: 'Column layout, cover above text, stretched height removed.' },
  ],
  edgeCases: [
    'Long course titles wrap to two lines and push the stat row down; the row does not reflow and the figure stays with its pairs.',
    'Missing cover art: `onError` swaps to the path’s default image once, then stops. A fixture with no cover at all (`completed-empty`) renders the text column with no art — undesigned.',
    'A path with no category breakdown drops the lessons pair rather than showing a zero denominator.',
    'Below 1100px the cover stacks ABOVE the text and the stretched height comes back off — the rule lives in the stylesheet precisely so the media query can undo it; an inline `alignSelf` would beat the query while looking correct in code.',
  ],
}

const JUMP_BACK_IN_HANDOFF: DevHandoffComponent = {
  id: 'jump-back-in-card',
  /* Opens on NOT STARTED — the shape the card is least often seen in and the
     one whose copy was argued over most. The other two are a click away on the
     Live Preview tab. */
  previewUrl:
    '/dashboard-rebrand?version=discoverability-testing&ff=dashboard-progress-state:not-started',
  order: 2,
  name: 'Jump Back In Card',
  tabLabel: 'Jump Back In',
  badge: 'NEW',
  badgeDate: '2026-09-24',
  location: 'src/components/learning/JumpBackInWidget.tsx (rendered by LearnerFocusedBand.tsx:651)',
  summary:
    'The card directly under the course header that gets the learner into the work. Three shapes — not started, in progress, complete — each with its own eyebrow, body and CTA label. It is the primary action on the home screen.',
  variants: [
    {
      name: 'Not started · "Let’s get started"',
      when: '`course.progress` is 0 or absent, and `complete` is false.',
      detail:
        'Eyebrow "Let’s get started", CTA "Start course". The lesson line, chapter title and estimate all still render — the learner is being pointed at Lesson 1, Part 1 of 3. ⚠ The eyebrow, the CTA and the landmark name ALL change together: a card reading "Let’s get started" must not announce itself to a screen reader as "Jump back in".',
      why: '"Jump Back In", "Resume" and a hidden lesson line all assume there is a place to jump back TO. At 0% there is not — naming it as a return trip is the product describing a history the learner does not have.',
      action: '"Start course" → opens Lesson 1, Part 1.',
    },
    {
      name: 'In progress · "Learning With Compass - Jump Back In"',
      when: '`course.progress > 0` and `complete` is false.',
      detail:
        'CTA "Resume". Lesson number, part number, chapter title and the estimate all render. This is the shape At Risk uses too — the card carries no risk treatment.',
      why: 'The learner’s actual position is the single most useful thing the home screen knows. Naming the lesson and chapter is what makes the button a continuation rather than a gamble.',
      action: '"Resume" → opens the current chapter.',
    },
    {
      name: 'Complete · "Review Course Material"',
      when: '`complete` is true (fed by the persona’s `renewalReady`).',
      detail:
        'CTA "Review course". The lesson line, chapter title and estimate are ALL dropped and replaced by a single line, "All coursework complete" — none of the three answers anything at 100%: there is no lesson you are on, and an estimate to finish something finished is a figure with nothing behind it.',
      why: 'The card stops being a way forward and becomes a door back into material already covered — which is a real need before an exam, and a different one from resuming.',
      action: '"Review course" → reopens the course material.',
    },
    {
      name: 'No course',
      when: '`course` is undefined.',
      detail:
        'Renders `null`. The Study Journey below it stands on its own, so the column does not collapse.',
    },
    {
      name: 'Complete · nothing queued ⚠',
      when: '`dashboard-progress-state: completed-empty` — 100% progress but `renewalReady` false.',
      detail:
        '⚠ NEEDS DESIGN — and this is a defect, not just an undesigned state. The card takes its IN-PROGRESS branch at 100%, offering "Resume" and "Lesson 42 · Part 1 of 3" beside a header reading "42 of 42 lessons COMPLETED". Root cause is in the decisions log: `complete` is fed by a persona flag, not by progress.',
    },
  ],
  designSpec: {
    tokens: [
      { role: 'Card surface', token: '--color-surface-card' },
      { role: 'Card border', token: '--color-primary-100 (top / right / bottom, 1px)' },
      { role: 'Left accent stroke', token: '--color-primary-400 (6px)' },
      {
        role: 'Eyebrow ink',
        token:
          '--color-text-secondary via .cre-eyebrow-ink. ⚠ NOT tertiary: tertiary is correct at 6.19:1 on the Study Journey’s white card, but this card is a tinted recess where it falls to 3.83:1 — under AA for 10px text. Secondary holds 4.6:1 on this fill.',
      },
      { role: 'Chapter title', token: '--font-body (⚠ NOT --font-heading — see the decisions log), --color-text-primary' },
      { role: 'Lesson / part line', token: '--font-body, --color-text-secondary' },
      { role: 'Estimate line', token: '--font-body, --color-text-secondary' },
      { role: 'Separator dot', token: '--color-neutral-300 (3px round)' },
      { role: 'CTA fill', token: 'linear-gradient(135deg, --color-primary-500, --color-primary-600)' },
      { role: 'CTA radius', token: '--radius-md' },
    ],
    states: [
      'Not started / in progress / complete — eyebrow, body and CTA label change together.',
      'Absent course → renders null.',
      'Chapter number and part number are independently optional.',
    ],
    responsive: [
      'The content row is flex with the CTA at `flexShrink: 0`; the title column absorbs every width change.',
      'CTA stays 44px tall — the minimum comfortable touch target — with 20px horizontal padding.',
      '⚠ No breakpoint of its own. The card inherits whatever width its column gives it; it has not been designed below the 1100px point where the header above it restacks.',
      'No motion.',
    ],
    sources: [
      'src/components/learning/JumpBackInWidget.tsx',
      'src/components/membership/v5/LearnerFocusedBand.tsx:651 — the call site and the `complete={renewalReady}` thread',
      'src/data/dashboardProgressFixtures.ts:933 — `renewalReady: variant === "complete-100"`',
      'src/components/learning/widgetStyles.ts — `widgetCardRuledStyle`, `widgetEyebrowStyle`',
    ],
  },
  statesMatrix: [
    { question: 'What if: Loading?', answer: '⚠ NOT DESIGNED. No skeleton exists. Needs a design before build.' },
    { question: 'What if: No course?', answer: 'Renders null. The Study Journey below stands on its own.' },
    { question: 'What if: No chapter number?', answer: 'Lesson line omitted; chapter title and estimate still render.' },
    { question: 'What if: No part number?', answer: 'Lesson line renders without "Part N of 3" and without its dot.' },
    { question: 'What if: Long chapter title?', answer: 'Wraps; the CTA stays centred against the column and tracks it.' },
    { question: 'What if: At Risk?', answer: 'Identical to the in-progress shape. The warning lives in the Study Pace tile, not here.' },
    { question: 'What if: 100% + nothing queued?', answer: '⚠ DEFECT / NEEDS DESIGN. Renders the in-progress shape ("Resume", "Lesson 42") at 100%. See the decisions log.' },
    { question: 'What if: Expired?', answer: '⚠ COMPONENT DOES NOT RENDER — a different surface replaces the band. Decided, not a gap.' },
    { question: 'What if: Resume target missing?', answer: '⚠ NOT DESIGNED. `onResume` is optional and silently no-ops when absent.' },
  ],
  edgeCases: [
    'No course at all → the component renders nothing rather than an empty card.',
    'Long chapter titles wrap to two lines; the CTA tracks the title because the row is centre-aligned rather than pinned.',
    'Chapter number absent → the lesson line is omitted; the title still renders.',
    'Part number absent → the lesson line renders without the "Part N of 3" half and without its separator dot.',
    '⚠ 100% with `renewalReady` false → the in-progress shape renders at 100%. Undesigned; see the decisions log.',
  ],
}

export const ARCHIVED_FEATURE_ROWS: PrototypeFeature[] = [
  {
    id: 'xcel-lms',
    title: 'XCEL LMS — Desktop Platform',
    accent: 'blue',
    icon: 'monitor',
    blurb:
      'The dashboard project’s overlapping surfaces assembled into one desktop product and re-skinned to XCEL — the dark left rail, the Current Learning Path band, the Study Calendar, My Courses, Certificates, Recommended and the Catalogue. Structure is STC; colour is a primary ramp derived from the XCEL wordmark red over a charcoal rail. A provenance toggle overlays each card with the real component it came from, so "what actually overlaps" is checkable rather than asserted.',
    tileBlurb:
      'The dashboard surfaces that already overlap FinServ, assembled as one desktop product on XCEL brand colour. Provenance toggle names every component.',
    kind: 'explore',
    // `explore` normally reads "Full platform" on the home row; these open ONE
    // document each, so the label is corrected rather than left overclaiming.
    kindLabel: 'Standalone HTML',
    status: 'ready',
    category: 'exploration',
    pinned: true,
    externalUrl: `${PROTOTYPE_BASE}/xcel-lms-desktop.html`,
    livePreviewUrl: `${PROTOTYPE_BASE}/xcel-lms-desktop.html`,
    brands: ['xcel'],
  },
  {
    id: 'xcel-admin-tool',
    title: 'XCEL Admin Tool — Forked Roster',
    accent: 'blue',
    icon: 'grid',
    blurb:
      'The admin platform itself, forked from PartnerHub’s single-file app rather than rebuilt: the PartnerHub wordmark replaced by plain-text “Admin Tool”, a scope chip naming the admin’s own subtree root, and three columns added — Paid by, Seat, and a deadline-derived Risk that collapses PartnerHub’s five status COUNT columns into the one per-learner answer flow 06 asks for. Three view presets (Who is stuck · Invite follow-up · Seats) re-scope and re-sort the same rows, each on its own URL hash, and the learner panel gains an admin brief: compliance, seat and payer, activity, exam attempts. The self-paid variant is held behind a visible gate rather than guessed.',
    tileBlurb:
      'PartnerHub forked to an agency admin tool. Three columns, three presets over one roster, and the learner panel rewritten as an admin brief.',
    kind: 'explore',
    kindLabel: 'Standalone HTML',
    status: 'ready',
    /* NOT the Admin Prototypes row — 2026-10-14. It was promoted for an hour
       and put back: Jillienne had not meant the fork to be hooked up as the
       product's admin door, and a document row would have needed a hole in the
       public build's `/prototypes/*` block to be openable at all. The Admin
       row is the `xcel-admin-coming-soon` placeholder in Prototypes; this
       stays the exploration it always was. */
    category: 'exploration',
    externalUrl: `${PROTOTYPE_BASE}/xcel-admin-tool.html`,
    livePreviewUrl: `${PROTOTYPE_BASE}/xcel-admin-tool.html`,
    brands: ['xcel'],
  },
  {
    id: 'xcel-course-entry',
    title: 'Course Header & Jump Back In — Testing Version',
    accent: 'blue',
    icon: 'grid',
    blurb:
      'The two blocks a learner meets first on the Testing version of the home screen: the COURSE PROGRESS header (cover art, course name, the percentage figure and the stat pairs) and the card directly under it that gets them into the work. Both are driven by one flag — `dashboard-progress-state` — and neither is a fixed layout: the header drops its figure at 0%, and the card changes its eyebrow, its body and its CTA across three shapes. Documented together because a developer cannot build either one correctly without knowing what the other is saying at the same moment.',
    tileBlurb:
      'The COURSE PROGRESS header and the Jump Back In card on the Testing home screen — three shapes each, driven by one progress flag.',
    kind: 'guided',
    status: 'ready',
    category: 'dev-handoff',
    /* READY-FOR-DEV, so the row lands in DEVELOPMENT — `sectionOf()` reads
       `devStatus` BEFORE `category`, and `dev-handoff` as a category falls
       through to Design on its own. A handoff whose whole purpose is being
       picked up by engineering belongs in Development even while two of its
       questions are open; those are flagged in the decisions log, which is the
       right place for them, not a section that hides the row from the people
       it was written for. */
    /* ⚠ NOT READY, and that is the STANDING RULE, not a judgement about this
       row: everything reaches developers as not ready unless someone says it is
       ready (2026-09-24). Two questions in the decisions log are still open, so
       it would be this anyway — but it would be this regardless. Change it to
       `ready-for-dev` only when Jillienne says so. */
    devStatus: 'not-ready',
    brands: ['xcel'],
    /* ⚠ NO `to`, AND NO `externalUrl` — DELIBERATELY. A guided feature's row
       must fall through to its own gateway: the home row's href is
       `externalUrl ?? to ?? '/prototype/<id>'` (UxDashboardPage), so EITHER
       field set here hijacks the row and sends it somewhere that is not the
       handoff. It shipped with a `to` for one commit and did exactly that —
       clicking the row opened the dashboard instead of the notes.

       `pages` below is what feeds the Live Preview tab and the row thumbnail
       (`primaryPreviewSrc` reads `pages[0]` ahead of `to`), so nothing is lost
       by leaving both off. */
    /* One link per progress state, because the whole point of this handoff is
       what changes BETWEEN them.

       ⚠ NO `?chrome=off` — it was here for one commit and was wrong. It strips
       ALL prototype chrome, the demo controls bar included, so "Open live
       preview" landed on a page with no way to change anything. Whoever opens
       one of these wants to move between the states, not look at one of them.

       Leaving the chrome ON also means each site shows the bar it is supposed
       to: the DEMO site renders only the `ready` controls and the DESIGN site
       renders all of them, decided by `maturity` in `demoControlMaturity` —
       so these links need no per-site variants to get that right. */
    pages: [
      {
        label: 'Not Started · 0%',
        note: 'No percentage figure, no progress bar. The card reads "Let’s get started".',
        to: '/dashboard-rebrand?version=discoverability-testing&ff=dashboard-progress-state:not-started',
      },
      {
        label: 'On Track · ~63%',
        note: 'The figure leads the stat row. The card reads "Learning With Compass - Jump Back In".',
        to: '/dashboard-rebrand?version=discoverability-testing&ff=dashboard-progress-state:progress-on-track',
      },
      {
        label: 'At Risk · ~15%',
        note: 'Same two shapes as On Track — the tiles BELOW carry the warning, not these.',
        to: '/dashboard-rebrand?version=discoverability-testing&ff=dashboard-progress-state:progress-at-risk',
      },
      {
        label: 'Completed · 100%',
        note: 'The card becomes a door back in: "Review Course Material" / "All coursework complete".',
        to: '/dashboard-rebrand?version=discoverability-testing&ff=dashboard-progress-state:complete-100',
      },
      {
        label: 'Completed · nothing queued ⚠',
        note: '⚠ THE DISAGREEMENT. Header says 100%; the card still says Resume. See the decisions log.',
        to: '/dashboard-rebrand?version=discoverability-testing&ff=dashboard-progress-state:completed-empty',
      },
      {
        label: 'Expired',
        note: 'Neither component renders — a different surface takes the band entirely.',
        to: '/dashboard-rebrand?version=discoverability-testing&ff=dashboard-progress-state:progress-expired',
      },
    ],
    devHandoff: {
      intro:
        'Two components from the Testing version’s home screen (`discoverability-testing`, which is XCEL’s DEFAULT — the bare `/dashboard-rebrand` route lands here). They sit one above the other in the same column and are documented together because they narrate the same fact: how far through the course the learner is. The header states it; the card acts on it. Every variant below is reachable from the Live Preview tab.',
      components: [],
      uiComponents: [COURSE_HEADER_HANDOFF, JUMP_BACK_IN_HANDOFF],
      decisions: {
        intro:
          'What was settled while building these, and the two things that are not settled. Questions are the headings, per the log’s own convention — the answer is the entry, not the title.',
        items: [
          {
            question:
              'At 100% with nothing queued, should the card say "Resume" or "Review course"?',
            decision:
              '⚠ UNRESOLVED, and it currently says Resume — which is almost certainly wrong. The card’s `complete` prop is fed by `renewalReady`, a PERSONA field set as `variant === "complete-100"` (dashboardProgressFixtures.ts:933). The `completed-empty` persona is 100% done but is NOT `renewalReady`, so the card falls to its `started` branch and offers "Resume" beside a header reading "42 of 42 lessons COMPLETED". Two independent sources for one fact — progress percentage and renewal readiness — and this is the state where they disagree. Fix is a product call, not a code call: either the card reads completion off progress like the header does, or "nothing queued" is genuinely a resume-able state and the header is the one that is wrong.',
            status: 'Needs weigh-in',
            owner: 'Product',
          },
          {
            question: 'Should either component render in the Expired state?',
            decision:
              'Today neither does — the whole band is replaced by a dark "Current Progress" card with an Expired chip and a Begin New Cycle CTA. That is a deliberate different surface rather than a variant of these two, and it is why Expired has no row in either states matrix. Recorded here so nobody adds an Expired variant to these components thinking it was an oversight.',
            status: 'Decided',
          },
          {
            question: 'Why does the card not repeat the progress bar?',
            decision:
              'It had one until 2026-09-17. The header directly above runs a full-width bar for the same course with the percentage beside it, so the card was the third statement of one number in one column. Removed with `PROGRESS_BAR_HEIGHT`, `progressTrackStyle` and `progressFillStyle`. `.cre-jbi-progress-fill` survives in tokens.css with no call site — kept because re-adding a bar is what would want it back.',
            status: 'Decided',
          },
          {
            question: 'Why is the chapter title in the BODY face when it looks like a heading?',
            decision:
              '`--font-body`, deliberately. The `dashboard-heading-font` flag re-points `--font-heading` to a serif, and under that variant this card was the one block setting a chapter name in Georgia. The chapter name is a row label like the Study Journey’s stop titles, which moved to the body face on the same grounds: the serif belongs to things that are headings.',
            status: 'Decided',
          },
          {
            question: 'Where does the CTA sit relative to the title?',
            decision:
              'On the title’s line, centred against the text column (`align-items: center`). It has been under the block, beside the title, top-right and at the foot. What the current position buys is that the button TRACKS the title as it wraps, instead of pinning to a card edge and drifting from the thing it acts on.',
            status: 'Decided',
          },
          {
            question: 'Is the "About 18 minutes" estimate real?',
            decision:
              'No — INVENTED, and named as such in code (`NY_LH_LESSON_MINUTES_INVENTED`). Nothing in the fixtures knows a lesson’s length. It is on the card because it was asked for; it reads from a constant whose name says what it is; and the tests that used to forbid the copy now pin it to that constant. A real build needs a real per-lesson duration or the line comes out.',
            status: 'Needs weigh-in',
            owner: 'Business',
          },
        ],
        openItems: [
          'The 100%-with-nothing-queued disagreement between the header and the card — a product call on which signal wins.',
          'Whether the "About N minutes" estimate ships at all, and if so where the number comes from.',
        ],
      },
      flagsNote:
        'One flag drives every variant in this handoff: `dashboard-progress-state` in `FEATURE_FLAGS`. Its six arms are `not-started`, `progress-on-track`, `progress-at-risk`, `progress-expired`, `complete-100` and `completed-empty`. It is prototype scaffolding — a real build reads progress from the learner’s record, and the flag exists so a reviewer can reach a state without one. The `?ff=` links on the Live Preview tab are read-only overrides and are never persisted.',
      alsoConsider: [
        {
          name: 'Study Pace tile',
          location: 'src/components/learning/StudyPaceTile.tsx',
          note: 'Sits directly below these two in the same column and reads the same progress state, changing from a preset chooser at 0% to an activity chart once studying has begun. Shares the eyebrow shape — one eyebrow across the three is what makes them read as a set, so a change to one is a change to all three.',
        },
        {
          name: 'Study Journey widget',
          location: 'src/components/learning/StudyJourneyWidget.tsx',
          note: 'The right-hand column beside both components. It counts the same coursework stops the card’s completion line counts, which is why that line counts the journey’s own stops rather than re-deriving a total — the two cannot disagree.',
        },
      ],
    },
  },
  {
    /*
     * THE FIRST XCEL ROW WITH HANDOFF NOTES (2026-09-24, Eric via
     * /dev-handoff-notes). One component, so it renders inline on the UI
     * Components tab. `devStatus: 'in-development'` routes it to DEVELOPMENT —
     * `sectionOf` checks devStatus before category.
     *
     * No `quickSummary` yet: the designer chose to leave it blank for now, so
     * the detail shows its "add your notes here" box. Do not write one.
     * No `userStory` either — none was agreed, and an invented one reads as a
     * decision.
     */
    id: 'atlas-home-course-card',
    title: 'Atlas/Compass — Home Course Card',
    accent: 'blue',
    icon: 'grid',
    blurb:
      'The Atlas/Compass home’s single course card, which replaces the Course Progress header and the Jump Back In card with one card that names the course, three facts and the next lesson.',
    tileBlurb:
      'One card for the current course on the Atlas home: title, exam date, time left, lessons done, the next lesson and one Begin Course action.',
    kind: 'guided',
    status: 'ready',
    category: 'dev-handoff',
    devStatus: 'in-development',
    brands: ['xcel'],
    // ONE route, on purpose: XCEL sells no membership (see `xcel-dashboard`),
    // so there is no non-member view to add. `version=` opens the Atlas/Compass
    // version, the only one that renders this card.
    pages: [
      {
        label: 'Atlas/Compass home',
        note: 'The card leads the left column. Use Demo Controls → Progress to move its figures.',
        to: '/dashboard-rebrand?demo=1&version=discoverability-atlas-compass-nav',
      },
    ],
    devHandoff: {
      intro:
        'One component on the Atlas/Compass Global Navigation version’s home. Every figure on it is already resolved by the home page; the card only lays them out.',
      components: [],
      uiComponents: [
        {
          id: 'compass-home-course-card',
          name: 'Compass Home Course Card',
          tabLabel: 'Home Course Card',
          badge: 'NEW',
          badgeDate: '2026-09-24',
          location:
            'src/components/compass/CompassHomeCourseCard.tsx — rendered by MembershipOverview (`atlasCourseCard`) as LearnerFocusedBand’s `headerSlot`',
          summary:
            'The current course on the Atlas home: cover, title, a Course Overview chip, three facts, then the next lesson and a Begin Course button. Replaces the Course Progress header and the Jump Back In card on that version only.',
          variants: [
            {
              name: 'Not started',
              when: '0 lessons complete',
              detail: 'The Figma frame’s state — “0 of 42 lessons”, “Lesson 1”, Begin Course.',
            },
            {
              name: 'In progress',
              when: 'Some lessons complete, not all',
              detail: 'Live figures (the demo’s “26 of 42”, “Lesson 27”). The button still reads Begin Course — the designer’s call.',
            },
            {
              name: 'Exam date booked',
              when: 'A date has been entered on the Schedule State Exam card',
              detail: 'The date replaces “Needs Scheduled”.',
            },
            {
              name: 'Complete',
              when: 'Coursework is 100%',
              detail: 'The lesson pill and estimate drop; the title reads “Coursework complete”; the button reads Review Course.',
            },
          ],
          designSpec: {
            tokens: [
              { role: 'Card surface', token: '--color-compass-page-card' },
              { role: 'Rule under the facts', token: '--color-compass-page-card-rule' },
              { role: 'Chip + lesson pill border', token: '--color-compass-page-card-border' },
              { role: '“Current course:” eyebrow', token: '--color-compass-page-eyebrow' },
              { role: 'Course title', token: '--color-compass-page-heading · --font-heading-serif' },
              { role: 'Fact labels', token: '--color-compass-page-muted' },
              { role: 'Fact values + lesson title', token: '--color-text-primary · --font-body' },
              { role: 'Button', token: '--color-compass-page-button · --color-compass-page-button-ink (.cre-compass-primary)' },
            ],
            states: [
              'Button: hover brightens (.cre-compass-primary:hover); focus-visible ring in --color-compass-page-button.',
              'Chip: transparent; hover tints with --color-compass-page-card-border; focus-visible ring.',
            ],
            responsive: [
              'Card is 750px wide in the Atlas home’s left column (grid `minmax(0, 750px) minmax(0, 1fr)`); it narrows with the column on smaller windows.',
              '32px inset on every side; no outer stroke; 14px corners (the Figma value).',
              'The left column pins 50px below the header while the right column scrolls.',
            ],
            sources: [
              'Figma hXiYWnaiZWIwWmaTk7pk3F — node 108:4579 (card), 108:4620 (facts row)',
              'src/components/compass/CompassHomeCourseCard.tsx',
              'src/styles/tokens.css — COMPASS COURSE OVERVIEW PAGE block',
            ],
          },
          statesMatrix: [
            { question: 'What if: No cover image?', answer: 'The cover is omitted; title and facts take the row.' },
            { question: 'What if: No lesson breakdown?', answer: 'The Completed fact is omitted rather than reading “0 of 0”.' },
            { question: 'What if: Coursework complete?', answer: 'Lesson pill and estimate drop; Review Course replaces Begin Course.' },
          ],
          edgeCases: [
            'Long course title wraps to two lines at 750px; the cover stays a fixed 94px square.',
            'Long lesson title wraps beside the button; the button never shrinks.',
            'Facts row wraps onto a second line when the three facts plus the chip do not fit.',
          ],
        },
      ],
      decisions: {
        items: [
          {
            question: 'Why one card instead of the Course Progress header plus Jump Back In?',
            decision: 'They named the same course twice. The Figma card (108:4579) carries the course, three facts and the next step in one place.',
            status: 'Decided',
          },
          {
            question: 'Should the button say Resume once lessons are done?',
            decision: 'No — Begin Course at every point short of complete (the designer’s call, 2026-09-24); Review Course once complete.',
            status: 'Decided',
          },
          {
            question: 'Live figures, or the Figma’s not-started numbers?',
            decision: 'Live. The design is drawn at 0%; the card reads the same figures the rest of the home uses so the demo controls move it, and the two cannot disagree.',
            status: 'Decided',
          },
          {
            question: 'What does the Course Overview chip do?',
            decision: 'Opens the course’s Compass Overview page. It is 94px wide — the cover’s width — so the facts start under the title.',
            status: 'Decided',
          },
          {
            question: 'Outer stroke and inset?',
            decision: 'No outer stroke (the fill carries the edge) and 32px inside on every side, matching every filled module on the Atlas home.',
            status: 'Decided',
          },
        ],
      },
      flagsNote:
        'No feature flag drives this card — it is gated by the dashboard VERSION (`?version=discoverability-atlas-compass-nav`). Its figures follow Demo Controls → Progress and the exam date entered on the Schedule State Exam card.',
    },
  },
]
