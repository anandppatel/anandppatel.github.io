(() => {
  'use strict';
  const part = name => ({'data-part': name});
  const sine = (a, v, b, M) => Math.abs(M.cross(M.sub(a, v), M.sub(b, v))) / (M.dist(a, v) * M.dist(b, v));
  const names = ['D', 'E', 'F'];
  function configuration(v, p, M) {
    const ends = [M.lerp(v[1], v[2], p.d), M.lerp(v[2], v[0], p.e), M.lerp(v[0], v[1], p.f)];
    const P = M.intersect(v[0], ends[0], v[1], ends[1]);
    return {ends, P};
  }
  function makeConcurrent(v, p, M) {
    // The positive Ceva ratio determines the same intersection without
    // subtracting nearly parallel line intersections in a very flat triangle.
    const product = (p.d / (1 - p.d)) * (p.e / (1 - p.e));
    p.f = 1 / (1 + product);
  }
  function cevians(d, g, count, emphasis = -1) {
    const colors = [d.colors.blue, d.colors.teal, d.colors.purple];
    for (let i = 0; i < count; i++) d.segment(g.vertices[i], g.ends[i], colors[i], emphasis === i ? 4 : 1.8, part('cevian-' + i));
  }
  function angles(d, g, i, labels = false) {
    const v = g.vertices[i], b = g.vertices[(i + 1) % 3], c = g.vertices[(i + 2) % 3], q = g.ends[i];
    d.angle(b, v, q, d.colors.blue, {radius: 27, ...(labels ? {label: 'α'} : {}), ...part('split-angle-' + i + '-numerator')});
    d.angle(q, v, c, d.colors.teal, {radius: 41, ...(labels ? {label: 'β'} : {}), ...part('split-angle-' + i + '-denominator')});
  }
  function pair(d, g, i) {
    const v = g.vertices[i], b = g.vertices[(i + 1) % 3], c = g.vertices[(i + 2) % 3], q = g.ends[i];
    d.poly([v, b, q], d.colors.blue, .14, part('sine-area-numerator-' + i));
    d.poly([v, q, c], d.colors.teal, .14, part('sine-area-denominator-' + i));
    d.segment(b, q, d.colors.blue, 4, part('side-ratio-numerator-' + i));
    d.segment(q, c, d.colors.teal, 4, {'stroke-dasharray': '6 4', ...part('side-ratio-denominator-' + i)});
    angles(d, g, i);
  }
  function altitude(d, from, f, a, b, color, M, name) {
    d.line(a, b, d.colors.muted, 1, {'stroke-dasharray': '4 5', ...part(name + '-support')});
    d.segment(from, f, color, 3, part(name));
    d.right(f, from, M.add(f, M.sub(b, a)), color);
  }
  function status(g) {
    return `Sine product ≈ ${g.sineProduct.toFixed(3)}; side-ratio product ≈ ${g.sideProduct.toFixed(3)}. D, E, and F remain free; rounded values do not prove concurrence.`;
  }
  const construction = {
    steps: [
      {label: 'Place D, E, and F', text: 'Place one freely movable point strictly inside each side: D on BC, E on CA, and F on AB.'},
      {label: 'Draw AD', text: 'Join A to D; this segment divides the angle at A into two positive angles.'},
      {label: 'Draw BE', text: 'Join B to E independently of the first cevian.'},
      {label: 'Draw CF', text: 'Join C to F; the three cevians need not share a point.'},
      {label: 'Mark the six angles', text: 'Mark each pair of split angles and compare their sine product with the side-ratio product; all three side points remain free.'}
    ],
    handleIds: l => l ? names : [],
    draw(d, g, l) {
      if (!l) return;
      cevians(d, g, Math.min(3, l - 1), l < 5 ? l - 2 : -1);
      if (l >= 5) for (let i = 0; i < 3; i++) angles(d, g, i);
    },
    extent: (g, p, l) => l ? [...g.vertices, ...g.ends] : [...g.vertices],
    status: (g, p, l) => l >= 5 ? status(g) : 'Drag the vertices and the revealed side points; no concurrence constraint is imposed.'
  };
  window.ProofEpisode = {
    slug: 'trig-ceva', number: '11', title: 'Trigonometric Ceva', subtitle: 'An angle criterion for concurrence',
    observation: 'For D, E, F strictly inside BC, CA, AB, the cevians AD, BE, CF are concurrent if and only if (sin ∠BAD / sin ∠DAC) × (sin ∠CBE / sin ∠EBA) × (sin ∠ACF / sin ∠FCB) = 1.',
    prediction: 'Move F while keeping D and E fixed: what happens to the sine product when the three cevians meet?',
    after: 'What happens to the criterion when each cevian is reflected across its vertex’s internal angle bisector?',
    prerequisites: [
      {label: 'C4: areas and common heights', href: '../basics/#c4'},
      {label: 'Ceva’s theorem and its converse', href: '../ceva/'}
    ],
    notes: [
      {title: 'Sine for an angle', body: 'For an acute angle θ, sin θ is opposite leg / hypotenuse in a right triangle; sin 90° = 1, and for 90° < θ < 180° use sin θ = sin(180° − θ). The proof derives the needed area formula from this definition.'},
      {title: 'Positive angles and ratios', body: 'Every side point is strictly interior, so each split angle is between 0° and 180° and its sine is positive; divisions in the proof are therefore valid.'},
      {title: 'Keep the cyclic order', body: 'At A start from AB, at B start from BC, and at C start from CA; the numerator and denominator angles follow that order.'},
      {title: 'Both directions are proved', body: 'The two products are equal for every placement of the three side points; ordinary Ceva then gives both implications without assuming that the cevians already meet.'},
      {title: 'Free exploration', body: 'The proof leaves D, E, and F independently movable; “Make the cevians meet” places F once and does not lock it afterward.'}
    ],
    params: {d: .43, e: .54, f: .66},
    actions: [{label: 'Make the cevians meet', run: makeConcurrent}],
    construction,
    compute(g, p, M) {
      const {ends, P} = configuration(g.vertices, p, M);
      const sineRatios = g.vertices.map((v, i) => sine(g.vertices[(i + 1) % 3], v, ends[i], M) / sine(ends[i], v, g.vertices[(i + 2) % 3], M));
      const sideRatios = [p.d / (1 - p.d), p.e / (1 - p.e), p.f / (1 - p.f)];
      return {ends, D: ends[0], E: ends[1], F: ends[2], P, sineRatios, sideRatios,
        sineProduct: sineRatios.reduce((a, b) => a * b, 1), sideProduct: sideRatios.reduce((a, b) => a * b, 1),
        X: M.foot(ends[0], g.A, g.B), Y: M.foot(ends[0], g.A, g.C), Z: M.foot(g.A, g.B, g.C)};
    },
    handles(g, p, M) {
      return names.map((id, i) => ({id, point: g.ends[i], label: `Point ${id} strictly inside side ${['BC', 'CA', 'AB'][i]}. Drag or use arrow keys.`,
        move(point) {p[['d', 'e', 'f'][i]] = M.clamp(M.parameter(point, g.vertices[(i + 1) % 3], g.vertices[(i + 2) % 3]), .015, .985);}}));
    },
    status,
    extent(g, p, s) {
      const out = [...g.vertices];
      if (s >= 1 && s <= 3) out.push(g.X);
      if (s === 4) out.push(g.Y);
      if (s === 5) out.push(g.Z);
      return out;
    },
    draw(d, g, s, p, M) {
      cevians(d, g, 3, s >= 1 && s <= 6 ? 0 : s === 7 ? 1 : s === 8 ? 2 : -1);
      if (s === 0 || s >= 9) for (let i = 0; i < 3; i++) angles(d, g, i);
      if (s >= 1 && s <= 3) {
        d.poly([g.A, g.B, g.D], d.colors.blue, .16, part('area-ABD'));
        altitude(d, g.D, g.X, g.A, g.B, d.colors.gold, M, 'height-DX');
        d.point(g.X, 'X', d.colors.gold, {dx: 12, dy: 20});
        d.angle(g.B, g.A, g.D, d.colors.blue, {radius: 30, label: 'θ', ...part('angle-BAD')});
        d.segment(g.A, g.D, d.colors.teal, 4, part('length-AD'));
        if (s === 3) d.segment(g.A, g.B, d.colors.blue, 4, part('base-AB'));
      }
      if (s === 4) {
        d.poly([g.A, g.C, g.D], d.colors.teal, .16, part('area-ACD'));
        altitude(d, g.D, g.Y, g.A, g.C, d.colors.gold, M, 'height-DY');
        d.point(g.Y, 'Y', d.colors.gold, {dx: 12, dy: 20});
        d.angle(g.D, g.A, g.C, d.colors.teal, {radius: 37, ...part('angle-DAC')});
        d.segment(g.A, g.C, d.colors.teal, 4, part('base-AC'));
      }
      if (s >= 5 && s <= 8) pair(d, g, s <= 6 ? 0 : s - 6);
      if (s === 5) {
        altitude(d, g.A, g.Z, g.B, g.C, d.colors.gold, M, 'common-height-from-A');
        d.point(g.Z, 'Z', d.colors.gold, {dx: 12, dy: 20});
      }
      if (s >= 9) for (let i = 0; i < 3; i++) {
        const a = g.vertices[(i + 1) % 3], b = g.vertices[(i + 2) % 3];
        d.segment(a, g.ends[i], [d.colors.blue, d.colors.teal, d.colors.purple][i], 3.5, part('product-numerator-' + i));
        d.segment(g.ends[i], b, [d.colors.blue, d.colors.teal, d.colors.purple][i], 3.5, {'stroke-dasharray': '6 4', ...part('product-denominator-' + i)});
      }
    },
    steps: [
      {title: 'Keep every side point interior', text: 'Let D, E, and F lie strictly inside BC, CA, and AB, so every split angle has a positive sine.', facts: ['All six split angles lie between 0° and 180°.'], key: 'The two arcs at each vertex correspond to one numerator and one denominator.'},
      {title: 'Drop a perpendicular', text: 'Let X be the perpendicular foot from D to the full line AB, and set θ = ∠BAD.', facts: ['DX is the height of triangle ABD above AB.'], key: 'The gold perpendicular reaches the supporting line even when its foot is outside AB.'},
      {title: 'Express the height using sine', text: 'The right triangle gives DX = AD sin θ for acute θ, the supplementary angle gives the same identity for obtuse θ, and θ = 90° gives X = A and DX = AD.', facts: ['DX = AD sin ∠BAD', 'sin(180° − θ) = sin θ'], key: 'AD is the sloping side and DX is its perpendicular height; the right-angle case needs no nondegenerate auxiliary triangle.'},
      {title: 'Use base times height', text: 'Multiplying this height by half the base AB gives [ABD] = ½ AB × AD × sin ∠BAD.', facts: ['[ABD] = ½ AB × AD × sin ∠BAD'], key: 'The blue triangle, its base AB, and its gold height supply the area formula.'},
      {title: 'Compute the other area', text: 'The same altitude argument in triangle ACD gives [ACD] = ½ AC × AD × sin ∠DAC.', facts: ['[ACD] = ½ AC × AD × sin ∠DAC'], key: 'The second perpendicular now measures the height above AC.'},
      {title: 'Read the same ratio from the bases', text: 'Triangles ABD and ACD have a common height from A to BC, so [ABD]/[ACD] = BD/DC.', facts: ['[ABD]/[ACD] = BD/DC'], key: 'The blue and teal bases lie on one supporting line and share the gold height.'},
      {title: 'Obtain the cevian identity', text: 'Dividing the two sine-area formulas cancels the positive factor ½ AD and yields BD/DC = (AB/AC) × (sin ∠BAD / sin ∠DAC).', facts: ['BD/DC = (AB/AC) × (sin ∠BAD / sin ∠DAC)'], key: 'The colored areas link the split angles at A to the split side BC.'},
      {title: 'Repeat at B', text: 'Applying the same identity to BE gives CE/EA = (BC/BA) × (sin ∠CBE / sin ∠EBA).', facts: ['CE/EA = (BC/BA) × (sin ∠CBE / sin ∠EBA)'], key: 'The highlighted pair now shares vertex B and base line CA.'},
      {title: 'Repeat at C', text: 'Applying the identity to CF gives AF/FB = (CA/CB) × (sin ∠ACF / sin ∠FCB).', facts: ['AF/FB = (CA/CB) × (sin ∠ACF / sin ∠FCB)'], key: 'The final pair shares vertex C and base line AB.'},
      {title: 'Cancel the side lengths', text: 'Multiplying the three identities cancels (AB/AC) × (BC/BA) × (CA/CB), so the side-ratio product equals the sine product for every placement of D, E, and F.', facts: ['Side-ratio product = sine product', '(AB/AC) × (BC/BA) × (CA/CB) = 1'], key: 'Every side length occurs once above and once below, while the three angle ratios remain.'},
      {title: 'Concurrence forces the product', text: 'If AD, BE, and CF are concurrent, ordinary Ceva makes the side-ratio product 1, hence the sine product is 1.', facts: ['Concurrence ⇒ sine product = 1'], key: 'This implication is conditional; the freely movable diagram is not forced to satisfy its hypothesis.'},
      {title: 'The product forces concurrence', text: 'Conversely, if the sine product is 1, the identical side-ratio product is 1 and the converse to ordinary Ceva makes AD, BE, and CF concurrent.', facts: ['Sine product = 1 ⇒ concurrence', 'AD, BE, CF concurrent ⇔ sine product = 1'], key: 'The converse uses the established equality of products, so no common point was assumed.'}
    ]
  };
})();
