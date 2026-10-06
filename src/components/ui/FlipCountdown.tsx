import { useEffect, useState, type CSSProperties } from 'react'

/**
 * A SPLIT-FLAP COUNTDOWN — the old flip-clock board, one card per digit.
 * 2026-10-05, for the days-until-exam readout on Hybrid V1.
 *
 * ⚠ IT ANIMATES ON CHANGE, NOT ON EVERY RENDER. The value here is a number of
 * DAYS, so in the real product it turns over once a night and nobody watches
 * it. Where it does fire is the demo: editing the exam date re-derives the
 * count and the board flips to the new one, which is the whole reason to draw
 * it this way rather than print a number.
 *
 * ⚠ AND IT REMEMBERS ACROSS A REMOUNT, which is the difference between this
 * working and this never firing at all. The exam card REPLACES the readout with
 * a date picker while you are editing, so saving a new date mounts a fresh set
 * of digits rather than updating the old ones — and a board that only animates
 * on a prop change would stay still through the one flow where a person
 * actually changes the number. `lastShown` below is the memory: module-level,
 * keyed by column, so a remount knows what it was showing a moment ago.
 *
 * ⚠ A FRESH PAGE LOAD STILL DOES NOT ANIMATE, which was the original intent and
 * survives: with no history for a column there is nothing to flip FROM, so the
 * cards simply render. The seam is what reads as a flip clock at rest; the
 * motion is reserved for a change someone made.
 *
 * ⚠ MODULE-LEVEL STATE IS A DELIBERATE LIMIT. One board is on screen at a time
 * (the exam card), and the key is the column index — two boards showing
 * different numbers would hand each other their digits. If a second one is ever
 * added, this becomes a context or a prop, not a bigger map.
 *
 * ⚠ DIGITS ARE KEYED BY POSITION FROM THE RIGHT. "9 → 10" grows the board by a
 * card, and keying left-to-right would make the ones column think it had become
 * the tens and flip a digit that did not change. Right-anchored, only the cards
 * whose own digit moved animate.
 */
/**
 * What each column was showing last, so a REMOUNT can animate from it. Keyed by
 * column index counted from the RIGHT, matching the React keys below.
 */
const lastShown = new Map<number, string>()

export function FlipCountdown({
  value,
  label,
  ariaLabel,
}: {
  /** The number on the board. Negative or non-finite is treated as 0. */
  value: number
  /** The caption beside the cards — "days until your exam". */
  label?: string
  /** What a screen reader hears INSTEAD of the digits. The board is decoration
   *  around a number; a reader should get the sentence, not six flipping
   *  halves. */
  ariaLabel?: string
}) {
  const safe = Number.isFinite(value) && value > 0 ? Math.floor(value) : 0
  const digits = String(safe).split('')
  return (
    <span style={ROW} aria-label={ariaLabel} role={ariaLabel ? 'img' : undefined}>
      <span style={{ display: 'inline-flex', gap: 3 }} aria-hidden={ariaLabel ? true : undefined}>
        {digits.map((d, i) => {
          // Counted from the RIGHT — see the note above. Used as the React key
          // AND as this column's slot in `lastShown`.
          const column = digits.length - i
          return <FlipDigit key={column} column={column} digit={d} />
        })}
      </span>
      {label ? <span style={LABEL}>{label}</span> : null}
    </span>
  )
}

function FlipDigit({ digit, column }: { digit: string; column: number }) {
  /* ⚠ MOUNT STATE COMES FROM THE MEMORY, NOT FROM THE PROP. If this column was
     showing something else before the card remounted, start there and let the
     effect below flip to the real digit — that is the edit-a-date flow. With no
     history, start on the digit and nothing animates. */
  const remembered = lastShown.get(column)
  const [shown, setShown] = useState(remembered ?? digit)
  const [previous, setPrevious] = useState<string | null>(null)

  useEffect(() => {
    lastShown.set(column, digit)
    if (digit === shown) return
    /* Only ever one flip in flight per column: `previous` holds the outgoing
       digit and is cleared when the unfold finishes. */
    setPrevious(shown)
    setShown(digit)
  }, [digit, shown, column])

  /* ⚠ THE TURN IS CLEARED ON A TIMER AS WELL AS ON `animationend`, and the
     timer is the load-bearing one. Under `prefers-reduced-motion: reduce` the
     keyframes are `animation: none`, so NO `animationend` ever fires — and with
     the event as the only exit, `previous` would never clear, `animating` would
     stay true and the board would sit on the OLD digit for good. A bug visible
     only to the people least likely to be testing for it.

     The event still fires first in the normal case; this is the floor. */
  useEffect(() => {
    if (previous === null) return
    const t = window.setTimeout(() => setPrevious(null), HALF_MS * 2 + 60)
    return () => window.clearTimeout(t)
  }, [previous])

  const animating = previous !== null && previous !== shown
  return (
    <span style={CARD}>
      {/* The two STATIC halves underneath: the top already shows the new digit,
          the bottom still shows the old one. The folding halves above cover
          each in turn, so what you see is the card turning. */}
      <Half half="top" digit={shown} />
      <Half half="bottom" digit={animating ? (previous as string) : shown} />
      {animating ? (
        <>
          <Half
            half="top"
            digit={previous as string}
            className="cre-flip-fold-down"
            style={{ animation: `cre-flip-fold-down ${HALF_MS}ms ease-in forwards` }}
          />
          <Half
            half="bottom"
            digit={shown}
            className="cre-flip-unfold"
            style={{ animation: `cre-flip-unfold ${HALF_MS}ms ease-out ${HALF_MS}ms forwards` }}
            /* Hidden until its turn — without this it sits at 0° under the
               folding top half and the new digit is visible from the start. */
            hiddenUntilTurn
            onRest={() => setPrevious(null)}
          />
        </>
      ) : null}
    </span>
  )
}

function Half({
  half,
  digit,
  className,
  style,
  hiddenUntilTurn,
  onRest,
}: {
  half: 'top' | 'bottom'
  digit: string
  className?: string
  style?: CSSProperties
  hiddenUntilTurn?: boolean
  onRest?: () => void
}) {
  const top = half === 'top'
  return (
    <span
      className={className}
      onAnimationEnd={onRest}
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        [top ? 'top' : 'bottom']: 0,
        height: '50%',
        overflow: 'hidden',
        background: 'var(--color-neutral-800)',
        color: 'var(--color-neutral-50)',
        borderRadius: top ? '5px 5px 0 0' : '0 0 5px 5px',
        /* The seam. A hairline of the page showing between the halves is what
           makes two rectangles read as one hinged card. */
        borderBottom: top ? '1px solid rgba(0,0,0,0.45)' : undefined,
        display: 'flex',
        justifyContent: 'center',
        alignItems: top ? 'flex-start' : 'flex-end',
        transformOrigin: top ? 'bottom center' : 'top center',
        backfaceVisibility: 'hidden',
        ...(hiddenUntilTurn ? { transform: 'rotateX(90deg)' } : null),
        ...style,
      }}
      aria-hidden
    >
      {/* The glyph is drawn at FULL card height inside a half-height window, so
          each half shows its own half of the same number and the two line up
          across the seam. */}
      <span
        style={{
          height: CARD_H,
          lineHeight: `${CARD_H}px`,
          fontFamily: 'var(--font-heading)',
          fontSize: 22,
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
          /* The bottom half pulls its glyph up by half a card to show the
             lower portion through its window. */
          marginTop: top ? 0 : -CARD_H / 2,
        }}
      >
        {digit}
      </span>
    </span>
  )
}

const CARD_H = 34
const CARD_W = 25
/** Each half runs this long; the fold and the unfold are sequential, so the
 *  whole turn is twice it. */
const HALF_MS = 190

const CARD: CSSProperties = {
  position: 'relative',
  display: 'inline-block',
  width: CARD_W,
  height: CARD_H,
  borderRadius: 5,
  /* The board behind the halves — visible only in the instant both are edge-on
     at the midpoint of a turn, which is exactly when a real one shows its own
     dark interior. */
  background: 'var(--color-neutral-900, #111)',
  perspective: 180,
  flex: 'none',
}

const ROW: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 9,
}

const LABEL: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '18px',
  color: 'var(--color-text-secondary)',
  minWidth: 0,
}
