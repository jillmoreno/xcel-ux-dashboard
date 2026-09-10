import { CircleCheck, CircleExclamation, CircleInfo, Megaphone, MessageCircle, TriangleExclamation } from '@/icons'
import type { ComponentType } from 'react'

/**
 * The alert tone family — ONE source for every surface that renders the
 * notification card treatment, sourced from Figma **"Alerts"**
 * (`kDJB8Xga3bscFwj2rDXuin`, node `4:287`).
 *
 * Two surfaces read it today and that is the whole reason it exists:
 *
 *   1. [`Toast`](./Toast.tsx) — the transient, bottom-of-the-action feedback
 *      that fires and fades.
 *   2. [`NotificationsMenu`](../notifications/NotificationsMenu.tsx) — the
 *      durable list behind the header bell.
 *
 * A warning that is amber when it fires and grey when you open the bell an
 * hour later reads as two different systems. Same trap `studyStatusColors.ts`
 * exists to prevent between the Study Plan and the Home week strip, and the
 * same fix: move the colours to one file rather than re-deriving them.
 *
 * **The Figma's colours are McKissock's, not ours.** The design is drawn on
 * the MCK ramp (#8AA007 primary, #F59233 CTA, #018937 / #F9B428 / #CB0000
 * functional). Every one of those maps to a token here, so the card re-skins
 * to XCEL — which is also why `message` and `promo` land on `primary` rather
 * than on the design's literal green.
 */
export type AlertTone = 'success' | 'error' | 'warning' | 'info' | 'message' | 'promo'

type ToneIcon = ComponentType<{
  size?: number
  'aria-hidden'?: boolean | 'true' | 'false'
}>

export type AlertToneTokens = {
  /** The 8px bar across the top of the card — the design's `Top Border`. */
  border: string
  /** The leading glyph's colour. */
  icon: string
  Icon: ToneIcon
  /** Announced by the notification row's accessible label. NEVER colour alone. */
  label: string
}

/**
 * Border takes the LIGHT stop and the icon takes the full one, which is what
 * the design does (`success/light #4dac73` over `success #018937`). On our
 * ramps that is `-300` over `-500`.
 *
 * **The four functional tones are functional; the two content tones are
 * brand.** The design draws Messages and Marketing Promo in MCK's primary
 * green rather than in a functional colour, and that is right rather than
 * incidental: a message from your instructor is not a system state, so
 * borrowing the success/warning/error ramp for it would make "you have mail"
 * read as a verdict on you. They take `--color-primary-*` here for the same
 * reason — on XCEL that is the navy, and it reads as the product speaking.
 */
export const ALERT_TONES: Record<AlertTone, AlertToneTokens> = {
  success: {
    border: 'var(--color-success-300)',
    icon: 'var(--color-success-500)',
    Icon: CircleCheck,
    label: 'Success',
  },
  // The design's glyph is `circle-xmark`, which is NOT in the icon registry —
  // `circle-exclamation` stands in, as it has since the Toast shipped. It is a
  // near miss rather than a wrong picture (both are "something is wrong, in a
  // circle"), and it is differentiated from `warning` by the triangle below.
  // TODO(icons): vendor FA 7 Pro Light `circle-xmark` and repoint this one
  // line — do not hand-author the path.
  error: {
    border: 'var(--color-error-300)',
    icon: 'var(--color-error-500)',
    Icon: CircleExclamation,
    label: 'Error',
  },
  warning: {
    border: 'var(--color-warning-300)',
    icon: 'var(--color-warning-500)',
    Icon: TriangleExclamation,
    label: 'Warning',
  },
  info: {
    border: 'var(--color-info-300)',
    icon: 'var(--color-info-500)',
    Icon: CircleInfo,
    label: 'Information',
  },
  message: {
    border: 'var(--color-primary-300)',
    icon: 'var(--color-primary-500)',
    Icon: MessageCircle,
    label: 'Message',
  },
  // Megaphone, not the design's `dollar-circle`. This repo already settled
  // that glyph for announcements when the Resources cards split one icon into
  // four (What's New = megaphone), and a promo IS an announcement. A dollar
  // sign would also say "money" on a notification that is frequently a free
  // offer, and it is not in the registry.
  promo: {
    border: 'var(--color-primary-300)',
    icon: 'var(--color-primary-500)',
    Icon: Megaphone,
    label: 'Offer',
  },
}
