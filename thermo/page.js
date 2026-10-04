/* Original lesson: mathematical relations, interactive motion, then geometric interpretation. */
(function () {
  'use strict';
  const formulas = {
    chain: '\\left(\\frac{\\partial X}{\\partial T}\\right)_p=\\left(\\frac{\\partial X}{\\partial T}\\right)_V+\\left(\\frac{\\partial X}{\\partial V}\\right)_T\\left(\\frac{\\partial V}{\\partial T}\\right)_p',
    example: 'pV=T,\\quad X=TV,\\quad V(T,p)=\\frac{T}{p},\\qquad A=(T_0,V_0)=(1,1)',
    atA: '\\left(\\frac{\\partial X}{\\partial T}\\right)_{p,A}=\\underbrace{V_0}_{1}+\\underbrace{T_0}_{1}\\underbrace{\\frac{1}{p_0}}_{1}=2',
    differential: 'dX_A=V_0\\,dT+T_0\\,dV,\\qquad dV=\\frac{1}{p_0}\\,dT',
    finite: '\\Delta X=V_0\\Delta T+T_0\\Delta V+\\Delta T\\Delta V',
    isobar: '\\Delta T=s,\\quad\\Delta V=s\\quad(p_0=1),\\qquad\\Delta X=2s+s^2,\\quad\\frac{\\Delta X}{\\Delta T}=2+s\\longrightarrow 2',
    sequential: '\\Delta X_1=V_0\\Delta T,\\qquad\\Delta X_2=(T_0+\\Delta T)\\Delta V'
  };
  function page(resource, helpers) {
    const esc=helpers.esc;
    const equation=name=>'<div class="formula" tabindex="0" role="group" aria-label="公式，可用左右方向键横向滚动">'+helpers.math(formulas[name])+'</div>';
    return '<article class="thermo-page">'+
      '<div class="breadcrumbs"><a href="#/resources">资源目录</a><span>/</span><a href="#/resources?topic=constrained-derivatives">约束与偏导</a><span>/</span><span>本站原创</span></div>'+
      '<header class="thermo-heading"><div class="eyebrow">热力学 · 分步交互</div><h1>'+esc(resource.title)+'</h1><p>'+esc(resource.question)+'</p><div class="button-row"><a class="button" href="#/resource/thermo-chain-rule" data-scroll="thermo-visual">操作分步图</a>'+helpers.compare+'</div></header>'+
      '<section class="thermo-prose" aria-labelledby="thermo-math"><h2 id="thermo-math">先看变量依赖与路径约束</h2>'+
      '<p>X = X(T,V)。定压后，物态方程把 V 写成 V(T,p)，沿这条路径的函数是 X(T,V(T,p))。在同一点对它求导：</p>'+equation('chain')+
      '<p>取固定物质量的理想气体，用参考量归一化为 pV = T，并选 X = TV。X 是演示数学关系的函数。</p>'+equation('example')+
      '<p>原来 T、V 可以独立选择，p 随之确定；再固定 p 后，选定 T 就确定 V，只剩一个独立自由度。A 点的两个坐标斜率均为 1，等压约束的斜率也为 1，所以左边的变化率为 2。所有导数都取 A。</p></section>'+
      '<section id="thermo-visual" class="thermo-visual" aria-label="热力学偏导链式关系分步演示"><p class="thermo-controls-note">“下一步”只播放一个动作，结束后停住；可暂停、继续或重播本步。动作 1–4 都从 A 出发，动作 5、6 对照实际两段路径。</p>'+window.ThermoChain.markup+'</section>'+
      '<section class="thermo-prose" aria-labelledby="thermo-intuition"><h2 id="thermo-intuition">用方向理解不同的下标</h2>'+
      '<h3>下标指定怎样测量斜率</h3><p>定容偏导沿水平线测量 X 随 T 的变化；定温偏导沿竖直线测量 X 随 V 的变化。它们是在同一基准点对函数做的两个局部测量。等压导数则沿 V = T/p 的约束方向测量变化，把这两个坐标方向的作用合起来。</p>'+equation('atA')+
      '<h3>两个分量属于同一次微小位移</h3><p>第 4 步中，两个分量箭头都从 A 同时展开，虚线只是投影。实心点沿等压线移动，T、V 同时改变。微分把这一次变化按两个坐标方向分解：</p>'+equation('differential')+
      '<h3>实际先后走两段，要在第二段的起点重新取斜率</h3><p>第 5 步先从 A 到 B，第 6 步再从 B 到 D。这条路径中途的压力会改变。第二段固定的是 Tᴮ = T₀ + ΔT，定温偏导因此取 B 点的 T 值。</p>'+equation('sequential')+
      '<p>两条路径终点相同，X 的总变化也相同，因为 X 是 T、V 的函数。过程不同，各段使用的局部斜率也可以不同。</p>'+
      '<h3>微分与有限变化的差额</h3><p>图中贡献条使用 A 的斜率给出一阶估计。对于 X = TV，真实有限变化还有乘积项：</p>'+equation('finite')+equation('isobar')+
      '<p>默认 s = 0.1 时，一阶和为 0.2，真实变化为 0.21。减小步长后，余项按 s² 缩小，等压有限比值趋近于 A 的导数 2。</p></section>'+
      '<section class="thermo-prose thermo-observations"><h2>带着三个问题操作</h2><ol>'+resource.steps.map(step=>'<li><strong>'+esc(step.title)+'</strong><p>'+esc(step.action)+'</p><p>'+esc(step.observe)+'</p></li>').join('')+'</ol><details><summary>'+esc(resource.think.question)+'</summary><div class="explanation"><p>'+esc(resource.think.answer)+'</p></div></details>'+
      '<div class="button-row"><a class="button outline" href="#/resource/constraint-surface">约束曲面的三维几何</a><a class="button outline" href="#/resources?topic=constrained-derivatives">浏览相关演示</a></div></section></article>';
  }
  window.ThermoLesson={page,formulas};
  window.SiteDemos=Object.assign(window.SiteDemos||{}, {
    'thermo-chain-rule':{page,mount:()=>window.ThermoChain.mount(),unmount:()=>window.ThermoChain.unmount()}
  });
})();
