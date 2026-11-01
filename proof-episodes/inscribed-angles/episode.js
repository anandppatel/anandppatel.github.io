(() => {
'use strict';
const part=name=>({'data-part':name});
const Q=()=>window.CircleGeometry;
const circle=(d,g)=>d.circle(g.O,g.R,d.colors.muted,1.7,part('circumcircle'));
function intercepted(d,g,color=d.colors.gold,width=4){
 d.arc(g.O,g.R,g.arcStart,g.arcStart+g.arcSweep,color,width,part('intercepted-arc-CA'));
}
function center(d,g){d.point(g.O,'O',d.colors.gold,{dx:10,dy:17,...part('center-O')});}
function diameter(d,g){
 d.segment(g.B,g.E,d.colors.purple,2.5,part('diameter-BE'));
 d.point(g.E,'E',d.colors.purple,{dx:11,dy:19,...part('antipode-E')});
}
function radii(d,g){
 for(const [x,label,color]of [[g.A,'A',d.colors.blue],[g.B,'B',d.colors.purple],[g.C,'C',d.colors.teal]]){
  d.segment(g.O,x,color,2.5,part('radius-O'+label));d.tick(g.O,x,color);
 }
}
function component(d,g,X,label,color,M){
 d.poly([g.B,g.O,X],color,.10,part('isosceles-BO'+label));
 d.segment(g.O,X,color,3,part('component-radius-'+label));
 d.segment(g.B,X,color,3,part('component-chord-'+label));
 if(M.dist(X,g.E)>1e-8*g.R){
  d.angle(X,g.B,g.E,color,{radius:label==='A'?27:39,label:label==='A'?'α':'β',...part('component-angle-'+label)});
  const start=Q().angle(g.E,g.O),delta=Math.atan2(M.cross(M.sub(g.E,g.O),M.sub(X,g.O)),M.dot(M.sub(g.E,g.O),M.sub(X,g.O)));
  d.arc(g.O,g.R,start,start+delta,color,3,part('component-arc-E'+label));
 }
}
const setAngles=(a,c)=>(v,p,M)=>{
 const point=t=>({x:Math.cos(t*Math.PI/180),y:Math.sin(t*Math.PI/180)});
 v.splice(0,3,point(a),point(0),point(c));
 p.circle={o:{x:0,y:0},r:1,last:v.map(q=>({...q}))};
};
function keepOnCircle(v,p,M){
 if(!p.circle)return v;
 const c=p.circle,next=v.map((q,i)=>M.dist(q,c.o)<1e-10*c.r?(c.last?.[i]||Q().polar(c.o,c.r,2*Math.PI*i/3)):M.onCircle(q,c.o,c.r));
 c.last=next.map(q=>({...q}));return next;
}
window.ProofEpisode={
 slug:'inscribed-angles',number:'16',title:'The inscribed-angle theorem',
 subtitle:'An angle at the circle measures half its intercepted arc.',
 observation:'For three distinct points A, B, C on a circle, angle ABC is half the measure of the arc AC that does not contain B. Consequently, angles subtending the same chord from the same side are equal.',
 prediction:'Fix A and C, and move B around their circle. Which arc does angle ABC see?',
 after:'If two vertices lie on opposite sides of chord AC, how do their intercepted arcs add? What does this say about their angles?',
 initial:[{x:.5,y:.866025403784},{x:1,y:0},{x:.5,y:-.866025403784}],
 prerequisites:[
  {label:'02 · The circumcenter',href:'../circumcenter/'},
  {label:'T1 · Isosceles triangles',href:'../basics/#t1'},
  {label:'T2 · Angle sum and exterior angles',href:'../basics/#t2'},
  {label:'C5 · Straight angles',href:'../basics/#c5'}
 ],
 notes:[
  {title:'Which arc?',body:'The intercepted arc joins A to C and does not contain B. Its degree measure is the turn at O along that arc; it may exceed 180°. A smaller central angle alone would give the wrong answer when angle ABC is obtuse.'},
  {title:'One diameter covers every case',body:'E is the point opposite B on the circle. If E lies inside the intercepted arc, add the two component angles and arcs. If E lies outside it, subtract the smaller from the larger. If E is an endpoint, one component is zero and no degenerate triangle argument is needed.'},
  {title:'Moving points and measuring angles',body:'After constructing the circle, A, B, and C move along that fixed circle. Holding A and C still lets you explore how the angle changes as B crosses from one arc to the other. Undoing the circle construction restores free vertices. The three case buttons produce a sum case, a difference case, and a diameter endpoint case. Decimal measurements illustrate the result; the proof uses exact equal radii.'}
 ],
 actions:[
  {label:'Sum case',run:setAngles(60,300)},
  {label:'Difference case',run:setAngles(40,140)},
  {label:'Diameter endpoint',run:setAngles(180,270)}
 ],
 constrain(v,p,active,s,M){return active?keepOnCircle(v,p,M):v;},
 compute(g,p,M){
  const arc=Q().cyclic(g,.5,M),E=M.sub(M.mul(g.O,2),g.B);
  const progress=Q().positive(Math.sign(arc.sweep)*(Q().angle(E,g.O)-arc.start));
  return {E,arcStart:arc.start,arcSweep:arc.sweep,arcDegrees:Math.abs(arc.sweep)*180/Math.PI,
   angleB:M.angle(g.A,g.B,g.C),alpha:M.angle(g.A,g.B,E),beta:M.angle(g.C,g.B,E),
   sumCase:progress<Math.abs(arc.sweep),endpoint:M.dist(E,g.A)<1e-8*g.R||M.dist(E,g.C)<1e-8*g.R};
 },
 construction:{
  steps:[
   {label:'Draw the circumcircle',text:'Construct the circle through A, B, C and its center O. From this step onward, the three vertices move along this fixed circle.',enter(v,p,M){const g=M.triangle(v);p.circle={o:{...g.O},r:g.R,last:v.map(q=>({...q}))};}},
   {label:'Mark the intercepted arc',text:'Highlight the arc from C to A that avoids B, and the angle ABC.'},
   {label:'Add the diameter through B',text:'Extend BO to the opposite point E on the circle.'},
   {label:'Join the radii OA and OC',text:'Join O to A and C to reveal the two isosceles triangles used in the proof.'}
  ],
  constrain(v,p,l,M){return l?keepOnCircle(v,p,M):v;},
  handleIds:()=>[],
  draw(d,g,l,p,M){
   if(!l)return;circle(d,g);center(d,g);
   if(l>=2){intercepted(d,g);d.angle(g.A,g.B,g.C,d.colors.gold,{radius:30,...part('inscribed-angle-B')});}
   if(l>=3)diameter(d,g);
   if(l>=4)radii(d,g);
  },
  extent(g,p,l){return l?[...g.vertices,...Q().bounds(g.O,g.R)]:[...g.vertices];},
  status(g){return `Angle ABC ≈ ${g.angleB.toFixed(1)}°; intercepted arc AC ≈ ${g.arcDegrees.toFixed(1)}°. Vertices stay on the fixed circle; slide B along an arc or compare the three cases.`;}
 },
 extent(g){return [...g.vertices,...Q().bounds(g.O,g.R)];},
 status(g){return `Vertices stay on the constructed circle. Angle ABC ≈ ${g.angleB.toFixed(1)}°; intercepted arc ≈ ${g.arcDegrees.toFixed(1)}°. ${g.endpoint?'A diameter endpoint is close at drawing precision.':g.sumCase?'E lies on the highlighted arc: add the components.':'E lies outside the highlighted arc: subtract the components.'}`;},
 draw(d,g,s,p,M){
  circle(d,g);center(d,g);
  if(s===0||s>=4){intercepted(d,g);d.angle(g.A,g.B,g.C,d.colors.gold,{radius:24,...part('inscribed-angle-B')});}
  if(s>=1){diameter(d,g);radii(d,g);}
  if(s===2||s===3||s===4||s===5){component(d,g,g.A,'A',d.colors.blue,M);component(d,g,g.C,'C',d.colors.teal,M);}
  if(s>=6){intercepted(d,g,d.colors.gold,5);d.label(M.mid(g.A,g.C),'chord AC',d.colors.ink,{dy:20,...part('chord-label')});}
 },
 steps:[
  {title:'Name the arc that the angle sees',text:'Let A, B, C be distinct points of a circle with center O. Write θ for angle ABC and m for the measure of the arc AC that does not contain B.',facts:['0° < θ < 180°','0° < m < 360°'],key:'The gold angle at B sees the gold arc opposite it.'},
  {title:'Draw a diameter through the vertex',text:'Let E be the point opposite B on the circle. The points B, O, E are collinear, with O between B and E. Join O to A and C.',facts:['OB = OA = OC = OE'],key:'The purple diameter gives the same reference ray for both component angles.'},
  {title:'A chord and the diameter',text:'Take X to be either A or C, with X different from E. Triangle BOX is isosceles, so its base angles OBX and BXO are equal. Since BE is the ray BO, denote either angle by αX.',facts:['∠OBX = ∠BXO = αX','∠XBE = αX'],key:'The two shaded triangles use equal radii; the component angles at B are α and β.'},
  {title:'The exterior angle doubles',text:'The angle XOE is an exterior angle of triangle BOX, because OE extends OB. It therefore equals 2αX. This is the measure of the arc XE not containing B. If X = E, that arc and angle XBE are both zero, so the same identity holds directly.',facts:['measure of arc XE avoiding B = 2∠XBE'],key:'Each colored component arc is twice its corresponding angle at B; zero components require no triangle.'},
  {title:'Add when the diameter is inside',text:'If E lies on the intercepted arc AC, the ray BE lies inside angle ABC. Add the two component angles at B and the two adjacent arcs to obtain m = 2θ. The same argument permits a zero component when E is A or C.',facts:['θ = ∠ABE + ∠EBC','m = 2∠ABE + 2∠EBC = 2θ'],key:'In the sum case, the blue and teal pieces form the whole intercepted arc and angle.',guard:g=>g.sumCase||g.endpoint?'':'Choose “Sum case” above, or move B until E lies on the highlighted arc, to inspect this branch before continuing.'},
  {title:'Subtract when the diameter is outside',text:'If E lies outside the intercepted arc AC, the smaller of arcs AE and CE is contained in the larger, and BE lies outside angle ABC. Subtract their measures and the corresponding angles at B. Again m = 2θ.',facts:['θ = |∠ABE − ∠CBE|','m = |2∠ABE − 2∠CBE| = 2θ'],key:'In the difference case, remove the overlapping component arc and angle.',guard:g=>!g.sumCase&&!g.endpoint?'':'Choose “Difference case” above, or move B until E lies outside the highlighted arc, to inspect this branch before continuing.'},
  {title:'The inscribed-angle theorem',text:'The sum, difference, and endpoint cases exhaust the possible positions of E. Thus every inscribed angle is half the measure of the arc it intercepts, even when that arc is larger than a semicircle.',facts:['∠ABC = ½ measure of arc AC avoiding B'],key:'The highlighted arc is the intercepted arc, rather than an automatically chosen smaller arc.'},
  {title:'Angles on the same chord',text:'Two vertices on the same side of chord AC lie on the same arc from A to C. Their inscribed angles therefore intercept the other, identical arc. Both angles are half its measure, so they are equal.',facts:['Same chord and same side ⇒ equal inscribed angles'],key:'Chord AC determines which of the two arcs the vertices occupy.'}
 ]
};
})();
