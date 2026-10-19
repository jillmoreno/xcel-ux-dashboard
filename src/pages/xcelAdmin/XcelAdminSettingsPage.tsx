import { useState, type CSSProperties, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ADMIN_DEPARTMENTS, ADMIN_USER } from '@/data/xcelAdmin/learners'
import { AdminDialog } from './AdminDialog'
import { ADMIN_BASE, ADMIN_EMAIL, useAdminStore } from './adminStore'
import { BUTTON_BRAND, BUTTON_OUTLINE, CARD, FIELD_LABEL, INPUT, PAGE_H1, PAGE_SUB, PILL } from './adminStyles'

/**
 * XCEL ADMIN · SETTINGS — rebuilt from colibri-b2b.vercel.app/settings
 * (2026-10-19). Five tabs, in the address as `?tab=` like the reference:
 *
 *   Company          name, logo (with its preview), the office, the rate.
 *   Departments      the 17 in scope; each opens Students filtered to it.
 *   Admins           who can invite and open Reports; add by email.
 *   AI               nudge mode, your voice, assistant access, the log.
 *   Product Configs  the proof-of-concept switches — experience mode, payer,
 *                    the SAMPLE ROSTER (off empties every page's roster, the
 *                    first-run office), and the local experiments.
 */

type Tab = 'company' | 'departments' | 'admins' | 'ai' | 'product-configs'
const TABS: [Tab, string][] = [
  ['company', 'Company'],
  ['departments', 'Departments'],
  ['admins', 'Admins'],
  ['ai', 'AI'],
  ['product-configs', 'Product Configs'],
]

export function XcelAdminSettingsPage() {
  const [params, setParams] = useSearchParams()
  const tab = (TABS.find(([t]) => t === params.get('tab'))?.[0] ?? 'company') as Tab
  const pick = (t: Tab) =>
    setParams(
      (p) => {
        const n = new URLSearchParams(p)
        if (t === 'company') n.delete('tab')
        else n.set('tab', t)
        return n
      },
      { replace: true },
    )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h2 style={PAGE_H1}>Settings · {TABS.find(([t]) => t === tab)![1]}</h2>
        <p style={PAGE_SUB}>
          Account settings for your office.{' '}
          <Link to={`${ADMIN_BASE}/notifications${window.location.search.replace(/[?&]tab=[^&]*/, '')}`} style={{ color: 'var(--admin-brand)', fontWeight: 600, textDecoration: 'none' }}>
            Notifications
          </Link>{' '}
          live in the main nav.
        </p>
      </div>
      <nav style={{ display: 'flex', gap: 20, borderBottom: '1px solid var(--admin-rule)' }}>
        {TABS.map(([t, label]) => (
          <button
            key={t}
            type="button"
            aria-pressed={tab === t}
            onClick={() => pick(t)}
            style={{ padding: '4px 4px 10px', border: 'none', background: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: -1, color: tab === t ? 'var(--admin-ink)' : 'var(--admin-text)', boxShadow: tab === t ? 'inset 0 -2px 0 var(--admin-ink)' : undefined }}
          >
            {label}
          </button>
        ))}
      </nav>
      {tab === 'company' ? <CompanyTab /> : tab === 'departments' ? <DepartmentsTab /> : tab === 'admins' ? <AdminsTab /> : tab === 'ai' ? <AiTab /> : <ProductTab />}
    </div>
  )
}

/* ── Company ────────────────────────────────────────────────────────────── */

function CompanyTab() {
  const { showToast } = useAdminStore()
  const [name, setName] = useState('Summitinsurancegroup')
  const [logo, setLogo] = useState('/brand/xcel-logo.webp')
  const [adminName, setAdminName] = useState('Eric')
  const [email, setEmail] = useState(ADMIN_EMAIL)
  const [home, setHome] = useState(ADMIN_USER.department)
  return (
    <>
      <Panel title="Company" sub="Name and logo used on invites and the progress report.">
        <div style={GRID2}>
          <Field label="Company name" value={name} onChange={setName} />
          <Field label="Logo URL" value={logo} onChange={setLogo} />
        </div>
        <div style={{ marginTop: 12, borderRadius: 10, background: 'var(--admin-fill-soft)', padding: '10px 12px' }}>
          <p style={{ ...FIELD_LABEL, marginBottom: 6 }}>Preview</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src={logo} alt="" style={{ height: 24, maxWidth: 120, objectFit: 'contain' }} onError={(e) => ((e.target as HTMLImageElement).style.visibility = 'hidden')} />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-ink)' }}>{name}</span>
          </div>
        </div>
      </Panel>
      <Panel title="Your office" sub="Admin contact and home department.">
        <div style={GRID2}>
          <Field label="Admin name" value={adminName} onChange={setAdminName} />
          <Field label="Admin email" value={email} onChange={setEmail} />
          <div>
            <label style={FIELD_LABEL} htmlFor="home-dept">
              Home department
            </label>
            <select id="home-dept" value={home} onChange={(e) => setHome(e.target.value)} style={INPUT}>
              {[ADMIN_USER.department, ...ADMIN_DEPARTMENTS].map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
      </Panel>
      <Panel title="Your rate">
        <p style={{ margin: 0, fontSize: 13, color: 'var(--admin-ink)' }}>20% off list, set by Farmers</p>
        <p style={{ margin: '2px 0 0', fontSize: 11.5, color: 'var(--admin-muted)' }}>Read only. Contracted rate is set by your CSM.</p>
      </Panel>
      <button type="button" onClick={() => showToast('Company saved')} className="cre-admin-brand" style={{ ...BUTTON_BRAND, alignSelf: 'flex-start', borderRadius: 8, fontSize: 13 }}>
        Save company
      </button>
    </>
  )
}

/* ── Departments ────────────────────────────────────────────────────────── */

function DepartmentsTab() {
  const { showToast } = useAdminStore()
  const [list, setList] = useState<{ name: string; lead: string; home?: boolean }[]>(() => [
    { name: ADMIN_USER.department, lead: 'Eric', home: true },
    ...[...ADMIN_DEPARTMENTS].sort().map((d) => ({ name: d, lead: d })),
  ])
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [lead, setLead] = useState('')
  const search = window.location.search.replace(/[?&]tab=[^&]*/, '')
  return (
    <Panel
      title="Departments"
      sub={`${list.length} departments in your scope. Leads get their own invite link.`}
      aside={
        <button type="button" onClick={() => setAdding(true)} style={{ ...BUTTON_OUTLINE, padding: '6px 12px', fontSize: 12 }}>
          Add department
        </button>
      }
    >
      <div style={{ marginTop: 4 }}>
        {list.map((d, i) => (
          <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderTop: i ? '1px solid var(--admin-fill)' : undefined }}>
            <div>
              <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: 'var(--admin-ink)' }}>{d.name}</p>
              <p style={{ margin: '1px 0 0', fontSize: 12, color: 'var(--admin-muted)' }}>
                {d.lead}
                {d.home ? ' · Home' : ''}
              </p>
            </div>
            <Link to={`${ADMIN_BASE}/students${search}${search ? '&' : '?'}department=${encodeURIComponent(d.name)}`} style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--admin-brand)', textDecoration: 'none' }}>
              Open filter
            </Link>
          </div>
        ))}
      </div>
      {adding ? (
        <AdminDialog
          title="Add department"
          subtitle="The lead gets their own invite link."
          onClose={() => setAdding(false)}
          footer={
            <>
              <button type="button" onClick={() => setAdding(false)} style={BUTTON_OUTLINE}>
                Cancel
              </button>
              <button
                type="button"
                disabled={!name.trim()}
                onClick={() => {
                  setList((l) => [...l, { name: name.trim(), lead: lead.trim() || name.trim() }])
                  showToast(`Department added · ${name.trim()}`)
                  setName('')
                  setLead('')
                  setAdding(false)
                }}
                style={{ ...BUTTON_BRAND, opacity: name.trim() ? 1 : 0.5 }}
              >
                Add
              </button>
            </>
          }
        >
          <Field label="Name" value={name} onChange={setName} />
          <Field label="Lead" value={lead} onChange={setLead} />
        </AdminDialog>
      ) : null}
    </Panel>
  )
}

/* ── Admins ─────────────────────────────────────────────────────────────── */

function AdminsTab() {
  const { showToast } = useAdminStore()
  const [admins, setAdmins] = useState<string[]>([])
  const [draft, setDraft] = useState('')
  const valid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(draft.trim())
  return (
    <Panel title="Admins" sub="People who can invite recruits and open Reports for this account. For full hierarchy, use Teams.">
      <div style={{ padding: '8px 0' }}>
        <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: 'var(--admin-ink)' }}>
          Eric <span style={{ ...PILL, marginLeft: 6, padding: '1px 6px', fontSize: 9, background: 'var(--admin-brand)', color: 'var(--admin-surface)' }}>YOU</span>
        </p>
        <p style={{ margin: '1px 0 0', fontSize: 12, color: 'var(--admin-muted)' }}>{ADMIN_EMAIL}</p>
      </div>
      {admins.map((a) => (
        <div key={a} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid var(--admin-fill)' }}>
          <span style={{ fontSize: 13, color: 'var(--admin-ink)' }}>{a}</span>
          <button type="button" onClick={() => setAdmins((l) => l.filter((x) => x !== a))} style={{ padding: 0, border: 'none', background: 'none', fontSize: 12, color: 'var(--admin-brand)', cursor: 'pointer' }}>
            Remove
          </button>
        </div>
      ))}
      <p style={{ ...FIELD_LABEL, marginTop: 12 }}>Add an admin</p>
      <div style={{ display: 'flex', gap: 8 }}>
        <input aria-label="Admin email" placeholder="name@company.com" value={draft} onChange={(e) => setDraft(e.target.value)} style={{ ...INPUT, flex: 1 }} />
        <button
          type="button"
          disabled={!valid}
          onClick={() => {
            setAdmins((l) => [...l, draft.trim()])
            showToast(`Admin invite sent to ${draft.trim()}`)
            setDraft('')
          }}
          style={{ ...BUTTON_BRAND, opacity: valid ? 1 : 0.5 }}
        >
          Add
        </button>
      </div>
    </Panel>
  )
}

/* ── AI ─────────────────────────────────────────────────────────────────── */

const AI_LOG = [
  { when: 'SEP 17 · 07:12', what: "Escalated Van Moss 'Open exam prep' to the Monday Brief · unapproved 3 days", tag: 'APPROVE' },
  { when: 'SEP 16 · 19:10', what: 'Sent SMS reminder to Yael Penn · never launched, 20 days · 2 of 3', tag: 'AUTO' },
  { when: 'SEP 16 · 07:00', what: 'Suggested exam date Oct 14 for Van Moss · cohort pattern', tag: 'INFO' },
  { when: 'SEP 15 · 09:41', what: 'Claude read roster and drafted 2 call scripts for Jordan Reyes', tag: 'ASSISTANT' },
  { when: 'SEP 14 · 07:01', what: "Drafted nudge for Zed Ross 'Pick up chapter 3' · quiet 14 days", tag: 'APPROVE' },
]

function AiTab() {
  const { showToast } = useAdminStore()
  const [mode, setMode] = useState<'Auto' | 'Approve' | 'Off'>('Approve')
  const [voice, setVoice] = useState('')
  const [claude, setClaude] = useState(true)
  const [chatgpt, setChatgpt] = useState(false)
  const modes: { id: 'Auto' | 'Approve' | 'Off'; text: string }[] = [
    { id: 'Auto', text: 'Sends reminders and nudges without asking. You see everything in the log and the brief.' },
    { id: 'Approve', text: 'Drafts everything, sends nothing until you tap Approve. Default for your first 30 days.' },
    { id: 'Off', text: 'The engine only writes the brief. You send everything yourself.' },
  ]
  return (
    <>
      <Panel title="Nudge mode" sub="How the engine reaches recruits in your name. Set per department; the default applies to new ones.">
        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
          {modes.map((m) => (
            <button
              key={m.id}
              type="button"
              aria-pressed={mode === m.id}
              onClick={() => {
                setMode(m.id)
                showToast(`Nudge mode · ${m.id}`)
              }}
              style={{ textAlign: 'left', borderRadius: 10, padding: 12, cursor: 'pointer', background: mode === m.id ? 'var(--admin-brand-tint)' : 'var(--admin-surface)', border: `1px solid ${mode === m.id ? 'var(--admin-brand)' : 'var(--admin-rule)'}` }}
            >
              <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--admin-ink)' }}>{m.id}</span>
              <span style={{ display: 'block', marginTop: 4, fontSize: 12, color: 'var(--admin-text)' }}>{m.text}</span>
            </button>
          ))}
        </div>
        <p style={{ margin: '10px 0 0', fontSize: 12, color: 'var(--admin-muted)' }}>
          {ADMIN_USER.department}: {mode} · Alexis Hinojosa: {mode} · Amber Ramirez: {mode} · 14 others: {mode}
        </p>
      </Panel>
      <Panel title="Your voice" sub="Paste two emails you have sent recruits. Nudges and scripts will match how you write. Nothing is stored beyond tone.">
        <textarea aria-label="Two emails you have sent" rows={4} value={voice} onChange={(e) => setVoice(e.target.value)} style={{ ...INPUT, resize: 'vertical' }} />
        <p style={{ margin: '6px 0 10px', fontSize: 12, color: 'var(--admin-muted)' }}>Detected: short, first names, one question at the end</p>
        <button type="button" onClick={() => showToast('Your voice is on for nudges and scripts')} style={{ ...BUTTON_OUTLINE, padding: '6px 12px', fontSize: 12 }}>
          Use my voice
        </button>
      </Panel>
      <Panel title="AI access" sub="Use XCEL Admin from the assistant you already have. Same permissions as your login; scoped to what you can see.">
        <Connection name="Claude" status={claude ? 'Connected · Jordan Reyes · last used today' : 'Not connected'} on={claude} onToggle={() => setClaude((v) => !v)} />
        <Connection name="ChatGPT" status={chatgpt ? 'Connected · just now' : 'Not connected'} on={chatgpt} onToggle={() => setChatgpt((v) => !v)} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: '1px solid var(--admin-fill)' }}>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--admin-ink)' }}>Any assistant (MCP)</p>
            <p style={{ margin: '1px 0 0', fontSize: 12, color: 'var(--admin-text)' }}>xcel.com/mcp/summitinsurancegroup</p>
            <p style={{ margin: '1px 0 0', fontSize: 11.5, color: 'var(--admin-muted)' }}>read roster, read recruit, draft nudge, draft call script · cannot send without Approve</p>
          </div>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText('https://xcel.com/mcp/summitinsurancegroup')
              showToast('Connection copied')
            }}
            style={{ ...BUTTON_OUTLINE, padding: '6px 12px', fontSize: 12 }}
          >
            Copy connection
          </button>
        </div>
        <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--admin-muted)' }}>Your assistant can never send a recruit anything your nudge mode would not allow.</p>
      </Panel>
      <Panel title="AI activity log" sub="Every automatic action with the signal that caused it.">
        {AI_LOG.map((e, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '8px 0', borderTop: i ? '1px solid var(--admin-fill)' : undefined }}>
            <span style={{ width: 110, flex: 'none', fontSize: 11, fontWeight: 600, color: 'var(--admin-muted)' }}>{e.when}</span>
            <span style={{ flex: 1, fontSize: 12.5, color: 'var(--admin-ink)' }}>{e.what}</span>
            <span style={{ ...PILL, fontSize: 9.5, letterSpacing: '0.06em', background: 'var(--admin-fill)', color: 'var(--admin-slate-700)' }}>{e.tag}</span>
          </div>
        ))}
      </Panel>
    </>
  )
}

function Connection({ name, status, on, onToggle }: { name: string; status: string; on: boolean; onToggle: () => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: '1px solid var(--admin-fill)' }}>
      <div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--admin-ink)' }}>{name}</p>
        <p style={{ margin: '1px 0 0', fontSize: 12, color: on ? 'var(--admin-success-ink)' : 'var(--admin-muted)' }}>{status}</p>
      </div>
      <button type="button" onClick={onToggle} style={on ? { ...BUTTON_OUTLINE, padding: '6px 12px', fontSize: 12 } : { ...BUTTON_BRAND, padding: '6px 12px', fontSize: 12 }}>
        {on ? 'Disconnect' : 'Connect'}
      </button>
    </div>
  )
}

/* ── Product Configs ────────────────────────────────────────────────────── */

const EXPERIMENTS = [
  ['Compare me to my peers', 'Department throughput vs company median. Internal demo only.', 'experiments.peerComparison'],
  ['Courtesy 3 day extension', 'One complimentary extension on an expiring recruit when the department is entitled.', 'experiments.courtesyExtension'],
  ['Bulk CSV enrollment', 'Prepaid bulk load in Invite. Off for the release; one Nicole customer uses it.', 'experiments.bulkCsvEnrollment'],
  ['Event QR', 'Adds an Event QR option on Invite. Default is recruiter QR only.', 'experiments.eventQr'],
  ['Copy for AI assistant', 'Adds a neutral copy action next to Export. Off by default. No third-party branding.', 'experiments.copyForAiAssistant'],
  ['Internal catalog console', 'Products, price table, and agreements. Read mostly.', 'internal.catalogConsole'],
  ['Internal ledger', 'Partner ledger of claims, withdraws, draws, and refunds.', 'internal.ledger'],
  ['Internal refund action', 'Refund on the recruit page. Refused if a completion record exists.', 'internal.refund'],
] as const

function ProductTab() {
  const { sampleRoster, setSampleRoster, showToast } = useAdminStore()
  const [mode, setMode] = useState<'QE' | 'CE'>('QE')
  const [portal, setPortal] = useState(true)
  const [payer, setPayer] = useState<'they' | 'agency'>('they')
  const [history, setHistory] = useState(false)
  const [flags, setFlags] = useState<Record<string, boolean>>({})
  return (
    <>
      <div style={{ ...CARD, borderRadius: 12, padding: '10px 14px', background: 'var(--admin-warn-tint)', borderColor: 'var(--admin-warn-edge)' }}>
        <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: 'var(--admin-ink)' }}>What is this?</p>
        <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--admin-text)' }}>Proof of concept context for this Enterprise Dashboard exploration.</p>
      </div>
      <Panel title="Admin Experience Mode" sub="Theme and retargets Students chips, Smart Search, Training Health, and nav for the sales channel.">
        <p style={{ ...FIELD_LABEL, marginBottom: 8 }}>Current: {mode} · XCEL Admin</p>
        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
          {(
            [
              ['QE', 'QE Focused', 'This product is focused on volume — getting learners to pass, and tracking visibility. Supervisors enroll through partner codes; departments replace locations and job roles.'],
              ['CE', 'CE Focused', 'Focused on course completion — making sure everyone completes assigned programs and meets requirements set by assignment rules.'],
            ] as const
          ).map(([id, title, text]) => (
            <button
              key={id}
              type="button"
              aria-pressed={mode === id}
              onClick={() => setMode(id)}
              style={{ textAlign: 'left', borderRadius: 10, padding: 12, cursor: 'pointer', background: mode === id ? 'var(--admin-brand-tint)' : 'var(--admin-surface)', border: `1px solid ${mode === id ? 'var(--admin-brand)' : 'var(--admin-rule)'}` }}
            >
              <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--admin-ink)' }}>{title}</span>
              <span style={{ display: 'block', marginTop: 4, fontSize: 12, color: 'var(--admin-text)' }}>{text}</span>
              {mode === id ? <span style={{ display: 'block', marginTop: 6, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--admin-brand)' }}>ACTIVE · XCEL EXPERIENCE</span> : null}
            </button>
          ))}
        </div>
      </Panel>
      <Panel title="Admin Portal" sub="Account switch. On is this portal. Off is catalog only. Standard and Premier are product tiers, not account packages.">
        <ToggleRow label={`Admin Portal: ${portal ? 'on' : 'off'}`} on={portal} onToggle={() => setPortal((v) => !v)} />
      </Panel>
      <Panel title="Payer" sub="Who pays when a recruit claims. Set here for the account. Hiring managers do not pick this on each invite.">
        <div style={{ display: 'flex', gap: 8 }}>
          {(
            [
              ['they', 'They pay'],
              ['agency', 'Your agency pays'],
            ] as const
          ).map(([id, label]) => (
            <button key={id} type="button" aria-pressed={payer === id} onClick={() => setPayer(id)} style={payer === id ? { ...BUTTON_BRAND, padding: '6px 14px', fontSize: 13 } : { ...BUTTON_OUTLINE, padding: '6px 14px', fontSize: 13 }}>
              {label}
            </button>
          ))}
        </div>
      </Panel>
      <Panel title="Legacy code (read only)" sub="Kept for migration. Recruits never see or type this.">
        <code style={{ fontSize: 12.5, color: 'var(--admin-ink)' }}>FARMERS-CODY-DEPARTMENT</code>
      </Panel>
      <Panel title="Sample roster" sub="On fills Students across filters with demo recruits so you can walk the pipeline. Off is the empty first-run office.">
        <ToggleRow
          label="Sample roster"
          on={sampleRoster}
          onToggle={() => {
            setSampleRoster(!sampleRoster)
            showToast(sampleRoster ? 'Sample roster off · the empty first-run office' : 'Sample roster on')
          }}
        />
      </Panel>
      <Panel title="3-year licensed history" sub="Adds 5,200 licensed alumni across three years so the Licensed card time window is visible. Keep sample roster on to see the active pipeline beside them.">
        <ToggleRow label="Licensed history mock" on={history} onToggle={() => setHistory((v) => !v)} />
      </Panel>
      <Panel title="Local experiments" sub="Feature flags for product experiments. Flagsmith-shaped keys for this POC. Default off. Status is from the flag registry.">
        {EXPERIMENTS.map(([name, text, key], i) => (
          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderTop: i ? '1px solid var(--admin-fill)' : undefined }}>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--admin-ink)' }}>{name}</p>
              <p style={{ margin: '1px 0 0', fontSize: 12, color: 'var(--admin-text)' }}>{text}</p>
              <p style={{ margin: '2px 0 0', fontSize: 11, fontFamily: 'ui-monospace, monospace', color: 'var(--admin-muted)' }}>{key}</p>
              <p style={{ margin: '2px 0 0', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--admin-faint)' }}>EXPERIMENT · REVIEW 2026-12-17 · PORTAL-POC</p>
            </div>
            <Switch on={!!flags[key]} onToggle={() => setFlags((f) => ({ ...f, [key]: !f[key] }))} label={name} />
          </div>
        ))}
      </Panel>
      <Panel title="Account onboarding" sub="Onboarding is not finished yet. Reset clears any answers you have started.">
        <button type="button" onClick={() => showToast('Onboarding reset')} style={{ ...BUTTON_OUTLINE, padding: '6px 12px', fontSize: 12 }}>
          Reset onboarding
        </button>
      </Panel>
    </>
  )
}

/* ── Pieces ─────────────────────────────────────────────────────────────── */

function Panel({ title, sub, aside, children }: { title: string; sub?: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section style={{ ...CARD, borderRadius: 12, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--admin-ink)' }}>{title}</h3>
          {sub ? <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--admin-text)' }}>{sub}</p> : null}
        </div>
        {aside}
      </div>
      {children}
    </section>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const id = `f-${label.replace(/\W+/g, '-').toLowerCase()}`
  return (
    <div>
      <label style={FIELD_LABEL} htmlFor={id}>
        {label}
      </label>
      <input id={id} value={value} onChange={(e) => onChange(e.target.value)} style={{ ...INPUT, borderRadius: 8 }} />
    </div>
  )
}

function ToggleRow({ label, on, onToggle }: { label: string; on: boolean; onToggle: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Switch on={on} onToggle={onToggle} label={label} />
      <span style={{ fontSize: 13, color: 'var(--admin-ink)' }}>{label}</span>
    </div>
  )
}

function Switch({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={onToggle} style={{ ...SWITCH, background: on ? 'var(--admin-brand)' : 'var(--admin-rule-strong)' }}>
      <span style={{ ...KNOB, left: on ? 18 : 2 }} />
    </button>
  )
}

const GRID2: CSSProperties = { display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }
const SWITCH: CSSProperties = { position: 'relative', flex: 'none', width: 36, height: 20, border: 'none', borderRadius: 9999, padding: 0, cursor: 'pointer' }
const KNOB: CSSProperties = { position: 'absolute', top: 2, width: 16, height: 16, borderRadius: '50%', background: 'var(--admin-surface)', boxShadow: '0 1px 2px rgb(0 0 0 / 0.2)', transition: 'left 120ms ease' }
