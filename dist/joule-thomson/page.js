(function () {
  'use strict';
  const formulas = {
    coefficient: '\\mu_{\\rm JT}=\\left(\\frac{\\partial T}{\\partial P}\\right)_H=\\frac{V(\\alpha T-1)}{C_P},\\qquad \\alpha=\\frac1V\\left(\\frac{\\partial V}{\\partial T}\\right)_P',
    enthalpy: 'dH=C_P\\,dT+V(1-\\alpha T)\\,dP=0',
    finite: '\\Delta T=\\int_{P_0}^{P_2}\\mu_{\\rm JT}(P,T(P))\\,dP,\\qquad \\Delta T_{\\rm linear}=\\mu_{\\rm JT}(A)\\,\\Delta P',
    eos: 'P=\\frac{RT}{V-b}-\\frac{a}{V^2},\\quad U=C_VT-\\frac aV,\\quad H=C_VT+\\frac{RTV}{V-b}-\\frac{2a}{V},\\quad C_V=\\frac32R',
    response: 'D=\\frac{RT}{(V-b)^2}-\\frac{2a}{V^3}>0,\\quad \\alpha=\\frac{R}{V(V-b)D},\\quad C_P=C_V+\\frac{TR^2}{(V-b)^2D}',
    consistency: '\\left(\\frac{\\partial U}{\\partial V}\\right)_T=T\\left(\\frac{\\partial P}{\\partial T}\\right)_V-P=\\frac a{V^2}',
    scales: 'P_c=\\frac{a}{27b^2},\\quad V_c=3b,\\quad T_c=\\frac{8a}{27Rb},\\qquad P_r=\\frac{P}{P_c},\\ T_r=\\frac{T}{T_c}',
    inversion: 'T_{\\rm inv}=\\frac{2a}{Rb}\\left(1-\\frac bV\\right)^2,\\qquad \\frac{P_{\\rm inv}}{P_c}=27(2q-3q^2),\\quad \\frac{T_{\\rm inv}}{T_c}=\\frac{27}{4}(1-q)^2,\\quad q=\\frac bV',
    ideal: 'PV=RT,\\quad H=(C_V+R)T,\\quad \\alpha T=1,\\quad C_P=\\frac52R,\\quad \\mu_{\\rm JT}=0'
  };
  function page(resource, helpers) {
    const equation = key => '<div class="formula" tabindex="0" role="group" aria-label="公式，可用左右方向键横向滚动">' + helpers.math(formulas[key]) + '</div>';
    return `<article class="jt-page"><div class="breadcrumbs"><a href="#/resources">资源目录</a><span>/</span><a href="#/resources?subject=thermodynamics">热力学与统计物理</a><span>/</span><span>本站原创</span></div>
      <header class="jt-heading"><div class="eyebrow">热力学 · 等焓节流</div><h1>${helpers.esc(resource.title)}</h1><p>压力向左降低，温度沿等焓线改变。看局部斜率怎样决定下一小步，再比较整段压降的总温差。</p>
        <p class="jt-assumptions">稳态、绝热、无轴功，忽略进出口动能与势能差：入口与出口的焓相等。图中每一帧对应不同出口压力下的平衡态。</p></header>
      <section class="jt-visual" aria-label="焦耳—汤姆孙节流交互演示">${window.JouleThomsonDemo.markup}</section>
      <section class="jt-prose"><h2>从等焓约束读出升降温</h2>${equation('enthalpy')}${equation('coefficient')}
        <p>节流时 ΔP &lt; 0。因此 μJT &gt; 0 对应降温，μJT &lt; 0 对应升温。反转曲线是 μJT = 0 的状态集合，等焓线在这些点的切线水平。</p>
        <p>选择“反转点起步”，先看一次小压降，再看有限压降终点。入口的一阶估计为零；压降后局部斜率会改变，完整等焓线给出的温差通常不为零。</p>${equation('finite')}
        <p>选择“跨越反转曲线”，观察先升温、后降温的同一条等焓线。B 点的局部 μJT 与从 A 累计的 ΔT 表达不同信息。</p></section>
      <section class="jt-prose"><h2>同一模型计算物态方程、焓与热容量</h2>
        <p>示例真实气体采用 van der Waals 模型，a、b 为正常数。按固定 1 mol 书写，V 为摩尔体积，U、H、CV、CP 为摩尔量。CV 取 3R/2，能量零点取使 U = CVT − a/V。</p>${equation('eos')}
        <p>这个内能满足由物态方程导出的热力学恒等式；CP 和 α 均随状态由同一个模型计算。</p>${equation('consistency')}${equation('response')}
        <p>界面使用该模型的临界量作为两种气体共用的参考尺度，理想气体对照也使用这组尺度。μJT 的读数为 μJT·Pc/Tc，压差、温差的读数分别为 ΔP/Pc、ΔT/Tc。</p>${equation('scales')}
        <p>初始温度可选 1.5 ≤ T/Tc ≤ 7.5，过程限于 T/Tc ≥ 1.05 的单相区域；到达温度下限或最低出口压强 P/Pc = 0.15 时停止。有限压降通过完整焓方程求解。该模型用于说明节流机制，参数没有拟合某种具体气体。</p>
        <details><summary>反转曲线与理想气体对照的公式</summary><div class="explanation">${equation('inversion')}
          <p>图中仅显示选定单相范围内的反转曲线。真实气体沿等焓线的曲率决定有限压降的温差。</p>${equation('ideal')}
          <p>理想气体的焓只依赖 T，CP 为正，因此等焓要求 T 保持不变；它在所有可选状态的等焓线都水平。</p></div></details>
        <p class="jt-source">理论参考：<a href="https://farside.ph.utexas.edu/teaching/sm1/Thermalhtml/node68.html" target="_blank" rel="noopener noreferrer">Richard Fitzpatrick · Joule–Thompson Throttling</a>；<a href="https://phy.princeton.edu/sites/phy2020/files/graduate-program/prelims/J02.pdf" target="_blank" rel="noopener noreferrer">Princeton · Joule–Thomson Process</a>。数值曲线为本站依据上述模型计算。</p>
        <div class="button-row"><a class="button outline" href="#/resource/thermo-chain-rule">偏导链式关系</a><a class="button outline" href="#/resource/constraint-surface">约束曲面与偏导</a>${helpers.compare}</div>
      </section></article>`;
  }
  window.JouleThomsonLesson = {page, formulas};
  window.SiteDemos = Object.assign(window.SiteDemos || {}, {
    'joule-thomson': {page, mount: () => window.JouleThomsonDemo.mount(), unmount: () => window.JouleThomsonDemo.unmount()}
  });
})();
