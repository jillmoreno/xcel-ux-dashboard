/* eslint-disable react-refresh/only-export-components -- the provider, the
   useLearningSetup hook, and the shared types live in one module so consumers
   import from a single place (mirrors ThemeContext / AccountContext). */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

/**
 * In-session state for the new-user learning-experience setup (the Dashboard
 * Rebrand's `new-user` progress state). No persistence — this is prototype demo
 * state: finishing the wizard flips the dashboard to the populated
 * `setup-complete-0` view for the rest of the session; skipping collapses the
 * hero to a resume band. Wrap the Dashboard Rebrand shell in
 * `<LearningSetupProvider>`; `useLearningSetup()` returns a safe no-op default
 * outside a provider (mirrors `useTheme` / `useDeviceFrame`) so unit-mounted
 * components never crash.
 */
export type SetupData = {
  /** Selected goal title (Step 1). */
  goal: string
  /** Selected license type (Step 2) — the primary / first when multiple. */
  licenseType: string
  /** All selected license/registration types (multi-license variant). */
  licenses: string[]
  /** Selected license state(s) (single- or multi-state variant). */
  states: string[]
  /** License expiration (yyyy-mm-dd from the date input). */
  expires: string
  /** Optional license number. */
  licenseNumber: string
  /** Date of birth (yyyy-mm-dd). */
  dob: string
  phone: string
  /** Selected course-of-interest titles (Step 4, course-tiles variant). */
  courses: string[]
  /** Selected interest tags (Step 4, interest-pills variant). */
  interests: string[]
  /** Selected modality labels (Step 5). */
  modalities: string[]
}

export const EMPTY_SETUP: SetupData = {
  goal: '',
  licenseType: '',
  licenses: [],
  states: [],
  expires: '',
  licenseNumber: '',
  dob: '',
  phone: '',
  courses: [],
  interests: [],
  modalities: [],
}

export type LearningSetupState = {
  /** Wizard finished — treat the session as `setup-complete-0`. */
  completed: boolean
  /** Current wizard step index (0-based). */
  step: number
  data: SetupData
  setData: (patch: Partial<SetupData>) => void
  goToStep: (n: number) => void
  /** Mark the wizard complete (populated dashboard). */
  complete: () => void
  /** Reset everything (demo "start over"). */
  restart: () => void
}

const LearningSetupContext = createContext<LearningSetupState | null>(null)

const NOOP_SETUP: LearningSetupState = {
  completed: false,
  step: 0,
  data: EMPTY_SETUP,
  setData: () => {},
  goToStep: () => {},
  complete: () => {},
  restart: () => {},
}

export function LearningSetupProvider({ children }: { children: ReactNode }) {
  const [completed, setCompleted] = useState(false)
  const [step, setStep] = useState(0)
  const [data, setDataState] = useState<SetupData>(EMPTY_SETUP)

  const setData = useCallback((patch: Partial<SetupData>) => {
    setDataState((prev) => ({ ...prev, ...patch }))
  }, [])
  const goToStep = useCallback((n: number) => setStep(Math.max(0, n)), [])
  const complete = useCallback(() => setCompleted(true), [])
  const restart = useCallback(() => {
    setCompleted(false)
    setStep(0)
    setDataState(EMPTY_SETUP)
  }, [])

  const value = useMemo<LearningSetupState>(
    () => ({ completed, step, data, setData, goToStep, complete, restart }),
    [completed, step, data, setData, goToStep, complete, restart],
  )

  return <LearningSetupContext.Provider value={value}>{children}</LearningSetupContext.Provider>
}

export function useLearningSetup(): LearningSetupState {
  return useContext(LearningSetupContext) ?? NOOP_SETUP
}
