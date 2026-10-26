'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.resolve(__dirname,'../../proof-episodes/shared'),M=require(path.join(base,'geometry.js')),F=require(path.join(base,'physical-models.js'));
new vm.Script(fs.readFileSync(path.join(base,'physical-demos.js'),'utf8'));
const close=(a,b,scale=1)=>assert(Math.abs(a-b)<2e-8*Math.max(scale,Math.abs(a),Math.abs(b)),`${a} differs from ${b}`);
const same=(a,b,scale=1)=>{close(a.x,b.x,scale);close(a.y,b.y,scale);};
const samples=['acute','right','obtuse','equilateral'].map(name=>F.copyPreset(name));
let seed=813553;const random=()=>((seed=(1664525*seed+1013904223)>>>0)/2**32);
for(let i=0;i<200;i++)samples.push(Array.from({length:3},()=>({x:4*random()-2,y:4*random()-2})));
let count=0;
for(const vertices of samples)for(const v of [vertices,[vertices[0],vertices[2],vertices[1]]]){
 const g=M.triangle(v);if(g.degenerate||g.area<1e-5*g.scale*g.scale)continue;count++;
 const displacement={x:.071*g.scale,y:-.043*g.scale};
 const spring=F.vertexSprings(g,g.G);same(spring.force,{x:0,y:0},g.scale);
 close(F.vertexSprings(g,M.add(g.G,displacement)).energy-spring.energy,1.5*M.dot(displacement,displacement),g.scale**2);
 for(const contact of [false,true]){
  const target=contact?g.Ge:g.K,data=F.sideSprings(g,target,contact);
  assert(data,'nondegenerate contact triangle');same(data.force,{x:0,y:0},g.scale);
  same(data.rails.K,target,g.scale);
  const moved=F.sideSprings(g,M.add(target,displacement),contact);
  assert(moved.energy>data.energy,'target is the strict spring-energy minimum');
  const increase=data.rails.vertices.reduce((total,p,i)=>{
   const normal=M.unit(M.perp(M.sub(data.rails.vertices[(i+2)%3],data.rails.vertices[(i+1)%3])));
   return total+M.dot(displacement,normal)**2/2;
  },0);
  close(moved.energy-data.energy,increase,g.scale**2);
  data.feet.forEach((p,i)=>close(M.dot(M.sub(target,p),M.sub(data.rails.vertices[(i+2)%3],data.rails.vertices[(i+1)%3])),0,g.scale**2));
 }
 const wave=F.arrivals(g,g.O,1);wave.distances.forEach(d=>close(d,g.R,g.scale));close(wave.spread,0,g.scale);
 assert(wave.arrived.every(Boolean),'all equal-radius arrivals are recognized at time R/v despite floating roundoff');
 assert(F.arrivals(g,g.O,1-1e-8).arrived.every(x=>!x),'arrival tolerance does not mark genuinely earlier waves as arrived');
 assert(F.arrivals(g,g.O,1+1e-8).arrived.every(Boolean));
 for(const t of [0,.23,.7,1]){
  const front=F.inwardFront(g,t);close(M.area(...front.vertices),(1-t)**2*g.area,g.scale**2);
  for(let i=0;i<3;i++){
   const p=M.mid(front.vertices[(i+1)%3],front.vertices[(i+2)%3]),a=v[(i+1)%3],b=v[(i+2)%3];
   close(M.dist(p,M.foot(p,a,b)),t*g.r,g.scale);
  }
  if(t===1)front.vertices.forEach(p=>same(p,g.I,g.scale));
 }
 for(let start=0;start<3;start++){
  const end=F.walkers(g,start,1);same(end.first.point,end.second.point,g.scale);same(end.meeting,end.first.point,g.scale);
  for(const route of [end.first.route,end.second.route])close(route.slice(1).reduce((s,p,i)=>s+M.dist(p,route[i]),0),g.s,g.scale);
  close(M.cross(M.sub(end.meeting,v[start]),M.sub(g.Na,v[start])),0,g.scale**2);
  for(const t of [0,.21,.74]){const w=F.walkers(g,start,t);for(const route of [w.first.route,w.second.route])close(route.slice(1).reduce((s,p,i)=>s+M.dist(p,route[i]),0),t*g.s,g.scale);}
 }
 const target=F.pulleyTarget(g),pulley=F.pulley(g,target.point);
 if(target.kind==='acute'){same(pulley.force,{x:0,y:0},g.scale);close(pulley.energy,4*g.area,g.scale**2);}
 else{
  same(target.point,v[target.index],g.scale);
  const other=pulley.forces.reduce(M.add,{x:0,y:0});assert(M.norm(other)<=g.sides[target.index]+1e-8*g.scale,'vertex tension can balance the other two');
 }
 for(let i=0;i<8;i++){
  const p=M.add(target.point,{x:(random()-.5)*g.scale,y:(random()-.5)*g.scale});
  assert(F.pulley(g,p).energy>=pulley.energy-1e-8*g.scale**2,'pulley minimizer has smallest weighted length');
 }
 const masses=F.fourMasses(g,g.N);same(masses.center,g.N,g.scale);close(masses.distance,0,g.scale);
 const torque=masses.masses.map(p=>M.sub(p,g.N)).reduce(M.add,{x:0,y:0});same(torque,{x:0,y:0},g.scale);
 for(const lambda of [0,.35,1,1.7,2]){
  const r=F.rotating(g,lambda);same(r.force,{x:0,y:0},g.scale);assert(r.stiffness>0);
  if(Number.isInteger(lambda))same(r.point,[g.G,g.N,g.H][lambda],g.scale);
  const energy=p=>F.vertexSprings(g,p).energy-lambda*M.dist(p,g.O)**2/2;
  close(energy(M.add(r.point,displacement))-energy(r.point),.5*(3-lambda)*M.dot(displacement,displacement),g.scale**2);
 }
}
const flat=M.triangle(F.copyPreset('flat')),p={x:0,y:0};assert(flat.degenerate);
for(const output of [F.vertexSprings(flat,p),F.sideSprings(flat,p),F.sideSprings(flat,p,true),F.pulleyTarget(flat),F.pulley(flat,p),F.arrivals(flat,p,1),F.inwardFront(flat,.5),F.perimeterWalk(flat,0,1,1),F.walkers(flat,0,.5),F.fourMasses(flat,p),F.rotating(flat,1)])assert.equal(output,null);
for(const name of ['acute','right','obtuse','equilateral']){
 const g=M.triangle(F.copyPreset(name));assert(!g.degenerate);
 assert.equal(F.pulleyTarget(g).kind,name==='equilateral'?'acute':name);
}
for(const offset of [1e8,-1e10]){
 const g=M.triangle(F.copyPreset('acute').map(p=>({x:p.x+offset,y:p.y-offset})));
 assert(F.arrivals(g,g.O,1).arrived.every(Boolean),'equal-arrival boundary survives a large coordinate translation');
 const wave=F.arrivals(g,g.O,1),earlier=1-100*wave.arrivalTolerance/g.R;
 assert(F.arrivals(g,g.O,earlier).arrived.every(x=>!x),'translated arrival tolerance stays local to rounding precision');
}
{
 const g=M.triangle(F.copyPreset('right')),p={x:1e-14,y:2e-14},near=F.pulley(g,p);
 assert.equal(near.atVertex,-1,'a nearby point must not be asserted to coincide with a vertex');
 assert(near.force&&Number.isFinite(near.force.x)&&Number.isFinite(near.force.y));
 assert.equal(F.pulley(g,g.A).atVertex,0,'exact vertex retains singular handling');
}
console.log(`Physical interpretations: ${count} oriented triangles pass spring force/energy, contact-triangle Gergonne, equal-time arrival, inward-front homothety, perimeter-halving, pulley-boundary, four-mass balance, and rotating-equilibrium checks; degeneracy pauses every model.`);
