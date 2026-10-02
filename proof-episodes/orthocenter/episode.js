(() => {
'use strict';
const {construct,clipLine,distance,midpoint}=window.OrthocenterGeometry;
const $=id=>document.getElementById(id);
const board=$('board'),svg=$('diagram'),buttons=[...document.querySelectorAll('.vertex')];
const colors=['#315dcc','#087c70','#8551bd'],gold='#ad660d',names=['A','B','C'],outerNames=['P','Q','R'];
const initial=[{x:.42,y:.15},{x:.16,y:.78},{x:.84,y:.72}];
let points=initial.map(p=>({...p})),size={width:1,height:1},camera={x:.5,y:.5,zoom:1};
let drag=null,lastPicked=-1,active=false,step=0,current=null,buildCount=0;
const padding=38,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const set=(el,attrs)=>Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));
const scaled=p=>({x:padding+(.5+(p.x-camera.x)*camera.zoom)*(size.width-2*padding),y:padding+(.5+(p.y-camera.y)*camera.zoom)*(size.height-2*padding)});
// Arrays are separate facts, not factors in a product.
function renderEquation(element, value) {
 if (!Array.isArray(value)) { element.textContent=value; return; }
 const list=document.createElement('ul');
 list.className='proof-facts';
 value.forEach(fact=>{const item=document.createElement('li');item.textContent=fact;list.appendChild(item);});
 element.replaceChildren(list);
}
const buildStages=[{"label":"Draw the altitude from A","caption":"Mark the perpendicular foot A₁ on line BC and draw the altitude line through A."},{"label":"Draw the altitude from B","caption":"Mark the perpendicular foot B₁ on line CA and draw the altitude line through B."},{"label":"Mark intersection H","caption":"Name the intersection of the first two altitude lines H."},{"label":"Check the altitude from C","caption":"Mark the foot C₁ and draw the third altitude line; it also passes through H. The proof explains why."}];
const buildButtons=[];
const steps=[
 {stage:'The triangle',sentence:'Let ABC be a noncollinear triangle.',equation:'A, B, and C do not lie on one line',key:'The original triangle is outlined in blue.'},
 {stage:'An altitude line',sentence:'An altitude line passes through a vertex and is perpendicular to the line containing the opposite side.',equation:'The altitude from A is perpendicular to BC',key:'Blue: the altitude from A; the square marks its right angle with BC or its extension.'},
 {stage:'A larger triangle',sentence:'The lines through A, B, and C parallel to BC, CA, and AB are pairwise nonparallel, so they have unique pairwise intersections P, Q, and R as shown.',equation:['QR ∥ BC','RP ∥ CA','PQ ∥ AB'],key:'The view widens to show the construction; each colored pair of lines is parallel.'},
 {stage:'The first parallelogram',sentence:'ABCQ is a parallelogram, so its opposite sides AQ and BC have equal length.',equation:'AQ = BC',key:'Blue: parallelogram ABCQ; gold: its equal opposite sides AQ and BC.'},
 {stage:'The second parallelogram',sentence:'ACBR is also a parallelogram, so AR has the same length as BC.',equation:'AR = BC',key:'Teal: parallelogram ACBR; gold: its equal opposite sides AR and BC.'},
 {stage:'A is a midpoint',sentence:'The two parallelograms place Q and R on opposite rays from A, with AQ = AR, so A is the midpoint of QR.',equation:'Q — A — R, with AQ = AR',key:'Gold: the equal halves of QR; A lies between Q and R.'},
 {stage:'All three midpoints',sentence:'The same argument at B and C makes B the midpoint of RP and C the midpoint of PQ.',equation:['RB = BP','PC = CQ'],key:'Matching marks show that A, B, and C are the three side midpoints of PQR.'},
 {stage:'A genuine triangle',sentence:'PQR is noncollinear, since otherwise its midpoints A, B, and C would lie on one line.',equation:'Noncollinear ABC ⇒ noncollinear PQR',key:'The larger triangle is illuminated together with its three side midpoints.'},
 {stage:'The first bisector',sentence:'Because QR is parallel to BC and A is its midpoint, the altitude from A is the perpendicular bisector of QR.',equation:['AQ = AR','The altitude from A is perpendicular to QR'],key:'Blue: the same line is an altitude of ABC and a perpendicular bisector of PQR.'},
 {stage:'The other two bisectors',sentence:'Likewise, the altitudes from B and C are the perpendicular bisectors of RP and PQ.',equation:['The altitude from B is perpendicular to RP','The altitude from C is perpendicular to PQ'],key:'Teal and violet: the other two altitude lines; all three now bisect sides of PQR.'},
 {stage:'Use the circumcenter',sentence:'The circumcenter theorem gives a unique common point H of the three perpendicular bisectors of PQR.',equation:'H is the circumcenter of PQR',key:'Gold: H and its equal distances to P, Q, and R; the earlier episode proves this theorem.'},
 {stage:'The orthocenter',sentence:'These are exactly the altitude lines of ABC, so their unique intersection H is its orthocenter.',equation:'H is the orthocenter of ABC',key:'The original triangle returns to the foreground; its three altitude lines meet at H.'}
];
function node(tag,attrs={},text){const el=document.createElementNS('http://www.w3.org/2000/svg',tag);set(el,attrs);if(text!==undefined)el.textContent=text;return el;}
function outside(p,w=size.width,h=size.height){return p.x<17||p.x>w-17||p.y<17||p.y>h-17;}
function fitConstruction(){
 const outer=construct(points).outer;
 const minX=Math.min(...outer.map(p=>p.x)),maxX=Math.max(...outer.map(p=>p.x));
 const minY=Math.min(...outer.map(p=>p.y)),maxY=Math.max(...outer.map(p=>p.y));
 const span=Math.max(maxX-minX,maxY-minY);
 if(span>1e-10)camera={x:(minX+maxX)/2,y:(minY+maxY)/2,zoom:Math.min(1e4,.88/span)};
}
function fitTriangle(){
 const minX=Math.min(...points.map(p=>p.x)),maxX=Math.max(...points.map(p=>p.x));
 const minY=Math.min(...points.map(p=>p.y)),maxY=Math.max(...points.map(p=>p.y));
 const span=Math.max(maxX-minX,maxY-minY);
 if(span>1e-10)camera={x:(minX+maxX)/2,y:(minY+maxY)/2,zoom:Math.min(1e4,.76/span)};
}
function paint(group,g,project,w,h,mini=false){
 group.replaceChildren();
 const add=(tag,attrs,text)=>{const el=node(tag,attrs,text);group.appendChild(el);return el;};
 const line=(p,q,color,width=2,extra={})=>add('line',{x1:p.x,y1:p.y,x2:q.x,y2:q.y,stroke:color,'stroke-width':width,'stroke-linecap':'round',...extra});
 const path=(v,attrs)=>add('path',{d:v.map((p,i)=>`${i?'L':'M'}${p.x} ${p.y}`).join(' ')+' Z',...attrs});
 const dot=(p,color,r=4,attrs={})=>add('circle',{cx:p.x,cy:p.y,r,fill:color,stroke:'white','stroke-width':1.5,...attrs});
 const label=(p,text,color,dx=10,dy=-10,attrs={})=>add('text',{x:p.x+dx,y:p.y+dy,class:'svg-label',fill:color,...attrs},text);
 const infinite=(p,dir,color,width,attrs={})=>{const ends=clipLine(p,dir,w,h);if(ends)line(...ends,color,width,attrs);};
 const tick=(p,q,color,count=1)=>{const len=distance(p,q);if(len<8)return;const m=midpoint(p,q),u={x:(q.x-p.x)/len,y:(q.y-p.y)/len};for(let j=0;j<count;j++){const s=(j-(count-1)/2)*4;line({x:m.x+s*u.x-4*u.y,y:m.y+s*u.y+4*u.x},{x:m.x+s*u.x+4*u.y,y:m.y+s*u.y-4*u.x},color,1.7,{'data-part':'equality-mark'});}};
 const rightAngle=(f,a,b,toward,color,part)=>{
   const length=distance(a,b);if(length<1)return;
   const u={x:(b.x-a.x)/length,y:(b.y-a.y)/length},n={x:-(b.y-a.y)/length,y:(b.x-a.x)/length};
   if((toward.x-f.x)*n.x+(toward.y-f.y)*n.y<0){n.x*=-1;n.y*=-1;}
   const s=mini?5:(part.startsWith('bisector-angle')||v.some(point=>distance(point,f)<18)?16:8),q1={x:f.x+s*u.x,y:f.y+s*u.y},q2={x:f.x+s*(u.x+n.x),y:f.y+s*(u.y+n.y)},q3={x:f.x+s*n.x,y:f.y+s*n.y};
   add('path',{d:`M${q1.x} ${q1.y}L${q2.x} ${q2.y}L${q3.x} ${q3.y}`,fill:'none',stroke:color,'stroke-width':1.5,'data-part':part});
 };
 const v=g.vertices.map(project),outer=g.outer.map(project),center=g.center?project(g.center):null,feet=g.feet.map(project);
 const stage=active?step:-1,aux=active&&stage>=2,knownH=active?stage>=10:buildCount>=3;
 const [a,b,c]=v,[p,q,r]=outer;
 if(aux&&!g.degenerate){
   path(outer,{fill:stage===7?'#315dcc10':'none',stroke:'#b4bed0','stroke-width':1.8,opacity:stage===11?.25:1,'data-part':'outer-triangle'});
   [0,1,2].forEach(i=>{
     const j=(i+1)%3,k=(i+2)%3;
     if(stage>=6){tick(outer[j],v[i],colors[i],i+1);tick(v[i],outer[k],colors[i],i+1);}
   });
 }
 path(v,{fill:active&&stage>=2&&stage<=10?'#17203503':'#315dcc09',stroke:!active||stage===0||stage===11?'#315dcc':'#8a95aa','stroke-width':!active||stage===0||stage===11?2.5:1.6,'data-part':'triangle'});
 if(g.degenerate)return;
 if(stage===2||stage===8||stage===9){
   const pairs=stage===2?[0,1,2]:stage===8?[0]:[1,2];
   pairs.forEach(i=>{const j=(i+1)%3,k=(i+2)%3;line(outer[j],outer[k],colors[i],3,{'data-part':`outer-side-${i}`});line(v[j],v[k],colors[i],2.5,{'data-part':`parallel-side-${i}`});});
 }
 if(stage===3){path([a,b,c,q],{fill:'#315dcc25',stroke:'#315dcc','stroke-width':2,'data-part':'parallelogram-ABCQ'});line(a,q,gold,4);line(b,c,gold,4);tick(a,q,gold);tick(b,c,gold);}
 if(stage===4){path([a,c,b,r],{fill:'#087c7025',stroke:'#087c70','stroke-width':2,'data-part':'parallelogram-ACBR'});line(a,r,gold,4);line(b,c,gold,4);tick(a,r,gold);tick(b,c,gold);}
 if(stage===5){line(q,r,gold,4,{'data-part':'midpoint-A'});tick(q,a,gold);tick(a,r,gold);}
 const altitudeIndices=!active?(buildCount>=4?[0,1,2]:buildCount>=2?[0,1]:buildCount>=1?[0]:[]):stage>=9?[0,1,2]:stage===1||stage===8?[0]:[];
 altitudeIndices.forEach(i=>{
   const j=(i+1)%3,k=(i+2)%3,dir={x:-(v[k].y-v[j].y),y:v[k].x-v[j].x};
   const emphasized=stage!==9||i!==0;
   infinite(v[i],dir,colors[i],emphasized?2.7:1.8,{'data-part':`altitude-${i}`,opacity:emphasized?.95:.35});
   if(stage===-1||stage===1||stage===11){
     const side={x:v[k].x-v[j].x,y:v[k].y-v[j].y};
     infinite(v[j],side,'#9da7b8',1.2,{'stroke-dasharray':'3 5',opacity:.55,'data-part':`side-extension-${i}`});
     rightAngle(feet[i],v[j],v[k],v[i],colors[i],`altitude-foot-${i}`);
   }
   if(stage>=8&&stage<=10){rightAngle(v[i],outer[j],outer[k],center,colors[i],`bisector-angle-${i}`);}
 });
 if(!active){
   const groups=[];
   altitudeIndices.forEach(i=>{const f=feet[i],existing=groups.find(q=>distance(q.point,f)<.01);if(existing)existing.names.push(['A₁','B₁','C₁'][i]);else groups.push({point:f,names:[['A₁','B₁','C₁'][i]],index:i});});
   groups.forEach(item=>{dot(item.point,colors[item.index],mini?2.5:3.5,{'data-part':`altitude-foot-point-${item.index}`});if(knownH&&distance(item.point,center)<.01)return;const atVertex=v.findIndex(q=>distance(q,item.point)<.01),text=item.names.join(' ≈ ')+(atVertex<0?'':' ≈ '+names[atVertex]);label(item.point,text,colors[item.index],mini?5:12,mini?-8:-18,{'data-part':'altitude-foot-label'});});
 }
 if(aux){
   const outerCenter={x:(p.x+q.x+r.x)/3,y:(p.y+q.y+r.y)/3};
   outer.forEach((point,i)=>{
     if(outside(point,w,h))return;
     dot(point,'#65728a',mini?2.5:3.5,{'data-part':`outer-vertex-${i}`});
     const dx=point.x-outerCenter.x,dy=point.y-outerCenter.y,len=Math.hypot(dx,dy)||1;
     label(point,outerNames[i],'#59647a',15*dx/len,15*dy/len+5,{'text-anchor':'middle','data-part':`outer-label-${i}`});
   });
 }
 if(stage===10)outer.forEach(point=>{line(center,point,gold,1.8,{opacity:.7,'stroke-dasharray':'3 5','data-part':'outer-radius'});tick(center,point,gold);});
 if(knownH){
   if(!outside(center,w,h)){
     add('circle',{cx:center.x,cy:center.y,r:mini?8:13,fill:'#efb057',opacity:.24});dot(center,gold,mini?4:5.5,{'data-part':'orthocenter'});
     const nearVertex=v.findIndex(point=>distance(point,center)<.01);
     const exact=nearVertex>=0&&distance(g.vertices[nearVertex],g.center)<=1e-10*g.scale;
     const text=nearVertex<0?'H':'H'+(exact?' = ':' ≈ ')+names[nearVertex];
     const candidates=[[18,-20],[-18,-20],[18,28],[-18,28]];
     const estimate=mini?text.length*8:text.length*12;
     const best=candidates.map(delta=>{const pt={x:center.x+delta[0],y:center.y+delta[1]},anchor=delta[0]<0?'end':'start';const fits=pt.y>18&&pt.y<h-8&&(anchor==='start'?pt.x+estimate<w-8:pt.x-estimate>8);return {delta,anchor,score:Math.min(...v.concat(aux?outer:[]).map(q=>distance(pt,q)))+(fits?1000:0)};}).sort((x,y)=>y.score-x.score)[0];
     label(center,text,gold,best.delta[0],best.delta[1],{class:'svg-label center-label','text-anchor':best.anchor,'data-part':'orthocenter-label'});
   }else if(!mini){
     const mid={x:w/2,y:h/2},dx=center.x-mid.x,dy=center.y-mid.y,t=Math.min((w/2-32)/Math.abs(dx),(h/2-30)/Math.abs(dy)),end={x:mid.x+t*dx,y:mid.y+t*dy},len=Math.hypot(dx,dy),u={x:dx/len,y:dy/len};
     line({x:end.x-22*u.x,y:end.y-22*u.y},end,gold,2.5);
     path([end,{x:end.x-8*u.x+4*u.y,y:end.y-8*u.y-4*u.x},{x:end.x-8*u.x-4*u.y,y:end.y-8*u.y+4*u.x}],{fill:gold});
     add('text',{x:clamp(end.x,50,w-50),y:clamp(end.y-15,18,h-14),class:'edge-label','text-anchor':'middle','data-part':'offscreen-H'},'toward H');
   }
 }
 if(mini)v.forEach((point,i)=>{dot(point,'#172035',2.7);label(point,names[i],'#172035',point.x<w/2?-11:7,point.y<h/2?-7:16);});
}
function draw(){
 if(size.width<=1)return;
 current=construct(points.map(scaled));const g=current;
 set(svg,{viewBox:`0 0 ${size.width} ${size.height}`});
 paint($('scene'),g,p=>p,size.width,size.height);
 const avg={x:g.vertices.reduce((s,p)=>s+p.x,0)/3,y:g.vertices.reduce((s,p)=>s+p.y,0)/3};
 g.vertices.forEach((p,i)=>{const dx=p.x-avg.x,dy=p.y-avg.y,len=Math.hypot(dx,dy)||1;const x=clamp(p.x+29*dx/len,17,size.width-17),y=clamp(p.y+29*dy/len+6,23,size.height-10);buttons[i].style.left=p.x+'px';buttons[i].style.top=p.y+'px';buttons[i].style.setProperty('--label-x',x-p.x+14+'px');buttons[i].style.setProperty('--label-y',y-p.y+2+'px');});
 const aux=active&&step>=2,knownH=active?step>=10:buildCount>=3;
 const revealedFeet=!active?g.feet.slice(0,buildCount>=4?3:buildCount>=2?2:buildCount>=1?1:0):[];
 const offFeet=revealedFeet.some(p=>outside(p));
 const offH=knownH&&g.center&&outside(g.center),offAux=aux&&g.outer.some(p=>outside(p));
 $('overview').hidden=g.degenerate||(!offH&&!offAux&&!offFeet);
 if(!$('overview').hidden){
   const all=[...g.vertices,...revealedFeet,...(aux?g.outer:[]),...(knownH?[g.center]:[])];
   const minX=Math.min(...all.map(p=>p.x)),maxX=Math.max(...all.map(p=>p.x)),minY=Math.min(...all.map(p=>p.y)),maxY=Math.max(...all.map(p=>p.y));
   const zoom=Math.min(168/Math.max(maxX-minX,1),148/Math.max(maxY-minY,1)),cx=(minX+maxX)/2,cy=(minY+maxY)/2;
   paint($('overview-scene'),g,p=>({x:110+(p.x-cx)*zoom,y:100+(p.y-cy)*zoom}),220,200,true);
   $('overview-title').textContent=offH?'H is beyond the main drawing.':offFeet?'An altitude foot is beyond the drawing.':'Part of the construction is beyond the drawing.';
   $('overview-caption').textContent=knownH?'This smaller view shows H and the revealed construction; keep moving the vertices above.':offFeet?'This smaller view shows the altitude feet constructed so far; keep moving the vertices above.':'This smaller view shows all of PQR; use “Fit construction” to bring it into the main drawing.';
 }
 $('notice').hidden=!g.near;
 $('notice').textContent=g.degenerate?'These vertices are collinear, coincident, or too close to collinear at drawing precision. Move a vertex off the line to continue.':knownH?'This triangle is nearly flat; H may lie very far away, and the altitude lines may be hard to distinguish.':'This triangle is nearly flat; keep its vertices noncollinear as you build.';
 let location='Move a vertex off the line to recover a unique orthocenter.';
 if(!g.degenerate){
   const right=g.vertices.findIndex(p=>distance(p,g.center)<=1e-10*g.scale);
   const minimum=Math.min(...g.vertices.map((p,i)=>{const q=g.vertices[(i+1)%3],r=g.vertices[(i+2)%3];return (q.x-p.x)*(r.x-p.x)+(q.y-p.y)*(r.y-p.y);}));
   location=right>=0?`Right triangle: H is the right-angle vertex ${names[right]}.`:minimum<0?'Obtuse triangle: H lies outside the triangle.':'Acute triangle: H lies inside the triangle.';
 }
 $('location').textContent=location;$('location').hidden=!knownH;$('legend').hidden=active||!knownH;
 $('diagram-desc').textContent=g.degenerate?'Triangle ABC is degenerate at drawing precision; move a vertex off the line to continue.':(active?steps[step].sentence:buildCount?buildStages[buildCount-1].caption:'Triangle ABC with no construction yet.')+(knownH?' '+location:'')+(offH?' H lies beyond the main drawing; a smaller view shows its true location.':'');
 $('proof-pause').hidden=!active||!g.degenerate;$('proof-equation').hidden=g.degenerate;$('proof-next').disabled=g.degenerate;$('fit').hidden=!aux;
 renderBuild();
 return g;
}
function renderBuild(){
 const complete=buildCount===buildStages.length,blocked=!!current?.degenerate;
 $('build-panel').hidden=active;if(active)$('workspace').classList.remove('building');else $('workspace').classList.add('building');
 $('build-progress').textContent=`${buildCount} / ${buildStages.length}`;
 const caption=blocked?'Move a vertex off the line to continue the construction.':buildCount?buildStages[buildCount-1].caption:'Start with triangle ABC. Use the buttons in order to add one piece at a time.';if($('build-caption').textContent!==caption)$('build-caption').textContent=caption;
 buildButtons.forEach((button,i)=>{const n=i+1;button.disabled=n>buildCount+1||(blocked&&n>buildCount);button.setAttribute('aria-pressed',String(n<=buildCount));for(const [name,on] of [['is-done',n<=buildCount],['is-current',n===buildCount],['is-next',n===buildCount+1]]){if(on)button.classList.add(name);else button.classList.remove(name);}});
 $('build-prev').disabled=buildCount===0;$('build-reset').disabled=buildCount===0;
 $('proof-explanation').hidden=!complete;$('proof-start').hidden=!complete;$('proof-start').disabled=!complete||blocked;
}
function exitProof(){active=false;$('workspace').classList.remove('proving');$('proof-panel').hidden=true;$('proof-start').setAttribute('aria-expanded','false');}
function clearBuild(){exitProof();buildCount=0;draw();}
buildStages.forEach((stage,i)=>{const button=document.createElement('button');button.type='button';button.textContent=`${i+1}. ${stage.label}`;button.setAttribute('data-build-step',String(i+1));button.addEventListener('click',()=>{const n=i+1;if(active||n>buildCount+1||(current?.degenerate&&n>buildCount))return;buildCount=n;draw();board.scrollIntoView({block:'start',behavior:'instant'});});$('build-steps').appendChild(button);buildButtons.push(button);});
$('build-prev').addEventListener('click',()=>{if(active||buildCount===0)return;buildCount--;draw();});
$('build-reset').addEventListener('click',()=>{clearBuild();});
function renderProof(){const s=steps[step];$('proof-stage').textContent=s.stage;$('proof-progress').textContent=`${step+1} / ${steps.length}`;$('proof-sentence').textContent=s.sentence;renderEquation($('proof-equation'),s.equation);$('proof-key').textContent=s.key;$('proof-prev').disabled=step===0;$('proof-next').textContent=step===steps.length-1?'Replay proof':'Next sentence';draw();}
function announce(){$('announcement').textContent=current.degenerate?'Move a vertex off the line to continue.':`Triangle updated. ${active||buildCount>=3?$('location').textContent:$('build-caption').textContent}`;}
function move(index,x,y){
 points[index]={x:camera.x+((clamp(x,padding,size.width-padding)-padding)/(size.width-2*padding)-.5)/camera.zoom,y:camera.y+((clamp(y,padding,size.height-padding)-padding)/(size.height-2*padding)-.5)/camera.zoom};draw();
}
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
$('reset').addEventListener('click',()=>{points=initial.map(p=>({...p}));camera={x:.5,y:.5,zoom:1};clearBuild();announce();});
$('fit').addEventListener('click',()=>{fitConstruction();draw();});
$('proof-start').addEventListener('click',()=>{if(buildCount!==buildStages.length||current?.degenerate)return;active=true;step=0;$('workspace').classList.add('proving');$('proof-panel').hidden=false;$('proof-start').setAttribute('aria-expanded','true');renderProof();board.scrollIntoView({block:'start',behavior:'instant'});$('proof-next').focus({preventScroll:true});});
$('proof-close').addEventListener('click',()=>{active=false;fitTriangle();$('workspace').classList.remove('proving');$('proof-panel').hidden=true;$('proof-start').setAttribute('aria-expanded','false');draw();$('proof-start').focus({preventScroll:true});});
$('proof-prev').addEventListener('click',()=>{if(step>0){step--;renderProof();}});
$('proof-next').addEventListener('click',()=>{if(current?.degenerate)return;step=(step+1)%steps.length;if(step===2)fitConstruction();if(step===0)fitTriangle();renderProof();});
new ResizeObserver(entries=>{const {width,height}=entries[0].contentRect;if(width<=2*padding||height<=2*padding)return;size={width,height};draw();}).observe(board);
})();
