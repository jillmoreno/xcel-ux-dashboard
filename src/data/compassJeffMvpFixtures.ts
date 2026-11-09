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
  { page: 'overview', label: 'Overview', ported: false },
  { page: 'learn', label: 'Learn', ported: false },
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
      chevLabel: 'Collapse Annuities sub-topics'
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
      chevLabel: 'Expand Policy Provisions sub-topics'
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
      chevLabel: 'Expand Insurance Regulation sub-topics'
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
      chevLabel: 'Expand Health Insurance sub-topics'
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
      chevLabel: 'Expand Life Insurance sub-topics'
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
