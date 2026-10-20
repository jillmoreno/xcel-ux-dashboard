import { useState, type CSSProperties } from 'react'
import { Globe, Play } from '@/icons'
import { useAdminStore } from './adminStore'
import { BUTTON_BRAND, CARD, EYEBROW, HEADING } from './adminStyles'

/**
 * ATLAS ADMIN — LEARNING CENTER (2026-10-20). The reference's
 * /learning-center: a multilingual courseware prototype — switch a course
 * between English and Spanish, launch the module in its own window, and the
 * case for doing it beside.
 *
 * ⚠ DEPARTURES FROM THE REFERENCE: its course is mortgage fraud with an
 * embedded Vimeo player. This is the insurance version of the same module,
 * and the player is a still frame — the hub embeds no third-party video.
 * Launch course opens the module in a window of its own, as the reference
 * does, written here rather than fetched from a SCORM host.
 */

const COPY = {
  en: {
    title: 'Preventing Insurance Fraud: Frontline Essentials',
    body: 'Learn how to spot red flags in applications and claims, meet your state’s anti-fraud requirements, and protect policyholders — with practical scenarios built with compliance experts.',
    transcript: 'Welcome to Preventing Insurance Fraud. In the next 12 minutes you will evaluate common application and claims fraud attempts and practise how to report them.',
    lang: 'en',
  },
  es: {
    title: 'Prevención del Fraude de Seguros: Fundamentos Esenciales',
    body: 'Aprende a identificar señales de alerta en solicitudes y reclamaciones, cumplir los requisitos antifraude de tu estado y proteger a los asegurados, con escenarios prácticos desarrollados con expertos en cumplimiento.',
    transcript: 'Bienvenido a Prevención del Fraude de Seguros. En los próximos 12 minutos evaluarás intentos comunes de fraude en solicitudes y reclamaciones y practicarás cómo reportarlos.',
    lang: 'es',
  },
} as const

export function AtlasAdminLearningCenterPage() {
  const { showToast } = useAdminStore()
  const [lang, setLang] = useState<'en' | 'es'>('en')
  const c = COPY[lang]

  const launch = () => {
    const win = window.open('', 'atlas-courseware', 'width=960,height=640')
    if (!win) return showToast('Allow pop-ups to launch the course')
    win.document.title = c.title
    win.document.documentElement.lang = c.lang
    win.document.body.innerHTML = ''
    const font = win.document.createElement('link')
    font.rel = 'stylesheet'
    font.href = 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700&display=swap'
    win.document.head.appendChild(font)
    const style = win.document.createElement('style')
    style.textContent = "body{margin:0;font-family:'Open Sans',sans-serif;background:#0f172a;color:#f8fafc;display:grid;place-items:center;min-height:100vh}main{max-width:640px;padding:32px}h1{font-size:24px}p{line-height:1.6;color:#cbd5e1}"
    win.document.head.appendChild(style)
    const main = win.document.createElement('main')
    const h1 = win.document.createElement('h1')
    h1.textContent = c.title
    const p = win.document.createElement('p')
    p.textContent = c.transcript
    const note = win.document.createElement('p')
    note.textContent = lang === 'en' ? 'Module 1 of 4 · Demo courseware window' : 'Módulo 1 de 4 · Ventana de demostración'
    main.append(h1, p, note)
    win.document.body.appendChild(main)
    win.focus()
  }

  return (
    <section style={{ ...CARD, borderRadius: 18, padding: 20 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 9999, background: 'var(--admin-brand-tint)', color: 'var(--admin-brand)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        <Globe size={10} aria-hidden /> Learning center
      </span>
      <h1 style={{ margin: '10px 0 4px', fontFamily: HEADING, fontSize: 20, fontWeight: 700, color: 'var(--admin-ink)' }}>Launch multilingual courseware</h1>
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--admin-text)' }}>
        Prototype experience for market expansion: toggle between English and Spanish course variants, launch SCORM/Articulate-style modules in a dedicated window, and monitor adoption metrics.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, margin: '14px 0 16px' }}>
        <div role="radiogroup" aria-label="Language" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 4px 4px 10px', borderRadius: 9999, border: '1px solid var(--admin-rule)' }}>
          <span style={{ ...EYEBROW, fontSize: 9 }}>Language</span>
          {(
            [
              ['en', 'English'],
              ['es', 'Español'],
            ] as const
          ).map(([k, label]) => (
            <button key={k} type="button" role="radio" aria-checked={lang === k} onClick={() => setLang(k)} style={{ ...LANG, ...(lang === k ? { background: 'var(--admin-brand)', color: 'var(--admin-surface)' } : null) }}>
              {label}
            </button>
          ))}
        </div>
        <button type="button" onClick={launch} style={BUTTON_BRAND}>
          <Play size={11} aria-hidden /> {lang === 'en' ? 'Launch course' : 'Iniciar curso'}
        </button>
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'minmax(0, 2fr) minmax(220px, 1fr)', alignItems: 'start' }}>
        <article lang={c.lang} style={{ borderRadius: 14, padding: 16, background: 'var(--admin-fill-soft)' }}>
          <h2 style={{ margin: 0, fontFamily: HEADING, fontSize: 16, fontWeight: 700, color: 'var(--admin-ink)' }}>{c.title}</h2>
          <p style={{ margin: '4px 0 12px', fontSize: 13, lineHeight: 1.5, color: 'var(--admin-text)' }}>{c.body}</p>
          <button type="button" onClick={launch} aria-label={`Play ${c.title}`} style={PLAYER}>
            <span aria-hidden style={{ display: 'grid', placeItems: 'center', width: 56, height: 56, borderRadius: 9999, background: 'var(--admin-surface)', color: 'var(--admin-brand)' }}>
              <Play size={18} />
            </span>
            <span style={{ position: 'absolute', left: 12, bottom: 10, fontSize: 11, color: 'var(--admin-surface)' }}>0:00 / 12:00</span>
          </button>
          <p style={{ ...EYEBROW, fontSize: 10, marginTop: 14, color: 'var(--admin-brand)' }}>Transcript preview</p>
          <p style={{ margin: '4px 0 0', fontSize: 13, lineHeight: 1.5, color: 'var(--admin-ink)' }}>{c.transcript}</p>
        </article>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <section style={SIDE}>
            <p style={{ ...EYEBROW, fontSize: 10 }}>Strategic impact</p>
            <ul style={{ listStyle: 'none', margin: '8px 0', padding: 0, fontSize: 13, lineHeight: 1.7, color: 'var(--admin-ink)' }}>
              <li>
                <Dot color="var(--admin-success)" /> Market expansion
              </li>
              <li>
                <Dot color="var(--admin-success)" /> Competitive differentiation
              </li>
              <li>
                <Dot color="var(--admin-amber)" /> Medium priority for insurance agencies
              </li>
            </ul>
            <p style={{ margin: 0, fontSize: 11, lineHeight: 1.5, color: 'var(--admin-muted)' }}>Multilingual launch supports Spanish-speaking agents, simplifies catalogue management, and opens new markets.</p>
          </section>
          <section style={{ ...SIDE, borderColor: 'var(--admin-brand-soft-edge)' }}>
            <p style={{ ...EYEBROW, fontSize: 10, color: 'var(--admin-brand)' }}>Projected outcomes</p>
            {[
              ['Multilingual adoption lift', '+15%', 'var(--admin-success-tint)', 'var(--admin-success-edge)'],
              ['New market revenue', '+$300K', 'var(--admin-surface)', 'var(--admin-rule)'],
              ['Dual course maintenance', '−40%', 'var(--admin-brand-tint)', 'var(--admin-brand-soft-edge)'],
            ].map(([k, v, bg, edge]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, padding: '8px 10px', borderRadius: 8, border: `1px solid ${edge}`, background: bg }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--admin-ink)' }}>{k}</span>
                <strong style={{ fontSize: 12, color: 'var(--admin-ink)' }}>{v}</strong>
              </div>
            ))}
          </section>
          <p style={{ ...SIDE, margin: 0, fontSize: 11, lineHeight: 1.5, color: 'var(--admin-muted)' }}>
            This mock learning center opens courseware in a dedicated window. When integrated, the language toggle will load the localized course while keeping the learner’s progress.
          </p>
        </aside>
      </div>
    </section>
  )
}

function Dot({ color }: { color: string }) {
  return <span aria-hidden style={{ display: 'inline-block', width: 9, height: 9, marginRight: 6, borderRadius: 2, background: color }} />
}

const LANG: CSSProperties = { border: 'none', borderRadius: 9999, background: 'var(--admin-fill)', padding: '3px 10px', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, color: 'var(--admin-text)', cursor: 'pointer' }
const PLAYER: CSSProperties = {
  position: 'relative',
  display: 'grid',
  placeItems: 'center',
  width: '100%',
  aspectRatio: '16 / 9',
  border: 'none',
  borderRadius: 12,
  background: 'linear-gradient(135deg, var(--admin-ink), var(--admin-text))',
  cursor: 'pointer',
}
const SIDE: CSSProperties = { padding: 14, borderRadius: 12, border: '1px solid var(--admin-rule)', background: 'var(--admin-surface)' }
