import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ADMIN_COMPANY, ADMIN_USER } from '@/data/atlasAdmin/learners'
import { STATES } from '@/data/atlasAdmin/assignments'
import { Check } from '@/icons'
import { ADMIN_BASE, useAdminStore } from './adminStore'
import { AdminToast } from './adminUi'
import { ALERTS, STEP_IDS, freshAnswers, type OnboardingAnswers } from './onboarding'

/**
 * ATLAS ADMIN — THE ONBOARDING WIZARD (2026-10-20). The reference's
 * full-screen setup (it overlays the portal there; here it has its own
 * route, opened from the welcome email): seven questions on the left, a
 * live picture of what each answer does on the right, then "Setting up your
 * experience" and the portal.
 *
 *   1 You and your company — what sales already captured, plus name, email,
 *     company, URL (Look up company), logo upload
 *   2 What can they buy? — content type, product line, delivery
 *   3 What do you call your groups? — the one word in the nav
 *   4 State affidavit (regulated) — placeholder, as in the reference
 *   5 How do you enroll your recruits? — sets Students' primary button
 *   6 What matters most for your business? — sets the first report
 *   7 Progress report — cadence, recipients, the alerts and learner emails
 *
 * Finishing writes what the portal can use back to the store: the company
 * label (invite URLs) and the progress report's cadence and recipients.
 * The reference's live company lookup needs an OpenAI key; this one reads
 * the URL locally and says so, as the reference does when its key is absent.
 */

const TITLES: Record<(typeof STEP_IDS)[number], [string, string]> = {
  company: ['You and your company', 'Your name, work email, and the company this portal is for. We read the site for a logo if you add a URL. You can continue without waiting.'],
  catalog: ['What can they buy?', 'Same checks a CSM makes on a pricing rule. Pick one or many in each list. Discipline stays Insurance.'],
  groups: ['What do you call your groups?', 'We recommend Teams. The default stored data is still Departments. One word in the nav. Structure stays the same.'],
  affidavit: ['State affidavit (regulated)', 'Placeholder for states that require a signed affidavit. Product and legal details are still open.'],
  enroll: ['How do you enroll your recruits?', 'Pick every way you enroll people. This changes the primary button on Students.'],
  goals: ['What matters most for your business?', 'Pick one or more. We use this to set the first progress report and what Students emphasizes.'],
  report: ['Progress report', 'An email that tells you which recruits stopped moving, and who to call first. It replaces the spreadsheet nobody opens.'],
}

const SETUP = ['Saving what you told us', 'Creating your email, link, and QR', 'Turning on alerts when someone falls behind', 'Opening your portal']

export function AtlasAdminOnboardingPage() {
  const navigate = useNavigate()
  const { companyLabel, partnerRequest, onboardingDraft, setOnboardingDraft, setOnboarded, setSampleRoster, setCompanyLabel, setProgressReport, showToast } = useAdminStore()
  // What Partner with us captured comes first, as the CSM's notes would.
  const fresh = () => {
    const f = freshAnswers(partnerRequest?.company ?? companyLabel)
    return partnerRequest ? { ...f, name: partnerRequest.name.split(' ')[0], email: partnerRequest.email, url: '', recipients: [partnerRequest.email] } : f
  }
  const [a, setA] = useState<OnboardingAnswers>(() => onboardingDraft ?? fresh())
  const [settingUp, setSettingUp] = useState(-1)
  const [logoError, setLogoError] = useState<string | null>(null)
  const [csm, setCsm] = useState(false)
  const id = STEP_IDS[a.step]
  const set = (patch: Partial<OnboardingAnswers>) => setA((x) => ({ ...x, ...patch }))
  const toggle = (key: 'contentTypes' | 'productLines' | 'delivery' | 'enroll' | 'goals' | 'alerts' | 'affidavitStates' | 'recipients', v: string) =>
    setA((x) => ({ ...x, [key]: x[key].includes(v) ? x[key].filter((y) => y !== v) : [...x[key], v] }))

  // Customer Service Manager Mode: a CSM walking the call can skip ahead
  // without filling everything in.
  const ok =
    csm ||
    id === 'company'
      ? !!(a.name.trim() && /.+@.+\..+/.test(a.email) && a.company.trim())
      : id === 'catalog'
        ? a.contentTypes.length > 0 && a.productLines.length > 0 && a.delivery.length > 0
        : id === 'enroll'
          ? a.enroll.length > 0
          : id === 'goals'
            ? a.goals.length > 0
            : id === 'report'
              ? a.recipients.length > 0
              : true

  // The finish: four lines tick over, then the portal.
  useEffect(() => {
    if (settingUp < 0) return
    if (settingUp >= SETUP.length) {
      navigate(`${ADMIN_BASE}/students${window.location.search}`)
      return
    }
    const t = window.setTimeout(() => setSettingUp((n) => n + 1), 650)
    return () => window.clearTimeout(t)
  }, [settingUp, navigate])

  const finish = () => {
    setCompanyLabel(a.company.trim())
    setProgressReport({ active: a.cadence !== 'alert-only', people: a.recipients, day: a.cadence === 'daily' ? 'Every weekday' : 'Mondays' })
    setOnboarded(true)
    // A new office starts with nobody on the roster.
    setSampleRoster(false)
    setOnboardingDraft(null)
    setSettingUp(0)
  }
  const saveAndExit = () => {
    setOnboardingDraft(a)
    showToast('Saved. Pick up where you left off from the email.')
    navigate(`${ADMIN_BASE}/welcome${window.location.search}`)
  }
  const lookUp = () => {
    let host = a.url.trim()
    try {
      host = new URL(/^https?:/.test(host) ? host : `https://${host}`).hostname.replace(/^www\./, '')
    } catch {
      /* keep what was typed */
    }
    const guess = host.split('.')[0]
    set({ lookedUp: true, company: a.company.trim() || guess })
  }
  const onLogo = (file: File | undefined) => {
    if (!file) return
    if (!/^image\/(png|jpeg|svg\+xml|webp)$/.test(file.type)) return setLogoError('Choose an image file (PNG, JPG, SVG, or WebP).')
    if (file.size > 2 * 1024 * 1024) return setLogoError('Logo must be under 2 MB.')
    const r = new FileReader()
    r.onload = () => (typeof r.result === 'string' ? (set({ logo: r.result }), setLogoError(null)) : setLogoError('Could not read that image. Try another file.'))
    r.onerror = () => setLogoError('Could not read that image. Try another file.')
    r.readAsDataURL(file)
  }

  if (settingUp >= 0) {
    return (
      <div style={{ ...PAGE, display: 'grid', placeItems: 'center' }}>
        <div style={{ width: 360 }}>
          <h1 style={{ ...SERIF, fontSize: 24, margin: '0 0 20px' }}>Setting up your experience</h1>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {SETUP.map((line, i) => (
              <li key={line} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: i <= settingUp ? 'var(--admin-public-ink)' : 'var(--admin-public-muted)' }}>
                <span aria-hidden style={{ display: 'grid', placeItems: 'center', width: 20, height: 20, borderRadius: 9999, background: i < settingUp ? 'var(--admin-success)' : 'var(--admin-public-tint)', color: 'var(--admin-surface)' }}>
                  {i < settingUp ? <Check size={9} /> : null}
                </span>
                {line}
              </li>
            ))}
          </ul>
        </div>
      </div>
    )
  }

  return (
    <div style={{ ...PAGE, display: 'grid', gridTemplateColumns: 'minmax(0, 42fr) minmax(0, 58fr)' }}>
      <section style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--admin-surface)' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 28px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <img alt="XCEL" src="/brand/xcel-logo.webp" style={{ height: 18 }} />
            <span style={{ padding: '1px 6px', borderRadius: 9999, background: 'var(--admin-logo-pill)', color: 'var(--admin-surface)', fontSize: 8, fontWeight: 700 }}>ADMIN</span>
          </span>
          <span style={{ display: 'flex', gap: 14 }}>
            <button type="button" onClick={() => setA(fresh())} style={LINK}>
              Clear all answers
            </button>
            <button type="button" onClick={saveAndExit} style={LINK}>
              Save &amp; exit
            </button>
          </span>
        </header>
        <div role="progressbar" aria-valuemin={1} aria-valuemax={STEP_IDS.length} aria-valuenow={a.step + 1} aria-label={`Step ${a.step + 1} of ${STEP_IDS.length}`} style={{ display: 'flex', gap: 4, padding: '0 28px' }}>
          {STEP_IDS.map((s, i) => (
            <span key={s} style={{ flex: 1, height: 3, borderRadius: 9999, background: i <= a.step ? 'var(--admin-brand)' : 'var(--admin-public-rule)' }} />
          ))}
        </div>

        <div style={{ flex: 1, padding: '24px 28px', overflowY: 'auto' }}>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--admin-public-muted)' }}>
            Step {a.step + 1} of {STEP_IDS.length}
          </p>
          <h1 style={{ ...SERIF, margin: '6px 0 6px', fontSize: 26 }}>{TITLES[id][0]}</h1>
          <p style={{ ...BODY, marginBottom: 20 }}>{TITLES[id][1]}</p>

          {id === 'company' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ padding: 12, borderRadius: 10, background: 'var(--admin-public-bg)', border: '1px solid var(--admin-public-rule)' }}>
                <p style={{ ...KICK, color: 'var(--admin-brand)' }}>Your XCEL rep set this up for you</p>
                <p style={{ ...BODY, fontSize: 11, margin: '2px 0 8px' }}>Change anything here or in Settings. This is what sales already captured on the call.</p>
                <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, margin: 0 }}>
                  {[
                    ['Company', a.company || '—'],
                    ['Parent', ADMIN_COMPANY],
                    ['Department', ADMIN_USER.department],
                    ['Your rate', `20% off list, set by ${ADMIN_COMPANY}`],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt style={KICK}>{k}</dt>
                      <dd style={{ margin: 0, fontSize: 12, color: 'var(--admin-public-ink)' }}>{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Your name">
                  <input value={a.name} onChange={(e) => set({ name: e.target.value })} style={INPUT} />
                </Field>
                <Field label="Work email" hint="This is who progress reports go to. You can add more people later.">
                  <input type="email" value={a.email} onChange={(e) => set({ email: e.target.value })} style={INPUT} />
                </Field>
              </div>
              <Field label="Company name">
                <input value={a.company} onChange={(e) => set({ company: e.target.value })} style={INPUT} />
              </Field>
              <Field label="Company URL">
                <input value={a.url} onChange={(e) => set({ url: e.target.value, lookedUp: false })} style={INPUT} />
              </Field>
              <button type="button" onClick={lookUp} style={{ ...GHOST, alignSelf: 'flex-start' }}>
                Look up company
              </button>
              {a.lookedUp ? (
                <div style={{ display: 'flex', gap: 12, padding: 12, borderRadius: 10, border: '1px solid var(--admin-public-rule)', background: 'var(--admin-public-bg)' }}>
                  <label style={{ display: 'grid', placeItems: 'center', width: 52, height: 52, flex: 'none', borderRadius: 10, background: 'var(--admin-surface)', border: '1px dashed var(--admin-public-rule)', fontSize: 9, color: 'var(--admin-public-muted)', cursor: 'pointer', overflow: 'hidden' }}>
                    {a.logo ? <img alt="Company logo" src={a.logo} style={{ maxWidth: '100%', maxHeight: '100%' }} /> : 'Logo'}
                    <input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" hidden aria-label="Replace company logo" onChange={(e) => onLogo(e.target.files?.[0])} />
                  </label>
                  <span>
                    <span style={{ ...KICK, color: 'var(--admin-brand)' }}>Your company</span>
                    <strong style={{ ...SERIF, display: 'block', fontSize: 15 }}>{a.company}</strong>
                    <span style={{ ...BODY, fontSize: 11 }}>Using a local placeholder. Live lookup was unavailable. Click the square to upload a logo.</span>
                    {logoError ? <span style={{ display: 'block', marginTop: 4, fontSize: 11, color: 'var(--admin-brand)' }}>{logoError}</span> : null}
                  </span>
                </div>
              ) : null}
            </div>
          ) : null}

          {id === 'catalog' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Choices label="Content type" options={['Prelicensing', 'CE']} value={a.contentTypes} onToggle={(v) => toggle('contentTypes', v)} />
              <Choices label="Product line" options={['Life and Health', 'P&C']} value={a.productLines} onToggle={(v) => toggle('productLines', v)} />
              <Choices label="Delivery" options={['Online self-paced', 'Blended']} value={a.delivery} onToggle={(v) => toggle('delivery', v)} />
            </div>
          ) : null}

          {id === 'groups' ? (
            <div role="radiogroup" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {['Teams', 'Departments', 'Offices', 'Branches'].map((w) => (
                <button key={w} type="button" role="radio" aria-checked={a.groupWord === w} onClick={() => set({ groupWord: w })} style={{ ...choice(a.groupWord === w), textAlign: 'left', padding: '12px 14px' }}>
                  <strong style={{ display: 'block', fontSize: 13 }}>{w}</strong>
                  {w === 'Teams' ? <span style={{ fontSize: 10, fontWeight: 400 }}>Recommended</span> : null}
                </button>
              ))}
            </div>
          ) : null}

          {id === 'affidavit' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(
                [
                  ['none', 'Not needed', 'None of the states we hire in require one.'],
                  ['some', 'Some of our states require one', 'Pick them. Recruits in those states sign before enrolling.'],
                ] as const
              ).map(([k, t, b]) => (
                <button key={k} type="button" role="radio" aria-checked={a.affidavit === k} onClick={() => set({ affidavit: k })} style={{ ...choice(a.affidavit === k), textAlign: 'left', padding: '12px 14px' }}>
                  <strong style={{ display: 'block', fontSize: 13 }}>{t}</strong>
                  <span style={{ fontSize: 11, fontWeight: 400 }}>{b}</span>
                </button>
              ))}
              {a.affidavit === 'some' ? <Choices label="States" options={STATES.map(([c]) => c)} value={a.affidavitStates} onToggle={(v) => toggle('affidavitStates', v)} /> : null}
            </div>
          ) : null}

          {id === 'enroll' ? <Choices label="Ways you enroll" options={['Email', 'Link', 'QR code at events', 'Bulk CSV']} value={a.enroll} onToggle={(v) => toggle('enroll', v)} /> : null}

          {id === 'goals' ? <Choices label="Watch for" options={['Never opened the course', 'Stalled midcourse', 'Done, no exam prep', 'Course complete, then licensed']} value={a.goals} onToggle={(v) => toggle('goals', v)} /> : null}

          {id === 'report' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Field label="Cadence">
                <div role="radiogroup" style={{ display: 'flex', gap: 6 }}>
                  {(
                    [
                      ['daily', 'Daily digest'],
                      ['weekly', 'Weekly, Mondays'],
                      ['alert-only', 'Alerts only'],
                    ] as const
                  ).map(([k, l]) => (
                    <button key={k} type="button" role="radio" aria-checked={a.cadence === k} onClick={() => set({ cadence: k })} style={choice(a.cadence === k)}>
                      {l}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Recipients" hint="You by default. Add anyone who should see the report.">
                <Recipients value={a.recipients} onChange={(r) => set({ recipients: r })} />
              </Field>
              <div>
                <p style={{ ...KICK, marginBottom: 6 }}>Alerts and learner emails</p>
                {ALERTS.map(([k, name, desc]) => (
                  <label key={k} style={{ display: 'flex', gap: 10, padding: '8px 0', borderTop: '1px solid var(--admin-public-rule)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={a.alerts.includes(k)} onChange={() => toggle('alerts', k)} style={{ marginTop: 2, accentColor: 'var(--admin-brand)' }} />
                    <span>
                      <strong style={{ display: 'block', fontSize: 12, color: 'var(--admin-public-ink)' }}>{name}</strong>
                      <span style={{ fontSize: 11, color: 'var(--admin-public-text)' }}>{desc}</span>
                    </span>
                  </label>
                ))}
              </div>
              <button type="button" onClick={() => showToast(`Sample report sent to ${a.recipients[0] ?? a.email}`)} style={{ ...GHOST, alignSelf: 'flex-start' }}>
                Send me a sample
              </button>
            </div>
          ) : null}
        </div>

        <footer style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 28px', borderTop: '1px solid var(--admin-public-rule)' }}>
          <button type="button" onClick={() => (a.step === 0 ? saveAndExit() : set({ step: a.step - 1 }))} style={LINK}>
            {a.step === 0 ? 'Cancel' : '← Back'}
          </button>
          <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--admin-public-muted)' }}>
              <input type="checkbox" checked={csm} onChange={() => setCsm((c) => !c)} style={{ accentColor: 'var(--admin-brand)' }} />
              Customer Service Manager Mode
            </label>
            <button type="button" disabled={!ok} onClick={() => (a.step === STEP_IDS.length - 1 ? finish() : set({ step: a.step + 1 }))} style={{ ...CTA, opacity: ok ? 1 : 0.45, cursor: ok ? 'pointer' : 'default' }}>
              {a.step === STEP_IDS.length - 1 ? 'Finish setup' : 'Continue →'}
            </button>
          </span>
        </footer>
        {csm ? <p style={{ margin: 0, padding: '0 28px 12px', fontSize: 10, color: 'var(--admin-public-muted)' }}>CSM mode: Continue skips any step left blank.</p> : null}
      </section>

      <AdminToast />
      <aside style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(160deg, var(--admin-public-tint), var(--admin-public-bg))', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <Preview id={id} a={a} />
      </aside>
    </div>
  )
}

/** The right-hand picture: what the current answer does. */
function Preview({ id, a }: { id: (typeof STEP_IDS)[number]; a: OnboardingAnswers }) {
  const wrap = (title: ReactNode, sub: string, body: ReactNode) => (
    <div style={{ width: '100%', maxWidth: 440 }}>
      <h2 style={{ ...SERIF, fontSize: 30, margin: '0 0 8px' }}>{title}</h2>
      <p style={{ ...BODY, marginBottom: 24 }}>{sub}</p>
      {body}
    </div>
  )
  const accent = (s: string) => <span style={{ color: 'var(--admin-brand)' }}>{s}</span>
  if (id === 'company')
    return wrap(
      <>Start with {accent('you')}</>,
      'Your name, your email, then the company this portal belongs to. We pull the rest from the site.',
      <Paper>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span aria-hidden style={{ display: 'grid', placeItems: 'center', width: 36, height: 36, borderRadius: 8, background: 'var(--admin-brand)', color: 'var(--admin-surface)', fontWeight: 700, overflow: 'hidden' }}>
            {a.logo ? <img alt="" src={a.logo} style={{ maxWidth: '100%', maxHeight: '100%' }} /> : (a.company[0] ?? 'X')}
          </span>
          <span>
            <span style={KICK}>Your office</span>
            <strong style={{ display: 'block', fontSize: 13, color: 'var(--admin-public-ink)' }}>{a.company || 'Your company'}</strong>
            <span style={{ fontSize: 10, color: 'var(--admin-public-muted)' }}>Admin · {a.name || 'you'} · {a.email}</span>
          </span>
        </div>
      </Paper>,
    )
  if (id === 'catalog')
    return wrap(
      <>Price the {accent('catalog')}</>,
      'Content type, product line, and delivery. One or many. Same work as a pricing rule.',
      <Paper>
        {[
          ['Content type', a.contentTypes],
          ['Product line', a.productLines],
          ['Delivery', a.delivery],
        ].map(([k, v]) => (
          <div key={k as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: '1px solid var(--admin-public-rule)', fontSize: 12 }}>
            <span style={{ color: 'var(--admin-public-muted)' }}>{k}</span>
            <strong style={{ color: 'var(--admin-public-ink)' }}>{(v as string[]).join(' · ') || '—'}</strong>
          </div>
        ))}
      </Paper>,
    )
  if (id === 'groups')
    return wrap(
      <>Your word for {accent('groups')}</>,
      'It shows in the nav and on every filter. Nothing moves.',
      <Paper>
        <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
          {['Students', 'Invites', a.groupWord, 'Reports'].map((n, i) => (
            <span key={n} style={{ fontWeight: i === 2 ? 700 : 400, color: i === 2 ? 'var(--admin-brand)' : 'var(--admin-public-text)' }}>
              {n}
            </span>
          ))}
        </div>
      </Paper>,
    )
  if (id === 'affidavit')
    return wrap(
      <>State {accent('affidavit')}</>,
      'Where a state requires it, recruits sign before they can enroll.',
      <Paper>
        <p style={{ ...BODY, fontSize: 12 }}>{a.affidavit === 'none' ? 'No affidavit step. Recruits go straight to checkout.' : `Affidavit before checkout in ${a.affidavitStates.join(', ') || '(pick states)'}.`}</p>
      </Paper>,
    )
  if (id === 'enroll')
    return wrap(
      <>How they {accent('enroll')}</>,
      'Your first choice becomes the main button on Students.',
      <Paper>
        <span style={{ ...CTA, display: 'inline-block' }}>{a.enroll[0] === 'Bulk CSV' ? 'Upload recruits' : a.enroll[0]?.startsWith('QR') ? 'Print QR code' : 'Invite learners'}</span>
        <p style={{ ...BODY, fontSize: 11, marginTop: 10 }}>Also on: {a.enroll.slice(1).join(', ') || 'nothing else'}</p>
      </Paper>,
    )
  if (id === 'goals')
    return wrap(
      <>What you {accent('watch')}</>,
      'These lead the first report and open Students filtered.',
      <Paper>
        {a.goals.map((g) => (
          <div key={g} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: '1px solid var(--admin-public-rule)', fontSize: 12, color: 'var(--admin-public-ink)' }}>
            {g}
            <span style={{ color: 'var(--admin-brand)', fontWeight: 600 }}>View</span>
          </div>
        ))}
      </Paper>,
    )
  return wrap(
    <>This is what {accent('lands')}</>,
    'Three lines and a button. Every count is a link that opens the portal already filtered.',
    <Paper>
      <p style={{ ...KICK, color: 'var(--admin-brand)' }}>{a.cadence === 'daily' ? 'XCEL daily digest' : a.cadence === 'weekly' ? 'XCEL Monday brief' : 'XCEL alert'}</p>
      <p style={{ fontSize: 10, color: 'var(--admin-public-muted)', margin: '2px 0 8px' }}>to admins at {a.company}</p>
      {[
        ['Never opened the course', 'Remind'],
        ['Stalled midcourse', 'View'],
        ['Done, no exam prep', 'View'],
      ].map(([t, act]) => (
        <div key={t} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: '1px solid var(--admin-public-rule)', fontSize: 12, color: 'var(--admin-public-ink)' }}>
          {t}
          <span style={{ color: 'var(--admin-brand)', fontWeight: 600 }}>{act}</span>
        </div>
      ))}
      <p style={{ ...BODY, fontSize: 10, marginTop: 8 }}>You can change cadence, recipients, or turn it off entirely from Notifications at any time.</p>
    </Paper>,
  )
}

function Recipients({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = useState('')
  const add = () => {
    const e = draft.trim()
    if (/.+@.+\..+/.test(e) && !value.includes(e)) onChange([...value, e])
    setDraft('')
  }
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
        {value.map((r) => (
          <span key={r} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 4px 2px 9px', borderRadius: 9999, background: 'var(--admin-public-tint)', fontSize: 11 }}>
            {r}
            <button type="button" aria-label={`Remove ${r}`} onClick={() => onChange(value.filter((x) => x !== r))} style={{ ...LINK, padding: '0 4px' }}>
              ×
            </button>
          </span>
        ))}
      </div>
      <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())} onBlur={add} placeholder="name@agency.com, then Enter" style={INPUT} />
    </div>
  )
}

function Choices({ label, options, value, onToggle }: { label: string; options: string[]; value: string[]; onToggle: (v: string) => void }) {
  return (
    <div>
      <p style={{ ...KICK, marginBottom: 6 }}>{label}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {options.map((o) => (
          <button key={o} type="button" aria-pressed={value.includes(o)} onClick={() => onToggle(o)} style={choice(value.includes(o))}>
            {value.includes(o) ? '✓ ' : ''}
            {o}
          </button>
        ))}
      </div>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ display: 'block', marginBottom: 5, fontSize: 11, fontWeight: 700, color: 'var(--admin-public-ink)' }}>{label}</span>
      {children}
      {hint ? <span style={{ display: 'block', marginTop: 4, fontSize: 10, color: 'var(--admin-public-muted)' }}>{hint}</span> : null}
    </label>
  )
}

function Paper({ children }: { children: ReactNode }) {
  return <div style={{ padding: 16, borderRadius: 14, background: 'var(--admin-surface)', boxShadow: 'var(--admin-shadow-menu)' }}>{children}</div>
}

function choice(on: boolean): CSSProperties {
  return {
    padding: '8px 12px',
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: on ? 'var(--admin-brand)' : 'var(--admin-public-rule)',
    background: on ? 'var(--admin-brand-tint)' : 'var(--admin-surface)',
    fontFamily: 'inherit',
    fontSize: 12,
    fontWeight: on ? 700 : 500,
    color: on ? 'var(--admin-brand)' : 'var(--admin-public-ink)',
    cursor: 'pointer',
  }
}

const PAGE: CSSProperties = { minHeight: '100vh', background: 'var(--admin-public-bg)', fontFamily: 'var(--font-body)', color: 'var(--admin-public-ink)' }
const SERIF: CSSProperties = { fontFamily: 'var(--admin-font-serif)', fontWeight: 700, color: 'var(--admin-public-ink)' }
const BODY: CSSProperties = { margin: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--admin-public-text)' }
const KICK: CSSProperties = { margin: 0, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--admin-public-muted)' }
const INPUT: CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '9px 11px', borderRadius: 8, border: '1px solid var(--admin-public-rule)', background: 'var(--admin-surface)', fontFamily: 'inherit', fontSize: 12, color: 'var(--admin-public-ink)' }
const CTA: CSSProperties = { border: 'none', borderRadius: 9999, background: 'var(--admin-brand)', padding: '10px 18px', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, color: 'var(--admin-surface)', cursor: 'pointer' }
const GHOST: CSSProperties = { borderRadius: 9999, border: '1px solid var(--admin-brand)', background: 'var(--admin-surface)', padding: '7px 14px', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, color: 'var(--admin-brand)', cursor: 'pointer' }
const LINK: CSSProperties = { padding: 0, border: 'none', background: 'none', fontFamily: 'inherit', fontSize: 12, color: 'var(--admin-public-text)', cursor: 'pointer' }
