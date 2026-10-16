import { useState, type CSSProperties, type KeyboardEvent } from 'react'

/**
 * THE READINESS CARD, FIVE LEVELS — Figma "Atlas-UX-Design" component 295:10698
 * (2026-10-09, Eric's request; it replaced the single 35% card from 254:8012),
 * on Eric/Atlas V3's Home under the Course progress module.
 *
 * "Readiness for state exam", a question, and a HALF-dial (the top half of a
 * ring, filled from its left end clockwise) with the LEVEL inside it in place
 * of a figure:
 *
 *   1 NOVICE   2 ADVANCED BEGINNER   3 COMPETENT   4 PROFICIENT   5 EXAM READY
 *
 * ⚠ FOR NOW CLICKING THE CARD FLIPS TO THE NEXT LEVEL (Eric: "we will correlate
 * these at some level to course progress at a later date"). It is a review
 * device; Enter and Space do the same.
 *
 * ⚠ THE ARC FRACTIONS ARE READ OFF THE DESIGN'S DRAWN ARCS (their end points on
 * the ring), not given as numbers in the file — about 13 / 38 / 66 / 85 / 100%.
 */
type Level = { name: string; lines: string[]; fill: number; caption?: string }

/* ⚠ THE SIXTH STATE, AND IT IS NOT A LEVEL (2026-10-16, Jillienne: "just do
   not show anything in the graph. change the text to Not Started. Will update
   as you progress through course material.").

   It is deliberately OUTSIDE `LEVELS`: the five are a scale a learner moves
   along, and "nothing measured yet" is not a point on it — putting it in the
   array would make it level 1 of 6, which is exactly the claim the empty dial
   exists to avoid. `fill: 0` draws the track and no arc.

   An earlier pass HID the whole card at 0%. That removed the number and the
   fact that readiness exists with it; naming the empty state says both. */
const NOT_STARTED: Level = {
  name: 'Not Started',
  lines: ['Not Started'],
  fill: 0,
  caption: 'Will update as you progress through course material',
}
/* THE FOUR BANDS (2026-10-16, Jillienne's bands image): Beginner <40,
   Developing 40–64, Proficient 65–84, Ready 85+. They replace the five that
   were here — Novice, Advanced Beginner, Competent, Proficient, Exam Ready —
   so the card, the demo bar and that image use one set of words.

   ⚠ `fill` IS THE DEMO'S PROGRESS FIGURE, NOT THE BAND'S FLOOR, and the two
   do not agree: 36% is Developing here while the bands put it in Beginner.
   That is Jillienne's mapping and it is deliberate — "this is just to help
   show these states in the demo" — chosen so five demo states step visibly
   apart. It is a demo ladder, not the scoring rule.

   ⚠ AND READINESS IS NOT COMPLETION. 100% progress showing Ready is the
   demo's shorthand; somebody can finish a course and not be ready. Flagged
   for its own pass (2026-10-16) — when real scoring lands, this table is the
   thing that has to stop being a straight map from progress. */
const LEVELS: Level[] = [
  { name: 'Beginner', lines: ['Beginner'], fill: 14 },
  { name: 'Developing', lines: ['Developing'], fill: 36 },
  { name: 'Proficient', lines: ['Proficient'], fill: 75 },
  { name: 'Ready', lines: ['Ready'], fill: 100 },
]

/** `initialLevel` (0–4) picks the level it opens on — V3's Completed view opens
 *  on Proficient (2026-10-09); remount with a `key` to apply a new one. */
export function AtlasReadinessCard({
  initialLevel = 0,
  notStarted = false,
  onPastLast,
  bare = false,
}: {
  initialLevel?: number
  /** Opens on the empty state: the dial drawn with no arc, named "Not
   *  Started". Pressing the card still moves into the five levels, so the
   *  demo's step-through is unchanged — this is only where it starts. */
  notStarted?: boolean
  /** Called INSTEAD of wrapping to Novice when Exam Ready is clicked — V3
   *  resets the page to Not Started with it (2026-10-09). */
  onPastLast?: () => void
  /** No card of its own and a centred eyebrow, for a combined Progress +
   *  Readiness panel (Figma 286:9455; Eric/Atlas White, 2026-10-14). */
  bare?: boolean
}) {
  /* `null` is the empty state, not an index — see `NOT_STARTED`. Pressing
     from there enters the scale at its first level. */
  const [i, setI] = useState<number | null>(notStarted ? null : initialLevel)
  const level = i == null ? NOT_STARTED : LEVELS[i]
  const next = () => {
    if (i == null) setI(0)
    else if (onPastLast && i === LEVELS.length - 1) onPastLast()
    else setI((n) => ((n ?? 0) + 1) % LEVELS.length)
  }
  const onKey = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      next()
    }
  }
  return (
    <section
      aria-label={
        i == null
          ? `Readiness for state exam — ${NOT_STARTED.name}. ${NOT_STARTED.caption}. Press to show the first level.`
          : `Readiness for state exam — ${level.name}, level ${i + 1} of ${LEVELS.length}. Press to show the next level.`
      }
      role="button"
      tabIndex={0}
      onClick={next}
      onKeyDown={onKey}
      className="cre-atlas-readiness-states"
      style={bare ? BARE_CARD : CARD}
    >
      <p style={bare ? BARE_EYEBROW : EYEBROW}>Readiness for state exam</p>
      {/* Bare drops the question and the link: Figma 286:9455 shows
          neither (2026-10-14, Eric). */}
      {bare ? null : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <span aria-hidden style={RULE} />
          <p style={QUESTION}>How Ready are you for your State Exam?</p>
        </div>
      )}
      <HalfDial level={level} />
      {/* A link on every level, styled as the Study pace tile's (2026-10-09,
          Eric's request). A span, not a button: the card is
          itself the button for now, and buttons cannot nest. Not wired. */}
      {/* A divider above it, the card's own Tertiary 300 rule (2026-10-09, Eric). */}
      {bare ? null : (
        <>
          <span aria-hidden style={{ ...RULE, alignSelf: 'stretch' }} />
          <span style={LINK}>Help me get ready →</span>
        </>
      )}
    </section>
  )
}

function HalfDial({ level }: { level: Level }) {
  const w = 149
  const r = 70
  const cx = w / 2
  const cy = 74.5
  const half = Math.PI * r
  const d = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`
  return (
    // 8px closer to the question above (-8 off the card's 16 gap; 2026-10-09, Eric).
    <div style={{ position: 'relative', alignSelf: 'center', width: w, height: 109, marginTop: -8 }}>
      <svg width={w} height={80} viewBox={`0 0 ${w} 80`} aria-hidden style={{ display: 'block' }}>
        <path d={d} fill="none" style={{ stroke: 'var(--color-atlas-tan-500)' }} strokeWidth={3} />
        <path
          d={d}
          fill="none"
          style={{ stroke: 'var(--color-atlas-dial-fill, var(--color-primary-500))' }}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={`${(half * level.fill) / 100} ${half}`}
        />
      </svg>
      {/* The level, its last line sitting on the dial's baseline (Figma: bottom
          at 82), then OVERALL READINESS centred at 102.5. */}
      <div aria-hidden style={{ position: 'absolute', left: -2.5, width: 154, top: 0, height: 82, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
        {level.lines.map((line) => (
          <span key={line} style={LEVEL_NAME}>
            {line}
          </span>
        ))}
      </div>
      {/* ⚠ TWO DIFFERENT KINDS OF TEXT IN ONE SLOT (2026-10-16, Jillienne:
          "update this readiness body text to match the other body text").
          "Overall readiness" is a LABEL for the figure above it — uppercase,
          tracked out, centred under the dial. The not-started line is a
          SENTENCE, and wearing the label's dress it came out shouting in
          3.4px tracking with `white-space: nowrap`, so it ran past the card
          rather than wrapping. It takes the body treatment the pace card's
          paragraph uses instead. */}
      {level.caption ? (
        <span style={CAPTION_BODY}>{level.caption}</span>
      ) : (
        <span aria-hidden style={CAPTION}>Overall readiness</span>
      )}
    </div>
  )
}

/* Tertiary 200 fill, no stroke, 20 radius, 24 / 24 / 32 (Figma 295:10697). */
const CARD: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  // 24 at the bottom (2026-10-09, Eric; the design's 32 before the link joined).
  padding: '24px 24px 24px',
  boxSizing: 'border-box',
  borderRadius: 20,
  background: 'var(--color-atlas-tan-200)',
  cursor: 'pointer',
  userSelect: 'none',
}
const EYEBROW: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 11,
  lineHeight: '14px',
  letterSpacing: '1.3px',
  textTransform: 'uppercase',
  // Left, as the Study Pace card's eyebrow above it (2026-10-13, Eric's request; it was centred).
  textAlign: 'left',
  whiteSpace: 'nowrap',
  color: 'var(--color-primary-500)',
}
/* `bare` (Figma 286:9455): no fill, 24 above and below, nothing at the sides;
   the eyebrow left-aligned in Neutral 800 (2026-10-14, Eric). */
const BARE_CARD: CSSProperties = { ...CARD, background: 'transparent', padding: '24px 0', borderRadius: 16, gap: 24 }
const BARE_EYEBROW: CSSProperties = { ...EYEBROW, textAlign: 'left', color: 'var(--color-neutral-800)' }
// The design's Tertiary 300 hairline (it was Primary 200 on the single card).
const RULE: CSSProperties = { display: 'block', height: 1, background: 'var(--color-atlas-tan-300)' }
const QUESTION: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  // As the Study pace card's body heading ("We've set up a moderate study
  // plan for you."): Bold 11 / 16 in the text colour (2026-10-09, Eric).
  fontWeight: 700,
  fontSize: 11,
  lineHeight: '16px',
  color: 'var(--color-text-primary)',
}
const LEVEL_NAME: CSSProperties = {
  fontFamily: 'var(--font-heading-serif)',
  fontWeight: 700,
  fontSize: 26,
  lineHeight: '21px',
  // -3% (2026-10-09, Eric's request; it was 0).
  letterSpacing: '-0.03em',
  textAlign: 'center',
  color: 'var(--color-primary-800)',
}
/* The sentence under an empty dial — the same body treatment as the pace
   card's paragraph, and centred under the dial where the label would be.
   Positioned, not absolute: it wraps, so it needs the height. */
const CAPTION_BODY: CSSProperties = {
  display: 'block',
  marginTop: 6,
  padding: '0 4px',
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  lineHeight: '15px',
  textAlign: 'center',
  color: 'var(--color-text-secondary)',
}
const CAPTION: CSSProperties = {
  position: 'absolute',
  left: '50%',
  transform: 'translateX(-50%)',
  top: 95,
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 11,
  lineHeight: '15px',
  letterSpacing: '3.4px',
  textTransform: 'uppercase',
  textAlign: 'center',
  whiteSpace: 'nowrap',
  color: 'var(--color-primary-500)',
}
// The Study pace tile's link ("Edit My Study Pace") — Bold 11 / 13 in the
// button colour (2026-10-09, Eric: "make it match the link in the study pace
// tile"; it was the Study Journey's SemiBold 13).
const LINK: CSSProperties = {
  // Centred in the card (2026-10-09, Eric).
  alignSelf: 'center',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 11,
  lineHeight: '13px',
  whiteSpace: 'nowrap',
  color: 'var(--color-compass-page-button)',
}
