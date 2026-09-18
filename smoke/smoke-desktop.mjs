import fs from 'fs';
import { JSDOM, VirtualConsole } from 'jsdom';
const html=fs.readFileSync(new URL('../public/prototypes/xcel-lms-desktop.html',import.meta.url),'utf8');
const errs=[];
const vc=new VirtualConsole().on('jsdomError',e=>errs.push(e.message));
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc});
const {window}=dom,D=window.document;
window.addEventListener('error',e=>errs.push(e.message));
const q=s=>D.querySelector(s), all=s=>[...D.querySelectorAll(s)];
const T=s=>(q(s)?.textContent||'').replace(/\s+/g,' ').trim();
const B=()=>T('#body');
const click=(s,l)=>{const el=typeof s==='string'?q(s):s;if(!el)throw new Error('missing '+(l||s));
  el.dispatchEvent(new window.MouseEvent('click',{bubbles:true}));};
const log=[],ck=(n,c,x='')=>log.push((c?'PASS':'FAIL')+'  '+n+(x?'  — '+x:''));

// shell
ck('rail renders both groups', /MY LEARNING/.test(T('#rail'))&&/EXPLORE/.test(T('#rail')));
ck('7 nav items', all('#rail [data-sec]').length===7, all('#rail [data-sec]').length+'');
ck('dashboard is current', q('#rail [data-sec="dashboard"]').getAttribute('aria-current')==='page');
ck('XCEL lockup present', /XCEL/.test(T('.lock'))&&/Insurance Training/.test(T('.lock')));

// education axis renames categories (the QE/CE flag)
ck('QE default labels', /Required Education/.test(B())&&/Elective Hours/.test(B()));
ck('QE deadline label is Target Date', /Target Date/.test(T('#heroSide')), T('#heroSide').slice(0,40));
click('[data-edu="ce"]');
ck('CE renames categories', /Ethics & Consumer Protection/.test(B())&&/General Hours/.test(B()));
ck('CE deadline label is License Expires', /License Expires/.test(T('#heroSide')));
ck('CE renames the path in rail', /Continuing Education/.test(T('#rail')));
click('[data-edu="qe"]');

// five compliance states
const seen=new Set();
for(const p of ['not-started','on-track','at-risk','expired','complete']){
  click(`[data-prog="${p}"]`); seen.add(T('#heroSide'));
}
ck('five progress states each render differently', seen.size===5, seen.size+' distinct');
click('[data-prog="at-risk"]');
ck('at-risk shows the behind-plan band', /behind your plan/i.test(B()));
ck('at-risk badges the rail', /Behind/.test(T('#rail')));
click('[data-prog="expired"]');
ck('expired explains hours are kept', /completed hours are kept/i.test(B()));
click('[data-prog="complete"]');
ck('complete swaps Jump Back In for ready state', /ready to sit/i.test(B()));
click('[data-prog="not-started"]');
ck('not-started says Begin', /Begin Chapter 1/.test(B()));
click('[data-prog="on-track"]');
ck('on-track resumes', /Resume course/.test(B()));

// gauge + bars
ck('segmented gauge present', all('#body svg circle').length>=3, all('#body svg circle').length+' arcs');
ck('gauge % matches state', /63%/.test(B()));

// exam card lifecycle — all six states via the demo control
ck('exam card scheduled', /Licensing exam/.test(B()));
const examSeen=new Set();
for(const e of ['none','scheduled','imminent','awaiting','failed','passed']){
  click(`[data-exam="${e}"]`); examSeen.add(B().slice(0,4000));
}
ck('six exam states each render differently', examSeen.size===6, examSeen.size+' distinct');
click('[data-exam="none"]');
ck('unbooked offers Schedule', /Schedule exam/.test(B())&&/Not booked yet/.test(B()));
click('[data-exam="imminent"]');
ck('imminent counts down', /In 5 days/.test(B()));
click('[data-exam="awaiting"]');
ck('awaiting asks to Record result', /Record result/.test(B())&&/Awaiting result/.test(B()));
click('[data-x="result"]');
ck('failed is warning, not error', /Not passed/.test(B())&&/unaffected/.test(B()));
ck('failed offers retake', /Schedule retake/.test(B()));
click('[data-x="retake"]');
ck('retake books attempt 2', /Licensing exam/.test(B()));
click('[data-exam="passed"]');
ck('passed is terminal', /Passed/.test(B())&&!/Schedule/.test(B().split('Recommended')[0]));
click('[data-sec="records"]');
ck('records shows attempt history', /Attempt/i.test(B())&&/PSI/.test(B()));
ck('records has all 3 reporting variants',
  /Reported/.test(B())&&/Pending/.test(B())&&/Non-reporting/.test(B()));
ck('records flags multi-state hole', /Not designed/.test(B())&&/several states/i.test(B()));
ck('both attempts listed', (B().match(/PSI/g)||[]).length>=2, (B().match(/PSI/g)||[]).length+' rows');
ck('passed shows licensed band', /Licensed/.test(B()));

// calendar
click('[data-sec="calendar"]');
ck('calendar daily view', /Today/.test(B())&&/Chapter 7/.test(B()));
ck('licensing exam row is marked not-a-course-task', /Not a course task/.test(B()));
click('[data-cal="all"]');
ck('all-tasks table', /<table|Task/.test(B())&&/Licensing exam/.test(B()));
click('[data-cal="grid"]');
ck('calendar grid renders 30 days', /September 2026/.test(B()));
click('[data-cal="daily"]');

/* Order of the calendar section. The exam + projected-completion pair is a
   SUMMARY and sits at the FOOT, under the plan it summarises — leading with
   it pushed today's tasks below the fold. Asserted in all three views,
   because each swaps the middle block and it would be easy to restore the
   old order in only one of them. provNote is prototype chrome and stays
   last of all. */
const kidClasses=()=>[...q('#body').children].map(e=>e.className);
for(const [view,label] of [['daily','Daily'],['all','All tasks'],['grid','Calendar']]){
  click(`[data-cal="${view}"]`);
  const ks=kidClasses();
  const iSummary=ks.indexOf('grid2'), iProv=ks.indexOf('provnote');
  const iLastCard=ks.lastIndexOf('card');
  ck(`${label}: summary pair sits below the plan body`, iSummary>iLastCard && iLastCard>=0,
     ks.join(' | '));
  ck(`${label}: provenance note is still last`, iProv===ks.length-1, ks.join(' | '));
}
click('[data-cal="daily"]');

// courses view toggle
click('[data-sec="courses"]');
ck('course cards by default', /CourseCard|Life & Health/.test(B()));
click('[data-cv="table"]');
ck('table view swaps', /Hours/.test(B())&&/Progress/.test(B()));

// path
click('[data-sec="path"]');
ck('path lists required + elective', /Required Education/.test(B())&&/Elective Hours/.test(B()));
ck('QE hides renewal cycle', /pre-licensure/.test(B()));
click('[data-edu="ce"]');
ck('CE shows a renewal cycle', /2 years/.test(B()));
click('[data-edu="qe"]');

// catalog + recommended
click('[data-sec="recommended"]');
ck('recommended has 3 shelves', (B().match(/See all/g)||[]).length===3);
click('[data-sec="catalog"]');
ck('catalog flags the who-pays hole', /Not designed/.test(B())&&/sponsored access/i.test(B()));

// provenance layer
ck('provenance hidden by default', D.body.getAttribute('data-prov')==='off');
click('#provBtn');
ck('provenance on', D.body.getAttribute('data-prov')==='on');
ck('provenance chips exist', all('.prov').length>0, all('.prov').length+' chips');
ck('provenance names real components', /CatalogPage/.test(B()));
click('[data-sec="dashboard"]');
ck('dashboard provenance names ClpJumpBackInBand', /ClpJumpBackInBand/.test(B()));
ck('provenance note explains reuse', /provnote|Provenance/.test(B()));

// theme
click('#themeBtn');
ck('dark theme applies', D.documentElement.getAttribute('data-theme')==='dark');
click('#themeBtn');
ck('back to light', D.documentElement.getAttribute('data-theme')==='light');


/* ============================================================
   PALETTE + CONTRAST SWEEP
   The palette is a design decision with measured thresholds behind it, and
   nothing else in this suite checks colour. Every stop is asserted here so
   the next person to "just darken that a little" fails a test instead of
   quietly shipping an invisible rail indicator. Mirrors the dashboard
   project's ProfilePersonalizeContrast test, including its most useful
   habit: assert the OLD failing value STILL fails, so the fix cannot be
   reverted by accident.
   ============================================================ */
const hex=h=>{h=h.replace('#','');return[0,2,4].map(i=>parseInt(h.slice(i,i+2),16));};
const lum=c=>{const[r,g,b]=hex(c).map(v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4;});
  return .2126*r+.7152*g+.0722*b;};
const cr=(a,b)=>{const[x,y]=[lum(a),lum(b)].sort((m,n)=>n-m);return (x+.05)/(y+.05);};
const f2=n=>n.toFixed(2);
// Read the real declared value out of the stylesheet, so these assertions
// track the CSS rather than a copy of it that can drift.
const css=html.slice(html.indexOf('<style>'),html.indexOf('</style>'));
const tok=(sel,name)=>{
  const i=css.indexOf(sel); if(i<0) return null;
  const blk=css.slice(i,css.indexOf('}',i));
  const m=blk.match(new RegExp('--'+name+':\\s*(#[0-9a-fA-F]{6})'));
  return m?m[1]:null;
};
const RAIL='#26262b', WHITE='#ffffff', CARD_D='#1d1d21';
const PALS=['navy','graphite','teal'];

// the brand red is constant across every palette — that is the whole point
// of splitting it out, so it is asserted as a constant, not per palette.
const BRAND=tok(':root{','brand-500');
ck('brand red is #a81c24 and lives in --brand-*', BRAND==='#a81c24', String(BRAND));
ck('brand red carries text on white (exam accent)', cr(BRAND,WHITE)>=4.5, f2(cr(BRAND,WHITE)));
ck('no --primary-* red left in :root', !/--primary-\d00:\s*#(a81c24|c75159)/.test(css));

for(const pal of PALS){
  const sel=':root[data-palette="'+pal+'"]{';
  const p500=tok(sel,'primary-500'), p400=tok(sel,'primary-400');
  const railA=tok(sel,'rail-accent'), chip=tok(sel,'rail-chip'), chipInk=tok(sel,'rail-chip-ink');
  const s500=tok(sel,'slate-500');
  ck(pal+': palette block declares its ramp', !!(p500&&p400&&railA&&chip&&chipInk&&s500));
  ck(pal+': rail active ≥3:1 on the near-black rail', cr(railA,RAIL)>=3, f2(cr(railA,RAIL)));
  ck(pal+': rail chip ink ≥4.5:1 on its tint', cr(chipInk,chip)>=4.5, f2(cr(chipInk,chip)));
  ck(pal+': link/500 ≥4.5:1 on white', cr(p500,WHITE)>=4.5, f2(cr(p500,WHITE)));
  ck(pal+': white on the 500 button fill ≥4.5:1', cr(WHITE,p500)>=4.5, f2(cr(WHITE,p500)));
  // the two gauge segments must be separable from each other, not just legible
  ck(pal+': gauge Required vs Elective ≥1.6:1', cr(p500,s500)>=1.6, f2(cr(p500,s500)));
  ck(pal+': Elective ≥3:1 on white (it is a bar, not text)', cr(s500,WHITE)>=3, f2(cr(s500,WHITE)));
  // dark
  const dsel=':root[data-theme="dark"][data-palette="'+pal+'"]{';
  const d500=tok(dsel,'primary-500'), dOn=tok(dsel,'on-primary'), ds500=tok(dsel,'slate-500');
  ck(pal+' dark: 500 ≥4.5:1 on the dark card', cr(d500,CARD_D)>=4.5, f2(cr(d500,CARD_D)));
  ck(pal+' dark: --on-primary ≥4.5:1 on the 500 fill', cr(dOn,d500)>=4.5, f2(cr(dOn,d500)));
  ck(pal+' dark: gauge segments still separable', cr(d500,ds500)>=1.6, f2(cr(d500,ds500)));
}

// The regression guard. #c75159 was the old rail accent and it only just
// cleared 3:1; #a81c24 was the old primary and measured 2.05:1 there. If a
// future palette reaches for either on the rail, these say why not.
ck('guard: old XCEL red still fails on the rail (2.05:1)', cr('#a81c24',RAIL)<3, f2(cr('#a81c24',RAIL)));
ck('guard: #c75159 is still the marginal stop it was', cr('#c75159',RAIL)<3.5, f2(cr('#c75159',RAIL)));

// switcher behaviour
ck('palette switcher offers exactly the 3 candidates', all('.palbtn').length===3);
ck('navy is the default', D.documentElement.getAttribute('data-palette')==='navy');
click('.palbtn[data-pal="teal"]');
ck('switching sets data-palette', D.documentElement.getAttribute('data-palette')==='teal');
ck('switching moves aria-checked', q('.palbtn[data-pal="teal"]').getAttribute('aria-checked')==='true'
   && q('.palbtn[data-pal="navy"]').getAttribute('aria-checked')==='false');
click('.palbtn[data-pal="navy"]');
ck('switches back', D.documentElement.getAttribute('data-palette')==='navy');

// the hero gradient is gone — the thing that was actually asked for
ck('hero has no gradient', !/\.hero\{[^}]*linear-gradient/.test(css));
ck('hero sits on the card surface', /\.hero\{background:var\(--card\)/.test(css));
ck('no red-tint hero override survives', !/data-theme="dark"\]\s*\.hero\{/.test(css));

/* ============================================================
   THE EDITORIAL STYLE AXIS

   data-style is a third axis beside data-theme and data-palette. These
   checks guard the three claims that a later edit could undo silently:
     1. classic is untouched — it is still the default and still renders
        cards, so every assertion above keeps testing what it thinks it does;
     2. the editorial dashboard uses NO --brand-* except the Rubi badge,
        which is the whole point of the style and is one careless
        `color:var(--brand-500)` away from being false;
     3. the ring means hours complete, NOT a probability of passing — the
        reference states a probability and the walk-through deliberately
        answers with a frequency instead.
   ============================================================ */
ck('classic is the default style', D.documentElement.getAttribute('data-style')==='classic');
ck('the editorial token block exists', /:root\[data-style="editorial"\]\{/.test(css));
ck('editorial has a dark pair', /:root\[data-theme="dark"\]\[data-style="editorial"\]\{/.test(css));
// the editorial block must come AFTER :root[data-theme="dark"]{ — same
// specificity, so source order is the only thing deciding the neutrals
ck('editorial block is declared after the dark block (same specificity)',
   css.indexOf(':root[data-style="editorial"]{') > css.indexOf(':root[data-theme="dark"]{'));
// the wordmark's face does not move with the style axis
ck('the lockup is pinned to --font-brand', /\.lock \.w\{font-family:var\(--font-brand\)/.test(css));
ck('--font-brand is never restyled', !/\[data-style[^{]*\{[^}]*--font-brand:/.test(css));

// the robot menu — closed at rest, opens on click, reveals Switch Account
ck('robot trigger is present', !!q('#phAdminToolsTrigger'));
ck('menu is closed at rest', !q('#phAdminMenu').classList.contains('ph-admin-menu--open')
   && q('#phAdminToolsTrigger').getAttribute('aria-expanded')==='false');
click('#phAdminToolsTrigger');
ck('robot opens the menu', q('#phAdminMenu').classList.contains('ph-admin-menu--open')
   && q('#phAdminToolsTrigger').getAttribute('aria-expanded')==='true');
ck('panel is shut before a row is picked', q('#phAdminPanel').getAttribute('aria-hidden')==='true');
click('[data-admin-action="switch-account"]');
ck('Switch Account opens the panel', q('#phAdminPanel').getAttribute('aria-hidden')==='false');
ck('panel offers exactly two versions', all('.ph-version-option').length===2,
   all('.ph-version-option').length+'');
ck('classic reads as the checked one', q('.ph-version-option[data-version="classic"]')
   .getAttribute('aria-checked')==='true');

// switch to editorial
click('.ph-version-option[data-version="editorial"]');
ck('picking editorial sets data-style', D.documentElement.getAttribute('data-style')==='editorial');
ck('aria-checked moves with it', q('.ph-version-option[data-version="editorial"]')
   .getAttribute('aria-checked')==='true'
   && q('.ph-version-option[data-version="classic"]').getAttribute('aria-checked')==='false');

// the reduction actually happened
ck('editorial renders the three sections', all('#body .ed-sec').length===3,
   all('#body .ed-sec').length+' sections');
ck('editorial drops the cards', all('#body .card').length===0, all('#body .card').length+' cards left');
ck('editorial drops the recommended shelf', all('#body .shelf').length===0);
ck('editorial drops the stat tiles', all('#body .stat').length===0);
ck('one promoted band, not several', all('#body .ed-band').length===1);
// the ring keeps BOTH data series — a track plus two arcs
ck('the ring still has two series over a track', all('#body .ed-ring svg circle').length===3,
   all('#body .ed-ring svg circle').length+' circles');
ck('the ring is labelled complete, not ready', /COMPLETE/.test(q('#body .ed-ring svg').textContent));
/* Read PRODUCT copy only — the provenance note is commentary about this very
   decision and says the word "probability" on purpose, so including it here
   would make the assertion permanently red. */
const prodCopy=()=>{
  const c=q('#body').cloneNode(true);
  c.querySelectorAll('.provnote').forEach(n=>n.remove());
  return (c.textContent||'').replace(/\s+/g,' ').trim();
};
ck('no probability-of-passing claim in product copy',
   !/chance of passing|probability|likely to pass|odds of/i.test(prodCopy()));
ck('the provenance note is where that decision is recorded',
   /not a probability of passing/i.test(B()));

// NO RED. The Rubi badge is the only element allowed to carry --brand-*.
const edBody=q('#body').innerHTML;
const brandHits=(edBody.match(/--brand-\d00/g)||[]).length;
ck('editorial body references --brand-* at most once (the Rubi mark)', brandHits<=1, brandHits+' hits');
ck('the Rubi mark is present and is that one use', !!q('#body .ed-rubi__mark'));
ck('the Rubi rule itself is NOT red', /\.ed-rubi\{border-left:3px solid var\(--line-2\)/.test(css));
ck('the exam row carries no red', !/ed-row exam[^>]*brand/.test(edBody));
ck('the exam is carried by words instead', /Licensing exam/.test(B())&&/not a course task/i.test(B()));
ck('editorial sends the wordmark X to ink',
   /\[data-style="editorial"\] \.lock \.w i\{color:var\(--ink\)\}/.test(css));
ck('editorial neutralises both avatars', /\[data-style="editorial"\] \.avatar/.test(css));

// state still drives it, and the exam states still reach the row
click('[data-prog="at-risk"]');
ck('editorial at-risk shows the hairline note', !!q('#body .ed-note')&&/behind your plan/i.test(B()));
ck('editorial at-risk note is a rule, not a filled box', !/warnband/.test(q('#body').innerHTML));
click('[data-prog="complete"]');
ck('editorial complete says requirements met', /requirements met/i.test(B()));
click('[data-prog="not-started"]');
ck('editorial not-started begins chapter 1', /Begin Chapter 1/.test(B()));
click('[data-prog="on-track"]');
ck('editorial on-track has a washed in-progress row', all('#body .ed-row.on').length>=1);
/* The band and the list must agree about the current chapter. They did not:
   the band inherited classic's hardcoded "58% through" while the list derived
   40% from hours, so one screen showed two figures for one chapter. Both now
   read edReqWalk(). This asserts the agreement, not the numbers. */
{
  const bandTxt=T('#body .ed-band');
  const onRow=q('#body .ed-row.on');
  const rowPct=(T('#body .ed-row.on .ed-row__s').match(/(\d+)%/)||[])[1];
  const bandPct=(bandTxt.match(/(\d+)% through/)||[])[1];
  ck('band and list agree on the current chapter %', !!rowPct && rowPct===bandPct,
     'band '+bandPct+'% vs row '+rowPct+'%');
  const rowName=T('#body .ed-row.on .ed-row__n');
  ck('band names the same chapter the list has in progress',
     bandTxt.indexOf(rowName)>-1, rowName);
  ck('Rubi points at that same chapter',
     T('#body .ed-rubi').indexOf(rowName)>-1, T('#body .ed-rubi h3'));
  ck('the washed row is the only in-progress one', all('#body .ed-row.on').length===1);
  ck('the track width matches the stated %',
     (q('#body .ed-row.on .ed-track i').getAttribute('style')||'').indexOf(rowPct+'%')>-1);
}
click('[data-exam="none"]');
ck('editorial unbooked exam asks for the date', /Not booked yet/.test(B())&&/Add the date/.test(B()));
click('[data-exam="awaiting"]');
ck('editorial awaiting asks to record', /awaiting result/i.test(B())&&/Record result/.test(B()));
click('[data-exam="scheduled"]');

// and classic comes back intact
click('.ph-version-option[data-version="classic"]');
ck('switching back restores classic', D.documentElement.getAttribute('data-style')==='classic');
ck('classic cards are back', all('#body .card').length>=3, all('#body .card').length+' cards');
ck('classic gets its shelf back', all('#body .shelf').length===1);

/* The editorial ramp, swept the same way the palettes are. The warm ground
   is LIGHTER than the cool one (#faf8f5 vs #f4f4f6), which is why the
   reference's green/ochre status bars are not reproduced: --success-500 fell
   to 4.27:1 as a label and --warning-500 to 1.71:1 as a bar. Status is
   carried by label text and the row wash instead, and every bar is a single
   primary fill on the taupe track. */
const ed=(name)=>tok(':root[data-style="editorial"]{',name);
const edDark=(name)=>tok(':root[data-theme="dark"][data-style="editorial"]{',name);
const EDPAGE=ed('page'), EDBAND=ed('ed-band'), EDWASH=ed('ed-wash'), EDN200=ed('n-200');
ck('editorial declares its own ground and two surfaces', !!(EDPAGE&&EDBAND&&EDWASH));
ck('editorial ink-3 ≥4.5:1 on the warm page (eyebrows)', cr(ed('ink-3'),EDPAGE)>=4.5, f2(cr(ed('ink-3'),EDPAGE)));
ck('editorial ink-3 ≥4.5:1 on the band', cr(ed('ink-3'),EDBAND)>=4.5, f2(cr(ed('ink-3'),EDBAND)));
ck('editorial ink-3 ≥4.5:1 on the warm wash', cr(ed('ink-3'),EDWASH)>=4.5, f2(cr(ed('ink-3'),EDWASH)));
ck('editorial ink-2 ≥4.5:1 on the band', cr(ed('ink-2'),EDBAND)>=4.5, f2(cr(ed('ink-2'),EDBAND)));
const EDD_PAGE=edDark('page'), EDD_BAND=edDark('ed-band'), EDD_WASH=edDark('ed-wash');
ck('editorial dark ink-3 ≥4.5:1 on the dark band', cr(edDark('ink-3'),EDD_BAND)>=4.5,
   f2(cr(edDark('ink-3'),EDD_BAND)));
ck('editorial dark ink-3 ≥4.5:1 on the dark page', cr(edDark('ink-3'),EDD_PAGE)>=4.5,
   f2(cr(edDark('ink-3'),EDD_PAGE)));
// guard: the light ramp's own step fails on the dark band, which is WHY
// dark --ink-3 is a lighter stop than the light ramp would suggest
ck('guard: #918a80 still fails on the dark band (4.22:1)', cr('#918a80',EDD_BAND)<4.5,
   f2(cr('#918a80',EDD_BAND)));
// guard: the two bars the reference used cannot come back as-is
ck('guard: success-500 still fails as a label on the warm page', cr('#018937',EDPAGE)<4.5,
   f2(cr('#018937',EDPAGE)));
ck('guard: warning-500 still fails as a bar on the warm page', cr('#f9b428',EDPAGE)<3,
   f2(cr('#f9b428',EDPAGE)));
// every palette has to work on the warm ground and against the taupe track
for(const pal of PALS){
  const p500=tok(':root[data-palette="'+pal+'"]{','primary-500');
  const s500=tok(':root[data-palette="'+pal+'"]{','slate-500');
  ck('editorial '+pal+': primary ≥4.5:1 on the warm page', cr(p500,EDPAGE)>=4.5, f2(cr(p500,EDPAGE)));
  ck('editorial '+pal+': primary ≥4.5:1 on the band', cr(p500,EDBAND)>=4.5, f2(cr(p500,EDBAND)));
  ck('editorial '+pal+': primary ≥4.5:1 on the wash', cr(p500,EDWASH)>=4.5, f2(cr(p500,EDWASH)));
  ck('editorial '+pal+': bar fill ≥3:1 on the taupe track', cr(p500,EDN200)>=3, f2(cr(p500,EDN200)));
  ck('editorial '+pal+': ring segments still ≥1.6:1 apart', cr(p500,s500)>=1.6, f2(cr(p500,s500)));
}
// the Rubi badge is the one red, so it has to hold its own glyph
ck('Rubi badge: white glyph ≥4.5:1 on the brand fill', cr(WHITE,BRAND)>=4.5, f2(cr(WHITE,BRAND)));
ck('Rubi badge: reads as a shape on the warm page', cr(BRAND,EDPAGE)>=3, f2(cr(BRAND,EDPAGE)));

/* ============================================================
   THE LIGHT RAIL

   The near-black rail was the heaviest thing on the page and the reason the
   first editorial pass still did not read as light. Three claims to guard:
     1. classic's rail is UNCHANGED — its three colours were hardcoded #fff
        and rgba(255,255,255,…) in four places and are now tokens, so the
        defaults must still be exactly those values;
     2. the editorial rail is legible at every palette × theme;
     3. selection does not rest on the pill fill, which is only 1.29:1.
   ============================================================ */
ck('classic --rail-ink is still white', tok(':root{','rail-ink')==='#ffffff',
   String(tok(':root{','rail-ink')));
ck('classic --rail-active is still the 10% white wash',
   /--rail-active:rgba\(255,255,255,\.1\)/.test(css));
ck('classic --rail-hover is still the 7% white wash',
   /--rail-hover:rgba\(255,255,255,\.07\)/.test(css));
ck('no hardcoded #fff left in the rail rules',
   !/\.rprof \.nm\{color:#fff/.test(css) && !/\.ritem:hover\{background:rgba\(255,255,255/.test(css));
ck('the rail is still near-black in classic', tok(':root{','rail')==='#26262b',
   String(tok(':root{','rail')));

const edRail=ed('rail'), edRailInk=ed('rail-ink'), edRailTxt=ed('rail-txt'),
      edRailMuted=ed('rail-muted'), edPill=ed('rail-active'), edHover=ed('rail-hover');
ck('editorial declares its own rail set',
   !!(edRail&&edRailInk&&edRailTxt&&edRailMuted&&edPill&&edHover));
ck('editorial rail is light, not near-black', lum(edRail)>0.8, 'lum '+lum(edRail).toFixed(2));
ck('editorial rail-txt ≥4.5:1 on the light rail', cr(edRailTxt,edRail)>=4.5, f2(cr(edRailTxt,edRail)));
ck('editorial rail-muted ≥4.5:1 on the light rail', cr(edRailMuted,edRail)>=4.5,
   f2(cr(edRailMuted,edRail)));
ck('editorial rail-ink ≥4.5:1 on the light rail', cr(edRailInk,edRail)>=4.5, f2(cr(edRailInk,edRail)));
ck('editorial rail-ink ≥4.5:1 on the active pill', cr(edRailInk,edPill)>=4.5, f2(cr(edRailInk,edPill)));
ck('editorial rail-txt ≥4.5:1 on the active pill', cr(edRailTxt,edPill)>=4.5, f2(cr(edRailTxt,edPill)));
// the pill has to be SEEN, but it is a tint and not the only cue
ck('active pill is visible against the rail (≥1.25:1)', cr(edPill,edRail)>=1.25, f2(cr(edPill,edRail)));
ck('hover tint is visible against the rail', cr(edHover,edRail)>=1.15, f2(cr(edHover,edRail)));
/* guard: the --ed-band tint is what this WANTED to be and it measured
   1.13:1 — a cool tint at the warm ground's lightness differs in hue, not
   luminance, and hue alone cannot say "selected". */
ck('guard: the band tint still fails as the active pill', cr(EDBAND,edRail)<1.25,
   f2(cr(EDBAND,edRail)));
ck('selection also carries weight, not just fill',
   /\[data-style="editorial"\] \.ritem\[aria-current="page"\]\{font-weight:700\}/.test(css));
// --rail-accent must NOT be repointed: it serves focus rings on the DARK
// prototype bar, where a navy primary would measure ~1.5:1
ck('editorial does not repoint --rail-accent', !/\[data-style="editorial"\]\{[^}]*--rail-accent:/.test(css));
for(const pal of PALS){
  const railA=tok(':root[data-palette="'+pal+'"]{','rail-accent');
  ck('editorial '+pal+': pbar focus ring still works on the dark bar',
     cr(railA,'#1a1a1d')>=3, f2(cr(railA,'#1a1a1d')));
  const p500=tok(':root[data-palette="'+pal+'"]{','primary-500');
  ck('editorial '+pal+': rail focus ring ≥3:1 on the light rail',
     cr(p500,edRail)>=3, f2(cr(p500,edRail)));
  const p100=tok(':root[data-palette="'+pal+'"]{','primary-100');
  const p700=tok(':root[data-palette="'+pal+'"]{','primary-700');
  ck('editorial '+pal+': nav badge ink ≥4.5:1 on its tint', cr(p700,p100)>=4.5, f2(cr(p700,p100)));
}
// dark editorial keeps a dark rail — same design, not an inversion
const dRail=edDark('rail'), dPill=edDark('rail-active');
ck('dark editorial rail is dark', lum(dRail)<0.1, 'lum '+lum(dRail).toFixed(3));
ck('dark editorial rail-txt ≥4.5:1', cr(edDark('rail-txt'),dRail)>=4.5, f2(cr(edDark('rail-txt'),dRail)));
ck('dark editorial rail-muted ≥4.5:1', cr(edDark('rail-muted'),dRail)>=4.5,
   f2(cr(edDark('rail-muted'),dRail)));
ck('dark editorial rail-ink ≥4.5:1 on its pill', cr(edDark('rail-ink'),dPill)>=4.5,
   f2(cr(edDark('rail-ink'),dPill)));
ck('dark editorial pill is visible', cr(dPill,dRail)>=1.15, f2(cr(dPill,dRail)));
// the nav badge was a red tint, and red is spent
ck('the nav badge is no longer red in editorial',
   /\[data-style="editorial"\] \.ritem \.badge\{background:var\(--primary-100\)/.test(css));
ck('the red badge tint survives in classic only', /\.badge\{[^}]*#ebb2b6/.test(css));
// the rail keeps working as a nav after the reshape
click('.ph-version-option[data-version="editorial"]');
ck('editorial rail still routes', all('#rail [data-sec]').length===7,
   all('#rail [data-sec]').length+' items');
click('#rail [data-sec="calendar"]');
ck('editorial rail marks the current section',
   q('#rail [data-sec="calendar"]').getAttribute('aria-current')==='page');
ck('a non-home section still renders in editorial', B().length>200);
click('#rail [data-sec="dashboard"]');
ck('and back to the editorial home', all('#body .ed-sec').length===3);
click('.ph-version-option[data-version="classic"]');

console.log(log.join('\n'));
console.log('\nJS errors: '+(errs.length?errs.join('\n'):'none'));
const f=log.filter(l=>l.startsWith('FAIL')).length;
console.log(f?'\n'+f+' FAILING of '+log.length:'\nAll '+log.length+' checks pass');
dom.window.close(); process.exit(f?1:0);
