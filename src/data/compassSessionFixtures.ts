/**
 * The Compass SESSION — the lesson a learner lands in from "Start session"
 * (the Tonight card on Compass Learning), and the screen Jillienne shared on
 * 2026-09-29.
 *
 * ⚠ PORTED VERBATIM, NOT RETYPED. `COURSE` and `LESSON` below are lifted
 * unchanged out of the `LESSON_DOC` embedded in Anjani's standalone prototype
 * (`public/prototypes/xcel-compass-nudge-journey.html` on
 * `claude/gallant-feynman-aj0m0i`, Refinement row demo-004). Copying them by
 * hand would have introduced drift in exactly the material — exam wording,
 * rationales, the distinctions candidates get wrong — where drift is worst.
 *
 * ⚠ SO THE COPY IS ANJANI'S, AND THIS IS A SECOND HOME FOR IT. The same
 * caution `compassLearningFixtures` carries applies here and harder, because
 * this is the whole lesson rather than one band: when her prototype changes,
 * nothing tells this file. Decide which copy is the source before either one
 * is shown as settled.
 *
 * ⚠ THE PARAGRAPH BODIES ARE HTML STRINGS, and they are rendered as HTML —
 * the authored inline terms (`term-inline`, with their tooltip definitions)
 * and the bolded lead-ins are part of the teaching, not decoration. It is
 * static, in-repo, authored content with no user input anywhere near it; see
 * the render note in `CompassSessionPage`.
 */

export type SessionChapterState = 'done' | 'here' | 'upcoming' | 'locked'

export type SessionChapter = {
  id: string
  name: string
  state: SessionChapterState
  /** Why a locked chapter is locked — shown under its name. */
  note?: string
}

/** Which kind of beat a lesson step is; drives the icon and the body. */
export type SessionBeatType =
  | 'video'
  | 'reading'
  | 'keyterm'
  | 'infographic'
  | 'check'
  | 'recap'

export type TranscriptLine = { id: string; ts: string; s: string }
/** A reading paragraph. Exactly one of the shape flags applies: `lede` opens
 *  the piece, `h` is a heading, `note` is a called-out exam note. */
export type ReadingPara = {
  id: string
  html: string
  lede?: boolean
  h?: boolean
  note?: boolean
}
export type KeyTermCard = { id: string; term: string; def: string; ex: string }
export type CheckItem = {
  id: string
  stem: string
  options: string[]
  /** Index into `options`. */
  correct: number
  /** Shown after answering — the WHY, which is the half that teaches. */
  rationale: string
}
export type RecapTerm = { w: string; d: string }

export type SessionBeat = {
  id: string
  type: SessionBeatType
  /** The Contents label, and the segment label above the body. */
  kind: string
  /** What Rubi says entering and leaving the beat. */
  rubiIntro: string
  rubiOutro: string
  block: {
    videoTag?: string
    duration?: string
    caption?: string
    transcript?: TranscriptLine[]
    title?: string
    sub?: string
    intro?: string
    paras?: ReadingPara[]
    cards?: KeyTermCard[]
    items?: CheckItem[]
    terms?: RecapTerm[]
    /** Worked example — a reading whose lede is the scenario. */
    wex?: boolean
  }
}

export const SESSION_COURSE: { title: string; chapters: SessionChapter[] } = {
  title:"Life & Health",
  chapters:[
    { id:"ch1", name:"Insurance basics",            state:"done" },
    { id:"ch2", name:"Life insurance policy types", state:"here" },   /* the live lesson */
    { id:"ch3", name:"Policy provisions & riders",  state:"upcoming" },
    { id:"ch4", name:"Annuities",                   state:"upcoming" },
    { id:"ch5", name:"Health & disability",         state:"upcoming" },
    { id:"ch6", name:"Exam Simulator",              state:"locked", note:"Unlocks Aug 13" }
  ]
};

export const SESSION_LESSON: { chapter: string; beats: SessionBeat[] } = {
  chapter:"Life insurance policy types",
  beats:[
    { id:"b1", type:"video", kind:"Video",
      rubiIntro:"Let's start with the big picture. Every life insurance policy splits into two families — temporary or lifelong. Here's a short overview, then we'll pull them apart.",
      rubiOutro:"So the whole topic hangs on one fork: term vs. permanent. Next I'll show you how they actually differ.",
      block:{ videoTag:"Presentation · Life insurance overview", duration:"4:10", caption:"The big picture before any of the details.",
        transcript:[
          {id:"t1", ts:"0:00", s:"Every life insurance policy is either term or permanent."},
          {id:"t2", ts:"0:20", s:"Term covers you for a set period and builds no cash value."},
          {id:"t3", ts:"0:48", s:"Permanent insurance lasts your whole life and builds cash value you can borrow against."},
          {id:"t4", ts:"1:12", s:"That single fork — temporary or lifelong — decides almost everything else about the policy."},
          {id:"t5", ts:"1:35", s:"Term premiums are level for the term you choose, then the coverage simply ends."},
          {id:"t6", ts:"2:02", s:"Permanent premiums are higher because part of every payment funds the cash value."},
          {id:"t7", ts:"2:30", s:"Cash value grows tax-deferred and the owner can borrow against it while living."},
          {id:"t8", ts:"2:58", s:"Two features soften the end of a term: renewable and convertible."},
          {id:"t9", ts:"3:22", s:"Renewable extends the term without proving insurability again, usually at a higher premium."},
          {id:"t10", ts:"3:47", s:"Convertible switches the policy to permanent coverage with no new evidence of insurability."}
        ]}},

    { id:"b2", type:"reading", kind:"Reading",
      rubiIntro:"Here's the difference laid out plainly. Read it your way — I'll be right here if a line doesn't sit right.",
      rubiOutro:"The short version: term is protection for a window; permanent is protection for life, plus a savings piece. Want to lock in the words next?",
      block:{ title:"Term vs. permanent, side by side",
        paras:[
          {id:"p1", lede:true, html:"Two families, one decision. <span class='term-inline' title='Coverage for a set number of years.'>Term</span> covers you for a set number of years. <span class='term-inline' title='Coverage that lasts your whole life and builds cash value.'>Permanent</span> covers you for life and builds a savings balance along the way. Almost every other difference follows from that one fork."},
          {id:"h1", h:true, html:"How term works"},
          {id:"p2", html:"Term is the simpler, cheaper one. You pick a length — say 20 years — and if you pass away inside it, your beneficiary is paid. Outlive it and the coverage ends, with nothing paid back. No savings piece, no cash value, no residual."},
          {id:"p3", html:"Because it is pure protection, term buys the most death benefit per dollar. A healthy thirty-year-old can often cover several hundred thousand dollars for the price of a phone bill. That is why term is the usual answer when the need is temporary — a mortgage, the years until children are grown, a business loan."},
          {id:"p4", html:"The premium is level for the term you choose. Level does not mean permanent. At the end of the term the policy expires, and buying new coverage at an older age — with whatever health you now have — is a different and far more expensive conversation."},
          {id:"n1", note:true, html:"<b>Exam note.</b> Watch the wording. \"Level term\" describes the premium staying flat during the term. It does not mean the coverage continues after the term."},
          {id:"h2", h:true, html:"How permanent works"},
          {id:"p5", html:"Permanent costs more because part of every premium goes into <span class='term-inline' title='The savings value that builds inside a permanent policy over time.'>cash value</span> — a balance inside the policy that grows over the years. The death benefit lasts as long as premiums are paid, and the cash value belongs to the owner while they are alive."},
          {id:"p6", html:"That cash value grows tax-deferred. The owner can borrow against it, and in most policies can surrender the contract for its accumulated value. Both moves reduce the death benefit, which is the trade the learner is usually being tested on."},
          {id:"p7", html:"Whole life is the most predictable form: fixed premium, guaranteed death benefit, guaranteed minimum cash value growth. Universal life trades some of that certainty for flexibility — adjustable premiums and an adjustable death benefit within limits."},
          {id:"h3", h:true, html:"The two features that bridge them"},
          {id:"p8", html:"<b>Renewable</b> lets the owner extend the term when it ends, without proving insurability again. The new premium is based on the attained age, so it rises — often steeply — but coverage continues even if health has declined."},
          {id:"p9", html:"<b>Convertible</b> lets the owner exchange the term policy for a permanent one, again with no new evidence of insurability. This is the feature that matters most to someone whose health has changed since they first bought coverage."},
          {id:"n2", note:true, html:"<b>The distinction that trips people up.</b> Renewable extends the same kind of coverage. Convertible changes the kind of coverage. Both skip the medical — that shared trait is why they get confused."},
          {id:"h4", h:true, html:"Choosing between them"},
          {id:"p10", html:"The honest framing is need duration, not product quality. A need with an end date — a thirty-year mortgage, the years before retirement — usually points to term. A need with no end date — final expenses, a lifelong dependant, estate liquidity — points to permanent."},
          {id:"p11", html:"Budget matters too, and this is where the exam likes to test judgement rather than recall. Underinsuring with a permanent policy the client can barely afford is generally worse than fully insuring the need with term. Coverage that lapses protects nobody."}
        ]}},

    { id:"b3", type:"keyterm", kind:"Key terms",
      rubiIntro:"These words carry the whole topic. Rate how sure you are, then flip each one — it's the fastest way to see what's already solid.",
      rubiOutro:"Nicely done. These come up all over the exam, so they're worth the minute.",
      block:{ intro:"Rate your confidence, then flip to check. Nothing here is graded — it just helps you see where to spend time.",
        cards:[
          {id:"c1", term:"Cash value", def:"The savings balance that builds inside a permanent policy over time.", ex:"You can borrow against cash value while you're still alive — term policies never have it."},
          {id:"c2", term:"Convertible", def:"A term policy feature that lets the owner switch to permanent coverage without new evidence of insurability.", ex:"Health changed for the worse? A convertible clause lets you move to permanent without a new medical."},
          {id:"c3", term:"Renewable", def:"A term feature that lets the owner renew for another term without proving insurability again — usually at a higher premium.", ex:"Renewable keeps you covered past the original end date, at a price based on your attained age."},
          {id:"c4", term:"Level term", def:"Term coverage where the premium stays flat for the whole term.", ex:"A 20-year level term policy costs the same in year 19 as it did in year 1 — then it ends."},
          {id:"c5", term:"Attained age", def:"The insured's age at the time of renewal or conversion, used to price the new premium.", ex:"Renewing at 55 costs far more than the original premium set at 35 — that's attained-age pricing."},
          {id:"c6", term:"Surrender value", def:"The amount the owner receives if they cancel a permanent policy and take the cash value.", ex:"Surrendering ends the coverage — the death benefit goes away with it."}
        ]}},

    { id:"b4", type:"infographic", kind:"Infographic",
      rubiIntro:"One picture makes this click. Watch what happens to cash value over the years for each type.",
      rubiOutro:"That gap is the whole trade-off: term stays cheap and flat; permanent costs more but builds something you keep.",
      block:{ title:"Where the money goes, over time", sub:"Cash value by policy age — term vs. permanent." }},

    { id:"b5", type:"check", kind:"Knowledge check",
      rubiIntro:"Let's see what landed. A few quick ones — I'll step back while you answer, then read where you're at on this topic.",
      rubiOutro:"",
      block:{ items:[
        {id:"q1", stem:"Which type of policy builds cash value you can borrow against?", options:["Term","Permanent","Both term and permanent","Neither"], correct:1,
          rationale:"Only permanent policies build cash value. Term is pure protection for a set period — nothing accrues."},
        {id:"q2", stem:"A convertible term policy lets the owner…", options:["Renew for another term at the same premium","Switch to permanent coverage without new evidence of insurability","Withdraw the cash value early","Automatically increase the face amount"], correct:1,
          rationale:"Convertible means you can move to a permanent policy without re-proving your health. Renewable — a different feature — is the one about extending the term."},
        {id:"q3", stem:"\"Level term\" refers to which part of the policy staying the same?", options:["The premium, for the length of the term","The coverage, for the insured's whole life","The cash value growth rate","The beneficiary designation"], correct:0,
          rationale:"Level describes the premium holding flat across the term. The coverage still ends when the term does — that's the trap in this one."},
        {id:"q4", stem:"A client renews a term policy at age 55. How is the new premium set?", options:["At the original issue age","At the insured's attained age","At a state-mandated flat rate","It cannot change on renewal"], correct:1,
          rationale:"Renewal is priced at attained age — the age you actually are now. That's why renewable coverage gets expensive fast."},
        {id:"q5", stem:"Which is generally the better fit for a 30-year mortgage?", options:["Whole life, for the cash value","30-year level term","Universal life, for the flexibility","Neither — the need isn't insurable"], correct:1,
          rationale:"The need has an end date, so term matches it. Paying permanent premiums for a temporary need usually means buying less coverage than the need requires."}
      ]}},

    { id:"b6", type:"reading", kind:"Worked example",
      rubiIntro:"Here's how it plays out for a real person. See if you'd land where the reasoning does.",
      rubiOutro:"That's the pattern: match the length of the need, then check the budget can actually carry it.",
      block:{ wex:true, title:"Maya, 34 — which policy fits?",
        paras:[
          {id:"w1", lede:true, html:"Maya is 34, married, with a six-year-old and a mortgage with 26 years left. She can comfortably put about $60 a month toward life insurance. What should she be shown?"},
          {id:"wh1", h:true, html:"Step 1 — name the needs and their end dates"},
          {id:"w2", html:"There are two obligations. The mortgage runs 26 more years. Raising the child to independence runs roughly 16 more. Both have an end date, and neither is lifelong."},
          {id:"w3", html:"That points at term before anything else is considered. A 30-year level term policy covers the longer of the two needs with room to spare."},
          {id:"wh2", h:true, html:"Step 2 — test the budget against the coverage"},
          {id:"w4", html:"At 34 and in good health, $60 a month buys a substantial term death benefit — enough to clear the mortgage and support the child. The same $60 in a whole life policy would buy a fraction of that face amount."},
          {id:"w5", html:"This is the decisive point. The permanent policy is not a worse product; it simply cannot cover this need at this budget. Coverage that falls short of the obligation does not do the job it was bought for."},
          {id:"wn1", note:true, html:"<b>Where candidates lose the mark.</b> They reach for permanent because it \"builds value.\" The exam is testing whether you match the product to the duration and size of the need first."},
          {id:"wh3", h:true, html:"Step 3 — protect against the change you can't predict"},
          {id:"w6", html:"Maya's health may change before the term ends. If it does, new coverage later would be expensive or unavailable. A convertible clause on the term policy protects against exactly that — she can move to permanent later without a new medical."},
          {id:"w7", html:"So the recommendation is a 30-year level term with a convertible clause. It matches the duration, fits the budget, and leaves a door open."}
        ]}},

    { id:"b7", type:"recap", kind:"Recap",
      rubiIntro:"Here's the short version to carry into practice.",
      rubiOutro:"",
      block:{ terms:[
          {w:"Term", d:"Set-period coverage, no cash value, lowest cost per dollar of death benefit."},
          {w:"Permanent", d:"Lifelong coverage that builds cash value the owner can borrow against."},
          {w:"Level term", d:"The premium stays flat for the term — the coverage still ends."},
          {w:"Convertible", d:"Switch term → permanent, no new medical."},
          {w:"Renewable", d:"Extend the term without re-qualifying, priced at attained age."},
          {w:"Match the duration", d:"An ending need points to term; a lifelong need points to permanent."}
        ]}}
  ]
};

/**
 * The nudge the Rubi rail opens on — nudge 01 of the prototype's catalogue,
 * "stalls on one page far longer than the norm". It is the one the shared
 * screen shows.
 *
 * ⚠ IT IS STATIC HERE. In the prototype a dwell timer fires it; this renders
 * the fired state so the rail can be designed against. Nothing measures dwell,
 * so nothing should claim to — see the note at its render site.
 */
export const SESSION_NUDGE = {
  line: 'This section runs long, and this is the part most people slow down on.',
  why: 'You have been on this page about three times longer than most learners spend here.',
  acts: [
    'Give me the short version',
    'Break it into smaller pieces',
    'Explain it a different way',
  ],
}
