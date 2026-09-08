import { Fragment, useState, type ComponentType, type CSSProperties, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sheet } from '@/components/ui/Sheet'
import {
  ArrowRight,
  Award,
  Book,
  BookOpen,
  Briefcase,
  ClipboardList,
  Eye,
  FileText,
  Flag,
  Gem,
  GraduationCap,
  Heart,
  HeartPulse,
  Library,
  Monitor,
  Podcast,
  Robot,
  RubiLogo,
  RubiMark,
  RubiWordmark,
  Star,
  StarSolid,
  Users,
  Video,
  X,
} from '@/icons'
import { useAccount } from '@/context/AccountContext'
import { useTheme } from '@/context/ThemeContext'
import { IndividualCourseCard } from '@/components/courses/IndividualCourseCard'
import { getCatalogFixtures } from '@/data/catalog'
import {
  benefitRowsFor,
  type BenefitRow,
  type BenefitRowItem,
  type BenefitTierChip,
  type MembershipContentType,
  type MembershipFirstIconKey,
} from '@/data/membership/membershipFirstFixtures'
import {
  libraryConfigFor,
  type LibraryResource,
  type LibraryResourceType,
} from '@/data/membership/libraryFixtures'
import { SimpleCard } from '@/components/dashboard/recommended/SimpleCard'
import { Eyebrow, Wrap } from '../v2/passportShared'
import { ContentTypeTag, Medallion, UnlockChip } from './shared'
import { coverGradient, isGated, type AccentTone, type MembershipAccess } from './sharedUtil'

/** Card treatment for a row's items. `row` (default) = the compact medallion
 *  RowCard in a horizontal scroller; `launch` = the Rubi-branded cover-media
 *  tool cards; `tile` = catalog-style colored-band cards (header band +
 *  watermark + title → body → footer), used by the rebrand's Exam & Cert Prep
 *  section so it reads like the AI Career Tools / catalog cards; `top-list` =
 *  a ranked, numbered top-3 list (rebrand Explore Membership → CE Podcasts);
 *  `library` = the real Resource Library shelf cards (the `<SimpleCard>` square
 *  image + title bar from the Library page) in a single non-scrolling row —
 *  extras clip off the edge, the section's "Browse the library →" arrow leads
 *  to the full library (rebrand Explore Membership → Resource Library). */
type CardStyle =
  | 'row'
  | 'launch'
  | 'tile'
  | 'top-list'
  | 'library'
  // Rebrand What's New (Figma 322:2):
  | 'podcast' // teal-banner CE podcast tiles (title + icon → Podcast row + episode + credit chips)
  | 'library-detail' // image-header library cards (format chip + title + description + rating)
  | 'catalog' // real Course Catalog cards (IndividualCourseCard) that open the CourseSheet on click

/** Controls the compact section header (eyebrow + Passport pill + title +
 *  blurb + Explore link). `auto` (default) shows it only for `cardStyle='row'`
 *  (the standalone V4/V5/V7 behavior); `always` shows it for every card style
 *  (rebrand Explore Membership product sections); `never` suppresses it. */
type HeaderMode = 'auto' | 'always' | 'never'
type HeaderStyle = 'default' | 'compact'

/** iconKey → icon component (mirrors the v4 `Medallion` map). Used by the
 *  `tile` card variant for its watermark + content-type row. */
const ITEM_ICONS: Record<
  MembershipFirstIconKey,
  ComponentType<{ size?: number; style?: CSSProperties; 'aria-hidden'?: boolean }>
> = {
  video: Video,
  podcast: Podcast,
  award: Award,
  robot: Robot,
  briefcase: Briefcase,
  'book-open': BookOpen,
  books: Library,
  'file-lines': FileText,
  flag: Flag,
  'graduation-cap': GraduationCap,
  heart: Heart,
  'heart-pulse': HeartPulse,
  users: Users,
  gem: Gem,
}

/** Content type → short label for the tile-card content-type row. */
const CONTENT_LABEL: Record<MembershipContentType, string> = {
  course: 'Course',
  podcast: 'Podcast',
  tool: 'AI Tool',
  bundle: 'Bundle',
  certificate: 'Exam Prep',
  video: 'Video',
  partner: 'Partner perk',
}

/** Wrapping grid shared by the `launch` (Rubi) + `tile` (Exam Prep) card
 *  variants. Cards are a fixed 234px wide (left-aligned, wrapping) — they do
 *  NOT stretch with the viewport; `min(100%, 234px)` only lets them shrink on
 *  sub-234px containers so they never overflow. */
// Resource Library detail cards — capped at the same catalog card width as the
// AI Career Tools row (260px, left-aligned) so they read consistently with the
// rest of the What's New product cards instead of stretching wide.
const GRID_3: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 260px))',
  justifyContent: 'start',
  gap: 16,
  // Equal-height rows so library cards with shorter descriptions/no tag match
  // the tallest card in their row.
  gridAutoRows: '1fr',
}

// AI Career Tools grid — cards are capped at the course-catalog card width
// (~260px, `minmax(220px, 260px)`) and left-aligned (`justify-content: start`)
// so they read like catalog cards instead of stretching across the column.
const GRID_CAPPED: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 260px))',
  justifyContent: 'start',
  gap: 16,
}

/**
 * The named benefit rows — one horizontal, scannable row per content
 * category (Resource Library, CE Podcasts, Exam Prep, AI Career Tools).
 * Each row carries a Passport tier marker and a deep link out to its full
 * section (PRD: "deep links to individual feature sections"). This is the
 * MasterClass-style benefit-discovery model called out in the PRD.
 *
 * Rows alternate background tint for rhythm. The podcast row gets the
 * "Earn CE while you listen" treatment. Gated (Passport-only) items stay
 * visible but dimmed with an "Unlock with Passport" chip when browsing as
 * Lite / non-member.
 */
export function BenefitSections({
  access,
  only,
  hideHeading = false,
  cardStyle = 'row',
  headerMode = 'auto',
  headerStyle = 'default',
  divider = true,
  maxItems,
  flush = false,
  hideEyebrow = false,
  exploreAtBottom = false,
  noTopPadding = false,
  fillHeight = false,
  onDark = false,
  membershipExclusive = false,
  onOpenResource,
  exploreLabelOverride,
}: {
  access: MembershipAccess
  /** When set, render only the benefit rows whose id is in this list
   *  (preserving fixture order). Used by V5's side-nav filter to show a
   *  single section at a time. */
  only?: string[]
  /** Suppress each row's `<h2>` title + the band divider/top padding — the
   *  Dashboard Rebrand shell owns the section title above. Eyebrow + blurb
   *  stay as the subtitle. */
  hideHeading?: boolean
  /** Item card treatment (see {@link CardStyle}). The Dashboard Rebrand
   *  shell's AI Career Tools section passes `launch`; Exam & Cert Prep
   *  passes `tile`. */
  cardStyle?: CardStyle
  /** Whether the compact section header renders (see {@link HeaderMode}). */
  headerMode?: HeaderMode
  /** Header layout. `default` keeps the standalone eyebrow + Passport pill +
   *  blurb. `compact` (rebrand What's New, Figma 322:2) shows the eyebrow +
   *  `row.tierChips` then the title, drops the blurb, and pins the Explore
   *  link top-right. */
  headerStyle?: HeaderStyle
  /** Whether each band draws its top `border-subtle` divider. `true`
   *  (default) keeps the standalone V4/V5/V7 section rhythm; the rebrand
   *  Explore Membership product sections pass `false` for a cleaner,
   *  rule-free browse. */
  divider?: boolean
  /** Cap the number of items rendered, applied AFTER any per-style filter
   *  (e.g. `launch` filters to `tool` items first). `undefined` (default)
   *  renders all — the rebrand Explore Membership AI Career Tools column
   *  passes `1` to highlight a single Rubi tool. Ignored by `top-list`
   *  (always 3) and `library` (uses Library fixtures, not `row.items`). */
  maxItems?: number
  /** Render the band flush — no top border, no alt background, minimal top
   *  padding, and no `Wrap` gutter — so it reads as a clean header+content
   *  unit. Used by the rebrand's 2-column Podcasts · Career-tools block.
   *  Unlike `hideHeading`, the `<h2>` is kept. */
  flush?: boolean
  /** Drop the header's eyebrow + Passport tier-marker row **and** the decorative
   *  `row.podcast` title icon, keeping the `<h2>` title + blurb + Explore link.
   *  The rebrand Explore Membership product sections pass this for a cleaner
   *  header; standalone V4/V5/V7 keep it. */
  hideEyebrow?: boolean
  /** Move the Explore link out of the header to the bottom of the band (below
   *  the cards) and render it in the magenta CTA color. The rebrand CE Podcasts
   *  panel passes this so "Browse podcasts" sits under the ranked list. */
  exploreAtBottom?: boolean
  /** Drop the band's top padding (keep the bottom) — the rebrand's first
   *  Explore Membership section (Resource Library) passes this so it sits
   *  snug under the plan banner instead of 44px below it. No effect when
   *  `flush`/`hideHeading` already control padding. */
  noTopPadding?: boolean
  /** Stretch the band to fill its parent's height and pin the `exploreAtBottom`
   *  CTA to the floor (via a flex column + `margin-top: auto`). The rebrand's
   *  2-column pair passes this so both panels' bottom CTAs line up even though
   *  their content heights differ. Requires a parent with a resolved height
   *  (the pair grid's `align-items: stretch`). */
  fillHeight?: boolean
  /** Flip the header title + blurb to light colors for a dark panel background
   *  (the rebrand CE Podcasts panel passes this on its `secondary-900` band).
   *  Card chrome is unaffected — the cards keep their own light surfaces. */
  onDark?: boolean
  /** Render a "Membership Exclusive" tag to the right of the section title
   *  (rebrand AI Career Tools, in place of the per-card tier chips). */
  membershipExclusive?: boolean
  /** Override every row's Explore link label (e.g. a consistent "View All").
   *  Absent ⇒ each row keeps its fixture `exploreLabel`. */
  exploreLabelOverride?: string
  /** For the `library-detail` card style: open the resource viewer in-shell via
   *  this callback (Dashboard Rebrand) instead of navigating to `/resources/:id`. */
  onOpenResource?: (resourceId: string) => void
}) {
  const { brand } = useAccount()
  const allRows = benefitRowsFor(brand)
  // `only` requests explicit rows (rebrand sections, including scoped ones);
  // otherwise the standalone pages (V4) render every NON-rebrand-scoped row so
  // the new What's New sections stay off those older surfaces.
  const rows = only
    ? allRows.filter((r) => only.includes(r.id))
    : allRows.filter((r) => r.scope !== 'rebrand')
  if (rows.length === 0) return null

  return (
    <div style={fillHeight ? FILL_COL : undefined}>
      {rows.map((row, i) => (
        <BenefitRowBand
          key={row.id}
          row={row}
          access={access}
          alt={i % 2 === 1}
          hideHeading={hideHeading}
          cardStyle={cardStyle}
          headerMode={headerMode}
          headerStyle={headerStyle}
          divider={divider}
          maxItems={maxItems}
          flush={flush}
          hideEyebrow={hideEyebrow}
          exploreAtBottom={exploreAtBottom}
          noTopPadding={noTopPadding}
          fillHeight={fillHeight}
          onDark={onDark}
          membershipExclusive={membershipExclusive}
          onOpenResource={onOpenResource}
          exploreLabelOverride={exploreLabelOverride}
        />
      ))}
    </div>
  )
}

// Flex-column fill used by the `fillHeight` chain (root div → section → Wrap)
// so a pinned bottom CTA can sit at the panel floor.
const FILL_COL: CSSProperties = {
  flex: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
}

function BenefitRowBand({
  row,
  access,
  alt,
  hideHeading = false,
  cardStyle = 'row',
  headerMode = 'auto',
  headerStyle = 'default',
  divider = true,
  maxItems,
  flush = false,
  hideEyebrow = false,
  exploreAtBottom = false,
  noTopPadding = false,
  fillHeight = false,
  onDark = false,
  membershipExclusive = false,
  onOpenResource,
  exploreLabelOverride,
}: {
  row: BenefitRow
  access: MembershipAccess
  alt: boolean
  hideHeading?: boolean
  cardStyle?: CardStyle
  headerMode?: HeaderMode
  headerStyle?: HeaderStyle
  divider?: boolean
  maxItems?: number
  flush?: boolean
  hideEyebrow?: boolean
  exploreAtBottom?: boolean
  noTopPadding?: boolean
  fillHeight?: boolean
  onDark?: boolean
  membershipExclusive?: boolean
  onOpenResource?: (resourceId: string) => void
  exploreLabelOverride?: string
}) {
  // `headerMode` owns the whole header block; `hideHeading` only drops the
  // `<h2>` within it.
  // Clicking a What's New product card opens this detail sheet (in place of the
  // old navigate-out link) — the same interaction as the Course Catalog cards.
  const [detail, setDetail] = useState<BenefitDetail | null>(null)
  const { brand } = useAccount()
  const showHeader =
    headerMode === 'always' || (headerMode === 'auto' && cardStyle === 'row')
  // Compact header (rebrand What's New): eyebrow + tier chips → title, no blurb.
  const compact = headerStyle === 'compact'
  // `flat` = flush band chrome (no border / alt-bg / gutter, tight padding).
  // Both `flush` and `hideHeading` opt into it; only `hideHeading` also drops
  // the `<h2>`.
  const flat = flush || hideHeading
  // Drop the Wrap's max-width + 24px side gutter so the header + cards run
  // edge-to-edge. True for flush/hideHeading and for the rebrand's full-width
  // product sections (which pass `divider={false}`) — there the SectionShell
  // already owns the gutter, so the inner 24px would double-inset the content.
  const noGutter = flat || !divider
  // Cap items after any per-style filter (see {@link maxItems}).
  const cap = <T,>(items: T[]) => (maxItems != null ? items.slice(0, maxItems) : items)
  return (
    <section
      id={row.id}
      style={{
        scrollMarginTop: 88,
        padding: hideHeading
          ? '0 0 24px'
          : flush
            ? '0 0 8px'
            : noTopPadding
              ? '0 0 44px'
              : '44px 0',
        background: flat ? 'transparent' : alt ? 'var(--color-neutral-50)' : 'transparent',
        borderTop:
          flat || !divider ? 'none' : '1px solid var(--color-border-subtle)',
        ...(fillHeight ? FILL_COL : null),
      }}
    >
      {/* When flush (`hideHeading` in the rebrand shell, or `flush` in the
          2-column block) the SectionShell + hero already own the gutter, so
          drop Wrap's max-width + 24px inset — header + cards then align flush
          with the section hero / column edge. */}
      <Wrap
        style={{
          ...(noGutter ? { maxWidth: 'none', padding: 0 } : null),
          ...(fillHeight ? FILL_COL : null),
        }}
      >
        {/* Section header (eyebrow + Passport pill + blurb + Explore link).
            Dropped for the rebrand's card sections (`launch` / `tile`) — the
            gradient section hero above already carries the title + blurb, so
            this row would just duplicate it. Kept only for the standalone
            `row` pages (V4/V5/V7), which have no section hero — unless
            `headerMode='always'` forces it (rebrand Explore Membership). */}
        {showHeader && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 16,
            marginBottom: 22,
            flexWrap: 'wrap',
          }}
        >
          {/* Rebrand product sections (`hideEyebrow`) get a wider title box so
              the one-line blurb doesn't wrap awkwardly; standalone keeps 52ch. */}
          <div style={{ maxWidth: hideEyebrow ? '80ch' : '52ch' }}>
            {compact ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <Eyebrow style={{ fontSize: 11, letterSpacing: '0.04em' }}>{row.eyebrow}</Eyebrow>
                <TierChips chips={row.tierChips} />
              </div>
            ) : (
              !hideEyebrow && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <Eyebrow>{row.eyebrow}</Eyebrow>
                  <PassportPill />
                </div>
              )
            )}
            {!hideHeading && (
              <h2
                style={{
                  margin: '8px 0 0',
                  fontFamily: 'var(--font-heading)',
                  fontSize: 26,
                  fontWeight: 800,
                  lineHeight: 1.12,
                  letterSpacing: '-0.01em',
                  // `text-primary` (not `primary-800`) so the heading adapts:
                  // near-black on white, near-white when the page goes navy in
                  // dark mode (primary-800 was invisible navy-on-navy). #1.
                  color: onDark ? 'var(--color-text-inverse)' : 'var(--color-text-primary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                {row.podcast && !hideEyebrow && (
                  <Podcast size={22} aria-hidden style={{ color: 'var(--color-tertiary-700)' }} />
                )}
                {row.title}
                {membershipExclusive && <MembershipExclusiveTag />}
              </h2>
            )}
            {!compact && (
              <p
                style={{
                  margin: '8px 0 0',
                  fontFamily: 'var(--font-body)',
                  fontSize: 15,
                  lineHeight: 1.5,
                  color: onDark ? 'var(--color-secondary-100)' : 'var(--color-text-secondary)',
                }}
              >
                {row.blurb}
              </p>
            )}
            {/* Compact headers drop the blurb, but a row may opt into a subtext
                line under its title (the member "Included…" shelves). */}
            {compact && row.subtext && (
              <p
                style={{
                  margin: '8px 0 0',
                  fontFamily: 'var(--font-body)',
                  fontSize: 15,
                  lineHeight: 1.5,
                  color: onDark ? 'var(--color-secondary-100)' : 'var(--color-text-secondary)',
                }}
              >
                {row.subtext}
              </p>
            )}
          </div>
          {/* Explore link in the header — unless it's been moved to the bottom. */}
          {!exploreAtBottom && <ExploreLink row={row} onDark={onDark} label={exploreLabelOverride} />}
        </div>
        )}

        {cardStyle === 'catalog' ? (
          // Real Course Catalog cards (rebrand Recommended CE Courses): each
          // item carries a `catalogCourse`, so we render the actual
          // `IndividualCourseCard` — identical UI to the Course Catalog, and it
          // owns its own CourseSheet (opens on click). Items without a
          // `catalogCourse` are skipped (fall back to nothing rather than a
          // mismatched tile).
          <div style={GRID_CAPPED}>
            {cap(row.items)
              .filter((item) => item.catalogCourse)
              .map((item) => (
                <IndividualCourseCard
                  key={item.id}
                  data={item.catalogCourse!}
                  stateAbbr={getCatalogFixtures(brand).stateAbbr}
                />
              ))}
          </div>
        ) : cardStyle === 'tile' ? (
          // Catalog-style colored-band cards (rebrand Exam & Cert Prep +
          // Transitions) — the same anatomy as the Rubi tool cards, themed by
          // the row accent (or `tileGradient` override) + each item's icon.
          // Use the capped catalog-width grid (matching AI Career Tools) so the
          // cards read as tidy catalog cards instead of stretching wide.
          <div style={GRID_CAPPED}>
            {cap(row.items).map((item) => (
              <TileCard key={item.id} item={item} accent={row.accent} bandGradient={row.tileGradient} onOpen={setDetail} />
            ))}
          </div>
        ) : cardStyle === 'podcast' ? (
          // CE podcast tiles (rebrand What's New) — a teal banner (title + icon)
          // over a white body with the Podcast row, episode line, and credit
          // chips. Mirrors the catalog's ContinueListeningCard, minus progress.
          // Capped catalog-width grid (matching AI Career Tools) so the cards
          // don't stretch wide.
          <div style={GRID_CAPPED}>
            {cap(row.items).map((item) => (
              <PodcastTileCard key={item.id} item={item} onOpen={setDetail} />
            ))}
          </div>
        ) : cardStyle === 'launch' ? (
          // The launch-card section (rebrand AI Career Tools) shows only the
          // AI `tool` items — the Rubi-powered tools — dropping the CE course
          // outlier so the section stays purely the AI toolkit. The shared
          // fixture is untouched (standalone row views still show every item).
          // `maxItems` (when set) highlights a subset; the rebrand What's New
          // page passes none, so all three Rubi tools show.
          <div style={GRID_CAPPED}>
            {cap(row.items.filter((item) => item.contentType === 'tool')).map((item) => (
              <RubiToolCard key={item.id} item={item} onOpen={setDetail} />
            ))}
          </div>
        ) : cardStyle === 'top-list' ? (
          // Ranked top-3 by popularity (fixture order) — rebrand CE Podcasts.
          <TopList row={row} access={access} />
        ) : cardStyle === 'library-detail' ? (
          // Image-header library cards (rebrand What's New Resource Library) —
          // real Library resources with a format chip + title + description +
          // rating, a richer treatment than the compact `library` shelf. Cards
          // open the Learning Resources Viewer — in-shell (`onOpenResource`) in
          // the rebrand, else navigating to `/resources/:id`.
          <LibraryDetailGrid onOpenResource={onOpenResource} />
        ) : cardStyle === 'library' ? (
          // Real Resource Library shelf cards (rebrand Resource Library) — the
          // same `<SimpleCard>` the Library page uses, in a single non-scrolling
          // row; extras clip, the "Browse the library →" arrow above reveals all.
          <LibraryShelf />
        ) : (
          <div
            style={{
              display: 'grid',
              gridAutoFlow: 'column',
              gridAutoColumns: 'minmax(240px, 1fr)',
              gap: 16,
              overflowX: 'auto',
              paddingBottom: 6,
              scrollbarWidth: 'thin',
            }}
          >
            {cap(row.items).map((item) => (
              <RowCard key={item.id} item={item} accent={row.accent} access={access} />
            ))}
          </div>
        )}

        {/* Explore link moved to the bottom of the band (CTA-colored) — the
            rebrand CE Podcasts panel uses this so "Browse podcasts" sits under
            the ranked list. */}
        {exploreAtBottom && (
          <div style={{ marginTop: fillHeight ? 'auto' : 16, paddingTop: 16 }}>
            <ExploreLink row={row} cta onDark={onDark} label={exploreLabelOverride} />
          </div>
        )}
      </Wrap>
      <BenefitDetailSheet item={detail} onClose={() => setDetail(null)} />
    </section>
  )
}

/** The "Explore →" deep link for a benefit row. `cta` swaps the brand-primary
 *  text for the magenta CTA color (used by the rebrand CE Podcasts bottom link). */
function ExploreLink({
  row,
  cta = false,
  onDark = false,
  label,
}: {
  row: BenefitRow
  cta?: boolean
  onDark?: boolean
  label?: string
}) {
  const { theme } = useTheme()
  // Pick a color that clears WCAG AA against its surface:
  //  - `cta` links sit on a panel → light pink on a dark panel (`onDark`),
  //    deep magenta on a light panel.
  //  - default links sit on the page → brand blue, lightened in dark mode so it
  //    reads on the deep-navy page background.
  const color = cta
    ? onDark
      ? 'var(--color-cta-200)'
      : 'var(--color-cta-700)'
    : theme === 'dark'
      ? 'var(--color-primary-300)'
      : 'var(--color-primary-600)'
  return (
    <Link
      to={row.exploreHref}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontFamily: 'var(--font-body)',
        fontWeight: 700,
        fontSize: 14,
        color,
        textDecoration: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {label ?? row.exploreLabel}
      <ArrowRight size={13} aria-hidden />
    </Link>
  )
}

/** The What's New badging (NEW pills, tier chips, Passport pill, footer gem
 *  chips) is hidden everywhere. The `whats-new-badging` flag that used to toggle
 *  it was removed 2026-08-17, baking in its `hidden` default — each badge helper
 *  below returns null, so no badging renders on the section's cards + headers.
 *  Kept as a function so the ~7 call sites are unchanged (a future restore just
 *  re-reads the flag here). */
function useBadgesHidden(): boolean {
  return true
}

function PassportPill() {
  if (useBadgesHidden()) return null
  return (
    <span
      className="cre-tag-pro"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '0 8px',
        height: 22,
        borderRadius: 'var(--radius-sm)',
        color: 'var(--color-tertiary-700)',
        fontFamily: 'var(--font-body)',
        fontSize: 12,
        fontWeight: 600,
        lineHeight: '20px',
        whiteSpace: 'nowrap',
      }}
    >
      <Gem size={12} aria-hidden />
      Passport
    </span>
  )
}

const ROW_CARD: CSSProperties = {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-lg)',
  padding: 18,
  boxShadow: 'var(--shadow-card)',
  textDecoration: 'none',
  color: 'inherit',
  minHeight: 168,
}

function RowCard({
  item,
  accent,
  access,
}: {
  item: BenefitRowItem
  accent: 'teal' | 'cta' | 'gold'
  access: MembershipAccess
}) {
  const gated = isGated(item.tier, access)
  return (
    <Link to={item.href} aria-label={item.title} className="cre-passport-prod" style={ROW_CARD}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <span style={{ opacity: gated ? 0.5 : 1 }}>
          <Medallion iconKey={item.iconKey} tone={accent} size={40} />
        </span>
      </div>
      <h3
        style={{
          margin: '12px 0 4px',
          fontFamily: 'var(--font-heading)',
          fontSize: 16,
          fontWeight: 700,
          lineHeight: 1.25,
          color: 'var(--color-accent-text)',
          opacity: gated ? 0.6 : 1,
        }}
      >
        {item.title}
      </h3>
      <p
        style={{
          margin: '0 0 14px',
          fontFamily: 'var(--font-body)',
          fontSize: 13,
          color: 'var(--color-text-secondary)',
          flex: 1,
          opacity: gated ? 0.6 : 1,
        }}
      >
        {item.meta}
      </p>
      {gated ? (
        <UnlockChip />
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <ContentTypeTag type={item.contentType} />
          <ArrowRight size={14} aria-hidden style={{ color: 'var(--color-primary-500)' }} />
        </div>
      )}
    </Link>
  )
}

/* ─── Ranked top-4 list (rebrand Explore Membership → CE Podcasts) ───────
   A numbered "top by popularity" list (fixture order = popularity). Each row
   is a link: rank badge + small icon medallion + title/meta + a play
   affordance. Shows 4 so the panel's height lines up with the AI Career Tools
   card beside it. Gating is honored for access-correctness (podcasts are
   `tier: 'both'`, so a member sees nothing gated). */
function TopList({ row, access }: { row: BenefitRow; access: MembershipAccess }) {
  const items = row.items.slice(0, 4)
  return (
    <ol style={TOP_LIST}>
      {items.map((item, i) => (
        <li key={item.id}>
          <TopListRow item={item} rank={i + 1} accent={row.accent} access={access} />
        </li>
      ))}
    </ol>
  )
}

function TopListRow({
  item,
  rank,
  accent,
  access,
}: {
  item: BenefitRowItem
  rank: number
  accent: AccentTone
  access: MembershipAccess
}) {
  const gated = isGated(item.tier, access)
  return (
    <Link to={item.href} aria-label={item.title} className="cre-passport-prod" style={TOP_ROW}>
      <span aria-hidden style={RANK_BADGE}>
        {rank}
      </span>
      <span style={{ opacity: gated ? 0.5 : 1 }}>
        <Medallion iconKey={item.iconKey} tone={accent} size={34} />
      </span>
      <span style={{ flex: 1, minWidth: 0, opacity: gated ? 0.6 : 1 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 15,
              fontWeight: 700,
              lineHeight: 1.25,
              // `text-primary` (not `primary-600`) so the title adapts to the
              // card surface: dark ink on the white card (light mode), near-white
              // on the navy card (dark mode). `primary-600` would fail on navy.
              color: 'var(--color-text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {item.title}
          </span>
        </span>
        <span
          style={{
            display: 'block',
            marginTop: 2,
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            color: 'var(--color-text-secondary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {item.meta}
        </span>
      </span>
      {gated ? (
        <UnlockChip />
      ) : (
        <span aria-hidden style={PLAY_BTN}>
          <span style={PLAY_TRIANGLE} />
        </span>
      )}
    </Link>
  )
}

/* ─── Resource Library shelf (rebrand Explore Membership → Resource Library) ──
   Renders the real Library resources as the Library page's `<SimpleCard>`
   (square image + bottom title bar + type-icon badge) so the section matches
   that surface exactly. Laid out as a single row that shows only what fits at
   the current width — extra cards spill into clipped, zero-height implicit grid
   rows (no horizontal scroll); the section header's "Browse the library →"
   arrow is the path to the rest. Capped at 8 so the DOM stays light even on a
   wide column. */
const LIBRARY_TYPE_ICON: Record<
  LibraryResourceType,
  ComponentType<{ size?: number; style?: CSSProperties }>
> = {
  article: FileText,
  'e-book': Book,
  infographic: Eye,
  template: ClipboardList,
  video: Video,
  'webinar-recording': Monitor,
}

function LibraryShelf() {
  const { brand } = useAccount()
  const resources = libraryConfigFor(brand).resources.slice(0, 8)
  return (
    <div style={LIBRARY_SHELF}>
      {resources.map((resource) => (
        <SimpleCard
          key={resource.id}
          to={`/resources/${resource.id}`}
          imageUrl={resource.imageUrl}
          title={resource.title}
          Icon={LIBRARY_TYPE_ICON[resource.type]}
        />
      ))}
    </div>
  )
}

// One non-scrolling row: as many SimpleCards as fit at 180px-min fill the lone
// explicit row; the rest land in implicit rows pinned to 0 height and clipped
// by `overflow: hidden` — so the shelf never wraps to a second visible row and
// never shows a horizontal scrollbar.
const LIBRARY_SHELF: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
  gridTemplateRows: 'auto',
  gridAutoRows: 0,
  columnGap: 16,
  rowGap: 0,
  overflow: 'hidden',
}

const TOP_LIST: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}

const TOP_ROW: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  padding: '12px 16px',
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-card)',
  textDecoration: 'none',
  color: 'inherit',
}

const RANK_BADGE: CSSProperties = {
  flexShrink: 0,
  width: 24,
  height: 24,
  borderRadius: 'var(--radius-pill)',
  // `primary-600` (not `primary-800`) so the disc stays visible on the dark-mode
  // navy card surface (which IS `primary-800`); the white numeral reads on both.
  background: 'var(--color-primary-600)',
  color: 'var(--color-text-inverse)',
  display: 'grid',
  placeItems: 'center',
  fontFamily: 'var(--font-heading)',
  fontSize: 12,
  fontWeight: 800,
}

const PLAY_BTN: CSSProperties = {
  flexShrink: 0,
  width: 32,
  height: 32,
  borderRadius: 'var(--radius-pill)',
  background: 'var(--color-primary-100)',
  color: 'var(--color-primary-700)',
  display: 'grid',
  placeItems: 'center',
}

// CSS play triangle — uses `currentColor` (inherited from PLAY_BTN), so no
// raw color is introduced.
const PLAY_TRIANGLE: CSSProperties = {
  width: 0,
  height: 0,
  marginLeft: 2,
  borderTop: '6px solid transparent',
  borderBottom: '6px solid transparent',
  borderLeft: '9px solid currentColor',
}

/* ─── Catalog-style card chrome ──────────────────────────────────────────
   Shared by the Rubi tool cards + the Exam-Prep tile cards: a `cre-card
   cre-course-card` link (chrome + clip + hover) with a colored tile-header
   band → body (content-type row + meta) → footer ("Included with Pro"),
   mirroring the course catalog's PodcastCard / PackageCard. */
const CATALOG_CARD: CSSProperties = {
  textDecoration: 'none',
  color: 'inherit',
  cursor: 'pointer',
}

/** Tile-card body text color (finding #3). The `.cre-course-card` root sets
 *  `color: var(--color-neutral-800)`, but under the `@theme inline` dark remap
 *  that color doesn't reach the card body — the type label + meta were
 *  computing to the light-mode near-black (#202020) while the surface went
 *  navy. Pinning the adaptive `--color-text-primary` on each body wrapper (a
 *  descendant, where the runtime variable resolves correctly) makes the label
 *  invert with the surface: near-black on white, near-white on navy. */
const CARD_BODY_TEXT: CSSProperties = { color: 'var(--color-text-primary)' }

/** Body content-type row (icon + label), shared by the catalog-style cards. */
function CardTypeRow({
  Icon,
  label,
  iconColor,
}: {
  Icon: ComponentType<{ size?: number; 'aria-hidden'?: boolean; style?: CSSProperties }>
  label: string
  /** Optional icon tint (the label keeps the body text color). */
  iconColor?: string
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        fontFamily: 'var(--font-body)',
        fontSize: 12,
        fontWeight: 500,
      }}
    >
      <Icon size={16} aria-hidden style={iconColor ? { color: iconColor } : undefined} />
      {label}
    </span>
  )
}

/** Small dotted feature list rendered under the meta line on the catalog-style
 *  cards. Dots use the Rubi brand color so they tie back to the band. */
function FeatureBullets({ bullets }: { bullets: string[] }) {
  return (
    <ul
      style={{
        listStyle: 'none',
        margin: '2px 0 0',
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 5,
      }}
    >
      {bullets.map((b) => (
        <li
          key={b}
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 8,
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            lineHeight: 1.4,
            color: 'var(--color-text-secondary)',
          }}
        >
          <span
            aria-hidden
            style={{
              flexShrink: 0,
              width: 4,
              height: 4,
              marginTop: 1,
              borderRadius: 'var(--radius-pill)',
              background: 'var(--rubi-surface)',
            }}
          />
          {b}
        </li>
      ))}
    </ul>
  )
}

/** Shared footer-chip pill (the bg + text color are set per-variant). */
const FOOTER_CHIP: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '0 6px',
  height: 22,
  borderRadius: 'var(--radius-sm)',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 600,
  lineHeight: '20px',
}


/** Small tier-chip footer for the rebrand's `tile` (Exam & Cert Prep) +
 *  `launch` (AI Career Tools) cards — the dashboard `TierChip` style. `tags`
 *  picks the chips left→right (default a single magenta "Passport"); a `lite`
 *  entry renders the teal "Passport Lite" chip. Replaces the membership-aware
 *  `CardFooter` on those two variants (the `row` variant still uses it). */
function TierTagFooter({ tags }: { tags?: ('lite' | 'passport')[] }) {
  if (useBadgesHidden()) return null
  // Explicit empty array opts OUT of the Passport chips entirely (brands whose
  // tiers aren't Passport — e.g. CRE Plus/Pro/Premier). `undefined` still
  // defaults to a single "Passport" chip, so Elite/Passport callers are unchanged.
  if (tags && tags.length === 0) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, padding: '8px 16px 16px' }}>
      {(tags ?? ['passport']).map((t) => (
        <span
          key={t}
          style={{
            ...FOOTER_CHIP,
            background: t === 'lite' ? 'var(--color-secondary-100)' : 'var(--color-cta-100)',
            color: t === 'lite' ? 'var(--color-secondary-700)' : 'var(--color-cta-700)',
          }}
        >
          <Gem size={12} aria-hidden />
          {t === 'lite' ? 'Passport Lite' : 'Passport'}
        </span>
      ))}
    </div>
  )
}

/** Section-header "Membership Exclusive" tag (rebrand AI Career Tools) — sits to
 *  the right of the section title in place of the per-card tier chips. Uses the
 *  teal chip treatment (matching the "Passport Lite" chip) and respects the
 *  whats-new-badging hide-all switch. */
function MembershipExclusiveTag() {
  if (useBadgesHidden()) return null
  return (
    <span
      style={{
        ...FOOTER_CHIP,
        background: 'var(--color-secondary-100)',
        color: 'var(--color-secondary-700)',
        // Reset the inherited h2 typography so the pill reads as a tag.
        fontFamily: 'var(--font-body)',
        letterSpacing: 'normal',
      }}
    >
      <Gem size={12} aria-hidden />
      Membership Exclusive
    </span>
  )
}

const BAND_TITLE: CSSProperties = {
  position: 'relative',
  zIndex: 1,
  margin: 0,
  maxWidth: '74%',
  fontFamily: 'var(--font-body)',
  fontSize: 16,
  fontWeight: 600,
  lineHeight: '22px',
  color: 'var(--color-text-inverse)',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
}

/* ─── Rubi AI Career Tool card ───────────────────────────────────────────
   A Rubi-red header band (`cre-tile-header--rubi`) carrying the white Rubi
   logo lockup top-left, the tool title bottom-left, and the Rubi mark as a
   faded watermark — over the shared catalog body + footer. */

// Override the Rubi SVGs' `--fill-0` so the multicolor brand mark/wordmark
// paint white against the red band (the watermark uses a lower opacity).
const RUBI_ON_BAND = { ['--fill-0' as string]: 'var(--color-text-inverse)' } as CSSProperties

/* ─── What's New card detail sheet ───────────────────────────────────────
   Clicking a What's New product card opens a right-side detail sheet (the
   same interaction as the Course Catalog cards) instead of navigating out of
   the shell. A normalized `DetailItem` covers all card types (podcast / tile /
   Rubi tool / library resource). The per-item upsell/enroll flow is a stub
   for now (console + toast come with the real purchase path). */
type IconType = ComponentType<{ size?: number; 'aria-hidden'?: boolean; style?: CSSProperties }>

export type BenefitDetail = {
  title: string
  typeLabel: string
  Icon: IconType
  iconColor?: string
  meta?: string
  chips?: string[]
  bullets?: string[]
  description?: string
  ctaLabel: string
}

function BenefitDetailSheet({ item, onClose }: { item: BenefitDetail | null; onClose: () => void }) {
  return (
    <Sheet open={item != null} onClose={onClose} title={item?.title ?? ''}>
      {item && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header — close (top-left) matching the app's sheet convention. */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '16px 20px',
              borderBottom: '1px solid var(--color-border-subtle)',
            }}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-pill)',
                border: 'none',
                background: 'var(--color-neutral-100)',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <X size={16} aria-hidden />
            </button>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'var(--color-text-tertiary)' }}>
              {item.typeLabel}
            </span>
          </div>
          {/* Body */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px 24px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <h2
              style={{
                margin: 0,
                fontFamily: 'var(--font-heading)',
                fontSize: 22,
                fontWeight: 700,
                lineHeight: 1.2,
                color: 'var(--color-text-primary)',
              }}
            >
              {item.title}
            </h2>
            <CardTypeRow Icon={item.Icon} label={item.typeLabel} iconColor={item.iconColor} />
            {item.meta && <p style={detailMetaStyle}>{item.meta}</p>}
            {item.description && <p style={detailDescStyle}>{item.description}</p>}
            {item.chips && item.chips.length > 0 && (
              <span
                style={{
                  display: 'inline-flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: 8,
                  fontFamily: 'var(--font-body)',
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'var(--color-text-secondary)',
                }}
              >
                {item.chips.map((chip, i) => (
                  <Fragment key={chip}>
                    {i > 0 && (
                      <span aria-hidden style={{ width: 1, height: 12, background: 'var(--color-border-subtle)' }} />
                    )}
                    <span>{chip}</span>
                  </Fragment>
                ))}
              </span>
            )}
            {item.bullets && item.bullets.length > 0 && <FeatureBullets bullets={item.bullets} />}
            <button type="button" onClick={() => console.info('whats-new:cta', item.title)} style={detailCtaStyle}>
              {item.ctaLabel}
            </button>
          </div>
        </div>
      )}
    </Sheet>
  )
}

const detailMetaStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-text-primary)',
}

const detailDescStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  lineHeight: 1.5,
  color: 'var(--color-text-secondary)',
}

const detailCtaStyle: CSSProperties = {
  alignSelf: 'flex-start',
  marginTop: 4,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '10px 22px',
  borderRadius: 'var(--radius-md)',
  border: 'none',
  background: 'var(--color-action)',
  color: 'var(--color-text-inverse)',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
}

/** Shared clickable-card wrapper (replaces the old `<Link>`) — opens the detail
 *  sheet on click / Enter / Space. Keeps the exact catalog card chrome. */
function CardButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={label}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      className="cre-card cre-course-card cre-card-asym"
      style={CATALOG_CARD}
    >
      {children}
    </div>
  )
}

function RubiToolCard({ item, onOpen }: { item: BenefitRowItem; onOpen: (d: BenefitDetail) => void }) {
  return (
    <CardButton
      label={item.title}
      onClick={() =>
        onOpen({
          title: item.title,
          typeLabel: 'AI Tool',
          Icon: RubiLogo,
          iconColor: 'var(--rubi-surface)',
          meta: item.meta,
          bullets: item.bullets,
          ctaLabel: 'Launch tool',
        })
      }
    >
      <div
        className="cre-tile-header cre-tile-header--primary"
        style={{
          // Navy `primary-800` to match the Recommended shelf's career-tool
          // card color (the same product on the dashboard band), replacing the
          // Rubi-red band. The white Rubi logo lockup still reads on the navy.
          background: 'var(--color-primary-800)',
          position: 'relative',
          minHeight: 132,
          padding: 16,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 14,
        }}
      >
        <RubiMark
          width={150}
          aria-hidden
          style={{
            ...RUBI_ON_BAND,
            position: 'absolute',
            top: -20,
            right: -26,
            opacity: 0.16,
            pointerEvents: 'none',
          }}
        />
        <span style={{ position: 'relative', zIndex: 1, display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          <RubiMark width={20} aria-hidden style={RUBI_ON_BAND} />
          <RubiWordmark width={58} aria-hidden style={RUBI_ON_BAND} />
        </span>
        <h3 style={BAND_TITLE}>{item.title}</h3>
      </div>

      <div style={{ ...CARD_BODY_TEXT, display: 'flex', flexDirection: 'column', flex: 1, padding: 16, gap: 8 }}>
        <CardTypeRow Icon={RubiLogo} iconColor="var(--rubi-surface)" label="AI Tool" />
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500 }}>{item.meta}</span>
        {item.bullets && item.bullets.length > 0 && <FeatureBullets bullets={item.bullets} />}
      </div>
      {/* No per-card tier chips here — the AI Career Tools section carries a
          single "Membership Exclusive" tag beside its heading instead. */}
    </CardButton>
  )
}

/* ─── Exam & Cert Prep tile card ─────────────────────────────────────────
   The same catalog anatomy as the Rubi card, themed by the row accent (an
   accent-gradient band, via `coverGradient`) with the item's icon as the
   watermark — so Exam & Cert Prep matches the AI Career Tools cards without
   the Rubi branding. */
function TileCard({
  item,
  accent,
  bandGradient,
  onOpen,
}: {
  item: BenefitRowItem
  accent: AccentTone
  /** Override the accent-derived band gradient (rebrand Exam & Cert Prep navy). */
  bandGradient?: string
  onOpen: (d: BenefitDetail) => void
}) {
  const Icon = ITEM_ICONS[item.iconKey]
  const badgesHidden = useBadgesHidden()
  return (
    <CardButton
      label={item.title}
      onClick={() =>
        onOpen({
          title: item.title,
          typeLabel: CONTENT_LABEL[item.contentType],
          Icon,
          meta: item.meta,
          bullets: item.bullets,
          ctaLabel: 'Start prep',
        })
      }
    >
      <div
        style={{
          position: 'relative',
          minHeight: 132,
          padding: 16,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          gap: 14,
          background: bandGradient ?? coverGradient(accent),
          color: 'var(--color-text-inverse)',
        }}
      >
        <Icon
          size={140}
          aria-hidden
          style={{ position: 'absolute', top: -8, right: -16, color: 'var(--color-text-inverse)', opacity: 0.16 }}
        />
        <h3 style={BAND_TITLE}>{item.title}</h3>
      </div>

      <div
        style={{
          ...CARD_BODY_TEXT,
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          // Bottom padding normally comes from the tier-chip footer; when badges
          // are hidden that footer doesn't render, so the body owns it instead.
          padding: badgesHidden ? '16px 16px 16px' : '16px 16px 0',
          gap: 8,
        }}
      >
        <CardTypeRow Icon={Icon} label={CONTENT_LABEL[item.contentType]} />
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500 }}>{item.meta}</span>
      </div>

      {/* Small tier chips (dashboard style) instead of the membership-aware
          footer — `item.tierTags` picks them (default a single "Passport"). */}
      <TierTagFooter tags={item.tierTags} />
    </CardButton>
  )
}

/* ─── Rebrand What's New compact-header tier chips ───────────────────────────
   `open` → neutral "Open to all"; `lite` → teal "Passport Lite"; `passport` →
   magenta "Passport" (the gem-marked plan chips, matching `TierTagFooter`). */
function TierChips({ chips }: { chips?: BenefitTierChip[] }) {
  if (useBadgesHidden()) return null
  if (!chips || chips.length === 0) return null
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
      {chips.map((chip) => {
        if (chip === 'open') {
          return (
            <span
              key={chip}
              style={{ ...FOOTER_CHIP, background: 'var(--color-neutral-100)', color: 'var(--color-text-secondary)' }}
            >
              Open to all
            </span>
          )
        }
        const lite = chip === 'lite'
        return (
          <span
            key={chip}
            style={{
              ...FOOTER_CHIP,
              background: lite ? 'var(--color-secondary-100)' : 'var(--color-cta-100)',
              color: lite ? 'var(--color-secondary-700)' : 'var(--color-cta-700)',
            }}
          >
            <Gem size={12} aria-hidden />
            {lite ? 'Passport Lite' : 'Passport'}
          </span>
        )
      })}
    </span>
  )
}

/* ─── CE podcast tile (rebrand What's New → CE Podcasts) ─────────────────────
   A teal podcast banner (`cre-tile-header--podcast`, matching the catalog's
   ContinueListeningCard) carrying the title + a faded Podcast watermark, over a
   white body with the Podcast type row, the episode line, and credit chips.
   No progress bar — this is a discovery card, not a "continue listening" one. */
function PodcastTileCard({ item, onOpen }: { item: BenefitRowItem; onOpen: (d: BenefitDetail) => void }) {
  return (
    <CardButton
      label={item.title}
      onClick={() =>
        onOpen({
          title: item.title,
          typeLabel: 'Podcast',
          Icon: Podcast,
          meta: item.episodeMeta,
          chips: item.creditChips,
          ctaLabel: 'Play episode',
        })
      }
    >
      <div
        className="cre-tile-header cre-tile-header--podcast"
        style={{
          position: 'relative',
          minHeight: 100,
          padding: 16,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'flex-end',
        }}
      >
        <Podcast
          size={102}
          aria-hidden
          style={{ position: 'absolute', top: 4, right: -8, color: 'var(--color-text-inverse)', opacity: 0.18 }}
        />
        <h3 style={{ ...BAND_TITLE, fontSize: 15, lineHeight: '20px', WebkitLineClamp: 3 }}>{item.title}</h3>
      </div>

      <div style={{ ...CARD_BODY_TEXT, display: 'flex', flexDirection: 'column', flex: 1, padding: '14px 16px 16px', gap: 6 }}>
        <CardTypeRow Icon={Podcast} label="Podcast" />
        {item.episodeMeta && (
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-text-secondary)' }}>
            {item.episodeMeta}
          </span>
        )}
        {item.creditChips && item.creditChips.length > 0 && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontFamily: 'var(--font-body)',
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            {item.creditChips.map((chip, i) => (
              <Fragment key={chip}>
                {i > 0 && <span aria-hidden style={{ width: 1, height: 12, background: 'var(--color-border-subtle)' }} />}
                <span>{chip}</span>
              </Fragment>
            ))}
          </span>
        )}
      </div>
    </CardButton>
  )
}

/* ─── Resource Library detail cards (rebrand What's New → Resource Library) ──
   The real Library resources rendered as image-header cards: cover image (or
   the designed hero gradient + wordmark) → format chip + title + description
   → divider → star rating + optional tag. Richer than the compact `library`
   shelf; shows the first three resources, the header arrow leads to the rest. */
const LIBRARY_FORMAT_LABEL: Record<LibraryResourceType, string> = {
  article: 'Article',
  'e-book': 'E-book',
  infographic: 'Infographic',
  template: 'Template',
  video: 'Video',
  'webinar-recording': 'Webinar',
}

function LibraryDetailGrid({
  onOpenResource,
}: {
  /** When set (Dashboard Rebrand shell), a card opens the resource viewer
   *  in-shell via this callback; otherwise the card navigates to the
   *  standalone `/resources/:id` route. */
  onOpenResource?: (resourceId: string) => void
}) {
  const { brand } = useAccount()
  const resources = libraryConfigFor(brand).resources.slice(0, 3)
  return (
    <div style={GRID_3}>
      {resources.map((resource) => (
        <LibraryDetailCard
          key={resource.id}
          resource={resource}
          onOpenResource={onOpenResource}
        />
      ))}
    </div>
  )
}

function LibraryDetailCard({
  resource,
  onOpenResource,
}: {
  resource: LibraryResource
  onOpenResource?: (resourceId: string) => void
}) {
  const Icon = LIBRARY_TYPE_ICON[resource.type]
  const navigate = useNavigate()
  // Mirrors the Resource Library grid (`LibraryGrid`/`LibraryResourceCard`):
  // clicking a card opens the Learning Resources Viewer. In the rebrand shell an
  // `onOpenResource` callback opens it in place (left rail stays); on the
  // standalone `/membership` Benefits tab it navigates to `/resources/:id`.
  return (
    <CardButton
      label={resource.title}
      onClick={() =>
        onOpenResource
          ? onOpenResource(resource.id)
          : navigate(`/resources/${resource.id}`)
      }
    >
      <div
        style={{
          position: 'relative',
          aspectRatio: '16 / 9',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: resource.imageUrl ? 'var(--color-neutral-100)' : resource.heroBackground,
          backgroundImage: resource.imageUrl ? `url(${resource.imageUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {!resource.imageUrl && (
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: '-0.01em',
              textAlign: 'center',
              padding: '0 16px',
              color: resource.heroAccent,
            }}
          >
            {resource.heroLabel}
          </span>
        )}
      </div>

      <div style={{ ...CARD_BODY_TEXT, display: 'flex', flexDirection: 'column', flex: 1, padding: '16px 18px 18px', gap: 10 }}>
        <CardTypeRow Icon={Icon} label={LIBRARY_FORMAT_LABEL[resource.type]} />
        <h3
          style={{
            margin: 0,
            fontFamily: 'var(--font-heading)',
            fontSize: 16,
            fontWeight: 700,
            lineHeight: 1.25,
            // Adapts with the surface — primary-700 was invisible navy-on-navy
            // when the card flips dark (#1/#3).
            color: 'var(--color-text-primary)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {resource.title}
        </h3>
        <p
          style={{
            margin: 0,
            flex: 1,
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            lineHeight: 1.5,
            color: 'var(--color-text-secondary)',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {resource.description}
        </p>
        <div aria-hidden style={{ height: 1, background: 'var(--color-border-subtle)', margin: '2px 0' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <StarRating rating={resource.rating} />
          {resource.tag && (
            <span style={{ ...FOOTER_CHIP, background: 'var(--color-neutral-100)', color: 'var(--color-text-secondary)' }}>
              {resource.tag}
            </span>
          )}
        </div>
      </div>
    </CardButton>
  )
}

/** Five-star rating row (filled to the nearest whole star) + the numeric. */
function StarRating({ rating }: { rating: number }) {
  const full = Math.round(rating)
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{ display: 'inline-flex', gap: 1 }}>
        {[0, 1, 2, 3, 4].map((i) =>
          i < full ? (
            <StarSolid key={i} size={13} aria-hidden style={{ color: 'var(--color-warning-500)' }} />
          ) : (
            <Star key={i} size={13} aria-hidden style={{ color: 'var(--color-neutral-400)' }} />
          ),
        )}
      </span>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
        {rating.toFixed(1)}
      </span>
    </span>
  )
}
