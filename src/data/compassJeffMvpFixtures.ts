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
  { page: 'study-planner', label: 'Study planner', ported: true },
  { page: 'prep-review', label: 'Prep Review', ported: true },
  { page: 'practice', label: 'Practice', ported: true },
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

/**
 * THE PRACTICE PAGE — the heart of his EXAM PREP group, ported 2026-11-09.
 *
 * Two recommendations over a filterable catalogue of twenty-one question
 * sets. It is the page the other two ported pages point at: every Practice
 * button on Readiness and the Overview lands here.
 *
 * ⚠ THREE TABS ARE THREE GROUPINGS, NOT A FILTER. Topics gives five groups of
 * sets; Subtopics gives one flat group of the same twenty-one with a topic
 * eyebrow on each row; Bookmarked gives the two sets that have bookmarks,
 * with their counts. His `groups` is rebuilt per tab, so all three are stored.
 *
 * ⚠ THE FILTERS ARE DERIVED, NOT STORED, and that is the one place this
 * fixture departs from "store what he rendered". His rule is four lines and
 * explicit (`pass()` in his `baseVals`), and storing the cross-product of
 * three confidence levels and four Readiness bands would be fifty-odd
 * snapshots of the same twenty-one sets. `practiceMatches` ports the rule;
 * the suite checks the derived result against his rendered output for the
 * filtered and empty states.
 *
 * ⚠ HIS FILTER ONLY EVER MATCHES STARTED SETS — `x.started && …` on both
 * halves. Filtering by Low confidence therefore hides every not-started set
 * rather than showing them as unmatched, and the empty state says why in his
 * own words: "Confidence and Readiness appear once you start a set."
 *
 * ⚠ BAND AND CONFIDENCE ARE STORED ON NOT-STARTED SETS TOO. His table draws
 * "—" for both there; the values exist so the filter has something to test.
 * Reading them as display data would put a Readiness band on a set nobody
 * has opened.
 */
/**
 * ⚠ THE PRACTICE FIXTURE IS TYPED RATHER THAN `as const`, unlike the three
 * above it. Its three tabs are three arrays of the SAME shape, and `as const`
 * gives each a distinct tuple-of-literals type — so `PR[tab]`, where `tab` is
 * a union, is a union of three incompatible array types and nothing can be
 * written that renders all three. Declaring the shape once is the fix, and it
 * costs nothing the other fixtures need: those are read a field at a time.
 */
export type JeffMvpPracticeSet = {
  title: string
  topic: string
  hasEyebrow: boolean
  bmk: number
  hasBmk: boolean
  bmkText: string
  started: boolean
  band: string
  conf: string
  confBg: string
  confBorder: string
  confInk: string
  status: string
  barW: string
  barMin: string
  aria: string
}
export type JeffMvpPracticeGroup = {
  id: string
  title: string
  meta: string
  hasHeader: boolean
  sets: JeffMvpPracticeSet[]
}
export type JeffMvpPracticePill = { label: string; bg: string; border: string; ink: string }
export type JeffMvpPracticeRec = {
  kind: string
  kindTone: string
  topic: string
  title: string
  why: string
  meta: string
  cta: string
  ready: number
  cov: number
  covLabel: string
  covDetail: string
  covNote: string
  timeLabel: string
  hasDue: boolean
  due: string
  rowMeta: string
  band: string
  bandInk: string
  bandBg: string
  bandBorder: string
  readyTone: string
  readyDash: string
  covDash: string
  ringAria: string
}
export type JeffMvpPractice = {
  weakest: JeffMvpPracticeRec
  spaced: JeffMvpPracticeRec
  tabs: { label: string; sub: string }[]
  views: { label: string }[]
  confPills: JeffMvpPracticePill[]
  readyPills: JeffMvpPracticePill[]
  topics: JeffMvpPracticeGroup[]
  subtopics: JeffMvpPracticeGroup[]
  bookmarked: JeffMvpPracticeGroup[]
}

export const JEFF_MVP_PRACTICE: JeffMvpPractice = {
  weakest: {
    kind: 'Weakest set',
    kindTone: 'rubi',
    topic: 'P&C insurance terms and concepts',
    title: 'Property and Casualty Insurance Principles and Concepts',
    why: 'Your lowest set. You’ve seen only 12 of its 68 questions so far, so a focused round here is the biggest lift to your Readiness.',
    meta: '68 questions · about 20 min',
    cta: 'Start set',
    ready: 9,
    cov: 18,
    covLabel: 'Coverage',
    covDetail: '12 of 68 questions answered',
    covNote: '· 12 of 68 questions',
    timeLabel: '20 min',
    hasDue: false,
    due: '',
    rowMeta: '',
    band: 'Beginner',
    bandInk: 'beginner-ink',
    bandBg: 'beginner-wash',
    bandBorder: 'edge',
    readyTone: 'beginner-bar',
    readyDash: '29.4 999',
    covDash: '45.2 999',
    ringAria: 'Readiness 9%, Beginner. Coverage 18%: 12 of 68 questions answered.'
  },
  spaced: {
    kind: 'Spaced review',
    kindTone: 'steel-deep',
    topic: 'P&C insurance terms and concepts',
    title: 'Overview of the Insurance Industry',
    why: 'Due for review. You last practiced this 6 days ago, so a short round now helps it stick.',
    meta: '30 questions · due today',
    cta: 'Start set',
    ready: 34,
    cov: 100,
    covLabel: 'Coverage',
    covDetail: '30 of 30 questions answered',
    covNote: '',
    timeLabel: '',
    hasDue: true,
    due: 'Due today',
    rowMeta: 'last practiced 6 days ago',
    band: 'Beginner',
    bandInk: 'beginner-ink',
    bandBg: 'beginner-wash',
    bandBorder: 'edge',
    readyTone: 'beginner-bar',
    readyDash: '83.3 999',
    covDash: '182.2 999',
    ringAria: 'Readiness 34%, Beginner. Coverage 100%: 30 of 30 questions answered.'
  },
  tabs: [
    {
      label: 'Topics',
      sub: '5 topics · 21 sets'
    },
    {
      label: 'Subtopics',
      sub: '21 sets'
    },
    {
      label: 'Bookmarked',
      sub: '3 questions · 2 sets'
    }
  ],
  views: [
    {
      label: 'Table'
    },
    {
      label: 'Cards'
    }
  ],
  confPills: [
    {
      label: 'Low',
      bg: 'white',
      border: 'conf-low-edge',
      ink: 'conf-low-ink'
    },
    {
      label: 'Medium',
      bg: 'white',
      border: 'conf-med-edge',
      ink: 'conf-med-ink'
    },
    {
      label: 'High',
      bg: 'white',
      border: 'conf-high-edge',
      ink: 'conf-high-ink'
    }
  ],
  readyPills: [
    {
      label: 'Beginner',
      bg: 'beginner-wash',
      border: 'edge',
      ink: 'beginner-ink'
    },
    {
      label: 'Developing',
      bg: 'developing-wash',
      border: 'developing-edge',
      ink: 'developing-ink'
    },
    {
      label: 'Proficient',
      bg: 'proficient-wash',
      border: 'steel-edge',
      ink: 'proficient-ink'
    },
    {
      label: 'Ready',
      bg: 'ready-wash',
      border: 'ready-edge',
      ink: 'ready-ink'
    }
  ],
  topics: [
    {
      id: 'grp-0',
      title: 'Types of casualty policies',
      meta: '1 of 206 questions correct · 0%',
      hasHeader: true,
      sets: [
        {
          title: 'Prep Review: Types of Casualty Insurance Policies - Personal Lines - Pearson Vue',
          topic: 'Types of casualty policies',
          hasEyebrow: false,
          bmk: 2,
          hasBmk: false,
          bmkText: '2 bookmarked',
          started: true,
          band: 'Beginner',
          conf: 'Low',
          confBg: 'conf-low-bg',
          confBorder: 'conf-low-edge',
          confInk: 'conf-low-ink',
          status: '1 of 45 correct · 2%',
          barW: '2%',
          barMin: '6px',
          aria: '1 of 45 correct'
        },
        {
          title: 'Personal Automobile Policies (PAP)',
          topic: 'Types of casualty policies',
          hasEyebrow: false,
          bmk: 0,
          hasBmk: false,
          bmkText: '0 bookmarked',
          started: false,
          band: 'Beginner',
          conf: 'Low',
          confBg: 'conf-low-bg',
          confBorder: 'conf-low-edge',
          confInk: 'conf-low-ink',
          status: 'Not started',
          barW: '0%',
          barMin: '0px',
          aria: ''
        },
        {
          title: 'Prep Review Exam: Types of Casualty Insurance Policies - Personal Lines - Pearson Vue',
          topic: 'Types of casualty policies',
          hasEyebrow: false,
          bmk: 0,
          hasBmk: false,
          bmkText: '0 bookmarked',
          started: false,
          band: 'Beginner',
          conf: 'Low',
          confBg: 'conf-low-bg',
          confBorder: 'conf-low-edge',
          confInk: 'conf-low-ink',
          status: 'Not started',
          barW: '0%',
          barMin: '0px',
          aria: ''
        },
        {
          title: 'Types of casualty policies',
          topic: 'Types of casualty policies',
          hasEyebrow: false,
          bmk: 0,
          hasBmk: false,
          bmkText: '0 bookmarked',
          started: false,
          band: 'Beginner',
          conf: 'Low',
          confBg: 'conf-low-bg',
          confBorder: 'conf-low-edge',
          confInk: 'conf-low-ink',
          status: 'Not started',
          barW: '0%',
          barMin: '0px',
          aria: ''
        },
        {
          title: 'Umbrella and excess liability',
          topic: 'Types of casualty policies',
          hasEyebrow: false,
          bmk: 0,
          hasBmk: false,
          bmkText: '0 bookmarked',
          started: false,
          band: 'Beginner',
          conf: 'Low',
          confBg: 'conf-low-bg',
          confBorder: 'conf-low-edge',
          confInk: 'conf-low-ink',
          status: 'Not started',
          barW: '0%',
          barMin: '0px',
          aria: ''
        }
      ]
    },
    {
      id: 'grp-1',
      title: 'Property and casualty insurance terms and related concepts',
      meta: '1 of 375 questions correct · 0%',
      hasHeader: true,
      sets: [
        {
          title: 'General Insurance Principles and Concepts',
          topic: 'Property and casualty insurance terms and related concepts',
          hasEyebrow: false,
          bmk: 1,
          hasBmk: false,
          bmkText: '1 bookmarked',
          started: true,
          band: 'Beginner',
          conf: 'Low',
          confBg: 'conf-low-bg',
          confBorder: 'conf-low-edge',
          confInk: 'conf-low-ink',
          status: '1 of 60 correct · 2%',
          barW: '2%',
          barMin: '6px',
          aria: '1 of 60 correct'
        },
        {
          title: 'Overview of the Insurance Industry',
          topic: 'Property and casualty insurance terms and related concepts',
          hasEyebrow: false,
          bmk: 0,
          hasBmk: false,
          bmkText: '0 bookmarked',
          started: true,
          band: 'Beginner',
          conf: 'Medium',
          confBg: 'conf-med-bg',
          confBorder: 'conf-med-edge',
          confInk: 'conf-med-ink',
          status: '0 of 30 correct · 0%',
          barW: '0%',
          barMin: '0px',
          aria: '0 of 30 correct'
        },
        {
          title: 'Property and Casualty Insurance Principles and Concepts',
          topic: 'Property and casualty insurance terms and related concepts',
          hasEyebrow: false,
          bmk: 0,
          hasBmk: false,
          bmkText: '0 bookmarked',
          started: true,
          band: 'Beginner',
          conf: 'Low',
          confBg: 'conf-low-bg',
          confBorder: 'conf-low-edge',
          confInk: 'conf-low-ink',
          status: '0 of 68 correct · 0%',
          barW: '0%',
          barMin: '0px',
          aria: '0 of 68 correct'
        },
        {
          title: 'Property and casualty insurance terms and related concepts',
          topic: 'Property and casualty insurance terms and related concepts',
          hasEyebrow: false,
          bmk: 0,
          hasBmk: false,
          bmkText: '0 bookmarked',
          started: false,
          band: 'Beginner',
          conf: 'Low',
          confBg: 'conf-low-bg',
          confBorder: 'conf-low-edge',
          confInk: 'conf-low-ink',
          status: 'Not started',
          barW: '0%',
          barMin: '0px',
          aria: ''
        },
        {
          title: 'Property and Casualty Insurance Terms and Related Concepts Review',
          topic: 'Property and casualty insurance terms and related concepts',
          hasEyebrow: false,
          bmk: 0,
          hasBmk: false,
          bmkText: '0 bookmarked',
          started: false,
          band: 'Beginner',
          conf: 'Low',
          confBg: 'conf-low-bg',
          confBorder: 'conf-low-edge',
          confInk: 'conf-low-ink',
          status: 'Not started',
          barW: '0%',
          barMin: '0px',
          aria: ''
        }
      ]
    },
    {
      id: 'grp-2',
      title: 'Florida statutes, rules and regulations',
      meta: '0 of 321 questions correct · 0%',
      hasHeader: true,
      sets: [
        {
          title: 'Florida laws common to all lines (agents, licensing, the Department)',
          topic: 'Florida statutes, rules and regulations',
          hasEyebrow: false,
          bmk: 0,
          hasBmk: false,
          bmkText: '0 bookmarked',
          started: false,
          band: 'Beginner',
          conf: 'Low',
          confBg: 'conf-low-bg',
          confBorder: 'conf-low-edge',
          confInk: 'conf-low-ink',
          status: 'Not started',
          barW: '0%',
          barMin: '0px',
          aria: ''
        },
        {
          title: 'Florida laws for personal lines (policies, claims, auto, hurricane)',
          topic: 'Florida statutes, rules and regulations',
          hasEyebrow: false,
          bmk: 0,
          hasBmk: false,
          bmkText: '0 bookmarked',
          started: false,
          band: 'Beginner',
          conf: 'Low',
          confBg: 'conf-low-bg',
          confBorder: 'conf-low-edge',
          confInk: 'conf-low-ink',
          status: 'Not started',
          barW: '0%',
          barMin: '0px',
          aria: ''
        },
        {
          title: 'Florida Personal Lines Laws and Rules.',
          topic: 'Florida statutes, rules and regulations',
          hasEyebrow: false,
          bmk: 0,
          hasBmk: false,
          bmkText: '0 bookmarked',
          started: false,
          band: 'Beginner',
          conf: 'Low',
          confBg: 'conf-low-bg',
          confBorder: 'conf-low-edge',
          confInk: 'conf-low-ink',
          status: 'Not started',
          barW: '0%',
          barMin: '0px',
          aria: ''
        },
        {
          title: 'Prep Review: Florida Personal Lines Laws and Rules',
          topic: 'Florida statutes, rules and regulations',
          hasEyebrow: false,
          bmk: 0,
          hasBmk: false,
          bmkText: '0 bookmarked',
          started: false,
          band: 'Beginner',
          conf: 'Low',
          confBg: 'conf-low-bg',
          confBorder: 'conf-low-edge',
          confInk: 'conf-low-ink',
          status: 'Not started',
          barW: '0%',
          barMin: '0px',
          aria: ''
        }
      ]
    },
    {
      id: 'grp-3',
      title: 'Property and casualty policy provisions and contract law',
      meta: '0 of 190 questions correct · 0%',
      hasHeader: true,
      sets: [
        {
          title: 'Property and Casualty Insurance Policy Provisions',
          topic: 'Property and casualty policy provisions and contract law',
          hasEyebrow: false,
          bmk: 0,
          hasBmk: false,
          bmkText: '0 bookmarked',
          started: false,
          band: 'Beginner',
          conf: 'Low',
          confBg: 'conf-low-bg',
          confBorder: 'conf-low-edge',
          confInk: 'conf-low-ink',
          status: 'Not started',
          barW: '0%',
          barMin: '0px',
          aria: ''
        },
        {
          title: 'Property and Casualty Insurance Policy Provisions and Contract Law Review',
          topic: 'Property and casualty policy provisions and contract law',
          hasEyebrow: false,
          bmk: 0,
          hasBmk: false,
          bmkText: '0 bookmarked',
          started: false,
          band: 'Beginner',
          conf: 'Low',
          confBg: 'conf-low-bg',
          confBorder: 'conf-low-edge',
          confInk: 'conf-low-ink',
          status: 'Not started',
          barW: '0%',
          barMin: '0px',
          aria: ''
        },
        {
          title: 'Property and casualty policy provisions and contract law',
          topic: 'Property and casualty policy provisions and contract law',
          hasEyebrow: false,
          bmk: 0,
          hasBmk: false,
          bmkText: '0 bookmarked',
          started: false,
          band: 'Beginner',
          conf: 'Low',
          confBg: 'conf-low-bg',
          confBorder: 'conf-low-edge',
          confInk: 'conf-low-ink',
          status: 'Not started',
          barW: '0%',
          barMin: '0px',
          aria: ''
        }
      ]
    },
    {
      id: 'grp-4',
      title: 'Types of property policies',
      meta: '0 of 232 questions correct · 0%',
      hasHeader: true,
      sets: [
        {
          title: 'Dwelling Property (DP) Insurance Policies',
          topic: 'Types of property policies',
          hasEyebrow: false,
          bmk: 0,
          hasBmk: false,
          bmkText: '0 bookmarked',
          started: false,
          band: 'Beginner',
          conf: 'Low',
          confBg: 'conf-low-bg',
          confBorder: 'conf-low-edge',
          confInk: 'conf-low-ink',
          status: 'Not started',
          barW: '0%',
          barMin: '0px',
          aria: ''
        },
        {
          title: 'Homeowners (HO) Insurance Policies',
          topic: 'Types of property policies',
          hasEyebrow: false,
          bmk: 0,
          hasBmk: false,
          bmkText: '0 bookmarked',
          started: false,
          band: 'Beginner',
          conf: 'Low',
          confBg: 'conf-low-bg',
          confBorder: 'conf-low-edge',
          confInk: 'conf-low-ink',
          status: 'Not started',
          barW: '0%',
          barMin: '0px',
          aria: ''
        },
        {
          title: 'Other Personal Lines Insurance',
          topic: 'Types of property policies',
          hasEyebrow: false,
          bmk: 0,
          hasBmk: false,
          bmkText: '0 bookmarked',
          started: false,
          band: 'Beginner',
          conf: 'Low',
          confBg: 'conf-low-bg',
          confBorder: 'conf-low-edge',
          confInk: 'conf-low-ink',
          status: 'Not started',
          barW: '0%',
          barMin: '0px',
          aria: ''
        },
        {
          title: 'Types of property policies',
          topic: 'Types of property policies',
          hasEyebrow: false,
          bmk: 0,
          hasBmk: false,
          bmkText: '0 bookmarked',
          started: false,
          band: 'Beginner',
          conf: 'Low',
          confBg: 'conf-low-bg',
          confBorder: 'conf-low-edge',
          confInk: 'conf-low-ink',
          status: 'Not started',
          barW: '0%',
          barMin: '0px',
          aria: ''
        }
      ]
    }
  ],
  subtopics: [
    {
      id: 'grp-flat',
      title: 'All subtopic sets',
      meta: '',
      hasHeader: false,
      sets: [
        {
          title: 'Prep Review: Types of Casualty Insurance Policies - Personal Lines - Pearson Vue',
          topic: 'Types of casualty policies',
          hasEyebrow: true,
          bmk: 2,
          hasBmk: false,
          bmkText: '2 bookmarked',
          started: true,
          band: 'Beginner',
          conf: 'Low',
          confBg: 'conf-low-bg',
          confBorder: 'conf-low-edge',
          confInk: 'conf-low-ink',
          status: '1 of 45 correct · 2%',
          barW: '2%',
          barMin: '6px',
          aria: '1 of 45 correct'
        },
        {
          title: 'Personal Automobile Policies (PAP)',
          topic: 'Types of casualty policies',
          hasEyebrow: true,
          bmk: 0,
          hasBmk: false,
          bmkText: '0 bookmarked',
          started: false,
          band: 'Beginner',
          conf: 'Low',
          confBg: 'conf-low-bg',
          confBorder: 'conf-low-edge',
          confInk: 'conf-low-ink',
          status: 'Not started',
          barW: '0%',
          barMin: '0px',
          aria: ''
        },
        {
          title: 'Prep Review Exam: Types of Casualty Insurance Policies - Personal Lines - Pearson Vue',
          topic: 'Types of casualty policies',
          hasEyebrow: true,
          bmk: 0,
          hasBmk: false,
          bmkText: '0 bookmarked',
          started: false,
          band: 'Beginner',
          conf: 'Low',
          confBg: 'conf-low-bg',
          confBorder: 'conf-low-edge',
          confInk: 'conf-low-ink',
          status: 'Not started',
          barW: '0%',
          barMin: '0px',
          aria: ''
        },
        {
          title: 'Types of casualty policies',
          topic: 'Types of casualty policies',
          hasEyebrow: true,
          bmk: 0,
          hasBmk: false,
          bmkText: '0 bookmarked',
          started: false,
          band: 'Beginner',
          conf: 'Low',
          confBg: 'conf-low-bg',
          confBorder: 'conf-low-edge',
          confInk: 'conf-low-ink',
          status: 'Not started',
          barW: '0%',
          barMin: '0px',
          aria: ''
        },
        {
          title: 'Umbrella and excess liability',
          topic: 'Types of casualty policies',
          hasEyebrow: true,
          bmk: 0,
          hasBmk: false,
          bmkText: '0 bookmarked',
          started: false,
          band: 'Beginner',
          conf: 'Low',
          confBg: 'conf-low-bg',
          confBorder: 'conf-low-edge',
          confInk: 'conf-low-ink',
          status: 'Not started',
          barW: '0%',
          barMin: '0px',
          aria: ''
        },
        {
          title: 'General Insurance Principles and Concepts',
          topic: 'Property and casualty insurance terms and related concepts',
          hasEyebrow: true,
          bmk: 1,
          hasBmk: false,
          bmkText: '1 bookmarked',
          started: true,
          band: 'Beginner',
          conf: 'Low',
          confBg: 'conf-low-bg',
          confBorder: 'conf-low-edge',
          confInk: 'conf-low-ink',
          status: '1 of 60 correct · 2%',
          barW: '2%',
          barMin: '6px',
          aria: '1 of 60 correct'
        },
        {
          title: 'Overview of the Insurance Industry',
          topic: 'Property and casualty insurance terms and related concepts',
          hasEyebrow: true,
          bmk: 0,
          hasBmk: false,
          bmkText: '0 bookmarked',
          started: true,
          band: 'Beginner',
          conf: 'Medium',
          confBg: 'conf-med-bg',
          confBorder: 'conf-med-edge',
          confInk: 'conf-med-ink',
          status: '0 of 30 correct · 0%',
          barW: '0%',
          barMin: '0px',
          aria: '0 of 30 correct'
        },
        {
          title: 'Property and Casualty Insurance Principles and Concepts',
          topic: 'Property and casualty insurance terms and related concepts',
          hasEyebrow: true,
          bmk: 0,
          hasBmk: false,
          bmkText: '0 bookmarked',
          started: true,
          band: 'Beginner',
          conf: 'Low',
          confBg: 'conf-low-bg',
          confBorder: 'conf-low-edge',
          confInk: 'conf-low-ink',
          status: '0 of 68 correct · 0%',
          barW: '0%',
          barMin: '0px',
          aria: '0 of 68 correct'
        },
        {
          title: 'Property and casualty insurance terms and related concepts',
          topic: 'Property and casualty insurance terms and related concepts',
          hasEyebrow: true,
          bmk: 0,
          hasBmk: false,
          bmkText: '0 bookmarked',
          started: false,
          band: 'Beginner',
          conf: 'Low',
          confBg: 'conf-low-bg',
          confBorder: 'conf-low-edge',
          confInk: 'conf-low-ink',
          status: 'Not started',
          barW: '0%',
          barMin: '0px',
          aria: ''
        },
        {
          title: 'Property and Casualty Insurance Terms and Related Concepts Review',
          topic: 'Property and casualty insurance terms and related concepts',
          hasEyebrow: true,
          bmk: 0,
          hasBmk: false,
          bmkText: '0 bookmarked',
          started: false,
          band: 'Beginner',
          conf: 'Low',
          confBg: 'conf-low-bg',
          confBorder: 'conf-low-edge',
          confInk: 'conf-low-ink',
          status: 'Not started',
          barW: '0%',
          barMin: '0px',
          aria: ''
        },
        {
          title: 'Florida laws common to all lines (agents, licensing, the Department)',
          topic: 'Florida statutes, rules and regulations',
          hasEyebrow: true,
          bmk: 0,
          hasBmk: false,
          bmkText: '0 bookmarked',
          started: false,
          band: 'Beginner',
          conf: 'Low',
          confBg: 'conf-low-bg',
          confBorder: 'conf-low-edge',
          confInk: 'conf-low-ink',
          status: 'Not started',
          barW: '0%',
          barMin: '0px',
          aria: ''
        },
        {
          title: 'Florida laws for personal lines (policies, claims, auto, hurricane)',
          topic: 'Florida statutes, rules and regulations',
          hasEyebrow: true,
          bmk: 0,
          hasBmk: false,
          bmkText: '0 bookmarked',
          started: false,
          band: 'Beginner',
          conf: 'Low',
          confBg: 'conf-low-bg',
          confBorder: 'conf-low-edge',
          confInk: 'conf-low-ink',
          status: 'Not started',
          barW: '0%',
          barMin: '0px',
          aria: ''
        },
        {
          title: 'Florida Personal Lines Laws and Rules.',
          topic: 'Florida statutes, rules and regulations',
          hasEyebrow: true,
          bmk: 0,
          hasBmk: false,
          bmkText: '0 bookmarked',
          started: false,
          band: 'Beginner',
          conf: 'Low',
          confBg: 'conf-low-bg',
          confBorder: 'conf-low-edge',
          confInk: 'conf-low-ink',
          status: 'Not started',
          barW: '0%',
          barMin: '0px',
          aria: ''
        },
        {
          title: 'Prep Review: Florida Personal Lines Laws and Rules',
          topic: 'Florida statutes, rules and regulations',
          hasEyebrow: true,
          bmk: 0,
          hasBmk: false,
          bmkText: '0 bookmarked',
          started: false,
          band: 'Beginner',
          conf: 'Low',
          confBg: 'conf-low-bg',
          confBorder: 'conf-low-edge',
          confInk: 'conf-low-ink',
          status: 'Not started',
          barW: '0%',
          barMin: '0px',
          aria: ''
        },
        {
          title: 'Property and Casualty Insurance Policy Provisions',
          topic: 'Property and casualty policy provisions and contract law',
          hasEyebrow: true,
          bmk: 0,
          hasBmk: false,
          bmkText: '0 bookmarked',
          started: false,
          band: 'Beginner',
          conf: 'Low',
          confBg: 'conf-low-bg',
          confBorder: 'conf-low-edge',
          confInk: 'conf-low-ink',
          status: 'Not started',
          barW: '0%',
          barMin: '0px',
          aria: ''
        },
        {
          title: 'Property and Casualty Insurance Policy Provisions and Contract Law Review',
          topic: 'Property and casualty policy provisions and contract law',
          hasEyebrow: true,
          bmk: 0,
          hasBmk: false,
          bmkText: '0 bookmarked',
          started: false,
          band: 'Beginner',
          conf: 'Low',
          confBg: 'conf-low-bg',
          confBorder: 'conf-low-edge',
          confInk: 'conf-low-ink',
          status: 'Not started',
          barW: '0%',
          barMin: '0px',
          aria: ''
        },
        {
          title: 'Property and casualty policy provisions and contract law',
          topic: 'Property and casualty policy provisions and contract law',
          hasEyebrow: true,
          bmk: 0,
          hasBmk: false,
          bmkText: '0 bookmarked',
          started: false,
          band: 'Beginner',
          conf: 'Low',
          confBg: 'conf-low-bg',
          confBorder: 'conf-low-edge',
          confInk: 'conf-low-ink',
          status: 'Not started',
          barW: '0%',
          barMin: '0px',
          aria: ''
        },
        {
          title: 'Dwelling Property (DP) Insurance Policies',
          topic: 'Types of property policies',
          hasEyebrow: true,
          bmk: 0,
          hasBmk: false,
          bmkText: '0 bookmarked',
          started: false,
          band: 'Beginner',
          conf: 'Low',
          confBg: 'conf-low-bg',
          confBorder: 'conf-low-edge',
          confInk: 'conf-low-ink',
          status: 'Not started',
          barW: '0%',
          barMin: '0px',
          aria: ''
        },
        {
          title: 'Homeowners (HO) Insurance Policies',
          topic: 'Types of property policies',
          hasEyebrow: true,
          bmk: 0,
          hasBmk: false,
          bmkText: '0 bookmarked',
          started: false,
          band: 'Beginner',
          conf: 'Low',
          confBg: 'conf-low-bg',
          confBorder: 'conf-low-edge',
          confInk: 'conf-low-ink',
          status: 'Not started',
          barW: '0%',
          barMin: '0px',
          aria: ''
        },
        {
          title: 'Other Personal Lines Insurance',
          topic: 'Types of property policies',
          hasEyebrow: true,
          bmk: 0,
          hasBmk: false,
          bmkText: '0 bookmarked',
          started: false,
          band: 'Beginner',
          conf: 'Low',
          confBg: 'conf-low-bg',
          confBorder: 'conf-low-edge',
          confInk: 'conf-low-ink',
          status: 'Not started',
          barW: '0%',
          barMin: '0px',
          aria: ''
        },
        {
          title: 'Types of property policies',
          topic: 'Types of property policies',
          hasEyebrow: true,
          bmk: 0,
          hasBmk: false,
          bmkText: '0 bookmarked',
          started: false,
          band: 'Beginner',
          conf: 'Low',
          confBg: 'conf-low-bg',
          confBorder: 'conf-low-edge',
          confInk: 'conf-low-ink',
          status: 'Not started',
          barW: '0%',
          barMin: '0px',
          aria: ''
        }
      ]
    }
  ],
  bookmarked: [
    {
      id: 'grp-flat',
      title: 'Bookmarked sets',
      meta: '',
      hasHeader: false,
      sets: [
        {
          title: 'Prep Review: Types of Casualty Insurance Policies - Personal Lines - Pearson Vue',
          topic: 'Types of casualty policies',
          hasEyebrow: true,
          bmk: 2,
          hasBmk: true,
          bmkText: '2 bookmarked',
          started: true,
          band: 'Beginner',
          conf: 'Low',
          confBg: 'conf-low-bg',
          confBorder: 'conf-low-edge',
          confInk: 'conf-low-ink',
          status: '1 of 45 correct · 2%',
          barW: '2%',
          barMin: '6px',
          aria: '1 of 45 correct'
        },
        {
          title: 'General Insurance Principles and Concepts',
          topic: 'Property and casualty insurance terms and related concepts',
          hasEyebrow: true,
          bmk: 1,
          hasBmk: true,
          bmkText: '1 bookmarked',
          started: true,
          band: 'Beginner',
          conf: 'Low',
          confBg: 'conf-low-bg',
          confBorder: 'conf-low-edge',
          confInk: 'conf-low-ink',
          status: '1 of 60 correct · 2%',
          barW: '2%',
          barMin: '6px',
          aria: '1 of 60 correct'
        }
      ]
    }
  ]
}

/**
 * HIS PRACTICE PROSE. Template text, transcribed from the rendered page.
 *
 * ⚠ THE LEAD IS DISMISSIBLE — his `introOpen` / `dismissIntro`. It opens on,
 * and closing it is remembered for the session only.
 */
export const JEFF_MVP_PRACTICE_COPY = {
  title: 'Practice',
  course: 'Florida Life and Health Pre-licensing',
  lead: 'Answer, review, repeat to get Exam Day Ready. Build custom sessions for weak topics. Rubi reviews answers and links to course refreshers.',
  dismissLabel: 'Dismiss',

  rubiEyebrow: 'Rubi recommends',
  readinessLabel: 'Readiness',
  aboutLabel: 'About',

  filterBy: 'Filter by:',
  confidenceLabel: 'Confidence',
  readinessFilterLabel: 'Readiness',
  clearFilters: 'Clear filters',

  /* The table's five column heads. The last is a blank cell over the action
     column, which is why his header row reads SET · CONFIDENCE · READINESS ·
     PROGRESS and then a visually-hidden "Action". */
  cols: ['Set', 'Confidence', 'Readiness', 'Progress'],
  actionCol: 'Action',
  notStarted: 'Not started',
  startSet: 'Start set',
  /* ⚠ ASYMMETRIC, AND IT IS HIS. The CONFIDENCE pill is labelled in BOTH
     views — "Low / confidence" — but the Readiness band is labelled only on a
     card, never in the table. Measured on his render; the first pass assumed
     the table labelled neither (the column heads say it) and lost the word
     from twenty-one rows. */
  confidenceWord: 'confidence',
  readinessWord: 'readiness',
  dash: '—',

  emptyTitle: 'No sets match these filters',
  emptyBody:
    'Confidence and Readiness appear once you start a set. Try another level, or clear the filters to see everything.',
} as const

/**
 * HIS FILTER RULE, PORTED — `pass()` from his `baseVals`.
 *
 * ⚠ BOTH HALVES REQUIRE `started`. An unstarted set has no confidence and no
 * Readiness to compare, so it cannot match a filter on either; his page hides
 * it rather than showing it as unmatched. That is why picking High confidence
 * empties the page completely, and why the empty state explains itself in
 * terms of starting a set rather than of the filter.
 *
 * ⚠ EMPTY SELECTION MEANS "NO FILTER", not "match nothing" — `!sel.length` is
 * the first test on each half.
 */
export function practiceMatches(
  set: { started: boolean; conf: string; band: string },
  conf: readonly string[],
  ready: readonly string[],
): boolean {
  const byConf = !conf.length || (set.started && conf.includes(set.conf))
  const byReady = !ready.length || (set.started && ready.includes(set.band))
  return byConf && byReady
}

/**
 * THE PREP REVIEW PAGE — his fourth rail row, first of the EXAM PREP group,
 * ported 2026-11-09.
 *
 * Structurally Learn's cousin and deliberately NOT Learn: six chapters with
 * an exam after most of them, and NOTHING LOCKED. His lead says why —
 * "Optional review before your state exam. Every chapter and review exam is
 * open, so take them in any order." Where Learn gates each step on the one
 * before, this page gates nothing, and the header carries an "Optional" pill
 * to say so.
 *
 * ⚠ ONE FLAT LIST, NOT CHAPTERS WITH EXAMS INSIDE THEM. His `rows` interleaves
 * chapter and exam rows as siblings (`isChapter` / `isExam`), which is why
 * CHAPTER 5 SIMPLY HAS NO EXAM — five exams for six chapters. Nesting them
 * the way Learn does would force an empty exam slot onto that chapter, and
 * the only honest thing to put in it would be something he did not write.
 *
 * ⚠ AN EXAM ROW DOES NOT EXPAND. His gives it `lessons: []` and a no-op
 * toggle, so it draws no chevron at all.
 *
 * ⚠ LESSONS ARE GENERATED, NOT AUTHORED — "Lesson 1", "Lesson 2" … up to the
 * chapter's count, with the first unfinished one marked current. That is his
 * placeholder content and it is carried as-is; inventing titles for twenty
 * lessons would be writing his course for him.
 */
export const JEFF_MVP_PREP = {
  rows: [
    {
      kind: 'chapter',
      n: 1,
      title: 'Prep Review: Types of Casualty Insurance Policies - Personal Lines - Pearson Vue',
      eyebrow: 'Chapter 1 · 3 lessons',
      eyebrowTone: 'steel-deep',
      inProgress: true,
      status: 'In progress',
      statusTone: 'steel-deep',
      action: 'Resume',
      actionLabel: 'Resume Chapter 1: Prep Review: Types of Casualty Insurance Policies - Personal Lines - Pearson Vue',
      progPct: '33%',
      progAria: 'Chapter 1: 1 of 3 lessons complete',
      expanded: false,
      expandLabel: 'Expand Chapter 1',
      collapseLabel: 'Collapse Chapter 1',
      lessons: [
        {
          label: 'Lesson 1',
          state: 'done'
        },
        {
          label: 'Lesson 2',
          state: 'current'
        },
        {
          label: 'Lesson 3',
          state: 'todo'
        }
      ]
    },
    {
      kind: 'exam',
      title: 'Prep Review Exam: Types of Casualty Insurance Policies - Personal Lines - Pearson Vue',
      actionLabel: 'Take exam: Prep Review Exam: Types of Casualty Insurance Policies - Personal Lines - Pearson Vue'
    },
    {
      kind: 'chapter',
      n: 2,
      title: 'Prep Review: Types of Property Insurance Policies - Personal Lines - Pearson Vue',
      eyebrow: 'Chapter 2 · 9 lessons',
      eyebrowTone: 'muted',
      inProgress: false,
      status: '',
      statusTone: 'muted',
      action: 'Start',
      actionLabel: 'Start Chapter 2: Prep Review: Types of Property Insurance Policies - Personal Lines - Pearson Vue',
      progPct: '0%',
      progAria: 'Chapter 2: 0 of 9 lessons complete',
      expanded: false,
      expandLabel: 'Expand Chapter 2',
      collapseLabel: 'Collapse Chapter 2',
      lessons: [
        {
          label: 'Lesson 1',
          state: 'todo'
        },
        {
          label: 'Lesson 2',
          state: 'todo'
        },
        {
          label: 'Lesson 3',
          state: 'todo'
        },
        {
          label: 'Lesson 4',
          state: 'todo'
        },
        {
          label: 'Lesson 5',
          state: 'todo'
        },
        {
          label: 'Lesson 6',
          state: 'todo'
        },
        {
          label: 'Lesson 7',
          state: 'todo'
        },
        {
          label: 'Lesson 8',
          state: 'todo'
        },
        {
          label: 'Lesson 9',
          state: 'todo'
        }
      ]
    },
    {
      kind: 'exam',
      title: 'Prep Review Exam: Types of Property Insurance Policies - Personal Lines - Pearson Vue',
      actionLabel: 'Take exam: Prep Review Exam: Types of Property Insurance Policies - Personal Lines - Pearson Vue'
    },
    {
      kind: 'chapter',
      n: 3,
      title: 'Property and Casualty Insurance Terms and Related Concepts Review',
      eyebrow: 'Chapter 3 · 2 lessons',
      eyebrowTone: 'muted',
      inProgress: false,
      status: '',
      statusTone: 'muted',
      action: 'Start',
      actionLabel: 'Start Chapter 3: Property and Casualty Insurance Terms and Related Concepts Review',
      progPct: '0%',
      progAria: 'Chapter 3: 0 of 2 lessons complete',
      expanded: false,
      expandLabel: 'Expand Chapter 3',
      collapseLabel: 'Collapse Chapter 3',
      lessons: [
        {
          label: 'Lesson 1',
          state: 'todo'
        },
        {
          label: 'Lesson 2',
          state: 'todo'
        }
      ]
    },
    {
      kind: 'exam',
      title: 'Property and Casualty Insurance Terms and Related Concepts Review Exam',
      actionLabel: 'Take exam: Property and Casualty Insurance Terms and Related Concepts Review Exam'
    },
    {
      kind: 'chapter',
      n: 4,
      title: 'Property and Casualty Insurance Policy Provisions and Contract Law Review',
      eyebrow: 'Chapter 4 · 2 lessons',
      eyebrowTone: 'muted',
      inProgress: false,
      status: '',
      statusTone: 'muted',
      action: 'Start',
      actionLabel: 'Start Chapter 4: Property and Casualty Insurance Policy Provisions and Contract Law Review',
      progPct: '0%',
      progAria: 'Chapter 4: 0 of 2 lessons complete',
      expanded: false,
      expandLabel: 'Expand Chapter 4',
      collapseLabel: 'Collapse Chapter 4',
      lessons: [
        {
          label: 'Lesson 1',
          state: 'todo'
        },
        {
          label: 'Lesson 2',
          state: 'todo'
        }
      ]
    },
    {
      kind: 'exam',
      title: 'Property and Casualty Insurance Policy Provisions and Contract Law Review Exam',
      actionLabel: 'Take exam: Property and Casualty Insurance Policy Provisions and Contract Law Review Exam'
    },
    {
      kind: 'chapter',
      n: 5,
      title: 'Prep Review: Florida Insurance Laws',
      eyebrow: 'Chapter 5 · 2 lessons',
      eyebrowTone: 'muted',
      inProgress: false,
      status: '',
      statusTone: 'muted',
      action: 'Start',
      actionLabel: 'Start Chapter 5: Prep Review: Florida Insurance Laws',
      progPct: '0%',
      progAria: 'Chapter 5: 0 of 2 lessons complete',
      expanded: false,
      expandLabel: 'Expand Chapter 5',
      collapseLabel: 'Collapse Chapter 5',
      lessons: [
        {
          label: 'Lesson 1',
          state: 'todo'
        },
        {
          label: 'Lesson 2',
          state: 'todo'
        }
      ]
    },
    {
      kind: 'chapter',
      n: 6,
      title: 'Prep Review: Florida Personal Lines Laws and Rules',
      eyebrow: 'Chapter 6 · 2 lessons',
      eyebrowTone: 'muted',
      inProgress: false,
      status: '',
      statusTone: 'muted',
      action: 'Start',
      actionLabel: 'Start Chapter 6: Prep Review: Florida Personal Lines Laws and Rules',
      progPct: '0%',
      progAria: 'Chapter 6: 0 of 2 lessons complete',
      expanded: false,
      expandLabel: 'Expand Chapter 6',
      collapseLabel: 'Collapse Chapter 6',
      lessons: [
        {
          label: 'Lesson 1',
          state: 'todo'
        },
        {
          label: 'Lesson 2',
          state: 'todo'
        }
      ]
    },
    {
      kind: 'exam',
      title: 'Prep Review Exam: Florida Personal Lines Laws and Rules',
      actionLabel: 'Take exam: Prep Review Exam: Florida Personal Lines Laws and Rules'
    }
  ]
} as const

/**
 * HIS PREP REVIEW PROSE AND FIGURES, transcribed from the rendered page.
 *
 * ⚠ THE RING MYSTERY, SOLVED — and it changes what to tell Jeff. Three of his
 * pages draw a 72px ring from a 120 viewBox at r=50 (circumference 314.2):
 *
 *     page         dash    on r=50   on r=47   his label
 *     Overview     192.0     61.1%     65.0%      61%
 *     Learn        180.0     57.3%     61.0%      61%
 *     Prep Review  182.8     58.2%     61.9%      62%
 *
 * Learn and Prep Review are EXACT on r=47; the Overview is exact on r=50. So
 * this is not "Learn's number looks wrong" — it is two pages whose arc length
 * was computed for a 47-radius circle and then drawn on a 50-radius one. Both
 * under-draw by about four points. All three are carried verbatim, and the
 * pattern is what to raise with him: one formula, two pages, one radius out
 * of step.
 */
export const JEFF_MVP_PREP_COPY = {
  title: 'Prep Review',
  course: 'Florida Life and Health Pre-licensing',
  lead: 'Optional review before your state exam. Every chapter and review exam is open, so take them in any order.',

  resumeEyebrow: 'Where you left off',
  resumeTitle: 'Chapter 1 · Prep Review: Types of Casualty Insurance Policies',
  resumeCta: 'Resume lesson',

  cardEyebrow: '6 chapters · 1 of 20 lessons',
  cardTitle: 'Prep Review',
  optionalPill: 'Optional',
  band: 'Developing',
  chaptersDone: '0 of 6 chapters complete',
  ringPct: '62%',
  /* See the note above: exact for r=47, drawn at r=50. His, kept. */
  ringDash: '182.8 314.2',
  ringAria: 'Prep Review readiness 62%, developing',

  examEyebrow: 'Exam',
  examCta: 'Take exam',
} as const

/**
 * THE STUDY PLANNER — his third rail row, ported 2026-11-09.
 *
 * A plan that rebuilds itself: an exam date, a weekly pace, and a calendar
 * where marking a day off pushes its session to the next study day. His lead
 * is the promise — "Your plan rebuilds itself when life gets in the way."
 *
 * ⚠ IT IS NOT ANJANI'S STUDY PLANNER. `CompassStudyPlanner` has been in this
 * repo since 2026-10-08 and is hers, on her rail, with her model
 * (`compassStudyPlannerModel.ts`). This is a different designer's answer to
 * the same screen and lives beside it, like every other page of his MVP.
 *
 * ⚠ TWO CALENDARS, NOT ONE WITH A ZOOM. "This week" is 7 cells at 150px;
 * "Full plan" is 63 — nine weeks from today to exam day — at 96px, under a
 * different title ("Sep 22 to exam day"). Both are stored.
 *
 * ⚠ HIS PROTOTYPE'S TODAY IS TUESDAY 22 SEPTEMBER 2026, hard-coded in
 * `planConst()` as `T0`. Every date on this page is computed from it, which
 * is why the week reads Sep 20–26 and the exam is 59 days away regardless of
 * when anyone opens it. Carried as data rather than recomputed from the real
 * clock: a planner that silently re-dated itself would stop matching the
 * screenshots his review is based on.
 *
 * ⚠ EACH CELL CARRIES ITS OWN HOVER CARD — what skipping that day would do
 * ("Policy provisions moves to Wed, Sep 23."), and for a day with nothing
 * planned, "Mark it off so nothing moves here." That sentence IS the feature;
 * a calendar that only showed the sessions would be a different design.
 */
/** Typed rather than `as const`, for the reason the Practice fixture is — the
 *  two calendars are arrays of one shape, and literal tuple types make them
 *  mutually unassignable. */
export type JeffMvpPlannerCell = {
  date: string
  dow: string
  longDate: string
  aria: string
  isToday: boolean
  isExam: boolean
  isOff: boolean
  hasSession: boolean
  topic: string
  dur: string
  review: boolean
  struck: boolean
  canSkip: boolean
  disabled: boolean
  popTitle: string
  popSub: string
  popNote: string
  popSide: string
}
export type JeffMvpPlanner = {
  daysAway: number
  paceName: string
  weekTotal: string
  finishLabel: string
  finishNote: string
  finishTone: string
  weekTitle: string
  fullTitle: string
  views: string[]
  week: JeffMvpPlannerCell[]
  full: JeffMvpPlannerCell[]
  paces: {
    name: string
    suggested: boolean
    total: string
    perDay: string
    finish: string
    finishTone: string
    late: boolean
  }[]
  sliders: { label: string; value: number; text: string }[]
}

export const JEFF_MVP_PLANNER: JeffMvpPlanner = {
  daysAway: 59,
  paceName: 'Steady',
  weekTotal: '7h 30m',
  finishLabel: 'Nov 11',
  finishNote: '9 days before your exam',
  finishTone: 'green',
  weekTitle: 'This week · Sep 20 – 26',
  fullTitle: 'Sep 22 to exam day',
  views: [
    'This week',
    'Full plan'
  ],
  week: [
    {
      date: 'Sep 20',
      dow: 'Sun',
      longDate: 'Sun, Sep 20',
      aria: 'Sun, Sep 20',
      isToday: false,
      isExam: false,
      isOff: false,
      hasSession: false,
      topic: '',
      dur: '',
      review: false,
      struck: false,
      canSkip: false,
      disabled: true,
      popTitle: 'I can’t study this day',
      popSub: 'Nothing planned.',
      popNote: 'Mark it off so nothing moves here.',
      popSide: 'left'
    },
    {
      date: '21',
      dow: 'Mon',
      longDate: 'Mon, Sep 21',
      aria: 'Mon, Sep 21',
      isToday: false,
      isExam: false,
      isOff: false,
      hasSession: false,
      topic: '',
      dur: '',
      review: false,
      struck: false,
      canSkip: false,
      disabled: true,
      popTitle: 'I can’t study this day',
      popSub: 'Nothing planned.',
      popNote: 'Mark it off so nothing moves here.',
      popSide: 'left'
    },
    {
      date: '22',
      dow: 'Tue',
      longDate: 'Tue, Sep 22',
      aria: 'Tue, Sep 22, today: Policy provisions, 1h 30m',
      isToday: true,
      isExam: false,
      isOff: false,
      hasSession: true,
      topic: 'Policy provisions',
      dur: '1h 30m',
      review: false,
      struck: false,
      canSkip: true,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Policy provisions · 1h 30m',
      popNote: 'Policy provisions moves to Wed, Sep 23.',
      popSide: 'left'
    },
    {
      date: '23',
      dow: 'Wed',
      longDate: 'Wed, Sep 23',
      aria: 'Wed, Sep 23: Annuities, 1h 30m',
      isToday: false,
      isExam: false,
      isOff: false,
      hasSession: true,
      topic: 'Annuities',
      dur: '1h 30m',
      review: false,
      struck: false,
      canSkip: true,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Annuities · 1h 30m',
      popNote: 'Annuities moves to Thu, Sep 24.',
      popSide: 'left'
    },
    {
      date: '24',
      dow: 'Thu',
      longDate: 'Thu, Sep 24',
      aria: 'Thu, Sep 24: Health & disability, 1h 30m',
      isToday: false,
      isExam: false,
      isOff: false,
      hasSession: true,
      topic: 'Health & disability',
      dur: '1h 30m',
      review: false,
      struck: false,
      canSkip: true,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Health & disability · 1h 30m',
      popNote: 'Health & disability moves to Fri, Sep 25.',
      popSide: 'right'
    },
    {
      date: '25',
      dow: 'Fri',
      longDate: 'Fri, Sep 25',
      aria: 'Fri, Sep 25: Taxation, 1h 30m, plus spaced review',
      isToday: false,
      isExam: false,
      isOff: false,
      hasSession: true,
      topic: 'Taxation',
      dur: '1h 30m',
      review: true,
      struck: false,
      canSkip: true,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Taxation · 1h 30m',
      popNote: 'Taxation moves to Mon, Sep 28.',
      popSide: 'right'
    },
    {
      date: '26',
      dow: 'Sat',
      longDate: 'Sat, Sep 26',
      aria: 'Sat, Sep 26: day off',
      isToday: false,
      isExam: false,
      isOff: true,
      hasSession: false,
      topic: '',
      dur: '',
      review: false,
      struck: true,
      canSkip: false,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Nothing planned.',
      popNote: 'Mark it off so nothing moves here.',
      popSide: 'right'
    }
  ],
  full: [
    {
      date: 'Sep 20',
      dow: 'Sun',
      longDate: 'Sun, Sep 20',
      aria: 'Sun, Sep 20',
      isToday: false,
      isExam: false,
      isOff: false,
      hasSession: false,
      topic: '',
      dur: '',
      review: false,
      struck: false,
      canSkip: false,
      disabled: true,
      popTitle: 'I can’t study this day',
      popSub: 'Nothing planned.',
      popNote: 'Mark it off so nothing moves here.',
      popSide: 'left'
    },
    {
      date: '21',
      dow: 'Mon',
      longDate: 'Mon, Sep 21',
      aria: 'Mon, Sep 21',
      isToday: false,
      isExam: false,
      isOff: false,
      hasSession: false,
      topic: '',
      dur: '',
      review: false,
      struck: false,
      canSkip: false,
      disabled: true,
      popTitle: 'I can’t study this day',
      popSub: 'Nothing planned.',
      popNote: 'Mark it off so nothing moves here.',
      popSide: 'left'
    },
    {
      date: '22',
      dow: 'Tue',
      longDate: 'Tue, Sep 22',
      aria: 'Tue, Sep 22, today: Policy provisions, 1h 30m',
      isToday: true,
      isExam: false,
      isOff: false,
      hasSession: true,
      topic: 'Policy provisions',
      dur: '1h 30m',
      review: false,
      struck: false,
      canSkip: true,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Policy provisions · 1h 30m',
      popNote: 'Policy provisions moves to Wed, Sep 23.',
      popSide: 'left'
    },
    {
      date: '23',
      dow: 'Wed',
      longDate: 'Wed, Sep 23',
      aria: 'Wed, Sep 23: Annuities, 1h 30m',
      isToday: false,
      isExam: false,
      isOff: false,
      hasSession: true,
      topic: 'Annuities',
      dur: '1h 30m',
      review: false,
      struck: false,
      canSkip: true,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Annuities · 1h 30m',
      popNote: 'Annuities moves to Thu, Sep 24.',
      popSide: 'left'
    },
    {
      date: '24',
      dow: 'Thu',
      longDate: 'Thu, Sep 24',
      aria: 'Thu, Sep 24: Health & disability, 1h 30m',
      isToday: false,
      isExam: false,
      isOff: false,
      hasSession: true,
      topic: 'Health & disability',
      dur: '1h 30m',
      review: false,
      struck: false,
      canSkip: true,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Health & disability · 1h 30m',
      popNote: 'Health & disability moves to Fri, Sep 25.',
      popSide: 'right'
    },
    {
      date: '25',
      dow: 'Fri',
      longDate: 'Fri, Sep 25',
      aria: 'Fri, Sep 25: Taxation, 1h 30m, plus spaced review',
      isToday: false,
      isExam: false,
      isOff: false,
      hasSession: true,
      topic: 'Taxation',
      dur: '1h 30m',
      review: true,
      struck: false,
      canSkip: true,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Taxation · 1h 30m',
      popNote: 'Taxation moves to Mon, Sep 28.',
      popSide: 'right'
    },
    {
      date: '26',
      dow: 'Sat',
      longDate: 'Sat, Sep 26',
      aria: 'Sat, Sep 26: day off',
      isToday: false,
      isExam: false,
      isOff: true,
      hasSession: false,
      topic: '',
      dur: '',
      review: false,
      struck: true,
      canSkip: false,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Nothing planned.',
      popNote: 'Mark it off so nothing moves here.',
      popSide: 'right'
    },
    {
      date: '27',
      dow: 'Sun',
      longDate: 'Sun, Sep 27',
      aria: 'Sun, Sep 27: day off',
      isToday: false,
      isExam: false,
      isOff: true,
      hasSession: false,
      topic: '',
      dur: '',
      review: false,
      struck: true,
      canSkip: false,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Nothing planned.',
      popNote: 'Mark it off so nothing moves here.',
      popSide: 'left'
    },
    {
      date: '28',
      dow: 'Mon',
      longDate: 'Mon, Sep 28',
      aria: 'Mon, Sep 28: Federal rules, 1h 30m',
      isToday: false,
      isExam: false,
      isOff: false,
      hasSession: true,
      topic: 'Federal rules',
      dur: '1h 30m',
      review: false,
      struck: false,
      canSkip: true,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Federal rules · 1h 30m',
      popNote: 'Federal rules moves to Tue, Sep 29.',
      popSide: 'left'
    },
    {
      date: '29',
      dow: 'Tue',
      longDate: 'Tue, Sep 29',
      aria: 'Tue, Sep 29: Riders, 1h 30m',
      isToday: false,
      isExam: false,
      isOff: false,
      hasSession: true,
      topic: 'Riders',
      dur: '1h 30m',
      review: false,
      struck: false,
      canSkip: true,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Riders · 1h 30m',
      popNote: 'Riders moves to Wed, Sep 30.',
      popSide: 'left'
    },
    {
      date: '30',
      dow: 'Wed',
      longDate: 'Wed, Sep 30',
      aria: 'Wed, Sep 30: Policy provisions, 1h 30m',
      isToday: false,
      isExam: false,
      isOff: false,
      hasSession: true,
      topic: 'Policy provisions',
      dur: '1h 30m',
      review: false,
      struck: false,
      canSkip: true,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Policy provisions · 1h 30m',
      popNote: 'Policy provisions moves to Thu, Oct 1.',
      popSide: 'left'
    },
    {
      date: 'Oct 1',
      dow: 'Thu',
      longDate: 'Thu, Oct 1',
      aria: 'Thu, Oct 1: Annuities, 1h 30m, plus spaced review',
      isToday: false,
      isExam: false,
      isOff: false,
      hasSession: true,
      topic: 'Annuities',
      dur: '1h 30m',
      review: true,
      struck: false,
      canSkip: true,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Annuities · 1h 30m',
      popNote: 'Annuities moves to Fri, Oct 2.',
      popSide: 'right'
    },
    {
      date: '2',
      dow: 'Fri',
      longDate: 'Fri, Oct 2',
      aria: 'Fri, Oct 2: Health & disability, 1h 30m',
      isToday: false,
      isExam: false,
      isOff: false,
      hasSession: true,
      topic: 'Health & disability',
      dur: '1h 30m',
      review: false,
      struck: false,
      canSkip: true,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Health & disability · 1h 30m',
      popNote: 'Health & disability moves to Mon, Oct 5.',
      popSide: 'right'
    },
    {
      date: '3',
      dow: 'Sat',
      longDate: 'Sat, Oct 3',
      aria: 'Sat, Oct 3: day off',
      isToday: false,
      isExam: false,
      isOff: true,
      hasSession: false,
      topic: '',
      dur: '',
      review: false,
      struck: true,
      canSkip: false,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Nothing planned.',
      popNote: 'Mark it off so nothing moves here.',
      popSide: 'right'
    },
    {
      date: '4',
      dow: 'Sun',
      longDate: 'Sun, Oct 4',
      aria: 'Sun, Oct 4: day off',
      isToday: false,
      isExam: false,
      isOff: true,
      hasSession: false,
      topic: '',
      dur: '',
      review: false,
      struck: true,
      canSkip: false,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Nothing planned.',
      popNote: 'Mark it off so nothing moves here.',
      popSide: 'left'
    },
    {
      date: '5',
      dow: 'Mon',
      longDate: 'Mon, Oct 5',
      aria: 'Mon, Oct 5: Taxation, 1h 30m',
      isToday: false,
      isExam: false,
      isOff: false,
      hasSession: true,
      topic: 'Taxation',
      dur: '1h 30m',
      review: false,
      struck: false,
      canSkip: true,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Taxation · 1h 30m',
      popNote: 'Taxation moves to Tue, Oct 6.',
      popSide: 'left'
    },
    {
      date: '6',
      dow: 'Tue',
      longDate: 'Tue, Oct 6',
      aria: 'Tue, Oct 6: Federal rules, 1h 30m',
      isToday: false,
      isExam: false,
      isOff: false,
      hasSession: true,
      topic: 'Federal rules',
      dur: '1h 30m',
      review: false,
      struck: false,
      canSkip: true,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Federal rules · 1h 30m',
      popNote: 'Federal rules moves to Wed, Oct 7.',
      popSide: 'left'
    },
    {
      date: '7',
      dow: 'Wed',
      longDate: 'Wed, Oct 7',
      aria: 'Wed, Oct 7: Riders, 1h 30m, plus spaced review',
      isToday: false,
      isExam: false,
      isOff: false,
      hasSession: true,
      topic: 'Riders',
      dur: '1h 30m',
      review: true,
      struck: false,
      canSkip: true,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Riders · 1h 30m',
      popNote: 'Riders moves to Thu, Oct 8.',
      popSide: 'left'
    },
    {
      date: '8',
      dow: 'Thu',
      longDate: 'Thu, Oct 8',
      aria: 'Thu, Oct 8: Policy provisions, 1h 30m',
      isToday: false,
      isExam: false,
      isOff: false,
      hasSession: true,
      topic: 'Policy provisions',
      dur: '1h 30m',
      review: false,
      struck: false,
      canSkip: true,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Policy provisions · 1h 30m',
      popNote: 'Policy provisions moves to Fri, Oct 9.',
      popSide: 'right'
    },
    {
      date: '9',
      dow: 'Fri',
      longDate: 'Fri, Oct 9',
      aria: 'Fri, Oct 9: Annuities, 1h 30m',
      isToday: false,
      isExam: false,
      isOff: false,
      hasSession: true,
      topic: 'Annuities',
      dur: '1h 30m',
      review: false,
      struck: false,
      canSkip: true,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Annuities · 1h 30m',
      popNote: 'Annuities moves to Mon, Oct 12.',
      popSide: 'right'
    },
    {
      date: '10',
      dow: 'Sat',
      longDate: 'Sat, Oct 10',
      aria: 'Sat, Oct 10: day off',
      isToday: false,
      isExam: false,
      isOff: true,
      hasSession: false,
      topic: '',
      dur: '',
      review: false,
      struck: true,
      canSkip: false,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Nothing planned.',
      popNote: 'Mark it off so nothing moves here.',
      popSide: 'right'
    },
    {
      date: '11',
      dow: 'Sun',
      longDate: 'Sun, Oct 11',
      aria: 'Sun, Oct 11: day off',
      isToday: false,
      isExam: false,
      isOff: true,
      hasSession: false,
      topic: '',
      dur: '',
      review: false,
      struck: true,
      canSkip: false,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Nothing planned.',
      popNote: 'Mark it off so nothing moves here.',
      popSide: 'left'
    },
    {
      date: '12',
      dow: 'Mon',
      longDate: 'Mon, Oct 12',
      aria: 'Mon, Oct 12: Health & disability, 1h 30m',
      isToday: false,
      isExam: false,
      isOff: false,
      hasSession: true,
      topic: 'Health & disability',
      dur: '1h 30m',
      review: false,
      struck: false,
      canSkip: true,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Health & disability · 1h 30m',
      popNote: 'Health & disability moves to Tue, Oct 13.',
      popSide: 'left'
    },
    {
      date: '13',
      dow: 'Tue',
      longDate: 'Tue, Oct 13',
      aria: 'Tue, Oct 13: Taxation, 1h 30m, plus spaced review',
      isToday: false,
      isExam: false,
      isOff: false,
      hasSession: true,
      topic: 'Taxation',
      dur: '1h 30m',
      review: true,
      struck: false,
      canSkip: true,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Taxation · 1h 30m',
      popNote: 'Taxation moves to Wed, Oct 14.',
      popSide: 'left'
    },
    {
      date: '14',
      dow: 'Wed',
      longDate: 'Wed, Oct 14',
      aria: 'Wed, Oct 14: Federal rules, 1h 30m',
      isToday: false,
      isExam: false,
      isOff: false,
      hasSession: true,
      topic: 'Federal rules',
      dur: '1h 30m',
      review: false,
      struck: false,
      canSkip: true,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Federal rules · 1h 30m',
      popNote: 'Federal rules moves to Thu, Oct 15.',
      popSide: 'left'
    },
    {
      date: '15',
      dow: 'Thu',
      longDate: 'Thu, Oct 15',
      aria: 'Thu, Oct 15: Riders, 1h 30m',
      isToday: false,
      isExam: false,
      isOff: false,
      hasSession: true,
      topic: 'Riders',
      dur: '1h 30m',
      review: false,
      struck: false,
      canSkip: true,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Riders · 1h 30m',
      popNote: 'Riders moves to Fri, Oct 16.',
      popSide: 'right'
    },
    {
      date: '16',
      dow: 'Fri',
      longDate: 'Fri, Oct 16',
      aria: 'Fri, Oct 16: Policy provisions, 1h 30m',
      isToday: false,
      isExam: false,
      isOff: false,
      hasSession: true,
      topic: 'Policy provisions',
      dur: '1h 30m',
      review: false,
      struck: false,
      canSkip: true,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Policy provisions · 1h 30m',
      popNote: 'Policy provisions moves to Mon, Oct 19.',
      popSide: 'right'
    },
    {
      date: '17',
      dow: 'Sat',
      longDate: 'Sat, Oct 17',
      aria: 'Sat, Oct 17: day off',
      isToday: false,
      isExam: false,
      isOff: true,
      hasSession: false,
      topic: '',
      dur: '',
      review: false,
      struck: true,
      canSkip: false,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Nothing planned.',
      popNote: 'Mark it off so nothing moves here.',
      popSide: 'right'
    },
    {
      date: '18',
      dow: 'Sun',
      longDate: 'Sun, Oct 18',
      aria: 'Sun, Oct 18: day off',
      isToday: false,
      isExam: false,
      isOff: true,
      hasSession: false,
      topic: '',
      dur: '',
      review: false,
      struck: true,
      canSkip: false,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Nothing planned.',
      popNote: 'Mark it off so nothing moves here.',
      popSide: 'left'
    },
    {
      date: '19',
      dow: 'Mon',
      longDate: 'Mon, Oct 19',
      aria: 'Mon, Oct 19: Annuities, 1h 30m, plus spaced review',
      isToday: false,
      isExam: false,
      isOff: false,
      hasSession: true,
      topic: 'Annuities',
      dur: '1h 30m',
      review: true,
      struck: false,
      canSkip: true,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Annuities · 1h 30m',
      popNote: 'Annuities moves to Tue, Oct 20.',
      popSide: 'left'
    },
    {
      date: '20',
      dow: 'Tue',
      longDate: 'Tue, Oct 20',
      aria: 'Tue, Oct 20: Health & disability, 1h 30m',
      isToday: false,
      isExam: false,
      isOff: false,
      hasSession: true,
      topic: 'Health & disability',
      dur: '1h 30m',
      review: false,
      struck: false,
      canSkip: true,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Health & disability · 1h 30m',
      popNote: 'Health & disability moves to Wed, Oct 21.',
      popSide: 'left'
    },
    {
      date: '21',
      dow: 'Wed',
      longDate: 'Wed, Oct 21',
      aria: 'Wed, Oct 21: Taxation, 1h 30m',
      isToday: false,
      isExam: false,
      isOff: false,
      hasSession: true,
      topic: 'Taxation',
      dur: '1h 30m',
      review: false,
      struck: false,
      canSkip: true,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Taxation · 1h 30m',
      popNote: 'Taxation moves to Thu, Oct 22.',
      popSide: 'left'
    },
    {
      date: '22',
      dow: 'Thu',
      longDate: 'Thu, Oct 22',
      aria: 'Thu, Oct 22: Federal rules, 1h 30m',
      isToday: false,
      isExam: false,
      isOff: false,
      hasSession: true,
      topic: 'Federal rules',
      dur: '1h 30m',
      review: false,
      struck: false,
      canSkip: true,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Federal rules · 1h 30m',
      popNote: 'Federal rules moves to Fri, Oct 23.',
      popSide: 'right'
    },
    {
      date: '23',
      dow: 'Fri',
      longDate: 'Fri, Oct 23',
      aria: 'Fri, Oct 23: Riders, 1h 30m, plus spaced review',
      isToday: false,
      isExam: false,
      isOff: false,
      hasSession: true,
      topic: 'Riders',
      dur: '1h 30m',
      review: true,
      struck: false,
      canSkip: true,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Riders · 1h 30m',
      popNote: 'Riders moves to Mon, Oct 26.',
      popSide: 'right'
    },
    {
      date: '24',
      dow: 'Sat',
      longDate: 'Sat, Oct 24',
      aria: 'Sat, Oct 24: day off',
      isToday: false,
      isExam: false,
      isOff: true,
      hasSession: false,
      topic: '',
      dur: '',
      review: false,
      struck: true,
      canSkip: false,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Nothing planned.',
      popNote: 'Mark it off so nothing moves here.',
      popSide: 'right'
    },
    {
      date: '25',
      dow: 'Sun',
      longDate: 'Sun, Oct 25',
      aria: 'Sun, Oct 25: day off',
      isToday: false,
      isExam: false,
      isOff: true,
      hasSession: false,
      topic: '',
      dur: '',
      review: false,
      struck: true,
      canSkip: false,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Nothing planned.',
      popNote: 'Mark it off so nothing moves here.',
      popSide: 'left'
    },
    {
      date: '26',
      dow: 'Mon',
      longDate: 'Mon, Oct 26',
      aria: 'Mon, Oct 26: Policy provisions, 1h 30m',
      isToday: false,
      isExam: false,
      isOff: false,
      hasSession: true,
      topic: 'Policy provisions',
      dur: '1h 30m',
      review: false,
      struck: false,
      canSkip: true,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Policy provisions · 1h 30m',
      popNote: 'Policy provisions moves to Tue, Oct 27.',
      popSide: 'left'
    },
    {
      date: '27',
      dow: 'Tue',
      longDate: 'Tue, Oct 27',
      aria: 'Tue, Oct 27: Annuities, 1h 30m',
      isToday: false,
      isExam: false,
      isOff: false,
      hasSession: true,
      topic: 'Annuities',
      dur: '1h 30m',
      review: false,
      struck: false,
      canSkip: true,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Annuities · 1h 30m',
      popNote: 'Annuities moves to Wed, Oct 28.',
      popSide: 'left'
    },
    {
      date: '28',
      dow: 'Wed',
      longDate: 'Wed, Oct 28',
      aria: 'Wed, Oct 28: Health & disability, 1h 30m',
      isToday: false,
      isExam: false,
      isOff: false,
      hasSession: true,
      topic: 'Health & disability',
      dur: '1h 30m',
      review: false,
      struck: false,
      canSkip: true,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Health & disability · 1h 30m',
      popNote: 'Health & disability moves to Thu, Oct 29.',
      popSide: 'left'
    },
    {
      date: '29',
      dow: 'Thu',
      longDate: 'Thu, Oct 29',
      aria: 'Thu, Oct 29: Taxation, 1h 30m, plus spaced review',
      isToday: false,
      isExam: false,
      isOff: false,
      hasSession: true,
      topic: 'Taxation',
      dur: '1h 30m',
      review: true,
      struck: false,
      canSkip: true,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Taxation · 1h 30m',
      popNote: 'Taxation moves to Fri, Oct 30.',
      popSide: 'right'
    },
    {
      date: '30',
      dow: 'Fri',
      longDate: 'Fri, Oct 30',
      aria: 'Fri, Oct 30: Federal rules, 1h 30m',
      isToday: false,
      isExam: false,
      isOff: false,
      hasSession: true,
      topic: 'Federal rules',
      dur: '1h 30m',
      review: false,
      struck: false,
      canSkip: true,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Federal rules · 1h 30m',
      popNote: 'Federal rules moves to Mon, Nov 2.',
      popSide: 'right'
    },
    {
      date: '31',
      dow: 'Sat',
      longDate: 'Sat, Oct 31',
      aria: 'Sat, Oct 31: day off',
      isToday: false,
      isExam: false,
      isOff: true,
      hasSession: false,
      topic: '',
      dur: '',
      review: false,
      struck: true,
      canSkip: false,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Nothing planned.',
      popNote: 'Mark it off so nothing moves here.',
      popSide: 'right'
    },
    {
      date: 'Nov 1',
      dow: 'Sun',
      longDate: 'Sun, Nov 1',
      aria: 'Sun, Nov 1: day off',
      isToday: false,
      isExam: false,
      isOff: true,
      hasSession: false,
      topic: '',
      dur: '',
      review: false,
      struck: true,
      canSkip: false,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Nothing planned.',
      popNote: 'Mark it off so nothing moves here.',
      popSide: 'left'
    },
    {
      date: '2',
      dow: 'Mon',
      longDate: 'Mon, Nov 2',
      aria: 'Mon, Nov 2: Riders, 1h 30m',
      isToday: false,
      isExam: false,
      isOff: false,
      hasSession: true,
      topic: 'Riders',
      dur: '1h 30m',
      review: false,
      struck: false,
      canSkip: true,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Riders · 1h 30m',
      popNote: 'Riders moves to Tue, Nov 3.',
      popSide: 'left'
    },
    {
      date: '3',
      dow: 'Tue',
      longDate: 'Tue, Nov 3',
      aria: 'Tue, Nov 3: Policy provisions, 1h 30m',
      isToday: false,
      isExam: false,
      isOff: false,
      hasSession: true,
      topic: 'Policy provisions',
      dur: '1h 30m',
      review: false,
      struck: false,
      canSkip: true,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Policy provisions · 1h 30m',
      popNote: 'Policy provisions moves to Wed, Nov 4.',
      popSide: 'left'
    },
    {
      date: '4',
      dow: 'Wed',
      longDate: 'Wed, Nov 4',
      aria: 'Wed, Nov 4: Annuities, 1h 30m, plus spaced review',
      isToday: false,
      isExam: false,
      isOff: false,
      hasSession: true,
      topic: 'Annuities',
      dur: '1h 30m',
      review: true,
      struck: false,
      canSkip: true,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Annuities · 1h 30m',
      popNote: 'Annuities moves to Thu, Nov 5.',
      popSide: 'left'
    },
    {
      date: '5',
      dow: 'Thu',
      longDate: 'Thu, Nov 5',
      aria: 'Thu, Nov 5: Health & disability, 1h 30m',
      isToday: false,
      isExam: false,
      isOff: false,
      hasSession: true,
      topic: 'Health & disability',
      dur: '1h 30m',
      review: false,
      struck: false,
      canSkip: true,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Health & disability · 1h 30m',
      popNote: 'Health & disability moves to Fri, Nov 6.',
      popSide: 'right'
    },
    {
      date: '6',
      dow: 'Fri',
      longDate: 'Fri, Nov 6',
      aria: 'Fri, Nov 6: Taxation, 1h 30m',
      isToday: false,
      isExam: false,
      isOff: false,
      hasSession: true,
      topic: 'Taxation',
      dur: '1h 30m',
      review: false,
      struck: false,
      canSkip: true,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Taxation · 1h 30m',
      popNote: 'Taxation moves to Mon, Nov 9.',
      popSide: 'right'
    },
    {
      date: '7',
      dow: 'Sat',
      longDate: 'Sat, Nov 7',
      aria: 'Sat, Nov 7: day off',
      isToday: false,
      isExam: false,
      isOff: true,
      hasSession: false,
      topic: '',
      dur: '',
      review: false,
      struck: true,
      canSkip: false,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Nothing planned.',
      popNote: 'Mark it off so nothing moves here.',
      popSide: 'right'
    },
    {
      date: '8',
      dow: 'Sun',
      longDate: 'Sun, Nov 8',
      aria: 'Sun, Nov 8: day off',
      isToday: false,
      isExam: false,
      isOff: true,
      hasSession: false,
      topic: '',
      dur: '',
      review: false,
      struck: true,
      canSkip: false,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Nothing planned.',
      popNote: 'Mark it off so nothing moves here.',
      popSide: 'left'
    },
    {
      date: '9',
      dow: 'Mon',
      longDate: 'Mon, Nov 9',
      aria: 'Mon, Nov 9: Federal rules, 1h 30m',
      isToday: false,
      isExam: false,
      isOff: false,
      hasSession: true,
      topic: 'Federal rules',
      dur: '1h 30m',
      review: false,
      struck: false,
      canSkip: true,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Federal rules · 1h 30m',
      popNote: 'Federal rules moves to Tue, Nov 10.',
      popSide: 'left'
    },
    {
      date: '10',
      dow: 'Tue',
      longDate: 'Tue, Nov 10',
      aria: 'Tue, Nov 10: Riders, 1h 30m, plus spaced review',
      isToday: false,
      isExam: false,
      isOff: false,
      hasSession: true,
      topic: 'Riders',
      dur: '1h 30m',
      review: true,
      struck: false,
      canSkip: true,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Riders · 1h 30m',
      popNote: 'Riders moves to Wed, Nov 11.',
      popSide: 'left'
    },
    {
      date: '11',
      dow: 'Wed',
      longDate: 'Wed, Nov 11',
      aria: 'Wed, Nov 11: Policy provisions, 1h 30m',
      isToday: false,
      isExam: false,
      isOff: false,
      hasSession: true,
      topic: 'Policy provisions',
      dur: '1h 30m',
      review: false,
      struck: false,
      canSkip: true,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Policy provisions · 1h 30m',
      popNote: 'Policy provisions moves to Thu, Nov 12.',
      popSide: 'left'
    },
    {
      date: '12',
      dow: 'Thu',
      longDate: 'Thu, Nov 12',
      aria: 'Thu, Nov 12',
      isToday: false,
      isExam: false,
      isOff: false,
      hasSession: false,
      topic: '',
      dur: '',
      review: false,
      struck: false,
      canSkip: false,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Nothing planned.',
      popNote: 'Mark it off so nothing moves here.',
      popSide: 'right'
    },
    {
      date: '13',
      dow: 'Fri',
      longDate: 'Fri, Nov 13',
      aria: 'Fri, Nov 13',
      isToday: false,
      isExam: false,
      isOff: false,
      hasSession: false,
      topic: '',
      dur: '',
      review: false,
      struck: false,
      canSkip: false,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Nothing planned.',
      popNote: 'Mark it off so nothing moves here.',
      popSide: 'right'
    },
    {
      date: '14',
      dow: 'Sat',
      longDate: 'Sat, Nov 14',
      aria: 'Sat, Nov 14',
      isToday: false,
      isExam: false,
      isOff: false,
      hasSession: false,
      topic: '',
      dur: '',
      review: false,
      struck: false,
      canSkip: false,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Nothing planned.',
      popNote: 'Mark it off so nothing moves here.',
      popSide: 'right'
    },
    {
      date: '15',
      dow: 'Sun',
      longDate: 'Sun, Nov 15',
      aria: 'Sun, Nov 15',
      isToday: false,
      isExam: false,
      isOff: false,
      hasSession: false,
      topic: '',
      dur: '',
      review: false,
      struck: false,
      canSkip: false,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Nothing planned.',
      popNote: 'Mark it off so nothing moves here.',
      popSide: 'left'
    },
    {
      date: '16',
      dow: 'Mon',
      longDate: 'Mon, Nov 16',
      aria: 'Mon, Nov 16',
      isToday: false,
      isExam: false,
      isOff: false,
      hasSession: false,
      topic: '',
      dur: '',
      review: false,
      struck: false,
      canSkip: false,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Nothing planned.',
      popNote: 'Mark it off so nothing moves here.',
      popSide: 'left'
    },
    {
      date: '17',
      dow: 'Tue',
      longDate: 'Tue, Nov 17',
      aria: 'Tue, Nov 17',
      isToday: false,
      isExam: false,
      isOff: false,
      hasSession: false,
      topic: '',
      dur: '',
      review: false,
      struck: false,
      canSkip: false,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Nothing planned.',
      popNote: 'Mark it off so nothing moves here.',
      popSide: 'left'
    },
    {
      date: '18',
      dow: 'Wed',
      longDate: 'Wed, Nov 18',
      aria: 'Wed, Nov 18',
      isToday: false,
      isExam: false,
      isOff: false,
      hasSession: false,
      topic: '',
      dur: '',
      review: false,
      struck: false,
      canSkip: false,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Nothing planned.',
      popNote: 'Mark it off so nothing moves here.',
      popSide: 'left'
    },
    {
      date: '19',
      dow: 'Thu',
      longDate: 'Thu, Nov 19',
      aria: 'Thu, Nov 19',
      isToday: false,
      isExam: false,
      isOff: false,
      hasSession: false,
      topic: '',
      dur: '',
      review: false,
      struck: false,
      canSkip: false,
      disabled: false,
      popTitle: 'I can’t study this day',
      popSub: 'Nothing planned.',
      popNote: 'Mark it off so nothing moves here.',
      popSide: 'right'
    },
    {
      date: '20',
      dow: 'Fri',
      longDate: 'Fri, Nov 20',
      aria: 'Fri, Nov 20, exam day',
      isToday: false,
      isExam: true,
      isOff: false,
      hasSession: false,
      topic: '',
      dur: '',
      review: false,
      struck: false,
      canSkip: false,
      disabled: true,
      popTitle: 'I can’t study this day',
      popSub: 'Nothing planned.',
      popNote: 'Mark it off so nothing moves here.',
      popSide: 'right'
    },
    {
      date: '21',
      dow: 'Sat',
      longDate: 'Sat, Nov 21',
      aria: 'Sat, Nov 21',
      isToday: false,
      isExam: false,
      isOff: false,
      hasSession: false,
      topic: '',
      dur: '',
      review: false,
      struck: false,
      canSkip: false,
      disabled: true,
      popTitle: 'I can’t study this day',
      popSub: 'Nothing planned.',
      popNote: 'Mark it off so nothing moves here.',
      popSide: 'right'
    }
  ],
  paces: [
    {
      name: 'Accelerated',
      suggested: false,
      total: '12h 30m',
      perDay: '2h 30m',
      finish: 'Finishes Oct 22',
      finishTone: 'green',
      late: false
    },
    {
      name: 'Steady',
      suggested: true,
      total: '7h 30m',
      perDay: '1h 30m',
      finish: 'Finishes Nov 11',
      finishTone: 'green',
      late: false
    },
    {
      name: 'Relaxed',
      suggested: false,
      total: '5h',
      perDay: '1h',
      finish: 'Won’t finish before your exam',
      finishTone: 'conf-low-ink',
      late: true
    }
  ],
  sliders: [
    {
      label: 'Sun',
      value: 0,
      text: '0m'
    },
    {
      label: 'Mon',
      value: 90,
      text: '1h 30m'
    },
    {
      label: 'Tue',
      value: 90,
      text: '1h 30m'
    },
    {
      label: 'Wed',
      value: 90,
      text: '1h 30m'
    },
    {
      label: 'Thu',
      value: 90,
      text: '1h 30m'
    },
    {
      label: 'Fri',
      value: 90,
      text: '1h 30m'
    },
    {
      label: 'Sat',
      value: 0,
      text: '0m'
    }
  ]
}

/** His Study planner prose, transcribed from the rendered page. */
export const JEFF_MVP_PLANNER_COPY = {
  title: 'Study planner',
  course: 'Florida Life and Health Pre-licensing',
  lead: 'Set your exam date and how much you can study each week. Your plan rebuilds itself when life gets in the way.',

  goalLabel: 'Goal date (your exam)',
  daysAwaySuffix: 'days away',
  paceLabel: 'Your pace',
  weekSuffix: 'a week',
  finishLabel: 'Course finishes',
  changePace: 'Change pace',
  donePace: 'Done',

  pickPace: 'Pick a pace',
  suggested: 'Suggested',
  perDaySuffix: 'on study days',
  spreadNote: 'Spread it across your week · weekends can be different from weekdays',

  skipHint: 'Can’t study on a day? Point at it and choose Skip, or pick several days.',
  pickSeveral: 'Pick several days…',
  skip: 'Skip',
  today: 'Today',
  off: 'Off',
  /* Its own line in the cell, with an amber rule — not a tint on the
     session above it. */
  spacedReview: 'Spaced review',
  /* Drawn INSIDE the exam-day cell, which is dark — hence white text. */
  examDay: 'Exam day',

  /**
   * ⚠ THE "DAY OFF" SWATCH IS A STRUCK-THROUGH SAMPLE DATE, not a colour
   * chip — his legend literally renders the numeral 14 with a line through
   * it, because that is what a day off looks like in the grid above. The
   * other three ARE chips: a 2×14 bar for a session, the same in amber for a
   * spaced review, and a 12px ink square for exam day. Four entries, three
   * different shapes, and the odd one is the one that teaches the gesture.
   */
  legendSample: '14',
  legend: [
    { kind: 'bar', label: 'Study session', tone: 'steel-deep' },
    { kind: 'bar', label: 'Spaced review', tone: 'amber' },
    { kind: 'struck', label: 'Day off', tone: 'muted' },
    { kind: 'square', label: 'Exam day', tone: 'ink' },
  ],
} as const
