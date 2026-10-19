import { useState, type CSSProperties, type KeyboardEvent } from 'react'
import { ATLAS_COLUMN_PROSE_W, atlasSectionEyebrow, type AtlasColumnAlign } from './atlasSectionEyebrow'

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
/* ⚠ EACH BAND SAYS WHAT IT MEANS (2026-10-19, Jillienne: "we have text for
   not started, add in text for the other readiness states", with the bands
   image). The copy is hers, verbatim — the same image the four names and
   their <40 / 40–64 / 65–84 / 85+ cuts came from on 2026-10-16. Until now
   only `NOT_STARTED` carried a caption, so the one state that could not be
   measured was the only one that explained itself.

   ⚠ THE SLOT ALREADY EXISTED and is drawn by the CARD, at the card's width
   (see the caption below `HalfDial`). Nothing about the layout changes —
   four states simply stop leaving it empty. */
const LEVELS: Level[] = [
  {
    name: 'Beginner',
    lines: ['Beginner'],
    fill: 14,
    caption: 'Early in development, with substantial knowledge gaps remaining.',
  },
  {
    name: 'Developing',
    lines: ['Developing'],
    fill: 36,
    caption: 'Building competency, but still has meaningful gaps.',
  },
  {
    name: 'Proficient',
    lines: ['Proficient'],
    fill: 75,
    caption: 'Strong understanding; has not yet reached the ready threshold.',
  },
  { name: 'Ready', lines: ['Ready'], fill: 100, caption: 'Considered ready for the target outcome or exam.' },
]

/** `initialLevel` (0–4) picks the level it opens on — V3's Completed view opens
 *  on Proficient (2026-10-09); remount with a `key` to apply a new one. */
export function AtlasReadinessCard({
  initialLevel = 0,
  notStarted = false,
  matchPaceEyebrow = false,
  align = 'center',
  onPastLast,
  bare = false,
}: {
  initialLevel?: number
  /** Opens on the empty state: the dial drawn with no arc, named "Not
   *  Started". Pressing the card still moves into the five levels, so the
   *  demo's step-through is unchanged — this is only where it starts. */
  notStarted?: boolean
  /** Wear the pace card's eyebrow instead of this card's own (2026-10-16,
   *  Jillienne: "have the other eyebrows match this style in this section").
   *
   *  ⚠ A PROP, NOT A REWRITE OF `EYEBROW`. This card is also V3's and
   *  White's, where the eyebrow is the primary blue at 600 — Eric's, and his
   *  to keep. The ask was about ONE column, so only that column opts in. */
  matchPaceEyebrow?: boolean
  /** Which way this column's EYEBROWS read (2026-10-19) — the dials, the
   *  figures and the captions stay centred on both arms. Only meaningful
   *  alongside `matchPaceEyebrow`: it is that column's decision, and V3 and
   *  White keep their own eyebrow. */
  align?: AtlasColumnAlign
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
      {/* ⚠ `matchPaceEyebrow` OUTRANKS `bare`, and it has to: the E2E version
          is white-LIKE, so it takes the bare branch — which is the branch
          that was still drawing the old eyebrow when the first attempt
          "worked" everywhere else. */}
      <p style={matchPaceEyebrow ? atlasSectionEyebrow(align) : bare ? BARE_EYEBROW : EYEBROW}>
        {/* "Exam readiness" on the arm that shares the column's eyebrows
            (2026-10-16, Jillienne: the three are "Study Pace, Course
            Progress, Exam Readiness"). The longer "Readiness for state exam"
            stays on V3 and White, where the card is still its own thing. */}
        {matchPaceEyebrow ? 'Exam readiness' : 'Readiness for state exam'}
      </p>
      {/* Bare drops the question and the link: Figma 286:9455 shows
          neither (2026-10-14, Eric). */}
      {bare ? null : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <span aria-hidden style={RULE} />
          <p style={QUESTION}>How Ready are you for your State Exam?</p>
        </div>
      )}
      <HalfDial level={level} />
      {/* ⚠ OUTSIDE THE DIAL, so it is the CARD's width (2026-10-19,
          Jillienne: "width of the text below not started should be the same
          width as the other text here"). It was inside `HalfDial`'s box,
          which is 149 wide — the dial's own width — so a sentence meant to
          read like the pace card's paragraph wrapped in a column less than
          half as wide. Out here it takes the same width that paragraph does.

          ⚠ AND THE CARD'S OWN 16 GAP IS THE SPACING ("also, add some spacing
          between the Not started and the text"). Inside the dial it flowed
          straight after the 80-tall svg on a 6px margin, which left about 4
          between it and the band name sitting on the dial's baseline. */}
      {level.caption ? <span style={CAPTION_BODY}>{level.caption}</span> : null}
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
    /* 8px closer to the question above (-8 off the card's 16 gap;
       2026-10-09, Eric).
       ⚠ 82, NOT 109 (2026-10-19). The box was sized to hold "Overall
       readiness" at 102.5; that label went earlier today and the caption
       went out to the card with it, so 27 of those pixels were holding
       nothing — on every arm, not just this one. 82 is the band name's
       baseline, which is now the last thing in here. */
    <div style={{ position: 'relative', alignSelf: 'center', width: w, height: 82, marginTop: -8 }}>
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
      {/* ⚠ "OVERALL READINESS" IS GONE (2026-10-19, Jillienne: "remove
          this"). It was a LABEL for the figure above it — uppercase, tracked
          out, centred under the dial — and the section's eyebrow says Exam
          readiness a few lines up, so it was the same words twice with a
          band name between them. The NOT-STARTED SENTENCE that shared this
          slot is a different thing and still drawn — by the card now, at the
          card's width. */}
    </div>
  )
}

/* Tertiary 200 fill, no stroke, 20 radius, 24 / 24 / 32 (Figma 295:10697). */
/* The two gaps this card stacks on — named because the caption below has to
   subtract one of them from the other. */
/* The gap the column's prose sits on — the Study pace section's own, which
   is where the pace sentence gets its 11. */
const CAPTION_GAP = 11
const CARD_GAP = 16
const BARE_CARD_GAP = 24
const CARD: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: CARD_GAP,
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
const BARE_CARD: CSSProperties = {
  ...CARD,
  background: 'transparent',
  padding: '24px 0',
  borderRadius: 16,
  gap: BARE_CARD_GAP,
}
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
  /* ⚠ 22, NOT 26 (2026-10-19, Jillienne: "reduce font size"). The line
     height comes down with it, in the same ratio the 26 was set at (21/26),
     because the name is BOTTOM-ALIGNED to the dial's baseline — change the
     size alone and the word lifts off the line it was drawn to sit on. */
  fontSize: 22,
  lineHeight: '18px',
  // -3% (2026-10-09, Eric's request; it was 0).
  letterSpacing: '-0.03em',
  textAlign: 'center',
  color: 'var(--color-primary-800)',
}
/* The sentence under an empty dial — the same body treatment as the pace
   card's paragraph, and centred under the dial where the label would be.
   Positioned, not absolute: it wraps, so it needs the height. */
/* ⚠ NO SIDE PADDING (2026-10-19). Both were compensating for
   living inside the 149-wide dial: the margin bought a few pixels off the
   svg, the padding kept a sentence off the edges of a box too narrow for
   it. Out at the card's width the card's own 16 gap does the spacing, and
   the card's padding does the insetting — the same two things that place the
   pace card's paragraph. Matching that paragraph is the whole point. */
const CAPTION_BODY: CSSProperties = {
  display: 'block',
  /* ⚠ 11 ABOVE, THE PACE SENTENCE'S GAP (2026-10-19, Jillienne: "yes make
     them both 11px"). These two paragraphs are the column's only prose and
     were already identical in every computed style — but this one sat 24
     under its dial while the pace sentence sat 11 under its goal row, so the
     same line breathed differently depending on which card it was in. 11 is
     the tighter relationship and the right one: the line is a note about the
     thing directly above it.

     ⚠ WRITTEN AS THE SUBTRACTION, not as -13. The card's own gap is what
     this is correcting for, so moving that gap has to move this with it —
     the same idiom `EXPECTED`'s `marginTop` uses in the pace card. */
  /* ⚠ ONE `margin`, NOT `marginTop` PLUS A SHORTHAND. The first attempt set
     `marginTop` above a later `margin: '0 auto'`, and the shorthand won —
     the pull did nothing and the gap stayed at 24. Written as one
     declaration there is nothing left to override it.
     The `auto` sides keep the narrower measure centred; the same measure the
     pace sentence runs to (`ATLAS_COLUMN_PROSE_W`), because the two are the
     column's only prose and sit far enough apart that different widths read
     as two columns. */
  margin: `${CAPTION_GAP - BARE_CARD_GAP}px auto 0`,
  maxWidth: ATLAS_COLUMN_PROSE_W,
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  lineHeight: '15px',
  textAlign: 'center',
  color: 'var(--color-text-secondary)',
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
