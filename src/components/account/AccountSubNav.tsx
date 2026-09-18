import { useAccount } from '@/context/AccountContext'
import { SubNav } from '@/components/ui/SubNav'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { accountSectionsFor, type AccountSectionId } from './accountSections'

/**
 * Account sub-nav — the vertical section list beside every account page
 * (Profile · Notifications · Licenses · Transcripts · Payment Methods ·
 * Purchases, plus Gift Recipients where it applies).
 *
 * Modeled on the McKissock account layout: the page `<h1>` on top, this rail on
 * the left, the page's cards to its right.
 *
 * THE TREATMENT MOVED to [`SubNav`](../ui/SubNav.tsx) on 2026-09-18, when the
 * Compass course launcher needed the same rail. What stays here is this
 * surface's DATA — which sections exist for this brand, and their gating — and
 * that split is the point: the launcher's panes have nothing to do with
 * `accountSectionsFor`, while the rail they both draw has to stay one rail.
 * Everything the old markup did is now in that component, including the
 * "selector, not links" reasoning and `aria-current`.
 *
 * Gift Recipients is brand + flag gated, exactly as in the account dropdown —
 * both read `accountSectionsFor`, so the two lists can't drift.
 */
export function AccountSubNav({
  active,
  onSelect,
}: {
  active: AccountSectionId
  onSelect: (id: AccountSectionId) => void
}) {
  const { brand } = useAccount()
  const giftRecipientsOn = useFeatureFlag('gift-recipients').enabled
  const sections = accountSectionsFor(brand, giftRecipientsOn)

  return (
    <SubNav
      ariaLabel="Account sections"
      items={sections}
      active={active}
      onSelect={onSelect}
    />
  )
}
