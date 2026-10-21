import { useState, type CSSProperties } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { WhiteStyleHead } from '@/components/compass/AtlasHomeEricE2E'
import { AtlasJourneyLinksCard } from '@/components/compass/AtlasJourneyLinksCard'
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
export function AffidavitLauncher({
  kind,
  label,
  agreed = false,
}: {
  kind: AffidavitKind
  label: string
  /** Opens the modal with the attestation already ticked, so the enabled
   *  Continue button is one click away rather than two. */
  agreed?: boolean
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" style={launchButtonStyle} onClick={() => setOpen(true)}>
        Open &rarr; {label}
      </button>
      {open && (
        <AffidavitModal kind={kind} initialAgreed={agreed} onClose={() => setOpen(false)} />
      )}
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
export function CourseHeadVariant({
  title = 'Florida Life & Health Pre-Licensing',
  beginLabel = 'Begin Course',
  withMeta = true,
  metaText = 'Course Access Ends: Dec 1, 2026, 42 days to complete',
}: {
  title?: string
  beginLabel?: string
  /** The meta row's wording — at 100% it congratulates instead of counting. */
  metaText?: string
  /** The Expires / days-to-complete row. Dropped entirely for the No-end-date
   *  state — the row goes, rather than rendering blank. */
  withMeta?: boolean
}) {
  return (
    <div style={{ width: '100%', maxWidth: 480 }}>
      <WhiteStyleHead
        cover={`${import.meta.env.BASE_URL}courses/0.webp`}
        title={title}
        onCover={() => {}}
        onOverview={() => {}}
        onBegin={() => {}}
        beginLabel={beginLabel}
        meta={
          withMeta ? (
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--font-body)',
                fontSize: 11,
                color: 'var(--color-text-secondary)',
              }}
            >
              {metaText}
            </p>
          ) : undefined
        }
      />
    </div>
  )
}

/**
 * THE PAGE-SHAPED STATES, shown as the real page.
 *
 * Some states here are not a component's own props at all — the whole-page
 * composition, and Step 1 of the Study Journey, which reads the page's shared
 * progress rather than anything passed to it. Rebuilding either in the gallery
 * would mean copying page logic into the preview, and a copy is exactly the
 * thing that drifts.
 *
 * So this loads the REAL route in an iframe, pinned to the state with `?ff=`.
 * It cannot drift, because it is the page. The frame is deliberately tall and
 * scrollable rather than scaled: a shrunk page is unreadable, and the reader
 * can scroll to the part the row is about.
 */
export function PageFrame({ ff, title }: { ff?: string; title: string }) {
  const src =
    `${import.meta.env.BASE_URL}dashboard-rebrand?demo=1&section=dashboard&brand=xcel` +
    (ff ? `&ff=${ff}` : '')
  return (
    <div style={{ width: '100%' }}>
      <iframe title={title} src={src} style={pageFrameStyle} />
      <p style={frameNoteStyle}>
        The real page, pinned to this state &mdash; not a copy of it. The demo and design bars
        belong to the prototype shell, not the design; scroll past them to the page itself.
      </p>
    </div>
  )
}

/**
 * Hover and focus cannot be forced from outside a component, so this renders
 * the real rail and asks the reader to hover it. That is a live component
 * doing the actual thing, which is closer to the truth than a drawn picture of
 * a hovered row would be.
 *
 * Its own MemoryRouter, for the reason every rail preview has one: the card
 * reads its active row from the URL, and without isolation a click here would
 * rewrite the handoff page's own address bar.
 */
export function QuickLinksHoverDemo() {
  return (
    <div>
      <MemoryRouter>
        <AtlasJourneyLinksCard withoutCoursePages />
      </MemoryRouter>
      <p style={frameNoteStyle}>
        Hover a row, or tab into one &mdash; the chevron and the weight change are the real
        thing, not a drawn approximation.
      </p>
    </div>
  )
}

const pageFrameStyle: CSSProperties = {
  width: '100%',
  height: 620,
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-lg)',
  background: 'var(--color-fixed-light, #fff)',
}

const frameNoteStyle: CSSProperties = {
  margin: '8px 0 0',
  fontSize: 12,
  lineHeight: '18px',
  color: 'var(--color-text-tertiary)',
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
