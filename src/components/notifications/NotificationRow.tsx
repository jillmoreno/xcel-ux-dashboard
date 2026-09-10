import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { ALERT_TONES } from '@/components/ui/alertTones'
import { formatAge, type Notification } from '@/data/notificationsFixtures'

/**
 * One notification, in the bell's panel AND on the full-list page.
 *
 * Extracted the moment the second surface existed. The alternative — a
 * lookalike row on the page — is the fork this repo keeps paying for, and the
 * lesson is already written down twice: the Jump Back In card's rows became
 * the Study Plan's real `TaskRow` rather than something that merely matched
 * the visual language, and `studyStatusColors` moved so two calendars could
 * not colour a day differently. One component, two widths.
 */
export function NotificationRow({
  notification: n,
  onOpen,
  /** Roomier padding for the full-list page, which is not 380px wide. */
  size = 'compact',
}: {
  notification: Notification
  onOpen: () => void
  size?: 'compact' | 'full'
}) {
  const tone = ALERT_TONES[n.tone]
  const ToneIcon = tone.Icon
  // The tone word and the unread word are BOTH in the label. Neither is
  // carried by colour alone — the same rule the week strip's day cells follow.
  const label = `${tone.label}: ${n.title}. ${formatAge(n.hoursAgo)}.${
    n.read ? '' : ' Unread.'
  }`

  const inner = (
    <>
      {/* Unread rail. The design's 8px top border does not survive being
          stacked eight deep — it turns the list into a barcode. It becomes a
          3px LEADING rail here, which is the same "this row's tone, at the
          card's edge" idea rotated to suit a list. */}
      <span
        aria-hidden
        style={{ ...railStyle, background: n.read ? 'transparent' : tone.border }}
      />
      <span aria-hidden style={{ ...rowIconStyle, color: tone.icon }}>
        <ToneIcon size={18} aria-hidden />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={rowTopLineStyle}>
          <span style={{ ...rowTitleStyle, fontWeight: n.read ? 600 : 700 }}>{n.title}</span>
          <span style={rowAgeStyle}>{formatAge(n.hoursAgo)}</span>
        </span>
        {n.from && <span style={rowFromStyle}>{n.from}</span>}
        <span style={rowBodyStyle}>{n.body}</span>
        {n.actionLabel && (
          <span className="cre-alert-action" style={rowActionStyle}>
            {n.actionLabel} →
          </span>
        )}
      </span>
    </>
  )

  const style: CSSProperties = {
    ...rowStyle,
    ...(size === 'full' ? fullRowStyle : null),
    background: n.read ? 'transparent' : 'var(--color-neutral-extra-light)',
  }

  // A notification with somewhere to go is a link; one without is a button
  // that only marks itself read. Rendering the second as an <a href="#"> is
  // what puts dead links in a menu.
  return n.href ? (
    <Link
      to={n.href}
      onClick={onOpen}
      className="cre-notification-row"
      aria-label={label}
      style={style}
    >
      {inner}
    </Link>
  ) : (
    <button
      type="button"
      onClick={onOpen}
      className="cre-notification-row"
      aria-label={label}
      style={{
        ...style,
        width: '100%',
        textAlign: 'left',
        border: 'none',
        font: 'inherit',
        cursor: 'pointer',
      }}
    >
      {inner}
    </button>
  )
}

/* ─── styles ──────────────────────────────────────────────────────── */

const rowStyle: CSSProperties = {
  position: 'relative',
  display: 'flex',
  gap: 10,
  alignItems: 'flex-start',
  padding: '12px 16px 12px 19px',
  borderBottom: '1px solid var(--color-border-subtle)',
  textDecoration: 'none',
  color: 'inherit',
}

const fullRowStyle: CSSProperties = {
  gap: 12,
  padding: '16px 20px 16px 23px',
}

const railStyle: CSSProperties = {
  position: 'absolute',
  left: 0,
  top: 0,
  bottom: 0,
  width: 3,
}

const rowIconStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  flexShrink: 0,
  marginTop: 2,
}

const rowTopLineStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: 8,
}

const rowTitleStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  lineHeight: '20px',
  color: 'var(--color-text-primary)',
  minWidth: 0,
}

const rowAgeStyle: CSSProperties = {
  flexShrink: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--color-text-tertiary)',
  whiteSpace: 'nowrap',
}

const rowFromStyle: CSSProperties = {
  display: 'block',
  marginTop: 2,
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
}

const rowBodyStyle: CSSProperties = {
  display: 'block',
  marginTop: 2,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '19px',
  color: 'var(--color-text-secondary)',
}

const rowActionStyle: CSSProperties = {
  display: 'inline-block',
  marginTop: 6,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 600,
  // Colour comes from `.cre-alert-action` — it has to change with the theme.
}
