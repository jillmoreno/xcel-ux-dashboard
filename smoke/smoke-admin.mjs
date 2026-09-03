import fs from 'fs';
import { JSDOM, VirtualConsole } from 'jsdom';
const html=fs.readFileSync(new URL('../public/prototypes/xcel-lms-admin.html',import.meta.url),'utf8');
const errs=[]; const vc=new VirtualConsole().on('jsdomError',e=>errs.push(e.message));
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc});
const {window}=dom,D=window.document;
window.addEventListener('error',e=>errs.push(e.message));
const q=s=>D.querySelector(s), all=s=>[...D.querySelectorAll(s)];
const T=s=>(q(s)?.textContent||'').replace(/\s+/g,' ').trim();
const click=(s,l)=>{const el=typeof s==='string'?q(s):s; if(!el) throw new Error('missing '+(l||s));
  el.dispatchEvent(new window.MouseEvent('click',{bubbles:true}));};
const log=[],ck=(n,c,x='')=>log.push((c?'PASS':'FAIL')+'  '+n+(x?'  — '+x:''));
const names=()=>all('#rs-table tbody .nm').map(e=>e.textContent);

// ---- roster: three views over ONE table
ck('roster renders', all('#rs-table tbody tr').length>0, all('#rs-table tbody tr').length+' rows');
ck('default view is Who is stuck', q('[data-v="stuck"]').getAttribute('aria-pressed')==='true');
const stuck=names();
ck('stuck excludes Compliant', !/Alicia Ferrer|Kirsten Vogel|Hana Kobayashi/.test(stuck.join('|')), stuck.length+' rows');
ck('stuck sorted soonest-deadline first', /Andre Boateng|Chen Wei/.test(stuck[0]), stuck[0]);

click('[data-v="follow"]');
const follow=names();
ck('follow-up scopes to one cohort', follow.length===6, follow.length+' rows');
ck('follow-up sorted by longest idle', follow[0]==='Danny O’Sullivan', follow[0]);

click('[data-v="seats"]');
const seats=names();
ck('seats shows only agency-paid', !seats.some(n=>/Rosa|Kirsten|Sofia|Hana/.test(n)), seats.length+' rows');
ck('seats roll-up shows spend', /Spend/.test(T('#rs-rollup'))&&/\$1,890/.test(T('#rs-rollup')));
ck('spend is a roll-up, NOT a column', !/Spend/.test(T('#rs-table thead')));
ck('roll-up counts idle + unclaimed', /Unclaimed/.test(T('#rs-rollup'))&&/Idle/.test(T('#rs-rollup')));
ck('other views show no roll-up', (click('[data-v="stuck"]'), T('#rs-rollup')===''));

// same rows, different question — a learner present in two views
click('[data-v="seats"]');
ck('SAME row appears across views', names().includes('Maria Delgado')
  && (click('[data-v="follow"]'), names().includes('Maria Delgado')), 'Maria in seats + follow-up');

// ---- who paid is a column, not a mode
click('[data-v="stuck"]');
ck('Paid by is a column', /PAID BY/i.test(T('#rs-table thead')));
ck('Seat is a column', /SEAT/i.test(T('#rs-table thead')));
const selfRow=all('#rs-table tbody tr').find(r=>/Rosa|Sofia|Kirsten|Hana/.test(r.textContent));
ck('self-paid seat cell is blank, not n/a',
  !selfRow || !/n\/a|—|-/.test(selfRow.querySelectorAll('td')[7].textContent.trim()),
  selfRow?`"${selfRow.querySelectorAll('td')[7].textContent.trim()}"`:'no self row in view');

// ---- badges are the five PartnerHub ones
const badges=new Set(all('#rs-table tbody .badge').map(b=>b.textContent).filter(t=>!/Claimed|Unclaimed|Idle/.test(t)));
ck('badges come from the five', [...badges].every(b=>['Compliant','On Track','At Risk','Overdue','Not Started'].includes(b)),
  [...badges].join(', '));

// ---- sorting
click('[data-s="name"]');
ck('name sort ascending', names()[0] < names()[1], names()[0]+' → '+names()[1]);
click('[data-s="name"]');
ck('name sort toggles', q('[data-s="name"]').getAttribute('aria-sort')==='descending');

// ---- status chips
click('[data-f="Overdue"]');
ck('status chip filters', all('#rs-table tbody tr').every(r=>/Overdue/.test(r.textContent)));
click('[data-f="all"]');

// ---- bulk + side panel
const cb=q('#rs-table [data-c]');
cb.dispatchEvent(new window.MouseEvent('click',{bubbles:true}));
ck('checkbox toggles on', cb.checked===true);
ck('bulk bar appears', /selected/.test(T('#rs-bulk')), T('#rs-bulk'));
ck('bulk action is view-specific', /Remind/.test(T('#rs-bulk')));
click('[data-b="clear"]');
ck('bulk clears', T('#rs-bulk')==='');
click('#rs-table tbody tr');
ck('row opens side panel', /Send reminder/.test(T('#rs-sheet')));
ck('panel shows Paid by', /Paid by/.test(T('#rs-sheet')));
click('[data-b="close"]');
ck('panel closes to its empty state', /Detail panel/.test(T('#rs-sheet')));

// ---- hierarchy: drill, don't unfold
ck('org starts at root', /Meridian/.test(T('#org-crumb')));
ck('root crumb is disabled at root', q('#org-crumb button').disabled);
ck('root shows regions not agencies', /Southwest Region/.test(T('#org-list'))&&!/Austin Agency/.test(T('#org-list')));
// A parent row shows the SUM of its children (Southwest = Austin 14 + San Antonio 8 = 22),
// never its own count and never a grand total — that is what "roll-up" has to mean here.
ck('parent row shows its children summed', /Southwest Region[^0-9]*2 agencies[^0-9]*\d+ at risk\s*22/.test(T('#org-list')),
  (T('#org-list').match(/Southwest Region.{0,60}/)||[''])[0]);
click('[data-go="sw"]');
ck('drilled one level', /Austin Agency/.test(T('#org-list'))&&/San Antonio/.test(T('#org-list')));
ck('breadcrumb grew', all('#org-crumb button').length===2);
ck('cannot go above root', !/›[^›]*Meridian/.test(T('#org-crumb').replace('Your root','')));
click('[data-go="austin"]');
ck('leaf hands off to roster', /Open this agency/.test(T('#org-list')));
ck('leaf states no agencies beneath', /no agencies beneath/.test(T('#org-list')));
click('#org-crumb [data-d="0"]');
ck('breadcrumb navigates back', /Southwest Region/.test(T('#org-list')));

// ---- as-of
const before=T('#org-list');
ck('basis line states today', /as of 1 September 2026/.test(T('#org-basis')));
click('[data-a="jul"]');
ck('as-of changes the numbers', T('#org-list')!==before);
ck('as-of states what changed', /had not been created/.test(T('#org-basis')));
click('[data-a="today"]');

// ---- doc chrome
ck('four hatched holes', all('.nd').length===3, all('.nd').length+' (3 expected)');
const len=T('#doc').length;
click('#m-build');
ck('build mode keeps all content', T('#doc').length===len);
ck('build mode reorders', q('section[data-build="2"]').style.order==='2');

console.log(log.join('\n'));
console.log('\nJS errors: '+(errs.length?errs.join('\n'):'none'));
const f=log.filter(l=>l.startsWith('FAIL')).length;
console.log(f?`\n${f} FAILING of ${log.length}`:`\nAll ${log.length} checks pass`);
dom.window.close(); process.exit(f?1:0);
