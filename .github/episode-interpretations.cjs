'use strict';

// Static lesson content is kept here so that the interpretation and its proof
// remain available without JavaScript. The shared renderer fills only the demos.
const begin = '<!-- BEGIN ALTERNATE INTERPRETATION -->';
const end = '<!-- END ALTERNATE INTERPRETATION -->';
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));

function experiment(model, title, instruction, lambda) {
  const setting = lambda === undefined ? '' : ` data-initial-lambda="${lambda}"`;
  return `<details class="physical-experiment">
<summary>${title}</summary>
<p>${instruction}</p>
<div class="physical-demo" data-physical-model="${model}"${setting}></div>
<noscript><p>The interactive experiment needs JavaScript. The description and argument on this page give the complete mathematical interpretation.</p></noscript>
</details>`;
}

function rotating(initial) {
  return `<div class="physical-connection">
<h3>One rotating experiment joins G, N, and H</h3>
<p>Fix three identical springs at A, B, and C on a horizontal table, and join their other ends to one bead. Each spring has stiffness <var>k</var> and zero natural length. Rotate the table about the circumcenter O at angular speed <var>ω</var>. View the bead from the rotating table. As the speed increases, its equilibrium travels along the Euler line: from the centroid G, through the nine-point center N, to the orthocenter H.</p>
<p>Let <var>m</var> be the bead’s mass and put <var>λ</var> = <var>mω</var><sup>2</sup>/<var>k</var>. The three settings are <var>λ</var> = 0 at G, <var>λ</var> = 1 at N, and <var>λ</var> = 2 at H. The table is stationary at the first setting. If O = H, all these positions coincide.</p>
${experiment('rotating', 'Explore the rotating springs', 'Change the speed parameter and move the triangle. The drawing uses the rotating view, in which the three anchors stay fixed. Follow the equilibrium point and the balance of spring and centrifugal forces.', initial)}
<details class="physical-proof"><summary>Why the equilibrium follows the Euler line</summary>
<p>In the following equations, letters denote position vectors. The three spring forces add to 3<var>k</var>(G − P), while the centrifugal force is <var>mω</var><sup>2</sup>(P − O). A bead at rest relative to the table therefore satisfies</p>
<p class="physical-equation">3(G − P) + λ(P − O) = 0.</p>
<p>The Euler-line identity 3G = 2O + H gives</p>
<p class="physical-equation">P = O + (H − O)/(3 − λ).</p>
<p>This proves all three stated settings. It also proves stability throughout the displayed interval 0 ≤ λ ≤ 2. Indeed, the effective potential in the rotating frame is</p>
<p class="physical-equation">U(P) = ½k(PA<sup>2</sup> + PB<sup>2</sup> + PC<sup>2</sup>) − ½mω<sup>2</sup>PO<sup>2</sup>.</p>
<p>If P<sub>λ</sub> denotes the equilibrium, completing the square gives U(P) − U(P<sub>λ</sub>) = ½k(3 − λ)|P − P<sub>λ</sub>|<sup>2</sup>. This is positive away from P<sub>λ</sub>. Coriolis force does no work; gentle damping relative to the table makes a displaced bead settle. Without damping, stability does not mean that motion stops.</p>
<p>This apparatus is a direct consequence of the <a href="../euler-line/">Euler-line identity</a> and the stated force laws. The calculation establishes the interpretation; the animation illustrates it.</p>
</details>
</div>`;
}

const content = {
  centroid: {
    title: 'The centroid as a balance point',
    body: `<p>Cut the triangle from a sheet of uniform thickness and density. Its center of mass is G: a support directly below G balances the plate in a uniform gravitational field. Three equal point masses placed at A, B, and C have the same center of mass.</p>
<p>A second experiment turns that balance into a restoring force. Join a freely moving bead to A, B, and C by three identical springs of zero natural length. The springs balance at G. Add gentle damping, and the bead settles there after a small displacement.</p>
${experiment('centroid', 'Explore the plate and equal springs', 'Move the triangle and displace the bead. Compare the balance point of the uniform plate with the equilibrium of the three equal springs. The springs are ideal: their tension is stiffness times their entire length.')}
<details class="physical-proof"><summary>Why both experiments select G</summary>
<p>For three equal masses, the center of mass is (A + B + C)/3. If D is the midpoint of BC, this is A/3 + 2D/3, so it lies on AD and divides that median in the ratio 2:1. The same argument applies to the other medians.</p>
<p>For the plate, write a = BC and slice it into thin strips parallel to BC. At a fraction <var>t</var> of the way from A to BC, the strip has length <var>ta</var> and midpoint (1 − <var>t</var>)A + <var>t</var>D. Uniform density weights this midpoint in proportion to <var>t</var>. Its weighted average is</p>
<p class="physical-equation">[∫<sub>0</sub><sup>1</sup> t((1 − t)A + tD) dt]/[∫<sub>0</sub><sup>1</sup> t dt] = A/3 + 2D/3 = G.</p>
<p>For the springs, the potential energy is U(P) = ½k(PA<sup>2</sup> + PB<sup>2</sup> + PC<sup>2</sup>). Expanding the squares around G gives</p>
<p class="physical-equation">U(P) = U(G) + ³⁄₂k · PG<sup>2</sup>.</p>
<p>Thus G is the unique energy minimum. These are exact statements for a nondegenerate triangle and the stated uniform-mass or ideal-spring models; a numerical drawing is not their proof.</p>
</details>
${rotating(0)}`
  },
  circumcenter: {
    title: 'The circumcenter as an equal-arrival point',
    body: `<p>At the same instant, place a signal source at each vertex. Let all three signals travel through the plane at the same constant speed <var>v</var>. The circumcenter O is the unique place where the three signals arrive together. Their common arrival time is <var>R</var>/<var>v</var>, where <var>R</var> is the circumradius.</p>
<p>Imagine three circular wavefronts spreading through a uniform medium. At one instant all three pass through O. The observation point may lie outside the triangle: an obtuse triangle puts O outside, while a right triangle puts it at the midpoint of the hypotenuse.</p>
${experiment('circumcenter', 'Explore three expanding signals', 'Start the signals together, change their common travel distance, and move the vertices. Look for the instant when all three wavefronts pass through O. The construction includes O even when it lies outside the triangle.')}
<details class="physical-proof"><summary>Why equal arrival identifies O</summary>
<p>The travel times to a point P are PA/<var>v</var>, PB/<var>v</var>, and PC/<var>v</var>. They are equal exactly when PA = PB = PC. The first equality puts P on the perpendicular bisector of AB; the second independent equality puts it on that of AC. Since ABC is noncollinear, those bisectors have the unique intersection O. Conversely, OA = OB = OC = R, so all three signals reach O at time R/<var>v</var>.</p>
<p>The experiment assumes simultaneous emission, equal constant speeds, and unobstructed straight-line travel. The theorem concerns equal arrival times throughout the plane; it does not require O to lie in the triangular region.</p>
</details>`
  },
  incenter: {
    title: 'The incenter as the last point reached by moving walls',
    body: `<p>Move all three side lines inward, perpendicular to themselves, at the same speed. Keep the part of the triangle still inside all three moving walls. The remaining triangle shrinks to a single point: the incenter I.</p>
<p>Equivalently, start three straight fronts along the boundary and let each advance inward at speed <var>v</var>. I is the last point they reach, at time <var>r</var>/<var>v</var>. Here <var>r</var> is the inradius. It is also the center of the largest disk that fits inside the triangle.</p>
${experiment('incenter', 'Explore the inward-moving fronts', 'Advance all three fronts by the same perpendicular distance. Move the vertices and watch the remaining region shrink to I. The walls move at equal normal speed; their intersection corners need not move at equal speed.')}
<details class="physical-proof"><summary>Why I is the unique last point</summary>
<p>Write a = BC, b = CA, c = AB, and let Δ be the area of ABC. For an interior point P, let d<sub>a</sub>, d<sub>b</sub>, and d<sub>c</sub> be its perpendicular distances to the three side lines. Splitting ABC into three triangles gives</p>
<p class="physical-equation">a d<sub>a</sub> + b d<sub>b</sub> + c d<sub>c</sub> = 2Δ = (a + b + c)r.</p>
<p>The last equality comes from making the same split at I, whose three distances equal r. Thus the smallest of P’s three distances is at most r. Equality can hold only when all three distances are r, which identifies I. So every point is reached by time r/<var>v</var>, and I is the only point still present at that time.</p>
<p>More explicitly, when the walls have moved a distance <var>q</var> with 0 ≤ <var>q</var> ≤ r, their inward half-planes intersect in the image of ABC under the dilation centered at I with scale 1 − <var>q</var>/r. At <var>q</var> = r that image is {I}. The argument proves the collapse independently of the illustration.</p>
</details>`
  },
  symmedian: {
    title: 'The symmedian point as an equilibrium of equal springs',
    body: `<p>Extend the three sides to full straight rails. On each rail place a massless collar that slides without friction. Join the three collars to one free bead by identical springs. Each spring has zero natural length and stiffness <var>k</var>. The unique equilibrium of the bead is the symmedian point K.</p>
<p>At equilibrium, a collar makes its spring perpendicular to its rail. The springs therefore minimize the sum of the squared distances from the bead to the three side lines. The rails are the <strong>full side lines</strong>: a perpendicular foot need not lie on a side segment.</p>
${experiment('symmedian', 'Explore the sliding-collar springs', 'Displace the bead and move the triangle. The collars follow the perpendicular feet on the full side lines. With gentle damping, the three equal springs bring the bead to K.')}
<details class="physical-proof"><summary>Why the energy minimum is K</summary>
<p>Let a = BC, b = CA, c = AB, and let Δ be the area. Use inward signed distances d<sub>a</sub>, d<sub>b</sub>, d<sub>c</sub>: a distance is negative on the exterior side of its line. The affine identity</p>
<p class="physical-equation">a d<sub>a</sub> + b d<sub>b</sub> + c d<sub>c</sub> = 2Δ</p>
<p>holds for every point of the plane. Squaring a signed distance gives the ordinary squared distance, so the spring energy is ½k(d<sub>a</sub><sup>2</sup> + d<sub>b</sub><sup>2</sup> + d<sub>c</sub><sup>2</sup>). The Cauchy–Schwarz inequality gives</p>
<p class="physical-equation">d<sub>a</sub><sup>2</sup> + d<sub>b</sub><sup>2</sup> + d<sub>c</sub><sup>2</sup> ≥ 4Δ<sup>2</sup>/(a<sup>2</sup> + b<sup>2</sup> + c<sup>2</sup>).</p>
<p>Equality holds exactly when d<sub>a</sub> : d<sub>b</sub> : d<sub>c</sub> = a : b : c, with all three distances positive. The corresponding area coordinates are a d<sub>a</sub> : b d<sub>b</sub> : c d<sub>c</sub> = a<sup>2</sup> : b<sup>2</sup> : c<sup>2</sup>. The squared-side characterization in this episode identifies that unique point as K. This proves a minimum over the whole plane.</p>
<p>The minimization is a known characterization of the symmedian point; see <a href="https://www.numdam.org/item/10.5802/crmath.677.pdf">Arnold and Arreche, Theorem 1</a>. The equal-spring model follows from that characterization and Hooke’s law.</p>
</details>`
  },
  gergonne: {
    title: 'The Gergonne point as an equilibrium inside the contact triangle',
    body: `<p>Let D, E, and F be the incircle’s contact points on BC, CA, and AB. Make the three sides of the smaller triangle DEF into rails. Join a free bead to three freely sliding, massless collars, one on each rail, by identical springs of zero natural length. Their unique equilibrium is the Gergonne point Ge of ABC.</p>
<p>This uses the same apparatus as the <a href="../symmedian/#alternate-interpretation">symmedian experiment</a>, now placed in the contact triangle. All three springs have the same stiffness; no special adjustment of their strengths is needed.</p>
${experiment('gergonne', 'Explore springs in the contact triangle', 'Move ABC and watch its incircle contact triangle change. Displace the bead inside the contact triangle. Its three equal springs balance at Ge; the original Gergonne cevians locate the same point.')}
<details class="physical-proof"><summary>Why these springs select Ge</summary>
<p>For any triangle, the symmedian argument proves that the sum of squared distances to its side lines has a unique minimum at its symmedian point. Apply that result to DEF. It remains to identify its symmedian point with Ge.</p>
<p>The lines AE and AF are tangents to the incircle, so AE = AF. If the incircle has radius r, a chord and its tangent satisfy d(D, AE) = DE<sup>2</sup>/(2r) and d(D, AF) = DF<sup>2</sup>/(2r). To see the first identity, put θ = ∠EID: the two sides are respectively r(1 − cos θ) and 2r<sup>2</sup>(1 − cos θ)/(2r). Consequently,</p>
<p class="physical-equation">[ADE]/[ADF] = DE<sup>2</sup>/DF<sup>2</sup>.</p>
<p>Here brackets denote triangle areas. If M = AD ∩ EF, the area ratio on the left also equals EM/MF. Thus AD has the squared-side ratio that characterizes the D-symmedian of DEF. The same argument at E and F proves that AD, BE, and CF meet at the symmedian point of DEF. Their intersection is Ge.</p>
<p>The angles of DEF are 90° − A/2, 90° − B/2, and 90° − C/2, so DEF is acute. Its symmedian point is interior, and its perpendicular feet lie on the actual side segments. The collars therefore need no rail extensions at equilibrium.</p>
<p>The identity “Gergonne point of ABC = symmedian point of DEF” is classical; see <a href="https://arxiv.org/pdf/2201.11159">Rabinowitz and Suppa, Property 2.1.7</a>. The spring interpretation follows from this identity. The proof does not depend on the measured positions in the diagram.</p>
</details>`
  },
  nagel: {
    title: 'The Nagel point as the meeting point of three perimeter-balancing cuts',
    body: `<p>Start two walkers at A. Let them follow the boundary at equal speed in opposite directions, without stopping at corners. They meet halfway around the perimeter, at a point D on BC. Draw AD. Repeat the experiment from B and C. The three segments meet at the Nagel point Na.</p>
<p>Each segment is a cut that divides the triangular sheet into two triangles with equal perimeters. For example, ABD and ACD have equal boundary lengths because the two routes from A to D have equal lengths and the new edge AD belongs to both pieces.</p>
${experiment('nagel', 'Explore the equal-speed perimeter walkers', 'Choose a starting vertex and start the two walkers together. Follow them to their meeting point on the opposite side, then compare the three resulting cuts. The walkers meet on the boundary; Na is the intersection of the cuts.')}
<details class="physical-proof"><summary>Why the three cuts meet at Na</summary>
<p>Write a = BC, b = CA, c = AB and s = (a + b + c)/2. Strict triangle inequalities give b &lt; s and c &lt; s, so the two walkers from A reach BC before meeting. Each has traveled s at their first meeting; hence</p>
<p class="physical-equation">BD = s − c, &nbsp; DC = s − b.</p>
<p>Put x = s − a, y = s − b, z = s − c. The cyclic experiments give BD/DC = z/y, CE/EA = x/z, and AF/FB = y/x. All six lengths are positive, and</p>
<p class="physical-equation">(BD/DC)(CE/EA)(AF/FB) = (z/y)(x/z)(y/x) = 1.</p>
<p>Ceva’s theorem proves concurrency. The excircle contact calculations in this episode give the same side lengths, so D, E, and F are precisely the opposite-side excircle contacts. Their cevians meet at Na.</p>
<p>This is the classical half-perimeter characterization, also called the splitter construction; see <a href="https://faculty.evansville.edu/ck6/tcenters/class/nagel.html">Clark Kimberling’s account of the Nagel point</a>. The walkers make the equal-length condition visible; Ceva establishes the concurrency.</p>
</details>`
  },
  orthocenter: {
    title: 'The orthocenter as a weighted-string equilibrium',
    body: `<p>For an <strong>acute triangle</strong>, put a frictionless pulley at each vertex. Tie three light, inextensible strings to a freely moving ring and pass one string over each pulley. Hang counterweights with masses proportional to the opposite side lengths: a = BC at A, b = CA at B, and c = AB at C. The ring’s unique equilibrium is the orthocenter H.</p>
<p>The acute hypothesis matters. For a right or obtuse triangle, this same apparatus minimizes its energy at the right or obtuse vertex. In the right case that vertex is H; in the obtuse case H is outside the triangle and is not the string equilibrium. A real apparatus needs a stop at the pulley to realize the limiting vertex position.</p>
${experiment('orthocenter', 'Explore the weighted strings', 'Move the triangle through acute, right, and obtuse shapes. Compare H with the energy-minimizing position of the ring. The model uses constant ideal tensions proportional to the opposite sides; hanging counterweights supply those tensions at rest. The conclusion changes when an angle reaches 90°.')}
<details class="physical-proof"><summary>Why H minimizes the weighted distances only in the stated cases</summary>
<p>As the ring moves, each hanging weight rises by the change in its string’s horizontal length. Apart from a positive common factor and a constant, the gravitational potential energy is</p>
<p class="physical-equation">F(P) = a · PA + b · PB + c · PC.</p>
<p>This function is strictly convex: equality in the convexity inequality for a distance to a fixed vertex would force that vertex and both proposed ring positions onto one line; equality for all three terms would force A, B, and C to be collinear. Thus an equilibrium, if found, is the unique global minimum.</p>
<p>When ABC is acute, H lies inside. Rotate the three directed side vectors BC, CA, AB by the same 90° toward the interior. The rotated vectors point along HA, HB, HC and have lengths a, b, c. Since the original three vectors add to zero, their rotations add to zero too. These are exactly the three tension vectors at H. Their sum vanishes, proving the minimum there.</p>
<p>Suppose instead that A ≥ 90°. At A, the combined pull of the B- and C-strings has squared magnitude</p>
<p class="physical-equation">b<sup>2</sup> + c<sup>2</sup> + 2bc cos A ≤ b<sup>2</sup> + c<sup>2</sup> − 2bc cos A = a<sup>2</sup>.</p>
<p>It can therefore be balanced by a tension of magnitude at most a at A. More formally, let <var>w</var> be that combined pull and let <var>u</var> = P − A. The supporting-line inequality for each distance gives F(P) − F(A) ≥ a|<var>u</var>| − <var>w</var> · <var>u</var> ≥ 0. Strict convexity gives the unique minimum at A. The cases at B and C are identical.</p>
<p>The weighted-distance characterization for acute triangles appears in <a href="https://www.tandfonline.com/doi/full/10.1080/00029890.2002.11919871">Gueron and Tessler, Proposition 1, p. 450</a>. The force balance and convexity argument here establish the precise domain used by the experiment.</p>
</details>
${rotating(2)}`
  },
  'nine-point-circle': {
    title: 'The nine-point center as the balance point of four equal masses',
    body: `<p>Place equal point masses at A, B, C, and the orthocenter H. Join them with a massless rigid framework. Its center of mass is the nine-point center N. Supporting the framework directly below N balances it in a uniform gravitational field.</p>
<p>This works for acute, right, and obtuse triangles. If H coincides with a vertex, place two masses at that position: coincident labels do not remove a mass.</p>
${experiment('nine-point', 'Explore the four equal masses', 'Move ABC and follow the fourth mass at H. Compare the center of mass of A, B, C, H with the midpoint of OH. They locate the same point N, even when H lies outside ABC.')}
<details class="physical-proof"><summary>Why four equal masses balance at N</summary>
<p>The center of mass of the four equal masses is (A + B + C + H)/4. The centroid satisfies A + B + C = 3G, and the Euler-line identity is 3G = 2O + H. Therefore</p>
<p class="physical-equation">(A + B + C + H)/4 = (2O + 2H)/4 = (O + H)/2 = N.</p>
<p>The nine-point-circle argument identifies its center as the midpoint of OH. The vector calculation proves that this circle center is also the physical balance point. No assumption about the acuteness of ABC enters the calculation.</p>
</details>
${rotating(1)}`
  },
  'nine-point-circle-altitudes': {
    title: 'The same circle has a four-mass balance point',
    body: `<p>The six points in the first nine-point-circle episode and the three altitude feet in this episode lie on one circle with center N. That center also balances four equal point masses placed at A, B, C, and H.</p>
<p>In position vectors, the Euler-line identity gives A + B + C = 3G = 2O + H. Hence the four-mass average is (A + B + C + H)/4 = (O + H)/2 = N. This remains true for right and obtuse triangles; if H is a vertex, two masses occupy that position.</p>
<p><a href="../nine-point-circle/#alternate-interpretation">Explore the four-mass balance and the rotating-spring experiment in Part I.</a></p>`
  },
  'euler-line': {
    title: 'The Euler line as a path of mechanical equilibria',
    body: `<p>The identity 3G = 2O + H makes the Euler line visible in a physical experiment. The following ideal apparatus uses three identical springs and one adjustable rotation speed. Its equilibrium passes through three familiar centers.</p>
${rotating(0)}`
  }
};

function hasInterpretation(slug) {
  return Object.prototype.hasOwnProperty.call(content, slug);
}

function renderInterpretation(slug) {
  if (!hasInterpretation(slug)) return '';
  const lesson = content[slug];
  return `${begin}
<section class="physical-interpretation" id="alternate-interpretation" aria-labelledby="alternate-interpretation-title">
<p class="kicker">Another way to see the center</p>
<h2 id="alternate-interpretation-title">${lesson.title}</h2>
${lesson.body}
<p class="physical-note">These are additional interpretations of the center proved above. The experiments use ideal physical laws; their numerical motion illustrates the arguments and does not replace them. Collinear vertices do not define the triangle centers used here.</p>
</section>
${end}`;
}

function interpretationAssets(slug, rev = '20261026-physical-v1') {
  if (!hasInterpretation(slug)) return {style: '', scripts: ''};
  const query = escape(encodeURIComponent(rev));
  return {
    style: `<link rel="stylesheet" href="../shared/physical.css?v=${query}">`,
    scripts: `<script src="../shared/physical-models.js?v=${query}"></script><script src="../shared/physical-demos.js?v=${query}"></script>`
  };
}

module.exports = {hasInterpretation, renderInterpretation, interpretationAssets, begin, end};
