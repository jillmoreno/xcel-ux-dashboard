/**
 * THE COMPASS WORKSPACE — Anjani's marks, her saved Rubi sessions, and the
 * vocabulary that sorts them (2026-11-04).
 *
 * Ported from `public/prototypes/xcel-compass-workspace-v4.html`, the file she
 * staged on 2026-11-04. The Workspace is the one screen in v4 that had no React
 * equivalent at all: everything else in that build was already ported on
 * 2026-10-15/16 from her second master. This is her private study surface —
 * "Everything you marked in your course, and what you can make from it. Only
 * you can see this."
 *
 * ⚠ HER CONTENT IS VERBATIM AND IS NOT MINE TO IMPROVE. Every `text`, `note`,
 * `where` and Rubi answer below is copied from her file character for
 * character, down to the em dashes. The learner's notes are written in a
 * learner's voice on purpose — "Cash value is the bit I keep mixing up with
 * the death benefit" is a person thinking, not copy that wants tightening. The
 * same rule the other Anjani ports follow (`compassRailFixtures.ts`,
 * `COMPASS_DASHBOARD_NUDGES`): port the structure, never the words.
 *
 * ELEVEN MARKS ACROSS SIX TYPES, and the spread is deliberate — it is what
 * makes the filter chips and the grouping legible at a glance. Three of them
 * carry an `origin` (Rubi added · Atlas · Uploaded), which is her argument that
 * a workspace collects from more than the course player.
 */

/** What kind of thing a learner marked. Her six, from `WS.items`. */
export type WorkspaceMarkType = 'bookmark' | 'note' | 'rubi' | 'flag' | 'object' | 'pointer'

/** One turn of a Rubi conversation hanging off a mark. */
export type WorkspaceThreadTurn = {
  q: string
  a: string
}

export type WorkspaceMark = {
  id: string
  type: WorkspaceMarkType
  /** The chapter it came from — also the "Where in my learning" scope. */
  ch: string
  /** Where in the chapter: "Video · 0:48", "Knowledge check", "Reading". */
  where: string
  /** The passage or object that was marked. */
  text: string
  /** The learner's OWN words about it, where they wrote any. Her notes are
   *  first person and stay that way. */
  note?: string
  /** Set where the mark did not come from the course player — her three:
   *  `Rubi added` (Rubi noticed a revisit), `Atlas` (asked on the dashboard),
   *  `Uploaded` (the learner's own file). */
  origin?: string
  /** The Rubi exchange attached to this mark, where there is one. */
  thread?: WorkspaceThreadTurn[]
}

/**
 * HER ELEVEN MARKS, in her order.
 *
 * The order is not arbitrary: i1–i5 are one chapter's worth, so the grouped
 * views have something to group; i6–i7 are a second chapter, so "Whole course"
 * differs from a scoped view; i8–i11 are the edges — a pointer, a Rubi-added
 * mark, one from Atlas and one uploaded.
 */
export const COMPASS_WORKSPACE_MARKS: readonly WorkspaceMark[] = [
  {
    id: 'i1',
    type: 'bookmark',
    ch: 'Life insurance policy types',
    where: 'Video · 0:00',
    text: 'Every life insurance policy is either term or permanent.',
    thread: [
      {
        q: 'Why does this fork matter so much?',
        a: 'Because almost every later question traces back to it. Premium, duration, cash value and what you own at the end are all decided by which side of the fork a policy sits on.',
      },
    ],
  },
  {
    id: 'i2',
    type: 'note',
    ch: 'Life insurance policy types',
    where: 'Video · 0:48',
    text: 'Permanent insurance lasts your whole life and builds cash value you can borrow against.',
    note: 'Cash value is the bit I keep mixing up with the death benefit. Cash value is mine while alive.',
    thread: [
      {
        q: 'How is cash value different from the death benefit?',
        a: 'Cash value is yours while you are alive — you can borrow against it or surrender the policy for it. The death benefit only pays out to your beneficiary after you die. One is a living asset, the other is a payout.',
      },
      {
        q: 'Would that ever be on the exam?',
        a: 'Yes, usually as a trick comparison. The common trap is assuming the beneficiary receives both. They do not: borrowing against cash value reduces the death benefit.',
      },
    ],
  },
  {
    id: 'i3',
    type: 'rubi',
    ch: 'Life insurance policy types',
    where: 'Asked about this passage',
    text: 'Term is rented coverage for a set window. Permanent is owned coverage that also builds a savings component you can borrow against.',
  },
  {
    id: 'i4',
    type: 'flag',
    ch: 'Life insurance policy types',
    where: 'Video · 3:22',
    text: 'Renewable extends the term without proving insurability again, usually at a higher premium.',
  },
  {
    id: 'i5',
    type: 'object',
    ch: 'Life insurance policy types',
    where: 'Knowledge check',
    text: 'Knowledge check · Policy types',
  },
  {
    id: 'i6',
    type: 'note',
    ch: 'Insurance basics',
    where: 'Reading',
    text: 'Insurance transfers risk from the individual to the insurer in exchange for a premium.',
    note: 'Say this one out loud before the exam. Everything else hangs off it.',
  },
  {
    id: 'i7',
    type: 'bookmark',
    ch: 'Insurance basics',
    where: 'Key terms',
    text: 'Indemnity restores the insured to the same financial position, never a better one.',
  },
  {
    id: 'i8',
    type: 'pointer',
    ch: 'Life insurance policy types',
    where: 'Reading · Softening the end of a term',
    text: 'Convertible lets the owner exchange a term policy for a permanent one without a new medical exam.',
  },
  {
    id: 'i9',
    type: 'rubi',
    ch: 'Life insurance policy types',
    where: 'Added after 3 revisits',
    origin: 'Rubi added',
    text: 'Cash value versus death benefit — you have come back to this three times.',
  },
  {
    id: 'i10',
    type: 'bookmark',
    ch: 'Atlas',
    where: 'Rubi answer in Atlas',
    origin: 'Atlas',
    text: 'Remind me: book the state exam within 30 days of finishing pre-licensing.',
  },
  {
    id: 'i11',
    type: 'object',
    ch: 'Your uploads',
    where: 'class-notes-riders.pdf',
    origin: 'Uploaded',
    text: 'My class notes on riders and waiver of premium',
  },
]

/** One saved Rubi conversation, started from marks in the workspace. */
export type WorkspaceSession = {
  id: string
  title: string
  ch: string
  /** Her relative stamps — "Today · 10:40", "Mon · 8:02 pm". Strings, not
   *  dates: a prototype that recomputed these would drift out of the story
   *  she wrote around them. */
  when: string
  pinned: boolean
  /** The mark ids the conversation was started from. */
  sel: string[]
  msgs: WorkspaceThreadTurn[]
}

/**
 * HER THREE SAVED SESSIONS.
 *
 * Flattened from her `chat` object: the prototype carried `from`, `pin` and
 * `replies` alongside the messages, and all three were scaffolding for the
 * chat panel's own state rather than anything the session records. `sel` plus
 * `msgs` is what a saved session actually is, and `pin.title` ("2 marks
 * pinned") is derivable from `sel.length` — kept derived rather than stored so
 * the two cannot disagree.
 */
export const COMPASS_WORKSPACE_SESSIONS: readonly WorkspaceSession[] = [
  {
    id: 's1',
    title: 'Cash value vs death benefit',
    ch: 'Life insurance policy types',
    when: 'Today · 10:40',
    pinned: true,
    sel: ['i2', 'i3'],
    msgs: [
      {
        q: 'How is cash value different from the death benefit?',
        a: 'Cash value is yours while you are alive — you can borrow against it or surrender the policy for it. The death benefit only pays your beneficiary after you die.',
      },
      {
        q: 'Would that be on the exam?',
        a: 'Usually as a trick comparison. The beneficiary does not receive both — any loan still owed comes out of the death benefit.',
      },
    ],
  },
  {
    id: 's2',
    title: 'Term or permanent — the fork',
    ch: 'Life insurance policy types',
    when: 'Yesterday · 7:15 pm',
    pinned: false,
    sel: ['i1', 'i4'],
    msgs: [
      {
        q: 'Why does the term-or-permanent fork matter so much?',
        a: 'Because almost every later question traces back to it. Premium, duration, cash value and what you own at the end are all decided by which side a policy sits on.',
      },
    ],
  },
  {
    id: 's3',
    title: 'Insurance basics recap',
    ch: 'Insurance basics',
    when: 'Mon · 8:02 pm',
    pinned: false,
    sel: ['i6', 'i7'],
    msgs: [
      {
        q: 'Explain indemnity simply',
        a: 'Insurance puts you back where you were before the loss — never better off. That is why a claim pays the value lost, not a round number.',
      },
    ],
  },
]

/* ── Her vocabulary ───────────────────────────────────────────────────────
 *
 * Four maps, all hers (`KIND`, `LT`, `PL`, `TCOL` in the prototype). The
 * collapse is the interesting one: SIX mark types sort into FOUR groups, and
 * `bookmark` and `object` both land under "Flag". That looks like a mistake
 * and is not — a bookmark and a knowledge check are both "something I pointed
 * at and did not write about", and she groups by what the learner DID, not by
 * what the system stored.
 */

/** Mark type → the group it files under. */
export const WORKSPACE_KIND: Readonly<Record<WorkspaceMarkType, string>> = {
  bookmark: 'Flag',
  note: 'Note',
  rubi: 'Rubi',
  flag: 'Flag',
  object: 'Flag',
  pointer: 'Pointer',
}

/** Group → the representative type whose icon it draws. */
export const WORKSPACE_GROUP_TYPE: Readonly<Record<string, WorkspaceMarkType>> = {
  Note: 'note',
  Flag: 'flag',
  Rubi: 'rubi',
  Pointer: 'pointer',
}

/** Group → its plural, for the headings and the chips. */
export const WORKSPACE_GROUP_PLURAL: Readonly<Record<string, string>> = {
  Note: 'Notes',
  Flag: 'Flags',
  Rubi: 'Rubi',
  Pointer: 'Pointers',
}

/** The order the groups read in — hers, and not alphabetical: what the
 *  learner wrote comes before what they only pointed at. */
export const WORKSPACE_GROUP_ORDER: readonly string[] = ['Note', 'Flag', 'Rubi', 'Pointer']

/** Mark type → its colour token. Her values, which are the project's own
 *  `--c-*` tokens rather than raw hex. */
export const WORKSPACE_TYPE_COLOR: Readonly<Record<WorkspaceMarkType, string>> = {
  bookmark: 'var(--c-steel)',
  note: 'var(--c-pass)',
  rubi: 'var(--c-terracotta)',
  flag: 'var(--c-review)',
  pointer: 'var(--c-slate)',
  object: 'var(--c-muted)',
}

/** The filter chips, in her order. `all` always shows; the rest hide when the
 *  current scope holds none of that type. */
export const WORKSPACE_FILTERS: readonly { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'note', label: 'Notes' },
  { value: 'flag', label: 'Flags' },
  { value: 'rubi', label: 'Rubi' },
  { value: 'pointer', label: 'Pointers' },
]
