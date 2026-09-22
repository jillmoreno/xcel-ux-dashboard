import fs from 'fs';
import { JSDOM, VirtualConsole } from 'jsdom';

/* ============================================================
   smoke-home.mjs — xcel-home.html

   This page is a COPY of a live React surface, which no other prototype in
   this folder is. So the assertions are weighted differently: most of them
   pin the things a careless edit would quietly get wrong about the product,
   rather than behaviour (the page has none — it is deliberately static).

   What is pinned, and why each one:
     · the rail is the demo baseline, in order, in its two named groups —
       an ORDER check alone is blind to grouping, which is how a rail move
       once passed every test in the suite
     · the course is named ONCE (the duplication rule the course header and
       the block below it exist to satisfy)
     · the measure is LESSONS, and no invented credit-hour split appears
     · blocked journey stops render NO visible meta but KEEP their status in
       the accessible name, and carry no chevron
     · Get Licensed steps carry no completion state at all
     · the copy the product deliberately refuses is still absent
     · red is spent on nothing but the notification badge
     · every asset reference is same-origin and has a fallback
     · it is light-only — no theme control, because the app's dark rail is
       broken and a toggle here would lie
   ============================================================ */

const path = new URL('../public/prototypes/xcel-home.html', import.meta.url);
const html = fs.readFileSync(path, 'utf8');
const errs = [];
const vc = new VirtualConsole().on('jsdomError', e => errs.push(e.message));
const dom = new JSDOM(html, {
  runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
  url: 'https://example.test/prototypes/xcel-home.html',
});
const { window } = dom, D = window.document;
window.addEventListener('error', e => errs.push(e.message));

const q = s => D.querySelector(s), all = s => [...D.querySelectorAll(s)];
const T = el => ((typeof el === 'string' ? q(el) : el)?.textContent || '').replace(/\s+/g, ' ').trim();
const BODY = T('body');
const styleBlockEarly = html.slice(html.indexOf('<style'), html.indexOf('</style>'));
const log = [], ck = (n, c, x = '') => log.push((c ? 'PASS' : 'FAIL') + '  ' + n + (x ? '  — ' + x : ''));

/* ---------- mounts ---------- */
ck('page mounts with no script errors', errs.length === 0, errs.slice(0, 2).join(' | '));
ck('has a single h1, and it names the section', all('h1').length === 1 && T('h1') === 'Home');

/* ---------- the rail IS the committed demo baseline ---------- */
/* Seven rows, in this order, then Support. Asserted as a whole list rather
   than "X is present": a presence check passes just as happily when an
   unrelated row appears. */
const MY_LEARNING = ['Home', 'Study Plan', 'Readiness', 'My Courses',
                     'Certificates', 'Resources', 'Rubi Insights'];
const learningList = all('.raillist')[0];
const learningRows = [...learningList.querySelectorAll('.railitem')].map(b => T(b));
ck('My Learning is the seven baseline rows, in order',
   JSON.stringify(learningRows) === JSON.stringify(MY_LEARNING), learningRows.join(' · '));

/* GROUPING, not just order. Resources and Rubi moved from the top of Explore
   to the end of My Learning and the flat button order did not change at all —
   so a whole-rail-in-order assertion is blind to it. The group's own list is
   the handle that can see it. */
const capOf = ul => T('#' + ul.getAttribute('aria-labelledby'));
ck('Resources and Rubi are IN My Learning, not a separate group',
   capOf(learningList) === 'My Learning' &&
   learningRows.includes('Resources') && learningRows.includes('Rubi Insights'));

const supportList = all('.raillist')[1];
ck('Support is its own group and holds only Get Help',
   capOf(supportList) === 'Support' &&
   [...supportList.querySelectorAll('.railitem')].map(T).join() === 'Get Help');

/* Explore is gone from this baseline — Browse Catalog was its only row and it
   is off, so the group drops whole. Asserting the absence of the LIST rather
   than of the row is what proves the drop-empty rule ran: a heading over
   nothing reads as a load failure. */
ck('there is no Explore group', all('.raillist').length === 2 && !/Explore|Browse Catalog/i.test(BODY));

ck('exactly one rail row is current, and it is Home',
   all('.railitem[aria-current="page"]').length === 1 &&
   T('.railitem[aria-current="page"]') === 'Home');
ck('every rail row has a glyph', all('.railitem').every(b => b.querySelector('svg use')));

/* ---------- the layout: two columns from the top ---------- */
/* 2026-09-21, the direct ask: the Study Journey leads the page. It was below a
   full-width course header, which put the answer to "what do I do next" a whole
   block down. So the course header is INSIDE the left column now — narrowed —
   and both columns start together. A regression here is the header drifting
   back out to full width, which reads fine in isolation and silently pushes the
   journey down again. */
const band = q('.band');
ck('the course header is inside the left column, not spanning the page',
   band.contains(q('.coursehead')) && q('.coursehead').closest('.col') === band.firstElementChild);
ck('the Study Journey is the first thing in the right column',
   T(band.lastElementChild.querySelector('.weyebrow')) === 'Atlas Study Journey');
ck('both columns lead with an eyebrow, and neither adds its own top padding',
   /\.col > \.wsec:first-child\{padding-top:0\}/.test(styleBlockEarly));

/* The interpunct separators went with the narrowing: three facts inline measure
   ~690px against a ~552px column, and a wrapped line ENDING on a "·" reads as a
   value that failed to load. The cells are divided by rules instead. */
ck('the meta facts carry no interpunct separators',
   !q('.metas .dot'));
ck('the meta cells are divided by a rule on the leading edge of 2 and 3',
   /\.meta \+ \.meta\{padding-left:16px;border-left:1px solid var\(--color-neutral-300\)\}/
     .test(styleBlockEarly));
ck('there are exactly three meta facts, each a value over a label',
   all('.meta').length === 3 &&
   all('.meta').every(m => m.querySelector('.metaval') && m.querySelector('.metalb')));

/* ---------- the course is named once ---------- */
const COURSE = 'New York Life and Health Pre-licensing';
const courseCount = (BODY.match(new RegExp(COURSE, 'g')) || []).length;
ck('the course name appears exactly once', courseCount === 1, 'found ' + courseCount);
ck('the percentage figure is drawn once',
   all('.pctwrap .figure').length === 1 && T('.pctwrap .figure') === '62');
ck('the progress bar agrees with the figure', q('.bar > i').style.width === '62%');

/* ---------- the measure is LESSONS ---------- */
ck('progress is stated in lessons', /26 of 42 lessons/.test(BODY));
ck('the journey stop repeats the same lesson count', /26 of 42 lessons complete/.test(T('.stoprow')));
/* 40 credit hours is a real regulatory figure and belongs on the requirements
   sheet, not on this surface — two units on one screen meaning different
   things is what the unit change was for. */
ck('no credit-hour figure leaks onto this surface', !/\b(40|56)\s*(credit\s*)?hours?\b/i.test(BODY));
ck('nothing is measured in days-of-plan', !/\b\d+\s*days?\b(?!.*LEFT TO COMPLETE)/i.test(T('.stoprow')));

/* ---------- the journey: sequence, not dates ---------- */
const STOPS = ['Pre-licensing Course', 'Prep Review Course', 'Exam Simulators',
               'Attestation & Certificate'];
const journey = all('.wsec')[0];
const stopTitles = [...journey.querySelectorAll('.steps .t')].map(T);
ck('the journey is the four stops, in curriculum order',
   JSON.stringify(stopTitles) === JSON.stringify(STOPS), stopTitles.join(' · '));

/* "Attestation & Certificate" is ONE stop, from two. They are still two ACTS
   in XCEL's published eligibility rules; they are one MOMENT on this rail. */
ck('attestation and the certificate are one stop, not two',
   stopTitles.filter(t => /Attestation|Certificate/.test(t)).length === 1);

/* A journey with due dates is just a worse calendar. */
ck('no stop carries a date or an overdue state',
   !/overdue|due\b|\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d/i.test(T(journey)));

const blocked = all('.stopstatic');
ck('three stops are blocked and render as static text', blocked.length === 3);
ck('blocked stops carry NO chevron', blocked.every(s => !s.querySelector('svg')));
/* The words survive in the accessible name — the rule is safe precisely
   because blocked and not-started never appear together here. */
ck('blocked stops keep their status in the accessible name, visually hidden',
   blocked.every(s => {
     const vh = s.querySelector('.vh');
     return vh && /After your coursework/.test(T(vh));
   }));
ck('the blocked status is never a visible meta line',
   !all('.stopstatic .s').length);

/* ---------- Get Licensed carries no completion state ---------- */
const licensed = all('.wsec')[1];
const STEPS = ['Schedule State Exam', 'Pass State Exam', 'Apply for your License'];
const stepTitles = [...licensed.querySelectorAll('.steps .t')].map(T);
ck('Get Licensed is the three state-owned steps, in order',
   JSON.stringify(stepTitles) === JSON.stringify(STEPS), stepTitles.join(' · '));
/* A tick against "Pass State Exam" would be the product claiming an outcome it
   has no feed for. Scoped to the STEP ROWS: the lede's "Once your course is
   completed" is a condition on the whole section, not a claim about a step. */
ck('no Get Licensed step claims an outcome',
   [...licensed.querySelectorAll('.steps li')].every(
     li => !/\b(complete|completed|in progress|passed|done|not started)\b/i.test(T(li))));
ck('no Get Licensed step carries a status element',
   !licensed.querySelector('.steps .s, .steps .chip, .steps .node.now'));
ck('Get Licensed numbering continues the journey (05-07)',
   [...licensed.querySelectorAll('.node')].map(T).join('') === '050607');
ck('the journey numbering runs 01-04',
   [...journey.querySelectorAll('.node')].map(T).join('') === '01020304');
ck('exactly one node on the page is filled — "you are here"', all('.node.now').length === 1);

/* ---------- copy the product deliberately refuses ---------- */
/* Claims about New York practice and a record number that nothing sources,
   plus the pacing sentence nothing in the fixtures knows a schedule for. */
const REFUSED = [
  'Foundational jurisprudence',
  'sworn affidavit',
  'NY-INS-L&H',
  'days ahead of schedule',
  'statutory window',
  '14 minutes left in this lesson',
];
REFUSED.forEach(s =>
  ck('does not invent: "' + s + '"', !new RegExp(s, 'i').test(BODY)));

/* ---------- red is spent on one thing ---------- */
/* On this version navy means "do this" and red means "this is an assessment".
   The only Brick on the page is the unread badge. */
const styleBlock = html.slice(html.indexOf('<style'), html.indexOf('</style>'));
/* USES, not declarations — the :root block defines the whole ramp and must not
   be counted as spending it. Two uses: the unread badge, and the text wordmark
   that only renders if the lockup file is missing. */
const ctaUses = (styleBlock.match(/var\(--color-cta-\d00\)/g) || []);
ck('the CTA ramp is spent on the badge and the wordmark fallback only',
   ctaUses.length <= 2, ctaUses.join(' '));
ck('no text CTA uses the Brick', /\.cta\{[^}]*--color-primary-500/.test(styleBlock.replace(/\s+/g, '')));

/* ---------- assets ---------- */
const imgs = all('img');
ck('every image is same-origin and absolute',
   imgs.every(i => /^\//.test(i.getAttribute('src'))), imgs.map(i => i.getAttribute('src')).join(' '));
/* A missing file must degrade the page, never break it. */
ck('every image carries a fallback', imgs.every(i => i.hasAttribute('onerror')));
ck('the cover falls back to the stock pool',
   /courses\/0\.webp/.test(q('.cover').getAttribute('onerror')));

/* ---------- light only ---------- */
/* The app HAS a dark theme and the home page does not survive it: the rail's
   inks are hardcoded literals that do not invert. A toggle here would be a
   control that lies — the admin tool's rule. */
ck('no theme or palette control', !q('[id*="theme" i]') && !q('.palbtn') && !q('#themeBtn'));
ck('no dark-theme rules in the stylesheet', !/\[data-theme=['"]?dark/.test(styleBlock));
ck('the bar says it is light only and static', /light only/i.test(T('.pbar')) && /nothing navigates/i.test(T('.pbar')));

/* ---------- house style ---------- */
ck('the prototype bar links to its siblings', all('.pbar .plink').length >= 6);
ck('every sibling link resolves to a file that exists',
   all('.pbar .plink').every(a => fs.existsSync(
     new URL('../public' + a.getAttribute('href'), import.meta.url))),
   all('.pbar .plink').map(a => a.getAttribute('href')).join(' '));
/* Tokens, not literals — the palette is the app's and has to stay traceable
   to it. The body may carry none at all. */
const body = html.slice(html.indexOf('<body'));
const bodyHex = (body.match(/#[0-9a-fA-F]{6}\b/g) || []);
ck('no raw hex in the body', bodyHex.length === 0, bodyHex.join(' '));
ck('the grid is 660:380, top-aligned',
   /minmax\(0,660fr\)\s*minmax\(0,380fr\)/.test(styleBlock.replace(/\s+/g, '')) &&
   /align-items:start/.test(styleBlock.replace(/\s+/g, '')));
/* The tiles are square by aspect-ratio, so they grow rather than clip. */
ck('the two tiles are square by aspect-ratio', /aspect-ratio:1 \/ 1/.test(styleBlock));
/* An inline background would beat the stylesheet, so :hover would compute and
   do nothing while looking correct. */
ck('no inline background is left to win the cascade over a hover rule',
   !all('.stoprow, .railitem').some(e => /background/.test(e.getAttribute('style') || '')));

/* The narrow-width block overrides base rules at EQUAL specificity, so it only
   works if it comes after them. Placed earlier it computes and does nothing —
   which it did for one build: the cover stayed 130px and the meta cells kept
   their 16px indent, while the media query itself was present and correct. */
/* Anchored on the block's own comment, not on `@media (max-width:900px)` —
   there are TWO blocks at that width (the header drops the learner's name in
   the other one) and `indexOf` finds the wrong one. */
const narrowAt = styleBlockEarly.indexOf('/* ---------- narrow widths ----------');
ck('the narrow-width block comes after every rule it overrides',
   narrowAt > Math.max(styleBlockEarly.indexOf('.cover{'),
                       styleBlockEarly.indexOf('.meta + .meta{')),
   'narrow@' + narrowAt);
const narrowBlock = styleBlockEarly.slice(narrowAt);
ck('narrow widths stack the cover and drop the cell rules',
   /\.cover\{width:100%/.test(narrowBlock) &&
   /\.meta \+ \.meta\{padding-left:0;border-left:0\}/.test(narrowBlock));

ck('no errors after the sweep', errs.length === 0, errs.slice(0, 2).join(' | '));

/* ---------- report ---------- */
const fails = log.filter(l => l.startsWith('FAIL'));
console.log(log.join('\n'));
console.log('\nhome: ' + (log.length - fails.length) + '/' + log.length + ' assertions passed');
if (fails.length) process.exit(1);
