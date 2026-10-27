# Dev handoffs — one file per feature

This folder is **yours**. Every `.ts` file in it is one dev handoff: the row on
the Development board, the one-page gateway at `/prototype/<id>`, and the
Markdown export, all from one object. `handoffFeatures.ts` reads
the folder and `prototypeFeatures.ts` merges the result into the rows list, so
nothing else in the app knows the folder exists.

Say **`/dev-handoff-notes for <feature>`** and the routine writes the file with
you. The rules below are what it follows, for the day you edit one by hand.

## The rules

1. **The file name is the id.** `xcel-study-streak.ts` is the row
   `xcel-study-streak`. Lowercase, dashes. Two designers writing two handoffs
   never touch the same file.
2. **`export default` one `PrototypeFeature`** with `category: 'dev-handoff'`.
   The app refuses the file at load, by name, if either is wrong.
3. **`import type` only from `../prototypeFeatures`.** The folder loads before
   that file finishes, so a value import from it breaks the first page load.
   Write route strings out; do not import `PROTOTYPE_BASE`.
4. **`kind: 'guided'`, and no `to` or `externalUrl`.** A row with either opens
   there instead of its own page. The live preview goes in `pages`.
5. **Author `devStatus`, and start it at `'not-ready'`.** A page nobody has
   read must not tell engineering to start. After that the status is yours —
   `'in-design'` · `'needs-discussion'` · `'blocked'` · `'ready-for-dev'` ·
   `'in-development'` — set it HERE, which is what the team sees (the row's ⋮
   on the Hub offers the same five, but that is a per-browser override). The
   only things a designer does not do are ship to main (Jillienne's) and
   promote to prototype for a surface they do not own.
6. **Put the component breakdown in `devHandoff.uiComponents`** and leave
   `components: []`. The decisions tab is the decisions log only.

## The skeleton

```ts
import type { PrototypeFeature } from '../prototypeFeatures'

const feature: PrototypeFeature = {
  id: 'xcel-study-streak', // = this file's name
  title: 'Study Streak card',
  kind: 'guided', // opens its own gateway page — never add `to` or `externalUrl`
  status: 'ready',
  category: 'dev-handoff',
  devStatus: 'not-ready', // start here; move it yourself as the work moves
  surface: 'atlas', // the kind tag's word: 'atlas' · 'invite' · 'compass' · 'admin'
  owner: 'Anjani', // the designer tag — whoever ran the routine; it confirms your name first
  lastUpdated: '2026-10-27T00:00:00Z', // the Updated tag; the routine stamps it on every write
  accent: 'blue',
  icon: 'grid', // 'grid' | 'calendar' | 'flag' | 'monitor'
  brands: ['xcel'],
  blurb: 'One sentence under the title.',
  tileBlurb: 'The two-line summary on the Development board. ≤160 characters.',
  pages: [
    // The Live Preview tab. `Label — what it shows` is the caption shape.
    { label: 'Atlas Home — the card in place', to: '/dashboard-rebrand?demo=1&section=dashboard' },
  ],
  devHandoff: {
    intro: 'What this feature is for, in a paragraph.',
    components: [],
    uiComponents: [
      {
        id: 'study-streak-card',
        name: 'Study Streak card',
        location: 'Home, top of the right column.',
        summary: 'What it is for, in two lines.',
        variants: [
          { name: 'Default', when: 'The learner has studied today.', why: 'A streak only means something while it is unbroken, so the card leads with the count.' },
          { name: 'Broken streak', when: 'A day was missed.', action: 'Restart' },
        ],
        ctas: [{ name: 'Study now', does: 'Opens the next lesson in Compass.' }],
        statesMatrix: [{ question: 'What if there is no history yet?', answer: 'The card shows day 0, never hides.' }],
        edgeCases: [],
        designSpec: { tokens: [] },
      },
    ],
    decisions: {
      items: [
        { question: 'Flat list or grouped by month?', decision: 'Flat, because month headings fight a column sort.', status: 'Decided' },
      ],
    },
    // Your own words to engineering, one paragraph per entry. Blank by default;
    // the routine asks "anything else?" at the end. Rendered last on the page.
    designerNotes: [],
  },
}

export default feature
```

The field-by-field rules — the caption shape, `badgeDate`, thumbnails, the
Design Spec, when a feature should split — are in
`.claude/skills/dev-handoff-notes/SKILL.md`, which is what the routine reads.
