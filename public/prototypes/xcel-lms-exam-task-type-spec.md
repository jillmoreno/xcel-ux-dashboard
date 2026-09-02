# Licensing Exam Task Type — Study Calendar

**Status:** spec, pre-build · **Date:** 2026-09-01 · **Surface:** Study Calendar (`/my-learning/path` → Study Calendar tab)
**Answers:** FinServ *Learner and Admin Wireframe Brief* → Learner flow **06 · Licensure hand-off** ("design the leaving, the waiting, and the coming back — including the failure case")

---

## 1. Why this exists

The brief treats the external licensing exam as an unsolved flow. It mostly isn't: the Study Calendar already models the exam date as the **anchor the whole plan derives from** (`StudyCalendar.examDate`, edited via `EditExamDatePanel`, surfaced by `ExamDateCard`). A learner already types a date that reshapes their own schedule — that is the hard half of "capturing the exam date," and it is built.

What is missing is everything *after* the date: the booking details, the sit, the result, and the retake. This spec adds one task kind that carries those.

**Scope note.** The Study Calendar is `brand === 'stc'` today (`showStudyCalendar` in `LearningPathPage`), per-path via `hasStudyCalendarFor(brand, pathId)`. FinServ *is* the STC ecosystem, so the brand gate is right; the **path** gate is what opens for insurance pre-licensing. Non-qualifying paths already fall into `StudyCalendarEmptyState` cleanly, so widening the gate is additive.

---

## 2. Decision 1 — the name `exam` is already taken

`StudyTaskKind` is `'video' | 'quiz' | 'exam' | 'reading' | 'custom'`, and **`'exam'` already means the practice exam** — every fixture instance is a course-linked "Complete Progress Exam 2A" with an `href` into the LMS:

```ts
{ id: 's79-w2-tue-4', title: 'Complete Progress Exam 2A',
  kind: 'exam', href: '/courses/series79-pe2a', isCourseLinked: true }
```

The external licensing exam is the opposite of that in every respect: not course-linked, no `href`, not auto-completed, and it resolves to an outcome rather than to *done*.

> **Use `'licensing-exam'`.** Do not overload `'exam'`. `KIND_LABEL` reads "Exam" for practice today; the new kind reads **"Licensing Exam"**. Two things that are opposites must not share a key — the fixtures would still typecheck and the calendar would silently treat a real exam as a practice one.

---

## 3. Decision 2 — one object, two renderings

There are already **two** things on this calendar, and the licensing exam fits neither cleanly:

| | `StudyTask` | `CustomEvent` |
|---|---|---|
| Origin | plan-generated | learner-created |
| Has status | yes (`completed`/`in-progress`/`upcoming`/`overdue`) | no |
| Recurs | no | yes (`expandCustomEventOccurrences`) |
| Carries data | no | title/date/time only |
| Has an outcome | no | no |

A licensing exam is learner-created (like a `CustomEvent`), carries a real payload (like neither), resolves to pass/fail (like neither), and **is also the plan anchor** (unlike both). A retake is not a recurrence — it is a new attempt with its own outcome, so `CustomEvent`'s expansion model is actively wrong for it.

**Recommendation: a third entity on the calendar, rendered in two places.**

```ts
export type ExamOutcome = 'passed' | 'failed'
export type ExamDelivery = 'in-person' | 'online-proctored'

export type ExamAttempt = {
  id: string
  /** ISO yyyy-mm-dd — the scheduled sit date. THE calendar anchor. */
  date: string
  /** HH:mm 24h. Optional — providers don't always confirm a time up front. */
  time?: string
  provider?: string
  delivery?: ExamDelivery
  /** Test-centre address, or undefined when delivery is online-proctored. */
  location?: string
  confirmationNumber?: string
  /** Undefined until the learner records a result. */
  outcome?: ExamOutcome
  /** ISO — when the result was recorded (NOT the sit date). */
  resolvedOn?: string
  score?: number
  /** Learner's own note. Load-bearing on a fail. */
  note?: string
}
```

`StudyCalendar` gains `attempts: ExamAttempt[]` (chronological, newest last), plus one selector:

```ts
/** The attempt the calendar is currently anchored to: the newest unresolved
 *  attempt, else the newest attempt, else null (target-date-only). */
export function currentAttempt(cal: StudyCalendar): ExamAttempt | null
```

### Keep `examDate`, but make it a mirror with one writer

`examDate` is read by `weeksUntilExam`, `daysUntilExam`, `pacingStatus`, `isOnTrack`, `ExamDateCard`, `EditExamDatePanel`, `ProjectedCompletionCard` and the plan generator. Do **not** re-point all of those in this change.

Instead: `examDate` stays, and is defined as a **mirror of `currentAttempt(cal)?.date`**, written by exactly one function on the save path.

> **Assert the invariant, don't comment it.** Add `LicensingExamAnchor.test.ts` asserting `cal.examDate === currentAttempt(cal)?.date` for every fixture. This is the same failure mode as the three `daysUntil` copies and the `ROW_LABEL` / `RENEWAL_DATE_LABEL` merge — two objects holding one date, drifting invisibly because nothing compares them on screen. A test is the only thing that catches it.

---

## 4. The state machine

Six states. **Four are derived** — only `outcome` and the attempt list are stored.

| State | Resolves when | Anchor card reads | Primary action |
|---|---|---|---|
| `unscheduled` | no attempts | "Target date — not booked yet" | **Schedule exam** |
| `scheduled` | attempt, `date` > today, no outcome | date + provider + weeks out | **View details** |
| `imminent` | as `scheduled`, `daysUntilExam ≤ 7` | date + "in N days", warning emphasis | **View details** |
| `awaiting-result` | attempt, `date` ≤ today, no outcome | "You sat on {date}" | **Record result** |
| `passed` | outcome `'passed'` | "Passed {resolvedOn}" | *(none — see §7)* |
| `failed` | outcome `'failed'` | "Not passed {resolvedOn}" | **Schedule retake** |

Two notes on the derived ones:

- **`unscheduled` is new capability.** Today `examDate` is always set, so the plan is always built to a booked date. Separating *target* from *booked* is what lets a learner build a plan before they have a seat — which is the FinServ learner's actual sequence. `ExamDateCard` is already titled **"Target Date"**, so the copy is already right for it.
- **`imminent` reuses the existing deadline convention.** Do not invent a threshold — mirror the `dashboard-progress-state` At Risk posture and the `weeksUntilExam` display the card already has.

---

## 5. The verb is "Record result," not "Mark as complete"

Every task on this calendar is binary. An exam is not: **fail is not incomplete** — it is resolved, with an outcome, and it spawns a retake. Marking it "complete" would be true and useless.

This is the one genuinely structural change. Everything else is a new kind flowing through existing branches.

Consequence for `TaskRow`: a `licensing-exam` row must **never** reach the demo-card `showMarkCompleteCta` path or the kebab's "Mark as complete" item.

---

## 6. Three panels, one existing shell

Reuse **`AddCustomEventPanel`**'s shell wholesale — it already has the right shape: a `Mode = 'add' | 'edit' | 'view'` triad, the `Field` component, the two-column date/time row, the footer CTA, and a delete-with-confirmation flow. Do not build a new panel chrome.

| Panel | Mode | Fields |
|---|---|---|
| **Schedule exam** | `add` | Date* · Time (optional) · Provider · Delivery (in-person / online-proctored) · Location (hidden when online-proctored) · Confirmation number (optional) |
| **Exam details** | `view` → `edit` | Same, read-only until Edit; Cancel exam in the footer (reuse `DeleteConfirmation`) |
| **Record result** | `add` | Outcome (Passed / Not passed)* · Score (optional) · Note (optional). `resolvedOn` set automatically. |

**Saving a date from any of these is the same write as `EditExamDatePanel`** — it re-anchors the plan. Route both through the one writer from §3 rather than letting the new panel set `examDate` itself.

### Carry the soft-warning forward

`EditExamDatePanel` already shows a non-blocking warning when the chosen date precedes projected completion — `warning-100/300/800`, Save stays enabled, "You can still save it, but…". **Reuse that surface verbatim** in Schedule exam and in the retake flow. It is the correct posture and it already exists.

---

## 7. The failure case

The brief says this is handled badly everywhere in this market. Three rules:

1. **Do not gate, do not scold.** No confirmation dialog, no "are you sure," no red. A fail is a state, not an error. Use the `warning` family, not `error` — `error` is for something the product got wrong.
2. **Re-anchor immediately.** The next thing on screen after recording a fail is **Schedule retake**, pre-filled with nothing but ready. Saving a retake date creates a new `ExamAttempt` and re-runs the same plan generation `EditExamDatePanel` already triggers.
3. **Say what happens to the plan.** `CalendarSettingsSheet` already has the pattern — the quiet helper note when longer plans are filtered out by the target date. A retake booked close in will filter plans out; say so in that same voice rather than silently offering fewer options.

The previous attempt stays in `attempts[]` and stays visible. A learner who failed once and passed on the retake should be able to see both — that history is theirs, and the brief's Records flow (05) will want it.

**`passed` has no primary action** and that is deliberate. It is the only terminal state in the calendar. Show it, congratulate briefly, and let the Records surface take over.

---

## 8. Where it renders

| Surface | Change |
|---|---|
| **`ExamDateCard`** | Primary. Extend to the six states in §4; keep the "Target Date" title and the weeks-out panel. The `onEdit` link becomes state-dependent per the action column. |
| **Calendar views** (`GridView`, `WeekGridView`, `DailyView`, `TaskListView`) | Render a **derived** row on `examDate`. Do not push a `StudyTask` into `tasks[]` — that would put the date in two places (§3). |
| **`TaskRow`** | New `KIND_LABEL` entry + `KindIcon` case. See §9 for the dispatch. |
| **Today's Tasks promo card** (`LearningPathPage`) | New `DailyTaskActionKind` arm — see §9. |
| **`ProjectedCompletionCard`** | Unchanged logic; verify copy reads correctly when `unscheduled`. |
| **Admin roll-up** | **Flag, do not build.** The brief lists "whether admin insights come from us or from Compass" as an open question. Exam dates and outcomes are exactly the data that question is about. |

---

## 9. Extension points — and one to avoid

**Use this.** `dailyTaskActionKind` in `LearningPathPage.tsx` is a clean three-line dispatch and the right place:

```ts
function dailyTaskActionKind(task: DailyTaskPreview): DailyTaskActionKind {
  if (task.kind === 'licensing-exam') return 'exam'   // ← FIRST
  if (task.isCourseLinked) return 'course'
  if (task.kind === 'custom') return 'custom'
  return 'resource'
}
```

It must come **first**. A licensing exam has `isCourseLinked: false`, so it would otherwise fall through to `'resource'` and try to open a resource viewer that does not exist.

**Do not extend this.** `TaskRow` currently dispatches on **the first word of the title string**:

```ts
const startsWithComplete = firstWord === 'complete'
const isResourceRow = firstWord === 'read' || firstWord === 'view'
```

That heuristic drives the kebab, the icon swap, and the demo-card flow. Do not add a `firstWord === 'schedule'` branch. Switch the new kind on `task.kind` and let it bypass the prefix logic entirely — an exam titled "Complete your Series 6 exam" would otherwise silently lose its kebab, and an exam titled "View exam details" would become a resource row.

---

## 10. Copy

| Context | String |
|---|---|
| Kind label | Licensing Exam |
| Unscheduled | Not booked yet |
| Scheduled | {Provider} · {date} |
| Imminent | In {n} days · {date} |
| Awaiting result | You sat on {date} |
| Record CTA | Record result |
| Passed | Passed {date} |
| Failed | Not passed {date} |
| Retake CTA | Schedule retake |
| Retake helper | Booking this close narrows your study plan options. |

Never "Mark as complete," never "Failed" as a bare adjective on the learner, never `error` red.

---

## 11. Accessibility

- Outcome is **never colour alone** — pair the state with its glyph and its text label, per the house rule.
- Result recording announces via `aria-live="polite"`: "Result recorded. Not passed." — the plan re-anchoring is a large silent DOM change otherwise.
- The Schedule/Details/Record panels are `Sheet`s: focus trap, close top-left, Escape closes. Inherit from `AddCustomEventPanel`.
- Delivery-mode change hides the Location field — announce it, do not just unmount.
- Contrast: verify the `warning` family on the failed state against **both** themes and at the mobile frame width. The `ProfilePersonalizeContrast` lesson applies — measure the rendered position, not the token pair.

---

## 12. User story

**As a** newly recruited agent working to a licensing deadline,
**I want** to book my licensing exam, keep the booking details where my study plan already lives, and record what happened afterwards,
**so that** my plan stays anchored to a real date and a failed attempt turns into a new plan instead of a dead end.

**Value:** the exam is the only moment in the journey that happens outside the product, and it is the moment the whole plan exists to serve. Losing the thread there loses the learner.

**Out of scope:** provider integration (no seat lookup, no availability, no booking API — the learner types what the provider told them); score interpretation; anything that reports outcomes to an agency admin.

---

## 13. Acceptance criteria

1. `kind: 'licensing-exam'` is distinct from `kind: 'exam'`; no fixture uses `'exam'` for an external exam.
2. `calendar.examDate` equals `currentAttempt(calendar)?.date` for every fixture — asserted by test, not comment.
3. All six states render on `ExamDateCard` and are reachable in the demo.
4. A licensing-exam row never shows "Mark as complete" in the CTA or the kebab.
5. Recording a fail leads directly to Schedule retake with no confirm dialog and no `error` colour.
6. Saving a retake date creates a new attempt, preserves the prior one, and re-runs plan generation.
7. Booking a date before projected completion shows the existing non-blocking warning with Save enabled.
8. `unscheduled` renders correctly — a plan built to a target date with no booking.
9. Outcome state is conveyed by glyph + text, not colour alone, in both themes.
10. The title-prefix heuristic in `TaskRow` is not extended.

---

## 14. Open questions — flag, do not resolve

Per the brief: *"Where it says a decision is open, it is genuinely open — surface the question rather than resolving it."*

- **Who else sees the exam date?** An agency admin managing a cohort plainly wants it, and "who is stuck" is unanswerable without it. But the brief lists admin-insight ownership as being reconciled with Compass. Do not design an admin surface that assumes the answer.
- **Does a failed attempt affect readiness?** Compass computes readiness. A real fail is the strongest signal there is — and we do not own that model.
- **Retake cooling-off.** Most licensing exams impose a waiting period before a retake. If we let a learner book inside it, we anchor a plan to a date they cannot sit. Needs the per-state rule, or an explicit decision not to enforce it. *(Same shape as the unresolved reminder-cooldown question on Gift Recipients.)*
- **Course window vs exam date.** The brief caps the course window at 30 days and separately flags "how and to whom we surface learners whose window is about to expire" as undecided. An exam booked past window expiry is a real, reachable state with no defined behaviour.
- **Multi-state licensure.** One learner, several states, several exams. This spec models one attempt series per calendar; the brief's Records flow (05) implies more.
