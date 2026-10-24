const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const M = require('../dist/gas-liquid/model.js');
const near = (a, b, tolerance = 1e-8) => assert.ok(Math.abs(a - b) < tolerance, `${a} != ${b}`);

test('Coexistence satisfies equal pressure, chemical potential and both areas across the temperature range', () => {
  for (const t of [.85, .9, .95, .98, .99, .995, .999]) {
    const e = M.coexistence(t);
    assert.ok(e.a < e.j && e.j < e.d && e.d < e.n && e.n < e.b);
    for (const v of [e.a, e.d, e.b]) near(M.pressure(t, v), e.p);
    near(M.chemical(t, e.a), M.chemical(t, e.b));
    near(e.above, e.below);assert.ok(e.above > 0);
    near(M.slope(t, e.j), 0);near(M.slope(t, e.n), 0);
  }
  const e = M.coexistence(.9);near(e.p, .646998351872251);near(e.a, .603401903178003);near(e.b, 2.34884237620223);
});

test('Off-equilibrium area difference predicts the favorable phase and equals the chemical-potential difference', () => {
  for (const t of [.85, .9, .98, .995]) {
    const e = M.coexistence(t);
    for (const p of [(e.p + M.pressure(t, e.j)) / 2, (e.p + M.pressure(t, e.n)) / 2]) {
      const a = M.area(t, p);
      near(a.deltaMu, a.below - a.above);
      assert.equal(Math.sign(a.deltaMu), Math.sign(p - e.p));
    }
  }
});

test('Lever rule preserves mean volume and endpoints at fixed coexistence pressure', () => {
  const e = M.coexistence(.9);
  for (const fraction of [0, .1, .5, .9, 1]) {
    const v = (1 - fraction) * e.a + fraction * e.b, s = M.state(.9, v, e);
    near(s.p, e.p);near(s.gasFraction, fraction);near((1 - s.gasFraction) * e.a + s.gasFraction * e.b, v);
  }
  assert.equal(M.state(.9, e.a * .98, e).kind, 'liquid');assert.equal(M.state(.9, e.b * 1.1, e).kind, 'gas');
});

test('Mechanical instability and metastability are distinguished on the correct branches', () => {
  const e = M.coexistence(.9);
  for (const [a, b, key, sign] of [[e.a * .9, e.a, 'liquid', -1], [e.a, e.j, 'metaliquid', -1], [e.j, e.n, 'unstable', 1], [e.n, e.b, 'metagas', -1], [e.b, e.b * 1.1, 'gas', -1]]) {
    const v = (a + b) / 2;assert.equal(M.classify(e, v), key);assert.equal(Math.sign(M.slope(.9, v)), sign);
  }
});

test('Chemical potential uses the same EOS: finite differences satisfy dmu/dp = v', () => {
  const e = M.coexistence(.9);
  for (const p of [e.p * .97, e.p, e.p * 1.03]) {
    const h = 1e-6, roots = M.roots(.9, p), before = M.roots(.9, p - h), after = M.roots(.9, p + h);
    roots.forEach((v, i) => near((M.chemical(.9, after[i]) - M.chemical(.9, before[i])) / (2 * h), v, 2e-7));
  }
});

test('Critical point has zero first and second derivatives and no finite two-phase interval', () => {
  near(M.pressure(1, 1), 1);near(M.slope(1, 1), 0);near(M.curvature(1, 1), 0);
  assert.equal(M.coexistence(1), null);assert.equal(M.coexistence(1.08), null);
  for (const t of [1, 1.08, 1.1]) for (const v of [.4, .7, 1, 1.5, 3, 8]) assert.ok(M.slope(t, v) <= 1e-12);
  const a = M.coexistence(.9), b = M.coexistence(.995);assert.ok(b.b - b.a < a.b - a.a);
});

test('Lesson formulas render and module is registered with all its local assets', () => {
  const context = {window: {GasLiquidDemo: {markup: '<div></div>', mount() {}, unmount() {}}}};
  vm.runInNewContext(fs.readFileSync(require.resolve('../dist/gas-liquid/page.js'), 'utf8'), context);
  const katex = require('../dist/vendor/katex/katex.min.js');
  for (const formula of Object.values(context.window.GasLiquidLesson.formulas)) katex.renderToString(formula, {throwOnError: true});
  assert.ok(context.window.SiteDemos['gas-liquid']);
  const c = require('../dist/catalog.json'), r = c.resources.find(r => r.id === 'gas-liquid'), html = fs.readFileSync(require.resolve('../dist/index.html'), 'utf8');
  assert.equal(r.kind, 'local');
  r.localAssets.forEach(asset => assert.ok(html.includes(asset), asset));
});
