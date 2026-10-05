import '@testing-library/jest-dom/vitest'

// jsdom doesn't ship ResizeObserver. Components like MandatorySection use
// it to track carousel scroll bounds; a no-op stub is enough for tests.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

// jsdom doesn't ship matchMedia. `useMediaQuery` needs it; a no-op stub
// always reporting "no match" is enough for tests so responsive overrides
// stay inactive in jsdom.
if (typeof globalThis.matchMedia === 'undefined') {
  globalThis.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })
}

// jsdom has no layout, so `window.scrollTo` is a stub that logs "Not
// implemented" and nothing else. `PlatformShell` calls it on every section
// change (a new section starts at the top), which would print that line
// through any suite that navigates. A no-op keeps the output readable and
// stays spy-able — `SectionBreadcrumb.test.tsx` asserts the call, and the
// real scrolling was verified in the browser.
globalThis.scrollTo = () => {}
