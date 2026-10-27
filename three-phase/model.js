(function(root,factory){const m=factory();if(typeof module==='object'&&module.exports)module.exports=m;else root.ThreePhaseModel=m;})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const names=['固相','液相','气相'], entropy0=[1,2.2,5], volumes=[.06,.08], cp=3;
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  function state(t,p){
    if(!(t>0&&p>0))throw new RangeError('温度和压强必须为正');
    const base=cp*(t-1-t*Math.log(t));
    const mu=entropy0.map((s,i)=>-s*(t-1)+base+(i===2?t*Math.log(p):volumes[i]*(p-1)));
    const s=entropy0.map((a,i)=>a+cp*Math.log(t)-(i===2?Math.log(p):0));
    const v=[...volumes,t/p],h=mu.map((u,i)=>u+t*s[i]),min=Math.min(...mu);
    const stable=mu.map((u,i)=>Math.abs(u-min)<1e-8?i:-1).filter(i=>i>=0);
    return {t,p,mu,s,v,h,min,stable};
  }
  // Exact equal-mu loci. Physical portions are selected by the third-phase comparison.
  function boundary(kind,p){
    const t=kind==='sl'?1+.02*(p-1)/1.2:kind==='lg'?(2.8-.08*(p-1))/(2.8-Math.log(p)):(4-.06*(p-1))/(4-Math.log(p));
    return state(t,p);
  }
  const pairs={sl:[0,1],lg:[1,2],sg:[0,2]};
  function physical(kind,p){const a=boundary(kind,p);return pairs[kind].every(i=>a.stable.includes(i));}
  const normalize=xs=>{const a=xs.map(x=>Math.max(0,Number(x)||0)),sum=a.reduce((s,x)=>s+x,0);return sum?a.map(x=>x/sum):[1/3,1/3,1/3];};
  const mix=(xs,values)=>xs.reduce((a,x,i)=>a+x*values[i],0);
  function rebalance(xs,index,value){
    const current=normalize(xs),v=clamp(value,0,1),rest=1-current[index];
    return current.map((x,i)=>i===index?v:(1-v)*(rest>1e-12?x/rest:1/2));
  }
  // Vertices of the equilibrium fraction simplex, intersected with one extensive constraint.
  function solutions(a,kind='none',target=0){
    const ids=a.stable,vertices=[];
    const add=x=>{if(!vertices.some(v=>v.every((z,i)=>Math.abs(z-x[i])<1e-8)))vertices.push(x);};
    for(const i of ids){if(kind==='none'||Math.abs(a[kind][i]-target)<1e-9){const x=[0,0,0];x[i]=1;add(x);}}
    if(kind!=='none')for(let j=0;j<ids.length;j++)for(let k=j+1;k<ids.length;k++){
      const i=ids[j],l=ids[k],d=a[kind][l]-a[kind][i];if(Math.abs(d)<1e-12)continue;
      const f=(target-a[kind][i])/d;if(f>=-1e-10&&f<=1+1e-10){const x=[0,0,0];x[i]=1-clamp(f,0,1);x[l]=clamp(f,0,1);add(x);}
    }
    return vertices;
  }
  function choose(vertices,q=.5,r=.33){
    if(!vertices.length)return null;if(vertices.length===1)return vertices[0].slice();
    const weights=vertices.length===2?[1-q,q]:[r,(1-r)*(1-q),(1-r)*q];
    return [0,1,2].map(i=>vertices.reduce((s,x,j)=>s+weights[j]*x[i],0));
  }
  return {names,entropy0,volumes,cp,clamp,state,boundary,pairs,physical,normalize,mix,rebalance,solutions,choose};
});
