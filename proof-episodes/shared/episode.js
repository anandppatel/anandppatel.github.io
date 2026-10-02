(() => {
'use strict';
const C=window.ProofEpisode,M=window.EpisodeMath,$=id=>document.getElementById(id),NS='http://www.w3.org/2000/svg';
const studio=!!C.studio,B=window.EpisodeConstructions?.[C.slug];
const colors={blue:'#315dcc',teal:'#087c70',purple:'#8551bd',gold:'#ad660d',ink:'#26364b',muted:'#9aa5b8',red:'#b54152'};
const initial=C.initial||[{x:-.25,y:-.7},{x:-.9,y:.55},{x:.85,y:.55}];
let vertices=initial.map(p=>({...p})),params={...C.params},active=false,step=0,buildLevel=0,current=null,drag=null,lastPicked=null;
let width=1,height=1,camera={x:0,y:-.075,w:2.2,h:1.65},handleMap=new Map();
const board=$('board'),svg=$('diagram'),handleButtons=new Map(),ranges=new Map(),actionButtons=[],buildButtons=[];
const value=(v,g=current)=>typeof v==='function'?v(g,params):v;
const finite=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
function element(tag,attrs={},text){const e=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));if(text!==undefined)e.textContent=text;return e;}
function projection(w=width,h=height,cam=camera){const scale=Math.min((w-72)/cam.w,(h-72)/cam.h);return {scale,project:p=>({x:w/2+(p.x-cam.x)*scale,y:h/2+(p.y-cam.y)*scale}),unproject:p=>({x:cam.x+(p.x-w/2)/scale,y:cam.y+(p.y-h/2)/scale})};}
function fit(points){const valid=points.filter(finite);if(!valid.length)return;const xs=valid.map(p=>p.x),ys=valid.map(p=>p.y),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys),span=Math.max(x1-x0,y1-y0,.05);camera={x:(x0+x1)/2,y:(y0+y1)/2,w:Math.max(x1-x0,.12*span)*1.12,h:Math.max(y1-y0,.12*span)*1.12};}
function extent(){let raw=vertices;if(!current?.degenerate){if(active||studio)raw=C.extent?C.extent(current,params,active?step:-1):vertices;else if(buildLevel&&B?.extent)raw=B.extent(current,params,buildLevel,M);}return [...vertices,...(raw||[])].filter(finite);}
function clip(a,b,w,h){const v=M.sub(b,a);let lo=-Infinity,hi=Infinity;for(const [p,d,max]of [[a.x,v.x,w],[a.y,v.y,h]]){if(Math.abs(d)<1e-12){if(p<0||p>max)return null;}else{let u=-p/d,t=(max-p)/d;if(u>t)[u,t]=[t,u];lo=Math.max(lo,u);hi=Math.min(hi,t);}}return lo<=hi&&Number.isFinite(lo)&&Number.isFinite(hi)?[M.add(a,M.mul(v,lo)),M.add(a,M.mul(v,hi))]:null;}
function painter(group,w,h,cam,mini=false){
 const {scale,project}=projection(w,h,cam),labels=[];
 const add=(tag,attrs,text)=>{const e=element(tag,attrs,text);group.append(e);return e;};
 const pixelLine=(a,b,color,lineWidth,opts={})=>add('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:color,'stroke-width':lineWidth,'stroke-linecap':'round',...opts});
 const d={colors};
 d.segment=(a,b,color=colors.blue,lineWidth=3,opts={})=>{if(finite(a)&&finite(b))pixelLine(project(a),project(b),color,mini?Math.min(lineWidth,1.7):lineWidth,{'data-part':'segment',...opts});};
 d.line=(a,b,color=colors.blue,lineWidth=2,opts={})=>{if(!finite(a)||!finite(b))return;const ends=clip(project(a),project(b),w,h);if(ends)pixelLine(...ends,color,mini?1.2:lineWidth,{'data-part':'line',...opts});};
 d.poly=(points,color=colors.blue,opacity=.15,opts={})=>{if(!points.every(finite))return;add('polygon',{points:points.map(project).map(p=>`${p.x},${p.y}`).join(' '),fill:color,'fill-opacity':opacity,stroke:color,'stroke-width':mini?1:1.7,'data-part':'area',...opts});};
 d.circle=(center,r,color=colors.gold,lineWidth=2,opts={})=>{if(!finite(center)||!Number.isFinite(r)||r<=0)return;const p=project(center);add('circle',{cx:p.x,cy:p.y,r:r*scale,fill:'none',stroke:color,'stroke-width':mini?1.2:lineWidth,'data-part':'circle',...opts});};
 d.label=(point,text,color=colors.ink,opts={})=>{
   if(!finite(point))return;const p=project(point);if(p.x<-25||p.x>w+25||p.y<-25||p.y>h+25)return;
   const {dx=12,dy=-10,...attrs}=opts;let x=p.x+(mini?dx*.6:dx),y=p.y+(mini?dy*.6:dy);
   const labelWidth=String(text).length*(mini?7:9),labelHeight=mini?13:18;
   if(!attrs['text-anchor']){x=M.clamp(x,4,Math.max(4,w-labelWidth-4));y=M.clamp(y,labelHeight,h-4);}
   // Preserve deliberate offsets; displace a later label only if it would cover an earlier one.
   if(!mini)for(let tries=0;tries<4&&labels.some(q=>Math.abs(y-q.y)<17&&x<q.x+q.width&&q.x<x+labelWidth);tries++)y=M.clamp(y+19,labelHeight,h-4);
   labels.push({x,y,width:labelWidth});add('text',{x,y,fill:color,class:'svg-label'+(mini?' small':''),'data-part':'label',...attrs},text);
 };
 d.point=(point,text,color=colors.gold,opts={})=>{
   if(!finite(point))return;const p=project(point);if(p.x<-12||p.x>w+12||p.y<-12||p.y>h+12)return;
   add('circle',{cx:p.x,cy:p.y,r:mini?6:10,fill:color,opacity:.12,'data-part':'point-halo'});
   add('circle',{cx:p.x,cy:p.y,r:mini?2.7:4.1,fill:color,stroke:'white','stroke-width':1.2,'data-part':opts['data-part']||`point-${text}`});
   d.label(point,text,color,opts);
 };
 d.tick=(a,b,color=colors.gold,count=1)=>{if(!finite(a)||!finite(b))return;const aa=project(a),bb=project(b),len=M.dist(aa,bb);if(len<8)return;const u=M.unit(M.sub(bb,aa)),n=M.perp(u),m=M.mid(aa,bb);for(let j=0;j<count;j++){const p=M.add(m,M.mul(u,4*(j-(count-1)/2)));pixelLine(M.add(p,M.mul(n,mini?3:5)),M.sub(p,M.mul(n,mini?3:5)),color,mini?1:1.7,{'data-part':'equal-length'});}};
 d.right=(f,a,b,color=colors.blue)=>{if(![f,a,b].every(finite))return;const ff=project(f),aa=project(a),bb=project(b);if(M.dist(ff,aa)<.01||M.dist(ff,bb)<.01)return;const u=M.unit(M.sub(aa,ff)),v=M.unit(M.sub(bb,ff)),s=mini?5:10,p=M.add(ff,M.mul(u,s)),q=M.add(p,M.mul(v,s)),r=M.add(ff,M.mul(v,s));add('path',{d:`M${p.x},${p.y} L${q.x},${q.y} L${r.x},${r.y}`,fill:'none',stroke:color,'stroke-width':1.6,'data-part':'right-angle'});};
 d.angle=(a,b,c,color=colors.blue,opts={})=>{if(![a,b,c].every(finite))return;const aa=project(a),bb=project(b),cc=project(c);if(M.dist(aa,bb)<.01||M.dist(cc,bb)<.01)return;const r=(opts.radius||24)*(mini?.6:1),u=M.unit(M.sub(aa,bb)),v=M.unit(M.sub(cc,bb)),p=M.add(bb,M.mul(u,r)),q=M.add(bb,M.mul(v,r)),sweep=M.cross(u,v)>0?1:0;add('path',{d:`M${p.x},${p.y} A${r},${r} 0 0 ${sweep} ${q.x},${q.y}`,fill:'none',stroke:color,'stroke-width':mini?1.2:2,'data-part':opts['data-part']||'angle'});if(opts.label){const direction=M.unit(M.add(u,v)),place=M.add(b,M.mul(direction,(r+13)/scale));d.label(place,opts.label,color,{dx:-4,dy:4});}};
 return d;
}
function paint(group,w,h,cam,mini=false){
 group.replaceChildren();const d=painter(group,w,h,cam,mini);
 d.poly(vertices,colors.muted,.025,{'data-part':'triangle',stroke:active?'#b6bfce':'#69788f','stroke-width':1.7});
 if(!current.degenerate){if(active||studio)C.draw(d,current,active?step:-1,params,M);else if(buildLevel&&B)B.draw(d,current,buildLevel,params,M);}
 if(mini)vertices.forEach((p,i)=>d.point(p,'ABC'[i],colors.ink));
}
function updateGeometry(){
 if(C.constrain){const next=C.constrain(vertices,params,active,step,M);if(next&&next.length===3&&next.every(finite))vertices=next;}
 if(!active&&!studio&&B?.constrain){const next=B.constrain(vertices,params,buildLevel,M);if(next&&next.length===3&&next.every(finite))vertices=next;}
 current=M.triangle(vertices);
 if(!current.degenerate&&C.compute)Object.assign(current,C.compute(current,params,M));
}
function facts(container,f){container.replaceChildren();if(Array.isArray(f)){const ul=document.createElement('ul');ul.className='proof-facts';for(const text of f){const li=document.createElement('li');li.textContent=text;ul.append(li);}container.append(ul);}else container.textContent=f||'';container.hidden=!f||(Array.isArray(f)&&!f.length);}
function render(){
 if(width<=1)return;$('workspace').classList.toggle('building',!active&&!studio);updateGeometry();
 svg.setAttribute('viewBox',`0 0 ${width} ${height}`);paint($('scene'),width,height,camera);
 syncHandles();
 const reason=current.degenerate?'The vertices are collinear or coincident at drawing precision; move a vertex off the line to continue.':active&&C.steps[step].guard?C.steps[step].guard(current,params):'';
 $('notice').hidden=!current.near;
 $('notice').textContent=current.degenerate?'A noncollinear triangle is required. The proof pauses until the triangle recovers.':'This triangle is nearly flat. Some constructed points can lie far beyond the triangle; use Fit construction to see them.';
 $('status').textContent=current.degenerate?'Move any vertex to recover the construction.':!active&&!studio?(buildLevel===0?'Triangle ABC only. Choose the first construction step below.':B?.status?B.status(current,params,buildLevel,M):'Move any vertex; the revealed construction follows the triangle.'):C.status?C.status(current,params,active,step):'Drag A, B, or C; the construction follows the triangle.';
 renderBuild();
 if(active){
   const s=C.steps[step];$('proof-stage').textContent=s.title;$('proof-progress').textContent=`${step+1} / ${C.steps.length}`;
   // Dynamic formulas may require a genuine triangle, so keep the last sentence during a collapse.
   if(!current.degenerate){$('proof-sentence').textContent=value(s.text);facts($('proof-equation'),value(s.facts));$('proof-key').textContent=value(s.key)||'The highlighted construction matches this sentence.';}
   else if(!$('proof-sentence').textContent)$('proof-sentence').textContent='Let ABC be a noncollinear triangle.';
   $('proof-pause').textContent=reason||'';$('proof-pause').hidden=!reason;$('proof-equation').hidden=!!reason||!value(s.facts,current.degenerate?{}:current);
   $('proof-prev').disabled=step===0;$('proof-next').disabled=!!reason;$('proof-next').textContent=step===C.steps.length-1?'Replay proof':'Next sentence';
   $('after-question').hidden=step!==C.steps.length-1;$('after-question').textContent=C.after;
 }
 for(const [id,input]of ranges){if(input.type==='checkbox')input.checked=!!params[id];else input.value=params[id];input.disabled=active;}
 for(const [button,action]of actionButtons)button.hidden=(!studio&&!active&&buildLevel<(B?.steps.length||0))||(active&&action.hideInProof);
 $('extra-controls').hidden=(!ranges.size||C.controlsTarget)&&actionButtons.every(([button])=>button.hidden);
 const bounds=extent(),pr=projection(),off=bounds.some(p=>{const q=pr.project(p);return q.x<15||q.x>width-15||q.y<15||q.y>height-15;});
 $('overview').hidden=!off||current.degenerate;
 if(off&&!current.degenerate){const saved=camera;fit(bounds);const overviewCam=camera;camera=saved;paint($('overview-scene'),220,165,overviewCam,true);}
 $('diagram-desc').textContent=reason||[C.observation,active?value(C.steps[step].text):studio?C.prediction:buildLevel?value(B.steps[buildLevel-1].text):'Triangle ABC with no construction yet',$('status').textContent].join(' ');
}
function moveHandle(id,point){const handle=handleMap.get(id);if(!handle)return;if(handle.vertex!==undefined)vertices[handle.vertex]=point;else handle.move(point);render();}
function positionHandle(button,point,center){const p=projection().project(point),direction=M.unit(M.sub(point,center));button.style.left=p.x+'px';button.style.top=p.y+'px';button.style.setProperty('--lx',(14+direction.x*27)+'px');button.style.setProperty('--ly',(15+direction.y*28)+'px');button.hidden=p.x<-20||p.x>width+20||p.y<-20||p.y>height+20;}
function attachHandle(button,id){
 button.addEventListener('pointerdown',event=>{
   if(drag||event.button!==0)return;const rect=board.getBoundingClientRect(),mouse={x:event.clientX-rect.left,y:event.clientY-rect.top},project=projection().project;
   const distances=[...handleMap].map(([key,h])=>({id:key,d:M.dist(mouse,project(h.point))})),min=Math.min(...distances.map(q=>q.d)),candidates=distances.filter(q=>q.d<min+.5).map(q=>q.id);
   const chosen=candidates[(candidates.indexOf(lastPicked)+1)%candidates.length],h=handleMap.get(chosen),target=handleButtons.get(chosen),screen=project(h.point);lastPicked=chosen;
   drag={id:chosen,pointerId:event.pointerId,dx:mouse.x-screen.x,dy:mouse.y-screen.y};target.setPointerCapture(event.pointerId);target.classList.add('dragging');target.focus({preventScroll:true});event.preventDefault();
 });
 button.addEventListener('pointermove',event=>{if(!drag||drag.id!==id||drag.pointerId!==event.pointerId)return;const r=board.getBoundingClientRect(),p={x:M.clamp(event.clientX-r.left-drag.dx,18,width-18),y:M.clamp(event.clientY-r.top-drag.dy,18,height-18)};moveHandle(id,projection().unproject(p));});
 const end=event=>{if(!drag||drag.id!==id||drag.pointerId!==event.pointerId)return;drag=null;button.classList.remove('dragging');if(button.hasPointerCapture(event.pointerId))button.releasePointerCapture(event.pointerId);$('announcement').textContent=$('status').textContent;};
 for(const name of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(name,end);
 button.addEventListener('keydown',event=>{const vector={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];if(!vector)return;event.preventDefault();const h=handleMap.get(id);if(!h)return;const px=projection().project(h.point),amount=event.shiftKey?20:4;moveHandle(id,projection().unproject({x:M.clamp(px.x+vector[0]*amount,18,width-18),y:M.clamp(px.y+vector[1]*amount,18,height-18)}));$('announcement').textContent=$('status').textContent;});
}
function syncHandles(){
 const center=M.mul(vertices.reduce((p,q)=>M.add(p,q),{x:0,y:0}),1/3);
 const handles=vertices.map((point,i)=>({id:'ABC'[i],point,vertex:i,label:`Vertex ${'ABC'[i]}. Drag or use arrow keys.`}));
 if(!current.degenerate&&C.handles){const extra=C.handles(current,params,M),ids=!studio&&!active?(B?.handleIds?.(buildLevel)||[]):null;handles.push(...extra.filter(h=>ids===null||ids.includes(h.id)));}
 handleMap=new Map(handles.map(h=>[h.id,h]));
 for(const [id,button]of handleButtons)if(!handleMap.has(id)){button.remove();handleButtons.delete(id);}
 for(const h of handles){let button=handleButtons.get(h.id);if(!button){button=document.createElement('button');button.type='button';button.className=h.vertex!==undefined?'vertex':'side-handle';button.dataset.handle=h.id;const span=document.createElement('span');span.textContent=h.id;button.append(span);button.setAttribute('aria-describedby','keyboard-help');board.append(button);handleButtons.set(h.id,button);attachHandle(button,h.id);}button.setAttribute('aria-label',h.label||`Point ${h.id}. Drag or use arrow keys.`);positionHandle(button,h.point,center);}
}
const controlGroups=new Map();
for(const ctrl of C.controls||[]){
 if(params[ctrl.id]===undefined)params[ctrl.id]=ctrl.value;
 let target=$(C.controlsTarget||'extra-controls');
 if(ctrl.group){if(!controlGroups.has(ctrl.group)){const fieldset=document.createElement('fieldset'),legend=document.createElement('legend');legend.textContent=ctrl.group;fieldset.append(legend);target.append(fieldset);controlGroups.set(ctrl.group,fieldset);}target=controlGroups.get(ctrl.group);}
 const row=document.createElement('div'),label=document.createElement('label'),input=document.createElement('input'),caption=document.createElement('span');
 input.type=ctrl.type||'range';caption.textContent=ctrl.label;row.className=ctrl.type==='checkbox'?'toggle-row':'range-row';
 if(input.type==='checkbox'){input.checked=!!params[ctrl.id];input.addEventListener('change',()=>{params[ctrl.id]=input.checked;render();});label.append(input,caption);}
 else{Object.assign(input,{min:ctrl.min,max:ctrl.max,step:ctrl.step,value:params[ctrl.id]});input.addEventListener('input',()=>{params[ctrl.id]=Number(input.value);render();});label.append(caption,input);}
 row.append(label);
 if(ctrl.description){const hint=document.createElement('small');hint.textContent=ctrl.description;row.append(hint);}
 if(ctrl.episode){const link=document.createElement('a');link.href=ctrl.episode;link.textContent='Related episode';row.append(link);}
 target.append(row);ranges.set(ctrl.id,input);
}
function renderBuild(){
 if(studio||!B)return;
 $('build-panel').hidden=active;
 $('build-progress').textContent=`${buildLevel} / ${B.steps.length}`;
 if(!current.degenerate)$('build-caption').textContent=buildLevel?value(B.steps[buildLevel-1].text):'Begin with triangle ABC. Each button adds the next piece to the picture.';
 $('build-prev').disabled=buildLevel===0;$('build-reset').disabled=buildLevel===0;
 $('build-pause').hidden=!current.degenerate;
 buildButtons.forEach((button,i)=>{const n=i+1;button.disabled=n>buildLevel+1||(current.degenerate&&n>buildLevel);button.classList.toggle('built',n<=buildLevel);button.classList.toggle('current',n===buildLevel);button.setAttribute('aria-current',n===buildLevel?'step':'false');});
 const ready=buildLevel===B.steps.length;
 $('proof-start').disabled=!ready||current.degenerate;
 $('build-proof').hidden=!ready;$('build-proof').disabled=current.degenerate;
 $('proof-gate').hidden=ready;
}
function goBuild(level){
 if(!B||level<0||level>B.steps.length||level>buildLevel+1||(current.degenerate&&level>buildLevel))return;
 const advance=level>buildLevel;buildLevel=level;
 if(advance)B.steps[level-1].enter?.(vertices,params,M);
 updateGeometry();fit(extent());render();
 $('announcement').textContent=$('build-caption').textContent;
 board.scrollIntoView({block:'start',behavior:'instant'});
}
if(B&&!studio){
 B.steps.forEach((operation,i)=>{const button=document.createElement('button');button.type='button';button.dataset.buildStep=i+1;button.textContent=`${i+1}. ${operation.label}`;button.addEventListener('click',()=>goBuild(i+1));$('build-steps').append(button);buildButtons.push(button);});
 $('build-prev').addEventListener('click',()=>goBuild(buildLevel-1));
 $('build-reset').addEventListener('click',()=>goBuild(0));
 $('build-proof').addEventListener('click',()=>startProof());
}
for(const action of C.actions||[]){const button=document.createElement('button');button.type='button';button.textContent=action.label;button.addEventListener('click',()=>{action.run(vertices,params,M);render();});$('extra-controls').append(button);actionButtons.push([button,action]);}
$('fit').addEventListener('click',()=>{fit(extent());render();});
$('fit-triangle').addEventListener('click',()=>{fit(vertices);render();});
$('reset').addEventListener('click',()=>{active=false;buildLevel=0;step=0;if($('proof-panel'))$('proof-panel').hidden=true;$('workspace').classList.remove('proving');$('proof-start')?.setAttribute('aria-expanded','false');vertices=initial.map(p=>({...p}));params={...C.params};for(const ctrl of C.controls||[])if(params[ctrl.id]===undefined)params[ctrl.id]=ctrl.value;updateGeometry();fit(vertices);render();});
function startProof(){if(studio||!B||buildLevel!==B.steps.length||current?.degenerate)return;active=true;step=0;$('workspace').classList.add('proving');$('proof-panel').hidden=false;$('proof-start').setAttribute('aria-expanded','true');updateGeometry();fit(extent());render();board.scrollIntoView({block:'start',behavior:'instant'});$('proof-next').focus({preventScroll:true});}
$('proof-start')?.addEventListener('click',startProof);
$('proof-close')?.addEventListener('click',()=>{active=false;$('workspace').classList.remove('proving');$('proof-panel').hidden=true;$('proof-start').setAttribute('aria-expanded','false');render();$('proof-start').focus({preventScroll:true});});
$('proof-prev')?.addEventListener('click',()=>{if(step>0){step--;updateGeometry();fit(extent());render();board.scrollIntoView({block:'start',behavior:'instant'});}});
$('proof-next')?.addEventListener('click',()=>{if($('proof-next').disabled)return;step=(step+1)%C.steps.length;updateGeometry();fit(extent());render();board.scrollIntoView({block:'start',behavior:'instant'});});
new ResizeObserver(entries=>{width=entries[0].contentRect.width;height=entries[0].contentRect.height;render();}).observe(board);
})();
