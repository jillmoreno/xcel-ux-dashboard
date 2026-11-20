import type { CSSProperties } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { INVITE_FLOW_VERSION_FLAG, isInviteFlowPath, resolveInviteFlowVersion } from '@/data/inviteFlowVersions'
import {
  INVITE_MODELS,
  INVITE_V3_CART_FLAG,
  INVITE_V3_EMAIL_ACCOUNT_FLAG,
  INVITE_V3_LOG_IN_ACCOUNT_FLAG,
  resolveV3EmailAccount,
  resolveV3LogInAccount,
  useInviteFlowV3,
  useInviteModel,
} from '@/data/inviteFlowsV3'

/**
 * WHICH FLOW THIS IS, OVER THE WALK — 2026-11-18, Afsana: "when a user
 * clicks on any of the flows, for example, direct email, no atlas account,
 * above the flow, there should be a banner full width that states 'B2B2C:
 * Direct Email / No Atlas Account'… the banner should be light blue".
 *
 * ⚠ THE STAND-ALONE WALK ONLY (`?standalone=1`, what `/invite-v3`'s Starts
 * open). The full prototype has the Design bar saying the same thing, and a
 * banner there would be a second answer to one question.
 *
 * B2C adds the Cart contents, the choice its card makes. The account is
 * always named, None targeted included, so the banner matches the button
 * that was clicked (2026-11-18, Afsana).
 *
 * ⚠ LOG IN IS NEITHER (2026-11-20, Afsana: why does it say "Targeted only"?).
 * It buys nothing, so it has no cart, and its account is where the email is
 * found, not whether it has Atlas — "B2C: Log In / OCD Account", the Start's
 * own words.
 */

const LOG_IN_ACCOUNTS: Record<string, string> = { atlas: 'Atlas Account', ocd: 'OCD Account', none: 'No Account' }

const CARTS: Record<string, string> = { targeted: 'Targeted Only', mixed: 'Mixed', none: 'None Targeted' }

export function InviteFlowBanner() {
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  const version = resolveInviteFlowVersion(useFeatureFlag(INVITE_FLOW_VERSION_FLAG).variant)
  const model = useInviteModel()
  const flow = useInviteFlowV3()
  const account = resolveV3EmailAccount(useFeatureFlag(INVITE_V3_EMAIL_ACCOUNT_FLAG).variant)
  const cart = useFeatureFlag(INVITE_V3_CART_FLAG).variant ?? 'targeted'
  const logIn = resolveV3LogInAccount(useFeatureFlag(INVITE_V3_LOG_IN_ACCOUNT_FLAG).variant)
  if (params.get('standalone') !== '1' || version !== 'v3' || !isInviteFlowPath(pathname)) return null

  const modelLabel = INVITE_MODELS.find((m) => m.id === model)?.label ?? model
  const accountLabel = account === 'atlas' ? 'Has Atlas Account' : 'No Atlas Account'
  const parts =
    flow.id === 'xcel-log-in'
      ? [flow.label, LOG_IN_ACCOUNTS[logIn]]
      : model === 'b2c'
        ? [flow.label, CARTS[cart] ?? CARTS.targeted, accountLabel]
        : [flow.label, accountLabel]
  return (
    /* `data-invite-flow-banner` lets the screenshot script leave it out. */
    <div role="note" aria-label="Flow" data-invite-flow-banner style={BANNER}>
      <strong style={{ fontWeight: 800 }}>{modelLabel}:</strong> {parts.join(' / ')}
    </div>
  )
}

const BANNER: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 16px',
  background: 'var(--color-info-100)',
  borderBottom: '1px solid var(--color-info-200)',
  color: 'var(--color-info-900)',
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 14,
  lineHeight: '20px',
  textAlign: 'center',
}
