(() => {
  'use strict';

  function putOnCircle(v, M) {
    const center = M.mid(v[0], v[1]);
    const radius = M.dist(v[0], v[1]) / 2;
    if (radius < 1e-12) return v;
    let direction = M.sub(v[2], center);
    if (M.norm(direction) < radius * 1e-8) direction = M.perp(M.sub(v[1], v[0]));
    return [v[0], v[1], M.add(center, M.mul(M.unit(direction), radius))];
  }

  window.ProofEpisode = {
    slug: 'thales', number: '07', title: 'Thales’ theorem',
    subtitle: 'A diameter sees a right angle',
    observation: 'For noncollinear A, B, and C, the angle ACB is a right angle if and only if C lies on the circle with diameter AB.',
    prediction: 'Drag C inside and outside the circle: when does angle ACB become a right angle?',
    after: 'Where is the circumcenter of a right triangle, and why can it never lie strictly inside that triangle?',
    initial: [{x: -.85, y: .38}, {x: .85, y: .38}, {x: -.26, y: -.43}],
    prerequisites: [
      {label: 'Rigid motions and half-turns', href: '../basics/#c2'},
      {label: 'Isosceles triangles and SAS', href: '../basics/#t1'},
      {label: 'The triangle angle sum', href: '../basics/#t2'},
      {label: 'Parallel lines and angles', href: '../basics/#p1'}
    ],
    notes: [
      {title: 'Two directions', body: 'First start with C on the circle and prove a right angle; then start with a right angle and prove C lies on the circle.'},
      {title: 'The endpoints are excluded', body: 'C must differ from A and B, and the triangle must be noncollinear; otherwise angle ACB is not the angle in this theorem.'},
      {title: 'What the measurement tells us', body: 'Rounded angle measurements suggest the result; the isosceles triangles and the congruence argument prove it.'}
    ],
    actions: [{label: 'Place C on the circle', hideInProof:true, run: (v, p, M) => { const next = putOnCircle(v, M); v.splice(0, v.length, ...next); }}],
    constrain: (v, p, active, step, M) => active ? putOnCircle(v, M) : v,
    compute: (g, p, M) => ({
      diameterCenter: M.mid(g.A, g.B),
      diameterRadius: M.dist(g.A, g.B) / 2,
      reflectedC: M.sub(M.add(g.A, g.B), g.C),
      angleC: M.angle(g.A, g.C, g.B)
    }),
    status: (g, p, active, step) => active
      ? (step < 6
        ? 'Proof mode: C stays on the circle; A and B are free. Close proof to move C freely.'
        : 'Converse: the right angle at C stays fixed. Close proof to explore freely.')
      : (Number.isFinite(g.angleC)
        ? `Angle ACB ≈ ${g.angleC.toFixed(1)}°. All three vertices are free; use “Place C on the circle” to try the hypothesis.`
        : 'Move a vertex to make A, B, and C noncollinear.'),
    extent: (g, p, step) => {
      const m = g.diameterCenter, r = g.diameterRadius;
      const points = [g.A, g.B, g.C, {x: m.x-r, y: m.y-r}, {x: m.x+r, y: m.y+r}];
      if (step >= 7) points.push(g.reflectedC);
      return points;
    },
    draw: (d, g, s, p, M) => {
      const {A, B, C, diameterCenter: m, diameterRadius: r, reflectedC: D} = g;
      const {blue, teal, purple, gold, muted} = d.colors;
      const circleVisible = s < 6 || s === 11;
      if (circleVisible) d.circle(m, r, s === 11 ? gold : muted, s === 11 ? 3 : 1.8, {'data-part': 'diameter-circle'});
      d.segment(A, B, s === 0 || s === 10 ? gold : muted, s === 0 || s === 10 ? 4 : 1.5, {'data-part': 'diameter-AB'});
      d.point(m, 'M', gold, {dx: 8, dy: 19, 'data-part': 'midpoint-M'});
      if (s === 0 || s === 6) {
        d.tick(A, m, gold); d.tick(m, B, gold);
      }
      if (s >= 1 && s <= 5 || s === 10 || s === 11) {
        d.segment(m, A, gold, 3, {'data-part': 'radius-MA'});
        d.segment(m, B, gold, 3, {'data-part': 'radius-MB'});
        d.segment(m, C, gold, 3, {'data-part': 'radius-MC'});
        d.tick(m, A, gold); d.tick(m, B, gold); d.tick(m, C, gold);
      }
      if (s === 2 || s === 4) {
        d.poly([A, m, C], blue, .13, {'data-part': 'isosceles-AMC'});
        d.angle(m, A, C, blue, {radius: 27, label: 'α', 'data-part': 'angle-alpha-A'});
        d.angle(A, C, m, blue, {radius: 34, label: 'α', 'data-part': 'angle-alpha-C'});
      }
      if (s === 3 || s === 4) {
        d.poly([B, m, C], teal, .13, {'data-part': 'isosceles-BMC'});
        d.angle(m, B, C, teal, {radius: 27, label: 'β', 'data-part': 'angle-beta-B'});
        d.angle(m, C, B, teal, {radius: 24, label: 'β', 'data-part': 'angle-beta-C'});
      }
      if (s === -1) d.angle(A, C, B, blue, {radius: 30, label: `${g.angleC.toFixed(1)}°`, 'data-part': 'measured-angle-C'});
      if (s === 5 || s === 6 || s === 11) {
        d.segment(A, C, blue, 3, {'data-part': 'right-angle-arm-CA'});
        d.segment(C, B, teal, 3, {'data-part': 'right-angle-arm-CB'});
        d.right(C, A, B, gold);
      }
      if (s >= 7 && s <= 10) {
        d.point(D, 'D', purple, {dx: 12, dy: 18, 'data-part': 'half-turn-D'});
        d.segment(C, D, purple, s === 10 ? 4 : 1.6, {'data-part': 'diagonal-CD', 'stroke-dasharray': s === 7 ? '5 5' : ''});
        d.tick(C, m, purple, 2); d.tick(m, D, purple, 2);
        d.segment(A, C, blue, 3, {'data-part': 'side-AC'});
        d.segment(B, D, blue, 3, {'data-part': 'side-BD'});
        d.segment(C, B, teal, 3, {'data-part': 'side-CB'});
        d.segment(D, A, teal, 3, {'data-part': 'side-DA'});
        d.tick(A, C, blue); d.tick(B, D, blue);
        d.tick(C, B, teal, 2); d.tick(D, A, teal, 2);
        if (s === 8) {
          d.poly([A, C, B, D], blue, .08, {'data-part': 'rectangle-ACBD'});
          d.right(A, C, D, gold); d.right(C, A, B, gold);
          d.right(B, C, D, gold); d.right(D, B, A, gold);
        }
        if (s === 9) {
          d.poly([A, C, B], blue, .14, {'data-part': 'congruent-ACB'});
          d.poly([C, A, D], purple, .14, {'data-part': 'congruent-CAD'});
          d.right(C, A, B, gold); d.right(A, C, D, gold);
        }
        if (s === 10) d.segment(A, B, gold, 4, {'data-part': 'equal-diagonal-AB'});
      }
    },
    steps: [
      {title: 'Start on a circle', text: 'Let M be the midpoint of AB, and suppose C lies on the circle with center M and radius MA, with A, B, and C noncollinear.', facts: ['MA = MB', 'C lies on the circle'], key: 'The diameter AB and its midpoint M are highlighted.'},
      {title: 'Three equal radii', text: 'Since A, B, and C lie on this circle, the three radii MA, MB, and MC have equal length.', facts: ['MA = MB = MC'], key: 'Gold segments and matching marks show the three equal radii.'},
      {title: 'The first isosceles triangle', text: 'Triangle AMC is isosceles, so its angles at A and C have the same size α.', facts: ['∠MAC = ∠ACM = α'], key: 'The blue triangle has two equal angles labeled α.'},
      {title: 'The second isosceles triangle', text: 'Triangle BMC is isosceles, so its angles at B and C have the same size β.', facts: ['∠MBC = ∠MCB = β'], key: 'The teal triangle has two equal angles labeled β.'},
      {title: 'Add the three angles', text: 'Because M lies inside AB, the angles of ABC are α, β, and α + β, whose sum is 180°.', facts: ['2α + 2β = 180°', 'α + β = 90°'], key: 'The two colored pieces of angle ACB add to α + β.'},
      {title: 'Thales’ theorem', text: 'It follows that angle ACB is a right angle.', facts: ['∠ACB = 90°'], key: 'The right-angle square marks the conclusion at C.'},
      {title: 'Now reverse the argument', text: 'For the converse, suppose instead that angle ACB is a right angle, and let M be the midpoint of AB.', facts: ['Assume ∠ACB = 90°', 'MA = MB'], key: 'The circle disappears: only the right angle and the midpoint are now assumed.'},
      {title: 'Make a half-turn', text: 'A half-turn about M sends A to B and C to a point D, giving AC ∥ BD, CB ∥ DA, AC = BD, and CB = DA.', facts: ['AC ∥ BD; CB ∥ DA', 'AC = BD; CB = DA', 'CM = MD'], key: 'Pairs of blue and teal sides correspond under the half-turn, and M bisects CD.'},
      {title: 'A rectangle appears', text: 'Thus ACBD is a parallelogram with a right angle, so the parallel-line angle rules make all four angles right angles.', facts: ['ACBD is a rectangle'], key: 'All four corners of the rectangle are marked as right angles.'},
      {title: 'Compare its diagonals', text: 'Triangles ACB and CAD are congruent by SAS, since they share AC, have CB = AD, and have equal included right angles.', facts: ['AC = CA', 'CB = AD', '∠ACB = ∠CAD = 90°'], key: 'The shaded triangles have the matching side-angle-side data.'},
      {title: 'Halve equal lengths', text: 'Corresponding sides give AB = CD, and halving these diagonals at M gives MA = MB = MC.', facts: ['AB = CD', 'MA = MB = MC'], key: 'The equal diagonals are highlighted, together with the half-diagonals from M.'},
      {title: 'The converse', text: 'Therefore C lies on the circle with center M and radius MA, which is the circle with diameter AB.', facts: ['∠ACB = 90° ⇔ C lies on the circle with diameter AB'], key: 'The circle returns only after the equal radii have been proved.'}
    ]
  };
})();
