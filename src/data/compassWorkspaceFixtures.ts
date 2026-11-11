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
  /** What came OUT of the session — "Flashcards", "Practice quiz",
   *  "Review guide". The hero says it in lower case ("made flashcards"); the
   *  session cards draw it as an ICON with the name read aloud, never as
   *  visible text (her `h-madeic`, `title` + `.sr`). '' where the session
   *  produced nothing. */
  made: string
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
    made: 'Flashcards',
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
    made: 'Practice quiz',
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
    made: 'Review guide',
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

/* ── The Studio rail, and the home's nudge ────────────────────────────────
 *
 * ⚠ ADDED ON THE SECOND PASS (2026-11-04). The first port built this rail
 * from the prototype's SOURCE and got a thin version of it: four Make
 * buttons under a heading called "Make something". Opening her branch build
 * showed what it actually renders — a Studio with a readiness block above
 * six make actions (two of them Coming soon) and three artefacts she has
 * already made. Everything below is read off that DOM, which is why it is
 * right this time: her source is long and her render is the truth.
 */

/** Her readiness block, at the top of the Studio rail. */
export const WORKSPACE_READINESS = {
  examIn: 'Exam in 33 days',
  progressLabel: 'Course progress',
  progress: '14%',
  focus: 'Focus next: cash value versus death benefit. Marked three times, practised none.',
  cta: 'Take a 5-question check',
}

/** "Make from all marks" — six, and the last two are promises rather than
 *  buttons. The Coming soon pair is hers and is the argument that a workspace
 *  grows into conversation, not just revision.
 *
 *  ⚠ THE IDS ARE HERS: `summary` for Review guide, `podcast` for Audio recap.
 *  An earlier pass renamed them `guide` and `audio`, which read better and
 *  meant her `data-mk` and this table no longer described the same thing.
 *  The two Coming soon tiles carry no make id at all in her file — they are
 *  `data-soon`, not `data-mk` — so theirs are prefixed here to say so. */
export const WORKSPACE_MAKE: readonly { id: string; label: string; note: string; soon?: boolean }[] = [
  { id: 'flashcards', label: 'Flashcards', note: 'Spaced to your exam date' },
  { id: 'practice', label: 'Practice quiz', note: 'Exam style, with rationale' },
  { id: 'summary', label: 'Review guide', note: 'One page per lesson' },
  { id: 'podcast', label: 'Audio recap', note: '5 minute commute review' },
  { id: 'soon-podcast', label: 'Podcast', note: 'A conversation about your marks', soon: true },
  { id: 'soon-simulation', label: 'Simulation', note: 'Practise the conversation, not the definition', soon: true },
]

/** "Created by me" — what the learner has already made, in her order. `also`
 *  is the second home an artefact has ("also in Flashcards"); `cta` is the way
 *  back into it, and the guide has a body instead because a one-page summary
 *  IS its own preview. */
export const WORKSPACE_CREATED: readonly {
  id: string
  title: string
  from: string
  also?: string
  cta?: string
  body?: string
}[] = [
  {
    id: 'c1',
    title: 'Cash value and term',
    from: 'Made from 5 saved items',
    also: 'Flashcards',
    cta: 'Study the 8 cards →',
  },
  {
    id: 'c2',
    title: 'Practice quiz · term or permanent',
    from: 'Made from 2 saved items',
    also: 'Practice',
    cta: 'Start 12 questions →',
  },
  {
    id: 'c3',
    title: 'Review guide · insurance basics',
    from: 'Made from 2 saved items',
    body: 'Insurance moves risk from you to the insurer for a premium. Indemnity puts you back where you were, never better off.',
  },
]

/** The Rubi strip under the Pick-up hero. Dismissible — her `×` — and it is
 *  the surface proposing its own next move, which is the whole Rubi idea. */
export const WORKSPACE_NUDGE = {
  eyebrow: 'Rubi',
  text: 'You have marked cash value three times.',
  cta: 'Start a workspace for it →',
}

/* ── A SESSION — what "+ New workspace" opens (2026-11-04, third pass) ─────
 *
 * ⚠ FOUND BY CLICKING, which is the whole lesson of this port. Her
 * "+ New workspace" button opens a MODE, not a dialog: the centre becomes a
 * Notebook with Rubi — a scoped heading, Rubi's read of what you have marked,
 * three suggested questions and a composer — and the bar above it becomes
 * "Workspace · New session" with a rename and a star. Two passes of reading
 * her source and one of reading her home missed it entirely, because nothing
 * renders until the button is pressed.
 *
 * This is arguably the point of the whole surface: the marks are the input
 * and the conversation is what you do with them.
 */

/** Rubi's opening read of the whole course, in a new session. `bold` marks
 *  the phrases her file emphasises — they are the terms she wants the eye to
 *  catch, so they are data rather than markup. */
export const WORKSPACE_SESSION_OPENERS: readonly { id: string; text: string; bold: string[] }[] = [
  {
    id: 'r1',
    text: 'What you have marked covers term versus permanent, what cash value is and who it belongs to, and the two softeners at the end of a term. You have come back to cash value three times — that is where a check would help most.',
    bold: ['term versus permanent', 'cash value'],
  },
  {
    id: 'r2',
    text: 'Memory hook: Term → rented → nothing left at the end. Permanent → owned → cash value is yours while alive.',
    bold: ['Memory hook:'],
  },
]

/** The three she offers under the opener. Questions a learner would not think
 *  to ask, which is what makes them worth suggesting. */
export const WORKSPACE_SUGGESTED: readonly string[] = [
  'What is most likely on the exam here?',
  'Explain cash value a different way',
  'Where am I still weak?',
]

/** Her composer, verbatim — including the line under it, which is the scope
 *  promise: Rubi answers from THIS course and THESE marks, not the internet. */
export const WORKSPACE_COMPOSER = {
  placeholder: 'Ask a question or create something',
  scope: 'All marks',
  caption: 'Rubi answers from your course and what you have marked.',
  /** The name a session carries until it is renamed. */
  untitled: 'New session',
}

/* ── THE DECK, AND WHAT MAKE PRODUCES (2026-11-04, the sweep) ─────────────
 *
 * ⚠ FOUND BY PRESSING EVERY CONTROL. Four passes of this port shipped
 * without any of it, because none of it renders until a button is pressed:
 * opening an artefact replaces the centre with a card player, and each Make
 * action produces a differently-named artefact with a different payload.
 * `port-prototype`'s step 2b exists because of this.
 */

/** One flashcard. Her front is a TERM — the deck is vocabulary drilled from
 *  what the learner marked — and the back is a definition plus the caveat
 *  that makes it exam-proof. */
export type WorkspaceCard = { term: string; def: string; ex: string }

/** Her eight, in her order — and the order is a teaching order, not
 *  alphabetical: cash value first because it is the one the learner has come
 *  back to three times, then the fork it belongs to, then the rest. */
export const WORKSPACE_DECK: readonly WorkspaceCard[] = [
  {
    term: 'Cash value',
    def: 'The savings balance that builds inside a permanent policy. The owner can borrow against it while alive.',
    ex: 'Borrowing against it reduces the death benefit.',
  },
  {
    term: 'Term insurance',
    def: 'Coverage for a set period that builds no cash value. When the term ends, the coverage ends.',
    ex: 'A 20-year term policy on a mortgage.',
  },
  {
    term: 'Permanent insurance',
    def: 'Coverage that lasts your whole life and builds cash value.',
    ex: 'Whole life is the most common form.',
  },
  {
    term: 'Death benefit',
    def: 'The amount paid to the beneficiary when the insured dies.',
    ex: 'The beneficiary does not receive the cash value as well.',
  },
  {
    term: 'Renewable',
    def: 'Lets the owner extend a term policy without proving insurability again, usually at a higher premium.',
    ex: 'Priced at the insured person\u2019s age at renewal.',
  },
  {
    term: 'Convertible',
    def: 'Lets the owner exchange a term policy for a permanent one without a new medical exam.',
    ex: 'Useful when health has changed.',
  },
  {
    term: 'Indemnity',
    def: 'Restores the insured to the same financial position as before the loss, never a better one.',
    ex: 'Why claims pay the value lost, not a round number.',
  },
  {
    term: 'Premium',
    def: 'The payment the policy owner makes to keep coverage in force.',
    ex: 'Level for the term you choose on term insurance.',
  },
]

/** The deck player's own copy. The confidence question comes BEFORE the flip,
 *  which is the pedagogy: she asks you to commit before you are shown. */
export const WORKSPACE_DECK_UI = {
  eyebrow: 'Flashcards · created by me',
  question: 'How sure are you before you flip?',
  confidence: [
    { value: 'know', label: 'I know this' },
    { value: 'unsure', label: 'Not sure' },
    { value: 'new', label: 'New to me' },
  ],
  flip: 'Flip card',
  practise: 'Practise this with Rubi',
  back: 'Back to the notebook',
}

/** What each Make action produces — her names, not the button's label, and
 *  three different payload shapes. `cta` opens the thing; `body` IS the thing
 *  (a one-page summary previews itself); `audio` draws a player. */
export type WorkspaceMadeSpec = {
  title: string
  also?: string
  cta?: string
  body?: string
  audio?: { at: string; of: string }
  toast: string
}

export const WORKSPACE_MAKE_RESULT: Readonly<Record<string, WorkspaceMadeSpec>> = {
  flashcards: {
    title: 'Flashcards from what you marked',
    also: 'Flashcards',
    cta: 'Study the 8 cards \u2192',
    toast: 'Flashcards from what you marked \u2014 also in Flashcards',
  },
  practice: {
    title: 'Practice set \u00b7 12 questions',
    also: 'Practice',
    cta: 'Start 12 questions \u2192',
    toast: 'Practice set \u00b7 12 questions \u2014 also in Practice',
  },
  summary: {
    title: 'Summary of what you marked',
    body: 'Term is rented coverage for a fixed window with no savings attached. Permanent is owned coverage that also builds cash value you can borrow against while alive.',
    toast: 'Summary of what you marked saved here',
  },
  podcast: {
    title: 'Audio recap \u00b7 3 min',
    audio: { at: '0:41', of: '3:12' },
    toast: 'Audio recap \u00b7 3 min saved here',
  },
}

/** The composer's `+`. Her label, and her toast. */
export const WORKSPACE_UPLOAD = {
  label: 'Add your own content',
  toast: 'Upload \u2014 tagged to the whole course',
}

/** The context header a session grows when it is scoped to one mark —
 *  "Talking about \u00b7 Note" above the passage. Pressing a suggested
 *  question is what creates it. */
export const WORKSPACE_TALKING_ABOUT = 'Talking about'
