import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type ReactNode,
} from 'react'
import {
  ArrowLeft,
  ArrowRight,
  AwardSolid,
  ChalkboardUser,
  CircleInfo,
  HeartPulse,
  HourglassClock,
  MagnifyingGlass,
  MessageCircle,
  Monitor,
  Podcast,
  SignsPost,
  Video,
} from '@/icons'
import { useAccount } from '@/context/AccountContext'
import { useLearningSetup } from '@/context/LearningSetupContext'
import {
  goalOptionsFor,
  goalQuestionFor,
  licenseLookupUrl,
  licenseNoun,
  licenseSeedFor,
  licenseTypesFor,
  setupInterestCoursesFor,
  setupInterestsFor,
  setupModalitiesFor,
  statesFor,
  type EducationType,
  type SetupCourseDelivery,
  type SetupCourseTileData,
  type SetupGoalOption,
  type SetupModalityOption,
} from '@/data/onboarding/onboardingContent'
import { CheckBadge, IconPlate, TileGroup } from './SetupTiles'
import {
  compactTileStyle,
  courseTileStyle,
  goalCaptionStyle,
  goalTileStyle,
  goalTitleStyle,
  pillStyle,
  tileStyle,
  type GoalIconTreatment,
} from './setupShared'
import { useSetupFlow } from './setupFlow'
import { useFeatureFlag } from '@/context/FeatureFlagContext'

/**
 * The right-panel wizard for the learning-setup hero — 5 quick-select steps
 * (Goal → License → About you → Courses of interest → How you like to learn),
 * then an animated "Building your experience" step that finishes the setup.
 * Reads/writes the in-session `useLearningSetup()` state; brand-driven fixtures.
 * Elite (Nursing) is the built brand; the flow is scoped to Elite upstream.
 */

const GOAL_ICONS: Record<string, ComponentType<{ size?: number }>> = {
  renew: HourglassClock,
  award: AwardSolid,
  refresh: HeartPulse,
  compass: SignsPost,
}
const MODALITY_ICONS: Record<string, ComponentType<{ size?: number }>> = {
  online: Monitor,
  video: Video,
  podcast: Podcast,
  webinar: ChalkboardUser,
  live: MessageCircle,
}

const COVER: Record<SetupCourseDelivery, string> = {
  online: 'linear-gradient(135deg, var(--color-primary-600), var(--color-primary-800))',
  video: 'linear-gradient(135deg, var(--color-tertiary-500), rgb(0 0 0 / 0.4))',
  podcast: 'linear-gradient(135deg, var(--color-secondary-600), var(--color-secondary-800))',
  webinar: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700))',
  'in-person': 'linear-gradient(135deg, var(--color-cta-500), var(--color-cta-700))',
}
const DELIVERY_LABEL: Record<SetupCourseDelivery, string> = {
  online: 'Online',
  video: 'Video',
  podcast: 'Podcast',
  webinar: 'Webinar',
  'in-person': 'In person',
}

function ageFromDob(iso: string): number {
  if (!iso) return 0
  const [y, m, d] = iso.split('-').map((s) => parseInt(s, 10))
  if (!y || !m || !d) return 0
  const now = new Date()
  let age = now.getFullYear() - y
  const mo = now.getMonth() + 1 - m
  if (mo < 0 || (mo === 0 && now.getDate() < d)) age--
  return age
}

export function LearningSetupWizard() {
  const { brand } = useAccount()
  const setup = useLearningSetup()
  const { step, data, setData, goToStep, complete } = setup
  const { steps, interestStyle, skipGoal, presetGoal, goalIds, educationType, multiLicense, multiState } =
    useSetupFlow()
  const N = steps.length

  // When the Goal step is skipped (the platform already knows the learner is
  // renewing), preset the goal so downstream surfaces still carry it.
  useEffect(() => {
    if (skipGoal && presetGoal && !data.goal) setData({ goal: presetGoal })
  }, [skipGoal, presetGoal, data.goal, setData])

  if (step >= N) return <BuildingStep onDone={complete} />

  const stepKey = steps[step].k
  const stepLabel = `Step ${step + 1} of ${N}`
  const back = () => goToStep(step - 1)
  const next = () => goToStep(step + 1)

  switch (stepKey) {
    case 'goal':
      return <GoalStep stepLabel={stepLabel} brand={brand} educationType={educationType} allowedGoalIds={goalIds} value={data.goal} onPick={(g) => setData({ goal: g })} onContinue={next} />
    case 'license':
      return (
        <LicenseStep
          stepLabel={stepLabel}
          showBack={step > 0}
          brand={brand}
          educationType={educationType}
          multiLicense={multiLicense}
          multiState={multiState}
          data={data}
          onPatch={setData}
          onBack={back}
          onNext={next}
        />
      )
    case 'details':
      return <DetailsStep stepLabel={stepLabel} data={data} onPatch={setData} onBack={back} onNext={next} />
    case 'courses':
      return interestStyle === 'pills' ? (
        <InterestsPillsStep
          stepLabel={stepLabel}
          brand={brand}
          selected={data.interests}
          onToggle={(t) => toggle(data.interests, t, (interests) => setData({ interests }))}
          onBack={back}
          onNext={next}
        />
      ) : (
        <CoursesStep
          stepLabel={stepLabel}
          brand={brand}
          educationType={educationType}
          selected={data.courses}
          onToggle={(t) => toggle(data.courses, t, (courses) => setData({ courses }))}
          onBack={back}
          onNext={next}
        />
      )
    case 'style':
      return (
        <StyleStep
          stepLabel={stepLabel}
          brand={brand}
          selected={data.modalities}
          onToggle={(m) => toggle(data.modalities, m, (modalities) => setData({ modalities }))}
          onBack={back}
          onFinish={next}
        />
      )
    default:
      return null
  }
}

function toggle(list: string[], value: string, set: (next: string[]) => void) {
  set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value])
}

/* ─── Step 1 · Goal ──────────────────────────────────────────────────── */

function GoalStep({
  stepLabel,
  brand,
  educationType,
  allowedGoalIds,
  value,
  onPick,
  onContinue,
}: {
  stepLabel: string
  brand: ReturnType<typeof useAccount>['brand']
  educationType: EducationType
  /** Goal-option ids enabled by their per-option flags. */
  allowedGoalIds: string[]
  value: string
  onPick: (g: string) => void
  onContinue: () => void
}) {
  // Only show goal options whose per-option flag is on.
  const allGoals = goalOptionsFor(brand, educationType).filter((g) =>
    allowedGoalIds.includes(g.id),
  )

  // `setup-goal-layout` — two axes: icon treatment (primary) + option count
  // (secondary). Variant-only (ignore `enabled`). The count axis forces how
  // many goal tiles show for the layout exploration; `auto` keeps the brand's
  // real count.
  const layout = useFeatureFlag('setup-goal-layout')
  const treatment = (layout.variant ?? 'size') as GoalIconTreatment
  const countMode = layout.secondaryVariant ?? 'auto'
  const forcedCount =
    countMode === 'four' ? 4 : countMode === 'three' ? 3 : countMode === 'two' ? 2 : null
  const goals = forcedCount == null ? allGoals : allGoals.slice(0, forcedCount)

  // ≤3 goals stack one-per-row; 4 use the compact 2×2 grid.
  const stacked = goals.length <= 3
  // The widest stacked tiles (2-up) get the largest icon treatment.
  const big = goals.length <= 2

  return (
    <StepShell
      stepLabel={stepLabel}
      heading={goalQuestionFor(brand)}
      hint="Tap what fits — we'll tailor your path to it."
      nav={
        // Setup is required (no skip): step 1 shows only Continue, right-aligned.
        <>
          <span aria-hidden />
          <PrimaryButton disabled={!value} onClick={onContinue}>
            Continue →
          </PrimaryButton>
        </>
      }
    >
      <TileGroup<SetupGoalOption>
        ariaLabel="Your goal"
        role="radio"
        items={goals}
        keyFor={(g) => g.id}
        isSelected={(g) => value === g.title}
        onToggle={(g) => onPick(g.title)}
        columns={stacked ? '1fr' : '1fr 1fr'}
        styleFor={(sel) => goalTileStyle(sel, treatment, stacked)}
        renderTile={(g, sel) => (
          <GoalTile
            treatment={treatment}
            stacked={stacked}
            big={big}
            selected={sel}
            Icon={GOAL_ICONS[g.iconKey] ?? SignsPost}
            title={g.title}
            caption={g.caption}
          />
        )}
      />
    </StepShell>
  )
}

/* ─── Goal tile — 3 icon treatments × stacked/grid ───────────────────── */

function GoalTile({
  treatment,
  stacked,
  big,
  selected,
  Icon,
  title,
  caption,
}: {
  treatment: GoalIconTreatment
  stacked: boolean
  big: boolean
  selected: boolean
  Icon: ComponentType<{ size?: number }>
  title: string
  caption: string
}) {
  const check = selected && <CheckBadge />

  // ── Icon as accent: colored left rail + a small inline glyph, no plate.
  if (treatment === 'accent') {
    return (
      <>
        {check}
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 4,
            borderTopLeftRadius: 'var(--radius-md)',
            borderBottomLeftRadius: 'var(--radius-md)',
            background: selected ? 'var(--color-cta-500)' : 'var(--color-primary-200)',
          }}
        />
        <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span
            aria-hidden
            style={{
              display: 'flex',
              color: selected ? 'var(--color-cta-600)' : 'var(--color-primary-600)',
            }}
          >
            <Icon size={19} />
          </span>
          <span style={goalTitleStyle}>{title}</span>
        </span>
        <span style={goalCaptionStyle}>{caption}</span>
      </>
    )
  }

  // ── Icon-forward: a big expressive icon in a soft disc anchors the tile.
  if (treatment === 'forward') {
    const size = stacked ? (big ? 70 : 58) : 52
    const glyph = stacked ? (big ? 38 : 30) : 28
    const disc = (
      <span
        aria-hidden
        style={{
          width: size,
          height: size,
          flexShrink: 0,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: selected
            ? 'radial-gradient(circle at 35% 30%, var(--color-cta-200), var(--color-cta-100))'
            : 'radial-gradient(circle at 35% 30%, var(--color-secondary-100), var(--color-primary-100))',
          color: selected ? 'var(--color-cta-700)' : 'var(--color-primary-700)',
        }}
      >
        <Icon size={glyph} />
      </span>
    )
    if (stacked) {
      return (
        <>
          {check}
          {disc}
          <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span style={goalTitleStyle}>{title}</span>
            <span style={goalCaptionStyle}>{caption}</span>
          </span>
        </>
      )
    }
    return (
      <>
        {check}
        {disc}
        <span style={goalTitleStyle}>{title}</span>
        <span style={goalCaptionStyle}>{caption}</span>
      </>
    )
  }

  // ── Size + position: plate scales with the room; stacked adds a watermark.
  if (stacked) {
    const plate = big ? 60 : 48
    const glyph = big ? 32 : 26
    return (
      <>
        {check}
        <span
          aria-hidden
          style={{
            width: plate,
            height: plate,
            flexShrink: 0,
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: selected ? 'var(--color-cta-500)' : 'var(--color-secondary-100)',
            color: selected ? 'var(--color-text-inverse)' : 'var(--color-primary-700)',
          }}
        >
          <Icon size={glyph} />
        </span>
        <span
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            position: 'relative',
            zIndex: 1,
          }}
        >
          <span style={goalTitleStyle}>{title}</span>
          <span style={goalCaptionStyle}>{caption}</span>
        </span>
        <span
          aria-hidden
          style={{
            position: 'absolute',
            right: -14,
            bottom: -22,
            pointerEvents: 'none',
            opacity: selected ? 0.16 : 0.07,
            color: selected ? 'var(--color-cta-500)' : 'var(--color-primary-700)',
          }}
        >
          <Icon size={big ? 150 : 120} />
        </span>
      </>
    )
  }
  // Size + position, compact 2×2 grid — plate top-left, larger title.
  return (
    <>
      {check}
      <IconPlate selected={selected}>
        <Icon size={22} />
      </IconPlate>
      <span style={goalTitleStyle}>{title}</span>
      <span style={goalCaptionStyle}>{caption}</span>
    </>
  )
}

/* ─── Step 2 · License ───────────────────────────────────────────────── */

function LicenseStep({
  stepLabel,
  showBack = true,
  brand,
  educationType,
  multiLicense,
  multiState,
  data,
  onPatch,
  onBack,
  onNext,
}: {
  stepLabel: string
  /** Hide the Back arrow when License is the first step (Goal skipped). */
  showBack?: boolean
  brand: ReturnType<typeof useAccount>['brand']
  educationType: EducationType
  /** Multi-license variant — the type picker is a multi-select. */
  multiLicense: boolean
  /** Multi-state variant — the state picker is a multi-select. */
  multiState: boolean
  data: ReturnType<typeof useLearningSetup>['data']
  onPatch: (patch: Partial<ReturnType<typeof useLearningSetup>['data']>) => void
  onBack: () => void
  onNext: () => void
}) {
  const types = licenseTypesFor(brand, educationType)
  const seed = licenseSeedFor(brand)
  const noun = licenseNoun(brand)
  const states = statesFor(brand)
  const lookup = licenseLookupUrl(data.states[0] ?? seed.state)

  // The primary license type is the single selection, or the first of the
  // multi-select — kept on `licenseType` so the dashboard hand-off stays simple.
  const toggleLicense = (t: string) => {
    const next = data.licenses.includes(t)
      ? data.licenses.filter((v) => v !== t)
      : [...data.licenses, t]
    onPatch({ licenses: next, licenseType: next[0] ?? '' })
  }
  const toggleState = (s: string) => {
    const next = data.states.includes(s)
      ? data.states.filter((v) => v !== s)
      : [...data.states, s]
    onPatch({ states: next })
  }

  const hasLicense = multiLicense ? data.licenses.length > 0 : Boolean(data.licenseType)
  const canNext = hasLicense && Boolean(data.expires) && data.states.length > 0
  return (
    <StepShell
      stepLabel={stepLabel}
      heading={`Your ${seed.label}`}
      hint={
        multiLicense
          ? `Select every ${noun} you hold, the state(s) you work in, and your expiration.`
          : `Pick your ${noun} type and state, then add your expiration.`
      }
      nav={
        <>
          {showBack ? <ArrowButton dir="back" onClick={onBack} /> : <span aria-hidden />}
          <ArrowButton dir="next" disabled={!canNext} onClick={onNext} />
        </>
      }
    >
      <TileGroup<string>
        ariaLabel={multiLicense ? `Your ${noun}s` : `${noun} type`}
        role={multiLicense ? 'checkbox' : 'radio'}
        items={types}
        keyFor={(t) => t}
        isSelected={(t) => (multiLicense ? data.licenses.includes(t) : data.licenseType === t)}
        onToggle={(t) => (multiLicense ? toggleLicense(t) : onPatch({ licenseType: t, licenses: [t] }))}
        columns="1fr 1fr 1fr"
        styleFor={(sel) => compactTileStyle(sel)}
        renderTile={(t, sel) => (
          <>
            {sel && <CheckBadge />}
            {t}
          </>
        )}
      />

      <Field
        label={
          <>
            {multiState ? 'Which states are you licensed in?' : 'Which state are you licensed in?'} <Req />
          </>
        }
        help={multiState ? 'Select all that apply — we track each renewal separately.' : undefined}
        htmlFor="setup-state"
      >
        <div id="setup-state">
          <TileGroup<string>
            ariaLabel="License state"
            role={multiState ? 'checkbox' : 'radio'}
            wrap
            items={states}
            keyFor={(s) => s}
            isSelected={(s) => data.states.includes(s)}
            onToggle={(s) => (multiState ? toggleState(s) : onPatch({ states: [s] }))}
            styleFor={(sel) => pillStyle(sel)}
            renderTile={(s, sel) => (
              <>
                {s}
                {sel && multiState && <span aria-hidden style={{ fontSize: 12, opacity: 0.9 }}>✕</span>}
              </>
            )}
          />
        </div>
      </Field>

      <Field
        label={
          <>
            When does your license expire? <Req />{' '}
            <InfoTip text="If you are unsure of your license expiration date, please enter your best guess and you can edit it later as needed." />
          </>
        }
        htmlFor="setup-expires"
      >
        <input
          id="setup-expires"
          type="date"
          value={data.expires}
          onChange={(e) => onPatch({ expires: e.currentTarget.value })}
          style={inputStyle}
          className="cre-setup-focusable"
        />
      </Field>

      <Field
        label={
          <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
            <span>License number</span>
            {lookup && (
              <a href={lookup} target="_blank" rel="noopener noreferrer" className="cre-setup-focusable" style={lookupStyle}>
                <MagnifyingGlass size={13} aria-hidden /> Lookup
              </a>
            )}
          </span>
        }
        help="Optional — needed for certification reporting."
        htmlFor="setup-license-number"
      >
        <input
          id="setup-license-number"
          type="text"
          value={data.licenseNumber}
          onChange={(e) => onPatch({ licenseNumber: e.currentTarget.value })}
          style={inputStyle}
          className="cre-setup-focusable"
        />
      </Field>
    </StepShell>
  )
}

/* ─── Step 3 · About you ─────────────────────────────────────────────── */

function DetailsStep({
  stepLabel,
  data,
  onPatch,
  onBack,
  onNext,
}: {
  stepLabel: string
  data: ReturnType<typeof useLearningSetup>['data']
  onPatch: (patch: Partial<ReturnType<typeof useLearningSetup>['data']>) => void
  onBack: () => void
  onNext: () => void
}) {
  const ageOk = Boolean(data.dob) && ageFromDob(data.dob) >= 18
  const phoneOk = data.phone.trim().length >= 7
  const canNext = ageOk && phoneOk
  const dobInvalid = Boolean(data.dob) && !ageOk
  return (
    <StepShell
      stepLabel={stepLabel}
      heading="A couple details about you"
      hint="Required for state examination eligibility."
      nav={
        <>
          <ArrowButton dir="back" onClick={onBack} />
          <ArrowButton dir="next" disabled={!canNext} onClick={onNext} />
        </>
      }
    >
      <Field
        label={
          <>
            Date of birth <Req />
          </>
        }
        help="You must be at least 18 years old for state examinations."
        htmlFor="setup-dob"
        error={dobInvalid ? 'You must be at least 18 years old.' : undefined}
      >
        <input
          id="setup-dob"
          type="date"
          value={data.dob}
          onChange={(e) => onPatch({ dob: e.currentTarget.value })}
          style={inputStyle}
          className="cre-setup-focusable"
          aria-invalid={dobInvalid}
        />
      </Field>

      <Field
        label={
          <>
            Phone number <Req />
          </>
        }
        htmlFor="setup-phone"
      >
        <input
          id="setup-phone"
          type="tel"
          placeholder="(555) 123-4567"
          value={data.phone}
          onChange={(e) => onPatch({ phone: e.currentTarget.value })}
          style={inputStyle}
          className="cre-setup-focusable"
        />
      </Field>
    </StepShell>
  )
}

/* ─── Step 4 · Courses of interest ───────────────────────────────────── */

function CoursesStep({
  stepLabel,
  brand,
  educationType,
  selected,
  onToggle,
  onBack,
  onNext,
}: {
  stepLabel: string
  brand: ReturnType<typeof useAccount>['brand']
  educationType: EducationType
  selected: string[]
  onToggle: (title: string) => void
  onBack: () => void
  onNext: () => void
}) {
  const courses = setupInterestCoursesFor(brand, educationType)
  return (
    <StepShell
      stepLabel={stepLabel}
      heading="Which courses interest you?"
      hint="Picked for your profession — select all that apply."
      nav={
        <>
          <ArrowButton dir="back" onClick={onBack} />
          <PrimaryButton onClick={onNext}>Continue →</PrimaryButton>
        </>
      }
    >
      <TileGroup<SetupCourseTileData>
        ariaLabel="Courses of interest"
        role="checkbox"
        items={courses}
        keyFor={(c) => c.id}
        isSelected={(c) => selected.includes(c.title)}
        onToggle={(c) => onToggle(c.title)}
        columns="1fr 1fr 1fr"
        maxHeight={250}
        styleFor={(sel) => courseTileStyle(sel)}
        renderTile={(c, sel) => (
          <>
            <CheckBadge dark={!sel} />
            <span
              aria-hidden
              style={{
                display: 'block',
                height: 62,
                position: 'relative',
                background: COVER[c.delivery],
                ...(sel ? { boxShadow: 'inset 0 0 0 1000px rgb(162 71 150 / 0.20)' } : null),
              }}
            />
            <span style={{ display: 'block', padding: '9px 11px 11px' }}>
              <span style={courseTopic}>{c.topic}</span>
              <span style={courseTitle}>{c.title}</span>
              <span style={courseMeta}>
                {DELIVERY_LABEL[c.delivery]} · {c.hrs} · ★ {c.rating}
              </span>
            </span>
          </>
        )}
      />
      <p aria-live="polite" style={selCount}>
        {selected.length ? `${selected.length} selected` : ' '}
      </p>
    </StepShell>
  )
}

/* ─── Step 4 (pills variant) · Interests ─────────────────────────────── */

/** How many interest pills to show before the "+ N more" link (approximate —
 *  ~3 rows of chips at the panel width). */
const INTEREST_PREVIEW = 12

function InterestsPillsStep({
  stepLabel,
  brand,
  selected,
  onToggle,
  onBack,
  onNext,
}: {
  stepLabel: string
  brand: ReturnType<typeof useAccount>['brand']
  selected: string[]
  onToggle: (interest: string) => void
  onBack: () => void
  onNext: () => void
}) {
  const all = setupInterestsFor(brand)
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? all : all.slice(0, INTEREST_PREVIEW)
  const hiddenCount = all.length - INTEREST_PREVIEW
  return (
    <StepShell
      stepLabel={stepLabel}
      heading="What are your interests?"
      hint="Select all that apply — we'll tailor your recommendations."
      nav={
        <>
          <ArrowButton dir="back" onClick={onBack} />
          <PrimaryButton onClick={onNext}>Continue →</PrimaryButton>
        </>
      }
    >
      <TileGroup<string>
        ariaLabel="Your interests"
        role="checkbox"
        wrap
        items={visible}
        keyFor={(t) => t}
        isSelected={(t) => selected.includes(t)}
        onToggle={(t) => onToggle(t)}
        styleFor={(sel) => pillStyle(sel)}
        renderTile={(t, sel) => (
          <>
            {t}
            {sel && <span aria-hidden style={{ fontSize: 12, opacity: 0.9 }}>✕</span>}
          </>
        )}
      />
      {hiddenCount > 0 && (
        <button type="button" onClick={() => setExpanded((v) => !v)} className="cre-setup-focusable" style={moreLinkStyle}>
          {expanded ? 'Show less' : `+ ${hiddenCount} more`}
        </button>
      )}
      <p aria-live="polite" style={selCount}>
        {selected.length ? `${selected.length} selected` : ' '}
      </p>
    </StepShell>
  )
}

/* ─── Step 5 · How you like to learn ─────────────────────────────────── */

function StyleStep({
  stepLabel,
  brand,
  selected,
  onToggle,
  onBack,
  onFinish,
}: {
  stepLabel: string
  brand: ReturnType<typeof useAccount>['brand']
  selected: string[]
  onToggle: (label: string) => void
  onBack: () => void
  onFinish: () => void
}) {
  const modalities = setupModalitiesFor(brand)
  return (
    <StepShell
      stepLabel={stepLabel}
      heading="How do you like to learn?"
      hint="Pick the formats you enjoy — we'll prioritize them. Select all that apply."
      nav={
        <>
          <ArrowButton dir="back" onClick={onBack} />
          <PrimaryButton onClick={onFinish}>Finish</PrimaryButton>
        </>
      }
    >
      <TileGroup<SetupModalityOption>
        ariaLabel="How you like to learn"
        role="checkbox"
        items={modalities}
        keyFor={(m) => m.id}
        isSelected={(m) => selected.includes(m.label)}
        onToggle={(m) => onToggle(m.label)}
        columns="1fr 1fr"
        styleFor={(sel) => tileStyle(sel, true)}
        renderTile={(m, sel) => {
          const Icon = MODALITY_ICONS[m.iconKey] ?? Monitor
          return (
            <>
              {sel && <CheckBadge />}
              <IconPlate selected={sel}>
                <Icon size={20} />
              </IconPlate>
              <span style={{ ...tileTitle, fontSize: 13 }}>{m.label}</span>
            </>
          )
        }}
      />
    </StepShell>
  )
}

/* ─── Building step ──────────────────────────────────────────────────── */

const BUILDING_STAGES = [
  'Finding your courses',
  'Building your learning path',
  'Setting up goal tracking',
  'Finishing up',
]

function BuildingStep({ onDone }: { onDone: () => void }) {
  // `done` = number of completed stages; `active` = the in-progress stage index.
  const [done, setDone] = useState(0)
  const doneRef = useRef(0)
  useEffect(() => {
    let cancelled = false
    const tick = () => {
      if (cancelled) return
      const next = doneRef.current + 1
      doneRef.current = next
      setDone(next)
      if (next >= BUILDING_STAGES.length) {
        window.setTimeout(() => {
          if (!cancelled) onDone()
        }, 500)
        return
      }
      window.setTimeout(tick, 820)
    }
    const first = window.setTimeout(tick, 650)
    return () => {
      cancelled = true
      window.clearTimeout(first)
    }
  }, [onDone])

  return (
    <StepShell stepLabel="Almost there" heading="Building your experience" hint="Personalizing your dashboard…">
      <div aria-live="polite" style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 4 }}>
        {BUILDING_STAGES.map((label, i) => {
          const isDone = i < done
          const isActive = i === done
          return (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 13,
                fontFamily: 'var(--font-body)',
                fontSize: 15,
                fontWeight: 600,
                color: isDone ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                opacity: isActive || isDone ? 1 : 0.45,
              }}
            >
              {isDone ? (
                <span
                  aria-hidden
                  style={{
                    width: 19,
                    height: 19,
                    flex: 'none',
                    borderRadius: '50%',
                    background: 'var(--color-secondary-500)',
                    color: 'var(--color-text-inverse)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  ✓
                </span>
              ) : (
                <span
                  aria-hidden
                  className="cre-setup-spin"
                  style={{
                    width: 19,
                    height: 19,
                    flex: 'none',
                    borderRadius: '50%',
                    border: '2.4px solid var(--color-border-subtle)',
                    borderTopColor: 'var(--color-cta-500)',
                  }}
                />
              )}
              {label}
              {isDone && <span className="cre-visually-hidden"> — complete</span>}
            </div>
          )
        })}
      </div>
    </StepShell>
  )
}

/* ─── shared step chrome ─────────────────────────────────────────────── */

function StepShell({
  stepLabel,
  heading,
  hint,
  children,
  nav,
}: {
  stepLabel: string
  heading: string
  hint: string
  children: ReactNode
  nav?: ReactNode
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', paddingRight: 2 }}>
        <p style={stepNum}>{stepLabel}</p>
        <h3 style={stepHeading}>{heading}</h3>
        <p style={stepHint}>{hint}</p>
        {children}
      </div>
      {nav && <div style={navRow}>{nav}</div>}
    </div>
  )
}

function Field({
  label,
  help,
  error,
  htmlFor,
  children,
}: {
  label: ReactNode
  help?: string
  error?: string
  htmlFor: string
  children: ReactNode
}) {
  const helpId = help ? `${htmlFor}-help` : undefined
  return (
    <div style={{ margin: '14px 0' }}>
      <label htmlFor={htmlFor} style={fieldLabel}>
        {label}
      </label>
      {help && (
        <p id={helpId} style={fieldHelp}>
          {help}
        </p>
      )}
      {children}
      {error && (
        <p role="alert" style={{ ...fieldHelp, color: 'var(--color-status-error-text)', marginTop: 6 }}>
          {error}
        </p>
      )}
    </div>
  )
}

function Req() {
  return <span style={{ color: 'var(--color-cta-500)' }}>*</span>
}

function InfoTip({ text }: { text: string }) {
  return (
    <span
      tabIndex={0}
      role="img"
      aria-label={text}
      className="cre-setup-focusable"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-cta-500)',
        cursor: 'help',
        verticalAlign: 'middle',
      }}
      title={text}
    >
      <CircleInfo size={16} aria-hidden />
    </span>
  )
}

function PrimaryButton({ children, disabled, onClick }: { children: ReactNode; disabled?: boolean; onClick: () => void }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className="cre-setup-focusable" style={disabled ? primaryDisabled : primaryStyle}>
      {children}
    </button>
  )
}

function ArrowButton({ dir, disabled, onClick }: { dir: 'back' | 'next'; disabled?: boolean; onClick: () => void }) {
  const base = dir === 'next' ? (disabled ? primaryDisabled : primaryStyle) : outlineStyle
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={dir === 'next' ? 'Next step' : 'Previous step'}
      className="cre-setup-focusable"
      style={{ ...base, minWidth: 64, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
    >
      {dir === 'next' ? <ArrowRight size={17} aria-hidden /> : <ArrowLeft size={17} aria-hidden />}
    </button>
  )
}

/* ─── styles ─────────────────────────────────────────────────────────── */

const stepNum: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--color-cta-500)',
}
const stepHeading: CSSProperties = {
  margin: '5px 0 3px',
  fontFamily: 'var(--font-heading)',
  fontSize: 21,
  fontWeight: 800,
  lineHeight: 1.25,
  color: 'var(--color-text-primary)',
}
const stepHint: CSSProperties = {
  margin: '0 0 15px',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  color: 'var(--color-text-secondary)',
}
const navRow: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  marginTop: 'auto',
  paddingTop: 18,
}
const tileTitle: CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: 14,
  fontWeight: 800,
  color: 'var(--color-text-primary)',
}
const courseTopic: CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-body)',
  fontSize: 9,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.03em',
  color: 'var(--color-eyebrow-text)',
}
const courseTitle: CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-heading)',
  fontSize: 12,
  fontWeight: 800,
  lineHeight: 1.24,
  margin: '2px 0 5px',
  color: 'var(--color-text-primary)',
}
const courseMeta: CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-body)',
  fontSize: 10,
  color: 'var(--color-text-secondary)',
}
const selCount: CSSProperties = {
  margin: '10px 0 0',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 800,
  color: 'var(--color-cta-600)',
  minHeight: 16,
}
const moreLinkStyle: CSSProperties = {
  alignSelf: 'flex-start',
  marginTop: 12,
  background: 'none',
  border: 0,
  padding: 0,
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 800,
  color: 'var(--color-cta-600)',
}
const fieldLabel: CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 700,
  marginBottom: 7,
  color: 'var(--color-text-primary)',
}
const fieldHelp: CSSProperties = {
  margin: '-3px 0 7px',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  color: 'var(--color-text-secondary)',
}
const inputStyle: CSSProperties = {
  width: '100%',
  padding: '13px 14px',
  border: '1.5px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-md)',
  fontSize: 15,
  fontFamily: 'var(--font-body)',
  color: 'var(--color-text-primary)',
  background: 'var(--color-surface-card)',
}
const lookupStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  color: 'var(--color-cta-500)',
  fontWeight: 800,
  fontSize: 13,
  textDecoration: 'none',
}
const primaryStyle: CSSProperties = {
  borderRadius: 'var(--radius-md)',
  padding: '12px 20px',
  fontFamily: 'var(--font-heading)',
  fontSize: 14,
  fontWeight: 800,
  border: '1.6px solid transparent',
  background: 'linear-gradient(135deg, var(--color-cta-500), var(--color-cta-600))',
  color: 'var(--color-text-inverse)',
  cursor: 'pointer',
}
const primaryDisabled: CSSProperties = {
  ...primaryStyle,
  background: 'var(--color-neutral-300)',
  // Use the full `border` shorthand (not a `borderColor` override on top of
  // primaryStyle's `border`) so React doesn't warn about mixing shorthand +
  // non-shorthand for the same property during rerender.
  border: '1.6px solid var(--color-neutral-300)',
  color: 'var(--color-text-inverse)',
  cursor: 'not-allowed',
}
const outlineStyle: CSSProperties = {
  borderRadius: 'var(--radius-md)',
  padding: '12px 20px',
  fontFamily: 'var(--font-heading)',
  fontSize: 14,
  fontWeight: 800,
  border: '1.6px solid var(--color-cta-500)',
  background: 'var(--color-surface-card)',
  color: 'var(--color-cta-500)',
  cursor: 'pointer',
}
