import { useEffect, useRef, type CSSProperties } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAccount, type Membership } from '@/context/AccountContext'
import {
  DashboardRecommendedBand,
  type RecommendedBandPreview,
} from '@/components/membership/DashboardRecommendedBand'

/**
 * Recommended Card A/B — side-by-side compare page.
 *
 * A standalone review surface for the Dashboard Rebrand Home "Recommended for
 * you" band card-style A/B test. Renders the SAME real `DashboardRecommendedBand`
 * component twice via its `preview` override — once as **Variant A · Compact
 * square** (the shelf cover cards) and once as **Variant B · What's Trending**
 * (the large image-forward cards) — so reviewers can eyeball both contenders
 * together without flipping a flag. Because it uses the production component, the
 * previews can never drift from the shipped band.
 *
 * Scoped to **CRE** (Colibri Real Estate): the page seeds the demo account to CRE
 * on entry (independent of `/dashboard-rebrand`, which force-seeds Elite). A
 * **Member / Non-member** toggle covers both audiences in one view. To see a
 * single variant live on the real Home, flip the `home-recommended-card-ab`
 * feature flag (Admin tools → Feature Flag panel) — this page is the no-setup way
 * to compare the two.
 */

const VARIANT_A: RecommendedBandPreview = { cardStyle: 'shelf', background: 'white' }
const VARIANT_B: RecommendedBandPreview = { cardStyle: 'trending-3up', background: 'white' }

export function RecommendedCardABComparePage() {
  const { brand, membership, setAccount, setMembership } = useAccount()
  const [params] = useSearchParams()
  const wantMembership = params.get('membership')
  const seeded = useRef(false)

  // Seed CRE — the brand this A/B is scoped to — ONCE on entry. An explicit
  // `?membership=member|non-member` deep-link (used by the handoff gateway to
  // land directly in one audience) wins and seeds that membership. Otherwise
  // only seed when arriving on a different brand, so a reviewer who switched
  // brand via the Demo tools (to eyeball the same A/B in another brand) keeps
  // their choice across a soft re-render. The one-shot ref keeps the toggle
  // below from being clobbered.
  useEffect(() => {
    if (seeded.current) return
    seeded.current = true
    // This compare page was authored against CRE, the only brand with the
    // Recommended-band fixtures it renders. Those went with the brand, so it
    // now seeds XCEL like every other route — see the note on the page.
    if (wantMembership === 'member' || wantMembership === 'non-member') {
      setAccount('xcel', wantMembership)
      return
    }
    setAccount('xcel', 'member')
  }, [brand, wantMembership, setAccount])

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <span style={eyebrowStyle}>Home · Recommended for you · A/B test</span>
        <h1 style={titleStyle}>Recommended card styles — A/B</h1>
        <p style={leadStyle}>
          Two card treatments for the Home dashboard&rsquo;s &ldquo;Recommended for you&rdquo; band,
          shown side by side. Both render the real band component with live CRE content, so what you
          see here is exactly what ships. Use the toggle to compare the member and non-member views.
        </p>
        <MembershipToggle value={membership} onChange={setMembership} />
      </header>

      <VariantPanel
        badge="A"
        title="Compact square"
        blurb="Small square cover cards (SimpleCard). Denser — more products per row, quicker to scan, less real estate per item."
        preview={VARIANT_A}
      />

      <VariantPanel
        badge="B"
        title="What's Trending"
        blurb="Large image-forward cards (VibrantCard). Full-bleed cover photo with the title, meta, and price over a dark scrim, plus a play affordance on audio and video — more visual impact, fewer per row."
        preview={VARIANT_B}
      />

      <p style={flagNoteStyle}>
        <strong>Flag:</strong> <code style={codeStyle}>home-recommended-card-ab</code> (Widgets ·
        Dashboard Rebrand). <strong>Off by default</strong> — the real Home band keeps its normal
        card style. Turn it on and pick <em>A · Compact square</em> or <em>B · What&rsquo;s
        Trending</em> to see the chosen variant live on <code style={codeStyle}>/dashboard-rebrand</code>{' '}
        (switch the brand to Real Estate via the Demo Controls first).
      </p>
    </div>
  )
}

/* ─── member / non-member toggle ──────────────────────────────────────── */

function MembershipToggle({
  value,
  onChange,
}: {
  value: Membership
  onChange: (m: Membership) => void
}) {
  const options: { value: Membership; label: string }[] = [
    { value: 'member', label: 'Member' },
    { value: 'non-member', label: 'Non-member' },
  ]
  return (
    <div role="radiogroup" aria-label="Membership view" style={toggleWrapStyle}>
      {options.map((opt) => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            style={{ ...toggleBtnStyle, ...(active ? toggleBtnActiveStyle : null) }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

/* ─── one variant panel ───────────────────────────────────────────────── */

function VariantPanel({
  badge,
  title,
  blurb,
  preview,
}: {
  badge: string
  title: string
  blurb: string
  preview: RecommendedBandPreview
}) {
  return (
    <section style={panelStyle}>
      <div style={panelHeaderStyle}>
        <span style={badgeStyle} aria-hidden>
          {badge}
        </span>
        <div style={{ minWidth: 0 }}>
          <h2 style={panelTitleStyle}>
            Variant {badge} · {title}
          </h2>
          <p style={panelBlurbStyle}>{blurb}</p>
        </div>
      </div>
      <div style={bandWrapStyle}>
        <DashboardRecommendedBand preview={preview} />
      </div>
    </section>
  )
}

/* ─── styles (tokens only) ────────────────────────────────────────────── */

const pageStyle: CSSProperties = {
  maxWidth: 1200,
  margin: '0 auto',
  padding: '32px 24px 64px',
  display: 'flex',
  flexDirection: 'column',
  gap: 28,
}

const headerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  alignItems: 'flex-start',
}

const eyebrowStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--color-text-secondary)',
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontSize: 30,
  fontWeight: 700,
  lineHeight: 1.15,
  color: 'var(--color-text-primary)',
}

const leadStyle: CSSProperties = {
  margin: 0,
  maxWidth: '68ch',
  fontFamily: 'var(--font-body)',
  fontSize: 15,
  lineHeight: '23px',
  color: 'var(--color-text-secondary)',
}

const toggleWrapStyle: CSSProperties = {
  marginTop: 6,
  display: 'inline-flex',
  gap: 4,
  padding: 4,
  background: 'var(--color-neutral-100)',
  borderRadius: 'var(--radius-pill)',
}

const toggleBtnStyle: CSSProperties = {
  appearance: 'none',
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  padding: '7px 18px',
  borderRadius: 'var(--radius-pill)',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
}

const toggleBtnActiveStyle: CSSProperties = {
  background: 'var(--color-cta-500)',
  color: 'var(--color-text-inverse)',
  boxShadow: '0 1px 3px rgb(0 0 0 / 0.15)',
}

const panelStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  padding: 20,
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-card)',
}

const panelHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 14,
}

const badgeStyle: CSSProperties = {
  flexShrink: 0,
  width: 34,
  height: 34,
  borderRadius: 'var(--radius-pill)',
  background: 'var(--color-primary-600)',
  color: 'var(--color-text-inverse)',
  display: 'grid',
  placeItems: 'center',
  fontFamily: 'var(--font-heading)',
  fontSize: 17,
  fontWeight: 700,
}

const panelTitleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontSize: 19,
  fontWeight: 700,
  color: 'var(--color-text-primary)',
}

const panelBlurbStyle: CSSProperties = {
  margin: '4px 0 0',
  maxWidth: '72ch',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '20px',
  color: 'var(--color-text-secondary)',
}

// The band re-pads its own inner content (28px 40px); the wrapper just gives it
// a tinted surface + rounded frame so the contained band reads as a preview.
const bandWrapStyle: CSSProperties = {
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border-subtle)',
  background: 'var(--color-surface-page)',
  overflow: 'hidden',
}

const flagNoteStyle: CSSProperties = {
  margin: 0,
  padding: '14px 16px',
  background: 'var(--color-neutral-75)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '20px',
  color: 'var(--color-text-secondary)',
}

const codeStyle: CSSProperties = {
  fontFamily: 'ui-monospace, monospace',
  fontSize: 12,
  background: 'var(--color-neutral-100)',
  padding: '1px 5px',
  borderRadius: 4,
}
