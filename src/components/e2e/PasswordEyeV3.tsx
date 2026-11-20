/**
 * THE PASSWORD EYE, V3 — 2026-11-19, Afsana: "the eye icons are not supposed
 * to have a pupil". Keycloak's eye, drawn the same as `KeycloakEye` on the
 * Account Details Change Password panel (`feat/atlas-keycloak-change-password`):
 * an almond outline round a hollow ring, no filled pupil — which is why it is
 * drawn here rather than taken from `@/icons` (Font Awesome's eye has one).
 * Open while the password is hidden; slashed once it is shown.
 *
 * One component for every V3 password field (Log in, Reset your password,
 * the last step's Create your password), so they cannot drift apart.
 */
export function PasswordEyeV3({ slashed }: { slashed: boolean }) {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden style={{ display: 'block' }}>
      <path
        d="M2 12c2.2-4.4 5.9-7 10-7s7.8 2.6 10 7c-2.2 4.4-5.9 7-10 7s-7.8-2.6-10-7Z"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <circle cx={12} cy={12} r={3.25} stroke="currentColor" strokeWidth={2} />
      {slashed ? <path d="M4 4l16 16" stroke="currentColor" strokeWidth={2} strokeLinecap="round" /> : null}
    </svg>
  )
}
