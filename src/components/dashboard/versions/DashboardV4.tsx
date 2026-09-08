import type { ReactNode } from 'react'
import { useAccount } from '@/context/AccountContext'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { LoFiScope } from '@/context/LoFiContext'
import { DashboardHeroBand } from '@/components/dashboard/DashboardHeroBand'
import { useV3MainSectionWidgets } from '@/components/dashboard/LearnerOverviewPanel'
import { PremiumMembershipRailCardBenefits } from '@/components/dashboard/PremiumMembershipRailCardBenefits'
import { QuickLinksCard } from '@/components/dashboard/QuickLinksCard'
import { RubiTutorWidget } from '@/components/dashboard/RubiTutorWidget'
import { SidebarCard } from '@/components/dashboard/SidebarCard'
import { SIDEBAR_CARDS } from '@/data/dashboardFixtures'

/**
 * Dashboard V4.
 *
 * Diverges from V3 by relocating the welcome/stats hero out of the
 * full-width top slot and into the LEFT column as a vertical widget
 * stacked directly above Jump Back In. The right column keeps the V3
 * Learning Path + Courses row and Streak Hero, and the right rail is
 * unchanged (Rubi / Premium / Quick Links / What's New on the gray tray).
 *
 * The inner widgets are pulled from the shared `useV3MainSectionWidgets`
 * hook so they stay feature-flag-gated exactly like V3 — V4 only changes
 * where the hero sits and how the main columns are composed. (No
 * drag-and-drop reorder in V4; that stays a V3 affordance.)
 */
export function DashboardV4() {
  const { membership } = useAccount()
  const isNonMember = membership === 'non-member'

  const kpiFlag = useFeatureFlag('dashboard-kpi-card')
  const kpiEnabled = kpiFlag.enabled
  const rubiFlag = useFeatureFlag('rubi-tutor-widget')
  const quickLinksFlag = useFeatureFlag('quick-links-card')
  const premiumFlag = useFeatureFlag('premium-membership-card')
  const whatsNewFlag = useFeatureFlag('whats-new-card')
  const railTrayFlag = useFeatureFlag('dashboard-rail-tray')
  const railTrayBg =
    {
      gray: 'var(--color-neutral-100)',
      'deep-gray': 'var(--color-neutral-200)',
      brand: 'var(--color-primary-100)',
      accent: 'var(--color-tertiary-100)',
    }[railTrayFlag.variant ?? 'gray'] ?? 'var(--color-neutral-100)'

  const widgets = useV3MainSectionWidgets()
  const jumpBackIn = widgets['jump-back-in']
  const learningPath = widgets['learning-path']
  const coursesSummary = widgets['courses-summary']
  const streakHero = widgets['streak-hero']
  const membershipFeatured = widgets['membership-featured']

  const showInnerRow = Boolean(learningPath || coursesSummary)
  const innerColumns =
    learningPath && coursesSummary
      ? 'repeat(2, minmax(0, 1fr))'
      : 'minmax(0, 1fr)'

  // ─── Right rail — same composition as V3. ──────────────────────────
  const premiumCard = SIDEBAR_CARDS.find((c) => c.id === 'premium-membership')
  const restSidebar = SIDEBAR_CARDS.filter(
    (c) =>
      c.id !== 'rubi-tutor' &&
      c.id !== 'premium-membership' &&
      !(c.id === 'whats-new' && !whatsNewFlag.enabled) &&
      !(c.hideForMember && membership === 'member'),
  )
  const premiumForRail = premiumCard
    ? isNonMember
      ? {
          ...premiumCard,
          body: 'Join Pro for unlimited CE, premium support, and member-only savings — built for learners like you.',
          ctaLabel: 'Become a Member',
        }
      : { ...premiumCard, eyebrow: 'Membership Upgrade' }
    : null

  const premiumLoFi = premiumFlag.variant === 'lo-fi'
  const whatsNewLoFi = whatsNewFlag.variant === 'lo-fi'
  const railWidgets: ReactNode[] = [
    rubiFlag.enabled ? (
      <LoFiScope key="rubi" on={rubiFlag.variant === 'lo-fi'}>
        <RubiTutorWidget />
      </LoFiScope>
    ) : null,
    isNonMember && premiumForRail && premiumFlag.enabled ? (
      <LoFiScope key="premium-non-member" on={premiumLoFi}>
        <PremiumMembershipRailCardBenefits
          ctaLabel={premiumForRail.ctaLabel}
          ctaHref={premiumForRail.ctaHref}
        />
      </LoFiScope>
    ) : null,
    !isNonMember && premiumForRail && premiumFlag.enabled ? (
      <LoFiScope key="premium-member" on={premiumLoFi}>
        <SidebarCard data={premiumForRail} />
      </LoFiScope>
    ) : null,
    quickLinksFlag.enabled ? (
      <LoFiScope key="quick-links" on={quickLinksFlag.variant === 'lo-fi'}>
        <QuickLinksCard variant="v3" />
      </LoFiScope>
    ) : null,
    ...restSidebar.map((card) => (
      <LoFiScope
        key={`sidebar-card:${card.id}`}
        on={card.id === 'whats-new' && whatsNewLoFi}
      >
        <SidebarCard data={card} />
      </LoFiScope>
    )),
  ].filter(Boolean)

  return (
    <div
      className="mx-auto"
      style={{ maxWidth: 1440, padding: '24px 24px 64px', width: '100%' }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 320px',
          gap: 40,
          alignItems: 'start',
        }}
      >
        {/* Main area: left column (vertical hero + Jump Back In) and a
            right column (Learning Path + Courses, then Streak). */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '305px minmax(0, 1fr)',
            gap: 24,
            alignItems: 'start',
            minWidth: 0,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>
            {kpiEnabled && (
              <LoFiScope on={kpiFlag.variant === 'lo-fi'}>
                <DashboardHeroBand
                  variant={kpiFlag.variant === 'dark' ? 'v2' : 'v3'}
                  vertical
                />
              </LoFiScope>
            )}
            {jumpBackIn}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>
            {membershipFeatured}
            {showInnerRow && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: innerColumns,
                  gap: 24,
                  alignItems: 'stretch',
                }}
              >
                {learningPath}
                {coursesSummary}
              </div>
            )}
            {streakHero}
          </div>
        </div>

        <aside
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
            minWidth: 0,
            ...(railTrayFlag.enabled
              ? {
                  background: railTrayBg,
                  borderRadius: 'var(--radius-lg)',
                  padding: 28,
                }
              : null),
          }}
        >
          {railWidgets}
        </aside>
      </div>
    </div>
  )
}
