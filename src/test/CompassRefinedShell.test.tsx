import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { CompassJeffMvpShell } from '@/components/learning/CompassJeffMvpShell'
import { CompassRefinedShell } from '@/components/learning/CompassRefinedShell'
import {
  REFINED_PAGE_SOURCE,
  refinedSourceFor,
  type RefinedSlot,
} from '@/components/learning/compassRefinedPages'
import { JEFF_MVP_PAGES, JEFF_MVP_SUBPAGES } from '@/data/compassJeffMvpFixtures'
import {
  REFINED_OVERVIEW_TITLE,
  REFINED_PAGE_TITLES,
  REFINED_RAIL_LABELS,
} from '@/data/compassRefinedCopy'
import { READINESS_STAGES } from '@/data/compassReadinessFixtures'

/**
 * THE SEAM BETWEEN REFINED AND JEFF'S — 2026-11-10.
 *
 * The whole claim of that change is that it moved nothing: Refined got its
 * own shell so its pages could be edited without editing his, and every slot
 * still points at his component except the one that was already Refined's.
 * A refactor that quietly changed a page would be the worst version of this,
 * because the diff looks like plumbing.
 *
 * So this suite is two things: the two shells draw the same markup for every
 * page whose slot says `jeff`, and the map covers every page there is.
 */

function wrap(node: React.ReactNode) {
  return render(
    <MemoryRouter>
      <AccountProvider>
        <FeatureFlagProvider>{node}</FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

const RAIL_PAGES = JEFF_MVP_PAGES.map((p) => p.page)
const SUB_PAGES = JEFF_MVP_SUBPAGES.map((p) => p.page)
const ALL_PAGES = [...RAIL_PAGES, ...SUB_PAGES]

describe('the Refined slot map', () => {
  it('names a source for every page of the MVP, and for the rail', () => {
    /* ⚠ THE FALLBACK IN `refinedSourceFor` SHOULD NEVER FIRE. It is there so
       a page added to his MVP renders HIS rather than nothing; this case is
       what keeps it from becoming the way pages are added. */
    const slots = Object.keys(REFINED_PAGE_SOURCE).sort()
    expect(slots).toEqual([...ALL_PAGES, 'rail'].sort())
  })

  it('leaves the lesson his, and nothing else', () => {
    /* ⚠ ONE SLOT, AND THE REASON IS STRUCTURAL. The 2026-11-10 header change
       reaches every page that draws a header; `CompassJeffCourse` is a
       full-window takeover that draws none and carries no `cjm-` class, so
       it was outside the fork. When the lesson is refined, this list empties
       and the case says so. */
    const his = (Object.keys(REFINED_PAGE_SOURCE) as RefinedSlot[]).filter(
      (s) => refinedSourceFor(s) === 'jeff',
    )
    expect(his).toEqual(['course'])
  })
})

/**
 * REFINED'S FIRST DESIGN DECISIONS — 2026-11-10, the page header.
 *
 * The fork that made these possible was proved inert in its own commit:
 * every page rendered identically to Jeff's once the prefix was normalised.
 * That check retires here, because the pages deliberately differ now. What
 * replaces it is narrower and more useful — the four things that were asked
 * for, held page by page, so a later edit cannot quietly undo one of them on
 * eleven pages and leave it on the twelfth.
 */
describe('the course eyebrow is on every page', () => {
  /* ⚠ THE RAIL PAGES, NOT THE SESSIONS. "Every page" is every page with a
     header; a question set, a flashcard study session and the simulated exam
     are full-window sessions that draw no page header at all, and the
     simulated exam is imitating a Pearson VUE test centre — a course eyebrow
     on that screen breaks the one thing it exists to get right. */
  const HEADED = RAIL_PAGES

  for (const page of HEADED) {
    it(`${page}`, () => {
      const { container } = wrap(<CompassRefinedShell page={page} onSelectPage={() => {}} />)
      /* Three headers draw it: the shared head, the Refined Readiness page's
         own, and the stage-aware Overview's — each with its own prefix
         because each page is frozen on its own fork. */
      const brow = container.querySelector(
        '.crf-head__eyebrow, .cre-rdr-eyebrow, .crf-rd-brow',
      )
      expect(brow, `${page} draws no course eyebrow`).toBeTruthy()
      const t = (brow?.textContent ?? '').replace(/\s+/g, ' ')
      expect(t).toContain('Florida Life and Health Pre-licensing')
      /* ⚠ THE DATE RIDES BESIDE IT, dot-separated — the direct ask. It was a
         line in the Overview's meta row and appeared on no other page. */
      expect(t).toContain('Access ends Jan 20, 2027')
      expect(t).toContain('·')
    })
  }

  it('is the page title above it, not instead of it', () => {
    const { container } = wrap(<CompassRefinedShell page="overview" onSelectPage={() => {}} />)
    const h1 = container.querySelector('h1')
    /* ⚠ THIS ASSERTED "YOUR EXAM PREP" FOR A DAY, and the assertion was
       describing the bug. The title was a function of the learner's state, so
       the default (`p2`, the prep series) renamed the page while the rail row
       still read Overview. One title now, pinned across all sixteen states
       below. */
    expect(h1?.textContent).toBe(REFINED_OVERVIEW_TITLE)
    /* The eyebrow precedes the title in the DOM, which is what makes it an
       eyebrow rather than a subtitle — the course line sat UNDER the title. */
    const brow = container.querySelector('.crf-rd-brow')!
    expect(brow.compareDocumentPosition(h1!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})

describe('the two pills are gone', () => {
  it('from the Overview header, where they were the only place they appeared', () => {
    const { container } = wrap(<CompassRefinedShell page="overview" onSelectPage={() => {}} />)
    const t = (container.textContent ?? '').replace(/\s+/g, ' ')
    expect(t).not.toContain('Open access · move freely')
    /* ⚠ BY CLASS, NOT BY STRING, and the difference bit once. "Learn +
       prepare" is ALSO the Your-next-step eyebrow ("Learn + prepare ·
       Readiness 62%"), which is a different element and was not what was
       asked to go. Asserting on the words would delete a section's eyebrow
       the next time someone made this pass. */
    expect(container.querySelectorAll('.crf-pill--phase')).toHaveLength(0)
    expect(container.querySelectorAll('.crf-pill--quiet')).toHaveLength(0)
    /* ⚠ HIS STILL HAS THEM. The removal is Refined's decision, not a repair
       of his page — if this stops being true, the fork has leaked. */
    const his = wrap(<CompassJeffMvpShell page="overview" onSelectPage={() => {}} />)
    expect(his.container.textContent).toContain('Open access · move freely')
  })
})

describe('nothing under 32px is set in the display serif', () => {
  /* ⚠ THE CLASS IS GONE, NOT REDEFINED. His `serif` class put the display
     face on 22 elements, 21 of them under 32px. Refined drops the class from
     the markup and puts the face on the one element over the line, so a 28px
     heading cannot quietly become serif again by picking the class up. */
  for (const page of ALL_PAGES) {
    /* ⚠ THE LESSON IS EXEMPT BECAUSE IT IS STILL HIS. `course` is the one
       slot `compassRefinedPages.ts` leaves at `jeff` — a full-window takeover
       with its own stylesheet, outside the header fork — so its five serif
       headings are Jeff's decision, not a leak. It joins this case the day
       the lesson is refined. */
    if (refinedSourceFor(page as RefinedSlot) === 'jeff') continue
    it(`${page}`, () => {
      const { container } = wrap(<CompassRefinedShell page={page} onSelectPage={() => {}} />)
      expect(container.querySelectorAll('.crf-serif')).toHaveLength(0)
      /* ⚠ AN ALLOW-LIST, BECAUSE JSDOM HAS NO LAYOUT. The rule is about
         rendered size and the stylesheets are stubbed in this environment, so
         nothing here can read a font-size. These two were measured in the
         running build and are the only elements over 32px that carry the
         class: the Readiness title (40px) and the hero's ring figure, which
         is 26px in its base rule and 40px inside the hero. Anything else
         picking the class up fails, which is what this case is for. */
      const OVER_32 = ['cre-rdr-h1', 'cre-rdr-ring__num', 'crf-rd-h1']
      for (const el of container.querySelectorAll('.serif')) {
        expect(
          OVER_32.some((c) => el.classList.contains(c)),
          `${el.tagName}.${[...el.classList].join('.')} is under 32px and must not be serif`,
        ).toBe(true)
      }
    })
  }
})

describe('the page Refined owns', () => {
  it('is Refined’s on the Refined shell and his on his', () => {
    const refined = wrap(<CompassRefinedShell page="readiness" onSelectPage={() => {}} />)
    expect(refined.container.querySelector('.cre-rdr')).toBeTruthy()
    refined.unmount()
    const his = wrap(<CompassJeffMvpShell page="readiness" onSelectPage={() => {}} />)
    expect(his.container.querySelector('.cre-rdr')).toBeNull()
  })

  /* ⚠ "HIS SHELL CARRIES NO REFINED WIRING" IS NOT PINNED HERE, and that is
     deliberate rather than an omission. The `readiness` prop is gone from
     `CompassJeffMvpShell`'s type, so `tsc` refuses any call that passes it —
     a stronger guard than a runtime assertion, and one that fires at the
     call site rather than in a suite. A `Function.length` check would have
     been vacuous (a component takes one props object however many fields it
     destructures) and a `toString()` grep breaks under minification. */
})

/**
 * THE HEADER IS THE EYEBROW AND THE TITLE — 2026-11-10, Jillienne: "there
 * should never be copy between the eyebrow and title - or after it. every
 * page should have eyebrow/title, and everything else is separate from that
 * component."
 *
 * ⚠ THIS IS THE CASE THAT KEEPS IT TRUE. The header used to take `lead`,
 * `below`, `leadClass` and `aside`, and seven pages used them — so "the
 * header" meant something different on every page. The props are gone, but a
 * page can always put a paragraph back inside the `<header>` by hand, and
 * nothing else would notice.
 */
describe('the page header holds nothing but the eyebrow and the title', () => {
  for (const page of RAIL_PAGES) {
    it(`${page}`, () => {
      const { container } = wrap(<CompassRefinedShell page={page} onSelectPage={() => {}} />)
      const header = container.querySelector('header')
      expect(header, `${page} draws no header element`).toBeTruthy()
      /* Exactly two things, in this order, however the page wraps them. */
      const brow = header!.querySelector('.crf-head__eyebrow, .cre-rdr-eyebrow, .crf-rd-brow')
      const h1 = header!.querySelector('h1')
      expect(brow, `${page}: no course eyebrow in the header`).toBeTruthy()
      expect(h1, `${page}: no title in the header`).toBeTruthy()
      /* ⚠ NOTHING BETWEEN THEM, which is the half that was wrong on the
         stage pages — the greeting sat between the eyebrow and the title. */
      expect(brow!.nextElementSibling).toBe(h1)
      /* ⚠ AND NOTHING AFTER. A `<p>` anywhere in the header is a lead that
         has crept back in; the one on each page belongs under it. */
      expect([...header!.querySelectorAll('p')].filter((p) => p !== brow)).toEqual([])
    })
  }
})

/**
 * AND NOTHING BETWEEN THE HEADER AND THE PAGE — 2026-11-11, Jillienne on the
 * stage Overview's greeting and meta row: "these 2 lines also fall into that
 * catagory of not needed."
 *
 * ⚠ THE HEADER CASE ABOVE WOULD NOT HAVE CAUGHT THESE. They were siblings of
 * the header, not children of it — the day before, they had been moved OUT of
 * it to satisfy exactly that rule. Passing that case is why they survived, so
 * this one asks the other half of the question: what follows the header is
 * the page, not more header.
 */
describe('the page starts straight after the header', () => {
  for (const page of RAIL_PAGES) {
    it(`${page}`, () => {
      const { container } = wrap(<CompassRefinedShell page={page} onSelectPage={() => {}} />)
      const header = container.querySelector('header')!
      let el = header.nextElementSibling
      /* A lead is page content and is allowed — it is what the header's own
         `lead` prop became. A SECOND loose paragraph after it is the shape
         this case exists to refuse. */
      if (el?.tagName === 'P' || el?.classList.contains('crf-pagelead')) el = el.nextElementSibling
      expect(
        el?.tagName,
        `${page}: ${el?.tagName}.${[...(el?.classList ?? [])].join('.')} stands between the header and the page`,
      ).not.toBe('P')
    })
  }
})

/**
 * THE OVERVIEW IS CALLED ONE THING — 2026-11-11, Jillienne on the default
 * state: "why does this say exam prep when we are on the overview page".
 *
 * ⚠ SIXTEEN STATES, TWO COMPONENTS, ONE TITLE. The P series renders a
 * different component from the Q and U series, and each used to carry its own
 * hardcoded title — so the page renamed itself three states out of sixteen
 * while the rail row did not. This walks every state rather than the two
 * components, because the failure was never visible on a component: it was
 * visible on a reviewer landing on p2.
 */
describe('the Overview keeps its name through every learner state', () => {
  for (const stage of READINESS_STAGES) {
    it(`${stage.key} — ${stage.label}`, () => {
      const { container } = wrap(
        <CompassRefinedShell page="overview" onSelectPage={() => {}} stage={stage.key} />,
      )
      expect(container.querySelector('header h1')?.textContent).toBe(REFINED_OVERVIEW_TITLE)
    })
  }
})

/**
 * TITLE CASE, EVERYWHERE — 2026-11-11, Jillienne: "title case everywhere".
 *
 * ⚠ THE SET WAS MIXED AND NOBODY CHOSE IT: "Your Course" and "Prep Review"
 * against "Your readiness" and "Study planner", both conventions arriving
 * through the port from different screens of one file. Two cases here, and
 * they fail for different reasons: one if a page stops reading the map, the
 * other if something sentence-cased is written INTO it.
 */
describe('every page title is title case, and the rail agrees', () => {
  /* Lower-case words a title may legitimately contain — articles, short
     prepositions, conjunctions — and never as the first word. None of the
     current titles use one; the list is here so "Ready to Pass" would pass
     when somebody writes it. */
  const MINOR = new Set(['a', 'an', 'and', 'as', 'at', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to'])

  for (const [key, title] of Object.entries(REFINED_PAGE_TITLES)) {
    it(`${key} — "${title}"`, () => {
      title.split(' ').forEach((word, i) => {
        if (i > 0 && MINOR.has(word)) return
        expect(word[0], `"${title}": "${word}" is not capitalised`).toBe(word[0].toUpperCase())
      })
    })
  }

  it('the rail row and the page it opens are spelled the same way', () => {
    /* ⚠ THE ONE THAT ACTUALLY BIT. The rail read "Study planner" and its page
       read "Study Planner" — the same words, two spellings, one click apart.
       Only the rows whose label IS the page's name are held to this; Learn
       opens "Your Course" and Readiness opens "Your Readiness" by design. */
    for (const key of ['prep-review', 'practice', 'flashcards', 'exam-simulator', 'study-planner']) {
      expect(REFINED_RAIL_LABELS[key]).toBe(REFINED_PAGE_TITLES[key as keyof typeof REFINED_PAGE_TITLES])
    }
  })

  for (const page of RAIL_PAGES) {
    it(`${page} draws its title from the map`, () => {
      const { container } = wrap(<CompassRefinedShell page={page} onSelectPage={() => {}} />)
      const expected =
        page === 'overview'
          ? REFINED_OVERVIEW_TITLE
          : REFINED_PAGE_TITLES[page as keyof typeof REFINED_PAGE_TITLES]
      expect(container.querySelector('header h1')?.textContent).toBe(expected)
    })
  }
})

/**
 * TWO THINGS THAT ONLY APPEAR AT THE START — 2026-11-11.
 *
 * Both are the same shape of decision: copy that is true on day one and stale
 * every day after. Atlas settled the first of them on 2026-10-19 and its flag
 * note says so in as many words; these cases keep Refined agreeing with it
 * without the two surfaces sharing a line of code.
 */
describe('day-one copy appears at 0% and nowhere else', () => {
  const at = (stage: string) =>
    wrap(<CompassRefinedShell page="overview" onSelectPage={() => {}} stage={stage} />)

  it('the pace note is there on the first state', () => {
    const { container } = at('q1')
    const note = container.querySelector('.crf-focus__dayone')
    /* ⚠ THE OFFER, NOT THE SENTENCE — 2026-11-11, when `link` became the
       default. On that arm the explanation is gone and only the control
       remains, so asserting the prose would pin the arm rather than the
       behaviour this case is about: that something appears at 0%. */
    expect(note).toBeTruthy()
    expect(note?.textContent).toContain('Adjust')
  })

  it('and gone on every state after it', () => {
    /* ⚠ EVERY state, not a sampled one. The gate is arithmetic on the stage's
       percentage, so the state that breaks it would be whichever one happens
       to round to zero — exactly the one a spot check misses. */
    for (const stage of READINESS_STAGES) {
      if (stage.key === 'q1') continue
      const { container, unmount } = at(stage.key)
      const note = container.querySelector('.crf-focus__dayone')
      expect(note, `${stage.key} still shows the day-one pace note`).toBeNull()
      unmount()
    }
  })

  it('Rubi introduces herself where the stage carries an introduction', () => {
    const { container } = at('q1')
    const rubi = container.querySelector('.crf-rd-rubi')
    /* ⚠ BY NAME — 2026-11-11, "incorporate the users name". The account's
       persona is Jordan, and asserting the NAME rather than the greeting is
       what proves the title is built from the learner instead of typed. */
    expect(rubi?.textContent).toContain("Hi Jordan, I'm Rubi")
    /* ⚠ ONE ACTION, AND NO "Not now" — 2026-11-11. The decline belongs on
       the toast, which interrupts; this band is part of the page and there is
       nothing to decline. */
    expect([...container.querySelectorAll('.crf-rd-rubi-actions button')].map((b) => b.textContent)).toEqual(
      ['Talk with Rubi'],
    )
  })

  it('and leaves the task suggestions alone', () => {
    /* ⚠ THE SWAP IS BY LABEL, so this is the half that proves it is targeted:
       a state whose Rubi is a task keeps its own words and gets no "Not now",
       because there is nothing for declining a suggestion to mean here. */
    const { container } = at('q3')
    const rubi = container.querySelector('.crf-rd-rubi')
    expect(rubi?.textContent).not.toContain("I'm Rubi")
    expect(container.querySelectorAll('.crf-rd-rubi-actions button')).toHaveLength(1)
  })
})
