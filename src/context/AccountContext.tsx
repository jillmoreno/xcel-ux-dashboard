import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  ACCOUNT CONTEXT — XCEL UX Dashboard
 * ─────────────────────────────────────────────────────────────────────────
 *
 *  PORTED NOTE, and read this before adding to it.
 *
 *  The Common LMS original (`jill-dashboard-ux-designs`) is 645 lines: five
 *  brands, a four-level membership-tier model with per-brand tier tables, tier
 *  tones, avatar treatments, entitlement/access resolution, and multi-membership
 *  records. All of that exists because the LMS **product** renders differently
 *  per brand and tier — the dashboard itself never needed it.
 *
 *  A trace of the ported files says so precisely: exactly three of them import
 *  from here, and between them they use four names — `Brand`, `Membership`,
 *  `professionFor`, `useAccount`. So this is that surface and nothing else.
 *
 *  XCEL is single-brand, so `Brand` is a one-member union rather than being
 *  deleted outright: `featurePreviewSrc` and `prototypeFeatures` both take it as
 *  a type, and keeping the seam means a second skin is an edit here instead of a
 *  refactor across those files. XCEL spans Insurance / Mortgage / Banking, which
 *  is a plausible future use for it.
 *
 *  The member / non-member axis is likewise kept, even though XCEL has no
 *  membership tiers: the gateway's `FeaturePageLink.membership` uses it to
 *  express "the same page, in two states". For XCEL the natural reading is the
 *  sponsored/enrolled learner vs. the self-pay one — the split the catalogue's
 *  unresolved "who pays" question turns on. Rename the labels, not the shape.
 */

/** XCEL is single-brand today. Kept as a union so the type seam survives. */
export type Brand = 'xcel'

/**
 * The two viewer states a walkthrough page can be pinned to. In the LMS this
 * was literally membership; here it stands in for PartnerHub's permission
 * split. The names are kept so the ported gateway code needs no changes.
 */
export type Membership = 'member' | 'non-member'

export type Profession = {
  brand: Brand
  /** Shown wherever the demo context is named. */
  label: string
  /** Full product name — the gateway's brand-preview buttons use this as both
   *  their label and their tooltip, so it has to read as a proper noun. */
  brandFullName: string
  /** One line on what the brand is. */
  description: string
}

export const PROFESSIONS: Profession[] = [
  {
    brand: 'xcel',
    label: 'XCEL',
    brandFullName: 'XCEL LMS',
    description:
      'FinServ (Insurance / Mortgage / Banking) next-generation learner platform.',
  },
]

export function professionFor(brand: Brand): Profession {
  // PROFESSIONS is exhaustive over `Brand` — `!` is safe.
  return PROFESSIONS.find((p) => p.brand === brand)!
}

export type AccountState = { brand: Brand; membership: Membership }

const STORAGE_KEY = 'xcel.account'
const DEFAULT_STATE: AccountState = { brand: 'xcel', membership: 'member' }

function readStored(): AccountState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_STATE
    const parsed = JSON.parse(raw) as Partial<AccountState>
    const membership: Membership = parsed.membership === 'non-member' ? 'non-member' : 'member'
    return { brand: 'xcel', membership }
  } catch {
    // A private window / blocked site data throws on read. Never let the
    // dashboard fail to boot over a persisted preference.
    return DEFAULT_STATE
  }
}

type AccountContextValue = AccountState & {
  setMembership: (membership: Membership) => void
  setAccount: (brand: Brand, membership: Membership) => void
  profession: Profession
}

const AccountContext = createContext<AccountContextValue | null>(null)

export function AccountProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AccountState>(readStored)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Non-fatal — the choice just won't survive a reload.
    }
    // The brand drives the token override blocks in tokens.css, exactly as it
    // does in the LMS. One brand today, but the hook stays wired.
    document.documentElement.dataset.brand = state.brand
  }, [state])

  const setMembership = useCallback((membership: Membership) => {
    setState((s) => ({ ...s, membership }))
  }, [])

  const setAccount = useCallback((brand: Brand, membership: Membership) => {
    setState({ brand, membership })
  }, [])

  const value = useMemo<AccountContextValue>(
    () => ({
      ...state,
      setMembership,
      setAccount,
      profession: professionFor(state.brand),
    }),
    [state, setMembership, setAccount],
  )

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
}

/**
 * Returns a safe default outside a provider — mirroring `useTheme` /
 * `useDeviceFrame` in the LMS — so a unit-mounted component never crashes on a
 * missing provider.
 */
export function useAccount(): AccountContextValue {
  const ctx = useContext(AccountContext)
  if (ctx) return ctx
  return {
    ...DEFAULT_STATE,
    setMembership: () => {},
    setAccount: () => {},
    profession: professionFor(DEFAULT_STATE.brand),
  }
}
