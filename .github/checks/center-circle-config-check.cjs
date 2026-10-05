'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'../../proof-episodes');
const M=require(path.join(root,'shared/geometry.js'));
const independentH=require(path.join(root,'orthocenter/geometry.js'));
const slugs=['euler-line','nine-point-circle','nine-point-circle-altitudes'];
const configs=slugs.map(slug=>{const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,slug,'episode.js'),'utf8'),context);return context.window.ProofEpisode;});
const pt=(x,y)=>({x,y}),close=(x,y,tol=3e-8)=>assert(Math.abs(x-y)<=tol*Math.max(1,Math.abs(x),Math.abs(y)),`${x} ≠ ${y}`);
const same=(a,b)=>{close(a.x,b.x);close(a.y,b.y);};
const named=[
 {name:'acute',v:[pt(-.25,-.7),pt(-.9,.55),pt(.85,.55)]},
 {name:'right A',v:[pt(-.7,-.45),pt(.7,-.45),pt(-.7,.55)]},
 {name:'right B',v:[pt(-.75,-.5),pt(-.75,.5),pt(.75,.5)]},
 {name:'right C',v:[pt(-.75,-.5),pt(.75,.5),pt(-.75,.5)]},
 {name:'obtuse',v:[pt(0,0),pt(1.5,0),pt(.2,.2)]},
 {name:'equilateral',v:[pt(0,-.72),pt(-Math.sqrt(3)*.36,.36),pt(Math.sqrt(3)*.36,.36)]},
 {name:'isosceles foot D',v:[pt(0,-.7),pt(-.8,.5),pt(.8,.5)]},
 {name:'foot U',v:[pt(0,1),pt(.5,0),pt(2,0)]},
 {name:'near right B',v:[pt(0,1),pt(0,0),pt(1,1e-11)]},
 {name:'near equilateral',v:[pt(1e-11,-.72),pt(-Math.sqrt(3)*.36,.36),pt(Math.sqrt(3)*.36,.36)]},
 {name:'near foot D',v:[pt(1e-11,-.7),pt(-.8,.5),pt(.8,.5)]},
 {name:'near collinear',v:[pt(-1,0),pt(1,0),pt(.25,.00001)]},
 {name:'extreme near collinear',v:[pt(-1,0),pt(1,0),pt(.25,1e-9)]}
];
const eulerNamed=[...named,
 {name:'isosceles B',v:[pt(-.8,.5),pt(0,-.7),pt(.8,.5)]},
 {name:'isosceles C',v:[pt(-.8,.5),pt(.8,.5),pt(0,-.7)]},
 {name:'obtuse isosceles A',v:[pt(0,.2),pt(-1,0),pt(1,0)]},
 {name:'right isosceles A',v:[pt(0,0),pt(1,0),pt(0,1)]},
 {name:'right isosceles B',v:[pt(-1,0),pt(0,0),pt(0,1)]},
 {name:'right isosceles C',v:[pt(-1,0),pt(0,1),pt(0,0)]},
 {name:'near right A',v:[pt(0,0),pt(1,0),pt(1e-11,1)]},
 {name:'near isosceles B',v:[pt(-.8,.5),pt(1e-11,-.7),pt(.8,.5)]},
 {name:'near isosceles C',v:[pt(-.8,.5),pt(.8,.5),pt(1e-11,-.7)]}
];
function checkBase(v){const g=M.triangle(v);if(g.degenerate)return null;const h=independentH.construct(v).center;assert(h);same(g.H,h);return g;}
const candidate=g=>M.add(g.G,M.mul(M.sub(g.G,g.O),2));
function checkCandidate(g,X){
 // H is independently obtained by solving altitude equations, not from the
 // shared engine's algebraically equivalent formula A+B+C-2O.
 same(X,candidate(g));same(X,independentH.construct(g.vertices).center);
 same(M.sub(X,g.G),M.mul(M.sub(g.O,g.G),-2));
 close(M.dist(g.G,X),2*M.dist(g.G,g.O));
 g.vertices.forEach((vertex,i)=>{
  const mid=g.mids[i],side=M.sub(g.vertices[(i+2)%3],g.vertices[(i+1)%3]);
  const ax=M.sub(X,vertex),od=M.sub(g.O,mid);
  // The correspondences are D -> A, G -> G, O -> X, cyclically.
  same(M.add(g.G,M.mul(M.sub(mid,g.G),-2)),vertex);
  same(ax,M.mul(od,-2));
  close(M.dist(vertex,g.G),2*M.dist(mid,g.G));
  close(M.norm(ax),2*M.norm(od));
  if(M.norm(ax)>1e-8*g.scale)assert(Math.abs(M.dot(ax,side))<=3e-7*M.norm(ax)*M.norm(side),'candidate is on the opposite altitude');
  if(M.dist(g.G,g.O)>1e-8*g.scale&&M.norm(od)>1e-8*g.scale){
   close(M.angle(mid,g.G,g.O),M.angle(vertex,g.G,X),3e-6);
   close(M.angle(g.G,mid,g.O),M.angle(g.G,vertex,X),3e-6);
  }
 });
}
function recorder(){
 const calls=[];const finitePoint=q=>assert(q&&Number.isFinite(q.x)&&Number.isFinite(q.y),'finite constructed point');
 const d={colors:{blue:'#315dcc',teal:'#087c70',purple:'#8551bd',gold:'#ad660d',ink:'#26364b',muted:'#9aa5b8',red:'#b54152'}};
 for(const kind of ['segment','line','poly','circle','point','label','right','tick','angle'])d[kind]=(...args)=>{
  calls.push({kind,args});
  if(kind==='poly'){args[0].forEach(finitePoint);return;}
  finitePoint(args[0]);
  if(kind==='circle'){assert(Number.isFinite(args[1])&&args[1]>0,'positive finite radius');return;}
  if(kind==='point'||kind==='label'){assert.equal(typeof args[1],'string');return;}
  finitePoint(args[1]);if(['right','angle'].includes(kind))finitePoint(args[2]);
  if(kind==='line')assert(M.dist(args[0],args[1])>0,'full line needs distinct points');
  if(kind==='right'){
   const a=M.sub(args[1],args[0]),b=M.sub(args[2],args[0]);assert(M.norm(a)>0&&M.norm(b)>0,'right-angle marker rays nonzero');
   assert(Math.abs(M.dot(a,b))<=3e-7*M.norm(a)*M.norm(b),'marked angle actually right');
  }
 };
 return {d,calls};
}
const partOf=call=>call.args.find(arg=>arg&&typeof arg==='object'&&typeof arg['data-part']==='string')?.['data-part'];
function checkEulerDrawing(g,s,calls,ext){
 const parts=new Map(calls.filter(call=>partOf(call)).map(call=>[partOf(call),call]));
 const pointCalls=calls.filter(call=>call.kind==='point');
 const shown=name=>pointCalls.some(call=>call.args[1].split(/\s*[≈=]\s*/).includes(name));
 const candidateShown=s===-1||s>=2, identified=s===-1||s>=10;
 assert(shown('G')&&shown('O'),'the proof starts with the two known centers');
 assert.equal(shown('X'),candidateShown,'X appears only after its construction');
 assert.equal(shown('H'),identified,'H is named only after the altitude argument');
 assert.equal(calls.filter(call=>call.kind==='circle').length,0,'the similarity proof uses no auxiliary circumcircle');
 assert.equal(parts.has('euler-line'),(s===-1||s>=1)&&!g.coincident);
 for(const [part,a,b]of [['OG',g.O,g.G],['GX',g.G,g.X]]){
  assert.equal(parts.has(part),candidateShown&&!g.coincident);
  if(parts.has(part)){same(parts.get(part).args[0],a);same(parts.get(part).args[1],b);}
 }
 const comparisons=s>=4&&s<=7&&!g.comparisonFlat;
 for(const [part,points]of [['triangle-DGO',[g.mids[0],g.G,g.O]],['triangle-AGX',[g.A,g.G,g.X]]]){
  assert.equal(parts.has(part),comparisons,'comparison triangles appear only in their conditional argument');
  if(parts.has(part))parts.get(part).args[0].forEach((q,i)=>same(q,points[i]));
 }
 for(const [part,points,visible]of [
  ['angle-DGO',[g.mids[0],g.G,g.O],(s===4||s===5)&&!g.comparisonFlat],
  ['angle-AGX',[g.A,g.G,g.X],(s===4||s===5)&&!g.comparisonFlat],
  ['angle-GDO',[g.G,g.mids[0],g.O],s===6&&!g.comparisonFlat],
  ['angle-GAX',[g.G,g.A,g.X],s===6&&!g.comparisonFlat]
 ]){
  assert.equal(parts.has(part),visible,'similarity angle marks must not be used for collapsed comparisons');
  if(parts.has(part))points.forEach((q,i)=>same(parts.get(part).args[i],q));
 }
 for(const pair of [['angle-DGO','angle-AGX'],['angle-GDO','angle-GAX']]){
  if(parts.has(pair[0]))close(M.angle(...parts.get(pair[0]).args.slice(0,3)),M.angle(...parts.get(pair[1]).args.slice(0,3)),3e-6);
 }
 const altitudeIndices=s===-1||s===9||s===10?[0,1,2]:s===7||s===8?[0]:[];
 for(let i=0;i<3;i++){
  const call=parts.get('altitude-'+i);assert.equal(!!call,altitudeIndices.includes(i),'altitudes must follow candidate X and the relevant proof step');
  if(call){
   assert.equal(call.kind,'line');same(call.args[0],g.vertices[i]);
   const direction=M.sub(call.args[1],call.args[0]),side=M.sub(g.vertices[(i+2)%3],g.vertices[(i+1)%3]);
   assert(Math.abs(M.dot(direction,side))<=3e-7*M.norm(direction)*M.norm(side),'altitude is perpendicular to its supporting side');
   assert(Math.abs(M.cross(M.sub(g.X,call.args[0]),direction))<=3e-7*Math.max(g.scale,M.dist(g.X,call.args[0]))*M.norm(direction),'drawn altitude contains X, including a vertex coincidence');
  }
 }
 const visible=[...g.vertices];
 for(const call of calls){
  if(call.kind==='poly')visible.push(...call.args[0]);
  else for(const arg of call.args)if(arg&&typeof arg==='object'&&'x'in arg)visible.push(arg);
 }
 // Match the label-merging tolerance: an approximately grouped point is visible.
 for(const q of ext)assert(visible.some(v=>M.dist(v,q)<=1.1e-10*g.scale),`Euler step ${s}: fit must not disclose geometry from a later step`);
}
for(const config of configs){
 assert(config.steps.length>=8);assert(config.prerequisites.every(item=>fs.existsSync(path.resolve(root,config.slug,item.href.split('#')[0]))),'all prerequisite links exist');
 const cases=config.slug==='euler-line'?eulerNamed:named;
 if(config.slug==='euler-line')assert.equal(config.steps.length,12);
 for(const test of cases){
  for(const vertices of [test.v,[test.v[0],test.v[2],test.v[1]]]){
   const base=checkBase(vertices),g={...base,...config.compute(base,{},M)};
   if(config.slug==='euler-line'){
    const withoutH={...base};Object.defineProperty(withoutH,'H',{get(){throw new Error('candidate construction must not depend on H');}});
    same(config.compute(withoutH,{},M).X,g.X);checkCandidate(g,g.X);
    if(['equilateral','near equilateral'].includes(test.name))assert(g.coincident);
    if(['right A','right isosceles A','near right A'].includes(test.name)){assert(g.midpointClose&&g.comparisonFlat);same(g.X,g.A);}
    if(['isosceles foot D','obtuse isosceles A','near foot D'].includes(test.name)){assert(g.comparisonFlat&&!g.midpointClose&&!g.coincident);}
    if(['isosceles B','isosceles C'].includes(test.name))assert(!g.comparisonFlat,'the fixed A comparison stays noncollapsed when the symmetry apex is B or C');
   }
   for(let s=-1;s<config.steps.length;s++){
    const {d,calls}=recorder();config.draw(d,g,s,{},M);const ext=config.extent(g,{},s);
    assert(ext.length>=3);ext.forEach(q=>assert(Number.isFinite(q.x)&&Number.isFinite(q.y)));
    const box={minX:Math.min(...ext.map(q=>q.x)),maxX:Math.max(...ext.map(q=>q.x)),minY:Math.min(...ext.map(q=>q.y)),maxY:Math.max(...ext.map(q=>q.y))};
    for(const call of calls.filter(c=>c.kind==='circle')){const [o,r]=call.args,tol=1e-7*Math.max(1,r);assert(box.minX<=o.x-r+tol&&box.maxX>=o.x+r-tol&&box.minY<=o.y-r+tol&&box.maxY>=o.y+r-tol,`${config.slug} step${s} fits all visible circles`);}
    if(s>=0){const step=config.steps[s];for(const k of ['text','facts','key']){const value=typeof step[k]==='function'?step[k](g,{}):step[k];assert(k==='facts'?Array.isArray(value):typeof value==='string');assert(!/\\(?:frac|cdot|begin)|\$\$/.test(JSON.stringify(value)),'no raw LaTeX');assert(!/Here A₁ =|Here the right angle|Here the transformation|endpoint case applies here/.test(JSON.stringify(value)),'numerical proximity must not assert an exact hypothesis');}}
    if(config.slug==='euler-line'){
     checkEulerDrawing(g,s,calls,ext);
     const status=config.status(g,{},s>=0,s);assert.equal(typeof status,'string');assert(!/NaN|Infinity/.test(status));
     if(test.name==='near equilateral'){assert(M.dist(g.O,g.G)>0);assert(status.includes('drawing precision'));assert(calls.some(c=>c.kind==='point'&&c.args[1].includes('≈')));}
    }
    if(test.name==='near right B'&&config.slug==='nine-point-circle'&&s===4){assert(g.endpointCase);assert(config.steps[s].text.startsWith('If X differs'));assert(calls.some(c=>c.kind==='point'&&c.args[1].includes('≈')));}
    if(test.name==='near foot D'&&config.slug==='nine-point-circle-altitudes'&&s===6){assert.equal(g.footCase,'D');assert(M.dist(g.A1,g.D)>0);assert(config.steps[s].text.startsWith('If A₁ differs'));assert(calls.some(c=>c.kind==='point'&&c.args[1].includes('≈')));}
   }
   if(config.slug==='euler-line'){
    same(g.X,g.H);
    assert(config.steps[4].text.includes('suppose O is not on line AD'),'similarity states its noncollapsed hypothesis');
    assert(config.steps[8].text.includes('O = D')&&config.steps[8].text.includes('O ≠ D'),'both collapsed cases are addressed');
    assert(config.steps[11].text.includes('no unique Euler line'),'the equilateral exception is explicit');
   }else{
    const points=[...g.half,...g.mids,...(config.slug==='nine-point-circle-altitudes'?g.feet:[])];points.forEach(q=>close(M.dist(q,g.N),g.R/2));
    same(M.mid(g.H,g.X),g.mids[0]);
    if(config.slug==='nine-point-circle-altitudes'){same(M.mid(g.U,g.D),g.N);if(test.name==='foot U')assert.equal(g.footCase,'U');if(test.name==='isosceles foot D')assert.equal(g.footCase,'D');}
   }
  }
 }
 console.log(config.slug+': all proof/exploration steps pass '+cases.length+' named cases and reversed orientations; finite drawing, genuine right-angle marks, fit/reveal order, and precise special-case wording.');
}
let seed=0x143ef931;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
for(let i=0;i<5000;i++){
 const g=checkBase(Array.from({length:3},()=>pt(2*rand()-1,2*rand()-1)));if(!g)continue;
 checkCandidate(g,configs[0].compute(g,{},M).X);
 close(M.dist(g.G,g.H),2*M.dist(g.G,g.O));
 [...g.half,...g.mids,...g.feet].forEach(q=>close(M.dist(q,g.N),g.R/2));
 same(M.mid(g.H,M.sub(M.mul(g.O,2),g.A)),g.mids[0]);
}
console.log('5,000 random triangles pass independent altitude-center check, opposite-ray candidate construction, cyclic similarity correspondences, altitude perpendicularity, Euler ratio, nine circle memberships, and antipode-midpoint identity.');
