(function(){
  'use strict';const M=window.ThreePhaseModel;let dispose;
  const names=M.names,colors=['#366cb1','#16816e','#b26426'],dash=['','7 4','2 4'];
  const fmt=(x,n=4)=>(Math.abs(x)<5e-10?0:x).toFixed(n).replace('-','−');
  const markup=`<section id="tp-demo" aria-label="三相平衡交互演示">
    <nav class="tp-steps" aria-label="学习顺序">${['比较三相高低','沿线看共存','改变相比例'].map((x,i)=>`<button type="button" data-step="${i+1}" aria-controls="tp-panel-${i+1}"><b>${i+1}</b>${x}</button>`).join('')}</nav>
    <div class="tp-task"><h2 id="tp-question"></h2><p id="tp-instruction"></p></div>
    <div class="tp-presets" role="group" aria-label="选择情景"><button type="button" data-preset="liquid">液相区</button><button type="button" data-preset="lg">汽化线</button><button type="button" data-preset="triple">三相点</button><details class="tp-more"><summary>更多情景</summary><div><button type="button" data-preset="solid">固相区</button><button type="button" data-preset="gas">气相区</button><button type="button" data-preset="sl">熔化线</button><button type="button" data-preset="sg">升华线</button><button type="button" data-preset="free">自由选温压</button></div></details><button type="button" id="tp-tune" aria-expanded="false">微调温压</button></div>
    <div class="tp-controls" id="tp-state-controls"><label id="tp-tbox">温度 T/Tt <output id="tp-tv"></output><input id="tp-t" aria-label="温度" type="range" min=".7" max="1.3" step=".001" value="1.08"></label><label id="tp-pbox"><span id="tp-plabel">压强 p/pt</span> <output id="tp-pv"></output><input id="tp-p" aria-label="压强" type="range" min=".2" max="2.4" step=".001" value="1.7"></label><p id="tp-locked" class="tp-note"></p></div>
    <div id="tp-state" class="tp-state" role="status" aria-live="polite"></div>
    <section id="tp-panel-1" aria-label="第一步：比较三相高低">
      <div class="tp-viewbar"><label class="tp-gain">高度差放大 <output id="tp-gainv"></output><input id="tp-gain" aria-label="高度差放大倍数" type="range" min="1" max="4" step=".25" value="2.5"></label><div class="tp-camera-buttons"><button type="button" id="tp-zoom-out" class="button outline" aria-label="缩小曲面">−</button><button type="button" id="tp-zoom-in" class="button outline" aria-label="放大曲面">＋</button><button type="button" id="tp-home" class="button outline">恢复视角</button></div></div>
      <p class="tp-note">拖动：自由旋转与俯仰 · 滚轮或双指捏合：缩放 · 聚焦图形后可用方向键旋转、＋/−缩放</p>
      <div class="tp-scene"><canvas id="tp-gl" aria-hidden="true"></canvas><svg id="tp-surface" class="tp-chart tp-rotate" role="img" tabindex="0" aria-label="同一坐标系中的固液气三张曲面，可拖动旋转俯仰和缩放"></svg></div>
      <div id="tp-surface-values" class="tp-surface-values"></div>
      <p id="tp-scale-note" class="tp-note"></p>
      <details class="tp-camera"><summary>视角与显示设置</summary><div class="tp-controls"><label>水平旋转 <output id="tp-anglev"></output><input type="range" id="tp-angle" min="-180" max="180" step="1" value="-35"></label><label>上下俯仰 <output id="tp-pitchv"></output><input type="range" id="tp-pitch" min="-85" max="85" step="1" value="15"></label><label>缩放 <output id="tp-zoomv"></output><input type="range" id="tp-zoom" min=".6" max="2" step=".05" value="1"></label><label>显示内容<select id="tp-layer"><option value="all">全部三相</option><option value="envelope">仅平衡下包络</option></select></label></div></details>
      <div class="tp-two tp-comparison"><div><h3>同一温压下，谁更低？</h3><svg id="tp-heights" class="tp-chart" role="img" aria-label="三个化学势读数及高于最低值的差"></svg><p class="tp-note">横条表示高于最低值的差；数值为实际 g = μ/(RTt)。零差值的相最稳定。</p></div><div><h3>对应的 T–p 相图</h3><svg id="tp-map" class="tp-chart" role="img" aria-label="三相图，可点击选择温压"></svg><p class="tp-note">点击相区可自由选点；共存线用上方情景按钮精确选取。</p></div></div>
      <button type="button" class="button tp-next" data-step="2">下一步：沿共存线看共同高度 →</button>
    </section>
    <section id="tp-panel-2" aria-label="第二步：沿线看共存" hidden>
      <div class="tp-two"><div><h3>相图中的移动路径</h3><svg id="tp-path-map" class="tp-chart" role="img" aria-label="当前共存线和温压点"></svg></div><div><h3>沿这条线，共同高度怎样变？</h3><svg id="tp-coexist" class="tp-chart" role="img" aria-label="沿共存线的实际共同化学势"></svg><p id="tp-coexist-note" class="tp-note"></p></div></div>
      <p class="tp-takeaway" id="tp-line-takeaway"></p>
      <details id="tp-sections"><summary>进一步看：恒温、恒压截面的斜率</summary><div class="tp-two"><div><h3>恒温：∂g/∂π = v</h3><svg id="tp-section-p" class="tp-chart" role="img" aria-label="恒温化学势压强截面"></svg></div><div><h3>恒压：∂g/∂θ = −s</h3><svg id="tp-section-t" class="tp-chart" role="img" aria-label="恒压化学势温度截面"></svg></div></div><p class="tp-note">蓝色实线：固相；绿色长虚线：液相；橙色点线：气相。灰线为平衡下包络；这里使用实际化学势。</p></details>
      <button type="button" class="button tp-next" data-step="3">下一步：温压不动，改变相比例 →</button>
    </section>
    <section id="tp-panel-3" aria-label="第三步：改变相比例" hidden>
      <div class="tp-two"><div><h3>① 设定初态</h3><div class="tp-fractions">${names.map((name,i)=>`<label>${name} <output id="tp-xv${i}"></output><input type="range" id="tp-x${i}" aria-label="初态${name}百分比" min="0" max="100" step=".1" value="${[50,50,0][i]}"></label>`).join('')}</div><p class="tp-note">总和自动保持 100%；调整一相，另外两相按原比例分配剩余量。</p><p class="tp-values" id="tp-initial"></p></div>
      <div><h3>② 选择平衡终态</h3><p id="tp-target" class="tp-values"></p><div class="tp-controls"><label id="tp-qbox"><span id="tp-qlabel">终态气相比例</span> <output id="tp-qv"></output><input type="range" id="tp-q" min="0" max="1" step=".01" value=".5"></label><label id="tp-rbox">终态固相比例 <output id="tp-rv"></output><input type="range" id="tp-r" min="0" max="1" step=".01" value=".33"></label></div></div></div>
      <h3>③ 从初态移到终态</h3><div class="tp-controls"><label>转化进度 <output id="tp-progressv"></output><input type="range" id="tp-progress" aria-label="转化进度" min="0" max="1" step=".01" value="0"></label><button type="button" id="tp-end" class="button">到平衡终态</button><button type="button" id="tp-reset" class="button outline">回到初态</button></div>
      <div id="tp-bar" class="tp-mixbar" role="img" aria-label="当前三相摩尔分数"></div><div id="tp-energy" class="tp-values" aria-live="polite"></div><p class="tp-note">温压在此过程中固定。进度表示选定的相比例路径，不代表转化时间。</p>
      <details class="tp-equilibrium"><summary>进阶：用总容积或总焓确定平衡比例</summary><p>这里单独求满足总量约束的平衡终态。</p><div class="tp-controls"><label>总物质的量 n / mol<input id="tp-n" type="number" min=".001" max="1000000" step=".1" value="1"></label><label>附加条件<select id="tp-constraint"><option value="none">仅固定温压和总物质的量</option><option value="v">指定总体积 V</option><option value="h">指定总焓 H</option></select></label><label id="tp-totalbox"><span id="tp-total-label">目标总量</span><input id="tp-total" type="number" step=".01" value=".5"></label><label id="tp-choicebox">在可行终态之间移动<input id="tp-choice" type="range" min="0" max="1" step=".01" value=".5"></label></div><p id="tp-constraint-result" class="tp-values" aria-live="polite"></p></details>
    </section>
    <details class="tp-data"><summary>查看当前三相数值与图形选项</summary><div class="tp-table-wrap"><table class="tp-table"><caption>当前温压下的摩尔量（无量纲）</caption><thead><tr><th>相</th><th>g</th><th>s</th><th>v</th><th>h</th></tr></thead><tbody id="tp-rows"></tbody></table></div><label class="tp-check"><input type="checkbox" id="tp-extension">在相图上显示高于第三相的两相等高线</label></details>
  </section>`;
  function unmount(){if(dispose){dispose();dispose=null;}}
  function mount(){
    unmount();const root=document.getElementById('tp-demo');if(!root)return;const $=id=>root.querySelector('#tp-'+id),clean=[];
    const params=new URLSearchParams(location.hash.split('?')[1]||'');
    const read=(k,d,a,b)=>params.has(k)&&params.get(k).trim()&&Number.isFinite(+params.get(k))?M.clamp(+params.get(k),a,b):d;
    let t=read('t',1.08,.7,1.3),p=read('p',1.7,.2,2.4),mode=params.get('mode')||'free',angle=read('angle',-35,-180,180),pitch=read('pitch',15,-85,85),zoom=read('zoom',1,.6,2),gain=read('gain',2.5,1,4),layer=params.get('layer')||'all',ext=params.get('ext')==='1';
    if(!['free','sl','lg','sg','triple'].includes(mode))mode='free';if(!['all','envelope','0','1','2'].includes(layer))layer='all';
    let weights=[0,1,2].map(i=>read('x'+i,[50,50,0][i],0,100)),n=read('n',1,.001,1e6),q=read('q',.5,0,1),r=read('r',.33,0,1),progress=read('progress',0,0,1),constraint=params.get('constraint')||'none',total=read('total',.5,-1e8,1e8),choice=read('choice',.5,0,1);
    if(!['none','v','h'].includes(constraint))constraint='none';
    let step=read('step',1,1,3)|0;
    weights=M.normalize(weights).map(x=>x*100);
    let drag=null;const pointers=new Map();let tuning=params.get('tuning')==='1';
    const listen=(el,event,fn)=>{el.addEventListener(event,fn);clean.push(()=>el.removeEventListener(event,fn));};
    function save(){const s=new URLSearchParams({t,p,mode,angle,pitch,zoom,gain,layer,step,tuning:tuning?1:0,ext:ext?'1':'0',n,q,r,progress,constraint,total,choice});weights.forEach((x,i)=>s.set('x'+i,x));history.replaceState(null,'','#/resource/three-phase?'+s);}
    function align(){if(mode==='triple'){t=1;p=1;}else if(mode!=='free'){p=M.clamp(p,mode==='sg'?.2:1,mode==='sg'?1:mode==='lg'?2.03:2.4);t=M.boundary(mode,p).t;}}
    const line=(points,stroke,width=2,d='')=>`<path d="${points.map((a,i)=>(i?'L':'M')+a.map(v=>v.toFixed(2)).join(',')).join(' ')}" fill="none" stroke="${stroke}" stroke-width="${width}" ${d?`stroke-dasharray="${d}"`:''}/>`;
    const text=(x,y,s,anchor='middle',cls='')=>`<text x="${x}" y="${y}" text-anchor="${anchor}" class="${cls}">${s}</text>`;
    function frame(svg,xlo,xhi,ylo,yhi,xname,yname,height=270){const w=Math.max(230,svg.getBoundingClientRect().width),h=height,l=52,rr=16,top=32,b=42;svg.setAttribute('viewBox',`0 0 ${w} ${h}`);svg.setAttribute('height',h);
      const X=x=>l+(x-xlo)/(xhi-xlo)*(w-l-rr),Y=y=>h-b-(y-ylo)/(yhi-ylo)*(h-b-top);let out='';
      for(let i=0;i<4;i++){const x=xlo+(xhi-xlo)*i/3,y=ylo+(yhi-ylo)*i/3;out+=`<path class="grid" d="M${X(x)} ${top}V${h-b}M${l} ${Y(y)}H${w-rr}"/>`+text(X(x),h-b+19,fmt(x,2))+text(l-7,Y(y)+4,fmt(y,2),'end');}
      out+=`<path class="axis" d="M${l} ${top}V${h-b}H${w-rr}"/>`+text(w-rr,h-4,xname,'end')+text(l,15,yname,'start');return {w,h,l,rr,top,b,X,Y,out,xlo,xhi,ylo,yhi};}
    function drawMap(a,id='map'){const svg=$(id),f=frame(svg,.7,1.3,.2,2.4,'θ = T/Tt','π = p/pt',320),{X,Y}=f;let out='';
      for(let i=0;i<60;i++)for(let j=0;j<55;j++){const tt=.7+.6*(i+.5)/60,pp=.2+2.2*(j+.5)/55,idx=M.state(tt,pp).stable[0];out+=`<rect x="${X(tt-.005)}" y="${Y(pp+.02)}" width="${(f.w-f.l-f.rr)/60+.5}" height="${(f.h-f.b-f.top)/55+.5}" fill="${colors[idx]}" opacity=".13"/>`;}
      out+=f.out;
      for(const k of ['sl','lg','sg']){let stable=[],unstable=[];for(let j=0;j<=220;j++){const pp=.2+2.2*j/220,z=M.boundary(k,pp);if(z.t<.7||z.t>1.3)continue;(M.physical(k,pp)?stable:unstable).push([X(z.t),Y(pp)]);}out+=line(stable,'#243947',2.5);if(ext)out+=line(unstable,'#7c8891',1.3,'4 5');}
      out+=text(X(.83),Y(1.85),'固相','middle','phase-label')+text(X(1.16),Y(2.1),'液相','middle','phase-label')+text(X(1.15),Y(.52),'气相','middle','phase-label');
      out+=text(X(1)-9,Y(1)+5,'★','end')+text(X(1)-12,Y(1)+22,'三相点','end');out+=`<circle cx="${X(a.t)}" cy="${Y(a.p)}" r="6" class="selected"/>`;
      svg.innerHTML=out;svg._frame=f;
    }
    function cameraControls(){
      for(const [id,v] of Object.entries({angle,pitch,zoom,gain}))$(id).value=v;
      $('anglev').textContent=fmt(angle,0)+'°';$('pitchv').textContent=fmt(pitch,0)+'°';$('zoomv').textContent=fmt(zoom,2)+'×';$('gainv').textContent=fmt(gain,2)+'×';
    }
    function drawSurface(a){
      const tl=Math.max(.7,t-.08),th=Math.min(1.3,t+.08),pl=Math.max(.2,p-.25),ph=Math.min(2.4,p+.25),N=20,samples=[];
      for(let i=0;i<=N;i++)for(let j=0;j<=N;j++){const tt=tl+(th-tl)*i/N,pp=pl+(ph-pl)*j/N;samples.push({tt,pp,z:M.state(tt,pp)});}
      const values=samples.flatMap(z=>z.z.mu),lo=Math.min(...values),hi=Math.max(...values),range=Math.max(.08,hi-lo),mid=(hi+lo)/2;
      const svg=$('surface'),w=Math.max(230,svg.getBoundingClientRect().width),h=w<500?400:500;
      const radius=Math.sqrt(2*2.2**2+Math.pow(.75*gain,2)),distance=radius*5;
      const raw=(tt,pp,g)=>{const x=(2*(tt-tl)/(th-tl)-1)*2.2,y=(2*(pp-pl)/(ph-pl)-1)*2.2,z=(g-mid)/range*1.5*gain;const v=window.ThreePhaseView.rotate(x,y,z,angle,pitch),perspective=distance/(distance-v[2]);return [v[0]*perspective,v[1]*perspective,v[2]];};
      const bounds=samples.flatMap(v=>v.z.mu.map(g=>raw(v.tt,v.pp,g)));for(const tt of [tl,th])for(const pp of [pl,ph])bounds.push(raw(tt,pp,lo-range*.06));
      const scale=Math.min((w-(w<500?50:100))/(2*Math.max(...bounds.map(v=>Math.abs(v[0])))),(h-80)/(2*Math.max(...bounds.map(v=>Math.abs(v[1])))))*zoom;
      const project=(tt,pp,g)=>{const v=raw(tt,pp,g);return [w/2+v[0]*scale,h/2+v[1]*scale,v[2]];};
      const xy=point=>point.slice(0,2),path=(points,color,width=2,d='')=>line(points.map(xy),color,width,d);
      svg.setAttribute('viewBox',`0 0 ${w} ${h}`);svg.setAttribute('height',h);
      let out='';const faces=[],at=(i,j)=>samples[i*(N+1)+j];
      for(let i=0;i<N;i++)for(let j=0;j<N;j++){
        const corners=[at(i,j),at(i+1,j),at(i+1,j+1),at(i,j+1)],ks=layer==='envelope'?[M.state((corners[0].tt+corners[2].tt)/2,(corners[0].pp+corners[2].pp)/2).stable[0]]:[0,1,2];
        for(const k of ks){const points=corners.map(v=>project(v.tt,v.pp,layer==='envelope'?v.z.min:v.z.mu[k]));for(const ids of [[0,1,2],[0,2,3]]){const pts=ids.map(i=>points[i]);faces.push({k,points:pts,depth:pts.reduce((s,v)=>s+v[2],0)/3});}}
      }
      const floor=lo-range*.06,base=[[tl,pl],[th,pl],[th,ph],[tl,ph],[tl,pl]].map(([tt,pp])=>project(tt,pp,floor));
      out+=path(base,'#9aaebc',1,'4 4');
      faces.sort((a,b)=>a.depth-b.depth);
      const rendered=window.ThreePhaseView.draw($('gl'),faces,w,h,distance,radius);
      if(!rendered)for(const f of faces)out+=`<polygon points="${f.points.map(pt=>xy(pt).join(',')).join(' ')}" fill="${colors[f.k]}" fill-opacity="${layer==='envelope'?.9:.64}" stroke="${colors[f.k]}" stroke-opacity=".35" stroke-width=".35"/>`;
      if(!rendered&&layer==='all')for(let k=0;k<3;k++){const edge=[[tl,pl],[th,pl],[th,ph],[tl,ph],[tl,pl]].map(([tt,pp])=>project(tt,pp,M.state(tt,pp).mu[k]));out+=path(edge,colors[k],1.8);}
      for(const k of ['sl','lg','sg']){const points=[];for(let j=0;j<=160;j++){const pp=pl+(ph-pl)*j/160,z=M.boundary(k,pp);if(z.t>=tl&&z.t<=th&&M.physical(k,pp))points.push(project(z.t,z.p,z.min));}out+=path(points,'#172b3d',3);}
      out+=path([project(t,p,lo),project(t,p,hi)],'#172b3d',1.4,'3 3');
      a.mu.forEach((g,k)=>{const pt=project(t,p,g);out+=`<circle cx="${pt[0]}" cy="${pt[1]}" r="${a.stable.length>1?10-k*3:6}" fill="${colors[k]}" stroke="white" stroke-width="2"/>`;});
      const safeText=(pt,label,dx=0,dy=0)=>text(M.clamp(pt[0]+dx,32,w-32),M.clamp(pt[1]+dy,18,h-10),label);
      const origin=project(tl,pl,floor),xt=project(th,pl,floor),yp=project(tl,ph,floor),ztop=project(tl,pl,hi);
      out+=path([xt,origin,yp],'#718796',1.3)+path([origin,ztop],'#718796',1.3);
      out+=safeText(xt,'T/Tt',0,20)+safeText(yp,'p/pt',-40,12)+safeText(ztop,'g',0,-18);
      for(const g of [lo,mid,hi])out+=safeText(project(tl,pl,g),fmt(g,2),-24,4);
      if(tl<=1&&th>=1&&pl<=1&&ph>=1)out+=safeText(project(1,1,0),'★',12,-10);
      svg.innerHTML=out;
      $('surface-values').innerHTML=names.map((name,i)=>`<span style="--phase:${colors[i]}"><b>${name}</b> g = ${fmt(a.mu[i])}${a.stable.includes(i)?' · 最低':''}</span>`).join('');
      $('scale-note').textContent=`三张曲面共用一个坐标系，纵向高度差放大 ${fmt(gain,2)} 倍；刻度与读数仍为实际 g = μ/(RTt)。黑线为共存交线。局部窗口：T/Tt ${fmt(tl,2)}–${fmt(th,2)}，p/pt ${fmt(pl,2)}–${fmt(ph,2)}。`;
      cameraControls();
    }
    function drawHeights(a){
      const svg=$('heights'),w=Math.max(230,svg.getBoundingClientRect().width),h=228,left=58,right=w-20,max=Math.max(.01,...a.mu.map(g=>g-a.min));
      svg.setAttribute('viewBox',`0 0 ${w} ${h}`);svg.setAttribute('height',h);let out='';
      a.mu.forEach((g,i)=>{const y=35+65*i,d=Math.max(0,g-a.min),length=d/max*(right-left);
        out+=text(5,y,names[i],'start')+text(right,y,`g = ${fmt(g)}`,'end');
        out+=`<line x1="${left}" x2="${right}" y1="${y+16}" y2="${y+16}" stroke="#e2e9ee" stroke-width="9"/><line x1="${left}" x2="${left+length}" y1="${y+16}" y2="${y+16}" stroke="${colors[i]}" stroke-width="9"/><circle cx="${left+length}" cy="${y+16}" r="5" fill="${colors[i]}"/>`;
        out+=text(right,y+35,a.stable.includes(i)?'Δg = 0 · 最低':`高出 ${fmt(d)}`,'end');
      });svg.innerHTML=out;
    }
    function drawCoexist(a){
      const svg=$('coexist');
      if(mode==='free'||mode==='triple'){$('coexist-note').textContent=mode==='triple'?'三相点只有一个共同温压。点“汽化线”，再拖动上方压强，观察共同高度怎样离开三相点。':'先点“汽化线”或在“更多情景”中选另一条共存线。';svg.innerHTML='';svg.setAttribute('height',80);$('line-takeaway').textContent=mode==='triple'?'三相点：三相 g 都是 0。':'共存线要求两相同时达到最低化学势。';return;}
      const low=mode==='sg'?.2:1,high=mode==='sg'?1:mode==='lg'?2.03:2.4,data=Array.from({length:101},(_,i)=>M.boundary(mode,low+(high-low)*i/100)),vals=data.map(z=>z.min),ylo=Math.min(...vals),yhi=Math.max(...vals),pad=Math.max(.01,(yhi-ylo)*.1),f=frame(svg,low,high,ylo-pad,yhi+pad,'p/pt','实际共同 g',320);
      let out=f.out+line(data.map(z=>[f.X(z.p),f.Y(z.min)]),'#173b63',3);
      out+=`<circle cx="${f.X(p)}" cy="${f.Y(a.min)}" r="6" fill="#173b63" stroke="white" stroke-width="2"/>`+text(f.X(1),f.Y(0)-9,'★');svg.innerHTML=out;
      $('coexist-note').textContent=`当前共同 g = ${fmt(a.min)}；三相点参考值为 0。上方压强控制同时移动相图和此图中的点。`;
      $('line-takeaway').textContent=`${a.stable.map(i=>names[i]).join('与')}在同一点等高，但共同高度随温压变化。这里始终使用实际 g，方便沿线比较。`;
    }
    function section(a,axis){const isP=axis==='p',svg=$('section-'+axis),lo=isP?.2:.7,hi=isP?2.4:1.3,states=Array.from({length:101},(_,i)=>{const x=lo+(hi-lo)*i/100;return {x,a:M.state(isP?t:x,isP?x:p)};});
      const values=states.flatMap(z=>z.a.mu),low=Math.min(...values),high=Math.max(...values),pad=(high-low)*.07;
      const f=frame(svg,lo,hi,low-pad,high+pad,isP?'π = p/pt':'θ = T/Tt','g = μ/(RTt)'),{X,Y}=f;let out=f.out;
      out+=line(states.map(z=>[X(z.x),Y(z.a.min)]),'#b4bec4',6);
      names.forEach((_,i)=>{out+=line(states.map(z=>[X(z.x),Y(z.a.mu[i])]),colors[i],2,dash[i]);});
      const x=isP?p:t;out+=line([[X(x),Y(low-pad)],[X(x),Y(high+pad)]],'#526777',1,'3 4');a.mu.forEach((u,i)=>{out+=`<circle cx="${X(x)}" cy="${Y(u)}" r="${5-i}" fill="${colors[i]}"/>`;});
      svg.innerHTML=out;
    }
    const fractions=x=>x.map((v,i)=>`${names[i]} ${fmt(v*100,1)}%`).join(' · ');
    function update(saveState=true){
      align();const a=M.state(t,p);
      [1,2,3].forEach(i=>{$('panel-'+i).hidden=step!==i;});
      root.querySelectorAll('[data-step]').forEach(b=>b.setAttribute('aria-current',b.closest('.tp-steps')&&+b.dataset.step===step?'step':'false'));
      const questions=['哪个相更稳定？先比较三张曲面的高低。','沿共存线移动，两相的共同高度会变吗？','温压不动，改变的是什么？'];
      const instructions=['选择一个情景。三张曲面位于同一坐标系；调大高度差、拖动改变视角，比较同一温压处的三个圆点。','选择汽化线，拖动压强。左边追踪温压位置，右边追踪真正的共同化学势。','先设初态，再选择允许的平衡终态，最后拖动转化进度。'];
      $('question').textContent=questions[step-1];$('instruction').textContent=instructions[step-1];
      $('tune').hidden=mode!=='free';$('tune').setAttribute('aria-expanded',String(tuning));$('state-controls').hidden=mode==='triple'||(mode==='free'&&!tuning);$('t').value=t;$('p').min=mode==='sg'||mode==='free'?.2:1;$('p').max=mode==='sg'?1:mode==='lg'?2.03:2.4;$('p').value=p;
      $('tbox').hidden=mode!=='free';$('pbox').hidden=mode==='triple';$('tv').textContent=fmt(t);$('pv').textContent=fmt(p);$('plabel').textContent=mode==='free'?'压强 p/pt':'沿线移动：压强 p/pt';
      $('locked').textContent=mode==='triple'?'固定三相点：T/Tt = 1，p/pt = 1。':mode!=='free'?`沿共存线自动求温度：T/Tt = ${fmt(t)}。`:'图中温度、压强均以三相点作单位。';
      $('layer').value=['all','envelope'].includes(layer)?layer:'all';cameraControls();$('extension').checked=ext;
      const relation=a.stable.map(i=>names[i]).join(' + ')+(a.stable.length>1?'共存':'稳定');
      $('state').textContent=`${relation} · T/Tt = ${fmt(t)}，p/pt = ${fmt(p)} · 最低 g = ${fmt(a.min)}`;
      root.querySelectorAll('[data-preset]').forEach(b=>{let selected=b.dataset.preset===mode;if(mode==='free'){const presets={liquid:[1.08,1.7],solid:[.9,1.3],gas:[1.2,.6]};selected=presets[b.dataset.preset]?.every((x,i)=>Math.abs(x-[t,p][i])<1e-9)||false;}b.setAttribute('aria-pressed',String(selected));});
      $('rows').innerHTML=names.map((name,i)=>`<tr data-stable="${a.stable.includes(i)}"><th scope="row">${name}${a.stable.includes(i)?' ✓':''}</th><td>${fmt(a.mu[i])}</td><td>${fmt(a.s[i])}</td><td>${fmt(a.v[i])}</td><td>${fmt(a.h[i])}</td></tr>`).join('');
      if(step===1){drawMap(a);drawSurface(a);drawHeights(a);}
      if(step===2){drawMap(a,'path-map');drawCoexist(a);if($('sections').open){section(a,'p');section(a,'t');}}
      const initial=M.normalize(weights),vertices=M.solutions(a),target=M.choose(vertices,q,r),current=initial.map((x,i)=>x*(1-progress)+target[i]*progress),g=M.mix(current,a.mu),gap=Math.max(0,g-a.min);
      weights.forEach((x,i)=>{$('x'+i).value=x;$('xv'+i).textContent=fmt(x,1)+'%';});
      if(document.activeElement!==$('n'))$('n').value=n;
      $('q').value=q;$('r').value=r;$('qbox').hidden=vertices.length===1;$('qv').textContent=fmt(q*100,0)+'%';$('rv').textContent=fmt(r*100,0)+'%';$('rbox').hidden=vertices.length!==3;
      $('qlabel').textContent=vertices.length===3?'余下液气中，气相占比':vertices.length===2?`终态${names[a.stable[1]]}比例`:'终态比例';
      $('initial').textContent='初态：'+fractions(initial);
      $('target').textContent=fractions(target)+(vertices.length>1?'。这些相等高，终态比例可自行选择。':'。当前温压下的平衡终态唯一。');
      $('progress').value=progress;$('progressv').textContent=fmt(progress*100,0)+'%';$('bar').innerHTML=current.map((x,i)=>`<span style="width:${x*100}%;background:${colors[i]}"></span>`).join('');$('bar').setAttribute('aria-label',fractions(current));
      $('energy').innerHTML=`<strong>${fractions(current)}</strong><div class="tp-energy-result"><span>当前 G/(nRTt)<b>${fmt(g)}</b></span><span>平衡最低值<b>${fmt(a.min)}</b></span><span>距平衡的自由能差<b>${fmt(gap)}</b></span></div>`;
      $('constraint').value=constraint;if(document.activeElement!==$('total'))$('total').value=total;$('choice').value=choice;$('totalbox').hidden=constraint==='none';$('choicebox').hidden=true;
      const out=$('constraint-result');out.classList.remove('tp-warn');
      if(constraint==='none')out.textContent=`仅固定温压和总量：平衡相比例有 ${Math.max(0,vertices.length-1)} 个自由参数。`;
      else{const vals=a[constraint],min=Math.min(...a.stable.map(i=>vals[i])),max=Math.max(...a.stable.map(i=>vals[i])),sol=M.solutions(a,constraint,total/n),chosen=M.choose(sol,choice),unit=constraint==='v'?'Vpt/(RTt)':'H/(RTt)';$('total-label').textContent=`目标 ${unit} / mol`;
        if(!sol.length){out.classList.add('tp-warn');out.textContent=`当前温压下无可行平衡比例。${unit} 的可行区间为 [${fmt(n*min)}, ${fmt(n*max)}] mol；当前目标 ${fmt(total)} mol。`;}
        else{$('choicebox').hidden=sol.length<2;out.textContent=`${fractions(chosen)}；${unit} = ${fmt(n*M.mix(chosen,vals))} mol。${sol.length===1?'此约束给出唯一终态。':'此约束仍留下一组终态，可拖动控件查看。'}可行总量范围 [${fmt(n*min)}, ${fmt(n*max)}] mol。`;}}
      if(saveState)save();
    }
    function preset(k){progress=0;constraint='none';q=.5;r=.33;tuning=k==='free';
      if(['sl','lg','sg','triple'].includes(k)){mode=k;p=k==='sg'?.6:k==='triple'?1:1.7;weights=[34,33,33];}
      else{mode='free';if(k!=='free')[t,p]=k==='solid'?[.9,1.3]:k==='gas'?[1.2,.6]:[1.08,1.7];weights=[50,50,0];}
      root.querySelector('.tp-more').open=false;update();
    }
    root.querySelectorAll('[data-preset]').forEach(b=>listen(b,'click',()=>preset(b.dataset.preset)));
    root.querySelectorAll('[data-step]').forEach(b=>listen(b,'click',()=>{step=+b.dataset.step;if(step===2&&mode==='free'){mode='lg';p=1.7;progress=0;constraint='none';}update();root.querySelector('.tp-steps').scrollIntoView({block:'start',behavior:'instant'});}));
    listen($('tune'),'click',()=>{tuning=!tuning;update();});
    listen($('home'),'click',()=>{angle=-35;pitch=15;zoom=1;update();});
    for(const [id,factor] of [['zoom-in',1.2],['zoom-out',1/1.2]])listen($(id),'click',()=>{zoom=M.clamp(zoom*factor,.6,2);update();});
    listen($('t'),'input',e=>{t=+e.target.value;progress=0;update();});listen($('p'),'input',e=>{p=+e.target.value;progress=0;update();});
    for(const id of ['map','path-map'])listen($(id),'click',e=>{const svg=$(id),f=svg._frame,rect=svg.getBoundingClientRect(),x=(e.clientX-rect.left)*f.w/rect.width,y=(e.clientY-rect.top)*f.h/rect.height;if(x<f.l||x>f.w-f.rr||y<f.top||y>f.h-f.b)return;mode='free';t=.7+(x-f.l)/(f.w-f.l-f.rr)*.6;p=.2+(f.h-f.b-y)/(f.h-f.b-f.top)*2.2;progress=0;update();});
    for(const id of ['layer','extension','q','r','progress','n','constraint','total','choice'])listen($(id),['layer','extension','constraint'].includes(id)?'change':'input',e=>{const v=e.target.value;
      if(id==='layer')layer=v;if(id==='extension')ext=e.target.checked;if(id==='q')q=+v;if(id==='r')r=+v;if(id==='progress')progress=+v;if(id==='n'){if(!Number.isFinite(+v)||+v<=0||v==='')return;n=M.clamp(+v,.001,1e6);}if(id==='total'){if(!Number.isFinite(+v)||v==='')return;total=+v;}if(id==='choice')choice=+v;
      if(id==='constraint'){constraint=v;if(v!=='none'){const a=M.state(t,p);total=n*a.stable.reduce((s,i)=>s+a[v][i],0)/a.stable.length;}}
      update();});
    for(let i=0;i<3;i++)listen($('x'+i),'input',e=>{weights=M.rebalance(weights,i,+e.target.value/100).map(x=>x*100);progress=0;update();});
    listen($('end'),'click',()=>{progress=1;update();});listen($('reset'),'click',()=>{progress=0;update();});listen($('sections'),'toggle',()=>update(false));
    let cameraFrame=0;
    const wrap=v=>((v+180)%360+360)%360-180;
    function redrawCamera(){cameraControls();cancelAnimationFrame(cameraFrame);cameraFrame=requestAnimationFrame(()=>{if(step===1)drawSurface(M.state(t,p));});}
    for(const id of ['angle','pitch','zoom','gain'])listen($(id),'input',e=>{const v=+e.target.value;if(id==='angle')angle=v;if(id==='pitch')pitch=v;if(id==='zoom')zoom=v;if(id==='gain')gain=v;redrawCamera();save();});
    const surface=$('surface');
    function startGesture(){const ps=[...pointers.values()];drag=ps.length>=2?{distance:Math.hypot(ps[1].x-ps[0].x,ps[1].y-ps[0].y),zoom}:ps.length?{x:ps[0].x,y:ps[0].y,angle,pitch}:null;}
    listen(surface,'pointerdown',e=>{if(e.button!==0)return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});surface.setPointerCapture(e.pointerId);startGesture();});
    listen(surface,'pointermove',e=>{if(!pointers.has(e.pointerId)||!drag)return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});const ps=[...pointers.values()];if(ps.length>=2){const d=Math.hypot(ps[1].x-ps[0].x,ps[1].y-ps[0].y);if(drag.distance>0)zoom=M.clamp(drag.zoom*d/drag.distance,.6,2);}else{angle=wrap(drag.angle+(e.clientX-drag.x)*.45);pitch=M.clamp(drag.pitch+(e.clientY-drag.y)*.45,-85,85);}redrawCamera();});
    for(const event of ['pointerup','pointercancel','lostpointercapture'])listen(surface,event,e=>{pointers.delete(e.pointerId);startGesture();save();});
    const wheel=e=>{e.preventDefault();zoom=M.clamp(zoom*Math.exp(-e.deltaY*(e.deltaMode===1?.035:.0015)),.6,2);redrawCamera();save();};
    surface.addEventListener('wheel',wheel,{passive:false});clean.push(()=>surface.removeEventListener('wheel',wheel));
    listen(surface,'keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Home'].includes(e.key))return;e.preventDefault();if(e.key==='ArrowLeft')angle=wrap(angle-5);if(e.key==='ArrowRight')angle=wrap(angle+5);if(e.key==='ArrowUp')pitch=M.clamp(pitch+5,-85,85);if(e.key==='ArrowDown')pitch=M.clamp(pitch-5,-85,85);if(['+','='].includes(e.key))zoom=M.clamp(zoom*1.1,.6,2);if(e.key==='-')zoom=M.clamp(zoom/1.1,.6,2);if(e.key==='Home'){angle=-35;pitch=15;zoom=1;}redrawCamera();save();});
    let resizeFrame=0;const observer=new ResizeObserver(()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>update(false));});observer.observe(root);dispose=()=>{window.ThreePhaseView.destroy($('gl'));observer.disconnect();cancelAnimationFrame(resizeFrame);cancelAnimationFrame(cameraFrame);clean.forEach(f=>f());};update(false);
  }
  window.ThreePhaseDemo={markup,mount,unmount};
})();
