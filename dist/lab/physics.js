/* Original analytic finite-mode model. All quantities are dimensionless. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MathPhysModel=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const COUNT=6, END=12;
  const presets={single:[1,0,0,0,0,0],double:[1,.45,0,0,0,0],pluck:Array.from({length:COUNT},(_,i)=>8*Math.sin((i+1)*Math.PI/2)/(Math.PI*(i+1))**2)};
  function initial(){return {a:[...presets.single],c:1,D:.03,t:0,n:1,x:.5,showInitial:true,showMode:false,speed:1};}
  const k=n=>n*Math.PI;
  function amplitudes(s){return {wave:s.a.map((a,i)=>a*Math.cos(s.c*k(i+1)*s.t)),heat:s.a.map((a,i)=>a*Math.exp(-s.D*k(i+1)**2*s.t))};}
  function field(a,x){return a.reduce((sum,value,i)=>sum+value*Math.sin(k(i+1)*x),0);}
  function limits(s){return Math.max(.25,1.15*s.a.reduce((sum,a)=>sum+Math.abs(a),0));}
  function mode(s,n=s.n){const lambda=k(n)**2;return {lambda,omega:s.c*k(n),period:2/(s.c*n),tau:1/(s.D*lambda)};}
  function frame(s,points=241){const a=amplitudes(s),xs=Array.from({length:points},(_,i)=>i/(points-1));return {amplitudes:a,xs,initial:xs.map(x=>field(s.a,x)),wave:xs.map(x=>field(a.wave,x)),heat:xs.map(x=>field(a.heat,x)),limit:limits(s)};}
  function energy(s){
    const a=amplitudes(s);
    const wave=s.a.reduce((sum,v,i)=>sum+.25*(v*s.c*k(i+1))**2,0);
    const kinetic=s.a.reduce((sum,v,i)=>sum+.25*(v*s.c*k(i+1)*Math.sin(s.c*k(i+1)*s.t))**2,0);
    const potential=a.wave.reduce((sum,v,i)=>sum+.25*(v*s.c*k(i+1))**2,0);
    return {wave,kinetic,potential,heatL2:.5*a.heat.reduce((sum,v)=>sum+v*v,0),initialL2:.5*s.a.reduce((sum,v)=>sum+v*v,0)};
  }
  return Object.freeze({COUNT,END,presets,initial,k,amplitudes,field,limits,mode,frame,energy});
});
