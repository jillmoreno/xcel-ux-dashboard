import type { CSSProperties } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Award, BookFull, ChevronRight, CircleInfo, ClipboardList, FileText, Notebook } from '@/icons'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { EXAM_DETAILS_STEP_ID } from '@/data/examDetails'
import { GET_LICENSED_STEPS } from '@/data/nyProducerRequirements'
import type { PlatformSection } from './PlatformSideNav'

/**
 * THE RIGHT RAIL'S SIX SQUARE TILES — Testing 3, 2026-10-01, the direct ask.
 *
 * It replaces TWO blocks at once: the My Courses / Certificates pair
 * (`HomeNavTiles`) and the Quick links card. Those were a nav strip and a
 * stack of outline buttons sitting one above the other, which made the rail
 * read as two lists of places to go rather than one.
 *
 * ⚠ IT MIXES TWO KINDS OF DESTINATION, and that is the thing to judge rather
 * than a mistake. Three tiles change `?section=` and move the page; three open
 * a SHEET over it. They are drawn identically because the ask asked for one
 * set, and because a learner looking for "State Requirements" does not care
 * which kind it is — but it does mean a tile's appearance no longer predicts
 * whether you leave the page.
 *
 * ⚠ THE CTA IDS ARE THE ONES THOSE CONTROLS ALREADY CARRIED — `nav.courses`,
 * `nav.certificates`, `home.quick-exam-info`, `home.quick-get-licensed`,
 * `home.state-requirements`. A moderated run that breaks any of them must break
 * it here too; re-tagging would have silently detached this rail from every
 * session already scripted against those names. Flashcards is the one new
 * control and carries `nav.compass`, because that is where it goes.
 */

const APPLY_LICENSE_STEP_ID = GET_LICENSED_STEPS[GET_LICENSED_STEPS.length - 1].id

export function HomeTileGrid({
  onOpenStep,
  onOpenRequirements,
}: {
  /** Opens a step's sheet — the same handler the Quick links card used. */
  onOpenStep?: (id: string) => void
  /** Opens the state-requirements sheet. */
  onOpenRequirements?: () => void
}) {
  const [, setParams] = useSearchParams()
  /* SQUARE OR STACKED — `home-tile-style`, 2026-10-01, the direct ask ("keep
     the tiles as default, but add a variant"). The SAME six in the same order
     with the same CTA ids; only the shape changes, which is what makes the two
     comparable. */
  /* ⚠ DEFAULTS TO STACKED, so the test is for the OPT-IN rather than the
     opt-out — `=== 'square'` inverted would quietly make an unset flag square
     again, which is what the catalog default is for. */
  const stacked = useFeatureFlag('home-tile-style').variant !== 'square'

  /* Mirrors `PlatformShell.handleSelect` — same param, same `replace`. None of
     these is Home, so the delete-on-Home branch has nothing to do here. */
  const go = (id: PlatformSection) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('section', id)
        return next
      },
      { replace: true },
    )
  }

  const tiles: { id: string; label: string; icon: typeof Award; onSelect: () => void }[] = [
    { id: 'nav.courses', label: 'My Courses', icon: BookFull, onSelect: () => go('courses') },
    {
      id: 'nav.certificates',
      label: 'My Certificates',
      icon: Award,
      onSelect: () => go('certificates'),
    },
    /* ⚠ FLASHCARDS LANDS ON COMPASS LEARNING, not on a Flashcards page, and the
       gap is real rather than a shortcut. Flashcards is one of the Compass
       player's own pages (`CompassCoursePlayer`'s page rail) and nothing in
       this app deep-links to it — there is no `?section=flashcards` to point
       at. So the tile opens the surface that contains it. Worth closing if
       Flashcards is meant to be reachable in one press. */
    { id: 'nav.compass', label: 'Flashcards', icon: Notebook, onSelect: () => go('compass') },
    {
      id: 'home.quick-exam-info',
      label: 'Exam Information',
      icon: CircleInfo,
      onSelect: () => onOpenStep?.(EXAM_DETAILS_STEP_ID),
    },
    {
      id: 'home.quick-get-licensed',
      label: 'Applying for License',
      icon: FileText,
      onSelect: () => onOpenStep?.(APPLY_LICENSE_STEP_ID),
    },
    {
      id: 'home.state-requirements',
      label: 'State Requirements',
      icon: ClipboardList,
      onSelect: () => onOpenRequirements?.(),
    },
  ]

  return (
    <nav aria-label="Learning areas" style={stacked ? stackStyle : gridStyle}>
      {tiles.map(({ id, label, icon: Icon, onSelect }) => (
        <button
          key={id}
          type="button"
          data-cta-id={id}
          onClick={onSelect}
          /* ⚠ THE COLOURS LIVE IN THE CLASS, NOT HERE — `.cre-tile-cta` in
             `tokens.css`. A hover cannot be expressed as an inline style at
             all, and splitting the rest between the two would leave the rest
             state here and its reversal three files away. This object is
             geometry only.

             ⚠ BOTH ARMS WEAR THE SAME CLASS, deliberately: the outline at rest
             and the fill on hover are identical, so the variant is a comparison
             of LAYOUT and nothing else. */
          /* ⚠ `--bare` ON THE STACKED ARM ONLY. Six full-width outlines one
             under another read as six boxes rather than a list; the squares
             need theirs, because a square with no edge has no shape. Both keep
             the ink and the hover fill, so the variant is still layout. */
          className={stacked ? 'cre-tile-cta cre-tile-cta--bare' : 'cre-tile-cta'}
          style={stacked ? rowStyle : tileStyle}
        >
          {/* 28 ON THE SQUARE, 20 STACKED. On a tile the glyph is the upper
              half and does the recognising; in a row it sits beside a label
              that is already doing that, and at 28 it would set the row's
              height for no gain. */}
          <Icon size={stacked ? 20 : 28} aria-hidden />
          <span style={stacked ? rowLabelStyle : labelStyle}>{label}</span>
          {/* THE CHEVRON IS THE ROW'S ONLY ADDITION. A full-width row with a
              label hard left reads as a list item rather than as something that
              goes somewhere; the square's shape says that on its own. */}
          {stacked ? <ChevronRight size={14} aria-hidden style={{ flexShrink: 0 }} /> : null}
        </button>
      ))}
    </nav>
  )
}

/* Two across, three down. Three across in a ~380px rail leaves ~110px a tile,
   which "State Requirements" cannot wear without breaking into three lines. */
const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 12,
}

/* The stacked arm: one column, full width. */
const stackStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr)',
  gap: 8,
}

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  minWidth: 0,
  /* ⚠ `minHeight`, NOT `height`. "Applying for License" fits one line at this
     width today, but a longer label or a larger text setting has to be able to
     push the row taller rather than overflow it. */
  minHeight: 48,
  padding: '0 14px',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  textAlign: 'left',
}

const rowLabelStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 600,
  lineHeight: '18px',
}

const tileStyle: CSSProperties = {
  /* ⚠ SQUARE BY RATIO, not by a fixed height. The rail's width is a fraction of
     a grid that moves with the viewport, so a hard-coded height would be square
     at exactly one window size. `aspect-ratio` keeps it square at every width —
     and six squares two-across is a tall block, which is the cost of the tile
     shape and the thing to look at first if the rail feels long. */
  aspectRatio: '1',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  minWidth: 0,
  padding: 12,
  borderRadius: 'var(--radius-md)',
  /* ⚠ NO `border`, `background` OR `color` — `.cre-tile-cta` owns all three and
     an inline value would beat the class in the cascade, which is the trap
     `tokens.css` records for `.cre-stop-title`. The tiles sat on the card
     surface with a neutral hairline until 2026-10-01; they are an outline CTA
     now, filling on hover. */
  cursor: 'pointer',
  textAlign: 'center',
}

const labelStyle: CSSProperties = {
  minWidth: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 600,
  lineHeight: '17px',
  /* WRAPS, unlike the strip this replaces — a square has the height for two
     lines, and "Applying for License" needs them. The ellipsis the old tiles
     used would truncate three of these six. */
}
