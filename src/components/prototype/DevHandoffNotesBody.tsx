import type { ReactNode } from 'react'
import type {
  DevHandoffComponent,
  DevHandoffDesignSpec,
  DevHandoffState,
  DevHandoffUiUxLogic,
  DevHandoffUserStory,
} from '@/data/prototypeFeatures'
import {
  detailItemStyle,
  detailListStyle,
  pointerLocationStyle,
} from './devHandoffStyles'

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
      <p style={{ margin: '12px 0 0', fontSize: 15, lineHeight: '23px', color: 'var(--color-text-secondary)' }}>
        {component.summary}
      </p>

      {/* Variants are listed in the UI/UX-logic "Card variants" block (with
          why + action) when that data exists; only fall back to this plain
          enumeration when it doesn't, so the two never duplicate. */}
      {!(component.uiUxLogic?.variants && component.uiUxLogic.variants.length > 0) && (
        <HandoffBlock label="Variants">
          <ul style={detailListStyle}>
            {component.variants.map((v) => (
              <li key={v.name} style={detailItemStyle}>
                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{v.name}</span>
                <span style={{ color: 'var(--color-text-tertiary)' }}> — {v.when}</span>
                {v.detail && (
                  <span style={{ display: 'block', marginTop: 2, color: 'var(--color-text-secondary)' }}>
                    {v.detail}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </HandoffBlock>
      )}

      <HandoffBlock label="UX logic">
        <BulletList items={component.uxLogic} />
      </HandoffBlock>

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
 * The "UI/UX logic" write-up for one component — the four-part rationale
 * captured while designing it: why it exists, every action, edge cases,
 * and toaster messaging / additional logic.
 */
export function DevHandoffUiUxLogicBody({ logic }: { logic: DevHandoffUiUxLogic }) {
  return (
    <div>
      <HandoffBlock label="Why this feature exists">
        <p style={{ margin: 0, fontSize: 14, lineHeight: '21px', color: 'var(--color-text-secondary)' }}>
          {logic.why}
        </p>
      </HandoffBlock>

      {logic.variants && logic.variants.length > 0 ? (
        <HandoffBlock label="Card variants">
          <ul style={detailListStyle}>
            {logic.variants.map((v, i) => (
              <li
                key={v.name}
                style={{
                  ...detailItemStyle,
                  ...(i > 0 && {
                    borderTop: '1px solid var(--color-border-subtle)',
                    paddingTop: 10,
                  }),
                }}
              >
                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{v.name}</span>
                {v.when && (
                  <span style={{ color: 'var(--color-text-tertiary)' }}> — {v.when}</span>
                )}
                <span style={{ display: 'block', marginTop: 4, color: 'var(--color-text-secondary)' }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Why it exists: </span>
                  {v.why}
                </span>
                <span style={{ display: 'block', marginTop: 2, color: 'var(--color-text-secondary)' }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Action: </span>
                  {v.action}
                </span>
              </li>
            ))}
          </ul>
        </HandoffBlock>
      ) : logic.actions && logic.actions.length > 0 ? (
        <HandoffBlock label="Available actions">
          <ul style={detailListStyle}>
            {logic.actions.map((a) => (
              <li key={a.name} style={detailItemStyle}>
                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{a.name}</span>
                <span style={{ display: 'block', marginTop: 2, color: 'var(--color-text-secondary)' }}>
                  {a.detail}
                </span>
              </li>
            ))}
          </ul>
        </HandoffBlock>
      ) : null}

      <HandoffBlock label="Edge cases">
        <BulletList items={logic.edgeCases} />
      </HandoffBlock>

      <HandoffBlock label="Toaster messaging & logic">
        <BulletList items={logic.toasterLogic} />
      </HandoffBlock>
    </div>
  )
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
        style={{
          flex: 'none',
          width: 56,
          paddingTop: 1,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--color-text-tertiary)',
        }}
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
      <h4
        style={{
          margin: 0,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--color-text-tertiary)',
        }}
      >
        {label}
      </h4>
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
