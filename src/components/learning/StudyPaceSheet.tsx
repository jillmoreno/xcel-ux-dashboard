import { useMemo, useState, type ReactNode } from 'react'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import {
  studyPace,
  defaultPreset,
  formatEvening,
  formatPaceDate,
  presetLabel,
  isoPlusDays,
  isoFromDate,
  daysUntil,
  NIGHT_OPTIONS,
  STRAIN_MINS,
  EXAM_BUFFER_DAYS,
  STYLE_FACTORS,
  type PacePreset,
  type PresetId,
  type StudyStyle,
} from '@/lib/studyPace'

/**
 * The Adjust sheet — everything the Study Pace tile deliberately does not carry.
 *
 * FOUR GROUPS, in this order, and the order is the argument:
 *
 *   1. **What are you aiming at** — the three finish dates as radio rows. A
 *      preset is a DATE, not a weekly quota; the evening it costs is shown
 *      beside it as a consequence, not as the thing being chosen.
 *   2. **How many days a week** — the only lever that changes the shape of the
 *      week without moving the date.
 *   3. **Your exam date** — optional. TWO CEILINGS can bind (access expiry, and
 *      the exam minus its review buffer) and the sheet SAYS which one is doing
 *      the work. A pace that silently switched ceilings is how a learner stops
 *      believing the number.
 *   4. **Create a study plan** — a switch. Off by default.
 *
 * **The weekday picker exists only under 4**, and that is the one structural
 * decision worth not undoing: days-a-week is all the PACE needs, so that is all
 * groups 1–3 ask for. A calendar cannot be built without real weekdays and a
 * time, so those questions arrive with the thing that needs them — and from
 * then on ticking days is authoritative and re-prices the evening, rather than
 * letting the count and the calendar quietly disagree.
 */

export type PaceChoices = {
  /** `null` ⇒ the learner has not chosen; the model's Recommended stands. */
  presetId: PresetId | null
  nights: number | null
  /** ISO yyyy-mm-dd. */
  examDate: string | null
  style: StudyStyle
  /** Set once a study plan is built — weekdays are 0=Mon … 6=Sun. */
  plan: { weekdays: number[]; startTime: string } | null
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
/** The time of day the calendar proposes before the learner changes it. An
 *  evening default assumes a working adult, which is who buys this course. */
const DEFAULT_START_TIME = '19:00'

export function StudyPaceSheet({
  open,
  onClose,
  today,
  hoursRemaining,
  accessExpiresAt,
  courseTitle,
  choices,
  onChange,
}: {
  open: boolean
  onClose: () => void
  today: Date
  hoursRemaining: number
  accessExpiresAt?: string
  courseTitle?: string
  choices: PaceChoices
  onChange: (next: PaceChoices) => void
}) {
  /** Draft weekday/time live here, not in `choices`: nothing is written to the
   *  learner's plan until they press the button that says it will be. */
  const [planOn, setPlanOn] = useState(choices.plan != null)
  const [weekdays, setWeekdays] = useState<number[] | null>(choices.plan?.weekdays ?? null)
  const [startTime, setStartTime] = useState(choices.plan?.startTime ?? DEFAULT_START_TIME)

  const model = useMemo(
    () =>
      studyPace({
        today,
        hoursRemaining,
        accessExpiresAt,
        examDate: choices.examDate ?? undefined,
        nights: choices.nights ?? undefined,
        style: choices.style,
      }),
    [today, hoursRemaining, accessExpiresAt, choices.examDate, choices.nights, choices.style],
  )
  const selected =
    (choices.presetId && model.presets.find((p) => p.id === choices.presetId)) || defaultPreset(model)
  const days = weekdays ?? defaultWeekdays(selected.nights)
  const set = (patch: Partial<PaceChoices>) => onChange({ ...choices, ...patch })

  return (
    <Sheet open={open} onClose={onClose} title="Adjust your pace" width={460}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22, paddingBottom: 8 }}>
        <p style={{ ...hint, marginTop: -4 }}>
          {Math.round(hoursRemaining)} hours left{courseTitle ? ` of ${courseTitle}` : ''}. Everything below
          re-prices as you change it.
        </p>

        {/* 1 · AIM */}
        <Group label="What are you aiming at?">
          <div role="radiogroup" aria-label="Finish date" style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {model.presets.map((p) => (
              <AimRow
                key={p.id}
                preset={p}
                checked={p.id === selected.id}
                recommended={p.id === 'recommended'}
                onSelect={() => set({ presetId: p.id })}
              />
            ))}
          </div>
          <BindingNote model={model} today={today} accessExpiresAt={accessExpiresAt} examDate={choices.examDate} />
        </Group>

        {/* 2 · DAYS A WEEK */}
        <Group label="How many days a week?">
          <div role="radiogroup" aria-label="Days a week" style={{ display: 'flex', gap: 6 }}>
            {NIGHT_OPTIONS.map((n) => (
              <Segment
                key={n}
                checked={n === selected.nights}
                onSelect={() => {
                  set({ nights: n })
                  setWeekdays(null)
                }}
              >
                {n}
              </Segment>
            ))}
          </div>
          <p style={hint}>
            We suggest the fewest days that keep an evening under{' '}
            <b style={strong}>{formatEvening(STRAIN_MINS)}</b>. Fewer days means longer evenings, not less work.
          </p>
        </Group>

        {/* 3 · EXAM DATE */}
        <Group label="Have you booked your state exam?">
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <Field label="Exam date (optional)" htmlFor="pace-exam">
              <input
                id="pace-exam"
                type="date"
                value={choices.examDate ?? ''}
                min={isoPlusDays(today, 1)}
                onChange={(e) => set({ examDate: e.target.value || null })}
                style={input}
              />
            </Field>
            {choices.examDate ? (
              <button type="button" onClick={() => set({ examDate: null })} style={clearButton}>
                Clear
              </button>
            ) : null}
          </div>
          <p style={hint}>
            We aim to finish coursework <b style={strong}>{EXAM_BUFFER_DAYS} days</b> before you sit, so there is
            time to review. Whichever comes first — your exam or the end of your access — is the one your pace is
            built on.
          </p>
        </Group>

        {/* 4 · THE STUDY PLAN */}
        <Group label="Put it on a calendar">
          <SwitchRow
            checked={planOn}
            onToggle={() => {
              const next = !planOn
              setPlanOn(next)
              if (next && !weekdays) setWeekdays(defaultWeekdays(selected.nights))
              if (!next) set({ plan: null })
            }}
            title="Create a study plan"
            body={
              selected.state === 'no'
                ? 'Sessions on your Study Plan, once there is a pace that fits.'
                : `Turns this pace into ${selected.nights} sessions a week of about ${formatEvening(
                    selected.minsPerNight,
                  )} on your Study Plan, so each day tells you what to do.`
            }
          />
          {planOn && selected.state !== 'no' ? (
            <>
              <span style={groupLabel}>Which days, and when?</span>
              <div role="group" aria-label="Study days" style={{ display: 'flex', gap: 4 }}>
                {WEEKDAYS.map((d, i) => (
                  <DayToggle
                    key={d}
                    label={d}
                    pressed={days.includes(i)}
                    onToggle={() => {
                      const next = days.includes(i) ? days.filter((x) => x !== i) : [...days, i].sort((a, b) => a - b)
                      if (!next.length) return
                      setWeekdays(next)
                      // Ticking a day is AUTHORITATIVE once the calendar is on —
                      // the pace follows the days, rather than the two disagreeing.
                      set({ nights: next.length })
                    }}
                  />
                ))}
              </div>
              <Field label="Usual start time" htmlFor="pace-time">
                <input
                  id="pace-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value || DEFAULT_START_TIME)}
                  style={input}
                />
              </Field>
              <SessionPreview today={today} preset={selected} weekdays={days} startTime={startTime} />
            </>
          ) : null}
        </Group>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          paddingTop: 14,
          marginTop: 4,
          borderTop: '1px solid var(--color-border-subtle)',
        }}
      >
        <Button
          onClick={() => {
            if (planOn && selected.state !== 'no') set({ plan: { weekdays: days, startTime } })
            onClose()
          }}
        >
          {planOn ? 'Save pace & build my plan' : 'Save pace'}
        </Button>
        <button
          type="button"
          onClick={() => {
            onChange({ presetId: null, nights: null, examDate: null, style: 'average', plan: null })
            setPlanOn(false)
            setWeekdays(null)
            setStartTime(DEFAULT_START_TIME)
          }}
          style={{ ...clearButton, marginLeft: 'auto' }}
        >
          Reset to recommended
        </button>
      </div>
    </Sheet>
  )
}

/* ─── pieces ─────────────────────────────────────────────────────────── */

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      <span style={groupLabel}>{label}</span>
      {children}
    </section>
  )
}

function AimRow({
  preset,
  checked,
  recommended,
  onSelect,
}: {
  preset: PacePreset
  checked: boolean
  recommended: boolean
  onSelect: () => void
}) {
  const unfittable = preset.state === 'no'
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      disabled={unfittable}
      onClick={onSelect}
      data-preset={preset.id}
      style={{
        display: 'grid',
        gridTemplateColumns: '16px minmax(0, 1fr) auto',
        gap: 11,
        alignItems: 'center',
        textAlign: 'left',
        padding: '11px 13px',
        borderRadius: 'var(--radius-md)',
        border: `1px solid ${checked ? 'var(--color-primary-500)' : 'var(--color-border-subtle)'}`,
        boxShadow: checked ? 'inset 0 0 0 1px var(--color-primary-500)' : undefined,
        background: checked ? 'var(--color-primary-100)' : 'var(--color-surface-card)',
        cursor: unfittable ? 'not-allowed' : 'pointer',
        opacity: unfittable ? 0.5 : 1,
        font: 'inherit',
        color: 'inherit',
      }}
    >
      <span
        aria-hidden
        style={{
          width: 14,
          height: 14,
          borderRadius: '50%',
          border: `2px solid ${checked ? 'var(--color-primary-500)' : 'var(--color-border-strong)'}`,
          boxShadow: checked ? 'inset 0 0 0 2px var(--color-surface-card), inset 0 0 0 8px var(--color-primary-500)' : undefined,
        }}
      />
      <span style={{ minWidth: 0 }}>
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexWrap: 'wrap',
            fontFamily: 'var(--font-heading)',
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--color-text-primary)',
          }}
        >
          {/* `presetLabel`, not the raw name: "Relaxed" is only kept while the
              evening is genuinely light. On a long course the same date is
              described as what it is. */}
          {presetLabel(preset)}
          {recommended ? <RecommendedChip /> : null}
        </span>
        <span style={{ ...hint, display: 'block', marginTop: 2 }}>
          Finish by {formatPaceDate(preset.finishIso)}
        </span>
      </span>
      <span style={{ textAlign: 'right' }}>
        <span
          style={{
            display: 'block',
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            fontWeight: 700,
            whiteSpace: 'nowrap',
            fontVariantNumeric: 'tabular-nums',
            color:
              preset.state === 'heavy'
                ? 'var(--color-warning-800)'
                : unfittable
                  ? 'var(--color-error-700)'
                  : 'var(--color-text-primary)',
          }}
        >
          {unfittable ? '—' : formatEvening(preset.minsPerNight)}
        </span>
        <span style={{ ...hint, display: 'block', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {unfittable ? 'won’t fit' : 'a night'}
        </span>
      </span>
    </button>
  )
}

function RecommendedChip() {
  return (
    <span
      style={{
        fontFamily: 'var(--font-body)',
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.07em',
        textTransform: 'uppercase',
        color: 'var(--color-primary-700)',
        background: 'var(--color-surface-card)',
        border: '1px solid var(--color-primary-300)',
        borderRadius: 4,
        padding: '1px 4px',
      }}
    >
      Recommended
    </span>
  )
}

/**
 * Which ceiling is doing the work, in words.
 *
 * This is the half of the two-ceiling rule that makes it honest. The model
 * picks the sooner one silently; this says so, and names the other date, so the
 * learner can see why their pace moved when they typed an exam date in.
 */
function BindingNote({
  model,
  today,
  accessExpiresAt,
  examDate,
}: {
  model: ReturnType<typeof studyPace>
  today: Date
  accessExpiresAt?: string
  examDate: string | null
}) {
  const accessLeft = daysUntil(accessExpiresAt, today)
  if (!examDate) {
    return (
      <p style={hint} data-binding="access">
        {accessExpiresAt && accessLeft != null
          ? <>These come from your course access, which ends <b style={strong}>{formatPaceDate(accessExpiresAt)}</b>.</>
          : <>These come from the time you have left on this course.</>}
      </p>
    )
  }
  const tone =
    model.binding === 'exam'
      ? { border: 'var(--color-warning-500)', color: 'var(--color-warning-800)' }
      : { border: 'var(--color-primary-300)', color: 'var(--color-text-secondary)' }
  return (
    <p
      data-binding={model.binding}
      style={{
        ...hint,
        borderLeft: `3px solid ${tone.border}`,
        paddingLeft: 11,
        color: tone.color,
      }}
    >
      {model.binding === 'exam' ? (
        <>
          <b style={strong}>Your exam date is the one doing the work.</b> Sitting on{' '}
          {formatPaceDate(examDate)} means coursework has to be done by {formatPaceDate(model.hardEndIso)}
          {accessExpiresAt ? <> — sooner than your access ends on {formatPaceDate(accessExpiresAt)}</> : null}.
        </>
      ) : model.binding === 'both' ? (
        <>
          <b style={strong}>Both dates land on the same day.</b> Your exam buffer and the end of your access agree
          for once.
        </>
      ) : (
        <>
          <b style={strong}>Your access is still the one doing the work.</b> It ends{' '}
          {accessExpiresAt ? formatPaceDate(accessExpiresAt) : 'first'}, before your exam on{' '}
          {formatPaceDate(examDate)} would require.
        </>
      )}
    </p>
  )
}

function SwitchRow({
  checked,
  onToggle,
  title,
  body,
}: {
  checked: boolean
  onToggle: () => void
  title: string
  body: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 11,
        alignItems: 'flex-start',
        padding: '12px 13px',
        borderRadius: 'var(--radius-md)',
        border: `1px solid ${checked ? 'var(--color-primary-400)' : 'var(--color-border-subtle)'}`,
        background: checked ? 'var(--color-primary-100)' : 'var(--color-surface-card)',
      }}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        onClick={onToggle}
        style={{
          flex: 'none',
          width: 38,
          height: 22,
          borderRadius: 11,
          border: `1px solid ${checked ? 'var(--color-primary-500)' : 'var(--color-border-strong)'}`,
          background: checked ? 'var(--color-primary-500)' : 'var(--color-surface-sunken)',
          position: 'relative',
          cursor: 'pointer',
          marginTop: 1,
        }}
      >
        <span
          aria-hidden
          style={{
            position: 'absolute',
            top: 2,
            left: checked ? 18 : 2,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: 'var(--color-surface-card)',
            boxShadow: '0 1px 2px rgb(0 0 0 / 0.25)',
          }}
        />
      </button>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: 'block',
            fontFamily: 'var(--font-heading)',
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--color-text-primary)',
          }}
        >
          {title}
        </span>
        <span style={{ ...hint, display: 'block', marginTop: 3 }}>{body}</span>
      </span>
    </div>
  )
}

function DayToggle({ label, pressed, onToggle }: { label: string; pressed: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onToggle}
      data-weekday={label}
      style={{
        flex: 1,
        padding: '9px 0',
        borderRadius: 6,
        border: `1px solid ${pressed ? 'var(--color-primary-400)' : 'var(--color-border-subtle)'}`,
        background: pressed ? 'var(--color-primary-100)' : 'var(--color-surface-card)',
        color: pressed ? 'var(--color-primary-700)' : 'var(--color-text-tertiary)',
        fontFamily: 'var(--font-body)',
        fontSize: 10.5,
        fontWeight: 700,
        letterSpacing: '0.04em',
        cursor: 'pointer',
      }}
    >
      {/* The letter is a label, not the name: the accessible name has to survive
          the abbreviation, which is the same rule the collapsible rail landed on. */}
      <span aria-hidden>{label.slice(0, 1)}</span>
      <span className="cre-sr-only">{label}</span>
    </button>
  )
}

/**
 * The first four dated sessions — the honest preview of what is about to be
 * written. Dates are real, so a learner can see that "4 nights a week" means
 * Monday, Tuesday, Wednesday and Thursday of THIS week, not an abstraction.
 */
function SessionPreview({
  today,
  preset,
  weekdays,
  startTime,
}: {
  today: Date
  preset: PacePreset
  weekdays: number[]
  startTime: string
}) {
  const sessions: string[] = []
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  for (let i = 0; i < 40 && sessions.length < 4; i += 1) {
    cursor.setDate(cursor.getDate() + 1)
    const monFirst = (cursor.getDay() + 6) % 7
    if (weekdays.includes(monFirst) && isoFromDate(cursor) <= preset.finishIso) {
      sessions.push(isoFromDate(cursor))
    }
  }
  if (!sessions.length) return <p style={hint}>No sessions fall before your finish date.</p>
  const perNight = preset.minsPerWeek / weekdays.length
  return (
    <div
      style={{
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
      }}
    >
      {sessions.map((iso, i) => (
        <div
          key={iso}
          data-session={iso}
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 10,
            padding: '8px 11px',
            borderTop: i ? '1px solid var(--color-border-subtle)' : undefined,
            fontFamily: 'var(--font-body)',
            fontSize: 12,
          }}
        >
          <span style={{ fontWeight: 700, minWidth: 82, color: 'var(--color-text-primary)' }}>
            {longDate(iso)}
          </span>
          <span style={{ color: 'var(--color-text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
            {clock(startTime)} – {clock(startTime, perNight)}
          </span>
          {i === 0 ? (
            <span style={{ marginLeft: 'auto', fontSize: 10.5, color: 'var(--color-text-tertiary)' }}>
              first session
            </span>
          ) : null}
        </div>
      ))}
      <div
        style={{
          padding: '7px 11px',
          borderTop: '1px solid var(--color-border-subtle)',
          textAlign: 'center',
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          color: 'var(--color-text-tertiary)',
        }}
      >
        …repeating until {formatPaceDate(preset.finishIso)}
      </div>
    </div>
  )
}

/* ─── small helpers ──────────────────────────────────────────────────── */

function defaultWeekdays(n: number): number[] {
  return Array.from({ length: Math.max(1, Math.min(7, n)) }, (_, i) => i)
}

function longDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return iso
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

/** "7pm" / "9:35pm". `addMins` shifts it, for a session's end. */
function clock(time: string, addMins = 0): string {
  const [h, m] = time.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return time
  const total = h * 60 + m + Math.round(addMins)
  const hh = Math.floor((total / 60) % 24)
  const mm = total % 60
  const suffix = hh < 12 ? 'am' : 'pm'
  const h12 = hh % 12 || 12
  return mm ? `${h12}:${mm < 10 ? '0' : ''}${mm}${suffix}` : `${h12}${suffix}`
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <span style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
      <label htmlFor={htmlFor} style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
        {label}
      </label>
      {children}
    </span>
  )
}

function Segment({ checked, onSelect, children }: { checked: boolean; onSelect: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      data-nights={String(children)}
      style={{
        flex: 1,
        padding: '8px 0',
        borderRadius: 'var(--radius-md)',
        border: `1px solid ${checked ? 'var(--color-primary-500)' : 'var(--color-border-subtle)'}`,
        background: checked ? 'var(--color-primary-500)' : 'var(--color-surface-card)',
        color: checked ? 'var(--color-text-inverse)' : 'var(--color-text-secondary)',
        fontFamily: 'var(--font-body)',
        fontSize: 12.5,
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

const groupLabel = {
  fontFamily: 'var(--font-body)',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.09em',
  textTransform: 'uppercase',
  color: 'var(--color-text-tertiary)',
} as const

const hint = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 11.5,
  lineHeight: '17px',
  color: 'var(--color-text-secondary)',
} as const

const strong = { color: 'var(--color-text-primary)', fontWeight: 600 } as const

const input = {
  fontFamily: 'var(--font-body)',
  fontSize: 12.5,
  fontWeight: 600,
  padding: '8px 10px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border-subtle)',
  background: 'var(--color-surface-card)',
  color: 'var(--color-text-primary)',
  maxWidth: 180,
} as const

const clearButton = {
  background: 'transparent',
  border: 0,
  padding: '0 0 9px',
  color: 'var(--color-text-tertiary)',
  fontFamily: 'var(--font-body)',
  fontSize: 11.5,
  fontWeight: 600,
  textDecoration: 'underline',
  textUnderlineOffset: 2,
  cursor: 'pointer',
} as const

/** Re-exported so a caller can offer the style axis without a second import. */
export { STYLE_FACTORS }
