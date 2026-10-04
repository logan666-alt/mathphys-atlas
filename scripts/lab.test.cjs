const {test}=require('node:test');
const assert=require('node:assert/strict');
const M=require('../dist/lab/physics.js');
const fs=require('node:fs');
const vm=require('node:vm');
const katex=require('../dist/vendor/katex/katex.min.js');
const near=(a,b,tol=1e-9)=>assert(Math.abs(a-b)<=tol,`${a} differs from ${b} (tolerance ${tol})`);
const value=(state,type,x,t)=>M.field(M.amplitudes({...state,t})[type],x);
const cases=[M.initial(),{...M.initial(),a:[.7,-.4,.6,-.2,.3,-.8],c:2,D:.12},{...M.initial(),a:[0,0,0,0,0,1],c:.25,D:.005}];

test('Both fields reproduce a shared initial condition; wave initial velocity is zero',()=>{
 for(const s of cases)for(let j=0;j<=20;j++){
  const x=j/20;const expected=s.a.reduce((sum,a,i)=>sum+a*Math.sin((i+1)*Math.PI*x),0);
  near(value(s,'wave',x,0),expected);near(value(s,'heat',x,0),expected);
  near((value(s,'wave',x,1e-5)-value(s,'wave',x,-1e-5))/2e-5,0);
 }
});
test('Both endpoints remain zero for all tested initial shapes and times',()=>{
 for(const s of cases)for(const t of [0,.1,.731,2,12])for(const type of ['wave','heat']){
  near(value(s,type,0,t),0);near(value(s,type,1,t),0);
 }
});
test('Independent central differences satisfy the wave and heat PDEs',()=>{
 const h=1e-4;
 for(const s of cases)for(const x of [.173,.417,.713])for(const t of [.13,.71,2.34]){
  for(const type of ['wave','heat']){
   const v=value(s,type,x,t);
   const xx=(value(s,type,x+h,t)-2*v+value(s,type,x-h,t))/(h*h);
   const lhs=type==='wave'?(value(s,type,x,t+h)-2*v+value(s,type,x,t-h))/(h*h):(value(s,type,x,t+h)-value(s,type,x,t-h))/(2*h);
   const rhs=(type==='wave'?s.c*s.c:s.D)*xx;
   near(lhs,rhs,3e-5*(1+Math.abs(rhs)));
  }
 }
});
test('Mode period and e-fold decay time agree with evaluated curves',()=>{
 for(let n=1;n<=6;n++)for(const c of [.25,1,2])for(const D of [.005,.03,.12]){
  const s={...M.initial(),n,c,D,a:Array.from({length:6},(_,i)=>i===n-1?.8:0)};
  const at=M.mode(s),x=1/(2*n);
  near(value(s,'wave',x,.17+at.period),value(s,'wave',x,.17));
  near(value(s,'heat',x,at.tau),.8/Math.E);
 }
});
test('Linear superposition, negative coefficients and the zero state stay consistent',()=>{
 const a={...M.initial(),a:[.4,0,-.3,0,0,0]},b={...M.initial(),a:[0,-.7,0,.2,0,0]};
 const sum={...a,a:a.a.map((v,i)=>v+b.a[i])};
 for(const type of ['wave','heat'])for(const t of [0,.5,4])near(value(sum,type,.37,t),value(a,type,.37,t)+value(b,type,.37,t));
 const zero=M.frame({...M.initial(),a:Array(6).fill(0),t:12});
 for(const type of ['wave','heat','initial'])assert(zero[type].every(v=>v===0));
 assert(Number.isFinite(zero.limit)&&zero.limit>0);
});
test('Fixed vertical range contains every sampled field and does not shrink with time',()=>{
 for(const s of cases){const bound=M.frame(s).limit;for(const t of [0,.19,1.7,12]){
  const F=M.frame({...s,t});near(F.limit,bound);
  for(const type of ['wave','heat'])assert(F[type].every(v=>Math.abs(v)<=bound));
 }}
});
test('Spatially integrated wave energy is constant; thermal squared norm decreases',()=>{
 // Quadrature and finite differences of the evaluated field, independent of M.energy.
 const s=cases[1],h=1e-5,N=1200;
 function measure(t){let wave=0,heat=0;for(let j=0;j<N;j++){
  const x=(j+.5)/N;
  const ut=(value(s,'wave',x,t+h)-value(s,'wave',x,t-h))/(2*h);
  const ux=(value(s,'wave',x+h,t)-value(s,'wave',x-h,t))/(2*h);
  wave+=(ut*ut+s.c*s.c*ux*ux)/2/N;heat+=value(s,'heat',x,t)**2/N;
 }return {wave,heat};}
 const first=measure(0);let prev=first.heat;
 for(const t of [.1,.6,2,8]){const got=measure(t);near(got.wave,first.wave,first.wave*1e-6);assert(got.heat<=prev+1e-12);prev=got.heat;}
});
test('Triangular preset approximates the stated centered pluck, with odd modes only',()=>{
 for(const n of [2,4,6])near(M.presets.pluck[n-1],0);
 for(let j=0;j<=100;j++){const x=j/100;near(M.field(M.presets.pluck,x),1-Math.abs(2*x-1),.07);}
});
test('The actual lab page renders every KaTeX formula without errors',()=>{
 const context={window:{MathPhysModel:M,katex,MathPhysState:require('../dist/lab/state.js'),MathPhysInquiries:require('../dist/lab/inquiries.js')}};vm.createContext(context);
 vm.runInContext(fs.readFileSync(require.resolve('../dist/lab/activities.js'),'utf8'),context);
 vm.runInContext(fs.readFileSync(require.resolve('../dist/lab/ui.js'),'utf8'),context);
 const html=context.window.MathPhysLab.page();assert(html.includes('katex-mathml'));assert(!html.includes('katex-error'));
 assert.equal((html.match(/id="plot-(wave|heat)"/g)||[]).length,2);
});
