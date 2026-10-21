# Trigonometric Ceva ... Heron's formula homwork

These ten problems connect triangle centers through reflections, apply Ceva and symmedian techniques in new configurations, and derive Heron’s formula from the incircle and an excircle. Problems 1–3 adapt selected exercises from Venema; Problems 7–8 follow his step-by-step derivation of Heron’s formula. The other problems apply ideas from the proof episodes.

Throughout, \(ABC\) is noncollinear. Write \(a=BC\), \(b=CA\), \(c=AB\), \(s=(a+b+c)/2\), and \(\Delta=[ABC]\). Write \(G,O,H,I,K,N_a,G_e\) for the centroid, circumcenter, orthocenter, incenter, symmedian point, Nagel point, and Gergonne point. The symbol \(N_a\) denotes the Nagel point, not the nine-point center. All applications of Ceva concern strictly interior side points, with ordinary positive lengths and sines. In Problems 1–3, conjugation is defined only for interior points; Problem 3 assumes that the triangle is acute.

**These are the facts you may assume.**

- [The Basics](https://anandppatel.github.io/proof-episodes/basics/), [ordinary Ceva](https://anandppatel.github.io/proof-episodes/ceva/), and [trigonometric Ceva](https://anandppatel.github.io/proof-episodes/trig-ceva/), with both concurrence criteria restricted to interior cevians.
- The constructions of the familiar centers, the [squared-side criterion for a symmedian](https://anandppatel.github.io/proof-episodes/symmedian/), and the incircle and excircle contact facts in the [Gergonne](https://anandppatel.github.io/proof-episodes/gergonne/) and [Nagel](https://anandppatel.github.io/proof-episodes/nagel/) episodes. A statement that a problem asks you to establish still requires a proof.
- In Problems 7–8, use the incircle and excircle constructions, equal tangents, area additivity, and similarity. Derive the requested area–radius identities and Heron’s formula; do not assume those conclusions from the Heron episode. Their derivations follow Venema’s Exercises 4.5.1–4.5.7.
- In Problems 9–10, you may use Heron’s formula and all the area–radius identities proved in Problems 7–8. Here \(r\) is the inradius and \(r_A,r_B,r_C\) are the exradii opposite the indicated vertices.
- For reconstruction, three positive numbers are side lengths of a noncollinear triangle exactly when each is smaller than the sum of the other two. SSS gives uniqueness up to congruence once corresponding side lengths are fixed. Earlier results in this set may be used in later problems.

**Book references.** Gerard A. Venema, *Exploring Advanced Euclidean Geometry with GeoGebra* (2013). Each adapted problem gives its exercise numbers and printed page; the parenthetical PDF page is the one-based viewer page in the course copy. Our added steps and interior-point restrictions are stated explicitly. The source’s starred exercises are investigations, so an added proof requirement is an adaptation.

Try each part before opening its hints. The Markdown download and printed set include all hints and figures. Drawings illustrate sample configurations; proofs must cover every triangle allowed by the stated hypotheses.

## 1. Side reflections connect the Gergonne and Nagel points
*Adapted from Venema, Exercises 8.6.1 and 8.6.6, printed p. 74 (PDF p. 91). We restrict the construction to interior points and add the four-part scaffold below. Use [ordinary Ceva](https://anandppatel.github.io/proof-episodes/ceva/) and the [Gergonne](https://anandppatel.github.io/proof-episodes/gergonne/) and [Nagel](https://anandppatel.github.io/proof-episodes/nagel/) episodes.*

Let \(P\) lie strictly inside \(ABC\). The rays \(AP,BP,CP\) meet the opposite sides at \(D,E,F\), respectively. Reflect \(D\) across the perpendicular bisector of \(BC\), obtaining \(D'\); define \(E'\) and \(F'\) by the corresponding reflections on \(CA\) and \(AB\).

**(a)** Explain why \(D,E,F,D',E',F'\) all lie strictly inside their respective sides. Express \(BD'/D'C\) in terms of \(BD/DC\), and write the two cyclic identities.

**(b)** Use ordinary Ceva to prove that \(AD',BE',CF'\) meet at a unique interior point \(Q\). This point is called the **isotomic conjugate** of \(P\) with respect to \(ABC\).

**(c)** Apply the same construction to \(Q\). Prove that it returns \(P\). Such an operation is called an **involution**: applying it twice gives the original point.

**(d)** Now take \(P=G_e\), so \(D,E,F\) are the incircle contact points. Let \(T_A,T_B,T_C\) be the contacts of the opposite excircles with \(BC,CA,AB\). Use the contact lengths established in the episodes to prove \(D'=T_A\), \(E'=T_B\), and \(F'=T_C\). Conclude that the Gergonne and Nagel points are isotomic conjugates of one another.

![Gergonne and Nagel cevians in two colors, with their opposite-side contact points paired by midpoint reflection.](https://anandppatel.github.io/proof-episodes/homework/cevians-and-area/figures/isotomic-pair.svg "The two sets of side points are reflected across the side midpoints. Relate their cevians in Problem 1.")

### Hints

- **(a)** A ray from a vertex through an interior point crosses the opposite side once. The reflection used on \(BC\) exchanges its endpoints; compare the distance from \(B\) to the reflected point with the distance from \(C\) to the original point.
- **(b)** Start with the Ceva product for the three cevians through \(P\). Replace its factors using part (a). After applying the converse, explain why two distinct interior cevians can have only one common point.
- **(c)** Identify the opposite-side intersections of the three cevians through \(Q\). What does reflecting each of these side points a second time do?
- **(d)** On \(BC\), compare the ordered pairs of lengths \((BD,DC)\) and \((BT_A,T_AC)\). A point on a fixed segment is determined by its distance from one endpoint. Use part (c) for the reverse correspondence.

## 2. Angle reflections and the incenter
*Adapted from Venema, Exercises 8.6.2 and 8.6.8 and the interior-point investigation in starred Exercise 8.6.7, printed p. 74 (PDF p. 91). The investigation is made into a proof problem here, and all points remain interior. Use [trigonometric Ceva](https://anandppatel.github.io/proof-episodes/trig-ceva/) and the [symmedian episode](https://anandppatel.github.io/proof-episodes/symmedian/).*

Let \(P\) lie strictly inside \(ABC\), and let \(D,E,F\) be the opposite-side intersections of \(AP,BP,CP\). Reflect the ray \(AP\) across the internal angle bisector at \(A\); reflect \(BP\) and \(CP\) across the corresponding bisectors at \(B\) and \(C\).

**(a)** Prove that each reflected ray is still strictly inside its vertex angle and meets the opposite side at a unique interior point. Call the resulting points \(D',E',F'\). Identify the two angles at \(A\) that reflection exchanges.

**(b)** Use trigonometric Ceva to prove that \(AD',BE',CF'\) meet at a unique interior point \(Q\). This point is called the **isogonal conjugate** of \(P\) with respect to \(ABC\). Explain why all sine ratios used in the argument are positive and defined.

**(c)** Prove that isogonal conjugation is an involution on the interior of the triangle. Identify the isogonal conjugate of the centroid \(G\), and use the involution to identify the isogonal conjugate of \(K\).

**(d)** Prove that \(Q=P\) if and only if \(P=I\). Thus the incenter is the unique interior point fixed by isogonal conjugation. Your argument must also cover isosceles and equilateral triangles.

![Two interior points joined to the vertices, with a pair of rays from A reflected across its internal angle bisector.](https://anandppatel.github.io/proof-episodes/homework/cevians-and-area/figures/isogonal-pair.svg "Reflection exchanges the two parts of each vertex angle. Problem 2 proves that the reflected cevians concur.")

### Hints

- **(a)** Reflection in the internal bisector interchanges the two boundary rays of the angle. If an interior ray cuts the angle into two positive parts, describe the parts cut out by its reflection.
- **(b)** Write the sine ratio at \(A\) before and after reflection, and then repeat at the other vertices. Multiply before applying trigonometric Ceva. Use the interior positions of the side points when discussing the point of concurrence.
- **(c)** Reflect each of the three rays a second time. For the center identification, recall which cevians pass through \(G\) and how a symmedian is defined.
- **(d)** If \(Q=P\), the reflected ray from each vertex must be the original ray. Compare the two positive angles it cuts out. For the converse, start with the rays from the vertices through \(I\).

## 3. The circumcenter and orthocenter are isogonal conjugates
*Adapted from Venema, Exercise 8.6.9, printed p. 75 (PDF p. 92). The acute-triangle restriction and the intermediate steps below are added here. Use the [circumcenter](https://anandppatel.github.io/proof-episodes/circumcenter/) and [orthocenter](https://anandppatel.github.io/proof-episodes/orthocenter/) episodes and Problem 2.*

Assume that \(ABC\) is **strictly acute**, meaning that all three vertex angles are less than \(90^\circ\). Let \(O\) and \(H\) be its circumcenter and orthocenter. In this problem you may use the following circle-angle fact from Venema, §0.10, printed p. 10 (PDF p. 27): if distinct points \(X,Y,Z\) lie on a circle with center \(O\) and \(\angle XZY<90^\circ\), then the ordinary angle \(\angle XOY\) is twice \(\angle XZY\). No directed angles are needed.

**(a)** Let \(D\) be the altitude foot from \(A\) on \(BC\). Explain why all three altitude feet are interior to their sides and why \(H\) lies inside \(ABC\). Show that
\[
\angle BAH=90^\circ-\angle B,
\qquad
\angle HAC=90^\circ-\angle C.
\]

**(b)** Apply the supplied circle-angle fact to \(\angle AOB\) and \(\angle AOC\). Use the two isosceles radius triangles to prove
\[
\angle BAO=90^\circ-\angle C,
\qquad
\angle OAC=90^\circ-\angle B.
\]
Explain why these equalities put the ray \(AO\) strictly inside \(\angle BAC\). Repeat the position argument at another vertex to justify that \(O\) lies inside \(ABC\).

**(c)** Compare parts (a) and (b). Prove that reflection across the internal bisector at \(A\) exchanges the rays \(AO\) and \(AH\). Repeat at \(B\) and \(C\), and conclude that \(O\) and \(H\) are isogonal conjugates of one another.

**(d)** Prove that \(O=H\) if and only if \(ABC\) is equilateral. In the forward direction, compare an altitude through a vertex with the perpendicular bisector of the opposite side; in the reverse direction, explain why these lines coincide in an equilateral triangle.

![An acute triangle with circumcenter O, orthocenter H, its circumcircle, and the rays AO and AH.](https://anandppatel.github.io/proof-episodes/homework/cevians-and-area/figures/acute-isogonal.svg "Compare the angles made by AO and AH. The acute hypothesis keeps both centers and their cevians interior.")

### Hints

- **(a)** A perpendicular foot outside the opposite side would force one of the two angles at that side's endpoints to be nonacute. Two cevians joining vertices to interior points of their opposite sides meet inside the triangle. Then use the angle sums in \(ABD\) and \(ACD\).
- **(b)** The base angles of an isosceles triangle are half the difference between \(180^\circ\) and its vertex angle. Check that the two angles you obtain at \(A\) are positive and add to \(\angle A\). For an angle less than \(180^\circ\), this equality places the intervening ray inside the angle; repeating at \(B\) determines the required side of each sideline.
- **(c)** Record the two angles on each side of \(AO\), then do the same for \(AH\). Compare their order, rather than merely their sum. Problem 2 turns the three reflected rays into a statement about conjugate points.
- **(d)** If \(O=H\), both the altitude from \(A\) and the perpendicular bisector of \(BC\) pass through this point and are perpendicular to \(BC\). Use uniqueness of that perpendicular and the perpendicular-bisector property. Repeat at one other vertex.

## 4. When angle ratios give the wrong prediction
*An application of [trigonometric Ceva](https://anandppatel.github.io/proof-episodes/trig-ceva/).*

Let \(ABC\) be a right isosceles triangle with \(\angle A=90^\circ\) and \(AB=AC=1\). Choose interior side points \(D\in BC\), \(E\in CA\), and \(F\in AB\) so that
\[
\angle BAD=60^\circ,\quad \angle DAC=30^\circ,\qquad
\angle CBE=15^\circ,\quad \angle EBA=30^\circ,
\]
and \(CF\) is the internal angle bisector at \(C\). You may use \(\sin30^\circ=1/2\), \(\sin60^\circ=\sqrt3/2\), and \(\sin15^\circ=(\sqrt6-\sqrt2)/4\).

**(a)** Find the two angles at \(C\) cut out by \(CF\), and compute the product
\[
\frac{\angle BAD}{\angle DAC}
\frac{\angle CBE}{\angle EBA}
\frac{\angle ACF}{\angle FCB},
\]
where all six angles are measured in degrees. What would this product suggest if one mistakenly replaced the sine ratios in trigonometric Ceva by ratios of angles?

**(b)** Compute the correct product of sine ratios exactly. Prove that \(AD,BE,CF\) are not concurrent; a decimal approximation alone is not a proof.

**(c)** Keep \(D\) and \(E\) fixed. Find \(BD/DC\) and \(CE/EA\), and determine the ratio \(AF_*/F_*B\) required for \(AD,BE,CF_*\) to be concurrent.

**(d)** Prove that there is exactly one such point \(F_*\) in the interior of \(AB\). Find \(AF_*/AB\), and decide whether \(F_*\) lies between \(A\) and \(F\) or between \(F\) and \(B\).

### Hints

- **(a)** First find the two acute angles of the right isosceles triangle. The bisector divides the angle at \(C\) into equal parts. Keep the ordinary angle product separate from the sine product.
- **(b)** Substitute the standard values of \(\sin30^\circ\) and \(\sin60^\circ\), together with the supplied value of \(\sin15^\circ\). After simplifying, you can test equality with \(1\) by squaring an equality between positive quantities.
- **(c)** Use the side–sine identity from Episode 11 at \(A\) and then at \(B\); the side-length factor at \(B\) is not \(1\). Once two side ratios are known, ordinary Ceva determines the third.
- **(d)** A positive ratio \(AF_*/F_*B=k\), together with \(AF_*+F_*B=AB\), determines one point of the segment. Find the corresponding ratio for the original angle-bisector foot \(F\), and compare the two positions using exact inequalities between positive numbers.

## 5. The symmedian point of a right triangle
*A geometric application of the [symmedian episode](https://anandppatel.github.io/proof-episodes/symmedian/).*

Suppose \(\angle A=90^\circ\). Let \(D\) be the foot of the perpendicular from \(A\) to \(BC\), and let \(L\) be the midpoint of \(AD\).

**(a)** Explain why \(D\) lies in the interior of \(BC\). Use similar triangles to prove
\[
BD=\frac{AB^2}{BC},\qquad DC=\frac{AC^2}{BC}.
\]

**(b)** Prove that \(AD\) is the symmedian from \(A\). Then use area comparisons to show
\[
[LBC]=\frac{[ABC]}2,\qquad [LAB]=\frac{[ABD]}2.
\]

**(c)** Let the ray \(BL\) meet \(AC\) at \(E\). Compare areas to find \(CE/EA\), and prove that \(BL\) is the symmedian from \(B\). Deduce that \(K=L\). If \(AB=3\) and \(AC=4\), find \(AK\) exactly.

**(d)** Now allow \(ABC\) to be any noncollinear triangle whose altitude foot \(D\) lies strictly inside \(BC\). Prove that \(AD\) is a symmedian if and only if either \(AB=AC\) or \(\angle A=90^\circ\).

![A triangle right angled at A, its altitude AD, and two further symmedians meeting at the midpoint L of AD.](https://anandppatel.github.io/proof-episodes/homework/cevians-and-area/figures/right-symmedian.svg "Can the midpoint of an altitude locate the symmedian point? Problem 5 uses the right angle.")

### Hints

- **(a)** The angles at \(B\) and \(C\) are acute. In the two smaller right triangles, identify which acute angle also occurs in \(ABC\), and keep corresponding sides in the same order.
- **(b)** Use the squared-side criterion for a symmedian. For the area equalities, one comparison uses base \(BC\) and the other uses bases \(AL,AD\) on the same line.
- **(c)** Compare \([LBC]\) with \([EBC]\) using bases on \(BE\), and make the same comparison with \([LAB]\) and \([EAB]\). The common factor cancels. Then compare the latter two triangles using bases on \(AC\). For the numerical value, compute the same total area using the legs and using the altitude to the hypotenuse.
- **(d)** Write \(x=BD\), \(y=DC\), and \(h=AD\). Express \(AB^2\) and \(AC^2\) by Pythagoras, substitute into the symmedian criterion, and factor the resulting equality. Interpret each factor geometrically; use the converse of Pythagoras when needed.

## 6. The cevian that balances the perimeter
*An application of the [Nagel point](https://anandppatel.github.io/proof-episodes/nagel/).*

Let \(T_A\) be the contact of the \(A\)-excircle with \(BC\). You may use \(BT_A=s-c\) and \(T_AC=s-b\). A **boundary path** from \(A\) to a point of \(BC\) follows the sides through either \(B\) or \(C\); its length does not include the cevian joining its endpoints.

**(a)** Show that the two boundary paths \(A\!\to B\!\to T_A\) and \(A\!\to C\!\to T_A\) have the same length, and identify that length.

**(b)** Let \(D\) be any point strictly inside \(BC\). Prove that the triangles \(ABD\) and \(ACD\) have equal perimeters if and only if \(D=T_A\). Explain why this gives a unique perimeter-balancing cevian from \(A\).

**(c)** Suppose \((a,b,c)=(16,14,10)\). Find \(BT_A\), \(T_AC\), and the common boundary-path length. Express the common perimeter of the two triangles in terms of \(AT_A\), and find \([ABT_A]:[ACT_A]\). Does balancing the perimeters also balance the areas in this example?

**(d)** At each of \(A,B,C\), draw the unique cevian that splits \(ABC\) into two triangles of equal perimeter. Use the Nagel episode to prove that these three cevians have a unique common point. State this as a new geometric characterization of \(N_a\), without repeating a Ceva proof.

![Two colored boundary paths from A through B or C to the opposite excircle contact T_A on BC.](https://anandppatel.github.io/proof-episodes/homework/cevians-and-area/figures/perimeter.svg "Compare the path through B with the path through C; the dividing cevian is shared by the two triangle perimeters.")

### Hints

- **(a)** The path through \(B\) has length \(c+BT_A\); use the corresponding expression through \(C\).
- **(b)** Both small-triangle perimeters contain \(AD\), so cancel it. If \(BD=t\), substitute \(DC=a-t\); a prescribed distance from \(B\) determines at most one point of \(BC\).
- **(c)** Keep the boundary path separate from the closed perimeter: the latter also includes \(AT_A\). For the area ratio, use the common height from \(A\) to \(BC\).
- **(d)** Apply part (b) at each vertex. Identify the three resulting side points before invoking the known Nagel concurrence theorem.

## 7. The first half of Heron's proof

*Source: Venema, §4.5, Exercises 4.5.1–4.5.4, printed p. 45 (PDF p. 62); contact labels follow Figure 4.4 on printed p. 44 (PDF p. 61). The exercises are grouped into four parts below.*

Let \(ABC\) be a noncollinear triangle with side lengths \(a=BC\), \(b=CA\), \(c=AB\), semiperimeter \(s=(a+b+c)/2\), and area \(\Delta\). Its incircle has center \(I\), radius \(r\), and contact points \(X\in BC\), \(Y\in CA\), and \(Z\in AB\). The \(A\)-excircle has center \(E\), radius \(r_A\), and contact points \(T\) on \(BC\), \(U\) on the extension of \(AC\) beyond \(C\), and \(V\) on the extension of \(AB\) beyond \(B\).

You may use the geometric facts established in the incenter and Nagel episodes: \(I\) is interior and \(AI,BI,CI\) are the internal angle bisectors; the incircle contacts lie strictly inside their sides; the excircle contacts satisfy \(B\! -\! T\! -\! C\), \(A\! -\! C\! -\! U\), and \(A\! -\! B\! -\! V\); the ray \(AE\) follows the same internal angle bisector as \(AI\); and \(BE\) bisects the exterior angle between \(BC\) and \(BV\). Both radii are positive, and each radius to a contact point is perpendicular to its sideline. Do not use Heron's formula in Problems 7–8: these problems will prove it.

**(a)** Divide \(ABC\) into the three triangles with vertex \(I\), and prove
\[
\Delta=sr.
\]

**(b)** Set
\[
z=AZ,\qquad x=BX,\qquad y=CY,\qquad u=CU,\qquad v=BV.
\]
Use equal tangent lengths and the stated contact order to prove
\[
a=x+y,\quad b=y+z,\quad c=x+z,\quad s=x+y+z,
\]
and hence \(x=s-b\), \(y=s-c\), and \(z=s-a\). Next establish
\[
u+v=x+y,\qquad x+z+v=y+z+u,
\]
and deduce \(u=x\) and \(v=y\). Explain why all five tangent lengths are positive.

**(c)** Show that the full tangent segment from \(A\) to the excircle satisfies \(AV=s\).

**(d)** Prove \(\triangle AZI\sim\triangle AVE\), stating the vertex correspondence, and deduce
\[
\frac{r_A}{s}=\frac{r}{s-a}.
\]

![Triangle ABC with incircle center I, A-excenter E, incircle contacts X Y Z, and excircle contacts T U V on BC and the extensions beyond C and B.](https://anandppatel.github.io/proof-episodes/homework/cevians-and-area/figures/heron-derivation.svg "The configuration for Problems 7–8: compare AZI with AVE, then ZBI with VEB. The labels follow Venema’s Figure 4.4.")

### Hints

- **(a)** Use \(AB\), \(BC\), and \(CA\) as bases. What is the corresponding height from \(I\) in each triangle?
- **(b)** Pair the tangents from each of \(A,B,C\). Along \(BC\), add \(BT+TC\); along the two rays from \(A\), compare \(AB+BV\) with \(AC+CU\). Add and subtract the resulting equations for \(u,v\).
- **(c)** Write \(AV=AB+BV\), and use the expressions from part (b).
- **(d)** Locate the two right angles and the common half-angle at \(A\). Match the side opposite that half-angle with the adjacent tangent segment in each triangle.

## 8. Finish the proof of Heron's formula

*Source: Venema, §4.5, Exercises 4.5.5–4.5.7, printed p. 45 (PDF p. 62), form parts (a)–(c). Part (d) is an added consequence of the identities proved in Problems 7–8.*

Keep all the notation and geometric facts from Problem 7, and put \(\beta=\angle ABC\). You may use every identity proved in Problem 7, but not Heron's formula before you derive it in part (c).

**(a)** Use the internal bisector \(BI\) and exterior bisector \(BE\) to prove
\[
\angle ZBI=\frac{\beta}{2},\qquad
\angle EBV=\frac{180^\circ-\beta}{2}.
\]
Explain why \(BI\perp BE\). Then use the angle sum in the right triangle \(VEB\) to prove \(\triangle ZBI\sim\triangle VEB\), with correspondence \(Z\leftrightarrow V\), \(B\leftrightarrow E\), \(I\leftrightarrow B\).

**(b)** Read the corresponding sides in this similarity to prove
\[
\frac{s-b}{r}=\frac{r_A}{s-c},
\qquad\text{and hence}\qquad
rr_A=(s-b)(s-c).
\]

**(c)** Combine part (b) with the radius relation from Problem 7(d) to obtain
\[
r^2=\frac{(s-a)(s-b)(s-c)}{s}.
\]
Use Problem 7(a) to deduce Heron's formula
\[
\Delta=\sqrt{s(s-a)(s-b)(s-c)}.
\]
Explain why every division is legitimate and why the positive square root is required.

**(d)** Let \(r_B,r_C\) denote the radii of the excircles opposite \(B,C\). Derive, without any further construction,
\[
\Delta=sr=(s-a)r_A=(s-b)r_B=(s-c)r_C.
\]
Explain why the proofs of the last two equalities follow by cyclically relabeling the triangle.

### Hints

- **(a)** The angles \(ABC\) and \(CBV\) are supplementary. Their half-angles add to \(90^\circ\). In \(VEB\), the angles at \(B\) and \(E\) are complementary.
- **(b)** In the stated correspondence, \(BZ\) matches \(EV\), and \(ZI\) matches \(VB\). Substitute the lengths established in Problem 7.
- **(c)** First express \(r_A\) in terms of \(r,s,s-a\). Substitute into part (b), then square the already-proved identity \(\Delta=sr\).
- **(d)** Cross-multiply Problem 7(d) and compare with \(\Delta=sr\). Replace \((A,B,C)\) by \((B,C,A)\), and then by \((C,A,B)\).

## 9. The largest area with a fixed base and perimeter
*An application of [Heron’s formula](https://anandppatel.github.io/proof-episodes/heron/).*

Fix numbers \(a>0\) and \(s>a\). Consider all triangles whose base \(BC\) has length \(a\) and whose perimeter is \(2s\); the other two sides may vary.

**(a)** Put \(d=b-c\). Express \(b\) and \(c\) in terms of \(a,s,d\), and prove that the admissible values of \(d\) are exactly \(-a<d<a\). Check both positivity and all three strict triangle inequalities in the converse direction.

**(b)** Show that
\[
(s-b)+(s-c)=a,
\qquad
(s-b)-(s-c)=-d.
\]
Use a difference of squares and Heron’s formula to deduce
\[
\Delta^2=\frac{s(s-a)}4\bigl(a^2-d^2\bigr).
\]

**(c)** Determine the largest possible area and characterize the triangles that attain it. Explain why the maximizing side lengths really occur in a noncollinear triangle and determine that triangle up to congruence.

**(d)** Suppose a positive number \(q\) is prescribed as the area. Determine exactly when such a triangle exists, and recover \(b,c\), up to interchange, from \(a,s,q\). Explain what happens when \(q\) equals the maximum and why \(q=0\) is excluded.

![Two triangles on base BC of length 4, each with perimeter 12: one has other sides 3 and 5, and the other has sides 4 and 4.](https://anandppatel.github.io/proof-episodes/homework/cevians-and-area/figures/fixed-perimeter.svg "The same base and perimeter allow different areas. Problem 9 determines the maximum and its equality case.")

### Hints

- **(a)** Solve the two equations \(b+c=2s-a\) and \(b-c=d\). For a triangle, compare \(b-c\) and \(c-b\) with \(a\); conversely, use \(s>a\) together with the two bounds on \(d\).
- **(b)** For any numbers \(u,v\), the identity \(4uv=(u+v)^2-(u-v)^2\) expresses their product using their sum and difference. Apply it to \(u=s-b\), \(v=s-c\).
- **(c)** The factor \(s(s-a)/4\) is fixed and positive. Decide which admissible value of \(d\) makes the remaining factor largest, then use part (a) to check that equality is attainable.
- **(d)** Substitute \(\Delta=q\) in part (b) and solve for \(d^2\). A real square root is necessary, but also check the strict bound from part (a); the two possible signs of \(d\) exchange \(b\) and \(c\).

## 10. Reconstruct a triangle from its circle radii
*An inverse problem using [Heron’s formula](https://anandppatel.github.io/proof-episodes/heron/) and the tangent lengths from the [Gergonne](https://anandppatel.github.io/proof-episodes/gergonne/) and [Nagel](https://anandppatel.github.io/proof-episodes/nagel/) episodes.*

Four positive numbers are proposed as the inradius \(r\) and the labeled exradii \(r_A,r_B,r_C\) of a triangle. We will determine exactly when this proposal is possible and whether it determines the triangle.

**(a)** For any triangle, use the area-radius identities proved in Problems 7–8 to prove
\[
\frac1r=\frac1{r_A}+\frac1{r_B}+\frac1{r_C}.
\]
Apply this necessary test to the proposed quadruples
\[
(r,r_A,r_B,r_C)=(1,2,3,6)
\quad\text{and}\quad
(1,2,3,5).
\]
Which is ruled out, and which remains possible? Explain why passing a necessary test alone has not yet proved existence.

**(b)** Now suppose the four positive numbers satisfy the identity in part (a). The letters \(x,y,z\) below are redefined for this problem. Define
\[
Q=\sqrt{r\,r_A r_B r_C},
\qquad
x=\frac Q{r_A},\quad y=\frac Q{r_B},\quad z=\frac Q{r_C},
\]
and propose side lengths
\[
a=y+z,\qquad b=z+x,\qquad c=x+y.
\]
Prove that these lengths form a noncollinear triangle. If \(S\) is its semiperimeter, show that \(S=x+y+z=Q/r\) and identify \(S-a,S-b,S-c\). Explain how \(x,y,z\) describe its incircle tangent lengths from the vertices.

**(c)** Use Heron’s formula to prove that the constructed triangle has area \(Q\). Then use the area-radius identities to show that its inradius and three labeled exradii are exactly the four proposed numbers. Conclude that the condition in part (a) is sufficient as well as necessary.

**(d)** Prove that any triangle with the proposed radii must have the side lengths constructed in part (b), so the triangle is unique up to congruence with corresponding vertex labels. Reconstruct the candidate from part (a) that passes the test: find its area and three sides, and identify the resulting kind of triangle.

### Hints

- **(a)** Divide each of \(s,s-a,s-b,s-c\) by the area using the identities from Problems 7–8. Add the three expressions involving exradii and use \(a+b+c=2s\); keep the candidate tests as exact fractions.
- **(b)** Positivity of \(x,y,z\) should make each difference “sum of two sides minus the third” visibly positive. Add the three proposed sides to find \(S\), and multiply the reciprocal identity by \(Q\); compare \(S-a,S-b,S-c\) with the vertex tangent lengths.
- **(c)** Heron’s product for the constructed triangle is \(Sxyz\). Substitute the definitions of \(S,x,y,z\), then simplify using \(Q^2=r\,r_A r_B r_C\); both the area and \(Q\) are positive.
- **(d)** For any triangle with those radii and area \(D\), express \(s,s-a,s-b,s-c\) as \(D\) divided by the appropriate radius. Substitute into Heron’s formula to determine \(D^2\), then recover the tangent lengths and sides; use SSS for uniqueness and the converse of Pythagoras to identify the concrete triangle.
