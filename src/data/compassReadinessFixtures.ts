/**
 * THE READINESS PROTOTYPE — 2026-11-05, from
 * `Compass-Overview-Prototype-V2_2.html` (Oct 30).
 *
 * Sixteen states of the Compass Overview across a learner's whole journey, in
 * three series:
 *
 *   q1–q8  the QE course. ⚠ READINESS DOES NOT EXIST until q8 — it appears
 *          only once the certificate is earned, which is the prototype's
 *          first argument.
 *   p1–p3  "Your exam prep": the page after the course, where Readiness IS
 *          the page. Establishing → 58% Developing → 86% Ready.
 *   u1–u5  "Your learning journey": the UNIFIED answer, where lessons and
 *          practice run side by side and Readiness is a second signal
 *          alongside course progress.
 *
 * ⚠ p AND u ARE TWO ANSWERS TO ONE QUESTION — whether Readiness is a phase
 * that starts after the course, or a signal that runs beside it. Both are
 * ported, behind one control, because choosing between them is the decision
 * the prototype exists to support. Neither is "the" design yet.
 *
 * ⚠ EVALUATED OUT OF HIS CODE, NOT RETYPED. Each stage below is his
 * `renderVals()` for that stage, run and serialised — sixteen complete page
 * models, with his copy, his numbers and his ring geometry intact. Retyping
 * them would be thousands of lines of judgement calls about what "about
 * right" means.
 *
 * ⚠ HIS HEXES BECAME TONE NAMES (`ink`, `steel`, `amber`, `green`, `rubi`,
 * `violet`, `hairline`…). The palette is Anjani's Compass system — the same
 * one `compassWorkspace.css` already maps onto this repo's tokens — so the
 * stylesheet resolves a tone once and nothing here carries a raw colour.
 *
 * ⚠ RE-EXTRACT, DO NOT HAND-EDIT. The extraction script is in the
 * `port-prototype` skill's step 2. A fixture edited to make something look
 * right is a diff against the port's own opinion.
 *
 * ⚠ THE EXPORT NEEDS ITS `support.js`, which did not come with the download;
 * it was read with the runtime from `compass-prototype-b-v3.html`. Ask for
 * the sibling file before re-extracting.
 */

/** The sixteen stages, in the order his picker lists them. */
export const READINESS_STAGES = [
  { key: 'q1', label: 'First-time learner · 0%', series: 'course' },
  { key: 'q2', label: 'QE 20% · Continue your course', series: 'course' },
  { key: 'q3', label: 'QE 50% · Continue your course', series: 'course' },
  { key: 'q4', label: 'QE 80% · You’re almost there', series: 'course' },
  { key: 'q5', label: 'Lessons complete · affidavit next', series: 'course' },
  { key: 'q6', label: 'Final course exam open', series: 'course' },
  { key: 'q7', label: 'Survey and certificate next', series: 'course' },
  { key: 'q8', label: 'QE complete · Readiness appears', series: 'course' },
  { key: 'p1', label: 'Establishing Readiness', series: 'prep' },
  { key: 'p2', label: 'Readiness 58% · exam preparation', series: 'prep' },
  { key: 'p3', label: 'Readiness 86% · Ready to pass', series: 'prep' },
  { key: 'u1', label: 'Starting · not enough data', series: 'journey' },
  { key: 'u2', label: 'Course 36% · building Readiness', series: 'journey' },
  { key: 'u3', label: 'Course 61% · Readiness 62%', series: 'journey' },
  { key: 'u4', label: 'Course complete · Readiness 80%', series: 'journey' },
  { key: 'u5', label: 'Simulator passed · Ready to pass', series: 'journey' },
] as const

export type ReadinessStageKey = (typeof READINESS_STAGES)[number]['key']

/** One stage of the JOURNEY page ("Your learning journey") — his `JOverview`. */
export type JourneyStage = Record<string, unknown>
/** One stage of the PREP page ("Your exam prep") — his `JOverviewPrep`. */
export type PrepStage = Record<string, unknown>

export const JOURNEY_STAGES: Record<string, JourneyStage> = {
  q1: {
    hello: "Welcome, Jordan",
    phase: "QE · Lessons",
    pathway: "Regulated · sequential",
    hasBanner: false,
    banner: {
      border: "steel-edge",
      bg: "steel-wash",
      color: "steel-deep",
      eyebrow: "How your course works",
      items: [
        { n: "1", text: "Finish 36 lessons in order. Your progress shows here." },
        { n: "2", text: "Sign the affidavit, pass the final course exam, then the survey issues your certificate." },
        { n: "3", text: "Exam Prep and your exam Readiness open after the certificate." }
      ]
    },
    comboProg: true,
    comboProgLeft: true,
    comboReadyLeft: false,
    showFocusCard: false,
    hasTabs: false,
    tabs: [],
    stdTable: true,
    prepTable: false,
    prows: [],
    uLayout: false,
    uReady: { has: false, none: true, p: 0, s: -1 },
    uPath: [],
    uBasis: "",
    hero: {
      border: "steel-edge",
      bg: "steel-wash",
      color: "steel-deep",
      done: false,
      eyebrow: "Step 1 of 4 · Lessons",
      title: "Start your QE course",
      sub: "You’re starting the education Florida requires before the state exam.",
      nextLabel: "Your next step · Tonight, Mon Jun 8",
      next: "Lesson 1: What life insurance does",
      meta: "1h 40m · insurable interest · how a policy pays",
      cta: "Start lesson",
      ctaBg: "steel-deep",
      alt: "Set my study pace"
    },
    showProgFull: false,
    showProgCompact: false,
    compactLines: [],
    compactLink: "View certificate",
    prog: {
      flex: "1 1 100%",
      pct: "0%",
      ringLab: "Lessons",
      lessonsVal: "0 of 36 lessons",
      lPct: "0%",
      hasSeat: false,
      seat: "0h of 60h required",
      note: "Your 6-week goal: about 10 hours a week. Estimated completion Jul 18.",
      hasSteps: false,
      steps: [
        {
          label: "Lessons",
          status: "Not started",
          detail: "0 of 36 lessons",
          dot: { weight: 0, tone: "steel-deep", size: 20 },
          mark: "1",
          fill: { tone: "steel-deep" },
          color: "ink",
          stColor: "steel-deep"
        },
        {
          label: "Affidavit",
          status: "Opens after lessons",
          detail: "Required before the final course exam",
          dot: { weight: 0, size: 20 },
          mark: "2",
          fill: {},
          color: "muted",
          stColor: "muted"
        },
        {
          label: "Final course exam",
          status: "Opens after the affidavit",
          detail: "Covers all five topics",
          dot: { weight: 0, size: 20 },
          mark: "3",
          fill: {},
          color: "muted",
          stColor: "muted"
        },
        {
          label: "Survey & certificate",
          status: "After you pass",
          detail: "Your certificate issues here",
          dot: { weight: 0, size: 20 },
          mark: "4",
          fill: {},
          color: "muted",
          stColor: "muted"
        }
      ],
      aria: "QE course 0% complete",
      dash: "0.0 314.2",
      ringColor: "steel",
      cap: "butt"
    },
    showReady: false,
    ready: {
      flex: "1 1 380px",
      border: "hairline",
      bg: "white",
      isNew: false,
      isNone: true,
      isActive: false,
      noneSub: "",
      evidence: [],
      score: "",
      word: "",
      color: "",
      toReady: "",
      segs: [],
      marker: "",
      note: ""
    },
    focus: {
      label: "Rubi · your study partner",
      title: "Ask me anything, any time",
      why: "I’m grounded in your Florida course. I can explain a term, give an example, or recap a lesson in two minutes.",
      cta: "Ask Rubi"
    },
    showTools: false,
    toolsTitle: "Continue preparing",
    tools: [],
    tableTitle: "Your lessons by topic",
    tableNote: "Lessons open in order",
    colLessons: true,
    colReady: false,
    gate: "Lessons open in order. Exam Prep and Readiness open after your certificate. Nothing on this page grades you during the course.",
    nav: [
      {
        head: false,
        item: true,
        label: "Overview",
        rule: "steel-deep",
        weight: 600,
        color: "steel-deep",
        hasTag: false,
        tag: "",
        tagColor: ""
      },
      {
        head: false,
        item: true,
        label: "Learn",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: true,
        tag: "Lesson 1",
        tagColor: "steel-deep"
      },
      {
        head: false,
        item: true,
        label: "Study planner",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: false,
        tag: "",
        tagColor: ""
      },
      {
        head: false,
        item: true,
        label: "Ask Rubi",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: false,
        tag: "",
        tagColor: ""
      },
      { head: true, item: false, label: "Exam prep" },
      {
        head: false,
        item: true,
        label: "Practice questions",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: true,
        tag: "After certificate",
        tagColor: "muted"
      },
      {
        head: false,
        item: true,
        label: "Flashcards",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: true,
        tag: "After certificate",
        tagColor: "muted"
      },
      {
        head: false,
        item: true,
        label: "Exam Simulator",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: true,
        tag: "After certificate",
        tagColor: "muted"
      }
    ],
    metaLine: "Lesson 1 of 36 · access ends Jul 31",
    summary: "0 of 5 topics started · Life Insurance first",
    rows: [
      {
        name: "Life Insurance",
        weight: "8 lessons",
        nameColor: "body",
        lessons: "0 of 8",
        lColor: "muted",
        lPct: "0%",
        lBar: "steel",
        hasBand: false,
        noBand: true,
        bNote: "Not enough data yet",
        segs: [],
        bWord: "",
        bColor: "",
        score: "",
        act: "Start",
        isPrimary: true,
        isLink: false,
        isText: false,
        aColor: "steel-deep",
        expanded: false,
        subs: [],
        chev: "▸",
        lessonList: [
          {
            label: "Lesson 1: What life insurance does",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 2",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 3",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 4",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 5",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 6",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 7",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 8: Owners, insureds and beneficiaries",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          }
        ],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Policy Provisions",
        weight: "8 lessons",
        nameColor: "body",
        lessons: "0 of 8",
        lColor: "muted",
        lPct: "0%",
        lBar: "steel",
        hasBand: false,
        noBand: true,
        bNote: "Not enough data yet",
        segs: [],
        bWord: "",
        bColor: "",
        score: "",
        act: "—",
        isPrimary: false,
        isLink: false,
        isText: true,
        aColor: "steel-deep",
        expanded: false,
        subs: [],
        chev: "▸",
        lessonList: [
          {
            label: "Lesson 9",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 10",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 11",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 12",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 13",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 14",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 15",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 16",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          }
        ],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Annuities",
        weight: "7 lessons",
        nameColor: "body",
        lessons: "0 of 7",
        lColor: "muted",
        lPct: "0%",
        lBar: "steel",
        hasBand: false,
        noBand: true,
        bNote: "Not enough data yet",
        segs: [],
        bWord: "",
        bColor: "",
        score: "",
        act: "—",
        isPrimary: false,
        isLink: false,
        isText: true,
        aColor: "steel-deep",
        expanded: false,
        subs: [],
        chev: "▸",
        lessonList: [
          {
            label: "Lesson 17",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 18",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 19: How annuities are funded",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 20",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 21",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 22",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 23",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          }
        ],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Health Insurance",
        weight: "7 lessons",
        nameColor: "body",
        lessons: "0 of 7",
        lColor: "muted",
        lPct: "0%",
        lBar: "steel",
        hasBand: false,
        noBand: true,
        bNote: "Not enough data yet",
        segs: [],
        bWord: "",
        bColor: "",
        score: "",
        act: "—",
        isPrimary: false,
        isLink: false,
        isText: true,
        aColor: "steel-deep",
        expanded: false,
        subs: [],
        chev: "▸",
        lessonList: [
          {
            label: "Lesson 24",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 25",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 26",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 27",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 28",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 29",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 30: Disability income insurance",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          }
        ],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Insurance Regulation",
        weight: "6 lessons",
        nameColor: "body",
        lessons: "0 of 6",
        lColor: "muted",
        lPct: "0%",
        lBar: "steel",
        hasBand: false,
        noBand: true,
        bNote: "Not enough data yet",
        segs: [],
        bWord: "",
        bColor: "",
        score: "",
        act: "—",
        isPrimary: false,
        isLink: false,
        isText: true,
        aColor: "steel-deep",
        expanded: false,
        subs: [],
        chev: "▸",
        lessonList: [
          {
            label: "Lesson 31",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 32",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 33",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 34",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 35",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 36",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          }
        ],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      }
    ],
    navLocked: true,
    showSignalsRow: false,
    showFocusRow: false,
    stage: "q1"
  },
  q2: {
    hello: "Welcome back, Jordan",
    phase: "QE · Lessons",
    pathway: "Regulated · sequential",
    hasBanner: false,
    banner: {
      border: "steel-edge",
      bg: "steel-wash",
      color: "steel-deep",
      eyebrow: "",
      items: []
    },
    comboProg: true,
    comboProgLeft: true,
    comboReadyLeft: false,
    showFocusCard: false,
    hasTabs: false,
    tabs: [],
    stdTable: true,
    prepTable: false,
    prows: [],
    uLayout: false,
    uReady: { has: false, none: true, p: 0, s: -1 },
    uPath: [],
    uBasis: "",
    hero: {
      border: "steel-edge",
      bg: "steel-wash",
      color: "steel-deep",
      done: false,
      eyebrow: "Step 1 of 4 · Lessons",
      title: "Continue your QE course",
      sub: "You’re making progress toward completing your required education.",
      nextLabel: "Your next step · Tonight, Tue Jun 16",
      next: "Lesson 8: Owners, insureds and beneficiaries",
      meta: "1h 40m · on pace for Jul 15",
      cta: "Resume lesson",
      ctaBg: "steel-deep",
      alt: "Can’t study tonight"
    },
    showProgFull: false,
    showProgCompact: false,
    compactLines: [],
    compactLink: "View certificate",
    prog: {
      flex: "1 1 100%",
      pct: "19%",
      ringLab: "Lessons",
      lessonsVal: "7 of 36 lessons",
      lPct: "19%",
      hasSeat: false,
      seat: "12h of 60h required",
      note: "On pace · 6 lessons this week.",
      hasSteps: false,
      steps: [
        {
          label: "Lessons",
          status: "In progress",
          detail: "7 of 36 lessons",
          dot: { weight: 0, tone: "steel-deep", size: 20 },
          mark: "1",
          fill: { tone: "steel-deep" },
          color: "ink",
          stColor: "steel-deep"
        },
        {
          label: "Affidavit",
          status: "Opens after lessons",
          detail: "Required before the final course exam",
          dot: { weight: 0, size: 20 },
          mark: "2",
          fill: {},
          color: "muted",
          stColor: "muted"
        },
        {
          label: "Final course exam",
          status: "Opens after the affidavit",
          detail: "Covers all five topics",
          dot: { weight: 0, size: 20 },
          mark: "3",
          fill: {},
          color: "muted",
          stColor: "muted"
        },
        {
          label: "Survey & certificate",
          status: "After you pass",
          detail: "Your certificate issues here",
          dot: { weight: 0, size: 20 },
          mark: "4",
          fill: {},
          color: "muted",
          stColor: "muted"
        }
      ],
      aria: "QE course 19% complete",
      dash: "61.1 314.2",
      ringColor: "steel",
      cap: "round"
    },
    showReady: false,
    ready: {
      flex: "1 1 380px",
      border: "hairline",
      bg: "white",
      isNew: false,
      isNone: true,
      isActive: false,
      noneSub: "",
      evidence: [],
      score: "",
      word: "",
      color: "",
      toReady: "",
      segs: [],
      marker: "",
      note: ""
    },
    focus: {
      label: "Rubi · optional",
      title: "Recap beneficiary terms",
      why: "Beneficiary designations come back in Policy Provisions and Annuities. A two-minute recap now could save time later.",
      cta: "Recap with Rubi · 2 min"
    },
    showTools: false,
    toolsTitle: "Continue preparing",
    tools: [],
    tableTitle: "Your lessons by topic",
    tableNote: "Lessons open in order",
    colLessons: true,
    colReady: false,
    gate: "Lessons open in order. Exam Prep and Readiness open after your certificate. Nothing on this page grades you during the course.",
    nav: [
      {
        head: false,
        item: true,
        label: "Overview",
        rule: "steel-deep",
        weight: 600,
        color: "steel-deep",
        hasTag: false,
        tag: "",
        tagColor: ""
      },
      {
        head: false,
        item: true,
        label: "Learn",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: true,
        tag: "Lesson 8",
        tagColor: "steel-deep"
      },
      {
        head: false,
        item: true,
        label: "Study planner",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: false,
        tag: "",
        tagColor: ""
      },
      {
        head: false,
        item: true,
        label: "Ask Rubi",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: false,
        tag: "",
        tagColor: ""
      },
      { head: true, item: false, label: "Exam prep" },
      {
        head: false,
        item: true,
        label: "Practice questions",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: true,
        tag: "After certificate",
        tagColor: "muted"
      },
      {
        head: false,
        item: true,
        label: "Flashcards",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: true,
        tag: "After certificate",
        tagColor: "muted"
      },
      {
        head: false,
        item: true,
        label: "Exam Simulator",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: true,
        tag: "After certificate",
        tagColor: "muted"
      }
    ],
    metaLine: "Lesson 8 of 36 · access ends Jul 31",
    summary: "1 of 5 topics in progress",
    rows: [
      {
        name: "Life Insurance",
        weight: "8 lessons",
        nameColor: "ink",
        lessons: "7 of 8 · in progress",
        lColor: "steel-deep",
        lPct: "88%",
        lBar: "steel",
        hasBand: false,
        noBand: true,
        bNote: "Not enough data yet",
        segs: [],
        bWord: "",
        bColor: "",
        score: "",
        act: "Resume",
        isPrimary: true,
        isLink: false,
        isText: false,
        aColor: "steel-deep",
        expanded: false,
        subs: [],
        chev: "▸",
        lessonList: [
          {
            label: "Lesson 1: What life insurance does",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 2",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 3",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 4",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 5",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 6",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 7",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 8: Owners, insureds and beneficiaries",
            status: "In progress",
            color: "steel-deep",
            dot: { weight: 0, tone: "steel-deep", size: 8 }
          }
        ],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Policy Provisions",
        weight: "8 lessons",
        nameColor: "body",
        lessons: "0 of 8",
        lColor: "muted",
        lPct: "0%",
        lBar: "steel",
        hasBand: false,
        noBand: true,
        bNote: "Not enough data yet",
        segs: [],
        bWord: "",
        bColor: "",
        score: "",
        act: "—",
        isPrimary: false,
        isLink: false,
        isText: true,
        aColor: "steel-deep",
        expanded: false,
        subs: [],
        chev: "▸",
        lessonList: [
          {
            label: "Lesson 9",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 10",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 11",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 12",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 13",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 14",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 15",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 16",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          }
        ],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Annuities",
        weight: "7 lessons",
        nameColor: "body",
        lessons: "0 of 7",
        lColor: "muted",
        lPct: "0%",
        lBar: "steel",
        hasBand: false,
        noBand: true,
        bNote: "Not enough data yet",
        segs: [],
        bWord: "",
        bColor: "",
        score: "",
        act: "—",
        isPrimary: false,
        isLink: false,
        isText: true,
        aColor: "steel-deep",
        expanded: false,
        subs: [],
        chev: "▸",
        lessonList: [
          {
            label: "Lesson 17",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 18",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 19: How annuities are funded",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 20",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 21",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 22",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 23",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          }
        ],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Health Insurance",
        weight: "7 lessons",
        nameColor: "body",
        lessons: "0 of 7",
        lColor: "muted",
        lPct: "0%",
        lBar: "steel",
        hasBand: false,
        noBand: true,
        bNote: "Not enough data yet",
        segs: [],
        bWord: "",
        bColor: "",
        score: "",
        act: "—",
        isPrimary: false,
        isLink: false,
        isText: true,
        aColor: "steel-deep",
        expanded: false,
        subs: [],
        chev: "▸",
        lessonList: [
          {
            label: "Lesson 24",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 25",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 26",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 27",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 28",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 29",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 30: Disability income insurance",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          }
        ],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Insurance Regulation",
        weight: "6 lessons",
        nameColor: "body",
        lessons: "0 of 6",
        lColor: "muted",
        lPct: "0%",
        lBar: "steel",
        hasBand: false,
        noBand: true,
        bNote: "Not enough data yet",
        segs: [],
        bWord: "",
        bColor: "",
        score: "",
        act: "—",
        isPrimary: false,
        isLink: false,
        isText: true,
        aColor: "steel-deep",
        expanded: false,
        subs: [],
        chev: "▸",
        lessonList: [
          {
            label: "Lesson 31",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 32",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 33",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 34",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 35",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 36",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          }
        ],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      }
    ],
    navLocked: true,
    showSignalsRow: false,
    showFocusRow: false,
    stage: "q2"
  },
  q3: {
    hello: "Welcome back, Jordan",
    phase: "QE · Lessons",
    pathway: "Regulated · sequential",
    hasBanner: false,
    banner: {
      border: "steel-edge",
      bg: "steel-wash",
      color: "steel-deep",
      eyebrow: "",
      items: []
    },
    comboProg: true,
    comboProgLeft: true,
    comboReadyLeft: false,
    showFocusCard: false,
    hasTabs: false,
    tabs: [],
    stdTable: true,
    prepTable: false,
    prows: [],
    uLayout: false,
    uReady: { has: false, none: true, p: 0, s: -1 },
    uPath: [],
    uBasis: "",
    hero: {
      border: "steel-edge",
      bg: "steel-wash",
      color: "steel-deep",
      done: false,
      eyebrow: "Step 1 of 4 · Lessons",
      title: "Continue your QE course",
      sub: "Halfway through your required education.",
      nextLabel: "Your next step · Tonight, Tue Jun 30",
      next: "Lesson 19: How annuities are funded",
      meta: "1h 40m · on pace for Jul 15",
      cta: "Resume lesson",
      ctaBg: "steel-deep",
      alt: "Can’t study tonight"
    },
    showProgFull: false,
    showProgCompact: false,
    compactLines: [],
    compactLink: "View certificate",
    prog: {
      flex: "1 1 100%",
      pct: "50%",
      ringLab: "Lessons",
      lessonsVal: "18 of 36 lessons",
      lPct: "50%",
      hasSeat: false,
      seat: "30h of 60h required",
      note: "On pace · 5 lessons this week.",
      hasSteps: false,
      steps: [
        {
          label: "Lessons",
          status: "In progress",
          detail: "18 of 36 lessons",
          dot: { weight: 0, tone: "steel-deep", size: 20 },
          mark: "1",
          fill: { tone: "steel-deep" },
          color: "ink",
          stColor: "steel-deep"
        },
        {
          label: "Affidavit",
          status: "Opens after lessons",
          detail: "Required before the final course exam",
          dot: { weight: 0, size: 20 },
          mark: "2",
          fill: {},
          color: "muted",
          stColor: "muted"
        },
        {
          label: "Final course exam",
          status: "Opens after the affidavit",
          detail: "Covers all five topics",
          dot: { weight: 0, size: 20 },
          mark: "3",
          fill: {},
          color: "muted",
          stColor: "muted"
        },
        {
          label: "Survey & certificate",
          status: "After you pass",
          detail: "Your certificate issues here",
          dot: { weight: 0, size: 20 },
          mark: "4",
          fill: {},
          color: "muted",
          stColor: "muted"
        }
      ],
      aria: "QE course 50% complete",
      dash: "157.1 314.2",
      ringColor: "steel",
      cap: "round"
    },
    showReady: false,
    ready: {
      flex: "1 1 380px",
      border: "hairline",
      bg: "white",
      isNew: false,
      isNone: true,
      isActive: false,
      noneSub: "",
      evidence: [],
      score: "",
      word: "",
      color: "",
      toReady: "",
      segs: [],
      marker: "",
      note: ""
    },
    focus: {
      label: "Rubi · optional",
      title: "Riders show up again in Annuities",
      why: "You just finished Policy Provisions. A short recap of riders will make the next Annuities lessons easier.",
      cta: "Recap with Rubi · 5 min"
    },
    showTools: false,
    toolsTitle: "Continue preparing",
    tools: [],
    tableTitle: "Your lessons by topic",
    tableNote: "Lessons open in order",
    colLessons: true,
    colReady: false,
    gate: "Lessons open in order. Exam Prep and Readiness open after your certificate. Nothing on this page grades you during the course.",
    nav: [
      {
        head: false,
        item: true,
        label: "Overview",
        rule: "steel-deep",
        weight: 600,
        color: "steel-deep",
        hasTag: false,
        tag: "",
        tagColor: ""
      },
      {
        head: false,
        item: true,
        label: "Learn",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: true,
        tag: "Lesson 19",
        tagColor: "steel-deep"
      },
      {
        head: false,
        item: true,
        label: "Study planner",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: false,
        tag: "",
        tagColor: ""
      },
      {
        head: false,
        item: true,
        label: "Ask Rubi",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: false,
        tag: "",
        tagColor: ""
      },
      { head: true, item: false, label: "Exam prep" },
      {
        head: false,
        item: true,
        label: "Practice questions",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: true,
        tag: "After certificate",
        tagColor: "muted"
      },
      {
        head: false,
        item: true,
        label: "Flashcards",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: true,
        tag: "After certificate",
        tagColor: "muted"
      },
      {
        head: false,
        item: true,
        label: "Exam Simulator",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: true,
        tag: "After certificate",
        tagColor: "muted"
      }
    ],
    metaLine: "Lesson 19 of 36 · access ends Jul 31",
    summary: "2 of 5 topics complete · 1 in progress",
    rows: [
      {
        name: "Life Insurance",
        weight: "8 lessons",
        nameColor: "ink",
        lessons: "8 of 8 · complete",
        lColor: "green",
        lPct: "100%",
        lBar: "green",
        hasBand: false,
        noBand: true,
        bNote: "Not enough data yet",
        segs: [],
        bWord: "",
        bColor: "",
        score: "",
        act: "—",
        isPrimary: false,
        isLink: false,
        isText: true,
        aColor: "steel-deep",
        expanded: false,
        subs: [],
        chev: "▸",
        lessonList: [
          {
            label: "Lesson 1: What life insurance does",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 2",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 3",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 4",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 5",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 6",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 7",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 8: Owners, insureds and beneficiaries",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          }
        ],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Policy Provisions",
        weight: "8 lessons",
        nameColor: "ink",
        lessons: "8 of 8 · complete",
        lColor: "green",
        lPct: "100%",
        lBar: "green",
        hasBand: false,
        noBand: true,
        bNote: "Not enough data yet",
        segs: [],
        bWord: "",
        bColor: "",
        score: "",
        act: "Recap · optional",
        isPrimary: false,
        isLink: true,
        isText: false,
        aColor: "rubi",
        expanded: false,
        subs: [],
        chev: "▸",
        lessonList: [
          {
            label: "Lesson 9",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 10",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 11",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 12",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 13",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 14",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 15",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 16",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          }
        ],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Annuities",
        weight: "7 lessons",
        nameColor: "ink",
        lessons: "2 of 7 · in progress",
        lColor: "steel-deep",
        lPct: "29%",
        lBar: "steel",
        hasBand: false,
        noBand: true,
        bNote: "Not enough data yet",
        segs: [],
        bWord: "",
        bColor: "",
        score: "",
        act: "Resume",
        isPrimary: true,
        isLink: false,
        isText: false,
        aColor: "steel-deep",
        expanded: false,
        subs: [],
        chev: "▸",
        lessonList: [
          {
            label: "Lesson 17",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 18",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 19: How annuities are funded",
            status: "In progress",
            color: "steel-deep",
            dot: { weight: 0, tone: "steel-deep", size: 8 }
          },
          {
            label: "Lesson 20",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 21",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 22",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 23",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          }
        ],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Health Insurance",
        weight: "7 lessons",
        nameColor: "body",
        lessons: "0 of 7",
        lColor: "muted",
        lPct: "0%",
        lBar: "steel",
        hasBand: false,
        noBand: true,
        bNote: "Not enough data yet",
        segs: [],
        bWord: "",
        bColor: "",
        score: "",
        act: "—",
        isPrimary: false,
        isLink: false,
        isText: true,
        aColor: "steel-deep",
        expanded: false,
        subs: [],
        chev: "▸",
        lessonList: [
          {
            label: "Lesson 24",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 25",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 26",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 27",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 28",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 29",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 30: Disability income insurance",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          }
        ],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Insurance Regulation",
        weight: "6 lessons",
        nameColor: "body",
        lessons: "0 of 6",
        lColor: "muted",
        lPct: "0%",
        lBar: "steel",
        hasBand: false,
        noBand: true,
        bNote: "Not enough data yet",
        segs: [],
        bWord: "",
        bColor: "",
        score: "",
        act: "—",
        isPrimary: false,
        isLink: false,
        isText: true,
        aColor: "steel-deep",
        expanded: false,
        subs: [],
        chev: "▸",
        lessonList: [
          {
            label: "Lesson 31",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 32",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 33",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 34",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 35",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 36",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          }
        ],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      }
    ],
    navLocked: true,
    showSignalsRow: false,
    showFocusRow: false,
    stage: "q3"
  },
  q4: {
    hello: "Welcome back, Jordan",
    phase: "QE · Lessons",
    pathway: "Regulated · sequential",
    hasBanner: false,
    banner: {
      border: "steel-edge",
      bg: "steel-wash",
      color: "steel-deep",
      eyebrow: "",
      items: []
    },
    comboProg: true,
    comboProgLeft: true,
    comboReadyLeft: false,
    showFocusCard: false,
    hasTabs: false,
    tabs: [],
    stdTable: true,
    prepTable: false,
    prows: [],
    uLayout: false,
    uReady: { has: false, none: true, p: 0, s: -1 },
    uPath: [],
    uBasis: "",
    hero: {
      border: "steel-edge",
      bg: "steel-wash",
      color: "steel-deep",
      done: false,
      eyebrow: "Almost there · 7 lessons left",
      title: "You’re almost there",
      sub: "Complete your QE course to move into Exam Prep.",
      nextLabel: "Your next step · Tonight, Fri Jul 10",
      next: "Lesson 30: Disability income insurance",
      meta: "1h 40m · ahead of pace for Jul 15",
      cta: "Resume lesson",
      ctaBg: "steel-deep",
      alt: "See what’s left"
    },
    showProgFull: false,
    showProgCompact: false,
    compactLines: [],
    compactLink: "View certificate",
    prog: {
      flex: "1 1 100%",
      pct: "81%",
      ringLab: "Lessons",
      lessonsVal: "29 of 36 lessons",
      lPct: "81%",
      hasSeat: false,
      seat: "48h of 60h required",
      note: "Ahead of pace. After lessons: affidavit, final course exam, survey.",
      hasSteps: false,
      steps: [
        {
          label: "Lessons",
          status: "In progress",
          detail: "29 of 36 lessons",
          dot: { weight: 0, tone: "steel-deep", size: 20 },
          mark: "1",
          fill: { tone: "steel-deep" },
          color: "ink",
          stColor: "steel-deep"
        },
        {
          label: "Affidavit",
          status: "Opens after lessons",
          detail: "Required before the final course exam",
          dot: { weight: 0, size: 20 },
          mark: "2",
          fill: {},
          color: "muted",
          stColor: "muted"
        },
        {
          label: "Final course exam",
          status: "Opens after the affidavit",
          detail: "Covers all five topics",
          dot: { weight: 0, size: 20 },
          mark: "3",
          fill: {},
          color: "muted",
          stColor: "muted"
        },
        {
          label: "Survey & certificate",
          status: "After you pass",
          detail: "Your certificate issues here",
          dot: { weight: 0, size: 20 },
          mark: "4",
          fill: {},
          color: "muted",
          stColor: "muted"
        }
      ],
      aria: "QE course 81% complete",
      dash: "253.1 314.2",
      ringColor: "steel",
      cap: "round"
    },
    showReady: false,
    ready: {
      flex: "1 1 380px",
      border: "hairline",
      bg: "white",
      isNew: false,
      isNone: true,
      isActive: false,
      noneSub: "",
      evidence: [],
      score: "",
      word: "",
      color: "",
      toReady: "",
      segs: [],
      marker: "",
      note: ""
    },
    focus: {
      label: "Rubi · optional",
      title: "Preview what’s left",
      why: "Insurance Regulation is your last topic: 6 shorter lessons on Florida law. I can give you a two-minute map before you start.",
      cta: "Preview with Rubi · 2 min"
    },
    showTools: false,
    toolsTitle: "Continue preparing",
    tools: [],
    tableTitle: "Your lessons by topic",
    tableNote: "Lessons open in order",
    colLessons: true,
    colReady: false,
    gate: "Lessons open in order. Exam Prep and Readiness open after your certificate. Nothing on this page grades you during the course.",
    nav: [
      {
        head: false,
        item: true,
        label: "Overview",
        rule: "steel-deep",
        weight: 600,
        color: "steel-deep",
        hasTag: false,
        tag: "",
        tagColor: ""
      },
      {
        head: false,
        item: true,
        label: "Learn",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: true,
        tag: "Lesson 30",
        tagColor: "steel-deep"
      },
      {
        head: false,
        item: true,
        label: "Study planner",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: false,
        tag: "",
        tagColor: ""
      },
      {
        head: false,
        item: true,
        label: "Ask Rubi",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: false,
        tag: "",
        tagColor: ""
      },
      { head: true, item: false, label: "Exam prep" },
      {
        head: false,
        item: true,
        label: "Practice questions",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: true,
        tag: "After certificate",
        tagColor: "muted"
      },
      {
        head: false,
        item: true,
        label: "Flashcards",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: true,
        tag: "After certificate",
        tagColor: "muted"
      },
      {
        head: false,
        item: true,
        label: "Exam Simulator",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: true,
        tag: "After certificate",
        tagColor: "muted"
      }
    ],
    metaLine: "Lesson 30 of 36 · access ends Jul 31",
    summary: "3 of 5 topics complete · 1 in progress",
    rows: [
      {
        name: "Life Insurance",
        weight: "8 lessons",
        nameColor: "ink",
        lessons: "8 of 8 · complete",
        lColor: "green",
        lPct: "100%",
        lBar: "green",
        hasBand: false,
        noBand: true,
        bNote: "Not enough data yet",
        segs: [],
        bWord: "",
        bColor: "",
        score: "",
        act: "—",
        isPrimary: false,
        isLink: false,
        isText: true,
        aColor: "steel-deep",
        expanded: false,
        subs: [],
        chev: "▸",
        lessonList: [
          {
            label: "Lesson 1: What life insurance does",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 2",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 3",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 4",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 5",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 6",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 7",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 8: Owners, insureds and beneficiaries",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          }
        ],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Policy Provisions",
        weight: "8 lessons",
        nameColor: "ink",
        lessons: "8 of 8 · complete",
        lColor: "green",
        lPct: "100%",
        lBar: "green",
        hasBand: false,
        noBand: true,
        bNote: "Not enough data yet",
        segs: [],
        bWord: "",
        bColor: "",
        score: "",
        act: "—",
        isPrimary: false,
        isLink: false,
        isText: true,
        aColor: "steel-deep",
        expanded: false,
        subs: [],
        chev: "▸",
        lessonList: [
          {
            label: "Lesson 9",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 10",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 11",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 12",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 13",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 14",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 15",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 16",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          }
        ],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Annuities",
        weight: "7 lessons",
        nameColor: "ink",
        lessons: "7 of 7 · complete",
        lColor: "green",
        lPct: "100%",
        lBar: "green",
        hasBand: false,
        noBand: true,
        bNote: "Not enough data yet",
        segs: [],
        bWord: "",
        bColor: "",
        score: "",
        act: "—",
        isPrimary: false,
        isLink: false,
        isText: true,
        aColor: "steel-deep",
        expanded: false,
        subs: [],
        chev: "▸",
        lessonList: [
          {
            label: "Lesson 17",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 18",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 19: How annuities are funded",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 20",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 21",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 22",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 23",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          }
        ],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Health Insurance",
        weight: "7 lessons",
        nameColor: "ink",
        lessons: "6 of 7 · in progress",
        lColor: "steel-deep",
        lPct: "86%",
        lBar: "steel",
        hasBand: false,
        noBand: true,
        bNote: "Not enough data yet",
        segs: [],
        bWord: "",
        bColor: "",
        score: "",
        act: "Resume",
        isPrimary: true,
        isLink: false,
        isText: false,
        aColor: "steel-deep",
        expanded: false,
        subs: [],
        chev: "▸",
        lessonList: [
          {
            label: "Lesson 24",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 25",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 26",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 27",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 28",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 29",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 30: Disability income insurance",
            status: "In progress",
            color: "steel-deep",
            dot: { weight: 0, tone: "steel-deep", size: 8 }
          }
        ],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Insurance Regulation",
        weight: "6 lessons",
        nameColor: "body",
        lessons: "0 of 6",
        lColor: "muted",
        lPct: "0%",
        lBar: "steel",
        hasBand: false,
        noBand: true,
        bNote: "Not enough data yet",
        segs: [],
        bWord: "",
        bColor: "",
        score: "",
        act: "—",
        isPrimary: false,
        isLink: false,
        isText: true,
        aColor: "steel-deep",
        expanded: false,
        subs: [],
        chev: "▸",
        lessonList: [
          {
            label: "Lesson 31",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 32",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 33",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 34",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 35",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 36",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          }
        ],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      }
    ],
    navLocked: true,
    showSignalsRow: false,
    showFocusRow: false,
    stage: "q4"
  },
  q5: {
    hello: "Welcome back, Jordan",
    phase: "QE · Affidavit",
    pathway: "Regulated · sequential",
    hasBanner: false,
    banner: {
      border: "steel-edge",
      bg: "steel-wash",
      color: "steel-deep",
      eyebrow: "",
      items: []
    },
    comboProg: true,
    comboProgLeft: true,
    comboReadyLeft: false,
    showFocusCard: false,
    hasTabs: false,
    tabs: [],
    stdTable: true,
    prepTable: false,
    prows: [],
    uLayout: false,
    uReady: { has: false, none: true, p: 0, s: -1 },
    uPath: [],
    uBasis: "",
    hero: {
      border: "steel-edge",
      bg: "steel-wash",
      color: "steel-deep",
      done: false,
      eyebrow: "Step 2 of 4 · Affidavit",
      title: "You’re almost there",
      sub: "Lessons complete. Three short steps until Exam Prep opens.",
      nextLabel: "Your next step",
      next: "Sign your course affidavit",
      meta: "1 min · confirms you completed the lessons yourself",
      cta: "Sign affidavit",
      ctaBg: "steel-deep",
      alt: "Review lessons"
    },
    showProgFull: false,
    showProgCompact: false,
    compactLines: [],
    compactLink: "View certificate",
    prog: {
      flex: "1 1 100%",
      pct: "100%",
      ringLab: "Lessons",
      lessonsVal: "36 of 36 lessons · complete",
      lPct: "100%",
      hasSeat: false,
      seat: "60h of 60h required ✓",
      note: "Lessons complete Jul 15. Access ends Jul 31.",
      hasSteps: false,
      steps: [
        {
          label: "Lessons",
          status: "Complete Jul 15",
          detail: "36 of 36 lessons",
          dot: { weight: 0, tone: "green", size: 20 },
          mark: "✓",
          fill: { tone: "green" },
          color: "ink",
          stColor: "green"
        },
        {
          label: "Affidavit",
          status: "Ready to sign",
          detail: "Required before the final course exam",
          dot: { weight: 0, tone: "steel-deep", size: 20 },
          mark: "2",
          fill: { tone: "steel-deep" },
          color: "ink",
          stColor: "steel-deep"
        },
        {
          label: "Final course exam",
          status: "Opens after the affidavit",
          detail: "Covers all five topics",
          dot: { weight: 0, size: 20 },
          mark: "3",
          fill: {},
          color: "muted",
          stColor: "muted"
        },
        {
          label: "Survey & certificate",
          status: "After you pass",
          detail: "Your certificate issues here",
          dot: { weight: 0, size: 20 },
          mark: "4",
          fill: {},
          color: "muted",
          stColor: "muted"
        }
      ],
      aria: "QE course 100% complete",
      dash: "314.2 314.2",
      ringColor: "green",
      cap: "butt"
    },
    showReady: false,
    ready: {
      flex: "1 1 380px",
      border: "hairline",
      bg: "white",
      isNew: false,
      isNone: true,
      isActive: false,
      noneSub: "",
      evidence: [],
      score: "",
      word: "",
      color: "",
      toReady: "",
      segs: [],
      marker: "",
      note: ""
    },
    focus: {
      label: "Rubi · next",
      title: "Why the affidavit matters",
      why: "Florida requires you to confirm you completed the course yourself. It takes a minute and opens the final course exam.",
      cta: "Ask Rubi"
    },
    showTools: false,
    toolsTitle: "Continue preparing",
    tools: [],
    tableTitle: "Your lessons by topic",
    tableNote: "All lessons complete · open any to review",
    colLessons: true,
    colReady: false,
    gate: "The affidavit is open because all lessons are complete. The final course exam opens after you sign it.",
    nav: [
      {
        head: false,
        item: true,
        label: "Overview",
        rule: "steel-deep",
        weight: 600,
        color: "steel-deep",
        hasTag: false,
        tag: "",
        tagColor: ""
      },
      {
        head: false,
        item: true,
        label: "Learn",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: true,
        tag: "Complete",
        tagColor: "steel-deep"
      },
      {
        head: false,
        item: true,
        label: "Study planner",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: false,
        tag: "",
        tagColor: ""
      },
      {
        head: false,
        item: true,
        label: "Ask Rubi",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: false,
        tag: "",
        tagColor: ""
      },
      { head: true, item: false, label: "Exam prep" },
      {
        head: false,
        item: true,
        label: "Practice questions",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: true,
        tag: "After certificate",
        tagColor: "muted"
      },
      {
        head: false,
        item: true,
        label: "Flashcards",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: true,
        tag: "After certificate",
        tagColor: "muted"
      },
      {
        head: false,
        item: true,
        label: "Exam Simulator",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: true,
        tag: "After certificate",
        tagColor: "muted"
      }
    ],
    metaLine: "36 of 36 lessons · access ends Jul 31",
    summary: "5 of 5 topics complete",
    rows: [
      {
        name: "Life Insurance",
        weight: "8 lessons",
        nameColor: "ink",
        lessons: "8 of 8 · complete",
        lColor: "green",
        lPct: "100%",
        lBar: "green",
        hasBand: false,
        noBand: true,
        bNote: "Not enough data yet",
        segs: [],
        bWord: "",
        bColor: "",
        score: "",
        act: "—",
        isPrimary: false,
        isLink: false,
        isText: true,
        aColor: "steel-deep",
        expanded: false,
        subs: [],
        chev: "▸",
        lessonList: [
          {
            label: "Lesson 1: What life insurance does",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 2",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 3",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 4",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 5",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 6",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 7",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 8: Owners, insureds and beneficiaries",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          }
        ],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Policy Provisions",
        weight: "8 lessons",
        nameColor: "ink",
        lessons: "8 of 8 · complete",
        lColor: "green",
        lPct: "100%",
        lBar: "green",
        hasBand: false,
        noBand: true,
        bNote: "Not enough data yet",
        segs: [],
        bWord: "",
        bColor: "",
        score: "",
        act: "—",
        isPrimary: false,
        isLink: false,
        isText: true,
        aColor: "steel-deep",
        expanded: false,
        subs: [],
        chev: "▸",
        lessonList: [
          {
            label: "Lesson 9",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 10",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 11",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 12",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 13",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 14",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 15",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 16",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          }
        ],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Annuities",
        weight: "7 lessons",
        nameColor: "ink",
        lessons: "7 of 7 · complete",
        lColor: "green",
        lPct: "100%",
        lBar: "green",
        hasBand: false,
        noBand: true,
        bNote: "Not enough data yet",
        segs: [],
        bWord: "",
        bColor: "",
        score: "",
        act: "—",
        isPrimary: false,
        isLink: false,
        isText: true,
        aColor: "steel-deep",
        expanded: false,
        subs: [],
        chev: "▸",
        lessonList: [
          {
            label: "Lesson 17",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 18",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 19: How annuities are funded",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 20",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 21",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 22",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 23",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          }
        ],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Health Insurance",
        weight: "7 lessons",
        nameColor: "ink",
        lessons: "7 of 7 · complete",
        lColor: "green",
        lPct: "100%",
        lBar: "green",
        hasBand: false,
        noBand: true,
        bNote: "Not enough data yet",
        segs: [],
        bWord: "",
        bColor: "",
        score: "",
        act: "—",
        isPrimary: false,
        isLink: false,
        isText: true,
        aColor: "steel-deep",
        expanded: false,
        subs: [],
        chev: "▸",
        lessonList: [
          {
            label: "Lesson 24",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 25",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 26",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 27",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 28",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 29",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 30: Disability income insurance",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          }
        ],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Insurance Regulation",
        weight: "6 lessons",
        nameColor: "ink",
        lessons: "6 of 6 · complete",
        lColor: "green",
        lPct: "100%",
        lBar: "green",
        hasBand: false,
        noBand: true,
        bNote: "Not enough data yet",
        segs: [],
        bWord: "",
        bColor: "",
        score: "",
        act: "—",
        isPrimary: false,
        isLink: false,
        isText: true,
        aColor: "steel-deep",
        expanded: false,
        subs: [],
        chev: "▸",
        lessonList: [
          {
            label: "Lesson 31",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 32",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 33",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 34",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 35",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 36",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          }
        ],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      }
    ],
    navLocked: true,
    showSignalsRow: false,
    showFocusRow: false,
    stage: "q5"
  },
  q6: {
    hello: "Welcome back, Jordan",
    phase: "QE · Final course exam",
    pathway: "Regulated · sequential",
    hasBanner: false,
    banner: {
      border: "steel-edge",
      bg: "steel-wash",
      color: "steel-deep",
      eyebrow: "",
      items: []
    },
    comboProg: true,
    comboProgLeft: true,
    comboReadyLeft: false,
    showFocusCard: false,
    hasTabs: false,
    tabs: [],
    stdTable: true,
    prepTable: false,
    prows: [],
    uLayout: false,
    uReady: { has: false, none: true, p: 0, s: -1 },
    uPath: [],
    uBasis: "",
    hero: {
      border: "steel-edge",
      bg: "steel-wash",
      color: "steel-deep",
      done: false,
      eyebrow: "Step 3 of 4 · Final course exam",
      title: "You’re almost there",
      sub: "Pass the final course exam to earn your certificate.",
      nextLabel: "Your next step",
      next: "Final course exam",
      meta: "[__] questions · [__] minutes · [pass mark] to pass",
      cta: "Start final course exam",
      ctaBg: "steel-deep",
      alt: "Review lessons first"
    },
    showProgFull: false,
    showProgCompact: false,
    compactLines: [],
    compactLink: "View certificate",
    prog: {
      flex: "1 1 100%",
      pct: "100%",
      ringLab: "Lessons",
      lessonsVal: "36 of 36 lessons · complete",
      lPct: "100%",
      hasSeat: false,
      seat: "60h of 60h required ✓",
      note: "Affidavit signed Jul 16. Take the exam before access ends Jul 31.",
      hasSteps: false,
      steps: [
        {
          label: "Lessons",
          status: "Complete Jul 15",
          detail: "36 of 36 lessons",
          dot: { weight: 0, tone: "green", size: 20 },
          mark: "✓",
          fill: { tone: "green" },
          color: "ink",
          stColor: "green"
        },
        {
          label: "Affidavit",
          status: "Signed Jul 16",
          detail: "Required before the final course exam",
          dot: { weight: 0, tone: "green", size: 20 },
          mark: "✓",
          fill: { tone: "green" },
          color: "ink",
          stColor: "green"
        },
        {
          label: "Final course exam",
          status: "Open now",
          detail: "[__] questions · [pass mark] to pass",
          dot: { weight: 0, tone: "steel-deep", size: 20 },
          mark: "3",
          fill: { tone: "steel-deep" },
          color: "ink",
          stColor: "steel-deep"
        },
        {
          label: "Survey & certificate",
          status: "After you pass",
          detail: "Your certificate issues here",
          dot: { weight: 0, size: 20 },
          mark: "4",
          fill: {},
          color: "muted",
          stColor: "muted"
        }
      ],
      aria: "QE course 100% complete",
      dash: "314.2 314.2",
      ringColor: "green",
      cap: "butt"
    },
    showReady: false,
    ready: {
      flex: "1 1 380px",
      border: "hairline",
      bg: "white",
      isNew: false,
      isNone: true,
      isActive: false,
      noneSub: "",
      evidence: [],
      score: "",
      word: "",
      color: "",
      toReady: "",
      segs: [],
      marker: "",
      note: ""
    },
    focus: {
      label: "Rubi · optional",
      title: "Recap before you start",
      why: "Pick any topic and I’ll give you a five-minute recap of its lessons. Optional; it never blocks the exam.",
      cta: "Recap with Rubi · 5 min"
    },
    showTools: false,
    toolsTitle: "Continue preparing",
    tools: [],
    tableTitle: "Your lessons by topic",
    tableNote: "All lessons complete · recaps are optional",
    colLessons: true,
    colReady: false,
    gate: "The final course exam is open because the affidavit is signed. Recaps are optional and never block it. Your certificate issues after you pass and submit the survey.",
    nav: [
      {
        head: false,
        item: true,
        label: "Overview",
        rule: "steel-deep",
        weight: 600,
        color: "steel-deep",
        hasTag: false,
        tag: "",
        tagColor: ""
      },
      {
        head: false,
        item: true,
        label: "Learn",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: true,
        tag: "Complete",
        tagColor: "steel-deep"
      },
      {
        head: false,
        item: true,
        label: "Study planner",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: false,
        tag: "",
        tagColor: ""
      },
      {
        head: false,
        item: true,
        label: "Ask Rubi",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: false,
        tag: "",
        tagColor: ""
      },
      { head: true, item: false, label: "Exam prep" },
      {
        head: false,
        item: true,
        label: "Practice questions",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: true,
        tag: "After certificate",
        tagColor: "muted"
      },
      {
        head: false,
        item: true,
        label: "Flashcards",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: true,
        tag: "After certificate",
        tagColor: "muted"
      },
      {
        head: false,
        item: true,
        label: "Exam Simulator",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: true,
        tag: "After certificate",
        tagColor: "muted"
      }
    ],
    metaLine: "Affidavit signed Jul 16 · access ends Jul 31",
    summary: "5 of 5 topics complete",
    rows: [
      {
        name: "Life Insurance",
        weight: "8 lessons",
        nameColor: "ink",
        lessons: "8 of 8 · complete",
        lColor: "green",
        lPct: "100%",
        lBar: "green",
        hasBand: false,
        noBand: true,
        bNote: "Not enough data yet",
        segs: [],
        bWord: "",
        bColor: "",
        score: "",
        act: "Recap",
        isPrimary: false,
        isLink: true,
        isText: false,
        aColor: "rubi",
        expanded: false,
        subs: [],
        chev: "▸",
        lessonList: [
          {
            label: "Lesson 1: What life insurance does",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 2",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 3",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 4",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 5",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 6",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 7",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 8: Owners, insureds and beneficiaries",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          }
        ],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Policy Provisions",
        weight: "8 lessons",
        nameColor: "ink",
        lessons: "8 of 8 · complete",
        lColor: "green",
        lPct: "100%",
        lBar: "green",
        hasBand: false,
        noBand: true,
        bNote: "Not enough data yet",
        segs: [],
        bWord: "",
        bColor: "",
        score: "",
        act: "Recap",
        isPrimary: false,
        isLink: true,
        isText: false,
        aColor: "rubi",
        expanded: false,
        subs: [],
        chev: "▸",
        lessonList: [
          {
            label: "Lesson 9",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 10",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 11",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 12",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 13",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 14",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 15",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 16",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          }
        ],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Annuities",
        weight: "7 lessons",
        nameColor: "ink",
        lessons: "7 of 7 · complete",
        lColor: "green",
        lPct: "100%",
        lBar: "green",
        hasBand: false,
        noBand: true,
        bNote: "Not enough data yet",
        segs: [],
        bWord: "",
        bColor: "",
        score: "",
        act: "Recap",
        isPrimary: false,
        isLink: true,
        isText: false,
        aColor: "rubi",
        expanded: false,
        subs: [],
        chev: "▸",
        lessonList: [
          {
            label: "Lesson 17",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 18",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 19: How annuities are funded",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 20",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 21",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 22",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 23",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          }
        ],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Health Insurance",
        weight: "7 lessons",
        nameColor: "ink",
        lessons: "7 of 7 · complete",
        lColor: "green",
        lPct: "100%",
        lBar: "green",
        hasBand: false,
        noBand: true,
        bNote: "Not enough data yet",
        segs: [],
        bWord: "",
        bColor: "",
        score: "",
        act: "Recap",
        isPrimary: false,
        isLink: true,
        isText: false,
        aColor: "rubi",
        expanded: false,
        subs: [],
        chev: "▸",
        lessonList: [
          {
            label: "Lesson 24",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 25",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 26",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 27",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 28",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 29",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 30: Disability income insurance",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          }
        ],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Insurance Regulation",
        weight: "6 lessons",
        nameColor: "ink",
        lessons: "6 of 6 · complete",
        lColor: "green",
        lPct: "100%",
        lBar: "green",
        hasBand: false,
        noBand: true,
        bNote: "Not enough data yet",
        segs: [],
        bWord: "",
        bColor: "",
        score: "",
        act: "Recap",
        isPrimary: false,
        isLink: true,
        isText: false,
        aColor: "rubi",
        expanded: false,
        subs: [],
        chev: "▸",
        lessonList: [
          {
            label: "Lesson 31",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 32",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 33",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 34",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 35",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 36",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          }
        ],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      }
    ],
    navLocked: true,
    showSignalsRow: false,
    showFocusRow: false,
    stage: "q6"
  },
  q7: {
    hello: "Welcome back, Jordan",
    phase: "QE · Survey & certificate",
    pathway: "Regulated · sequential",
    hasBanner: false,
    banner: {
      border: "steel-edge",
      bg: "steel-wash",
      color: "steel-deep",
      eyebrow: "",
      items: []
    },
    comboProg: true,
    comboProgLeft: true,
    comboReadyLeft: false,
    showFocusCard: false,
    hasTabs: false,
    tabs: [],
    stdTable: true,
    prepTable: false,
    prows: [],
    uLayout: false,
    uReady: { has: false, none: true, p: 0, s: -1 },
    uPath: [],
    uBasis: "",
    hero: {
      border: "steel-edge",
      bg: "steel-wash",
      color: "steel-deep",
      done: false,
      eyebrow: "Step 4 of 4 · Survey & certificate",
      title: "You’re almost there",
      sub: "One step left. Submit the survey and your certificate issues.",
      nextLabel: "Your next step",
      next: "Course survey",
      meta: "[__] questions · about [__] min",
      cta: "Start survey",
      ctaBg: "steel-deep",
      alt: "Remind me tomorrow"
    },
    showProgFull: false,
    showProgCompact: false,
    compactLines: [],
    compactLink: "View certificate",
    prog: {
      flex: "1 1 100%",
      pct: "100%",
      ringLab: "Lessons",
      lessonsVal: "36 of 36 lessons · complete",
      lPct: "100%",
      hasSeat: false,
      seat: "60h of 60h required ✓",
      note: "Final course exam passed Jul 18.",
      hasSteps: false,
      steps: [
        {
          label: "Lessons",
          status: "Complete Jul 15",
          detail: "36 of 36 lessons",
          dot: { weight: 0, tone: "green", size: 20 },
          mark: "✓",
          fill: { tone: "green" },
          color: "ink",
          stColor: "green"
        },
        {
          label: "Affidavit",
          status: "Signed Jul 16",
          detail: "Required before the final course exam",
          dot: { weight: 0, tone: "green", size: 20 },
          mark: "✓",
          fill: { tone: "green" },
          color: "ink",
          stColor: "green"
        },
        {
          label: "Final course exam",
          status: "Passed Jul 18",
          detail: "Score [__]",
          dot: { weight: 0, tone: "green", size: 20 },
          mark: "✓",
          fill: { tone: "green" },
          color: "ink",
          stColor: "green"
        },
        {
          label: "Survey & certificate",
          status: "One step left",
          detail: "Certificate issues when you submit",
          dot: { weight: 0, tone: "steel-deep", size: 20 },
          mark: "4",
          fill: { tone: "steel-deep" },
          color: "ink",
          stColor: "steel-deep"
        }
      ],
      aria: "QE course 100% complete",
      dash: "314.2 314.2",
      ringColor: "green",
      cap: "butt"
    },
    showReady: false,
    ready: {
      flex: "1 1 380px",
      border: "hairline",
      bg: "white",
      isNew: false,
      isNone: true,
      isActive: false,
      noneSub: "",
      evidence: [],
      score: "",
      word: "",
      color: "",
      toReady: "",
      segs: [],
      marker: "",
      note: ""
    },
    focus: {
      label: "Rubi · next",
      title: "What happens after the survey",
      why: "Your certificate issues and Exam Prep opens. That’s where your exam Readiness starts.",
      cta: "Ask Rubi"
    },
    showTools: false,
    toolsTitle: "Continue preparing",
    tools: [],
    tableTitle: "Your lessons by topic",
    tableNote: "All lessons complete",
    colLessons: true,
    colReady: false,
    gate: "Your certificate issues when you submit the survey. Exam Prep and Readiness open right after.",
    nav: [
      {
        head: false,
        item: true,
        label: "Overview",
        rule: "steel-deep",
        weight: 600,
        color: "steel-deep",
        hasTag: false,
        tag: "",
        tagColor: ""
      },
      {
        head: false,
        item: true,
        label: "Learn",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: true,
        tag: "Complete",
        tagColor: "steel-deep"
      },
      {
        head: false,
        item: true,
        label: "Study planner",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: false,
        tag: "",
        tagColor: ""
      },
      {
        head: false,
        item: true,
        label: "Ask Rubi",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: false,
        tag: "",
        tagColor: ""
      },
      { head: true, item: false, label: "Exam prep" },
      {
        head: false,
        item: true,
        label: "Practice questions",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: true,
        tag: "After certificate",
        tagColor: "muted"
      },
      {
        head: false,
        item: true,
        label: "Flashcards",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: true,
        tag: "After certificate",
        tagColor: "muted"
      },
      {
        head: false,
        item: true,
        label: "Exam Simulator",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: true,
        tag: "After certificate",
        tagColor: "muted"
      }
    ],
    metaLine: "Final course exam passed Jul 18 · one step left",
    summary: "5 of 5 topics complete",
    rows: [
      {
        name: "Life Insurance",
        weight: "8 lessons",
        nameColor: "ink",
        lessons: "8 of 8 · complete",
        lColor: "green",
        lPct: "100%",
        lBar: "green",
        hasBand: false,
        noBand: true,
        bNote: "Not enough data yet",
        segs: [],
        bWord: "",
        bColor: "",
        score: "",
        act: "—",
        isPrimary: false,
        isLink: false,
        isText: true,
        aColor: "steel-deep",
        expanded: false,
        subs: [],
        chev: "▸",
        lessonList: [
          {
            label: "Lesson 1: What life insurance does",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 2",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 3",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 4",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 5",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 6",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 7",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 8: Owners, insureds and beneficiaries",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          }
        ],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Policy Provisions",
        weight: "8 lessons",
        nameColor: "ink",
        lessons: "8 of 8 · complete",
        lColor: "green",
        lPct: "100%",
        lBar: "green",
        hasBand: false,
        noBand: true,
        bNote: "Not enough data yet",
        segs: [],
        bWord: "",
        bColor: "",
        score: "",
        act: "—",
        isPrimary: false,
        isLink: false,
        isText: true,
        aColor: "steel-deep",
        expanded: false,
        subs: [],
        chev: "▸",
        lessonList: [
          {
            label: "Lesson 9",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 10",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 11",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 12",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 13",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 14",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 15",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 16",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          }
        ],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Annuities",
        weight: "7 lessons",
        nameColor: "ink",
        lessons: "7 of 7 · complete",
        lColor: "green",
        lPct: "100%",
        lBar: "green",
        hasBand: false,
        noBand: true,
        bNote: "Not enough data yet",
        segs: [],
        bWord: "",
        bColor: "",
        score: "",
        act: "—",
        isPrimary: false,
        isLink: false,
        isText: true,
        aColor: "steel-deep",
        expanded: false,
        subs: [],
        chev: "▸",
        lessonList: [
          {
            label: "Lesson 17",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 18",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 19: How annuities are funded",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 20",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 21",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 22",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 23",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          }
        ],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Health Insurance",
        weight: "7 lessons",
        nameColor: "ink",
        lessons: "7 of 7 · complete",
        lColor: "green",
        lPct: "100%",
        lBar: "green",
        hasBand: false,
        noBand: true,
        bNote: "Not enough data yet",
        segs: [],
        bWord: "",
        bColor: "",
        score: "",
        act: "—",
        isPrimary: false,
        isLink: false,
        isText: true,
        aColor: "steel-deep",
        expanded: false,
        subs: [],
        chev: "▸",
        lessonList: [
          {
            label: "Lesson 24",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 25",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 26",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 27",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 28",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 29",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 30: Disability income insurance",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          }
        ],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Insurance Regulation",
        weight: "6 lessons",
        nameColor: "ink",
        lessons: "6 of 6 · complete",
        lColor: "green",
        lPct: "100%",
        lBar: "green",
        hasBand: false,
        noBand: true,
        bNote: "Not enough data yet",
        segs: [],
        bWord: "",
        bColor: "",
        score: "",
        act: "—",
        isPrimary: false,
        isLink: false,
        isText: true,
        aColor: "steel-deep",
        expanded: false,
        subs: [],
        chev: "▸",
        lessonList: [
          {
            label: "Lesson 31",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 32",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 33",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 34",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 35",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 36",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          }
        ],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      }
    ],
    navLocked: true,
    showSignalsRow: false,
    showFocusRow: false,
    stage: "q7"
  },
  q8: {
    hello: "Congratulations, Jordan",
    phase: "Exam Prep · Unlocked",
    pathway: "Regulated · sequential",
    hasBanner: false,
    banner: {
      border: "green-edge",
      bg: "green-wash",
      color: "green",
      eyebrow: "QE complete · Jul 18",
      items: [
        { n: "✓", text: "Affidavit signed Jul 16" },
        { n: "✓", text: "Final course exam passed Jul 18" },
        { n: "✓", text: "Certificate earned and sent to the Florida DFS" }
      ]
    },
    comboProg: true,
    comboProgLeft: false,
    comboReadyLeft: true,
    showFocusCard: false,
    hasTabs: false,
    tabs: [],
    stdTable: true,
    prepTable: false,
    prows: [],
    uLayout: false,
    uReady: {
      has: false,
      none: true,
      p: 0,
      s: -1,
      tri: {
        capSim: "butt",
        capPrac: "butt",
        capReady: "butt",
        sim: "0.0 483.8",
        prac: "0.0 402.1",
        ready: "0.0 320.4",
        rColor: "transparent",
        aria: "Exam Simulator 0%, practice coverage 0%, Readiness not enough data yet"
      }
    },
    uPath: [
      {
        label: "Readiness",
        value: "Not enough data yet",
        dot: { weight: 0, tone: "steel-deep", size: 12 },
        color: "ink",
        valColor: "body",
        hasBar: false,
        pct: "0%",
        barColor: "steel",
        hasLink: false,
        noLink: true,
        link: ""
      },
      {
        label: "Practice questions",
        value: "0 answered",
        dot: { weight: 0, tone: "steel", size: 12 },
        color: "ink",
        valColor: "body",
        hasBar: true,
        pct: "0%",
        barColor: "steel",
        hasLink: false,
        noLink: true,
        link: ""
      },
      {
        label: "Flashcards",
        value: "Open",
        dot: { weight: 0, tone: "steel-light", size: 12 },
        color: "ink",
        valColor: "body",
        hasBar: false,
        pct: "0%",
        barColor: "steel",
        hasLink: false,
        noLink: true,
        link: ""
      },
      {
        label: "Exam Simulator (3)",
        value: "Opens once Readiness is set [to confirm]",
        dot: { weight: 0, size: 12 },
        color: "muted",
        valColor: "muted",
        hasBar: false,
        pct: "0%",
        barColor: "violet",
        hasLink: false,
        noLink: true,
        link: ""
      },
      {
        label: "Book your exam",
        value: "Ready (85%) in every topic · in Atlas",
        dot: { weight: 0, size: 10 },
        color: "muted",
        valColor: "muted",
        hasBar: false,
        pct: "0%",
        barColor: "steel",
        hasLink: false,
        noLink: true,
        link: ""
      }
    ],
    uBasis: "Starts with your first practice answer in Exam Prep",
    hero: {
      border: "green-edge",
      bg: "green-wash",
      color: "green",
      done: true,
      eyebrow: "QE complete",
      title: "Now let’s get you exam ready",
      sub: "Exam Prep is open. Your Readiness starts with your first practice questions.",
      nextLabel: "Your next step · Exam Prep",
      next: "Practice questions · all five topics",
      meta: "20 questions · about 20 min · no studying needed first",
      cta: "Start Exam Prep",
      ctaBg: "green",
      alt: "Download certificate"
    },
    showProgFull: false,
    showProgCompact: false,
    compactLines: [],
    compactLink: "View certificate",
    prog: {
      flex: "1 1 420px",
      pct: "100%",
      ringLab: "Complete",
      lessonsVal: "36 of 36 lessons · complete",
      lPct: "100%",
      hasSeat: false,
      seat: "60h of 60h required ✓",
      note: "Your required education is complete.",
      hasSteps: false,
      steps: [],
      aria: "QE course 100% complete",
      dash: "314.2 314.2",
      ringColor: "green",
      cap: "butt"
    },
    showReady: false,
    ready: {
      flex: "1 1 420px",
      border: "green-edge",
      bg: "paper",
      isNew: true,
      isNone: true,
      isActive: false,
      noneSub: "Readiness appears here for the first time. Take some practice questions to get started.",
      evidence: [
        { name: "Life Insurance", answered: "None yet", status: "Start here", color: "amber-deep" },
        { name: "Policy Provisions", answered: "None yet", status: "Start here", color: "amber-deep" },
        { name: "Annuities", answered: "None yet", status: "Start here", color: "amber-deep" },
        { name: "Health Insurance", answered: "None yet", status: "Start here", color: "amber-deep" },
        { name: "Insurance Regulation", answered: "None yet", status: "Start here", color: "amber-deep" }
      ],
      score: "",
      word: "",
      color: "",
      toReady: "",
      segs: [],
      marker: "",
      note: ""
    },
    focus: {
      label: "Rubi · next",
      title: "Exam-style questions are harder",
      why: "They’re built like the state exam, not the lesson checks. Your Readiness starts fresh from them, so a lower start is normal.",
      cta: "How Readiness works"
    },
    showTools: true,
    toolsTitle: "Now open · Exam Prep",
    tools: [
      {
        name: "Practice questions",
        desc: "Exam-style questions by topic. This is what builds Readiness.",
        icon: "M9 9a3 3 0 1 1 4 2.8c-.6.3-1 .9-1 1.6V15M12 18.5v.5M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20",
        status: "Open",
        statusColor: "green",
        border: "steel-edge",
        bg: "white",
        iconColor: "steel-deep"
      },
      {
        name: "Flashcards",
        desc: "Rubi builds sets from weak topics and cards you mark.",
        icon: "M3 7h13v12H3zM8 3h13v12",
        status: "Open",
        statusColor: "green",
        border: "steel-edge",
        bg: "white",
        iconColor: "steel-deep"
      },
      {
        name: "Exam Simulator",
        desc: "150 questions · 165 min · full exam conditions.",
        icon: "M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20M12 7v5l3 2",
        status: "Opens once Readiness is set [to confirm]",
        statusColor: "muted",
        border: "hairline",
        bg: "paper",
        iconColor: "faint"
      }
    ],
    tableTitle: "Your course by topic",
    tableNote: "Lessons stay open for review",
    colLessons: true,
    colReady: false,
    gate: "Your course is complete. Readiness comes only from Exam Prep practice; your lessons don’t feed it. Booking opens in Atlas at Ready (85%) in every topic.",
    nav: [
      {
        head: false,
        item: true,
        label: "Overview",
        rule: "steel-deep",
        weight: 600,
        color: "steel-deep",
        hasTag: false,
        tag: "",
        tagColor: ""
      },
      {
        head: false,
        item: true,
        label: "Learn",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: true,
        tag: "Complete",
        tagColor: "steel-deep"
      },
      {
        head: false,
        item: true,
        label: "Study planner",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: false,
        tag: "",
        tagColor: ""
      },
      {
        head: false,
        item: true,
        label: "Ask Rubi",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: false,
        tag: "",
        tagColor: ""
      },
      { head: true, item: false, label: "Exam prep" },
      {
        head: false,
        item: true,
        label: "Practice questions",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: true,
        tag: "Open",
        tagColor: "green"
      },
      {
        head: false,
        item: true,
        label: "Flashcards",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: true,
        tag: "Open",
        tagColor: "green"
      },
      {
        head: false,
        item: true,
        label: "Exam Simulator",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: true,
        tag: "Open",
        tagColor: "green"
      }
    ],
    metaLine: "Certificate earned Jul 18",
    summary: "5 of 5 topics complete · Readiness by topic fills in as you practice",
    rows: [
      {
        name: "Life Insurance",
        weight: "8 lessons",
        nameColor: "ink",
        lessons: "8 of 8 · complete",
        lColor: "green",
        lPct: "100%",
        lBar: "green",
        hasBand: false,
        noBand: true,
        bNote: "Not enough data yet",
        segs: [],
        bWord: "",
        bColor: "",
        score: "",
        act: "—",
        isPrimary: false,
        isLink: false,
        isText: true,
        aColor: "steel-deep",
        expanded: false,
        subs: [],
        chev: "▸",
        lessonList: [
          {
            label: "Lesson 1: What life insurance does",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 2",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 3",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 4",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 5",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 6",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 7",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 8: Owners, insureds and beneficiaries",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          }
        ],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Policy Provisions",
        weight: "8 lessons",
        nameColor: "ink",
        lessons: "8 of 8 · complete",
        lColor: "green",
        lPct: "100%",
        lBar: "green",
        hasBand: false,
        noBand: true,
        bNote: "Not enough data yet",
        segs: [],
        bWord: "",
        bColor: "",
        score: "",
        act: "—",
        isPrimary: false,
        isLink: false,
        isText: true,
        aColor: "steel-deep",
        expanded: false,
        subs: [],
        chev: "▸",
        lessonList: [
          {
            label: "Lesson 9",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 10",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 11",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 12",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 13",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 14",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 15",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 16",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          }
        ],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Annuities",
        weight: "7 lessons",
        nameColor: "ink",
        lessons: "7 of 7 · complete",
        lColor: "green",
        lPct: "100%",
        lBar: "green",
        hasBand: false,
        noBand: true,
        bNote: "Not enough data yet",
        segs: [],
        bWord: "",
        bColor: "",
        score: "",
        act: "—",
        isPrimary: false,
        isLink: false,
        isText: true,
        aColor: "steel-deep",
        expanded: false,
        subs: [],
        chev: "▸",
        lessonList: [
          {
            label: "Lesson 17",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 18",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 19: How annuities are funded",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 20",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 21",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 22",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 23",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          }
        ],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Health Insurance",
        weight: "7 lessons",
        nameColor: "ink",
        lessons: "7 of 7 · complete",
        lColor: "green",
        lPct: "100%",
        lBar: "green",
        hasBand: false,
        noBand: true,
        bNote: "Not enough data yet",
        segs: [],
        bWord: "",
        bColor: "",
        score: "",
        act: "—",
        isPrimary: false,
        isLink: false,
        isText: true,
        aColor: "steel-deep",
        expanded: false,
        subs: [],
        chev: "▸",
        lessonList: [
          {
            label: "Lesson 24",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 25",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 26",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 27",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 28",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 29",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 30: Disability income insurance",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          }
        ],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Insurance Regulation",
        weight: "6 lessons",
        nameColor: "ink",
        lessons: "6 of 6 · complete",
        lColor: "green",
        lPct: "100%",
        lBar: "green",
        hasBand: false,
        noBand: true,
        bNote: "Not enough data yet",
        segs: [],
        bWord: "",
        bColor: "",
        score: "",
        act: "—",
        isPrimary: false,
        isLink: false,
        isText: true,
        aColor: "steel-deep",
        expanded: false,
        subs: [],
        chev: "▸",
        lessonList: [
          {
            label: "Lesson 31",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 32",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 33",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 34",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 35",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 36",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          }
        ],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      }
    ],
    navLocked: false,
    showSignalsRow: false,
    showFocusRow: true,
    stage: "q8"
  },
  u1: {
    hello: "Welcome, Jordan",
    phase: "Learn + prepare",
    pathway: "Open access · move freely",
    hasBanner: true,
    banner: {
      border: "steel-edge",
      bg: "steel-wash",
      color: "steel-deep",
      eyebrow: "Move freely",
      items: [
        { n: "1", text: "Lessons open in any order. They build your course Progress." },
        { n: "2", text: "Practice questions build your exam Readiness, by topic and sub-topic." },
        { n: "3", text: "Switch between them anytime. Rubi suggests what’s next." }
      ]
    },
    comboProg: false,
    comboProgLeft: true,
    comboReadyLeft: false,
    showFocusCard: false,
    hasTabs: false,
    tabs: [],
    stdTable: true,
    prepTable: false,
    prows: [],
    uLayout: true,
    uReady: {
      has: false,
      none: true,
      p: 0,
      s: -1,
      tri: {
        capSim: "butt",
        capPrac: "butt",
        capReady: "butt",
        sim: "0.0 483.8",
        prac: "0.0 402.1",
        ready: "0.0 320.4",
        rColor: "transparent",
        aria: "Exam Simulator 0%, practice coverage 0%, Readiness not enough data yet"
      }
    },
    uPath: [
      {
        label: "Readiness",
        value: "Not enough data yet",
        dot: { weight: 0, tone: "steel-deep", size: 12 },
        color: "ink",
        valColor: "body",
        hasBar: false,
        pct: "0%",
        barColor: "steel",
        hasLink: false,
        noLink: true,
        link: ""
      },
      {
        label: "Practice questions",
        value: "0 of 265 covered",
        dot: { weight: 0, tone: "steel", size: 12 },
        color: "ink",
        valColor: "body",
        hasBar: true,
        pct: "0%",
        barColor: "steel",
        hasLink: false,
        noLink: true,
        link: ""
      },
      {
        label: "Flashcards",
        value: "Open",
        dot: { weight: 0, tone: "steel-light", size: 12 },
        color: "ink",
        valColor: "body",
        hasBar: false,
        pct: "0%",
        barColor: "steel",
        hasLink: false,
        noLink: true,
        link: ""
      },
      {
        label: "Exam Simulator (3)",
        value: "Opens once Readiness is set [to confirm]",
        dot: { weight: 0, size: 12 },
        color: "muted",
        valColor: "muted",
        hasBar: false,
        pct: "0%",
        barColor: "violet",
        hasLink: false,
        noLink: true,
        link: ""
      },
      {
        label: "Book your exam",
        value: "Ready (85%) in every topic · in Atlas",
        dot: { weight: 0, size: 10 },
        color: "muted",
        valColor: "muted",
        hasBar: false,
        pct: "0%",
        barColor: "steel",
        hasLink: false,
        noLink: true,
        link: ""
      }
    ],
    uBasis: "Starts with your first practice answer · lessons don’t count toward it",
    hero: {
      border: "steel-edge",
      bg: "steel-wash",
      color: "steel-deep",
      done: false,
      eyebrow: "Getting started",
      title: "Learn and prepare, in any order",
      sub: "Start a lesson or jump into practice questions.",
      nextLabel: "Recommended next",
      next: "Lesson 1: What life insurance does",
      meta: "1h 40m · a good first step",
      cta: "Start lesson",
      ctaBg: "steel-deep",
      alt: "Try practice questions"
    },
    showProgFull: false,
    showProgCompact: false,
    compactLines: [],
    compactLink: "View certificate",
    prog: {
      flex: "1 1 420px",
      pct: "0%",
      ringLab: "Lessons",
      lessonsVal: "0 of 36 lessons",
      lPct: "0%",
      hasSeat: false,
      seat: "0h of 60h required",
      note: "Lessons open in any order.",
      hasSteps: false,
      steps: [],
      aria: "QE course 0% complete",
      dash: "0.0 314.2",
      ringColor: "steel",
      cap: "butt"
    },
    showReady: false,
    ready: {
      flex: "1 1 420px",
      border: "hairline",
      bg: "white",
      isNew: false,
      isNone: true,
      isActive: false,
      noneSub: "Not enough data yet to determine readiness. Take some practice questions to get started.",
      evidence: [
        { name: "Life Insurance", answered: "None yet", status: "Start here", color: "amber-deep" },
        { name: "Policy Provisions", answered: "None yet", status: "Start here", color: "amber-deep" },
        { name: "Annuities", answered: "None yet", status: "Start here", color: "amber-deep" },
        { name: "Health Insurance", answered: "None yet", status: "Start here", color: "amber-deep" },
        { name: "Insurance Regulation", answered: "None yet", status: "Start here", color: "amber-deep" }
      ],
      score: "",
      word: "",
      color: "",
      toReady: "",
      segs: [],
      marker: "",
      note: ""
    },
    focus: {
      label: "Rubi · your study partner",
      title: "Not sure where to begin?",
      why: "Start with a lesson if the topic is new, or take ten practice questions to see where you stand.",
      cta: "Ask Rubi"
    },
    showTools: false,
    toolsTitle: "Continue preparing",
    tools: [
      {
        name: "Practice questions",
        desc: "Exam-style questions by topic. This is what builds Readiness.",
        icon: "M9 9a3 3 0 1 1 4 2.8c-.6.3-1 .9-1 1.6V15M12 18.5v.5M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20",
        status: "Open",
        statusColor: "green",
        border: "steel-edge",
        bg: "white",
        iconColor: "steel-deep"
      },
      {
        name: "Flashcards",
        desc: "Rubi builds sets from weak topics and cards you mark.",
        icon: "M3 7h13v12H3zM8 3h13v12",
        status: "Open",
        statusColor: "green",
        border: "steel-edge",
        bg: "white",
        iconColor: "steel-deep"
      },
      {
        name: "Exam Simulator",
        desc: "150 questions · 165 min · full exam conditions.",
        icon: "M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20M12 7v5l3 2",
        status: "Opens once Readiness is set [to confirm]",
        statusColor: "muted",
        border: "hairline",
        bg: "paper",
        iconColor: "faint"
      }
    ],
    tableTitle: "Your course by topic",
    tableNote: "Two columns, two sources",
    colLessons: true,
    colReady: true,
    gate: "Two separate signals: lessons build Progress, Exam Prep practice builds Readiness. Course activity doesn’t change your Readiness.",
    nav: [
      {
        head: false,
        item: true,
        label: "Overview",
        rule: "steel-deep",
        weight: 600,
        color: "steel-deep",
        hasTag: false,
        tag: "",
        tagColor: ""
      },
      {
        head: false,
        item: true,
        label: "Learn",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: true,
        tag: "Lesson 1",
        tagColor: "steel-deep"
      },
      {
        head: false,
        item: true,
        label: "Study planner",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: false,
        tag: "",
        tagColor: ""
      },
      {
        head: false,
        item: true,
        label: "Ask Rubi",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: false,
        tag: "",
        tagColor: ""
      },
      { head: true, item: false, label: "Exam prep" },
      {
        head: false,
        item: true,
        label: "Practice questions",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: true,
        tag: "Open",
        tagColor: "green"
      },
      {
        head: false,
        item: true,
        label: "Flashcards",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: true,
        tag: "Open",
        tagColor: "green"
      },
      {
        head: false,
        item: true,
        label: "Exam Simulator",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: true,
        tag: "Open",
        tagColor: "green"
      }
    ],
    metaLine: "Access ends Jan 20, 2027",
    summary: "0 of 5 topics started",
    rows: [
      {
        name: "Life Insurance",
        weight: "22% of exam · 8 lessons",
        nameColor: "body",
        lessons: "0 of 8",
        lColor: "muted",
        lPct: "0%",
        lBar: "steel",
        hasBand: false,
        noBand: true,
        bNote: "None yet",
        segs: [],
        bWord: "",
        bColor: "",
        score: "",
        act: "Start",
        isPrimary: true,
        isLink: false,
        isText: false,
        aColor: "steel-deep",
        expanded: false,
        subs: [],
        chev: "▸",
        lessonList: [
          {
            label: "Lesson 1: What life insurance does",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 2",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 3",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 4",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 5",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 6",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 7",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 8: Owners, insureds and beneficiaries",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          }
        ],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Policy Provisions",
        weight: "22% of exam · 8 lessons",
        nameColor: "body",
        lessons: "0 of 8",
        lColor: "muted",
        lPct: "0%",
        lBar: "steel",
        hasBand: false,
        noBand: true,
        bNote: "None yet",
        segs: [],
        bWord: "",
        bColor: "",
        score: "",
        act: "—",
        isPrimary: false,
        isLink: false,
        isText: true,
        aColor: "steel-deep",
        expanded: false,
        subs: [],
        chev: "▸",
        lessonList: [
          {
            label: "Lesson 9",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 10",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 11",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 12",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 13",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 14",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 15",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 16",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          }
        ],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Annuities",
        weight: "20% of exam · 7 lessons",
        nameColor: "body",
        lessons: "0 of 7",
        lColor: "muted",
        lPct: "0%",
        lBar: "steel",
        hasBand: false,
        noBand: true,
        bNote: "None yet",
        segs: [],
        bWord: "",
        bColor: "",
        score: "",
        act: "—",
        isPrimary: false,
        isLink: false,
        isText: true,
        aColor: "steel-deep",
        expanded: false,
        subs: [],
        chev: "▸",
        lessonList: [
          {
            label: "Lesson 17",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 18",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 19: How annuities are funded",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 20",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 21",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 22",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 23",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          }
        ],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Health Insurance",
        weight: "18% of exam · 7 lessons",
        nameColor: "body",
        lessons: "0 of 7",
        lColor: "muted",
        lPct: "0%",
        lBar: "steel",
        hasBand: false,
        noBand: true,
        bNote: "None yet",
        segs: [],
        bWord: "",
        bColor: "",
        score: "",
        act: "—",
        isPrimary: false,
        isLink: false,
        isText: true,
        aColor: "steel-deep",
        expanded: false,
        subs: [],
        chev: "▸",
        lessonList: [
          {
            label: "Lesson 24",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 25",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 26",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 27",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 28",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 29",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 30: Disability income insurance",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          }
        ],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Insurance Regulation",
        weight: "18% of exam · 6 lessons",
        nameColor: "body",
        lessons: "0 of 6",
        lColor: "muted",
        lPct: "0%",
        lBar: "steel",
        hasBand: false,
        noBand: true,
        bNote: "None yet",
        segs: [],
        bWord: "",
        bColor: "",
        score: "",
        act: "—",
        isPrimary: false,
        isLink: false,
        isText: true,
        aColor: "steel-deep",
        expanded: false,
        subs: [],
        chev: "▸",
        lessonList: [
          {
            label: "Lesson 31",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 32",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 33",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 34",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 35",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 36",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          }
        ],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      }
    ],
    navLocked: false,
    showSignalsRow: false,
    showFocusRow: false,
    stage: "u1"
  },
  u2: {
    hello: "Welcome back, Jordan",
    phase: "Learn + prepare",
    pathway: "Open access · move freely",
    hasBanner: false,
    banner: {
      border: "steel-edge",
      bg: "steel-wash",
      color: "steel-deep",
      eyebrow: "",
      items: []
    },
    comboProg: false,
    comboProgLeft: true,
    comboReadyLeft: false,
    showFocusCard: false,
    hasTabs: false,
    tabs: [],
    stdTable: true,
    prepTable: false,
    prows: [],
    uLayout: true,
    uReady: {
      has: false,
      none: true,
      p: 0.052830188679245285,
      s: -1,
      tri: {
        capSim: "butt",
        capPrac: "round",
        capReady: "butt",
        sim: "0.0 483.8",
        prac: "21.2 402.1",
        ready: "0.0 320.4",
        rColor: "transparent",
        aria: "Exam Simulator 0%, practice coverage 5%, Readiness not enough data yet"
      }
    },
    uPath: [
      {
        label: "Readiness",
        value: "Not enough data yet",
        dot: { weight: 0, tone: "steel-deep", size: 12 },
        color: "ink",
        valColor: "body",
        hasBar: false,
        pct: "0%",
        barColor: "steel",
        hasLink: false,
        noLink: true,
        link: ""
      },
      {
        label: "Practice questions",
        value: "14 of 265 covered",
        dot: { weight: 0, tone: "steel", size: 12 },
        color: "ink",
        valColor: "body",
        hasBar: true,
        pct: "5%",
        barColor: "steel",
        hasLink: false,
        noLink: true,
        link: ""
      },
      {
        label: "Flashcards",
        value: "Open",
        dot: { weight: 0, tone: "steel-light", size: 12 },
        color: "ink",
        valColor: "body",
        hasBar: false,
        pct: "0%",
        barColor: "steel",
        hasLink: false,
        noLink: true,
        link: ""
      },
      {
        label: "Exam Simulator (3)",
        value: "Opens once Readiness is set [to confirm]",
        dot: { weight: 0, size: 12 },
        color: "muted",
        valColor: "muted",
        hasBar: false,
        pct: "0%",
        barColor: "violet",
        hasLink: false,
        noLink: true,
        link: ""
      },
      {
        label: "Book your exam",
        value: "Ready (85%) in every topic · in Atlas",
        dot: { weight: 0, size: 10 },
        color: "muted",
        valColor: "muted",
        hasBar: false,
        pct: "0%",
        barColor: "steel",
        hasLink: false,
        noLink: true,
        link: ""
      }
    ],
    uBasis: "Practice answers in 2 of 5 topics · lessons don’t count toward it",
    hero: {
      border: "steel-edge",
      bg: "steel-wash",
      color: "steel-deep",
      done: false,
      eyebrow: "Learn + prepare",
      title: "Keep learning, and start your Readiness",
      sub: "Course lessons build your progress. Practice questions build your Readiness.",
      nextLabel: "Recommended next",
      next: "Practice questions · Life Insurance",
      meta: "You finished these lessons · 15 questions · about 15 min",
      cta: "Start practice",
      ctaBg: "steel-deep",
      alt: "Resume Lesson 12"
    },
    showProgFull: false,
    showProgCompact: false,
    compactLines: [],
    compactLink: "View certificate",
    prog: {
      flex: "1 1 420px",
      pct: "36%",
      ringLab: "Lessons",
      lessonsVal: "13 of 36 lessons",
      lPct: "36%",
      hasSeat: false,
      seat: "0h of 60h required",
      note: "Lessons open in any order. Life Insurance is complete.",
      hasSteps: false,
      steps: [],
      aria: "QE course 36% complete",
      dash: "113.4 314.2",
      ringColor: "steel",
      cap: "round"
    },
    showReady: false,
    ready: {
      flex: "1 1 420px",
      border: "hairline",
      bg: "white",
      isNew: false,
      isNone: true,
      isActive: false,
      noneSub: "Building your readiness. A few more practice answers in each topic and your score appears.",
      evidence: [
        { name: "Life Insurance", answered: "10 answered", status: "More needed", color: "muted" },
        { name: "Policy Provisions", answered: "4 answered", status: "More needed", color: "muted" },
        { name: "Annuities", answered: "None yet", status: "Start here", color: "amber-deep" },
        { name: "Health Insurance", answered: "None yet", status: "Start here", color: "amber-deep" },
        { name: "Insurance Regulation", answered: "None yet", status: "Start here", color: "amber-deep" }
      ],
      score: "",
      word: "",
      color: "",
      toReady: "",
      segs: [],
      marker: "",
      note: ""
    },
    focus: {
      label: "Rubi suggests",
      title: "Practice what you just learned",
      why: "You finished Life Insurance. Fifteen practice questions there start your Readiness. They’re exam-style, so expect them to feel harder than lesson checks.",
      cta: "Practice Life Insurance · 15 min"
    },
    showTools: false,
    toolsTitle: "Continue preparing",
    tools: [
      {
        name: "Practice questions",
        desc: "Exam-style questions by topic. This is what builds Readiness.",
        icon: "M9 9a3 3 0 1 1 4 2.8c-.6.3-1 .9-1 1.6V15M12 18.5v.5M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20",
        status: "Open",
        statusColor: "green",
        border: "steel-edge",
        bg: "white",
        iconColor: "steel-deep"
      },
      {
        name: "Flashcards",
        desc: "Rubi builds sets from weak topics and cards you mark.",
        icon: "M3 7h13v12H3zM8 3h13v12",
        status: "Open",
        statusColor: "green",
        border: "steel-edge",
        bg: "white",
        iconColor: "steel-deep"
      },
      {
        name: "Exam Simulator",
        desc: "150 questions · 165 min · full exam conditions.",
        icon: "M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20M12 7v5l3 2",
        status: "Opens once Readiness is set [to confirm]",
        statusColor: "muted",
        border: "hairline",
        bg: "paper",
        iconColor: "faint"
      }
    ],
    tableTitle: "Your course by topic",
    tableNote: "Two columns, two sources",
    colLessons: true,
    colReady: true,
    gate: "Two separate signals: lessons build Progress, Exam Prep practice builds Readiness. Course activity doesn’t change your Readiness.",
    nav: [
      {
        head: false,
        item: true,
        label: "Overview",
        rule: "steel-deep",
        weight: 600,
        color: "steel-deep",
        hasTag: false,
        tag: "",
        tagColor: ""
      },
      {
        head: false,
        item: true,
        label: "Learn",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: true,
        tag: "Lesson 12",
        tagColor: "steel-deep"
      },
      {
        head: false,
        item: true,
        label: "Study planner",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: false,
        tag: "",
        tagColor: ""
      },
      {
        head: false,
        item: true,
        label: "Ask Rubi",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: false,
        tag: "",
        tagColor: ""
      },
      { head: true, item: false, label: "Exam prep" },
      {
        head: false,
        item: true,
        label: "Practice questions",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: true,
        tag: "Open",
        tagColor: "green"
      },
      {
        head: false,
        item: true,
        label: "Flashcards",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: true,
        tag: "Open",
        tagColor: "green"
      },
      {
        head: false,
        item: true,
        label: "Exam Simulator",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: true,
        tag: "Open",
        tagColor: "green"
      }
    ],
    metaLine: "Access ends Jan 20, 2027",
    summary: "1 of 5 topics complete · practice answers in 2 topics",
    rows: [
      {
        name: "Life Insurance",
        weight: "22% of exam · 8 lessons",
        nameColor: "ink",
        lessons: "8 of 8 · complete",
        lColor: "green",
        lPct: "100%",
        lBar: "green",
        hasBand: false,
        noBand: true,
        bNote: "10 answered · more needed",
        segs: [],
        bWord: "",
        bColor: "",
        score: "",
        act: "Practice",
        isPrimary: true,
        isLink: false,
        isText: false,
        aColor: "steel-deep",
        expanded: false,
        subs: [],
        chev: "▸",
        lessonList: [
          {
            label: "Lesson 1: What life insurance does",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 2",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 3",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 4",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 5",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 6",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 7",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 8: Owners, insureds and beneficiaries",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          }
        ],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Policy Provisions",
        weight: "22% of exam · 8 lessons",
        nameColor: "ink",
        lessons: "3 of 8 · in progress",
        lColor: "steel-deep",
        lPct: "38%",
        lBar: "steel",
        hasBand: false,
        noBand: true,
        bNote: "4 answered · more needed",
        segs: [],
        bWord: "",
        bColor: "",
        score: "",
        act: "Resume lesson",
        isPrimary: false,
        isLink: true,
        isText: false,
        aColor: "steel-deep",
        expanded: false,
        subs: [],
        chev: "▸",
        lessonList: [
          {
            label: "Lesson 9",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 10",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 11",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 12",
            status: "In progress",
            color: "steel-deep",
            dot: { weight: 0, tone: "steel-deep", size: 8 }
          },
          {
            label: "Lesson 13",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 14",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 15",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 16",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          }
        ],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Annuities",
        weight: "20% of exam · 7 lessons",
        nameColor: "ink",
        lessons: "2 of 7 · in progress",
        lColor: "steel-deep",
        lPct: "29%",
        lBar: "steel",
        hasBand: false,
        noBand: true,
        bNote: "None yet",
        segs: [],
        bWord: "",
        bColor: "",
        score: "",
        act: "—",
        isPrimary: false,
        isLink: false,
        isText: true,
        aColor: "steel-deep",
        expanded: false,
        subs: [],
        chev: "▸",
        lessonList: [
          {
            label: "Lesson 17",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 18",
            status: "Complete",
            color: "green",
            dot: { weight: 0, tone: "green", size: 8 }
          },
          {
            label: "Lesson 19: How annuities are funded",
            status: "In progress",
            color: "steel-deep",
            dot: { weight: 0, tone: "steel-deep", size: 8 }
          },
          {
            label: "Lesson 20",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 21",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 22",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 23",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          }
        ],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Health Insurance",
        weight: "18% of exam · 7 lessons",
        nameColor: "body",
        lessons: "0 of 7",
        lColor: "muted",
        lPct: "0%",
        lBar: "steel",
        hasBand: false,
        noBand: true,
        bNote: "None yet",
        segs: [],
        bWord: "",
        bColor: "",
        score: "",
        act: "—",
        isPrimary: false,
        isLink: false,
        isText: true,
        aColor: "steel-deep",
        expanded: false,
        subs: [],
        chev: "▸",
        lessonList: [
          {
            label: "Lesson 24",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 25",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 26",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 27",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 28",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 29",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 30: Disability income insurance",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          }
        ],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Insurance Regulation",
        weight: "18% of exam · 6 lessons",
        nameColor: "body",
        lessons: "0 of 6",
        lColor: "muted",
        lPct: "0%",
        lBar: "steel",
        hasBand: false,
        noBand: true,
        bNote: "None yet",
        segs: [],
        bWord: "",
        bColor: "",
        score: "",
        act: "—",
        isPrimary: false,
        isLink: false,
        isText: true,
        aColor: "steel-deep",
        expanded: false,
        subs: [],
        chev: "▸",
        lessonList: [
          {
            label: "Lesson 31",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 32",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 33",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 34",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 35",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          },
          {
            label: "Lesson 36",
            status: "Not started",
            color: "muted",
            dot: { weight: 0, size: 8 }
          }
        ],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      }
    ],
    navLocked: false,
    showSignalsRow: false,
    showFocusRow: false,
    stage: "u2"
  },
  u3: {
    hello: "Welcome back, Jordan",
    phase: "Learn + prepare",
    pathway: "Open access · move freely",
    hasBanner: false,
    banner: {
      border: "steel-edge",
      bg: "steel-wash",
      color: "steel-deep",
      eyebrow: "",
      items: []
    },
    comboProg: false,
    comboProgLeft: true,
    comboReadyLeft: false,
    showFocusCard: false,
    hasTabs: true,
    tabs: [
      {
        label: "Readiness",
        sub: "62% · Developing · by topic and sub-topic",
        sel: "true",
        rule: "steel-deep",
        bg: "steel-wash",
        color: "ink",
        weight: 700
      },
      {
        label: "Course progress",
        sub: "61% · 22 of 36 lessons",
        sel: "false",
        rule: "transparent",
        bg: "transparent",
        color: "body",
        weight: 500
      }
    ],
    stdTable: false,
    prepTable: true,
    prows: [
      {
        name: "Life Insurance",
        weight: "22% of exam",
        hasPie: true,
        pieLabel: "22% of the exam",
        pieStart: 0,
        pieEnd: 79,
        pLabel: "30 of 60 answered",
        hasCov: true,
        covPct: "50%",
        hasBand: true,
        noBand: false,
        bNote: "",
        segs: [
          {
            style: { weight: 40, tone: "edge" }
          },
          {
            style: { weight: 25, tone: "amber" }
          },
          {
            style: { weight: 20, tone: "steel-light" }
          },
          {
            style: { weight: 15, tone: "hairline" }
          }
        ],
        bWord: "Proficient",
        bColor: "steel",
        num: "74",
        last: "5 days ago",
        act: "Practice",
        isPrimary: false,
        isLink: true,
        aColor: "steel-deep",
        expanded: false,
        chev: "▸",
        subs: [
          {
            name: "Policy types: term, whole, universal",
            s: 67,
            num: "67",
            w: 600,
            note: "Weakest · start here",
            noteColor: "rubi",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Proficient",
            bColor: "steel",
            rubi: true,
            rubiCta: "Practice · 12 min"
          },
          {
            name: "Underwriting & insurable interest",
            s: 76,
            num: "76",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Proficient",
            bColor: "steel",
            rubi: false,
            rubiCta: ""
          },
          {
            name: "Owners & beneficiaries",
            s: 79,
            num: "79",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Proficient",
            bColor: "steel",
            rubi: false,
            rubiCta: ""
          }
        ],
        lessonList: [],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Policy Provisions",
        weight: "22% of exam",
        hasPie: true,
        pieLabel: "22% of the exam",
        pieStart: 79,
        pieEnd: 158,
        pLabel: "26 of 60 answered",
        hasCov: true,
        covPct: "43%",
        hasBand: true,
        noBand: false,
        bNote: "",
        segs: [
          {
            style: { weight: 40, tone: "edge" }
          },
          {
            style: { weight: 25, tone: "amber" }
          },
          {
            style: { weight: 20, tone: "hairline" }
          },
          {
            style: { weight: 15, tone: "hairline" }
          }
        ],
        bWord: "Developing",
        bColor: "amber-deep",
        num: "58",
        last: "2 days ago",
        act: "Practice",
        isPrimary: false,
        isLink: true,
        aColor: "steel-deep",
        expanded: false,
        chev: "▸",
        subs: [
          {
            name: "Riders",
            s: 47,
            num: "47",
            w: 600,
            note: "Weakest · start here",
            noteColor: "rubi",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "hairline" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Developing",
            bColor: "amber-deep",
            rubi: true,
            rubiCta: "Practice · 12 min"
          },
          {
            name: "Nonforfeiture options",
            s: 55,
            num: "55",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "hairline" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Developing",
            bColor: "amber-deep",
            rubi: false,
            rubiCta: ""
          },
          {
            name: "Settlement options",
            s: 63,
            num: "63",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "hairline" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Developing",
            bColor: "amber-deep",
            rubi: false,
            rubiCta: ""
          },
          {
            name: "Grace period & reinstatement",
            s: 67,
            num: "67",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Proficient",
            bColor: "steel",
            rubi: false,
            rubiCta: ""
          }
        ],
        lessonList: [],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Annuities",
        weight: "20% of exam",
        hasPie: true,
        pieLabel: "20% of the exam",
        pieStart: 158,
        pieEnd: 230,
        pLabel: "22 of 55 answered",
        hasCov: true,
        covPct: "40%",
        hasBand: true,
        noBand: false,
        bNote: "",
        segs: [
          {
            style: { weight: 40, tone: "edge" }
          },
          {
            style: { weight: 25, tone: "amber" }
          },
          {
            style: { weight: 20, tone: "hairline" }
          },
          {
            style: { weight: 15, tone: "hairline" }
          }
        ],
        bWord: "Developing",
        bColor: "amber-deep",
        num: "52",
        last: "Today",
        act: "Practice",
        isPrimary: true,
        isLink: false,
        aColor: "steel-deep",
        expanded: true,
        chev: "▾",
        subs: [
          {
            name: "Variable annuities",
            w: 600,
            note: "Weakest · start here",
            noteColor: "rubi",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "hairline" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Developing",
            bColor: "amber-deep",
            num: "41",
            rubi: true,
            rubiCta: "Practice · 12 min"
          },
          {
            name: "Annuity taxation",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "hairline" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Developing",
            bColor: "amber-deep",
            num: "55",
            rubi: false,
            rubiCta: ""
          },
          {
            name: "Fixed and indexed annuities",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "hairline" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Developing",
            bColor: "amber-deep",
            num: "58",
            rubi: false,
            rubiCta: ""
          }
        ],
        lessonList: [],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "rotate(90deg)",
        ariaExp: "true"
      },
      {
        name: "Health Insurance",
        weight: "18% of exam",
        hasPie: true,
        pieLabel: "18% of the exam",
        pieStart: 230,
        pieEnd: 295,
        pLabel: "24 of 45 answered",
        hasCov: true,
        covPct: "53%",
        hasBand: true,
        noBand: false,
        bNote: "",
        segs: [
          {
            style: { weight: 40, tone: "edge" }
          },
          {
            style: { weight: 25, tone: "amber" }
          },
          {
            style: { weight: 20, tone: "steel-light" }
          },
          {
            style: { weight: 15, tone: "hairline" }
          }
        ],
        bWord: "Proficient",
        bColor: "steel",
        num: "66",
        last: "4 days ago",
        act: "Practice",
        isPrimary: false,
        isLink: true,
        aColor: "steel-deep",
        expanded: false,
        chev: "▸",
        subs: [
          {
            name: "Disability income",
            s: 59,
            num: "59",
            w: 600,
            note: "Weakest · start here",
            noteColor: "rubi",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "hairline" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Developing",
            bColor: "amber-deep",
            rubi: true,
            rubiCta: "Practice · 12 min"
          },
          {
            name: "Medical expense plans",
            s: 68,
            num: "68",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Proficient",
            bColor: "steel",
            rubi: false,
            rubiCta: ""
          },
          {
            name: "Medicare & supplements",
            s: 71,
            num: "71",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Proficient",
            bColor: "steel",
            rubi: false,
            rubiCta: ""
          }
        ],
        lessonList: [],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Insurance Regulation",
        weight: "18% of exam",
        hasPie: true,
        pieLabel: "18% of the exam",
        pieStart: 295,
        pieEnd: 360,
        pLabel: "20 of 45 answered",
        hasCov: true,
        covPct: "44%",
        hasBand: true,
        noBand: false,
        bNote: "",
        segs: [
          {
            style: { weight: 40, tone: "edge" }
          },
          {
            style: { weight: 25, tone: "amber" }
          },
          {
            style: { weight: 20, tone: "hairline" }
          },
          {
            style: { weight: 15, tone: "hairline" }
          }
        ],
        bWord: "Developing",
        bColor: "amber-deep",
        num: "61",
        last: "6 days ago",
        act: "Practice",
        isPrimary: false,
        isLink: true,
        aColor: "steel-deep",
        expanded: false,
        chev: "▸",
        subs: [
          {
            name: "Florida licensing rules",
            s: 54,
            num: "54",
            w: 600,
            note: "Weakest · start here",
            noteColor: "rubi",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "hairline" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Developing",
            bColor: "amber-deep",
            rubi: true,
            rubiCta: "Practice · 12 min"
          },
          {
            name: "Unfair trade practices",
            s: 63,
            num: "63",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "hairline" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Developing",
            bColor: "amber-deep",
            rubi: false,
            rubiCta: ""
          },
          {
            name: "Replacement & agent duties",
            s: 66,
            num: "66",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Proficient",
            bColor: "steel",
            rubi: false,
            rubiCta: ""
          }
        ],
        lessonList: [],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Exam Simulator",
        weight: "All topics · 3 full exams",
        hasPie: false,
        pieLabel: "",
        pieStart: 0,
        pieEnd: 0,
        pLabel: "0 of 3 taken",
        hasCov: false,
        covPct: "0%",
        hasBand: false,
        noBand: true,
        bNote: "Uses all topics",
        segs: [],
        bWord: "",
        bColor: "",
        num: "",
        last: "—",
        act: "Start",
        isPrimary: false,
        isLink: true,
        aColor: "steel-deep",
        expanded: false,
        chev: "",
        subs: [],
        lessonOpen: false,
        lessonList: [],
        ariaExp: "false",
        chevVis: "hidden",
        chevRot: "none"
      }
    ],
    uLayout: true,
    uReady: {
      has: true,
      none: false,
      p: 0.46037735849056605,
      s: 62,
      pillLabel: "Developing",
      pillBg: "amber-wash",
      pillBorder: "amber-edge",
      tri: {
        capSim: "butt",
        capPrac: "round",
        capReady: "round",
        sim: "0.0 483.8",
        prac: "185.1 402.1",
        ready: "198.7 320.4",
        rColor: "amber",
        aria: "Exam Simulator 0%, practice coverage 46%, Readiness 62"
      }
    },
    uPath: [
      {
        label: "Readiness",
        value: "62% of 85% · 23 to Ready",
        dot: { weight: 0, tone: "amber", size: 12 },
        color: "ink",
        valColor: "body",
        hasBar: true,
        pct: "73%",
        barColor: "amber",
        hasLink: false,
        noLink: true,
        link: ""
      },
      {
        label: "Practice questions",
        value: "122 of 265 covered",
        dot: { weight: 0, tone: "steel", size: 12 },
        color: "ink",
        valColor: "body",
        hasBar: true,
        pct: "46%",
        barColor: "steel",
        hasLink: false,
        noLink: true,
        link: ""
      },
      {
        label: "Flashcards",
        value: "8 due",
        dot: { weight: 0, tone: "steel-light", size: 12 },
        color: "ink",
        valColor: "body",
        hasBar: false,
        pct: "0%",
        barColor: "steel",
        hasLink: false,
        noLink: true,
        link: ""
      },
      {
        label: "Exam Simulator (3)",
        value: "0 of 3 · open",
        dot: { weight: 0, tone: "violet", size: 12 },
        color: "ink",
        valColor: "body",
        hasBar: true,
        pct: "0%",
        barColor: "violet",
        hasLink: false,
        noLink: true,
        link: ""
      },
      {
        label: "Book your exam",
        value: "Ready (85%) in every topic · in Atlas",
        dot: { weight: 0, size: 10 },
        color: "muted",
        valColor: "muted",
        hasBar: false,
        pct: "0%",
        barColor: "steel",
        hasLink: false,
        noLink: true,
        link: ""
      }
    ],
    uBasis: "All five topics · blueprint-weighted · rings, outside in: simulator · practice · Readiness",
    hero: {
      border: "steel-edge",
      bg: "steel-wash",
      color: "steel-deep",
      done: false,
      eyebrow: "Learn + prepare · Readiness 62%",
      title: "Your next best step: Annuities practice",
      sub: "Rubi picks the activity with the biggest lift for your exam. Keep going with lessons anytime.",
      nextLabel: "Recommended next",
      next: "Practice: Annuities",
      meta: "20 questions · about 20 min · biggest lift",
      cta: "Start practice",
      ctaBg: "steel-deep",
      alt: "Resume lessons"
    },
    showProgFull: false,
    showProgCompact: false,
    compactLines: [],
    compactLink: "View certificate",
    prog: {
      flex: "1 1 420px",
      pct: "61%",
      ringLab: "Lessons",
      lessonsVal: "22 of 36 lessons",
      lPct: "61%",
      hasSeat: false,
      seat: "0h of 60h required",
      note: "Lessons open in any order.",
      hasSteps: false,
      steps: [],
      aria: "QE course 61% complete",
      dash: "192.0 314.2",
      ringColor: "steel",
      cap: "round"
    },
    showReady: false,
    ready: {
      flex: "1 1 420px",
      border: "hairline",
      bg: "white",
      isNew: false,
      isNone: false,
      isActive: true,
      noneSub: "",
      evidence: [],
      score: "62",
      word: "Developing",
      color: "amber-deep",
      toReady: "23 points to Ready (85%)",
      segs: [
        {
          style: { weight: 40, tone: "edge" }
        },
        {
          style: { weight: 25, tone: "amber" }
        },
        {
          style: { weight: 20, tone: "hairline" }
        },
        {
          style: { weight: 15, tone: "hairline" }
        }
      ],
      marker: { tone: "ink", size: 2 },
      note: "From Exam Prep practice only · blueprint-weighted. Lessons you finish don’t move this number."
    },
    focus: {
      label: "Rubi recommends",
      title: "Annuities",
      why: "20% of your exam and your lowest topic at 52%. Variable annuities is the weakest sub-topic. You have 3 Annuities lessons left too, if you want the content first.",
      cta: "Practice Annuities · 20 min"
    },
    showTools: false,
    toolsTitle: "Continue preparing",
    tools: [
      {
        name: "Practice questions",
        desc: "Exam-style questions by topic. This is what builds Readiness.",
        icon: "M9 9a3 3 0 1 1 4 2.8c-.6.3-1 .9-1 1.6V15M12 18.5v.5M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20",
        status: "Open",
        statusColor: "green",
        border: "steel-edge",
        bg: "white",
        iconColor: "steel-deep"
      },
      {
        name: "Flashcards",
        desc: "Rubi builds sets from weak topics and cards you mark.",
        icon: "M3 7h13v12H3zM8 3h13v12",
        status: "Open",
        statusColor: "green",
        border: "steel-edge",
        bg: "white",
        iconColor: "steel-deep"
      },
      {
        name: "Exam Simulator",
        desc: "150 questions · 165 min · full exam conditions.",
        icon: "M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20M12 7v5l3 2",
        status: "Open",
        statusColor: "green",
        border: "steel-edge",
        bg: "white",
        iconColor: "steel-deep"
      }
    ],
    tableTitle: "Your prep by exam topic",
    tableNote: "Ready at 85% · from Exam Prep practice only · pie = share of the exam",
    colLessons: true,
    colReady: true,
    gate: "Two separate signals: lessons build Progress, Exam Prep practice builds Readiness. Course activity doesn’t change your Readiness.",
    nav: [
      {
        head: false,
        item: true,
        label: "Overview",
        rule: "steel-deep",
        weight: 600,
        color: "steel-deep",
        hasTag: false,
        tag: "",
        tagColor: ""
      },
      {
        head: false,
        item: true,
        label: "Learn",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: true,
        tag: "Lesson 23",
        tagColor: "steel-deep"
      },
      {
        head: false,
        item: true,
        label: "Study planner",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: false,
        tag: "",
        tagColor: ""
      },
      {
        head: false,
        item: true,
        label: "Ask Rubi",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: false,
        tag: "",
        tagColor: ""
      },
      { head: true, item: false, label: "Exam prep" },
      {
        head: false,
        item: true,
        label: "Practice questions",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: true,
        tag: "Open",
        tagColor: "green"
      },
      {
        head: false,
        item: true,
        label: "Flashcards",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: true,
        tag: "Open",
        tagColor: "green"
      },
      {
        head: false,
        item: true,
        label: "Exam Simulator",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: true,
        tag: "Open",
        tagColor: "green"
      }
    ],
    metaLine: "Access ends Jan 20, 2027",
    summary: "0 of 5 topics Ready · Annuities is the biggest lift",
    rows: [
      {
        name: "Life Insurance",
        weight: "8 lessons",
        nameColor: "ink",
        lessons: "8 of 8 · complete",
        lColor: "green",
        lPct: "100%",
        lBar: "green",
        hasBand: true,
        noBand: false,
        bNote: "Not enough data yet",
        segs: [
          {
            style: { weight: 40, tone: "edge" }
          },
          {
            style: { weight: 25, tone: "amber" }
          },
          {
            style: { weight: 20, tone: "steel-light" }
          },
          {
            style: { weight: 15, tone: "hairline" }
          }
        ],
        bWord: "Proficient",
        bColor: "steel",
        score: "74",
        act: "—",
        isPrimary: false,
        isLink: false,
        isText: true,
        aColor: "steel-deep",
        expanded: false,
        subs: [
          {
            name: "Policy types: term, whole, universal",
            s: 67,
            num: "67",
            w: 600,
            note: "Weakest · start here",
            noteColor: "rubi",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Proficient",
            bColor: "steel",
            rubi: true,
            rubiCta: "Practice · 12 min"
          },
          {
            name: "Underwriting & insurable interest",
            s: 76,
            num: "76",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Proficient",
            bColor: "steel",
            rubi: false,
            rubiCta: ""
          },
          {
            name: "Owners & beneficiaries",
            s: 79,
            num: "79",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Proficient",
            bColor: "steel",
            rubi: false,
            rubiCta: ""
          }
        ],
        chev: "▸",
        lessonList: [],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Policy Provisions",
        weight: "8 lessons",
        nameColor: "ink",
        lessons: "6 of 8 · in progress",
        lColor: "steel-deep",
        lPct: "75%",
        lBar: "steel",
        hasBand: true,
        noBand: false,
        bNote: "Not enough data yet",
        segs: [
          {
            style: { weight: 40, tone: "edge" }
          },
          {
            style: { weight: 25, tone: "amber" }
          },
          {
            style: { weight: 20, tone: "hairline" }
          },
          {
            style: { weight: 15, tone: "hairline" }
          }
        ],
        bWord: "Developing",
        bColor: "amber-deep",
        score: "58",
        act: "Practice",
        isPrimary: false,
        isLink: true,
        isText: false,
        aColor: "steel-deep",
        expanded: false,
        subs: [
          {
            name: "Riders",
            s: 47,
            num: "47",
            w: 600,
            note: "Weakest · start here",
            noteColor: "rubi",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "hairline" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Developing",
            bColor: "amber-deep",
            rubi: true,
            rubiCta: "Practice · 12 min"
          },
          {
            name: "Nonforfeiture options",
            s: 55,
            num: "55",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "hairline" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Developing",
            bColor: "amber-deep",
            rubi: false,
            rubiCta: ""
          },
          {
            name: "Settlement options",
            s: 63,
            num: "63",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "hairline" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Developing",
            bColor: "amber-deep",
            rubi: false,
            rubiCta: ""
          },
          {
            name: "Grace period & reinstatement",
            s: 67,
            num: "67",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Proficient",
            bColor: "steel",
            rubi: false,
            rubiCta: ""
          }
        ],
        chev: "▸",
        lessonList: [],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Annuities",
        weight: "7 lessons",
        nameColor: "ink",
        lessons: "4 of 7 · in progress",
        lColor: "steel-deep",
        lPct: "57%",
        lBar: "steel",
        hasBand: true,
        noBand: false,
        bNote: "Not enough data yet",
        segs: [
          {
            style: { weight: 40, tone: "edge" }
          },
          {
            style: { weight: 25, tone: "amber" }
          },
          {
            style: { weight: 20, tone: "hairline" }
          },
          {
            style: { weight: 15, tone: "hairline" }
          }
        ],
        bWord: "Developing",
        bColor: "amber-deep",
        score: "52",
        act: "Practice",
        isPrimary: true,
        isLink: false,
        isText: false,
        aColor: "steel-deep",
        expanded: true,
        subs: [
          {
            name: "Variable annuities",
            s: 41,
            w: 600,
            note: "Weakest · start here",
            noteColor: "amber-deep",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "hairline" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Developing",
            bColor: "amber-deep"
          },
          {
            name: "Fixed and indexed annuities",
            s: 58,
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "hairline" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Developing",
            bColor: "amber-deep"
          },
          {
            name: "Annuity taxation",
            s: 55,
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "hairline" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Developing",
            bColor: "amber-deep"
          }
        ],
        chev: "▾",
        lessonList: [],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "rotate(90deg)",
        ariaExp: "true"
      },
      {
        name: "Health Insurance",
        weight: "7 lessons",
        nameColor: "ink",
        lessons: "3 of 7 · in progress",
        lColor: "steel-deep",
        lPct: "43%",
        lBar: "steel",
        hasBand: true,
        noBand: false,
        bNote: "Not enough data yet",
        segs: [
          {
            style: { weight: 40, tone: "edge" }
          },
          {
            style: { weight: 25, tone: "amber" }
          },
          {
            style: { weight: 20, tone: "steel-light" }
          },
          {
            style: { weight: 15, tone: "hairline" }
          }
        ],
        bWord: "Proficient",
        bColor: "steel",
        score: "66",
        act: "—",
        isPrimary: false,
        isLink: false,
        isText: true,
        aColor: "steel-deep",
        expanded: false,
        subs: [
          {
            name: "Disability income",
            s: 59,
            num: "59",
            w: 600,
            note: "Weakest · start here",
            noteColor: "rubi",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "hairline" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Developing",
            bColor: "amber-deep",
            rubi: true,
            rubiCta: "Practice · 12 min"
          },
          {
            name: "Medical expense plans",
            s: 68,
            num: "68",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Proficient",
            bColor: "steel",
            rubi: false,
            rubiCta: ""
          },
          {
            name: "Medicare & supplements",
            s: 71,
            num: "71",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Proficient",
            bColor: "steel",
            rubi: false,
            rubiCta: ""
          }
        ],
        chev: "▸",
        lessonList: [],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Insurance Regulation",
        weight: "6 lessons",
        nameColor: "ink",
        lessons: "1 of 6 · in progress",
        lColor: "steel-deep",
        lPct: "17%",
        lBar: "steel",
        hasBand: true,
        noBand: false,
        bNote: "Not enough data yet",
        segs: [
          {
            style: { weight: 40, tone: "edge" }
          },
          {
            style: { weight: 25, tone: "amber" }
          },
          {
            style: { weight: 20, tone: "hairline" }
          },
          {
            style: { weight: 15, tone: "hairline" }
          }
        ],
        bWord: "Developing",
        bColor: "amber-deep",
        score: "61",
        act: "—",
        isPrimary: false,
        isLink: false,
        isText: true,
        aColor: "steel-deep",
        expanded: false,
        subs: [
          {
            name: "Florida licensing rules",
            s: 54,
            num: "54",
            w: 600,
            note: "Weakest · start here",
            noteColor: "rubi",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "hairline" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Developing",
            bColor: "amber-deep",
            rubi: true,
            rubiCta: "Practice · 12 min"
          },
          {
            name: "Unfair trade practices",
            s: 63,
            num: "63",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "hairline" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Developing",
            bColor: "amber-deep",
            rubi: false,
            rubiCta: ""
          },
          {
            name: "Replacement & agent duties",
            s: 66,
            num: "66",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Proficient",
            bColor: "steel",
            rubi: false,
            rubiCta: ""
          }
        ],
        chev: "▸",
        lessonList: [],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      }
    ],
    navLocked: false,
    showSignalsRow: false,
    showFocusRow: false,
    stage: "u3"
  },
  u4: {
    hello: "Welcome back, Jordan",
    phase: "Prepare for the exam",
    pathway: "Open access · move freely",
    hasBanner: false,
    banner: {
      border: "steel-edge",
      bg: "steel-wash",
      color: "steel-deep",
      eyebrow: "",
      items: []
    },
    comboProg: false,
    comboProgLeft: true,
    comboReadyLeft: false,
    showFocusCard: false,
    hasTabs: true,
    tabs: [
      {
        label: "Readiness",
        sub: "80% · Proficient · by topic and sub-topic",
        sel: "true",
        rule: "steel-deep",
        bg: "steel-wash",
        color: "ink",
        weight: 700
      },
      {
        label: "Course progress",
        sub: "100% · 36 of 36 lessons",
        sel: "false",
        rule: "transparent",
        bg: "transparent",
        color: "body",
        weight: 500
      }
    ],
    stdTable: false,
    prepTable: true,
    prows: [
      {
        name: "Life Insurance",
        weight: "22% of exam",
        hasPie: true,
        pieLabel: "22% of the exam",
        pieStart: 0,
        pieEnd: 79,
        pLabel: "50 of 60 answered",
        hasCov: true,
        covPct: "83%",
        hasBand: true,
        noBand: false,
        bNote: "",
        segs: [
          {
            style: { weight: 40, tone: "edge" }
          },
          {
            style: { weight: 25, tone: "amber" }
          },
          {
            style: { weight: 20, tone: "steel-light" }
          },
          {
            style: { weight: 15, tone: "green" }
          }
        ],
        bWord: "Ready",
        bColor: "green",
        num: "86",
        last: "3 days ago",
        act: "Practice",
        isPrimary: false,
        isLink: true,
        aColor: "steel-deep",
        expanded: false,
        chev: "▸",
        subs: [
          {
            name: "Policy types: term, whole, universal",
            s: 79,
            num: "79",
            w: 600,
            note: "Weakest · start here",
            noteColor: "rubi",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Proficient",
            bColor: "steel",
            rubi: true,
            rubiCta: "Practice · 12 min"
          },
          {
            name: "Underwriting & insurable interest",
            s: 88,
            num: "88",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "green" }
              }
            ],
            bWord: "Ready",
            bColor: "green",
            rubi: false,
            rubiCta: ""
          },
          {
            name: "Owners & beneficiaries",
            s: 91,
            num: "91",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "green" }
              }
            ],
            bWord: "Ready",
            bColor: "green",
            rubi: false,
            rubiCta: ""
          }
        ],
        lessonList: [],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Policy Provisions",
        weight: "22% of exam",
        hasPie: true,
        pieLabel: "22% of the exam",
        pieStart: 79,
        pieEnd: 158,
        pLabel: "48 of 60 answered",
        hasCov: true,
        covPct: "80%",
        hasBand: true,
        noBand: false,
        bNote: "",
        segs: [
          {
            style: { weight: 40, tone: "edge" }
          },
          {
            style: { weight: 25, tone: "amber" }
          },
          {
            style: { weight: 20, tone: "steel-light" }
          },
          {
            style: { weight: 15, tone: "hairline" }
          }
        ],
        bWord: "Proficient",
        bColor: "steel",
        num: "79",
        last: "2 days ago",
        act: "Practice",
        isPrimary: false,
        isLink: true,
        aColor: "steel-deep",
        expanded: false,
        chev: "▸",
        subs: [
          {
            name: "Riders",
            s: 68,
            num: "68",
            w: 600,
            note: "Weakest · start here",
            noteColor: "rubi",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Proficient",
            bColor: "steel",
            rubi: true,
            rubiCta: "Practice · 12 min"
          },
          {
            name: "Nonforfeiture options",
            s: 76,
            num: "76",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Proficient",
            bColor: "steel",
            rubi: false,
            rubiCta: ""
          },
          {
            name: "Settlement options",
            s: 84,
            num: "84",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Proficient",
            bColor: "steel",
            rubi: false,
            rubiCta: ""
          },
          {
            name: "Grace period & reinstatement",
            s: 88,
            num: "88",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "green" }
              }
            ],
            bWord: "Ready",
            bColor: "green",
            rubi: false,
            rubiCta: ""
          }
        ],
        lessonList: [],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Annuities",
        weight: "20% of exam",
        hasPie: true,
        pieLabel: "20% of the exam",
        pieStart: 158,
        pieEnd: 230,
        pLabel: "44 of 55 answered",
        hasCov: true,
        covPct: "80%",
        hasBand: true,
        noBand: false,
        bNote: "",
        segs: [
          {
            style: { weight: 40, tone: "edge" }
          },
          {
            style: { weight: 25, tone: "amber" }
          },
          {
            style: { weight: 20, tone: "steel-light" }
          },
          {
            style: { weight: 15, tone: "hairline" }
          }
        ],
        bWord: "Proficient",
        bColor: "steel",
        num: "72",
        last: "Today",
        act: "Practice",
        isPrimary: true,
        isLink: false,
        aColor: "steel-deep",
        expanded: true,
        chev: "▾",
        subs: [
          {
            name: "Variable annuities",
            w: 600,
            note: "Weakest · start here",
            noteColor: "rubi",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "hairline" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Developing",
            bColor: "amber-deep",
            num: "64",
            rubi: true,
            rubiCta: "Practice · 12 min"
          },
          {
            name: "Annuity taxation",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Proficient",
            bColor: "steel",
            num: "75",
            rubi: false,
            rubiCta: ""
          },
          {
            name: "Fixed and indexed annuities",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Proficient",
            bColor: "steel",
            num: "76",
            rubi: false,
            rubiCta: ""
          }
        ],
        lessonList: [],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "rotate(90deg)",
        ariaExp: "true"
      },
      {
        name: "Health Insurance",
        weight: "18% of exam",
        hasPie: true,
        pieLabel: "18% of the exam",
        pieStart: 230,
        pieEnd: 295,
        pLabel: "38 of 45 answered",
        hasCov: true,
        covPct: "84%",
        hasBand: true,
        noBand: false,
        bNote: "",
        segs: [
          {
            style: { weight: 40, tone: "edge" }
          },
          {
            style: { weight: 25, tone: "amber" }
          },
          {
            style: { weight: 20, tone: "steel-light" }
          },
          {
            style: { weight: 15, tone: "hairline" }
          }
        ],
        bWord: "Proficient",
        bColor: "steel",
        num: "84",
        last: "5 days ago",
        act: "Practice",
        isPrimary: false,
        isLink: true,
        aColor: "steel-deep",
        expanded: false,
        chev: "▸",
        subs: [
          {
            name: "Disability income",
            s: 77,
            num: "77",
            w: 600,
            note: "Weakest · start here",
            noteColor: "rubi",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Proficient",
            bColor: "steel",
            rubi: true,
            rubiCta: "Practice · 12 min"
          },
          {
            name: "Medical expense plans",
            s: 86,
            num: "86",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "green" }
              }
            ],
            bWord: "Ready",
            bColor: "green",
            rubi: false,
            rubiCta: ""
          },
          {
            name: "Medicare & supplements",
            s: 89,
            num: "89",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "green" }
              }
            ],
            bWord: "Ready",
            bColor: "green",
            rubi: false,
            rubiCta: ""
          }
        ],
        lessonList: [],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Insurance Regulation",
        weight: "18% of exam",
        hasPie: true,
        pieLabel: "18% of the exam",
        pieStart: 295,
        pieEnd: 360,
        pLabel: "36 of 45 answered",
        hasCov: true,
        covPct: "80%",
        hasBand: true,
        noBand: false,
        bNote: "",
        segs: [
          {
            style: { weight: 40, tone: "edge" }
          },
          {
            style: { weight: 25, tone: "amber" }
          },
          {
            style: { weight: 20, tone: "steel-light" }
          },
          {
            style: { weight: 15, tone: "hairline" }
          }
        ],
        bWord: "Proficient",
        bColor: "steel",
        num: "80",
        last: "4 days ago",
        act: "Practice",
        isPrimary: false,
        isLink: true,
        aColor: "steel-deep",
        expanded: false,
        chev: "▸",
        subs: [
          {
            name: "Florida licensing rules",
            s: 73,
            num: "73",
            w: 600,
            note: "Weakest · start here",
            noteColor: "rubi",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Proficient",
            bColor: "steel",
            rubi: true,
            rubiCta: "Practice · 12 min"
          },
          {
            name: "Unfair trade practices",
            s: 82,
            num: "82",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Proficient",
            bColor: "steel",
            rubi: false,
            rubiCta: ""
          },
          {
            name: "Replacement & agent duties",
            s: 85,
            num: "85",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "green" }
              }
            ],
            bWord: "Ready",
            bColor: "green",
            rubi: false,
            rubiCta: ""
          }
        ],
        lessonList: [],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Exam Simulator",
        weight: "All topics · 3 full exams",
        hasPie: false,
        pieLabel: "",
        pieStart: 0,
        pieEnd: 0,
        pLabel: "1 of 3 taken",
        hasCov: false,
        covPct: "0%",
        hasBand: false,
        noBand: true,
        bNote: "Uses all topics",
        segs: [],
        bWord: "",
        bColor: "",
        num: "",
        last: "—",
        act: "Start",
        isPrimary: false,
        isLink: true,
        aColor: "steel-deep",
        expanded: false,
        chev: "",
        subs: [],
        lessonOpen: false,
        lessonList: [],
        ariaExp: "false",
        chevVis: "hidden",
        chevRot: "none"
      }
    ],
    uLayout: true,
    uReady: {
      has: true,
      none: false,
      p: 0.8150943396226416,
      s: 80,
      pillLabel: "Proficient",
      pillBg: "steel-edge",
      pillBorder: "steel",
      tri: {
        capSim: "round",
        capPrac: "round",
        capReady: "round",
        sim: "159.7 483.8",
        prac: "327.8 402.1",
        ready: "256.4 320.4",
        rColor: "steel-light",
        aria: "Exam Simulator 33%, practice coverage 82%, Readiness 80"
      }
    },
    uPath: [
      {
        label: "Readiness",
        value: "80% of 85% · 5 to Ready",
        dot: { weight: 0, tone: "steel-light", size: 12 },
        color: "ink",
        valColor: "body",
        hasBar: true,
        pct: "94%",
        barColor: "steel-light",
        hasLink: false,
        noLink: true,
        link: ""
      },
      {
        label: "Practice questions",
        value: "216 of 265 covered",
        dot: { weight: 0, tone: "steel", size: 12 },
        color: "ink",
        valColor: "body",
        hasBar: true,
        pct: "82%",
        barColor: "steel",
        hasLink: false,
        noLink: true,
        link: ""
      },
      {
        label: "Flashcards",
        value: "3 due",
        dot: { weight: 0, tone: "steel-light", size: 12 },
        color: "ink",
        valColor: "body",
        hasBar: false,
        pct: "0%",
        barColor: "steel",
        hasLink: false,
        noLink: true,
        link: ""
      },
      {
        label: "Exam Simulator (3)",
        value: "1 of 3 taken",
        dot: { weight: 0, tone: "violet", size: 12 },
        color: "ink",
        valColor: "body",
        hasBar: true,
        pct: "33%",
        barColor: "violet",
        hasLink: false,
        noLink: true,
        link: ""
      },
      {
        label: "Book your exam",
        value: "Ready (85%) in every topic · in Atlas",
        dot: { weight: 0, size: 10 },
        color: "muted",
        valColor: "muted",
        hasBar: false,
        pct: "0%",
        barColor: "steel",
        hasLink: false,
        noLink: true,
        link: ""
      }
    ],
    uBasis: "All five topics · blueprint-weighted · rings, outside in: simulator · practice · Readiness",
    hero: {
      border: "steel-edge",
      bg: "steel-wash",
      color: "steel-deep",
      done: false,
      eyebrow: "Course complete · Readiness 80%",
      title: "Prepare for the exam",
      sub: "Focus your study on the areas where you need the most practice.",
      nextLabel: "Recommended next",
      next: "Practice: Annuities · 13 to Ready",
      meta: "20 questions · about 20 min · biggest lift",
      cta: "Start practice",
      ctaBg: "steel-deep",
      alt: "Take an exam simulator"
    },
    showProgFull: false,
    showProgCompact: false,
    compactLines: [
      { k: "Lessons", v: "36 of 36 ✓" },
      { k: "Completed", v: "Sep 2" },
      { k: "Lessons stay open", v: "for review" }
    ],
    compactLink: "Review lessons",
    prog: {
      flex: "1 1 100%",
      pct: "100%",
      ringLab: "Complete",
      lessonsVal: "36 of 36 lessons · complete",
      lPct: "100%",
      hasSeat: false,
      seat: "0h of 60h required",
      note: "Course complete Sep 2. Lessons stay open for review.",
      hasSteps: false,
      steps: [],
      aria: "QE course 100% complete",
      dash: "314.2 314.2",
      ringColor: "green",
      cap: "butt"
    },
    showReady: false,
    ready: {
      flex: "2 1 520px",
      border: "hairline",
      bg: "white",
      isNew: false,
      isNone: false,
      isActive: true,
      noneSub: "",
      evidence: [],
      score: "80",
      word: "Proficient",
      color: "steel",
      toReady: "5 points to Ready (85%)",
      segs: [
        {
          style: { weight: 40, tone: "edge" }
        },
        {
          style: { weight: 25, tone: "amber" }
        },
        {
          style: { weight: 20, tone: "steel-light" }
        },
        {
          style: { weight: 15, tone: "hairline" }
        }
      ],
      marker: { tone: "ink", size: 2 },
      note: "Blueprint-weighted · from Exam Prep practice only. 1 of 5 topics Ready."
    },
    focus: {
      label: "Rubi recommends",
      title: "Annuities",
      why: "Your lowest topic at 72% and 20% of the exam. Two focused sessions should bring it close to Ready.",
      cta: "Practice Annuities · 20 min"
    },
    showTools: false,
    toolsTitle: "Continue preparing",
    tools: [
      {
        name: "Practice questions",
        desc: "Exam-style questions by topic. This is what builds Readiness.",
        icon: "M9 9a3 3 0 1 1 4 2.8c-.6.3-1 .9-1 1.6V15M12 18.5v.5M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20",
        status: "Open",
        statusColor: "green",
        border: "steel-edge",
        bg: "white",
        iconColor: "steel-deep"
      },
      {
        name: "Flashcards",
        desc: "Rubi builds sets from weak topics and cards you mark.",
        icon: "M3 7h13v12H3zM8 3h13v12",
        status: "Open",
        statusColor: "green",
        border: "steel-edge",
        bg: "white",
        iconColor: "steel-deep"
      },
      {
        name: "Exam Simulator",
        desc: "150 questions · 165 min · full exam conditions.",
        icon: "M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20M12 7v5l3 2",
        status: "Open",
        statusColor: "green",
        border: "steel-edge",
        bg: "white",
        iconColor: "steel-deep"
      }
    ],
    tableTitle: "Your prep by exam topic",
    tableNote: "Ready at 85% · from Exam Prep practice only · pie = share of the exam",
    colLessons: false,
    colReady: true,
    gate: "Course complete. Readiness stays your primary signal and comes from Exam Prep practice only.",
    nav: [
      {
        head: false,
        item: true,
        label: "Overview",
        rule: "steel-deep",
        weight: 600,
        color: "steel-deep",
        hasTag: false,
        tag: "",
        tagColor: ""
      },
      {
        head: false,
        item: true,
        label: "Learn",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: true,
        tag: "Complete",
        tagColor: "steel-deep"
      },
      {
        head: false,
        item: true,
        label: "Study planner",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: false,
        tag: "",
        tagColor: ""
      },
      {
        head: false,
        item: true,
        label: "Ask Rubi",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: false,
        tag: "",
        tagColor: ""
      },
      { head: true, item: false, label: "Exam prep" },
      {
        head: false,
        item: true,
        label: "Practice questions",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: true,
        tag: "Open",
        tagColor: "green"
      },
      {
        head: false,
        item: true,
        label: "Flashcards",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: true,
        tag: "Open",
        tagColor: "green"
      },
      {
        head: false,
        item: true,
        label: "Exam Simulator",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: true,
        tag: "Open",
        tagColor: "green"
      }
    ],
    metaLine: "Course complete Sep 2 · planned state exam [__]",
    summary: "1 of 5 topics Ready · Annuities is the biggest lift",
    rows: [
      {
        name: "Life Insurance",
        weight: "22% of exam · 8 lessons",
        nameColor: "ink",
        lessons: "8 of 8 · complete",
        lColor: "green",
        lPct: "100%",
        lBar: "green",
        hasBand: true,
        noBand: false,
        bNote: "Not enough data yet",
        segs: [
          {
            style: { weight: 40, tone: "edge" }
          },
          {
            style: { weight: 25, tone: "amber" }
          },
          {
            style: { weight: 20, tone: "steel-light" }
          },
          {
            style: { weight: 15, tone: "green" }
          }
        ],
        bWord: "Ready",
        bColor: "green",
        score: "86",
        act: "—",
        isPrimary: false,
        isLink: false,
        isText: true,
        aColor: "steel-deep",
        expanded: false,
        subs: [
          {
            name: "Policy types: term, whole, universal",
            s: 79,
            num: "79",
            w: 600,
            note: "Weakest · start here",
            noteColor: "rubi",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Proficient",
            bColor: "steel",
            rubi: true,
            rubiCta: "Practice · 12 min"
          },
          {
            name: "Underwriting & insurable interest",
            s: 88,
            num: "88",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "green" }
              }
            ],
            bWord: "Ready",
            bColor: "green",
            rubi: false,
            rubiCta: ""
          },
          {
            name: "Owners & beneficiaries",
            s: 91,
            num: "91",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "green" }
              }
            ],
            bWord: "Ready",
            bColor: "green",
            rubi: false,
            rubiCta: ""
          }
        ],
        chev: "▸",
        lessonList: [],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Policy Provisions",
        weight: "22% of exam · 8 lessons",
        nameColor: "ink",
        lessons: "8 of 8 · complete",
        lColor: "green",
        lPct: "100%",
        lBar: "green",
        hasBand: true,
        noBand: false,
        bNote: "Not enough data yet",
        segs: [
          {
            style: { weight: 40, tone: "edge" }
          },
          {
            style: { weight: 25, tone: "amber" }
          },
          {
            style: { weight: 20, tone: "steel-light" }
          },
          {
            style: { weight: 15, tone: "hairline" }
          }
        ],
        bWord: "Proficient",
        bColor: "steel",
        score: "79",
        act: "Practice",
        isPrimary: false,
        isLink: true,
        isText: false,
        aColor: "steel-deep",
        expanded: false,
        subs: [
          {
            name: "Riders",
            s: 68,
            num: "68",
            w: 600,
            note: "Weakest · start here",
            noteColor: "rubi",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Proficient",
            bColor: "steel",
            rubi: true,
            rubiCta: "Practice · 12 min"
          },
          {
            name: "Nonforfeiture options",
            s: 76,
            num: "76",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Proficient",
            bColor: "steel",
            rubi: false,
            rubiCta: ""
          },
          {
            name: "Settlement options",
            s: 84,
            num: "84",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Proficient",
            bColor: "steel",
            rubi: false,
            rubiCta: ""
          },
          {
            name: "Grace period & reinstatement",
            s: 88,
            num: "88",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "green" }
              }
            ],
            bWord: "Ready",
            bColor: "green",
            rubi: false,
            rubiCta: ""
          }
        ],
        chev: "▸",
        lessonList: [],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Annuities",
        weight: "20% of exam · 7 lessons",
        nameColor: "ink",
        lessons: "7 of 7 · complete",
        lColor: "green",
        lPct: "100%",
        lBar: "green",
        hasBand: true,
        noBand: false,
        bNote: "Not enough data yet",
        segs: [
          {
            style: { weight: 40, tone: "edge" }
          },
          {
            style: { weight: 25, tone: "amber" }
          },
          {
            style: { weight: 20, tone: "steel-light" }
          },
          {
            style: { weight: 15, tone: "hairline" }
          }
        ],
        bWord: "Proficient",
        bColor: "steel",
        score: "72",
        act: "Practice",
        isPrimary: true,
        isLink: false,
        isText: false,
        aColor: "steel-deep",
        expanded: true,
        subs: [
          {
            name: "Variable annuities",
            s: 64,
            w: 600,
            note: "Weakest · start here",
            noteColor: "amber-deep",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "hairline" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Developing",
            bColor: "amber-deep"
          },
          {
            name: "Fixed and indexed annuities",
            s: 76,
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Proficient",
            bColor: "steel"
          },
          {
            name: "Annuity taxation",
            s: 75,
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Proficient",
            bColor: "steel"
          }
        ],
        chev: "▾",
        lessonList: [],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "rotate(90deg)",
        ariaExp: "true"
      },
      {
        name: "Health Insurance",
        weight: "18% of exam · 7 lessons",
        nameColor: "ink",
        lessons: "7 of 7 · complete",
        lColor: "green",
        lPct: "100%",
        lBar: "green",
        hasBand: true,
        noBand: false,
        bNote: "Not enough data yet",
        segs: [
          {
            style: { weight: 40, tone: "edge" }
          },
          {
            style: { weight: 25, tone: "amber" }
          },
          {
            style: { weight: 20, tone: "steel-light" }
          },
          {
            style: { weight: 15, tone: "hairline" }
          }
        ],
        bWord: "Proficient",
        bColor: "steel",
        score: "84",
        act: "—",
        isPrimary: false,
        isLink: false,
        isText: true,
        aColor: "steel-deep",
        expanded: false,
        subs: [
          {
            name: "Disability income",
            s: 77,
            num: "77",
            w: 600,
            note: "Weakest · start here",
            noteColor: "rubi",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Proficient",
            bColor: "steel",
            rubi: true,
            rubiCta: "Practice · 12 min"
          },
          {
            name: "Medical expense plans",
            s: 86,
            num: "86",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "green" }
              }
            ],
            bWord: "Ready",
            bColor: "green",
            rubi: false,
            rubiCta: ""
          },
          {
            name: "Medicare & supplements",
            s: 89,
            num: "89",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "green" }
              }
            ],
            bWord: "Ready",
            bColor: "green",
            rubi: false,
            rubiCta: ""
          }
        ],
        chev: "▸",
        lessonList: [],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Insurance Regulation",
        weight: "18% of exam · 6 lessons",
        nameColor: "ink",
        lessons: "6 of 6 · complete",
        lColor: "green",
        lPct: "100%",
        lBar: "green",
        hasBand: true,
        noBand: false,
        bNote: "Not enough data yet",
        segs: [
          {
            style: { weight: 40, tone: "edge" }
          },
          {
            style: { weight: 25, tone: "amber" }
          },
          {
            style: { weight: 20, tone: "steel-light" }
          },
          {
            style: { weight: 15, tone: "hairline" }
          }
        ],
        bWord: "Proficient",
        bColor: "steel",
        score: "80",
        act: "—",
        isPrimary: false,
        isLink: false,
        isText: true,
        aColor: "steel-deep",
        expanded: false,
        subs: [
          {
            name: "Florida licensing rules",
            s: 73,
            num: "73",
            w: 600,
            note: "Weakest · start here",
            noteColor: "rubi",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Proficient",
            bColor: "steel",
            rubi: true,
            rubiCta: "Practice · 12 min"
          },
          {
            name: "Unfair trade practices",
            s: 82,
            num: "82",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Proficient",
            bColor: "steel",
            rubi: false,
            rubiCta: ""
          },
          {
            name: "Replacement & agent duties",
            s: 85,
            num: "85",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "green" }
              }
            ],
            bWord: "Ready",
            bColor: "green",
            rubi: false,
            rubiCta: ""
          }
        ],
        chev: "▸",
        lessonList: [],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      }
    ],
    navLocked: false,
    showSignalsRow: false,
    showFocusRow: false,
    stage: "u4"
  },
  u5: {
    hello: "Congratulations, Jordan",
    phase: "Ready to pass",
    pathway: "Open access · move freely",
    hasBanner: true,
    banner: {
      border: "green-edge",
      bg: "green-wash",
      color: "green",
      eyebrow: "Exam Simulator 2 · passed",
      items: [
        { n: "✓", text: "121 of 150 correct · 81% (70% to pass)" },
        { n: "✓", text: "Finished in 148 of 165 minutes, in one sitting" },
        { n: "✓", text: "Ready (85%) in all five topics" }
      ]
    },
    comboProg: false,
    comboProgLeft: true,
    comboReadyLeft: false,
    showFocusCard: false,
    hasTabs: true,
    tabs: [
      {
        label: "Readiness",
        sub: "85% · Ready · by topic and sub-topic",
        sel: "true",
        rule: "steel-deep",
        bg: "steel-wash",
        color: "ink",
        weight: 700
      },
      {
        label: "Course progress",
        sub: "100% · 36 of 36 lessons",
        sel: "false",
        rule: "transparent",
        bg: "transparent",
        color: "body",
        weight: 500
      }
    ],
    stdTable: false,
    prepTable: true,
    prows: [
      {
        name: "Life Insurance",
        weight: "22% of exam",
        hasPie: true,
        pieLabel: "22% of the exam",
        pieStart: 0,
        pieEnd: 79,
        pLabel: "56 of 60 answered",
        hasCov: true,
        covPct: "93%",
        hasBand: true,
        noBand: false,
        bNote: "",
        segs: [
          {
            style: { weight: 40, tone: "edge" }
          },
          {
            style: { weight: 25, tone: "amber" }
          },
          {
            style: { weight: 20, tone: "steel-light" }
          },
          {
            style: { weight: 15, tone: "green" }
          }
        ],
        bWord: "Ready",
        bColor: "green",
        num: "86",
        last: "2 days ago",
        act: "Practice",
        isPrimary: false,
        isLink: true,
        aColor: "steel-deep",
        expanded: false,
        chev: "▸",
        subs: [
          {
            name: "Policy types: term, whole, universal",
            s: 79,
            num: "79",
            w: 600,
            note: "Weakest · start here",
            noteColor: "rubi",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Proficient",
            bColor: "steel",
            rubi: true,
            rubiCta: "Practice · 12 min"
          },
          {
            name: "Underwriting & insurable interest",
            s: 88,
            num: "88",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "green" }
              }
            ],
            bWord: "Ready",
            bColor: "green",
            rubi: false,
            rubiCta: ""
          },
          {
            name: "Owners & beneficiaries",
            s: 91,
            num: "91",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "green" }
              }
            ],
            bWord: "Ready",
            bColor: "green",
            rubi: false,
            rubiCta: ""
          }
        ],
        lessonList: [],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Policy Provisions",
        weight: "22% of exam",
        hasPie: true,
        pieLabel: "22% of the exam",
        pieStart: 79,
        pieEnd: 158,
        pLabel: "55 of 60 answered",
        hasCov: true,
        covPct: "92%",
        hasBand: true,
        noBand: false,
        bNote: "",
        segs: [
          {
            style: { weight: 40, tone: "edge" }
          },
          {
            style: { weight: 25, tone: "amber" }
          },
          {
            style: { weight: 20, tone: "steel-light" }
          },
          {
            style: { weight: 15, tone: "green" }
          }
        ],
        bWord: "Ready",
        bColor: "green",
        num: "85",
        last: "Yesterday",
        act: "Practice",
        isPrimary: false,
        isLink: true,
        aColor: "steel-deep",
        expanded: false,
        chev: "▸",
        subs: [
          {
            name: "Riders",
            s: 74,
            num: "74",
            w: 600,
            note: "Weakest · start here",
            noteColor: "rubi",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Proficient",
            bColor: "steel",
            rubi: true,
            rubiCta: "Practice · 12 min"
          },
          {
            name: "Nonforfeiture options",
            s: 82,
            num: "82",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Proficient",
            bColor: "steel",
            rubi: false,
            rubiCta: ""
          },
          {
            name: "Settlement options",
            s: 90,
            num: "90",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "green" }
              }
            ],
            bWord: "Ready",
            bColor: "green",
            rubi: false,
            rubiCta: ""
          },
          {
            name: "Grace period & reinstatement",
            s: 94,
            num: "94",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "green" }
              }
            ],
            bWord: "Ready",
            bColor: "green",
            rubi: false,
            rubiCta: ""
          }
        ],
        lessonList: [],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Annuities",
        weight: "20% of exam",
        hasPie: true,
        pieLabel: "20% of the exam",
        pieStart: 158,
        pieEnd: 230,
        pLabel: "50 of 55 answered",
        hasCov: true,
        covPct: "91%",
        hasBand: true,
        noBand: false,
        bNote: "",
        segs: [
          {
            style: { weight: 40, tone: "edge" }
          },
          {
            style: { weight: 25, tone: "amber" }
          },
          {
            style: { weight: 20, tone: "steel-light" }
          },
          {
            style: { weight: 15, tone: "green" }
          }
        ],
        bWord: "Ready",
        bColor: "green",
        num: "85",
        last: "Today",
        act: "Practice",
        isPrimary: true,
        isLink: false,
        aColor: "steel-deep",
        expanded: true,
        chev: "▾",
        subs: [
          {
            name: "Variable annuities",
            w: 600,
            note: "Lowest · keep warm",
            noteColor: "rubi",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Proficient",
            bColor: "steel",
            num: "82",
            rubi: true,
            rubiCta: "Review · 8 min"
          },
          {
            name: "Annuity taxation",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "green" }
              }
            ],
            bWord: "Ready",
            bColor: "green",
            num: "86",
            rubi: false,
            rubiCta: ""
          },
          {
            name: "Fixed and indexed annuities",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "green" }
              }
            ],
            bWord: "Ready",
            bColor: "green",
            num: "88",
            rubi: false,
            rubiCta: ""
          }
        ],
        lessonList: [],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "rotate(90deg)",
        ariaExp: "true"
      },
      {
        name: "Health Insurance",
        weight: "18% of exam",
        hasPie: true,
        pieLabel: "18% of the exam",
        pieStart: 230,
        pieEnd: 295,
        pLabel: "42 of 45 answered",
        hasCov: true,
        covPct: "93%",
        hasBand: true,
        noBand: false,
        bNote: "",
        segs: [
          {
            style: { weight: 40, tone: "edge" }
          },
          {
            style: { weight: 25, tone: "amber" }
          },
          {
            style: { weight: 20, tone: "steel-light" }
          },
          {
            style: { weight: 15, tone: "green" }
          }
        ],
        bWord: "Ready",
        bColor: "green",
        num: "85",
        last: "3 days ago",
        act: "Practice",
        isPrimary: false,
        isLink: true,
        aColor: "steel-deep",
        expanded: false,
        chev: "▸",
        subs: [
          {
            name: "Disability income",
            s: 78,
            num: "78",
            w: 600,
            note: "Weakest · start here",
            noteColor: "rubi",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Proficient",
            bColor: "steel",
            rubi: true,
            rubiCta: "Practice · 12 min"
          },
          {
            name: "Medical expense plans",
            s: 87,
            num: "87",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "green" }
              }
            ],
            bWord: "Ready",
            bColor: "green",
            rubi: false,
            rubiCta: ""
          },
          {
            name: "Medicare & supplements",
            s: 90,
            num: "90",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "green" }
              }
            ],
            bWord: "Ready",
            bColor: "green",
            rubi: false,
            rubiCta: ""
          }
        ],
        lessonList: [],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Insurance Regulation",
        weight: "18% of exam",
        hasPie: true,
        pieLabel: "18% of the exam",
        pieStart: 295,
        pieEnd: 360,
        pLabel: "42 of 45 answered",
        hasCov: true,
        covPct: "93%",
        hasBand: true,
        noBand: false,
        bNote: "",
        segs: [
          {
            style: { weight: 40, tone: "edge" }
          },
          {
            style: { weight: 25, tone: "amber" }
          },
          {
            style: { weight: 20, tone: "steel-light" }
          },
          {
            style: { weight: 15, tone: "green" }
          }
        ],
        bWord: "Ready",
        bColor: "green",
        num: "86",
        last: "2 days ago",
        act: "Practice",
        isPrimary: false,
        isLink: true,
        aColor: "steel-deep",
        expanded: false,
        chev: "▸",
        subs: [
          {
            name: "Florida licensing rules",
            s: 79,
            num: "79",
            w: 600,
            note: "Weakest · start here",
            noteColor: "rubi",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Proficient",
            bColor: "steel",
            rubi: true,
            rubiCta: "Practice · 12 min"
          },
          {
            name: "Unfair trade practices",
            s: 88,
            num: "88",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "green" }
              }
            ],
            bWord: "Ready",
            bColor: "green",
            rubi: false,
            rubiCta: ""
          },
          {
            name: "Replacement & agent duties",
            s: 91,
            num: "91",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "green" }
              }
            ],
            bWord: "Ready",
            bColor: "green",
            rubi: false,
            rubiCta: ""
          }
        ],
        lessonList: [],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Exam Simulator",
        weight: "All topics · 3 full exams",
        hasPie: false,
        pieLabel: "",
        pieStart: 0,
        pieEnd: 0,
        pLabel: "2 of 3 taken · last passed 81%",
        hasCov: false,
        covPct: "0%",
        hasBand: false,
        noBand: true,
        bNote: "Uses all topics",
        segs: [],
        bWord: "",
        bColor: "",
        num: "",
        last: "—",
        act: "Start",
        isPrimary: false,
        isLink: true,
        aColor: "steel-deep",
        expanded: false,
        chev: "",
        subs: [],
        lessonOpen: false,
        lessonList: [],
        ariaExp: "false",
        chevVis: "hidden",
        chevRot: "none"
      }
    ],
    uLayout: true,
    uReady: {
      has: true,
      none: false,
      p: 0.9245283018867925,
      s: 85,
      pillLabel: "Ready",
      pillBg: "green-edge",
      pillBorder: "green-deep",
      tri: {
        capSim: "round",
        capPrac: "round",
        capReady: "round",
        sim: "324.1 483.8",
        prac: "371.8 402.1",
        ready: "272.4 320.4",
        rColor: "green",
        aria: "Exam Simulator 67%, practice coverage 92%, Readiness 85"
      }
    },
    uPath: [
      {
        label: "Readiness",
        value: "85% · Ready in all five topics",
        dot: { weight: 0, tone: "green", size: 12 },
        color: "ink",
        valColor: "body",
        hasBar: true,
        pct: "100%",
        barColor: "green",
        hasLink: false,
        noLink: true,
        link: ""
      },
      {
        label: "Practice questions",
        value: "245 of 265 covered",
        dot: { weight: 0, tone: "steel", size: 12 },
        color: "ink",
        valColor: "body",
        hasBar: true,
        pct: "92%",
        barColor: "green",
        hasLink: false,
        noLink: true,
        link: ""
      },
      {
        label: "Flashcards",
        value: "None due",
        dot: { weight: 0, tone: "steel-light", size: 12 },
        color: "ink",
        valColor: "body",
        hasBar: false,
        pct: "0%",
        barColor: "steel",
        hasLink: false,
        noLink: true,
        link: ""
      },
      {
        label: "Exam Simulator (3)",
        value: "2 of 3 · last passed 81%",
        dot: { weight: 0, tone: "violet", size: 12 },
        color: "ink",
        valColor: "body",
        hasBar: true,
        pct: "67%",
        barColor: "violet",
        hasLink: false,
        noLink: true,
        link: ""
      },
      {
        label: "Book your exam",
        value: "",
        dot: { weight: 0, tone: "white", size: 12 },
        color: "ink",
        valColor: "body",
        hasBar: false,
        pct: "0%",
        barColor: "steel",
        hasLink: true,
        noLink: false,
        link: "Book Now"
      }
    ],
    uBasis: "All five topics at 85% or above · blueprint-weighted · rings, outside in: simulator · practice · Readiness",
    hero: {
      border: "green-edge",
      bg: "green-wash",
      color: "green",
      done: true,
      eyebrow: "Readiness 85% · Ready",
      title: "You’re ready to pass",
      sub: "Every topic is at Ready and you passed a full simulated exam. Book your Florida state exam in Atlas.",
      nextLabel: "Your next step",
      next: "Book your state exam",
      meta: "Booking lives in Atlas · about 3 minutes",
      cta: "Book Now",
      ctaBg: "green",
      alt: "Take Simulator 3 first"
    },
    showProgFull: false,
    showProgCompact: false,
    compactLines: [],
    compactLink: "View certificate",
    prog: {
      flex: "1 1 100%",
      pct: "100%",
      ringLab: "Complete",
      lessonsVal: "36 of 36 lessons · complete",
      lPct: "100%",
      hasSeat: false,
      seat: "0h of 60h required",
      note: "Course complete Sep 2. Lessons stay open for review.",
      hasSteps: false,
      steps: [],
      aria: "QE course 100% complete",
      dash: "314.2 314.2",
      ringColor: "green",
      cap: "butt"
    },
    showReady: false,
    ready: {
      flex: "1 1 380px",
      border: "hairline",
      bg: "white",
      isNew: false,
      isNone: true,
      isActive: false,
      noneSub: "",
      evidence: [],
      score: "",
      word: "",
      color: "",
      toReady: "",
      segs: [],
      marker: "",
      note: ""
    },
    focus: {
      label: "Rubi recommends",
      title: "Keep it warm until exam day",
      why: "Policy Provisions, Annuities and Health Insurance sit right at 85%. Short spaced reviews keep them there. Take Simulator 3 the day before your exam.",
      cta: "Spaced review · 8 min"
    },
    showTools: false,
    toolsTitle: "Continue preparing",
    tools: [
      {
        name: "Practice questions",
        desc: "Exam-style questions by topic. This is what builds Readiness.",
        icon: "M9 9a3 3 0 1 1 4 2.8c-.6.3-1 .9-1 1.6V15M12 18.5v.5M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20",
        status: "Open",
        statusColor: "green",
        border: "steel-edge",
        bg: "white",
        iconColor: "steel-deep"
      },
      {
        name: "Flashcards",
        desc: "Rubi builds sets from weak topics and cards you mark.",
        icon: "M3 7h13v12H3zM8 3h13v12",
        status: "Open",
        statusColor: "green",
        border: "steel-edge",
        bg: "white",
        iconColor: "steel-deep"
      },
      {
        name: "Exam Simulator",
        desc: "150 questions · 165 min · full exam conditions.",
        icon: "M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20M12 7v5l3 2",
        status: "Open",
        statusColor: "green",
        border: "steel-edge",
        bg: "white",
        iconColor: "steel-deep"
      }
    ],
    tableTitle: "Your prep by exam topic",
    tableNote: "Ready at 85% · from Exam Prep practice only · pie = share of the exam",
    colLessons: false,
    colReady: true,
    gate: "Booking happens in Atlas and is open because every topic is at Ready (85%). Readiness comes from Exam Prep practice only.",
    nav: [
      {
        head: false,
        item: true,
        label: "Overview",
        rule: "steel-deep",
        weight: 600,
        color: "steel-deep",
        hasTag: false,
        tag: "",
        tagColor: ""
      },
      {
        head: false,
        item: true,
        label: "Learn",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: true,
        tag: "Complete",
        tagColor: "steel-deep"
      },
      {
        head: false,
        item: true,
        label: "Study planner",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: false,
        tag: "",
        tagColor: ""
      },
      {
        head: false,
        item: true,
        label: "Ask Rubi",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: false,
        tag: "",
        tagColor: ""
      },
      { head: true, item: false, label: "Exam prep" },
      {
        head: false,
        item: true,
        label: "Practice questions",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: true,
        tag: "Ready",
        tagColor: "green"
      },
      {
        head: false,
        item: true,
        label: "Flashcards",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: true,
        tag: "Ready",
        tagColor: "green"
      },
      {
        head: false,
        item: true,
        label: "Exam Simulator",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: true,
        tag: "Ready",
        tagColor: "green"
      }
    ],
    metaLine: "Exam Simulator 2 passed Oct 26 · planned state exam [__]",
    summary: "All 5 topics Ready · Annuities is closest to the line",
    rows: [
      {
        name: "Life Insurance",
        weight: "22% of exam · 8 lessons",
        nameColor: "ink",
        lessons: "8 of 8 · complete",
        lColor: "green",
        lPct: "100%",
        lBar: "green",
        hasBand: true,
        noBand: false,
        bNote: "Not enough data yet",
        segs: [
          {
            style: { weight: 40, tone: "edge" }
          },
          {
            style: { weight: 25, tone: "amber" }
          },
          {
            style: { weight: 20, tone: "steel-light" }
          },
          {
            style: { weight: 15, tone: "green" }
          }
        ],
        bWord: "Ready",
        bColor: "green",
        score: "86",
        act: "—",
        isPrimary: false,
        isLink: false,
        isText: true,
        aColor: "steel-deep",
        expanded: false,
        subs: [
          {
            name: "Policy types: term, whole, universal",
            s: 79,
            num: "79",
            w: 600,
            note: "Weakest · start here",
            noteColor: "rubi",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Proficient",
            bColor: "steel",
            rubi: true,
            rubiCta: "Practice · 12 min"
          },
          {
            name: "Underwriting & insurable interest",
            s: 88,
            num: "88",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "green" }
              }
            ],
            bWord: "Ready",
            bColor: "green",
            rubi: false,
            rubiCta: ""
          },
          {
            name: "Owners & beneficiaries",
            s: 91,
            num: "91",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "green" }
              }
            ],
            bWord: "Ready",
            bColor: "green",
            rubi: false,
            rubiCta: ""
          }
        ],
        chev: "▸",
        lessonList: [],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Policy Provisions",
        weight: "22% of exam · 8 lessons",
        nameColor: "ink",
        lessons: "8 of 8 · complete",
        lColor: "green",
        lPct: "100%",
        lBar: "green",
        hasBand: true,
        noBand: false,
        bNote: "Not enough data yet",
        segs: [
          {
            style: { weight: 40, tone: "edge" }
          },
          {
            style: { weight: 25, tone: "amber" }
          },
          {
            style: { weight: 20, tone: "steel-light" }
          },
          {
            style: { weight: 15, tone: "green" }
          }
        ],
        bWord: "Ready",
        bColor: "green",
        score: "85",
        act: "—",
        isPrimary: false,
        isLink: false,
        isText: true,
        aColor: "steel-deep",
        expanded: false,
        subs: [
          {
            name: "Riders",
            s: 74,
            num: "74",
            w: 600,
            note: "Weakest · start here",
            noteColor: "rubi",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Proficient",
            bColor: "steel",
            rubi: true,
            rubiCta: "Practice · 12 min"
          },
          {
            name: "Nonforfeiture options",
            s: 82,
            num: "82",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Proficient",
            bColor: "steel",
            rubi: false,
            rubiCta: ""
          },
          {
            name: "Settlement options",
            s: 90,
            num: "90",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "green" }
              }
            ],
            bWord: "Ready",
            bColor: "green",
            rubi: false,
            rubiCta: ""
          },
          {
            name: "Grace period & reinstatement",
            s: 94,
            num: "94",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "green" }
              }
            ],
            bWord: "Ready",
            bColor: "green",
            rubi: false,
            rubiCta: ""
          }
        ],
        chev: "▸",
        lessonList: [],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Annuities",
        weight: "20% of exam · 7 lessons",
        nameColor: "ink",
        lessons: "7 of 7 · complete",
        lColor: "green",
        lPct: "100%",
        lBar: "green",
        hasBand: true,
        noBand: false,
        bNote: "Not enough data yet",
        segs: [
          {
            style: { weight: 40, tone: "edge" }
          },
          {
            style: { weight: 25, tone: "amber" }
          },
          {
            style: { weight: 20, tone: "steel-light" }
          },
          {
            style: { weight: 15, tone: "green" }
          }
        ],
        bWord: "Ready",
        bColor: "green",
        score: "85",
        act: "—",
        isPrimary: false,
        isLink: false,
        isText: true,
        aColor: "steel-deep",
        expanded: false,
        subs: [
          {
            name: "Variable annuities",
            s: 78,
            num: "78",
            w: 600,
            note: "Weakest · start here",
            noteColor: "rubi",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Proficient",
            bColor: "steel",
            rubi: true,
            rubiCta: "Practice · 12 min"
          },
          {
            name: "Annuity taxation",
            s: 87,
            num: "87",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "green" }
              }
            ],
            bWord: "Ready",
            bColor: "green",
            rubi: false,
            rubiCta: ""
          },
          {
            name: "Fixed and indexed annuities",
            s: 90,
            num: "90",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "green" }
              }
            ],
            bWord: "Ready",
            bColor: "green",
            rubi: false,
            rubiCta: ""
          }
        ],
        chev: "▸",
        lessonList: [],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Health Insurance",
        weight: "18% of exam · 7 lessons",
        nameColor: "ink",
        lessons: "7 of 7 · complete",
        lColor: "green",
        lPct: "100%",
        lBar: "green",
        hasBand: true,
        noBand: false,
        bNote: "Not enough data yet",
        segs: [
          {
            style: { weight: 40, tone: "edge" }
          },
          {
            style: { weight: 25, tone: "amber" }
          },
          {
            style: { weight: 20, tone: "steel-light" }
          },
          {
            style: { weight: 15, tone: "green" }
          }
        ],
        bWord: "Ready",
        bColor: "green",
        score: "85",
        act: "—",
        isPrimary: false,
        isLink: false,
        isText: true,
        aColor: "steel-deep",
        expanded: false,
        subs: [
          {
            name: "Disability income",
            s: 78,
            num: "78",
            w: 600,
            note: "Weakest · start here",
            noteColor: "rubi",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Proficient",
            bColor: "steel",
            rubi: true,
            rubiCta: "Practice · 12 min"
          },
          {
            name: "Medical expense plans",
            s: 87,
            num: "87",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "green" }
              }
            ],
            bWord: "Ready",
            bColor: "green",
            rubi: false,
            rubiCta: ""
          },
          {
            name: "Medicare & supplements",
            s: 90,
            num: "90",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "green" }
              }
            ],
            bWord: "Ready",
            bColor: "green",
            rubi: false,
            rubiCta: ""
          }
        ],
        chev: "▸",
        lessonList: [],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Insurance Regulation",
        weight: "18% of exam · 6 lessons",
        nameColor: "ink",
        lessons: "6 of 6 · complete",
        lColor: "green",
        lPct: "100%",
        lBar: "green",
        hasBand: true,
        noBand: false,
        bNote: "Not enough data yet",
        segs: [
          {
            style: { weight: 40, tone: "edge" }
          },
          {
            style: { weight: 25, tone: "amber" }
          },
          {
            style: { weight: 20, tone: "steel-light" }
          },
          {
            style: { weight: 15, tone: "green" }
          }
        ],
        bWord: "Ready",
        bColor: "green",
        score: "86",
        act: "—",
        isPrimary: false,
        isLink: false,
        isText: true,
        aColor: "steel-deep",
        expanded: false,
        subs: [
          {
            name: "Florida licensing rules",
            s: 79,
            num: "79",
            w: 600,
            note: "Weakest · start here",
            noteColor: "rubi",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Proficient",
            bColor: "steel",
            rubi: true,
            rubiCta: "Practice · 12 min"
          },
          {
            name: "Unfair trade practices",
            s: 88,
            num: "88",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "green" }
              }
            ],
            bWord: "Ready",
            bColor: "green",
            rubi: false,
            rubiCta: ""
          },
          {
            name: "Replacement & agent duties",
            s: 91,
            num: "91",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "green" }
              }
            ],
            bWord: "Ready",
            bColor: "green",
            rubi: false,
            rubiCta: ""
          }
        ],
        chev: "▸",
        lessonList: [],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      }
    ],
    navLocked: false,
    showSignalsRow: false,
    showFocusRow: false,
    stage: "u5"
  }
}

export const PREP_STAGES: Record<string, PrepStage> = {
  p1: {
    hello: "Let’s establish your Readiness. Complete practice questions to see where you’re strong and where to focus.",
    nav: [
      {
        head: false,
        item: true,
        label: "Overview",
        rule: "steel-deep",
        weight: 600,
        color: "steel-deep",
        hasTag: false,
        tag: "",
        tagColor: ""
      },
      {
        head: false,
        item: true,
        label: "Learn",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: true,
        tag: "Review",
        tagColor: "muted"
      },
      {
        head: false,
        item: true,
        label: "Study planner",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: false,
        tag: "",
        tagColor: ""
      },
      {
        head: false,
        item: true,
        label: "Ask Rubi",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: false,
        tag: "",
        tagColor: ""
      },
      { head: true, item: false, label: "Exam prep" },
      {
        head: false,
        item: true,
        label: "Practice questions",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: false,
        tag: "",
        tagColor: ""
      },
      {
        head: false,
        item: true,
        label: "Flashcards",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: false,
        tag: "",
        tagColor: ""
      },
      {
        head: false,
        item: true,
        label: "Exam Simulator",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: true,
        tag: "After Readiness",
        tagColor: "muted"
      }
    ],
    metaLine: "Exam Prep · access ends Jan 20, 2027",
    phase: "Exam Prep · Building readiness",
    nextLabel: "Recommended next",
    nextTitle: "Practice set · Health Insurance + Insurance Regulation",
    nextSub: "20 questions · about 20 min",
    hasGoal: false,
    goalLead: "",
    goalFrom: {
      segs: [],
      word: "",
      color: ""
    },
    goalTo: { word: "", color: "" },
    nextCovers: "The two topics with no answers yet",
    weekLine: "Readiness shows once each topic has enough answers ([__] per topic, to confirm). Course lessons don’t count toward it.",
    ctaLabel: "Start practice",
    ctaAlt: "Flashcards instead",
    ring: {
      has: false,
      none: true,
      p: 0.06792452830188679,
      tri: {
        capSim: "butt",
        capPrac: "round",
        capReady: "butt",
        sim: "0.0 483.8",
        prac: "27.3 402.1",
        ready: "0.0 320.4",
        rColor: "transparent",
        aria: "Exam Simulator 0%, practice coverage 7%, Readiness not enough data yet"
      }
    },
    basis: "Starts with your first practice answer · blueprint-weighted once every topic has enough evidence",
    path: [
      {
        label: "Readiness",
        value: "Not enough data yet",
        dot: { weight: 0, tone: "steel-deep", size: 12 },
        color: "ink",
        valColor: "body",
        hasBar: false,
        pct: "0%",
        barColor: "steel",
        hasLink: false,
        noLink: true,
        link: ""
      },
      {
        label: "Practice questions",
        value: "18 answered · 3 of 5 topics",
        dot: { weight: 0, tone: "steel", size: 12 },
        color: "ink",
        valColor: "body",
        hasBar: true,
        pct: "7%",
        barColor: "steel",
        hasLink: false,
        noLink: true,
        link: ""
      },
      {
        label: "Flashcards",
        value: "Open",
        dot: { weight: 0, tone: "steel-light", size: 12 },
        color: "ink",
        valColor: "body",
        hasBar: false,
        pct: "0%",
        barColor: "steel",
        hasLink: false,
        noLink: true,
        link: ""
      },
      {
        label: "Exam Simulator (3)",
        value: "Opens once Readiness is set [to confirm]",
        dot: { weight: 0, size: 12 },
        color: "muted",
        valColor: "muted",
        hasBar: false,
        pct: "0%",
        barColor: "violet",
        hasLink: false,
        noLink: true,
        link: ""
      },
      {
        label: "Book your exam",
        value: "Ready (85%) in every topic · in Atlas",
        dot: { weight: 0, size: 10 },
        color: "muted",
        valColor: "muted",
        hasBar: false,
        pct: "0%",
        barColor: "steel",
        hasLink: false,
        noLink: true,
        link: ""
      }
    ],
    rubi: {
      path: "Health Insurance + Insurance Regulation",
      title: "Fill the gaps first",
      why: "These two topics have no answers yet. One mixed set covers both and gets your Readiness started sooner. Exam-style questions are harder than lesson checks, so a lower start is normal.",
      effectTitle: "Then",
      effect: "Evidence in all five topics",
      cta: "Start the mixed set · 20 min"
    },
    summary: "Practice answers in 3 of 5 topics · not enough data to score yet",
    rows: [
      {
        name: "Life Insurance",
        weight: "22% of exam",
        nameColor: "ink",
        pLabel: "8 of 60 answered",
        pColor: "ink",
        hasCov: true,
        covPct: "13%",
        hasBand: false,
        noBand: true,
        bNote: "More answers needed",
        bNoteColor: "muted",
        segs: [],
        bWord: "",
        bColor: "",
        num: "",
        last: "1 day ago",
        act: "Practice",
        isPrimary: false,
        isLink: true,
        aColor: "steel-deep",
        locked: false,
        lockNote: "",
        expanded: false,
        subs: [],
        chev: "",
        hasPie: true,
        pieLabel: "22% of the exam",
        pieStart: 0,
        pieEnd: 79,
        lessonList: [],
        lessonOpen: false,
        chevVis: "hidden",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Policy Provisions",
        weight: "22% of exam",
        nameColor: "ink",
        pLabel: "6 of 60 answered",
        pColor: "ink",
        hasCov: true,
        covPct: "10%",
        hasBand: false,
        noBand: true,
        bNote: "More answers needed",
        bNoteColor: "muted",
        segs: [],
        bWord: "",
        bColor: "",
        num: "",
        last: "1 day ago",
        act: "Practice",
        isPrimary: false,
        isLink: true,
        aColor: "steel-deep",
        locked: false,
        lockNote: "",
        expanded: false,
        subs: [],
        chev: "",
        hasPie: true,
        pieLabel: "22% of the exam",
        pieStart: 79,
        pieEnd: 158,
        lessonList: [],
        lessonOpen: false,
        chevVis: "hidden",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Annuities",
        weight: "20% of exam",
        nameColor: "ink",
        pLabel: "4 of 55 answered",
        pColor: "ink",
        hasCov: true,
        covPct: "7%",
        hasBand: false,
        noBand: true,
        bNote: "More answers needed",
        bNoteColor: "muted",
        segs: [],
        bWord: "",
        bColor: "",
        num: "",
        last: "Today",
        act: "Practice",
        isPrimary: false,
        isLink: true,
        aColor: "steel-deep",
        locked: false,
        lockNote: "",
        expanded: false,
        subs: [],
        chev: "",
        hasPie: true,
        pieLabel: "20% of the exam",
        pieStart: 158,
        pieEnd: 230,
        lessonList: [],
        lessonOpen: false,
        chevVis: "hidden",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Health Insurance",
        weight: "18% of exam",
        nameColor: "body",
        pLabel: "None yet",
        pColor: "muted",
        hasCov: true,
        covPct: "0%",
        hasBand: false,
        noBand: true,
        bNote: "None yet · start here",
        bNoteColor: "amber-deep",
        segs: [],
        bWord: "",
        bColor: "",
        num: "",
        last: "—",
        act: "Practice",
        isPrimary: true,
        isLink: false,
        aColor: "steel-deep",
        locked: false,
        lockNote: "",
        expanded: false,
        subs: [],
        chev: "",
        hasPie: true,
        pieLabel: "18% of the exam",
        pieStart: 230,
        pieEnd: 295,
        lessonList: [],
        lessonOpen: false,
        chevVis: "hidden",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Insurance Regulation",
        weight: "18% of exam",
        nameColor: "body",
        pLabel: "None yet",
        pColor: "muted",
        hasCov: true,
        covPct: "0%",
        hasBand: false,
        noBand: true,
        bNote: "None yet · start here",
        bNoteColor: "amber-deep",
        segs: [],
        bWord: "",
        bColor: "",
        num: "",
        last: "—",
        act: "Practice",
        isPrimary: false,
        isLink: true,
        aColor: "steel-deep",
        locked: false,
        lockNote: "",
        expanded: false,
        subs: [],
        chev: "",
        hasPie: true,
        pieLabel: "18% of the exam",
        pieStart: 295,
        pieEnd: 360,
        lessonList: [],
        lessonOpen: false,
        chevVis: "hidden",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Exam Simulator",
        weight: "All topics · 3 full exams",
        nameColor: "ink",
        pLabel: "0 of 3 taken",
        pColor: "body",
        hasCov: false,
        covPct: "0%",
        hasBand: false,
        noBand: true,
        bNote: "Uses all topics",
        bNoteColor: "muted",
        segs: [],
        bWord: "",
        bColor: "",
        num: "",
        last: "—",
        act: "",
        isPrimary: false,
        isLink: false,
        aColor: "steel-deep",
        locked: true,
        lockNote: "Opens once Readiness is set",
        expanded: false,
        subs: [],
        chev: "",
        hasPie: false,
        pieLabel: "",
        lessonOpen: false,
        lessonList: [],
        ariaExp: "false",
        chevVis: "hidden",
        chevRot: "none"
      }
    ],
    evNote: "Not enough answers yet",
    noEvidence: true,
    evidence: [],
    gate: "Readiness comes from Exam Prep practice only; your course lessons don’t feed it. Booking (in Atlas) opens when every topic reaches Ready (85%).",
    stage: "p1",
    navLocked: false
  },
  p2: {
    hello: "You’re building exam readiness. Focus your study on the areas where you need the most practice.",
    nav: [
      {
        head: false,
        item: true,
        label: "Overview",
        rule: "steel-deep",
        weight: 600,
        color: "steel-deep",
        hasTag: false,
        tag: "",
        tagColor: ""
      },
      {
        head: false,
        item: true,
        label: "Learn",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: true,
        tag: "Review",
        tagColor: "muted"
      },
      {
        head: false,
        item: true,
        label: "Study planner",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: false,
        tag: "",
        tagColor: ""
      },
      {
        head: false,
        item: true,
        label: "Ask Rubi",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: false,
        tag: "",
        tagColor: ""
      },
      { head: true, item: false, label: "Exam prep" },
      {
        head: false,
        item: true,
        label: "Practice questions",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: false,
        tag: "",
        tagColor: ""
      },
      {
        head: false,
        item: true,
        label: "Flashcards",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: true,
        tag: "12 due",
        tagColor: "amber-deep"
      },
      {
        head: false,
        item: true,
        label: "Exam Simulator",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: true,
        tag: "Open",
        tagColor: "green"
      }
    ],
    metaLine: "Planned state exam Aug 14 · 16 days out",
    phase: "Exam Prep · Readiness 58%",
    nextLabel: "Recommended next · Tonight, Wed Jul 29",
    nextTitle: "Practice: Policy Provisions · riders",
    nextSub: "20 questions · about 25 min",
    hasGoal: true,
    goalLead: "Aims to move",
    goalFrom: {
      word: "Developing",
      color: "amber-deep",
      segs: [
        {
          style: { weight: 40, tone: "edge" }
        },
        {
          style: { weight: 25, tone: "amber" }
        },
        {
          style: { weight: 20, tone: "hairline" }
        },
        {
          style: { weight: 15, tone: "hairline" }
        }
      ]
    },
    goalTo: { word: "Proficient", color: "steel" },
    nextCovers: "Riders · Nonforfeiture options",
    weekLine: "Your biggest lift: 22% of the exam and your lowest topic. Readiness comes from Exam Prep practice only.",
    ctaLabel: "Start practice",
    ctaAlt: "Can’t study tonight",
    ring: {
      has: true,
      none: false,
      p: 0.4981132075471698,
      s: 58,
      tri: {
        capSim: "butt",
        capPrac: "round",
        capReady: "round",
        sim: "0.0 483.8",
        prac: "200.3 402.1",
        ready: "185.9 320.4",
        rColor: "amber",
        aria: "Exam Simulator 0%, practice coverage 50%, Readiness 58"
      },
      pillLabel: "Developing",
      pillBg: "amber-wash",
      pillBorder: "amber-edge"
    },
    basis: "All five topics · blueprint-weighted · rings, outside in: simulator · practice · Readiness",
    path: [
      {
        label: "Readiness",
        value: "58% of 85% · 27 to Ready",
        dot: { weight: 0, tone: "amber", size: 12 },
        color: "ink",
        valColor: "body",
        hasBar: true,
        pct: "68%",
        barColor: "amber",
        hasLink: false,
        noLink: true,
        link: ""
      },
      {
        label: "Practice questions",
        value: "132 of 265 covered",
        dot: { weight: 0, tone: "steel", size: 12 },
        color: "ink",
        valColor: "body",
        hasBar: true,
        pct: "50%",
        barColor: "steel",
        hasLink: false,
        noLink: true,
        link: ""
      },
      {
        label: "Flashcards",
        value: "12 due",
        dot: { weight: 0, tone: "steel-light", size: 12 },
        color: "ink",
        valColor: "body",
        hasBar: false,
        pct: "0%",
        barColor: "steel",
        hasLink: false,
        noLink: true,
        link: ""
      },
      {
        label: "Exam Simulator (3)",
        value: "0 of 3 · open",
        dot: { weight: 0, tone: "violet", size: 12 },
        color: "ink",
        valColor: "body",
        hasBar: true,
        pct: "0%",
        barColor: "violet",
        hasLink: false,
        noLink: true,
        link: ""
      },
      {
        label: "Book your exam",
        value: "Ready (85%) in every topic · in Atlas",
        dot: { weight: 0, size: 10 },
        color: "muted",
        valColor: "muted",
        hasBar: false,
        pct: "0%",
        barColor: "steel",
        hasLink: false,
        noLink: true,
        link: ""
      }
    ],
    rubi: {
      path: "Policy Provisions › Riders",
      title: "Close the confidence gap on riders",
      why: "You marked 6 of 8 rider questions sure and got 3 right. Confident misses cost the most on exam day.",
      effectTitle: "If you get 7 of 10",
      effect: "Riders → Developing",
      cta: "Practice riders · 12 min"
    },
    summary: "0 of 5 topics Ready · Policy Provisions is the biggest lift",
    rows: [
      {
        name: "Life Insurance",
        weight: "22% of exam",
        nameColor: "ink",
        pLabel: "24 of 60 answered",
        pColor: "ink",
        hasCov: true,
        covPct: "40%",
        hasBand: true,
        noBand: false,
        bNote: "",
        bNoteColor: "muted",
        segs: [
          {
            style: { weight: 40, tone: "edge" }
          },
          {
            style: { weight: 25, tone: "amber" }
          },
          {
            style: { weight: 20, tone: "steel-light" }
          },
          {
            style: { weight: 15, tone: "hairline" }
          }
        ],
        bWord: "Proficient",
        bColor: "steel",
        num: "71",
        last: "9 days ago",
        act: "Practice",
        isPrimary: false,
        isLink: true,
        aColor: "steel-deep",
        locked: false,
        lockNote: "",
        expanded: false,
        subs: [
          {
            name: "Policy types: term, whole, universal",
            s: 64,
            num: "64",
            w: 600,
            note: "Weakest · start here",
            noteColor: "rubi",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "hairline" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Developing",
            bColor: "amber-deep",
            rubi: true,
            rubiCta: "Practice · 12 min"
          },
          {
            name: "Underwriting & insurable interest",
            s: 73,
            num: "73",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Proficient",
            bColor: "steel",
            rubi: false,
            rubiCta: ""
          },
          {
            name: "Owners & beneficiaries",
            s: 76,
            num: "76",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Proficient",
            bColor: "steel",
            rubi: false,
            rubiCta: ""
          }
        ],
        chev: "▸",
        hasPie: true,
        pieLabel: "22% of the exam",
        pieStart: 0,
        pieEnd: 79,
        lessonList: [],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Policy Provisions",
        weight: "22% of exam",
        nameColor: "ink",
        pLabel: "36 of 60 answered",
        pColor: "ink",
        hasCov: true,
        covPct: "60%",
        hasBand: true,
        noBand: false,
        bNote: "",
        bNoteColor: "muted",
        segs: [
          {
            style: { weight: 40, tone: "edge" }
          },
          {
            style: { weight: 25, tone: "amber" }
          },
          {
            style: { weight: 20, tone: "hairline" }
          },
          {
            style: { weight: 15, tone: "hairline" }
          }
        ],
        bWord: "Developing",
        bColor: "amber-deep",
        num: "47",
        last: "1 day ago",
        act: "Practice",
        isPrimary: true,
        isLink: false,
        aColor: "steel-deep",
        locked: false,
        lockNote: "",
        expanded: true,
        subs: [
          {
            name: "Riders (waiver, accidental death, GIO)",
            w: 600,
            note: "3 of 8 right · 6 marked sure",
            noteColor: "rubi",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "hairline" }
              },
              {
                style: { weight: 20, tone: "hairline" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Beginner",
            bColor: "body",
            num: "36",
            rubi: true,
            rubiCta: "Practice · 12 min"
          },
          {
            name: "Nonforfeiture options",
            w: 400,
            note: "Cash vs. reduced paid-up mixed up twice",
            noteColor: "amber-deep",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "hairline" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Developing",
            bColor: "amber-deep",
            num: "44",
            rubi: true,
            rubiCta: "Explain it"
          },
          {
            name: "Settlement options",
            w: 400,
            note: "4 of 7 right",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "hairline" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Developing",
            bColor: "amber-deep",
            num: "52",
            rubi: false,
            rubiCta: ""
          },
          {
            name: "Grace period & reinstatement",
            w: 400,
            note: "Steady",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Proficient",
            bColor: "steel",
            num: "71",
            rubi: false,
            rubiCta: ""
          }
        ],
        chev: "▾",
        hasPie: true,
        pieLabel: "22% of the exam",
        pieStart: 79,
        pieEnd: 158,
        lessonList: [],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "rotate(90deg)",
        ariaExp: "true"
      },
      {
        name: "Annuities",
        weight: "20% of exam",
        nameColor: "ink",
        pLabel: "30 of 55 answered",
        pColor: "ink",
        hasCov: true,
        covPct: "55%",
        hasBand: true,
        noBand: false,
        bNote: "",
        bNoteColor: "muted",
        segs: [
          {
            style: { weight: 40, tone: "edge" }
          },
          {
            style: { weight: 25, tone: "amber" }
          },
          {
            style: { weight: 20, tone: "hairline" }
          },
          {
            style: { weight: 15, tone: "hairline" }
          }
        ],
        bWord: "Developing",
        bColor: "amber-deep",
        num: "50",
        last: "3 days ago",
        act: "Practice",
        isPrimary: false,
        isLink: true,
        aColor: "rubi",
        locked: false,
        lockNote: "",
        expanded: false,
        subs: [
          {
            name: "Variable annuities",
            s: 43,
            num: "43",
            w: 600,
            note: "Weakest · start here",
            noteColor: "rubi",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "hairline" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Developing",
            bColor: "amber-deep",
            rubi: true,
            rubiCta: "Practice · 12 min"
          },
          {
            name: "Annuity taxation",
            s: 52,
            num: "52",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "hairline" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Developing",
            bColor: "amber-deep",
            rubi: false,
            rubiCta: ""
          },
          {
            name: "Fixed and indexed annuities",
            s: 55,
            num: "55",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "hairline" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Developing",
            bColor: "amber-deep",
            rubi: false,
            rubiCta: ""
          }
        ],
        chev: "▸",
        hasPie: true,
        pieLabel: "20% of the exam",
        pieStart: 158,
        pieEnd: 230,
        lessonList: [],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Health Insurance",
        weight: "18% of exam",
        nameColor: "ink",
        pLabel: "22 of 45 answered",
        pColor: "ink",
        hasCov: true,
        covPct: "49%",
        hasBand: true,
        noBand: false,
        bNote: "",
        bNoteColor: "muted",
        segs: [
          {
            style: { weight: 40, tone: "edge" }
          },
          {
            style: { weight: 25, tone: "amber" }
          },
          {
            style: { weight: 20, tone: "hairline" }
          },
          {
            style: { weight: 15, tone: "hairline" }
          }
        ],
        bWord: "Developing",
        bColor: "amber-deep",
        num: "64",
        last: "9 days ago",
        act: "Practice",
        isPrimary: false,
        isLink: true,
        aColor: "steel-deep",
        locked: false,
        lockNote: "",
        expanded: false,
        subs: [
          {
            name: "Disability income",
            s: 57,
            num: "57",
            w: 600,
            note: "Weakest · start here",
            noteColor: "rubi",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "hairline" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Developing",
            bColor: "amber-deep",
            rubi: true,
            rubiCta: "Practice · 12 min"
          },
          {
            name: "Medical expense plans",
            s: 66,
            num: "66",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Proficient",
            bColor: "steel",
            rubi: false,
            rubiCta: ""
          },
          {
            name: "Medicare & supplements",
            s: 69,
            num: "69",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Proficient",
            bColor: "steel",
            rubi: false,
            rubiCta: ""
          }
        ],
        chev: "▸",
        hasPie: true,
        pieLabel: "18% of the exam",
        pieStart: 230,
        pieEnd: 295,
        lessonList: [],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Insurance Regulation",
        weight: "18% of exam",
        nameColor: "ink",
        pLabel: "20 of 45 answered",
        pColor: "ink",
        hasCov: true,
        covPct: "44%",
        hasBand: true,
        noBand: false,
        bNote: "",
        bNoteColor: "muted",
        segs: [
          {
            style: { weight: 40, tone: "edge" }
          },
          {
            style: { weight: 25, tone: "amber" }
          },
          {
            style: { weight: 20, tone: "hairline" }
          },
          {
            style: { weight: 15, tone: "hairline" }
          }
        ],
        bWord: "Developing",
        bColor: "amber-deep",
        num: "60",
        last: "9 days ago",
        act: "Practice",
        isPrimary: false,
        isLink: true,
        aColor: "steel-deep",
        locked: false,
        lockNote: "",
        expanded: false,
        subs: [
          {
            name: "Florida licensing rules",
            s: 53,
            num: "53",
            w: 600,
            note: "Weakest · start here",
            noteColor: "rubi",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "hairline" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Developing",
            bColor: "amber-deep",
            rubi: true,
            rubiCta: "Practice · 12 min"
          },
          {
            name: "Unfair trade practices",
            s: 62,
            num: "62",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "hairline" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Developing",
            bColor: "amber-deep",
            rubi: false,
            rubiCta: ""
          },
          {
            name: "Replacement & agent duties",
            s: 65,
            num: "65",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Proficient",
            bColor: "steel",
            rubi: false,
            rubiCta: ""
          }
        ],
        chev: "▸",
        hasPie: true,
        pieLabel: "18% of the exam",
        pieStart: 295,
        pieEnd: 360,
        lessonList: [],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Exam Simulator",
        weight: "All topics · 3 full exams",
        nameColor: "ink",
        pLabel: "0 of 3 taken",
        pColor: "body",
        hasCov: false,
        covPct: "0%",
        hasBand: false,
        noBand: true,
        bNote: "Uses all topics",
        bNoteColor: "muted",
        segs: [],
        bWord: "",
        bColor: "",
        num: "",
        last: "—",
        act: "Start",
        isPrimary: false,
        isLink: true,
        aColor: "steel-deep",
        locked: false,
        lockNote: "",
        expanded: false,
        subs: [],
        chev: "",
        hasPie: false,
        pieLabel: "",
        aKind: "link",
        lessonOpen: false,
        lessonList: [],
        ariaExp: "false",
        chevVis: "hidden",
        chevRot: "none"
      }
    ],
    evNote: "Last 4 practice sets · unaided answers only",
    noEvidence: false,
    evidence: [
      {
        topic: "Policy Provisions › Riders",
        head: "3 of 8 right · you marked 6 of them sure",
        bars: [
          {
            label: "Scored right",
            cells: [
              {
                style: { weight: 1, tone: "amber" }
              },
              {
                style: { weight: 1, tone: "amber" }
              },
              {
                style: { weight: 1, tone: "amber" }
              },
              {
                style: { weight: 1, tone: "wash" }
              },
              {
                style: { weight: 1, tone: "wash" }
              },
              {
                style: { weight: 1, tone: "wash" }
              },
              {
                style: { weight: 1, tone: "wash" }
              },
              {
                style: { weight: 1, tone: "wash" }
              }
            ],
            val: "3/8"
          },
          {
            label: "Marked sure",
            cells: [
              {
                style: { weight: 1, tone: "steel-light" }
              },
              {
                style: { weight: 1, tone: "steel-light" }
              },
              {
                style: { weight: 1, tone: "steel-light" }
              },
              {
                style: { weight: 1, tone: "steel-light" }
              },
              {
                style: { weight: 1, tone: "steel-light" }
              },
              {
                style: { weight: 1, tone: "steel-light" }
              },
              {
                style: { weight: 1, tone: "wash" }
              },
              {
                style: { weight: 1, tone: "wash" }
              }
            ],
            val: "6/8"
          }
        ],
        flag: "Overconfident: 3 sure answers were wrong",
        flagColor: "rubi",
        link: "See the questions",
        hasRubi: true,
        rubiCta: "Practice with Rubi",
        rule: "1px solid hairline"
      },
      {
        topic: "Annuities",
        head: "12 flashcards due · 2 terms missed twice",
        bars: [
          {
            label: "Recalled",
            cells: [
              {
                style: { weight: 1, tone: "amber" }
              },
              {
                style: { weight: 1, tone: "amber" }
              },
              {
                style: { weight: 1, tone: "amber" }
              },
              {
                style: { weight: 1, tone: "amber" }
              },
              {
                style: { weight: 1, tone: "amber" }
              },
              {
                style: { weight: 1, tone: "amber" }
              },
              {
                style: { weight: 1, tone: "amber" }
              },
              {
                style: { weight: 1, tone: "amber" }
              },
              {
                style: { weight: 1, tone: "amber" }
              },
              {
                style: { weight: 1, tone: "amber" }
              },
              {
                style: { weight: 1, tone: "amber" }
              },
              {
                style: { weight: 1, tone: "wash" }
              },
              {
                style: { weight: 1, tone: "wash" }
              },
              {
                style: { weight: 1, tone: "wash" }
              },
              {
                style: { weight: 1, tone: "wash" }
              },
              {
                style: { weight: 1, tone: "wash" }
              },
              {
                style: { weight: 1, tone: "wash" }
              },
              {
                style: { weight: 1, tone: "wash" }
              },
              {
                style: { weight: 1, tone: "wash" }
              },
              {
                style: { weight: 1, tone: "wash" }
              }
            ],
            val: "11/20"
          }
        ],
        flag: "Missed twice: “annuitant” and “accumulation unit”",
        flagColor: "amber-deep",
        link: "Review deck",
        hasRubi: true,
        rubiCta: "Quiz me · 5 min",
        rule: "0"
      }
    ],
    gate: "Readiness comes from Exam Prep practice only; your course lessons don’t feed it. Booking (in Atlas) opens when every topic reaches Ready (85%).",
    stage: "p2",
    navLocked: false
  },
  p3: {
    hello: "You’re ready to pass. Every exam topic is at Ready, and your Readiness is 86%.",
    nav: [
      {
        head: false,
        item: true,
        label: "Overview",
        rule: "steel-deep",
        weight: 600,
        color: "steel-deep",
        hasTag: false,
        tag: "",
        tagColor: ""
      },
      {
        head: false,
        item: true,
        label: "Learn",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: true,
        tag: "Review",
        tagColor: "muted"
      },
      {
        head: false,
        item: true,
        label: "Study planner",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: false,
        tag: "",
        tagColor: ""
      },
      {
        head: false,
        item: true,
        label: "Ask Rubi",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: false,
        tag: "",
        tagColor: ""
      },
      { head: true, item: false, label: "Exam prep" },
      {
        head: false,
        item: true,
        label: "Practice questions",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: false,
        tag: "",
        tagColor: ""
      },
      {
        head: false,
        item: true,
        label: "Flashcards",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: true,
        tag: "None due",
        tagColor: "amber-deep"
      },
      {
        head: false,
        item: true,
        label: "Exam Simulator",
        rule: "transparent",
        weight: 400,
        color: "ink",
        hasTag: true,
        tag: "2 of 3",
        tagColor: "green"
      }
    ],
    metaLine: "Planned state exam Aug 14 · 3 days out",
    phase: "Exam Prep · Ready",
    nextLabel: "Your next step",
    nextTitle: "Book your Florida state exam",
    nextSub: "About 3 minutes · booking lives in Atlas",
    hasGoal: false,
    goalLead: "",
    goalFrom: {
      segs: [],
      word: "",
      color: ""
    },
    goalTo: { word: "", color: "" },
    nextCovers: "Ready (85%) in all five topics",
    weekLine: "Then take Simulator 3 the day before your exam, and rest.",
    ctaLabel: "Book Now",
    ctaAlt: "Take Simulator 3 first",
    ring: {
      has: true,
      none: false,
      p: 0.9245283018867925,
      s: 86,
      tri: {
        capSim: "round",
        capPrac: "round",
        capReady: "round",
        sim: "324.1 483.8",
        prac: "371.8 402.1",
        ready: "275.6 320.4",
        rColor: "green",
        aria: "Exam Simulator 67%, practice coverage 92%, Readiness 86"
      },
      pillLabel: "Ready",
      pillBg: "green-edge",
      pillBorder: "green-deep"
    },
    basis: "All five topics at 85% or above · blueprint-weighted · rings, outside in: simulator · practice · Readiness",
    path: [
      {
        label: "Readiness",
        value: "86% · Ready in all five topics",
        dot: { weight: 0, tone: "green", size: 12 },
        color: "ink",
        valColor: "body",
        hasBar: true,
        pct: "100%",
        barColor: "green",
        hasLink: false,
        noLink: true,
        link: ""
      },
      {
        label: "Practice questions",
        value: "245 of 265 covered",
        dot: { weight: 0, tone: "steel", size: 12 },
        color: "ink",
        valColor: "body",
        hasBar: true,
        pct: "92%",
        barColor: "green",
        hasLink: false,
        noLink: true,
        link: ""
      },
      {
        label: "Flashcards",
        value: "None due",
        dot: { weight: 0, tone: "steel-light", size: 12 },
        color: "ink",
        valColor: "body",
        hasBar: false,
        pct: "0%",
        barColor: "green",
        hasLink: false,
        noLink: true,
        link: ""
      },
      {
        label: "Exam Simulator (3)",
        value: "2 of 3 · last passed 81%",
        dot: { weight: 0, tone: "violet", size: 12 },
        color: "ink",
        valColor: "body",
        hasBar: true,
        pct: "67%",
        barColor: "violet",
        hasLink: false,
        noLink: true,
        link: ""
      },
      {
        label: "Book your exam",
        value: "",
        dot: { weight: 0, tone: "white", size: 12 },
        color: "ink",
        valColor: "body",
        hasBar: false,
        pct: "0%",
        barColor: "steel",
        hasLink: true,
        noLink: false,
        link: "Book Now"
      }
    ],
    rubi: {
      path: "Annuities",
      title: "Hold your thinnest margin",
      why: "Annuities sits right at 85%. Six spaced questions tomorrow keep it there through exam day.",
      effectTitle: "Keeps",
      effect: "Annuities at Ready",
      cta: "Spaced review · 8 min"
    },
    summary: "All 5 topics Ready · Annuities is closest to the line",
    rows: [
      {
        name: "Life Insurance",
        weight: "22% of exam",
        nameColor: "ink",
        pLabel: "56 of 60 answered",
        pColor: "ink",
        hasCov: true,
        covPct: "93%",
        hasBand: true,
        noBand: false,
        bNote: "",
        bNoteColor: "muted",
        segs: [
          {
            style: { weight: 40, tone: "edge" }
          },
          {
            style: { weight: 25, tone: "amber" }
          },
          {
            style: { weight: 20, tone: "steel-light" }
          },
          {
            style: { weight: 15, tone: "green" }
          }
        ],
        bWord: "Ready",
        bColor: "green",
        num: "88",
        last: "2 days ago",
        act: "Practice",
        isPrimary: false,
        isLink: true,
        aColor: "steel-deep",
        locked: false,
        lockNote: "",
        expanded: false,
        subs: [
          {
            name: "Policy types: term, whole, universal",
            s: 81,
            num: "81",
            w: 600,
            note: "Weakest · start here",
            noteColor: "rubi",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Proficient",
            bColor: "steel",
            rubi: true,
            rubiCta: "Practice · 12 min"
          },
          {
            name: "Underwriting & insurable interest",
            s: 90,
            num: "90",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "green" }
              }
            ],
            bWord: "Ready",
            bColor: "green",
            rubi: false,
            rubiCta: ""
          },
          {
            name: "Owners & beneficiaries",
            s: 93,
            num: "93",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "green" }
              }
            ],
            bWord: "Ready",
            bColor: "green",
            rubi: false,
            rubiCta: ""
          }
        ],
        chev: "▸",
        hasPie: true,
        pieLabel: "22% of the exam",
        pieStart: 0,
        pieEnd: 79,
        lessonList: [],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Policy Provisions",
        weight: "22% of exam",
        nameColor: "ink",
        pLabel: "55 of 60 answered",
        pColor: "ink",
        hasCov: true,
        covPct: "92%",
        hasBand: true,
        noBand: false,
        bNote: "",
        bNoteColor: "muted",
        segs: [
          {
            style: { weight: 40, tone: "edge" }
          },
          {
            style: { weight: 25, tone: "amber" }
          },
          {
            style: { weight: 20, tone: "steel-light" }
          },
          {
            style: { weight: 15, tone: "green" }
          }
        ],
        bWord: "Ready",
        bColor: "green",
        num: "86",
        last: "Yesterday",
        act: "Practice",
        isPrimary: false,
        isLink: true,
        aColor: "steel-deep",
        locked: false,
        lockNote: "",
        expanded: false,
        subs: [
          {
            name: "Riders",
            s: 75,
            num: "75",
            w: 600,
            note: "Weakest · start here",
            noteColor: "rubi",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Proficient",
            bColor: "steel",
            rubi: true,
            rubiCta: "Practice · 12 min"
          },
          {
            name: "Nonforfeiture options",
            s: 83,
            num: "83",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Proficient",
            bColor: "steel",
            rubi: false,
            rubiCta: ""
          },
          {
            name: "Settlement options",
            s: 91,
            num: "91",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "green" }
              }
            ],
            bWord: "Ready",
            bColor: "green",
            rubi: false,
            rubiCta: ""
          },
          {
            name: "Grace period & reinstatement",
            s: 95,
            num: "95",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "green" }
              }
            ],
            bWord: "Ready",
            bColor: "green",
            rubi: false,
            rubiCta: ""
          }
        ],
        chev: "▸",
        hasPie: true,
        pieLabel: "22% of the exam",
        pieStart: 79,
        pieEnd: 158,
        lessonList: [],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Annuities",
        weight: "20% of exam",
        nameColor: "ink",
        pLabel: "50 of 55 answered",
        pColor: "ink",
        hasCov: true,
        covPct: "91%",
        hasBand: true,
        noBand: false,
        bNote: "",
        bNoteColor: "muted",
        segs: [
          {
            style: { weight: 40, tone: "edge" }
          },
          {
            style: { weight: 25, tone: "amber" }
          },
          {
            style: { weight: 20, tone: "steel-light" }
          },
          {
            style: { weight: 15, tone: "green" }
          }
        ],
        bWord: "Ready",
        bColor: "green",
        num: "85",
        last: "Today",
        act: "Review",
        isPrimary: true,
        isLink: false,
        aColor: "steel-deep",
        locked: false,
        lockNote: "",
        expanded: true,
        subs: [
          {
            name: "Variable annuities",
            w: 600,
            note: "Lowest · keep warm",
            noteColor: "rubi",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Proficient",
            bColor: "steel",
            num: "82",
            rubi: true,
            rubiCta: "Review · 8 min"
          },
          {
            name: "Annuity taxation",
            w: 400,
            note: "6 of 7 right",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "green" }
              }
            ],
            bWord: "Ready",
            bColor: "green",
            num: "86",
            rubi: false,
            rubiCta: ""
          },
          {
            name: "Fixed and indexed annuities",
            w: 400,
            note: "Steady",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "green" }
              }
            ],
            bWord: "Ready",
            bColor: "green",
            num: "88",
            rubi: false,
            rubiCta: ""
          }
        ],
        chev: "▾",
        hasPie: true,
        pieLabel: "20% of the exam",
        pieStart: 158,
        pieEnd: 230,
        lessonList: [],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "rotate(90deg)",
        ariaExp: "true"
      },
      {
        name: "Health Insurance",
        weight: "18% of exam",
        nameColor: "ink",
        pLabel: "42 of 45 answered",
        pColor: "ink",
        hasCov: true,
        covPct: "93%",
        hasBand: true,
        noBand: false,
        bNote: "",
        bNoteColor: "muted",
        segs: [
          {
            style: { weight: 40, tone: "edge" }
          },
          {
            style: { weight: 25, tone: "amber" }
          },
          {
            style: { weight: 20, tone: "steel-light" }
          },
          {
            style: { weight: 15, tone: "green" }
          }
        ],
        bWord: "Ready",
        bColor: "green",
        num: "86",
        last: "3 days ago",
        act: "Practice",
        isPrimary: false,
        isLink: true,
        aColor: "steel-deep",
        locked: false,
        lockNote: "",
        expanded: false,
        subs: [
          {
            name: "Disability income",
            s: 79,
            num: "79",
            w: 600,
            note: "Weakest · start here",
            noteColor: "rubi",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Proficient",
            bColor: "steel",
            rubi: true,
            rubiCta: "Practice · 12 min"
          },
          {
            name: "Medical expense plans",
            s: 88,
            num: "88",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "green" }
              }
            ],
            bWord: "Ready",
            bColor: "green",
            rubi: false,
            rubiCta: ""
          },
          {
            name: "Medicare & supplements",
            s: 91,
            num: "91",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "green" }
              }
            ],
            bWord: "Ready",
            bColor: "green",
            rubi: false,
            rubiCta: ""
          }
        ],
        chev: "▸",
        hasPie: true,
        pieLabel: "18% of the exam",
        pieStart: 230,
        pieEnd: 295,
        lessonList: [],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Insurance Regulation",
        weight: "18% of exam",
        nameColor: "ink",
        pLabel: "42 of 45 answered",
        pColor: "ink",
        hasCov: true,
        covPct: "93%",
        hasBand: true,
        noBand: false,
        bNote: "",
        bNoteColor: "muted",
        segs: [
          {
            style: { weight: 40, tone: "edge" }
          },
          {
            style: { weight: 25, tone: "amber" }
          },
          {
            style: { weight: 20, tone: "steel-light" }
          },
          {
            style: { weight: 15, tone: "green" }
          }
        ],
        bWord: "Ready",
        bColor: "green",
        num: "86",
        last: "2 days ago",
        act: "Practice",
        isPrimary: false,
        isLink: true,
        aColor: "steel-deep",
        locked: false,
        lockNote: "",
        expanded: false,
        subs: [
          {
            name: "Florida licensing rules",
            s: 79,
            num: "79",
            w: 600,
            note: "Weakest · start here",
            noteColor: "rubi",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "hairline" }
              }
            ],
            bWord: "Proficient",
            bColor: "steel",
            rubi: true,
            rubiCta: "Practice · 12 min"
          },
          {
            name: "Unfair trade practices",
            s: 88,
            num: "88",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "green" }
              }
            ],
            bWord: "Ready",
            bColor: "green",
            rubi: false,
            rubiCta: ""
          },
          {
            name: "Replacement & agent duties",
            s: 91,
            num: "91",
            w: 400,
            note: "",
            noteColor: "muted",
            segs: [
              {
                style: { weight: 40, tone: "edge" }
              },
              {
                style: { weight: 25, tone: "amber" }
              },
              {
                style: { weight: 20, tone: "steel-light" }
              },
              {
                style: { weight: 15, tone: "green" }
              }
            ],
            bWord: "Ready",
            bColor: "green",
            rubi: false,
            rubiCta: ""
          }
        ],
        chev: "▸",
        hasPie: true,
        pieLabel: "18% of the exam",
        pieStart: 295,
        pieEnd: 360,
        lessonList: [],
        lessonOpen: false,
        chevVis: "visible",
        chevRot: "none",
        ariaExp: "false"
      },
      {
        name: "Exam Simulator",
        weight: "All topics · 3 full exams",
        nameColor: "ink",
        pLabel: "2 of 3 taken",
        pColor: "body",
        hasCov: false,
        covPct: "0%",
        hasBand: false,
        noBand: true,
        bNote: "Last scored 81% · 70% to pass",
        bNoteColor: "muted",
        segs: [],
        bWord: "",
        bColor: "",
        num: "",
        last: "—",
        act: "Start",
        isPrimary: false,
        isLink: true,
        aColor: "steel-deep",
        locked: false,
        lockNote: "",
        expanded: false,
        subs: [],
        chev: "",
        hasPie: false,
        pieLabel: "",
        aKind: "link",
        lessonOpen: false,
        lessonList: [],
        ariaExp: "false",
        chevVis: "hidden",
        chevRot: "none"
      }
    ],
    evNote: "Last 4 practice sets · unaided answers only",
    noEvidence: false,
    evidence: [
      {
        topic: "Policy Provisions › Riders",
        head: "7 of 8 right · 7 marked sure",
        bars: [
          {
            label: "Scored right",
            cells: [
              {
                style: { weight: 1, tone: "green" }
              },
              {
                style: { weight: 1, tone: "green" }
              },
              {
                style: { weight: 1, tone: "green" }
              },
              {
                style: { weight: 1, tone: "green" }
              },
              {
                style: { weight: 1, tone: "green" }
              },
              {
                style: { weight: 1, tone: "green" }
              },
              {
                style: { weight: 1, tone: "green" }
              },
              {
                style: { weight: 1, tone: "wash" }
              }
            ],
            val: "7/8"
          },
          {
            label: "Marked sure",
            cells: [
              {
                style: { weight: 1, tone: "steel-light" }
              },
              {
                style: { weight: 1, tone: "steel-light" }
              },
              {
                style: { weight: 1, tone: "steel-light" }
              },
              {
                style: { weight: 1, tone: "steel-light" }
              },
              {
                style: { weight: 1, tone: "steel-light" }
              },
              {
                style: { weight: 1, tone: "steel-light" }
              },
              {
                style: { weight: 1, tone: "steel-light" }
              },
              {
                style: { weight: 1, tone: "wash" }
              }
            ],
            val: "7/8"
          }
        ],
        flag: "Calibrated. The confidence gap is closed.",
        flagColor: "green",
        link: "See the questions",
        hasRubi: false,
        rubiCta: "",
        rule: "1px solid hairline"
      },
      {
        topic: "Annuities",
        head: "3 flashcards due tomorrow · none missed twice",
        bars: [
          {
            label: "Recalled",
            cells: [
              {
                style: { weight: 1, tone: "green" }
              },
              {
                style: { weight: 1, tone: "green" }
              },
              {
                style: { weight: 1, tone: "green" }
              },
              {
                style: { weight: 1, tone: "green" }
              },
              {
                style: { weight: 1, tone: "green" }
              },
              {
                style: { weight: 1, tone: "green" }
              },
              {
                style: { weight: 1, tone: "green" }
              },
              {
                style: { weight: 1, tone: "green" }
              },
              {
                style: { weight: 1, tone: "green" }
              },
              {
                style: { weight: 1, tone: "green" }
              },
              {
                style: { weight: 1, tone: "green" }
              },
              {
                style: { weight: 1, tone: "green" }
              },
              {
                style: { weight: 1, tone: "green" }
              },
              {
                style: { weight: 1, tone: "green" }
              },
              {
                style: { weight: 1, tone: "green" }
              },
              {
                style: { weight: 1, tone: "green" }
              },
              {
                style: { weight: 1, tone: "green" }
              },
              {
                style: { weight: 1, tone: "wash" }
              },
              {
                style: { weight: 1, tone: "wash" }
              },
              {
                style: { weight: 1, tone: "wash" }
              }
            ],
            val: "17/20"
          }
        ],
        flag: "At the line: one spaced review keeps it",
        flagColor: "amber-deep",
        link: "Review deck",
        hasRubi: true,
        rubiCta: "Quiz me · 5 min",
        rule: "0"
      }
    ],
    gate: "Booking happens in Atlas and is open because every topic is at Ready (85%). Readiness comes from Exam Prep practice only.",
    stage: "p3",
    navLocked: false
  }
}
