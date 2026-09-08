import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAccount } from '@/context/AccountContext'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { Avatar } from '@/components/ui/Avatar'
import { MembershipBadge } from '@/components/ui/MembershipBadge'
import { NowPlayingBar, type NowPlayingData } from '@/components/courses/NowPlayingBar'
import { WhatsNewSpine } from '../v4/WhatsNewSpine'
import { ContinueRow } from '../v4/ContinueRow'
import { BenefitSections } from '../v4/BenefitSections'
import { PartnerOfferingsPanel } from '../PartnerOfferingsPanel'
import { RecommendedForYouStrip } from '../v2/RecommendedForYouStrip'
import { MembershipSideNav } from '../v5/MembershipSideNav'
import { MembershipPodcastHub } from '../v5/MembershipPodcastHub'
import { MembershipOverview, MembershipUpgradeCard } from '../v5/MembershipOverview'

/**
 * Membership v7 — "Membership-First — Dark rail + KPI dashboard".
 *
 * A clone of v5 (filtered side-nav + sectioned content) with three
 * changes:
 *   - **No hero.** The page opens straight into the two-column region.
 *   - **Dark left nav strip** (`tone="dark"`, primary-800) whose top
 *     carries a user profile header (avatar · email · membership badge),
 *     mirroring the account dropdown.
 *   - The "Your Membership" overview leads with a **small KPI section**
 *     (`leadingKpis`) since there's no hero to carry the KPIs.
 *
 * Member / non-member branch reads `useAccount().membership`; Elite gating
 * lives in `MembershipLandingPage`.
 */
export function MembershipV7() {
  const { membership } = useAccount()
  const isMember = membership === 'member'
  const bleed = useFeatureFlag('membership-v7-bleed-rail').enabled
  // Seed the initial section from `?section=` when valid (the platform
  // left-nav rail deep-links here), else today's default. The param only
  // seeds mount state — in-page selection stays local from then on.
  const [params] = useSearchParams()
  const requestedSection = params.get('section')
  const validSections = isMember
    ? ['overview', 'whats-new', 'learning-library', 'podcasts', 'exam-prep', 'career-tools', 'more']
    : ['whats-new', 'learning-library', 'podcasts', 'exam-prep', 'career-tools', 'more']
  const [active, setActive] = useState<string>(
    requestedSection && validSections.includes(requestedSection)
      ? requestedSection
      : isMember
        ? 'overview'
        : 'whats-new',
  )
  const [isPlaying, setIsPlaying] = useState(false)

  return (
    <div
      style={
        bleed
          ? {
              display: 'flex',
              alignItems: 'stretch',
              gap: 0,
              minHeight: 'calc(100vh - 64px)',
            }
          : {
              maxWidth: 1440,
              margin: '0 auto',
              padding: '24px 24px 0',
              display: 'flex',
              gap: 28,
              alignItems: 'flex-start',
            }
      }
    >
      <div
        style={
          bleed
            ? {
                width: 264,
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                background: 'var(--color-primary-800)',
                padding: '24px 20px 40px',
              }
            : { width: 232, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }
        }
      >
        <MembershipSideNav
          active={active}
          onSelect={setActive}
          includeOverview={isMember}
          tone="dark"
          showCaption={false}
          bleed={bleed}
          header={<NavProfileHeader isMember={isMember} />}
        />
        {isMember && <MembershipUpgradeCard />}
      </div>
      <div style={{ flex: 1, minWidth: 0, padding: bleed ? '24px 24px 0' : undefined }}>
        {isMember && active === 'podcasts' && (
          <div style={{ marginBottom: 24 }}>
            <NowPlayingBar
              data={DEMO_NOW_PLAYING}
              elapsedSec={1394}
              isPlaying={isPlaying}
              onPlayPause={() => setIsPlaying((p) => !p)}
              eyebrow="NOW PLAYING · INCLUDED WITH MEMBERSHIP"
            />
          </div>
        )}
        <SectionContent active={active} isMember={isMember} bleed={bleed} />
      </div>
    </div>
  )
}

/** Dark-rail profile header — avatar, name, email, membership badge.
 *  Mirrors the account-dropdown header, restyled for the primary-800 rail. */
function NavProfileHeader({ isMember }: { isMember: boolean }) {
  const { user } = useAccount()
  const name = `${user.firstName} ${user.lastName}`
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 10,
        padding: '8px 8px 30px',
        marginBottom: 30,
        borderBottom: '1px solid rgb(255 255 255 / 0.14)',
      }}
    >
      {/* Avatar top-left + greeting to its right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Avatar size={48} initials={user.initials} imageUrl={user.avatarUrl} alt={name} ring pro={isMember} />
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            fontSize: 15,
            lineHeight: '20px',
            color: 'var(--color-text-inverse)',
          }}
        >
          Welcome Back, Danielle
        </p>
      </div>
      {/* Quote from the dashboard hero (the user's motto) */}
      {user.motto && (
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-body)',
            fontStyle: 'italic',
            fontSize: 13,
            lineHeight: 1.5,
            color: 'rgb(255 255 255 / 0.7)',
          }}
        >
          “{user.motto}”
        </p>
      )}
      {isMember && (
        <span>
          <MembershipBadge tier="pro" label="Passport Membership" />
        </span>
      )}
    </div>
  )
}

/** Demo "now playing" episode for the persistent member mini-player. */
const DEMO_NOW_PLAYING: NowPlayingData = {
  episodeTitle: "Dual Agency: When Disclosure Isn't Enough",
  podcastTitle: 'The Ethics Hour',
  episodeNumber: 42,
  host: 'Maria Castillo, ABR',
  badge: 'Mandatory',
  creditHours: 1.0,
  creditStates: ['NC', 'AL', 'VA', 'SC'],
  totalSec: 3690,
  checkpointSec: 2200,
}

/** Same section filter as v5; the overview leads with the KPI section.
 *  Exported so the platform left-nav shell can render the same membership
 *  sections in-place (the rail's Membership group reuses these). */
export function SectionContent({
  active,
  isMember,
  bleed = false,
  embedded = false,
  dashboardLayout = 'default',
  onOpenLearningPath,
}: {
  active: string
  isMember: boolean
  bleed?: boolean
  /** Switch the shell to the Learning Path section in place, drilled into the
   *  given path's detail (threaded to the overview's Marketing Focused Current
   *  Learning Path card). */
  onOpenLearningPath?: (pathId: string) => void
  /** Rendered inside the Dashboard Rebrand shell, which owns the section
   *  title — suppress the overview's own "Your Learning" eyebrow. */
  embedded?: boolean
  /** Overview layout variant (the Dashboard Discoverability "Dashboard Version"
   *  picker): `default` row layout, `stacked` full-width vertical cards,
   *  `vibrant` (stacked + the image-forward What's New carousel),
   *  `learner-focused` (stacked + the joined CLP/Jump Back In top-section card),
   *  or `marketing-focused` (stacked + the joined CLP / What's New marketing
   *  carousel top-section card). */
  dashboardLayout?: 'default' | 'learner-focused' | 'marketing-focused' | 'badged'
}) {
  // Content-gating access resolves from the account TIER, not just membership:
  // the highest member tier (Passport) ⇒ `full` (nothing gated); a lower member
  // tier (Passport Lite) ⇒ `lite` (Passport-only content gated). Non-members
  // keep the `lite` marketing treatment (they're additionally non-member-locked
  // upstream in the shell). `isMember` still drives the member/non-member branches.
  const { access: acctAccess } = useAccount()
  const access = acctAccess === 'full' ? 'full' : 'lite'
  switch (active) {
    case 'overview':
      return (
        <MembershipOverview
          leadingKpis
          bleedBand={bleed}
          hideEyebrow={embedded}
          hideMarketing={embedded}
          showExtras={embedded}
          dashboardLayout={dashboardLayout}
          onOpenLearningPath={onOpenLearningPath}
        />
      )
    case 'learning-library':
      return <BenefitSections access={access} only={['learning-library', 'podcasts']} />
    case 'podcasts':
      return <MembershipPodcastHub access={access} />
    case 'exam-prep':
      // Rebrand shell (embedded) gets the catalog-style tile cards (matching
      // the AI Career Tools cards); the standalone V7 page keeps row cards.
      return (
        <BenefitSections
          access={access}
          only={['exam-prep']}
          hideHeading={embedded}
          cardStyle={embedded ? 'tile' : 'row'}
        />
      )
    case 'career-tools':
      // Rebrand shell (embedded) gets the richer cover-media launch cards;
      // the standalone V7 page keeps the compact row cards.
      return (
        <BenefitSections
          access={access}
          only={['career-tools']}
          hideHeading={embedded}
          cardStyle={embedded ? 'launch' : 'row'}
        />
      )
    case 'more':
      // VIP Partner Offering cards (NatMed / Prescriber Insights / Boojee)
      // replace the old icon-row band. The panel omits its own title — the
      // surrounding surface (rebrand hero / V7 section) provides it.
      return <PartnerOfferingsPanel />
    case 'whats-new':
    default:
      return (
        <>
          <WhatsNewSpine access={access} hideTitle={embedded} />
          {isMember && (
            <>
              <ContinueRow />
              <RecommendedForYouStrip />
            </>
          )}
        </>
      )
  }
}
