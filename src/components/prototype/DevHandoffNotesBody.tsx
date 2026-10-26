import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useAtlasBrand } from './useAtlasBrand'
import { atlasSurfaceAttrs, ATLAS_SURFACE_VARS } from './atlasSurfaceAttrs'
import { ResponsiveWidthDemo } from './ResponsiveWidthDemo'
import type {
  DevHandoffDesignSpec,
  DevHandoffState,
  DevHandoffVariant,
  DevHandoffOption,
} from '@/data/prototypeFeatures'
import {
  detailItemStyle,
  detailListStyle,
  handoffEyebrowStyle,
  handoffMetaStyle,
  handoffProseStyle,
  handoffRowNameStyle,
  pointerLocationStyle,
} from './devHandoffStyles'
import {
  atlasHandoffResponsiveRender,
  atlasHandoffVariantRender,
  atlasHandoffIsFullWidth,
} from './atlasHandoffPreviewsRegistry'

/**
 * THE VARIANTS SECTION — every state the component can render, each one
 * pairing the authored prose with the LIVE component in that state.
 *
 * ⚠ ONE LIST, AS OF 2026-10-20. Variants used to be described in three places
 * that could disagree and did: `component.variants`, `uiUxLogic.variants`
 * (which SUPPRESSED the first whenever it existed, so "bare (combined panel)"
 * and every `when` trigger on Course Progress rendered nowhere), and a third
 * set of hand-written captions inside the preview galleries. The galleries are
 * now keyed by variant `name`, the second list has become
 * `uiUxLogic.transitions` (the moves between states, which is what it actually
 * held), and this renders the one remaining list.
 *
 * The render sits BESIDE its prose rather than in a gallery above it: the
 * question a reader has at a variant row is "what does this one look like",
 * and a separate grid makes them match names up by hand — which is how the
 * captions drifted in the first place. Columns wrap to one on narrow widths.
 */
export function DevHandoffVariantsBody({
  componentId,
  variants,
}: {
  componentId: string
  variants: DevHandoffVariant[]
}) {
  const anyRender = variants.some((v) => atlasHandoffVariantRender(componentId, v.name))
  const stacked = atlasHandoffIsFullWidth(componentId)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {variants.map((v, i) => (
        <VariantRow
          key={v.name}
          componentId={componentId}
          variant={v}
          first={i === 0}
          anyRender={anyRender}
          stacked={stacked}
        />
      ))}
    </div>
  )
}

function VariantRow({
  componentId,
  variant,
  first,
  anyRender,
  stacked = false,
}: {
  componentId: string
  variant: DevHandoffVariant
  first: boolean
  /** Put the render on its own full-width line under the prose, for the
   *  components whose render is the whole page. */
  stacked?: boolean
  /** Whether this COMPONENT has any live render at all. Drives which absence
   *  note a render-less variant gets — "nothing is wired for this component"
   *  reads very differently from "this one state can't be isolated". */
  anyRender: boolean
}) {
  const render = atlasHandoffVariantRender(componentId, variant.name)
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 20,
        alignItems: 'flex-start',
        ...(first
          ? null
          : { borderTop: '1px solid var(--color-border-subtle)', paddingTop: 20 }),
      }}
    >
      <div style={stacked ? { flex: '1 1 100%', minWidth: 0 } : renderColStyle}>
        {/* ⚠ THE NAME LEADS A STACKED ROW (2026-10-21, Jillienne: "the ui just
            looks funny, where is the default view?"). Stacked rows put the
            picture first and the prose under it, so every paragraph ended up
            sitting directly above the NEXT state's picture — the pairing was
            right in the DOM and wrong to the eye, and the default state could
            not be picked out of the run at all. Naming the state above its own
            render makes each row self-announcing. Side-by-side rows already
            have the name adjacent and do not need it twice. */}
        {stacked && <p style={{ ...handoffRowNameStyle, margin: '0 0 8px' }}>{variant.name}</p>}
        {render ? (
          <div style={variantRenderStyle}>{render}</div>
        ) : (
          <p style={variantAbsentStyle}>
            {anyRender
              ? 'No isolated render — this state is not reachable through the component’s own props. Open the Live Preview tab to see it on the real page.'
              : 'No live render for this component — it is a whole page, or its states come from the page around it rather than from its own props. The Live Preview tab shows it for real.'}
          </p>
        )}
      </div>
      <div style={stacked ? { flex: '1 1 100%', minWidth: 0 } : notesColStyle}>
        {stacked ? null : <p style={handoffRowNameStyle}>{variant.name}</p>}
        <p style={handoffMetaStyle}>{variant.when}</p>
        {variant.detail && variant.detail !== '—' && (
          <p style={handoffProseStyle}>{variant.detail}</p>
        )}
        {variant.why && (
          <p style={handoffProseStyle}>
            <b style={{ color: 'var(--color-text-primary)' }}>Why it exists. </b>
            {variant.why}
          </p>
        )}
        {variant.action && (
          <p style={handoffProseStyle}>
            <b style={{ color: 'var(--color-text-primary)' }}>Action. </b>
            {variant.action}
          </p>
        )}
        {variant.howToSee && <HowToSee>{variant.howToSee}</HowToSee>}
      </div>
    </div>
  )
}

/**
 * The reproduction pointer under a state or an option — "Demo bar → Progress
 * → Expired".
 *
 * Small, grey, and prefixed, because of what it is FOR: a dev reading the spec
 * should be able to skip every one of these, and a reviewer who wants to go
 * and look should find one wherever they stopped. It used to be the headline —
 * the `when` line was `initialLevel={1}` — which inverted exactly that.
 */
function HowToSee({ children }: { children: ReactNode }) {
  return (
    <p style={howToSeeStyle}>
      <span style={handoffEyebrowStyle}>How to see it</span>
      <span>{children}</span>
    </p>
  )
}

const howToSeeStyle: CSSProperties = {
  ...handoffMetaStyle,
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'baseline',
  gap: 8,
  margin: '10px 0 0',
}

/** The display toggles — what changes, and who turns it on. */
export function DevHandoffOptionsBody({ options }: { options: DevHandoffOption[] }) {
  return (
    <ul style={detailListStyle}>
      {options.map((o, i) => (
        <li
          key={o.name}
          style={{
            ...detailItemStyle,
            ...(i > 0 && { borderTop: '1px solid var(--color-border-subtle)', paddingTop: 12 }),
          }}
        >
          <span style={{ ...handoffRowNameStyle, display: 'block' }}>{o.name}</span>
          <span style={{ ...handoffProseStyle, display: 'block' }}>{o.what}</span>
          {o.howToSee && <HowToSee>{o.howToSee}</HowToSee>}
        </li>
      ))}
    </ul>
  )
}

/**
 * EVERY CTA, AND WHAT IT DOES.
 *
 * ⚠ 2026-10-21, Jillienne: "for every CTA there should be a line item
 * explaining what it does, so Course Overview: Opens the Course Overview page
 * of the Compass application."
 *
 * The states already say what the learner does in each one; this says what
 * each control IS, once, in plain terms — where it goes, or that it goes
 * nowhere yet. Set as a two-column list rather than prose because the question
 * a reader brings here is "what does THAT button do", and they arrive knowing
 * the button's name.
 */
export function DevHandoffCtasBody({ ctas }: { ctas: { name: string; does: string }[] }) {
  return (
    <ul style={detailListStyle}>
      {ctas.map((c, i) => (
        <li
          key={c.name}
          style={{
            ...detailItemStyle,
            ...(i > 0 && { borderTop: '1px solid var(--color-border-subtle)', paddingTop: 10 }),
          }}
        >
          <span style={{ ...handoffRowNameStyle, display: 'block' }}>{c.name}</span>
          <span style={{ ...handoffProseStyle, display: 'block' }}>{c.does}</span>
        </li>
      ))}
    </ul>
  )
}
















/* ⚠ THE RENDER LEADS, AND IT IS SIZED TO THE WIDEST COMPONENT (2026-10-21,
   Jillienne: "switch so the image of the component is on the left and the
   notes are on the right", then "this looks pretty bad").

   840 = the course card's own 800px plus the plate's 20px of padding either
   side. A basis of 420 looked reasonable and was not: it left the card about
   500px of content, so the long-title state wrapped to SEVEN lines and the
   cover — which stretches to the row's height by design — drew as a tall
   ribbon. The state meant to show "the title wraps" was showing "the preview
   is too narrow", which is the one thing a 1:1 render must never say.

   Both columns grow from their basis, so the row divides the detail's ~1230px
   as roughly 890 / 340 and the card renders at its true 800 with room to
   spare. Below ~1140 they wrap to a column each at full width, which is the
   right degradation: a narrow card is wrong, a stacked one is just taller. */
const renderColStyle: CSSProperties = { flex: '1 1 840px', minWidth: 0 }

const notesColStyle: CSSProperties = { flex: '1 1 300px', minWidth: 0 }

/* ⚠ NO PLATE (2026-10-21, Jillienne: "take it out of this additional
   container"). The renders used to sit on a bordered, padded, page-white
   surface. Every component here already carries the panel or card fill the
   page gives it — the course head its Primary 100 panel, Quick Links and the
   exam-date card their own borders — so the plate was a box drawn around a
   box, and its rounded border read as part of the design.

   What it was really doing was standing in for the page's own ground. The
   components that genuinely need one now carry it themselves, which is the
   same correction the course head's panel was: the surface a component is
   drawn against is part of the component's spec, not decoration the gallery
   adds. */
const variantRenderStyle: CSSProperties = {
  display: 'flex',
  /* LEFT, not centred. The column is sized for the widest component (the
     800px course head), so a 296px card centred in it drifts into the middle
     of a field of space and no two rows line up. Against the left edge every
     render starts where the heading above it does, and the slack falls
     between the component and its notes, where it reads as a gutter. */
  justifyContent: 'flex-start',
}

/* Dashed, like the Quick Summary placeholder: a solid frame at this size reads
   as a render that failed, and the whole point of this box is that there is
   nothing to render and a reason why. */
const variantAbsentStyle: CSSProperties = {
  ...handoffProseStyle,
  margin: 0,
  padding: 20,
  border: '1px dashed var(--color-border-subtle)',
  borderRadius: 'var(--radius-lg)',
}

/**
 * THE DESIGN SPEC, WITH THE VALUES SHOWN.
 *
 * ⚠ IT USED TO ONLY NAME THEM (2026-10-21). The spec said
 * `--color-primary-200` and stopped, so a developer opened `tokens.css` to find
 * out what they were building — on a page where every other section now shows
 * the real thing. Each token's value is resolved live here and drawn beside its
 * name: a swatch for a colour, the literal for anything else.
 *
 * ⚠ RESOLVED IN THE ATLAS CONTEXT, NOT THE GATEWAY'S. These tokens are
 * re-pointed by the four `data-atlas-*` attributes the product shell writes, so
 * reading them off this page would report the gateway's palette and quietly
 * disagree with the component rendered six inches above. The list is wrapped in
 * the same attribute set `AtlasSurface` uses.
 *
 * Nothing here is authored — the values cannot drift from `tokens.css`, because
 * they ARE `tokens.css`, read at render.
 */
export function DevHandoffDesignSpecBody({
  spec,
  componentId,
}: {
  spec: DevHandoffDesignSpec
  /** Drives the responsive demonstration under "Layout" — the real component at
   *  three widths, where one is registered. */
  componentId?: string
}) {
  const { brand } = useAtlasBrand()
  const scope = useRef<HTMLDivElement | null>(null)
  const [resolved, setResolved] = useState<Record<string, string>>({})

  const responsiveRender = componentId ? atlasHandoffResponsiveRender(componentId) : undefined

  const names = useMemo(
    () => [...new Set(spec.tokens.flatMap((t) => t.token.match(/--[a-z0-9-]+/g) ?? []))],
    [spec.tokens],
  )

  useEffect(() => {
    const el = scope.current
    if (!el || names.length === 0) return
    const cs = getComputedStyle(el)
    const next: Record<string, string> = {}
    for (const n of names) {
      const v = cs.getPropertyValue(n).trim()
      if (v) next[n] = v
    }
    setResolved(next)
    // `names` is a memo over the spec, so this runs once per component.
  }, [names])

  return (
    <div>
      <HandoffBlock label="Tokens">
        <div {...atlasSurfaceAttrs(brand)} style={ATLAS_SURFACE_VARS} ref={scope}>
          <ul style={detailListStyle}>
            {spec.tokens.map((t, i) => (
              <li
                key={t.role}
                style={{
                  ...detailItemStyle,
                  ...(i > 0 && {
                    borderTop: '1px solid var(--color-border-subtle)',
                    paddingTop: 10,
                  }),
                }}
              >
                <span style={{ ...handoffRowNameStyle, display: 'block' }}>{t.role}</span>
                <span style={{ ...handoffProseStyle, display: 'block' }}>{t.token}</span>
                <TokenValues
                  names={t.token.match(/--[a-z0-9-]+/g) ?? []}
                  resolved={resolved}
                />
              </li>
            ))}
          </ul>
        </div>
      </HandoffBlock>

      {((spec.responsive && spec.responsive.length > 0) || responsiveRender) && (
        <HandoffBlock label="Layout">
          {spec.responsive && spec.responsive.length > 0 && <BulletList items={spec.responsive} />}
          {responsiveRender ? <ResponsiveWidthDemo render={responsiveRender} /> : null}
        </HandoffBlock>
      )}

      {spec.states && spec.states.length > 0 && (
        <HandoffBlock label="Interaction">
          <BulletList items={spec.states} />
        </HandoffBlock>
      )}

      {spec.sources && spec.sources.length > 0 && (
        <HandoffBlock label="Source of truth">
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {spec.sources.map((src) => (
              <li key={src}>
                <code style={pointerLocationStyle}>{src}</code>
              </li>
            ))}
          </ul>
        </HandoffBlock>
      )}
    </div>
  )
}

/** The resolved value of each token named in a row — swatch, or literal. */
function TokenValues({
  names,
  resolved,
}: {
  names: string[]
  resolved: Record<string, string>
}) {
  const found = names.filter((n) => resolved[n])
  if (found.length === 0) return null
  return (
    <span style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
      {found.map((n) => {
        const value = resolved[n]
        return (
          <span key={n} style={tokenValueStyle}>
            {isColour(value) && (
              /* ⚠ A RING, NOT A BARE SQUARE. Half the Atlas palette is a
                 near-white (#f9f8f6, #eceef0) and a swatch of it on a pale
                 surface is an invisible rectangle — the border is what makes
                 "this is almost white" readable as a value rather than a gap. */
              <span aria-hidden style={{ ...swatchStyle, background: value }} />
            )}
            <code style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
              {value}
            </code>
          </span>
        )
      })}
    </span>
  )
}

/** Good enough for what tokens.css actually holds — hex, rgb(), hsl(), color-mix(). */
function isColour(value: string): boolean {
  return /^(#|rgb|hsl|color-mix|oklch)/i.test(value)
}

const tokenValueStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '2px 8px',
  borderRadius: 'var(--radius-pill)',
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-border-subtle)',
  fontSize: 12,
  color: 'var(--color-text-secondary)',
}

const swatchStyle: CSSProperties = {
  width: 12,
  height: 12,
  flex: 'none',
  borderRadius: 3,
  border: '1px solid var(--color-border-strong, var(--color-border-subtle))',
}

/**
 * A picture of ONE state, under its description in the states matrix.
 *
 * It renders the design board at a FIXED 1040px and scales that down to the
 * column, rather than letting the board reflow into a ~700px frame. The board's
 * row is a `minmax(0,1fr) auto` grid whose name and quote are inline spans, so
 * below its design width the two run into the membership cluster instead of
 * ellipsing — the picture would be documenting a collision that the real
 * component does not have. Scaling shows the layout as designed at any column
 * width, which is the whole reason to show a picture at all.
 *
 * The scale is measured rather than assumed: this column is ~1232px standalone
 * and ~1016px embedded in the UX dashboard, so a hardcoded factor is wrong in
 * one of the two places.
 *
 * Inert by construction — an illustration, not a second copy to poke at.
 */
const STATE_PREVIEW_FRAME_W = 1040

function StatePreviewFrame({ preview }: { preview: NonNullable<DevHandoffState['preview']> }) {
  const boxRef = useRef<HTMLSpanElement>(null)
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const box = boxRef.current
    if (!box) return
    const measure = () => setScale(box.clientWidth / STATE_PREVIEW_FRAME_W)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(box)
    return () => ro.disconnect()
  }, [])
  const designH = preview.height ?? 120
  return (
    <span
      ref={boxRef}
      aria-hidden
      style={{
        display: 'block',
        marginTop: 8,
        height: designH * scale,
        overflow: 'hidden',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border-subtle)',
        background: 'var(--color-surface-card)',
      }}
    >
      <iframe
        src={preview.src}
        title=""
        tabIndex={-1}
        loading="lazy"
        scrolling="no"
        style={{
          width: STATE_PREVIEW_FRAME_W,
          height: designH,
          border: 0,
          display: 'block',
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          pointerEvents: 'none',
        }}
      />
    </span>
  )
}

/**
 * THE EDGE CASES, ASKED AND ANSWERED.
 *
 * ⚠ 2026-10-21, Jillienne: "frame this section as the following: Q: What if
 * there is no Image? A: Shift the other parts of the component to the left."
 *
 * The Q and A markers use the same small-caps eyebrow as every other label on
 * the page, at a fixed width, so the questions line up down the column and a
 * reader can run an eye along the Qs without reading any of the As.
 */
export function DevHandoffStatesMatrixBody({ rows }: { rows: DevHandoffState[] }) {
  return (
    <ul style={detailListStyle}>
      {rows.map((r, i) => (
        <li
          key={r.question}
          style={{
            ...detailItemStyle,
            ...(i > 0 && { borderTop: '1px solid var(--color-border-subtle)', paddingTop: 12 }),
          }}
        >
          <QaLine label="Q" text={r.question} strong />
          <QaLine label="A" text={r.answer} />
          {r.preview && <StatePreviewFrame preview={r.preview} />}
        </li>
      ))}
    </ul>
  )
}

function QaLine({ label, text, strong }: { label: string; text: string; strong?: boolean }) {
  return (
    <span style={{ display: 'flex', gap: 10, marginTop: strong ? 0 : 6 }}>
      <span style={{ ...handoffEyebrowStyle, flex: 'none', width: 14, paddingTop: 2 }}>{label}</span>
      <span
        style={{
          ...handoffProseStyle,
          margin: 0,
          ...(strong && { fontWeight: 700, color: 'var(--color-text-primary)' }),
        }}
      >
        {text}
      </span>
    </span>
  )
}

export function HandoffBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ marginTop: 20 }}>
      <h4 style={handoffEyebrowStyle}>{label}</h4>
      <div style={{ marginTop: 8 }}>{children}</div>
    </div>
  )
}

export function BulletList({ items }: { items: string[] }) {
  return (
    <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
      {items.map((item, i) => (
        <li key={i} style={{ fontSize: 13, lineHeight: '20px', color: 'var(--color-text-secondary)' }}>
          {item}
        </li>
      ))}
    </ul>
  )
}
