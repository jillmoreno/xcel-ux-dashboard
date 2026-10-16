import type { CSSProperties } from 'react'
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
import { Tooltip } from '@/components/ui/Tooltip'
import { DESIGN_SURFACE_LABELS, useDesignSurface } from '@/context/designSurface'
import { DemoBar, DemoDropdown } from './DemoBar'
import {
  useDemoMenus,
  DEMO_FAINT_FILL,
  DEMO_HOVER_FILL,
  DEMO_TRIGGER,
  DESIGN_ACCENT,
  SQUARE_GROUP,
  SQUARE_GROUP_CLASS,
  SQUARE_LABEL,
  SQUARE_TRIGGER,
} from './demoBarUtil'

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
  /* Which surface is on screen — Compass publishes its page, everywhere else
     is null. A control that names `surfaces` shows only on those. */
  const surface = useDesignSurface()
  const controls = designControlsFor(versionId, flagOwner(version ?? {}), surface)

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
      /* THE TOOLS. ⚠ THE SPLIT IS INSIDE THIS BLOCK, NOT AROUND IT
         (2026-10-06): Lo-fi crosses to the Demo Hub, the flag sheet does
         not. The header note carries the reason for each. One wrapper is
         what holds them together at the bar's right edge.

         ⚠ `trailing`, NOT A CHILD, SINCE 2026-10-16 — and `margin-left:
         auto` went with the move. As a child of the wrapping row these
         landed on whichever row wrapped last; the slot pins them to the
         top. */
      trailing={
        <div style={{ display: 'flex', gap: 8 }}>
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
      }
    >
      {/* The scope, named — the SURFACE when there is one, since that is what
          chose these controls, and the dashboard version otherwise. */}
      <span style={versionTagStyle}>
        {surface ? DESIGN_SURFACE_LABELS[surface] : dashboardVersionLabel(versionId)}
      </span>
      {/* The rule between groups is CSS — `.cre-bar-group + .cre-bar-group`
          in `tokens.css`, shared with the demo bar. It was rendered here as a
          sibling until 2026-10-16; adjacency does the same job, never draws a
          leading one, and cannot strand a rule beside a control that chose
          not to render. */}
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

  /*
   * ⚠ NO VARIANTS = A SWITCH YOU PRESS, NOT A MENU OF ONE — 2026-10-15,
   * Jillienne: "rubi toggle should be on/off".
   *
   * The note above has always said a flag without `variants` is an on/off, and
   * only the LABEL ever was: the pill still opened a dropdown whose whole
   * contents were a single row reading "Turn on". Two clicks and a popover to
   * flip one boolean, wearing a chevron that promises a choice of states it
   * does not have — and `role="radiogroup"` around one radio, which is not a
   * group.
   *
   * Anjani's own prototypes set the bar: `xcel-compass-nudge-journey.html`
   * draws Rubi as one button reading ON or OFF that you press. This is that,
   * on the shared bar — `role="switch"`, so the pressed state is announced
   * rather than inferred from the word.
   */
  if (!variants.length) {
    const on = Boolean(state?.enabled)
    return (
      <span className={SQUARE_GROUP_CLASS} style={SQUARE_GROUP}>
        <span style={SQUARE_LABEL}>{def.label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        className="cre-demo-controls-btn"
        /* The label beside it is `aria-hidden`-adjacent decoration as far as
           this button is concerned, so the name is restated here — "Planner:
           Rubi" and "On" read as two unrelated words to a screen reader
           walking the bar otherwise. */
        aria-label={`${def.label}: ${label}`}
        /* ⚠ BRICK WHEN ON, which IS hers: `#rubiSw.on{background:#C4122E}`.
           It is the one place her bar shouts, and it shouts for the right
           reason — ON means Rubi is present in the product, not that a
           control is selected. The segmented buttons beside it invert to
           near-white instead, so brick stays rare enough to mean something. */
        style={{ ...DEMO_TRIGGER, ...SQUARE_TRIGGER, ...(on ? SWITCH_ON : null) }}
        onClick={() => onPick(null)}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = DEMO_HOVER_FILL
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = DEMO_FAINT_FILL
        }}
      >
        <span aria-hidden>{label}</span>
      </button>
      </span>
    )
  }

  /*
   * ⚠ A FEW OPTIONS ARE A SEGMENTED GROUP, MANY ARE A DROPDOWN — 2026-10-16,
   * Jillienne, on the design bar matching Anjani's own prototype.
   *
   * Her bar (`xcel-compass-nudge-journey.html`) draws every axis as its
   * options, side by side, under a 9px uppercase label to the left: Panel is
   * `[Closed][Idle][Chatting]`, not "Panel: Closed ⌄". You see the states and
   * you pick one; the React bar hid them behind a popover and charged two
   * clicks for the same move.
   *
   * ⚠ THE THRESHOLD IS A COUNT, NOT A LIST OF FLAGS. Every one of her
   * Compass controls has two or three options, so all of them become groups;
   * Eric's `atlas-brand-skin` has TEN and `atlas-heading-font` six, and ten
   * inline buttons is not a control, it is a wall. A rule on the count means
   * nobody has to register a flag anywhere to get the right shape — the same
   * reason the shape already comes from `variants` rather than a per-control
   * entry.
   *
   * ⚠ THE ACCENT STAYS CYAN, which is the one place this deliberately does
   * NOT match her. Hers fills the chosen button with XCEL brick (#C4122E);
   * here the two bars are colour-coded on purpose — amber is the demo bar,
   * cyan is this one — and that coding is how a reviewer knows which bar they
   * are touching. Borrowing brick would borrow the other bar's register.
   */
  if (variants.length <= SEGMENTED_MAX) {
    return (
      <span className={SQUARE_GROUP_CLASS} style={SQUARE_GROUP}>
        <span style={SQUARE_LABEL}>{def.label}</span>
        {/* ⚠ ROVING TABINDEX NEEDS ARROW KEYS, or it is a trap. Only the
            CHECKED radio is tabbable — that is the ARIA pattern and it is what
            keeps a three-option group from eating three tab stops on a bar
            that has a dozen of them — but without this handler a keyboard
            user reaches the selected option and can never move off it. The
            dropdown this replaced had the same roving tabindex inside its
            popover; inline, it is the only way to the control at all. */}
        <span
          role="radiogroup"
          aria-label={def.label}
          style={SEGMENT_TRACK}
          onKeyDown={(e) => {
            const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
            if (!step) return
            e.preventDefault()
            const at = variants.findIndex((v) => v.value === current)
            // Wraps, as a radiogroup does.
            const next = variants[(at + step + variants.length) % variants.length]
            onPick(next.value)
            // Focus follows selection, or the eye and the caret disagree.
            const buttons = e.currentTarget.querySelectorAll('button')
            buttons[(at + step + variants.length) % variants.length]?.focus()
          }}
        >
          {variants.map((v) => {
            const active = v.value === current
            const button = (
              <button
                key={v.value}
                type="button"
                role="radio"
                aria-checked={active}
                tabIndex={active ? 0 : -1}
                className="cre-demo-controls-btn"
                /* ⚠ THE NAME CARRIES THE DESCRIPTION, NOT JUST THE LABEL. An
                   arm may be a single letter — Return is "A" and "B" — and a
                   bar announcing "A" and "B" tells a screen reader nothing
                   about what either does. The tooltip is for the eye; this is
                   the same sentence for everyone else. */
                aria-label={v.description ? `${v.label} — ${v.description}` : undefined}
                style={{ ...SEGMENT_BTN, ...(active ? SEGMENT_BTN_ON : null) }}
                onClick={() => onPick(v.value)}
              >
                {v.label}
              </button>
            )
            /* Only where there is something to say — a tooltip repeating the
               label it is attached to is a flicker with no content. */
            return v.description ? (
              <Tooltip key={v.value} content={v.description} placement="bottom">
                {button}
              </Tooltip>
            ) : (
              button
            )
          })}
        </span>
      </span>
    )
  }

  /* ⚠ THE NAME SITS OUTSIDE THE CONTROL, as it does on hers (2026-10-16).
     `DemoDropdown` draws an `eyebrow` INSIDE the trigger — "BRAND: Atlas ⌄" —
     which is the demo bar's shape and the reason a dropdown and a segmented
     group looked like two unrelated systems sitting on one bar. Hers names
     every group the same way: a small uppercase label, then the control. So
     the label is rendered here and the eyebrow is not passed at all; the
     trigger carries the VALUE alone. */
  /* ⚠ `square` + `eyebrow`, NOT A HAND-ROLLED WRAPPER. This branch used to
     draw its own label span beside a plain trigger, which looked identical
     and was not: `DemoDropdown`'s square mode also restates the pair in the
     trigger's `aria-label`, and doing it here by hand skipped that. The
     Nudge control announced itself as "None" — its value with nothing
     saying which axis — until this went through the shared path. */
  return (
    <DemoDropdown
      id={def.key}
      square
      eyebrow={def.label}
      label={label}
      openId={openId}
      onToggle={onToggle}
      panelRole="radiogroup"
      panelLabel={def.label}
      panelMinWidth={240}
    >
      {variants.map((v) => ({ value: v.value as string | null, label: v.label })).map((opt) => {
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

/* ── Anjani's control shape ──────────────────────────────────────────────
   Taken from `public/prototypes/xcel-compass-nudge-journey.html`'s own bar
   (2026-10-16, the direct ask: "simple squares unless a dropdown is needed …
   i want it to look more like hers"). Her rules, verbatim where they carry:

     #demoBar button            border-radius:7px; border:1px solid #343027;
                                background:#211E18; color:#D9D2C6;
                                font-size:11.5px; font-weight:600; padding:6px 9px
     #demoBar button[aria-pressed="true"]
                                background:#EFEAE0; color:#17150F; border-color:#EFEAE0
     #demoBar .lbl              font-size:9px; font-weight:700; letter-spacing:.1em;
                                text-transform:uppercase; color:#7C7365
     #demoBar .col              gap:6px

   ⚠ SQUARES, AND EACH BUTTON CARRIES ITS OWN EDGE. The version before this
   put the options inside one rounded track, which is the iOS segmented
   control and not what she drew — hers are separate bordered buttons with 6
   between them, at a 7px radius that reads as a square with the corners
   taken off.

   ⚠ SELECTED IS A LIGHT FILL, NOT THE BAR'S CYAN — and this is the thing
   that changed my mind about matching her. The worry was that her brick
   `#C4122E` would borrow the demo bar's register; her SEGMENTED buttons are
   not brick at all, they invert to near-white with dark ink. That is neutral,
   so it costs the bar nothing, and the cyan identity still sits where it
   belongs: the dot and the DESIGN CONTROLS label. Brick is hers for the
   on/off switch only, below.

   ⚠ THE COLOURS ARE TOKENS, NOT HER HEX. Her bar is one fixed dark ground;
   this one has to hold up in both themes and beside the demo bar, and a
   literal #211E18 would be a warm brown square on a neutral bar. These are
   the same relationships against the bar's own ground. */
const SEGMENTED_MAX = 3



/* No track: the buttons sit directly in the row, 6 apart, as hers do. */
const SEGMENT_TRACK: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
}

const SEGMENT_BTN: CSSProperties = {
  border: '1px solid rgb(255 255 255 / 0.14)',
  background: 'rgb(255 255 255 / 0.05)',
  color: 'rgb(255 255 255 / 0.78)',
  padding: '5px 8px',
  borderRadius: 7,
  fontSize: 10.5,
  fontWeight: 600,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: 'background .15s, color .15s, border-color .15s',
}

/* The near-white she presses to (#EFEAE0 on her ground). */
const DEMO_WHITE_FILL = 'rgb(255 255 255 / 0.92)'

/* Her inverted pressed state. */
const SEGMENT_BTN_ON: CSSProperties = {
  background: DEMO_WHITE_FILL,
  borderColor: DEMO_WHITE_FILL,
  color: 'var(--color-neutral-950)',
}

const SWITCH_ON: CSSProperties = {
  background: 'var(--color-design-bar-on)',
  borderColor: 'var(--color-design-bar-on)',
  color: 'var(--color-fixed-light)',
}


/* The version this bar is scoped to, stated rather than implied — a designer
   who switches versions needs to see the controls change AND know why. */
const versionTagStyle = {
  /* Matches the bar's own title beside it (2026-10-16) — left at 11 it would
     have been the LARGER of the two, which reads as the scope shouting over
     the bar it belongs to. */
  fontSize: 9.5,
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
