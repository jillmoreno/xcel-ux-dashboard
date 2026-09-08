import { Children, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { Crown, Monitor, Package, Podcast, RubiLogo, StarSolid, Users, Video } from '@/icons'
import { useAccount } from '@/context/AccountContext'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { useTheme } from '@/context/ThemeContext'
import { buildShelves } from '@/data/recommendedCategoriesFixtures'
import { type BenefitRowItem } from '@/data/membership/membershipFirstFixtures'
import { ShelfScroller } from '@/components/dashboard/recommended/ShelfScroller'
import { SimpleCard } from '@/components/dashboard/recommended/SimpleCard'
import { Card } from '@/components/ui/Card'
import { getCourseImage } from '@/utils/courseImage'
import { CourseSheetSwitch } from '@/components/courses/CourseSheetSwitch'
import { PodcastSheet } from '@/components/courses/PodcastSheet'
import { PackageSheet } from '@/components/courses/PackageSheet'
import { MembershipSheet } from '@/components/courses/MembershipSheet'
import type {
  DeliveryMode,
  IndividualCourse,
  Membership as CatalogMembership,
  Package as CatalogPackage,
} from '@/data/catalog/types'
import type { PodcastRecord } from '@/data/podcastFixtures'
import { resolveCommerceState, type EntitledProduct } from '@/data/commerce/entitlement'
import type { MembershipTier } from '@/context/AccountContext'
import { CardBadgeOverlay } from './badged/CardBadgeOverlay'
import { useFocusMode } from '@/components/layout/useFocusMode'
import { deriveCardBadges, type CardBadges } from './badged/cardBadges'

/**
 * "Recommended for you" — a **full-bleed background bar** on the Dashboard
 * Rebrand overview. Breaks out of `SectionShell`'s 40px gutter (`margin: 0
 * -40px`, the same bleed `MembershipSectionHero` uses) so the bar runs flush
 * from the left rail to the content-column's right edge.
 *
 * The row is a **blended personalized mix across every product type** — not
 * just courses. It interleaves a few course, podcast, membership, package, and
 * Career Tool (Rubi AI) tiles into one carousel so the band delivers on
 * "products we think you will love" regardless of format. Each tile keeps a
 * type-appropriate treatment (color band + icon + a type label in the bottom
 * meta row) so the format reads at a glance, and clicking opens the matching
 * sheet (course / podcast / package / membership) or deep-links into the
 * Career Tools section.
 *
 * Sourced from `buildShelves` (the `for-your-license`, `podcast-spotlight`,
 * `package-spotlight`, `membership-spotlight` shelves) plus the Elite Career
 * Tools row from `benefitRowsFor`. Rebrand overview only (`showExtras`);
 * self-hides when no product tiles qualify for the active brand.
 */

/** Delivery → format icon + label for a course tile's bottom meta row. */
const DELIVERY_META: Record<
  DeliveryMode,
  { Icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>; label: string }
> = {
  online: { Icon: Monitor, label: 'Course' },
  webinar: { Icon: Video, label: 'Video' },
  podcast: { Icon: Podcast, label: 'Podcast' },
  'in-person': { Icon: Users, label: 'In-person' },
}

/** One tile in the blended carousel, discriminated by product type so the
 *  renderer can pick the right treatment + click action without re-checking
 *  item shape. */
type Tile =
  | { kind: 'course'; key: string; data: IndividualCourse }
  | { kind: 'podcast'; key: string; data: PodcastRecord }
  | { kind: 'package'; key: string; data: CatalogPackage }
  | { kind: 'membership'; key: string; data: CatalogMembership }
  | { kind: 'tool'; key: string; data: BenefitRowItem }


/** Card style the compare page + handoff live previews can force, independent of
 *  any flag. Also the band's own card-style options (default `shelf`). */
export type RecommendedCardStyle = 'shelf' | 'shelf-plain' | 'shelf-6up' | 'large' | 'trending-3up'

/** Preview override — used by the "Recommended Card A/B" compare page + the
 *  dev-handoff live previews. Forces the band VISIBLE with a fixed card style +
 *  background and neutralizes the full-bleed margins so it renders cleanly as a
 *  contained panel outside the shell. When set, the flag gates are bypassed. */
export type RecommendedBandPreview = {
  cardStyle: RecommendedCardStyle
  /** Background palette key; defaults to `white` for a clean contained panel. */
  background?: 'white' | 'none' | 'primary-800' | 'secondary-800' | 'neutral-800'
}

export function DashboardRecommendedBand({
  badged = false,
  preview,
}: { badged?: boolean; preview?: RecommendedBandPreview } = {}) {
  const { brand, membership, profession, tier } = useAccount()
  // Locked kiosk share view (`?focus=1`) — suppress the "See All" catalog link
  // so a tester can't leave the page.
  const focusMode = useFocusMode()
  // A/B test flag — a dedicated two-way toggle that overrides the card style on
  // the live Home. OFF → the band keeps its default card style; ON → `compact`
  // (shelf cards) or `trending` (What's Trending image cards). The `preview` prop
  // (compare page / handoff) wins over both.
  const abFlag = useFeatureFlag('home-recommended-card-ab')
  const abCardStyle: RecommendedCardStyle | undefined = abFlag.enabled
    ? abFlag.variant === 'trending'
      ? 'trending-3up'
      : 'shelf'
    : undefined
  // The band background is always None (transparent — the page shows through,
  // dark text), except when a `preview` override fixes it (compare page / handoff).
  const bgVariant = preview?.background ?? 'none'
  const palette = BG_PALETTE[bgVariant] ?? BG_PALETTE.none
  // The white/none bands use the magenta `action` "See All" link; those surfaces
  // flip to navy in dark mode, so lighten the link to keep AA contrast. The dark
  // band variants already use a light (white) link.
  const seeAllColor =
    useTheme().theme === 'dark' && (bgVariant === 'white' || bgVariant === 'none')
      ? 'var(--color-cta-300)'
      : palette.link
  // With no background panel (`none`), the full-bleed treatment reads as
  // unintentional — the cards run off the viewport edge past where the other
  // (gutter-bound) widgets end. So drop the bleed and sit the band inside
  // SectionShell's 40px gutter like the Current Learning Path / Jump Back In
  // widgets: the "See All" link then lines up with the tracker's footer link,
  // and the carousel ends at the gutter (showing fewer cards, with padding).
  // The preview panel is always contained (no full-bleed): it renders outside
  // the shell, so the negative viewport-edge margins would break the layout.
  const noBleed = !preview && bgVariant === 'none'
  // Card style — the DEFAULT is `shelf` (the Compact-square SimpleCard with the
  // solid brand title bar + format · rating/price meta): `shelf-plain` (the same
  // cards, bannerless — meta over the image), `large` (full course-catalog
  // cards), or `trending-3up` (image-only VibrantCards) are the alternates via
  // the `preview` prop / A/B flag. The "Badged Version" forces `large` so the
  // tier + status overlay has a full-height cover to sit on.
  const cardStyle = badged
    ? 'large'
    : (preview?.cardStyle ?? abCardStyle ?? 'shelf')
  const largeCards = cardStyle === 'large'
  // `trending-3up` renders the image-only VibrantCards sized small so the
  // no-scroll grid fits three across (capped at 3 columns). (The 2-up `trending`
  // variant was removed.)
  const trending3up = cardStyle === 'trending-3up'
  const trendingCards = trending3up
  // Bannerless shelf tiles — the shelf SimpleCards with the title + format ·
  // rating meta floated over the cover image behind a gradient (no solid bar).
  // Two densities: `shelf-plain` packs four across, `shelf-6up` six across
  // (smaller squares). Both render via `renderTile` with `bannerless`.
  const plainShelf = cardStyle === 'shelf-plain'
  const plainShelf6 = cardStyle === 'shelf-6up'
  const bannerlessShelf = plainShelf || plainShelf6

  // Layout axis — carousel (the horizontal ShelfScroller, default) vs. a
  // fit-to-screen grid that shows only as many WHOLE cards as fit the row
  // width (no carousel). Governed by the `dashboard-recommended-carousel` flag.
  const carousel = useFeatureFlag('dashboard-recommended-carousel').enabled
  // Show/hide the "what this is" blurb under the title on the trending cards.
  const showBlurb = useFeatureFlag('dashboard-recommended-blurb').enabled
  // Min card width per style — drives how many whole cards the fit-to-screen
  // grid packs into one row (and the fallback swipe-card width when too narrow).
  // The bannerless shelf tiles pack four across (smaller min + a 4-column cap
  // below); 3-up trending fits three; other styles fit as many as the width allows.
  const fitMin = plainShelf6 ? 132 : plainShelf ? 200 : trending3up ? 240 : largeCards ? 240 : 168

  // Shelf-card meta: members see the ★ rating (a quality cue), non-members see
  // the price (a buying signal). This member ⇄ non-member swap is the built-in
  // behavior — the `dashboard-shelf-card-meta` flag that used to gate it (with
  // Always-rating / Always-price overrides) was archived 2026-08-17. Shelf cards
  // only; the large cards keep their own layout.
  const showPriceOnShelf = membership !== 'member'

  const tiles = useMemo<Tile[]>(() => {
    const shelves = buildShelves(brand, membership, profession)

    // Courses ONLY — the band is a course-recommendation shelf. Podcasts,
    // packages, memberships, and career tools are intentionally excluded. Pull
    // from every course-type shelf (for-your-license / new-this-week /
    // quick-wins), de-duped by id, so the row stays full.
    const seen = new Set<string>()
    const out: Tile[] = []
    for (const row of shelves) {
      if (row.cardType !== 'course') continue
      for (const c of row.items) {
        if (seen.has(c.id)) continue
        seen.add(c.id)
        out.push({ kind: 'course', key: `course-${c.id}`, data: c })
        if (out.length >= 12) return out
      }
    }
    return out
  }, [brand, membership, profession])

  const [openCourse, setOpenCourse] = useState<IndividualCourse | null>(null)
  const [openPodcast, setOpenPodcast] = useState<PodcastRecord | null>(null)
  const [openPackage, setOpenPackage] = useState<CatalogPackage | null>(null)
  const [openMembership, setOpenMembership] = useState<CatalogMembership | null>(null)

  // Self-hide when nothing qualifies for the active brand (defensive — in
  // practice the band always has content). The preview override bypasses this
  // (the compare page + handoff must always render); only a genuinely empty
  // catalog hides it.
  if (tiles.length === 0) return null

  const tileEls = tiles
    .map((tile) =>
      trendingCards
        ? renderVibrantTile(
            tile,
            {
              setOpenCourse,
              setOpenPodcast,
              setOpenPackage,
              setOpenMembership,
            },
            { brand, tier, showBlurb },
          )
        : largeCards
          ? renderLargeTile(
              tile,
              { setOpenCourse, setOpenPodcast, setOpenPackage, setOpenMembership },
              badged,
            )
          : renderTile(
              tile,
              {
                setOpenCourse,
                setOpenPodcast,
                setOpenPackage,
                setOpenMembership,
              },
              showPriceOnShelf,
              bannerlessShelf,
            ),
    )
    .filter(Boolean)

  return (
    <section style={{ ...bandStyle, ...(preview || noBleed ? NO_BLEED_BAND : null), background: palette.bg }}>
      <div style={noBleed ? innerStyleFlush : innerStyle}>
        {/* Header — eyebrow + descriptor + See All. Colors flip to light on the
            dark backgrounds (palette). */}
        <header style={headerStyle}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <span
              style={{
                ...eyebrowStyle,
                color: palette.eyebrow,
              }}
            >
              Recommended for you
            </span>
            <p style={{ ...descriptorStyle, color: palette.descriptor }}>
              Courses picked for your interests based on your license and goals.
            </p>
          </div>
          {!focusMode && (
            <Link to="/catalog" className="cre-link-action" style={{ ...seeAllStyle, color: seeAllColor }}>
              See All →
            </Link>
          )}
        </header>
        {/* Distinct region name — the discovery-row widget is already named
            "Recommended for you", so this carousel names itself by its content
            to avoid a duplicate landmark. */}
        {carousel ? (
          <ShelfScroller
            label="Personalized product recommendations"
            // Large catalog cards need the wider catalog cell width; shelf +
            // trending cards keep their compact / image-card widths.
            cardWidth={
              plainShelf6
                ? { desktop: 168, mobile: 150 }
                : plainShelf
                  ? { desktop: 224, mobile: 200 }
                  : trending3up
                    ? { desktop: 300, mobile: 240 }
                    : largeCards
                      ? { desktop: 262, mobile: 240 }
                      : undefined
            }
            // Large cards are tall with only a top image, so the scroll arrows
            // sit over the cards' white bodies — use the dark arrow there.
            arrowTone={largeCards ? 'dark' : undefined}
          >
            {tileEls}
          </ShelfScroller>
        ) : (
          // No-carousel layout — pack only as many whole cards as fit the row.
          <FitRow
            minCardWidth={fitMin}
            // Bannerless shelf tiles cap at four (shelf-plain) or six (shelf-6up)
            // columns; 3-up trending at three; other styles fit as many whole
            // cards as the width allows.
            maxColumns={plainShelf6 ? 6 : plainShelf ? 4 : trending3up ? 3 : undefined}
            ariaLabel="Personalized product recommendations"
          >
            {tileEls}
          </FitRow>
        )}
      </div>

      <CourseSheetSwitch open={openCourse != null} onClose={() => setOpenCourse(null)} data={openCourse} />
      <PodcastSheet
        open={openPodcast != null}
        onClose={() => setOpenPodcast(null)}
        data={openPodcast}
      />
      <PackageSheet
        open={openPackage != null}
        onClose={() => setOpenPackage(null)}
        data={openPackage}
      />
      <MembershipSheet
        open={openMembership != null}
        onClose={() => setOpenMembership(null)}
        data={openMembership}
      />
    </section>
  )
}

type SheetHandlers = {
  setOpenCourse: (c: IndividualCourse | null) => void
  setOpenPodcast: (p: PodcastRecord | null) => void
  setOpenPackage: (p: CatalogPackage | null) => void
  setOpenMembership: (m: CatalogMembership | null) => void
}

/** Render one blended tile with its product-type treatment + click action.
 *  `showPrice` (the `dashboard-shelf-card-meta` flag) swaps the meta row's
 *  trailing token from the rating to the price on the priceable product types
 *  (course / package / membership). Podcasts have no price, so they keep their
 *  rating; career tools stay on the "Member Exclusive" flag. */
function renderTile(tile: Tile, sheets: SheetHandlers, showPrice = false, bannerless = false) {
  switch (tile.kind) {
    case 'course': {
      const c = tile.data
      const fmt = DELIVERY_META[c.delivery]
      return (
        <SimpleCard
          key={tile.key}
          bannerless={bannerless}
          onClick={() => sheets.setOpenCourse(c)}
          imageUrl={c.imageUrl}
          title={c.title}
          meta={
            showPrice
              ? { Icon: fmt.Icon, label: fmt.label, price: c.price }
              : { Icon: fmt.Icon, label: fmt.label, rating: c.rating }
          }
        />
      )
    }
    case 'podcast': {
      // No image → teal (secondary) tinted block + faded Podcast glyph; shows
      // its rating in the meta row. Teal reads as "audio CE" and stays
      // dark-mode-safe (brand ramps aren't inverted by the rebrand dark theme).
      // Podcasts carry no price, so the rating shows regardless of `showPrice`.
      const p = tile.data
      return (
        <SimpleCard
          key={tile.key}
          bannerless={bannerless}
          onClick={() => sheets.setOpenPodcast(p)}
          title={p.title}
          Icon={Podcast}
          barColor="var(--color-secondary-700)"
          iconBg="var(--color-secondary-700)"
          meta={{ Icon: Podcast, label: 'Podcast', rating: p.rating }}
        />
      )
    }
    case 'package': {
      // Warm (tertiary) block + faded Package glyph. Note: the catalog
      // PackageCard uses neutral-700, but the rebrand's dark theme inverts the
      // neutral ramp to light values — a solid neutral block would render
      // light with white text and fail contrast. The brand tertiary ramp is
      // dark-stable, so we use it here to keep the tile legible in both themes.
      const pkg = tile.data
      return (
        <SimpleCard
          key={tile.key}
          bannerless={bannerless}
          onClick={() => sheets.setOpenPackage(pkg)}
          title={pkg.title}
          Icon={Package}
          barColor="var(--color-tertiary-700)"
          iconBg="var(--color-tertiary-700)"
          meta={{
            Icon: Package,
            label: `Package · ${pkg.hours} hrs`,
            ...(showPrice ? { price: pkg.price } : null),
          }}
        />
      )
    }
    case 'membership': {
      // Primary block + faded Crown glyph — mirrors the catalog MembershipCard.
      const m = tile.data
      return (
        <SimpleCard
          key={tile.key}
          bannerless={bannerless}
          onClick={() => sheets.setOpenMembership(m)}
          title={m.title}
          Icon={Crown}
          barColor="var(--color-primary-700)"
          iconBg="var(--color-primary-700)"
          meta={{
            Icon: Crown,
            label: 'Membership',
            ...(showPrice ? { price: m.price } : null),
          }}
        />
      )
    }
    case 'tool': {
      // Career Tool (Rubi AI) — dark navy `primary-800` block + the Rubi logo
      // mark, with a `primary-900` "Member Exclusive" flag. No sheet;
      // deep-links into the Career Tools section in the rebrand shell.
      const t = tile.data
      return (
        <SimpleCard
          key={tile.key}
          bannerless={bannerless}
          to="/dashboard-rebrand?section=m-career-tools"
          title={t.title}
          Icon={RubiLogo}
          barColor="var(--color-primary-800)"
          iconBg="var(--color-primary-800)"
          flag="Member Exclusive"
          meta={{ Icon: RubiLogo, label: 'AI Career Tool' }}
        />
      )
    }
  }
}

/** Delivery → display label for a course's large-card type row (mirrors the
 *  catalog `IndividualCourseCard`). */
const DELIVERY_DISPLAY: Record<DeliveryMode, string> = {
  online: 'Online',
  webinar: 'Webinar',
  podcast: 'Podcast',
  'in-person': 'In Person',
}

const BADGE_DISPLAY: Record<'mandatory' | 'elective' | 'non-credit', string> = {
  mandatory: 'Mandatory',
  elective: 'Elective',
  'non-credit': 'Non-Credit',
}

/** Render one tile as the section's unified large card (the `large` card-style
 *  variant). One card style for every product type (matching the course-card
 *  layout — image/colored header + title + type + meta), equal height, and no
 *  "Included with Pro" footer. Clicking opens the band-managed sheet. Career
 *  Tools have no sheet, so `tool` tiles return null (filtered out upstream). */
function renderLargeTile(tile: Tile, sheets: SheetHandlers, badged = false) {
  const badges = badged ? deriveCardBadges(tile.key) : undefined
  switch (tile.kind) {
    case 'course': {
      const c = tile.data
      return (
        <RecommendedLargeCard
          key={tile.key}
          title={c.title}
          header={{ imageUrl: c.imageUrl ?? getCourseImage(c.id) }}
          TypeIcon={DELIVERY_META[c.delivery].Icon}
          typeLabel={DELIVERY_DISPLAY[c.delivery]}
          meta={[
            BADGE_DISPLAY[c.badge],
            `${c.hours} ${c.hours === 1 ? 'Hour' : 'Hours'}`,
            ...(c.states.length > 0 ? [c.states.join(' | ')] : []),
          ]}
          rating={c.rating}
          badges={badges}
          onClick={() => sheets.setOpenCourse(c)}
        />
      )
    }
    case 'podcast': {
      // Podcast gets the same course-card layout (header on top, title below) —
      // a teal header + Podcast watermark instead of a photo, so it reads as
      // audio CE while matching the course cards' structure.
      const p = tile.data
      return (
        <RecommendedLargeCard
          key={tile.key}
          title={p.title}
          header={{ bg: 'var(--color-secondary-700)', Icon: Podcast }}
          TypeIcon={Podcast}
          typeLabel="Podcast"
          meta={[
            BADGE_DISPLAY[p.badge],
            `${p.hours} ${p.hours === 1 ? 'Hour' : 'Hours'}`,
            ...(p.state ? [p.state] : []),
          ]}
          rating={p.rating}
          badges={badges}
          onClick={() => sheets.setOpenPodcast(p)}
        />
      )
    }
    case 'package': {
      const pkg = tile.data
      return (
        <RecommendedLargeCard
          key={tile.key}
          title={pkg.title}
          header={{ bg: 'var(--color-tertiary-700)', Icon: Package }}
          TypeIcon={Package}
          typeLabel="Package"
          meta={[
            `${pkg.hours} ${pkg.hours === 1 ? 'Hour' : 'Hours'}`,
            ...(pkg.states.length > 0 ? [pkg.states.join(' | ')] : []),
          ]}
          badges={badges}
          onClick={() => sheets.setOpenPackage(pkg)}
        />
      )
    }
    case 'membership': {
      const m = tile.data
      return (
        <RecommendedLargeCard
          key={tile.key}
          title={m.title}
          header={{ bg: 'var(--color-primary-700)', Icon: Crown }}
          TypeIcon={Crown}
          typeLabel="Membership"
          meta={[
            `${m.hours} ${m.hours === 1 ? 'Hour' : 'Hours'}`,
            ...(m.states.length > 0 ? [m.states.join(' | ')] : []),
          ]}
          badges={badges}
          onClick={() => sheets.setOpenMembership(m)}
        />
      )
    }
    case 'tool':
      return null
  }
}

type IconComponent = React.ComponentType<{
  size?: number
  style?: React.CSSProperties
  'aria-hidden'?: boolean
}>

/** The section's unified large card — one layout for every product type, so the
 *  course / podcast / package / membership tiles all read consistently. Equal
 *  height (`height: 100%` fills the stretched shelf cell), no "Included with
 *  Pro" footer. Header is a photo (`imageUrl`) or a colored block + watermark
 *  icon (`bg` + `Icon`). */
function RecommendedLargeCard({
  title,
  header,
  TypeIcon,
  typeLabel,
  meta,
  rating,
  badges,
  onClick,
}: {
  title: string
  header: { imageUrl: string } | { bg: string; Icon: IconComponent }
  TypeIcon: IconComponent
  typeLabel: string
  meta: string[]
  rating?: number
  /** Tier + status badge overlay (the "Badged Version" dashboard). */
  badges?: CardBadges
  onClick: () => void
}) {
  return (
    <Card
      className="cre-course-card"
      style={{ minHeight: 384, height: '100%', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
      onClick={onClick}
    >
      {'imageUrl' in header ? (
        <div
          style={{ position: 'relative', height: 138, flex: 'none', background: `center / cover no-repeat url(${header.imageUrl})` }}
        >
          {badges && <CardBadgeOverlay badges={badges} />}
        </div>
      ) : (
        <div
          style={{
            position: 'relative',
            height: 138,
            flex: 'none',
            background: header.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <header.Icon size={44} style={{ color: 'rgb(255 255 255 / 0.9)' }} aria-hidden />
          {badges && <CardBadgeOverlay badges={badges} />}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', padding: 16, gap: 8, flex: 1 }}>
        <span style={largeTitleStyle}>{title}</span>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
          <span style={largeTypeRowStyle}>
            <TypeIcon size={16} aria-hidden />
            {typeLabel}
          </span>
          {meta.length > 0 && (
            <div style={largeMetaLineStyle}>
              {meta.map((seg, i) => (
                <span key={seg} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                  {i > 0 && <span aria-hidden style={{ width: 1, height: 12, background: 'var(--color-border-subtle)' }} />}
                  {seg}
                </span>
              ))}
            </div>
          )}
          {rating != null && (
            <span style={largeRatingStyle}>
              <StarSolid size={12} aria-hidden style={{ color: 'var(--color-warning-500)' }} />
              {rating.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </Card>
  )
}

/* ─── large-card styles (mirror the catalog IndividualCourseCard) ──────── */

const largeTitleStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 600,
  lineHeight: '20px',
  color: 'var(--color-text-primary)',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  minHeight: 40,
}

const largeTypeRowStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--color-text-primary)',
}

const largeMetaLineStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '2px 6px',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--color-text-primary)',
}

const largeRatingStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--color-text-primary)',
}

/* ─── styles (tokens only) ───────────────────────────────────────────── */

// Full-bleed bar: break out of SectionShell's 40px L/R gutter so the band runs
// flush from the **left rail to the viewport's right edge**. The shell now pins
// the rail as a fixed 264px flush-left column and caps the content at 1176px
// (264 + 1176 = the 1440 content width), with a single `1fr` page-bg filler on
// the RIGHT that absorbs all extra width beyond 1440. The band's `-40px` left
// meets the rail edge; the right margin pulls across that full right filler
// (`(100vw - 1440px)`, clamped at 0 for ≤1440 viewports) to reach the page's
// right edge. No stroke border — the background alone marks the zone.
const bandStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: 0,
  marginLeft: -40,
  marginRight: 'calc(-40px - max(0px, (100vw - 1440px)))',
}

// `none` background: cancel the full-bleed so the band sits inside SectionShell's
// 40px gutter (no panel to delineate a full-width zone). The inner content then
// drops its own 40px horizontal re-pad (the gutter already provides it), so the
// header + carousel align flush-left with the page and end at the same right edge
// as the Current Learning Path / Jump Back In widgets above.
const NO_BLEED_BAND: CSSProperties = { marginLeft: 0, marginRight: 0 }

/**
 * Per-variant background + header-text palette. The band renders the `none`
 * entry by default; a `preview` override may pick another. Token-clean across
 * light + dark:
 *   - `white` — `surface-card` (adapts white→navy) + `text-secondary` (adapts),
 *     `action`-colored See All. The clean baseline.
 *   - `none` — transparent (no fill); the page surface shows through. Same
 *     adaptive dark-text treatment as `white`, just without the panel.
 *   - `primary-800` / `secondary-800` — brand ramps that stay dark in BOTH
 *     themes, so the header is white (`text-inverse`, pinned white) + a
 *     translucent-white descriptor (the on-dark pattern the gradient hero uses).
 *   - `neutral-800` — the neutral ramp INVERTS in the rebrand dark theme
 *     (charcoal in light, light-gray in dark), so its text uses `neutral-50`,
 *     which inverts WITH it (white in light, navy in dark) → contrast holds in
 *     both. (Brand-ramp white text would fail on the inverted light band.)
 */
const BG_PALETTE: Record<
  string,
  { bg: string; eyebrow: string; descriptor: string; link: string }
> = {
  white: {
    bg: 'var(--color-surface-card)',
    // Match the page's section leads ("Current Learning Path" / "Featured"),
    // which use `--color-section-lead` (theme-aware deep navy on light, light
    // brand tint on the rebrand dark theme) so the headers read as siblings.
    eyebrow: 'var(--color-section-lead)',
    descriptor: 'var(--color-text-secondary)',
    link: 'var(--color-accent-link)',
  },
  // `none` — no background fill; the band is transparent so the page surface
  // shows through. Same adaptive dark-text treatment as `white` (the page bg is
  // light in light mode, deep navy in dark mode, and the `text-secondary` /
  // `action` tokens adapt to both), just without the surface-card panel.
  none: {
    bg: 'transparent',
    eyebrow: 'var(--color-section-lead)',
    descriptor: 'var(--color-text-secondary)',
    link: 'var(--color-accent-link)',
  },
  'primary-800': {
    bg: 'var(--color-primary-800)',
    eyebrow: 'var(--color-text-inverse)',
    descriptor: 'rgb(255 255 255 / 0.85)',
    link: 'var(--color-text-inverse)',
  },
  'secondary-800': {
    bg: 'var(--color-secondary-800)',
    eyebrow: 'var(--color-text-inverse)',
    descriptor: 'rgb(255 255 255 / 0.85)',
    link: 'var(--color-text-inverse)',
  },
  'neutral-800': {
    bg: 'var(--color-neutral-800)',
    eyebrow: 'var(--color-neutral-50)',
    descriptor: 'var(--color-neutral-50)',
    link: 'var(--color-neutral-50)',
  },
}

// Re-pad the inner content back to the dashboard's 40px gutter so the header +
// cards line up with the rest of the overview.
const innerStyle: CSSProperties = {
  padding: '28px 40px',
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
}

// No-bleed (`none`) inner: drop the 40px horizontal re-pad — SectionShell's
// gutter already positions the content. The LEFT stays flush so the eyebrow +
// card carousel line up with the body-row widget cards above (whose edges sit at
// the gutter). The RIGHT gets the body-row card's 20px content inset so the "See
// All" link aligns with the Current Learning Path card's footer link (which sits
// inside that card's 20px padding) and the carousel ends with padding instead of
// running to the edge.
const innerStyleFlush: CSSProperties = {
  // No top OR bottom padding — the transparent band tucks up under the content
  // above and ends flush at the carousel (it has no panel to give breathing room).
  padding: '0 20px 0 0',
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
}

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'space-between',
  gap: 16,
}

// Section header — matched to the page's shared section lead (`sectionLeadStyle`
// in MembershipOverview / the FeaturedHero lead): 15px / 700 / 0.04em / uppercase.
// The per-variant color comes from `palette.eyebrow` (`--color-section-lead` on
// the light white/none bands so it matches the other leads; light/inverting on
// the dark bands so it stays legible there).
const eyebrowStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 15,
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--color-text-secondary)',
}

const descriptorStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '20px',
  color: 'var(--color-text-secondary)',
}

const seeAllStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-action)',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
}

/** Render one tile as a large image-only "What's Trending" card — a full-bleed
 *  cover photo + bottom-up gradient scrim with the title + meta over the image
 *  and a play affordance on audio/video. This is the removed What's Trending /
 *  `WhatsNewWidget` `VibrantCard` treatment, offered here as an alternate
 *  card style (via the `preview` prop / A/B flag). Every
 *  product type is image-forward: courses use their cover (or a seeded stock
 *  photo), the other types fall back to a deterministic `getCourseImage(key)`
 *  photo so the row reads as one image-led shelf. */
function renderVibrantTile(
  tile: Tile,
  sheets: SheetHandlers,
  ctx: { brand: ReturnType<typeof useAccount>['brand']; tier: MembershipTier; showBlurb: boolean },
) {
  // Price is shown only when the product actually "costs money" for the current
  // viewer — i.e. the tier-aware commerce state resolves to `priced`. Included
  // (member-covered) and member-exclusive items show no price.
  const pricedAmount = (product: EntitledProduct) => {
    const state = resolveCommerceState(ctx.brand, ctx.tier, product)
    return state.kind === 'priced' ? state.price : undefined
  }
  // Gate the blurb behind the `dashboard-recommended-blurb` flag.
  const blurbOf = (b?: string) => (ctx.showBlurb ? b : undefined)
  switch (tile.kind) {
    case 'course': {
      const c = tile.data
      const fmt = DELIVERY_META[c.delivery]
      // Courses flagged as a live-streamed session read as "Livestream" with a
      // video-camera icon; everything else keeps its delivery icon + label
      // (online → "Online", webinar → "Webinar", …).
      const isLivestream = c.livestream === true
      return (
        <VibrantCard
          key={tile.key}
          image={c.imageUrl ?? getCourseImage(c.id)}
          title={c.title}
          blurb={blurbOf(c.blurb)}
          MetaIcon={isLivestream ? Video : fmt.Icon}
          // Show the actual delivery mode (Livestream / Online / Webinar / …),
          // not the generic "Course" shelf label.
          metaLabel={isLivestream ? 'Livestream' : DELIVERY_DISPLAY[c.delivery]}
          hours={c.hours}
          price={pricedAmount(c)}
          play={c.delivery === 'podcast' || c.delivery === 'webinar'}
          onClick={() => sheets.setOpenCourse(c)}
        />
      )
    }
    case 'podcast': {
      // Podcasts here are editorial `PodcastRecord`s (free with membership) —
      // no à-la-carte price, so only the blurb is added.
      const p = tile.data
      return (
        <VibrantCard
          key={tile.key}
          image={getCourseImage(tile.key)}
          title={p.title}
          blurb={blurbOf(p.description)}
          MetaIcon={Podcast}
          metaLabel="Podcast"
          hours={p.hours}
          play
          onClick={() => sheets.setOpenPodcast(p)}
        />
      )
    }
    case 'package': {
      const pkg = tile.data
      return (
        <VibrantCard
          key={tile.key}
          image={getCourseImage(tile.key)}
          title={pkg.title}
          blurb={blurbOf(pkg.blurb)}
          MetaIcon={Package}
          metaLabel="Package"
          hours={pkg.hours}
          price={pricedAmount(pkg)}
          onClick={() => sheets.setOpenPackage(pkg)}
        />
      )
    }
    case 'membership': {
      const m = tile.data
      return (
        <VibrantCard
          key={tile.key}
          image={getCourseImage(tile.key)}
          title={m.title}
          blurb={blurbOf(m.blurb)}
          MetaIcon={Crown}
          metaLabel="Membership"
          price={pricedAmount(m)}
          onClick={() => sheets.setOpenMembership(m)}
        />
      )
    }
    case 'tool': {
      // Career tools carry no price; their meta line doubles as the blurb.
      const t = tile.data
      return (
        <VibrantCard
          key={tile.key}
          image={getCourseImage(tile.key)}
          title={t.title}
          blurb={blurbOf(t.meta)}
          MetaIcon={RubiLogo}
          metaLabel="AI Career Tool"
          metaTag="Member Exclusive"
          to="/dashboard-rebrand?section=m-career-tools"
        />
      )
    }
  }
}

type VibrantCardProps = {
  image: string
  title: string
  /** Short "what this is" blurb, clamped to two lines under the title. */
  blurb?: string
  MetaIcon: IconComponent
  metaLabel: string
  hours?: number
  /** Price to show after the type (divider-separated) — only when the item
   *  costs the current viewer money (resolved upstream). Omit → no price. */
  price?: number
  /** Text shown in the same slot as the price (divider-separated, after the
   *  type) for items that have no price — e.g. "Member Exclusive" on career
   *  tools. Ignored when a `price` is present. */
  metaTag?: string
  play?: boolean
} & ({ onClick: () => void; to?: never } | { to: string; onClick?: never })

/** Large image-only card — full-bleed cover + bottom-up scrim, title + meta
 *  (hours · type) bottom-left, optional play disc bottom-right. Mirrors the
 *  removed `WhatsNewWidget` `VibrantCard`. On-image text is always-white (the
 *  scrim is dark in both themes). Click semantics match the shelf/large tiles:
 *  a sheet-opening button, or a `Link` for the Career Tool tile. */
function VibrantCard(props: VibrantCardProps) {
  const { image, title, blurb, MetaIcon, metaLabel, hours, price, metaTag, play } = props
  const inner = (
    <div className="cre-recommended-simple-card cre-vibrant-card" style={{ ...vibCardStyle, backgroundImage: `url(${image})` }}>
      {/* Scrim sized to the text: the taller/darker gradient when a blurb is
          present, a shorter/lighter one when it's hidden (title + meta only) so
          the overlay doesn't creep up past the shorter text block. */}
      <div aria-hidden style={blurb ? vibScrimStyle : vibScrimStyleCompact} />
      <div style={vibContentStyle}>
        <div style={{ minWidth: 0 }}>
          <h3 style={vibTitleStyle}>{title}</h3>
          {blurb && <p style={vibBlurbStyle}>{blurb}</p>}
          <div style={vibMetaStyle}>
            {hours != null && (
              <>
                <span style={{ whiteSpace: 'nowrap' }}>
                  {hours} {hours === 1 ? 'Hour' : 'Hours'}
                </span>
                <span aria-hidden style={vibMetaDivider} />
              </>
            )}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
              <MetaIcon size={14} aria-hidden />
              {metaLabel}
            </span>
            {price != null ? (
              <>
                <span aria-hidden style={vibMetaDivider} />
                <span style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{formatPrice(price)}</span>
              </>
            ) : (
              metaTag && (
                <>
                  <span aria-hidden style={vibMetaDivider} />
                  <span style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{metaTag}</span>
                </>
              )
            )}
          </div>
        </div>
        {play && (
          <span aria-hidden style={vibPlayStyle}>
            <span style={vibPlayTriangleStyle} />
          </span>
        )}
      </div>
    </div>
  )
  if ('to' in props && props.to) {
    return (
      <Link
        to={props.to}
        aria-label={title}
        style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
      >
        {inner}
      </Link>
    )
  }
  return (
    <button
      type="button"
      onClick={props.onClick}
      aria-label={title}
      style={{ display: 'block', width: '100%', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
    >
      {inner}
    </button>
  )
}

/* ─── What's Trending (VibrantCard) styles — tokens only ──────────────── */

const vibCardStyle: CSSProperties = {
  position: 'relative',
  width: '100%',
  height: 190,
  borderRadius: 'var(--radius-lg)',
  overflow: 'hidden',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  // Resting shadow lives in the `.cre-vibrant-card` CSS rule (not inline) so the
  // `:hover` rule can override it — an inline box-shadow would win over the
  // stylesheet and the hover would never deepen.
}

// Darkened bottom-up scrim sized to the on-image text block (title + blurb +
// meta). Behind the small blurb/meta text it stays ≥ 0.86 (white text clears
// WCAG AA even over a bright photo); behind the large title it holds ~0.7
// (large-text 3:1); the top ~15% fades out so the image still reads.
// Uses the same deep brand navy `rgb(4 17 36)` as the FeaturedHero scrim (kept
// dark in both themes) so the two image overlays read as one system.
const vibScrimStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  background:
    'linear-gradient(to top, rgb(4 17 36 / 0.92) 0%, rgb(4 17 36 / 0.86) 50%, rgb(4 17 36 / 0.7) 68%, rgb(4 17 36 / 0.2) 88%, rgb(4 17 36 / 0) 100%)',
}

// Compact scrim — used when the blurb is hidden (title + meta only). The dark
// region ends lower and fades sooner so it hugs the shorter text block and lets
// more of the image show, while still holding ≥ 0.72 behind the title/meta.
const vibScrimStyleCompact: CSSProperties = {
  position: 'absolute',
  inset: 0,
  background:
    'linear-gradient(to top, rgb(4 17 36 / 0.9) 0%, rgb(4 17 36 / 0.72) 40%, rgb(4 17 36 / 0.3) 60%, rgb(4 17 36 / 0) 80%)',
}

const vibContentStyle: CSSProperties = {
  position: 'absolute',
  left: 16,
  right: 16,
  bottom: 14,
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'space-between',
  gap: 12,
}

const vibTitleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontSize: 18,
  fontWeight: 700,
  lineHeight: 1.2,
  color: 'rgb(255 255 255 / 0.98)',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
}

// Short "what this is" blurb under the title — 2-line clamp, slightly dimmed
// white so it sits below the title in the visual hierarchy but stays legible
// over the dark scrim.
const vibBlurbStyle: CSSProperties = {
  margin: '6px 0 0',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '18px',
  color: 'rgb(255 255 255 / 0.88)',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
}

const vibMetaStyle: CSSProperties = {
  marginTop: 6,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 500,
  color: 'rgb(255 255 255 / 0.92)',
}

const vibMetaDivider: CSSProperties = { width: 1, height: 12, background: 'rgb(255 255 255 / 0.5)' }

// Whole-dollar prices render bare ($89); anything with cents keeps two decimals
// ($49.99). Matches the compact shelf card's `formatShelfPrice`.
function formatPrice(price: number): string {
  return Number.isInteger(price) ? `$${price}` : `$${price.toFixed(2)}`
}

const vibPlayStyle: CSSProperties = {
  flexShrink: 0,
  width: 40,
  height: 40,
  borderRadius: 'var(--radius-pill)',
  background: 'color-mix(in srgb, var(--color-cta-500) 85%, transparent)',
  color: 'rgb(255 255 255 / 1)',
  display: 'grid',
  placeItems: 'center',
  boxShadow: '0 2px 8px rgb(0 0 0 / 0.3)',
}

const vibPlayTriangleStyle: CSSProperties = {
  width: 0,
  height: 0,
  marginLeft: 3,
  borderTop: '7px solid transparent',
  borderBottom: '7px solid transparent',
  borderLeft: '11px solid currentColor',
}

/** Fit-to-screen row — the no-carousel layout for the Recommended band. Renders
 *  only as many WHOLE cards as fit the available width (`minCardWidth` per card
 *  style) in an even grid, and re-measures on resize so the count adapts. Falls
 *  back to a horizontal swipe row only when the viewport is too narrow to show
 *  at least two cards (the "carousel only if needed by screen size" case). */
function FitRow({
  minCardWidth,
  gap = 16,
  maxColumns,
  ariaLabel,
  children,
}: {
  minCardWidth: number
  gap?: number
  /** Optional hard cap on the column count (e.g. the 3-up trending variant).
   *  The grid still shows FEWER when the width can't fit that many, so it never
   *  overflows — the cap only prevents growing past it on wide viewports. */
  maxColumns?: number
  ariaLabel: string
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  const capCols = (n: number) => (maxColumns ? Math.min(n, maxColumns) : n)
  const [cols, setCols] = useState<number>(() => {
    // First-paint estimate (content column ≈ viewport − rail − gutters) so the
    // grid doesn't flash a full-width row before the observer measures.
    if (typeof window === 'undefined') return capCols(4)
    const est = Math.max(320, window.innerWidth - 360)
    return capCols(Math.max(1, Math.floor((est + gap) / (minCardWidth + gap))))
  })

  useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const measure = () => {
      const w = el.clientWidth
      if (!w) return
      setCols(capCols(Math.max(1, Math.floor((w + gap) / (minCardWidth + gap)))))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minCardWidth, gap, maxColumns])

  const items = Children.toArray(children)
  const scroll = cols < 2 && items.length > 1
  const n = Math.min(cols, items.length)
  const shown = scroll ? items : items.slice(0, n)

  return (
    <div
      ref={ref}
      role="list"
      aria-label={ariaLabel}
      style={
        scroll
          ? {
              display: 'flex',
              gap,
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              paddingBottom: 4,
              WebkitOverflowScrolling: 'touch',
            }
          : { display: 'grid', gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`, gap }
      }
    >
      {shown.map((child, i) => (
        <div
          role="listitem"
          key={i}
          style={
            scroll ? { flex: `0 0 ${Math.max(minCardWidth, 220)}px`, scrollSnapAlign: 'start' } : undefined
          }
        >
          {child}
        </div>
      ))}
    </div>
  )
}
