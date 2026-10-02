(() => {
  'use strict';
  const sidePoint = (a, b, t, M) => M.lerp(a, b, t);

  function construction(v, p, M) {
    const [A, B, C] = v;
    const D = sidePoint(B, C, p.d, M), E = sidePoint(C, A, p.e, M);
    const P = M.intersect(A, D, B, E);
    const Fprime = P ? M.intersect(C, P, A, B) : null;
    return {D, E, P, Fprime};
  }

  function makeConcurrent(v, p, M) {
    const {Fprime} = construction(v, p, M);
    if (Fprime) p.f = M.parameter(Fprime, v[0], v[1]);
  }

  window.ProofEpisode = {
    slug: 'ceva', number: '10', title: 'Ceva’s theorem',
    subtitle: 'When three cevians meet',
    observation: 'For D, E, and F strictly inside sides BC, CA, and AB, respectively, the segments AD, BE, and CF meet at one point if and only if (BD/DC) × (CE/EA) × (AF/FB) = 1.',
    prediction: 'Keep D and E fixed and move F along AB: can more than one position make the three segments meet?',
    after: 'Apply the criterion to the three medians, and then to the three internal angle bisectors using the preceding angle-bisector theorem.',
    prerequisites: [
      {label: 'Areas and common heights', href: '../basics/#c4'},
      {label: 'The centroid and medians', href: '../centroid/'},
      {label: 'The angle-bisector theorem', href: '../angle-bisector/'}
    ],
    notes: [
      {title: 'What is a cevian?', body: 'A cevian joins a vertex of a triangle to a point on the opposite side; three cevians are concurrent when they share a point.'},
      {title: 'Interior points only', body: 'This episode keeps D, E, and F strictly inside their sides, so every ratio and every area used in the proof is positive; extensions require a signed version.'},
      {title: 'Why the first two meet', body: 'The line AD separates B from E, so BE crosses it; the crossing is inside the triangle, hence inside the segment AD.'},
      {title: 'How to explore', body: 'Drag the vertices and the three side points, or focus a point and use the arrow keys; “Make the cevians meet” moves only F.'},
      {title: 'Read the cyclic order', body: 'Follow the boundary B → C → A → B: the three ratios are BD/DC, CE/EA, and AF/FB, in that order.'}
    ],
    params: {d: .43, e: .54, f: .66, proof: false},
    actions: [{label: 'Make the cevians meet', hideInProof:true, run: makeConcurrent}],
    constrain: (v, p, active, step, M) => {
      p.proof = active;
      if (active) makeConcurrent(v, p, M);
      return v;
    },
    compute: (g, p, M) => {
      const c = construction(g.vertices, p, M);
      const F = sidePoint(g.A, g.B, p.f, M);
      const ratios = [p.d/(1-p.d), p.e/(1-p.e), p.f/(1-p.f)];
      return {...c, F, ratios, product: ratios[0]*ratios[1]*ratios[2],
        areas: c.P ? [M.area(c.P, g.A, g.B), M.area(c.P, g.B, g.C), M.area(c.P, g.C, g.A)] : [],
        cevianFeet: [M.foot(g.B, g.A, c.D), M.foot(g.C, g.A, c.D)],
        commonFoot: c.P ? M.foot(c.P, g.B, g.C) : null};
    },
    handles: (g, p, M) => {
      const result = [
        {id: 'D', point: g.D, label: 'Point D on side BC', move: point => {p.d = M.clamp(M.parameter(point, g.B, g.C), .06, .94);}},
        {id: 'E', point: g.E, label: 'Point E on side CA', move: point => {p.e = M.clamp(M.parameter(point, g.C, g.A), .06, .94);}}
      ];
      if (!p.proof) result.push({id: 'F', point: g.F, label: 'Point F on side AB', move: point => {p.f = M.clamp(M.parameter(point, g.A, g.B), .015, .985);}});
      return result;
    },
    status: (g, p, active, step) => active
      ? 'Proof mode: move D and E; F follows their concurrent position. Close proof to move F independently.'
      : (Number.isFinite(g.product)
        ? `Ratio product ≈ ${g.product.toFixed(3)}; a value rounded to 1 is a numerical observation, not a proof of concurrence.`
        : 'Move a vertex to make A, B, and C noncollinear.'),
    extent: (g, p, step) => {
      const points = [g.A, g.B, g.C];
      if (step === 2) points.push(g.cevianFeet[0]);
      if (step === 3) points.push(g.cevianFeet[1]);
      if (step === 5) points.push(g.commonFoot);
      return points;
    },
    draw: (d, g, s, p, M) => {
      const {A, B, C, D, E, F, P, Fprime} = g;
      const {blue, teal, purple, gold, muted} = d.colors;
      if (!P || !Fprime) return;
      d.segment(A, D, blue, s === 2 || s === 3 || s === 8 ? 3.7 : 2, {'data-part': 'cevian-AD'});
      d.segment(B, E, teal, s === 8 ? 3.7 : 2, {'data-part': 'cevian-BE'});
      if (s < 8 || s >= 12) d.segment(C, F, purple, s >= 12 ? 3.7 : 2, {'data-part': 'cevian-CF'});
      if (s >= 9 && s <= 11) d.segment(C, Fprime, gold, 3, {'stroke-dasharray': '5 5', 'data-part': 'constructed-cevian-CFprime'});
      if (p.proof) d.point(F, s >= 12 ? 'F = F′' : 'F', purple, {dx: -36, dy: 17, 'data-part': 'point-F'});
      if (s >= 9 && s <= 11) d.point(Fprime, 'F′', gold, {dx: 12, dy: -12, 'data-part': 'point-Fprime'});
      d.point(P, 'P', gold, {dx: 10, dy: -12, 'data-part': 'intersection-P'});
      const fill = (points, color, part, opacity=s === 7 ? .24 : .17) => d.poly(points, color, opacity, {'data-part': part});
      const centroid = points => M.mul(points.reduce((sum, point) => M.add(sum, point), {x:0,y:0}), 1/points.length);
      const labelArea = (points, label, color) => d.label(centroid(points), label, color, {dx: 0, dy: 4, 'text-anchor': 'middle', 'data-part': `area-label-${label}`});
      if (s === 1 || s === 6 || s === 7) {
        fill([P, A, B], blue, 'area-x'); fill([P, B, C], teal, 'area-y'); fill([P, C, A], purple, 'area-z');
        labelArea([P,A,B], 'x', blue); labelArea([P,B,C], 'y', teal); labelArea([P,C,A], 'z', purple);
      }
      if (s === 2) {
        fill([P,A,B], blue, 'area-PAB'); fill([P,B,D], gold, 'area-PBD');
        d.segment(A,P,blue,4,{'data-part':'base-AP'}); d.segment(P,D,gold,4,{'data-part':'base-PD'});
        const foot = g.cevianFeet[0];
        d.line(A,D,muted,1,{'stroke-dasharray':'4 5','data-part':'common-base-line-AD'});
        d.segment(B,foot,teal,2,{'stroke-dasharray':'4 4','data-part':'common-height-from-B'});
        d.right(foot,B,M.add(foot,M.sub(D,A)),teal);
      }
      if (s === 3) {
        fill([P,A,C], purple, 'area-PAC'); fill([P,C,D], gold, 'area-PCD');
        d.segment(A,P,purple,4,{'data-part':'base-AP'}); d.segment(P,D,gold,4,{'data-part':'base-PD'});
        const foot = g.cevianFeet[1];
        d.line(A,D,muted,1,{'stroke-dasharray':'4 5','data-part':'common-base-line-AD'});
        d.segment(C,foot,teal,2,{'stroke-dasharray':'4 4','data-part':'common-height-from-C'});
        d.right(foot,C,M.add(foot,M.sub(D,A)),teal);
      }
      if (s === 4 || s === 5) {
        fill([P,B,D],blue,'area-PBD'); fill([P,C,D],purple,'area-PCD');
        if (s === 4) {
          fill([P,A,B],blue,'area-x',.08); fill([P,A,C],purple,'area-z',.08);
          labelArea([P,A,B],'x',blue); labelArea([P,A,C],'z',purple);
        } else {
          d.segment(B,D,blue,4,{'data-part':'base-BD'}); d.segment(D,C,purple,4,{'data-part':'base-DC'});
          d.line(B,C,muted,1,{'stroke-dasharray':'4 5','data-part':'common-base-line-BC'});
          d.segment(P,g.commonFoot,gold,2.5,{'stroke-dasharray':'4 4','data-part':'common-height-from-P'});
          d.right(g.commonFoot,P,M.add(g.commonFoot,M.sub(C,B)),gold);
        }
      }
      if (s === 0 || s === 6 || s === 7 || s >= 10) {
        [[B,D,C,blue],[C,E,A,teal],[A,s === 10 ? Fprime : F,B,s === 10 ? gold : purple]].forEach(([start,middle,end,color],index) => {
          if (s === 12 && index !== 2) return;
          d.segment(start,middle,color,s === 7 ? 4.5 : 3,{'data-part':`ratio-${index}-numerator`});
          d.segment(middle,end,color,s === 7 ? 4.5 : 3,{'stroke-dasharray':'6 4','data-part':`ratio-${index}-denominator`});
        });
      }
    },
    steps: [
      {title: 'Name the side points', text: 'Let D, E, and F lie strictly inside BC, CA, and AB, and write [XYZ] for the area of triangle XYZ.', facts: ['BD/DC > 0', 'CE/EA > 0', 'AF/FB > 0'], key: 'Each solid side piece is a numerator and the matching dashed piece is its denominator.'},
      {title: 'Assume concurrence', text: 'Suppose AD, BE, and CF meet at P, and name the three positive areas x = [PAB], y = [PBC], and z = [PCA].', facts: ['x = [PAB]', 'y = [PBC]', 'z = [PCA]'], key: 'The three colored triangles partition ABC around the interior point P.'},
      {title: 'Use the height from B', text: 'Triangles PAB and PBD have the same height from B to AD, so [PAB]/[PBD] = AP/PD.', facts: ['[PAB]/[PBD] = AP/PD'], key: 'The two shaded triangles have bases AP and PD on one line and the same dashed height.'},
      {title: 'Use the height from C', text: 'Triangles PAC and PCD likewise have the same height from C to AD, so [PAC]/[PCD] = AP/PD.', facts: ['[PAC]/[PCD] = AP/PD'], key: 'The second pair has the same base ratio AP/PD.'},
      {title: 'Cancel the common ratio', text: 'Dividing the last two equalities cancels AP/PD and gives x/z = [PBD]/[PCD].', facts: ['x/z = [PBD]/[PCD]'], key: 'Blue areas correspond to blue areas, and violet areas to violet areas.'},
      {title: 'Read a side ratio', text: 'The triangles PBD and PCD share the height from P to BC, so their area ratio is BD/DC.', facts: ['BD/DC = x/z'], key: 'The gold height is common, so the two colored bases determine the area ratio.'},
      {title: 'Repeat around the triangle', text: 'Applying the same argument to BE and CF gives CE/EA = y/x and AF/FB = z/y.', facts: ['BD/DC = x/z', 'CE/EA = y/x', 'AF/FB = z/y'], key: 'The three areas and the three ordered side ratios are illuminated together.'},
      {title: 'Everything cancels', text: 'Multiplying these equalities cancels x, y, and z, leaving the product of the three side ratios equal to 1.', facts: ['(BD/DC) × (CE/EA) × (AF/FB) = (x/z) × (y/x) × (z/y) = 1'], key: 'Each colored area occurs once in a numerator and once in a denominator.'},
      {title: 'Begin the converse', text: 'Assume the ratio product is 1 and intersect AD with BE at P, which lies inside ABC because B and E lie on opposite sides of AD.', facts: ['Assume (BD/DC) × (CE/EA) × (AF/FB) = 1'], key: 'Only AD and BE are drawn: concurrence with CF has not been assumed.'},
      {title: 'Construct a third cevian', text: 'Since P is inside ABC, the ray from C through P meets AB at a unique interior point F′.', facts: ['A — F′ — B', 'C, P, and F′ are collinear'], key: 'The dashed gold cevian is constructed through P; F′ is temporarily given its own name.'},
      {title: 'Apply the forward direction', text: 'The proved direction applied to AD, BE, and CF′ gives AF′/F′B = (DC/BD) × (EA/CE).', facts: ['AF′/F′B = (DC/BD) × (EA/CE)'], key: 'The constructed gold cevian is concurrent with the first two cevians.'},
      {title: 'Use the assumed product', text: 'Rearranging the assumed product shows that AF/FB has the same value as AF′/F′B.', facts: ['AF/FB = AF′/F′B'], key: 'The side AB is highlighted because both ratios locate a point on this same segment.'},
      {title: 'There is only one such point', text: 'A positive ratio k determines a unique point of AB because AF/FB = k forces AF = k × AB/(1 + k), so F = F′.', facts: ['AF = k × AB/(1 + k)', 'F = F′'], key: 'The two names now merge at the unique point with the required ratio.'},
      {title: 'Ceva’s theorem and its converse', text: 'Therefore CF passes through P, proving that the three cevians are concurrent exactly when the ratio product is 1.', facts: ['AD, BE, CF are concurrent ⇔ (BD/DC) × (CE/EA) × (AF/FB) = 1'], key: 'All three cevians are highlighted at their common point P.'}
    ]
  };
})();
