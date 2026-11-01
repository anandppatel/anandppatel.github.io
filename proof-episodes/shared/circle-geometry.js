/* Numerical positions for circle diagrams, not substitutes for their proofs. */
(function(root){
'use strict';
const TAU=2*Math.PI;
const positive=a=>((a%TAU)+TAU)%TAU;
const direction=(g,M)=>Math.sign(M.cross(M.sub(g.B,g.A),M.sub(g.C,g.A)))||1;
const polar=(o,r,a)=>({x:o.x+r*Math.cos(a),y:o.y+r*Math.sin(a)});
const angle=(q,o)=>Math.atan2(q.y-o.y,q.x-o.x);
function cyclic(g,t,M){
 const sign=direction(g,M),start=angle(g.C,g.O);
 const sweep=sign*positive(sign*(angle(g.A,g.O)-start));
 return {D:polar(g.O,g.R,start+sweep*M.clamp(t,.03,.97)),start,sweep};
}
function fraction(g,q,M){
 const c=cyclic(g,.5,M),sign=Math.sign(c.sweep);
 const progress=positive(sign*(angle(q,g.O)-c.start));
 // Outside the permitted arc choose its nearer endpoint, rather than wrapping
 // through the other three vertices of the quadrilateral.
 if(progress>Math.abs(c.sweep))return M.dist(q,g.C)<M.dist(q,g.A)?.03:.97;
 return M.clamp(progress/Math.abs(c.sweep),.03,.97);
}
const bounds=(o,r)=>[{x:o.x-r,y:o.y-r},{x:o.x+r,y:o.y+r}];
const api={TAU,positive,polar,angle,direction,cyclic,fraction,bounds};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.CircleGeometry=api;
})(typeof window==='undefined'?globalThis:window);
