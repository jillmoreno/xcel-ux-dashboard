import { useState, type CSSProperties } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { StandaloneBrowserChrome } from '@/components/layout/BrowserChromeBar'
import { XcelFooter } from '@/components/e2e/XcelFooter'
import { XcelSiteHeader } from '@/components/e2e/XcelSiteHeader'
import {
  FINDER_EDUCATION,
  FINDER_STATES,
  linesOfAuthorityFor,
  type FinderEducation,
} from '@/data/xcelCourseFinder'
import { INVITE_LOA_PARAM, INVITE_STATE_PARAM } from '@/data/inviteMissingDetails'
import { clearPartnerCodeAnswer } from '@/data/inviteFlows'
import { useEndToEndDemoParams, useEndToEndPageChrome } from './endToEndDemo'
import './inviteFlow.css'

/**
 * SCREEN 1 OF THE GUEST JOURNEY — xcelsolutions.com, where a guest actually
 * starts (2026-10-22, Jillienne: "Guest Checkout. Needs to start sooner").
 *
 * ⚠ THE GUEST FLOW USED TO BEGIN AT THE PRODUCT PAGE, which assumed the thing
 * it was supposed to be exploring: a guest does not arrive at a Florida Life
 * and Health product page, they arrive at the public site and find it. The
 * options modal was standing in for this screen — asking, on the product page,
 * the question the product page's existence had already answered.
 *
 * ⚠ ITS FIGMA NODE IS A SCREENSHOT. `273:1927` is a flattened 2498×1386 PNG of
 * the live site with no layers, so there was no design to measure and no asset
 * to pull — Jillienne pointed at xcelsolutions.com instead. Everything here was
 * read off the real page: the headline and body verbatim, the finder's cascade,
 * its option lists (`xcelCourseFinder.ts`), and the hero photo, which is the
 * site's own `xcel-banner.jpg` saved to `public/brand/e2e-xcel-hero.jpg`.
 *
 * ⚠ FLOW-BEARING PARTS ONLY, her call. The hero, the partner-code box and the
 * finder are the screen's decisions; the utility bar, the mega-nav, the cart
 * and the marketing bands below the fold are set dressing, and rebuilding them
 * would be a second marketing site to keep in step with the first. The nav here
 * is a single bar — enough to say "you are on the public site", not a
 * reproduction of it.
 */
export function XcelFindCoursePage() {
  useEndToEndDemoParams()
  useEndToEndPageChrome('Online Insurance License Courses | XCEL')
  const navigate = useNavigate()
  const [params] = useSearchParams()

  /* THE CASCADE IS THE REAL BEHAVIOUR. On the live site Education is empty
     until a State is picked and Line of authority is empty until Education is,
     so each selection clears the ones after it — a reviewer who can pick a line
     of authority before naming a state is looking at a control the product does
     not have. */
  const [state, setState] = useState('')
  const [education, setEducation] = useState<FinderEducation | ''>('')
  const [lineOfAuthority, setLineOfAuthority] = useState('')
  const [partnerCode, setPartnerCode] = useState('')

  const lines = education ? linesOfAuthorityFor(education) : []
  const canFind = state !== '' && education !== '' && lineOfAuthority !== ''

  /** Carry the demo's own params forward, then add the pick. */
  const findCourses = () => {
    const next = clearPartnerCodeAnswer(params)
    /* ⚠ THE SAME TWO PARAMS THE OPTIONS MODAL WRITES, deliberately. A guest who
       names their state and line of authority HERE has answered the modal's
       question, so `useInviteDetailsMissing` reads false downstream and the
       product page does not stop them to ask it again. One carrier for one
       fact; see `inviteMissingDetails.ts`. */
    next.set(INVITE_STATE_PARAM, state)
    next.set(INVITE_LOA_PARAM, lineOfAuthority)
    navigate({ pathname: '/end-to-end-demo/packages', search: next.toString() })
  }

  return (
    <div style={PAGE}>
      {/* The browser window the rest of the flow draws (2026-10-19). */}
      <StandaloneBrowserChrome />

      {/* ⚠ THE SHARED HEADER, which carries the WIRED "Get License" menu — the
          route a guest actually takes to the next page. The finder below is the
          homepage's own second door to the same place. */}
      <XcelSiteHeader />

      <section aria-labelledby="xcel-hero-title" style={HERO}>
        {/* ⚠ THE PHOTO IS A BACKGROUND, as it is on the live site: it fades to
            white on the left so the headline sits on the page's own ground
            rather than on the image. Cropping it to a box beside the text would
            lose that fade and put a hard edge through the hero. */}
        <div aria-hidden style={HERO_PHOTO} />
        <div aria-hidden style={HERO_WASH} />
        <div style={HERO_CONTENT}>
          <h1 id="xcel-hero-title" style={HERO_TITLE}>
            From Getting Licensed to Growing Your Career
          </h1>
          <p style={HERO_BODY}>
            Start your insurance career with pre-licensing and exam prep featuring expert instruction,
            all-inclusive materials, and instant support from Rubi™, our AI study partner. Then, keep
            growing with CE courses built for every career stage.
          </p>

          {/* ⚠ THE PARTNER CODE BOX IS THE OTHER DOOR ON THIS SCREEN, and it is
              drawn because of what it means to the flows rather than because it
              is in the screenshot: a code is how a walk-in becomes
              partner-ATTRIBUTED, which is the distinction `partnerAttributed`
              carries and the likeliest thing a QR code encodes. It is inert
              here — wiring it to set the partner flow is its own decision, and
              a box that silently did nothing would be worse than one that is
              visibly not yet wired. */}
          <div style={PARTNER_CARD}>
            <p style={PARTNER_TITLE}>Enter Partner Code</p>
            <div style={PARTNER_ROW}>
              <label style={{ flex: '1 1 auto', minWidth: 0 }}>
                <span style={SR_ONLY}>Partner code</span>
                <input
                  type="text"
                  value={partnerCode}
                  onChange={(e) => setPartnerCode(e.target.value)}
                  placeholder="Enter partner code"
                  style={PARTNER_INPUT}
                />
              </label>
              <button type="button" style={PARTNER_GO} title="Not wired in this prototype">
                Go
              </button>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="xcel-finder-title" style={FINDER}>
        <h2 id="xcel-finder-title" style={FINDER_TITLE}>
          Find The Right Insurance License Course For You
        </h2>
        <div style={FINDER_ROW}>
          <Select
            label="State"
            value={state}
            placeholder="Select a state"
            options={FINDER_STATES}
            onChange={(v) => {
              setState(v)
              /* Each pick clears the ones after it — the live site's cascade. */
              setEducation('')
              setLineOfAuthority('')
            }}
          />
          <Select
            label="Education"
            value={education}
            placeholder="Select education"
            options={FINDER_EDUCATION}
            disabled={state === ''}
            onChange={(v) => {
              setEducation(v as FinderEducation)
              setLineOfAuthority('')
            }}
          />
          <Select
            label="Line of authority"
            value={lineOfAuthority}
            placeholder="Select line of authority"
            options={lines}
            disabled={education === ''}
            onChange={setLineOfAuthority}
          />
          <button
            type="button"
            disabled={!canFind}
            onClick={findCourses}
            className={canFind ? 'cre-e2e-cta' : undefined}
            style={canFind ? FIND_ON : FIND_OFF}
          >
            Find courses
          </button>
        </div>
      </section>

      <XcelFooter />
    </div>
  )
}

/** The finder's three dropdowns — one shape, so the cascade reads as one control. */
function Select({
  label,
  value,
  placeholder,
  options,
  onChange,
  disabled = false,
}: {
  label: string
  value: string
  placeholder: string
  options: readonly string[]
  onChange: (v: string) => void
  disabled?: boolean
}) {
  return (
    <label style={FIELD_GROUP}>
      <span style={{ ...FIELD_LABEL, opacity: disabled ? 0.5 : 1 }}>{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        style={{
          ...SELECT,
          color: value === '' ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  )
}

/* ── Styles ─────────────────────────────────────────────────────────────── */

const SR_ONLY: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
}

const PAGE: CSSProperties = {
  minHeight: '100%',
  background: 'var(--color-fixed-light)',
}

const HERO: CSSProperties = {
  position: 'relative',
  isolation: 'isolate',
  minHeight: 380,
  display: 'flex',
  alignItems: 'center',
  padding: '48px 48px 56px',
  background: 'var(--color-fixed-light)',
  overflow: 'hidden',
}

/* The site's own banner, right-anchored: it is authored with the subject on the
   right and a wash to white on the left, which is what lets the copy sit over
   it without a scrim. */
const HERO_PHOTO: CSSProperties = {
  position: 'absolute',
  inset: 0,
  zIndex: -1,
  backgroundImage: 'url(/brand/e2e-xcel-hero.jpg)',
  /* ⚠ `auto 100%`, NOT `cover`. The banner is 1920×720 with the subject on the
     right and a wash to white on the left; `cover` scales it until it fills the
     width, which drags the subject into the middle of the hero and puts the
     headline across her face. Fitting to HEIGHT and anchoring right keeps her
     where the design has her, and the strip of page showing to the left of the
     image is the same white the image's own wash ends on, so there is no seam. */
  backgroundSize: 'auto 100%',
  backgroundPosition: 'right center',
  backgroundRepeat: 'no-repeat',
}

/* ⚠ AND A WASH OVER IT, so the copy is legible at any width. The live site
   gets this from the photograph alone, which works at the width it was
   composed for; the demo frame is narrower and resizable, so at some widths the
   image's own fade starts too far right and the headline lands on her shoulder.
   A gradient in the page's own colour finishes the fade the photo starts —
   `transparent` at the far end rather than a flat scrim, so the right half of
   the picture is untouched. */
const HERO_WASH: CSSProperties = {
  position: 'absolute',
  inset: 0,
  zIndex: -1,
  background:
    'linear-gradient(to right, var(--color-fixed-light) 0%, var(--color-fixed-light) 34%, transparent 62%)',
}

const HERO_CONTENT: CSSProperties = {
  width: '100%',
  maxWidth: 480,
  display: 'flex',
  flexDirection: 'column',
  gap: 18,
}

const HERO_TITLE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-serif)',
  fontWeight: 700,
  fontSize: 40,
  lineHeight: '48px',
  color: 'var(--color-text-primary)',
}

const HERO_BODY: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 16,
  lineHeight: '26px',
  color: 'var(--color-text-primary)',
}

const PARTNER_CARD: CSSProperties = {
  marginTop: 8,
  padding: 20,
  maxWidth: 420,
  borderRadius: 4,
  border: '1px solid var(--color-e2e-form-outline)',
  background: 'color-mix(in srgb, var(--color-fixed-light) 88%, transparent)',
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
}

const PARTNER_TITLE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-serif)',
  fontWeight: 700,
  fontSize: 19,
  lineHeight: '24px',
  color: 'var(--color-text-primary)',
}

const PARTNER_ROW: CSSProperties = { display: 'flex', alignItems: 'stretch', gap: 0 }

const PARTNER_INPUT: CSSProperties = {
  boxSizing: 'border-box',
  width: '100%',
  height: 42,
  padding: '0 12px',
  border: '1px solid var(--color-e2e-form-outline)',
  borderRight: 'none',
  background: 'var(--color-fixed-light)',
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 14,
  color: 'var(--color-text-primary)',
}

const PARTNER_GO: CSSProperties = {
  flex: 'none',
  width: 72,
  height: 42,
  border: 'none',
  background: 'var(--color-xcel-brick-600)',
  color: 'var(--color-fixed-light)',
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 15,
  cursor: 'pointer',
}

const FINDER: CSSProperties = {
  padding: '44px 48px 56px',
  background: 'var(--color-secondary-200)',
  display: 'flex',
  flexDirection: 'column',
  gap: 28,
  alignItems: 'center',
}

const FINDER_TITLE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-serif)',
  fontWeight: 700,
  fontSize: 32,
  lineHeight: '40px',
  textAlign: 'center',
  color: 'var(--color-text-primary)',
}

const FINDER_ROW: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'flex-end',
  justifyContent: 'center',
  gap: 20,
  width: '100%',
}

const FIELD_GROUP: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  minWidth: 0,
  flex: '1 1 200px',
  maxWidth: 260,
}

const FIELD_LABEL: CSSProperties = {
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 14,
  color: 'var(--color-text-primary)',
}

const SELECT: CSSProperties = {
  boxSizing: 'border-box',
  width: '100%',
  height: 46,
  padding: '0 12px',
  borderRadius: 4,
  border: '1px solid var(--color-e2e-card-outline)',
  background: 'var(--color-fixed-light)',
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 15,
}

const FIND_ON: CSSProperties = {
  flex: 'none',
  height: 46,
  padding: '0 34px',
  borderRadius: 4,
  border: 'none',
  background: 'var(--color-xcel-brick-600)',
  color: 'var(--color-fixed-light)',
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 16,
  cursor: 'pointer',
}

/* The disabled look, and no hover class: the press will not be accepted. */
const FIND_OFF: CSSProperties = {
  ...FIND_ON,
  background: 'var(--color-e2e-form-locked)',
  color: 'var(--color-text-secondary)',
  cursor: 'not-allowed',
}
