const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const M=require('../dist/three-phase/model.js');
const near=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);
test('Triple point and representative single phase regions',()=>{
  assert.deepEqual(M.state(1,1).stable,[0,1,2]);M.state(1,1).mu.forEach(x=>near(x,0));
  for(const [t,p,i] of [[.9,1.3,0],[1.08,1.7,1],[1.2,.6,2]])assert.deepEqual(M.state(t,p).stable,[i]);
});
test('Physical coexistence curves enforce equal mu AND comparison with third phase',()=>{
  for(const k of ['sl','lg','sg'])for(const p of [.2,.6,.99,1,1.08,1.7,2.4]){
    const a=M.boundary(k,p),[i,j]=M.pairs[k];near(a.mu[i],a.mu[j]);assert.equal(M.physical(k,p),k==='sg'?p<=1:p>=1);
  }
});
test('Coexistence height is not constant and Clapeyron differential holds',()=>{
  for(const k of ['sl','lg','sg']){
    const p=k==='sg'?.6:1.7,d=1e-5,a=M.boundary(k,p),left=M.boundary(k,p-d),right=M.boundary(k,p+d),[i,j]=M.pairs[k];
    const dt=(right.t-left.t)/(2*d);near(1/dt,(a.s[j]-a.s[i])/(a.v[j]-a.v[i]),1e-5);
    near((right.mu[i]-left.mu[i])/(2*d),-a.s[i]*dt+a.v[i]);assert.ok(Math.abs(a.min)>1e-3);
  }
});
test('All section slopes, enthalpies and heat capacities derive from the same Gibbs model',()=>{
  for(const t of [.7,1,1.3])for(const p of [.2,1,2.4]){const a=M.state(t,p),d=1e-5;
    for(let i=0;i<3;i++){
      near((M.state(t+d,p).mu[i]-M.state(t-d,p).mu[i])/(2*d),-a.s[i]);
      near((M.state(t,p+d).mu[i]-M.state(t,p-d).mu[i])/(2*d),a.v[i]);
      near((M.state(t+d,p).h[i]-M.state(t-d,p).h[i])/(2*d),3);near(a.h[i],a.mu[i]+t*a.s[i]);assert.ok(a.v[i]>0);
    }
  }
});
test('Mixing decreases Gibbs toward equilibrium without changing T,p; all triple mixtures have same Gibbs',()=>{
  for(const a of [M.state(1.08,1.7),M.boundary('lg',1.7),M.state(1,1)]){
    const initial=[.5,.3,.2],target=M.choose(M.solutions(a),.7,.2);let prev=Infinity;
    for(let j=0;j<=100;j++){const z=j/100,x=initial.map((v,i)=>(1-z)*v+z*target[i]),g=M.mix(x,a.mu);near(x.reduce((s,v)=>s+v),1);assert.ok(g<=prev+1e-12);assert.ok(g>=a.min-1e-12);prev=g;}near(prev,a.min);
  }
  for(const x of [[1,0,0],[0,1,0],[0,0,1],[.1,.3,.6]])near(M.mix(x,M.state(1,1).mu),0);
});
test('Two phase volume and enthalpy constraints obey lever rule and endpoint feasibility',()=>{
  for(const k of ['sl','lg','sg'])for(const kind of ['v','h']){
    const a=M.boundary(k,k==='sg'?.6:1.7),[i,j]=a.stable;
    for(const q of [0,.1,.5,.9,1]){const target=(1-q)*a[kind][i]+q*a[kind][j],sol=M.solutions(a,kind,target);assert.equal(sol.length,1);near(sol[0][i],1-q);near(sol[0][j],q);near(M.mix(sol[0],a[kind]),target);}
    assert.equal(M.solutions(a,kind,Math.max(...a.stable.map(i=>a[kind][i]))+1).length,0);
  }
});
test('Triple point with one extensive constraint retains a continuum and exact conservation',()=>{
  const a=M.state(1,1);for(const [kind,target] of [['v',.4],['h',3]]){const sol=M.solutions(a,kind,target);assert.equal(sol.length,2);for(const q of [0,.1,.5,1]){const x=M.choose(sol,q);near(x.reduce((s,v)=>s+v),1);near(M.mix(x,a[kind]),target);assert.ok(x.every(v=>v>=0));}}
});
test('Single phase additional constraint is feasible only at its intrinsic value',()=>{
  const a=M.state(1.08,1.7);for(const kind of ['v','h']){assert.equal(M.solutions(a,kind,a[kind][1]).length,1);assert.equal(M.solutions(a,kind,a[kind][1]+.01).length,0);}
});
test('Lesson formulas render; local assets and lifecycle are registered',()=>{
  const context={window:{ThreePhaseDemo:{markup:'',mount(){},unmount(){}}}};vm.runInNewContext(fs.readFileSync(require.resolve('../dist/three-phase/page.js'),'utf8'),context);
  const katex=require('../dist/vendor/katex/katex.min.js');for(const f of Object.values(context.window.ThreePhaseLesson.formulas))katex.renderToString(f,{throwOnError:true});
  assert.ok(context.window.SiteDemos['three-phase']);const r=require('../dist/catalog.json').resources.find(r=>r.id==='three-phase'),html=fs.readFileSync(require.resolve('../dist/index.html'),'utf8');r.localAssets.forEach(a=>assert.ok(html.includes(a)));
});
