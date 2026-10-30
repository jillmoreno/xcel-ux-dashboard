import { useFeatureFlag } from '@/context/FeatureFlagContext'
import type { InviteFlowId } from './inviteFlows'
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

export type InviteFlowV3 = {
  id: InviteFlowV3Id
  model: InviteModelId
  label: string
  description: string
  base: InviteFlowId
  screens: string[]
}

export const INVITE_MODELS: { id: InviteModelId; label: string; description: string }[] = [
  { id: 'b2b', label: 'B2B', description: 'A partner’s QR code. Partner pricing; the learner proves their email by code.' },
  { id: 'b2c', label: 'B2C', description: 'Direct from the public site’s cart. No partner.' },
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
    label: 'QR: Has Atlas: Automatic Sign-in Post OTC',
    description: 'Already on Atlas. Signed in automatically after the one-time code.',
    base: 'qr-social',
    screens: [...QR_START, ...VERIFY, ...CODE, 'signing-in', ...CHECKOUT, 'placing', 'ready'],
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
    label: 'Has Atlas: Automatic Sign-in Post OTC',
    description: 'Already on Atlas. Signed in automatically after the one-time code.',
    base: 'b2c-guest',
    screens: [...CART_START, ...VERIFY, ...CODE, 'signing-in', ...CHECKOUT, 'placing-modal', 'ready'],
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

/** The Design bar surface V3 declares for a model. */
export function inviteV3Surface(model: InviteModelId): 'invite:v3-b2b' | 'invite:v3-b2c' {
  return model === 'b2b' ? 'invite:v3-b2b' : 'invite:v3-b2c'
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

/** The V3 flow on screen: the chosen model, then that model's chosen flow.
 *  Both flow flags are read every render so the hook order never changes. */
export function useInviteFlowV3(): InviteFlowV3 {
  const model = useInviteModel()
  const b2b = useFeatureFlag(INVITE_V3_FLOW_FLAGS.b2b).variant
  const b2c = useFeatureFlag(INVITE_V3_FLOW_FLAGS.b2c).variant
  return resolveInviteFlowV3(model, model === 'b2b' ? b2b : b2c)
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
