import { useState } from 'react'
import { Crown, Monitor, StarSolid, X } from '@/icons'
import { Sheet } from '@/components/ui/Sheet'
import type { Membership } from '@/data/catalogFixtures'
import { imageForIndex } from '@/utils/courseImage'

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
  { id: 'ic-1', title: 'General Appraiser Market Analysis Highest and Best Use (30 hrs)', hours: 30, badge: 'elective', instructor: 'Dan Bradley, AQB Certified Instructor', state: 'KS' },
  { id: 'ic-2', title: 'The FHA Handbook 4000.1', hours: 7, badge: 'mandatory', instructor: 'Dan Bradley, AQB Certified Instructor', state: 'KS', rating: 4.7 },
  { id: 'ic-3', title: 'Statistics, Modeling, and Finance (15 hrs)', hours: 15, badge: 'elective', instructor: 'Dan Bradley, AQB Certified Instructor', state: 'KS' },
  { id: 'ic-4', title: 'General Appraiser Site Valuation and Cost Approach (30 hrs)', hours: 30, badge: 'elective', instructor: 'Dan Bradley, AQB Certified Instructor', state: 'KS' },
  { id: 'ic-5', title: 'General Appraiser Sales Comparison Approach (30 hrs)', hours: 30, badge: 'mandatory', instructor: 'Dan Bradley, AQB Certified Instructor', state: 'KS', rating: 4.8 },
  { id: 'ic-6', title: 'General Appraiser Income Approach (60 hrs)', hours: 60, badge: 'mandatory', instructor: 'Paul Lorenzen, Commercial Real Estate Broker', state: 'KS', rating: 4.7 },
  { id: 'ic-7', title: 'General Report Writing and Case Studies (30 hrs)', hours: 30, badge: 'mandatory', instructor: 'Dan Bradley, AQB Certified Instructor', state: 'KS', rating: 4.7 },
  { id: 'ic-8', title: 'Commercial Appraisal Review - Subject Matter Electives (15 hrs)', hours: 15, badge: 'mandatory', instructor: 'Dan Bradley, AQB Certified Instructor', state: 'KS', rating: 4.7 },
  { id: 'ic-9', title: 'Expert Witness for Commercial Appraisers - Subject matter Electives (15 hrs)', hours: 15, badge: 'mandatory', instructor: 'Dan Bradley, AQB Certified Instructor', state: 'KS' },
]

type Props = {
  open: boolean
  onClose: () => void
  data: Membership | null
}

export function MembershipSheet({ open, onClose, data }: Props) {
  const [tab, setTab] = useState<'description' | 'included'>('included')

  if (!data) return null

  return (
    <Sheet open={open} onClose={onClose} title="Purchase Membership">
      {/* Sheet header — 112px tall, holds × Close link and panel title */}
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
          Purchase Membership
        </h2>
      </header>
      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--color-neutral-extra-light)' }}>
        {/* Hero — white surface holds the product card */}
        <div style={{ background: 'var(--color-surface-card)', padding: '20px 24px 0' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', paddingBottom: 20 }}>
            <div
              aria-hidden
              style={{
                width: 80,
                height: 76,
                borderRadius: 6,
                background: 'var(--color-primary-600)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-primary-200)',
                flexShrink: 0,
              }}
            >
              <Crown size={60} aria-hidden style={{ opacity: 0.5 }} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>
                {data.title}
              </span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 12 }}>{data.hours} Hours</span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 12 }}>{data.states.join(' | ')}</span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, marginTop: 4 }}>
                ${data.price.toFixed(2)}
              </span>
              <button
                type="button"
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
                Add to Cart
              </button>
            </div>
          </div>
        </div>

        {/* Tabs — light gray surface */}
        <div style={{ display: 'flex', padding: '8px 24px 0', borderBottom: '1px solid var(--color-border-subtle)' }}>
          <TabButton active={tab === 'description'} onClick={() => setTab('description')}>
            Description
          </TabButton>
          <TabButton active={tab === 'included'} onClick={() => setTab('included')}>
            Included Courses
          </TabButton>
        </div>

        {/* Tab content — light gray surface */}
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
          <li>Online Only</li>
          <li>All required Courses</li>
          <li>Single State Certification</li>
          <li>Live Events</li>
          <li>Professional Development</li>
          <li>1-year access</li>
        </ul>
      </section>
      <section>
        <h3 style={sectionHeading}>Qualifying Education</h3>
        <ul style={bulletList}>
          <li>225-hours of online courses</li>
          <li>Printed Textbooks</li>
          <li>Study Plans</li>
          <li>Online Proctored Exams</li>
          <li>Single State Certificates</li>
          <li>Customer Support, 7 days a week</li>
          <li>1 year of access</li>
        </ul>
      </section>
      <section>
        <h3 style={sectionHeading}>Exclusive Licensing Subscription Benefits</h3>
        <h4 style={subHeading}>Live & Interactive Instruction</h4>
        <ul style={bulletList}>
          <li>Appraisal Instructor-Led Q&amp;A - Every Thursday 8:00 pm ET</li>
          <li>Monthly Pro-Series webinars</li>
        </ul>
        <h4 style={subHeading}>Career Success Tools</h4>
        <ul style={bulletList}>
          <li>Professional Development Resources and Job Aids</li>
          <li>McKissock Appraisal Community Access</li>
          <li>Professional discounts</li>
        </ul>
      </section>
      <section>
        <h3 style={sectionHeading}>Courses Included (take in this order)</h3>
        <ol style={{ ...bulletList, listStyle: 'none', paddingLeft: 0 }}>
          {INCLUDED_COURSES.map((c) => (
            <li key={c.id}>
              <a href="#" style={linkStyle}>
                {c.title}
              </a>
            </li>
          ))}
        </ol>
      </section>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>
        Must complete all included courses within one year of enrollment. You have 30 days after expiration to extend
        your subscription. Course progress for courses not completed will be lost. Livestream trainee/upgrade
        courses/packages are not included with the subscription product.
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

const subHeading = {
  margin: '12px 0 4px',
  fontFamily: 'var(--font-body)' as const,
  fontSize: 13,
  fontWeight: 600,
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
