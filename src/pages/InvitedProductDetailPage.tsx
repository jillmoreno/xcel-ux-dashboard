import { useEffect, type CSSProperties } from 'react'

/**
 * INVITED PRODUCT DETAIL — `/end-to-end-demo` (2026-10-14, Eric's request;
 * named that day) — the blank page the
 * End-to-End Demo opens on, before the dashboard
 * (`/dashboard-rebrand?version=eric-atlas-e2e`). Outside the app shell, so the
 * only chrome is the partner header, Figma "Atlas UX Design" 420:2023.
 *
 * DEMO DATA: the partner name is the design's own.
 *
 * The design's own fonts and colours throughout (Eric's request): Inter,
 * Rockwell (for the design's Amasis MT) and Avenir, #E6E6E6 / #D1D1D1 — the `--font-e2e-*` and
 * `--color-e2e-*` tokens (tokens.css says which of the faces can load where).
 * The logo is the repo's copy of the design's artwork.
 *
 * Under it, the personal welcome (Figma 420:2029). Its fill is the Atlas
 * guide's Secondary 200, which the tokens give only under the Atlas palette —
 * so this page puts the palette on <html> as the dashboard's shell does
 * (`data-atlas-palette` / `data-atlas-brand`), and takes it off on leaving.
 * Under that, the course header (Figma 420:2080): breadcrumb, title, and the
 * price card with Add to Cart (not wired yet). Then the course details, Figma
 * 420:2099 — a 640 column 240 in, its copy verbatim from the design; the two
 * links are not wired either. Last, the footer, Figma 420:2176 — its links are
 * the design's labels, not wired.
 *
 * The #9A1B1E rule is `--color-xcel-brick`, since the Atlas skins turn the
 * CTA brick navy.
 */
export function InvitedProductDetailPage() {
  useEffect(() => {
    const root = document.documentElement
    const before = { palette: root.dataset.atlasPalette, brand: root.dataset.atlasBrand }
    root.dataset.atlasPalette = 'xcel'
    root.dataset.atlasBrand = 'global'
    // The tab's name. A tick later: AccountContext names the tab on mount too,
    // and a parent's effect runs after its child's.
    const titleBefore = document.title
    const titleTimer = window.setTimeout(() => {
      document.title = 'Invited Product Detail'
    }, 0)
    // Inter, the header's face — the only one of the design's three on Google
    // Fonts.
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = INTER_HREF
    document.head.appendChild(link)
    return () => {
      window.clearTimeout(titleTimer)
      document.title = titleBefore
      link.remove()
      if (before.palette == null) delete root.dataset.atlasPalette
      else root.dataset.atlasPalette = before.palette
      if (before.brand == null) delete root.dataset.atlasBrand
      else root.dataset.atlasBrand = before.brand
    }
  }, [])

  return (
    <div style={PAGE}>
      <header style={HEADER}>
        <p style={TEXT}>Pristine Solutions Financial Services Group LLC</p>
        <span aria-hidden style={DIVIDER} />
        <p style={TEXT}>Official Partner of</p>
        <img src="/brand/xcel-logo.webp" alt="XCEL Insurance Training by Colibri" style={LOGO} />
      </header>
      <section aria-label="Personal welcome" style={WELCOME}>
        <div style={WELCOME_CONTENT}>
          {/* The brick rule, its ends rounded (2026-10-14, Eric's request) —
              a bar rather than a border, which cannot round its own ends. */}
          <span aria-hidden style={WELCOME_RULE} />
          <h1 style={WELCOME_TITLE}>You’ve been invited</h1>
          <p style={WELCOME_BODY}>
            <strong style={{ fontWeight: 800 }}>Pristine Solutions Financial Services Group LLC</strong> has invited
            you to enroll in the{' '}
            <strong style={{ fontWeight: 800 }}>Florida Life and Health Pre-licensing Premier Package</strong>. Review
            the details below and start learning today!
          </p>
        </div>
      </section>
      <section aria-label="Course" style={COURSE}>
        <div style={COURSE_ROW}>
          <div style={COURSE_TEXT}>
            <nav aria-label="Breadcrumb">
              <ol style={CRUMBS}>
                <li>Florida</li>
                <li aria-hidden style={CRUMB_SLASH}>/</li>
                <li>Get License</li>
                <li aria-hidden style={CRUMB_SLASH}>/</li>
                <li aria-current="page" style={{ fontWeight: 800 }}>
                  Florida Life and Health Pre-licensing Premier
                </li>
              </ol>
            </nav>
            {/* "Pre-licensing" kept whole, so the line breaks before "Premier"
                as the design's does, not at the hyphen. */}
            <h2 style={COURSE_TITLE}>
              Florida Life and Health <span style={{ whiteSpace: 'nowrap' }}>Pre-licensing</span> Premier
            </h2>
          </div>
          <div style={PRICE_CARD}>
            <p style={PRICE}>$299.00</p>
            <button type="button" className="cre-e2e-add-to-cart" style={ADD_TO_CART}>
              Add to Cart
            </button>
          </div>
        </div>
      </section>
      <main style={DETAILS}>
        <div style={DETAILS_COLUMN}>
          <div style={FACTS}>
            <dl style={FACT_LIST}>
              <Fact term="Format" value="Online Self-Paced" />
              <Fact term="Education Type" value="Pre-licensing Education" />
              <Fact term="Line of Authority" value="Life and Health" />
            </dl>
            <dl style={FACT_LIST}>
              <Fact term="Language" value="English" />
              <Fact term="Credit Hours" value="60" />
            </dl>
          </div>

          <section style={SECTION}>
            <h2 style={SECTION_TITLE}>Description</h2>
            <p style={BODY}>
              Our Premier package adds flashcards, a recorded review class, and our Pass Guarantee to the standard
              package and is ideal for those looking to maximize their studying with various learning formats.
            </p>
          </section>

          <section style={SECTION}>
            <h2 style={SECTION_TITLE}>What's Included</h2>
            <div style={INCLUDED}>
              <p style={BODY_STRONG}>XCEL’s Proven 3-Part Training Program:</p>
              {INCLUDED_ITEMS.map((item) => (
                <div key={item.title}>
                  <p style={item.link ? { ...BODY_STRONG, color: 'var(--color-e2e-link)' } : BODY_STRONG}>{item.title}</p>
                  <p style={INCLUDED_ITEM}>
                    <img src="/brand/e2e-check.svg" alt="" width={12} height={10} style={CHECK} />
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section style={SECTION}>
            <h2 style={SECTION_TITLE}>How It Works</h2>
            <div style={PARAGRAPHS}>
              {HOW_IT_WORKS.map((step) => (
                <p key={step} style={BODY}>
                  {step}
                </p>
              ))}
            </div>
          </section>

          <section style={SECTION}>
            <h2 style={SECTION_TITLE}>What to Expect</h2>
            <p style={BODY}>
              This online self-paced course allows you to study independently, whenever it is convenient for you. All
              you need is a device (computer, tablet, or smartphone) with internet access. Our 3-Part Training Program
              prepares you to pass the insurance exam in less than 2 weeks!{' '}
              <button type="button" style={LINK}>
                Read our recommended study plan.
              </button>
            </p>
          </section>

          <section style={SECTION}>
            <h2 style={SECTION_TITLE}>Regulatory Information</h2>
            <div style={PARAGRAPHS}>
              <p style={BODY}>
                <button type="button" style={LINK}>
                  View your state's insurance licensing requirements
                </button>
              </p>
              <p style={BODY}>
                Course Provided By: XCEL Solutions LLC.
                <br />
                Course Name: Florida Life and Health Pre-licensing Premier
                <br />
                Approved course ID:1191656
              </p>
            </div>
          </section>
        </div>
      </main>
      <footer style={FOOTER}>
        <div style={FOOTER_MAIN}>
          <div style={FOOTER_BRAND}>
            <img src="/brand/xcel-logo.webp" alt="XCEL Insurance Training by Colibri" style={FOOTER_LOGO} />
            <ul style={SOCIAL}>
              <li>
                <img src="/brand/e2e-linkedin.svg" alt="XCEL on LinkedIn" width={24} height={24} style={{ display: 'block' }} />
              </li>
              <li>
                <img src="/brand/e2e-facebook.svg" alt="XCEL on Facebook" width={24} height={24} style={{ display: 'block' }} />
              </li>
            </ul>
          </div>
          {FOOTER_COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title} style={{ ...FOOTER_COLUMN, width: col.width }}>
              <p style={FOOTER_HEADING}>{col.title}</p>
              <ul style={FOOTER_LINKS}>
                {col.links.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div style={LEGAL_BAR}>
          <ul style={LEGAL_LINKS}>
            <li style={{ color: 'color-mix(in srgb, var(--color-fixed-light) 70%, transparent)' }}>© 2026 XCEL Solutions</li>
            {['Terms of Service', 'Privacy Policy', 'Refund Policy', 'Cookie Policy', 'Manage Cookies'].map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </div>
      </footer>
    </div>
  )
}

/* The design's columns, at its widths (each column's left edge to the next). */
const FOOTER_COLUMNS: { title: string; width: number | string; links: string[] }[] = [
  { title: 'Training', width: 246.27, links: ['Get License', 'Continuing Education', 'Study Tools & Reviews', 'Securities Courses'] },
  { title: 'Resources', width: 214.14, links: ['Resource Center', 'State Requirements', 'Salary Guide'] },
  { title: 'Company', width: 214.14, links: ['About XCEL', 'Careers', 'Why Choose XCEL', 'Become a Partner'] },
  { title: 'Support', width: 'auto', links: ['Customer Support', 'Contact Us'] },
]

function Fact({ term, value }: { term: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      <dt style={{ fontWeight: 900 }}>{term}:</dt>
      <dd style={{ margin: 0 }}>{value}</dd>
    </div>
  )
}

/* The design's copy, verbatim. */
const INCLUDED_ITEMS: { title: string; detail: string; link?: boolean }[] = [
  { title: 'Pre-licensing Course', detail: 'Online self-study course providing fundamentals and satisfies any state requirements.' },
  {
    title: 'Prep Review Course',
    detail: 'Scaled down content focusing on the most important material weighted to match your state exam outline.',
  },
  {
    title: 'Exam Simulator',
    detail: 'The three exam simulators with unlimited retakes are weighted by topic to match the state exam.',
  },
  {
    title: 'Extended Access',
    detail: '30-day access to the Pre-licensing course & then 30 days for the prep review course & exam simulators.',
  },
  {
    title: 'AI-Powered Study Partner, Rubi™',
    detail:
      'Study smarter with an AI-powered tutor built into your course that delivers real-time guidance, instant answers, and personalized support every step of the way.',
  },
  {
    title: 'Recorded Livestream Exam Review - Life and Health English',
    detail: 'Play, pause, fast-forward, and rewind a recorded version of our 1-day Exam Review class.',
  },
  // In the design's link blue, alone of the seven.
  {
    title: 'Flashcards - Life, Health, and Accident Insurance',
    detail: '800+ flashcards to test & reinforce your knowledge of fundamentals.',
    link: true,
  },
]

const HOW_IT_WORKS = [
  'Step 1 - Complete the Pre-Licensing Course: The pre-licensing course provides a solid foundation for preparing to pass your exam and satisfies any state pre-licensing education requirements. It contains keywords, streamlined content, bite-size intro/summary videos, review notes, and chapter exams. Along the way, you can use Rubi™, our AI-powered study partner, to better understand concepts, generate additional practice opportunities, and get instant answers to course-related questions. We recommend obtaining a 70% or better on course exams.',
  'Step 2 - Take the Prep Review Course: Upon completion of Part 1, you gain access to the Prep Review Course (Part 2) and Exam Simulator (Part 3) – the sections we hear students value the most. XCEL’s Prep Review Course scales down content to focus solely on the most important material with weighted sections identical to the state exam. We recommend obtaining an 80% or better on the chapter exams. Now is a good time to take advantage of your Livestream Exam Review Class and Flashcards.',
  'Step 3- Finish with the Exam Simulators: There are three exam simulators. Each simulator is weighted by topic to match the state exam, allows for unlimited retakes, and can only be unlocked by completing the previous exam. We recommend obtaining an 85% or better on the exams. Revisit the simulators at least 24 hours before your state exam to keep the information in the front of your mind.',
  'Step 4 - Pass Your Exam! After successfully completing the 3-part training program in its entirety, you will have learned all the material needed to pass your exam on the first attempt.',
]

const INTER_HREF = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap'

const PAGE: CSSProperties = {
  minHeight: '100vh',
  background: 'var(--color-fixed-light)',
}

/* 64 tall: 8 above and below the 48 logo (2026-10-14, Eric's request: 24
   less than the design's 88, which had 20). The 1px outline is inset, as
   Figma draws its stroke inside the frame, so it adds no height. */
const HEADER: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 16,
  padding: '8px 40px',
  background: 'var(--color-fixed-light)',
  boxShadow: 'inset 0 0 0 1px var(--color-e2e-partner-outline)',
}

const TEXT: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-inter)',
  fontWeight: 700,
  fontSize: 13,
  lineHeight: 'normal',
  color: 'var(--color-neutral-950)',
  whiteSpace: 'nowrap',
}

const DIVIDER: CSSProperties = {
  width: 1,
  height: 36,
  flex: 'none',
  background: 'var(--color-e2e-partner-divider)',
}

const LOGO: CSSProperties = {
  display: 'block',
  width: 115,
  height: 48,
  flex: 'none',
  objectFit: 'contain',
}

/* The personal welcome: a Secondary 200 band, 40 above and below, 240 in from
   each side, its copy behind a 6px brick rule. */
const WELCOME: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '40px 240px',
  background: 'var(--color-secondary-200)',
}

const WELCOME_CONTENT: CSSProperties = {
  flex: '1 0 0',
  minWidth: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  // 4 between the title and its copy (2026-10-14, Eric's request; the
  // design's 12).
  gap: 4,
  position: 'relative',
  // The 6 rule, then 22 to the copy.
  paddingLeft: 28,
}

const WELCOME_RULE: CSSProperties = {
  position: 'absolute',
  left: 0,
  top: 0,
  bottom: 0,
  width: 6,
  borderRadius: 3,
  background: 'var(--color-xcel-brick)',
}

const WELCOME_TITLE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-serif)',
  fontWeight: 700,
  fontSize: 30,
  lineHeight: '38px',
  color: 'var(--color-text-primary)',
}

const WELCOME_BODY: CSSProperties = {
  margin: 0,
  // Avenir Roman, its bold runs Heavy (800).
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 18,
  lineHeight: 1.5,
  color: 'var(--color-neutral-950)',
}

/* The course header: the dark band, 26 above and below (2026-10-14, Eric's
   request; the design had 40 below), 240 in each side. */
const COURSE: CSSProperties = {
  padding: '26px 240px',
  background: 'var(--color-e2e-course-band)',
}

/* The price card pushed right, its edge on the welcome copy's above — both
   end 240 in (2026-10-14, Eric's request). 80 stays the least gap. */
const COURSE_ROW: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 80,
}

/* The design's 498 — its breadcrumb's width — so the title wraps there
   ("…Pre-licensing" / "Premier"). */
const COURSE_TEXT: CSSProperties = {
  width: 498,
  flex: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: 32,
}

const CRUMBS: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  gap: 4,
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 500,
  fontSize: 16,
  lineHeight: '22px',
  color: 'var(--color-fixed-light)',
  whiteSpace: 'nowrap',
}

const CRUMB_SLASH: CSSProperties = { fontWeight: 400 }

const COURSE_TITLE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-serif)',
  fontWeight: 700,
  fontSize: 30,
  lineHeight: '38px',
  color: 'var(--color-fixed-light)',
}

/* 350 wide, 1px #DDD, 10 radius: the price, then Add to Cart 25 in from
   each side. */
const PRICE_CARD: CSSProperties = {
  width: 350,
  flex: 'none',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  gap: 10,
  padding: '25px 25px 27px',
  borderRadius: 10,
  border: '1px solid var(--color-e2e-card-outline)',
  background: 'var(--color-fixed-light)',
}

const PRICE: CSSProperties = {
  margin: 0,
  textAlign: 'center',
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 500,
  fontSize: 20,
  lineHeight: '26px',
  color: 'var(--color-e2e-course-band)',
}

const ADD_TO_CART: CSSProperties = {
  height: 54.59,
  borderRadius: 5,
  border: '1px solid var(--color-xcel-brick)',
  background: 'var(--color-xcel-brick)',
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 500,
  fontSize: 18,
  lineHeight: '24.59px',
  color: 'var(--color-fixed-light)',
  cursor: 'pointer',
}

/* The course details: 40 below the band, 240 in, a 640 column. Sections 40
   apart, each title 15 above its copy, paragraphs 20 apart (the design's). */
const DETAILS: CSSProperties = { padding: '40px 240px' }

const DETAILS_COLUMN: CSSProperties = {
  width: 640,
  maxWidth: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: 40,
}

/* Two lists, the second 390 in, rows 10 apart; 30 above the #DDD rule. */
const FACTS: CSSProperties = {
  display: 'flex',
  paddingBottom: 30,
  borderBottom: '1px solid var(--color-e2e-card-outline)',
}

const FACT_LIST: CSSProperties = {
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  minWidth: 390,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 18,
  lineHeight: '27px',
  color: 'var(--color-text-primary)',
}

const SECTION: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 15 }

const SECTION_TITLE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-serif)',
  fontWeight: 700,
  fontSize: 28,
  lineHeight: '36px',
  color: 'var(--color-text-primary)',
}

const BODY: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 18,
  lineHeight: '27px',
  color: 'var(--color-text-primary)',
}

const BODY_STRONG: CSSProperties = { ...BODY, fontWeight: 900 }

const PARAGRAPHS: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 20 }

/* Each heading, 3 to its checked line, 15 to the next heading; the intro
   line 20 above the first. */
const INCLUDED: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 15 }

const INCLUDED_ITEM: CSSProperties = {
  ...BODY,
  position: 'relative',
  marginTop: 3,
  paddingLeft: 23,
  color: 'var(--color-text-secondary)',
}

const CHECK: CSSProperties = { position: 'absolute', left: 0, top: 8, display: 'block' }

const LINK: CSSProperties = {
  padding: 0,
  border: 'none',
  background: 'none',
  font: 'inherit',
  fontWeight: 500,
  color: 'var(--color-e2e-link)',
  textDecoration: 'underline',
  textDecorationThickness: 1,
  cursor: 'pointer',
}

/* The footer: a 2px #666 rule on top; 40 above the logo and the column
   headings, 240 in each side; the legal bar 284 down. */
const FOOTER: CSSProperties = {
  borderTop: '2px solid var(--color-e2e-footer-rule)',
  background: 'var(--color-fixed-light)',
}

const FOOTER_MAIN: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  height: 284,
  boxSizing: 'border-box',
  padding: '40px 240px 0',
}

/* The logo's 214 plus the 140 to the first column. */
const FOOTER_BRAND: CSSProperties = {
  width: 354.14,
  flex: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
}

const FOOTER_LOGO: CSSProperties = { display: 'block', width: 214.14, height: 78.57, objectFit: 'contain' }

const SOCIAL: CSSProperties = { listStyle: 'none', margin: 0, padding: 0, display: 'flex', gap: 15 }

const FOOTER_COLUMN: CSSProperties = {
  flex: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: 21,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 18,
  lineHeight: '27px',
  color: 'var(--color-text-primary)',
}

const FOOTER_HEADING: CSSProperties = { margin: 0, fontWeight: 800, textTransform: 'uppercase' }

const FOOTER_LINKS: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  whiteSpace: 'nowrap',
}

/* 61 tall in the link blue; the row 20 down and 184 in, items 50 apart. */
const LEGAL_BAR: CSSProperties = {
  height: 61,
  boxSizing: 'border-box',
  padding: '20px 184px 0',
  background: 'var(--color-e2e-footer-bar)',
}

const LEGAL_LINKS: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  gap: 50,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 14,
  lineHeight: '21px',
  color: 'var(--color-fixed-light)',
  whiteSpace: 'nowrap',
}
