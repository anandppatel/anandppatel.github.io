/* Euclidean constructions, kept separate from drawing coordinates and proof state. */
(function (root) {
  'use strict';
  const midpoint = (p, q) => ({x:(p.x+q.x)/2, y:(p.y+q.y)/2});
  const distance = (p, q) => Math.hypot(p.x-q.x, p.y-q.y);
  function construct(vertices) {
    const [a,b,c] = vertices;
    const u = {x:b.x-a.x, y:b.y-a.y}, v = {x:c.x-a.x, y:c.y-a.y};
    const cross = u.x*v.y-u.y*v.x;
    const scale = Math.max(distance(a,b),distance(a,c),distance(b,c),1);
    const midpoints = [midpoint(b,c),midpoint(c,a),midpoint(a,b)]; // D, E, F
    const degenerate = Math.abs(cross) <= 1e-10*scale*scale;
    const result = {vertices, midpoints, cross, scale, degenerate, near:Math.abs(cross)<.008*scale*scale};
    if (degenerate) return {...result, center:null, radius:null};
    // Solve 2(O-A)·(B-A)=|B-A|² and 2(O-A)·(C-A)=|C-A|².
    // Translating by A avoids subtracting large absolute coordinate squares.
    const u2 = u.x*u.x+u.y*u.y, v2 = v.x*v.x+v.y*v.y;
    const center = {x:a.x+(u2*v.y-v2*u.y)/(2*cross), y:a.y+(u.x*v2-v.x*u2)/(2*cross)};
    return {...result, center, radius:distance(center,a)};
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
  root.CircumcenterGeometry={construct,clipLine,distance,midpoint};
  if (typeof module!=='undefined') module.exports=root.CircumcenterGeometry;
})(typeof window!=='undefined'?window:globalThis);
