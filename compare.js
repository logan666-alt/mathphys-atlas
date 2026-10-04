/* One catalog, multiple views. Resource selections travel in URLs, without a database. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ResourceCompare=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const groups=[
    {title:'模态的两种时间规律',text:'比较振荡与衰减，并核对各演示的边界条件。',ids:['standing-wave','heat-eigenmodes']},
    {title:'改变边界：温度与弦振动',text:'比较两种演示能怎样设置约束。',ids:['heat-boundaries','loaded-string']},
    {title:'从弦到膜：不同几何的模态',text:'比较一维、矩形与圆形区域的振动图像。',ids:['loaded-string','rectangular-membrane','circular-membrane']}
  ];
  function parse(text,resources){const known=new Set(resources.map(r=>r.id));const raw=String(text||'').split(',').filter(Boolean);const ids=[...new Set(raw.filter(id=>known.has(id)))].slice(0,3);return {ids,ignored:raw.some(id=>!known.has(id))||new Set(raw).size>3};}
  const url=ids=>'#/compare?'+new URLSearchParams({ids:ids.join(',')});
  let env,chosen=[],ignored=false,section='';
  function configure(e){env=e;document.addEventListener('click',handle);}
  function sync(p,page){section=page;const key=page==='compare'?'ids':'compare';if(p.has(key)){const parsed=parse(p.get(key),env.catalog.resources);chosen=parsed.ids;ignored=parsed.ignored;}else ignored=false;}
  const resources=()=>chosen.map(id=>env.catalog.resources.find(r=>r.id===id)).filter(Boolean);
  function button(r){return `<button type="button" class="compare-select" data-compare="${env.esc(r.id)}" aria-pressed="${chosen.includes(r.id)}" aria-label="${env.esc((chosen.includes(r.id)?'移出对照：':'加入对照：')+r.title)}">${chosen.includes(r.id)?'✓ 已加入对照':'＋ 加入对照'}</button>`;}
  function suggestions(){return `<div class="compare-suggestions">${groups.map(g=>`<a href="${url(g.ids)}"><b>${env.esc(g.title)} <span aria-hidden="true">→</span></b><span>${env.esc(g.text)}</span></a>`).join('')}</div>`;}
  function page(){
    const {esc,external,badge,tags}=env,rs=resources();
    const topicTags=(r,kind)=>{const ids=r.topics.filter(id=>env.catalog.topics.find(t=>t.id===id)?.kind===kind);return ids.length?tags({...r,topics:ids}):'—';};
    const rows=[
      ['带着什么问题看',r=>esc(r.question)],
      ['先修与适用深度',r=>`<b>${esc(r.depth)}</b><p>${esc(r.prerequisites)}</p>`],
      ['数学方法',r=>topicTags(r,'method')],
      ['应用问题',r=>topicTags(r,'application')],
      ['可视化与可调整的量',r=>`<b>${esc(r.format)} · ${esc(r.language)}</b><p>${esc(r.controls)}</p>`],
      ['坐标、函数值与颜色',r=>esc(r.reading)],
      ['先做一个观察',r=>`<b>${esc(r.steps[0].title)}</b><p>${esc(r.steps[0].action)}</p><p><strong>观察：</strong>${esc(r.steps[0].observe)}</p><small>${esc(r.steps[0].evidence)}</small>`],
      ['实际核验到哪里',r=>`${badge(r)}<p>${esc(r.operation.testedRange)}</p><small>核验：${esc(r.verification.date)}；${esc(r.verification.environment)}</small>`],
      ['模型提醒',r=>`<ul>${r.cautions.slice(0,2).map(c=>`<li>${esc(c)}</li>`).join('')}</ul>`],
      ['来源与演示入口',r=>`<b>${esc(r.source)}</b><p>${esc(r.author||'署名见原站')}</p>${external(r.url,'打开原站演示','button outline small')}<p>${external(r.descriptionUrl,'原站说明')} · ${external(r.backupUrl,'备用入口')}</p>`]
    ];
    return `<div class="breadcrumbs"><a href="#/resources">资源目录</a><span>/</span><span>资源对照</span></div><header class="page-heading compare-heading"><div class="eyebrow">按问题选择演示</div><h1>放在一起，更容易选</h1><p>并排查看 2–3 个演示对应的问题、可调量和核验范围。内容直接来自同一份资源目录。</p></header>${ignored?'<p class="caution" role="status">链接包含未知资源或超过 3 项的选择，已略过无法显示的部分。</p>':''}${rs.length<2?`<section class="empty"><h2>${rs.length?'还差一个资源':'先选一组，开始比较'}</h2><p>${rs.length?'已选：'+esc(rs[0].title)+'。回到目录，再加入一个资源。':'在目录卡片上点击“加入对照”，或从下面的常用组合开始。'}</p><a class="button" href="#/resources?${new URLSearchParams({compare:chosen.join(',')})}">去目录选择</a></section><h2 class="suggestion-heading">按问题快速开始</h2>${suggestions()}`:`<div class="compare-tools"><a class="button outline" href="#/resources?${new URLSearchParams({compare:chosen.join(',')})}">调整选择</a><button type="button" class="text-button" data-comparison-link>显示本组链接</button><span>窄屏可在下表内横向滚动</span></div><div class="compare-link-panel" hidden><label for="comparison-link">本组对照链接（已全选，可手动复制）</label><textarea rows="3" readonly id="comparison-link"></textarea><p class="small muted">链接保留选择顺序；本地预览链接只在本机可用，线上链接仍需原有访问权限。</p></div><div class="resource-compare-wrap" tabindex="0" role="region" aria-label="资源对照表，可用左右方向键横向滚动"><table class="resource-compare-table"><caption>资源用途与核验范围对照</caption><thead><tr><th scope="col">比较什么</th>${rs.map(r=>`<th scope="col"><span class="compare-source">${esc(r.source)}</span><a href="#/resource/${esc(r.id)}">${esc(r.title)}</a><small>${esc(r.originalName)}</small><a class="compare-guide" href="#/resource/${esc(r.id)}">查看演示说明 →</a></th>`).join('')}</tr></thead><tbody>${rows.map(([title,render])=>`<tr><th scope="row">${title}</th>${rs.map(r=>`<td>${render(r)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="proof-note">核验记录说明曾操作的范围，不代表原站现在始终可用。原站界面有变化时，请打开完整导读中的排查卡。资源手机实机兼容性和中国大陆直连均未验证。</p><section class="compare-next"><h2>还可以这样比较</h2>${suggestions()}</section>`}`;
  }
  function update(message=''){
    persistSelection();
    const rs=resources();let dock=document.getElementById('comparison-dock');if(!dock){dock=document.createElement('aside');dock.id='comparison-dock';dock.className='comparison-dock';dock.setAttribute('aria-label','已选资源对照');document.body.append(dock);}
    const visible=chosen.length>0&&['','resources','resource'].includes(section);dock.hidden=!visible;document.body.classList.toggle('has-comparison',visible);
    dock.innerHTML=`<div class="dock-selection"><strong>已选 ${chosen.length} / 3</strong><span>${rs.map(r=>env.esc(r.title)).join(' · ')}</span></div><div class="dock-actions"><button type="button" class="text-button" data-compare-clear>清空</button>${chosen.length>1?`<a class="button" href="${url(chosen)}">开始对照 →</a>`:'<span class="small">再选一个即可对照</span>'}</div><p id="compare-status" role="status" aria-live="polite">${env.esc(message)}</p>`;
    document.querySelectorAll('[data-compare]').forEach(el=>{const yes=chosen.includes(el.dataset.compare);el.setAttribute('aria-pressed',yes);el.textContent=yes?'✓ 已加入对照':'＋ 加入对照';const r=env.catalog.resources.find(r=>r.id===el.dataset.compare);el.setAttribute('aria-label',(yes?'移出对照：':'加入对照：')+(r?.title||''));});
  }
  function persistSelection(){if(['','resources','resource'].includes(section)){const p=new URLSearchParams(location.hash.split('?')[1]||'');if(chosen.length)p.set('compare',chosen.join(','));else p.delete('compare');history.replaceState(null,'',location.hash.split('?')[0]+(p.size?'?'+p:''));}}
  function handle(e){
    const add=e.target.closest('[data-compare]');
    if(add){const id=add.dataset.compare;if(chosen.includes(id))chosen=chosen.filter(x=>x!==id);else if(chosen.length===3){update('最多对照 3 个资源，请先移出一个。');return;}else chosen.push(id);persistSelection();update(chosen.length===1?'已加入一个资源，再选一个即可开始对照。':'选择已更新。');}
    if(e.target.closest('[data-compare-clear]')){chosen=[];persistSelection();update();(document.getElementById('query')||document.getElementById('main')).focus();}
    if(e.target.closest('[data-comparison-link]')){document.querySelector('.compare-link-panel').hidden=false;const field=document.getElementById('comparison-link');field.value=new URL(url(chosen),location.href).href;field.focus();field.select();}
  }
  return {configure,sync,button,page,update,suggestions,parse,url,groups};
});
