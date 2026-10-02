(() => {
'use strict';
const byId=id=>document.getElementById(id);
const set=(el,attrs)=>Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));
// Arrays are separate facts, not factors in a product.
function renderEquation(element, value) {
 if (!Array.isArray(value)) { element.textContent=value; return; }
 const list=document.createElement('ul');
 list.className='proof-facts';
 value.forEach(fact=>{const item=document.createElement('li');item.textContent=fact;list.appendChild(item);});
 element.replaceChildren(list);
}
const steps=[
 {title:'Begin with two medians',sentence:'For a noncollinear triangle, let D and E be the midpoints of BC and CA, and let the medians AD and BE meet inside the triangle at G.',equation:['BD = DC','AE = EC'],regions:[],medians:['a','b'],segments:['BD','DC','AE','EC']},
 {title:'Equal halves',sentence:'Triangles ABD and ACD have equal bases BD and DC and the same height from A, so they have equal areas.',equation:'[ABD] = [ACD]',regions:['ABD','ACD'],medians:['a'],segments:['BD','DC']},
 {title:'Equal smaller pieces',sentence:'Triangles BGD and CGD also have equal bases BD and DC and a common height from G, so their areas are equal.',equation:'[BGD] = [CGD]',regions:['BGD','CGD'],medians:['a'],segments:['BD','DC']},
 {title:'Subtract equal areas',sentence:'Subtracting BGD and CGD from the equal halves ABD and ACD leaves triangles ABG and ACG with equal areas.',equation:'[ABG] = [ACG]',regions:['ABG','ACG'],removed:['BGD','CGD'],medians:['a']},
 {title:'Use the second midpoint',sentence:'Triangles ABE and CBE have equal bases AE and EC and the same height from B, so they have equal areas.',equation:'[ABE] = [CBE]',regions:['ABE','CBE'],medians:['b'],segments:['AE','EC']},
 {title:'Another equal pair',sentence:'Triangles AGE and CGE have equal bases AE and EC and the same height from G, so they too have equal areas.',equation:'[AGE] = [CGE]',regions:['AGE','CGE'],medians:['b'],segments:['AE','EC']},
 {title:'Three equal areas',sentence:'Subtracting AGE and CGE from those equal halves gives [ABG] = [BCG], which combines with our earlier equality to make all three areas below equal.',equation:'[ABG] = [BCG] = [ACG]',regions:['ABG','BCG'],removed:['AGE','CGE'],medians:['a','b']},
 {title:'Locate the third midpoint',sentence:'Extend CG through G until it meets AB at X; we will prove that X is the midpoint of AB.',equation:'C, G, X lie on one line',regions:[],medians:[],segments:['CX'],showX:true},
 {title:'Compare bases on the same line',sentence:'Triangles AGX and ACG have the same height from A to the line CX, so their areas are in the ratio of their bases GX and GC.',equation:'[AGX] / [ACG] = GX / GC',regions:['AGX','ACG'],segments:['GX','GC'],showX:true},
 {title:'Make the same comparison from B',sentence:'Triangles BGX and BCG likewise share a height from B to CX, so their areas have the same base ratio GX to GC.',equation:'[BGX] / [BCG] = GX / GC',regions:['BGX','BCG'],segments:['GX','GC'],showX:true},
 {title:'Transfer the equality',sentence:'Since [ACG] = [BCG], multiplying both by the same number GX / GC gives equal areas for AGX and BGX.',equation:'[AGX] = [BGX]',regions:['AGX','BGX'],showX:true,segments:['GX']},
 {title:'Equal areas force equal bases',sentence:'These two triangles have the same height from G to AB, so their equal areas force AX = XB, proving that X is the midpoint F.',equation:'AX = XB   ⇒   X = F',regions:['AGX','BGX'],segments:['AX','XB'],showX:true,proved:true},
 {title:'The three medians meet',sentence:'Thus CF passes through G, and all three medians meet there uniquely because the distinct lines AD and BE already have just one intersection.',equation:'AD ∩ BE ∩ CF = {G}',regions:[],medians:['a','b','c'],proved:true},
 {title:'Read the 2 : 1 ratio from areas',sentence:'Since [BGD] = [CGD] and [ABG] = [BCG], triangle ABG has twice the area of triangle BGD.',equation:'[ABG] = [BCG] = 2[BGD]',regions:['ABG','BGD'],medians:['a'],segments:['AG','GD'],proved:true},
 {title:'The centroid divides each median',sentence:'Triangles ABG and BGD share a height from B to AD, so AG = 2GD; the same argument with the vertices relabelled gives the 2 : 1 ratio on the other two medians.',equation:'AG : GD = BG : GE = CG : GF = 2 : 1',regions:['ABG','BGD'],medians:['a','b','c'],segments:['AG','GD'],proved:true}
];
const palette=['#3977d5','#cf8a22','#139581'];
let index=-1,geometry=null;
function construction(g){
 const [A,B,C]=g.vertices,[D,E,F]=g.midpoints,G=g.centroid;
 // Construct X by intersecting CG with AB, independently of F.
 const cross=(u,v)=>u.x*v.y-u.y*v.x,v={x:G.x-C.x,y:G.y-C.y},w={x:B.x-A.x,y:B.y-A.y};
 const denominator=cross(v,w),t=denominator===0?0:cross({x:A.x-C.x,y:A.y-C.y},w)/denominator;
 return {A,B,C,D,E,F,G,X:{x:C.x+t*v.x,y:C.y+t*v.y}};
}
function render(){
 if(!geometry)return;
 const g=geometry,active=index>=0,step=steps[index],valid=!g.degenerate;
 byId('workspace').classList.toggle('proving',active);
 byId('proof-panel').hidden=!active;
 set(byId('proof-start'),{'aria-expanded':String(active)});
 byId('proof-start').textContent=active?'Restart the area proof':'See the area proof';
 const showThird=!active||step.proved;
 ['median-c','mid-c','label-f'].forEach(id=>set(byId(id),{visibility:showThird?'visible':'hidden'}));
 ['a','b','c'].forEach(key=>{byId('median-'+key).style.opacity=!active||!valid?1:step.medians?.includes(key)?1:.15;});
 ['area-highlights','area-cutouts','area-labels','proof-segments'].forEach(id=>{byId(id).innerHTML='';});
 ['proof-ray','x-point','label-x'].forEach(id=>set(byId(id),{visibility:'hidden'}));
 byId('diagram-title').textContent=active?'Area proof: '+step.title:'Three medians meeting at the centroid';
 if(!active){byId('diagram-desc').textContent='Triangle ABC with D, E, F the side midpoints; its three medians meet at G.';return;}
 byId('proof-stage').textContent=step.title;
 byId('proof-progress').textContent=`Sentence ${index+1} of ${steps.length}`;
 // Leave the live reading region untouched during ordinary drag updates.
 if(byId('proof-sentence').textContent!==step.sentence){byId('proof-sentence').textContent=step.sentence;renderEquation(byId('proof-equation'),step.equation);}
 byId('proof-reading').hidden=!valid;byId('proof-pause').hidden=valid;
 byId('proof-prev').disabled=index===0;byId('proof-next').disabled=!valid;
 byId('proof-next').textContent=index===steps.length-1?'Replay proof':'Next sentence';
 byId('proof-key').innerHTML='';
 if(!valid){byId('diagram-desc').textContent='Area proof paused: these vertices are collinear at drawing precision; move a vertex to resume.';return;}
 const pts=construction(g),showX=step.showX&&!step.proved;
 const path=triple=>triple.split('').map((name,i)=>`${i?'L':'M'}${pts[name].x},${pts[name].y}`).join(' ')+' Z';
 if(step.showX){
  set(byId('proof-ray'),{x1:pts.C.x,y1:pts.C.y,x2:pts.X.x,y2:pts.X.y,visibility:'visible'});
  const dx=pts.X.x-g.centroid.x,dy=pts.X.y-g.centroid.y,len=Math.hypot(dx,dy)||1;
  set(byId('x-point'),{cx:pts.X.x,cy:pts.X.y,visibility:showX?'visible':'hidden'});
  set(byId('label-x'),{x:pts.X.x+21*dx/len,y:pts.X.y+21*dy/len+6,'text-anchor':'middle',visibility:showX?'visible':'hidden'});
 }
 byId('area-highlights').innerHTML=step.regions.map((triple,i)=>`<path class="proof-area" data-region="${triple}" d="${path(triple)}" fill="${palette[i]}" fill-opacity=".25" stroke="${palette[i]}" stroke-opacity=".9"/>`).join('');
 byId('area-cutouts').innerHTML=(step.removed||[]).map(triple=>`<path class="proof-cut" d="${path(triple)}"/>`).join('');
 byId('proof-segments').innerHTML=(step.segments||[]).map(pair=>`<line class="proof-segment" x1="${pts[pair[0]].x}" y1="${pts[pair[0]].y}" x2="${pts[pair[1]].x}" y2="${pts[pair[1]].y}"/>`).join('');
 byId('proof-key').innerHTML=step.regions.map((triple,i)=>`<span><i style="background:${palette[i]}" aria-hidden="true"></i>Triangle ${step.proved?triple.replaceAll('X','F'):triple}</span>`).join('')||'<span>Follow the illuminated segments; the vertices are still draggable.</span>';
 byId('area-labels').innerHTML=step.regions.map(triple=>{
  const coords=triple.split('').map(name=>pts[name]);
  const area=Math.abs((coords[1].x-coords[0].x)*(coords[2].y-coords[0].y)-(coords[1].y-coords[0].y)*(coords[2].x-coords[0].x))/2;
  if(area<1500)return '';
  const x=coords.reduce((s,p)=>s+p.x,0)/3,y=coords.reduce((s,p)=>s+p.y,0)/3;
  return `<text class="proof-region-label" x="${x}" y="${y}">${step.proved?triple.replaceAll('X','F'):triple}</text>`;
 }).join('');
 byId('diagram-desc').textContent=step.sentence+' Highlighted: '+(step.regions.length?step.regions.join(', '):(step.segments||[]).join(', '))+'.';
}
function show(next){index=next;render();}
window.addEventListener('triangle-changed',event=>{geometry=event.detail;render();});
byId('proof-start').addEventListener('click',()=>{show(0);byId('board').scrollIntoView({block:'start',behavior:'auto'});byId('proof-next').focus({preventScroll:true});});
byId('proof-next').addEventListener('click',()=>{if(geometry&&!geometry.degenerate)show((index+1)%steps.length);});
byId('proof-prev').addEventListener('click',()=>show(Math.max(0,index-1)));
byId('proof-close').addEventListener('click',()=>{show(-1);byId('proof-start').focus({preventScroll:true});});
// Request the current diagram if its first resize happened before this script loaded.
window.dispatchEvent(new CustomEvent('triangle-request'));
})();
