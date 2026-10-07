/* Original Chinese lesson for the p, v, t state surface. */
(function () {
  'use strict';
  const formulas = {
    constraint: 'pv=nRt,\\qquad v\\,dp+p\\,dv=nR\\,dt',
    derivatives: '\\begin{aligned}dt=0:&\\quad\\left(\\frac{\\partial v}{\\partial p}\\right)_t=-\\frac{v}{p}\\quad\\text{（等温）}\\\\dv=0:&\\quad\\left(\\frac{\\partial p}{\\partial t}\\right)_v=\\frac{nR}{v}\\quad\\text{（等容）}\\\\dp=0:&\\quad\\left(\\frac{\\partial t}{\\partial v}\\right)_p=\\frac{p}{nR}\\quad\\text{（等压）}\\end{aligned}',
    reciprocal: '\\left(\\frac{\\partial v}{\\partial p}\\right)_t\\left(\\frac{\\partial p}{\\partial v}\\right)_t=\\left(-\\frac{v}{p}\\right)\\left(-\\frac{p}{v}\\right)=1',
    cyclic: '\\left(\\frac{\\partial v}{\\partial p}\\right)_t\\left(\\frac{\\partial p}{\\partial t}\\right)_v\\left(\\frac{\\partial t}{\\partial v}\\right)_p=\\left(-\\frac{v}{p}\\right)\\frac{nR}{v}\\frac{p}{nR}=-1'
  };
  function page(resource, helpers) {
    const equation = function (name) {
      return '<div class="formula" tabindex="0" role="group" aria-label="公式，可用左右方向键横向滚动">' + helpers.math(formulas[name]) + '</div>';
    };
    return '<article class="constraint-page">' +
      '<div class="breadcrumbs"><a href="#/resources">资源目录</a><span>/</span><a href="#/resources?topic=constrained-derivatives">约束与偏导</a><span>/</span><span>本站原创</span></div>' +
      '<header class="constraint-heading"><div class="eyebrow">本站原创 · 三维交互</div><h1>' + helpers.esc(resource.title) + '</h1>' +
      '<p>固定 t、v 或 p，偏导就是对应截线在当前点的斜率。</p>' +
      '<div class="button-row"><a class="button" href="#/resource/constraint-surface" data-scroll="constraint-visual">操作三维图</a>' + helpers.compare + '</div></header>' +
      '<section class="constraint-prose" aria-labelledby="constraint-math"><h2 id="constraint-math">从状态方程求偏导</h2>' +
      '<p>p 是压强，v 是体积，t 是绝对温度。取 n = 1 mol 理想气体，R = 8.314 kPa·L/(mol·K)，n 保持不变。</p>' + equation('constraint') +
      '<p>固定哪个量，就令它的微分为零：</p>' + equation('derivatives') + '</section>' +
      '<section id="constraint-visual" class="constraint-visual" aria-label="约束曲面交互演示">' + window.ConstraintSurface.markup +
      '<p class="constraint-controls-note">实线是截线，虚线是当前点的切线。拖动三维图旋转，滚轮缩放；方向键旋转，＋／− 缩放，Home 恢复视角。当前设置保存在页面链接中。</p></section>' +
      '<section class="constraint-prose" aria-labelledby="constraint-reciprocal"><h2 id="constraint-reciprocal">倒数关系</h2>' +
      '<p>固定 t，在同一条截线上交换横纵轴，斜率互为倒数。点击图中的“交换横纵轴”即可对照。</p>' + equation('reciprocal') + '</section>' +
      '<section class="constraint-prose" aria-labelledby="constraint-cyclic"><h2 id="constraint-cyclic">循环关系</h2>' +
      '<p>在同一个状态点，分别沿等温、等容、等压截线取偏导：</p>' + equation('cyclic') +
      '<p>三项固定的量各不相同。移动状态点，三个偏导随之改变，乘积仍为 −1。</p>' +
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
