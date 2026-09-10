import { useState, type CSSProperties } from 'react'
import { Bell, Check, Sliders } from '@/icons'
import { NotificationRow } from './NotificationRow'
import { NotificationPreferencesSheet } from './NotificationPreferencesSheet'
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
 * the page IS the feed and the preferences open as a sheet over it, from a
 * link in this header. So one address answers both readings of the word and
 * the settings are one click from the thing they govern.
 *
 * **The preferences were a card that said "not designed yet" for one
 * commit**, deliberately, rather than a card of toggles that controlled
 * nothing — the Membership Plan card's defect. They are real now
 * ([`NotificationPreferencesSheet`](./NotificationPreferencesSheet.tsx)) and
 * the in-app switches genuinely filter this list, which is what earns them
 * the right to be here.
 *
 * **The header says when the list is filtered.** A muted category makes rows
 * vanish, and a filtered list that looks identical to an unfiltered one is
 * how "where did my notification go" happens. The count line carries it, so
 * the answer is on screen rather than behind the sheet.
 */
export function NotificationsPanel() {
  const { items, unread, markRead, markAllRead, mutedCount } = useNotifications()
  const [prefsOpen, setPrefsOpen] = useState(false)

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
              {mutedCount > 0 && (
                <>
                  {items.length === 0 ? '' : ' · '}
                  <span style={mutedNoteStyle}>
                    {mutedCount} {mutedCount === 1 ? 'category' : 'categories'} hidden
                  </span>
                </>
              )}
            </p>
          </div>
          <div style={headerActionsStyle}>
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
            {/* Preferences sits BESIDE Mark all read rather than under the
                list, because the two are the only controls that act on the
                whole feed. It is always shown — unlike Mark all read, which
                has nothing to do at zero unread — since "turn this off" is a
                thing a learner wants precisely when the list is quiet. */}
            <button
              type="button"
              onClick={() => setPrefsOpen(true)}
              className="cre-alert-action"
              style={markAllStyle}
            >
              <Sliders size={14} aria-hidden />
              Preferences
            </button>
          </div>
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

      <NotificationPreferencesSheet open={prefsOpen} onClose={() => setPrefsOpen(false)} />
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

const headerActionsStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  flexShrink: 0,
}

const mutedNoteStyle: CSSProperties = {
  color: 'var(--color-text-tertiary)',
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

