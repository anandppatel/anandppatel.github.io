# Circle Geometry homework

This set has six problems, each with two parts. Draw a labeled diagram and explain the geometric facts used in each argument.

**These are the facts you may assume.** You may use [The Basics](https://anandppatel.github.io/proof-episodes/basics/), the previously established triangle-center facts, and the five [Circle Geometry episodes](https://anandppatel.github.io/proof-episodes/units/circle-geometry/): inscribed angles, the cyclic-quadrilateral criterion and its converse, power of a point, Ptolemy's theorem, and Brahmagupta's formula. You may use results proved in earlier problems. When a problem asks you to prove a statement, give an argument rather than citing that same statement.

All triangles are noncollinear. A cyclic quadrilateral is convex, with four distinct vertices named in boundary order. Lengths are ordinary positive lengths. The power of an interior point is negative, even though the product of its two chord lengths is positive. Areas are positive.

Try each part before opening its hints. The Markdown download and printed assignment include the hints and figures. The figures illustrate the configurations; the arguments must follow from the stated hypotheses.

## 1. Angles on one circle
*Use the [inscribed-angle](https://anandppatel.github.io/proof-episodes/inscribed-angles/) and [cyclic-quadrilateral](https://anandppatel.github.io/proof-episodes/cyclic-quadrilaterals/) episodes.*

Let \(ABCD\) be a cyclic quadrilateral with
\[
\angle BAC=25^\circ,\qquad \angle CAD=35^\circ.
\]

**(a)** Find \(\angle BCD\). Explain why the two given angles add to \(\angle BAD\).

**(b)** Find \(\angle BDC\) and \(\angle CBD\), naming the chord used in each comparison.

![A convex quadrilateral ABCD on a circle, with diagonals AC and BD.](https://anandppatel.github.io/proof-episodes/homework/circle-geometry/figures/inscribed-angles.svg "The vertices occur in the order A, B, C, D around the circle. Compare angles that subtend the same chord.")

### Hints

- **(a)** A diagonal lies inside the vertex angle of a convex quadrilateral. Then use the opposite angles of the quadrilateral.
- **(b)** Which given angle subtends chord \(BC\)? Which one subtends chord \(CD\)? Check that the vertices of each pair of compared angles lie on the same side of that chord.

## 2. A circle in the altitude configuration
*Use the [cyclic-quadrilateral criterion](https://anandppatel.github.io/proof-episodes/cyclic-quadrilaterals/) and the orthocenter facts.*

Let \(ABC\) be an acute triangle with orthocenter \(H\). Let \(D\) be the foot of the altitude from \(A\) on \(BC\), and let \(E\) be the foot of the altitude from \(B\) on \(CA\).

**(a)** Prove that \(C,D,H,E\) lie on one circle. Identify a diameter of this circle.

**(b)** Prove that
\[
\angle DEH=90^\circ-\angle ABC.
\]

![An acute triangle ABC with altitude feet D on BC and E on CA, and orthocenter H at the intersection of AD and BE. Segments DE and CH are drawn.](https://anandppatel.github.io/proof-episodes/homework/circle-geometry/figures/altitude-circle.svg "Use the two right angles in part (a), then compare angles subtending DH in part (b).")

### Hints

- **(a)** The acute-triangle assumption places the four distinct points in the convex order \(C,D,H,E\). Identify its two opposite right angles. Alternatively, apply Thales' theorem and its converse with diameter \(CH\).
- **(b)** Compare \(\angle DEH\) with \(\angle DCH\), then use \(CH\perp AB\).

## 3. Chords, secants, and a tangent
*Use [power of a point](https://anandppatel.github.io/proof-episodes/power-of-a-point/). The two parts describe separate configurations.*

**(a)** Chords \(AB\) and \(CD\) intersect at an interior point \(P\). Suppose \(PA=3\), \(PB=8\), and \(PC=4\). Find \(PD\) and the power of \(P\) with respect to the circle.

**(b)** From a point \(Q\) outside another circle, a secant meets the circle at \(A,B\), in that order, with \(QA=4\) and \(AB=5\). A second secant meets it at \(C,D\), in that order, with \(QC=3\). A tangent from \(Q\) touches the circle at \(T\). Find \(QT\) and \(CD\).

![Two separate circle configurations: intersecting chords through an interior point P, and two secants and a tangent through an exterior point Q.](https://anandppatel.github.io/proof-episodes/homework/circle-geometry/figures/power-configurations.svg "For an exterior secant, measure both factors from Q. For an interior point, distinguish the positive chord product from the signed power.")

### Hints

- **(a)** Equate the products of the two chord segments. The sign of the power is determined by the location of \(P\).
- **(b)** First find the whole length \(QB\). Use the same power for the tangent and for the second secant; the required length \(CD\) is only part of \(QD\).

## 4. Two applications of Ptolemy
*Use [Ptolemy's theorem](https://anandppatel.github.io/proof-episodes/ptolemy/).*

**(a)** Let \(ABCD\) be a rectangle with side lengths \(a,b\) and diagonal length \(p\). Explain why the rectangle is cyclic, and use Ptolemy's theorem to prove \(p^2=a^2+b^2\).

**(b)** Let \(ABC\) be an equilateral triangle, and let \(P\) lie strictly inside the arc \(BC\) of its circumcircle that does not contain \(A\). Draw the configuration and prove
\[
PA=PB+PC.
\]

### Hints

- **(a)** The opposite angles are supplementary. Congruence gives equal diagonal lengths; substitute the four side lengths in Ptolemy's formula.
- **(b)** Name the cyclic quadrilateral in boundary order. All three sides of \(ABC\) have the same length, so a common factor will cancel.

## 5. Area and the cyclicity hypothesis
*Use [Brahmagupta's formula](https://anandppatel.github.io/proof-episodes/brahmagupta/).*

**(a)** A cyclic quadrilateral has consecutive side lengths \(4,5,6,7\). Find its area exactly.

**(b)** A square and a non-square rhombus both have all four side lengths equal to \(5\). Compare their areas and explain why Brahmagupta's formula cannot be used for arbitrary quadrilaterals. You do not need to choose a particular angle for the rhombus.

### Hints

- **(a)** Compute the semiperimeter and the four factors before taking the square root.
- **(b)** Compare the height of the non-square rhombus with its side length. What area would the four side lengths alone give if you applied the cyclic formula?

## 6. The largest area with a fixed perimeter
*Use [Brahmagupta's formula](https://anandppatel.github.io/proof-episodes/brahmagupta/), the cyclic-quadrilateral criterion, and elementary algebra.*

Let \(ABCD\) be a cyclic quadrilateral with perimeter \(20\), side lengths \(a,b,c,d\), and area \(K\). Put
\[
x=10-a,\quad y=10-b,\quad z=10-c,\quad w=10-d.
\]
These four numbers are positive: each side of a nondegenerate convex quadrilateral is shorter than the sum of the other three.

**(a)** Prove that \(K\leq25\). You may use
\[
uv\leq\left(\frac{u+v}{2}\right)^2
\]
for positive \(u,v\); it follows from \((u-v)^2\geq0\), with equality exactly when \(u=v\).

**(b)** Prove that equality holds if and only if \(ABCD\) is a square of side length \(5\).

### Hints

- **(a)** First bound \(xy\) and \(zw\), then apply the same inequality to \(x+y\) and \(z+w\). Use their fixed sum and Brahmagupta's formula.
- **(b)** Track equality in all three inequalities. A rhombus has equal opposite angles; what does cyclicity then force those angles to be?
