import { useSearchParams } from 'react-router-dom'
import { Podcast } from '@/icons'
import { ContinueListeningCard } from '@/components/courses/ContinueListeningCard'
import { FeaturedBundleCard } from '@/components/courses/FeaturedBundleCard'
import { MyPodcastsPlaylist } from '@/components/courses/MyPodcastsPlaylist'
import { NowPlayingBar, type NowPlayingData } from '@/components/courses/NowPlayingBar'
import { PodcastCard } from '@/components/courses/PodcastCard'
import { TopPodcastCard } from '@/components/courses/TopPodcastCard'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { Tabs, type TabItem } from '@/components/ui/Tabs'
import {
  BROWSE_TOPICS,
  CONTINUE_LISTENING,
  FEATURED_BUNDLES,
  MY_PODCAST_PLAYLIST,
  RECOMMENDED_PODCASTS,
  TOP_PODCASTS,
  type PodcastTopic,
} from '@/data/podcastFixtures'

type PodcastTab = 'continue' | 'playlist' | 'recommended' | 'top' | 'bundles'

const TABS: TabItem<PodcastTab>[] = [
  { id: 'continue', label: 'Continue Listening' },
  { id: 'playlist', label: 'My Playlist' },
  { id: 'recommended', label: 'Browse Podcasts' },
  { id: 'top', label: 'Top Podcasts' },
  { id: 'bundles', label: 'Featured Bundles' },
]

export function MyPodcastsPage({ embedded = false }: { embedded?: boolean } = {}) {
  const [params, setParams] = useSearchParams()
  const raw = params.get('tab')
  const tab: PodcastTab =
    raw === 'recommended'
      ? 'recommended'
      : raw === 'playlist'
        ? 'playlist'
        : raw === 'top'
          ? 'top'
          : raw === 'bundles'
            ? 'bundles'
            : 'continue'

  const setParam = (key: string, value: string | null) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value == null || value === '') next.delete(key)
        else next.set(key, value)
        return next
      },
      { replace: true },
    )
  }

  return (
    <div style={{ padding: embedded ? '0 0 64px' : '24px 64px 64px', width: '100%' }}>
      <PageHeader title="My Podcasts" hideTitle={embedded} description="Listen on the go. Learn anywhere." />
      <div style={{ marginTop: 16 }}>
        <NowPlayingBar
          data={DEMO_NOW_PLAYING}
          elapsedSec={1394}
          isPlaying={false}
        />
      </div>
      <div style={{ marginTop: 24 }}>
        <Tabs
          items={TABS}
          active={tab}
          onChange={(v) => setParam('tab', v === 'continue' ? null : v)}
        />
        <div style={{ marginTop: 24 }}>
          {tab === 'playlist' ? (
            <PlaylistTab />
          ) : tab === 'continue' ? (
            <ContinueListeningTab />
          ) : tab === 'top' ? (
            <TopPodcastsTab />
          ) : tab === 'bundles' ? (
            <FeaturedBundlesTab />
          ) : (
            <RecommendedGrid
              selectedTopicId={params.get('topic')}
              onSelectTopic={(id) => setParam('topic', id)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

const DEMO_NOW_PLAYING: NowPlayingData = {
  episodeTitle: "Dual Agency: When Disclosure Isn't Enough",
  podcastTitle: 'The Ethics Hour',
  episodeNumber: 42,
  host: 'Maria Castillo, ABR',
  badge: 'Mandatory',
  creditHours: 1.0,
  creditStates: ['NC', 'AL', 'VA', 'SC'],
  totalSec: 3690, // 1:01:30
  checkpointSec: 2200, // ~36:40
}


function PlaylistTab() {
  if (MY_PODCAST_PLAYLIST.length === 0) {
    return (
      <EmptyState
        icon={<Podcast size={24} aria-hidden />}
        title="Your playlist is empty"
        description="Save podcasts you want to come back to. Browse what's recommended for you to add your first one."
        actionLabel="Browse Podcasts"
        actionTo="/my-learning/podcasts?tab=recommended"
      />
    )
  }
  const count = MY_PODCAST_PLAYLIST.length
  return (
    <section aria-labelledby="my-playlist-heading" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h2
            id="my-playlist-heading"
            style={{
              margin: 0,
              fontFamily: 'var(--font-heading)',
              fontWeight: 500,
              fontSize: 'var(--text-heading-2xl)',
              lineHeight: 'var(--text-heading-2xl--line-height)',
              color: 'var(--color-text-primary)',
            }}
          >
            My Playlist
          </h2>
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              color: 'var(--color-text-secondary)',
            }}
          >
            Your personalized learning queue
          </p>
        </div>
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--color-text-secondary)',
          }}
        >
          {count} Result{count === 1 ? '' : 's'}
        </span>
      </div>
      <MyPodcastsPlaylist rows={MY_PODCAST_PLAYLIST} />
    </section>
  )
}

function ContinueListeningTab() {
  if (CONTINUE_LISTENING.length === 0) {
    return (
      <EmptyState
        icon={<Podcast size={24} aria-hidden />}
        title="Nothing in progress"
        description="Episodes you start will show up here so you can pick up where you left off."
      />
    )
  }
  return (
    <section aria-labelledby="continue-listening-heading" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <h2
          id="continue-listening-heading"
          style={{
            margin: 0,
            fontFamily: 'var(--font-heading)',
            fontWeight: 500,
            fontSize: 'var(--text-heading-2xl)',
            lineHeight: 'var(--text-heading-2xl--line-height)',
            color: 'var(--color-text-primary)',
          }}
        >
          Continue Listening
        </h2>
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            color: 'var(--color-text-secondary)',
          }}
        >
          Resume from your last spot — credit progress saves automatically
        </p>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, 265px)',
          gap: 16,
        }}
      >
        {CONTINUE_LISTENING.map((entry) => (
          <ContinueListeningCard key={entry.id} data={entry} />
        ))}
      </div>
    </section>
  )
}

function FeaturedBundlesTab() {
  return (
    <section aria-labelledby="featured-bundles-heading" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h2
            id="featured-bundles-heading"
            style={{
              margin: 0,
              fontFamily: 'var(--font-heading)',
              fontWeight: 500,
              fontSize: 'var(--text-heading-2xl)',
              lineHeight: 'var(--text-heading-2xl--line-height)',
              color: 'var(--color-text-primary)',
            }}
          >
            Featured Bundles
          </h2>
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              color: 'var(--color-text-secondary)',
            }}
          >
            Curated series — complete the bundle, earn the certificate
          </p>
        </div>
        <button
          type="button"
          style={{
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            color: 'var(--podcast-accent)',
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Browse bundles ›
        </button>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, 420px)',
          gap: 16,
        }}
      >
        {FEATURED_BUNDLES.map((b) => (
          <FeaturedBundleCard key={b.id} data={b} />
        ))}
      </div>
    </section>
  )
}

function TopPodcastsTab() {
  return (
    <section aria-labelledby="top-podcasts-heading" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h2
            id="top-podcasts-heading"
            style={{
              margin: 0,
              fontFamily: 'var(--font-heading)',
              fontWeight: 500,
              fontSize: 'var(--text-heading-2xl)',
              lineHeight: 'var(--text-heading-2xl--line-height)',
              color: 'var(--color-text-primary)',
            }}
          >
            Top Podcasts This Week
          </h2>
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              color: 'var(--color-text-secondary)',
            }}
          >
            Most-played shows across Colibri Real Estate
          </p>
        </div>
        <button
          type="button"
          style={{
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            color: 'var(--podcast-accent)',
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          See full chart ›
        </button>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, 420px)',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {TOP_PODCASTS.slice(0, 5).map((p) => (
            <TopPodcastCard key={p.id} data={p} />
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {TOP_PODCASTS.slice(5).map((p) => (
            <TopPodcastCard key={p.id} data={p} />
          ))}
        </div>
      </div>
    </section>
  )
}

function RecommendedGrid({
  selectedTopicId,
  onSelectTopic,
}: {
  selectedTopicId: string | null
  onSelectTopic: (id: string | null) => void
}) {
  const selectedTopic = selectedTopicId
    ? BROWSE_TOPICS.find((t) => t.id === selectedTopicId) ?? null
    : null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <BrowseByTopicSection selectedTopicId={selectedTopicId} onSelectTopic={onSelectTopic} />
      <RecommendedForYouSection selectedTopic={selectedTopic} onClear={() => onSelectTopic(null)} />
    </div>
  )
}

function RecommendedForYouSection({
  selectedTopic,
  onClear,
}: {
  selectedTopic: PodcastTopic | null
  onClear: () => void
}) {
  const filtered = selectedTopic
    ? RECOMMENDED_PODCASTS.filter((p) => p.topicId === selectedTopic.id)
    : RECOMMENDED_PODCASTS
  return (
    <section aria-labelledby="recommended-for-you-heading" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h2
            id="recommended-for-you-heading"
            style={{
              margin: 0,
              fontFamily: 'var(--font-heading)',
              fontWeight: 500,
              fontSize: 'var(--text-heading-2xl)',
              lineHeight: 'var(--text-heading-2xl--line-height)',
              color: 'var(--color-text-primary)',
            }}
          >
            {selectedTopic ? selectedTopic.title : 'Recommended for You'}
          </h2>
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              color: 'var(--color-text-secondary)',
            }}
          >
            {selectedTopic
              ? `Podcasts in ${selectedTopic.title}`
              : 'Picks tuned to your listening history and license state'}
          </p>
        </div>
        {selectedTopic && (
          <button
            type="button"
            onClick={onClear}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              color: 'var(--podcast-accent)',
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Clear topic ×
          </button>
        )}
      </div>
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Podcast size={24} aria-hidden />}
          title={selectedTopic ? `No podcasts in ${selectedTopic.title} yet` : 'No recommendations yet'}
          description={
            selectedTopic
              ? 'Check back soon — new episodes are added every week.'
              : "Check back soon — we're tuning recommendations to your learning history."
          }
          actionLabel={selectedTopic ? 'Clear topic' : undefined}
          actionTo={selectedTopic ? '/my-learning/podcasts?tab=recommended' : undefined}
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, 265px)',
            gap: 16,
          }}
        >
          {filtered.map((p) => (
            <PodcastCard key={p.id} data={p} />
          ))}
        </div>
      )}
    </section>
  )
}

function BrowseByTopicSection({
  selectedTopicId,
  onSelectTopic,
}: {
  selectedTopicId: string | null
  onSelectTopic: (id: string | null) => void
}) {
  return (
    <section aria-labelledby="browse-by-topic-heading" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h2
            id="browse-by-topic-heading"
            style={{
              margin: 0,
              fontFamily: 'var(--font-heading)',
              fontWeight: 500,
              fontSize: 'var(--text-heading-2xl)',
              lineHeight: 'var(--text-heading-2xl--line-height)',
              color: 'var(--color-text-primary)',
            }}
          >
            Browse by Topic
          </h2>
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              color: 'var(--color-text-secondary)',
            }}
          >
            Find episodes filtered to the state requirements you need
          </p>
        </div>
        <button
          type="button"
          className="cre-link-action"
          style={{
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            color: 'var(--podcast-accent)',
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          See All topics ›
        </button>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(9, 1fr)',
          gap: 12,
        }}
      >
        {BROWSE_TOPICS.map((t) => (
          <TopicTile
            key={t.id}
            topic={t}
            selected={t.id === selectedTopicId}
            onSelect={() => onSelectTopic(t.id === selectedTopicId ? null : t.id)}
          />
        ))}
      </div>
    </section>
  )
}

function TopicTile({
  topic,
  selected,
  onSelect,
}: {
  topic: PodcastTopic
  selected: boolean
  onSelect: () => void
}) {
  const Icon = topic.icon
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`${topic.title} — ${topic.episodes} episodes`}
      aria-pressed={selected}
      className="cre-topic-tile"
      style={{
        position: 'relative',
        height: 112,
        padding: '12px',
        border: 'none',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        cursor: 'pointer',
        textAlign: 'left',
        color: 'var(--color-text-inverse)',
        background: `linear-gradient(135deg, ${topic.gradient[0]}, ${topic.gradient[1]})`,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        outline: selected ? '2px solid var(--color-primary-500)' : 'none',
        outlineOffset: selected ? 2 : 0,
      }}
    >
      <span
        aria-hidden
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 24,
          height: 24,
          flexShrink: 0,
          color: 'var(--color-text-inverse)',
        }}
      >
        <Icon size={20} aria-hidden />
      </span>
      <h3
        style={{
          margin: 0,
          fontFamily: 'var(--font-heading)',
          fontWeight: 500,
          fontSize: 16,
          lineHeight: 1.2,
          color: 'inherit',
        }}
      >
        {topic.title}
      </h3>
      <p
        style={{
          margin: 'auto 0 0',
          fontFamily: 'var(--font-body)',
          fontSize: 10,
          fontWeight: 600,
          opacity: 0.85,
          color: 'inherit',
          lineHeight: 1.3,
        }}
      >
        {topic.episodes} ep · {topic.hours} hrs
      </p>
    </button>
  )
}
