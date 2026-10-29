(function(root,factory){
  const model=factory(typeof module==='object'&&module.exports?require('./model.js'):root.ThreePhaseModel);
  if(typeof module==='object'&&module.exports)module.exports=model;else root.PhaseTransitionModel=model;
})(typeof window!=='undefined'?window:globalThis,function(M){
  'use strict';
  const A=6,B=3,cp0=3,s0=2;
  const close=t=>Math.abs(t-1)<1e-12;
  function create(mode='first',kind='lg',pressure=1.7){
    if(!['first','jump','critical'].includes(mode))mode='first';
    if(!M.pairs[kind])kind='lg';
    const p=M.clamp(Number.isFinite(pressure)?pressure:1.7,kind==='sg'?.25:1.05,kind==='sg'?.95:2);
    const first=mode==='first',ids=M.pairs[kind];
    const tc=first?M.boundary(kind,p).t:1;
    // Keep the fixed-p window inside the two relevant stability regions.
    const neighbour=kind==='sl'?'lg':'sl';
    const width=first&&kind!=='sg'?Math.min(.08,.44*Math.abs(M.boundary(neighbour,p).t-tc)/tc):.08;
    const lo=1-width,hi=1+width;
    function at(tau,side=0,fraction=.5){
      if(!(tau>0))throw new RangeError('温度必须为正');
      const atTransition=close(tau);
      if(first){
        const z=M.state(tau*tc,p),index=tau<1||(atTransition&&side<0)?ids[0]:ids[1];
        if(atTransition&&side===0){
          const x=M.clamp(fraction,0,1),s=(1-x)*z.s[ids[0]]+x*z.s[ids[1]],g=z.mu[ids[0]]/tc;
          return {tau,g,s,h:g+tau*s,cp:null,d1:null,d2:null,phase:'两相共存',coexist:true};
        }
        const g=z.mu[index]/tc,s=z.s[index];
        return {tau,g,s,h:g+tau*s,cp:M.cp,d1:-s,d2:-M.cp/tau,phase:M.names[index]};
      }
      const x=tau-1;
      let g=-s0*x+cp0*(tau-1-tau*Math.log(tau)),s=s0+cp0*Math.log(tau),cp=cp0;
      if(mode==='jump'){
        if(tau<1||(atTransition&&side<0)){g-=A*x*x;s+=2*A*x;cp+=2*A*tau;}
        if(atTransition&&side===0)cp=null;
      }else if(atTransition){cp=Infinity;}
      else{
        const log=Math.log(Math.abs(x));
        g+=B*.5*x*x*log-.75*B*x*x;
        s+=B*x*(1-log);cp-=B*tau*log;
      }
      return {tau,g,s,h:g+tau*s,cp,d1:-s,d2:cp===null?null:-cp/tau,phase:tau<1?'低温相':tau>1?'高温相':'连续相变点'};
    }
    const left=at(1,-1),right=at(1,1),jump=first?right.s-left.s:0;
    function accumulated(tau,fraction=.5){
      const start=at(lo),end=at(tau,0,fraction),latent=jump*(tau<1&&!close(tau)?0:tau>1&&!close(tau)?1:M.clamp(fraction,0,1));
      return {entropy:end.s-start.s,regularEntropy:end.s-start.s-latent,latentEntropy:latent,heat:end.h-start.h};
    }
    return {mode,kind,p,tc,lo,hi,width,first,ids,left,right,jump,latent:jump,gref:left.g,sref:(left.s+right.s)/2,at,accumulated};
  }
  return {create,A,B,cp0,s0};
});
