import { useFeatureFlag } from '@/context/FeatureFlagContext'
import {
  INVITE_FLOW_VERSION_FLAG,
  resolveInviteFlowVersion,
  type InviteFlowVersionId,
} from '@/data/inviteFlowVersions'
import { InviteEmailPage } from './InviteEmailPage'
import { InviteEmailPageV2 } from './InviteEmailPageV2'
import { InvitedProductDetailPage } from './InvitedProductDetailPage'
import { InvitedProductDetailPageV2 } from './InvitedProductDetailPageV2'
import { InvitedCheckoutPage } from './InvitedCheckoutPage'
import { InvitedCheckoutPageV2 } from './InvitedCheckoutPageV2'
import { InvitedConfirmationPage } from './InvitedConfirmationPage'
import { InvitedConfirmationPageV2 } from './InvitedConfirmationPageV2'

/**
 * THE INVITE FLOW'S VERSION SWITCH — 2026-10-22, with `inviteFlowVersions.ts`.
 *
 * One component per route, each choosing between the V1 page and its V2 fork.
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

export function InviteEmailRoute() {
  return useInviteFlowVersion() === 'v2' ? <InviteEmailPageV2 /> : <InviteEmailPage />
}

export function InvitedProductDetailRoute() {
  return useInviteFlowVersion() === 'v2' ? <InvitedProductDetailPageV2 /> : <InvitedProductDetailPage />
}

export function InvitedCheckoutRoute() {
  return useInviteFlowVersion() === 'v2' ? <InvitedCheckoutPageV2 /> : <InvitedCheckoutPage />
}

export function InvitedConfirmationRoute() {
  return useInviteFlowVersion() === 'v2' ? <InvitedConfirmationPageV2 /> : <InvitedConfirmationPage />
}
