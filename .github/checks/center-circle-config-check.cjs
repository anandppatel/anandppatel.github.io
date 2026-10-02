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
function checkBase(v){const g=M.triangle(v);if(g.degenerate)return null;const h=independentH.construct(v).center;assert(h);same(g.H,h);return g;}
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
for(const config of configs){
 assert(config.steps.length>=8);assert(config.prerequisites.every(item=>fs.existsSync(path.resolve(root,config.slug,item.href.split('#')[0]))),'all prerequisite links exist');
 for(const test of named){
  for(const vertices of [test.v,[test.v[0],test.v[2],test.v[1]]]){
   const base=checkBase(vertices),g={...base,...config.compute(base,{},M)};
   for(let s=-1;s<config.steps.length;s++){
    const {d,calls}=recorder();config.draw(d,g,s,{},M);const ext=config.extent(g,{},s);
    assert(ext.length>=3);ext.forEach(q=>assert(Number.isFinite(q.x)&&Number.isFinite(q.y)));
    const box={minX:Math.min(...ext.map(q=>q.x)),maxX:Math.max(...ext.map(q=>q.x)),minY:Math.min(...ext.map(q=>q.y)),maxY:Math.max(...ext.map(q=>q.y))};
    for(const call of calls.filter(c=>c.kind==='circle')){const [o,r]=call.args,tol=1e-7*Math.max(1,r);assert(box.minX<=o.x-r+tol&&box.maxX>=o.x+r-tol&&box.minY<=o.y-r+tol&&box.maxY>=o.y+r-tol,`${config.slug} step${s} fits all visible circles`);}
    if(s>=0){const step=config.steps[s];for(const k of ['text','facts','key']){const value=typeof step[k]==='function'?step[k](g,{}):step[k];assert(k==='facts'?Array.isArray(value):typeof value==='string');assert(!/\\(?:frac|cdot|begin)|\$\$/.test(JSON.stringify(value)),'no raw LaTeX');assert(!/Here A₁ =|Here the right angle|Here the transformation|endpoint case applies here/.test(JSON.stringify(value)),'numerical proximity must not assert an exact hypothesis');}}
    if(test.name==='near equilateral'&&config.slug==='euler-line'&&s===8){assert(g.coincident);assert(M.dist(g.O,g.G)>0);assert(config.steps[s].text(g).startsWith('If O = G'));assert(calls.some(c=>c.kind==='point'&&c.args[1]==='O ≈ G ≈ H'));}
    if(test.name==='near right B'&&config.slug==='nine-point-circle'&&s===4){assert(g.endpointCase);assert(config.steps[s].text.startsWith('If X differs'));assert(calls.some(c=>c.kind==='point'&&c.args[1].includes('≈')));}
    if(test.name==='near foot D'&&config.slug==='nine-point-circle-altitudes'&&s===6){assert.equal(g.footCase,'D');assert(M.dist(g.A1,g.D)>0);assert(config.steps[s].text.startsWith('If A₁ differs'));assert(calls.some(c=>c.kind==='point'&&c.args[1].includes('≈')));}
   }
   if(config.slug==='euler-line'){
    same(g.mappedO,g.H);g.vertices.forEach((q,i)=>same(M.sub(M.mul(g.G,3),M.mul(q,2)),g.outer[i]));
    close(M.dist(g.G,g.H),2*M.dist(g.G,g.O));
    if(test.name==='equilateral'){assert(g.coincident);assert(!config.steps[8].facts(g).some(f=>f.includes('1 : 2')));}
   }else{
    const points=[...g.half,...g.mids,...(config.slug==='nine-point-circle-altitudes'?g.feet:[])];points.forEach(q=>close(M.dist(q,g.N),g.R/2));
    same(M.mid(g.H,g.X),g.mids[0]);
    if(config.slug==='nine-point-circle-altitudes'){same(M.mid(g.U,g.D),g.N);if(test.name==='foot U')assert.equal(g.footCase,'U');if(test.name==='isosceles foot D')assert.equal(g.footCase,'D');}
   }
  }
 }
 console.log(config.slug+': all proof/exploration steps pass '+named.length+' named cases and reversed orientations; finite drawing, genuine right-angle marks, full-circle extent, and precise special-case wording.');
}
let seed=0x143ef931;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
for(let i=0;i<5000;i++){
 const g=checkBase(Array.from({length:3},()=>pt(2*rand()-1,2*rand()-1)));if(!g)continue;
 close(M.dist(g.G,g.H),2*M.dist(g.G,g.O));
 [...g.half,...g.mids,...g.feet].forEach(q=>close(M.dist(q,g.N),g.R/2));
 same(M.mid(g.H,M.sub(M.mul(g.O,2),g.A)),g.mids[0]);
}
console.log('5,000 random triangles pass independent altitude-center check, Euler ratio, nine circle memberships, and antipode-midpoint identity.');
