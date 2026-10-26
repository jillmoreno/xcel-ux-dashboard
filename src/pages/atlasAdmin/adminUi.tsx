import { Fragment, useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import type { LearnerStage, PreparedToPass, Readiness } from '@/data/atlasAdmin/learners'
import { STAGE_LABEL } from '@/data/atlasAdmin/learners'
import { useAdminStore } from './adminStore'
import { CircleDotSolid } from '@/icons'
import { CHIP, DIAL_INSET, DIAL_LABEL, DIAL_SIZE, MENU, MENU_ITEM, PILL, STATUS_DESC } from './adminStyles'

/** ATLAS ADMIN — the small shared pieces (2026-10-19). */

/** The 36px progress ring: a slate-200 track, the value in `color`. */
export function ProgressRing({ pct, color, label }: { pct: number | null; color: string; label: string }) {
  const r = 14
  const c = 2 * Math.PI * r
  const shown = pct ?? 0
  return (
    <div title={`${label}: ${pct === null ? '—' : `${pct}%`}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <svg width={36} height={36} viewBox="0 0 36 36" aria-hidden>
        <circle cx={18} cy={18} r={r} fill="none" stroke="var(--admin-rule)" strokeWidth={4} />
        <circle
          cx={18}
          cy={18}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={`${(shown / 100) * c} ${c}`}
          transform="rotate(-90 18 18)"
        />
      </svg>
      <span style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums', color: 'var(--admin-text)' }}>
        {pct === null ? '—' : `${pct}%`}
      </span>
    </div>
  )
}

const STAGE_STYLE: Record<LearnerStage, CSSProperties> = {
  'invite-open': { background: 'var(--admin-fill)', color: 'var(--admin-slate-700)', boxShadow: 'inset 0 0 0 1px var(--admin-rule)' },
  'never-started': { background: 'var(--admin-fill)', color: 'var(--admin-slate-700)', boxShadow: 'inset 0 0 0 1px var(--admin-rule)' },
  'in-course': { background: 'var(--admin-fill)', color: 'var(--admin-slate-800)', boxShadow: 'inset 0 0 0 1px var(--admin-rule-strong)' },
  prepping: { background: 'var(--admin-slate-800)', color: 'var(--admin-surface)', boxShadow: 'inset 0 0 0 1px var(--admin-slate-800)' },
  'done-no-prep': { background: 'var(--admin-brand-tint)', color: 'var(--admin-brand-ink)', boxShadow: 'inset 0 0 0 1px var(--admin-brand-edge)' },
  stalled: { background: 'var(--admin-brand-tint)', color: 'var(--admin-brand-ink)', boxShadow: 'inset 0 0 0 1px var(--admin-brand-edge)' },
  'ready-to-test': { background: 'var(--admin-success)', color: 'var(--admin-surface)', boxShadow: 'inset 0 0 0 1px var(--admin-success)' },
  licensed: { background: 'var(--admin-success-ink)', color: 'var(--admin-surface)', boxShadow: 'inset 0 0 0 1px var(--admin-success-ink)' },
}

export function StagePill({ stage }: { stage: LearnerStage }) {
  return <span style={{ ...PILL, ...STAGE_STYLE[stage] }}>{STAGE_LABEL[stage]}</span>
}

export function PreparedPill({ value }: { value: PreparedToPass | null }) {
  if (!value) return <span style={{ color: 'var(--admin-muted)' }}>—</span>
  if (value === 'not-started')
    return (
      <span style={{ ...PILL, background: 'var(--admin-fill-soft)', color: 'var(--admin-text)', boxShadow: 'inset 0 0 0 1px var(--admin-rule)' }}>
        Not started
      </span>
    )
  if (value === 'needs-work')
    return (
      <span style={{ ...PILL, background: 'var(--admin-warn-tint)', color: 'var(--admin-warn-ink)', boxShadow: 'inset 0 0 0 1px var(--admin-warn-edge)' }}>
        Needs work
      </span>
    )
  return (
    <span style={{ ...PILL, background: 'var(--admin-surface)', color: 'var(--admin-success-ink)', boxShadow: 'inset 0 0 0 1px var(--admin-success)' }}>
      Prepared to pass
    </span>
  )
}

const READINESS_LABEL: Record<Readiness, string> = { low: 'Low', moderate: 'Moderate', 'on-track': 'On track' }
const READINESS_INK: Record<Readiness, string> = {
  low: 'var(--admin-brand-ink)',
  moderate: 'var(--admin-warn-ink)',
  'on-track': 'var(--admin-success-ink)',
}

export function ReadinessCell({ readiness, score }: { readiness: Readiness | null; score: number | null }) {
  if (!readiness) return <span style={{ color: 'var(--admin-muted)' }}>—</span>
  return (
    <span style={{ fontSize: 13, color: READINESS_INK[readiness], fontWeight: 600, whiteSpace: 'nowrap' }}>
      {READINESS_LABEL[readiness]}
      {score !== null ? (
        <span style={{ fontWeight: 400, color: 'var(--admin-muted)' }}>
          {' · '}
          <b style={{ fontWeight: 700 }}>{score}</b>
        </span>
      ) : null}
    </span>
  )
}

/** A dashed chip that opens a menu under it; closes on an outside click. */
export function ChipMenu({
  label,
  icon,
  width = 224,
  children,
}: {
  label: string
  icon?: ReactNode
  width?: number
  children: (close: () => void) => ReactNode
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} style={CHIP}>
        {icon}
        {label}
      </button>
      {open ? (
        <div role="menu" style={{ ...MENU, width, maxHeight: 256, overflowY: 'auto' }}>
          {children(() => setOpen(false))}
        </div>
      ) : null}
    </div>
  )
}

export function MenuItem({ onSelect, children }: { onSelect: () => void; children: ReactNode }) {
  return (
    <button type="button" role="menuitem" className="cre-admin-menu-item" onClick={onSelect} style={MENU_ITEM}>
      {children}
    </button>
  )
}

/** The underlined tab strip under a page's header — Students / Invites. */
export function AdminTabs({ tabs }: { tabs: { to: string; label: string }[] }) {
  return (
    <nav style={{ display: 'flex', alignItems: 'center', gap: 24, borderBottom: '1px solid var(--admin-rule)' }}>
      {tabs.map((t) => (
        <NavLink
          key={t.to}
          to={t.to + window.location.search}
          end
          style={({ isActive }) => ({
            position: 'relative',
            padding: '4px 4px 12px',
            fontSize: 15,
            fontWeight: 600,
            textDecoration: 'none',
            color: isActive ? 'var(--admin-ink)' : 'var(--admin-text)',
            boxShadow: isActive ? 'inset 0 -2px 0 var(--admin-brand)' : undefined,
            marginBottom: -1,
          })}
        >
          {t.label}
        </NavLink>
      ))}
    </nav>
  )
}

/** The store's toast, for the pages outside the shell (the shell draws its
 *  own). */
export function AdminToast() {
  const { toast } = useAdminStore()
  return toast ? (
    <div role="status" style={{ position: 'fixed', left: '50%', bottom: 24, transform: 'translateX(-50%)', zIndex: 60, padding: '10px 16px', borderRadius: 9999, background: 'var(--admin-ink)', color: 'var(--admin-surface)', fontSize: 13, fontFamily: 'var(--font-body)' }}>
      {toast}
    </div>
  ) : null
}

/** A status card's pill (tokens.css): at rest a dot in `color` beside the
 *  label; active, the dot slides open left to right into a filled pill. */
export function StatusPill({ color, active, style, children }: { color: string; active: boolean; style?: CSSProperties; children: ReactNode }) {
  return (
    <span className="cre-admin-status-pill" data-active={active || undefined} style={{ '--pill': color, ...style } as CSSProperties}>
      <span aria-hidden className="cre-admin-status-pill-fill" />
      <CircleDotSolid aria-hidden size={12} className="cre-admin-status-pill-icon" />
      {children}
    </span>
  )
}

/** A status card's note: each " · " value on its own line, its figures in
 *  semibold (split on the numbers: every odd piece is one). `twoLines`
 *  instead breaks it once, at the word that leaves the top line the
 *  shortest it can be while still longer than the second. */
export function StatusNote({ children, style, twoLines }: { children: string; style?: CSSProperties; twoLines?: boolean }) {
  return (
    <p style={style ? { ...STATUS_DESC, ...style } : STATUS_DESC}>
      {(twoLines ? topHeavy(children) : children.split(' · ')).map((line, l) => (
        <Fragment key={l}>
          {l ? <br /> : null}
          {line.split(/(\d[\d,]*)/).map((part, i) => (i % 2 ? <b key={i} style={{ fontWeight: 600 }}>{part}</b> : part))}
        </Fragment>
      ))}
    </p>
  )
}

/** Two lines, the top one longer: the earliest word break past which the
 *  top line outruns the rest. One word stays on one line. */
function topHeavy(text: string): string[] {
  const words = text.split(' ')
  for (let k = 1; k < words.length; k++) {
    const top = words.slice(0, k).join(' ')
    const rest = words.slice(k).join(' ')
    if (top.length > rest.length) return [top, rest]
  }
  return [text]
}

/** The status cards' dial (Students, Invites), in the learner Home's ring
 *  style: a thick round-capped arc per part from 12 o'clock, each its share
 *  of `total`, a hair apart so the caps don't touch. Each arc picks its card;
 *  the selected arc thickens, and a disc inside the ring takes its colour,
 *  fading top to bottom. The centre reads `over` (default Total) / `centre`
 *  (default `total`) / `unit`. */
export function StatusDial<Id extends string>({
  total,
  centre = total,
  over = 'Total',
  unit,
  hug = 0,
  discGap = 8,
  parts,
  active,
  onPick,
  allColor,
  pale = [],
  size = DIAL_SIZE,
}: {
  total: number
  centre?: number
  /** The small caps over the centre figure. */
  over?: string
  unit: string
  /** Pulls the labels over and under the centre figure this many px closer to it. */
  hug?: number
  /** The space between the ring's inner edge and the tinted disc inside it. */
  discGap?: number
  parts: { id: Id; n: number; color: string; label?: string }[]
  /** The selected part — or 'all', or null for none. */
  active: Id | 'all' | null
  onPick: (id: Id) => void
  /** The disc's colour when 'all' is selected. */
  allColor?: string
  /** Parts whose colour is pale enough to need the disc at 25% rather than 15%. */
  pale?: Id[]
  /** The square it draws in; the ring sits DIAL_INSET inside it. The centre text keeps its size. */
  size?: number
}) {
  const stroke = 8
  const r = size / 2 - DIAL_INSET - stroke / 2
  const c = 2 * Math.PI * r
  const gap = stroke + 2 // the round caps reach stroke / 2 past each end
  const lens = parts.map((p) => (total ? (c * p.n) / total : 0))
  const arcs = parts.map((p, i) => ({ ...p, offset: lens.slice(0, i).reduce((a, b) => a + b, 0), len: Math.max(0, lens[i] - gap) }))
  const discFade = `dial-fade-${useId().replace(/:/g, '')}`
  const discColor = active === 'all' ? (allColor ?? 'transparent') : (parts.find((p) => p.id === active)?.color ?? 'transparent')
  return (
    <div style={{ position: 'relative', flex: 'none', width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="group" aria-label={`${total} ${unit.toLowerCase()} by status`} style={{ display: 'block' }}>
        <defs>
          <linearGradient id={discFade} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={discColor} stopOpacity={active !== 'all' && active !== null && pale.includes(active) ? 0.25 : 0.15} />
            <stop offset="1" stopColor={discColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <circle aria-hidden cx={size / 2} cy={size / 2} r={r - stroke / 2 - discGap} fill={`url(#${discFade})`} style={{ pointerEvents: 'none' }} />
        {arcs.map((a) =>
          a.len > 0 ? (
            <circle
              key={a.id}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              role="button"
              tabIndex={0}
              aria-label={`${a.n} ${a.label ?? a.id.replace('-', ' ')}: show these ${unit.toLowerCase()}`}
              aria-pressed={active === a.id}
              onClick={() => onPick(a.id)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onPick(a.id))}
              style={{ stroke: a.color, cursor: 'pointer', outline: 'none' }}
              strokeWidth={active === a.id ? stroke + 4 : stroke}
              strokeLinecap="round"
              /* Selected, its caps reach 2px further each end — so its dash is 4px shorter and starts 2px later, keeping the gaps. */
              strokeDasharray={`${Math.max(0, a.len - (active === a.id ? 4 : 0))} ${c}`}
              strokeDashoffset={-(a.offset + gap / 2 + (active === a.id ? 2 : 0))}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          ) : null,
        )}
      </svg>
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <span style={DIAL_LABEL}>{over}</span>
        <span style={{ fontFamily: 'var(--admin-font-playfair)', fontWeight: 900, fontVariantNumeric: 'lining-nums tabular-nums', fontFeatureSettings: '"lnum" 1, "tnum" 1', fontSize: 'var(--admin-atlas-h5-size)', lineHeight: 'var(--admin-atlas-h5-line)', color: 'var(--admin-ink)', margin: `${-hug}px 0` }}>{centre}</span>
        <span style={DIAL_LABEL}>{unit}</span>
      </div>
    </div>
  )
}
