import { useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarDay,
  CircleUser,
  Crown,
  Grid,
  Heart,
  HourglassClock,
  IdCard,
  UserSlash,
  X,
} from '@/icons'
import { Avatar } from '@/components/ui/Avatar'
import { useAccount } from '@/context/AccountContext'
import { useMotivation } from '@/context/MotivationContext'
import { MotivationalStatementPanel } from '@/components/membership/MotivationalStatementPanel'
import type { AccountProfile } from '@/data/accountProfileFixtures'
import { ProfileCard, ProfileField } from './ProfileCard'
import { ProfileEditStubPanel } from './ProfileEditStubPanel'

/* ─── Account Details ──────────────────────────────────────────────────── */

export function AccountDetailsCard({
  data,
  isMember,
}: {
  data: AccountProfile['account']
  isMember: boolean
}) {
  const { user } = useAccount()
  const [editOpen, setEditOpen] = useState(false)
  return (
    <>
      <ProfileCard title="Account Details" icon={CircleUser} onEdit={() => setEditOpen(true)}>
        {/* Identity cluster — avatar + status pill + name. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Avatar
            initials={user.initials}
            imageUrl={user.avatarUrl}
            size={60}
            alt={`${user.firstName} ${user.lastName}`}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
            <MembershipStatusPill isMember={isMember} />
            <span style={nameStyle}>
              {user.firstName} {user.lastName}
            </span>
          </div>
        </div>

        <div aria-hidden style={dividerStyle} />

        <div style={fieldGroupStyle}>
          <ProfileField label="Username" value={data.username} valueWeight="semibold" />
          <ProfileField label="Email" value={data.email} />
          <ProfileField label="Password" value={data.passwordMask} valueWeight="semibold" />
        </div>
      </ProfileCard>
      <ProfileEditStubPanel open={editOpen} onClose={() => setEditOpen(false)} title="Edit Account Details" />
    </>
  )
}

/** Small gold "Member" / neutral "Non-Member" status pill (Figma "Status - Small").
 *  Remapped to the app's warning ramp (member) / neutral ramp (non-member). */
function MembershipStatusPill({ isMember }: { isMember: boolean }) {
  if (isMember) {
    return (
      <span style={{ ...pillStyle, background: 'var(--color-warning-100)', color: 'var(--color-warning-700)' }}>
        <Crown size={14} aria-hidden />
        Member
      </span>
    )
  }
  return (
    <span style={{ ...pillStyle, background: 'var(--color-neutral-75)', color: 'var(--color-text-secondary)' }}>
      <UserSlash size={14} aria-hidden />
      Non-Member
    </span>
  )
}

/* ─── Personal Information ─────────────────────────────────────────────── */

export function PersonalInformationCard({ data }: { data: AccountProfile['personal'] }) {
  const [editOpen, setEditOpen] = useState(false)
  return (
    <>
      <ProfileCard title="Personal Information" icon={IdCard} onEdit={() => setEditOpen(true)}>
        <div style={fieldGroupStyle}>
          <ProfileField label="Name" value={data.name} />
          <ProfileField label="Date of Birth" value={data.dateOfBirth} />
          <ProfileField label="Phone Number" value={data.phone} />
          <ProfileField
            label="Billing Address"
            value={
              <>
                <div>{data.billing.line1}</div>
                <div>{data.billing.cityState}</div>
                <div>{data.billing.postal}</div>
              </>
            }
          />
          <ProfileField
            label="Shipping Address"
            value={
              <>
                <div>{data.shipping.line1}</div>
                <div>{data.shipping.cityState}</div>
                <div>{data.shipping.postal}</div>
              </>
            }
          />
        </div>
      </ProfileCard>
      <ProfileEditStubPanel open={editOpen} onClose={() => setEditOpen(false)} title="Edit Personal Information" />
    </>
  )
}

/* ─── Motivational Statement (live — wired to MotivationContext) ─────────── */

export function MotivationalStatementCard() {
  const { statement, setStatement } = useMotivation()
  const [panelOpen, setPanelOpen] = useState(false)
  const hasStatement = statement.trim().length > 0
  return (
    <>
      <ProfileCard
        title="Motivational Statement"
        icon={Heart}
        onEdit={() => setPanelOpen(true)}
        editLabel="Edit motivational statement"
      >
        {hasStatement ? (
          <p style={statementStyle}>&ldquo;{statement}&rdquo;</p>
        ) : (
          <p style={promptStyle}>
            Take a minute to enter a statement that will motivate you in achieving your goal.
          </p>
        )}
      </ProfileCard>
      {/* Kept mounted (toggling `open`) so the success toast survives the close. */}
      <MotivationalStatementPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        value={statement}
        onSave={setStatement}
      />
    </>
  )
}

/* ─── Membership Plan (member + non-member) ────────────────────────────── */

export function MembershipPlanCard({ data }: { data: AccountProfile['membershipPlan'] }) {
  const [editOpen, setEditOpen] = useState(false)
  return (
    <>
      <ProfileCard title="Membership Plan" icon={Crown} onEdit={data ? () => setEditOpen(true) : undefined}>
        {data ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={planTitleStyle}>{data.planTitle}</p>
            <div style={planRowStyle}>
              <CalendarDay size={16} aria-hidden />
              <span style={planMetaStyle}>Automatically Renews on {data.renewsOn}</span>
            </div>
            <div style={planRowStyle}>
              <HourglassClock size={16} aria-hidden />
              <span style={planMetaStyle}>{data.daysRemaining} Days of Membership Remaining</span>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
            <p style={planMetaStyle}>You don&rsquo;t have an active membership plan.</p>
            <Link to="/membership" className="cre-link-action" style={upsellLinkStyle}>
              Explore Membership →
            </Link>
          </div>
        )}
      </ProfileCard>
      <ProfileEditStubPanel open={editOpen} onClose={() => setEditOpen(false)} title="Edit Membership Plan" />
    </>
  )
}

/* ─── Interests (removable tag pills) ──────────────────────────────────── */

export function InterestsCard({ data }: { data: string[] }) {
  // Removal is local + non-persistent (prototype behavior).
  const [interests, setInterests] = useState<string[]>(data)
  const [editOpen, setEditOpen] = useState(false)
  const remove = (tag: string) => setInterests((prev) => prev.filter((t) => t !== tag))
  return (
    <>
      <ProfileCard title="Interests" icon={Grid} onEdit={() => setEditOpen(true)}>
        {interests.length > 0 ? (
          <div style={tagWrapStyle}>
            {interests.map((tag) => (
              <span key={tag} style={tagStyle}>
                {tag}
                <button
                  type="button"
                  onClick={() => remove(tag)}
                  aria-label={`Remove ${tag}`}
                  style={tagCloseStyle}
                >
                  <X size={12} aria-hidden />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p style={promptStyle}>No interests selected yet.</p>
        )}
      </ProfileCard>
      <ProfileEditStubPanel open={editOpen} onClose={() => setEditOpen(false)} title="Edit Interests" />
    </>
  )
}

/* ─── styles (tokens only) ─────────────────────────────────────────────── */

const nameStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 24,
  fontWeight: 600,
  lineHeight: '32px',
  color: 'var(--color-text-primary)',
}

const dividerStyle: CSSProperties = {
  height: 1,
  width: '100%',
  background: 'var(--color-border-subtle)',
}

const fieldGroupStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
}

const pillStyle: CSSProperties = {
  alignSelf: 'flex-start',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 8px',
  borderRadius: 'var(--radius-lg)',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 600,
  lineHeight: '20px',
}

const statementStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 16,
  fontStyle: 'italic',
  lineHeight: '24px',
  color: 'var(--color-text-primary)',
}

const promptStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  lineHeight: '22px',
  color: 'var(--color-text-secondary)',
}

const planTitleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 16,
  fontWeight: 600,
  lineHeight: '24px',
  color: 'var(--color-text-primary)',
}

const planRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  color: 'var(--color-accent-text)',
}

const planMetaStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  lineHeight: '22px',
  color: 'var(--color-text-primary)',
}

const upsellLinkStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--color-action)',
  textDecoration: 'none',
}

const tagWrapStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 16,
}

const tagStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 10,
  padding: '3px 15px',
  borderRadius: 'var(--radius-pill)',
  background: 'var(--color-primary-600)',
  color: 'var(--color-text-inverse)',
  fontFamily: 'var(--font-body)',
  fontSize: 16,
  lineHeight: '28px',
}

const tagCloseStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  background: 'transparent',
  border: 'none',
  color: 'color-mix(in srgb, var(--color-text-inverse) 75%, transparent)',
  cursor: 'pointer',
}
