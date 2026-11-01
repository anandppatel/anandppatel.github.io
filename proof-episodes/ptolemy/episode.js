(() => {
'use strict';
const part=name=>({'data-part':name});
const bounds=(o,r)=>[{x:o.x-r,y:o.y-r},{x:o.x+r,y:o.y+r}];
const finite=q=>q&&Number.isFinite(q.x)&&Number.isFinite(q.y);
function quad(d,g,M){
 const {blue,teal,purple,gold}=d.colors;
 d.circle(g.O,g.R,d.colors.muted,1.7,part('circumcircle'));
 [[g.A,g.B,blue],[g.B,g.C,teal],[g.C,g.D,blue],[g.D,g.A,teal]].forEach(([a,b,c],i)=>d.segment(a,b,c,2.6,part('cyclic-side-'+i)));
 d.point(g.D,'D',purple,{dx:12,dy:18,...part('cyclic-D')});
}
function diagonal(d,g){d.segment(g.A,g.C,d.colors.gold,2.7,part('diagonal-AC'));d.segment(g.B,g.D,d.colors.purple,2.7,part('diagonal-BD'));}
function split(d,g){if(!finite(g.X))return;d.segment(g.B,g.X,d.colors.gold,3,part('auxiliary-BX'));d.point(g.X,'X',d.colors.gold,{dx:12,dy:-14,...part('split-X')});}
const guard=g=>g.metricValid?'':'The auxiliary intersection is too close to an endpoint at drawing precision. Move a vertex or D to separate the configuration.';
const construction={
 steps:[
  {label:'Draw the circumcircle',text:'Construct the circle through A, B, and C.'},
  {label:'Place D on the remaining arc',text:'Place D on the arc from C to A that avoids B. This keeps ABCD convex and cyclic; drag D along that arc.'},
  {label:'Join the diagonals',text:'Draw AC and BD.'},
  {label:'Copy an angle at B',text:'Inside angle ABC, draw the ray BX so that angle ABX equals angle DBC.'},
  {label:'Mark the diagonal split',text:'Let X be the intersection of this ray with AC. The proof will justify its position and the two product identities.'}
 ],
 handleIds:l=>l>=2?['D']:[],
 draw(d,g,l,p,M){
  if(!l)return;
  if(l===1)d.circle(g.O,g.R,d.colors.gold,2.3,part('construction-circle'));
  if(l>=2)quad(d,g,M);
  if(l>=3)diagonal(d,g);
  if(l>=4&&finite(g.X)){d.segment(g.B,g.X,d.colors.gold,3,part('construction-BX'));d.angle(g.A,g.B,g.X,d.colors.blue,{radius:31,...part('construction-angle-ABX')});d.angle(g.D,g.B,g.C,d.colors.blue,{radius:42,...part('construction-angle-DBC')});}
  if(l>=5&&finite(g.X))d.point(g.X,'X',d.colors.gold,{dx:12,dy:-14});
 },
 extent(g,p,l){return l?[...g.vertices,...bounds(g.O,g.R),...(l>=2?[g.D]:[]),...(l>=5&&finite(g.X)?[g.X]:[])]:[...g.vertices];},
 status:()=> 'A, B, and C are free. D stays on the opposite arc so the four vertices remain in cyclic order.'
};
window.ProofEpisode={
 slug:'ptolemy',number:'19',title:'Ptolemy’s theorem',
 subtitle:'Two similar-triangle pairs split one diagonal product.',
 observation:'If A, B, C, and D are distinct vertices of a convex cyclic quadrilateral in that order, then AC · BD = AB · CD + AD · BC.',
 prediction:'Can one point X on AC split AC · BD into the two products of opposite sides?',
 after:'Apply the theorem to a rectangle with side lengths a and b. What familiar identity do you obtain for its diagonal?',
 initial:[{x:-.7,y:-.55},{x:.75,y:-.35},{x:.55,y:.65}],params:{t:.48},
 prerequisites:[
  {label:'16 · Inscribed angles',href:'../inscribed-angles/'},
  {label:'17 · Cyclic quadrilaterals',href:'../cyclic-quadrilaterals/'},
  {label:'T5 · AA similarity',href:'../basics/#t5'},
  {label:'T2 · Triangle angle sum',href:'../basics/#t2'}
 ],
 notes:[
  {title:'Convexity is a hypothesis',body:'The vertices are distinct and occur in boundary order A, B, C, D. The two diagonals lie inside the quadrilateral. The drawing places D on the open arc CA that does not contain B; it does not impose Ptolemy’s metric identity.'},
  {title:'Why the auxiliary ray meets AC',body:'The diagonal BD lies strictly inside angle ABC. Hence 0 < angle DBC < angle ABC. Copying that angle from BA toward BC gives a ray strictly inside angle ABC, which crosses the opposite side AC at a unique interior point X.'},
  {title:'A constructed point, not a solved formula',body:'The diagram obtains X by rotating the direction BA through angle DBC and intersecting the resulting ray with AC. It does not position X by assuming either product identity. Decimal measurements illustrate the proof.'}
 ],
 compute(g,p,M){
  const q=window.CircleGeometry.cyclic(g,p.t,M),D=q.D;
  const ba=M.sub(g.A,g.B),bc=M.sub(g.C,g.B);
  const turn=Math.sign(M.cross(ba,bc))*M.angle(D,g.B,g.C)*Math.PI/180;
  const u=M.unit(ba),direction={x:u.x*Math.cos(turn)-u.y*Math.sin(turn),y:u.x*Math.sin(turn)+u.y*Math.cos(turn)};
  const X=M.intersect(g.B,M.add(g.B,direction),g.A,g.C);
  const ratio=finite(X)?M.parameter(X,g.A,g.C):NaN;
  const a=M.dist(g.A,g.B),b=M.dist(g.B,g.C),c=M.dist(g.C,D),d=M.dist(D,g.A),ac=M.dist(g.A,g.C),bd=M.dist(g.B,D);
  return {D,X,a,b,c,d,ac,bd,metricValid:finite(X)&&ratio>1e-9&&ratio<1-1e-9,leftProduct:ac*bd,rightProduct:a*c+b*d,firstProduct:finite(X)?M.dist(g.A,X)*bd:NaN,secondProduct:finite(X)?M.dist(X,g.C)*bd:NaN};
 },
 handles(g,p,M){return [{id:'D',point:g.D,label:'D on the circumcircle. Drag or use arrow keys along arc CA.',move:q=>{p.t=window.CircleGeometry.fraction(g,q,M);}}];},
 construction,
 extent:g=>[...g.vertices,g.D,...bounds(g.O,g.R)],
 status(g){return 'AC × BD ≈ '+g.leftProduct.toFixed(3)+'; AB × CD + AD × BC ≈ '+g.rightProduct.toFixed(3)+'. The equal rounded values illustrate the theorem.';},
 draw(d,g,s,p,M){
  const {blue,teal,gold,purple}=d.colors;quad(d,g,M);
  if(s>=1)diagonal(d,g);
  if(s>=2)split(d,g);
  if(s===1){d.angle(g.A,g.B,g.C,gold,{radius:47});d.angle(g.D,g.B,g.C,purple,{radius:28});}
  if(s===2&&finite(g.X)){d.angle(g.A,g.B,g.X,blue,{radius:29,label:'α'});d.angle(g.D,g.B,g.C,blue,{radius:39,label:'α'});}
  if(s>=3&&s<=4&&finite(g.X)){
   d.poly([g.A,g.B,g.X],blue,.13,part('similar-ABX'));d.poly([g.D,g.B,g.C],teal,.11,part('similar-DBC'));
   d.angle(g.B,g.A,g.X,blue,{radius:26,...part('angle-BAX')});d.angle(g.B,g.D,g.C,teal,{radius:26,...part('angle-BDC')});
  }
  if(s===4&&finite(g.X)){d.segment(g.A,g.X,gold,5,part('first-piece-AX'));d.segment(g.D,g.C,blue,4);d.segment(g.A,g.B,blue,4);}
  if(s>=5&&s<=6&&finite(g.X)){
   d.poly([g.X,g.B,g.C],teal,.13,part('similar-XBC'));d.poly([g.A,g.B,g.D],purple,.11,part('similar-ABD'));
   d.angle(g.X,g.B,g.C,teal,{radius:30,...part('angle-XBC')});d.angle(g.A,g.B,g.D,purple,{radius:42,...part('angle-ABD')});
  }
  if(s===6&&finite(g.X)){d.segment(g.X,g.C,gold,5,part('second-piece-XC'));d.segment(g.A,g.D,teal,4);d.segment(g.B,g.C,teal,4);}
  if(s>=7&&finite(g.X)){d.segment(g.A,g.X,blue,5,part('sum-AX'));d.segment(g.X,g.C,teal,5,part('sum-XC'));d.segment(g.B,g.D,gold,4);}
 },
 steps:[
  {title:'Four vertices on one circle',text:'Let ABCD be a convex cyclic quadrilateral, with four distinct vertices in boundary order.',facts:['ABCD is convex and cyclic.'],key:'The four colored sides follow the circle in boundary order.',guard},
  {title:'An angle inside an angle',text:'Since BD is an interior diagonal, angle DBC is strictly smaller than angle ABC.',facts:['0° < ∠DBC < ∠ABC'],key:'The purple angle lies inside the larger angle at B.',guard},
  {title:'Construct X',text:'Inside angle ABC, copy angle DBC from BA toward BC. The resulting ray meets AC at an interior point X, and angle ABX equals angle DBC.',facts:['∠ABX = ∠DBC','A, X, C occur in that order.'],key:'The two marked angles define BX; X is constructed before its lengths are known.',guard},
  {title:'The first similarity',text:'Angles BAX and BDC subtend the same chord BC, so they are equal. Together with the copied angles this gives triangle ABX similar to triangle DBC.',facts:['∠BAX = ∠BDC','△ABX ∼ △DBC'],key:'Blue and teal triangles have two matching angles. The correspondence is A ↔ D, B ↔ B, X ↔ C.',guard},
  {title:'The first side product',text:'Corresponding sides give AX/CD = AB/BD. Multiplying by CD · BD identifies the first part of the diagonal product.',facts:['AX · BD = AB · CD'],key:'The highlighted segment AX accounts for the product of the blue opposite sides.',guard},
  {title:'The second similarity',text:'Subtracting the copied angles from angle ABC gives angle XBC = angle ABD. Also angle XCB = angle ADB, since both subtend chord AB. Hence triangle XBC is similar to triangle ABD.',facts:['∠XBC = ∠ABD','∠XCB = ∠ADB','△XBC ∼ △ABD'],key:'Teal and purple triangles have correspondence X ↔ A, B ↔ B, C ↔ D.',guard},
  {title:'The second side product',text:'This similarity gives XC/AD = BC/BD, and therefore the second part of the diagonal product is AD · BC.',facts:['XC · BD = AD · BC'],key:'The remaining piece XC accounts for the product of the teal opposite sides.',guard},
  {title:'Add the two identities',text:'Because X lies inside AC, we have AX + XC = AC. Add the two identities and factor out BD.',facts:['(AX + XC) · BD = AB · CD + AD · BC'],key:'The two colored pieces fill the complete diagonal AC.',guard},
  {title:'Ptolemy’s theorem',text:'Thus the product of the diagonals equals the sum of the products of opposite sides.',facts:['AC · BD = AB · CD + AD · BC'],key:'Both diagonals and the two pairs of opposite sides are visible.',guard}
 ]
};
})();
