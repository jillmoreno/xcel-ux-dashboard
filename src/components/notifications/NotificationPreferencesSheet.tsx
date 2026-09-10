import type { CSSProperties } from 'react'
import { Sheet } from '@/components/ui/Sheet'
import { SheetHeader, SHEET_BODY } from '@/components/ui/SheetHeader'
import { Toggle } from '@/components/ui/Toggle'
import { Lock } from '@/icons'
import { useNotifications } from '@/context/NotificationsContext'
import {
  NOTIFICATION_CATEGORIES,
  type NotificationChannel,
} from '@/data/notificationsFixtures'

/**
 * Notification preferences — opened from the **Preferences** link beside
 * "Mark all read" on the full list.
 *
 * ## Category × channel, and nothing else
 *
 * Two axes and no third. The obvious third is FREQUENCY (immediate / daily
 * digest / weekly), and it is deliberately absent: a digest is a delivery
 * system, not a switch, and offering the control before the system exists is
 * how you end up with a preference the product cannot honour. Absent rather
 * than mocked — and absent silently, since a sheet that spends its last
 * paragraph explaining what it does not do reads as unfinished. A test
 * asserts there is no `combobox`, which is where that decision is recorded.
 *
 * The categories are `NotificationCategory`, **not** the alert tones. Tone is
 * how a notification looks; category is what it is about, and only the second
 * is something anybody wants a switch for — "3 tasks overdue" and "your
 * licence renews in 45 days" are both amber, and muting the first while
 * keeping the second is the entire point of this sheet.
 *
 * ## The in-app switches really work
 *
 * Turning one off removes that category from the bell AND the list, live. The
 * card that stood here before this sheet said "not designed yet" precisely so
 * it would not ship toggles that control nothing — the Membership Plan card's
 * defect, announcing a renewal date on a brand that sells no membership.
 * Wiring them to the feed keeps that promise rather than reversing it.
 *
 * **Email is stored and has nothing to demonstrate.** There is no mail in a
 * prototype. Shown anyway rather than hidden, because the real product has
 * both channels and a preferences design that shows one is not the design —
 * and the switch does hold its state, so it is a control that works with
 * nothing behind it rather than a control that does not work.
 *
 * ## One row is locked
 *
 * `Licence & renewals` is `requiredInApp`. A learner who mutes their renewal
 * deadline and misses it has a lapsed licence and a state late fee — a
 * real-world consequence no other category here can cause. The switch is
 * disabled with the reason stated beside it, which is the honest version of
 * quietly ignoring the preference. Its EMAIL switch stays live: "don't email
 * me" is a reasonable ask about a channel; "never tell me at all" is the one
 * being refused.
 */
export function NotificationPreferencesSheet({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { prefs, setPref } = useNotifications()

  return (
    <Sheet open={open} onClose={onClose} title="Notification preferences" width={520}>
      {/* `Sheet` renders no chrome — overlay, panel, scroll lock and a
          screen-reader title, then `{children}` with zero padding. The header
          and the body padding are the caller's, which is why both come from
          `SheetHeader` rather than being drawn again here. */}
      <SheetHeader title="Notification preferences" onClose={onClose} />
      <div style={SHEET_BODY}>
      <p style={introStyle}>
        Choose what reaches you, and where. Turning something off in the app removes
        it from your notifications straight away.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {NOTIFICATION_CATEGORIES.map((c) => (
          <section key={c.id} aria-label={c.label} style={rowStyle}>
            <div style={{ minWidth: 0 }}>
              <h3 style={rowTitleStyle}>{c.label}</h3>
              <p style={rowDescStyle}>{c.description}</p>
            </div>

            <div style={switchesStyle}>
              <Toggle
                id={`notif-${c.id}-in-app`}
                label={CHANNEL_LABEL['in-app']}
                checked={c.requiredInApp ? true : prefs[c.id]['in-app']}
                disabled={c.requiredInApp}
                onChange={(v) => setPref(c.id, 'in-app', v)}
                switchPosition="left"
              />
              <Toggle
                id={`notif-${c.id}-email`}
                label={CHANNEL_LABEL.email}
                checked={prefs[c.id].email}
                onChange={(v) => setPref(c.id, 'email', v)}
                switchPosition="left"
              />
            </div>

            {c.requiredInApp && (
              <p style={lockedNoteStyle}>
                <span aria-hidden style={{ marginRight: 6, verticalAlign: '-2px' }}>
                  <Lock size={12} aria-hidden />
                </span>
                Always shown in the app — a missed renewal deadline means a lapsed
                licence and a state late fee. You can still turn the emails off.
              </p>
            )}
          </section>
        ))}
      </div>

      </div>
    </Sheet>
  )
}

const CHANNEL_LABEL: Record<NotificationChannel, string> = {
  'in-app': 'Show in the app',
  email: 'Email me',
}

/* ─── styles ──────────────────────────────────────────────────────── */

const introStyle: CSSProperties = {
  margin: '0 0 16px',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  lineHeight: '21px',
  color: 'var(--color-text-secondary)',
}

const rowStyle: CSSProperties = {
  padding: '14px 0',
  borderBottom: '1px solid var(--color-border-subtle)',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}

const rowTitleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 14,
  lineHeight: '20px',
  color: 'var(--color-text-primary)',
}

const rowDescStyle: CSSProperties = {
  margin: '2px 0 0',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '19px',
  color: 'var(--color-text-secondary)',
}

// The two channel switches stack rather than sitting side by side. Side by
// side needs a column header ("In the app" / "Email") to be readable, and a
// header row over five sections is a table — which this is not, because the
// locked row carries a sentence the other four do not.
//
// Each switch's accessible name is just the channel, repeated across the five
// categories. The context comes from the `<section aria-label={c.label}>` each
// pair sits in, which screen readers announce on entry. Folding the category
// into every label instead ("Show in the app — Study plan") is unambiguous but
// renders the category name eleven times on one screen.
const switchesStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  paddingLeft: 2,
}

const lockedNoteStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  lineHeight: '17px',
  color: 'var(--color-text-tertiary)',
}


