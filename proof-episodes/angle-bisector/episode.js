(() => {
  'use strict';

  function bisectorParameter(v,M) {
    const ab=M.dist(v[0],v[1]),ac=M.dist(v[0],v[2]);
    return ab+ac>0?ab/(ab+ac):.5;
  }

  window.ProofEpisode = {
    slug:'angle-bisector', number:'06', title:'The angle-bisector theorem',
    subtitle:'Equal angles, unequal pieces, and an area comparison.',
    observation:'For a point D strictly between B and C, AD bisects angle A if and only if BD/DC = AB/AC.',
    prediction:'If AB is twice AC, should an angle bisector put D at the midpoint of BC or give BD twice the length of DC?',
    after:'If AB is longer than AC, which of BD and DC is longer, and on which side of the midpoint of BC must D lie?',
    prerequisites:[
      {label:'C1 · Perpendiculars and distance',href:'../basics/#c1'},
      {label:'C4 · Area and common-height ratios',href:'../basics/#c4'},
      {label:'04 · The internal-bisector distance fact',href:'../incenter/'}
    ],
    params:{t:.42,freeT:.42,proofMode:false},
    actions:[{label:'Place D on the bisector',hideInProof:true,run(v,p,M){p.t=bisectorParameter(v,M);}}],
    constrain(v,p,active,step,M) {
      if(active&&!p.proofMode)p.freeT=p.t;
      if(!active&&p.proofMode)p.t=p.freeT;
      p.proofMode=active;
      if(active)p.t=bisectorParameter(v,M);
      return v;
    },
    compute(g,p,M) {
      const D=M.lerp(g.B,g.C,p.t);
      return {
        D,X:M.foot(D,g.A,g.B),Y:M.foot(D,g.A,g.C),F:M.foot(g.A,g.B,g.C),
        bd:M.dist(g.B,D),dc:M.dist(D,g.C),ab:M.dist(g.A,g.B),ac:M.dist(g.A,g.C),
        areaABD:M.area(g.A,g.B,D),areaACD:M.area(g.A,g.C,D)
      };
    },
    handles(g,p,M) {
      return p.proofMode?[]:[{id:'D',point:g.D,label:'Point D on side BC',move(point){p.t=M.clamp(M.parameter(point,g.B,g.C),.02,.98);}}];
    },
    extent:(g,p,s)=>s>=2?[g.A,g.B,g.C,g.D,g.X,g.Y,g.F]:[g.A,g.B,g.C,g.D],
    status(g,p,active,step) {
      if(g.degenerate)return 'A noncollinear triangle is required; move a vertex to resume.';
      if(active)return step<7?'Forward: D stays on the bisector; ABC are free. Close proof to move D independently.':'Converse: D satisfies BD/DC = AB/AC; ABC are free. Close proof to move D independently.';
      return `D is free to move along BC. BD/DC = ${(g.bd/g.dc).toFixed(3)}; AB/AC = ${(g.ab/g.ac).toFixed(3)}. Drag ABC or D to compare them.`;
    },
    notes:[
      {title:'The proof mode',body:'In exploration, drag D independently along the interior of BC. Starting the proof temporarily makes D follow the internal bisector for the forward argument and the required side ratio for the converse. A, B, and C remain freely draggable. The restriction supplies the stated hypothesis; it is not the proof. Closing the proof restores D’s previous fractional position along BC.'},
      {title:'Area without a sine formula',body:'The area of ABD can be computed as one half AB times the perpendicular distance DX from D to the line AB, or as one half BD times the perpendicular distance AF from A to the line BC. The same two choices work for ACD. This is exactly C4, including when a perpendicular foot lies outside its side segment.'},
      {title:'Why the converse is an internal bisector',body:'D lies strictly inside BC, so the ray AD lies strictly inside angle BAC. Once the area comparison gives equal distances from D to the lines AB and AC, the interior-angle converse proved in the incenter episode applies. No external bisector can occur in this domain.'},
      {title:'Endpoints are excluded',body:'Because D is strictly between B and C and ABC is noncollinear, both smaller triangles have positive area, both perpendicular heights are positive, and all ratios used in the proof are defined. This episode does not state an external or directed-length version of the theorem.'}
    ],
    draw(d,g,s,p,M) {
      const {blue,teal,purple,gold,muted}=d.colors;
      const {A,B,C,D,X,Y,F}=g;
      const forward=s>=1&&s<=6,conclusion=s>=11,explore=s===-1;
      const shade=explore||s>=4;
      const eqAngles=forward||conclusion;
      const equalHeights=(s>=3&&s<=6)||s>=10;
      const showHeights=s>=2;
      const point=(q,label,color,dx=11,dy=-10)=>d.point(q,label,color,{dx,dy,'data-part':'point-'+label});
      const perpendicular=(from,foot,a,b,color,id)=>{
        d.segment(from,foot,color,2.8,{'data-part':id});
        if(M.dist(from,foot)>1e-10*g.scale)d.right(foot,M.add(foot,M.sub(b,a)),from,color);
      };

      if(shade){d.poly([A,B,D],blue,.15,{'data-part':'region-ABD'});d.poly([A,C,D],teal,.15,{'data-part':'region-ACD'});}
      d.segment(A,D,gold,3,{'data-part':'cevian-AD'});
      if(p.proofMode)point(D,'D',gold,8,20);
      if(eqAngles) {
        d.angle(B,A,D,gold,{radius:27,'data-part':'angle-BAD'});
        d.angle(D,A,C,gold,{radius:27,'data-part':'angle-DAC'});
      }else if(explore){
        d.angle(B,A,D,blue,{radius:27,label:M.fmt(M.angle(B,A,D),1)+'°','data-part':'free-angle-BAD'});
        d.angle(D,A,C,teal,{radius:38,label:M.fmt(M.angle(D,A,C),1)+'°','data-part':'free-angle-DAC'});
      }
      if(s===2||s===3) {
        d.poly([A,X,D],blue,.12,{'data-part':'triangle-ADX'});
        d.poly([A,Y,D],teal,.12,{'data-part':'triangle-ADY'});
      }
      if(showHeights) {
        d.line(A,B,muted,1,{'stroke-dasharray':'4 5','data-part':'supporting-line-AB'});
        d.line(A,C,muted,1,{'stroke-dasharray':'4 5','data-part':'supporting-line-AC'});
        perpendicular(D,X,A,B,blue,'height-DX');perpendicular(D,Y,A,C,teal,'height-DY');
        point(X,'X',blue,-12,16);point(Y,'Y',teal,10,16);
        if(equalHeights){d.tick(D,X,gold);d.tick(D,Y,gold);}
      }
      if(s===4||s===9||s===10) {
        d.segment(A,B,blue,4,{'data-part':'base-AB'});d.segment(A,C,teal,4,{'data-part':'base-AC'});
      }
      if(s===5||s===8) {
        d.line(B,C,muted,1,{'stroke-dasharray':'4 5','data-part':'supporting-line-BC'});
        d.segment(B,D,blue,4,{'data-part':'base-BD'});d.segment(D,C,teal,4,{'data-part':'base-DC'});
        perpendicular(A,F,B,C,purple,'common-height-AF');point(F,'F',purple,12,20);
      }
      if(s===6||s===7||s===12) {
        d.segment(B,D,blue,4,{'data-part':'ratio-BD'});d.segment(D,C,teal,4,{'data-part':'ratio-DC'});
        d.segment(A,B,blue,3,{'data-part':'ratio-AB'});d.segment(A,C,teal,3,{'data-part':'ratio-AC'});
      }
    },
    steps:[
      {title:'An interior point on BC',text:'Let ABC be a noncollinear triangle, with D strictly between B and C.',facts:['[ABD] and [ACD] denote the areas of the two smaller triangles.','Proof mode temporarily restricts D; ABC remain freely draggable.'],key:'The segment AD divides ABC into two triangles of positive area.'},
      {title:'Assume the angle is bisected',text:'First suppose AD is the internal bisector of angle BAC.',facts:['∠BAD = ∠DAC.'],key:'Matching angle arcs mark the hypothesis of the forward implication.'},
      {title:'Measure perpendicular distances',text:'Drop perpendiculars DX and DY from D to the lines AB and AC.',facts:['C1 defines the perpendicular feet X and Y.','A foot may lie beyond B or C; the distance is to the full line.'],key:'The two perpendiculars are the heights for bases AB and AC.'},
      {title:'The heights are equal',text:'The equal-distance fact for an internal angle bisector gives DX = DY.',facts:['The incenter episode proves this fact using right-triangle congruence.'],key:'The two heights now receive matching equality marks.'},
      {title:'Use AB and AC as bases',text:'With equal heights DX and DY, the area formula gives [ABD]/[ACD] = AB/AC.',facts:['[ABD] = ½·AB·DX and [ACD] = ½·AC·DY.','C4: equal heights make areas proportional to their bases.'],key:'The blue and teal triangles are compared using bases AB and AC.'},
      {title:'Use BD and DC as bases',text:'The same triangles share the height from A to BC, so [ABD]/[ACD] = BD/DC.',facts:['Their common height is the perpendicular distance AF from A to the line BC.'],key:'A single purple height serves both highlighted bases BD and DC.'},
      {title:'The angle-bisector theorem',text:'Equating the two expressions for the area ratio proves BD/DC = AB/AC.',facts:['The two evaluations concern exactly the same pair of positive areas.'],key:'The opposite-side ratio equals the adjacent-side ratio.'},
      {title:'Now assume the ratio',text:'Conversely, suppose D lies inside BC and satisfies BD/DC = AB/AC.',facts:['Equal angles are not assumed in this direction.'],key:'The ratio is the hypothesis; equal-angle marks are hidden.'},
      {title:'The ratio fixes the areas',text:'The common height from A gives [ABD]/[ACD] = BD/DC = AB/AC.',facts:['C4 supplies the first equality; the converse hypothesis supplies the second.'],key:'The common-height comparison transfers the assumed length ratio to areas.'},
      {title:'Evaluate the same areas again',text:'Using AB and AC as bases also gives [ABD]/[ACD] = (AB·DX)/(AC·DY).',facts:['This formula does not assume DX = DY.'],key:'The perpendicular heights are shown without equality marks.'},
      {title:'The distances must agree',text:'Comparing these formulas and canceling the positive side lengths forces DX = DY.',facts:['(AB·DX)/(AC·DY) = AB/AC implies DX/DY = 1.'],key:'Equality marks appear only after the cancellation establishes equal heights.'},
      {title:'Recover the bisector',text:'Since D lies inside angle BAC, equal distances to its side lines force AD to be its internal angle bisector.',facts:['This is the interior-angle converse from the incenter episode.'],key:'Matching angle arcs return now as the conclusion, rather than as a hypothesis.'},
      {title:'Both directions',text:'For D strictly inside BC, AD bisects angle A if and only if BD/DC = AB/AC.',facts:['Forward: equal angles give the ratio.','Converse: the ratio gives equal angles.'],key:'Close the proof to restore D’s previous free position and test the distinction.'}
    ]
  };
})();
