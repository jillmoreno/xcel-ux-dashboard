import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { E2E_ORIGINAL_PRICE, E2E_PARTNER_NAME, E2E_PARTNER_PRICE, useEndToEndDemoParams } from './endToEndDemo'
import { PARTNER_HEADER_HEIGHT, PartnerHeader } from '@/components/e2e/PartnerHeader'
import { StandaloneBrowserChrome } from '@/components/layout/BrowserChromeBar'
import './inviteFlow.css'

/**
 * TWO-PACKAGE PRODUCT DETAIL — `/end-to-end-demo/two-package` (2026-10-27,
 * Eric's request). A sibling of `InvitedProductDetailPage` (copied, not
 * threaded through it — the original is untouched): the same invited PDP, but
 * offering two packages, Standard and Premier.
 *
 *   - THE PACKAGE CARDS at the top — Figma "Atlas UX Design" 542:2125: two
 *     radio cards, the selected one edged 2px in XCEL brick, Premier carrying
 *     the PASS GUARANTEE badge in its corner. Picking one sets the rail's price
 *     card and the Regulatory course name.
 *   - UNDER EACH CARD, what is different about that package.
 *   - BELOW BOTH, everything the two share: What You'll Learn, What's
 *     Included, How It Works.
 *   - THE RIGHT RAIL, for the shorter, technical details they share: the price
 *     card (the selected package's), the state reporting fee card — Figma
 *     542:2304, set for Florida — then At a Glance, What to Expect and
 *     Regulatory Information.
 *
 * Copy is xcelsolutions.com's: the Standard package's as the original page
 * has it; Premier's from its live page
 * (florida-life-and-health-pre-licensing-premier-611fl040002p00).
 *
 * DEMO DATA, INVENTED: Premier's invited price ($97.50, the Standard invite's
 * same share off — $65 of $199), and the Florida reporting fee ($20, the
 * Figma card's Wisconsin figure). Neither is on the live site.
 */
/* The line widths of a text block, top to bottom. */
function lineWidths(el: HTMLElement): number[] {
  const range = document.createRange()
  range.selectNodeContents(el)
  const rows = new Map<number, { l: number; r: number }>()
  for (const rc of range.getClientRects()) {
    const k = Math.round(rc.top)
    const row = rows.get(k) ?? { l: Infinity, r: 0 }
    row.l = Math.min(row.l, rc.left)
    row.r = Math.max(row.r, rc.right)
    rows.set(k, row)
  }
  return [...rows.entries()].sort((a, b) => a[0] - b[0]).map(([, w]) => w.r - w.l)
}

/**
 * EVEN LINES, LAST NEVER LONGER THAN FIRST (2026-10-15, Eric's request) —
 * `text-wrap: balance` evens lines but can still leave the last one longer.
 * This narrows the block, 4px at a time, while it keeps the same number of
 * lines, and keeps the width whose lines are closest in length with the last
 * no longer than the first. Re-run when the room changes.
 */
function useEvenLines(ref: React.RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const el = ref.current
    const parent = el?.parentElement
    if (!el || !parent) return
    const fit = () => {
      el.style.maxWidth = ''
      const full = el.getBoundingClientRect().width
      const count = lineWidths(el).length
      if (count < 2) return
      let best: { w: number; spread: number } | null = null
      for (let w = Math.floor(full); w > full / 2; w -= 4) {
        el.style.maxWidth = `${w}px`
        const lines = lineWidths(el)
        if (lines.length !== count) break
        if (lines[lines.length - 1] <= lines[0] + 0.5) {
          const spread = Math.max(...lines) - Math.min(...lines)
          if (!best || spread < best.spread) best = { w, spread }
        }
      }
      el.style.maxWidth = best ? `${best.w}px` : ''
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(parent)
    return () => ro.disconnect()
  }, [ref])
}

type PackageId = 'premier' | 'standard'

export function TwoPackageProductDetailPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  useEndToEndDemoParams()
  const [picked, setPicked] = useState<PackageId>('premier')
  const pkg = PACKAGES.find((p) => p.id === picked)!
  const welcomeRef = useRef<HTMLParagraphElement>(null)
  useEvenLines(welcomeRef)
  useEffect(() => {
    const root = document.documentElement
    const before = { palette: root.dataset.atlasPalette, brand: root.dataset.atlasBrand }
    root.dataset.atlasPalette = 'xcel'
    root.dataset.atlasBrand = 'global'
    // The tab's name. A tick later: AccountContext names the tab on mount too,
    // and a parent's effect runs after its child's.
    const titleBefore = document.title
    const titleTimer = window.setTimeout(() => {
      document.title = 'Two-Package Product Detail'
    }, 0)
    return () => {
      window.clearTimeout(titleTimer)
      document.title = titleBefore
      if (before.palette == null) delete root.dataset.atlasPalette
      else root.dataset.atlasPalette = before.palette
      if (before.brand == null) delete root.dataset.atlasBrand
      else root.dataset.atlasBrand = before.brand
    }
  }, [])

  return (
    <div style={PAGE}>
      <StandaloneBrowserChrome />
      <PartnerHeader />
      <section aria-label="Personal welcome" style={WELCOME}>
        <div style={WELCOME_CONTENT}>
          <span aria-hidden style={WELCOME_RULE} />
          <h1 style={WELCOME_TITLE}>You’ve been invited</h1>
          <p ref={welcomeRef} style={WELCOME_BODY}>
            <strong style={{ fontWeight: 800 }}>{E2E_PARTNER_NAME}</strong> has invited
            you to enroll in{' '}
            <strong style={{ fontWeight: 800 }}>Florida Life and Health Pre-licensing</strong>. Choose
            your package below and start learning today!
          </p>
        </div>
      </section>
      <section aria-label="Course" style={COURSE}>
        <div style={COURSE_ROW}>
          <div style={COURSE_TEXT}>
            <h2 style={COURSE_TITLE}>
              Florida Life and Health <span style={{ whiteSpace: 'nowrap' }}>Pre-licensing</span>
            </h2>
          </div>
          <span aria-hidden style={PRICE_SLOT} />
        </div>
      </section>
      <div style={{ position: 'relative' }}>
        <aside aria-label="Purchase" style={RAIL}>
          <div style={RAIL_STICKY}>
            {/* The price card: the selected package's price, and Purchase. */}
            <div style={PRICE_CARD}>
              <p style={PRICE_ROW}>
                <span style={PRICE}>{pkg.price}</span>
                <span style={WAS_PRICE}>
                  <s style={{ textDecoration: 'none' }}>{pkg.was}</s>
                  <img src="/brand/e2e-price-strike.svg" alt="" aria-hidden style={STRIKE} />
                </span>
              </p>
              <button
                type="button"
                className="cre-e2e-add-to-cart cre-e2e-cta"
                style={ADD_TO_CART}
                onClick={() => navigate(`/end-to-end-demo/checkout?${new URLSearchParams({ ...Object.fromEntries(params), package: picked }).toString()}`)}
              >
                Purchase {pkg.short}
              </button>
            </div>
            <div style={SIDE_BOXES}>
              {/* The state reporting fee — Figma 542:2304, for Florida. */}
              <div style={FEE_CARD}>
                <p style={FEE_TITLE}>State reporting fee required</p>
                <p style={FEE_TEXT}>{FL_FEE}</p>
                <button type="button" className="cre-e2e-textlink" style={FEE_LINK}>
                  100% transparent pricing
                </button>
              </div>
              <div style={SIDE_BOX_PAIR}>
                <section style={SIDE_SECTION}>
                  <h2 style={SIDE_TITLE}>At a Glance</h2>
                  <dl style={{ ...SIDE_BODY, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {TRAINING_SPECS.map(([term, value]) => (
                      <div key={term}>
                        <dt style={{ display: 'inline' }}>{term}</dt>{' '}
                        <dd style={{ display: 'inline', margin: 0, fontWeight: 800 }}>{value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
                <hr aria-hidden style={SIDE_RULE} />
                <section style={SIDE_SECTION}>
                  <h2 style={SIDE_TITLE}>What to Expect</h2>
                  <div style={{ ...SIDE_BODY, display: 'flex', flexDirection: 'column', gap: 18 }}>
                    {WHAT_TO_EXPECT.map(([head, line]) => (
                      <div key={head} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <strong style={{ fontWeight: 800 }}>{noWidow(head)}</strong>
                        <span>{noWidow(line)}</span>
                      </div>
                    ))}
                    <button type="button" className="cre-e2e-textlink" style={{ ...LINK, display: 'block', marginTop: -2 }}>
                      Recommended study plan.
                    </button>
                  </div>
                </section>
                <hr aria-hidden style={SIDE_RULE} />
                <section style={SIDE_SECTION}>
                  <h2 style={SIDE_TITLE}>Regulatory Information</h2>
                  <div style={{ ...PARAGRAPHS, gap: 28 }}>
                    <dl style={{ ...SIDE_BODY, display: 'flex', flexDirection: 'column', gap: 18 }}>
                      {[
                        ['Course Provided By:', 'XCEL Solutions LLC.'],
                        ['Course Name:', pkg.courseName],
                        ['Approved course ID:', '1191656'],
                      ].map(([term, value]) => (
                        <div key={term} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <dt>{term}</dt>
                          <dd style={{ margin: 0, fontWeight: 800 }}>{noWidow(value)}</dd>
                        </div>
                      ))}
                    </dl>
                    <p style={SIDE_BODY}>
                      <button type="button" className="cre-e2e-textlink" style={LINK}>
                        {noWidow('Florida Insurance Licensing Requirements')}
                      </button>
                    </p>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </aside>
        <main style={DETAILS}>
          <div style={WIDE_COLUMN}>
            {/* THE PACKAGES — two radio cards (Figma 542:2125), each with what sets it apart underneath. */}
            <section aria-label="Choose a package" style={SECTION}>
              <h2 style={SECTION_TITLE}>Choose Your Package</h2>
              <div role="radiogroup" aria-label="Package" style={PACKAGE_GRID}>
                {PACKAGES.map((p) => {
                  const on = p.id === picked
                  return (
                    <div key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => setPicked(p.id)}
                        style={{ ...OPTION_CARD, ...(on ? OPTION_ON : null) }}
                      >
                        {p.badge ? <span style={OPTION_BADGE}>{p.badge}</span> : null}
                        <span aria-hidden style={{ ...RADIO, ...(on ? RADIO_ON : null) }}>
                          {on ? <span style={RADIO_DOT} /> : null}
                        </span>
                        <span style={OPTION_TITLE}>{p.title}</span>
                        <span style={{ ...PRICE_ROW, justifyContent: 'flex-start' }}>
                          <span style={PRICE}>{p.price}</span>
                          <span style={WAS_PRICE}>
                            <s style={{ textDecoration: 'none' }}>{p.was}</s>
                            <img src="/brand/e2e-price-strike.svg" alt="" aria-hidden style={STRIKE} />
                          </span>
                        </span>
                      </button>
                      {/* What this package does differently. */}
                      <div style={DIFF}>
                        <p style={BODY}>{p.description}</p>
                        <p style={BODY_STRONG}>{p.diffTitle}</p>
                        {p.diffs.map((d) => (
                          <div key={d.title}>
                            <p style={BODY_STRONG}>{d.title}</p>
                            <p style={INCLUDED_ITEM}>
                              <img src="/brand/e2e-check.svg" alt="" width={12} height={10} style={CHECK} />
                              {d.detail}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* EVERYTHING BOTH PACKAGES SHARE. */}
            <div style={SHARED}>
              <p style={SHARED_EYEBROW}>Included in both packages</p>
              <section style={SECTION}>
                <h2 style={SECTION_TITLE}>What You'll Learn</h2>
                <ul style={LEARN_LIST}>
                  {WHAT_YOULL_LEARN.map((topic) => (
                    <li key={topic}>{topic}</li>
                  ))}
                </ul>
              </section>
              <section style={SECTION}>
                <h2 style={SECTION_TITLE}>What's Included</h2>
                <div style={INCLUDED}>
                  <p style={BODY_STRONG}>XCEL’s Proven 3-Part Training Program:</p>
                  {INCLUDED_ITEMS.map((item) => (
                    <div key={item.title}>
                      <p style={BODY_STRONG}>{item.title}</p>
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
                    <p key={step.label} style={BODY}>
                      <strong style={{ fontWeight: 800 }}>{step.label}</strong> {step.body}
                    </p>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
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

/* The two packages. Standard's copy is the original page's (the live Standard
   product page); Premier's is its live page's, 2026-10-27. */
const PACKAGES: {
  id: PackageId
  short: string
  title: string
  courseName: string
  price: string
  was: string
  badge?: string
  description: string
  diffTitle: string
  diffs: { title: string; detail: string }[]
}[] = [
  {
    id: 'premier',
    short: 'Premier',
    title: 'Premier Florida Life and Health Pre-licensing Package',
    courseName: 'Florida Life and Health Pre-licensing Premier',
    price: '$97.50', // DEMO DATA — see the header
    was: '$299.00',
    badge: 'Pass Guarantee',
    description:
      'Our Premier package adds flashcards, a recorded review class, and our Pass Guarantee to the standard package and is ideal for those looking to maximize their studying with various learning formats.',
    diffTitle: 'Everything in Standard, plus:',
    diffs: [
      {
        title: 'Recorded Livestream Exam Review - Life and Health English',
        detail: 'Play, pause, fast-forward, and rewind a recorded version of our 1-day Exam Review class.',
      },
      { title: 'Flashcards - Life, Health, and Accident Insurance', detail: '800+ flashcards to test & reinforce your knowledge of fundamentals.' },
      { title: 'Pass Guarantee', detail: 'Our Pass Guarantee comes with the Premier package.' },
    ],
  },
  {
    id: 'standard',
    short: 'Standard',
    title: 'Standard Florida Life and Health Pre-licensing Package',
    courseName: 'Florida Life and Health Pre-licensing',
    price: E2E_PARTNER_PRICE,
    was: E2E_ORIGINAL_PRICE,
    description:
      'Our standard Life & Health Pre-licensing course provides a solid foundation to help you prepare to pass your Life & Health licensing exam without all of the extras. This package is ideal for those who are self-motivated and will prioritize learning on their own.',
    diffTitle: 'The essentials:',
    diffs: [
      {
        title: 'XCEL’s proven 3-part training program',
        detail: 'With an AI-powered study partner that helps you learn, practice, and prepare for your exam with confidence in as little as 2 weeks.',
      },
    ],
  },
]

/* Florida's reporting fee — DEMO DATA, see the header. */
const FL_FEE = 'FL fee due at checkout: $20'

/* The design's columns, at its widths (each column's left edge to the next). */
const FOOTER_COLUMNS: { title: string; width: number | string; links: string[] }[] = [
  { title: 'Training', width: 246.27, links: ['Get License', 'Continuing Education', 'Study Tools & Reviews', 'Securities Courses'] },
  { title: 'Resources', width: 214.14, links: ['Resource Center', 'State Requirements', 'Salary Guide'] },
  { title: 'Company', width: 214.14, links: ['About XCEL', 'Careers', 'Why Choose XCEL', 'Become a Partner'] },
  { title: 'Support', width: 'auto', links: ['Customer Support', 'Contact Us'] },
]

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
  // The Premier extras — Recorded Livestream Exam Review and Flashcards — went
  // with the live product page, the standard package (2026-10-15).
]

/* The live product page's What You'll Learn (2026-10-15). */
const WHAT_YOULL_LEARN = [
  'Basic principles of insurance',
  'Health insurance providers',
  'Life insurance and annuity policy types',
  'Types of health and accident insurance',
  'Life and health insurance policy provisions, options, and riders',
  'Retirement and Social Security concepts',
  'Insurance premiums, beneficiaries, and underwriting',
  'Laws and rules related to life and health Insurance',
]

/* Each step's number and label (in Heavy), then its copy — trimmed about a
   third (2026-10-15, Eric's request) with every fact kept: the three parts,
   Rubi™, what unlocks what, the 70 / 80 / 85% marks, the 24-hour revisit. */
const HOW_IT_WORKS: { label: string; body: string }[] = [
  {
    label: 'Step 1 – Complete the Pre-Licensing Course:',
    body: 'A solid foundation for your exam that satisfies any state pre-licensing education requirement — keywords, streamlined content, short intro/summary videos, review notes and chapter exams. Rubi™, our AI-powered study partner, explains concepts, creates extra practice and answers course questions instantly. Aim for 70% or better on course exams.',
  },
  {
    label: 'Step 2 – Take the Prep Review Course:',
    body: 'Finishing Part 1 unlocks the Prep Review Course (Part 2) and Exam Simulator (Part 3), the sections students value most. The Prep Review focuses on the most important material, weighted to match the state exam. Aim for 80% or better on chapter exams. With Premier, now is a good time for the Livestream Exam Review and Flashcards.',
  },
  {
    label: 'Step 3 – Finish with the Exam Simulators:',
    body: 'Three simulators, each weighted by topic to match the state exam, with unlimited retakes; each unlocks when you complete the one before. Aim for 85% or better, and revisit them at least 24 hours before your state exam to keep the material fresh.',
  },
  {
    label: 'Step 4 – Pass Your Exam!',
    body: 'Complete all three parts and you will have learned everything you need to pass on your first attempt.',
  },
]


const PAGE: CSSProperties = {
  minHeight: '100vh',
  background: 'var(--color-fixed-light)',
}

/* The personal welcome: a Secondary 200 band, 40 above and below, 240 in from
   each side, its copy behind a 6px brick rule. */
const WELCOME: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  // 48 top, 40 bottom (2026-10-15, Eric's requests: 40 / 32, then 8 more
  // on each).
  padding: '48px 240px 40px',
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
  // The 6 rule, then 24 to the copy (2026-10-15, Eric's request; the
  // design's 22).
  paddingLeft: 30,
}

const WELCOME_RULE: CSSProperties = {
  position: 'absolute',
  left: 0,
  // Centred on the copy's ink, not its line boxes (2026-10-15, Eric's
  // requests): the title's letters start 2 below the box and the last line's
  // baseline sits 8 above it, so the rule moves up 3 — about 5 of rule beyond
  // the letters at each end, its length unchanged.
  top: -3,
  bottom: 3,
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
  // Lines of about equal length, never a long last line under a short first
  // (2026-10-15, Eric's request) — `useEvenLines` sets the width.
}

/* The band's padding, the price card's height and where Purchase's middle
   sits in it — shared by the band and the price cards' drop. */

const BAND_PAD = 26
const PRICE_CARD_H = 171
const PURCHASE_MIDDLE = 24 + 53 + 14 + 55 / 2 // the card's top padding, price row, gap, half the button

/* The course header: the dark band, 26 above and below (2026-10-14, Eric's
   request; the design had 40 below), 240 in each side. */
const COURSE: CSSProperties = {
  // 6 moved from below to above (2026-10-15, Eric's request): Rockwell's
  // capitals sit high in their line, so equal padding left the title's ink
  // high in the band. This centres the capitals.
  // 10 more top and bottom (same day, Eric's requests: 20, then back 10):
  // the band is 110.
  padding: `${BAND_PAD + 6 + 10}px 240px ${BAND_PAD - 6 + 10}px`,
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

/* The rest of the row, so the short title sits on one line — the band 80
   shorter (2026-10-15, Eric's request; the design's 498, its breadcrumb's
   width, wrapped it to two). */
const COURSE_TEXT: CSSProperties = {
  flex: '1 1 0',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  // 31 — one off the design's 32, so the band is exactly 80 shorter.
  gap: 31,
}



const COURSE_TITLE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-serif)',
  fontWeight: 700,
  fontSize: 30,
  lineHeight: '38px',
  color: 'var(--color-fixed-light)',
}

/* The price card's empty slot in the band, at its size. */
// No height: the band sets its own, 80 shorter (2026-10-15, Eric's request).
const PRICE_SLOT: CSSProperties = { width: 350, flex: 'none' }

/* THE RIGHT RAIL: 240 in from the right, beside the details, from Purchase's
   middle above the band's bottom edge (so that middle sits ON the edge) down
   to the details' end. */
const RAIL: CSSProperties = {
  position: 'absolute',
  top: -PURCHASE_MIDDLE,
  // The rail stops 40 above the footer (2026-10-15, Eric's request).
  bottom: 40,
  right: 240,
  width: 350,
  zIndex: 1,
}

/* What rides it: sticks 24 below the pinned partner header (2026-10-15,
   Eric's requests: 40, then 60 from the window's top, before the header was
   pinned over it). */
const RAIL_STICKY: CSSProperties = {
  position: 'sticky',
  top: PARTNER_HEADER_HEIGHT + 24,
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
}

/* 350 × 171, 1px #DDD, 10 radius: the price row 24 down, then Purchase 25 in
   from each side, 25 above the bottom. */
const PRICE_CARD: CSSProperties = {
  boxSizing: 'border-box',
  height: PRICE_CARD_H,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  gap: 14,
  padding: '24px 25px 25px',
  borderRadius: 10,
  border: '1px solid var(--color-e2e-card-outline)',
  background: 'var(--color-fixed-light)',
  // The live home page's partner-code box shadow (2026-10-15, Eric's request).
  boxShadow: 'var(--shadow-e2e-partner-code)',
}

const PRICE_ROW: CSSProperties = {
  margin: 0,
  height: 53,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 14.324,
}

const PRICE: CSSProperties = {
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 28.649,
  lineHeight: '37.243px',
  color: 'var(--color-text-primary)',
}

/* The was-price in Gray/400, struck by the brick line, tilted as drawn. */
const WAS_PRICE: CSSProperties = {
  position: 'relative',
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 25.784,
  lineHeight: '34.378px',
  color: 'var(--color-e2e-was-price)',
}

const STRIKE: CSSProperties = {
  position: 'absolute',
  left: -3,
  top: '50%',
  width: 98,
  height: 2.15,
  transform: 'translateY(-50%) rotate(-6.71deg)',
}


/* Under the price card, 24 down, 24 apart: the side boxes. */
/* No widowed words (2026-10-15, Eric's request): the last two words are
   joined by a no-break space, so a wrap always carries two words down. */
function noWidow(text: string): string {
  const i = text.lastIndexOf(' ')
  return i > 0 && text.indexOf(' ') !== i ? `${text.slice(0, i)}\u00a0${text.slice(i + 1)}` : text
}

/* At a Glance (was Training Specs) — the course facts, label then value. */
const TRAINING_SPECS: [string, string][] = [
  ['Format:', 'Online Self-Paced'],
  ['Education Type:', 'Pre-licensing Education'],
  ['Line of Authority:', 'Life and Health'],
  ['Language:', 'English'],
  ['Credit Hours:', '60'],
]

/* What to Expect, as three points (Figma 432:3165). */
const WHAT_TO_EXPECT: [string, string][] = [
  ['Online and Self-paced', "Study when and where you'd like."],
  ['Computer, Tablet, Smartphone', 'All you need is a device with internet access.'],
  ['Pass in 2 weeks or less!', 'Our 3-part training program will prepare you to pass fast!'],
]

const SIDE_BOXES: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
}

/* What to Expect and Regulatory Information: the price card's 10 corners, no
   stroke, Secondary 100 (the Invited banner's 200 at first), 32 in; titles
   18 / 22, copy 16 / 22. */
const SIDE_BOX: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  // 18 below the header: 10, then 8 more (2026-10-15, Eric).
  gap: 18,
  // 32 in (2026-10-15, Eric's requests: 24, then 8 more).
  padding: 32,
  borderRadius: 10,
  // Secondary 100, a level lighter than the banner's 200 (2026-10-15, Eric).
  background: 'var(--color-secondary-100)',
}

/* The state fee: 140 tall; title, fee, link. */
const FEE_CARD: CSSProperties = {
  boxSizing: 'border-box',
  height: 140,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 10,
  padding: '18px 25px 0',
  borderRadius: 10,
  border: '1px solid var(--color-e2e-card-outline)',
  background: 'var(--color-fixed-light)',
}

const FEE_TITLE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-serif)',
  fontWeight: 700,
  fontSize: 20,
  lineHeight: '27px',
  color: 'var(--color-text-primary)',
}

const FEE_TEXT: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 18,
  lineHeight: '27px',
  color: 'var(--color-text-primary)',
}

const FEE_LINK: CSSProperties = {
  marginTop: 5,
  padding: 0,
  border: 'none',
  background: 'none',
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 500,
  fontSize: 18,
  lineHeight: '27px',

  textDecoration: 'underline',
  cursor: 'pointer',
}

const ADD_TO_CART: CSSProperties = {
  height: 55,
  borderRadius: 5,
  /* ⚠ THE CLASS OWNS THIS — an inline fill would outrank the stylesheet
     and the hover would never fire. See `inviteFlow.css`. */
  borderWidth: 1,
  borderStyle: 'solid',
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 500,
  fontSize: 18,
  lineHeight: '24.59px',
  cursor: 'pointer',
}

/* The course details: 40 below the band, 240 in, a 640 column. Sections 40
   apart, each title 15 above its copy, paragraphs 20 apart (the design's). */
const DETAILS: CSSProperties = { padding: '40px 240px' }


const SECTION: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 15 }

const SECTION_TITLE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-serif)',
  fontWeight: 700,
  fontSize: 28,
  lineHeight: '36px',
  color: 'var(--color-text-primary)',
}

/* The side boxes' titles: the section serif at 18 / 22 (2026-10-15, Eric:
   14, 16, then 18). */
/* A box's contents without the box — the two in SIDE_BOX_PAIR. */
const SIDE_SECTION: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 18 }

/* The shared frame: 32 either side of the rule, as at its edges. */
const SIDE_BOX_PAIR: CSSProperties = { ...SIDE_BOX, gap: 32 }

const SIDE_RULE: CSSProperties = {
  margin: 0,
  height: 1,
  border: 'none',
  // Secondary 300 (2026-10-15, Eric; first 200).
  background: 'var(--color-secondary-300)',
}


// 20 on 24 (2026-10-15, Eric's request: 2 up from 18/22).
const SIDE_TITLE: CSSProperties = { ...SECTION_TITLE, fontSize: 20, lineHeight: '24px' }


const BODY: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 18,
  lineHeight: '27px',
  color: 'var(--color-text-primary)',
  // No one-word last lines in running copy (2026-10-15, Eric's request).
  textWrap: 'pretty',
}

/* The side boxes' copy: 16 / 22 (2026-10-15, Eric's requests). */
// 15 on 21 in every rail box (2026-10-15, Eric's request; was 16/22).
const SIDE_BODY: CSSProperties = { ...BODY, fontSize: 15, lineHeight: '21px' }

const BODY_STRONG: CSSProperties = { ...BODY, fontWeight: 900 }

/* What You'll Learn: a plain disc list in the body type. */
const LEARN_LIST: CSSProperties = {
  ...BODY,
  margin: 0,
  paddingLeft: 22,
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  listStyle: 'disc',
}

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
  // Left-aligned when it wraps (a button centres its lines by default).
  textAlign: 'left',
  border: 'none',
  background: 'none',
  font: 'inherit',
  fontWeight: 500,

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

/* THE PACKAGE CARDS AND THE SHARED SECTIONS (2026-10-27). */

/* The main column beside the rail: everything left of its 350 and an 80 gap. */
const WIDE_COLUMN: CSSProperties = { width: 'calc(100% - 350px - 80px)', display: 'flex', flexDirection: 'column', gap: 56 }

/* Two cards side by side, wrapping to one column when narrow. */
const PACKAGE_GRID: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32, alignItems: 'start' }

/* Figma 542:2142 (at rest) / 542:2126 (selected): 28 in, 20 between, 10 corners. */
const OPTION_CARD: CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 20,
  padding: 28,
  textAlign: 'left',
  borderRadius: 10,
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: 'var(--color-e2e-card-outline)',
  background: 'var(--color-fixed-light)',
  cursor: 'pointer',
  font: 'inherit',
}
/* Selected: 2px brick, the padding 1 less so nothing moves. */
const OPTION_ON: CSSProperties = { borderWidth: 2, borderColor: 'var(--color-xcel-brick)', padding: 27 }

const OPTION_BADGE: CSSProperties = {
  position: 'absolute',
  top: 0,
  right: 0,
  padding: '10px 16px',
  background: 'var(--color-xcel-brick)',
  color: 'var(--color-fixed-light)',
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 13,
  lineHeight: '16px',
  textTransform: 'uppercase',
}

const RADIO: CSSProperties = {
  boxSizing: 'border-box',
  width: 24,
  height: 24,
  flex: 'none',
  borderRadius: '50%',
  border: '1px solid var(--color-e2e-card-outline)',
  display: 'grid',
  placeItems: 'center',
}
const RADIO_ON: CSSProperties = { border: '2px solid var(--color-xcel-brick)' }
const RADIO_DOT: CSSProperties = { width: 12, height: 12, borderRadius: '50%', background: 'var(--color-xcel-brick)' }

const OPTION_TITLE: CSSProperties = { ...SECTION_TITLE, fontSize: 30, lineHeight: '38px' }

/* Under each card: its description, then what sets it apart. */
const DIFF: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 15 }

/* The shared sections, in a Secondary 100 band of their own. */
const SHARED: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 40, padding: 40, borderRadius: 10, background: 'var(--color-secondary-100)' }

const SHARED_EYEBROW: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 14,
  lineHeight: '18px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--color-xcel-brick)',
}
