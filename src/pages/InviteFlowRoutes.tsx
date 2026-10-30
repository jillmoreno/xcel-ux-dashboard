import { useFeatureFlag } from '@/context/FeatureFlagContext'
import {
  INVITE_FLOW_VERSION_FLAG,
  resolveInviteFlowVersion,
  type InviteFlowVersionId,
} from '@/data/inviteFlowVersions'
import { InviteEmailPage } from './InviteEmailPage'
import { InviteEmailPageV2 } from './InviteEmailPageV2'
import { InviteEmailPageV3 } from './InviteEmailPageV3'
import { InvitedProductDetailPage } from './InvitedProductDetailPage'
import { InvitedProductDetailPageV2 } from './InvitedProductDetailPageV2'
import { InvitedProductDetailPageV3 } from './InvitedProductDetailPageV3'
import { InvitedCheckoutPage } from './InvitedCheckoutPage'
import { InvitedCheckoutPageV2 } from './InvitedCheckoutPageV2'
import { InvitedCheckoutPageV3 } from './InvitedCheckoutPageV3'
import { InvitedConfirmationPage } from './InvitedConfirmationPage'
import { InvitedConfirmationPageV2 } from './InvitedConfirmationPageV2'
import { InvitedConfirmationPageV3 } from './InvitedConfirmationPageV3'
import { XcelSplitConfirmationPage } from './XcelSplitConfirmationPage'
import { XcelQrInvitePage } from './XcelQrInvitePage'
import { XcelQrInvitePageV3 } from './XcelQrInvitePageV3'
import {
  passwordSetFromEmailedLink,
  useInviteFlow,
  useOrderConfirmationStyle,
} from '@/data/inviteFlows'

/**
 * THE INVITE FLOW'S VERSION SWITCH — 2026-10-22, with `inviteFlowVersions.ts`.
 *
 * One component per route, each choosing between the V1 page, its V2 fork and
 * V3 (Afsana's concept, a fork of V2 — 2026-10-29).
 * The choice is made HERE rather than inside the pages, which is what keeps the
 * fork honest: neither page knows a second version exists, so neither grows a
 * conditional, and either can be rewritten without reading the other.
 *
 * ⚠ IT IS DELIBERATELY NOT IN `App.tsx`. The routes there name one element
 * each; putting the switch in the route table would have meant four ternaries
 * in a file that is otherwise a flat list of paths, and the version would be
 * read four times from four places. This module is the one place that maps a
 * version id to a component.
 *
 * ⚠ THE FLAG IS READ, NEVER THE URL's `?version=`. See the long note in
 * `inviteFlowVersions.ts` — `useEndToEndDemoParams` owns `?version=` on these
 * four routes and overwrites anything else written there.
 */

/** The version these routes should render.
 *
 *  ⚠ DELIBERATELY NOT EXPORTED. The demo bar's control and the picker need the
 *  same answer, but both already hold the `flags` map and read it through
 *  `resolveInviteFlowVersion` — which is the shared piece, and the one that
 *  guards the value. Exporting a hook from this file would also mean every
 *  component in it stops hot-reloading (`react-refresh/only-export-components`),
 *  which is a poor trade for a one-line read. */
function useInviteFlowVersion(): InviteFlowVersionId {
  const flag = useFeatureFlag(INVITE_FLOW_VERSION_FLAG)
  /* `enabled` is not a second axis here — the flag is variant-only, and a
     disabled variant flag still reports its variant. Guarding the VALUE is
     what matters: a browser holding an id this build dropped falls back to the
     default instead of rendering nothing. */
  return resolveInviteFlowVersion(flag.variant)
}

/** The QR code. Not versioned until V3 (2026-10-30): V1 and V2 share the
 *  partner's phone share card; V3 draws the code alone, as Afsana's file does. */
export function QrInviteRoute() {
  return useInviteFlowVersion() === 'v3' ? <XcelQrInvitePageV3 /> : <XcelQrInvitePage />
}

export function InviteEmailRoute() {
  const version = useInviteFlowVersion()
  if (version === 'v3') return <InviteEmailPageV3 />
  return version === 'v2' ? <InviteEmailPageV2 /> : <InviteEmailPage />
}

export function InvitedProductDetailRoute() {
  const version = useInviteFlowVersion()
  if (version === 'v3') return <InvitedProductDetailPageV3 />
  return version === 'v2' ? <InvitedProductDetailPageV2 /> : <InvitedProductDetailPage />
}

export function InvitedCheckoutRoute() {
  const version = useInviteFlowVersion()
  if (version === 'v3') return <InvitedCheckoutPageV3 />
  return version === 'v2' ? <InvitedCheckoutPageV2 /> : <InvitedCheckoutPage />
}

/**
 * ⚠ THE INVITED ENDING IS THE GUEST'S PAGE NOW — 2026-10-23, Jillienne: "this
 * step needs to match the confirmation page we did for the guest version, but
 * the create password side will skip the email validation for this flow, all
 * the other UI should be matching."
 *
 * So it is not a restyle, it is the same component. Two password screens that
 * are meant to look identical drift — in wording, in validation, in which
 * button does what — and this flow has spent the week collapsing exactly that
 * kind of duplication (`MailClient`, `XcelLoadingPage`,
 * `InvitePasswordChecklist`). `XcelSplitConfirmationPage` already asks
 * `passwordSetFromEmailedLink` and skips straight to the password card for the
 * arms that have nothing to verify.
 *
 * ⚠ `InvitedConfirmationPageV2` STILL OWNS THE OTHER ARM — "Check your email",
 * where the password is set from a mailed link and there is no form to show.
 * That is a genuinely different page, not a state of this one.
 *
 * ⚠ THE TONE FOLLOWS THE SAME CONTROL, so Thank you page switches both
 * endings together. `receipt` resolves to Light here: that arm is the PUBLIC
 * SITE's full-width receipt with its Launch Student Portal, which an invited
 * learner never sees — and a control that silently did nothing on this half of
 * the flow would be worse than one that picks the nearest real treatment.
 */
export function InvitedConfirmationRoute() {
  const version = useInviteFlowVersion()
  const flow = useInviteFlow()
  const style = useOrderConfirmationStyle()
  if (version === 'v1') return <InvitedConfirmationPage />
  /* V3 has one ending page of its own, Afsana's (2026-10-30): a password or
     "Start learning", per flow — `inviteEndingV3`. */
  if (version === 'v3') return <InvitedConfirmationPageV3 />
  if (passwordSetFromEmailedLink(flow)) return <InvitedConfirmationPageV2 />
  return <XcelSplitConfirmationPage tone={style === 'split' ? 'dark' : 'light'} />
}
