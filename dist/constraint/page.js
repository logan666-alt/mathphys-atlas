/* Original Chinese lesson; renderer and mathematical prose remain separate. */
(function () {
  'use strict';
  const formulas = {
    normalization: 'u=\\frac{p}{p_0},\\quad v=\\frac{V}{V_0},\\quad w=\\frac{T}{T_0},\\qquad p_0V_0=nRT_0',
    constraint: 'F(u,v,w)=uv-w=0,\\qquad P=(u_0,v_0,u_0v_0)',
    differential: 'dF_P=v_0\\,du+u_0\\,dv-dw=\\nabla F(P)\\cdot(du,dv,dw)=0',
    normal: '\\nabla F(P)=(v_0,u_0,-1),\\qquad v_0\\delta u+u_0\\delta v-\\delta w=0',
    derivatives: '\\left(\\frac{\\partial v}{\\partial u}\\right)_w=-\\frac{v_0}{u_0},\\qquad \\left(\\frac{\\partial u}{\\partial w}\\right)_v=\\frac{1}{v_0},\\qquad \\left(\\frac{\\partial w}{\\partial v}\\right)_u=u_0',
    relations: '\\left(\\frac{\\partial v}{\\partial u}\\right)_w\\left(\\frac{\\partial u}{\\partial v}\\right)_w=1,\\qquad \\left(-\\frac{v_0}{u_0}\\right)\\frac{1}{v_0}u_0=-1',
    vectors: 't_w=(u_0,-v_0,0),\\quad t_v=(1,0,v_0),\\quad t_u=(0,1,u_0),\\qquad t_w=u_0t_v-v_0t_u',
    finite: '\\Delta w=v_0\\Delta u+u_0\\Delta v+\\Delta u\\,\\Delta v',
    generalPlane: 'f_x\\,dx+f_y\\,dy+f_z\\,dz=0,\\qquad \\nabla f=(f_x,f_y,f_z)',
    reciprocal: '\\left(\\frac{\\partial x}{\\partial y}\\right)_z=-\\frac{f_y}{f_x},\\qquad \\left(\\frac{\\partial y}{\\partial x}\\right)_z=-\\frac{f_x}{f_y},\\qquad \\left(\\frac{\\partial x}{\\partial y}\\right)_z\\left(\\frac{\\partial y}{\\partial x}\\right)_z=1',
    cyclic: '\\left(\\frac{\\partial x}{\\partial y}\\right)_z\\left(\\frac{\\partial y}{\\partial z}\\right)_x\\left(\\frac{\\partial z}{\\partial x}\\right)_y=\\left(-\\frac{f_y}{f_x}\\right)\\left(-\\frac{f_z}{f_y}\\right)\\left(-\\frac{f_x}{f_z}\\right)=-1'
  };
  function page(resource, helpers) {
    const esc = helpers.esc;
    const equation = function (name) {
      return '<div class="formula" tabindex="0" role="group" aria-label="公式，可用左右方向键横向滚动">' + helpers.math(formulas[name]) + '</div>';
    };
    const surface = window.ConstraintSurface.markup;
    return '<article class="constraint-page">' +
      '<div class="breadcrumbs"><a href="#/resources">资源目录</a><span>/</span><a href="#/resources?topic=constrained-derivatives">约束与偏导</a><span>/</span><span>本站原创</span></div>' +
      '<header class="constraint-heading"><div class="eyebrow">本站原创 · 三维交互 · 数学基础</div><h1>' + esc(resource.title) + '</h1>' +
      '<p>固定一个变量，究竟沿哪个方向求导？从同一个切平面，看清负号、倒数与循环关系。</p>' +
      '<div class="button-row"><a class="button" href="#/resource/constraint-surface" data-scroll="constraint-visual">操作三维图</a>' + helpers.compare + '</div></header>' +
      '<section class="constraint-prose" aria-labelledby="constraint-math"><h2 id="constraint-math">先从约束和微分出发</h2>' +
      '<p>理想气体满足 pV = nRT。选取满足 p₀V₀ = nRT₀ 的参考量，将压力、体积和温度归一化：</p>' +
      equation('normalization') + equation('constraint') +
      '<p>用 (u,w) 描述曲面，就有二元函数 v(u,w) = w/u。固定 w = w₀ 后，它成为截线上的一元函数 v(u) = w₀/u；二元函数的这个偏导，就是截线上的普通导数。</p>' +
      '<p>沿曲面的光滑曲线通过 P 时，它的切向位移必须满足约束的微分：</p>' + equation('differential') +
      '<p>梯度是曲面的法向量，切向位移与它正交。这里的 δ 表示切平面内的位移，切平面通过 P：</p>' + equation('normal') +
      '<p>分别令 dw、dv、du 为零，解出所需的两个分量之比，得到：</p>' + equation('derivatives') +
      '<p>同一截线上交换横纵坐标，分量比变成倒数。循环式的三项来自三条不同截线：</p>' + equation('relations') + '</section>' +
      '<section id="constraint-visual" class="constraint-visual" aria-label="约束曲面交互演示">' +
      '<p class="constraint-controls-note">拖动旋转，滚轮缩放。也可用 Tab 聚焦三维图，再用方向键旋转、＋／− 缩放、Home 恢复初始视角。改变设置后，页面链接会记住当前画面。</p>' + surface + '</section>' +
      '<section class="constraint-prose" aria-labelledby="constraint-intuition"><h2 id="constraint-intuition">从图形重建公式</h2>' +
      '<h3>固定变量：选取曲面上的一条截线</h3><p>固定 w 时，P 留在水平平面 w = w₀ 内，同时沿 uv = w₀ 运动。u 增大时，v 必须减小。固定 v 和固定 u 时，则分别沿两个竖直截平面与曲面的交线运动。</p>' +
      '<p>三种切向量都有一个分量为零，对应各自固定的变量。它们都在同一个二维切平面内，而且满足一个线性关系：</p>' + equation('vectors') +
      '<h3>负号：两个法向加权分量必须抵消</h3><p>固定 w 时，v₀du + u₀dv = 0。两项必须抵消，解出 dv/du 时就得到 −v₀/u₀。固定 v 时，抵消的是 v₀du 与 −dw，斜率因此为正。隐函数求导公式里的负号，来自把另一个加权分量移到等号另一边。</p>' +
      '<h3>倒数：同一切线交换两个坐标分量</h3><p>在二维投影中点击“交换横纵轴”：截线、P 和切线保持不变，纵分量／横分量变成横分量／纵分量。比如固定 w，原来的 −v₀/u₀ 变成 −u₀/v₀。</p>' +
      '<p>投影里的增量三角形取在切线上，表示 P 处的导数。三维箭头只缩放显示长度，保留方向；三维中的直角投影到屏幕上，未必仍呈现为直角。</p>' +
      '<h3>移动 P：法向量和切平面一起变化</h3><p>随着 u₀、v₀ 改变，法向量 (v₀,u₀,−1) 和切平面的倾斜程度随之改变，三个截线方向的斜率同步更新。切平面保留一阶变化，实际曲面的有限变化还多一项：</p>' + equation('finite') +
      '<p>因此切平面在 P 处贴住曲面，却不会覆盖整个曲面。箭头表示局部切向方向，箭头端点不必仍在状态曲面上。</p></section>' +
      '<section class="constraint-prose" aria-labelledby="constraint-general"><h2 id="constraint-general">推广到一般光滑曲面</h2>' +
      '<p>对于 f(x,y,z) = 0，在 ∇f ≠ 0 的正规点，切向位移与法向量的关系仍然是：</p>' + equation('generalPlane') +
      '<p>固定 z，并在 fₓ、fᵧ 非零时，隐函数偏导和倒数关系为：</p>' + equation('reciprocal') +
      '<p>若法向量的三个分量均非零，则三个循环偏导存在且为有限非零值：</p>' + equation('cyclic') +
      '<p>所有法向分量都在同一个点取值。三项分别来自三条不同截线，但共用同一个曲面法向量；三个法向分量相消，三个负号留下 −1。</p></section>' +
      '<section class="constraint-prose constraint-observations"><h2>带着三个问题操作</h2><ol>' +
      resource.steps.map(function (step) { return '<li><strong>' + esc(step.title) + '</strong><p>' + esc(step.action) + '</p><p>' + esc(step.observe) + '</p></li>'; }).join('') +
      '</ol><details><summary>' + esc(resource.think.question) + '</summary><div class="explanation"><p>' + esc(resource.think.answer) + '</p></div></details>' +
      '<p class="small muted">本站原创实现。桌面核验日期：' + esc(resource.verification.date) + '。正变量范围 0.4–1.8；演示计算无量纲理想气体曲面 uv = w。</p>' +
      '<div class="button-row"><a class="button outline" href="#/resources?topic=constrained-derivatives">浏览相关知识点</a><a class="button outline" href="#/resource/thermo-chain-rule">偏导链式关系的分步演示</a><a class="button outline" href="#/lab">波动与扩散实验室</a></div></section></article>';
  }
  window.ConstraintLesson = { page: page, formulas: formulas };
  window.SiteDemos = Object.assign(window.SiteDemos || {}, {
    'constraint-surface': {
      page: page,
      mount: function () { window.ConstraintSurface.mount(); },
      unmount: function () { window.ConstraintSurface.unmount(); }
    }
  });
})();
