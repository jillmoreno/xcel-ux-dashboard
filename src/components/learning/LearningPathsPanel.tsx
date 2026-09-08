import { X } from '@/icons'
import { Sheet } from '@/components/ui/Sheet'
import type { LearningPathSheetStatus } from '@/data/learningFixtures'
import type { HomeStatus } from './learningPathsHomeUtil'

/**
 * "My Learning Paths" slide-over — **Lo-fi placeholder (hard default)**.
 *
 * The prior "Option 1 refined" treatment
 * (`explorations/learning-paths-sheet/sheet-view-option1-refined.html`) is NOT
 * approved and needs more work, so the panel renders a stripped-back lo-fi
 * placeholder everywhere — including the stakeholder Demo. This is deliberately
 * not flag-gated: there is one experience until the real design is signed off.
 *
 * Only the finished chrome is real — the **Close** control and the **My
 * Learning Paths** title. Everything below is neutral grayscale blocks: a
 * pinned selected-path summary + a short list of path cards. The search field,
 * status filter chips, and sort control are removed entirely. Reference:
 * `explorations/learning-paths-sheet/sheet-view-lofi.html`.
 *
 * The functional props (`activePathId`, `onSelectPath`, `activeStatus`) are kept
 * on the type so every caller compiles unchanged; they're intentionally unused
 * while the panel is a placeholder.
 */

type Props = {
  open: boolean
  onClose: () => void
  activePathId: string
  onSelectPath: (id: string) => void
  /** Kept for API compatibility; unused while the panel is a lo-fi placeholder. */
  activeStatus?: HomeStatus | null
  /** @deprecated — retained so imports of this type don't break. */
  _sheetStatus?: LearningPathSheetStatus
}

export function LearningPathsPanel({ open, onClose }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title="My Learning Paths">
      {/* ── Real chrome: Close + title ─────────────────────────────────── */}
      <header
        style={{ padding: '20px 24px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close panel"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            alignSelf: 'flex-start',
            padding: 0,
            background: 'transparent',
            border: 'none',
            color: 'var(--color-secondary-600)',
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <X size={16} aria-hidden />
          Close
        </button>
        <h2
          style={{
            margin: 0,
            fontFamily: 'var(--font-heading)',
            fontWeight: 600,
            fontSize: 24,
            lineHeight: '32px',
            color: 'var(--color-primary-700)',
          }}
        >
          My Learning Paths
        </h2>
      </header>
      <div aria-hidden style={{ height: 1, background: 'var(--color-border-subtle)' }} />

      {/* ── Lo-fi body: pinned placeholder + list placeholders ─────────── */}
      <div
        aria-hidden
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 24px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {/* Pinned "selected path" — the only differentiator is a heavier frame. */}
        <div
          style={{
            background: 'var(--color-surface-card)',
            border: '1.5px solid var(--color-neutral-400)',
            borderRadius: 'var(--radius-lg)',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <LoFiBar width={70} height={8} tone="var(--color-neutral-300)" />
          <LoFiBar width="70%" height={14} />
          <LoFiBar width="50%" height={9} />
          <LoFiBar width="40%" height={9} />
          <LoFiBar width="80%" height={12} style={{ marginTop: 4 }} />
        </div>

        {/* Placeholder path cards. */}
        {LOFI_CARDS.map((w, i) => (
          <div
            key={i}
            style={{
              background: 'var(--color-surface-card)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <LoFiBar width={w.title} height={14} />
            <LoFiBar width={w.line1} height={9} />
            <LoFiBar width={w.line2} height={9} />
            <LoFiBar width={w.track} height={6} style={{ marginTop: 6 }} />
          </div>
        ))}
      </div>
    </Sheet>
  )
}

/* ─── Lo-fi primitives ───────────────────────────────────────────────── */

const LOFI_CARDS = [
  { title: '70%', line1: '50%', line2: '40%', track: '90%' },
  { title: '60%', line1: '50%', line2: '35%', track: '80%' },
  { title: '70%', line1: '40%', line2: '50%', track: '60%' },
] as const

function LoFiBar({
  width,
  height,
  tone = 'var(--color-neutral-200)',
  style,
}: {
  width: number | string
  height: number
  tone?: string
  style?: React.CSSProperties
}) {
  return (
    <span
      aria-hidden
      style={{
        display: 'block',
        width: typeof width === 'number' ? `${width}px` : width,
        height,
        borderRadius: 6,
        background: tone,
        ...style,
      }}
    />
  )
}
