import { useMemo, type CSSProperties } from 'react'
import { useAccount } from '@/context/AccountContext'
import { profileFor } from '@/data/accountProfileFixtures'
import {
  AccountDetailsCard,
  InterestsCard,
  MembershipPlanCard,
  MotivationalStatementCard,
  PersonalInformationCard,
} from '@/components/account/profile/ProfileCards'

/**
 * Profile page — Figma "Profile" (`Nf5WhNJqxn9YVqDLT0MWOl` / `301:18770`),
 * colors remapped to the active brand's tokens.
 *
 * It lives inside the Dashboard Rebrand left-nav shell (`PlatformShell`,
 * `?section=profile`) — reached only from the top-right account dropdown, NOT a
 * rail item. The shell owns the left rail + the "Profile" section title, so this
 * page renders just the two-column card layout (no top nav, no account sub-nav,
 * no standalone heading).
 *
 * Two columns: Account Details + Personal Information (left) and Motivational
 * Statement + Membership Plan + Interests (right). Each card has an edit pencil —
 * Motivational Statement opens the real `MotivationalStatementPanel` (wired to
 * `MotivationContext`); the rest open a stub panel.
 */
export function ProfilePage() {
  const { brand, membership } = useAccount()
  const isMember = membership === 'member'
  const profile = useMemo(() => profileFor(brand, isMember), [brand, isMember])

  return (
    <div style={{ width: '100%', paddingBottom: 64 }}>
      <div style={columnsStyle}>
        {/* Left column */}
        <div style={columnStyle}>
          <AccountDetailsCard data={profile.account} isMember={isMember} />
          <PersonalInformationCard data={profile.personal} />
        </div>
        {/* Right column */}
        <div style={columnStyle}>
          <MotivationalStatementCard />
          <MembershipPlanCard data={profile.membershipPlan} />
          <InterestsCard data={profile.interests} />
        </div>
      </div>
    </div>
  )
}

// Two card columns that wrap on narrow widths. Each column caps at ~560px
// (the Figma card width) and grows to fill.
const columnsStyle: CSSProperties = {
  display: 'flex',
  gap: 32,
  flexWrap: 'wrap',
  alignItems: 'flex-start',
}

const columnStyle: CSSProperties = {
  // Basis 340, NOT the Figma card width (460): this page renders beside the
  // 208px account sub-nav (+40px gap), so the body column is ~248px narrower
  // than the shell's content column. Two 460px bases plus the 32px gap need
  // 952px against ~928px available, which wrapped the right column (Motivational
  // Statement / Membership Plan / Interests) underneath the left one. 340 keeps
  // both columns side by side down to a ~712px body and still lets each grow to
  // the 560 cap on wide screens — the wrap is then a real narrow-width fallback
  // rather than the default.
  flex: '1 1 340px',
  minWidth: 0,
  maxWidth: 560,
  display: 'flex',
  flexDirection: 'column',
  gap: 32,
}
