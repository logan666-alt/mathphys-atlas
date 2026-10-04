/* Teaching activities and URL snapshots: authored content, no third-party simulator code. */
(function(){
  'use strict';
  const M=window.MathPhysModel, S=window.MathPhysState, inquiries=window.MathPhysInquiries;
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const accessNote=()=>typeof location!=='undefined'&&['127.0.0.1','localhost','[::1]'].includes(location.hostname)?'当前为本地预览，链接只能在运行预览服务的这台电脑打开。':'本站当前需要原有访问权限，分享链接不会开通访问。';
  const tex=s=>`<div class="formula" tabindex="0" role="group" aria-label="公式，较长时可横向滚动">${window.katex.renderToString(s,{throwOnError:true,displayMode:true,trust:false})}</div>`;
  function toolbar(){return `<div class="lab-utility"><a href="#/lab" data-lab-jump="inquiry-heading">先预测，再验证 ↓</a><button type="button" class="text-button" id="lab-share">生成当前实验链接</button><span>保存参数、时刻与取样位置</span></div><div id="lab-share-panel" class="lab-share-panel" hidden><label for="lab-share-url">实验链接（可手动复制，或收藏当前页面地址）</label><textarea id="lab-share-url" rows="3" readonly></textarea><div class="button-row"><button type="button" class="button outline small" id="lab-share-copy">复制 / 全选链接</button><button type="button" class="text-button" id="lab-share-close">收起</button></div><p id="lab-share-status" role="status" aria-live="polite"></p><p class="small muted">链接记录生成时的暂停画面；继续修改后请重新生成。仅包含数值设置，不含个人信息。${accessNote()}</p></div><div id="lab-inquiry-context" class="lab-inquiry-context" hidden></div>`;}
  function diagnostics(){return `<section class="lab-box diagnostics" aria-labelledby="diagnostics-heading"><div class="section-top"><h2 id="diagnostics-heading">曲线以外，再看两个量</h2><span class="small muted">随当前时刻变化 · 相对各自初值</span></div><div class="diagnostic-grid"><div><h3>波动能量：动能与势能交换</h3><div class="energy-track" aria-hidden="true"><span id="energy-kinetic-bar"></span><span id="energy-potential-bar"></span></div><div class="metric-legend"><span class="kinetic-key">动能 K/E₀ <output id="energy-kinetic">0.0%</output></span><span class="potential-key">势能 V/E₀ <output id="energy-potential">100.0%</output></span></div><p class="metric-total">总量 E/E₀ <output id="energy-total">1.000</output></p><p>弦通过平衡位置时，位移可能处处为零，速度仍可非零。</p></div><div><h3>扩散起伏：温度偏差的平方积分</h3><div class="heat-track" aria-hidden="true"><span id="heat-norm-bar"></span></div><div class="metric-legend"><span>Q/Q₀ <output id="heat-norm">100.0%</output></span></div><p class="metric-total">Q(t) = ∫₀¹ θ(x,t)² dx</p><p>Q 衡量相对参考温度的整体偏离程度；它不是热能，也不是温度积分。</p></div></div><p id="zero-energy-note" class="small muted" hidden>所有初始系数为零时，两图恒为零。E₀ 与 Q₀ 均为零，相对比值无定义，因此显示“—”。</p><details><summary>这些量怎样计算？</summary><div class="explanation">${tex(String.raw`E=K+V=\tfrac12\int_0^1(u_t^2+c^2u_x^2)\,dx=\tfrac14\sum_{n=1}^6(A_ncn\pi)^2`)}${tex(String.raw`Q(t)=\tfrac12\sum_{n=1}^6 A_n^2e^{-2D(n\pi)^2t}`)}<p>E 为本模型的无量纲波动能量，K 为动能、V 为势能，E₀ = E(0)；Q₀ = Q(0)。积分区域是整根弦或整条温度区间，0 ≤ x ≤ 1。正交性使不同模态的交叉积分为零。固定端、无阻尼、无外力时 E 守恒；本页零温度偏差边界下 Q 单调不增。物理材料的量纲系数已归一化。</p></div></details></section>`;}
  function exercises(){return `<section class="lab-box inquiry-section" aria-labelledby="inquiry-heading"><div class="section-top"><div><div class="eyebrow">三个独立小实验</div><h2 id="inquiry-heading" tabindex="-1">先预测，再验证</h2></div><span class="small muted">先选一个判断，再看模型怎样回答</span></div><div class="inquiry-grid">${inquiries.map((q,i)=>`<form class="inquiry-card" data-inquiry="${q.id}"><div class="inquiry-number">0${i+1}<span>${esc(q.tag)}</span></div><h3>${esc(q.title)}</h3><p class="small muted">题目条件：c = ${q.c}，D = ${q.D}；各量无量纲。</p><fieldset><legend>${esc(q.question)}</legend>${q.options.map((o,j)=>`<label><input type="radio" name="prediction-${q.id}" value="${j}" required>${esc(o)}</label>`).join('')}</fieldset><button class="button outline" type="submit">载入并验证 →</button><p class="small muted">${esc(q.observe)}</p><details class="inquiry-answer" id="answer-${q.id}"><summary>观察后，展开解释</summary><div class="explanation"><p>${esc(q.explanation)}</p>${tex(q.formula)}<p class="small">进一步操作原站：${q.related.map(id=>`<a href="#/resource/${id}" data-related-resource="${id}">${id==='wave-travel'?'一维波动':id==='loaded-string'?'负载弦':id==='heat-eigenmodes'?'热模态':id==='fourier-series'?'傅里叶级数':id==='standing-wave'?'驻波初值':'矩形膜'}</a>`).join(' · ')}</p></div></details><p class="prediction-feedback" role="status" aria-live="polite"></p></form>`).join('')}</div><p class="small muted">载入会恢复题目给定的初值、c 与 D，并暂停在观察时刻。题目中的计算仅适用于本页列出的模型条件。</p></section>`;}
  function paint(s){
    const e=M.energy(s), has=e.wave>0, heat=e.initialL2>0;
    const k=has?e.kinetic/e.wave:0,v=has?e.potential/e.wave:0,q=heat?e.heatL2/e.initialL2:0;
    const $=id=>document.getElementById(id);
    $('energy-kinetic').textContent=has?(100*k).toFixed(1)+'%':'—';
    $('energy-potential').textContent=has?(100*v).toFixed(1)+'%':'—';
    $('energy-total').textContent=has?((e.kinetic+e.potential)/e.wave).toFixed(3):'—';
    $('heat-norm').textContent=heat?(100*q).toFixed(1)+'%':'—';
    $('energy-kinetic-bar').style.width=(100*k)+'%';$('energy-potential-bar').style.width=(100*v)+'%';$('heat-norm-bar').style.width=(100*q)+'%';
    $('zero-energy-note').hidden=has;
  }
  function mount({getState,applyState,pause,message,signal}){
    const $=id=>document.getElementById(id),on=(el,event,fn)=>el.addEventListener(event,fn,{signal});
    let snapshot=null;
    on($('lab-share'),'click',()=>{
      pause();snapshot=S.encode(getState());const hash=S.hash(getState());history.replaceState(null,'',hash);
      $('lab-share-panel').hidden=false;$('lab-share-url').value=location.href;
      $('lab-share-status').textContent='实验已暂停，链接已生成。重新打开此链接可还原当前画面；可收藏或复制保存。';
      $('lab-share-url').focus();$('lab-share-url').select();
    });
    on($('lab-share-copy'),'click',async()=>{
      $('lab-share-url').focus();$('lab-share-url').select();
      $('lab-share-status').textContent='链接已全选，可按 Ctrl+C 或使用系统复制菜单。';
      try{await navigator.clipboard.writeText($('lab-share-url').value);if(!signal.aborted)$('lab-share-status').textContent='已请求复制。若粘贴无内容，请在上方手动复制链接。';}catch{}
    });
    on($('lab-share-close'),'click',()=>{$('lab-share-panel').hidden=true;$('lab-share').focus();});
    document.querySelectorAll('[data-lab-jump]').forEach(el=>on(el,'click',e=>{e.preventDefault();$(el.dataset.labJump).scrollIntoView({behavior:'auto',block:'start'});$(el.dataset.labJump).focus({preventScroll:true});}));
    document.querySelectorAll('[data-inquiry]').forEach(form=>on(form,'submit',e=>{
      e.preventDefault();const q=inquiries.find(x=>x.id===form.dataset.inquiry);const choice=Number(new FormData(form).get('prediction-'+q.id));
      applyState({...M.initial(),a:[...q.a],n:q.n,c:q.c,D:q.D,t:q.t,x:q.x,showMode:true});
      document.querySelectorAll('.inquiry-card').forEach(el=>el.classList.toggle('inquiry-active',el===form));
      form.querySelector('.prediction-feedback').textContent=choice===q.answer?'你的预测与本模型一致。观察后展开解释，核对理由。':'模型给出的结论是“'+q.options[q.answer]+'”。对照图像和解释，检查原先的判断。';
      const context=$('lab-inquiry-context');context.hidden=false;context.innerHTML=`<strong>正在验证：${esc(q.title)}</strong><p>${esc(q.observe)}</p><span class="small">已载入题目条件。更改参数后，要复现本题请重新载入。</span>`;
      message('验证画面已载入并暂停在 t = '+q.t+'。观察图像，再回到题卡展开解释。');
      context.scrollIntoView({behavior:'auto',block:'start'});context.tabIndex=-1;context.focus({preventScroll:true});
    }));
    // Settings in a generated link are a snapshot; later edits visibly mark it as out of date.
    return {changed(){if(snapshot&&!$('lab-share-panel').hidden&&S.encode(getState())!==snapshot)$('lab-share-status').textContent='当前设置或时间已改变；上面的链接仍是上一张快照。请重新点击“生成当前实验链接”更新。';}};
  }
  window.MathPhysActivities={toolbar,diagnostics,exercises,paint,mount};
})();
