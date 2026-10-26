'use strict';
// Exercise the real SVG painter, including its separate overview projection.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),M=require(root+'/proof-episodes/shared/geometry.js');
class Element {
 constructor(tag){this.tag=tag;this.attrs={};this.children=[];this.parent=null;}
 setAttribute(key,value){this.attrs[key]=String(value);}
 append(node){if(node.parent)node.parent.children.splice(node.parent.children.indexOf(node),1);node.parent=this;this.children.push(node);}
 insertBefore(node,before){if(node.parent)node.parent.children.splice(node.parent.children.indexOf(node),1);node.parent=this;const i=this.children.indexOf(before);this.children.splice(i<0?this.children.length:i,0,node);}
 replaceChildren(){this.children.forEach(node=>{node.parent=null;});this.children=[];}
 get firstChild(){return this.children[0]||null;}
}
const source=fs.readFileSync(root+'/proof-episodes/shared/episode.js','utf8');
const context={
 M,NS:'http://www.w3.org/2000/svg',document:{createElementNS:(ns,tag)=>new Element(tag)},
 finite:p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y),
 colors:{blue:'blue',teal:'teal',purple:'purple',gold:'gold',ink:'ink',muted:'muted',red:'red'},
 width:960,height:720,camera:{x:0,y:0,w:4,h:4},vertices:[],params:{},current:null,
 active:false,studio:false,buildLevel:0,step:0,C:null,B:null
};
vm.createContext(context);
vm.runInContext(source.slice(source.indexOf('function element('),source.indexOf('function updateGeometry('))+'\nthis.paintScene=paint;this.fitScene=fit;',context);
const load=slug=>{
 const scope={window:{EpisodeMath:M}};
 if(slug==='all-centers')vm.runInNewContext(fs.readFileSync(root+'/proof-episodes/shared/geometry-catalog.js','utf8'),scope);
 vm.runInNewContext(fs.readFileSync(root+'/proof-episodes/'+slug+'/episode.js','utf8'),scope);
 return scope.window.ProofEpisode;
};
const cases=[
 [{x:-.25,y:-.7},{x:-.9,y:.55},{x:.85,y:.55}],
 [{x:0,y:0},{x:1,y:0},{x:0,y:1}],
 [{x:0,y:0},{x:1,y:0},{x:.2,y:.1}],
 [{x:0,y:Math.sqrt(3)},{x:-1,y:0},{x:1,y:0}],
 [{x:-1,y:0},{x:.2,y:1e-6},{x:1,y:0}]
];
let states=0;
function verify(group,w,h,expected,mini){
 const lines=group.children.filter(e=>e.attrs['data-part']?.startsWith('excircle-support-'));
 const circles=group.children.filter(e=>e.tag==='circle'&&e.attrs['data-excircle']==='true');
 assert.equal(circles.length>0,expected,'circle reveal order');
 assert.equal(lines.length,expected?3:0,'exactly three full side lines whenever any excircle is visible');
 const triangle=group.children.find(e=>e.attrs['data-part']==='triangle');assert(triangle);
 const vertices=triangle.attrs.points.split(' ').map(pair=>{const [x,y]=pair.split(',').map(Number);return {x,y};});
 for(const [i,name]of ['AB','BC','CA'].entries()){
  if(!expected)break;
  const line=lines.find(e=>e.attrs['data-part']==='excircle-support-'+name);assert(line);
  assert(group.children.indexOf(line)<group.children.indexOf(triangle),'solid triangle edges stay above the supporting lines');
  assert(line.attrs['stroke-dasharray'],'supporting lines have a distinct dashed style');
  assert(Number(line.attrs['stroke-width'])<Number(triangle.attrs['stroke-width']),'triangle edges remain heavier');
  const a=vertices[i],b=vertices[(i+1)%3],direction=M.unit(M.sub(b,a));
  for(const suffix of ['1','2']){
   const q={x:Number(line.attrs['x'+suffix]),y:Number(line.attrs['y'+suffix])};
   assert(Number.isFinite(q.x)&&Number.isFinite(q.y));
   assert(q.x>=-1e-6&&q.x<=w+1e-6&&q.y>=-1e-6&&q.y<=h+1e-6,'line clipped to this viewport');
   assert(Math.min(Math.abs(q.x),Math.abs(q.x-w),Math.abs(q.y),Math.abs(q.y-h))<1e-6,'line reaches viewport boundary');
   assert(Math.abs(M.cross(M.sub(q,a),direction))<.01,'supporting line is collinear with its corresponding triangle side');
  }
 }
 if(context.studio&&!mini&&expected)assert(!group.children.some(e=>e.attrs['data-part']?.startsWith('point-')),'an excircle does not force any point or center marker');
 states++;
}
function render(expected,extent){
 // Fit triangle is the close main view; the second projection fits the whole
 // displayed construction, as the overview does when circles are offscreen.
 context.fitScene(context.vertices);const mainCamera={...context.camera};
 for(const [w,h]of [[960,720],[390,430]]){
  const group=new Element('g');context.paintScene(group,w,h,mainCamera);verify(group,w,h,expected,false);
 }
 context.fitScene([...context.vertices,...extent]);
 const overview=new Element('g');context.paintScene(overview,220,165,context.camera,true);verify(overview,220,165,expected,true);
}
for(const fixture of cases)for(const vertices of [fixture,[fixture[0],fixture[2],fixture[1]]]){
 context.vertices=vertices;
 for(const slug of ['nagel','heron']){
  const C=load(slug),base=M.triangle(vertices);context.C=C;context.B=C.construction;context.studio=false;context.params={};
  context.current={...base,...C.compute(base,{},M)};
  context.active=false;
  for(let level=0;level<=C.construction.steps.length;level++){
   context.buildLevel=level;render(level>=4,C.construction.extent(context.current,{},level,M));
  }
  context.active=true;
  for(let step=0;step<C.steps.length;step++){
   context.step=step;render(slug==='nagel'?step>=5&&step<=11:step>=6&&step<=15,C.extent(context.current,{},step,M));
  }
 }
 const C=load('all-centers'),base=M.triangle(vertices);context.C=C;context.B=null;context.studio=true;context.active=false;
 // Every subset of excircles: drawing a second or third circle must not
 // darken the same supporting lines by painting them repeatedly.
 for(let mask=0;mask<8;mask++){
  context.params={...C.params};['a','b','c'].forEach((name,i)=>{context.params['excircle-'+name]=!!(mask&(1<<i));});
  context.current={...base,...C.compute(base,context.params,M)};render(mask!==0,C.extent(context.current,context.params));
 }
 context.params={...C.params,excenters:true,'excircle-contacts':true};context.current={...base,...C.compute(base,context.params,M)};
 render(false,C.extent(context.current,context.params));
}
// Collapsed triangles pause every construction, including its side extensions.
context.vertices=[{x:0,y:0},{x:1,y:0},{x:2,y:0}];context.current=M.triangle(context.vertices);context.params={'excircle-a':true};render(false,[]);
// The three static figures that actually contain excircles use the same
// all-side convention; older downloadable illustrations remain covered.
for(const file of ['excircle.svg','heron.svg','heron-derivation.svg']){
 const svg=fs.readFileSync(root+'/proof-episodes/homework/cevians-and-area/figures/'+file,'utf8');
 const [,w,h]=svg.match(/viewBox="0 0 (\d+) (\d+)"/).map(Number);
 const lines=[...svg.matchAll(/<line\b[^>]*data-part="excircle-support-(AB|BC|CA)"[^>]*\/>/g)];
 assert.equal(lines.length,3,file+' includes all three supporting lines');
 assert.equal(new Set(lines.map(match=>match[1])).size,3);
 for(const [markup]of lines)for(const suffix of ['1','2']){
  const x=Number(markup.match(new RegExp('x'+suffix+'="([^"]+)"'))[1]),y=Number(markup.match(new RegExp('y'+suffix+'="([^"]+)"'))[1]);
  assert(x>=-.001&&x<=w+.001&&y>=-.001&&y<=h+.001);
  assert(Math.min(Math.abs(x),Math.abs(x-w),Math.abs(y),Math.abs(y-h))<=.001,'static line reaches viewport boundary');
 }
}
console.log(`Excircle lines: ${states} actual SVG scenes pass full-viewport clipping, desktop/phone/overview projection, reveal order, distinct triangle edges, independent switches and degeneracy checks; all three static excircle figures pass.`);
