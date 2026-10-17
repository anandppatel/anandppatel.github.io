(() => {
  'use strict';
  const part = name => ({'data-part': name});
  const middleNames = ['M₁', 'M₂', 'M₃'], endNames = ['D', 'E', 'F'];
  function reflectedConstruction(g, M) {
    const bisectorEnds = [], reflectedMids = [], reflectedEnds = [];
    for (let i = 0; i < 3; i++) {
      const a = g.vertices[i], b = g.vertices[(i + 1) % 3], c = g.vertices[(i + 2) % 3];
      const u = M.unit(M.sub(b, a)), w = M.unit(M.sub(c, a));
      // Near a straight angle, perpendicular to u-w is the same internal
      // bisector direction as u+w, without cancelling nearly opposite units.
      const axis = M.dot(u, w) < 0
        ? M.mul(M.unit(M.perp(M.sub(u, w))), Math.sign(M.cross(u, w)))
        : M.unit(M.add(u, w));
      const v = M.sub(g.mids[i], a), reflected = M.add(a, M.sub(M.mul(axis, 2 * M.dot(v, axis)), v));
      bisectorEnds.push(M.intersect(a, M.add(a, axis), b, c));
      reflectedMids.push(reflected);
      reflectedEnds.push(M.intersect(a, reflected, b, c));
    }
    const candidate = reflectedEnds.every(Boolean) ? M.intersect(g.A, reflectedEnds[0], g.B, reflectedEnds[1]) : null;
    return {bisectorEnds, reflectedMids, reflectedEnds, candidate};
  }
  function median(d, g, i, M, strong = false) {
    const a = g.vertices[i], b = g.vertices[(i + 1) % 3], c = g.vertices[(i + 2) % 3], m = g.mids[i];
    d.segment(a, m, d.colors.blue, strong ? 3.8 : 1.5, {'stroke-dasharray': '6 4', ...part('median-' + i)});
    d.tick(b, m, d.colors.blue, i + 1); d.tick(m, c, d.colors.blue, i + 1);
    d.point(m, middleNames[i], d.colors.blue, {dx: -31, dy: 24, ...part('midpoint-' + i)});
  }
  function bisector(d, g, i, strong = false) {
    const a = g.vertices[i], b = g.vertices[(i + 1) % 3], c = g.vertices[(i + 2) % 3], t = g.bisectorEnds[i];
    d.segment(a, t, d.colors.muted, strong ? 3.5 : 1.2, {'stroke-dasharray': '3 5', ...part('internal-bisector-' + i)});
    if (strong) {
      d.angle(b, a, t, d.colors.muted, {radius: 22, ...part('half-angle-' + i + '-first')});
      d.angle(t, a, c, d.colors.muted, {radius: 22, ...part('half-angle-' + i + '-second')});
    }
  }
  function symmedian(d, g, i, strong = false) {
    const color = [d.colors.teal, d.colors.purple, d.colors.gold][i];
    d.segment(g.vertices[i], g.reflectedEnds[i], color, strong ? 4 : 2, part('symmedian-' + i));
    d.point(g.reflectedEnds[i], endNames[i], color, {dx: 13, dy: -10, ...part('symmedian-end-' + i)});
  }
  function reflection(d, g, M) {
    const a = g.A, m = g.mids[0], r = g.reflectedMids[0], j = M.mid(m, r), color = d.colors.teal;
    d.segment(a, r, color, 2, {'stroke-dasharray': '3 4', ...part('reflected-median-segment')});
    d.tick(a, m, color); d.tick(a, r, color);
    d.point(r, 'M₁′', color, {dx: 12, dy: 25, ...part('reflected-midpoint')});
    if (M.dist(m, r) > 1e-8 * g.scale) {
      d.segment(m, r, d.colors.muted, 1.4, {'stroke-dasharray': '3 5', ...part('reflection-connector')});
      d.right(j, m, M.add(j, M.sub(g.bisectorEnds[0], a)), d.colors.muted);
    }
  }
  function splitAngles(d, g, i, useMedian = false) {
    const a = g.vertices[i], b = g.vertices[(i + 1) % 3], c = g.vertices[(i + 2) % 3], q = useMedian ? g.mids[i] : g.reflectedEnds[i];
    d.angle(b, a, q, d.colors.blue, {radius: 29, ...part((useMedian ? 'median' : 'reflected') + '-first-angle-' + i)});
    d.angle(q, a, c, d.colors.teal, {radius: 42, ...part((useMedian ? 'median' : 'reflected') + '-second-angle-' + i)});
  }
  const construction = {
    steps: [
      {label: 'Mark the midpoint M₁', text: 'Mark M₁ as the midpoint of BC.'},
      {label: 'Draw the median AM₁', text: 'Join A to M₁; the dashed blue segment is the median.'},
      {label: 'Draw the internal bisector at A', text: 'Draw the internal bisector of angle BAC; this line will be the mirror.'},
      {label: 'Reflect the median ray', text: 'Reflect M₁ across the bisector to M₁′, then meet BC with the ray AM₁′ at D; AD is the A-symmedian.'},
      {label: 'Reflect the median at B', text: 'Reflect the median from B across its own internal bisector, obtaining the B-symmedian BE.'},
      {label: 'Reflect the median at C', text: 'Repeat at C to obtain the third symmedian CF; its definition does not assume any common point.'},
      {label: 'Mark the intersection K', text: 'Name the intersection of AD and BE as K and inspect CF; the proof will establish that the third symmedian also passes through K.'}
    ],
    handleIds: () => [],
    draw(d, g, l, p, M) {
      if (!l) return;
      if (l === 1) {
        d.tick(g.B, g.mids[0], d.colors.blue); d.tick(g.mids[0], g.C, d.colors.blue);
        d.point(g.mids[0], middleNames[0], d.colors.blue, {dx: -31, dy: 24});
      } else median(d, g, 0, M, l === 2);
      if (l >= 3) bisector(d, g, 0, l === 3);
      if (l >= 4) {reflection(d, g, M); symmedian(d, g, 0, l === 4);}
      if (l >= 5) {median(d, g, 1, M); bisector(d, g, 1); symmedian(d, g, 1, l === 5);}
      if (l >= 6) {median(d, g, 2, M); bisector(d, g, 2); symmedian(d, g, 2, l === 6);}
      if (l >= 7) d.point(g.candidate, 'K', d.colors.gold, {dx: 13, dy: -18, ...part('symmedian-point-K')});
    },
    extent(g, p, l) {
      const out = [...g.vertices];
      if (l >= 1) out.push(g.mids[0]);
      if (l >= 3) out.push(g.bisectorEnds[0]);
      if (l >= 4) out.push(g.reflectedMids[0], g.reflectedEnds[0]);
      if (l >= 5) out.push(g.reflectedEnds[1]);
      if (l >= 6) out.push(g.reflectedEnds[2]);
      if (l >= 7) out.push(g.candidate);
      return out.filter(Boolean);
    },
    status: (g, p, l, M) => l >= 4 && M.dist(g.mids[0], g.reflectedMids[0]) < 1e-7 * g.scale
      ? 'The median and its reflection are indistinguishable at drawing precision; this observation alone does not assert an exact side equality.'
      : 'Drag A, B, or C freely; each symmedian is constructed by reflecting its own median ray.'
  };
  window.ProofEpisode = {
    slug: 'symmedian', number: '12', title: 'The symmedian point K', subtitle: 'Reflect the medians and recover concurrence',
    observation: 'Reflect each median ray across its vertex’s internal angle bisector; the three resulting symmedians meet at a unique interior point K, called the symmedian point.',
    prediction: 'The medians are concurrent: will reflecting each in a different line preserve that concurrence?',
    connections: {
      title: 'Why the symmedian matters',
      introduction: 'The symmedian links three ways of describing a triangle: angles, lengths, and areas. Its concurrence is the first part of a larger pattern.',
      items: [
        {title: 'The isogonal conjugate of the centroid', body: 'Start with any interior point P and reflect AP, BP, and CP in the three internal angle bisectors. Trigonometric Ceva shows that the reflected rays meet again. Their common point is called the isogonal conjugate of P; reflecting twice returns P. The centroid G lies on the medians, so its isogonal conjugate is K. The incenter I stays fixed because its three rays are already angle bisectors. These are three different reflections, not one reflection of the whole triangle.'},
        {title: 'A squared ratio identifies the symmedian', body: 'For a cevian AD with D inside BC, compare the three rules below. The squared ratio gives a practical way to recognize a symmedian from lengths, even when its defining reflection is not visible.'},
        {title: 'Angles lead to areas and distances', body: 'Write a = BC, b = CA, c = AB. The triangles KBC, KCA, KAB have areas in the ratio a² : b² : c². Consequently, the perpendicular distances from K to the lines BC, CA, AB have ratio a : b : c. The incenter has equal distances to the sides; K has distances proportional to their lengths. The homework uses these tools in new configurations: Problem 3 locates K in a right triangle, and Problem 4 constructs a symmedian with tangents to the circumcircle.'},
        {title: 'A point selected by a minimum', body: 'There is also an optimization interpretation: among points strictly inside the triangle, K uniquely minimizes the sum of the squares of the three perpendicular distances to the full side lines. This claim concerns squared distances, not their ordinary sum. To investigate it, first add the areas of PBC, PCA, and PAB for an arbitrary interior point P; then compare its distances with the proportional distances at K. The area identity and a sum of nonnegative squares supply the proof.'}
      ],
      comparison: [
        {name: 'Median', ratio: 'BD/DC = 1', meaning: 'Equal pieces of the opposite side'},
        {name: 'Internal angle bisector', ratio: 'BD/DC = AB/AC', meaning: 'Pieces proportional to the adjacent sides'},
        {name: 'Symmedian', ratio: 'BD/DC = (AB/AC)²', meaning: 'Pieces proportional to the squares of the adjacent sides'}
      ],
      exploration: 'In All Centers, switch on G, I, and K. Move one vertex to compare a scalene, an isosceles, and an equilateral triangle. Which coincidences can you justify? Problem 2 places G, I, and K in a family defined by powers of side ratios. Problems 3–4 explore the right-triangle and tangent constructions.',
      links: [{label: 'Compare G, I, and K in All Centers', href: '../all-centers/'}, {label: 'Homework Problems 2–4', href: '../homework/cevians-and-area/#problem-2'}]
    },
    after: 'Prove that AD is both a median and a symmedian exactly when AB = AC; what does this imply when all three symmedians are medians?',
    prerequisites: [
      {label: 'C2: rigid motions and reflection', href: '../basics/#c2'},
      {label: 'Medians and the centroid', href: '../centroid/'},
      {label: 'Internal angle bisectors', href: '../incenter/'},
      {label: 'Trigonometric Ceva and the cevian identity', href: '../trig-ceva/'}
    ],
    notes: [
      {title: 'A ray is reflected', body: 'Reflect the ray from a vertex through the side midpoint, then intersect the reflected ray with the opposite side; the reflected midpoint itself need not lie on that side.'},
      {title: 'Why the reflected ray meets the side', body: 'A median ray is strictly inside its vertex angle; reflection in the internal bisector exchanges the two boundary rays and preserves the interior, so the reflected ray meets the opposite segment exactly once.'},
      {title: 'The sine ratio reverses', body: 'Reflection exchanges the two parts of the vertex angle, so the numerator and denominator of its sine ratio exchange places.'},
      {title: 'Equal-sided triangles are included', body: 'If the two sides at a vertex are equal, its median is already the internal bisector and reflection fixes the ray; the proof still applies, including to an equilateral triangle.'},
      {title: 'The drawing is a construction', body: 'Each ray is reflected independently; the proof derives their concurrence, while numerical calculations only position the picture.'}
    ],
    params: {}, construction,
    compute: (g, p, M) => reflectedConstruction(g, M),
    status: (g, p, active, s) => active && s < 7
      ? 'The rays are constructed independently; their common point is not used before the trigonometric Ceva step.'
      : 'Drag any vertex; K follows the three symmedians, including in right and obtuse triangles.',
    extent(g, p, s) {
      const out = [...g.vertices];
      if (s === 1 || s === 2) out.push(g.reflectedMids[0]);
      if (s >= 7) out.push(g.candidate);
      return out.filter(Boolean);
    },
    draw(d, g, s, p, M) {
      if (s <= 5) {
        median(d, g, 0, M, s === 0 || s === 3 || s === 4);
        bisector(d, g, 0, s === 1 || s === 2);
        if (s >= 1) symmedian(d, g, 0, s === 1 || s === 2 || s === 5);
        if (s === 1 || s === 2) reflection(d, g, M);
        if (s === 2) {
          splitAngles(d, g, 0, true);
          d.angle(g.reflectedEnds[0], g.A, g.C, d.colors.blue, {radius: 29, ...part('reflected-angle-equal-first')});
          d.angle(g.B, g.A, g.reflectedEnds[0], d.colors.teal, {radius: 42, ...part('reflected-angle-equal-second')});
        }
        if (s === 3 || s === 4) {
          d.poly([g.A, g.B, g.mids[0]], d.colors.blue, .13, part('median-area-first'));
          d.poly([g.A, g.mids[0], g.C], d.colors.teal, .13, part('median-area-second'));
          splitAngles(d, g, 0, true);
        }
        if (s === 5) splitAngles(d, g, 0);
      } else {
        for (let i = 0; i < 3; i++) {symmedian(d, g, i, s === 6 || s === 7); if (s <= 7) splitAngles(d, g, i);}
      }
      if (s >= 7) d.point(g.candidate, 'K', d.colors.gold, {dx: 13, dy: -18, ...part('symmedian-point-K')});
      if (s >= 8) {
        d.segment(g.A, g.B, d.colors.blue, 4, part('length-AB'));
        d.segment(g.A, g.C, d.colors.teal, 4, part('length-AC'));
        d.segment(g.B, g.reflectedEnds[0], d.colors.blue, 4, part('squared-ratio-BD'));
        d.segment(g.reflectedEnds[0], g.C, d.colors.teal, 4, {'stroke-dasharray': '6 4', ...part('squared-ratio-DC')});
        splitAngles(d, g, 0);
      }
    },
    steps: [
      {title: 'Begin with a median', text: 'Let M₁ be the midpoint of BC, so the median ray AM₁ lies strictly inside angle BAC.', facts: ['BM₁ = M₁C', 'B — M₁ — C'], key: 'The matching ticks give the midpoint hypothesis; the dashed blue ray is the median.'},
      {title: 'Reflect the ray', text: 'Reflect AM₁ across the internal angle bisector at A and call its unique intersection with the interior of BC point D.', facts: ['AD is the A-symmedian.'], key: 'The reflected point M₁′ defines the ray; D is where that ray meets BC, not necessarily M₁′ itself.'},
      {title: 'Exchange the angles', text: 'Reflection exchanges the boundary rays AB and AC, so ∠BAD = ∠M₁AC and ∠DAC = ∠BAM₁.', facts: ['∠BAD = ∠M₁AC', '∠DAC = ∠BAM₁'], key: 'Matching colors pair each original angle with its reflected angle on the other side of the bisector.'},
      {title: 'Apply the cevian identity to the median', text: 'The cevian identity from trigonometric Ceva gives 1 = BM₁/M₁C = (AB/AC) × (sin ∠BAM₁ / sin ∠M₁AC).', facts: ['1 = (AB/AC) × (sin ∠BAM₁ / sin ∠M₁AC)'], key: 'The equal base pieces make the side ratio 1 while the split angles describe the median.'},
      {title: 'Solve for the median’s sine ratio', text: 'Rearranging this positive identity yields sin ∠BAM₁ / sin ∠M₁AC = AC/AB.', facts: ['sin ∠BAM₁ / sin ∠M₁AC = AC/AB'], key: 'The median’s sine ratio is the inverse of the adjacent side-length ratio.'},
      {title: 'Take the reciprocal after reflection', text: 'The exchanged angles therefore give sin ∠BAD / sin ∠DAC = AB/AC for the reflected ray.', facts: ['sin ∠BAD / sin ∠DAC = AB/AC'], key: 'The teal symmedian uses the original denominator angle first, so its sine ratio is the reciprocal.'},
      {title: 'Repeat the reflection at B and C', text: 'Defining BE and CF by the same reflection gives sine ratios BC/BA and CA/CB, so the three symmedian sine ratios multiply to 1.', facts: ['sin ∠CBE / sin ∠EBA = BC/BA', 'sin ∠ACF / sin ∠FCB = CA/CB', '(AB/AC) × (BC/BA) × (CA/CB) = 1'], key: 'The three independently constructed symmedians supply the cyclic factors that cancel.'},
      {title: 'Obtain the symmedian point', text: 'Trigonometric Ceva now makes AD, BE, and CF concurrent at a unique interior point K, since their first two interior cevians have a unique intersection.', facts: ['K lies on AD, BE, and CF.', 'K is the symmedian point.'], key: 'The name K appears only after the angle criterion proves concurrence.'},
      {title: 'Recover a side-ratio characterization', text: 'Using the cevian identity once more gives BD/DC = (AB/AC) × (AB/AC) = (AB/AC)².', facts: ['BD/DC = (AB/AC)²'], key: 'The highlighted side ratio uses the square of the adjacent side-length ratio.'},
      {title: 'The ratio also identifies the ray', text: 'Conversely, a positive ratio k fixes one interior point of BC by BD = k × BC/(1 + k), so any cevian with BD/DC = (AB/AC)² must be the A-symmedian.', facts: ['AD is the A-symmedian ⇔ BD/DC = (AB/AC)²'], key: 'The unique point D on the fixed segment BC identifies the ray, with no exception for equal adjacent sides.'}
    ]
  };
})();
