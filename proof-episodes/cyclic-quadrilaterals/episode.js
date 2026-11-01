(() => {
'use strict';
const Q=()=>window.CircleGeometry;
const part=name=>({'data-part':name});
function base(d,g,showD=true){
 d.circle(g.O,g.R,d.colors.muted,1.7,part('circumcircle-ABC'));
 if(showD){
  d.poly([g.A,g.B,g.C,g.D],d.colors.blue,.035,part('quadrilateral-ABCD'));
  d.segment(g.A,g.D,d.colors.blue,2.3,part('side-AD'));
  d.segment(g.C,g.D,d.colors.blue,2.3,part('side-CD'));
  d.point(g.D,'D',d.colors.blue,{dx:13,dy:18,...part('candidate-D')});
 }
}
function angles(d,g,atPrime=false){
 d.angle(g.A,g.B,g.C,d.colors.gold,{radius:28,label:'α',...part('angle-ABC')});
 d.angle(g.A,atPrime?g.Dprime:g.D,g.C,d.colors.teal,{radius:25,label:atPrime?'δ′':'δ',...part(atPrime?'angle-ADprimeC':'angle-ADC')});
}
function ray(d,g,prime=true){
 d.line(g.B,g.Dprime,d.colors.purple,1.7,{'stroke-dasharray':'5 5',...part('ray-support-BD')});
 d.point(g.X,'X',d.colors.purple,{dx:11,dy:19,...part('crossing-X')});
 if(prime){
  const merge=Math.hypot(g.D.x-g.Dprime.x,g.D.y-g.Dprime.y)<1e-8*g.scale;
  d.point(g.Dprime,merge?'D′ ≈ D':'D′',d.colors.purple,{dx:-58,dy:-12,...part('circle-point-Dprime')});
 }
}
function compare(d,g,M){
 d.poly([g.A,g.D,g.Dprime],d.colors.blue,.11,part('comparison-ADDprime'));
 d.poly([g.C,g.D,g.Dprime],d.colors.teal,.11,part('comparison-CDDprime'));
 d.segment(g.A,g.Dprime,d.colors.purple,2.3,part('comparison-ADprime'));
 d.segment(g.C,g.Dprime,d.colors.purple,2.3,part('comparison-CDprime'));
 d.angle(g.A,g.D,g.B,d.colors.blue,{radius:27,...part('angle-ADB')});
 d.angle(g.B,g.D,g.C,d.colors.teal,{radius:36,...part('angle-BDC')});
 d.angle(g.A,g.Dprime,g.B,d.colors.blue,{radius:25,...part('angle-ADprimeB')});
 d.angle(g.B,g.Dprime,g.C,d.colors.teal,{radius:34,...part('angle-BDprimeC')});
}
window.ProofEpisode={
 slug:'cyclic-quadrilaterals',number:'17',title:'Cyclic quadrilaterals',
 subtitle:'Opposite angles recognize a fourth point on a circle.',
 observation:'A convex quadrilateral ABCD is cyclic if and only if ∠ABC + ∠ADC = 180°. The other pair of opposite angles is then supplementary as well.',
 prediction:'The first three vertices determine a circle. What condition forces the fourth vertex D onto it?',
 after:'Why is convexity needed in this statement? Which steps would fail for a crossed quadrilateral?',
 initial:[{x:-.75,y:-.55},{x:.72,y:-.45},{x:.82,y:.65}],
 params:{t:.52,depth:1},
 controls:[{id:'depth',label:'D beyond diagonal AC',min:.08,max:2,step:.01,value:1,description:'1 places D on the circle; smaller values put it inside, larger values outside. D always stays beyond AC.'}],
 prerequisites:[
  {label:'16 · Inscribed angles',href:'../inscribed-angles/'},
  {label:'02 · A circle through three points',href:'../circumcenter/'},
  {label:'T2 · Exterior angles and angle sum',href:'../basics/#t2'}
 ],
 notes:[
  {title:'Four distinct vertices in boundary order',body:'The theorem concerns a convex quadrilateral. Here D moves on a ray from B that crosses the interior of AC, and stays beyond that crossing. Drag the purple circle point D′ along the arc CA that avoids B to change the ray. These constraints preserve the order A, B, C, D and exclude a collapsed or crossed quadrilateral.'},
  {title:'The converse does not assume its conclusion',body:'For the converse, start with a convex quadrilateral whose opposite angles are supplementary and draw only the circle through A, B, C. Its second intersection with ray BD is named D′. The two hypothetical positions D inside and D outside the circle lead to strict angle inequalities. Only after ruling them out do we identify D with D′.'},
  {title:'The second intersection exists',body:'The diagonals of a convex quadrilateral cross at an interior point X of AC. Since X is strictly inside the disk through A and C, the ray from B through X enters the disk and leaves it at a unique second circle point D′ beyond X. The interior of a chord lies inside the disk: dropping a perpendicular from the center to the chord and applying Pythagoras proves this directly.'},
  {title:'Converse diagrams are hypothetical cases',body:'The forward proof holds D on the circle. The converse shows an inside-circle test position and an outside-circle test position; their measured opposite angles do not add to 180°, which is the contradiction being proved. The given supplementary-angle condition is never inferred from a rounded measurement. Labels joined by ≈ indicate drawing proximity only.'}
 ],
 actions:[
  {label:'D on the circle',hideInProof:true,run(v,p){p.depth=1;}},
  {label:'D inside the circle',hideInProof:true,run(v,p){p.depth=.5;}},
  {label:'D outside the circle',hideInProof:true,run(v,p){p.depth=1.5;}}
 ],
 constrain(v,p,active,s){
  p._proofStage=active?s:-1;
  p._fixedDepth=active?(s<=3||s===9?1:s===6||s===7?.5:s===8?1.5:null):null;
  return v;
 },
 compute(g,p,M){
  const arc=Q().cyclic(g,p.t,M),Dprime=arc.D;
  const X=M.intersect(g.B,Dprime,g.A,g.C),cross=M.parameter(X,g.B,Dprime);
  const depth=p._fixedDepth??p.depth;
  const k=cross+(1-cross)*M.clamp(depth,.08,2.5),D=M.lerp(g.B,Dprime,k);
  return {D,Dprime,X,arcStart:arc.start,arcSweep:arc.sweep,cross,depth,
   alpha:M.angle(g.A,g.B,g.C),delta:M.angle(g.A,D,g.C),deltaPrime:M.angle(g.A,Dprime,g.C),
   angleSum:M.angle(g.A,g.B,g.C)+M.angle(g.A,D,g.C)};
 },
 handles(g,p,M){
  if(p._proofStage>=0&&(p._proofStage<=3||p._proofStage===9))return [{id:'D',point:g.D,label:'Cyclic vertex D. Drag along arc CA without crossing A or C.',move(q){p.t=Q().fraction(g,q,M);}}];
  const handles=p._proofStage===4?[]:[{id:'D′',point:g.Dprime,label:'Circle point D prime. Drag along arc CA to change the ray from B.',move(q){p.t=Q().fraction(g,q,M);}}];
  if(p._fixedDepth===null||p._fixedDepth===undefined)handles.push({id:'D',point:g.D,label:'Candidate D. Drag along the ray beyond AC; inside and outside the circle are permitted.',move(q){const k=M.parameter(q,g.B,g.Dprime);p.depth=M.clamp((k-g.cross)/(1-g.cross),.08,2.5);}});
  return handles;
 },
 construction:{
  steps:[
   {label:'Draw the circle through ABC',text:'The first three vertices determine a unique circumcircle.'},
   {label:'Add the fourth vertex D',text:'Choose D beyond AC so that A, B, C, D form a convex quadrilateral. D need not lie on the circle.'},
   {label:'Draw the diagonal ray BD',text:'Draw the line through B and D, and mark its crossing X with AC.'},
   {label:'Mark the second circle point',text:'Mark D′ where ray BD leaves the circle. Move D′ along its arc to change the ray, and move D along the ray to test cyclicity.'}
  ],
  handleIds:l=>l>=4?['D','D′']:l>=2?['D']:[],
  draw(d,g,l,p,M){
   if(!l)return;base(d,g,l>=2);
   if(l>=2)angles(d,g);
   if(l>=3)ray(d,g,l>=4);
  },
  extent(g,p,l){return l?[...g.vertices,...Q().bounds(g.O,g.R),...(l>=2?[g.D]:[])]:[...g.vertices];},
  status:g=>`Opposite-angle sum ≈ ${g.angleSum.toFixed(1)}°. D stays beyond AC; use the slider or drag it along the ray to compare inside, on-circle, and outside positions.`
 },
 extent(g){return [...g.vertices,g.D,g.Dprime,...Q().bounds(g.O,g.R)];},
 status(g,p,active,s){
  const mode=!active?'Explore D freely along its ray.':s<=3?'Forward direction: D stays on the circle.':s===6||s===7?'Converse test: D is inside the circle.':s===8?'Converse test: D is outside the circle.':s===9?'The contradiction has identified D with D′.':'Converse: the angle condition is a hypothesis; test positions need not satisfy it.';
  return `${mode} Opposite-angle sum ≈ ${g.angleSum.toFixed(1)}°.`;
 },
 draw(d,g,s,p,M){
  base(d,g);angles(d,g);
  if(s===1||s===2){
   d.arc(g.O,g.R,g.arcStart,g.arcStart+g.arcSweep,d.colors.gold,4,part('arc-ADC'));
   d.arc(g.O,g.R,g.arcStart+g.arcSweep,g.arcStart+Math.sign(g.arcSweep)*2*Math.PI,d.colors.teal,4,part('arc-ABC'));
  }
  if(s>=5)ray(d,g);
  if(s>=5&&s<=8){d.segment(g.A,g.Dprime,d.colors.purple,2,part('side-ADprime'));d.segment(g.C,g.Dprime,d.colors.purple,2,part('side-CDprime'));}
  if(s===5)angles(d,g,true);
  if(s===6||s===7||s===8)compare(d,g,M);
  if(s===9)d.poly([g.A,g.B,g.C,g.D],d.colors.gold,.07,part('conclusion-cyclic-quadrilateral'));
 },
 steps:[
  {title:'Start with a cyclic quadrilateral',text:'Suppose A, B, C, D lie on a circle in that boundary order, forming a convex quadrilateral. Write α = ∠ABC and δ = ∠ADC.',facts:['Four distinct vertices in cyclic order'],key:'The forward proof constrains D to the circle.'},
  {title:'Identify the two intercepted arcs',text:'Angle ABC intercepts the arc AC through D, while angle ADC intercepts the other arc AC, through B. These two arcs together make the whole circle.',facts:['measure of arc ADC + measure of arc ABC = 360°'],key:'The gold and teal arcs partition the circumference.'},
  {title:'Halve the full turn',text:'The inscribed-angle theorem makes α and δ half the measures of their respective arcs. Adding gives α + δ = 180°.',facts:['α + δ = ½ · 360° = 180°'],key:'Each opposite angle corresponds to one of the two complementary arcs.'},
  {title:'The other opposite angles',text:'Apply the same argument to chord BD. The angles at A and C are supplementary as well.',facts:['∠DAB + ∠BCD = 180°'],key:'Both pairs of opposite angles satisfy the same rule.'},
  {title:'Assume the angle condition instead',text:'For the converse, let ABCD be convex and assume ∠ABC + ∠ADC = 180°. Draw the circle through A, B, C. We must prove that D lies on it.',facts:['The circle is defined by A, B, C only.','Cyclicity of ABCD has not been assumed.'],key:'D is a candidate fourth point; the circle remains the circle through the first three vertices.'},
  {title:'Construct the circle point on the same ray',text:'Let X = AC ∩ BD. Convexity puts X inside both diagonals, and the interior of chord AC lies inside the disk. Thus ray BX leaves the circle at a second point D′ beyond X. The forward direction applied to ABCD′ gives ∠AD′C = 180° − ∠ABC = ∠ADC.',facts:['B, X, D and B, X, D′ have these orders.','∠AD′C = ∠ADC under the given hypothesis.'],key:'The circle point D′ lies on the same ray as D, and its angle must equal the given angle.'},
  {title:'Test the nearer candidate',text:'Suppose D lies between X and D′. In triangle ADD′, angle ADB is an exterior angle, so it is larger than angle AD′B. In triangle CDD′, angle BDC is similarly larger than angle BD′C.',facts:['∠ADB > ∠AD′B','∠BDC > ∠BD′C'],key:'The two comparison triangles give two strict exterior-angle inequalities.'},
  {title:'Add the inequalities',text:'The ray DB lies inside angle ADC, and the ray D′B lies inside angle AD′C. Adding the inequalities therefore gives ∠ADC > ∠AD′C, contradicting the equality forced by the hypothesis.',facts:['∠ADC > ∠AD′C contradicts ∠ADC = ∠AD′C.'],key:'The nearer point sees the chord AC under a strictly larger angle.'},
  {title:'Test the farther candidate',text:'If D lies beyond D′, interchange D and D′ in the same two exterior-angle arguments. They give ∠ADC < ∠AD′C, again contradicting the required equality.',facts:['∠ADC < ∠AD′C is also impossible.'],key:'The outside-circle test position sees a strictly smaller angle.'},
  {title:'Identify the fourth vertex',text:'Both distinct positions on the ray are impossible, so D = D′. Therefore D lies on the circle through A, B, C, and ABCD is cyclic. This proves the converse.',facts:['ABCD cyclic ⇔ ∠ABC + ∠ADC = 180°'],key:'Only now does the proof identify the candidate with the second circle point.'}
 ]
};
})();
