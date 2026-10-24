(function (root, factory) {
  const model = factory();
  if (typeof module === 'object' && module.exports) module.exports = model;
  else root.GasLiquidModel = model;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const pressure = (t, v) => 8 * t / (3 * v - 1) - 3 / v ** 2;
  const slope = (t, v) => -24 * t / (3 * v - 1) ** 2 + 6 / v ** 3;
  const curvature = (t, v) => 144 * t / (3 * v - 1) ** 3 - 18 / v ** 4;
  const primitive = (t, v) => 8 * t / 3 * Math.log(3 * v - 1) + 3 / v;
  const chemical = (t, v) => -primitive(t, v) + pressure(t, v) * v;
  function bisect(fn, a, b) {
    let fa = fn(a), fb = fn(b);
    if (Math.abs(fa) < 1e-14) return a;
    if (Math.abs(fb) < 1e-14) return b;
    if (!Number.isFinite(fa + fb) || fa * fb > 0) throw new RangeError('Root is not bracketed');
    for (let i = 0; i < 100; i++) {
      const c = (a + b) / 2, fc = fn(c);
      if (fa * fc <= 0) b = c; else { a = c; fa = fc; }
    }
    return (a + b) / 2;
  }
  function spinodals(t) {
    if (t >= 1) return null;
    return {j: bisect(v => slope(t, v), 1 / 3 + 1e-8, 1), n: bisect(v => slope(t, v), 1, 100)};
  }
  function roots(t, p, spin = spinodals(t)) {
    if (!(p > 0)) throw new RangeError('Pressure must be positive');
    const f = v => pressure(t, v) - p;
    let upper = Math.max(10, 16 * t / (3 * p));
    while (f(upper) > 0) upper *= 2;
    if (!spin) return [bisect(f, 1 / 3 + 1e-9, upper)];
    const pmin = pressure(t, spin.j), pmax = pressure(t, spin.n);
    if (p > pmax || p < pmin) return [p > pmax ? bisect(f, 1 / 3 + 1e-9, spin.j) : bisect(f, spin.n, upper)];
    return [bisect(f, 1 / 3 + 1e-9, spin.j), bisect(f, spin.j, spin.n), bisect(f, spin.n, upper)];
  }
  function area(t, p, rr = roots(t, p)) {
    if (rr.length !== 3) return null;
    const [a, d, b] = rr;
    const below = p * (d - a) - (primitive(t, d) - primitive(t, a));
    const above = primitive(t, b) - primitive(t, d) - p * (b - d);
    return {below, above, residual: above - below, deltaMu: chemical(t, b) - chemical(t, a)};
  }
  function coexistence(t) {
    const spin = spinodals(t);
    if (!spin) return null;
    const low = Math.max(1e-8, pressure(t, spin.j)), high = pressure(t, spin.n);
    const p = bisect(q => area(t, q, roots(t, q, spin)).residual, low, high);
    const [a, d, b] = roots(t, p, spin);
    return {t, p, a, d, b, ...spin, ...area(t, p, [a, d, b])};
  }
  function phase(eq, v) {
    if (!eq) return 'single';
    if (v < eq.a) return 'liquid';
    if (v > eq.b) return 'gas';
    return 'mixture';
  }
  function classify(eq, v) {
    if (!eq) return 'single';
    if (v <= eq.a) return 'liquid';
    if (v < eq.j) return 'metaliquid';
    if (v <= eq.n) return 'unstable';
    if (v < eq.b) return 'metagas';
    return 'gas';
  }
  function state(t, v, eq = coexistence(t)) {
    const kind = phase(eq, v);
    const gasFraction = kind === 'mixture' ? clamp((v - eq.a) / (eq.b - eq.a), 0, 1) : kind === 'gas' ? 1 : 0;
    return {t, v, p: kind === 'mixture' ? eq.p : pressure(t, v), kind, gasFraction};
  }
  return {clamp, pressure, slope, curvature, primitive, chemical, bisect, spinodals, roots, area, coexistence, phase, classify, state};
});
