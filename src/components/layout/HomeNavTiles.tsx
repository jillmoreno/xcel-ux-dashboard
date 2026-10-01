import type { CSSProperties, ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Award, BookFull, ChevronRight } from '@/icons'
import { showsHomeNavTiles, useNavPlacement } from './navPlacement'
import type { PlatformSection } from './PlatformSideNav'

/**
 * HOME'S NAV TILES — `nav-placement: top`, 2026-10-01, the direct ask: "the
 * other things under My learning, My Courses & Certificates, will live as
 * simple tile buttons above the quick question modal".
 *
 * WHAT THEY ARE FOR. The header nav carries two items — Home and Compass
 * Learning — which is the concept the top-nav arm is testing. That leaves My
 * Courses and Certificates with no control anywhere, and the old Option 1
 * shipped exactly that gap: both sections still resolved from `?section=` but
 * nothing on screen pointed at them. These are what re-homes them.
 *
 * ⚠ SIMPLE, DELIBERATELY. They are a label, an icon and a chevron on the card
 * surface — not progress, not counts, not a summary of what is inside. The
 * right column is already two information-dense cards deep; a third that
 * SUMMARISES would compete with the Quick Question card sitting under it,
 * which is the one thing on this column asking to be answered today. These are
 * navigation wearing a tile, and they should read as the lightest thing in the
 * column.
 *
 * ⚠ ABOVE THE QUICK QUESTION CARD, which is the top of the journey column —
 * see `HomeNavTileColumn` for how they get there without the band growing a
 * nav concern of its own.
 *
 * ⚠ HOME IS NOT ONE OF THEM. It is the header's first pill and the page the
 * learner is already standing on; a third tile pointing at this screen would be
 * the same duplication that took the hybrid off the picker.
 */
const TILES: { id: PlatformSection; label: string; icon: typeof Award }[] = [
  { id: 'courses', label: 'My Courses', icon: BookFull },
  { id: 'certificates', label: 'Certificates', icon: Award },
]

export function HomeNavTiles() {
  const placement = useNavPlacement()
  const [, setParams] = useSearchParams()

  if (!showsHomeNavTiles(placement)) return null

  /* Mirrors `PlatformShell.handleSelect` and `PlatformTopNav.select` — same
     param, same `replace`. Neither of these ids is Home, so the delete-on-Home
     branch those two carry has nothing to do here. */
  const select = (id: PlatformSection) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('section', id)
        return next
      },
      { replace: true },
    )
  }

  return (
    <nav aria-label="Learning areas" style={rowStyle}>
      {TILES.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          /* THE SAME CTA IDS THE RAIL AND THE HEADER EMIT, derived the same way
             — a moderated run that breaks `nav.courses` must break it under
             EVERY placement, or the arms stop being comparable at exactly the
             moment someone is watching a participant use them. */
          data-cta-id={`nav.${id}`}
          onClick={() => select(id)}
          style={tileStyle}
        >
          <Icon size={18} aria-hidden />
          <span style={labelStyle}>{label}</span>
          <ChevronRight size={14} aria-hidden style={{ color: 'var(--color-text-tertiary)' }} />
        </button>
      ))}
    </nav>
  )
}

/**
 * The journey column, with the tiles above it when the placement wants them.
 *
 * A FRAGMENT WHEN THEY ARE OFF, which is the point of the wrapper existing at
 * all: under every other placement the journey widget stays the DIRECT grid
 * child it has always been, so none of this can move the band's layout by a
 * pixel. Only the `top` arm gets the extra flex column, and its 20px gap is the
 * one `StudyJourneyWidget` already uses between its own split cards.
 */
export function HomeNavTileColumn({ children }: { children: ReactNode }) {
  const placement = useNavPlacement()
  if (!showsHomeNavTiles(placement)) return <>{children}</>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
      <HomeNavTiles />
      {children}
    </div>
  )
}

/* Two across. They are short labels in a ~380px column, so a column of two
   full-width rows would be a list — and a list of two destinations beside a
   rail-less page reads as a leftover rail. Side by side they read as tiles. */
const rowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 12,
}

const tileStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  minWidth: 0,
  padding: '14px 14px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border-subtle)',
  background: 'var(--color-surface-card)',
  color: 'var(--color-text-primary)',
  cursor: 'pointer',
  textAlign: 'left',
}

const labelStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 600,
  lineHeight: '18px',
  /* The two labels differ in length by five characters and the chevron pins the
     right edge, so nothing here wraps at this column's width — but a longer
     label added later should shorten rather than push the chevron off. */
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}
