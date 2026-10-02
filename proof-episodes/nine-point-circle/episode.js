(() => {
'use strict';
const circleBounds=(o,r)=>[{x:o.x-r,y:o.y-r},{x:o.x+r,y:o.y+r}];
window.ProofEpisode={
 slug:'nine-point-circle',title:'The nine-point circle · Part I',number:'08',
 subtitle:'One dilation puts six familiar midpoints on a circle.',
 observation:'Let N be the midpoint of OH and R the circumradius; the circle with center N and radius R/2 contains the three side midpoints and the three midpoints of HA, HB, and HC.',
 prediction:'The midpoints of HA, HB, and HC lie on a circle; will the three side midpoints join them?',
 after:'Where are the altitude feet relative to this circle? Part II will account for the remaining three points.',
 prerequisites:[{label:'The circumcenter O',href:'../circumcenter/'},{label:'The orthocenter H',href:'../orthocenter/'},{label:'C2 · Rigid motions and half-turns',href:'../basics/#c2'},{label:'C3 · Dilations',href:'../basics/#c3'},{label:'Thales’ theorem',href:'../thales/'}],
 notes:[{title:'Why the parallelogram has a common diagonal midpoint',body:'Let D be the midpoint of BC in a genuine parallelogram BHCX. The half-turn about D swaps B and C; because opposite sides are parallel, it sends line BH to CX and line CH to BX. Their intersection H therefore goes to X, proving that D is the midpoint of HX.'},{title:'Names in this episode',body:'D, E, and F are the midpoints of BC, CA, and AB; U, V, and W are the midpoints of HA, HB, and HC. N is the midpoint of OH. X is the point of the circumcircle opposite A across its center O.'},{title:'A collapsed parallelogram causes no gap',body:'If the right angle is at B, then H = B and X = C, so the midpoint of HX is the midpoint D of BC directly. If the right angle is at C, then H = C and X = B. In all other cases BHCX is a genuine parallelogram, including a right triangle whose right angle is at A.'},{title:'The circle is unique',body:'The dilation of factor 1/2 sends the noncollinear triangle ABC to the noncollinear triangle UVW, so its three image points determine a unique circumcircle. Its radius R/2 is positive. Some of the other named points may coincide with U, V, or W.'}],
 actions:[{label:'Right angle at B',run:v=>{v.splice(0,3,{x:-.75,y:-.5},{x:-.75,y:.5},{x:.75,y:.5});}}],
 compute:(g,p,M)=>({D:g.mids[0],E:g.mids[1],F:g.mids[2],U:g.half[0],V:g.half[1],W:g.half[2],X:M.sub(M.mul(g.O,2),g.A),endpointCase:M.dist(g.H,g.B)<=1e-10*g.scale?'B':M.dist(g.H,g.C)<=1e-10*g.scale?'C':null}),
 status:(g,p,active,s)=>g.endpointCase?'H is indistinguishable from '+g.endpointCase+' at drawing precision; exact endpoint cases use the direct midpoint argument, and distinct points use the parallelogram argument.':'The circle centered at N has half the circumradius.',
 extent:(g,p,s)=>[...g.vertices,g.N,...g.half,...g.mids,...(s===-1||s<=4||s===7?[g.O]:[]),...(s===-1||s<=2||s>=5&&s<=7?[g.H]:[]),...(s>=3&&s<=7?[g.X]:[]),...(s===-1||s<=4||s===7||s>=8?circleBounds(g.O,g.R):[]),...(s===-1||s>=2?circleBounds(g.N,g.R/2):[])],
 draw:(d,g,s,p,M)=>{
  const c=d.colors,eps=1e-10*g.scale;
  const marks=[];const point=(q,label,color,opts={})=>marks.push({q,label,color,opts});
  const right=(f,a,b,color)=>{if(M.dist(f,a)>eps&&M.dist(f,b)>eps)d.right(f,a,b,color);};
  const showCircle=s===-1||s<=4||s===7||s>=8;
  if(showCircle)d.circle(g.O,g.R,c.muted,1.5,{opacity:.5,'data-part':'circumcircle'});
  if(s===-1||s>=2)d.circle(g.N,g.R/2,c.blue,s===9?4:2.4,{'data-part':'nine-point-circle'});
  if(s===0){d.segment(g.O,g.H,c.gold,3,{'data-part':'OH'});d.tick(g.O,g.N,c.gold);d.tick(g.N,g.H,c.gold);}
  if(s===1||s===2){g.vertices.forEach((q,i)=>{d.segment(g.H,q,c.muted,1.8);d.segment(g.H,g.half[i],[c.blue,c.teal,c.purple][i],3,{'data-part':'half-segment-'+i});d.tick(g.H,g.half[i],c.gold,i+1);d.tick(g.half[i],q,c.gold,i+1);});}
  if(s===2){d.segment(g.O,g.A,c.muted,2,{'data-part':'original-radius'});d.segment(g.N,g.U,c.blue,3,{'data-part':'half-radius'});}
  if(s>=3&&s<=7){d.segment(g.A,g.X,c.purple,2.3,{'data-part':'diameter-AX'});point(g.X,'X',c.purple,{dx:16,dy:24});}
  if(s===4){d.poly([g.A,g.B,g.X],c.teal,.1,{'data-part':'right-triangle-ABX'});d.poly([g.A,g.C,g.X],c.purple,.1,{'data-part':'right-triangle-ACX'});right(g.B,g.A,g.X,c.teal);right(g.C,g.A,g.X,c.purple);}
  if(s===5){
   if(!g.endpointCase)d.poly([g.B,g.H,g.C,g.X],c.teal,.17,{'data-part':'parallelogram-BHCX'});
   d.segment(g.B,g.H,c.teal,3,{'data-part':'BH'});d.segment(g.C,g.X,c.teal,3,{'data-part':'CX'});d.segment(g.H,g.C,c.purple,3,{'data-part':'HC'});d.segment(g.X,g.B,c.purple,3,{'data-part':'XB'});
  }
  if(s===6||s===7){d.segment(g.B,g.C,c.teal,3,{'data-part':'BC'});d.segment(g.H,g.X,c.gold,3,{'data-part':'HX'});d.tick(g.B,g.D,c.teal,2);d.tick(g.D,g.C,c.teal,2);d.tick(g.H,g.D,c.gold);d.tick(g.D,g.X,c.gold);point(g.D,'D',c.gold,{dx:14,dy:24});}
  if(s===-1||s===1||s>=2)g.half.forEach((q,i)=>point(q,['U','V','W'][i],c.teal,{dx:i===0?-20:12,dy:i===0?-15:22}));
  if(s===-1||s>=8)g.mids.forEach((q,i)=>point(q,['D','E','F'][i],c.gold,{dx:12,dy:-15}));
  if(s===-1||s===0||s===1||s===5||s===6||s===7)point(g.H,'H',c.gold,{dx:17,dy:29});
  if(s===-1||s===0||s===2||s===3||s===4)point(g.O,'O',c.muted,{dx:-18,dy:-15});
  point(g.N,'N',c.blue,{dx:13,dy:22});
  const groups=[];marks.forEach(item=>{const found=groups.find(other=>M.dist(other.q,item.q)<=eps);if(found)found.label+=' ≈ '+item.label;else groups.push({...item});});groups.forEach(item=>{const i=g.vertices.findIndex(v=>M.dist(v,item.q)<=eps);d.point(item.q,item.label+(i<0?'':' ≈ '+['A','B','C'][i]),item.color,item.opts);});
 },
 steps:[
  {title:'The circle’s proposed center',text:'Let N be the midpoint of the segment joining the circumcenter O and the orthocenter H.',facts:['ON = NH'],key:'Gold: OH and its two equal halves; blue: N.'},
  {title:'Halve distances from H',text:'The dilation with center H and factor 1/2 sends A, B, and C to the midpoints U, V, and W of HA, HB, and HC.',facts:['A → U','B → V','C → W'],key:'Each colored segment is half the segment from H to a vertex.'},
  {title:'The first three circle points',text:'This dilation sends the circumcircle to a circle through U, V, and W, with center N and radius R/2.',facts:['O → N','Radius R → R/2'],key:'The smaller blue circle is the image of the circumcircle.'},
  {title:'Use an antipodal point',text:'Let X be the antipode of A on the circumcircle, so AX is a diameter.',facts:['A, O, X are collinear','OA = OX'],key:'Purple: diameter AX and the point X opposite A.'},
  {title:'Right angles or an endpoint case',text:'If X differs from B and C, Thales’ theorem gives BX ⟂ AB and CX ⟂ AC; if X equals either point, the right angle of ABC is at the other.',facts:['X ∉ {B,C}: BX ⟂ AB and CX ⟂ AC','X = C: H = B; X = B: H = C'],key:'Right-angle marks show genuine diameter angles; ≈ groups points that are indistinguishable at drawing precision.'},
  {title:'A parallelogram',text:'If X differs from B and C, the altitude relations BH ⟂ AC and CH ⟂ AB give BH ∥ CX and HC ∥ BX, making BHCX a parallelogram.',facts:['For X ∉ {B,C}: BH ∥ CX and HC ∥ BX','For X ∈ {B,C}: H and X are B and C in some order'],key:'Teal and purple pair opposite sides; a quadrilateral too thin to distinguish is not shaded.'},
  {title:'Its common diagonal midpoint',text:'The parallelogram’s diagonals BC and HX share midpoint D; in the endpoint cases, H and X are B and C in some order, giving the same midpoint directly.',facts:['BD = DC','In either case, HD = DX'],key:'The common-midpoint conclusion holds both for a genuine parallelogram and for the exact endpoint cases.'},
  {title:'The image of X',text:'The same dilation sends X to D, so D lies on the circle centered at N with radius R/2.',facts:['X → D','ND = R/2'],key:'Gold: HX and its midpoint D on the blue image circle.'},
  {title:'Repeat at the other vertices',text:'Repeating the argument with B and C in place of A puts the side midpoints E and F on this same circle.',facts:['D = midpoint of BC','E = midpoint of CA','F = midpoint of AB'],key:'Gold: all three side midpoints; teal: the three midpoints already on the circle.'},
  {title:'Six of the nine points',text:'The three side midpoints and the three midpoints of HA, HB, and HC therefore lie on one circle with center N and radius R/2.',facts:['D, E, F, U, V, W lie on the circle','Some named points can coincide'],key:'The stronger blue outline gathers the two colored sets of midpoints on one circle.'}
 ]
};
})();
