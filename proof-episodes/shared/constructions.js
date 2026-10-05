/* Cumulative construction pictures. These reveal the objects to investigate;
   the separate sentence-by-sentence proofs explain the resulting relations. */
(() => {
  'use strict';
  const part = name => ({'data-part': 'construction-' + name});
  const bounds = (o, r) => [{x:o.x-r,y:o.y-r},{x:o.x+r,y:o.y+r}];
  const width = (level, introduced) => level === introduced ? 3.8 : 1.8;
  const baseExtent = g => [...g.vertices];
  const none = () => [];
  const free = 'Drag A, B, or C freely; only the completed construction steps are shown.';

  function labels(d, g, entries, M) {
    const groups = [], eps = 1e-10*g.scale;
    for (const [point,label,color,opts={}] of entries) {
      const match = groups.find(item => M.dist(item.point,point)<=eps);
      if (match) match.label += ' ≈ '+label;
      else groups.push({point,label,color,opts});
    }
    for (const item of groups) {
      const nearVertex = g.vertices.findIndex(q=>M.dist(q,item.point)<=eps);
      const text = item.label+(nearVertex<0?'':' ≈ '+'ABC'[nearVertex]);
      d.point(item.point,text,item.color,{...part('point-'+item.label),...item.opts});
    }
  }

  function perpendicular(d, from, foot, a, b, color, lineWidth, name, M) {
    d.line(a,b,d.colors.muted,1,{...part(name+'-side-line'),'stroke-dasharray':'4 5'});
    d.segment(from,foot,color,lineWidth,part(name));
    if (M.dist(from,foot)>1e-12*M.dist(a,b)) d.right(foot,from,M.add(foot,M.sub(b,a)),color);
  }

  function centerConstruction(d,g,kind,level,introduced,M,showFeet=false) {
    const color = kind==='O'?d.colors.blue:d.colors.purple;
    for(let i=0;i<2;i++) {
      const a=g.vertices[(i+1)%3], b=g.vertices[(i+2)%3];
      const origin=kind==='O'?g.mids[i]:g.vertices[i];
      d.line(origin,M.add(origin,M.perp(M.sub(b,a))),color,width(level,introduced),part((kind==='O'?'perpendicular-bisector-':'altitude-')+i));
      if(kind==='O') {
        d.tick(a,origin,color,i+1);d.tick(origin,b,color,i+1);
        d.right(origin,M.add(origin,M.sub(b,a)),M.add(origin,M.perp(M.sub(b,a))),color);
      } else if(showFeet) perpendicular(d,g.vertices[i],g.feet[i],a,b,color,1.7,'center-altitude-foot-'+i,M);
    }
  }

  function midpointFamily(d,g,family,level,introduced,entries,M) {
    const halves=family==='half', points=halves?g.half:g.mids;
    const names=halves?['U','V','W']:['D','E','F'], color=halves?d.colors.teal:d.colors.gold;
    points.forEach((q,i)=>{
      const a=halves?g.H:g.vertices[(i+1)%3], b=halves?g.vertices[i]:g.vertices[(i+2)%3];
      d.segment(a,b,color,width(level,introduced),part((halves?'H-vertex-':'side-midpoint-')+i));
      d.tick(a,q,color,i+1);d.tick(q,b,color,i+1);
      entries.push([q,names[i],color,{dx:12,dy:halves?22:-14}]);
    });
  }

  function midpointCenter(d,g,level,introduced,entries) {
    d.segment(g.O,g.H,d.colors.gold,width(level,introduced),part('OH'));
    d.tick(g.O,g.N,d.colors.gold);d.tick(g.N,g.H,d.colors.gold);
    entries.push([g.N,'N',d.colors.blue,{dx:13,dy:22}]);
  }

  function placeCircleVertex(v,p,M) {
    const o=M.mid(v[0],v[1]), r=M.dist(v[0],v[1])/2;
    if(r<1e-12)return v;
    let direction=M.sub(v[2],o);
    if(M.norm(direction)<r*1e-8)direction=M.perp(M.sub(v[1],v[0]));
    return [v[0],v[1],M.add(o,M.mul(M.unit(direction),r))];
  }

  const constructions = {
    incenter: {
      steps:[
        {label:'Draw the bisector at A',text:'Draw the internal angle bisector from A to the opposite side; matching arcs identify its two equal angles.'},
        {label:'Draw the bisector at B',text:'Add the internal angle bisector from B and inspect its crossing with the first bisector.'},
        {label:'Mark their intersection I',text:'Name the intersection of the first two internal bisectors I.'},
        {label:'Draw the bisector at C',text:'Add the third internal bisector to inspect the concurrence claim; the proof will explain why it passes through I.'},
        {label:'Drop three perpendiculars',text:'Drop perpendiculars from I to AB, AC, and BC, naming their feet X, Y, and Z.'},
        {label:'Draw the circle centered at I',text:'Draw the circle with center I and radius IX, then inspect its contact with the other two sides.'}
      ],
      handleIds:none,
      draw(d,g,l,p,M) {
        if(!l)return;
        const entries=[], c=d.colors;
        for(const i of (l>=4?[0,1,2]:l>=2?[0,1]:[0])) {
          const stage=i===0?1:i===1?2:4, color=[c.blue,c.teal,c.purple][i];
          const v=g.vertices[i], a=g.vertices[(i+1)%3],b=g.vertices[(i+2)%3];
          d.segment(v,g.bisectorEnds[i],color,width(l,stage),part('internal-bisector-'+i));
          d.angle(a,v,g.bisectorEnds[i],color,{radius:24,...part('angle-half-'+i+'a')});
          d.angle(g.bisectorEnds[i],v,b,color,{radius:24,...part('angle-half-'+i+'b')});
        }
        if(l>=3)entries.push([g.I,'I',c.gold,{dx:14,dy:-17}]);
        if(l>=5) {
          [[g.X,g.A,g.B,'X',c.blue],[g.Y,g.A,g.C,'Y',c.teal],[g.Z,g.B,g.C,'Z',c.purple]].forEach(([q,a,b,name,color])=>{
            perpendicular(d,g.I,q,a,b,color,width(l,5),'distance-I'+name,M);
            entries.push([q,name,color,{dx:11,dy:18}]);
          });
        }
        if(l>=6)d.circle(g.I,M.dist(g.I,g.X),c.gold,width(l,6),part('incircle'));
        labels(d,g,entries,M);
      },
      extent(g,p,l,M) {
        const out=baseExtent(g);
        if(l>=1)out.push(g.bisectorEnds[0]);if(l>=2)out.push(g.bisectorEnds[1]);
        if(l>=3)out.push(g.I);if(l>=4)out.push(g.bisectorEnds[2]);
        if(l>=5)out.push(g.X,g.Y,g.Z);if(l>=6)out.push(...bounds(g.I,M.dist(g.I,g.X)));
        return out;
      },
      status:(g,p,l,M)=>l>=5?`Perpendicular lengths: IX ≈ ${M.fmt(M.dist(g.I,g.X),3)}, IY ≈ ${M.fmt(M.dist(g.I,g.Y),3)}, IZ ≈ ${M.fmt(M.dist(g.I,g.Z),3)}; the proof establishes exact equality.`:free
    },

    'euler-line': {
      steps:[
        {label:'Draw two medians',text:'Mark D and E as the midpoints of BC and CA, then draw the medians AD and BE.'},
        {label:'Mark the centroid G',text:'Name the intersection of the two medians G, as in the centroid episode.'},
        {label:'Construct the circumcenter O',text:'Intersect the perpendicular bisectors of BC and CA to construct O; the proof begins with O ≠ G, or equivalently a non-equilateral triangle.'},
        {label:'Draw the line through O and G',text:'When O and G are distinct, draw their unique line; coincident centers do not determine a unique line.'},
        {label:'Place X with GX = 2GO',text:'Place X on the opposite side of G from O, twice as far from G; this construction does not yet identify X as the orthocenter.'},
        {label:'Compare triangles DGO and AGX',text:'Join D to O and A to X to compare the two triangles; when they collapse onto AD, the proof treats that case separately.'},
        {label:'Draw the three altitudes',text:'Draw the altitude from each vertex and inspect X; the similarity proof will explain why the same X lies on every altitude.'}
      ],
      handleIds:none,
      draw(d,g,l,p,M) {
        if(!l)return;const c=d.colors,entries=[];
        for(let i=0;i<2;i++) {
          const mid=g.mids[i],a=g.vertices[(i+1)%3],b=g.vertices[(i+2)%3];
          d.segment(g.vertices[i],mid,c.teal,width(l,1),part('median-'+i));
          d.tick(a,mid,c.teal,i+1);d.tick(mid,b,c.teal,i+1);
          entries.push([mid,['D','E'][i],c.teal]);
        }
        if(l>=2)entries.push([g.G,'G',c.purple,{dx:12,dy:22}]);
        if(l>=3){centerConstruction(d,g,'O',l,3,M);entries.push([g.O,'O',c.blue,{dx:-22,dy:-16}]);}
        if(l>=4&&!g.coincident)d.line(g.O,g.G,c.gold,width(l,4),part('euler-line'));
        if(l>=5){
          if(!g.coincident){
            d.segment(g.O,g.G,c.blue,3.5,part('OG'));d.segment(g.G,g.X,c.gold,3.5,part('GX'));
            const half=M.mid(g.G,g.X);d.tick(g.O,g.G,c.blue);d.tick(g.G,half,c.gold);d.tick(half,g.X,c.gold);
          }
          entries.push([g.X,'X',c.gold,{dx:14,dy:-18}]);
        }
        if(l>=6&&!g.comparisonFlat){
          d.poly([g.mids[0],g.G,g.O],c.blue,.13,part('triangle-DGO'));d.poly([g.A,g.G,g.X],c.teal,.14,part('triangle-AGX'));
          d.segment(g.mids[0],g.O,c.blue,width(l,6),part('DO'));d.segment(g.A,g.X,c.teal,width(l,6),part('AX'));
        }
        if(l>=7)for(let i=0;i<3;i++){
          const a=g.vertices[(i+1)%3],b=g.vertices[(i+2)%3],color=[c.teal,c.purple,c.blue][i];
          d.line(g.vertices[i],M.add(g.vertices[i],M.perp(M.sub(b,a))),color,width(l,7),part('altitude-'+i));
          d.line(a,b,c.muted,1,{...part('altitude-side-'+i),'stroke-dasharray':'4 5'});
          const f=g.feet[i];d.right(f,M.add(f,M.perp(M.sub(b,a))),M.add(f,M.sub(b,a)),color);
        }
        labels(d,g,entries,M);
      },
      extent(g,p,l) {const out=baseExtent(g);if(l>=1)out.push(g.mids[0],g.mids[1]);if(l>=2)out.push(g.G);if(l>=3)out.push(g.O);if(l>=5)out.push(g.X);if(l>=7)out.push(...g.feet);return out;},
      status(g,p,l,M) {
        if(l>=4&&g.coincident)return 'O and G are indistinguishable at drawing precision; no unique joining line is drawn, and ≈ does not assert exact equality.';
        if(l>=6&&g.comparisonFlat)return 'The comparison triangles are flat at drawing precision; the proof explains the exact collinear cases separately.';
        return l>=5?`GX/GO ≈ ${M.fmt(M.dist(g.G,g.X)/M.dist(g.O,g.G),3)} by construction. The proof will identify X as H.`:free;
      }
    },

    'angle-bisector': {
      steps:[
        {label:'Place D on BC',text:'Place D strictly inside BC; it can be dragged along the side independently of the triangle.'},
        {label:'Draw AD',text:'Join A to D and compare the two angles into which AD divides angle BAC.'},
        {label:'Place D on the angle bisector',text:'Move D once to the internal-bisector position, then keep D free to test what happens when it moves.',enter(v,p,M){const ab=M.dist(v[0],v[1]),ac=M.dist(v[0],v[2]);p.t=ab/(ab+ac);}},
        {label:'Drop the perpendicular heights',text:'Drop DX and DY to the full lines AB and AC, and AF to the full line BC.'},
        {label:'Shade the two triangles',text:'Shade ABD and ACD and compare the two side ratios; the proof identifies exactly when they agree.'}
      ],
      handleIds:l=>l>=1?['D']:[],
      draw(d,g,l,p,M) {
        if(!l)return;const c=d.colors,entries=[];
        if(l>=2) {
          d.segment(g.A,g.D,c.gold,width(l,2),part('AD'));
          d.angle(g.B,g.A,g.D,c.blue,{radius:27,label:M.fmt(M.angle(g.B,g.A,g.D),1)+'°',...part('angle-BAD')});
          d.angle(g.D,g.A,g.C,c.teal,{radius:39,label:M.fmt(M.angle(g.D,g.A,g.C),1)+'°',...part('angle-DAC')});
        }
        if(l===3)d.segment(g.A,g.D,c.gold,4,part('placed-bisector'));
        if(l>=4) {
          [[g.D,g.X,g.A,g.B,'X',c.blue],[g.D,g.Y,g.A,g.C,'Y',c.teal],[g.A,g.F,g.B,g.C,'F',c.purple]].forEach(([from,q,a,b,name,color])=>{
            perpendicular(d,from,q,a,b,color,width(l,4),'height-'+name,M);entries.push([q,name,color,{dx:12,dy:18}]);
          });
        }
        if(l>=5) {
          d.poly([g.A,g.B,g.D],c.blue,.15,part('area-ABD'));d.poly([g.A,g.C,g.D],c.teal,.15,part('area-ACD'));
          d.segment(g.B,g.D,c.blue,3,part('BD'));d.segment(g.D,g.C,c.teal,3,part('DC'));
          d.segment(g.A,g.B,c.blue,3,part('AB'));d.segment(g.A,g.C,c.teal,3,part('AC'));
        }
        labels(d,g,entries,M);
      },
      extent(g,p,l){const out=baseExtent(g);if(l>=1)out.push(g.D);if(l>=4)out.push(g.X,g.Y,g.F);return out;},
      status(g,p,l,M){return l>=5?`D is still free: BD/DC ≈ ${M.fmt(g.bd/g.dc,3)} and AB/AC ≈ ${M.fmt(g.ab/g.ac,3)}; rounded agreement is an observation.`:l>=1?'D remains freely draggable along BC, including after the one-time placement on the bisector.':free;}
    },

    thales: {
      steps:[
        {label:'Mark the midpoint M',text:'Mark the midpoint M of AB, so the two halves of AB have equal length.'},
        {label:'Draw the diameter circle',text:'Draw the circle centered at M with radius MA; AB is its diameter.'},
        {label:'Place C on the circle',text:'Move C onto this circle and keep it there while dragging; undo this step to make C free again.'},
        {label:'Join the three radii',text:'Join M to A, B, and C to reveal the two isosceles triangles AMC and BMC.'},
        {label:'Inspect the angle at C',text:'Mark the angle ACB and compare it with a right angle; the proof explains why a diameter gives this result.'}
      ],
      handleIds:none,
      constrain:(v,p,l,M)=>l>=3?placeCircleVertex(v,p,M):v,
      draw(d,g,l,p,M) {
        if(!l)return;const c=d.colors,m=g.diameterCenter,r=g.diameterRadius;
        d.segment(g.A,g.B,c.gold,width(l,1),part('diameter-AB'));d.tick(g.A,m,c.gold);d.tick(m,g.B,c.gold);
        if(l>=2)d.circle(m,r,c.blue,l===2||l===3?3.8:1.8,part('diameter-circle'));
        if(l===3){d.segment(g.A,g.C,c.gold,3,part('moved-C-arm-AC'));d.segment(g.B,g.C,c.gold,3,part('moved-C-arm-BC'));}
        if(l>=4) {
          d.poly([g.A,m,g.C],c.blue,.10,part('isosceles-AMC'));d.poly([g.B,m,g.C],c.teal,.10,part('isosceles-BMC'));
          [g.A,g.B,g.C].forEach((q,i)=>{d.segment(m,q,c.gold,width(l,4),part('radius-'+i));d.tick(m,q,c.gold);});
        }
        if(l>=5){d.right(g.C,g.A,g.B,c.gold);d.angle(g.A,g.C,g.B,c.purple,{radius:32,label:M.fmt(g.angleC,1)+'°',...part('angle-C')});}
        labels(d,g,[[m,'M',c.gold,{dx:10,dy:20}]],M);
      },
      extent(g,p,l){const out=baseExtent(g);if(l>=1)out.push(g.diameterCenter);if(l>=2)out.push(...bounds(g.diameterCenter,g.diameterRadius));return out;},
      status(g,p,l,M){return l>=3?`C is constrained to the diameter circle; A and B remain free, and angle ACB ≈ ${M.fmt(g.angleC,1)}°. Undo to before “Place C” to free C.`:free;}
    },

    'nine-point-circle': {
      steps:[
        {label:'Construct the circumcircle',text:'Intersect two perpendicular bisectors at O and draw the circle with center O through A, with radius R = OA.'},
        {label:'Construct the orthocenter H',text:'Intersect the altitude lines from A and B to construct H.'},
        {label:'Mark the midpoint N of OH',text:'Join O to H and mark the midpoint N of that segment.'},
        {label:'Halve the H-to-vertex segments',text:'Mark U, V, and W as the midpoints of HA, HB, and HC.'},
        {label:'Draw the circle of radius R/2',text:'Draw the circle centered at N with half the circumradius and inspect U, V, and W.'},
        {label:'Mark the three side midpoints',text:'Add the midpoints D, E, and F of BC, CA, and AB, then compare all six points with the smaller circle.'}
      ],
      handleIds:none,
      draw(d,g,l,p,M) {
        if(!l)return;const c=d.colors,entries=[[g.O,'O',c.blue,{dx:-22,dy:-15}]];
        centerConstruction(d,g,'O',l,1,M);d.circle(g.O,g.R,c.muted,width(l,1),part('circumcircle'));
        d.segment(g.O,g.A,c.muted,width(l,1),part('circumradius'));
        d.label(M.mid(g.O,g.A),'R',c.muted,{dx:7,dy:14,...part('radius-label')});
        if(l>=2){centerConstruction(d,g,'H',l,2,M);entries.push([g.H,'H',c.purple,{dx:16,dy:27}]);}
        if(l>=3)midpointCenter(d,g,l,3,entries);
        if(l>=4)midpointFamily(d,g,'half',l,4,entries,M);
        if(l>=5)d.circle(g.N,g.R/2,c.blue,width(l,5),part('nine-point-circle'));
        if(l>=6)midpointFamily(d,g,'side',l,6,entries,M);
        labels(d,g,entries,M);
      },
      extent(g,p,l){const out=baseExtent(g);if(l>=1)out.push(g.O,...bounds(g.O,g.R));if(l>=2)out.push(g.H);if(l>=3)out.push(g.N);if(l>=4)out.push(...g.half);if(l>=5)out.push(...bounds(g.N,g.R/2));if(l>=6)out.push(...g.mids);return out;},
      status:(g,p,l)=>l>=6?'Six named points are visible; the proof establishes their exact circle membership, including cases where names coincide.':free
    },

    'nine-point-circle-altitudes': {
      steps:[
        {label:'Construct the circumcircle',text:'Construct O using two perpendicular bisectors and draw the circumcircle of radius R = OA.'},
        {label:'Construct the orthocenter H',text:'Intersect two altitude lines to recover H; their feet will be marked separately below.'},
        {label:'Construct the smaller circle',text:'Mark N as the midpoint of OH and draw the circle centered at N with radius R/2 from Part I.'},
        {label:'Recall the six midpoints',text:'Mark the three side midpoints D, E, F and the three midpoints U, V, W of HA, HB, HC.'},
        {label:'Mark the altitude foot A₁',text:'Drop the perpendicular from A to the full line BC and mark its foot A₁, even when it lies on an extension.'},
        {label:'Mark the altitude foot B₁',text:'Drop the perpendicular from B to the full line CA and mark its foot B₁.'},
        {label:'Mark the altitude foot C₁',text:'Drop the perpendicular from C to the full line AB and mark its foot C₁, completing the nine named points.'}
      ],
      handleIds:none,
      draw(d,g,l,p,M) {
        if(!l)return;const c=d.colors,entries=[[g.O,'O',c.muted,{dx:-22,dy:-15}]];
        centerConstruction(d,g,'O',l,1,M);d.circle(g.O,g.R,c.muted,width(l,1),part('circumcircle'));
        d.segment(g.O,g.A,c.muted,width(l,1),part('circumradius'));
        d.label(M.mid(g.O,g.A),'R',c.muted,{dx:7,dy:14,...part('radius-label')});
        if(l>=2){centerConstruction(d,g,'H',l,2,M);entries.push([g.H,'H',c.purple,{dx:16,dy:27}]);}
        if(l>=3){midpointCenter(d,g,l,3,entries);d.circle(g.N,g.R/2,c.blue,width(l,3),part('nine-point-circle'));}
        if(l>=4){midpointFamily(d,g,'half',l,4,entries,M);midpointFamily(d,g,'side',l,4,entries,M);}
        for(let i=0;i<Math.min(3,Math.max(0,l-4));i++) {
          const color=[c.purple,c.teal,c.gold][i];
          perpendicular(d,g.vertices[i],g.feet[i],g.vertices[(i+1)%3],g.vertices[(i+2)%3],color,width(l,5+i),'altitude-foot-'+i,M);
          entries.push([g.feet[i],['A₁','B₁','C₁'][i],color,{dx:12,dy:22}]);
        }
        labels(d,g,entries,M);
      },
      extent(g,p,l){const out=baseExtent(g);if(l>=1)out.push(g.O,...bounds(g.O,g.R));if(l>=2)out.push(g.H);if(l>=3)out.push(g.N,...bounds(g.N,g.R/2));if(l>=4)out.push(...g.half,...g.mids);if(l>=5)out.push(...g.feet.slice(0,l-4));return out;},
      status:(g,p,l)=>l>=5?'Altitude feet may lie on side extensions; ≈ labels group points indistinguishable at drawing precision without asserting exact coincidence.':free
    },

    ceva: {
      steps:[
        {label:'Place D and draw AD',text:'Place D strictly inside BC and draw the cevian AD; D stays draggable along its side.'},
        {label:'Place E and draw BE',text:'Place E strictly inside CA and add the cevian BE.'},
        {label:'Mark their intersection P',text:'Name the interior intersection of AD and BE as P.'},
        {label:'Place F and draw CF',text:'Place F independently inside AB and draw CF; the third cevian need not pass through P.'},
        {label:'Move F to the concurrent position',text:'Move F once to where the ray CP meets AB, then keep all three side points free to test the criterion.',enter(v,p,M){const D=M.lerp(v[1],v[2],p.d),E=M.lerp(v[2],v[0],p.e),P=M.intersect(v[0],D,v[1],E),F=P&&M.intersect(v[2],P,v[0],v[1]);if(F)p.f=M.parameter(F,v[0],v[1]);}}
      ],
      handleIds:l=>l>=4?['D','E','F']:l>=2?['D','E']:l>=1?['D']:[],
      draw(d,g,l,p,M) {
        if(!l)return;const c=d.colors;
        d.segment(g.A,g.D,c.blue,width(l,1),part('cevian-AD'));
        if(l>=2)d.segment(g.B,g.E,c.teal,width(l,2),part('cevian-BE'));
        if(l>=4)d.segment(g.C,g.F,c.purple,l===4||l===5?3.8:1.8,part('cevian-CF'));
        if(l>=5) {
          [[g.B,g.D,g.C,c.blue],[g.C,g.E,g.A,c.teal],[g.A,g.F,g.B,c.purple]].forEach(([a,q,b,color],i)=>{
            d.segment(a,q,color,3,part('ratio-'+i+'-numerator'));
            d.segment(q,b,color,3,{...part('ratio-'+i+'-denominator'),'stroke-dasharray':'6 4'});
          });
        }
        if(l>=3)labels(d,g,[[g.P,'P',c.gold,{dx:11,dy:-14}]],M);
      },
      extent(g,p,l){const out=baseExtent(g);if(l>=1)out.push(g.D);if(l>=2)out.push(g.E);if(l>=3)out.push(g.P);if(l>=4)out.push(g.F);return out;},
      status(g,p,l,M){return l>=4?`D, E, and F remain free; ratio product ≈ ${M.fmt(g.product,3)}. The placement step moves F once, and later dragging can break concurrence.`:l>=1?'The revealed side points remain freely draggable; future cevians are hidden.':free;}
    }
  };

  window.EpisodeConstructions=constructions;
})();
