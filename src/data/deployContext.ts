/**
 * Env-var DEPLOY CONTEXT — is this build a Netlify BRANCH DEPLOY (or a PR
 * deploy preview) rather than the production site?
 *
 * WHY THIS EXISTS (2026-09-21). Branch deploys build on the FULL site, so a
 * branch URL carries every gated section — Design, Sandbox, Development, QA
 * Notes, Archive, Contributing, and the standalone prototypes. That is exactly
 * right for the audience branch builds are FOR: designers reviewing each
 * other's work, all of whom have full-site access anyway, and who would
 * otherwise be unable to review any change to a gated section at all.
 *
 * It is wrong for one visitor: a stakeholder who opens a branch URL through a
 * Refinement row that has been flipped public. They arrive at the product
 * (`/dashboard-rebrand?demo=1`), and the prototype bar's house icon is a
 * one-click ride to the full gateway — a visible button, not a wander. So that
 * icon is dropped on these builds; see `PrototypeBar`.
 *
 * WHAT THIS IS NOT. It removes the SIGNPOST, not the page. `/` still resolves
 * on a branch deploy, so anyone who types it gets the full gateway. That is
 * deliberate rather than an oversight: everyone who can open the site already
 * holds the site password, so the job here is to not put the door in front of
 * someone, not to lock it. If it ever has to be a real gate, the honest fix is
 * the `VITE_GATEWAY_MODE=public` trim applied to branch builds — which would
 * cost designers the ability to review gated work, which is why it was not
 * done now.
 *
 * ONE build-time env var, set per CONTEXT in `netlify.toml` rather than in the
 * Netlify UI, so it travels with the repo and cannot be set on one project and
 * forgotten on the other:
 *
 *   [context.branch-deploy.environment]
 *   [context.deploy-preview.environment]
 *     VITE_DEPLOY_CONTEXT = "branch-deploy"
 *
 * Production sets nothing, so an unset var is the production build — the same
 * shape as `VITE_GATEWAY_MODE` in `gatewayMode.ts`.
 *
 * THE PARSE FAILS TOWARDS SHOWING THE ICON, and that is the opposite direction
 * from `parseGatewayMode`, on purpose. A lost toml entry would otherwise hide
 * the house icon on the production dashboard — a silent, permanent regression
 * to the thing every reviewer uses. It is pinned by a source-level test that
 * reads `netlify.toml` and asserts both contexts still set the var, so losing
 * the entry fails a test rather than leaking quietly.
 */

export type DeployContext = 'branch-deploy' | 'production'

/** Parse a raw `VITE_DEPLOY_CONTEXT` value. Anything that is not exactly
 *  `branch-deploy` (case-insensitive, trimmed) is the production build. */
export function parseDeployContext(raw: unknown): DeployContext {
  if (typeof raw !== 'string') return 'production'
  return raw.trim().toLowerCase() === 'branch-deploy' ? 'branch-deploy' : 'production'
}

export function deployContext(): DeployContext {
  return parseDeployContext(import.meta.env.VITE_DEPLOY_CONTEXT)
}

/** True on a Netlify branch deploy or PR deploy preview. */
export function isBranchDeploy(): boolean {
  return deployContext() === 'branch-deploy'
}
