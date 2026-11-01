'use strict';
// Independent numerical and drawing checks. The displayed arguments prove the results.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const M=require(root+'/proof-episodes/shared/geometry.js');
const Q=require(root+'/proof-episodes/shared/circle-geometry.js');
const load=slug=>{const context={window:{CircleGeometry:Q}};vm.runInNewContext(fs.readFileSync(root+'/proof-episodes/'+slug+'/episode.js','utf8'),context);return context.window.ProofEpisode;};
const configs=['power-of-a-point','ptolemy','brahmagupta'].map(load);
const P=(x,y)=>({x,y});
const close=(a,b,tol=2e-7,scale=1)=>assert.ok(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=tol*Math.max(scale,Math.abs(a),Math.abs(b)),a+' != '+b);
const finite=q=>assert.ok(q&&Number.isFinite(q.x)&&Number.isFinite(q.y),'nonfinite point');
let seed=626116;
const random=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);
const triangles=[
 [P(0,0),P(4,0),P(0,3)],[P(0,3),P(4,0),P(0,0)],
 [P(0,0),P(4,0),P(1,.4)],[P(0,Math.sqrt(3)),P(-1,0),P(1,0)],
 [P(.2,1e-6),P(-1,0),P(1,0)],[P(0,0),P(1,0),P(.2,1e-8)],
 [P(1e6,3e6),P(1e6,1e6),P(5e6,1e6)]
];
for(let i=0;i<600;i++)triangles.push(Array.from({length:3},()=>P(4*random()-2,4*random()-2)));
let metricCases=0,powerCases=0,draws=0;
function painter(){
 const calls=[];
 const d={colors:{blue:'blue',teal:'teal',purple:'purple',gold:'gold',ink:'ink',muted:'muted',red:'red'}};
 for(const name of ['segment','line','poly','circle','label','point','tick','right','angle','arc'])d[name]=(...args)=>{
  if(name==='poly')args[0].forEach(finite);
  else if(['segment','line','tick'].includes(name))args.slice(0,2).forEach(finite);
  else if(['right','angle'].includes(name))args.slice(0,3).forEach(finite);
  else finite(args[0]);
  if(name==='circle'||name==='arc')assert.ok(Number.isFinite(args[1])&&args[1]>0);
  calls.push([name,args]);
 };
 return {d,calls};
}
function drawCheck(C,g,p){
 const {d,calls}=painter();
 C.construction.draw(d,g,0,p,M);assert.equal(calls.length,0,'blank first stage');
 assert.equal(C.construction.extent(g,p,0,M).length,3,'initial extent is ABC');
 for(let level=1;level<=C.construction.steps.length;level++){
  calls.length=0;C.construction.draw(d,g,level,p,M);assert.ok(calls.length);
  C.construction.extent(g,p,level,M).forEach(finite);draws++;
  assert.deepEqual(Array.from(C.construction.handleIds(level)),level>=2?[C.slug==='power-of-a-point'?'P':'D']:[]);
 }
 for(let step=0;step<C.steps.length;step++){
  calls.length=0;C.draw(d,g,step,p,M);assert.ok(calls.length,'empty proof step '+step);
  C.extent(g,p,step,M).forEach(finite);draws++;
  assert.ok(C.steps[step].text&&C.steps[step].key);
 }
}
for(const vertices of triangles){
 const base=M.triangle(vertices);if(base.degenerate)continue;
 for(const t of [.03,.2,.5,.8,.97]){
  const states=[];
  for(const C of configs.slice(1)){
   const p={...C.params,t},g={...base,...C.compute(base,p,M)};states.push(g);
   finite(g.D);close(M.dist(g.D,g.O),g.R,2e-7,base.scale);
   if(!base.near&&g.metricValid){
    const b=M.dist(g.B,g.C),a=M.dist(g.A,g.B),c=M.dist(g.C,g.D),d=M.dist(g.D,g.A);
    if(C.slug==='ptolemy'){
     finite(g.X);const x=M.parameter(g.X,g.A,g.C);assert.ok(x>0&&x<1);
     close(M.angle(g.A,g.B,g.X),M.angle(g.D,g.B,g.C),1e-7);
     close(M.dist(g.A,g.X)*g.bd,a*c);
     close(M.dist(g.X,g.C)*g.bd,b*d);
     close(g.leftProduct,g.rightProduct);
    }else{
     close(g.theta+g.opposite,180,1e-7);
     const shoelace=Math.abs(M.cross(M.sub(g.B,g.A),M.sub(g.C,g.A))+M.cross(M.sub(g.C,g.A),M.sub(g.D,g.A)))/2;
     close(g.polygonArea,shoelace);close(g.formulaArea,shoelace);
     close(g.a*g.a,g.x*g.x+g.height*g.height);
     close(g.diagonal*g.diagonal,(g.b-g.x)**2+g.height*g.height);
     close(2*g.polygonArea,(a*b+c*d)*Math.sin(g.theta*Math.PI/180));
    }
   }
   if(metricCases<60)drawCheck(C,g,p);
  }
  close(M.dist(states[0].D,states[1].D),0,1e-8,base.scale);
  metricCases++;
 }
 const C=configs[0];
 for(const point of [[0,0],[.45,.15],[1,0],[-1,0],[1.45,.12],[3,-2]])for(const tilt of [-.95,0,.35,.95]){
  const p={...C.params,px:point[0],py:point[1],tilt},g={...base,...C.compute(base,p,M)};
  ['P','F','X','Y','W','Z'].forEach(k=>finite(g[k]));
  assert.ok(g.halfChord>0,'proper secant must meet twice');
  close(g.directedProduct,g.power,3e-7,base.R*base.R);
  close(g.ordinaryProduct,Math.abs(g.power),3e-7,base.R*base.R);
  close(M.dist(g.O,g.X),g.R,3e-7,base.R);close(M.dist(g.O,g.Y),g.R,3e-7,base.R);
  close(M.dist(g.P,g.X)*M.dist(g.P,g.Y),Math.abs(g.power),3e-7,base.R*base.R);
  close(M.dist(g.P,g.W)*M.dist(g.P,g.Z),Math.abs(g.power),3e-7,base.R*base.R);
  close(M.dist(g.F,g.X),M.dist(g.F,g.Y),3e-7,base.R);
  close(M.dot(M.sub(g.O,g.F),M.sub(g.Y,g.X)),0,3e-7,base.R*base.R);
  if(g.T){finite(g.T);close(M.dist(g.O,g.T),g.R,3e-7,base.R);close(M.dot(M.sub(g.O,g.T),M.sub(g.P,g.T)),0,3e-7,base.R*base.R);close(M.dist(g.P,g.T)**2,g.power,3e-7,base.R*base.R);assert.equal(C.steps[7].guard(g),'');}
  else assert.ok(C.steps[7].guard(g),'tangent step needs an exterior point');
  if(powerCases<80)drawCheck(C,g,p);
  powerCases++;
 }
}
for(const C of configs){
 const g0=M.triangle(C.initial),p={...C.params},g={...g0,...C.compute(g0,p,M)};
 const h=C.handles(g,p,M)[0];finite(h.point);
 if(C.slug==='power-of-a-point'){
  const target=M.add(g.O,M.mul({x:-.3,y:.4},g.R));h.move(target);
  const g1={...g0,...C.compute(g0,p,M)};close(M.dist(target,g1.P),0,1e-7,g.R);
 }else{
  const target=Q.cyclic(g,.73,M).D;h.move(target);close(p.t,.73);
 }
}
assert.ok(M.triangle([P(0,0),P(1,0),P(2,0)]).degenerate);
console.log('Circle metrics: '+metricCases+' cyclic configurations, '+powerCases+' secant positions, '+draws+' finite draw stages; independent diagonal, area, power, tangent, reveal, and handle checks passed.');
