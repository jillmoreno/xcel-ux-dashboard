/**
 * JEFF'S COURSE CONTENT — ported 2026-11-05 from `compass-prototype-b-v3.html`,
 * the standalone export of his Compass course player.
 *
 * ⚠ GENERATED FROM HIS FILE, NOT RETYPED. Everything here is his data model
 * evaluated out of the export and printed back as TypeScript — 7 lessons, 36
 * sections, 22 knowledge-base entries, a 4-question quiz bank and a six-chapter
 * contents. Retyping 20KB of licensing curriculum by hand is how a port gets a
 * definition subtly wrong, and a wrong definition in exam-prep material is
 * worse than a wrong colour. Re-run the extraction when he ships a new version
 * (the `port-prototype` skill, step 2) rather than editing a paragraph here.
 *
 * ⚠ THE COPY IS HIS AND IS NOT THE PORT'S TO IMPROVE. These are the words a
 * learner studies for a state licensing exam. If something reads wrong, it goes
 * back to Jeff; it does not get fixed here.
 *
 * ⚠ THE EMPTY ARRAYS HIS `S()` HELPER FILLS IN ARE DROPPED. His constructor
 * gives every section `paras/bullets/defs/rows/cards` whether or not it uses
 * them; a section here carries only what it has, and the renderer asks. The
 * section TYPE is what decides the shape — see `JeffSectionType`.
 *
 * ⚠ THIS IS CHAPTER 2 ONLY. His table of contents names six chapters and
 * carries real lesson titles, durations and marker counts for all of them, but
 * only Chapter 2's seven lessons have bodies. The other five are the contents
 * rail's own content — that is his design, not a gap in the port.
 */


export type JeffSectionType =
  | 'Chapter introduction'
  | 'Concept'
  | 'Definitions'
  | 'Optional practice'
  | 'Scenario check'
  | 'Infographic'
  | 'Key takeaways'
  | 'Key facts'
  | 'Scenario'

export type JeffDef = { term: string; def: string }
/** The infographic's table rows — his four columns, a–d. */
export type JeffRow = { a: string; b: string; c: string; d: string }
/** An inline flashcard — his own field names. */
export type JeffCard = { front: string; back: string }
export type JeffSection = {
  /** "3.2" — the number printed in the eyebrow and spoken in the track. */
  num: string
  type: JeffSectionType
  title: string
  paras?: string[]
  bullets?: string[]
  defs?: JeffDef[]
  rows?: JeffRow[]
  cards?: JeffCard[]
  /** The Rubi tip callout — hidden unless the Show exam tips control is on. */
  tip?: string
  /** The scenario check. One section has it (L3 · 3.3) and it GATES Continue. */
  quiz?: true
}
export type JeffLesson = {
  id: string
  title: string
  /** His three states — 'done' | 'current' | 'todo'. Demo story moves them. */
  status: string
  /** The key into JEFF_ANSWERS, which is what Rubi's canned replies hang off. */
  topic: string
  intro: string
  secs: JeffSection[]
}
/** CHAPTER 2's SEVEN LESSONS — 36 sections of real curriculum. */
export const JEFF_LESSONS: JeffLesson[] = [
  {
    id: "L1",
    title: "Stock and Mutual Insurers",
    status: "done",
    topic: "ownership",
    intro: "Insurers are classified by who owns them. The two forms you will see most on the exam are stock and mutual companies.",
    secs: [
      {
        num: "1.1",
        type: "Chapter introduction",
        title: "Welcome to Chapter 2: Insurers and Insurance Markets",
        paras: [
          "Before you can recommend a policy, you need to know who stands behind it. This chapter looks at insurers themselves: who owns them, where they are based, whether a state allows them to do business, and which market they sell in.",
          "Expect these ideas to show up on the exam as short scenarios. You will be asked to classify a company from a few facts, so focus on the one question each lesson teaches you to ask."
        ],
        bullets: [
          "Lessons 1–2: who owns the insurer (stock, mutual and how one becomes the other)",
          "Lesson 3: where the insurer is incorporated (domestic, foreign, alien)",
          "Lesson 4: whether the state has authorized it (admitted or non-admitted)",
          "Lessons 5–6: which market it sells in and how policy dividends work",
          "Lesson 7: a chapter review and quick check"
        ],
        tip: "Most questions in this chapter give you a company and a state and ask you to classify it. Read for the facts that decide the label."
      },
      {
        num: "1.2",
        type: "Concept",
        title: "Ownership drives everything else",
        paras: [
          "An insurer’s ownership decides who shares in its profits and what kind of policies it typically issues. When a question names a company type, ask first: who owns it?"
        ]
      },
      {
        num: "1.3",
        type: "Definitions",
        title: "Stock insurers",
        paras: [
          "Stock insurers are owned by stockholders, who may receive stockholder dividends.",
          "Stock insurers typically issue nonparticipating policies, so policyowners do not receive dividends. Any profit belongs to the stockholders, who invested capital in the company and elect its board of directors.",
          "Because they can sell shares, stock insurers can raise money quickly to grow or to strengthen their reserves."
        ],
        bullets: [
          "Owners: stockholders, who may not hold any policy with the company",
          "Board of directors: elected by stockholders",
          "Typical policy: nonparticipating"
        ],
        defs: [
          { term: "Stockholder", def: "An investor who owns shares in the insurer and shares in its profits or losses." },
          {
            term: "Stockholder dividend",
            def: "A share of profits paid to stockholders. It is a return on investment and is not guaranteed."
          },
          {
            term: "Nonparticipating policy",
            def: "A policy that does not pay dividends to the policyowner. Often called a “nonpar” policy."
          }
        ]
      },
      {
        num: "1.4",
        type: "Definitions",
        title: "Mutual insurers",
        paras: [
          "Mutual insurers are owned by their policyowners.",
          "Mutual insurers typically issue participating policies, which may return surplus to policyowners as dividends. There are no outside stockholders, so the company is run for the benefit of the people it insures, who elect its board of directors.",
          "When a mutual insurer collects more premium than it needs to pay claims and expenses, part of that surplus can be returned to policyowners."
        ],
        bullets: [
          "Owners: policyowners",
          "Board of directors: elected by policyowners",
          "Typical policy: participating"
        ],
        defs: [
          {
            term: "Policyowner",
            def: "The person who owns the policy. In a mutual insurer, policyowners are also the owners of the company."
          },
          {
            term: "Participating policy",
            def: "A policy that may pay dividends to the policyowner. Often called a “par” policy."
          },
          {
            term: "Policyowner dividend",
            def: "A return of surplus premium to the policyowner, paid only when the insurer’s results allow it."
          }
        ],
        tip: "Policyowner dividends are never guaranteed."
      }
    ]
  },
  {
    id: "L2",
    title: "Mutualization and Demutualization",
    status: "done",
    topic: "ownership",
    intro: "Ownership can change. This lesson covers the two conversions and the hybrid in between.",
    secs: [
      {
        num: "2.1",
        type: "Definitions",
        title: "Mutualization",
        paras: [
          "Mutualization: a stock insurer converts to a mutual insurer, and ownership passes to its policyowners."
        ]
      },
      {
        num: "2.2",
        type: "Definitions",
        title: "Demutualization",
        paras: [
          "Demutualization: a mutual insurer converts to a stock insurer.",
          "A common reason is access to capital, since a stock company can raise money by selling shares."
        ],
        tip: "A mixed insurer has features of both and may issue participating and nonparticipating policies."
      },
      {
        num: "2.3",
        type: "Definitions",
        title: "Mixed insurers",
        paras: [
          "Not every insurer fits neatly into stock or mutual. A mixed insurer combines features of both forms.",
          "The most common example is a stock insurer that issues participating policies alongside its nonparticipating ones. Its stockholders still own the company, but some policyowners may also receive dividends."
        ],
        defs: [
          { term: "Mixed insurer", def: "An insurer with features of both stock and mutual companies." },
          { term: "Par and nonpar", def: "A mixed insurer may issue both participating and nonparticipating policies." },
          { term: "Ownership test", def: "Ask who owns the company first, then which policies it issues." }
        ],
        tip: "If a question says a stock company issues participating policies, the answer is usually “mixed insurer.”"
      },
      {
        num: "2.4",
        type: "Concept",
        title: "Why insurers change form",
        paras: [
          "Conversions are about who the company serves and how it raises money. Knowing the motive helps you pick the right term when an exam scenario describes a change."
        ],
        bullets: [
          "Demutualization: a mutual insurer wants access to capital, so it becomes a stock company that can sell shares",
          "Policyowners in a demutualizing company usually receive shares, cash or policy credits in exchange for their ownership rights",
          "Mutualization: a stock insurer turns ownership over to its policyowners, often to focus on serving them rather than outside investors",
          "Either way, existing policies stay in force; what changes is who owns the company"
        ]
      },
      {
        num: "2.5",
        type: "Optional practice",
        title: "Flashcards: ownership changes",
        paras: [
          "Optional. Flip through these to check yourself before Lesson 3. They don’t affect your progress."
        ],
        cards: [
          {
            front: "Mutualization",
            back: "A stock insurer converts to a mutual insurer. Ownership passes to its policyowners."
          },
          {
            front: "Demutualization",
            back: "A mutual insurer converts to a stock insurer, usually to raise capital by selling shares."
          },
          {
            front: "Mixed insurer",
            back: "An insurer with features of both stock and mutual companies, such as a stock insurer that issues participating policies."
          },
          { front: "Who owns a stock insurer?", back: "Its stockholders, who may receive stockholder dividends." },
          {
            front: "Who owns a mutual insurer?",
            back: "Its policyowners, who may receive policyowner dividends on participating policies."
          }
        ]
      }
    ]
  },
  {
    id: "L3",
    title: "Domestic, Foreign and Alien Insurers",
    status: "current",
    topic: "domicile",
    intro: "Lesson 2 covered how insurers are owned. This lesson covers where they are based, and why the same company can carry a different label depending on the state you are in.",
    secs: [
      {
        num: "3.1",
        type: "Concept",
        title: "Where an insurer is \"home\" decides what it’s called",
        paras: [
          "Every insurer is incorporated, or domiciled, in one place. To classify an insurer, compare its state of domicile with the state where it is doing business. The same company can carry a different label depending on which state you are standing in."
        ]
      },
      {
        num: "3.2",
        type: "Definitions",
        title: "Three classifications by domicile",
        defs: [
          { term: "Domestic insurer", def: "Incorporated under the laws of this state." },
          { term: "Foreign insurer", def: "Incorporated in another U.S. state." },
          { term: "Alien insurer", def: "Incorporated outside the United States." }
        ],
        tip: "Domicile is not the same as authorization. Whether an insurer is admitted depends on holding a Certificate of Authority from the state. You’ll cover that in Lesson 4."
      },
      {
        num: "3.3",
        type: "Scenario check",
        title: "Apply it: an Ohio insurer selling in Texas",
        paras: [
          "Dana is a licensed agent in Texas. She places a homeowners policy with Lakeshore Mutual, an insurer incorporated in Ohio and authorized to do business in Texas. From Texas’s point of view, Lakeshore Mutual is a(n):"
        ],
        quiz: true
      },
      {
        num: "3.4",
        type: "Infographic",
        title: "One insurer, different labels",
        paras: [
          "The label depends on which state is doing the looking. Read each row left to right."
        ],
        rows: [
          { a: "Lakeshore Mutual", b: "Ohio", c: "Ohio", d: "Domestic" },
          { a: "Lakeshore Mutual", b: "Ohio", c: "Texas", d: "Foreign" },
          { a: "Harbor Insurance Ltd.", b: "Bermuda", c: "Texas", d: "Alien" }
        ]
      },
      {
        num: "3.5",
        type: "Key takeaways",
        title: "What to carry into the exam",
        bullets: [
          "Classification by domicile is always relative to the state you are in.",
          "Domestic: this state. Foreign: another U.S. state. Alien: outside the U.S.",
          "Domicile and admitted status are separate questions. A foreign or alien insurer can still be admitted."
        ]
      }
    ]
  },
  {
    id: "L4",
    title: "Admitted and Non-admitted Insurers",
    status: "todo",
    topic: "authorization",
    intro: "Domicile tells you where an insurer is based. Authorization tells you whether it may do business in a given state.",
    secs: [
      {
        num: "4.1",
        type: "Definitions",
        title: "Admitted (authorized) insurers",
        paras: [
          "An admitted insurer has met the state’s requirements and holds a Certificate of Authority from the state insurance department.",
          "Domestic, foreign and alien insurers can all be admitted."
        ]
      },
      {
        num: "4.2",
        type: "Definitions",
        title: "Non-admitted (unauthorized) insurers",
        paras: [
          "A non-admitted insurer has not been authorized by the state.",
          "It generally cannot transact insurance there directly. Coverage is placed through the surplus lines market, covered in Lesson 5."
        ],
        tip: "Admitted status is about authorization, not domicile."
      },
      {
        num: "4.3",
        type: "Concept",
        title: "How an insurer becomes admitted",
        paras: [
          "To become admitted, an insurer applies to the state insurance department and shows it meets the state’s requirements, such as minimum capital and surplus, financial reporting and approved policy forms.",
          "Once approved, the department issues a Certificate of Authority, which lists the lines of insurance the insurer may write in that state."
        ]
      },
      {
        num: "4.4",
        type: "Key facts",
        title: "What admitted status protects",
        paras: [
          "Admitted insurers are regulated by the state on solvency, rates and forms, and policyowners can bring complaints to the state insurance department.",
          "Admitted insurers generally participate in the state guaranty association, which can help pay covered claims if an admitted insurer becomes insolvent."
        ],
        tip: "Guaranty association protection is tied to admitted status. That is a common contrast with surplus lines on the exam."
      },
      {
        num: "4.5",
        type: "Scenario",
        title: "An agent checks before placing a policy",
        paras: [
          "Jordan, a Texas agent, finds a low quote from Coastal Shield Insurance. Before placing the policy, Jordan confirms with the Texas Department of Insurance that Coastal Shield holds a Certificate of Authority for homeowners coverage.",
          "It does, so Coastal Shield is admitted for that line in Texas, whether it is domestic, foreign or alien."
        ]
      },
      {
        num: "4.6",
        type: "Key takeaways",
        title: "What to carry into the exam",
        bullets: [
          "Admitted, or authorized, insurers hold a Certificate of Authority from the state.",
          "The certificate lists the lines of insurance the insurer may write.",
          "Admitted insurers are state-regulated and generally backed by the state guaranty association.",
          "Domicile and admitted status are separate questions: any domestic, foreign or alien insurer can be admitted."
        ]
      }
    ]
  },
  {
    id: "L5",
    title: "Standard, Surplus Lines and Residual Markets",
    status: "todo",
    topic: "markets",
    intro: "Where does coverage come from when the usual sources say no? This lesson follows a risk from the standard market to the residual market.",
    secs: [
      {
        num: "5.1",
        type: "Concept",
        title: "The standard market",
        paras: [
          "The standard market is coverage offered by admitted insurers for typical risks at regular rates."
        ]
      },
      {
        num: "5.2",
        type: "Definitions",
        title: "Surplus lines",
        paras: [
          "A surplus lines insurer is a non-admitted insurer used when the standard market will not cover an unusual or high-risk situation.",
          "Coverage is placed through a licensed surplus lines broker, and the customer usually must first show a diligent effort to find coverage in the standard market."
        ]
      },
      {
        num: "5.3",
        type: "Definitions",
        title: "Residual markets",
        paras: [
          "Residual markets are state-created programs, such as FAIR plans, that make coverage available to people who cannot get it in the voluntary market."
        ]
      },
      {
        num: "5.4",
        type: "Concept",
        title: "Why surplus lines exist",
        paras: [
          "Admitted insurers file their rates and policy forms with the state. Some risks are too large, too unusual or too hazardous to fit those filed rates and forms.",
          "Surplus lines give the market room to cover those risks, with more flexibility in pricing and policy language."
        ]
      },
      {
        num: "5.5",
        type: "Definitions",
        title: "The surplus lines broker and the diligent search",
        paras: [
          "Surplus lines coverage is placed by a producer who holds a surplus lines license.",
          "Before placing it, the producer usually must show a diligent search of the standard market, often documented as declinations from a set number of admitted insurers. The required number varies by state."
        ],
        tip: "If a question asks what must happen before a risk goes to surplus lines, look for the diligent search of the admitted market."
      },
      {
        num: "5.6",
        type: "Key facts",
        title: "Protections that work differently",
        paras: [
          "States usually keep standards or a list of eligible surplus lines insurers, and surplus lines premiums are typically subject to a premium tax that the broker collects.",
          "Because surplus lines insurers are non-admitted, their policies generally are not backed by the state guaranty association if the insurer becomes insolvent."
        ],
        tip: "Not covered by the state guaranty fund is a classic surplus lines exam point."
      },
      {
        num: "5.7",
        type: "Scenario",
        title: "A coastal home with no takers",
        paras: [
          "Marcus owns a beach house that three admitted insurers decline because of hurricane exposure. His agent works with a licensed surplus lines broker, who places the risk with an eligible non-admitted insurer.",
          "If no surplus lines insurer would write it either, Marcus could turn to his state’s residual market program, such as a FAIR or windstorm plan, as a last resort."
        ]
      },
      {
        num: "5.8",
        type: "Key takeaways",
        title: "Following a risk through the markets",
        bullets: [
          "Standard market first: admitted insurers, typical risks, regular rates.",
          "Surplus lines next: non-admitted insurers for hard-to-place risks, placed by a surplus lines licensee after a diligent search.",
          "Surplus lines policies generally are not protected by the state guaranty association.",
          "Residual markets last: state-created programs for people who cannot get coverage in the voluntary market."
        ]
      }
    ]
  },
  {
    id: "L6",
    title: "Participating and Nonparticipating Policies",
    status: "todo",
    topic: "dividends",
    intro: "Lesson 1 linked ownership to dividends. This lesson looks at the policies themselves.",
    secs: [
      {
        num: "6.1",
        type: "Definitions",
        title: "Participating policies",
        paras: [
          "Participating policies may pay policyowner dividends from the insurer’s surplus.",
          "They are typical of mutual insurers."
        ],
        tip: "Dividends are not guaranteed. Exam questions often test that word."
      },
      {
        num: "6.2",
        type: "Definitions",
        title: "Nonparticipating policies",
        paras: [
          "Nonparticipating policies do not pay policyowner dividends.",
          "They are typical of stock insurers, which pay dividends to stockholders instead."
        ]
      },
      {
        num: "6.3",
        type: "Concept",
        title: "Where policyowner dividends come from",
        paras: [
          "An insurer prices a participating policy using assumptions about losses, expenses and investment income.",
          "When actual results are better than those assumptions, the board of directors may declare a dividend to return part of the excess to policyowners. That is why dividends can never be guaranteed."
        ]
      },
      {
        num: "6.4",
        type: "Definitions",
        title: "How dividends are paid",
        paras: [
          "In property and casualty insurance, a declared dividend is usually paid as cash or applied as a credit toward the next premium.",
          "Either way, it depends on the insurer’s experience for that period, not on a promise in the policy."
        ]
      },
      {
        num: "6.5",
        type: "Definitions",
        title: "Assessable and nonassessable policies",
        paras: [
          "An assessable policy lets the insurer charge policyowners an additional amount if losses and expenses exceed what premiums and surplus can cover. This is most associated with some mutual insurers.",
          "A nonassessable policy cannot be assessed. Policyowners cannot be asked to pay more than the stated premium."
        ],
        tip: "Assessable means the policyowner could be charged more after the fact. Nonassessable means they cannot."
      },
      {
        num: "6.6",
        type: "Scenario",
        title: "Comparing two homeowners quotes",
        paras: [
          "Priya gets two quotes. One is a participating policy from a mutual insurer with a slightly higher premium. The other is a nonparticipating policy from a stock insurer.",
          "The participating policy might return a dividend in a good year, but it might not. When comparing, she should treat the premium as the real cost and any dividend as a possible bonus, not a discount she can count on."
        ]
      },
      {
        num: "6.7",
        type: "Key takeaways",
        title: "What to carry into the exam",
        bullets: [
          "Participating policies may pay dividends; nonparticipating policies do not.",
          "Dividends come from better-than-expected experience and are never guaranteed.",
          "Dividends are typically paid in cash or as a premium credit.",
          "Assessable policies can require extra payment from policyowners; nonassessable policies cannot."
        ]
      }
    ]
  },
  {
    id: "L7",
    title: "Chapter Review and Quick Check",
    status: "todo",
    topic: "review",
    intro: "Pull the chapter together before the chapter quick check.",
    secs: [
      {
        num: "7.1",
        type: "Key takeaways",
        title: "Chapter 2 in five lines",
        paras: [
          "The chapter quick check opens here in the full course."
        ],
        bullets: [
          "Ownership: stock insurers are owned by stockholders, mutual insurers by policyowners.",
          "Conversions: mutualization (stock to mutual) and demutualization (mutual to stock).",
          "Domicile: domestic, foreign and alien, always relative to the state you are in.",
          "Authorization: admitted insurers hold a Certificate of Authority; non-admitted insurers do not.",
          "Markets: standard, surplus lines and residual."
        ]
      }
    ]
  }
]

/** Rubi's canned answers, keyed by lesson topic then by chip. Each is [answer, source]. */
export const JEFF_ANSWERS: Record<string, Record<string, [string, string]>> = {
  domicile: {
    simpler: [
      "Think of it as the insurer’s home address. Home state means domestic. Another U.S. state means foreign. Another country means alien.",
      "L3 · Section 3.2"
    ],
    example: [
      "A Texas agent sells a policy from a company incorporated in Ohio: in Texas it is foreign. The same company selling in Ohio is domestic. A company incorporated in Bermuda is alien in every U.S. state.",
      "L3 · Section 3.4"
    ],
    exam: [
      "Expect a short scenario that gives the state of incorporation and the state of sale, then asks for the label. A common trap mixes domicile with authorization: a foreign or alien insurer can still be admitted.",
      "L3 · Sections 3.2, 3.3"
    ],
    summary: [
      "This lesson classifies insurers by where they’re incorporated: domestic (this state), foreign (another U.S. state) and alien (outside the U.S.). It’s always relative to the state you’re in, and separate from whether the insurer is admitted.",
      "L3 · Sections 3.1–3.5"
    ]
  },
  ownership: {
    simpler: [
      "Stock insurers are owned by investors. Mutual insurers are owned by their customers, the policyowners.",
      "L1 · Sections 1.3, 1.4"
    ],
    example: [
      "If you hold a participating policy from a mutual insurer, you may receive a dividend when the company has surplus. It is never guaranteed.",
      "L1 · Section 1.4"
    ],
    exam: [
      "Expect questions that link mutual to policyowners and participating policies, and stock to stockholders and nonparticipating policies.",
      "L1 · Sections 1.3, 1.4"
    ],
    summary: [
      "Stock insurers are owned by stockholders; mutual insurers by policyowners. Mutualization turns stock into mutual, demutualization goes the other way.",
      "L1–L2"
    ]
  },
  authorization: {
    simpler: [
      "Admitted means the state said yes and issued a Certificate of Authority. Non-admitted means it did not.",
      "L4 · Sections 4.1, 4.2"
    ],
    example: [
      "An Ohio insurer licensed in Texas is foreign and admitted there. A London insurer without Texas authorization is alien and non-admitted.",
      "L4 · Section 4.1"
    ],
    exam: [
      "Watch for answers that confuse domicile with authorization. They are separate questions.",
      "L4 · Section 4.2"
    ],
    summary: [
      "Authorization is about permission to do business in a state, shown by a Certificate of Authority.",
      "L4"
    ]
  },
  markets: {
    simpler: [
      "Standard market first. If no one there will cover the risk, a surplus lines insurer can. If the person still cannot get coverage, a state residual program can step in.",
      "L5"
    ],
    example: [
      "A beach house the standard market declines might go to a surplus lines insurer through a licensed surplus lines broker, after a diligent search.",
      "L5 · Section 5.2"
    ],
    exam: [
      "Know that surplus lines insurers are non-admitted and that a diligent effort in the standard market usually comes first.",
      "L5 · Section 5.2"
    ],
    summary: [
      "Coverage flows from the standard market to surplus lines to residual markets.",
      "L5"
    ]
  },
  dividends: {
    simpler: [
      "Participating policies can pay dividends; nonparticipating ones do not.",
      "L6"
    ],
    example: [
      "A whole life policy from a mutual insurer may be participating and pay a dividend in a good year. That dividend is not guaranteed.",
      "L6 · Section 6.1"
    ],
    exam: [
      "Look for the word guaranteed. Policyowner dividends are never guaranteed.",
      "L6 · Section 6.1"
    ],
    summary: [
      "Participating policies may pay policyowner dividends; nonparticipating policies do not.",
      "L6"
    ]
  },
  review: {
    simpler: [
      "Who owns it, where it is based, whether it is allowed in the state, and which market it sells in.",
      "L7"
    ],
    example: [
      "Harbor Insurance Ltd. is incorporated in Bermuda and not authorized in Texas: alien, non-admitted, and it would reach Texas buyers through surplus lines.",
      "L3–L5"
    ],
    exam: [
      "Expect mixed scenarios that test ownership, domicile and authorization in one question.",
      "L7"
    ],
    summary: [
      "Chapter 2 covers ownership, domicile, authorization and markets.",
      "L7"
    ]
  }
}

/** The demo story's seeded notes. */
export const JEFF_NOTES = [
  {
    id: "n1",
    lesson: "L3",
    num: "3.2",
    quote: "Domestic insurer: incorporated under the laws of this state.",
    text: "Domestic = home state. Domicile sounds like \"home\".",
    date: "Oct 22"
  },
  {
    id: "n2",
    lesson: "L3",
    num: "3.2",
    quote: "Domicile is not the same as authorization.",
    text: "",
    date: "Oct 22"
  },
  {
    id: "n3",
    lesson: "L1",
    num: "1.3",
    quote: "Stock insurers are owned by stockholders, who may receive stockholder dividends.",
    text: "Stock: stockholders own it.",
    date: "Oct 18"
  },
  {
    id: "n4",
    lesson: "L1",
    num: "1.4",
    quote: "Mutual insurers are owned by their policyowners.",
    text: "Mutual: policyowners own it.",
    date: "Oct 18"
  },
  {
    id: "n5",
    lesson: "L2",
    num: "2.2",
    quote: "Demutualization: a mutual insurer converts to a stock insurer.",
    text: "",
    date: "Oct 19"
  }
]

/** The demo story's seeded flags. */
export const JEFF_FLAGS = [
  { id: "f1", lesson: "L3", num: "3.3", title: "Scenario: Ohio insurer selling in Texas", date: "Oct 21" },
  { id: "f2", lesson: "L1", num: "1.3", title: "Stock vs. mutual: who owns the company?", date: "Oct 18" }
]

/** Rubi's knowledge base — matched on keywords, with follow-up suggestions. */
export const JEFF_KB = [
  {
    id: "domestic",
    k: [
      "domestic"
    ],
    a: "A domestic insurer is incorporated under the laws of the state you are in. A Texas-incorporated insurer selling in Texas is domestic there.",
    src: "L3 · Section 3.2",
    follow: [
      "What makes an insurer foreign?",
      "Is domestic the same as admitted?"
    ]
  },
  {
    id: "foreign",
    k: [
      "foreign",
      "another state",
      "other state",
      "out of state",
      "out-of-state"
    ],
    a: "A foreign insurer is incorporated in another U.S. state. Lakeshore Mutual, incorporated in Ohio, is foreign when it sells in Texas.",
    src: "L3 · Sections 3.2, 3.3",
    follow: [
      "What makes an insurer alien?",
      "Can a foreign insurer be admitted?"
    ]
  },
  {
    id: "alien",
    k: [
      "alien",
      "bermuda",
      "outside the u",
      "another country",
      "overseas",
      "london"
    ],
    a: "An alien insurer is incorporated outside the United States. Harbor Insurance Ltd., incorporated in Bermuda, is alien in every U.S. state.",
    src: "L3 · Sections 3.2, 3.4",
    follow: [
      "Can an alien insurer be admitted?",
      "Quiz me"
    ]
  },
  {
    id: "domicile",
    k: [
      "domicile",
      "domiciled",
      "incorporat",
      "home state",
      "classif",
      "based"
    ],
    a: "Domicile is where an insurer is incorporated. Compare it with the state where the insurer is doing business: same state is domestic, another U.S. state is foreign, outside the U.S. is alien.",
    src: "L3 · Section 3.1",
    follow: [
      "Give me an example",
      "How is domicile different from admitted status?"
    ]
  },
  {
    id: "vs",
    k: [
      "domicile and admitted",
      "domicile vs",
      "admitted vs",
      "same as admitted",
      "different from admitted",
      "domestic the same",
      "same thing"
    ],
    w: 3,
    a: "They answer two different questions. Domicile: where is the insurer incorporated? Admitted status: has this state authorized it, with a Certificate of Authority? A foreign or alien insurer can still be admitted.",
    src: "L3 · Section 3.2 exam tip · L4",
    follow: [
      "What is a Certificate of Authority?",
      "Quiz me"
    ]
  },
  {
    id: "admitted",
    k: [
      "admitted",
      "authorized",
      "certificate",
      "authority",
      "licensed"
    ],
    a: "An admitted, or authorized, insurer has met the state’s requirements and holds a Certificate of Authority from the state insurance department. Domestic, foreign and alien insurers can all be admitted.",
    src: "L4 · Section 4.1",
    follow: [
      "What does non-admitted mean?",
      "Where do surplus lines fit?"
    ]
  },
  {
    id: "becomeadmitted",
    k: [
      "become admitted",
      "get admitted",
      "certificate of authority",
      "apply",
      "capital"
    ],
    w: 2,
    a: "An insurer applies to the state insurance department and shows it meets requirements such as minimum capital and surplus. The department then issues a Certificate of Authority listing the lines it may write.",
    src: "L4 · Section 4.3",
    follow: [
      "What does admitted status protect?",
      "Quiz me"
    ]
  },
  {
    id: "protect",
    k: [
      "protect",
      "complaint",
      "regulated"
    ],
    w: 2,
    a: "Admitted insurers are state-regulated on solvency, rates and forms, and generally participate in the state guaranty association, which can help pay covered claims if an admitted insurer fails.",
    src: "L4 · Section 4.4",
    follow: [
      "How do surplus lines work?",
      "Quiz me"
    ]
  },
  {
    id: "nonadmitted",
    k: [
      "non-admitted",
      "nonadmitted",
      "not admitted",
      "unauthorized",
      "unlicensed"
    ],
    w: 2,
    a: "A non-admitted, or unauthorized, insurer has not been authorized by the state. It generally cannot sell there directly; coverage is placed through the surplus lines market.",
    src: "L4 · Section 4.2",
    follow: [
      "How do surplus lines work?",
      "Quiz me"
    ]
  },
  {
    id: "surplus",
    k: [
      "surplus line",
      "excess line",
      "diligent",
      "broker",
      "high-risk",
      "high risk",
      "unusual risk"
    ],
    w: 3,
    a: "Surplus lines insurers are non-admitted insurers used when the standard market will not cover an unusual or high-risk situation. Coverage goes through a licensed surplus lines broker, usually after a diligent effort in the standard market.",
    src: "L5 · Section 5.2",
    follow: [
      "What is a residual market?",
      "Give me an example"
    ]
  },
  {
    id: "residual",
    k: [
      "residual",
      "fair plan",
      "assigned risk",
      "cannot get coverage",
      "can’t get coverage",
      "can't get coverage",
      "last resort"
    ],
    w: 2,
    a: "Residual markets are state-created programs, such as FAIR plans, that make coverage available to people who cannot get it in the voluntary market.",
    src: "L5 · Section 5.3",
    follow: [
      "How do surplus lines work?",
      "Summarize this lesson"
    ]
  },
  {
    id: "standard",
    k: [
      "standard market",
      "voluntary market",
      "regular rates"
    ],
    w: 2,
    a: "The standard market is coverage from admitted insurers for typical risks at regular rates. It is the first stop before surplus lines or residual markets.",
    src: "L5 · Section 5.1",
    follow: [
      "How do surplus lines work?"
    ]
  },
  {
    id: "stock",
    k: [
      "stock",
      "stockholder",
      "shareholder",
      "investor"
    ],
    a: "A stock insurer is owned by stockholders, who may receive stockholder dividends. Stock insurers typically issue nonparticipating policies.",
    src: "L1 · Section 1.3",
    follow: [
      "Who owns a mutual insurer?",
      "What is demutualization?"
    ]
  },
  {
    id: "mutual",
    k: [
      "mutual",
      "policyowner",
      "policyholder"
    ],
    a: "A mutual insurer is owned by its policyowners. Mutual insurers typically issue participating policies that may return surplus as dividends, which are never guaranteed.",
    src: "L1 · Section 1.4",
    follow: [
      "What is demutualization?",
      "What is a participating policy?"
    ]
  },
  {
    id: "mutualization",
    k: [
      "mutualization",
      "mutualize",
      "stock to mutual"
    ],
    w: 3,
    a: "Mutualization is when a stock insurer converts to a mutual insurer, and ownership passes to its policyowners.",
    src: "L2 · Section 2.1",
    follow: [
      "What is demutualization?"
    ]
  },
  {
    id: "demutualization",
    k: [
      "demutual",
      "mutual to stock"
    ],
    w: 4,
    a: "Demutualization is when a mutual insurer converts to a stock insurer, often to raise capital by selling shares.",
    src: "L2 · Section 2.2",
    follow: [
      "What is a mixed insurer?",
      "Quiz me"
    ]
  },
  {
    id: "mixed",
    k: [
      "mixed",
      "hybrid",
      "both"
    ],
    a: "A mixed insurer has features of both stock and mutual companies and may issue participating and nonparticipating policies.",
    src: "L2 · Section 2.2 exam tip",
    follow: [
      "What is a participating policy?"
    ]
  },
  {
    id: "participating",
    k: [
      "participating",
      "dividend"
    ],
    a: "Participating policies may pay policyowner dividends from the insurer’s surplus. They are typical of mutual insurers, and the dividends are never guaranteed.",
    src: "L6 · Section 6.1",
    follow: [
      "What is a nonparticipating policy?",
      "Quiz me"
    ]
  },
  {
    id: "guaranty",
    k: [
      "guaranty",
      "guarantee fund",
      "insolven"
    ],
    w: 3,
    a: "Surplus lines policies generally are not protected by the state guaranty association, because surplus lines insurers are non-admitted.",
    src: "L5 · Section 5.6",
    follow: [
      "How do surplus lines work?",
      "Quiz me"
    ]
  },
  {
    id: "assessable",
    k: [
      "assessable",
      "assessment"
    ],
    w: 3,
    a: "An assessable policy lets the insurer charge policyowners more if losses exceed premiums and surplus. A nonassessable policy cannot be assessed.",
    src: "L6 · Section 6.5",
    follow: [
      "Where do dividends come from?",
      "Quiz me"
    ]
  },
  {
    id: "divsource",
    k: [
      "where do dividends",
      "dividends come from",
      "declare"
    ],
    w: 3,
    a: "Dividends come from better-than-expected losses, expenses or investment results. The board may declare them, which is why they are never guaranteed.",
    src: "L6 · Section 6.3",
    follow: [
      "How are dividends paid?",
      "What is an assessable policy?"
    ]
  },
  {
    id: "nonparticipating",
    k: [
      "nonparticipating",
      "non-participating",
      "non participating"
    ],
    w: 3,
    a: "Nonparticipating policies do not pay policyowner dividends. They are typical of stock insurers, which pay dividends to stockholders instead.",
    src: "L6 · Section 6.2",
    follow: [
      "What is a participating policy?"
    ]
  }
]

/** The practice-quiz bank. `ans` indexes `opts`. */
export const JEFF_QUIZ = [
  {
    q: "Harbor Insurance Ltd. is incorporated in Bermuda and sells policies in Texas. In Texas, it is:",
    opts: [
      "Domestic",
      "Foreign",
      "Alien"
    ],
    ans: 2,
    why: "Bermuda is outside the U.S., so the insurer is alien in Texas, and in every other state.",
    src: "L3 · Section 3.2"
  },
  {
    q: "Prairie Mutual is incorporated in Illinois and sells policies in Illinois. In Illinois, it is:",
    opts: [
      "Domestic",
      "Foreign",
      "Alien"
    ],
    ans: 0,
    why: "It is incorporated in the same state where it is selling, so it is domestic there.",
    src: "L3 · Section 3.2"
  },
  {
    q: "Which best describes a surplus lines insurer?",
    opts: [
      "Admitted insurer",
      "Non-admitted insurer",
      "State residual program"
    ],
    ans: 1,
    why: "Surplus lines insurers are non-admitted. They cover risks the standard market will not.",
    src: "L5 · Section 5.2"
  },
  {
    q: "Who owns a mutual insurer?",
    opts: [
      "Stockholders",
      "Policyowners",
      "The state"
    ],
    ans: 1,
    why: "Mutual insurers are owned by their policyowners.",
    src: "L1 · Section 1.4"
  }
]

/** Rubi's chips: in a conversation, and on an untouched composer. */
export const JEFF_CHIPS: [string, string][] = [
  [
    "Explain it simpler",
    "simpler"
  ],
  [
    "Give me an example",
    "example"
  ],
  [
    "What’s likely on the exam?",
    "exam"
  ]
]
export const JEFF_LESSON_CHIPS: [string, string | null][] = [
  [
    "Summarize this lesson",
    "summary"
  ],
  [
    "What’s likely on the exam?",
    "exam"
  ],
  [
    "Quiz me",
    null
  ]
]

/** The six-chapter contents. `m` is [rubi, notes, flags] marker counts. */
export const JEFF_TOC = [
  {
    n: 1,
    title: "Insurance Basics",
    lessons: [
      {
        title: "What Insurance Does",
        types: [
          "read",
          "video",
          "check"
        ],
        min: 9,
        st: "done",
        m: [
          0,
          0,
          0
        ]
      },
      {
        title: "Risk, Peril and Hazard",
        types: [
          "read",
          "read",
          "cards",
          "check"
        ],
        min: 11,
        st: "done",
        m: [
          1,
          1,
          0
        ]
      },
      {
        title: "Insurable Interest and Ideal Risks",
        types: [
          "read",
          "scenario",
          "cards",
          "check"
        ],
        min: 12,
        st: "done",
        m: [
          0,
          0,
          1
        ]
      },
      {
        title: "Reinsurance",
        types: [
          "read",
          "audio",
          "check"
        ],
        min: 8,
        st: "done",
        m: [
          0,
          1,
          0
        ]
      },
      {
        title: "Chapter Review and Quick Check",
        types: [
          "review"
        ],
        min: 8,
        st: "done",
        m: [
          0,
          0,
          0
        ]
      }
    ]
  },
  {
    n: 2,
    title: "Insurers and Insurance Markets",
    lessons: [
      {
        title: "Stock and Mutual Insurers",
        types: [
          "read",
          "read",
          "cards",
          "check"
        ],
        min: 12,
        st: "current",
        m: [
          1,
          2,
          1
        ]
      },
      {
        title: "Mutualization and Demutualization",
        types: [
          "read",
          "video",
          "read",
          "cards",
          "check"
        ],
        min: 10,
        st: "todo",
        m: [
          0,
          0,
          0
        ]
      },
      {
        title: "Domestic, Foreign and Alien Insurers",
        types: [
          "read",
          "read",
          "scenario",
          "cards",
          "check"
        ],
        min: 11,
        st: "todo",
        m: [
          0,
          0,
          0
        ]
      },
      {
        title: "Admitted and Non-admitted Insurers",
        types: [
          "read",
          "video",
          "read",
          "scenario",
          "cards",
          "check"
        ],
        min: 13,
        st: "todo",
        m: [
          0,
          0,
          0
        ]
      },
      {
        title: "Standard, Surplus Lines and Residual Markets",
        types: [
          "read",
          "read",
          "audio",
          "read",
          "scenario",
          "read",
          "cards",
          "check"
        ],
        min: 18,
        st: "todo",
        m: [
          0,
          0,
          0
        ]
      },
      {
        title: "Participating and Nonparticipating Policies",
        types: [
          "read",
          "read",
          "video",
          "read",
          "scenario",
          "cards",
          "check"
        ],
        min: 15,
        st: "todo",
        m: [
          0,
          0,
          0
        ]
      },
      {
        title: "Chapter Review and Quick Check",
        types: [
          "review"
        ],
        min: 8,
        st: "todo",
        m: [
          0,
          0,
          0
        ]
      }
    ]
  },
  {
    n: 3,
    title: "Agents and General Law",
    lessons: [
      {
        title: "Licensing Requirements",
        types: [
          "read",
          "read",
          "cards",
          "check"
        ],
        min: 9,
        st: "todo",
        m: [
          0,
          0,
          0
        ]
      },
      {
        title: "Agent Authority and Appointments",
        types: [
          "read",
          "video",
          "scenario",
          "check"
        ],
        min: 10,
        st: "todo",
        m: [
          0,
          0,
          0
        ]
      },
      {
        title: "Fiduciary Responsibilities",
        types: [
          "read",
          "scenario",
          "cards",
          "check"
        ],
        min: 9,
        st: "todo",
        m: [
          0,
          0,
          0
        ]
      },
      {
        title: "Unfair Trade Practices",
        types: [
          "read",
          "read",
          "scenario",
          "scenario",
          "check"
        ],
        min: 11,
        st: "todo",
        m: [
          0,
          0,
          0
        ]
      },
      {
        title: "Continuing Education Requirements",
        types: [
          "read",
          "audio",
          "check"
        ],
        min: 6,
        st: "todo",
        m: [
          0,
          0,
          0
        ]
      },
      {
        title: "Chapter Review and Quick Check",
        types: [
          "review"
        ],
        min: 7,
        st: "todo",
        m: [
          0,
          0,
          0
        ]
      }
    ]
  },
  {
    n: 4,
    title: "Insurance Contracts",
    lessons: [
      {
        title: "Elements of a Legal Contract",
        types: [
          "read",
          "video",
          "cards",
          "check"
        ],
        min: 9,
        st: "todo",
        m: [
          0,
          0,
          0
        ]
      },
      {
        title: "Adhesion and Aleatory Contracts",
        types: [
          "read",
          "read",
          "scenario",
          "check"
        ],
        min: 8,
        st: "todo",
        m: [
          0,
          0,
          0
        ]
      },
      {
        title: "Utmost Good Faith",
        types: [
          "read",
          "audio",
          "check"
        ],
        min: 6,
        st: "todo",
        m: [
          0,
          0,
          0
        ]
      },
      {
        title: "Representations and Warranties",
        types: [
          "read",
          "scenario",
          "cards",
          "check"
        ],
        min: 9,
        st: "todo",
        m: [
          0,
          0,
          0
        ]
      },
      {
        title: "Concealment and Fraud",
        types: [
          "read",
          "video",
          "scenario",
          "check"
        ],
        min: 10,
        st: "todo",
        m: [
          0,
          0,
          0
        ]
      },
      {
        title: "Waiver and Estoppel",
        types: [
          "read",
          "read",
          "cards",
          "check"
        ],
        min: 8,
        st: "todo",
        m: [
          0,
          0,
          0
        ]
      },
      {
        title: "Chapter Review and Quick Check",
        types: [
          "review"
        ],
        min: 8,
        st: "todo",
        m: [
          0,
          0,
          0
        ]
      }
    ]
  },
  {
    n: 5,
    title: "Life Insurance Basics",
    lessons: [
      {
        title: "Insurable Interest in Life Insurance",
        types: [
          "read",
          "read",
          "check"
        ],
        min: 7,
        st: "todo",
        m: [
          0,
          0,
          0
        ]
      },
      {
        title: "Human Life Value and Needs Approach",
        types: [
          "read",
          "video",
          "scenario",
          "check"
        ],
        min: 11,
        st: "todo",
        m: [
          0,
          0,
          0
        ]
      },
      {
        title: "Personal Uses of Life Insurance",
        types: [
          "read",
          "audio",
          "cards",
          "check"
        ],
        min: 9,
        st: "todo",
        m: [
          0,
          0,
          0
        ]
      },
      {
        title: "Business Uses of Life Insurance",
        types: [
          "read",
          "scenario",
          "scenario",
          "check"
        ],
        min: 11,
        st: "todo",
        m: [
          0,
          0,
          0
        ]
      },
      {
        title: "Classes of Life Insurance",
        types: [
          "read",
          "read",
          "cards",
          "check"
        ],
        min: 9,
        st: "todo",
        m: [
          0,
          0,
          0
        ]
      },
      {
        title: "Premium Factors",
        types: [
          "read",
          "video",
          "cards",
          "check"
        ],
        min: 10,
        st: "todo",
        m: [
          0,
          0,
          0
        ]
      },
      {
        title: "Chapter Review and Quick Check",
        types: [
          "review"
        ],
        min: 8,
        st: "todo",
        m: [
          0,
          0,
          0
        ]
      }
    ]
  },
  {
    n: 6,
    title: "Life Policies and Riders",
    lessons: [
      {
        title: "Term Life",
        types: [
          "read",
          "video",
          "cards",
          "check"
        ],
        min: 9,
        st: "todo",
        m: [
          0,
          0,
          0
        ]
      },
      {
        title: "Whole Life",
        types: [
          "read",
          "read",
          "cards",
          "check"
        ],
        min: 9,
        st: "todo",
        m: [
          0,
          0,
          0
        ]
      },
      {
        title: "Universal and Variable Life",
        types: [
          "read",
          "video",
          "scenario",
          "check"
        ],
        min: 11,
        st: "todo",
        m: [
          0,
          0,
          0
        ]
      },
      {
        title: "Joint and Survivorship Life",
        types: [
          "read",
          "audio",
          "check"
        ],
        min: 7,
        st: "todo",
        m: [
          0,
          0,
          0
        ]
      },
      {
        title: "Riders That Add Benefits",
        types: [
          "read",
          "scenario",
          "cards",
          "check"
        ],
        min: 9,
        st: "todo",
        m: [
          0,
          0,
          0
        ]
      },
      {
        title: "Riders That Waive Premium",
        types: [
          "read",
          "read",
          "check"
        ],
        min: 7,
        st: "todo",
        m: [
          0,
          0,
          0
        ]
      },
      {
        title: "Policy Provisions Overview",
        types: [
          "read",
          "scenario",
          "cards",
          "check"
        ],
        min: 10,
        st: "todo",
        m: [
          0,
          0,
          0
        ]
      },
      {
        title: "Chapter Review and Quick Check",
        types: [
          "review"
        ],
        min: 8,
        st: "todo",
        m: [
          0,
          0,
          0
        ]
      }
    ]
  }
]

/** His activity glyphs — the spoken names only; the icons come from @/icons. */
export const JEFF_ACTIVITY: Record<string, { one: string; many: string }> = {
  read: { one: "reading", many: "readings" },
  video: { one: "video", many: "videos" },
  audio: { one: "audio segment", many: "audio segments" },
  cards: { one: "flashcard set", many: "flashcard sets" },
  scenario: { one: "scenario", many: "scenarios" },
  check: { one: "knowledge check", many: "knowledge checks" },
  review: { one: "chapter review", many: "chapter reviews" }
}

export const JEFF_STATES = [
  "Texas",
  "Ohio",
  "Florida",
  "California",
  "New York",
  "Illinois",
  "Georgia",
  "Pennsylvania"
]
export const JEFF_LINES = [
  "Personal Lines",
  "Property & Casualty",
  "Life & Health"
]

/** The Sources panel's sample uploads. */
export const JEFF_SAMPLES = {
  file: [
    { label: "Texas Candidate Handbook.pdf", sub: "PDF · 48 pages", handbook: true },
    { label: "Agency onboarding notes.docx", sub: "Word · 6 pages" }
  ],
  photo: [
    { label: "Handwritten notes, page 3.jpg", sub: "Photo · 1 page" },
    { label: "Study guide p. 41.jpg", sub: "Photo · 1 page" }
  ]
}

/** The scenario check's four options. 'b' is right; a wrong pick queues the 'miss' nudge. */
export const JEFF_SCENARIO: { key: string; text: string }[] = [
  { key: 'a', text: 'Domestic insurer' },
  { key: 'b', text: 'Foreign insurer' },
  { key: 'c', text: 'Alien insurer' },
  { key: 'd', text: 'Non-admitted insurer' },
]
export const JEFF_SCENARIO_ANSWER = 'b'

/** What his chat refuses to echo — the PII guard, his regex verbatim. */
export const JEFF_PII = /(\b\d{3}-?\d{2}-?\d{4}\b|\b\d{9,}\b|my address|license number|licence number|social security|ssn|credit card|card number|routing number)/i

/**
 * THE DEMO STORY'S SEEDED RUBI CONVERSATIONS — his `state.threads`.
 *
 * ⚠ TWO CONVERSATIONS, AND THEY COUNT AS MARKERS. His story reads "9 markers
 * in this chapter": five notes, two flags and these two. A port that seeded
 * only the notes and flags reports 7 and looks right — which is why the
 * parity capture counts them.
 */
export type JeffThread = {
  id: string
  date: string
  lesson: string
  /** The section number the conversation hangs off. */
  anchor: string
  topic: string
  title: string
  msgs: { who: 'user' | 'rubi'; text: string; src?: string }[]
}

export const JEFF_THREADS: JeffThread[] = [
  {
    id: 't1',
    date: 'Oct 20',
    lesson: 'L3',
    anchor: '3.2',
    topic: 'domicile',
    title: 'Domestic vs. foreign vs. alien',
    msgs: [
      { who: 'user', text: 'How do I tell domestic, foreign and alien apart?' },
      {
        who: 'rubi',
        text: 'Ask one question: where was the insurer incorporated, compared with the state you are in? Same state means domestic. Another U.S. state means foreign. Outside the U.S. means alien.',
        src: 'L3 · Section 3.2',
      },
    ],
  },
  {
    id: 't2',
    date: 'Oct 18',
    lesson: 'L1',
    anchor: '1.4',
    topic: 'ownership',
    title: 'Who owns a mutual insurer?',
    msgs: [
      { who: 'user', text: 'Who actually owns a mutual insurer?' },
      {
        who: 'rubi',
        text: 'Its policyowners. That is why mutual insurers often issue participating policies that can return surplus as dividends.',
        src: 'L1 · Section 1.4',
      },
    ],
  },
]

/* ── The Compass full view ─────────────────────────────────────────────── */

/**
 * ⚠ A FOURTH MARKER KIND, and it only exists in the full view: a POINTER is
 * something Rubi noticed, not something the learner made. His lesson rail
 * counts nine markers; the full view counts ten, and this is the tenth.
 */
export const JEFF_POINTERS = [
  {
    id: 'p1',
    lesson: 'L3',
    num: '3.3',
    text: 'You’ve come back to insurer classification 3 times. Want a quick check?',
  },
]

/** His topic names, as the chips and the Studio's "Focus next" print them. */
export const JEFF_TOPIC_LABEL: Record<string, string> = {
  domicile: 'Insurer classification',
  ownership: 'Insurer ownership',
  authorization: 'Authorization',
  markets: 'Insurance markets',
  dividends: 'Policy dividends',
  review: 'Chapter review',
}

/** Days to the exam, as the Studio's readiness block states it. */
export const JEFF_EXAM_DAYS = 33

/**
 * THE NOTEBOOK'S OPENING — ⚠ A WRITTEN PARAGRAPH, NOT A GENERATED ONE. His
 * export hardcodes it, which is itself the design decision: it is what a
 * synthesis of these marks should READ like, not a string his prototype can
 * actually produce. Porting it as a template that assembles itself from the
 * selected marks would be inventing a capability he did not claim.
 */
export const JEFF_NOTEBOOK = {
  title: 'Insurers and Insurance Markets',
  synthesis:
    /* ⚠ HIS APOSTROPHES, STRAIGHT, and not "corrected" to curly ones. The rest
       of his copy is typographic; these two strings are not, and a port that
       tidies them is a port that has started editing his words. */
    "Your sources cover how insurers are organized and classified: stock vs. mutual ownership, demutualization, and domestic, foreign and alien domicile. You've come back to insurer classification three times, so a quick check there would help most.",
  readinessLead: 'Topic readiness in these sources:',
  placeholder: 'Ask about your selected sources…',
  disclaimer:
    'Rubi is here to help with the course. Please keep personal details like your address, license number or payment information out of the chat.',
}

/** The notebook's four prompt chips — his `prompts`, with their answer keys. */
export const JEFF_NOTEBOOK_CHIPS: [string, string | null][] = [
  ['Summarize my sources', 'summary'],
  ['What’s likely on the exam?', 'exam'],
  ['Give me an example', 'example'],
  ['Quiz me', null],
]

/** The Studio's six formats. ⚠ Two are COMING SOON and are not pressable. */
export const JEFF_STUDIO: { kind: string; sub: string; soon?: true }[] = [
  { kind: 'Flashcards', sub: 'Spaced to your exam date' },
  { kind: 'Practice quiz', sub: 'Exam style, with rationale' },
  { kind: 'Review guide', sub: 'One page per lesson' },
  { kind: 'Audio recap', sub: '5-minute commute review' },
  { kind: 'Podcast', sub: 'A conversation about your marks', soon: true },
  { kind: 'Simulation', sub: 'Practise the conversation, not the definition', soon: true },
]

/**
 * WHAT A MADE THING'S BUTTON DOES — his `LIB_ACTION`, and the finding that
 * resized this whole port.
 *
 * ⚠ THERE IS NO DECK PLAYER AND NO QUIZ MODE. Every artefact's call to action
 * asks the NOTEBOOK a question: Flashcards and Practice quiz send "Quiz me",
 * Review guide and Audio recap send "Summarize my sources". The chat is the
 * only place anything is studied. A port that built a card player and a quiz
 * engine here would be adding two surfaces he did not design — and the first
 * pass of this port had both of them on its list.
 *
 * `[button label, the prompt it sends, the answer key]`.
 */
export const JEFF_LIB_ACTION: Record<string, [string, string, string | null]> = {
  Flashcards: ['Study the cards', 'Quiz me', null],
  'Practice quiz': ['Start the questions', 'Quiz me', null],
  'Review guide': ['Open the guide', 'Summarize my sources', 'summary'],
  'Audio recap': ['Play the recap', 'Summarize my sources', 'summary'],
}

/** What the demo story has already made — his seeded `library`. */
export const JEFF_LIBRARY_SEED = [
  {
    kind: 'Review guide',
    title: 'Review guide · Insurer types (Part 1)',
    meta: 'Made from 3 marks · yesterday',
  },
]

/** The Studio's footnote, under everything it can make. */
export const JEFF_STUDIO_DISCLAIMER =
  "AI-generated from your marks · not an ID-validated assessment and doesn't count toward course hours."

/** "Where in my learning" — the Sources rail's scope. */
export const JEFF_SCOPES: { value: string; label: string }[] = [
  { value: 'chapter', label: 'Chapter 2 · all lessons' },
  { value: 'lesson', label: 'Chapter 2 · Lesson 3' },
  { value: 'course', label: 'Whole course' },
]

/** A note or flag the learner makes in this session, beside the seeded ones. */
export type JeffMadeNote = { id: string; lesson: string; num: string; quote: string; text: string; date: string }
export type JeffMadeFlag = { id: string; lesson: string; num: string; title: string; date: string }

/**
 * HIS MARKER-TYPE FILTER — the five pills behind "Choose marker type".
 * ⚠ The labels are his and they are not the group headings: the rail groups
 * under "Rubi", the filter says "Rubi chats".
 */
export const JEFF_MARKER_FILTERS: { key: string; label: string; kind?: string }[] = [
  { key: 'all', label: 'All markers' },
  { key: 'rubi', label: 'Rubi chats', kind: 'Rubi conversation' },
  { key: 'pointer', label: 'Pointers', kind: 'Pointer' },
  { key: 'note', label: 'Notes', kind: 'Note' },
  { key: 'flag', label: 'Flags', kind: 'Flag' },
]

/* ── Rubi's pointers ───────────────────────────────────────────────────── */

/**
 * THE THREE POINTERS, AND WHAT EACH ONE OPENS — his `NUDGES`, plus the
 * conversation `openNudge` starts for it.
 *
 * ⚠ THEY ARE NOT NOTIFICATIONS. Each one is Rubi noticing something specific
 * about this learner — that they keep coming back to one idea, that they just
 * confused two things, that an exam question is about to pair them — and the
 * card is only the invitation. Opening it starts a real conversation in the
 * rail, anchored to the section that prompted it.
 *
 * ⚠ ALL THREE LIVE IN LESSON 3, and his card only shows there. A pointer that
 * followed the learner into another lesson would be talking about a passage
 * that is no longer on screen.
 */
export type JeffPointer = {
  kind: 'revisit' | 'miss' | 'tip'
  eyebrow: string
  msg: string
  /** Spoken as "Rubi has a pointer: <topic>", and in the Open button's label. */
  topic: string
  anchor: string
  /** The conversation it opens. */
  thread: { title: string; src: string; text: string; quiz?: true }
}

export const JEFF_NUDGES: JeffPointer[] = [
  {
    kind: 'revisit',
    eyebrow: 'Rubi can quiz you',
    msg: 'You’ve come back to insurer classification 3 times. Want a quick check?',
    topic: 'insurer classification check',
    anchor: '3.3',
    thread: {
      title: 'Quick check: insurer classification',
      src: 'L3 · Section 3.2',
      text: 'Here’s one. Harbor Insurance Ltd. is incorporated in Bermuda and sells policies in Texas. In Texas, it is: domestic, foreign or alien? Pick an answer above the prompt.',
      /* ⚠ THIS ONE ARRIVES WITH A QUESTION ATTACHED — the thread opens on
         QUIZ[0] with its options, and the answer is scored. */
      quiz: true,
    },
  },
  {
    kind: 'miss',
    eyebrow: 'Rubi can explain this',
    msg: 'Mixed up domicile and admitted status? I can break just this apart.',
    topic: 'domicile vs. admitted status',
    anchor: '3.3',
    thread: {
      title: 'Domicile vs. admitted status',
      src: 'L3 · Sections 3.2, 3.3',
      text: 'Two separate questions. Domicile: where is the insurer incorporated? Ohio is another U.S. state, so in Texas Lakeshore is foreign. Admitted: has Texas authorized it? Yes, so it is also admitted. "Non-admitted" answers the second question, not the first.',
    },
  },
  {
    kind: 'tip',
    eyebrow: 'Rubi tip',
    msg: 'Exam questions often pair domicile with admitted status. Want the 30-second version?',
    topic: 'domicile and admitted status on the exam',
    anchor: '3.4',
    thread: {
      title: 'Domicile and admitted status',
      src: 'L3 · Section 3.2 exam tip',
      text: 'Domicile is where the insurer is incorporated: domestic, foreign or alien. Admitted status is whether the state authorized it, shown by a Certificate of Authority. Answer each question on its own.',
    },
  },
]

/** The chapter-finish dialog's fixed copy. The six stats are computed. */
export const JEFF_FINISH = {
  eyebrow: 'Chapter 2 complete',
  title: 'Nicely done, you finished Insurers and Insurance Markets',
  msg: "You worked through ownership, domicile, authorization and insurance markets. That covers one of the most tested areas on the Personal Lines exam. Here's a look at what you did.",
  next: 'your notes, flags and Rubi conversations stay in Compass for review before the exam.',
  upNext: 'Chapter 3 · Elements of an Insurance Contract',
  upNextMeta: 'About 1h 45m to complete · 6 lessons',
  review: 'Review in Compass',
}

/* ── The + menu: add context, upload ───────────────────────────────────── */

/** His two groups, in his order, with his sub-labels. */
export const JEFF_PLUS_CONTEXT: { key: string; label: string; sub: string }[] = [
  { key: 'lesson', label: 'This lesson', sub: '' },
  { key: 'course', label: 'Choose from course…', sub: 'Lessons and sections in Chapter 2' },
  { key: 'markers', label: 'My markers…', sub: 'Notes, flags and Rubi conversations' },
  { key: 'library', label: 'My Library…', sub: 'Saved guides, flashcards and quizzes' },
  { key: 'exam', label: 'My exam details', sub: 'State, license line and exam date' },
]
export const JEFF_PLUS_UPLOAD: { key: string; label: string; sub: string }[] = [
  { key: 'file', label: 'Upload a file', sub: 'PDF, Word or image' },
  { key: 'photo', label: 'Take a photo', sub: 'Printed pages or handwritten notes' },
  { key: 'link', label: 'Paste a link', sub: 'A public web page' },
]

/**
 * ⚠ FIVE ITEMS, AND THE LIMIT IS THE DESIGN. His `CTX_MAX` caps what Rubi is
 * asked to hold in mind at once, and the announcement says so out loud ("Rubi
 * can use up to 5 items"). A context tray with no ceiling would be a different
 * claim about what the assistant is doing.
 */
export const JEFF_CTX_MAX = 5

/** His sample link, behind "Use a sample link". */
export const JEFF_SAMPLE_LINK = 'https://www.tdi.texas.gov/agent/licensing-faq.html'

/** What the mic "hears" in his demo path, cycled one per press. */
export const JEFF_MIC_SAMPLES = [
  'What does non-admitted mean?',
  'How do surplus lines work?',
  'Is domestic the same as admitted?',
  'Quiz me',
]
