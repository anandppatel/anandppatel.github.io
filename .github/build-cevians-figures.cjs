'use strict';
// Reproducible, coordinate-checked illustrations for homework set 02.
const fs=require('node:fs'),path=require('node:path');
const M=require('../proof-episodes/shared/geometry.js');
const out=path.resolve(__dirname,'../proof-episodes/homework/cevians-and-area/figures');
fs.mkdirSync(out,{recursive:true});
const g=M.triangle([{x:1.1,y:0},{x:0,y:2.4},{x:3.7,y:2.4}]);
const {A,B,C}=g, blue='#315dcc',teal='#087c70',gold='#a66b15',purple='#8551bd',ink='#26364b',muted='#8a97a5';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const bounds=(o,r)=>[{x:o.x-r,y:o.y-r},{x:o.x+r,y:o.y+r}];
function figure(file,title,desc,extent,draw,height=400){
 if(!extent.length||extent.some(p=>!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)))throw new Error(`Invalid figure extent: ${file}`);
 const width=560, xs=extent.map(p=>p.x),ys=extent.map(p=>p.y),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
 if(maxX<=minX||maxY<=minY)throw new Error(`Collapsed figure extent: ${file}`);
 const scale=Math.min((width-88)/(maxX-minX),(height-88)/(maxY-minY)),cx=(minX+maxX)/2,cy=(minY+maxY)/2;
 const project=p=>({x:width/2+(p.x-cx)*scale,y:height/2+(p.y-cy)*scale});
 const pt=p=>{p=project(p);return `${p.x.toFixed(3)},${p.y.toFixed(3)}`;};
 const pieces=[`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-labelledby="title desc"><title id="title">${esc(title)}</title><desc id="desc">${esc(desc)}</desc><rect width="${width}" height="${height}" fill="#fdfcf9"/><g stroke-linecap="round" stroke-linejoin="round" font-family="Georgia, 'Times New Roman', serif">`];
 const d={
  line(a,b,color=ink,w=2,dash=''){pieces.push(`<polyline points="${pt(a)} ${pt(b)}" fill="none" stroke="${color}" stroke-width="${w}"${dash?` stroke-dasharray="${dash}"`:''}/>`);},
  poly(points,color,opacity=.08){pieces.push(`<polygon points="${points.map(pt).join(' ')}" fill="${color}" fill-opacity="${opacity}"/>`);},
  circle(o,r,color,w=2,dash=''){const p=project(o);pieces.push(`<circle cx="${p.x}" cy="${p.y}" r="${r*scale}" fill="none" stroke="${color}" stroke-width="${w}"${dash?` stroke-dasharray="${dash}"`:''}/>`);},
  label(p,name,color=ink,dx=12,dy=-12){p=project(p);const [base,sub]=name.split('_');const text=esc(base)+(sub?`<tspan baseline-shift="sub" font-size="14">${esc(sub)}</tspan>`:'');pieces.push(`<text x="${p.x+dx}" y="${p.y+dy}" font-size="21" fill="${color}" text-anchor="middle">${text}</text>`);},
  point(p,name,color=ink,dx=12,dy=-12){const q=project(p);pieces.push(`<circle cx="${q.x}" cy="${q.y}" r="3.2" fill="${color}"/>`);d.label(p,name,color,dx,dy);},
  mark(p,name,color=ink,dx=12,dy=-12){const q=project(p),[base,sub]=name.split('_');pieces.push(`<circle cx="${q.x}" cy="${q.y}" r="3.2" fill="${color}"/><text x="${q.x+dx}" y="${q.y+dy}" font-size="21" fill="${color}" stroke="#fdfcf9" stroke-width="4" paint-order="stroke" text-anchor="middle">${esc(base)}${sub?`<tspan baseline-shift="sub" font-size="14">${esc(sub)}</tspan>`:''}</text>`);},
  right(f,a,b,color=muted){const u=M.unit(M.sub(a,f)),v=M.unit(M.sub(b,f)),sz=9/scale;const p=M.add(f,M.mul(u,sz)),q=M.add(p,M.mul(v,sz)),r=M.add(f,M.mul(v,sz));pieces.push(`<polyline points="${[p,q,r].map(pt).join(' ')}" fill="none" stroke="${color}" stroke-width="1.5"/>`);},
  arc(a,v,b,color,r=24){const aa=project(a),vv=project(v),bb=project(b),u=M.unit(M.sub(aa,vv)),w=M.unit(M.sub(bb,vv)),p=M.add(vv,M.mul(u,r)),q=M.add(vv,M.mul(w,r));pieces.push(`<path d="M${p.x},${p.y} A${r},${r} 0 0 ${M.cross(u,w)>0?1:0} ${q.x},${q.y}" fill="none" stroke="${color}" stroke-width="2"/>`);},
  triangle(t=g){const {A,B,C}=t;d.line(A,B);d.line(B,C);d.line(C,A);d.point(A,'A',ink,-6,-15);d.point(B,'B',ink,-13,22);d.point(C,'C',ink,13,22);}
 };
 draw(d);pieces.push('</g></svg>');fs.writeFileSync(path.join(out,file),pieces.join('\n')+'\n');
}

// These figures show the new configurations, not the episode proof diagrams.
const T=g.exTouches[0];
figure('perimeter.svg','A cevian that divides the perimeter in half','The excircle contact T_A lies on BC. The blue path goes from A through B to T_A; the teal path goes from A through C to T_A. The lengths of these boundary paths are compared in Problem 6.',[A,B,C],d=>{
 d.triangle();d.line(A,B,blue,3);d.line(B,T,blue,3);d.line(A,C,teal,3);d.line(C,T,teal,3);d.line(A,T,gold,2,'5 5');d.point(T,'T_A',gold,0,25);
});
const n=M.triangle([{x:.45,y:0},{x:0,y:3},{x:6,y:3}]);
figure('nagel-line.svg','Comparing the incenter, centroid, and Nagel point','I, G, and N_a lie on one line in the illustrated scalene triangle. The Nagel cevians are drawn faintly; the problem asks students to prove the line relation and determine the order and ratio.',n.vertices,d=>{
 d.poly([n.Na,n.B,n.C],blue,.07);d.poly([n.Na,n.C,n.A],teal,.08);d.poly([n.Na,n.A,n.B],purple,.08);
 n.vertices.forEach((v,i)=>d.line(v,n.exTouches[i],muted,1.3,'4 5'));
 d.triangle(n);d.line(M.lerp(n.I,n.Na,-.13),M.lerp(n.I,n.Na,1.13),gold,2.3);
 d.point(n.I,'I',teal,-9,-15);d.point(n.G,'G',blue,0,26);d.point(n.Na,'N_a',purple,8,-15);
});
const [D,E,F]=g.incTouches;
figure('contact-triangle.svg','The triangle formed by the incircle contacts','D, E, F are the incircle contacts on BC, CA, AB. The central triangle DEF and the three corner triangles partition ABC. Tangent lengths at each vertex are equal.',[A,B,C],d=>{
 d.poly([A,E,F],blue,.09);d.poly([B,F,D],gold,.1);d.poly([C,D,E],purple,.08);d.poly([D,E,F],teal,.2);
 d.circle(g.I,g.r,muted);d.triangle();d.line(D,E,teal,2.3);d.line(E,F,teal,2.3);d.line(F,D,teal,2.3);
 d.point(D,'D',teal,0,25);d.point(E,'E',teal,19,-3);d.point(F,'F',teal,-19,0);
});
// Equal base 4 and perimeter 12: b+c=8 in each triangle.
const B9={x:0,y:0},C9={x:4,y:0},b9=5,c9=3,x9=(c9*c9-b9*b9+16)/8;
const A9={x:x9,y:-Math.sqrt(c9*c9-x9*x9)},Amax={x:2,y:-Math.sqrt(12)};
const h9=M.foot(A9,B9,C9),hmax=M.foot(Amax,B9,C9);
figure('fixed-perimeter.svg','Two triangles with the same base and perimeter','Both triangles have base BC of length 4 and perimeter 12. The teal isosceles triangle has the higher altitude. The blue triangle has unequal remaining sides. Heron’s formula determines the largest possible area.',[A9,Amax,B9,C9],d=>{
 d.poly([Amax,B9,C9],teal,.06);d.poly([A9,B9,C9],blue,.05);
 d.line(B9,C9);d.line(A9,B9,blue,2.4);d.line(A9,C9,blue,2.4);d.line(Amax,B9,teal,2.4);d.line(Amax,C9,teal,2.4);
 d.line(A9,h9,blue,1.3,'4 5');d.line(Amax,hmax,teal,1.3,'4 5');d.right(hmax,Amax,C9);
 d.point(B9,'B',ink,-13,23);d.point(C9,'C',ink,13,23);d.point(A9,'A',blue,-16,-10);d.point(Amax,'A_0',teal,8,-17);
 d.label(M.mid(A9,B9),'3',blue,-19,0);d.label(M.mid(A9,C9),'5',blue,30,22);d.label(M.mid(Amax,B9),'4',teal,-10,-17);d.label(M.mid(Amax,C9),'4',teal,21,-2);d.label(M.mid(B9,C9),'4',ink,0,25);
});

const rt=M.triangle([{x:0,y:0},{x:-2,y:4},{x:6,y:3}]),H=rt.feet[0];
figure('right-symmedian.svg','The symmedian point in a right triangle','Triangle ABC is right angled at A. AD is the altitude to the hypotenuse BC. L is the midpoint of AD. Problem 5 asks students to prove that L is the symmedian point; the other two symmedians are drawn faintly.',rt.vertices,d=>{
 d.triangle(rt);d.right(rt.A,rt.B,rt.C);d.line(rt.B,rt.symmedianEnds[1],muted,1.4,'4 5');d.line(rt.C,rt.symmedianEnds[2],muted,1.4,'4 5');d.line(rt.A,H,teal,2.5);d.right(H,rt.A,rt.C);d.point(H,'D',teal,8,25);d.point(rt.K,'L',blue,-20,0);
});
const tc=M.triangle([{x:1.1,y:0},{x:0,y:4},{x:4,y:4}]);
const tb=M.add(tc.B,M.perp(M.sub(tc.B,tc.O))),tcc=M.add(tc.C,M.perp(M.sub(tc.C,tc.O)));
const tangentT=M.intersect(tc.B,tb,tc.C,tcc),tangentD=M.intersect(tc.A,tangentT,tc.B,tc.C);
figure('tangent-symmedian.svg','A symmedian constructed with two tangents','The circumcircle passes through A, B, and C. Its tangents at B and C meet at T, across BC from A. Segment AT meets BC at D. The construction starts with tangents, rather than reflecting a median.',[...tc.vertices,tangentT,...bounds(tc.O,tc.R)],d=>{
 d.circle(tc.O,tc.R,muted);d.triangle(tc);d.line(tc.B,tangentT,gold,2.3);d.line(tc.C,tangentT,gold,2.3);d.line(tc.A,tangentT,teal,2.4);
 d.line(tc.O,tc.B,muted,1.1,'4 5');d.line(tc.O,tc.C,muted,1.1,'4 5');d.right(tc.B,tc.O,tangentT);d.right(tc.C,tc.O,tangentT);
 d.point(tc.O,'O',muted,18,-3);d.point(tangentD,'D',teal,17,23);d.point(tangentT,'T',gold,0,26);
},620);

// Keep the earlier illustrations above available to existing downloads. These
// four figures accompany the revised set; every point is constructed below.
const pair=M.triangle([{x:.5,y:0},{x:0,y:4},{x:6,y:4}]);
figure('isotomic-pair.svg','Side reflections exchange the Gergonne and Nagel contacts','In Problem 1, the blue cevians through the incircle contacts D, E, F concur at G_e. Their teal partners through D′, E′, F′ concur at N_a. Each primed contact is the reflection of the unprimed contact in its side midpoint, and is the contact of the opposite excircle: D′=T_A, E′=T_B, F′=T_C. The pair AD, AD′ is emphasized. The dashed short line is the perpendicular bisector of BC; the excircles themselves are omitted.',pair.vertices,d=>{
 d.circle(pair.I,pair.r,muted,1.3,'4 5');
 pair.vertices.forEach((v,i)=>{d.line(v,pair.incTouches[i],blue,i?1.2:2.8,i?'4 5':'');d.line(v,pair.exTouches[i],teal,i?1.2:2.8,i?'4 5':'');});
 const mid=pair.mids[0];d.line(M.add(mid,{x:0,y:-.32}),M.add(mid,{x:0,y:.32}),muted,1.3,'3 4');
 d.triangle(pair);
 [[0,26],[19,-9],[-20,-8]].forEach((o,i)=>d.mark(pair.incTouches[i],['D','E','F'][i],blue,...o));
 [[0,26],[22,-4],[-20,4]].forEach((o,i)=>d.mark(pair.exTouches[i],['D′','E′','F′'][i],teal,...o));
 d.mark(pair.Ge,'G_e',blue,-13,-18);d.mark(pair.Na,'N_a',teal,18,21);
},430);

const weights=[.4,.18,.42],P=pair.vertices.reduce((sum,v,i)=>M.add(sum,M.mul(v,weights[i])),{x:0,y:0});
const pFeet=pair.vertices.map((v,i)=>M.intersect(v,P,pair.vertices[(i+1)%3],pair.vertices[(i+2)%3]));
const axes=pair.vertices.map((v,i)=>M.unit(M.add(M.unit(M.sub(pair.vertices[(i+1)%3],v)),M.unit(M.sub(pair.vertices[(i+2)%3],v)))));
const qDirections=pair.vertices.map((v,i)=>{const u=M.sub(P,v);return M.sub(M.mul(axes[i],2*M.dot(u,axes[i])),u);});
const qFeet=pair.vertices.map((v,i)=>M.intersect(v,M.add(v,qDirections[i]),pair.vertices[(i+1)%3],pair.vertices[(i+2)%3]));
const Q=M.intersect(pair.A,qFeet[0],pair.B,qFeet[1]),bisectorEnd=M.intersect(pair.A,M.add(pair.A,axes[0]),pair.B,pair.C);
figure('isogonal-pair.svg','Reflection of three concurrent interior rays','In Problem 2, the blue cevians through P meet the opposite sides at D, E, F. Reflecting the rays in their internal angle bisectors gives the teal cevians through Q, with opposite-side intersections D′, E′, F′. The gold dashed ray is the internal angle bisector at A. The pair AD, AD′ is emphasized, and the blue arcs mark the equal angles BAD and D′AC. Q and all reflected side intersections are computed by ray reflection and line intersection.',pair.vertices,d=>{
 pair.vertices.forEach((v,i)=>{d.line(v,pFeet[i],blue,i?1.2:2.8,i?'4 5':'');d.line(v,qFeet[i],teal,i?1.2:2.8,i?'4 5':'');});
 d.line(pair.A,bisectorEnd,gold,1.7,'5 5');d.arc(pair.B,pair.A,pFeet[0],blue,35);d.arc(qFeet[0],pair.A,pair.C,blue,46);
 d.triangle(pair);
 [[0,25],[18,-9],[-21,-2]].forEach((o,i)=>d.mark(pFeet[i],['D','E','F'][i],blue,...o));
 [[0,25],[23,-8],[-22,7]].forEach((o,i)=>d.mark(qFeet[i],['D′','E′','F′'][i],teal,...o));
 d.mark(P,'P',blue,14,-18);d.mark(Q,'Q',teal,21,19);
},430);

const acute=g,altitudeFoot=acute.feet[0];
figure('acute-isogonal.svg','The circumcenter and orthocenter in an acute triangle','In Problem 3, ABC is acute. The circumcircle has center O, and the altitude AD passes through the orthocenter H. Gold AO and teal AH are the rays to be compared. The dashed radii OB and OC form the two isosceles radius triangles used in the proof. The right-angle marker shows AD perpendicular to BC; O and H both lie strictly inside the triangle.',[...acute.vertices,...bounds(acute.O,acute.R)],d=>{
 d.circle(acute.O,acute.R,muted,1.6);
 d.line(acute.O,acute.B,muted,1.3,'4 5');d.line(acute.O,acute.C,muted,1.3,'4 5');
 d.line(acute.A,altitudeFoot,teal,2.5);d.line(acute.A,acute.O,gold,2.8);
 d.triangle(acute);d.right(altitudeFoot,acute.A,acute.C);
 d.mark(altitudeFoot,'D',teal,-1,25);d.mark(acute.H,'H',teal,-20,0);d.mark(acute.O,'O',gold,18,18);
},480);

const heron=M.triangle([{x:1,y:0},{x:0,y:6},{x:4,y:6}]);
const hI=heron.I,hE=heron.excenters[0],[hX,hY,hZ]=heron.incTouches,hT=heron.exTouches[0];
const [hz,hx,hy]=heron.tangentLengths,hU=M.add(heron.C,M.mul(M.unit(M.sub(heron.C,heron.A)),hx)),hV=M.add(heron.B,M.mul(M.unit(M.sub(heron.B,heron.A)),hy));
figure('heron-derivation.svg','The two pairs of similar right triangles in Heron’s proof','Problems 7–8 use Venema’s Figure 4.4 notation. The incircle has center I and contacts X on BC, Y on CA, Z on AB. The A-excircle has center E and contacts T strictly inside BC, U beyond C on AC, V beyond B on AB. The shaded right triangles are AZI and AVE, and ZBI and VEB. The contact radii IZ and EV meet AB at right angles. Segment AE follows the internal bisector at A, and BI and BE are perpendicular internal and exterior bisectors at B. X is labeled above BC and T below it. Both circles and all contacts are constructed from the triangle.',[...heron.vertices,hU,hV,...bounds(hI,heron.r),...bounds(hE,heron.exradii[0])],d=>{
 d.poly([heron.A,hV,hE],gold,.055);d.poly([hV,hE,heron.B],purple,.08);
 d.poly([heron.A,hZ,hI],blue,.14);d.poly([hZ,heron.B,hI],teal,.2);
 d.circle(hI,heron.r,blue,1.6);d.circle(hE,heron.exradii[0],gold,1.6);
 d.line(heron.A,hU,muted,1.5);d.line(heron.A,hV,muted,1.5);d.line(heron.A,hE,gold,2);
 d.line(heron.B,hI,teal,2);d.line(heron.B,hE,purple,2);
 [hX,hY].forEach(p=>d.line(hI,p,blue,1.1,'3 5'));[hT,hU].forEach(p=>d.line(hE,p,gold,1.1,'3 5'));
 d.line(hI,hZ,blue,2.4);d.line(hE,hV,gold,2.4);d.triangle(heron);
 d.right(hZ,heron.A,hI,blue);d.right(hV,heron.B,hE,gold);d.right(heron.B,hI,hE,purple);
 d.mark(hX,'X',blue,-10,-12);d.mark(hY,'Y',blue,21,-3);d.mark(hZ,'Z',blue,-20,-1);
 d.mark(hT,'T',gold,12,24);d.mark(hU,'U',gold,21,-2);d.mark(hV,'V',gold,-18,15);
 d.mark(hI,'I',blue,14,-13);d.mark(hE,'E',gold,17,20);
},760);
// Numerical checks protect the intended relations in the illustrations.
const close=(x,y)=>{if(!Number.isFinite(x)||!Number.isFinite(y)||Math.abs(x-y)>1e-10)throw new Error(`Figure relation failed: ${x} vs ${y}`);};
close(M.dist(A,B)+M.dist(B,T),M.dist(A,C)+M.dist(C,T));
close(M.dist(n.Na,M.sub(M.mul(n.G,3),M.mul(n.I,2))),0);
close(M.area(D,E,F)/g.area,2*g.tangentLengths.reduce((a,b)=>a*b,1)/g.sides.reduce((a,b)=>a*b,1));
close(M.dist(A9,B9)+M.dist(A9,C9),M.dist(Amax,B9)+M.dist(Amax,C9));
close(M.dist(rt.K,M.mid(rt.A,H)),0);
close(M.dist(tangentD,tc.symmedianEnds[0]),0);
const check=(test,message)=>{if(!test)throw new Error(message);};
const onLine=(p,a,b)=>close(M.cross(M.sub(p,a),M.sub(b,a)),0);
const inside=(p,t)=>{const areaSum=t.vertices.reduce((s,v,i)=>s+M.area(p,v,t.vertices[(i+1)%3]),0);close(areaSum,t.area);check(t.vertices.every((v,i)=>M.area(p,v,t.vertices[(i+1)%3])>1e-9),'Point must be strictly interior');};
pair.vertices.forEach((v,i)=>{
 const b=pair.vertices[(i+1)%3],c=pair.vertices[(i+2)%3];
 close(M.dist(M.mid(pair.incTouches[i],pair.exTouches[i]),pair.mids[i]),0);
 onLine(pair.Ge,v,pair.incTouches[i]);onLine(pair.Na,v,pair.exTouches[i]);
 onLine(P,v,pFeet[i]);onLine(Q,v,qFeet[i]);
 for(const foot of [pair.incTouches[i],pair.exTouches[i],pFeet[i],qFeet[i]])check(M.parameter(foot,b,c)>0&&M.parameter(foot,b,c)<1,'Side intersection must be interior');
 close(M.angle(b,v,P),M.angle(Q,v,c));close(M.angle(P,v,c),M.angle(b,v,Q));
 // Reflection reverses the off-axis component and preserves the on-axis one.
 close(M.dot(M.sub(P,v),axes[i]),M.dot(qDirections[i],axes[i]));
 close(M.cross(M.sub(P,v),axes[i]),-M.cross(qDirections[i],axes[i]));
});
[P,Q,pair.Ge,pair.Na].forEach(p=>inside(p,pair));
inside(acute.O,acute);inside(acute.H,acute);
acute.vertices.forEach((v,i)=>{
 const b=acute.vertices[(i+1)%3],c=acute.vertices[(i+2)%3];
 check(M.angle(b,v,c)<90,'Acute example must be strictly acute');
 close(M.dist(v,acute.O),acute.R);close(M.angle(b,v,acute.O),M.angle(acute.H,v,c));
});
close(M.dot(M.sub(acute.A,altitudeFoot),M.sub(acute.C,acute.B)),0);
[[hX,heron.B,heron.C],[hY,heron.C,heron.A],[hZ,heron.A,heron.B]].forEach(([p,a,b])=>{
 onLine(p,a,b);close(M.dist(p,hI),heron.r);close(M.dot(M.sub(p,hI),M.sub(b,a)),0);
 check(M.parameter(p,a,b)>0&&M.parameter(p,a,b)<1,'Incircle contact must be interior');
});
[[hT,heron.B,heron.C],[hU,heron.A,heron.C],[hV,heron.A,heron.B]].forEach(([p,a,b])=>{
 onLine(p,a,b);close(M.dist(p,hE),heron.exradii[0]);close(M.dot(M.sub(p,hE),M.sub(b,a)),0);
});
check(M.parameter(hT,heron.B,heron.C)>0&&M.parameter(hT,heron.B,heron.C)<1,'Excircle contact T must be interior');
check(M.parameter(hU,heron.A,heron.C)>1&&M.parameter(hV,heron.A,heron.B)>1,'Excircle contacts U,V must lie beyond C,B');
close(M.dist(heron.A,hV),heron.s);onLine(hI,heron.A,hE);
close(M.dot(M.sub(hI,heron.B),M.sub(hE,heron.B)),0);
close(M.dist(hZ,hI)/M.dist(heron.A,hZ),M.dist(hV,hE)/M.dist(heron.A,hV));
close(M.dist(heron.B,hZ)/M.dist(hZ,hI),M.dist(hE,hV)/M.dist(hV,heron.B));
[[heron.A,hZ,hI],[heron.A,hV,hE],[hZ,heron.B,hI],[hV,hE,heron.B]].forEach(t=>check(M.area(...t)>1e-9,'Heron similarity triangle must not collapse'));
console.log('Built ten homework illustrations; all contact, reflection, concurrency, angle, radius, order, and similarity checks passed.');
