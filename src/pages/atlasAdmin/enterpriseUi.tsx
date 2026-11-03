import { useState, type CSSProperties, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from '@/icons'
import { ADMIN_BASE } from './adminStore'
import { CARD, HEADING } from './adminStyles'

/**
 * ATLAS ADMIN — the Enterprise Insights pages' shared pieces (2026-10-20):
 * the back-to-hub header with its ⓘ, and a stat tile.
 */

export function EnterpriseHeader({ title, sub, info, actions }: { title: string; sub: string; info?: string; actions?: ReactNode }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <button type="button" aria-label="Back to Enterprise Insights" onClick={() => navigate(`${ADMIN_BASE}/enterprise${window.location.search}`)} style={BACK}>
          <ArrowLeft size={13} aria-hidden />
        </button>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0, fontFamily: HEADING, fontSize: 20, fontWeight: 700, color: 'var(--admin-ink)' }}>
            {title}
            {info ? (
              <button type="button" aria-expanded={open} aria-label="About this report" onClick={() => setOpen((o) => !o)} style={INFO}>
                ⓘ
              </button>
            ) : null}
          </h1>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--admin-muted)' }}>{sub}</p>
          {open && info ? <p style={{ margin: '8px 0 0', maxWidth: 560, padding: '8px 10px', borderRadius: 8, background: 'var(--admin-fill-soft)', fontSize: 12, lineHeight: 1.5, color: 'var(--admin-text)' }}>{info}</p> : null}
        </div>
      </div>
      {actions ? <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{actions}</div> : null}
    </div>
  )
}

export function StatTile({ label, value, ink = 'var(--admin-ink)', icon, tint, active, onClick }: { label: string; value: ReactNode; ink?: string; icon?: ReactNode; tint?: string; active?: boolean; onClick?: () => void }) {
  const body = (
    <>
      {icon ? (
        <span aria-hidden style={{ display: 'grid', placeItems: 'center', width: 30, height: 30, flex: 'none', borderRadius: 8, background: tint ?? 'var(--admin-fill)', color: ink }}>
          {icon}
        </span>
      ) : null}
      <span style={{ textAlign: 'left' }}>
        <span style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--admin-muted)' }}>{label}</span>
        <strong style={{ display: 'block', marginTop: 2, fontFamily: HEADING, fontSize: 20, color: ink }}>{value}</strong>
      </span>
    </>
  )
  const style: CSSProperties = { ...CARD, borderRadius: 12, padding: 14, display: 'flex', alignItems: 'center', gap: 10, boxShadow: active ? '0 0 0 2px var(--admin-chart-blue)' : 'none' }
  return onClick ? (
    <button type="button" aria-pressed={active} onClick={onClick} style={{ ...style, fontFamily: 'inherit', cursor: 'pointer' }}>
      {body}
    </button>
  ) : (
    <div style={style}>{body}</div>
  )
}

const BACK: CSSProperties = { display: 'grid', placeItems: 'center', width: 30, height: 30, flex: 'none', borderRadius: 9999, border: '1px solid var(--admin-rule)', background: 'var(--admin-surface)', color: 'var(--admin-text)', cursor: 'pointer' }
const INFO: CSSProperties = { padding: 0, border: 'none', background: 'none', fontSize: 13, fontWeight: 400, color: 'var(--admin-faint)', cursor: 'pointer' }
