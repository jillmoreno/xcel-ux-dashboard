import { useState, type ReactNode } from 'react'
import { useAccount } from '@/context/AccountContext'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { LoFiScope } from '@/context/LoFiContext'
import { DraggableSlot, moveBetween } from '@/components/dashboard/DraggableSlot'
import { DashboardHeroBand } from '@/components/dashboard/DashboardHeroBand'
import {
  LearnerOverviewPanel,
  useV3MainSectionWidgets,
} from '@/components/dashboard/LearnerOverviewPanel'
import { PremiumMembershipRailCardBenefits } from '@/components/dashboard/PremiumMembershipRailCardBenefits'
import { QuickLinksCard } from '@/components/dashboard/QuickLinksCard'
import { RubiTutorWidget } from '@/components/dashboard/RubiTutorWidget'
import { SidebarCard } from '@/components/dashboard/SidebarCard'
import { SIDEBAR_CARDS } from '@/data/dashboardFixtures'

/**
 * Dashboard V3.
 *
 * Started as a fresh clone of V2; first divergence (2026-05-27) is the
 * Courses tile — V3 renders the enlarged multi-segment half-donut
 * gauge (`<CoursesSummaryCardV3>` via `coursesVariant="multi-segment"`)
 * instead of V2's compact single-arc completion gauge.
 *
 * Drag-and-drop demo: when `dashboard-drag-and-drop` is on, every
 * top-level widget on the page becomes draggable AND can be moved
 * across the main / sidebar columns. The flat layout dissolves the
 * usual V3MainSection grid so each inner widget (Jump Back In, Streak
 * Hero, Learning Path, Courses Summary) becomes its own slot. Flag off
 * → original composed layout. Order resets on page refresh (React
 * state, no persistence) per the flag's catalog description.
 */
export function DashboardV3({
  membershipPlacement = 'lead',
  hideRightRail = false,
  consolidatedProgress = false,
}: {
  /** Where the Featured Products / Membership card sits. `'lead'`
   *  (default, V3) keeps it at the top; `'trail'` (V5) moves it below
   *  the Learning Path + Courses (+ Streak) widgets. */
  membershipPlacement?: 'lead' | 'trail'
  /** Drop the right rail entirely and center the remaining single
   *  main column on the page. Also strips the hero's "Saved" chip.
   *  Used by Dashboard MVP. */
  hideRightRail?: boolean
  /** Replace the Learning Path + Courses widgets with the single
   *  consolidated `<ProgressTrackerCard>` (Option E). Used by the MVP. */
  consolidatedProgress?: boolean
} = {}) {
  const { membership } = useAccount()
  const isNonMember = membership === 'non-member'

  const kpiCardFlag = useFeatureFlag('dashboard-kpi-card')
  const heroBandVariant = kpiCardFlag.variant === 'dark' ? 'v2' : 'v3'
  const rubiFlag = useFeatureFlag('rubi-tutor-widget')
  const quickLinksFlag = useFeatureFlag('quick-links-card')
  const premiumFlag = useFeatureFlag('premium-membership-card')
  const whatsNewFlag = useFeatureFlag('whats-new-card')
  const dragEnabled = useFeatureFlag('dashboard-drag-and-drop').enabled
  const railTrayFlag = useFeatureFlag('dashboard-rail-tray')
  const railTrayEnabled = railTrayFlag.enabled
  // Map the tray color variant to a token. Tints are all `-100`-level
  // washes so the white cards keep clear contrast on top.
  const railTrayBg =
    {
      gray: 'var(--color-neutral-100)',
      'deep-gray': 'var(--color-neutral-200)',
      brand: 'var(--color-primary-100)',
      accent: 'var(--color-tertiary-100)',
    }[railTrayFlag.variant ?? 'gray'] ?? 'var(--color-neutral-100)'
  // Pull the V3 inner widgets as a flat id→JSX map so DnD mode can wrap
  // each one in its own DraggableSlot. The hook is always called (React
  // hook order) — when DnD is off we ignore the result and render the
  // composed `<LearnerOverviewPanel>` instead.
  const v3InnerWidgets = useV3MainSectionWidgets()
  // `trail` (V5) moves Featured Products to the END of the DnD widget
  // order so it sits below Jump Back In / Learning Path / Courses /
  // Streak; `lead` (V3) keeps it first.
  const v3InnerOrdered =
    membershipPlacement === 'trail'
      ? (() => {
          const { 'membership-featured': mf, ...rest } = v3InnerWidgets
          return { ...rest, 'membership-featured': mf }
        })()
      : v3InnerWidgets

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
      : // Member version sits in the right rail directly under Rubi
        // — re-eyebrow as "Membership Upgrade" so the affordance reads
        // as an upsell rather than a status badge.
        { ...premiumCard, eyebrow: 'Membership Upgrade' }
    : null

  // ─── Widget registries — flat id → JSX maps for both columns. ─────
  //
  // When DnD is on, the main column flattens the V3MainSection grid
  // (305px JBI | Streak + LP/Courses 2-up) into individual slots so each
  // sub-widget can be moved or dropped on its own. When DnD is off, the
  // main column keeps the composed `<LearnerOverviewPanel>` layout
  // (single block).
  const heroBand = kpiCardFlag.enabled ? (
    <LoFiScope on={kpiCardFlag.variant === 'lo-fi'}>
      <DashboardHeroBand variant={heroBandVariant} hideSavedChip={hideRightRail} />
    </LoFiScope>
  ) : null
  const mainWidgets: Record<string, ReactNode> = dragEnabled
    ? {
        'hero-band': heroBand,
        ...v3InnerOrdered,
      }
    : {
        'hero-band': heroBand,
        'learner-overview': (
          <LearnerOverviewPanel
            showAchievements={false}
            pathsLayout="three-up"
            variant="v3"
            membershipPlacement={membershipPlacement}
            consolidatedProgress={consolidatedProgress}
          />
        ),
      }
  const premiumLoFi = premiumFlag.variant === 'lo-fi'
  const whatsNewLoFi = whatsNewFlag.variant === 'lo-fi'
  const sidebarWidgets: Record<string, ReactNode> = {
    rubi: rubiFlag.enabled ? (
      <LoFiScope on={rubiFlag.variant === 'lo-fi'}>
        <RubiTutorWidget />
      </LoFiScope>
    ) : null,
    // Membership upsell sits directly under Rubi for both audiences:
    // non-members see the benefits-list rail card, members see the
    // standard SidebarCard re-eyebrowed as "Membership Upgrade".
    'premium-non-member':
      isNonMember && premiumForRail && premiumFlag.enabled ? (
        <LoFiScope on={premiumLoFi}>
          <PremiumMembershipRailCardBenefits
            ctaLabel={premiumForRail.ctaLabel}
            ctaHref={premiumForRail.ctaHref}
          />
        </LoFiScope>
      ) : null,
    'premium-member':
      !isNonMember && premiumForRail && premiumFlag.enabled ? (
        <LoFiScope on={premiumLoFi}>
          <SidebarCard data={premiumForRail} />
        </LoFiScope>
      ) : null,
    'quick-links': quickLinksFlag.enabled ? (
      <LoFiScope on={quickLinksFlag.variant === 'lo-fi'}>
        <QuickLinksCard variant="v3" />
      </LoFiScope>
    ) : null,
    ...Object.fromEntries(
      restSidebar.map((card) => [
        `sidebar-card:${card.id}`,
        <LoFiScope on={card.id === 'whats-new' && whatsNewLoFi}>
          <SidebarCard data={card} />
        </LoFiScope>,
      ]),
    ),
  }

  const [mainOrder, setMainOrder] = useState<string[]>(() =>
    Object.keys(mainWidgets),
  )
  const [sidebarOrder, setSidebarOrder] = useState<string[]>(() =>
    Object.keys(sidebarWidgets),
  )

  // Sync order arrays with the latest widget keys — append new entries
  // and prune stale ones (e.g. when the DnD flag flips and the main
  // column swaps between flat / composed widget sets). Existing user
  // ordering is preserved for ids that survive the swap.
  //
  // Validity is checked against the UNION of both registries, not the
  // per-column keys: a widget that the user dragged across columns lives
  // in the *other* column's order while its JSX still comes from its home
  // registry (see `widgetFor`). Pruning per-column would yank it straight
  // back, defeating cross-column moves — so we only prune ids absent from
  // both registries, and only append a brand-new id (present in a
  // registry but not yet placed in either column) to its home column.
  const mainKeys = Object.keys(mainWidgets)
  const sidebarKeys = Object.keys(sidebarWidgets)
  const knownIds = new Set([...mainKeys, ...sidebarKeys])
  const placedIds = new Set([...mainOrder, ...sidebarOrder])
  const nextMain = [
    ...mainOrder.filter((id) => knownIds.has(id)),
    ...mainKeys.filter((id) => !placedIds.has(id)),
  ]
  const nextSidebar = [
    ...sidebarOrder.filter((id) => knownIds.has(id)),
    ...sidebarKeys.filter((id) => !placedIds.has(id)),
  ]
  if (
    nextMain.length !== mainOrder.length ||
    nextMain.some((id, i) => id !== mainOrder[i])
  ) {
    setMainOrder(nextMain)
  }
  if (
    nextSidebar.length !== sidebarOrder.length ||
    nextSidebar.some((id, i) => id !== sidebarOrder[i])
  ) {
    setSidebarOrder(nextSidebar)
  }

  // Unified reorder handler — supports both within-column reorders AND
  // cross-column moves (main ↔ sidebar). `moveBetween` figures out which
  // column each id is in and updates both arrays atomically.
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

  // Look up a widget by id, regardless of which column registry it's in.
  // Lets us render an id from `sidebarOrder` that was just moved into
  // `mainOrder` (and vice versa).
  const widgetFor = (id: string): ReactNode =>
    mainWidgets[id] ?? sidebarWidgets[id] ?? null

  // In DnD mode the main area is a 3-column grid (not a full-width
  // stack) so the compact widgets keep a tile-sized footprint and can be
  // shuffled freely across the three columns instead of every card
  // blowing up to full screen. Only the genuinely wide widgets — the
  // welcome/KPI hero band and the full-bleed Featured Products card —
  // span all three columns. Everything else (Jump Back In, Learning
  // Path, Courses, Streak, or any sidebar card dragged in) takes a
  // single column and flows 3-up. The right rail stays a single column
  // (vertical reorder only).
  const WIDE_MAIN_WIDGETS = new Set(['hero-band', 'membership-featured'])
  // The membership-card-width flag's "two-thirds" applies in DnD mode
  // too: the Featured Products widget spans 2 of the 3 columns (≈⅔)
  // instead of the full width, so the flag isn't silently ignored when
  // drag-and-drop is on.
  const membershipTwoThirds =
    useFeatureFlag('membership-card-width').variant === 'two-thirds'
  const mainSlotStyle = (id: string) => {
    if (id === 'membership-featured' && membershipTwoThirds) {
      return { gridColumn: 'span 2' as const }
    }
    return WIDE_MAIN_WIDGETS.has(id) ? { gridColumn: '1 / -1' as const } : undefined
  }

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
          // MVP hides the rail → a single centered column; otherwise
          // the main column + 320px right rail.
          gridTemplateColumns: hideRightRail
            ? 'minmax(0, 1032px)'
            : 'minmax(0, 1fr) 320px',
          justifyContent: hideRightRail ? 'center' : undefined,
          gap: 40,
          alignItems: 'start',
        }}
      >
        <div
          style={{
            minWidth: 0,
            gap: 24,
            // DnD on → 3-column grid so widgets keep a compact footprint
            // (wide widgets span all columns). DnD off → the original
            // full-width stack of the composed layout.
            ...(dragEnabled
              ? {
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                  alignItems: 'start',
                }
              : { display: 'flex', flexDirection: 'column' }),
          }}
        >
          {mainOrder.map((id) => {
            const node = widgetFor(id)
            if (!node) return null
            return (
              <DraggableSlot
                key={id}
                id={id}
                draggable={dragEnabled}
                onReorder={handleReorder}
                style={mainSlotStyle(id)}
              >
                {node}
              </DraggableSlot>
            )
          })}
        </div>

        {!hideRightRail && (
        <aside
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
            minWidth: 0,
            // Darker-gray tray behind the right-rail cards so it reads
            // as a distinct section from the white-on-page main column.
            // neutral-100 (#ececec) sits a step below the page surface
            // (#f5f5f5) and clearly below the white cards on top of it.
            // Gated by the `dashboard-rail-tray` flag — off drops the
            // tray and sits the cards directly on the page.
            ...(railTrayEnabled
              ? {
                  background: railTrayBg,
                  borderRadius: 'var(--radius-lg)',
                  padding: 28,
                }
              : null),
          }}
        >
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
        )}
      </div>
    </div>
  )
}
