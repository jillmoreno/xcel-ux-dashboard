import { useEffect, useId, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { ArrowUpRightFromSquare, Blog, BookOpen, CircleUser, Facebook, LogOut, Podcast, Sliders } from '@/icons'
import { Avatar } from '@/components/ui/Avatar'
import { MembershipBadge } from '@/components/ui/MembershipBadge'
import { AppearancePreferencesSheet } from '@/components/account/AppearancePreferencesSheet'
import { useAccount, type MembershipTierTone, type AvatarTierKey } from '@/context/AccountContext'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { accountSectionsFor } from '@/components/account/accountSections'
import { resourcesFor, type ResourceIcon } from '@/data/membership/resourcesFixtures'
import { communityFor } from '@/data/membership/communityFixtures'
import { tierBadgeIcon } from '@/components/ui/membershipTierBadge'


type AccountMenuProps = {
  initials: string
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
  initials,
  // Defaults are CRE-era leftovers — `Header` always passes the live values
  // from `useAccount().user`, so these only surface in an isolated mount (a
  // unit test rendering the menu on its own). Repointed at XCEL's demo learner
  // so such a mount does not display a person from a brand this repo no longer
  // has. `/brand/sarah.jpg` is still the only demo portrait in public/brand.
  name = 'Alicia Navarro',
  email = 'alicia.navarro@gmail.com',
  avatarUrl = '/brand/sarah.jpg',
  isPro = true,
}: AccountMenuProps) {
  const [open, setOpen] = useState(false)
  const [prefsOpen, setPrefsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const id = useId()
  const { pathname } = useLocation()
  // The appearance treatment is scoped to the Dashboard Discoverability shell,
  // so the Preferences entry only surfaces there — offering it elsewhere would
  // have no visible effect.
  const showPreferences = pathname === '/dashboard-rebrand'
  // On the Dashboard Rebrand shell the avatar ring + Pro gem adopt the Elite
  // teal so they match the "Passport Lite" membership badge; elsewhere the
  // avatar keeps its app-wide gold/cyan tertiary treatment.
  const avatarAccent = pathname === '/dashboard-rebrand' ? 'secondary' : 'tertiary'
  // Active membership-tier label / tone / avatar treatment for the header badge
  // on the rebrand shell; elsewhere the gold "Pro" pill + tertiary avatar are
  // used instead.
  const { brand, membership, tierLabel, tierTone, avatarTier } = useAccount()
  // The account rows come from the CANONICAL list in accountSections.ts, shared
  // with the account sub-nav that sits beside each account page — so the
  // dropdown and the sub-nav always list the same sections in the same order.
  // Gift Recipients is brand-gated there (only brands with purchase-for-others
  // data — STC today) AND flag-gated, so the row disappears cleanly when the
  // feature is off rather than leading to an empty section.
  const giftRecipientsOn = useFeatureFlag('gift-recipients').enabled
  const items = accountSectionsFor(brand, giftRecipientsOn)
  // Free content (the blog, the podcast) lives HERE rather than in the left
  // rail. These are the only outbound destinations in the menu, and they are
  // open to everyone — no membership, no gate — so they sit in their own group
  // below the account destinations rather than among them. Brand-keyed, so a
  // brand with none (`[]`) shows no group and no stray divider.
  const freeContent = resourcesFor(brand)
  // The community group sits in the SAME menu group but comes from its own
  // fixture and is **member-gated** — it is the one item here that membership
  // actually buys. It deliberately does NOT live in `resourcesFor`: mixing a
  // gated item into that list is what made the old External Resources page
  // unreadable (two open links beside one locked card), and the fixture doc
  // says so. Non-members don't see it at all rather than seeing a link they can't
  // use — the Membership page is where they're sold it.
  const community = membership === 'member' ? communityFor(brand) : null
  const outboundRows = [
    ...freeContent.map((r) => ({ id: r.id, label: r.title, href: r.href, icon: r.icon })),
    ...(community
      ? [
          {
            id: community.id,
            label: community.shortName ?? community.name,
            href: community.href,
            icon: community.icon,
          },
        ]
      : []),
  ]

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
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={id}
        aria-label={`Account menu — ${name}`}
        onClick={() => setOpen((v) => !v)}
        className="cre-icon-pill"
      >
        <CircleUser size={20} aria-hidden />
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
          {/* Free content — outbound, open to everyone. Real anchors, not
              NavLinks: the destination is another site, so they keep href,
              middle-click and the "opens in a new tab" announcement. The
              trailing glyph marks them as leaving the app, which is the one
              thing a nav row otherwise promises it won't do. */}
          {outboundRows.length > 0 && (
            <>
              <div style={{ height: 1, background: 'var(--color-border-subtle)', margin: '6px 4px' }} />
              {outboundRows.map((row) => {
                const RowGlyph = FREE_CONTENT_ICONS[row.icon]
                return (
                  <a
                    key={row.id}
                    role="menuitem"
                    href={row.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setOpen(false)}
                    className="cre-menu-item"
                    aria-label={`${row.label} (opens in a new tab)`}
                  >
                    <span className="cre-menu-item-icon" aria-hidden>
                      <RowGlyph size={18} aria-hidden />
                    </span>
                    {row.label}
                    <ArrowUpRightFromSquare
                      size={12}
                      aria-hidden
                      style={{ marginLeft: 'auto', opacity: 0.55 }}
                    />
                  </a>
                )
              })}
            </>
          )}
          {/* Preferences — only inside the Dashboard Discoverability feature,
              where the appearance treatment actually applies. Opens a sheet
              whose Appearance sub-view swaps between Light / Dim / Dark / System
              (see AppearancePreferencesSheet). Closes the menu so the sheet owns
              focus; the change applies live behind the sheet. */}
          {showPreferences && (
            <>
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
              <div style={{ height: 1, background: 'var(--color-border-subtle)', margin: '6px 4px' }} />
            </>
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

/** Same glyph map the resource cards use, so a row and its destination agree.
 *  Shared by the free rows and the member-only community row — both are
 *  outbound, so they read as one group even though their gating differs. */
const FREE_CONTENT_ICONS: Record<ResourceIcon, typeof Blog> = {
  blog: Blog,
  book: BookOpen,
  podcast: Podcast,
  facebook: Facebook,
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
