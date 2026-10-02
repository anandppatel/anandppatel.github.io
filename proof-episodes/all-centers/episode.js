(() => {
'use strict';
const catalog=window.TriangleCatalog;
if(!Array.isArray(catalog))throw new Error('Load geometry-catalog.js before the all-centers episode.');
const selected=p=>catalog.filter(entry=>p[entry.id]);
const initialParams=Object.fromEntries(catalog.map(entry=>[entry.id,false]));
const cevianKeys=['cevianX','cevianY','cevianZ'];
Object.assign(initialParams,{cevianX:.42,cevianY:.53,cevianZ:.61});
window.ProofEpisode={
 initial:[{x:-.65,y:-.5},{x:-.95,y:.65},{x:.95,y:.65}],
 studio:true,slug:'all-centers',title:'All Centers',subtitle:'One triangle. Choose the centers and constructions to compare.',
 observation:'Each switch adds one center or construction to the same freely draggable triangle.',
 prediction:'Which objects keep their relation as you move a vertex, and which points can leave the triangle?',
 after:'Open a related episode to build its figure and follow the proof.',
 prerequisites:[],
 notes:[
  {title:'Start with your own comparison',body:'The diagram begins with ABC alone. Switch on any combination; a line or circle does not automatically reveal its center. The links beside the switches lead to the corresponding proofs.'},
  {title:'Reading close labels',body:'Selected centers that are indistinguishable at drawing precision share a label joined by ≈. This numerical grouping does not assert an exact equality. In an equilateral triangle, G, O, H, I, and N really do coincide.'},
  {title:'The Euler-line exception',body:'A non-equilateral triangle has a unique Euler line through O, G, and H. An equilateral triangle has O = G = H, so these centers do not determine a unique line. When O and H are too close to distinguish numerically, the line is omitted and the status explains why.'},
  {title:'The free side points',body:'X, Y, and Z lie strictly inside BC, CA, and AB. Drag them or use their arrow keys to change AX, BY, and CZ independently; no concurrence is imposed. These names are distinct from the side midpoints D, E, and F.'},
  {title:'Fit only what you selected',body:'Fit construction includes the selected circles in full and all selected finite points. Infinite lines remain clipped to the drawing window. Fit triangle returns attention to ABC.'}
 ],
 params:initialParams,controlsTarget:'studio-controls',
 // Every catalog entry becomes a toggle here; future center entries require no UI edits.
 controls:catalog.map(({id,label,group,description,episode})=>({id,type:'checkbox',label,group,description,episode,value:false})),
 actions:[
  {label:'Show all centers',run:(v,p)=>catalog.filter(entry=>entry.point).forEach(entry=>{p[entry.id]=true;})},
  {label:'Clear all',run:(v,p)=>catalog.forEach(entry=>{p[entry.id]=false;})}
 ],
 compute(g,p,M){
  const ends=g.vertices.map((v,i)=>{
   const b=g.vertices[(i+1)%3],c=g.vertices[(i+2)%3],vb=M.dist(v,b),vc=M.dist(v,c);
   return M.lerp(b,c,vb/(vb+vc));
  });
  return {
   studioBisectorEnds:ends,
   studioCevianPoints:g.vertices.map((v,i)=>M.lerp(g.vertices[(i+1)%3],g.vertices[(i+2)%3],p[cevianKeys[i]])),
   studioDiameterCenter:M.mid(g.A,g.B),studioDiameterRadius:M.dist(g.A,g.B)/2,
   studioEulerClose:M.dist(g.O,g.H)<=1e-10*g.scale
  };
 },
 handles(g,p,M){
  if(!p.cevians)return [];
  return g.studioCevianPoints.map((point,i)=>({id:['X','Y','Z'][i],point,label:`Point ${['X','Y','Z'][i]} on side ${['BC','CA','AB'][i]}. Drag or use arrow keys.`,move(next){p[cevianKeys[i]]=M.clamp(M.parameter(next,g.vertices[(i+1)%3],g.vertices[(i+2)%3]),.02,.98);}}));
 },
 status(g,p){
  const count=selected(p).length;
  if(!count)return 'Triangle ABC only. Switch on a center or construction to compare them.';
  const euler=p['euler-line']&&g.studioEulerClose?' O and H are indistinguishable at drawing precision, so the Euler line is omitted.':'';
  return `${count} ${count===1?'selection':'selections'} active. Drag A, B, or C; every selected object follows the triangle.${p.cevians?' X, Y, and Z are also draggable.':''}${euler}`;
 },
 extent(g,p){
  const M=window.EpisodeMath;
  return selected(p).flatMap(entry=>entry.point?[entry.point(g)]:entry.extent?entry.extent(g,p,M):[]);
 },
 draw(d,g,s,p,M){
  const entries=selected(p),centers=[];
  entries.filter(entry=>!entry.point).forEach(entry=>entry.draw?.(d,g,p,M));
  const colors=[d.colors.purple,d.colors.blue,d.colors.gold,d.colors.teal,d.colors.red];
  for(const entry of entries.filter(entry=>entry.point)){
   const point=entry.point(g),label=entry.label.split(' · ')[0];
   const found=centers.find(item=>M.dist(item.point,point)<=1e-10*g.scale);
   if(found)found.labels.push(label);
   else centers.push({point,labels:[label],color:colors[catalog.filter(item=>item.point).indexOf(entry)%colors.length],id:entry.id});
  }
  centers.forEach(({point,labels,color,id})=>{
   const vertex=g.vertices.findIndex(v=>M.dist(v,point)<=1e-10*g.scale);
   if(vertex>=0)labels.push(['A','B','C'][vertex]);
   d.point(point,labels.join(' ≈ '),color,{dx:14,dy:-15,'data-part':'studio-'+id});
  });
 },
 steps:[]
};
})();
