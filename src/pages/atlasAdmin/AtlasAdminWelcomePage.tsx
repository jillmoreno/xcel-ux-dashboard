import { useState, type CSSProperties, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ADMIN_USER } from '@/data/atlasAdmin/learners'
import { Check } from '@/icons'
import { ADMIN_BASE, useAdminStore } from './adminStore'
import { AdminToast } from './adminUi'

/**
 * ATLAS ADMIN — THE WELCOME INBOX (2026-10-20). The reference's /welcome: a
 * mock mail client with three messages. Two carry the demo story — "Thanks
 * for scheduling a call" (after Partner with us, reading back what was
 * typed there) and "Your Admin Portal is ready" (after the call, with Start
 * the onboarding process). Once the wizard is done, the same email offers
 * Open the Admin Portal instead.
 */

type Id = 'call' | 'portal' | 'agency'

export function AtlasAdminWelcomePage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { partnerRequest, onboarded } = useAdminStore()
  const [open, setOpen] = useState<Id>(params.get('message') === 'call' ? 'call' : 'portal')
  const first = (partnerRequest?.name ?? ADMIN_USER.name).split(' ')[0]
  const inboxOwner = partnerRequest?.email ?? 'cody@farmers.example.com'

  const MESSAGES: { id: Id; from: string; when: string; subject: string; preview: string }[] = [
    { id: 'call', from: 'Alex Rivera', when: 'Just now', subject: 'Thanks for scheduling a call', preview: 'A customer sales rep will reach out shortly.' },
    { id: 'portal', from: 'Jordan Lee', when: 'Later', subject: 'Congratulations. Your Admin Portal is ready', preview: 'Finish onboarding to invite recruits at your agency rate.' },
    { id: 'agency', from: 'Agency Support', when: 'Tue', subject: 'Welcome to the agency', preview: 'Your producer appointment packet is on file.' },
  ]
  const msg = MESSAGES.find((m) => m.id === open)!

  return (
    <div style={PAGE}>
      <div style={CHROME}>
        <span style={{ display: 'flex', gap: 5 }}>
          {['var(--admin-brand-edge)', 'var(--admin-amber-edge)', 'var(--admin-success-edge)'].map((c) => (
            <span key={c} aria-hidden style={{ width: 8, height: 8, borderRadius: 9999, background: c }} />
          ))}
        </span>
        <span style={{ flex: 1, padding: '3px 10px', borderRadius: 6, background: 'var(--admin-public-mail)', fontSize: 10, color: 'var(--admin-public-muted)' }}>outlook.office.com/mail/inbox/xcel-admin-portal</span>
        <Link to={`${ADMIN_BASE}/partner-with-us${window.location.search}`} style={{ fontSize: 11, fontWeight: 600, color: 'var(--admin-brand)', textDecoration: 'none' }}>
          ← Partner with us
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px minmax(0, 1fr)', minHeight: 'calc(100vh - 34px)' }}>
        <aside style={{ borderRight: '1px solid var(--admin-public-rule)', background: 'var(--admin-surface)' }}>
          <div style={{ padding: '12px 14px' }}>
            <p style={EYEBROW}>Mail</p>
            <span style={{ fontSize: 11, color: 'var(--admin-public-text)' }}>{inboxOwner}</span>
          </div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {MESSAGES.map((m) => (
              <li key={m.id}>
                <button type="button" aria-current={open === m.id || undefined} onClick={() => setOpen(m.id)} style={{ ...ITEM, background: open === m.id ? 'var(--admin-brand-hover-bg)' : 'none' }}>
                  <span style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                    <strong style={{ color: 'var(--admin-public-ink)' }}>{m.from}</strong>
                    <span style={{ fontSize: 9, color: 'var(--admin-public-muted)' }}>{m.when}</span>
                  </span>
                  <span style={{ display: 'block', margin: '2px 0', fontSize: 11, color: 'var(--admin-public-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.subject}</span>
                  <span style={{ display: 'block', fontSize: 10, color: 'var(--admin-public-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.preview}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <main style={{ background: 'var(--admin-public-mail)' }}>
          <header style={{ padding: '14px 20px', background: 'var(--admin-surface)', borderBottom: '1px solid var(--admin-public-rule)' }}>
            <p style={EYEBROW}>Inbox</p>
            <h1 style={{ ...SERIF, margin: '4px 0 12px', fontSize: 18 }}>{msg.subject}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span aria-hidden style={AVATAR}>
                {msg.from
                  .split(' ')
                  .map((p) => p[0])
                  .join('')}
              </span>
              <span style={{ flex: 1, fontSize: 11, color: 'var(--admin-public-text)' }}>
                <strong style={{ color: 'var(--admin-public-ink)' }}>{msg.from}</strong> &lt;{msg.from.toLowerCase().replace(' ', '.')}@xcelsolutions.com&gt;
                <br />
                to {partnerRequest?.name ?? ADMIN_USER.name} &lt;{inboxOwner}&gt;
              </span>
              {open !== 'agency' ? (
                <span role="tablist" style={{ display: 'flex', gap: 4 }}>
                  {(
                    [
                      ['call', 'Call confirmation'],
                      ['portal', 'Portal ready'],
                    ] as const
                  ).map(([id, label]) => (
                    <button key={id} type="button" role="tab" aria-selected={open === id} onClick={() => setOpen(id)} style={{ padding: '3px 9px', borderRadius: 9999, border: '1px solid var(--admin-public-rule)', background: open === id ? 'var(--admin-public-ink)' : 'var(--admin-surface)', fontFamily: 'inherit', fontSize: 10, color: open === id ? 'var(--admin-surface)' : 'var(--admin-public-text)', cursor: 'pointer' }}>
                      {label}
                    </button>
                  ))}
                </span>
              ) : null}
            </div>
          </header>

          <div style={{ padding: '24px 16px 48px' }}>
            {open === 'call' ? (
              <Email kicker="Request received" title={`Thanks for scheduling a call, ${first}`} signature="Alex Rivera" role="Customer Sales Representative · XCEL Solutions" footer="Sent after you requested a call on Partner with us. Reply if anything looks off.">
                <p style={BODY}>
                  We got your Partner with us request{partnerRequest ? ` for ${partnerRequest.company}` : ''}. A customer sales rep will reach out shortly.
                </p>
                {partnerRequest ? (
                  <dl style={{ margin: 0, padding: 12, borderRadius: 10, background: 'var(--admin-public-bg)', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px', fontSize: 12 }}>
                    <dt style={DT}>Recruits this year</dt>
                    <dd style={DD}>{partnerRequest.volume}</dd>
                    <dt style={DT}>Lines</dt>
                    <dd style={DD}>{partnerRequest.lines.join(', ')}</dd>
                    {partnerRequest.notes ? (
                      <>
                        <dt style={DT}>Your note</dt>
                        <dd style={DD}>{partnerRequest.notes}</dd>
                      </>
                    ) : null}
                  </dl>
                ) : null}
                <p style={BODY}>On the call we will set your agency rate and how your offices should see recruits. After that, you get your shareable link and this portal.</p>
                <p style={{ ...BODY, fontSize: 11, padding: 10, borderRadius: 8, background: 'var(--admin-warn-tint)', color: 'var(--admin-warn-ink)' }}>In the real flow, the portal-ready email arrives after the call. Use Continue to walk the rest of the demo.</p>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <button type="button" onClick={() => setOpen('portal')} style={CTA}>
                    Continue demo · portal ready email
                  </button>
                  <Link to={`${ADMIN_BASE}/partner-with-us${window.location.search}`} style={{ fontSize: 12, color: 'var(--admin-brand)' }}>
                    Back to Partner with us
                  </Link>
                </div>
              </Email>
            ) : null}

            {open === 'portal' ? (
              <Email kicker="Account ready" title={`Congratulations, ${first}`} signature="Jordan Lee" role="Customer Success Manager · XCEL Solutions" footer="Sent after your kickoff call. If you were not expecting this, contact your XCEL representative." brand>
                <p style={BODY}>Your agency account with XCEL is live. You met with your customer success manager, we confirmed the agency, and we set up your login. This last step is yours.</p>
                <p style={BODY}>Finish onboarding so the portal matches how you hire. Then you can invite recruits and watch them through pre-licensing.</p>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    'Invite recruits by email, link, or QR. They never type a partner code.',
                    'They land on your discounted packages when they sign up. Recruits pay their own way.',
                    'See who claimed, who has not launched, and who is in the course.',
                    'Track progress from Compass and know who is ready for the exam.',
                  ].map((t) => (
                    <li key={t} style={{ display: 'flex', gap: 8, fontSize: 12, lineHeight: 1.5, color: 'var(--admin-public-ink)' }}>
                      <span aria-hidden style={{ display: 'grid', placeItems: 'center', width: 16, height: 16, flex: 'none', marginTop: 1, borderRadius: 9999, background: 'var(--admin-brand-tint)', color: 'var(--admin-brand)' }}>
                        <Check size={8} />
                      </span>
                      {t}
                    </li>
                  ))}
                </ul>
                <div>
                  <button type="button" onClick={() => navigate(onboarded ? `${ADMIN_BASE}/students${window.location.search}` : `${ADMIN_BASE}/onboarding${window.location.search}`)} style={CTA}>
                    {onboarded ? 'Open the Admin Portal' : 'Start the onboarding process'}
                  </button>
                  <p style={{ ...BODY, marginTop: 8, fontSize: 11, color: 'var(--admin-public-muted)' }}>{onboarded ? 'Your setup is already saved. This email is the start of the demo story.' : 'Takes a few minutes. You can save and exit anytime.'}</p>
                </div>
              </Email>
            ) : null}

            {open === 'agency' ? (
              <Email kicker="Agency support" title="Welcome to the agency" signature="Agency Support" role="Summit Insurance Group" footer="An earlier message in this inbox — not part of the XCEL demo story.">
                <p style={BODY}>Your producer appointment packet is on file. Licensing questions go to your office lead; payroll and benefits to HR.</p>
              </Email>
            ) : null}
          </div>
        </main>
      </div>
      <AdminToast />
    </div>
  )
}

function Email({ kicker, title, signature, role, footer, brand, children }: { kicker: string; title: string; signature: string; role: string; footer: string; brand?: boolean; children: ReactNode }) {
  return (
    <article style={{ maxWidth: 520, margin: '0 auto', borderRadius: 14, overflow: 'hidden', background: 'var(--admin-surface)', boxShadow: 'var(--admin-shadow-menu)' }}>
      {brand ? (
        <div style={{ padding: '14px 24px', background: 'var(--admin-public-bg)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <img alt="XCEL" src="/brand/xcel-logo.webp" style={{ height: 18 }} />
            <span style={{ padding: '1px 6px', borderRadius: 9999, background: 'var(--admin-logo-pill)', color: 'var(--admin-surface)', fontSize: 8, fontWeight: 700 }}>ADMIN</span>
          </span>
        </div>
      ) : null}
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p style={EYEBROW}>{kicker}</p>
        <h2 style={{ ...SERIF, margin: 0, fontSize: 22 }}>{title}</h2>
        {children}
      </div>
      <div style={{ padding: '14px 24px', borderTop: '1px solid var(--admin-public-rule)' }}>
        <strong style={{ display: 'block', fontSize: 12, color: 'var(--admin-public-ink)' }}>{signature}</strong>
        <span style={{ fontSize: 10, color: 'var(--admin-public-text)' }}>{role}</span>
        <p style={{ margin: '8px 0 0', fontSize: 9, color: 'var(--admin-public-muted)' }}>{footer}</p>
      </div>
    </article>
  )
}

const PAGE: CSSProperties = { minHeight: '100vh', background: 'var(--admin-surface)', fontFamily: 'var(--font-body)', color: 'var(--admin-public-ink)' }
const CHROME: CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, height: 34, boxSizing: 'border-box', padding: '0 12px', borderBottom: '1px solid var(--admin-public-rule)' }
const ITEM: CSSProperties = { display: 'block', width: '100%', padding: '10px 14px', border: 'none', borderTop: '1px solid var(--admin-public-rule)', fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer' }
const EYEBROW: CSSProperties = { margin: 0, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--admin-brand)' }
const SERIF: CSSProperties = { fontFamily: 'var(--admin-font-serif)', fontWeight: 700, color: 'var(--admin-public-ink)' }
const BODY: CSSProperties = { margin: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--admin-public-text)' }
const CTA: CSSProperties = { border: 'none', borderRadius: 9999, background: 'var(--admin-brand)', padding: '10px 18px', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, color: 'var(--admin-surface)', cursor: 'pointer' }
const AVATAR: CSSProperties = { display: 'grid', placeItems: 'center', width: 30, height: 30, borderRadius: 9999, background: 'var(--admin-brand)', color: 'var(--admin-surface)', fontSize: 10, fontWeight: 700 }
const DT: CSSProperties = { color: 'var(--admin-public-muted)' }
const DD: CSSProperties = { margin: 0, color: 'var(--admin-public-ink)' }
