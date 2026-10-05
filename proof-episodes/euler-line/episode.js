(() => {
'use strict';
window.ProofEpisode={
 slug:'euler-line',title:'The Euler line',number:'05',
 initial:[{x:-.65,y:-.65},{x:-.9,y:.55},{x:.85,y:.55}],
 subtitle:'Construct a candidate X, then recognize the orthocenter by similarity.',
 observation:'In every non-equilateral triangle, O, G, and H lie on one line, with G between O and H and GH = 2GO; in an equilateral triangle all three points coincide.',
 prediction:'Place X opposite O across G, with GX = 2GO. Why should X lie on every altitude?',
 after:'Where did the proof use the direction of GX, as well as its length?',
 prerequisites:[{label:'The centroid and its 2 : 1 ratio',href:'../centroid/'},{label:'The circumcenter and perpendicular bisectors',href:'../circumcenter/'},{label:'The orthocenter: the common point of the altitudes',href:'../orthocenter/'},{label:'C3 · Dilations and similarity',href:'../basics/#c3'},{label:'T1 · SAS congruence',href:'../basics/#t1'},{label:'P1 · Alternate interior angles and converse',href:'../basics/#p1'}],
 notes:[
  {title:'Why O ≠ G means non-equilateral',body:'If O = G, then O lies on every median. It differs from each side midpoint, since G is strictly inside the triangle. Thus each median is the perpendicular bisector of its opposite side. Each vertex is equidistant from the other two, so all three sides are equal. Conversely, SAS congruence shows that every median of an equilateral triangle is a perpendicular bisector and an altitude; hence O = G = H.'},
  {title:'The SAS similarity used here',body:'Dilate triangle DGO by factor 2. Its two sides at the image of G then have lengths 2GD = GA and 2GO = GX, and its included angle equals ∠AGX. By T1 (SAS), the dilated triangle is congruent to triangle AGX, with D corresponding to A, G to G, and O to X. Composing the dilation with that congruence proves the claimed similarity using C3 and T1.'},
  {title:'If the comparison triangles collapse',body:'Similarity requires genuine triangles. If O lies on median AD and O ≠ D, the perpendicular bisector OD is the line AD itself. Since X lies on OG = AD, it lies on the altitude from A. If O = D, the centroid ratio gives GA = 2GD = 2GO; both A and X lie on the ray from G opposite O, so X = A. A belongs to its own altitude. Apply these same cases at B and C when necessary.'},
  {title:'Exact hypotheses and the drawing',body:'Dragging may make points or lines too close to distinguish. The ≈ labels and drawing notices report numerical proximity, not exact equality. The proof uses explicit hypotheses: O ≠ G, O off AD for similarity, and the separately proved collinear cases.'}
 ],
 actions:[
  {label:'Make equilateral',run:v=>v.splice(0,3,{x:0,y:-.72},{x:-Math.sqrt(3)*.36,y:.36},{x:Math.sqrt(3)*.36,y:.36})},
  {label:'Make isosceles',run:v=>v.splice(0,3,{x:0,y:-.7},{x:-.8,y:.5},{x:.8,y:.5})},
  {label:'Make right at A',run:v=>v.splice(0,3,{x:-.65,y:-.45},{x:.75,y:-.45},{x:-.65,y:.55})}
 ],
 compute:(g,p,M)=>({
  X:M.add(g.G,M.mul(M.sub(g.G,g.O),2)),
  coincident:M.dist(g.O,g.G)<=1e-10*g.scale,
  comparisonFlat:Math.abs(M.cross(M.sub(g.mids[0],g.G),M.sub(g.O,g.G)))<=1e-10*g.scale*g.scale,
  midpointClose:M.dist(g.O,g.mids[0])<=1e-10*g.scale
 }),
 status:(g,p,active,s)=>g.coincident?'O and G are indistinguishable at drawing precision; no unique joining line is drawn. Exact O = G is the equilateral case.':s<2&&s!==-1?'Begin with the known centers O and G; X will be constructed next.':g.comparisonFlat&&s>=3&&s<=8?'The comparison triangles are flat at drawing precision; the proof treats exact collinearity separately.':s>=10?'The proof identifies X with H: G lies between O and H, and GH = 2GO.':'X is constructed from O and G; the proof will show that it lies on every altitude.',
 extent:(g,p,s)=>[...g.vertices,g.G,g.O,...(s>=2||s===-1?[g.X]:[]),...(s>=3&&s<=9?[g.mids[0]]:[]),...(s===7||s===8?[g.feet[0]]:[]),...(s===9||s===10||s===-1?g.feet:[]),...(s===11?g.mids:[])],
 draw:(d,g,s,p,M)=>{
  const c=d.colors,[A,B,C]=g.vertices,D=g.mids[0],marks=[];
  const mark=(point,label,color,opts={})=>marks.push({point,label,color,opts});
  const part=name=>({'data-part':name});
  const altitude=(i,color)=>{
   const v=g.vertices[i],b=g.vertices[(i+1)%3],cc=g.vertices[(i+2)%3],foot=g.feet[i];
   d.line(v,M.add(v,M.perp(M.sub(cc,b))),color,2.8,part('altitude-'+i));
   d.line(b,cc,c.muted,1,{'stroke-dasharray':'4 5',...part('supporting-side-'+i)});
   d.right(foot,M.add(foot,M.perp(M.sub(cc,b))),M.add(foot,M.sub(cc,b)),color);
  };
  if((s>=1||s===-1)&&!g.coincident)d.line(g.O,g.G,c.gold,1.8,part('euler-line'));
  if((s>=2||s===-1)&&!g.coincident){
   d.segment(g.O,g.G,c.blue,3.5,part('OG'));d.segment(g.G,g.X,c.gold,3.5,part('GX'));
   const half=M.mid(g.G,g.X);d.tick(g.O,g.G,c.blue);d.tick(g.G,half,c.gold);d.tick(half,g.X,c.gold);
  }
  if(s>=3&&s<=9){
   d.segment(A,D,c.muted,1.5,part('median-0'));
   d.segment(A,g.G,c.teal,s===3?4:2,part('AG'));d.segment(g.G,D,c.blue,s===3?4:2,part('GD'));
   d.tick(B,D,c.muted,2);d.tick(D,C,c.muted,2);mark(D,'D',c.blue,{dx:10,dy:22});
  }
  if(s>=4&&s<=7&&!g.comparisonFlat){
   d.poly([D,g.G,g.O],c.blue,.13,part('triangle-DGO'));
   d.poly([A,g.G,g.X],c.teal,.14,part('triangle-AGX'));
   if(s<=5){d.angle(D,g.G,g.O,c.blue,{radius:23,...part('angle-DGO')});d.angle(A,g.G,g.X,c.teal,{radius:34,...part('angle-AGX')});}
   if(s>=5){d.segment(D,g.O,c.blue,3,part('OD'));d.segment(A,g.X,c.teal,3,part('AX'));}
   if(s===6){d.angle(g.G,D,g.O,c.blue,{radius:24,...part('angle-GDO')});d.angle(g.G,A,g.X,c.teal,{radius:29,...part('angle-GAX')});}
  }
  if(s===7){
   d.line(D,M.add(D,M.perp(M.sub(C,B))),c.blue,2,part('perpendicular-bisector-0'));
   d.right(D,M.add(D,M.perp(M.sub(C,B))),C,c.blue);altitude(0,c.teal);
  }
  if(s===8){
   // This line is valid even when O = D; never use a zero-length direction.
   d.line(D,M.add(D,M.perp(M.sub(C,B))),c.blue,2,part('perpendicular-bisector-0'));
   d.line(A,D,c.teal,2,part('median-line'));altitude(0,c.gold);
   if(!g.midpointClose)d.segment(D,g.O,c.blue,3,part('OD'));
  }
  if(s===9||s===10||s===-1)g.vertices.forEach((v,i)=>altitude(i,[c.teal,c.purple,c.blue][i]));
  if(s===11){g.vertices.forEach((v,i)=>{d.segment(v,g.mids[i],c.teal,2.5,part('median-'+i));d.segment(v,g.vertices[(i+1)%3],c.blue,3,part('equilateral-side-'+i));});}
  mark(g.O,'O',c.blue,{dx:-21,dy:-17});mark(g.G,'G',c.purple,{dx:12,dy:23});
  if(s>=2||s===-1)mark(g.X,s>=10||s===-1?'X = H':'X',c.gold,{dx:13,dy:-18});
  const groups=[];
  marks.forEach(item=>{const found=groups.find(q=>M.dist(q.point,item.point)<=1e-10*g.scale);if(found)found.label+=' ≈ '+item.label;else groups.push({...item});});
  groups.forEach(item=>{const vertex=g.vertices.findIndex(v=>M.dist(v,item.point)<=1e-10*g.scale);if(vertex>=0)item.label+=' ≈ '+'ABC'[vertex];d.point(item.point,item.label,item.color,{...part('point-'+item.label),...item.opts});});
 },
 steps:[
  {title:'Start with distinct centers',text:'Assume ABC is not equilateral, so its circumcenter O and centroid G are distinct.',facts:['O ≠ G','The coincidence case is explained below'],key:'Blue: O; purple: G. No orthocenter has been marked.'},
  {title:'Join O to G',text:'Draw the unique line through O and G.',facts:['Two distinct points determine a line'],key:'Gold: the line determined by O and G.'},
  {title:'Construct the candidate X',text:'On this line, place X on the opposite side of G from O, with GX = 2GO.',facts:['O, G, X lie in that order','GX = 2GO'],key:'Blue: GO; gold: GX, marked as two lengths equal to GO. X is not yet identified as H.'},
  {title:'Bring in a median',text:'Let D be the midpoint of BC; the centroid theorem puts A, G, D in that order and gives GA = 2GD.',facts:['BD = DC','GA/GD = GX/GO = 2'],key:'The median supplies the second pair of sides in the same ratio.'},
  {title:'Compare the angles at G',text:'First suppose O is not on line AD; then ∠DGO and ∠AGX are vertical angles, so they are equal.',facts:['For this comparison: O is off AD','∠DGO = ∠AGX'],key:g=>g.comparisonFlat?'The triangles look flat here. The conditional similarity argument applies off AD; the collinear cases follow in a later sentence.':'The blue and teal angle arcs mark the equal included angles.'},
  {title:'The two triangles are similar',text:'When O is off AD, the two side ratios and their equal included angles give △AGX ∼ △DGO by SAS similarity, justified below from dilation and SAS congruence.',facts:['A ↔ D, G ↔ G, X ↔ O','GA/GD = GX/GO = AX/DO = 2'],key:g=>g.comparisonFlat?'The comparison looks flat. Move a vertex to see the similar triangles, or continue to the collinear cases.':'Blue: △DGO; teal: △AGX. Corresponding lengths in the teal triangle are twice those in the blue triangle.'},
  {title:'Turn similarity into parallelism',text:'Under the same off-AD hypothesis, corresponding angles give ∠GAX = ∠GDO, so the alternate-interior-angle converse gives AX ∥ DO.',facts:['∠GAX = ∠GDO','AX ∥ DO'],key:g=>g.comparisonFlat?'The comparison looks flat; the alternate-angle argument assumes O is off AD. The collinear cases follow.':'The marked angles form the alternate interior pair across transversal AD.'},
  {title:'X lies on the altitude from A',text:'Still assuming O is off AD, the circumcenter property gives DO is perpendicular to BC, and hence AX is perpendicular to BC.',facts:['DO ⟂ BC','AX ⟂ BC','X lies on the altitude from A'],key:'Blue: the perpendicular bisector through D; teal: the parallel altitude through A.'},
  {title:'If the comparison collapses',text:'If O lies on AD but O ≠ D, then line AD is the perpendicular bisector of BC and contains X; if O = D, the two ratios give GX = GA on the same ray, so X = A and again X belongs to the altitude from A.',facts:['O on AD, O ≠ D: X lies on AD ⟂ BC','O = D: GX = 2GD = GA, so X = A'],key:'Use “Make isosceles” or “Make right at A” to inspect these cases. The blue perpendicular bisector is defined even when O and D coincide.'},
  {title:'Repeat at B and C',text:'The same argument with the midpoints of CA and AB places this same X on the altitudes from B and C, using the collinear cases whenever a comparison collapses.',facts:['X lies on the altitude from A','X lies on the altitude from B','X lies on the altitude from C'],key:'The three altitude lines now pass through the candidate X.'},
  {title:'Recognize the orthocenter',text:'Thus X is the orthocenter H, and its construction proves that O, G, H are collinear, with G between O and H and GH = 2GO.',facts:['X = H','O, G, H lie in that order','OG : GH = 1 : 2'],key:'Only now is X identified as H. The marked segments retain the ratio used to construct X.'},
  {title:'The equilateral exception',text:'If ABC is equilateral, its medians are perpendicular bisectors and altitudes, so O = G = H and these coincident centers determine no unique Euler line.',facts:['Equilateral: O = G = H','Non-equilateral: O ≠ G, so the construction above applies'],key:'Use “Make equilateral” to inspect the coincidence case; approximate labels never assert exact equality from numerical proximity.'}
 ]
};
})();
