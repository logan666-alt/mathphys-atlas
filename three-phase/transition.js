(function(){
  'use strict';
  const M=window.PhaseTransitionModel;
  const formulas={
    chain:String.raw`\mu=G_m,\qquad S_m=-\left(\frac{\partial\mu}{\partial T}\right)_p,\qquad C_{p,m}=T\left(\frac{\partial S_m}{\partial T}\right)_p=-T\left(\frac{\partial^2\mu}{\partial T^2}\right)_p`,
    derivation:String.raw`dG=-S\,dT+V\,dp+\mu\,dn,\quad G=n\mu\quad\Longrightarrow\quad d\mu=-S_m\,dT+V_m\,dp`,
    heat:String.raw`H_m=\mu+TS_m,\quad dH_m=T\,dS_m+V_m\,dp,\quad C_{p,m}=\left(\frac{\partial H_m}{\partial T}\right)_p=T\left(\frac{\partial S_m}{\partial T}\right)_p`,
    latent:String.raw`\Delta\mu=0,\quad L_m=\Delta H_m=T_*\Delta S_m,\quad C_{p,m}^{\rm eq}=C_{p,m}^{\rm reg}+L_m\,\delta(T-T_*)`,
    entropy:String.raw`S_m(T_2)-S_m(T_1)=\int_{T_1}^{T_2}\frac{C_{p,m}^{\rm reg}}{T}\,dT+\sum_{T_j\in(T_1,T_2)}\frac{L_{m,j}}{T_j}`,
    scale:String.raw`\tau=T/T_*,\quad g=\mu/(RT_*),\quad s=S_m/R=-g',\quad c=C_{p,m}/R=-\tau g'',\quad h=g+\tau s`,
    residual:String.raw`\widetilde g(\tau)=g(\tau)-g(1)+s_*(\tau-1),\quad \widetilde g'=-s+s_*,\quad \widetilde g''=g''`,
    base:String.raw`g_0=-2(\tau-1)+3(\tau-1-\tau\ln\tau),\quad s_0=2+3\ln\tau,\quad c_0=3`,
    landau:String.raw`g(\tau,\eta)=g_0+\frac a2(\tau-1)\eta^2+\frac b4\eta^4,\quad \eta_{\rm eq}^2=\begin{cases}a(1-\tau)/b,&\tau<1\\0,&\tau\ge1\end{cases}`,
    jump:String.raw`g_{\rm eq}=\begin{cases}g_0-A(\tau-1)^2,&\tau<1\\g_0,&\tau\ge1\end{cases},\quad A=\frac{a^2}{4b}=6,\quad c=\begin{cases}3+12\tau,&\tau<1\\3,&\tau>1\end{cases}`,
    critical:String.raw`x=\tau-1,\quad g=g_0+\frac B2 x^2\ln|x|-\frac{3B}{4}x^2,\quad c=3-B\tau\ln|x|,\quad B=3`,
    example:String.raw`T_*=300\,\mathrm K,\quad\Delta S_m=10\,\mathrm{J\,mol^{-1}K^{-1}}\quad\Longrightarrow\quad L_m=3000\,\mathrm{J\,mol^{-1}}`
  };
  const math=k=>`<div class="formula pt-formula" tabindex="0">${window.katex.renderToString(formulas[k],{displayMode:true,throwOnError:true})}</div>`;
  const markup=`
    <div id="pt-demo" class="pt-demo">
      <div class="pt-definition"><p>沿恒压截面升温，考察单组分平衡态的摩尔量：</p>${math('chain')}<p class="tp-note">μ：J/mol；Sₘ、Cₚ,ₘ：J/(mol·K)。一阶、二阶指自由能的导数阶数；“发生变化”与“在相变点不连续”要分开判断。</p></div>
      <div class="pt-modes" role="group" aria-label="相变类型">
        <button type="button" data-pt-mode="first">一级相变<span>斜率跳变 → 熵跃变</span></button>
        <button type="button" data-pt-mode="jump">连续相变 · 热容跳跃<span>斜率连续 → 曲率跳变</span></button>
        <button type="button" data-pt-mode="critical">连续相变 · 热容发散<span>斜率连续 → 曲率发散</span></button>
      </div>
      <div id="pt-first-controls" class="tp-controls pt-first-controls">
        <label>原三相模型中的相界<select id="pt-kind" aria-label="一级相变过程"><option value="lg">汽化：液 → 气</option><option value="sl">熔化：固 → 液</option><option value="sg">升华：固 → 气</option></select></label>
        <label>固定压强 p/pt <output id="pt-pressure-value"></output><input id="pt-pressure" type="range" aria-label="相变截面固定压强" step=".01" min="1.05" max="2" value="1.7"></label>
        <button type="button" id="pt-back" class="button outline">在三维曲面中看此共存点</button>
      </div>
      <p class="tp-note" id="pt-model-note"></p>
      <div class="pt-temperature">
        <label for="pt-temperature">共同温度游标 <strong id="pt-temperature-value"></strong></label>
        <input id="pt-temperature" type="range" min="-1000" max="1000" step="1" value="-400" aria-label="相对相变温度">
        <div class="pt-stops" role="group" aria-label="观察相变点两侧"><button type="button" data-pt-stop="-400">相变前</button><button type="button" data-pt-stop="0">正好在相变点</button><button type="button" data-pt-stop="400">相变后</button></div>
      </div>
      <div class="pt-mix" id="pt-mixture" hidden><label for="pt-fraction">固定 T = T*，高温相比例 <output id="pt-fraction-value"></output></label><input id="pt-fraction" type="range" min="0" max="1" step=".01" value=".5" aria-label="共存时高温相比例"><p id="pt-mixture-note"></p></div>
      <p id="pt-status" class="pt-status" role="status" aria-live="polite"></p>
      <div class="pt-options"><label class="tp-check"><input id="pt-residual" type="checkbox">减去共同直线，放大弯曲</label><label class="tp-check"><input id="pt-area" type="checkbox">将热容图切换为 Cₚ/T，观察熵变面积</label></div>
      <p id="pt-axis-note" class="tp-note"></p>
      <div class="pt-legend"><span class="pt-low" id="pt-low-name"></span><span class="pt-high" id="pt-high-name"></span><span>虚线：局部切线 / 相变位置</span><span>在任一图内横向拖动，可同步移动游标</span></div>
      <div class="pt-chart-row"><div class="pt-chart-copy"><h3>① 高度：化学势</h3><p id="pt-g-readout"></p><p class="tp-note" id="pt-g-explain"></p></div><svg id="pt-g" class="tp-chart" role="img" aria-label="恒压化学势与切线，和下方熵热容共用温度游标"></svg></div>
      <div class="pt-chart-row"><div class="pt-chart-copy"><h3>② 负斜率：熵</h3><p id="pt-s-readout"></p><p class="tp-note" id="pt-s-explain"></p></div><svg id="pt-s" class="tp-chart" role="img" aria-label="熵曲线与化学势一阶导数"></svg></div>
      <div class="pt-chart-row"><div class="pt-chart-copy"><h3>③ 曲率：热容</h3><p id="pt-c-readout"></p><p class="tp-note" id="pt-c-explain"></p></div><svg id="pt-c" class="tp-chart" role="img" aria-label="热容曲线与化学势二阶导数"></svg></div>
      <div class="pt-integral"><h3>从图的左端升温到游标：熵增加了多少？</h3><p id="pt-integral-value" class="pt-equation-value"></p><p id="pt-integral-note"></p></div>
      <div class="pt-table-scroll"><table class="tp-table pt-summary"><caption>相变点处，逐阶检查同一个平衡自由能</caption><thead><tr><th>比较项</th><th>一级相变（本例）</th><th>连续相变（本例）</th></tr></thead><tbody><tr><th>μ 的高度</th><td>连续，两相等高</td><td>连续</td></tr><tr><th>∂μ/∂T = −Sₘ</th><td>左右斜率不同，ΔSₘ ≠ 0</td><td>左右斜率相同，ΔSₘ = 0</td></tr><tr><th>−T ∂²μ/∂T² = Cₚ,ₘ</th><td>相内热容 + 潜热 δ 项</td><td>有限跳跃或临界发散</td></tr><tr><th>潜热 T*ΔSₘ</th><td>非零</td><td>零</td></tr></tbody></table></div>
      <details class="pt-proof"><summary>推导：为什么斜率是熵，曲率是热容？</summary>
        <p>对单组分、仅有体积功的宏观均匀体系，G 的广延性给出 G = nμ。把 d(nμ) 与热力学基本关系比较，消去 μdn：</p>${math('derivation')}
        <p>固定 p 后，dμ = −SₘdT，因此 μ–T 图的切线斜率为 −Sₘ。再由 Hₘ = μ + TSₘ 求微分，代入上式：</p>${math('heat')}
        <p>于是 Cₚ,ₘ = −Tμ″。温度为正时，正热容对应 μ″ &lt; 0，即曲线向下凹；同一温度下，二阶导数越负，热容越大。图上的几何弯曲还受坐标尺度影响，应结合数值判断。</p>
        <p>本步把相变温度记为 T*，图中使用无量纲量：</p>${math('scale')}
        <p>开启“减去共同直线”后，只改变图的高度和斜率基准，二阶导数保持不变；读数仍给出原化学势的导数。</p>${math('residual')}
      </details>
      <details class="pt-proof"><summary>熵跃变、潜热与热容曲线的面积</summary>
        <p>在一级相变温度，两相的 μ 相等，熵的左右极限不同。Hₘ = μ + TSₘ 随之给出潜热；在理想平衡恒压加热曲线上，有限热量在同一温度用于改变相比例：</p>${math('latent')}
        <p>因此本例两相内部即使都有 Cₚ,ₘ = 3R，整体加热过程仍包含潜热。图中的竖箭头表示 δ 项：有确定面积，箭头高度只作标记。它不能当作一个有限高度的热容读数。</p>${math('entropy')}
        <p>可逆恒压过程中 δQₘ = TdSₘ；同一温度的潜热贡献为 Lₘ/T*。例如：</p>${math('example')}
        <p>从低温相变为高温相一半时，摩尔熵增加 5 J/(mol·K)，吸热 1500 J/mol，温度仍为 300 K。相变完成后，再输入热量才沿高温相曲线继续升温。</p>
        <p>连续相变的 ΔSₘ = 0 表示相变点的左右极限相等。跨越一个有限温区，熵仍按 ∫(Cₚ,ₘ/T)dT 改变；即使热容对数发散，这个积分也可收敛。</p>
      </details>
      <details class="pt-proof"><summary>连续相变的模型、分类与观察路径</summary>
        <p>连续相变使用独立的恒压局部示例。共同光滑背景为：</p>${math('base')}
        <p>热容跳跃来自 Landau 平均场模型，a、b &gt; 0，η 是序参量。先对 η 求平衡极小值，再对平衡自由能求温度导数：</p>${math('landau')}${math('jump')}
        <p>在 τ = 1，两侧 g 和 g′ 相接，而 g″ 的左右极限为 −15、−3，因此热容从 15R 变为 3R，潜热为零。这是 Ehrenfest 意义下的二级相变。</p>
        <p>对数发散示例直接指定一个热力学一致的局部自由能，令 x²ln|x| 在 x = 0 连续延拓为零：</p>${math('critical')}
        <p>此时 g、g′ 连续，g″ → −∞。它示范连续相变可以具有发散的响应；不同连续相变还可能出现尖点或其他临界行为。判断一般相变也要看其他控制变量的导数，如 Vₘ = (∂μ/∂p)T，不能只凭某一条路径上的热容图判定所有体系。</p>
        <p>这里取固定压强、固定其他外场的升温路径。沿共存线移动时 p 随 T 变，dμ/dT = −Sₘ + Vₘ(dp/dT)，斜率不能直接读作 −Sₘ。前三步的三相点是三相共存点；本步的连续相变模型另行定义。</p>
        <p>参考：<a href="https://www.damtp.cam.ac.uk/user/tong/statphys/statmechhtml/S4.html" target="_blank" rel="noopener noreferrer">David Tong · Classical Thermodynamics</a>（Gibbs 自由能与热容）；<a href="https://www.damtp.cam.ac.uk/user/tong/sft/sfthtml/S1.html" target="_blank" rel="noopener noreferrer">From Spins to Fields</a>（平衡自由能、连续相变和临界行为）。</p>
      </details>
    </div>`;
  const fmt=(x,n=3)=>x===null?'无唯一值':!Number.isFinite(x)?(x<0?'−∞':'∞'):(Math.abs(x)<.5*10**-n?0:x).toFixed(n).replace('-','−');
  const phaseColors=['#366cb1','#16816e','#b26426'],roleColors=['#16816e','#b26426'];
  function mount(host,{params,onChange,onSurface,pressure=1.7}){
    const root=host.querySelector('#pt-demo'),$=name=>root.querySelector('#pt-'+name),clean=[];
    const number=(key,fallback,lo,hi)=>params.has(key)&&params.get(key).trim()&&Number.isFinite(+params.get(key))?Math.max(lo,Math.min(hi,+params.get(key))):fallback;
    let mode=params.get('ptmode')||'first',kind=params.get('ptkind')||'lg',p=number('ptp',pressure,.25,2),position=number('ptpos',-400,-1000,1000),fraction=number('ptx',.5,0,1),residual=params.get('ptres')==='1',area=params.get('ptarea')==='1';
    if(!['first','jump','critical'].includes(mode))mode='first';if(!['sl','lg','sg'].includes(kind))kind='lg';
    const listen=(el,event,fn)=>{el.addEventListener(event,fn);clean.push(()=>el.removeEventListener(event,fn));};
    const text=(x,y,value,anchor='start',cls='')=>`<text x="${x}" y="${y}" text-anchor="${anchor}" class="${cls}">${value}</text>`;
    const line=(points,color,width=2,dash='')=>`<path d="${points.map((v,i)=>(i?'L':'M')+v.map(x=>x.toFixed(3)).join(',')).join(' ')}" fill="none" stroke="${color}" stroke-width="${width}" ${dash?`stroke-dasharray="${dash}"`:''}/>`;
    const dot=(x,y,color,hollow=false,r=4)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${hollow?'var(--paper,#fff)':color}" stroke="${color}" stroke-width="2"/>`;
    function frame(svg,m,low,high,name){
      const w=Math.max(200,svg.getBoundingClientRect().width),h=228,l=54,r=16,top=30,bottom=39;
      svg.setAttribute('viewBox',`0 0 ${w} ${h}`);svg.setAttribute('height',h);
      const X=t=>l+(t-m.lo)/(m.hi-m.lo)*(w-l-r),Y=y=>h-bottom-(y-low)/(high-low)*(h-top-bottom);
      let out='';
      const tickCount=w<360?2:4;
      for(let i=0;i<=tickCount;i++){const t=m.lo+(m.hi-m.lo)*i/tickCount;out+=text(X(t),h-19,fmt(t,m.width<.012?4:3),'middle');}
      for(let i=0;i<4;i++){const y=low+(high-low)*i/3;out+=`<path class="grid" d="M${l} ${Y(y)}H${w-r}"/>`+text(l-7,Y(y)+4,fmt(y,Math.abs(high-low)<.1?3:1),'end');}
      const label=svg.id==='pt-c'&&w<380?(area?'c/τ':'c'):name;
      out+=`<path class="axis" d="M${l} ${top}V${h-bottom}H${w-r}"/>`+text(l,16,label)+text(w-r,h-2,'τ = T/T*','end');
      out+=line([[X(1),top],[X(1),h-bottom]],'#8d989e',1,'4 4');
      const clip='pt-clip-'+svg.id;
      out+=`<defs><clipPath id="${clip}"><rect x="${l}" y="${top}" width="${w-l-r}" height="${h-top-bottom}"/></clipPath></defs>`;
      return {w,h,l,r,top,bottom,X,Y,out,clip,low,high};
    }
    function samples(m,side){
      const a=side<0?m.lo:1,b=side<0?1:m.hi;
      const ts=Array.from({length:121},(_,i)=>a+(b-a)*i/120);
      if(m.mode==='critical')for(const factor of [.01,.003,.001,.0003,.0001,.00001])ts.push(1+side*m.width*factor);
      return ts.sort((a,b)=>a-b).map(t=>m.at(t,side));
    }
    function draw(m,tau,current){
      const colors=m.first?m.ids.map(i=>phaseColors[i]):roleColors;
      const parts=[samples(m,-1),samples(m,1)];
      const gv=z=>z.g-(residual?m.gref-m.sref*(z.tau-1):0);
      for(const id of ['g','s','c']){
        const value=z=>id==='g'?gv(z):id==='s'?z.s:z.cp===null?null:area?z.cp/z.tau:z.cp;
        const all=parts.flat().map(value).filter(Number.isFinite),min=Math.min(...all),max=Math.max(...all),pad=Math.max((max-min)*.16,id==='g'?.00001:.12);
        const low=id==='c'?0:min-pad,high=id==='c'?(m.first?6:m.mode==='critical'?26:19):max+pad;
        const svg=$(id),f=frame(svg,m,low,high,id==='g'?(residual?'g̃：偏离共同直线':'g = μ/(RT*)'):id==='s'?'s = Sₘ/R':area?'c/τ = T*Cₚ,ₘ/(RT)':'c = Cₚ,ₘ/R');
        const {X,Y}=f;let marks='';
        // The only filled region is an integral. The delta contribution is separate.
        if(id==='c'&&area)for(let i=0;i<2;i++){
          const start=i===0?m.lo:1,end=Math.min(tau,i===0?1:m.hi);if(end<=start)continue;
          const segment=parts[i].filter(z=>z.tau>=start&&z.tau<=end&&Number.isFinite(value(z))).map(z=>[X(z.tau),Y(value(z))]);
          const endpoint=m.at(end,i===0?-1:1);if(Number.isFinite(value(endpoint)))segment.push([X(end),Y(value(endpoint))]);
          if(segment.length)marks+=`<path d="M${X(start)} ${Y(0)} ${segment.map(v=>'L'+v.join(' ')).join(' ')} L${segment[segment.length-1][0]} ${Y(0)}Z" fill="${colors[i]}" opacity=".17"/>`;
        }
        for(let i=0;i<2;i++){
          const points=parts[i].filter(z=>Number.isFinite(value(z))).map(z=>[X(z.tau),Y(value(z))]);marks+=line(points,colors[i],3);
        }
        // Tangents are to the same potential used for all derivatives.
        if(id==='g'){
          const tangents=current.d1===null?[m.left,m.right]:[current];
          tangents.forEach((z,i)=>{const span=m.width*.24,slope=z.d1+(residual?m.sref:0),a=Math.max(m.lo,tau-span),b=Math.min(m.hi,tau+span);marks+=line([[X(a),Y(gv(z)+slope*(a-tau))],[X(b),Y(gv(z)+slope*(b-tau))]],tangents.length>1?colors[i]:'#657988',1.8,'5 4');});
        }
        marks+=line([[X(tau),f.top],[X(tau),f.h-f.bottom]],'#173b63',1.4,'2 4');
        const y=value(current);
        if(id==='s'&&m.first){marks+=line([[X(1),Y(m.left.s)],[X(1),Y(m.right.s)]],'#7b858d',1.3,'3 3');marks+=dot(X(1),Y(m.left.s),colors[0],true)+dot(X(1),Y(m.right.s),colors[1],true);}
        if(id==='c'&&m.mode==='jump'){for(const [i,z] of [m.left,m.right].entries())marks+=dot(X(1),Y(value(z)),colors[i],true);}
        if(y!==null&&Number.isFinite(y))marks+=dot(X(tau),Y(y),'#173b63',false,5);
        let annotation='';
        if(id==='c'&&m.first){const x=X(1),tip=f.top+8,base=Y(3);marks+=line([[x,base],[x,tip]],'#173b63',2.5)+line([[x-5,tip+9],[x,tip],[x+5,tip+9]],'#173b63',2.5);annotation=text(f.w-f.r,16,'δ 项面积 = '+fmt(m.jump),'end');}
        if(id==='c'&&m.mode==='critical'){for(const sign of [-1,1]){const x=X(1)+sign*7;marks+=line([[x,f.top+24],[x,f.top+3]],colors[sign<0?0:1],2)+line([[x-4,f.top+9],[x,f.top+3],[x+4,f.top+9]],colors[sign<0?0:1],2);}annotation=text(f.w-f.r,16,'↑ ∞（超出纵轴）','end');}
        svg.innerHTML=f.out+`<g clip-path="url(#${f.clip})">${marks}</g>`+annotation;
        svg._ptFrame=f;
        svg.setAttribute('aria-label',id==='g'?`化学势 ${fmt(current.g)}；导数 ${fmt(current.d1)}`:id==='s'?`熵 ${fmt(current.s)}；相变熵跃变 ${fmt(m.jump)}`:`热容 ${fmt(current.cp)}；${m.first?'包含潜热δ项':m.mode==='jump'?'两侧极限15与3':'临界点发散'}`);
      }
    }
    function render(){
      const m=M.create(mode,kind,p);p=m.p;
      const tau=1+m.width*position/1000,current=m.at(tau,0,fraction),atPoint=position===0,integral=m.accumulated(tau,fraction);
      $('first-controls').hidden=!m.first;$('mixture').hidden=!m.first;$('fraction').disabled=!atPoint;
      $('kind').value=kind;$('pressure').min=kind==='sg'?.25:1.05;$('pressure').max=kind==='sg'?.95:2;$('pressure').value=p;$('pressure-value').textContent=fmt(p,2);
      $('temperature').value=position;$('temperature-value').textContent=`T/T* = ${fmt(tau,5)} · ${current.phase}`;
      $('fraction').value=fraction;$('fraction-value').textContent=fmt(fraction*100,0)+'%';
      $('fraction').setAttribute('aria-valuetext',`高温相 ${fmt(fraction*100,0)}%`);
      $('temperature').setAttribute('aria-valuetext',`T/T* ${fmt(tau,5)}，${current.phase}`);
      $('residual').checked=residual;$('area').checked=area;
      root.querySelectorAll('[data-pt-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.ptMode===mode)));
      root.querySelectorAll('[data-pt-stop]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.ptStop===position)));
      const names=m.first?m.ids.map(i=>window.ThreePhaseModel.names[i]):['低温相','高温相'];
      const colors=m.first?m.ids.map(i=>phaseColors[i]):roleColors;root.style.setProperty('--pt-low',colors[0]);root.style.setProperty('--pt-high',colors[1]);
      $('low-name').textContent=names[0];$('high-name').textContent=names[1];
      $('model-note').textContent=m.first?`沿用三张曲面的同一模型。此恒压截面的相变温度 T*/Tt = ${fmt(m.tc,5)}；局部窗口只跨越${names.join('–')}相界。`:'恒压局部示例，T* = Tc。'+(mode==='jump'?'采用 Landau 平均场平衡自由能。':'采用含 x²ln|x| 项的局部自由能。');
      $('axis-note').textContent=residual?`纵轴 g̃ = g − g(1) + s*(τ − 1)，s* = ${fmt(m.sref)}；图上斜率为 −s + s*，曲率不变。下列读数仍使用原 g 的导数。`:'上图绘制实际 g = μ/(RT*)，切线斜率为 −s；三图共用温度轴和游标。';
      $('mixture-note').textContent=atPoint?`从纯${names[0]}开始转化：ΔSₘ/R = ${fmt(fraction*m.jump)}，Qₘ/(RT*) = ${fmt(fraction*m.latent)}；温度保持 T*。`:'点击“正好在相变点”后，可在固定温度下改变相比例，观察熵增与潜热。';
      $('g-readout').textContent=`g = ${fmt(current.g,5)}；g′ = ${current.d1===null?'左右 '+fmt(m.left.d1)+' / '+fmt(m.right.d1):fmt(current.d1)}`;
      $('g-explain').textContent=m.first?'两相在 T* 等高；平衡曲线接起两条斜率不同的分支，出现折角。':mode==='jump'?'两侧高度和切线相接；改变的是切线随温度转动的速率。':'高度和切线连续；靠近 Tc，切线随温度变化越来越快。';
      $('s-readout').textContent=`s = ${fmt(current.s)}；相变点 Δs = ${fmt(m.jump)}`;
      $('s-explain').textContent=m.first?`−g′ 的左右极限为 ${fmt(m.left.s)} 和 ${fmt(m.right.s)}。在共存点，熵随相比例改变。`:'相变点左右熵相等。离开该点继续升温，熵仍会改变。';
      $('c-readout').textContent=`g″ = ${fmt(current.d2)}；c = ${fmt(current.cp)}`;
      $('c-explain').textContent=m.first?'相内 c = 3；δ 项的面积是 Lₘ/(RT*) = Δs，竖箭头的高度只作标记。':mode==='jump'?'在 Tc：c 的左极限为 15，右极限为 3；g″ 分别为 −15 和 −3。':'τ → 1 时，g″ → −∞，c → +∞；图中截去超出纵轴的部分。';
      $('status').textContent=atPoint?(m.first?'μ 连续，斜率无唯一值。拖动相比例，观察固定温度下的熵增和吸热。':mode==='jump'?'μ 与斜率连续；二阶导数、热容在此点无唯一值，读取左右极限。':'μ 与斜率连续；二阶导数发散，熵保持有限，潜热为零。'):(m.first?`${position<0?'尚未':'已经'}跨过相界；相内的光滑弯曲与相界处的斜率跳变可以同时存在。`:'移动到 τ = 1，比较左右切线与热容；“连续”描述相变处的衔接。');
      $('integral-value').textContent=m.first?`ΔSₘ/R = ${fmt(integral.regularEntropy)}（相内积分） + ${fmt(integral.latentEntropy)}（相变贡献） = ${fmt(integral.entropy)}`:`ΔSₘ/R = ∫ c/τ dτ = ${fmt(integral.entropy)}；相变点熵跃变 = 0`;
      $('integral-note').textContent=`起点 τ = ${fmt(m.lo,5)}；可逆恒压吸热 Qₘ/(RT*) = Δh = ${fmt(integral.heat)}。`+(area?'阴影表示相内的 ∫ c/τ dτ。'+(m.first?'相变贡献单列在上式中。':mode==='critical'?'超出纵轴的部分仍计入积分读数。':''):'勾选“观察熵变面积”，可把这项积分显示在第三张图中。');
      if(!host.hidden)draw(m,tau,current);
    }
    const change=()=>{render();onChange();};
    root.querySelectorAll('[data-pt-mode]').forEach(b=>listen(b,'click',()=>{mode=b.dataset.ptMode;change();}));
    root.querySelectorAll('[data-pt-stop]').forEach(b=>listen(b,'click',()=>{position=+b.dataset.ptStop;change();}));
    listen($('temperature'),'input',e=>{position=+e.target.value;change();});
    listen($('fraction'),'input',e=>{fraction=+e.target.value;change();});
    listen($('kind'),'change',e=>{kind=e.target.value;p=kind==='sg'?.6:1.7;change();});
    listen($('pressure'),'input',e=>{p=+e.target.value;change();});
    listen($('residual'),'change',e=>{residual=e.target.checked;change();});
    listen($('area'),'change',e=>{area=e.target.checked;change();});
    listen($('back'),'click',()=>onSurface(kind,p));
    for(const id of ['g','s','c']){
      const svg=$(id);let pointer=null;
      const move=e=>{const f=svg._ptFrame;if(!f)return;const bounds=svg.getBoundingClientRect(),x=(e.clientX-bounds.left)*f.w/bounds.width;let v=Math.round((x-f.l)/(f.w-f.l-f.r)*2000-1000);if(Math.abs(v)<15)v=0;position=Math.max(-1000,Math.min(1000,v));change();};
      listen(svg,'pointerdown',e=>{if(e.button!==0)return;pointer=e.pointerId;svg.setPointerCapture(pointer);move(e);});
      listen(svg,'pointermove',e=>{if(pointer===e.pointerId)move(e);});
      for(const event of ['pointerup','pointercancel','lostpointercapture'])listen(svg,event,()=>{pointer=null;});
    }
    return {render,serialize:()=>({ptmode:mode,ptkind:kind,ptp:p,ptpos:position,ptx:fraction,ptres:residual?1:0,ptarea:area?1:0}),destroy:()=>clean.forEach(f=>f())};
  }
  window.PhaseTransitionDemo={markup,mount,formulas};
})();
