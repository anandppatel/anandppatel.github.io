'use strict';
// Diagram checks supplement, but do not replace, the written geometric proofs.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const M=require(root+'/proof-episodes/shared/geometry.js');
const Q=require(root+'/proof-episodes/shared/circle-geometry.js');
const load=slug=>{const context={window:{CircleGeometry:Q}};vm.runInNewContext(fs.readFileSync(root+'/proof-episodes/'+slug+'/episode.js','utf8'),context);return context.window.ProofEpisode;};
const I=load('inscribed-angles'),C=load('cyclic-quadrilaterals');
const P=(x,y)=>({x,y});
let seed=612019;
const random=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);
const cases=[
 [P(-1,0),P(0,1),P(1,0)], [P(-1,0),P(0,-1),P(1,0)],
 [P(0,3),P(0,0),P(4,0)], [P(0,0),P(4,0),P(1,.5)],
 [P(0,1e-5),P(-1,0),P(1,0)], [P(0,1e-6),P(1,0),P(-1,0)],
 [P(1e6,3e6),P(1e6,1e6),P(5e6,1e6)]
];
for(let i=0;i<1200;i++)cases.push(Array.from({length:3},()=>P(4*random()-2,4*random()-2)));
const close=(a,b,tol=2e-8)=>assert.ok(Math.abs(a-b)<=tol*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);
const finite=q=>assert.ok(q&&Number.isFinite(q.x)&&Number.isFinite(q.y),'nonfinite point');
const records=[];
const draw={colors:{blue:'blue',teal:'teal',purple:'purple',gold:'gold',ink:'ink',muted:'muted'}};
for(const name of ['segment','line','poly','circle','arc','label','point','tick','right','angle'])draw[name]=(...args)=>{
 if(name==='poly')args[0].forEach(finite);
 else if(['segment','line','tick'].includes(name)){finite(args[0]);finite(args[1]);}
 else if(['right','angle'].includes(name))args.slice(0,3).forEach(finite);
 else finite(args[0]);
 if(name==='circle'||name==='arc')assert.ok(Number.isFinite(args[1])&&args[1]>0);
 if(name==='arc'){assert.ok(Number.isFinite(args[2])&&Number.isFinite(args[3]));assert.ok(Math.abs(args[3]-args[2])<=2*Math.PI+1e-8);}
 records.push([name,args]);
};
let triangles=0,quadTests=0,draws=0;
for(const vertices of cases){
 const g=M.triangle(vertices);if(g.degenerate)continue;
 Object.assign(g,I.compute(g,{},M));triangles++;
 close(g.arcDegrees,2*g.angleB,5e-7);
 close(M.dist(g.O,g.E),g.R);
 if(!g.near){close(g.angleB,g.sumCase?g.alpha+g.beta:Math.abs(g.alpha-g.beta));}
 for(const t of [.03,.24,.5,.91,.97]){
  const q=Q.cyclic(g,t,M);finite(q.D);close(M.dist(q.D,g.O),g.R);
  close(Q.fraction(g,q.D,M),t,2e-7);
  for(const depth of [.08,.5,1,1.5,2.5]){
   const p={t,depth,_fixedDepth:null};const h={...g,...C.compute(g,p,M)};quadTests++;
   assert.ok(h.cross>0&&h.cross<1);
   const ac=M.parameter(h.X,h.A,h.C);assert.ok(ac>0&&ac<1);
   const sign=Q.direction(g,M);
   if(!g.near){
    const polygon=[h.A,h.B,h.C,h.D];
    for(let i=0;i<4;i++)assert.ok(sign*M.cross(M.sub(polygon[(i+1)%4],polygon[i]),M.sub(polygon[(i+2)%4],polygon[(i+1)%4]))>0,'nonconvex candidate');
    close(h.alpha+h.deltaPrime,180);
    if(depth<1)assert.ok(h.angleSum>180,'nearer candidate must see a larger angle');
    if(depth===1)close(h.angleSum,180);
    if(depth>1)assert.ok(h.angleSum<180,'farther candidate must see a smaller angle');
    if(depth<1){assert.ok(M.angle(h.A,h.D,h.B)>M.angle(h.A,h.Dprime,h.B));assert.ok(M.angle(h.B,h.D,h.C)>M.angle(h.B,h.Dprime,h.C));}
   }
  }
 }
 if(triangles<=25){
  for(const episode of [I,C]){
   const p={...episode.params};episode.constrain?.(vertices,p,false,0,M);const h={...M.triangle(vertices)};Object.assign(h,episode.compute(h,p,M));
   records.length=0;episode.construction.draw(draw,h,0,p,M);assert.equal(records.length,0);
   assert.equal(episode.construction.extent(h,p,0,M).length,3);
   for(let l=1;l<=episode.construction.steps.length;l++){
    records.length=0;episode.construction.draw(draw,h,l,p,M);episode.construction.extent(h,p,l,M).forEach(finite);draws++;
    assert.ok(records.length>0);
    if(episode===C&&l===1)assert.ok(!JSON.stringify(records).includes('candidate-D'));
   }
   for(let s=0;s<episode.steps.length;s++){
    episode.constrain?.(vertices,p,true,s,M);const f={...M.triangle(vertices)};Object.assign(f,episode.compute(f,p,M));
    records.length=0;episode.draw(draw,f,s,p,M);episode.extent(f,p,s,M).forEach(finite);draws++;
    assert.ok(records.length>0,'empty proof stage');
    assert.equal(typeof episode.steps[s].text,'string');
    if(episode===C&&s===6)assert.equal(f.depth,.5);
    if(episode===C&&s===8)assert.equal(f.depth,1.5);
    if(episode===C&&s===9)close(M.dist(f.D,f.Dprime),0);
   }
  }
 }
}
// The three presets really exercise the sum, difference, and endpoint cases.
for(let i=0;i<I.actions.length;i++){
 const v=I.initial.map(q=>({...q}));I.actions[i].run(v,{},M);const g=M.triangle(v);Object.assign(g,I.compute(g,{},M));
 if(i===0){assert.ok(g.sumCase&&!g.endpoint);assert.equal(I.steps[4].guard(g),'');assert.ok(I.steps[5].guard(g));}
 if(i===1){assert.ok(!g.sumCase&&!g.endpoint);assert.ok(I.steps[4].guard(g));assert.equal(I.steps[5].guard(g),'');}
 if(i===2){assert.ok(g.endpoint);assert.equal(I.steps[4].guard(g),'');assert.ok(I.steps[5].guard(g));}
}
// Construction locks the circumcircle; moving through its center keeps a point
// at its preceding position instead of accidentally placing it off the circle.
{
 const v=I.initial.map(q=>({...q})),p={};I.construction.steps[0].enter(v,p,M);
 const saved={...p.circle.o},r=p.circle.r;
 v[1]={...saved};const locked=I.construction.constrain(v,p,1,M);
 locked.forEach(q=>close(M.dist(q,saved),r));
 const free=I.construction.constrain([P(0,0),P(2,0),P(0,1)],p,0,M);
 assert.equal(free[1].x,2,'undo must release the circle constraint');
}
for(const vertices of [[P(0,0),P(1,0),P(2,0)],[P(0,0),P(0,0),P(1,1)]])assert.ok(M.triangle(vertices).degenerate);
assert.equal(I.steps.length,8);assert.equal(C.steps.length,10);
console.log(`Circle angles: ${triangles} triangles, ${quadTests} convex candidates, ${draws} finite stages; intercepted arcs, all diameter cases, cyclicity, converse inequalities, and blank-first reveal passed.`);
