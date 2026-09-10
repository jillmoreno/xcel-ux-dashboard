import { useState, type CSSProperties } from 'react'
import { useAccount } from '@/context/AccountContext'
import { useReadinessState } from '@/context/FeatureFlagContext'
import { Tabs } from '@/components/ui/Tabs'
import { PillTabs } from '@/components/ui/PillTabs'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { CircleCheck, CircleExclamation } from '@/icons'
import {
  bandFor,
  PASS_MARK,
  readinessForState,
  type ExamAttempt,
  type ReadinessBand,
  type ReadinessState,
} from '@/data/readinessFixtures'
import { ReadinessScoreGauge } from './ReadinessScoreGauge'

/**
 * Exam Readiness — the `readiness` rail section, replacing its placeholder.
 * Ported from Figma "Exam Summary" (woOd62dQQyPvtqJ6ZRO0qF).
 *
 * ── Three departures from the design, all deliberate ────────────────────────
 *
 * 1. **The design's five top tabs are gone** (About the Course · Instructor ·
 *    Author · Regulatory Requirements). They are course-detail tabs; this is a
 *    section of the learner's own dashboard, not a course page, and four of the
 *    five have no content here.
 *
 * 2. **The design's LEFT SUB-RAIL is now these three tabs.** It carried both
 *    navigation (Readiness Score / What to Expect / Study Tips) and content
 *    (the Final Exams and Practice Exams cards) in one column. A second rail
 *    inside the shell's content column would sit beside the platform rail that
 *    is already there — the account sections do exactly that with
 *    `AccountSubNav`, and CLAUDE.md records the gutter cost. Tabs avoid it.
 *
 * 3. **Study Tips folded into What to Expect; Final Exams into Practice
 *    Exams.** The three-tab set leaves the design's other two sections
 *    homeless, and these are the joins that hold: study tips ARE what to expect
 *    of yourself before the day, and a licensing attempt is an attempt. The
 *    Practice Exams tab keeps them as two LISTS, though — see
 *    `readinessFixtures`, where the practice/licensing split is the same one
 *    the exam task-type spec found in `StudyTaskKind`.
 */

type ReadinessTab = 'readiness' | 'insights' | 'expect' | 'practice'
type BreakdownFilter = 'review' | 'know' | 'all'

const TABS = [
  { id: 'readiness' as const, label: 'Exam Readiness' },
  // Insights is SECOND, directly after the score, because it is the answer to
  // the question the score raises. It was part of the Exam Readiness tab until
  // 2026-09-09 — see `InsightsTab`.
  { id: 'insights' as const, label: 'Insights' },
  { id: 'expect' as const, label: 'What to Expect' },
  { id: 'practice' as const, label: 'Practice Exams' },
]

const FILTERS = [
  { id: 'review' as const, label: 'I Should Review' },
  { id: 'know' as const, label: 'I Know This' },
  { id: 'all' as const, label: 'Show All' },
]

/** Band → the dot / bar colour. One map, so a chapter dot and a topic bar at
 *  the same score can never disagree. */
const BAND_COLOR: Record<ReadinessBand, string> = {
  review: 'var(--color-error-500)',
  shaky: 'var(--color-warning-500)',
  strong: 'var(--color-success-600)',
}

export function ReadinessPanel() {
  const [tab, setTab] = useState<ReadinessTab>('readiness')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Tabs items={TABS} active={tab} onChange={setTab} />
      {tab === 'readiness' && <ExamReadinessTab onOpenInsights={() => setTab('insights')} />}
      {tab === 'insights' && <InsightsTab />}
      {tab === 'expect' && <WhatToExpectTab />}
      {tab === 'practice' && <PracticeExamsTab />}
    </div>
  )
}

/* ─── Tab 1 · Exam Readiness ──────────────────────────────────────────── */

/**
 * The score and what it is made of. Nothing else — the Chapter & Topic
 * Breakdown that used to sit below it is now `InsightsTab`.
 *
 * The split leaves this tab short, which is the point: it answers "am I ready"
 * in one screenful and hands off. What it must NOT do is answer that and then
 * leave the learner to find the "what should I review" screen themselves —
 * the score's own copy says "aim for the green", so `onOpenInsights` puts the
 * route to that answer directly under the sentence that asks for it.
 */
function ExamReadinessTab({ onOpenInsights }: { onOpenInsights: () => void }) {
  const { brand } = useAccount()
  const data = readinessForState(brand, useReadinessState() as ReadinessState)
  const hasScore = data.score !== null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={headingStyle}>Readiness Score</h2>
        <p style={subtleStyle}>{data.pathTitle}</p>
        <div style={scoreRowStyle}>
          <div style={scoreCardStyle}>
            {/* The gauge brings its own card shell — header row, chip, arc.
                Wrapping it in `Card` too would nest two bordered surfaces. */}
            <ReadinessScoreGauge score={data.score} passingScore={PASS_MARK} size="lg" />
            {/* A learner with no score gets different copy, not the same
                sentence with a blank in it. The explanation describes how a
                score is BUILT, which is useful once one exists and is noise
                before — and the frequency note is a statement about scores, so
                it has nothing to qualify yet. */}
            <p style={{ ...bodyStyle, margin: 0 }}>
              {hasScore
                ? data.scoreExplanation
                : 'Your readiness score appears once you have answered some questions. Finish a chapter or sit a practice exam to start it off.'}
            </p>
            {hasScore && (
              // The credibility line. It is NOT from the design — see
              // READINESS_FREQUENCY_NOTE for why it has to be here.
              <p style={frequencyStyle}>{data.frequencyNote}</p>
            )}
            {/* The hand-off. The sentence above says "aim for the green"; this
                is the route to the screen that says WHICH green. It exists
                because Insights became its own tab — on the design's single
                long page the breakdown was simply the next thing down.
                Suppressed when there is nothing over there to look at. */}
            {data.chapters.length > 0 && (
              <button type="button" onClick={onOpenInsights} style={handoffStyle}>
                See what to review →
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 280px', minWidth: 260 }}>
            {data.progress.map((row) => (
              <div key={row.label} style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '8px 0' }}>
                <div style={statRowStyle}>
                  <span style={statLabelStyle}>{row.label}</span>
                  <span style={statValueStyle}>{row.value}</span>
                </div>
                {/* The SHARED bar — the same `ProgressBar` the Study Plan's
                    stat band uses, not a lookalike. It was a 3px green
                    hand-rolled track, so one learner's one 32% drew as two
                    different bars a rail item apart. */}
                {row.pct !== undefined && <ProgressBar pct={row.pct} />}
                {row.pct === undefined && <div style={ruleStyle} />}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

/* ─── Tab 2 · Insights ────────────────────────────────────────────────── */

/**
 * The Chapter & Topic Breakdown, promoted out of the Exam Readiness tab on
 * 2026-09-09 and placed SECOND, directly after the score.
 *
 * In the Figma it sits below the score on one long screen. Making it a tab
 * changes what it is: below a score it reads as supporting detail, but on its
 * own it is the worklist — the thing a learner opens between study sessions to
 * decide what to do next. The order matters for the same reason; anywhere after
 * "What to Expect" would bury the answer behind exam-day logistics.
 *
 * The cost is that the score and the breakdown no longer share a screen, so the
 * number and its explanation are one click apart. `ExamReadinessTab` closes
 * that with a hand-off link rather than leaving the learner to find this tab.
 */
function InsightsTab() {
  const { brand } = useAccount()
  const data = readinessForState(brand, useReadinessState() as ReadinessState)
  const [filter, setFilter] = useState<BreakdownFilter>('review')

  // ONE predicate drives both columns and the pill strip, so the chapter list
  // and the topic list can never disagree about what "should review" means.
  const keep = (pct: number) =>
    filter === 'all' ? true : filter === 'review' ? bandFor(pct) === 'review' : bandFor(pct) !== 'review'

  // Nothing answered at all is a different sentence from nothing in THIS
  // filter — "Nothing in this group yet" under "I Should Review" reads as good
  // news to a learner who simply has not started.
  const noData = data.chapters.length === 0
  const chapters = data.chapters.filter((c) => keep(c.pct))
  const topics = data.topics.filter((t) => keep(t.pct))
  // "Show All" is the design's own sort order (by chapter number); the two
  // filtered views sort worst-first, because the list is then a worklist.
  const sortedChapters = filter === 'all' ? chapters : [...chapters].sort((a, b) => a.pct - b.pct)
  const sortedTopics = filter === 'all' ? topics : [...topics].sort((a, b) => a.pct - b.pct)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={headingStyle}>Chapter &amp; Topic Breakdown</h2>
        <p style={{ ...bodyStyle, margin: 0 }}>
          Take note of your strongest and weakest areas of study, to discover areas you will want to
          review before your exam.
        </p>
        {/* PillTabs is the house segmented filter, and it carries NO per-pill
            counts by convention — the total sits beside the strip instead. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <PillTabs items={FILTERS} active={filter} onChange={setFilter} label="Breakdown filter" size="compact" />
          <span style={subtleStyle}>
            {sortedChapters.length} chapters · {sortedTopics.length} topics
          </span>
        </div>

        <div style={breakdownGridStyle}>
          <div
            role="group"
            aria-label="Chapters"
            style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}
          >
            <h3 style={columnHeadStyle}>Chapters</h3>
            {sortedChapters.length === 0 ? (
              <p style={emptyStyle}>
                {noData ? 'No answers recorded yet.' : 'Nothing in this group yet.'}
              </p>
            ) : (
              sortedChapters.map((c) => (
                <div key={c.number} style={chapterRowStyle}>
                  <span aria-hidden style={{ ...dotStyle, background: BAND_COLOR[bandFor(c.pct)] }} />
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span style={chapterNumStyle}>Chapter {c.number}:</span>
                    <span style={chapterTitleStyle}>{c.title}</span>
                  </span>
                  <span style={pctStyle}>{c.pct}%</span>
                </div>
              ))
            )}
          </div>

          <div
            role="group"
            aria-label="Topics"
            style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}
          >
            <h3 style={columnHeadStyle}>Topics</h3>
            {sortedTopics.length === 0 ? (
              <p style={emptyStyle}>
                {noData ? 'No answers recorded yet.' : 'Nothing in this group yet.'}
              </p>
            ) : (
              sortedTopics.map((t) => (
                <div key={t.title} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div style={statRowStyle}>
                    <span style={statLabelStyle}>{t.title}</span>
                    <span style={statValueStyle}>{t.pct}%</span>
                  </div>
                  {/* Deliberately NOT the shared `ProgressBar`. These are
                      SCORES, not progress — band-coloured, and fourteen of
                      them in a column, where the shared bar's 8px would turn a
                      scannable list into a stack of blocks. Same reasoning as
                      the gauge keeping red while this page's chapter dots do:
                      a different job is allowed a different treatment. */}
                  <div style={trackStyle}>
                    <div
                      style={{ ...fillStyle, width: `${t.pct}%`, background: BAND_COLOR[bandFor(t.pct)] }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

/* ─── Tab 3 · What to Expect ─────────────────────────────────────────── */

/**
 * The design gives this a rail item and no artwork, so the content is authored.
 * It answers the two questions the walk-through found learners actually ask on
 * exam day — what the sitting is like, and what to do the week before — which
 * is where the design's separate "Study Tips" section landed.
 *
 * The exam facts are Florida 2-15 and REAL; the study tips are the design's own
 * six (Create Schedule · Study w/ others · Get Sleep · Try techniques · Vary
 * location · Manage Stress), which is the one part of that section the Figma
 * does specify.
 */
function WhatToExpectTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={headingStyle}>On the day</h2>
        <div style={factGridStyle}>
          {EXAM_FACTS.map((f) => (
            <Card key={f.label} style={factCardStyle}>
              <span style={factLabelStyle}>{f.label}</span>
              <span style={factValueStyle}>{f.value}</span>
              {f.note && <span style={subtleStyle}>{f.note}</span>}
            </Card>
          ))}
        </div>
      </section>
      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={headingStyle}>Before the day</h2>
        <p style={{ ...bodyStyle, margin: 0 }}>
          Six habits that move a readiness score more reliably than extra hours do.
        </p>
        <div style={factGridStyle}>
          {STUDY_TIPS.map((t) => (
            <Card key={t.title} style={factCardStyle}>
              <span style={factValueStyle}>{t.title}</span>
              <span style={subtleStyle}>{t.body}</span>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}

/** Florida 2-15 sitting. TODO(data): confirm against the current PSI bulletin
 *  before this is shown to a real learner — these are the published figures at
 *  time of writing, not a feed. */
const EXAM_FACTS: { label: string; value: string; note?: string }[] = [
  { label: 'Exam', value: 'Florida 2-15 Health & Life', note: 'including Annuities & Variable Contracts' },
  { label: 'Questions', value: '165 scored', note: 'plus unscored pretest items' },
  { label: 'Time allowed', value: '3 hours 15 minutes' },
  // Reads the constant the gauge's green band starts at. A literal here is
  // how the arc and the stated pass mark drift apart — and they sit one tab
  // from each other, so nobody would see both at once.
  { label: 'Passing score', value: `${PASS_MARK}%` },
  { label: 'Where', value: 'A PSI test centre', note: 'or online with remote proctoring' },
  { label: 'Bring', value: 'Two forms of ID', note: 'one photo, names matching your registration' },
]

const STUDY_TIPS: { title: string; body: string }[] = [
  { title: 'Create a schedule', body: 'Fixed short sessions beat occasional long ones. Your Study Plan already builds one.' },
  { title: 'Study with others', body: 'Explaining a rider out loud finds the gaps that re-reading hides.' },
  { title: 'Get sleep', body: 'The night before is worth more than the hour you would have spent revising.' },
  { title: 'Try techniques', body: 'Self-testing and spaced repetition outperform highlighting, by a lot.' },
  { title: 'Vary location', body: 'Studying in more than one place makes recall less dependent on any of them.' },
  { title: 'Manage stress', body: 'Sit a full-length simulator at exam length once, so the day is not the first time.' },
]

/* ─── Tab 4 · Practice Exams ─────────────────────────────────────────── */

function PracticeExamsTab() {
  const { brand } = useAccount()
  const data = readinessForState(brand, useReadinessState() as ReadinessState)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={headingStyle}>Practice exams</h2>
        <p style={{ ...bodyStyle, margin: 0 }}>
          Your simulator attempts. These are scored by us and feed the readiness score.
        </p>
        <AttemptList attempts={data.practiceExams} />
      </section>
      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={headingStyle}>Licensing exam</h2>
        {/* Kept as its own list rather than merged above. A licensing attempt
            is sat at PSI and only its outcome reaches us — the same split the
            exam task-type spec found between `exam` and `licensing-exam`. */}
        <p style={{ ...bodyStyle, margin: 0 }}>
          Sat at a PSI test centre. We record the outcome the state reports; these attempts do not
          feed the readiness score.
        </p>
        <AttemptList attempts={data.licensingExams} />
      </section>
    </div>
  )
}

function AttemptList({ attempts }: { attempts: ExamAttempt[] }) {
  if (attempts.length === 0) return <p style={emptyStyle}>No attempts yet.</p>
  return (
    <div role="list" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {attempts.map((a) => (
        <Card key={a.id} style={attemptRowStyle} role="listitem">
          <span
            aria-hidden
            style={{ color: a.passed ? 'var(--color-success-600)' : 'var(--color-error-500)', display: 'inline-flex' }}
          >
            {a.passed ? <CircleCheck size={18} /> : <CircleExclamation size={18} />}
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={factValueStyle}>{a.label}</span>
            <span style={{ ...subtleStyle, display: 'block' }}>{formatDate(a.date)}</span>
          </span>
          {/* A licensing attempt can have no released score — blank, not a
              dash. A placeholder in an inapplicable cell reads as a value we
              failed to fetch (the admin-tool convention, same rule). */}
          {a.score !== null && <span style={pctStyle}>{a.score}%</span>}
          <span style={{ ...pctStyle, color: a.passed ? 'var(--color-success-600)' : 'var(--color-error-500)' }}>
            {a.passed ? 'Pass' : 'Fail'}
          </span>
        </Card>
      ))}
    </div>
  )
}

/** Anchored fixture dates render as authored — no wall-clock formatting, so a
 *  screenshot taken next year still matches the fixture. */
function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${Number(m)}/${Number(d)}/${y}`
}

/* ─── styles ───────────────────────────────────────────────────────────── */

const headingStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontSize: 20,
  fontWeight: 700,
  color: 'var(--color-text-primary)',
}

const columnHeadStyle: CSSProperties = {
  margin: '0 0 2px',
  fontFamily: 'var(--font-body)',
  fontSize: 15,
  fontWeight: 700,
  color: 'var(--color-text-primary)',
}

const bodyStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  lineHeight: '20px',
  color: 'var(--color-text-secondary)',
}

const subtleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  color: 'var(--color-text-tertiary)',
}

const frequencyStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  lineHeight: '17px',
  fontStyle: 'italic',
  color: 'var(--color-text-tertiary)',
}

const scoreRowStyle: CSSProperties = {
  display: 'flex',
  gap: 24,
  flexWrap: 'wrap',
  alignItems: 'flex-start',
}

/**
 * The score column. Widened 2026-09-09 — it was `1 1 320px` beside the stats'
 * `1 1 280px`, i.e. an even split, which left the `md` gauge (206px) floating
 * in a 262px card with the width going to padding.
 *
 * Now takes the larger share of the row AND the gauge steps up to `lg`
 * (276px). Those two go together: widening the card alone just makes the
 * whitespace wider, and stepping the gauge up alone clips it. Change one and
 * check the other.
 *
 * The row still wraps — `scoreRowStyle` is `flexWrap: 'wrap'` and both columns
 * keep a `minWidth`, so on a narrow shell the stats drop below the card rather
 * than squeezing it under the gauge's own minimum.
 */
const scoreCardStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  gap: 12,
  flex: '1.4 1 360px',
  minWidth: 312,
}

const breakdownGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: 24,
  alignItems: 'start',
}

const chapterRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 14px',
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-md)',
}

const dotStyle: CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: 'var(--radius-pill)',
  flexShrink: 0,
}

const chapterNumStyle: CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  color: 'var(--color-text-tertiary)',
}

const chapterTitleStyle: CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--color-text-primary)',
}

const pctStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--color-text-primary)',
  flexShrink: 0,
}

const statRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: 12,
}

const statLabelStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  color: 'var(--color-text-secondary)',
  minWidth: 0,
}

const statValueStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--color-text-primary)',
  flexShrink: 0,
}

const trackStyle: CSSProperties = {
  height: 3,
  borderRadius: 'var(--radius-pill)',
  background: 'var(--color-neutral-200)',
  overflow: 'hidden',
}

const fillStyle: CSSProperties = { height: '100%', borderRadius: 'var(--radius-pill)' }

const ruleStyle: CSSProperties = { height: 1, background: 'var(--color-border-subtle)' }

const factGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: 12,
}

const factCardStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  padding: 16,
}

const factLabelStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--color-text-tertiary)',
}

const factValueStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 15,
  fontWeight: 700,
  color: 'var(--color-text-primary)',
}

const attemptRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '12px 16px',
}

const emptyStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontStyle: 'italic',
  color: 'var(--color-text-tertiary)',
}

const handoffStyle: CSSProperties = {
  background: 'transparent',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  alignSelf: 'flex-start',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--color-accent-link)',
}
