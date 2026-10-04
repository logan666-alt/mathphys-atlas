const test=require('node:test');
const assert=require('node:assert/strict');
const M=require('../dist/lab/physics.js'),S=require('../dist/lab/state.js'),Q=require('../dist/lab/inquiries.js'),C=require('../dist/compare.js');
const catalog=require('../dist/catalog.json');
const katex=require('../dist/vendor/katex/katex.min.js');
const near=(a,b,tolerance=1e-9)=>assert(Math.abs(a-b)<=tolerance,`${a} != ${b}`);

test('Experiment links round trip coefficients, exact paused time, controls and view choices',()=>{
  const states=[M.initial(),{...M.initial(),a:[-1,.4,-.33,0,.123456789,1],c:2,D:.005,t:7.123456789,n:6,x:0,showInitial:false,showMode:true,speed:.25},{...M.initial(),a:[...M.presets.pluck],c:.25,D:.12,t:12,x:1,speed:2}];
  for(const s of states){const hash=S.hash(s),parsed=new URLSearchParams(hash.split('?')[1]);const restored=S.decode(parsed.get('s'));assert.deepEqual(restored,s);assert.deepEqual(M.frame(restored),M.frame(s));}
});
test('Malformed, unsupported and out-of-range snapshots are rejected as a whole',()=>{
  for(const bad of ['', 'null','{}','[1]','<script>alert(1)</script>','x'.repeat(2049)])assert.equal(S.decode(bad),null);
  const valid=JSON.parse(S.encode(M.initial()));
  for(const [i,v] of [[0,2],[1,1.01],[2,'0'],[7,0],[7,2.1],[8,-1],[8,0],[9,13],[9,-1],[10,1.5],[10,7],[11,1.1],[12,true],[13,3],[14,4]]){const a=[...valid];a[i]=v;assert.equal(S.decode(JSON.stringify(a)),null,`index ${i}: ${v}`);}
  assert.throws(()=>S.encode({...M.initial(),c:Infinity}));
});
test('Displayed kinetic and potential energy agree with independent space/time differences',()=>{
  const s={...M.initial(),a:[.7,-.3,.21,.08,-.12,.04],c:1.35,D:.025};
  const value=(x,t)=>M.field(M.amplitudes({...s,t}).wave,x),h=1e-5,N=1800;
  for(const t of [0,.17,.5,1.41]){
    let kinetic=0,potential=0;
    for(let j=0;j<N;j++){const x=(j+.5)/N,ut=(value(x,t+h)-value(x,t-h))/(2*h),ux=(value(x+h,t)-value(x-h,t))/(2*h);kinetic+=ut*ut/(2*N);potential+=s.c*s.c*ux*ux/(2*N);}
    const got=M.energy({...s,t});near(got.kinetic,kinetic,1e-6);near(got.potential,potential,1e-6);near(got.kinetic+got.potential,got.wave);
  }
});
test('Energy, high-frequency decay and node activity predictions match the model',()=>{
  const e={...M.initial(),...Q.find(q=>q.id==='energy')};const F=M.frame(e);assert(F.wave.every(v=>Math.abs(v)<1e-12));const energy=M.energy(e);near(energy.kinetic/energy.wave,1);near(energy.potential,0);
  const q={...M.initial(),...Q.find(q=>q.id==='frequency')},a=M.amplitudes(q);near(a.heat[0],.7437218794,1e-9);near(a.heat[2],.0696137489828,1e-9);near(M.mode(q,3).tau/M.mode(q,1).tau,1/9);
  const n={...M.initial(),...Q.find(q=>q.id==='node')};for(const t of [0,.15,.37,2])for(const kind of ['wave','heat'])near(M.field(M.amplitudes({...n,t})[kind],.5),0);near(M.field(M.amplitudes({...n,t:0}).wave,.25),1);
  const zero=M.energy({...M.initial(),a:Array(6).fill(0)});assert.deepEqual(zero,{wave:0,kinetic:0,potential:0,heatL2:0,initialL2:0});
});
test('Comparison links reject unknown ids, deduplicate and keep the selected order',()=>{
  const a=catalog.resources[0].id,b=catalog.resources[1].id,c=catalog.resources[2].id,d=catalog.resources[3].id;
  assert.deepEqual(C.parse(`${b},${a},${b}`,catalog.resources),{ids:[b,a],ignored:false});
  assert.deepEqual(C.parse(`bad,${a},${b},${c},${d}`,catalog.resources),{ids:[a,b,c],ignored:true});
  assert.deepEqual(C.parse('<script>',catalog.resources),{ids:[],ignored:true});
  const p=new URLSearchParams(C.url([c,a]).split('?')[1]);assert.deepEqual(C.parse(p.get('ids'),catalog.resources).ids,[c,a]);
});
test('Every activity and comparison group points to real resources; all new formulas render',()=>{
  const ids=new Set(catalog.resources.map(r=>r.id));
  for(const group of C.groups){assert(group.ids.length>=2&&group.ids.length<=3);group.ids.forEach(id=>assert(ids.has(id)));}
  assert.equal(new Set(Q.map(q=>q.id)).size,3);
  for(const q of Q){q.related.forEach(id=>assert(ids.has(id)));assert(q.answer>=0&&q.answer<q.options.length);assert(S.decode(S.encode({...M.initial(),a:q.a,c:q.c,D:q.D,t:q.t,n:q.n,x:q.x})));assert(katex.renderToString(q.formula,{throwOnError:true}).includes('katex'));}
});
