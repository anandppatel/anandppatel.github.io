/* Numerical constructions for the diagrams. The accompanying synthetic proofs
   establish the theorems; these computations only position the picture. */
(function(root){
'use strict';
const add=(a,b)=>({x:a.x+b.x,y:a.y+b.y}),sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y}),mul=(a,k)=>({x:a.x*k,y:a.y*k});
const dot=(a,b)=>a.x*b.x+a.y*b.y,cross=(a,b)=>a.x*b.y-a.y*b.x,norm=a=>Math.hypot(a.x,a.y),dist=(a,b)=>norm(sub(a,b));
const mid=(a,b)=>mul(add(a,b),.5),perp=a=>({x:-a.y,y:a.x}),unit=a=>mul(a,1/(norm(a)||1)),lerp=(a,b,t)=>add(a,mul(sub(b,a),t));
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const parameter=(p,a,b)=>dot(sub(p,a),sub(b,a))/(dot(sub(b,a),sub(b,a))||1);
const foot=(p,a,b)=>lerp(a,b,parameter(p,a,b));
function intersect(a,b,c,d){const u=sub(b,a),v=sub(d,c),den=cross(u,v);return Math.abs(den)<=1e-12*norm(u)*norm(v)?null:add(a,mul(u,cross(sub(c,a),v)/den));}
const area=(a,b,c)=>Math.abs(cross(sub(b,a),sub(c,a)))/2;
const fmt=(x,n=2)=>Number.isFinite(x)?String(Number(x.toFixed(n))):'—';
const angle=(a,b,c)=>Math.atan2(Math.abs(cross(sub(a,b),sub(c,b))),dot(sub(a,b),sub(c,b)))*180/Math.PI;
const onCircle=(p,o,r)=>add(o,mul(unit(sub(p,o)),r));
function triangle(vertices){
 const [A,B,C]=vertices, sides=[dist(B,C),dist(C,A),dist(A,B)],scale=Math.max(...sides),twice=cross(sub(B,A),sub(C,A)),abs=Math.abs(twice);
 const g={A,B,C,vertices,sides,scale,s:sides.reduce((sum,x)=>sum+x,0)/2,area:abs/2,degenerate:scale===0||abs<=1e-10*scale*scale,near:scale===0||abs<.008*scale*scale};
 if(g.degenerate)return {...g,O:null,H:null,G:null,I:null,N:null,K:null,Na:null,Ge:null,R:null,r:null,mids:[],feet:[],outer:[],half:[],tangentLengths:[],symmedianEnds:[],incTouches:[],excenters:[],exradii:[],exTouches:[]};
 const u=sub(B,A),v=sub(C,A),u2=dot(u,u),v2=dot(v,v);
 g.O=add(A,{x:(u2*v.y-v2*u.y)/(2*twice),y:(u.x*v2-v.x*u2)/(2*twice)});
 g.G=mul(add(add(A,B),C),1/3);
 g.H=sub(add(add(A,B),C),mul(g.O,2));
 const sum=sides.reduce((s,x)=>s+x,0);
 g.I=mul(add(add(mul(A,sides[0]),mul(B,sides[1])),mul(C,sides[2])),1/sum);
 g.R=dist(g.O,A);g.r=abs/sum;g.N=mid(g.O,g.H);
 g.mids=[mid(B,C),mid(C,A),mid(A,B)];
 g.feet=[foot(A,B,C),foot(B,C,A),foot(C,A,B)];
 g.outer=[sub(add(B,C),A),sub(add(C,A),B),sub(add(A,B),C)];
 g.half=vertices.map(p=>mid(g.H,p));
 // Compute s-a, s-b, s-c without subtracting nearly equal side lengths.
 // At A, s-a = (bc + (B-A)·(C-A))/(a+b+c); when the dot product
 // is negative, rationalize its numerator using (u×v)^2 = |u|²|v|²-(u·v)^2.
 const normalizedSides=sides.map(x=>x/scale),perimeter=normalizedSides.reduce((s,x)=>s+x,0);
 g.tangentLengths=vertices.map((v,i)=>{
  const u=mul(sub(vertices[(i+1)%3],v),1/scale),w=mul(sub(vertices[(i+2)%3],v),1/scale);
  const product=norm(u)*norm(w),scalar=dot(u,w),det=cross(u,w);
  return scale*(scalar<0?det*det/(product-scalar):product+scalar)/perimeter;
 });
 // A translated, normalized weighted average avoids large intermediate products.
 const barycentric=weights=>{
  const largest=Math.max(...weights),w=weights.map(x=>x/largest),sum=w.reduce((s,x)=>s+x,0);
  return add(A,mul(add(mul(sub(B,A),w[1]),mul(sub(C,A),w[2])),1/sum));
 };
 const [x,y,z]=g.tangentLengths,least=Math.min(x,y,z);
 g.K=barycentric(normalizedSides.map(a=>a*a));
 g.Na=barycentric(g.tangentLengths);
 g.Ge=barycentric(g.tangentLengths.map(t=>least/t));
 g.symmedianEnds=vertices.map((v,i)=>{
  const b=normalizedSides[(i+1)%3],c=normalizedSides[(i+2)%3];
  return lerp(vertices[(i+1)%3],vertices[(i+2)%3],c*c/(b*b+c*c));
 });
 g.incTouches=vertices.map((v,i)=>{
  const from=g.tangentLengths[(i+1)%3],to=g.tangentLengths[(i+2)%3];
  return lerp(vertices[(i+1)%3],vertices[(i+2)%3],from/(from+to));
 });
 g.exTouches=vertices.map((v,i)=>{
  const from=g.tangentLengths[(i+1)%3],to=g.tangentLengths[(i+2)%3];
  return lerp(vertices[(i+1)%3],vertices[(i+2)%3],to/(from+to));
 });
 g.exradii=g.tangentLengths.map(t=>g.area/t);
 // The opposite-side contact and outward normal also avoid cancellation in
 // the excenter's signed barycentric formula (-a:b:c).
 g.excenters=vertices.map((v,i)=>add(g.exTouches[i],mul(unit(perp(sub(vertices[(i+2)%3],vertices[(i+1)%3]))),-Math.sign(twice)*g.exradii[i])));
 return g;
}
const M={add,sub,mul,mid,dist,dot,cross,norm,perp,unit,lerp,foot,parameter,intersect,area,clamp,fmt,angle,onCircle,triangle};
if(typeof module!=='undefined'&&module.exports)module.exports=M;root.EpisodeMath=M;
})(typeof window==='undefined'?globalThis:window);
