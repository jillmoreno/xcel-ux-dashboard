/**
 * Achievements Passport — full-page collection at /account/achievements.
 *
 * Renders the complete 57-entry catalog as a passport: a deep-navy cover
 * band, a 4-stat row, category tabs (with category-color dots), and per-
 * category page spreads. The default landing tab is "All", which
 * interleaves every achievement so the user can see the whole collection
 * at once. The dedicated category tabs filter down to one taxonomy.
 *
 * The Hidden tab only renders when the user has at least one earned
 * `hidden` achievement — Easter eggs stay hidden until the surprise.
 * Locked stamps render as dashed-silhouette versions of the category
 * shape via `PassportStamp state="locked"` — so the user can see "what's
 * coming" without misreading it as earned.
 *
 * Active category is URL-driven via `?category=` so deep links work and
 * the back button reproduces tab state.
 */

import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAccount, professionFor, type Brand } from '@/context/AccountContext'
import {
  ACHIEVEMENT_CATALOG,
  achievementsFor,
  type Achievement,
  type AchievementCategory,
} from '@/data/achievements'
import { AchievementTile } from '@/components/achievements/AchievementTile'
import { Award } from '@/icons'

/** "All" is a special tab id that isn't an actual category — represented
 *  as a literal string so the URL-param plumbing can switch on it. */
type TabId = 'all' | AchievementCategory

type TabDef = {
  id: TabId
  label: string
  blurb: string
}

const TAB_DEFS: TabDef[] = [
  {
    id: 'all',
    label: 'All',
    blurb: '"Earned and unearned. Six shapes, one passport."',
  },
  {
    id: 'streaks',
    label: 'Streaks',
    blurb: '"Show up, day after day. Consistency is the quiet superpower."',
  },
  {
    id: 'achievements',
    label: 'Achievements',
    blurb: '"What you finished. The work that bears your name."',
  },
  {
    id: 'mastery',
    label: 'Mastery',
    blurb: '"Depth — not just done, but done well."',
  },
  {
    id: 'lifecycle',
    label: 'Lifecycle',
    blurb: '"Membership, renewal, anniversaries — the long arc."',
  },
  {
    id: 'community',
    label: 'Community',
    blurb: '"Showing up for the people around you."',
  },
  {
    id: 'hidden',
    label: 'Hidden',
    blurb: '"Unexpected unlocks. Discovered, not chased."',
  },
]

const PAGE_NUMBER: Record<TabId, string> = {
  all: 'PAGE 00',
  streaks: 'PAGE 01',
  achievements: 'PAGE 02',
  mastery: 'PAGE 03',
  lifecycle: 'PAGE 04',
  community: 'PAGE 05',
  hidden: 'PAGE 06',
}

/** Per-brand member-since string for the footer ribbon. */
function memberSinceFor(brand: Brand): string {
  switch (brand) {
    case 'mckissock':
      return 'Sep 2025'
    case 'elite':
    case 'fitzgerald':
      return 'Apr 2025'
    case 'stc':
      return 'Jul 2022'
    case 'cre':
    default:
      return 'Feb 2024'
  }
}

export function AchievementsPage() {
  const { brand } = useAccount()
  const profession = professionFor(brand)
  const [params, setParams] = useSearchParams()
  const all = useMemo(() => achievementsFor(brand), [brand])

  const byCategory = useMemo(() => {
    const buckets: Record<AchievementCategory, Achievement[]> = {
      streaks: [],
      achievements: [],
      mastery: [],
      lifecycle: [],
      community: [],
      hidden: [],
    }
    for (const a of all) buckets[a.category].push(a)
    return buckets
  }, [all])

  const hasHidden = byCategory.hidden.some((a) => a.status === 'earned')
  const visibleTabs = TAB_DEFS.filter((t) => t.id !== 'hidden' || hasHidden)

  const requested = (params.get('category') ?? 'all') as TabId
  const active: TabId =
    visibleTabs.find((t) => t.id === requested)?.id ?? 'all'

  const setActive = (next: TabId) => {
    setParams(
      (prev) => {
        const out = new URLSearchParams(prev)
        if (next === 'all') out.delete('category')
        else out.set('category', next)
        return out
      },
      { replace: true },
    )
  }

  const earnedTotal = all.filter((a) => a.status === 'earned').length

  // Stats — newest earned, rarest earned, closest pending.
  const newest = useMemo(() => {
    const earned = all.filter((a) => a.status === 'earned' && a.earnedOn)
    earned.sort((a, b) => (b.earnedOn ?? '').localeCompare(a.earnedOn ?? ''))
    return earned[0]
  }, [all])

  const rarest = useMemo(() => {
    const earned = all.filter((a) => a.status === 'earned' && a.rarityPct > 0)
    earned.sort((a, b) => a.rarityPct - b.rarityPct)
    return earned[0]
  }, [all])

  const closest = useMemo(() => {
    const progress = all.filter(
      (a) => a.status === 'progress' && a.progress && a.progress.target > 0,
    )
    progress.sort((a, b) => {
      const aPct = a.progress!.current / a.progress!.target
      const bPct = b.progress!.current / b.progress!.target
      return bPct - aPct
    })
    return progress[0]
  }, [all])

  return (
    <div style={{ padding: '24px 64px 64px', width: '100%' }}>
      <div style={passportShellStyle}>
        <div aria-hidden style={paperGrainStyle} />

        {/* Cover band */}
        <header style={coverStyle}>
          <div>
            <div style={coverEyebrowStyle}>
              Colibri · {profession.label} · Member Passport
            </div>
            <h1 style={coverTitleStyle}>Your Achievements</h1>
            <div style={coverSubtitleStyle}>
              A record of every win, every renewal, every place you&rsquo;ve
              been on the journey.
            </div>
          </div>
          <div aria-hidden style={coverEmblemStyle}>
            <Award size={42} aria-hidden />
          </div>
        </header>

        {/* Stats row */}
        <div style={statsRowStyle}>
          <Stat
            label="Stamps Collected"
            value={`${earnedTotal} / ${ACHIEVEMENT_CATALOG.length}`}
            meta="Across 6 territories"
          />
          <Stat
            label="Most Recent"
            value={newest ? newest.title : '—'}
            meta={
              newest && newest.earnedOn
                ? `Stamped ${formatStampDate(newest.earnedOn)}`
                : ' '
            }
          />
          <Stat
            label="Rarest Held"
            value={rarest ? rarest.title : '—'}
            meta={rarest ? `${rarest.rarityPct}% of members` : ' '}
          />
          <Stat
            label="Closest Pending"
            value={closest ? closest.title : '—'}
            meta={
              closest && closest.progress
                ? `${closest.progress.current} / ${closest.progress.target} · ${Math.round(
                    (closest.progress.current / closest.progress.target) * 100,
                  )}%`
                : ' '
            }
            noBorder
          />
        </div>

        {/* Category tabs */}
        <nav
          role="tablist"
          aria-label="Achievement categories"
          style={tabsRowStyle}
        >
          {visibleTabs.map((t) => {
            const isActive = t.id === active
            const isAll = t.id === 'all'
            // Narrow the bucket lookup — `t.id === 'all'` falls through
            // to undefined which the chip-render branch skips entirely.
            const bucket = isAll ? null : byCategory[t.id as AchievementCategory]
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`achievements-panel-${t.id}`}
                id={`achievements-tab-${t.id}`}
                onClick={() => setActive(t.id)}
                style={tabButtonStyle(isActive)}
                type="button"
              >
                <span
                  aria-hidden
                  style={{
                    ...tabDotStyle,
                    background: isAll
                      ? isActive
                        ? 'var(--ink-stamp)'
                        : 'color-mix(in srgb, var(--ink-faded) 80%, transparent)'
                      : `var(--ink-${t.id})`,
                  }}
                />
                {t.label}
                {bucket && (
                  <span style={tabCountChipStyle}>
                    {bucket.filter((a) => a.status === 'earned').length}
                    /{bucket.length}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Active spread */}
        {active === 'all' ? (
          <AllSpread items={all} />
        ) : (
          <CategorySpread
            category={active}
            items={byCategory[active]}
            definition={visibleTabs.find((t) => t.id === active)!}
          />
        )}

        {/* Footer ribbon */}
        <div style={ribbonStyle}>
          <span>★ Issued by {profession.brandFullName}</span>
          <span>Member · Since {memberSinceFor(brand)}</span>
        </div>
      </div>
    </div>
  )
}

/* ─── Spreads ───────────────────────────────────────────────────────── */

function AllSpread({ items }: { items: Achievement[] }) {
  const definition = TAB_DEFS[0]
  // Sort: earned (newest first) → ready → progress (highest % first) →
  // locked (catalog order). Hidden+locked stays hidden — those don't
  // render at all on the "All" view.
  const sorted = useMemo(() => {
    const earned = items
      .filter((a) => a.status === 'earned')
      .sort((a, b) => (b.earnedOn ?? '').localeCompare(a.earnedOn ?? ''))
    const ready = items.filter((a) => a.status === 'ready')
    const progress = items
      .filter((a) => a.status === 'progress')
      .sort((a, b) => {
        const aPct = a.progress
          ? a.progress.current / a.progress.target
          : 0
        const bPct = b.progress
          ? b.progress.current / b.progress.target
          : 0
        return bPct - aPct
      })
    const locked = items.filter(
      (a) => a.status === 'locked' && a.category !== 'hidden',
    )
    return [...earned, ...ready, ...progress, ...locked]
  }, [items])

  return (
    <div
      role="tabpanel"
      id="achievements-panel-all"
      aria-labelledby="achievements-tab-all"
      style={spreadStyle}
    >
      <div style={pageHeaderStyle}>
        <div>
          <h2 style={pageTitleStyle}>EVERYTHING</h2>
          <div style={pageDescStyle}>{definition.blurb}</div>
        </div>
        <div style={pageNumberStyle}>— {PAGE_NUMBER.all} —</div>
      </div>
      <div style={stampGridStyle}>
        {sorted.map((a) => (
          <AchievementTile key={a.id} achievement={a} variant="page" />
        ))}
      </div>
    </div>
  )
}

function CategorySpread({
  category,
  items,
  definition,
}: {
  category: AchievementCategory
  items: Achievement[]
  definition: TabDef
}) {
  const earned = items.filter((a) => a.status === 'earned').length
  const total = items.length
  const pct = total === 0 ? 0 : Math.round((earned / total) * 100)

  // Order: earned (newest first) → ready → progress (highest % first) →
  // locked. For Hidden specifically we suppress the silhouette of
  // locked Easter eggs (they render as ??? + the wax-seal blob).
  const sorted = useMemo(() => {
    const earnedList = items
      .filter((a) => a.status === 'earned')
      .sort((a, b) => (b.earnedOn ?? '').localeCompare(a.earnedOn ?? ''))
    const ready = items.filter((a) => a.status === 'ready')
    const progress = items
      .filter((a) => a.status === 'progress')
      .sort((a, b) => {
        const aPct = a.progress
          ? a.progress.current / a.progress.target
          : 0
        const bPct = b.progress
          ? b.progress.current / b.progress.target
          : 0
        return bPct - aPct
      })
    const locked = items.filter((a) => a.status === 'locked')
    return [...earnedList, ...ready, ...progress, ...locked]
  }, [items])

  return (
    <div
      role="tabpanel"
      id={`achievements-panel-${category}`}
      aria-labelledby={`achievements-tab-${category}`}
      style={spreadStyle}
    >
      <div style={pageHeaderStyle}>
        <div>
          <h2 style={pageTitleStyle}>{definition.label.toUpperCase()}</h2>
          <div style={pageDescStyle}>{definition.blurb}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <div style={progressStripStyle}>
            <span>STAMPED</span>
            <div style={progressBarStyle}>
              <span
                style={{
                  display: 'block',
                  height: '100%',
                  width: `${pct}%`,
                  background: `var(--ink-${category})`,
                  borderRadius: 'var(--radius-pill)',
                }}
              />
            </div>
            <span>
              {earned} OF {total}
            </span>
          </div>
          <div style={pageNumberStyle}>— {PAGE_NUMBER[category]} —</div>
        </div>
      </div>

      <div style={stampGridStyle}>
        {sorted.map((a) => (
          <AchievementTile key={a.id} achievement={a} variant="page" />
        ))}
      </div>
    </div>
  )
}

/* ─── Stat row helper ───────────────────────────────────────────────── */

function Stat({
  label,
  value,
  meta,
  noBorder,
}: {
  label: string
  value: string
  meta: string
  noBorder?: boolean
}) {
  return (
    <div
      style={{
        padding: '18px 24px',
        borderRight: noBorder
          ? 'none'
          : '1px dashed color-mix(in srgb, var(--ink-faded) 35%, transparent)',
      }}
    >
      <div style={statLabelStyle}>{label}</div>
      <div style={statValueStyle}>{value}</div>
      <div style={statMetaStyle}>{meta}</div>
    </div>
  )
}

/* ─── helpers ───────────────────────────────────────────────────────── */

function formatStampDate(iso: string | undefined): string {
  if (!iso) return ''
  const parts = iso.split('-').map((s) => parseInt(s, 10))
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return iso
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[parts[1] - 1]} ${parts[2]}, ${parts[0]}`
}

/* ─── styles ────────────────────────────────────────────────────────── */

const passportShellStyle: React.CSSProperties = {
  maxWidth: 1100,
  margin: '0 auto',
  background:
    'linear-gradient(180deg, var(--color-surface-parchment) 0%, var(--color-surface-parchment-deep) 100%)',
  border: '1px solid var(--color-surface-parchment-edge)',
  borderRadius: 'var(--radius-xl)',
  boxShadow: 'var(--shadow-modal)',
  overflow: 'hidden',
  position: 'relative',
}

const paperGrainStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  backgroundImage: `
    radial-gradient(circle at 20% 30%, color-mix(in srgb, var(--ink-faded) 30%, transparent) 1px, transparent 1px),
    radial-gradient(circle at 70% 70%, color-mix(in srgb, var(--ink-faded) 30%, transparent) 1px, transparent 1px),
    radial-gradient(circle at 50% 10%, color-mix(in srgb, var(--ink-faded) 22%, transparent) 2px, transparent 2px)
  `,
  backgroundSize: '40px 40px, 60px 60px, 80px 80px',
  pointerEvents: 'none',
  zIndex: 0,
}

const coverStyle: React.CSSProperties = {
  background: 'var(--ink-deep)',
  color: '#f0e4c4',
  padding: '26px 36px',
  display: 'grid',
  gridTemplateColumns: '1fr auto',
  gap: 16,
  alignItems: 'center',
  position: 'relative',
  zIndex: 1,
}

const coverEyebrowStyle: React.CSSProperties = {
  fontFamily: 'var(--font-stamp)',
  fontSize: 11,
  letterSpacing: '0.32em',
  textTransform: 'uppercase',
  color: 'var(--ink-gilt)',
  marginBottom: 6,
}

const coverTitleStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-stamp)',
  fontSize: 28,
  fontWeight: 400,
  color: '#f0e4c4',
  letterSpacing: '0.04em',
}

const coverSubtitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  opacity: 0.75,
  marginTop: 4,
}

const coverEmblemStyle: React.CSSProperties = {
  width: 84,
  height: 84,
  borderRadius: '50%',
  border: '2px solid var(--ink-gilt)',
  display: 'grid',
  placeItems: 'center',
  color: 'var(--ink-gilt)',
  background:
    'radial-gradient(circle at 30% 30%, color-mix(in srgb, var(--ink-gilt) 18%, transparent), transparent 70%)',
}

const statsRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  background: 'color-mix(in srgb, white 20%, transparent)',
  borderBottom:
    '1px solid color-mix(in srgb, var(--ink-faded) 25%, transparent)',
  position: 'relative',
  zIndex: 1,
}

const statLabelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-stamp)',
  fontSize: 11,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--ink-faded)',
}

const statValueStyle: React.CSSProperties = {
  fontFamily: 'var(--font-stamp)',
  fontSize: 22,
  color: 'var(--ink-deep)',
  marginTop: 4,
}

const statMetaStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  color: 'var(--color-text-secondary)',
  marginTop: 2,
  minHeight: 16,
}

const tabsRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 0,
  padding: '14px 24px 0',
  borderBottom:
    '1px solid color-mix(in srgb, var(--ink-faded) 25%, transparent)',
  overflowX: 'auto',
  background: 'color-mix(in srgb, white 18%, transparent)',
  position: 'relative',
  zIndex: 1,
}

function tabButtonStyle(isActive: boolean): React.CSSProperties {
  return {
    appearance: 'none',
    background: 'transparent',
    border: 'none',
    padding: '10px 14px',
    marginBottom: -1,
    fontFamily: 'var(--font-stamp)',
    fontSize: 11,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: isActive ? 'var(--ink-deep)' : 'var(--ink-faded)',
    cursor: 'pointer',
    borderBottom: isActive
      ? '2px solid var(--ink-stamp)'
      : '2px solid transparent',
    whiteSpace: 'nowrap',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  }
}

const tabDotStyle: React.CSSProperties = {
  display: 'inline-block',
  width: 6,
  height: 6,
  borderRadius: '50%',
}

const tabCountChipStyle: React.CSSProperties = {
  fontFamily: 'var(--font-stamp)',
  fontSize: 10,
  background: 'color-mix(in srgb, var(--ink-faded) 18%, transparent)',
  padding: '1px 6px',
  borderRadius: 'var(--radius-pill)',
  color: 'var(--ink-deep)',
  marginLeft: 2,
}

const spreadStyle: React.CSSProperties = {
  padding: '32px 36px 40px',
  position: 'relative',
  zIndex: 1,
}

const pageHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'space-between',
  marginBottom: 22,
  paddingBottom: 14,
  borderBottom:
    '1px dashed color-mix(in srgb, var(--ink-faded) 60%, transparent)',
  gap: 16,
  flexWrap: 'wrap',
}

const pageTitleStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-stamp)',
  fontSize: 18,
  color: 'var(--ink-deep)',
  letterSpacing: '0.06em',
  fontWeight: 400,
}

const pageDescStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontStyle: 'italic',
  color: 'var(--color-text-secondary)',
  marginTop: 4,
}

const progressStripStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  fontFamily: 'var(--font-stamp)',
  fontSize: 11,
  letterSpacing: '0.08em',
  color: 'var(--ink-deep)',
}

const progressBarStyle: React.CSSProperties = {
  width: 160,
  height: 4,
  background: 'color-mix(in srgb, var(--ink-faded) 30%, transparent)',
  borderRadius: 'var(--radius-pill)',
  overflow: 'hidden',
}

const pageNumberStyle: React.CSSProperties = {
  fontFamily: 'var(--font-stamp)',
  fontSize: 11,
  letterSpacing: '0.18em',
  color: 'var(--ink-faded)',
  textTransform: 'uppercase',
}

const stampGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
  gap: 24,
  justifyItems: 'center',
}

const ribbonStyle: React.CSSProperties = {
  background: 'var(--ink-deep)',
  color: 'var(--ink-gilt)',
  padding: '14px 36px',
  fontFamily: 'var(--font-stamp)',
  fontSize: 12,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  position: 'relative',
  zIndex: 1,
}
