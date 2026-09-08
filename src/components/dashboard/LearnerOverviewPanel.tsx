import { useEffect, useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { AchievementsWidget } from '@/components/dashboard/AchievementsWidget'
import { CoursesSummaryCard } from '@/components/dashboard/CoursesSummaryCard'
import { CoursesSummaryCardV3 } from '@/components/dashboard/CoursesSummaryCardV3'
import {
  JumpBackInCard,
  jbiLayoutFromVariant,
  type JumpBackInLayout,
} from '@/components/dashboard/JumpBackInCard'
import { Card } from '@/components/ui/Card'
import { LearningPathCard } from '@/components/courses/LearningPathCard'
import { ProgressTrackerCard } from '@/components/learning/ProgressTrackerCard'
import { LearningPathDetailPanel } from '@/components/learning/LearningPathDetailPanel'
import { useLearningPathsPanel } from '@/components/learning/LearningPathsPanelContext'
import { useAccount, type Brand } from '@/context/AccountContext'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { LoFiScope, useLoFi } from '@/context/LoFiContext'
import { LoFiBar, LoFiWidgetBody } from '@/components/lo-fi/LoFiPlaceholders'
import { CourseSheet } from '@/components/courses/CourseSheet'
import type { IndividualCourse } from '@/data/catalog/types'
import {
  BookOpen,
  ChevronRight,
  FileText,
  Gem,
  GraduationCap,
  Layout,
  PizzaSlice,
  Podcast,
  ShoePrints,
  StarSolid,
  Video,
} from '@/icons'
import {
  activePathIdFor,
  learningPathsFor,
  type LearningPathCardData,
  type LearningPathStatus,
} from '@/data/learningFixtures'
import { useLearningPathCardsForBrand } from '@/data/learningPathsCountVariant'
import {
  intensityLevelForMinutes,
  learningStreakFor,
  streakThisWeekFor,
  type IntensityLevel,
  type StreakActivity,
} from '@/data/learnerOverviewFixtures'

/**
 * Learner Overview tab — the dashboard's momentum / engagement view.
 *
 * Three stacked sections:
 *   1. Streak hero (aggregated current streak + 14-day activity strip)
 *   2. Your Learning Paths & Licenses (1 license + up to 4 active paths)
 *   3. Milestones earned (6 earned + 2 locked for aspirational lift)
 *
 * The streak is intentionally a single number per learner — it's about the
 * person, not each path. Don't add per-path streak counters here.
 */
type LearnerOverviewPanelProps = {
  showAchievements?: boolean
  /**
   * Controls the Learning Paths section layout.
   *   - `'wide'` (default, V1): single full-width LP card stacked under the
   *     section heading + View All link.
   *   - `'three-up'` (V2): the LP card shrinks to 1/3 width and shares the
   *     row with `<CoursesSummaryCard>` and `<QuickLinksCard>`. The section
   *     heading still reflects the LP count and links into the slide-over
   *     picker — only the cards underneath change.
   */
  pathsLayout?: 'wide' | 'three-up'
  /**
   * Which dashboard-version-specific widget set to render in the
   * three-up row. Default `'v2'` keeps V1/V2 behavior (compact LP card
   * with all 6 stat rows + 88px ring; `CoursesSummaryCard` semicircular
   * completion gauge). `'v3'` swaps in V3-only treatments: the
   * `'compact-v3'` LP card variant (110px ring, dropped Enrolled +
   * Last Activity rows) and `CoursesSummaryCardV3` (enlarged
   * multi-segment half-donut gauge).
   */
  variant?: 'v2' | 'v3'
  /**
   * Where the Featured Products / Membership card sits relative to the
   * V3 main section (V3 only).
   *   - `'lead'` (default, V3): full-width card above the JBI row, or —
   *     in two-thirds width — at the top of the right column above
   *     Learning Path + Courses.
   *   - `'trail'` (V5): the card moves to the END — full-width below all
   *     three widgets, or at the bottom of the right column (below
   *     Learning Path + Courses + Streak) in two-thirds width.
   */
  membershipPlacement?: 'lead' | 'trail'
  /**
   * V3 only — replace the Learning Path + Courses summary widgets in the
   * right column with the single consolidated `<ProgressTrackerCard>`
   * (Option E). Used by the MVP dashboard.
   */
  consolidatedProgress?: boolean
}

export function LearnerOverviewPanel({
  showAchievements = true,
  pathsLayout = 'wide',
  variant = 'v2',
  membershipPlacement = 'lead',
  consolidatedProgress = false,
}: LearnerOverviewPanelProps = {}) {
  // V3 uses a consistent 24px gap for every adjacent widget pair —
  // welcome band ↔ membership ↔ jump-back-in row ↔ streak ↔ LP/Courses.
  // V1/V2 also use 24, but kept separate so future variants can diverge.
  const sectionGap = 24
  const membershipFlag = useFeatureFlag('membership-card-width')
  // `two-thirds` only takes effect on the V3 layout — that's the only
  // variant with a right column the card can sit inside. On non-V3
  // layouts the card always renders above the row (current behavior).
  const membershipInRightColumn =
    variant === 'v3' && membershipFlag.variant === 'two-thirds'
  // Full-width Featured Products card (non-two-thirds). `lead` renders
  // it above the main section, `trail` below it.
  const fullWidthMembership = !membershipInRightColumn ? (
    <MembershipPlaceholderCard />
  ) : null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: sectionGap }}>
      {membershipPlacement === 'lead' && fullWidthMembership}
      {variant === 'v3' ? (
        // V3 collapses Streak + 3-up row into a 2-column grid:
        //   - Left column (1fr): Jump Back In, tall (full row height).
        //   - Right column (2fr): Streak Hero on top, then a 2-up
        //     row of Learning Paths + Courses underneath.
        // Jump Back In stretches vertically to fill whatever height the
        // right column ends up at.
        <V3MainSection
          showMembershipInRightColumn={membershipInRightColumn}
          membershipPlacement={membershipPlacement}
          consolidatedProgress={consolidatedProgress}
        />
      ) : (
        <>
          <StreakHeroCard />
          <PathsAndLicensesSection layout={pathsLayout} variant={variant} />
        </>
      )}
      {membershipPlacement === 'trail' && fullWidthMembership}
      {showAchievements && <AchievementsWidget />}
    </div>
  )
}

/**
 * Resolve which of the two mutually-exclusive Jump Back In versions is
 * active — the standard `jump-back-in-card` or the
 * `jump-back-in-card-links` (quick-links) version — and derive the
 * layout + lo-fi state from whichever is enabled. The flags' `mutexGroup`
 * keeps only one on at a time; if both are somehow enabled, the
 * quick-links version wins.
 */
function useJumpBackInVersion(): {
  showJBI: boolean
  jbiLayout: JumpBackInLayout
  jbiLoFi: boolean
  jbiLinksCardSize: 'normal' | 'medium' | 'small'
} {
  const standard = useFeatureFlag('jump-back-in-card')
  const links = useFeatureFlag('jump-back-in-card-links')
  const active = links.enabled ? links : standard
  return {
    showJBI: standard.enabled || links.enabled,
    jbiLayout: jbiLayoutFromVariant(active.variant),
    jbiLoFi: active.variant === 'lo-fi',
    // Secondary variant on the quick-links flag — sizes the in-progress
    // card (full compact card vs. a roomy row vs. a small row).
    jbiLinksCardSize:
      links.secondaryVariant === 'small'
        ? 'small'
        : links.secondaryVariant === 'medium'
          ? 'medium'
          : 'normal',
  }
}

/* ─── V3 main section — Jump Back In | (Streak / Paths + Courses) ── */

function V3MainSection({
  showMembershipInRightColumn = false,
  membershipPlacement = 'lead',
  consolidatedProgress = false,
}: {
  showMembershipInRightColumn?: boolean
  membershipPlacement?: 'lead' | 'trail'
  consolidatedProgress?: boolean
} = {}) {
  const { brand } = useAccount()
  const { openPanel } = useLearningPathsPanel()
  const items = useLearningPathCardsForBrand()
  const topPath = sortAndLimitPaths(items, 1)[0]
  // Consolidated progress card needs a full LearningPathSummary (with the
  // mandatory / elective breakdown), which the dashboard's card fixtures
  // don't carry — pull the brand's active path summary the same way
  // LearningPathPage does.
  const progressSummaries = learningPathsFor(brand)
  const progressPath =
    progressSummaries.find((p) => p.id === activePathIdFor(brand)) ??
    progressSummaries[0]
  // Current Learning Path detail panel, opened from the consolidated tracker
  // card's "View full breakdown & requirements →" footer link.
  const [detailOpen, setDetailOpen] = useState(false)

  // Each of the four V3 main-section widgets is independently
  // feature-flagged so reviewers can toggle them on / off in the panel
  // surfaced from AccountMenu → UI/UX Demo Tools → Feature Flag. The
  // grid layout adapts to the visible set:
  //   - JBI off    → outer grid collapses to a single column (right
  //     column fills the row).
  //   - All right-column widgets off → outer grid is single column
  //     with just JBI.
  //   - LP off, Courses on (or vice versa) → inner LP/Courses grid
  //     becomes a single column so the surviving card spans the row.
  //   - Both LP + Courses off → inner row hides entirely.
  //   - Streak off → just drops out of the right-column flex stack.
  const { showJBI, jbiLayout, jbiLoFi, jbiLinksCardSize } =
    useJumpBackInVersion()
  const streakFlag = useFeatureFlag('streak-hero-card')
  const showStreak = streakFlag.enabled
  const lpFlag = useFeatureFlag('learning-path-card')
  const showLP = lpFlag.enabled
  const coursesFlag = useFeatureFlag('courses-summary-card')
  const showCourses = coursesFlag.enabled
  const showInnerRow = showLP || showCourses
  const showRightColumn =
    showStreak || showInnerRow || showMembershipInRightColumn || consolidatedProgress

  // Nothing left to render — the whole section disappears and the
  // outer LearnerOverviewPanel's flex `gap: 24` collapses the empty
  // slot cleanly.
  if (!showJBI && !showRightColumn) return null

  // Outer grid layout — JBI column is pinned to a fixed 305px so the
  // tile (and the canonical 265px course card inside) never responds
  // to viewport changes; the right column absorbs all remaining
  // width. Collapses to a single column when only one side is
  // visible. 305 = 265 (CourseCard min-width, see
  // src/components/courses/CourseCard.tsx) + 40 (JBI section L/R
  // padding).
  const outerColumns =
    showJBI && showRightColumn
      ? '305px minmax(0, 1fr)'
      : 'minmax(0, 1fr)'

  // Inner LP / Courses grid — single column when only one of the two
  // is visible so the surviving card stretches across the row.
  const innerColumns =
    showLP && showCourses
      ? 'repeat(2, minmax(0, 1fr))'
      : 'minmax(0, 1fr)'

  return (
    <div
      style={{
        display: 'grid',
        // 24px gap matches the outer LearnerOverviewPanel section gap
        // so every adjacent widget pair across V3 sits on the same
        // rhythm.
        gridTemplateColumns: outerColumns,
        gap: 24,
        alignItems: 'stretch',
      }}
    >
      {showJBI && (
        <LoFiScope on={jbiLoFi}>
          <JumpBackInCard
            variant="v3"
            v3Layout={jbiLayout}
            linksCardSize={jbiLinksCardSize}
          />
        </LoFiScope>
      )}
      {showRightColumn && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
            minWidth: 0,
          }}
        >
          {/* Two-thirds mode: the Featured Products / Membership card sits
              at the TOP of the right column (lead) — above Learning Path +
              Courses — or at the BOTTOM (trail, used by V5). */}
          {showMembershipInRightColumn && membershipPlacement === 'lead' && (
            <MembershipPlaceholderCard />
          )}
          {consolidatedProgress ? (
            // MVP — the Learning Path + Courses widgets collapse into a
            // single consolidated ProgressTrackerCard (Option E).
            <>
              <ProgressTrackerCard
                path={progressPath}
                showViewAll={items.length > 1}
                pathsCount={items.length}
                onViewAll={openPanel}
                onViewDetails={() => setDetailOpen(true)}
              />
              <LearningPathDetailPanel
                open={detailOpen}
                onClose={() => setDetailOpen(false)}
                path={progressPath}
              />
            </>
          ) : (
            showInnerRow && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: innerColumns,
                  gap: 24,
                  alignItems: 'stretch',
                  // Intentionally NOT `flex: 1` — the right column's
                  // height tracks the left column (JBI) when JBI is
                  // taller, but we don't want that extra height
                  // absorbed by the LP / Courses row. Letting this
                  // row size to its content keeps the gap to the
                  // Streak Hero below at a constant 24px regardless
                  // of how tall the JBI tile gets.
                }}
              >
                {showLP &&
                  (topPath ? (
                    <LoFiScope on={lpFlag.variant === 'lo-fi'}>
                      <LearningPathCard
                        data={topPath}
                        variant="compact-v3"
                        pathsCount={items.length}
                        onViewAll={openPanel}
                      />
                    </LoFiScope>
                  ) : (
                    <div style={EMPTY_STYLE}>
                      No active paths yet —{' '}
                      <Link
                        to="/catalog"
                        className="cre-link-action"
                        style={LINK_STYLE}
                      >
                        explore the catalog →
                      </Link>
                    </div>
                  ))}
                {showCourses && (
                  <LoFiScope on={coursesFlag.variant === 'lo-fi'}>
                    <CoursesSummaryCardV3 />
                  </LoFiScope>
                )}
              </div>
            )
          )}
          {showStreak && (
            <LoFiScope on={streakFlag.variant === 'lo-fi'}>
              <StreakHeroCard variant="v3" />
            </LoFiScope>
          )}
          {showMembershipInRightColumn && membershipPlacement === 'trail' && (
            <MembershipPlaceholderCard />
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Returns the V3 main-column widgets as a flat `id → JSX` map.
 * Used by `DashboardV3` when the drag-and-drop feature flag is on so each
 * widget can be wrapped in its own `<DraggableSlot>` and reordered
 * (and moved across columns) independently. Mirrors the feature-flag
 * gating in `V3MainSection` — disabled widgets return `null` and the
 * caller drops them from the render order.
 *
 * Includes the Featured Products / Membership card (`membership-featured`)
 * so it stays on the page — and becomes individually draggable — when
 * DnD is on. Without it the card would vanish in DnD mode, since DnD
 * replaces the composed `LearnerOverviewPanel` (the only place that
 * otherwise renders it). Gated to members: `MembershipPlaceholderCard`
 * renders nothing for non-members, so omitting the key keeps a stray
 * empty draggable slot from appearing for them.
 */
export function useV3MainSectionWidgets(): Record<
  string,
  React.ReactNode
> {
  const { membership } = useAccount()
  const { openPanel } = useLearningPathsPanel()
  const items = useLearningPathCardsForBrand()
  const topPath = sortAndLimitPaths(items, 1)[0]
  const { showJBI, jbiLayout, jbiLoFi, jbiLinksCardSize } =
    useJumpBackInVersion()
  const streakFlag = useFeatureFlag('streak-hero-card')
  const showStreak = streakFlag.enabled
  const lpFlag = useFeatureFlag('learning-path-card')
  const showLP = lpFlag.enabled
  const coursesFlag = useFeatureFlag('courses-summary-card')
  const showCourses = coursesFlag.enabled
  // Key order matches the composed view: the Featured Products /
  // Membership card sits at the top (it renders above V3MainSection in
  // `LearnerOverviewPanel`), then JBI, Learning Path + Courses, Streak.
  // Each widget is wrapped in `<LoFiScope>` so its per-flag "lo-fi"
  // variant flips just that widget into its placeholder (the global
  // Lo-Fi master switch still flips them all).
  return {
    'membership-featured':
      membership === 'member' ? <MembershipPlaceholderCard /> : null,
    'jump-back-in': showJBI ? (
      <LoFiScope on={jbiLoFi}>
        <JumpBackInCard
          variant="v3"
          v3Layout={jbiLayout}
          linksCardSize={jbiLinksCardSize}
        />
      </LoFiScope>
    ) : null,
    'learning-path': showLP
      ? topPath
        ? (
            <LoFiScope on={lpFlag.variant === 'lo-fi'}>
              <LearningPathCard
                data={topPath}
                variant="compact-v3"
                pathsCount={items.length}
                onViewAll={openPanel}
              />
            </LoFiScope>
          )
        : (
            <div style={EMPTY_STYLE}>
              No active paths yet —{' '}
              <Link
                to="/catalog"
                className="cre-link-action"
                style={LINK_STYLE}
              >
                explore the catalog →
              </Link>
            </div>
          )
      : null,
    'courses-summary': showCourses ? (
      <LoFiScope on={coursesFlag.variant === 'lo-fi'}>
        <CoursesSummaryCardV3 />
      </LoFiScope>
    ) : null,
    'streak-hero': showStreak ? (
      <LoFiScope on={streakFlag.variant === 'lo-fi'}>
        <StreakHeroCard variant="v3" />
      </LoFiScope>
    ) : null,
  }
}

/* ─── Membership placeholder ─────────────────────────────────────────
 *
 * Empty Card stub sized to match the streak hero so the row's visual
 * rhythm stays consistent. Will host membership status (renewal date,
 * benefits, upgrade CTA, etc.) in a follow-up; today it's just the
 * "Membership" eyebrow + blank surface.
 *
 * Renders only for member accounts. Non-member accounts have their
 * "upgrade" affordance on the right rail (Premium Membership SidebarCard)
 * + the hero band's Upgrade-to-Pro chip, so adding an empty member-only
 * tile here for them would just be confusing whitespace. */
function MembershipPlaceholderCard() {
  const { membership, brand } = useAccount()
  const heightFlag = useFeatureFlag('membership-card-height')
  const widthFlag = useFeatureFlag('membership-card-width')
  const themeFlag = useFeatureFlag('membership-card-theme')
  const layoutFlag = useFeatureFlag('membership-card-layout')
  if (membership !== 'member') return null
  const isDouble = heightFlag.variant === 'double'
  const isTwoThirds = widthFlag.variant === 'two-thirds'
  const isDark = themeFlag.variant === 'dark'
  const isTilesBottom = layoutFlag.variant === 'tiles-bottom'
  // In the doubled two-thirds layout the inner feature columns get a
  // flex-1 filler so they stretch to the card's full height instead of
  // leaving dead space under the shorter column. (The card sizes to its
  // own content — it no longer force-matches the right-rail Quick Links
  // height now that it leads the right column above Learning Path +
  // Courses.)
  const stretchToQuickLinks = isDouble && isTwoThirds
  return (
    <Card
      style={{
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        // Dark variant — deep teal surface with a darker border so
        // the card reads like a marketing hero. Inner feature shells
        // already use a light tint, so they remain readable.
        background: isDark ? 'var(--color-primary-800)' : undefined,
        border: isDark ? '1px solid var(--color-primary-900)' : undefined,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: isDark
            ? 'var(--color-text-inverse)'
            : 'var(--color-text-secondary)',
        }}
      >
        Featured Products
      </span>
      {isDouble ? (
        isTilesBottom ? (
          // Tiles-bottom layout — feature cards horizontal along
          // the top; Top 5 carousel spans the bottom as five
          // SimpleCard-style tiles. Works for every brand: CRE
          // surfaces real Snacks + AI MasterTracks content, others
          // get lo-fi placeholder cards in the same slots.
          <MembershipFeaturedTilesBottom
            brand={brand}
            dark={isDark}
            narrow={isTwoThirds}
          />
        ) : (
          // Default doubled layout — two horizontal feature cards
          // stacked on the left, vertical Top 5 list on the right.
          // CRE gets real cards; other brands get lo-fi
          // placeholders in the same two slots.
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 20,
              marginTop: 4,
              flex: stretchToQuickLinks ? 1 : undefined,
              alignItems: 'stretch',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                minWidth: 0,
              }}
            >
              {brand === 'cre' ? (
                <>
                  <MembershipSnacksFeature
                    horizontal
                    fill={stretchToQuickLinks}
                    floating={!isTwoThirds}
                  />
                  <MembershipAiMasterTracksFeature
                    horizontal
                    fill={stretchToQuickLinks}
                    floating={!isTwoThirds}
                  />
                </>
              ) : (
                <>
                  <MembershipFeatureLoFiPlaceholder
                    slot={0}
                    horizontal
                    fill={stretchToQuickLinks}
                    floating={!isTwoThirds}
                  />
                  <MembershipFeatureLoFiPlaceholder
                    slot={1}
                    horizontal
                    fill={stretchToQuickLinks}
                    floating={!isTwoThirds}
                  />
                </>
              )}
            </div>
            <MembershipTopFiveFeature
              fill={stretchToQuickLinks}
              dark={isDark}
            />
          </div>
        )
      ) : (
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            lineHeight: '20px',
            color: isDark
              ? 'color-mix(in srgb, var(--color-text-inverse) 80%, transparent)'
              : 'var(--color-text-secondary)',
          }}
        >
          Will include: teasers of Membership benefits, recommended-for-you
          courses, what's new &amp; popular among peers, etc.
        </p>
      )}
    </Card>
  )
}

/** Icon picker for Top Five tiles — maps the synthetic kind label
 *  to a matching glyph (matches catalog treatment elsewhere). */
const TOP_FIVE_KIND_ICON: Record<
  string,
  React.ComponentType<{ size?: number; style?: React.CSSProperties }>
> = {
  Course: GraduationCap,
  Podcast: Podcast,
  Article: FileText,
  Template: Layout,
  Webinar: Video,
}

/** Per-kind hero image for the Top Five tiles. Verified-good
 *  Unsplash IDs reused from `topicImage.ts` pools so URLs don't
 *  404. */
const TOP_FIVE_KIND_IMAGE: Record<string, string> = {
  Course: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&h=600&fit=crop&q=80',
  Podcast: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600&h=600&fit=crop&q=80',
  Article: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&h=600&fit=crop&q=80',
  Template: 'https://images.unsplash.com/photo-1532153975070-2e9ab71f1b14?w=600&h=600&fit=crop&q=80',
  Webinar: 'https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=600&h=600&fit=crop&q=80',
}

/** CRE-only — Tiles-bottom layout for the Featured Products card.
 *  Snacks + AI MasterTracks ride along the top as two horizontal
 *  feature cards; Top 5 spans the bottom as five SimpleCard-style
 *  tiles, each with title + kind + star rating in the bar. */
function MembershipFeaturedTilesBottom({
  brand,
  dark,
  narrow = false,
}: {
  brand: Brand
  dark: boolean
  /** True when the parent Membership card is in `two-thirds` width
   *  (i.e. sits in the V3 right column). Switches the top feature
   *  cards from horizontal (image-left) to vertical (image-top) so
   *  they read clearly in the narrower column. */
  narrow?: boolean
}) {
  const [openCourse, setOpenCourse] = useState<IndividualCourse | null>(null)
  // Carousel through `TOP_FIVE_VIEWS` — left/right arrows + dots
  // navigate; index wraps so the dots are always reachable. Built
  // with an array driver so adding more views is a one-line change
  // to `TOP_FIVE_VIEWS`.
  const [viewIndex, setViewIndex] = useState(0)
  // Carousel nav (prev/next arrows + page dots) is gated by a flag so
  // reviewers can preview the Top 5 locked to a single view. When
  // pagination is off, the flag's secondary "Shown view" variant picks
  // which of the three views is locked in (popular / recommended /
  // top-podcasts) — that's the manual swap trigger in the flag panel.
  const top5Flag = useFeatureFlag('dashboard-top5-pagination')
  const showPagination = top5Flag.enabled
  const viewCount = TOP_FIVE_VIEWS.length
  const lockedViewIndex = Math.max(
    0,
    TOP_FIVE_VIEWS.findIndex(
      (v) =>
        v.id === (top5Flag.secondaryVariant === 'podcasts'
          ? 'top-podcasts'
          : top5Flag.secondaryVariant ?? 'popular'),
    ),
  )
  const effectiveIndex = showPagination ? viewIndex : lockedViewIndex
  const view = TOP_FIVE_VIEWS[effectiveIndex]
  const activeItems = view.items
  const sectionTitle = view.title
  const sectionSubtitle = view.subtitle
  const goToView = (next: number) => {
    setViewIndex(((next % viewCount) + viewCount) % viewCount)
  }
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        marginTop: 4,
      }}
    >
      {/* Top row — Snacks + AI MasterTracks side-by-side. Both widths
          use the horizontal (icon-left) layout so the cards stay
          short; narrow (2/3 width) adds `compact` to slim the icon
          rail since each card only gets half the column. Wide keeps
          the floating marketing-tile treatment. */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 16,
          alignItems: 'stretch',
        }}
      >
        {brand === 'cre' ? (
          <>
            <MembershipSnacksFeature
              horizontal
              compact={narrow}
              floating={!narrow}
            />
            <MembershipAiMasterTracksFeature
              horizontal
              compact={narrow}
              floating={!narrow}
            />
          </>
        ) : (
          <>
            <MembershipFeatureLoFiPlaceholder
              slot={0}
              horizontal
              compact={narrow}
              floating={!narrow}
            />
            <MembershipFeatureLoFiPlaceholder
              slot={1}
              horizontal
              compact={narrow}
              floating={!narrow}
            />
          </>
        )}
      </div>
      {/* Bottom row — Top 5 tiles across the full width. Section
          header has the eyebrow on the left and a mini Popular /
          For You toggle on the right; subtitle sits below the row
          so reviewers see the current data source in context. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Title + subtitle live in their own tight column so the
            carousel arrows (taller than the eyebrow) don't open a gap
            between the two lines. Arrows sit to the right, top-aligned. */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}
          >
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: dark
                  ? 'var(--color-text-inverse)'
                  : 'var(--color-primary-700)',
              }}
            >
              {sectionTitle}
            </span>
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                lineHeight: '16px',
                color: dark
                  ? 'color-mix(in srgb, var(--color-text-inverse) 80%, transparent)'
                  : 'var(--color-text-secondary)',
              }}
            >
              {sectionSubtitle}
            </p>
          </div>
          {showPagination && (
            <TopFiveViewArrows index={viewIndex} onChange={goToView} dark={dark} />
          )}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
            gap: 12,
            marginTop: 4,
          }}
        >
          {activeItems.map((item) => (
            <MembershipTopFiveTile
              key={`${view.id}-${item.rank}`}
              item={item}
              accent={view.accent}
              // Elite ships the Top Podcasts tiles in its
              // secondary ramp instead of the default tertiary.
              // Other brands fall through to the accent-driven
              // default.
              colorOverride={
                view.id === 'top-podcasts' && brand === 'elite'
                  ? 'var(--color-secondary-700)'
                  : undefined
              }
              onClick={() => setOpenCourse(topFiveItemToCourse(item))}
            />
          ))}
        </div>
        {showPagination && (
          <TopFiveViewDots
            index={viewIndex}
            count={viewCount}
            onChange={goToView}
            dark={dark}
          />
        )}
      </div>
      <CourseSheet
        open={openCourse != null}
        onClose={() => setOpenCourse(null)}
        data={openCourse}
      />
    </div>
  )
}

/** Previous + Next arrows for the Top 5 carousel — sits in the
 *  section header next to the title. Pairs with `TopFiveViewDots`
 *  rendered below the tiles. */
function TopFiveViewArrows({
  index,
  onChange,
  dark,
}: {
  index: number
  onChange: (next: number) => void
  dark: boolean
}) {
  const arrowColor = dark
    ? 'var(--color-text-inverse)'
    : 'var(--color-neutral-darkest)'
  const arrowBg = dark
    ? 'color-mix(in srgb, var(--color-text-inverse) 18%, transparent)'
    : 'var(--color-neutral-100)'
  // Hover deepens the chip one step — a darker neutral in light mode, a
  // stronger inverse wash in dark mode.
  const arrowHoverBg = dark
    ? 'color-mix(in srgb, var(--color-text-inverse) 30%, transparent)'
    : 'var(--color-neutral-200)'
  const arrowBtnStyle: React.CSSProperties = {
    width: 24,
    height: 24,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    borderRadius: 'var(--radius-pill)',
    background: arrowBg,
    color: arrowColor,
    cursor: 'pointer',
    padding: 0,
    transition: 'background 120ms ease',
  }
  const hoverIn = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = arrowHoverBg
  }
  const hoverOut = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = arrowBg
  }
  return (
    <div
      role="group"
      aria-label="Top 5 carousel"
      style={{ display: 'inline-flex', gap: 6 }}
    >
      <button
        type="button"
        aria-label="Previous"
        onClick={() => onChange(index - 1)}
        style={arrowBtnStyle}
        onMouseEnter={hoverIn}
        onMouseLeave={hoverOut}
      >
        <ChevronRight
          size={14}
          aria-hidden
          style={{ transform: 'rotate(180deg)' }}
        />
      </button>
      <button
        type="button"
        aria-label="Next"
        onClick={() => onChange(index + 1)}
        style={arrowBtnStyle}
        onMouseEnter={hoverIn}
        onMouseLeave={hoverOut}
      >
        <ChevronRight size={14} aria-hidden />
      </button>
    </div>
  )
}

/** Centered page indicators for the Top 5 carousel — rendered
 *  below the tile grid. Click a dot to jump directly to that
 *  view. Grows automatically with the number of registered
 *  views. */
function TopFiveViewDots({
  index,
  count,
  onChange,
  dark,
}: {
  index: number
  count: number
  onChange: (next: number) => void
  dark: boolean
}) {
  const dotActive = dark
    ? 'var(--color-text-inverse)'
    : 'var(--color-primary-600)'
  const dotInactive = dark
    ? 'color-mix(in srgb, var(--color-text-inverse) 35%, transparent)'
    : 'var(--color-neutral-300)'
  return (
    <div
      role="tablist"
      aria-label="Top 5 page"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 4,
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          type="button"
          role="tab"
          aria-selected={i === index}
          aria-label={`Go to page ${i + 1} of ${count}`}
          onClick={() => onChange(i)}
          style={{
            width: 7,
            height: 7,
            padding: 0,
            border: 'none',
            borderRadius: '50%',
            background: i === index ? dotActive : dotInactive,
            cursor: 'pointer',
            transition: 'background 160ms ease',
          }}
        />
      ))}
    </div>
  )
}

/** SimpleCard-style square tile for a single Top 5 entry. Image
 *  takes the upper portion; title bar at the bottom carries the
 *  rank + title and a sub-row with kind · ★ rating. Click opens
 *  the shared CourseSheet (same affordance as the catalog). */
function MembershipTopFiveTile({
  item,
  onClick,
  accent = 'primary',
  colorOverride,
}: {
  item: TopFiveItem
  onClick: () => void
  /** Color the title bar background: `'primary'` (Popular —
   *  teal-600), `'secondary'` (Recommended For You — teal-700),
   *  or `'tertiary'` (Top Podcasts — tertiary-700, matches the
   *  catalog podcast treatment). */
  accent?: 'primary' | 'secondary' | 'tertiary'
  /** Replaces both the title bar background AND the podcast
   *  image-area block (when `accent === 'tertiary'`) with this
   *  CSS color. Used by per-brand color overrides — e.g. Elite
   *  ships podcast tiles in `--color-secondary-700` instead of
   *  the default tertiary ramp. */
  colorOverride?: string
}) {
  const Icon = TOP_FIVE_KIND_ICON[item.kind]
  // Prefer the per-item image when provided so each of the 10
  // tiles is visually distinct; fall back to the kind-keyed pool
  // for any item that hasn't been assigned a unique URL.
  const imageUrl = item.imageUrl ?? TOP_FIVE_KIND_IMAGE[item.kind]
  const accentColor =
    accent === 'tertiary'
      ? 'var(--color-tertiary-700)'
      : accent === 'secondary'
        ? 'var(--color-primary-700)'
        : 'var(--color-primary-600)'
  const titleBarBg = colorOverride ?? accentColor
  const podcastBlockBg = colorOverride ?? 'var(--color-tertiary-700)'
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Open ${item.title}`}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        background: 'transparent',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'transform 160ms ease, box-shadow 160ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 6px 18px rgb(0 0 0 / 0.16)'
        e.currentTarget.style.transform = 'scale(1.005)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.transform = 'none'
      }}
    >
      {/* Hero area — bigger now that the hours line is gone so
          the tile leans more visual. Podcast view (accent =
          tertiary) mirrors the SimpleCard treatment used on the
          membership page Podcast Spotlight shelf: solid
          tertiary-700 block + faded Podcast glyph decoration, no
          image. All other views stack a top-down 50%→0% black
          gradient over the photo so the rank numeral pops in the
          upper area. */}
      <div
        style={{
          position: 'relative',
          height: 90,
          flexShrink: 0,
          ...(accent === 'tertiary'
            ? {
                background: podcastBlockBg,
              }
            : {
                backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.5), rgba(0,0,0,0.05)), url("${imageUrl}")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }),
          overflow: 'hidden',
        }}
      >
        {accent === 'tertiary' && (
          <Podcast
            size={120}
            aria-hidden
            style={{
              position: 'absolute',
              top: -8,
              right: -20,
              color: 'var(--color-text-inverse)',
              opacity: 0.18,
            }}
          />
        )}
        {/* (No top-left kind glyph — the meta row below the image
            already shows the kind icon next to the type label, so
            the corner badge is redundant.) */}
      </div>
      {/* Detail area — sits at the bottom of the tile. Title
          (2-line clamp) + meta row (kind · rating). Aligned to the
          bottom edge so the image dominates the upper portion.
          Background tints based on `accent` so the Recommended For
          You view reads with the secondary ramp. */}
      <div
        style={{
          flex: 1,
          background: titleBarBg,
          padding: '8px 12px 10px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          gap: 4,
          boxSizing: 'border-box',
        }}
      >
        <span
          style={{
            margin: 0,
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            fontSize: 13,
            lineHeight: '16px',
            color: 'var(--color-text-inverse)',
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 2,
            overflow: 'hidden',
          }}
        >
          {item.title}
        </span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            // Tight gap so the divider sits close to the kind label and
            // rating on either side.
            gap: 3,
            // Single line, no wrap — a wrapped meta row was making
            // tiles in views with longer kind labels (Template /
            // Webinar) taller than the podcast view, so the three
            // carousel pages didn't match. The kind label truncates
            // before the rating gives up space.
            flexWrap: 'nowrap',
            minWidth: 0,
            fontFamily: 'var(--font-body)',
            fontSize: 11,
            fontWeight: 500,
            color:
              'color-mix(in srgb, var(--color-text-inverse) 88%, transparent)',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              minWidth: 0,
            }}
          >
            {Icon && <Icon size={11} aria-hidden style={{ flexShrink: 0 }} />}
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {item.kind}
            </span>
          </span>
          <span
            aria-hidden
            style={{
              flexShrink: 0,
              width: 1,
              height: 10,
              background:
                'color-mix(in srgb, var(--color-text-inverse) 40%, transparent)',
            }}
          />
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              flexShrink: 0,
            }}
            aria-label={`Rated ${item.rating} out of 5`}
          >
            <StarSolid
              size={11}
              aria-hidden
              // Gold/amber rating star. The catalog uses the brand accent
              // (`secondary-500`), but that's cyan on some brands (Elite),
              // so use the consistent gold `warning-500` for the rating.
              style={{ color: 'var(--color-warning-500)' }}
            />
            <span>{item.rating.toFixed(1)}</span>
          </span>
        </span>
      </div>
    </button>
  )
}

/** Non-CRE Membership feature card — same shell as the CRE
 *  cards (icon block + content area + Included-with-Membership
 *  badge), but the body content is lo-fi placeholder bars and the
 *  title is a generic "Feature N" label. Each slot picks a
 *  different icon from a small pool so the two cards read as
 *  distinct rather than identical. Replace with brand-specific
 *  content as it lands. */
const PLACEHOLDER_FEATURE_ICONS: Array<
  React.ComponentType<{ size?: number; style?: React.CSSProperties }>
> = [GraduationCap, BookOpen]
const PLACEHOLDER_FEATURE_TITLES = [
  'Video Nursing Skills Library',
  'Specialty Certification Exam Prep Bundles',
]

function MembershipFeatureLoFiPlaceholder({
  slot,
  horizontal = false,
  compact = false,
  fill = false,
  floating = false,
}: {
  slot: number
  horizontal?: boolean
  compact?: boolean
  fill?: boolean
  floating?: boolean
}) {
  const Icon =
    PLACEHOLDER_FEATURE_ICONS[slot % PLACEHOLDER_FEATURE_ICONS.length]
  const title =
    PLACEHOLDER_FEATURE_TITLES[slot % PLACEHOLDER_FEATURE_TITLES.length]
  return (
    <HorizontalOrVerticalFeatureShell
      // Image URL is required by the shell type but ignored when
      // `Icon` is passed — provide an empty string so the prop is
      // satisfied without loading network resources.
      imageUrl=""
      Icon={Icon}
      horizontal={horizontal}
      compact={compact}
      fill={fill}
      floating={floating}
      // Match the CRE feature cards' lighter wash — standard tint at 15%.
      surface="color-mix(in srgb, color-mix(in srgb, var(--color-primary-500) 5%, white) 15%, transparent)"
    >
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: 'var(--color-primary-700)',
        }}
      >
        {title}
      </span>
      {/* Two-line description placeholder — mirrors the CRE cards' 2-line
          tagline. */}
      <LoFiBar width="100%" />
      <LoFiBar width="70%" />
      {/* Three bullet placeholders — mirror the CRE cards' bullet list. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 2 }}>
        {['58%', '52%', '46%'].map((w) => (
          <span key={w} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              aria-hidden
              style={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: 'var(--color-neutral-300)',
                flexShrink: 0,
              }}
            />
            <LoFiBar width={w} />
          </span>
        ))}
      </div>
      <IncludedWithProBadge />
    </HorizontalOrVerticalFeatureShell>
  )
}

/** CRE-only Membership feature column — surfaces the "Snacks"
 *  bite-sized-learning concept (quarterly drops of practical tools
 *  + topic guides). Tagline + branded examples list sit on a soft
 *  primary-tinted card so the column reads as concrete teaser
 *  content next to the lo-fi placeholder siblings.
 *
 *  Sources from the CRE Snacks marketing page — tagline + example
 *  topics (Pipeline Boost, Brand Identity, Client Care, Real Estate
 *  Investing). Only renders when `brand === 'cre'`. */
function MembershipSnacksFeature({
  fill = false,
  horizontal = false,
  compact = false,
  floating = false,
}: {
  fill?: boolean
  horizontal?: boolean
  compact?: boolean
  /** Drop the tinted background + border, add course-card hover
   *  styles, and wrap the card in a Link to the Membership page's
   *  Learning Snacks section. Wired from the parent based on the
   *  membership card width. */
  floating?: boolean
}) {
  return (
    <HorizontalOrVerticalFeatureShell
      imageUrl="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&h=600&fit=crop&q=80"
      Icon={PizzaSlice}
      horizontal={horizontal}
      compact={compact}
      fill={fill}
      floating={floating}
      href={floating ? '/membership#learning-snacks' : undefined}
      // Lighter wash — the standard tint at 15% opacity.
      surface="color-mix(in srgb, color-mix(in srgb, var(--color-primary-500) 5%, white) 15%, transparent)"
    >
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: 'var(--color-primary-700)',
        }}
      >
        Learning Snacks
      </span>
      <p
        style={{
          margin: 0,
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          lineHeight: '15px',
          color: 'var(--color-text-secondary)',
          // Up to two lines before truncating.
          display: '-webkit-box',
          WebkitBoxOrient: 'vertical',
          WebkitLineClamp: 2,
          overflow: 'hidden',
        }}
      >
        Sharpen your skills or gain new insights with access to new snacks
        every quarter.
      </p>
      <ul
        style={{
          margin: 0,
          paddingLeft: 16,
          listStyle: 'disc',
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          lineHeight: '16px',
          color: 'var(--color-text-secondary)',
        }}
      >
        <li>Pipeline Boost</li>
        <li>Brand Identity</li>
        <li>Client Care</li>
      </ul>
      <IncludedWithProBadge />
    </HorizontalOrVerticalFeatureShell>
  )
}

/** Catalog "Included with Pro" badge, lifted from
 *  `IndividualCourseCard` so the Membership feature cards carry the
 *  same affordance. Gem icon + label, tertiary-700 ink, no fill —
 *  reads as a quiet member-benefit signal. */
function IncludedWithProBadge() {
  return (
    <span
      // `cre-tag-pro` adds the catalog's 25% tertiary-100 wash
      // (see styles/tokens.css). Stays text-only otherwise — Gem
      // glyph + tertiary-700 ink + rounded-sm corners.
      className="cre-tag-pro"
      style={{
        position: 'absolute',
        bottom: 8,
        right: 8,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '0 8px',
        height: 22,
        borderRadius: 'var(--radius-sm)',
        color: 'var(--color-tertiary-700)',
        fontFamily: 'var(--font-body)',
        fontSize: 12,
        fontWeight: 600,
        lineHeight: '20px',
        whiteSpace: 'nowrap',
      }}
    >
      <Gem size={12} aria-hidden />
      Included with Membership
    </span>
  )
}

/** CRE-only — AI MasterTracks Membership column. Mirrors the
 *  `MembershipSnacksFeature` structure (header image + eyebrow +
 *  tagline + body + examples) so the three feature columns read as
 *  visual siblings. Copy sourced from the CRE AI MasterTracks
 *  marketing page (Live · Guided · On-Demand · Workflow tracks). */
function MembershipAiMasterTracksFeature({
  fill = false,
  horizontal = false,
  compact = false,
  floating = false,
}: {
  fill?: boolean
  horizontal?: boolean
  compact?: boolean
  /** See `MembershipSnacksFeature.floating` — same behavior, links
   *  to the Membership page's AI MasterTracks section. */
  floating?: boolean
}) {
  return (
    <HorizontalOrVerticalFeatureShell
      imageUrl="https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600&h=600&fit=crop&q=80"
      Icon={ShoePrints}
      horizontal={horizontal}
      compact={compact}
      fill={fill}
      floating={floating}
      href={floating ? '/membership#ai-mastertracks' : undefined}
      // Lighter wash — the standard tint at 15% opacity.
      surface="color-mix(in srgb, color-mix(in srgb, var(--color-primary-500) 5%, white) 15%, transparent)"
    >
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: 'var(--color-primary-700)',
        }}
      >
        AI MasterTracks
      </span>
      <p
        style={{
          margin: 0,
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          lineHeight: '15px',
          color: 'var(--color-text-secondary)',
          // Up to two lines before truncating.
          display: '-webkit-box',
          WebkitBoxOrient: 'vertical',
          WebkitLineClamp: 2,
          overflow: 'hidden',
        }}
      >
        Multi-track AI training built for real estate pros — apply AI to
        generate more leads, convert clients, and drive repeat business.
      </p>
      <ul
        style={{
          margin: 0,
          paddingLeft: 16,
          listStyle: 'disc',
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          lineHeight: '16px',
          color: 'var(--color-text-secondary)',
        }}
      >
        <li>Lead Generation</li>
        <li>Client Conversion</li>
        <li>Repeat Business</li>
      </ul>
      <IncludedWithProBadge />
    </HorizontalOrVerticalFeatureShell>
  )
}

/** Shared shell for the CRE Snacks + AI MasterTracks feature cards.
 *  Provides the surface (lighter tinted background + border), the
 *  optional hero image, and a flex-filling tail block so the card
 *  stretches cleanly when its parent column grows.
 *
 *  - `horizontal: false` (default) — image bleeds across the top,
 *    content stacks below. Used when the cards live in a 3-column
 *    layout (legacy stacking).
 *  - `horizontal: true` — image fills the left edge, content stacks
 *    on the right. Used in the new CRE 2-column layout where the
 *    feature cards stack as wide horizontal rows. */
function HorizontalOrVerticalFeatureShell({
  imageUrl,
  Icon,
  horizontal = false,
  compact = false,
  fill = false,
  floating = false,
  href,
  surface: surfaceOverride,
  children,
}: {
  imageUrl: string
  /** Optional large glyph rendered in place of the photo. When
   *  provided, the shell paints the image area as a primary-100
   *  block with the icon centered in primary-500. Hover (when
   *  `floating`) tints the block one step darker. */
  Icon?: React.ComponentType<{ size?: number; style?: React.CSSProperties }>
  horizontal?: boolean
  /** Only meaningful with `horizontal`. Narrows the left icon rail
   *  (84px vs 120px) + shrinks the glyph so the horizontal layout
   *  still leaves room for the title/body when the card sits in a
   *  slim 2-column grid (the Membership card's two-thirds width). */
  compact?: boolean
  fill?: boolean
  /** Floating mode — drops the tinted background + border and adds
   *  the same hover treatment course cards use (drop shadow +
   *  scale-up). When paired with `href`, the whole card becomes a
   *  router Link to that destination. Used by the Membership card's
   *  full-width layouts so the feature cards read as interactive
   *  marketing tiles rather than static teasers. */
  floating?: boolean
  /** Route the card links to when `floating` is on. */
  href?: string
  /** Optional background override — replaces the computed tinted surface.
   *  Used by the Snacks card for a lighter, semi-transparent wash. */
  surface?: string
  children: React.ReactNode
}) {
  // Lighter than the prior `--color-primary-100` — a faint teal wash
  // so the card still reads on-brand against the Membership card's
  // white surface but doesn't dominate.
  const lightTint = 'color-mix(in srgb, var(--color-primary-500) 5%, white)'
  const surface = surfaceOverride ?? (floating ? 'transparent' : lightTint)
  // Floating cards use the same light-gray outline course cards use
  // (`--color-border-subtle`) so they read as quiet card surfaces
  // without the teal tint.
  const borderStyle = floating
    ? '1px solid var(--color-border-subtle)'
    : '1px solid var(--color-primary-200)'
  // Default + hover tints for the icon block (only used when Icon
  // is provided). Hover deepens the wash + icon a single step
  // along the primary ramp.
  const iconBlockBg = 'var(--color-primary-100)'
  const iconBlockColor = 'var(--color-primary-500)'
  const iconBlockHoverBg = 'var(--color-primary-200)'
  const iconBlockHoverColor = 'var(--color-primary-600)'
  const hoverIn = floating
    ? (e: React.MouseEvent<HTMLElement>) => {
        e.currentTarget.style.boxShadow = '0 6px 18px rgb(0 0 0 / 0.16)'
        e.currentTarget.style.transform = 'scale(1.005)'
        const iconBlock = e.currentTarget.querySelector<HTMLElement>(
          '[data-feature-icon-block]',
        )
        if (iconBlock) {
          iconBlock.style.background = iconBlockHoverBg
          iconBlock.style.color = iconBlockHoverColor
        }
      }
    : undefined
  const hoverOut = floating
    ? (e: React.MouseEvent<HTMLElement>) => {
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.transform = 'none'
        const iconBlock = e.currentTarget.querySelector<HTMLElement>(
          '[data-feature-icon-block]',
        )
        if (iconBlock) {
          iconBlock.style.background = iconBlockBg
          iconBlock.style.color = iconBlockColor
        }
      }
    : undefined
  /** Render the card either as a div (default) or as a Link
   *  (floating + href) so hover styles + click navigation only kick
   *  in when both opts are on. */
  const renderShell = (
    style: React.CSSProperties,
    body: React.ReactNode,
  ): React.ReactNode => {
    if (floating && href) {
      return (
        <Link
          to={href}
          style={{
            textDecoration: 'none',
            color: 'inherit',
            display: 'block',
            transition: 'transform 160ms ease, box-shadow 160ms ease',
            ...style,
          }}
          onMouseEnter={hoverIn}
          onMouseLeave={hoverOut}
        >
          {body}
        </Link>
      )
    }
    return <div style={style}>{body}</div>
  }
  if (horizontal) {
    return renderShell(
      {
        // `position: relative` anchors any absolutely-positioned corner
        // badge so it can poke out of the top-right corner. We dropped
        // `overflow: hidden` so the badge can bleed past the border — the
        // image element below clips itself via its own border-radius so the
        // rounded corner treatment is preserved.
        position: 'relative',
        display: 'flex',
        alignItems: 'stretch',
        borderRadius: 8,
        background: surface,
        border: borderStyle,
        height: fill ? '100%' : undefined,
        minWidth: 0,
      },
      <>
        {Icon ? (
          <div
            aria-hidden
            data-feature-icon-block
            style={{
              width: compact ? 84 : 120,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: iconBlockBg,
              color: iconBlockColor,
              borderTopLeftRadius: 7,
              borderBottomLeftRadius: 7,
              transition: 'background 160ms ease, color 160ms ease',
            }}
          >
            <Icon size={compact ? 40 : 56} />
          </div>
        ) : (
          <div
            aria-hidden
            style={{
              width: compact ? 84 : 120,
              flexShrink: 0,
              backgroundImage: `url("${imageUrl}")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderTopLeftRadius: 7,
              borderBottomLeftRadius: 7,
              boxShadow:
                'inset 0 0 0 9999px color-mix(in srgb, var(--color-primary-500) 12%, transparent)',
            }}
          />
        )}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            padding: '14px 14px 36px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {children}
        </div>
      </>,
    )
  }
  return renderShell(
    {
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      padding: '14px 14px 36px',
      borderRadius: 8,
      background: surface,
      border: borderStyle,
      height: fill ? '100%' : undefined,
      minWidth: 0,
    },
    <>
      {Icon ? (
        <div
          aria-hidden
          data-feature-icon-block
          style={{
            height: 88,
            marginInline: -14,
            marginTop: -14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: iconBlockBg,
            color: iconBlockColor,
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
            transition: 'background 160ms ease, color 160ms ease',
          }}
        >
          <Icon size={48} />
        </div>
      ) : (
        <div
          aria-hidden
          style={{
            height: 88,
            marginInline: -14,
            marginTop: -14,
            backgroundImage: `url("${imageUrl}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
            boxShadow:
              'inset 0 0 0 9999px color-mix(in srgb, var(--color-primary-500) 12%, transparent)',
          }}
        />
      )}
      {children}
      {fill && (
        <div
          aria-hidden
          style={{
            flex: 1,
            minHeight: 32,
            background: 'var(--color-surface-card)',
            borderRadius: 6,
            opacity: 0.6,
          }}
        />
      )}
    </>,
  )
}

/** CRE-only — Top 5 of the most popular learning items across
 *  content types (Course / Podcast / Article / Template / Webinar).
 *  Order is 1 → 5 (top to bottom). Each entry carries enough info
 *  to synthesize an `IndividualCourse` for the shared CourseSheet
 *  panel when the row is clicked. */
type TopFiveItem = {
  rank: number
  title: string
  kind: string
  rating: number
  delivery: IndividualCourse['delivery']
  hours: number
  price: number
  /** Per-item image URL. Lets each of the 10 tiles (5 Popular + 5
   *  Recommended For You) use a unique hero so toggling between
   *  the two views doesn't surface the same image twice. Falls
   *  back to a kind-based default if omitted. */
  imageUrl?: string
}

// Image URLs for the 10 tiles (5 Popular + 5 Recommended) — all
// drawn from the verified-good Unsplash pools in `topicImage.ts`
// (books-study, podcast, construction, rural, city-urban). Each ID
// appears exactly once across both lists so toggling between views
// never surfaces a duplicate image.
const TOP_FIVE_ITEMS: TopFiveItem[] = [
  {
    rank: 1,
    title: 'Negotiation Mastery for Listings',
    kind: 'Course',
    rating: 4.9,
    delivery: 'online',
    hours: 4,
    price: 79,
    imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&h=600&fit=crop&q=80',
  },
  {
    rank: 2,
    title: 'The Market Pulse: Spring Edition',
    kind: 'Podcast',
    rating: 4.7,
    delivery: 'podcast',
    hours: 1,
    price: 0,
    imageUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600&h=600&fit=crop&q=80',
  },
  {
    rank: 3,
    title: 'Fair Housing Compliance Quick Reference',
    kind: 'Article',
    rating: 4.6,
    delivery: 'online',
    hours: 1,
    price: 0,
    imageUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&h=600&fit=crop&q=80',
  },
  {
    rank: 4,
    title: 'Luxury Buyer Persona Workbook',
    kind: 'Template',
    rating: 4.5,
    delivery: 'online',
    hours: 1,
    price: 0,
    imageUrl: 'https://images.unsplash.com/photo-1532153975070-2e9ab71f1b14?w=600&h=600&fit=crop&q=80',
  },
  {
    rank: 5,
    title: 'Q2 Tax Implications for Sellers',
    kind: 'Webinar',
    rating: 4.3,
    delivery: 'webinar',
    hours: 2,
    price: 49,
    imageUrl: 'https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=600&h=600&fit=crop&q=80',
  },
]

/** Recommended-for-you slice — same shape, but skewed toward the
 *  active learner's license + interests (e.g. NC broker working
 *  luxury inventory). Hand-curated demo fixture; will be replaced
 *  by a personalized API response. */
const TOP_FIVE_RECOMMENDED_ITEMS: TopFiveItem[] = [
  {
    rank: 1,
    title: 'Negotiating Multiple Offers in Charlotte',
    kind: 'Course',
    rating: 4.8,
    delivery: 'online',
    hours: 3,
    price: 59,
    imageUrl: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=600&h=600&fit=crop&q=80',
  },
  {
    rank: 2,
    title: 'Luxury Listings Masterclass',
    kind: 'Webinar',
    rating: 4.7,
    delivery: 'webinar',
    hours: 2,
    price: 39,
    imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&h=600&fit=crop&q=80',
  },
  {
    rank: 3,
    title: 'NC Market Trends — Q2 Snapshot',
    kind: 'Article',
    rating: 4.6,
    delivery: 'online',
    hours: 1,
    price: 0,
    imageUrl: 'https://images.unsplash.com/photo-1488972685288-c3fd157d7c7a?w=600&h=600&fit=crop&q=80',
  },
  {
    rank: 4,
    title: 'Buyer Intake Script Template',
    kind: 'Template',
    rating: 4.5,
    delivery: 'online',
    hours: 1,
    price: 0,
    imageUrl: 'https://images.unsplash.com/photo-1500076656116-558758c991c1?w=600&h=600&fit=crop&q=80',
  },
  {
    rank: 5,
    title: 'Smart Home Tech for Agents',
    kind: 'Podcast',
    rating: 4.4,
    delivery: 'podcast',
    hours: 1,
    price: 0,
    imageUrl: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=600&h=600&fit=crop&q=80',
  },
]

/** Top podcasts slice — 5 podcast-only items so reviewers can see
 *  how the carousel handles a single-kind page. Images come from
 *  the unused half of the codebase's verified Unsplash pools so
 *  no image repeats across the three views. */
const TOP_FIVE_PODCAST_ITEMS: TopFiveItem[] = [
  {
    rank: 1,
    title: 'The Market Pulse: Weekly Briefing',
    kind: 'Podcast',
    rating: 4.8,
    delivery: 'podcast',
    hours: 1,
    price: 0,
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600&h=600&fit=crop&q=80',
  },
  {
    rank: 2,
    title: 'Closing the Deal Weekly',
    kind: 'Podcast',
    rating: 4.7,
    delivery: 'podcast',
    hours: 1,
    price: 0,
    imageUrl: 'https://images.unsplash.com/photo-1494522358652-f30e61a60313?w=600&h=600&fit=crop&q=80',
  },
  {
    rank: 3,
    title: 'Real Estate Disruptors',
    kind: 'Podcast',
    rating: 4.6,
    delivery: 'podcast',
    hours: 1,
    price: 0,
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&h=600&fit=crop&q=80',
  },
  {
    rank: 4,
    title: 'Buyer Conversion Conversations',
    kind: 'Podcast',
    rating: 4.5,
    delivery: 'podcast',
    hours: 1,
    price: 0,
    imageUrl: 'https://images.unsplash.com/photo-1449034446853-66c86144b0ad?w=600&h=600&fit=crop&q=80',
  },
  {
    rank: 5,
    title: 'Luxury Listings Insider',
    kind: 'Podcast',
    rating: 4.4,
    delivery: 'podcast',
    hours: 1,
    price: 0,
    imageUrl: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&h=600&fit=crop&q=80',
  },
]

/** Views surfaced by the Top 5 carousel — append new entries here
 *  to add another carousel page. Each view ships its own title,
 *  subtitle, tile slice, and accent ramp. */
const TOP_FIVE_VIEWS: Array<{
  id: string
  title: string
  subtitle: string
  items: TopFiveItem[]
  accent: 'primary' | 'secondary' | 'tertiary'
}> = [
  {
    id: 'popular',
    title: 'Top 5 right now',
    subtitle: 'Most popular this week — based on member usage.',
    items: TOP_FIVE_ITEMS,
    accent: 'primary',
  },
  {
    id: 'recommended',
    title: 'Recommended for you',
    subtitle: 'Hand-picked for your license, interests, and recent activity.',
    items: TOP_FIVE_RECOMMENDED_ITEMS,
    accent: 'secondary',
  },
  {
    id: 'top-podcasts',
    title: 'Top podcasts',
    subtitle: 'Tune in — the most-played podcasts across the platform this week.',
    items: TOP_FIVE_PODCAST_ITEMS,
    accent: 'tertiary',
  },
]

/** Build the synthetic IndividualCourse the CourseSheet expects from
 *  a Top 5 row. The sheet is purely informational from this entry
 *  point (no enrollment intent), so we fill the required fields with
 *  reasonable demo values and leave optional ones unset. */
function topFiveItemToCourse(item: TopFiveItem): IndividualCourse {
  return {
    id: `top-five-${item.rank}`,
    title: item.title,
    hours: item.hours,
    states: ['North Carolina'],
    delivery: item.delivery,
    price: item.price,
    memberPrice: item.price === 0 ? 0 : Math.max(0, item.price - 20),
    rating: item.rating,
    ratingCount: 200 + item.rank * 47,
    badge: 'elective',
    imageQuery: 'real-estate-coaching',
  }
}

function MembershipTopFiveFeature({
  fill = false,
  dark = false,
}: {
  fill?: boolean
  /** When the surrounding Membership card uses the dark theme, the
   *  Top 5 column wraps itself in a white sub-card so its content
   *  stays readable against the dark surface. */
  dark?: boolean
}) {
  const [openCourse, setOpenCourse] = useState<IndividualCourse | null>(null)
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        // Light mode sits directly on the Membership card's white
        // surface. Dark mode wraps itself in a white sub-card so the
        // titles + meta stay legible against the deep teal frame.
        padding: dark ? 14 : '2px 0',
        borderRadius: dark ? 8 : undefined,
        background: dark ? 'var(--color-surface-card)' : undefined,
        border: dark ? '1px solid var(--color-border-subtle)' : undefined,
        height: fill ? '100%' : undefined,
        minWidth: 0,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: 'var(--color-primary-700)',
        }}
      >
        Top 5 right now
      </span>
      <p
        style={{
          margin: 0,
          fontFamily: 'var(--font-body)',
          fontSize: 12,
          lineHeight: '16px',
          color: 'var(--color-text-secondary)',
        }}
      >
        Most popular this week — based on member usage.
      </p>
      <ol
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
          marginTop: 2,
          flex: fill ? 1 : undefined,
        }}
      >
        {TOP_FIVE_ITEMS.map((item, idx) => (
          <li
            key={item.rank}
            style={{
              borderBottom:
                idx === TOP_FIVE_ITEMS.length - 1
                  ? 'none'
                  : '1px solid var(--color-border-subtle)',
            }}
          >
            <button
              type="button"
              onClick={() => setOpenCourse(topFiveItemToCourse(item))}
              aria-label={`Open ${item.title}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 8px',
                margin: '0 -8px',
                width: 'calc(100% + 16px)',
                background: 'transparent',
                border: 'none',
                borderRadius: 8,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'background 160ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background =
                  'color-mix(in srgb, var(--color-primary-500) 6%, white)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
              onFocus={(e) => {
                e.currentTarget.style.background =
                  'color-mix(in srgb, var(--color-primary-500) 6%, white)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              {/* Rank medallion — circular primary fill so the
                  number pops against the surrounding white surface. */}
              <span
                aria-hidden
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background:
                    'linear-gradient(135deg, var(--color-primary-600), var(--color-primary-800))',
                  color: 'var(--color-text-inverse)',
                  fontFamily: 'var(--font-heading)',
                  fontSize: 16,
                  fontWeight: 800,
                  lineHeight: 1,
                  flexShrink: 0,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                }}
              >
                {item.rank}
              </span>
              <span
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  minWidth: 0,
                  flex: 1,
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 13,
                    fontWeight: 600,
                    lineHeight: '18px',
                    color: 'var(--color-text-primary)',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {item.title}
                </span>
                {/* Meta row — type + divider + star rating, all in
                    the same body type style the course cards use for
                    their delivery / badge meta lines. */}
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    fontFamily: 'var(--font-body)',
                    fontSize: 12,
                    fontWeight: 500,
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  <span>{item.kind}</span>
                  <span
                    aria-hidden
                    style={{
                      width: 1,
                      height: 12,
                      background: 'var(--color-border-subtle)',
                    }}
                  />
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                    aria-label={`Rated ${item.rating} out of 5`}
                  >
                    <StarSolid
                      size={12}
                      aria-hidden
                      style={{ color: 'var(--color-warning-500)' }}
                    />
                    <span>{item.rating.toFixed(1)}</span>
                  </span>
                </span>
              </span>
            </button>
          </li>
        ))}
      </ol>
      <CourseSheet
        open={openCourse != null}
        onClose={() => setOpenCourse(null)}
        data={openCourse}
      />
    </div>
  )
}

/* ─── 1. Streak hero ────────────────────────────────────────────────── */

/**
 * Three-zone hero, left → right:
 *
 *   A. Hero number block + personal-best progress bar (≈170px wide).
 *   B. 30-day sparkline of rolling streak length (flex: 1).
 *   C. This-week 7-bar activity strip (≈170px wide).
 *
 * The card wraps to a 2- or 3-row stack on narrow viewports — see
 * `flexWrap: 'wrap'` + per-zone `flex-basis`. Each zone keeps its own
 * a11y framing (`role="region"`, `role="progressbar"`, `role="img"`,
 * `role="group"`) so screen readers announce the streak even when the
 * card visually compresses.
 *
 * Full spec: `streak-hero-handoff.md` at the repo root.
 */
type ActivityMode = 'week' | '30day'

function StreakHeroCard({ variant = 'v2' }: { variant?: 'v2' | 'v3' } = {}) {
  const { brand } = useAccount()
  const streak = learningStreakFor(brand)
  const week = streakThisWeekFor(brand)
  const displayCount = useCountUp(streak.current, 600)
  const headingId = useId()
  const { loFi } = useLoFi()
  // Default to the 30-day chart — the broader trend lets a learner see
  // streak momentum and intensity at a glance; the week strip is a
  // "zoom in" affordance behind the toggle for current-week pacing.
  //
  // NOTE: This `useState` must stay above the lo-fi early return below
  // — React's rules of hooks require the hook count to match across
  // renders, and the lo-fi toggle flips at runtime.
  const [mode, setMode] = useState<ActivityMode>('30day')

  if (loFi) {
    return (
      <Card style={{ padding: '16px 20px' }}>
        <LoFiWidgetBody rows={5} ariaLabel="Lo-fi streak hero" />
      </Card>
    )
  }

  const toggle = <ActivityModeTabs mode={mode} onChange={setMode} />

  const isV3 = variant === 'v3'
  return (
    <Card style={{ padding: '16px 20px', position: 'relative' }}>
      <h2 id={headingId} className="cre-visually-hidden">
        Learning streak
      </h2>
      {/* V3 floats the activity-view tab pill to the top-right of the
          card so the streak block + chart sit cleanly side-by-side
          underneath. V1/V2 keep the tabs inline as the active chart's
          eyebrow (passed in via the chart's `toggle` prop). */}
      {isV3 && (
        <div
          style={{
            position: 'absolute',
            top: 16,
            right: 20,
          }}
        >
          {toggle}
        </div>
      )}
      <div
        role="region"
        aria-labelledby={headingId}
        style={{
          display: 'flex',
          alignItems: 'stretch',
          gap: 20,
          flexWrap: 'wrap',
        }}
      >
        <StreakHeroBlock
          current={streak.current}
          displayCount={displayCount}
          longest={streak.longest}
          variant={variant}
        />
        <Divider />
        {mode === '30day' ? (
          <StreakDailyBars
            cells={streak.recent30}
            todayIso={streak.lastActivityDate}
            toggle={isV3 ? undefined : toggle}
          />
        ) : (
          <StreakWeekStrip
            week={week}
            daysThisWeek={streak.daysThisWeek}
            todayIso={streak.lastActivityDate}
            toggle={isV3 ? undefined : toggle}
          />
        )}
      </div>
    </Card>
  )
}

/** Mini pill-tab group that switches between the "This Week" strip
 *  and the 30-day daily-activity chart inside the streak hero. Acts as
 *  the eyebrow for each view (the title text is gone; the active pill
 *  IS the title). Capped at 20px tall — sized down from the full-size
 *  `PillTabs` so it sits in the eyebrow row without crowding the bars
 *  below it. Visual language matches `PillTabs` (active = cta-500 fill,
 *  white text; inactive = transparent + neutral-dark text). */
function ActivityModeTabs({
  mode,
  onChange,
}: {
  mode: ActivityMode
  onChange: (m: ActivityMode) => void
}) {
  const items: Array<{ id: ActivityMode; label: string }> = [
    { id: '30day', label: 'Last 30 Days' },
    { id: 'week', label: 'This Week' },
  ]
  return (
    <div
      role="tablist"
      aria-label="Activity view"
      style={{
        display: 'inline-flex',
        alignItems: 'stretch',
        height: 20,
        maxHeight: 20,
        padding: 2,
        background: 'var(--color-neutral-100)',
        borderRadius: 999,
      }}
    >
      {items.map((item) => {
        const active = item.id === mode
        return (
          <button
            key={item.id}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(item.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0 10px',
              borderRadius: 999,
              background: active ? 'var(--color-tab-active)' : 'transparent',
              color: active ? 'var(--color-text-inverse)' : 'var(--color-neutral-dark)',
              border: 'none',
              fontFamily: 'var(--font-body)',
              fontSize: 11,
              fontWeight: 600,
              lineHeight: '16px',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
            }}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}

/** Thin 1px divider, 60% of card height, vertically centered between
 *  the three zones. Drops out of the flow automatically when the
 *  zones wrap to a new row (its width stays 1px so it stops being
 *  visually significant once siblings stack). */
function Divider() {
  return (
    <div
      aria-hidden
      style={{
        width: 1,
        alignSelf: 'center',
        height: '60%',
        background: 'var(--color-border-subtle)',
        flexShrink: 0,
      }}
    />
  )
}

/* ── Zone A — Hero number + personal-best progress bar ────────────── */

function StreakHeroBlock({
  current,
  displayCount,
  longest,
  variant = 'v2',
}: {
  current: number
  displayCount: number
  longest: number
  variant?: 'v2' | 'v3'
}) {
  const isV3 = variant === 'v3'
  // Progress-bar fill: guard divide-by-zero when the learner has no PB
  // yet (longest === 0). At PB or beyond, fill to 100% and hide the
  // flag tick (caption flips to the new-PB copy).
  const pbFillPct =
    longest === 0 ? (current > 0 ? 100 : 0) : Math.min(100, (current / longest) * 100)
  const pbFlagVisible = current < longest && longest > 0
  // `daysToBeat` = days remaining to match the personal best. Acceptance
  // criterion 1 ("29 days to beat it" for current=12 / longest=41)
  // uses `longest - current`, not `longest - current + 1`.
  const daysToBeat = Math.max(0, longest - current)
  const aheadBy = current - longest

  // Caption matrix — see `streak-hero-handoff.md` § "Edge-case caption
  // matrix". Driven by `current`, not `displayCount`, so first-paint
  // copy is correct before the count-up animation finishes.
  const caption =
    longest === 0
      ? current === 0
        ? 'Start your first streak'
        : 'Day 1 of your first streak'
      : current === 0
        ? 'Start a new streak today'
        : current === longest
          ? 'Tied with your personal best'
          : aheadBy > 0
            ? `New personal best · ${aheadBy} day${aheadBy === 1 ? '' : 's'} ahead`
            : daysToBeat === 1
              ? '1 day to beat it'
              : `${daysToBeat} days to beat it`

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        // Align top so the "Current Streak" eyebrow sits on the same
        // baseline as "Daily activity · 30 days" (Zone B) and
        // "This week" (Zone C).
        justifyContent: 'flex-start',
        gap: 4,
        minWidth: 170,
        paddingRight: 8,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          // V3 matches the rest of the tile eyebrows (Jump Back In,
          // Learning Paths, Courses, Quick Links) — uppercase + 600
          // weight + 0.04em tracking. V1/V2 keep the original
          // sentence-case treatment.
          fontWeight: isV3 ? 600 : 500,
          letterSpacing: isV3 ? '0.04em' : undefined,
          textTransform: isV3 ? 'uppercase' : undefined,
          lineHeight: '16px',
          color: 'var(--color-text-secondary)',
        }}
      >
        Current Streak
      </span>
      <span
        aria-live="polite"
        aria-label={`Current learning streak: ${current} days`}
        style={{
          display: 'inline-flex',
          alignItems: 'baseline',
          gap: 6,
          color: 'var(--color-neutral-darkest)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 48,
            fontWeight: 600,
            lineHeight: 1,
          }}
        >
          {displayCount}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            fontWeight: 400,
            color: 'var(--color-text-secondary)',
          }}
        >
          days
        </span>
      </span>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 8,
          marginTop: 6,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 11,
            fontWeight: 500,
            lineHeight: '16px',
            color: 'var(--color-text-secondary)',
          }}
        >
          Personal best
        </span>
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 11,
            fontWeight: 600,
            lineHeight: '16px',
            color: 'var(--color-text-primary)',
          }}
        >
          {longest}
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={longest}
        aria-valuenow={current}
        aria-label={`Progress toward personal best of ${longest} days`}
        style={{
          position: 'relative',
          height: 5,
          background: 'var(--color-neutral-100)',
          borderRadius: 3,
          marginTop: 6,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: 5,
            borderRadius: 3,
            background: 'var(--color-progress-fill)',
            width: `${pbFillPct}%`,
            // Animate the fill on mount. Reduced-motion users get the
            // final width immediately because the count-up hook
            // suppresses its animation in the same media query, and the
            // CSS transition simply never observes a "before" frame —
            // the bar mounts at its final width via the inline style.
            transition: 'width 800ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
        {pbFlagVisible && (
          <span
            aria-hidden
            style={{
              position: 'absolute',
              right: -1,
              top: -2,
              width: 2,
              height: 9,
              background: 'var(--color-neutral-dark)',
              borderRadius: 1,
            }}
          />
        )}
      </div>
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 10,
          fontWeight: 400,
          lineHeight: '14px',
          color: 'var(--color-text-tertiary)',
          // Pin to the bottom of the zone so it lines up with the
          // bar-chart axis ticks in Zone B. The 8px paddingTop keeps a
          // breath of space between the progress bar and the caption
          // when the zone grows taller than the natural content stack.
          marginTop: 'auto',
          paddingTop: 8,
        }}
      >
        {caption}
      </span>
    </div>
  )
}

/* ── Zone B — 30-day daily-activity intensity bar chart ─────────────
 *
 * Each of the trailing 30 days gets one bar whose height + color comes
 * from the intensity bucket of that day's `minutes` (see
 * `intensityLevelForMinutes` in the fixtures). Today is always the
 * darkest bar with a focus ring on top.
 *
 * The bar-chart treatment is the deliberate trade against the previous
 * sparkline: granular daily texture (consistency / intensity reads at a
 * glance) instead of a single upward arc (momentum). See
 * `prompts/streak-hero-bar-chart-variant.md` for the rationale. */

function StreakDailyBars({
  cells,
  todayIso,
  toggle,
}: {
  cells: StreakActivity[]
  todayIso: string | undefined
  /** Activity-view toggle link rendered in the top-right of the eyebrow
   *  row. Switches between this 30-day chart and the `StreakWeekStrip`. */
  toggle?: React.ReactNode
}) {
  const oldestDate = cells[0]?.date
  const newestDate = cells[cells.length - 1]?.date
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        // Align top so the "Daily activity · 30 days" eyebrow lines up
        // with the eyebrows in Zone A + Zone C.
        justifyContent: 'flex-start',
        gap: 10,
        // No bottom padding — the previous `padding: '4px 0'` pushed
        // the axis ticks 4px above the zone's bottom edge, breaking
        // alignment with Zone A's caption and Zone C's "{n} days"
        // caption (both of which sit flush against the zone bottom).
      }}
    >
      {/* Pill toggle takes the place of the old "Daily activity · 30 days"
          eyebrow when V2 renders it inline. When V3 hoists the toggle
          to the card's absolute top-right corner, `toggle` is undefined
          here and we reserve a 28px gap so the bars below don't run
          underneath the absolute-positioned pill. */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          minHeight: toggle ? undefined : 28,
        }}
      >
        {toggle}
      </div>

      <ul
        role="group"
        aria-label="Daily activity intensity for the last 30 days"
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'flex',
          gap: 4,
          alignItems: 'flex-end',
          // Stretch to fill the remaining vertical space between the
          // eyebrow above and the axis ticks below. The 80px minimum
          // gives the chart a baseline presence even on the narrowest
          // card height; on the standard dashboard layout it grows to
          // match Zone A's height so the axis line below sits on the
          // same baseline as Zone A's "29 days to beat it" caption.
          flex: 1,
          minHeight: 80,
        }}
      >
        {cells.map((cell) => (
          <ActivityBar
            key={cell.date}
            cell={cell}
            isToday={cell.date === todayIso}
          />
        ))}
      </ul>

      <div
        aria-hidden
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: 'var(--font-body)',
          fontSize: 10,
          fontWeight: 400,
          color: 'var(--color-text-tertiary)',
        }}
      >
        <span>{oldestDate ? formatMonthDay(oldestDate) : '30d ago'}</span>
        <span>{newestDate ? `${formatMonthDay(newestDate)} · today` : 'Today'}</span>
      </div>
    </div>
  )
}

function ActivityBar({
  cell,
  isToday,
}: {
  cell: StreakActivity
  isToday: boolean
}) {
  // Fallback to `active ? 1 : 0` when the fixture / API hasn't shipped
  // `minutes` yet — keeps old snapshots and migration-window data
  // rendering as low-intensity instead of NaN-heights. The TODO on the
  // type still flags this as transition behaviour.
  const minutes = cell.minutes ?? (cell.active ? 1 : 0)
  const level = intensityLevelForMinutes(minutes)
  const { fill, hasBorder } = barAppearance(level, isToday)
  const heightPct = barHeightPct(level)
  const minLabel = level === 'none' ? 'inactive' : `${minutes} min`
  const labelText = `${formatMonthDay(cell.date)} — ${minLabel}${isToday ? ' · today' : ''}`
  return (
    <li
      role="img"
      aria-label={labelText}
      title={labelText}
      style={{
        flex: 1,
        height: `${heightPct}%`,
        background: fill,
        border: hasBorder ? '1px solid var(--color-border-subtle)' : 'none',
        borderRadius: '2px 2px 0 0',
        outline: isToday ? '2px solid var(--color-action)' : undefined,
        outlineOffset: isToday ? 1 : undefined,
        minWidth: 0,
      }}
    />
  )
}

/** Today always wins — a primary-700 fill plus the focus ring (added
 *  by the consumer). Other days map to a step on the brand primary
 *  ramp keyed off the intensity bucket. */
function barAppearance(
  level: IntensityLevel,
  isToday: boolean,
): { fill: string; hasBorder: boolean } {
  if (isToday) return { fill: 'var(--color-primary-700)', hasBorder: false }
  switch (level) {
    case 'none':
      return { fill: 'var(--color-neutral-100)', hasBorder: true }
    case 'low':
      return { fill: 'var(--color-primary-200)', hasBorder: false }
    case 'medium':
      return { fill: 'var(--color-primary-300)', hasBorder: false }
    case 'high':
      return { fill: 'var(--color-primary-400)', hasBorder: false }
    case 'veryHigh':
      return { fill: 'var(--color-primary-500)', hasBorder: false }
  }
}

/** Heights are tuned for readable rhythm across the 30-bar strip, not
 *  literal "minutes / 60 * 100" — the literal mapping produced too-flat
 *  days at the low end and too-similar tall bars at the high end. */
function barHeightPct(level: IntensityLevel): number {
  switch (level) {
    case 'none':
      return 15
    case 'low':
      return 40
    case 'medium':
      return 65
    case 'high':
      return 85
    case 'veryHigh':
      return 100
  }
}

/* ── Zone C — This-week 7-bar strip ──────────────────────────────── */

const WEEK_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const
const WEEK_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const

function StreakWeekStrip({
  week,
  daysThisWeek,
  todayIso,
  toggle,
}: {
  week: ReadonlyArray<StreakActivity>
  daysThisWeek: number
  todayIso: string
  /** Activity-view toggle link rendered in the top-right of the eyebrow
   *  row. Switches between this week strip and `StreakDailyBars`. */
  toggle?: React.ReactNode
}) {
  // Source-of-truth check — see `streak-hero-handoff.md` § "Edge cases".
  // If the array disagrees with `daysThisWeek`, prefer the array and
  // log a one-shot warning in dev so the data-team can chase it down.
  const activeFromArray = week.filter((c) => c.active).length
  if (import.meta.env.DEV && activeFromArray !== daysThisWeek) {
    // eslint-disable-next-line no-console
    console.warn(
      `[StreakWeekStrip] daysThisWeek (${daysThisWeek}) disagrees with active count in week array (${activeFromArray}); rendering the array.`,
    )
  }
  return (
    <div
      role="group"
      aria-label={`This week — ${activeFromArray} of 7 days active`}
      style={{
        // flex:1 so the strip fills the remaining row width now that it
        // renders alone (no more sibling 30-day chart). minWidth keeps
        // the bars legible on the narrowest viewports.
        flex: 1,
        minWidth: 170,
        display: 'flex',
        flexDirection: 'column',
        // Align top so the "This week" eyebrow sits on the same
        // baseline as the eyebrow in the active sibling zone.
        justifyContent: 'flex-start',
        gap: 8,
      }}
    >
      {/* Pill toggle takes the place of the old "This week" eyebrow
          when V2 renders it inline. V3 hoists the toggle to the
          card's absolute top-right; `toggle` is undefined here and
          the 28px spacer keeps the bars from running under the
          absolute-positioned pill. */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          minHeight: toggle ? undefined : 28,
        }}
      >
        {toggle}
      </div>
      {/* Bottom group — day labels + bars + the "{n} days" caption
          sit together at the bottom of the zone so the bars land on
          the same baseline as the streak hero block on the left.
          When `toggle` is provided (V2 inline mode), maxWidth 280
          keeps the legacy square cells from ballooning. When `toggle`
          is undefined (V3 hoists it to the card's absolute top-right),
          the strip spans the full container width so its right edge
          lines up with the "This Week" pill's right edge. The bars
          stretch / shrink with the column. */}
      <div
        style={{
          marginTop: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          ...(toggle ? { maxWidth: 280 } : null),
        }}
      >
        <div
          aria-hidden
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 5,
            fontFamily: 'var(--font-body)',
            fontSize: 10,
            fontWeight: 500,
            color: 'var(--color-text-tertiary)',
            textAlign: 'center',
          }}
        >
          {WEEK_LABELS.map((label, i) => (
            <span key={i}>{label}</span>
          ))}
        </div>
        {/* Vertical bars — bottom-aligned heatmap rhythm that mirrors
            the 30-day daily-activity chart's bar treatment, so flipping
            the toggle no longer reads as switching chart genres.
            Heights: today 36, active 28, inactive 8 — distinguishes
            "did something" from "did nothing" at a glance. Today wins
            on both height AND a darker primary-700 fill (no outline
            anymore — the size + color do the work). */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 6,
            height: 44,
          }}
        >
          {week.map((cell, i) => {
            const isToday = cell.date === todayIso
            const stateLabel = cell.active ? 'active' : isToday ? 'not yet' : 'inactive'
            const todaySuffix = isToday ? ' · today' : ''
            const background = isToday
              ? 'var(--color-primary-700)'
              : cell.active
                ? 'var(--color-primary-500)'
                : 'var(--color-neutral-100)'
            const height = isToday ? 36 : cell.active ? 28 : 8
            return (
              <span
                key={cell.date}
                role="img"
                aria-label={`${WEEK_NAMES[i]} ${formatMonthDay(cell.date)} — ${stateLabel}${todaySuffix}`}
                title={`${WEEK_NAMES[i]} ${formatMonthDay(cell.date)} — ${stateLabel}${todaySuffix}`}
                data-today={isToday || undefined}
                style={{
                  flex: 1,
                  height,
                  background,
                  // Slightly rounder top than bottom — gives the bar a
                  // "growing from the baseline" silhouette without
                  // reading as a pill.
                  borderRadius: '4px 4px 2px 2px',
                }}
              />
            )
          })}
        </div>
        {/* Bottom caption — mirrors Zone A's "29 days to beat it" and
            Zone B's "May 20 · today" axis tick in size + color so all
            three zones close on the same row of tertiary metadata. */}
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 10,
            fontWeight: 400,
            lineHeight: '14px',
            color: 'var(--color-text-tertiary)',
            paddingTop: 2,
          }}
        >
          {activeFromArray} day{activeFromArray === 1 ? '' : 's'}
        </span>
      </div>
    </div>
  )
}

/* ─── 2. Paths & Licenses ───────────────────────────────────────────── */

function PathsAndLicensesSection({
  layout,
  variant,
}: {
  layout: 'wide' | 'three-up'
  variant: 'v2' | 'v3'
}) {
  const isV3 = variant === 'v3'
  const { openPanel } = useLearningPathsPanel()
  const items = useLearningPathCardsForBrand()
  // Show ONE card on the dashboard — off-track paths are promoted
  // to the top so a struggling learner sees the urgent path first.
  // The total count in the header still reflects the full set;
  // "View All →" opens the same shared slide-over panel that the
  // Header's "My Learning > Learning Paths" dropdown opens, where
  // the user can see all of their paths at once.
  const visible = sortAndLimitPaths(items, 1)
  const topPath = visible[0]

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* V2's three-up layout drops the section heading — each of the
          three cards carries its own in-card eyebrow (Learning Paths /
          Courses in Progress / Quick Links), and the LP card's eyebrow
          now hosts the "View All →" action that this heading used to
          carry. V1's wide layout keeps the heading. */}
      {layout !== 'three-up' && (
        <SectionHeading
          label={`Learning Paths (${items.length})`}
          onViewAllClick={openPanel}
        />
      )}
      {layout === 'three-up' ? (
        // V2 — Jump Back In · Learning Path (compact) · Courses summary.
        // Quick Links moved to the right sidebar. Auto-fit + minmax keeps
        // the cards reflowing gracefully on narrower main columns (the
        // dashboard's right sidebar can squeeze this column down to
        // ~600px → 2-up; ~360px → 1-up).
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 12,
            alignItems: 'stretch',
          }}
        >
          <JumpBackInCard />
          {topPath ? (
            <LearningPathCard
              data={topPath}
              variant={isV3 ? 'compact-v3' : 'compact'}
              pathsCount={items.length}
              onViewAll={openPanel}
            />
          ) : (
            <div style={EMPTY_STYLE}>
              No active paths yet —{' '}
              <Link to="/catalog" className="cre-link-action" style={LINK_STYLE}>
                explore the catalog →
              </Link>
            </div>
          )}
          {isV3 ? <CoursesSummaryCardV3 /> : <CoursesSummaryCard />}
        </div>
      ) : visible.length === 0 ? (
        <div style={EMPTY_STYLE}>
          No active paths yet —{' '}
          <Link to="/catalog" className="cre-link-action" style={LINK_STYLE}>
            explore the catalog →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {visible.map((item) => (
            <LearningPathCard key={item.id} data={item} />
          ))}
        </div>
      )}
    </section>
  )
}

/** Sort + cap helper for the dashboard's Learning Paths section.
 *  Priority order:
 *    1. Off-track paths (status of `at-risk`, `behind`, or `expired`)
 *       float to the top so the learner notices them first.
 *    2. Inside each bucket, sort by `lastActivityDays` ascending —
 *       smaller values = more recently accessed. `null` (never started)
 *       sinks to the bottom of its bucket.
 *  After sorting, slice down to `limit` (2 on the dashboard). The full
 *  list is still reachable via the "View All →" link in the section
 *  header, which routes to the dedicated Learning Path page. */
function sortAndLimitPaths(
  items: LearningPathCardData[],
  limit: number,
): LearningPathCardData[] {
  return [...items]
    .sort((a, b) => {
      const aOff = isOffTrack(a.status)
      const bOff = isOffTrack(b.status)
      if (aOff !== bOff) return aOff ? -1 : 1
      const aDays = a.lastActivityDays ?? Number.POSITIVE_INFINITY
      const bDays = b.lastActivityDays ?? Number.POSITIVE_INFINITY
      return aDays - bDays
    })
    .slice(0, limit)
}

function isOffTrack(status: LearningPathStatus): boolean {
  return status === 'at-risk' || status === 'behind' || status === 'expired'
}

/* ─── 3. Achievements ──────────────────────────────────────────────────
 *
 * Renders as `<AchievementsWidget />` above. The legacy MilestonesSection
 * + MilestonePill + rampForMilestone helpers were retired here in favor
 * of the dedicated widget module; see
 * `src/components/dashboard/AchievementsWidget.tsx` for the replacement.
 */

/* ─── Shared bits ────────────────────────────────────────────────────── */

function SectionHeading({
  label,
  viewAllHref,
  onViewAllClick,
}: {
  label: string
  /** Set when the "View All" link should navigate. Mutually exclusive
   *  with `onViewAllClick`. */
  viewAllHref?: string
  /** Set when "View All" should fire a callback instead of navigating —
   *  used by the Learning Paths section to open the slide-over panel. */
  onViewAllClick?: () => void
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: 'var(--color-text-secondary)',
        }}
      >
        {label}
      </span>
      {onViewAllClick ? (
        <button
          type="button"
          onClick={onViewAllClick}
          className="cre-link-action"
          style={{ ...LINK_STYLE, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          View All →
        </button>
      ) : viewAllHref ? (
        <Link to={viewAllHref} className="cre-link-action" style={LINK_STYLE}>
          View All →
        </Link>
      ) : null}
    </div>
  )
}

const LINK_STYLE = {
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-action)',
  textDecoration: 'none',
} as const

const EMPTY_STYLE: React.CSSProperties = {
  padding: '24px 16px',
  textAlign: 'center',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  color: 'var(--color-text-secondary)',
}

/* ─── Hooks + helpers ─────────────────────────────────────────────── */

/** Animate a number from 0 to `target` over `durationMs`. Snaps instantly
 * when the user prefers reduced motion. */
function useCountUp(target: number, durationMs: number): number {
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') return target
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    return mql.matches ? target : 0
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mql.matches) {
      setValue(target)
      return
    }
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const elapsed = now - start
      const t = Math.min(1, elapsed / durationMs)
      // Ease-out cubic so the count slows into the final value.
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(Math.round(target * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, durationMs])

  return value
}

function formatMonthDay(iso: string): string {
  const [, m, d] = iso.split('-').map((s) => parseInt(s, 10))
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[m - 1]} ${d}`
}

