import { type CSSProperties, type ReactNode } from 'react'
import { ArrowRight } from '@/icons'
import { useDeviceFrame } from '@/components/layout/DeviceFrameContext'
import type { LearningPathSummary } from '@/data/learningFixtures'
import { LICENSE_TRACKER } from '@/data/dashboardFixtures'

/**
 * EmptyPathBuildBand — the Current Learning Path band for an EMPTY path
 * (Persona 3: a path is assigned but holds no courses yet). Instead of a 0-of-0
 * gauge that reads as broken, the band becomes a guided "Let's build your
 * Learning Path" prompt: an action eyebrow, the path name as the title, a lede,
 * a Browse Catalog CTA, and the renewal stats (deadline / time remaining /
 * required hours) carried on the side for context.
 *
 * Approved design: explorations/current-learning-path-empty/empty-path-home.html
 * (Option B). Full-width navy band; stacks on tablet + mobile. Every color is a
 * brand token so it relights per `<html data-brand>`.
 */
type Props = {
  path: LearningPathSummary
  /** Demo renewal override (persona): the deadline + time-remaining stats. */
  renewal?: { deadline: string; weeksLeft: number }
  /** Full-bleed hero treatment (`dashboard-hero-bleed`). */
  bleed?: boolean
  /** Opens the Course Catalog (in-shell rail section). */
  onBrowseCatalog?: () => void
}

const HERO_BLEED: CSSProperties = {
  marginTop: -24,
  marginLeft: -40,
  marginRight: 'calc(-40px - max(0px, (100vw - 1440px)))',
  borderRadius: 0,
  boxShadow: 'none',
}

export function EmptyPathBuildBand({ path, renewal, bleed = false, onBrowseCatalog }: Props) {
  const device = useDeviceFrame().device
  const mobile = device === 'mobile'
  const stack = mobile || device === 'tablet'

  const mandatory = path.mandatory ?? { completed: 0, required: 0 }
  const elective = path.elective ?? { completed: 0, required: 0 }
  const totalRequired = mandatory.required + elective.required || path.hours
  const deadlineLabel = path.deadlineLabel ?? 'License Expires'

  const { expires } = LICENSE_TRACKER
  const weeksLeft = renewal?.weeksLeft ?? LICENSE_TRACKER.weeksLeft
  const expiresMonth = expires.month.charAt(0) + expires.month.slice(1, 3).toLowerCase()
  const deadline = renewal?.deadline ?? `${expiresMonth} ${expires.day}, ${expires.year}`
  const yearsLeft = Math.floor(weeksLeft / 52)
  const remWeeks = weeksLeft % 52
  const timeLeft =
    yearsLeft > 0 ? `${yearsLeft} yr${yearsLeft > 1 ? 's' : ''}, ${remWeeks} wks` : `${weeksLeft} wks`

  const cardChrome: CSSProperties = mobile
    ? { marginLeft: -16, marginRight: -16, borderRadius: 0 }
    : bleed
      ? HERO_BLEED
      : {
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 18px 40px -18px color-mix(in srgb, var(--color-primary-900) 55%, transparent)',
        }

  return (
    <section
      aria-label="Build your learning path"
      className="cre-clp-jbi-band"
      style={{
        display: 'grid',
        gridTemplateColumns: stack ? 'minmax(0, 1fr)' : 'minmax(0, 1.3fr) minmax(0, 0.9fr)',
        gap: stack ? 22 : 36,
        alignItems: 'center',
        background: 'linear-gradient(135deg, var(--color-primary-700), var(--color-primary-800))',
        color: 'rgb(255 255 255 / 1)',
        padding: stack ? '24px 24px 26px' : '24px 40px',
        overflow: 'hidden',
        ...cardChrome,
      }}
    >
      {/* ── content ── */}
      <div>
        <p
          style={{
            margin: '0 0 6px',
            fontFamily: 'var(--font-body)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            // Light gray (fixed white-alpha, not a neutral token, so it stays
            // legible on the navy band in both themes). Passes WCAG AA.
            color: 'rgb(255 255 255 / 0.85)',
          }}
        >
          Let&apos;s build your Learning Path
        </p>
        <h2
          style={{
            margin: '0 0 8px',
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            fontSize: 26,
            lineHeight: 1.14,
            // Explicit inverse — the app's global heading color is dark and would
            // otherwise win over the inherited band color.
            color: 'var(--color-text-inverse)',
          }}
        >
          {path.title}
        </h2>
        <p
          style={{
            margin: '0 0 16px',
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            lineHeight: 1.5,
            color: 'rgb(255 255 255 / 0.82)',
            maxWidth: '48ch',
          }}
        >
          Browse the catalog and enroll—we&apos;ll automatically track your progress toward meeting your
          requirements.
        </p>
        <button
          type="button"
          onClick={() => (onBrowseCatalog ? onBrowseCatalog() : console.info('cta:browse-catalog'))}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            height: 46,
            padding: '0 24px',
            borderRadius: 'var(--radius-sm)',
            border: 0,
            cursor: 'pointer',
            background: 'linear-gradient(180deg, var(--color-cta-500), var(--color-cta-600))',
            color: 'rgb(255 255 255 / 1)',
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          Browse Catalog <ArrowRight size={16} />
        </button>
      </div>

      {/* ── stats (no heading) ── */}
      <div
        style={{
          borderLeft: stack ? 'none' : '1px solid rgb(255 255 255 / 0.14)',
          borderTop: stack ? '1px solid rgb(255 255 255 / 0.14)' : 'none',
          paddingLeft: stack ? 0 : 32,
          paddingTop: stack ? 22 : 0,
        }}
      >
        <BuildStat k={deadlineLabel} v={deadline} />
        <BuildStat k="Time Remaining" v={timeLeft} />
        <BuildStat k="Required" v={`${totalRequired} credit hours`} last />
      </div>
    </section>
  )
}

function BuildStat({ k, v, last = false }: { k: string; v: ReactNode; last?: boolean }) {
  return (
    <div style={{ margin: last ? 0 : '0 0 14px' }}>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgb(255 255 255 / 0.7)' }}>{k}</div>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 19, fontWeight: 700 }}>{v}</div>
    </div>
  )
}
