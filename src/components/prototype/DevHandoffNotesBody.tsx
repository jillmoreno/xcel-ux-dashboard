import type { CSSProperties, ReactNode } from 'react'
import type {
  DevHandoffComponent,
  DevHandoffDesignSpec,
  DevHandoffState,
  DevHandoffUserStory,
  DevHandoffVariant,
  DevHandoffOption,
  DevHandoffFlow,
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
  atlasHandoffVariantRender,
  atlasHandoffIsFullWidth,
} from './atlasHandoffPreviewsRegistry'

/**
 * The full written notes for one handoff component — location, summary,
 * and the Variants / UX logic / Data / Stubs / Accessibility blocks.
 * Rendered on the per-component detail screen
 * (`PrototypeHandoffDetailPage`). The component NAME is rendered by the
 * page as its heading, so this body starts at the location line.
 */
export function DevHandoffNotesBody({ component }: { component: DevHandoffComponent }) {
  return (
    <div>
      <code style={pointerLocationStyle}>{component.location}</code>
      <p style={{ ...handoffProseStyle, margin: '12px 0 0' }}>{component.summary}</p>

      {/* Neither the variants nor the rules are repeated here — both have
          their own section now (`DevHandoffVariantsBody`, and the Rules
          section's `BulletList` over `uxLogic`). Notes is what is left: where
          it lives, what it needs, and what is still stubbed. */}

      <HandoffBlock label="Data dependencies">
        <BulletList items={component.data} />
      </HandoffBlock>

      {component.stubs && component.stubs.length > 0 && (
        <HandoffBlock label="Stubs to wire up">
          <BulletList items={component.stubs} />
        </HandoffBlock>
      )}

      {component.a11y && component.a11y.length > 0 && (
        <HandoffBlock label="Accessibility">
          <BulletList items={component.a11y} />
        </HandoffBlock>
      )}
    </div>
  )
}

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
        <p style={handoffRowNameStyle}>{variant.name}</p>
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
 * THE LOGIC FLOWS, drawn.
 *
 * Deliberately NOT a graph-layout engine. These machines are four to six
 * states, and an auto-router spends its complexity on edge crossings that
 * never happen here while failing in ways nobody can author around. Two fixed
 * shapes instead, each of which reads as a diagram and cannot break:
 *
 *  - `decides` is a RAIL: one vertical line, each rule branching off it to the
 *    state it selects. The rail is what carries "first match wins" — the rules
 *    are visibly walked in order, which is the single fact a reader needs to
 *    predict the result and the one a bulleted list loses.
 *  - `moves` is a row per transition: the state you are in, the thing the
 *    learner does, the state you land in.
 */
export function DevHandoffFlowsBody({ flows }: { flows: DevHandoffFlow[] }) {
  return (
    // ⚠ THE PROSE METRIC IS SET ONCE, HERE, and inherited. A flow is built from
    // nested boxes — a list, a row, a column per step — and none of them is
    // text, so none of them set a size. Every one of them was therefore
    // inheriting the page's 16px, and anything that landed in a gap between the
    // chips rendered a third too large. Setting it on the root means a new
    // wrapper cannot reintroduce that.
    <div style={{ ...handoffProseStyle, margin: 0, display: 'flex', flexDirection: 'column', gap: 28 }}>
      {flows.map((flow) => (
        <div key={flow.title}>
          <p style={flowTitleStyle}>{flow.title}</p>
          {flow.intro && <p style={flowIntroStyle}>{flow.intro}</p>}

          {flow.decides && flow.decides.length > 0 && (
            <>
              <p style={flowRuleNoteStyle}>
                Checked in this order — the first rule that matches wins.
              </p>
              <ol style={railStyle}>
                {flow.decides.map((d, i) => (
                  <li key={`${d.when}-${d.show}`} style={railItemStyle}>
                    <span aria-hidden style={railDotStyle}>
                      {i + 1}
                    </span>
                    <span style={railBodyStyle}>
                      <span style={railRowStyle}>
                        <span style={conditionChipStyle}>{d.when}</span>
                        <span aria-hidden style={arrowStyle}>
                          &rarr;
                        </span>
                        <span style={stateChipStyle}>{d.show}</span>
                      </span>
                      {d.note && <span style={flowNoteStyle}>{d.note}</span>}
                    </span>
                  </li>
                ))}
              </ol>
            </>
          )}

          {flow.moves && flow.moves.length > 0 && (
            <ul style={{ ...movesListStyle, marginTop: flow.decides?.length ? 20 : 12 }}>
              {flow.moves.map((m) => (
                <li key={`${m.from}-${m.on}-${m.to}`} style={moveItemStyle}>
                  <span style={railRowStyle}>
                    <span style={stateChipStyle}>{m.from}</span>
                    <span style={moveLabelStyle}>
                      <span aria-hidden style={arrowStyle}>
                        &rarr;
                      </span>
                      <span>{m.on}</span>
                    </span>
                    <span style={stateChipStyle}>{m.to}</span>
                  </span>
                  {m.note && <span style={flowNoteStyle}>{m.note}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  )
}

const flowTitleStyle: CSSProperties = handoffRowNameStyle

const flowIntroStyle: CSSProperties = { ...handoffProseStyle, margin: '6px 0 0' }

const flowRuleNoteStyle: CSSProperties = { ...handoffEyebrowStyle, margin: '10px 0 0' }

/* The rail itself is the left border; each rule hangs off it. */
const railStyle: CSSProperties = {
  listStyle: 'none',
  margin: '10px 0 0',
  padding: '4px 0 4px 0',
  borderLeft: '2px solid var(--color-border-subtle)',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}

const railItemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 10,
  paddingLeft: 14,
}

const railDotStyle: CSSProperties = {
  flex: 'none',
  marginLeft: -24,
  width: 20,
  height: 20,
  display: 'grid',
  placeItems: 'center',
  borderRadius: '50%',
  background: 'var(--color-primary-100)',
  color: 'var(--color-primary-700)',
  fontSize: 11,
  fontWeight: 700,
}

const railBodyStyle: CSSProperties = { minWidth: 0, flex: 1 }

const railRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 8,
}

const conditionChipStyle: CSSProperties = { ...handoffProseStyle, margin: 0 }

/* The state a rule lands on is the thing a reader scans the column for, so it
   is the one element in the flow with a fill behind it. */
const stateChipStyle: CSSProperties = {
  padding: '3px 10px',
  borderRadius: 'var(--radius-pill)',
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-border-subtle)',
  fontSize: 12,
  fontWeight: 700,
  color: 'var(--color-text-primary)',
  whiteSpace: 'nowrap',
}

/* ⚠ THE ARROW HAS TO CARRY ITS OWN SIZE. Nothing between the chips sets a
   font-size, so these inherited the page's 16px and rendered a third larger
   than the text they sit between. */
const arrowStyle: CSSProperties = {
  fontSize: 13,
  lineHeight: '20px',
  color: 'var(--color-text-tertiary)',
}

const moveLabelStyle: CSSProperties = {
  ...handoffProseStyle,
  margin: 0,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
}

const movesListStyle: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}

const moveItemStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4 }

const flowNoteStyle: CSSProperties = { ...handoffMetaStyle, display: 'block' }

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
 * Token-referencing design spec for one component. Deliberately renders
 * NAMED tokens (CSS variables) rather than raw hex/px/font values, so the
 * spec points at tokens.css / Figma as the single source of truth and
 * can't drift.
 */
export function DevHandoffDesignSpecBody({ spec }: { spec: DevHandoffDesignSpec }) {
  return (
    <div>
      <HandoffBlock label="Tokens">
        <ul style={detailListStyle}>
          {spec.tokens.map((t) => (
            <li
              key={t.role}
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'baseline',
                gap: 8,
                fontSize: 13,
                lineHeight: '20px',
              }}
            >
              <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{t.role}</span>
              <code
                style={{
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  fontSize: 12,
                  color: 'var(--color-primary-700)',
                  background: 'var(--color-primary-100)',
                  borderRadius: 'var(--radius-sm, 4px)',
                  padding: '1px 6px',
                  wordBreak: 'break-word',
                }}
              >
                {t.token}
              </code>
            </li>
          ))}
        </ul>
      </HandoffBlock>

      {spec.states && spec.states.length > 0 && (
        <HandoffBlock label="States">
          <BulletList items={spec.states} />
        </HandoffBlock>
      )}

      {spec.responsive && spec.responsive.length > 0 && (
        <HandoffBlock label="Responsive & motion">
          <BulletList items={spec.responsive} />
        </HandoffBlock>
      )}

      {spec.sources && spec.sources.length > 0 && (
        <HandoffBlock label="Sources of truth">
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {spec.sources.map((s) => (
              <li key={s}>
                <code style={pointerLocationStyle}>{s}</code>
              </li>
            ))}
          </ul>
        </HandoffBlock>
      )}
    </div>
  )
}

/** Testable Definition-of-Done checklist for one component. */
/** The PO's user story: the "as a / I want / so that" clauses set out as a
 *  labelled list, then the business case and any scope notes.
 *
 *  The three clauses get small-caps labels rather than being run together as a
 *  sentence — a dev scanning for "who is this for" should find it without
 *  reading the whole paragraph, and the labels also make an unfinished story
 *  obvious (a `soThat` that merely restates `iWant` is visible immediately when
 *  the two sit under their own headings). */
export function DevHandoffUserStoryBody({ story }: { story: DevHandoffUserStory }) {
  const clause = (label: string, text: string) => (
    <div style={{ display: 'flex', gap: 12 }}>
      <span
        style={{ ...handoffEyebrowStyle, flex: 'none', width: 62, paddingTop: 2 }}
      >
        {label}
      </span>
      <span style={{ fontSize: 13, lineHeight: '20px', color: 'var(--color-text-primary)' }}>
        {text}
      </span>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {clause('As a', story.asA)}
      {clause('I want', story.iWant)}
      {clause('So that', story.soThat)}

      {story.value && (
        <p
          style={{
            margin: '6px 0 0',
            paddingTop: 12,
            borderTop: '1px solid var(--color-border-subtle)',
            fontSize: 13,
            lineHeight: '20px',
            color: 'var(--color-text-secondary)',
          }}
        >
          <b style={{ color: 'var(--color-text-primary)' }}>Why it matters. </b>
          {story.value}
        </p>
      )}

      {story.notes && story.notes.length > 0 && (
        <ul
          style={{
            margin: '2px 0 0',
            paddingLeft: 18,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {story.notes.map((n, i) => (
            <li key={i} style={{ fontSize: 13, lineHeight: '20px', color: 'var(--color-text-secondary)' }}>
              {n}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function DevHandoffAcceptanceBody({ items }: { items: string[] }) {
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((item, i) => (
        <li
          key={i}
          style={{ display: 'flex', gap: 10, fontSize: 13, lineHeight: '20px', color: 'var(--color-text-secondary)' }}
        >
          <span
            aria-hidden
            style={{
              flexShrink: 0,
              marginTop: 2,
              width: 14,
              height: 14,
              borderRadius: 4,
              border: '1.5px solid var(--color-border-strong, var(--color-border-subtle))',
            }}
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

/** The states matrix — state → expected behavior, for the non-happy paths. */
export function DevHandoffStatesMatrixBody({ rows }: { rows: DevHandoffState[] }) {
  return (
    <ul style={detailListStyle}>
      {rows.map((r) => (
        <li key={r.state} style={detailItemStyle}>
          <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{r.state}</span>
          <span style={{ display: 'block', marginTop: 2, color: 'var(--color-text-secondary)' }}>
            {r.behavior}
          </span>
        </li>
      ))}
    </ul>
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
