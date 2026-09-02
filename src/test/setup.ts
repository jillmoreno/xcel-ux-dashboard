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
