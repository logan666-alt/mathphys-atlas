(function(){
  'use strict';
  const formulas={
    minimum:'\\mu_{\\rm eq}(T,p)=\\min(\\mu_s,\\mu_\\ell,\\mu_g),\\qquad \\mu_i=\\mu_j\\leq\\mu_k',
    differential:'d\\mu_i=-S_{m,i}\\,dT+V_{m,i}\\,dp',
    clapeyron:'\\frac{dp}{dT}=\\frac{S_{m,j}-S_{m,i}}{V_{m,j}-V_{m,i}},\\qquad \\frac{d\\mu_{\\rm coex}}{dT}=-S_{m,i}+V_{m,i}\\frac{dp}{dT}',
    mixture:'\\frac{G}{n}=\\sum_i x_i\\mu_i,\\quad \\sum_i x_i=1,\\quad \\frac{\\Delta G}{n}=\\sum_i x_i(\\mu_i-\\mu_{\\rm eq})\\geq0',
    constraint:'\\bar V_m=\\sum_i x_i V_{m,i},\\quad \\bar H_m=\\sum_i x_i H_{m,i},\\quad x_j=\\frac{\\bar V_m-V_{m,i}}{V_{m,j}-V_{m,i}}',
    derived:'S_{m,i}=-\\left(\\frac{\\partial\\mu_i}{\\partial T}\\right)_p,\\quad V_{m,i}=\\left(\\frac{\\partial\\mu_i}{\\partial p}\\right)_T,\\quad H_{m,i}=\\mu_i+TS_{m,i}'
  };
  function page(resource,h){const eq=k=>`<div class="formula" tabindex="0">${h.math(formulas[k])}</div>`;
    return `<article class="tp-page"><div class="breadcrumbs"><a href="#/resources">资源目录</a><span>/</span><a href="#/resources?subject=thermodynamics">热力学与统计物理</a><span>/</span><span>三相与化学势</span></div>
    <header><h1>${h.esc(resource.title)}</h1><p class="tp-note">教学示例：三相点设为 300 K、100 kPa；各图直接使用物理量及其单位。</p></header>
    ${window.ThreePhaseDemo.markup}
    <details class="tp-reading"><summary>展开原理、公式与模型说明</summary><h2>从三张曲面读出一张相图</h2><p>取同一 T、p，把三张曲面上的高度放在一起比较。最低的一张给出平衡化学势；两张同为最低时形成两相共存线；三张同时相交于最低值时得到三相点。两张较高曲面的交线投影只表示两相化学势相等，第三相仍可能更稳定。</p>${eq('minimum')}
    <h2>沿共存线走，共同的化学势会改变</h2><p>“等化学势”比较的是同一个温压点上的两相。在第二步选择汽化线并拖动“沿线移动：压强”，观察共同高度从三相点的零参考值离开。第二步直接绘制实际共同化学势随压强的变化。第一步将三张实际化学势曲面放在同一坐标系，统一拉伸纵向尺度以突出高低差异；可自由旋转、俯仰和缩放。第二步使用实际值曲线比较沿线共同高度。</p>${eq('differential')}${eq('clapeyron')}
    <p>μ 的单位为 J/mol，摩尔熵 Sm 为 J/(mol·K)，摩尔体积 Vm 为 m³/mol。恒压截面的斜率为 −Sm；恒温截面的斜率为 Vm。共存线上两相的 dμ 相等，由此得到克拉珀龙方程；共同 dμ 本身通常不等于零。</p>
    <h2>温压不动，相比例仍能变化</h2><p>这里讨论单组分、可分离的宏观固液气相，忽略界面贡献。xᵢ = nᵢ/n 是摩尔分数。把三相各自的吉布斯自由能相加，得到：</p>${eq('mixture')}
    <p>在液相区，固相和气相的化学势更高，平衡终态为纯液相。在汽化线上，固相消失后，任何液气比例都具有相同的体相 G。在三相点，三相比例的任意组合都给出相同的体相 G。</p>
    <p>“转化进度”连接你设置的初态与一个可选平衡终态。它表示相比例路径的进度；实际转化速率和固相向液、气的分配需要动力学或附加条件确定。</p>
    <h2>加一个总量条件，怎样求比例</h2><p>在恒温恒压环境中，热库可交换热量，边界可调整体积。额外指定总容积 V 或总焓 H 后，以固定的 n 换算成平均摩尔量，再求满足约束的平衡相比例：</p>${eq('constraint')}
    <p>两相共存时，一个独立总量条件通常给出唯一比例；三相点处，归一化条件加一个总量条件通常仍留下一组比例。本演示在可行解之间移动，显示剩余自由度。若给定值超出共存各相的摩尔量范围，则当前 T、p 下没有满足该条件的平衡态。</p>
    <p>附加约束面板求的是当前温压下的平衡终态。若要演示刚性密闭容器或绝热过程，需要同时联立能量、体积等守恒关系求 T、p；此时温压可能随过程改变。普通固液平衡同样要求处于熔化线上。</p>
    <details><summary>查看教学模型与物理单位</summary><p>前三步采用三相点附近的纯物质教学模型：固液两相近似不可压缩，气相按理想气体处理，各相摩尔热容均为 24.94 J/(mol·K)。三相点设为 300 K、100 kPa，三相共同的化学势取 0 J/mol。这组参数用于说明相平衡，不对应某种具体物质。</p>
    <p>温度用 K，压强用 kPa，化学势和摩尔焓用 J/mol，摩尔熵用 J/(mol·K)，摩尔体积用 L/mol。图中的熵、体积和焓都由同一组化学势函数得到：</p>${eq('derived')}
    <p>所有相界线由两相化学势相等求出，并检查第三相是否更低。灰色虚线表示被第三相压低的两相等高线。第四步用这组模型演示一级相变；连续相变另用相变温度为 300 K 的局部教学模型。</p></details>
    <p>共存线斜率推导参考：<a href="https://farside.ph.utexas.edu/teaching/sm1/Thermalhtml/node120.html" target="_blank" rel="noopener noreferrer">Richard Fitzpatrick · Clausius–Clapeyron Equation</a>。</p>
    <div class="button-row"><a class="button outline" href="#/resource/gas-liquid">气液相变与等面积法则</a><a class="button outline" href="#/resource/thermo-chain-rule">偏导链式关系</a>${h.compare}</div></details></article>`;
  }
  window.ThreePhaseLesson={page,formulas};window.SiteDemos=Object.assign(window.SiteDemos||{},{'three-phase':{page,mount:()=>window.ThreePhaseDemo.mount(),unmount:()=>window.ThreePhaseDemo.unmount()}});
})();
