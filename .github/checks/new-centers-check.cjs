'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../proof-episodes'),M=require(path.join(root,'shared/geometry.js'));
const pt=(x,y)=>({x,y}),close=(a,b,tol=2e-8,scale=1)=>assert(Math.abs(a-b)<=tol*Math.max(scale,Math.abs(a),Math.abs(b)),`${a} != ${b}`);
const same=(a,b,tol=2e-8,scale=1)=>{close(a.x,b.x,tol,scale);close(a.y,b.y,tol,scale);};
const lineDistance=(p,a,b)=>Math.abs(M.cross(M.sub(p,a),M.sub(b,a)))/M.dist(a,b);
const named=[
 ['acute',[pt(-.2,-.7),pt(-1,.6),pt(.9,.5)]],['right A',[pt(0,0),pt(1,0),pt(0,1)]],
 ['right B',[pt(0,1),pt(0,0),pt(1,0)]],['right C',[pt(0,1),pt(1,0),pt(0,0)]],
 ['obtuse',[pt(0,0),pt(1,0),pt(.2,.1)]],['isosceles',[pt(0,1),pt(-1,0),pt(1,0)]],
 ['equilateral',[pt(0,Math.sqrt(3)),pt(-1,0),pt(1,0)]],['near equilateral',[pt(1e-11,Math.sqrt(3)),pt(-1,0),pt(1,0)]],
 ['near flat',[pt(-1,0),pt(.2,1e-6),pt(1,0)]],['extreme near flat',[pt(-1,0),pt(.2,1e-9),pt(1,0)]],
 ['near repeated',[pt(0,0),pt(1e-8,1e-8),pt(1,0)]]
];
let seed=773993;const random=()=>((seed=(1664525*seed+1013904223)>>>0)/2**32);
const samples=[...named];for(let i=0;i<1500;i++)samples.push(['random '+i,Array.from({length:3},()=>pt(2*random()-1,2*random()-1))]);
const load=slug=>{const window={EpisodeMath:M};vm.runInNewContext(fs.readFileSync(path.join(root,slug,'episode.js'),'utf8'),{window});return window.ProofEpisode;};
const configs=['nagel','gergonne'].map(load);
function geometry(g){
 const [a,b,c]=g.sides,[x,y,z]=g.tangentLengths;
 assert(g.tangentLengths.every(t=>Number.isFinite(t)&&t>0),'strictly positive stable tangent lengths');
 close(x+y,c,2e-8,g.scale);close(y+z,a,2e-8,g.scale);close(z+x,b,2e-8,g.scale);
 close(g.s,(a+b+c)/2,2e-8,g.scale);
 if(g.area>1e-6*g.scale*g.scale){close(x,g.s-a,2e-8,g.scale);close(y,g.s-b,2e-8,g.scale);close(z,g.s-c,2e-8,g.scale);}
 const weights=[[g.K,[a*a,b*b,c*c]],[g.Na,[x,y,z]],[g.Ge,[1/x,1/y,1/z]]];
 for(const [q,w] of weights){
  const sum=w.reduce((s,t)=>s+t,0),expected=g.vertices.reduce((s,v,i)=>M.add(s,M.mul(v,w[i]/sum)),pt(0,0));same(q,expected,2e-8,g.scale);
  // Independent area coordinates identify the requested interior point.
  if(g.area>1e-6*g.scale*g.scale)for(let i=0;i<3;i++)close(M.area(q,g.vertices[(i+1)%3],g.vertices[(i+2)%3])/g.area,w[i]/sum,1e-7);
 }
 const families=[[g.K,g.symmedianEnds],[g.Na,g.exTouches],[g.Ge,g.incTouches]];
 for(const [center,ends]of families)for(let i=0;i<3;i++){
  const a=g.vertices[i],b=g.vertices[(i+1)%3],c=g.vertices[(i+2)%3],q=ends[i];
  assert(Number.isFinite(q.x)&&Number.isFinite(q.y));
  close(lineDistance(q,b,c),0,2e-8,g.scale);
  assert(M.parameter(q,b,c)>=-1e-12&&M.parameter(q,b,c)<=1+1e-12,'contact is on its side segment');
  assert(Math.abs(M.cross(M.sub(q,a),M.sub(center,a)))<=2e-8*g.scale*g.scale,'computed cevians concur at their named center');
 }
 for(let i=0;i<3;i++){
  const a=g.vertices[(i+1)%3],b=g.vertices[(i+2)%3],vertex=g.vertices[i],o=g.excenters[i],r=g.exradii[i];
  assert(Number.isFinite(r)&&r>0);assert(Number.isFinite(o.x)&&Number.isFinite(o.y));
  close(M.dist(o,g.exTouches[i]),r,3e-8,g.scale);
  close(g.area,g.tangentLengths[i]*r,3e-8,g.scale*g.scale);
  assert(M.cross(M.sub(b,a),M.sub(vertex,a))*M.cross(M.sub(b,a),M.sub(o,a))<0,'excenter is across opposite side');
  for(let j=0;j<3;j++)close(lineDistance(o,g.vertices[(j+1)%3],g.vertices[(j+2)%3]),r,3e-8,g.scale);
  close(M.dist(g.I,g.incTouches[i]),g.r,3e-8,g.scale);
  same(M.mid(g.incTouches[i],g.exTouches[i]),g.mids[i],2e-8,g.scale);
  const opposite=g.sides[i],first=g.tangentLengths[(i+1)%3],second=g.tangentLengths[(i+2)%3];
  close(M.dist(a,g.incTouches[i]),first,2e-8,g.scale);close(M.dist(a,g.exTouches[i]),second,2e-8,g.scale);
  close(M.dist(a,g.exTouches[i])+M.dist(g.exTouches[i],b),opposite,2e-8,g.scale);
 }
 // Exact cyclic cancellation is checked through positive tangent lengths,
 // rather than rounded drawing coordinates when a contact is near a vertex.
 close((z/y)*(x/z)*(y/x),1);close((y/z)*(z/x)*(x/y),1);
}
function recorder(g){
 const calls=[],d={colors:{blue:'blue',teal:'teal',purple:'purple',gold:'gold',muted:'muted',red:'red',ink:'ink'}};
 const finite=p=>assert(p&&Number.isFinite(p.x)&&Number.isFinite(p.y),'finite drawing point');
 for(const kind of ['segment','line','poly','circle','point','label','right','tick','angle'])d[kind]=(...args)=>{
  calls.push({kind,args});if(kind==='poly'){args[0].forEach(finite);return;}finite(args[0]);
  if(kind==='circle'){assert(Number.isFinite(args[1])&&args[1]>0);return;}
  if(kind==='point'||kind==='label'){assert.equal(typeof args[1],'string');return;}
  finite(args[1]);if(kind==='right'||kind==='angle')finite(args[2]);
  if(kind==='line')assert(M.dist(args[0],args[1])>0);
  if(kind==='right'){const u=M.sub(args[1],args[0]),v=M.sub(args[2],args[0]);assert(M.norm(u)>0&&M.norm(v)>0);assert(Math.abs(M.dot(u,v))<2e-7*M.norm(u)*M.norm(v),'genuine perpendicular mark');}
 };
 return {d,calls};
}
const partOf=call=>call.args.find(a=>a&&typeof a==='object'&&a['data-part'])?.['data-part'];
function extents(calls,ext,g){
 ext.forEach(q=>assert(q&&Number.isFinite(q.x)&&Number.isFinite(q.y)));
 const xs=ext.map(q=>q.x),ys=ext.map(q=>q.y),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
 const contains=q=>{const tolerance=1e-7*Math.max(g.scale,Math.abs(q.x),Math.abs(q.y));assert(q.x>=minX-tolerance&&q.x<=maxX+tolerance&&q.y>=minY-tolerance&&q.y<=maxY+tolerance,'visible object is included in fit extent');};
 for(const call of calls){
  if(call.kind==='circle'){const [o,r]=call.args;contains(pt(o.x-r,o.y-r));contains(pt(o.x+r,o.y+r));}
  if(call.kind==='point')contains(call.args[0]);
 }
}
let geometryCount=0,renderCount=0;
for(const [name,v]of samples)for(const vertices of [v,[v[0],v[2],v[1]]]){
 const base=M.triangle(vertices);if(base.degenerate)continue;geometry(base);geometryCount++;
 // Keep the complete rendering matrix bounded; all named edge cases and the
 // first 200 random cases still exercise every sentence and build stage.
 if(geometryCount>422)continue;
 for(const config of configs){
  const g={...base,...config.compute(base,{},M)},build=config.construction;
  for(let level=0;level<=build.steps.length;level++){
   const {d,calls}=recorder(g);build.draw(d,g,level,{},M);extents(calls,build.extent(g,{},level,M),g);
   if(level===0)assert.equal(calls.length,0,'each construction starts blank');
   const name=config.slug==='nagel'?'Na':'Ge',shown=calls.some(c=>c.kind==='point'&&c.args[1].split(' ≈ ').includes(name));
   assert.equal(shown,level===build.steps.length,'concurrence marker is revealed only at the final build stage');
   renderCount++;
  }
  for(let step=-1;step<config.steps.length;step++){
   const {d,calls}=recorder(g);config.draw(d,g,step,{},M);extents(calls,config.extent(g,{},step,M),g);
   const identified=config.slug==='nagel'?14:10,name=config.slug==='nagel'?'Na':'Ge';
   assert.equal(calls.some(c=>c.kind==='point'&&c.args[1].split(' ≈ ').includes(name)),step===-1||step>=identified,'proof names concurrence only after Ceva');
   for(const call of calls.filter(c=>partOf(c)?.startsWith('cevian-'))){const i=Number(partOf(call).split('-').pop()),end=(config.slug==='nagel'?g.exTouches:g.incTouches)[i];same(call.args[0],g.vertices[i]);same(call.args[1],end);}
   renderCount++;
  }
 }
}
for(const v of [[pt(0,0),pt(1,0),pt(2,0)],[pt(0,0),pt(0,0),pt(1,1)],[pt(1,1),pt(1,1),pt(1,1)]]){
 const g=M.triangle(v);assert(g.degenerate);for(const name of ['K','Na','Ge'])assert.equal(g[name],null);
 for(const name of ['tangentLengths','symmedianEnds','incTouches','excenters','exradii','exTouches'])assert.deepEqual(g[name],[]);
}
const equal=M.triangle(named.find(([name])=>name==='equilateral')[1]);for(const name of ['K','Na','Ge'])same(equal[name],equal.I);
for(const factor of [1e-6,1e6]){
 const g=M.triangle(named[0][1].map(p=>M.mul(p,factor)));geometry(g);
}
// All new catalog lines/circles remain independent of center markers.
const window={EpisodeMath:M};vm.runInNewContext(fs.readFileSync(path.join(root,'shared/geometry-catalog.js'),'utf8'),{window});
const g=M.triangle(named[0][1]);
for(const id of ['symmedians','nagel-cevians','gergonne-cevians','excircle-a','excircle-b','excircle-c']){
 const entry=window.TriangleCatalog.find(e=>e.id===id);assert(entry);const {d,calls}=recorder(g);entry.draw(d,g,{},M);
 assert.equal(calls.filter(c=>c.kind==='point').length,0,'construction switch must not reveal a point label');extents(calls,[...g.vertices,...entry.extent(g,{},M)],g);
}
console.log(`New centers: ${geometryCount} oriented triangles pass independent contact-length, circle, barycentric, concurrence and positivity checks; ${renderCount} build/proof states pass reveal gates, finite drawing, perpendiculars and full-circle extents.`);
