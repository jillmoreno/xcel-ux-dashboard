import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { NotificationsMenu } from '@/components/notifications/NotificationsMenu'
import { ALERT_TONES, type AlertTone } from '@/components/ui/alertTones'
import {
  formatAge,
  notificationsFor,
  unreadBadgeLabel,
  unreadCount,
  UNREAD_BADGE_CAP,
  type NotificationState,
} from '@/data/notificationsFixtures'

/**
 * Seeds the demo state the way the app does — through the flag store, not by
 * prop. `ReadinessPanel.test.tsx` shipped for a day WITHOUT a
 * `FeatureFlagProvider`, so every seeded state silently rendered the catalog
 * default and the demo-state tests passed for the wrong reason. The provider
 * is not optional here for the same reason.
 */
function seedState(state: NotificationState) {
  window.localStorage.setItem(
    'cgp.featureFlags',
    JSON.stringify({ 'notification-state': { enabled: true, variant: state } }),
  )
}

function renderMenu() {
  return render(
    <MemoryRouter>
      <AccountProvider>
        <FeatureFlagProvider>
          <NotificationsMenu />
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

const bell = () => screen.getByRole('button', { name: /^Notifications —/ })
const panel = () => screen.getByRole('dialog', { name: 'Notifications' })

beforeEach(() => {
  window.localStorage.clear()
})

describe('the header bell', () => {
  it('counts UNREAD, not total — and says the number out loud', async () => {
    // The badge is a coloured pill with a digit in it; the count has to reach
    // a screen reader some other way, and the accessible name is that way.
    seedState('unread')
    renderMenu()
    const items = notificationsFor('xcel', 'unread')
    expect(items.length).toBeGreaterThan(unreadCount(items))
    expect(bell()).toHaveAccessibleName(`Notifications — ${unreadCount(items)} unread`)
  })

  it('drops the badge entirely once nothing is unread', () => {
    seedState('all-read')
    renderMenu()
    expect(bell()).toHaveAccessibleName('Notifications — none unread')
  })

  it('caps the badge rather than growing the pill', () => {
    expect(unreadBadgeLabel(UNREAD_BADGE_CAP)).toBe(String(UNREAD_BADGE_CAP))
    expect(unreadBadgeLabel(UNREAD_BADGE_CAP + 1)).toBe(`${UNREAD_BADGE_CAP}+`)
    expect(unreadBadgeLabel(400)).toBe(`${UNREAD_BADGE_CAP}+`)
  })
})

describe('opening the panel', () => {
  it('does NOT mark everything read', async () => {
    // The shortcut every notification centre reaches for, and the one that
    // destroys its only real job: coming back to something later. Guarding it
    // here because it is a one-line change to "fix" and nothing else would
    // notice.
    seedState('unread')
    renderMenu()
    const before = bell().getAttribute('aria-label')
    await userEvent.click(bell())
    expect(panel()).toBeInTheDocument()
    expect(bell()).toHaveAttribute('aria-label', before)
  })

  it('marks one row read on click, and only that row', async () => {
    seedState('unread')
    renderMenu()
    const unreadBefore = unreadCount(notificationsFor('xcel', 'unread'))
    await userEvent.click(bell())
    // The message row has no href, so it is the button — clicking it marks
    // read without navigating, which is what makes this assertable.
    await userEvent.click(screen.getByRole('button', { name: /^Message:/ }))
    expect(bell()).toHaveAccessibleName(`Notifications — ${unreadBefore - 1} unread`)
  })

  it('clears the badge on Mark all read, and hides the control once there is nothing to clear', async () => {
    seedState('unread')
    renderMenu()
    await userEvent.click(bell())
    await userEvent.click(within(panel()).getByRole('button', { name: /Mark all read/ }))
    expect(bell()).toHaveAccessibleName('Notifications — none unread')
    expect(within(panel()).queryByRole('button', { name: /Mark all read/ })).toBeNull()
  })
})

describe('the rows', () => {
  it('announce the tone in WORDS, never in colour alone', async () => {
    seedState('unread')
    renderMenu()
    await userEvent.click(bell())
    // Every tone word in the map that this fixture uses must reach the label.
    const used = new Set(notificationsFor('xcel', 'unread').map((n) => n.tone))
    for (const tone of used) {
      const word = ALERT_TONES[tone as AlertTone].label
      expect(
        within(panel()).getAllByLabelText(new RegExp(`^${word}:`)).length,
      ).toBeGreaterThan(0)
    }
  })

  it('says "Unread" in the label, so the tint and the type weight are not the only signal', async () => {
    seedState('unread')
    renderMenu()
    await userEvent.click(bell())
    const unread = unreadCount(notificationsFor('xcel', 'unread'))
    expect(within(panel()).getAllByLabelText(/Unread\.$/)).toHaveLength(unread)
  })

  it('links go somewhere in-app — a notification never leaves for a marketing site', () => {
    // The rule the Resources page had to learn the hard way, applied on the
    // way IN this time: every href is confirmed rather than plausible. A
    // notification claims to be about YOUR account, so an outbound link is a
    // category error as well as a possible 404.
    for (const n of notificationsFor('xcel', 'unread')) {
      if (!n.href) continue
      expect(n.href.startsWith('/')).toBe(true)
    }
  })
})

describe('the empty state', () => {
  it('renders instead of an empty list, and KEEPS the settings link', async () => {
    // A route that appears and disappears is one the learner cannot learn —
    // the same call "View all" made on the Today's Tasks card.
    seedState('empty')
    renderMenu()
    await userEvent.click(bell())
    expect(within(panel()).getByText(/all caught up/i)).toBeInTheDocument()
    expect(within(panel()).queryByRole('listitem')).toBeNull()
    expect(
      within(panel()).getByRole('link', { name: /Notification settings/ }),
    ).toBeInTheDocument()
  })
})

describe('formatAge', () => {
  it('stays coarse — the learner is sorting on today / not today / a while back', () => {
    expect(formatAge(0.2)).toBe('Just now')
    expect(formatAge(5)).toBe('5h ago')
    expect(formatAge(26)).toBe('Yesterday')
    expect(formatAge(74)).toBe('3 days ago')
    // Past a week it becomes a date rather than an ever-growing day count.
    expect(formatAge(24 * 9)).toMatch(/^[A-Z][a-z]{2} \d{1,2}$/)
  })
})

describe('the theme-aware action colour', () => {
  /**
   * The bug this guards was invisible to every other check: `--color-action`
   * is XCEL's Brick #9A1B1E, correct as a FILL behind white and **2.05:1** as
   * TEXT on the dark shell. tsc was clean, the component rendered, and only
   * measuring the dark theme in a browser caught it — the same shape of miss
   * as `ProgressBar` rendering at zero height with `height: 8px` still on it.
   *
   * The fix is a class (`.cre-alert-action`) whose colour swaps under
   * `[data-theme='dark']`. jsdom loads no stylesheet, so what is assertable
   * here is the wiring: the class is on, and no inline `color` is fighting
   * it. An inline colour would win the cascade and silently restore the bug.
   */
  it('routes every action-coloured label through the class, with no inline colour to override it', async () => {
    seedState('unread')
    renderMenu()
    await userEvent.click(bell())
    const p = panel()
    const actionish = [
      within(p).getByRole('button', { name: /Mark all read/ }),
      within(p).getByRole('link', { name: /Notification settings/ }),
    ]
    for (const el of actionish) {
      expect(el).toHaveClass('cre-alert-action')
      expect(el.style.color).toBe('')
    }
    // The row's own affordance text ("Open Study Plan →") is the third one.
    const rowAction = p.querySelector('span.cre-alert-action')
    expect(rowAction).not.toBeNull()
    expect((rowAction as HTMLElement).style.color).toBe('')
  })
})
