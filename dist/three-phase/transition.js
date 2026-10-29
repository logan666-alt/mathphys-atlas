(function(){
  'use strict';
  const M=window.PhaseTransitionModel;
  const formulas={
    chain:String.raw`S_m=-\left(\frac{\partial\mu}{\partial T}\right)_p,\qquad C_{p,m}=T\left(\frac{\partial S_m}{\partial T}\right)_p=-T\left(\frac{\partial^2\mu}{\partial T^2}\right)_p`,
    derivation:String.raw`dG=-S\,dT+V\,dp+\mu\,dn,\quad G=n\mu\quad\Longrightarrow\quad d\mu=-S_m\,dT+V_m\,dp`,
    heat:String.raw`H_m=\mu+TS_m,\quad dH_m=T\,dS_m+V_m\,dp,\quad C_{p,m}=\left(\frac{\partial H_m}{\partial T}\right)_p=T\left(\frac{\partial S_m}{\partial T}\right)_p`,
    latent:String.raw`\text{每摩尔潜热}=T\left(S_{m,\text{高温相}}-S_{m,\text{低温相}}\right)`,
    entropy:String.raw`S_m(T_2)-S_m(T_1)=\int_{T_1}^{T_2}\frac{C_{p,m}(T)}{T}\,dT`,
    example:String.raw`\text{每摩尔潜热}=300\,\mathrm K\times10\,\mathrm{J\,mol^{-1}K^{-1}}=3000\,\mathrm{J\,mol^{-1}}`
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
        <label>固定压强 p / kPa <output id="pt-pressure-value"></output><input id="pt-pressure" type="range" aria-label="相变截面固定压强，单位kPa" step="1" min="105" max="200" value="170"></label>
        <button type="button" id="pt-back" class="button outline">在三维曲面中看此共存点</button>
      </div>
      <p class="tp-note" id="pt-model-note"></p>
      <div class="pt-temperature">
        <label for="pt-temperature">共同温度游标 <strong id="pt-temperature-value"></strong></label>
        <input id="pt-temperature" type="range" min="276" max="324" step=".001" value="290.4" aria-label="温度，单位K">
        <div class="pt-stops" role="group" aria-label="观察相变点两侧"><button type="button" data-pt-stop="-400">相变前</button><button type="button" data-pt-stop="0">正好在相变点</button><button type="button" data-pt-stop="400">相变后</button></div>
      </div>
      <div class="pt-mix" id="pt-mixture" hidden><label for="pt-fraction">温度固定在相变点，高温相比例 <output id="pt-fraction-value"></output></label><input id="pt-fraction" type="range" min="0" max="1" step=".01" value=".5" aria-label="共存时高温相比例"><p id="pt-mixture-note"></p></div>
      <p id="pt-status" class="pt-status" role="status" aria-live="polite"></p>
      <div class="pt-options"><label class="tp-check"><input id="pt-area" type="checkbox">将热容除以温度，观察熵变面积</label></div>
      <p id="pt-axis-note" class="tp-note"></p>
      <div class="pt-legend"><span class="pt-low" id="pt-low-name"></span><span class="pt-high" id="pt-high-name"></span><span>虚线：局部切线 / 相变位置</span><span>在任一图内横向拖动，可同步移动游标</span></div>
      <div class="pt-chart-row"><div class="pt-chart-copy"><h3>① 高度：化学势</h3><p id="pt-g-readout"></p><p class="tp-note" id="pt-g-explain"></p></div><svg id="pt-g" class="tp-chart" role="img" aria-label="恒压化学势与切线，和下方熵热容共用温度游标"></svg></div>
      <div class="pt-chart-row"><div class="pt-chart-copy"><h3>② 负斜率：熵</h3><p id="pt-s-readout"></p><p class="tp-note" id="pt-s-explain"></p></div><svg id="pt-s" class="tp-chart" role="img" aria-label="熵曲线与化学势一阶导数"></svg></div>
      <div class="pt-chart-row"><div class="pt-chart-copy"><h3>③ 曲率：热容</h3><p id="pt-c-readout"></p><p class="tp-note" id="pt-c-explain"></p></div><svg id="pt-c" class="tp-chart" role="img" aria-label="热容曲线与化学势二阶导数"></svg></div>
      <div class="pt-integral"><h3>从图的左端升温到游标：熵增加了多少？</h3><p id="pt-integral-value" class="pt-equation-value"></p><p id="pt-integral-note"></p></div>
      <div class="pt-table-scroll"><table class="tp-table pt-summary"><caption>相变点处，逐阶检查同一个平衡自由能</caption><thead><tr><th>比较项</th><th>一级相变（本例）</th><th>连续相变（本例）</th></tr></thead><tbody><tr><th>化学势 μ</th><td>连续，两相等高</td><td>连续</td></tr><tr><th>斜率 ∂μ/∂T = −Sₘ</th><td>左右斜率不同，熵发生跃变</td><td>左右斜率相同，熵连续</td></tr><tr><th>热容 Cₚ,ₘ = −T ∂²μ/∂T²</th><td>相内热容，另加相变时的潜热</td><td>有限跳跃或临界发散</td></tr><tr><th>潜热</th><td>非零</td><td>零</td></tr></tbody></table></div>
      <details class="pt-proof"><summary>推导：为什么斜率是熵，曲率是热容？</summary>
        <p>对单组分、仅有体积功的宏观均匀体系，G 的广延性给出 G = nμ。把 d(nμ) 与热力学基本关系比较，消去 μdn：</p>${math('derivation')}
        <p>固定 p 后，dμ = −SₘdT，因此 μ–T 图的切线斜率为 −Sₘ。再由 Hₘ = μ + TSₘ 求微分，代入上式：</p>${math('heat')}
        <p>再对化学势求一次温度导数，就得到负的“热容除以温度”。温度为正时，正热容对应化学势曲线向下凹；同一温度下，二阶导数越负，热容越大。二阶导数的单位为 J/(mol·K²)。</p>
      </details>
      <details class="pt-proof"><summary>熵跃变、潜热与热容曲线的面积</summary>
        <p>在一级相变温度，两相的 μ 相等，熵的左右极限不同。Hₘ = μ + TSₘ 随之给出潜热；在理想平衡恒压加热曲线上，有限热量在同一温度用于改变相比例：</p>${math('latent')}
        <p>这里的 T 就是相变发生时的温度。两相内部的摩尔热容在本例中都是 24.94 J/(mol·K)，相变时还需要吸收潜热。热容图中的竖箭头表示集中在这个温度的热量：面积等于每摩尔潜热，箭头高度只作标记。</p>
        <p>在没有一级相变的温区，把热容除以温度后积分，得到摩尔熵的增加量：</p>${math('entropy')}
        <p>完整跨越一次一级相变，还要加上“每摩尔潜热 ÷ 相变温度”。例如在 300 K 发生相变，两相的摩尔熵相差 10 J/(mol·K)：</p>${math('example')}
        <p>从低温相变为高温相一半时，摩尔熵增加 5 J/(mol·K)，吸热 1500 J/mol，温度仍为 300 K。相变完成后，再输入热量才沿高温相曲线继续升温。</p>
        <p>连续相变中，相变点的左右摩尔熵相等。跨越一个有限温区，熵仍按热容除以温度的积分改变；即使热容对数发散，这个积分也可收敛。</p>
      </details>
      <details class="pt-proof"><summary>连续相变的模型、分类与观察路径</summary>
        <p>两个连续相变教学示例都把相变温度设为 300 K。化学势、熵与热容来自同一个平衡自由能，分别考察它的高度、一阶导数和二阶导数。</p>
        <p>热容跳跃示例采用 Landau 平均场模型。在 300 K，两侧化学势和切线相接；从低温侧接近时，摩尔热容趋于 124.72 J/(mol·K)，从高温侧接近时趋于 24.94 J/(mol·K)。两侧熵相等，潜热为零。这是 Ehrenfest 意义下的二级相变。</p>
        <p>热容发散示例中，化学势和一阶导数仍连续；靠近 300 K 时，二阶导数趋于负无穷，热容趋于正无穷。图中用向上箭头标出超出纵轴的部分。</p>
        <p>连续相变还可能出现尖点或其他临界行为。判断一般相变也要看其他控制变量的导数，如 Vₘ = (∂μ/∂p)T，并结合实际经过的状态路径。</p>
        <p>这里取固定压强、固定其他外场的升温路径。沿共存线移动时 p 随 T 变，dμ/dT = −Sₘ + Vₘ(dp/dT)，斜率不能直接读作 −Sₘ。前三步的三相点是三相共存点；本步的连续相变模型另行定义。</p>
        <p>参考：<a href="https://www.damtp.cam.ac.uk/user/tong/statphys/statmechhtml/S4.html" target="_blank" rel="noopener noreferrer">David Tong · Classical Thermodynamics</a>（Gibbs 自由能与热容）；<a href="https://www.damtp.cam.ac.uk/user/tong/sft/sfthtml/S1.html" target="_blank" rel="noopener noreferrer">From Spins to Fields</a>（平衡自由能、连续相变和临界行为）。</p>
      </details>
    </div>`;
  const fmt=(x,n=3)=>x===null?'无唯一值':!Number.isFinite(x)?(x<0?'−∞':'∞'):(Math.abs(x)<.5*10**-n?0:x).toFixed(n).replace('-','−');
  const phaseColors=['#366cb1','#16816e','#b26426'],roleColors=['#16816e','#b26426'];
  function mount(host,{params,onChange,onSurface,pressure=1.7}){
    const root=host.querySelector('#pt-demo'),$=name=>root.querySelector('#pt-'+name),clean=[],units=window.ThreePhaseModel.units;
    const number=(key,fallback,lo,hi)=>params.has(key)&&params.get(key).trim()&&Number.isFinite(+params.get(key))?Math.max(lo,Math.min(hi,+params.get(key))):fallback;
    let mode=params.get('ptmode')||'first',kind=params.get('ptkind')||'lg',p=number('ptp',pressure,.25,2),position=number('ptpos',-400,-1000,1000),fraction=number('ptx',.5,0,1),area=params.get('ptarea')==='1';
    if(!['first','jump','critical'].includes(mode))mode='first';if(!['sl','lg','sg'].includes(kind))kind='lg';
    const listen=(el,event,fn)=>{el.addEventListener(event,fn);clean.push(()=>el.removeEventListener(event,fn));};
    const text=(x,y,value,anchor='start',cls='')=>`<text x="${x}" y="${y}" text-anchor="${anchor}" class="${cls}">${value}</text>`;
    const line=(points,color,width=2,dash='')=>`<path d="${points.map((v,i)=>(i?'L':'M')+v.map(x=>x.toFixed(3)).join(',')).join(' ')}" fill="none" stroke="${color}" stroke-width="${width}" ${dash?`stroke-dasharray="${dash}"`:''}/>`;
    const dot=(x,y,color,hollow=false,r=4)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${hollow?'var(--paper,#fff)':color}" stroke="${color}" stroke-width="2"/>`;
    const getModel=()=>M.physical(mode,kind,p*units.pressure);
    function frame(svg,m,low,high,name){
      const w=Math.max(200,svg.getBoundingClientRect().width),h=svg.id==='pt-c'?248:228,l=58,r=16,top=svg.id==='pt-c'?50:30,bottom=39;
      svg.setAttribute('viewBox',`0 0 ${w} ${h}`);svg.setAttribute('height',h);
      const X=t=>l+(t-m.lowTemperature)/(m.highTemperature-m.lowTemperature)*(w-l-r),Y=y=>h-bottom-(y-low)/(high-low)*(h-top-bottom);
      let out='';const tickCount=w<360?2:4;
      for(let i=0;i<=tickCount;i++){const t=m.lowTemperature+(m.highTemperature-m.lowTemperature)*i/tickCount;out+=text(X(t),h-19,fmt(t,m.halfWidth<2?2:1),'middle');}
      for(let i=0;i<4;i++){const y=low+(high-low)*i/3;out+=`<path class="grid" d="M${l} ${Y(y)}H${w-r}"/>`+text(l-7,Y(y)+4,fmt(y,Math.abs(high-low)<1?3:1),'end');}
      out+=`<path class="axis" d="M${l} ${top}V${h-bottom}H${w-r}"/>`+text(l,16,name)+text(w-r,h-2,'T / K','end');
      out+=line([[X(m.transitionTemperature),top],[X(m.transitionTemperature),h-bottom]],'#8d989e',1,'4 4');
      const clip='pt-clip-'+svg.id;
      out+=`<defs><clipPath id="${clip}"><rect x="${l}" y="${top}" width="${w-l-r}" height="${h-top-bottom}"/></clipPath></defs>`;
      return {w,h,l,r,top,bottom,X,Y,out,clip,low,high};
    }
    function samples(m,side){
      const a=side<0?m.lowTemperature:m.transitionTemperature,b=side<0?m.transitionTemperature:m.highTemperature;
      const ts=Array.from({length:121},(_,i)=>a+(b-a)*i/120);
      if(m.mode==='critical')for(const factor of [.01,.003,.001,.0003,.0001,.00001])ts.push(m.transitionTemperature+side*m.halfWidth*factor);
      return ts.sort((a,b)=>a-b).map(t=>m.at(t,side));
    }
    function draw(m,temperature,current){
      const colors=m.first?m.ids.map(i=>phaseColors[i]):roleColors,parts=[samples(m,-1),samples(m,1)],transition=m.transitionTemperature;
      for(const id of ['g','s','c']){
        const value=z=>id==='g'?z.mu:id==='s'?z.entropy:z.heatCapacity===null?null:area?z.heatCapacity/z.temperature:z.heatCapacity;
        const all=parts.flat().map(value).filter(Number.isFinite),min=Math.min(...all),max=Math.max(...all),pad=Math.max((max-min)*.16,.01);
        const low=id==='c'?0:min-pad,high=id==='c'?(m.first?2*m.left.heatCapacity:m.mode==='critical'?216:158)/(area?transition:1):max+pad;
        const svg=$(id),f=frame(svg,m,low,high,id==='g'?'μ / (J/mol)':id==='s'?'Sₘ / [J/(mol·K)]':area?'Cₚ,ₘ/T / [J/(mol·K²)]':'Cₚ,ₘ / [J/(mol·K)]');
        const {X,Y}=f;let marks='';
        if(id==='c'&&area)for(let i=0;i<2;i++){
          const start=i===0?m.lowTemperature:transition,end=Math.min(temperature,i===0?transition:m.highTemperature);if(end<=start)continue;
          const segment=parts[i].filter(z=>z.temperature>=start&&z.temperature<=end&&Number.isFinite(value(z))).map(z=>[X(z.temperature),Y(value(z))]);
          const endpoint=m.at(end,i===0?-1:1);if(Number.isFinite(value(endpoint)))segment.push([X(end),Y(value(endpoint))]);
          if(segment.length)marks+=`<path d="M${X(start)} ${Y(0)} ${segment.map(v=>'L'+v.join(' ')).join(' ')} L${segment[segment.length-1][0]} ${Y(0)}Z" fill="${colors[i]}" opacity=".17"/>`;
        }
        for(let i=0;i<2;i++)marks+=line(parts[i].filter(z=>Number.isFinite(value(z))).map(z=>[X(z.temperature),Y(value(z))]),colors[i],3);
        if(id==='g'){
          const tangents=current.slope===null?[m.left,m.right]:[current];
          tangents.forEach((z,i)=>{const span=m.halfWidth*.24,a=Math.max(m.lowTemperature,temperature-span),b=Math.min(m.highTemperature,temperature+span);marks+=line([[X(a),Y(z.mu+z.slope*(a-temperature))],[X(b),Y(z.mu+z.slope*(b-temperature))]],tangents.length>1?colors[i]:'#657988',1.8,'5 4');});
        }
        marks+=line([[X(temperature),f.top],[X(temperature),f.h-f.bottom]],'#173b63',1.4,'2 4');
        if(id==='s'&&m.first){marks+=line([[X(transition),Y(m.left.entropy)],[X(transition),Y(m.right.entropy)]],'#7b858d',1.3,'3 3');marks+=dot(X(transition),Y(m.left.entropy),colors[0],true)+dot(X(transition),Y(m.right.entropy),colors[1],true);}
        if(id==='c'&&m.mode==='jump')for(const [i,z] of [m.left,m.right].entries())marks+=dot(X(transition),Y(value(z)),colors[i],true);
        const y=value(current);if(y!==null&&Number.isFinite(y))marks+=dot(X(temperature),Y(y),'#173b63',false,5);
        let annotation='';
        if(id==='c'&&m.first){const x=X(transition),tip=f.top+8,base=Y(value(m.left));marks+=line([[x,base],[x,tip]],'#173b63',2.5)+line([[x-5,tip+9],[x,tip],[x+5,tip+9]],'#173b63',2.5);annotation=text(f.w-f.r,35,area?'熵跃变：'+fmt(m.entropyJump,2)+' J/(mol·K)':'潜热：'+fmt(m.latentHeat,1)+' J/mol','end');}
        if(id==='c'&&m.mode==='critical'){for(const sign of [-1,1]){const x=X(transition)+sign*7;marks+=line([[x,f.top+24],[x,f.top+3]],colors[sign<0?0:1],2)+line([[x-4,f.top+9],[x,f.top+3],[x+4,f.top+9]],colors[sign<0?0:1],2);}annotation=text(f.w-f.r,35,'↑ ∞（超出纵轴）','end');}
        svg.innerHTML=f.out+`<g clip-path="url(#${f.clip})">${marks}</g>`+annotation;svg._ptFrame=f;
        svg.setAttribute('aria-label',id==='g'?`化学势 ${fmt(current.mu)} J/mol；温度 ${fmt(temperature)} K`:id==='s'?`摩尔熵 ${fmt(current.entropy)} J/(mol·K)`:`摩尔热容 ${fmt(current.heatCapacity)} J/(mol·K)`);
      }
    }
    function render(){
      const m=getModel();p=m.pressure/units.pressure;
      const temperature=m.transitionTemperature+m.halfWidth*position/1000,current=m.at(temperature,0,fraction),atPoint=position===0,integral=m.accumulated(temperature,fraction);
      $('first-controls').hidden=!m.first;$('mixture').hidden=!m.first;$('fraction').disabled=!atPoint;
      $('kind').value=kind;$('pressure').min=kind==='sg'?25:105;$('pressure').max=kind==='sg'?95:200;$('pressure').value=m.pressure/1000;$('pressure-value').textContent=fmt(m.pressure/1000,1)+' kPa';
      $('temperature').min=m.lowTemperature;$('temperature').max=m.highTemperature;$('temperature').value=temperature;
      $('temperature-value').textContent=`T = ${fmt(temperature,2)} K · ${current.phase}`;
      $('fraction').value=fraction;$('fraction-value').textContent=fmt(fraction*100,0)+'%';
      $('fraction').setAttribute('aria-valuetext',`高温相 ${fmt(fraction*100,0)}%`);
      $('temperature').setAttribute('aria-valuetext',`温度 ${fmt(temperature,2)} K，${current.phase}`);$('area').checked=area;
      root.querySelectorAll('[data-pt-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.ptMode===mode)));
      root.querySelectorAll('[data-pt-stop]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.ptStop===position)));
      const names=m.first?m.ids.map(i=>window.ThreePhaseModel.names[i]):['低温相','高温相'];
      const colors=m.first?m.ids.map(i=>phaseColors[i]):roleColors;root.style.setProperty('--pt-low',colors[0]);root.style.setProperty('--pt-high',colors[1]);
      $('low-name').textContent=names[0];$('high-name').textContent=names[1];
      $('model-note').textContent=m.first?`沿用原三相教学模型。在 ${fmt(m.pressure/1000,1)} kPa 下，${names.join('与')}于 ${fmt(m.transitionTemperature,2)} K 共存。`:'恒压教学示例：相变温度设为 300 K。'+(mode==='jump'?'热容在此温度出现有限跳跃。':'热容在接近此温度时对数发散。');
      $('axis-note').textContent='横轴为温度 T，单位 K；三图共用游标。化学势曲线上的虚线是当前位置的切线。';
      $('mixture-note').textContent=atPoint?`从纯${names[0]}转化到当前比例，每摩尔熵增加 ${fmt(fraction*m.entropyJump,2)} J/(mol·K)，吸热 ${fmt(fraction*m.latentHeat,1)} J/mol；温度保持 ${fmt(m.transitionTemperature,2)} K。`:'点击“正好在相变点”后，可在固定温度下改变相比例，观察熵增与潜热。';
      $('g-readout').textContent=`μ = ${fmt(current.mu,2)} J/mol；切线斜率${current.slope===null?'的左右极限为 '+fmt(m.left.slope,2)+'、'+fmt(m.right.slope,2):'为 '+fmt(current.slope,2)} J/(mol·K)。`;
      $('g-explain').textContent=m.first?'两相在相变温度等高；平衡曲线接起两条斜率不同的分支，出现折角。':mode==='jump'?'两侧高度和切线相接；改变的是切线随温度转动的速率。':'高度和切线连续；靠近相变温度，切线随温度变化越来越快。';
      $('s-readout').textContent=`Sₘ = ${fmt(current.entropy,2)} J/(mol·K)。`;
      $('s-explain').textContent=m.first?`相变点两侧的摩尔熵分别为 ${fmt(m.left.entropy,2)} 和 ${fmt(m.right.entropy,2)} J/(mol·K)，相差 ${fmt(m.entropyJump,2)} J/(mol·K)。`:'相变点两侧的摩尔熵相等。继续升温时，熵仍会改变。';
      $('c-readout').textContent=`Cₚ,ₘ${current.heatCapacity===null?' 在相变点没有唯一的普通数值。':' = '+fmt(current.heatCapacity,2)+' J/(mol·K)。'}化学势的二阶温度导数${current.curvature===null?'在此点不存在。':'为 '+fmt(current.curvature,4)+' J/(mol·K²)。'}`;
      $('c-explain').textContent=m.first?`相内摩尔热容为 ${fmt(m.left.heatCapacity,2)} J/(mol·K)。竖箭头标记相变${area?'熵增':'潜热'}，面积对应标出的数值。`:mode==='jump'?`相变点两侧的热容极限为 ${fmt(m.left.heatCapacity,2)} 和 ${fmt(m.right.heatCapacity,2)} J/(mol·K)。`:'接近相变温度时，二阶温度导数趋于负无穷，热容趋于正无穷。';
      $('status').textContent=atPoint?(m.first?'μ 连续，斜率无唯一值。拖动相比例，观察固定温度下的熵增和吸热。':mode==='jump'?'μ 与斜率连续；二阶导数、热容在此点无唯一值，读取左右极限。':'μ 与斜率连续；二阶导数发散，熵保持有限，潜热为零。'):(m.first?`${position<0?'尚未':'已经'}跨过相界；相内的光滑弯曲与相界处的斜率跳变可以同时存在。`:'将游标移到 300 K，比较左右切线与热容。');
      $('integral-value').textContent=m.first?`每摩尔熵增加：${fmt(integral.regularEntropy,2)}（相内升温） + ${fmt(integral.latentEntropy,2)}（相变） = ${fmt(integral.entropy,2)} J/(mol·K)。`:`每摩尔熵增加 ${fmt(integral.entropy,2)} J/(mol·K)，等于热容除以温度的积分。相变点本身的熵跃变为零。`;
      $('integral-note').textContent=`从 ${fmt(m.lowTemperature,2)} K 到 ${fmt(temperature,2)} K，可逆恒压吸热 ${fmt(integral.heat,1)} J/mol。`+(area?'阴影表示相内熵的增加量。'+(m.first?'相变部分单列在上式中。':mode==='critical'?'超出纵轴的部分仍计入积分读数。':''):'勾选“观察熵变面积”，可在第三张图上查看这项积分。');
      if(!host.hidden)draw(m,temperature,current);
    }
    const change=()=>{render();onChange();};
    root.querySelectorAll('[data-pt-mode]').forEach(b=>listen(b,'click',()=>{mode=b.dataset.ptMode;change();}));
    root.querySelectorAll('[data-pt-stop]').forEach(b=>listen(b,'click',()=>{position=+b.dataset.ptStop;change();}));
    listen($('temperature'),'input',e=>{const m=getModel();position=Math.max(-1000,Math.min(1000,(+e.target.value-m.transitionTemperature)/m.halfWidth*1000));if(Math.abs(position)<1)position=0;change();});
    listen($('fraction'),'input',e=>{fraction=+e.target.value;change();});
    listen($('kind'),'change',e=>{kind=e.target.value;p=kind==='sg'?.6:1.7;change();});
    listen($('pressure'),'input',e=>{p=+e.target.value*1000/units.pressure;change();});
    listen($('area'),'change',e=>{area=e.target.checked;change();});
    listen($('back'),'click',()=>onSurface(kind,p));
    for(const id of ['g','s','c']){
      const svg=$(id);let pointer=null;
      const move=e=>{const f=svg._ptFrame;if(!f)return;const bounds=svg.getBoundingClientRect(),x=(e.clientX-bounds.left)*f.w/bounds.width;let v=Math.round((x-f.l)/(f.w-f.l-f.r)*2000-1000);if(Math.abs(v)<15)v=0;position=Math.max(-1000,Math.min(1000,v));change();};
      listen(svg,'pointerdown',e=>{if(e.button!==0)return;pointer=e.pointerId;svg.setPointerCapture(pointer);move(e);});
      listen(svg,'pointermove',e=>{if(pointer===e.pointerId)move(e);});
      for(const event of ['pointerup','pointercancel','lostpointercapture'])listen(svg,event,()=>{pointer=null;});
    }
    return {render,serialize:()=>({ptmode:mode,ptkind:kind,ptp:p,ptpos:position,ptx:fraction,ptarea:area?1:0}),destroy:()=>clean.forEach(f=>f())};
  }
  window.PhaseTransitionDemo={markup,mount,formulas};
})();
