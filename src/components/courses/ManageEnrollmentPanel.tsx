import { type ReactNode } from 'react'
import {
  CalendarDay,
  Check,
  ChevronRight,
  Clock,
  Monitor,
  Podcast,
  Users,
  Video,
  X,
} from '@/icons'
import { useAccount } from '@/context/AccountContext'
import { resolveCommerceState } from '@/data/commerce/entitlement'
import { getCourseImage } from '@/utils/courseImage'
import { STATE_ABBR } from '@/data/catalogFixtures'
import type {
  CourseModalityOption,
  CourseSession,
  DeliveryMode,
  IndividualCourse,
} from '@/data/catalogFixtures'
import type { AddToCartItem } from './AddToCartToast'

/**
 * "Manage Enrollment" panel — the switch flows for a course the member already
 * holds, rendered **inline in the Course Details sheet body** (not a modal).
 * Managing an owned enrollment lives in the side panel, consistent with the
 * rest of the owned-course experience, rather than interrupting with a centered
 * dialog the way a purchase confirmation would.
 *
 * One flow, two switches:
 *   • Switch date/time → pick another session of the same live course.
 *   • Switch format    → move to another modality (self-paced / webinar /
 *     in-person). Each modality carries its own commerce state, so switching
 *     may be free (included) or hit a price / upgrade wall (priced).
 *
 * Structure: a hub (current enrollment + action rows) → the chosen picker.
 * Back navigation lives in the Course Details sheet header (a single "← Back"
 * that steps the flow: picker → hub → Course Details), so `flow` is controlled
 * by CourseSheet. The picker **selection** is controlled too (`selected` /
 * `onSelect`) so the Confirm CTA can live in the sheet's pinned footer
 * (`ManageEnrollmentFooter`) rather than scrolling with the list. That footer
 * owns the confirm action and hands a success toast up via `onFinish` to
 * CourseSheet (which owns the Toast, a portal sibling of the Sheet).
 */

export type SwitchKind = 'session' | 'modality'

const DELIVERY_ICON: Record<DeliveryMode, typeof Monitor> = {
  online: Monitor,
  podcast: Podcast,
  webinar: Video,
  'in-person': Users,
}

export function ManageEnrollmentPanel({
  data,
  flow,
  onFlowChange,
  selected,
  onSelect,
}: {
  data: IndividualCourse
  /** Which switch is open (`null` = the hub / action list). Controlled by
   *  CourseSheet so the sheet header's "← Back" can step the flow. */
  flow: SwitchKind | null
  onFlowChange: (flow: SwitchKind | null) => void
  /** Selected session/modality id (`null` = nothing picked). Controlled so the
   *  footer CTA can read it. */
  selected: string | null
  onSelect: (id: string) => void
}) {
  const hasSessions = (data.sessions?.length ?? 0) > 1
  const hasModalities = (data.modalities?.length ?? 0) > 1

  return (
    <div style={SHELL}>
      {flow ? (
        <FlowBody kind={flow} data={data} selected={selected} onSelect={onSelect} />
      ) : (
        <>
          <EnrolledSummary data={data} hasSessions={hasSessions} hasModalities={hasModalities} />
          <ActionList hasSessions={hasSessions} hasModalities={hasModalities} onPick={onFlowChange} />
        </>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────
 *  Hub summary — current-enrollment detail rows
 * ───────────────────────────────────────────────────────────────────── */

function EnrolledSummary({
  data,
  hasSessions,
  hasModalities,
}: {
  data: IndividualCourse
  hasSessions: boolean
  hasModalities: boolean
}) {
  const currentSession = data.sessions?.find((s) => s.id === data.enrolledSessionId)
  const currentModality = data.modalities?.find((m) => m.id === data.enrolledModality)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: '22px', color: 'var(--color-text-secondary)' }}>
        You're enrolled in this course. Need to make a change?
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: '22px' }}>
        <DetailRow label="Course:" value={data.title} />
        {hasSessions && currentSession && (
          <DetailRow
            label="Current session:"
            value={`${currentSession.day}, ${currentSession.date} · ${currentSession.time}`}
          />
        )}
        {hasModalities && currentModality && (
          <DetailRow label="Current format:" value={currentModality.label} />
        )}
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <span style={{ width: 118, flexShrink: 0, color: 'var(--color-text-secondary)' }}>{label}</span>
      <span style={{ flex: 1, fontWeight: 600, minWidth: 0, color: 'var(--color-neutral-darkest)' }}>{value}</span>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────
 *  Action list (hub) — one row per available switch
 * ───────────────────────────────────────────────────────────────────── */

function ActionList({
  hasSessions,
  hasModalities,
  onPick,
}: {
  hasSessions: boolean
  hasModalities: boolean
  onPick: (k: SwitchKind) => void
}) {
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {hasSessions && (
        <ActionRow
          icon={<CalendarDay size={20} aria-hidden />}
          title="Switch date/time"
          caption="Move to a different session of this course"
          onClick={() => onPick('session')}
        />
      )}
      {hasModalities && (
        <ActionRow
          icon={<Monitor size={20} aria-hidden />}
          title="Switch format"
          caption="Take this course online, live, or in person"
          onClick={() => onPick('modality')}
        />
      )}
    </div>
  )
}

function ActionRow({
  icon,
  title,
  caption,
  onClick,
}: {
  icon: ReactNode
  title: string
  caption: string
  onClick: () => void
}) {
  return (
    <button type="button" onClick={onClick} className="cre-enrolled-action" style={ACTION_ROW}>
      <span style={ACTION_ICON} aria-hidden>
        {icon}
      </span>
      <span style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
        <span style={{ display: 'block', fontWeight: 600, fontSize: 15, color: 'var(--color-neutral-darkest)' }}>
          {title}
        </span>
        <span style={{ display: 'block', fontSize: 13, color: 'var(--color-text-secondary)' }}>{caption}</span>
      </span>
      <ChevronRight size={16} aria-hidden style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
    </button>
  )
}

/* ─────────────────────────────────────────────────────────────────────
 *  Flow body — the picker + confirm for one switch
 * ───────────────────────────────────────────────────────────────────── */

function FlowBody({
  kind,
  data,
  selected,
  onSelect,
}: {
  kind: SwitchKind
  data: IndividualCourse
  selected: string | null
  onSelect: (id: string) => void
}) {
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h3 style={HEADING}>{kind === 'session' ? 'Switch your session' : 'Switch your format'}</h3>
      {kind === 'session' ? (
        <SessionPicker data={data} selected={selected} onSelect={onSelect} />
      ) : (
        <ModalityPicker data={data} selected={selected} onSelect={onSelect} />
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────
 *  Session picker (date/time switch)
 * ───────────────────────────────────────────────────────────────────── */

function SessionPicker({
  data,
  selected,
  onSelect,
}: {
  data: IndividualCourse
  selected: string | null
  onSelect: (id: string) => void
}) {
  const sessions = data.sessions ?? []
  return (
    <div style={PICKER_LIST}>
      {sessions.map((s) => (
        <SessionOption
          key={s.id}
          session={s}
          current={s.id === data.enrolledSessionId}
          selected={s.id === selected}
          onSelect={() => onSelect(s.id)}
        />
      ))}
    </div>
  )
}

function SessionOption({
  session,
  current,
  selected,
  onSelect,
}: {
  session: CourseSession
  current: boolean
  selected: boolean
  onSelect: () => void
}) {
  const soldOut = session.seatsLeft === 0 && !current
  const disabled = current || soldOut
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onSelect}
      aria-pressed={selected}
      disabled={disabled}
      className="cre-enrolled-option"
      data-selected={selected ? 'true' : 'false'}
      data-kind={current ? 'current' : soldOut ? 'soldout' : undefined}
      style={{ ...OPTION_ROW, ...(disabled ? OPTION_DISABLED : null) }}
    >
      {soldOut ? <SoldOutMark /> : <RadioDot selected={selected} muted={disabled} />}
      <span style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontWeight: 600,
            fontSize: 14,
            color: soldOut ? 'var(--color-text-secondary)' : 'var(--color-neutral-darkest)',
          }}
        >
          <CalendarDay
            size={13}
            aria-hidden
            style={{ color: soldOut ? 'var(--color-neutral-400)' : 'var(--color-primary-500)' }}
          />
          {session.day}, {session.date}
          {current && <span style={CURRENT_PILL}>Current</span>}
          {soldOut && <span style={SOLDOUT_PILL}>Sold out</span>}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, fontSize: 13, color: 'var(--color-text-secondary)' }}>
          <Clock size={12} aria-hidden />
          {session.time}
          {typeof session.seatsLeft === 'number' && !soldOut && (
            <>
              <span aria-hidden style={{ color: 'var(--color-neutral-300)' }}>|</span>
              {`${session.seatsLeft} seats left`}
            </>
          )}
        </span>
      </span>
    </button>
  )
}

/* ─────────────────────────────────────────────────────────────────────
 *  Modality picker (format switch) — commerce-aware
 * ───────────────────────────────────────────────────────────────────── */

function ModalityPicker({
  data,
  selected,
  onSelect,
}: {
  data: IndividualCourse
  selected: string | null
  onSelect: (id: string) => void
}) {
  const { brand, tier } = useAccount()
  const modalities = data.modalities ?? []
  return (
    <div style={PICKER_LIST}>
      {modalities.map((m) => (
        <ModalityOption
          key={m.id}
          option={m}
          brand={brand}
          tier={tier}
          current={m.id === data.enrolledModality}
          selected={m.id === selected}
          onSelect={() => onSelect(m.id)}
        />
      ))}
    </div>
  )
}

function ModalityOption({
  option,
  brand,
  tier,
  current,
  selected,
  onSelect,
}: {
  option: CourseModalityOption
  brand: ReturnType<typeof useAccount>['brand']
  tier: ReturnType<typeof useAccount>['tier']
  current: boolean
  selected: boolean
  onSelect: () => void
}) {
  const state = resolveCommerceState(brand, tier, { price: option.price, entitlement: option.entitlement })
  const Icon = DELIVERY_ICON[option.delivery]
  return (
    <button
      type="button"
      onClick={current ? undefined : onSelect}
      aria-pressed={selected}
      disabled={current}
      className="cre-enrolled-option"
      data-selected={selected ? 'true' : 'false'}
      data-kind={current ? 'current' : undefined}
      style={{ ...OPTION_ROW, ...(current ? OPTION_DISABLED : null) }}
    >
      <RadioDot selected={selected} muted={current} />
      <span style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 14, color: 'var(--color-neutral-darkest)' }}>
          <Icon size={13} aria-hidden style={{ color: 'var(--color-primary-500)' }} />
          {option.label}
          {current && <span style={CURRENT_PILL}>Current</span>}
        </span>
        {option.blurb && (
          <span style={{ display: 'block', marginTop: 3, fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {option.blurb}
          </span>
        )}
        <span style={{ marginTop: 6, display: 'inline-flex' }}>
          <CommerceChip state={state} />
        </span>
      </span>
    </button>
  )
}

function CommerceChip({ state }: { state: ReturnType<typeof resolveCommerceState> }) {
  if (state.kind === 'included') {
    return (
      <span style={{ ...CHIP, background: 'var(--color-secondary-100)', color: 'var(--color-secondary-800)' }}>
        <Check size={11} aria-hidden />
        Included with membership
      </span>
    )
  }
  if (state.kind === 'priced') {
    return (
      <span style={{ ...CHIP, background: 'var(--color-cta-100)', color: 'var(--color-cta-700)' }}>
        ${state.price} · unlock free with {state.unlockTierLabel}
      </span>
    )
  }
  return (
    <span style={{ ...CHIP, background: 'var(--color-neutral-100)', color: 'var(--color-text-secondary)' }}>
      Member exclusive
    </span>
  )
}

/* ─────────────────────────────────────────────────────────────────────
 *  Footer CTA — rendered in the sheet's pinned footer (a sibling of the
 *  scroll body in CourseSheet) so Confirm stays visible for any list length.
 *  Owns the confirm action + success toast; commerce-aware for the format
 *  switch (a priced modality routes to checkout instead of a clean swap).
 * ───────────────────────────────────────────────────────────────────── */

export function ManageEnrollmentFooter({
  data,
  flow,
  selectedId,
  onFinish,
  onAddToCart,
}: {
  data: IndividualCourse
  flow: SwitchKind
  selectedId: string | null
  /** Success toast for a clean (free) switch — session or included format. */
  onFinish: (title: string, body: ReactNode) => void
  /** A priced format switch is a purchase, so it fires the richer Add-to-Cart
   *  toast instead of the plain success toast. */
  onAddToCart: (item: AddToCartItem) => void
}) {
  const { brand, tier } = useAccount()

  if (flow === 'session') {
    const next = data.sessions?.find((s) => s.id === selectedId)
    const confirm = () => {
      if (!next) return
      onFinish(
        'Session updated',
        <>
          You're now enrolled for{' '}
          <strong style={{ fontWeight: 600 }}>
            {next.day}, {next.date}
          </strong>
          .
        </>,
      )
    }
    return (
      <ConfirmButton disabled={!next} onClick={confirm}>
        Confirm new session
      </ConfirmButton>
    )
  }

  // Format switch — commerce-aware.
  const option = data.modalities?.find((m) => m.id === selectedId)
  const state = option
    ? resolveCommerceState(brand, tier, { price: option.price, entitlement: option.entitlement })
    : null
  const priced = state?.kind === 'priced'

  const confirm = () => {
    if (!option || !state) return
    if (state.kind === 'priced') {
      // Commerce-difference target — a clean switch isn't possible; route to
      // checkout/upgrade. Stubbed like the rest of the catalog commerce.
      console.info('already-enrolled:switch-format:checkout', {
        courseId: data.id,
        modalityId: option.id,
        price: state.price,
      })
      onAddToCart({
        title: data.title,
        imageUrl: data.imageUrl ?? getCourseImage(data.id),
        DeliveryIcon: DELIVERY_ICON[option.delivery],
        meta: [
          option.label,
          `${data.hours} ${data.hours === 1 ? 'Hour' : 'Hours'}`,
          data.states.map((s) => STATE_ABBR[s] ?? s).join(' | '),
        ].filter(Boolean),
        price: `$${state.price.toFixed(2)}`,
      })
      return
    }
    onFinish(
      'Format switched',
      <>
        You're now taking this course as <strong style={{ fontWeight: 600 }}>{option.label}</strong>.
      </>,
    )
  }

  return (
    <ConfirmButton disabled={!option} onClick={confirm} accent={priced ? 'cta' : 'action'}>
      {priced && state?.kind === 'priced' ? `Continue to checkout · $${state.price}` : 'Confirm new format'}
    </ConfirmButton>
  )
}

/* ─────────────────────────────────────────────────────────────────────
 *  Shared bits
 * ───────────────────────────────────────────────────────────────────── */

/** Sold-out marker — replaces the selectable radio dot with a muted, struck
 *  circle (an ✕ in the same 18px footprint) so the row reads as unavailable
 *  while staying aligned with the pickable rows above/below it. */
function SoldOutMark() {
  return (
    <span
      aria-hidden
      style={{
        width: 18,
        height: 18,
        borderRadius: 'var(--radius-pill)',
        border: '2px solid var(--color-neutral-300)',
        background: 'var(--color-neutral-100)',
        color: 'var(--color-neutral-500)',
        flexShrink: 0,
        marginTop: 2,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <X size={9} aria-hidden />
    </span>
  )
}

function RadioDot({ selected, muted }: { selected: boolean; muted?: boolean }) {
  return (
    <span
      aria-hidden
      style={{
        width: 18,
        height: 18,
        borderRadius: 'var(--radius-pill)',
        border: `2px solid ${selected ? 'var(--color-action)' : muted ? 'var(--color-neutral-300)' : 'var(--color-neutral-400)'}`,
        flexShrink: 0,
        marginTop: 2,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {selected && (
        <span style={{ width: 9, height: 9, borderRadius: 'var(--radius-pill)', background: 'var(--color-action)' }} />
      )}
    </span>
  )
}

function ConfirmButton({
  disabled,
  onClick,
  children,
  accent = 'action',
}: {
  disabled: boolean
  onClick: () => void
  children: ReactNode
  accent?: 'action' | 'cta'
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        width: '100%',
        minHeight: 48,
        padding: '12px 28px',
        borderRadius: 'var(--radius-md)',
        background: disabled
          ? 'var(--color-neutral-200)'
          : accent === 'cta'
            ? 'var(--color-cta-500)'
            : 'var(--color-action)',
        color: disabled ? 'var(--color-text-secondary)' : '#fff',
        border: 'none',
        fontFamily: 'var(--font-body)',
        fontWeight: 600,
        fontSize: 15,
        lineHeight: '24px',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {children}
    </button>
  )
}

/* ── styles ────────────────────────────────────────────────────────── */

const SHELL: React.CSSProperties = {
  padding: '20px 24px 32px',
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
}

const HEADING: React.CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 20,
  lineHeight: '28px',
  color: 'var(--color-neutral-darkest)',
}

// Base border/background live in `.cre-enrolled-action` (tokens.css) so the
// hover state can cascade — inline styles would always win over a CSS :hover.
const ACTION_ROW: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  width: '100%',
  padding: '14px 16px',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
}

const ACTION_ICON: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 'var(--radius-md)',
  background: 'color-mix(in srgb, var(--color-primary-100) 55%, transparent)',
  color: 'var(--color-primary-500)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
}

const PICKER_LIST: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}

// Base border/background + the selected (data-selected), hover, and disabled
// (data-kind current/sold-out) states all live in `.cre-enrolled-option`
// (tokens.css) — inline styles here would out-specify those CSS states.
const OPTION_ROW: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 12,
  width: '100%',
  padding: '12px 14px',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
}

const OPTION_DISABLED: React.CSSProperties = {
  cursor: 'default',
}

// `marginLeft: auto` floats the status pill to the card's right edge, clear of
// the date; `flexShrink: 0` keeps it from being squeezed on a long date.
const CURRENT_PILL: React.CSSProperties = {
  marginLeft: 'auto',
  flexShrink: 0,
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  padding: '2px 7px',
  borderRadius: 'var(--radius-pill)',
  background: 'var(--color-primary-100)',
  color: 'var(--color-primary-700)',
}

const SOLDOUT_PILL: React.CSSProperties = {
  marginLeft: 'auto',
  flexShrink: 0,
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  padding: '2px 7px',
  borderRadius: 'var(--radius-pill)',
  background: 'var(--color-error-100)',
  color: 'var(--color-error-700)',
}

const CHIP: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  fontSize: 12,
  fontWeight: 600,
  padding: '3px 9px',
  borderRadius: 'var(--radius-pill)',
}
