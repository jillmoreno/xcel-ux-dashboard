import { useNavigate } from 'react-router-dom'
import { DashboardVersionsPanel } from '@/components/dashboard/DashboardVersionsPanel'
import { useFeatureFlags } from '@/context/FeatureFlagContext'
import {
  DEFAULT_INVITE_FLOW_VERSION,
  INVITE_FLOW_VERSION_FLAG,
  INVITE_FLOW_VERSIONS,
  resolveInviteFlowVersion,
} from '@/data/inviteFlowVersions'
import { useInviteFlowVersionsPanel } from './InviteFlowVersionsPanelContext'

/**
 * THE INVITE FLOW VERSIONS PICKER — 2026-10-22.
 *
 * ⚠ IT IS `DashboardVersionsPanel` WITH A DIFFERENT LIST, not a second panel.
 * That component's `VersionPickerItem` is deliberately the minimal shape a
 * version card needs, and it already backs three pickers for exactly this
 * reason; `inviteFlowVersions.ts` mirrors `dashboardVersions.ts` so it can back
 * a fourth unchanged. Keeping one panel is what stops the cards drifting into
 * two slightly different designs.
 *
 * DESIGNER TABS SINCE 2026-10-29 (Jillienne: "when on the invite flow of the
 * prototype, the versions sheet should also include all of the designer
 * names, like in the atlas side"). Until then the list had no tabs because
 * its versions had no owners; `InviteFlowVersion.owner` gives them one, so
 * the same `designerTabs` the dashboard sheet uses files V1 and V2 under Jill
 * and a designer's V3 under them. The tabs are `FLAG_DESIGNERS`, so a new
 * designer appears here the moment they join that roster. The SCOPE's owners
 * (Afsana and Eric, `PROTOTYPE_SCOPES`) remain a different question from whose
 * tab a card sits under.
 *
 * ⚠ NO "Set as default" EITHER (`hideSetDefault`). For the dashboard that
 * button writes a per-browser default; here the default is the flag's
 * committed `defaultVariant`, which is what the released End-to-End row opens
 * on — a code decision that belongs to `promote-to-prototype`, not to a button
 * in a reviewer's sheet. The inline "Default" pill still shows, and it reads
 * the SAME value the switch resolves, so it cannot mark a version a fresh
 * visit does not load.
 */
export function InviteFlowVersionsPanel() {
  /* Null only in a test harness that did not mount the provider — see the
     hook. The panel then simply never opens, which is what those harnesses
     had before this existed. */
  const panel = useInviteFlowVersionsPanel()
  const { flags, definitions, setVariant } = useFeatureFlags()
  const navigate = useNavigate()

  const activeVersionId = resolveInviteFlowVersion(flags[INVITE_FLOW_VERSION_FLAG]?.variant)
  /* The committed default, read from the catalog rather than restated — the
     branch rule means `defaultVariant` moves while `DEFAULT_INVITE_FLOW_VERSION`
     records what `main` ships, and the pill must follow the one that renders.
     The constant is the fallback for a build where the flag has been pulled. */
  const defaultVersionId = resolveInviteFlowVersion(
    definitions.find((d) => d.key === INVITE_FLOW_VERSION_FLAG)?.defaultVariant ??
      DEFAULT_INVITE_FLOW_VERSION,
  )

  return (
    <DashboardVersionsPanel
      open={panel?.open ?? false}
      onClose={() => panel?.closePanel()}
      title="Invite Flow Versions"
      versions={INVITE_FLOW_VERSIONS}
      designerTabs
      activeVersionId={activeVersionId}
      defaultVersionId={defaultVersionId}
      hideSetDefault
      onSetDefault={() => {}}
      onSelectVersion={(id) => {
        setVariant(INVITE_FLOW_VERSION_FLAG, id)
        panel?.closePanel()
        /* ⚠ SEND THEM TO THE FLOW'S FIRST SCREEN, the way the dashboard picker
           navigates rather than only setting state. Picking a version from the
           checkout of the OTHER version would otherwise leave the reviewer
           mid-journey in a build they have not seen the start of — and the two
           checkouts are forks, so "the same page in the other version" is not
           a promise this can keep. The email is where the flow begins. */
        navigate('/end-to-end-demo/email')
      }}
      side="right"
    />
  )
}
