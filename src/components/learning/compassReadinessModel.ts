import { PREP_STAGES, JOURNEY_STAGES, READINESS_STAGES, type ReadinessStageKey } from '@/data/compassReadinessFixtures'

/**
 * HIS READINESS PAGES — the shapes the components read.
 *
 * ⚠ TYPED OVER A GENERATED FIXTURE. `compassReadinessFixtures.ts` is sixteen
 * page models evaluated out of his own `renderVals()`, so the data is exact
 * and the types are this port's reading of it. Where a field is only ever
 * presentational (`dot`, `segs`) it carries a TONE name rather than a colour —
 * the stylesheet resolves it once.
 */

/** A colour in his palette, named. `compassReadiness.css` maps each to a token. */
export type Tone = string

export type Seg = { style: { weight: number; tone: Tone } }

export type BandWord = { word: string; color: Tone; segs?: Seg[] }

/** The three nested arcs: simulator (outer), practice, Readiness (inner). */
export type RingTri = {
  capSim: string
  capPrac: string
  capReady: string
  sim: string
  prac: string
  ready: string
  rColor: Tone
  aria: string
}

export type Ring = {
  has: boolean
  none: boolean
  p: number
  s: number
  tri: RingTri
  pillLabel: string
  pillBg: Tone
  pillBorder: Tone
}

/** One line of the ring's legend — a measure, its value, and a share bar. */
export type PathRow = {
  label: string
  value: string
  dot: { tone: Tone; size?: number }
  color: Tone
  valColor: Tone
  hasBar: boolean
  pct?: string
  barColor?: Tone
  hasLink: boolean
  noLink: boolean
  link: string
}

export type SubRow = {
  name: string
  /** His sub-row action is Rubi's, and carries her colour. */
  rubi?: boolean
  rubiCta?: string
  note?: string
  noteColor?: Tone
  segs?: Seg[]
  bWord?: string
  bColor?: Tone
  num?: string
  act?: string
  aColor?: Tone
}

export type TopicRow = {
  name: string
  weight: string
  nameColor: Tone
  pLabel: string
  pColor: Tone
  hasCov: boolean
  covPct?: string
  hasBand: boolean
  noBand: boolean
  bNote: string
  bNoteColor: Tone
  segs?: Seg[]
  bWord?: string
  bColor?: Tone
  num?: string
  last?: string
  act?: string
  isPrimary?: boolean
  isLink?: boolean
  aColor?: Tone
  locked?: boolean
  lockNote?: string
  expanded?: boolean
  subs?: SubRow[]
  /** The share-of-the-exam pie: his degrees, 0–360. */
  hasPie?: boolean
  pieLabel?: string
  pieStart?: number
  pieEnd?: number
  /** The JOURNEY table's own columns — lessons done, and a score. */
  lessons?: string
  lColor?: Tone
  lPct?: string
  lBar?: Tone
  score?: string
  isText?: boolean
}

/**
 * ⚠ CELLS, NOT A BAR. His confidence bars are one cell PER QUESTION — eight
 * cells for eight questions — so "3 of 8 right" is countable on the page
 * rather than inferred from a length. A proportional bar would have read the
 * same at a glance and lost the thing the panel is for.
 */
export type EvidenceBar = { label: string; val: string; cells: Seg[] }

export type Evidence = {
  topic: string
  head: string
  bars: EvidenceBar[]
  /** His callout under the bars — "Overconfident: 3 sure answers were wrong". */
  flag?: string
  flagColor?: Tone
  link?: string
  hasRubi?: boolean
  rubiCta?: string
  rule?: string
}

export type RubiPanel = {
  path: string
  title: string
  why: string
  effectTitle?: string
  effect?: string
  cta: string
}

/** "Your exam prep" — his `JOverviewPrep`. */
export type PrepModel = {
  hello: string
  metaLine: string
  phase: string
  nextLabel: string
  nextTitle: string
  nextSub: string
  hasGoal: boolean
  goalLead: string
  goalFrom: BandWord
  goalTo: BandWord
  nextCovers: string
  weekLine: string
  ctaLabel: string
  ctaAlt: string
  ring: Ring
  basis: string
  path: PathRow[]
  rubi: RubiPanel
  summary: string
  rows: TopicRow[]
  evNote: string
  noEvidence: boolean
  evidence: Evidence[]
  gate: string
  stage: string
}

export const prepStage = (key: string): PrepModel =>
  (PREP_STAGES[key] ?? PREP_STAGES.p2) as unknown as PrepModel

export type QeStep = {
  label: string
  status: string
  detail?: string
  mark?: string
  color?: Tone
  stColor?: Tone
}

export type Prog = {
  pct: string
  ringLab: string
  lessonsVal: string
  note?: string
  hasSeat?: boolean
  seat?: string
  hasSteps?: boolean
  steps?: QeStep[]
  aria?: string
  dash?: string
  ringColor?: Tone
  cap?: string
}

export type Hero = {
  border: Tone
  bg: Tone
  color: Tone
  eyebrow: string
  title: string
  sub?: string
  nextLabel?: string
  next?: string
  meta?: string
  cta?: string
  ctaBg?: Tone
  alt?: string
}

export type Tool = { name: string; desc: string; icon?: string; status?: string; statusColor?: Tone }

/** "Your learning journey" — his `JOverview`, across q1–q8 and u1–u5. */
export type JourneyModel = {
  hello: string
  phase: string
  pathway: string
  metaLine: string
  summary: string
  tableTitle: string
  tableNote: string
  gate: string
  stage: string
  hasBanner: boolean
  banner?: { eyebrow: string; items: { n: string; text: string }[] }
  hero?: Hero
  /** ⚠ WHICH LAYOUT: the unified pair, or the QE strip. */
  uLayout?: boolean
  prepTable?: boolean
  stdTable?: boolean
  uReady?: Ring
  uPath?: PathRow[]
  uBasis?: string
  prog?: Prog
  showSignalsRow?: boolean
  ready?: {
    noneSub?: string
    /** Per-topic "None yet · Start here" — his first-appearance list. */
    evidence?: { name: string; answered: string; status: string; color?: Tone }[]
  }
  focus?: { label: string; title: string; why: string; cta: string }
  toolsTitle?: string
  tools?: Tool[]
  tabs?: { label: string; sub: string; sel: string }[]
  rows?: TopicRow[]
  prows?: TopicRow[]
  colLessons?: boolean
  colReady?: boolean
}

export const journeyStage = (key: string): JourneyModel =>
  (JOURNEY_STAGES[key] ?? JOURNEY_STAGES.u3) as unknown as JourneyModel

/** Which page a stage belongs to — his picker's three groups. */
export function seriesOf(key: string): 'course' | 'prep' | 'journey' {
  return READINESS_STAGES.find((s) => s.key === key)?.series ?? 'prep'
}

export const stageKeys = READINESS_STAGES.map((s) => s.key) as ReadinessStageKey[]
