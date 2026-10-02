#!/usr/bin/env node
'use strict';
// Usage: node .github/checks/incenter-angle-bisector-check.cjs
// Uses the actual helpers and episode configurations, without a browser.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const M = require(path.join(root, 'proof-episodes/shared/geometry.js'));
const load = slug => {
  const context = {window:{}};
  vm.runInNewContext(fs.readFileSync(path.join(root, 'proof-episodes', slug, 'episode.js'), 'utf8'), context);
  return context.window.ProofEpisode;
};
const episodes = ['incenter', 'angle-bisector'].map(load);
const p = (x,y) => ({x,y});
const clone = v => v.map(q => ({...q}));
const close = (a,b,scale=1) => assert.ok(Math.abs(a-b) <= 1e-7*Math.max(Math.abs(a),Math.abs(b),scale), `${a} != ${b}`);
const finite = q => q && Number.isFinite(q.x) && Number.isFinite(q.y);
const cases = [
  [p(-.25,-.7),p(-.9,.55),p(.85,.55)],
  [p(0,0),p(1,0),p(.4,.8)],
  [p(0,0),p(1,0),p(-.6,.25)],
  [p(0,1),p(0,0),p(1,0)],
  [p(0,0),p(1,0),p(.4,1e-6)],
  [p(0,0),p(1e-5,2e-5),p(1,.3)]
];
let seed = 0x20261002;
const random = () => ((seed = (Math.imul(seed,1664525)+1013904223)>>>0)/4294967296)*2-1;
while(cases.length < 256) {
  const v = [p(random(),random()),p(random(),random()),p(random(),random())];
  const g = M.triangle(v);
  if(!g.degenerate && g.area/g.scale**2 > 1e-5) cases.push(v);
}
let drawings = 0;
function recorder(g) {
  const parts = new Set();
  const colors = {blue:'blue',teal:'teal',purple:'purple',gold:'gold',muted:'muted',ink:'ink',red:'red'};
  const record = args => {for(const a of args) if(a && typeof a === 'object' && a['data-part']) parts.add(a['data-part']);};
  const points = list => {for(const q of list)assert.ok(finite(q), 'nonfinite drawing point');};
  const d = {colors};
  for(const [method,n] of [['segment',2],['line',2],['tick',2],['angle',3],['right',3]]) d[method] = (...args) => {
    points(args.slice(0,n)); record(args);
    if(method === 'right') {
      const [f,a,b] = args, u=M.sub(a,f), v=M.sub(b,f);
      assert.ok(Math.abs(M.dot(u,v)) <= 1e-7*M.norm(u)*M.norm(v)+1e-14*g.scale*g.scale, 'false right-angle mark');
    }
  };
  d.poly = (...args) => {points(args[0]);record(args);};
  d.point = d.label = (...args) => {points([args[0]]);record(args);};
  d.circle = (...args) => {points([args[0]]);assert.ok(Number.isFinite(args[1])&&args[1]>0);record(args);};
  return {d,parts};
}
for(const vertices of cases) for(const C of episodes) {
  let v=clone(vertices), params={...C.params};
  if(C.constrain)v=C.constrain(v,params,true,0,M);
  let g=M.triangle(v);assert.ok(!g.degenerate);
  Object.assign(g,C.compute(g,params,M));
  if(C.slug==='incenter') {
    for(const [foot,a,b] of [[g.X,g.A,g.B],[g.Y,g.A,g.C],[g.Z,g.B,g.C]]) {
      const t=M.parameter(foot,a,b);assert.ok(t>0&&t<1,'incircle foot outside its side');
      close(M.dist(g.I,foot),g.r,g.scale);
    }
    close(M.dist(g.lemmaP,g.lemmaX),M.dist(g.lemmaP,g.lemmaY),g.scale);
    assert.ok(g.bisectorEnds.every(finite));
  } else {
    close(g.bd/g.dc,g.ab/g.ac);
    close(g.areaABD/g.areaACD,g.bd/g.dc);
    close(M.dist(g.D,g.X),M.dist(g.D,g.Y),g.scale);
    const before=clone(v), saved=.283;
    const mode={...C.params,t:saved};
    C.constrain(v,mode,true,0,M);
    assert.equal(mode.freeT,saved);assert.equal(C.handles(g,mode,M).length,0);
    C.constrain(v,mode,true,8,M);C.constrain(v,mode,false,8,M);
    assert.equal(mode.t,saved);assert.equal(C.handles(g,mode,M).length,1);
    assert.deepEqual(v,before,'proof mode changed ABC');
  }
  for(let s=-1;s<C.steps.length;s++) {
    const {d,parts}=recorder(g);C.draw(d,g,s,params,M);drawings++;
    const extent=C.extent(g,params,s);assert.ok(extent.every(finite));
    if(s>=0)for(const key of ['text','facts','key']) {
      const value=typeof C.steps[s][key]==='function'?C.steps[s][key](g,params):C.steps[s][key];
      assert.ok(value,'missing proof field '+key);
    }
    if(C.slug==='incenter'&&s>=0) {
      assert.equal(parts.has('incircle'),s>=12,'circle appears before its construction');
      assert.equal(parts.has('point-I'),s>=6,'I appears before being defined');
      assert.equal(parts.has('bisector-2'),s>=9,'third bisector appears before concurrency');
    }
    if(C.slug==='angle-bisector'&&s>=7&&s<=10) {
      assert.ok(!parts.has('angle-BAD')&&!parts.has('angle-DAC'),'converse assumes equal angles');
    }
  }
}
for(const v of [[p(0,0),p(0,0),p(0,0)],[p(0,0),p(1,0),p(2,0)],[p(0,0),p(0,0),p(1,1)]]) {
  const g=M.triangle(v);assert.ok(g.degenerate);assert.equal(g.I,null);
}
assert.equal(drawings,7936);
console.log(`Passed: ${cases.length} triangles, ${drawings} drawing states, geometric identities, mode restoration, proof visibility, and collapse detection.`);
