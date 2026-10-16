(function () {
  'use strict';
  const M = window.JouleThomsonModel;
  let dispose = null;
  const markup = `<div id="jt-demo">
    <div class="jt-apparatus" aria-label="稳态节流装置：入口固定，气体经过绝热阀门流向出口，下游持续排气">
      <div class="jt-port"><span>入口 1 · 条件固定</span><strong id="jt-inlet-state"></strong></div>
      <span class="jt-flow-arrow" aria-hidden="true">→</span>
      <div class="jt-valve"><strong>绝热节流阀</strong><span>H₂ = H₁</span></div>
      <span class="jt-flow-arrow" aria-hidden="true">→</span>
      <div class="jt-port"><span>出口 2 · 当前比较的状态</span><strong id="jt-outlet-state"></strong></div>
    </div>
    <p class="jt-experiment-note">下游持续排气。每个出口点对应一次稳态测量；连续播放时，依次比较不同出口压强下的结果。</p>
    <div class="jt-model-row"><label for="jt-model">选择气体模型
      <select id="jt-model"><option value="real">示例真实气体 · van der Waals</option><option value="ideal">理想气体 · PV = RT</option></select></label>
      <div class="jt-presets" role="group" aria-label="选择入口条件">
        <button type="button" data-jt-preset="cooling">降压后降温</button><button type="button" data-jt-preset="heating">降压后升温</button>
        <button type="button" data-jt-preset="inversion">入口在反转点</button><button type="button" data-jt-preset="crossing">先升温再降温</button>
      </div>
    </div>
    <div class="jt-controls">
      <label for="jt-p0">入口压强 P₁/Pc <output id="jt-p0-value"></output><input id="jt-p0" type="range" min="0.5" max="10" step="0.05" value="4"></label>
      <label for="jt-t0">入口温度 T₁/Tc <output id="jt-t0-value"></output><input id="jt-t0" type="range" min="1.5" max="7.5" step="0.05" value="2.5"></label>
      <label for="jt-step">每档压强减少量 / Pc <output id="jt-step-value"></output><input id="jt-step" type="range" min="0.005" max="1" step="0.005" value="0.1"><small>填正值；下一档出口压强更低。</small></label>
      <label for="jt-drop">目标出口压强 / Pc <output id="jt-drop-value"></output><input id="jt-drop" type="range" min="0.2" max="3.6" step="0.2" value="0.8"><small id="jt-target-note"></small></label>
    </div>
    <div class="jt-actions"><button type="button" class="button" id="jt-next">比较下一档出口压强</button><button type="button" class="button outline" id="jt-play">连续比较</button>
      <button type="button" class="button outline" id="jt-reset">重置比较</button><button type="button" class="text-button" id="jt-replay">从头播放</button>
      <button type="button" class="text-button" id="jt-finish">直接查看目标出口</button>
    </div>
    <p id="jt-run-status" class="jt-status" role="status" aria-live="polite"></p>
    <div class="jt-sign-guide"><span><strong>压差 ΔP = P₂ − P₁</strong>：出口压强更低，所以为负。</span><span><strong>温差 ΔT = T₂ − T₁</strong>：负值表示出口比入口冷，正值表示更热。</span></div>
    <p class="jt-scale-note">Pc、Tc 是模型的参考临界量，用作单位。例如 P/Pc = 4 表示压强为 4Pc；T/Tc = 2.5 表示温度为 2.5Tc。</p>
    <div class="jt-workspace"><div class="jt-chart-wrap">
      <svg id="jt-chart" viewBox="0 0 740 505" role="img" aria-labelledby="jt-chart-title jt-chart-desc"></svg>
      <div id="jt-legend" class="jt-legend"></div>
      <p class="jt-axis-note">入口 1 固定。沿蓝线向左，每个点给出一种更低出口压强下的温度；蓝线上的状态都满足 H₂ = H₁。</p>
      <h3 class="jt-zoom-title">出口比入口冷了还是热了？</h3>
      <svg id="jt-zoom" viewBox="0 0 740 205" role="img" aria-labelledby="jt-zoom-label jt-zoom-desc"></svg>
      <p class="jt-axis-note">纵轴 ΔT = T₂ − T₁：零线下方比入口冷，上方比入口热。实线为等焓计算；棕色虚线始终用入口处的斜率估算，主图的棕色切线则随出口 2 改变。</p>
    </div><aside class="jt-readings" aria-label="出口相对入口的温差，以及当前出口处的斜率">
      <div id="jt-net" class="jt-net"></div>
      <dl><div><dt>出口压强 P₂/Pc</dt><dd id="jt-current-p"></dd></div><div><dt>出口温度 T₂/Tc</dt><dd id="jt-current-t"></dd></div>
        <div><dt>压差 (P₂ − P₁)/Pc</dt><dd id="jt-dp"></dd></div><div><dt>温差 (T₂ − T₁)/Tc</dt><dd id="jt-dt"></dd></div></dl>
      <h3 class="jt-local-title">从当前出口再小幅降压</h3>
      <div id="jt-effect" class="jt-effect"></div>
      <dl><div class="jt-reading-emphasis"><dt>出口处斜率 μJT · Pc/Tc</dt><dd id="jt-mu"></dd></div></dl>
      <p id="jt-local-note" class="jt-local-note"></p>
      <details class="jt-calculation"><summary>展开斜率的计算与焓读数</summary>
        <p>V 为摩尔体积，CP 为摩尔定压热容，α 为定压体膨胀系数；它们取当前出口状态。R 为气体常数。</p>
        <dl><div><dt>αT（无量纲）</dt><dd id="jt-alpha-t"></dd></div><div><dt>α · Tc</dt><dd id="jt-alpha"></dd></div>
          <div><dt>CP/R</dt><dd id="jt-cp"></dd></div><div><dt>V/Vc</dt><dd id="jt-v"></dd></div>
          <div><dt>入口 H₁/(R Tc)</dt><dd id="jt-h-inlet"></dd></div><div><dt>出口 H₂/(R Tc)</dt><dd id="jt-h"></dd></div></dl>
        <div id="jt-substitution" class="jt-substitution"></div>
      </details>
    </aside></div>
    <section class="jt-comparison" aria-labelledby="jt-compare-title"><h3 id="jt-compare-title">相同入口：只降低一档，或直接降到目标出口压强</h3>
      <p id="jt-compare-note"></p><div class="jt-table-wrap" tabindex="0" role="group" aria-label="温差对照表，可横向滚动">
        <table><thead><tr><th scope="col">气体</th><th scope="col">入口斜率 μJT · Pc/Tc</th><th scope="col">只降低一档<br>ΔT/Tc</th><th scope="col">到目标出口<br>入口切线估计 ΔT/Tc</th><th scope="col">到目标出口<br>等焓计算 ΔT/Tc</th></tr></thead><tbody id="jt-comparison-body"></tbody></table>
      </div><p id="jt-inversion-note" class="jt-insight"></p>
    </section>
  </div>`;
  const fmt = (value, n = 5) => {
    if (Math.abs(value) < 1e-12) return (0).toFixed(n);
    return (Math.abs(value) < 0.5 * 10 ** -n ? value.toExponential(2) : value.toFixed(n)).replace(/-/g, '−');
  };
  const sign = value => Math.abs(value) < 1e-12 ? 'zero' : value > 0 ? 'cool' : 'warm';
  const signed = (value, n = 5) => (value > 1e-12 ? '+' : '') + fmt(value, n);
  function unmount() { if (dispose) { dispose(); dispose = null; } }
  function mount() {
    unmount();
    const root = document.getElementById('jt-demo');
    if (!root) return;
    const $ = id => root.querySelector('#' + id);
    const cleanups = [];
    const listen = (el, type, fn) => { el.addEventListener(type, fn); cleanups.push(() => el.removeEventListener(type, fn)); };
    const params = new URLSearchParams(location.hash.split('?')[1] || '');
    const read = (key, fallback, lo, hi) => {
      const v = params.get(key);
      return v !== null && v.trim() && Number.isFinite(Number(v)) ? M.clamp(Number(v), lo, hi) : fallback;
    };
    let kind = params.get('gas') === 'ideal' ? 'ideal' : 'real';
    let p0 = read('p0', 4, 0.5, 10), t0 = read('t0', 2.5, 1.5, 7.5);
    let step = read('step', 0.1, 0.005, 1), drop = read('drop', 0.8, 0.1, 0.95);
    let A, realA, end, realEnd, currentP, current, inv;
    let running = false, mode = 'continuous', raf = 0, lastTime = 0, goal = 0;
    let shownStatus = '', cacheKey = '', background = '';
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    function configure(reset = true) {
      realA = M.initial('real', p0, t0);
      A = M.initial(kind, p0, t0);
      // Both models are compared at the same outlet pressure, including a domain-limited outlet.
      realEnd = M.endpoint('real', realA, p0 * (1 - drop));
      end = kind === 'ideal' ? M.endpoint('ideal', A, realEnd.P) : realEnd;
      inv = M.crossing(realA, realEnd.P);
      if (reset) currentP = p0;
      currentP = M.clamp(currentP, end.P, p0);
      syncControls();
    }
    function syncControls() {
      $('jt-model').value = kind;
      for (const [id, value, digits] of [['p0', p0, 2], ['t0', t0, 2], ['step', step, 3], ['drop', p0 * (1 - drop), 3]]) {
        if (id === 'drop') {
          $('jt-drop').min = p0 * .05;
          $('jt-drop').max = p0 * .9;
          $('jt-drop').step = p0 * .05;
        }
        $('jt-' + id).value = value;
        $('jt-' + id + '-value').textContent = fmt(value, digits);
      }
      $('jt-target-note').textContent = realEnd.limited ? `受模型范围限制，本次比较到 ${fmt(realEnd.P, 3)}Pc。` : `设为入口压强的 ${Math.round((1 - drop) * 100)}%；本次比较到这里。`;
      for (const button of root.querySelectorAll('[data-jt-preset]')) {
        const preset = M.presets[button.dataset.jtPreset];
        const selected = Math.abs(p0 - preset.P) < 1e-8 && Math.abs(t0 - preset.T) < 1e-8;
        button.setAttribute('aria-pressed', selected ? 'true' : 'false');
      }
    }
    function save() {
      const query = new URLSearchParams({gas: kind, p0: String(p0), t0: String(t0), step: String(step), drop: String(drop), p: String(currentP)});
      history.replaceState(null, '', '#/resource/joule-thomson?' + query);
    }
    const X0 = 62, X1 = 712, Y0 = 38, Y1 = 449, P_MAX = 10.5, T_MAX = 8;
    const x = p => X0 + p / P_MAX * (X1 - X0);
    const y = t => Y1 - (t - M.MIN_T) / (T_MAX - M.MIN_T) * (Y1 - Y0);
    const xy = s => x(s.P).toFixed(2) + ',' + y(s.T).toFixed(2);
    const path = states => states.map((s, i) => (i ? 'L' : 'M') + xy(s)).join(' ');
    const sample = (model, initial, pEnd, n = 150) => Array.from({length: n + 1}, (_, i) => M.downstream(model, initial, initial.P + (pEnd - initial.P) * i / n));
    function draw() {
      const key = kind;
      if (cacheKey !== key) {
        cacheKey = key;
        let grid = '';
        for (let p = 0; p <= 10; p += 2) grid += `<path d="M${x(p)},${Y0}V${Y1}" class="jt-grid"/><text x="${x(p)}" y="${Y1 + 24}" text-anchor="middle">${p}</text>`;
        for (let t = 2; t <= 8; t += 2) grid += `<path d="M${X0},${y(t)}H${X1}" class="jt-grid"/><text x="${X0 - 12}" y="${y(t) + 5}" text-anchor="end">${t}</text>`;
        const qMax = 1 - Math.sqrt(M.MIN_T / (27 / 4));
        const curve = Array.from({length: 240}, (_, i) => M.inversion(qMax * i / 239));
        const inversion = kind === 'real' ? `<path d="M${X0},${Y1} ${path(curve).replace(/^M/, 'L')}Z" class="jt-cooling-area"/><path d="${path(curve)}" class="jt-inversion"/>
          <text x="${x(2.8)}" y="${y(3.65)}" class="jt-zone jt-zone-cool">μJT &gt; 0<tspan x="${x(2.8)}" dy="20" class="jt-full-label">小幅降压 → 降温</tspan></text>
          <text x="${x(4.7)}" y="${y(7.5)}" class="jt-zone jt-zone-warm">μJT &lt; 0<tspan x="${x(4.7)}" dy="20" class="jt-full-label">小幅降压 → 升温</tspan></text>
          <text x="${x(6.9)}" y="${y(5.4)}" class="jt-inversion-label">μJT = 0<tspan x="${x(6.9)}" dy="18" class="jt-full-label">反转曲线</tspan></text>` : `<text x="${x(3.5)}" y="${y(7.15)}" class="jt-zone"><tspan class="jt-full-label">理想气体：</tspan>μJT = 0</text>`;
        background = `<title id="jt-chart-title">固定入口，比较不同出口压强对应的温度</title>
          <desc id="jt-chart-desc">横轴压强 P/Pc，纵轴温度 T/Tc。入口1固定，出口2沿等焓线向左表示比较更低出口压强下的稳态结果。${kind === 'real' ? '青色区域的局部斜率为正，小幅降压会降温；橙色区域斜率为负，小幅降压会升温。红色反转曲线连接等焓线斜率为零的状态。' : '理想气体的出口温度始终等于入口温度；灰线为相同入口条件的真实气体对照。'}</desc>
          <defs><clipPath id="jt-clip"><rect x="${X0}" y="${Y0}" width="${X1 - X0}" height="${Y1 - Y0}"/></clipPath>
          <marker id="jt-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#173b63"/></marker></defs>
          <rect x="${X0}" y="${Y0}" width="${X1 - X0}" height="${Y1 - Y0}" class="${kind === 'real' ? 'jt-warming-area' : 'jt-neutral-area'}"/>
          <g clip-path="url(#jt-clip)">${inversion}</g>${grid}
          <rect x="${X0}" y="${Y0}" width="${X1 - X0}" height="${Y1 - Y0}" class="jt-frame"/>
          <text x="${X0}" y="22" class="jt-axis-title">温度 T/Tc</text><text x="${X1}" y="494" text-anchor="end" class="jt-axis-title">压强 P/Pc</text>
          <path d="M${x(2.3)},485H${x(.5)}" class="jt-pressure-arrow" marker-end="url(#jt-arrow)"/><text x="${x(2.6)}" y="490">出口压强更低</text>`;
      }
      const full = sample(kind, A, end.P);
      const trail = sample(kind, A, currentP, 100);
      const reference = kind === 'real' ? `<path d="M${xy(A)}L${x(end.P)},${y(A.T)}" class="jt-ideal-line"/>` : `<path d="${path(sample('real', realA, realEnd.P))}" class="jt-reference-line"/>`;
      const tangentRadius = Math.min(1.2, p0 * .35);
      const tangent = [{P: currentP - tangentRadius, T: current.T - current.mu * tangentRadius}, {P: currentP + tangentRadius, T: current.T + current.mu * tangentRadius}];
      const awayFromCurrent = inv && Math.hypot(x(inv.P) - x(current.P), y(inv.T) - y(current.T)) > 60;
      const curveMark = kind === 'real' && inv ? `<circle cx="${x(inv.P)}" cy="${y(inv.T)}" r="5.5" class="jt-crossing-dot"><title>等焓线在这里与反转曲线相交，切线水平</title></circle>${awayFromCurrent ? `<text x="${x(inv.P) - 11}" y="${y(inv.T) - 22}" text-anchor="end" class="jt-point-label">反转点</text>` : ''}` : '';
      const endState = end.state;
      const shifted = p0 - currentP > 1e-8;
      const atTarget = currentP <= end.P + 1e-8;
      const narrowChart = root.clientWidth < 450;
      const labelGap = narrowChart ? 180 : 90;
      const showTarget = !atTarget && Math.hypot(x(end.P) - x(currentP), y(endState.T) - y(current.T)) > labelGap && Math.hypot(x(end.P) - x(p0), y(endState.T) - y(t0)) > labelGap;
      const currentOnRight = currentP < (narrowChart ? 4 : 2.5);
      const startOnLeft = p0 > 8;
      const startLabel = shifted ? '入口 1' : '入口 1 / 出口 2';
      const currentLabel = atTarget ? '出口 2 · 已到目标' : '出口 2';
      $('jt-chart').innerHTML = background + `<g clip-path="url(#jt-clip)">${reference}<path d="${path(full)}" class="jt-full-path"/>
        <path d="${path(trail)}" class="jt-trail"/><path d="${path(tangent)}" class="jt-tangent"/>
        ${!atTarget ? `<circle cx="${x(end.P)}" cy="${y(endState.T)}" r="5" class="jt-end-dot"><title>目标出口压强下的温度</title></circle>` : ''}${curveMark}
        <circle cx="${x(A.P)}" cy="${y(A.T)}" r="5.5" class="jt-start-dot"/>
        ${shifted ? `<circle cx="${x(current.P)}" cy="${y(current.T)}" r="6" class="jt-current-dot jt-${sign(current.mu)}"/>` : ''}
      </g><text x="${x(A.P) + (startOnLeft ? -12 : 12)}" y="${y(A.T) - 20}" text-anchor="${startOnLeft ? 'end' : 'start'}" class="jt-point-label">${startLabel}</text>
      ${showTarget ? `<text x="${x(end.P) + 12}" y="${y(endState.T) + (endState.T < 1.5 ? -22 : 29)}" class="jt-point-label jt-target-label">目标出口</text>` : ''}
      ${shifted ? `<text x="${x(current.P) + (currentOnRight ? 12 : -12)}" y="${y(current.T) + (current.T < 1.5 ? -25 : 29)}" text-anchor="${currentOnRight ? 'start' : 'end'}" class="jt-point-label jt-outlet-label">${currentLabel}</text>` : ''}`;
      $('jt-legend').innerHTML = `<span><i class="jt-key-path"></i>等焓线 H₂ = H₁</span><span><i class="jt-key-tangent"></i>当前出口处的切线</span>
        <span><i class="${kind === 'real' ? 'jt-key-ideal' : 'jt-key-reference'}"></i>${kind === 'real' ? '理想气体：T₂ = T₁' : '同一入口的真实气体'}</span>${kind === 'real' ? '<span><i class="jt-key-inversion"></i>反转曲线 μJT = 0</span>' : ''}`;
      drawZoom(full, trail);
    }
    function drawZoom(full, trail) {
      const linearEnd = A.mu * (end.P - p0);
      const values = full.map(s => s.T - t0).concat([0, linearEnd]);
      const low = Math.min(...values), high = Math.max(...values);
      const pad = Math.max((high - low) * .2, .002);
      const min = low - pad, max = high + pad;
      const zx = p => X0 + (p - end.P) / (p0 - end.P) * (X1 - X0);
      const zy = dt => 160 - (dt - min) / (max - min) * 125;
      const zoomPath = states => states.map((s, i) => (i ? 'L' : 'M') + zx(s.P).toFixed(2) + ',' + zy(s.T - t0).toFixed(2)).join(' ');
      let ticks = '';
      for (let i = 0; i <= 4; i++) {
        const p = end.P + (p0 - end.P) * i / 4;
        ticks += `<text x="${zx(p)}" y="182" text-anchor="middle">${fmt(p, 2)}</text>`;
      }
      for (const v of [low, 0, high].filter((v, i, a) => a.indexOf(v) === i)) {
        ticks += `<path d="M${X0},${zy(v)}H${X1}" class="jt-grid"/><text x="${X0 + 8}" y="${zy(v) - 5}" class="jt-zoom-tick">${fmt(v, 3)}</text>`;
      }
      const invDot = kind === 'real' && inv ? `<circle cx="${zx(inv.P)}" cy="${zy(inv.T - t0)}" r="4.5" class="jt-crossing-dot"/><text x="${zx(inv.P)}" y="${zy(inv.T - t0) - 13}" text-anchor="middle" class="jt-point-label">反转点</text>` : '';
      $('jt-zoom').innerHTML = `<title id="jt-zoom-label">出口温度减去固定入口温度</title><desc id="jt-zoom-desc">横轴为出口压强 P₂/Pc，纵轴为出口减入口的温差 (T₂−T₁)/Tc。零线下方比入口冷，上方比入口热。棕色虚线固定使用入口斜率，实线给出完整等焓结果。</desc>
        <rect x="${X0}" y="35" width="${X1 - X0}" height="125" class="jt-neutral-area"/>${ticks}
        <path d="M${zx(p0)},${zy(0)}L${zx(end.P)},${zy(linearEnd)}" class="jt-tangent"/>
        <path d="${zoomPath(full)}" class="jt-full-path"/><path d="${zoomPath(trail)}" class="jt-trail"/>${invDot}
        <circle cx="${zx(p0)}" cy="${zy(0)}" r="4" class="jt-start-dot"/>
        <circle cx="${zx(currentP)}" cy="${zy(current.T - t0)}" r="5" class="jt-current-dot jt-${sign(current.mu)}"/>
        <text x="${X0}" y="18" class="jt-axis-title">温差 (T₂ − T₁)/Tc</text><text x="${X1}" y="202" text-anchor="end">出口 P₂/Pc</text>`;
    }
    function comparison() {
      const dpSmall = Math.max(realEnd.P, p0 - step) - p0;
      const dpFinite = realEnd.P - p0;
      const idealA = M.initial('ideal', p0, t0);
      $('jt-compare-note').textContent = `只降低一档：压差 (P₂ − P₁)/Pc = ${signed(dpSmall, 3)}；到目标出口：压差为 ${signed(dpFinite, 3)}。下表温差均为出口减入口；负值表示更冷，正值表示更热。入口切线估计使用 μJT(入口) × (P₂ − P₁)，等焓计算则求解 H₂ = H₁。`;
      $('jt-comparison-body').innerHTML = [['real', realA, 'van der Waals'], ['ideal', idealA, '理想气体']].map(([model, start, name]) => {
        const small = M.downstream(model, start, p0 + dpSmall);
        const finite = M.downstream(model, start, realEnd.P);
        return `<tr class="${kind === model ? 'jt-selected-row' : ''}"><th scope="row">${name}</th><td>${signed(start.mu)}</td><td>${signed(small.T - t0)}</td><td>${signed(start.mu * dpFinite)}</td><td>${signed(finite.T - t0)}</td></tr>`;
      }).join('');
      if (Math.abs(realA.mu) < 1e-9) {
        $('jt-inversion-note').textContent = '范氏气体的入口在反转曲线上：入口处的等焓线切线水平，入口切线估计为零。蓝线离开入口后仍会弯曲，因此目标出口的温度可以与入口不同。减小每档压强减少量，可看清小压差下的温变。';
      } else if (inv) {
        $('jt-inversion-note').textContent = `范氏气体的等焓线在 P/Pc = ${fmt(inv.P, 3)}、T/Tc = ${fmt(inv.T, 3)} 处经过反转点。从右向左看，出口温度先升后降。经过反转点后，温度开始下降，但此时仍可能高于入口温度；看温差是否回到零线下方。`;
      } else {
        $('jt-inversion-note').textContent = '出口处的斜率说明：从这里再小幅降低出口压强，温度会往哪边变。出口与入口的温差则比较两处温度；压差较大时，需要完整等焓计算。';
      }
    }
    function render(persist = true) {
      current = M.downstream(kind, A, currentP);
      const effect = sign(current.mu);
      const effects = {cool: '斜率 μJT > 0：出口温度会降低', warm: '斜率 μJT < 0：出口温度会升高', zero: kind === 'ideal' ? '理想气体：出口温度保持不变' : '斜率 μJT = 0：一阶温变为零'};
      $('jt-effect').textContent = effects[effect];
      $('jt-effect').className = 'jt-effect jt-' + effect;
      const deltaT = current.T - t0;
      $('jt-net').textContent = Math.abs(deltaT) < 1e-12 ? '出口与入口温度相同' : `出口比入口${deltaT < 0 ? '冷' : '热'} ${fmt(Math.abs(deltaT))} Tc`;
      $('jt-net').className = 'jt-net jt-' + sign(-deltaT);
      $('jt-inlet-state').textContent = `P₁/Pc = ${fmt(p0, 2)} · T₁/Tc = ${fmt(t0, 2)}`;
      $('jt-outlet-state').textContent = `P₂/Pc = ${fmt(current.P, 3)} · T₂/Tc = ${fmt(current.T, 3)}`;
      for (const [id, value] of [['current-p', current.P], ['current-t', current.T], ['dp', current.P - p0], ['dt', deltaT], ['mu', current.mu], ['alpha-t', current.alphaT], ['alpha', current.alpha], ['cp', current.cp], ['v', current.V], ['h-inlet', A.h], ['h', current.h]]) $('jt-' + id).textContent = ['dp', 'dt', 'mu'].includes(id) ? signed(value, id === 'dp' ? 4 : 5) : fmt(value, 4);
      $('jt-substitution').textContent = `μJT · Pc/Tc = (3/8) × ${fmt(current.V, 4)} × (${fmt(current.alphaT, 4)} − 1) / ${fmt(current.cp, 4)} = ${fmt(current.mu)}`;
      $('jt-local-note').textContent = effect === 'cool' ? '小幅降压 dP < 0，乘以正斜率 μJT > 0，得到 dT < 0。' : effect === 'warm' ? '小幅降压 dP < 0，乘以负斜率 μJT < 0，得到 dT > 0。' : kind === 'ideal' ? '整条等焓线水平：每个出口压强下都有 T₂ = T₁。' : '当前切线水平。继续比较更低出口压强时，斜率仍会改变。';
      $('jt-play').textContent = running ? '暂停比较' : '连续比较';
      $('jt-play').setAttribute('aria-pressed', running ? 'true' : 'false');
      $('jt-next').disabled = running || currentP <= end.P + 1e-9;
      const atEnd = currentP <= end.P + 1e-9;
      const limitNote = realEnd.reason === 'temperature' ? ' · 真实气体达到模型温度下限 T/Tc = 1.05，本次只能比较到这里' : realEnd.reason === 'pressure' ? ' · 本次只能比较到模型最低出口压强 0.15Pc' : '';
      const status = `${running ? '正在比较不同出口压强下的稳态结果' : atEnd ? '已显示目标出口状态' : currentP === p0 ? '从零压差开始比较：出口与入口同状态' : '当前出口结果已停住，可继续比较'} · 目标出口 P₂/Pc = ${fmt(end.P, 3)}${limitNote}`;
      if (shownStatus !== status) { $('jt-run-status').textContent = status; shownStatus = status; }
      draw();
      if (persist) save();
    }
    function stop() { running = false; cancelAnimationFrame(raf); raf = 0; lastTime = 0; }
    function tick(time) {
      if (!running) return;
      if (!lastTime) lastTime = time;
      const dt = Math.min((time - lastTime) / 1000, .06);
      lastTime = time;
      // Playback takes at most 12 seconds; a single step always moves exactly the selected pressure increment.
      const rate = mode === 'single' ? step / .65 : Math.max(step / .65, (p0 - end.P) / 12);
      currentP = Math.max(goal, currentP - rate * dt);
      if (currentP <= goal + 1e-9) { currentP = goal; stop(); }
      render(false);
      if (running) raf = requestAnimationFrame(tick); else save();
    }
    function play(single = false) {
      if (running) { stop(); render(); return; }
      if (currentP <= end.P + 1e-9) currentP = p0;
      mode = single ? 'single' : 'continuous';
      goal = single ? Math.max(end.P, currentP - step) : end.P;
      if (single && reducedMotion) { currentP = goal; render(); return; }
      running = true; lastTime = 0; render(); raf = requestAnimationFrame(tick);
    }
    configure();
    currentP = read('p', p0, end.P, p0);
    comparison(); render();
    listen($('jt-next'), 'click', () => play(true));
    listen($('jt-play'), 'click', () => play());
    listen($('jt-reset'), 'click', () => { stop(); currentP = p0; render(); });
    listen($('jt-replay'), 'click', () => { stop(); currentP = p0; play(); });
    listen($('jt-finish'), 'click', () => { stop(); currentP = end.P; render(); });
    listen($('jt-model'), 'change', () => { stop(); kind = $('jt-model').value; configure(); comparison(); render(); });
    for (const id of ['p0', 't0', 'step', 'drop']) listen($('jt-' + id), 'input', () => {
      stop();
      const value = Number($('jt-' + id).value);
      if (id === 'p0') p0 = value; else if (id === 't0') t0 = value; else if (id === 'step') step = value; else drop = M.clamp(1 - value / p0, .1, .95);
      configure(id !== 'step'); comparison(); render();
    });
    for (const button of root.querySelectorAll('[data-jt-preset]')) listen(button, 'click', () => {
      stop();
      const preset = M.presets[button.dataset.jtPreset];
      p0 = preset.P; t0 = preset.T; drop = preset.drop;
      kind = 'real'; configure(); comparison(); render();
    });
    listen(window, 'resize', () => draw());
    listen(document, 'visibilitychange', () => { if (document.hidden && running) { stop(); render(); } });
    dispose = () => { stop(); cleanups.forEach(fn => fn()); };
  }
  window.JouleThomsonDemo = {markup, mount, unmount};
})();
