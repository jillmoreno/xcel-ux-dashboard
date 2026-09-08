import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, beforeEach } from 'vitest'
import { CourseCard, type CourseCardData } from '@/components/courses/CourseCard'
import { MyCoursesPage } from '@/pages/MyCoursesPage'
import {
  AccountProvider,
  type Brand,
  defaultMemberTier,
} from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { LoFiProvider } from '@/context/LoFiContext'
import {
  CERT_ACTION_META,
  certificateForCourse,
  certificatePdfUrl,
  certificateStateForCourse,
  certificatesFor,
} from '@/data/certificateFixtures'
import { myCoursesFor } from '@/data/myCoursesFixtures'

/**
 * The footer marker slot, and the kebab that now has somewhere to go.
 *
 * The marker used to be a caller-supplied boolean that `LearningPathPage`
 * passed as `course.status === 'complete'` — the card asserted a certificate
 * existed purely because the course had finished, on the one surface that
 * opted in, and said nothing at all in My Courses. Every assertion below is
 * about that over-claim being gone.
 */

const ALL_BRANDS: Brand[] = ['cre', 'mckissock', 'elite', 'fitzgerald', 'stc', 'xcel']

function seedAccount(brand: Brand) {
  window.localStorage.setItem(
    'cgp.account',
    JSON.stringify({ brand, tier: defaultMemberTier(brand) }),
  )
}

/** A compact card in a real provider tree, so the marker's brand lookup works. */
function renderCard(data: CourseCardData, brand: Brand = 'cre') {
  seedAccount(brand)
  return render(
    <MemoryRouter>
      <AccountProvider>
        <CourseCard data={data} compact />
      </AccountProvider>
    </MemoryRouter>,
  )
}

/** A course from the real fixtures, so the test can't drift from the demo. */
function course(brand: Brand, id: string): CourseCardData {
  const found = myCoursesFor(brand).find((c) => c.id === id)
  if (!found) throw new Error(`no fixture course ${id} on ${brand}`)
  return found
}

const marker = () => screen.queryByText(/^Certificate (Issued|Pending)$/)

beforeEach(() => {
  window.localStorage.clear()
})

describe('the certificate marker', () => {
  it('shows Certificate Issued for a completed course with an issued certificate', () => {
    renderCard(course('cre', 'mc-agency-law'))
    expect(screen.getByText('Certificate Issued')).toBeInTheDocument()
  })

  it('shows Certificate Pending for a completed course whose certificate needs an action', () => {
    renderCard(course('cre', 'mc-bpo'))
    expect(screen.getByText('Certificate Pending')).toBeInTheDocument()

    // …and NEVER the reason (decision 3). The five reasons live on the
    // certificate page; they also physically do not fit — the slot is ~207px
    // and the chip is `nowrap`, while the longest reason measures ~327px, so it
    // would clip rather than wrap. Swept over all five so adding one to the
    // chip fails here rather than in a screenshot.
    const card = screen.getByText('Certificate Pending').closest('.cre-course-card')!
    for (const meta of Object.values(CERT_ACTION_META)) {
      expect(within(card as HTMLElement).queryByText(meta.pendingLabel)).toBeNull()
    }
  })

  it('shows ISSUED — not Pending — when an issued certificate is awaiting roster reporting', () => {
    // ⚠ THE TRAP. `Certificate` has two states that both say "pending" and mean
    // opposite things: `status: 'action-required'` (the certificate does not
    // exist yet) and `reporting: 'pending-roster'` (it exists, the credit just
    // hasn't reached the state board). Keying the marker off the substring
    // rather than off `status` inverts them, on exactly the certificates a
    // learner is most likely to be checking.
    const cert = certificatesFor('cre').find((c) => c.courseId === 'mc-workforce-housing')
    expect(cert?.status).toBe('completed')
    expect(cert?.reporting?.status).toBe('pending-roster')

    renderCard(course('cre', 'mc-workforce-housing'))
    expect(screen.getByText('Certificate Issued')).toBeInTheDocument()
    expect(screen.queryByText('Certificate Pending')).toBeNull()
  })

  it('shows NO marker for a completed course with no certificate', () => {
    /**
     * The honest default. Not "Issued" — we do not know, and guessing is the
     * over-claim the join replaced.
     *
     * ⚠ SYNTHETIC ON PURPOSE, and it has to be. This used a real fixture
     * (`mc-millennials-3`) until 2026-09-08, when every completed course was
     * given a certificate so no completed card renders blank — see "gives EVERY
     * completed course a certificate" below. That makes the two tests look
     * contradictory and they are not: the DATA guarantees a certificate exists,
     * and this guarantees the CARD still refuses to invent one if it doesn't.
     * Losing this would mean the next completed course added without a
     * certificate silently claims to have one.
     */
    const orphan: CourseCardData = {
      ...course('cre', 'mc-agency-law'),
      id: 'mc-not-in-any-certificate-fixture',
    }
    expect(certificateStateForCourse('cre', orphan.id)).toBeNull()
    renderCard(orphan)
    expect(marker()).toBeNull()
  })

  it('lets Jump Back In win the slot over a certificate', () => {
    // Precedence (decision 5). In practice these can never collide — the Jump
    // Back In course is the one you left off on, so it is never complete — but
    // the order is asserted so a refactor can't quietly reverse it.
    seedAccount('cre')
    render(
      <MemoryRouter>
        <AccountProvider>
          <CourseCard data={course('cre', 'mc-agency-law')} compact jumpBackIn />
        </AccountProvider>
      </MemoryRouter>,
    )
    expect(screen.getByText('Jump Back In')).toBeInTheDocument()
    expect(marker()).toBeNull()
  })

  it('shows no marker on an in-progress course, whatever the fixtures say', () => {
    // `mc-stc-sie` HAS a certificate record pointing at it; the course is
    // in-progress, so the marker stays off. Guards the `status === 'completed'`
    // half of the condition independently of the certificate half.
    expect(certificateStateForCourse('stc', 'mc-stc-sie')).not.toBeNull()
    renderCard(course('stc', 'mc-stc-sie'), 'stc')
    expect(marker()).toBeNull()
  })
})

describe('the issued marker is a link to the certificate', () => {
  it('opens in a new tab, safely, and announces that it does', () => {
    renderCard(course('cre', 'mc-agency-law'))
    const link = screen.getByRole('link', { name: /Certificate Issued/i })
    expect(link).toHaveAttribute('target', '_blank')
    // `noopener` is the one that matters — without it the opened tab can
    // reach back through `window.opener`.
    expect(link.getAttribute('rel')).toContain('noopener')
    expect(link).toHaveAccessibleName(/opens in a new tab/i)
  })

  it('makes the pending marker a BUTTON, not a link — it opens a sheet, not a URL', () => {
    // Both markers look the same on purpose; only what they do differs. An
    // `<a href>` here would promise a destination, break middle-click, and
    // misreport to assistive tech.
    renderCard(course('cre', 'mc-bpo'))
    expect(screen.getByRole('button', { name: /Certificate Pending/i })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Certificate Pending/i })).toBeNull()
  })

  it('opens the Certificate Details sheet when the pending marker is clicked', () => {
    renderCard(course('cre', 'mc-bpo'))
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /Certificate Pending/i }))
    // The SAME panel the Course Details sheet opens, so the five pending
    // reasons keep one implementation across both surfaces.
    expect(screen.getByRole('heading', { name: 'Certificate Details' })).toBeInTheDocument()
    expect(screen.getByText(/Survey Required/i)).toBeInTheDocument()
  })

  it('still keeps the reason off the marker itself', () => {
    // Decision 3 survives the marker becoming interactive: the chip named no
    // reason and neither does the button. The sheet it opens is where they live.
    renderCard(course('cre', 'mc-bpo'))
    const marker = screen.getByRole('button', { name: /Certificate Pending/i })
    for (const meta of Object.values(CERT_ACTION_META)) {
      expect(marker.textContent).not.toContain(meta.pendingLabel)
    }
  })

  it('does not fire the card activation when the pending marker is clicked', () => {
    let activated = 0
    seedAccount('cre')
    render(
      <MemoryRouter>
        <AccountProvider>
          <CourseCard
            data={course('cre', 'mc-bpo')}
            compact
            onActivate={() => {
              activated += 1
            }}
          />
        </AccountProvider>
      </MemoryRouter>,
    )
    // Exact name, not a regex: with `onActivate` the CARD is itself
    // `role="button"` and its accessible name contains all of its text,
    // including the marker's, so a loose match finds both.
    fireEvent.click(screen.getByRole('button', { name: 'Certificate Pending' }))
    expect(activated).toBe(0)
  })

  it('makes Jump Back In an IN-APP link, not a new-tab one', () => {
    // All three markers are interactive now; what separates them is where they
    // go. This one resumes a course inside the app, so it is a router link with
    // no `target` — the certificate marker leaves for a document and opens a
    // tab, and the pending marker goes nowhere at all.
    // (This asserted that Jump Back In was NOT a link until 2026-09-08.)
    seedAccount('cre')
    render(
      <MemoryRouter>
        <AccountProvider>
          <CourseCard data={course('cre', 'mc-agency-law')} compact jumpBackIn />
        </AccountProvider>
      </MemoryRouter>,
    )
    const link = screen.getByRole('link', { name: /Jump Back In/i })
    expect(link).toHaveAttribute('href', '/courses/mc-agency-law')
    expect(link).not.toHaveAttribute('target')
  })

  it('never fires the card activation it sits inside', () => {
    // On the Jump Back In tile the card itself is clickable. Without
    // `stopPropagation`, opening your certificate would also launch the course
    // behind it.
    let activated = 0
    seedAccount('cre')
    render(
      <MemoryRouter>
        <AccountProvider>
          <CourseCard
            data={course('cre', 'mc-agency-law')}
            compact
            onActivate={() => {
              activated += 1
            }}
          />
        </AccountProvider>
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('link', { name: /Certificate Issued/i }))
    expect(activated).toBe(0)
  })

  it('sets NO inline text-decoration — the hover underline depends on it', () => {
    // ⚠ THE REGRESSION THIS EXISTS FOR. The link shipped with an inline
    // `text-decoration: none`, which outranks `.cre-tag-cert-link:hover` on
    // specificity, so the underline never appeared and it had to be reported.
    // The resting state belongs in tokens.css. Same trap as the `cta-500` link
    // colours (a11y C6): an inline value makes a stylesheet rule unreachable.
    //
    // jsdom does not apply the stylesheet, so this cannot assert the hover
    // result — but the inline attribute IS the failure, and that is visible.
    renderCard(course('cre', 'mc-agency-law'))
    const link = screen.getByRole('link', { name: /Certificate Issued/i })
    expect(link.style.textDecoration).toBe('')
    // Colour is inline on purpose (it is a token reference, not a state), so
    // this is specifically about the property the hover rule needs to win.
    expect(link.style.color).toBe('var(--color-accent-link)')
  })

  it('resolves no url for a certificate that is not issued', () => {
    // The resolver, not the render — a pending certificate has no document, and
    // this is the gate that keeps the link off it.
    expect(certificatePdfUrl(certificateForCourse('cre', 'mc-bpo'))).toBeNull()
    expect(certificatePdfUrl(certificateForCourse('cre', 'mc-agency-law'))).not.toBeNull()
    expect(certificatePdfUrl(null)).toBeNull()
  })
})

describe('the join', () => {
  it('never resolves an external certificate — they carry no courseId', () => {
    for (const brand of ALL_BRANDS) {
      for (const cert of certificatesFor(brand).filter((c) => c.status === 'external')) {
        expect(cert.courseId, `${cert.id} is external and should have no courseId`).toBeUndefined()
      }
    }
  })

  it('gives each course at most ONE certificate, per brand', () => {
    // `certificateStateForCourse` uses `.find()`, so two certificates on one
    // course would make the marker depend on array order — an issued and a
    // pending certificate for the same course would resolve to whichever was
    // authored first. Cheap to check, invisible when it breaks.
    for (const brand of ALL_BRANDS) {
      const ids = certificatesFor(brand)
        .map((c) => c.courseId)
        .filter((id): id is string => id != null)
      expect(new Set(ids).size, `${brand} has two certificates on one course`).toBe(ids.length)
    }
  })

  it('gives EVERY completed course a certificate, on every brand', () => {
    /**
     * The card refuses to guess: a completed course with no certificate record
     * shows no marker at all, because assuming "Issued" from a completed status
     * is exactly the over-claim the join replaced. That makes this a DATA
     * invariant rather than a rendering one — the only way every completed card
     * carries a marker is for every completed course to have a certificate.
     *
     * Six were missing when this was written (2 CRE, 4 McKissock) and the cards
     * rendered blank. This fails the moment someone adds a completed course
     * without one, which is the only way it stays true.
     */
    const gaps: string[] = []
    for (const brand of ALL_BRANDS) {
      for (const c of myCoursesFor(brand)) {
        if (c.myStatus !== 'completed') continue
        if (certificateStateForCourse(brand, c.id) === null) gaps.push(`${brand}/${c.id}`)
      }
    }
    expect(gaps).toEqual([])
  })

  it('points every courseId at a course that actually exists', () => {
    // A typo'd id is silently indistinguishable from "no certificate" — the
    // card just shows nothing. This is the only thing that catches it.
    for (const brand of ALL_BRANDS) {
      const courseIds = new Set(myCoursesFor(brand).map((c) => c.id))
      for (const cert of certificatesFor(brand)) {
        if (!cert.courseId) continue
        // Learning Path courses (`lp-…`) live in learningFixtures, not here.
        if (cert.courseId.startsWith('lp-')) continue
        expect(courseIds.has(cert.courseId), `${cert.id} → unknown course ${cert.courseId}`).toBe(
          true,
        )
      }
    }
  })
})

describe('the kebab', () => {
  it('opens the details panel from a My Courses card', () => {
    seedAccount('cre')
    render(
      <MemoryRouter initialEntries={['/my-learning/courses']}>
        <AccountProvider>
          <FeatureFlagProvider>
            <LoFiProvider>
              <MyCoursesPage />
            </LoFiProvider>
          </FeatureFlagProvider>
        </AccountProvider>
      </MemoryRouter>,
    )
    // Every kebab on this page was a dead control before: rendered, labelled
    // for screen readers, wired to nothing.
    const kebab = screen.getAllByRole('button', { name: /more actions for/i })[0]
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(kebab)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('does not also trigger the card activation it sits inside', () => {
    // The kebab `stopPropagation`s. On the activatable Jump Back In tile that
    // is the difference between opening details and launching the course.
    let activated = 0
    render(
      <MemoryRouter>
        <AccountProvider>
          <CourseCard
            data={course('cre', 'mc-agency-law')}
            mediaLeft
            onActivate={() => {
              activated += 1
            }}
            onKebab={() => {}}
          />
        </AccountProvider>
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('button', { name: /more actions for/i }))
    expect(activated).toBe(0)
  })
})
