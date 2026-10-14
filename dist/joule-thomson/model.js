/* One-mole van der Waals caloric model; all public coordinates use critical scales. */
(function (root, factory) {
  const model = factory();
  if (typeof module === 'object' && module.exports) module.exports = model;
  else root.JouleThomsonModel = model;
})(typeof window === 'undefined' ? globalThis : window, function () {
  'use strict';
  const CV = 1.5, MIN_T = 1.05, MIN_P = 0.15;
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  function bisect(fn, value, lo, hi) {
    for (let i = 0; i < 70; i++) {
      const mid = (lo + hi) / 2;
      if (fn(mid) > value) hi = mid; else lo = mid;
    }
    return (lo + hi) / 2;
  }
  // q=b/V; t=RTb/a; p=Pb²/a. Above Tc the equation is strictly monotone in q.
  function fromQT(q, t) {
    const p = t * q / (1 - q) - q * q;
    const den = t - 2 * q * (1 - q) ** 2;
    const T = t * 27 / 8;
    const alphaT = t * (1 - q) / den;
    return {
      P: p * 27, T, V: 1 / (3 * q), q,
      h: (t * (CV + 1 / (1 - q)) - 2 * q) * 27 / 8,
      cp: CV + t / den,
      alphaT, alpha: alphaT / T,
      mu: (2 * (1 - q) ** 2 - t) / (8 * (CV * den + t)),
      stable: den > 0 && T >= MIN_T - 1e-10
    };
  }
  function realState(P, T) {
    if (!(P > 0 && T >= MIN_T)) throw new RangeError('需要 P>0、T/Tc≥1.05。');
    const t = T * 8 / 27;
    const q = bisect(x => t * x / (1 - x) - x * x, P / 27, 0, 1 - 1e-12);
    return fromQT(q, t);
  }
  function idealState(P, T) {
    if (!(P > 0 && T > 0)) throw new RangeError('需要正压强和绝对温度。');
    return {P, T, V: (8 / 3) * T / P, h: (CV + 1) * T,
      cp: CV + 1, alphaT: 1, alpha: 1 / T, mu: 0, stable: true};
  }
  function initial(kind, P, T) { return kind === 'ideal' ? idealState(P, T) : realState(P, T); }
  // Solve H(P,T)=H(A) anew, rather than integrating a frozen coefficient.
  function downstream(kind, A, P) {
    if (!(P > 0 && P <= A.P + 1e-9)) throw new RangeError('出口压力应为正且不超过入口压力。');
    if (kind === 'ideal') return idealState(P, A.T);
    const h = A.h * 8 / 27;
    const tOfQ = q => (h + 2 * q) / (CV + 1 / (1 - q));
    const pOfQ = q => tOfQ(q) * q / (1 - q) - q * q;
    // All allowed starting states have h>0; this branch runs continuously from A.
    const q = bisect(pOfQ, P / 27, 0, A.q);
    return fromQT(q, tOfQ(q));
  }
  function endpoint(kind, A, requestedP) {
    let P = clamp(requestedP, MIN_P, A.P);
    let reason = P > requestedP + 1e-8 ? 'pressure' : null;
    if (kind === 'real' && downstream(kind, A, P).T < MIN_T) {
      let lo = P, hi = A.P;
      for (let i = 0; i < 65; i++) {
        const mid = (lo + hi) / 2;
        if (downstream(kind, A, mid).T < MIN_T) lo = mid; else hi = mid;
      }
      P = hi;
      reason = 'temperature';
    }
    return {P, limited: P > requestedP + 1e-8, reason, state: downstream(kind, A, P)};
  }
  function inversion(q) {
    return {P: 27 * (2 * q - 3 * q * q), T: (27 / 4) * (1 - q) ** 2};
  }
  function inversionPressure(T) {
    if (T > 27 / 4 || T < 3 / 4) return null;
    return inversion(1 - Math.sqrt(T / (27 / 4))).P;
  }
  function crossing(A, endP) {
    let previous = A;
    for (let i = 1; i <= 200; i++) {
      const next = downstream('real', A, A.P + (endP - A.P) * i / 200);
      if (previous.mu * next.mu < 0) {
        let lo = next.P, hi = previous.P;
        for (let k = 0; k < 55; k++) {
          const mid = (lo + hi) / 2;
          if (downstream('real', A, mid).mu * previous.mu > 0) hi = mid; else lo = mid;
        }
        return downstream('real', A, (lo + hi) / 2);
      }
      previous = next;
    }
    return null;
  }
  const presets = {
    cooling: {P: 4, T: 2.5, drop: 0.8},
    heating: {P: 4, T: 7, drop: 0.8},
    inversion: {P: 9, T: 3, drop: 0.8},
    crossing: {P: 10, T: 4.5, drop: 0.85}
  };
  return {CV, MIN_T, MIN_P, initial, realState, idealState, downstream, endpoint,
    inversion, inversionPressure, crossing, presets, clamp};
});
