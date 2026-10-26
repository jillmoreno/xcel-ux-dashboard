// THE README SKELETON, VERBATIM — `HandoffFolder.test.ts` asserts the two match
// (import line aside) and runs this through `validateHandoff`, so the skeleton a
// designer copies is always one that compiles and loads. Edit the README; then
// paste the block here.
import type { PrototypeFeature } from '../../data/prototypeFeatures'

const feature: PrototypeFeature = {
  id: 'xcel-study-streak', // = this file's name
  title: 'Study Streak card',
  kind: 'guided', // opens its own gateway page — never add `to` or `externalUrl`
  status: 'ready',
  category: 'dev-handoff',
  devStatus: 'not-ready', // start here; move it yourself as the work moves
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
