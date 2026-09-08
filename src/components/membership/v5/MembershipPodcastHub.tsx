import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Podcast } from '@/icons'
import { ContinueListeningCard } from '@/components/courses/ContinueListeningCard'
import { FeaturedBundleCard } from '@/components/courses/FeaturedBundleCard'
import { PodcastCard } from '@/components/courses/PodcastCard'
import {
  CONTINUE_LISTENING,
  FEATURED_BUNDLES,
  RECOMMENDED_PODCASTS,
} from '@/data/podcastFixtures'
import { SecTitle } from '../v2/passportShared'
import { UnlockChip } from '../v4/shared'
import type { MembershipAccess } from '../v4/sharedUtil'

/**
 * V5 Podcasts section — the membership-framed podcast hub surfaced by the
 * side-nav "CE Podcasts" rail item.
 *
 * This is NOT a copy of the standalone /my-learning/podcasts page; it
 * reframes that feature set for the membership context (PRD: surface what's
 * NEW between renewals; benefits span all content types). It reuses the
 * podcast domain cards (`PodcastCard`, `ContinueListeningCard`,
 * `FeaturedBundleCard`) but composes only the membership-relevant slices:
 *
 *   1. New for members        — just-launched episodes (always open: podcasts
 *                               are the `both`-tier free sample).
 *   2. Continue Listening     — member-only resume queue.
 *   3. Featured Bundles        — "complete the bundle, earn the certificate";
 *                               the strongest membership story. Gated behind
 *                               the "Unlock with Passport" treatment for Lite /
 *                               non-members, consistent with v4/v5.
 *
 * The persistent Now Playing bar lives one level up in `MembershipV5` so it
 * stays mounted across every rail section.
 */
export function MembershipPodcastHub({ access }: { access: MembershipAccess }) {
  const isMember = access === 'full'
  const newEpisodes = RECOMMENDED_PODCASTS.slice(0, 4)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 40, paddingBottom: 32 }}>
      <section aria-labelledby="podcast-new-heading">
        <SecTitle
          eyebrow="Just launched for members"
          title="New podcast episodes"
          blurb="Fresh CE you can earn on the commute — added every week, included in your membership."
          action={
            <>
              <span id="podcast-new-heading" hidden>
                New podcast episodes
              </span>
              <ExploreLink to="/my-learning/podcasts?tab=recommended" label="Browse all podcasts" />
            </>
          }
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '-12px 0 20px' }}>
          <span style={CAPTION}>{newEpisodes.length} new this week</span>
        </div>
        <CardGrid colWidth={265}>
          {newEpisodes.map((p) => (
            <PodcastCard key={p.id} data={p} />
          ))}
        </CardGrid>
      </section>

      {isMember && CONTINUE_LISTENING.length > 0 && (
        <section aria-labelledby="podcast-continue-heading">
          <SecTitle
            eyebrow="Pick up where you left off"
            title="Continue listening"
            blurb="Resume from your last spot — credit progress saves automatically."
            action={
              <>
                <span id="podcast-continue-heading" hidden>
                  Continue listening
                </span>
                <ExploreLink to="/my-learning/podcasts?tab=continue" label="See all in progress" />
              </>
            }
          />
          <CardGrid colWidth={265}>
            {CONTINUE_LISTENING.map((entry) => (
              <ContinueListeningCard key={entry.id} data={entry} />
            ))}
          </CardGrid>
        </section>
      )}

      <section aria-labelledby="podcast-bundles-heading">
        <SecTitle
          eyebrow="Listen your way to renewal"
          title="Featured bundles"
          blurb="Curated audio series — complete the bundle, earn the certificate. A Passport member benefit."
          action={
            <>
              <span id="podcast-bundles-heading" hidden>
                Featured bundles
              </span>
              <ExploreLink to="/my-learning/podcasts?tab=bundles" label="Browse bundles" />
            </>
          }
        />
        {!isMember && (
          <p style={{ ...CAPTION, margin: '-12px 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Podcast size={14} aria-hidden style={{ color: 'var(--color-tertiary-700)' }} />
            Bundles unlock with a Passport membership — preview them below.
          </p>
        )}
        <CardGrid colWidth={420}>
          {FEATURED_BUNDLES.map((b) =>
            isMember ? (
              <FeaturedBundleCard key={b.id} data={b} />
            ) : (
              <GatedCard key={b.id}>
                <FeaturedBundleCard data={b} />
              </GatedCard>
            ),
          )}
        </CardGrid>
      </section>
    </div>
  )
}

function ExploreLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontFamily: 'var(--font-body)',
        fontWeight: 700,
        fontSize: 14,
        color: 'var(--color-accent-text)',
        textDecoration: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
      <ArrowRight size={13} aria-hidden />
    </Link>
  )
}

function CardGrid({ children, colWidth }: { children: ReactNode; colWidth: number }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fill, ${colWidth}px)`,
        gap: 16,
      }}
    >
      {children}
    </div>
  )
}

/** Dims a card and stamps the "Unlock with Passport" chip — the gated
 *  treatment used across v4/v5 for Passport-only benefits when browsing as
 *  Lite / non-member. The inner card is made non-interactive. */
function GatedCard({ children }: { children: ReactNode }) {
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ opacity: 0.55, pointerEvents: 'none', filter: 'saturate(0.85)' }}>{children}</div>
      <div
        style={{
          position: 'absolute',
          left: 12,
          bottom: 12,
          zIndex: 1,
        }}
      >
        <UnlockChip />
      </div>
    </div>
  )
}

const CAPTION: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-text-tertiary)',
}
