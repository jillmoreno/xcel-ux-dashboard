import { useEffect, useState, type CSSProperties } from 'react'
import { X } from '@/icons'

/**
 * THE PICTURES ON `/account-panels` — 2026-11-19, Afsana: "isolate the
 * screenshot for (1) the Edit Account Details panel (2) Update Password panel
 * (3) Update Email Address panel". `/invite-v3`'s Screens tab
 * (`InviteV3ScreensGallery`, on feat/invite-flow-v3) is the pattern: one card
 * per panel, each state once, opening full size with Previous / Next.
 *
 * ⚠ PICTURES, NOT LIVE PANELS. Each tile is a PNG under
 * `public/account-panels-screens/`, listed by its `manifest.json`, both
 * written by `scripts/capture-account-panels.mjs`. A picture does not follow
 * the code: when a panel changes, re-run the script. The page says when they
 * were captured so nobody mistakes a stale one for the build.
 */

export type PanelState = { file: string; state: string }
export type PanelShots = { id: string; title: string; states: PanelState[] }
export type PanelsManifest = { capturedAt: string; components: PanelShots[] }

const BASE = '/account-panels-screens/'

type Open = PanelState & { title: string }

export function AccountPanelsScreensGallery() {
  const [manifest, setManifest] = useState<PanelsManifest | null>(null)
  const [failed, setFailed] = useState(false)
  const [open, setOpen] = useState<number | null>(null)

  useEffect(() => {
    let live = true
    fetch(`${BASE}manifest.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((m: PanelsManifest) => live && setManifest(m))
      .catch(() => live && setFailed(true))
    return () => {
      live = false
    }
  }, [])

  if (failed || (manifest && !Array.isArray(manifest.components)))
    return <p style={NOTE}>The screenshots have not been captured yet.</p>
  if (!manifest) return <p style={NOTE}>Loading screenshots…</p>

  const all: Open[] = manifest.components.flatMap((c) => c.states.map((s) => ({ ...s, title: c.title })))
  let index = 0

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <p style={NOTE}>
        Captured {manifest.capturedAt}. Pictures of the build on that day — a panel changed since then will not show
        it until they are captured again.
      </p>
      {manifest.components.map((c, n) => (
        <article key={c.id} aria-label={c.title} style={CARD}>
          <h2 style={CARD_TITLE}>
            {n + 1}. {c.title}
          </h2>
          <ul style={STATE_GRID}>
            {c.states.map((s) => {
              const at = index++
              return (
                <li key={s.file} style={{ listStyle: 'none' }}>
                  <button type="button" onClick={() => setOpen(at)} aria-label={`${c.title} — ${s.state}`} style={TILE}>
                    <span style={STATE_FRAME}>
                      <img src={BASE + s.file} alt="" loading="lazy" style={STATE_THUMB} />
                    </span>
                    <span style={TILE_STATE}>{s.state}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </article>
      ))}
      {open != null && all[open] ? (
        <Lightbox
          shot={all[open]}
          position={`${open + 1} of ${all.length}`}
          onPrev={open > 0 ? () => setOpen(open - 1) : null}
          onNext={open < all.length - 1 ? () => setOpen(open + 1) : null}
          onClose={() => setOpen(null)}
        />
      ) : null}
    </div>
  )
}

function Lightbox({
  shot,
  position,
  onPrev,
  onNext,
  onClose,
}: {
  shot: Open
  position: string
  onPrev: (() => void) | null
  onNext: (() => void) | null
  onClose: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && onPrev) onPrev()
      if (e.key === 'ArrowRight' && onNext) onNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onPrev, onNext, onClose])

  return (
    <div style={SCRIM} onClick={onClose}>
      <figure
        role="dialog"
        aria-modal="true"
        aria-label={`${shot.title} — ${shot.state}`}
        style={FIGURE}
        onClick={(e) => e.stopPropagation()}
      >
        <figcaption style={CAPTION}>
          <span style={{ display: 'grid', gap: 2 }}>
            <strong>
              {shot.title} — {shot.state}
            </strong>
            <span style={CAPTION_SUB}>{position}</span>
          </span>
          <button type="button" onClick={onClose} aria-label="Close" style={CLOSE}>
            <X size={18} aria-hidden />
          </button>
        </figcaption>
        <img src={BASE + shot.file} alt={`${shot.title} — ${shot.state}`} style={FULL} />
        {/* Previous and Next under the picture (2026-11-19, Afsana); the close
            is an ✕, top right. */}
        <span style={PAGER}>
          <button type="button" onClick={onPrev ?? undefined} disabled={!onPrev} style={NAV}>
            Previous
          </button>
          <button type="button" onClick={onNext ?? undefined} disabled={!onNext} style={NAV}>
            Next
          </button>
        </span>
      </figure>
    </div>
  )
}

/* ── Styles — `InviteV3ScreensGallery`'s ──────────────────────────────── */

const NOTE: CSSProperties = { margin: 0, fontSize: 13, lineHeight: '18px', color: 'var(--color-text-secondary)' }

const CARD: CSSProperties = {
  display: 'grid',
  gap: 16,
  padding: '18px 20px',
  background: 'var(--color-fixed-light)',
  border: '1px solid var(--color-e2e-card-outline)',
  borderRadius: 12,
}

const CARD_TITLE: CSSProperties = { margin: 0, fontSize: 18, lineHeight: '24px', fontWeight: 800 }

const STATE_GRID: CSSProperties = {
  margin: 0,
  padding: 0,
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
  gap: 16,
}

const TILE: CSSProperties = {
  display: 'grid',
  gap: 8,
  width: '100%',
  padding: 0,
  textAlign: 'left',
  cursor: 'zoom-in',
  font: 'inherit',
  color: 'inherit',
  background: 'none',
  border: 'none',
}

/* A panel is tall and narrow, so its frame is too — whole, never cropped. */
const STATE_FRAME: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 320,
  padding: 12,
  boxSizing: 'border-box',
  background: 'var(--color-e2e-field)',
  border: '1px solid var(--color-e2e-card-outline)',
  borderRadius: 8,
}

const STATE_THUMB: CSSProperties = { display: 'block', maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }

const TILE_STATE: CSSProperties = { fontSize: 13, lineHeight: '18px', fontWeight: 800 }

const SCRIM: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
  background: 'var(--color-e2e-scrim)',
}

const FIGURE: CSSProperties = {
  margin: 0,
  display: 'grid',
  gap: 12,
  maxWidth: 'min(1440px, 100%)',
  maxHeight: '100%',
  padding: 16,
  boxSizing: 'border-box',
  background: 'var(--color-fixed-light)',
  borderRadius: 12,
  boxShadow: 'var(--shadow-modal)',
}

const CAPTION: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  fontSize: 14,
  lineHeight: '19px',
}

const CAPTION_SUB: CSSProperties = { fontSize: 13, color: 'var(--color-text-secondary)' }

const PAGER: CSSProperties = { display: 'flex', justifyContent: 'center', gap: 8 }

const CLOSE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  alignSelf: 'flex-start',
  width: 32,
  height: 32,
  padding: 0,
  color: 'var(--color-text-secondary)',
  background: 'none',
  border: 'none',
  borderRadius: 'var(--radius-pill)',
  cursor: 'pointer',
}

const NAV: CSSProperties = {
  padding: '6px 12px',
  font: 'inherit',
  fontSize: 13,
  fontWeight: 800,
  color: 'var(--color-text-primary)',
  background: 'var(--color-fixed-light)',
  border: '1px solid var(--color-e2e-card-outline)',
  borderRadius: 6,
  cursor: 'pointer',
}

const FULL: CSSProperties = {
  display: 'block',
  justifySelf: 'center',
  maxWidth: '100%',
  maxHeight: 'calc(100vh - 180px)',
  objectFit: 'contain',
  border: '1px solid var(--color-e2e-card-outline)',
  borderRadius: 6,
}
