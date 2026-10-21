import { useState, type CSSProperties } from 'react'
import { WhiteStyleHead } from '@/components/compass/AtlasHomeEricE2E'
import { AffidavitModal, type AffidavitKind } from '@/components/e2e/AffidavitModal'

/**
 * The two Atlas Home dev-handoff previews that cannot be a bare
 * `createElement` of the real component — everything else is called directly
 * from `atlasHandoffPreviewsRegistry.ts`, which is where the variant NAMES
 * live.
 *
 * ⚠ THE NAMES ARE NOT IN THIS FILE, deliberately (2026-10-20). Until now each
 * preview was a gallery carrying its own hand-written captions, which made it
 * a THIRD list of a component's variants beside `variants` and
 * `uiUxLogic.variants` in `prototypeFeatures.ts` — and the three had already
 * drifted: the Readiness gallery rendered the four bands the component
 * actually has while the handoff notes still described the five levels those
 * bands replaced on 2026-10-16, and nothing failed. The registry now keys
 * every render by the variant's `name` from the data, and
 * `DevHandoffVariants.test.ts` fails when a key matches no variant, so the
 * drift is a red test rather than a wrong spec.
 *
 * This file exports COMPONENTS ONLY — `react-refresh/only-export-components`
 * does not allow a `.tsx` to export a non-component alongside its components,
 * which is the same reason the registry is a plain `.ts` (and the same split
 * this repo already uses for `v4/shared.tsx` vs `v4/sharedUtil.ts`).
 */

/**
 * A real portalled, full-viewport overlay can't sit in a variant row the way
 * the cards do — it covers the page by design. So this opens the ACTUAL
 * component on demand: the checkbox and the Continue-button state underneath
 * are the real, interactive component, not a picture of it.
 */
export function AffidavitLauncher({ kind, label }: { kind: AffidavitKind; label: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" style={launchButtonStyle} onClick={() => setOpen(true)}>
        Open &rarr; {label}
      </button>
      {open && <AffidavitModal kind={kind} onClose={() => setOpen(false)} />}
    </>
  )
}

/**
 * Course Head's White-style layout — the one variant of the seven that is a
 * clean, already-separate function (`WhiteStyleHead`, exported 2026-10-20 for
 * exactly this). The other six are inlined in `AtlasHomeEricE2E`'s main render
 * alongside page-local closures (`shownCover`, `onBeginCta`, `completedView`),
 * so they have no render here and the Variants section says so per row.
 */
export function CourseHeadWhiteVariant() {
  return (
    <div style={{ width: '100%', maxWidth: 480 }}>
      <WhiteStyleHead
        title="Florida Life & Health Pre-Licensing"
        onCover={() => {}}
        onOverview={() => {}}
        onBegin={() => {}}
        beginLabel="Begin Course"
        meta={
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-body)',
              fontSize: 11,
              color: 'var(--color-text-secondary)',
            }}
          >
            Course Access Ends: Dec 1, 2026, 42 days to complete
          </p>
        }
      />
    </div>
  )
}

const launchButtonStyle: CSSProperties = {
  padding: '10px 18px',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-md)',
  background: 'var(--color-surface-page)',
  color: 'var(--color-action)',
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 13,
  cursor: 'pointer',
}
