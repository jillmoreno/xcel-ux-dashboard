/**
 * JEFF'S COMPASS MVP — 2026-11-09, from `Compass-Prototype-MVP111926_v2.html`
 * (shipped as `public/prototypes/xcel-compass-mvp.html`).
 *
 * Thirteen pages of a whole Compass, not one screen of one: Overview, Learn,
 * the Chapter 2 lesson, Prep Review, Flashcards (+ topic, + study session),
 * Practice (+ question set), Readiness, Study planner and the Exam Simulator
 * (+ a simulated Pearson VUE sitting). This file is ported PAGE BY PAGE, in
 * the order Jillienne asks for them; `JEFF_MVP_READINESS` is the first.
 *
 * ⚠ EVALUATED OUT OF HIS CODE, NOT RETYPED — the same method the two ports
 * before it used (`compassReadinessFixtures.ts`, `compassJeffFixtures.ts`).
 * Each page's `renderVals()` is run with `DCLogic` stubbed and the result
 * serialised, so his copy, his numbers and his ring geometry arrive intact
 * instead of through a few hundred judgement calls about what "about right"
 * means. The extractor is `port-prototype` step 2.
 *
 * ⚠ HIS HEXES BECAME TONE NAMES, resolved once in `compassJeffMvp.css`. His
 * palette IS the Compass system this repo already maps twice over
 * (`compassWorkspace.css` 2026-11-04, `compassReadiness.css` 2026-11-05), so
 * the mapping is repeated rather than re-decided — plus the four Readiness
 * band inks and washes, which are new here.
 *
 * ⚠ THE STATIC COPY IS TRANSCRIBED FROM THE RENDERED PAGE, not from the
 * template source. His headline prose is template text rather than data, and
 * `/port-prototype`'s rule is to read the running build: what is below is what
 * a reviewer actually sees at 1440px.
 *
 * ⚠ RE-EXTRACT, DO NOT HAND-EDIT. A fixture edited to make something look
 * right is a diff against the port's own opinion, and nothing will tell you.
 */

/** His rail. Three rows, then a rule labelled "Exam prep" over five more.
 *
 *  ⚠ "Exam prep" IS THE DATA; the uppercase a reviewer sees is
 *  `text-transform`. Typing "EXAM PREP" here is the parity bug of 2026-11-05
 *  in advance — his `innerText` reports the CSS-transformed string, so a
 *  fixture written in capitals passes a parity check and renders a double
 *  transform nowhere.
 *
 *  ⚠ STUDY PLANNER IS ABOVE THE RULE, not inside Exam prep. It is the last of
 *  the three learning rows, which is his argument: planning is part of
 *  learning, and the five below the rule are what you do once you are
 *  preparing for the exam. */
export const JEFF_MVP_RAIL = {
  primary: [
    { page: 'overview', label: 'Overview' },
    { page: 'learn', label: 'Learn' },
    { page: 'study-planner', label: 'Study planner' },
  ],
  groupLabel: 'Exam prep',
  examPrep: [
    { page: 'prep-review', label: 'Prep Review' },
    { page: 'practice', label: 'Practice' },
    { page: 'flashcards', label: 'Flashcards' },
    { page: 'exam-simulator', label: 'Exam Simulator' },
    { page: 'readiness', label: 'Readiness' },
  ],
} as const

/** Every page his rail can reach, and whether this port has built it yet. */
export const JEFF_MVP_PAGES = [
  { page: 'overview', label: 'Overview', ported: true },
  { page: 'learn', label: 'Learn', ported: true },
  { page: 'study-planner', label: 'Study planner', ported: false },
  { page: 'prep-review', label: 'Prep Review', ported: false },
  { page: 'practice', label: 'Practice', ported: false },
  { page: 'flashcards', label: 'Flashcards', ported: false },
  { page: 'exam-simulator', label: 'Exam Simulator', ported: false },
  { page: 'readiness', label: 'Readiness', ported: true },
] as const

export type JeffMvpPage = (typeof JEFF_MVP_PAGES)[number]['page']

/**
 * THE READINESS PAGE — his sixth rail row, and the first page ported.
 *
 * ⚠ IT IS NOT THE READINESS PROTOTYPE ALREADY IN HERE.
 * `compassReadinessFixtures.ts` holds sixteen states of a Compass OVERVIEW
 * rebuilt around Readiness, from a different file (Oct 30) making a different
 * argument — whether Readiness is a phase after the course or a signal beside
 * it. This is a standing Readiness PAGE in a product that has already decided
 * Readiness is its own destination, which is what the EXAM PREP group in the
 * rail means. Both are ported; neither replaces the other.
 *
 * ⚠ THE PRIMARY SUB-TOPIC'S PRACTICE BUTTON GOES SOMEWHERE ELSE. Every
 * Practice control on the page opens the Practice page, except the weakest
 * sub-topic's, which opens a question set directly (`PracticeSession`). That
 * is the page's whole thesis in one href: the top recommendation is one click
 * from being done, and everything else is one click from being chosen.
 */
export const JEFF_MVP_READINESS = {
  overall: 62,
  band: 'Developing',
  bandInk: 'developing-ink',
  bandBg: 'developing-wash',
  bandBorder: 'developing-edge',
  delta: 6,
  coverage: 46,
  ring: {
    readyTone: 'amber',
    readyDash: '257.1 999',
    covDash: '150.3 999',
    aria: 'Readiness 62%, Developing. Coverage 46%: 122 of 265 practice questions answered.'
  },
  stats: [
    {
      label: 'Last 3 weeks',
      value: '+6 pts',
      tone: 'steel-deep',
      ruled: false
    },
    {
      label: 'Now',
      value: '62%',
      tone: 'developing-ink',
      ruled: true
    },
    {
      label: 'Ready at',
      value: '85%',
      tone: 'green',
      ruled: true
    }
  ],
  trend: {
    linePath: 'M0 129.4 L44 129.4 L88 126.7 L132 129.4 L176 126.7 L220 126.7 L264 124 L308 124 L352 126.7 L396 124 L440 121.3 L484 121.3 L528 124 L572 121.3 L616 118.6 L660 118.6 L704 115.9 L748 118.6 L792 115.9 L836 113.1 L880 113.1',
    areaPath: 'M0 129.4 L44 129.4 L88 126.7 L132 129.4 L176 126.7 L220 126.7 L264 124 L308 124 L352 126.7 L396 124 L440 121.3 L484 121.3 L528 124 L572 121.3 L616 118.6 L660 118.6 L704 115.9 L748 118.6 L792 115.9 L836 113.1 L880 113.1 L880 200 L0 200 Z',
    endX: 880,
    endY: 113.1,
    aria: 'Readiness rose from 56% on October 15 to 62% today. Ready starts at 85%.'
  },
  rows: [
    {
      name: 'Annuities',
      weight: 20,
      answered: '22 of 55 questions answered',
      score: 52,
      delta: 5,
      band: 'Developing',
      bandInk: 'developing-ink',
      bandBg: 'developing-wash',
      bandBorder: 'developing-edge',
      track: [
        {
          label: 'Beginner',
          flex: 40,
          labelTone: 'muted',
          labelWeight: 400,
          height: 10,
          radius: '5px 0 0 5px',
          tone: 'track-empty'
        },
        {
          label: 'Developing',
          flex: 25,
          labelTone: 'ink',
          labelWeight: 600,
          height: 10,
          radius: '0',
          tone: 'track-developing'
        },
        {
          label: 'Proficient',
          flex: 20,
          labelTone: 'muted',
          labelWeight: 400,
          height: 10,
          radius: '0',
          tone: 'track-proficient'
        },
        {
          label: 'Ready',
          flex: 15,
          labelTone: 'muted',
          labelWeight: 400,
          height: 10,
          radius: '0 5px 5px 0',
          tone: 'track-ready'
        }
      ],
      aria: 'Annuities: 52 out of 100, Developing. Ready starts at 85.',
      gapNote: '33 points to Ready',
      expanded: true,
      isPrimary: true,
      subs: [
        {
          name: 'Variable annuities',
          num: '41',
          weight: 600,
          note: 'Weakest',
          noteTone: 'rubi',
          segs: [
            {
              flex: 40,
              height: 5,
              tone: 'edge'
            },
            {
              flex: 25,
              height: 5,
              tone: 'amber'
            },
            {
              flex: 20,
              height: 5,
              tone: 'hairline'
            },
            {
              flex: 15,
              height: 5,
              tone: 'hairline'
            }
          ],
          barTone: 'amber',
          band: 'Developing',
          bandTone: 'developing-ink',
          rubi: true,
          mins: '12 min'
        },
        {
          name: 'Annuity taxation',
          num: '55',
          weight: 400,
          note: '',
          noteTone: 'muted',
          segs: [
            {
              flex: 40,
              height: 5,
              tone: 'edge'
            },
            {
              flex: 25,
              height: 5,
              tone: 'amber'
            },
            {
              flex: 20,
              height: 5,
              tone: 'hairline'
            },
            {
              flex: 15,
              height: 5,
              tone: 'hairline'
            }
          ],
          barTone: 'amber',
          band: 'Developing',
          bandTone: 'developing-ink',
          rubi: false,
          mins: ''
        },
        {
          name: 'Fixed and indexed annuities',
          num: '58',
          weight: 400,
          note: '',
          noteTone: 'muted',
          segs: [
            {
              flex: 40,
              height: 5,
              tone: 'edge'
            },
            {
              flex: 25,
              height: 5,
              tone: 'amber'
            },
            {
              flex: 20,
              height: 5,
              tone: 'hairline'
            },
            {
              flex: 15,
              height: 5,
              tone: 'hairline'
            }
          ],
          barTone: 'amber',
          band: 'Developing',
          bandTone: 'developing-ink',
          rubi: false,
          mins: ''
        }
      ],
      toggleLabel: 'Hide 3 sub-topics',
      expandLabel: 'Expand Annuities sub-topics',
      collapseLabel: 'Collapse Annuities sub-topics'
    },
    {
      name: 'Policy Provisions',
      weight: 22,
      answered: '26 of 60 questions answered',
      score: 58,
      delta: 4,
      band: 'Developing',
      bandInk: 'developing-ink',
      bandBg: 'developing-wash',
      bandBorder: 'developing-edge',
      track: [
        {
          label: 'Beginner',
          flex: 40,
          labelTone: 'muted',
          labelWeight: 400,
          height: 10,
          radius: '5px 0 0 5px',
          tone: 'track-empty'
        },
        {
          label: 'Developing',
          flex: 25,
          labelTone: 'ink',
          labelWeight: 600,
          height: 10,
          radius: '0',
          tone: 'track-developing'
        },
        {
          label: 'Proficient',
          flex: 20,
          labelTone: 'muted',
          labelWeight: 400,
          height: 10,
          radius: '0',
          tone: 'track-proficient'
        },
        {
          label: 'Ready',
          flex: 15,
          labelTone: 'muted',
          labelWeight: 400,
          height: 10,
          radius: '0 5px 5px 0',
          tone: 'track-ready'
        }
      ],
      aria: 'Policy Provisions: 58 out of 100, Developing. Ready starts at 85.',
      gapNote: '27 points to Ready',
      expanded: false,
      isPrimary: false,
      subs: [
        {
          name: 'Riders',
          num: '47',
          weight: 600,
          note: 'Weakest',
          noteTone: 'rubi',
          segs: [
            {
              flex: 40,
              height: 5,
              tone: 'edge'
            },
            {
              flex: 25,
              height: 5,
              tone: 'amber'
            },
            {
              flex: 20,
              height: 5,
              tone: 'hairline'
            },
            {
              flex: 15,
              height: 5,
              tone: 'hairline'
            }
          ],
          barTone: 'amber',
          band: 'Developing',
          bandTone: 'developing-ink',
          rubi: true,
          mins: '12 min'
        },
        {
          name: 'Nonforfeiture options',
          num: '55',
          weight: 400,
          note: '',
          noteTone: 'muted',
          segs: [
            {
              flex: 40,
              height: 5,
              tone: 'edge'
            },
            {
              flex: 25,
              height: 5,
              tone: 'amber'
            },
            {
              flex: 20,
              height: 5,
              tone: 'hairline'
            },
            {
              flex: 15,
              height: 5,
              tone: 'hairline'
            }
          ],
          barTone: 'amber',
          band: 'Developing',
          bandTone: 'developing-ink',
          rubi: false,
          mins: ''
        },
        {
          name: 'Settlement options',
          num: '63',
          weight: 400,
          note: '',
          noteTone: 'muted',
          segs: [
            {
              flex: 40,
              height: 5,
              tone: 'edge'
            },
            {
              flex: 25,
              height: 5,
              tone: 'amber'
            },
            {
              flex: 20,
              height: 5,
              tone: 'hairline'
            },
            {
              flex: 15,
              height: 5,
              tone: 'hairline'
            }
          ],
          barTone: 'amber',
          band: 'Developing',
          bandTone: 'developing-ink',
          rubi: false,
          mins: ''
        },
        {
          name: 'Grace period & reinstatement',
          num: '67',
          weight: 400,
          note: '',
          noteTone: 'muted',
          segs: [
            {
              flex: 40,
              height: 5,
              tone: 'edge'
            },
            {
              flex: 25,
              height: 5,
              tone: 'amber'
            },
            {
              flex: 20,
              height: 5,
              tone: 'steel-light'
            },
            {
              flex: 15,
              height: 5,
              tone: 'hairline'
            }
          ],
          barTone: 'steel-light',
          band: 'Proficient',
          bandTone: 'proficient-ink',
          rubi: false,
          mins: ''
        }
      ],
      toggleLabel: 'Show 4 sub-topics',
      expandLabel: 'Expand Policy Provisions sub-topics',
      collapseLabel: 'Collapse Policy Provisions sub-topics'
    },
    {
      name: 'Insurance Regulation',
      weight: 18,
      answered: '20 of 45 questions answered',
      score: 61,
      delta: 1,
      band: 'Developing',
      bandInk: 'developing-ink',
      bandBg: 'developing-wash',
      bandBorder: 'developing-edge',
      track: [
        {
          label: 'Beginner',
          flex: 40,
          labelTone: 'muted',
          labelWeight: 400,
          height: 10,
          radius: '5px 0 0 5px',
          tone: 'track-empty'
        },
        {
          label: 'Developing',
          flex: 25,
          labelTone: 'ink',
          labelWeight: 600,
          height: 10,
          radius: '0',
          tone: 'track-developing'
        },
        {
          label: 'Proficient',
          flex: 20,
          labelTone: 'muted',
          labelWeight: 400,
          height: 10,
          radius: '0',
          tone: 'track-proficient'
        },
        {
          label: 'Ready',
          flex: 15,
          labelTone: 'muted',
          labelWeight: 400,
          height: 10,
          radius: '0 5px 5px 0',
          tone: 'track-ready'
        }
      ],
      aria: 'Insurance Regulation: 61 out of 100, Developing. Ready starts at 85.',
      gapNote: '24 points to Ready',
      expanded: false,
      isPrimary: false,
      subs: [
        {
          name: 'Florida licensing rules',
          num: '54',
          weight: 600,
          note: 'Weakest',
          noteTone: 'rubi',
          segs: [
            {
              flex: 40,
              height: 5,
              tone: 'edge'
            },
            {
              flex: 25,
              height: 5,
              tone: 'amber'
            },
            {
              flex: 20,
              height: 5,
              tone: 'hairline'
            },
            {
              flex: 15,
              height: 5,
              tone: 'hairline'
            }
          ],
          barTone: 'amber',
          band: 'Developing',
          bandTone: 'developing-ink',
          rubi: true,
          mins: '12 min'
        },
        {
          name: 'Unfair trade practices',
          num: '63',
          weight: 400,
          note: '',
          noteTone: 'muted',
          segs: [
            {
              flex: 40,
              height: 5,
              tone: 'edge'
            },
            {
              flex: 25,
              height: 5,
              tone: 'amber'
            },
            {
              flex: 20,
              height: 5,
              tone: 'hairline'
            },
            {
              flex: 15,
              height: 5,
              tone: 'hairline'
            }
          ],
          barTone: 'amber',
          band: 'Developing',
          bandTone: 'developing-ink',
          rubi: false,
          mins: ''
        },
        {
          name: 'Replacement & agent duties',
          num: '66',
          weight: 400,
          note: '',
          noteTone: 'muted',
          segs: [
            {
              flex: 40,
              height: 5,
              tone: 'edge'
            },
            {
              flex: 25,
              height: 5,
              tone: 'amber'
            },
            {
              flex: 20,
              height: 5,
              tone: 'steel-light'
            },
            {
              flex: 15,
              height: 5,
              tone: 'hairline'
            }
          ],
          barTone: 'steel-light',
          band: 'Proficient',
          bandTone: 'proficient-ink',
          rubi: false,
          mins: ''
        }
      ],
      toggleLabel: 'Show 3 sub-topics',
      expandLabel: 'Expand Insurance Regulation sub-topics',
      collapseLabel: 'Collapse Insurance Regulation sub-topics'
    },
    {
      name: 'Health Insurance',
      weight: 18,
      answered: '24 of 45 questions answered',
      score: 66,
      delta: 2,
      band: 'Proficient',
      bandInk: 'proficient-ink',
      bandBg: 'proficient-wash',
      bandBorder: 'steel-edge',
      track: [
        {
          label: 'Beginner',
          flex: 40,
          labelTone: 'muted',
          labelWeight: 400,
          height: 10,
          radius: '5px 0 0 5px',
          tone: 'track-empty'
        },
        {
          label: 'Developing',
          flex: 25,
          labelTone: 'muted',
          labelWeight: 400,
          height: 10,
          radius: '0',
          tone: 'track-developing'
        },
        {
          label: 'Proficient',
          flex: 20,
          labelTone: 'ink',
          labelWeight: 600,
          height: 10,
          radius: '0',
          tone: 'track-proficient'
        },
        {
          label: 'Ready',
          flex: 15,
          labelTone: 'muted',
          labelWeight: 400,
          height: 10,
          radius: '0 5px 5px 0',
          tone: 'track-ready'
        }
      ],
      aria: 'Health Insurance: 66 out of 100, Proficient. Ready starts at 85.',
      gapNote: '19 points to Ready',
      expanded: false,
      isPrimary: false,
      subs: [
        {
          name: 'Disability income',
          num: '59',
          weight: 600,
          note: 'Weakest',
          noteTone: 'rubi',
          segs: [
            {
              flex: 40,
              height: 5,
              tone: 'edge'
            },
            {
              flex: 25,
              height: 5,
              tone: 'amber'
            },
            {
              flex: 20,
              height: 5,
              tone: 'hairline'
            },
            {
              flex: 15,
              height: 5,
              tone: 'hairline'
            }
          ],
          barTone: 'amber',
          band: 'Developing',
          bandTone: 'developing-ink',
          rubi: true,
          mins: '12 min'
        },
        {
          name: 'Medical expense plans',
          num: '68',
          weight: 400,
          note: '',
          noteTone: 'muted',
          segs: [
            {
              flex: 40,
              height: 5,
              tone: 'edge'
            },
            {
              flex: 25,
              height: 5,
              tone: 'amber'
            },
            {
              flex: 20,
              height: 5,
              tone: 'steel-light'
            },
            {
              flex: 15,
              height: 5,
              tone: 'hairline'
            }
          ],
          barTone: 'steel-light',
          band: 'Proficient',
          bandTone: 'proficient-ink',
          rubi: false,
          mins: ''
        },
        {
          name: 'Medicare & supplements',
          num: '71',
          weight: 400,
          note: '',
          noteTone: 'muted',
          segs: [
            {
              flex: 40,
              height: 5,
              tone: 'edge'
            },
            {
              flex: 25,
              height: 5,
              tone: 'amber'
            },
            {
              flex: 20,
              height: 5,
              tone: 'steel-light'
            },
            {
              flex: 15,
              height: 5,
              tone: 'hairline'
            }
          ],
          barTone: 'steel-light',
          band: 'Proficient',
          bandTone: 'proficient-ink',
          rubi: false,
          mins: ''
        }
      ],
      toggleLabel: 'Show 3 sub-topics',
      expandLabel: 'Expand Health Insurance sub-topics',
      collapseLabel: 'Collapse Health Insurance sub-topics'
    },
    {
      name: 'Life Insurance',
      weight: 22,
      answered: '30 of 60 questions answered',
      score: 74,
      delta: 3,
      band: 'Proficient',
      bandInk: 'proficient-ink',
      bandBg: 'proficient-wash',
      bandBorder: 'steel-edge',
      track: [
        {
          label: 'Beginner',
          flex: 40,
          labelTone: 'muted',
          labelWeight: 400,
          height: 10,
          radius: '5px 0 0 5px',
          tone: 'track-empty'
        },
        {
          label: 'Developing',
          flex: 25,
          labelTone: 'muted',
          labelWeight: 400,
          height: 10,
          radius: '0',
          tone: 'track-developing'
        },
        {
          label: 'Proficient',
          flex: 20,
          labelTone: 'ink',
          labelWeight: 600,
          height: 10,
          radius: '0',
          tone: 'track-proficient'
        },
        {
          label: 'Ready',
          flex: 15,
          labelTone: 'muted',
          labelWeight: 400,
          height: 10,
          radius: '0 5px 5px 0',
          tone: 'track-ready'
        }
      ],
      aria: 'Life Insurance: 74 out of 100, Proficient. Ready starts at 85.',
      gapNote: '11 points to Ready',
      expanded: false,
      isPrimary: false,
      subs: [
        {
          name: 'Policy types: term, whole, universal',
          num: '67',
          weight: 600,
          note: 'Weakest',
          noteTone: 'rubi',
          segs: [
            {
              flex: 40,
              height: 5,
              tone: 'edge'
            },
            {
              flex: 25,
              height: 5,
              tone: 'amber'
            },
            {
              flex: 20,
              height: 5,
              tone: 'steel-light'
            },
            {
              flex: 15,
              height: 5,
              tone: 'hairline'
            }
          ],
          barTone: 'steel-light',
          band: 'Proficient',
          bandTone: 'proficient-ink',
          rubi: true,
          mins: '12 min'
        },
        {
          name: 'Underwriting & insurable interest',
          num: '76',
          weight: 400,
          note: '',
          noteTone: 'muted',
          segs: [
            {
              flex: 40,
              height: 5,
              tone: 'edge'
            },
            {
              flex: 25,
              height: 5,
              tone: 'amber'
            },
            {
              flex: 20,
              height: 5,
              tone: 'steel-light'
            },
            {
              flex: 15,
              height: 5,
              tone: 'hairline'
            }
          ],
          barTone: 'steel-light',
          band: 'Proficient',
          bandTone: 'proficient-ink',
          rubi: false,
          mins: ''
        },
        {
          name: 'Owners & beneficiaries',
          num: '79',
          weight: 400,
          note: '',
          noteTone: 'muted',
          segs: [
            {
              flex: 40,
              height: 5,
              tone: 'edge'
            },
            {
              flex: 25,
              height: 5,
              tone: 'amber'
            },
            {
              flex: 20,
              height: 5,
              tone: 'steel-light'
            },
            {
              flex: 15,
              height: 5,
              tone: 'hairline'
            }
          ],
          barTone: 'steel-light',
          band: 'Proficient',
          bandTone: 'proficient-ink',
          rubi: false,
          mins: ''
        }
      ],
      toggleLabel: 'Show 3 sub-topics',
      expandLabel: 'Expand Life Insurance sub-topics',
      collapseLabel: 'Collapse Life Insurance sub-topics'
    }
  ],
  bandHelp: [
    {
      name: 'Beginner',
      range: '0–39',
      dotTone: 'edge',
      text: 'Still building the basics. Learn the lessons, then practice.'
    },
    {
      name: 'Developing',
      range: '40–64',
      dotTone: 'amber',
      text: 'You know some of it. Practice the weakest sub-topics to close gaps.'
    },
    {
      name: 'Proficient',
      range: '65–84',
      dotTone: 'steel-light',
      text: 'Solid. A few gaps left before you’re exam ready.'
    },
    {
      name: 'Ready',
      range: '85–100',
      dotTone: 'green',
      text: 'Consistently right across the topic. Keep it fresh with spaced review.'
    }
  ],
  mobileBar: {
    primary: [
      {
        label: 'Overview',
        page: 'Main'
      },
      {
        label: 'Learn',
        page: 'Learn'
      },
      {
        label: 'Practice',
        page: 'Practice'
      },
      {
        label: 'Flashcards',
        page: 'Flashcards'
      }
    ],
    more: [
      {
        label: 'Prep Review',
        page: 'PrepReview'
      },
      {
        label: 'Readiness',
        page: 'Readiness'
      },
      {
        label: 'Study planner',
        page: 'StudyPlanner'
      },
      {
        label: 'Exam Simulator',
        page: 'ExamSimulator'
      }
    ]
  }
} as const

/**
 * HIS PROSE. Template text rather than data, so it is transcribed from the
 * page as rendered at 1440px — `/port-prototype`'s "read the running build".
 *
 * ⚠ THE NUMBERS INSIDE THE SENTENCES ARE HIS, AND THEY ARE LITERAL. "your
 * lowest sub-topic at 41", "20% of your exam", "hasn't been retested in 9
 * days" — his template writes these out rather than interpolating them, so
 * they do not move when the fixture above does. Left as he wrote them: making
 * them derive would be inventing a binding he did not build, and the first
 * reviewer to notice a mismatch should be told it is his, not the port's.
 */
export const JEFF_MVP_READINESS_COPY = {
  title: 'Your readiness',
  lead: 'Where you stand across the full exam blueprint, how far you’ve come, and the topics still holding you back. The one move that will lift your Readiness most is always at the top, so this page tells you what to do next, not just how it’s going.',
  liveChip: 'Live · Updated just now',

  nextEyebrow: 'Do this next · Readiness',
  nextTitle: 'Practice Variable Annuities',
  nextBody:
    'It’s your lowest sub-topic at 41, inside Annuities (20% of your exam). A short practice set here is the biggest lift to your Readiness right now.',
  setEyebrow: 'Recommended set',
  setTitle: 'Variable Annuities',
  setMeta: '12 questions · about 12 min · biggest lift',
  setCta: 'Start practice',
  setAlt: 'All practice sets',

  /* The strip under the panel. His bold is on the sub-topic name only. */
  alsoLead: 'Also worth a look:',
  alsoStrong: 'Settlement options',
  alsoRest:
    'in Policy Provisions hasn’t been retested in 9 days. A short round turns that into fresh evidence.',
  alsoCta: 'Review ›',

  trendEyebrow: 'Readiness trend',
  trendBody:
    'Your Readiness over the last 3 weeks. It has risen +6 points in that time. Steady, spaced practice is what moves this line, not cramming.',
  /* The y-axis reads 40 and 65 — the bottom of the plot and today's gridline —
     with the Ready line labelled separately at 85. */
  axisLow: '40',
  axisHigh: '65',
  axisReady: 'Ready 85',
  axisDates: ['Oct 15', 'Oct 22', 'Oct 29', 'Today'],
  trendCaption:
    'One score: the blueprint-weighted average of your topic scores, from Exam Prep practice only.',

  topicsTitle: 'Readiness by topic',
  topicsSub: '0 of 5 topics Ready · Annuities is the biggest lift · weakest first',
  topicsBody:
    'Topic Readiness is how well you’ve shown you know each topic, scored 0 to 100 from your practice answers, not how many questions you’ve done. The marker shows where you stand today, and it shifts a little each day with what you practice and what you get right.',
  markerLegend: 'You are here today',
  helpCta: 'What do these levels mean?',
  subEyebrow: 'Readiness by sub-topic',
  deltaSuffix: 'points in 3 weeks',
  practiceCta: 'Practice',
  startHere: 'Start here',
  aboutMins: 'About',

  footnote:
    'Readiness comes from Exam Prep practice only. Course lessons build Progress, not Readiness. Ready means 85 or higher in every topic.',
  askRubi: 'Ask Rubi',
} as const

/**
 * THE LEARN PAGE — his second rail row, ported 2026-11-09.
 *
 * Nineteen chapters of a Qualifying Education course, each one of three
 * states, with a "where you left off" card above and the certification exam
 * below.
 *
 * ⚠ ONLY CHAPTER 2 IS AUTHORED. Its lessons are titled "Lesson 1: Stock and
 * Mutual Insurers" and so on; every other chapter carries bare outline topics
 * ("Introduction", "Elements of a legal contract"). That asymmetry is HIS —
 * Chapter 2 is the chapter his `Course.dc.html` actually plays — and it is
 * left exactly as it arrived. Normalising the other eighteen into "Lesson n:"
 * would invent eighteen chapters of content he has not written.
 *
 * ⚠ A LOCKED CHAPTER STILL OPENS, and shows BOTH its lock message and its
 * lessons: `showLessons: isOpen`, `showLockMsg: isOpen && isLocked`. That is
 * the page's own promise in the lead — "a locked step tells you exactly what
 * opens it" — and it is why `lockMsg` is on every chapter including the two
 * that are not locked.
 *
 * ⚠ `status` IS AN EMPTY STRING ON A LOCKED CHAPTER. The word "Locked" a
 * reviewer sees is template text keyed off `isLocked`, not data. Left as he
 * wrote it so the component decides rather than the fixture.
 *
 * ⚠ HIS PROGRESS FIGURE IS CHAPTER 2's ON ALL NINETEEN ROWS — `progPct` is
 * computed once from the current chapter and attached to every chapter. It is
 * harmless because the bar renders only under `isCurrent`, and it is carried
 * verbatim rather than "fixed": a fixture that disagreed with his output
 * would be the port having an opinion.
 */
export const JEFF_MVP_LEARN = {
  chapters: [
    {
      n: 1,
      title: 'Basic Principles of Life and Health Insurance',
      eyebrow: 'Chapter 1 · 7 lessons',
      state: 'done',
      status: 'Completed',
      statusTone: 'green',
      hasAction: true,
      action: 'Review',
      actionLabel: 'Review Chapter 1: Basic Principles of Life and Health Insurance',
      chevLabel: 'Expand Chapter 1',
      progPct: '29%',
      progAria: 'Chapter 2: 2 of 7 lessons complete',
      lockMsg: 'Opens when you finish Chapter 0.',
      exam: {
        title: 'Chapter 1 exam',
        done: true,
        locked: false,
        note: 'Completed'
      },
      lessons: [
        {
          label: 'Introduction',
          state: 'done'
        },
        {
          label: 'Benefits and the costs of insurance to society / professional designations',
          state: 'done'
        },
        {
          label: 'Risk / loss exposure',
          state: 'done'
        },
        {
          label: 'Insurance / indemnity / pay on behalf of / methods of handling risk / risk management techniques',
          state: 'done'
        },
        {
          label: 'Elements of insurable risks / ideally insurable risk / rate filing and forms services',
          state: 'done'
        },
        {
          label: 'Federal regulation',
          state: 'done'
        },
        {
          label: 'Chapter Summary',
          state: 'done'
        }
      ]
    },
    {
      n: 2,
      title: 'Insurers and Insurance Markets',
      eyebrow: 'Chapter 2 · 7 lessons · You are here',
      state: 'current',
      status: 'In progress',
      statusTone: 'steel-deep',
      hasAction: true,
      action: 'Resume',
      actionLabel: 'Resume Chapter 2: Insurers and Insurance Markets',
      chevLabel: 'Collapse Chapter 2',
      progPct: '29%',
      progAria: 'Chapter 2: 2 of 7 lessons complete',
      lockMsg: 'Opens when you finish Chapter 1.',
      exam: {
        title: 'Chapter 2 exam',
        done: false,
        locked: true,
        note: 'Opens after all 7 lessons'
      },
      lessons: [
        {
          label: 'Lesson 1: Stock and Mutual Insurers',
          state: 'done'
        },
        {
          label: 'Lesson 2: Mutualization and Demutualization',
          state: 'done'
        },
        {
          label: 'Lesson 3: Domestic, Foreign and Alien Insurers',
          state: 'current'
        },
        {
          label: 'Lesson 4: Admitted and Non-admitted Insurers',
          state: 'locked'
        },
        {
          label: 'Lesson 5: Standard, Surplus Lines and Residual Markets',
          state: 'locked'
        },
        {
          label: 'Lesson 6: Participating and Nonparticipating Policies',
          state: 'locked'
        },
        {
          label: 'Lesson 7: Chapter Review and Quick Check',
          state: 'locked'
        }
      ]
    },
    {
      n: 3,
      title: 'Legal Concepts of Insurance',
      eyebrow: 'Chapter 3 · 7 lessons',
      state: 'locked',
      status: '',
      statusTone: 'muted',
      hasAction: false,
      action: 'Review',
      actionLabel: 'Review Chapter 3: Legal Concepts of Insurance',
      chevLabel: 'Expand Chapter 3',
      progPct: '29%',
      progAria: 'Chapter 2: 2 of 7 lessons complete',
      lockMsg: 'Opens when you finish Chapter 2.',
      exam: {
        title: 'Chapter 3 exam',
        done: false,
        locked: true,
        note: 'Opens after all 7 lessons'
      },
      lessons: [
        {
          label: 'Introduction',
          state: 'locked'
        },
        {
          label: 'Elements of a legal contract',
          state: 'locked'
        },
        {
          label: 'Contracts of adhesion / aleatory / unilateral / conditional',
          state: 'locked'
        },
        {
          label: 'Insurable interest and utmost good faith',
          state: 'locked'
        },
        {
          label: 'Representations, warranties and concealment',
          state: 'locked'
        },
        {
          label: 'Agency law / authority of the agent',
          state: 'locked'
        },
        {
          label: 'Chapter Summary',
          state: 'locked'
        }
      ]
    },
    {
      n: 4,
      title: 'Life Insurance Policy Types',
      eyebrow: 'Chapter 4 · 7 lessons',
      state: 'locked',
      status: '',
      statusTone: 'muted',
      hasAction: false,
      action: 'Review',
      actionLabel: 'Review Chapter 4: Life Insurance Policy Types',
      chevLabel: 'Expand Chapter 4',
      progPct: '29%',
      progAria: 'Chapter 2: 2 of 7 lessons complete',
      lockMsg: 'Opens when you finish Chapter 3.',
      exam: {
        title: 'Chapter 4 exam',
        done: false,
        locked: true,
        note: 'Opens after all 7 lessons'
      },
      lessons: [
        {
          label: 'Introduction',
          state: 'locked'
        },
        {
          label: 'Term life insurance',
          state: 'locked'
        },
        {
          label: 'Whole life insurance',
          state: 'locked'
        },
        {
          label: 'Universal life insurance',
          state: 'locked'
        },
        {
          label: 'Variable and variable universal life',
          state: 'locked'
        },
        {
          label: 'Special-use policies',
          state: 'locked'
        },
        {
          label: 'Chapter Summary',
          state: 'locked'
        }
      ]
    },
    {
      n: 5,
      title: 'Life Insurance Provisions, Options, and Riders',
      eyebrow: 'Chapter 5 · 7 lessons',
      state: 'locked',
      status: '',
      statusTone: 'muted',
      hasAction: false,
      action: 'Review',
      actionLabel: 'Review Chapter 5: Life Insurance Provisions, Options, and Riders',
      chevLabel: 'Expand Chapter 5',
      progPct: '29%',
      progAria: 'Chapter 2: 2 of 7 lessons complete',
      lockMsg: 'Opens when you finish Chapter 4.',
      exam: {
        title: 'Chapter 5 exam',
        done: false,
        locked: true,
        note: 'Opens after all 7 lessons'
      },
      lessons: [
        {
          label: 'Introduction',
          state: 'locked'
        },
        {
          label: 'Standard policy provisions',
          state: 'locked'
        },
        {
          label: 'Nonforfeiture options',
          state: 'locked'
        },
        {
          label: 'Dividend options',
          state: 'locked'
        },
        {
          label: 'Settlement options',
          state: 'locked'
        },
        {
          label: 'Policy riders',
          state: 'locked'
        },
        {
          label: 'Chapter Summary',
          state: 'locked'
        }
      ]
    },
    {
      n: 6,
      title: 'Life Insurance Premiums Proceeds and Beneficiaries',
      eyebrow: 'Chapter 6 · 6 lessons',
      state: 'locked',
      status: '',
      statusTone: 'muted',
      hasAction: false,
      action: 'Review',
      actionLabel: 'Review Chapter 6: Life Insurance Premiums Proceeds and Beneficiaries',
      chevLabel: 'Expand Chapter 6',
      progPct: '29%',
      progAria: 'Chapter 2: 2 of 7 lessons complete',
      lockMsg: 'Opens when you finish Chapter 5.',
      exam: {
        title: 'Chapter 6 exam',
        done: false,
        locked: true,
        note: 'Opens after all 6 lessons'
      },
      lessons: [
        {
          label: 'Introduction',
          state: 'locked'
        },
        {
          label: 'Premium factors and modes',
          state: 'locked'
        },
        {
          label: 'Beneficiary designations',
          state: 'locked'
        },
        {
          label: 'Proceeds and settlement',
          state: 'locked'
        },
        {
          label: 'Taxation of premiums and proceeds',
          state: 'locked'
        },
        {
          label: 'Chapter Summary',
          state: 'locked'
        }
      ]
    },
    {
      n: 7,
      title: 'Life Insurance Underwriting and Policy Issue',
      eyebrow: 'Chapter 7 · 7 lessons',
      state: 'locked',
      status: '',
      statusTone: 'muted',
      hasAction: false,
      action: 'Review',
      actionLabel: 'Review Chapter 7: Life Insurance Underwriting and Policy Issue',
      chevLabel: 'Expand Chapter 7',
      progPct: '29%',
      progAria: 'Chapter 2: 2 of 7 lessons complete',
      lockMsg: 'Opens when you finish Chapter 6.',
      exam: {
        title: 'Chapter 7 exam',
        done: false,
        locked: true,
        note: 'Opens after all 7 lessons'
      },
      lessons: [
        {
          label: 'Introduction',
          state: 'locked'
        },
        {
          label: 'The application',
          state: 'locked'
        },
        {
          label: 'Field underwriting',
          state: 'locked'
        },
        {
          label: 'Sources of underwriting information',
          state: 'locked'
        },
        {
          label: 'Risk classification',
          state: 'locked'
        },
        {
          label: 'Policy delivery',
          state: 'locked'
        },
        {
          label: 'Chapter Summary',
          state: 'locked'
        }
      ]
    },
    {
      n: 8,
      title: 'Group Life Insurance',
      eyebrow: 'Chapter 8 · 6 lessons',
      state: 'locked',
      status: '',
      statusTone: 'muted',
      hasAction: false,
      action: 'Review',
      actionLabel: 'Review Chapter 8: Group Life Insurance',
      chevLabel: 'Expand Chapter 8',
      progPct: '29%',
      progAria: 'Chapter 2: 2 of 7 lessons complete',
      lockMsg: 'Opens when you finish Chapter 7.',
      exam: {
        title: 'Chapter 8 exam',
        done: false,
        locked: true,
        note: 'Opens after all 6 lessons'
      },
      lessons: [
        {
          label: 'Introduction',
          state: 'locked'
        },
        {
          label: 'Group insurance principles',
          state: 'locked'
        },
        {
          label: 'Group term life',
          state: 'locked'
        },
        {
          label: 'Group permanent life',
          state: 'locked'
        },
        {
          label: 'Conversion privileges',
          state: 'locked'
        },
        {
          label: 'Chapter Summary',
          state: 'locked'
        }
      ]
    },
    {
      n: 9,
      title: 'Annuities',
      eyebrow: 'Chapter 9 · 7 lessons',
      state: 'locked',
      status: '',
      statusTone: 'muted',
      hasAction: false,
      action: 'Review',
      actionLabel: 'Review Chapter 9: Annuities',
      chevLabel: 'Expand Chapter 9',
      progPct: '29%',
      progAria: 'Chapter 2: 2 of 7 lessons complete',
      lockMsg: 'Opens when you finish Chapter 8.',
      exam: {
        title: 'Chapter 9 exam',
        done: false,
        locked: true,
        note: 'Opens after all 7 lessons'
      },
      lessons: [
        {
          label: 'Introduction',
          state: 'locked'
        },
        {
          label: 'Annuity structure and parties',
          state: 'locked'
        },
        {
          label: 'Accumulation and annuitization',
          state: 'locked'
        },
        {
          label: 'Fixed, indexed and variable annuities',
          state: 'locked'
        },
        {
          label: 'Annuity payout options',
          state: 'locked'
        },
        {
          label: 'Taxation of annuities',
          state: 'locked'
        },
        {
          label: 'Chapter Summary',
          state: 'locked'
        }
      ]
    },
    {
      n: 10,
      title: 'Uses of Life Insurance',
      eyebrow: 'Chapter 10 · 6 lessons',
      state: 'locked',
      status: '',
      statusTone: 'muted',
      hasAction: false,
      action: 'Review',
      actionLabel: 'Review Chapter 10: Uses of Life Insurance',
      chevLabel: 'Expand Chapter 10',
      progPct: '29%',
      progAria: 'Chapter 2: 2 of 7 lessons complete',
      lockMsg: 'Opens when you finish Chapter 9.',
      exam: {
        title: 'Chapter 10 exam',
        done: false,
        locked: true,
        note: 'Opens after all 6 lessons'
      },
      lessons: [
        {
          label: 'Introduction',
          state: 'locked'
        },
        {
          label: 'Personal uses',
          state: 'locked'
        },
        {
          label: 'Business uses',
          state: 'locked'
        },
        {
          label: 'Buy-sell and key person coverage',
          state: 'locked'
        },
        {
          label: 'Estate planning',
          state: 'locked'
        },
        {
          label: 'Chapter Summary',
          state: 'locked'
        }
      ]
    },
    {
      n: 11,
      title: 'Retirement Plans',
      eyebrow: 'Chapter 11 · 6 lessons',
      state: 'locked',
      status: '',
      statusTone: 'muted',
      hasAction: false,
      action: 'Review',
      actionLabel: 'Review Chapter 11: Retirement Plans',
      chevLabel: 'Expand Chapter 11',
      progPct: '29%',
      progAria: 'Chapter 2: 2 of 7 lessons complete',
      lockMsg: 'Opens when you finish Chapter 10.',
      exam: {
        title: 'Chapter 11 exam',
        done: false,
        locked: true,
        note: 'Opens after all 6 lessons'
      },
      lessons: [
        {
          label: 'Introduction',
          state: 'locked'
        },
        {
          label: 'Qualified vs. nonqualified plans',
          state: 'locked'
        },
        {
          label: 'Individual retirement accounts (IRAs)',
          state: 'locked'
        },
        {
          label: 'Employer-sponsored plans',
          state: 'locked'
        },
        {
          label: '401(k) and 403(b) plans',
          state: 'locked'
        },
        {
          label: 'Chapter Summary',
          state: 'locked'
        }
      ]
    },
    {
      n: 12,
      title: 'Social Security',
      eyebrow: 'Chapter 12 · 5 lessons',
      state: 'locked',
      status: '',
      statusTone: 'muted',
      hasAction: false,
      action: 'Review',
      actionLabel: 'Review Chapter 12: Social Security',
      chevLabel: 'Expand Chapter 12',
      progPct: '29%',
      progAria: 'Chapter 2: 2 of 7 lessons complete',
      lockMsg: 'Opens when you finish Chapter 11.',
      exam: {
        title: 'Chapter 12 exam',
        done: false,
        locked: true,
        note: 'Opens after all 5 lessons'
      },
      lessons: [
        {
          label: 'Introduction',
          state: 'locked'
        },
        {
          label: 'Eligibility and insured status',
          state: 'locked'
        },
        {
          label: 'Retirement benefits',
          state: 'locked'
        },
        {
          label: 'Survivor and disability benefits',
          state: 'locked'
        },
        {
          label: 'Chapter Summary',
          state: 'locked'
        }
      ]
    },
    {
      n: 13,
      title: 'Health and Accident Insurance',
      eyebrow: 'Chapter 13 · 5 lessons',
      state: 'locked',
      status: '',
      statusTone: 'muted',
      hasAction: false,
      action: 'Review',
      actionLabel: 'Review Chapter 13: Health and Accident Insurance',
      chevLabel: 'Expand Chapter 13',
      progPct: '29%',
      progAria: 'Chapter 2: 2 of 7 lessons complete',
      lockMsg: 'Opens when you finish Chapter 12.',
      exam: {
        title: 'Chapter 13 exam',
        done: false,
        locked: true,
        note: 'Opens after all 5 lessons'
      },
      lessons: [
        {
          label: 'Introduction',
          state: 'locked'
        },
        {
          label: 'Types of health coverage',
          state: 'locked'
        },
        {
          label: 'Accidental death and dismemberment',
          state: 'locked'
        },
        {
          label: 'Limited and special risk policies',
          state: 'locked'
        },
        {
          label: 'Chapter Summary',
          state: 'locked'
        }
      ]
    },
    {
      n: 14,
      title: 'Health Insurance Providers',
      eyebrow: 'Chapter 14 · 6 lessons',
      state: 'locked',
      status: '',
      statusTone: 'muted',
      hasAction: false,
      action: 'Review',
      actionLabel: 'Review Chapter 14: Health Insurance Providers',
      chevLabel: 'Expand Chapter 14',
      progPct: '29%',
      progAria: 'Chapter 2: 2 of 7 lessons complete',
      lockMsg: 'Opens when you finish Chapter 13.',
      exam: {
        title: 'Chapter 14 exam',
        done: false,
        locked: true,
        note: 'Opens after all 6 lessons'
      },
      lessons: [
        {
          label: 'Introduction',
          state: 'locked'
        },
        {
          label: 'Commercial insurers',
          state: 'locked'
        },
        {
          label: 'Service providers',
          state: 'locked'
        },
        {
          label: 'Health maintenance organizations (HMOs)',
          state: 'locked'
        },
        {
          label: 'PPOs and POS plans',
          state: 'locked'
        },
        {
          label: 'Chapter Summary',
          state: 'locked'
        }
      ]
    },
    {
      n: 15,
      title: 'Medical Expense Insurance',
      eyebrow: 'Chapter 15 · 6 lessons',
      state: 'locked',
      status: '',
      statusTone: 'muted',
      hasAction: false,
      action: 'Review',
      actionLabel: 'Review Chapter 15: Medical Expense Insurance',
      chevLabel: 'Expand Chapter 15',
      progPct: '29%',
      progAria: 'Chapter 2: 2 of 7 lessons complete',
      lockMsg: 'Opens when you finish Chapter 14.',
      exam: {
        title: 'Chapter 15 exam',
        done: false,
        locked: true,
        note: 'Opens after all 6 lessons'
      },
      lessons: [
        {
          label: 'Introduction',
          state: 'locked'
        },
        {
          label: 'Basic medical expense',
          state: 'locked'
        },
        {
          label: 'Major medical',
          state: 'locked'
        },
        {
          label: 'Cost-sharing provisions',
          state: 'locked'
        },
        {
          label: 'Health savings accounts',
          state: 'locked'
        },
        {
          label: 'Chapter Summary',
          state: 'locked'
        }
      ]
    },
    {
      n: 16,
      title: 'Disability Income Insurance',
      eyebrow: 'Chapter 16 · 6 lessons',
      state: 'locked',
      status: '',
      statusTone: 'muted',
      hasAction: false,
      action: 'Review',
      actionLabel: 'Review Chapter 16: Disability Income Insurance',
      chevLabel: 'Expand Chapter 16',
      progPct: '29%',
      progAria: 'Chapter 2: 2 of 7 lessons complete',
      lockMsg: 'Opens when you finish Chapter 15.',
      exam: {
        title: 'Chapter 16 exam',
        done: false,
        locked: true,
        note: 'Opens after all 6 lessons'
      },
      lessons: [
        {
          label: 'Introduction',
          state: 'locked'
        },
        {
          label: 'Definitions of disability',
          state: 'locked'
        },
        {
          label: 'Benefit and elimination periods',
          state: 'locked'
        },
        {
          label: 'Individual and group disability',
          state: 'locked'
        },
        {
          label: 'Business disability coverage',
          state: 'locked'
        },
        {
          label: 'Chapter Summary',
          state: 'locked'
        }
      ]
    },
    {
      n: 17,
      title: 'Health Insurance Plans for Seniors',
      eyebrow: 'Chapter 17 · 6 lessons',
      state: 'locked',
      status: '',
      statusTone: 'muted',
      hasAction: false,
      action: 'Review',
      actionLabel: 'Review Chapter 17: Health Insurance Plans for Seniors',
      chevLabel: 'Expand Chapter 17',
      progPct: '29%',
      progAria: 'Chapter 2: 2 of 7 lessons complete',
      lockMsg: 'Opens when you finish Chapter 16.',
      exam: {
        title: 'Chapter 17 exam',
        done: false,
        locked: true,
        note: 'Opens after all 6 lessons'
      },
      lessons: [
        {
          label: 'Introduction',
          state: 'locked'
        },
        {
          label: 'Medicare Parts A and B',
          state: 'locked'
        },
        {
          label: 'Medicare Advantage and Part D',
          state: 'locked'
        },
        {
          label: 'Medicare supplement policies',
          state: 'locked'
        },
        {
          label: 'Long-term care insurance',
          state: 'locked'
        },
        {
          label: 'Chapter Summary',
          state: 'locked'
        }
      ]
    },
    {
      n: 18,
      title: 'Health Insurance Policy Provisions',
      eyebrow: 'Chapter 18 · 6 lessons',
      state: 'locked',
      status: '',
      statusTone: 'muted',
      hasAction: false,
      action: 'Review',
      actionLabel: 'Review Chapter 18: Health Insurance Policy Provisions',
      chevLabel: 'Expand Chapter 18',
      progPct: '29%',
      progAria: 'Chapter 2: 2 of 7 lessons complete',
      lockMsg: 'Opens when you finish Chapter 17.',
      exam: {
        title: 'Chapter 18 exam',
        done: false,
        locked: true,
        note: 'Opens after all 6 lessons'
      },
      lessons: [
        {
          label: 'Introduction',
          state: 'locked'
        },
        {
          label: 'Mandatory uniform provisions',
          state: 'locked'
        },
        {
          label: 'Optional uniform provisions',
          state: 'locked'
        },
        {
          label: 'Other provisions and clauses',
          state: 'locked'
        },
        {
          label: 'Renewability',
          state: 'locked'
        },
        {
          label: 'Chapter Summary',
          state: 'locked'
        }
      ]
    },
    {
      n: 19,
      title: 'Health Insurance Underwriting and Policy Issue',
      eyebrow: 'Chapter 19 · 5 lessons',
      state: 'locked',
      status: '',
      statusTone: 'muted',
      hasAction: false,
      action: 'Review',
      actionLabel: 'Review Chapter 19: Health Insurance Underwriting and Policy Issue',
      chevLabel: 'Expand Chapter 19',
      progPct: '29%',
      progAria: 'Chapter 2: 2 of 7 lessons complete',
      lockMsg: 'Opens when you finish Chapter 18.',
      exam: {
        title: 'Chapter 19 exam',
        done: false,
        locked: true,
        note: 'Opens after all 5 lessons'
      },
      lessons: [
        {
          label: 'Introduction',
          state: 'locked'
        },
        {
          label: 'The application',
          state: 'locked'
        },
        {
          label: 'Risk classification',
          state: 'locked'
        },
        {
          label: 'Policy delivery',
          state: 'locked'
        },
        {
          label: 'Chapter Summary',
          state: 'locked'
        }
      ]
    }
  ]
} as const

/**
 * HIS LEARN PROSE AND FIGURES. Template text rather than data — transcribed
 * from the page as rendered at 1440px.
 *
 * ⚠ THE HEADER FIGURES ARE HARD-CODED IN HIS TEMPLATE, including the ring's
 * `stroke-dasharray`. "180.0 314.2" on a circle of r=50 is 57.3% of the
 * circumference, while the label beside it reads 61% and "22 of 36 lessons"
 * is 61.1%. His arc is a little short of his number. Carried VERBATIM: the
 * mismatch is three pixels wide, it is his, and a port that quietly corrected
 * it would be the one place a reviewer's screenshot disagreed with the
 * designer's.
 */
export const JEFF_MVP_LEARN_COPY = {
  title: 'Your Course',
  lead: 'Work through it from the top. Each step opens the next one, and a locked step tells you exactly what opens it.',

  resumeEyebrow: 'Where you left off',
  resumeTitle: 'Chapter 2 · Insurers and Insurance Markets',
  resumeLesson: 'Lesson 3: Domestic, Foreign and Alien Insurers',
  resumeCta: 'Resume lesson',
  /* The thin bar inside the resume card — his Chapter 2 figure again. */
  resumePct: '29%',

  courseEyebrow: '19 chapters · 28 of 40 hours',
  courseTitle: 'Qualifying Education',
  courseSub: 'Florida Life and Health Pre-licensing',
  courseStatus: 'Completed',
  courseLessons: '22 of 36 lessons',
  coursePct: '61%',
  /* viewBox 0 0 120 120 at 72px, r=50, stroke 12, rotate(-90 60 60). */
  courseRingDash: '180.0 314.2',
  courseRingAria: 'Qualifying Education 61% complete, 22 of 36 lessons',

  /* Shown when `isLocked`; his `status` field is empty on those rows. */
  lockedWord: 'Locked',
  examEyebrow: 'Exam',
  examCta: 'Take exam',
  examReviewCta: 'Review exam',

  finalEyebrow: 'Final exam',
  finalTitle: 'Certification Exam',
  finalExamTitle: 'Certification Exam: Florida Life and Health Pre-licensing',
  finalNote: 'Opens after all 19 chapters',
  finalStatus: 'Locked',
} as const

/**
 * THE OVERVIEW — his first rail row, and the page his own export opens on.
 * Ported 2026-11-09.
 *
 * ⚠ IT IS TWO TABLES, NOT ONE. The tab strip under the two stat cards swaps
 * the whole lower half: "Readiness" draws five exam topics plus the Exam
 * Simulator, scored out of 85; "Course progress" draws five course topics
 * scored in lessons. The TITLE, the SUMMARY and the COLUMN HEADS all change
 * with it — this is not one table with a filter. Both states are extracted,
 * each with every row open.
 *
 * ⚠ THE LAST READINESS ROW IS NOT A TOPIC. The Exam Simulator row carries
 * `hasPie: false`, `noBand: true` and `noExpand: true`: no share-of-exam
 * wedge, no Readiness band, no chevron, and "Uses all topics" where a band
 * would be. Rendering it like the five above it would claim a Readiness score
 * for something his design deliberately leaves unscored.
 *
 * ⚠ THE THREE-ARC RING'S OUTER ARC IS EMPTY ON PURPOSE — `0 483.8`, with a
 * BUTT cap rather than the round caps the other two use, because a round cap
 * on a zero-length arc draws a dot. Nought of three simulator exams taken is
 * the state his page is in, and the ring says so by showing nothing.
 */
export const JEFF_MVP_OVERVIEW = {
  tabs: [
    {
      label: 'Readiness',
      sub: '62% · Developing · by topic and sub-topic'
    },
    {
      label: 'Course progress',
      sub: '61% · 22 of 36 lessons'
    }
  ],
  readiness: {
    tableTitle: 'Your prep by exam topic',
    summary: '0 of 5 topics Ready · Annuities is the biggest lift',
    tableNote: 'Ready at 85% · from Exam Prep practice only · bar = share of the exam',
    rows: [
      {
        name: 'Life Insurance',
        weight: '22% of exam',
        hasPie: true,
        barW: '22%',
        practice: '30 of 60 answered',
        hasCov: true,
        covPct: '50%',
        hasBand: true,
        band: 'Proficient',
        bandTone: 'proficient-ink',
        bandBg: 'proficient-wash',
        bandBorder: 'steel-edge',
        num: '74',
        bandNote: '',
        last: '5 days ago',
        action: 'Practice',
        isPrimary: false,
        canExpand: true,
        expanded: false,
        expandLabel: 'Expand Life Insurance sub-topics',
        collapseLabel: 'Collapse Life Insurance sub-topics',
        subs: [
          {
            name: 'Policy types: term, whole, universal',
            num: '67',
            weight: 600,
            note: 'Weakest',
            noteTone: 'rubi',
            segs: [
              {
                flex: 40,
                height: 5,
                tone: 'edge'
              },
              {
                flex: 25,
                height: 5,
                tone: 'amber'
              },
              {
                flex: 20,
                height: 5,
                tone: 'steel-light'
              },
              {
                flex: 15,
                height: 5,
                tone: 'hairline'
              }
            ],
            barTone: 'steel-light',
            band: 'Proficient',
            bandTone: 'proficient-ink',
            bandBg: 'proficient-wash',
            bandBorder: 'steel-edge',
            rubi: true,
            rubiCta: 'Practice',
            mins: '12 min'
          },
          {
            name: 'Underwriting & insurable interest',
            num: '76',
            weight: 400,
            note: '',
            noteTone: 'muted',
            segs: [
              {
                flex: 40,
                height: 5,
                tone: 'edge'
              },
              {
                flex: 25,
                height: 5,
                tone: 'amber'
              },
              {
                flex: 20,
                height: 5,
                tone: 'steel-light'
              },
              {
                flex: 15,
                height: 5,
                tone: 'hairline'
              }
            ],
            barTone: 'steel-light',
            band: 'Proficient',
            bandTone: 'proficient-ink',
            bandBg: 'proficient-wash',
            bandBorder: 'steel-edge',
            rubi: false,
            rubiCta: '',
            mins: ''
          },
          {
            name: 'Owners & beneficiaries',
            num: '79',
            weight: 400,
            note: '',
            noteTone: 'muted',
            segs: [
              {
                flex: 40,
                height: 5,
                tone: 'edge'
              },
              {
                flex: 25,
                height: 5,
                tone: 'amber'
              },
              {
                flex: 20,
                height: 5,
                tone: 'steel-light'
              },
              {
                flex: 15,
                height: 5,
                tone: 'hairline'
              }
            ],
            barTone: 'steel-light',
            band: 'Proficient',
            bandTone: 'proficient-ink',
            bandBg: 'proficient-wash',
            bandBorder: 'steel-edge',
            rubi: false,
            rubiCta: '',
            mins: ''
          }
        ]
      },
      {
        name: 'Policy Provisions',
        weight: '22% of exam',
        hasPie: true,
        barW: '22%',
        practice: '26 of 60 answered',
        hasCov: true,
        covPct: '43%',
        hasBand: true,
        band: 'Developing',
        bandTone: 'developing-ink',
        bandBg: 'developing-wash',
        bandBorder: 'developing-edge',
        num: '58',
        bandNote: '',
        last: '2 days ago',
        action: 'Practice',
        isPrimary: false,
        canExpand: true,
        expanded: false,
        expandLabel: 'Expand Policy Provisions sub-topics',
        collapseLabel: 'Collapse Policy Provisions sub-topics',
        subs: [
          {
            name: 'Riders',
            num: '47',
            weight: 600,
            note: 'Weakest',
            noteTone: 'rubi',
            segs: [
              {
                flex: 40,
                height: 5,
                tone: 'edge'
              },
              {
                flex: 25,
                height: 5,
                tone: 'amber'
              },
              {
                flex: 20,
                height: 5,
                tone: 'hairline'
              },
              {
                flex: 15,
                height: 5,
                tone: 'hairline'
              }
            ],
            barTone: 'amber',
            band: 'Developing',
            bandTone: 'developing-ink',
            bandBg: 'developing-wash',
            bandBorder: 'developing-edge',
            rubi: true,
            rubiCta: 'Practice',
            mins: '12 min'
          },
          {
            name: 'Nonforfeiture options',
            num: '55',
            weight: 400,
            note: '',
            noteTone: 'muted',
            segs: [
              {
                flex: 40,
                height: 5,
                tone: 'edge'
              },
              {
                flex: 25,
                height: 5,
                tone: 'amber'
              },
              {
                flex: 20,
                height: 5,
                tone: 'hairline'
              },
              {
                flex: 15,
                height: 5,
                tone: 'hairline'
              }
            ],
            barTone: 'amber',
            band: 'Developing',
            bandTone: 'developing-ink',
            bandBg: 'developing-wash',
            bandBorder: 'developing-edge',
            rubi: false,
            rubiCta: '',
            mins: ''
          },
          {
            name: 'Settlement options',
            num: '63',
            weight: 400,
            note: '',
            noteTone: 'muted',
            segs: [
              {
                flex: 40,
                height: 5,
                tone: 'edge'
              },
              {
                flex: 25,
                height: 5,
                tone: 'amber'
              },
              {
                flex: 20,
                height: 5,
                tone: 'hairline'
              },
              {
                flex: 15,
                height: 5,
                tone: 'hairline'
              }
            ],
            barTone: 'amber',
            band: 'Developing',
            bandTone: 'developing-ink',
            bandBg: 'developing-wash',
            bandBorder: 'developing-edge',
            rubi: false,
            rubiCta: '',
            mins: ''
          },
          {
            name: 'Grace period & reinstatement',
            num: '67',
            weight: 400,
            note: '',
            noteTone: 'muted',
            segs: [
              {
                flex: 40,
                height: 5,
                tone: 'edge'
              },
              {
                flex: 25,
                height: 5,
                tone: 'amber'
              },
              {
                flex: 20,
                height: 5,
                tone: 'steel-light'
              },
              {
                flex: 15,
                height: 5,
                tone: 'hairline'
              }
            ],
            barTone: 'steel-light',
            band: 'Proficient',
            bandTone: 'proficient-ink',
            bandBg: 'proficient-wash',
            bandBorder: 'steel-edge',
            rubi: false,
            rubiCta: '',
            mins: ''
          }
        ]
      },
      {
        name: 'Annuities',
        weight: '20% of exam',
        hasPie: true,
        barW: '20%',
        practice: '22 of 55 answered',
        hasCov: true,
        covPct: '40%',
        hasBand: true,
        band: 'Developing',
        bandTone: 'developing-ink',
        bandBg: 'developing-wash',
        bandBorder: 'developing-edge',
        num: '52',
        bandNote: '',
        last: 'Today',
        action: 'Practice',
        isPrimary: true,
        canExpand: true,
        expanded: true,
        expandLabel: 'Expand Annuities sub-topics',
        collapseLabel: 'Collapse Annuities sub-topics',
        subs: [
          {
            name: 'Variable annuities',
            num: '41',
            weight: 600,
            note: 'Weakest',
            noteTone: 'rubi',
            segs: [
              {
                flex: 40,
                height: 5,
                tone: 'edge'
              },
              {
                flex: 25,
                height: 5,
                tone: 'amber'
              },
              {
                flex: 20,
                height: 5,
                tone: 'hairline'
              },
              {
                flex: 15,
                height: 5,
                tone: 'hairline'
              }
            ],
            barTone: 'amber',
            band: 'Developing',
            bandTone: 'developing-ink',
            bandBg: 'developing-wash',
            bandBorder: 'developing-edge',
            rubi: true,
            rubiCta: 'Practice',
            mins: '12 min'
          },
          {
            name: 'Annuity taxation',
            num: '55',
            weight: 400,
            note: '',
            noteTone: 'muted',
            segs: [
              {
                flex: 40,
                height: 5,
                tone: 'edge'
              },
              {
                flex: 25,
                height: 5,
                tone: 'amber'
              },
              {
                flex: 20,
                height: 5,
                tone: 'hairline'
              },
              {
                flex: 15,
                height: 5,
                tone: 'hairline'
              }
            ],
            barTone: 'amber',
            band: 'Developing',
            bandTone: 'developing-ink',
            bandBg: 'developing-wash',
            bandBorder: 'developing-edge',
            rubi: false,
            rubiCta: '',
            mins: ''
          },
          {
            name: 'Fixed and indexed annuities',
            num: '58',
            weight: 400,
            note: '',
            noteTone: 'muted',
            segs: [
              {
                flex: 40,
                height: 5,
                tone: 'edge'
              },
              {
                flex: 25,
                height: 5,
                tone: 'amber'
              },
              {
                flex: 20,
                height: 5,
                tone: 'hairline'
              },
              {
                flex: 15,
                height: 5,
                tone: 'hairline'
              }
            ],
            barTone: 'amber',
            band: 'Developing',
            bandTone: 'developing-ink',
            bandBg: 'developing-wash',
            bandBorder: 'developing-edge',
            rubi: false,
            rubiCta: '',
            mins: ''
          }
        ]
      },
      {
        name: 'Health Insurance',
        weight: '18% of exam',
        hasPie: true,
        barW: '18%',
        practice: '24 of 45 answered',
        hasCov: true,
        covPct: '53%',
        hasBand: true,
        band: 'Proficient',
        bandTone: 'proficient-ink',
        bandBg: 'proficient-wash',
        bandBorder: 'steel-edge',
        num: '66',
        bandNote: '',
        last: '4 days ago',
        action: 'Practice',
        isPrimary: false,
        canExpand: true,
        expanded: false,
        expandLabel: 'Expand Health Insurance sub-topics',
        collapseLabel: 'Collapse Health Insurance sub-topics',
        subs: [
          {
            name: 'Disability income',
            num: '59',
            weight: 600,
            note: 'Weakest',
            noteTone: 'rubi',
            segs: [
              {
                flex: 40,
                height: 5,
                tone: 'edge'
              },
              {
                flex: 25,
                height: 5,
                tone: 'amber'
              },
              {
                flex: 20,
                height: 5,
                tone: 'hairline'
              },
              {
                flex: 15,
                height: 5,
                tone: 'hairline'
              }
            ],
            barTone: 'amber',
            band: 'Developing',
            bandTone: 'developing-ink',
            bandBg: 'developing-wash',
            bandBorder: 'developing-edge',
            rubi: true,
            rubiCta: 'Practice',
            mins: '12 min'
          },
          {
            name: 'Medical expense plans',
            num: '68',
            weight: 400,
            note: '',
            noteTone: 'muted',
            segs: [
              {
                flex: 40,
                height: 5,
                tone: 'edge'
              },
              {
                flex: 25,
                height: 5,
                tone: 'amber'
              },
              {
                flex: 20,
                height: 5,
                tone: 'steel-light'
              },
              {
                flex: 15,
                height: 5,
                tone: 'hairline'
              }
            ],
            barTone: 'steel-light',
            band: 'Proficient',
            bandTone: 'proficient-ink',
            bandBg: 'proficient-wash',
            bandBorder: 'steel-edge',
            rubi: false,
            rubiCta: '',
            mins: ''
          },
          {
            name: 'Medicare & supplements',
            num: '71',
            weight: 400,
            note: '',
            noteTone: 'muted',
            segs: [
              {
                flex: 40,
                height: 5,
                tone: 'edge'
              },
              {
                flex: 25,
                height: 5,
                tone: 'amber'
              },
              {
                flex: 20,
                height: 5,
                tone: 'steel-light'
              },
              {
                flex: 15,
                height: 5,
                tone: 'hairline'
              }
            ],
            barTone: 'steel-light',
            band: 'Proficient',
            bandTone: 'proficient-ink',
            bandBg: 'proficient-wash',
            bandBorder: 'steel-edge',
            rubi: false,
            rubiCta: '',
            mins: ''
          }
        ]
      },
      {
        name: 'Insurance Regulation',
        weight: '18% of exam',
        hasPie: true,
        barW: '18%',
        practice: '20 of 45 answered',
        hasCov: true,
        covPct: '44%',
        hasBand: true,
        band: 'Developing',
        bandTone: 'developing-ink',
        bandBg: 'developing-wash',
        bandBorder: 'developing-edge',
        num: '61',
        bandNote: '',
        last: '6 days ago',
        action: 'Practice',
        isPrimary: false,
        canExpand: true,
        expanded: false,
        expandLabel: 'Expand Insurance Regulation sub-topics',
        collapseLabel: 'Collapse Insurance Regulation sub-topics',
        subs: [
          {
            name: 'Florida licensing rules',
            num: '54',
            weight: 600,
            note: 'Weakest',
            noteTone: 'rubi',
            segs: [
              {
                flex: 40,
                height: 5,
                tone: 'edge'
              },
              {
                flex: 25,
                height: 5,
                tone: 'amber'
              },
              {
                flex: 20,
                height: 5,
                tone: 'hairline'
              },
              {
                flex: 15,
                height: 5,
                tone: 'hairline'
              }
            ],
            barTone: 'amber',
            band: 'Developing',
            bandTone: 'developing-ink',
            bandBg: 'developing-wash',
            bandBorder: 'developing-edge',
            rubi: true,
            rubiCta: 'Practice',
            mins: '12 min'
          },
          {
            name: 'Unfair trade practices',
            num: '63',
            weight: 400,
            note: '',
            noteTone: 'muted',
            segs: [
              {
                flex: 40,
                height: 5,
                tone: 'edge'
              },
              {
                flex: 25,
                height: 5,
                tone: 'amber'
              },
              {
                flex: 20,
                height: 5,
                tone: 'hairline'
              },
              {
                flex: 15,
                height: 5,
                tone: 'hairline'
              }
            ],
            barTone: 'amber',
            band: 'Developing',
            bandTone: 'developing-ink',
            bandBg: 'developing-wash',
            bandBorder: 'developing-edge',
            rubi: false,
            rubiCta: '',
            mins: ''
          },
          {
            name: 'Replacement & agent duties',
            num: '66',
            weight: 400,
            note: '',
            noteTone: 'muted',
            segs: [
              {
                flex: 40,
                height: 5,
                tone: 'edge'
              },
              {
                flex: 25,
                height: 5,
                tone: 'amber'
              },
              {
                flex: 20,
                height: 5,
                tone: 'steel-light'
              },
              {
                flex: 15,
                height: 5,
                tone: 'hairline'
              }
            ],
            barTone: 'steel-light',
            band: 'Proficient',
            bandTone: 'proficient-ink',
            bandBg: 'proficient-wash',
            bandBorder: 'steel-edge',
            rubi: false,
            rubiCta: '',
            mins: ''
          }
        ]
      },
      {
        name: 'Exam Simulator',
        weight: 'All topics · 3 full exams',
        hasPie: false,
        barW: '0%',
        practice: '0 of 3 taken',
        hasCov: false,
        covPct: '0%',
        hasBand: false,
        band: '',
        bandTone: '',
        bandBg: '',
        bandBorder: '',
        num: '',
        bandNote: 'Uses all topics',
        last: '—',
        action: 'Take Exam',
        isPrimary: false,
        canExpand: false,
        expanded: false,
        expandLabel: 'Expand Exam Simulator sub-topics',
        collapseLabel: 'Collapse Exam Simulator sub-topics',
        subs: []
      }
    ]
  },
  progress: {
    tableTitle: 'Course progress by topic',
    summary: '22 of 36 lessons · 1 of 5 topics complete',
    tableNote: 'From your course lessons · open in any order',
    rows: [
      {
        name: 'Life Insurance',
        weight: '8 lessons',
        lessons: '8 of 8 · complete',
        tone: 'green',
        pct: '100%',
        barTone: 'green',
        aria: '100% of lessons complete',
        action: 'Review',
        isPrimary: false,
        isText: true,
        canExpand: true,
        expandLabel: 'Expand Life Insurance lessons',
        collapseLabel: 'Collapse Life Insurance lessons',
        lessonList: [
          {
            label: 'Lesson 1: What life insurance does',
            status: 'Complete',
            tone: 'green'
          },
          {
            label: 'Lesson 2',
            status: 'Complete',
            tone: 'green'
          },
          {
            label: 'Lesson 3',
            status: 'Complete',
            tone: 'green'
          },
          {
            label: 'Lesson 4',
            status: 'Complete',
            tone: 'green'
          },
          {
            label: 'Lesson 5',
            status: 'Complete',
            tone: 'green'
          },
          {
            label: 'Lesson 6',
            status: 'Complete',
            tone: 'green'
          },
          {
            label: 'Lesson 7',
            status: 'Complete',
            tone: 'green'
          },
          {
            label: 'Lesson 8: Owners, insureds and beneficiaries',
            status: 'Complete',
            tone: 'green'
          }
        ]
      },
      {
        name: 'Policy Provisions',
        weight: '8 lessons',
        lessons: '6 of 8 · in progress',
        tone: 'steel-deep',
        pct: '75%',
        barTone: 'steel',
        aria: '75% of lessons complete',
        action: 'Resume lesson',
        isPrimary: true,
        isText: false,
        canExpand: true,
        expandLabel: 'Expand Policy Provisions lessons',
        collapseLabel: 'Collapse Policy Provisions lessons',
        lessonList: [
          {
            label: 'Lesson 9',
            status: 'Complete',
            tone: 'green'
          },
          {
            label: 'Lesson 10',
            status: 'Complete',
            tone: 'green'
          },
          {
            label: 'Lesson 11',
            status: 'Complete',
            tone: 'green'
          },
          {
            label: 'Lesson 12',
            status: 'Complete',
            tone: 'green'
          },
          {
            label: 'Lesson 13',
            status: 'Complete',
            tone: 'green'
          },
          {
            label: 'Lesson 14',
            status: 'Complete',
            tone: 'green'
          },
          {
            label: 'Lesson 15',
            status: 'In progress',
            tone: 'steel-deep'
          },
          {
            label: 'Lesson 16',
            status: 'Not started',
            tone: 'muted'
          }
        ]
      },
      {
        name: 'Annuities',
        weight: '7 lessons',
        lessons: '4 of 7 · in progress',
        tone: 'steel-deep',
        pct: '57%',
        barTone: 'steel',
        aria: '57% of lessons complete',
        action: 'Resume lesson',
        isPrimary: false,
        isText: false,
        canExpand: true,
        expandLabel: 'Expand Annuities lessons',
        collapseLabel: 'Collapse Annuities lessons',
        lessonList: [
          {
            label: 'Lesson 17',
            status: 'Complete',
            tone: 'green'
          },
          {
            label: 'Lesson 18',
            status: 'Complete',
            tone: 'green'
          },
          {
            label: 'Lesson 19: How annuities are funded',
            status: 'Complete',
            tone: 'green'
          },
          {
            label: 'Lesson 20',
            status: 'Complete',
            tone: 'green'
          },
          {
            label: 'Lesson 21',
            status: 'In progress',
            tone: 'steel-deep'
          },
          {
            label: 'Lesson 22',
            status: 'Not started',
            tone: 'muted'
          },
          {
            label: 'Lesson 23',
            status: 'Not started',
            tone: 'muted'
          }
        ]
      },
      {
        name: 'Health Insurance',
        weight: '7 lessons',
        lessons: '3 of 7 · in progress',
        tone: 'steel-deep',
        pct: '43%',
        barTone: 'steel',
        aria: '43% of lessons complete',
        action: 'Resume lesson',
        isPrimary: false,
        isText: false,
        canExpand: true,
        expandLabel: 'Expand Health Insurance lessons',
        collapseLabel: 'Collapse Health Insurance lessons',
        lessonList: [
          {
            label: 'Lesson 24',
            status: 'Complete',
            tone: 'green'
          },
          {
            label: 'Lesson 25',
            status: 'Complete',
            tone: 'green'
          },
          {
            label: 'Lesson 26',
            status: 'Complete',
            tone: 'green'
          },
          {
            label: 'Lesson 27',
            status: 'In progress',
            tone: 'steel-deep'
          },
          {
            label: 'Lesson 28',
            status: 'Not started',
            tone: 'muted'
          },
          {
            label: 'Lesson 29',
            status: 'Not started',
            tone: 'muted'
          },
          {
            label: 'Lesson 30: Disability income insurance',
            status: 'Not started',
            tone: 'muted'
          }
        ]
      },
      {
        name: 'Insurance Regulation',
        weight: '6 lessons',
        lessons: '1 of 6 · in progress',
        tone: 'steel-deep',
        pct: '17%',
        barTone: 'steel',
        aria: '17% of lessons complete',
        action: 'Resume lesson',
        isPrimary: false,
        isText: false,
        canExpand: true,
        expandLabel: 'Expand Insurance Regulation lessons',
        collapseLabel: 'Collapse Insurance Regulation lessons',
        lessonList: [
          {
            label: 'Lesson 31',
            status: 'Complete',
            tone: 'green'
          },
          {
            label: 'Lesson 32',
            status: 'In progress',
            tone: 'steel-deep'
          },
          {
            label: 'Lesson 33',
            status: 'Not started',
            tone: 'muted'
          },
          {
            label: 'Lesson 34',
            status: 'Not started',
            tone: 'muted'
          },
          {
            label: 'Lesson 35',
            status: 'Not started',
            tone: 'muted'
          },
          {
            label: 'Lesson 36',
            status: 'Not started',
            tone: 'muted'
          }
        ]
      }
    ]
  }
} as const

/**
 * HIS OVERVIEW PROSE AND FIGURES. Template text rather than data, transcribed
 * from the page as rendered at 1440px.
 *
 * ⚠ THE COURSE RING HERE IS RIGHT WHERE LEARN'S IS WRONG. Both draw 61% on a
 * circle of r=50 (circumference 314.2); this one's dasharray is 192.0, which
 * IS 61%. The Learn page's is 180.0, which is 57.3%. Same designer, same
 * figure, two numbers — so Learn's is a slip rather than a decision, and both
 * are carried verbatim with this note as the record. Worth raising with Jeff;
 * it is a one-character fix on his side.
 */
export const JEFF_MVP_OVERVIEW_COPY = {
  title: 'Your learning journey',
  course: 'Florida Life and Health Pre-licensing',
  access: 'Access ends Jan 20, 2027',
  phasePill: 'Learn + prepare',
  accessPill: 'Open access · move freely',

  nextEyebrow: 'Learn + prepare · Readiness 62%',
  nextTitle: 'Your next step: Learn Annuities',
  nextBody:
    'Rubi picks what moves you forward next. Annuities is your weakest topic and you still have 3 lessons left there — learn them first, then practice.',
  nextSetEyebrow: 'Recommended next',
  nextSetTitle: 'Lesson: Annuities',
  nextSetMeta: '3 lessons left · about 25 min · biggest lift',
  nextCta: 'Start lesson',
  nextAlt: 'Practice instead',

  rubiEyebrow: 'Rubi recommends',
  rubiTitle: 'Annuities',
  rubiBody:
    '20% of your exam and your lowest topic at 52%. Variable annuities is the weakest sub-topic, and you still have 3 Annuities lessons left — start with the content, then practice to move your Readiness.',
  rubiCta: 'Start Annuities lesson · 25 min',

  continueEyebrow: 'Continue preparing',
  continueCards: [
    { page: 'practice', title: 'Practice', body: 'Exam-style questions by topic. This is what builds Readiness.' },
    { page: 'flashcards', title: 'Flashcards', body: 'Rubi builds sets from weak topics and cards you mark.' },
    { page: 'exam-simulator', title: 'Exam Simulator', body: '150 questions · 165 min · full exam conditions.' },
  ],
  continueCta: 'Open',

  readyEyebrow: 'Readiness to pass',
  readySource: 'from Exam Prep practice only',
  readyBand: 'Developing',
  /* viewBox 168 drawn at 200px, three arcs at r=77/64/51, stroke 9. The outer
     one is the simulator and is empty — see the fixture note on its cap. */
  ringAria: 'Exam Simulator 0%, practice coverage 46%, Readiness 62',
  ringArcs: [
    { r: 77, tone: 'violet', dash: '0 483.8', cap: 'butt' },
    { r: 64, tone: 'steel', dash: '185.1 402.1', cap: 'round' },
    { r: 51, tone: 'amber', dash: '198.7 320.4', cap: 'round' },
  ],
  /* Four measured rows, then the one that is not a measure: "Book your exam"
     has a HOLLOW dot and stacks its two lines, because it is the thing none of
     the arcs is tracking. */
  readyLegend: [
    { dotTone: 'amber', label: 'Readiness', value: '62% of 85% · 23 to Ready' },
    { dotTone: 'steel', label: 'Practice questions', value: '122 of 265 covered' },
    { dotTone: 'steel-light', label: 'Flashcards', value: '8 due' },
    { dotTone: 'violet', label: 'Exam Simulator (3)', value: '0 of 3 · open' },
  ],
  bookLabel: 'Book your exam',
  bookValue: 'Ready (85%) in every topic · in Atlas',
  readyCaption:
    'All five topics · blueprint-weighted · rings, outside in: simulator · practice · Readiness',

  progressEyebrow: 'Your course progress',
  progressSource: 'from your course lessons',
  progressPct: '61%',
  progressWord: 'Lessons',
  progressRingDash: '192.0 314.2',
  progressRingAria: 'QE course 61% complete',
  progressCourse: 'QE course',
  progressLessons: '22 of 36 lessons',
  progressNote: 'Lessons open in any order.',

  /* The Readiness table's five column heads; the progress table has three. */
  readinessCols: ['Total percentage of exam', 'Practice', 'Readiness', 'Last practiced', 'Next'],
  progressCols: ['Topic', 'Lessons · course', 'Next'],
  subEyebrow: 'Readiness by sub-topic',
  /* On every sub-row — his `rubiCta` carries it only on the weakest one. */
  subCta: 'Practice',
  startHere: 'Start here',
  aboutMins: 'About',

  footnote:
    'Two separate signals: lessons build Progress, Exam Prep practice builds Readiness. Course activity doesn’t change your Readiness.',
} as const
