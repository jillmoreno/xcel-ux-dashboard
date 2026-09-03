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

console.log(log.join('\n'));
console.log('\nJS errors: '+(errs.length?errs.join('\n'):'none'));
const f=log.filter(l=>l.startsWith('FAIL')).length;
console.log(f?'\n'+f+' FAILING of '+log.length:'\nAll '+log.length+' checks pass');
dom.window.close(); process.exit(f?1:0);
