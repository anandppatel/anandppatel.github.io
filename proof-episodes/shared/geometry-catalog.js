(() => {
'use strict';
const circleBounds=(o,r)=>[{x:o.x-r,y:o.y-r},{x:o.x+r,y:o.y+r}];
const familyColors=d=>[d.colors.blue,d.colors.teal,d.colors.purple];
// Add future constructions here: the studio builds its controls from this list.
// A center needs point(g) and a label beginning with its displayed name, then " · ".
// Other entries supply draw(d,g,p,M), and extent(g,p,M) when they extend beyond ABC.
// Draw only the requested object: a circle or line must not turn on its center label.
window.TriangleCatalog=[
 {id:'center-g',label:'G · Centroid',group:'Centers',description:'The common point of the three medians.',episode:'../centroid/',point:g=>g.G},
 {id:'center-o',label:'O · Circumcenter',group:'Centers',description:'The point equidistant from A, B, and C.',episode:'../circumcenter/',point:g=>g.O},
 {id:'center-h',label:'H · Orthocenter',group:'Centers',description:'The common point of the three altitude lines.',episode:'../orthocenter/',point:g=>g.H},
 {id:'center-i',label:'I · Incenter',group:'Centers',description:'The common point of the three internal angle bisectors.',episode:'../incenter/',point:g=>g.I},
 {id:'center-n',label:'N · Nine-point center',group:'Centers',description:'The midpoint of OH, center of the nine-point circle.',episode:'../nine-point-circle/',point:g=>g.N},
 {id:'medians',label:'Medians',group:'Lines',description:'Join each vertex to its opposite side midpoint.',episode:'../centroid/',
  draw:(d,g)=>g.vertices.forEach((v,i)=>d.segment(v,g.mids[i],familyColors(d)[i],2.6,{'data-part':'studio-median-'+i}))},
 {id:'perpendicular-bisectors',label:'Perpendicular bisectors',group:'Lines',description:'Lines perpendicular to the sides at their midpoints.',episode:'../circumcenter/',
  draw:(d,g,p,M)=>g.mids.forEach((m,i)=>d.line(m,M.add(m,M.perp(M.sub(g.vertices[(i+2)%3],g.vertices[(i+1)%3]))),familyColors(d)[i],1.8,{'stroke-dasharray':'7 4','data-part':'studio-perpendicular-bisector-'+i}))},
 {id:'altitudes',label:'Altitude lines',group:'Lines',description:'A full line through each vertex perpendicular to the opposite side.',episode:'../orthocenter/',
  draw:(d,g,p,M)=>g.vertices.forEach((v,i)=>d.line(v,M.add(v,M.perp(M.sub(g.vertices[(i+2)%3],g.vertices[(i+1)%3]))),familyColors(d)[i],2,{'data-part':'studio-altitude-'+i})),extent:g=>g.feet},
 {id:'internal-bisectors',label:'Internal angle bisectors',group:'Lines',description:'Segments from the vertices that split each interior angle into equal halves.',episode:'../incenter/',
  draw:(d,g)=>g.vertices.forEach((v,i)=>d.segment(v,g.studioBisectorEnds[i],familyColors(d)[i],2.3,{'stroke-dasharray':'4 4','data-part':'studio-internal-bisector-'+i}))},
 {id:'euler-line',label:'Euler line',group:'Lines',description:'The line through O, G, and H in a non-equilateral triangle; no unique line exists in the equilateral case.',episode:'../euler-line/',
  draw:(d,g)=>{if(!g.studioEulerClose)d.line(g.O,g.H,d.colors.gold,2.8,{'data-part':'studio-euler-line'});},extent:g=>g.studioEulerClose?[]:[g.O,g.H]},
 {id:'auxiliary-triangle',label:'Auxiliary triangle PQR',group:'Lines',description:'The larger triangle whose side midpoints are A, B, and C.',episode:'../orthocenter/',
  draw:(d,g)=>{d.poly(g.outer,d.colors.muted,.025,{'data-part':'studio-auxiliary-triangle'});g.outer.forEach((v,i)=>d.point(v,['P','Q','R'][i],d.colors.muted,{'data-part':'studio-auxiliary-point-'+i}));},extent:g=>g.outer},
 {id:'cevians',label:'Free cevians AX, BY, CZ',group:'Lines',description:'Drag X, Y, and Z independently along BC, CA, and AB; the cevians need not concur.',episode:'../ceva/',
  draw:(d,g)=>g.vertices.forEach((v,i)=>d.segment(v,g.studioCevianPoints[i],familyColors(d)[i],2.5,{'data-part':'studio-cevian-'+i}))},
 {id:'circumcircle',label:'Circumcircle',group:'Circles',description:'The circle through A, B, and C.',episode:'../circumcenter/',
  draw:(d,g)=>d.circle(g.O,g.R,d.colors.blue,2.2,{'data-part':'studio-circumcircle'}),extent:g=>circleBounds(g.O,g.R)},
 {id:'incircle',label:'Incircle',group:'Circles',description:'The circle inside ABC tangent to all three sides.',episode:'../incenter/',
  draw:(d,g)=>d.circle(g.I,g.r,d.colors.teal,2.4,{'data-part':'studio-incircle'}),extent:g=>circleBounds(g.I,g.r)},
 {id:'nine-point-circle',label:'Nine-point circle',group:'Circles',description:'The circle through the side midpoints, altitude feet, and midpoints of HA, HB, and HC.',episode:'../nine-point-circle-altitudes/',
  draw:(d,g)=>d.circle(g.N,g.R/2,d.colors.purple,2.3,{'data-part':'studio-nine-point-circle'}),extent:g=>circleBounds(g.N,g.R/2)},
 {id:'diameter-circle',label:'Circle with diameter AB',group:'Circles',description:'For noncollinear ABC, C lies on this circle exactly when angle ACB is right.',episode:'../thales/',
  draw:(d,g)=>d.circle(g.studioDiameterCenter,g.studioDiameterRadius,d.colors.gold,2,{'stroke-dasharray':'6 4','data-part':'studio-diameter-circle'}),extent:g=>circleBounds(g.studioDiameterCenter,g.studioDiameterRadius)},
 {id:'side-midpoints',label:'Side midpoints D, E, F',group:'Points',description:'The midpoints of BC, CA, and AB, respectively.',episode:'../centroid/',
  draw:(d,g)=>g.mids.forEach((v,i)=>d.point(v,['D','E','F'][i],d.colors.gold,{'data-part':'studio-side-midpoint-'+i})),extent:g=>g.mids},
 {id:'altitude-feet',label:'Altitude feet A₁, B₁, C₁',group:'Points',description:'Perpendicular feet on the full opposite-side lines; some can lie outside the side segments.',episode:'../nine-point-circle-altitudes/',
  draw:(d,g)=>g.feet.forEach((v,i)=>d.point(v,['A₁','B₁','C₁'][i],d.colors.purple,{'data-part':'studio-altitude-foot-'+i})),extent:g=>g.feet},
 {id:'h-midpoints',label:'Midpoints U, V, W of HA, HB, HC',group:'Points',description:'The midpoints of the three segments joining H to the vertices.',episode:'../nine-point-circle/',
  draw:(d,g)=>g.half.forEach((v,i)=>d.point(v,['U','V','W'][i],d.colors.teal,{'data-part':'studio-h-midpoint-'+i})),extent:g=>g.half}
];
})();
