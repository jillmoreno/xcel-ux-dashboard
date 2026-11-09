import { useState } from 'react'
import { BookOpenRegular, CalendarRegular, ChevronDown, CircleInfoRegular, Clock, RubiLogo } from '@/icons'
import {
  READINESS_BANDS,
  READY_AT,
  REFINED_READINESS,
  bandFor,
  formatExamDate,
  lastPracticedLabel,
  paceVerdict,
  pacePerWeek,
  // paceVerdict is read inside PaceSentence; the page itself only renders it.
  stalestSubTopic,
  topicsReady,
  topicsWeakestFirst,
  weakestSubTopic,
  weeksToExam,
  type ReadinessBandKey,
  type RefinedReadiness,
  type RefinedSubTopic,
  type RefinedTopic,
} from '@/data/compassReadinessRefinedFixtures'
import type { JeffMvpPage } from '@/data/compassJeffMvpFixtures'
import './compassReadinessRefined.css'

/**
 * THE REFINED READINESS PAGE — 2026-11-09. The third Compass version, beside
 * Anjani's (what ships) and Jeff's MVP: his Readiness page rebuilt against
 * Nina Conrad's "Compass Rapid Insights: Your Exam Prep" (15 unmoderated
 * sessions, UserTesting, Nov 2026), on the house Compass tokens.
 *
 * It lives inside Jeff's shell — his rail, his other pages — because the
 * argument his rail makes (Readiness is its own destination under EXAM PREP)
 * is the one this page starts from. Only the Readiness row differs.
 *
 * WHAT THE RESEARCH FOUND, AND WHAT EACH FINDING CHANGED HERE:
 *
 *  1 · "27 to ready" was read as questions, percent or points, and people who
 *      read it right were not sure. → No "N points to Ready" anywhere. The hero
 *      says what the gap means in TIME, against the exam date, from
 *      `paceVerdict()` — "about 12 weeks at your pace; your exam is in 10".
 *      The per-topic row shows the score and the level, nothing to decode.
 *  2 · The ring worked because it paired a LABEL with the visual. → The level
 *      ("Developing") is inside the ring, under the number, coloured by band.
 *  3 · "Blueprint-weighted", "thinnest margin", "keep warm" — jargon named in
 *      the report. → Every sentence is plain. No "blueprint", no "lift", no
 *      "evidence", no "retested". `CompassReadinessRefined.test.tsx` greps.
 *  4 · The rings only made sense with the breakdown beside them; "Coverage"
 *      was a word. → ONE ring, Readiness. Questions answered is a labelled bar
 *      with its own numbers ("122 of 265"), because it is a count, not a score,
 *      and two concentric arcs say "two of the same thing".
 *  5 · "A lot of numbers, all weighted similarly." → 62 appears exactly twice
 *      on the page: in the ring and at the end of the trend line. The eyebrow,
 *      the legend and the topics pill that repeated it are gone.
 *  6 · Sub-topics labelled differently were hard to compare. → Every sub-topic
 *      row is the same four columns on one 0–100 scale with the band
 *      thresholds ticked, score in a fixed numeral column.
 *  7 · Twenty-one equal Practice buttons. → One primary on the page (the
 *      hero). Each topic row has a quiet "Practice this topic"; each sub-topic a
 *      quiet "Practice"; the weakest sub-topic in a row gets a small filled one.
 *  8 · "Where do I read?" → The hero offers "Read the lesson" beside Start
 *      practice, and Beginner/Developing sub-topics carry a lesson link.
 *  9 · People trusted the score when they could see the activity behind it. →
 *      "122 of 265 questions" under the ring; "22 of 55" on every topic.
 * 10 · The chart's 40 / 65 / 85 were three unexplained numbers. → The
 *      gridlines are the LEVELS — Developing 40 · Proficient 65 · Ready 85 —
 *      so the chart reads in the same words as the rows below it.
 *
 * ⚠ ONE STATE FOR NOW (62%, Developing), on Jillienne's call 2026-11-09:
 * "lets start with just one state, and then move on." The data layer already
 * returns a `ready` verdict; the Ready arm's hero (green ring, Book your exam)
 * is the next thing to build, and `paceVerdict` is where it hangs.
 *
 * ⚠ EVERYTHING ON SCREEN IS DERIVED. Jeff's template wrote "lowest sub-topic
 * at 41" as a literal that would not move; here every number in a sentence is
 * a function of the fixture, which is the only way the clarified copy stays
 * true when the numbers change.
 */
export function CompassReadinessRefined({
  data = REFINED_READINESS,
  onSelectPage,
}: {
  data?: RefinedReadiness
  onSelectPage?: (p: JeffMvpPage) => void
}) {
  const go = (p: JeffMvpPage) => () => onSelectPage?.(p)
  const band = bandFor(data.overall)
  const weakest = weakestSubTopic(data)
  const stalest = stalestSubTopic(data)
  const topics = topicsWeakestFirst(data)
  const ready = topicsReady(data)
  const [open, setOpen] = useState<Record<string, boolean>>({ [topics[0].name]: true })
  const [levelsOpen, setLevelsOpen] = useState(false)

  return (
    <div className="cre-rdr">
      <button type="button" className="cre-rdr-ask" onClick={go('overview')}>
        <RubiLogo size={16} aria-hidden />
        Ask Rubi what to work on
      </button>

      <div className="cre-rdr-col">
        <header className="cre-rdr-head">
          <div>
            <h1 className="cre-rdr-h1 serif">Your readiness</h1>
            <p className="cre-rdr-lead">
              How likely you are to pass, based on your practice answers across every exam topic — and
              the one thing to do next.
            </p>
          </div>
          <p className="cre-rdr-exam">
            <CalendarRegular size={14} aria-hidden />
            Exam {formatExamDate(data.plannedExamOn)} · {weeksToExam(data)} weeks away
          </p>
        </header>

        {/* ---------- the score ---------- */}
        <section className="cre-rdr-hero" aria-label="Readiness to pass">
          <ReadinessRing score={data.overall} bandKey={band.key} bandLabel={band.label} />

          <div className="cre-rdr-hero__read">
            <p className="cre-rdr-eyebrow">Readiness to pass</p>
            <h2 className="cre-rdr-h2 serif">
              You’re {band.label}. Ready starts at {READY_AT}.
            </h2>
            <p className="cre-rdr-body">
              <PaceSentence data={data} />
            </p>

            <dl className="cre-rdr-facts">
              <div>
                <dt>Ready at</dt>
                <dd className="serif" data-tone="ready">
                  {READY_AT}
                </dd>
              </div>
              <div>
                <dt>Last {data.trendWeeks} weeks</dt>
                <dd className="serif" data-tone="steel">
                  {data.delta > 0 ? '+' : ''}
                  {data.delta} pts
                </dd>
              </div>
              <div>
                <dt>Your pace</dt>
                <dd className="serif" data-tone="steel">
                  {formatPace(pacePerWeek(data))} / week
                </dd>
              </div>
            </dl>

            <div className="cre-rdr-answered">
              <div className="cre-rdr-answered__row">
                <span>Practice questions answered</span>
                <b>
                  {data.questionsAnswered} of {data.questionsTotal}
                </b>
              </div>
              <span className="cre-rdr-answered__bar" aria-hidden>
                <span style={{ width: `${Math.round((data.questionsAnswered / data.questionsTotal) * 100)}%` }} />
              </span>
              <p className="cre-rdr-note">
                Your score is based only on the questions you have answered. Answering more makes it
                more accurate.
              </p>
            </div>
          </div>
        </section>

        {/* ---------- do this next ---------- */}
        <section className="cre-rdr-next" aria-label="Do this next">
          <div className="cre-rdr-next__main">
            <p className="cre-rdr-eyebrow cre-rdr-eyebrow--rubi">
              <RubiLogo size={13} aria-hidden />
              Do this next
            </p>
            <h2 className="cre-rdr-h2 serif">Practice {weakest.sub.name}</h2>
            <p className="cre-rdr-body">
              It is your lowest sub-topic, scoring <strong>{weakest.sub.score}</strong>, inside{' '}
              {weakest.topic.name} ({weakest.topic.weight}% of the exam). Raising it is the fastest way
              to move your overall score.
            </p>
            <div className="cre-rdr-actions">
              <button type="button" className="cre-rdr-primary" onClick={go('practice')}>
                Start practice · {weakest.sub.questions} questions, about {weakest.sub.minutes} min
              </button>
              <button type="button" className="cre-rdr-link" onClick={go('learn')}>
                <BookOpenRegular size={14} aria-hidden />
                Read the lesson first
              </button>
            </div>
          </div>
          {stalest ? (
            <div className="cre-rdr-next__also">
              <Clock size={14} aria-hidden />
              <p>
                Also: <strong>{stalest.sub.name}</strong> in {stalest.topic.name} —{' '}
                {lastPracticedLabel(stalest.sub.lastPracticedDaysAgo).toLowerCase()}. A short round
                keeps it fresh.
              </p>
              <button type="button" className="cre-rdr-link" onClick={go('practice')}>
                Review
              </button>
            </div>
          ) : null}
        </section>

        {/* ---------- the trend ---------- */}
        <section className="cre-rdr-card" aria-label="Readiness over time">
          <div className="cre-rdr-card__head">
            <div>
              <p className="cre-rdr-eyebrow">Readiness over time</p>
              <p className="cre-rdr-body">
                Up {data.delta} points in {data.trendWeeks} weeks. A little practice most days moves this
                line more than a long session once a week.
              </p>
            </div>
          </div>
          <TrendChart data={data} />
          <p className="cre-rdr-caption">
            Your overall score is the average of your topic scores, weighted by how much of the exam
            each topic is. Only practice counts toward it.
          </p>
        </section>

        {/* ---------- by topic ---------- */}
        <section className="cre-rdr-topics" aria-label="Readiness by topic">
          <div className="cre-rdr-topics__head">
            <div>
              <h2 className="cre-rdr-h2 serif">Readiness by topic</h2>
              <p className="cre-rdr-subline">
                {ready} of {data.topics.length} topics Ready · weakest first
              </p>
            </div>
            <button
              type="button"
              className="cre-rdr-help"
              aria-expanded={levelsOpen}
              onClick={() => setLevelsOpen((v) => !v)}
            >
              <CircleInfoRegular size={14} aria-hidden />
              What the levels mean
              <ChevronDown size={12} aria-hidden style={{ transform: levelsOpen ? 'rotate(180deg)' : undefined }} />
            </button>
          </div>

          {levelsOpen ? (
            <ul className="cre-rdr-levels">
              {READINESS_BANDS.map((b) => (
                <li key={b.key}>
                  <span className="cre-rdr-levels__name">
                    <span className="cre-rdr-dot" data-band={b.key} aria-hidden />
                    {b.label}
                  </span>
                  <span className="cre-rdr-levels__range">
                    {b.min}–{b.max}
                  </span>
                  <span>{b.text}</span>
                </li>
              ))}
            </ul>
          ) : null}

          <ScaleHeader />

          {topics.map((t) => {
            const expanded = !!open[t.name]
            const tb = bandFor(t.score)
            const rowWeakest = [...t.subTopics].sort((a, b) => a.score - b.score)[0]
            return (
              <article className="cre-rdr-row" key={t.name}>
                <div className="cre-rdr-row__grid">
                  <div className="cre-rdr-row__name">
                    <h3>{t.name}</h3>
                    <p>
                      {t.weight}% of the exam · {t.answered} of {t.total} questions answered
                    </p>
                  </div>
                  <ScoreBar score={t.score} label={`${t.name}: ${t.score} out of 100, ${tb.label}`} />
                  <span className="cre-rdr-score serif" data-band={tb.key}>
                    {t.score}
                  </span>
                  <span className="cre-rdr-level" data-band={tb.key}>
                    {tb.label}
                  </span>
                  <span className="cre-rdr-delta" data-up={t.delta > 0 || undefined}>
                    {t.delta > 0 ? '+' : ''}
                    {t.delta}
                    <span className="cre-rdr-sr"> points in {data.trendWeeks} weeks</span>
                  </span>
                  <span className="cre-rdr-row__actions">
                    <button type="button" className="cre-rdr-link" onClick={go('practice')}>
                      Practice this topic
                    </button>
                    <button
                      type="button"
                      className="cre-rdr-chev"
                      aria-expanded={expanded}
                      aria-label={expanded ? `Hide ${t.name} sub-topics` : `Show ${t.name} sub-topics`}
                      onClick={() => setOpen((o) => ({ ...o, [t.name]: !expanded }))}
                    >
                      <ChevronDown size={14} aria-hidden style={{ transform: expanded ? 'rotate(180deg)' : undefined }} />
                    </button>
                  </span>
                </div>

                {expanded ? (
                  <ul className="cre-rdr-subs">
                    {[...t.subTopics]
                      .sort((a, b) => a.score - b.score)
                      .map((s) => (
                        <SubTopicRow
                          key={s.name}
                          topic={t}
                          sub={s}
                          isWeakest={s === rowWeakest}
                          onPractice={go('practice')}
                          onRead={go('learn')}
                        />
                      ))}
                  </ul>
                ) : null}
              </article>
            )
          })}

          <p className="cre-rdr-foot">
            <CircleInfoRegular size={14} aria-hidden />
            Only practice counts toward Readiness. Finishing lessons moves your course progress, not
            this score. Ready means {READY_AT} or higher in every topic.
          </p>
        </section>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */

function formatPace(p: number): string {
  const r = Math.round(p * 10) / 10
  return `${r > 0 ? '+' : ''}${Number.isInteger(r) ? r : r.toFixed(1)}`
}

/**
 * The replacement for "27 to ready": the gap in time, against the exam.
 * Exported for the test, which pins all four sentences.
 */
export function PaceSentence({ data }: { data: RefinedReadiness }) {
  const v = paceVerdict(data)
  const pace = formatPace(pacePerWeek(data)).replace('+', '')
  switch (v.kind) {
    case 'ready':
      return <>You are there. Keep practicing a little each week so it stays that way.</>
    case 'on-track':
      return (
        <>
          At your pace of about {pace} points a week, you would reach Ready in about{' '}
          <strong>{v.weeksToReady} weeks</strong> — before your exam in {v.weeksToExam}.
        </>
      )
    case 'behind':
      return (
        <>
          At your pace of about {pace} points a week, you would reach Ready in about{' '}
          <strong>{v.weeksToReady} weeks</strong>, {v.weeksShort} {v.weeksShort === 1 ? 'week' : 'weeks'}{' '}
          after your exam. Gaining about {v.neededPerWeek} points a week gets you there in time.
        </>
      )
    case 'no-pace':
      return (
        <>
          Your score has not moved lately. Gaining about {v.neededPerWeek} points a week would make you
          Ready by your exam in {v.weeksToExam} weeks.
        </>
      )
  }
}

/** One ring, the number and the level inside it, coloured by band. */
function ReadinessRing({ score, bandKey, bandLabel }: { score: number; bandKey: ReadinessBandKey; bandLabel: string }) {
  const r = 66
  const c = 2 * Math.PI * r
  const readyAngle = (READY_AT / 100) * 360
  return (
    <div className="cre-rdr-ring" data-band={bandKey}>
      <svg
        viewBox="0 0 160 160"
        width="160"
        height="160"
        role="img"
        aria-label={`Readiness ${score} out of 100, ${bandLabel}. Ready starts at ${READY_AT}.`}
      >
        <g transform="rotate(-90 80 80)">
          <circle cx="80" cy="80" r={r} fill="none" className="cre-rdr-ring__track" strokeWidth="12" />
          <circle
            cx="80"
            cy="80"
            r={r}
            fill="none"
            className="cre-rdr-ring__arc"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${(score / 100) * c} ${c}`}
          />
        </g>
        {/* The Ready mark on the track, so the ring itself says where 85 is. */}
        <g transform={`rotate(${readyAngle - 90} 80 80)`}>
          <line x1="140" y1="80" x2="152" y2="80" className="cre-rdr-ring__mark" strokeWidth="2" />
        </g>
      </svg>
      <div className="cre-rdr-ring__center" aria-hidden>
        <span className="cre-rdr-ring__num serif">{score}</span>
        <span className="cre-rdr-ring__band">{bandLabel}</span>
      </div>
    </div>
  )
}

/** The three level thresholds as gridlines, named in words. */
function TrendChart({ data }: { data: RefinedReadiness }) {
  const w = 880
  const h = 200
  const lo = 30
  const hi = 100
  const y = (s: number) => h - ((s - lo) / (hi - lo)) * h
  const step = w / (data.trend.length - 1)
  const pts = data.trend.map((p, i) => [i * step, y(p.score)] as const)
  const line = pts.map(([x, py], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${py.toFixed(1)}`).join(' ')
  const area = `${line} L${w} ${h} L0 ${h} Z`
  const levels = READINESS_BANDS.filter((b) => b.min > 0)
  const first = data.trend[0]
  const last = data.trend[data.trend.length - 1]
  return (
    <div className="cre-rdr-chart">
      <svg
        viewBox={`0 0 ${w + 150} ${h + 10}`}
        width="100%"
        role="img"
        aria-label={`Readiness rose from ${first.score} on ${first.label} to ${last.score} today. Ready starts at ${READY_AT}.`}
      >
        {levels.map((b) => (
          <g key={b.key}>
            <line
              x1="0"
              x2={w}
              y1={y(b.min)}
              y2={y(b.min)}
              className={b.key === 'ready' ? 'cre-rdr-chart__ready' : 'cre-rdr-chart__grid'}
              strokeWidth={b.key === 'ready' ? 1.5 : 1}
              strokeDasharray={b.key === 'ready' ? '6 5' : '4 6'}
            />
            <text x={w + 14} y={y(b.min) + 4} fontSize="13" className="cre-rdr-chart__label" data-band={b.key}>
              {b.label} {b.min}
            </text>
          </g>
        ))}
        <path d={area} className="cre-rdr-chart__area" />
        <path d={line} fill="none" className="cre-rdr-chart__line" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="6" className="cre-rdr-chart__end" strokeWidth="2.5" />
        <text x={pts[pts.length - 1][0] + 12} y={pts[pts.length - 1][1] - 10} fontSize="14" fontWeight="700" className="cre-rdr-chart__now">
          {last.score}
        </text>
      </svg>
      <div className="cre-rdr-chart__axis" style={{ paddingRight: `${(150 / (w + 150)) * 100}%` }}>
        {data.trend.map((p) => (
          <span key={p.label}>{p.label}</span>
        ))}
      </div>
    </div>
  )
}

/** The one scale every bar below shares, drawn once above the rows. */
function ScaleHeader() {
  const marks = READINESS_BANDS.filter((b) => b.min > 0)
  return (
    <div className="cre-rdr-scale" aria-hidden>
      <span />
      <span className="cre-rdr-scale__track">
        {marks.map((b) => (
          <span key={b.key} className="cre-rdr-scale__mark" style={{ left: `${b.min}%` }}>
            {b.label} {b.min}
          </span>
        ))}
      </span>
      <span className="cre-rdr-scale__col">Score</span>
      <span className="cre-rdr-scale__col">Level</span>
      <span className="cre-rdr-scale__col">Change</span>
      <span />
    </div>
  )
}

/** One bar on one 0–100 scale, the Ready threshold ticked, filled by band. */
function ScoreBar({ score, label, thin }: { score: number; label: string; thin?: boolean }) {
  const b = bandFor(score)
  return (
    <span className={thin ? 'cre-rdr-bar cre-rdr-bar--thin' : 'cre-rdr-bar'} role="img" aria-label={label}>
      <span className="cre-rdr-bar__fill" data-band={b.key} style={{ width: `${score}%` }} />
      {READINESS_BANDS.filter((x) => x.min > 0).map((x) => (
        <span key={x.key} className="cre-rdr-bar__tick" data-ready={x.key === 'ready' || undefined} style={{ left: `${x.min}%` }} />
      ))}
    </span>
  )
}

function SubTopicRow({
  sub,
  isWeakest,
  onPractice,
  onRead,
}: {
  topic: RefinedTopic
  sub: RefinedSubTopic
  isWeakest: boolean
  onPractice: () => void
  onRead: () => void
}) {
  const b = bandFor(sub.score)
  const showRead = b.key === 'beginner' || b.key === 'developing'
  return (
    <li className="cre-rdr-sub" data-weakest={isWeakest || undefined}>
      <span className="cre-rdr-sub__name">
        {sub.name}
        {isWeakest ? <span className="cre-rdr-sub__tag">Weakest</span> : null}
        <span className="cre-rdr-sub__when">{lastPracticedLabel(sub.lastPracticedDaysAgo)}</span>
      </span>
      <ScoreBar thin score={sub.score} label={`${sub.name}: ${sub.score} out of 100, ${b.label}`} />
      <span className="cre-rdr-score cre-rdr-score--sm serif" data-band={b.key}>
        {sub.score}
      </span>
      <span className="cre-rdr-level" data-band={b.key}>
        {b.label}
      </span>
      <span />
      <span className="cre-rdr-row__actions">
        {showRead ? (
          <button type="button" className="cre-rdr-link cre-rdr-link--quiet" onClick={onRead}>
            Read lesson
          </button>
        ) : null}
        {isWeakest ? (
          <button type="button" className="cre-rdr-primary cre-rdr-primary--sm" onClick={onPractice}>
            Practice · {sub.minutes} min
          </button>
        ) : (
          <button type="button" className="cre-rdr-link" onClick={onPractice}>
            Practice
          </button>
        )}
      </span>
    </li>
  )
}
