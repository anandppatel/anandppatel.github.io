(() => {
'use strict';
const part=name=>({'data-part':name});
const bounds=(o,r)=>[{x:o.x-r,y:o.y-r},{x:o.x+r,y:o.y+r}];
function outline(d,g,M,labels=true){
 d.circle(g.O,g.R,d.colors.muted,1.7,part('circumcircle'));
 const points=[g.A,g.B,g.C,g.D],colors=[d.colors.blue,d.colors.blue,d.colors.teal,d.colors.teal];
 points.forEach((q,i)=>{const r=points[(i+1)%4];d.segment(q,r,colors[i],2.6,part('side-'+i));if(labels)d.label(M.mid(q,r),'abcd'[i],colors[i],{dx:8,dy:17,...part('length-'+i)});});
 d.point(g.D,'D',d.colors.purple,{dx:12,dy:18});
}
function feet(d,g,M,second=false){
 const u=M.unit(M.sub(g.C,g.B));
 d.line(g.B,g.C,d.colors.muted,1.1,{'stroke-dasharray':'5 5',...part('support-BC')});
 d.segment(g.A,g.F,d.colors.gold,2.6,part('height-AF'));
 d.right(g.F,g.A,M.add(g.F,u),d.colors.gold);
 d.point(g.F,M.dist(g.F,g.B)<g.scale*1e-9?'F ≈ B':M.dist(g.F,g.C)<g.scale*1e-9?'F ≈ C':'F',d.colors.gold,{dx:10,dy:20});
 if(second){
  const v=M.unit(M.sub(g.A,g.D));
  d.line(g.D,g.A,d.colors.muted,1.1,{'stroke-dasharray':'5 5',...part('support-DA')});
  d.segment(g.C,g.J,d.colors.teal,2.6,part('height-CJ'));
  d.right(g.J,g.C,M.add(g.J,v),d.colors.teal);
  d.point(g.J,'J',d.colors.teal,{dx:10,dy:-12});
 }
}
const guard=g=>g.metricValid?'':'Two quadrilateral vertices are too close at drawing precision. Move D or a triangle vertex to separate them.';
const construction={
 steps:[
  {label:'Draw the circumcircle',text:'Construct the circle through A, B, and C.'},
  {label:'Add the fourth vertex D',text:'Place D on the arc CA that does not contain B, giving a convex cyclic quadrilateral ABCD.'},
  {label:'Split along AC',text:'Draw the diagonal AC and shade its two triangles.'},
  {label:'Construct the perpendicular feet',text:'Drop AF perpendicular to the line BC and CJ perpendicular to the line DA. These feet may lie on extensions.'}
 ],
 handleIds:l=>l>=2?['D']:[],
 draw(d,g,l,p,M){
  if(!l)return;
  if(l===1)d.circle(g.O,g.R,d.colors.gold,2.3,part('construction-circle'));
  if(l>=2)outline(d,g,M);
  if(l>=3){d.poly([g.A,g.B,g.C],d.colors.blue,.12,part('area-ABC'));d.poly([g.A,g.C,g.D],d.colors.teal,.12,part('area-ACD'));d.segment(g.A,g.C,d.colors.gold,3,part('diagonal-AC'));}
  if(l>=4)feet(d,g,M,true);
 },
 extent(g,p,l){return l?[...g.vertices,...bounds(g.O,g.R),...(l>=2?[g.D]:[]),...(l>=4?[g.F,g.J]:[])]:[...g.vertices];},
 status:()=> 'D stays on the open arc CA opposite B. A, B, and C are free; the quadrilateral remains convex and cyclic.'
};
window.ProofEpisode={
 slug:'brahmagupta',number:'20',title:'Brahmagupta’s formula',
 subtitle:'The area of a cyclic quadrilateral from its four sides.',
 observation:'For a convex cyclic quadrilateral with consecutive side lengths a, b, c, d and semiperimeter s = (a + b + c + d)/2, the area K is √((s − a)(s − b)(s − c)(s − d)).',
 prediction:'Heron’s formula uses three side lengths. What changes when a fourth side closes on the same circle?',
 after:'Check the formula for a rectangle. Why can four side lengths alone fail to determine the area when the quadrilateral is not cyclic?',
 initial:[{x:-.75,y:-.45},{x:.7,y:-.55},{x:.6,y:.65}],params:{t:.5},
 prerequisites:[
  {label:'17 · Supplementary opposite angles',href:'../cyclic-quadrilaterals/'},
  {label:'C4 · Triangle area and additivity',href:'../basics/#c4'},
  {label:'T6 · Pythagoras',href:'../basics/#t6'},
  {label:'11 · Sine-area comparison',href:'../trig-ceva/'}
 ],
 notes:[
  {title:'The hypotheses matter',body:'A, B, C, D are four distinct vertices in boundary order on one circle, so ABCD is convex. The diagonal AC partitions its interior into triangles ABC and ADC. The result is not an area formula for an arbitrary quadrilateral with the same four side lengths.'},
  {title:'A local cosine-law lemma',body:'The proof does not assume the cosine law as an earlier theorem. Let x be the signed projection of BA along BC and h the perpendicular height from A. Then a² = x² + h² and AC² = (b − x)² + h²; subtracting gives AC² = a² + b² − 2bx. Since x = a cos θ, this proves the needed cosine law, including obtuse angles.'},
  {title:'Sine and cosine conventions',body:'For an angle θ between 0° and 180°, the sine is the nonnegative perpendicular component of its unit direction and the cosine is its signed parallel component. Pythagoras gives sin² θ + cos² θ = 1. Reflecting a direction gives sin(180° − θ) = sin θ and cos(180° − θ) = −cos θ. Thus the projection remains signed when a foot lies on an extension.'},
  {title:'Comparison with Heron',body:'Heron’s formula appears as the limiting expression when one side tends to zero. A quadrilateral with a zero side is outside the distinct-vertex hypotheses. The argument here uses neither Heron nor Ptolemy as an input.'},
  {title:'Two independent measurements',body:'The displayed polygon area is computed from oriented triangle areas, separately from the expression involving the four side lengths. Rounded agreement illustrates the formula; the proof establishes it.'}
 ],
 compute(g,p,M){
  const D=window.CircleGeometry.cyclic(g,p.t,M).D;
  const a=M.dist(g.A,g.B),b=M.dist(g.B,g.C),c=M.dist(g.C,D),d=M.dist(D,g.A),s=(a+b+c+d)/2;
  const F=M.foot(g.A,g.B,g.C),J=M.foot(g.C,D,g.A);
  const diagonal=M.dist(g.A,g.C),theta=M.angle(g.A,g.B,g.C),opposite=M.angle(g.A,D,g.C);
  const polygonArea=Math.abs(M.cross(M.sub(g.B,g.A),M.sub(g.C,g.A))+M.cross(M.sub(g.C,g.A),M.sub(D,g.A)))/2;
  const scale=Math.max(a,b,c,d),normalized=[a,b,c,d].map(x=>x/scale),half=normalized.reduce((sum,x)=>sum+x,0)/2;
  const product=normalized.reduce((total,x)=>total*(half-x),1);
  const formulaArea=scale*scale*Math.sqrt(Math.max(0,product));
  const x=M.dot(M.sub(g.A,g.B),M.unit(M.sub(g.C,g.B))),height=M.dist(g.A,F);
  return {D,F,J,a,b,c,d,s,diagonal,theta,opposite,polygonArea,formulaArea,x,height,metricValid:normalized.every(x=>x>1e-10)&&polygonArea>1e-11*scale*scale};
 },
 handles(g,p,M){return [{id:'D',point:g.D,label:'D on the circumcircle. Drag or use arrow keys along arc CA.',move:q=>{p.t=window.CircleGeometry.fraction(g,q,M);}}];},
 construction,
 extent(g,p,s){return [...g.vertices,g.D,...bounds(g.O,g.R),...(s>=2&&s<=7?[g.F,g.J]:[])];},
 status(g){return 'Polygon area ≈ '+g.polygonArea.toFixed(3)+'; side-length formula ≈ '+g.formulaArea.toFixed(3)+'. Opposite angles add to ≈ '+(g.theta+g.opposite).toFixed(1)+'°.';},
 draw(d,g,s,p,M){
  const {blue,teal,gold,purple}=d.colors;outline(d,g,M);
  if(s>=1){d.segment(g.A,g.C,gold,3,part('shared-diagonal'));d.poly([g.A,g.B,g.C],blue,.11,part('area-ABC'));d.poly([g.A,g.C,g.D],teal,.11,part('area-ADC'));}
  if(s===1||s===3||s===7||s===8){d.angle(g.A,g.B,g.C,blue,{radius:29,label:'θ'});d.angle(g.A,g.D,g.C,teal,{radius:30,label:'180° − θ'});}
  if(s===2||s===3)feet(d,g,M,true);
  if(s>=4&&s<=6){feet(d,g,M);d.segment(g.B,g.F,purple,4,part('signed-projection'));d.label(M.mid(g.B,g.F),'signed x',purple,{dx:8,dy:-13});d.segment(g.F,g.C,teal,3,part('remaining-projection'));d.label(M.mid(g.A,g.F),'h',gold,{dx:12,dy:2});}
  if(s===5){d.poly([g.A,g.B,g.F],blue,.15,part('right-ABF'));d.poly([g.A,g.C,g.F],teal,.12,part('right-ACF'));}
  if(s>=9){d.poly([g.A,g.B,g.C,g.D],gold,.1,part('whole-quadrilateral'));if(s>=11)d.label(M.lerp(g.A,g.C,.5),'K',gold,{dx:12,dy:-13});}
 },
 steps:[
  {title:'Name the sides',text:'Let ABCD be convex and cyclic, with consecutive side lengths a = AB, b = BC, c = CD, d = DA, semiperimeter s, and area K.',facts:['2s = a + b + c + d'],key:'The four side labels follow the boundary order.',guard},
  {title:'Use cyclicity',text:'Write θ = angle ABC. Opposite angles of a cyclic quadrilateral are supplementary, so angle ADC = 180° − θ. The diagonal AC partitions the quadrilateral into two triangles.',facts:['∠ADC = 180° − θ','K = [ABC] + [ADC]'],key:'Blue and teal triangles lie on opposite sides of the shared diagonal.',guard},
  {title:'Express each triangle area',text:'The perpendicular height from A to line BC is a sin θ, so [ABC] = ab sin θ/2. The same height argument at D gives [ADC] = cd sin(180° − θ)/2.',facts:['2[ABC] = ab sin θ','2[ADC] = cd sin(180° − θ)'],key:'The two perpendicular heights justify the area formulas, even when a foot lies on a side extension.',guard},
  {title:'Add the areas',text:'Supplementary angles have the same sine. Adding the two triangle areas therefore gives one equation for K.',facts:['2K = (ab + cd) sin θ'],key:'Both colored areas contribute to the same sine factor.',guard},
  {title:'Prove the needed cosine law',text:'Let F be the perpendicular projection of A onto line BC. Measure x = BF with sign in the direction from B to C, and let h = AF. Thus x = a cos θ, including when θ is obtuse.',facts:['x = a cos θ','h = a sin θ'],key:'The purple projection is signed; F is allowed to lie beyond B or C.',guard},
  {title:'Two applications of Pythagoras',text:'Pythagoras in the two perpendicular decompositions gives a² = x² + h² and AC² = (b − x)² + h². These squared-length identities also hold when F equals B or C.',facts:['a² = x² + h²','AC² = (b − x)² + h²'],key:'The two right-triangle decompositions have the same height h.',guard},
  {title:'Subtract to remove the height',text:'Subtract the first equality from the second and use x = a cos θ. This proves the cosine law required here rather than assuming it.',facts:['AC² = a² + b² − 2ab cos θ'],key:'The common diagonal is expressed using the two sides at B.',guard},
  {title:'Measure the diagonal from D',text:'Apply the same cosine-law lemma to triangle ADC. Since cos(180° − θ) = −cos θ, the sign of its cosine term is reversed.',facts:['AC² = c² + d² + 2cd cos θ'],key:'The teal triangle expresses the very same diagonal using the sides at D.',guard},
  {title:'Equate the diagonal formulas',text:'Equating the two expressions for AC² and collecting the cosine terms gives a second equation.',facts:['2(ab + cd) cos θ = a² + b² − c² − d²'],key:'The shared diagonal disappears from the algebra.',guard},
  {title:'Eliminate the angle',text:'Square the area equation, use sin² θ = 1 − cos² θ, and substitute the last equality.',facts:['16K² = 4(ab + cd)² − (a² + b² − c² − d²)²'],key:'The area now depends only on the four side lengths.',guard},
  {title:'Factor the difference of squares',text:'Factor first as a difference of squares, then regroup the two factors into differences of squared sums and differences.',facts:['16K² = ((c + d)² − (a − b)²)((a + b)² − (c − d)²)'],key:'The same four sides now enter two elementary factorizations.',guard},
  {title:'Recognize the semiperimeter factors',text:'Factoring once more gives the four factors −a + b + c + d, a − b + c + d, a + b − c + d, and a + b + c − d. They equal 2(s − a), 2(s − b), 2(s − c), and 2(s − d).',facts:['16K² = 16(s − a)(s − b)(s − c)(s − d)'],key:'Each factor omits one side from the semiperimeter.',guard},
  {title:'Brahmagupta’s formula',text:'Every side is shorter than the other three combined, so the four semiperimeter factors are positive. Divide by 16 and take the positive square root, since K is an area.',facts:['K = √((s − a)(s − b)(s − c)(s − d))'],key:'The complete cyclic quadrilateral has the area given by its four side lengths.',guard}
 ]
};
})();
