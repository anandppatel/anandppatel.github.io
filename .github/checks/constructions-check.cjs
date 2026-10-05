'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname, '../../proof-episodes');
const M=require(path.join(root,'shared/geometry.js'));
const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'shared/constructions.js'),'utf8'),context);const all=context.window.EpisodeConstructions;
const pt=(x,y)=>({x,y}),close=(a,b)=>assert(Math.abs(a-b)<=1e-7*Math.max(1,Math.abs(a),Math.abs(b)));
const named=[
[pt(-.25,-.7),pt(-.9,.55),pt(.85,.55)],
[pt(0,0),pt(1,0),pt(0,1)],
[pt(0,0),pt(1,0),pt(1,1)],
[pt(-1,0),pt(1,0),pt(0,1)],
[pt(0,-.7),pt(-.8,.5),pt(.8,.5)],
[pt(0,-.72),pt(-Math.sqrt(3)*.36,.36),pt(Math.sqrt(3)*.36,.36)],
[pt(0,0),pt(1.5,0),pt(.2,.2)],
[pt(-1,0),pt(1,0),pt(.25,.00001)],
[pt(-.8,.5),pt(0,-.7),pt(.8,.5)],
[pt(-.8,.5),pt(.8,.5),pt(0,-.7)],
[pt(0,.2),pt(-1,0),pt(1,0)],
[pt(1e-11,-.72),pt(-Math.sqrt(3)*.36,.36),pt(Math.sqrt(3)*.36,.36)],
[pt(1e-11,-.7),pt(-.8,.5),pt(.8,.5)],
[pt(0,0),pt(1,0),pt(1e-11,1)],
[pt(-1,0),pt(1,0),pt(.25,1e-9)]];
const namedCount=named.length;
let seed=7156213;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
for(let i=0;i<200;i++){const v=Array.from({length:3},()=>pt(2*random()-1,2*random()-1));if(M.triangle(v).degenerate){i--;continue;}named.push(v);}
function recorder(){
 const calls=[],d={colors:{blue:'#315dcc',teal:'#087c70',purple:'#8551bd',gold:'#ad660d',ink:'#26364b',muted:'#9aa5b8',red:'#b54152'}};
 const finite=q=>assert(q&&Number.isFinite(q.x)&&Number.isFinite(q.y),'finite point');
 for(const kind of ['segment','line','poly','circle','point','label','right','tick','angle'])d[kind]=(...args)=>{
  calls.push({kind,args});if(kind==='poly'){args[0].forEach(finite);return;}finite(args[0]);
  if(kind==='point'||kind==='label'){assert.equal(typeof args[1],'string');return;}
  if(kind==='circle'){assert(args[1]>0&&Number.isFinite(args[1]));return;}
  finite(args[1]);if(kind==='line')assert(M.dist(args[0],args[1])>0,'line direction nonzero');
  if(kind==='right'||kind==='angle')finite(args[2]);
  if(kind==='right'){const a=M.sub(args[1],args[0]),b=M.sub(args[2],args[0]);assert(M.norm(a)>0&&M.norm(b)>0);assert(Math.abs(M.dot(a,b))<=2e-7*M.norm(a)*M.norm(b),'right-angle marker is right');}
 };
 return {calls,d};
}
const partOf=call=>call.args.find(arg=>arg&&typeof arg==='object'&&typeof arg['data-part']==='string')?.['data-part'];
let renders=0;
for(const [slug,K]of Object.entries(all)){
 const cc={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,slug,'episode.js'),'utf8'),cc);const C=cc.window.ProofEpisode;
 assert(K.steps.length>=4&&K.steps.length<=7);assert(K.steps.every(s=>s.label&&s.text));
 if(slug==='euler-line')assert.equal(K.steps.length,7);
 for(const raw of named)for(const initial of [raw,[raw[0],raw[2],raw[1]]]){
  let v=initial.map(q=>({...q})),p={...C.params};
  for(let level=0;level<=K.steps.length;level++){
   if(level&&K.steps[level-1].enter)K.steps[level-1].enter(v,p,M);
   if(K.constrain)v=K.constrain(v,p,level,M);
   const base=M.triangle(v);if(base.degenerate)continue;const g={...base,...C.compute(base,p,M)};
   if(slug==='euler-line')Object.defineProperty(g,'H',{get(){throw new Error('Euler construction must not assume the orthocenter H');}});
   const {d,calls}=recorder();K.draw(d,g,level,p,M);const ext=K.extent(g,p,level,M);ext.forEach(q=>assert(q&&Number.isFinite(q.x)&&Number.isFinite(q.y)));
   if(level===0){assert.equal(calls.length,0);assert.equal(ext.length,3);assert.equal(K.handleIds(level).length,0);}
   // Fitting must use only geometry actually revealed at this level.
   const shownHandles=K.handleIds(level);
   const visiblePoints=[...g.vertices,...(C.handles?C.handles(g,p,M).filter(h=>shownHandles.includes(h.id)).map(h=>h.point):[])];
   for(const call of calls){
    if(call.kind==='poly')visiblePoints.push(...call.args[0]);
    else for(const arg of call.args)if(arg&&typeof arg==='object'&&'x' in arg)visiblePoints.push(arg);
    if(call.kind==='circle'){const [o,r]=call.args;visiblePoints.push({x:o.x-r,y:o.y-r},{x:o.x+r,y:o.y+r});}
   }
   // Approximately grouped point labels use a tolerance of 1e-10*scale.
   for(const point of ext)assert(visiblePoints.some(q=>M.dist(q,point)<=1.1e-10*g.scale),`${slug} level ${level}: fit bounds must not reveal future geometry`);
   const circleCalls=calls.filter(c=>c.kind==='circle'),pointLabels=calls.filter(c=>c.kind==='point').map(c=>c.args[1]);
   const shown=name=>pointLabels.some(label=>label.split(' ≈ ').includes(name));
   const box={x0:Math.min(...ext.map(q=>q.x)),x1:Math.max(...ext.map(q=>q.x)),y0:Math.min(...ext.map(q=>q.y)),y1:Math.max(...ext.map(q=>q.y))};
   for(const {args:[o,r]}of circleCalls){const tol=1e-7*Math.max(r,1);assert(box.x0<=o.x-r+tol&&box.x1>=o.x+r-tol&&box.y0<=o.y-r+tol&&box.y1>=o.y+r-tol,'full circle fits extent');}
   if(slug==='incenter'){assert.equal(shown('I'),level>=3);assert.equal(shown('X'),level>=5);assert.equal(circleCalls.length,level>=6?1:0);if(level>=6)close(circleCalls[0].args[1],g.r);}
   if(slug==='euler-line'){
    assert.equal(shown('G'),level>=2);assert.equal(shown('O'),level>=3);assert.equal(shown('X'),level>=5);assert(!shown('H'),'the construction never names H');assert.equal(circleCalls.length,0);
    const parts=new Map(calls.filter(call=>partOf(call)).map(call=>[partOf(call),call]));
    assert.equal(parts.has('construction-euler-line'),level>=4&&!g.coincident);
    for(const [part,a,b]of [['OG',g.O,g.G],['GX',g.G,g.X]]){
     const call=parts.get('construction-'+part);assert.equal(!!call,level>=5&&!g.coincident);
     if(call){close(call.args[0].x,a.x);close(call.args[0].y,a.y);close(call.args[1].x,b.x);close(call.args[1].y,b.y);}
    }
    for(const [part,points]of [['triangle-DGO',[g.mids[0],g.G,g.O]],['triangle-AGX',[g.A,g.G,g.X]]]){
     const call=parts.get('construction-'+part);assert.equal(!!call,level>=6&&!g.comparisonFlat);
     if(call)call.args[0].forEach((q,i)=>{close(q.x,points[i].x);close(q.y,points[i].y);});
    }
    for(let i=0;i<3;i++){
     const call=parts.get('construction-altitude-'+i);assert.equal(!!call,level>=7,'altitudes appear only after X and the comparison');
     if(call){
      assert.equal(call.kind,'line');close(call.args[0].x,g.vertices[i].x);close(call.args[0].y,g.vertices[i].y);
      const direction=M.sub(call.args[1],call.args[0]),side=M.sub(g.vertices[(i+2)%3],g.vertices[(i+1)%3]);
      assert(Math.abs(M.dot(direction,side))<=3e-7*M.norm(direction)*M.norm(side),'altitude direction is perpendicular to its side');
      assert(Math.abs(M.cross(M.sub(g.X,call.args[0]),direction))<=3e-7*Math.max(g.scale,M.dist(g.X,call.args[0]))*M.norm(direction),'the constructed candidate lies on every altitude');
     }
    }
    assert(!/NaN|Infinity/.test(K.status(g,p,level,M)));
   }
   if(slug==='angle-bisector'){assert.equal(shown('X'),level>=4);assert.equal(K.handleIds(level).includes('D'),level>=1);if(level===3)close(g.bd/g.dc,g.ab/g.ac);}
   if(slug==='thales'){assert.equal(shown('M'),level>=1);assert.equal(circleCalls.length,level>=2?1:0);if(level>=3)close(g.angleC,90);}
   if(slug==='nine-point-circle'){assert.equal(shown('O'),level>=1);assert.equal(shown('H'),level>=2);assert.equal(shown('N'),level>=3);assert.equal(shown('U'),level>=4);assert.equal(shown('D'),level>=6);assert.equal(circleCalls.length,(level>=1?1:0)+(level>=5?1:0));}
   if(slug==='nine-point-circle-altitudes'){assert.equal(shown('O'),level>=1);assert.equal(shown('H'),level>=2);assert.equal(shown('N'),level>=3);assert.equal(shown('D'),level>=4);for(let i=0;i<3;i++)assert.equal(shown(['A₁','B₁','C₁'][i]),level>=5+i);assert.equal(circleCalls.length,(level>=1?1:0)+(level>=3?1:0));}
   if(slug==='ceva'){assert.equal(shown('P'),level>=3);assert.equal(K.handleIds(level).includes('D'),level>=1);assert.equal(K.handleIds(level).includes('E'),level>=2);assert.equal(K.handleIds(level).includes('F'),level>=4);if(level===5)close(g.product,1);}
   assert.equal(typeof K.status(g,p,level,M),'string');renders++;
  }
 }
 console.log(slug+': staged drawing, finite points, full-circle extents, genuine right angles, and correct reveal order pass.');
}
console.log(renders+' construction renders passed across '+namedCount+' named + 200 random triangles, both orientations.');
