import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from '@/icons'
import { useAccount } from '@/context/AccountContext'
import {
  justLaunchedFor,
  type JustLaunchedItem,
} from '@/data/membership/membershipFirstFixtures'
import { Eyebrow, Wrap } from '../v2/passportShared'
import { ContentTypeTag, LaunchCardMedia, TierTag, UnlockChip } from './shared'
import { isGated, type MembershipAccess } from './sharedUtil'

/**
 * "Just launched for members" — the spine of the Membership-First page.
 * Discoverability of new benefits is the page's primary job, so this is
 * the first thing below the hero. Cards span content types (podcast, AI
 * tool, exam prep, course track), each carrying a NEW marker.
 *
 * When browsing as Lite / non-member, Passport-only cards swap their CTA
 * for "Unlock with Passport" but stay fully visible (tease, don't hide);
 * the podcast (a Lite inclusion) stays openable as the free sample.
 */
export function WhatsNewSpine({
  access,
  hideTitle = false,
  hideBlurb = false,
  compactTop = false,
  eyebrowColor,
}: {
  access: MembershipAccess
  /** Hide the "New in your membership" h2 (the membership overview uses the
   *  eyebrow only). Default keeps the title for the V4 page. */
  hideTitle?: boolean
  /** Hide the "Fresh benefits added…" blurb. Default keeps it for V4. */
  hideBlurb?: boolean
  /** Trim the section's top padding (the overview sits this inside a band
   *  and wants it tighter). Default keeps the V4 page's roomier 48px. */
  compactTop?: boolean
  /** Override the eyebrow color (the overview matches its "Your Learning"
   *  eyebrow). Default keeps the shared secondary-700 for the V4 page. */
  eyebrowColor?: string
}) {
  const { brand } = useAccount()
  const items = justLaunchedFor(brand)
  if (items.length === 0) return null

  return (
    <section
      id="whats-new"
      style={{
        scrollMarginTop: 16,
        padding: compactTop ? '24px 0 40px' : '48px 0 52px',
      }}
    >
      <Wrap>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 16,
            marginBottom: 24,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <Eyebrow style={eyebrowColor ? { color: eyebrowColor, fontSize: 15 } : undefined}>
              Just launched for members
            </Eyebrow>
            {!hideTitle && (
              <h2
                style={{
                  margin: '8px 0 0',
                  fontFamily: 'var(--font-heading)',
                  fontSize: 30,
                  fontWeight: 800,
                  lineHeight: 1.1,
                  letterSpacing: '-0.01em',
                  color: 'var(--color-primary-800)',
                }}
              >
                New in your membership
              </h2>
            )}
          </div>
          {!hideBlurb && (
            <p
              style={{
                margin: 0,
                maxWidth: '40ch',
                fontFamily: 'var(--font-body)',
                fontSize: 15,
                lineHeight: 1.5,
                color: 'var(--color-text-secondary)',
              }}
            >
              Fresh benefits added since you last renewed — not just courses. Jump in without
              leaving the page.
            </p>
          )}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 20,
          }}
        >
          {items.map((item) => (
            <WhatsNewCard key={item.id} item={item} access={access} />
          ))}
        </div>
      </Wrap>
    </section>
  )
}

const CARD: CSSProperties = {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-lg)',
  overflow: 'hidden',
  boxShadow: 'var(--shadow-card)',
  textDecoration: 'none',
  color: 'inherit',
}

const CARD_BODY: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  padding: 22,
}

function WhatsNewCard({ item, access }: { item: JustLaunchedItem; access: MembershipAccess }) {
  const gated = isGated(item.tier, access)
  return (
    <Link to={item.href} aria-label={item.title} className="cre-passport-prod" style={CARD}>
      <LaunchCardMedia
        tone={item.accent}
        title={item.title}
        image={item.image}
        coverLabel={item.coverLabel}
      />
      <div style={CARD_BODY}>
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: 'var(--color-eyebrow-text)',
          }}
        >
          {item.kicker}
        </span>
        <h3
          style={{
            margin: '4px 0 8px',
            fontFamily: 'var(--font-heading)',
            fontSize: 18,
            fontWeight: 700,
            lineHeight: 1.2,
            color: 'var(--color-accent-text)',
          }}
        >
          {item.title}
        </h3>
        <p
          style={{
            margin: '0 0 16px',
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            lineHeight: 1.5,
            color: 'var(--color-text-secondary)',
            flex: 1,
          }}
        >
          {item.blurb}
        </p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
          <ContentTypeTag type={item.contentType} />
          <TierTag tier={item.tier} />
        </div>
        {gated ? (
          <UnlockChip />
        ) : (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              fontSize: 14,
              color: 'var(--color-accent-text)',
            }}
          >
            {item.ctaLabel}
            <ArrowRight size={14} aria-hidden />
          </span>
        )}
      </div>
    </Link>
  )
}
