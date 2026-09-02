import type { HTMLAttributes } from 'react'
import { useTheme } from '@/context/ThemeContext'

type Props = HTMLAttributes<HTMLDivElement>

export function Card({ className, style, ...rest }: Props) {
  const { theme } = useTheme()
  // Dark-theme card body text (WCAG AA — audit finding #1/#3). The
  // `.cre-course-card` / `.cre-library-card` classes set the inherited body
  // color to `var(--color-neutral-800)`, but Tailwind's `@theme inline` bakes
  // that reference to the light-mode literal (~#404040) in these unlayered
  // rules, so it never inverts when the rebrand dark theme turns the card
  // surface navy — card titles / prices / meta / ratings collapsed to ~1.5:1.
  // A LITERAL near-white (the dark theme pins `--color-text-primary` to this
  // exact value for every brand) — NOT `var(--color-text-primary)`, because in
  // some embedded-page subtrees that var reference resolves back to the baked
  // LIGHT literal (the same @theme-inline pathology). The literal always wins
  // over the baked class color and cascades to every inheriting child.
  // Light mode adds nothing (theme is `light` off the rebrand, where `useTheme`
  // safely defaults), so all other routes stay byte-for-byte. A caller's own
  // `style.color` still wins (spread last).
  const darkText = theme === 'dark' ? { color: '#f1f3f7' } : null
  return (
    <div
      className={`cre-card${className ? ` ${className}` : ''}`}
      style={{ ...darkText, ...style }}
      {...rest}
    />
  )
}
