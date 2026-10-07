# Triangle Geometry: Homework

Throughout, \(ABC\) is a noncollinear triangle, and \([XYZ]\) denotes the area of triangle \(XYZ\). Write \(G,O,H,I\) for the centroid, circumcenter, orthocenter, and incenter.

You may use [The Basics](https://anandppatel.github.io/proof-episodes/basics/), the results of the episodes linked with each problem, and results established in earlier problems. When asked to prove a statement, give its argument rather than simply citing that statement.

Use the interactive diagrams to investigate. Your written solution should explain why the conclusion holds.

Try each part before opening its hints. The web page has optional hints below every problem; the Markdown download and printed set include all hints and figures. The diagrams show sample configurations, and a triangle need not have the same shape as the one drawn.

## 1. An area test for the centroid
*From the [centroid episode](https://anandppatel.github.io/proof-episodes/centroid/).*

**(a)** Let \(D\) be the midpoint of \(BC\). Use \(AG=2GD\), equal bases, and common heights to prove
\[
[GAB]=[GBC]=[GCA].
\]

**(b)** Now let \(P\) be any point strictly inside \(ABC\). The ray \(AP\) meets \(BC\) at an interior point \(X\), with \(A,P,X\) in that order. Prove
\[
\frac{[PAB]}{[PCA]}=\frac{BX}{XC}.
\]

**(c)** Deduce that
\[
[PAB]=[PBC]=[PCA]
\quad\Longleftrightarrow\quad
P=G.
\]
For the reverse direction, explain why equal areas put \(P\) on two medians.

![Triangle ABC with interior point P on segment AX, X on BC, and segments PB and PC dividing the triangle into smaller regions.](https://anandppatel.github.io/proof-episodes/homework/triangle-geometry/figures/area-comparison.svg "For part (b): compare triangles using bases along AX, then along BC.")

### Hints

- **(a)** First compare \([GAB]\) with \([GDB]\), then compare \([GDB]\) with \([GDC]\).
- **(b)** Compare triangles \(PAB\) and \(PXB\) using bases on \(AX\), then make the corresponding comparison from \(C\).
- **(c)** Apply part (b) at \(A\), then repeat it at \(B\); a ratio of \(1\) identifies a midpoint.

## 2. When does a median contain the circumcenter?
*From the [circumcenter](https://anandppatel.github.io/proof-episodes/circumcenter/) and [Thales](https://anandppatel.github.io/proof-episodes/thales/) episodes.*

Let \(D\) be the midpoint of \(BC\).

**(a)** Suppose \(AB=AC\). Use the perpendicular-bisector characterization to prove that \(O\) lies on the line \(AD\).

**(b)** Conversely, suppose \(O\) lies on \(AD\) and \(O\neq D\). Prove that \(AB=AC\). Explain where the assumption \(O\neq D\) enters.

**(c)** Show that this assumption cannot be omitted. Consider a triangle with a right angle at \(A\) and unequal legs \(AB\) and \(AC\). Locate its circumcenter and explain why it gives a counterexample.

### Hints

- **(a)** Use \(AB=AC\) to place \(A\) on a perpendicular bisector; \(D\) is another point of that line.
- **(b)** Both \(O\) and \(D\) lie on the perpendicular bisector of \(BC\); why do they determine this line when \(O\neq D\)?
- **(c)** Apply the converse to Thales’ theorem with \(BC\) as diameter, then compare the circle’s center with \(D\).

## 3. The orthocenter of the midpoint triangle
*From the [orthocenter](https://anandppatel.github.io/proof-episodes/orthocenter/) and [circumcenter](https://anandppatel.github.io/proof-episodes/circumcenter/) episodes; use C3 and the parallel-line facts.*

Let \(D,E,F\) be the midpoints of \(BC,CA,AB\), respectively.

**(a)** Use a dilation centered at \(A\), with factor \(1/2\), to prove \(EF\parallel BC\). Obtain the other two corresponding parallelisms. Explain why \(D,E,F\) are distinct and noncollinear.

**(b)** Show that the altitude line from \(D\) in triangle \(DEF\) is precisely the perpendicular bisector of \(BC\).

**(c)** Repeat the argument at \(E\) and \(F\). Deduce that the circumcenter \(O\) of \(ABC\) is the orthocenter of \(DEF\).

![Triangle ABC with D, E, F at the midpoints of BC, CA, AB, joined to form triangle DEF.](https://anandppatel.github.io/proof-episodes/homework/triangle-geometry/figures/midpoint-triangle.svg "The side midpoints form triangle DEF. Follow the images of B and C under the dilation centered at A.")

### Hints

- **(a)** Track the images of \(B,C\) under the dilation; to rule out collinearity, compare two midpoint lines with two different sidelines of \(ABC\).
- **(b)** Which line through \(D\) is perpendicular to \(EF\), and how does part (a) relate \(EF\) to \(BC\)?
- **(c)** A point on all three original perpendicular bisectors lies on which three lines of \(DEF\)?

## 4. Finding the inradius by adding areas
*From the [incenter episode](https://anandppatel.github.io/proof-episodes/incenter/) and C4.*

Let \(r\) be the inradius, and write
\[
a=BC,\qquad b=CA,\qquad c=AB,\qquad
s=\frac{a+b+c}{2}.
\]

**(a)** Draw the perpendiculars from \(I\) to the three sides. Express \([IAB]\), \([IBC]\), and \([ICA]\) in terms of \(a,b,c,r\).

**(b)** Explain why these three triangles partition \(ABC\), and prove
\[
[ABC]=rs.
\]

**(c)** Suppose \(BC=14\), \(CA=15\), \(AB=13\), and the altitude from \(A\) to \(BC\) has length \(12\). Find the inradius and the areas \([IAB]\), \([IBC]\), and \([ICA]\).

![Triangle ABC divided by segments from incenter I to the vertices, with three perpendicular segments of length r from I to the sides.](https://anandppatel.github.io/proof-episodes/homework/triangle-geometry/figures/inradius-areas.svg "Join I to the vertices and draw the three perpendicular heights. This is a sample configuration for parts (a) and (b).")

### Hints

- **(a)** Use \(AB\) as the base of \(IAB\), and remember that its corresponding height is \(r\).
- **(b)** Use the fact that \(I\) is inside the triangle, then add the three area expressions from part (a).
- **(c)** Find the whole triangle’s area first, then use part (b) to recover \(r\) before computing the smaller areas.

## 5. Four points on the Euler line
*From the [Euler-line episode](https://anandppatel.github.io/proof-episodes/euler-line/).*

Suppose \(ABC\) is not equilateral, and let \(N\) be the midpoint of \(OH\).

**(a)** The episode constructs \(X\) on the ray opposite \(\overrightarrow{GO}\), with \(GX=2GO\), and uses similar triangles to prove \(X=H\). Explain why \(G\) lies between \(O\) and \(H\), with \(GH=2GO\).

**(b)** Determine the order of \(O,G,N,H\) along their common line. Prove
\[
GN=\frac12GO,\qquad HN=3GN.
\]

**(c)** Describe how to construct \(H\) and \(N\) when the distinct points \(O\) and \(G\) are already marked.

**(d)** What changes when \(ABC\) is equilateral? Explain why the four centers then determine no unique line.

### Hints

- **(a)** Translate “opposite ray” into an order statement, then replace \(X\) with \(H\).
- **(b)** Take \(GO\) as a unit length; locate the midpoint of \(OH\) before subtracting segment lengths.
- **(c)** Use the ray from \(G\) opposite \(\overrightarrow{GO}\), then take a segment midpoint.
- **(d)** Begin with \(O=G=H\), and apply the definition of \(N\).

## 6. Does a \(2:1\) ratio identify the centroid?
*From the [angle-bisector](https://anandppatel.github.io/proof-episodes/angle-bisector/), [incenter](https://anandppatel.github.io/proof-episodes/incenter/), and [centroid](https://anandppatel.github.io/proof-episodes/centroid/) episodes.*

Let the internal angle bisector from \(A\) meet \(BC\) at \(D\).

**(a)** Explain why \(I\) lies strictly between \(A\) and \(D\). Using common heights, prove
\[
\frac{[ABI]}{[DBI]}=\frac{AI}{ID},
\qquad
\frac{[ACI]}{[DCI]}=\frac{AI}{ID}.
\]

**(b)** Add the corresponding area equations from part (a). Then use the equal perpendicular distances from \(I\) to the three side lines to prove
\[
\frac{AI}{ID}=\frac{AB+AC}{BC}.
\]

**(c)** Suppose \(AB=5\), \(AC=7\), and \(BC=6\). Find \(BD\), \(DC\), and \(AI:ID\). Prove that \(I\neq G\), despite the ratio you obtain.

Explain what is missing from the claim: “A point dividing a segment from a vertex in the ratio \(2:1\) must be the centroid.”

### Hints

- **(a)** Use the interior position of \(I\) on \(AD\); for the area comparisons, choose bases \(AI\) and \(ID\).
- **(b)** Call the common ratio \(k\). Write each numerator area as \(k\) times its denominator area before adding; then use the common inradius.
- **(c)** Use the angle-bisector ratio to locate \(D\); compare it with the midpoint of \(BC\) before interpreting \(AI:ID\).

## 7. Constructing an altitude foot with two circles
*From [Thales’ theorem and its converse](https://anandppatel.github.io/proof-episodes/thales/) and C1.*

Draw the circles with diameters \(AB\) and \(AC\). Let \(D\) be the perpendicular foot from \(A\) to the **full line** \(BC\).

**(a)** First suppose \(D\neq B,C\). Prove that \(D\) lies on both circles.

**(b)** Prove the same conclusion when \(D=B\) or \(D=C\). Identify the right angle of \(ABC\) in each case.

**(c)** Suppose \(P\neq A\) lies on both circles. Prove \(P=D\). Handle \(P=B\) or \(P=C\) separately; otherwise, use Thales’ theorem and uniqueness of a perpendicular through \(P\).

Conclude that the circles meet at exactly \(A\) and \(D\), including when the altitude foot lies outside segment \(BC\).

![An obtuse triangle ABC and circles with diameters AB and AC. The perpendicular foot D from A lies beyond B on the full line BC.](https://anandppatel.github.io/proof-episodes/homework/triangle-geometry/figures/two-diameter-circles.svg "An obtuse example: D lies on the extension of BC. Also consider the endpoint cases in part (b).")

### Hints

- **(a)** The perpendicular at \(D\) gives two right triangles; apply the converse to Thales’ theorem to each.
- **(b)** A diameter endpoint already lies on its circle; use the triangle’s right angle for the other circle.
- **(c)** Handle the diameter endpoints first; otherwise compare the lines \(PB\) and \(PC\), both perpendicular to \(AP\).

## 8. A second construction of the midpoint circle
*Inspired by the [Euler-line relation](https://anandppatel.github.io/proof-episodes/euler-line/) and the dilation in the [nine-point-circle proof](https://anandppatel.github.io/proof-episodes/nine-point-circle/).*

Let \(D,E,F\) be the side midpoints, \(R\) the circumradius, and \(N\) the midpoint of \(OH\). Consider the transformation \(T\) consisting of a half-turn about \(G\), followed by a dilation of factor \(1/2\) about \(G\).

Use the centroid theorem, Problem 5, and C2–C3; do not assume the nine-point-circle theorem in this problem.

**(a)** Prove
\[
T(A)=D,\qquad T(B)=E,\qquad T(C)=F.
\]

**(b)** Prove \(T(O)=N\). Explain separately why this holds when \(ABC\) is equilateral.

**(c)** Deduce that the circumcircle of \(DEF\) has center \(N\) and radius \(R/2\). Also determine \([DEF]/[ABC]\).

### Hints

- **(a)** Locate each side midpoint on its median, and use the centroid’s ratio to track the half-turn and dilation.
- **(b)** Use the order and lengths from Problem 5; in the equilateral case, remember that both the half-turn and the dilation fix their center.
- **(c)** Track the image circle’s center and radius; for the area ratio, track a base and its corresponding height.

## 9. Reflecting the orthocenter onto the circumcircle
*An extension of [nine-point-circle Part I](https://anandppatel.github.io/proof-episodes/nine-point-circle/) and [Part II](https://anandppatel.github.io/proof-episodes/nine-point-circle-altitudes/).*

Let \(A_1\) be the altitude foot from \(A\) on the full line \(BC\), and let \(H'\) be the reflection of \(H\) across that line. Prove that \(H'\) lies on the circumcircle of \(ABC\).

**(a)** If \(H\neq A_1\), prove that \(A_1\) is the midpoint of \(HH'\). What is \(H'\) when \(H=A_1\)?

**(b)** Let \(S\) be the dilation centered at \(H\) with factor \(2\). Recall that the nine-point circle has center \(N\), the midpoint of \(HO\), and radius \(R/2\). Prove that \(S\) sends this circle onto the circumcircle.

**(c)** Part II places \(A_1\) on the nine-point circle. Identify \(S(A_1)\) and finish the proof. Explain why the argument remains valid when \(H=A_1\).

![An acute triangle ABC, its orthocenter H on the altitude through A, the foot A₁ on BC, and the reflection H′ across line BC.](https://anandppatel.github.io/proof-episodes/homework/triangle-geometry/figures/reflected-orthocenter.svg "A sample acute triangle, with altitude foot A₁ and reflected point H′.")

### Hints

- **(a)** Use the perpendicular-midpoint property of reflection; a point on the mirror line stays fixed.
- **(b)** Where does \(S\) send the midpoint \(N\) of \(HO\), and how does it change the radius?
- **(c)** Compare part (a) with the definition of \(S\); if \(A_1=H\), use the fixed point of the dilation.

## 10. Ceva’s theorem and the areas around the intersection
*From the [Ceva episode](https://anandppatel.github.io/proof-episodes/ceva/).*

Let \(D\) and \(E\) lie strictly inside \(BC\) and \(CA\), respectively, with
\[
\frac{BD}{DC}=2,\qquad \frac{CE}{EA}=3.
\]

**(a)** Determine the ratio \(AF/FB\) for which an interior point \(F\) of \(AB\) makes \(AD,BE,CF\) concurrent. Explain why there is exactly one such \(F\).

**(b)** Let \(P\) be their common point, and put
\[
x=[PAB],\qquad y=[PBC],\qquad z=[PCA].
\]
Use the common-height comparisons from the proof of Ceva to determine \(x:y:z\). Identify the triangles compared at each step.

**(c)** If \([ABC]=54\), find each of the three areas \(x,y,z\).

![Concurrent segments AD, BE, CF meet at P, with D on BC and E on CA in the given ratios. Regions PAB, PBC, PCA carry the area labels x, y, z.](https://anandppatel.github.io/proof-episodes/homework/triangle-geometry/figures/ceva-areas.svg "The same configuration is used in all three parts; x, y, z label areas, not lengths.")

### Hints

- **(a)** Insert the two given ratios into Ceva’s product; for uniqueness, express \(AF\) and \(FB\) as complementary parts of the fixed length \(AB\).
- **(b)** Use Problem 1(b) first with the ray \(AP\) and then with \(BP\), keeping track of the order of the areas.
- **(c)** The three triangles partition \(ABC\); use their ratio to divide the total area.
