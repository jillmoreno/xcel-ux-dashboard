import { useRef, useState, type CSSProperties } from 'react'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { Toast } from '@/components/ui/Toast'
import { Avatar } from '@/components/ui/Avatar'
import { Trash, X } from '@/icons'
import { useAccount } from '@/context/AccountContext'
import { useMotivation } from '@/context/MotivationContext'
import { useProfileAvatar } from '@/context/ProfileAvatarContext'
import { MAX_STATEMENT_LENGTH } from '@/components/membership/MotivationalStatementPanel'

type Props = {
  open: boolean
  onClose: () => void
}

/**
 * "Personalize your profile" slide-over — lets the learner set a profile photo
 * (upload an image, kept in-session as a data URL) and a motivational statement.
 * Opened from the `ProfilePersonalizeBand` nudge on the Dashboard Rebrand
 * overview. Photo persists via `ProfileAvatarContext`; the statement via
 * `MotivationContext` (the same store the rail + Profile page use).
 */
export function ProfilePersonalizePanel({ open, onClose }: Props) {
  const [toastOpen, setToastOpen] = useState(false)
  return (
    <>
      <Sheet open={open} onClose={onClose} title="Personalize your profile">
        <PersonalizeFields
          key={open ? 'open' : 'closed'}
          onClose={onClose}
          onSaved={() => {
            setToastOpen(true)
            onClose()
          }}
        />
      </Sheet>
      <Toast open={toastOpen} onClose={() => setToastOpen(false)} tone="success" title="Profile updated" duration={2500}>
        Your profile photo and statement are saved.
      </Toast>
    </>
  )
}

/**
 * The panel's CONTENTS, exported so the dev-handoff preview renders the real
 * fields inline instead of a mock — the same split as `ManageMembershipBody`
 * and `MotivationalStatementFields`.
 *
 * Needed because `Sheet` is a fixed-position overlay: rendering
 * `<ProfilePersonalizePanel open />` inside a handoff page covers the page it is
 * supposed to be documented on.
 */
export function ProfilePersonalizeBody({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  return <PersonalizeFields onClose={onClose} onSaved={onSaved} />
}

function PersonalizeFields({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { user } = useAccount()
  const { statement, setStatement } = useMotivation()
  const { avatarOverride, setAvatarOverride } = useProfileAvatar()

  // Local draft state — committed on Save. The photo seeds from the current
  // override, falling back to the brand fixture photo.
  const [photo, setPhoto] = useState<string | null>(avatarOverride ?? user.avatarUrl ?? null)
  const [text, setText] = useState(statement)
  const fileRef = useRef<HTMLInputElement>(null)

  const onPick = (file: File | undefined) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPhoto(typeof reader.result === 'string' ? reader.result : null)
    reader.readAsDataURL(file)
  }

  const save = () => {
    // Only store an override when it differs from the fixture photo (keeps the
    // stored value small when the learner didn't change the photo).
    setAvatarOverride(photo && photo !== user.avatarUrl ? photo : null)
    setStatement(text.trim())
    onSaved()
  }

  return (
    <>
      <header style={{ padding: '20px 20px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button
          type="button"
          aria-label="Close Personalize your profile panel"
          onClick={onClose}
          className="cre-sheet-close"
          style={closeBtnStyle}
        >
          <X size={14} aria-hidden />
          Close
        </button>
        <h2 style={titleStyle}>Personalize your profile</h2>
      </header>
      <div aria-hidden style={{ height: 1, background: 'var(--color-border-subtle)' }} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* ── Profile photo ── */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 style={sectionTitleStyle}>Profile photo</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Avatar size={72} initials={user.initials} imageUrl={photo ?? undefined} alt="Profile photo preview" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
              <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
                Upload a photo
              </Button>
              {photo && (
                <button type="button" onClick={() => setPhoto(null)} style={linkBtnStyle}>
                  <Trash size={13} aria-hidden />
                  Remove photo
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={(e) => onPick(e.target.files?.[0])}
              style={{ display: 'none' }}
            />
          </div>
          <p style={helpStyle}>Upload a square image (JPG or PNG). It shows on your dashboard and in the left nav.</p>
        </section>

        {/* ── Motivational statement ── */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 style={sectionTitleStyle}>Motivational statement</h3>
          <p style={helpStyle}>
            A short statement to keep you motivated toward your goal — it appears in your left nav.
          </p>
          <textarea
            aria-label="Your motivational statement"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            maxLength={MAX_STATEMENT_LENGTH}
            placeholder="Enter your statement…"
            style={textareaStyle}
          />
          <p style={counterStyle}>
            {text.length}/{MAX_STATEMENT_LENGTH}
          </p>
        </section>
      </div>

      <footer style={{ padding: '24px 32px', background: 'var(--color-neutral-light)', borderBottomLeftRadius: 16, display: 'flex', gap: 32 }}>
        <Button variant="primary" size="md" onClick={save} style={footerBtnStyle}>
          Save
        </Button>
        <Button variant="secondary" size="md" onClick={onClose} style={footerBtnStyle}>
          Cancel
        </Button>
      </footer>
    </>
  )
}

const closeBtnStyle: CSSProperties = {
  alignSelf: 'flex-start',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  background: 'transparent',
  border: 'none',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 600,
  lineHeight: '20px',
  cursor: 'pointer',
  padding: 0,
}
const titleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontWeight: 600,
  fontSize: 22,
  lineHeight: '28px',
  color: 'var(--color-text-primary)',
}
const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontWeight: 600,
  fontSize: 16,
  lineHeight: '22px',
  color: 'var(--color-text-primary)',
}
const helpStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '18px',
  color: 'var(--color-text-secondary)',
}
const linkBtnStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  background: 'transparent',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-secondary-700)',
}
const textareaStyle: CSSProperties = {
  width: '100%',
  minHeight: 120,
  resize: 'vertical',
  boxSizing: 'border-box',
  padding: '12px 14px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border-subtle)',
  background: 'var(--color-surface-card)',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  lineHeight: '20px',
  color: 'var(--color-text-primary)',
}
const counterStyle: CSSProperties = {
  margin: '-6px 0 0',
  textAlign: 'right',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  lineHeight: '16px',
  color: 'var(--color-text-secondary)',
}
const footerBtnStyle: CSSProperties = {
  flex: 1,
  height: 52,
  padding: '12px 32px',
  borderRadius: 8,
  fontSize: 16,
  lineHeight: '28px',
}
