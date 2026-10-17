'use strict';
// Coordinate and reveal-order regressions; the episode text supplies the proofs.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../../proof-episodes');
const M = require(path.join(root, 'shared/geometry.js'));
function load(slug) {
  const window = {};
  vm.runInNewContext(fs.readFileSync(path.join(root, slug, 'episode.js'), 'utf8'), {window});
  return window.ProofEpisode;
}
const T = load('trig-ceva'), S = load('symmedian');
const pt = (x, y) => ({x, y});
const close = (a, b, eps = 3e-7) => assert(Math.abs(a - b) <= eps * Math.max(1, Math.abs(a), Math.abs(b)), `${a} != ${b}`);
const pointClose = (a, b, scale, eps = 3e-7) => assert(M.dist(a, b) <= eps * scale, 'constructed points agree');
const sine = (a, v, b) => Math.abs(M.cross(M.sub(a, v), M.sub(b, v))) / (M.dist(a, v) * M.dist(b, v));
function recorder() {
  const calls = [], d = {colors: {blue: '#315dcc', teal: '#087c70', purple: '#8551bd', gold: '#ad660d', muted: '#9aa5b8', ink: '#26364b'}};
  const finite = p => assert(p && Number.isFinite(p.x) && Number.isFinite(p.y), 'finite drawn point');
  for (const kind of ['segment', 'line', 'point', 'label', 'circle', 'poly', 'right', 'tick', 'angle']) d[kind] = (...args) => {
    calls.push({kind, args});
    if (kind === 'poly') {args[0].forEach(finite); return;}
    finite(args[0]);
    if (kind === 'point' || kind === 'label') {assert.equal(typeof args[1], 'string'); return;}
    if (kind === 'circle') {assert(args[1] > 0 && Number.isFinite(args[1])); return;}
    finite(args[1]);
    if (kind === 'line') assert(M.dist(args[0], args[1]) > 0);
    if (kind === 'angle' || kind === 'right') finite(args[2]);
    if (kind === 'right') {
      const u = M.sub(args[1], args[0]), v = M.sub(args[2], args[0]);
      assert(M.norm(u) > 0 && M.norm(v) > 0);
      assert(Math.abs(M.dot(u, v)) <= 2e-6 * M.norm(u) * M.norm(v), 'right-angle mark is perpendicular');
    }
  };
  return {d, calls};
}
function verifyConstruction(C, g, p) {
  const B = C.construction;
  assert(B.steps.length >= 4 && B.steps.length <= 7);
  for (let l = 0; l <= B.steps.length; l++) {
    const {d, calls} = recorder();
    B.draw(d, g, l, p, M);
    const extent = B.extent(g, p, l, M);
    if (!l) {assert.equal(calls.length, 0); assert.equal(extent.length, 3); assert.equal(B.handleIds(l).length, 0);}
    const visible = [...g.vertices];
    for (const call of calls) {
      if (call.kind === 'poly') visible.push(...call.args[0]);
      else for (const arg of call.args) if (arg && typeof arg === 'object' && 'x' in arg) visible.push(arg);
    }
    if (C.handles) visible.push(...C.handles(g, p, M).filter(h => B.handleIds(l).includes(h.id)).map(h => h.point));
    for (const q of extent) assert(visible.some(v => M.dist(q, v) <= 1e-10 * g.scale), 'extent cannot reveal future objects');
    if (C.slug === 'symmedian') assert.equal(calls.some(c => c.kind === 'point' && c.args[1] === 'K'), l === 7);
    assert(!/NaN|Infinity/.test(B.status(g, p, l, M)));
  }
}
const examples = [
  [pt(0, 0), pt(4, 0), pt(0, 3)],
  [pt(0, 0), pt(4, 0), pt(1, 1)],
  [pt(0, 0), pt(4, 0), pt(-1, 2)],
  [pt(0, 3), pt(-2, 0), pt(2, 0)],
  [pt(0, Math.sqrt(3)), pt(-1, 0), pt(1, 0)],
  [pt(0, 0), pt(1, 0), pt(.3, 1e-7)],
  [pt(0, 0), pt(1, 0), pt(.3, 1e-9)],
  [pt(1e-11, 3), pt(-2, 0), pt(2, 0)],
  [pt(0, Math.sqrt(3) + 1e-10), pt(-1, 0), pt(1, 0)],
  [pt(0, 0), pt(1e-6, 0), pt(0, 2e-6)],
  [pt(1e6, 1e6), pt(1e6 + 400, 1e6), pt(1e6 + 100, 1e6 + 300)]
];
let seed = 812141;
const random = () => {seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296;};
for (let i = 0; i < 300; i++) {
  const v = Array.from({length: 3}, () => pt(4 * random() - 2, 4 * random() - 2));
  if (M.area(...v) < .01) {i--; continue;} examples.push(v);
}
let checked = 0, obtuseSplit = false, rightSplit = false;
for (const v0 of examples) for (const v of [v0, [v0[0], v0[2], v0[1]]]) {
  const base = M.triangle(v); assert(!base.degenerate);
  for (const p0 of [{d: .43, e: .54, f: .66}, {d: .015, e: .985, f: .985}, {d: .73, e: .23, f: .11}]) {
    const p = {...p0}, g = {...base, ...T.compute(base, p, M)};
    for (let i = 0; i < 3; i++) {
      const a = v[i], b = v[(i + 1) % 3], c = v[(i + 2) % 3], q = g.ends[i];
      const theta = M.angle(b, a, q); obtuseSplit ||= theta > 90; rightSplit ||= Math.abs(theta - 90) < 1e-8;
      close(M.area(a, b, q), .5 * M.dist(a, b) * M.dist(a, q) * sine(b, a, q));
      close(M.area(a, q, c), .5 * M.dist(a, c) * M.dist(a, q) * sine(q, a, c));
      close(g.sideRatios[i], M.dist(a, b) / M.dist(a, c) * g.sineRatios[i]);
    }
    close(g.sineProduct, g.sideProduct);
    assert.equal(T.handles(g, p, M).length, 3); assert(!T.constrain, 'proof must keep all three side points free');
    for (let s = 0; s < T.steps.length; s++) {const {d} = recorder(); T.draw(d, g, s, p, M); T.extent(g, p, s).forEach(q => assert(q && Number.isFinite(q.x) && Number.isFinite(q.y)));}
    verifyConstruction(T, g, p);
    const before = {d: p.d, e: p.e}; T.actions[0].run(v, p, M); assert.equal(p.d, before.d); assert.equal(p.e, before.e);
    const concurrent = {...base, ...T.compute(base, p, M)};
    close(concurrent.sineProduct, 1); close(concurrent.sideProduct, 1);
    assert(p.f > 0 && p.f < 1);
    const cf = M.sub(concurrent.F, base.C), cp = M.sub(concurrent.P, base.C);
    assert(Math.abs(M.cross(cf, cp)) <= 1e-6 * base.scale * base.scale);
    // Reflecting a general concurrent family swaps every split-angle ratio.
    let reflectedProduct = 1;
    for (let i = 0; i < 3; i++) {
      const a = v[i], b = v[(i + 1) % 3], c = v[(i + 2) % 3];
      const u = M.unit(M.sub(b, a)), w = M.unit(M.sub(c, a));
      const axis = M.dot(u, w) < 0 ? M.mul(M.unit(M.perp(M.sub(u, w))), Math.sign(M.cross(u, w))) : M.unit(M.add(u, w));
      const ray = M.sub(concurrent.ends[i], a);
      const image = M.add(a, M.sub(M.mul(axis, 2 * M.dot(axis, ray)), ray));
      reflectedProduct *= sine(b, a, image) / sine(image, a, c);
    }
    close(reflectedProduct, 1, 2e-6);
  }
  const g = {...base, ...S.compute(base, {}, M)};
  assert(g.reflectedEnds.every(Boolean) && g.bisectorEnds.every(Boolean) && g.candidate);
  let product = 1;
  for (let i = 0; i < 3; i++) {
    const a = v[i], b = v[(i + 1) % 3], c = v[(i + 2) % 3], q = g.reflectedEnds[i], r = g.reflectedMids[i], t = g.bisectorEnds[i];
    pointClose(q, base.symmedianEnds[i], base.scale, 2e-6);
    close(M.dist(a, g.mids[i]), M.dist(a, r));
    const connector = M.sub(r, g.mids[i]), axis = M.sub(t, a);
    if (M.norm(connector) > 1e-8 * base.scale) assert(Math.abs(M.dot(connector, axis)) <= 2e-6 * M.norm(connector) * M.norm(axis));
    const parameter = M.parameter(q, b, c); assert(parameter > 0 && parameter < 1);
    close(M.dist(b, q) / M.dist(q, c), (M.dist(a, b) / M.dist(a, c)) ** 2, 2e-6);
    product *= sine(b, a, q) / sine(q, a, c);
  }
  close(product, 1, 2e-6); pointClose(g.candidate, base.K, base.scale, 2e-6);
  const areas = [M.area(g.candidate, base.B, base.C), M.area(g.candidate, base.C, base.A), M.area(g.candidate, base.A, base.B)];
  const weightSum = base.sides.reduce((sum, a) => sum + a * a, 0);
  areas.forEach((a, i) => close(a / base.area, base.sides[i] ** 2 / weightSum, 2e-6));
  verifyConstruction(S, g, {});
  for (let s = 0; s < S.steps.length; s++) {
    const {d, calls} = recorder(); S.draw(d, g, s, {}, M);
    assert.equal(calls.some(c => c.kind === 'point' && c.args[1] === 'K'), s >= 7, 'K is not used before concurrency is proved');
    S.extent(g, {}, s).forEach(q => assert(q && Number.isFinite(q.x) && Number.isFinite(q.y)));
  }
  checked++;
}
assert(obtuseSplit, 'include obtuse split-angle cases');
// An exactly right split angle makes the altitude foot coincide with A.
const rv = [pt(0, 0), pt(2, 0), pt(-2, 3)], rp = {d: .5, e: .4, f: .6}, rb = M.triangle(rv), rg = {...rb, ...T.compute(rb, rp, M)};
close(M.angle(rg.B, rg.A, rg.D), 90); pointClose(rg.X, rg.A, rg.scale);
for (let s = 1; s <= 3; s++) T.draw(recorder().d, rg, s, rp, M);
for (const bad of [[pt(0, 0), pt(1, 0), pt(2, 0)], [pt(0, 0), pt(0, 0), pt(1, 1)]]) assert(M.triangle(bad).degenerate, 'shared engine pauses degenerate triangles');
console.log(`PASS: ${checked} oriented triangles; sine areas, free trig-Ceva equivalence, reflection/squared ratios, K, all construction and proof drawings, right/obtuse/equilateral cases, and reveal order.`);
