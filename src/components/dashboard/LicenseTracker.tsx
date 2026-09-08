import { Link } from 'react-router-dom'
import { ArrowRight, HourglassClock } from '@/icons'
import { Card } from '@/components/ui/Card'
import { LICENSE_TRACKER } from '@/data/dashboardFixtures'

export function LicenseTracker() {
  const { licenseName, weeksLeft, expires, editHref } = LICENSE_TRACKER

  return (
    <Card style={{ padding: 30, gap: 19, height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <h2
            style={{
              margin: 0,
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              fontSize: 20,
              lineHeight: '28px',
              color: 'var(--color-neutral-darkest)',
            }}
          >
            License Tracker
          </h2>
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              lineHeight: '18px',
              color: 'var(--color-text-secondary)',
            }}
          >
            {licenseName}
          </p>
        </div>
        <Link
          to={editHref}
          aria-label="View All licenses"
          className="cre-link-action"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--color-action)',
            textDecoration: 'none',
          }}
        >
          View All
          <ArrowRight size={14} aria-hidden />
        </Link>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          gap: 20,
          alignItems: 'stretch',
        }}
      >
        <TimeRemainingPanel weeksLeft={weeksLeft} />
        <ExpiresPanel month={expires.month} day={expires.day} year={expires.year} />
      </div>
    </Card>
  )
}

function TimeRemainingPanel({ weeksLeft }: { weeksLeft: number }) {
  return (
    <div
      style={{
        background: 'color-mix(in srgb, var(--color-primary-500) 12%, white)',
        borderRadius: 'var(--radius-md)',
        padding: '16px 20px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 16,
          fontWeight: 600,
          lineHeight: '28px',
          color: 'var(--color-neutral-darkest)',
        }}
      >
        Time Remaining
      </div>
      <HourglassClock size={50} aria-hidden style={{ color: 'var(--color-primary-500)' }} />
      <div
        style={{
          fontFamily: 'var(--font-body)',
          fontWeight: 600,
          color: 'var(--color-neutral-darkest)',
          lineHeight: '28px',
        }}
      >
        <span style={{ fontSize: 24 }}>{weeksLeft}</span>{' '}
        <span style={{ fontSize: 16 }}>weeks</span>
      </div>
      <div
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 12,
          fontWeight: 400,
          lineHeight: '16px',
          color: 'var(--color-neutral-darkest)',
        }}
      >
        Left to Complete
      </div>
    </div>
  )
}

function ExpiresPanel({ month, day, year }: { month: string; day: number; year: number }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 12,
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--color-text-primary)',
        }}
      >
        Expires On
      </div>
      <CalendarTearOff month={month} day={day} year={year} />
    </div>
  )
}

function CalendarTearOff({ month, day, year }: { month: string; day: number; year: number }) {
  const width = 140
  return (
    <div style={{ position: 'relative', width, paddingTop: 9 }}>
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: width * 0.27,
          width: 5,
          height: 14,
          borderRadius: 'var(--radius-pill)',
          background: 'var(--color-neutral-darkest)',
        }}
      />
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: width * 0.65,
          width: 5,
          height: 14,
          borderRadius: 'var(--radius-pill)',
          background: 'var(--color-neutral-darkest)',
        }}
      />

      <div
        style={{
          marginTop: 5,
          border: '1px solid var(--color-primary-500)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          background: 'var(--color-surface-card)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div style={{ height: 20, background: 'var(--color-primary-500)' }} />
        <div
          style={{
            padding: '8px 12px 14px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 16,
              fontWeight: 600,
              lineHeight: '22px',
              letterSpacing: '0.02em',
              color: 'var(--color-neutral-darkest)',
            }}
          >
            {month}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              fontSize: 50,
              lineHeight: 1,
              color: 'var(--color-neutral-darkest)',
            }}
          >
            {day}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 16,
              fontWeight: 600,
              lineHeight: '28px',
              color: 'var(--color-neutral-darkest)',
            }}
          >
            {year}
          </div>
        </div>
      </div>
    </div>
  )
}
