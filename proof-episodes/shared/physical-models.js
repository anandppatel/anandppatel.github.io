/* Exact model definitions; numerical values position the interactive picture.
   No time integration, friction model, or empirical simulation is asserted. */
(function(root){
'use strict';
const M=typeof module!=='undefined'&&module.exports?require('./geometry.js'):root.EpisodeMath;
const {add,sub,mul,dot,norm,dist,unit,foot,lerp,triangle}=M;
const zero=()=>({x:0,y:0});
const sum=values=>values.reduce((a,b)=>add(a,b),zero());
const presets={
 acute:[{x:.3,y:2.3},{x:-2,y:0},{x:2,y:0}],
 right:[{x:0,y:0},{x:3,y:0},{x:0,y:2}],
 obtuse:[{x:.7,y:1.3},{x:-2,y:0},{x:2,y:0}],
 equilateral:[{x:0,y:Math.sqrt(3)},{x:-1,y:0},{x:1,y:0}],
 flat:[{x:0,y:0},{x:-2,y:0},{x:2,y:0}]
};
function copyPreset(name){return (presets[name]||presets.acute).map(p=>({...p}));}
function vertexSprings(g,p){
 if(g.degenerate)return null;
 const forces=g.vertices.map(v=>sub(v,p));
 return {forces,force:sum(forces),energy:g.vertices.reduce((s,v)=>s+dist(p,v)**2/2,0),target:g.G};
}
function sideSprings(g,p,contact=false){
 if(g.degenerate)return null;
 const rails=contact?triangle(g.incTouches):g;
 if(rails.degenerate)return null;
 const feet=rails.vertices.map((v,i)=>foot(p,rails.vertices[(i+1)%3],rails.vertices[(i+2)%3]));
 const forces=feet.map(q=>sub(q,p));
 return {rails,feet,forces,force:sum(forces),energy:forces.reduce((s,f)=>s+dot(f,f)/2,0),target:contact?g.Ge:g.K};
}
function pulleyTarget(g){
 if(g.degenerate)return null;
 const angles=g.vertices.map((v,i)=>dot(sub(g.vertices[(i+1)%3],v),sub(g.vertices[(i+2)%3],v)));
 const index=angles.findIndex(x=>x<=0);
 return index<0?{point:g.H,kind:'acute',index:null}:{point:g.vertices[index],kind:angles[index]===0?'right':'obtuse',index};
}
function pulley(g,p){
 if(g.degenerate)return null;
 const lengths=g.vertices.map(v=>dist(p,v));
 // A nearby knot still has a defined string direction. Only an actual
 // coincident numerical position receives the singular vertex treatment.
 const atVertex=lengths.findIndex(d=>d===0);
 const forces=g.vertices.map((v,i)=>lengths[i]>0?mul({x:(v.x-p.x)/lengths[i],y:(v.y-p.y)/lengths[i]},g.sides[i]):zero());
 return {lengths,forces,force:atVertex<0?sum(forces):null,atVertex,
  energy:lengths.reduce((s,d,i)=>s+d*g.sides[i],0),target:pulleyTarget(g)};
}
function arrivals(g,p,timeOverR){
 if(g.degenerate)return null;
 const distances=g.vertices.map(v=>dist(p,v)),time=timeOverR*g.R;
 // Separately computed radii can differ by a few floating-point ulps at O.
 // Include coordinate magnitude because large translations also incur ulps
 // when the translated circumcenter is added back to the original position.
 const magnitude=Math.max(g.scale,g.R,Math.abs(time),...distances,Math.abs(p.x),Math.abs(p.y),...g.vertices.flatMap(v=>[Math.abs(v.x),Math.abs(v.y)]));
 const arrivalTolerance=32*Number.EPSILON*magnitude;
 return {distances,time,radius:time,arrivalTolerance,spread:Math.max(...distances)-Math.min(...distances),arrived:distances.map(d=>time+arrivalTolerance>=d),target:g.O};
}
function inwardFront(g,fraction){
 if(g.degenerate)return null;
 const t=M.clamp(fraction,0,1);
 return {vertices:g.vertices.map(p=>lerp(p,g.I,t)),distance:t*g.r,area:(1-t)**2*g.area,target:g.I};
}
function perimeterWalk(g,start,direction,distance){
 if(g.degenerate)return null;
 const perimeter=2*g.s;
 let remain=((distance%perimeter)+perimeter)%perimeter;
 const route=[g.vertices[start]];
 let index=start;
 for(let step=0;step<3;step++){
  const next=(index+direction+3)%3,a=g.vertices[index],b=g.vertices[next],length=dist(a,b);
  if(remain<=length){const point=lerp(a,b,remain/length);route.push(point);return {point,route};}
  route.push(b);remain-=length;index=next;
 }
 return {point:g.vertices[start],route};
}
function walkers(g,start,fraction){
 if(g.degenerate)return null;
 const distance=M.clamp(fraction,0,1)*g.s;
 return {first:perimeterWalk(g,start,1,distance),second:perimeterWalk(g,start,-1,distance),distance,
  meeting:g.exTouches[start],target:g.Na};
}
function fourMasses(g,p){
 if(g.degenerate)return null;
 const masses=[...g.vertices,g.H],center=mul(sum(masses),.25);
 return {masses,center,offset:sub(center,p),distance:dist(center,p),target:g.N};
}
function rotating(g,lambda){
 if(g.degenerate||!Number.isFinite(lambda)||lambda>=3)return null;
 const point=add(g.O,mul(sub(g.H,g.O),1/(3-lambda)));
 const springs=vertexSprings(g,point),centrifugal=mul(sub(point,g.O),lambda);
 return {point,lambda,springForces:springs.forces,centrifugal,force:add(springs.force,centrifugal),stiffness:3-lambda};
}
const api={copyPreset,vertexSprings,sideSprings,pulleyTarget,pulley,arrivals,inwardFront,perimeterWalk,walkers,fourMasses,rotating};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.PhysicalModels=api;
})(typeof window==='undefined'?globalThis:window);
