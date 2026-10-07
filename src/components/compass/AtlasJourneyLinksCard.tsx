import type { CSSProperties, ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  AngleRightRegular,
  BallotCheckRegular,
  BookRegular,
  CircleInfoRegular,
  ClipboardListCheckRegular,
  FileCertificateRegular,
  HouseBlankRegular,
  NotebookRegular,
  PenFieldRegular,
} from '@/icons'
import { GET_LICENSED_STEPS } from '@/data/nyProducerRequirements'
import { EXAM_DETAILS_STEP_ID } from '@/data/examDetails'

/**
 * "MORE INFORMATION FOR YOUR JOURNEY" — the link card from Home V2's right
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
  const [params, setParams] = useSearchParams()
  /* Which link is the page you are on — the four that are pages; the three
     sheet links never are. */
  const section = params.get('section')
  const coursePage = params.get('coursePage')
  const here = (s: string, page?: string) => section === s && (page ? coursePage === page : true)
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
    <nav aria-label="More information for your journey" style={{ ...SIDE_CARD, ...style }}>
      {/* The exam-date card's heading style — Serif H8 (2026-10-02, the
          designer's request; the design sets it in Open Sans SemiBold 16). */}
      <p style={TITLE}>More Information for Your Journey</p>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Home, first (2026-10-07, Eric's request) — FA house-blank (regular);
            current on the Home page, which has no `section`. */}
        <SideLink icon={<HouseBlankRegular size={13} aria-hidden />} label="Home" active={section == null} onClick={() => go(null)} />
        <SideLink icon={<BookRegular size={13} aria-hidden />} label="My Courses" active={here('courses')} onClick={() => go('courses')} />
        <SideLink icon={<FileCertificateRegular size={13} aria-hidden />} label="My Certificates" active={here('certificates')} onClick={() => go('certificates')} />
        <SideLink icon={<NotebookRegular size={13} aria-hidden />} label="Flashcards" active={here('course', 'flashcards')} onClick={() => go('course', { coursePage: 'flashcards' })} />
        <SideLink icon={<BallotCheckRegular size={13} aria-hidden />} label="Exam Simulator" active={here('course', 'exam-simulator')} onClick={() => go('course', { coursePage: 'exam-simulator' })} />
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

function SideLink({
  icon,
  label,
  active = false,
  onClick,
}: {
  icon: ReactNode
  label: string
  /** The page you are on — a white capsule behind the row. */
  active?: boolean
  onClick?: () => void
}) {
  return (
    <li>
      <button
        type="button"
        className="cre-compass-v2-row"
        aria-current={active ? 'page' : undefined}
        onClick={onClick}
        disabled={!onClick}
        style={active ? { ...SIDE_ROW, ...SIDE_ROW_ACTIVE } : SIDE_ROW}
      >
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
/* THE ACTIVE ROW (2026-10-06, Eric's request): a white capsule — fully round
   ends — with 8px each end for the rounding and 4px top and bottom. The
   NEGATIVE margins hand that space back, so the icon, label and chevron stay
   exactly where every other row has them and the list does not grow. */
const SIDE_ROW_ACTIVE: CSSProperties = {
  width: 'calc(100% + 16px)',
  margin: '-4px -8px',
  padding: '4px 8px',
  borderRadius: 999,
  background: 'var(--color-surface-card)',
  // SemiBold — a step past the rows' Medium hover, so "here" never reads as a
  // hover (2026-10-06).
  fontWeight: 600,
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
