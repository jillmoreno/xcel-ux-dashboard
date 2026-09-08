import { useEffect, useRef, useState, type CSSProperties } from 'react'

/**
 * Sticky quick-filter bar for the rebrand What's New page (Figma 322:19) —
 * sits directly below the `WhatsNewUpsellBand`, on a `secondary-800` band, and
 * pins to the top while scrolling (just under the prototype bar + platform
 * header). Each chip quick-jumps to its `ExploreMembershipProducts` section
 * (the `BenefitSections` rows carry `id={row.id}`); the chip for the section
 * currently under the bar is highlighted (scroll-spy), so on load CE Podcasts
 * (the top section) reads active, matching the design.
 */
const SECTIONS = [
  { id: 'podcasts', label: 'CE Podcasts' },
  { id: 'exam-specialties', label: 'Cert Prep' },
  { id: 'transitions', label: 'Transitions' },
  { id: 'career-tools', label: 'AI Career Tools' },
  { id: 'learning-library', label: 'Resource Library' },
]

// The sticky stack the bar tucks under: 40px prototype bar (pinned top:0) +
// the 72px platform header (sticky top:40).
const STICKY_TOP = 112

export function WhatsNewQuickFilter() {
  const [active, setActive] = useState(SECTIONS[0].id)
  const barRef = useRef<HTMLDivElement>(null)

  // Scroll-spy: the active chip is the last section whose top has passed under
  // the bar's bottom edge.
  useEffect(() => {
    const onScroll = () => {
      const barH = barRef.current?.offsetHeight ?? 52
      const threshold = STICKY_TOP + barH + 16
      let current = SECTIONS[0].id
      for (const s of SECTIONS) {
        const el = document.getElementById(s.id)
        if (el && el.getBoundingClientRect().top <= threshold) current = s.id
      }
      setActive(current)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const jumpTo = (id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    const barH = barRef.current?.offsetHeight ?? 52
    const y = el.getBoundingClientRect().top + window.scrollY - STICKY_TOP - barH - 12
    window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' })
  }

  return (
    <nav ref={barRef} style={barStyle} aria-label="Jump to section">
      {SECTIONS.map((s) => {
        const isActive = active === s.id
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => jumpTo(s.id)}
            aria-current={isActive ? 'true' : undefined}
            style={{ ...chipStyle, ...(isActive ? chipActiveStyle : null) }}
          >
            {s.label}
          </button>
        )
      })}
    </nav>
  )
}

// Full-bleed band (cancels SectionShell's 40px gutter) pinned below the header.
// The background matches the page surface (no distinct banner color) but stays
// opaque so content scrolls cleanly behind it; adapts in dark mode.
const barStyle: CSSProperties = {
  position: 'sticky',
  top: STICKY_TOP,
  zIndex: 40,
  margin: '0 -40px',
  padding: '10px 40px',
  background: 'var(--color-surface-page)',
  display: 'flex',
  gap: 8,
  overflowX: 'auto',
  scrollbarWidth: 'none',
}

// Outlined filter pills on the light bar.
const chipStyle: CSSProperties = {
  flexShrink: 0,
  cursor: 'pointer',
  padding: '6px 16px',
  borderRadius: 'var(--radius-pill)',
  border: '1px solid var(--color-border-subtle)',
  background: 'var(--color-surface-card)',
  color: 'var(--color-text-secondary)',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 600,
  whiteSpace: 'nowrap',
  transition: 'background 150ms ease, color 150ms ease, border-color 150ms ease',
}

// Active pill: primary outline + tint.
const chipActiveStyle: CSSProperties = {
  borderColor: 'var(--color-primary-500)',
  background: 'var(--color-primary-100)',
  color: 'var(--color-primary-700)',
}
