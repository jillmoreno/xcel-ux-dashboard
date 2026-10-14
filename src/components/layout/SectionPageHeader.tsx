import type { CSSProperties } from 'react'
import { ArrowLeft } from '@/icons'
import { pageHeaderTitleStyle, pageHeaderWrapStyle } from './pageHeaderStyles'

/**
 * COURSES' AND CERTIFICATES' PAGE HEADER — 2026-10-02, the direct ask: the
 * section title "in the same location and font size as the current Home
 * title", with "the eyebrow from Home screen … turned into a breadcrumb".
 *
 * So it is `HomePageHeader` with ONE line swapped. The greeting is a statement
 * and the crumb is a control, but they occupy the same slot at the same height,
 * which is what makes the two screens read as one header with a changing top
 * line rather than two headers. Measured: crumb at the greeting's y, title at
 * Home's.
 *
 * ⚠ THE TITLE IS 28/700, NOT THE SHELL'S 32/500. Every other section in the
 * shell draws `var(--text-heading-3xl)` at weight 500; these two now draw
 * Home's. That is the ask, and the cost is that moving from Certificates to
 * Transcripts changes the title's size — worth knowing before this spreads
 * past the two sections `BREADCRUMB_SECTIONS` names.
 *
 * ⚠ `ArrowLeft`, NOT A CHEVRON. The ask drew "<", but every back affordance in
 * this app is the arrow (`SheetHeader`, `CourseLauncherView`, `PrototypeBar`,
 * the exam widget's month stepper) and the registry carries no chevron-left. A
 * new glyph for an existing meaning is the more expensive half of that trade;
 * swapping it is one import if the chevron is wanted.
 *
 * ⚠ NO INLINE `color`. `.cre-cta-ink` carries it and re-points on the dark
 * theme — an inline colour would beat the stylesheet, which is the trap that
 * class's own note in `tokens.css` records and which the shell's older "Back
 * to {section}" link (inline `--color-action`) still falls into.
 */
export function SectionPageHeader({
  title,
  onBack,
}: {
  title: string
  /** Goes to Home. The shell passes its own `handleSelect('dashboard')`, which
   *  deletes `?section=` rather than writing `dashboard` into it. */
  onBack: () => void
}) {
  return (
    <header style={pageHeaderWrapStyle}>
      <SectionBackCrumb onBack={onBack} />
      <h1 style={pageHeaderTitleStyle}>{title}</h1>
    </header>
  )
}

/**
 * JUST THE CRUMB — split out 2026-10-07, for Resources.
 *
 * ⚠ RESOURCES TAKES THE LINK WITHOUT TAKING THE HEADER, and that is the whole
 * reason this is a separate export rather than a third `BREADCRUMB_SECTIONS`
 * entry. The ask was "a back to Home link in the top left (same as my
 * courses)" — the LINK, not the treatment. The Atlas/Compass Resources page
 * draws its own serif title and lede (see `SectionShell`'s `atlasResources`
 * branch), and routing it through `SectionPageHeader` would either replace
 * that header with Home's 28/700 one or stack two titles, neither of which was
 * asked for.
 *
 * So the crumb renders INSIDE that page's own header, above its `<h1>`, where
 * it inherits the section's gutter and cannot drift away from the title it
 * sits over.
 */
export function SectionBackCrumb({ onBack }: { onBack: () => void }) {
  return (
    /* A <p> for the same reason Home's eyebrow is one: it is the line above
       the title, not a heading of its own. */
    <p style={crumbRowStyle}>
      <button
        type="button"
        onClick={onBack}
        /* The crumb is the only way back to Home that this arm's tiles
           imply, so it is worth being able to kill for a session — "do they
           look for the header's Home, or for the crumb?" */
        data-cta-id="nav.back-home"
        className="cre-link-action cre-cta-ink"
        style={crumbButtonStyle}
      >
        <ArrowLeft size={13} aria-hidden />
        Back to Home
      </button>
    </p>
  )
}

/* Sized to the greeting's box rather than to itself: 16.5px of line over a 6px
   gap is what puts the title on Home's baseline, and the crumb's own 13px type
   is shorter than that. Centring it inside the same height keeps both screens'
   titles on the same y. */
const crumbRowStyle: CSSProperties = {
  margin: '0 0 6px',
  display: 'flex',
  alignItems: 'center',
  minHeight: '16.5px',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '16.5px',
}

/* Carries NO colour — `.cre-cta-ink` does. The rest is the reset a <button>
   needs to sit in a line of text, matching the Compass player's crumbs. */
const crumbButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  background: 'transparent',
  border: 0,
  padding: 0,
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: 'inherit',
  lineHeight: 'inherit',
  fontWeight: 600,
}
