import { useSearchParams } from 'react-router-dom'
import { Check, Flag, Sliders } from '@/icons'
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
import { useLoFi } from '@/context/LoFiContext'
import { DemoBar, DemoDropdown } from './DemoBar'
import { useDemoMenus, DEMO_HOVER_FILL, DESIGN_ACCENT } from './demoBarUtil'

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
 * ⚠ IT IS NO LONGER DESIGN-SITE-ONLY (2026-10-06, the direct ask). It renders
 * on the Demo Hub too, and the sentence this replaces — "the whole SURFACE is
 * the gate" — has stopped being true. The gate moved a level up: the demo site
 * lists `maturity: 'ready'` VERSIONS only, and `designControlsFor` scopes every
 * control to the version on screen. So what a stakeholder may touch is still
 * chosen deliberately; it is chosen by promoting a version.
 *
 * ⚠ AND IT IS NOT ON DISPLAY THERE. On the Demo Hub the bar starts HIDDEN and
 * the robot's dropdown is the only way to it — see `demoControlsVisibility` for
 * the per-site default and `AdminToolsMenu` for the row. The prototype bar's
 * "Design" pill stays design-site-only, which is the distinction the ask turns
 * on: available is not the same as on display.
 *
 * ⚠ `stakeholder` WITHHOLDS ONE THING — the Feature Flag sheet. It opens the
 * FULL catalog, `wip` rows included, which is the single reason the robot was
 * kept off the demo site at all (2026-09-24); letting it back in through this
 * bar would have undone that gate without anyone noticing. The robot's own
 * `stakeholder` guard shuts the same door on its side, and either one left open
 * reaches the same place.
 *
 * ⚠ LO-FI CROSSES, which its old note argues FOR rather than against. That note
 * said a stakeholder "handed a control that greys the product out has been given
 * a way to break their own demo" — handed being the operative word. Two hidden
 * surfaces deep nobody is handed it, which is the same reasoning that let the
 * robot stay reachable under `?demo=1` in the first place.
 *
 * ⚠ SO THE BAR IS STILL NEVER EMPTY, on either site, and Lo-fi is what
 * guarantees it: a version with no design flags of its own still has one
 * button. If Lo-fi is ever withheld too, the null return has to come back.
 */
export function DesignControlsBar({
  fullBleed = false,
  stakeholder = false,
}: {
  fullBleed?: boolean
  /** The stakeholder's copy — the Demo Hub, and `?as=demo` previewing it. */
  stakeholder?: boolean
}) {
  const [params] = useSearchParams()
  const { brand } = useAccount()
  const { flags, setEnabled, setVariant } = useFeatureFlags()
  const { openPanel: openFeatureFlagPanel } = useFeatureFlagPanel()
  const { loFi, setLoFi } = useLoFi()
  const { openId, toggle, close, barRef } = useDemoMenus()

  /* The SAME resolution the demo bar and the flag panel use — `?version=` else
     the brand's committed default. Three readers of one fact; a fourth spelling
     would be the drift this repo keeps paying for. */
  const versionId = params.get('version') ?? defaultDiscoverabilityVersionFor(brand)
  const version = DISCOVERABILITY_DASHBOARD_VERSIONS.find((v) => v.id === versionId)
  const controls = designControlsFor(versionId, flagOwner(version ?? {}))

  /* ⚠ STILL NO NULL RETURN, on either site. It went on 2026-10-05 when Lo-fi
     moved here and made the bar impossible to empty, and Lo-fi crossing to the
     Demo Hub is what keeps that true for the stakeholder copy too. The one
     change that would bring the empty strip back is withholding Lo-fi. */

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
      {/* THE TOOLS. ⚠ THE SPLIT IS INSIDE THIS BLOCK, NOT AROUND IT
          (2026-10-06): Lo-fi crosses to the Demo Hub, the flag sheet does
          not. The header note carries the reason for each. One wrapper is
          what holds them together at the bar's right edge. */}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
        {/* LO-FI — moved here from the demo bar, 2026-10-05, the direct ask.
            Its own note on that bar always said lo-fi is "a tool for the people
            DESIGNING the thing"; this is where that sentence finally points.

            ⚠ THE SLIDERS, swapped with the version picker's grid on
            2026-10-05. It drew a grid first, on the reading that a grid IS what
            lo-fi looks like — but the grid describes a dashboard LAYOUT better,
            and that is what the other button chooses between.

            ⚠ SOLID WHEN ON IS NOW THE FILL ALONE. The grid had a `GridSolid`
            twin, so the glyph filled with the button; `Sliders` has no solid
            variant, so the state rests on the cyan background and
            `aria-pressed`. That is one cue fewer than it had — worth knowing if
            the on-state ever reads as weak, because the fix is a solid sliders
            glyph in the registry, not a different colour. */}
        <button
          type="button"
          className="cre-demo-controls-btn"
          aria-pressed={loFi}
          aria-label={loFi ? 'Lo-fi on' : 'Lo-fi off'}
          title={loFi ? 'Lo-fi on' : 'Lo-fi off'}
          style={{
            ...iconBtnStyle,
            ...(loFi
              ? {
                  background: DESIGN_ACCENT,
                  borderColor: DESIGN_ACCENT,
                  /* Dark ink on the solid cyan — the inverse token is white and
                     would measure ~1.9:1 on this fill. */
                  color: 'var(--color-primary-900)',
                }
              : null),
          }}
          onClick={() => setLoFi(!loFi)}
          onMouseEnter={(e) => {
            if (loFi) return
            e.currentTarget.style.background = DEMO_HOVER_FILL
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'
          }}
          onMouseLeave={(e) => {
            if (loFi) return
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.borderColor = 'transparent'
          }}
        >
          <Sliders size={16} aria-hidden />
        </button>
        {/* The sheet moved here from the demo bar on 2026-10-05: it shows
          this same version's flags, so it belongs beside the controls it is
          the long form of, not beside the stakeholder ones.
          ⚠ IT STOPS AT THE DESIGN SITE. It opens the FULL catalog, `wip`
          rows included — the single reason the robot was withheld from the
          demo site at all. `AdminToolsMenu` guards the same door on its
          side; this is the other half.
          ⚠ AND THIS COMMENT STAYS OUTSIDE THE `(`. A JSX comment in
          root-return position is a second root node — a parse error that
          reads like an unclosed tag, and this file has paid for it once. */}
      {stakeholder ? null : (
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
            onMouseEnter={(e) => {
              e.currentTarget.style.background = DEMO_HOVER_FILL
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.borderColor = 'transparent'
            }}
          >
            <Flag size={16} aria-hidden />
          </button>
      )}
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

/* ⚠ THE BORDER IS TRANSPARENT, NOT ABSENT — 2026-10-05, the direct ask
   ("remove the outline, show it on hover only"). A button with no border at
   rest and a 1px one on hover grows by 2px the moment a pointer touches it, and
   the row of icons beside it shifts. Reserving the box and only colouring it is
   what keeps the row still.

   ⚠ KEYBOARD USERS LOSE NOTHING. `.cre-demo-controls-btn:focus-visible` in
   `tokens.css` draws its own 1.5px outline, so focus never depended on this
   edge — which is the thing that would otherwise make "outline on hover" an
   accessibility regression rather than a style. */
const iconBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  /* ⚠ 38, MATCHING THE DEMO BAR'S CLUSTER — raised from 34 on 2026-10-05. The
     two bars' icon buttons are the same control in every other respect (same
     class, same transparent-until-hover edge, same `--color-text-inverse`) and
     sat four pixels apart, which is close enough to read as a mistake rather
     than a distinction. 38 is the measured height of Reset over there — see
     `versionTriggerStyle` in `DemoControlsBar` for why it is measured and not
     derived — so this is the design bar joining the established size, not a new
     one. Change both or neither. */
  width: 38,
  height: 38,
  padding: 0,
  background: 'transparent',
  border: '1px solid transparent',
  borderRadius: 'var(--radius-md)',
  color: 'var(--color-text-inverse)',
  cursor: 'pointer',
  transition: 'background .15s, border-color .15s',
} as const
