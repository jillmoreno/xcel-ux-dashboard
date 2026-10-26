import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import type { LearnerStage, PreparedToPass, Readiness } from '@/data/atlasAdmin/learners'
import { STAGE_LABEL } from '@/data/atlasAdmin/learners'
import { useAdminStore } from './adminStore'
import { CHIP, MENU, MENU_ITEM, PILL } from './adminStyles'

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
