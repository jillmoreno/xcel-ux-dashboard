/**
 * Version catalog for the INVITE FLOW — the End-to-End Demo's invite door:
 * the invitation email, the Invited Product Detail page, its checkout and the
 * Confirmation & Password step (`/end-to-end-demo`, `…/email`, `…/checkout`,
 * `…/confirmation`).
 *
 * ⚠ WHY THIS EXISTS AS ITS OWN CATALOG RATHER THAN MORE `DASHBOARD_VERSIONS`
 * ROWS, which is the question to answer before adding anything here.
 * `?version=` on these four routes is ALREADY SPOKEN FOR: `useEndToEndDemoParams`
 * force-writes `version=eric-atlas-e2e` onto every one of them on mount,
 * because the invite pages are that dashboard version's way in. A second id in
 * the same parameter would be overwritten by that effect a tick after it was
 * read — silently, and only on the pages this picker is for. So the invite
 * flow's version lives in its own parameter space: the `invite-flow-version`
 * FLAG (see `FeatureFlagContext`), which also means it persists per browser
 * and pins into a `?ff=` share link for free, the way every other flag does.
 *
 * ⚠ THE FLAG IS THE STORE; THIS FILE IS THE LIST. The ids here must match the
 * flag's `variants` exactly — `InviteFlowVersions.test.ts` asserts that, because
 * a row whose id no variant carries is a card in the picker that selects
 * nothing.
 *
 * Mirrors `dashboardVersions.ts` in shape so `DashboardVersionsPanel` can back
 * this picker unchanged: its `VersionPickerItem` is the whole contract.
 */
import type { DesignerId } from '@/context/FeatureFlagContext'


export type InviteFlowVersionId = 'v1' | 'v2'

export type InviteFlowVersion = {
  id: InviteFlowVersionId
  label: string
  createdAt: string
  modifiedAt: string
  description: string
  /** Whose version this is — the tab it sits under in the Invite Flow
   *  Versions sheet (2026-10-29, Jillienne: "the versions sheet should also
   *  include all of the designer names, like in the atlas side"). Absent means
   *  Jill, resolved through `flagOwner` like every other owner. A designer's
   *  V3 names them here and lands on their tab. */
  owner?: DesignerId
}

export const INVITE_FLOW_VERSIONS: InviteFlowVersion[] = [
  {
    id: 'v1',
    label: 'Invite Flow V1',
    owner: 'jill',
    createdAt: '2026-10-14',
    modifiedAt: '2026-10-20',
    description:
      'The flow as it has stood since the End-to-End Demo was built: the Sunrise Bank invitation email, the Invited Product Detail page, a single-page checkout, and Confirmation & Password ending on the loading hand-off to Atlas Learning. The baseline every other version is measured against.',
  },
  {
    id: 'v2',
    label: 'Invite Flow V2',
    owner: 'jill',
    createdAt: '2026-10-22',
    modifiedAt: '2026-10-22',
    description:
      'A fresh fork of V1 — the starting point for the checkout exploration. Identical to V1 on every screen today; iterate freely without touching V1, which is what the released End-to-End row still shows.',
  },
]

/**
 * What a fresh visit to the invite flow renders.
 *
 * ⚠ V1 ON `main` — the released End-to-End and Invite & Purchase rows both open
 * this flow, so the default here IS what stakeholders see. Changing it is the
 * same decision as changing the default dashboard version, and belongs to
 * Jillienne through `promote-to-prototype`, not to whoever adds a version.
 * A branch exploring V2 overrides it with the flag's `defaultVariant`.
 */
export const DEFAULT_INVITE_FLOW_VERSION: InviteFlowVersionId = 'v1'

/** The flag that stores the selection. One name, so the picker, the resolver
 *  and the test cannot disagree about it. */
export const INVITE_FLOW_VERSION_FLAG = 'invite-flow-version'

/** Guards a stored value — a browser holding an id this build no longer
 *  carries falls back to the default rather than rendering nothing. The same
 *  shape `resolvePaceStyle` uses on the demo bar, and for the same reason. */
export function resolveInviteFlowVersion(value: string | null | undefined): InviteFlowVersionId {
  return INVITE_FLOW_VERSIONS.some((v) => v.id === value)
    ? (value as InviteFlowVersionId)
    : DEFAULT_INVITE_FLOW_VERSION
}

/** The label for an id — what the demo bar's control announces. Falls back to
 *  the id so an unknown value reads as itself rather than as blank. */
export function inviteFlowVersionLabel(id: string): string {
  return INVITE_FLOW_VERSIONS.find((v) => v.id === id)?.label ?? id
}

/** Is this pathname part of the invite flow? The demo bar asks, to decide
 *  which version picker its control opens. Kept here beside the catalog rather
 *  than in the bar, because the bar is protected chrome and this is a fact
 *  about the flow. */
export function isInviteFlowPath(pathname: string): boolean {
  return pathname === '/end-to-end-demo' || pathname.startsWith('/end-to-end-demo/')
}
