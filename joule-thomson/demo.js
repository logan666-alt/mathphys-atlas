(function () {
  'use strict';
  const M = window.JouleThomsonModel;
  let dispose = null;
  const markup = `<div id="jt-demo">
    <div class="jt-model-row"><label for="jt-model">选择气体模型
      <select id="jt-model"><option value="real">示例真实气体 · van der Waals</option><option value="ideal">理想气体 · PV = RT</option></select></label>
      <div class="jt-presets" role="group" aria-label="选择初始状态">
        <button type="button" data-jt-preset="cooling">降温起点</button><button type="button" data-jt-preset="heating">升温起点</button>
        <button type="button" data-jt-preset="inversion">反转点起步</button><button type="button" data-jt-preset="crossing">跨越反转曲线</button>
      </div>
    </div>
    <div class="jt-controls">
      <label for="jt-p0">入口 P₀/Pc <output id="jt-p0-value"></output><input id="jt-p0" type="range" min="0.5" max="10" step="0.05" value="4"></label>
      <label for="jt-t0">入口 T₀/Tc <output id="jt-t0-value"></output><input id="jt-t0" type="range" min="1.5" max="7.5" step="0.05" value="2.5"></label>
      <label for="jt-step">单步压降 / Pc <output id="jt-step-value"></output><input id="jt-step" type="range" min="0.005" max="1" step="0.005" value="0.1"></label>
      <label for="jt-drop">有限压降占 P₀ <output id="jt-drop-value"></output><input id="jt-drop" type="range" min="0.1" max="0.95" step="0.05" value="0.8"></label>
    </div>
    <div class="jt-actions"><button type="button" class="button" id="jt-next">单步降压</button><button type="button" class="button outline" id="jt-play">播放</button>
      <button type="button" class="button outline" id="jt-reset">回到 A</button><button type="button" class="text-button" id="jt-replay">从 A 重播</button>
      <button type="button" class="text-button" id="jt-finish">查看有限压降终点</button>
    </div>
    <p id="jt-run-status" class="jt-status" role="status" aria-live="polite"></p>
    <div class="jt-workspace"><div class="jt-chart-wrap">
      <svg id="jt-chart" viewBox="0 0 740 505" role="img" aria-labelledby="jt-chart-title jt-chart-desc"></svg>
      <div id="jt-legend" class="jt-legend"></div>
      <p class="jt-axis-note">P、T 使用同一组参考临界量归一化；横轴向左是降压方向。图中每个点都是相同入口 A 对应的出口平衡态。</p>
      <h3 class="jt-zoom-title">同一条等焓线 · 温差放大</h3>
      <svg id="jt-zoom" viewBox="0 0 740 205" role="img" aria-labelledby="jt-zoom-label jt-zoom-desc"></svg>
      <p class="jt-axis-note">纵轴是从 A 累计的 ΔT/Tc，范围随本次过程调整。实线为等焓线，虚线为入口 A 的一阶估计 μJT(A)ΔP。</p>
    </div><aside class="jt-readings" aria-label="当前状态和局部斜率">
      <div id="jt-effect" class="jt-effect"></div>
      <dl><div><dt>当前 P/Pc</dt><dd id="jt-current-p"></dd></div><div><dt>当前 T/Tc</dt><dd id="jt-current-t"></dd></div>
        <div><dt>总压差 ΔP/Pc</dt><dd id="jt-dp"></dd></div><div><dt>总温差 ΔT/Tc</dt><dd id="jt-dt"></dd></div>
        <div class="jt-reading-emphasis"><dt>局部 μJT · Pc/Tc</dt><dd id="jt-mu"></dd></div>
        <div><dt>模型给出的 αT</dt><dd id="jt-alpha-t"></dd></div><div><dt>α · Tc</dt><dd id="jt-alpha"></dd></div>
        <div><dt>CP/R</dt><dd id="jt-cp"></dd></div><div><dt>V/Vc</dt><dd id="jt-v"></dd></div>
        <div><dt>H/(R Tc)</dt><dd id="jt-h"></dd></div></dl>
      <div id="jt-substitution" class="jt-substitution"></div>
      <p id="jt-local-note" class="jt-local-note"></p>
    </aside></div>
    <section class="jt-comparison" aria-labelledby="jt-compare-title"><h3 id="jt-compare-title">都从 A 出发：一次小压降与有限压降</h3>
      <p id="jt-compare-note"></p><div class="jt-table-wrap" tabindex="0" role="group" aria-label="温差对照表，可横向滚动">
        <table><thead><tr><th scope="col">气体</th><th scope="col">A 点 μJT · Pc/Tc</th><th scope="col">小压降 ΔT/Tc</th><th scope="col">有限压降的一阶估计</th><th scope="col">有限压降的实际 ΔT/Tc</th></tr></thead><tbody id="jt-comparison-body"></tbody></table>
      </div><p id="jt-inversion-note" class="jt-insight"></p>
    </section>
  </div>`;
  const fmt = (value, n = 5) => {
    if (Math.abs(value) < 1e-12) return (0).toFixed(n);
    return (Math.abs(value) < 0.5 * 10 ** -n ? value.toExponential(2) : value.toFixed(n)).replace(/-/g, '−');
  };
  const sign = value => Math.abs(value) < 1e-12 ? 'zero' : value > 0 ? 'cool' : 'warm';
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
      for (const [id, value, digits] of [['p0', p0, 2], ['t0', t0, 2], ['step', step, 3], ['drop', drop, 2]]) {
        $('jt-' + id).value = value;
        $('jt-' + id + '-value').textContent = id === 'drop' ? Math.round(value * 100) + '%' : fmt(value, digits);
      }
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
          <text x="${x(2.8)}" y="${y(3.4)}" class="jt-zone jt-zone-cool">μJT &gt; 0<tspan class="jt-full-label"> · 降压时降温</tspan></text><text x="${x(4.7)}" y="${y(7.35)}" class="jt-zone jt-zone-warm">μJT &lt; 0<tspan class="jt-full-label"> · 降压时升温</tspan></text>
          <text x="${x(7.3)}" y="${y(5.4)}" class="jt-inversion-label"><tspan class="jt-full-label">反转曲线 · </tspan>μJT = 0</text>` : `<text x="${x(3.5)}" y="${y(7.15)}" class="jt-zone"><tspan class="jt-full-label">理想气体：全部适用状态 </tspan>μJT = 0</text>`;
        background = `<title id="jt-chart-title">${kind === 'real' ? '真实气体反转曲线与等焓降压' : '理想气体的水平等焓线'}</title>
          <desc id="jt-chart-desc">横轴压强 P/Pc，纵轴温度 T/Tc。状态从入口 A 沿等焓线向左移动。${kind === 'real' ? '青色区域降压降温，浅橙色区域降压升温，红线是局部斜率为零的反转曲线。' : '理想气体的等焓线水平，灰色曲线为同一入口真实气体对照。'}</desc>
          <defs><clipPath id="jt-clip"><rect x="${X0}" y="${Y0}" width="${X1 - X0}" height="${Y1 - Y0}"/></clipPath>
          <marker id="jt-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#173b63"/></marker></defs>
          <rect x="${X0}" y="${Y0}" width="${X1 - X0}" height="${Y1 - Y0}" class="${kind === 'real' ? 'jt-warming-area' : 'jt-neutral-area'}"/>
          <g clip-path="url(#jt-clip)">${inversion}</g>${grid}
          <rect x="${X0}" y="${Y0}" width="${X1 - X0}" height="${Y1 - Y0}" class="jt-frame"/>
          <text x="${X0 - 8}" y="22" text-anchor="end" class="jt-axis-title">T/Tc</text><text x="${X1}" y="494" text-anchor="end" class="jt-axis-title">P/Pc</text>
          <path d="M${x(2.3)},485H${x(.5)}" class="jt-pressure-arrow" marker-end="url(#jt-arrow)"/><text x="${x(2.6)}" y="490">降压方向</text>`;
      }
      const full = sample(kind, A, end.P);
      const trail = sample(kind, A, currentP, 100);
      const reference = kind === 'real' ? `<path d="M${xy(A)}L${x(end.P)},${y(A.T)}" class="jt-ideal-line"/>` : `<path d="${path(sample('real', realA, realEnd.P))}" class="jt-reference-line"/>`;
      const tangentRadius = Math.min(1.2, p0 * .35);
      const tangent = [{P: currentP - tangentRadius, T: current.T - current.mu * tangentRadius}, {P: currentP + tangentRadius, T: current.T + current.mu * tangentRadius}];
      const curveMark = kind === 'real' && inv ? `<circle cx="${x(inv.P)}" cy="${y(inv.T)}" r="5.5" class="jt-crossing-dot"/><text x="${x(inv.P) - 11}" y="${y(inv.T) - 13}" text-anchor="end" class="jt-point-label">I<tspan class="jt-full-label">：反转点</tspan></text>` : '';
      const smallP = Math.max(end.P, p0 - step);
      const small = M.downstream(kind, A, smallP);
      const endState = end.state;
      const shifted = p0 - currentP > .025;
      $('jt-chart').innerHTML = background + `<g clip-path="url(#jt-clip)">${reference}<path d="${path(full)}" class="jt-full-path"/>
        <path d="${path(trail)}" class="jt-trail"/><path d="${path(tangent)}" class="jt-tangent"/>
        <circle cx="${x(end.P)}" cy="${y(endState.T)}" r="5" class="jt-end-dot"/>
        <circle cx="${x(small.P)}" cy="${y(small.T)}" r="3.5" class="jt-small-dot"/>${curveMark}
        <circle cx="${x(A.P)}" cy="${y(A.T)}" r="5.5" class="jt-start-dot"/>
        <circle cx="${x(current.P)}" cy="${y(current.T)}" r="6" class="jt-current-dot jt-${sign(current.mu)}"/>
      </g><text x="${x(A.P) + (p0 > 8 ? -10 : 10)}" y="${y(A.T) - 15}" text-anchor="${p0 > 8 ? 'end' : 'start'}" class="jt-point-label">A<tspan class="jt-full-label"> · 入口</tspan></text>
      <text x="${x(end.P) + 10}" y="${y(endState.T) + (endState.T < 1.5 ? -20 : 23)}" class="jt-point-label">E<tspan class="jt-full-label"> · 有限压降终点</tspan></text>
      ${shifted ? `<text x="${x(current.P) + (current.P < 1.5 ? 12 : -12)}" y="${y(current.T) - 18}" text-anchor="${current.P < 1.5 ? 'start' : 'end'}" class="jt-point-label">B<tspan class="jt-full-label"> · 当前出口</tspan></text>` : ''}`;
      $('jt-legend').innerHTML = `<span><i class="jt-key-path"></i>${kind === 'real' ? '真实气体等焓线' : '理想气体等焓线'}</span><span><i class="jt-key-tangent"></i>B 点局部切线</span>
        <span><i class="${kind === 'real' ? 'jt-key-ideal' : 'jt-key-reference'}"></i>${kind === 'real' ? '理想气体对照' : '真实气体对照'}</span>${kind === 'real' ? '<span><i class="jt-key-inversion"></i>反转曲线</span>' : ''}`;
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
      const invDot = kind === 'real' && inv ? `<circle cx="${zx(inv.P)}" cy="${zy(inv.T - t0)}" r="4.5" class="jt-crossing-dot"/><text x="${zx(inv.P)}" y="${zy(inv.T - t0) - 13}" text-anchor="middle" class="jt-point-label">I</text>` : '';
      $('jt-zoom').innerHTML = `<title id="jt-zoom-label">沿同一条等焓线累计的温差放大图</title><desc id="jt-zoom-desc">横轴为 P/Pc，纵轴为从入口 A 累计的温差 ΔT/Tc，纵轴按本次过程放大。虚线显示入口的一阶估计，实线显示完整等焓结果。</desc>
        <rect x="${X0}" y="35" width="${X1 - X0}" height="125" class="jt-neutral-area"/>${ticks}
        <path d="M${zx(p0)},${zy(0)}L${zx(end.P)},${zy(linearEnd)}" class="jt-tangent"/>
        <path d="${zoomPath(full)}" class="jt-full-path"/><path d="${zoomPath(trail)}" class="jt-trail"/>${invDot}
        <circle cx="${zx(p0)}" cy="${zy(0)}" r="4" class="jt-start-dot"/>
        <circle cx="${zx(currentP)}" cy="${zy(current.T - t0)}" r="5" class="jt-current-dot jt-${sign(current.mu)}"/>
        <text x="${X0}" y="18" class="jt-axis-title">ΔT/Tc</text><text x="${X1}" y="202" text-anchor="end">P/Pc</text>`;
    }
    function comparison() {
      const dpSmall = Math.max(realEnd.P, p0 - step) - p0;
      const dpFinite = realEnd.P - p0;
      const idealA = M.initial('ideal', p0, t0);
      $('jt-compare-note').textContent = `小压降 ΔP/Pc = ${fmt(dpSmall, 3)}；有限压降 ΔP/Pc = ${fmt(dpFinite, 3)}。一阶估计使用入口 A 的 μJT，实际温差由 H(P₂,T₂) = H(A) 求出。`;
      $('jt-comparison-body').innerHTML = [['real', realA, 'van der Waals'], ['ideal', idealA, '理想气体']].map(([model, start, name]) => {
        const small = M.downstream(model, start, p0 + dpSmall);
        const finite = M.downstream(model, start, realEnd.P);
        return `<tr class="${kind === model ? 'jt-selected-row' : ''}"><th scope="row">${name}</th><td>${fmt(start.mu)}</td><td>${fmt(small.T - t0)}</td><td>${fmt(start.mu * dpFinite)}</td><td>${fmt(finite.T - t0)}</td></tr>`;
      }).join('');
      if (Math.abs(realA.mu) < 1e-9) {
        $('jt-inversion-note').textContent = 'A 正好在反转曲线上：入口切线水平，一阶估计 μJT(A)ΔP = 0。等焓线仍有曲率，所以有限压降后的实际温差通常不为零；缩小单步压降可观察它更快趋近于零。';
      } else if (inv) {
        $('jt-inversion-note').textContent = `降压途中在 I（P/Pc = ${fmt(inv.P, 3)}，T/Tc = ${fmt(inv.T, 3)}）穿过反转曲线，局部升降温方向在这里改变。总温差由经过的整段等焓线决定。`;
      } else {
        $('jt-inversion-note').textContent = '局部 μJT 决定下一小步的升降温方向；有限压降需要沿整条等焓线计算。切换模型或初始状态后，两种比较都重新从同一入口 A 出发。';
      }
    }
    function render(persist = true) {
      current = M.downstream(kind, A, currentP);
      const effect = sign(current.mu);
      const effects = {cool: '局部 μJT > 0 · 下一小步降压会降温', warm: '局部 μJT < 0 · 下一小步降压会升温', zero: kind === 'ideal' ? '理想气体 μJT = 0 · 节流温度保持不变' : '反转点 μJT = 0 · 一阶温差为零'};
      $('jt-effect').textContent = effects[effect];
      $('jt-effect').className = 'jt-effect jt-' + effect;
      for (const [id, value] of [['current-p', current.P], ['current-t', current.T], ['dp', current.P - p0], ['dt', current.T - t0], ['mu', current.mu], ['alpha-t', current.alphaT], ['alpha', current.alpha], ['cp', current.cp], ['v', current.V], ['h', current.h]]) $('jt-' + id).textContent = fmt(value, id === 'mu' || id === 'dt' ? 5 : 4);
      $('jt-substitution').textContent = `μJT · Pc/Tc = (3/8) × ${fmt(current.V, 4)} × (${fmt(current.alphaT, 4)} − 1) / ${fmt(current.cp, 4)} = ${fmt(current.mu)}`;
      $('jt-local-note').textContent = 'μJT = V(αT − 1)/CP；此处的 α、CP、V 均取当前出口 B。ΔP、ΔT 则从入口 A 累计。';
      $('jt-play').textContent = running ? '暂停' : '播放';
      $('jt-play').setAttribute('aria-pressed', running ? 'true' : 'false');
      $('jt-next').disabled = running || currentP <= end.P + 1e-9;
      const atEnd = currentP <= end.P + 1e-9;
      const limitNote = realEnd.reason === 'temperature' ? ' · 真实气体到达 T/Tc = 1.05，本次对照在此结束' : realEnd.reason === 'pressure' ? ' · 到达最低出口压力 P/Pc = 0.15' : '';
      const status = `${running ? '播放中' : atEnd ? '已到有限压降终点' : currentP === p0 ? '停在共同起点 A' : '已暂停，可继续或单步降压'} · 终点 P/Pc = ${fmt(end.P, 3)}${limitNote}`;
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
      if (id === 'p0') p0 = value; else if (id === 't0') t0 = value; else if (id === 'step') step = value; else drop = value;
      configure(id !== 'step'); comparison(); render();
    });
    for (const button of root.querySelectorAll('[data-jt-preset]')) listen(button, 'click', () => {
      stop();
      const preset = M.presets[button.dataset.jtPreset];
      p0 = preset.P; t0 = preset.T; drop = preset.drop;
      kind = 'real'; configure(); comparison(); render();
    });
    listen(document, 'visibilitychange', () => { if (document.hidden && running) { stop(); render(); } });
    dispose = () => { stop(); cleanups.forEach(fn => fn()); };
  }
  window.JouleThomsonDemo = {markup, mount, unmount};
})();
