/* Native site module adapted from the original chain-rule visualization. */
(function () {
  'use strict';
  let dispose = null;
  const markup = `<div id="thermo-chain-01a10002">
  <h3>同一点的斜率与等压路径</h3>
  <div class="tc-model text-small">pV = T · X = TV · 基准 A：T₀ = V₀ = p₀ = X₀ = 1（归一化）</div>
  <div class="viz-controls">
    <label class="form-label">当前动作
      <select class="form-select" id="tc-scene">
        <option value="0">起点：看三个方向</option>
        <option value="1">1 · 定容：从 A 改变 T</option>
        <option value="2">2 · 定温：从 A 改变 V</option>
        <option value="3">3 · 等压：T 带动 V</option>
        <option value="4">4 · 等压位移的同步分解</option>
        <option value="5">5 · 路径对照：先从 A 到 B</option>
        <option value="6">6 · 路径对照：再从 B 到 D</option>
      </select>
    </label>
    <label class="form-label" for="tc-step">小步长 ΔT：<output id="tc-step-value" class="tabular-nums">0.100</output>
      <input class="form-range" id="tc-step" type="range" min="0.005" max="0.25" step="0.005" value="0.1">
    </label>
  </div>
  <div class="viz-row tc-actions">
    <button class="button outline" type="button" id="tc-prev">上一步</button>
    <button class="button" type="button" id="tc-next">下一步</button>
    <button class="button outline" type="button" id="tc-play">播放本步</button>
    <button class="text-button" type="button" id="tc-restart">从头重播</button>
  </div>
  <div id="tc-detail" class="tc-detail" aria-live="polite"></div>
  <div class="tc-plot" id="tc-plot-wrap">
    <svg class="tc-svg" id="tc-plot" role="img" aria-labelledby="tc-chart-title tc-chart-desc">
      <title id="tc-chart-title">温度与体积平面中的约束方向</title>
      <desc id="tc-chart-desc">横轴为温度 T，纵轴为体积 V。底色越深，X 等于 T 乘 V 越大。定容方向水平，定温方向竖直，等压方向沿 V 等于 T。</desc>
    </svg>
  </div>
  <div class="tc-key text-small">
    <span><i class="tc-line tc-pressure"></i>等压 p 固定</span>
    <span><i class="tc-line tc-temperature"></i>定容 V 固定</span>
    <span><i class="tc-line tc-volume"></i>定温 T 固定</span>
    <span id="tc-projection-key" hidden><i class="tc-line tc-project"></i>虚线：坐标投影</span>
    <span><i class="tc-shade"></i>底色：X 越深越大</span>
  </div>
  <div class="tc-current tabular-nums" id="tc-current"></div>
  <div class="tc-slope-section">
    <div class="text-small tc-label">等压链式法则：所有导数均取基准点 A</div>
    <div class="tc-equation tabular-nums" aria-label="在基准点 A，等压导数等于定容导数，加上定温导数乘以等压下的体积温度导数。数值为二等于一加一乘一。">
      <span>(∂X/∂T)<sub>p,A</sub><br><strong>2</strong></span>
      <span>=</span>
      <span><i class="tc-line tc-temperature"></i>(∂X/∂T)<sub>V,A</sub><br><strong>1</strong></span>
      <span>+</span>
      <span><i class="tc-line tc-volume"></i>(∂X/∂V)<sub>T,A</sub> × (∂V/∂T)<sub>p,A</sub><br><strong>1 × 1</strong></span>
    </div>
  </div>
  <div class="tc-change-section">
    <div class="text-small tc-label" id="tc-change-title">用 A 的两个斜率分解小位移</div>
    <div class="tc-contributions tabular-nums">
      <span><i class="tc-line tc-temperature"></i>T 贡献：1 × <span id="tc-dt">0</span> = <span id="tc-ct">0</span></span>
      <span><i class="tc-line tc-volume"></i>V 贡献：1 × <span id="tc-dv">0</span> = <span id="tc-cv">0</span></span>
      <span>一阶和 = <strong id="tc-sum">0</strong></span>
    </div>
    <div class="tc-bar" role="img" id="tc-bar" aria-label="两个坐标方向对一阶变化的贡献">
      <div id="tc-bar-t"></div><div id="tc-bar-v"></div>
    </div>
    <div class="tc-finite text-small tabular-nums" id="tc-finite"></div>
    <div class="tc-measured text-small tabular-nums" id="tc-measured"></div>
  </div>
  <div id="tc-announcer" class="sr-only" aria-live="polite"></div>
</div>`;
  function unmount() { if(dispose) { const fn=dispose; dispose=null; fn(); } }
  function mount() {
    unmount();
    const cleanups=[];
    function listen(el,event,handler) { el.addEventListener(event,handler); cleanups.push(()=>el.removeEventListener(event,handler)); }
    const resizeObserver = new ResizeObserver(()=>drawBackground());

  const root = document.getElementById('thermo-chain-01a10002');
  if (!root) return;
  const $ = id => root.querySelector('#' + id);
  const svg = $('tc-plot');
  const ns = 'http://www.w3.org/2000/svg';
  const names = ['基准点与方向', '定容：从 A 改变 T', '定温：从 A 改变 V', '等压：T 带动 V', '等压位移的同步分解', '路径对照：先从 A 到 B', '路径对照：再从 B 到 D'];
  const details = [
    'A 是共同起点；三个方向分别对应固定 V、固定 T、固定 p。',
    'V 始终为 1：横向测量 (∂X/∂T)ᵥ,A = 1；压力随 T 改变。',
    '重新从 A 出发，T 始终为 1：纵向测量 (∂X/∂V)ₜ,A = 1。',
    'p 始终为 1，V = T；选定 T 就确定 V，只剩 1 个独立变量。',
    '从 A 重播等压位移；两个分量同时展开，实心点只沿等压线移动。',
    '实际两段路径的第一段：从 A 水平走到 B，压力上升。',
    '实际第二段从 B 出发；纵向斜率取 Tᴮ，终点 D 与等压移动相同。'
  ];
  const colorT = 'var(--viz-series-2)';
  const colorV = 'var(--viz-series-3)';
  const colorP = 'var(--viz-series-1)';
  let scene = 0, h = .1, q = 0, running = false, raf = 0, lastTime = 0;
  let geo = null, dynamicGroup = null;
  const clamp = (v,a,b) => Math.min(b,Math.max(a,v));
  const fmt = (n, digits = 5) => {
    if (Math.abs(n) < 1e-10) return '0';
    return n.toFixed(digits).replace(/0+$/, '').replace(/\.$/, '');
  };
  const tickfmt = n => fmt(n, h < .025 ? 4 : 3);
  function element(tag, attrs = {}, parent = svg, text) {
    const e = document.createElementNS(ns, tag);
    Object.entries(attrs).forEach(([k,v]) => e.setAttribute(k,String(v)));
    if (text !== undefined) e.textContent = text;
    parent.appendChild(e);
    return e;
  }
  function values() {
    const s = h*q;
    let dt = 0, dv = 0;
    if (scene === 1 || scene === 5) dt = s;
    if (scene === 2) dv = s;
    if (scene === 3 || scene === 4) dt = dv = s;
    if (scene === 6) { dt = h; dv = s; }
    const T = 1+dt, V = 1+dv;
    return {T,V,p:T/V,X:T*V,dt,dv,ct:dt,cv:dv,sum:dt+dv,remainder:dt*dv,deltaX:dt+dv+dt*dv};
  }
  function save() {
    const params = new URLSearchParams(location.hash.split('?')[1] || '');
    params.set('cs',scene); params.set('ch',h.toFixed(3)); params.set('cq',q.toFixed(4));
    history.replaceState(null,'','#/resource/thermo-chain-rule?'+params.toString());
  }
  function restore() {
    const p = new URLSearchParams(location.hash.split('?')[1] || '');
    if(p.has('cs') && Number.isFinite(Number(p.get('cs')))) scene=clamp(Math.round(Number(p.get('cs'))),0,6);
    if(p.has('ch') && Number.isFinite(Number(p.get('ch')))) h=clamp(Math.round(Number(p.get('ch'))/.005)*.005,.005,.25);
    if(p.has('cq') && Number.isFinite(Number(p.get('cq')))) q=clamp(Number(p.get('cq')),0,1);
  }
  function buttons() {
    $('tc-prev').disabled = scene === 0;
    $('tc-next').disabled = scene === 6;
    $('tc-play').disabled = scene === 0;
    $('tc-play').textContent = running ? '暂停' : q >= 1 ? '重播本步' : q > 0 ? '继续本步' : '播放本步';
  }
  function drawBackground() {
    const w = Math.max(200,$('tc-plot-wrap').getBoundingClientRect().width);
    const height = clamp(w*.51,296,370);
    svg.setAttribute('viewBox',`0 0 ${w} ${height}`);
    svg.setAttribute('height',height);
    svg.querySelectorAll(':scope > :not(title):not(desc)').forEach(e => e.remove());
    const m = {left:68,right:18,top:29,bottom:46};
    const pw = w-m.left-m.right, ph = height-m.top-m.bottom;
    const low = 1-1.1*h, high = 1+2.1*h;
    const x = T => m.left+(T-low)/(high-low)*pw;
    const y = V => m.top+ph-(V-low)/(high-low)*ph;
    geo = {w,height,m,pw,ph,low,high,x,y};
    const defs = element('defs');
    [colorP,colorT,colorV].forEach((c,i) => {
      const marker = element('marker',{id:'tc-arrow-'+i,viewBox:'0 0 9 9',refX:8,refY:4.5,markerWidth:6,markerHeight:6,orient:'auto',markerUnits:'strokeWidth'},defs);
      element('path',{d:'M0 0 L9 4.5 L0 9 Z',fill:c},marker);
    });
    const clip = element('clipPath',{id:'tc-clip'},defs);
    element('rect',{x:m.left,y:m.top,width:pw,height:ph},clip);
    const bg = element('g',{'clip-path':'url(#tc-clip)','aria-hidden':'true'});
    const xlo = low*low, xhi = high*high, bands = 40;
    element('rect',{x:m.left,y:m.top,width:pw,height:ph,fill:'var(--foreground)',opacity:.025},bg);
    for (let band=1;band<=bands;band++) {
      const threshold = xlo+(xhi-xlo)*band/bands;
      const pts = [];
      for(let j=0;j<=80;j++) {
        const T = low+(high-low)*j/80;
        pts.push(`${x(T).toFixed(2)},${y(clamp(threshold/T,low,high)).toFixed(2)}`);
      }
      const d = `M${x(low)},${y(high)} L${pts.join(' L')} L${x(high)},${y(high)} Z`;
      const previous = .025+.19*(band-1)/bands;
      element('path',{d,fill:'var(--foreground)',opacity:(.19/bands/(1-previous)).toFixed(5)},bg);
    }
    const ticks = [1-h,1,1+h,1+2*h];
    ticks.forEach(t => {
      element('line',{x1:x(t),y1:m.top,x2:x(t),y2:m.top+ph,class:'tc-grid'},bg);
      element('line',{x1:m.left,y1:y(t),x2:m.left+pw,y2:y(t),class:'tc-grid'},bg);
      element('text',{x:x(t),y:height-26,'text-anchor':'middle','data-tick':'x'},svg,tickfmt(t));
      element('text',{x:m.left-9,y:y(t)+4,'text-anchor':'end','data-tick':'y'},svg,tickfmt(t));
    });
    element('line',{x1:x(low),y1:y(1),x2:x(high),y2:y(1),stroke:colorT,class:'tc-reference'},bg);
    element('line',{x1:x(1),y1:y(low),x2:x(1),y2:y(high),stroke:colorV,class:'tc-reference'},bg);
    element('line',{x1:x(low),y1:y(low),x2:x(high),y2:y(high),stroke:colorP,class:'tc-reference'},bg);
    element('rect',{x:m.left,y:m.top,width:pw,height:ph,class:'tc-frame','data-chart-frame':''});
    element('text',{x:m.left,y:16},svg,w<360?'局部放大':'局部放大 · 图与色阶随步长缩放');
    element('text',{x:m.left+pw,y:height-6,'text-anchor':'end',class:'axis-title','data-axis':'x'},svg,'T（归一化）');
    element('text',{x:15,y:m.top+ph/2,'text-anchor':'middle',transform:`rotate(-90 15 ${m.top+ph/2})`,class:'axis-title','data-axis':'y'},svg,'V（归一化）');
    dynamicGroup = element('g',{'data-current-visual':''});
    drawDynamic();
  }
  function drawDynamic() {
    if (!geo || !dynamicGroup) return;
    const {x,y} = geo;
    dynamicGroup.replaceChildren();
    const v = values();
    function line(t1,v1,t2,v2,color,klass='tc-trail',arrow=false) {
      const attrs = {x1:x(t1),y1:y(v1),x2:x(t2),y2:y(v2),stroke:color,class:klass};
      if (arrow) attrs['marker-end'] = 'url(#tc-arrow-'+(color===colorT?1:color===colorV?2:0)+')';
      return element('line',attrs,dynamicGroup);
    }
    function dot(T,V,color,label,ghost=false) {
      const attrs = {cx:x(T),cy:y(V),r:ghost?4:5.2,fill:ghost?'var(--background)':color,stroke:color,'stroke-width':1.8};
      const point = element('circle',attrs,dynamicGroup);
      point.setAttribute('aria-label',`${label}：T=${fmt(T)}，V=${fmt(V)}，p=${fmt(T/V)}，X=${fmt(T*V)}`);
    }
    function letter(text,T,V,dx,dy,anchor='start') {
      element('text',{x:x(T)+dx,y:y(V)+dy,'text-anchor':anchor,class:'tc-letter'},dynamicGroup,text);
    }
    if (scene === 0) {
      line(1,1,1+h,1,colorT,'tc-component',true);
      line(1,1,1,1+h,colorV,'tc-component',true);
      line(1,1,1+h,1+h,colorP,'tc-component',true);
      letter('V 固定',1+h,1,0,20,'middle');
      letter('T 固定',1,1+h,-9,-8,'end');
      letter('p 固定',1+h,1+h,0,-11,'middle');
    }
    if (scene === 1 || scene === 5) {
      if(q>0) line(1,1,v.T,1,colorT);
      dot(v.T,1,colorT,'当前状态');
      if(q>.12) letter('B',v.T,1,7,20);
    }
    if (scene === 2) {
      if(q>0) line(1,1,1,v.V,colorV);
      dot(1,v.V,colorV,'当前状态');
      if(q>.12) letter('C',1,v.V,-9,-8,'end');
    }
    if (scene === 3 || scene === 4) {
      if(q>0) line(1,1,v.T,v.V,colorP);
      dot(v.T,v.V,colorP,'D：等压状态');
      if(q>.12) letter('D',v.T,v.V,8,-9);
      if(scene===4 && q>0) {
        line(1,1,v.T,1,colorT,'tc-component',true);
        line(1,1,1,v.V,colorV,'tc-component',true);
        line(v.T,1,v.T,v.V,'var(--foreground)','tc-projection');
        line(1,v.V,v.T,v.V,'var(--foreground)','tc-projection');
        dot(v.T,1,colorT,'B：水平投影',true);
        dot(1,v.V,colorV,'C：竖直投影',true);
        if(q>.35) {
          letter('ΔT',1+(v.dt/2),1,0,20,'middle');
          letter('ΔV',1,1+(v.dv/2),-9,4,'end');
        }
      }
    }
    if (scene === 6) {
      line(1,1,1+h,1,colorT);
      if(q>0) line(1+h,1,1+h,v.V,colorV);
      dot(1+h,1,colorT,'B：第二段的起点',true);
      letter('B',1+h,1,7,20);
      dot(1+h,v.V,colorV,'当前状态');
      if(q>.12) letter(q===1?'D':'第二段',1+h,v.V,8,-9);
    }
    dot(1,1,'var(--foreground)','A：共同基准',true);
    letter('A',1,1,-9,19,'end');
    element('text',{x:geo.m.left+7,y:geo.m.top+17},dynamicGroup,scene===0?'空心 A：共同基准':'实心点：实际移动');
  }
  function drawValues() {
    const v = values();
    $('tc-current').innerHTML = `<span>T = ${fmt(v.T)}</span><span>V = ${fmt(v.V)}</span><span>p = ${fmt(v.p)}</span><span>X = ${fmt(v.X)}</span>`;
    $('tc-dt').textContent = fmt(v.dt);
    $('tc-dv').textContent = fmt(v.dv);
    $('tc-ct').textContent = fmt(v.ct);
    $('tc-cv').textContent = fmt(v.cv);
    $('tc-sum').textContent = fmt(v.sum);
    $('tc-bar-t').style.width = 50*v.ct/h+'%';
    $('tc-bar-v').style.width = 50*v.cv/h+'%';
    $('tc-bar').setAttribute('aria-label',`在 A 取斜率，温度贡献${fmt(v.ct)}，体积贡献${fmt(v.cv)}，一阶和${fmt(v.sum)}`);
    $('tc-finite').textContent = `真实有限变化 ΔX = ${fmt(v.deltaX,7)}；比一阶和多 ΔT·ΔV = ${fmt(v.remainder,7)}`;
    let measure = '等压方向：dV/dT = 1；微分给出的斜率为 2。';
    if(scene===1) measure = '定容斜率为 1；ΔT ≠ 0 时，ΔX/ΔT = 1。';
    if(scene===2) measure = '定温斜率为 1；ΔV ≠ 0 时，ΔX/ΔV = 1。';
    if(scene===3 || scene===4) measure = v.dt>0 ? `等压有限比值 ΔX/ΔT = ${fmt(2+v.dt)} → 2（ΔT → 0）。` : 'ΔT = 0 时有限比值未定义；等压导数为其极限 2。';
    if(scene===5) measure = '实际第一段：ΔX₁ = ΔT，p 改变；本段没有保持等压。';
    if(scene===6) measure = `第二段斜率取 B：(∂X/∂V)ₜ,B = ${fmt(1+h)}；ΔX₂ = ${fmt((1+h)*v.dv,7)}。`;
    $('tc-measured').textContent = measure;
    $('tc-change-title').textContent = scene<5 ? '用 A 的两个斜率分解小位移（条长表示一阶贡献）' : '仍用 A 的斜率作一阶分解；实际两段变化另见下方';
    $('tc-chart-desc').textContent = `${details[scene]} 当前 T=${fmt(v.T)}，V=${fmt(v.V)}，p=${fmt(v.p)}，X=${fmt(v.X)}。从 A 的位移 ΔT=${fmt(v.dt)}，ΔV=${fmt(v.dv)}。一阶和为${fmt(v.sum)}，真实变化为${fmt(v.deltaX,7)}。`;
  }
  function drawAll(rebuild=false) {
    $('tc-scene').value = scene;
    $('tc-step').value = h.toFixed(3);
    $('tc-step-value').textContent = h.toFixed(3);
    $('tc-detail').textContent = details[scene];
    $('tc-projection-key').hidden = scene !== 4;
    buttons();
    if(rebuild) drawBackground(); else drawDynamic();
    drawValues();
  }
  function stop(announce=false) {
    cancelAnimationFrame(raf);
    running = false;
    lastTime = 0;
    buttons();
    if(announce) $('tc-announcer').textContent = `${names[scene]}已暂停。`;
  }
  function play() {
    if(scene===0) return;
    if(running) { stop(true); save(); return; }
    if(q>=1) q=0;
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      q=1; drawAll(); $('tc-announcer').textContent = `${names[scene]}完成。`; save(); return;
    }
    running=true;
    lastTime=0;
    buttons();
    save();
    const tick = now => {
      if(!running) return;
      if(lastTime) q = clamp(q+(now-lastTime)/3300,0,1);
      lastTime=now;
      drawDynamic(); drawValues();
      if(q>=1) {
        stop(); $('tc-announcer').textContent = `${names[scene]}完成，已停住。`; save();
      } else raf=requestAnimationFrame(tick);
    };
    raf=requestAnimationFrame(tick);
  }
  function setScene(next,autoplay=false) {
    stop(); scene=clamp(next,0,6); q=0; drawAll();
    if(autoplay) play(); else save();
  }
  listen($('tc-next'),'click',()=>setScene(scene+1,true));
  listen($('tc-prev'),'click',()=>setScene(scene-1));
  listen($('tc-play'),'click',play);
  listen($('tc-restart'),'click',()=>setScene(0));
  listen($('tc-scene'),'change',e=>setScene(Number(e.target.value)));
  listen($('tc-step'),'input',e=>{stop(); h=Number(e.target.value); drawAll(true);});
  listen($('tc-step'),'change',save);
  resizeObserver.observe($('tc-plot-wrap'));
  listen(document,'visibilitychange',()=>{if(document.hidden && running){stop();save();}});
  restore();
  drawAll(true);

    dispose=()=>{stop();resizeObserver.disconnect();cleanups.forEach(fn=>fn());};
  }
  window.ThermoChain={markup,mount,unmount};
})();
