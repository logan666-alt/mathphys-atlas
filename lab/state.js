/* Portable experiment snapshots. Only validated numeric settings go into the URL. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MathPhysState=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const bounded=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
  function valid(a){return Array.isArray(a)&&a.length===15&&a[0]===1&&a.slice(1,7).every(v=>bounded(v,-1,1))&&bounded(a[7],.25,2)&&bounded(a[8],.005,.12)&&bounded(a[9],0,12)&&Number.isInteger(a[10])&&bounded(a[10],1,6)&&bounded(a[11],0,1)&&[0,1].includes(a[12])&&[0,1].includes(a[13])&&[.25,.5,1,2].includes(a[14]);}
  function encode(s){const a=[1,...s.a,s.c,s.D,s.t,s.n,s.x,s.showInitial?1:0,s.showMode?1:0,s.speed];if(!valid(a))throw new Error('Invalid experiment settings');return JSON.stringify(a);}
  function decode(text){
    if(typeof text!=='string'||text.length>2048)return null;
    try{const a=JSON.parse(text);if(!valid(a))return null;return {a:a.slice(1,7),c:a[7],D:a[8],t:a[9],n:a[10],x:a[11],showInitial:!!a[12],showMode:!!a[13],speed:a[14]};}catch{return null;}
  }
  const hash=s=>'#/lab?'+new URLSearchParams({s:encode(s)});
  return Object.freeze({encode,decode,hash});
});
