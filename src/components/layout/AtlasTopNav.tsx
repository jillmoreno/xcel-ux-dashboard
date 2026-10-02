import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BookOpenRegular, HouseRegular } from '@/icons'

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
 * EXPANDING TOP NAV (Figma 168:916, 2026-10-01) is the same two buttons with
 * `expanding`: see `AtlasTopNav`'s prop, below. Home is current there on its
 * own sections as well (Study Plan, Certificates, Resources).
 *
 * Clicks change only the section params, so the demo's own (`?demo`, `?skin`,
 * `?fonts`, `?nav`, `?ff`…) survive. Colours are `--color-atlas-topnav-*`
 * (tokens.css): Figma's own on the Global skin, each brand's nav colours on
 * the others.
 */
/* EXPANDING TOP NAV's slide-out links (Figma 168:916, 2026-10-01). Home's are
   the design's; Compass Learning's are the designer's own list. Each is a
   shell address: Home's leave the course for a section, Compass Learning's
   are pages of the course. */
type TopNavLink = { label: string; section: string; coursePage?: string }
const HOME_LINKS: readonly TopNavLink[] = [
  // Course (the course's own Course page) and Study Plan in place of Courses
  // (2026-10-01, the designer's request). Course is a page OF the course, so
  // following it makes Compass Learning current; Study Plan is Home's own.
  { label: 'Course', section: 'course', coursePage: 'course' },
  { label: 'Study Plan', section: 'study-plan' },
  { label: 'Certificates', section: 'certificates' },
  { label: 'Resources', section: 'resources' },
]
const COMPASS_LINKS: readonly TopNavLink[] = [
  // Flashcards and Exam Simulator replaced Study Plan and Resources
  // (2026-10-01, the designer's request).
  // Overview first (2026-10-01, the designer's request) — the page the
  // Compass Learning button itself opens.
  { label: 'Overview', section: 'course', coursePage: 'overview' },
  { label: 'Course', section: 'course', coursePage: 'course' },
  { label: 'Flashcards', section: 'course', coursePage: 'flashcards' },
  { label: 'Exam Simulator', section: 'course', coursePage: 'exam-simulator' },
]

/** `expanding` — the Nav Version control's "Expanding Top Nav": the current
 *  button slides its links out to its right, easing in and out, and the button
 *  after it is pushed over in the same motion (it is in the same row, so the
 *  layout carries it). Switching buttons closes one tray as the other opens. */
export function AtlasTopNav({ expanding = false }: { expanding?: boolean }) {
  const [params, setParams] = useSearchParams()
  const section = params.get('section')
  const coursePage = params.get('coursePage')
  // Home's own sections (Study Plan, Certificates, Resources) keep Home
  // current, so its tray stays open on them. Not its Course link: that is a
  // page of the course, which is Compass Learning's.
  const current: 'home' | 'compass' | null =
    !section ||
    section === 'dashboard' ||
    HOME_LINKS.some((l) => !l.coursePage && l.section === section)
      ? 'home'
      : section === 'course'
      ? 'compass'
      : null

  const navigate = (section: string | null, coursePage: string | null) => {
    const next = new URLSearchParams(params)
    next.delete('section')
    next.delete('coursePage')
    if (section) next.set('section', section)
    if (coursePage) next.set('coursePage', coursePage)
    setParams(next)
  }
  const isCurrentLink = (l: TopNavLink) =>
    l.section === section && (l.coursePage ? l.coursePage === (coursePage ?? 'overview') : true)

  return (
    <nav aria-label="Global" style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
      <TopNavItem
        label="Home"
        // 1px up, the house's optical centre (2026-10-01, the designer's request).
        icon={<HouseRegular size={12} aria-hidden style={{ position: 'relative', top: -1 }} />}
        current={current === 'home'}
        onClick={() => navigate(null, null)}
        links={expanding ? HOME_LINKS : null}
        isCurrentLink={isCurrentLink}
        onLink={(l) => navigate(l.section, l.coursePage ?? null)}
      />
      <TopNavItem
        // "My Learning" with FA's `book-open` (Regular, the weight of Home's
        // house) — 2026-10-01, the designer's request; it was "Compass
        // Learning" with `circle-location-arrow`.
        label="My Learning"
        // 13px — 2026-10-01, the designer's request; it was 14.
        icon={<BookOpenRegular size={13} aria-hidden />}
        current={current === 'compass'}
        onClick={() => navigate('course', 'overview')}
        links={expanding ? COMPASS_LINKS : null}
        isCurrentLink={isCurrentLink}
        onLink={(l) => navigate(l.section, l.coursePage ?? null)}
      />
    </nav>
  )
}

function TopNavItem({
  label,
  icon,
  current,
  onClick,
  links,
  isCurrentLink,
  onLink,
}: {
  label: string
  icon: ReactNode
  current: boolean
  onClick: () => void
  /** Present on the Expanding Top Nav: the tray's links. */
  links: readonly TopNavLink[] | null
  isCurrentLink: (l: TopNavLink) => boolean
  onLink: (l: TopNavLink) => void
}) {
  // Open once mounted, a frame late, so a page that LOADS on this version
  // slides its tray out too rather than drawing it already open.
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(id)
  }, [])
  const open = Boolean(links) && current && ready

  const button = (
    <button
      type="button"
      aria-current={current ? 'page' : undefined}
      className={current ? 'cre-atlas-topnav-btn is-current' : 'cre-atlas-topnav-btn'}
      onClick={onClick}
      style={BUTTON}
    >
      {icon}
      {label}
      {/* The pointer under the current button is GONE from the plain Top Nav
          (2026-10-02, the designer's request; `POINTER` is kept for a
          restore). The Expanding Top Nav keeps its pointer, which points AT
          the open tray and is part of how that reads. */}
      {current && links ? <span aria-hidden style={POINTER_RIGHT} /> : null}
    </button>
  )
  if (!links) return button

  return (
    <div className={open ? 'cre-atlas-topnav-tray is-open' : 'cre-atlas-topnav-tray'} style={TRAY}>
      {button}
      {/* The slide: a one-column grid whose track eases 0fr ↔ 1fr, so the
          links' natural width is what opens — no measured or hard-coded
          widths. Closed, the links are hidden from tab order and readers. */}
      <div className="cre-atlas-topnav-slide" style={{ ...SLIDE, gridTemplateColumns: open ? '1fr' : '0fr' }}>
        <div style={{ minWidth: 0, overflow: 'hidden' }} inert={!open || undefined}>
          <ul style={LINKS}>
            {links.map((l, i) => (
              <li key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                {i > 0 ? <span aria-hidden style={RULE} /> : null}
                <button
                  type="button"
                  className="cre-atlas-topnav-link"
                  // Only in the open tray: Home's Course link and Compass Learning's
                  // name the same page, and only one of them is showing.
                  aria-current={current && isCurrentLink(l) ? 'page' : undefined}
                  onClick={() => onLink(l)}
                  style={LINK}
                >
                  {l.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

/* Figma: 8px across (12 here, below), 28 tall — both buttons (2026-09-30, the designer's
   request; Figma draws the idle one 2px shorter), 8px
   radius, a 4px gap (8 here, below), Open Sans 13/15 SemiBold (10pt here, below); the icon 12px. Colours live on `.cre-atlas-topnav-btn` (tokens.css) so
   hover needs no !important. */
const BUTTON: CSSProperties = {
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  // 8 between icon and label — Figma's 4 plus 4 (2026-10-01, the designer's
  // request).
  gap: 8,
  boxSizing: 'border-box',
  // 12 across — Figma's 8 plus 4 a side (2026-10-01, the designer's request).
  padding: '0 12px',
  height: 28,
  borderRadius: 8,
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  // SemiBold on both, current or not (2026-10-01, the designer's request;
  // Figma sets the idle one Regular).
  fontWeight: 600,
  // 10pt (13.33px): the 12px (9pt) it was, up 1pt — 2026-10-01, the
  // designer's request. Figma's is 13px. (All caps briefly, same day.)
  fontSize: '10pt',
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
// Unused while the plain Top Nav draws no pointer (2026-10-02); kept for a restore.
void POINTER
/* EXPANDING TOP NAV — the pointer turns to face the tray (Figma 168:894, the
   design's pointer rotated 90°): the same rounded triangle, 9 deep and 18 tall,
   set 7px off the button's right edge. */
const POINTER_RIGHT: CSSProperties = {
  position: 'absolute',
  top: '50%',
  right: -7,
  width: 9,
  height: 18,
  transform: 'translateY(-50%)',
  background: 'inherit',
  clipPath: "path('M0 0 L7.59 7.59 A2 2 0 0 1 7.59 10.41 L0 18 Z')",
}
/* The tray: the current button and its links on one tinted pill (Figma's
   #ECEEF0, 8px radius). Its fill fades in with the slide; colours and the
   easing are on `.cre-atlas-topnav-tray` / `-slide` in tokens.css. */
const TRAY: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  borderRadius: 8,
}
const SLIDE: CSSProperties = { display: 'grid' }
/* Figma: 11 from the button to the group, which pads 3 in and 8 out, inside a
   tray that pads 8 more on the right — so 14 before the first link and 16
   after the last. Links 7 apart either side of a 1px rule. */
const LINKS: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 7,
  margin: 0,
  padding: '0 16px 0 14px',
  listStyle: 'none',
  whiteSpace: 'nowrap',
}
/* Figma: Open Sans Regular 13/15 — set 10pt here to match the buttons. */
const LINK: CSSProperties = {
  padding: '4px 0',
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontSize: '10pt',
  lineHeight: '15px',
  fontWeight: 400,
}
/* 1px × 14 (Figma's 26 tall less 6 above and below), rounded. */
const RULE: CSSProperties = {
  width: 1,
  height: 14,
  borderRadius: 1,
  background: 'var(--color-atlas-topnav-rule, #8194a4)',
  flex: 'none',
}
