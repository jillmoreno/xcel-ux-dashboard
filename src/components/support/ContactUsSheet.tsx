import type { CSSProperties } from 'react'
import { Sheet } from '@/components/ui/Sheet'
import { Phone, X } from '@/icons'
import { useAccount } from '@/context/AccountContext'
import { supportConfigFor } from '@/data/support/supportFixtures'

/**
 * Contact Us slide-over (Elite "Contact Us" screen). A right-anchored Sheet
 * with the "× Close" affordance, a blue "Contact Us" title, and a "Give Us a
 * Call" block listing the brand's support phone lines (label + tel: number).
 */
export function ContactUsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { brand } = useAccount()
  const { phoneLines } = supportConfigFor(brand)

  return (
    <Sheet open={open} onClose={onClose} title="Contact Us">
      <header style={{ padding: '20px 20px 12px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <button
          type="button"
          aria-label="Close Contact Us panel"
          onClick={onClose}
          className="cre-sheet-close"
          style={closeBtnStyle}
        >
          <X size={14} aria-hidden />
          Close
        </button>
        <h2 style={titleStyle}>Contact Us</h2>
      </header>
      <div aria-hidden style={{ height: 1, background: 'var(--color-border-subtle)' }} />

      <div style={bodyStyle}>
        <div style={callHeadingRowStyle}>
          <span aria-hidden style={{ color: 'var(--color-text-primary)', display: 'inline-flex' }}>
            <Phone size={26} aria-hidden />
          </span>
          <h3 style={callHeadingStyle}>Give Us a Call</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {phoneLines.map((line) => (
            <div key={line.label}>
              <p style={lineLabelStyle}>{line.label}:</p>
              <a href={`tel:${line.number.replace(/[^\d+]/g, '')}`} style={lineNumberStyle}>
                {line.number}
              </a>
            </div>
          ))}
        </div>
      </div>
    </Sheet>
  )
}

/* ─── styles ─────────────────────────────────────────────────────────── */

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
  fontWeight: 700,
  fontSize: 28,
  lineHeight: '34px',
  color: 'var(--color-accent-text)',
}

const bodyStyle: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '24px 20px',
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
}

const callHeadingRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
}

const callHeadingStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontWeight: 700,
  fontSize: 24,
  lineHeight: '30px',
  color: 'var(--color-text-primary)',
}

const lineLabelStyle: CSSProperties = {
  margin: '0 0 2px',
  fontFamily: 'var(--font-body)',
  fontSize: 16,
  lineHeight: '24px',
  color: 'var(--color-text-secondary)',
}

const lineNumberStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 18,
  fontWeight: 700,
  lineHeight: '26px',
  color: 'var(--color-text-primary)',
  textDecoration: 'none',
}
