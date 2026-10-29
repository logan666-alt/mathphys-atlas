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


test('Direct fraction edits preserve the requested percentage and normalize other phases, including pure endpoints',()=>{
  for(const initial of [[.5,.5,0],[0,0,1],[1,0,0],[.1,.3,.6]])for(let index=0;index<3;index++)for(const value of [0,.1,.37,.99,1]){
    const x=M.rebalance(initial,index,value);near(x[index],value);near(x.reduce((a,b)=>a+b),1);assert.ok(x.every(v=>v>=0&&v<=1));
    const others=[0,1,2].filter(i=>i!==index);if(initial[others[0]]>0&&initial[others[1]]>0&&value<1)near(x[others[0]]/x[others[1]],initial[others[0]]/initial[others[1]]);
  }
});

test('Orbit rotation preserves lengths and separates azimuth, elevation and depth',()=>{
  const V=require('../dist/three-phase/view.js');
  for(const yaw of [-180,-90,-35,0,70,180])for(const pitch of [-85,-30,0,30,85])for(const v of [[1,0,0],[0,1,0],[0,0,1],[1.2,-.4,2.5]]){
    const q=V.rotate(...v,yaw,pitch);near(Math.hypot(...q),Math.hypot(...v));assert.ok(q.every(Number.isFinite));
  }
  const a=V.rotate(1,2,3,0,0),b=V.rotate(1,2,3,90,0),c=V.rotate(1,2,3,0,90);
  near(a[0],1);near(a[1],-3);near(a[2],2);near(b[0],-2);near(c[1],2);near(c[2],3);
  assert.notDeepEqual(a,b);assert.notDeepEqual(a,c);
});

const P=require('../dist/three-phase/transition-model.js');
test('The derivative lesson uses the original stable branches and avoids a third-phase crossing',()=>{
  for(const kind of ['sl','lg','sg'])for(const p of (kind==='sg'?[.25,.6,.95]:[1.05,1.7,2])){
    const z=P.create('first',kind,p);
    near(z.left.g,z.right.g);assert.ok(z.jump>0);near(z.right.h-z.left.h,z.latent);
    for(let j=0;j<=40;j++){
      const tau=z.lo+(z.hi-z.lo)*j/40,a=z.at(tau),original=M.state(tau*z.tc,z.p);
      near(a.g,original.min/z.tc);near(a.h,a.g+tau*a.s);
      if(Math.abs(tau-1)>1e-12)near(a.cp,3);
    }
  }
});
test('Entropy, curvature and heat capacity match independent numerical derivatives',()=>{
  for(const mode of ['first','jump','critical']){
    const z=P.create(mode),h=1e-5;
    for(const tau of [z.lo+.003,.985,1.015,z.hi-.003]){
      const a=z.at(tau),l=z.at(tau-h),r=z.at(tau+h);
      near(-(r.g-l.g)/(2*h),a.s,3e-7);
      near((r.g-2*a.g+l.g)/(h*h),a.d2,4e-5);
      near(tau*(r.s-l.s)/(2*h),a.cp,3e-6);
      near((r.h-l.h)/(2*h),a.cp,3e-6);assert.ok(a.cp>0);
    }
  }
});
test('At a first-order transition the derivatives are undefined and fraction tracks latent heat',()=>{
  for(const kind of ['sl','lg','sg']){
    const z=P.create('first',kind,kind==='sg'?.6:1.7);
    for(const x of [0,.25,.5,.75,1]){
      const a=z.at(1,0,x),q=z.accumulated(1,x);
      assert.equal(a.d1,null);assert.equal(a.d2,null);assert.equal(a.cp,null);
      near(a.g,z.left.g);near(a.s-z.left.s,x*z.jump);near(a.h-z.left.h,x*z.latent);
      near(q.entropy,3*Math.log(1/z.lo)+x*z.jump);
      near(q.heat,3*(1-z.lo)+x*z.latent);
    }
    const q=z.accumulated(z.hi);near(q.entropy,3*Math.log(z.hi/z.lo)+z.jump);near(q.heat,3*(z.hi-z.lo)+z.latent);
  }
});
test('Continuous transition models keep entropy continuous with a Cp jump or integrable divergence',()=>{
  const j=P.create('jump'),c=P.create('critical');
  near(j.left.g,j.right.g);near(j.left.s,j.right.s);near(j.jump,0);
  near(j.left.cp,15);near(j.right.cp,3);near(j.left.d2,-15);near(j.right.d2,-3);
  assert.equal(j.at(1).cp,null);assert.equal(j.at(1).d2,null);near(j.at(1).d1,-2);
  near(c.jump,0);assert.equal(c.at(1).cp,Infinity);assert.equal(c.at(1).d2,-Infinity);
  for(const sign of [-1,1]){
    assert.ok(c.at(1+sign*1e-6).cp>c.at(1+sign*1e-3).cp);
    near(c.at(1+sign*1e-8).s,2,7e-7);near(c.at(1+sign*1e-8).g,0,3e-8);
  }
});
test('Heat and entropy shaded integrals agree with endpoint state functions, including the log singularity',()=>{
  const integrate=(f,a,b)=>{const n=16000,dx=(b-a)/n;let sum=0;for(let i=0;i<n;i++)sum+=f(a+(i+.5)*dx)*dx;return sum;};
  for(const mode of ['jump','critical']){
    const z=P.create(mode);
    for(const end of [1,z.hi]){
      const intervals=end===1?[[z.lo,1]]:[[z.lo,1],[1,end]],q=z.accumulated(end);
      near(intervals.reduce((sum,[a,b])=>sum+integrate(t=>z.at(t).cp/t,a,b),0),q.entropy,2e-5);
      near(intervals.reduce((sum,[a,b])=>sum+integrate(t=>z.at(t).cp,a,b),0),q.heat,2e-5);
    }
  }
});
test('The expanded lesson formulas render and fourth-step scripts load in dependency order',()=>{
  const katex=require('../dist/vendor/katex/katex.min.js'),context={window:{katex,PhaseTransitionModel:P}};
  vm.runInNewContext(fs.readFileSync(require.resolve('../dist/three-phase/transition.js'),'utf8'),context);
  for(const formula of Object.values(context.window.PhaseTransitionDemo.formulas))katex.renderToString(formula,{throwOnError:true});
  const html=fs.readFileSync(require.resolve('../dist/index.html'),'utf8');
  assert.ok(html.indexOf('three-phase/model.js')<html.indexOf('three-phase/transition-model.js'));
  assert.ok(html.indexOf('three-phase/transition-model.js')<html.indexOf('three-phase/transition.js'));
  assert.ok(html.indexOf('three-phase/transition.js')<html.indexOf('three-phase/demo.js'));
});
