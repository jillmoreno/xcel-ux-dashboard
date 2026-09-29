import type { CSSProperties } from 'react'
import { NY_GOVERNING_AGENCY } from '@/data/nyProducerRequirements'

/**
 * THE GOVERNING AGENCY CONTACT BLOCK — extracted from `GetLicensedStepPanel`
 * and moved to the bottom of Exam Details, 2026-09-29.
 *
 * ⚠ THIS REVERSES A DECISION, and the reversal is the point. It used to render
 * on ALL THREE step sheets, identically, and that file's note said why: "DFS
 * governs the LICENCE rather than any one step, so which step you happened to
 * open must not decide whether you can find the phone number." Three copies was
 * the price of that guarantee.
 *
 * Exam Details changes the shape of the problem. It is now the hub the three
 * exam sheets hang off, so the contact block can sit ONCE at the bottom of the
 * hub and still not belong to any single step — which is what the original note
 * actually wanted. One copy, not three, and no step owns it.
 *
 * ⚠ THE COST, stated plainly: the three step sheets are still reachable
 * DIRECTLY from the Study Journey rows, without passing through Exam Details,
 * and on those routes the phone number is now one extra hop away. If that turns
 * out to matter, the fix is to render this in `GetLicensedStepPanel` again as
 * well — it is a component now, so that is one line in each, not a third copy
 * of the markup.
 */
export function GoverningAgencyBlock() {
  return (
    <>
      {/* The hairline every other seam on this version uses. It is doing real
          work — separating the menu from a standing contact block — but it is
          the same rule, because a heavier line for this one seam would read as
          a second kind of boundary. */}
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

/* ─── styles ──────────────────────────────────────────────────────────── */

const ruleStyle: CSSProperties = {
  height: 1,
  margin: '22px 0 18px',
  background: 'var(--color-border-subtle)',
}

const headingStyle: CSSProperties = {
  margin: '0 0 8px',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--color-text-primary)',
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
