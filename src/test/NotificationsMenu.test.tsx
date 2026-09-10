import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { NotificationsMenu } from '@/components/notifications/NotificationsMenu'
import { NotificationsPanel } from '@/components/notifications/NotificationsPanel'
import { NotificationsProvider } from '@/context/NotificationsContext'
import { ALERT_TONES, type AlertTone } from '@/components/ui/alertTones'
import {
  NOTIFICATION_CATEGORIES,
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

function renderWith(ui: React.ReactNode) {
  return render(
    <MemoryRouter>
      <AccountProvider>
        <FeatureFlagProvider>
          <NotificationsProvider>{ui}</NotificationsProvider>
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

function renderMenu() {
  return renderWith(<NotificationsMenu />)
}

/** Both surfaces at once — how the app mounts them (bell in `Header`, page in
 *  the shell's `<Outlet />`, one provider above both). */
function renderBoth() {
  return renderWith(
    <>
      <NotificationsMenu />
      <NotificationsPanel />
    </>,
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
  it('renders instead of an empty list, and KEEPS the way out', async () => {
    // A route that appears and disappears is one the learner cannot learn —
    // the same call "View all" made on the Today's Tasks card.
    seedState('empty')
    renderMenu()
    await userEvent.click(bell())
    expect(within(panel()).getByText(/all caught up/i)).toBeInTheDocument()
    expect(within(panel()).queryByRole('listitem')).toBeNull()
    expect(within(panel()).getByRole('link', { name: /View all/ })).toBeInTheDocument()
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
      within(p).getByRole('link', { name: /View all/ }),
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

describe('the bell and the full list are two views of ONE list', () => {
  /**
   * The reason `NotificationsContext` exists. Read state started as
   * `useState` inside the bell, which was correct while the bell was the only
   * surface — and became a fork the moment "View all" opened a second one:
   * clear a row in the bell, open the page, and it is unread again, with the
   * badge already down. The two would actively contradict each other.
   *
   * Asserted in BOTH directions, because a one-way check passes just as
   * happily when the page writes to a copy nobody reads.
   */
  it('marking read in the bell clears it on the page too', async () => {
    seedState('unread')
    renderBoth()
    await userEvent.click(bell())
    // Scoped to the bell's panel. Unscoped this matches the page's copy of
    // the same row too — the same ambiguity that made the Readiness chapter
    // and topic columns need `role="group"` labels.
    await userEvent.click(within(panel()).getByRole('button', { name: /^Message:/ }))
    const list = screen.getByRole('region', { name: 'Your notifications' })
    expect(within(list).queryByLabelText(/^Message:.*Unread\.$/)).toBeNull()
  })

  it('Mark all read on the PAGE clears the bell’s badge', async () => {
    seedState('unread')
    renderBoth()
    const list = screen.getByRole('region', { name: 'Your notifications' })
    await userEvent.click(within(list).getByRole('button', { name: /Mark all read/ }))
    expect(bell()).toHaveAccessibleName('Notifications — none unread')
  })

  it('renders the SAME row component on both, so they cannot drift apart', async () => {
    // Not "both show eight things" — a lookalike row passes that. The rows
    // are one component, which is what the Jump Back In card had to learn
    // when its bespoke rows became the Study Plan's real `TaskRow`.
    seedState('unread')
    renderBoth()
    await userEvent.click(bell())
    const rows = document.querySelectorAll('.cre-notification-row')
    const items = notificationsFor('xcel', 'unread')
    expect(rows).toHaveLength(items.length * 2)
  })
})

describe('the full list page', () => {
  it('counts the whole list and the unread separately', () => {
    seedState('unread')
    renderWith(<NotificationsPanel />)
    const items = notificationsFor('xcel', 'unread')
    expect(
      screen.getByText(`${items.length} total · ${unreadCount(items)} unread`),
    ).toBeInTheDocument()
  })

  it('shows the empty state rather than a bare heading over nothing', () => {
    seedState('empty')
    renderWith(<NotificationsPanel />)
    expect(screen.getByText('Nothing yet')).toBeInTheDocument()
    expect(screen.getByText(/all caught up/i)).toBeInTheDocument()
  })
})

describe('notification preferences', () => {
  const openPrefs = async () => {
    await userEvent.click(screen.getByRole('button', { name: /^Preferences$/ }))
    return screen.getByRole('dialog', { name: /Notification preferences/i })
  }

  it('a category is NOT a tone — two categories share one tone, which is why the axis is separate', () => {
    // "3 tasks are overdue" and "your licence renews in 45 days" are both
    // `warning`, and muting the first while keeping the second is the entire
    // point of the sheet. If the preferences ever key on tone instead, this
    // fails — which is the moment to notice.
    const items = notificationsFor('xcel', 'unread')
    const warnings = items.filter((n) => n.tone === 'warning')
    expect(new Set(warnings.map((n) => n.category)).size).toBeGreaterThan(1)
  })

  it('opens from the header, beside Mark all read', async () => {
    seedState('unread')
    renderWith(<NotificationsPanel />)
    const dialog = await openPrefs()
    for (const c of NOTIFICATION_CATEGORIES) {
      expect(within(dialog).getByRole('region', { name: c.label })).toBeInTheDocument()
    }
    // Two channels per category, no third. Frequency is deliberately absent.
    expect(within(dialog).getAllByRole('switch')).toHaveLength(
      NOTIFICATION_CATEGORIES.length * 2,
    )
  })

  it('stays available at zero unread, when Mark all read has gone', async () => {
    // "Turn this off" is a thing a learner wants precisely when the list is
    // quiet, so this control does not come and go with the unread count.
    seedState('all-read')
    renderWith(<NotificationsPanel />)
    expect(screen.queryByRole('button', { name: /Mark all read/ })).toBeNull()
    expect(screen.getByRole('button', { name: /^Preferences$/ })).toBeInTheDocument()
  })

  it('muting a category really removes it — from the page AND the bell', async () => {
    // The whole justification for shipping these switches. A toggle that
    // controls nothing is the Membership Plan card's defect, which is why the
    // card that stood here first said "not designed yet" instead.
    seedState('unread')
    renderBoth()
    const before = document.querySelectorAll('.cre-notification-row').length
    const dialog = await openPrefs()
    const offers = within(dialog).getByRole('region', { name: 'Offers & promotions' })
    await userEvent.click(within(offers).getByRole('switch', { name: /Show in the app/ }))
    const after = document.querySelectorAll('.cre-notification-row').length
    expect(after).toBeLessThan(before)
    expect(screen.queryByLabelText(/^Offer:/)).toBeNull()
  })

  it('says on the page that the list is filtered', async () => {
    // A filtered list that looks identical to an unfiltered one is how "where
    // did my notification go" happens. The answer is on screen, not behind
    // the sheet that caused it.
    seedState('unread')
    renderWith(<NotificationsPanel />)
    const dialog = await openPrefs()
    const offers = within(dialog).getByRole('region', { name: 'Offers & promotions' })
    await userEvent.click(within(offers).getByRole('switch', { name: /Show in the app/ }))
    expect(screen.getByText(/1 category hidden/)).toBeInTheDocument()
  })

  it('muting does not mark anything read — unmuting brings it back as it was', async () => {
    seedState('unread')
    renderWith(<NotificationsPanel />)
    const dialog = await openPrefs()
    const studyPlan = within(dialog).getByRole('region', { name: 'Study plan' })
    const sw = within(studyPlan).getByRole('switch', { name: /Show in the app/ })
    // The overdue-tasks row is the unread study-plan one.
    expect(screen.getByLabelText(/^Warning: 3 study tasks.*Unread\.$/)).toBeInTheDocument()
    await userEvent.click(sw)
    expect(screen.queryByLabelText(/^Warning: 3 study tasks/)).toBeNull()
    await userEvent.click(sw)
    expect(screen.getByLabelText(/^Warning: 3 study tasks.*Unread\.$/)).toBeInTheDocument()
  })

  it('locks the licence row in-app but NOT its email — the refusal is about the fact, not the channel', async () => {
    seedState('unread')
    renderBoth()
    const dialog = await openPrefs()
    const licence = within(dialog).getByRole('region', { name: 'Licence & renewals' })
    const inApp = within(licence).getByRole('switch', { name: /Show in the app/ })
    const email = within(licence).getByRole('switch', { name: /Email me/ })
    expect(inApp).toBeDisabled()
    expect(inApp).toBeChecked()
    expect(email).toBeEnabled()
    // The reason is stated rather than left as a dead control.
    expect(within(licence).getByText(/lapsed\s+licence/i)).toBeInTheDocument()
    // And turning the email off does not remove it from the feed.
    await userEvent.click(email)
    expect(screen.getAllByLabelText(/Florida licence renews/).length).toBeGreaterThan(0)
  })

  it('offers no frequency control — a digest is a delivery system, not a switch', async () => {
    // Recorded here rather than in the sheet's own copy. A sheet that spends
    // its last paragraph explaining what it does not do reads as unfinished;
    // this is the place that argument belongs.
    seedState('unread')
    renderWith(<NotificationsPanel />)
    const dialog = await openPrefs()
    expect(within(dialog).queryByRole('combobox')).toBeNull()
    expect(within(dialog).queryByRole('radiogroup')).toBeNull()
  })
})
