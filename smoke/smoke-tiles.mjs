import fs from 'fs';
import { JSDOM, VirtualConsole } from 'jsdom';
const log=[],ck=(n,c,x='')=>log.push((c?'PASS':'FAIL')+'  '+n+(x?'  — '+x:''));

// 1. sectionOf logic replicated from UxDashboardPage
const src=fs.readFileSync(new URL('../src/data/prototypeFeatures.ts',import.meta.url),'utf8');
// This repo builds externalUrl from PROTOTYPE_BASE; read it so the template
// literal below can be resolved to a real path.
const BASE=(src.match(/const PROTOTYPE_BASE\s*=\s*'([^']+)'/)||[])[1]||'/prototypes';
const ids=['xcel-lms','xcel-walkthrough','xcel-wireframes','xcel-admin','xcel-admin-tool','xcel-exam-spec'];
for(const id of ids){
  const i=src.indexOf(`id: '${id}'`);
  const block=src.slice(i, src.indexOf('\n  },', i));
  const done=/done:\s*true/.test(block);
  const ds=(block.match(/devStatus:\s*'([^']+)'/)||[])[1];
  const cat=(block.match(/category:\s*'([^']+)'/)||[])[1];
  let section;
  if(done) section='done';
  else if(ds) section=(ds==='ready-for-dev'||ds==='in-development'||ds==='blocked')?'development':'design';
  else if(cat==='demo'||cat==='dashboard') section='demo';
  else if(cat==='testing') section='development';
  else if(cat==='exploration') section='exploration';
  else if(cat==='sandbox') section='sandbox';
  else section='design';
  ck(`${id} → Exploration`, section==='exploration', section);
  const raw=(block.match(/externalUrl:\s*['`]([^'`]+)['`]/)||[])[1]||'';
  const url=raw.replace('${PROTOTYPE_BASE}', BASE);
  ck(`${id} target exists`, fs.existsSync(new URL('../public'+url,import.meta.url)), url);
}
ck('desktop row is pinned', /id: 'xcel-lms'[\s\S]{0,1400}?pinned: true/.test(src));

// 2. spec viewer renders the real .md
const md=fs.readFileSync(new URL('../public/prototypes/xcel-lms-exam-task-type-spec.md',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../public/prototypes/xcel-lms-exam-spec.html',import.meta.url),'utf8');
const vc=new VirtualConsole();
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,
  url:'https://x.test/prototypes/xcel-lms-exam-spec.html'});
dom.window.fetch=(u)=>Promise.resolve({ok:true,status:200,text:()=>Promise.resolve(md)});
// re-run the module now fetch is stubbed
const s=dom.window.document.querySelector('script:not([src])').textContent;
dom.window.eval(s);
await new Promise(r=>setTimeout(r,120));
const D=dom.window.document, doc=D.getElementById('doc');
const t=doc.textContent.replace(/\s+/g,' ');
ck('spec renders headings', doc.querySelectorAll('h2').length>=10, doc.querySelectorAll('h2').length+' h2');
ck('spec renders tables', doc.querySelectorAll('table').length>=3, doc.querySelectorAll('table').length+' tables');
ck('spec renders the code block', doc.querySelectorAll('pre code').length>=1);
ck('spec renders the blockquote rule', doc.querySelectorAll('blockquote').length>=1);
ck('spec carries the naming collision', /kind: 'exam'/.test(doc.textContent)||/exam. is already taken/i.test(t));
ck('spec carries the open questions', /flag, do not resolve/i.test(t));
ck('spec has sibling links', /Desktop platform/.test(D.querySelector('.pbar').textContent));
ck('no raw markdown leaked', !/\|---/.test(t) && !/^\s*## /m.test(t));
dom.window.close();

console.log(log.join('\n'));
const f=log.filter(l=>l.startsWith('FAIL')).length;
console.log(f?`\n${f} FAILING of ${log.length}`:`\nAll ${log.length} checks pass`);
process.exit(f?1:0);
