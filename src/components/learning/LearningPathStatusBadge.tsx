import type { LearningPathSummary } from '@/data/learningFixtures'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import {
  HOME_STATUS_META,
  homeStatusFor,
  statusLabel,
  type HomeStatus,
  type StatusTaxonomy,
} from './learningPathsHomeUtil'

/**
 * Soft-tinted rounded status pill for a learning path — the status hue reads
 * from the fill + label (no left accent). Shared by the Learning Path homepage
 * cards (grid + list) and the table view so all surfaces render one consistent
 * badge. The label set (compliance vs. status) is driven by the
 * `learning-paths-status-taxonomy` flag; colors are shared across both.
 *
 * Pass a `path` (the status is derived) OR an explicit `status` (used directly
 * — e.g. the dev-handoff status matrix, which renders every state without a
 * fixture path). Exactly one is expected; `status` wins when both are given.
 */
export function LearningPathStatusBadge({
  path,
  status: statusProp,
}: {
  path?: LearningPathSummary
  status?: HomeStatus
}) {
  const taxonomy = (useFeatureFlag('learning-paths-status-taxonomy').variant ??
    'compliance') as StatusTaxonomy
  const status = statusProp ?? (path ? homeStatusFor(path) : 'not-started')
  const meta = HOME_STATUS_META[status]
  const label = statusLabel(status, taxonomy)
  const Icon = meta.icon
  return (
    <span
      aria-label={label}
      style={{
        flex: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 10px',
        borderRadius: 'var(--radius-pill)',
        // Outline pill (muted neutral statuses): transparent fill + a hairline
        // border via inset shadow so the pill keeps the same box size as the
        // filled variants. Filled statuses use their tinted `bg`.
        background: meta.outline ? 'transparent' : meta.bg,
        boxShadow: meta.outline ? `inset 0 0 0 1px ${meta.border}` : undefined,
        color: meta.text,
        fontFamily: 'var(--font-body)',
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {Icon && <Icon size={12} aria-hidden />}
      {label}
    </span>
  )
}
