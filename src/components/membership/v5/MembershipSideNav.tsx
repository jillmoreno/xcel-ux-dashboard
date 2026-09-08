import { useState, type ComponentType, type ReactNode } from 'react'
import { Award, Crown, Gem, Library, Podcast, Robot, StarSolid } from '@/icons'

/**
 * V5 secondary side navigation.
 *
 * Deliberately subordinate to the global top nav: it lists ONLY the
 * membership benefit areas that have no home in the top nav. Anything
 * already reachable from the top nav (Dashboard, Learning Paths, My
 * Courses, Certificates, My Podcasts, Course Catalog, Membership) is
 * intentionally excluded — so this rail never duplicates the primary
 * frame, it just fast-jumps to the in-page membership sections.
 *
 * Each item maps to a section id rendered by the v4 content components
 * (`whats-new`, `learning-library`, `exam-prep`, `career-tools`, `more`),
 * plus a v5-only `podcasts` section (`MembershipPodcastHub`). The rail is a
 * controlled selector: clicking an item swaps the content column to show
 * ONLY that section (the active id is owned by `MembershipV5`).
 *
 * NOTE: the CE Podcasts row still also appears within Resource Library (a
 * short teaser); the dedicated `podcasts` rail item opens the full
 * membership-framed podcast hub (new episodes + continue listening +
 * featured bundles). A persistent Now Playing bar lives in `MembershipV5`.
 */

type SideNavItem = {
  id: string
  label: string
  icon: ComponentType<{ size?: number }>
}

/** Member-only overview ("mini dashboard") section, prepended for members. */
const OVERVIEW_ITEM: SideNavItem = { id: 'overview', label: 'Your Membership', icon: Crown }

const ITEMS: SideNavItem[] = [
  { id: 'whats-new', label: 'New for members', icon: StarSolid },
  { id: 'learning-library', label: 'Resource Library', icon: Library },
  { id: 'podcasts', label: 'CE Podcasts', icon: Podcast },
  { id: 'exam-prep', label: 'Exam & Cert Prep', icon: Award },
  { id: 'career-tools', label: 'AI Career Tools', icon: Robot },
  { id: 'more', label: 'Partner Offers & More', icon: Gem },
]

export function MembershipSideNav({
  active,
  onSelect,
  includeOverview = false,
  tone = 'light',
  header,
  showCaption = true,
  bleed = false,
}: {
  active: string
  onSelect: (id: string) => void
  /** Prepend the member-only "Your Membership" overview item. */
  includeOverview?: boolean
  /** `'dark'` (V7) paints the rail as a primary-800 strip with light text. */
  tone?: 'light' | 'dark'
  /** Optional content rendered above the nav list — V7 uses it for the
   *  user profile header. */
  header?: ReactNode
  /** Show the "In your membership" caption above the list. V7 hides it. */
  showCaption?: boolean
  /** Drop the floating-card chrome (background / border / radius / shadow /
   *  sticky) so an outer full-bleed dark rail provides the surface (V7
   *  full-bleed flag). */
  bleed?: boolean
}) {
  const items = includeOverview ? [OVERVIEW_ITEM, ...ITEMS] : ITEMS
  const dark = tone === 'dark'
  const [hovered, setHovered] = useState<string | null>(null)
  return (
    <nav
      aria-label="Membership sections"
      style={{
        ...NAV,
        ...(dark
          ? {
              background: 'var(--color-primary-800)',
              border: '1px solid var(--color-primary-900)',
            }
          : null),
        ...(bleed
          ? {
              position: 'static',
              width: '100%',
              background: 'transparent',
              border: 'none',
              borderRadius: 0,
              boxShadow: 'none',
              padding: 0,
            }
          : null),
      }}
    >
      {header}
      {showCaption && (
        <p
          style={{
            ...CAPTION,
            color: dark ? 'rgb(255 255 255 / 0.55)' : 'var(--color-text-tertiary)',
          }}
        >
          In your membership
        </p>
      )}
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((item) => {
          const Icon = item.icon
          const isActive = active === item.id
          const isHover = hovered === item.id && !isActive
          const activeBg = dark ? 'rgb(255 255 255 / 0.12)' : 'var(--color-primary-100)'
          const hoverBg = dark ? 'rgb(255 255 255 / 0.06)' : 'var(--color-primary-50)'
          const activeColor = dark ? 'var(--color-text-inverse)' : 'var(--color-primary-800)'
          const idleColor = dark ? 'rgb(255 255 255 / 0.8)' : 'var(--color-text-secondary)'
          const hoverColor = dark ? 'var(--color-text-inverse)' : 'var(--color-primary-800)'
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                onMouseEnter={() => setHovered(item.id)}
                onMouseLeave={() => setHovered((h) => (h === item.id ? null : h))}
                aria-current={isActive ? 'true' : undefined}
                style={{
                  ...ROW,
                  background: isActive ? activeBg : isHover ? hoverBg : 'transparent',
                  color: isActive ? activeColor : isHover ? hoverColor : idleColor,
                  fontWeight: isActive ? 700 : 600,
                  borderLeft: `3px solid ${isActive ? 'var(--color-nav-active)' : 'transparent'}`,
                }}
              >
                <Icon size={17} aria-hidden />
                {item.label}
              </button>
            </li>
          )
        })}
      </ul>
      {dark && (
        <div
          aria-hidden
          style={{
            marginTop: 30,
            marginBottom: 30,
            borderTop: '1px solid rgb(255 255 255 / 0.14)',
          }}
        />
      )}
    </nav>
  )
}

const NAV: React.CSSProperties = {
  position: 'sticky',
  top: 88,
  alignSelf: 'flex-start',
  width: 232,
  flexShrink: 0,
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-lg)',
  padding: '16px 12px',
  boxShadow: 'var(--shadow-card)',
}

const CAPTION: React.CSSProperties = {
  margin: '0 0 10px',
  padding: '0 8px',
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--color-text-tertiary)',
}

const ROW: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 12px',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  textAlign: 'left',
  cursor: 'pointer',
  lineHeight: 1.2,
  transition: 'background 120ms ease, color 120ms ease',
}
