import type { MouseEvent, ReactNode } from 'react'
import { Bell, ChevronDown, CircleUser, FileText, LogOut, Receipt, User } from '@/icons'
import { AtlasHeaderMenu, AtlasHeaderMenuDivider, AtlasHeaderMenuItem } from './AtlasHeaderMenu'
import './atlasHeader.css'

/**
 * ATLAS HEADER (2026-10-13) — the two-row learner header designed outside
 * this repo: Figma "Atlas UX Design" 333:594 (header), 333:620 (profile
 * dropdown), 334:594 (My Courses dropdown); reference build
 * `atlas-header/index.html`.
 *
 *   EYEBROW   24px, tinted, right-aligned: English ▾ | Help
 *   MAIN ROW  72px incl. a 1px rule: logo · Home · My Courses ▾ ……… 🔔 · 👤 Name ▾
 *
 * NOT WIRED INTO THE APP. It is a standalone component shown at
 * `/atlas-header-preview`; `Header` / `AtlasTopNav` are untouched. Whether
 * and where it replaces them is the project owner's call.
 *
 * Open in the design, so left as placeholders here:
 *   - "English" is only a trigger — the language menu is not designed.
 *   - The bell is only a button — the notifications panel is not designed.
 *   - Every destination defaults to `#`.
 *   - Desktop only: designed at 1680px, no tablet or mobile treatment.
 */

export type AtlasHeaderUser = {
  name: string
  email: string
  /** Shown in the profile dropdown; initials stand in when absent. */
  photoUrl?: string
}

export type AtlasHeaderCourse = { id: string; title: string; href?: string; onSelect?: () => void }

/** Destinations. Each defaults to `#` — none is decided yet. */
export type AtlasHeaderLinks = Partial<
  Record<'home' | 'logo' | 'help' | 'allCourses' | 'profile' | 'notifications' | 'transcripts' | 'purchases' | 'logout', string>
>

/**
 * LEARNER / ADMIN MODE in the profile menu — 2026-10-20, Eric: the Atlas
 * Admin pill's switching and links, moved into this menu in its styling.
 * The menu says which mode is on under the email — Mode: Admin / Learner,
 * the other one switching; in `admin` its links are `adminLinks`, in `learner` they are the
 * learner's own (Profile … My Purchases). Absent, the menu
 * is exactly what it was.
 */
export type AtlasHeaderMode = {
  mode: 'learner' | 'admin'
  adminLinks: readonly { label: string; href: string; icon: ReactNode }[]
  onSwitch: () => void
}

export function AtlasHeader({
  current = 'home',
  user,
  notificationCount = 0,
  courses,
  links = {},
  onLogout,
  onNavigate,
  showCourses = true,
  onHelp,
  extraNav = [],
  modeMenu,
}: {
  /** Which nav pill is filled. */
  current?: 'home' | 'courses' | null
  user: AtlasHeaderUser
  notificationCount?: number
  courses: readonly AtlasHeaderCourse[]
  links?: AtlasHeaderLinks
  onLogout?: () => void
  /** In an app with a router: called with a link's href instead of a page
   *  load. Absent, links are plain anchors. */
  onNavigate?: (href: string) => void
  /** The My Courses dropdown. Off, the nav is Home alone. */
  showCourses?: boolean
  /** HELP OPENS A SHEET, NOT A PAGE — 2026-10-14, Jillienne's request ("have
   *  the help trigger the sheet view that i use in the hybrid version"). Set,
   *  the eyebrow's Help is a button calling this; absent, it stays the link to
   *  `links.help`, as the standalone preview still has it. The sheet itself is
   *  the shared `Header`'s (`HelpSheet`), the same one Hybrid's Help opens. */
  onHelp?: () => void
  /** More pills after Home — 2026-10-20, Atlas Admin's "Admin" (Eric's
   *  request). `current` fills one; give it and leave `current` above null so
   *  Home is not filled too. Absent, the nav is exactly what it was. */
  extraNav?: readonly { label: string; href: string; current?: boolean }[]
  /** Learner / Admin mode — see `AtlasHeaderMode`. */
  modeMenu?: AtlasHeaderMode
}) {
  const to = (k: keyof AtlasHeaderLinks) => links[k] ?? '#'
  // A link's href, routed through `onNavigate` when there is one.
  const go = (k: keyof AtlasHeaderLinks) => ({
    href: to(k),
    onClick: onNavigate
      ? (e: MouseEvent) => {
          e.preventDefault()
          onNavigate(to(k))
        }
      : undefined,
  })
  const pick = (k: keyof AtlasHeaderLinks) => (onNavigate ? () => onNavigate(to(k)) : undefined)
  return (
    <div className="cre-atlas-hdr">
      {/* EYEBROW */}
      <div style={EYEBROW}>
        {/* Trigger only: the language menu is not designed yet. */}
        <button type="button" className="cre-atlas-hdr-eyebrow-link" aria-label="Language: English" aria-haspopup="menu" aria-expanded={false}>
          English
          <ChevronDown size={10} aria-hidden />
        </button>
        <span aria-hidden style={{ color: 'var(--atlas-hdr-divider-char)' }}>
          |
        </span>
        {onHelp ? (
          <button type="button" className="cre-atlas-hdr-eyebrow-link" onClick={onHelp}>
            Help
          </button>
        ) : (
          <a {...go('help')} className="cre-atlas-hdr-eyebrow-link">
            Help
          </a>
        )}
      </div>

      {/* MAIN ROW */}
      <header style={MAIN}>
        {/* `links.logo` when given, else Home — the End-to-End Demo's goes back to
            Invited Product Detail (2026-10-15). */}
        <a {...go(links.logo ? 'logo' : 'home')} className="cre-atlas-hdr-logo" aria-label="XCEL Insurance Training by Colibri — home" style={{ display: 'flex', flex: 'none' }}>
          <img src="/brand/xcel-logo.webp" alt="" width={110} height={40} style={{ display: 'block' }} />
        </a>

        <nav aria-label="Primary" style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 32 }}>
          <a {...go('home')} className="cre-atlas-hdr-pill" aria-current={current === 'home' ? 'page' : undefined}>
            Home
          </a>
          {extraNav.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={
                onNavigate
                  ? (e: MouseEvent) => {
                      e.preventDefault()
                      onNavigate(item.href)
                    }
                  : undefined
              }
              className="cre-atlas-hdr-pill"
              aria-current={item.current ? 'page' : undefined}
            >
              {item.label}
            </a>
          ))}
          {showCourses ? (
          <AtlasHeaderMenu align="left" trigger="My Courses" selected={current === 'courses'} panelStyle={COURSES_PANEL}>
            {courses.map((c) => (
              <AtlasHeaderMenuItem key={c.id} href={c.href} onSelect={c.onSelect}>
                {c.title}
              </AtlasHeaderMenuItem>
            ))}
            {courses.length ? <AtlasHeaderMenuDivider /> : null}
            <AtlasHeaderMenuItem href={to('allCourses')} onSelect={pick('allCourses')}>View all courses</AtlasHeaderMenuItem>
          </AtlasHeaderMenu>
          ) : null}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          {/* Button only: the notifications panel is not designed yet. */}
          <button
            type="button"
            className="cre-atlas-hdr-pill cre-atlas-hdr-pill--icon"
            aria-label={notificationCount ? `Notifications, ${notificationCount} unread` : 'Notifications'}
            style={{ position: 'relative' }}
          >
            {/* Glyph width (the bell's viewBox is 448×512), not a 22px square — as the icon font draws it. */}
            <Bell size={22} aria-hidden style={{ width: (22 * 448) / 512 }} />
            {notificationCount ? (
              <span aria-hidden style={BADGE}>
                {notificationCount}
              </span>
            ) : null}
          </button>

          <AtlasHeaderMenu
            align="right"
            triggerLabel={`Account menu for ${user.name}`}
            trigger={
              <>
                {/* ⚠ A STOPGAP, AND THE WRONG DIRECTION ON PURPOSE —
                    2026-10-19, Jillienne: "do the regular stopgap for now",
                    after "the weight of these do not seem to match the
                    weight of the home button".

                    THE AUDIT: Home, the bell and this pill share one class,
                    one type weight (500/14), one colour and one 30px height,
                    and both glyphs fill their box at 22px tall — so neither
                    the type nor the sizing was ever the mismatch. It is the
                    icons' FA WEIGHT, and the two disagreed with each other:
                    `Bell` is REGULAR, `CircleUserLight` was LIGHT (the
                    registry marks it "light, genuine", so the header's
                    intent was Light and the bell simply never got a light
                    version).

                    ⚠ THE RIGHT FIX IS A LIGHT BELL, not a regular account
                    icon. This matches the two to each other while moving
                    BOTH further from the Home text they are supposed to sit
                    with. It is here because the repo holds exactly one bell
                    path — FA Pro 7.2.0 Regular — `@fortawesome` is not
                    installed and CLAUDE.md rules out installing it, and a
                    hand-drawn "light" bell beside a genuine light glyph
                    would be an approximation pretending to be the real one.

                    TO UNDO: drop the FA Pro Light bell at
                    `src/icons/bell-light.svg`, export it from the registry,
                    and swap BOTH — `BellLight` above and `CircleUserLight`
                    here. Two lines and this comment goes.
                    ⚠ `AccountMenu` KEEPS THE LIGHT ONE: it is a different
                    surface, not in this row, and nothing about it was
                    asked. */}
                <CircleUser size={22} aria-hidden />
                {user.name}
              </>
            }
            panelStyle={PROFILE_PANEL}
          >
            <div style={IDENTITY}>
              <AtlasHeaderAvatar user={user} />
              <span style={{ fontSize: 16, lineHeight: '28px', fontWeight: 700, color: 'var(--atlas-hdr-name)', whiteSpace: 'nowrap' }}>{user.name}</span>
              <span style={{ fontSize: 12, lineHeight: '16px', fontWeight: 400, color: 'var(--atlas-hdr-email)', whiteSpace: 'nowrap' }}>{user.email}</span>
              {modeMenu ? (
                /* MODE: ADMIN LEARNER — 2026-10-20, Eric's request. The two
                   modes as the header's own pills at 85%; the one you are in
                   reads selected, the other switches. It is the menu's only
                   switch — the "Switch to … Mode" row went the same day. */
                <span role="group" aria-label="Mode" style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 8, fontSize: 12, lineHeight: '16px', color: 'var(--atlas-hdr-email)', whiteSpace: 'nowrap' }}>
                  {/* `baseline` above puts this on the pills' text line. */}
                  <span style={{ marginRight: 2, fontWeight: 600 }}>Mode:</span>
                  {(['admin', 'learner'] as const).map((m) => {
                    const on = modeMenu.mode === m
                    return (
                      <button
                        key={m}
                        type="button"
                        aria-pressed={on}
                        className={`cre-atlas-hdr-pill cre-atlas-hdr-pill--sm${on ? ' is-selected' : ''}`}
                        onClick={on ? undefined : modeMenu.onSwitch}
                        style={{ cursor: on ? 'default' : 'pointer' }}
                      >
                        {m === 'admin' ? 'Admin' : 'Learner'}
                      </button>
                    )
                  })}
                </span>
              ) : null}
            </div>
            <AtlasHeaderMenuDivider />
            {/* 8px under the first rule and 12px over the second —
                2026-10-20, Eric's request — so the links do not sit on
                either rule. */}
            <div style={{ padding: '8px 0 12px' }}>
              {modeMenu?.mode === 'admin' ? (
                modeMenu.adminLinks.map((l) => (
                  <AtlasHeaderMenuItem key={l.href} href={l.href} onSelect={onNavigate ? () => onNavigate(l.href) : undefined} icon={l.icon}>
                    {l.label}
                  </AtlasHeaderMenuItem>
                ))
              ) : (
                <>
                  <AtlasHeaderMenuItem href={to('profile')} onSelect={pick('profile')} icon={<User size={18} />}>
                    Profile
                  </AtlasHeaderMenuItem>
                  <AtlasHeaderMenuItem href={to('notifications')} onSelect={pick('notifications')} icon={<Bell size={18} />}>
                    Notifications
                  </AtlasHeaderMenuItem>
                  <AtlasHeaderMenuItem href={to('transcripts')} onSelect={pick('transcripts')} icon={<FileText size={18} />}>
                    Transcripts
                  </AtlasHeaderMenuItem>
                  <AtlasHeaderMenuItem href={to('purchases')} onSelect={pick('purchases')} icon={<Receipt size={18} />}>
                    My Purchases
                  </AtlasHeaderMenuItem>
                </>
              )}
            </div>
            <AtlasHeaderMenuDivider />
            <AtlasHeaderMenuItem href={to('logout')} onSelect={onLogout} icon={<LogOut size={18} />}>
              Logout
            </AtlasHeaderMenuItem>
          </AtlasHeaderMenu>
        </div>
      </header>
    </div>
  )
}

/** 80px circle: the learner's photo, else their initials on the tint. */
function AtlasHeaderAvatar({ user }: { user: AtlasHeaderUser }) {
  const box = { width: 80, height: 80, marginBottom: 8, borderRadius: '50%', flex: 'none' } as const
  if (user.photoUrl) return <img src={user.photoUrl} alt="" style={{ ...box, display: 'block', objectFit: 'cover' }} />
  const initials = user.name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return (
    <span
      aria-hidden
      style={{
        ...box,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 24,
        lineHeight: '32px',
        fontWeight: 600,
        color: 'var(--atlas-hdr-navy)',
        background: 'var(--atlas-hdr-tint)',
      }}
    >
      {initials}
    </span>
  )
}

const EYEBROW = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: 12,
  boxSizing: 'border-box',
  height: 24,
  padding: '0 36px',
  fontSize: 12,
  lineHeight: '16px',
  background: 'var(--atlas-hdr-tint)',
} as const

const MAIN = {
  display: 'flex',
  alignItems: 'center',
  boxSizing: 'border-box',
  height: 72,
  padding: '0 24px',
  background: 'var(--atlas-hdr-surface)',
  borderBottom: '1px solid var(--atlas-hdr-rule)',
} as const

/* 20px across: a 16px disc inside a 2px white ring, over the bell's top
   right — its top 4px above the bell's, as in the reference. */
const BADGE = {
  position: 'absolute',
  top: -1,
  left: 16,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 16,
  height: 16,
  padding: '0 1px',
  fontFamily: 'var(--font-body)',
  fontSize: 10,
  lineHeight: '16px',
  fontWeight: 700,
  color: 'var(--atlas-hdr-surface)',
  background: 'var(--atlas-hdr-badge)',
  border: '2px solid var(--atlas-hdr-surface)',
  borderRadius: 9999,
} as const

const COURSES_PANEL = {
  minWidth: 256,
  padding: 4,
  border: '1px solid var(--atlas-hdr-menu-rule)',
  borderRadius: 6,
} as const

const PROFILE_PANEL = {
  width: 256,
  padding: 8,
  border: '1px solid var(--atlas-hdr-rule)',
  borderRadius: 12,
} as const

const IDENTITY = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 4,
  padding: '16px 16px 24px',
} as const
