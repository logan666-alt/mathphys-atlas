const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const M = require('../dist/joule-thomson/model.js');
const close = (a, b, tol = 1e-8) => assert(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} != ${b}`);

test('Ideal gas has zero coefficient and horizontal isenthalps throughout the selectable domain', () => {
  for (const P of [.5, 4, 10]) for (const T of [1.5, 3, 7.5]) {
    const A = M.idealState(P, T);
    for (const pressure of [P, P / 2, .15]) {
      const B = M.downstream('ideal', A, pressure);
      assert.equal(B.mu, 0); assert.equal(B.T, T); assert.equal(B.alphaT, 1);
      assert.equal(B.h, A.h); assert.equal(B.cp, 2.5);
    }
  }
});

test('Real-gas paths conserve full enthalpy, obey the EOS, and stay in the stable single-phase domain', () => {
  for (const P of [.5, 2, 5, 8, 10]) for (const T of [1.5, 2, 3, 5, 7.5]) {
    const A = M.realState(P, T), end = M.endpoint('real', A, Math.max(.15, P * .05));
    for (let i = 0; i <= 20; i++) {
      const B = M.downstream('real', A, P + (end.P - P) * i / 20);
      const v = B.V * 3, t = B.T * 8 / 27;
      close(B.P, 27 * (t / (v - 1) - 1 / (v * v)));
      close(B.h, A.h);
      close(B.mu, 3 / 8 * B.V * (B.alphaT - 1) / B.cp);
      assert(B.stable); assert(B.T >= M.MIN_T - 1e-8); assert(B.cp > 0);
    }
  }
});

test('CP, thermal expansion, and JT slope agree with independent finite differences', () => {
  const eps = 1e-5;
  for (const [P, T] of [[4, 2.5], [9, 3], [10, 4.5], [4, 7]]) {
    const A = M.realState(P, T), plus = M.realState(P, T + eps), minus = M.realState(P, T - eps);
    close((plus.h - minus.h) / (2 * eps), A.cp, 2e-7);
    close(T / A.V * (plus.V - minus.V) / (2 * eps), A.alphaT, 2e-7);
    const B = M.downstream('real', A, P * .8);
    const high = M.downstream('real', A, B.P + eps), low = M.downstream('real', A, B.P - eps);
    close((high.T - low.T) / (2 * eps), B.mu, 2e-7);
  }
});

test('Inversion starts have zero first-order change and a nonzero quadratic finite change', () => {
  const A = M.realState(9, 3);
  close(A.alphaT, 1); close(A.mu, 0);
  const small = M.downstream('real', A, 8.9).T - A.T;
  const half = M.downstream('real', A, 8.95).T - A.T;
  assert(small < 0); assert(Math.abs(small) > 1e-6);
  assert(Math.abs(small / half - 4) < .03);
  for (const q of [.1, 1 / 3, .5]) {
    const s = M.inversion(q), B = M.realState(s.P, s.T);
    close(B.mu, 0); close(B.alphaT, 1);
  }
});

test('Crossing preset heats, reaches an inversion maximum, then cools', () => {
  const preset = M.presets.crossing, A = M.realState(preset.P, preset.T);
  const end = M.endpoint('real', A, preset.P * (1 - preset.drop));
  const I = M.crossing(A, end.P);
  assert(A.mu < 0); assert(end.state.mu > 0); assert(I && I.P < A.P && I.P > end.P);
  close(I.mu, 0); assert(I.T > A.T); assert(end.state.T < I.T);
});

test('Temperature and pressure limits are distinguished and preserve a valid endpoint', () => {
  const cold = M.realState(4, 1.5), temperatureEnd = M.endpoint('real', cold, .15);
  assert.equal(temperatureEnd.reason, 'temperature');
  close(temperatureEnd.state.T, M.MIN_T);
  const warm = M.realState(.5, 3), pressureEnd = M.endpoint('real', warm, .025);
  assert.equal(pressureEnd.reason, 'pressure'); close(pressureEnd.P, .15);
  assert(pressureEnd.state.T > M.MIN_T);
});

test('New lesson equations render successfully with the bundled KaTeX', () => {
  const context = {window: {}};
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(require.resolve('../dist/joule-thomson/page.js'), 'utf8'), context);
  const katex = require('../dist/vendor/katex/katex.min.js');
  for (const tex of Object.values(context.window.JouleThomsonLesson.formulas)) {
    assert(katex.renderToString(tex, {throwOnError: true, trust: false}).includes('katex'));
  }
});
