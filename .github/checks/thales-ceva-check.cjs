'use strict';
// Numerical regression checks for diagram constructions, not proofs of the theorems.
const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict'), path = require('node:path');
const root = path.resolve(__dirname, '../../proof-episodes') + path.sep;
const M = require(root+'shared/geometry.js');
const configs=['thales','ceva'].map(slug=>{const window={};vm.runInNewContext(fs.readFileSync(root+slug+'/episode.js','utf8'),{window});return window.ProofEpisode;});
const close=(a,b,eps=1e-8)=>assert(Math.abs(a-b)<=eps*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);
const gFor = v => M.triangle(v);
let seed=381119; const rnd=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
const randomVertices=()=>Array.from({length:3},()=>({x:rnd()*4-2,y:rnd()*4-2}));
const finitePoint=point=>{if(point&&typeof point==='object'&&'x'in point){assert(Number.isFinite(point.x)&&Number.isFinite(point.y));}};
const d={colors:{blue:'#00f',teal:'#0f0',purple:'#a0f',gold:'#ff0',muted:'#888'}};
for(const name of ['segment','line','circle','point','label','right','tick','angle','poly'])d[name]=(...args)=>{for(const arg of args){if(Array.isArray(arg))arg.forEach(finitePoint);else finitePoint(arg);}};
for(let i=0;i<6000;i++){
 let v=randomVertices(); if(M.area(...v)<.02){i--;continue;}
 const thales=configs[0], constrained=thales.constrain(v,{},true,0,M); const g=Object.assign(gFor(constrained),thales.compute(gFor(constrained),{},M));
 if(M.area(...constrained)<1e-8){i--;continue;}
 close(M.dist(g.diameterCenter,g.C),g.diameterRadius);close(g.angleC,90);
 close(M.dist(g.A,g.B),M.dist(g.C,g.reflectedC));
 close(M.dist(g.A,g.C),M.dist(g.B,g.reflectedC));close(M.dist(g.C,g.B),M.dist(g.reflectedC,g.A));
 close(M.dot(M.sub(g.A,g.C),M.sub(g.B,g.C)),0);
 assert.strictEqual(thales.constrain(v,{},false,0,M),v);
 for(let s=-1;s<thales.steps.length;s++)thales.draw(d,g,s,{},M);
 const ceva=configs[1], p={d:.06+rnd()*.88,e:.06+rnd()*.88,f:.015+rnd()*.97};
 let cg=Object.assign(gFor(v),ceva.compute(gFor(v),p,M));
 assert(cg.P && cg.Fprime);assert(cg.areas.every(a=>a>0));
 close(cg.ratios[0],cg.areas[0]/cg.areas[2]);close(cg.ratios[1],cg.areas[1]/cg.areas[0]);
 const tP=M.parameter(cg.P,v[0],cg.D); assert(tP>0&&tP<1);
 ceva.constrain(v,p,true,0,M);cg=Object.assign(gFor(v),ceva.compute(gFor(v),p,M));
 assert(p.f>0&&p.f<1); close(cg.product,1);close(cg.ratios[2],cg.areas[2]/cg.areas[1]);
 close(M.cross(M.sub(cg.P,v[2]),M.sub(cg.F,v[2])),0);
 for(let s=-1;s<ceva.steps.length;s++)ceva.draw(d,cg,s,p,M);
 assert(ceva.handles(cg,p,M).length===2);ceva.constrain(v,p,false,0,M);assert(ceva.handles(cg,p,M).length===3);
}
console.log('PASS: 6,000 varied triangles; Thales circle/right-angle/rectangle identities, Ceva forward/converse ratio identities, free mode, handle modes, and every drawing step.');
