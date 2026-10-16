(function () {
  'use strict';
  const formulas = {
    states: 'H(T_2,P_2)=H(T_1,P_1),\\qquad \\Delta P=P_2-P_1,\\quad \\Delta T=T_2-T_1',
    local: 'dT=\\mu_{\\rm JT}\\,dP,\\qquad dP<0:\\quad \\mu_{\\rm JT}>0\\Rightarrow dT<0,\\quad \\mu_{\\rm JT}<0\\Rightarrow dT>0',
    coefficient: '\\mu_{\\rm JT}=\\left(\\frac{\\partial T}{\\partial P}\\right)_H=\\frac{V(\\alpha T-1)}{C_P},\\qquad \\alpha=\\frac1V\\left(\\frac{\\partial V}{\\partial T}\\right)_P',
    enthalpy: 'dH=C_P\\,dT+V(1-\\alpha T)\\,dP=0',
    finite: 'T_2-T_1=\\int_{P_1}^{P_2}\\mu_{\\rm JT}(P,T(P))\\,dP,\\qquad \\Delta T_{\\rm tangent}=\\mu_{\\rm JT}(P_1,T_1)\\,(P_2-P_1)',
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
      <header class="jt-heading"><div class="eyebrow">热力学 · 等焓节流</div><h1>${helpers.esc(resource.title)}</h1><p>入口条件固定。出口压强设得更低时，流出气体会比入口冷，还是比入口热？</p>
        <p class="jt-assumptions">稳态、绝热、无轴功，忽略进出口动能和势能差，得到 H₂ = H₁。入口与出口各自保持稳定，同时出口压强低于入口。</p></header>
      <section class="jt-visual" aria-label="焦耳—汤姆孙节流交互演示">${window.JouleThomsonDemo.markup}</section>
      <section class="jt-prose"><h2>先确定每个符号在比较什么</h2>
        <p>下标 1 表示入口，下标 2 表示所选出口。入口的 P₁、T₁、H₁ 固定；给定出口压强 P₂，用等焓条件求出出口温度 T₂。</p>${equation('states')}
        <p>“压差”用出口减入口，降压时为负；滑块中的“每档压强减少量”是正的大小。例如入口为 4Pc，出口为 3.9Pc，压强减少了 0.1Pc，而压差 ΔP = −0.1Pc。温差也用出口减入口：ΔT &lt; 0 表示出口更冷。</p>
        <p>“目标出口压强”是本次想比较到的最低出口压强。例如入口为 4Pc、目标为 0.8Pc，按钮“直接查看目标出口”就显示 P₂ = 0.8Pc 时的温度。动画逐档切换出口工况；气体在每一种工况中都保持稳态流动。</p>
      </section>
      <section class="jt-prose"><h2>当前斜率与进出口温差，分别回答什么</h2>
        <p>μJT 是等焓线的局部斜率，单位为 K/Pa。保持焓相同，从当前状态再小幅降低压强，温度变化的方向由这条关系给出：</p>${equation('local')}
        <p>主图的棕色虚线是当前出口处的切线，随出口状态改变。下面温差图的棕色虚线固定使用入口斜率；它把入口附近的近似延长到目标出口，与完整等焓结果比较。</p>${equation('finite')}
        <p>红色反转曲线连接所有 μJT = 0 的状态。蓝色等焓线经过红线时，蓝线的切线水平。选择“入口在反转点”，入口切线估计为零，目标出口仍可能因蓝线的弯曲而产生温差。</p>
        <p>选择“先升温再降温”，沿蓝线向左看：温度先上升，在反转点转而下降。开始下降时，出口仍可能比入口热；出口与入口谁更热，要看温差是否为正。</p>
        <p>理想气体的焓只依赖温度。在 CP &gt; 0 时，H₂ = H₁ 要求 T₂ = T₁，所以它的所有出口状态都落在水平线上。</p>
      </section>
      <section class="jt-prose"><details><summary>查看热力学模型、符号单位与适用范围</summary><div class="explanation">
        <p>示例真实气体采用 van der Waals 模型，a、b 为正常数。按 1 mol 书写：V 为摩尔体积（m³/mol），U、H 为摩尔内能与焓（J/mol），CV、CP 为摩尔热容（J/(mol·K)）；α 为定压体膨胀系数（K⁻¹），R 为气体常数。CV 取 3R/2，能量零点取使 U = CVT − a/V。</p>${equation('eos')}
        <p>物态方程、内能和焓满足同一套热力学关系；CP、α 与 μJT 由同一个模型计算。</p>${equation('consistency')}${equation('response')}${equation('enthalpy')}${equation('coefficient')}
        <p>Pc、Tc、Vc 是这个范氏模型的临界量。真实气体与理想气体共用这组单位尺度，μJT 的界面读数为 μJT·Pc/Tc，也就是图上 d(T/Tc)/d(P/Pc) 的斜率。</p>${equation('scales')}
        <p>入口温度范围为 1.5 ≤ T₁/Tc ≤ 7.5；出口限于 T₂/Tc ≥ 1.05 的单相范围，最低出口压强为 0.15Pc。若目标超出范围，界面显示实际停止比较的压强。数值曲线用于说明节流规律，参数没有拟合具体气体。</p>${equation('inversion')}${equation('ideal')}
        </div></details>
        <p class="jt-source">理论参考：<a href="https://farside.ph.utexas.edu/teaching/sm1/Thermalhtml/node68.html" target="_blank" rel="noopener noreferrer">Richard Fitzpatrick · Joule–Thompson Throttling</a>；<a href="https://phy.princeton.edu/sites/phy2020/files/graduate-program/prelims/J02.pdf" target="_blank" rel="noopener noreferrer">Princeton · Joule–Thomson Process</a>。数值曲线为本站依据上述模型计算。</p>
        <div class="button-row"><a class="button outline" href="#/resource/thermo-chain-rule">偏导链式关系</a><a class="button outline" href="#/resource/constraint-surface">约束曲面与偏导</a>${helpers.compare}</div>
      </section></article>`;
  }
  window.JouleThomsonLesson = {page, formulas};
  window.SiteDemos = Object.assign(window.SiteDemos || {}, {
    'joule-thomson': {page, mount: () => window.JouleThomsonDemo.mount(), unmount: () => window.JouleThomsonDemo.unmount()}
  });
})();
