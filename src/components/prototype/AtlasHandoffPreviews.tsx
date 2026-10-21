import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { AtlasCourseHeadRow, WhiteCourseMeta } from '@/components/compass/AtlasHomeEricE2E'
import { AtlasJourneyLinksCard } from '@/components/compass/AtlasJourneyLinksCard'
import { ATLAS_FONT_DEFAULT, atlasFontHref } from '@/components/layout/atlasFontSets'
import { atlasSkinFor } from '@/components/layout/atlasBrandSkin'
import { FEATURE_FLAGS } from '@/context/FeatureFlagContext'
import { useAccount } from '@/context/AccountContext'
import { AffidavitModal, type AffidavitKind } from '@/components/e2e/AffidavitModal'

/**
 * The dev-handoff previews that cannot be a bare `createElement` of the real
 * component — everything else is called directly from
 * `atlasHandoffPreviewsRegistry.ts`, which is where the variant NAMES live.
 *
 * ⚠ THE NAMES ARE NOT IN THIS FILE, deliberately (2026-10-20). Each preview
 * used to be a gallery carrying its own hand-written captions, which made it a
 * THIRD list of a component's variants beside the two in
 * `prototypeFeatures.ts` — and the three had already drifted. The registry now
 * keys every render by the variant's `name` from the data, and
 * `DevHandoffVariants.test.ts` fails when a key matches no variant.
 *
 * This file exports COMPONENTS ONLY — `react-refresh/only-export-components`
 * does not allow a `.tsx` to export a non-component alongside its components,
 * which is why the registry is a plain `.ts`.
 */

/**
 * THE ATLAS TOKEN ENVIRONMENT, so a preview is the component as the page
 * actually draws it.
 *
 * ⚠ WITHOUT THIS EVERY ATLAS RENDER WAS SUBTLY WRONG (2026-10-21, Jillienne:
 * "the ui is wrong, background color is wrong, text size, etc. This should be
 * a exact 1:1 ui example of the component").
 *
 * The Atlas look is not in the components — it is three attributes the product
 * shell writes onto `<html>`: `data-atlas-palette`, `data-atlas-brand` and
 * `data-atlas-font`. `tokens.css` keys whole blocks off the combination (see
 * "ATLAS XCEL PALETTE"), so the heading size, the brand ramps and the eyebrow
 * colours all resolve from them. The handoff gateway is not the product shell
 * and never set any of it, so every Atlas card here fell back to its default
 * token values — a 38px title where the page draws 40px, and the wrong fills
 * underneath it. The components were right the whole time; the room they were
 * standing in was not.
 *
 * Set on a WRAPPER rather than on `<html>`: custom properties inherit and the
 * selectors are plain attribute matches, so a div carries the whole palette to
 * its subtree without repainting the gateway around it. Mirroring the shell's
 * globals here would leak Atlas tokens onto the gateway's own chrome, which is
 * a different product.
 *
 * The heading face is fetched the way the shell fetches it, because a Playfair
 * title rendered in the fallback serif is exactly the "close enough" this is
 * here to stop. The link is shared and ref-counted, so a page of eighteen
 * renders loads it once.
 */
export function AtlasSurface({ children }: { children: ReactNode }) {
  useAtlasHeadingFont()
  const { brand } = useAccount()
  return (
    <div
      /* ⚠ ALL FOUR, ON ONE ELEMENT. The token rules are COMPOUND selectors —
         `[data-brand='xcel'][data-atlas-palette][data-atlas-brand='global']`
         (tokens.css:6333) — so every attribute has to sit together or the
         whole block is skipped. `data-brand` lives on `<html>` in the product
         and the other three went on this wrapper, which meant none of the
         brand-scoped rules matched and `--color-primary-100` fell through to a
         blue-grey where the page draws #eceef0: the course head's entire panel
         came out the wrong colour while every individual attribute looked
         right. Repeating `data-brand` here is harmless — it is what the
         document already says. */
      data-brand={brand}
      data-atlas-palette="xcel"
      data-atlas-brand={ATLAS_HANDOFF_SKIN}
      data-atlas-font={ATLAS_FONT_DEFAULT}
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'flex-start',
        /* ⚠ TWO TOKENS THE PAGE RE-POINTS FOR ITS CHILDREN, not the palette.
           `WHITE_PAGE` puts every eyebrow on the page and the progress
           figures' labels in Neutral 800 (#404040, 2026-10-14) — so a card
           lifted out of that page draws its eyebrow in the palette's default
           instead, which measured 91,85,96 here against the page's 64,64,64.
           Close enough to look deliberate, which is the worst kind of wrong in
           a spec. */
        ['--color-compass-page-eyebrow' as string]: 'var(--color-neutral-800)',
        ['--atlas-progress-label' as string]: 'var(--color-neutral-800)',
      }}
    >
      {children}
    </div>
  )
}

/**
 * The brand skin main's Atlas pages wear, resolved the way the product shell
 * resolves it — the `atlas-brand-skin-v3` flag's committed default, through
 * the same validator.
 *
 * ⚠ NOT `ATLAS_SKIN_DEFAULT`, which is the skin a `?skin=` link falls back to
 * and is a different thing. The flag defaults to `global` ("Atlas"), and the
 * two produce visibly different pages: `--color-primary-100` is #eceef0 under
 * global and a blue-grey under xcel, so the course head's whole panel came out
 * the wrong colour. Read from the catalog rather than hardcoded, so changing
 * the default moves the handoff with the product.
 */
const ATLAS_HANDOFF_SKIN = atlasSkinFor(
  FEATURE_FLAGS.find((f) => f.key === 'atlas-brand-skin-v3')?.defaultVariant ?? null,
)

let atlasFontUsers = 0

/** Loads the Atlas heading face for as long as any preview needs it. */
function useAtlasHeadingFont() {
  useEffect(() => {
    const href = atlasFontHref(ATLAS_FONT_DEFAULT)
    if (!href) return
    atlasFontUsers += 1
    let link = document.head.querySelector<HTMLLinkElement>(
      `link[data-atlas-handoff-font="${ATLAS_FONT_DEFAULT}"]`,
    )
    if (!link) {
      link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = href
      link.dataset.atlasHandoffFont = ATLAS_FONT_DEFAULT
      document.head.appendChild(link)
    }
    return () => {
      atlasFontUsers -= 1
      if (atlasFontUsers <= 0) link?.remove()
    }
  }, [])
}

/**
 * THE COURSE HEAD, as the page draws it: the real component, on the real
 * Primary 100 panel, with the page's own meta row inside it.
 *
 * ⚠ ALL THREE OF THOSE WERE WRONG BEFORE 2026-10-21. The component was right
 * and everything around it was not — no panel (so the fills read against the
 * gateway's card colour instead of the page's), and a hand-rolled meta row
 * with no rules, a different date format and flat label weights. The panel is
 * part of the component's look, not decoration around it.
 */
export function CourseHeadVariant({
  title = 'Florida Life and Health Pre-licensing',
  beginLabel = 'Begin Course',
  meta = 'default',
  eyebrow,
}: {
  title?: string
  beginLabel?: string
  /** Which meta row to draw: the countdown, the completed row, the expired
   *  row, or none at all when the course has no access-expiry date. */
  meta?: 'default' | 'expiring-soon' | 'complete' | 'expired' | 'none'
  /** The status line above the title — see `AtlasCourseHeadRow`. */
  eyebrow?: string
  /** Hidden once access has gone: nothing to review, only to buy back. */
  showOverview?: boolean
}) {
  return (
    <div style={courseHeadPanelStyle}>
      <AtlasCourseHeadRow
        onWhite
        cover={`${import.meta.env.BASE_URL}courses/fl-life-health.webp`}
        title={title}
        eyebrow={eyebrow}
        beginLabel={beginLabel}
        onCover={() => {}}
        showOverview={meta !== 'expired'}
        onOverview={() => {}}
        onBegin={() => {}}
        // The page's OWN meta row, not a rebuild of it.
        meta={
          meta === 'none' ? undefined : (
            <WhiteCourseMeta
              endsOn={COURSE_ACCESS_ENDS}
              // 7 days for the amber arm, so the figure reads as the thing
              // being warned about rather than a comfortable number in orange.
              days={meta === 'expiring-soon' ? 7 : 29}
              state={
                meta === 'complete'
                  ? 'complete'
                  : meta === 'expired'
                    ? 'expired'
                    : meta === 'expiring-soon'
                      ? 'expiring-soon'
                      : 'counting'
              }
            />
          )
        }
      />
    </div>
  )
}

/* A fixed date, not `new Date()` — a preview that reads "0 days to complete"
   some weeks from now would look like a bug in the component. */
const COURSE_ACCESS_ENDS = new Date(2026, 5, 10)

/**
 * THE LEFT COLUMN'S PANEL — the tan surface the progress cards are drawn on.
 *
 * ⚠ THE PACE RING HAS NO FILL OF ITS OWN. Its design spec says so outright:
 * "Panel: transparent — the outlined panel comes from the Home". So with the
 * gallery's generic plate removed it had nothing to stand on and floated on
 * the gateway background. The panel is part of what the component looks like,
 * the same way the course head's Primary 100 panel is — the gallery should
 * carry the page's surface, not a surface of its own.
 *
 * 296px because that is the left column's real width, and the ring is drawn
 * for that measure; wider and the dial sits in a field of space it never has.
 * Values read off the running page: 8px 24px, 20 radius, Secondary 100.
 */
export function AtlasProgressPanel({ children }: { children: ReactNode }) {
  return <div style={progressPanelStyle}>{children}</div>
}

const progressPanelStyle: CSSProperties = {
  width: 296,
  maxWidth: '100%',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  padding: '8px 24px',
  borderRadius: 20,
  background: 'var(--color-atlas-tan-100)',
}

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
 * THE PAGE-SHAPED STATES, shown as the real page.
 *
 * Some states are not a component's own props at all — the whole-page
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

/* The course card is 800px wide on the page with no padding of its own, and
   the head fills it inside a 40px panel. 720 is that content width, so the
   title wraps where the page wraps it — which is the whole point of showing
   the long-title state. */
const courseHeadPanelStyle: CSSProperties = {
  width: '100%',
  maxWidth: 800,
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
  padding: 40,
  borderRadius: 20,
  background: 'var(--color-primary-100)',
  ['--color-atlas-outlined-card' as string]: 'var(--color-primary-200)',
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
