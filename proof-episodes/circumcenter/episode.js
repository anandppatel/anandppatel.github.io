(() => {
'use strict';
const {construct,clipLine,distance,midpoint}=window.CircumcenterGeometry;
const $=id=>document.getElementById(id);
const board=$('board'), svg=$('diagram'), buttons=[...document.querySelectorAll('.vertex')];
const colors=['#087c70','#8551bd','#315dcc'], gold='#ad660d';
const names=['A','B','C'], midNames=['D','E','F'];
const initial=[{x:.42,y:.15},{x:.16,y:.78},{x:.84,y:.72}];
let points=initial.map(p=>({...p})), size={width:1,height:1}, drag=null, lastPicked=-1;
let active=false, step=0, current=null;
const padding=38, clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const set=(el,attrs)=>Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));
const scaled=p=>({x:padding+p.x*(size.width-2*padding),y:padding+p.y*(size.height-2*padding)});
// Arrays are separate facts, not factors in a product.
function renderEquation(element, value) {
 if (!Array.isArray(value)) { element.textContent=value; return; }
 const list=document.createElement('ul');
 list.className='proof-facts';
 value.forEach(fact=>{const item=document.createElement('li');item.textContent=fact;list.appendChild(item);});
 element.replaceChildren(list);
}
const steps=[
 {stage:'The triangle',sentence:'Let ABC be a noncollinear triangle, with D, E, and F the midpoints of BC, CA, and AB.',equation:['BD = DC','CE = EA','AF = FB'],key:'Matching marks identify the two equal halves of each side.'},
 {stage:'A perpendicular bisector',sentence:'The perpendicular bisector of AB is the line through its midpoint F perpendicular to AB.',equation:'AF = FB, with a right angle at F',key:'Blue: the side AB and its perpendicular bisector; the square marks a right angle.'},
 {stage:'Equal distances · forward',sentence:'If P ≠ F lies on this line, triangles PFA and PFB are congruent by side–angle–side.',equation:['AF = BF','PF is shared','∠PFA = ∠PFB = 90°'],key:'Blue and teal: the two congruent triangles; P is a point on the bisector.'},
 {stage:'Equal distances · forward',sentence:'Therefore PA = PB, and this equality also holds when P = F.',equation:'PA = PB',key:'Gold: corresponding sides of the congruent triangles; at F, use AF = BF.'},
 {stage:'Equal distances · converse',sentence:'Conversely, if PA = PB and P is off the line AB, triangles PFA and PFB are congruent by side–side–side.',equation:['PA = PB','AF = BF','PF is shared'],key:'The equal-distance assumption and the midpoint give three equal pairs of sides.'},
 {stage:'Equal distances · converse',sentence:'Their angles at F are equal and sum to 180°, so PF is perpendicular to AB; if P lies on line AB, equal distances force P = F.',equation:'∠PFA = ∠PFB = 90°',key:'The adjacent right angles place P on the perpendicular bisector; the midpoint case follows directly.'},
 {stage:'The equal-distance fact',sentence:'Thus a point is equally far from A and B exactly when it lies on their perpendicular bisector.',equation:'PA = PB ⇔ P lies on the perpendicular bisector of AB',key:'Gold: equal distances; blue: the line they characterize; the same fact applies to any segment.'},
 {stage:'Construct O',sentence:'Since AB and AC are nonparallel, their perpendicular bisectors meet at a unique point O.',equation:'Two nonparallel lines determine O',key:'Blue and violet: the first two perpendicular bisectors; gold: their intersection O.'},
 {stage:'Three equal distances',sentence:'The two bisectors give OA = OB and OA = OC, so OA = OB = OC.',equation:'OA = OB = OC',key:'Gold: the three equal distances, with matching marks.'},
 {stage:'The third bisector',sentence:'Because OB = OC, the converse we proved places O on the perpendicular bisector of BC.',equation:'OB = OC ⇒ O lies on the third bisector',key:'Gold: OB and OC; teal: the perpendicular bisector through D.'},
 {stage:'The circumcenter',sentence:'All three perpendicular bisectors therefore meet uniquely at O, called the circumcenter.',equation:'O is the unique point with OA = OB = OC',key:'The three colored lines meet at the single gold point O.'},
 {stage:'The circumcircle',sentence:'The circle centered at O with radius OA passes through all three vertices.',equation:'Radius = OA = OB = OC',key:'Blue: the circumcircle; gold: its three equal radii.'}
];
function node(tag,attrs={},text){const el=document.createElementNS('http://www.w3.org/2000/svg',tag);set(el,attrs);if(text!==undefined)el.textContent=text;return el;}
function outside(p,w=size.width,h=size.height){return p.x<16||p.x>w-16||p.y<16||p.y>h-16;}
function labelPosition(p,center,amount=27){let dx=p.x-center.x,dy=p.y-center.y;const n=Math.hypot(dx,dy)||1;return {x:clamp(p.x+amount*dx/n,17,size.width-17),y:clamp(p.y+amount*dy/n+6,23,size.height-10)};}
function lemmaPoint(g){
 const a=g.vertices[0],b=g.vertices[1],f=g.midpoints[2],c=g.vertices[2];
 const length=distance(a,b),direction={x:-(b.y-a.y)/length,y:(b.x-a.x)/length};
 if((c.x-f.x)*direction.x+(c.y-f.y)*direction.y<0){direction.x*=-1;direction.y*=-1;}
 const bounds=clipLine(f,direction,size.width-20,size.height-20);
 const available=bounds?Math.max(...bounds.map(q=>(q.x-f.x)*direction.x+(q.y-f.y)*direction.y)):50;
 const offset=Math.max(3,Math.min(90,.22*Math.min(size.width,size.height),.65*available));
 return {x:f.x+offset*direction.x,y:f.y+offset*direction.y};
}
function paint(group,g,project,w,h,mini=false){
 group.replaceChildren();
 const add=(tag,attrs,text)=>{const el=node(tag,attrs,text);group.appendChild(el);return el;};
 const line=(p,q,color,width=2,extra={})=>add('line',{x1:p.x,y1:p.y,x2:q.x,y2:q.y,stroke:color,'stroke-width':width,'stroke-linecap':'round',...extra});
 const path=(v,attrs)=>add('path',{d:v.map((p,i)=>`${i?'L':'M'}${p.x} ${p.y}`).join(' ')+' Z',...attrs});
 const label=(p,text,color='#59647a',dx=10,dy=-10)=>add('text',{x:p.x+dx,y:p.y+dy,class:'svg-label',fill:color,'font-size':mini?14:19},text);
 const dot=(p,color,r=4)=>add('circle',{cx:p.x,cy:p.y,r,fill:color,stroke:'white','stroke-width':1.5});
 const tick=(p,q,color,count=1)=>{const m=midpoint(p,q),len=distance(p,q);if(len<8)return;const u={x:(q.x-p.x)/len,y:(q.y-p.y)/len};for(let j=0;j<count;j++){const shift=(j-(count-1)/2)*4;line({x:m.x+u.x*shift-u.y*4,y:m.y+u.y*shift+u.x*4},{x:m.x+u.x*shift+u.y*4,y:m.y+u.y*shift-u.x*4},color,1.7);}};
 const v=g.vertices.map(project), m=g.midpoints.map(project),o=g.center?project(g.center):null;
 const stage=active?step:-1, lemma=stage>=2&&stage<=6;
 const knownO=stage===-1||stage>=7;
 const valid=!g.degenerate;
 const circleVisible=valid&&(stage===-1||stage===11);
 if(circleVisible){
   const r=distance(o,v[0]);
   // Very large SVG circles lose precision in browsers; the whole-circle view remains exact at its own scale.
   if(r<1e5*Math.max(w,h))add('circle',{cx:o.x,cy:o.y,r,fill:'none',stroke:'#315dcc','stroke-width':stage===11?3:1.8,opacity:stage===11?.85:.35});
 }
 path(v,{fill:'#315dcc06',stroke:'#8691a5','stroke-width':1.7,opacity:active?.5:1});
 if(!valid)return;
 const p=lemma?project(lemmaPoint(g)):null;
 if(lemma&&[2,4,5].includes(stage)){
   path([p,m[2],v[0]],{fill:'#315dcc28',stroke:'#315dcc','stroke-width':2});
   path([p,m[2],v[1]],{fill:'#087c7028',stroke:'#087c70','stroke-width':2});
 }
 let shown=stage===-1||stage>=10?[0,1,2]:stage===0?[]:stage<=6?[2]:stage===7||stage===8?[1,2]:[0,1,2];
 if(stage===4)shown=[]; // The converse has not established a right angle yet.
 const lit=stage===-1?shown:stage===9?[0]:stage===11?[]:shown;
 shown.forEach(i=>{
   const a=v[(i+1)%3],b=v[(i+2)%3],dir={x:-(b.y-a.y),y:b.x-a.x};
   const segment=clipLine(m[i],dir,w,h);
   if(segment)line(...segment,colors[i],lit.includes(i)?2.7:1.5,{'stroke-dasharray':'7 6',opacity:lit.includes(i)?.9:.26});
 });
 const midShown=stage===0||stage===-1||stage>=9?[0,1,2]:stage<=6?[2]:[1,2];
 midShown.forEach(i=>{
   const a=v[(i+1)%3],b=v[(i+2)%3],color=colors[i];
   if(stage===0||stage<=2&&stage>=1){line(a,b,color,2.8);tick(a,m[i],color,i+1);tick(m[i],b,color,i+1);}
   if(lemma){tick(v[0],m[2],colors[2],3);tick(m[2],v[1],colors[2],3);}
   if(shown.includes(i)&&!mini){
     const len=distance(a,b),u={x:(b.x-a.x)/len,y:(b.y-a.y)/len},n={x:-u.y,y:u.x};
     const toward=lemma?p:o;
     if(toward&&(toward.x-m[i].x)*n.x+(toward.y-m[i].y)*n.y<0){n.x*=-1;n.y*=-1;}
     const s=8;
     const q1={x:m[i].x+s*u.x,y:m[i].y+s*u.y},q2={x:q1.x+s*n.x,y:q1.y+s*n.y},q3={x:m[i].x+s*n.x,y:m[i].y+s*n.y};
     add('path',{d:`M${q1.x} ${q1.y}L${q2.x} ${q2.y}L${q3.x} ${q3.y}`,fill:'none',stroke:color,'stroke-width':1.4,opacity:.85});
     if(stage===5){const z1={x:m[i].x-s*u.x,y:m[i].y-s*u.y},z2={x:z1.x+s*n.x,y:z1.y+s*n.y};add('path',{d:`M${z1.x} ${z1.y}L${z2.x} ${z2.y}L${q3.x} ${q3.y}`,fill:'none',stroke:color,'stroke-width':1.4});}
   }
   dot(m[i],color,mini?2.2:3);
   const merged=knownO&&distance(m[i],o)<.01;
   if(!mini&&!merged){const center={x:(v[0].x+v[1].x+v[2].x)/3,y:(v[0].y+v[1].y+v[2].y)/3};const pos=labelPosition(m[i],center,20);label(pos,midNames[i],color,0,0);}
 });
 if(lemma){
   line(p,m[2],'#59647a',2);
   [v[0],v[1]].forEach(q=>{line(p,q,gold,stage===3||stage===6?3.5:2.5);if(stage>=3)tick(p,q,gold);});
   dot(p,gold,4.5);label(p,'P',gold,10,-10);
 }
 if(knownO){
   const radii=stage===-1||stage===8||stage===11?[0,1,2]:stage===9?[1,2]:[];
   radii.forEach(i=>{line(o,v[i],gold,stage===-1?1.3:3,stage===-1?{opacity:.4,'stroke-dasharray':'3 5'}:{opacity:.85});tick(o,v[i],gold);});
   if(!outside(o,w,h)){
     add('circle',{cx:o.x,cy:o.y,r:mini?7:13,fill:'#efb057',opacity:.22});dot(o,gold,mini?3.5:5.5);
     const equalMid=m.findIndex((q,i)=>midShown.includes(i)&&distance(q,o)<.01);
     const coincident=equalMid>=0&&distance(g.midpoints[equalMid],g.center)<=1e-10*g.scale;
     const text=equalMid<0?'O':'O'+(coincident?' = ':' ≈ ')+midNames[equalMid];
     const candidates=[[14,-14],[-14,-14],[14,24],[-14,24]];
     const offset=candidates.reduce((best,delta)=>{const pt={x:o.x+delta[0],y:o.y+delta[1]};const score=Math.min(...v.concat(m).map(q=>distance(pt,q)));return !best||score>best.score?{delta,score}:best;},null).delta;
     add('text',{x:clamp(o.x+offset[0],12,w-12),y:clamp(o.y+offset[1],22,h-12),class:'svg-label center-label','text-anchor':offset[0]<0?'end':'start'},text);
   }else if(!mini){
     const c={x:w/2,y:h/2},dx=o.x-c.x,dy=o.y-c.y,t=Math.min((w/2-32)/Math.abs(dx),(h/2-30)/Math.abs(dy)),end={x:c.x+t*dx,y:c.y+t*dy},len=Math.hypot(dx,dy),u={x:dx/len,y:dy/len};
     line({x:end.x-22*u.x,y:end.y-22*u.y},end,gold,2.5);
     path([end,{x:end.x-8*u.x+4*u.y,y:end.y-8*u.y-4*u.x},{x:end.x-8*u.x-4*u.y,y:end.y-8*u.y+4*u.x}],{fill:gold});
     add('text',{x:clamp(end.x,50,w-50),y:clamp(end.y-15,18,h-14),class:'edge-label','text-anchor':'middle'},'toward O');
   }
 }
 if(mini)v.forEach((q,i)=>{dot(q,'#172035',2.7);label(q,names[i],'#172035',q.x<o.x?-13:6,q.y<o.y?-7:16);});
}
function draw(){
 if(size.width<=1)return;
 current=construct(points.map(scaled));const g=current;
 set(svg,{viewBox:`0 0 ${size.width} ${size.height}`});
 paint($('scene'),g,p=>p,size.width,size.height);
 const avg={x:g.vertices.reduce((s,p)=>s+p.x,0)/3,y:g.vertices.reduce((s,p)=>s+p.y,0)/3};
 g.vertices.forEach((p,i)=>{const pos=labelPosition(p,avg,29);buttons[i].style.left=p.x+'px';buttons[i].style.top=p.y+'px';buttons[i].style.setProperty('--label-x',pos.x-p.x+14+'px');buttons[i].style.setProperty('--label-y',pos.y-p.y+2+'px');});
 const off=g.center&&outside(g.center);
 $('overview').hidden=!off||(active&&step<7);
 const circleShown=!active||step===11;
 $('overview-caption').textContent=circleShown?'This smaller view shows the whole circle and the same triangle; keep moving the vertices above.':'This smaller view shows O and the same triangle; keep moving the vertices above.';
 $('overview-diagram').setAttribute('aria-label',circleShown?'Whole-circle view of the same triangle':'Smaller view of O and the same triangle');
 if(!$('overview').hidden){const zoom=78/g.radius;paint($('overview-scene'),g,p=>({x:110+(p.x-g.center.x)*zoom,y:100+(p.y-g.center.y)*zoom}),220,200,true);}
 $('notice').hidden=!g.near;
 $('notice').textContent=g.degenerate?'These vertices are collinear, coincident, or too close to collinear at drawing precision. A noncollinear triangle is required to define a unique circumcenter.':g.radius>1e5*Math.max(size.width,size.height)?'This triangle is almost flat; its circle is too large to draw accurately here. The smaller view shows the whole circle.':'This triangle is nearly flat; O may lie very far away, and the circle may extend beyond the drawing.';
 let location='';
 if(g.degenerate)location='Move a vertex off the line to recover a unique circumcenter.';
 else{
   const dots=g.vertices.map((p,i)=>{const q=g.vertices[(i+1)%3],r=g.vertices[(i+2)%3];return (q.x-p.x)*(r.x-p.x)+(q.y-p.y)*(r.y-p.y);});
   const minimum=Math.min(...dots),right=g.midpoints.some(m=>distance(m,g.center)<=1e-10*g.scale);
   location=right?'Right triangle: O is the midpoint of the hypotenuse.':minimum<0?'Obtuse triangle: O lies outside the triangle.':'Acute triangle: O lies inside the triangle.';
 }
 $('location').textContent=location;
 $('diagram-desc').textContent=g.degenerate?'Triangle ABC is degenerate at drawing precision; no unique circumcenter is drawn.':(active?steps[step].sentence+' ':'')+location+(off&&(!active||step>=7)?' O lies beyond the main drawing; a smaller view shows its true location.':'');
 $('proof-pause').hidden=!active||!g.degenerate;
 $('proof-equation').hidden=g.degenerate;
 $('proof-next').disabled=g.degenerate;
 return g;
}
function renderProof(){const s=steps[step];$('proof-stage').textContent=s.stage;$('proof-progress').textContent=`${step+1} / ${steps.length}`;$('proof-sentence').textContent=s.sentence;renderEquation($('proof-equation'),s.equation);$('proof-key').textContent=s.key;$('proof-prev').disabled=step===0;$('proof-next').textContent=step===steps.length-1?'Replay proof':'Next sentence';draw();}
function announce(){ $('announcement').textContent=current.degenerate?'No unique circumcenter at drawing precision.':`Triangle updated. ${$('location').textContent}`; }
function move(index,x,y){points[index]={x:clamp((x-padding)/(size.width-2*padding),0,1),y:clamp((y-padding)/(size.height-2*padding),0,1)};draw();}
buttons.forEach((button,index)=>{
 button.addEventListener('pointerdown',event=>{
   if(drag||event.button!==0)return;
   const rect=board.getBoundingClientRect(),x=event.clientX-rect.left,y=event.clientY-rect.top;
   const distances=points.map(scaled).map(p=>Math.hypot(x-p.x,y-p.y)),nearest=Math.min(...distances),candidates=distances.flatMap((d,i)=>Math.abs(d-nearest)<.5?[i]:[]);
   const chosen=candidates[(candidates.indexOf(lastPicked)+1)%candidates.length],p=scaled(points[chosen]),target=buttons[chosen];lastPicked=chosen;
   drag={index:chosen,pointerId:event.pointerId,dx:x-p.x,dy:y-p.y};target.setPointerCapture(event.pointerId);target.classList.add('dragging');target.focus({preventScroll:true});event.preventDefault();
 });
 button.addEventListener('pointermove',event=>{if(!drag||drag.index!==index||drag.pointerId!==event.pointerId)return;const rect=board.getBoundingClientRect();move(index,event.clientX-rect.left-drag.dx,event.clientY-rect.top-drag.dy);});
 const end=event=>{if(!drag||drag.index!==index||drag.pointerId!==event.pointerId)return;drag=null;button.classList.remove('dragging');if(button.hasPointerCapture(event.pointerId))button.releasePointerCapture(event.pointerId);announce();};
 ['pointerup','pointercancel','lostpointercapture'].forEach(name=>button.addEventListener(name,end));
 button.addEventListener('keydown',event=>{const d={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];if(!d)return;event.preventDefault();const p=scaled(points[index]),n=event.shiftKey?20:4;move(index,p.x+d[0]*n,p.y+d[1]*n);announce();});
});
$('reset').addEventListener('click',()=>{points=initial.map(p=>({...p}));draw();announce();});
$('proof-start').addEventListener('click',()=>{active=true;step=0;$('workspace').classList.add('proving');$('proof-panel').hidden=false;$('proof-start').setAttribute('aria-expanded','true');renderProof();board.scrollIntoView({block:'start',behavior:'instant'});$('proof-next').focus({preventScroll:true});});
$('proof-close').addEventListener('click',()=>{active=false;$('workspace').classList.remove('proving');$('proof-panel').hidden=true;$('proof-start').setAttribute('aria-expanded','false');draw();$('proof-start').focus({preventScroll:true});});
$('proof-prev').addEventListener('click',()=>{if(step>0){step--;renderProof();}});
$('proof-next').addEventListener('click',()=>{if(current?.degenerate)return;step=(step+1)%steps.length;renderProof();});
new ResizeObserver(entries=>{const {width,height}=entries[0].contentRect;if(width<=2*padding||height<=2*padding)return;size={width,height};draw();}).observe(board);
})();
