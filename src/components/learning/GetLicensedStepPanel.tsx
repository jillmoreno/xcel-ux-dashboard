import type { CSSProperties } from 'react'
import { X } from '@/icons'
import {
  NY_GOVERNING_AGENCY,
  jurisdictionName,
  type LicensingStep,
  type LicensingStepBullet,
} from '@/data/nyProducerRequirements'

/**
 * GET LICENSED — one step's published detail, in a slide-over (2026-09-17).
 *
 * The three Get Licensed rows opened the REQUIREMENTS sheet until now. That was
 * the honest placeholder while nothing described the steps individually — its
 * own note said so: "It is not a per-step destination and does not pretend to
 * be — a step-specific page would need content nobody has authored." That
 * content now exists, supplied from XCEL's own requirements page, so each row
 * opens its own step.
 *
 * ── What this is NOT ──────────────────────────────────────────────────────
 *
 * It is not a second requirements sheet. The requirements sheet states the
 * BOARD's rules for the licence as a whole — hours by line of authority, how
 * the course works, the certificate, the CE cycle that follows. This states one
 * POST-COURSE step: how to book the sitting, what to bring, where to apply. The
 * two overlap on the exam and the fees, and that overlap is the source's own —
 * the same page prints both.
 *
 * ── The content ───────────────────────────────────────────────────────────
 *
 * Quoted close to the source, not paraphrased, for the reason the requirements
 * box already records: fees, ID rules and a retake policy are told once and then
 * acted on. Nothing here is authored — see `LicensingStep.sections`, including
 * the note on the one malformed URL that had to be corrected on the way in.
 *
 * **It carries NO completion state**, like the rows it opens from. PSI schedules
 * the sitting, PSI scores it, DFS issues the licence; a tick against any of the
 * three would be the product claiming an outcome it has no feed for.
 */
export function GetLicensedStepPanel({
  step,
  state,
  onClose,
}: {
  step: LicensingStep
  /** Two-letter code, for the sub-line. */
  state?: string
  onClose: () => void
}) {
  const where = jurisdictionName(state)
  return (
    <>
      {/* Pinned header, matching the requirements sheet's — the two open from
          the same column and a different close affordance in each would read as
          two unrelated surfaces. */}
      <div style={{ flexShrink: 0, padding: '18px 22px 0' }}>
        <button type="button" onClick={onClose} className="cre-link-action" style={closeStyle}>
          <X size={14} aria-hidden />
          Close
        </button>
        <p style={eyebrowStyle}>Post-course process</p>
        <h2 style={titleStyle}>{step.title}</h2>
        <p style={subStyle}>
          {/* The OWNER leads, because it is the fact that makes this section
              exist: nothing on these three steps happens inside the LMS. */}
          {[step.owner, where ? `${where} licence` : null, step.fee]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </div>

      <div style={bodyStyle}>
        <p style={leadStyle}>{step.detail}</p>
        {step.sections?.map((section, i) => (
          <section key={section.heading ?? `lead-${i}`} style={{ marginTop: i === 0 ? 18 : 22 }}>
            {section.heading ? <h3 style={headingStyle}>{section.heading}</h3> : null}
            <ul style={listStyle}>
              {section.bullets.map((b) => (
                <Bullet key={b.text} bullet={b} />
              ))}
            </ul>
          </section>
        ))}
        {/* NO "next step" CTA. The sequence is on the page this opened over,
            and a sheet that offers the step after the one you asked about is a
            second navigation model for a three-item list. */}

        {/* THE GOVERNING AGENCY, on all three sheets, under a rule — 2026-09-17
            (the direct ask). Identical on each, deliberately: DFS governs the
            LICENCE rather than any one step, so which step you happened to open
            must not decide whether you can find the phone number.

            The RULE is `--color-border-subtle`, the divider every other seam on
            this version uses. It is doing real work here — separating one step's
            instructions from a standing contact block — but it is the same
            hairline, because a heavier line for this one seam would read as a
            second kind of boundary. */}
        <div aria-hidden style={ruleStyle} />
        <section>
          <h3 style={headingStyle}>Governing Agency</h3>
          <dl style={dlStyle}>
            <Field label="Name" value={NY_GOVERNING_AGENCY.name} />
            {/* `tel:` and `mailto:` rather than plain text — on a phone the
                number is the action, and retyping an email from a screen is the
                thing a link exists to prevent. Both are published values, so
                neither is a guessed destination. */}
            <Field
              label="Phone"
              value={NY_GOVERNING_AGENCY.phone}
              href={`tel:${NY_GOVERNING_AGENCY.phone.replace(/[^\d+]/g, '')}`}
            />
            <Field
              label="Website"
              value={NY_GOVERNING_AGENCY.website}
              href={NY_GOVERNING_AGENCY.website}
              external
            />
            <Field
              label="Email"
              value={NY_GOVERNING_AGENCY.email}
              href={`mailto:${NY_GOVERNING_AGENCY.email}`}
            />
            <Field label="Address" value={NY_GOVERNING_AGENCY.address} />
          </dl>
        </section>
      </div>
    </>
  )
}

/** One label/value pair in the agency block. */
function Field({
  label,
  value,
  href,
  external = false,
}: {
  label: string
  value: string
  href?: string
  /** Leaves XCEL, so it opens in a new tab. `tel:`/`mailto:` do not. */
  external?: boolean
}) {
  return (
    <div style={fieldStyle}>
      <dt style={dtStyle}>{label}</dt>
      <dd style={ddStyle}>
        {href ? (
          <a
            href={href}
            {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
            className="cre-link-action cre-cta-ink"
            style={{ fontWeight: 700, overflowWrap: 'anywhere' }}
          >
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  )
}

function Bullet({ bullet }: { bullet: LicensingStepBullet }) {
  return (
    <li style={itemStyle}>
      <span>
        {bullet.text}
        {bullet.href ? (
          <>
            {' '}
            {/* `.cre-cta-ink` and NO inline colour — the CTA ramp is a FILL
                colour on XCEL and cta-500 as TEXT is 1.84:1 on the dark page,
                so the class swaps to the light stop under `[data-theme='dark']`
                and an inline value would beat it while looking right.

                New tab: these leave XCEL for PSI, DFS and NIPR, and a learner
                mid-application should not lose the dashboard to a registration
                flow. */}
            <a
              href={bullet.href}
              target="_blank"
              rel="noreferrer noopener"
              className="cre-link-action cre-cta-ink"
              style={{ fontWeight: 700, overflowWrap: 'anywhere' }}
            >
              {bullet.linkLabel ?? bullet.href}
            </a>
          </>
        ) : null}
      </span>
      {bullet.children && bullet.children.length > 0 ? (
        <ul style={{ ...listStyle, marginTop: 8 }}>
          {bullet.children.map((c) => (
            <Bullet key={c.text} bullet={c} />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

/* ─── styles ──────────────────────────────────────────────────────────── */

const closeStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  background: 'transparent',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--color-text-secondary)',
}

const eyebrowStyle: CSSProperties = {
  margin: '14px 0 0',
  fontFamily: 'var(--font-body)',
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'var(--color-text-tertiary)',
}

const titleStyle: CSSProperties = {
  margin: '6px 0 0',
  fontFamily: 'var(--font-heading)',
  fontWeight: 700,
  fontSize: 21,
  lineHeight: '27px',
  color: 'var(--color-text-primary)',
}

const subStyle: CSSProperties = {
  margin: '4px 0 0',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  color: 'var(--color-text-secondary)',
}

/* `flex: 1` + `overflow-y: auto` — the Sheet's body scrolls, and step 3's
   content is long enough to need it. */
const bodyStyle: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '18px 22px 24px',
}

const leadStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  lineHeight: '20px',
  color: 'var(--color-text-primary)',
}

const headingStyle: CSSProperties = {
  margin: '0 0 8px',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--color-text-primary)',
}

const listStyle: CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}

const ruleStyle: CSSProperties = {
  height: 1,
  margin: '22px 0 18px',
  background: 'var(--color-border-subtle)',
}

const dlStyle: CSSProperties = {
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
}

/* Label and value on ONE line, not stacked: five stacked pairs is ten lines of
   a contact card, and every label here is a single short word. */
const fieldStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 6,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '19px',
}

const dtStyle: CSSProperties = { margin: 0, color: 'var(--color-text-tertiary)' }

const ddStyle: CSSProperties = { margin: 0, minWidth: 0, color: 'var(--color-text-secondary)' }

const itemStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '19px',
  color: 'var(--color-text-secondary)',
}
