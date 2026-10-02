import { useEffect, useId, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { CircleUserLight, LogOut, Sliders } from '@/icons'
import { isAtlasCompassNavVersion } from '@/data/dashboardVersions'
import { Avatar } from '@/components/ui/Avatar'
import { MembershipBadge } from '@/components/ui/MembershipBadge'
import { AppearancePreferencesSheet } from '@/components/account/AppearancePreferencesSheet'
import { useAccount, type MembershipTierTone, type AvatarTierKey } from '@/context/AccountContext'
import { useProfileAvatar } from '@/context/ProfileAvatarContext'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { accountSectionsFor } from '@/components/account/accountSections'
import { tierBadgeIcon } from '@/components/ui/membershipTierBadge'


type AccountMenuProps = {
  /** Override the live initials. Optional — see the note in the body. */
  initials?: string
  /** Full name displayed in the dropdown header. */
  name?: string
  /** Email displayed under the name. */
  email?: string
  /** Avatar image URL — falls back to initials in a primary-200 circle. */
  avatarUrl?: string
  /** Show the "Pro" pill below the email. */
  isPro?: boolean
}

export function AccountMenu({
  initials: initialsProp,
  name: nameProp,
  // The ONE field with no source on the model: `DemoUser` carries a name,
  // initials and an avatar, but no email. Left as an authored default rather
  // than derived from the name — `first.last@gmail.com` would be a guess
  // rendered as a fact, which is the `addedBy` rule from the Links panel.
  email = 'alicia.navarro@gmail.com',
  avatarUrl: avatarUrlProp,
  isPro = true,
}: AccountMenuProps = {}) {
  const [open, setOpen] = useState(false)
  const [prefsOpen, setPrefsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const id = useId()
  const { pathname, search } = useLocation()
  // The Atlas/Compass header (see the glyph below).
  const atlasHeader =
    pathname === '/dashboard-rebrand' &&
    isAtlasCompassNavVersion(new URLSearchParams(search).get('version'))
  /*
   * Preferences needs BOTH conditions, and they answer different questions.
   * The route scope is a CORRECTNESS gate — the appearance treatment only
   * applies inside the Dashboard Discoverability shell, so offering the entry
   * elsewhere would open a sheet that changes nothing. The flag is the
   * editorial one: whether the appearance control is part of the product at
   * all. Default OFF (2026-09-30), so nothing renders until it is turned on.
   */
  const appearanceOn = useFeatureFlag('account-appearance-preferences').enabled
  const showPreferences = appearanceOn && pathname === '/dashboard-rebrand'
  // On the Dashboard Rebrand shell the avatar ring + Pro gem adopt the Elite
  // teal so they match the "Passport Lite" membership badge; elsewhere the
  // avatar keeps its app-wide gold/cyan tertiary treatment.
  const avatarAccent = pathname === '/dashboard-rebrand' ? 'secondary' : 'tertiary'
  // Active membership-tier label / tone / avatar treatment for the header badge
  // on the rebrand shell; elsewhere the gold "Pro" pill + tertiary avatar are
  // used instead.
  // `membership` was read here too, for the member-gated community row that
  // left with the outbound group on 2026-09-30 — see `account-menu-free-content`.
  const { brand, tierLabel, tierTone, avatarTier, user } = useAccount()
  /*
   * THE LEARNER COMES FROM CONTEXT — 2026-09-16.
   *
   * These were props with hardcoded defaults, and the comment above them said
   * "`Header` always passes the live values from `useAccount().user`". **It did
   * not.** `Header` rendered `<AccountMenu initials="SC" />` and nothing else,
   * so the defaults WERE the menu — and "SC" is not even this learner's
   * initials (Alicia Navarro → AN). Invisible while the trigger was a generic
   * glyph; the moment it shows a face and a name, a second copy of the learner
   * is a second learner.
   *
   * So the component resolves its own, from the same two sources the rail's
   * `NavProfileHeader` reads — `useAccount().user` and the profile-avatar
   * override. The two are the only places the learner appears as a person, one
   * at each end of the header row, and they cannot now disagree: uploading a
   * photo on the Profile page moves both.
   *
   * The props survive as OVERRIDES for an isolated mount (a unit test rendering
   * the menu with no AccountProvider above it), which is what they were
   * genuinely being used for.
   */
  const { avatarOverride } = useProfileAvatar()
  const name = nameProp ?? `${user.firstName} ${user.lastName}`
  const initials = initialsProp ?? user.initials
  const avatarUrl = avatarUrlProp ?? avatarOverride ?? user.avatarUrl
  // The account rows come from the CANONICAL list in accountSections.ts, shared
  // with the account sub-nav that sits beside each account page — so the
  // dropdown and the sub-nav always list the same sections in the same order.
  // Gift Recipients is brand-gated there (only brands with purchase-for-others
  // data — STC today) AND flag-gated, so the row disappears cleanly when the
  // feature is off rather than leading to an empty section.
  const giftRecipientsOn = useFeatureFlag('gift-recipients').enabled
  const items = accountSectionsFor(brand, giftRecipientsOn)
  /*
   * THE OUTBOUND GROUP LEFT ON 2026-09-30 — the four free-content rows
   * (Resource Center · What's New · the two 2026 guides) and, with them, the
   * member-gated community row that shared their group. Both sources are
   * untouched and still feed the Membership surfaces; only this menu's copy is
   * gone. See `account-menu-free-content` in archivedItems.ts.
   */

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        data-cta-id="header.account"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={id}
        aria-label={`Account menu — ${name}`}
        onClick={() => setOpen((v) => !v)}
        /* `cre-account-pill`, not `cre-icon-pill` — that one is a fixed 40×40
           square built for a single glyph, and this trigger is now an avatar
           plus a name. It keeps the pill's hover, radius and transition so the
           three header utilities still read as one cluster. */
        className="cre-account-pill"
      >
        {/* The learner's own photo, replacing a generic `CircleUser` glyph.
            NO `brandRing` and no `tier`: the rail's 48px avatar is documented
            as the ONLY call site that carries the Brick ring — it is what marks
            that as the learner — and a second ringed avatar in the same viewport
            spends the distinction rather than making it. At 28px a 2px ring is
            proportionally heavier than it is at 48, too. `Avatar` falls back to
            the initials in a tinted circle when there is no image, so a learner
            with no photo still gets a person-shaped control rather than a gap. */}
        {/* ATLAS: Font Awesome's own `circle-user` in place of the photo — Light, 20px
            (2026-10-01, the designer's request; Regular at 28 briefly) — the
            Atlas/Compass header only; every other version keeps the learner's
            own picture. */}
        {atlasHeader ? (
          <span aria-hidden style={{ display: 'inline-flex', color: 'var(--color-text-primary)' }}>
            <CircleUserLight size={20} aria-hidden />
          </span>
        ) : (
          <Avatar size={28} initials={initials} imageUrl={avatarUrl} alt={name} />
        )}
        {/* Hidden under 900px by the class's own media query: at phone widths
            the header is a logo, a hamburger and this cluster, and a full name
            is the first thing that should go. The `aria-label` above still
            carries it, so nothing is lost to assistive tech. */}
        <span className="cre-account-pill__name">{name}</span>
      </button>
      {open && (
        <div
          id={id}
          role="menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            minWidth: 280,
            background: 'var(--color-surface-card)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-popover)',
            padding: 6,
            zIndex: 50,
          }}
        >
          <ProfileHeader name={name} email={email} avatarUrl={avatarUrl} initials={initials} isPro={isPro} accent={avatarAccent} membershipLabel={tierLabel} membershipTone={tierTone} avatarTier={avatarTier} />
          <div style={{ height: 1, background: 'var(--color-border-subtle)', margin: '6px 4px' }} />
          {items.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              role="menuitem"
              to={path}
              onClick={() => setOpen(false)}
              className={({ isActive }) => `cre-menu-item${isActive ? ' is-active' : ''}`}
            >
              <span className="cre-menu-item-icon" aria-hidden>
                <Icon size={18} aria-hidden />
              </span>
              {label}
            </NavLink>
          ))}
          {/* ONE DIVIDER, ONE BOTTOM GROUP — restructured 2026-09-30 when the
              outbound rows left. Preferences used to sit in its own band with a
              rule BELOW it, which worked while a third group sat above; with
              that group gone it left Preferences stranded between two rules,
              and Logout alone under the second. Now a single rule separates the
              account destinations from the two app-level actions, and the rule
              belongs to the GROUP rather than to Preferences — so it still
              renders when the flag is off and Logout is the only row below it. */}
          <div style={{ height: 1, background: 'var(--color-border-subtle)', margin: '6px 4px' }} />
          {/* Preferences — flag-gated (`account-appearance-preferences`, default
              OFF) AND route-scoped. Opens a sheet whose Appearance sub-view
              swaps between Light / Dim / Dark / System (see
              AppearancePreferencesSheet). Closes the menu so the sheet owns
              focus; the change applies live behind the sheet. */}
          {showPreferences && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                setPrefsOpen(true)
              }}
              className="cre-menu-item"
            >
              <span className="cre-menu-item-icon" aria-hidden>
                <Sliders size={18} aria-hidden />
              </span>
              Preferences
            </button>
          )}
          {/* Logout — final row of the production account menu. The
              UI/UX Demo Tools section that used to live below this
              divider was hoisted to the hidden `AdminToolsMenu` in the
              header (left of the brand logo), so the production-facing
              account menu reads as a clean list of real account
              destinations. */}
          <Link role="menuitem" to="#" onClick={() => setOpen(false)} className="cre-menu-item">
            <span className="cre-menu-item-icon" aria-hidden>
              <LogOut size={18} aria-hidden />
            </span>
            Logout
          </Link>
        </div>
      )}
      {showPreferences && (
        <AppearancePreferencesSheet open={prefsOpen} onClose={() => setPrefsOpen(false)} />
      )}
    </div>
  )
}

function ProfileHeader({
  name,
  email,
  avatarUrl,
  initials,
  isPro,
  accent = 'tertiary',
  membershipLabel,
  membershipTone,
  avatarTier,
}: {
  name: string
  email: string
  avatarUrl?: string
  initials: string
  isPro: boolean
  accent?: 'tertiary' | 'secondary'
  /** Active membership-tier label for the secondary (rebrand) badge. */
  membershipLabel?: string | null
  /** Active membership-tier tone (rebrand only) — drives the badge color + icon. */
  membershipTone?: MembershipTierTone
  /** Active membership-tier avatar treatment (rebrand only). */
  avatarTier?: AvatarTierKey
}) {
  // On the rebrand shell the avatar + badge follow the membership-tier spec
  // (tier rings/badges + tone-colored pill); elsewhere the legacy gold "Pro"
  // treatment is kept.
  const useTierTreatment = accent === 'secondary'
  const badgeTone: MembershipTierTone = membershipTone ?? 'primary'
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        padding: '16px 12px 12px',
      }}
    >
      {useTierTreatment && avatarTier ? (
        <Avatar size={80} initials={initials} imageUrl={avatarUrl} alt={name} tier={avatarTier} />
      ) : (
        <Avatar size={80} initials={initials} imageUrl={avatarUrl} alt={name} ring pro={isPro} accent={accent} />
      )}
      <p
        style={{
          margin: 0,
          fontFamily: 'var(--font-body)',
          fontWeight: 700,
          fontSize: 16,
          lineHeight: '24px',
          color: 'var(--color-text-primary)',
        }}
      >
        {name}
      </p>
      <a
        href={`mailto:${email}`}
        style={{
          // Brand-agnostic email-link styling — see `--color-email-link*`
          // tokens. Figma B2B file QuWow9nO9nSTUE4ggE5a8A node 12523:64148:
          // 12/18 Open Sans Regular, blue (#386dbd), underline on hover with
          // a darker blue (#02568f).
          fontFamily: 'var(--font-body)',
          fontSize: 12,
          lineHeight: '18px',
          color: 'var(--color-email-link)',
          textDecoration: 'none',
          borderBottom: '1px solid transparent',
          transition: 'color 160ms ease, border-color 160ms ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--color-email-link-hover)'
          e.currentTarget.style.borderBottomColor = 'var(--color-email-link-hover)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--color-email-link)'
          e.currentTarget.style.borderBottomColor = 'transparent'
        }}
        onFocus={(e) => {
          e.currentTarget.style.color = 'var(--color-email-link-hover)'
          e.currentTarget.style.borderBottomColor = 'var(--color-email-link-hover)'
        }}
        onBlur={(e) => {
          e.currentTarget.style.color = 'var(--color-email-link)'
          e.currentTarget.style.borderBottomColor = 'transparent'
        }}
      >
        {email}
      </a>
      {isPro && (
        <span style={{ marginTop: 2 }}>
          {/* On the Dashboard Rebrand shell the badge mirrors the rail's
              "Passport Lite" teal pill; elsewhere it stays the default gold
              "Pro" pill. Driven by the same route-scoped `accent`. */}
          {useTierTreatment ? (
            // `membershipLabel` is null for a brand with no membership
            // (`tierLabelFor`), so render nothing rather than falling back to
            // "Member" — that fallback exists for an unknown tier on a brand
            // that HAS memberships, not for a brand that has none.
            membershipLabel === null ? null : (
              <MembershipBadge
                label={membershipLabel}
                tone={badgeTone}
                icon={tierBadgeIcon(badgeTone)}
              />
            )
          ) : (
            <MembershipBadge tier="pro" />
          )}
        </span>
      )}
    </div>
  )
}
