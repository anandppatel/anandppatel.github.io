/* Euclidean constructions, independent of the diagram and the guided proof. */
(function (root) {
  'use strict';
  const midpoint = (p, q) => ({x:(p.x+q.x)/2, y:(p.y+q.y)/2});
  const distance = (p, q) => Math.hypot(p.x-q.x, p.y-q.y);
  function foot(p, q, r) {
    const side = {x:r.x-q.x, y:r.y-q.y};
    const t = ((p.x-q.x)*side.x+(p.y-q.y)*side.y)/(side.x*side.x+side.y*side.y);
    return {x:q.x+t*side.x, y:q.y+t*side.y};
  }
  function construct(vertices) {
    const [a,b,c] = vertices;
    const u = {x:b.x-a.x, y:b.y-a.y}, v = {x:c.x-a.x, y:c.y-a.y};
    const cross = u.x*v.y-u.y*v.x;
    const scale = Math.max(distance(a,b),distance(a,c),distance(b,c),1);
    // P, Q, R form the auxiliary triangle: A, B, C are the midpoints of QR, RP, PQ.
    const outer = [
      {x:b.x+c.x-a.x, y:b.y+c.y-a.y},
      {x:c.x+a.x-b.x, y:c.y+a.y-b.y},
      {x:a.x+b.x-c.x, y:a.y+b.y-c.y}
    ];
    const degenerate = Math.abs(cross) <= 1e-10*scale*scale;
    const result = {vertices, outer, cross, scale, degenerate, near:Math.abs(cross)<.008*scale*scale};
    // Empty feet avoids inventing projections onto zero-length sides; no unique H is drawn.
    if (degenerate) return {...result, feet:[], center:null};
    const feet = [foot(a,b,c),foot(b,c,a),foot(c,a,b)];
    // Solve the first two altitude equations directly, without using the circumcenter theorem.
    // With h = H-A, the equations are h·(v-u)=0 and (h-u)·v=0.
    // Their determinant is -cross; translating to A avoids absolute coordinate squares.
    const uv = u.x*v.x+u.y*v.y;
    const center = {x:a.x+uv*(v.y-u.y)/cross, y:a.y+uv*(u.x-v.x)/cross};
    return {...result, feet, center};
  }
  // Clip an infinite line to a rectangular viewport without arbitrary long endpoints.
  function clipLine(p, d, width, height) {
    let lo=-Infinity, hi=Infinity;
    for (const [value, delta, max] of [[p.x,d.x,width],[p.y,d.y,height]]) {
      if (Math.abs(delta)<1e-14) { if (value<0 || value>max) return null; }
      else { const t1=-value/delta,t2=(max-value)/delta;lo=Math.max(lo,Math.min(t1,t2));hi=Math.min(hi,Math.max(t1,t2)); }
    }
    if (lo>hi || !Number.isFinite(lo+hi)) return null;
    return [{x:p.x+lo*d.x,y:p.y+lo*d.y},{x:p.x+hi*d.x,y:p.y+hi*d.y}];
  }
  root.OrthocenterGeometry={construct,clipLine,distance,midpoint};
  if (typeof module!=='undefined') module.exports=root.OrthocenterGeometry;
})(typeof window!=='undefined'?window:globalThis);
