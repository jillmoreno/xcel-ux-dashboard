import type { CSSProperties, ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CircleLocationArrowRegular, HouseRegular } from '@/icons'

/**
 * ATLAS TOP NAV (Figma "Atlas-Compass-Global-Navigation" 160:616, 2026-09-30)
 * — the Nav Version control's "Top Nav": two global buttons in the header.
 *
 *   - HOME is current on the Home page (the shell with no `?section=`).
 *   - COMPASS LEARNING is current on the course's pages (`?section=course` —
 *     its Overview and Course pages). Anywhere else neither is current.
 *
 * The current button is filled, with a small pointer under it; the other is a
 * tint. Placement is the header's job (`Header`): 40px right of the logo,
 * centred in the header's height.
 *
 * Clicks change only the section params, so the demo's own (`?demo`, `?skin`,
 * `?fonts`, `?nav`, `?ff`…) survive. Colours are `--color-atlas-topnav-*`
 * (tokens.css): Figma's own on the Global skin, each brand's nav colours on
 * the others.
 */
export function AtlasTopNav() {
  const [params, setParams] = useSearchParams()
  const section = params.get('section')
  const current: 'home' | 'compass' | null = !section || section === 'dashboard'
    ? 'home'
    : section === 'course'
    ? 'compass'
    : null

  const go = (to: 'home' | 'compass') => {
    const next = new URLSearchParams(params)
    next.delete('section')
    next.delete('coursePage')
    if (to === 'compass') {
      next.set('section', 'course')
      next.set('coursePage', 'overview')
    }
    setParams(next)
  }

  return (
    <nav aria-label="Global" style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
      <TopNavButton label="Home" icon={<HouseRegular size={12} aria-hidden />} current={current === 'home'} onClick={() => go('home')} />
      <TopNavButton
        label="Compass Learning"
        icon={<CircleLocationArrowRegular size={12} aria-hidden />}
        current={current === 'compass'}
        onClick={() => go('compass')}
      />
    </nav>
  )
}

function TopNavButton({
  label,
  icon,
  current,
  onClick,
}: {
  label: string
  icon: ReactNode
  current: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-current={current ? 'page' : undefined}
      className={current ? 'cre-atlas-topnav-btn is-current' : 'cre-atlas-topnav-btn'}
      onClick={onClick}
      style={{ ...BUTTON, fontWeight: current ? 600 : 400 }}
    >
      {icon}
      {label}
      {current ? <span aria-hidden style={POINTER} /> : null}
    </button>
  )
}

/* Figma: 8px across, 28 tall — both buttons (2026-09-30, the designer's
   request; Figma draws the idle one 2px shorter), 8px
   radius, a 4px gap, Open Sans 13/15 — SemiBold when current, Regular when
   not; the icon 12px. Colours live on `.cre-atlas-topnav-btn` (tokens.css) so
   hover needs no !important. */
const BUTTON: CSSProperties = {
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  boxSizing: 'border-box',
  padding: '0 8px',
  height: 28,
  borderRadius: 8,
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '15px',
  whiteSpace: 'nowrap',
}
/* The pointer under the current button (Figma 160:618): a downward triangle
   in the button's fill. 18 wide (50% wider than the design's ~12, 2026-09-30,
   the designer's request) and 9 deep, its bottom point rounded to a 2px
   radius (3px briefly, same day): the sides meet at 90°, so the arc starts
   2px up each side (7.59, 7.59 / 10.41, 7.59) and bottoms out at 8.17. Set
   7px below the button rather than 6, so the rounded tip reaches about as far
   as the sharp one did. */
const POINTER: CSSProperties = {
  position: 'absolute',
  left: '50%',
  bottom: -7,
  width: 18,
  height: 9,
  transform: 'translateX(-50%)',
  background: 'inherit',
  clipPath: "path('M0 0 H18 L10.41 7.59 A2 2 0 0 1 7.59 7.59 Z')",
}
