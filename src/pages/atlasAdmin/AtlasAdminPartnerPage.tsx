import { useState, type CSSProperties, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ADMIN_BASE, useAdminStore } from './adminStore'

/**
 * ATLAS ADMIN — PARTNER WITH US (2026-10-20). The reference's public
 * /partner-with-us: the agency pitch (hero with a Monday-brief card, three
 * steps, the roster preview) and the five-field form. Request a call keeps
 * what was typed in the store and opens the welcome inbox, where the "thanks
 * for scheduling a call" email reads it back — the start of the demo story.
 * Log in goes straight to the inbox, as the reference's does.
 *
 * Its own page, outside the admin shell, in the reference's warm palette.
 */

const VOLUMES = ['Under 25', '25–100', '100–500', '500+']
const LINES = ['Life', 'Life and Health', 'Property and Casualty', 'Not sure yet']

export function AtlasAdminPartnerPage() {
  const navigate = useNavigate()
  const { setPartnerRequest } = useAdminStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [volume, setVolume] = useState('25–100')
  const [lines, setLines] = useState<string[]>(['Life and Health'])
  const [notes, setNotes] = useState('')
  const ready = name.trim() && /.+@.+\..+/.test(email) && company.trim() && lines.length > 0
  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  const submit = () => {
    if (!ready) return
    setPartnerRequest({ name: name.trim(), email: email.trim(), company: company.trim(), volume, lines, notes: notes.trim() })
    navigate(`${ADMIN_BASE}/welcome?message=call${window.location.search.replace(/^\?/, '&')}`)
  }

  return (
    <div style={PAGE}>
      <header style={TOP}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span aria-hidden style={MARK}>
            X
          </span>
          <span>
            <strong style={{ display: 'block', fontSize: 13, color: 'var(--admin-public-ink)' }}>XCEL Solutions</strong>
            <span style={{ fontSize: 9, color: 'var(--admin-public-muted)' }}>an STC company</span>
          </span>
        </span>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 12 }}>
          <button type="button" onClick={() => go('how')} style={NAV}>
            Courses
          </button>
          <button type="button" onClick={() => go('how')} style={NAV}>
            States
          </button>
          <button type="button" onClick={() => navigate(`${ADMIN_BASE}/welcome${window.location.search}`)} style={NAV}>
            Log in
          </button>
          <button type="button" onClick={() => go('partner')} style={{ ...CTA, padding: '7px 14px', fontSize: 12 }}>
            Partner with us
          </button>
        </nav>
      </header>

      <section style={{ background: 'linear-gradient(180deg, var(--admin-public-tint), var(--admin-public-bg))', padding: '56px 24px 48px' }}>
        <div style={{ ...WRAP, display: 'grid', gap: 40, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', alignItems: 'center' }}>
          <div>
            <p style={EYEBROW}>For agencies, IMOs, banks and carriers</p>
            <h1 style={{ ...SERIF, margin: '12px 0 16px', fontSize: 40, lineHeight: 1.1 }}>
              Your recruits, licensed. Without the <span style={{ color: 'var(--admin-brand)' }}>chasing</span>.
            </h1>
            <p style={{ ...BODY, fontSize: 14 }}>One link gets every recruit into pre-licensing at your agency rate. You see who is moving, who stalled, and who passed, without asking anyone.</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '24px 0 16px' }}>
              <button type="button" onClick={() => go('partner')} style={CTA}>
                Start the conversation
              </button>
              <button type="button" onClick={() => go('how')} style={{ ...NAV, fontWeight: 600, color: 'var(--admin-brand)' }}>
                See how it works →
              </button>
            </div>
            <p style={{ ...BODY, fontSize: 11, color: 'var(--admin-public-muted)' }}>Set up in one call. No contract to start. Recruits pay their own way.</p>
          </div>
          <figure style={{ margin: 0 }}>
            <div style={{ ...PAPER, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                <span style={{ color: 'var(--admin-brand)' }}>Monday brief · Summit Insurance</span>
                <span style={{ color: 'var(--admin-public-muted)' }}>34 recruits</span>
              </div>
              <p style={{ margin: '12px 0', fontSize: 13, fontWeight: 700, color: 'var(--admin-public-ink)' }}>3 need a check-in · 2 are ready for the exam</p>
              <BriefRow initials="JR" name="Jordan Reyes" line="Never opened · day 11" tag="Call" tone="brand" />
              <BriefRow initials="MO" name="Mara Okafor" line="Course done · practice exam 84%" tag="Ready" tone="green" />
              <BriefRow initials="DP" name="Devin Park" line="62% · on pace" tag="Day 6" tone="plain" />
            </div>
            <figcaption style={{ marginTop: 8, textAlign: 'center', fontSize: 10, color: 'var(--admin-public-muted)' }}>What lands in your inbox every Monday</figcaption>
          </figure>
        </div>
      </section>

      <section id="how" style={{ padding: '56px 24px', background: 'var(--admin-surface)' }}>
        <div style={WRAP}>
          <p style={EYEBROW}>How it works</p>
          <h2 style={{ ...SERIF, margin: '8px 0 32px', fontSize: 26 }}>Three steps. You do the first one.</h2>
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 32, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            {[
              ['Send your link', 'Email it, text it, or print the QR code for a hiring event. Every recruit lands on a page built for your agency, with your rate already applied. No codes.'],
              ['They enroll and start', 'Recruits pick their package, pay, and open chapter one in about five minutes. Nothing comes out of your budget.'],
              ['You watch them move', 'Progress, stalls, exam dates and pass results in one roster. Quiet recruits get nudged automatically. You get a brief every Monday.'],
            ].map(([title, body], i) => (
              <li key={title}>
                <span aria-hidden style={NUM}>
                  {i + 1}
                </span>
                <h3 style={{ margin: '14px 0 8px', fontSize: 15, color: 'var(--admin-public-ink)' }}>{title}</h3>
                <p style={BODY}>{body}</p>
              </li>
            ))}
          </ol>

          <div style={{ marginTop: 48, padding: 32, borderRadius: 20, background: 'var(--admin-public-bg)', border: '1px solid var(--admin-public-rule)', display: 'grid', gap: 32, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', alignItems: 'center' }}>
            <div>
              <h2 style={{ ...SERIF, margin: '0 0 20px', fontSize: 24 }}>Built for the person who has to answer “how is recruiting going?”</h2>
              {[
                ['One page per department', 'Regional leads see every office. Office leads see only their own.'],
                ['Every state and line you hire for', 'Life, Life and Health, Property and Casualty. One rate across all of it.'],
                ['Licensing does not end at “passed”', 'License numbers, renewal dates and CE hours live on the same record.'],
              ].map(([t, b]) => (
                <div key={t} style={{ paddingLeft: 12, marginBottom: 14, borderLeft: '3px solid var(--admin-brand)' }}>
                  <strong style={{ display: 'block', fontSize: 13, color: 'var(--admin-public-ink)' }}>{t}</strong>
                  <span style={{ ...BODY, fontSize: 12 }}>{b}</span>
                </div>
              ))}
            </div>
            <div style={{ ...PAPER, padding: 14 }}>
              <div style={{ display: 'flex', gap: 14, fontSize: 11, borderBottom: '1px solid var(--admin-public-rule)', paddingBottom: 8 }}>
                <strong style={{ color: 'var(--admin-public-ink)', boxShadow: 'inset 0 -2px 0 var(--admin-brand)' }}>Students</strong>
                <span style={{ color: 'var(--admin-public-muted)' }}>Invites</span>
                <span style={{ color: 'var(--admin-public-muted)' }}>Reports</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '10px 0' }}>
                {['Off track · 5', 'On pace · 24', 'Ready · 2', 'Passed · 3'].map((c, i) => (
                  <span key={c} style={{ padding: '3px 9px', borderRadius: 9999, fontSize: 10, fontWeight: 600, ...(i === 0 ? { background: 'var(--admin-public-ink)', color: 'var(--admin-surface)' } : { border: '1px solid var(--admin-public-rule)', color: 'var(--admin-public-ink)' }) }}>
                    {c}
                  </span>
                ))}
              </div>
              {[
                ['Jordan Reyes', 'Albany office', 'Never opened', 8, 'var(--admin-brand)'],
                ['Alyssa Eans', 'Albany office', 'Quiet 8 days', 40, 'var(--admin-brand)'],
                ['Mara Okafor', 'Buffalo office', 'Exam Oct 2', 100, 'var(--admin-success-ink)'],
              ].map(([n, o, s, pct, c]) => (
                <div key={n as string} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 90px', alignItems: 'center', gap: 8, padding: '7px 0', borderTop: '1px solid var(--admin-public-rule)' }}>
                  <span>
                    <strong style={{ display: 'block', fontSize: 11, color: 'var(--admin-public-ink)' }}>{n}</strong>
                    <span style={{ fontSize: 9, color: 'var(--admin-public-muted)' }}>{o}</span>
                  </span>
                  <span style={{ height: 5, borderRadius: 9999, background: 'var(--admin-public-rule)' }}>
                    <span style={{ display: 'block', height: '100%', width: `${pct}%`, borderRadius: 9999, background: c as string }} />
                  </span>
                  <span style={{ fontSize: 10, color: c as string }}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="partner" style={{ padding: '56px 24px', background: 'var(--admin-public-dark)' }}>
        <div style={{ ...WRAP, display: 'grid', gap: 40, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', alignItems: 'start' }}>
          <div>
            <p style={{ ...EYEBROW, color: 'var(--admin-brand-edge)' }}>Partner with us</p>
            <h2 style={{ ...SERIF, margin: '10px 0 16px', fontSize: 28, color: 'var(--admin-surface)' }}>Tell us about your recruiting. We will set your rate.</h2>
            <p style={{ ...BODY, color: 'var(--admin-public-on-dark)' }}>Five fields. A member of our team calls within one business day, agrees your agency rate and how your offices should be set up, and sends you your link. From there it is self-service.</p>
            <hr style={{ border: 'none', borderTop: '1px solid var(--admin-public-on-dark)', opacity: 0.25, margin: '20px 0' }} />
            {[
              ['Why no pricing here?', 'Your rate depends on volume. We would rather set it right on a 20 minute call than publish one number that fits nobody.'],
              ['Who pays?', 'Recruits pay for their own course at your agency rate. No invoice to you.'],
            ].map(([q, a]) => (
              <div key={q} style={{ marginBottom: 14 }}>
                <strong style={{ display: 'block', fontSize: 12, color: 'var(--admin-brand-edge)' }}>{q}</strong>
                <span style={{ ...BODY, fontSize: 12, color: 'var(--admin-public-on-dark)' }}>{a}</span>
              </div>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              submit()
            }}
            style={{ ...PAPER, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}
          >
            <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
              <Field label="Your name">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Michael Scott" style={INPUT} />
              </Field>
              <Field label="Work email">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@agency.com" style={INPUT} />
              </Field>
            </div>
            <Field label="Company">
              <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Dunder Mifflin Insurance" style={INPUT} />
            </Field>
            <Field label="Recruits you expect to license this year" hint="A rough number is fine. This is what sets your rate.">
              <div role="radiogroup" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                {VOLUMES.map((v) => (
                  <button key={v} type="button" role="radio" aria-checked={volume === v} onClick={() => setVolume(v)} style={choice(volume === v, 8)}>
                    {v}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Lines you hire for">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {LINES.map((l) => (
                  <button key={l} type="button" aria-pressed={lines.includes(l)} onClick={() => setLines((s) => (s.includes(l) ? s.filter((x) => x !== l) : [...s, l]))} style={choice(lines.includes(l), 9999)}>
                    {l}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Anything we should know" optional>
              <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="States, number of offices, timing, anything else" style={{ ...INPUT, resize: 'vertical' }} />
            </Field>
            <button type="submit" disabled={!ready} style={{ ...CTA, width: '100%', padding: 12, opacity: ready ? 1 : 0.45, cursor: ready ? 'pointer' : 'default' }}>
              Request a call
            </button>
            <p style={{ margin: 0, textAlign: 'center', fontSize: 10, color: 'var(--admin-public-muted)' }}>One business day. No obligation.</p>
          </form>
        </div>
      </section>

      <footer style={{ ...WRAP, display: 'flex', justifyContent: 'space-between', padding: '16px 24px', fontSize: 10, color: 'var(--admin-public-muted)' }}>
        <span>© 2026 XCEL Solutions · an STC company</span>
        <span style={{ display: 'flex', gap: 14 }}>
          <span>Privacy</span>
          <span>Terms</span>
          <a href="tel:8665599235" style={{ color: 'inherit' }}>
            866-559-9235
          </a>
        </span>
      </footer>
    </div>
  )
}

function BriefRow({ initials, name, line, tag, tone }: { initials: string; name: string; line: string; tag: string; tone: 'brand' | 'green' | 'plain' }) {
  const [bg, fg] = tone === 'brand' ? ['var(--admin-brand-tint)', 'var(--admin-brand)'] : tone === 'green' ? ['var(--admin-success-tint)', 'var(--admin-success-ink)'] : ['var(--admin-public-tint)', 'var(--admin-public-text)']
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: '1px solid var(--admin-public-rule)' }}>
      <span aria-hidden style={{ display: 'grid', placeItems: 'center', width: 26, height: 26, borderRadius: 9999, background: 'var(--admin-public-tint)', fontSize: 9, fontWeight: 700, color: 'var(--admin-public-text)' }}>
        {initials}
      </span>
      <span style={{ flex: 1 }}>
        <strong style={{ display: 'block', fontSize: 11, color: 'var(--admin-public-ink)' }}>{name}</strong>
        <span style={{ fontSize: 9, color: 'var(--admin-public-muted)' }}>{line}</span>
      </span>
      <span style={{ padding: '2px 8px', borderRadius: 9999, background: bg, color: fg, fontSize: 9, fontWeight: 700 }}>{tag}</span>
    </div>
  )
}

function Field({ label, hint, optional, children }: { label: string; hint?: string; optional?: boolean; children: ReactNode }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ display: 'block', marginBottom: 6, fontSize: 11, fontWeight: 700, color: 'var(--admin-public-ink)' }}>
        {label} {optional ? <span style={{ fontWeight: 400, color: 'var(--admin-public-muted)' }}>optional</span> : null}
      </span>
      {children}
      {hint ? <span style={{ display: 'block', marginTop: 4, fontSize: 10, color: 'var(--admin-public-muted)' }}>{hint}</span> : null}
    </label>
  )
}

function choice(on: boolean, radius: number): CSSProperties {
  return {
    padding: '8px 12px',
    borderRadius: radius,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: on ? 'var(--admin-brand)' : 'var(--admin-public-rule)',
    background: on ? 'var(--admin-brand-tint)' : 'var(--admin-surface)',
    fontFamily: 'inherit',
    fontSize: 11,
    fontWeight: on ? 700 : 500,
    color: on ? 'var(--admin-brand)' : 'var(--admin-public-ink)',
    cursor: 'pointer',
  }
}

const PAGE: CSSProperties = { minHeight: '100vh', background: 'var(--admin-public-bg)', fontFamily: 'var(--font-body)', color: 'var(--admin-public-ink)' }
const WRAP: CSSProperties = { maxWidth: 880, margin: '0 auto' }
const TOP: CSSProperties = { position: 'sticky', top: 0, zIndex: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px max(24px, calc((100% - 880px) / 2))', background: 'var(--admin-surface)', borderBottom: '1px solid var(--admin-public-rule)' }
const MARK: CSSProperties = { display: 'grid', placeItems: 'center', width: 26, height: 26, borderRadius: 6, background: 'var(--admin-brand)', color: 'var(--admin-surface)', fontSize: 11, fontWeight: 700 }
const NAV: CSSProperties = { padding: 0, border: 'none', background: 'none', fontFamily: 'inherit', fontSize: 12, color: 'var(--admin-public-ink)', cursor: 'pointer' }
const CTA: CSSProperties = { border: 'none', borderRadius: 9999, background: 'var(--admin-brand)', padding: '11px 20px', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, color: 'var(--admin-surface)', cursor: 'pointer' }
const EYEBROW: CSSProperties = { margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--admin-brand)' }
const SERIF: CSSProperties = { fontFamily: 'var(--admin-font-serif)', fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--admin-public-ink)' }
const BODY: CSSProperties = { margin: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--admin-public-text)' }
const PAPER: CSSProperties = { borderRadius: 14, background: 'var(--admin-surface)', border: '1px solid var(--admin-public-rule)', boxShadow: 'var(--admin-shadow-menu)' }
const NUM: CSSProperties = { display: 'grid', placeItems: 'center', width: 34, height: 34, borderRadius: 9999, background: 'var(--admin-brand)', color: 'var(--admin-surface)', fontWeight: 700 }
const INPUT: CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '9px 11px', borderRadius: 8, border: '1px solid var(--admin-public-rule)', background: 'var(--admin-surface)', fontFamily: 'inherit', fontSize: 12, color: 'var(--admin-public-ink)' }
