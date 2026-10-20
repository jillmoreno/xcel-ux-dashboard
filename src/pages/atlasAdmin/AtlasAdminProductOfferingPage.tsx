import { useState, type CSSProperties, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from '@/icons'
import { ADMIN_BASE, companySlug, useAdminStore } from './adminStore'
import { BUTTON_BRAND, CARD, FIELD_LABEL, HEADING, INPUT, PILL } from './adminStyles'

/**
 * ATLAS ADMIN — PRODUCT OFFERING (2026-10-20). The reference's
 * /product-offering: the org's contract read back from Salesforce — the
 * company label that prefixes every department invite URL (editable), a
 * price list by state and line of business at the agreed discount
 * (read-only), and the sales rep to call.
 *
 * The label is the store's, so Organization → Share invite copies a link
 * that starts with whatever is saved here. List prices are invented, from a
 * per-line base and a per-state step, at the 20% Settings shows as "Your
 * rate". Jordan Lee is invented, as the reference's is.
 */

const STATES: [string, string][] = [
  ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'], ['CA', 'California'], ['CO', 'Colorado'], ['CT', 'Connecticut'], ['DE', 'Delaware'],
  ['DC', 'District of Columbia'], ['FL', 'Florida'], ['GA', 'Georgia'], ['HI', 'Hawaii'], ['ID', 'Idaho'], ['IL', 'Illinois'], ['IN', 'Indiana'], ['IA', 'Iowa'],
  ['KS', 'Kansas'], ['KY', 'Kentucky'], ['LA', 'Louisiana'], ['ME', 'Maine'], ['MD', 'Maryland'], ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'],
  ['MS', 'Mississippi'], ['MO', 'Missouri'], ['MT', 'Montana'], ['NE', 'Nebraska'], ['NV', 'Nevada'], ['NH', 'New Hampshire'], ['NJ', 'New Jersey'], ['NM', 'New Mexico'],
  ['NY', 'New York'], ['NC', 'North Carolina'], ['ND', 'North Dakota'], ['OH', 'Ohio'], ['OK', 'Oklahoma'], ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'],
  ['SC', 'South Carolina'], ['SD', 'South Dakota'], ['TN', 'Tennessee'], ['TX', 'Texas'], ['UT', 'Utah'], ['VT', 'Vermont'], ['VA', 'Virginia'], ['WA', 'Washington'],
  ['WV', 'West Virginia'], ['WI', 'Wisconsin'], ['WY', 'Wyoming'],
]

const LINES: [string, string, number][] = [
  ['life', 'Life', 249],
  ['health', 'Health', 249],
  ['lh', 'Life & Health', 399],
  ['pc', 'Property & Casualty', 359],
  ['personal', 'Personal Lines', 299],
]

const DISCOUNT = 20
const REP = { name: 'Jordan Lee', email: 'jordan.lee@xcelsolutions.example.com', phone: '555-0142' }

function listPrice(state: string, line: string) {
  const base = LINES.find(([k]) => k === line)![2]
  const i = STATES.findIndex(([c]) => c === state)
  return base + ((i * 7) % 6) * 10
}

export function AtlasAdminProductOfferingPage() {
  const { companyLabel, setCompanyLabel, showToast } = useAdminStore()
  const [label, setLabel] = useState(companyLabel)
  const [state, setState] = useState('NY')
  const [line, setLine] = useState('lh')
  const list = listPrice(state, line)
  const net = Math.round(list * (1 - DISCOUNT / 100))
  const lineName = LINES.find(([k]) => k === line)![1]

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16, padding: '16px 0' }}>
      <Link to={`${ADMIN_BASE}/students${window.location.search}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--admin-brand)', textDecoration: 'none' }}>
        <ArrowLeft size={11} aria-hidden /> Back to Students
      </Link>
      <div>
        <h1 style={{ margin: 0, fontFamily: HEADING, fontSize: 22, fontWeight: 700, color: 'var(--admin-ink)' }}>Product offering</h1>
        <p style={{ margin: '6px 0 0', fontSize: 13, lineHeight: 1.5, color: 'var(--admin-text)' }}>Your contract, read from Salesforce. Buyers see this price when they open a department invite — not a partner microsite. Discount and sales rep are read-only.</p>
      </div>

      <Section title="Company & URL prefix">
        <label>
          <span style={{ ...FIELD_LABEL, textTransform: 'none', letterSpacing: 0, fontSize: 12, fontWeight: 600 }}>Company name (public label)</span>
          <input value={label} onChange={(e) => setLabel(e.target.value)} style={INPUT} />
        </label>
        <p style={{ margin: 0, fontSize: 11, color: 'var(--admin-muted)' }}>
          Invite URLs start with <code style={{ color: 'var(--admin-ink)' }}>{`${window.location.origin}/invite/${companySlug(label) || '…'}/…`}</code>
        </p>
      </Section>

      <Section title="Salesforce price list" sub="Pick state and line of business to preview contracted pricing. Admins cannot change the discount.">
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
          <label>
            <span style={FIELD_LABEL}>State</span>
            <select value={state} onChange={(e) => setState(e.target.value)} style={INPUT}>
              {STATES.map(([c, n]) => (
                <option key={c} value={c}>
                  {c} · {n}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span style={FIELD_LABEL}>Line of business</span>
            <select value={line} onChange={(e) => setLine(e.target.value)} style={INPUT}>
              {LINES.map(([k, n]) => (
                <option key={k} value={k}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div style={{ padding: 12, borderRadius: 10, border: '1px solid var(--admin-rule)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <strong style={{ fontSize: 13, color: 'var(--admin-ink)' }}>
              {state} · {lineName} Pre-Licensing
            </strong>
            <span style={{ ...PILL, fontSize: 10, background: 'var(--admin-fill)', color: 'var(--admin-chart-blue)' }}>{DISCOUNT}% off</span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 13 }}>
            <s style={{ color: 'var(--admin-faint)' }}>${list}</s> <strong style={{ color: 'var(--admin-ink)' }}>${net}</strong> <span style={{ fontSize: 11, color: 'var(--admin-muted)' }}>(Salesforce contract)</span>
          </p>
        </div>
        <p style={{ margin: 0, fontSize: 11, color: 'var(--admin-muted)' }}>
          Sales rep (read-only): {REP.name} · {REP.email} · {REP.phone}. Call if you need handholding.
        </p>
      </Section>

      <Section title="Agreed discount" sub="Set on the Salesforce contract when the agency signed. Not editable here — including no 100% off control.">
        <strong style={{ fontSize: 13, color: 'var(--admin-ink)' }}>{DISCOUNT}% off list for this state + line</strong>
      </Section>

      <Section title="Sales rep contact" sub="Read-only. Shown if an admin or buyer needs handholding.">
        <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, margin: 0 }}>
          {[
            ['Name', REP.name],
            ['Email', REP.email],
            ['Phone', REP.phone],
          ].map(([k, v]) => (
            <div key={k}>
              <dt style={{ ...FIELD_LABEL, marginBottom: 2 }}>{k}</dt>
              <dd style={{ margin: 0, fontSize: 13, color: 'var(--admin-ink)' }}>{v}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <button
        type="button"
        disabled={!label.trim() || label.trim() === companyLabel}
        onClick={() => {
          setCompanyLabel(label.trim())
          showToast('Company label saved — new invite links use it')
        }}
        style={{ ...BUTTON_BRAND, alignSelf: 'flex-start', opacity: !label.trim() || label.trim() === companyLabel ? 0.5 : 1 }}
      >
        Save company label
      </button>
    </div>
  )
}

function Section({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <section style={{ ...CARD, borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <h2 style={H2}>{title}</h2>
        {sub ? <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--admin-text)' }}>{sub}</p> : null}
      </div>
      {children}
    </section>
  )
}

const H2: CSSProperties = { margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--admin-ink)' }
