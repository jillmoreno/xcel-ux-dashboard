import {
  useMemo,
  type ComponentType,
  type CSSProperties,
  type MouseEvent,
} from 'react'
import { Link } from 'react-router-dom'
import { Award, Book, BookOpen, ClipboardList, Gem, Library, Monitor, Notebook, Podcast, Video } from '@/icons'
import { CardEyebrow } from '@/components/courses/LearningPathCard'
import { CertSmall, type CertSmallData } from '@/components/courses/CertSmall'
import { CourseCard, type CourseCardData, type CourseDelivery } from '@/components/courses/CourseCard'
import { useJumpBackInPanel } from '@/components/dashboard/JumpBackInPanelContext'
import { useAccount } from '@/context/AccountContext'
import { useFeatureFlag, useFeatureFlags } from '@/context/FeatureFlagContext'
import { useLoFi } from '@/context/LoFiContext'
import { LoFiWidgetBody } from '@/components/lo-fi/LoFiPlaceholders'
import { issuedCertificatesFor } from '@/data/learningFixtures'
import { myCoursesFor } from '@/data/myCoursesFixtures'
import { MY_PODCAST_PLAYLIST } from '@/data/podcastFixtures'

/** Delivery (modality) icon — same mapping the full-size CourseCard
 *  uses so the "Online" / "Video" / "Podcast" affordance stays
 *  consistent across surfaces. */
const DELIVERY_ICON: Record<CourseDelivery, ComponentType<{ size?: number }>> = {
  online: Monitor,
  'in-person': Monitor,
  classroom: Monitor,
  video: Video,
  podcast: Podcast,
}

const DELIVERY_LABEL: Record<CourseDelivery, string> = {
  online: 'Online',
  'in-person': 'In Person',
  classroom: 'Classroom',
  video: 'Video',
  podcast: 'Podcast',
}

/**
 * Dashboard V2/V3 — Jump Back In sidebar card.
 *
 * First tile in the Learner Overview 3-up row (Jump Back In · Learning
 * Paths · Courses). Two render modes:
 *   - `'default'` (V2): two horizontal mini-cards — the most recent
 *     in-progress course AND the most recent in-progress podcast.
 *     Course data comes from `myCoursesFor(brand)`; podcast data from
 *     `MY_PODCAST_PLAYLIST`. "View All →" routes to /my-learning/courses.
 *   - `'v3'`: one full-size `<CourseCard compact>` for the first
 *     in-progress course (no podcast). "View All →" opens the
 *     `JumpBackInPanel` slide-over via `useJumpBackInPanel()`, listing
 *     every in-progress course as a compact row.
 */
/** V3 layout options for the Jump Back In tile, driven by the
 *  `jump-back-in-card` feature flag variant. */
export type JumpBackInLayout =
  | 'single'
  | 'stacked'
  | 'path-aware'
  | 'stacked-trio'
  | 'links-tiles'
  | 'links-list'

/** Map a `jump-back-in-card` flag variant value to a `v3Layout`. Unknown
 *  values (including 'lo-fi', which is handled by the surrounding
 *  LoFiScope) fall back to the canonical single-card layout. */
export function jbiLayoutFromVariant(
  variant: string | undefined,
): JumpBackInLayout {
  switch (variant) {
    case 'stacked':
    case 'path-aware':
    case 'stacked-trio':
    case 'links-tiles':
    case 'links-list':
      return variant
    default:
      return 'single'
  }
}

type JumpBackInCardProps = {
  variant?: 'default' | 'v3'
  /** V3-only layout switch driven by the `jump-back-in-card` feature
   *  flag variant. `'single'` (default) keeps the canonical V3 layout
   *  — one full-size in-progress CourseCard. `'stacked'` shrinks each
   *  card to a `<CourseRow>` and renders up to four total: 2
   *  in-progress on top + a "Recently Added" subhead + 2
   *  not-started below. `'path-aware'` uses the same stacked layout,
   *  but the card title flips to "What's Next" — and the top rows
   *  show the next not-started cards from the learning path —
   *  whenever the learner has nothing in progress.
   *  `'stacked-trio'` keeps the same three-section layout but renders
   *  exactly one larger card per section so the tile reads as three
   *  spotlight cards instead of six compact rows. `'links-tiles'` /
   *  `'links-list'` keep the in-progress card on top and add a Quick
   *  Links section below (square tiles or a vertical list). Ignored
   *  when `variant !== 'v3'`. */
  v3Layout?: JumpBackInLayout
  /** In the `links-*` layouts, sizes the in-progress card: `'normal'`
   *  (default) uses the compact CourseCard, `'small'` shrinks it to a
   *  compact row so the Quick Links sit higher. Ignored by other
   *  layouts. */
  linksCardSize?: 'normal' | 'medium' | 'small'
}

export function JumpBackInCard({
  variant = 'default',
  v3Layout = 'single',
  linksCardSize = 'normal',
}: JumpBackInCardProps = {}) {
  const { brand } = useAccount()
  const { openPanel } = useJumpBackInPanel()
  const { loFi } = useLoFi()
  // `bare` chrome variant — drops the white card container (background,
  // border, padding) and hides the View All link, so the card reads as
  // unframed content directly on the page. Read before any early return
  // so hook order stays stable across the lo-fi flip.
  const bareChrome = useFeatureFlag('jump-back-in-chrome').variant === 'bare'
  const isV3 = variant === 'v3'
  const isTrio = isV3 && v3Layout === 'stacked-trio'
  const isStacked =
    isV3 && (v3Layout === 'stacked' || v3Layout === 'path-aware' || isTrio)
  const isPathAware = isV3 && v3Layout === 'path-aware'
  // Quick-links layouts — JBI in-progress card on top, Quick Links
  // section (square tiles or vertical list) below.
  const isLinks =
    isV3 && (v3Layout === 'links-tiles' || v3Layout === 'links-list')
  const perSectionLimit = isTrio ? 1 : 2

  // V3 shows just the first in-progress course (no podcast); the
  // default shows the first in-progress course + the first in-progress
  // podcast as two mini-cards.
  //
  // NOTE: This `useMemo` must stay above the lo-fi early return below
  // — React's rules of hooks require the hook count to match across
  // renders, and the lo-fi toggle flips at runtime.
  const items = useMemo<CourseCardData[]>(() => {
    const list: CourseCardData[] = []
    const course = myCoursesFor(brand).find((c) => c.myStatus === 'in-progress')
    if (course) list.push(course)
    if (!isV3) {
      const podcast = MY_PODCAST_PLAYLIST.find((p) => p.myStatus === 'in-progress')
      if (podcast) list.push(podcast)
    }
    return list
  }, [brand, isV3])

  // Stacked V3 layout pulls richer slices. Computed even when not in
  // stacked mode so the hook order stays stable across flag flips.
  //
  // - `inProgress`: top section when the learner has in-progress work
  //   (the "Jump Back In" case).
  // - `nextInPath`: top section in path-aware mode when in-progress is
  //   empty — the first not-started courses the learner would pick up
  //   next ("What's Next").
  // - `recentlyAdded`: bottom section — the most recently enrolled
  //   not-started courses. When the top section is also pulling from
  //   not-started (`nextInPath`), this list excludes whatever the top
  //   section took so the two groups never duplicate.
  const stackedSlices = useMemo(() => {
    const library = myCoursesFor(brand)
    const inProgress = library
      .filter((c) => c.myStatus === 'in-progress')
      .slice(0, perSectionLimit)
    const notStartedByRecency = library
      .filter((c) => c.myStatus === 'not-started')
      // Most recently enrolled first — the cards a learner just
      // purchased / queued up.
      .slice()
      .sort((a, b) => (b.enrolledAt ?? '').localeCompare(a.enrolledAt ?? ''))
    const nextInPath = notStartedByRecency.slice(0, perSectionLimit)
    // `path-aware` is a demo simulation of the empty-in-progress
    // state — when reviewers pick this variant, force the What's Next
    // treatment regardless of the underlying fixture data so the UX
    // is always previewable. (The real behavior, once the engagement
    // service ships, will key off `inProgress.length === 0`.)
    const useNextInPathAsTop = isPathAware
    const topIds = new Set(
      (useNextInPathAsTop ? nextInPath : inProgress).map((c) => c.id),
    )
    const recentlyAdded = notStartedByRecency
      .filter((c) => !topIds.has(c.id))
      .slice(0, perSectionLimit)
    // Recent Certificates section — reuses the same `<CertSmall>` UI
    // the Learning Path certificates tab renders, capped at the
    // section limit (2 for stacked, 1 for stacked-trio). No real
    // "issued date" on CertSmallData yet, so we just take the first
    // N records from the brand's issued list and treat the catalog
    // order as the recency ordering for the demo.
    const recentCertificates = issuedCertificatesFor(brand).slice(0, perSectionLimit)
    return {
      inProgress,
      nextInPath,
      recentlyAdded,
      recentCertificates,
      useNextInPathAsTop,
    }
  }, [brand, isPathAware, perSectionLimit])

  // Lo-Fi: keep the tile's outer surface + height: 100% so the V3
  // grid layout (Jump Back In as a 305px-wide tall column) stays
  // intact. Body becomes a card-shaped placeholder.
  if (loFi) {
    return (
      <section
        aria-label="Jump back in"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          padding: '16px 20px',
          background: 'var(--color-surface-card)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-lg)',
          height: '100%',
        }}
      >
        <LoFiWidgetBody rows={6} showCta ariaLabel="Lo-fi Jump Back In widget" />
      </section>
    )
  }

  return (
    <section
      aria-label="Jump back in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        // `bare` chrome strips the card container entirely.
        padding: bareChrome ? 0 : '16px 20px',
        background: bareChrome ? 'transparent' : 'var(--color-surface-card)',
        border: bareChrome ? 'none' : '1px solid var(--color-border-subtle)',
        borderRadius: bareChrome ? 0 : 'var(--radius-lg)',
        // V2 + the standard V3 layouts stretch to fill the grid row's
        // height so the tile's bottom aligns with the sibling Learning
        // Paths + Courses cards. The quick-links layout is intentionally
        // shorter, so it hugs its contents instead of leaving a tall
        // empty gap below the links.
        height: isLinks ? undefined : '100%',
        alignSelf: isLinks ? 'start' : undefined,
      }}
    >
      <CardEyebrow
        // Path-aware mode flips the title to "What's Next" whenever
        // the learner has nothing in progress so the eyebrow always
        // names what the top rows actually show.
        label={stackedSlices.useNextInPathAsTop ? "What's Next" : 'Jump Back In'}
        // The stacked V3 layout matches the V2 default: View All routes
        // to /my-learning/courses. The single-card V3 layout keeps the
        // slide-over panel handler. `bare` chrome hides View All entirely
        // (pass neither prop → CardEyebrow renders just the label).
        {...(bareChrome
          ? {}
          : isV3 && !isStacked && !isLinks
            ? { onViewAll: openPanel }
            : { viewAllHref: '/my-learning/courses?status=in-progress' })}
      />

      {isLinks ? (
        <>
          {items.length === 0 ? (
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                color: 'var(--color-text-secondary)',
              }}
            >
              You don't have anything in progress.
            </p>
          ) : linksCardSize === 'small' ? (
            <CourseRow item={items[0]} bleedThumb />
          ) : linksCardSize === 'medium' ? (
            <CourseCard data={items[0]} dense />
          ) : (
            <CourseCard data={items[0]} compact />
          )}
          <JumpBackInQuickLinks
            layout={v3Layout === 'links-list' ? 'list' : 'tiles'}
          />
        </>
      ) : isStacked ? (
        <StackedJumpBackInBody
          topCourses={
            stackedSlices.useNextInPathAsTop
              ? stackedSlices.nextInPath
              : stackedSlices.inProgress
          }
          topActionLabel={stackedSlices.useNextInPathAsTop ? 'Start' : 'Resume'}
          topEmptyLabel={
            stackedSlices.useNextInPathAsTop
              ? "You're all caught up — nothing queued in your path."
              : "You don't have anything in progress."
          }
          recentlyAdded={stackedSlices.recentlyAdded}
          recentCertificates={stackedSlices.recentCertificates}
          rowSize={isTrio ? 'lg' : 'sm'}
        />
      ) : items.length === 0 ? (
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            color: 'var(--color-text-secondary)',
          }}
        >
          You don't have anything in progress.
        </p>
      ) : isV3 ? (
        // Single full-size course card. `<CourseCard>` enforces its
        // own `minWidth: 265` (the canonical CourseCard footprint —
        // see CourseCard.tsx) so no wrapper is needed; the JBI tile's
        // grid column is sized to fit (305px = 265 card + 40 L/R
        // padding) in V3MainSection.
        <CourseCard data={items[0]} compact />
      ) : (
        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {items.map((item) => (
            <li key={item.id}>
              <CourseRow item={item} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/** V3 stacked layout — three stacked sections: top rows
 *  (Jump Back In / What's Next), Recently Added courses, and Recent
 *  Certificates. The two subsections each carry their own "View All
 *  →" link routing to the canonical Library pages. The top
 *  section's action label / empty copy is driven by the parent so
 *  path-aware mode can swap "Resume" → "Start" without re-wrapping
 *  this body. */
function StackedJumpBackInBody({
  topCourses,
  topActionLabel,
  topEmptyLabel,
  recentlyAdded,
  recentCertificates,
  rowSize = 'sm',
}: {
  topCourses: CourseCardData[]
  topActionLabel: string
  topEmptyLabel: string
  recentlyAdded: CourseCardData[]
  recentCertificates: CertSmallData[]
  /** `'sm'` — compact rows (default; 56px thumb, 12/16 title). `'lg'`
   *  — larger rows used by `stacked-trio` (72px thumb, 14/20 title).
   *  Drives the certificate density too: 'lg' shows the full
   *  CertSmall (icon + title + hours/tier meta + kebab) to match the
   *  visual weight of the larger course rows. */
  rowSize?: 'sm' | 'lg'
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <RowList
        items={topCourses}
        emptyLabel={topEmptyLabel}
        actionLabel={topActionLabel}
        size={rowSize}
      />
      <SubSection
        title="Recently Added"
        viewAllHref="/my-learning/courses?status=recently-added"
      >
        <RowList
          items={recentlyAdded}
          emptyLabel="Nothing added recently."
          actionLabel="Start"
          size={rowSize}
        />
      </SubSection>
      <SubSection
        title="Recent Certificates"
        viewAllHref="/my-learning/certificates"
      >
        {recentCertificates.length === 0 ? (
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              color: 'var(--color-text-secondary)',
            }}
          >
            No certificates yet.
          </p>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {recentCertificates.map((cert) => (
              <CertSmall
                key={cert.id}
                data={cert}
                // 'sm' rows = icon + title only; 'lg' rows = full
                // CertSmall treatment so the cert reads with the
                // same weight as its 72px-thumb sibling courses.
                compact={rowSize === 'sm'}
              />
            ))}
          </div>
        )}
      </SubSection>
    </div>
  )
}

/** Shared subsection wrapper for the stacked layout — uppercase
 *  subhead on the left, "View All →" routing link on the right,
 *  body content below. Mirrors the eyebrow / View-All affordance the
 *  card header uses so the three stacked sections read as a family. */
function SubSection({
  title,
  viewAllHref,
  children,
}: {
  title: string
  viewAllHref: string
  children: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: 'var(--color-text-secondary)',
          }}
        >
          {title}
        </span>
        <Link
          to={viewAllHref}
          className="cre-link-action"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--color-action)',
            textDecoration: 'none',
          }}
        >
          View All →
        </Link>
      </div>
      {children}
    </div>
  )
}

function RowList({
  items,
  emptyLabel,
  actionLabel,
  size = 'sm',
}: {
  items: CourseCardData[]
  emptyLabel: string
  actionLabel?: string
  size?: 'sm' | 'lg'
}) {
  if (items.length === 0) {
    return (
      <p
        style={{
          margin: 0,
          fontFamily: 'var(--font-body)',
          fontSize: 13,
          color: 'var(--color-text-secondary)',
        }}
      >
        {emptyLabel}
      </p>
    )
  }
  return (
    <ul
      style={{
        listStyle: 'none',
        margin: 0,
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {items.map((item) => (
        <li key={item.id}>
          <CourseRow item={item} actionLabel={actionLabel} size={size} />
        </li>
      ))}
    </ul>
  )
}

export function CourseRow({
  item,
  actionLabel = 'Resume',
  size = 'sm',
  bleedThumb = false,
}: {
  item: CourseCardData
  /** Verb shown in the row's aria-label — defaults to "Resume" for
   *  in-progress items. Pass "Start" for not-yet-started rows so
   *  screen readers don't announce "Resume" against unstarted work. */
  actionLabel?: string
  /** `'sm'` (default) — 56×56 thumb, 12/16 title. `'lg'` — 72×72
   *  thumb, 14/20 title, used by the JBI `stacked-trio` variant so
   *  the single card per section reads with more visual weight. */
  size?: 'sm' | 'lg'
  /** When true, the thumbnail bleeds to the card's top, bottom, and
   *  left edges (full row height, flush left, square right corners)
   *  instead of sitting as an inset rounded square. Used by the small
   *  JBI in-progress card. */
  bleedThumb?: boolean
}) {
  const isLarge = size === 'lg'
  const thumbSize = isLarge ? 72 : 56
  const rowPadding = isLarge ? 12 : 8
  const rowGap = isLarge ? 14 : 12
  const titleFontSize = isLarge ? 14 : 12
  const titleLineHeight = isLarge ? '20px' : '16px'
  const metaFontSize = isLarge ? 12 : 11
  const metaLineHeight = isLarge ? '16px' : '14px'
  const progress = Math.max(0, Math.min(100, item.progress ?? 0))
  const isPodcast = item.delivery === 'podcast'
  // Single meta line — modality (delivery type) · badge. Credit hours
  // and state were dropped to keep the row compact; the progress bar's
  // % is the at-a-glance signal the learner needs to resume.
  const DeliveryIcon = DELIVERY_ICON[item.delivery]
  const deliveryLabel = DELIVERY_LABEL[item.delivery]
  const badgeLabel = item.badge === 'mandatory' ? 'Mandatory' : 'Elective'
  // No dedicated podcast detail route — land the learner on the playlist
  // surface where they can resume listening.
  const href = isPodcast ? '/my-learning/podcasts?tab=playlist' : `/courses/${item.id}`

  // When the thumbnail bleeds, it stretches to the full row height and
  // pulls flush to the top/bottom/left edges by negating the row's
  // padding; its left corners pick up the card's radius while the right
  // corners go square so it meets the content cleanly. The Link gets
  // `overflow: hidden` so the bleed clips to the rounded card.
  const bleedThumbStyle: CSSProperties = bleedThumb
    ? {
        // 12px wider than the square thumb so the bleeding photo reads
        // as a slim cover strip rather than a square.
        width: thumbSize + 12,
        height: 'auto',
        alignSelf: 'stretch',
        marginTop: -rowPadding,
        marginBottom: -rowPadding,
        marginLeft: -rowPadding,
        borderRadius: 0,
        borderTopLeftRadius: 'var(--radius-md)',
        borderBottomLeftRadius: 'var(--radius-md)',
      }
    : {}

  return (
    <Link
      to={href}
      aria-label={`${actionLabel} ${item.title}`}
      style={{
        display: 'flex',
        alignItems: 'stretch',
        gap: rowGap,
        padding: rowPadding,
        borderRadius: 'var(--radius-md)',
        overflow: bleedThumb ? 'hidden' : undefined,
        // Lighter resting stroke (neutral-extra-light) to match the
        // sibling CertSmall cards; hover still brightens to primary-300.
        border: '1px solid var(--color-neutral-extra-light)',
        background: 'var(--color-surface-card)',
        textDecoration: 'none',
        color: 'var(--color-text-primary)',
        transition: 'border-color 160ms ease, background 160ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-primary-300)'
        e.currentTarget.style.background =
          'color-mix(in srgb, var(--color-primary-500) 4%, white)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-neutral-extra-light)'
        e.currentTarget.style.background = 'var(--color-surface-card)'
      }}
    >
      {/* Thumbnail — `size`-driven square (56 for sm, 72 for lg).
          Course rows use the imageUrl; podcast rows use the same
          tertiary-700 fill + faded Podcast glyph as
          `.cre-tile-header--tertiary` in the catalog so the podcast
          affordance reads as a continuation of that pattern. */}
      {isPodcast ? (
        <span
          aria-hidden
          style={{
            position: 'relative',
            width: thumbSize,
            height: thumbSize,
            flexShrink: 0,
            borderRadius: 'var(--radius-sm)',
            background: 'var(--color-tertiary-700)',
            overflow: 'hidden',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            ...bleedThumbStyle,
          }}
        >
          <Podcast
            size={isLarge ? 60 : 48}
            aria-hidden
            style={{
              color: 'var(--color-text-inverse)',
              opacity: 0.32,
              // Mirror the catalog's off-center placement so the
              // wordmark-style "Podcast" silhouette reads as the badge.
              position: 'absolute',
              top: -4,
              right: -8,
            }}
          />
        </span>
      ) : (
        <span
          aria-hidden
          style={{
            width: thumbSize,
            height: thumbSize,
            flexShrink: 0,
            borderRadius: 'var(--radius-sm)',
            background: item.imageUrl
              ? `url("${item.imageUrl}") center / cover no-repeat`
              : 'var(--color-neutral-100)',
            ...bleedThumbStyle,
          }}
        />
      )}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 4,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: titleFontSize,
              fontWeight: 600,
              lineHeight: titleLineHeight,
              color: 'var(--color-text-primary)',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {item.title}
          </span>
          {/* Meta — two lines: delivery (icon + modality) on top, then
              badge | hours | state on a second line. */}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontFamily: 'var(--font-body)',
              fontSize: metaFontSize,
              fontWeight: 400,
              lineHeight: metaLineHeight,
              color: 'var(--color-text-secondary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            <DeliveryIcon size={metaFontSize} aria-hidden />
            <span>{deliveryLabel}</span>
          </span>
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: metaFontSize,
              fontWeight: 400,
              lineHeight: metaLineHeight,
              color: 'var(--color-text-secondary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {badgeLabel} | {item.hours} {item.hours === 1 ? 'Hour' : 'Hours'} |{' '}
            {item.state}
          </span>
        </div>
        <ProgressBar percent={progress} title={item.title} />
      </div>
    </Link>
  )
}

function ProgressBar({ percent, title }: { percent: number; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${title} — ${percent}% complete`}
        style={{
          flex: 1,
          height: 4,
          background: 'var(--color-neutral-100)',
          borderRadius: 999,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${percent}%`,
            height: '100%',
            background: 'var(--color-progress-fill)',
            borderRadius: 999,
          }}
        />
      </div>
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--color-text-secondary)',
          whiteSpace: 'nowrap',
        }}
      >
        {percent}%
      </span>
    </div>
  )
}

/* ─── Quick Links section (links-tiles / links-list layouts) ─────────
 *
 * Shortcut links shown beneath the in-progress card in the `links-*`
 * JBI layouts. Reuses the medallion + label + caption treatment from
 * the right-rail `QuickLinksCard` so the two read as the same family.
 */
type JbiQuickLink = {
  id: string
  label: string
  caption: string
  href: string
  Icon: ComponentType<{ size?: number }>
}

const JBI_QUICK_LINKS: JbiQuickLink[] = [
  { id: 'catalog', label: 'Course Catalog', caption: 'Browse products', href: '/catalog', Icon: Library },
  { id: 'library', label: 'Resource Library', caption: 'Explore resources', href: '/membership?tab=library', Icon: BookOpen },
  { id: 'courses', label: 'My Courses', caption: 'View Purchased', href: '/my-learning/courses?status=recently-added', Icon: Book },
  { id: 'explore-membership', label: 'Membership', caption: 'Explore benefits', href: '/membership', Icon: Gem },
  { id: 'podcasts', label: 'Podcasts', caption: 'Listen on the go', href: '/my-learning/podcasts', Icon: Podcast },
  { id: 'certificates', label: 'Certificates', caption: 'View completions', href: '/my-learning/certificates', Icon: Award },
  { id: 'requirements', label: 'Requirements', caption: 'License Regulations', href: '/account/licenses', Icon: ClipboardList },
  { id: 'notes', label: 'My Notes', caption: 'Review content', href: '/account/notes', Icon: Notebook },
]

function JumpBackInQuickLinks({ layout }: { layout: 'tiles' | 'list' }) {
  // Each tile is independently feature-flagged (`jbi-quicklink-<id>`) so
  // reviewers can turn individual Quick Links on/off in the Feature Flag
  // panel. Missing key → default visible.
  const { flags } = useFeatureFlags()
  const visibleLinks = JBI_QUICK_LINKS.filter(
    (link) => flags[`jbi-quicklink-${link.id}`]?.enabled ?? true,
  )
  // Whole section (heading included) drops out when every tile is off.
  if (visibleLinks.length === 0) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: 'var(--color-text-secondary)',
        }}
      >
        Quick Links
      </span>
      {layout === 'tiles' ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 10,
          }}
        >
          {visibleLinks.map((link) => (
            <JbiQuickLinkTile key={link.id} link={link} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {visibleLinks.map((link) => (
            <JbiQuickLinkRow key={link.id} link={link} />
          ))}
        </div>
      )}
    </div>
  )
}

/** Shared hover chrome for both the tile and the row — border brightens
 *  to primary, a faint primary wash + lift, matching `QuickLinkTile`. */
const quickLinkHoverIn = (e: MouseEvent<HTMLAnchorElement>) => {
  const el = e.currentTarget
  el.style.borderColor = 'var(--color-primary-500)'
  el.style.background = 'color-mix(in srgb, var(--color-primary-500) 4%, white)'
  el.style.boxShadow = 'var(--shadow-card)'
  el.style.transform = 'translateY(-1px)'
}
const quickLinkHoverOut = (e: MouseEvent<HTMLAnchorElement>) => {
  const el = e.currentTarget
  el.style.borderColor = 'var(--color-border-subtle)'
  el.style.background = 'var(--color-surface-card)'
  el.style.boxShadow = 'none'
  el.style.transform = 'none'
}

/** Hover chrome for the borderless list rows — a quiet neutral wash,
 *  matching the Rubi widget's suggested-prompt rows (no border, no lift,
 *  no shadow). */
const quickLinkRowHoverIn = (e: MouseEvent<HTMLAnchorElement>) => {
  e.currentTarget.style.background = 'var(--color-neutral-extra-light)'
}
const quickLinkRowHoverOut = (e: MouseEvent<HTMLAnchorElement>) => {
  e.currentTarget.style.background = 'transparent'
}

function QuickLinkMedallion({ Icon }: { Icon: ComponentType<{ size?: number }> }) {
  return (
    <span
      aria-hidden
      style={{
        width: 32,
        height: 32,
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 'var(--radius-sm)',
        background: 'color-mix(in srgb, var(--color-primary-500) 12%, white)',
        color: 'var(--color-primary-700)',
      }}
    >
      <Icon size={18} />
    </span>
  )
}

const quickLinkLabelStyle: CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: 14,
  fontWeight: 500,
  lineHeight: '16px',
  color: 'var(--color-text-primary)',
}
const quickLinkCaptionStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 400,
  lineHeight: '14px',
  color: 'var(--color-text-secondary)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  width: '100%',
}

/** Square tile — medallion top-left, label + caption bottom-left. */
function JbiQuickLinkTile({ link }: { link: JbiQuickLink }) {
  return (
    <Link
      to={link.href}
      aria-label={`${link.label} — ${link.caption}`}
      onMouseEnter={quickLinkHoverIn}
      onMouseLeave={quickLinkHoverOut}
      onFocus={(e) => quickLinkHoverIn(e as unknown as MouseEvent<HTMLAnchorElement>)}
      onBlur={(e) => quickLinkHoverOut(e as unknown as MouseEvent<HTMLAnchorElement>)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        gap: 8,
        padding: 8,
        background: 'var(--color-surface-card)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-md)',
        textDecoration: 'none',
        color: 'var(--color-text-primary)',
        transition:
          'background 160ms ease, border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease',
      }}
    >
      <QuickLinkMedallion Icon={link.Icon} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, width: '100%' }}>
        <span style={quickLinkLabelStyle}>{link.label}</span>
        <span style={quickLinkCaptionStyle}>{link.caption}</span>
      </div>
    </Link>
  )
}

/** Vertical list row — medallion left, label + caption right. */
function JbiQuickLinkRow({ link }: { link: JbiQuickLink }) {
  return (
    <Link
      to={link.href}
      aria-label={`${link.label} — ${link.caption}`}
      onMouseEnter={quickLinkRowHoverIn}
      onMouseLeave={quickLinkRowHoverOut}
      onFocus={(e) => quickLinkRowHoverIn(e as unknown as MouseEvent<HTMLAnchorElement>)}
      onBlur={(e) => quickLinkRowHoverOut(e as unknown as MouseEvent<HTMLAnchorElement>)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: 6,
        background: 'transparent',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        textDecoration: 'none',
        color: 'var(--color-text-primary)',
        transition: 'background 160ms ease',
      }}
    >
      <QuickLinkMedallion Icon={link.Icon} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <span style={quickLinkLabelStyle}>{link.label}</span>
        <span style={quickLinkCaptionStyle}>{link.caption}</span>
      </div>
    </Link>
  )
}
