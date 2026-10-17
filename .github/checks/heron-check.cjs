'use strict';
// Numerical implementation checks; the episode's synthetic argument proves the theorem.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const M=require(root+'/proof-episodes/shared/geometry.js');
const context={window:{}};vm.runInNewContext(fs.readFileSync(root+'/proof-episodes/heron/episode.js','utf8'),context);
const C=context.window.ProofEpisode;
const P=(x,y)=>({x,y});
let seed=19073;
const random=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);
const cases=[
 [P(0,3),P(0,0),P(4,0)], [P(0,0),P(4,0),P(0,3)],
 [P(0,0),P(4,0),P(1,.5)],[P(0,Math.sqrt(3)),P(-1,0),P(1,0)],
 [P(0,3),P(4,0),P(0,0)], // Reversed orientation of the first case.
 [P(-2,.1),P(0,0),P(1,0)], [P(0,1e-7),P(-1,0),P(1,0)],
 [P(1e-7,1e-7),P(0,0),P(1,0)], [P(0,1e-6),P(1,0),P(-1,0)],
 [P(.3,1e-9),P(0,0),P(1,0)], // Cancellation in signed barycentric excenters.
 [P(1e6,3e6),P(1e6,1e6),P(5e6,1e6)]
];
for(let i=0;i<2000;i++)cases.push(Array.from({length:3},()=>P(4*random()-2,4*random()-2)));
const close=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<=tol*Math.max(1e-12,Math.abs(a),Math.abs(b)),`${a} != ${b}`);
let measured=0,draws=0;
for(const vertices of cases){
 const g=M.triangle(vertices);if(g.degenerate)continue;Object.assign(g,C.compute(g,{},M));measured++;
 for(const key of ['a','b','c','s','x','y','z','ra','heronArea'])assert.ok(Number.isFinite(g[key])&&g[key]>0,key);
 for(const key of ['E','T','U','V','X','Y','Z'])assert.ok(Number.isFinite(g[key].x)&&Number.isFinite(g[key].y),key);
 close(g.heronArea,g.area,2e-8);close(g.r*g.s,g.area);
 close(g.x+g.y,g.a);close(g.y+g.z,g.b);close(g.x+g.z,g.c);
 close(g.ra/g.s,g.r/g.z);close(g.x/g.r,g.ra/g.y);
 for(const [foot,a,b] of [[g.X,g.B,g.C],[g.Y,g.C,g.A],[g.Z,g.A,g.B]]){
  close(M.dist(g.I,foot),g.r,5e-8);
  assert.ok(M.parameter(foot,a,b)>=-1e-9&&M.parameter(foot,a,b)<=1+1e-9);
 }
 for(const foot of [g.T,g.U,g.V])close(M.dist(g.E,foot),g.ra,5e-8);
 // For horizontal BC the tangential coordinate is exactly visible, even when
 // the exradius is huge; a radius-length-only check would miss this defect.
 if(g.B.y===g.C.y)close(g.E.x,g.T.x);
 assert.ok(M.parameter(g.T,g.B,g.C)>-1e-9&&M.parameter(g.T,g.B,g.C)<1+1e-9);
 assert.ok(M.parameter(g.U,g.A,g.C)>=1-1e-9);assert.ok(M.parameter(g.V,g.A,g.B)>=1-1e-9);
 // Angle correspondences are tested separately from side-ratio identities.
 if(!g.near){close(M.angle(g.Z,g.A,g.I),M.angle(g.V,g.A,g.E));close(M.angle(g.Z,g.B,g.I),M.angle(g.V,g.E,g.B));close(M.angle(g.Z,g.B,g.I)+M.angle(g.E,g.B,g.V),90);}
 const records=[];
 const finitePoint=q=>assert.ok(q&&Number.isFinite(q.x)&&Number.isFinite(q.y));
 const d={colors:{blue:'blue',teal:'teal',purple:'purple',gold:'gold',ink:'ink',muted:'muted'}};
 for(const name of ['segment','line','poly','circle','label','point','tick','right','angle'])d[name]=(...args)=>{
  if(name==='poly')args[0].forEach(finitePoint);
  else if(['segment','line','tick'].includes(name)){finitePoint(args[0]);finitePoint(args[1]);}
  else if(['right','angle'].includes(name)){args.slice(0,3).forEach(finitePoint);}
  else finitePoint(args[0]);
  if(name==='circle')assert.ok(Number.isFinite(args[1])&&args[1]>0);
  records.push([name,args]);
 };
 if(measured<=20){
  C.construction.draw(d,g,0,{},M);assert.equal(records.length,0,'level zero must be blank');
  assert.equal(C.construction.extent(g,{},0,M).length,3);
  for(let level=1;level<=C.construction.steps.length;level++){
   records.length=0;C.construction.draw(d,g,level,{},M);draws++;
   const constructionExtent=C.construction.extent(g,{},level,M);
   constructionExtent.forEach(finitePoint);
   assert.equal(constructionExtent.includes(g.E),level>=4,'future excenter in construction extent');
   if(level<4)assert.equal(constructionExtent.length,5,'only triangle and incircle bounds before the excircle');
   const serialized=JSON.stringify(records);
   assert.equal(serialized.includes('A-excircle'),level>=4);
   if(level<2)assert.ok(!serialized.includes('radius-IX'));
   if(level<5)assert.ok(!serialized.includes('radius-ET'));
  }
  for(let step=0;step<C.steps.length;step++){
   records.length=0;C.draw(d,g,step,{},M);draws++;
   const proofExtent=C.extent(g,{},step);proofExtent.forEach(finitePoint);
   assert.equal(proofExtent.includes(g.E),step>=6&&step<=15,'future excenter in proof extent');
   if(step===0||step===17)assert.equal(proofExtent.length,3,'side-only step has extra extent');
   assert.ok(records.length>0,'empty step '+step);
   const serialized=JSON.stringify(records);
   assert.equal(serialized.includes('A-excircle'),step>=6&&step<=15);
   if(step===11)assert.ok(serialized.includes('similar-triangle-AZI')&&serialized.includes('similar-triangle-AVE'));
   if(step>=12&&step<=14)assert.ok(serialized.includes('similar-triangle-ZBI')&&serialized.includes('similar-triangle-VEB'));
  }
 }
}
for(const vertices of [[P(0,0),P(0,0),P(1,1)],[P(0,0),P(1,0),P(2,0)]])assert.ok(M.triangle(vertices).degenerate,'engine must pause collapsed triangles');
assert.equal(C.steps.length,18);assert.equal(C.construction.steps.length,7);
console.log(`Heron: ${measured} nondegenerate triangles; ${draws} finite draw/extent stages; blank-first, reveal order, tangent lengths, two similarities, and formula passed.`);
