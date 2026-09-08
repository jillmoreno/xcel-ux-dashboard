/* eslint-disable react-refresh/only-export-components -- provider + hook in one
   file, same single-import pattern as MotivationContext / LoFiContext. */
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
 * The learner's chosen profile photo — an in-session override for the fixture
 * `user.avatarUrl`, set from the "Personalize your profile" panel. Stored as a
 * data URL (so an uploaded image survives a reload) in
 * `localStorage['cgp.profileAvatar']`. `null` means "no override" → callers fall
 * back to the brand fixture avatar.
 */
const STORAGE_KEY = 'cgp.profileAvatar'

type ProfileAvatarState = {
  /** Data-URL override, or `null` when the learner hasn't set one. */
  avatarOverride: string | null
  setAvatarOverride: (next: string | null) => void
}

function loadInitial(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(STORAGE_KEY) || null
  } catch {
    return null
  }
}

const ProfileAvatarContext = createContext<ProfileAvatarState | null>(null)

export function ProfileAvatarProvider({ children }: { children: ReactNode }) {
  const [avatarOverride, setState] = useState<string | null>(loadInitial)

  useEffect(() => {
    try {
      if (avatarOverride) window.localStorage.setItem(STORAGE_KEY, avatarOverride)
      else window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Quota / private-mode failures are swallowed — state still lives in
      // memory for the session (a large uploaded photo can overrun quota).
    }
  }, [avatarOverride])

  const setAvatarOverride = useCallback((next: string | null) => setState(next), [])
  const value = useMemo<ProfileAvatarState>(
    () => ({ avatarOverride, setAvatarOverride }),
    [avatarOverride, setAvatarOverride],
  )

  return <ProfileAvatarContext.Provider value={value}>{children}</ProfileAvatarContext.Provider>
}

/** Safe default for callers with no provider (tests / isolated renders). */
const DEFAULT_STATE: ProfileAvatarState = { avatarOverride: null, setAvatarOverride: () => {} }

export function useProfileAvatar(): ProfileAvatarState {
  return useContext(ProfileAvatarContext) ?? DEFAULT_STATE
}
