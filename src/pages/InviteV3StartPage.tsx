import { useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import {
  INVITE_FLOWS_V3,
  INVITE_V3_CART_FLAG,
  INVITE_V3_EMAIL_ACCOUNT_FLAG,
  INVITE_V3_FLOW_FLAGS,
  INVITE_V3_MODEL_FLAG,
  V3_B2C_CART,
  entryPathV3,
  type InviteFlowV3,
  type InviteModelId,
} from '@/data/inviteFlowsV3'
import { INVITE_FLOW_VERSION_FLAG } from '@/data/inviteFlowVersions'
import { INVITE_LOA_PARAM, INVITE_STATE_PARAM } from '@/data/inviteMissingDetails'
import { CART_PACKAGE_PARAM } from '@/data/xcelCourseFinder'
import './inviteFlow.css'

/**
 * THE INVITE FLOW, ON ITS OWN — `/invite-v3`, 2026-11-17 (Afsana, at Jill's
 * ask: "you are sharing a feature, the pages the dev needs; everything else
 * in that link should be stripped out").
 *
 * The link a Jira ticket carries for V3's invite and purchase flow. A Design
 * row opens the whole product at `/dashboard-rebrand`; this opens only the
 * flow: one Start per V3 flow, each walking the flow's own pages with no Hub
 * bar, no demo or design controls (`?chrome=off`), and stopping on Setting up
 * your account rather than going on into Atlas Home (`?standalone=1`, read in
 * `InvitedConfirmationPageV3`).
 *
 * ⚠ THE ROWS ARE `INVITE_FLOWS_V3`, NOT A COPY OF IT — a flow added or
 * renamed there appears here with nothing to keep in step. The only choices
 * this page adds are the two the flows branch on and the Design bar would
 * otherwise set: whose email it is, and (B2C) what is in the cart.
 */
export function InviteV3StartPage() {
  const b2b = INVITE_FLOWS_V3.filter((f) => f.model === 'b2b')
  const b2c = INVITE_FLOWS_V3.filter((f) => f.model === 'b2c')
  return (
    <div style={PAGE}>
      <main style={COLUMN}>
        <img src="/brand/xcel-logo.webp" alt="XCEL Insurance Training by Colibri" style={LOGO} />
        <header style={{ display: 'grid', gap: 8 }}>
          <h1 style={TITLE}>Invite &amp; purchase flow</h1>
          <p style={LEAD}>
            Pick a flow and start it. Each one runs the flow’s own pages, from the invitation to Setting up your
            account, and stops there.
          </p>
        </header>
        <FlowGroup title="Partner invites (B2B2C)" flows={b2b} />
        <FlowGroup title="Public site (B2C)" flows={b2c} />
      </main>
    </div>
  )
}

function FlowGroup({ title, flows }: { title: string; flows: InviteFlowV3[] }) {
  return (
    <section style={{ display: 'grid', gap: 12 }} aria-label={title}>
      <h2 style={GROUP}>{title}</h2>
      {flows.map((flow) => (
        <FlowRow key={flow.id} flow={flow} />
      ))}
    </section>
  )
}

/* Which flows branch on whose email it is — every one since QR Code took
   over the three QR flows (2026-11-17), kept as a list so a flow that
   decides it itself can still say so. */
const ASKS_ACCOUNT: ReadonlySet<string> = new Set(['direct-email', 'qr', 'xcel-signed-in', 'xcel-signed-out'])

const CARTS = [
  { value: 'targeted', label: 'Targeted only' },
  { value: 'mixed', label: 'Mixed' },
  { value: 'none', label: 'None targeted' },
] as const

function FlowRow({ flow }: { flow: InviteFlowV3 }) {
  const [cart, setCart] = useState<string>('targeted')
  const b2c = flow.model === 'b2c'
  const starts = ASKS_ACCOUNT.has(flow.id)
    ? [
        { label: 'No Atlas account', account: 'no-atlas' },
        { label: 'Has Atlas account', account: 'atlas' },
      ]
    : [{ label: 'Start', account: null }]
  return (
    <article style={ROW}>
      <div style={{ display: 'grid', gap: 4, minWidth: 0 }}>
        <h3 style={ROW_TITLE}>{flow.label}</h3>
        <p style={ROW_TEXT}>{flow.description}</p>
      </div>
      <div style={ACTIONS}>
        {b2c ? (
          <label style={CART_LABEL}>
            Cart
            <select value={cart} onChange={(e) => setCart(e.target.value)} style={SELECT}>
              {CARTS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {starts.map((s) => (
          <Link key={s.label} to={startHref(flow, s.account, b2c ? cart : null)} className="cre-e2e-cta" style={START}>
            {s.label}
          </Link>
        ))}
      </div>
    </article>
  )
}

/** The flow's first page, with the flags the Design bar would have set and
 *  the two switches that keep the walk to the flow's own pages. */
function startHref(flow: InviteFlowV3, account: string | null, cart: string | null): string {
  const model: InviteModelId = flow.model
  const ff = [
    `${INVITE_FLOW_VERSION_FLAG}:v3`,
    `${INVITE_V3_MODEL_FLAG}:${model}`,
    `${INVITE_V3_FLOW_FLAGS[model]}:${flow.id}`,
    ...(account ? [`${INVITE_V3_EMAIL_ACCOUNT_FLAG}:${account}`] : []),
    ...(cart ? [`${INVITE_V3_CART_FLAG}:${cart}`] : []),
  ]
  const params = new URLSearchParams({ demo: '1', chrome: 'off', standalone: '1', ff: ff.join(',') })
  const path = entryPathV3(flow)
  /* A walk that starts at the cart needs something in it — the file's
     Arizona Health Premier, as `fillV3Cart` gives the full prototype. */
  if (path === '/end-to-end-demo/cart') {
    params.set(INVITE_STATE_PARAM, V3_B2C_CART.lstate)
    params.set(INVITE_LOA_PARAM, V3_B2C_CART.loa)
    params.set(CART_PACKAGE_PARAM, V3_B2C_CART.pkg)
  }
  return `${path}?${params.toString()}`
}

const PAGE: CSSProperties = {
  minHeight: '100vh',
  background: 'var(--color-e2e-field)',
  fontFamily: 'var(--font-e2e-avenir)',
  color: 'var(--color-text-primary)',
  padding: '48px 16px',
  boxSizing: 'border-box',
}

const COLUMN: CSSProperties = { maxWidth: 760, margin: '0 auto', display: 'grid', gap: 32 }

const LOGO: CSSProperties = { display: 'block', width: 132, height: 42, objectFit: 'contain' }

const TITLE: CSSProperties = { margin: 0, fontSize: 28, lineHeight: '34px', fontWeight: 800 }

const LEAD: CSSProperties = { margin: 0, fontSize: 15, lineHeight: '22px', color: 'var(--color-text-secondary)' }

const GROUP: CSSProperties = {
  margin: 0,
  fontSize: 13,
  lineHeight: '18px',
  fontWeight: 800,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--color-text-secondary)',
}

const ROW: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
  padding: '18px 20px',
  background: 'var(--color-fixed-light)',
  border: '1px solid var(--color-e2e-card-outline)',
  borderRadius: 12,
}

const ROW_TITLE: CSSProperties = { margin: 0, fontSize: 16, lineHeight: '22px', fontWeight: 800 }

const ROW_TEXT: CSSProperties = {
  margin: 0,
  fontSize: 13,
  lineHeight: '18px',
  color: 'var(--color-text-secondary)',
  maxWidth: 420,
}

const ACTIONS: CSSProperties = { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }

const START: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: 40,
  padding: '0 16px',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 800,
  textDecoration: 'none',
  whiteSpace: 'nowrap',
}

const CART_LABEL: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 13,
  color: 'var(--color-text-secondary)',
}

const SELECT: CSSProperties = {
  minHeight: 40,
  padding: '0 10px',
  borderRadius: 8,
  border: '1px solid var(--color-e2e-card-outline)',
  background: 'var(--color-e2e-field)',
  fontFamily: 'inherit',
  fontSize: 14,
  color: 'var(--color-text-primary)',
}
