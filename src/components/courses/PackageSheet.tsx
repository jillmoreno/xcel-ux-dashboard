import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Monitor, Package as PackageIcon, StarSolid, X } from '@/icons'
import { Sheet } from '@/components/ui/Sheet'
import type { Package } from '@/data/catalogFixtures'
import { useAccount } from '@/context/AccountContext'
import { resolveCommerceState } from '@/data/commerce/entitlement'
import { imageForIndex } from '@/utils/courseImage'
import { ProductPriceSlot } from './ProductPriceSlot'

type IncludedCourse = {
  id: string
  title: string
  hours: number
  badge: 'mandatory' | 'elective'
  instructor: string
  state: string
  rating?: number
}

const INCLUDED_COURSES: IncludedCourse[] = [
  { id: 'pc-1', title: 'GA Categorical A 18-hr Foundations', hours: 6, badge: 'mandatory', instructor: 'Lori Schwartz, GA Real Estate Instructor', state: 'GA', rating: 4.8 },
  { id: 'pc-2', title: 'GA License Law Refresher', hours: 3, badge: 'mandatory', instructor: 'Lori Schwartz, GA Real Estate Instructor', state: 'GA' },
  { id: 'pc-3', title: 'Fair Housing Compliance', hours: 3, badge: 'mandatory', instructor: 'Marcus Williams, AQB Certified Instructor', state: 'GA', rating: 4.6 },
  { id: 'pc-4', title: 'Disclosure & Risk Reduction', hours: 3, badge: 'elective', instructor: 'Marcus Williams, AQB Certified Instructor', state: 'GA' },
  { id: 'pc-5', title: 'Modern Marketing for Agents', hours: 3, badge: 'elective', instructor: 'Sarah Chen, Real Estate Coach', state: 'GA', rating: 4.7 },
]

type Props = {
  open: boolean
  onClose: () => void
  data: Package | null
}

export function PackageSheet({ open, onClose, data }: Props) {
  const navigate = useNavigate()
  const { brand, tier } = useAccount()
  const [tab, setTab] = useState<'description' | 'included'>('included')

  if (!data) return null

  const state = resolveCommerceState(brand, tier, data)
  const isIncluded = state.kind === 'included'
  const isLocked = state.kind === 'locked'
  const handlePrimaryClick = () => {
    if (isLocked) {
      onClose()
      navigate('/membership/plans')
    }
    // TODO(enroll): wire included-enroll + paid add-to-cart when the commerce
    // endpoints are available.
  }

  return (
    <Sheet open={open} onClose={onClose} title="Purchase Package">
      <header
        style={{
          height: 100,
          flexShrink: 0,
          padding: '20px 24px 4px',
          background: 'var(--color-neutral-extra-light)',
          borderBottom: '1px solid var(--color-border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <button
          type="button"
          onClick={onClose}
          className="cre-sheet-close"
          style={{
            alignSelf: 'flex-start',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'transparent',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            fontFamily: 'var(--font-body)',
            fontSize: 16,
            fontWeight: 600,
            lineHeight: '24px',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <X size={14} aria-hidden />
          Close
        </button>
        <h2
          style={{
            margin: 0,
            fontFamily: 'var(--font-heading)',
            fontWeight: 500,
            fontSize: 28,
            lineHeight: 1.2,
            color: 'var(--color-primary-500)',
          }}
        >
          Purchase Package
        </h2>
      </header>
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--color-neutral-extra-light)' }}>
        <div style={{ background: 'var(--color-surface-card)', padding: '20px 24px 0' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', paddingBottom: 20 }}>
            <div
              aria-hidden
              style={{
                width: 80,
                height: 76,
                borderRadius: 6,
                background: 'var(--color-neutral-700)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-neutral-200)',
                flexShrink: 0,
              }}
            >
              <PackageIcon size={60} aria-hidden style={{ opacity: 0.5 }} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>
                {data.title}
              </span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 12 }}>
                {data.hours} {data.hours === 1 ? 'Hour' : 'Hours'}
              </span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 12 }}>{data.states.join(' | ')}</span>
              <ProductPriceSlot state={state} panel listPrice={data.price} style={{ marginTop: 4 }} />
              <button
                type="button"
                onClick={handlePrimaryClick}
                style={{
                  marginTop: 12,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '10px 28px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-action)',
                  color: '#fff',
                  border: 'none',
                  fontFamily: 'var(--font-body)',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {isIncluded ? 'Enroll' : isLocked ? 'See Membership Plans' : 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', padding: '8px 24px 0', borderBottom: '1px solid var(--color-border-subtle)' }}>
          <TabButton active={tab === 'description'} onClick={() => setTab('description')}>
            Description
          </TabButton>
          <TabButton active={tab === 'included'} onClick={() => setTab('included')}>
            Included Courses
          </TabButton>
        </div>

        <div style={{ padding: '20px 24px 32px' }}>
          {tab === 'description' ? <DescriptionTab /> : <IncludedCoursesTab />}
        </div>
      </div>
    </Sheet>
  )
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cre-membership-tab"
      data-active={active ? 'true' : 'false'}
      style={{
        flex: 1,
        position: 'relative',
        background: 'transparent',
        border: 'none',
        padding: '6px 8px 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        fontFamily: 'var(--font-body)',
        fontSize: 16,
        fontWeight: 600,
        lineHeight: '28px',
        cursor: 'pointer',
      }}
    >
      <span style={{ padding: '0 8px' }}>{children}</span>
      <span
        aria-hidden
        style={{
          width: '100%',
          height: 4,
          borderTopLeftRadius: 3,
          borderTopRightRadius: 3,
          background: active ? 'var(--color-tab-active)' : 'transparent',
        }}
      />
    </button>
  )
}

function DescriptionTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.5 }}>
      <section>
        <h3 style={sectionHeading}>Description</h3>
        <ul style={listReset}>
          <li>Bundled CE credit hours</li>
          <li>State-specific compliance</li>
          <li>One-time purchase</li>
          <li>1-year completion window</li>
        </ul>
      </section>
      <section>
        <h3 style={sectionHeading}>What's Included</h3>
        <ul style={bulletList}>
          <li>All required mandatory courses</li>
          <li>Curated electives selected for renewal</li>
          <li>Online proctored exam</li>
          <li>Certificate of completion</li>
          <li>Customer Support, 7 days a week</li>
        </ul>
      </section>
      <section>
        <h3 style={sectionHeading}>Courses Included</h3>
        <ol style={{ ...bulletList, listStyle: 'none', paddingLeft: 0 }}>
          {INCLUDED_COURSES.map((c) => (
            <li key={c.id}>
              <a href="#" className="cre-link-action" style={linkStyle}>
                {c.title}
              </a>
            </li>
          ))}
        </ol>
      </section>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>
        Must complete all included courses within one year of enrollment. Course progress for courses not completed
        will be lost after expiration.
      </p>
    </div>
  )
}

function IncludedCoursesTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {INCLUDED_COURSES.map((c, i) => (
        <IncludedCourseRow key={c.id} data={c} imageUrl={imageForIndex(i)} />
      ))}
    </div>
  )
}

function IncludedCourseRow({ data, imageUrl }: { data: IncludedCourse; imageUrl: string }) {
  return (
    <article
      className="cre-included-course-row"
      style={{
        display: 'flex',
        background: 'var(--color-surface-card)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
      }}
    >
      <div
        aria-hidden
        style={{
          width: 96,
          alignSelf: 'stretch',
          flexShrink: 0,
          background: `center / cover no-repeat url(${imageUrl})`,
        }}
      />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2, padding: 12 }}>
        <h4 style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, lineHeight: 1.3, color: 'inherit' }}>
          {data.title}
        </h4>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          <Monitor size={12} aria-hidden />
          Online
          <span aria-hidden style={{ color: 'var(--color-neutral-300)' }}>|</span>
          {data.badge === 'mandatory' ? 'Mandatory' : 'Elective'}
          <span aria-hidden style={{ color: 'var(--color-neutral-300)' }}>|</span>
          {data.hours} Hours
        </span>
        <span style={{ fontSize: 12 }}>{data.instructor}</span>
        <span style={{ fontSize: 12 }}>{data.state}</span>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
            {typeof data.rating === 'number' && (
              <>
                <StarSolid size={12} aria-hidden style={{ color: 'var(--color-warning-500)' }} />
                {data.rating.toFixed(1)}
              </>
            )}
          </span>
          <a href="#" style={{ color: 'var(--color-primary-700)', textDecoration: 'none', fontSize: 12, fontWeight: 600 }}>
            View Details
          </a>
        </div>
      </div>
    </article>
  )
}

const sectionHeading = {
  margin: '0 0 6px',
  fontFamily: 'var(--font-body)' as const,
  fontSize: 14,
  fontWeight: 700,
  color: 'var(--color-text-primary)',
}

const listReset = {
  margin: 0,
  paddingLeft: 0,
  listStyle: 'none' as const,
}

const bulletList = {
  margin: 0,
  paddingLeft: 20,
}

const linkStyle = {
  color: 'var(--color-action)',
  textDecoration: 'none' as const,
  fontWeight: 600,
}
