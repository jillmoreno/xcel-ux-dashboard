import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from '@/icons'
import { acquireBodyScrollLock } from '@/utils/bodyScrollLock'
import { PROFESSIONS, useAccount, type Brand, type Profession } from '@/context/AccountContext'
import { ProfessionTile } from './ProfessionTile'

function groupBySection(professions: Profession[]): { label: string; professions: Profession[] }[] {
  const groups: { label: string; professions: Profession[] }[] = []
  for (const p of professions) {
    const last = groups[groups.length - 1]
    if (last && last.label === p.label) {
      last.professions.push(p)
    } else {
      groups.push({ label: p.label, professions: [p] })
    }
  }
  return groups
}

type Props = {
  open: boolean
  onClose: () => void
}

/**
 * Left-anchored slide-over for switching the active brand / membership.
 * (Opened from the admin tools menu; all admin-tools surfaces slide in
 * from the left so they don't collide with the right-anchored account
 * menu chrome.)
 * Closes on Esc, backdrop click, or after a tile selection. Traps focus
 * while open and restores the prior focus on close.
 */
export function SwitchAccountPanel({ open, onClose }: Props) {
  const { brand, membership, setAccount } = useAccount()
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    previouslyFocused.current = (document.activeElement as HTMLElement) ?? null
    dialogRef.current?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      // Focus trap — Tab cycles within the dialog.
      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [tabindex]:not([tabindex="-1"])',
        )
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        const active = document.activeElement
        if (e.shiftKey && active === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && active === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    const releaseScrollLock = acquireBodyScrollLock()
    return () => {
      document.removeEventListener('keydown', onKey)
      releaseScrollLock()
      previouslyFocused.current?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  // Switch only the brand — membership is owned by the separate Member-view
  // toggle, so preserve whatever it's currently set to.
  const handleSelect = (b: Brand) => {
    setAccount(b, membership)
    onClose()
  }

  return createPortal(
    <div
      role="presentation"
      className="cre-sheet-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        justifyContent: 'flex-start',
        background: 'rgb(0 0 0 / 0.45)',
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="cre-sheet-panel--left"
        style={{
          width: '100%',
          maxWidth: 420,
          height: '100%',
          background: 'var(--color-surface-card)',
          boxShadow: '4px 0 16px rgb(0 0 0 / 0.18)',
          outline: 'none',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 20px 12px',
            borderBottom: '1px solid var(--color-border-subtle)',
          }}
        >
          <h2
            id={titleId}
            style={{
              margin: 0,
              fontFamily: 'var(--font-heading)',
              fontSize: 'var(--text-h3-semibold)',
              lineHeight: 'var(--text-h3-semibold--line-height)',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
            }}
          >
            Switch Brand
          </h2>
          <button
            type="button"
            aria-label="Close Switch Brand panel"
            onClick={onClose}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-pill)',
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
            }}
          >
            <X size={18} aria-hidden />
          </button>
        </header>

        <div
          style={{
            padding: '16px 20px 24px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              lineHeight: '20px',
              color: 'var(--color-text-secondary)',
            }}
          >
            Choose a brand to switch to. The catalog, navigation, and branding update in place.
            Member vs. non-member stays on the Member-view toggle.
          </p>

          {/* Group consecutive professions that share a section label —
              Real Estate / Appraisal currently holds CRE + McKissock, so the
              section header renders once with two tiles below it. */}
          {groupBySection(PROFESSIONS).map((group) => (
            <section key={group.label} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h3
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-heading)',
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--color-text-secondary)',
                }}
              >
                {group.label}
              </h3>
              {group.professions.map((p) => (
                <ProfessionTile
                  key={p.brand}
                  profession={p}
                  activeBrand={brand}
                  onSelect={handleSelect}
                />
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  )
}
