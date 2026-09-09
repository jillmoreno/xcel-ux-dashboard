import { type CSSProperties, type KeyboardEvent, type ReactNode, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Megaphone } from '@/icons'
import { CarouselArrow } from '@/components/ui/CarouselArrow'
import { useAccount } from '@/context/AccountContext'
import { useCourseLauncher } from '@/components/layout/CourseLauncherContext'
import { useDeviceFrame } from '@/components/layout/DeviceFrameContext'
import { useTheme } from '@/context/ThemeContext'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import {
  statusTreatment,
  type HomeStatus,
  type StatusTaxonomy, CURRENT_LEARNING_EYEBROW } from '@/components/learning/learningPathsHomeUtil'
import type { CourseCardData } from '@/components/courses/CourseCard'
import type { LearningPathSummary } from '@/data/learningFixtures'
import { LICENSE_TRACKER } from '@/data/dashboardFixtures'
import { myCoursesFor } from '@/data/myCoursesFixtures'
import { CAT_MANDATORY_COLOR, CAT_ELECTIVE_COLOR } from '@/components/learning/progressGauge'
import { whatsNewFeaturedFor } from '@/data/membership/whatsNewFeaturedFixtures'
import { getCourseImage } from '@/utils/courseImage'
import { CardBadgeOverlay } from '../badged/CardBadgeOverlay'
import { deriveCardBadges } from '../badged/cardBadges'
import { CompletedCelebration, type CompletedStat } from './CompletedCelebration'

/**
 * MarketingFocusedBand — the "Marketing Focused" dashboard version's top section
 * (Figma node 23:11118). One seamless card split into two halves:
 *   - LEFT (navy `primary-600`): a compact Current Learning Path column — a white
 *     summary card (title + On Track status + two-segment progress + Mandatory /
 *     Elective legend + Details), a Deadline / Time Remaining stat-card row, and a
 *     white Jump Back In card.
 *   - RIGHT (deep navy `primary-800`): **What's New** — a full-bleed rotating
 *     marketing carousel (the space the Jump Back In half occupies in Learner
 *     Focused) with dot navigation. Slides are the Elite `whatsNewFeaturedFor`
 *     announcements rendered as brand-gradient marketing panels; brands with no
 *     slides fall back to the reserved "image carousel" empty state.
 *
 * Mirrors `LearnerFocusedBand`'s joined-card shell + tokened palette; every color
 * resolves to a brand token so the navy/magenta/green relight per `data-brand`.
 */
type Props = {
  path: LearningPathSummary
  /** Course to resume (Jump Back In); falls back to the brand's first
   *  in-progress course. */
  course?: CourseCardData
  /** Opens the Learning Path detail panel from "Details". */
  onViewDetails?: () => void
  /** Opens the Learning Path section in-shell (clicking the Current Learning
   *  Path card) — drilled into this path's detail via its id. When omitted,
   *  falls back to routing to `/my-learning/path`. */
  onOpenLearningPath?: (pathId: string) => void
  /** Full-bleed hero treatment (`dashboard-hero-bleed`): stretch to the header +
   *  both screen edges, dropping the card radius + shadow. */
  bleed?: boolean
  /** How the two halves present (`marketing-band-layout`):
   *  - `joined` (default) — one seamless card, the two halves flush.
   *  - `separate` — two standalone widget cards with a gap between them; the
   *    What's New card goes full-bleed (its framing padding removed) so the
   *    spacing reads evenly. */
  layout?: 'joined' | 'separate'
  /** What's New slide background (`whats-new-image`): `false` (default) keeps the
   *  rotating brand-gradient panels; `true` lays a stock photo behind each slide
   *  under a darkening scrim. */
  whatsNewImage?: boolean
  /** "Badged Version" — overlay a tier + status badge on the What's New slide. */
  badged?: boolean
  /** Explicit status (from the `dashboard-progress-state` persona) — drives the
   *  Current Learning Path status pill instead of re-deriving from the license
   *  tracker. When omitted the band computes its own On/At/Off status. */
  statusOverride?: HomeStatus
  /** Demo renewal override (persona): the Deadline + Time Remaining cells. */
  renewal?: { deadline: string; weeksLeft: number }
  /** Renewal-ready treatment (100% complete): the green completed celebration
   *  replaces the Current Learning Path column (the What's New carousel stays). */
  renewalReady?: boolean
  /** Interest / modality chips shown on the populated CLP right after the setup
   *  wizard completes. */
  interestChips?: string[]
  /** Opens the Certificates page (completed state's secondary "View Certificate"). */
  onViewCertificate?: () => void
  /** Jump Back In slot mode (persona-driven). `discovery` = nothing to resume or
   *  launch (completed-empty / new-empty). In the Marketing Focused band the
   *  carousel occupies the old Jump Back In half, so a discovery state has no home
   *  yet — the CLP-side slot renders a disabled "Coming soon" stub (design
   *  follow-up: the discovery treatment beside a smaller Jump Back In widget). */
  jumpBackInMode?: 'resume' | 'up-next' | 'discovery'
  /** Copy tone for the discovery stub (`completed` = all caught up · `new` = get
   *  started). */
  discoveryTone?: 'completed' | 'new'
}

const ON_DARK = 'rgb(255 255 255 / 1)'

// Full-bleed hero: cancel the shell's 24px top + 40px left gutters and cross the
// empty right filler beyond the 1440px content cap (matches DashboardRecommended
// -Band's bleed math) so the band runs header-to-edge like a hero.
const HERO_BLEED: CSSProperties = {
  marginTop: -24,
  marginLeft: -40,
  marginRight: 'calc(-40px - max(0px, (100vw - 1440px)))',
  borderRadius: 0,
  boxShadow: 'none',
}
const CARD_SHADOW = '0 2px 10px color-mix(in srgb, var(--color-primary-900) 35%, transparent)'
const META_DIVIDER = 'color-mix(in srgb, var(--color-primary-900) 30%, transparent)'
// Widget-card chrome for the `separate` layout — each half becomes a standalone
// card (matches the joined band's radius + shadow).
const BAND_SHADOW = '0 18px 40px -18px color-mix(in srgb, var(--color-primary-900) 55%, transparent)'
const SEPARATE_CARD: CSSProperties = {
  borderRadius: 'var(--radius-lg)',
  boxShadow: BAND_SHADOW,
  overflow: 'hidden',
}

const DELIVERY_LABEL: Record<string, string> = {
  online: 'Online',
  'in-person': 'In Person',
  classroom: 'Classroom',
  video: 'Video',
  podcast: 'Podcast',
}

const eyebrowOnDark: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: ON_DARK,
}

const statCaption: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--color-text-secondary)',
}

export function MarketingFocusedBand({
  path,
  course,
  onViewDetails,
  onOpenLearningPath,
  bleed = false,
  layout = 'joined',
  whatsNewImage = false,
  badged = false,
  statusOverride,
  renewal,
  renewalReady = false,
  interestChips,
  onViewCertificate,
  jumpBackInMode,
  discoveryTone = 'completed',
}: Props) {
  const { brand } = useAccount()
  const launcher = useCourseLauncher()
  const navigate = useNavigate()
  // Current Learning Path card → the Learning Path section. In the rebrand shell
  // `onOpenLearningPath` switches the section in place (left nav stays); outside
  // it (fallback) route to the standalone learning path page.
  const openLearningPath = onOpenLearningPath
    ? () => onOpenLearningPath(path.id)
    : () => navigate(`/my-learning/path?id=${path.id}`)
  // Stack the two halves vertically — the navy Current Learning Path column
  // above the marketing carousel — on any narrow frame (phone OR tablet), where
  // the side-by-side split gets too cramped to read. `mobile` additionally
  // triggers the full-bleed edge treatment (the mobile shell's 16px gutter);
  // tablet keeps the normal desktop-gutter card, just single-column.
  const device = useDeviceFrame().device
  const mobile = device === 'mobile'
  const stack = mobile || device === 'tablet'
  // The white Current Learning Path card flips to navy in dark mode, so the
  // magenta "Details" link needs to lighten to keep AA contrast.
  const detailsLinkColor =
    useTheme().theme === 'dark' ? 'var(--color-cta-300)' : 'var(--color-cta-500)'
  // Status label taxonomy (compliance ⇄ status), shared with the Learning Path
  // surfaces via the `learning-paths-status-taxonomy` flag.
  const statusTaxonomy = (useFeatureFlag('learning-paths-status-taxonomy').variant ??
    'compliance') as StatusTaxonomy
  // `separate` splits the joined card into two standalone widget cards with a
  // gap. Only on desktop — stacked (phone/tablet) frames keep the joined card.
  const separate = layout === 'separate' && !stack

  // Card treatment on the navy left column, pinned to the default `solid` (opaque
  // white cards, dark text). The `marketing-band-card-style` flag that offered the
  // glass / frosted variants was removed 2026-08-17 — the Marketing Focused band
  // is archived and only renders in a dev-handoff preview. `glass` / `frosted` are
  // kept as `boolean` false so the treatment branches below stay intact for a
  // future restore.
  const glass: boolean = false
  const frosted: boolean = false
  const cardSurface = glass
    ? 'rgb(255 255 255 / 0.07)'
    : frosted
      ? 'rgb(255 255 255 / 0.86)'
      : 'var(--color-surface-card)'
  const cardBorder = glass ? '1px solid rgb(255 255 255 / 0.14)' : undefined
  const cardBoxShadow = glass ? 'none' : CARD_SHADOW
  // Text: glass flips to white; solid + frosted keep the dark tokens (frost is
  // light enough — 86% white over navy — that dark text still clears AA).
  const cardText = glass ? ON_DARK : 'var(--color-text-primary)'
  const cardTextMuted = glass ? 'rgb(255 255 255 / 0.72)' : 'var(--color-text-secondary)'
  const cardTrack = glass ? 'rgb(255 255 255 / 0.16)' : 'var(--color-neutral-200)'
  const cardDivider = glass ? 'rgb(255 255 255 / 0.28)' : META_DIVIDER
  const cardDetailsColor = glass ? 'var(--color-cta-300)' : detailsLinkColor

  const resume = course ?? myCoursesFor(brand).find((c) => c.myStatus === 'in-progress')
  // Discovery states (completed-empty / new-empty) have nothing to resume — and
  // the What's New carousel took the Jump Back In half — so the CLP-side slot
  // shows a "Coming soon" stub (design follow-up) rather than a fallback course.
  const isDiscovery = jumpBackInMode === 'discovery'

  const mandatory = path.mandatory ?? { completed: 0, required: 0 }
  const elective = path.elective ?? { completed: 0, required: 0 }
  const totalRequired = mandatory.required + elective.required
  const totalCompleted = mandatory.completed + elective.completed
  const percent = totalRequired > 0 ? Math.round((totalCompleted / totalRequired) * 100) : path.progressPct
  const hasBreakdown = [mandatory, elective].filter((c) => c.required > 0).length >= 2
  // Education-type-aware labels (CE defaults when the path omits them).
  const mandatoryLabel = path.mandatoryLabel ?? 'Mandatory'
  const electiveLabel = path.electiveLabel ?? 'Elective'
  const deadlineLabel = path.deadlineLabel ?? 'License Expires'

  // Time Remaining — persona renewal override, else the global license tracker.
  const weeksLeft = renewal?.weeksLeft ?? LICENSE_TRACKER.weeksLeft
  // License Expires — always the global license tracker date, rendered
  // month-name to match the Details sheet (`LearningPathDetailPanel`).
  const expiresMonth =
    LICENSE_TRACKER.expires.month.charAt(0) + LICENSE_TRACKER.expires.month.slice(1, 3).toLowerCase()
  const years = Math.floor(weeksLeft / 52)
  const remWeeks = weeksLeft % 52

  const onTrack = percent >= 50 || weeksLeft > 16
  // Explicit persona status wins; otherwise map the derived tracker state to a
  // shared HomeStatus so the label honors the "Status Labels" taxonomy flag
  // (compliance ⇄ status). Colors + label + Expired/Not-Started/Completed
  // treatment come from the shared statusTreatment (the same source the badge +
  // Details panel use) — so all six states render correctly (previously
  // not-started/expired/completed all fell through to green here).
  const homeStatus: HomeStatus =
    statusOverride ?? (onTrack ? 'on-track' : weeksLeft >= 6 ? 'at-risk' : 'off-track')
  const status = statusTreatment(homeStatus, statusTaxonomy)

  const meta = [path.category, ...(path.state ? [path.state] : [])]
  const resumePct = typeof resume?.progress === 'number' ? resume.progress : 0

  // Completed celebration stats (Option 5) — reused when renewalReady replaces
  // the Current Learning Path column with the green success panel.
  const completedStats: CompletedStat[] = [
    ...(hasBreakdown
      ? [
          { label: mandatoryLabel, value: `${mandatory.completed} / ${mandatory.required}` },
          { label: electiveLabel, value: `${elective.completed} / ${elective.required}` },
        ]
      : []),
    { label: deadlineLabel, value: `${expiresMonth} ${LICENSE_TRACKER.expires.day}, ${LICENSE_TRACKER.expires.year}` },
    { label: 'Time Remaining', value: years > 0 ? `${years} yr, ${remWeeks} wks` : `${remWeeks} wks` },
  ]

  // Two-segment bar widths (share of total required hours completed).
  const mandatoryPct = totalRequired > 0 ? (mandatory.completed / totalRequired) * 100 : 0
  const electivePct = totalRequired > 0 ? (elective.completed / totalRequired) * 100 : 0

  return (
    <section
      aria-label="Your learning"
      className="cre-marketing-focused-band"
      style={{
        display: 'grid',
        gridTemplateColumns: stack ? 'minmax(0, 1fr)' : 'minmax(0, 432fr) minmax(0, 562fr)',
        // `separate` puts a real gap between the two widget cards; joined keeps
        // them flush (a single seamless card).
        gap: separate ? 20 : 0,
        ...(mobile
          ? { marginLeft: -16, marginRight: -16, borderRadius: 0 }
          : bleed
            ? HERO_BLEED
            : separate
              ? // chrome lives on each child card in this layout
                {}
              : {
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: BAND_SHADOW,
                }),
        // Joined = one clipped card; separate = each child clips itself.
        overflow: separate ? 'visible' : 'hidden',
      }}
    >
      {/* ── LEFT · Current Learning Path column ── completed → the green
          celebration panel (with a secondary "View Certificate" under the
          details); otherwise the compact navy CLP column. */}
      {renewalReady ? (
        <CompletedCelebration
          title={path.title}
          creditHoursTotal={totalRequired || path.hours}
          stats={completedStats}
          onViewCertificate={onViewCertificate}
          onViewDetails={onViewDetails}
          style={separate ? SEPARATE_CARD : undefined}
        />
      ) : (
      <div
        style={{
          background: 'var(--color-primary-600)',
          padding: '22px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          ...(separate ? SEPARATE_CARD : null),
        }}
      >
        <p style={eyebrowOnDark}>{CURRENT_LEARNING_EYEBROW}</p>

        {/* White summary card — clickable (→ learning path page) with a
            hover drop-shadow. The `.cre-clp-card` class owns the base + hover
            shadow (a CSS `:hover` can't override an inline box-shadow). */}
        <div
          role="button"
          tabIndex={0}
          aria-label={`Open ${path.title}`}
          onClick={openLearningPath}
          onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              openLearningPath()
            }
          }}
          className="cre-clp-card"
          style={{
            background: cardSurface,
            border: cardBorder,
            borderRadius: 10,
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <p
                style={{
                  flex: 1,
                  minWidth: 0,
                  margin: 0,
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 700,
                  fontSize: 20,
                  lineHeight: '24px',
                  color: cardText,
                }}
              >
                {path.title}
              </p>
              <span
                style={{
                  flex: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-pill)',
                  background: status.outline ? 'transparent' : status.fill,
                  boxShadow: status.outline ? `inset 0 0 0 1px ${status.border}` : undefined,
                  color: status.text,
                  fontFamily: 'var(--font-body)',
                  fontSize: 12,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                {status.icon && <status.icon size={12} aria-hidden />}
                {status.label}
              </span>
            </div>
            {/* meta line */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 8,
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                color: cardText,
              }}
            >
              {meta.map((m, i) => (
                <span key={m} style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
                  {i > 0 && <span aria-hidden style={{ width: 1, height: 12, background: cardDivider }} />}
                  {m}
                </span>
              ))}
            </div>
          </div>

          {/* percent + credit hours + two-segment bar */}
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                fontSize: 30,
                color: cardText,
                whiteSpace: 'nowrap',
              }}
            >
              {percent}%
            </p>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
              <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 13, color: cardTextMuted }}>
                {totalCompleted} / {totalRequired || path.hours} credit hours
              </p>
              <div
                style={{
                  display: 'flex',
                  height: 10,
                  width: '100%',
                  borderRadius: 'var(--radius-pill)',
                  background: cardTrack,
                  overflow: 'hidden',
                }}
              >
                <span style={{ width: `${mandatoryPct}%`, background: CAT_MANDATORY_COLOR }} />
                <span style={{ width: `${electivePct}%`, background: CAT_ELECTIVE_COLOR }} />
              </div>
            </div>
          </div>

          {/* legend + Details link */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            {hasBreakdown && (
              <>
                <LegendDot color={CAT_MANDATORY_COLOR} textColor={cardTextMuted} label={`${mandatoryLabel} ${mandatory.completed}/${mandatory.required}`} />
                <LegendDot color={CAT_ELECTIVE_COLOR} textColor={cardTextMuted} label={`${electiveLabel} ${elective.completed}/${elective.required}`} />
              </>
            )}
            {onViewDetails && (
              <button
                type="button"
                onClick={(e) => {
                  // Don't also fire the card's navigate — Details opens the
                  // right-side detail panel instead.
                  e.stopPropagation()
                  onViewDetails()
                }}
                className="cre-link-action"
                style={{ ...linkBtn, marginLeft: 'auto', color: cardDetailsColor }}
              >
                Details →
              </button>
            )}
          </div>
        </div>

        {/* Interest / modality chips (shown right after the setup wizard). */}
        {interestChips && interestChips.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {interestChips.slice(0, 4).map((c) => (
              <span
                key={c}
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 11,
                  fontWeight: 700,
                  background: 'rgb(255 255 255 / 0.16)',
                  color: ON_DARK,
                  borderRadius: 'var(--radius-sm)',
                  padding: '4px 9px',
                }}
              >
                {c}
              </span>
            ))}
          </div>
        )}

        {/* Deadline / Time Remaining stat cards */}
        <div style={{ display: 'flex', gap: 12 }}>
          <StatCard
            caption={deadlineLabel}
            surface={cardSurface}
            border={cardBorder}
            boxShadow={cardBoxShadow}
            captionColor={cardTextMuted}
            valueColor={cardText}
          >
            {expiresMonth} {LICENSE_TRACKER.expires.day}
            <span style={{ marginLeft: 3, fontSize: 12, fontWeight: 600, color: cardTextMuted }}>
              {LICENSE_TRACKER.expires.year}
            </span>
          </StatCard>
          <StatCard
            caption="Time Remaining"
            surface={cardSurface}
            border={cardBorder}
            boxShadow={cardBoxShadow}
            captionColor={cardTextMuted}
            valueColor={cardText}
          >
            {years > 0 && (
              <>
                <strong style={{ fontWeight: 700 }}>{years}</strong>
                <span style={{ fontSize: 12, fontWeight: 600, color: cardTextMuted }}>
                  {years === 1 ? ' year, ' : ' years, '}
                </span>
              </>
            )}
            <strong style={{ fontWeight: 700 }}>{remWeeks}</strong>
            <span style={{ fontSize: 12, fontWeight: 600, color: cardTextMuted }}> wks</span>
          </StatCard>
        </div>

        {/* Renewal-ready card (100% complete) — replaces Jump Back In. */}
        {renewalReady ? (
          <div
            style={{
              background: cardSurface,
              border: cardBorder,
              borderRadius: 10,
              boxShadow: cardBoxShadow,
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <p style={{ ...statCaption, color: glass ? 'var(--color-success-200)' : 'var(--color-status-success-text)' }}>Requirements met</p>
            <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 13, color: cardTextMuted }}>
              You&apos;ve completed all required CE for this renewal cycle — you&apos;re renewal-ready.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" onClick={() => console.info('cta:view-certificate')} style={resumeCtaStyle}>
                View certificate
              </button>
              <button
                type="button"
                onClick={() => console.info('cta:start-next-cycle')}
                style={{ ...linkBtn, alignSelf: 'center', color: cardDetailsColor }}
              >
                Start next cycle →
              </button>
            </div>
          </div>
        ) : isDiscovery ? (
          /* Discovery (completed-empty / new-empty) — the CLP-side slot for the
             future smaller Jump Back In widget isn't designed yet. Ship a disabled
             "Coming soon" placeholder so the state reads intentionally-empty rather
             than falling back to a stray in-progress course. */
          <div
            aria-disabled
            style={{
              background: glass ? 'rgb(255 255 255 / 0.05)' : 'rgb(255 255 255 / 0.5)',
              border: `1px dashed ${glass ? 'rgb(255 255 255 / 0.3)' : 'var(--color-neutral-300)'}`,
              borderRadius: 10,
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              opacity: 0.85,
            }}
          >
            <p style={{ ...statCaption, color: cardTextMuted }}>
              {discoveryTone === 'completed' ? 'All caught up' : 'Get started'}
            </p>
            <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 13, color: cardTextMuted }}>
              {discoveryTone === 'completed'
                ? "You've finished everything in this path."
                : 'Nothing queued up yet.'}{' '}
              A recommendations widget for this slot is coming soon.
            </p>
            <span
              style={{
                alignSelf: 'flex-start',
                fontFamily: 'var(--font-body)',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: cardTextMuted,
                background: glass ? 'rgb(255 255 255 / 0.12)' : 'var(--color-neutral-100)',
                borderRadius: 'var(--radius-sm)',
                padding: '3px 8px',
              }}
            >
              Coming soon
            </span>
          </div>
        ) : (
          /* Jump Back In card */
          resume && (
          <div
            style={{
              background: cardSurface,
              border: cardBorder,
              borderRadius: 10,
              boxShadow: cardBoxShadow,
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <p style={{ ...statCaption, color: cardTextMuted }}>Jump Back In</p>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div
                aria-hidden
                style={{
                  width: 60,
                  height: 60,
                  flex: 'none',
                  borderRadius: 8,
                  background: `center / cover no-repeat url(${resume.imageUrl ?? getCourseImage(resume.id)})`,
                }}
              />
              <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <p
                  style={{
                    margin: 0,
                    fontFamily: 'var(--font-body)',
                    fontWeight: 700,
                    fontSize: 14,
                    lineHeight: '17px',
                    color: cardText,
                  }}
                >
                  {resume.title}
                </p>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: 6,
                    fontFamily: 'var(--font-body)',
                    fontSize: 12,
                    color: cardTextMuted,
                  }}
                >
                  {[
                    DELIVERY_LABEL[resume.delivery] ?? 'Online',
                    resume.badge === 'mandatory' ? 'Mandatory' : 'Elective',
                    `${resume.hours} hrs`,
                    ...(path.state ? [path.state] : []),
                  ].map((m, i) => (
                    <span key={m} style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                      {i > 0 && <span aria-hidden style={{ width: 1, height: 11, background: cardDivider }} />}
                      {m}
                    </span>
                  ))}
                </div>
                {/* "% Complete" + the Resume CTA share this bottom row, so the
                    button's top aligns with the "% Complete" line. It's below
                    the title/meta rows, so it doesn't steal their width — the
                    title still fits on one line. */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, color: cardText }}>
                    {resumePct}% Complete
                  </p>
                  <button
                    type="button"
                    onClick={() => launcher.open(resume.id)}
                    style={resumeCtaStyle}
                  >
                    Resume <ArrowRight size={14} aria-hidden />
                  </button>
                </div>
              </div>
            </div>
          </div>
          )
        )}
      </div>
      )}

      {/* ── RIGHT · deep navy · What's New marketing carousel ── */}
      <div
        style={{
          background: 'var(--color-primary-800)',
          // Separate: drop the framing padding so the carousel fills its own
          // card edge-to-edge (the gap between the two widgets does the spacing).
          padding: separate ? 0 : 22,
          display: 'flex',
          flexDirection: 'column',
          gap: separate ? 0 : 16,
          minHeight: stack ? 320 : undefined,
          position: separate ? 'relative' : undefined,
          ...(separate ? SEPARATE_CARD : null),
        }}
      >
        {separate ? (
          // Full-bleed card: overlay the label on the carousel instead of
          // reserving a padded row above it.
          <p style={{ ...eyebrowOnDark, position: 'absolute', top: 22, left: 20, zIndex: 2 }}>What's New</p>
        ) : (
          <p style={eyebrowOnDark}>What's New</p>
        )}
        <MarketingCarousel brand={brand} fullBleed={separate} image={whatsNewImage} badged={badged} />
      </div>
    </section>
  )
}

/* ─── marketing carousel ─────────────────────────────────────────────── */

// Per-slide brand-gradient backgrounds (rotated by index) so each announcement
// reads as a distinct marketing panel without shipping licensed photography.
const SLIDE_GRADIENTS = [
  'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-900))',
  'linear-gradient(135deg, var(--color-secondary-600), var(--color-primary-800))',
  'linear-gradient(135deg, var(--color-cta-500), var(--color-cta-600))',
  'linear-gradient(135deg, var(--color-primary-700), var(--color-secondary-800))',
]

// Stock backgrounds for the `image` variant — one per slide, rotated by index
// so each announcement carries a distinct photo. A brand-tinted dark gradient
// rides on top so the light photos never wash out the white copy.
//
// Brand-aware: the healthcare set (Pexels, free license) suits Elite/Fitzgerald;
// the real-estate / professional stock already shipped in `/public/courses` fits
// the CRE + McKissock (real estate / appraisal) and STC (financial services)
// brands far better than clinical photos. Kept per-brand so each brand's What's
// New carousel reads on-theme instead of falling back to healthcare imagery.
const ELITE_SLIDE_IMAGES = [
  '/brand/whats-new-bg.jpg', // stethoscope + mask flat-lay
  '/brand/whats-new-bg-2.jpg', // blood-pressure check
  '/brand/whats-new-bg-3.jpg', // clinician portrait
  '/brand/whats-new-bg-4.jpg', // ICU patient monitor
]
const XCEL_SLIDE_IMAGES = ['/courses/7.webp', '/courses/2.webp', '/courses/5.webp', '/courses/1.webp']

const SLIDE_IMAGES_BY_BRAND: Record<ReturnType<typeof useAccount>['brand'], string[]> = {
  xcel: XCEL_SLIDE_IMAGES,
}
const SLIDE_IMAGE_SCRIM =
  'linear-gradient(120deg, color-mix(in srgb, var(--color-primary-900) 82%, transparent), color-mix(in srgb, var(--color-primary-800) 55%, transparent))'

function MarketingCarousel({
  brand,
  fullBleed = false,
  image = false,
  badged = false,
}: {
  brand: ReturnType<typeof useAccount>['brand']
  /** Fill the parent card edge-to-edge (the `separate` layout): drop the slide's
   *  own radius + framing and overlay the dots instead of stacking them below. */
  fullBleed?: boolean
  /** Lay the stock photo behind each slide (under a scrim) instead of the
   *  rotating brand-gradient panels. */
  image?: boolean
  /** "Badged Version" — overlay a tier + status badge on the active slide. */
  badged?: boolean
}) {
  const slides = whatsNewFeaturedFor(brand)
  const slideImages = SLIDE_IMAGES_BY_BRAND[brand] ?? ELITE_SLIDE_IMAGES
  const [index, setIndex] = useState(0)

  if (slides.length === 0) {
    // Reserved "image carousel" empty state (Figma 23:11189).
    return (
      <div
        style={{
          flex: 1,
          minHeight: fullBleed ? 360 : 220,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          padding: 24,
          textAlign: 'center',
          borderRadius: fullBleed ? 0 : 12,
          border: '2px dashed rgb(255 255 255 / 0.32)',
          background: 'color-mix(in srgb, var(--color-primary-900) 40%, transparent)',
          color: 'rgb(255 255 255 / 0.9)',
        }}
      >
        <Megaphone size={40} />
        <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15 }}>Image carousel</p>
        <p style={{ margin: 0, maxWidth: 340, fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: '19px', color: 'rgb(255 255 255 / 0.6)' }}>
          Marketing announcement slides get added here later — this space is reserved for the rotating image carousel.
        </p>
      </div>
    )
  }

  const active = index % slides.length
  const slide = slides[active]

  return (
    <div
      style={
        fullBleed
          ? { flex: 1, display: 'flex', position: 'relative' }
          : { flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }
      }
    >
      {/* marketing slide (edge-to-edge when full-bleed) */}
      <div
        style={{
          position: 'relative',
          flex: 1,
          minHeight: fullBleed ? 360 : 300,
          borderRadius: fullBleed ? 0 : 20,
          overflow: 'hidden',
          // Image variant: photo under a brand-tinted scrim; else the rotating
          // gradient panel.
          background: image
            ? `${SLIDE_IMAGE_SCRIM}, center / cover no-repeat url(${slideImages[active % slideImages.length]})`
            : SLIDE_GRADIENTS[active % SLIDE_GRADIENTS.length],
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: 28,
        }}
      >
        {badged && <CardBadgeOverlay badges={deriveCardBadges(slide.id)} />}
        {/* single right arrow — advances forward, wrapping back to the first
            slide once past the last. */}
        {slides.length > 1 && (
          <CarouselArrow
            direction="next"
            offset={12}
            onClick={() => setIndex((i) => (i + 1) % slides.length)}
          />
        )}
        {/* decorative glow */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: -60,
            right: -40,
            width: 240,
            height: 240,
            borderRadius: '50%',
            background: 'rgb(255 255 255 / 0.14)',
            filter: 'blur(2px)',
          }}
        />
        {/* bottom scrim so copy always reads — strengthened for WCAG AA over a
            bright cover photo (holds ~0.62 across the bottom-anchored copy). */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(0deg, rgb(4 17 36 / 0.66), rgb(4 17 36 / 0.3) 38%, transparent 66%)',
          }}
        />
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 420 }}>
          <p style={{ ...eyebrowOnDark, color: 'rgb(255 255 255 / 1)', letterSpacing: '0.1em' }}>{slide.eyebrow}</p>
          <h3
            style={{
              margin: 0,
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: 26,
              lineHeight: 1.12,
              color: ON_DARK,
            }}
          >
            {slide.title}
          </h3>
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              lineHeight: '20px',
              color: 'rgb(255 255 255 / 1)',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {slide.desc}
          </p>
          <span
            style={{
              marginTop: 4,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              alignSelf: 'flex-start',
              height: 38,
              padding: '0 16px',
              borderRadius: 'var(--radius-md)',
              // Slightly translucent white so the slide image reads faintly
              // through it. Kept as a literal rgba (not `surface-card`, which
              // flips to navy in dark mode) since it sits on the always-dark
              // carousel slide.
              background: 'rgb(255 255 255 / 0.9)',
              color: 'var(--color-cta-600)',
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            Learn More
          </span>
        </div>
      </div>

      {/* dot navigation — a padded row below the slide, or overlaid bottom-right
          when the card is full-bleed (no room for a row beneath). */}
      <div
        style={
          fullBleed
            ? { position: 'absolute', bottom: 8, right: 12, zIndex: 2, display: 'flex', alignItems: 'center', gap: 0 }
            : { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }
        }
      >
        {slides.map((s, i) => {
          const isActive = i === active
          return (
            // The visual dot stays small (8px), but the button provides a
            // ≥24×24 transparent hit area (WCAG 2.2 §2.5.8, audit finding #5).
            <button
              key={s.id}
              type="button"
              aria-label={`Go to slide ${i + 1}: ${s.title}`}
              aria-current={isActive}
              onClick={() => setIndex(i)}
              style={{
                height: 24,
                width: isActive ? 38 : 24,
                minWidth: 24,
                padding: 0,
                border: 0,
                cursor: 'pointer',
                background: 'transparent',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                aria-hidden
                style={{
                  display: 'block',
                  height: 8,
                  width: isActive ? 22 : 8,
                  borderRadius: 'var(--radius-pill)',
                  background: isActive ? 'var(--color-primary-300)' : 'rgb(255 255 255 / 0.32)',
                  transition: 'width 0.2s ease',
                }}
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ─── pieces ─────────────────────────────────────────────────────────── */

function LegendDot({ color, label, textColor }: { color: string; label: string; textColor?: string }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 9, height: 9, borderRadius: '50%', background: color, flex: 'none' }} />
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: textColor ?? 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
        {label}
      </span>
    </span>
  )
}

function StatCard({
  caption,
  children,
  surface = 'var(--color-surface-card)',
  border,
  boxShadow = CARD_SHADOW,
  captionColor = 'var(--color-text-secondary)',
  valueColor = 'var(--color-text-primary)',
}: {
  caption: string
  children: ReactNode
  surface?: string
  border?: string
  boxShadow?: string
  captionColor?: string
  valueColor?: string
}) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        background: surface,
        border,
        borderRadius: 10,
        boxShadow,
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <p style={{ ...statCaption, color: captionColor }}>{caption}</p>
      <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 16, color: valueColor }}>
        {children}
      </p>
    </div>
  )
}

const linkBtn: CSSProperties = {
  background: 'transparent',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--color-cta-500)',
  whiteSpace: 'nowrap',
}

// Small filled magenta CTA — used for the Jump Back In "Resume" action so it
// reads as a real button (vs the text-link `linkBtn`). Matches the magenta
// `cta-500 → cta-600` gradient the Learner Focused band's Resume CTA uses.
const resumeCtaStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  flex: 'none',
  height: 32,
  padding: '0 14px',
  borderRadius: 'var(--radius-md)',
  border: 0,
  background: 'linear-gradient(135deg, var(--color-cta-500), var(--color-cta-600))',
  color: 'rgb(255 255 255 / 1)',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 700,
  whiteSpace: 'nowrap',
  cursor: 'pointer',
}
