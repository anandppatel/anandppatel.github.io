(() => {
  'use strict';

  const part = id => ({'data-part': id});
  const bounds = (o,r) => [{x:o.x-r,y:o.y-r},{x:o.x+r,y:o.y+r}];
  const width = (level,introduced) => level === introduced ? 3.8 : 1.6;

  // These numerical constructions position the picture. The proof below derives
  // the tangent lengths and radius relations independently, following Venema.
  function compute(g,p,M) {
    const {A,B,C} = g, [a,b,c] = g.sides, sum = a+b+c, s = sum/2;
    const gap = (v,q,t) => {
      const u=M.sub(q,v), w=M.sub(t,v), product=M.norm(u)*M.norm(w), dot=M.dot(u,w);
      // Rationalize the small half-perimeter difference at a nearly flat angle.
      const numerator=dot<0 ? M.cross(u,w)**2/(product-dot) : product+dot;
      return numerator/sum;
    };
    const x=gap(B,A,C), y=gap(C,A,B), z=gap(A,B,C);
    // The shared construction uses the contact foot plus an outward normal.
    // Weighted vertex coordinates lose the tangential component near a flat A.
    const E=g.excenters[0];
    return {
      a,b,c,s,x,y,z,E,ra:g.exradii[0],
      X:M.lerp(B,C,x/a),Y:M.lerp(A,C,z/b),Z:M.lerp(A,B,z/c),
      T:M.lerp(B,C,y/a),U:M.add(C,M.mul(M.unit(M.sub(C,A)),x)),V:M.add(B,M.mul(M.unit(M.sub(B,A)),y)),
      heronArea:Math.sqrt(s*x*y*z)
    };
  }

  function labels(d,g,items,M) {
    const groups=[],eps=1e-10*g.scale;
    for(const [q,name,color,opts={}] of items) {
      const found=groups.find(item=>M.dist(item.q,q)<=eps);
      if(found)found.name+=' ≈ '+name;
      else groups.push({q,name,color,opts});
    }
    for(const item of groups) {
      const vertex=g.vertices.findIndex(v=>M.dist(v,item.q)<=eps);
      d.point(item.q,item.name+(vertex<0?'':' ≈ '+'ABC'[vertex]),item.color,{...part('point-'+item.name),...item.opts});
    }
  }

  function labelOffsets(g,M) {
    const orientation=Math.sign(M.cross(M.sub(g.B,g.A),M.sub(g.C,g.A)))||1;
    const outward=(a,b)=>M.mul(M.perp(M.unit(M.sub(b,a))),-orientation);
    const t=M.unit(M.sub(g.C,g.B)),n=outward(g.B,g.C);
    const offset=v=>({dx:v.x+(v.x<0?-7:3),dy:v.y+5});
    // X and T can be close while remaining distinct. Put their text on
    // opposite sides of BC and at different positions along the side.
    // Contact labels on the other two sides face away from the incircle.
    return {
      X:offset(M.sub(M.mul(t,24),M.mul(n,8))),
      T:offset(M.add(M.mul(t,-12),M.mul(n,24))),
      Y:offset(M.mul(outward(g.C,g.A),22)),
      Z:offset(M.mul(outward(g.A,g.B),20)),
      U:offset(M.mul(outward(g.C,g.A),22)),
      V:offset(M.mul(outward(g.A,g.B),20)),
      I:{dx:12,dy:-10},E:{dx:14,dy:20}
    };
  }

  function radius(d,g,center,foot,a,b,color,lineWidth,M,id) {
    d.segment(center,foot,color,lineWidth,part(id));
    if(M.dist(center,foot)>1e-12*g.scale)d.right(foot,center,M.add(foot,M.sub(b,a)),color);
  }

  function incircle(d,g,M,lineWidth=1.6,feet=true,footWidth=lineWidth) {
    d.circle(g.I,g.r,d.colors.blue,lineWidth,part('incircle'));
    if(feet)for(const [foot,a,b,name] of [[g.X,g.B,g.C,'IX'],[g.Y,g.C,g.A,'IY'],[g.Z,g.A,g.B,'IZ']])
      radius(d,g,g.I,foot,a,b,d.colors.blue,footWidth,M,'radius-'+name);
  }

  function excircle(d,g,M,lineWidth=1.6,feet=true,footWidth=lineWidth) {
    const c=d.colors;
    d.segment(g.B,g.V,c.muted,1.2,{'stroke-dasharray':'4 4',...part('extension-BV')});
    d.segment(g.C,g.U,c.muted,1.2,{'stroke-dasharray':'4 4',...part('extension-CU')});
    d.circle(g.E,g.ra,c.teal,lineWidth,part('A-excircle'));
    if(feet)for(const [foot,a,b,name] of [[g.T,g.B,g.C,'ET'],[g.U,g.A,g.C,'EU'],[g.V,g.A,g.B,'EV']])
      radius(d,g,g.E,foot,a,b,c.teal,footWidth,M,'radius-'+name);
  }

  function sideNames(d,g,M) {
    [[g.B,g.C,'a',d.colors.blue],[g.C,g.A,'b',d.colors.teal],[g.A,g.B,'c',d.colors.purple]].forEach(([a,b,name,color])=>{
      d.segment(a,b,color,3,part('side-'+name));
      d.label(M.mid(a,b),name,color,{dx:8,dy:18,...part('side-label-'+name)});
    });
  }

  function tangentPieces(d,g,M,semiperimeter=false) {
    const c=d.colors;
    const entries=[
      [g.A,g.Z,semiperimeter?'s − a':'z',c.purple,1],
      [g.A,g.Y,semiperimeter?'s − a':'z',c.purple,1],
      [g.B,g.Z,semiperimeter?'s − b':'x',c.blue,2],
      [g.B,g.X,semiperimeter?'s − b':'x',c.blue,2],
      [g.C,g.X,semiperimeter?'s − c':'y',c.teal,3],
      [g.C,g.Y,semiperimeter?'s − c':'y',c.teal,3]
    ];
    entries.forEach(([a,b,name,color,n],i)=>{
      d.segment(a,b,color,3.5,part('incircle-tangent-'+i));d.tick(a,b,color,n);
      d.label(M.mid(a,b),name,color,{dx:7,dy:i%2?-10:17,...part('tangent-label-'+i)});
    });
  }

  const construction = {
    steps:[
      {label:'Construct the incircle',text:'Construct the incircle, with center I, using the internal angle bisectors.'},
      {label:'Mark its three contact points',text:'Drop perpendiculars from I to BC, CA, and AB, naming their feet X, Y, and Z.'},
      {label:'Join I to the vertices',text:'Draw IA, IB, and IC to divide ABC into three triangles.'},
      {label:'Construct the A-excircle',text:'Construct the A-excircle, with center E on the internal bisector at A and the exterior bisectors at B and C.'},
      {label:'Mark its three contact points',text:'Mark its feet T on BC, U beyond C on AC, and V beyond B on AB, and draw the three radii.'},
      {label:'Join A to E',text:'Draw AE, which follows the same internal angle bisector as AI.'},
      {label:'Join B to E',text:'Draw BE, the exterior bisector at B, to prepare the second pair of right triangles.'}
    ],
    handleIds:()=>[],
    extent(g,p,level) {
      return [...g.vertices,...(level>=1?bounds(g.I,g.r):[]),...(level>=4?[g.E,g.U,g.V,...bounds(g.E,g.ra)]:[])];
    },
    status:()=> 'Drag any vertex freely; the two circles and their contact points follow the triangle.',
    draw(d,g,level,p,M) {
      if(!level)return;
      const c=d.colors,o=labelOffsets(g,M),marks=[[g.I,'I',c.blue,o.I]];
      incircle(d,g,M,width(level,1),level>=2,width(level,2));
      if(level>=2)marks.push([g.X,'X',c.blue,o.X],[g.Y,'Y',c.blue,o.Y],[g.Z,'Z',c.blue,o.Z]);
      if(level>=3)g.vertices.forEach((v,i)=>d.segment(g.I,v,c.gold,width(level,3),part('construction-I'+'ABC'[i])));
      if(level>=4) {
        excircle(d,g,M,width(level,4),level>=5,width(level,5));marks.push([g.E,'E',c.teal,o.E]);
      }
      if(level>=5)marks.push([g.T,'T',c.teal,o.T],[g.U,'U',c.teal,o.U],[g.V,'V',c.teal,o.V]);
      if(level>=6)d.segment(g.A,g.E,c.purple,width(level,6),part('construction-AE'));
      if(level>=7)d.segment(g.B,g.E,c.gold,width(level,7),part('construction-BE'));
      labels(d,g,marks,M);
    }
  };

  window.ProofEpisode={
    slug:'heron',number:'15',title:'Heron’s formula',
    subtitle:'Two circles, two similarities, and the area from three sides.',
    observation:'For a noncollinear triangle with side lengths a, b, c and semiperimeter s = (a + b + c)/2, its area is √(s(s − a)(s − b)(s − c)).',
    prediction:'The area equals sr; can the incircle and an excircle express r using only the side lengths?',
    after:'Why do s − a, s − b, and s − c stay positive, and what happens to the area when one approaches zero?',
    initial:[{x:-.7,y:.55},{x:.65,y:.55},{x:-.15,y:-.6}],
    prerequisites:[
      {label:'The incenter and incircle',href:'../incenter/'},
      {label:'Nagel: the excircles and their contact points',href:'../nagel/'},
      {label:'C4 · Triangle areas and additivity',href:'../basics/#c4'},
      {label:'C5 · Straight angles',href:'../basics/#c5'},
      {label:'T2 · Triangle angle sum',href:'../basics/#t2'},
      {label:'T5 · AA similarity',href:'../basics/#t5'},
      {label:'O1 · Tangents and radii',href:'../basics/#o1'},
      {label:'O2 · Equal tangent lengths',href:'../basics/#o2'}
    ],
    params:{},construction,compute,
    notes:[
      {title:'The book’s exercise proof',body:'This episode follows Gerard A. Venema, Exploring Advanced Euclidean Geometry with GeoGebra (2013), §4.5, Figure 4.4 on printed p. 44 and Exercises 4.5.1–4.5.7 on printed p. 45 (PDF pages 61–62). Exercise 4.5.2 supplies the tangent-length bookkeeping; 4.5.4 and 4.5.5–4.5.6 supply the two similarities; 4.5.7 states the final formula.'},
      {title:'Which points are where?',body:'E is the A-excenter, rather than a side midpoint. The incircle touches BC, CA, AB at X, Y, Z. The A-excircle touches BC at an interior point T, and the extensions of AC and AB beyond C and B at U and V. The Nagel episode establishes the excircle construction and these positions. These statements hold for acute, right, and obtuse triangles.'},
      {title:'Why neither similarity collapses',body:'The tangent lengths x = s − b, y = s − c, z = s − a and both radii are strictly positive for a noncollinear triangle. Thus AZI, AVE, ZBI, and VEB are genuine right triangles even when ABC is right or obtuse. X and T can coincide in an isosceles triangle; no step requires them to be distinct.'},
      {title:'Keep the two angle correspondences separate',body:'The first similarity is AZI ∼ AVE, with A ↔ A, Z ↔ V, I ↔ E. The second is ZBI ∼ VEB, with Z ↔ V, B ↔ E, I ↔ B. At B, the internal and external half-angles are complementary, not equal.'},
      {title:'An exact formula and a numerical picture',body:'The proof establishes an exact area identity. Decimal measurements and labels joined by ≈ only report the drawing’s precision; they do not establish exact equality or point coincidence. Very flat triangles can have an A-excircle far beyond the triangle; use Fit construction to see it.'}
    ],
    actions:[
      {label:'Right triangle',run:v=>v.splice(0,3,{x:-.65,y:-.55},{x:-.65,y:.55},{x:.8,y:.55})},
      {label:'Obtuse triangle',run:v=>v.splice(0,3,{x:-.2,y:.1},{x:-.9,y:.55},{x:.9,y:.55})},
      {label:'Equilateral triangle',run:v=>v.splice(0,3,{x:0,y:-.72},{x:-.75,y:-.72+.75*Math.sqrt(3)},{x:.75,y:-.72+.75*Math.sqrt(3)})}
    ],
    status:(g)=>`Measured area ≈ ${g.area.toFixed(3)}; Heron expression ≈ ${g.heronArea.toFixed(3)}. The proof explains the equality.`,
    extent:(g,p,step)=>[...g.vertices,...(step>=1&&step<=16?bounds(g.I,g.r):[]),...(step>=6&&step<=15?[g.E,g.U,g.V,...bounds(g.E,g.ra)]:[])],
    draw(d,g,step,p,M) {
      const c=d.colors,{A,B,C,I,E,X,Y,Z,T,U,V}=g;
      if(step===0||step===17) {
        if(step===17)d.poly([A,B,C],c.teal,.17,part('heron-area-ABC'));
        sideNames(d,g,M);return;
      }
      const o=labelOffsets(g,M),marks=[[I,'I',c.blue,o.I],[X,'X',c.blue,o.X],[Y,'Y',c.blue,o.Y],[Z,'Z',c.blue,o.Z]];
      incircle(d,g,M,step===1?3:1.2,true);
      if(step>=6&&step<=15) {
        excircle(d,g,M,step===6?3:1.2,true);
        marks.push([E,'E',c.teal,o.E],[T,'T',c.teal,o.T],[U,'U',c.teal,o.U],[V,'V',c.teal,o.V]);
      }
      if(step===1)d.label(M.mid(I,Z),'r',c.blue,{dx:8,dy:0,...part('inradius-label')});
      if(step===2||step===16) {
        [[A,B,c.blue],[B,C,c.teal],[C,A,c.purple]].forEach(([a,b,color],i)=>{
          d.poly([I,a,b],color,.16,part('area-piece-'+i));
          d.segment(I,a,color,2.2,part('area-edge-I'+'ABC'[i]));
        });
        sideNames(d,g,M);
        d.label(M.mid(I,Z),'r',c.gold,{dx:8,dy:0,...part('area-height-r')});
      }
      if(step>=3&&step<=5)tangentPieces(d,g,M,step===5);
      if(step===7||step===8||step===9) {
        const uColor=step===9?c.blue:c.purple,vColor=step===9?c.teal:c.gold;
        [[C,U,uColor,2,'u'],[C,T,uColor,2,'u'],[B,V,vColor,3,'v'],[B,T,vColor,3,'v']].forEach(([a,b,color,count,name],i)=>{
          d.segment(a,b,color,3.5,part('excircle-tangent-'+i));d.tick(a,b,color,count);
          d.label(M.mid(a,b),step===9?(name==='u'?'u = x':'v = y'):name,color,{dx:8,dy:i%2?20:-10,...part('excircle-tangent-label-'+i)});
        });
        if(step===7) {d.segment(A,V,c.muted,1.7,part('equal-tangent-AV'));d.segment(A,U,c.muted,1.7,part('equal-tangent-AU'));d.tick(A,V,c.muted);d.tick(A,U,c.muted);}
        if(step===8||step===9)tangentPieces(d,g,M);
      }
      if(step===10) {
        d.segment(A,V,c.gold,4.5,part('whole-tangent-AV'));
        [[A,Z,'z',c.purple],[Z,B,'x',c.blue],[B,V,'y',c.teal]].forEach(([a,b,name,color],i)=>{
          d.segment(a,b,color,3,part('AV-piece-'+i));d.label(M.mid(a,b),name,color,{dx:5,dy:20});
        });
        d.label(M.mid(A,V),'AV = s',c.gold,{dx:-20,dy:-14,...part('semiperimeter-tangent-label')});
      }
      if(step===11) {
        d.poly([A,V,E],c.teal,.1,part('similar-triangle-AVE'));
        d.poly([A,Z,I],c.blue,.2,part('similar-triangle-AZI'));
        d.segment(A,E,c.gold,3,part('common-A-bisector'));
        d.segment(A,Z,c.blue,4,part('first-similarity-AZ'));
        d.segment(A,V,c.teal,2,part('first-similarity-AV'));
        radius(d,g,I,Z,A,B,c.blue,3.5,M,'first-similarity-IZ');
        radius(d,g,E,V,A,B,c.teal,3.5,M,'first-similarity-EV');
        d.angle(B,A,E,c.gold,{radius:32,...part('common-half-angle-A')});
      }
      if(step===12||step===13||step===14) {
        d.poly([Z,B,I],c.blue,.2,part('similar-triangle-ZBI'));
        d.poly([V,E,B],c.teal,.15,part('similar-triangle-VEB'));
        d.segment(B,I,c.blue,3,part('internal-bisector-BI'));
        d.segment(B,E,c.teal,3,part('external-bisector-BE'));
        d.right(Z,B,I,c.blue);d.right(V,E,B,c.teal);
        d.angle(Z,B,I,c.blue,{radius:29,...part('angle-ZBI')});
        if(step===12)d.angle(E,B,V,c.teal,{radius:39,...part('angle-EBV')});
        if(step>=13)d.angle(V,E,B,c.blue,{radius:29,...part('angle-VEB')});
        if(step===14) {
          [[B,Z,'x',c.blue],[E,V,'rₐ',c.blue],[Z,I,'r',c.gold],[V,B,'y',c.gold]].forEach(([a,b,name,color],i)=>{
            d.segment(a,b,color,4,part('second-similarity-ratio-'+i));d.label(M.mid(a,b),name,color,{dx:7,dy:16});
          });
        }
      }
      if(step===15) {
        radius(d,g,I,Z,A,B,c.blue,4,M,'radius-r');radius(d,g,E,V,A,B,c.teal,4,M,'radius-ra');
        d.label(M.mid(I,Z),'r',c.blue,{dx:8,dy:0});d.label(M.mid(E,V),'rₐ',c.teal,{dx:8,dy:0});
        d.segment(A,Z,c.purple,3.5,part('length-z'));d.segment(B,Z,c.blue,3.5,part('length-x'));d.segment(C,Y,c.teal,3.5,part('length-y'));
      }
      labels(d,g,marks,M);
    },
    steps:[
      {title:'Three sides and a semiperimeter',text:'Let a = BC, b = CA, c = AB, and s = (a + b + c)/2 for our noncollinear triangle.',facts:['The area is denoted Δ.','All three side lengths are positive.'],key:'The three colored sides supply every length in the final formula.'},
      {title:'Name the incircle contacts',text:'Let the incircle have center I and radius r, touching BC, CA, and AB at X, Y, and Z.',facts:['IX = IY = IZ = r > 0','X, Y, Z lie inside their side segments.'],key:'Blue radii meet the three sides at right angles.'},
      {title:'Add three areas',text:'The interior point I partitions ABC into three triangles with height r, so Δ = ½(a + b + c)r = sr.',facts:['[IAB] = ½cr','[IBC] = ½ar','[ICA] = ½br','Δ = sr'],key:'The blue, teal, and violet regions are the three areas being added.'},
      {title:'Equal tangent segments',text:'Equal tangents from each vertex let us write AZ = AY = z, BZ = BX = x, and CX = CY = y.',facts:['O2 applies at each vertex outside the incircle.','x, y, z are positive.'],key:'Matching colors and tick counts pair the two tangents from each vertex.'},
      {title:'Add the side pieces',text:'Adding the tangent pieces gives a = x + y, b = y + z, and c = x + z, hence s = x + y + z.',facts:['a + b + c = 2(x + y + z)','s = x + y + z'],key:'Each tangent length appears twice around the perimeter.'},
      {title:'Express them using s',text:'Subtracting the three side equations from s = x + y + z gives x = s − b, y = s − c, and z = s − a.',facts:['s − b = x > 0','s − c = y > 0','s − a = z > 0'],key:'Each marked tangent segment is now written using the semiperimeter.'},
      {title:'Bring in the A-excircle',text:'Let the A-excircle have center E and radius rₐ, touching BC at T and the extensions beyond C and B at U and V.',facts:['ET = EU = EV = rₐ > 0','B — T — C; A — C — U; A — B — V','AE is the internal bisector at A; BE is the exterior bisector at B.'],key:'The teal circle and its three perpendicular radii use the excircle construction established in the Nagel episode.'},
      {title:'Name the exterior tangents',text:'Equal tangents to the excircle give CU = CT = u, BV = BT = v, and AU = AV.',facts:['u > 0 and v > 0','O2 applies at A, B, and C.'],key:'The two tangent segments from C share one color; the two from B share another.'},
      {title:'Compare the two boundaries',text:'The contact-point order gives u + v = x + y along BC and x + z + v = y + z + u from AV = AU.',facts:['CT + BT = BC','AB + BV = AC + CU'],key:'The highlighted pieces compare BC and the two full tangents from A.'},
      {title:'The exterior pieces are reversed',text:'The equations u + v = x + y and v − u = y − x imply u = x and v = y.',facts:['Adding gives 2v = 2y.','Then u = x.'],key:'The matching colors now identify the exterior pieces with the incircle tangent lengths.'},
      {title:'One tangent is the semiperimeter',text:'It follows that AV = AB + BV = x + z + y = s.',facts:['AV = AU = s','AZ = z = s − a'],key:'The long tangent AV is assembled from the pieces z, x, and y.'},
      {title:'The first similarity',text:'The right triangles AZI and AVE have the same angle at A, so AA similarity gives rₐ/s = r/z.',facts:['△AZI ∼ △AVE: A ↔ A, Z ↔ V, I ↔ E','EV/AV = IZ/AZ','rₐ/s = r/(s − a)'],key:'The two shaded right triangles share the angle between AB and its internal bisector.'},
      {title:'Complementary half-angles at B',text:'Writing β = ∠ABC, the internal and exterior bisectors give ∠ZBI = β/2 and ∠EBV = (180° − β)/2, whose sum is 90°.',facts:['∠ZBI + ∠EBV = 90°'],key:'The blue and teal arcs at B are complementary, not equal.'},
      {title:'The second similarity',text:'Since triangle VEB is right at V, its angle VEB equals angle ZBI, and therefore △ZBI ∼ △VEB by AA.',facts:['Z ↔ V, B ↔ E, I ↔ B','∠VEB = 90° − ∠EBV = ∠ZBI'],key:'The equal blue arcs are at B in the smaller triangle and E in the larger one.'},
      {title:'Read the second ratio',text:'Corresponding sides in this similarity give x/r = rₐ/y, so rrₐ = xy.',facts:['BZ/ZI = VE/VB','(s − b)/r = rₐ/(s − c)','rrₐ = (s − b)(s − c)'],key:'Blue sides correspond to one another, as do the gold sides.'},
      {title:'Eliminate the exradius',text:'Combining rₐ = sr/z with rrₐ = xy yields r² = xyz/s.',facts:['(s/z)r² = xy','r² = (s − a)(s − b)(s − c)/s'],key:'The two emphasized radii connect the two already-proved similarity equations.'},
      {title:'Return to the area',text:'Substituting this expression for r² into Δ = sr gives Δ² = s(s − a)(s − b)(s − c).',facts:['Δ² = s²r² = sxyz'],key:'The three incircle triangles again display the area identity Δ = sr.'},
      {title:'Heron’s formula',text:'Because the area is positive, taking the positive square root proves Δ = √(s(s − a)(s − b)(s − c)).',facts:['Δ = √(s(s − a)(s − b)(s − c))','s = (a + b + c)/2'],key:'Only the side lengths remain in the area formula.'}
    ]
  };
})();
