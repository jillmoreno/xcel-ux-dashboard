import { useState, type CSSProperties, type ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { AtlasReadinessCard } from '@/components/compass/AtlasReadinessCard'
import { AtlasCourseProgressStates } from '@/components/compass/AtlasCourseProgressStates'
import { AtlasPaceRingCard } from '@/components/compass/AtlasPaceRingCard'
import { AtlasExamDateCard } from '@/components/compass/AtlasExamDateCard'
import { AtlasJourneyLinksCard } from '@/components/compass/AtlasJourneyLinksCard'
import { WhiteStyleHead } from '@/components/compass/AtlasHomeEricE2E'
import { AffidavitModal } from '@/components/e2e/AffidavitModal'

/**
 * LIVE, ALL-VARIANTS GALLERIES for the Atlas Home dev-handoff components —
 * 2026-10-20, added so `/prototype/:feature/handoff/:component` can show every
 * named state of a component side by side, the way the Common LMS original's
 * `ComponentLivePreview` registry did (e.g. the membership renewal-states
 * trio). This repo's registry had been reduced to an iframe-only stub when it
 * was ported from PartnerHub (which has no live components of its own) — see
 * the PORTED NOTE in `PrototypeHandoffDetailPage.tsx`. The Atlas Home family
 * is the first place in xcel-ux-dashboard with real, reusable React
 * components behind a dev handoff, so this restores the live-registry half of
 * that pattern for them specifically, rather than for every component.
 *
 * Every variant below renders the ACTUAL exported component with real props —
 * nothing here is a redrawn approximation — so the gallery cannot drift from
 * the implementation the way a screenshot would. Two components could not
 * take this treatment without a deeper refactor of `AtlasHomeEricE2E.tsx` and
 * are deliberately left on the iframe fallback (the real page, which is the
 * more honest preview for them anyway):
 *
 *  - PAGE LAYOUT (`atlas-home-layout`) — WIP-vs-White is a whole-page chrome
 *    swap, not a component prop; the Live Preview tab's real route already
 *    shows it.
 *  - STUDY JOURNEY (`atlas-home-study-journey`) — its list (`JourneyRow`) is a
 *    private, unexported function fed by page-local state
 *    (`applyJourneySequencing`, the course's live progress), not a standalone
 *    component with its own props.
 *
 * COURSE HEAD (`atlas-home-course-head`) is a partial case: its White-style
 * layout is `WhiteStyleHead`, a clean, already-separate function (exported
 * 2026-10-20 for exactly this), but its WIP-style layout, the course-tab
 * strip and the long-title variant are inlined in the page's main render
 * alongside `shownCover` / `onBeginCta` / `completedView` and a dozen other
 * page-local closures — extracting those safely is a bigger job than this
 * pass, so the gallery below shows the one clean variant and says so.
 */

/* ── Shared gallery chrome ────────────────────────────────────────────── */

/** One bounded card per variant — a sub-header derived from the caption's
 *  `Label — what it shows` shape (the convention this repo's own
 *  dev-handoff-notes skill documents), the render beneath it on its own
 *  visible surface regardless of the component's own background. */
function PreviewItem({ caption, children }: { caption: string; children: ReactNode }) {
  const splitAt = caption.indexOf(' — ')
  const hasLabel = splitAt > 0 && splitAt <= 70
  const label = hasLabel ? caption.slice(0, splitAt) : null
  const desc = hasLabel ? caption.slice(splitAt + 3) : caption
  return (
    <div style={itemCardStyle}>
      {label && <p style={itemLabelStyle}>{label}</p>}
      <p style={itemDescStyle}>{desc}</p>
      <div style={itemRenderStyle}>{children}</div>
    </div>
  )
}

function VariantGallery({ items }: { items: { caption: string; node: ReactNode }[] }) {
  return (
    <div style={galleryGridStyle}>
      {items.map((it, i) => (
        <PreviewItem key={i} caption={it.caption}>
          {it.node}
        </PreviewItem>
      ))}
    </div>
  )
}

const galleryGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  gap: 20,
  alignItems: 'start',
}

const itemCardStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
}

const itemLabelStyle: CSSProperties = {
  margin: 0,
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--color-text-primary)',
}

const itemDescStyle: CSSProperties = {
  margin: 0,
  fontSize: 12,
  lineHeight: '17px',
  color: 'var(--color-text-secondary)',
}

const itemRenderStyle: CSSProperties = {
  marginTop: 8,
  padding: 20,
  display: 'flex',
  justifyContent: 'center',
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-lg)',
}

const noteStyle: CSSProperties = {
  margin: '16px 0 0',
  fontSize: 12,
  lineHeight: '18px',
  color: 'var(--color-text-tertiary)',
}

/* ── Readiness Panel — 6 variants (atlas-home-readiness-panel) ──────────── */

export function ReadinessPanelPreview() {
  return (
    <VariantGallery
      items={[
        { caption: 'Not Started — the empty dial; nothing is shown in the graph until the course has progress.', node: <AtlasReadinessCard notStarted /> },
        { caption: 'Beginner · 14% fill — early in development, substantial knowledge gaps remaining.', node: <AtlasReadinessCard initialLevel={0} /> },
        { caption: 'Developing · 36% fill — building competency, but still has meaningful gaps.', node: <AtlasReadinessCard initialLevel={1} /> },
        { caption: 'Proficient · 75% fill — strong understanding; short of the Ready threshold.', node: <AtlasReadinessCard initialLevel={2} /> },
        { caption: 'Ready · 100% fill — considered ready for the target outcome or exam.', node: <AtlasReadinessCard initialLevel={3} /> },
        { caption: 'bare (combined panel) — no card fill of its own; shares one outlined panel with Course Progress on White/E2E chrome.', node: <AtlasReadinessCard bare initialLevel={3} /> },
      ]}
    />
  )
}

/* ── Course Progress — 6 variants (atlas-home-progress-states) ──────────── */

const PROGRESS_EXPECTED = { value: 'June 3', note: 'At current pace' }
const PROGRESS_ACCESS = { value: '28 Days', note: 'Ends June 10' }

export function ProgressStatesPreview() {
  return (
    <VariantGallery
      items={[
        { caption: 'Zero / Study pace — a learner who hasn’t started needs a plan, not a 0% ring.', node: <AtlasCourseProgressStates percent={0} expected={PROGRESS_EXPECTED} access={PROGRESS_ACCESS} initialStage="zero" /> },
        { caption: 'Current / Course progress — the real dial, expected completion and course access.', node: <AtlasCourseProgressStates percent={42} expected={PROGRESS_EXPECTED} access={PROGRESS_ACCESS} initialStage="current" /> },
        { caption: 'Milestone — 68% (a design figure), "Great Work!!" and a note.', node: <AtlasCourseProgressStates percent={42} expected={PROGRESS_EXPECTED} access={PROGRESS_ACCESS} initialStage="milestone" /> },
        { caption: 'Complete — 100%, "Amazing Job!!", no edit link left to show.', node: <AtlasCourseProgressStates percent={42} expected={PROGRESS_EXPECTED} access={PROGRESS_ACCESS} initialStage="complete" /> },
        { caption: 'Expired — access lapsed before completion; "Extend Course Now" (drawn, not wired).', node: <AtlasCourseProgressStates percent={42} expected={PROGRESS_EXPECTED} access={PROGRESS_ACCESS} initialStage="expired" /> },
        { caption: 'bare (combined panel) — no fill of its own; shares the outlined panel with Readiness on White/E2E chrome.', node: <AtlasCourseProgressStates bare percent={42} expected={PROGRESS_EXPECTED} access={PROGRESS_ACCESS} initialStage="current" /> },
      ]}
    />
  )
}

/* ── Course Progress + Study Pace (ring) — 5 variants (atlas-home-pace-ring) */

export function PaceRingPreview() {
  return (
    <VariantGallery
      items={[
        { caption: 'Default — the course-progress ring over a Study Pace goal and the estimated completion date.', node: <AtlasPaceRingCard percent={42} weeks={3} hoursPerWeek={4} expected={{ value: 'November 2', note: 'At current pace' }} standingMessage="You’re ahead of pace — keep it up." /> },
        { caption: 'Readiness below — the bottom rule drops; Readiness takes over dividing the column.', node: <AtlasPaceRingCard percent={42} weeks={3} hoursPerWeek={4} expected={{ value: 'November 2' }} readinessBelow /> },
        { caption: 'Left-aligned column — the Design bar’s other arm; the goal row runs left while the dial and sentence stay centred.', node: <AtlasPaceRingCard percent={42} weeks={3} hoursPerWeek={4} expected={{ value: 'November 2' }} align="left" /> },
        { caption: 'Exam booked — a booked exam date renders as its own row under Estimated completion.', node: <AtlasPaceRingCard percent={60} weeks={2} hoursPerWeek={5} expected={{ value: 'November 2' }} exam={{ label: 'Florida state exam', value: 'November 16', note: '18 days' }} /> },
        { caption: 'No pace fits — an exam closer than the review buffer leaves no honest plan to show.', node: <AtlasPaceRingCard percent={10} noPace={{ binding: 'exam', days: -2, dateIso: '2026-11-01' }} /> },
      ]}
    />
  )
}

/* ── Exam Date Card — 4 variants (atlas-home-exam-date-card) ─────────────── */

const EXAM_DATE_SET_DATE = new Date(Date.now() + 18 * 24 * 60 * 60 * 1000)

export function ExamDateCardPreview() {
  return (
    <VariantGallery
      items={[
        { caption: 'Default — before a date is set.', node: <AtlasExamDateCard initialStage="default" /> },
        { caption: 'No — "That’s okay", a registration blurb, then "I have my exam date".', node: <AtlasExamDateCard initialStage="no" /> },
        { caption: 'Yes (calendar) — a real month calendar; Set Exam Date stays disabled until a day is picked.', node: <AtlasExamDateCard initialStage="yes" /> },
        { caption: 'Set — the saved date and the days-remaining tile, with Edit.', node: <AtlasExamDateCard initialStage="set" initialDate={EXAM_DATE_SET_DATE} /> },
      ]}
    />
  )
}

/* ── Quick Links Card — 4 variants (atlas-home-quick-links) ──────────────── */

/* Wrapped in its own MemoryRouter per variant: `AtlasJourneyLinksCard` reads
 * its "active" row from `useSearchParams()`, and this page already sits
 * inside the app's own Router. Without an isolating MemoryRouter, clicking a
 * nav row in ANY instance here would rewrite the dev-handoff page's own
 * address bar, and every instance would share one `?section=`. */
export function QuickLinksPreview() {
  return (
    <VariantGallery
      items={[
        { caption: 'Default rows — My Courses, My Certificates, Exam Information, Applying for a License, State Requirements.', node: <MemoryRouter><AtlasJourneyLinksCard /></MemoryRouter> },
        { caption: 'Active row — a white capsule behind the row matching the current section (here, My Courses).', node: <MemoryRouter initialEntries={['/?section=courses']}><AtlasJourneyLinksCard /></MemoryRouter> },
        { caption: 'Without course pages — Flashcards and Exam Simulator dropped (Eric/Atlas WIP’s right rail).', node: <MemoryRouter><AtlasJourneyLinksCard withoutCoursePages /></MemoryRouter> },
        { caption: 'Links off — the navigating rows drawn and inert (End-to-End Demo’s Home); the three info sheets still open.', node: <MemoryRouter><AtlasJourneyLinksCard linksOff /></MemoryRouter> },
      ]}
    />
  )
}

/* ── Course Head — partial: 1 live variant (atlas-home-course-head) ──────── */

export function CourseHeadPreview() {
  return (
    <>
      <VariantGallery
        items={[
          {
            caption: 'White-style layout (stacked) — a 130px cover beside a bottom-aligned title/meta row, Course Overview and Begin/Resume on their own row beneath.',
            node: (
              <div style={{ width: '100%', maxWidth: 480 }}>
                <WhiteStyleHead
                  title="Florida Life & Health Pre-Licensing"
                  onCover={() => {}}
                  onOverview={() => {}}
                  onBegin={() => {}}
                  beginLabel="Begin Course"
                  meta={
                    <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-text-secondary)' }}>
                      Course Access Ends: Dec 1, 2026, 42 days to complete
                    </p>
                  }
                />
              </div>
            ),
          },
        ]}
      />
      <p style={noteStyle}>
        The WIP layout (cover beside the title), the course-tab strip, and the long-title variant are
        inlined in <code>AtlasHomeEricE2E</code>&rsquo;s main render alongside page-local state
        (<code>shownCover</code>, <code>onBeginCta</code>, <code>completedView</code>&hellip;) rather
        than in their own component, so they aren&rsquo;t shown here — open the Live Preview tab and
        click the cover image to see them on the real page.
      </p>
    </>
  )
}

/* ── Affidavit Modal — 2 live launchers (atlas-home-affidavit-modal) ─────── */

/* A real portalled, full-viewport overlay can't sit in a side-by-side grid
 * cell the way the other cards do — it covers the page by design. So this
 * opens the actual component on demand instead of drawing both at once;
 * the checkbox and the Continue-button state are the real, interactive
 * component underneath, not a static picture of it. */
export function AffidavitModalPreview() {
  const [open, setOpen] = useState<'pre' | 'post' | null>(null)
  return (
    <>
      <VariantGallery
        items={[
          {
            caption: 'Pre-course Affidavit — opens on arrival, before the coursework.',
            node: (
              <button type="button" style={launchButtonStyle} onClick={() => setOpen('pre')}>
                Open → Pre-course Affidavit
              </button>
            ),
          },
          {
            caption: 'Study-manual Notice Affidavit — opens after the coursework, before the final exam.',
            node: (
              <button type="button" style={launchButtonStyle} onClick={() => setOpen('post')}>
                Open → Study-manual Notice Affidavit
              </button>
            ),
          },
        ]}
      />
      <p style={noteStyle}>
        The modal is a full-viewport overlay by design, so it can&rsquo;t sit inside a gallery cell —
        click a button above to open the real, interactive component (checkbox and Continue button
        included), then close it to come back here.
      </p>
      {open && <AffidavitModal kind={open} onClose={() => setOpen(null)} />}
    </>
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

/* The id → gallery REGISTRY itself is a plain (non-component) function, and
 * react-refresh/only-export-components refuses to let a `.tsx` file export
 * both components and a non-component together — the same split this repo
 * already uses elsewhere (e.g. `v4/shared.tsx` vs `v4/sharedUtil.ts`). So the
 * switch lives in `atlasHandoffPreviewsRegistry.ts`, which imports the
 * (now-exported) preview components above; this file exports components only. */
