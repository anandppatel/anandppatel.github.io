/* Independent, lazily initialized experiments below the synthetic proofs. */
(function(){
'use strict';
const M=window.EpisodeMath,F=window.PhysicalModels;
if(!M||!F)return;
const NS='http://www.w3.org/2000/svg',names=['A','B','C'];
const models=new Set(['centroid','circumcenter','incenter','symmedian','gergonne','nagel','orthocenter','nine-point','rotating']);
let sequence=0;
const el=(tag,attributes={},text)=>{const e=document.createElement(tag);for(const [k,v]of Object.entries(attributes))e.setAttribute(k,v);if(text!==undefined)e.textContent=text;return e;};
const fmt=(value,digits=3)=>Number.isFinite(value)?String(Number(value.toFixed(digits))):'—';
function initialize(slot){
 if(slot.dataset.physicalReady==='true')return;
 const model=slot.dataset.physicalModel;if(!models.has(model))return;
 slot.dataset.physicalReady='true';
 const id='physical-'+(++sequence),probeModels=new Set(['centroid','circumcenter','symmedian','gergonne','orthocenter','nine-point']);
 let vertices=F.copyPreset('acute'),probe={x:0,y:0},parameter=model==='circumcenter'?.65:model==='rotating'?Number(slot.dataset.initialLambda||0):.35,start=0,bounds=null,drag=null;
 if(!Number.isFinite(parameter))parameter=0;
 parameter=M.clamp(parameter,0,model==='rotating'?2:1);
 const toolbar=el('div',{class:'physical-toolbar'}),controls=el('div',{class:'physical-controls'});
 const shapeLabel=el('label',{},'Starting shape'),shape=el('select',{'aria-label':'Experiment starting shape','data-control':'shape'});
 for(const [value,label]of [['acute','Acute'],['right','Right'],['obtuse','Obtuse'],['equilateral','Equilateral'],['flat','Flat — recover by dragging']])shape.append(el('option',{value},label));
 shape.append(el('option',{value:'custom',disabled:''},'Custom (moved vertices)'));shapeLabel.append(shape);toolbar.append(shapeLabel);
 const fitButton=el('button',{type:'button','data-action':'fit'},'Fit experiment');
 const resetButton=el('button',{type:'button','data-action':'reset'},'Reset experiment');toolbar.append(fitButton,resetButton);
 const board=el('div',{class:'physical-board'}),svg=document.createElementNS(NS,'svg');
 svg.setAttribute('class','physical-diagram');svg.setAttribute('role','img');svg.setAttribute('aria-labelledby',id+'-title '+id+'-description');board.append(svg);
 const notice=el('p',{class:'physical-notice',role:'status',hidden:''}),readout=el('p',{class:'physical-readout','aria-live':'polite','aria-atomic':'true'});
 const units=model==='circumcenter'?'R is the circumradius and v the signal speed.':model==='incenter'?'r is the inradius.':model==='rotating'?'k is the common spring stiffness; λ = mω²/k.':['centroid','symmedian','gergonne'].includes(model)?'L is the longest original side and k the common spring stiffness.':'L is the longest original side.';
 const hint=el('p',{class:'physical-hint'},'This board is independent of the proof. Drag A, B, C'+(probeModels.has(model)?' or the blue probe P':'')+'. Focus a point and use the arrow keys; Shift moves farther. Fit experiment changes the view. '+units+' The symbol ≈ joins labels too close to separate at drawing precision.');
 slot.append(toolbar,board,notice,controls,readout,hint);
 if(model==='rotating'){
  const legend=el('p',{class:'physical-legend'});legend.append(el('span',{class:'physical-spring-key'},'Spring resultant'),el('span',{class:'physical-rotation-key'},'Centrifugal force'),el('span',{},'One shared arrow scale'));
  slot.insertBefore(legend,readout);
 }
 const handles={};
 for(const name of [...names,...(probeModels.has(model)?['P']:[])]){
  const h=el('button',{class:'physical-handle',type:'button','aria-label':name==='P'?'Move probe P using the arrow keys':'Move vertex '+name+' using the arrow keys','data-handle':name});
  board.append(h);handles[name]=h;
 }
 let slider=null,value=null,startSelect=null;
 const sliderConfig={circumcenter:['Wave time, in circumradius travel times',0,1.5],incenter:['Inward travel, as a fraction of the inradius',0,1],nagel:['Each walker’s travel, as a fraction of half the perimeter',0,1],rotating:['Rotation parameter λ',0,2]}[model];
 if(model==='nagel'){
  const label=el('label',{},'Starting vertex');startSelect=el('select',{'aria-label':'Walkers starting vertex','data-control':'start'});
  names.forEach((n,i)=>startSelect.append(el('option',{value:i},n)));label.append(startSelect);controls.append(label);
  startSelect.addEventListener('change',()=>{start=Number(startSelect.value);draw();});
 }
 if(sliderConfig){
  const label=el('label',{class:'physical-slider',for:id+'-parameter'}),caption=el('span',{},sliderConfig[0]+' ');value=el('output',{class:'physical-value'});caption.append(value);
  slider=el('input',{type:'range',id:id+'-parameter',min:sliderConfig[1],max:sliderConfig[2],step:.01,value:parameter,'data-control':'parameter'});
  label.append(caption,slider);controls.append(label);slider.addEventListener('input',()=>{parameter=Number(slider.value);draw();});
 }
 const actionButtons=[];
 function action(text,actionName,fn){const button=el('button',{type:'button','data-action':actionName},text);button.addEventListener('click',fn);controls.append(button);actionButtons.push(button);return button;}
 if(probeModels.has(model))action(model==='circumcenter'?'Put receiver at O':model==='nine-point'?'Balance at N':model==='orthocenter'?'Locate pulley equilibrium':'Locate equilibrium','equilibrium',()=>{const g=M.triangle(vertices),target=targetOf(g);if(target)probe={...target};draw();});
 if(model==='incenter')action('Advance to last point','last-point',()=>{parameter=1;if(slider)slider.value=parameter;draw();});
 if(model==='nagel')action('Walk to the meeting','meeting',()=>{parameter=1;if(slider)slider.value=parameter;draw();});
 if(model==='rotating')for(const [i,name]of ['G','N','H'].entries())action(name,'snap-'+name,()=>{parameter=i;slider.value=parameter;draw();});
 function targetOf(g){
  if(g.degenerate)return null;
  return ({centroid:g.G,circumcenter:g.O,incenter:g.I,symmedian:g.K,gergonne:g.Ge,nagel:g.Na,'nine-point':g.N,rotating:g.H})[model]||(model==='orthocenter'?F.pulleyTarget(g).point:null);
 }
 function resetProbe(){const g=M.triangle(vertices);probe=g.degenerate?M.mul(M.add(M.add(...vertices.slice(0,2)),vertices[2]),1/3):M.add(g.G,{x:.13*g.scale,y:-.08*g.scale});}
 function circleExtent(center,radius){return [{x:center.x-radius,y:center.y-radius},{x:center.x+radius,y:center.y+radius}];}
 function extent(g){
  let points=[...vertices];if(probeModels.has(model))points.push(probe);if(g.degenerate)return points;
  points.push(targetOf(g));
  if(model==='circumcenter')for(const v of vertices)points.push(...circleExtent(v,parameter*g.R));
  if(model==='nine-point')points.push(g.O,g.H);
  if(model==='orthocenter')points.push(g.H);
  if(model==='rotating')points.push(g.O,g.G,g.N,g.H,M.add(g.H,M.mul(M.sub(g.H,g.O),.44)));
  if(model==='symmedian'||model==='gergonne'){
   const data=F.sideSprings(g,probe,model==='gergonne');if(data)points.push(...data.feet);
  }
  return points.filter(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y));
 }
 function fit(){
  const points=extent(M.triangle(vertices)),xs=points.map(p=>p.x),ys=points.map(p=>p.y);
  const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys),span=Math.max(maxX-minX,maxY-minY,1);
  bounds={cx:(minX+maxX)/2,cy:(minY+maxY)/2,dx:Math.max(maxX-minX,.3*span),dy:Math.max(maxY-minY,.3*span)};
  draw();
 }
 function transform(){
  const width=Math.max(220,board.clientWidth),height=board.clientHeight;
  const factor=Math.min((width-94)/bounds.dx,(height-98)/bounds.dy);
  return {width,height,factor,to:p=>({x:width/2+(p.x-bounds.cx)*factor,y:height/2-(p.y-bounds.cy)*factor}),
   from:p=>({x:bounds.cx+(p.x-width/2)/factor,y:bounds.cy-(p.y-height/2)/factor})};
 }
 let currentTransform=null;
 function draw(){
  if(!bounds)return;
  const g=M.triangle(vertices),tr=transform();currentTransform=tr;
  svg.setAttribute('viewBox',`0 0 ${tr.width} ${tr.height}`);svg.replaceChildren();
  const labelPoints=[],outputs=[];
  function node(tag,attributes={},text){const n=document.createElementNS(NS,tag);Object.entries(attributes).forEach(([k,v])=>n.setAttribute(k,v));if(text!==undefined)n.textContent=text;svg.append(n);return n;}
  node('title',{id:id+'-title'},'Independent '+model+' experiment');
  node('desc',{id:id+'-description'},'Move the triangle vertices and use the controls to compare the physical model with its geometric center. Degenerate triangles pause the model.');
  const screen=p=>tr.to(p);
  function segment(a,b,style='phys-structure'){const p=screen(a),q=screen(b);node('line',{x1:p.x,y1:p.y,x2:q.x,y2:q.y,class:style});}
  function polygon(points,style){node('polygon',{points:points.map(p=>{const q=screen(p);return q.x+','+q.y;}).join(' '),class:style});}
  function path(points,style){node('polyline',{points:points.map(p=>{const q=screen(p);return q.x+','+q.y;}).join(' '),class:style});}
  function circle(center,radius,style){const p=screen(center);node('circle',{cx:p.x,cy:p.y,r:Math.max(0,radius*tr.factor),class:style});}
  function point(p,name,style='phys-target',radius=4){const q=screen(p);node('circle',{cx:q.x,cy:q.y,r:radius,class:style,'data-point':name});if(name)labelPoints.push({point:q,names:[name]});}
  function line(a,b){const d=M.unit(M.sub(b,a)),length=Math.hypot(tr.width,tr.height)/tr.factor;segment(M.add(a,M.mul(d,-length)),M.add(a,M.mul(d,length)),'phys-rail');}
  function coil(a,b){
   const p=screen(a),q=screen(b),delta=M.sub(q,p),length=M.norm(delta);if(length<2)return;
   const u=M.mul(delta,1/length),v=M.perp(u),lead=Math.min(11,length*.2),turns=Math.max(3,Math.min(12,Math.floor(length/10))),points=[p,M.add(p,M.mul(u,lead))];
   for(let i=1;i<2*turns;i++)points.push(M.add(M.add(p,M.mul(u,lead+(length-2*lead)*i/(2*turns))),M.mul(v,(i%2?1:-1)*Math.min(3,length/10))));
   points.push(M.add(q,M.mul(u,-lead)),q);node('polyline',{points:points.map(r=>r.x+','+r.y).join(' '),class:'phys-spring'});
  }
  function arrow(a,vector,factor=1,style='phys-force'){
   const p=screen(a),q=screen(M.add(a,M.mul(vector,factor))),d=M.sub(q,p),length=M.norm(d);if(length<.8)return;
   node('line',{x1:p.x,y1:p.y,x2:q.x,y2:q.y,class:style});
   const u=M.mul(d,1/length),v=M.perp(u),back=M.add(q,M.mul(u,-7));
   node('polyline',{points:[M.add(back,M.mul(v,3)),q,M.add(back,M.mul(v,-3))].map(r=>r.x+','+r.y).join(' '),class:style});
  }
  polygon(vertices,model==='gergonne'?'phys-muted':model==='centroid'?'phys-plate':'phys-structure');
  let text='',modelNotice='';
  if(!g.degenerate){
   if(model==='centroid'){
    const data=F.vertexSprings(g,probe),minimum=F.vertexSprings(g,g.G).energy;
    vertices.forEach(v=>coil(v,probe));arrow(probe,data.force,.3);point(g.G,'G');
    const p=screen(probe);node('polygon',{points:`${p.x},${p.y+9} ${p.x-8},${p.y+22} ${p.x+8},${p.y+22}`,class:'phys-blue'});
    text=`Three equal zero-natural-length springs. U / (kL²) ≈ ${fmt(data.energy/g.scale**2)}; minimum ≈ ${fmt(minimum/g.scale**2)}. Resultant / (kL) ≈ ${fmt(M.norm(data.force)/g.scale)}.`;
   }else if(model==='circumcenter'){
    const data=F.arrivals(g,probe,parameter);
    vertices.forEach((v,i)=>{circle(v,data.radius,data.arrived[i]?'phys-blue':'phys-muted');segment(v,probe,data.arrived[i]?'phys-blue':'phys-muted');});point(g.O,'O');
    text=`Equal-speed signals: arrival times / (R/v) ≈ ${data.distances.map(d=>fmt(d/g.R)).join(', ')} from A, B, C. Arrival-time spread / (R/v) ≈ ${fmt(data.spread/g.R)}. ${data.arrived.filter(Boolean).length} of 3 have reached P.`;
   }else if(model==='incenter'){
    const data=F.inwardFront(g,parameter);if(parameter<1)polygon(data.vertices,'phys-green');
    g.mids.forEach((p,i)=>{const q=M.foot(g.I,vertices[(i+1)%3],vertices[(i+2)%3]);arrow(q,M.mul(M.unit(M.sub(g.I,q)),data.distance),1,'phys-blue');});point(g.I,'I');
    text=`All three supporting lines move inward at the same speed. Distance traveled / r = ${fmt(parameter,2)}; remaining area / original area ≈ ${fmt(data.area/g.area)}.${parameter===1?' The front has collapsed to I.':''}`;
   }else if(model==='symmedian'||model==='gergonne'){
    const contact=model==='gergonne',data=F.sideSprings(g,probe,contact);
    if(data){
     if(contact){circle(g.I,g.r,'phys-muted');vertices.forEach((p,i)=>segment(p,g.incTouches[i],'phys-muted'));polygon(g.incTouches,'phys-structure');g.incTouches.forEach((p,i)=>point(p,['D','E','F'][i],'phys-anchor',3));}
     data.rails.vertices.forEach((p,i)=>line(data.rails.vertices[(i+1)%3],data.rails.vertices[(i+2)%3]));
     data.feet.forEach((q,i)=>{coil(probe,q);point(q,'','phys-collar',3.5);});arrow(probe,data.force,.65);point(data.target,contact?'Ge':'K');
     const minimum=F.sideSprings(g,data.target,contact).energy;
     text=`Three equal perpendicular springs to ${contact?'the contact triangle’s':'the triangle’s'} full side lines. U / (kL²) ≈ ${fmt(data.energy/g.scale**2)}; minimum ≈ ${fmt(minimum/g.scale**2)}. Resultant / (kL) ≈ ${fmt(M.norm(data.force)/g.scale)}.`;
    }else modelNotice='The contact triangle is below numerical drawing precision. Move a vertex to continue.';
   }else if(model==='nagel'){
    const data=F.walkers(g,start,parameter);
    vertices.forEach((p,i)=>{segment(p,g.exTouches[i],'phys-muted');point(g.exTouches[i],['D','E','F'][i],'phys-target',3);});
    path(data.first.route,'phys-blue');path(data.second.route,'phys-gold');point(data.first.point,'1','phys-bead',5);point(data.second.point,'2','phys-collar',5);point(g.Na,'Na');
    text=`Walkers start at ${names[start]} and travel in opposite directions. Each has traveled ${fmt(parameter,2)} of the semiperimeter. Separation / L ≈ ${fmt(M.dist(data.first.point,data.second.point)/g.scale)}.${parameter===1?' They meet at the perimeter-halving point on the opposite side.':''}`;
   }else if(model==='orthocenter'){
    const data=F.pulley(g,probe),target=data.target;
    vertices.forEach((v,i)=>{segment(v,probe,'phys-spring');arrow(probe,data.forces[i],.26,'phys-blue');});
    point(g.H,'H');if(target.kind!=='acute')point(target.point,'equilibrium','phys-target',5);
    const minimum=F.pulley(g,target.point).energy;
    text=`Tensions a : b : c ≈ ${g.sides.map(a=>fmt(a/g.scale)).join(' : ')}. Weighted length / L² ≈ ${fmt(data.energy/g.scale**2)}; minimum ≈ ${fmt(minimum/g.scale**2)}. ${data.force?'Resultant / largest tension ≈ '+fmt(M.norm(data.force)/g.scale)+'.':'At a vertex, the corresponding string direction is undefined; the corner can supply the remaining force.'}`;
    if(target.kind==='obtuse')modelNotice=`The triangle is obtuse at ${names[target.index]}. The positive-weight pulley system settles at that vertex; it does not select the exterior orthocenter H.`;
    else if(target.kind==='right')modelNotice=`The right-angle vertex ${names[target.index]} is both H and the limiting pulley equilibrium.`;
   }else if(model==='nine-point'){
    const data=F.fourMasses(g,probe);vertices.forEach(v=>segment(v,g.H,'phys-muted'));data.masses.forEach((p,i)=>point(p,i===3?'H':'','phys-anchor',6));segment(g.O,g.H,'phys-muted');point(g.O,'O');point(g.N,'N');segment(probe,g.N,'phys-blue');
    const p=screen(probe);node('polygon',{points:`${p.x},${p.y+9} ${p.x-9},${p.y+24} ${p.x+9},${p.y+24}`,class:'phys-blue'});
    text=`Four equal point masses occupy A, B, C, H. Center-of-mass offset from support P, divided by L, ≈ ${fmt(data.distance/g.scale)}. At N the support is directly under their center of mass.`;
   }else if(model==='rotating'){
    const data=F.rotating(g,parameter);vertices.forEach(v=>coil(v,data.point));segment(g.O,g.H,'phys-muted');
    arrow(data.point,F.vertexSprings(g,data.point).force,.22,'phys-blue');arrow(data.point,data.centrifugal,.22,'phys-gold');
    ['O','G','N','H'].forEach(n=>point(g[n],n));point(data.point,'P','phys-bead',7);
    text=`Exact equilibrium in the rotating frame; this is not a time simulation. λ = ${fmt(parameter,2)}${[0,1,2].includes(parameter)?'; P is '+['G','N','H'][parameter]:''}. Restoring stiffness / k = ${fmt(data.stiffness,2)}.`;
   }
  }
  names.forEach((name,i)=>point(vertices[i],name,'phys-anchor',4));
  if(probeModels.has(model)&&!g.degenerate)point(probe,'P','phys-bead',6);
  for(const [name,h]of Object.entries(handles)){
   const p=screen(name==='P'?probe:vertices[names.indexOf(name)]);
   h.style.left=p.x+'px';h.style.top=p.y+'px';h.hidden=(name==='P'&&g.degenerate)||p.x<0||p.x>tr.width||p.y<0||p.y>tr.height;
   h.setAttribute('aria-label',(name==='P'?'Move probe P':'Move vertex '+name)+'. Arrow keys move; Shift moves farther.');
  }
  // Nearby labels explicitly use approximation; no distance threshold asserts equality.
  const groups=[];
  for(const item of labelPoints){const found=groups.find(gp=>M.dist(gp.point,item.point)<8);if(found){for(const n of item.names)if(!found.names.includes(n))found.names.push(n);}else groups.push(item);}
  groups.sort((a,b)=>b.names.join('').length-a.names.join('').length);
  const placed=[];
  const overlap=(a,b)=>Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));
  groups.forEach((group,index)=>{
   const label=node('text',{'text-anchor':'middle'},group.names.join(' ≈ ')),tw=label.getComputedTextLength()||group.names.join(' ≈ ').length*7,p=group.point;
   let best=null;
   for(const radius of [19,32,47,62])for(let i=0;i<12;i++){
    const angle=-Math.PI/2+(i+index%2*6)*Math.PI/6,x=p.x+Math.cos(angle)*(radius+tw*.3),y=p.y+Math.sin(angle)*radius;
    const box={x:x-tw/2-3,y:y-10,w:tw+6,h:20};let score=radius*.2+i*.03;
    if(box.x<4||box.y<3||box.x+box.w>tr.width-4||box.y+box.h>tr.height-3)score+=1e6;
    placed.forEach(b=>score+=overlap(box,b)*30);groups.forEach(q=>{if(q!==group)score+=overlap(box,{x:q.point.x-8,y:q.point.y-8,w:16,h:16})*10;});
    if(!best||score<best.score)best={x,y,score,box};
   }
   label.setAttribute('x',best.x);label.setAttribute('y',best.y+4);placed.push(best.box);
  });
  const outside=extent(g).some(p=>{const q=screen(p);return q.x<8||q.y<8||q.x>tr.width-8||q.y>tr.height-8;});
  const warnings=[];
  if(g.degenerate)warnings.push('The vertices are collinear or coincide. The physical model is paused; drag a vertex off the line or choose another shape to recover.');
  else if(g.near)warnings.push('The triangle is nearly flat. Values are sensitive to small movements; measurements are numerical, not a proof.');
  if(modelNotice)warnings.push(modelNotice);
  if(outside&&!g.degenerate)warnings.push('Some construction lies outside this fixed view. Use Fit experiment to include it.');
  notice.hidden=warnings.length===0;notice.textContent=warnings.join(' ');
  readout.textContent=g.degenerate?'Model quantities are undefined in this configuration.':text;
  actionButtons.forEach(b=>b.disabled=g.degenerate);if(slider){slider.disabled=g.degenerate;value.textContent=fmt(parameter,2);}
  if(startSelect)startSelect.disabled=g.degenerate;
  slot.dataset.degenerate=String(g.degenerate);slot.dataset.parameter=String(parameter);slot.dataset.lambda=model==='rotating'?String(parameter):'';slot.dataset.model=model;slot.dataset.shape=shape.value;
 }
 function move(name,p){if(name==='P')probe=p;else{vertices[names.indexOf(name)]=p;shape.value='custom';}draw();}
 function coordinates(event){const r=board.getBoundingClientRect();return currentTransform.from({x:event.clientX-r.left,y:event.clientY-r.top});}
 for(const [name,h]of Object.entries(handles)){
  h.addEventListener('pointerdown',event=>{if(event.button!==0)return;event.preventDefault();h.focus({preventScroll:true});drag={name,id:event.pointerId};h.setPointerCapture(event.pointerId);});
  h.addEventListener('pointermove',event=>{if(drag&&drag.name===name&&drag.id===event.pointerId)move(name,coordinates(event));});
  const end=()=>{drag=null;};h.addEventListener('pointerup',end);h.addEventListener('pointercancel',end);h.addEventListener('lostpointercapture',end);
  h.addEventListener('keydown',event=>{
   const directions={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,1],ArrowDown:[0,-1]};if(!directions[event.key])return;event.preventDefault();
   const [dx,dy]=directions[event.key],p=name==='P'?probe:vertices[names.indexOf(name)],step=(event.shiftKey?15:3)/currentTransform.factor;
   move(name,{x:p.x+step*dx,y:p.y+step*dy});
  });
 }
 shape.addEventListener('change',()=>{vertices=F.copyPreset(shape.value);resetProbe();fit();});
 fitButton.addEventListener('click',fit);
 resetButton.addEventListener('click',()=>{vertices=F.copyPreset('acute');shape.value='acute';resetProbe();parameter=model==='rotating'?M.clamp(Number(slot.dataset.initialLambda)||0,0,2):model==='circumcenter'?.65:.35;if(slider)slider.value=parameter;start=0;if(startSelect)startSelect.value=0;fit();});
 resetProbe();fit();new ResizeObserver(()=>draw()).observe(board);
 // Read-only state access supports browser regression checks without a second geometry implementation.
 const getState=()=>({vertices:vertices.map(p=>({...p})),probe:{...probe},parameter,start,bounds:{...bounds},model,shape:shape.value});
 slot.physicalExperiment={state:getState};
 slot.__physicalDemo={getState,setVertices:next=>{
  if(!Array.isArray(next)||next.length!==3||!next.every(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)))throw new TypeError('Three finite vertices are required.');
  vertices=next.map(p=>({...p}));shape.value='custom';draw();
 }};
}
function discover(){document.querySelectorAll('.physical-demo[data-physical-model]').forEach(slot=>{
 const details=slot.closest('details');
 if(!details||details.open)initialize(slot);
 if(details)details.addEventListener('toggle',()=>{if(details.open)initialize(slot);});
});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',discover,{once:true});else discover();
})();
