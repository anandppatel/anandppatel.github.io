(() => {
'use strict';
const part=name=>({'data-part':name});
const bounds=(o,r)=>[{x:o.x-r,y:o.y-r},{x:o.x+r,y:o.y+r}];
function circle(d,g){d.circle(g.O,g.R,d.colors.muted,1.8,part('circumcircle'));d.point(g.O,'O',d.colors.gold,{dx:10,dy:-14});}
function markedP(d,g){d.point(g.P,'P',d.colors.purple,{dx:12,dy:18,...part('free-P')});}
function secant(d,g){
 d.line(g.X,g.Y,d.colors.blue,1.8,part('secant-line'));
 d.segment(g.X,g.Y,d.colors.blue,3,part('chord-XY'));
 const label=q=>Math.hypot(q.x-g.P.x,q.y-g.P.y)<=g.R*1e-9?' ≈ P':'';
 d.point(g.X,'X'+label(g.X),d.colors.blue,{dx:12,dy:-15});d.point(g.Y,'Y'+label(g.Y),d.colors.teal,{dx:12,dy:18});
}
function perpendicular(d,g,M){
 d.segment(g.O,g.F,d.colors.gold,2.7,part('perpendicular-OF'));
 if(M.dist(g.O,g.F)>g.R*1e-9)d.right(g.F,g.O,M.add(g.F,g.direction),d.colors.gold);
 d.point(g.F,M.dist(g.F,g.O)<=g.R*1e-9?'F ≈ O':M.dist(g.F,g.P)<=g.R*1e-9?'F ≈ P':'F',d.colors.gold,{dx:-17,dy:22});
}
function second(d,g){
 d.line(g.W,g.Z,d.colors.purple,1.5,{'stroke-dasharray':'5 4',...part('second-secant')});
 d.point(g.W,'W',d.colors.purple,{dx:-16,dy:-12});d.point(g.Z,'Z',d.colors.purple,{dx:12,dy:17});
}
function tangent(d,g){
 if(!g.T)return;
 d.segment(g.P,g.T,d.colors.teal,3,part('tangent-PT'));d.segment(g.O,g.T,d.colors.gold,2.6,part('tangent-radius-OT'));
 d.point(g.T,'T',d.colors.teal,{dx:10,dy:-15});d.right(g.T,g.O,g.P,d.colors.teal);
}
const tangentGuard=g=>g.T?'':'This part assumes P is outside the circle. Drag P farther outside, or choose “P outside”, to continue the tangent argument.';
const construction={
 steps:[
  {label:'Draw the circumcircle',text:'Construct the circle through A, B, and C, with center O and radius R.'},
  {label:'Choose a point P',text:'Choose P freely in the plane. It may be inside, outside, or on the circle; drag it to explore.'},
  {label:'Draw a secant and its midpoint',text:'Draw a secant through P, meeting the circle at X and Y. Drop OF perpendicular to the secant. The angle control rotates the line while keeping it a proper secant.'},
  {label:'Compare a second line',text:'Add a second secant through P. When P is exterior, also draw the tangent PT and its radius OT.'}
 ],
 handleIds:l=>l>=2?['P']:[],
 draw(d,g,l,p,M){
  if(!l)return;circle(d,g);
  if(l>=2)markedP(d,g);
  if(l>=3){secant(d,g);perpendicular(d,g,M);}
  if(l>=4){second(d,g);tangent(d,g);}
 },
 extent(g,p,l){return l?[...g.vertices,...bounds(g.O,g.R),...(l>=2?[g.P]:[])]:[...g.vertices];},
 status(g){return 'Drag P freely; rotate the secant with the control. '+(g.regime==='near'?'P is near the circle at drawing precision.':g.regime==='inside'?'P is inside the circle.':'P is outside the circle.');}
};
window.ProofEpisode={
 slug:'power-of-a-point',number:'18',title:'Power of a point',
 subtitle:'Changing the secant leaves a product unchanged.',
 observation:'For a circle of center O and radius R, the signed product along any secant through P is OP² − R². For exterior P this is also the squared tangent length PT²; ordinary intersecting-chord products inside the circle equal R² − OP².',
 prediction:'Fix P and rotate a secant. Its two intersection distances change; what stays constant?',
 after:'Why are the ordinary chord products positive inside the circle even though the signed power is negative?',
 initial:[{x:-.65,y:-.55},{x:.65,y:-.55},{x:.45,y:.65}],params:{px:1.45,py:.12,tilt:.35},
 controls:[{id:'tilt',label:'Secant direction',min:-.95,max:.95,step:.01,value:.35,description:'Rotate a proper secant through P. For exterior P, its direction stays inside the two tangent directions.'}],
 actions:[
  {label:'P outside',run:(v,p)=>{p.px=1.45;p.py=.12;}},
  {label:'P inside',run:(v,p)=>{p.px=.45;p.py=.15;}},
  {label:'P on the circle',run:(v,p)=>{p.px=1;p.py=0;}},
  {label:'P at the center',run:(v,p)=>{p.px=0;p.py=0;}}
 ],
 prerequisites:[
  {label:'02 · The circumcircle',href:'../circumcenter/'},
  {label:'T1 · Right-triangle congruence',href:'../basics/#t1'},
  {label:'T6 · Pythagoras',href:'../basics/#t6'},
  {label:'O1 · Tangents and radii',href:'../basics/#o1'}
 ],
 notes:[
  {title:'Signed power and positive lengths',body:'The power is OP² − R², negative inside the circle, zero on it, and positive outside. If P lies between X and Y, the ordinary distances PX and PY are positive and their product is R² − OP². An exterior secant gives the positive product OP² − R². The signed product uses both endpoint coordinates on the same oriented line.'},
  {title:'The sign convention on a secant',body:'Orient the line from X toward Y and put its origin at F, the chord midpoint. Write X = −ℓ, Y = ℓ and P = q in this one-dimensional coordinate. The directed displacements from P are −ℓ − q and ℓ − q. Their product is q² − ℓ². Reversing the orientation reverses both displacements and leaves their product unchanged.'},
  {title:'A proper secant is required',body:'X and Y are distinct. For an exterior point the direction control stays strictly between the tangent directions, so the line always meets the circle twice. P itself is free. Tangency is treated separately with a perpendicular radius; we do not infer it by taking an unproved limiting case.'},
  {title:'Collapsed right triangles',body:'When the secant passes through O, its perpendicular foot F equals O and the chord is a diameter. When P = F, the length PF is zero. The squared-length identities still hold directly in these cases, so the proof does not require a nondegenerate right triangle at every step.'}
 ],
 compute(g,p,M){
  const px=Number.isFinite(p.px)?p.px:1.45,py=Number.isFinite(p.py)?p.py:.12;
  const pn={x:px,y:py},rho=M.norm(pn),radial=rho>1e-12?M.mul(pn,1/rho):{x:1,y:0};
  const limit=rho>1?Math.asin(1/rho):Math.PI/2,turn=M.clamp(p.tilt??.35,-.95,.95)*limit;
  const direction={x:radial.x*Math.cos(turn)-radial.y*Math.sin(turn),y:radial.x*Math.sin(turn)+radial.y*Math.cos(turn)};
  const qn=M.dot(pn,direction),fn=M.sub(pn,M.mul(direction,qn)),hn=M.norm(fn),ln=Math.sqrt(Math.max(0,1-hn*hn));
  const world=q=>M.add(g.O,M.mul(q,g.R)),P=world(pn),F=world(fn),X=world(M.sub(fn,M.mul(direction,ln))),Y=world(M.add(fn,M.mul(direction,ln)));
  const W=world(M.mul(radial,-1)),Z=world(radial),op=rho*g.R,power=(rho-1)*(rho+1)*g.R*g.R;
  const T=rho>1+1e-9?world(M.add(M.mul(radial,1/rho),M.mul(M.perp(radial),Math.sqrt(1-1/(rho*rho))))):null;
  const tX=(-qn-ln)*g.R,tY=(-qn+ln)*g.R;
  return {P,F,X,Y,W,Z,T,direction,op,power,q:qn*g.R,halfChord:ln*g.R,offset:hn*g.R,directedProduct:tX*tY,ordinaryProduct:Math.abs(tX*tY),secondProduct:Math.abs((rho-1)*(rho+1))*g.R*g.R,tangentSquared:T?M.dist(P,T)**2:null,regime:Math.abs(rho-1)<1e-8?'near':rho<1?'inside':'outside'};
 },
 handles(g,p,M){return [{id:'P',point:g.P,label:'Point P. Drag freely or use arrow keys inside and outside the circle.',move:q=>{p.px=(q.x-g.O.x)/g.R;p.py=(q.y-g.O.y)/g.R;}}];},
 construction,
 extent:g=>[...g.vertices,g.P,...bounds(g.O,g.R)],
 status(g){return 'Signed power ≈ '+g.power.toFixed(3)+'; ordinary PX × PY ≈ '+g.ordinaryProduct.toFixed(3)+'. '+(g.regime==='inside'?'Inside: the ordinary product is the negative of the power.':g.regime==='near'?'Near the circle: both values are approximately zero.':'Outside: the ordinary product equals the power.');},
 draw(d,g,s,p,M){
  const {blue,teal,purple,gold}=d.colors;circle(d,g);markedP(d,g);
  if(s<=6||s===9)secant(d,g);
  if(s>=1&&s<=4){perpendicular(d,g,M);d.segment(g.O,g.P,purple,2.5,part('distance-OP'));}
  if(s===2){d.segment(g.O,g.X,gold,2.8,part('radius-OX'));d.segment(g.O,g.Y,gold,2.8,part('radius-OY'));d.tick(g.O,g.X,gold);d.tick(g.O,g.Y,gold);d.tick(g.X,g.F,blue,2);d.tick(g.F,g.Y,blue,2);}
  if(s===3){d.segment(g.O,g.Y,gold,3,part('radius-R'));d.segment(g.P,g.F,purple,3,part('length-q'));d.segment(g.F,g.Y,blue,4,part('length-ell'));d.label(M.mid(g.F,g.Y),'ℓ',blue,{dy:20});d.label(M.mid(g.P,g.F),'q (signed)',purple,{dy:-13});}
  if(s===4||s===5){d.segment(g.P,g.X,blue,4,part('product-PX'));d.segment(g.P,g.Y,teal,4,part('product-PY'));}
  if(s===6){second(d,g);d.segment(g.P,g.X,blue,3);d.segment(g.P,g.Y,teal,3);}
  if(s>=7){tangent(d,g);d.segment(g.O,g.P,purple,3,part('hypotenuse-OP'));}
  if(s===9)second(d,g);
 },
 steps:[
  {title:'Define the power',text:'Let the circle have center O and radius R. For any point P, define its power to be OP² − R².',facts:['Pow(P) = OP² − R²'],key:'The point P can be inside, outside, or on the circle.'},
  {title:'Choose any proper secant',text:'Take a line through P meeting the circle at distinct points X and Y. Drop the perpendicular from O to the line, with foot F.',facts:['OX = OY = R','OF is perpendicular to line XY.'],key:'The blue secant and its perpendicular from the center are drawn.'},
  {title:'The foot bisects the chord',text:'If O differs from F, the right triangles OFX and OFY are congruent by hypotenuse-leg, so FX = FY. If O = F, the two lengths are already equal radii. Thus F is the midpoint of XY.',facts:['FX = FY = ℓ > 0'],key:'The equal radii and equal halves of the chord are marked.'},
  {title:'Compare two squared distances',text:'Orient the line from X toward Y and let q be the signed coordinate of P measured from F. Pythagoras gives OP² = q² + OF² and R² = ℓ² + OF², also when one perpendicular triangle collapses.',facts:['OP² = q² + OF²','R² = ℓ² + OF²','OP² − R² = q² − ℓ²'],key:'The same perpendicular OF occurs in both squared-length identities.'},
  {title:'Factor the signed product',text:'The directed displacements from P to X and Y are −ℓ − q and ℓ − q. Their product is q² − ℓ², and therefore equals the power.',facts:['(−ℓ − q)(ℓ − q) = q² − ℓ²','Directed PX · PY = OP² − R²'],key:'The two colored segments have their signs measured along the same oriented line.'},
  {title:'Read ordinary positive lengths',text:'For exterior P, the two directed displacements have the same sign. For interior P, they have opposite signs. If P is on the circle, one displacement is zero.',facts:['Outside: PX · PY = OP² − R²','Inside: PX · PY = R² − OP²','On the circle: PX · PY = 0'],key:'Use the P presets to compare the three positions; ordinary segment lengths are always nonnegative.'},
  {title:'Compare any two secants',text:'The expression OP² − R² does not depend on the chosen line. Hence any two secants through the same P have equal signed products, and also equal ordinary products.',facts:['PX · PY = PW · PZ for ordinary lengths on two secants through P.'],key:'The solid and dashed secants pass through the same point P.'},
  {title:'Now take an exterior tangent',text:'Suppose P is exterior and PT is tangent at T. The radius OT is perpendicular to PT, so triangle OTP is right.',facts:['OT ⟂ PT','OT = R'],key:'The tangent, its radius, and the right-angle mark are highlighted.',guard:tangentGuard},
  {title:'The tangent has the same power',text:'Pythagoras gives PT² = OP² − OT² = OP² − R². Thus the squared tangent length equals the ordinary product on every secant through exterior P.',facts:['PT² = OP² − R²','PT² = PX · PY'],key:'The tangent square and secant product are determined by the same distance OP.',guard:tangentGuard},
  {title:'One invariant, three familiar forms',text:'The intersecting-chord, two-secant, and tangent-secant identities all express this same power, with the interior sign handled separately.',facts:['Pow(P) = OP² − R²','Inside, ordinary chord products equal −Pow(P).','Outside, ordinary secant products and tangent squares equal Pow(P).'],key:'Changing the secant changes its two factors, but not their product.'}
 ]
};
})();
