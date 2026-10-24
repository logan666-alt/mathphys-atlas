(function () {
  'use strict';
  const M = window.GasLiquidModel;
  let dispose = null;
  const markup = `<div id="gl-demo">
    <div class="gl-tabs" role="group" aria-label="选择读图步骤">
      <button type="button" data-gl-view="compression">1 看气体液化</button>
      <button type="button" data-gl-view="stability">2 看稳定与亚稳</button>
      <button type="button" data-gl-view="maxwell">3 找共存压强</button>
    </div>
    <div class="gl-controls">
      <div><label for="gl-temperature">温度 T/Tc <output id="gl-t-value"></output><input type="range" id="gl-temperature" min="0.85" max="1.1" step="0.005" value="0.9"></label>
        <div class="gl-presets" role="group" aria-label="比较临界点前后"><button type="button" data-gl-t="0.9">低于临界温度</button><button type="button" data-gl-t="0.98">接近临界点</button><button type="button" data-gl-t="1">临界点</button><button type="button" data-gl-t="1.08">高于临界温度</button></div>
      </div>
      <div id="gl-compression-controls"><label for="gl-compression">压缩进度 <output id="gl-c-value"></output><input type="range" id="gl-compression" min="0" max="100" step="0.1" value="0"></label><small>向右拖动活塞控制：体积减小，图中状态点向左移动。</small>
        <div class="gl-actions"><button class="button" type="button" id="gl-play" aria-pressed="false">播放压缩</button><button class="button outline" type="button" id="gl-reset">回到气体起点</button></div>
      </div>
      <div id="gl-pressure-controls" hidden><label for="gl-pressure">试画水平线 p/Pc <output id="gl-p-value"></output><input type="range" id="gl-pressure" min="0" max="1000" step="1" value="500"></label><small>上下移动水平线，比较两块面积和两相的化学势。</small><div class="gl-actions"><button class="button" type="button" id="gl-equal">定位等面积压强</button></div></div>
      <div id="gl-stability-controls" class="gl-context" hidden>选一段均匀相曲线，分别判断小扰动能否恢复，以及是否存在自由能更低的相。</div>
    </div>
    <div id="gl-state" class="gl-state" role="status" aria-live="polite"></div>
    <div id="gl-segments" class="gl-segments" role="group" aria-label="选择曲线状态段" hidden><button type="button" data-gl-segment="liquid">稳定液体</button><button type="button" data-gl-segment="metaliquid">AJ 亚稳液体</button><button type="button" data-gl-segment="unstable">JDN 不稳定</button><button type="button" data-gl-segment="metagas">NB 亚稳气体</button><button type="button" data-gl-segment="gas">稳定气体</button></div>
    <div class="gl-stage"><svg id="gl-pv" class="gl-chart" role="img" aria-label="压力体积等温线"></svg></div>
    <div id="gl-legend" class="gl-legend"></div>
    <div id="gl-loop-control" class="gl-actions"><label class="gl-check"><input type="checkbox" id="gl-loop">叠加均匀相的范氏回折线</label></div>
    <p id="gl-plot-note" class="gl-note"></p>
    <svg id="gl-vessel" class="gl-chart gl-vessel" role="img" aria-label="恒温活塞容器的气液比例示意"></svg>
    <div id="gl-maxwell" class="gl-secondary" hidden>
      <dl class="gl-comparison"><div><dt>线上方面积 S上</dt><dd id="gl-area-above"></dd></div><div><dt>线下方面积 S下</dt><dd id="gl-area-below"></dd></div><div><dt>μ气 − μ液</dt><dd id="gl-dmu"></dd></div></dl>
      <h3>同一压强下，哪个分支的化学势更低？</h3>
      <svg id="gl-mu" class="gl-chart" role="img" aria-label="化学势压强图，标出相同压强下的气相、液相及不稳定候选态"></svg>
      <p class="gl-note">实线：液相候选；长虚线：气相候选；点线：不稳定候选。纵轴统一减去共存化学势。气体支更陡，因为固定温度时 dμ/dp = Vm；同一竖线上，较低的气、液分支更有利。</p>
    </div>
    <p class="gl-model-note">以范德瓦耳斯模型计算；体积、压强、温度分别用 Vmc、pc、Tc 作单位。界面体积表示固定总物质的量下的平均摩尔体积。</p>
  </div>`;
  const fmt = (v, n = 4) => Math.abs(v) < 5e-10 ? (0).toFixed(n) : v.toFixed(n).replace('-', '−');
  function unmount() { if (dispose) { dispose(); dispose = null; } }
  function mount() {
    unmount();
    const root = document.getElementById('gl-demo');
    if (!root) return;
    const $ = id => root.querySelector('#gl-' + id);
    const cleanups = [], params = new URLSearchParams(location.hash.split('?')[1] || '');
    const read = (key, fallback, low, high) => params.has(key) && params.get(key).trim() && Number.isFinite(Number(params.get(key))) ? M.clamp(Number(params.get(key)), low, high) : fallback;
    let t = read('t', .9, .85, 1.1), compression = read('c', 0, 0, 100), q = read('q', .4, 0, 1);
    let view = ['compression', 'stability', 'maxwell'].includes(params.get('view')) ? params.get('view') : 'compression';
    let segment = ['liquid', 'metaliquid', 'unstable', 'metagas', 'gas'].includes(params.get('segment')) ? params.get('segment') : 'unstable';
    let loop = params.get('loop') === '1', eq, lo, hi, pLow, pHigh, running = false, raf = 0, lastTime = 0;
    let status = '', muSamples = [];
    const listen = (el, event, fn) => { el.addEventListener(event, fn); cleanups.push(() => el.removeEventListener(event, fn)); };
    const save = () => {
      const s = new URLSearchParams({t: String(t), c: compression.toFixed(3), view, loop: loop ? '1' : '0', q: q.toFixed(9), segment});
      history.replaceState(null, '', '#/resource/gas-liquid?' + s);
    };
    function configure() {
      eq = M.coexistence(t);
      lo = M.bisect(v => M.pressure(t, v) - 1.65, 1 / 3 + 1e-7, eq ? eq.j : 1);
      hi = eq ? Math.max(2.8, eq.b * 1.24) : 2.8;
      if (eq) {
        const pmin = Math.max(1e-5, M.pressure(t, eq.j)), pmax = M.pressure(t, eq.n), inset = (pmax - pmin) * .002;
        pLow = pmin + inset; pHigh = pmax - inset;
        muSamples = Array.from({length: 201}, (_, i) => {
          const p = pLow + (pHigh - pLow) * i / 200, rr = M.roots(t, p, eq);
          return {p, rr, mm: rr.map(v => M.chemical(t, v) - M.chemical(t, eq.a))};
        });
      } else muSamples = [];
    }
    const currentVolume = () => hi - compression / 100 * (hi - lo);
    function axis(svg, title, yTitle, xTitle, xd, yd, height = 330) {
      const width = Math.max(240, svg.parentElement.clientWidth), box = {left: yd[1] - yd[0] < .001 ? 74 : 52, right: width - 14, top: 28, bottom: height - 46};
      const x = v => box.left + (v - xd[0]) / (xd[1] - xd[0]) * (box.right - box.left);
      const y = v => box.bottom - (v - yd[0]) / (yd[1] - yd[0]) * (box.bottom - box.top);
      const id = svg.id + '-clip';
      const tick = (v, span) => {
        if (Math.abs(v) < span * 1e-8) return '0';
        if (span < .001) return v.toExponential(1).replace('-', '−');
        const digits = Math.max(2, Math.min(6, Math.ceil(-Math.log10(span)) + 1));
        return Number(v.toFixed(digits)).toString().replace('-', '−');
      };
      let grid = '';
      for (let i = 0; i <= 3; i++) {
        const xx = xd[0] + (xd[1] - xd[0]) * i / 3, yy = yd[0] + (yd[1] - yd[0]) * i / 3;
        grid += `<path d="M${x(xx)},${box.top}V${box.bottom}M${box.left},${y(yy)}H${box.right}" class="gl-grid"/><text x="${x(xx)}" y="${box.bottom + 20}" text-anchor="${i === 3 ? 'end' : i === 0 ? 'start' : 'middle'}">${tick(xx, xd[1] - xd[0])}</text><text x="${box.left - 9}" y="${y(yy) + 4}" text-anchor="end">${tick(yy, yd[1] - yd[0])}</text>`;
      }
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      const prefix = `<title>${title}</title><defs><clipPath id="${id}"><rect x="${box.left}" y="${box.top}" width="${box.right - box.left}" height="${box.bottom - box.top}"/></clipPath></defs>${grid}<rect class="gl-frame" x="${box.left}" y="${box.top}" width="${box.right - box.left}" height="${box.bottom - box.top}"/><text x="${box.left}" y="16" class="gl-axis">${yTitle}</text><text x="${box.right}" y="${height - 6}" text-anchor="end" class="gl-axis">${xTitle}</text>`;
      return {x, y, box, prefix, clip: id, width};
    }
    function curve(x, y, a, b, fun, count = 260) {
      return Array.from({length: count + 1}, (_, i) => { const v = a + (b - a) * i / count; return (i ? 'L' : 'M') + x(v).toFixed(3) + ',' + y(fun(v)).toFixed(3); }).join('');
    }
    const label = (x, y, text, anchor = 'middle') => `<text x="${x}" y="${y}" text-anchor="${anchor}" class="gl-label">${text}</text>`;
    function drawPV(pTrial, rr) {
      const plotHi = view === 'maxwell' && rr ? Math.max(hi, rr[2] * 1.07) : hi;
      const svg = $('pv'), {x, y, box, prefix, clip, width} = axis(svg, '恒温压缩与气液共存', '压强 p/pc', '平均摩尔体积 Vm/Vmc', [lo, plotHi], [0, 1.75]);
      const path = (a, b, cls) => `<path d="${curve(x, y, a, b, v => M.pressure(t, v))}" class="${cls}"/>`;
      let marks = '', labels = '';
      if (eq) {
        if (view === 'maxwell') {
          const [a, d, b] = rr;
          for (const [start, end, cls] of [[a, d, 'gl-below'], [d, b, 'gl-above']]) marks += `<path d="${curve(x, y, start, end, v => M.pressure(t, v))}L${x(end)},${y(pTrial)}L${x(start)},${y(pTrial)}Z" class="${cls}"/>`;
          marks += path(lo, plotHi, 'gl-loop') + `<path d="M${box.left},${y(pTrial)}H${box.right}" class="gl-trial"/>`;
          rr.forEach((v, i) => { marks += `<circle cx="${x(v)}" cy="${y(pTrial)}" r="4" class="gl-dot current"/>`; labels += label(x(v), y(pTrial) + (i === 1 ? 22 : -12), ['液', '中', '气'][i]); });
        } else {
          if (view === 'stability') {
            const segments = {liquid: [lo, eq.a, 'gl-equilibrium'], metaliquid: [eq.a, eq.j, 'gl-metastable'], unstable: [eq.j, eq.n, 'gl-unstable'], metagas: [eq.n, eq.b, 'gl-metastable'], gas: [eq.b, hi, 'gl-equilibrium']};
            for (const [name, [a, b, cls]] of Object.entries(segments)) { if (name === segment) marks += path(a, b, 'gl-selected-line'); marks += path(a, b, cls); }
            marks += `<path d="M${x(eq.a)},${y(eq.p)}H${x(eq.b)}" class="gl-loop"/>`;
            const [a, b] = segments[segment], v = (a + b) / 2;
            marks += `<circle cx="${x(v)}" cy="${y(M.pressure(t, v))}" r="5" class="gl-dot current"/>`;
          } else {
            if (loop) marks += path(eq.a, eq.b, 'gl-loop');
            marks += path(lo, eq.a, 'gl-equilibrium') + `<path d="M${x(eq.a)},${y(eq.p)}H${x(eq.b)}" class="gl-equilibrium"/>` + path(eq.b, hi, 'gl-equilibrium');
            const s = M.state(t, currentVolume(), eq);
            marks += `<circle cx="${x(s.v)}" cy="${y(s.p)}" r="6" class="gl-dot current"><title>当前体积 ${fmt(s.v)} Vmc，压强 ${fmt(s.p)} pc</title></circle>`;
          }
          [eq.a, eq.b].forEach((v, i) => { marks += `<circle cx="${x(v)}" cy="${y(eq.p)}" r="3.8" class="gl-dot"/>`; labels += label(x(v) + (i ? 0 : 4), y(eq.p) - 12, i ? 'B' : 'A'); });
          if (view === 'stability' || loop) {
            labels += label(x(eq.j), y(M.pressure(t, eq.j)) + 20, 'J') + label(x(eq.n), y(M.pressure(t, eq.n)) - 12, 'N');
            if (width > 410 || view === 'stability') labels += label(x(eq.d), y(eq.p) + 22, 'D');
          }
          if (width > 440 && view === 'compression') labels += label((x(eq.a) + x(eq.b)) / 2, y(eq.p) + 24, '两相共存平台');
        }
      } else {
        marks = path(lo, hi, 'gl-equilibrium');
        if (Math.abs(t - 1) < 1e-9) { marks += `<circle cx="${x(1)}" cy="${y(1)}" r="5" class="gl-dot"/>`; labels += label(x(1) + 8, y(1) - 14, 'C', 'start'); }
        const v = currentVolume();marks += `<circle cx="${x(v)}" cy="${y(M.pressure(t, v))}" r="6" class="gl-dot current"/>`;
      }
      svg.innerHTML = prefix + `<g clip-path="url(#${clip})">${marks}</g>` + labels;
    }
    function drawMu(pTrial, rr) {
      if (!eq || view !== 'maxwell') return;
      const svg = $('mu'), values = muSamples.flatMap(s => s.mm), min = Math.min(...values), max = Math.max(...values), padding = Math.max(1e-5, (max - min) * .12);
      const {x, y, prefix, box, clip} = axis(svg, '同温同压下比较化学势', '(μ − μ共存)/(pc Vmc)', '压强 p/pc', [pLow, pHigh], [min - padding, max + padding], 285);
      const mu0 = M.chemical(t, eq.a);
      let marks = `<path d="M${x(pTrial)},${box.top}V${box.bottom}" class="gl-trial"/>`;
      for (let branch = 0; branch < 3; branch++) {
        const pts = muSamples.map((s, i) => (i ? 'L' : 'M') + x(s.p).toFixed(3) + ',' + y(s.mm[branch]).toFixed(3)).join('');
        marks += `<path d="${pts}" class="${['gl-equilibrium', 'gl-unstable', 'gl-metastable'][branch]}"/>`;
      }
      rr.forEach((v, i) => { marks += `<circle cx="${x(pTrial)}" cy="${y(M.chemical(t, v) - mu0)}" r="${i === 1 ? 3 : 5}" class="gl-dot current"><title>${['液相候选', '不稳定候选', '气相候选'][i]}：μ差 ${fmt(M.chemical(t, v) - mu0, 6)}</title></circle>`; });
      const equilibriumX = x(eq.p), near = Math.abs(pTrial - eq.p) < (pHigh - pLow) * .001;
      marks += `<circle cx="${equilibriumX}" cy="${y(0)}" r="5" class="gl-dot"/>`;
      let labels = label(equilibriumX + (equilibriumX > (box.left + box.right) / 2 ? -8 : 8), y(0) + 23, near ? 'A = B' : '共存点', equilibriumX > (box.left + box.right) / 2 ? 'end' : 'start');
      if (!near) {
        const liquidY = y(M.chemical(t, rr[0]) - mu0), gasY = y(M.chemical(t, rr[2]) - mu0);
        const toLeft = x(pTrial) > (box.left + box.right) / 2;
        labels += label(x(pTrial) + (toLeft ? -10 : 10), Math.min(liquidY, gasY) - 11, liquidY < gasY ? '液体更低' : '气体更低', toLeft ? 'end' : 'start');
      }
      svg.innerHTML = prefix + `<g clip-path="url(#${clip})">${marks}</g>` + labels;
    }
    function drawVessel() {
      const svg = $('vessel'), width = Math.max(240, svg.parentElement.clientWidth), left = 14, right = width - 14, capacity = right - left, v = currentVolume(), s = M.state(t, v, eq);
      const length = capacity * v / hi, liquid = eq ? (1 - s.gasFraction) * (s.kind === 'liquid' ? v : eq.a) : 0, liquidWidth = capacity * liquid / hi;
      svg.setAttribute('viewBox', `0 0 ${width} 140`);
      svg.innerHTML = `<title>恒温活塞容器，固定总物质的量</title><path d="M${right},22H${left}V102H${right}" class="gl-frame"/><rect x="${left}" y="23" width="${length}" height="78" fill="var(--soft)"/><rect x="${left}" y="23" width="${liquidWidth}" height="78" fill="var(--teal)" opacity=".3"/><path d="M${left + length},17V108" stroke="var(--blue)" stroke-width="5"/><path d="M${left + length},62H${right}" stroke="var(--muted)" stroke-width="2"/>${liquidWidth > 34 ? label(left + liquidWidth / 2, 68, '液') : ''}${length - liquidWidth > 45 ? label(left + liquidWidth + (length - liquidWidth) / 2, 68, eq ? '气' : '流体') : ''}<text x="${left}" y="130">恒温活塞容器 · 总物质的量固定</text>`;
    }
    function render(persist = true) {
      const pTrial = eq ? pLow + q * (pHigh - pLow) : 0, rr = eq && view === 'maxwell' ? M.roots(t, pTrial, eq) : null;
      $('temperature').value = t; $('t-value').textContent = fmt(t, 3);$('compression').value = compression; $('c-value').textContent = fmt(compression, 1) + '%';
      $('pressure').value = q * 1000; $('p-value').textContent = eq ? fmt(pTrial, 5) : '—';$('loop').checked = loop;
      root.querySelectorAll('[data-gl-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.glView === view)));
      root.querySelectorAll('[data-gl-t]').forEach(b => b.setAttribute('aria-pressed', String(Math.abs(Number(b.dataset.glT) - t) < 1e-8)));
      root.querySelectorAll('[data-gl-segment]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.glSegment === segment)));
      $('compression-controls').hidden = view !== 'compression';$('pressure-controls').hidden = view !== 'maxwell' || !eq;
      $('stability-controls').hidden = view !== 'stability';$('segments').hidden = view !== 'stability' || !eq;
      $('maxwell').hidden = view !== 'maxwell' || !eq;
      if (view === 'compression') $('vessel').removeAttribute('hidden'); else $('vessel').setAttribute('hidden', '');
      $('loop-control').hidden = view !== 'compression' || !eq;
      $('play').textContent = running ? '暂停压缩' : '播放压缩';$('play').setAttribute('aria-pressed', String(running));
      let message;
      if (!eq) message = t === 1 ? '临界点 C：A、B 合并为同一点，两相密度差消失。曲线在 C 处水平，但仍随体积减小而增压。' : '温度高于 Tc：等温线单调下降，等温压缩经过连续的均匀流体状态，图中不再出现气液共存平台。';
      else if (view === 'compression') {
        const s = M.state(t, currentVolume(), eq);
        message = s.kind === 'gas' ? '纯气体 → B：压缩使体积减小、压强升高。到 B 时开始出现液体。' : s.kind === 'liquid' ? '到 A 后已成为纯液体。继续压缩，压强迅速升高。' : `B → A：压强保持 ${fmt(eq.p)} pc；气体逐渐变成液体。液体占总物质的量 ${fmt((1 - s.gasFraction) * 100, 1)}%，两相各自的密度保持不变。`;
      } else if (view === 'stability') {
        message = {liquid:'稳定液体：曲线斜率为负，小体积扰动能恢复；同温同压下，液体的化学势更低。',metaliquid:'AJ 亚稳液体（过热液体）：斜率为负，能抵抗小体积扰动；气体的化学势更低，形成气泡后可转变为气体。',unstable:'JDN 机械不稳定：斜率为正。压小一点，内部压强反而下降，外界会进一步把它压小，扰动自行放大。',metagas:'NB 亚稳气体（过饱和蒸气）：斜率为负，能抵抗小体积扰动；液体的化学势更低，形成液滴后可发生凝结。',gas:'稳定气体：曲线斜率为负，小体积扰动能恢复；同温同压下，气体的化学势更低。'}[segment];
      } else {
        const a = M.area(t, pTrial, rr), equal = Math.abs(a.deltaMu) < 1e-7;
        message = equal ? '两块面积相等，μ气 = μ液。这条水平线才是平衡共存平台；液、气两端对应讲义的 A、B。' : a.deltaMu > 0 ? 'μ气 > μ液：凝结能降低总 G，液体更有利。当前水平线高于共存压强。' : 'μ气 < μ液：汽化能降低总 G，气体更有利。当前水平线低于共存压强。';
        $('area-above').textContent = fmt(a.above, 6);$('area-below').textContent = fmt(a.below, 6);$('dmu').textContent = fmt(a.deltaMu, 6);
      }
      if (message !== status) { $('state').textContent = message; status = message; }
      $('legend').innerHTML = view === 'maxwell' && eq ? '<span><i class="gl-key-loop"></i>均匀相模型</span><span><i class="gl-key-trial"></i>试画水平线</span>' : view === 'stability' && eq ? '<span><i></i>稳定</span><span><i class="gl-key-meta"></i>亚稳</span><span><i class="gl-key-unstable"></i>机械不稳定</span>' : '<span><i></i>平衡等温线</span>' + (loop && eq ? '<span><i class="gl-key-loop"></i>均匀相回折线</span>' : '');
      $('plot-note').textContent = view === 'maxwell' && eq ? '浅棕色为线下方面积，浅青色为线上方面积；读数以 pc Vmc 为单位。液、中、气是当前压强下的三个候选状态。' : view === 'stability' && eq ? 'A、B 是共存端点；J、N 是斜率为零的机械稳定边界；D 是共存压强下的不稳定候选态。J、N 两点本身为边界，机械不稳定发生在两点之间。' : '横轴体积向右增大，压缩时状态点向左走。平台内部代表气液混合物，体积随气液比例改变。';
      drawPV(pTrial, rr);drawMu(pTrial, rr);if (view === 'compression') drawVessel();
      if (persist) save();
    }
    function stop() { running = false; cancelAnimationFrame(raf);raf = 0;lastTime = 0; }
    function tick(time) {
      if (!running) return;
      if (lastTime) compression = Math.min(100, compression + Math.min(.08, (time - lastTime) / 1000) * 7);
      lastTime = time;if (compression >= 100) stop();render(false);
      if (running) raf = requestAnimationFrame(tick); else save();
    }
    configure();render(false);
    listen($('temperature'), 'input', () => {stop();t = Number($('temperature').value);configure();render();});
    listen($('compression'), 'input', () => {stop();compression = Number($('compression').value);render();});
    listen($('pressure'), 'input', () => {q = Number($('pressure').value) / 1000;render();});
    listen($('loop'), 'change', () => {loop = $('loop').checked;render();});
    listen($('equal'), 'click', () => {if (eq) {q = (eq.p - pLow) / (pHigh - pLow);render();}});
    listen($('reset'), 'click', () => {stop();compression = 0;render();});
    listen($('play'), 'click', () => {if (running) stop();else {if (compression >= 100) compression = 0;running = true;raf = requestAnimationFrame(tick);}render();});
    root.querySelectorAll('[data-gl-t]').forEach(b => listen(b, 'click', () => {stop();t = Number(b.dataset.glT);compression = 0;configure();render();}));
    root.querySelectorAll('[data-gl-view]').forEach(b => listen(b, 'click', () => {stop();view = b.dataset.glView;render();}));
    root.querySelectorAll('[data-gl-segment]').forEach(b => listen(b, 'click', () => {segment = b.dataset.glSegment;render();}));
    listen(document, 'visibilitychange', () => {if (document.hidden && running) {stop();render();}});
    const observer = new ResizeObserver(() => render(false));observer.observe(root);cleanups.push(() => observer.disconnect());
    dispose = () => {stop();cleanups.forEach(fn => fn());};
  }
  window.GasLiquidDemo = {markup, mount, unmount};
})();
