(() => {
'use strict';
const circleBounds=(o,r)=>[{x:o.x-r,y:o.y-r},{x:o.x+r,y:o.y+r}];
window.ProofEpisode={
 slug:'nine-point-circle-altitudes',title:'The nine-point circle · Part II',number:'09',
 subtitle:'The three altitude feet join the six midpoints.',
 observation:'The three altitude feet lie on the circle from Part I, together with the three side midpoints and the three midpoints of HA, HB, and HC; these nine named points need not be distinct.',
 prediction:'An altitude foot may lie outside the side of the triangle; can it still lie on the same circle?',
 after:'Try an isosceles or right triangle: which of the nine named points coincide?',
 prerequisites:[{label:'Nine-point circle · Part I',href:'../nine-point-circle/'},{label:'Thales’ theorem and converse',href:'../thales/'},{label:'The orthocenter H',href:'../orthocenter/'},{label:'C1 · Perpendiculars and altitude feet',href:'../basics/#c1'}],
 notes:[{title:'Names and the endpoint exception',body:'U is the midpoint of HA, D is the midpoint of BC, and A₁ is the foot of the altitude from A on the full line BC. The segment UD is a diameter of the circle, so U and D are distinct. If A₁ equals either endpoint, it already lies on the circle; the angle UA₁D is then undefined and we do not apply the converse of Thales.'},{title:'Right triangles are included',body:'If the right angle is at A, then H = A, U = A, and the altitude feet from B and C are also A. The corresponding side and H-to-vertex midpoints coincide in pairs. These repeated names denote points on the same positive-radius circle; no nondegenerate triangle is excluded.'},{title:'Why U lies on the altitude',body:'Both A and H lie on the altitude line from A, so their midpoint U lies on that line, even when A = H. The foot A₁ also lies on that line. If U differs from A₁, their line is therefore perpendicular to BC.'}],
 actions:[{label:'Make isosceles',run:v=>{v.splice(0,3,{x:0,y:-.7},{x:-.8,y:.5},{x:.8,y:.5});}},{label:'Right angle at A',run:v=>{v.splice(0,3,{x:-.7,y:-.45},{x:.7,y:-.45},{x:-.7,y:.55});}}],
 compute:(g,p,M)=>({U:g.half[0],D:g.mids[0],X:M.sub(M.mul(g.O,2),g.A),A1:g.feet[0],footCase:M.dist(g.feet[0],g.half[0])<=1e-10*g.scale?'U':M.dist(g.feet[0],g.mids[0])<=1e-10*g.scale?'D':null}),
 status:(g,p,active,s)=>g.footCase?'A₁ is indistinguishable from '+g.footCase+' at drawing precision; exact endpoints and distinct points are covered by separate proof cases.':'The altitude feet remain on the circle even when they lie on side extensions.',
 extent:(g,p,s)=>[...g.vertices,g.N,...g.mids,...g.half,...(s===1?[g.O,g.H,g.X]:[]),...(s===4?[g.H]:[]),...(s>=3||s===-1?g.feet:[]),...circleBounds(g.N,g.R/2),...(s===1?circleBounds(g.O,g.R):[])],
 draw:(d,g,s,p,M)=>{
  const c=d.colors,eps=1e-10*g.scale,extra=[[g.N,'N',c.blue]];
  const groups=entries=>{
   const merged=[];
   entries.forEach(([q,label,color])=>{const existing=merged.find(e=>M.dist(e.q,q)<=eps);if(existing)existing.labels.push(label);else merged.push({q,labels:[label],color});});
   merged.forEach(({q,labels,color})=>{const i=g.vertices.findIndex(v=>M.dist(v,q)<=eps);if(i>=0)labels.push(['A','B','C'][i]);d.point(q,labels.join(' ≈ '),color,{dx:q.x<g.N.x?-16:13,dy:q.y<g.N.y?-17:23});});
  };
  d.circle(g.N,g.R/2,c.blue,s===9?4:2.5,{'data-part':'nine-point-circle'});
  if(s===1){d.circle(g.O,g.R,c.muted,1.5,{opacity:.5,'data-part':'circumcircle'});d.segment(g.A,g.X,c.purple,3,{'data-part':'diameter-AX'});d.segment(g.H,g.A,c.muted,1.6);d.segment(g.H,g.X,c.muted,1.6);d.point(g.O,'O',c.muted,{dx:-15,dy:-15});extra.push([g.H,'H',c.gold],[g.X,'X',c.purple]);}
  if(s>=1&&s<=7)d.segment(g.U,g.D,c.gold,s===2?4:2.5,{'data-part':'diameter-UD'});
  if(s===2){d.tick(g.U,g.N,c.gold);d.tick(g.N,g.D,c.gold);}
  if(s>=3&&s<=7){
   d.line(g.B,g.C,c.muted,1.5,{'data-part':'line-BC'});d.line(g.A,g.A1,c.teal,s===4?3.2:2,{'data-part':'altitude-A'});
   if(s===3)d.right(g.A1,g.A,M.dist(g.A1,g.B)>M.dist(g.A1,g.C)?g.B:g.C,c.teal);
  }
  if(s===4)extra.push([g.H,'H',c.gold]);
  if(s===6&&!g.footCase){d.poly([g.U,g.A1,g.D],c.teal,.16,{'data-part':'right-triangle-UA1D'});d.right(g.A1,g.U,g.D,c.teal);}
  if(s===8||s===9||s===-1){g.vertices.forEach((q,i)=>{d.line(q,g.feet[i],[c.teal,c.purple,c.gold][i],1.4,{opacity:.55,'data-part':'altitude-'+i});});}
  if(s===0||s===-1||s>=8){groups([...extra,...g.half.map((q,i)=>[q,['U','V','W'][i],c.teal]),...g.mids.map((q,i)=>[q,['D','E','F'][i],c.gold]),...(s===-1||s>=8?g.feet.map((q,i)=>[q,['A₁','B₁','C₁'][i],c.purple]):[])]);}
  else{groups([...extra,[g.U,'U',c.teal],[g.D,'D',c.gold],...(s>=3?[[g.A1,'A₁',c.purple]]:[])]);}
 },
 steps:[
  {title:'Recall the six midpoints',text:'Part I placed the three side midpoints and the three midpoints of HA, HB, and HC on a circle with center N and radius R/2.',facts:['U = midpoint of HA','D = midpoint of BC'],key:'Teal: the H-to-vertex midpoints; gold: the side midpoints.'},
  {title:'Recall the antipodal pair',text:'For X antipodal to A on the circumcircle, the dilation with center H and factor 1/2 sends A to U and X to D.',facts:['A → U','X → D'],key:'Purple: the original diameter AX; gold: its image UD.'},
  {title:'A diameter of the smaller circle',text:'Since a dilation maps a diameter to a diameter, UD is a diameter of the circle centered at N.',facts:['U, N, D are collinear','NU = ND = R/2','U ≠ D'],key:'Gold: diameter UD and its two equal halves.'},
  {title:'Introduce the altitude foot',text:'Let A₁ be the foot of the altitude from A on the full line BC, which also contains D.',facts:['AA₁ ⟂ BC','A₁ and D lie on line BC'],key:'Teal: the altitude; gray: the whole line BC, including its extensions.'},
  {title:'Locate U on that altitude',text:'Because A and H lie on the altitude line, their midpoint U lies on it too, including when H = A.',facts:['A, U, H, A₁ lie on the altitude line','If U ≠ A₁, then UA₁ ⟂ BC'],key:'The same altitude line contains U, H, and its foot A₁.'},
  {title:'Handle coincident endpoints first',text:'If A₁ equals U or D, then A₁ already lies on the circle because it is an endpoint of its diameter.',facts:['If A₁ = U or A₁ = D, it is already on the circle','In that endpoint case, no angle at A₁ is needed'],key:'The endpoints are known circle points; ≈ labels indicate numerical proximity, not an exact hypothesis.'},
  {title:'Apply the converse of Thales',text:'If A₁ differs from both U and D, then UA₁ is perpendicular to A₁D, so the converse of Thales puts A₁ on the circle with diameter UD.',facts:['If A₁ ∉ {U,D}, then ∠UA₁D = 90°','The endpoint case was settled in the previous sentence'],key:'A genuine right triangle is highlighted only when its three vertices are distinct.'},
  {title:'The first altitude foot',text:'In either case, the altitude foot A₁ lies on the same circle with center N and radius R/2.',facts:['NA₁ = R/2'],key:'Purple: the first altitude foot on the blue circle.'},
  {title:'Repeat twice',text:'Repeating the argument at B and C puts their altitude feet B₁ and C₁ on this circle as well.',facts:['NB₁ = R/2','NC₁ = R/2'],key:'The three colored altitude lines meet the circle at their feet.'},
  {title:'The nine-point circle',text:'Thus one circle contains all nine named points: the three side midpoints, the three H-to-vertex midpoints, and the three altitude feet.',facts:['Center N is the midpoint of OH','Radius is R/2','The nine named points need not be distinct'],key:'Gold, teal, and purple mark the three families; ≈ groups names indistinguishable at drawing precision.'}
 ]
};
})();
