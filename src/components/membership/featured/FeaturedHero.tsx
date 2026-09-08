import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react'
import { ArrowLeft, ArrowRight } from '@/icons'
import { useAccount } from '@/context/AccountContext'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { whatsNewFeaturedFor } from '@/data/membership/whatsNewFeaturedFixtures'
import { imageForIndex } from '@/utils/courseImage'

/**
 * FeaturedHero — the single full-width rotating "Featured" hero that sits
 * directly under the Current Learning Path band on the Dashboard Rebrand
 * overview (`/dashboard-rebrand`). ONE full-width image at a time
 * (not a row of cards) that rotates through slides — the cover, eyebrow, title,
 * description, and CTA all change as you advance.
 *
 * It replaces the two former What's New carousels (the Marketing band's
 * embedded carousel + the smaller `WhatsNewWidget`), so "Featured" is the single
 * What's New surface there, shown for every persona (member + non-member).
 * Exploration: `explorations/whats-new-fullwidth/whats-new-fullwidth-hero.html`.
 *
 * Built to the team's **Carousel component rules** (ux-research-rationale-hub
 * #q-home-carousel): manual control by default, always-visible arrows sized for
 * touch (≥44px), keyboard (← / →) + swipe, and NO on-slide chips (badges are
 * rationed; a "New" tag under a "Featured" section is a non-signal — the
 * imagery + title + CTA carry it; the resource kind stays in the eyebrow copy).
 * There's deliberately no "See All" — each slide routes to its own destination,
 * so there's no single home to link.
 *
 * The `dashboard-featured` flag drives it: the enable toggle shows/hides the
 * whole widget; the variant picks **manual** (default — no timers, matches our
 * shipped carousels) vs **auto** (auto-advances WITH a visible Pause/Play
 * control + pause-on-hover/focus + `prefers-reduced-motion`, per WCAG 2.2.2 —
 * the variant to demo/discuss with stakeholders).
 *
 * Content comes from the existing `whatsNewFeaturedFor(brand)` fixture (member
 * vs. non-member CTA labels honored). TODO(data): per-slide CTA destinations + real
 * per-slide cover photos (today the cover uses `imageForIndex`).
 */
const AUTO_ADVANCE_MS = 6000

export function FeaturedHero() {
  const { brand, membership } = useAccount()
  const isMember = membership === 'member'
  const flag = useFeatureFlag('dashboard-featured')
  // Background treatment (`whats-new-image`): `image` (default) uses the slide's
  // cover photo; `no-image` swaps in a brand-gradient panel — the fallback for
  // when no cover photo is available. (Repurposed onto the Featured hero from the
  // archived What's New marketing carousel it used to drive.)
  const showImage = useFeatureFlag('whats-new-image').variant !== 'no-image'
  const slides = whatsNewFeaturedFor(brand)

  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const reducedMotion = usePrefersReducedMotion()
  const swipeStartX = useRef<number | null>(null)

  const auto = flag.variant === 'auto'
  // Secondary "Height" axis — `compact` shortens the hero (and tightens the
  // title / copy inset so it stays proportional) to take less vertical space.
  const compact = flag.secondaryVariant === 'compact'
  const count = slides.length
  // Auto-rotate ONLY on the auto variant, when not paused (hover/focus/manual)
  // and the user hasn't asked to reduce motion (WCAG 2.2.2 / 2.3.3).
  const rotating = auto && !paused && !reducedMotion && count > 1

  useEffect(() => {
    if (!rotating) return
    const id = window.setInterval(() => setIndex((n) => n + 1), AUTO_ADVANCE_MS)
    return () => window.clearInterval(id)
  }, [rotating])

  // Enable toggle off, or no slides for this brand → self-hide.
  if (!flag.enabled || count === 0) return null

  const i = ((index % count) + count) % count
  const slide = slides[i]
  const cta = isMember ? slide.memberCta : slide.nonMemberCta
  const go = (n: number) => setIndex(((n % count) + count) % count)

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(i - 1) }
    else if (e.key === 'ArrowRight') { e.preventDefault(); go(i + 1) }
  }
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => { swipeStartX.current = e.clientX }
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (swipeStartX.current === null) return
    const dx = e.clientX - swipeStartX.current
    swipeStartX.current = null
    if (Math.abs(dx) > 40) go(dx < 0 ? i + 1 : i - 1)
  }
  // Pause auto-advance while the learner is hovering or focused within the hero.
  const pauseHandlers = auto
    ? {
        onMouseEnter: () => setPaused(true),
        onMouseLeave: () => setPaused(false),
        onFocusCapture: () => setPaused(true),
        onBlurCapture: () => setPaused(false),
      }
    : {}

  return (
    <section aria-label="Featured" style={sectionStyle}>
      <p style={leadStyle}>Featured</p>
      <div
        role="group"
        aria-roledescription="carousel"
        aria-label={`Featured — slide ${i + 1} of ${count}`}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        {...pauseHandlers}
        style={{
          ...heroStyle,
          height: compact ? 260 : 380,
          backgroundImage: showImage ? `url(${imageForIndex(i)})` : NO_IMAGE_BG,
        }}
      >
        <div aria-hidden style={scrimStyle} />

        {/* copy — bottom-left, re-keyed per slide so `aria-live` announces it */}
        <div style={compact ? { ...contentStyle, bottom: 26 } : contentStyle} aria-live="polite">
          <p style={eyebrowStyle}>{slide.eyebrow}</p>
          <h3 style={compact ? { ...titleStyle, fontSize: 24 } : titleStyle}>{slide.title}</h3>
          <p style={descStyle}>{slide.desc}</p>
          <p style={bylineStyle}>{slide.byline}</p>
          <button
            type="button"
            style={ctaStyle}
            onClick={() => console.info('featured:cta', { id: slide.id, isMember })}
          >
            {cta.primary}
            <ArrowRight size={14} aria-hidden />
          </button>
        </div>

        {/* controls — clustered bottom-right, clear of the copy */}
        {count > 1 && (
          <div style={controlsStyle}>
            {auto && (
              <button
                type="button"
                style={arrowStyle}
                aria-pressed={paused}
                aria-label={paused ? 'Play automatic rotation' : 'Pause automatic rotation'}
                onClick={() => setPaused((p) => !p)}
              >
                {paused ? <span aria-hidden style={playGlyphStyle} /> : <span aria-hidden style={pauseGlyphStyle} />}
              </button>
            )}
            <button type="button" style={arrowStyle} aria-label="Previous slide" onClick={() => go(i - 1)}>
              <ArrowLeft size={17} aria-hidden />
            </button>
            <div style={dotsStyle}>
              {slides.map((s, n) => (
                <button
                  key={s.id}
                  type="button"
                  aria-label={`Go to slide ${n + 1}`}
                  aria-current={n === i}
                  onClick={() => go(n)}
                  style={n === i ? dotOnStyle : dotStyle}
                />
              ))}
            </div>
            <button type="button" style={arrowStyle} aria-label="Next slide" onClick={() => go(i + 1)}>
              <ArrowRight size={17} aria-hidden />
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

/** `prefers-reduced-motion: reduce` — live, so toggling the OS setting is honored. */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return reduced
}

/* ─── styles (tokens only; on-image whites are theme-independent — the scrim is
   dark in both themes, matching WhatsNewWidget / MarketingCarousel) ─────────── */

const sectionStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 12 }

// Large accent lead, matched to WhatsNewWidget / DashboardRecommendedBand headers.
const leadStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 15,
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  // Theme-aware: deep navy on light, lifts to a light brand tint in dark.
  color: 'var(--color-section-lead)',
}

// "No image" fallback — a brand-gradient panel behind the copy (a valid
// backgroundImage, so heroStyle's backgroundSize/Position still apply cleanly).
// The scrim + white copy stay legible over the deep navy.
const NO_IMAGE_BG = 'linear-gradient(135deg, var(--color-primary-800), var(--color-primary-600))'

const heroStyle: CSSProperties = {
  position: 'relative',
  width: '100%',
  height: 380,
  borderRadius: 'var(--radius-lg)',
  overflow: 'hidden',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  outline: 'none',
}

// Scrim tuned for WCAG AA: the horizontal gradient HOLDS ~0.66 out to ~58%
// width (where the longest text lines end) before falling off, so the small
// body text clears 4.5:1 even over a near-white highlight in the cover photo.
// The bottom gradient reinforces the (bottom-anchored) copy. See the a11y
// measurement in the dev-handoff notes.
const scrimStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  background:
    'linear-gradient(90deg, rgb(4 17 36 / 0.86) 0%, rgb(4 17 36 / 0.66) 58%, rgb(4 17 36 / 0.12) 90%), linear-gradient(0deg, rgb(4 17 36 / 0.58), transparent 60%)',
}

const contentStyle: CSSProperties = {
  position: 'absolute',
  left: 44,
  right: 44,
  bottom: 38,
  maxWidth: 560,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}

const eyebrowStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  // Full opacity (was 0.82) — small on-image text needs the extra contrast; the
  // eyebrow still reads as secondary via its size + tracking, not opacity.
  color: 'rgb(255 255 255 / 1)',
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontSize: 30,
  fontWeight: 700,
  lineHeight: 1.1,
  color: 'rgb(255 255 255 / 0.99)',
}

const descStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 15,
  lineHeight: 1.5,
  // Full opacity (was 0.9) for AA over the cover photo.
  color: 'rgb(255 255 255 / 1)',
}

const bylineStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 500,
  // Full opacity (was 0.82) — small on-image text.
  color: 'rgb(255 255 255 / 1)',
}

// SECONDARY (outline) button style — per design direction the Featured CTA is
// the secondary treatment, NOT the primary filled gradient. Mirrors the design
// system's `secondary` variant (transparent fill + 1px border + accent text),
// adapted to the on-image dark scrim: the accent is theme-independent white
// (like the arrow controls) so it stays legible over any cover photo.
const ctaStyle: CSSProperties = {
  alignSelf: 'flex-start',
  marginTop: 4,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 9,
  padding: '12px 22px',
  border: '1px solid rgb(255 255 255 / 0.9)',
  borderRadius: 'var(--radius-md)',
  background: 'transparent',
  color: 'rgb(255 255 255 / 1)',
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 14,
  cursor: 'pointer',
}

const controlsStyle: CSSProperties = {
  position: 'absolute',
  right: 28,
  bottom: 24,
  display: 'flex',
  alignItems: 'center',
  gap: 14,
}

const arrowStyle: CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 'var(--radius-pill)',
  border: '1px solid rgb(255 255 255 / 0.3)',
  background: 'rgb(4 17 36 / 0.35)',
  color: 'rgb(255 255 255 / 1)',
  display: 'grid',
  placeItems: 'center',
  cursor: 'pointer',
  backdropFilter: 'blur(3px)',
}

// Inline pause/play glyphs (no icon-registry entry for these — see file header).
const pauseGlyphStyle: CSSProperties = {
  width: 12,
  height: 14,
  borderLeft: '4px solid currentColor',
  borderRight: '4px solid currentColor',
}

const playGlyphStyle: CSSProperties = {
  width: 0,
  height: 0,
  marginLeft: 3,
  borderTop: '7px solid transparent',
  borderBottom: '7px solid transparent',
  borderLeft: '12px solid currentColor',
}

const dotsStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 8 }

const dotStyle: CSSProperties = {
  width: 8,
  height: 8,
  padding: 0,
  border: 'none',
  borderRadius: '50%',
  background: 'rgb(255 255 255 / 0.45)',
  cursor: 'pointer',
}

const dotOnStyle: CSSProperties = {
  ...dotStyle,
  width: 22,
  borderRadius: 'var(--radius-pill)',
  background: 'rgb(255 255 255 / 1)',
}
