import { useCallback, useState } from 'react'
import { Sheet } from '@/components/ui/Sheet'
import {
  ArrowLeft,
  Bell,
  Check,
  ChevronRight,
  CircleHalf,
  IdCard,
  Monitor,
  Moon,
  Sun,
  X,
} from '@/icons'
import { useTheme, type Appearance } from '@/context/ThemeContext'

type Props = {
  open: boolean
  onClose: () => void
}

type ModeMeta = {
  mode: Appearance
  label: string
  desc: string
  Icon: typeof Sun
  /** Mini preview: [page background, rail surface, rail border] */
  swatch: { page: string; rail: string; border?: string }
}

/** The appearance modes, in picker order: Light (default) · Dim · Dim / Brand ·
 *  Dark · System. Swatch rail colors mirror the tokens the shell applies; the
 *  brand rail (Dim / Brand) references the brand token so the preview matches
 *  the active brand. */
const MODES: ModeMeta[] = [
  {
    mode: 'light',
    label: 'Light',
    desc: 'White background with a matching white left navigation (Neutral 50).',
    Icon: Sun,
    swatch: { page: '#ffffff', rail: '#ffffff', border: '#e1e3e8' },
  },
  {
    mode: 'dim',
    label: 'Dim',
    desc: 'White background with a Neutral 800 dark left navigation.',
    Icon: CircleHalf,
    swatch: { page: '#ffffff', rail: 'var(--color-neutral-800)' },
  },
  {
    mode: 'dim-brand',
    label: 'Dim / Brand',
    desc: "White background with the brand's Primary 800 left navigation — on-brand.",
    Icon: CircleHalf,
    swatch: { page: '#ffffff', rail: 'var(--color-primary-800)' },
  },
  {
    mode: 'dark',
    label: 'Dark',
    desc: 'Dark background with a dark charcoal left navigation. (Graphite rail)',
    Icon: Moon,
    swatch: { page: '#1b1d21', rail: '#232427' },
  },
  {
    mode: 'system',
    label: 'System',
    desc: 'Match your device — follows your OS Light or Dark setting and switches live when it does.',
    Icon: Monitor,
    // Solid medium-gray fill (page + a slightly darker rail strip, mirroring the
    // Dark tile's structure) — "follows your device," neither light nor dark.
    swatch: { page: '#9a9fa7', rail: '#7c818a' },
  },
]

const MODE_LABEL: Record<Appearance, string> = {
  light: 'Light',
  dim: 'Dim',
  'dim-brand': 'Dim / Brand',
  dark: 'Dark',
  system: 'System',
}

/**
 * Account menu → Preferences. A right-anchored Sheet with two swappable views:
 * a root preferences list (Appearance is the live row; Notifications / Language
 * / Accessibility are stubs) and an Appearance sub-view of mode tiles that call
 * `setAppearance` immediately. Scoped to the Dashboard Rebrand shell, where the
 * appearance treatment is applied (see ThemeContext).
 */
export function AppearancePreferencesSheet({ open, onClose }: Props) {
  const { appearance, setAppearance } = useTheme()
  const [view, setView] = useState<'root' | 'appearance'>('root')

  // Reset to the root view on close so the next open always starts there
  // (the parent keeps this mounted and just toggles `open`).
  const handleClose = useCallback(() => {
    setView('root')
    onClose()
  }, [onClose])

  return (
    <Sheet open={open} onClose={handleClose} title="Preferences" width={440}>
      {view === 'root' ? (
        <>
          <SheetHeader
            title="Preferences"
            onClose={handleClose}
          />
          <div style={BODY}>
            <p style={HINT}>Manage how the platform looks and works for you.</p>
            <button type="button" className="cre-menu-item" style={ROW} onClick={() => setView('appearance')}>
              <span style={ROW_IC}><Sun size={20} aria-hidden /></span>
              <span style={ROW_TXT}>
                <span style={ROW_T}>Appearance</span>
                <span style={ROW_D}>Theme and left-navigation style</span>
              </span>
              <span style={ROW_VAL}>{MODE_LABEL[appearance]}</span>
              <ChevronRight size={16} aria-hidden style={{ color: 'var(--color-text-tertiary)' }} />
            </button>
            {STUBS.map((s) => (
              <div key={s.t} style={{ ...ROW, opacity: 0.5, cursor: 'default' }} aria-disabled>
                <span style={ROW_IC}><s.Icon size={20} aria-hidden /></span>
                <span style={ROW_TXT}>
                  <span style={ROW_T}>{s.t}</span>
                  <span style={ROW_D}>{s.d}</span>
                </span>
                <ChevronRight size={16} aria-hidden style={{ color: 'var(--color-text-tertiary)' }} />
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <SheetHeader
            title="Appearance"
            onClose={handleClose}
            onBack={() => setView('root')}
          />
          <div style={BODY}>
            <p style={HINT}>
              Choose how the platform looks. This changes the page background and the
              left-navigation style.
            </p>
            <div role="radiogroup" aria-label="Appearance mode">
              {MODES.map((m) => {
                const selected = appearance === m.mode
                return (
                  <button
                    key={m.mode}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setAppearance(m.mode)}
                    style={{
                      ...TILE,
                      borderColor: selected ? 'var(--color-secondary-500)' : 'var(--color-border-subtle)',
                      background: selected
                        ? 'color-mix(in srgb, var(--color-secondary-500) 8%, transparent)'
                        : 'transparent',
                    }}
                  >
                    <span
                      aria-hidden
                      style={{
                        ...SWATCH,
                        background: m.swatch.page,
                      }}
                    >
                      <span style={{ ...SWATCH_RAIL, background: m.swatch.rail, borderRight: m.swatch.border ? `1px solid ${m.swatch.border}` : 'none' }} />
                      <span style={SWATCH_ICON_PLATE}>
                        <m.Icon size={18} aria-hidden style={{ color: 'var(--color-secondary-600)' }} />
                      </span>
                    </span>
                    <span style={ROW_TXT}>
                      <span style={TILE_T}>{m.label}</span>
                      <span style={TILE_D}>{m.desc}</span>
                    </span>
                    <span
                      aria-hidden
                      style={{
                        ...CHECK,
                        background: selected ? 'var(--color-secondary-500)' : 'transparent',
                        borderColor: selected ? 'var(--color-secondary-500)' : 'var(--color-border-subtle)',
                        color: selected ? '#fff' : 'transparent',
                      }}
                    >
                      <Check size={13} aria-hidden />
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </Sheet>
  )
}

/* -------------------------------------------------------------------------- */

function SheetHeader({ title, onClose, onBack }: { title: string; onClose: () => void; onBack?: () => void }) {
  return (
    <header style={HEADER}>
      {onBack && (
        <button type="button" aria-label="Back to Preferences" onClick={onBack} className="cre-sheet-close" style={ICON_BTN}>
          <ArrowLeft size={18} aria-hidden />
        </button>
      )}
      <h2 style={HEADER_TITLE}>{title}</h2>
      <button type="button" aria-label={`Close ${title}`} onClick={onClose} className="cre-sheet-close" style={{ ...ICON_BTN, marginLeft: 'auto' }}>
        <X size={16} aria-hidden />
      </button>
    </header>
  )
}

const STUBS = [
  { t: 'Notifications', d: 'Email and in-app alerts', Icon: Bell },
  { t: 'Language & Region', d: 'English (US)', Icon: Monitor },
  { t: 'Accessibility', d: 'Motion, contrast, text size', Icon: IdCard },
] as const

/* ---- inline style objects (token-driven) ---- */
const HEADER: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '20px 18px 16px',
  borderBottom: '1px solid var(--color-border-subtle)',
}
const HEADER_TITLE: React.CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontSize: 18,
  fontWeight: 800,
  color: 'var(--color-text-primary)',
}
const ICON_BTN: React.CSSProperties = {
  width: 34,
  height: 34,
  display: 'grid',
  placeItems: 'center',
  border: 'none',
  background: 'transparent',
  borderRadius: 9,
  cursor: 'pointer',
  color: 'var(--color-text-secondary)',
  flex: 'none',
  padding: 0,
}
const BODY: React.CSSProperties = { padding: '14px 18px 24px', overflow: 'auto', flex: 1 }
const HINT: React.CSSProperties = {
  fontSize: 13,
  lineHeight: 1.5,
  color: 'var(--color-text-secondary)',
  margin: '2px 2px 16px',
}
const ROW: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  width: '100%',
  padding: '14px 14px',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 12,
  background: 'transparent',
  cursor: 'pointer',
  textAlign: 'left',
  marginBottom: 10,
  color: 'var(--color-text-primary)',
  fontFamily: 'var(--font-body)',
}
const ROW_IC: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 10,
  flex: 'none',
  display: 'grid',
  placeItems: 'center',
  background: 'color-mix(in srgb, var(--color-secondary-500) 16%, transparent)',
  color: 'var(--color-secondary-600)',
}
const ROW_TXT: React.CSSProperties = { flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }
const ROW_T: React.CSSProperties = { fontSize: 15, fontWeight: 700 }
const ROW_D: React.CSSProperties = { fontSize: 13, color: 'var(--color-text-secondary)' }
const ROW_VAL: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: 'var(--color-secondary-600)' }

const TILE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 14,
  width: '100%',
  padding: 16,
  border: '2px solid var(--color-border-subtle)',
  borderRadius: 14,
  cursor: 'pointer',
  textAlign: 'left',
  marginBottom: 12,
  color: 'var(--color-text-primary)',
  fontFamily: 'var(--font-body)',
}
const SWATCH: React.CSSProperties = {
  width: 52,
  height: 52,
  borderRadius: 11,
  flex: 'none',
  display: 'grid',
  placeItems: 'center',
  overflow: 'hidden',
  position: 'relative',
  border: '1px solid rgb(0 0 0 / 0.10)',
}
const SWATCH_RAIL: React.CSSProperties = {
  content: '""',
  position: 'absolute',
  left: 0,
  top: 0,
  bottom: 0,
  width: '38%',
}
/** A small opaque plate behind the mode glyph so the icon reads cleanly on every
 *  swatch — including the System tile, whose split light/dark preview would
 *  otherwise leave the glyph half-lost against the diagonal seam. */
const SWATCH_ICON_PLATE: React.CSSProperties = {
  position: 'relative',
  zIndex: 2,
  width: 30,
  height: 30,
  borderRadius: 8,
  display: 'grid',
  placeItems: 'center',
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-border-subtle)',
  boxShadow: '0 1px 3px rgb(0 0 0 / 0.18)',
}
const TILE_T: React.CSSProperties = { fontSize: 15, fontWeight: 700 }
const TILE_D: React.CSSProperties = { fontSize: 13, lineHeight: 1.45, color: 'var(--color-text-secondary)' }
const CHECK: React.CSSProperties = {
  width: 22,
  height: 22,
  borderRadius: '50%',
  flex: 'none',
  display: 'grid',
  placeItems: 'center',
  border: '2px solid var(--color-border-subtle)',
  marginTop: 2,
}
