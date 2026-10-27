import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { E2E_ORIGINAL_PRICE, E2E_PARTNER_NAME, E2E_PARTNER_PRICE, useEndToEndDemoParams } from './endToEndDemo'
import { PARTNER_HEADER_HEIGHT, PartnerHeader } from '@/components/e2e/PartnerHeader'
import { RubiMark, RubiWordmark } from '@/icons'
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
  /* Where the cards end inside the packages ground — the ground's tint fades out there (PACKAGE_GRID). */
  const groundRef = useRef<HTMLDivElement>(null)
  const [cardsBottom, setCardsBottom] = useState(0)
  useLayoutEffect(() => {
    const ground = groundRef.current
    const card = ground?.querySelector<HTMLElement>('[role=radio]')
    if (!ground || !card) return
    const fit = () => setCardsBottom(card.getBoundingClientRect().bottom - ground.getBoundingClientRect().top)
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(card)
    ro.observe(ground)
    return () => ro.disconnect()
  }, [])
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
          {/* 8 nearer its copy than the original PDP's 4 gap (2026-10-27, Eric): the gap's 4, less 8. */}
          <h1 style={{ ...WELCOME_TITLE, marginBottom: -8 }}>You’ve been invited</h1>
          <p ref={welcomeRef} style={WELCOME_BODY}>
            <strong style={{ fontWeight: 800 }}>{E2E_PARTNER_NAME}</strong> has invited
            you to enroll in{' '}
            <strong style={{ fontWeight: 800 }}>Florida Life and Health Pre-licensing</strong>. Choose
            your package below and start learning today!
          </p>
        </div>
      </section>
      {/* THE COURSE HEADER — Figma 544:2970 (2026-10-27), in place of the dark band: the title in brick, a line on the packages,
          then a rule. */}
      {/* The rail's frame starts above the course header now, so the rail can start level with its title (2026-10-27, Eric). */}
      <div style={{ position: 'relative' }}>
      <section aria-label="Course" style={COURSE_HEAD}>
        {/* As wide as the details' left column below — the rail and its gutter kept clear (2026-10-27, Eric). */}
        <div style={{ width: `calc(100% - ${RAIL_W}px - ${RAIL_GUTTER}px)`, display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* 2 between the title and its intro (the design's 10, 8 less — 2026-10-27, Eric). */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <h2 style={COURSE_HEAD_TITLE}>
            Florida Life and Health <span style={{ whiteSpace: 'nowrap' }}>Pre-licensing</span> Package
          </h2>
          <p style={BODY}>
            Our pre-licensing packages are updated annually and designed with a simplified approach to help you understand and
            retain complex insurance concepts and terms. <strong style={{ fontWeight: 800 }}>Learn faster and retain more</strong> with
            our interactive lessons plans and quizzes.{' '}
            <strong style={{ fontWeight: 800 }}>Pass the Florida state licensing exam the first time.</strong>
          </p>
        </div>
        </div>
      </section>
        <aside aria-label="Purchase" style={RAIL}>
          <div style={RAIL_STICKY}>
            <div style={SIDE_BOXES}>
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
                <hr aria-hidden style={SIDE_RULE} />
                {/* The state reporting fee — Figma 542:2304, for Florida — the box's last section, under a rule, set as the others
                    (2026-10-27, Eric). */}
                <section style={SIDE_SECTION}>
                  <h2 style={SIDE_TITLE}>State reporting fee required</h2>
                  <div style={{ ...SIDE_BODY, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <p style={{ margin: 0 }}>{FL_FEE}</p>
                    <button type="button" className="cre-e2e-textlink" style={{ ...LINK, display: 'block' }}>
                      100% transparent pricing
                    </button>
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
              {/* In the rail's At a Glance style — the slab serif at 20 / 24 (2026-10-27, Eric). */}
              <h2 style={SIDE_TITLE}>Select your package:</h2>
              {/* The ground starts in the selected column's tint and fades to its own Secondary 100 by the cards' bottom
                  (2026-10-27, Eric). */}
              <div
                ref={groundRef}
                role="radiogroup"
                aria-label="Package"
                style={{
                  ...PACKAGE_GRID,
                  background: `linear-gradient(to bottom, var(--color-secondary-200) 0, var(--color-secondary-100) ${cardsBottom || 300}px)`,
                }}
              >
                {PACKAGES.map((p) => {
                  const on = p.id === picked
                  return (
                    <div key={p.id} style={PACKAGE_PANEL}>
                      {/* Figma 544:3250: the card, its details under it, on the shared ground. */}
                      {/* A div with the radio role, not a button: it holds a real button (Purchase), and buttons cannot nest. */}
                      <div
                        role="radio"
                        tabIndex={0}
                        aria-checked={on}
                        onClick={() => setPicked(p.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            setPicked(p.id)
                          }
                        }}
                        style={{ ...OPTION_CARD, ...(on ? OPTION_ON : null) }}
                      >
                        {/* The strip along the top: the badge in the corner (Premier), the radio 10 in from the right. */}
                        <span style={OPTION_TOP}>
                          {p.badge ? <span style={OPTION_BADGE}>{p.badge}</span> : null}
                          <span aria-hidden style={{ ...RADIO, ...(on ? RADIO_ON : null) }}>
                            {on ? <span style={RADIO_DOT} /> : null}
                          </span>
                        </span>
                        <span style={OPTION_BODY}>
                          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                            <span style={SHARED_EYEBROW}>{p.short}</span>
                            <span style={OPTION_TITLE}>{p.title}</span>
                          </span>
                          <span style={OPTION_PRICE_ROW}>
                            <span style={OPTION_PRICE}>{p.price}</span>
                            <span style={OPTION_WAS}>
                              <s style={{ textDecoration: 'none' }}>{p.was}</s>
                              <img src="/brand/e2e-price-strike.svg" alt="" aria-hidden style={OPTION_STRIKE} />
                            </span>
                          </span>
                          {/* Each card's own Purchase, under its price (2026-10-27, Eric; was the rail's price card). Premier's is always the brick
                              one and Standard's always outlined, whichever card is selected — Premier stays the strongest call. Buying
                              either package picks it first. */}
                          <button
                            type="button"
                            className={`cre-e2e-add-to-cart ${p.id === 'premier' ? 'cre-e2e-cta' : 'cre-e2e-outline'}`}
                            style={{ ...ADD_TO_CART, height: 39, alignSelf: 'stretch', paddingTop: 2, paddingBottom: 0 }} // label 1 lower: a button centres its content box, so 2 on top shifts it 1 // 16 shorter than the rail's 55 (2026-10-27, Eric)
                            onClick={(e) => {
                              e.stopPropagation()
                              setPicked(p.id)
                              navigate(`/end-to-end-demo/checkout?${new URLSearchParams({ ...Object.fromEntries(params), package: p.id }).toString()}`)
                            }}
                          >
                            Purchase {p.short}
                          </button>
                        </span>
                      </div>
                    </div>
                  )
                })}
                {/* THE COMPARISON GRID (2026-10-27, Eric's CoWork content) — under both cards, across the ground: each feature, then a
                    120-wide check column per package. Replaces the per-package lists. */}
                <table style={COMPARE}>
                  {/* In 'Select your package:''s style, 8 in like the column text below it (2026-10-27, Eric). */}
                  <caption style={{ ...SIDE_TITLE, textAlign: 'left', paddingBottom: 20 }}>Compare Florida Life &amp; Health Pre-licensing Packages:</caption>
                  <thead>
                    <tr>
                      <th scope="col" style={{ ...COMPARE_HEAD, paddingLeft: 0 }}>Feature</th>
                      {/* Each package's header picks it — its column tints and its card selects (2026-10-27, Eric). */}
                      {PACKAGES.map((p) => (
                        <th key={p.id} scope="col" style={{ ...COMPARE_HEAD, ...COMPARE_MARK, ...(picked === p.id ? COMPARE_PICKED : null) }}>
                          <button type="button" aria-pressed={picked === p.id} onClick={() => setPicked(p.id)} style={COMPARE_PICK}>
                            {p.short}
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON.map((row, r) => (
                      <tr key={r}>
                        {/* No rule under the last row (2026-10-27, Eric). */}
                        {/* With Standard picked, the features it does not include fade back 40% (2026-10-27, Eric: 30, then 10 more). */}
                        <th
                          scope="row"
                          style={{
                            ...COMPARE_FEATURE,
                            paddingLeft: 0,
                            ...(r === COMPARISON.length - 1 ? { borderBottom: 'none' } : null),
                            ...(picked === 'standard' && !row.standard ? { color: 'color-mix(in srgb, var(--color-text-primary) 60%, transparent)' } : null),
                          }}
                        >
                          <strong style={{ fontWeight: 800 }}>{row.feature}</strong>
                          {row.detail ? <>: {row.detail}</> : null}
                        </th>
                        {[row.standard, row.premier].map((has, i) => (
                          <td key={i} style={{ ...COMPARE_CELL, ...COMPARE_MARK, ...(picked === (i === 0 ? 'standard' : 'premier') ? COMPARE_PICKED : null), ...(r === COMPARISON.length - 1 ? { borderBottom: 'none' } : null), color: has ? 'var(--color-xcel-brick)' : 'var(--color-neutral-500)' }}>
                            <span aria-hidden>{has ? '✓' : '—'}</span>
                            <span className="cre-visually-hidden">{has ? 'Included' : 'Not included'}</span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* EVERYTHING BOTH PACKAGES SHARE. */}
            <div style={SHARED}>
              <section style={SECTION}>
                <h2 style={SECTION_TITLE}>What You'll Learn</h2>
                <ul style={LEARN_LIST}>
                  {WHAT_YOULL_LEARN.map((topic) => (
                    <li key={topic}>{topic}</li>
                  ))}
                </ul>
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

/* The two packages, Standard on the left (2026-10-27). Standard's copy is the original page's (the live Standard
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
    id: 'standard',
    short: 'Standard',
    title: 'Florida Life and Health Pre-licensing Package',
    courseName: 'Florida Life and Health Pre-licensing',
    price: E2E_PARTNER_PRICE,
    was: E2E_ORIGINAL_PRICE,
    description:
      'Our standard Life & Health Pre-licensing course provides a solid foundation to help you prepare to pass your Life & Health licensing exam without all of the extras. This package is ideal for those who are self-motivated and will prioritize learning on their own.',
    diffTitle: 'Standard includes:',
    diffs: [
      {
        title: 'XCEL’s proven 3-part training program',
        detail: 'With an AI-powered study partner that helps you learn, practice, and prepare for your exam with confidence in as little as 2 weeks.',
      },
    ],
  },  {
    id: 'premier',
    short: 'Premier',
    title: 'Florida Life and Health Pre-licensing Package',
    courseName: 'Florida Life and Health Pre-licensing Premier',
    price: '$97.50', // DEMO DATA — see the header
    was: '$299.00',
    badge: 'Pass Guarantee',
    description:
      'Our Premier package adds flashcards, a recorded review class, and our Pass Guarantee to the standard package and is ideal for those looking to maximize their studying with various learning formats.',
    diffTitle: 'Everything in Standard plus:',
    diffs: [
      {
        title: 'Recorded Livestream Exam Review - Life and Health English',
        detail: 'Play, pause, fast-forward, and rewind a recorded version of our 1-day Exam Review class.',
      },
      { title: 'Flashcards - Life, Health, and Accident Insurance', detail: '800+ flashcards to test & reinforce your knowledge of fundamentals.' },
      { title: 'Pass Guarantee', detail: 'Our Pass Guarantee comes with the Premier package.' },
    ],
  }
]

/* The comparison grid — Eric's CoWork table, 2026-10-27, verbatim. */
const COMPARISON: { feature: ReactNode; detail?: ReactNode; standard: boolean; premier: boolean }[] = [
  // First row: Standard's lead item, moved up from its list (2026-10-27, Eric).
  {
    feature: 'XCEL’s proven 3-part training program',
    detail: 'Pre-Licensing Course, Prep Review Course, Exam Simulators',
    standard: true,
    premier: true,
  },
  { feature: 'Pre-licensing Course', detail: 'Online, self-paced fundamentals course that meets all state requirements', standard: true, premier: true },
  { feature: 'Prep Review Course', detail: 'Condensed review of key material, weighted to the state exam outline', standard: true, premier: true },
  { feature: 'Exam Simulators', detail: '3 simulators weighted by topic, unlimited retakes', standard: true, premier: true },
  {
    feature: 'Extended Access',
    detail: '30 days for the Pre-licensing Course, then 30 days for the Prep Review Course and simulators',
    standard: true,
    premier: true,
  },
  {
    // The Rubi mark and wordmark in place of 'Rubi™', at the text's 15 (2026-10-27, Eric); the label keeps the name for screen readers.
    feature: (
      <span role="img" aria-label="Rubi™ AI Study Partner" style={{ whiteSpace: 'nowrap' }}>
        {/* The wordmark at the capitals' height (11 at 15px Avenir) on the baseline, 6 after it; the mark 2 larger (13), centred on
            the wordmark (1 below its baseline), 4 before it. */}
        <RubiMark width={12} height={13} aria-hidden style={{ verticalAlign: '-1px', marginRight: 4 }} />
        <RubiWordmark height={11} width={30} aria-hidden style={{ verticalAlign: '0px', marginRight: 6 }} />
        <span aria-hidden>AI Study Partner</span>
      </span>
    ),
    detail: 'Built-in AI tutor with real-time guidance and answers', standard: true, premier: true },
  {
    feature: 'Recorded Livestream Exam Review (Life and Health, English)',
    detail: 'Recording of a one-day exam review class with playback controls',
    standard: false,
    premier: true,
  },
  { feature: 'Flashcards (Life, Health, and Accident Insurance)', detail: '800+ cards covering fundamentals', standard: false, premier: true },
  { feature: 'Pass Guarantee (Prepared to Pass Promise)', standard: false, premier: true },
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
  // 24 top, 16 bottom on this page (2026-10-27, Eric's requests: 32 / 32, then 8 and 16 less; the original PDP's 48 / 40).
  padding: '24px 240px 16px',
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

/* The course header's top padding — also where the rail starts. */
const COURSE_HEAD_TOP = 56 // 16 more below the welcome band (2026-10-27, Eric; was 40)

/* The course header (Figma 544:2970): 40 down (the design's 32, 8 more — 2026-10-27, Eric), 240 in, 24 to the rule. */
const COURSE_HEAD: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 24, padding: `${COURSE_HEAD_TOP}px 240px 0` }

/* Roboto Slab Bold 45 / 55 in the design — the page's slab serif token (Rockwell, then Roboto Slab) — in XCEL brick. */
const COURSE_HEAD_TITLE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-serif)',
  fontWeight: 700,
  fontSize: 45,
  lineHeight: '55px',
  color: 'var(--color-xcel-brick)',
}


/* The rail and the gutter beside it (2026-10-27, Eric: the left column 42 wider and the gutter 48 — the gutter's 32 back
   plus 10 off the rail; were 350 and 80). */
const RAIL_W = 340
const RAIL_GUTTER = 48

/* The details' top padding: 24 on this page (2026-10-27, Eric; the original's 40). */
const DETAILS_TOP = 24

/* THE RIGHT RAIL: 240 in from the right, beside the details, from their first line down
   to the details' end. */
const RAIL: CSSProperties = {
  position: 'absolute',
  // Level with the course title's top (2026-10-27, Eric): COURSE_HEAD's 40 top padding. Only where the rail starts —
  // RAIL_STICKY still pins it as before.
  top: COURSE_HEAD_TOP,
  // The rail stops 40 above the footer (2026-10-15, Eric's request).
  bottom: 40,
  right: 240,
  width: RAIL_W,
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

/* The rail's boxes, 24 apart (the price card moved into the package cards, 2026-10-27). */
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
// 24 above on this page (2026-10-27, Eric; the original's 40), 40 below.
const DETAILS: CSSProperties = { padding: `${DETAILS_TOP}px 240px 40px` }


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
// White with the state fee card's 1px #DDD edge (2026-10-27, Eric; was Secondary 100).
// No edge now (2026-10-27, Eric).
// …and no top or bottom padding (2026-10-27, Eric); 32 at the sides still.
const SIDE_BOX_PAIR: CSSProperties = { ...SIDE_BOX, gap: 32, background: 'var(--color-fixed-light)', padding: '0 32px' }

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
// 40 between the packages and the shared frame (2026-10-27, Eric; was 56).
const WIDE_COLUMN: CSSProperties = { width: `calc(100% - ${RAIL_W}px - ${RAIL_GUTTER}px)`, display: 'flex', flexDirection: 'column', gap: 0 } // no gap under the packages (2026-10-27, Eric); the details' own 40 padding is the space now

/* Two cards side by side, wrapping to one column when narrow. */
/* Figma 544:3250: both packages on one Secondary 100 ground, 32 in, 10 corners, the columns 40 apart. */
const PACKAGE_GRID: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  // The two cards side by side, the comparison table under them across both columns.
  columnGap: 32, // 8 less between the cards (2026-10-27, Eric; was 40)
  rowGap: 32,
  alignItems: 'start',
  padding: '32px 32px 32px', // 24 below the grid, then 8 back (2026-10-27, Eric)
  borderRadius: 10,
  background: 'var(--color-secondary-100)',
}

/* A card on the shared ground. */
const PACKAGE_PANEL: CSSProperties = { display: 'flex', flexDirection: 'column', minWidth: 0 }

/* Figma 542:2930: a 10-cornered card, its edge drawn inset (1px #DDD at rest, 2px brick selected) so selecting moves nothing and
   the corner badge sits flush on the edge. The strip along the top, then the body 28 in. */
const OPTION_CARD: CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  padding: 0,
  textAlign: 'left',
  border: 'none',
  borderRadius: 10,
  boxShadow: 'inset 0 0 0 1px var(--color-e2e-card-outline)',
  background: 'var(--color-fixed-light)',
  cursor: 'pointer',
  font: 'inherit',
}
const OPTION_ON: CSSProperties = { boxShadow: 'inset 0 0 0 2px var(--color-xcel-brick)' }

/* The top strip: the badge's 34 tall even where there is no badge, so both cards' bodies start level. */
const OPTION_TOP: CSSProperties = { display: 'flex', alignItems: 'flex-end', gap: 10, minHeight: 34 }

/* PASS GUARANTEE: brick, the card's own corner top left and a 10 corner bottom right. */
const OPTION_BADGE: CSSProperties = {
  height: 34,
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  padding: '10px 16px 8px',
  borderRadius: '10px 0 10px 0',
  background: 'var(--color-xcel-brick)',
  color: 'var(--color-fixed-light)',
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 13,
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
}

const RADIO: CSSProperties = {
  boxSizing: 'border-box',
  width: 24,
  height: 24,
  flex: 'none',
  marginLeft: 'auto',
  marginRight: 10,
  borderRadius: '50%',
  border: '1px solid var(--color-e2e-card-outline)',
  display: 'grid',
  placeItems: 'center',
}
const RADIO_ON: CSSProperties = { border: '2px solid var(--color-xcel-brick)' }
const RADIO_DOT: CSSProperties = { width: 12, height: 12, borderRadius: '50%', background: 'var(--color-xcel-brick)' }

// 4 less above the package name (2026-10-27, Eric; was 28 all round).
const OPTION_BODY: CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 20, padding: '24px 28px 28px' }

const OPTION_TITLE: CSSProperties = {
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 24,
  lineHeight: '34px',
  color: 'var(--color-text-primary)',
}

const OPTION_PRICE_ROW: CSSProperties = { display: 'flex', alignItems: 'center', gap: 16 }
/* Avenir Book. */
const OPTION_PRICE: CSSProperties = { fontFamily: 'var(--font-e2e-avenir)', fontWeight: 400, fontSize: 28, lineHeight: '32px', color: 'var(--color-text-primary)' }
const OPTION_WAS: CSSProperties = { position: 'relative', fontFamily: 'var(--font-e2e-avenir)', fontWeight: 400, fontSize: 18, lineHeight: '32px', color: 'var(--color-neutral-500)' }
/* The brick strike, 68 long at -7.43°. */
const OPTION_STRIKE: CSSProperties = { position: 'absolute', left: -2, top: '50%', width: 68, height: 2.15, transform: 'translateY(-50%) rotate(-7.43deg)' }

/* Under each card: its description, then what sets it apart. */

/* The shared sections in a frame: no fill, the resting package card's 1px #DDD edge (2026-10-27, Eric; was a Secondary 100 band). */
// No edge now either (2026-10-27, Eric).
const SHARED: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 40, padding: 40, borderRadius: 10 }

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

/* THE COMPARISON TABLE: across the ground under the cards, the feature column taking what the two 120 mark columns leave. */
// 8 in on each side, so its rules run only as wide as the text (2026-10-27, Eric); the cells' outer padding is taken off to match.
const COMPARE: CSSProperties = { gridColumn: '1 / -1', width: 'calc(100% - 16px)', margin: '0 8px', borderCollapse: 'collapse', tableLayout: 'fixed' }
const COMPARE_HEAD: CSSProperties = {
  ...SHARED_EYEBROW,
  color: 'var(--color-text-secondary)',
  fontSize: 12,
  textAlign: 'left',
  // A rule above as well as below, 10 clear of each (2026-10-27, Eric). Longhands, so the Feature column's paddingLeft: 0 holds —
  // React drops a longhand mixed with the `padding` shorthand.
  paddingTop: 10,
  paddingBottom: 10,
  paddingLeft: 8,
  paddingRight: 8,
  borderTop: '1px solid var(--color-secondary-300)',
  borderBottom: '1px solid var(--color-secondary-300)',
}
const COMPARE_MARK: CSSProperties = { width: 120, textAlign: 'center' }
/* The selected package's column, header included: a step darker than the ground's Secondary 100 (2026-10-27, Eric). */
const COMPARE_PICKED: CSSProperties = { background: 'var(--color-secondary-200)' }
/* The header's pick button: the header's own type, no chrome. */
const COMPARE_PICK: CSSProperties = { padding: 0, border: 'none', background: 'none', font: 'inherit', letterSpacing: 'inherit', textTransform: 'inherit', color: 'inherit', cursor: 'pointer' }
const COMPARE_FEATURE: CSSProperties = {
  ...SIDE_BODY,
  fontWeight: 400,
  textAlign: 'left',
  verticalAlign: 'top',
  // 4 shorter rows, then 1 back on top (2026-10-27, Eric; was 12). Longhands, so the outer columns' paddingLeft / paddingRight: 0 hold.
  paddingTop: 11,
  paddingBottom: 10,
  paddingLeft: 8,
  paddingRight: 8,
  borderBottom: '1px solid var(--color-secondary-300)',
}
const COMPARE_CELL: CSSProperties = {
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 18,
  lineHeight: '21px',
  verticalAlign: 'middle', // centred in the row, however many lines its feature runs to (2026-10-27, Eric)
  // 4 shorter rows, then 1 back on top (2026-10-27, Eric; was 12). Longhands, so the outer columns' paddingLeft / paddingRight: 0 hold.
  paddingTop: 11,
  paddingBottom: 10,
  paddingLeft: 8,
  paddingRight: 8,
  borderBottom: '1px solid var(--color-secondary-300)',
}
