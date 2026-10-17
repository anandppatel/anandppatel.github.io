# Triangle Geometry II: Cevians, Tangency, and Area

Throughout, \(ABC\) is a noncollinear triangle. Write \(a=BC\), \(b=CA\), \(c=AB\), \(s=(a+b+c)/2\), and \(\Delta=[ABC]\). All side points in the Ceva problems lie strictly inside their sides. Angles are ordinary interior angles, and all lengths and areas are positive.

You may use [The Basics](https://anandppatel.github.io/proof-episodes/basics/), [ordinary Ceva](https://anandppatel.github.io/proof-episodes/ceva/), the episodes linked below, and earlier problems in this set. When a problem asks you to establish a result from an episode, reconstruct its argument rather than citing the result itself. The sine-area formula and the identity \(\sin(180^\circ-\theta)=\sin\theta\) are explained in Episode 11.

Write \(K\) for the symmedian point, \(N_a\) for the Nagel point, and \(G_e\) for the Gergonne point. Here \(N_a\) names the Nagel point; it is not the nine-point center \(N\). Write \(I\) for the incenter, \(r\) for the inradius, and \(I_A,r_A\) for the center and radius of the excircle opposite \(A\).

Try each part before opening its hints. Each hint suggests a first step and a further comparison if needed. The Markdown download and printed set include all hints and figures. Drawings show sample configurations; your argument must cover every triangle allowed by the hypotheses.

## 1. Turn a side ratio into an angle ratio
*From [trigonometric Ceva](https://anandppatel.github.io/proof-episodes/trig-ceva/).*

Let \(D\) lie strictly inside \(BC\).

**(a)** Use a common height to express \([ABD]/[ACD]\) in terms of \(BD\) and \(DC\).

**(b)** Compute those same two areas using \(\tfrac12uv\sin\theta\). Prove
\[
\frac{BD}{DC}=\frac{AB}{AC}\frac{\sin\angle BAD}{\sin\angle DAC}.
\]
Explain why the sine-area formula still applies if one of the displayed angles is obtuse.

**(c)** Write the corresponding identities for \(E\in CA\) and \(F\in AB\), in the cyclic orders \(CE/EA\) and \(AF/FB\).

**(d)** Multiply the identities and use ordinary Ceva to prove both directions of trigonometric Ceva. Explain why every denominator is nonzero.

![Triangle ABC with interior side points D, E, F and their three cevians. The angles BAD and DAC are marked at A.](https://anandppatel.github.io/proof-episodes/homework/cevians-and-area/figures/trig-ceva.svg "The two triangles on either side of AD share a height from A to BC.")

### Hints

- **(a)** Use bases \(BD\) and \(DC\) on the same line. Their common perpendicular height cancels in the ratio, even if its foot is outside the side.
- **(b)** Use sides \(AB,AD\) for the first area and \(AC,AD\) for the second. Cancel \(AD/2\); for an obtuse angle, its supplementary acute angle gives the same perpendicular height and sine.
- **(c)** Replace \(A,B,C,D\) successively by \(B,C,A,E\) and \(C,A,B,F\). Keep the angle next to the numerator side in the numerator sine.
- **(d)** Group the three side-length factors before cancelling. The resulting equality identifies the entire sine product with the ordinary Ceva product, so the equivalence follows in both directions; each split angle lies strictly between \(0^\circ\) and \(180^\circ\).

## 2. Reflect a concurrent family of cevians
*From [trigonometric Ceva](https://anandppatel.github.io/proof-episodes/trig-ceva/), preparing for the [symmedian episode](https://anandppatel.github.io/proof-episodes/symmedian/).*

Suppose \(AD,BE,CF\) meet at an interior point \(P\). Reflect each cevian ray across the internal angle bisector at its vertex; let the reflected rays meet the opposite sides at \(D',E',F'\).

**(a)** Explain why the reflected rays still lie strictly inside their vertex angles and therefore meet the opposite sides at interior points. Identify the two angles at \(A\) that reflection exchanges.

**(b)** Show that the sine ratio for \(AD'\) is the reciprocal of the sine ratio for \(AD\), and obtain the two cyclic statements.

**(c)** Use trigonometric Ceva to show that \(AD',BE',CF'\) meet at a unique interior point \(Q\).

**(d)** Repeat this construction starting with \(Q\). Prove that the resulting point is \(P\). Explain why \(I\) stays fixed under this construction.

### Hints

- **(a)** Reflection interchanges the two sides of the vertex angle and preserves angles between rays. A ray strictly between the sides crosses the opposite side of the triangle; use the convexity of the triangle.
- **(b)** Write the two exchanged angles before taking their sines. The numerator for the original ray becomes the denominator for its reflection.
- **(c)** Multiply the three reciprocal ratios. A reciprocal of a product equal to \(1\) is again \(1\); interior Ceva supplies concurrence, and the first two cevians determine its point.
- **(d)** A reflection performed twice is the identity. Apply this separately at all three vertices; for \(I\), each ray is itself an internal angle bisector and hence stays fixed under the corresponding reflection.

## 3. Recognize a symmedian from a squared ratio
*From the [symmedian episode](https://anandppatel.github.io/proof-episodes/symmedian/).*

Let \(M\) be the midpoint of \(BC\), and let \(AD\) be the reflection of the median ray \(AM\) across the internal angle bisector at \(A\).

**(a)** Apply Problem 1 to \(AM\) to find \(\sin\angle BAM/\sin\angle MAC\) in terms of \(AB,AC\).

**(b)** Reflect the two angles and apply Problem 1 again to prove
\[
\frac{BD}{DC}=\left(\frac{AB}{AC}\right)^2.
\]

**(c)** Prove the converse: an interior cevian satisfying this squared ratio is the symmedian. Use uniqueness of a point dividing a fixed segment in a prescribed positive ratio.

**(d)** Suppose \(AB=5\), \(AC=7\), and \(BC=6\). Find \(BD\) and \(DC\), and compare \(D\) with the median foot and the angle-bisector foot. Give their order from \(B\) to \(C\).

![A median AM, an internal angle bisector, and its reflected ray AD in triangle ABC. M is the midpoint of BC.](https://anandppatel.github.io/proof-episodes/homework/cevians-and-area/figures/symmedian.svg "Reflection across the dashed internal bisector exchanges the median and symmedian rays.")

### Hints

- **(a)** The left side of Problem 1's identity is \(BM/MC=1\). Solve for the sine ratio, paying attention to which side length moves to the other side.
- **(b)** Reflection interchanges the two angles, so it reciprocates the sine ratio from part (a). The side-length factor in Problem 1 remains \(AB/AC\).
- **(c)** The reflected median already supplies one point with the required ratio. If \(BD/DC=k\), use \(BD+DC=BC\) to show that \(BD\), and hence \(D\), is determined uniquely.
- **(d)** Use the ratios \(25:49\), \(1:1\), and \(5:7\) for the symmedian, median, and bisector. Convert each ratio into its fraction of the total length measured from \(B\) before comparing positions.

## 4. Areas and distances around the symmedian point
*From the [symmedian episode](https://anandppatel.github.io/proof-episodes/symmedian/).*

Let the three symmedians meet at \(K\). Put \(U=[KBC]\), \(V=[KCA]\), and \(W=[KAB]\).

**(a)** If \(AK\) meets \(BC\) at \(D\), prove \(W/V=BD/DC\) by comparing areas with common heights. You may use Problem 1(b) of the [first homework set](https://anandppatel.github.io/proof-episodes/homework/triangle-geometry/#problem-1), with its justification.

**(b)** Use the three squared side ratios to prove
\[
U:V:W=a^2:b^2:c^2.
\]

**(c)** Let \(h_a,h_b,h_c\) be the perpendicular distances from \(K\) to the lines \(BC,CA,AB\). Deduce \(h_a:h_b:h_c=a:b:c\).

**(d)** Prove that \(K=I\) if and only if \(ABC\) is equilateral. Explain both implications.

### Hints

- **(a)** First compare \([KAB]\) with \([KDB]\), using bases \(AK,KD\); repeat from \(C\). Then compare \([KDB]\) with \([KDC]\), whose bases lie on \(BC\).
- **(b)** Part (a) and Problem 3 give one ratio between \(W\) and \(V\). Repeat cyclically, then check the order of \(U,V,W\) against the opposite sides \(a,b,c\).
- **(c)** Write \(U=ah_a/2\), and write the two corresponding formulas. Dividing the area ratios by the base-length ratios removes one power of each side length.
- **(d)** If \(K=I\), its three distances to the sides are equal, so use part (c). Conversely, in an equilateral triangle every median is also an angle bisector and is fixed by reflection in that bisector.

## 5. Where an excircle touches
*From the [Nagel episode](https://anandppatel.github.io/proof-episodes/nagel/).*

The excircle opposite \(A\) touches \(BC\) at \(T\), the ray \(AB\) beyond \(B\) at \(V\), and the ray \(AC\) beyond \(C\) at \(U\). You may use the episode's construction of this excircle and the stated positions of its contact points.

**(a)** Use equal tangent lengths from one point to show \(AV=AU\), \(BV=BT\), and \(CU=CT\).

**(b)** Put \(AV=AU=\ell\). Express \(BT\) and \(CT\) in terms of \(\ell,b,c\), and use \(BT+CT=a\) to prove \(\ell=s\).

**(c)** Deduce \(BT=s-c\) and \(CT=s-b\). Explain how these differ from the corresponding incircle contact lengths \(s-b\) and \(s-c\).

**(d)** If \(a=13,b=14,c=15\), find \(BT,CT,BV,CU,AV\). Explain why the triangle inequalities ensure that both pieces of \(BC\) are positive for every noncollinear triangle.

![The excircle opposite A touches BC at T and the extensions of AB and AC at V and U. Its center is I_A.](https://anandppatel.github.io/proof-episodes/homework/cevians-and-area/figures/excircle.svg "The two extended sides and the three tangent points are part of the configuration.")

### Hints

- **(a)** Group the tangent segments by their common external point: first \(A\), then \(B\), then \(C\). A contact with a side extension still lies on the same tangent line.
- **(b)** The orders are \(A,B,V\) and \(A,C,U\). Subtract \(AB=c\) from \(AV\), and \(AC=b\) from \(AU\); then add the two lengths on \(BC\).
- **(c)** Substitute the value of \(\ell\) from part (b). For the incircle, write the three vertex tangent lengths and solve the three equations expressing \(a,b,c\) as their pairwise sums.
- **(d)** Calculate \(s\) first, and reuse parts (a)–(c). For positivity, write \(s-b=(a+c-b)/2\) and \(s-c=(a+b-c)/2\).

## 6. Build the Nagel point with Ceva
*From the [Nagel episode](https://anandppatel.github.io/proof-episodes/nagel/).*

Let \(T_A,T_B,T_C\) be the contacts of the three excircles with their respective opposite sides \(BC,CA,AB\).

**(a)** Use Problem 5 cyclically to express \(BT_A/T_AC\), \(CT_B/T_BA\), and \(AT_C/T_CB\) in terms of \(s-a,s-b,s-c\).

**(b)** Multiply the ratios and prove that \(AT_A,BT_B,CT_C\) have a unique common point \(N_a\) inside \(ABC\).

**(c)** For \(a=13,b=14,c=15\), find the three ratios in part (a). Check their product without using rounded decimals.

**(d)** Prove that \(AT_A\) is a median exactly when \(AB=AC\). In an isosceles triangle with \(AB=AC\), explain why \(N_a\) lies on its symmetry axis.

### Hints

- **(a)** Keep the boundary order \(B\to C\to A\to B\). Write the numerator and denominator tangent lengths separately before making each fraction.
- **(b)** Each of the three positive quantities should occur once above and once below the fraction bar. Apply the interior version of Ceva, and use the intersection of the first two cevians for uniqueness.
- **(c)** List \(s-a,s-b,s-c\) first. Keep fractions exact so that the cancellation in their product remains visible.
- **(d)** A median foot has equal distances to \(B\) and \(C\). Substitute the two lengths from Problem 5; in the isosceles case, the median from \(A\) is the symmetry axis and contains the common point.

## 7. Build the Gergonne point with Ceva
*From the [Gergonne episode](https://anandppatel.github.io/proof-episodes/gergonne/).*

Let the incircle touch \(BC,CA,AB\) at \(D,E,F\), respectively, and write \(x=AF=AE\), \(y=BD=BF\), and \(z=CD=CE\).

**(a)** Write the three side lengths in terms of \(x,y,z\). Solve for \(x,y,z\) in terms of \(s,a,b,c\).

**(b)** Express \(BD/DC\), \(CE/EA\), and \(AF/FB\) in terms of \(x,y,z\). Prove that \(AD,BE,CF\) meet at a unique interior point \(G_e\).

**(c)** Suppose the tangent lengths from \(A,B,C\) are \(4,3,2\). Find the side lengths and the three Ceva ratios, and check the product.

**(d)** Is \(IG_e\) necessarily a nonzero segment? Analyze an equilateral triangle and justify the position of \(G_e\).

![The incircle has contacts D, E, F with BC, CA, AB, and the three contact cevians meet at the Gergonne point G_e.](https://anandppatel.github.io/proof-episodes/homework/cevians-and-area/figures/gergonne.svg "Keep the contact cevians separate from the angle bisectors that construct the incenter.")

### Hints

- **(a)** Each side is the sum of two tangent lengths. Add the three equations to express \(s\), then subtract one side at a time.
- **(b)** Follow the boundary order from the preceding problem. Each of \(x,y,z\) appears once in a numerator and once in a denominator, so interior Ceva applies.
- **(c)** Use the sums from part (a), with the letters attached to their vertices. The three fractions should cancel before you perform any decimal division.
- **(d)** Equal side lengths force equal vertex tangent lengths. Locate the contact points, identify their cevians, and compare their concurrence point with the incenter.

## 8. Compare the two contact constructions
*From the [Nagel](https://anandppatel.github.io/proof-episodes/nagel/) and [Gergonne](https://anandppatel.github.io/proof-episodes/gergonne/) episodes.*

Use \(D,E,F\) for the incircle contacts and \(T_A,T_B,T_C\) for the opposite excircle contacts.

**(a)** Prove that \(D\) and \(T_A\) are reflections of one another across the midpoint of \(BC\). Obtain the two cyclic statements.

**(b)** Deduce that the three Nagel side ratios are the reciprocals of the three Gergonne side ratios, in the same cyclic order. Explain directly why one product is \(1\) exactly when the other is \(1\).

**(c)** Suppose \(N_a=G_e\). Explain why \(D=T_A\), then deduce \(b=c\). Repeat at another vertex to prove that \(ABC\) is equilateral.

**(d)** Prove the converse: in an equilateral triangle, \(N_a=G_e=G=I\). State precisely why the shared point is the centroid.

### Hints

- **(a)** Compare \(BD,DC\) with \(BT_A,T_AC\) using Problems 5 and 7. Reflection in the midpoint reverses the two distances to the segment's endpoints.
- **(b)** Reversing numerator and denominator reciprocates a positive ratio. Multiply the three reciprocals together before invoking any concurrence theorem.
- **(c)** The common center is interior and hence different from \(A\); one line through \(A\) and that center meets \(BC\) in only one point. Equal feet have both the incircle and excircle contact-length descriptions.
- **(d)** All six contacts are side midpoints in this case. The three contact cevians are therefore medians, and an equilateral triangle's medians are also its internal angle bisectors.

## 9. Reconstruct Venema’s proof of Heron’s formula
*From the [Heron episode](https://anandppatel.github.io/proof-episodes/heron/), following Venema, §4.5, Figure 4.4 on printed p. 44 and Exercises 4.5.1–4.5.7 on printed p. 45 (PDF viewer pp. 61–62). The questions below are an adaptation of that proof sequence.*

The incircle touches \(BC,CA,AB\) at \(X,Y,Z\); the excircle opposite \(A\) touches the corresponding sidelines at \(T,U,V\), with \(U\) beyond \(C\) and \(V\) beyond \(B\). Write \(E=I_A\) for the excenter in this problem, as in Venema’s figure.

**(a)** By adding the areas of \(IAB,IBC,ICA\), prove \(\Delta=sr\). Use equal tangent lengths to obtain \(AZ=s-a\), \(BZ=s-b\), \(BV=s-c\), and \(AV=s\).

**(b)** Prove that right triangles \(AZI\) and \(AVE\) are similar, with the correspondence \(A\leftrightarrow A\), \(Z\leftrightarrow V\), \(I\leftrightarrow E\). Deduce
\[
\frac{r_A}{s}=\frac{r}{s-a}.
\]

**(c)** Explain why the internal bisector \(BI\) and external bisector \(BE\) are perpendicular. Prove \(\triangle ZBI\sim\triangle VEB\), in the displayed vertex order, and deduce
\[
\frac{s-b}{r}=\frac{r_A}{s-c}.
\]

**(d)** Eliminate \(r_A\) from parts (b)–(c), use \(\Delta=sr\), and prove
\[
\Delta=\sqrt{s(s-a)(s-b)(s-c)}.
\]
Explain why the positive square root is the one required.

![The incircle and A-excircle of triangle ABC, with centers I and E, and contact points Z and V on the full line AB. The similar right triangles AZI, AVE, ZBI, VEB use this configuration.](https://anandppatel.github.io/proof-episodes/homework/cevians-and-area/figures/heron.svg "The right triangles at A compare the inradius with the exradius; the right triangles at B provide a second relation.")

### Hints

- **(a)** The three smaller triangles have height \(r\) to their respective side bases. Reuse the tangent-length calculations from Problems 5 and 7; remember that \(AV=AB+BV\), since \(V\) lies beyond \(B\).
- **(b)** The radii to contact points are perpendicular to the tangent line \(AB\). Both \(AI\) and \(AE\) are the internal angle-bisector ray at \(A\); compare the side opposite that angle with the side along \(AB\) in each triangle.
- **(c)** At \(B\), the internal and external angles sum to \(180^\circ\), so their halves sum to \(90^\circ\). Identify the angle at \(E\) in the second right triangle that equals the angle at \(B\) in the first, then compare \(BZ/ZI\) with \(EV/VB\).
- **(d)** Rewrite part (b) as an expression for \(r_A\), and rewrite part (c) as an expression for \(r r_A\). Substitute to find \(r^2\), then multiply by \(s^2\). Every factor \(s-a,s-b,s-c\) and the area itself is positive.

## 10. What Heron’s formula tells us
*From the [Heron episode](https://anandppatel.github.io/proof-episodes/heron/) and Problem 9.*

**(a)** For a triangle with \(a=13,b=20,c=21\), compute \(s\) and its area using Heron’s formula. Show the factorization under the square root.

**(b)** Find its inradius and the radius of its excircle opposite the side of length \(13\). Derive the needed excircle-area relation from Problem 9(b) and \(\Delta=sr\).

**(c)** All three side lengths are multiplied by a positive number \(t\). Use Heron’s formula to show how area changes, then determine how the two radii in part (b) change.

**(d)** Rewrite Heron’s identity as
\[
\begin{aligned}
16\Delta^2={}&(a+b+c)(-a+b+c)\\
&{}\times(a-b+c)(a+b-c).
\end{aligned}
\]
Explain what happens to this expression as a triangle with fixed positive \(b,c\) flattens with \(a\to b+c\). Distinguish a limiting area of zero from the noncollinear hypothesis of the theorem.

### Hints

- **(a)** Compute \(s-a,s-b,s-c\) before multiplying. Group the four positive factors into perfect squares, or factor them into primes.
- **(b)** The inradius follows from \(\Delta=sr\). In Problem 9(b), multiply by \(s(s-a)\) and substitute \(sr=\Delta\) before solving for \(r_A\).
- **(c)** The semiperimeter and each difference \(s-a,s-b,s-c\) acquire one factor of \(t\). Count the factors before taking the square root; then use the area-radius relations from part (b).
- **(d)** Replace each of the four factors involving \(s\) by its expression with denominator \(2\). In the limit, identify the factor that tends to zero; the formula is applied along noncollinear triangles before taking that limit.
