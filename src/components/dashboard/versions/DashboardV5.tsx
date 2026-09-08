import { DashboardV3 } from '@/components/dashboard/versions/DashboardV3'

/**
 * Dashboard V5.
 *
 * Identical to V3 in every way except the Featured Products / Membership
 * card is moved to the BOTTOM (`membershipPlacement="trail"`):
 *   - Full width → the card renders below Jump Back In, Learning Path,
 *     and Courses (still full width).
 *   - Two-thirds width → the card sits at the bottom of the right column,
 *     below Learning Path + Courses + Streak.
 *
 * Implemented as a thin wrapper over `DashboardV3` so the two stay in
 * lockstep — V5 is "V3 with Featured Products trailing."
 */
export function DashboardV5() {
  return <DashboardV3 membershipPlacement="trail" />
}
