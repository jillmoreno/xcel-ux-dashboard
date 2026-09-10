import type { CSSProperties } from 'react'
import { Bell, Check, Sliders } from '@/icons'
import { NotificationRow } from './NotificationRow'
import { useNotifications } from '@/context/NotificationsContext'

/**
 * The full notification list — the account area's `notifications` section,
 * i.e. where the bell's **View all** lands.
 *
 * Registered the way Readiness was: the section already existed as an
 * `AccountSectionPlaceholder`, so this was one `renderBody` branch and no new
 * route. That sequence keeps paying off.
 *
 * **It is the same rows as the bell**, through `NotificationRow`, and the
 * same read state, through `NotificationsContext`. Two lists of one thing is
 * the fork; two views of one list is the point. The only differences are
 * roomier padding and that a row here does not close anything on click.
 *
 * ## "Notifications" means two things, and this page holds both
 *
 * The account section was already called Notifications before the bell
 * existed — and it meant **preferences** (which emails you get). The bell
 * means the **feed**. Rather than rename either out from under a reviewer,
 * the feed is the page's body and the preferences are a card beneath it, so
 * one address answers both readings of the word. The preferences card is
 * honest about being unbuilt rather than showing dead toggles: an authored
 * switch that controls nothing is the same defect as the Membership Plan
 * card announcing a renewal date on a brand that sells no membership.
 */
export function NotificationsPanel() {
  const { items, unread, markRead, markAllRead } = useNotifications()

  return (
    <div style={wrapStyle}>
      <section aria-label="Your notifications" style={cardStyle}>
        <header style={headerStyle}>
          <div style={{ minWidth: 0 }}>
            <h2 style={titleStyle}>All notifications</h2>
            {/* The count is of the WHOLE list, with unread called out
                separately — the same distinction the Today's Tasks heading
                draws between the day's total and the rows on screen. */}
            <p style={subtitleStyle}>
              {items.length === 0
                ? 'Nothing yet'
                : `${items.length} total · ${unread} unread`}
            </p>
          </div>
          {unread > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="cre-alert-action"
              style={markAllStyle}
            >
              <Check size={14} aria-hidden />
              Mark all read
            </button>
          )}
        </header>

        {items.length === 0 ? (
          <div style={emptyStyle}>
            <span aria-hidden style={{ color: 'var(--color-neutral-500)' }}>
              <Bell size={32} aria-hidden />
            </span>
            <p style={emptyTitleStyle}>You're all caught up</p>
            <p style={emptyBodyStyle}>
              Reminders about your study plan, exam readiness and licence renewal will
              show up here.
            </p>
          </div>
        ) : (
          <ul style={listStyle}>
            {items.map((n) => (
              <li key={n.id}>
                {/* No `size="compact"` here — this column is the content
                    width of the shell, not a 380px popover. */}
                <NotificationRow
                  notification={n}
                  size="full"
                  onOpen={() => markRead(n.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="Notification preferences" style={cardStyle}>
        <header style={headerStyle}>
          <div>
            <h2 style={titleStyle}>
              <span aria-hidden style={{ marginRight: 8, verticalAlign: '-2px' }}>
                <Sliders size={16} aria-hidden />
              </span>
              Preferences
            </h2>
            <p style={subtitleStyle}>
              Which of these reach you by email, and how often.
            </p>
          </div>
        </header>
        {/* Stated as unbuilt rather than mocked. Authored toggles that
            control nothing are the same defect as a Membership Plan card
            announcing a renewal on a brand with no membership — and here a
            reviewer would reasonably flip one and expect the emails to stop. */}
        <p style={notBuiltStyle}>
          Not designed yet. The channels this needs (email, SMS, in-app) and the
          per-category frequency are an open question — the study-plan reminders
          in particular are daily by default, which is the setting most likely to
          be turned off first.
        </p>
      </section>
    </div>
  )
}

/* ─── styles ──────────────────────────────────────────────────────── */

const wrapStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  // The account column is not full-bleed; this keeps a long list readable
  // rather than letting rows run the whole shell width.
  maxWidth: 780,
}

const cardStyle: CSSProperties = {
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-md)',
  background: 'var(--color-surface-card)',
  overflow: 'hidden',
}

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 12,
  padding: '16px 20px',
  borderBottom: '1px solid var(--color-border-subtle)',
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 16,
  lineHeight: '24px',
  color: 'var(--color-text-primary)',
}

const subtitleStyle: CSSProperties = {
  margin: '2px 0 0',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  color: 'var(--color-text-secondary)',
}

const markAllStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  flexShrink: 0,
  background: 'transparent',
  border: 'none',
  padding: '4px 8px',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
}

const listStyle: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
}

const emptyStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  gap: 6,
  padding: '48px 24px',
}

const emptyTitleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 15,
  color: 'var(--color-text-primary)',
}

const emptyBodyStyle: CSSProperties = {
  margin: 0,
  maxWidth: 380,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '19px',
  color: 'var(--color-text-secondary)',
}

const notBuiltStyle: CSSProperties = {
  margin: 0,
  padding: '16px 20px',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '20px',
  color: 'var(--color-text-secondary)',
}
