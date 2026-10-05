import { useSearchParams } from 'react-router-dom'
import { Check, Flag } from '@/icons'
import { useAccount } from '@/context/AccountContext'
import {
  designControlsFor,
  flagOwner,
  useFeatureFlags,
  type FeatureFlagDefinition,
} from '@/context/FeatureFlagContext'
import {
  DISCOVERABILITY_DASHBOARD_VERSIONS,
  dashboardVersionLabel,
  defaultDiscoverabilityVersionFor,
} from '@/data/dashboardVersions'
import { useFeatureFlagPanel } from '@/components/account/FeatureFlagPanelContext'
import { DemoBar, DemoDropdown } from './DemoBar'
import { useDemoMenus, DEMO_HOVER_FILL } from './demoBarUtil'

/**
 * THE DESIGN CONTROLS BAR — 2026-10-05, the direct ask.
 *
 * A second bar beside the demo one, and the split is editorial rather than
 * technical:
 *
 *   - **Demo controls** show a STAKEHOLDER how the product behaves for
 *     different learners — progress, tier, education. They are the owner's to
 *     change, which is why `DemoControlsBar` is in CLAUDE.md's protected table.
 *   - **Design controls** show a DESIGNER the decisions still open inside their
 *     own exploration — fonts, brand colour, layout axes. Any designer adds one
 *     by marking a flag `surface: 'design'`; nobody edits this file to do it.
 *
 * ⚠ THAT SPLIT IS WHY THE PROTECTION WORKS. Locking the demo bar without this
 * would have left a designer with a legitimate need and no sanctioned way to
 * meet it — which is how the collision this answers happened in the first
 * place: three Atlas/Compass controls added to the shared bar while it was
 * being restructured underneath them.
 *
 * ⚠ DESIGN SITE ONLY, never stakeholders. `PrototypeChrome` does not render it
 * on the public build at all — there is no `maturity` gate per control here,
 * because the whole SURFACE is the gate. A design decision that is worth
 * showing stakeholders belongs on the demo bar instead.
 *
 * ⚠ IT RENDERS NOTHING WHEN THE VERSION HAS NO DESIGN FLAGS, rather than an
 * empty bar. Testing 3 has none today, so the bar is invisible until somebody
 * marks a flag — which means this change is a no-op on screen until it is used,
 * and that is the honest state to ship in.
 */
export function DesignControlsBar({ fullBleed = false }: { fullBleed?: boolean }) {
  const [params] = useSearchParams()
  const { brand } = useAccount()
  const { flags, setEnabled, setVariant } = useFeatureFlags()
  const { openPanel: openFeatureFlagPanel } = useFeatureFlagPanel()
  const { openId, toggle, close, barRef } = useDemoMenus()

  /* The SAME resolution the demo bar and the flag panel use — `?version=` else
     the brand's committed default. Three readers of one fact; a fourth spelling
     would be the drift this repo keeps paying for. */
  const versionId = params.get('version') ?? defaultDiscoverabilityVersionFor(brand)
  const version = DISCOVERABILITY_DASHBOARD_VERSIONS.find((v) => v.id === versionId)
  const controls = designControlsFor(versionId, flagOwner(version ?? {}))

  if (controls.length === 0) return null

  return (
    <DemoBar
      barRef={barRef}
      ariaLabel="Design controls"
      /* ⚠ `label` OR THE BAR CALLS ITSELF "Demo Controls". It defaults to that,
         so the first render of this bar announced itself as the one it exists to
         be distinguished from — amber rule on one, green on the other, and the
         same three words on both. */
      label="Design Controls"
      align="left"
      fullBleed={fullBleed}
      design
    >
      <span style={versionTagStyle}>{dashboardVersionLabel(versionId)}</span>
      {controls.map((def) => (
        <DesignControl
          key={def.key}
          def={def}
          state={flags[def.key]}
          openId={openId}
          onToggle={toggle}
          onPick={(variant) => {
            if (variant === null) setEnabled(def.key, !flags[def.key]?.enabled)
            else setVariant(def.key, variant)
            close()
          }}
        />
      ))}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
        {/* ⚠ THE FLAG ICON MOVED HERE FROM THE DEMO BAR (2026-10-05, the direct
            choice). It opens the Feature Flag sheet, which is a designer's tool
            and shows this same version's flags — so it belongs beside the
            controls it is the long form of, not beside the stakeholder ones. */}
        <button
          type="button"
          className="cre-demo-controls-btn"
          aria-label="Feature flags"
          title="Feature flags"
          style={iconBtnStyle}
          onClick={() => {
            openFeatureFlagPanel()
            close()
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = DEMO_HOVER_FILL)}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <Flag size={16} aria-hidden />
        </button>
      </div>
    </DemoBar>
  )
}

/**
 * One flag as one control.
 *
 * ⚠ THE SHAPE COMES FROM THE FLAG, not from a per-control entry someone writes.
 * A flag with `variants` is a radiogroup; one without is an on/off. That is
 * what makes "add a design control" mean "add a flag" and nothing else.
 */
function DesignControl({
  def,
  state,
  openId,
  onToggle,
  onPick,
}: {
  def: FeatureFlagDefinition
  state?: { enabled: boolean; variant?: string }
  openId: string | null
  onToggle: (id: string) => void
  onPick: (variant: string | null) => void
}) {
  const variants = def.variants ?? []
  const current = state?.variant ?? def.defaultVariant
  const label = variants.length
    ? (variants.find((v) => v.value === current)?.label ?? current ?? 'Default')
    : state?.enabled
      ? 'On'
      : 'Off'
  return (
    <DemoDropdown
      id={def.key}
      label={label}
      eyebrow={def.label}
      openId={openId}
      onToggle={onToggle}
      panelRole="radiogroup"
      panelLabel={def.label}
      panelMinWidth={240}
    >
      {(variants.length
        ? variants.map((v) => ({ value: v.value as string | null, label: v.label }))
        : [
            { value: null, label: state?.enabled ? 'Turn off' : 'Turn on' },
          ]
      ).map((opt) => {
        const active = opt.value != null && opt.value === current
        return (
          <button
            key={opt.label}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            className={`cre-menu-item cre-demo-controls-btn${active ? ' is-active' : ''}`}
            onClick={() => onPick(opt.value)}
          >
            <span style={{ flex: 1 }}>{opt.label}</span>
            {active && <Check size={15} aria-hidden />}
          </button>
        )
      })}
    </DemoDropdown>
  )
}

/* The version this bar is scoped to, stated rather than implied — a designer
   who switches versions needs to see the controls change AND know why. */
const versionTagStyle = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.04em',
  color: 'rgba(255,255,255,0.55)',
} as const

const iconBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 34,
  height: 34,
  padding: 0,
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.3)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--color-text-inverse)',
  cursor: 'pointer',
  transition: 'background .15s',
} as const
