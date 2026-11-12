import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { EllipsisVerticalSolid } from '@/icons'
import { AtlasStatusPill, statusStrongFill, type AtlasCourseStatus } from './AtlasStatusPill'
import type { AtlasCourseCardData } from './AtlasCourseCard'

/**
 * THE ATLAS COURSE CARD, FIGMA 706:2416 — 2026-11-12, Eric: "rework the course cards to match the following Figma file".
 *
 * A sibling of `AtlasCourseCard` (213:3619), which is kept as it was. Same data, same subgrid idea, a different card:
 * the Primary 100 fill with no outline · a 120-tall image · the title in the heading serif, Bold 18 / 19, with the
 * Due Soon pill UNDER it (not on the image) · three facts — State, Category, Line of authority — each an icon, a label
 * and a Bold value · a progress row (gauge · status · %) over a thin bar · a ⋮ button beside a full-width primary
 * button. The design's "tertiary" is the Atlas palette's primary ramp (#2D5872 · #EAEEF1 · #CBD5DC).
 *
 * The ⋮ opens a menu (2026-11-12, Eric): Download Certificate (not wired) and Go to Course Home (the card's own
 * `onOpen` — Home in this course and its progress).
 */
export function AtlasCourseCardFigma({
  data,
  onAction,
  onOpen,
}: {
  data: AtlasCourseCardData
  onAction?: () => void
  /** The card clicked anywhere but its buttons — Home in this card's course and progress. */
  onOpen?: () => void
}) {
  const progress = data.progress ?? (data.completed ? 100 : 0)
  // An EXPIRED card steps back like a completed one — the same Secondary 100 fill and Primary 100 rule (2026-11-12, Eric).
  // …and a FAILED one (same day, Eric).
  const steppedBack = data.completed || data.badge === 'Expired' || data.actionLabel === 'Retake Course'
  const expired = data.badge === 'Expired' && !data.completed
  // An expired course reads "Progress Made" — it is not in progress any more (2026-11-12, Eric; "Progress" first).
  const failed = data.actionLabel === 'Retake Course'
  // A failed course reads "Progress Made" too — finished, not passed, not "in progress" (2026-11-12).
  const status = data.completed ? 'Completed' : expired || failed ? 'Progress Made' : progress > 0 ? 'In Progress' : 'Not Started'
  /* The ⋮ menu: open on click, shut on a click anywhere else, on Escape, or on picking a row. */
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!menuOpen) return
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [menuOpen])
  return (
    <article
      aria-label={data.title}
      onClick={onOpen}
      onKeyDown={
        onOpen
          ? (e) => {
              if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault()
                onOpen()
              }
            }
          : undefined
      }
      tabIndex={onOpen ? 0 : undefined}
      data-cta-id={onOpen ? 'my-courses.card-open-home' : undefined}
      style={{ ...CARD, ...(steppedBack ? CARD_DONE : null), ...(onOpen ? { cursor: 'pointer' } : null) }}
    >
      <img src={data.imageUrl} alt="" aria-hidden style={IMAGE} />
      {/* The title, then its pill under it — 10 apart, 4 above and below (Figma 710:2526). */}
      <div style={TITLE_BLOCK}>
        <h3 style={TITLE}>{data.title}</h3>
        {/* One status pill (Figma 710:2531–2551, 2026-11-12, Eric), the most pressing: the clock before the course's own state. */}
        {/* At the foot of the title row, whatever the title's length, so every card's pills line up — 16 over the State line,
            then 8 lower, then 4 back up: 12 over it (2026-11-12, Eric). Flex, so no stray line box under the pill. */}
        <span style={{ display: 'flex', marginTop: 'auto', marginBottom: -4 }}>
          <AtlasStatusPill status={statusFor(data, progress)} />
        </span>
      </div>
      <div style={FACTS}>
        {/* No icons before the three (2026-11-12, Eric; the design's location-dot, list-tree and book). */}
        {data.state ? <Fact label="State:" value={data.state} /> : null}
        {data.category ? <Fact label="Category:" value={data.category} /> : null}
        {data.lineOfAuthority ? <Fact label="Line of authority:" value={data.lineOfAuthority} /> : null}
      </div>
      <div style={PROGRESS}>
        <div style={PROGRESS_ROW}>
          {/* No gauge before it (2026-11-12, Eric). */}
          <span style={{ flex: 1, minWidth: 0 }}>{status}</span>
          <strong style={{ fontWeight: 700 }}>{progress}%</strong>
        </div>
        <div
          role="progressbar"
          aria-label={`${data.title} progress`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          style={BAR_TRACK}
        >
          {/* The fill in the 400 of the card's status colour (2026-11-12, Eric; Primary 500, then the pill's own fill). */}
          {/* …but Primary 200 on an expired or failed card (2026-11-12, Eric). */}
          <span style={{ ...BAR_FILL, width: `${progress}%`, background: expired || failed ? 'var(--color-primary-200)' : statusStrongFill(statusFor(data, progress)) }} />
        </div>
      </div>
      <div style={ACTIONS}>
        <div ref={menuRef} style={{ position: 'relative', display: 'flex' }}>
          <button
            type="button"
            aria-label={`More for ${data.title}`}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="cre-atlas-card-kebab"
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen((o) => !o)
            }}
            // On a completed card, the card's own Secondary 100 (2026-11-12, Eric).
            style={steppedBack ? { ...KEBAB, background: CARD_DONE.background } : KEBAB}
          >
            <EllipsisVerticalSolid aria-hidden style={{ width: 4, height: 13.5 }} />
          </button>
          {menuOpen ? (
            <div role="menu" aria-label={`${data.title} options`} style={MENU} onClick={(e) => e.stopPropagation()}>
              {/* Go to Course Home first (2026-11-12, Eric). */}
              <button
                type="button"
                role="menuitem"
                className="cre-atlas-card-menu-item"
                style={MENU_ITEM}
                onClick={() => {
                  setMenuOpen(false)
                  onOpen?.()
                }}
              >
                Go to Course Home
              </button>
              {/* Not wired — the demo has no certificate file behind it. Disabled and greyed until the course is completed
                  (2026-11-12, Eric). */}
              <button
                type="button"
                role="menuitem"
                className="cre-atlas-card-menu-item"
                disabled={!data.completed}
                aria-disabled={!data.completed}
                style={data.completed ? MENU_ITEM : { ...MENU_ITEM, color: 'var(--color-text-disabled, var(--color-neutral-400))', cursor: 'default' }}
                onClick={() => setMenuOpen(false)}
              >
                Download Certificate
              </button>
            </div>
          ) : null}
        </div>
        {data.completed ? (
          <button type="button" disabled style={{ ...BUTTON, ...BUTTON_DONE, ...(onOpen ? { pointerEvents: 'none' as const } : null) }}>
            Completed
          </button>
        ) : (
          <button
            type="button"
            // Begin Course in the outline style (2026-11-12, Eric); the rest solid.
            className={
              data.actionStyle === 'secondary' ? 'cre-atlas-card-outline' : data.actionStyle === 'expired' ? 'cre-atlas-card-expired' : 'cre-atlas-card-primary'
            }
            onClick={(e) => {
              e.stopPropagation()
              onAction?.()
            }}
            disabled={!onAction}
            style={{
              ...BUTTON,
              ...(data.actionStyle === 'secondary' ? BUTTON_OUTLINE : data.actionStyle === 'expired' ? BUTTON_EXPIRED : null),
              ...(!onAction && onOpen ? { pointerEvents: 'none' as const } : null),
            }}
          >
            {data.actionLabel}
          </button>
        )}
      </div>
    </article>
  )
}

/* Which pill: Expired, then Due Soon, then Failed, Completed, In Progress, Not Started. A completed course never wears the
   clock — `atlasCourseCardFor` gives it no badge. */
function statusFor(data: AtlasCourseCardData, progress: number): AtlasCourseStatus {
  if (data.badge === 'Expired') return 'expired'
  if (data.badge === 'Due Soon' && !data.completed) return 'due-soon'
  if (data.actionLabel === 'Retake Course') return 'failed'
  if (data.completed) return 'completed'
  if (progress > 0 || data.actionLabel === 'Resume Course') return 'in-progress'
  return 'not-started'
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <span style={FACT}>
      {label} <strong style={FACT_VALUE}>{value}</strong>
    </span>
  )
}

/* 24 in, 12 corners, Primary 100, no outline. A SUBGRID of five rows — image, title, facts, progress, buttons — on the
   row of cards, so every card's rows line up with its neighbours' (the parent grid is PlatformShell's). */
const CARD: CSSProperties = {
  display: 'grid',
  gridRow: 'span 5',
  gridTemplateRows: 'subgrid',
  rowGap: 8,
  padding: 24,
  boxSizing: 'border-box',
  borderRadius: 'var(--atlas-card-radius, 12px)',
  background: 'var(--color-primary-100)',
  minWidth: 0,
}
/* A completed card steps back (2026-11-12, Eric): white, with a 1 Primary 100 rule drawn inside its edge so nothing moves. */
// Its fill Secondary 100 (same day, Eric; white, then half Primary 100).
const CARD_DONE: CSSProperties = { background: 'var(--color-secondary-100)', boxShadow: 'inset 0 0 0 1px var(--color-primary-100)' }
const IMAGE: CSSProperties = { display: 'block', width: '100%', height: 120, objectFit: 'cover', borderRadius: 6 }
const TITLE_BLOCK: CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 14 /* 4 more over the pill (2026-11-12, Eric; the design's 10) */, paddingTop: 4, paddingBottom: 4 }
const TITLE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading-serif)',
  fontWeight: 700,
  fontSize: 22, // My Certificates' card titles, 22 / 24 (2026-11-12, Eric; 20 / 21, the design's 18 / 19 before)
  lineHeight: '24px',
  color: 'var(--color-text-primary)',
}
/* The three facts, 6 apart, 4 above and 12 below, in the secondary grey. */
const FACTS: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  paddingTop: 4,
  paddingBottom: 12,
  color: 'var(--color-text-secondary)',
  fontFamily: 'var(--font-body)',
}
/* One run of text, so a long value wraps under its label inside the card rather than widening it (2026-11-12 — the Refresher
   CE package's "Property, Casualty, Life and Health"). */
const FACT: CSSProperties = { display: 'block', fontSize: 11, lineHeight: '18px' }
const FACT_VALUE: CSSProperties = { fontWeight: 700, fontSize: 10 }
/* The progress: its row, then the bar 10 under it, 16 under the bar. */
const PROGRESS: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 16 }
const PROGRESS_ROW: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 2,
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  lineHeight: '18px',
  color: 'var(--color-text-secondary)',
}
/* A 1-tall Primary 400 rule, the 5-tall Primary 500 fill centred on it (2026-11-12, Eric). The box is the fill's height; the
   rule is drawn through its middle. */
const BAR_TRACK: CSSProperties = {
  position: 'relative',
  height: 5,
  backgroundImage: 'linear-gradient(var(--color-primary-400), var(--color-primary-400))', // Primary 400 (same day, Eric; 200, then 300)
  backgroundSize: '100% 1px',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
}
const BAR_FILL: CSSProperties = { position: 'absolute', top: 0, bottom: 0, left: 0, borderRadius: 2.5, background: 'var(--color-primary-500)' }
/* The ⋮ and the main button, 6 apart, 35 tall, 9 corners — at the foot of their subgrid row so the row's buttons line up. */
const ACTIONS: CSSProperties = { display: 'flex', gap: 6, alignItems: 'flex-end', alignSelf: 'end' }
const KEBAB: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flex: 'none',
  height: 35,
  paddingLeft: 9,
  paddingRight: 9,
  boxSizing: 'border-box',
  borderStyle: 'solid',
  borderWidth: 1,
  borderColor: 'var(--color-primary-200)',
  borderRadius: 9,
  background: 'var(--color-primary-100)',
  color: 'var(--color-primary-500)',
  cursor: 'pointer',
}
/* The ⋮ menu: white, a 1 Primary 200 edge, 8 corners, a soft shadow, opening up from the ⋮ (the card's foot is the bottom of
   the page's row, so a menu below it would fall out of the card). */
const MENU: CSSProperties = {
  position: 'absolute',
  left: 0,
  bottom: 'calc(100% + 4px)',
  zIndex: 5,
  display: 'flex',
  flexDirection: 'column',
  minWidth: 200,
  paddingTop: 4,
  paddingBottom: 4,
  borderStyle: 'solid',
  borderWidth: 1,
  borderColor: 'var(--color-primary-200)',
  borderRadius: 8,
  background: 'var(--color-fixed-light, #fff)',
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
}
const MENU_ITEM: CSSProperties = {
  display: 'block',
  width: '100%',
  paddingTop: 8,
  paddingBottom: 8,
  paddingLeft: 12,
  paddingRight: 12,
  border: 'none',
  background: 'none',
  textAlign: 'left',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '18px',
  color: 'var(--color-text-primary)',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
}
const BUTTON: CSSProperties = {
  flex: 1,
  minWidth: 0,
  height: 35,
  paddingLeft: 8,
  paddingRight: 8,
  boxSizing: 'border-box',
  borderStyle: 'solid',
  borderWidth: 1,
  borderColor: 'transparent',
  borderRadius: 9,
  background: 'var(--color-primary-500)',
  color: 'var(--color-fixed-light, #fff)',
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 13.5,
  lineHeight: '20.25px',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
}
/* The outline button — white, a 1 Primary 500 edge and label (2026-11-12, Eric, for Begin Course). */
const BUTTON_OUTLINE: CSSProperties = {
  background: 'var(--color-fixed-light, #fff)',
  borderColor: 'var(--color-primary-500)',
  color: 'var(--color-primary-500)',
}
/* Purchase Extension (2026-11-12, Eric): outlined, on the Expired pill's Error 100, with dark text — the edge Error 400. */
const BUTTON_EXPIRED: CSSProperties = {
  background: 'var(--color-error-100)',
  borderColor: 'var(--color-error-400)',
  color: 'var(--color-text-primary)',
}
/* Completed: inactive — neutral fill and border, the secondary text, no hover. */
const BUTTON_DONE: CSSProperties = {
  background: 'var(--color-neutral-100)',
  borderColor: 'var(--color-neutral-200)',
  color: 'var(--color-text-secondary)',
  cursor: 'default',
}
