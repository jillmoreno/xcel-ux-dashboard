import type { CSSProperties, ReactNode } from 'react'
import { EmptyState } from '@/components/ui/EmptyState'
import { AccountSubNav } from './AccountSubNav'
import { accountSectionsFor, type AccountSectionId } from './accountSections'
import { useAccount } from '@/context/AccountContext'
import { useFeatureFlag } from '@/context/FeatureFlagContext'

/**
 * The shared frame for every account page inside the Dashboard Rebrand shell:
 * the [AccountSubNav](./AccountSubNav.tsx) on the left, the page's own content
 * to its right. The shell still owns the section `<h1>` above both.
 *
 * Every account section renders through here, so the sub-nav can't be present
 * on one page and missing on the next — which is exactly what happened before
 * it existed: Profile and Gift Recipients each rendered bare, and the other
 * five sections weren't in the shell at all (they were top-nav placeholders).
 *
 * The columns wrap on narrow widths (the nav stacks above the content) rather
 * than squeezing the content column.
 */
export function AccountSectionLayout({
  active,
  onSelect,
  children,
}: {
  active: AccountSectionId
  onSelect: (id: AccountSectionId) => void
  children: ReactNode
}) {
  return (
    <div style={rowStyle}>
      <AccountSubNav active={active} onSelect={onSelect} />
      <div style={bodyStyle}>{children}</div>
    </div>
  )
}

/**
 * The body for an account section that isn't built yet — Notifications,
 * Licenses, Transcripts, Payment Methods, Purchases.
 *
 * These are real, reachable sections rather than dead nav items: the sub-nav
 * would be a lie if half its rows went nowhere, and a placeholder inside the
 * shell is honest about what's next without dropping the reviewer onto the old
 * top-nav layout. Each one is a `TODO(feature)` — replace the placeholder with
 * the real page, keeping it wrapped in `AccountSectionLayout`.
 */
export function AccountSectionPlaceholder({ id }: { id: AccountSectionId }) {
  const { brand } = useAccount()
  const giftRecipientsOn = useFeatureFlag('gift-recipients').enabled
  const label = accountSectionsFor(brand, giftRecipientsOn).find((s) => s.id === id)?.label ?? id
  return (
    <EmptyState
      title={`${label} — not built yet`}
      description={`This account section is reachable from the sub-nav so the navigation is complete, but ${label} hasn’t been designed yet. Profile is the built one.`}
    />
  )
}

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  // 24px, matching the shell's narrowed ACCOUNT_SECTION_GUTTER for these
  // sections. Together they take the content's offset from the rail from
  // 289px (40 + 208 + 40) down to 256px. Keep the two in step — they read as
  // one inset, so changing this alone leaves the gutter and the gap uneven.
  gap: 24,
  flexWrap: 'wrap',
  width: '100%',
  paddingBottom: 64,
}

const bodyStyle: CSSProperties = {
  // `flex: 1 1 520px` + `minWidth: 0` — grows to fill beside the fixed-width
  // nav, and wraps below it (rather than crushing) when the column is narrow.
  flex: '1 1 520px',
  minWidth: 0,
}
