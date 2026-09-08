import type { CSSProperties } from 'react'
import { SearchInput } from '@/components/ui/SearchInput'
import { MembershipBadge } from '@/components/ui/MembershipBadge'
import { tierBadgeIcon } from '@/components/ui/membershipTierBadge'
import { useAccount } from '@/context/AccountContext'

/**
 * Section hero for the Dashboard Rebrand shell's Membership-group sections.
 * A `<header>` carrying the section title, a short description of the
 * membership feature, and a prototype search field.
 *
 * Three treatments:
 *   - `gradient` (Membership default) — a brand-gradient band flush against
 *     the slim header (full-bleed across the content column), white text + a
 *     translucent search field.
 *   - `plain` (Membership, via the `membership-section-hero-style` flag) — no
 *     band: dark (black) title + description on the page background, with the
 *     standard light search field.
 *   - `light` (My Learning: Courses, Certificates, Course Catalog) — a
 *     full-bleed band tinted a *light* shade of the brand color so the title +
 *     description stay black (theme-aware via `color-mix` over the card
 *     surface), with the standard light search field. Gives those sections the
 *     same title-left / search-right hero as the Resource Library without the
 *     dark gradient. Set via the `tone="light"` prop; ignores the flag (that
 *     flag only governs the Membership gradient/plain choice).
 * All re-pad the `<h1>` to the SAME 24px top / 40px left offset as the plain
 * My Learning titles, so the heading never shifts when switching sections.
 *
 * Rebrand-scoped: only `PlatformShell`'s SectionShell renders this. Search is
 * a stub — `onChange` logs to the console and does NOT filter the section body.
 */
type Props = {
  /** Section id — only used to tag the search console stub. */
  section: string
  title: string
  description: string
  searchPlaceholder: string
  /**
   * `brand` (default) — Membership gradient/plain (flag-driven).
   * `light` — the light brand-tint band for My Learning sections (black text).
   * `plain` — no band at all: black title + search on the page background
   *   (the clean My-Learning header used by Courses, Figma 40:2).
   */
  tone?: 'brand' | 'light' | 'plain'
  /** Drop the description line — a title-only header (title + search). */
  hideDescription?: boolean
  /** Drop the search field — e.g. a short list that doesn't need filtering. */
  hideSearch?: boolean
  /** Show the "Included with your membership" eyebrow (label + a tier chip) above
   *  the title, keeping the membership framing on the Explore section heroes.
   *  Member-only. Omit / false to hide the eyebrow. */
  membershipEyebrow?: boolean
}

export function MembershipSectionHero({
  section,
  title,
  description,
  searchPlaceholder,
  tone = 'brand',
  hideDescription = false,
  hideSearch = false,
  membershipEyebrow,
}: Props) {
  const { tierLabel, tierTone } = useAccount()
  // `light` / `plain` force their treatment; `brand` (the default) is always
  // the gradient band.
  const treatment: 'gradient' | 'plain' | 'light' =
    tone === 'light' ? 'light' : tone === 'plain' ? 'plain' : 'gradient'
  const t = TREATMENTS[treatment]
  return (
    <header className="cre-rebrand-hero" style={t.band}>
      <div style={rowStyle}>
        <div style={{ minWidth: 0, flex: '1 1 420px' }}>
          {membershipEyebrow && (
            <div style={eyebrowRowStyle}>
              <span style={{ ...eyebrowLabelStyle, color: t.eyebrow }}>
                Included with your membership
              </span>
              <MembershipBadge
                label={tierLabel ?? 'Member'}
                tone={tierTone}
                icon={tierBadgeIcon(tierTone)}
              />
            </div>
          )}
          <h1 style={t.title}>{title}</h1>
          {!hideDescription && <p style={t.desc}>{description}</p>}
        </div>
        {!hideSearch && (
          // Search chrome follows the band: the dark `gradient` band gets the
          // translucent "on-color" treatment so the field reads as part of the
          // band (not a bright white box); the `light` (pale tint, black text)
          // and `plain` (no band) treatments keep the standard white field so
          // the dark text/placeholder stays legible. Sized + positioned the
          // same (top-right, `0 1 280px`) regardless. Stub — onChange logs; the
          // section body doesn't filter yet.
          <SearchInput
            label={searchPlaceholder}
            placeholder={searchPlaceholder}
            tone={treatment === 'gradient' ? 'on-color' : 'default'}
            onChange={(e) =>
              console.info('rebrand-hero:search', { section, value: e.currentTarget.value })
            }
            style={HERO_SEARCH_STYLE}
          />
        )}
      </div>
    </header>
  )
}

/* ─── styles (tokens only for colors + fonts) ────────────────────────── */

const bandStyle: CSSProperties = {
  // Flush to the slim header + full-bleed across the content column: cancel
  // SectionShell's 24px top + 40px side gutter via negative margins. The
  // inner padding re-pads the title to the same 24px/40px offset a plain
  // My Learning title sits at, so the heading never shifts between sections.
  margin: '-24px -40px 24px',
  padding: '24px 40px 32px',
  // Lighter (primary-600) top-left → darker (primary-700) bottom-right.
  background: 'linear-gradient(120deg, var(--color-primary-600), var(--color-primary-700))',
  color: 'var(--color-text-inverse)',
}

// "Included with your membership" eyebrow row (label + tier chip) above the h1.
const eyebrowRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
  marginBottom: 10,
}

const eyebrowLabelStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '1.1px',
  textTransform: 'uppercase',
}

const rowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  // Top-align so the 40px-tall search field sits on the same horizontal line
  // as the title (both 40px) on the right; the description flows below the
  // title on the left.
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 20,
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontWeight: 500,
  fontSize: 'var(--text-heading-3xl)',
  lineHeight: 'var(--text-heading-3xl--line-height)',
  color: 'var(--color-text-inverse)',
}

const descStyle: CSSProperties = {
  margin: '8px 0 0',
  // Wider measure before wrapping — the hero band is full-bleed, so the
  // description can run longer (fewer lines) and still sit left of the search.
  maxWidth: '80ch',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--text-body-sm)',
  fontWeight: 400,
  lineHeight: 'var(--text-body-sm--line-height)',
  color: 'rgb(255 255 255 / 0.85)',
}

// Shared search sizing for every section hero — top-right, `0 1 280px`, the
// SearchInput's own 40px-tall light chrome. The band tone doesn't change it.
const HERO_SEARCH_STYLE: CSSProperties = { flex: '0 1 280px' }

/* ─── plain variant (no background, black text) ──────────────────────── */

// No band + no breakout — the <h1> lands at SectionShell's own 24px/40px
// gutter (same spot as the gradient variant + the plain My Learning titles);
// `marginBottom` keeps a gap before the section body.
const plainBandStyle: CSSProperties = {
  margin: '0 0 24px',
}

const plainTitleStyle: CSSProperties = {
  ...titleStyle,
  color: 'var(--color-text-primary)',
}

const plainDescStyle: CSSProperties = {
  ...descStyle,
  color: 'var(--color-text-secondary)',
}

/* ─── light variant (light brand-tint band, black text) ──────────────── */

// Full-bleed band like the gradient (same -24/-40 breakout + re-pad), but
// tinted a LIGHT shade of the brand color so the title/description read black.
// `color-mix` over the card surface keeps it theme-aware: a soft brand tint
// over white in light mode, a subtle brand-tinted dark band in dark mode (so
// the adaptive text token still reads). A hairline bottom border defines the
// band's edge when the tint is faint.
const lightBandStyle: CSSProperties = {
  margin: '-24px -40px 24px',
  padding: '24px 40px 32px',
  background:
    'color-mix(in srgb, var(--color-primary-500) 10%, var(--color-surface-card))',
  borderBottom: '1px solid var(--color-border-subtle)',
  color: 'var(--color-text-primary)',
}

const lightTitleStyle: CSSProperties = {
  ...titleStyle,
  color: 'var(--color-text-primary)',
}

const lightDescStyle: CSSProperties = {
  ...descStyle,
  color: 'var(--color-text-secondary)',
}

/* ─── treatment lookup ───────────────────────────────────────────────── */

const TREATMENTS: Record<
  'gradient' | 'plain' | 'light',
  {
    band: CSSProperties
    title: CSSProperties
    desc: CSSProperties
    /** Color for the "Included with your membership" eyebrow label. */
    eyebrow: string
  }
> = {
  gradient: {
    band: bandStyle,
    title: titleStyle,
    desc: descStyle,
    eyebrow: 'rgb(255 255 255 / 0.82)',
  },
  plain: {
    band: plainBandStyle,
    title: plainTitleStyle,
    desc: plainDescStyle,
    eyebrow: 'var(--color-text-secondary)',
  },
  light: {
    band: lightBandStyle,
    title: lightTitleStyle,
    desc: lightDescStyle,
    eyebrow: 'var(--color-text-secondary)',
  },
}
