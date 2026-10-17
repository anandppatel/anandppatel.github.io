(() => {
'use strict';
const part=name=>({'data-part':name});
const bounds=(o,r)=>[{x:o.x-r,y:o.y-r},{x:o.x+r,y:o.y+r}];
const colors=d=>[d.colors.blue,d.colors.teal,d.colors.purple];
function point(d,g,q,name,color,M,prefix='',coincidentName=''){
 const i=g.vertices.findIndex(v=>M.dist(v,q)<=1e-10*g.scale);
 d.point(q,name+(coincidentName?' ≈ '+coincidentName:'')+(i<0?'':' ≈ '+'ABC'[i]),color,{dx:13,dy:-13,...part(prefix+'point-'+name)});
}
function bisectors(d,g,prefix=''){
 for(let i=0;i<2;i++)d.segment(g.vertices[i],g.gergonneBisectorEnds[i],colors(d)[i],2.3,part(prefix+'bisector-'+i));
}
function feet(d,g,M,prefix=''){
 g.incTouches.forEach((q,i)=>{
  const a=g.vertices[(i+1)%3],b=g.vertices[(i+2)%3],color=colors(d)[i];
  d.segment(g.I,q,color,2.3,part(prefix+'radius-'+i));
  d.right(q,M.add(q,M.perp(M.sub(b,a))),M.add(q,M.sub(b,a)),color,part(prefix+'right-'+i));
  point(d,g,q,'DEF'[i],color,M,prefix);
 });
}
function tangentPair(d,g,i,M){
 const vertex=g.vertices[i],first=g.incTouches[(i+1)%3],second=g.incTouches[(i+2)%3],color=colors(d)[i];
 d.segment(vertex,first,color,4,part('tangent-first-'+i));d.segment(vertex,second,color,4,part('tangent-second-'+i));
 d.tick(vertex,first,color,i+1);d.tick(vertex,second,color,i+1);
}
function cevians(d,g,count,prefix=''){
 for(let i=0;i<count;i++)d.segment(g.vertices[i],g.incTouches[i],colors(d)[i],3,part(prefix+'cevian-'+i));
}
const construction={
 steps:[
  {label:'Draw two internal bisectors',text:'Construct the internal angle bisectors at A and B.'},
  {label:'Mark I and its perpendicular feet',text:'Mark the bisectors’ intersection I and drop perpendiculars to BC, CA, and AB, naming the feet D, E, and F.'},
  {label:'Draw the incircle',text:'Draw the circle centered at I with radius ID; the incenter proof explains its three tangencies.'},
  {label:'Draw AD and BE',text:'Join A to the opposite contact D and B to the opposite contact E.'},
  {label:'Add the cevian CF',text:'Join C to the third contact F and inspect the three cevians.'},
  {label:'Mark the intersection Ge',text:'Mark the intersection of AD and BE as Ge; the proof will establish that CF passes through it.'}
 ],
 handleIds:()=>[],
 draw(d,g,l,p,M){
  if(!l)return;bisectors(d,g,'construction-');
  const merge=l>=6&&M.dist(g.I,g.Ge)<=1e-10*g.scale;
  if(l>=2){point(d,g,g.I,'I',d.colors.gold,M,'construction-',merge?'Ge':'');feet(d,g,M,'construction-');}
  if(l>=3)d.circle(g.I,g.r,d.colors.gold,2.5,part('construction-incircle'));
  if(l>=4)cevians(d,g,l>=5?3:2,'construction-');
  if(l>=6&&!merge)point(d,g,g.Ge,'Ge',d.colors.purple,M,'construction-');
 },
 extent(g,p,l){const out=[...g.vertices];if(l>=1)out.push(...g.gergonneBisectorEnds.slice(0,2));if(l>=2)out.push(g.I,...g.incTouches);if(l>=3)out.push(...bounds(g.I,g.r));if(l>=6)out.push(g.Ge);return out;},
 status:()=> 'Drag any vertex freely; the incircle contacts remain inside their side segments.'
};
window.ProofEpisode={
 slug:'gergonne',number:'14',title:'The Gergonne point',
 subtitle:'The incircle contacts determine three concurrent cevians.',
 observation:'The cevians from the vertices to the opposite incircle contacts concur at a unique interior point Ge, the Gergonne point.',
 prediction:'How do the incircle contact ratios compare with the excircle ratios from the Nagel episode?',
 after:'Which equal tangent lengths cancel in Ceva’s product, and why must the contact points be interior?',
 prerequisites:[
  {label:'04 · The incenter and incircle',href:'../incenter/'},
  {label:'10 · Ceva for interior side points',href:'../ceva/'},
  {label:'O1 · Tangents and radii',href:'../basics/#o1'},
  {label:'O2 · Equal tangents',href:'../basics/#o2'}
 ],
 notes:[
  {title:'Constructing the circle before using it',body:'The incenter episode proves that the first two internal bisectors meet uniquely inside ABC and that their intersection I has equal positive perpendicular distances to all three side lines. The equal-distance converse puts I on the third internal bisector. Each perpendicular foot lies on the forward rays from both endpoints of its side, hence strictly inside the side segment. The circle with this common distance as radius is tangent to all three side lines by O1, and its disk lies in their inward half-planes. Thus the incircle and the locations of its contacts are established, rather than assumed from the drawing.'},
  {title:'The contact lengths',body:'Write D, E, F for the incircle contacts on BC, CA, AB. The tangent pairs give x = AF = AE, y = BF = BD, z = CD = CE. With a = BC, b = CA, c = AB and s = (a + b + c)/2, the side equations a = y + z, b = z + x, c = x + y give x = s − a, y = s − b, z = s − c. All three are positive.'},
  {title:'A different contact construction',body:'The Nagel episode uses contacts of three different excircles; this episode uses the three contacts of a single incircle. Its point is called Ge, leaving G for the centroid. Close labels use ≈ to indicate drawing precision, not a proved equality.'}
 ],
 compute(g,p,M){return {gergonneBisectorEnds:g.vertices.map((v,i)=>{const a=g.vertices[(i+1)%3],b=g.vertices[(i+2)%3];return M.lerp(a,b,M.dist(v,a)/(M.dist(v,a)+M.dist(v,b)));})};},
 construction,
 extent(g,p,s){const out=[...g.vertices,g.I,...g.incTouches];if(s>=2||s===-1)out.push(...bounds(g.I,g.r));if(s>=10||s===-1)out.push(g.Ge);return out;},
 status:()=> 'A, B, and C remain freely draggable; all three contact cevians and their intersection follow the triangle.',
 draw(d,g,s,p,M){
  const {blue,teal,purple,gold}=d.colors;
  if(s<=1&&s>=0)bisectors(d,g);
  if(s<=3&&s>=0)point(d,g,g.I,'I',gold,M);
  if(s>=1||s===-1)feet(d,g,M);
  if(s>=2||s===-1)d.circle(g.I,g.r,gold,s===2||s===3?3:1.8,part('incircle'));
  if(s===0){for(let i=0;i<2;i++){const v=g.vertices[i];d.angle(g.vertices[(i+1)%3],v,g.I,colors(d)[i],{radius:25,...part('angle-half-'+i+'a')});d.angle(g.I,v,g.vertices[(i+2)%3],colors(d)[i],{radius:25,...part('angle-half-'+i+'b')});}}
  if(s===1)g.incTouches.forEach(q=>d.tick(g.I,q,gold));
  if(s===3)for(let i=0;i<3;i++)d.segment(g.vertices[(i+1)%3],g.vertices[(i+2)%3],colors(d)[i],3.5,part('tangent-side-'+i));
  if(s>=4&&s<=6)tangentPair(d,g,s-4,M);
  if(s>=7&&s<=9)for(let i=0;i<3;i++)tangentPair(d,g,i,M);
  if(s===8||s===9){
   const pairs=[[g.B,g.incTouches[0],'y'],[g.incTouches[0],g.C,'z'],[g.C,g.incTouches[1],'z'],[g.incTouches[1],g.A,'x'],[g.A,g.incTouches[2],'x'],[g.incTouches[2],g.B,'y']];
   pairs.forEach(([a,b,label],i)=>d.label(M.mid(a,b),label,[blue,teal,purple][Math.floor(i/2)],{dy:17,...part('contact-length-'+i)}));
  }
  if(s>=10||s===-1){cevians(d,g,3);point(d,g,g.Ge,'Ge',purple,M);}
  if(s===11)d.poly(g.vertices,gold,.055,part('interior-ABC'));
 },
 steps:[
  {title:'Construct the incenter',text:'The internal bisectors at A and B meet at an interior point I, as established in the incenter episode.',facts:['The intersection exists uniquely inside ABC.','No circle has yet been assumed.'],key:'Blue and teal show the two defining bisectors and their intersection.'},
  {title:'Three equal distances',text:'The angle-bisector distance fact gives equal perpendiculars ID = IE = IF > 0, with D, E, F strictly inside BC, CA, AB.',facts:['The third bisector follows from the equal-distance converse.','The forward-ray argument at both endpoints places each foot inside its side.'],key:'The three equal perpendiculars and their right angles are highlighted.'},
  {title:'Construct the incircle',text:'Draw the circle centered at I with radius ID, which therefore passes through D, E, and F.',facts:['The common perpendicular distance determines a positive radius.'],key:'The circle is drawn through all three justified contact candidates.'},
  {title:'The tangent sides',text:'The perpendicular-radius criterion makes BC, CA, and AB tangent to this circle, whose disk lies inside the triangle.',facts:['O1 proves tangency at D, E, F.','The three inward half-planes contain the disk, as proved in the incenter episode.'],key:'Each side meets the corresponding radius at a marked right angle.'},
  {title:'Tangents from A',text:'Equal tangents from A give AF = AE = x > 0.',facts:['O2 applies because A is outside the circle and neither contact is A.'],key:'The two blue tangent segments have equal lengths.'},
  {title:'Tangents from B',text:'Equal tangents from B give BF = BD = y > 0.',facts:['Both contacts lie strictly inside their side segments.'],key:'The two teal tangent segments have equal lengths.'},
  {title:'Tangents from C',text:'Equal tangents from C give CD = CE = z > 0.',facts:['The same equal-tangents fact applies at C.'],key:'The two purple tangent segments have equal lengths.'},
  {title:'Read the side lengths',text:'Writing a = BC, b = CA, c = AB and s = (a + b + c)/2, the three side sums give x = s − a, y = s − b, z = s − c.',facts:['a = y + z, b = z + x, c = x + y.','s = x + y + z.'],key:'Each side is divided into two of the three matched tangent lengths.'},
  {title:'The contact ratios',text:'The three ratios for Ceva are BD/DC = y/z, CE/EA = z/x, and AF/FB = x/y.',facts:['All denominators are positive.','D, E, F are interior side points.'],key:'The six labeled side segments identify the cyclic order of the ratios.'},
  {title:'The product is one',text:'Their product is (y/z)(z/x)(x/y) = 1 because each positive tangent length cancels.',facts:['(BD/DC)(CE/EA)(AF/FB) = 1.'],key:'All three tangent pairs participate in the same product.'},
  {title:'Apply Ceva',text:'The converse of Ceva makes AD, BE, and CF concurrent at a point Ge.',facts:['The ordinary interior form of Ceva applies.'],key:'The three cevians and their common point appear together.'},
  {title:'The Gergonne point',text:'The first two interior cevians intersect once inside ABC, so Ge is unique and is called the Gergonne point.',facts:['The third cevian passes through this same interior point.','Ge is different notation from the centroid G.'],key:'The highlighted triangle contains the unique common point Ge.'}
 ]
};
})();
