import type { CSSProperties, ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  AngleRightRegular,
  BallotCheckRegular,
  BookRegular,
  CircleInfoRegular,
  ClipboardListCheckRegular,
  FileCertificateRegular,
  NotebookRegular,
  PenFieldRegular,
} from '@/icons'
import { GET_LICENSED_STEPS } from '@/data/nyProducerRequirements'
import { EXAM_DETAILS_STEP_ID } from '@/data/examDetails'

/**
 * "OTHER INFORMATION FOR YOUR JOURNEY" — the link card from Home V2's right
 * column (Figma 161:662), lifted into its own file on 2026-10-05 so the Atlas
 * My Courses page can carry it too, in place of its filter column.
 *
 * Section links (courses, certificates, Flashcards, Exam Simulator) switch the
 * shell's section in place. The three SHEET links (Exam Information, Applying
 * for a License, State Requirements) call the handlers when the host owns the
 * sheets (Home); without them they go to Home with `?open=` — `exam-details`,
 * `step:<id>` or `requirements` — which `MembershipOverview` opens and strips.
 */
export const ATLAS_OPEN_PARAM = 'open'

export type AtlasJourneyLinksCardProps = {
  onOpenStep?: (id: string) => void
  onOpenRequirements?: () => void
  style?: CSSProperties
}

export function AtlasJourneyLinksCard({ onOpenStep, onOpenRequirements, style }: AtlasJourneyLinksCardProps) {
  const [, setParams] = useSearchParams()
  const go = (section: string | null, extra?: Record<string, string>) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      if (section) next.set('section', section)
      else next.delete('section')
      next.delete('coursePage')
      for (const [k, v] of Object.entries(extra ?? {})) next.set(k, v)
      return next
    })
  const homeAndOpen = (what: string) => () => go(null, { [ATLAS_OPEN_PARAM]: what })
  const apply = GET_LICENSED_STEPS[GET_LICENSED_STEPS.length - 1]

  return (
    <nav aria-label="Other information for your journey" style={{ ...SIDE_CARD, ...style }}>
      {/* The exam-date card's heading style — Serif H8 (2026-10-02, the
          designer's request; the design sets it in Open Sans SemiBold 16). */}
      <p style={TITLE}>Other Information for Your Journey</p>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SideLink icon={<BookRegular size={13} aria-hidden />} label="My Courses" onClick={() => go('courses')} />
        <SideLink icon={<FileCertificateRegular size={13} aria-hidden />} label="My Certificates" onClick={() => go('certificates')} />
        <SideLink icon={<NotebookRegular size={13} aria-hidden />} label="Flashcards" onClick={() => go('course', { coursePage: 'flashcards' })} />
        <SideLink icon={<BallotCheckRegular size={13} aria-hidden />} label="Exam Simulator" onClick={() => go('course', { coursePage: 'exam-simulator' })} />
        <SideLink
          icon={<CircleInfoRegular size={13} aria-hidden />}
          label="Exam Information"
          onClick={onOpenStep ? () => onOpenStep(EXAM_DETAILS_STEP_ID) : homeAndOpen('exam-details')}
        />
        <SideLink
          icon={<PenFieldRegular size={13} aria-hidden />}
          label="Applying for a License"
          onClick={onOpenStep ? () => onOpenStep(apply.id) : homeAndOpen(`step:${apply.id}`)}
        />
        <SideLink
          icon={<ClipboardListCheckRegular size={13} aria-hidden />}
          label="State Requirements"
          onClick={onOpenRequirements ?? homeAndOpen('requirements')}
        />
      </ul>
    </nav>
  )
}

function SideLink({ icon, label, onClick }: { icon: ReactNode; label: string; onClick?: () => void }) {
  return (
    <li>
      <button type="button" className="cre-compass-v2-row" onClick={onClick} disabled={!onClick} style={SIDE_ROW}>
        <span aria-hidden style={{ width: 18, flex: 'none', display: 'inline-flex', justifyContent: 'center', color: 'var(--color-atlas-home-icon, var(--color-compass-page-button))' }}>
          {icon}
        </span>
        <span style={{ flex: '1 1 0', minWidth: 0, textAlign: 'left' }}>{label}</span>
        <span aria-hidden style={{ display: 'inline-flex', color: 'var(--color-atlas-home-icon, var(--color-compass-page-button))' }}>
          <AngleRightRegular size={13} aria-hidden />
        </span>
      </button>
    </li>
  )
}

const SIDE_CARD: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  padding: '24px 32px 32px',
  boxSizing: 'border-box',
  borderRadius: 12,
  border: '1px solid var(--color-atlas-nav-rule)',
}
/* Serif H8 — Home V2's STEP_TITLE. */
const TITLE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading-serif)',
  fontWeight: 400,
  fontSize: 'var(--type-atlas-h8-base-size, 20px)',
  lineHeight: 'var(--type-atlas-h8-base-line, 24px)',
  letterSpacing: '-0.01em',
  color: 'var(--color-text-primary)',
}
const SIDE_ROW: CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: 0,
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '18px',
}
