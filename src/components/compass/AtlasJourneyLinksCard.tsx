import { useEffect, useId, useState, type CSSProperties, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMyCoursesCount } from './useMyCoursesCount'
import { useAccount } from '@/context/AccountContext'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { accountSectionsFor, isAccountSection, type AccountSectionId } from '@/components/account/accountSections'
import {
  AngleRightRegular,
  BallotCheckRegular,
  BookRegular,
  CircleInfoRegular,
  CircleUserRegular,
  ClipboardListCheckRegular,
  FileCertificateRegular,
  HouseRegular,
  UserRegular,
  BellRegular,
  FileLinesRegular,
  ReceiptRegular,
  GiftRegular,
  NotebookRegular,
  PenFieldRegular,
} from '@/icons'
import { GET_LICENSED_STEPS } from '@/data/nyProducerRequirements'
import { EXAM_DETAILS_STEP_ID } from '@/data/examDetails'

/**
 * "QUICK LINKS" (was "More Information for Your Journey") — the link card from Home V2's right
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

/** The Home link — built, hidden for now (2026-10-07). */
const SHOW_HOME_LINK: boolean = true // back on (2026-11-12, Eric: "add a button above My Courses for Home")
/** The card's "Quick Links" title — off since 2026-11-12 (Eric: "remove the quick links text"). */
// Off (2026-11-12, Eric: "remove the quick links text"); back on for part of 2026-11-18, then off again the same day
// (Eric: "remove the Quick Links title from the left nav").
const SHOW_QUICK_LINKS_TITLE: boolean = false
// The account pages' "My Account" title stays off — it shared SHOW_QUICK_LINKS_TITLE until 2026-11-18, and the ask was the
// Quick Links title.
const SHOW_ACCOUNT_LINKS_TITLE: boolean = false

export type AtlasJourneyLinksCardProps = {
  onOpenStep?: (id: string) => void
  onOpenRequirements?: () => void
  style?: CSSProperties
  /** Without Flashcards and Exam Simulator — the course's own pages (Eric/Atlas
   *  WIP's right rail, 2026-10-13; it showed only My Courses and My
   *  Certificates earlier that day). Off by default: every other host keeps
   *  the full list. */
  withoutCoursePages?: boolean
  /** A 1px rule under the title, 16 either side as the Readiness card's
   *  (Eric/Atlas WIP's Home, 2026-10-13). */
  titleRule?: boolean
  /** The NAVIGATING rows drawn and inert — My Courses, My Certificates and
   *  the two course pages — on the End-to-End Demo's Home (2026-10-15).
   *
   *  ⚠ THE THREE INFORMATION LINKS ARE NOT COVERED (2026-10-15, Jillienne:
   *  they "should trigger the updated sheets from Jills Hybrid version").
   *  Exam Information, Applying for a License and State Requirements open a
   *  SHEET over the page rather than going anywhere, so they cost the demo
   *  nothing — the learner is still on Home when it closes. The rows this
   *  does silence are the ones that would walk out of the demo. */
  linksOff?: boolean
  /**
   * LET THE TWO LEARNING-PAGE ROWS THROUGH anyway — 2026-11-02.
   *
   * ⚠ IT EXISTS BECAUSE `linksOff` OUTLIVED ITS REASON. That prop was set on
   * 2026-10-15 to stop the demo walking out of itself, and at the time it was
   * right: My Courses and My Certificates were drawn and inert, so clicking
   * through landed a reviewer on a dead end with no way back. Both are real
   * pages now, inside this same shell, each with a Back to Home — going there
   * is going further INTO the product, not out of it. The rows were still
   * silently doing nothing, which made the two pages unreachable by clicking
   * on the one version the Atlas Learning row opens.
   *
   * ⚠ IT DOES NOT WEAKEN `linksOff` ANYWHERE ELSE. Flashcards and Exam
   * Simulator — the rows that do leave — are not covered, and both hosts that
   * set `linksOff` also pass `withoutCoursePages`, so those two are not drawn
   * for them at all. The three information rows were never covered: they open
   * a sheet over the page and close back to it.
   */
  learningPagesLive?: boolean
  /**
   * WHICH ROW TO DRAW ACTIVE, instead of reading the URL — 2026-10-22.
   *
   * ⚠ IT EXISTS BECAUSE THE DEV HANDOFF CANNOT FAKE A URL ANY MORE. The
   * Quick Links previews used to wrap this card in a `MemoryRouter` with
   * `initialEntries: ['/?section=courses']`, which is how the Active row
   * state was shown. React Router 7 makes a Router inside a Router a THROWN
   * ERROR rather than a warning, and the handoff page is already inside the
   * app's own — so that wrapper took the whole page down to a blank screen.
   * Naming the active row is the honest replacement: the preview says which
   * row is active rather than staging a fake address bar to imply it.
   *
   * ⚠ OPTIONAL, AND ABSENT MEANS READ THE URL, which is what every surface
   * in the product does. Only the handoff passes it.
   */
  activeSection?: string | null
}

export function AtlasJourneyLinksCard({ onOpenStep, onOpenRequirements, style, withoutCoursePages = false, titleRule = false, linksOff = false, learningPagesLive = false, activeSection }: AtlasJourneyLinksCardProps) {
  // The count beside My Courses — see `useMyCoursesCount`.
  const coursesCount = useMyCoursesCount()
  const [params, setParams] = useSearchParams()
  /* Which link is the page you are on — the four that are pages; the three
     sheet links never are.
     ⚠ `activeSection === undefined` is the test, not a falsy one: `null` is a
        caller deliberately saying "Home", and `?? ` would hand that straight
        back to the URL. */
  const section = activeSection === undefined ? params.get('section') : activeSection
  const coursePage = params.get('coursePage')
  const here = (s: string, page?: string) => section === s && (page ? coursePage === page : true)
  /* `off` is per-row now, not per-card: the two learning pages can be let
     through while everything else `linksOff` covers stays silent. */
  const go = (section: string | null, extra?: Record<string, string>, off: boolean = linksOff) =>
    off ? undefined : setParams((prev) => {
      const next = new URLSearchParams(prev)
      if (section) next.set('section', section)
      else next.delete('section')
      next.delete('coursePage')
      for (const [k, v] of Object.entries(extra ?? {})) next.set(k, v)
      return next
    })
  /* OFF HOME, THE SHEET OPENS WHERE YOU ARE (2026-11-10, Eric: "do not reload to the homepage") — the request goes on the
     current page's URL and `AtlasInfoSheets` answers it there. On Home, and on the phone (where these are Home's own pages),
     it still goes Home. */
  const phone = useFeatureFlag('home-breakpoint').variant === 'mobile'
  const homeAndOpen = (what: string) => () =>
    params.get('section') && !phone
      ? go(params.get('section'), { [ATLAS_OPEN_PARAM]: what, ...(coursePage ? { coursePage } : null) }, false)
      : go(null, { [ATLAS_OPEN_PARAM]: what })
  const apply = GET_LICENSED_STEPS[GET_LICENSED_STEPS.length - 1]
  const accountGroup = useFeatureFlag('atlas-rail-account-group').enabled

  return (
    <nav aria-label="Quick links" className="cre-quick-links-card" style={{ ...SIDE_CARD, ...style, ...QUICK_LINKS_FRAME }}>
      {/* The exam-date card's heading style — Serif H8 (2026-10-02, the
          designer's request; the design sets it in Open Sans SemiBold 16). */}
      {/* "Quick Links" since 2026-10-07 (Eric's request); it was "More
          Information for Your Journey" ("Other …" before 2026-10-06). */}
      {/* Off (2026-11-12, Eric: "remove the quick links text") — kept behind SHOW_QUICK_LINKS_TITLE. */}
      {SHOW_QUICK_LINKS_TITLE ? <p style={TITLE}>Quick Links</p> : null}
      {/* The card's 16 gap below it; 8 above — the gap less 8 (2026-10-13,
          Eric's request). */}
      {SHOW_QUICK_LINKS_TITLE && titleRule ? <span aria-hidden style={{ ...TITLE_RULE, marginTop: -8 }} /> : null}
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Home, first (2026-10-07, Eric's request) — FA house-blank (regular);
            current on the Home page, which has no `section`. HIDDEN "for now"
            the same day (Eric's request): set SHOW_HOME_LINK to bring it back. */}
        {SHOW_HOME_LINK ? (
          // On FA house (regular) since it came back (2026-11-12, Eric); house-blank before.
          <SideLink icon={<HouseRegular size={13} aria-hidden />} label="Home" active={section == null} onClick={() => go(null)} />
        ) : null}
        <SideLink icon={<BookRegular size={13} aria-hidden />} label="My Courses" count={coursesCount} active={here('courses')} onClick={() => go('courses', undefined, linksOff && !learningPagesLive)} />
        {/* 15% larger in WIP's card (2026-10-13, Eric's request): 15, not 13 —
            the wide certificate glyph read small beside the book.
            "Certificates & Transcripts" since 2026-11-19 ("Certificates and Transcripts" from 2026-11-18,
            "My Certificates" before; Eric). */}
        <SideLink icon={<FileCertificateRegular size={withoutCoursePages ? 15 : 13} aria-hidden />} label="Certificates & Transcripts" active={here('certificates')} onClick={() => go('certificates', undefined, linksOff && !learningPagesLive)} />
        {withoutCoursePages ? null : (
        <>
        <SideLink icon={<NotebookRegular size={13} aria-hidden />} label="Flashcards" active={here('course', 'flashcards')} onClick={() => go('course', { coursePage: 'flashcards' })} />
        <SideLink icon={<BallotCheckRegular size={13} aria-hidden />} label="Exam Simulator" active={here('course', 'exam-simulator')} onClick={() => go('course', { coursePage: 'exam-simulator' })} />
        </>
        )}
        {/* Exam Information and Applying for a License, OFF the rail (2026-11-18, Eric: "remove exam information and applying
            for license links") — kept; set SHOW_SHEET_LINKS true to bring both back. Their sheets still open from Home's steps. */}
        {SHOW_SHEET_LINKS ? (
          <>
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
          </>
        ) : null}
        <SideLink
          // 15, not 13 (2026-11-19, Eric): the clipboard is FA's narrowest glyph here (384 wide to the book's 448), so at
          // 13 it read smaller than the rows above it — the same fix the certificate glyph got.
          icon={<ClipboardListCheckRegular size={15} aria-hidden />}
          // "State Licensing Requirements" since 2026-11-18 (Eric; "State Requirements" before).
          label="State Licensing Requirements"
          /* NO ACTION for now (2026-11-18, Eric: "it will be coded to load another page or document at some point"). A no-op
             rather than no handler, so the row still looks and hovers like its neighbours instead of drawing disabled. It
             opened the State Requirements sheet — set REQUIREMENTS_LINK_LIVE true to put that back. */
          onClick={REQUIREMENTS_LINK_LIVE ? (onOpenRequirements ?? homeAndOpen('requirements')) : () => {}}
        />
        {/* Account, under State Licensing Requirements (2026-11-19, Eric) — `atlas-rail-account-group`. */}
        {accountGroup ? (
          <AccountGroup
            active={section != null && isAccountSection(section)}
            here={(id) => here(id)}
            onSelect={(id) => go(id, undefined, false)}
          />
        ) : null}
      </ul>
    </nav>
  )
}

/* THE ACCOUNT GROUP (2026-11-19, Eric's request). The parent row is FA circle-user (regular) and opens Profile, the
   account area's first page. Its children are the learner profile dropdown's links, in the dropdown's order and with
   its labels (`AtlasHeader`), so the two navs name the same pages the same way.

   · Shown only while an account page is open — the parent is "active" then.
   · They slide down: the wrapper's grid row runs 0fr → 1fr, which animates to the content's own height with no measuring,
     eased in and out. `.cre-quick-links-sub` in tokens.css turns the motion off under prefers-reduced-motion.
   · It opens on the frame AFTER mount, so arriving on an account page plays the slide rather than landing open.
   · Collapsed, the list is `inert` and `aria-hidden` — out of the tab order and the accessibility tree, not just out of
     sight (jsdom does not read `inert` as hidden; `aria-hidden` is the half every tool agrees on).
   · No icons: each child's text starts on the parent rows' text line, 26 in — the 18 icon slot and the row's 8 gap. */
const ACCOUNT_CHILDREN: readonly { id: AccountSectionId; label: string }[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'transcripts', label: 'Certificates & Transcripts' },
  { id: 'purchases', label: 'My Purchases' },
]
const ACCOUNT_CHILD_INDENT = 18 + 8
const ACCOUNT_SLIDE = 'grid-template-rows 320ms cubic-bezier(0.65, 0, 0.35, 1)'

function AccountGroup({
  active,
  here,
  onSelect,
}: {
  active: boolean
  here: (id: AccountSectionId) => boolean
  onSelect: (id: AccountSectionId) => void
}) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const frame = requestAnimationFrame(() => setOpen(active))
    return () => cancelAnimationFrame(frame)
  }, [active])
  const listId = useId()
  return (
    <li>
      <SideRow
        icon={<CircleUserRegular size={13} aria-hidden />}
        label="Account"
        onClick={() => onSelect('profile')}
        expanded={open}
        controls={listId}
        // SemiBold while its pages are open, without the capsule — the capsule is for the child you are on.
        style={active ? { fontWeight: 600 } : undefined}
      />
      <div className="cre-quick-links-sub" style={{ display: 'grid', gridTemplateRows: open ? '1fr' : '0fr', transition: ACCOUNT_SLIDE }}>
        {/* The 8 either side and 4 under are the active capsule's overhang (SIDE_ROW_ACTIVE), handed back by the margins —
            without them the clip would cut the capsule's ends. */}
        <div inert={!open} aria-hidden={!open || undefined} style={{ overflow: 'hidden', minHeight: 0, margin: '0 -8px -4px', padding: '0 8px 4px' }}>
          <ul
            id={listId}
            aria-label="Account"
            // 8 above the first child — the active row's 4 overhang (SIDE_ROW_ACTIVE) and 4 clear of the parent — and 12
            // between children: that 8, plus 4 more (2026-11-19, Eric: "only enough to show their active state bg", then
            // "add 4px padding between the child items").
            style={{ listStyle: 'none', margin: 0, padding: `8px 0 0 ${ACCOUNT_CHILD_INDENT}px`, display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            {ACCOUNT_CHILDREN.map(({ id, label }) => (
              <li key={id}>
                <SideRow label={label} active={here(id)} onClick={() => onSelect(id)} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </li>
  )
}

/**
 * THE ACCOUNT NAV AS A QUICK LINKS CARD — 2026-11-03, Eric's request. The
 * account pages' own sections (Profile · Notifications · Transcripts · My
 * Purchases, and Purchased for Others where the brand has it), drawn in this
 * card's title, rows, hover and active capsule, so the account pages wear
 * the same left column as My Courses and My Certificates. Replaces
 * `AccountSubNav` there; see `useAtlasAccountPages`.
 */
export function AtlasAccountLinksCard({
  active,
  onSelect,
  onHome,
  style,
}: {
  active: AccountSectionId
  onSelect: (id: AccountSectionId) => void
  /** The Home row above Profile (2026-11-18, Eric: "add the home link above the profile") — Quick Links' own Home row,
   *  same house icon. Absent, no row. */
  onHome?: () => void
  style?: CSSProperties
}) {
  const { brand } = useAccount()
  const giftRecipientsOn = useFeatureFlag('gift-recipients').enabled
  return (
    <nav aria-label="Account sections" className="cre-quick-links-card" style={{ ...SIDE_CARD, ...style, ...QUICK_LINKS_FRAME }}>
      {/* No "My Account" title (2026-11-12, Eric) — like Quick Links', kept behind SHOW_QUICK_LINKS_TITLE. */}
      {SHOW_ACCOUNT_LINKS_TITLE ? <p style={TITLE}>My Account</p> : null}
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {onHome ? <SideLink icon={<HouseRegular size={13} aria-hidden />} label="Home" onClick={onHome} /> : null}
        {accountSectionsFor(brand, giftRecipientsOn).map(({ id, label, icon }) => {
          const Icon = ACCOUNT_ICONS_REGULAR[id] ?? icon
          return (
          <SideLink key={id} icon={<Icon size={13} aria-hidden />} label={label} active={id === active} onClick={() => onSelect(id)} />
          )
        })}
      </ul>
    </nav>
  )
}

/* THE ACCOUNT ROWS IN REGULAR (2026-11-18, Eric: "the same weight as the icons on the learner home") — Quick Links' house,
   book and certificate are Regular; the shared section list carries Light, which the account dropdown keeps. */
const ACCOUNT_ICONS_REGULAR: Partial<Record<AccountSectionId, typeof UserRegular>> = {
  profile: UserRegular,
  notifications: BellRegular,
  transcripts: FileLinesRegular,
  purchases: ReceiptRegular,
  'gift-recipients': GiftRegular,
}

function SideLink(props: SideRowProps) {
  return (
    <li>
      <SideRow {...props} />
    </li>
  )
}

type SideRowProps = {
  /** Absent, no icon slot — the Account group's children (2026-11-19). */
  icon?: ReactNode
  label: string
  /** A count after the label, 4 on — "(3)", the parentheses at the label's
   *  weight and the figure bold (2026-11-03, Eric's request). */
  count?: number | null
  /** The page you are on — a white capsule behind the row. */
  active?: boolean
  onClick?: () => void
  /** A row that opens a group — the Account row (2026-11-19). */
  expanded?: boolean
  controls?: string
  style?: CSSProperties
}

function SideRow({ icon, label, count, active = false, onClick, expanded, controls, style }: SideRowProps) {
  return (
      <button
        type="button"
        className="cre-compass-v2-row"
        aria-current={active ? 'page' : undefined}
        aria-expanded={expanded}
        aria-controls={controls}
        onClick={onClick}
        disabled={!onClick}
        style={{ ...(active ? { ...SIDE_ROW, ...SIDE_ROW_ACTIVE } : SIDE_ROW), ...style }}
      >
        {icon ? (
          <span aria-hidden style={{ width: 18, flex: 'none', display: 'inline-flex', justifyContent: 'center', color: 'var(--color-atlas-home-icon, var(--color-compass-page-button))' }}>
            {icon}
          </span>
        ) : null}
        {/* `data-label` feeds a hidden Medium copy (`.cre-quick-link-label`,
            tokens.css) that holds the hover weight's width, so a card sized to
            its content does not grow on hover (2026-10-13). */}
        <span className="cre-quick-link-label" data-label={count == null ? label : `${label} (${count})`} style={{ flex: '1 1 0', minWidth: 0, textAlign: 'left' }}>
          {count == null ? (
            label
          ) : (
            <span>
              {label}
              {/* Out of the row's name, so it is still "My Courses" to a
                  screen reader and to every test that finds it by name. */}
              <span aria-hidden style={{ marginLeft: 4 }}>
                (<span style={{ fontWeight: 700 }}>{count}</span>)
              </span>
            </span>
          )}
        </span>
        {/* Shown on hover / focus only (2026-10-13, Eric's request) —
            `.cre-quick-link-chevron`, tokens.css. It keeps its space, so the
            row does not shift when it appears. */}
        <span aria-hidden className="cre-quick-link-chevron" style={{ display: 'inline-flex', color: 'var(--color-atlas-home-icon, var(--color-compass-page-button))' }}>
          <AngleRightRegular size={13} aria-hidden />
        </span>
      </button>
  )
}

/** THE QUICK LINKS RAIL'S WIDTH, ONE NUMBER FOR EVERY PAGE (2026-11-18, Eric: "allow the left links rail to expand
 *  horizontally enough to fit … adjust the left rail width on all pages not just the homepage"). The card is fit-content
 *  and measured 279.5 once "Certificates & Transcripts" and "State Licensing Requirements" came in — so Home's column,
 *  My Courses', Certificates' and the account pages' all take 280, and the card no longer spills 8 past its column.
 *  It was 234 (2026-10-14, sized to "Applying for a License"). */
export const QUICK_LINKS_W = 280
/** Exam Information and Applying for a License on the rail — off since 2026-11-18 (Eric). */
const SHOW_SHEET_LINKS = false
/** State Licensing Requirements opening its sheet — off since 2026-11-18 (Eric); it will load a page or document later. */
const REQUIREMENTS_LINK_LIVE = false
/** What it was — Home's row pads the difference so the rail keeps its x (see AtlasHomeJillMain). */
export const QUICK_LINKS_W_BEFORE = 234
const SIDE_CARD: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  padding: '24px 32px 32px',
  boxSizing: 'border-box',
  borderRadius: 'var(--atlas-card-radius, 12px)',
  border: '1px solid var(--color-atlas-nav-rule)',
}
/* EVERY QUICK LINKS CARD, WHEREVER IT IS DRAWN (2026-11-12, Eric), over whatever its caller set:
   · as wide as its longest row and its padding, no wider ("fit to the width of the longest item");
   · a 1 Primary 100 border;
   · pinned 40 under the header as the page scrolls — `.cre-quick-links-card` in tokens.css, which also stretches its parent
     so there is a column to pin within. */
const QUICK_LINKS_FRAME: CSSProperties = { width: 'fit-content', border: '1px solid var(--color-primary-100)' }
/* The Readiness card's Tertiary 300 hairline. */
const TITLE_RULE: CSSProperties = { display: 'block', height: 1, background: 'var(--color-atlas-tan-300)' }
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
  // 8, not a full capsule (2026-11-19, Eric).
  borderRadius: 8,
  // Primary 100 (2026-11-19, Eric: "add the primary 100 bg back") — white vanished once the pages went white.
  background: 'var(--color-primary-100)',
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
