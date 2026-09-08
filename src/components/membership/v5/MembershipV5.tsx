import { useState, type ReactNode } from 'react'
import { useAccount } from '@/context/AccountContext'
import { NowPlayingBar, type NowPlayingData } from '@/components/courses/NowPlayingBar'
import { MembershipFirstHero } from '../v4/MembershipFirstHero'
import { WhatsNewSpine } from '../v4/WhatsNewSpine'
import { ContinueRow } from '../v4/ContinueRow'
import { BenefitSections } from '../v4/BenefitSections'
import { AdditionalBenefitsBand } from '../v4/AdditionalBenefitsBand'
import { RecommendedForYouStrip } from '../v2/RecommendedForYouStrip'
import { MembershipSideNav } from './MembershipSideNav'
import { MembershipPodcastHub } from './MembershipPodcastHub'
import { MembershipOverview } from './MembershipOverview'

/**
 * Membership v5 — "Membership-First — Sections + Side Nav".
 *
 * Same discoverability-first content as v4, but with a persistent
 * **secondary** left side-nav rail (the "Featured" direction). The rail is
 * deliberately subordinate to the global top nav: it only fast-jumps to
 * membership sections that have no top-nav home (New for members, Learning
 * Library, Exam & Cert Prep, AI Career Tools, Partner Offers & More).
 * Courses, certificates, paths and podcasts stay owned by the top nav.
 *
 * The hero stays full-bleed; everything below sits in a two-column region —
 * the side nav + content column. The rail is a **filter**: clicking an
 * item swaps the content column to show ONLY that section (rather than
 * scroll-jumping through a long stack). Member / non-member branch reads
 * `useAccount().membership`; brand gating to Elite lives in
 * `MembershipLandingPage`.
 */
export function MembershipV5() {
  const { membership } = useAccount()
  const isMember = membership === 'member'
  const access = isMember ? 'full' : 'lite'
  // Members land on the "Your Membership" overview (mini dashboard);
  // non-members (no overview tab) land on "New for members".
  const [active, setActive] = useState<string>(isMember ? 'overview' : 'whats-new')
  // Mini-player play/pause state. The Now Playing bar only renders on the
  // CE Podcasts section (see below), so the bar comes and goes with that
  // section; the state is kept here so it survives section swaps.
  const [isPlaying, setIsPlaying] = useState(false)

  return (
    <div>
      <MembershipFirstHero access={access} />
      <TwoColumn active={active} onSelect={setActive} includeOverview={isMember}>
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
        <SectionContent active={active} isMember={isMember} />
      </TwoColumn>
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

/**
 * Renders only the content for the selected rail section. Orphan content
 * (Continue / Recommended for members, the CE Podcasts row) is folded
 * into the nearest section so nothing is unreachable:
 *   - whats-new       → What's New spine (+ member: Continue + Recommended)
 *   - learning-library → Resource Library + CE Podcasts rows
 *   - podcasts        → Membership podcast hub (new + continue + bundles)
 *   - exam-prep       → Exam & Cert Prep row
 *   - career-tools    → AI Career Tools row
 *   - more            → Partner Offers & More band
 */
function SectionContent({ active, isMember }: { active: string; isMember: boolean }) {
  const access = isMember ? 'full' : 'lite'
  switch (active) {
    case 'overview':
      return <MembershipOverview />
    case 'learning-library':
      return <BenefitSections access={access} only={['learning-library', 'podcasts']} />
    case 'podcasts':
      return <MembershipPodcastHub access={access} />
    case 'exam-prep':
      return <BenefitSections access={access} only={['exam-prep']} />
    case 'career-tools':
      return <BenefitSections access={access} only={['career-tools']} />
    case 'more':
      return <AdditionalBenefitsBand />
    case 'whats-new':
    default:
      return (
        <>
          <WhatsNewSpine access={access} />
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

/** Centered max-width region: sticky secondary side nav + main content. */
function TwoColumn({
  active,
  onSelect,
  includeOverview,
  children,
}: {
  active: string
  onSelect: (id: string) => void
  includeOverview: boolean
  children: ReactNode
}) {
  return (
    <div
      style={{
        maxWidth: 1440,
        margin: '0 auto',
        padding: '24px 24px 0',
        display: 'flex',
        gap: 28,
        alignItems: 'flex-start',
      }}
    >
      <MembershipSideNav active={active} onSelect={onSelect} includeOverview={includeOverview} />
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  )
}
