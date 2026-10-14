/* Original Chinese lesson for the P, V, T state surface. */
(function () {
  'use strict';
  const formulas = {
    constraint: 'PV=nRT,\\qquad V\\,dP+P\\,dV=nR\\,dT',
    derivatives: '\\begin{aligned}dT=0:&\\quad\\left(\\frac{\\partial V}{\\partial P}\\right)_T=-\\frac{V}{P}\\quad\\text{（等温）}\\\\dV=0:&\\quad\\left(\\frac{\\partial P}{\\partial T}\\right)_V=\\frac{nR}{V}\\quad\\text{（等容）}\\\\dP=0:&\\quad\\left(\\frac{\\partial T}{\\partial V}\\right)_P=\\frac{P}{nR}\\quad\\text{（等压）}\\end{aligned}',
    reciprocal: '\\left(\\frac{\\partial V}{\\partial P}\\right)_T\\left(\\frac{\\partial P}{\\partial V}\\right)_T=\\left(-\\frac{V}{P}\\right)\\left(-\\frac{P}{V}\\right)=1',
    cyclic: '\\left(\\frac{\\partial V}{\\partial P}\\right)_T\\left(\\frac{\\partial P}{\\partial T}\\right)_V\\left(\\frac{\\partial T}{\\partial V}\\right)_P=\\left(-\\frac{V}{P}\\right)\\frac{nR}{V}\\frac{P}{nR}=-1',
    tangents: '\\begin{aligned}\\boldsymbol{\\tau}_T&=\\left(1,\\left(\\frac{\\partial V}{\\partial P}\\right)_T,0\\right)\\\\\\boldsymbol{\\tau}_V&=\\left(\\left(\\frac{\\partial P}{\\partial T}\\right)_V,0,1\\right)\\\\\\boldsymbol{\\tau}_P&=\\left(0,1,\\left(\\frac{\\partial T}{\\partial V}\\right)_P\\right)\\end{aligned}',
    determinant: '\\begin{vmatrix}1&\\left(\\dfrac{\\partial P}{\\partial T}\\right)_V&0\\\\[0.5em]\\left(\\dfrac{\\partial V}{\\partial P}\\right)_T&0&1\\\\[0.5em]0&1&\\left(\\dfrac{\\partial T}{\\partial V}\\right)_P\\end{vmatrix}=0',
    expansion: '0=-1-\\left(\\frac{\\partial V}{\\partial P}\\right)_T\\left(\\frac{\\partial P}{\\partial T}\\right)_V\\left(\\frac{\\partial T}{\\partial V}\\right)_P'
  };
  function page(resource, helpers) {
    const equation = function (name) {
      return '<div class="formula" tabindex="0" role="group" aria-label="公式，可用左右方向键横向滚动">' + helpers.math(formulas[name]) + '</div>';
    };
    return '<article class="constraint-page">' +
      '<div class="breadcrumbs"><a href="#/resources">资源目录</a><span>/</span><a href="#/resources?topic=constrained-derivatives">约束与偏导</a><span>/</span><span>本站原创</span></div>' +
      '<header class="constraint-heading"><div class="eyebrow">本站原创 · 三维交互</div><h1>' + helpers.esc(resource.title) + '</h1>' +
      '<p>固定 T、V 或 P，偏导就是对应截线在当前点的斜率。</p>' +
      '<div class="button-row"><a class="button" href="#/resource/constraint-surface" data-scroll="constraint-visual">操作三维图</a>' + helpers.compare + '</div></header>' +
      '<section class="constraint-prose" aria-labelledby="constraint-math"><h2 id="constraint-math">从状态方程求偏导</h2>' +
      '<p>P 是压强，V 是体积，T 是绝对温度。取 n = 1 mol 理想气体，R = 8.314 kPa·L/(mol·K)，n 保持不变。</p>' + equation('constraint') +
      '<p>固定哪个量，就令它的微分为零：</p>' + equation('derivatives') + '</section>' +
      '<section id="constraint-visual" class="constraint-visual" aria-label="约束曲面交互演示">' + window.ConstraintSurface.markup +
      '<p class="constraint-controls-note">实线是截线，虚线是当前点的切线。拖动三维图旋转，滚轮缩放；方向键旋转，＋／− 缩放，Home 恢复视角。当前设置保存在页面链接中。</p></section>' +
      '<section class="constraint-prose" aria-labelledby="constraint-reciprocal"><h2 id="constraint-reciprocal">倒数关系</h2>' +
      '<p>固定 T，在同一条截线上交换横纵轴，斜率互为倒数。点击图中的“交换横纵轴”即可对照。</p>' + equation('reciprocal') + '</section>' +
      '<section class="constraint-prose" aria-labelledby="constraint-cyclic"><h2 id="constraint-cyclic">循环关系：三条切向量共面</h2>' +
      '<p>在光滑约束曲面的同一点 A，固定 T、V、P 的三条截线，其切向量都落在 A 处的二维切平面内。下列偏导均取 A 处的有限值。</p>' +
      '<p>以 P、T、V 分别作为对应截线的参数，按 (P,V,T) 的坐标顺序写出切向量：</p>' + equation('tangents') +
      '<p>下标表示固定量。分量中的 1 是参数对自身的导数，0 对应被固定的坐标。</p>' +
      '<p>依次把这三个向量作为矩阵的列。共面意味着线性相关，所以行列式为 0：</p>' + equation('determinant') +
      '<p>展开行列式：</p>' + equation('expansion') +
      '<p>因此循环乘积为 −1；这就是三个切向量共面的代数表达。</p>' +
      '<p>对本页的理想气体，代入三个偏导即可核对：</p>' + equation('cyclic') +
      '<a href="#/resources?topic=constrained-derivatives">浏览相关演示</a></section></article>';
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
