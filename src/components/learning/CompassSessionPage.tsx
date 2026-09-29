import { useEffect, useState, type CSSProperties } from 'react'
import {
  ArrowLeft,
  ArrowsRotate,
  ArrowRight,
  Circle,
  CircleCheck,
  ClipboardList,
  FileText,
  Layout,
  Lightbulb,
  Star,
  Video,
  X,
  RubiLogo,
} from '@/icons'
import { setCourseChrome } from './courseTakeover'
import {
  SESSION_COURSE,
  SESSION_LESSON,
  SESSION_NUDGE,
  type ReadingPara,
  type SessionBeat,
} from '@/data/compassSessionFixtures'

/**
 * THE SESSION — what "Start session" opens (Compass Learning → Tonight), and
 * the screen Jillienne shared on 2026-09-29.
 *
 * Three columns under a lesson bar of its own: CONTENTS on the left, the beat
 * body in the middle, Rubi on the right. Seven beats — Video, Reading, Key
 * terms, Infographic, Knowledge check, Worked example, Recap — all reachable
 * from Contents; the body changes, the chrome does not.
 *
 * ⚠ IT TAKES THE WHOLE FRAME. `setCourseChrome('takeover')` stands the app
 * header down, because this page draws its own bar — the same call
 * `CourseContentV2` makes and for the same reason: two headers stacked reads
 * as broken rather than as a variant. The demo controls bar survives, which is
 * what a moderated run needs.
 *
 * ⚠ THE CONTENT IS ANJANI'S, PORTED VERBATIM — see `compassSessionFixtures`
 * for where from and for the second-home warning that comes with it.
 *
 * ⚠ NOTHING IS SCORED AND NOTHING IS TIMED. The knowledge check reveals its
 * rationale and the key terms flip, because those are the interactions the
 * screen is about; no answer is recorded, no progress moves, and the
 * percentage in the bar is the beat position rather than a result. A session
 * that looked like it was keeping score would be making a promise the
 * prototype cannot keep.
 */
export function CompassSessionPage({ onExit }: { onExit: () => void }) {
  const [beatIndex, setBeatIndex] = useState(0)
  const [railOpen, setRailOpen] = useState(true)
  const beats = SESSION_LESSON.beats
  const beat = beats[beatIndex]
  const total = beats.length

  useEffect(() => {
    setCourseChrome('takeover')
    return () => setCourseChrome('none')
  }, [])

  return (
    <div style={pageStyle}>
      <SessionBar
        index={beatIndex}
        total={total}
        chapter={SESSION_LESSON.chapter}
        onToggleRubi={() => setRailOpen((v) => !v)}
        railOpen={railOpen}
      />
      <div style={{ ...bodyGridStyle, gridTemplateColumns: railOpen ? '240px minmax(0,1fr) 360px' : '240px minmax(0,1fr)' }}>
        <Contents beats={beats} active={beatIndex} onSelect={setBeatIndex} onExit={onExit} />
        <main style={mainStyle}>
          <p style={segLabelStyle}>
            <span aria-hidden style={segDotStyle} />
            {beat.kind} · you set the pace
          </p>
          <BeatBody beat={beat} />
          <BeatFooter
            index={beatIndex}
            total={total}
            onPrev={() => setBeatIndex((i) => Math.max(0, i - 1))}
            onNext={() => setBeatIndex((i) => Math.min(total - 1, i + 1))}
          />
        </main>
        {railOpen ? <RubiRail onClose={() => setRailOpen(false)} /> : null}
      </div>
    </div>
  )
}

/* ─── the lesson bar ───────────────────────────────────────────────────── */

function SessionBar({
  index,
  total,
  chapter,
  onToggleRubi,
  railOpen,
}: {
  index: number
  total: number
  chapter: string
  onToggleRubi: () => void
  railOpen: boolean
}) {
  /* ⚠ POSITION, NOT ATTAINMENT. The figure is how far along the beats the
     learner is, and it reads 0% on the first one because they have not
     finished anything yet — which is what the shared screen shows. It is not a
     score and must never be dressed as one. */
  const pct = Math.round((index / total) * 100)
  return (
    <header style={barStyle}>
      <div style={barCentreStyle}>
        <div style={barLineStyle}>
          <span style={barEyebrowStyle}>
            Lesson {index + 1} of {total}
          </span>
          <span style={barTitleStyle}>{chapter}</span>
          <span style={barPctStyle}>{pct}%</span>
        </div>
        <div
          style={trackStyle}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-label={`Lesson progress: ${pct}%`}
        >
          <span aria-hidden style={{ ...trackFillStyle, width: `${pct}%` }} />
          <span aria-hidden style={{ ...trackKnobStyle, left: `calc(${pct}% - 7px)` }} />
        </div>
      </div>
      <div style={barActionsStyle}>
        {/* Notes is drawn in the design and deliberately inert — there is no
            note store behind it, and a count that never moves is honest only
            while it says zero. */}
        <button type="button" style={barButtonStyle}>
          <FileText size={14} aria-hidden />
          Notes
          <span style={barCountStyle}>0</span>
        </button>
        <button
          type="button"
          style={{ ...barButtonStyle, ...(railOpen ? barButtonOnStyle : null) }}
          onClick={onToggleRubi}
          aria-pressed={railOpen}
        >
          <RubiLogo size={14} aria-hidden />
          Rubi
        </button>
      </div>
    </header>
  )
}

/* ─── contents ─────────────────────────────────────────────────────────── */

const BEAT_ICON = {
  video: Video,
  reading: FileText,
  keyterm: Star,
  /* ⚠ NOT A CHART GLYPH. The design draws a small bar chart and the icon
     registry — self-hosted Font Awesome 7 Pro Light — has none, so this takes
     the panel mark rather than a look-alike from another family. */
  infographic: Layout,
  check: ClipboardList,
  recap: ArrowsRotate,
} as const

function Contents({
  beats,
  active,
  onSelect,
  onExit,
}: {
  beats: SessionBeat[]
  active: number
  onSelect: (i: number) => void
  onExit: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  /* Three chapters by default — the one behind, the live one, the one ahead.
     The rest are a click away, which is what the design's "Show all" offers. */
  const chapters = expanded ? SESSION_COURSE.chapters : SESSION_COURSE.chapters.slice(0, 3)
  return (
    <aside style={contentsStyle} aria-label="Contents">
      <div style={contentsHeadStyle}>
        <span style={contentsTitleStyle}>Contents</span>
        {/* The design's collapse control. It leaves the session rather than
            narrowing the column — the one exit this page has, so it is labelled
            for what it does. */}
        <button type="button" style={iconButtonStyle} onClick={onExit} aria-label="Leave the session">
          <ArrowLeft size={14} aria-hidden />
        </button>
      </div>
      <ol style={chapterListStyle}>
        {chapters.map((ch) => (
          <li key={ch.id} style={{ marginBottom: 14 }}>
            <div style={chapterRowStyle}>
              <ChapterMark state={ch.state} />
              <span style={chapterNameStyle(ch.state)}>{ch.name}</span>
            </div>
            <p style={chapterNoteStyle}>
              {ch.state === 'done'
                ? 'Done'
                : ch.state === 'here'
                  ? `You're here · ${Math.round((active / beats.length) * 100)}%`
                  : ch.state === 'locked'
                    ? (ch.note ?? 'Locked')
                    : 'Up next'}
            </p>
            {ch.state === 'here' ? (
              <ul style={beatListStyle}>
                {beats.map((b, i) => {
                  /* ⚠ BY KIND, THEN BY TYPE. Worked example IS a reading —
                     same shapes, same renderer — so keying the icon off `type`
                     alone gave it the Reading glyph and two Contents rows that
                     looked like the same thing. The label is what the learner
                     reads, so the label is what the icon has to agree with. */
                  const Icon = b.kind === 'Worked example' ? Lightbulb : BEAT_ICON[b.type]
                  const isActive = i === active
                  return (
                    <li key={b.id}>
                      <button
                        type="button"
                        onClick={() => onSelect(i)}
                        aria-current={isActive ? 'step' : undefined}
                        style={{ ...beatRowStyle, ...(isActive ? beatRowActiveStyle : null) }}
                      >
                        <Icon size={13} aria-hidden />
                        <span style={{ flex: 1, textAlign: 'left' }}>{b.kind}</span>
                        {isActive ? <span style={nowBadgeStyle}>now</span> : null}
                      </button>
                    </li>
                  )
                })}
              </ul>
            ) : null}
          </li>
        ))}
      </ol>
      <div style={contentsFootStyle}>
        <button type="button" style={showAllStyle} onClick={() => setExpanded((v) => !v)}>
          {expanded
            ? 'Show fewer chapters'
            : `Show all ${SESSION_COURSE.chapters.length} chapters`}
        </button>
      </div>
    </aside>
  )
}

function ChapterMark({ state }: { state: 'done' | 'here' | 'upcoming' | 'locked' }) {
  if (state === 'done') return <CircleCheck size={14} aria-hidden />
  if (state === 'here') return <span aria-hidden style={hereMarkStyle} />
  return <Circle size={14} aria-hidden />
}

/* ─── the beat bodies ──────────────────────────────────────────────────── */

function BeatBody({ beat }: { beat: SessionBeat }) {
  if (beat.type === 'video') return <VideoBeat beat={beat} />
  if (beat.type === 'reading') return <ReadingBeat beat={beat} />
  if (beat.type === 'keyterm') return <KeyTermsBeat beat={beat} />
  if (beat.type === 'check') return <CheckBeat beat={beat} />
  if (beat.type === 'recap') return <RecapBeat beat={beat} />
  return <InfographicBeat beat={beat} />
}

function VideoBeat({ beat }: { beat: SessionBeat }) {
  const b = beat.block
  return (
    <article style={cardStyle}>
      <div style={videoStyle}>
        <p style={videoTagStyle}>{b.videoTag}</p>
        {/* ⚠ NOT A `<video>`. There is no asset behind this — the prototype
            draws the poster and so does this. A real player element with
            nothing to play would be a broken control rather than a still. */}
        <span aria-hidden style={playStyle}>
          <span style={playTriangleStyle} />
        </span>
        <span style={durationStyle}>{b.duration}</span>
      </div>
      <p style={captionStyle}>{b.caption}</p>
      <div style={transcriptStyle}>
        <p style={transcriptHeadStyle}>Transcript · hover a line to save it</p>
        {b.transcript?.map((line) => (
          <p key={line.id} style={transcriptLineStyle}>
            <span style={transcriptTsStyle}>{line.ts}</span>
            <span>{line.s}</span>
          </p>
        ))}
      </div>
    </article>
  )
}

/** Shared by Reading and Worked example — the same shapes, a different lede. */
function ReadingBeat({ beat }: { beat: SessionBeat }) {
  const b = beat.block
  return (
    <article style={cardStyle}>
      {b.title ? <h2 style={beatTitleStyle}>{b.title}</h2> : null}
      {b.paras?.map((p) => (
        <Para key={p.id} para={p} />
      ))}
    </article>
  )
}

function Para({ para }: { para: ReadingPara }) {
  /* ⚠ `dangerouslySetInnerHTML`, deliberately and narrowly. The authored
     bodies carry inline `term-inline` spans whose `title` holds the plain-
     language definition, plus bolded lead-ins — the teaching, not decoration.
     The content is static, in-repo and authored; no user input reaches it, and
     nothing here is fetched. */
  if (para.h) return <h3 style={readingHeadStyle} dangerouslySetInnerHTML={{ __html: para.html }} />
  if (para.note)
    return <aside style={noteStyle} dangerouslySetInnerHTML={{ __html: para.html }} />
  return (
    <p
      style={para.lede ? ledeStyle : readingParaStyle}
      dangerouslySetInnerHTML={{ __html: para.html }}
    />
  )
}

function KeyTermsBeat({ beat }: { beat: SessionBeat }) {
  const [flipped, setFlipped] = useState<Record<string, boolean>>({})
  return (
    <article style={cardStyle}>
      <p style={introStyle}>{beat.block.intro}</p>
      <div style={cardsGridStyle}>
        {beat.block.cards?.map((c) => {
          const open = !!flipped[c.id]
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setFlipped((f) => ({ ...f, [c.id]: !f[c.id] }))}
              aria-expanded={open}
              style={termCardStyle}
            >
              <span style={termWordStyle}>{c.term}</span>
              {open ? (
                <>
                  <span style={termDefStyle}>{c.def}</span>
                  <span style={termExStyle}>{c.ex}</span>
                </>
              ) : (
                <span style={termHintStyle}>Flip to check</span>
              )}
            </button>
          )
        })}
      </div>
    </article>
  )
}

function CheckBeat({ beat }: { beat: SessionBeat }) {
  const [picked, setPicked] = useState<Record<string, number>>({})
  return (
    <article style={cardStyle}>
      {beat.block.items?.map((q, n) => {
        const choice = picked[q.id]
        const answered = choice != null
        return (
          <fieldset key={q.id} style={questionStyle}>
            <legend style={stemStyle}>
              <span style={stemNumStyle}>{n + 1}</span>
              {q.stem}
            </legend>
            {q.options.map((opt, i) => {
              const isPicked = choice === i
              const isRight = i === q.correct
              return (
                <label
                  key={opt}
                  style={{
                    ...optionStyle,
                    ...(answered && isRight ? optionRightStyle : null),
                    ...(answered && isPicked && !isRight ? optionWrongStyle : null),
                  }}
                >
                  <input
                    type="radio"
                    name={q.id}
                    checked={isPicked}
                    onChange={() => setPicked((p) => ({ ...p, [q.id]: i }))}
                  />
                  {opt}
                </label>
              )
            })}
            {/* The rationale is the half that teaches, so it appears however
                the learner answered — not only when they are wrong. */}
            {answered ? <p style={rationaleStyle}>{q.rationale}</p> : null}
          </fieldset>
        )
      })}
    </article>
  )
}

function RecapBeat({ beat }: { beat: SessionBeat }) {
  return (
    <article style={cardStyle}>
      <dl style={{ margin: 0 }}>
        {beat.block.terms?.map((t) => (
          <div key={t.w} style={recapRowStyle}>
            <dt style={recapTermStyle}>{t.w}</dt>
            <dd style={recapDefStyle}>{t.d}</dd>
          </div>
        ))}
      </dl>
    </article>
  )
}

function InfographicBeat({ beat }: { beat: SessionBeat }) {
  return (
    <article style={cardStyle}>
      <h2 style={beatTitleStyle}>{beat.block.title}</h2>
      <p style={introStyle}>{beat.block.sub}</p>
      {/* ⚠ THE PLACEHOLDER IS THE SOURCE'S OWN STATE, not a shortcut. The
          prototype authors this beat as a title and a subtitle with no chart
          data behind it, so there is nothing to plot. Inventing a curve here
          would be inventing the teaching. */}
      <div aria-hidden style={infographicStyle}>
        <Lightbulb size={18} />
        <span>Chart to come — the source has no data behind this one yet.</span>
      </div>
    </article>
  )
}

function BeatFooter({
  index,
  total,
  onPrev,
  onNext,
}: {
  index: number
  total: number
  onPrev: () => void
  onNext: () => void
}) {
  return (
    <nav style={footerStyle} aria-label="Lesson steps">
      <button type="button" onClick={onPrev} disabled={index === 0} style={stepButtonStyle}>
        <ArrowLeft size={14} aria-hidden />
        Previous
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={index === total - 1}
        style={{ ...stepButtonStyle, ...stepButtonNextStyle }}
      >
        Next
        <ArrowRight size={14} aria-hidden />
      </button>
    </nav>
  )
}

/* ─── Rubi ─────────────────────────────────────────────────────────────── */

function RubiRail({ onClose }: { onClose: () => void }) {
  return (
    <aside style={railStyle} aria-label="Rubi">
      <div style={railHeadStyle}>
        <RubiLogo size={18} aria-hidden />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={railNameStyle}>Rubi</span>
          <span style={railTagStyle}>here to help</span>
        </span>
        <button type="button" style={iconButtonStyle} onClick={onClose} aria-label="Close Rubi">
          <X size={14} aria-hidden />
        </button>
      </div>
      <div style={railBodyStyle}>
        {/* ⚠ THE NUDGE IS SHOWN FIRED, AND NOTHING FIRES IT. In the prototype a
            dwell timer decides when this appears; here it is the rail's opening
            state so the treatment can be designed against. It says "most people
            slow down on" — a claim about a cohort this build does not measure,
            which is exactly why it must not be wired to look measured. */}
        <p style={railEyebrowStyle}>Rubi</p>
        <p style={railLineStyle}>{SESSION_NUDGE.line}</p>
      </div>
      <div style={railFootStyle}>
        {SESSION_NUDGE.acts.map((a) => (
          <button key={a} type="button" style={chipStyle}>
            {a}
          </button>
        ))}
        <div style={askStyle}>
          <input placeholder="Ask Rubi about this…" aria-label="Ask Rubi" style={askInputStyle} />
          <button type="button" style={sendStyle} aria-label="Send">
            <ArrowRight size={14} aria-hidden />
          </button>
        </div>
      </div>
    </aside>
  )
}

/* ─── styles ───────────────────────────────────────────────────────────── */

const pageStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minHeight: 0,
  background: 'var(--color-surface-card)',
}
const barStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 24,
  padding: '10px 20px',
  borderBottom: '1px solid var(--color-border-subtle)',
  flex: 'none',
}
const barCentreStyle: CSSProperties = { flex: 1, minWidth: 0, maxWidth: 900, margin: '0 auto' }
const barLineStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: 16,
  justifyContent: 'center',
}
const barEyebrowStyle: CSSProperties = {
  fontSize: 10,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--color-text-tertiary)',
}
const barTitleStyle: CSSProperties = { fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }
const barPctStyle: CSSProperties = { fontSize: 11, color: 'var(--color-text-tertiary)' }
const trackStyle: CSSProperties = {
  position: 'relative',
  height: 3,
  borderRadius: 2,
  background: 'var(--color-border-subtle)',
  marginTop: 8,
}
const trackFillStyle: CSSProperties = {
  position: 'absolute',
  inset: '0 auto 0 0',
  borderRadius: 2,
  background: 'var(--color-primary-500)',
}
const trackKnobStyle: CSSProperties = {
  position: 'absolute',
  top: -5,
  width: 13,
  height: 13,
  borderRadius: '50%',
  background: 'var(--color-surface-card)',
  border: '2px solid var(--color-primary-700)',
  boxSizing: 'border-box',
}
const barActionsStyle: CSSProperties = { display: 'flex', gap: 8, flex: 'none' }
const barButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  height: 32,
  padding: '0 12px',
  borderRadius: 8,
  border: '1px solid var(--color-border-subtle)',
  background: 'var(--color-surface-card)',
  fontFamily: 'inherit',
  fontSize: 12.5,
  fontWeight: 600,
  color: 'var(--color-text-primary)',
  cursor: 'pointer',
}
const barButtonOnStyle: CSSProperties = {
  background: 'var(--color-primary-100)',
  borderColor: 'var(--color-primary-200)',
}
const barCountStyle: CSSProperties = {
  fontSize: 11,
  color: 'var(--color-text-tertiary)',
  background: 'var(--color-neutral-100)',
  borderRadius: 999,
  padding: '1px 6px',
}
const bodyGridStyle: CSSProperties = { display: 'grid', flex: 1, minHeight: 0 }
const contentsStyle: CSSProperties = {
  borderRight: '1px solid var(--color-border-subtle)',
  padding: '18px 16px',
  overflowY: 'auto',
  minHeight: 0,
}
const contentsHeadStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 16,
}
const contentsTitleStyle: CSSProperties = {
  fontSize: 10,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--color-text-secondary)',
  fontWeight: 600,
}
const iconButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 26,
  height: 26,
  borderRadius: 6,
  border: '1px solid var(--color-border-subtle)',
  background: 'transparent',
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
}
const chapterListStyle: CSSProperties = { listStyle: 'none', margin: 0, padding: 0 }
const chapterRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  color: 'var(--color-primary-700)',
}
const chapterNameStyle = (state: string): CSSProperties => ({
  fontSize: 13,
  fontWeight: state === 'here' ? 700 : 500,
  color: state === 'upcoming' || state === 'locked'
    ? 'var(--color-text-secondary)'
    : 'var(--color-text-primary)',
})
const chapterNoteStyle: CSSProperties = {
  margin: '2px 0 0 22px',
  fontSize: 11,
  color: 'var(--color-text-tertiary)',
}
const beatListStyle: CSSProperties = { listStyle: 'none', margin: '8px 0 0', padding: '0 0 0 12px' }
const beatRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 9,
  width: '100%',
  padding: '6px 8px',
  borderRadius: 6,
  border: 'none',
  background: 'transparent',
  fontFamily: 'inherit',
  fontSize: 12.5,
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
}
const beatRowActiveStyle: CSSProperties = {
  background: 'var(--color-neutral-100)',
  color: 'var(--color-text-primary)',
  fontWeight: 600,
}
const nowBadgeStyle: CSSProperties = {
  fontSize: 10,
  color: 'var(--color-text-tertiary)',
  fontWeight: 500,
}
const hereMarkStyle: CSSProperties = {
  width: 12,
  height: 12,
  borderRadius: '50%',
  background: 'var(--color-primary-600)',
  flex: 'none',
}
const contentsFootStyle: CSSProperties = {
  marginTop: 14,
  paddingTop: 12,
  borderTop: '1px dashed var(--color-border-subtle)',
}
const showAllStyle: CSSProperties = {
  background: 'transparent',
  border: 'none',
  padding: 0,
  fontFamily: 'inherit',
  fontSize: 12,
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
}
const mainStyle: CSSProperties = { minWidth: 0, minHeight: 0, overflowY: 'auto', padding: '20px 32px 64px' }
const segLabelStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  margin: '0 0 14px',
  fontSize: 10.5,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--color-text-secondary)',
}
const segDotStyle: CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: '50%',
  background: 'var(--color-primary-600)',
}
const cardStyle: CSSProperties = {
  maxWidth: 680,
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 10,
  overflow: 'hidden',
  background: 'var(--color-surface-card)',
}
const videoStyle: CSSProperties = {
  position: 'relative',
  aspectRatio: '16 / 9',
  background: 'var(--color-primary-800)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}
const videoTagStyle: CSSProperties = {
  position: 'absolute',
  top: 14,
  left: 16,
  margin: 0,
  fontSize: 10,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'rgb(255 255 255 / 0.75)',
}
const playStyle: CSSProperties = {
  width: 52,
  height: 52,
  borderRadius: '50%',
  background: 'var(--color-surface-card)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}
/* A CSS triangle — the registry has no play glyph, and a triangle drawn in
   borders is a shape rather than a borrowed icon. */
const playTriangleStyle: CSSProperties = {
  width: 0,
  height: 0,
  marginLeft: 4,
  borderTop: '9px solid transparent',
  borderBottom: '9px solid transparent',
  borderLeft: '15px solid var(--color-primary-800)',
}
const durationStyle: CSSProperties = {
  position: 'absolute',
  right: 12,
  bottom: 12,
  fontSize: 11,
  color: 'var(--color-text-inverse)',
  background: 'rgb(0 0 0 / 0.65)',
  borderRadius: 4,
  padding: '2px 6px',
}
const captionStyle: CSSProperties = {
  margin: 0,
  padding: '14px 18px',
  fontSize: 14.5,
  color: 'var(--color-text-primary)',
  borderBottom: '1px solid var(--color-border-subtle)',
}
const transcriptStyle: CSSProperties = { padding: '14px 18px 18px' }
const transcriptHeadStyle: CSSProperties = {
  margin: '0 0 10px',
  fontSize: 10,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--color-text-tertiary)',
}
const transcriptLineStyle: CSSProperties = {
  display: 'flex',
  gap: 14,
  margin: '0 0 8px',
  fontSize: 14,
  lineHeight: 1.5,
  color: 'var(--color-text-primary)',
}
const transcriptTsStyle: CSSProperties = {
  flex: 'none',
  width: 34,
  fontSize: 11.5,
  color: 'var(--color-text-tertiary)',
  paddingTop: 3,
}
const beatTitleStyle: CSSProperties = {
  margin: '18px 18px 10px',
  fontFamily: 'var(--font-heading, Georgia, serif)',
  fontSize: 20,
  fontWeight: 600,
  color: 'var(--color-text-primary)',
}
const ledeStyle: CSSProperties = {
  margin: '0 18px 14px',
  fontSize: 16,
  lineHeight: 1.6,
  color: 'var(--color-text-primary)',
}
const readingParaStyle: CSSProperties = {
  margin: '0 18px 12px',
  fontSize: 14.5,
  lineHeight: 1.65,
  color: 'var(--color-text-primary)',
}
const readingHeadStyle: CSSProperties = {
  margin: '20px 18px 8px',
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: '0.02em',
  color: 'var(--color-text-primary)',
}
const noteStyle: CSSProperties = {
  margin: '14px 18px',
  padding: '12px 14px',
  borderLeft: '3px solid var(--color-warning-500)',
  background: 'var(--color-warning-100)',
  borderRadius: 4,
  fontSize: 13.5,
  lineHeight: 1.55,
  color: 'var(--color-text-primary)',
}
const introStyle: CSSProperties = {
  margin: '18px 18px 14px',
  fontSize: 14,
  color: 'var(--color-text-secondary)',
  lineHeight: 1.55,
}
const cardsGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
  gap: 10,
  padding: '0 18px 18px',
}
const termCardStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  alignItems: 'flex-start',
  textAlign: 'left',
  padding: 12,
  borderRadius: 8,
  border: '1px solid var(--color-border-subtle)',
  background: 'var(--color-surface-card)',
  fontFamily: 'inherit',
  cursor: 'pointer',
}
const termWordStyle: CSSProperties = { fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }
const termDefStyle: CSSProperties = { fontSize: 13, lineHeight: 1.5, color: 'var(--color-text-primary)' }
const termExStyle: CSSProperties = { fontSize: 12.5, lineHeight: 1.5, color: 'var(--color-text-secondary)' }
const termHintStyle: CSSProperties = { fontSize: 12, color: 'var(--color-text-tertiary)' }
const questionStyle: CSSProperties = {
  border: 'none',
  borderTop: '1px solid var(--color-border-subtle)',
  margin: 0,
  padding: '16px 18px',
}
const stemStyle: CSSProperties = {
  display: 'flex',
  gap: 10,
  fontSize: 14.5,
  fontWeight: 600,
  color: 'var(--color-text-primary)',
  marginBottom: 10,
  padding: 0,
}
const stemNumStyle: CSSProperties = { color: 'var(--color-text-tertiary)', flex: 'none' }
const optionStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '8px 10px',
  borderRadius: 6,
  fontSize: 14,
  color: 'var(--color-text-primary)',
  cursor: 'pointer',
}
const optionRightStyle: CSSProperties = {
  background: 'var(--color-success-100)',
  fontWeight: 600,
}
const optionWrongStyle: CSSProperties = { background: 'var(--color-warning-100)' }
const rationaleStyle: CSSProperties = {
  margin: '10px 0 0',
  fontSize: 13.5,
  lineHeight: 1.55,
  color: 'var(--color-text-secondary)',
}
const recapRowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '160px minmax(0, 1fr)',
  gap: 14,
  padding: '12px 18px',
  borderTop: '1px solid var(--color-border-subtle)',
}
const recapTermStyle: CSSProperties = { fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }
const recapDefStyle: CSSProperties = {
  margin: 0,
  fontSize: 13.5,
  lineHeight: 1.55,
  color: 'var(--color-text-secondary)',
}
const infographicStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  margin: '0 18px 18px',
  padding: '28px 18px',
  borderRadius: 8,
  border: '1px dashed var(--color-border-subtle)',
  color: 'var(--color-text-tertiary)',
  fontSize: 13,
}
const footerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  maxWidth: 680,
  marginTop: 20,
}
const stepButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
  height: 36,
  padding: '0 14px',
  borderRadius: 8,
  border: '1px solid var(--color-border-subtle)',
  background: 'var(--color-surface-card)',
  fontFamily: 'inherit',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-text-primary)',
  cursor: 'pointer',
}
const stepButtonNextStyle: CSSProperties = {
  background: 'var(--color-primary-500)',
  borderColor: 'var(--color-primary-500)',
  color: 'var(--color-text-inverse)',
}
const railStyle: CSSProperties = {
  borderLeft: '1px solid var(--color-border-subtle)',
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
}
const railHeadStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '14px 16px',
  borderBottom: '1px solid var(--color-border-subtle)',
  color: 'var(--color-error-600, #b23b2e)',
}
const railNameStyle: CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-heading, Georgia, serif)',
  fontSize: 16,
  fontWeight: 600,
  color: 'var(--color-error-600, #b23b2e)',
}
const railTagStyle: CSSProperties = {
  display: 'block',
  fontSize: 11.5,
  color: 'var(--color-text-tertiary)',
}
const railBodyStyle: CSSProperties = { flex: 1, minHeight: 0, overflowY: 'auto', padding: '14px 16px' }
const railEyebrowStyle: CSSProperties = {
  margin: '0 0 6px',
  fontSize: 10,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  fontWeight: 700,
  color: 'var(--color-error-600, #b23b2e)',
}
const railLineStyle: CSSProperties = {
  margin: 0,
  fontSize: 13.5,
  lineHeight: 1.55,
  color: 'var(--color-text-primary)',
}
const railFootStyle: CSSProperties = {
  borderTop: '1px solid var(--color-border-subtle)',
  padding: 14,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}
const chipStyle: CSSProperties = {
  alignSelf: 'flex-start',
  padding: '7px 12px',
  borderRadius: 8,
  border: '1px solid var(--color-border-subtle)',
  background: 'var(--color-surface-card)',
  fontFamily: 'inherit',
  fontSize: 12.5,
  color: 'var(--color-text-primary)',
  cursor: 'pointer',
  textAlign: 'left',
}
const askStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginTop: 4,
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 8,
  padding: '4px 4px 4px 12px',
}
const askInputStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  border: 'none',
  outline: 'none',
  background: 'transparent',
  fontFamily: 'inherit',
  fontSize: 13,
  color: 'var(--color-text-primary)',
}
const sendStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 30,
  height: 30,
  borderRadius: 6,
  border: 'none',
  background: 'var(--color-primary-500)',
  color: 'var(--color-text-inverse)',
  cursor: 'pointer',
  flex: 'none',
}
