import { useSearchParams } from 'react-router-dom'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import type { InviteFlowId } from './inviteFlows'
import { INVITE_FLOW_VERSION_FLAG, resolveInviteFlowVersion } from './inviteFlowVersions'
import { ALL_US_STATES } from './licensedStatesFixtures'

/**
 * INVITE FLOW V3'S FLOWS, BY MODEL TYPE — 2026-10-30, Afsana: "each flow is
 * split by model type (e.g., b2b, b2c). once model type is selected, then flow
 * is available."
 *
 * Source: `xcel-b2b2c-email-flow.html` (Afsana's local prototype, the newer of
 * the two in her Checkout Flow folder). Its `FLOWS` list is the eight rows
 * below, with the same ids, labels, models and screen orders.
 *
 * ⚠ V3 ONLY. V1 and V2 keep `invite-flow-journey` and its six flows, untouched.
 * On V3 that control is not shown; these three are, instead:
 *
 *   invite-v3-model       B2B or B2C
 *   invite-v3-flow-b2b    the four B2B flows
 *   invite-v3-flow-b2c    the four B2C flows
 *
 * ⚠ ONE FLOW CONTROL PER MODEL, AND THAT IS HOW THE PICKER FILTERS. The Design
 * bar is protected chrome and draws a flag's variants as given, so it cannot
 * narrow one list by another. What it CAN do is show only the controls that
 * name the surface on screen — so `InviteSurfaceSync` declares
 * `invite:v3-b2b` or `invite:v3-b2c` from the chosen model, and each flow flag
 * names one. Each model also remembers its own flow when you switch back.
 *
 * ⚠ `base` IS A STAND-IN UNTIL EACH FLOW'S SCREENS ARE BUILT. The V3 pages are
 * a fork of V2 and answer V2's predicates (`inviteFlows.ts`), so every V3 flow
 * borrows the nearest V2 flow for now: B2B's QR flows walk as `qr-social`,
 * B2C's as `b2c-guest`. `useInviteFlow` returns that base on V3, so the pages
 * need no change yet. `screens` is the file's order, kept as the build list.
 */

export type InviteModelId = 'b2b' | 'b2c'

export type InviteFlowV3Id =
  | 'qr-net-new'
  | 'qr-ocd'
  | 'qr-atlas-login'
  | 'qr-atlas-auto'
  | 'net-new'
  | 'ocd-no-atlas'
  | 'has-atlas-login'
  | 'has-atlas'
  | 'xcel-signed-in'

export type InviteFlowV3 = {
  id: InviteFlowV3Id
  model: InviteModelId
  label: string
  description: string
  base: InviteFlowId
  screens: string[]
}

export const INVITE_MODELS: { id: InviteModelId; label: string; description: string }[] = [
  { id: 'b2b', label: 'B2B invite', description: 'A partner’s QR code. Partner pricing; the learner proves their email by code.' },
  { id: 'b2c', label: 'B2C guest', description: 'Direct from the public site’s cart. No partner.' },
]

const QR_START = ['qr', 'variation-4', 'variation-4-filled', 'pdp']
const CART_START = ['cart', 'pc-modal']
const VERIFY = ['verify-1', 'verify-2']
const CODE = ['code-1', 'code-2']
const CHECKOUT = ['checkout-1b', 'checkout-2', 'checkout-3']
const NEW_PASSWORD = ['create-password', 'create-password-filled']

export const INVITE_FLOWS_V3: InviteFlowV3[] = [
  {
    id: 'qr-net-new',
    model: 'b2b',
    label: 'QR: Net New: No OCD, No Atlas',
    description: 'New to XCEL. Verify email by code, full checkout, then create a password.',
    base: 'qr-social',
    screens: [...QR_START, ...VERIFY, ...CODE, 'checkout-1', ...CHECKOUT, 'placing', ...NEW_PASSWORD],
  },
  {
    id: 'qr-ocd',
    model: 'b2b',
    label: 'QR: OCD, but no Atlas',
    description: 'Has an OCD account, no Atlas. Same screens as Net New for now.',
    base: 'qr-social',
    screens: [...QR_START, ...VERIFY, ...CODE, 'checkout-1', ...CHECKOUT, 'placing', ...NEW_PASSWORD],
  },
  {
    id: 'qr-atlas-login',
    model: 'b2b',
    label: 'QR: Has Atlas: Open Log-In Widget',
    description: 'Already on Atlas. Email check opens a log-in widget; ends ready to log in.',
    base: 'qr-social',
    screens: [...QR_START, 'verify-login-1', 'verify-login-2', 'login-1', 'login-2', 'signing-in', ...CHECKOUT, 'placing', 'ready-login'],
  },
  {
    id: 'qr-atlas-auto',
    model: 'b2b',
    label: 'QR: Has Atlas: Automatic Sign-in Post OTP',
    description: 'Already on Atlas. Logs in, then signed in automatically with the checkout filled.',
    base: 'qr-social',
    /* ⚠ LOG-IN, NOT A CODE — 2026-10-30, Afsana: the two automatic flows "are
       supposed to let them log in, and then sign them in with filled
       checkout". The file has `code-1`/`code-2` here; this replaces them. */
    screens: [...QR_START, ...VERIFY, 'login-1', 'login-2', 'signing-in', ...CHECKOUT, 'placing', 'ready'],
  },
  {
    id: 'net-new',
    model: 'b2c',
    label: 'Net New: No OCD, No Atlas',
    description: 'New to XCEL. Verify email by code, full checkout, then create a password.',
    base: 'b2c-guest',
    screens: [...CART_START, ...VERIFY, ...CODE, 'checkout-1', ...CHECKOUT, 'placing', ...NEW_PASSWORD],
  },
  {
    id: 'ocd-no-atlas',
    model: 'b2c',
    label: 'OCD, but no Atlas',
    description: 'Has an OCD account, no Atlas. Same screens as Net New for now.',
    base: 'b2c-guest',
    screens: [...CART_START, ...VERIFY, ...CODE, 'checkout-1', ...CHECKOUT, 'placing', ...NEW_PASSWORD],
  },
  {
    id: 'has-atlas-login',
    model: 'b2c',
    label: 'Has Atlas: Open Log-In Widget',
    description: 'Already on Atlas. Email check opens a log-in widget before checkout.',
    base: 'b2c-guest',
    screens: [...CART_START, ...VERIFY, 'login-1', 'login-2', ...CHECKOUT, 'placing', 'ready'],
  },
  {
    id: 'has-atlas',
    model: 'b2c',
    label: 'Has Atlas: Automatic Sign-in Post OTP',
    description: 'Already on Atlas. Logs in, then signed in automatically with the checkout filled.',
    base: 'b2c-guest',
    /* Log-in, not a code — see `qr-atlas-auto`. */
    screens: [...CART_START, ...VERIFY, 'login-1', 'login-2', 'signing-in', ...CHECKOUT, 'placing-modal', 'ready'],
  },
  {
    /* SIGNED IN TO AN EXISTING XCEL (OCD) ACCOUNT — 2026-11-02, Afsana. Its
       screens depend on the cart and the email given, so this row is only the
       starting point: `signedInFlowV3` works out the walk. */
    id: 'xcel-signed-in',
    model: 'b2c',
    label: 'Signed in to XCEL (OCD)',
    description: 'Already signed in to an XCEL account. What happens at checkout depends on the cart: the targeted products sign them out into the new guest checkout.',
    base: 'xcel-signed-in',
    screens: ['cart', ...CHECKOUT, 'placing', 'ready'],
  },
]

export const INVITE_V3_MODEL_FLAG = 'invite-v3-model'

/** One flow control per model — see the note at the top. */
export const INVITE_V3_FLOW_FLAGS: Record<InviteModelId, string> = {
  b2b: 'invite-v3-flow-b2b',
  b2c: 'invite-v3-flow-b2c',
}

/** The file opens on B2B's first flow, so V3 does too. */
export const DEFAULT_INVITE_MODEL: InviteModelId = 'b2b'

export const DEFAULT_INVITE_FLOW_V3: Record<InviteModelId, InviteFlowV3Id> = {
  b2b: 'qr-net-new',
  b2c: 'net-new',
}

/** The Design bar surface V3 declares for a model — and, on B2C, a surface of
 *  its own for the signed-in flow, which carries the cart and email controls. */
export function inviteV3Surface(
  model: InviteModelId,
  flowId?: InviteFlowV3Id,
): 'invite:v3-b2b' | 'invite:v3-b2c' | 'invite:v3-b2c-signed-in' {
  if (model === 'b2b') return 'invite:v3-b2b'
  return flowId === 'xcel-signed-in' ? 'invite:v3-b2c-signed-in' : 'invite:v3-b2c'
}

export function resolveInviteModel(value: string | null | undefined): InviteModelId {
  return INVITE_MODELS.some((m) => m.id === value) ? (value as InviteModelId) : DEFAULT_INVITE_MODEL
}

/** A flow of THIS model, or the model's default — a stored id from the other
 *  model's list never leaks across. */
export function resolveInviteFlowV3(model: InviteModelId, value: string | null | undefined): InviteFlowV3 {
  return (
    INVITE_FLOWS_V3.find((f) => f.model === model && f.id === value) ??
    INVITE_FLOWS_V3.find((f) => f.id === DEFAULT_INVITE_FLOW_V3[model])!
  )
}

export function useInviteModel(): InviteModelId {
  return resolveInviteModel(useFeatureFlag(INVITE_V3_MODEL_FLAG).variant)
}

/** Does this flow check the email over the checkout before it can be used?
 *  All eight do, since the log-in flows were built (2026-10-30): every flow's
 *  screens include `verify-1`, or `verify-login-1` for "QR: Has Atlas: Open
 *  Log-In Widget". `VerifyEmailModalV3` is the check. */
export function verifiesEmailFirst(flow: InviteFlowV3): boolean {
  return flow.screens.includes('verify-1') || flow.screens.includes('verify-login-1')
}

/** What the email check does after the address, read from the file's screens:
 *
 *    second      `code` — a 6-digit code sent to it (`code-1`); or `login` —
 *                the learner already has Atlas and signs in with a password
 *                (`login-1`). Every Has Atlas flow logs in (2026-10-30).
 *    signsIn     a "Signing you in" hold before the checkout (`signing-in`).
 *                "Has Atlas: Open Log-In Widget" (B2C) goes straight on.
 *    accountKnown  the learner is signed in to an account they already have,
 *                so the checkout arrives with their details filled in
 *                (`checkout-1b`).
 */
export function emailCheckV3(flow: InviteFlowV3): {
  second: 'code' | 'login'
  signsIn: boolean
  accountKnown: boolean
} {
  const second = flow.screens.includes('login-1') ? 'login' : 'code'
  const signsIn = flow.screens.includes('signing-in')
  /* Filled when the walk skips the empty student form (`checkout-1`) — the
     Has Atlas flows, which sign in to an account that holds the details. The
     signed-out OCD learner logs in too, but enters the rest at checkout. */
  return { second, signsIn, accountKnown: !flow.screens.includes('checkout-1') }
}

/** Where a V3 flow starts: the partner's QR code for B2B, the public site's
 *  cart for B2C — the first screen of each in the file. */
export function entryPathV3(flow: InviteFlowV3): string {
  return flow.model === 'b2b' ? '/end-to-end-demo/qr' : '/end-to-end-demo/cart'
}

/** The screens a V3 model's flows can be on. Anything else under
 *  `/end-to-end-demo` — the public site's homepage and packages, the
 *  invitation email, another model's first screen — is not part of any of
 *  its flows, and `InviteFlowEntrySync` sends the walk back to the model's
 *  first screen (2026-10-30, Afsana: "make sure that all the B2C flows start
 *  with this screen", the cart). */
export function v3ScreensFor(model: InviteModelId): readonly string[] {
  return model === 'b2b'
    ? ['/end-to-end-demo/qr', '/end-to-end-demo', '/end-to-end-demo/checkout', '/end-to-end-demo/confirmation']
    : ['/end-to-end-demo/cart', '/end-to-end-demo/checkout', '/end-to-end-demo/confirmation']
}

/** The file's B2C cart holds Arizona Health Pre-licensing Premier. A V3 B2C
 *  walk that starts with nothing in the cart starts with that. */
export const V3_B2C_CART = { lstate: 'Arizona', loa: 'Health', pkg: 'premier' } as const


/** Which ending the flow reaches after the order (`InvitedConfirmationPageV3`):
 *  a password for the flows new to Atlas, "Start learning" for the ones that
 *  already have an account. Read from the file's screen order — its last
 *  screen is `create-password-filled`, `ready` or `ready-login`. */
export function inviteEndingV3(flow: InviteFlowV3): 'create-password' | 'ready' {
  return flow.screens.includes('create-password') ? 'create-password' : 'ready'
}

/** The V3 flow on screen: the chosen model, then that model's chosen flow.
 *  Both flow flags are read every render so the hook order never changes. */
export function useInviteFlowV3(): InviteFlowV3 {
  const model = useInviteModel()
  const b2b = useFeatureFlag(INVITE_V3_FLOW_FLAGS.b2b).variant
  const b2c = useFeatureFlag(INVITE_V3_FLOW_FLAGS.b2c).variant
  const cart = resolveV3Cart(useFeatureFlag(INVITE_V3_CART_FLAG).variant)
  const email = resolveV3EmailAccount(useFeatureFlag(INVITE_V3_EMAIL_ACCOUNT_FLAG).variant)
  const [params] = useSearchParams()
  const flow = resolveInviteFlowV3(model, model === 'b2b' ? b2b : b2c)
  return flow.id === 'xcel-signed-in'
    ? signedInFlowV3(flow, cart, email, params.get(V3_SIGNED_OUT_PARAM) === '1')
    : flow
}

/* ── Signed in to XCEL (OCD) — 2026-11-02 ─────────────────────────────────

   Afsana: a learner signed in to an existing XCEL account checks out from the
   cart, and what happens depends on what is in it —

     targeted   only the 526 targeted SKUs: Checkout signs them out ("Signing
                you out", with a platform-update notice), then the new guest
                checkout — Partner Code, Verify your email, then a log-in if
                the email has Atlas or a code if it does not; checkout; Start
                course or Create password.
     mixed      some items are not targeted: the cart says they were removed,
                and the rest goes as `targeted`.
     none       nothing targeted: the existing checkout, signed in, student
                information filled from the account — and the walk ends
                there; Place your order goes nowhere.

   Two Design bar controls choose the case — `invite-v3-cart` and, for the
   targeted cases, `invite-v3-email-account` — shown only on this flow. */

export type V3CartContents = 'targeted' | 'mixed' | 'none'
export type V3EmailAccount = 'atlas' | 'no-atlas'

export const INVITE_V3_CART_FLAG = 'invite-v3-cart'
export const INVITE_V3_EMAIL_ACCOUNT_FLAG = 'invite-v3-email-account'

/** Set once Checkout has signed the learner out; Reset and a flow switch clear
 *  it with the rest of the walk (`INVITE_WALK_PARAMS`). */
export const V3_SIGNED_OUT_PARAM = 'signedout'

export function resolveV3Cart(value: string | null | undefined): V3CartContents {
  return value === 'mixed' || value === 'none' ? value : 'targeted'
}

export function resolveV3EmailAccount(value: string | null | undefined): V3EmailAccount {
  return value === 'atlas' ? 'atlas' : 'no-atlas'
}

/** The signed-in flow's walk for this cart, email and sign-out state. Until
 *  the sign-out the learner is the V2 signed-in arm (`xcel-signed-in`: the
 *  site header knows them, checkout fills from the account); after it, a
 *  guest (`b2c-guest`). */
export function signedInFlowV3(
  flow: InviteFlowV3,
  cart: V3CartContents,
  email: V3EmailAccount,
  signedOut: boolean,
): InviteFlowV3 {
  if (cart === 'none') {
    /* The existing checkout is the last screen (Afsana, 2026-11-02). */
    return { ...flow, base: 'xcel-signed-in', screens: ['cart', ...CHECKOUT] }
  }
  const check = email === 'atlas' ? ['verify-login-1', 'login-1', 'login-2'] : [...VERIFY, ...CODE]
  const ending = email === 'atlas' ? ['ready'] : NEW_PASSWORD
  return {
    ...flow,
    base: signedOut ? 'b2c-guest' : 'xcel-signed-in',
    screens: ['cart', 'signing-out', 'pc-modal', ...check, 'checkout-1', ...CHECKOUT, 'placing', ...ending],
  }
}

/** The line a cart, checkout and receipt list — a course package's fields. */
export type V3CartLine = { name: string; price: string; listPrice: string; includes: string[] }

/** The demo's one product outside the 526 targeted SKUs.
 *  ⚠ ITS PRICES ARE INVENTED — not on the live site. */
export const V3_NON_TARGETED_ITEM: V3CartLine = {
  name: 'New York Life and Health Flashcards',
  price: '$49.00',
  listPrice: '$69.00',
  includes: ['New York Life and Health Flashcards'],
}

/** What the signed-in flow's cart holds, beyond the address's package, and
 *  what was taken out of it. `line` replaces the package when it is set (the
 *  `none` cart holds only the non-targeted item); `removed` is the mixed
 *  cart's banner. Null off this flow. */
export function useV3SignedInCart(): { cart: V3CartContents; line: V3CartLine | null; removed: string[] } | null {
  const flow = useInviteFlowV3()
  const version = resolveInviteFlowVersion(useFeatureFlag(INVITE_FLOW_VERSION_FLAG).variant)
  const cart = resolveV3Cart(useFeatureFlag(INVITE_V3_CART_FLAG).variant)
  if (version !== 'v3' || flow.id !== 'xcel-signed-in') return null
  return {
    cart,
    line: cart === 'none' ? V3_NON_TARGETED_ITEM : null,
    removed: cart === 'mixed' ? [V3_NON_TARGETED_ITEM.name] : [],
  }
}

/** A typed state, matched to the list's own spelling — or null while it names
 *  no state. Case-insensitive, so "florida" counts. Step 2 and the Change
 *  dialog gate on it (`CourseChoiceFields`). */
export function matchState(typed: string): string | null {
  const t = typed.trim().toLowerCase()
  /* `ALL_US_STATES` is `INVITE_STATES`' own source — imported directly so
     this file never imports `inviteMissingDetails`, which imports
     `inviteFlows`, which imports this. */
  return ALL_US_STATES.find((s) => s.toLowerCase() === t) ?? null
}
