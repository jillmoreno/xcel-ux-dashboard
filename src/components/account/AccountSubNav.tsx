import type { CSSProperties } from 'react'
import { useAccount } from '@/context/AccountContext'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { accountSectionsFor, type AccountSectionId } from './accountSections'

/**
 * Account sub-nav — the vertical section list beside every account page
 * (Profile · Notifications · Licenses · Transcripts · Payment Methods ·
 * Purchases, plus Gift Recipients where it applies).
 *
 * Modeled on the McKissock account layout: the page `<h1>` on top, this rail on
 * the left, the page's cards to its right. It's the SECOND level of navigation —
 * the shell's dark left rail is the first — so it's deliberately quiet: no
 * surface, no border, just an active pill. Making it look like another panel
 * would set it up to compete with the rail it sits next to.
 *
 * It's a **selector, not a set of links**: account pages live inside the
 * Dashboard Rebrand shell, so clicking swaps the section in place (same as the
 * rail) instead of navigating and re-mounting the shell. `onSelect` takes the
 * section id; the parent maps it to the shell's `?section=`.
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
    <nav aria-label="Account sections" style={navStyle}>
      {sections.map(({ id, label, icon: Icon }) => {
        const on = id === active
        return (
          <button
            key={id}
            type="button"
            // `aria-current="page"` (not aria-pressed): these read as navigation
            // to the section you're on, not as toggles.
            aria-current={on ? 'page' : undefined}
            onClick={() => onSelect(id)}
            className="cre-account-subnav-item"
            style={{
              ...itemStyle,
              background: on ? 'var(--color-primary-100)' : 'transparent',
              color: on ? 'var(--color-primary-700)' : 'var(--color-text-secondary)',
              fontWeight: on ? 700 : 500,
            }}
          >
            <Icon size={16} aria-hidden style={{ flexShrink: 0 }} />
            <span>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}

const navStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  // Fixed width so the content beside it doesn't reflow when the active label
  // changes length ("Profile" vs "Payment Methods").
  width: 208,
  flexShrink: 0,
}

const itemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  width: '100%',
  padding: '10px 14px',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-body)',
  fontSize: 15,
  lineHeight: '22px',
  textAlign: 'left',
  cursor: 'pointer',
}
