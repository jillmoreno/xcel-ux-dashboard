import type { CSSProperties, ReactNode } from 'react'
import { BookLight, ClipboardListLight, FileCertificateLight, HouseLight } from '@/icons'
import type { AccountSectionId } from './accountSections'

/**
 * THE PROFILE PAGES' LEFT NAV (2026-11-19, Eric) — first Figma "Atlas UX Design" 754:2026 ("Profile Nav"), then reworked
 * the same day "to the same format as the admin left nav": Atlas Admin's Standard sidebar (`AtlasAdminLayout`).
 *
 * · The sidebar: white, a 1 right rule (--admin-chrome-rule), 20 / 16 / 24 padding, pinned under the global header and as
 *   tall as the window. Wider than admin's 200 so "Certificates & Transcripts" fits on its row — `PROFILE_NAV_W`.
 * · The rows are admin's own class, `.cre-admin-side-row` (tokens.css): 34 tall, 4 / 8 / 4 / 16 padding, 8 corners, a 16
 *   FA Light icon 10 from a 13/17 label in #616161; hover and the page you are on in #eceef0, the current one #3d5a73
 *   SemiBold. No chevron — admin's rows have none.
 * · Above them, the "My Account" title (the file's "Profile:", renamed) and a 1 rule under it — Eric's, kept from the
 *   Figma version. Set SHOW_TITLE false for admin's bare list.
 *
 * The four pages are the learner profile dropdown's, in its order and with its labels. ⚠ THE ICONS ARE THE FIGMA FILE'S
 * GLYPHS (house, book, file-certificate, clipboard-list) in admin's Light weight; they read like Quick Links' rather than
 * the pages' own. `PROFILE_NAV_ROWS` is the one place to change them.
 */
export const PROFILE_NAV_ROWS: readonly { id: AccountSectionId; label: string; icon: ReactNode }[] = [
  { id: 'profile', label: 'Profile', icon: <HouseLight size={16} aria-hidden /> },
  { id: 'notifications', label: 'Notifications', icon: <BookLight size={16} aria-hidden /> },
  { id: 'transcripts', label: 'Certificates & Transcripts', icon: <FileCertificateLight size={16} aria-hidden /> },
  { id: 'purchases', label: 'My Purchases', icon: <ClipboardListLight size={16} aria-hidden /> },
]

const SHOW_TITLE: boolean = true
/** The rule under the title — added and removed 2026-11-19 (Eric). */
const SHOW_RULE: boolean = false
/** Admin's sidebar is 200; this one is 248 so the longest label sits on one line beside its icon. */
export const PROFILE_NAV_W = 248

export function AtlasProfileNav({
  active,
  onSelect,
  style,
}: {
  active: AccountSectionId
  onSelect: (id: AccountSectionId) => void
  style?: CSSProperties
}) {
  return (
    /* THE COLUMN and THE NAV IN IT (2026-11-19, Eric: "on vertical scroll stop the left nav … when it reaches the top"). The
       column carries the fill and the right rule down the whole page; the nav inside it pins under the header. One
       window-tall sticky box could not stick — it was as tall as the space it had, so it scrolled away with the page. */
    <aside className="cre-profile-nav" style={{ ...COLUMN, ...style }}>
      <div style={PINNED}>
      {SHOW_TITLE ? (
        <>
          {/* "My Account" (2026-11-19, Eric) — the file's "Profile:" before. */}
          <p style={TITLE}>My Account</p>
          {/* The 1 rule under the title came off the same day (Eric) — set SHOW_RULE to bring it back. */}
          {SHOW_RULE ? <span aria-hidden style={RULE} /> : null}
        </>
      ) : null}
      <nav aria-label="My Account" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {PROFILE_NAV_ROWS.map(({ id, label, icon }) => (
          <button
            key={id}
            type="button"
            className="cre-admin-side-row"
            aria-current={id === active ? 'page' : undefined}
            onClick={() => onSelect(id)}
            style={BUTTON_RESET}
          >
            {icon}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
          </button>
        ))}
      </nav>
      </div>
    </aside>
  )
}

/* Admin's SIDEBAR (AtlasAdminLayout), at this nav's width, as two boxes — see the component. The column stretches to the
   page's height with the fill and the rule; the content pins at `--atlas-header-bottom` (where the Atlas header ends — the
   shell sets it) as admin's sidebar pins under its header. */
const COLUMN: CSSProperties = {
  alignSelf: 'stretch',
  boxSizing: 'border-box',
  width: PROFILE_NAV_W,
  flex: 'none',
  background: 'var(--admin-surface)',
  borderRight: '1px solid var(--admin-chrome-rule)',
}
const PINNED: CSSProperties = {
  position: 'sticky',
  top: 'var(--atlas-header-bottom, 0px)',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  padding: '20px 16px 24px',
}
/* Playfair Bold 22/24, Text Primary — 16 in, on the rows' label line. */
const TITLE: CSSProperties = {
  margin: '0 0 0 16px',
  fontFamily: 'var(--font-heading-serif)',
  fontWeight: 700,
  fontSize: 22,
  lineHeight: '24px',
  color: 'var(--color-text-primary)',
}
/* Admin's own rule colour, as the Settings divider under its rows. */
const RULE: CSSProperties = { display: 'block', height: 1, background: 'var(--admin-chrome-rule)' }
/* A <button> wearing `.cre-admin-side-row`, which was written for admin's <a>: the button's own chrome off, full width. */
const BUTTON_RESET: CSSProperties = {
  width: '100%',
  border: 'none',
  cursor: 'pointer',
  textAlign: 'left',
}
