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
 const width=560, xs=extent.map(p=>p.x),ys=extent.map(p=>p.y),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
 const scale=Math.min((width-88)/(maxX-minX),(height-88)/(maxY-minY)),cx=(minX+maxX)/2,cy=(minY+maxY)/2;
 const project=p=>({x:width/2+(p.x-cx)*scale,y:height/2+(p.y-cy)*scale});
 const pt=p=>{p=project(p);return `${p.x.toFixed(3)},${p.y.toFixed(3)}`;};
 const pieces=[`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-labelledby="title desc"><title id="title">${esc(title)}</title><desc id="desc">${esc(desc)}</desc><rect width="${width}" height="${height}" fill="#fdfcf9"/><g stroke-linecap="round" stroke-linejoin="round" font-family="Georgia, 'Times New Roman', serif">`];
 const d={
  line(a,b,color=ink,w=2,dash=''){pieces.push(`<polyline points="${pt(a)} ${pt(b)}" fill="none" stroke="${color}" stroke-width="${w}"${dash?` stroke-dasharray="${dash}"`:''}/>`);},
  poly(points,color,opacity=.08){pieces.push(`<polygon points="${points.map(pt).join(' ')}" fill="${color}" fill-opacity="${opacity}"/>`);},
  circle(o,r,color){const p=project(o);pieces.push(`<circle cx="${p.x}" cy="${p.y}" r="${r*scale}" fill="none" stroke="${color}" stroke-width="2"/>`);},
  label(p,name,color=ink,dx=12,dy=-12){p=project(p);const [base,sub]=name.split('_');const text=esc(base)+(sub?`<tspan baseline-shift="sub" font-size="14">${esc(sub)}</tspan>`:'');pieces.push(`<text x="${p.x+dx}" y="${p.y+dy}" font-size="21" fill="${color}" text-anchor="middle">${text}</text>`);},
  point(p,name,color=ink,dx=12,dy=-12){const q=project(p);pieces.push(`<circle cx="${q.x}" cy="${q.y}" r="3.2" fill="${color}"/>`);d.label(p,name,color,dx,dy);},
  right(f,a,b,color=muted){const u=M.unit(M.sub(a,f)),v=M.unit(M.sub(b,f)),sz=9/scale;const p=M.add(f,M.mul(u,sz)),q=M.add(p,M.mul(v,sz)),r=M.add(f,M.mul(v,sz));pieces.push(`<polyline points="${[p,q,r].map(pt).join(' ')}" fill="none" stroke="${color}" stroke-width="1.5"/>`);},
  arc(a,v,b,color,r=24){const aa=project(a),vv=project(v),bb=project(b),u=M.unit(M.sub(aa,vv)),w=M.unit(M.sub(bb,vv)),p=M.add(vv,M.mul(u,r)),q=M.add(vv,M.mul(w,r));pieces.push(`<path d="M${p.x},${p.y} A${r},${r} 0 0 ${M.cross(u,w)>0?1:0} ${q.x},${q.y}" fill="none" stroke="${color}" stroke-width="2"/>`);},
  triangle(t=g){const {A,B,C}=t;d.line(A,B);d.line(B,C);d.line(C,A);d.point(A,'A',ink,-6,-15);d.point(B,'B',ink,-13,22);d.point(C,'C',ink,13,22);}
 };
 draw(d);pieces.push('</g></svg>');fs.writeFileSync(path.join(out,file),pieces.join('\n')+'\n');
}

// These figures show the new configurations, not the episode proof diagrams.
const T=g.exTouches[0];
figure('perimeter.svg','A cevian that divides the perimeter in half','The excircle contact T_A lies on BC. The blue path goes from A through B to T_A; the teal path goes from A through C to T_A. The lengths of these boundary paths are compared in Problem 5.',[A,B,C],d=>{
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
figure('right-symmedian.svg','The symmedian point in a right triangle','Triangle ABC is right angled at A. AD is the altitude to the hypotenuse BC. L is the midpoint of AD. The problem asks students to prove that L is the symmedian point; the other two symmedians are drawn faintly.',rt.vertices,d=>{
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
// Numerical checks protect the intended relations in the illustrations.
const close=(x,y)=>{if(Math.abs(x-y)>1e-10)throw new Error(`Figure relation failed: ${x} vs ${y}`);};
close(M.dist(A,B)+M.dist(B,T),M.dist(A,C)+M.dist(C,T));
close(M.dist(n.Na,M.sub(M.mul(n.G,3),M.mul(n.I,2))),0);
close(M.area(D,E,F)/g.area,2*g.tangentLengths.reduce((a,b)=>a*b,1)/g.sides.reduce((a,b)=>a*b,1));
close(M.dist(A9,B9)+M.dist(A9,C9),M.dist(Amax,B9)+M.dist(Amax,C9));
close(M.dist(rt.K,M.mid(rt.A,H)),0);
close(M.dist(tangentD,tc.symmedianEnds[0]),0);
console.log('Built six complementary homework illustrations from checked coordinates.');
