import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, ChalkboardUser, FileText, Users } from '@/icons'
import { Tabs, type TabItem } from '@/components/ui/Tabs'
import { PillTabs, type PillTabItem } from '@/components/ui/PillTabs'
import { ViewToggle, type ViewMode } from '@/components/ui/ViewToggle'
import { ContinueListeningCard } from '@/components/courses/ContinueListeningCard'
import { CourseCard } from '@/components/courses/CourseCard'
import { MyCoursesTable } from '@/components/courses/MyCoursesTable'
import { LearnerOverviewPanel } from '@/components/dashboard/LearnerOverviewPanel'
import { NowPlayingBar, type NowPlayingData } from '@/components/courses/NowPlayingBar'
import { RecommendedForYouPanel } from '@/components/dashboard/recommended/RecommendedForYouPanel'
import { useAccount } from '@/context/AccountContext'
import { isRecentlyAdded, myCoursesFor } from '@/data/myCoursesFixtures'
import { useMediaQuery } from '@/utils/useMediaQuery'
import {
  CONTINUE_LISTENING,
  MY_PODCAST_PLAYLIST,
  type ContinueListeningEntry,
  type PodcastPlaylistRecord,
} from '@/data/podcastFixtures'

type TabId =
  | 'learner-overview'
  | 'continue-listening'
  | 'jump-back-in'
  | 'recommended'
  | 'member-benefits'

const TABS: TabItem<TabId>[] = [
  { id: 'learner-overview', label: 'Learner Overview' },
  { id: 'continue-listening', label: 'Continue Listening' },
  { id: 'jump-back-in', label: 'Jump Back In' },
  { id: 'recommended', label: 'Recommended for You' },
  { id: 'member-benefits', label: 'Member Benefits' },
]

const GRID_STYLE: React.CSSProperties = {
  display: 'grid',
  // Fixed 265px card width so course / podcast / resource cards keep their
  // intended proportions and just wrap into more rows on narrower viewports.
  // 265px is the canonical CourseCard min-width — see CourseCard.tsx.
  gridTemplateColumns: 'repeat(auto-fill, 265px)',
  // Cards keep their natural height — without this, a row mixing taller
  // CourseCards with shorter Membership / Package cards would stretch the
  // short cards to match the tallest sibling in the row.
  alignItems: 'start',
  gap: 16,
}

const EMPTY_STYLE: React.CSSProperties = {
  padding: '24px 16px',
  textAlign: 'center',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  color: 'var(--color-text-secondary)',
}

type ContinueLearningTabsProps = {
  showAchievements?: boolean
  /** Forwarded to `LearnerOverviewPanel.pathsLayout`. See its docs. */
  pathsLayout?: 'wide' | 'three-up'
}

export function ContinueLearningTabs({
  showAchievements = true,
  pathsLayout = 'wide',
}: ContinueLearningTabsProps = {}) {
  const [tab, setTab] = useState<TabId>('learner-overview')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Tabs items={TABS} active={tab} onChange={setTab} />
      <div>
        {tab === 'learner-overview' && (
          <LearnerOverviewPanel
            showAchievements={showAchievements}
            pathsLayout={pathsLayout}
          />
        )}
        {tab === 'continue-listening' && <ContinueListeningPanel />}
        {tab === 'jump-back-in' && <JumpBackInPanel />}
        {tab === 'recommended' && <RecommendedForYouPanel />}
        {tab === 'member-benefits' && <QuickResourcesPanel />}
      </div>
    </div>
  )
}

function toNowPlayingData(entry: ContinueListeningEntry): NowPlayingData {
  const totalSec = Math.max(1, Math.round(entry.durationHr * 3600))
  return {
    episodeTitle: entry.episodeTitle,
    podcastTitle: entry.podcastTitle,
    episodeNumber: entry.episodeNumber,
    badge: entry.badge === 'mandatory' ? 'Mandatory' : 'Elective',
    creditHours: entry.durationHr,
    creditStates: [entry.state],
    totalSec,
    // Credit checkpoint roughly 60% into the episode — same model used by My Podcasts.
    checkpointSec: Math.round(totalSec * 0.6),
  }
}

function usePodcastQueue(queue: ContinueListeningEntry[]) {
  const [index, setIndex] = useState(0)
  const current = queue[index]
  const initialElapsed = current ? Math.round((current.progressPct / 100) * current.durationHr * 3600) : 0
  const [elapsedSec, setElapsedSec] = useState(initialElapsed)
  const [isPlaying, setIsPlaying] = useState(false)
  const totalSec = current ? Math.max(1, Math.round(current.durationHr * 3600)) : 0
  // Keep a ref to elapsed so the interval doesn't have to re-bind on every tick.
  const elapsedRef = useRef(elapsedSec)
  elapsedRef.current = elapsedSec

  // Reset elapsed when track changes (resume from saved progress on the new entry).
  useEffect(() => {
    if (!current) return
    setElapsedSec(Math.round((current.progressPct / 100) * current.durationHr * 3600))
  }, [current])

  // Tick the elapsed counter while playing. Uses an accelerated 30s-per-tick so
  // a demo viewer can actually watch the bar advance + the auto-advance fire
  // within a reasonable amount of time.
  useEffect(() => {
    if (!isPlaying || !current) return
    const id = window.setInterval(() => {
      const next = elapsedRef.current + 30
      if (next >= totalSec) {
        // End of track — advance the queue (or stop if at the end).
        setIsPlaying(false)
        setIndex((i) => (i + 1 < queue.length ? i + 1 : i))
        setElapsedSec(0)
      } else {
        setElapsedSec(next)
      }
    }, 1000)
    return () => window.clearInterval(id)
  }, [isPlaying, totalSec, current, queue.length])

  const skip = (deltaSec: number) =>
    setElapsedSec((e) => Math.max(0, Math.min(totalSec - 1, e + deltaSec)))

  return {
    current,
    elapsedSec,
    isPlaying,
    upNext: queue.slice(index + 1),
    togglePlay: () => setIsPlaying((p) => !p),
    rewind: () => skip(-15),
    forward: () => skip(30),
  }
}

/** Convert a playlist record to the card-friendly shape. Playlist entries
 * don't carry an episode number (each podcast is a whole show), so the card
 * collapses the "Ep. N · duration" line down to just the duration. */
function playlistToEntry(p: PodcastPlaylistRecord): ContinueListeningEntry {
  // Map the playlist's 4-state status onto the card's 3-state status.
  // 'archived' isn't a listen state, so fall back to 'not-started' visually.
  const myStatus: ContinueListeningEntry['myStatus'] =
    p.myStatus === 'completed'
      ? 'completed'
      : p.myStatus === 'in-progress'
        ? 'in-progress'
        : 'not-started'
  return {
    id: p.id,
    episodeTitle: p.title,
    podcastTitle: p.title,
    durationHr: p.hours,
    contextLabel: p.badge === 'mandatory' ? 'Mandatory' : 'Elective',
    progressPct: p.progress ?? 0,
    description: '',
    badge: p.badge,
    state: p.state,
    myStatus,
  }
}

function ContinueListeningPanel() {
  const queue = CONTINUE_LISTENING
  const { current, elapsedSec, isPlaying, togglePlay, rewind, forward } =
    usePodcastQueue(queue)

  if (!current) return <div style={EMPTY_STYLE}>No podcasts in queue.</div>

  const playlist = MY_PODCAST_PLAYLIST
  const visible = playlist.slice(0, 3).map(playlistToEntry)
  const hasMore = playlist.length > 3

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <NowPlayingBar
        data={toNowPlayingData(current)}
        elapsedSec={elapsedSec}
        isPlaying={isPlaying}
        onPlayPause={togglePlay}
        onRewind={rewind}
        onForward={forward}
        hideVideoToggle
      />
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
          My Playlist ({playlist.length})
        </span>
        {hasMore && (
          <Link
            to="/my-learning/podcasts?tab=playlist"
            className="cre-link-action"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--color-action)',
              textDecoration: 'none',
            }}
          >
            See All →
          </Link>
        )}
      </div>
      {visible.length === 0 ? (
        <div style={EMPTY_STYLE}>Your playlist is empty.</div>
      ) : (
        <div style={GRID_STYLE}>
          {visible.map((p) => (
            <ContinueListeningCard key={p.id} data={p} />
          ))}
        </div>
      )}
    </div>
  )
}

type JumpBackInStatus = 'in-progress' | 'recently-added'

function JumpBackInPanel() {
  // Mirrors the My Learning > My Courses tab strip — same brand-aware
  // course library, but only the two slices that make sense for a
  // "jump back in" surface:
  //   1. In Progress (default) — courses the learner has started.
  //   2. Recently Added — anything enrolled within the rolling 15-day
  //      window (`isRecentlyAdded`), regardless of `myStatus`. Mirrors
  //      the Recently Added pill on MyCoursesPage so the two surfaces
  //      stay in sync.
  // Card / table toggle mirrors MyCoursesPage. Narrow viewports are
  // forced to card view because the 7-column table gets uncomfortably
  // squished below a certain content width.
  //
  // The dashboard cuts over at 1440px, much higher than MyCoursesPage's
  // 700px, because the dashboard page has a 320px right-sidebar + 40px
  // gap that eats into the main column where the table renders:
  //
  //   main col width = viewport − 128 (page padding) − 320 (sidebar) − 40 (gap)
  //                  = viewport − 488
  //
  // The MyCoursesTable's natural minimum (image + title + meta line +
  // 6 short cells + 140px progress bar + padding) is ~950px. To clear
  // that, the main column needs ≥ ~950px → viewport ≥ ~1438px. Rounded
  // to 1440px (the standard MacBook Air width, which also happens to
  // be the first common laptop resolution that comfortably fits the
  // table on this layout).
  //
  // Below 1440px viewport, the main column shrinks under the table's
  // natural width and triggers the wrapper's `overflow-x: auto`. The
  // card grid wraps gracefully instead, so we fall back to that.
  const { brand } = useAccount()
  const [status, setStatus] = useState<JumpBackInStatus>('in-progress')
  const [requestedView, setRequestedView] = useState<ViewMode>('card')
  const forceCardView = useMediaQuery('(max-width: 1439px)')
  const view: ViewMode = forceCardView ? 'card' : requestedView

  const courses = useMemo(() => myCoursesFor(brand), [brand])

  const items = useMemo(() => {
    if (status === 'recently-added') return courses.filter((c) => isRecentlyAdded(c))
    return courses.filter((c) => c.myStatus === 'in-progress')
  }, [courses, status])

  const tabs: PillTabItem<JumpBackInStatus>[] = [
    { id: 'in-progress', label: 'In Progress' },
    { id: 'recently-added', label: 'Recently Added' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <PillTabs
          label="Filter Jump Back In courses"
          items={tabs}
          active={status}
          onChange={setStatus}
        />
        {/* Toggle stays mounted at every viewport so the affordance
            doesn't disappear when the screen is too narrow for the
            table. Visual state is driven by the *computed* `view` (not
            `requestedView`) so the Card icon shows as selected the
            moment forceCardView flips on. The Table button is rendered
            in a disabled state below 1440px to make it clear that
            table view isn't an option at the current screen size. */}
        <ViewToggle
          value={view}
          onChange={setRequestedView}
          disabledModes={forceCardView ? ['table'] : undefined}
          disabledTitle="Table view requires a wider screen."
        />
      </div>
      {items.length === 0 ? (
        <div style={EMPTY_STYLE}>
          {status === 'recently-added'
            ? 'Nothing added in the last 15 days.'
            : 'No courses in progress.'}
        </div>
      ) : view === 'table' ? (
        // Same component as MyCoursesPage uses. The 1440px cards-cut
        // threshold above guarantees the main column is wide enough
        // for the table's natural minimum, so no dashboard-specific
        // CSS overrides are needed — the existing MyCoursesPage rules
        // (hide bar ≤ 900px, nowrap ≥ 1720px) apply directly.
        <MyCoursesTable rows={items} />
      ) : (
        <div style={GRID_STYLE}>
          {items.map((c) => (
            <CourseCard key={c.id} data={c} compact />
          ))}
        </div>
      )}
    </div>
  )
}

const MEMBER_BENEFITS: MemberBenefit[] = [
  {
    id: 'resources',
    title: 'Resources Library',
    description:
      'Exclusive guides, infographics, and reference materials curated by experts in your profession. Updated monthly.',
    Icon: FileText,
    cta: 'Browse Resources',
    to: '/resources/r-cre-disclosure-guide',
  },
  {
    id: 'community',
    title: 'Community Posts',
    description:
      'Connect with peers, share wins and lessons learned, and stay current on industry trends in member-only discussions.',
    Icon: Users,
    cta: 'Join the Conversation',
    to: '/account/notifications',
  },
  {
    id: 'forums',
    title: 'Course Forums',
    description:
      'Ask questions, get expert answers, and discuss course content with fellow learners and instructors in real time.',
    Icon: ChalkboardUser,
    cta: 'Browse Forums',
    to: '/account/notifications',
  },
  {
    id: 'career',
    title: 'Career Center',
    description:
      'Explore job listings, get resume reviews, and access 1-on-1 coaching from industry professionals — all included.',
    Icon: Briefcase,
    cta: 'View Opportunities',
    to: '/account/career-opportunities',
  },
]

function QuickResourcesPanel() {
  return (
    <div
      style={{
        display: 'grid',
        // Two large card columns side-by-side at desktop widths; wraps to a
        // single column on narrow viewports.
        gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
        gap: 16,
        alignItems: 'start',
      }}
    >
      {MEMBER_BENEFITS.map((benefit) => (
        <MemberBenefitCard key={benefit.id} benefit={benefit} />
      ))}
    </div>
  )
}

type MemberBenefit = {
  id: string
  title: string
  description: string
  Icon: typeof FileText
  cta: string
  to: string
}

function MemberBenefitCard({ benefit }: { benefit: MemberBenefit }) {
  const { Icon } = benefit
  return (
    <Link
      to={benefit.to}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        padding: 24,
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border-subtle)',
        background: 'var(--color-surface-card)',
        textDecoration: 'none',
        color: 'var(--color-text-primary)',
        transition: 'border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease',
        minHeight: 220,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-neutral-300)'
        e.currentTarget.style.boxShadow = '0 4px 4px rgb(0 0 0 / 0.25)'
        e.currentTarget.style.transform = 'scale(1.005)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-border-subtle)'
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.transform = 'none'
      }}
    >
      <span
        aria-hidden
        style={{
          width: 56,
          height: 56,
          flexShrink: 0,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 'var(--radius-pill)',
          background: 'color-mix(in srgb, var(--color-primary-500) 12%, white)',
          color: 'var(--color-primary-700)',
        }}
      >
        <Icon size={28} aria-hidden />
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <h3
          style={{
            margin: 0,
            fontFamily: 'var(--font-heading)',
            fontSize: 20,
            fontWeight: 500,
            lineHeight: '26px',
            color: 'var(--color-text-primary)',
          }}
        >
          {benefit.title}
        </h3>
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            lineHeight: '20px',
            color: 'var(--color-text-secondary)',
          }}
        >
          {benefit.description}
        </p>
      </div>
      <span
        style={{
          marginTop: 'auto',
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--color-action)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        {benefit.cta} →
      </span>
    </Link>
  )
}

