import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const base=path.resolve(import.meta.dirname,'..');
const c=JSON.parse(fs.readFileSync(path.join(base,'dist/catalog.json'),'utf8'));
const require=createRequire(import.meta.url);
const katex=require('../dist/vendor/katex/katex.min.js');
const ids=new Set(), urls=new Set(), topicIds=new Set(c.topics.map(t=>t.id)), bookIds=new Set(c.books.map(b=>b.id)), subjectIds=new Set(c.subjects.map(s=>s.id));
let equations=0;
const render=(tex)=>{assert(tex?.length);const out=katex.renderToString(tex,{throwOnError:true,trust:false});assert(out.includes('katex'));equations++;};
for(const r of c.resources){
 assert(!ids.has(r.id),`Duplicate resource ${r.id}`);ids.add(r.id);
 assert(!urls.has(r.url),`Duplicate simulation URL: ${r.url}`);urls.add(r.url);
 for(const key of ['title','originalName','source','descriptionUrl','url','backupUrl','question','prerequisites','depth','format','language','controls','guide','reading','symbols'])assert(typeof r[key]==='string'&&r[key].trim(),`${r.id}: ${key}`);
 assert(r.kind===undefined||['external','local'].includes(r.kind),`${r.id}: unknown resource kind`);
 if(r.kind==='local'){
  assert.equal(r.url,'#/resource/'+r.id);assert(r.module?.trim());
  for(const key of ['url','descriptionUrl','backupUrl'])assert(/^#\/(resource\/[a-z0-9-]+|resources)(\?.*)?$/.test(r[key]),`${r.id}: invalid local entry`);
  assert(r.localAssets?.length);for(const asset of r.localAssets){const file=path.resolve(base,'dist',asset);assert(file.startsWith(path.join(base,'dist')+path.sep));assert(fs.existsSync(file),`${r.id}: missing ${asset}`);}
 }else{for(const key of ['url','descriptionUrl','backupUrl'])assert.equal(new URL(r[key]).protocol,'https:');}
 assert(r.subjects?.length>0);r.subjects.forEach(s=>assert(subjectIds.has(s),`${r.id}: unknown subject ${s}`));
 assert(r.topics.length>0);r.topics.forEach(t=>assert(topicIds.has(t),`${r.id}: unknown topic ${t}`));
 assert.equal(r.steps.length,3,`${r.id}: must have 3 tasks`);
 for(const st of r.steps)for(const key of ['title','action','observe','evidence'])assert(st[key]?.trim(),`${r.id}: task ${key}`);
 for(const key of ['question','answer'])assert(r.think[key]?.trim());
 assert(r.cautions.length>0);assert(r.verification.read===true);
 assert(['tested','partial','docs'].includes(r.verification.interaction));
 for(const key of ['date','environment','availability','mobile','mainland','note'])assert(r.verification[key]?.trim());
 const o=r.operation;assert(o,`${r.id}: missing operation card`);
 for(const key of ['reviewedAt','entry','restart','restoreDefault','testedRange','evidenceNote'])assert(o[key]?.trim(),`${r.id}: operation ${key}`);
 assert(o.startingState.length>=2);o.startingState.forEach(v=>assert(v.trim()));
 assert(o.controls.length>=3);for(const ctrl of o.controls)for(const key of ['name','meaning','usage','evidence'])assert(ctrl[key]?.trim());
 assert(o.troubleshooting.length>=2);o.troubleshooting.forEach(t=>assert(t.symptom?.trim()&&t.action?.trim()));
 if(o.guideSource)assert.equal(new URL(o.guideSource).protocol,'https:');
 r.mappings.forEach(m=>assert(bookIds.has(m.source)));
 render(r.formula);if(r.think.formula)render(r.think.formula);
}
assert.equal(subjectIds.size,c.subjects.length);
for(const s of c.subjects)assert(s.name?.trim()&&s.aliases.length);
assert.equal(topicIds.size,c.topics.length);assert.equal(bookIds.size,c.books.length);
for(const t of c.topics)assert(['method','application'].includes(t.kind)&&t.aliases.length);
assert(c.books.find(b=>b.id==='wu3'));assert(c.resources.every(r=>r.mappings.every(m=>m.source!=='wu3')),'Do not invent unverified Wu chapter mappings');
const html=fs.readFileSync(path.join(base,'dist/index.html'),'utf8');
for(const m of html.matchAll(/(?:src|href)="([^"#]+)"/g)){if(!m[1].startsWith('http'))assert(fs.existsSync(path.join(base,'dist',m[1].split('?')[0])),`Missing asset ${m[1]}`);}
assert(html.includes('lang="zh-CN"'));assert(html.includes('name="viewport"'));
console.log(`PASS: ${ids.size} unique resources and operation cards, ${c.subjects.length} subjects, ${equations} formulas; fields, references, local assets and source URL syntax valid.`);
