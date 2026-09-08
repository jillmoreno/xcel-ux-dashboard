import { useAccount } from '@/context/AccountContext'
import { RecommendedForYouStrip } from '../v2/RecommendedForYouStrip'
import { MembershipFirstHero } from './MembershipFirstHero'
import { WhatsNewSpine } from './WhatsNewSpine'
import { ContinueRow } from './ContinueRow'
import { BenefitSections } from './BenefitSections'
import { AdditionalBenefitsBand } from './AdditionalBenefitsBand'

/**
 * Membership v4 — "Membership-First — Sections".
 *
 * A discoverability-first reframe of the membership surface, built to the
 * "Dashboard Discoverability: Membership First" PRD and the stakeholder
 * direction (Adia / Robyn): membership is the frame, the page's primary
 * job is surfacing **new** benefits between renewal cycles, progress is
 * secondary, and benefits span every content type — not just CE.
 *
 * Layout (member):
 *   hero (membership-framed, progress demoted to a snapshot link)
 *   → "Just launched for members" spine (NEW tags, all content types)
 *   → "Pick up where you left off" (secondary resume row)
 *   → named benefit rows (Library · CE Podcasts · Exam Prep · Career Tools)
 *   → Recommended for you
 *   → "Explore everything else" band.
 *
 * Non-member / Lite view reuses the same sections with the gated
 * "Unlock with Passport" treatment (tease, don't hide) and a join hero.
 *
 * The member-vs-non-member branch reads `useAccount().membership`, mirroring
 * v1/v2/v3. Brand gating to Elite lives in `MembershipLandingPage`.
 */
export function MembershipV4() {
  const { membership } = useAccount()
  return membership === 'member' ? <MemberView /> : <JoinView />
}

function MemberView() {
  return (
    <div>
      <MembershipFirstHero access="full" />
      <WhatsNewSpine access="full" />
      <ContinueRow />
      <BenefitSections access="full" />
      <RecommendedForYouStrip />
      <AdditionalBenefitsBand />
    </div>
  )
}

function JoinView() {
  return (
    <div>
      <MembershipFirstHero access="lite" />
      <WhatsNewSpine access="lite" />
      <BenefitSections access="lite" />
      <AdditionalBenefitsBand />
    </div>
  )
}
