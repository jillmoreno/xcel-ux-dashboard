import { useEffect } from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AccountProvider, useAccount, type Brand } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'

/**
 * The empty-archive case, in its own file because it needs a module mock.
 *
 * `MyCoursesPage` gates the collection link on `archivedCount > 0`, and proving
 * the zero branch needs a fixture set with nothing archived. The LMS got that
 * for free: it asserted XCEL had no archived records, and some other brand
 * supplied the populated case.
 *
 * That stopped working when XCEL became the only brand. `CourseExpiry` needs an
 * archived+failed XCEL record — the decision 33-34 regression case, where the
 * old model stored `archived` inside `myStatus` and setting it overwrote the
 * outcome — so the same fixture set cannot also be empty.
 *
 * Mocking `myCoursesFor` to drop archived rows tests the REAL gate in the real
 * component. It lives in its own file because `vi.mock` is hoisted per module,
 * and applying it to ArchivedCollection.test.tsx would make that file's other
 * five assertions pass vacuously against an archive it had just emptied.
 */
vi.mock('@/data/myCoursesFixtures', async () => {
  const actual =
    await vi.importActual<typeof import('@/data/myCoursesFixtures')>(
      '@/data/myCoursesFixtures',
    )
  return {
    ...actual,
    myCoursesFor: (brand: Brand) => actual.myCoursesFor(brand).filter((c) => !c.archived),
  }
})

const { MyCoursesPage } = await import('@/pages/MyCoursesPage')
const { myCoursesFor } = await import('@/data/myCoursesFixtures')

function Seed({ brand }: { brand: Brand }) {
  const { brand: current, setAccount } = useAccount()
  useEffect(() => {
    if (current !== brand) setAccount(brand, 'member')
  }, [brand, current, setAccount])
  return null
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('the archived link when nothing is archived', () => {
  it('the mock actually empties the archive', () => {
    // Guard the guard: if the mock stopped applying, the assertion below would
    // pass for the wrong reason on a page that simply failed to render.
    expect(myCoursesFor('xcel').filter((c) => c.archived)).toHaveLength(0)
  })

  it('hides the link entirely — which is why the archive needs no empty state', () => {
    render(
      <MemoryRouter initialEntries={['/my-learning/courses']}>
        <FeatureFlagProvider>
          <AccountProvider>
            <Seed brand="xcel" />
            <MyCoursesPage />
          </AccountProvider>
        </FeatureFlagProvider>
      </MemoryRouter>,
    )
    // The page rendered — so a null link is the gate, not a crash.
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /view archived/i })).toBeNull()
  })
})
