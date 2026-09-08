import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from '@/icons'
import { MemberExclusivePill } from './MemberExclusivePill'
import { Card } from '@/components/ui/Card'
import { LoFiCardBody } from '@/components/lo-fi/LoFiPlaceholders'
import { useLoFi } from '@/context/LoFiContext'
import type { PartnerOffering } from '@/data/membership/partnerOfferingsFixtures'
import { PARTNER_LOGOS } from './partnerLogos'

/**
 * VIP Partner Offering card — redesigned to match the reference
 * (NatMed / Prescriber Insights style):
 *
 *   ┌──────────────────────────────────────────────┐
 *   │                                              │
 *   │            [partner logo]                    │   ← clean logo area (no gradient)
 *   │                                              │
 *   │  Partner name                                │
 *   │  1-3 line description …                      │
 *   │                                              │
 *   │  ───────────────────────────────────────    │
 *   │  Learn More →                                │
 *   └──────────────────────────────────────────────┘
 *
 * Differences vs. the earlier (gradient-header) iteration:
 *
 *   - The colored gradient block at the top is **gone**. The logo
 *     now lives inline at the top of the card body on a clean white
 *     surface, matching the reference screenshot.
 *   - The card's overall proportions tightened — same 265px min-
 *     width, ~290px min-height — so the surface reads as a more
 *     square "product tile" rather than a tall course card.
 *   - The eyebrow + savings-pill rows were dropped from the render
 *     (data still lives on the fixture for future surfaces); the
 *     reference design keeps the body lean (name → description →
 *     CTA).
 *
 * Partners with `logoKey` set render the matching SVG component
 * from `partnerLogos.tsx` (today: NatMed + Prescriber Insights);
 * everyone else falls back to a clean typographic wordmark built
 * from `partnerName`.
 *
 * Reuses the `.cre-library-card` hover class so the card picks up
 * the same hover-zoom-color transition as the catalog / library
 * cards.
 */
type Props = {
  data: PartnerOffering
  /** Non-member view — the "Learn More →" link is replaced with a
   *  "Member Exclusive" locked pill (Figma 63:16150). */
  locked?: boolean
}

export function PartnerOfferingCard({ data, locked = false }: Props) {
  const { loFi } = useLoFi()
  if (loFi) {
    return (
      <Card className="cre-library-card" style={cardStyle}>
        <LoFiCardBody ariaLabel="Lo-fi partner offering card" />
      </Card>
    )
  }
  const LogoComponent = data.logoKey
    ? PARTNER_LOGOS[data.logoKey]
    : null

  return (
    <Card className="cre-library-card" style={cardStyle}>
      <div style={logoAreaStyle}>
        {LogoComponent ? (
          <LogoComponent />
        ) : (
          // Typographic fallback — partner name rendered as a clean
          // dark-blue wordmark when no custom SVG ships. Keeps every
          // card in the grid looking purposeful rather than
          // "missing".
          <span style={wordmarkFallbackStyle}>{data.partnerName}</span>
        )}
      </div>

      <div style={bodyStyle}>
        <h3 style={nameStyle} className="cre-library-card-title">
          {data.partnerName}
        </h3>
        <p style={descriptionStyle}>{data.description}</p>

        <div style={spacerStyle} />
        <div aria-hidden style={dividerStyle} />

        {locked ? (
          <MemberExclusivePill />
        ) : (
          <Link to={data.learnMoreUrl} style={learnMoreStyle}>
            Learn More
            <ChevronRight size={14} aria-hidden />
          </Link>
        )}
      </div>
    </Card>
  )
}

/* ─── styles ───────────────────────────────────────────────────────── */

const cardStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  // Match the canonical card min-width so the partner grid stays in
  // rhythm with the library + catalog grids.
  minWidth: 265,
  // Tighter overall height — the redesigned body is leaner (no
  // gradient header, no savings pill, no eyebrow) so the card
  // squares up.
  minHeight: 290,
  // Fill the (grid-stretched) cell so every card in a row matches the tallest;
  // the body's `flex: 1` spacer then pins the CTA to the bottom. Mirrors
  // ResourceCard — without this a longer blurb leaves shorter cards short.
  height: '100%',
}

const logoAreaStyle: CSSProperties = {
  // Clean white surface — the logo sits inline against the card
  // background rather than over a gradient. Padding gives the SVG
  // room to breathe; min-height keeps every card's logo plate the
  // same height even when the chosen SVG is shorter than the
  // typographic fallback. The width-cap on the inner SVGs (max
  // 100%) means tall trchealthcare-style marks (icon + wordmark +
  // tagline) scale down without overflowing the 265px card.
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px 16px 12px',
  minHeight: 96,
}

const wordmarkFallbackStyle: CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: 20,
  fontWeight: 700,
  lineHeight: 1.15,
  letterSpacing: '-0.01em',
  textAlign: 'center',
  color: 'var(--color-primary-800)',
}

const bodyStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  padding: '4px 16px 16px',
  flex: 1,
}

const nameStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 16,
  fontWeight: 700,
  lineHeight: '22px',
  // Color intentionally omitted — `.cre-library-card-title` inherits
  // from the card root so the partner name participates in the hover
  // darkening alongside catalog / library cards.
}

const descriptionStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '19px',
  color: 'var(--color-text-secondary)',
  display: '-webkit-box',
  WebkitLineClamp: 3,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
}

const spacerStyle: CSSProperties = {
  flex: 1,
  minHeight: 8,
}

const dividerStyle: CSSProperties = {
  height: 1,
  background: 'var(--color-border-subtle)',
  marginBottom: 10,
}

const learnMoreStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  // Contrast-aware CTA link (deep magenta on light, light pink on the navy
  // dark surface) — flat --color-action/cta-500 was 2.9:1 in dark mode. #1
  color: 'var(--color-accent-link)',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 700,
  textDecoration: 'none',
  alignSelf: 'flex-start',
}
