import { useState, type ReactNode } from 'react'
import { useAccount } from '@/context/AccountContext'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { DraggableSlot, moveBetween } from '@/components/dashboard/DraggableSlot'
import { DashboardHeroBand } from '@/components/dashboard/DashboardHeroBand'
import { LearnerOverviewPanel } from '@/components/dashboard/LearnerOverviewPanel'
import { QuickLinksCard } from '@/components/dashboard/QuickLinksCard'
import { RubiTutorWidget } from '@/components/dashboard/RubiTutorWidget'
import { SidebarCard } from '@/components/dashboard/SidebarCard'
import { SIDEBAR_CARDS } from '@/data/dashboardFixtures'

/**
 * Dashboard V2 differences from V1:
 *   - Tabbed `<ContinueLearningTabs>` strip removed entirely (Learner
 *     Overview / Continue Listening / Jump Back In / Recommended for
 *     You / Member Benefits). V2 renders the Learner Overview panel
 *     directly — the streak hero + the 3-up tile row (Jump Back In ·
 *     Learning Paths · Courses) carry the same job-to-be-done at a
 *     glance, so the secondary tabs become noise on this surface. V1
 *     keeps the tab strip and all of its content unchanged.
 *   - Achievements widget hidden from the Learner Overview panel.
 *   - Learning Path card collapses to 1/3 width and shares a row with
 *     a Courses summary card and the Jump Back In card
 *     (`pathsLayout="three-up"`).
 *   - The Rubi Tutor sidebar tile renders as `<RubiTutorWidget>` — a
 *     conversational AI surface with an "Ask Rubi" input + suggested
 *     prompts — instead of the generic CTA `<SidebarCard>`. Quick Links
 *     sits below it as its own sidebar tile.
 */
export function DashboardV2() {
  const { membership } = useAccount()
  const isNonMember = membership === 'non-member'
  const dragEnabled = useFeatureFlag('dashboard-drag-and-drop').enabled

  // Drop the Rubi Tutor entry from the generic sidebar list — V2
  // renders it as the dedicated `<RubiTutorWidget>` above the rest of
  // the rail instead. Premium Membership is also pulled out so we can
  // render it at the top of the rail (non-member) vs at the bottom
  // (member, alongside What's New).
  const premiumCard = SIDEBAR_CARDS.find((c) => c.id === 'premium-membership')
  const restSidebar = SIDEBAR_CARDS.filter(
    (c) =>
      c.id !== 'rubi-tutor' &&
      c.id !== 'premium-membership' &&
      !(c.hideForMember && membership === 'member'),
  )

  // Non-member CTA flips from the matter-of-fact "Upgrade to Premium"
  // (a member-tier promotion) to the more invitational "Become a
  // Member" framing, since the learner hasn't joined yet. Body copy
  // shifts to match — the upgrade story is "you're already in, level
  // up", the join story is "here's what you get when you sign up".
  const premiumForRail = premiumCard
    ? isNonMember
      ? {
          ...premiumCard,
          body: 'Join Pro for unlimited CE, premium support, and member-only savings — built for learners like you.',
          ctaLabel: 'Become a Member',
        }
      : premiumCard
    : null

  // Widget registries — id → JSX. Order arrays below drive what shows on
  // screen and in what slot. When the drag-and-drop flag is on, each slot
  // becomes draggable via `<DraggableSlot>` and the user can reorder
  // within a column.
  const mainWidgets: Record<string, ReactNode> = {
    'hero-band': <DashboardHeroBand />,
    'learner-overview': (
      <LearnerOverviewPanel showAchievements={false} pathsLayout="three-up" />
    ),
  }
  const sidebarWidgets: Record<string, ReactNode> = {
    'premium-non-member':
      isNonMember && premiumForRail ? <SidebarCard data={premiumForRail} /> : null,
    rubi: <RubiTutorWidget />,
    'quick-links': <QuickLinksCard />,
    ...Object.fromEntries(
      restSidebar.map((card) => [
        `sidebar-card:${card.id}`,
        <SidebarCard data={card} />,
      ]),
    ),
    'premium-member':
      !isNonMember && premiumForRail ? <SidebarCard data={premiumForRail} /> : null,
  }

  const [mainOrder, setMainOrder] = useState<string[]>(() =>
    Object.keys(mainWidgets),
  )
  const [sidebarOrder, setSidebarOrder] = useState<string[]>(() =>
    Object.keys(sidebarWidgets),
  )

  // Sync order arrays with the latest widget keys.
  const mainKeys = Object.keys(mainWidgets)
  const sidebarKeys = Object.keys(sidebarWidgets)
  if (
    mainOrder.some((id) => !mainKeys.includes(id)) ||
    mainKeys.some((id) => !mainOrder.includes(id))
  ) {
    const next = [
      ...mainOrder.filter((id) => mainKeys.includes(id)),
      ...mainKeys.filter((id) => !mainOrder.includes(id)),
    ]
    if (next.length !== mainOrder.length || next.some((id, i) => id !== mainOrder[i])) {
      setMainOrder(next)
    }
  }
  if (
    sidebarOrder.some((id) => !sidebarKeys.includes(id)) ||
    sidebarKeys.some((id) => !sidebarOrder.includes(id))
  ) {
    const next = [
      ...sidebarOrder.filter((id) => sidebarKeys.includes(id)),
      ...sidebarKeys.filter((id) => !sidebarOrder.includes(id)),
    ]
    if (next.length !== sidebarOrder.length || next.some((id, i) => id !== sidebarOrder[i])) {
      setSidebarOrder(next)
    }
  }

  // Unified handler — supports both within-column reorders AND
  // cross-column moves (main ↔ sidebar).
  const handleReorder = (draggedId: string, targetId: string) => {
    const [nextMain, nextSidebar] = moveBetween(
      mainOrder,
      sidebarOrder,
      draggedId,
      targetId,
    )
    if (nextMain !== mainOrder) setMainOrder(nextMain)
    if (nextSidebar !== sidebarOrder) setSidebarOrder(nextSidebar)
  }
  const widgetFor = (id: string): ReactNode =>
    mainWidgets[id] ?? sidebarWidgets[id] ?? null

  return (
    <div
      className="mx-auto"
      style={{
        maxWidth: 1440,
        padding: '24px 24px 64px',
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 320px',
          gap: 40,
          alignItems: 'start',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>
          {mainOrder.map((id) => {
            const node = widgetFor(id)
            if (!node) return null
            return (
              <DraggableSlot
                key={id}
                id={id}
                draggable={dragEnabled}
                onReorder={handleReorder}
              >
                {node}
              </DraggableSlot>
            )
          })}
        </div>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: 32, minWidth: 0 }}>
          {sidebarOrder.map((id) => {
            const node = widgetFor(id)
            if (!node) return null
            return (
              <DraggableSlot
                key={id}
                id={id}
                draggable={dragEnabled}
                onReorder={handleReorder}
              >
                {node}
              </DraggableSlot>
            )
          })}
        </aside>
      </div>
    </div>
  )
}
