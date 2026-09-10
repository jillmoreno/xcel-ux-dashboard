/**
 * Icon registry — Font Awesome 7 Pro Light SVGs imported as React components.
 * Each icon is a thin wrapper that mirrors lucide-react's API surface
 * (`size` prop, currentColor inheritance, `aria-hidden`, className, style)
 * so existing call sites can swap with minimal changes.
 *
 * SVG sources: src/icons/<slug>.svg (FA Pro Light style).
 * Brand-file mapping: see icon-mapping table in .claude/skills/brands/cre.md
 */
import type { CSSProperties, SVGProps } from 'react'

// Raw SVG-as-React-component imports (vite-plugin-svgr).
import ArrowLeftSvg from './arrow-left.svg?react'
import BarsSvg from './bars.svg?react'
import ArrowRightSvg from './arrow-right.svg?react'
import ArrowsRotateSvg from './arrows-rotate.svg?react'
import ArrowUpRightFromSquareSvg from './arrow-up-right-from-square.svg?react'
import ArrowRightFromBracketSvg from './arrow-right-from-bracket.svg?react'
import AwardSvg from './award.svg?react'
import AwardSolidSvg from './award-solid.svg?react'
import BellSvg from './bell.svg?react'
import BoltSvg from './bolt.svg?react'
import BookSvg from './book.svg?react'
import BookFullSvg from './book-full.svg?react'
import BlogSvg from './blog.svg?react'
import BookOpenSvg from './book-open.svg?react'
import SignsPostSvg from './signs-post.svg?react'
import PersonRunningSvg from './person-running.svg?react'
import BooksSvg from './books.svg?react'
import BoxSvg from './box.svg?react'
import BriefcaseSvg from './briefcase.svg?react'
import CartShoppingSvg from './cart-shopping.svg?react'
import ChalkboardUserSvg from './chalkboard-user.svg?react'
import CheckSvg from './check.svg?react'
import ChevronDownSvg from './chevron-down.svg?react'
import ChevronUpSvg from './chevron-up.svg?react'
import ChevronRightSvg from './chevron-right.svg?react'
import CircleSvg from './circle-dashed.svg?react'
import CircleCheckSvg from './circle-check.svg?react'
import CircleUserSvg from './circle-user.svg?react'
import CircleInfoSvg from './circle-info.svg?react'
import CircleQuestionSvg from './circle-question.svg?react'
import ClockSvg from './clock.svg?react'
import CreditCardSvg from './credit-card.svg?react'
import CrownSvg from './crown.svg?react'
import DisplaySvg from './display.svg?react'
import DownloadSvg from './download.svg?react'
import MobileScreenSvg from './mobile-screen.svg?react'
import TabletScreenSvg from './tablet-screen.svg?react'
import BrowserWindowSvg from './browser-window.svg?react'
import SunSvg from './sun.svg?react'
import MoonSvg from './moon.svg?react'
import CircleHalfStrokeSvg from './circle-half-stroke.svg?react'
import SlidersSvg from './sliders.svg?react'
import EllipsisVerticalSvg from './ellipsis-vertical.svg?react'
import EyeSvg from './eye.svg?react'
import EyeSlashSvg from './eye-slash.svg?react'
import EnvelopeSvg from './envelope.svg?react'
import FileLinesSvg from './file-lines.svg?react'
import FlagSvg from './flag.svg?react'
import GaugeSvg from './gauge.svg?react'
import GemSvg from './gem.svg?react'
import GiftSvg from './gift.svg?react'
import GraduationCapSvg from './graduation-cap.svg?react'
import Grid2Svg from './grid-2.svg?react'
import HeartSvg from './heart.svg?react'
import HeartPulseSvg from './heart-pulse.svg?react'
import LightbulbSvg from './lightbulb.svg?react'
import MountainSvg from './mountain.svg?react'
import HouseSvg from './house.svg?react'
import HouseSolidSvg from './house-solid.svg?react'
import BookFullSolidSvg from './book-full-solid.svg?react'
import BooksSolidSvg from './books-solid.svg?react'
import GemSolidSvg from './gem-solid.svg?react'
import Grid2SolidSvg from './grid-2-solid.svg?react'
import LifeRingSolidSvg from './life-ring-solid.svg?react'
import MegaphoneSolidSvg from './megaphone-solid.svg?react'
import NotebookSolidSvg from './notebook-solid.svg?react'
import PodcastSolidSvg from './podcast-solid.svg?react'
import SignsPostSolidSvg from './signs-post-solid.svg?react'
import HourglassClockSvg from './hourglass-clock.svg?react'
import CalendarDaySvg from './calendar-day.svg?react'
import CalendarExclamationSvg from './calendar-exclamation.svg?react'
import CalendarPenSvg from './calendar-pen.svg?react'
import TrashSvg from './trash.svg?react'
import ThumbtackSvg from './thumbtack.svg?react'
import CircleExclamationSvg from './circle-exclamation.svg?react'
import TriangleExclamationSvg from './triangle-exclamation.svg?react'
import ClipboardListSvg from './clipboard-list.svg?react'
import PenToSquareSvg from './pen-to-square.svg?react'
import NotebookSvg from './notebook.svg?react'
import ShoePrintsSvg from './shoe-prints.svg?react'
import PizzaSliceSvg from './pizza-slice.svg?react'
import AwardThinSvg from './award-thin.svg?react'
import BookOpenThinSvg from './book-open-thin.svg?react'
import BooksThinSvg from './books-thin.svg?react'
import GemThinSvg from './gem-thin.svg?react'
import GraduationCapThinSvg from './graduation-cap-thin.svg?react'
import BadgeCheckThinSvg from './badge-check-thin.svg?react'
import CrownThinSvg from './crown-thin.svg?react'
import IdCardSvg from './id-card.svg?react'
import LockSvg from './lock.svg?react'
import LockSolidSvg from './lock-solid.svg?react'
import MagnifyingGlassSvg from './magnifying-glass.svg?react'
import MegaphoneSvg from './megaphone.svg?react'
import MessageCircleSvg from './message-circle.svg?react'
import LifeRingSvg from './life-ring.svg?react'
import PhoneSvg from './phone.svg?react'
import MinusSvg from './minus.svg?react'
import PlusSvg from './plus.svg?react'
import PrintSvg from './print.svg?react'
import ReceiptSvg from './receipt.svg?react'
import RobotSvg from './robot.svg?react'
import RubiLogoSvg from './rubi-logo.svg?react'
import RubiMarkSvg from './rubi-mark.svg?react'
import RubiWordmarkSvg from './rubi-wordmark.svg?react'
import ShareFromSquareSvg from './share-from-square.svg?react'
import StarSvg from './star.svg?react'
import StarSolidSvg from './star-solid.svg?react'
import PodcastSvg from './podcast.svg?react'
import TableCellsRowsSvg from './table-cells-rows.svg?react'
import TableListSvg from './table-list.svg?react'
import UserSvg from './user.svg?react'
import UserSlashSvg from './user-slash.svg?react'
import UsersSvg from './users.svg?react'
import VideoSvg from './video.svg?react'
import FacebookSvg from './facebook.svg?react'
import XmarkSvg from './xmark.svg?react'

type LucideLikeProps = {
  size?: number
  className?: string
  style?: CSSProperties
  'aria-hidden'?: boolean | 'true' | 'false'
  'aria-label'?: string
  /** Ignored — included for API parity with lucide-react. FA SVGs use a fixed stroke. */
  strokeWidth?: number
}

function makeIcon(Svg: React.FC<SVGProps<SVGSVGElement>>) {
  return function Icon({ size = 16, className, style, ...rest }: LucideLikeProps) {
    // strokeWidth is accepted for lucide-react API parity but has no visible
    // effect on FA fill-rendered SVGs — pass-through is harmless on <svg>.
    const { strokeWidth: _strokeWidth, ...svgProps } = rest
    void _strokeWidth
    return (
      <Svg
        width={size}
        height={size}
        className={className}
        style={{
          display: 'inline-block',
          verticalAlign: 'middle',
          fill: 'currentColor',
          // Some FA Pro icons (Award, etc.) have path content with negative-Y
          // that lives outside the viewBox top. Default SVG overflow:hidden
          // clips that. Allowing overflow lets the full glyph render inside
          // the icon's bounding box.
          overflow: 'visible',
          ...style,
        }}
        focusable={false}
        {...svgProps}
      />
    )
  }
}

/* Names below mirror lucide-react identifiers used in the codebase
   (see brand file's icon-mapping table). The right-hand SVG is the
   FA 7 Pro Light source. */
export const ArrowLeft = makeIcon(ArrowLeftSvg)
export const Bars = makeIcon(BarsSvg) // FA: bars (hamburger)
export const ArrowRight = makeIcon(ArrowRightSvg)
export const ArrowsRotate = makeIcon(ArrowsRotateSvg) // FA: arrows-rotate (renewal)
export const ArrowUpRightFromSquare = makeIcon(ArrowUpRightFromSquareSvg)
export const Award = makeIcon(AwardSvg)
export const AwardSolid = makeIcon(AwardSolidSvg) // FA Free solid award
export const Bell = makeIcon(BellSvg)
export const Bolt = makeIcon(BoltSvg) // FA: bolt
export const Book = makeIcon(BookSvg) // FA: book (closed)
export const Books = makeIcon(BooksSvg) // FA: books (stacked)
export const BookFull = makeIcon(BookFullSvg) // FA: book (full)
export const Blog = makeIcon(BlogSvg) // FA: blog (regular)
export const BookOpen = makeIcon(BookOpenSvg)
export const SignsPost = makeIcon(SignsPostSvg) // FA: signs-post
export const PersonRunning = makeIcon(PersonRunningSvg) // FA: person-running
export const Briefcase = makeIcon(BriefcaseSvg)
export const ChalkboardUser = makeIcon(ChalkboardUserSvg)
export const Check = makeIcon(CheckSvg)
export const ChevronDown = makeIcon(ChevronDownSvg)
export const ChevronUp = makeIcon(ChevronUpSvg) // FA: chevron-up
export const ChevronRight = makeIcon(ChevronRightSvg)
export const Circle = makeIcon(CircleSvg) // FA: circle-dashed (used for Not Started status)
export const CircleCheck = makeIcon(CircleCheckSvg) // FA: circle-check
export const CircleUser = makeIcon(CircleUserSvg) // FA: circle-user
export const CircleInfo = makeIcon(CircleInfoSvg) // FA: circle-info
export const Clock = makeIcon(ClockSvg)
export const CreditCard = makeIcon(CreditCardSvg)
export const Crown = makeIcon(CrownSvg)
export const Download = makeIcon(DownloadSvg)
export const Eye = makeIcon(EyeSvg)
export const EyeSlash = makeIcon(EyeSlashSvg) // FA: eye-slash ("Hide Details")
export const Envelope = makeIcon(EnvelopeSvg) // FA: envelope (Send Reminder)
export const FileText = makeIcon(FileLinesSvg) // FA: file-lines
export const Flag = makeIcon(FlagSvg)
export const Facebook = makeIcon(FacebookSvg) // FA Free brand: facebook (solid circle)
// FA: gauge-high (7.3.1 light), supplied 2026-09-10 — replaced a 6.6.0
// `gauge-simple-high`. Same diagonal `-high` needle, which is what makes it
// read as a dial rather than an arrow in a circle at the rail's 17px; the
// change is the tick dots and the FA7 generation, which matches the ~70 other
// 7.x icons here.
export const Gauge = makeIcon(GaugeSvg)
export const Gem = makeIcon(GemSvg)
export const Gift = makeIcon(GiftSvg) // FA: gift (Gift Recipients)
export const GraduationCap = makeIcon(GraduationCapSvg)
export const Grid = makeIcon(Grid2Svg) // FA: grid-2
export const Heart = makeIcon(HeartSvg)
export const HeartPulse = makeIcon(HeartPulseSvg)
export const Lightbulb = makeIcon(LightbulbSvg)
export const Mountain = makeIcon(MountainSvg)
export const House = makeIcon(HouseSvg)
export const HouseSolid = makeIcon(HouseSolidSvg) // FA solid house — active nav state
export const BookFullSolid = makeIcon(BookFullSolidSvg) // FA solid book — active nav state
export const LibrarySolid = makeIcon(BooksSolidSvg) // FA solid books — active nav state
export const GemSolid = makeIcon(GemSolidSvg) // FA solid gem — active nav state
export const GridSolid = makeIcon(Grid2SolidSvg) // FA solid grid-2 — active nav state
export const LifeRingSolid = makeIcon(LifeRingSolidSvg) // FA solid life-ring — active nav state
export const MegaphoneSolid = makeIcon(MegaphoneSolidSvg) // FA solid megaphone — active nav state
export const NotebookSolid = makeIcon(NotebookSolidSvg) // FA solid notebook — active nav state
export const PodcastSolid = makeIcon(PodcastSolidSvg) // FA solid podcast — active nav state
export const SignsPostSolid = makeIcon(SignsPostSolidSvg) // FA sharp-solid signs-post — active nav state
export const HourglassClock = makeIcon(HourglassClockSvg)
export const CalendarDay = makeIcon(CalendarDaySvg)
export const CalendarExclamation = makeIcon(CalendarExclamationSvg)
export const CalendarPen = makeIcon(CalendarPenSvg)
export const Trash = makeIcon(TrashSvg)
export const Thumbtack = makeIcon(ThumbtackSvg) // FA: thumbtack
export const CircleExclamation = makeIcon(CircleExclamationSvg)
export const TriangleExclamation = makeIcon(TriangleExclamationSvg)
export const ClipboardList = makeIcon(ClipboardListSvg)
export const PenToSquare = makeIcon(PenToSquareSvg)
export const Notebook = makeIcon(NotebookSvg)
export const ShoePrints = makeIcon(ShoePrintsSvg)
export const PizzaSlice = makeIcon(PizzaSliceSvg)
export const AwardThin = makeIcon(AwardThinSvg)
export const BookOpenThin = makeIcon(BookOpenThinSvg)
export const LibraryThin = makeIcon(BooksThinSvg)
export const GemThin = makeIcon(GemThinSvg)
export const GraduationCapThin = makeIcon(GraduationCapThinSvg)
export const BadgeCheckThin = makeIcon(BadgeCheckThinSvg)
export const CrownThin = makeIcon(CrownThinSvg)
export const HelpCircle = makeIcon(CircleQuestionSvg) // FA: circle-question
export const IdCard = makeIcon(IdCardSvg)
export const Layout = makeIcon(TableCellsRowsSvg) // FA: table-cells-rows
export const Table = makeIcon(TableListSvg) // FA: table-list
export const Library = makeIcon(BooksSvg) // FA: books
export const Lock = makeIcon(LockSvg)
export const LockSolid = makeIcon(LockSolidSvg)
export const LogOut = makeIcon(ArrowRightFromBracketSvg) // FA: arrow-right-from-bracket
export const MagnifyingGlass = makeIcon(MagnifyingGlassSvg) // FA: magnifying-glass
export const Megaphone = makeIcon(MegaphoneSvg) // FA: bullhorn / megaphone
export const MessageCircle = makeIcon(MessageCircleSvg) // FA: comment / message
export const LifeRing = makeIcon(LifeRingSvg) // FA: life-ring (customer support)
export const Phone = makeIcon(PhoneSvg) // FA: phone (contact us)
export const Minus = makeIcon(MinusSvg)
export const MobileScreen = makeIcon(MobileScreenSvg) // FA: mobile-screen
export const TabletScreen = makeIcon(TabletScreenSvg) // FA: tablet-screen-button
export const Monitor = makeIcon(DisplaySvg) // FA: display
export const BrowserWindow = makeIcon(BrowserWindowSvg) // browser window (demo-frame preview)
export const Sun = makeIcon(SunSvg) // FA: sun (light-mode affordance)
export const Moon = makeIcon(MoonSvg) // FA: moon (dark-mode affordance)
export const CircleHalf = makeIcon(CircleHalfStrokeSvg) // FA: circle-half-stroke (dim-mode affordance)
export const Sliders = makeIcon(SlidersSvg) // FA: sliders (preferences affordance)
export const MoreVertical = makeIcon(EllipsisVerticalSvg) // FA: ellipsis-vertical
export const Package = makeIcon(BoxSvg) // FA: box
export const Plus = makeIcon(PlusSvg)
export const Printer = makeIcon(PrintSvg) // FA: print
export const Receipt = makeIcon(ReceiptSvg)
export const Robot = makeIcon(RobotSvg)
export const RubiLogo = makeIcon(RubiLogoSvg) // Rubi logo mark (monochrome / currentColor)

/**
 * Rubi brand logo — multicolor (the hexagonal mark is the brand red
 * `#C8203A`; the wordmark renders in `--color-neutral-darkest`). Skips
 * `makeIcon` because the SVG paints with explicit fills + the parts have
 * a different aspect ratio than the square FA icons.
 *
 * Use `<RubiMark />` for the hexagonal badge alone (120 × 135 viewBox) and
 * `<RubiWordmark />` for the "Rubi" wordmark text (263 × 98 viewBox).
 */
type RubiArtProps = {
  width?: number | string
  height?: number | string
  className?: string
  style?: CSSProperties
  'aria-hidden'?: boolean | 'true' | 'false'
  'aria-label'?: string
}
export function RubiMark({ width = 24, height, className, style, ...rest }: RubiArtProps) {
  return (
    <RubiMarkSvg
      width={width}
      height={height ?? (typeof width === 'number' ? Math.round((width * 135) / 120) : undefined)}
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
      {...rest}
    />
  )
}
export function RubiWordmark({ width = 80, height, className, style, ...rest }: RubiArtProps) {
  return (
    <RubiWordmarkSvg
      width={width}
      height={height ?? (typeof width === 'number' ? Math.round((width * 98) / 263) : undefined)}
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
      {...rest}
    />
  )
}
export const Search = makeIcon(MagnifyingGlassSvg) // FA: magnifying-glass
export const Share2 = makeIcon(ShareFromSquareSvg) // FA: share-from-square
export const ShoppingCart = makeIcon(CartShoppingSvg) // FA: cart-shopping
export const Star = makeIcon(StarSvg)
export const StarSolid = makeIcon(StarSolidSvg)
export const Podcast = makeIcon(PodcastSvg)
export const User = makeIcon(UserSvg)
export const UserSlash = makeIcon(UserSlashSvg) // FA: user-slash
export const Users = makeIcon(UsersSvg)
export const Video = makeIcon(VideoSvg)
export const X = makeIcon(XmarkSvg) // FA: xmark
