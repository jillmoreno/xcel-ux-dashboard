/**
 * UNREFERENCED SINCE 2026-09-29 — kept, not deleted. See the `contributing-section`
 * row in `src/data/archivedItems.ts` for how to wire it back.
 *
 * It lived inside `UxDashboardPage.tsx` and had exactly one call site, the
 * Contributing section. Moved to its own file when that section was archived,
 * because an unused module-level function inside a page trips `noUnusedLocals`
 * and would have had to be deleted to make the build pass — which is the thing
 * the archive convention exists to prevent.
 */
/**
 * A static guide rendered in place — the Contributing section. The document
 * is `public/contributing/index.html`, which is ALSO the standalone page and
 * the source the PDF beside it is rendered from, so showing it in an iframe
 * here rather than re-typing it as JSX is what keeps the three from drifting
 * (the `ComponentLivePreview` argument: the preview is data). The guide is
 * self-contained — system fonts, its own stylesheet, light/dark from the OS —
 * so it does not follow this page's palette, and that is accepted: it is a
 * document, and it prints.
 *
 * Height: the shell's main column scrolls, so the frame is sized to the
 * viewport minus the header above it rather than to its content — an iframe
 * cannot report its content height cross-document without a script, and a
 * fixed generous height would leave a long empty tail on short guides.
 */
export function GuideFrame({ src, title }: { src: string; title: string }) {
  return (
    <iframe
      src={src}
      title={title}
      style={{
        display: 'block',
        width: '100%',
        height: 'calc(100vh - 220px)',
        minHeight: 480,
        border: '1px solid var(--ux-border)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--ux-card)',
      }}
    />
  )
}
