/**
 * Types for the On Stage card plugin.
 *
 * ⚠ ONE EXPORT, AND IT IS AN EVENT NAME. Netlify reads every named export of a
 * plugin as an event handler, so anything else declared here would be a build
 * failure rather than a type. The helpers live in `card.js`.
 */
export function onSuccess(args: {
  utils: { status: { show: (o: { title?: string; summary?: string; text?: string }) => void } }
}): Promise<void>
