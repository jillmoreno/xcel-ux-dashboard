import { useEffect, useState, type CSSProperties } from 'react'

/**
 * THE SCREENS TAB OF `/invite-v3` — 2026-11-18, Afsana: "another tab that
 * captures images of each component/modal", every flow grouped, "and we need
 * to capture their distinct states as well".
 *
 * ⚠ PICTURES, NOT LIVE PAGES. Each tile is a PNG under
 * `public/invite-v3-screens/`, listed by its `manifest.json`, both written by
 * `scripts/capture-invite-v3-screens.mjs` walking the flows in a headless
 * browser. A picture does not follow the code: when a screen changes, re-run
 * the script. The page says when they were captured so nobody mistakes a
 * stale one for the build.
 */

export type ScreenShot = { file: string; title: string; state: string }
export type ScreenVariant = { label: string; slug: string; shots: ScreenShot[] }
export type ScreenFlow = { id: string; label: string; model: string; variants: ScreenVariant[] }
export type ScreensManifest = { capturedAt: string; flows: ScreenFlow[] }

const BASE = '/invite-v3-screens/'

export function InviteV3ScreensGallery() {
  const [manifest, setManifest] = useState<ScreensManifest | null>(null)
  const [failed, setFailed] = useState(false)
  /* The open picture: every shot in one list, so the arrows walk across
     variants and flows in page order. */
  const [open, setOpen] = useState<number | null>(null)

  useEffect(() => {
    let live = true
    fetch(`${BASE}manifest.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((m: ScreensManifest) => live && setManifest(m))
      .catch(() => live && setFailed(true))
    return () => {
      live = false
    }
  }, [])

  if (failed) return <p style={NOTE}>The screenshots have not been captured yet.</p>
  if (!manifest) return <p style={NOTE}>Loading screenshots…</p>

  const all = manifest.flows.flatMap((f) =>
    f.variants.flatMap((v) => v.shots.map((s) => ({ ...s, flow: f.label, variant: v.label }))),
  )
  let index = 0

  return (
    <div style={{ display: 'grid', gap: 40 }}>
      <p style={NOTE}>
        Captured {manifest.capturedAt}. Pictures of the build on that day — a screen changed since then will not show
        it until they are captured again.
      </p>
      {manifest.flows.map((flow) => (
        <section key={flow.id} aria-label={flow.label} style={{ display: 'grid', gap: 20 }}>
          <h2 style={FLOW_TITLE}>{flow.label}</h2>
          {flow.variants.map((variant) => (
            <div key={variant.slug} style={{ display: 'grid', gap: 12 }}>
              <h3 style={VARIANT_TITLE}>{variant.label}</h3>
              <ol style={GRID}>
                {variant.shots.map((shot, n) => {
                  const at = index++
                  return (
                    <li key={shot.file} style={{ listStyle: 'none' }}>
                      <button
                        type="button"
                        onClick={() => setOpen(at)}
                        aria-label={`${n + 1}. ${shot.title} — ${shot.state}`}
                        style={TILE}
                      >
                        <img src={BASE + shot.file} alt="" loading="lazy" style={THUMB} />
                        <span style={TILE_TEXT}>
                          <span style={TILE_TITLE}>
                            {n + 1}. {shot.title}
                          </span>
                          <span style={TILE_STATE}>{shot.state}</span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ol>
            </div>
          ))}
        </section>
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
  shot: ScreenShot & { flow: string; variant: string }
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
            <span style={CAPTION_SUB}>
              {shot.flow} · {shot.variant} · {position}
            </span>
          </span>
          <span style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={onPrev ?? undefined} disabled={!onPrev} style={NAV}>
              Previous
            </button>
            <button type="button" onClick={onNext ?? undefined} disabled={!onNext} style={NAV}>
              Next
            </button>
            <button type="button" onClick={onClose} style={NAV}>
              Close
            </button>
          </span>
        </figcaption>
        <img src={BASE + shot.file} alt={`${shot.title} — ${shot.state}`} style={FULL} />
      </figure>
    </div>
  )
}

const NOTE: CSSProperties = { margin: 0, fontSize: 13, lineHeight: '18px', color: 'var(--color-text-secondary)' }

const FLOW_TITLE: CSSProperties = { margin: 0, fontSize: 20, lineHeight: '26px', fontWeight: 800 }

const VARIANT_TITLE: CSSProperties = {
  margin: 0,
  fontSize: 13,
  lineHeight: '18px',
  fontWeight: 800,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--color-text-secondary)',
}

const GRID: CSSProperties = {
  margin: 0,
  padding: 0,
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
  gap: 16,
}

const TILE: CSSProperties = {
  display: 'grid',
  width: '100%',
  padding: 0,
  overflow: 'hidden',
  textAlign: 'left',
  cursor: 'zoom-in',
  font: 'inherit',
  color: 'inherit',
  background: 'var(--color-fixed-light)',
  border: '1px solid var(--color-e2e-card-outline)',
  borderRadius: 8,
}

const THUMB: CSSProperties = {
  display: 'block',
  width: '100%',
  aspectRatio: '1280 / 800',
  objectFit: 'cover',
  objectPosition: 'top',
  borderBottom: '1px solid var(--color-e2e-card-outline)',
}

const TILE_TEXT: CSSProperties = { display: 'grid', gap: 2, padding: '10px 12px' }

const TILE_TITLE: CSSProperties = { fontSize: 14, lineHeight: '19px', fontWeight: 800 }

const TILE_STATE: CSSProperties = { fontSize: 13, lineHeight: '18px', color: 'var(--color-text-secondary)' }

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
  maxWidth: 'min(1280px, 100%)',
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
  maxWidth: '100%',
  maxHeight: 'calc(100vh - 140px)',
  objectFit: 'contain',
  border: '1px solid var(--color-e2e-card-outline)',
  borderRadius: 6,
}
