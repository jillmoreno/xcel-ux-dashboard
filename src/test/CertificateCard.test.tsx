import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CertificateCard } from '@/components/certificates/CertificateCard'
import type { Certificate } from '@/data/certificateFixtures'

const base: Certificate = {
  id: 'c1',
  title: 'That’s a Violation',
  profession: 'Appraisal Continuing Education',
  state: 'Ohio',
  hours: 4,
  badge: 'Elective',
  completedDate: '2024-09-20',
  enrolledDate: '2024-06-01',
  status: 'completed',
}

function renderCard(cert: Certificate, onOptions?: (id: string) => void) {
  return render(<CertificateCard data={cert} onOptions={onOptions} />)
}

describe('CertificateCard — reporting status', () => {
  it('renders the "Certificate Issued" date and a "Reported {date}" status', () => {
    renderCard({ ...base, reporting: { status: 'reported', date: '2019-04-01' } })
    expect(screen.getByText('Certificate Issued')).toBeInTheDocument()
    expect(screen.getByText('9/20/2024')).toBeInTheDocument()
    expect(screen.getByText('Reported 4/1/2019')).toBeInTheDocument()
  })

  it('renders the non-reporting-state status with the abbreviation', () => {
    renderCard({ ...base, reporting: { status: 'non-reporting', stateAbbr: 'CA' } })
    expect(screen.getByText('CA is a Non-Reporting State')).toBeInTheDocument()
  })

  it('renders "Pending Roster Submission" with an info tooltip trigger', () => {
    renderCard({ ...base, reporting: { status: 'pending-roster' } })
    expect(screen.getByText('Pending Roster Submission')).toBeInTheDocument()
    const info = screen.getByRole('button', { name: /about roster submission/i })
    // Tooltip opens on focus and surfaces the roster guidance copy.
    info.focus()
    fireEvent.focusIn(info)
    expect(screen.getByRole('tooltip')).toHaveTextContent(/Rosters are sent electronically/i)
  })

  it('omits the Reporting Status row when the certificate has no reporting data', () => {
    renderCard(base)
    expect(screen.getByText('Certificate Issued')).toBeInTheDocument()
    expect(screen.queryByText('Reporting Status')).toBeNull()
  })
})

describe('CertificateCard — kebab menu', () => {
  it('renders a kebab (⋮) that fires onOptions with the certificate id', () => {
    const onOptions = vi.fn()
    const { container } = renderCard(base, onOptions)
    const kebab = within(container).getByRole('button', { name: /options for/i })
    fireEvent.click(kebab)
    expect(onOptions).toHaveBeenCalledWith('c1')
  })
})
