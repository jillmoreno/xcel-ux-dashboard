import { useEffect, useState, type CSSProperties } from 'react'

/**
 * THE SCREENS TAB OF `/invite-v3` — 2026-11-18, Afsana: "another tab that
 * captures images of each component/modal… and we need to capture their
 * distinct states as well".
 *
 * ⚠ BY COMPONENT, NOT BY WALK — 2026-11-19, Afsana: "an isolation of each
 * component and their different states would be better instead of
 * screenshots of the entire flow end to end". One card per component, each
 * state once, with the flows that use it. Modals are cropped to the modal and
 * cards drawn on a page to the card; pages stay whole, in their own section.
 *
 * ⚠ PICTURES, NOT LIVE PAGES. Each tile is a PNG under
 * `public/invite-v3-screens/`, listed by its `manifest.json`, both written by
 * `scripts/capture-invite-v3-screens.mjs` walking the flows in a headless
 * browser. A picture does not follow the code: when a screen changes, re-run
 * the script. The page says when they were captured so nobody mistakes a
 * stale one for the build.
 */

export type ScreenState = { file: string; state: string; seenIn: string[] }
export type ScreenComponent = {
  id: string
  title: string
  kind: 'modal' | 'card' | 'page'
  flows: string[]
  states: ScreenState[]
}
export type ScreensManifest = { capturedAt: string; components: ScreenComponent[] }

const BASE = '/invite-v3-screens/'

const KIND_LABEL: Record<ScreenComponent['kind'], string> = { modal: 'Modal', card: 'On the page', page: 'Page' }

type Open = ScreenState & { title: string }

export function InviteV3ScreensGallery() {
  const [manifest, setManifest] = useState<ScreensManifest | null>(null)
  const [failed, setFailed] = useState(false)
  /* The open picture: every state in one list, in page order, so the arrows
     walk across components. */
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

  if (failed || (manifest && !Array.isArray(manifest.components)))
    return <p style={NOTE}>The screenshots have not been captured yet.</p>
  if (!manifest) return <p style={NOTE}>Loading screenshots…</p>

  const groups = [
    { title: 'Components', items: manifest.components.filter((c) => c.kind !== 'page') },
    { title: 'Pages', items: manifest.components.filter((c) => c.kind === 'page') },
  ]
  const all: Open[] = groups.flatMap((g) => g.items.flatMap((c) => c.states.map((s) => ({ ...s, title: c.title }))))
  let index = 0

  return (
    <div style={{ display: 'grid', gap: 40 }}>
      <p style={NOTE}>
        Captured {manifest.capturedAt}. Pictures of the build on that day — a screen changed since then will not show
        it until they are captured again.
      </p>
      {groups.map((group) =>
        group.items.length ? (
          <section key={group.title} aria-label={group.title} style={{ display: 'grid', gap: 20 }}>
            <h2 style={GROUP_TITLE}>{group.title}</h2>
            {group.items.map((c) => (
              <article key={c.id} aria-label={`${c.title} (${KIND_LABEL[c.kind]})`} style={CARD}>
                <header style={{ display: 'grid', gap: 6 }}>
                  <span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                    <h3 style={CARD_TITLE}>{c.title}</h3>
                    <span style={KIND_TAG}>{KIND_LABEL[c.kind]}</span>
                  </span>
                  <p style={USED_IN}>Used in: {c.flows.join(' · ')}</p>
                </header>
                <ul style={c.kind === 'page' ? PAGE_GRID : STATE_GRID}>
                  {c.states.map((s) => {
                    const at = index++
                    return (
                      <li key={s.file} style={{ listStyle: 'none' }}>
                        <button
                          type="button"
                          onClick={() => setOpen(at)}
                          aria-label={`${c.title} — ${s.state}`}
                          style={TILE}
                        >
                          <span style={c.kind === 'page' ? PAGE_FRAME : STATE_FRAME}>
                            <img
                              src={BASE + s.file}
                              alt=""
                              loading="lazy"
                              style={c.kind === 'page' ? PAGE_THUMB : STATE_THUMB}
                            />
                          </span>
                          <span style={TILE_STATE}>{s.state}</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </article>
            ))}
          </section>
        ) : null,
      )}
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
            <span style={CAPTION_SUB}>
              {position} · seen in {shot.seenIn.join(', ')}
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

const GROUP_TITLE: CSSProperties = {
  margin: 0,
  fontSize: 13,
  lineHeight: '18px',
  fontWeight: 800,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--color-text-secondary)',
}

const CARD: CSSProperties = {
  display: 'grid',
  gap: 16,
  padding: '18px 20px',
  background: 'var(--color-fixed-light)',
  border: '1px solid var(--color-e2e-card-outline)',
  borderRadius: 12,
}

const CARD_TITLE: CSSProperties = { margin: 0, fontSize: 18, lineHeight: '24px', fontWeight: 800 }

const KIND_TAG: CSSProperties = {
  padding: '2px 8px',
  fontSize: 12,
  lineHeight: '16px',
  fontWeight: 800,
  color: 'var(--color-text-secondary)',
  border: '1px solid var(--color-e2e-card-outline)',
  borderRadius: 999,
}

const USED_IN: CSSProperties = { margin: 0, fontSize: 13, lineHeight: '18px', color: 'var(--color-text-secondary)' }

const STATE_GRID: CSSProperties = {
  margin: 0,
  padding: 0,
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
  gap: 16,
}

const PAGE_GRID: CSSProperties = { ...STATE_GRID, gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }

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

/* A component on a quiet ground, whole — never cropped. */
const STATE_FRAME: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 220,
  padding: 12,
  boxSizing: 'border-box',
  background: 'var(--color-e2e-field)',
  border: '1px solid var(--color-e2e-card-outline)',
  borderRadius: 8,
}

const STATE_THUMB: CSSProperties = { display: 'block', maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }

const PAGE_FRAME: CSSProperties = {
  display: 'block',
  overflow: 'hidden',
  border: '1px solid var(--color-e2e-card-outline)',
  borderRadius: 8,
}

const PAGE_THUMB: CSSProperties = {
  display: 'block',
  width: '100%',
  aspectRatio: '1440 / 900',
  objectFit: 'cover',
  objectPosition: 'top',
}

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
  maxHeight: 'calc(100vh - 140px)',
  objectFit: 'contain',
  border: '1px solid var(--color-e2e-card-outline)',
  borderRadius: 6,
}
