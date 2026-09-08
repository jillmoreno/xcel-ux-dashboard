import { useState, type CSSProperties } from 'react'
import { ChevronDown, FileText, StarSolid, ChevronRight } from '@/icons'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { ATTACHMENT_ICON } from './resourceContentIcons'
import type {
  ResourceAttachment,
  SuggestedResource,
  SuggestionAccent,
} from '@/data/resourceUpdatesFixtures'

/**
 * The unified resource right rail: **Attachments** (top, count-driven)
 * over **Suggested Similar Topics** (a YouTube-style related-resources
 * pane). Shared by the `/resource-updates` demo page and the dev-handoff
 * live preview.
 *
 * Count-driven attachment treatment (per Jillienne):
 *   0  → the Attachments block is omitted entirely.
 *   1  → pin-first: the single attachment renders as one card, always
 *        visible, no collapse (nothing to hide → no extra click).
 *   2+ → collapse-all: the block rests as "Attachments (n) · tap to view"
 *        and expands on header click.
 *
 * Order is fixed — attachments always sit above suggestions ("what's part
 * of this resource" before "what to explore next").
 *
 * Feature flags (page `learning-resources`, all default ON):
 *   resource-attachments          — show/hide the Attachments block
 *   resource-suggested-topics     — show/hide the Suggested Topics pane
 *   resource-suggestion-reason    — show/hide the "why you're seeing this" chips
 *   resource-suggestion-filters   — show/hide the category filter-chip row
 */

type Props = {
  attachments: ResourceAttachment[]
  suggested: SuggestedResource[]
  /** Label for the "See all" link under suggestions. */
  seeAllLabel?: string
}

export function ResourceRail({ attachments, suggested, seeAllLabel }: Props) {
  const attachmentsFlag = useFeatureFlag('resource-attachments')
  const suggestedFlag = useFeatureFlag('resource-suggested-topics')

  const showAttachments = attachmentsFlag.enabled && attachments.length > 0
  const showSuggested = suggestedFlag.enabled && suggested.length > 0

  return (
    <aside style={paneStyle} aria-label="Resource extras">
      {showAttachments && <AttachmentsBlock attachments={attachments} />}
      {showSuggested && (
        <SuggestedTopics suggested={suggested} seeAllLabel={seeAllLabel} />
      )}
    </aside>
  )
}

/* ─── Attachments block (count-driven) ─────────────────────────────── */

function AttachmentsBlock({ attachments }: { attachments: ResourceAttachment[] }) {
  const isMulti = attachments.length > 1
  // 1 attachment → always shown (no collapse). 2+ → collapsed by default.
  const [open, setOpen] = useState(false)

  const count = attachments.length
  const collapsed = isMulti && !open

  return (
    <section style={blockStyle}>
      {isMulti ? (
        <h2 style={headingResetStyle}>
          <button
            type="button"
            className="cre-ru-collapse"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            style={{ ...blockHeadStyle, cursor: 'pointer' }}
          >
            <FileText size={16} aria-hidden style={headIconStyle} />
            <span>Attachments</span>
            <span style={countPillStyle}>{count}</span>
            {collapsed && <span style={hintStyle}>{count} files — view</span>}
            <ChevronDown
              size={14}
              aria-hidden
              style={{
                ...chevStyle,
                marginLeft: collapsed ? 0 : 'auto',
                transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
              }}
            />
          </button>
        </h2>
      ) : (
        <h2 style={{ ...blockHeadStyle, ...headingResetStyle }}>
          <FileText size={16} aria-hidden style={headIconStyle} />
          <span>Attachments</span>
        </h2>
      )}

      {!collapsed && (
        <div style={blockBodyStyle}>
          {attachments.map((a) => (
            <AttachmentCard key={a.id} attachment={a} />
          ))}
        </div>
      )}
    </section>
  )
}

function AttachmentCard({ attachment }: { attachment: ResourceAttachment }) {
  const { Icon, bg, fg } = ATTACHMENT_ICON[attachment.kind]
  return (
    <div className="cre-ru-att" style={attCardStyle}>
      <span style={{ ...attIcoStyle, background: bg, color: fg }}>
        <Icon size={16} aria-hidden />
      </span>
      <span style={attBodyStyle}>
        <span style={attNameStyle}>{attachment.title}</span>
        <span style={attMetaStyle}>{attachment.meta}</span>
      </span>
    </div>
  )
}

/* ─── Suggested Similar Topics ─────────────────────────────────────── */

function SuggestedTopics({
  suggested,
  seeAllLabel,
}: {
  suggested: SuggestedResource[]
  seeAllLabel?: string
}) {
  const reasonFlag = useFeatureFlag('resource-suggestion-reason')
  const filtersFlag = useFeatureFlag('resource-suggestion-filters')
  const showReason = reasonFlag.enabled
  const showFilters = filtersFlag.enabled

  // Category filter chips — "All" + each distinct category, in first-seen order.
  const categories = ['All', ...Array.from(new Set(suggested.map((s) => s.category)))]
  const [active, setActive] = useState('All')

  // Derive the effective chip at render time — if the data changed and the
  // selected chip no longer exists, fall back to "All" without an effect.
  const activeChip = categories.includes(active) ? active : 'All'

  const visible =
    showFilters && activeChip !== 'All'
      ? suggested.filter((s) => s.category === activeChip)
      : suggested

  return (
    <section style={blockStyle}>
      <h2 style={{ ...blockHeadStyle, ...headingResetStyle }}>
        <span>Keep Exploring</span>
      </h2>
      <div style={blockBodyStyle}>
        {showFilters && (
          <div role="group" aria-label="Filter suggestions" style={chipsStyle}>
            {categories.map((c) => {
              const on = c === activeChip
              return (
                <button
                  key={c}
                  type="button"
                  className="cre-ru-chip"
                  aria-pressed={on}
                  onClick={() => setActive(c)}
                  style={{
                    ...chipStyle,
                    background: on ? 'var(--color-primary-800)' : 'var(--color-surface-card)',
                    color: on ? 'var(--color-text-inverse)' : 'var(--color-text-secondary)',
                    borderColor: on ? 'var(--color-primary-800)' : 'var(--color-border-subtle)',
                  }}
                >
                  {c}
                </button>
              )
            })}
          </div>
        )}

        <div style={suggestListStyle}>
          {visible.map((s) => (
            <SuggestionCard key={s.id} suggestion={s} showReason={showReason} />
          ))}
        </div>

        <button
          type="button"
          className="cre-ru-seeall"
          onClick={() => console.info('resource-updates:see-all', activeChip)}
          style={seeAllStyle}
        >
          {seeAllLabel ?? 'See all in Medical Reference'}
          <ChevronRight size={14} aria-hidden />
        </button>
      </div>
    </section>
  )
}

function SuggestionCard({
  suggestion,
  showReason,
}: {
  suggestion: SuggestedResource
  showReason: boolean
}) {
  return (
    <button
      type="button"
      className="cre-ru-suggestion"
      onClick={() => console.info('resource-updates:open-suggestion', suggestion.id)}
      style={suggestItemStyle}
    >
      <span
        style={{
          ...thumbStyle,
          ...(suggestion.image
            ? { background: `center / cover no-repeat url(${suggestion.image})` }
            : { backgroundImage: ACCENT_GRADIENT[suggestion.accent] }),
        }}
      >
        {suggestion.isVideo ? (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden style={playStyle}>
              <path d="M7 4 L20 12 L7 20 Z" fill="currentColor" />
            </svg>
            <span style={durStyle}>{suggestion.duration}</span>
          </>
        ) : (
          // With a cover image the label is redundant — the artwork carries the
          // type. Only the gradient fallback shows the text chip.
          !suggestion.image && <span style={thumbLabelStyle}>{suggestion.typeLabel}</span>
        )}
      </span>
      <span style={suggestBodyStyle}>
        <span style={suggestTitleStyle}>{suggestion.title}</span>
        <span style={suggestMetaStyle}>
          <StarSolid size={12} aria-hidden style={{ color: 'var(--color-warning-500)' }} />
          {suggestion.rating.toFixed(1)} · {suggestion.category} · {suggestion.meta}
        </span>
        {showReason && <span style={reasonStyle}>{suggestion.reason}</span>}
      </span>
    </button>
  )
}

const ACCENT_GRADIENT: Record<SuggestionAccent, string> = {
  blue: 'linear-gradient(135deg, var(--color-primary-400), var(--color-primary-600))',
  teal: 'linear-gradient(135deg, var(--color-secondary-400), var(--color-secondary-700))',
  orange: 'linear-gradient(135deg, var(--color-tertiary-300), var(--color-tertiary-700))',
  red: 'linear-gradient(135deg, var(--color-error-300), var(--color-error-600))',
  info: 'linear-gradient(135deg, var(--color-info-300), var(--color-info-700))',
  purple: 'linear-gradient(135deg, var(--color-cta-300), var(--color-cta-700))',
}

/* ─── styles ───────────────────────────────────────────────────────── */

const paneStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
}

const blockStyle: CSSProperties = {
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: '0 1px 2px rgb(9 35 72 / 0.06), 0 4px 14px rgb(9 35 72 / 0.06)',
  overflow: 'hidden',
}

const blockHeadStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 9,
  width: '100%',
  textAlign: 'left',
  background: 'transparent',
  border: 'none',
  padding: '14px 16px',
  fontFamily: 'var(--font-heading)',
  fontSize: 15,
  fontWeight: 700,
  color: 'var(--color-primary-800)',
}

const headIconStyle: CSSProperties = { color: 'var(--color-primary-600)', flexShrink: 0 }

// Heading semantics without heading chrome — the block titles are real <h2>s
// (page <h1> = the resource title) but keep the compact rail head styling.
const headingResetStyle: CSSProperties = { margin: 0, fontWeight: 700 }

const countPillStyle: CSSProperties = {
  background: 'var(--color-primary-100)',
  color: 'var(--color-primary-700)',
  borderRadius: 'var(--radius-pill)',
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 700,
  padding: '2px 9px',
}

const hintStyle: CSSProperties = {
  marginLeft: 'auto',
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--color-text-tertiary)',
}

const chevStyle: CSSProperties = {
  color: 'var(--color-text-tertiary)',
  transition: 'transform 0.15s ease',
  flexShrink: 0,
}

const blockBodyStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  padding: '0 14px 14px',
}

// Border / background / radius live on the `.cre-ru-att` class (so :hover can
// override them — inline styles would block the hover rule).
const attCardStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '11px 12px',
}

const attIcoStyle: CSSProperties = {
  width: 38,
  height: 38,
  flexShrink: 0,
  borderRadius: 'var(--radius-md)',
  display: 'grid',
  placeItems: 'center',
}

const attBodyStyle: CSSProperties = {
  minWidth: 0,
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
}

const attNameStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 13,
  color: 'var(--color-text-primary)',
  lineHeight: 1.25,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}

const attMetaStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  color: 'var(--color-text-tertiary)',
}

const chipsStyle: CSSProperties = {
  display: 'flex',
  gap: 7,
  overflowX: 'auto',
  paddingBottom: 4,
  marginBottom: 4,
}

const chipStyle: CSSProperties = {
  whiteSpace: 'nowrap',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-pill)',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 600,
  padding: '5px 12px',
  cursor: 'pointer',
}

const suggestListStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
}

// Border / background live on the `.cre-ru-suggestion` class (button reset +
// :hover wash). Layout stays inline.
const suggestItemStyle: CSSProperties = {
  display: 'flex',
  gap: 11,
  padding: 8,
  borderRadius: 'var(--radius-md)',
}

const thumbStyle: CSSProperties = {
  position: 'relative',
  width: 96,
  height: 58,
  flexShrink: 0,
  borderRadius: 'var(--radius-sm)',
  overflow: 'hidden',
  color: '#fff',
  display: 'grid',
  placeItems: 'center',
  fontFamily: 'var(--font-heading)',
  fontWeight: 800,
  fontSize: 10,
  letterSpacing: '0.06em',
  textAlign: 'center',
  padding: 5,
}

const thumbLabelStyle: CSSProperties = { textTransform: 'uppercase' }

const playStyle: CSSProperties = {
  filter: 'drop-shadow(0 1px 6px rgb(0 0 0 / 0.5))',
}

const durStyle: CSSProperties = {
  position: 'absolute',
  right: 4,
  bottom: 4,
  background: 'rgb(0 0 0 / 0.78)',
  color: '#fff',
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 10,
  padding: '1px 5px',
  borderRadius: 3,
  letterSpacing: 0,
}

const suggestBodyStyle: CSSProperties = {
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
}

const suggestTitleStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 13,
  lineHeight: 1.28,
  color: 'var(--color-text-primary)',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
}

const suggestMetaStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 5,
  flexWrap: 'wrap',
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  color: 'var(--color-text-tertiary)',
}

const reasonStyle: CSSProperties = {
  alignSelf: 'flex-start',
  marginTop: 4,
  fontFamily: 'var(--font-body)',
  fontSize: 10,
  fontWeight: 700,
  color: 'var(--color-secondary-800)',
  background: 'var(--color-secondary-100)',
  borderRadius: 'var(--radius-pill)',
  padding: '2px 8px',
}

// Text-link style (matches the page's Download / Feedback / Back links) — no
// border box, brand CTA color, left-aligned.
const seeAllStyle: CSSProperties = {
  alignSelf: 'flex-start',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  marginTop: 8,
  background: 'transparent',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-cta-500)',
  textDecoration: 'none',
}
