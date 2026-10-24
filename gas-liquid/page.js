(function () {
  'use strict';
  const formulas = {
    eos: 'p=\\frac{RT}{V_m-b}-\\frac{a}{V_m^2},\\qquad p_r=\\frac{8T_r}{3v_r-1}-\\frac{3}{v_r^2}',
    mixture: 'V=n_\\ell V_{m\\ell}+n_gV_{mg},\\qquad \\bar V_m=(1-x_g)V_{m\\ell}+x_gV_{mg},\\quad x_g=\\frac{\\bar V_m-V_{m\\ell}}{V_{mg}-V_{m\\ell}}',
    stability: '\\kappa_T=-\\frac{1}{V_m}\\left(\\frac{\\partial V_m}{\\partial p}\\right)_T>0\\quad\\Longleftrightarrow\\quad\\left(\\frac{\\partial p}{\\partial V_m}\\right)_T<0',
    chemical: '\\mu=G_m=U_m-TS_m+pV_m,\\qquad d\\mu=-S_m\\,dT+V_m\\,dp',
    transfer: 'dn_\\ell=d\\xi,\\quad dn_g=-d\\xi,\\qquad dG_{\\rm total}=(\\mu_\\ell-\\mu_g)\\,d\\xi',
    slope: 'T=\\mathrm{const}:\\quad d\\mu=V_m\\,dp,\\qquad \\left(\\frac{\\partial\\mu}{\\partial p}\\right)_T=V_m',
    equilibrium: 'T_A=T_B,\\qquad p_A=p_B=p_s,\\qquad\\mu_A=\\mu_B',
    integral: '\\mu_B-\\mu_A=\\int_A^B V_m\\,dp=[pV_m]_A^B-\\int_{V_{mA}}^{V_{mB}}p(V_m,T)\\,dV_m',
    area: '\\mu_B-\\mu_A=p_s(V_{mB}-V_{mA})-\\int_{V_{mA}}^{V_{mB}}p\\,dV_m=0',
    maxwell: '\\int_{V_{mA}}^{V_{mB}}[p(V_m,T)-p_s]\\,dV_m=0\\quad\\Longleftrightarrow\\quad S_{\\rm above}=S_{\\rm below}',
    trial: '\\mu_g-\\mu_\\ell=S_{\\rm below}-S_{\\rm above}',
    critical: '\\left(\\frac{\\partial p}{\\partial V_m}\\right)_{T_c}=0,\\qquad\\left(\\frac{\\partial^2p}{\\partial V_m^2}\\right)_{T_c}=0',
    derivatives: '-\\frac{RT_c}{(V_{mc}-b)^2}+\\frac{2a}{V_{mc}^3}=0,\\qquad\\frac{2RT_c}{(V_{mc}-b)^3}-\\frac{6a}{V_{mc}^4}=0',
    criticalResult: 'V_{mc}=3b,\\qquad T_c=\\frac{8a}{27Rb},\\qquad p_c=\\frac{a}{27b^2},\\qquad\\frac{p_cV_{mc}}{RT_c}=\\frac38',
    scales: 'v_r=\\frac{V_m}{V_{mc}},\\quad p_r=\\frac{p}{p_c},\\quad T_r=\\frac{T}{T_c}',
    model: '\\frac{F_m}{p_cV_{mc}}=-\\frac{8T_r}{3}\\ln(3v_r-1)-\\frac{3}{v_r}+f(T_r),\\qquad\\mu=F_m+pV_m'
  };
  function page(resource, helpers) {
    const equation = key => '<div class="formula" tabindex="0" role="group" aria-label="公式，可横向滚动">' + helpers.math(formulas[key]) + '</div>';
    return `<article class="gl-page">
      <div class="breadcrumbs"><a href="#/resources">资源目录</a><span>/</span><a href="#/resources?subject=thermodynamics">热力学与统计物理</a><span>/</span><span>气液相变</span></div>
      <header class="gl-heading"><div class="eyebrow">热力学 · 气液相变与临界点</div><h1>${helpers.esc(resource.title)}</h1><p class="gl-lead">保持温度不变，慢慢压缩一份气体：什么时候开始液化，为什么会出现一段水平线？</p><p>先沿等温线看实际过程，再区分稳定与亚稳，最后用化学势找到共存压强。图中 A、B、D、J、N 与讲义的标记对应。</p></header>
      <section class="gl-workshop" aria-label="气液相变交互演示">${window.GasLiquidDemo.markup}</section>
      <section class="gl-prose" id="gl-reading">
        <h2>1 从右向左：一份气体怎样变成液体</h2>
        <p>横轴是摩尔体积 Vm，纵轴是压强 p。压缩使体积减小，因此状态点向左移动。固定低于 Tc 的温度，从右边的气体开始：先增压，到 B 开始出现液体；从 B 到 A，气体持续液化，压强保持不变；到 A 时全部成为液体，继续压缩就要明显增压。</p>
        <p class="gl-definition"><strong>平台内部每个点都是气液混合物。</strong>同一共存温度和压强下，两相各自的密度确定。缩小总体积主要靠气体变成更致密的液体。</p>
        ${equation('mixture')}
        <p>nℓ、ng 是两相的物质的量（mol），V 是总体积（m³），Vmℓ、Vmg 是两相各自的摩尔体积（m³/mol）。总物质的量 n = nℓ + ng 固定，xg = ng/n 是气相的物质的量分数；横轴在平台内表示平均摩尔体积 V̄m = V/n。物质的量分数与容器中的体积分数不同。</p>
        <h2>2 范氏回折线为什么不能直接当作压缩路线</h2>
        <p>理想气体等温线始终单调下降。范德瓦耳斯方程加入分子自身大小和分子间吸引：b 表示排除体积的修正，a 描述吸引作用。温度较低时，均匀相的模型解出现回折。</p>${equation('eos')}
        <p>开启“叠加均匀相的范氏回折线”，比较平台与回折线。平衡系统可以分成两相，因此在 A、B 之间要采用气液共存平台。回折线仍帮助我们区分亚稳态与机械不稳定态。</p>
        <p>看 JDN 段：体积越小，内部压强反而越低。外界稍微把它压小，内部压强下降，外界会进一步压小它，扰动自行放大。正常的恢复作用是压小一点，内部压强升高，把它撑回来。</p>${equation('stability')}
        <p>κT 是等温压缩系数（Pa⁻¹）。斜率小于零说明能抵抗小体积扰动；最终采用哪一相，还要在同温同压下比较吉布斯自由能。J、N 是机械稳定边界，斜率为零；两点之间斜率为正。</p>
        <table class="gl-point-table"><caption class="sr-only">讲义各曲线段的含义</caption><thead><tr><th scope="col">曲线段</th><th scope="col">状态</th><th scope="col">物理含义</th></tr></thead><tbody>
          <tr><th scope="row">A 左侧</th><td>稳定液体</td><td>抵抗小扰动，液体的化学势更低。</td></tr><tr><th scope="row">AJ</th><td>亚稳液体</td><td>过热液体，气相更有利；成核障碍使液体暂时保留。</td></tr><tr><th scope="row">JDN</th><td>机械不稳定</td><td>压强对体积的斜率为正，小扰动放大。</td></tr><tr><th scope="row">NB</th><td>亚稳气体</td><td>过饱和蒸气，液相更有利；出现液滴后可凝结。</td></tr><tr><th scope="row">B 右侧</th><td>稳定气体</td><td>抵抗小扰动，气体的化学势更低。</td></tr>
        </tbody></table>
        <p>“亚稳”表示暂时待得住，但存在自由能更低的相。液滴或气泡形成时要先建立界面，这会带来成核障碍。交互图只标出这些均匀相分支，成核过程的快慢需要另外的动力学模型。</p>
        <h2>3 为什么突然换成 μ–p 图</h2>
        <p>μ 是化学势，单位 J/mol。对均匀纯物质，它等于摩尔吉布斯自由能 Gm。下式中的 U、S、V 都写成摩尔量：</p>${equation('chemical')}
        <p>让 dξ mol 物质从气相进入液相，液相增加 dξ，气相减少 dξ，总 G 的变化为：</p>${equation('transfer')}
        <p>若 μ液 &lt; μ气，凝结降低总 G；若 μ气 &lt; μ液，汽化降低总 G。两相共存要求 μ液 = μ气，所以 A、B 的温度、压强、化学势相同，而摩尔体积不同。</p>${equation('equilibrium')}
        <p>为什么 μ–p 图上的气体支更陡？固定温度后，化学势的全微分只剩下压强项：</p>${equation('slope')}
        <p>气体摩尔体积较大，所以 μ 随 p 增长得更快。低压侧气体的 μ 更低，高压侧液体的 μ 更低；两支相交处确定共存压强。讲义的“同一 p 对应三个 μ”指均匀相方程给出三个候选态。中间态机械不稳定，其余两态还要比较 μ 的高低。</p>
        <h2>4 水平线应该画多高：从化学势相等到等面积</h2>
        <p>选择“找共存压强”，先上下移动水平线。上图给出两个面积，下图比较同一压强下的化学势。只有两相化学势相等时，这条线才能成为平衡平台。</p>
        <p>沿均匀相的范氏等温曲线从 A 积分到 B，再做分部积分：</p>${equation('integral')}
        <p>A、B 的压强均为 ps，所以边界项等于 ps(VmB − VmA)。相平衡又要求 μB − μA = 0：</p>${equation('area')}${equation('maxwell')}
        <p>曲线高于水平线的部分给正面积，低于水平线的部分给负面积。积分为零意味着两块面积相等，这就是麦克斯韦等面积法则。在试画压强下，两端还不是共存态，化学势差恰好等于：</p>${equation('trial')}
        <p>下方面积较大时，μ气 &gt; μ液，液体更有利；上方面积较大时，气体更有利。点击“定位等面积压强”，看面积差和化学势差同时归零。沿回折线的积分是比较模型状态的数学计算，实际平衡压缩沿平台进行。</p>
        <h2>5 温度升高后，临界点发生了什么</h2>
        <p>依次选择“低于临界温度”“接近临界点”“临界点”。温度升高时，平台的 A、B 两端靠近，两相密度差缩小；到 Tc 时两端合并，气液区别消失。高于 Tc 后，沿等温线压缩只会连续改变流体密度。</p>
        <p>范氏模型在 C 点形成水平拐点，满足：</p>${equation('critical')}
        <details><summary>展开临界参量的计算</summary><div class="explanation"><p>对范氏方程分别求一次和二次体积导数，在临界点令它们为零：</p>${equation('derivatives')}
          <p>由第一个等式得 RTc = 2a(Vmc − b)²/Vmc³，由第二个得 RTc = 3a(Vmc − b)³/Vmc⁴。两式相除得到 1 = 3(Vmc − b)/(2Vmc)，解出 Vmc = 3b；代回求得 Tc、pc：</p>${equation('criticalResult')}
          <p>界面使用这些临界量构造无量纲变量，因此临界点统一在 (vr, pr, Tr) = (1, 1, 1)。</p>${equation('scales')}
        </div></details>
        <details><summary>查看模型、符号与计算方式</summary><div class="explanation"><p>p 的单位为 Pa，T 为 K，Vm 为 m³/mol，R 为 J/(mol·K)，a 为 Pa·m⁶/mol²，b 为 m³/mol。温度控件范围为 0.85 ≤ T/Tc ≤ 1.10；临界量由同一范氏方程确定。示例未拟合某种具体物质。</p>
          <p>在亚临界温度下，先从斜率为零求出 J、N，再在它们的压强之间求解等面积条件，得到共存压强和两相体积。面积采用解析原函数，三个体积根使用带区间的求根计算。</p>${equation('model')}
          <p>模型自由能满足 p = −(∂Fm/∂Vm)T；由 μ = Fm + pVm 计算各分支化学势。f(Tr) 是只依赖温度的参考项，在同温化学势差中消去。图中统一减去共存化学势；面积和化学势读数的单位均为 pcVmc（J/mol）。</p>
          <p>稳定性面板的点沿均匀相分支取值，压缩面板的状态沿两相平衡平台取值。亚稳态中的界面成核与临界涨落不在该均匀相模型中计算。</p>
        </div></details>
        <p class="gl-source">理论参考：<a href="https://farside.ph.utexas.edu/teaching/sm1/Thermalhtml/node123.html" target="_blank" rel="noopener noreferrer">Richard Fitzpatrick · Phase Transformations in Van der Waals Fluid</a>。本页图形由上述范氏模型计算。</p>
        <div class="button-row"><a class="button outline" href="#/resource/joule-thomson">焦耳—汤姆孙节流</a><a class="button outline" href="#/resource/thermo-chain-rule">偏导链式关系</a>${helpers.compare}</div>
      </section>
    </article>`;
  }
  window.GasLiquidLesson = {page, formulas};
  window.SiteDemos = Object.assign(window.SiteDemos || {}, {'gas-liquid': {page, mount: () => window.GasLiquidDemo.mount(), unmount: () => window.GasLiquidDemo.unmount()}});
})();
