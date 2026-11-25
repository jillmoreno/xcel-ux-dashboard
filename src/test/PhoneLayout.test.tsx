import { describe, expect, it, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useEffect, type ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider, useFeatureFlags } from '@/context/FeatureFlagContext'
import { PHONE_MAX_WIDTH, usePhoneLayout } from '@/components/layout/usePhoneLayout'

/**
 * THE PHONE LAYOUT SWITCHES ON TWO WAYS (2026-11-25, Jillienne: "when in this
 * full screen view, need to make the page responsive so when user shrinks it
 * down, this mobile version will autotrigger"): the review bar's Mobile frame,
 * or the live page in a window no wider than PHONE_MAX_WIDTH. A tablet or
 * desktop frame never becomes a phone, however narrow the window around it.
 *
 * The Breakpoint control is set once, in an effect, by a sibling of the hook
 * under test — never from inside it, which would render in a loop.
 */

const realMatchMedia = globalThis.matchMedia

function stubWindowWidth(width: number) {
  globalThis.matchMedia = (query: string) => {
    const m = /max-width:\s*(\d+)px/.exec(query)
    const matches = m ? width <= Number(m[1]) : false
    return {
      matches,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    } as MediaQueryList
  }
}

function PinBreakpoint({ breakpoint }: { breakpoint: 'live' | 'mobile' | 'tablet' | 'desktop' }) {
  const { setVariant } = useFeatureFlags()
  useEffect(() => {
    setVariant('home-breakpoint', breakpoint)
  }, [setVariant, breakpoint])
  return null
}

function wrapperFor(breakpoint: 'live' | 'mobile' | 'tablet' | 'desktop') {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={['/dashboard-rebrand?demo=1']}>
        <AccountProvider>
          <FeatureFlagProvider>
            <PinBreakpoint breakpoint={breakpoint} />
            {children}
          </FeatureFlagProvider>
        </AccountProvider>
      </MemoryRouter>
    )
  }
}

afterEach(() => {
  globalThis.matchMedia = realMatchMedia
})

describe('usePhoneLayout', () => {
  it('is off on the live page in a desktop-wide window', () => {
    stubWindowWidth(1440)
    const { result } = renderHook(() => usePhoneLayout(), { wrapper: wrapperFor('live') })
    expect(result.current).toBe(false)
  })

  it('switches on when the live window is no wider than the phone ceiling', () => {
    stubWindowWidth(PHONE_MAX_WIDTH)
    const { result } = renderHook(() => usePhoneLayout(), { wrapper: wrapperFor('live') })
    expect(result.current).toBe(true)
  })

  it('is on inside the Mobile frame whatever the window is', () => {
    stubWindowWidth(1440)
    const { result } = renderHook(() => usePhoneLayout(), { wrapper: wrapperFor('mobile') })
    expect(result.current).toBe(true)
  })

  it('never turns a tablet frame into a phone, however narrow the window', () => {
    stubWindowWidth(320)
    const { result } = renderHook(() => usePhoneLayout(), { wrapper: wrapperFor('tablet') })
    expect(result.current).toBe(false)
  })
})
