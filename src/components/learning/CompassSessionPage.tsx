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
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { useDeclareDesignSurface } from '@/context/designSurface'
import { useCompassSessionInShell } from '@/pages/endToEndDemo'
import {
  SESSION_COURSE,
  SESSION_LESSON,
  SESSION_NUDGE,
  SESSION_THREAD,
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
 * ⚠ IT TAKES THE WHOLE FRAME BY DEFAULT, AND THAT IS NOW A CHOICE —
 * `compass-session-chrome`, 2026-10-08, the direct ask for "2 versions of the
 * course content, one that takes over the whole screen, and another one that
 * actually is below the global header".
 *
 * `full-screen` is what shipped and still ships: `setCourseChrome('takeover')`
 * stands the app header down, because this page draws its own bar — the same
 * call `CourseContentV2` makes and for the same reason. `in-shell` uses
 * `courseTakeover`'s OTHER arm (`course`), which keeps the header and thickens
 * its bottom stroke, so the learner stays inside the product's navigation.
 * The demo controls bar survives either way, which is what a moderated run
 * needs.
 *
 * ⚠ THE OLD NOTE SAID "two headers stacked reads as broken rather than as a
 * variant", AND THAT CLAIM NEEDS QUALIFYING NOW. It was written against
 * `CourseContentV2`'s full-screen page, which draws its own LOGO lockup — two
 * XCEL logos is the broken case. `SessionBar` below carries no logo, so
 * `in-shell` stacks a 53px bar under the header rather than a second header.
 * It is still ~114px of chrome before any lesson content, and the fix for that
 * is deliberately deferred (2026-10-08, the direct ask: "leave it for now").
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
  /* THE DESIGN BAR'S "PANEL" — her nudge journey's three states, 2026-10-16
     (`demoPanel('closed'|'idle'|'live')` in
     `public/prototypes/xcel-compass-nudge-journey.html`).

     ⚠ THE FLAG SEEDS THE RAIL, IT DOES NOT PIN IT. Closing Rubi from inside
     the lesson has to keep working — it is the affordance the session is
     demonstrating — so the control sets the state the page OPENS in and the
     close button still shuts it.

     ⚠ SO PICKING THE STATE ALREADY SELECTED DOES NOTHING, which is what a
     radiogroup should do and is not a dead end: the session bar's own Rubi
     button reopens the rail. Re-seeding on every pick would have meant
     treating a no-op selection as an event, and the one place that matters —
     reopening what you just closed — already has a control of its own. */
  useDeclareDesignSurface('compass:session')
  const panel = useFeatureFlag('compass-panel').variant ?? 'closed'
  const [railOpen, setRailOpen] = useState(panel !== 'closed')
  /* Re-seed when the control moves — React's adjust-state-during-render, not
     an effect. An effect would set state in its body, which lints (and costs
     a second render); this runs before the first paint of the new value. */
  const [seededFor, setSeededFor] = useState(panel)
  if (panel !== seededFor) {
    setSeededFor(panel)
    setRailOpen(panel !== 'closed')
  }
  const beats = SESSION_LESSON.beats
  const beat = beats[beatIndex]
  const total = beats.length

  /* ⚠ READ AS A VARIANT, NOT A BOOLEAN. An unset or unknown value falls to the
     shipped arm, so a stale stored flag cannot leave a reviewer in a shape
     nobody chose. */
  const pickedInShell = useFeatureFlag('compass-session-chrome').variant === 'in-shell'
  /* …AND THE END-TO-END WALK TAKES THE IN-SHELL ARM WHATEVER THE CONTROL SAYS
     (2026-10-16, Jillienne: "this course needs to have a header that matches
     Atlas header so user can get back to HOME").

     The walk arrives here from Begin Course on Atlas Home, and full-screen is
     a dead end on that journey: the session's own bar carries no Home, so a
     reviewer walking invite → Atlas → Compass had no way back to the product
     without the browser. In shell, the Atlas header is above the session and
     Home works.

     ⚠ IT DOES NOT CHANGE THE CONTROL'S DEFAULT, and that is the point.
     `full-screen` is still what ships and still what Anjani's Compass tile
     opens — this is her surface and the arm is her decision (`owner:
     'anjani'`, `surfaces: ['compass:session']`). `?journey=full` is the
     End-to-End row's walk, so the override lives exactly where Jillienne is
     assembling the three surfaces and nowhere else.

     ⚠ THE TWO BARS STACK on this arm — the global header plus the session's
     own 53px bar, ~150px before any lesson content. The flag's own note calls
     that the agreed state while the fix is decided, so the walk ships it
     knowingly rather than discovering it. */
  const walkNeedsHome = useCompassSessionInShell()
  /* The lesson's measure, centred — see `compass-session-centred`. Off, the
     column style is simply not applied and the children keep their own caps,
     which is exactly the layout before this. */
  const centred = useFeatureFlag('compass-session-centred').enabled
  /* Key terms: Anjani's rate-to-flip card, or the port's original grid. */
  const keyTermsV2 = useFeatureFlag('compass-key-terms-rating').enabled
  const inShell = pickedInShell || walkNeedsHome
  useEffect(() => {
    setCourseChrome(inShell ? 'course' : 'takeover')
    return () => setCourseChrome('none')
  }, [inShell])

  return (
    <div style={pageStyle}>
      <SessionBar
        index={beatIndex}
        total={total}
        chapter={SESSION_LESSON.chapter}
        onToggleRubi={() => setRailOpen((v) => !v)}
        railOpen={railOpen}
      />
      <div style={{ ...bodyGridStyle, gridTemplateColumns: railOpen ? '220px minmax(0,1fr) 360px' : '220px minmax(0,1fr)' }}>
        <Contents beats={beats} active={beatIndex} onSelect={setBeatIndex} onExit={onExit} />
        <main style={mainStyle}>
          {/* THE LESSON IS A CENTRED COLUMN (2026-10-16, Jillienne, with the
              `<main>` selected: "the course content should be centered in the
              screen"). The card and the footer were already capped at 680 and
              the label was not, so on a wide screen all three sat against the
              left edge of a column that could be twice that — readable, but
              reading as a layout bug rather than a measure. One wrapper
              centres the three together, so the label still lines up with the
              card it names. */}
          <div style={centred ? columnStyle : undefined}>
            <p style={segLabelStyle}>
              <span aria-hidden style={segDotStyle} />
              {beat.kind} · you set the pace
            </p>
            <BeatBody
              beat={beat}
              keyTermsV2={keyTermsV2}
              /* Practice opens Rubi beside the lesson — the rail this page
                 already owns. Hers seeds the composer with the term; the port
                 opens the rail, which is as far as this build's Rubi goes. */
              onPractice={() => setRailOpen(true)}
            />
            <BeatFooter
              index={beatIndex}
              total={total}
              onPrev={() => setBeatIndex((i) => Math.max(0, i - 1))}
              onNext={() => setBeatIndex((i) => Math.min(total - 1, i + 1))}
            />
          </div>
        </main>
        {railOpen ? <RubiRail chatting={panel === 'live'} onClose={() => setRailOpen(false)} /> : null}
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

function BeatBody({
  beat,
  keyTermsV2,
  onPractice,
}: {
  beat: SessionBeat
  keyTermsV2: boolean
  onPractice: (term: string) => void
}) {
  if (beat.type === 'video') return <VideoBeat beat={beat} />
  if (beat.type === 'reading') return <ReadingBeat beat={beat} />
  /* ⚠ A SIBLING, NOT A CONDITIONAL INSIDE THE OLD ONE (CLAUDE.md's rule for
     changing something that exists). `KeyTermsBeat` is untouched and is what
     the flag's off arm renders; `KeyTermsBeatV2` is the port of Anjani's
     design. Both read the same `beat.block.cards`, so the comparison is the
     treatment and never the content. */
  if (beat.type === 'keyterm')
    return keyTermsV2 ? <KeyTermsBeatV2 beat={beat} onPractice={onPractice} /> : <KeyTermsBeat beat={beat} />
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

/* HER CONFIDENCE LEVELS, in her order and her words. `compKeyterm` in
   `public/prototypes/xcel-compass-type-scale-preview.html` is the source —
   the tag lines below are `rate()`'s, verbatim. */
const CONF_LEVELS = [
  { value: 'know', label: 'I know this', tag: 'You felt sure — check it holds.' },
  { value: 'unsure', label: 'Not sure', tag: 'You weren’t sure — good one to revisit.' },
  { value: 'new', label: 'New to me', tag: 'New to you — worth a closer look.' },
] as const
type ConfLevel = (typeof CONF_LEVELS)[number]['value']

/**
 * KEY TERMS, ANJANI'S WAY — ported from her prototype 2026-10-16 (Jillienne,
 * with the beat selected: "This is not matching Anjanis").
 *
 * WHAT THE PORT HAD WRONG was not styling, it was the INTERACTION. The port
 * drew a two-column grid of small cards that said "Flip to check", so the
 * flip was the whole gesture. In hers the RATING IS THE FLIP: each term is a
 * full-width card, you say how sure you are before you look, and answering is
 * what reveals the definition, the example and a way to practise it. The
 * question she asks — "How sure are you before you flip?" — only means
 * anything if answering it is the thing that flips.
 *
 * Taken from `compKeyterm` and `rate()` in
 * `public/prototypes/xcel-compass-type-scale-preview.html` (her `LESSON_DOC`),
 * not from a screenshot: the copy, the three levels, their order and the tag
 * lines are hers verbatim.
 *
 * ⚠ TWO DELIBERATE DIFFERENCES FROM HER FILE:
 *   • SAVE IS INERT, like the Notes button in the bar above it and for the
 *     same reason — this port has no notes store, and a Save that silently
 *     did nothing would be worse than one that is visibly a placeholder.
 *     Hers calls `toggleNote` and flips to "Saved".
 *   • THE TERM IS NOT SET IN PLAYFAIR. Hers is; this repo has no serif token
 *     and `tokens.css` says plainly that adding a webfont for one variant
 *     makes the default view pay for it. `--font-heading` is the nearest
 *     thing already loaded. Worth a decision of its own, not a silent import.
 */
function KeyTermsBeatV2({
  beat,
  onPractice,
}: {
  beat: SessionBeat
  onPractice: (term: string) => void
}) {
  const [conf, setConf] = useState<Record<string, ConfLevel>>({})
  return (
    <>
      {/* Her intro sits ABOVE the cards as plain text — each term is its own
          card, so there is no outer card for it to live inside. */}
      <p style={termsIntroStyle}>{beat.block.intro}</p>
      {beat.block.cards?.map((c) => {
        const level = conf[c.id]
        const rated = CONF_LEVELS.find((l) => l.value === level)
        return (
          <article key={c.id} style={termCardV2Style}>
            <div style={termHeadStyle}>
              <h3 style={termWordV2Style}>{c.term}</h3>
              {/* Drawn and inert — see the note above. */}
              <button type="button" style={termSaveStyle} aria-label={`Save ${c.term} to notes`}>
                Save
              </button>
            </div>
            <p style={termQStyle}>How sure are you before you flip?</p>
            <div role="group" aria-label={`Confidence for ${c.term}`} style={termConfRowStyle}>
              {CONF_LEVELS.map((l) => {
                const on = level === l.value
                return (
                  <button
                    key={l.value}
                    type="button"
                    /* `aria-pressed`, as hers — three toggles in a group, not a
                       radiogroup: re-pressing one keeps the card open rather
                       than clearing the answer. */
                    aria-pressed={on}
                    onClick={() => setConf((f) => ({ ...f, [c.id]: l.value }))}
                    style={on ? termConfOnStyle : termConfStyle}
                  >
                    {l.label}
                  </button>
                )
              })}
            </div>
            {rated && (
              <div style={termBackStyle}>
                <p style={termDefV2Style}>{c.def}</p>
                <p style={termExV2Style}>{c.ex}</p>
                <div style={termBackFootStyle}>
                  <button type="button" style={termPracticeStyle} onClick={() => onPractice(c.term)}>
                    Practice this with Rubi
                  </button>
                  <span style={termTagStyle}>{rated.tag}</span>
                </div>
              </div>
            )}
          </article>
        )
      })}
    </>
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

function RubiRail({ chatting = false, onClose }: { chatting?: boolean; onClose: () => void }) {
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
        {/* CHATTING — the nudge stays above the exchange it started, which is
            the point of the state: the thread is what the nudge turned into,
            not a separate conversation that replaced it. */}
        {chatting ? (
          <ol style={threadStyle}>
            {SESSION_THREAD.map((m, i) => (
              <li key={i} style={m.from === 'learner' ? threadLearnerStyle : threadRubiStyle}>
                {m.text}
              </li>
            ))}
          </ol>
        ) : null}
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
/* The lesson's measure, centred in whatever width is left after the Contents
   rail and (when open) Rubi. 680 is not a new number — it is what `cardStyle`
   and `footerStyle` already used; this is where it becomes the COLUMN rather
   than a cap on two of the three children, which is what left the label
   stretching full width while the card beneath it stopped short. */
const columnStyle: CSSProperties = { width: '100%', maxWidth: 680, marginInline: 'auto' }

/* ── KEY TERMS, ANJANI'S CARD ────────────────────────────────────────────────
   Her values from `xcel-compass-type-scale-preview.html`, mapped onto this
   repo's tokens — never her raw hex, which is the house rule and also what
   keeps the card correct in dark mode. */
const termsIntroStyle: CSSProperties = {
  margin: '0 0 14px',
  fontSize: 14,
  lineHeight: 1.55,
  color: 'var(--color-text-secondary)',
}
const termCardV2Style: CSSProperties = {
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 12,
  padding: 20,
  marginBottom: 14,
}
const termHeadStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
}
const termWordV2Style: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontSize: 23,
  fontWeight: 600,
  color: 'var(--color-text-primary)',
}
const termSaveStyle: CSSProperties = {
  flex: '0 0 auto',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  border: '1px solid var(--color-border-subtle)',
  background: 'var(--color-surface-card)',
  borderRadius: 8,
  padding: '5px 9px',
  fontFamily: 'var(--font-body)',
  fontSize: 11.5,
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
}
const termQStyle: CSSProperties = {
  margin: '14px 0 8px',
  fontSize: 12.5,
  fontWeight: 600,
  color: 'var(--color-text-tertiary)',
}
const termConfRowStyle: CSSProperties = { display: 'flex', gap: 7 }
const termConfStyle: CSSProperties = {
  flex: 1,
  background: 'var(--color-surface-card)',
  border: '1.5px solid var(--color-border-subtle)',
  borderRadius: 8,
  padding: '7px 3px',
  textAlign: 'center',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  color: 'var(--color-text-primary)',
  cursor: 'pointer',
  transition: 'background-color .15s, border-color .15s, color .15s',
}
/* Her pressed state is the Rubi blue filled, which is this palette's primary. */
const termConfOnStyle: CSSProperties = {
  ...termConfStyle,
  background: 'var(--color-primary-700)',
  borderColor: 'var(--color-primary-700)',
  color: 'var(--color-text-inverse)',
}
const termBackStyle: CSSProperties = {
  marginTop: 16,
  borderTop: '1px solid var(--color-border-subtle)',
  paddingTop: 14,
}
const termDefV2Style: CSSProperties = {
  margin: 0,
  fontSize: 17,
  lineHeight: 1.55,
  color: 'var(--color-text-primary)',
}
const termExV2Style: CSSProperties = {
  margin: '8px 0 0',
  paddingLeft: 12,
  borderLeft: '2px solid var(--color-border-subtle)',
  fontSize: 15.5,
  lineHeight: 1.5,
  color: 'var(--color-text-secondary)',
}
const termBackFootStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexWrap: 'wrap',
  marginTop: 14,
}
const termPracticeStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-primary-700)',
  background: 'var(--color-primary-100)',
  border: '1px solid var(--color-primary-200)',
  borderRadius: 10,
  padding: '9px 14px',
  cursor: 'pointer',
}
const termTagStyle: CSSProperties = {
  fontSize: 11.5,
  fontWeight: 600,
  color: 'var(--color-text-tertiary)',
}
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
 /* THE THREAD — the learner's turns ranged right on a tinted ground, Rubi's
    left on the rail's own, both at the rail's reading size. A list rather
    than divs so a screen reader announces how many turns there are. */
const threadStyle: CSSProperties = {
  listStyle: 'none',
  margin: '12px 0 0',
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}

const threadBubbleStyle: CSSProperties = {
  maxWidth: '88%',
  padding: '8px 10px',
  borderRadius: 10,
  fontSize: 13,
  lineHeight: 1.45,
}

const threadLearnerStyle: CSSProperties = {
  ...threadBubbleStyle,
  alignSelf: 'flex-end',
  background: 'var(--color-compass-rubi-soft, var(--color-neutral-100))',
  color: 'var(--color-text-primary)',
}

const threadRubiStyle: CSSProperties = {
  ...threadBubbleStyle,
  alignSelf: 'flex-start',
  background: 'transparent',
  boxShadow: 'inset 0 0 0 1px var(--color-border-subtle, rgb(0 0 0 / 0.1))',
  color: 'var(--color-text-secondary)',
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
