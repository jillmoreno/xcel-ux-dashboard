import { Sheet } from '@/components/ui/Sheet'
import { SheetHeader, SHEET_BODY } from '@/components/ui/SheetHeader'
import { HelpSupportPanel } from './HelpSupportPanel'

/**
 * HELP, AS A SHEET — `nav-help`, 2026-10-01, the direct ask.
 *
 * ONE SHEET, TWO TRIGGERS, and that is the whole reason it is a component
 * rather than markup in the header. `nav-help` chooses between a `?` in the
 * header utilities and a row in the account dropdown; both open THIS, so the
 * variant moves a trigger and never changes what Help is. Build it twice and
 * the flag would quietly be testing two help experiences instead of two
 * placements, which is the one thing it must not do.
 *
 * ⚠ IT IS THE SECTION'S OWN BODY, NOT A COPY OF IT. `HelpSupportPanel` is what
 * `?section=support` renders, reused here unchanged — so the rail's Get Help
 * and the top nav's Help land on the same four entry points (Customer Support,
 * Live Chat, FAQs, Contact Us). Its grid is `auto-fill` over a 300px floor, so
 * it reflows to one column in this width with nothing to override.
 *
 * ⚠ ITS CARDS OPEN SHEETS OF THEIR OWN — Customer Support and Contact Us are
 * both slide-overs, so those land ON TOP of this one. That nesting is the
 * existing behaviour of the panel inside the section; it is worth a look in the
 * review, and it is the argument for the sheet carrying the section's shortcuts
 * rather than the section's full depth.
 *
 * ⚠ ONLY WHERE THE RAIL IS NOT — see `showsHelpControl`. Under the left nav the
 * rail's Get Help row already carries Help and it opens the SECTION, not this.
 * The two arms therefore answer Help differently today; the ask scoped the
 * sheet to the top nav, and the inconsistency is deliberate rather than missed.
 */
export function HelpSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Help" width={480}>
      <SheetHeader title="Help" onClose={onClose} />
      <div style={SHEET_BODY}>
        <HelpSupportPanel />
      </div>
    </Sheet>
  )
}
