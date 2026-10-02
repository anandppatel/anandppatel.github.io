(() => {
'use strict';
const circleBounds=(o,r)=>[{x:o.x-r,y:o.y-r},{x:o.x+r,y:o.y+r}];
window.ProofEpisode={
 slug:'euler-line',title:'The Euler line',number:'05',
 subtitle:'The centroid, circumcenter, and orthocenter share a line.',
 observation:'In every non-equilateral triangle, O, G, and H lie on one line, with G between O and H and GH = 2GO; in an equilateral triangle all three points coincide.',
 prediction:'As you move the triangle, where does G sit between O and H?',
 after:'What happens to the three centers as the triangle approaches an equilateral triangle?',
 prerequisites:[{label:'The centroid and its 2 : 1 ratio',href:'../centroid/'},{label:'The circumcenter',href:'../circumcenter/'},{label:'The auxiliary triangle in the orthocenter proof',href:'../orthocenter/'},{label:'C2 · Rigid motions',href:'../basics/#c2'},{label:'C3 · Dilations',href:'../basics/#c3'},{label:'T1 · Congruence',href:'../basics/#t1'}],
 notes:[{title:'Why the diagonals bisect one another',body:'In parallelogram ABPC, a half-turn about the midpoint D of BC swaps B and C. Because opposite sides are parallel, it sends line BA to CP and line CA to BP, so their intersection A goes to P. Thus D is also the midpoint of AP.'},{title:'The transformation',body:'A half-turn about G followed by a dilation of factor 2 about G sends a point X to the opposite ray from G, twice as far from G. The half-turn preserves distances; the dilation doubles them, so circles map to circles and their centers map to their centers.'},{title:'Why the coincidence case is exactly equilateral',body:'If O = G, the line from each vertex through the opposite midpoint is both a median and a perpendicular bisector. The perpendicular-bisector fact then gives AB = AC, BA = BC, and CA = CB. Conversely, the medians of an equilateral triangle are perpendicular bisectors by congruence, and are also altitude lines; their common point is O = G = H.'}],
 actions:[{label:'Make equilateral',run:(v)=>{v.splice(0,3,{x:0,y:-.72},{x:-Math.sqrt(3)*.36,y:.36},{x:Math.sqrt(3)*.36,y:.36});}}],
 compute:(g,p,M)=>({turn:g.vertices.map(x=>M.sub(M.mul(g.G,2),x)),mappedO:M.sub(M.mul(g.G,3),M.mul(g.O,2)),coincident:M.dist(g.O,g.G)<=1e-10*g.scale}),
 status:(g,p,active,s)=>g.coincident?'O, G, and H are indistinguishable at drawing precision; this does not establish exact equality.':'G lies between O and H, with GH twice GO.',
 extent:(g,p,s)=>[...g.vertices,g.G,...(s===-1||s===0||s>=6?[g.O]:[]),...(s===-1||s>=6?[g.H]:[]),...(s>=1&&s<=7?g.outer:[]),...(s===4?g.turn:[]),...(s===-1||s===0||s===6||s===7?circleBounds(g.O,g.R):[]),...(s===6||s===7?circleBounds(g.mappedO,2*g.R):[])],
 draw:(d,g,s,p,M)=>{
  const c=d.colors,[A,B,C]=g.vertices,[P,Q,R]=g.outer,D=g.mids[0],aux=s>=1&&s<=7;
  const marks=[];const mark=(point,label,color,opts={})=>marks.push({point,label,color,opts});
  if(s===-1||s===0||s===6||s===7)d.circle(g.O,g.R,c.blue,1.7,{opacity:.5,'data-part':'original-circumcircle'});
  if(aux){d.poly(g.outer,c.muted,.035,{'data-part':'auxiliary-triangle'});g.outer.forEach((q,i)=>mark(q,['P','Q','R'][i],c.muted,{dx:12,dy:-12}));}
  if(s===1){g.outer.forEach((q,i)=>{const j=(i+1)%3,k=(i+2)%3;d.tick(g.outer[j],g.vertices[i],c.teal,i+1);d.tick(g.vertices[i],g.outer[k],c.teal,i+1);});}
  if(s===2){d.poly([A,B,P,C],c.teal,.18,{'data-part':'parallelogram-ABPC'});d.segment(A,P,c.gold,3);d.segment(B,C,c.blue,3);d.tick(A,D,c.gold);d.tick(D,P,c.gold);d.tick(B,D,c.blue,2);d.tick(D,C,c.blue,2);mark(D,'D',c.blue,{dx:10,dy:20});}
  if(s===3){d.segment(A,P,c.muted,2);d.segment(A,g.G,c.blue,4,{'data-part':'AG'});d.segment(g.G,D,c.teal,4,{'data-part':'GD'});d.segment(D,P,c.gold,4,{'data-part':'DP'});mark(D,'D',c.teal,{dx:10,dy:20});}
  if(s===4){d.line(A,g.G,c.muted,1.4);d.segment(A,g.G,c.blue,3);d.segment(g.G,g.turn[0],c.purple,4,{'data-part':'half-turn-A'});d.segment(g.turn[0],P,c.gold,4,{'data-part':'dilation-A'});mark(g.turn[0],'A′',c.purple,{dx:12,dy:-16});}
  if(s===5){g.vertices.forEach((q,i)=>{d.segment(q,g.outer[i],c.muted,1.4);d.segment(g.G,g.outer[i],[c.blue,c.teal,c.purple][i],2.6,{'data-part':'mapped-vertex-'+i});});}
  if(s===6||s===7){d.circle(g.mappedO,2*g.R,c.teal,2,{'data-part':'image-circumcircle'});g.outer.forEach(q=>d.segment(g.mappedO,q,c.gold,1.5,{opacity:.55}));mark(g.mappedO,s===6?'O′':'H = O′',c.gold,{dx:16,dy:24});}
  if(s===9)g.vertices.forEach((q,i)=>d.segment(q,g.vertices[(i+1)%3],c.teal,3.5,{'data-part':'sides-in-coincidence-case'}));
  if(s===9||s===10){g.vertices.forEach((q,i)=>d.segment(q,g.mids[i],[c.blue,c.teal,c.purple][i],2.4,{'data-part':'median-'+i}));}
  if(s===-1||s>=8){
   if(g.coincident)mark(g.G,'O ≈ G ≈ H',c.gold,{dx:18,dy:-18});
   else{d.line(g.O,g.H,c.gold,2,{'data-part':'euler-line'});d.segment(g.O,g.G,c.blue,4,{'data-part':'OG'});d.segment(g.G,g.H,c.teal,4,{'data-part':'GH'});mark(g.O,'O',c.blue,{dx:-18,dy:-15});mark(g.G,'G',c.purple,{dx:12,dy:22});mark(g.H,'H',c.gold,{dx:14,dy:-15});}
  }else{
   if(M.dist(g.O,g.G)<1e-10*g.scale)mark(g.G,'O ≈ G',c.purple,{dx:14,dy:-18});
   else{mark(g.G,'G',c.purple,{dx:12,dy:22});if(s===0||s===6||s===7)mark(g.O,'O',c.blue,{dx:-18,dy:-15});}
  }
  const groups=[];marks.forEach(item=>{const found=groups.find(other=>M.dist(other.point,item.point)<=1e-10*g.scale);if(found)found.label+=' ≈ '+item.label;else groups.push({...item});});groups.forEach(item=>d.point(item.point,item.label,item.color,item.opts));
 },
 steps:[
  {title:'The two known centers',text:'Let G be the centroid of triangle ABC and O its circumcenter.',facts:['G lies on every median','OA = OB = OC'],key:'Purple: G; blue: O and the circumcircle.'},
  {title:'Reuse the larger triangle',text:'Construct the auxiliary triangle PQR from the orthocenter episode, with A, B, and C the midpoints of QR, RP, and PQ.',facts:['A is the midpoint of QR','B is the midpoint of RP','C is the midpoint of PQ'],key:'The larger triangle and matching side marks recover the earlier construction.'},
  {title:'Locate P along a median',text:'Parallelogram ABPC has diagonals AP and BC with common midpoint D, so A, D, and P lie in that order with AD = DP.',facts:['D is the midpoint of BC','AD = DP'],key:'Teal: the parallelogram; gold and blue: its bisected diagonals.'},
  {title:'Use the centroid ratio',text:'Because AG = 2GD and G lies between A and D, GP = GD + DP = GD + AD = 2GA.',facts:['A, G, D, P occur in that order','GP = 2GA'],key:'The three colored pieces show how the centroid ratio determines GP.'},
  {title:'Turn, then double',text:'A half-turn about G followed by a dilation of factor 2 about G therefore sends A to P.',facts:['A turns to A′ on the opposite ray','GP = 2GA′ = 2GA'],key:'Purple: the half-turn image A′; gold: doubling its distance from G.'},
  {title:'Transform the whole triangle',text:'The same argument sends B to Q and C to R, so this transformation sends triangle ABC to triangle PQR.',facts:['A → P','B → Q','C → R'],key:'The three colored rays join corresponding vertices through G.'},
  {title:'Transform the circle and its center',text:'This transformation sends the circumcircle of ABC to the circumcircle of PQR and sends its center O to that circle’s center O′.',facts:['The image radius is twice the original radius','GO′ = 2GO on the opposite ray when O ≠ G'],key:'Blue: the original circle; teal: its image, centered at O′.'},
  {title:'Recognize H',text:'The orthocenter episode proved that H is the circumcenter of PQR, so uniqueness gives O′ = H.',facts:['O′ = H'],key:'Gold: the image center is the already-established orthocenter H.'},
  {title:'The Euler line',text:g=>g.coincident?'If O = G, the transformation fixes that point, so H = G; if O ≠ G, the centers are collinear with G between O and H and GH = 2GO.':'If O ≠ G, the definition of the transformation puts O, G, and H on one line, with G between O and H and GH = 2GO.',facts:g=>g.coincident?['If O = G, then O = G = H','Otherwise GH = 2GO, even when the points look merged']:['O, G, H are collinear','OG : GH = 1 : 2'],key:g=>g.coincident?'The ≈ label groups numerically close centers; the proof distinguishes exact coincidence from distinct centers.':'Blue: OG; teal: GH, twice as long; gold: their common line.'},
  {title:'When the centers coincide',text:'If O = G, every median is also a perpendicular bisector, so the perpendicular-bisector fact forces all three sides of ABC to be equal.',facts:['O = G implies AB = BC = CA','The transformation then gives H = G'],key:'The medians show the lines that become perpendicular bisectors in the coincidence case.'},
  {title:'The equilateral exception',text:'Conversely, the medians of an equilateral triangle are perpendicular bisectors and altitudes, so O = G = H and no unique Euler line is determined.',facts:['Equilateral: O = G = H','Otherwise: a unique Euler line'],key:'Use “Make equilateral” to see the three center labels merge into one point.'}
 ]
};
})();
