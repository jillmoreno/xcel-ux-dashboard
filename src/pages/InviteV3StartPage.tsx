import { useState, type CSSProperties } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PillTabs } from '@/components/ui/PillTabs'
import { ArrowUpRightFromSquare, ChevronDown } from '@/icons'
import { FEATURE_FLAGS } from '@/context/FeatureFlagContext'
import {
  INVITE_FLOWS_V3,
  INVITE_V3_CART_FLAG,
  INVITE_V3_EMAIL_ACCOUNT_FLAG,
  INVITE_V3_FLOW_FLAGS,
  INVITE_V3_LOG_IN_ACCOUNT_FLAG,
  INVITE_V3_MODEL_FLAG,
  V3_B2C_CART,
  entryPathV3,
  type InviteFlowV3,
  type InviteModelId,
} from '@/data/inviteFlowsV3'
import { INVITE_FLOW_VERSION_FLAG } from '@/data/inviteFlowVersions'
import { INVITE_LOA_PARAM, INVITE_STATE_PARAM } from '@/data/inviteMissingDetails'
import { CART_PACKAGE_PARAM } from '@/data/xcelCourseFinder'
import { InviteV3ScreensGallery } from './InviteV3ScreensGallery'
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
 * otherwise set: whose email it is, and (B2C) what is in the cart. And
 * (B2B2C, 2026-11-18) which Products option Eric's product page shows — the
 * Design bar's `pdp-products`, read off the catalog so the two lists agree.
 *
 * TWO TABS SINCE 2026-11-18 — Flows (the Starts) and Screens (a picture of
 * every screen, modal and state, `InviteV3ScreensGallery`). The tab is in the
 * address (`?tab=screens`) so a ticket can link straight to the pictures.
 */
type Tab = 'flows' | 'screens'
const TABS: { id: Tab; label: string }[] = [
  { id: 'flows', label: 'Flows' },
  { id: 'screens', label: 'Screens' },
]

export function InviteV3StartPage() {
  const [params, setParams] = useSearchParams()
  const tab: Tab = params.get('tab') === 'screens' ? 'screens' : 'flows'
  const b2b = INVITE_FLOWS_V3.filter((f) => f.model === 'b2b')
  /* Not signed in first, then signed in (2026-11-18, Afsana), then Log In
     (2026-11-20) — this page's order only; the Design bar keeps the
     catalog's. */
  const b2c = INVITE_FLOWS_V3.filter((f) => f.model === 'b2c').sort(
    (a, b) => b2cOrder(a.id) - b2cOrder(b.id),
  )
  return (
    <div style={PAGE}>
      <main style={tab === 'screens' ? { ...COLUMN, maxWidth: 1120 } : COLUMN}>
        <img src="/brand/xcel-logo.webp" alt="XCEL Insurance Training by Colibri" style={LOGO} />
        <header style={{ display: 'grid', gap: 8 }}>
          <h1 style={TITLE}>Invite &amp; purchase flow</h1>
          <p style={LEAD}>
            {tab === 'flows'
              ? 'Pick a flow and start it. Each one runs the flow’s own pages, from the invitation to Setting up your account, and stops there.'
              : 'Each component and its states, once, with the flows that use it — then the pages. Click one to see it full size.'}
          </p>
        </header>
        {/* The whole prototype, with its Hub bar and design controls — every
            flow in one place (2026-11-18, Afsana) — on both tabs. */}
        <p style={PROTOTYPE_NOTE}>
          To access the prototype that captures all of these flows, click{' '}
          <a href={FULL_PROTOTYPE} target="_blank" rel="noopener noreferrer" style={PROTOTYPE_LINK}>
            here
          </a>
          . Reach out to Afsana if you have any questions.
        </p>
        <div>
          <PillTabs
            label="View"
            items={TABS}
            active={tab}
            onChange={(id) => {
              const next = new URLSearchParams(params)
              if (id === 'screens') next.set('tab', 'screens')
              else next.delete('tab')
              setParams(next, { replace: true })
            }}
          />
        </div>
        {tab === 'flows' ? (
          <>
            <FlowGroup title="Partner invites (B2B2C)" flows={b2b} />
            <FlowGroup title="Public site (B2C)" flows={b2c} />
          </>
        ) : (
          <InviteV3ScreensGallery />
        )}
      </main>
    </div>
  )
}

function b2cOrder(id: string): number {
  return id === 'xcel-log-in' ? 2 : id === 'xcel-signed-in' ? 1 : 0
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

/* This page's own subtext, one line each (2026-11-18, Afsana). The catalog's
   longer descriptions stay on the Design bar. */
const SUBTEXT: Readonly<Record<string, string>> = {
  'direct-email': 'User receives an email invitation from an XCEL partner.',
  qr: 'User scans an XCEL partner’s QR code.',
  'xcel-signed-out': 'User is not signed into XCEL and wants to make a purchase.',
  'xcel-signed-in': 'User is signed into XCEL and wants to make a purchase.',
  'xcel-log-in': 'User has an account and presses Log In. The log-in page sends them to Atlas or OCD.',
}

/* Log In's starts, by where the account is (`invite-v3-log-in-account`) —
   2026-11-20. Its walk starts on the cart but buys nothing, so no Cart. */
const LOG_IN_STARTS = [
  { label: 'Atlas account', account: 'atlas' },
  { label: 'OCD account', account: 'ocd' },
  { label: 'No account', account: 'none' },
] as const

const PRODUCTS_FLAG = FEATURE_FLAGS.find((f) => f.key === 'pdp-products')
/* Without Multi-product (Old) — this page only; the Design bar keeps it
   (2026-11-18, Afsana). */
const PRODUCTS = (PRODUCTS_FLAG?.variants ?? []).filter((v) => v.value !== 'multi')

function FlowRow({ flow }: { flow: InviteFlowV3 }) {
  const [cart, setCart] = useState<string>('targeted')
  const [product, setProduct] = useState<string>(PRODUCTS_FLAG?.defaultVariant ?? 'standard')
  const logIn = flow.id === 'xcel-log-in'
  const b2c = flow.model === 'b2c'
  const starts = logIn
    ? LOG_IN_STARTS
    : ASKS_ACCOUNT.has(flow.id)
    ? [
        { label: 'No Atlas account', account: 'no-atlas' },
        { label: 'Has Atlas account', account: 'atlas' },
      ]
    : [{ label: 'Start', account: null }]
  return (
    <article style={ROW}>
      <div style={{ display: 'grid', gap: 4, minWidth: 0 }}>
        <h3 style={ROW_TITLE}>{flow.label}</h3>
        <p style={ROW_TEXT}>{SUBTEXT[flow.id] ?? flow.description}</p>
      </div>
      <div style={ACTIONS}>
        {logIn ? null : b2c ? (
          <label style={CART_LABEL}>
            Cart
            <Dropdown value={cart} onChange={setCart} options={CARTS} />
          </label>
        ) : PRODUCTS.length > 0 ? (
          <label style={CART_LABEL}>
            Products
            <Dropdown value={product} onChange={setProduct} options={PRODUCTS} />
          </label>
        ) : null}
        {starts.map((s) => (
          /* Secondary, and in a new tab so this page stays open to start the
             next one (2026-11-18, Afsana). The hover is `.cre-v3-start` in
             inviteFlow.css. */
          <Link
            key={s.label}
            /* No cart for Log In — it buys nothing (2026-11-20). */
            to={startHref(flow, s.account, b2c && !logIn ? cart : null, b2c ? null : product)}
            target="_blank"
            rel="noopener noreferrer"
            className="cre-v3-start"
            style={START}
          >
            {s.label}
            <ArrowUpRightFromSquare size={13} aria-hidden />
            <span style={VISUALLY_HIDDEN}> (opens in a new tab)</span>
          </Link>
        ))}
      </div>
    </article>
  )
}

/** Cart and Products. Our own chevron, 12px in from the right like the
 *  text is from the left — the browser's arrow sat against the edge
 *  (2026-11-18, Afsana). */
function Dropdown({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (value: string) => void
  options: readonly { value: string; label: string }[]
}) {
  return (
    <span style={{ position: 'relative', display: 'inline-flex' }}>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={SELECT}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={14} aria-hidden style={SELECT_CHEVRON} />
    </span>
  )
}

/** The flow's first page, with the flags the Design bar would have set and
 *  the two switches that keep the walk to the flow's own pages. */
function startHref(flow: InviteFlowV3, account: string | null, cart: string | null, product: string | null): string {
  const model: InviteModelId = flow.model
  const ff = [
    `${INVITE_FLOW_VERSION_FLAG}:v3`,
    `${INVITE_V3_MODEL_FLAG}:${model}`,
    `${INVITE_V3_FLOW_FLAGS[model]}:${flow.id}`,
    ...(account
      ? [`${flow.id === 'xcel-log-in' ? INVITE_V3_LOG_IN_ACCOUNT_FLAG : INVITE_V3_EMAIL_ACCOUNT_FLAG}:${account}`]
      : []),
    ...(cart ? [`${INVITE_V3_CART_FLAG}:${cart}`] : []),
    ...(product ? [`pdp-products:${product}`] : []),
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

/* The branch build's address, in full (2026-11-18, Afsana). */
const FULL_PROTOTYPE = 'https://feat-invite-flow-v3--ux-design-xceldashboard.netlify.app/end-to-end-demo/email?demo=1&version=jill-atlas-main'

const PROTOTYPE_NOTE: CSSProperties = {
  margin: 0,
  padding: '14px 16px',
  fontSize: 15,
  lineHeight: '22px',
  background: 'var(--color-fixed-light)',
  border: '1px solid var(--color-e2e-card-outline)',
  borderRadius: 8,
}

const PROTOTYPE_LINK: CSSProperties = {
  color: 'var(--color-xcel-brick-600)',
  fontWeight: 800,
  textDecoration: 'underline',
}

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

/* Buttons always under the text — 2026-11-18, Afsana: Direct Email's short
   description let them sit on the right, unlike every other row. */
const ROW: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
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
  gap: 8,
  minHeight: 40,
  padding: '0 16px',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 800,
  textDecoration: 'none',
  whiteSpace: 'nowrap',
}

const SELECT_CHEVRON: CSSProperties = {
  position: 'absolute',
  right: 12,
  top: '50%',
  transform: 'translateY(-50%)',
  color: 'var(--color-text-primary)',
  pointerEvents: 'none',
}

const VISUALLY_HIDDEN: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
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
  appearance: 'none',
  minHeight: 40,
  padding: '0 36px 0 12px',
  cursor: 'pointer',
  borderRadius: 8,
  border: '1px solid var(--color-e2e-card-outline)',
  background: 'var(--color-e2e-field)',
  fontFamily: 'inherit',
  fontSize: 14,
  color: 'var(--color-text-primary)',
}
