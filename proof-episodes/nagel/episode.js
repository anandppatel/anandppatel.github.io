(() => {
'use strict';
const part=name=>({'data-part':name});
const bounds=(o,r)=>[{x:o.x-r,y:o.y-r},{x:o.x+r,y:o.y+r}];
const colors=d=>[d.colors.blue,d.colors.teal,d.colors.purple];
function labels(d,g,entries,M,prefix='') {
 const groups=[];
 for(const [point,name,color] of entries){
  const old=groups.find(q=>M.dist(q.point,point)<=1e-10*g.scale);
  if(old)old.names.push(name);else groups.push({point,names:[name],color});
 }
 for(const q of groups){
  const vertex=g.vertices.findIndex(v=>M.dist(v,q.point)<=1e-10*g.scale);
  d.point(q.point,q.names.concat(vertex<0?[]:['ABC'[vertex]]).join(' ≈ '),q.color,{dx:13,dy:-13,...part(prefix+'point-'+q.names[0])});
 }
}
function radius(d,g,o,q,a,b,color,M,name){
 d.segment(o,q,color,2.5,part(name));
 // Use the exact side normal for the mark; it remains reliable when the
 // center is extremely far away and the circle is nearly flat on screen.
 d.right(q,M.add(q,M.perp(M.sub(b,a))),M.add(q,M.sub(b,a)),color,part(name+'-right'));
}
function bisectors(d,g,M,prefix='',supports=true){
 d.segment(g.A,g.excenters[0],d.colors.blue,2.1,part(prefix+'internal-bisector-A'));
 d.segment(g.B,g.excenters[0],d.colors.teal,2.1,part(prefix+'external-bisector-B'));
 if(supports){
  d.line(g.A,g.B,d.colors.muted,1,{'stroke-dasharray':'4 5',...part(prefix+'support-AB')});
  d.line(g.A,g.C,d.colors.muted,1,{'stroke-dasharray':'4 5',...part(prefix+'support-AC')});
 }
}
function contacts(d,g,M,prefix='',radii=true,includeL=false){
 const I=g.excenters[0],D=g.exTouches[0],U=g.exU,V=g.exV;
 if(radii){radius(d,g,I,D,g.B,g.C,d.colors.purple,M,prefix+'radius-D');radius(d,g,I,U,g.A,g.C,d.colors.blue,M,prefix+'radius-U');radius(d,g,I,V,g.A,g.B,d.colors.teal,M,prefix+'radius-V');}
 const entries=[[D,'D',d.colors.purple],[U,'U',d.colors.blue],[V,'V',d.colors.teal]];
 if(includeL)entries.push([g.exL,'L',d.colors.muted]);
 labels(d,g,entries,M,prefix);
}
function cevians(d,g,M,prefix='',center=false,showContacts=true){
 g.vertices.forEach((v,i)=>d.segment(v,g.exTouches[i],colors(d)[i],3,part(prefix+'cevian-'+i)));
 if(showContacts)labels(d,g,g.exTouches.map((q,i)=>[q,'DEF'[i],colors(d)[i]]),M,prefix);
 if(center)labels(d,g,[[g.Na,'Na',d.colors.gold]],M,prefix);
}
const construction={
 steps:[
  {label:'Draw two bisectors',text:'Draw the internal bisector at A and the exterior bisector at B on the far side of BC.'},
  {label:'Mark the excenter I_a',text:'Mark their intersection beyond BC as I_a; the proof explains why these two rays meet there.'},
  {label:'Drop three perpendiculars',text:'Drop perpendiculars from I_a to BC, CA, and AB, with feet D, U, and V.'},
  {label:'Draw the A-excircle',text:'Draw the circle centered at I_a with radius I_aD and inspect the three tangencies.'},
  {label:'Construct the other excircles',text:'Repeat at B and C, marking their opposite-side contacts E on CA and F on AB.'},
  {label:'Draw the contact cevians',text:'Join A to D, B to E, and C to F.'},
  {label:'Mark the intersection Na',text:'Mark the intersection of AD and BE as Na and inspect CF; the proof will establish the concurrence.'}
 ],
 handleIds:()=>[],
 draw(d,g,l,p,M){
  if(!l)return;bisectors(d,g,M,'construction-',l<4);
  if(l>=2)labels(d,g,[[g.excenters[0],'I_a',d.colors.gold]],M,'construction-');
  if(l>=3)contacts(d,g,M,'construction-');
  if(l>=4)d.circle(g.excenters[0],g.exradii[0],d.colors.blue,2.4,{'data-excircle':true,...part('construction-excircle-0')});
  if(l>=5){
   for(let i=1;i<3;i++)d.circle(g.excenters[i],g.exradii[i],colors(d)[i],2.1,{'data-excircle':true,...part('construction-excircle-'+i)});
   labels(d,g,g.exTouches.slice(1).map((q,i)=>[q,'EF'[i],colors(d)[i+1]]),M,'construction-');
  }
  if(l>=6)cevians(d,g,M,'construction-',l>=7,false);
 },
 extent(g,p,l){
  const out=[...g.vertices];if(l>=1)out.push(g.excenters[0]);if(l>=3)out.push(g.exU,g.exV,g.exTouches[0]);
  if(l>=4)out.push(...bounds(g.excenters[0],g.exradii[0]));
  if(l>=5)for(let i=1;i<3;i++)out.push(...bounds(g.excenters[i],g.exradii[i]));
  if(l>=6)out.push(...g.exTouches);if(l>=7)out.push(g.Na);return out;
 },
 status:(g,p,l)=>l>=5?'The contacts D, E, F belong to three different excircles; drag any vertex to compare them.':'Drag A, B, or C freely; the displayed construction follows the triangle.'
};
window.ProofEpisode={
 slug:'nagel',number:'13',title:'The Nagel point',
 subtitle:'Three excircles, three contact cevians, one interior point.',
 observation:'The cevians from the vertices to the opposite-side excircle contacts concur at a unique interior point Na, the Nagel point.',
 prediction:'Which side segments are exchanged when you replace an incircle contact by an excircle contact?',
 after:'Why does Ceva apply to ordinary positive lengths here, even though two tangencies of each excircle lie on side extensions?',
 prerequisites:[
  {label:'04 · Angle bisectors and equal distances',href:'../incenter/'},
  {label:'10 · Ceva for interior side points',href:'../ceva/'},
  {label:'T2 · Angle sum',href:'../basics/#t2'},
  {label:'T4 · Strict triangle inequality',href:'../basics/#t4'},
  {label:'P2 · Same-side angles and parallels',href:'../basics/#p2'},
  {label:'O1 · Tangents and radii',href:'../basics/#o1'},
  {label:'O2 · Equal tangents',href:'../basics/#o2'}
 ],
 notes:[
  {title:'Why the excenter exists in the required region',body:'Let L be the internal A-bisector’s intersection with BC, and put α = ∠A, β = ∠B, γ = ∠C. Choose the exterior B-bisector ray inside the angle between BC and the ray opposite BA. This ray and the ray AL continued past L lie on the far side of BC. Their angles with BL and LB are (180° − β)/2 and α/2 + β, whose sum is 180° − γ/2 < 180°. By P2 their supporting lines cannot be parallel, so they intersect. An intersection on the A-side of BC would give a triangle whose base angles are the supplements of these two angles and sum to more than 180°, contradicting T2. Thus the intersection is on the two chosen rays beyond BC; call it I_a. The two distinct lines give a unique intersection. This constructs the excenter from two bisectors; no circle has been assumed.'},
  {title:'Why the contacts are on the stated rays',body:'The equal-distance fact from the incenter episode applies to every angle smaller than 180°, including the exterior angles here. I_a lies inside angle A and beyond BC, so it lies inside the exterior angle at C between CB and the ray opposite CA. Equal distances to CA and CB put it on that angle’s internal bisector. The perpendicular feet from a point on an internal bisector lie on both forward boundary rays. Applying this at B and C places D on both rays BC and CB, hence strictly inside BC; it places V beyond B on AB and U beyond C on AC. None of these contacts can be a vertex.'},
  {title:'Why this is the A-excircle',body:'The common perpendicular distance from I_a to the three side lines is positive. The circle with this radius is tangent at D, U, and V by O1. Its disk lies on the far side of BC and in the inward half-planes of AB and AC, since each line is exactly one radius from the center. Thus it lies outside ABC, opposite A. Any circle in that region tangent to all three lines has its center on the same two angle-bisector rays, so this excircle is unique. Repeat cyclically for the other two excircles.'},
  {title:'Names and ordinary lengths',body:'Write a = BC, b = CA, c = AB and s = (a + b + c)/2. D, E, F are the contacts on BC, CA, AB of the A-, B-, C-excircles respectively. Na names the Nagel point; N remains the nine-point center. Every ratio in Ceva uses positive segment lengths, because D, E, F are interior side points.'},
  {title:'Drawing precision',body:'Nearly flat triangles may have very distant excenters and very large excircles. Fit construction includes each displayed circle in full; Fit triangle returns attention to ABC. Close point labels use ≈, which makes no claim of exact equality.'}
 ],
 compute(g,p,M){
  return {exL:M.lerp(g.B,g.C,g.sides[2]/(g.sides[1]+g.sides[2])),exU:M.add(g.A,M.mul(M.unit(M.sub(g.C,g.A)),g.s)),exV:M.add(g.A,M.mul(M.unit(M.sub(g.B,g.A)),g.s))};
 },
 construction,
 extent(g,p,s){
  const out=[...g.vertices];
  if(s<=9&&s>=0)out.push(g.excenters[0],g.exL);
  if(s>=2&&s<=9)out.push(g.exU,g.exV,g.exTouches[0]);
  if(s>=5&&s<=9)out.push(...bounds(g.excenters[0],g.exradii[0]));
  if(s===10||s===11||s===-1)for(let i=0;i<3;i++)out.push(...bounds(g.excenters[i],g.exradii[i]));
  if(s>=10||s===-1)out.push(...g.exTouches);if(s>=14||s===-1)out.push(g.Na);return out;
 },
 status:()=> 'A, B, and C remain freely draggable; each contact stays strictly inside its opposite side in every noncollinear triangle.',
 draw(d,g,s,p,M){
  const {blue,teal,purple,gold,muted}=d.colors,I=g.excenters[0],D=g.exTouches[0],U=g.exU,V=g.exV;
  if(s===-1){g.excenters.forEach((q,i)=>d.circle(q,g.exradii[i],colors(d)[i],1.8,{'data-excircle':true,...part('excircle-'+i)}));cevians(d,g,M,'',true);return;}
  if(s<=9){
   bisectors(d,g,M,'',s<5);if(s<2)labels(d,g,[[g.exL,'L',muted]],M);
   if(s>=1)labels(d,g,[[I,'I_a',gold]],M);
   if(s===0){d.angle(g.B,g.A,I,blue,{radius:27,...part('angle-A-half-1')});d.angle(I,g.A,g.C,blue,{radius:27,...part('angle-A-half-2')});d.angle(g.C,g.B,I,teal,{radius:24,...part('angle-B-exterior-1')});d.angle(I,g.B,V,teal,{radius:24,...part('angle-B-exterior-2')});}
   if(s===1){d.poly([g.B,g.exL,I],gold,.14,part('triangle-BLIa'));d.angle(g.exL,g.B,I,teal,{radius:27,label:'90° − β/2',...part('angle-LBIa')});d.angle(g.B,g.exL,I,blue,{radius:32,label:'α/2 + β',...part('angle-BLIa')});}
   if(s>=2)contacts(d,g,M,'',true,true);
   if(s===2){d.poly([g.A,V,I],blue,.12,part('triangle-AVIa'));d.poly([g.A,U,I],teal,.12,part('triangle-AUIa'));d.tick(I,V,gold);d.tick(I,U,gold);}
   if(s===3){d.poly([g.B,V,I],teal,.13,part('triangle-BVIa'));d.poly([g.B,D,I],purple,.13,part('triangle-BDIa'));d.tick(I,V,gold);d.tick(I,D,gold);}
   if(s===4){d.segment(g.C,I,purple,3,part('external-bisector-C'));d.angle(g.B,g.C,I,purple,{radius:26,...part('angle-C-exterior-1')});d.angle(I,g.C,U,purple,{radius:26,...part('angle-C-exterior-2')});d.segment(g.B,D,gold,4,part('contact-interior-BD'));d.segment(D,g.C,gold,4,part('contact-interior-DC'));}
   if(s>=5)d.circle(I,g.exradii[0],blue,2.5,{'data-excircle':true,...part('excircle-0')});
   if(s===6||s===8){d.segment(g.A,V,blue,4,part('tangent-AV'));d.segment(g.A,U,teal,4,part('tangent-AU'));d.tick(g.A,V,gold);d.tick(g.A,U,gold);}
   if(s===7||s===8){[[g.B,V,'BV'],[g.B,D,'BD'],[g.C,U,'CU'],[g.C,D,'CD']].forEach(([a,b,name],i)=>{d.segment(a,b,i<2?teal:purple,4,part('tangent-'+name));d.tick(a,b,i<2?teal:purple,i<2?1:2);});}
   if(s===9){d.segment(g.B,D,teal,5,part('length-BD'));d.segment(D,g.C,purple,5,part('length-DC'));d.label(M.mid(g.B,D),'s − c',teal,{dy:20});d.label(M.mid(D,g.C),'s − b',purple,{dy:20});}
   return;
  }
  if(s===10||s===11){
   g.excenters.forEach((q,i)=>d.circle(q,g.exradii[i],colors(d)[i],i===s-9?3:1.2,{'data-excircle':true,...part('excircle-'+i)}));
   labels(d,g,g.exTouches.map((q,i)=>[q,'DEF'[i],colors(d)[i]]),M);
   const i=s===10?1:2,q=g.exTouches[i],a=g.vertices[(i+1)%3],b=g.vertices[(i+2)%3];
   d.segment(a,q,teal,5,part('cyclic-first-segment'));d.segment(q,b,purple,5,part('cyclic-second-segment'));return;
  }
  labels(d,g,g.exTouches.map((q,i)=>[q,'DEF'[i],colors(d)[i]]),M);
  for(let i=0;i<3;i++){const a=g.vertices[(i+1)%3],b=g.vertices[(i+2)%3],q=g.exTouches[i];d.segment(a,q,colors(d)[i],s<=13?4:1.5,part('side-first-'+i));d.segment(q,b,colors(d)[i],s<=13?2.5:1.5,part('side-second-'+i));}
  if(s>=14)cevians(d,g,M,'',true,false);
  if(s===15)d.poly(g.vertices,gold,.055,part('interior-ABC'));
 },
 steps:[
  {title:'Two bisector rays',text:'Let L lie on BC with AL the internal A-bisector, and draw the exterior B-bisector ray between BC and the ray opposite BA.',facts:['The triangle is noncollinear.','Write α = ∠A, β = ∠B, γ = ∠C.'],key:'The blue and teal rays specify the two chosen bisectors.'},
  {title:'Construct the excenter',text:'The chosen rays meet beyond BC at I_a because their angles with BL and LB sum to 180° − γ/2 < 180°.',facts:['The two angles are (180° − β)/2 and α/2 + β.','P2 rules out parallel supporting lines; T2 rules out an intersection on the other side of BC.','The supporting note gives the full ray-intersection argument.'],key:'The shaded triangle records the intersection whose existence and location have just been established.'},
  {title:'Equal distances at A',text:'The internal bisector at A makes the perpendicular distances from I_a to AB and AC equal.',facts:['The equal-distance fact applies inside angle A.','Name the feet on AB and AC by V and U.'],key:'The blue and teal right triangles share the angle-bisector argument.'},
  {title:'A third equal distance',text:'The exterior bisector at B also equates the distances to AB and BC, so all three perpendicular distances are equal.',facts:['D is the perpendicular foot on BC.','I_aV = I_aU = I_aD > 0.'],key:'The two right triangles at B compare the same AB distance with the BC distance.'},
  {title:'Locate every contact',text:'The equal-distance converse puts I_a on the exterior C-bisector, whose forward-ray feet together with those at B place D inside BC, U beyond C, and V beyond B.',facts:['I_a lies inside angle A and beyond BC, hence inside the required exterior angle at C.','The supporting note checks both forward rays on each side line.'],key:'Purple marks the exterior C-bisector; gold marks the two positive pieces of BC.'},
  {title:'Construct the A-excircle',text:'The circle centered at I_a with radius I_aD is tangent to BC, CA, and AB at D, U, and V by the perpendicular-radius criterion.',facts:['O1 supplies each tangency.','The disk is beyond BC and within angle A, so this is the A-excircle.'],key:'The circle appears only after its center, radius, and contact locations are justified.'},
  {title:'Tangents from A',text:'The two tangent segments from A to this circle have equal lengths AV = AU.',facts:['A is strictly outside the circle because its tangent contacts differ from A.','O2: equal tangents from an exterior point.'],key:'The long blue and teal tangent segments have matching marks.'},
  {title:'Tangents from B and C',text:'The tangent pairs from B and C likewise give BV = BD and CU = CD.',facts:['B and C are strictly outside the circle because D is an interior side point.'],key:'Each pair has its own matching marks.'},
  {title:'The semiperimeter',text:'Since AV = c + BD, AU = b + CD, and BD + CD = a, the equal lengths AV and AU both equal s = (a + b + c)/2.',facts:['a = BC, b = CA, c = AB.','AV + AU = c + b + BD + CD = a + b + c.'],key:'The highlighted tangent segments split at B and C into the displayed pieces.'},
  {title:'The first contact ratio',text:'Subtracting c and b gives BD = s − c and DC = s − b.',facts:['BD/DC = (s − c)/(s − b).'],key:'Teal and purple show the two segments used in the first Ceva ratio.'},
  {title:'Repeat at B',text:'The same construction for the B-excircle gives its contact E inside CA with CE = s − a and EA = s − c.',facts:['CE/EA = (s − a)/(s − c).'],key:'The B-excircle and its two contact segments are emphasized.'},
  {title:'Repeat at C',text:'The C-excircle similarly has contact F inside AB with AF = s − b and FB = s − a.',facts:['AF/FB = (s − b)/(s − a).'],key:'The C-excircle and its two contact segments are emphasized.'},
  {title:'Positive ratios',text:'The strict triangle inequalities give s − a > 0, s − b > 0, and s − c > 0, so every contact ratio is positive.',facts:['For example, 2(s − a) = b + c − a > 0.','Thus D, E, F are interior side points as required by ordinary Ceva.'],key:'Each side is split into two positive lengths.'},
  {title:'The product cancels',text:'Multiplying the three contact ratios gives (BD/DC)(CE/EA)(AF/FB) = 1.',facts:['[(s − c)/(s − b)] × [(s − a)/(s − c)] × [(s − b)/(s − a)] = 1.'],key:'All three side splits participate in the cyclic cancellation.'},
  {title:'Ceva gives concurrence',text:'The converse of Ceva therefore makes AD, BE, and CF concurrent at a point Na.',facts:['Only interior side points and positive segment ratios are used.'],key:'The three cevians and their common point appear together.'},
  {title:'The Nagel point',text:'The first two interior cevians intersect once inside ABC, so their common point Na is unique and is called the Nagel point.',facts:['The third cevian passes through that same interior point.','Na is different notation from the nine-point center N.'],key:'The shaded interior contains the uniquely determined point Na.'}
 ]
};
})();
