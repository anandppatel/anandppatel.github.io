# Trigonometric Ceva ... Heron's formula homwork

These problems use the proof episodes to investigate new configurations. The episode results are available tools: explain how they apply to the problem at hand. The questions include testing a proposed rule, finding a new construction, recovering a triangle from geometric data, and proving an area bound.

Throughout, \(ABC\) is noncollinear. Write \(a=BC\), \(b=CA\), \(c=AB\), \(s=(a+b+c)/2\), and \(\Delta=[ABC]\). All side points used in Ceva's theorem lie strictly inside their sides, and its ratios use ordinary positive lengths and sines. Write \(G,I,K,N_a,G_e\) for the centroid, incenter, symmedian point, Nagel point, and Gergonne point. The symbol \(N_a\) denotes the Nagel point, not the nine-point center.

You may use [The Basics](https://anandppatel.github.io/proof-episodes/basics/), [ordinary Ceva](https://anandppatel.github.io/proof-episodes/ceva/), the linked episodes, and earlier problems in this set. For reconstruction, you may also use the elementary construction fact that three positive numbers are the sides of a noncollinear triangle exactly when each is smaller than the sum of the other two. SSS gives uniqueness up to congruence once the corresponding side lengths are fixed.

In Problems 9–10, \(r\) is the inradius and \(r_A,r_B,r_C\) are the labeled exradii opposite \(A,B,C\). The [Heron episode](https://anandppatel.github.io/proof-episodes/heron/) supplies
\[
\Delta^2=s(s-a)(s-b)(s-c),
\qquad
\Delta=sr,
\qquad
\Delta=(s-a)r_A=(s-b)r_B=(s-c)r_C.
\]

Try each part before opening its hints. The Markdown download and printed set include all hints and figures. Drawings illustrate sample configurations; a proof must cover every triangle allowed by the stated hypotheses.

## 1. When angle ratios give the wrong prediction
*An application of [trigonometric Ceva](https://anandppatel.github.io/proof-episodes/trig-ceva/).*

Let \(ABC\) be a right isosceles triangle with \(\angle A=90^\circ\) and \(AB=AC=1\). Choose interior side points \(D\in BC\), \(E\in CA\), and \(F\in AB\) so that
\[
\angle BAD=60^\circ,\quad \angle DAC=30^\circ,\qquad
\angle CBE=15^\circ,\quad \angle EBA=30^\circ,
\]
and \(CF\) is the internal angle bisector at \(C\). You may use the exact value \(\sin15^\circ=(\sqrt6-\sqrt2)/4\).

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

## 2. A family of concurrent cevians
*An application of [trigonometric Ceva](https://anandppatel.github.io/proof-episodes/trig-ceva/) and the [symmedian episode](https://anandppatel.github.io/proof-episodes/symmedian/).*

For each integer \(n\geq0\), choose interior side points \(D_n\in BC\), \(E_n\in CA\), and \(F_n\in AB\) with
\[
\frac{BD_n}{D_nC}=\left(\frac cb\right)^n,
\qquad
\frac{CE_n}{E_nA}=\left(\frac ac\right)^n,
\qquad
\frac{AF_n}{F_nB}=\left(\frac ba\right)^n.
\]
Here \(a=BC\), \(b=CA\), and \(c=AB\).

**(a)** Explain why each of these three points exists and is unique. Express \(BD_n/BC\) in terms of \(b,c,n\), and write the two cyclic formulas.

**(b)** Use the side–sine identity from Episode 11 to compute the three sine ratios for \(AD_n,BE_n,CF_n\). Apply trigonometric Ceva to prove that they meet at a unique interior point \(P_n\).

**(c)** Identify \(P_0,P_1,P_2\) among the familiar triangle centers. For a triangle with \(a=5,b=6,c=7\), find the exact fraction \(BD_3/BC\).

**(d)** Suppose \(P_m=P_n\) for two distinct nonnegative integers \(m,n\). Prove that the triangle must be equilateral. Deduce that every nonequilateral triangle has infinitely many distinct points in this family, and describe what happens for an equilateral triangle.

### Hints

- **(a)** For a segment of length \(L\) and a prescribed ratio \(x/(L-x)=k>0\), solve for \(x\). Check that the result is strictly between \(0\) and \(L\).
- **(b)** The side–sine identity has one extra side-length factor. Divide by it before multiplying the three sine ratios. The case \(n=0\) involves reciprocals, which are defined because all side lengths are positive.
- **(c)** Compare the ratios obtained at \(n=0,1,2\) with the characterizations of a median, an internal angle bisector, and a symmedian. For \(n=3\), convert the ratio of two lengths into a fraction of their sum.
- **(d)** An interior point fixes a single ray from \(A\), hence a single intersection with \(BC\). If two members of the family coincide, compare their two ratios on \(BC\), and then do the same at another vertex. Separate positive numbers less than \(1\), equal to \(1\), and greater than \(1\) when comparing unequal integer powers.

## 3. The symmedian point of a right triangle
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

![A triangle right angled at A, its altitude AD, and two further symmedians meeting at the midpoint L of AD.](https://anandppatel.github.io/proof-episodes/homework/cevians-and-area/figures/right-symmedian.svg "Can the midpoint of an altitude locate the symmedian point? Problem 3 uses the right angle.")

### Hints

- **(a)** The angles at \(B\) and \(C\) are acute. In the two smaller right triangles, identify which acute angle also occurs in \(ABC\), and keep corresponding sides in the same order.
- **(b)** Use the squared-side criterion for a symmedian. For the area equalities, one comparison uses base \(BC\) and the other uses bases \(AL,AD\) on the same line.
- **(c)** Compare \([LBC]\) with \([EBC]\) using bases on \(BE\), and make the same comparison with \([LAB]\) and \([EAB]\). The common factor cancels. Then compare the latter two triangles using bases on \(AC\). For the numerical value, compute the same total area using the legs and using the altitude to the hypotenuse.
- **(d)** Write \(x=BD\), \(y=DC\), and \(h=AD\). Express \(AB^2\) and \(AC^2\) by Pythagoras, substitute into the symmedian criterion, and factor the resulting equality. Interpret each factor geometrically; use the converse of Pythagoras when needed.

## 4. Constructing a symmedian with tangents
*An application of the [circumcenter](https://anandppatel.github.io/proof-episodes/circumcenter/) and [symmedian](https://anandppatel.github.io/proof-episodes/symmedian/) episodes.*

Let \(ABC\) have circumcircle \(\Gamma\), center \(O\), and radius \(R\). Assume the tangents to \(\Gamma\) at \(B\) and \(C\) meet at a finite point \(T\), and that the segment \(AT\) crosses the interior of \(BC\) at \(D\). These position assumptions are part of the configuration.

**(a)** Prove the following elementary fact. If \(X,Y\) are distinct points on a circle of radius \(R\), and \(\theta\) is the angle between the chord ray \(YX\) and either tangent ray at \(Y\), then
\[
\sin\theta=\frac{XY}{2R}.
\]
Use the midpoint of \(XY\) and the radii to prove the formula. Address both tangent directions and the case in which \(XY\) is a diameter; do not quote the tangent–chord angle theorem.

**(b)** Use part (a), equal tangent lengths from \(T\), and the sine-area formula to compute \([ABT]/[ACT]\) in terms of \(AB\) and \(AC\).

**(c)** Compare these same areas with \([BDT]\) and \([CDT]\). Prove that \(AD\) is the symmedian from \(A\).

**(d)** Suppose \(AB=5\), \(AC=7\), and \(BC=8\), with the tangent configuration just described. Find \(BD\) and \(DC\) exactly, without computing the position of \(T\). Explain why these lengths determine the crossing point uniquely.

![The circumcircle of ABC and its two tangents at B and C, meeting at T across BC from A. Segment AT meets BC at D.](https://anandppatel.github.io/proof-episodes/homework/cevians-and-area/figures/tangent-symmedian.svg "A construction that starts with two tangents. The crossing condition in Problem 4 fixes the position of T and D.")

### Hints

- **(a)** If the chord is not a diameter, its midpoint \(M\) gives a right triangle with hypotenuse \(R\) and one leg \(XY/2\). The tangent is perpendicular to the radius at \(Y\). Reversing its direction replaces the angle by its supplement. If the chord is a diameter, read the tangent angle directly.
- **(b)** Use \(AB,BT\) for one sine-area formula and \(AC,CT\) for the other. The angles at the contact points are exactly the angles treated in part (a).
- **(c)** The bases \(AT\) and \(DT\) lie on one line. Compare triangles with common third vertex \(B\), then with common third vertex \(C\), and cancel the common factor. A final common-height comparison uses bases on \(BC\).
- **(d)** The two pieces have known sum \(BC\) and a ratio supplied by part (c). Solve these two relations using exact fractions; neither tangent length is needed.

## 5. The cevian that balances the perimeter
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

## 6. A line through three centers
*An application of the [Nagel point](https://anandppatel.github.io/proof-episodes/nagel/), [incenter](https://anandppatel.github.io/proof-episodes/incenter/), and [centroid](https://anandppatel.github.io/proof-episodes/centroid/).*

Work in any Cartesian coordinates. In expressions such as \(uA+vB\), multiply and add the two coordinates separately. You may use the segment-division identity \(P=(1-t)A+tD\) when \(P\in AD\) and \(t=AP/AD\); no general theorem about area coordinates is assumed.

**(a)** Put \(U=[N_aBC]\), \(V=[N_aCA]\), and \(W=[N_aAB]\). Compare areas with common heights and use the known excircle contact ratios to prove
\[
U:V:W=(s-a):(s-b):(s-c).
\]
Determine \(U,V,W\) individually in terms of \(\Delta\) and \(s\).

**(b)** Let \(P\) be any interior point, and put \(U_P=[PBC]\), \(V_P=[PCA]\), and \(W_P=[PAB]\). If the ray \(AP\) meets \(BC\) at \(D\), first establish
\[
\frac{BD}{DC}=\frac{W_P}{V_P},
\qquad
\frac{AP}{AD}=\frac{V_P+W_P}{\Delta}.
\]
Use segment division to deduce the coordinate identity
\[
P=\frac{U_PA+V_PB+W_PC}{\Delta}.
\]

**(c)** Apply part (b) to \(I\), using its equal perpendicular distances from the sides, and to \(N_a\), using part (a). Use the centroid's \(2:1\) median ratio to write coordinates for \(G\). Combine these expressions to prove
\[
N_a=3G-2I.
\]

**(d)** When \(I\ne G\), interpret this identity geometrically: determine the order of \(I,G,N_a\) on their line and the ratio \(GN_a:GI\). Prove that \(I=G\) occurs exactly for an equilateral triangle, and explain what the identity says in that case.

![The incenter I, centroid G, and Nagel point N_a in a scalene triangle, with the Nagel cevians shown faintly.](https://anandppatel.github.io/proof-episodes/homework/cevians-and-area/figures/nagel-line.svg "Area comparisons lead to a line through three familiar centers. Determine their order and the division ratio.")

### Hints

- **(a)** If \(AN_a\) meets \(BC\) at \(T_A\), compare \([N_aAB]/[N_aCA]\) with \(BT_A/T_AC\). Repeat cyclically and then use \(U+V+W=\Delta\).
- **(b)** Compare the areas with bases \(AP,PD\) using heights from \(B\) and \(C\). Also compare \([PBD]\) with \([ABD]\) and \([PCD]\) with \([ACD]\), then add. Finally express \(D\) as a weighted point of \(BC\) and substitute into \(P=(1-t)A+tD\).
- **(c)** The three triangles with vertex \(I\) have the same height, so their areas are proportional to \(a,b,c\). For \(N_a\), expand each coefficient \(s-a,s-b,s-c\) and collect the terms involving \(A+B+C\).
- **(d)** Subtract \(G\) from the identity before interpreting the direction and length. To analyze \(I=G\), compare the three subtriangle areas at \(I\) with those at the centroid; in the converse direction use SSS to compare an equilateral triangle's medians and angle bisectors.

## 7. Recover a triangle from two contact ratios
*An inverse problem using the [Gergonne construction](https://anandppatel.github.io/proof-episodes/gergonne/).*

The incircle touches \(BC,CA,AB\) at \(D,E,F\). Suppose only the two positive numbers
\[
u=\frac{BD}{DC},\qquad v=\frac{CE}{EA}
\]
are specified. Write \(x=AE=AF\), \(y=BD=BF\), and \(z=CD=CE\). The episode gives the side equations \(a=y+z\), \(b=z+x\), \(c=x+y\).

**(a)** Determine \(x:y:z\) from \(u,v\). Hence express \(a:b:c\) in terms of \(u,v\), keeping the labels of the three sides fixed.

**(b)** Prove that every pair \(u,v>0\) is realized by a noncollinear triangle and that the triangle is unique up to similarity. Check all three strict triangle inequalities, and verify that the incircle of the constructed triangle has the prescribed ratios; merely producing three positive side lengths is not enough.

**(c)** Recover the side lengths when
\[
u=\frac32,\qquad v=\frac43,
\qquad\text{and the perimeter is }52.
\]
Also find the remaining contact ratio \(AF/FB\).

**(d)** Describe exactly which pairs \((u,v)\) produce \(AB=AC\), which produce \(BA=BC\), and which produce \(CA=CB\). Which pair gives an equilateral triangle?

### Hints

- **(a)** Choose a positive value for \(x\), use \(v=z/x\) to find \(z\), and then use \(u=y/z\) to find \(y\). Form the three side sums only afterward.
- **(b)** If \(a=y+z\), \(b=z+x\), \(c=x+y\), simplify \(b+c-a\), \(c+a-b\), and \(a+b-c\). In the resulting triangle, recover its actual tangent lengths from its semiperimeter. For uniqueness, first match scales by a dilation and then apply SSS.
- **(c)** Find a simple integer triple proportional to \(x,y,z\). Its three side sums have a definite perimeter, which determines the remaining scale factor.
- **(d)** Express each equality of two side sums as an equality of two of \(x,y,z\), then translate it into the parameters \(u,v\).

## 8. How large is the contact triangle?
*An area application of the [Gergonne construction](https://anandppatel.github.io/proof-episodes/gergonne/).*

Let \(D,E,F\) be the incircle contacts on \(BC,CA,AB\), and put \(x=AE=AF\), \(y=BD=BF\), \(z=CD=CE\). Thus \(a=y+z\), \(b=z+x\), \(c=x+y\), with \(x,y,z>0\). The triangle \(DEF\) is the **contact triangle**. You may use the sine-area formula from [trigonometric Ceva](https://anandppatel.github.io/proof-episodes/trig-ceva/).

**(a)** Compare each corner triangle with \(ABC\) using their shared vertex angle. Prove
\[
\frac{[AEF]}{\Delta}=\frac{x^2}{bc},\qquad
\frac{[BFD]}{\Delta}=\frac{y^2}{ca},\qquad
\frac{[CDE]}{\Delta}=\frac{z^2}{ab}.
\]
Explain why the argument covers an obtuse triangle.

**(b)** Subtract the three corner areas from \(\Delta\) and prove
\[
\frac{[DEF]}{\Delta}=\frac{2xyz}{abc}.
\]
For the algebra, multiply by \(abc\), replace \(a,b,c\) by their contact-length sums, and collect terms.

**(c)** Starting only with \((p-q)^2\ge0\) for positive numbers \(p,q\), prove
\[
(x+y)(y+z)(z+x)\ge8xyz.
\]
Determine precisely when equality holds; do not cite an inequality without proving its needed case.

**(d)** Deduce the sharp bound \([DEF]\le\Delta/4\), and characterize all triangles attaining it. Describe the contact points in the equality case and give a geometric explanation of the area fraction.

![Incircle contacts D, E, F and the four triangles into which their joins divide ABC.](https://anandppatel.github.io/proof-episodes/homework/cevians-and-area/figures/contact-triangle.svg "The contact triangle and the three corner triangles partition the area of ABC.")

### Hints

- **(a)** At \(A\), the numerator uses the two lengths \(x,x\), while the denominator uses \(b,c\); both use \(\sin\angle A\). Treat \(B\) and \(C\) in the same cyclic order.
- **(b)** The numerator after taking a common denominator is \(abc-ax^2-by^2-cz^2\). Expand the side sums and look for cancellation of the terms containing a square.
- **(c)** Rewrite the squared-difference inequality as a comparison between \((p+q)^2\) and \(4pq\). Apply it to all three pairs, multiply, and use positivity when taking a square root.
- **(d)** Combine parts (b) and (c), and track the equality conditions through both. If the three tangent lengths are equal, locate each contact on its side and reconsider the three corner triangles from part (a).

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

**(a)** For any triangle, use the area-radius identities in the setup to prove
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

**(b)** Now suppose the four positive numbers satisfy the identity in part (a). Define
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

- **(a)** Divide each of \(s,s-a,s-b,s-c\) by the area using the given identities. Add the three expressions involving exradii and use \(a+b+c=2s\); keep the candidate tests as exact fractions.
- **(b)** Positivity of \(x,y,z\) should make each difference “sum of two sides minus the third” visibly positive. Add the three proposed sides to find \(S\), and multiply the reciprocal identity by \(Q\); compare \(S-a,S-b,S-c\) with the vertex tangent lengths.
- **(c)** Heron’s product for the constructed triangle is \(Sxyz\). Substitute the definitions of \(S,x,y,z\), then simplify using \(Q^2=r\,r_A r_B r_C\); both the area and \(Q\) are positive.
- **(d)** For any triangle with those radii and area \(D\), express \(s,s-a,s-b,s-c\) as \(D\) divided by the appropriate radius. Substitute into Heron’s formula to determine \(D^2\), then recover the tangent lengths and sides; use SSS for uniqueness and the converse of Pythagoras to identify the concrete triangle.
