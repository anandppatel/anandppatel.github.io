(() => {
  'use strict';

  function sameAngle(d, a, vertex, middle, b, color) {
    d.angle(a, vertex, middle, color, {radius:25, 'data-part':'angle-half-1'});
    d.angle(middle, vertex, b, color, {radius:25, 'data-part':'angle-half-2'});
  }

  window.ProofEpisode = {
    slug:'incenter', number:'04', title:'The incenter',
    subtitle:'Three internal angle bisectors, one inscribed circle.',
    observation:'The internal angle bisectors of every noncollinear triangle meet at a unique interior point I; the circle centered at I and tangent to its three sides is the unique incircle.',
    prediction:'When you make the triangle obtuse, can I move outside it, or can the circle touch a side only on its extension?',
    after:'Why is the word internal necessary in the equal-distance argument?',
    prerequisites:[
      {label:'C1 · Perpendiculars and distance',href:'../basics/#c1'},
      {label:'T1 · Congruence, including HL',href:'../basics/#t1'},
      {label:'T2 · Angle sum',href:'../basics/#t2'},
      {label:'T6 · Pythagoras',href:'../basics/#t6'},
      {label:'O1 · Tangents and radii',href:'../basics/#o1'}
    ],
    notes:[
      {title:'Why the converse uses an interior point',body:'For two intersecting lines, equal distances describe both angle-bisector lines. For a point P strictly inside an angle smaller than 180°, only its internal bisector is possible. To justify the HL proof, first check that the feet X and Y lie on the forward boundary rays. At least one of the two angles made by AP and those rays is acute. If the other foot lay behind A, HL would force the two interior angles to sum to 180°, a contradiction. If a foot were A, equality of distances and Pythagoras would force both feet to be A, making the two boundary lines the same perpendicular to AP. Thus both feet are on the forward rays, and HL gives the two equal interior angles.'},
      {title:'Why the first two bisectors meet inside',body:'An internal bisector can be constructed by choosing two points equally far from the vertex on the boundary rays and joining the vertex to the midpoint of their joining segment; SSS gives the equal half-angles. Each internal angle-bisector ray enters the triangle and meets the interior of the opposite side. Write U for the point on BC and V for the point on AC. The points B and V lie on opposite sides of AU, so the segment BV crosses AU. Their intersection is inside both segments, and two distinct lines have at most one intersection. This defines I using only the first two bisectors.'},
      {title:'Why contact occurs on the segments',body:'At each vertex, its internal bisector makes an angle smaller than 90° with either adjacent side ray. Its perpendicular feet therefore lie on those forward rays. Applying this from both endpoints of a side places that side’s foot strictly between its endpoints.'},
      {title:'Why the circle stays inside',body:'The interior point I lies in the inward half-plane of each side line, at distance r from that line. A point beyond the line is more than r from I, so it cannot lie in the closed disk of radius r. The disk lies in all three inward half-planes and hence inside the triangle. Any other incircle has a center inside the triangle at equal distances from the side lines; the equal-distance fact puts it on the same first two internal bisectors, fixing both its center I and its radius r.'}
    ],
    compute(g,p,M) {
      const I=g.I, P=M.lerp(g.A,I,.62);
      return {
        lemmaP:P,
        lemmaX:M.foot(P,g.A,g.B), lemmaY:M.foot(P,g.A,g.C),
        X:M.foot(I,g.A,g.B), Y:M.foot(I,g.A,g.C), Z:M.foot(I,g.B,g.C),
        bisectorEnds:[M.intersect(g.A,I,g.B,g.C),M.intersect(g.B,I,g.C,g.A),M.intersect(g.C,I,g.A,g.B)]
      };
    },
    extent:(g)=>[g.A,g.B,g.C,g.I],
    status(g,p,active) {
      if(g.degenerate)return 'A noncollinear triangle is required; move a vertex to resume.';
      return active?'ABC remain freely draggable; I and all perpendicular feet follow the triangle.':'I stays inside the triangle, including when an angle is obtuse; drag any vertex to explore.';
    },
    draw(d,g,s,p,M) {
      const {blue,teal,purple,gold,muted}=d.colors;
      const A=g.A,B=g.B,C=g.C,I=g.I;
      const lemma=s>=1&&s<=5, full=s===-1;
      const point=(q,label,color,dx=11,dy=-10)=>d.point(q,label,color,{dx,dy,'data-part':'point-'+label});
      const perpendicular=(from,foot,a,b,color,id)=>{
        d.segment(from,foot,color,3,{'data-part':id});
        if(M.dist(from,foot)>1e-10*g.scale)d.right(foot,M.add(foot,M.sub(b,a)),from,color);
      };
      const bisector=(i,color)=>{
        const end=g.bisectorEnds[i];
        if(end)d.segment(g.vertices[i],end,color,2.5,{'data-part':'bisector-'+i});
      };

      if(lemma) {
        const P=g.lemmaP,X=g.lemmaX,Y=g.lemmaY;
        if(s===1||s===2||s===3||s===4) {
          d.poly([A,X,P],blue,.15,{'data-part':'triangle-APX'});
          d.poly([A,Y,P],teal,.15,{'data-part':'triangle-APY'});
        }
        d.segment(A,P,muted,2,{'data-part':'lemma-AP'});
        perpendicular(P,X,A,B,blue,'lemma-distance-PX');
        perpendicular(P,Y,A,C,teal,'lemma-distance-PY');
        if(s!==3)sameAngle(d,B,A,P,C,gold);
        if(s>=2){d.tick(P,X,gold);d.tick(P,Y,gold);}
        point(X,'X',blue,-12,17);point(Y,'Y',teal,9,17);point(P,'P',gold,13,-12);
        return;
      }
      if(s===0)return;

      bisector(0,blue);bisector(1,teal);
      if(full||s>=9)bisector(2,purple);
      if(s===6) {
        if(g.bisectorEnds[0])point(g.bisectorEnds[0],'U',blue,10,20);
        if(g.bisectorEnds[1])point(g.bisectorEnds[1],'V',teal,-18,10);
        sameAngle(d,B,A,I,C,blue);sameAngle(d,A,B,I,C,teal);
      }
      if(s===7) {
        d.poly([A,g.X,I],blue,.15,{'data-part':'triangle-AIX'});
        d.poly([A,g.Y,I],teal,.15,{'data-part':'triangle-AIY'});
        sameAngle(d,B,A,I,C,blue);
      }
      if(s===8) {
        d.poly([B,g.X,I],blue,.15,{'data-part':'triangle-BIX'});
        d.poly([B,g.Z,I],purple,.15,{'data-part':'triangle-BIZ'});
        sameAngle(d,A,B,I,C,teal);
      }
      if(s===9) {
        d.poly([C,g.Y,I],teal,.15,{'data-part':'triangle-CIY'});
        d.poly([C,g.Z,I],purple,.15,{'data-part':'triangle-CIZ'});
        sameAngle(d,A,C,I,B,purple);
      }
      if(full||s>=12)d.circle(I,g.r,gold,3,{'data-part':'incircle',fill:full||s>=14?'#ad660d0b':'none'});
      if(full||s>=7) {
        perpendicular(I,g.X,A,B,blue,'distance-IX');
        perpendicular(I,g.Y,A,C,teal,'distance-IY');
        d.tick(I,g.X,gold);d.tick(I,g.Y,gold);
        point(g.X,'X',blue,-13,18);point(g.Y,'Y',teal,10,18);
      }
      if(full||s>=8) {
        perpendicular(I,g.Z,B,C,purple,'distance-IZ');d.tick(I,g.Z,gold);
        point(g.Z,'Z',purple,9,20);
      }
      if(s===11||s===13||s===14) {
        [[A,B],[B,C],[C,A]].forEach((side,i)=>d.segment(side[0],side[1],[blue,purple,teal][i],3.5,{'data-part':'tangent-side-'+i}));
      }
      point(I,'I',gold,14,-17);
    },
    steps:[
      {title:'The triangle',text:'Let ABC be a noncollinear triangle, and consider its internal angle bisectors.',facts:['An internal angle bisector divides an angle into two equal positive angles.'],key:'The vertices remain freely draggable throughout the proof.'},
      {title:'A point on a bisector',text:'Take P inside angle A on its internal bisector, and drop perpendiculars PX and PY to the lines AB and AC.',facts:['C1 gives the unique perpendicular feet X and Y.','Both half-angles at A are smaller than 90°, so the feet lie on the forward rays.'],key:'Blue and teal: the right triangles APX and APY.'},
      {title:'Equal distances',text:'Two equal angles and the shared hypotenuse AP make those right triangles congruent, so PX = PY.',facts:['T1: two corresponding angles and a corresponding side establish congruence.'],key:'The two perpendicular distances now receive matching marks.'},
      {title:'The converse hypothesis',text:'Conversely, suppose P lies strictly inside angle A and has equal perpendicular distances PX = PY from its two side lines.',facts:['The point is inside the angle; external angle bisectors are not under consideration.'],key:'Only the equal distances are assumed here; no equal-angle marks are shown.'},
      {title:'The converse conclusion',text:'The feet lie on the forward rays, and hypotenuse–leg congruence now gives ∠XAP = ∠PAY, so AP is the internal bisector.',facts:['The supporting note justifies the forward-ray condition, even for an obtuse angle.','T1 (HL): AP is the common hypotenuse and PX = PY.'],key:'Equal-angle marks appear only after the converse has established them.'},
      {title:'The equal-distance fact',text:'Inside an angle, a point lies on its internal bisector exactly when its distances from the two side lines are equal.',facts:['Both directions have now been proved.'],key:'The same fact applies at each vertex of ABC.'},
      {title:'Construct I from two bisectors',text:'The internal bisectors from A and B cross at a unique point I inside the triangle.',facts:['Their opposite-side endpoints U and V lie strictly inside BC and AC.','B and V lie on opposite sides of AU, so BV crosses AU exactly once inside the triangle.'],key:'Only the first two bisectors define I; the third has not yet been drawn.'},
      {title:'Use the bisector at A',text:'With X and Y the perpendicular feet from I to AB and AC, the bisector at A gives IX = IY.',facts:['The equal-distance fact applies because I lies inside angle A.'],key:'The perpendiculars to the two sides at A have equal length.'},
      {title:'Use the bisector at B',text:'If Z is the perpendicular foot from I to BC, the bisector at B gives IX = IZ.',facts:['Therefore IX = IY = IZ > 0.'],key:'The same perpendicular IX connects the two equal-distance comparisons.'},
      {title:'The third bisector',text:'Since IY = IZ and I lies inside angle C, the converse puts I on its internal bisector.',facts:['Equality concerns distances to the lines CA and CB.'],key:'The third bisector appears now, after its incidence with I has been proved.'},
      {title:'The incenter',text:'All three internal angle bisectors therefore meet uniquely at I, called the incenter.',facts:['The first two distinct bisector lines already have a unique intersection.'],key:'The three bisectors concur at the same interior point.'},
      {title:'Feet on the actual sides',text:'Each foot lies on the forward side rays from both endpoints, so X, Y, and Z lie strictly inside the corresponding side segments.',facts:['At every vertex, the angle between I and either side ray is half an angle smaller than 180°.'],key:'The contact candidates are on the segments, not just their supporting lines.'},
      {title:'Construct the circle',text:'Draw the circle centered at I with the positive radius r = IX = IY = IZ.',facts:['X, Y, and Z lie on this circle by the definition of its radius.'],key:'The circle is constructed only after all three distances have been shown equal.'},
      {title:'Three tangencies',text:'The radii IX, IY, and IZ are perpendicular to AB, AC, and BC, so those side lines are tangent at X, Y, and Z.',facts:['O1 converse: a line through a circle point perpendicular to the radius is tangent there.'],key:'The three right-angle marks certify the three tangencies.'},
      {title:'An inscribed circle',text:'Its disk lies in the inward half-plane of every side, so the circle lies inside the triangle and is an incircle.',facts:['I is inside the triangle and is exactly r from each side line.','Crossing any side line would require distance greater than r from I.'],key:'The entire disk is inside ABC.'},
      {title:'The unique incircle',text:'Any other incircle would have an interior center on the same first two bisectors, forcing its center to be I and its radius to be r.',facts:['A tangent radius is perpendicular to its side line by O1.','The equal-distance converse determines the center, and one side determines the radius.'],key:'Both the incenter and the incircle are unique.'}
    ]
  };
})();
