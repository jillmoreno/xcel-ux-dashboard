import { Fragment, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { E2E_ORIGINAL_PRICE, E2E_PARTNER_NAME, E2E_PARTNER_PRICE, useEndToEndDemoParams } from './endToEndDemo'
import { PARTNER_HEADER_HEIGHT, PartnerHeader } from '@/components/e2e/PartnerHeader'
import { AngleDownSolid, AngleRightSolid, BallotCheckLight, ChartLineUpLight, FaceGrinLight, FileCertificateLight, RubiMark, RubiWordmark } from '@/icons'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
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
 * no longer than the first. Re-run when the room changes, and when the copy
 * does (`content`) — a longer state or line can wrap a sentence that fitted,
 * and a width kept from the longer copy would hold the shorter one at two lines.
 */
function useEvenLines(ref: React.RefObject<HTMLElement | null>, content = '') {
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
  }, [ref, content])
}

type PackageId = 'premier' | 'standard'

export function TwoPackageProductDetailPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  useEndToEndDemoParams()
  const [chosen, setPicked] = useState<PackageId>('premier')
  /* The design bar's Products (2026-10-28, Eric): the multi-product page, or the single-product one — Premier alone, its card
     the only one and the comparison its own list. Single always has Premier picked, whatever was picked before the switch. */
  const single = useFeatureFlag('pdp-products').variant === 'single'
  const picked: PackageId = single ? 'premier' : chosen
  const packages = single ? PACKAGES.filter((p) => p.id === 'premier') : PACKAGES
  /* Change state or line: the selector slid open under the heading (2026-10-28, Eric). Nothing opens it now (2026-10-29, Eric: the link
     no longer does), so it stays shut; the panel is kept for when something does. */
  const changeOpen = false
  /* The state and line of authority the page is written for — the selector's two choices (2026-10-28, Eric). Every "Florida" and
     "Life and Health" on the page follows them; `localize` rewrites the data's own copies (titles, the course name, the specs). */
  const [place, setPlace] = useState('Florida')
  const [line, setLine] = useState('Life and Health')
  const localize = (text: string) => text.replaceAll('Florida', place).replaceAll('Life and Health', line)
  /* THE CARDS PIN (2026-10-27, Eric): 40 under the top of the browser, for the rest of the page. The packages ground is three
     stacked pieces — heading, cards, comparison — so the cards can be a direct child of the long column and stay stuck past
     the ground's end. The ground's fade runs over the heading and the cards, so both are measured (offsetHeight ignores the
     pin). Once pinned, a tan backdrop covers from the browser's top to under the cards, so what scrolls up
     disappears there rather than showing beneath them. */
  const headRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)
  const trayRef = useRef<HTMLDivElement>(null)
  const footRef = useRef<HTMLDivElement>(null)
  const [browserTop, setBrowserTop] = useState(0)
  /* The design bar's Course Cards (2026-10-28, Eric; was the on/off Compact cards): Large condense as they pin; Compact are the
     compact layout on the page too; the Top Mini Card Tray leaves the cards on the page, full size and unpinned, and slides a
     full-width tray down from the top of the browser once they have scrolled off. (A Top Compact Card Tray — the compact
     cards in it — was taken out the same day, Eric.) */
  const cardsMode = useFeatureFlag('pdp-course-cards').variant ?? 'large'
  // The Top Mini Card Tray draws the page's cards compact too (2026-10-28, Eric), and so does No Card Trays, the default
  // (2026-10-29, Eric) — only Large Cards draws them large.
  const compact = cardsMode === 'compact' || cardsMode === 'tray-mini' || cardsMode === 'tray-mini-bottom' || cardsMode === 'none'
  const topTray = cardsMode === 'tray-mini'
  /* The Bottom Mini Card Tray (2026-10-29, Eric): the same tray, pinned to the bottom of the browser and sliding up from it. */
  const bottomTray = cardsMode === 'tray-mini-bottom'
  const miniTray = topTray || bottomTray
  /* No Card Trays (2026-10-28, Eric): nothing pins and nothing slides down — the full cards scroll away with the page. */
  const unpinned = miniTray || cardsMode === 'none'
  const [trayShown, setTrayShown] = useState(false)
  useLayoutEffect(() => {
    const head = headRef.current
    const cards = cardsRef.current
    if (!head || !cards) return
    // The demo stage's browser chrome is sticky over the page; the "top of the browser" is its bottom edge.
    const chrome = document.querySelector<HTMLElement>('.cre-browser-chrome')
    const browserTop = () => (chrome ? (parseFloat(getComputedStyle(chrome).top) || 0) + chrome.offsetHeight : 0)
    const fit = () => {
      setBrowserTop(browserTop())
    }
    /* THE CONDENSE (2026-10-27, Eric — Figma 548:3477): from the moment the cards pin, the next PIN_CONDENSE px of scroll
       shrink them into the compact layout, scroll-linked, so scrolling back up grows them again. Written straight onto CSS
       variables, not React state, so a scroll re-renders nothing: --p is the progress; --px eases out (the Purchase button
       slides across beside the price first) and --py eases in (then rises into the price's row); --price-w is each card's
       price width, which the button clears. */
    const check = () => {
      // The Top tray: the cards stay on the page, and the tray shows once the last of them is up past the browser's top.
      if (miniTray) setTrayShown(cards.getBoundingClientRect().bottom < browserTop())
      else setTrayShown(false)
      const over = unpinned ? -1 : browserTop() + CARDS_PIN_GAP - head.getBoundingClientRect().bottom
      const p = Math.min(1, Math.max(0, over / PIN_CONDENSE))
      cards.style.setProperty('--pinned', over > 0.5 ? '1' : '0')
      cards.style.setProperty('--p', String(p))
      // The cards' own progress — --p, or 1 throughout when Compact cards is on; the frame round them always follows --p.
      const c = compact ? 1 : p
      cards.style.setProperty('--cp', String(c))
      cards.style.setProperty('--px', String(1 - (1 - c) ** 2))
      cards.style.setProperty('--py', String(c ** 2))
      /* Once the comparison's piece of the ground has scrolled up past the tray's bottom edge, its tan fades out over the next
         FOOT_FADE px of scroll, so none shows through the tray's feathered edges over the white page (2026-10-28, Eric; it went
         at once at first). */
      const tray = trayRef.current
      const foot = footRef.current
      if (unpinned) foot?.style.removeProperty('--foot-fill')
      else if (tray && foot) {
        const past = tray.getBoundingClientRect().bottom - foot.getBoundingClientRect().bottom
        const gone = Math.min(1, Math.max(0, past / FOOT_FADE))
        const left = 1 - gone
        // The tray's side feathering waits for the same moment and comes in over the same scroll (2026-10-28, Eric): against
        // the tan ground beside it a soft side edge only read as a seam.
        cards.style.setProperty('--tray-side-feather', `${(gone * TRAY_FEATHER).toFixed(1)}px`)
        if (left < 1) foot.style.setProperty('--foot-fill', `color-mix(in srgb, var(--color-secondary-100) ${Math.round(left * 100)}%, transparent)`)
        else foot.style.removeProperty('--foot-fill')
      }
      cards.querySelectorAll<HTMLElement>('[data-price-row]').forEach((row) => {
        row.parentElement?.style.setProperty('--price-w', `${row.offsetWidth}px`)
      })
    }
    fit()
    check()
    const ro = new ResizeObserver(() => {
      fit()
      check()
    })
    ro.observe(head)
    ro.observe(cards)
    window.addEventListener('scroll', check, { capture: true, passive: true })
    return () => {
      ro.disconnect()
      window.removeEventListener('scroll', check, { capture: true })
    }
  }, [compact, miniTray, unpinned])
  const pkg = PACKAGES.find((p) => p.id === picked)!
  const welcomeRef = useRef<HTMLParagraphElement>(null)
  /* THE RAIL STARTS LEVEL WITH THE INTRO under the course title (2026-10-29, Eric; was level with the title): the title's height is
     measured, since a long state or line wraps it to a third line. */
  const courseTitleRef = useRef<HTMLHeadingElement>(null)
  const [railTop, setRailTop] = useState(COURSE_HEAD_TOP)
  useLayoutEffect(() => {
    const title = courseTitleRef.current
    if (!title) return
    const fit = () => setRailTop(COURSE_HEAD_TOP + title.offsetHeight + COURSE_TITLE_GAP)
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(title)
    return () => ro.disconnect()
  }, [])
  useEvenLines(welcomeRef, `${place} ${line}`)
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

  /* Purchase: picks the package, then on to the checkout. */
  const purchase = (id: PackageId) => {
    setPicked(id)
    navigate(`/end-to-end-demo/checkout?${new URLSearchParams({ ...Object.fromEntries(params), package: id }).toString()}`)
  }
  /* One package card. */
  const renderCard = (p: (typeof PACKAGES)[number]) => {
    /* No card is picked by clicking any more (2026-10-29, Eric): the selected look is a hover, so `on` is false and the resting look
       is every card's; the Purchase buttons keep hovers of their own. */
    const on = false
    const prices = (
      <span data-price-row style={OPTION_PRICE_ROW}>
        <span style={OPTION_PRICE}>{p.price}</span>
        <span style={OPTION_WAS}>
          <s style={{ textDecoration: 'none' }}>{p.was}</s>
          <img src="/brand/e2e-price-strike.svg" alt="" aria-hidden style={OPTION_STRIKE} />
        </span>
      </span>
    )
    /* Each card's own Purchase, under its price (2026-10-27, Eric; was the rail's price card). Premier's is always the brick one and
       Standard's always outlined, whichever card is selected — Premier stays the strongest call. Buying either package picks it
       first. */
    const buy = (style: CSSProperties) => (
      <button
        type="button"
        className={`cre-e2e-add-to-cart ${p.id === 'premier' ? 'cre-e2e-cta' : `cre-e2e-outline${on ? '' : ' cre-e2e-outline--quiet'}`}`}
        style={{ ...style, ...(p.id === 'premier' ? SOLID_BUY_WEIGHT : null) }}
        onClick={(e) => {
          e.stopPropagation()
          purchase(p.id)
        }}
      >
        Purchase {p.short}
      </button>
    )
    // Not clickable now — a hover lifts it (cre-e2e-package-card, inviteFlow.css: the selected ring and shadow).
    return (
      <div className="cre-e2e-package-card" style={OPTION_CARD}>
        {/* THE TAB (2026-10-28, Eric; was the eyebrow over the title and PASS GUARANTEE top right): the mini tray's, top left —
            the package's name on tan, behind Premier's brick PASS GUARANTEE. */}
        {/* Gone from the multi-product page's cards (2026-10-29, Eric) — their titles name the package now; the single card keeps it. */}
        {single ? (
          <span style={{ ...MINI_TAB, alignSelf: 'flex-start' }}>
            {p.badge ? <span style={MINI_BADGE}>{p.badge}</span> : null}
            <span style={{ ...MINI_TAB_LABEL, ...(p.badge ? { paddingLeft: 0 } : null) }}>{p.short} package</span>
          </span>
        ) : null}
        {single ? (
          /* THE SINGLE-PRODUCT CARD (2026-10-28, Eric): laid out across, like the mini tray's — the title on the left, the price
             over its Purchase on the right — in the page card's own sizes and spacing, the card the column's width. */
          <span style={SINGLE_BODY}>
            <span style={SINGLE_TITLE}>{`${place} ${localize(p.title)}`}</span>
            <span style={SINGLE_BUY_COLUMN}>
              {prices}
              {buy(SINGLE_BUY)}
            </span>
          </span>
        ) : (
          <span style={{ ...OPTION_BODY, paddingTop: 24, paddingBottom: pinLerp(28, 24), alignItems: 'center', textAlign: 'center' }}>
            {/* Centred (2026-10-29, Eric). */}
            {/* 24 from the card's top, with no tab above it now (2026-10-29, Eric; 20 under the tab). */}
            {/* A card's own title where it has one — Standard's is "Standard Course" (2026-10-29, Eric). */}
            <span style={OPTION_TITLE}>{p.cardTitle ?? `${place} ${localize(p.title)}`}</span>
            {prices}
            {/* The price stacked over its Purchase, the button across the card in the flow (2026-10-29, Eric; it slid beside the
                price as the cards condensed). */}
            {buy(STACKED_BUY)}
          </span>
        )}
        {/* The card's 1 edge drawn again over everything, so its top runs across the tab (2026-10-28, Eric). */}
        <span aria-hidden style={MINI_EDGE} />
      </div>
    )
  }

  const miniCards = packages.map((p) => (
    <MiniCard key={p.id} p={p} on={p.id === picked} title={`${place} ${localize(p.title)}`} onPick={() => setPicked(p.id)} onBuy={() => purchase(p.id)} />
  ))

  return (
    <div style={PAGE}>
      <StandaloneBrowserChrome />
      {/* THE TOP MINI CARD TRAY (2026-10-28, Eric): full width, sliding down from the top of the browser once the cards on the page have
          scrolled off it, and back up when they return. A zero-height sticky row holds a clip the tray slides out of, so it is
          hidden above the browser's top rather than drawn over the chrome. */}
      {topTray ? (
        <div style={{ ...TOP_TRAY_PIN, top: browserTop }}>
          <div style={TOP_TRAY_CLIP}>
            <div
              role="radiogroup"
              aria-label="Choose your package"
              aria-hidden={!trayShown}
              inert={!trayShown}
              style={{ ...TOP_TRAY, transform: trayShown ? 'none' : 'translateY(-100%)' }}
            >
              {miniCards}
            </div>
          </div>
        </div>
      ) : null}
      <PartnerHeader />
      <section aria-label="Personal welcome" style={WELCOME}>
        <div style={WELCOME_CONTENT}>
          <span aria-hidden style={WELCOME_RULE} />
          {/* 8 nearer its copy than the original PDP's 4 gap (2026-10-27, Eric): the gap's 4, less 8. */}
          <h1 style={{ ...WELCOME_TITLE, marginBottom: -8 }}>You’ve been invited</h1>
          {/* The sentence, and on its baseline at the band's right edge — the rail's right edge — the link, in place of "Choose your
              package below and start learning today!" (2026-10-29, Eric). The page's standard link type with an angle-right; it no
              longer opens the on-page selector. Avenir set here — out of a paragraph, it had inherited the page's default face. */}
          <div style={{ alignSelf: 'stretch', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 24 }}>
            <p ref={welcomeRef} style={WELCOME_BODY}>
              <strong style={{ fontWeight: 800 }}>{E2E_PARTNER_NAME}</strong> has invited
              you to enroll in{' '}
              <strong style={{ fontWeight: 800 }}>
                {place} {line} Pre-licensing
              </strong>
              .
            </p>
            <button type="button" className="cre-e2e-textlink cre-e2e-textlink--brick" style={{ ...PLAIN_LINK, flex: 'none', fontFamily: 'var(--font-e2e-avenir)' }}>
              Change state/line of authority
              <AngleRightSolid size={15} aria-hidden style={LINK_CHEVRON} />
            </button>
          </div>
        </div>
      </section>
      {/* THE COURSE HEADER — Figma 544:2970 (2026-10-27), in place of the dark band: the title in brick, a line on the packages,
          then a rule. */}
      {/* The rail's frame starts above the course header now, so the rail can start level with its title (2026-10-27, Eric). */}
      <div style={{ position: 'relative' }}>
      <section aria-label="Course" style={COURSE_HEAD}>
        {/* As wide as the details' left column below — the rail and its gutter kept clear (2026-10-27, Eric). */}
        {/* 32 in either side, so the title and intro line up with "Select a package:" in the ground below (2026-10-29, Eric). */}
        <div style={{ width: `calc(100% - ${RAIL_W}px - ${RAIL_GUTTER}px)`, boxSizing: 'border-box', paddingRight: 32, paddingLeft: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* 2 between the title and its intro (the design's 10, 8 less — 2026-10-27, Eric). */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: COURSE_TITLE_GAP }}>
          <h2 ref={courseTitleRef} style={COURSE_HEAD_TITLE}>
            {place} {line} <span style={{ whiteSpace: 'nowrap' }}>Pre-licensing</span> Package
          </h2>
          {/* The concise intro (2026-10-29, Eric), in place of "Our pre-licensing packages are updated annually and designed with a
              simplified approach…". */}
          <p style={BODY}>
            Updated every year, our packages make complex insurance concepts simple.{' '}
            <strong style={{ fontWeight: 800 }}>Learn faster</strong> with interactive lessons and quizzes, and{' '}
            <strong style={{ fontWeight: 800 }}>pass the {place} exam the first time.</strong>
          </p>
        </div>
        </div>
      </section>
        <aside aria-label="Purchase" style={{ ...RAIL, top: railTop }}>
          <div style={RAIL_STICKY}>
            <div style={SIDE_BOXES}>
              <div style={SIDE_BOX_PAIR}>
                {/* Course Specs moved to the course information box under the training program (2026-10-29, Eric). */}
                {/* What You'll Learn, in the rail too — the body's list in the rail's type (2026-10-28, Eric). */}
                <section style={SIDE_SECTION}>
                  <h2 style={SIDE_TITLE}>What You'll Learn</h2>
                  <ul style={SIDE_LEARN_LIST}>
                    {WHAT_YOULL_LEARN.map((topic) => (
                      <li key={topic}>{topic}</li>
                    ))}
                  </ul>
                </section>
                <hr aria-hidden style={SIDE_RULE} />
                {/* Back in the rail under What You'll Learn (2026-10-29, Eric). */}
                <section style={SIDE_SECTION}>
                  <h2 style={SIDE_TITLE}>What to Expect</h2>
                  {/* 14 between the groups (2026-10-28, Eric; was 18). */}
                  <div style={{ ...SIDE_BODY, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {WHAT_TO_EXPECT.map(([head, line]) => (
                      <div key={head} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <strong style={{ fontWeight: 800 }}>{noWidow(head)}</strong>
                        <span>{noWidow(line)}</span>
                      </div>
                    ))}
                    <button type="button" className="cre-e2e-textlink cre-e2e-textlink--brick" style={{ ...LINK, display: 'block', marginTop: -2 }}>
                      Recommended study plan
                      <AngleRightSolid size={15} aria-hidden style={LINK_CHEVRON} />
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
            {/* display: contents, so the pinned cards' containing block is the whole column (see the pin, above). */}
            <section aria-label="Choose a package" style={{ display: 'contents' }}>
              {/* The ground's first piece: its top corners, 24 above the heading. The tint fades over this and the cards. */}
              <div ref={headRef} style={PACKAGE_GROUND_HEAD}>
                {/* In the rail's At a Glance style — the slab serif at 20 / 24 — inside the ground, 4 above and 16 below
                    (2026-10-27, Eric). */}
                <div style={PACKAGES_HEAD_ROW}>
                  <h2 id="choose-package" style={SIDE_TITLE}>
                    {/* Single, there is nothing to select (2026-10-28, Eric). */}
                    {single ? <>Your {place} state package:</> : <>Select a package:</>}
                  </h2>
                </div>
                {/* THE SELECTOR — Figma 558:3600 (2026-10-28, Eric): slides open between the heading and the cards. A 0fr → 1fr grid row,
                    so it opens to its own height; inert while shut, so its selects are out of the tab order. Not wired: picking
                    changes nothing on the page yet. */}
                <div style={{ ...CHANGE_SLIDE, gridTemplateRows: changeOpen ? '1fr' : '0fr' }}>
                  <div id="change-state-or-line" inert={!changeOpen} style={{ overflow: 'hidden', minHeight: 0 }}>
                    <div style={CHANGE_ROW}>
                      {/* Each select under its own label (2026-10-28, Eric; was one label over both), in Avenir regular. */}
                      <div style={CHANGE_FIELDS}>
                        <div style={CHANGE_COLUMN}>
                          <label htmlFor="change-state" style={CHANGE_LABEL}>
                            Change state:
                          </label>
                          <span style={CHANGE_FIELD}>
                            {/* Defaults to the page's own state and line (2026-10-28, Eric). No .cre-e2e-input: its brick focus ring
                                showed on every click of a select, and was taken off (2026-10-28, Eric). */}
                            <select
                              id="change-state"
                              value={place}
                              onChange={(e) => setPlace(e.target.value)}
                              className="cre-e2e-select"
                              style={CHANGE_SELECT}
                            >
                              {CHANGE_STATES.map((st) => (
                                <option key={st}>{st}</option>
                              ))}
                            </select>
                            <AngleDownSolid size={16} aria-hidden style={CHANGE_CHEVRON} />
                          </span>
                        </div>
                        <div style={CHANGE_COLUMN}>
                          <label htmlFor="change-line" style={CHANGE_LABEL}>
                            Change line of authority:
                          </label>
                          <span style={CHANGE_FIELD}>
                            <select
                              id="change-line"
                              value={line}
                              onChange={(e) => setLine(e.target.value)}
                              className="cre-e2e-select"
                              style={CHANGE_SELECT}
                            >
                              {CHANGE_LINES.map((option) => (
                                <option key={option}>{option}</option>
                              ))}
                            </select>
                            <AngleDownSolid size={16} aria-hidden style={CHANGE_CHEVRON} />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div
                ref={cardsRef}
                role="group"
                aria-labelledby="choose-package"
                style={{ ...PACKAGE_GRID, ...(unpinned ? { position: 'relative' } : { top: `calc(${browserTop + CARDS_PIN_GAP}px - 28px * var(--p, 0))` }) }}
              >
                {/* The cards' piece of the ground, on its own layer so it can go once they pin — the condensed frame is narrower than
                    the column, and this showing either side of it read as a stray edge (2026-10-27, Eric). */}
                <div aria-hidden style={{ ...PIN_LAYER, background: GROUND_FILL, opacity: 'calc(1 - var(--pinned, 0))' }} />
                {/* Pinned, the tan ground shows from the browser's top to under the cards and nothing scrolls visibly beneath. Condensed,
                    it is Figma 548:3477's frame at the column's width — 32 either side of the cards, 12 above (2026-10-28, Eric; was 16), 24 below — square on top, 10 corners below, a shadow along its bottom edge only. */}
                <div
                  aria-hidden
                  ref={trayRef}
                  style={{ ...PIN_BACKDROP, top: `calc(${-(browserTop + CARDS_PIN_GAP)}px + 28px * var(--p, 0))` }}
                />
                {packages.map((p) => (
                  <div key={p.id} style={PACKAGE_PANEL}>
                    {/* Figma 544:3250: the card, on the shared ground. */}
                    {renderCard(p)}
                  </div>
                ))}
              </div>
              {/* THE COMPARISON GRID (2026-10-27, Eric's CoWork content) — under both cards, across the ground: each feature, then a
                  120-wide check column per package. Replaces the per-package lists. The ground's last piece, its bottom corners. */}
              <div ref={footRef} style={PACKAGE_GROUND_FOOT}>
                <table style={COMPARE}>
                  {/* In 'Select your package:''s style, 8 in like the column text below it (2026-10-27, Eric). */}
                  <caption style={{ ...SIDE_TITLE, textAlign: 'left', paddingBottom: 20 }}>
                    {single ? 'Premier package includes:' : 'Compare packages:'}
                  </caption>
                  {/* Single, no header row and so no rules over it: one column of checks under "Premier package includes:" says it
                      (2026-10-28, Eric). */}
                  {single ? null : (
                    <thead>
                      <tr>
                        <th scope="col" style={{ ...COMPARE_HEAD, paddingLeft: 0 }}>Feature</th>
                        {/* Each header is only its name now — the grid no longer follows the picked card, and its headers no longer pick
                            (2026-10-29, Eric). Premier's column is always the shaded one. */}
                        {packages.map((p) => (
                          <th key={p.id} scope="col" style={{ ...COMPARE_HEAD, ...COMPARE_MARK, ...(p.id === 'premier' ? PREMIER_SHADE : null) }}>
                            {p.short}
                          </th>
                        ))}
                      </tr>
                    </thead>
                  )}
                  <tbody>
                    {COMPARISON.map((row, r) => (
                      <tr key={r}>
                        {/* No rule under the last row (2026-10-27, Eric). */}
                        <th
                          scope="row"
                          style={{
                            ...COMPARE_FEATURE,
                            paddingLeft: 0,
                            ...(r === COMPARISON.length - 1 ? { borderBottom: 'none' } : null),
                            ...(single && r === 0 ? COMPARE_FIRST_RULE : null),
                          }}
                        >
                          <strong style={{ fontWeight: 800 }}>{row.feature}</strong>
                          {row.detail ? <>: {row.detail}</> : null}
                          {/* A text link after the feature, 8 to its right, in the page's link style (2026-10-29, Eric). */}
                          {row.link ? (
                            <button type="button" className="cre-e2e-textlink cre-e2e-textlink--brick" style={{ ...LINK, marginLeft: 8 }}>
                              {row.link}
                              <AngleRightSolid size={15} aria-hidden style={LINK_CHEVRON} />
                            </button>
                          ) : null}
                        </th>
                        {packages.map((p) => row[p.id]).map((has, i) => (
                          <td key={i} style={{ ...COMPARE_CELL, ...COMPARE_MARK, ...(packages[i].id === 'premier' ? PREMIER_SHADE : null), ...(r === COMPARISON.length - 1 ? { borderBottom: 'none' } : null), ...(single && r === 0 ? COMPARE_FIRST_RULE : null), color: has ? 'var(--color-xcel-brick)' : 'var(--color-neutral-500)' }}>
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
              {/* What You'll Learn moved to the rail, under At a Glance (2026-10-28, Eric). */}
              <section style={SECTION}>
                <h2 style={SECTION_TITLE}>Earn your license fast with our 3-Part Training Program</h2>
                {/* The subhead (2026-10-28, Eric). */}
                <div style={SUBHEAD}>
                  <p style={{ margin: 0 }}>
                    9 out of 10 students say XCEL’s proven 3-Part Training Program left them feeling prepared, and helped them pass their
                    insurance licensing exams on the first try.
                  </p>
                </div>
                {/* Four benefits in tiles — Figma 558:3578 (2026-10-28, Eric). */}
                {/* Hidden (2026-10-29, Eric) — kept whole behind SHOW_BENEFITS, so showing them again is one word. */}
                {SHOW_BENEFITS ? (
                  <ul style={BENEFITS}>
                    {BENEFIT_TILES.map(({ Icon, text, maxWidth, units, viewWidth, scale = 1 }, i) => (
                      <Fragment key={text}>
                        {/* The rule between two, the space either side of it the row's own (space-between). */}
                        {i > 0 ? <li aria-hidden style={BENEFIT_RULE} /> : null}
                        <li style={BENEFIT}>
                          <Icon
                            aria-hidden
                            style={{
                              ...BENEFIT_ICON,
                              height: BENEFIT_ICON_SIZE * scale,
                              width: (viewWidth * BENEFIT_ICON_SIZE * scale) / 512,
                              marginRight: -((viewWidth - units) * BENEFIT_ICON_SIZE * scale) / 512,
                            }}
                          />
                          <span style={{ ...BENEFIT_TEXT, maxWidth }}>{text}</span>
                        </li>
                      </Fragment>
                    ))}
                  </ul>
                ) : null}
                {/* The three parts as xcelsolutions.com's home page draws them (2026-10-28, Eric): the number in brick beside each,
                    a slab-serif title, the copy in grey, a #DDD rule between parts. */}
                <ol style={STEPS}>
                  {HOW_IT_WORKS.map((step, i) => (
                    <li key={step.number} style={i < HOW_IT_WORKS.length - 1 ? STEP : { ...STEP, ...STEP_LAST }}>
                      <span aria-hidden style={STEP_NUMBER}>{step.number}</span>
                      <div style={{ minWidth: 0 }}>
                        <h3 style={STEP_TITLE}>{step.title}</h3>
                        <p style={STEP_BODY}>{step.body}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
              {/* OTHER COURSE INFORMATION (2026-10-29, Eric): Regulatory Information and the state reporting fee, moved out of the
                  rail into two columns under the training program, in the rail's own type. What to Expect went back to the rail. */}
              {/* No title now, on a tan ground like the packages' — its 10 corners and 32 padding, out to the same edges (2026-10-29, Eric). */}
              <section aria-label="Other course information" style={OTHER_INFO_GROUND}>
                <div style={OTHER_INFO}>
                    {/* Course Specs, first, out of the rail (2026-10-29, Eric). */}
                    <section style={SIDE_SECTION}>
                      {/* "Course Specifications", on two lines like the other two (2026-10-29, Eric; was "Course Specs"); each spec's
                          value under its name, as Regulatory Information's are. */}
                      <h2 style={SIDE_TITLE}>
                        Course
                        <br />
                        Specifications
                      </h2>
                      {/* A rule under each title, the column's width (2026-10-29, Eric). */}
                      <hr aria-hidden style={OTHER_INFO_HR} />
                      <dl style={{ ...SIDE_BODY, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {TRAINING_SPECS.map(([term, value]) => (
                          <div key={term} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <dt>{term}</dt>
                            <dd style={{ margin: 0, fontWeight: 800 }}>{localize(value)}</dd>
                          </div>
                        ))}
                      </dl>
                    </section>
                    <section style={SIDE_SECTION}>
                      <h2 style={SIDE_TITLE}>
                        {/* Broken after the first word (2026-10-29, Eric). */}
                        Regulatory
                        <br />
                        Information
                      </h2>
                      {/* A rule under each title, the column's width (2026-10-29, Eric). */}
                      <hr aria-hidden style={OTHER_INFO_HR} />
                      {/* 14 between every group, the link included (2026-10-28, Eric; was 18, and 28 to the link). */}
                      <div style={{ ...PARAGRAPHS, gap: 14 }}>
                        <dl style={{ ...SIDE_BODY, display: 'flex', flexDirection: 'column', gap: 14 }}>
                          {[
                            ['Course Provided By:', 'XCEL Solutions LLC.'],
                            ['Course Name:', localize(pkg.courseName)],
                            ['Approved course ID:', '1191656'],
                          ].map(([term, value]) => (
                            <div key={term} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                              <dt>{term}</dt>
                              <dd style={{ margin: 0, fontWeight: 800 }}>{noWidow(value)}</dd>
                            </div>
                          ))}
                        </dl>
                        {/* A rule over the link, to give it focus (2026-10-29, Eric). */}
                        <hr aria-hidden style={OTHER_INFO_HR} />
                        <p style={SIDE_BODY}>
                          <button type="button" className="cre-e2e-textlink cre-e2e-textlink--brick" style={LINK}>
                            {/* Two lines, broken after "Insurance" (2026-10-29, Eric). */}
                            {place} Insurance
                            <br />
                            Licensing Requirements
                            <AngleRightSolid size={15} aria-hidden style={LINK_CHEVRON} />
                          </button>
                        </p>
                      </div>
                    </section>
                    {/* The state reporting fee — Figma 542:2304 (2026-10-27, Eric). */}
                    <section style={SIDE_SECTION}>
                      <h2 style={SIDE_TITLE}>
                        State Reporting
                        <br />
                        Fee Required
                      </h2>
                      {/* A rule under each title, the column's width (2026-10-29, Eric). */}
                      <hr aria-hidden style={OTHER_INFO_HR} />
                      {/* The fee as the other columns' facts — its amount under its name, in Heavy — then a rule over the link, as in
                          Regulatory Information (2026-10-29, Eric). */}
                      <div style={{ ...SIDE_BODY, display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <dl style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <dt>{STATE_ABBR[place] ?? place} fee due at checkout:</dt>
                          <dd style={{ margin: 0, fontWeight: 800 }}>{STATE_FEE}</dd>
                        </dl>
                        <hr aria-hidden style={OTHER_INFO_HR} />
                        <button type="button" className="cre-e2e-textlink cre-e2e-textlink--brick" style={{ ...LINK, display: 'block' }}>
                          100% transparent pricing
                          <AngleRightSolid size={15} aria-hidden style={LINK_CHEVRON} />
                        </button>
                      </div>
                    </section>
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
      {/* THE BOTTOM MINI CARD TRAY (2026-10-29, Eric): the top tray's twin, pinned to the bottom of the browser — a zero-height sticky
          row at the page's end, the tray sliding up out of its clip once the cards on the page have scrolled off the top. */}
      {bottomTray ? (
        <div style={BOTTOM_TRAY_PIN}>
          <div style={BOTTOM_TRAY_CLIP}>
            <div
              role="radiogroup"
              aria-label="Choose your package"
              aria-hidden={!trayShown}
              inert={!trayShown}
              style={{ ...TOP_TRAY, ...BOTTOM_TRAY, transform: trayShown ? 'none' : 'translateY(100%)' }}
            >
              {miniCards}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

/* The two packages, Standard on the left (2026-10-27). Standard's copy is the original page's (the live Standard
   product page); Premier's is its live page's, 2026-10-27. */
/* THE TOP MINI CARD TRAY'S CARD — Figma 560:3783 (2026-10-28, Eric): the package's name as a tan tab in the top-left corner (Premier's
   behind its brick PASS GUARANTEE), then the title, 18 / 24 Heavy, beside the price over its Purchase. Picked, white with a 2 brick
   edge; at rest, 40% white with the 1 #D9D9D9 one. */
function MiniCard({ p, on, title, onPick, onBuy }: {
  p: (typeof PACKAGES)[number]
  on: boolean
  title: string
  onPick: () => void
  onBuy: () => void
}) {
  return (
    <div
      role="radio"
      tabIndex={0}
      aria-checked={on}
      onClick={onPick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onPick()
        }
      }}
      style={{ ...MINI_CARD, ...(on ? MINI_CARD_ON : null) }}
    >
      {/* Picked, over the ring, as the page's badge sits over its card's (2026-10-28, Eric). */}
      <span style={{ ...MINI_TAB, ...(on ? { position: 'relative', zIndex: 1 } : null) }}>
        {p.badge ? <span style={MINI_BADGE}>{p.badge}</span> : null}
        {/* Beside the badge, only the tab's 10 gap — no 16 in from the left (2026-10-28, Eric). */}
        <span style={{ ...MINI_TAB_LABEL, ...(p.badge ? { paddingLeft: 0 } : null) }}>{p.short} package</span>
      </span>
      <span style={MINI_BODY}>
        <span style={MINI_TITLE}>
          {title.split('Pre-licensing').map((part, i) => (
            <Fragment key={i}>
              {i > 0 ? <span style={{ whiteSpace: 'nowrap' }}>Pre-licensing</span> : null}
              {part}
            </Fragment>
          ))}
        </span>
        <span style={MINI_PRICE_COLUMN}>
          <span style={MINI_PRICES}>
            <span style={MINI_PRICE}>
              <span style={MINI_DOLLAR}>$</span>
              {p.price.replace(/^\$/, '')}
            </span>
            <span style={MINI_WAS}>
              <s style={{ textDecoration: 'none' }}>{p.was}</s>
              <img src="/brand/e2e-price-strike.svg" alt="" aria-hidden style={MINI_STRIKE} />
            </span>
          </span>
          <button
            type="button"
            // Premier's brick; Standard's the outline, white with a brick edge and label (Figma 559:3753, 2026-10-28, Eric).
            className={`cre-e2e-add-to-cart ${p.id === 'premier' ? 'cre-e2e-cta' : 'cre-e2e-outline'}`}
            style={{ ...MINI_BUY, ...(p.id === 'premier' ? SOLID_BUY_WEIGHT : null) }}
            onClick={(e) => {
              e.stopPropagation()
              onBuy()
            }}
          >
            Purchase {p.short}
          </button>
        </span>
      </span>
      {/* The edge, over the tab so the tab's corner sits inside it. */}
      <span aria-hidden style={{ ...MINI_EDGE, ...(on ? MINI_EDGE_ON : null) }} />
    </div>
  )
}

const PACKAGES: {
  id: PackageId
  short: string
  title: string
  courseName: string
  price: string
  was: string
  badge?: string
  /** The page card's title, in place of the state and package name. */
  cardTitle?: string
  description: string
  diffTitle: string
  diffs: { title: string; detail: string }[]
}[] = [
  {
    id: 'standard',
    short: 'Standard',
    cardTitle: 'Standard Package', // (2026-10-29, Eric; was Standard Course)
    title: 'Life and Health Pre-licensing Package', // no "Florida" (2026-10-28, Eric)
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
    cardTitle: 'Premier Package', // (2026-10-29, Eric)
    title: 'Life and Health Pre-licensing Package',
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
const COMPARISON: { feature: ReactNode; detail?: ReactNode; standard: boolean; premier: boolean; link?: string }[] = [
  // The 3-part training program row is gone (2026-10-29, Eric) — its three parts are the rows that follow.
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
  { feature: 'Flashcards (Life, Health, and Accident Insurance)', detail: '800+ cards covering fundamentals', standard: false, premier: true, link: 'Learn More' }, // (2026-10-29, Eric)
  // A Learn more link after it (2026-10-29, Eric).
  { feature: 'Pass Guarantee (Prepared to Pass Promise)', standard: false, premier: true, link: 'Learn More' },
]

/* Florida's reporting fee — DEMO DATA, see the header. */
// The reporting fee line reads `${abbreviation} fee due at checkout: $20` for whichever state is chosen. DEMO: one invented fee
// for every state.
const STATE_FEE = '$20'
// All fifty, in order — the selector's states are its keys (2026-10-28, Eric; was five).
const STATE_ABBR: Record<string, string> = {
  Alabama: 'AL',
  Alaska: 'AK',
  Arizona: 'AZ',
  Arkansas: 'AR',
  California: 'CA',
  Colorado: 'CO',
  Connecticut: 'CT',
  Delaware: 'DE',
  Florida: 'FL',
  Georgia: 'GA',
  Hawaii: 'HI',
  Idaho: 'ID',
  Illinois: 'IL',
  Indiana: 'IN',
  Iowa: 'IA',
  Kansas: 'KS',
  Kentucky: 'KY',
  Louisiana: 'LA',
  Maine: 'ME',
  Maryland: 'MD',
  Massachusetts: 'MA',
  Michigan: 'MI',
  Minnesota: 'MN',
  Mississippi: 'MS',
  Missouri: 'MO',
  Montana: 'MT',
  Nebraska: 'NE',
  Nevada: 'NV',
  'New Hampshire': 'NH',
  'New Jersey': 'NJ',
  'New Mexico': 'NM',
  'New York': 'NY',
  'North Carolina': 'NC',
  'North Dakota': 'ND',
  Ohio: 'OH',
  Oklahoma: 'OK',
  Oregon: 'OR',
  Pennsylvania: 'PA',
  'Rhode Island': 'RI',
  'South Carolina': 'SC',
  'South Dakota': 'SD',
  Tennessee: 'TN',
  Texas: 'TX',
  Utah: 'UT',
  Vermont: 'VT',
  Virginia: 'VA',
  Washington: 'WA',
  'West Virginia': 'WV',
  Wisconsin: 'WI',
  Wyoming: 'WY',
}

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
/* The selector's choices (2026-10-28, Eric). States: all fifty (was Florida and four others at random). Lines: what xcelsolutions.com's course finder offers for Florida with Get License chosen. */
const CHANGE_STATES = Object.keys(STATE_ABBR)
const CHANGE_LINES = ['Life and Health', 'Life', 'Health', 'Property and Casualty', 'Personal Lines']

/* The four benefit tiles under the training program's subhead (Figma 558:3578). Their copy is xcelsolutions.com's list. */
/* The benefit tiles under the 3-Part Training Program subhead — hidden (2026-10-29, Eric). */
const SHOW_BENEFITS = false
const BENEFIT_TILES: { Icon: typeof FaceGrinLight; text: string; maxWidth: number; units: number; viewWidth: number; scale?: number }[] = [
  // Each label's width is its first line's, so every one sets on two lines as in the design and the row has room for its rules
  // — "Access 800+ practice / exam questions" on two, not the design's three (2026-10-28, Eric). On one line each, the four
  // run wider than the column.
  //
  // `units` is how wide each glyph's drawing is in Font Awesome's 512-high grid, so every icon gets the same scale and its box ends
  // where its drawing does — and the 12 to the label is the same 12 in all four (2026-10-28, Eric). The certificate's viewBox is
  // 576 wide but its drawing stops at 512, so its box is trimmed to 512.
  // face-grin, not the design's clipboard-list (2026-10-28, Eric; face-smile first).
  { Icon: FaceGrinLight, text: 'Eliminate test anxiety', maxWidth: 73, units: 512, viewWidth: 512 },
  { Icon: ChartLineUpLight, text: 'Track your study progress', maxWidth: 87, units: 512, viewWidth: 512 },
  { Icon: BallotCheckLight, text: 'Access 800+ practice exam questions', maxWidth: 112, units: 384, viewWidth: 384 },
  // The certificate draws the full 512 across and its ribbon hangs 32 below the grid, so at the shared scale it read larger and
  // heavier than the other three; it is drawn at 91.5% — 24 x 25 (2026-10-28, Eric; 88% first).
  { Icon: FileCertificateLight, text: 'Become licensed in a few weeks', maxWidth: 89, units: 512, viewWidth: 576, scale: 0.915 },
]

/* The three parts, in xcelsolutions.com's home-page words (2026-10-28, Eric; were this PDP's Step 1–3 and a Pass Your Exam! line). */
const HOW_IT_WORKS: { number: string; title: string; body: string }[] = [
  {
    number: '01',
    title: 'Pre-License Education Builds a Solid Foundation',
    body: 'Our pre-licensing courses deliver easy-to-follow content and teach key concepts through engaging videos, review notes, and practice questions. Now, with AI-powered learning from Rubi™, you can get instant answers, real-world examples, and multi-language support.',
  },
  {
    number: '02',
    title: 'Exam-Focused Prep That Gets You Ready to Pass',
    body: 'After Part 1, you’ll unlock the Prep Review Course, with clear, exam-focused content that helps you focus on what matters most. Rubi™ continues to support your progress, helping you understand tough concepts and build exam-day confidence.',
  },
  {
    number: '03',
    title: 'Take Unlimited Practice Exams',
    body: 'There are three exam simulators. Each simulator is weighted by topic to match the state exam, allows for unlimited retakes, and can only be unlocked by completing the previous exam. The exam environment is meant to mimic the state exam.',
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
/* Between the course title and its intro. */
const COURSE_TITLE_GAP = 2
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





/* The solid brick Purchase buttons a weight up — Heavy, Avenir's next weight after Medium (2026-10-29, Eric). The outlined ones stay Medium. */
const SOLID_BUY_WEIGHT: CSSProperties = { fontWeight: 800 }
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
const SIDE_SECTION: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 14 } // 14 under each heading (2026-10-28, Eric; was 18)

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
/* Other course information's two columns, 300 wide and 32 apart, each starting level (2026-10-29, Eric; was three, a third each). */
// Course Specs, Regulatory Information, the fee (2026-10-29, Eric): three equal columns 32 apart, no rules between them now (was two
// 300 columns, 48 either side of a rule, then the left one up to 240, then three with a rule 32 either side).
const OTHER_INFO: CSSProperties = { display: 'grid', // Each column 10 narrower than a third of the room (2026-10-29, Eric), reaching both edges, about 63 apart. Only a rule under each
  // title and one over each link now — the gutter rules and the rules between facts came and went the same day.
  gridTemplateColumns: 'repeat(3, calc((100% - 96px) / 3 - 10px))',
  justifyContent: 'space-between', // 48 apart (2026-10-29, Eric: 32, 40, then 48)
  alignItems: 'start' }
/* Their tan ground: the packages ground's Secondary 100, 10 corners and 32 padding, pulled out over SHARED's 32 sides so its edges
   line up with the packages ground above and its text with the text. */
// Every rule in the course information box in a "Secondary 250" — halfway between 200 and 300, which the palette has no token for
// (2026-10-29, Eric; 300, then 200). The rail's are 300.
const SECONDARY_250 = 'color-mix(in srgb, var(--color-secondary-200), var(--color-secondary-300))'
const OTHER_INFO_HR: CSSProperties = { ...SIDE_RULE, background: SECONDARY_250 }
const OTHER_INFO_GROUND: CSSProperties = {
  marginRight: -32,
  marginLeft: -32,
  paddingTop: 32,
  paddingRight: 32,
  paddingBottom: 32,
  paddingLeft: 32,
  borderRadius: 10,
  // No fill now (2026-10-29, Eric; was the packages' Secondary 100) — the padding kept, so nothing moves.
}
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
/* THE THREE PARTS — xcelsolutions.com's (2026-10-28, Eric): each a row, the number 31 wide and 23 clear of its title; the slab
   serif for both; the copy in grey, 15 under its title; 30 under the copy, a 1 #DDD rule, 30 to the next
   part. The last has no rule. */
// A rule over the first part too, 38 above it like the rules between parts (2026-10-28, Eric).
// The training program's rules are a step lighter than the cards' #DDD: Neutral 100, #ECECEC (2026-10-28, Eric).
const STEPS: CSSProperties = {
  margin: 0,
  padding: 0,
  paddingTop: 38,
  borderTop: '1px solid var(--color-neutral-100)',
  listStyle: 'none',
}
const STEP: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 23,
  paddingBottom: 30,
  marginBottom: 38, // 38 under the rule (2026-10-28, Eric; the site's 30)
  borderBottom: '1px solid var(--color-neutral-100)',
}
const STEP_LAST: CSSProperties = { marginBottom: 0 } // keeps its rule underneath now (2026-10-29, Eric; was none)
// Number and title in the rail's heading size, 20 / 24 (2026-10-28, Eric; the site's 28 / 34); the copy back in BODY's 18 / 27.
const STEP_NUMBER: CSSProperties = { ...SIDE_TITLE, flex: 'none', color: 'var(--color-xcel-brick)' }
const STEP_TITLE: CSSProperties = SIDE_TITLE
const STEP_BODY: CSSProperties = { ...BODY, marginTop: 7, color: 'var(--color-text-secondary)' } // 7 under the title (2026-10-28, Eric: 11, then 4 less; the site's 15)

/* Figma 558:3578, then opened up (2026-10-28, Eric): no fills, a 1 #DDD rule over the row like the one under it, and a 1 rule
   between the four (the outer ends flush with the column). Each 8 / 16 in; a Font Awesome icon (34 Thin in the design) in the
   darker brick (Primary 600, #7B1618), 12 from its label in Avenir Medium 11 / 14. */
// Each benefit as wide as its content, no padding; the row spreads them with the rules between (2026-10-28, Eric).
const BENEFITS: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  margin: 0,
  padding: 0,
  paddingTop: 15, // the section's gap, as below the row
  borderTop: '1px solid var(--color-neutral-100)',
  listStyle: 'none',
}
const BENEFIT: CSSProperties = { flex: 'none', display: 'flex', alignItems: 'center', gap: 12 }
const BENEFIT_RULE: CSSProperties = { flex: 'none', width: 1, alignSelf: 'stretch', background: 'var(--color-neutral-100)' }
// A 34 square, as Font Awesome sizes a glyph (1em). A 34 x 52 box fitted every icon to whichever side ran out first, so the narrow
// 384-wide clipboard and ballot drew 45 tall beside a 34 chart and a 30 certificate (2026-10-28).
// 26 high — the design's 34, 15% smaller, then 10% more (2026-10-28, Eric) — in Font Awesome Light, a step up from the design's
// Thin; each icon's width follows its drawing (BENEFIT_TILES). Overflow shows,
// as Font Awesome's does, so a glyph that runs past its grid (the certificate's ribbon) is not clipped.
const BENEFIT_ICON_SIZE = 26
const BENEFIT_ICON: CSSProperties = {
  flex: 'none',
  height: BENEFIT_ICON_SIZE,
  overflow: 'visible',
  color: 'color-mix(in srgb, var(--color-xcel-brick) 80%, black)', // #7B1618
}
const BENEFIT_TEXT: CSSProperties = {
  // 2 lower against its icon (2026-10-28, Eric: 3, then 1 back) — nudged, so the row's height and centring are untouched.
  position: 'relative',
  top: 2,
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800, // Heavy, a step up from Medium — Avenir has nothing between (2026-10-28, Eric)
  fontSize: 11,
  lineHeight: '14px',
  color: 'var(--color-text-primary)',
}

/* A section's subhead: the course intro's own type — BODY, 18 / 27 Avenir (2026-10-28, Eric; was 20 / 30 Medium) — its two lines 8
   apart. */
const SUBHEAD: CSSProperties = { ...BODY, display: 'flex', flexDirection: 'column', gap: 8, marginTop: -4, paddingBottom: 12 } // 12 more to the steps (2026-10-28, Eric: 8, 8, 4, then 8 less); 11 under its heading (the section's 15, less 8, then 4 back)

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

/* The same list in the rail: its 15 / 21 body, the disc 18 in, the At a Glance rows' 8 apart. */
// Plain wrapping, not BODY's `pretty`: a lone last word is fine here (2026-10-28, Eric) — `pretty` was pulling a second word down
// and breaking the items early.
const SIDE_LEARN_LIST: CSSProperties = { ...LEARN_LIST, ...SIDE_BODY, paddingLeft: 18, gap: 8, textWrap: 'wrap' }

const PARAGRAPHS: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 20 }

/* Each heading, 3 to its checked line, 15 to the next heading; the intro
   line 20 above the first. */



const LINK: CSSProperties = {
  padding: 0,
  // Left-aligned when it wraps (a button centres its lines by default).
  textAlign: 'left',
  border: 'none',
  background: 'none',
  // 14 / 18 (2026-10-28, Eric; was the rail's 15 / 21 by inheritance, then 13 / 18) — longhands, so nothing here is reset by a
  // `font` shorthand.
  fontFamily: 'inherit',
  fontSize: 14,
  lineHeight: '18px',
  // Avenir Heavy, the next face up from Medium — Avenir has no 600 or 700, so those draw Heavy anyway (2026-10-28, Eric; was 500).
  fontWeight: 800,
  // No underline at rest (2026-10-28, Eric) — the class's hover underline still shows, as nothing inline outranks it.
  cursor: 'pointer',
}

/* The angle-right after each of the rail's links (2026-10-28, Eric): 15, the size of Change state or line's angle-down, its drawing 4
   clear of the text and centred on it — the drawing is 6.6 wide in a 15 square, so most of the square is air (measured). */
const LINK_CHEVRON: CSSProperties = { marginLeft: -0.65, verticalAlign: '-3px' }

/* The packages heading's Change state or line — LINK, now that LINK itself has no underline (2026-10-28, Eric). */
const PLAIN_LINK: CSSProperties = LINK

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
  // The two cards side by side; they pin (the comparison table is the ground's next piece now).
  // Pinned, the cards widen: 24 at the sides like the frame's bottom, and 24 between them (2026-10-28, Eric). On the page, 32 and
  // 32, in line with the comparison below.
  columnGap: 24, // pinned too (2026-10-28, Eric; was 40, then 32 / 24, then 24 / 16)
  rowGap: 32,
  alignItems: 'start',
  paddingRight: pinLerp(32, 24, 'p'),
  paddingLeft: pinLerp(32, 24, 'p'),
  position: 'sticky',
  zIndex: 2,
}


/* The packages heading and its links on one baseline, the links right-aligned; 4 above, 16 below (the heading's own were). */
const PACKAGES_HEAD_ROW: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: 16,
  paddingTop: 4,
  paddingBottom: 16,
}

/* The state / line selector (Figma 558:3600): the label in Avenir Heavy 13 / 21, then two white 35-high selects, a 0.5 Neutral 400
   edge and 4 corners, Avenir Medium 12, a 16 solid angle-down in brick 16 in from the right; 16 between, left-aligned, 16 to the cards. */
const CHANGE_SLIDE: CSSProperties = { display: 'grid', transition: 'grid-template-rows 0.3s ease' }
// The label over the two selects, 6 above them (2026-10-28, Eric; the design sets it beside them), all left-aligned with the heading.
const CHANGE_ROW: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 6,
  paddingTop: 12, // 4 more over the label (2026-10-28, Eric)
  paddingBottom: 8, // (2026-10-28, Eric; was 24, then 16)
  // No fill and no side padding — a 1 #DDD rule above it only, square, flush with the column (2026-10-28, Eric; was a tinted, then
  // outlined, 10-cornered box, then ruled above and below) — and 16 clear of the cards under it.
  borderTop: '1px solid var(--color-e2e-card-outline)',
  marginBottom: 16,
}
const CHANGE_COLUMN: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }
const CHANGE_LABEL: CSSProperties = {
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 400, // regular (2026-10-28, Eric; the design's Heavy)
  fontSize: 13,
  lineHeight: '21px',
  color: 'var(--color-text-primary)',
  whiteSpace: 'nowrap',
}
// Two equal columns, each as wide as the wider select — the state select takes the line of authority's width (2026-10-28, Eric).
const CHANGE_FIELDS: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }
const CHANGE_FIELD: CSSProperties = { position: 'relative', display: 'flex' }
const CHANGE_SELECT: CSSProperties = {
  appearance: 'none',
  width: '100%',
  height: 35,
  margin: 0,
  paddingTop: 1,
  paddingRight: 44, // 16 + the chevron's 16 + 12
  paddingBottom: 0,
  paddingLeft: 16,
  borderWidth: 0.5,
  borderStyle: 'solid',
  // The edge's colour is .cre-e2e-select's (inviteFlow.css): Neutral 400, two steps darker on focus.
  borderRadius: 4,
  background: 'var(--color-fixed-light)',
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 500,
  fontSize: 12,
  lineHeight: '14px',
  color: 'var(--color-text-primary)',
  cursor: 'pointer',
}
const CHANGE_CHEVRON: CSSProperties = {
  position: 'absolute',
  right: 16,
  top: '50%',
  transform: 'translateY(-50%)',
  color: 'var(--color-xcel-brick)',
  pointerEvents: 'none',
}

/* The ground the heading, cards and grid sit on, in three pieces (the pin): 32 in (24 on top), 10 corners. The heading's and the
   cards' fill is the fade, set inline. */
/* THE PACKAGES GROUND (2026-10-29, Eric): for a while no fill and a 1 Secondary 200 outline instead of the tan fade; now a flat
   Secondary 100 fill and no outline. */
// Filled again, Secondary 100 (2026-10-29, Eric: half, then all of it) — and no edge now, the fill alone (GROUND_EDGE unused).
const GROUND_FILL = 'var(--color-secondary-100)'
const PACKAGE_GROUND_HEAD: CSSProperties = {
  paddingTop: 24, // 8 less than the sides, above the heading (2026-10-27, Eric)
  paddingRight: 32,
  paddingLeft: 32,
  borderTopLeftRadius: 10,
  borderTopRightRadius: 10,
  background: GROUND_FILL,
}
const PACKAGE_GROUND_FOOT: CSSProperties = {
  paddingTop: 32,
  paddingRight: 32,
  paddingBottom: 32,
  paddingLeft: 32,
  borderBottomLeftRadius: 10,
  borderBottomRightRadius: 10,
  background: GROUND_FILL,
}

/* The cards pin this far under the top of the browser (2026-10-27, Eric). */
const CARDS_PIN_GAP = 40
/* Pinned, the ground's tan behind the cards — its fade and its 10 corners — from the browser's top (set inline) to 8 under
   the cards (2026-10-27, Eric; was the page's white, to 16 under them). Behind the cards, over the cards' own fill. */
const PIN_BACKDROP: CSSProperties = {
  position: 'absolute',
  // The column's full width, condensed too (2026-10-27, Eric; it came in 8 a side) — 32 either side of the cards, 24 below.
  left: 0,
  right: 0,
  bottom: pinLerp(-8, -24, 'p'), // 8 under the cards (2026-10-27, Eric)
  zIndex: -1,
  borderRadius: '0 0 10px 10px',
  background: 'linear-gradient(to bottom, var(--color-secondary-200), var(--color-secondary-100))',
  // No shadow: the left, right and bottom edges feather out over 15 instead (2026-10-28, Eric; was a bottom-edge shadow, then 20). The
  // two masks intersect, so a corner fades both ways.
  maskImage:
    'linear-gradient(to right, transparent, #000 var(--tray-side-feather, 0px), #000 calc(100% - var(--tray-side-feather, 0px)), transparent), linear-gradient(to bottom, #000 calc(100% - 15px), transparent)',
  maskComposite: 'intersect',
  // ⚠ NO TRANSITION. The cards' own piece of the ground switches off the instant they pin (PIN_LAYER), so a fade-in here left
  // 150ms with neither layer fully there — the tray's background blinked as it appeared (2026-10-28, Eric).
  opacity: 'var(--pinned, 0)',
  pointerEvents: 'none',
}
/* A layer behind the cards, inside their sticky row. */
const PIN_LAYER: CSSProperties = { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: -1, pointerEvents: 'none' }
/* The tray's feathered edge, at its widest. */
const TRAY_FEATHER = 15
/* The scroll over which the comparison's tan fades once it is up past the tray. */
const FOOT_FADE = 80 // (2026-10-28, Eric; was 40)
/* The scroll over which pinned cards condense. */
const PIN_CONDENSE = 160

/* The Top Mini Card Tray (2026-10-28, Eric): a zero-height row stuck at the browser's top (set inline), over the page's pinned header but
   under the browser chrome; the clip under it hides the tray until it slides down. */
const TOP_TRAY_PIN: CSSProperties = { position: 'sticky', zIndex: 20, height: 0 }
const TOP_TRAY_CLIP: CSSProperties = { position: 'absolute', top: 0, right: 0, left: 0, overflow: 'hidden', paddingBottom: 12, pointerEvents: 'none' }
/* The bottom tray's row and clip: the top's, turned over — stuck to the browser's bottom, the clip's room for the shadow above. */
const BOTTOM_TRAY_PIN: CSSProperties = { position: 'sticky', bottom: 0, zIndex: 20, height: 0 }
const BOTTOM_TRAY_CLIP: CSSProperties = { position: 'absolute', right: 0, bottom: 0, left: 0, overflow: 'hidden', paddingTop: 12, pointerEvents: 'none' }
// Its shadow cast up, onto the page above it.
const BOTTOM_TRAY: CSSProperties = { boxShadow: '0 -6px 10px -8px rgb(0 0 0 / 0.3)' }
/* Figma 560:3783: the browser’s full width (in Secondary 100 now; the design’s 200), 16 above and below, the two cards 552 wide and 24 apart, centred. */
const TOP_TRAY: CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'stretch',
  gap: 24,
  paddingTop: 12, // 12 above (2026-10-28, Eric: 8, then 4 more; the design's 16)
  paddingRight: 24,
  paddingBottom: 16,
  paddingLeft: 24,
  // The packages ground's fade flipped, Secondary 100 at the top to 200 at the bottom (2026-10-28, Eric; was 200 to 100, then flat 100,
  // the design's flat 200).
  background: 'linear-gradient(to bottom, var(--color-secondary-100), var(--color-secondary-200))',
  boxShadow: '0 6px 10px -8px rgb(0 0 0 / 0.3)', // 30% (2026-10-28, Eric; was 20)
  transition: 'transform 0.3s ease',
  pointerEvents: 'auto',
}

/* Figma 560:3858 (2026-10-28, Eric): each card as wide as its content — the 244 title, 26, the price — not 552. */
const MINI_CARD: CSSProperties = {
  position: 'relative',
  flex: 'none',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  borderRadius: 10,
  background: 'color-mix(in srgb, var(--color-fixed-light) 60%, transparent)', // 60% white at rest (2026-10-28, Eric; the design's 40)
  cursor: 'pointer',
}
// Picked, the page's selected card's ring and shadow (OPTION_ON — 2026-10-28, Eric; was the design's 2 brick edge): the shadow on the
// card, the rings on its edge layer, over the tab.
const MINI_CARD_ON: CSSProperties = { background: 'var(--color-fixed-light)', boxShadow: '0 4px 8px -2px rgb(0 0 0 / 0.3)' }
const MINI_EDGE: CSSProperties = {
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  borderRadius: 10,
  boxShadow: 'inset 0 0 0 1px var(--color-e2e-card-outline)',
  pointerEvents: 'none',
}
const MINI_EDGE_ON: CSSProperties = { boxShadow: 'inset 0 0 0 1px var(--color-e2e-card-outline), inset 0 0 0 7px var(--color-secondary-200)' }
/* The tab: Secondary 200, an 8 corner bottom right, 25 tall; Premier's brick badge 148 wide at its left. */
const MINI_TAB: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  height: 21, // 11 / 13 of the design's 25, with the type (2026-10-29, Eric)
  paddingRight: 16,
  borderBottomRightRadius: 8,
  background: 'var(--color-secondary-200)',
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 11, // every card's eyebrow 11 (2026-10-29, Eric; the design's 13)
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
}
const MINI_BADGE: CSSProperties = {
  alignSelf: 'stretch',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 125, // 11 / 13 of the design's 148, with the type (2026-10-29, Eric)
  paddingTop: 3, // 1 lower than centred (2026-10-28, Eric: 1 down, 1 more, then 1 back up on 10-29; centred, 2 moves it 1)
  background: 'var(--color-xcel-brick)',
  color: 'var(--color-fixed-light)',
}
const MINI_TAB_LABEL: CSSProperties = { paddingTop: 5, // 1 lower (2026-10-28, Eric; was 3 — centred, 2 more moves it 1)
  paddingLeft: 16, color: 'var(--color-xcel-brick)' }
/* Figma 560:3858: the title and the price centred on each other, 26 apart; 16 under them, 20 either side. */
const MINI_BODY: CSSProperties = {
  alignSelf: 'stretch',
  display: 'flex',
  alignItems: 'center',
  gap: 26,
  paddingRight: 20,
  paddingBottom: 16,
  paddingLeft: 20,
}
// 204 wide, 10 down from the row's centre line — "Pre-licensing" kept whole, so it breaks before it as the design does. 40 nearer
// the price (2026-10-29, Eric; the design's 244 left 78 between the title's text and the price).
const MINI_TITLE: CSSProperties = {
  position: 'relative',
  top: 4, // 4 lower (2026-10-29, Eric), moved like the price
  flex: 'none',
  width: 204,
  paddingTop: 10,
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 18,
  lineHeight: '24px',
  color: 'var(--color-text-primary)',
}
// 4 higher (2026-10-29, Eric: 8, then 4 back) — moved, not resized, so the card keeps its height.
const MINI_PRICE_COLUMN: CSSProperties = { position: 'relative', top: -4, flex: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 } // 6 less to the button (2026-10-29, Eric; the design's 8)
const MINI_PRICES: CSSProperties = { display: 'flex', alignItems: 'baseline', gap: 6, whiteSpace: 'nowrap' }
const MINI_PRICE: CSSProperties = { fontFamily: 'var(--font-e2e-avenir)', fontWeight: 500, fontSize: 22, lineHeight: '26px', color: 'var(--color-text-primary)' }
/* The dollar sign raised and smaller, 14.19 — the design's superscript. */
const MINI_DOLLAR: CSSProperties = { fontSize: 14.19, verticalAlign: '0.45em', lineHeight: 0 }
const MINI_WAS: CSSProperties = { position: 'relative', fontFamily: 'var(--font-e2e-avenir)', fontWeight: 400, fontSize: 14, lineHeight: '26px', color: 'var(--color-neutral-500)' }
const MINI_STRIKE: CSSProperties = { position: 'absolute', left: -2, top: '50%', width: 53, height: 1, transform: 'translateY(-50%) rotate(-7.43deg)' }
const MINI_BUY: CSSProperties = {
  ...ADD_TO_CART,
  height: 34,
  paddingTop: 0,
  paddingRight: 16,
  paddingBottom: 0,
  paddingLeft: 16,
  borderRadius: 6,
  fontSize: 16,
  whiteSpace: 'nowrap',
}

/* A length from the full card (a) to the condensed one (b), by the cards' progress — --cp, or one of its eased forms — or, for
   the frame round them, the pin's own --p. */
function pinLerp(a: number, b: number, v: 'p' | 'cp' | 'px' | 'py' = 'cp'): string {
  return `calc(${a}px + ${b - a}px * var(--${v}, 0))`
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
  // At rest, 40% of the tan ground shows through (2026-10-27, Eric: 20, then 20 more); selected is solid white (OPTION_ON).
  background: 'color-mix(in srgb, var(--color-fixed-light) 60%, transparent)',
  font: 'inherit',
}
// The selected look — the 1 #DDD edge, a 6 Secondary 200 ring inside it, a small 30% shadow, white — is the cards' hover now
// (.cre-e2e-package-card:hover, inviteFlow.css; 2026-10-29, Eric).

// 4 less above the package name (2026-10-27, Eric; was 28 all round).
// Condensed (Figma 548:3477): 14 above, 10 between. The Purchase button sits in the bottom padding — 28, plus its 39 and the 20
// over it until the condense lifts it into the price's row.
const OPTION_BODY: CSSProperties = {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: pinLerp(20, 10),
  paddingTop: 0, // 24 less on the page, 14 less condensed (2026-10-27, Eric; was 24 / 14) — the label sits right under the strip
  paddingRight: 28,
  paddingBottom: pinLerp(87, 20, 'py'), // 20 condensed (2026-10-27, Eric; was the design's 28)
  paddingLeft: 28,
}

const OPTION_TITLE: CSSProperties = {
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: pinLerp(24, 20), // 20 / 26 compact (2026-10-28, Eric; the design's 18 / 24)
  lineHeight: pinLerp(34, 26),
  color: 'var(--color-text-primary)',
}

// Condensed, as tall as the button beside it, the old price a space from the new.
// The two prices on one baseline (2026-10-27, Eric); wrap only so align-content can still centre that line in the row.
const OPTION_PRICE_ROW: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'baseline',
  alignContent: 'center',
  gap: pinLerp(16, 6),
  minHeight: pinLerp(32, 34),
}
/* Avenir Book. Condensed, 20 and 12 with a 46 strike — under the design's 22 / 14 / 53 so the Purchase labels keep 8 either side
   in a 322 card (2026-10-27, Eric). */
const OPTION_PRICE: CSSProperties = { fontFamily: 'var(--font-e2e-avenir)', fontWeight: 500, // Medium, a step up from Book (2026-10-27, Eric)
   fontSize: pinLerp(28, 20), lineHeight: pinLerp(32, 26), color: 'var(--color-text-primary)' }
const OPTION_WAS: CSSProperties = { position: 'relative', fontFamily: 'var(--font-e2e-avenir)', fontWeight: 400, fontSize: pinLerp(18, 12), lineHeight: pinLerp(32, 26), color: 'var(--color-neutral-600)' } // a step darker (2026-10-27, Eric)
/* The brick strike, 68 long at -7.43°, 1 thick (2026-10-27, Eric; was 2.15 — the SVG stretches to fit). */
const OPTION_STRIKE: CSSProperties = { position: 'absolute', left: -2, top: '50%', width: pinLerp(68, 46), height: 1, transform: 'translateY(-50%) rotate(-7.43deg)' }


/* The single-product card's body (2026-10-28, Eric): OPTION_BODY's padding and type, laid across — the title, then the price over its
   Purchase at the right, their bottoms level. The Purchase sits in the flow here, so the bottom padding is only the button's own 28 / 20. */
const SINGLE_BODY: CSSProperties = {
  ...OPTION_BODY,
  flexDirection: 'row',
  alignItems: 'flex-end',
  justifyContent: 'space-between',
  gap: 32,
  paddingTop: 20, // under the tab, which now carries the package's name (2026-10-28, Eric: 12, then 8 more)
  paddingBottom: pinLerp(36, 28), // 8 more under the title and the Purchase (2026-10-28, Eric)
}
/* A step up from the card's title (2026-10-28, Eric): 24 / 30 compact, 28 / 36 full — the page's next size up. */
const SINGLE_TITLE: CSSProperties = { ...OPTION_TITLE, minWidth: 0, fontSize: pinLerp(28, 24), lineHeight: pinLerp(36, 30) }
const SINGLE_BUY_COLUMN: CSSProperties = { flex: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: pinLerp(6, 2) } // 4 less over the Purchase (2026-10-28, Eric)
const SINGLE_BUY: CSSProperties = {
  ...ADD_TO_CART,
  height: pinLerp(39, 34),
  borderRadius: pinLerp(5, 8),
  fontSize: pinLerp(18, 15),
  whiteSpace: 'nowrap',
  paddingTop: pinLerp(2, 0),
  paddingRight: 24,
  paddingBottom: 0,
  paddingLeft: 24,
}

/* The page cards' Purchase under the price, across the card (2026-10-29, Eric). */
const STACKED_BUY: CSSProperties = { ...SINGLE_BUY, alignSelf: 'stretch' }

/* Under each card: its description, then what sets it apart. */

/* The shared sections in a frame: no fill, the resting package card's 1px #DDD edge (2026-10-27, Eric; was a Secondary 100 band). */
// No edge now either (2026-10-27, Eric).
// 32 on the left (2026-10-28, Eric; was 40, then 0), in line with the cards and the comparison above.
const SHARED: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 40,
  paddingTop: 48, // 8 more above (2026-10-28, Eric)
  paddingRight: 32, // as the left (2026-10-28, Eric)
  paddingBottom: 40,
  paddingLeft: 32,
  borderRadius: 10,
}

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
// Flush with the ground's 32, so the grid lines up with the cards and "Select your Florida package:" above (2026-10-28, Eric;
// it sat 8 further in).
const COMPARE: CSSProperties = { width: '100%', margin: 0, borderCollapse: 'collapse', tableLayout: 'fixed' }
/* The comparison's row rules: 40% of the way from Secondary 200 to 300 (2026-10-29, Eric; 300, then 200). */
const COMPARE_RULE = 'color-mix(in srgb, var(--color-secondary-300) 40%, var(--color-secondary-200))'
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
  borderTop: `1px solid ${COMPARE_RULE}`,
  borderBottom: `1px solid ${COMPARE_RULE}`,
}
const COMPARE_MARK: CSSProperties = { width: 120, textAlign: 'center' }
/* Premier's column, header included, in flat Secondary 100 (2026-10-29, Eric: 200, then 100; it was the PICKED package's column,
   fading from 200 down the rows, and moved with each click on a card). */
// On the Secondary 100 ground now, so 60% of the way to 200 to show (2026-10-29, Eric: 30%, 50%, then 60%).
const PREMIER_SHADE: CSSProperties = { background: 'color-mix(in srgb, var(--color-secondary-200) 60%, var(--color-secondary-100))' }
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
  borderBottom: `1px solid ${COMPARE_RULE}`,
}
/* Single, with no header row, the rule over the first item stays (2026-10-28, Eric). */
const COMPARE_FIRST_RULE: CSSProperties = { borderTop: `1px solid ${COMPARE_RULE}` }
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
  borderBottom: `1px solid ${COMPARE_RULE}`,
}
