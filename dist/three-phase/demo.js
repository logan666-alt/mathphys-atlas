(function(){
  'use strict';const M=window.ThreePhaseModel;let dispose;
  const names=M.names,colors=['#366cb1','#16816e','#b26426'],dash=['','7 4','2 4'];
  const fmt=(x,n=4)=>(Math.abs(x)<5e-10?0:x).toFixed(n).replace('-','−');
  const markup=`<section id="tp-demo" aria-label="三相平衡交互演示">
    <div class="tp-presets" role="group" aria-label="选择典型状态"><button data-preset="liquid">液相区：固液初态</button><button data-preset="solid">固相区</button><button data-preset="gas">气相区</button><button data-preset="sl">熔化线</button><button data-preset="lg">汽化线：含固相初态</button><button data-preset="sg">升华线</button><button data-preset="triple">三相点</button></div>
    <div class="tp-controls"><label>状态选择<select id="tp-mode"><option value="free">自由选温压</option><option value="sl">沿熔化线</option><option value="lg">沿汽化线</option><option value="sg">沿升华线</option><option value="triple">固定三相点</option></select></label><label>温度 θ = T/Tt <output id="tp-tv"></output><input id="tp-t" type="range" min=".7" max="1.3" step=".001" value="1.08"></label><label><span id="tp-plabel">压强 π = p/pt</span> <output id="tp-pv"></output><input id="tp-p" type="range" min=".2" max="2.4" step=".001" value="1.7"></label></div>
    <div id="tp-state" class="tp-state" role="status" aria-live="polite"></div>
    <div class="tp-legend"><span style="--phase:var(--solid)">固相 · 实线</span><span style="--phase:var(--liquid)">液相 · 长虚线</span><span style="--phase:var(--gas)">气相 · 点线</span></div>
    <div class="tp-two"><div><h3>T–p 相图：点一下选择温压</h3><svg id="tp-map" class="tp-chart" role="img" aria-label="三相图，相界线是两张最低曲面交线的投影"></svg><label class="tp-check"><input type="checkbox" id="tp-extension">显示高于第三相的两相等高线</label></div><div><h3>同一温压，沿竖线比较三个高度</h3><svg id="tp-surface" class="tp-chart" role="img" aria-label="固液气三张化学势曲面与平衡下包络"></svg><div class="tp-controls"><label>曲面显示<select id="tp-layer"><option value="all">三张候选曲面</option><option value="envelope">平衡下包络</option><option value="0">仅固相曲面</option><option value="1">仅液相曲面</option><option value="2">仅气相曲面</option></select></label><label>旋转视角 <input type="range" id="tp-angle" min="-150" max="150" step="1" value="-35"></label></div></div></div>
    <p class="tp-note">相图底色表示稳定相。粗黑线为真正相界；三维图中黑色曲线为共存交线，圆点表示所选温压下的高度，★ 是三相点。三张曲面共用固定的化学势参考零点。</p>
    <table class="tp-table"><caption>当前 θ、π 下的摩尔量（无量纲）</caption><thead><tr><th>相</th><th>g = μ/(RTt)</th><th>s = Sm/R</th><th>v</th><th>h</th></tr></thead><tbody id="tp-rows"></tbody></table>
    <div class="tp-two"><div><h3>恒温截面：斜率 ∂g/∂π = v</h3><svg id="tp-section-p" class="tp-chart" role="img" aria-label="固定所选温度的化学势压强截面"></svg></div><div><h3>恒压截面：斜率 ∂g/∂θ = −s</h3><svg id="tp-section-t" class="tp-chart" role="img" aria-label="固定所选压强的化学势温度截面"></svg></div></div>
    <h2>固定温压，改变相比例</h2><p>初始摩尔分数由下面三个非负权重归一化。总物质的量固定；条形长度表示摩尔分数。</p>
    <div class="tp-controls">${names.map((n,i)=>`<label>${n}初始权重<input type="range" id="tp-x${i}" min="0" max="100" step="1" value="${[50,50,0][i]}"></label>`).join('')}<label>总物质的量 n / mol<input id="tp-n" type="number" min=".001" max="1000000" step=".1" value="1"></label></div>
    <p class="tp-values" id="tp-initial"></p><div class="tp-controls"><label>平衡终态中的气相分配参数 <output id="tp-qv"></output><input type="range" id="tp-q" min="0" max="1" step=".01" value=".5"></label><label id="tp-rbox">三相点终态固相比例 <output id="tp-rv"></output><input type="range" id="tp-r" min="0" max="1" step=".01" value=".33"></label></div>
    <p id="tp-target" class="tp-values"></p><div class="tp-controls"><label>转化进度（非时间）<output id="tp-progressv"></output><input type="range" id="tp-progress" min="0" max="1" step=".01" value="0"></label><button type="button" id="tp-end" class="button">到所选平衡终态</button><button type="button" id="tp-reset" class="button outline">回到初态</button></div>
    <div id="tp-bar" class="tp-mixbar" role="img" aria-label="当前三相摩尔分数"></div><div id="tp-energy" class="tp-values" aria-live="polite"></div>
    <div class="tp-equilibrium"><h3>为平衡终态增加一个总量条件</h3><div class="tp-controls"><label>附加条件<select id="tp-constraint"><option value="none">仅固定 T、p、n</option><option value="v">指定总体积 V</option><option value="h">指定总焓 H</option></select></label><label id="tp-totalbox">目标总量 / 对应尺度<input id="tp-total" type="number" step=".01" value=".5"></label><label id="tp-choicebox">在可行终态之间移动<input id="tp-choice" type="range" min="0" max="1" step=".01" value=".5"></label></div><p id="tp-constraint-result" class="tp-values" aria-live="polite"></p></div>
  </section>`;
  function unmount(){if(dispose){dispose();dispose=null;}}
  function mount(){
    unmount();const root=document.getElementById('tp-demo');if(!root)return;const $=id=>root.querySelector('#tp-'+id),clean=[];
    const params=new URLSearchParams(location.hash.split('?')[1]||'');
    const read=(k,d,a,b)=>params.has(k)&&params.get(k).trim()&&Number.isFinite(+params.get(k))?M.clamp(+params.get(k),a,b):d;
    let t=read('t',1.08,.7,1.3),p=read('p',1.7,.2,2.4),mode=params.get('mode')||'free',angle=read('angle',-35,-150,150),layer=params.get('layer')||'all',ext=params.get('ext')==='1';
    if(!['free','sl','lg','sg','triple'].includes(mode))mode='free';if(!['all','envelope','0','1','2'].includes(layer))layer='all';
    let weights=[0,1,2].map(i=>read('x'+i,[50,50,0][i],0,100)),n=read('n',1,.001,1e6),q=read('q',.5,0,1),r=read('r',.33,0,1),progress=read('progress',0,0,1),constraint=params.get('constraint')||'none',total=read('total',.5,-1e8,1e8),choice=read('choice',.5,0,1);
    if(!['none','v','h'].includes(constraint))constraint='none';
    const listen=(el,event,fn)=>{el.addEventListener(event,fn);clean.push(()=>el.removeEventListener(event,fn));};
    function save(){const s=new URLSearchParams({t,p,mode,angle,layer,ext:ext?'1':'0',n,q,r,progress,constraint,total,choice});weights.forEach((x,i)=>s.set('x'+i,x));history.replaceState(null,'','#/resource/three-phase?'+s);}
    function align(){if(mode==='triple'){t=1;p=1;}else if(mode!=='free'){p=M.clamp(p,mode==='sg'?.2:1,mode==='sg'?1:mode==='lg'?2.03:2.4);t=M.boundary(mode,p).t;}}
    const line=(points,stroke,width=2,d='')=>`<path d="${points.map((a,i)=>(i?'L':'M')+a.map(v=>v.toFixed(2)).join(',')).join(' ')}" fill="none" stroke="${stroke}" stroke-width="${width}" ${d?`stroke-dasharray="${d}"`:''}/>`;
    const text=(x,y,s,anchor='middle',cls='')=>`<text x="${x}" y="${y}" text-anchor="${anchor}" class="${cls}">${s}</text>`;
    function frame(svg,xlo,xhi,ylo,yhi,xname,yname,height=270){const w=Math.max(230,svg.getBoundingClientRect().width),h=height,l=52,rr=16,top=32,b=42;svg.setAttribute('viewBox',`0 0 ${w} ${h}`);svg.setAttribute('height',h);
      const X=x=>l+(x-xlo)/(xhi-xlo)*(w-l-rr),Y=y=>h-b-(y-ylo)/(yhi-ylo)*(h-b-top);let out='';
      for(let i=0;i<4;i++){const x=xlo+(xhi-xlo)*i/3,y=ylo+(yhi-ylo)*i/3;out+=`<path class="grid" d="M${X(x)} ${top}V${h-b}M${l} ${Y(y)}H${w-rr}"/>`+text(X(x),h-b+19,fmt(x,2))+text(l-7,Y(y)+4,fmt(y,2),'end');}
      out+=`<path class="axis" d="M${l} ${top}V${h-b}H${w-rr}"/>`+text(w-rr,h-4,xname,'end')+text(l,15,yname,'start');return {w,h,l,rr,top,b,X,Y,out,xlo,xhi,ylo,yhi};}
    function drawMap(a){const svg=$('map'),f=frame(svg,.7,1.3,.2,2.4,'θ = T/Tt','π = p/pt',320),{X,Y}=f;let out='';
      for(let i=0;i<60;i++)for(let j=0;j<55;j++){const tt=.7+.6*(i+.5)/60,pp=.2+2.2*(j+.5)/55,idx=M.state(tt,pp).stable[0];out+=`<rect x="${X(tt-.005)}" y="${Y(pp+.02)}" width="${(f.w-f.l-f.rr)/60+.5}" height="${(f.h-f.b-f.top)/55+.5}" fill="${colors[idx]}" opacity=".13"/>`;}
      out+=f.out;
      for(const k of ['sl','lg','sg']){let stable=[],unstable=[];for(let j=0;j<=220;j++){const pp=.2+2.2*j/220,z=M.boundary(k,pp);if(z.t<.7||z.t>1.3)continue;(M.physical(k,pp)?stable:unstable).push([X(z.t),Y(pp)]);}out+=line(stable,'#243947',2.5);if(ext)out+=line(unstable,'#7c8891',1.3,'4 5');}
      out+=text(X(.83),Y(1.85),'固相','middle','phase-label')+text(X(1.16),Y(2.1),'液相','middle','phase-label')+text(X(1.15),Y(.52),'气相','middle','phase-label');
      out+=text(X(1)-9,Y(1)+5,'★','end')+text(X(1)-12,Y(1)+22,'三相点','end');out+=`<circle cx="${X(a.t)}" cy="${Y(a.p)}" r="6" class="selected"/>`;
      svg.innerHTML=out;svg._frame=f;
    }
    function drawSurface(a){const svg=$('surface'),w=Math.max(230,svg.getBoundingClientRect().width),h=320,rad=angle*Math.PI/180,c=Math.cos(rad),s=Math.sin(rad),scale=Math.min(w/3.7,115);
      svg.setAttribute('viewBox',`0 0 ${w} ${h}`);svg.setAttribute('height',h);
      const project=(tt,pp,g)=>{const x=(tt-1)/.3,y=(pp-1.3)/1.1;return [w/2+scale*(x*c-y*s),169+scale*.34*(x*s+y*c)-g*29];};
      const depth=(tt,pp)=>(tt-1)/.3*s+(pp-1.3)/1.1*c;
      let out='',polys=[];
      for(let i=0;i<16;i++)for(let j=0;j<18;j++){
        const tt=.7+.6*i/16,pp=.2+2.2*j/18,dt=.6/16,dp=2.2/18;
        const ids=layer==='all'?[0,1,2]:layer==='envelope'?[M.state(tt+dt/2,pp+dp/2).stable[0]]:[+layer];
        for(const k of ids){const points=[[tt,pp],[tt+dt,pp],[tt+dt,pp+dp],[tt,pp+dp]].map(([x,y])=>{const z=M.state(x,y);return project(x,y,layer==='envelope'?z.min:z.mu[k]);});polys.push({depth:depth(tt,pp),k,points});}
      }
      polys.sort((a,b)=>a.depth-b.depth);for(const poly of polys)out+=`<polygon points="${poly.points.map(x=>x.join(',')).join(' ')}" fill="${colors[poly.k]}" fill-opacity="${layer==='all'?.16:.62}" stroke="${colors[poly.k]}" stroke-opacity=".28" stroke-width=".5"/>`;
      for(const k of ['sl','lg','sg']){const points=[];for(let j=0;j<=100;j++){const pp=.2+2.2*j/100,z=M.boundary(k,pp);if(z.t>=.7&&z.t<=1.3&&M.physical(k,pp))points.push(project(z.t,z.p,z.min));}out+=line(points,'#263d50',2);}
      out+=line([project(t,p,Math.min(...a.mu)-.4),project(t,p,Math.max(...a.mu)+.4)],'#394858',1.3,'3 3');
      a.mu.forEach((g,i)=>{const [x,y]=project(t,p,g);out+=`<circle cx="${x}" cy="${y}" r="${6-i}" fill="${colors[i]}" stroke="white" stroke-width="1"/>`;});
      const star=project(1,1,0);out+=text(star[0]-8,star[1]-8,'★');
      out+=text(8,17,'g = μ/(RTt)','start')+text(8,35,'共用零点：三相点 g = 0','start');
      const ax=project(.7,.2,-2.6),at=project(1.3,.2,-2.6),ap=project(.7,2.4,-2.6);out+=line([at,ax,ap],'#74828b',1)+text(at[0],at[1]+16,'θ')+text(ap[0],ap[1]+16,'π');
      const az=project(.7,.2,2);out+=line([ax,az],'#74828b',1);for(const z of [-2,0,2]){const pt=project(.7,.2,z);out+=text(pt[0]-6,pt[1]+4,z,'end');}
      svg.innerHTML=out;
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
    function update(saveState=true){align();const a=M.state(t,p);$('mode').value=mode;$('t').value=t;$('p').min=mode==='sg'||mode==='free'?.2:1;$('p').max=mode==='sg'?1:mode==='lg'?2.03:2.4;$('p').value=p;$('t').disabled=mode!=='free';$('p').disabled=mode==='triple';$('tv').textContent=fmt(t);$('pv').textContent=fmt(p);$('plabel').textContent=mode==='free'?'压强 π = p/pt':'沿线压强 π = p/pt';$('layer').value=layer;$('angle').value=angle;$('extension').checked=ext;
      $('state').textContent=`${a.stable.map(i=>names[i]).join(' + ')}${a.stable.length>1?'共存':'稳定'}；平衡下包络 g = ${fmt(a.min)}。${a.stable.length>1?'此点的共存相等高；沿线移动时查看这个共同读数。':'较高的分支表示同温同压下的候选相。'}`;
      root.querySelectorAll('[data-preset]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.preset===mode)));
      $('rows').innerHTML=names.map((name,i)=>`<tr data-stable="${a.stable.includes(i)}"><th scope="row">${name}${a.stable.includes(i)?' ✓':''}</th><td>${fmt(a.mu[i])}</td><td>${fmt(a.s[i])}</td><td>${fmt(a.v[i])}</td><td>${fmt(a.h[i])}</td></tr>`).join('');
      drawMap(a);drawSurface(a);section(a,'p');section(a,'t');
      const initial=M.normalize(weights),vertices=M.solutions(a),target=M.choose(vertices,q,r),current=initial.map((x,i)=>x*(1-progress)+target[i]*progress),g=M.mix(current,a.mu),gap=Math.max(0,g-a.min);
      weights.forEach((x,i)=>$('x'+i).value=x);$('n').value=n;$('q').value=q;$('r').value=r;$('q').disabled=vertices.length===1;$('qv').textContent=fmt(q,2);$('rv').textContent=fmt(r,2);$('rbox').hidden=vertices.length!==3;
      // For solid-liquid coexistence q selects liquid; for the other two-phase lines it selects gas.
      $('q').parentElement.firstChild.textContent=vertices.length===2&&a.stable[1]===1?'平衡终态液相比例 ':'平衡终态气相分配参数 ';
      $('initial').textContent='初态：'+fractions(initial)+(weights.every(x=>x===0)?'（全零权重按三相等分处理）':'');$('target').textContent='可选平衡终态：'+fractions(target)+(vertices.length>1?'。仅凭 T、p、n，比例仍可调整。':'。此处平衡终态唯一。');
      $('progress').value=progress;$('progressv').textContent=fmt(progress*100,0)+'%';$('bar').innerHTML=current.map((x,i)=>`<span style="width:${x*100}%;background:${colors[i]}"></span>`).join('');$('bar').setAttribute('aria-label',fractions(current));
      $('energy').innerHTML=`<strong>${fractions(current)}</strong><br>G/(nRTt) = ${fmt(g)}；平衡值 = ${fmt(a.min)}；ΔG/(nRTt) = ${fmt(gap)}<br>总 ΔG/(RTt) = ${fmt(n*gap)} mol；θ = ${fmt(t)}、π = ${fmt(p)} 保持不变。`;
      $('constraint').value=constraint;$('total').value=total;$('choice').value=choice;$('totalbox').hidden=constraint==='none';$('choicebox').hidden=true;
      const out=$('constraint-result');out.classList.remove('tp-warn');
      if(constraint==='none')out.textContent=`仅固定温压和总量：平衡相比例有 ${Math.max(0,vertices.length-1)} 个自由参数。上方控件可选择其中一个终态。`;
      else{const vals=a[constraint],min=Math.min(...a.stable.map(i=>vals[i])),max=Math.max(...a.stable.map(i=>vals[i])),sol=M.solutions(a,constraint,total/n),chosen=M.choose(sol,choice),unit=constraint==='v'?'Vpt/(RTt)':'H/(RTt)';$('totalbox').firstChild.textContent=`目标 ${unit} / mol `;
        if(!sol.length){out.classList.add('tp-warn');out.textContent=`当前 θ、π 下无可行平衡比例。${unit} 的可行区间为 [${fmt(n*min)}, ${fmt(n*max)}] mol；当前目标 ${fmt(total)} mol。改变温压或目标总量后重新求解。`;}
        else{$('choicebox').hidden=sol.length<2;out.textContent=`${fractions(chosen)}；${unit} = ${fmt(n*M.mix(chosen,vals))} mol。${sol.length===1?'此约束给出唯一终态。':'此约束仍留下一组终态，可拖动控件查看。'}可行总量范围 [${fmt(n*min)}, ${fmt(n*max)}] mol。`;}}
      if(saveState)save();
    }
    root.querySelectorAll('[data-preset]').forEach(b=>listen(b,'click',()=>{const k=b.dataset.preset;progress=0;constraint='none';q=.5;r=.33;if(['sl','lg','sg','triple'].includes(k)){mode=k;p=k==='sg'?.6:k==='triple'?1:1.7;weights=[34,33,33];}else{mode='free';[t,p]=k==='solid'?[.9,1.3]:k==='gas'?[1.2,.6]:[1.08,1.7];weights=[50,50,0];}update();}));
    listen($('mode'),'change',e=>{mode=e.target.value;progress=0;update();});listen($('t'),'input',e=>{t=+e.target.value;progress=0;update();});listen($('p'),'input',e=>{p=+e.target.value;progress=0;update();});
    listen($('map'),'click',e=>{const f=$('map')._frame,rect=$('map').getBoundingClientRect(),x=(e.clientX-rect.left)*f.w/rect.width,y=(e.clientY-rect.top)*f.h/rect.height;if(x<f.l||x>f.w-f.rr||y<f.top||y>f.h-f.b)return;mode='free';t=.7+(x-f.l)/(f.w-f.l-f.rr)*.6;p=.2+(f.h-f.b-y)/(f.h-f.b-f.top)*2.2;progress=0;update();});
    for(const id of ['angle','layer','extension','q','r','progress','n','constraint','total','choice'])listen($(id),['layer','extension','constraint'].includes(id)?'change':'input',e=>{const v=e.target.value;
      if(id==='angle')angle=+v;if(id==='layer')layer=v;if(id==='extension')ext=e.target.checked;if(id==='q')q=+v;if(id==='r')r=+v;if(id==='progress')progress=+v;if(id==='n'){if(!Number.isFinite(+v)||+v<=0||v==='')return;n=M.clamp(+v,.001,1e6);}if(id==='total'){if(!Number.isFinite(+v)||v==='')return;total=+v;}if(id==='choice')choice=+v;
      if(id==='constraint'){constraint=v;if(v!=='none'){const a=M.state(t,p);total=n*a.stable.reduce((s,i)=>s+a[v][i],0)/a.stable.length;}}
      update();});
    weights.forEach((_,i)=>listen($('x'+i),'input',e=>{weights[i]=+e.target.value;progress=0;update();}));listen($('end'),'click',()=>{progress=1;update();});listen($('reset'),'click',()=>{progress=0;update();});
    let resizeFrame=0;const observer=new ResizeObserver(()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>update(false));});observer.observe(root);dispose=()=>{observer.disconnect();cancelAnimationFrame(resizeFrame);clean.forEach(f=>f());};update(false);
  }
  window.ThreePhaseDemo={markup,mount,unmount};
})();
