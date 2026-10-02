'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'../../proof-episodes');
const M=require(path.join(root,'shared/geometry.js'));
const context={window:{EpisodeMath:M}};
for(const file of ['shared/geometry-catalog.js','all-centers/episode.js'])vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),context);
const catalog=context.window.TriangleCatalog,C=context.window.ProofEpisode;
assert(catalog.length>=19,'all requested constructions are in the catalog');
assert.equal(C.controls.length,catalog.length);
assert.equal(new Set(catalog.map(e=>e.id)).size,catalog.length,'toggle IDs are unique');
assert.equal(C.steps.length,0);assert(C.studio);
for(const entry of catalog){
 assert.equal(C.params[entry.id],false,'every catalog toggle starts off');
 assert(C.controls.some(control=>control.id===entry.id&&control.type==='checkbox'&&control.value===false),'every catalog entry creates a checkbox');
 assert(fs.existsSync(path.resolve(root,'all-centers',entry.episode)),'related episode exists');
}
const p=(x,y)=>({x,y}),fixtures=[
 C.initial||[p(-.25,-.7),p(-.9,.55),p(.85,.55)],
 [p(0,1),p(0,0),p(1,0)],
 [p(0,0),p(1.5,0),p(.2,.2)],
 [p(0,-.72),p(-Math.sqrt(3)*.36,.36),p(Math.sqrt(3)*.36,.36)],
 [p(1e-11,-.72),p(-Math.sqrt(3)*.36,.36),p(Math.sqrt(3)*.36,.36)],
 [p(-1,0),p(1,0),p(.25,1e-8)]
];
let seed=103;
const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296)*2-1;
while(fixtures.length<256){const v=[p(random(),random()),p(random(),random()),p(random(),random())];if(!M.triangle(v).degenerate)fixtures.push(v);}
let drawStates=0;
function record(){
 const calls=[],d={colors:{blue:'blue',teal:'teal',purple:'purple',gold:'gold',muted:'muted',red:'red'}};
 const finite=q=>assert(q&&Number.isFinite(q.x)&&Number.isFinite(q.y),'finite drawing coordinate');
 for(const name of ['point','label','segment','line','poly','circle','tick','angle','right'])d[name]=(...args)=>{
  calls.push({name,args});
  if(name==='poly'){args[0].forEach(finite);return;}
  finite(args[0]);
  if(['line','segment','tick','angle','right'].includes(name))finite(args[1]);
  if(['angle','right'].includes(name))finite(args[2]);
  if(name==='circle')assert(Number.isFinite(args[1])&&args[1]>0,'positive finite circle radius');
  if(name==='line')assert(M.dist(args[0],args[1])>0,'a line needs two distinct points');
 };
 return {d,calls};
}
for(const vertices of fixtures){
 let params={...C.params},base=M.triangle(vertices),g={...base,...C.compute(base,params,M)},r=record();
 C.draw(r.d,g,-1,params,M);
 assert.equal(r.calls.length,0,'initial ABC has no selected construction');
 assert.equal(C.extent(g,params).length,0,'hidden objects cannot change fitted bounds');
 assert.equal(C.handles(g,params,M).length,0,'hidden cevians have no handles');
 for(const entry of catalog){
  params={...C.params,[entry.id]:true};g={...base,...C.compute(base,params,M)};r=record();
  C.draw(r.d,g,-1,params,M);drawStates++;
  assert(r.calls.length>0||entry.id==='euler-line'&&g.studioEulerClose,'each selected object is drawn except the stated Euler precision case');
  if(entry.point){assert.equal(r.calls.length,1);assert.equal(r.calls[0].name,'point');assert(r.calls[0].args[1].startsWith(entry.label.split(' · ')[0]),'only the selected center is named');}
  if(['circumcircle','incircle','nine-point-circle','diameter-circle'].includes(entry.id)){
   assert.equal(r.calls.length,1,'a circle toggle does not force its center marker');assert.equal(r.calls[0].name,'circle');
   const [o,radius]=r.calls[0].args,ext=C.extent(g,params),tol=1e-8*Math.max(1,radius);
   assert.equal(ext.length,2);
   for(const axis of ['x','y'])for(const sign of [-1,1])assert(ext.some(q=>Math.abs(q[axis]-(o[axis]+sign*radius))<tol),'selected circle is fitted in full');
  }
  if(['medians','altitudes','perpendicular-bisectors','internal-bisectors','euler-line'].includes(entry.id))assert(r.calls.every(call=>call.name!=='point'),'line toggles do not force point markers');
  assert.equal(C.handles(g,params,M).length,entry.id==='cevians'?3:0,'cevian handles follow their toggle');
 }
 params={...C.params};C.actions.find(action=>action.label==='Show all centers').run(vertices,params);
 assert.equal(catalog.filter(entry=>params[entry.id]).length,catalog.filter(entry=>entry.point).length);
 g={...base,...C.compute(base,params,M)};r=record();C.draw(r.d,g,-1,params,M);
 assert(r.calls.length>=1&&r.calls.length<=catalog.filter(entry=>entry.point).length);
 assert(r.calls.every(call=>call.name==='point'),'show-centers action draws only center points');
 if(g.studioEulerClose)assert(r.calls.some(call=>call.args[1].includes('≈')),'close centers receive approximate grouping');
 params.cevians=true;
 for(const handle of C.handles(g,params,M)){
  assert(['X','Y','Z'].includes(handle.id),'free cevian names do not collide with midpoint names');
  handle.move(p(1e6,-1e6));const key={X:'cevianX',Y:'cevianY',Z:'cevianZ'}[handle.id];
  assert(params[key]>=.02&&params[key]<=.98,'side handles stay strictly interior');
 }
 C.actions.find(action=>action.label==='Clear all').run(vertices,params);assert(catalog.every(entry=>!params[entry.id]));
 for(let i=0;i<3;i++){
  const v=g.vertices[i],b=g.vertices[(i+1)%3],c=g.vertices[(i+2)%3],end=g.studioBisectorEnds[i];
  assert(Math.abs(M.angle(b,v,end)-M.angle(end,v,c))<1e-5,'internal bisector divides the angle equally');
 }
 params=Object.fromEntries(catalog.map(entry=>[entry.id,true]));Object.assign(params,{cevianX:.42,cevianY:.53,cevianZ:.61});
 g={...base,...C.compute(base,params,M)};r=record();C.draw(r.d,g,-1,params,M);C.extent(g,params).forEach(q=>assert(Number.isFinite(q.x)&&Number.isFinite(q.y)));
}
for(const vertices of [[p(0,0),p(0,0),p(0,0)],[p(0,0),p(1,0),p(2,0)]])assert(M.triangle(vertices).degenerate,'engine can recognize collapsed geometry before drawing');
console.log(`All Centers: ${catalog.length} independent toggles across ${fixtures.length} triangles (${drawStates} individual draw states); blank initial state, center isolation, full-circle extents, bounded handles, actions, and bisector geometry pass.`);
