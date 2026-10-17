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
  triangle(){d.line(A,B);d.line(B,C);d.line(C,A);d.point(A,'A',ink,-6,-15);d.point(B,'B',ink,-13,22);d.point(C,'C',ink,13,22);}
 };
 draw(d);pieces.push('</g></svg>');fs.writeFileSync(path.join(out,file),pieces.join('\n')+'\n');
}
const D=M.lerp(B,C,.57),E=M.lerp(C,A,.44),F=M.lerp(A,B,.63);
figure('trig-ceva.svg','Sine ratios for three interior cevians','D, E, and F lie strictly inside BC, CA, AB. AD splits the angle at A into the marked angles BAD and DAC. Concurrence is not assumed.',[A,B,C],d=>{
 d.poly([A,B,D],blue);d.poly([A,D,C],teal);d.triangle();d.line(A,D,gold,2.3);d.line(B,E,teal,1.6);d.line(C,F,purple,1.6);d.point(D,'D',gold,0,24);d.point(E,'E',teal,16,-5);d.point(F,'F',purple,-17,0);d.arc(B,A,D,blue,27);d.arc(D,A,C,teal,38);
});
const mid=M.mid(B,C),sym=g.symmedianEnds[0],bis=M.lerp(B,C,g.sides[2]/(g.sides[1]+g.sides[2]));
figure('symmedian.svg','A median and its reflected ray','AM is a median. The dashed line is the internal angle bisector at A. Reflection in that line sends the ray AM to the symmedian AD.',[A,B,C],d=>{
 d.triangle();d.line(A,mid,blue,2.4);d.line(A,sym,teal,2.4);d.line(A,bis,gold,1.8,'5 5');d.point(mid,'M',blue,13,24);d.point(sym,'D',teal,-9,24);d.arc(mid,A,bis,blue,49);d.arc(bis,A,sym,teal,49);
});
const IA=g.excenters[0],ra=g.exradii[0],T=g.exTouches[0],U=M.foot(IA,A,C),V=M.foot(IA,A,B);
figure('excircle.svg','Contacts of the excircle opposite A','The excircle has center I_A and touches BC at its interior point T, ray AB beyond B at V, and ray AC beyond C at U. Radii to the contacts are perpendicular to the tangent lines.',[A,B,C,U,V,...bounds(IA,ra)],d=>{
 d.line(A,V,muted,1.5);d.line(A,U,muted,1.5);d.circle(IA,ra,teal);d.triangle();for(const [q,name,a,b]of [[T,'T',B,C],[U,'U',A,C],[V,'V',A,B]]){d.line(IA,q,gold,1.5,'4 4');d.right(q,IA,M.add(q,M.sub(b,a)));d.point(q,name,teal,name==='T'?0:name==='U'?17:-17,name==='T'?-12:12);}d.point(IA,'I_A',gold,19,16);
},560);
figure('gergonne.svg','Incircle contacts and the Gergonne cevians','The incircle touches BC, CA, AB at D, E, F. The contact cevians AD, BE, CF meet at G_e. They are distinct constructions from the angle bisectors used to find I.',[A,B,C],d=>{
 d.circle(g.I,g.r,gold);d.triangle();g.incTouches.forEach((q,i)=>{d.line(g.vertices[i],q,[blue,teal,purple][i],1.8);d.point(q,['D','E','F'][i],[blue,teal,purple][i],i===0?0:i===1?18:-18,i===0?24:-5);});d.point(g.Ge,'G_e',ink,22,-9);
});
const Z=g.incTouches[2];
figure('heron.svg','The two similarity comparisons in Heron’s proof','I is the incenter and E is the A-excenter. Z and V are their perpendicular feet on the full line AB, with Z between A and B and V beyond B. Triangles AZI and AVE share the bisected angle at A; triangles ZBI and VEB use the internal and external angle bisectors at B.',[A,B,C,U,V,...bounds(IA,ra)],d=>{
 d.poly([A,V,IA],teal,.06);d.poly([A,Z,g.I],blue,.16);d.poly([B,Z,g.I],purple,.13);d.line(A,V,muted,1.5);d.line(A,U,muted,1.5);d.circle(IA,ra,teal);d.circle(g.I,g.r,blue);d.triangle();d.line(A,IA,teal,1.5);d.line(B,IA,gold,1.8);d.line(B,g.I,purple,1.8);d.line(g.I,Z,blue,2.1);d.line(IA,V,teal,2.1);d.right(Z,g.I,A);d.right(V,IA,B);d.point(Z,'Z',blue,-17,0);d.point(V,'V',teal,-17,12);d.point(g.I,'I',blue,15,-3);d.point(IA,'E',teal,16,16);
},560);
console.log('Built five accessible homework figures from the shared geometry.');
