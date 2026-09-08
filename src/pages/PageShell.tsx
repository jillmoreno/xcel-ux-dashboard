import type { ReactNode } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'

export function PageShell({
  title,
  description,
  headerRight,
  children,
}: {
  title: string
  description?: ReactNode
  headerRight?: ReactNode
  children?: ReactNode
}) {
  return (
    <div style={{ padding: '24px 64px 64px', width: '100%' }}>
      <PageHeader title={title} description={description} right={headerRight} />
      {children && <div style={{ marginTop: 24 }}>{children}</div>}
    </div>
  )
}
