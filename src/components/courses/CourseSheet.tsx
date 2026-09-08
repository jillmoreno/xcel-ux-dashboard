import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, BookOpen, ChalkboardUser, Monitor, StarSolid, Video, X } from '@/icons'
import { Sheet } from '@/components/ui/Sheet'
import { Toast } from '@/components/ui/Toast'
import { STATE_ABBR, type IndividualCourse } from '@/data/catalogFixtures'
import { useAccount } from '@/context/AccountContext'
import { useCourseLauncher } from '@/components/layout/CourseLauncherContext'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { resolveCommerceState } from '@/data/commerce/entitlement'
import { getCourseImage } from '@/utils/courseImage'
import { EnrollmentConfirmationModal } from './EnrollmentConfirmationModal'
import { ManageEnrollmentPanel, ManageEnrollmentFooter, type SwitchKind } from './ManageEnrollmentPanel'
import { AddToCartToast, type AddToCartItem } from './AddToCartToast'
import { courseHasEnrollmentSwitches } from './alreadyEnrolledUtil'
import { ProductPriceSlot } from './ProductPriceSlot'
import { EnrolledBadge } from './EnrolledBadge'
import { CourseInfoTabs } from './CourseInfoTabs'
import {
  BADGE_LABEL,
  BILLING_ADDRESS,
  DELIVERY_ICON,
  DELIVERY_LABEL,
  INSTRUCTOR,
  VENUE,
  WEBINAR_INFO,
} from './courseSheetFixtures'

type Props = {
  open: boolean
  onClose: () => void
  data: IndividualCourse | null
}

export function CourseSheet({ open, onClose, data }: Props) {
  const navigate = useNavigate()
  const launcher = useCourseLauncher()
  const { brand, tier } = useAccount()
  const [confirmOpen, setConfirmOpen] = useState(false)
  // Manage-enrollment view: swaps the sheet body in place (owned-course
  // management stays in the side panel — not a centered modal). `manageFlow`
  // is the step within it (`null` = the hub / action list, else the open
  // picker) — lifted here so the sheet header's single "← Back" can step the
  // flow (picker → hub → Course Details) instead of a separate in-body link.
  const [manage, setManage] = useState(false)
  const [manageFlow, setManageFlow] = useState<SwitchKind | null>(null)
  // The picked session/modality id — lifted here so the Confirm CTA can live in
  // the sheet's pinned footer (below the scroll body) rather than in the list.
  const [manageSelection, setManageSelection] = useState<string | null>(null)
  // A priced format switch is a purchase → the richer Add-to-Cart toast.
  const [cartItem, setCartItem] = useState<AddToCartItem | null>(null)
  const [cartToastOpen, setCartToastOpen] = useState(false)

  // Opening a picker (or stepping back to the hub) always starts with a clean
  // selection.
  const changeManageFlow = (next: SwitchKind | null) => {
    setManageFlow(next)
    setManageSelection(null)
  }
  const [toastOpen, setToastOpen] = useState(false)
  const [switchToast, setSwitchToast] = useState<{ open: boolean; title: string; body: ReactNode }>({
    open: false,
    title: '',
    body: null,
  })
  const alreadyEnrolledFlag = useFeatureFlag('already-enrolled-modal')

  if (!data) return null

  // Tier-aware commerce state — replaces the old member/non-member boolean.
  const state = resolveCommerceState(brand, tier, data)
  const isIncluded = state.kind === 'included'
  const isLocked = state.kind === 'locked'
  // Live-streamed online courses read as "Livestream" with a video-camera icon
  // (mirrors the Recommended "What's Trending" card); everything else keeps its
  // delivery icon + label.
  const DeliveryIcon = data.livestream ? Video : (DELIVERY_ICON[data.delivery] ?? Monitor)
  const imageUrl = data.imageUrl ?? getCourseImage(data.id)
  const isWebinar = data.delivery === 'webinar'
  const isInPerson = data.delivery === 'in-person'
  const isLive = isWebinar || isInPerson

  // Already-enrolled interception. When the member is enrolled in a course that
  // carries switchable sessions / modalities and the flag is on, the primary
  // CTA swaps the sheet body to the Manage Enrollment view instead of confirming
  // a fresh enrollment. Member-only by construction (a non-member resolves to
  // `priced`, not `included`, so they never reach this branch).
  const interceptEnrolled =
    isIncluded && alreadyEnrolledFlag.enabled && courseHasEnrollmentSwitches(data)

  // Ownership treatment (title → "Course Details", price → "Enrolled" badge) is
  // data-driven off `enrolled` and member-scoped (a non-member resolves to `priced`,
  // never `included`) — independent of the already-enrolled-modal flag, which
  // only governs whether the "Manage Enrollment" switch flows are reachable.
  const isEnrolled = isIncluded && !!data.enrolled

  // Date / time block for the confirmation modal — mirrors the 3rd + 4th
  // lines of the sheet header (date range + session count, then the meeting
  // cadence) so the modal restates the same schedule the user just saw.
  const scheduleLines = isLive
    ? [
        `${WEBINAR_INFO.dateRange} | ${WEBINAR_INFO.sessionCount} Sessions`,
        WEBINAR_INFO.meetingCadence,
      ]
    : data.schedule
      ? data.schedule.split('|').map((s) => s.trim()).filter(Boolean)
      : []
  const locationLines = [VENUE.name, VENUE.street, VENUE.cityStateZip]

  const handlePrimaryClick = () => {
    // Member-exclusive product a non-member can't buy à la carte → route to plans.
    if (isLocked) {
      onClose()
      navigate('/membership/plans')
      return
    }
    // Already enrolled → swap the sheet body to the Manage Enrollment view
    // (switch flows) instead of a fresh confirmation.
    if (interceptEnrolled) {
      setManage(true)
      return
    }
    // Included / In-Person → seat reservation modal. Included / Webinar →
    // shipping confirmation modal (course materials are physically mailed).
    if (isIncluded && (isInPerson || isWebinar)) {
      setConfirmOpen(true)
      return
    }
    // TODO(enroll): wire online / podcast enroll + paid add-to-cart flows when
    // those commerce endpoints are available.
  }

  const handleConfirmEnroll = () => {
    setConfirmOpen(false)
    onClose()
    setToastOpen(true)
    // Defer the scroll until after the sheet's body-overflow lock is released
    // on cleanup; otherwise the page stays at its previous scroll position.
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
  }

  // Reset to the details view on every close path (button / backdrop / Escape),
  // so reopening the sheet always starts on Course Details.
  const handleClose = () => {
    setManage(false)
    changeManageFlow(null)
    onClose()
  }

  // Single back affordance for the Manage Enrollment view (the sheet header).
  // Steps the flow one level: an open picker returns to the hub; the hub
  // returns to Course Details.
  const handleManageBack = () => {
    if (manageFlow) {
      changeManageFlow(null)
    } else {
      setManage(false)
    }
  }

  // A completed switch closes the whole sheet (back to the course catalog) and
  // fires the success toast — a portal sibling of the Sheet, so it survives the
  // sheet closing. Mirrors handleAddToCart's close-then-toast so the learner
  // always lands back on the catalog when the confirmation appears.
  const handleSwitchFinish = (title: string, body: ReactNode) => {
    setManage(false)
    changeManageFlow(null)
    setSwitchToast({ open: true, title, body })
    onClose()
  }

  // A priced format switch adds the course-in-new-format to the cart → close the
  // whole sheet (back to the catalog) and fire the richer Add-to-Cart toast (a
  // portal sibling of the Sheet, so it survives the sheet closing).
  const handleAddToCart = (item: AddToCartItem) => {
    setManage(false)
    changeManageFlow(null)
    setCartItem(item)
    setCartToastOpen(true)
    onClose()
  }

  // Header title tracks the active view.
  const sheetTitle = manage ? 'Manage Enrollment' : isEnrolled ? 'Course Details' : 'Purchase Course'

  return (
    <>
    <Sheet open={open} onClose={handleClose} title={sheetTitle}>
      <header
        style={{
          height: 100,
          flexShrink: 0,
          padding: '20px 24px 4px',
          background: 'var(--color-neutral-extra-light)',
          borderBottom: '1px solid var(--color-border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <button
          type="button"
          onClick={manage ? handleManageBack : handleClose}
          className="cre-sheet-close"
          style={{
            alignSelf: 'flex-start',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'transparent',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            fontFamily: 'var(--font-body)',
            fontSize: 16,
            fontWeight: 600,
            lineHeight: '24px',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          {manage ? <ArrowLeft size={14} aria-hidden /> : <X size={14} aria-hidden />}
          {manage ? 'Back' : 'Close'}
        </button>
        <h2
          style={{
            margin: 0,
            fontFamily: 'var(--font-heading)',
            fontWeight: 500,
            fontSize: 28,
            lineHeight: 1.2,
            color: 'var(--color-primary-500)',
          }}
        >
          {sheetTitle}
        </h2>
      </header>
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          scrollbarGutter: 'stable',
          // In the Manage Enrollment view the whole body is one white plane —
          // paint the scroll container white too, so the reserved scrollbar
          // gutter on the right doesn't show the tinted neutral-extra-light.
          background: manage ? 'var(--color-surface-card)' : 'var(--color-neutral-extra-light)',
        }}
      >
        {manage ? (
          // Fill the full scroll area with the card surface so the short
          // Manage Enrollment body reads as one white plane (no tinted
          // neutral-extra-light showing below the content).
          <div style={{ background: 'var(--color-surface-card)', minHeight: '100%' }}>
            <ManageEnrollmentPanel
              data={data}
              flow={manageFlow}
              onFlowChange={changeManageFlow}
              selected={manageSelection}
              onSelect={setManageSelection}
            />
          </div>
        ) : (
        <>
        <div style={{ background: 'var(--color-surface-card)', padding: '20px 24px 0' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', paddingBottom: 16 }}>
            <div
              aria-hidden
              style={{
                width: 80,
                height: 80,
                borderRadius: 6,
                background: `center / cover no-repeat url(${imageUrl})`,
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>
                {data.title}
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', columnGap: 6, rowGap: 2, fontFamily: 'var(--font-body)', fontSize: 12 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                  <DeliveryIcon size={12} aria-hidden />
                  {data.livestream ? 'Livestream' : DELIVERY_LABEL[data.delivery]}
                  <span aria-hidden style={{ color: 'var(--color-neutral-300)' }}>|</span>
                  {BADGE_LABEL[data.badge]}
                  <span aria-hidden style={{ color: 'var(--color-neutral-300)' }}>|</span>
                  {data.hours} Hours
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                  <span aria-hidden style={{ color: 'var(--color-neutral-300)' }}>|</span>
                  {data.states.map((s) => STATE_ABBR[s] ?? s).join(' | ')}
                </span>
              </div>
              {isLive && (
                <>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-body)', fontSize: 12 }}>
                    {WEBINAR_INFO.dateRange}
                    <span aria-hidden style={{ color: 'var(--color-neutral-300)' }}>|</span>
                    {WEBINAR_INFO.sessionCount} Sessions
                  </span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 12 }}>{WEBINAR_INFO.meetingCadence}</span>
                </>
              )}
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 12 }}>{INSTRUCTOR.name}, {INSTRUCTOR.title.split(',')[0]}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500 }}>
                <StarSolid size={12} aria-hidden style={{ color: 'var(--color-warning-500)' }} />
                {data.rating.toFixed(1)}
              </span>
              {isInPerson && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 6, fontFamily: 'var(--font-body)', fontSize: 12 }}>
                  <span>{VENUE.name}</span>
                  <span>{VENUE.street}</span>
                  <span>{VENUE.cityStateZip}</span>
                </div>
              )}
              {isEnrolled ? (
                <EnrolledBadge placement="inline" style={{ alignSelf: 'flex-start', marginTop: 6 }} />
              ) : (
                <ProductPriceSlot state={state} panel listPrice={data.price} style={{ alignSelf: 'flex-start', marginTop: 6 }} />
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 30, paddingBottom: 20 }}>
            <button
              type="button"
              onClick={handlePrimaryClick}
              style={{
                flex: 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px 24px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-action)',
                color: '#fff',
                border: 'none',
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {interceptEnrolled
                ? 'Manage Enrollment'
                : isIncluded
                  ? 'Enroll in Course'
                  : isLocked
                    ? 'See Membership Plans'
                    : 'Add to Cart'}
            </button>
            <button
              type="button"
              onClick={() => {
                onClose()
                // Inside the Dashboard Rebrand shell, open the Learning Launcher
                // in place (keeps the left rail); elsewhere route to the
                // standalone course page.
                if (launcher.available) launcher.open(data.id)
                else navigate(`/courses/${data.id}`)
              }}
              style={{
                flex: 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px 24px',
                borderRadius: 'var(--radius-md)',
                background: 'transparent',
                color: 'var(--color-action)',
                border: '1.5px solid var(--color-action)',
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {/* Secondary action previews the course content. It reads
                  "Course Overview" in every state — the discovery / purchase
                  cases (Enroll / Add to Cart / See Plans) AND the owned case
                  (Manage Enrollment), where overviewing an owned course still
                  makes sense. */}
              Course Overview
            </button>
          </div>
        </div>

        <CourseInfoTabs data={data} />
        </>
        )}
      </div>
      {/* Pinned footer — the Manage Enrollment Confirm CTA lives below the
          scroll body so it stays visible for any list length. Only the picker
          steps (not the hub) carry a confirm action. */}
      {manage && manageFlow && (
        <footer
          style={{
            flexShrink: 0,
            padding: '16px 24px',
            borderTop: '1px solid var(--color-border-subtle)',
            background: 'var(--color-surface-card)',
          }}
        >
          <ManageEnrollmentFooter
            data={data}
            flow={manageFlow}
            selectedId={manageSelection}
            onFinish={handleSwitchFinish}
            onAddToCart={handleAddToCart}
          />
        </footer>
      )}
    </Sheet>
    <EnrollmentConfirmationModal
      open={confirmOpen}
      onClose={() => setConfirmOpen(false)}
      onConfirm={handleConfirmEnroll}
      title={isWebinar ? 'Shipping Details' : 'Reserve Your Seat'}
      icon={isWebinar ? <BookOpen size={44} aria-hidden /> : <ChalkboardUser size={44} aria-hidden />}
      lead={
        isWebinar ? (
          <p style={{ margin: 0 }}>
            Your membership covers the cost of the course materials. Please, confirm your address to continue.
          </p>
        ) : (
          <>
            <p style={{ margin: 0, fontWeight: 600 }}>
              Only 12 seats remain for this course.
            </p>
            <p style={{ margin: 0 }}>
              Your membership includes access at no extra cost—please enroll only if you plan to attend.
            </p>
          </>
        )
      }
      rows={
        isWebinar
          ? [
              { label: 'Course Material:', lines: [data.title] },
              { label: 'Delivery:', lines: ['3 - 5 Business Days'] },
              {
                label: 'Shipping Address:',
                lines: BILLING_ADDRESS,
                action: (
                  <button
                    type="button"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: 0,
                      color: 'var(--color-action)',
                      fontFamily: 'var(--font-body)',
                      fontWeight: 600,
                      fontSize: 16,
                      lineHeight: '24px',
                      cursor: 'pointer',
                    }}
                  >
                    Edit
                  </button>
                ),
              },
            ]
          : [
              { label: 'Course Name:', lines: [data.title] },
              { label: 'Date / Time:', lines: scheduleLines },
              { label: 'Location:', lines: locationLines },
            ]
      }
    />
    <Toast
      open={toastOpen}
      onClose={() => setToastOpen(false)}
      tone="success"
      title="Success. You did it!"
      action={{
        label: 'Go to Course Details',
        onClick: () =>
          launcher.available ? launcher.open(data.id) : navigate(`/courses/${data.id}`),
      }}
    >
      You have enrolled in <strong style={{ fontWeight: 600 }}>{data.title}</strong>.
    </Toast>
    <Toast
      open={switchToast.open}
      onClose={() => setSwitchToast((t) => ({ ...t, open: false }))}
      tone="success"
      title={switchToast.title}
    >
      {switchToast.body}
    </Toast>
    <AddToCartToast open={cartToastOpen} onClose={() => setCartToastOpen(false)} item={cartItem} />
    </>
  )
}

