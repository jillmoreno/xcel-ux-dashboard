import { PageShell } from './PageShell'

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <PageShell title={title}>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-body-semibold)',
          lineHeight: 'var(--text-body-semibold--line-height)',
          color: 'var(--color-text-secondary)',
          margin: 0,
        }}
      >
        This page hasn't been implemented yet.
      </p>
    </PageShell>
  )
}
