# Proof episodes

The unlisted collection is served at `/proof-episodes/`.

## Adding an episode

1. Add a directory at `proof-episodes/<episode-slug>/` with an `index.html` and any local assets. Use relative asset URLs so the episode works under its subdirectory.
2. Add one entry to the ordered list in `proof-episodes/index.html`, with the episode number, topic, title, short description, and a slash-terminated link such as `centroid/`.
3. Add a visible link back to `../` in the episode, and include `<meta name="robots" content="noindex, nofollow">` in every episode HTML page.
4. Keep the collection out of the homepage, primary navigation, and any future sitemap. Search-engine tags are advisory; these are public pages, not access-controlled material.
5. Register any new center or reusable auxiliary construction in `shared/geometry-catalog.js` so it is available in All Centers; see the maintenance steps below.
6. Verify entry links, local assets, narrow-screen layout, construction and proof steps, All Centers toggles, and movable diagrams. Keep proof statements, highlighted regions, and any nondegeneracy assumptions aligned.

Proof summaries with several independent facts use an `equation` array, rendered as a semantic list with one fact per line. A single formula uses a string. Do not use a centered dot as a separator between facts: reserve it for multiplication.

No build step or new dependency is required. GitHub Pages publishes from the root of `main`.

## First episode

`centroid/` contains the centroid area proof: draggable vertices, 15 guided sentences, matching region highlights, backward navigation, replay, and a pause for degenerate triangles. Both `index.html` and `area-proof.js` are required.

The optional, feature-detected WebMCP tool only moves triangle vertices in the current page; ordinary browsers do not need it.

## Circumcenter episode

`proof-episodes/circumcenter/` proves the perpendicular-bisector locus fact in both directions, then constructs O from two bisectors and proves it lies on the third. Its 12 sentences each illuminate the corresponding construction. D, E, F remain the midpoints of BC, CA, AB. The midpoint cases in the locus proof cover right triangles.

`geometry.js` holds the translated-coordinate circumcenter calculation and line clipping. `episode.js` draws both the main board and a whole-circle overview when O is outside the drawing; it never clamps O or changes the scale under a dragged vertex. Near-collinear triangles carry a numerical-precision notice; degenerate configurations pause the proof until the vertices separate.

## Orthocenter episode

`orthocenter/` proves altitude concurrence at H using the auxiliary triangle PQR formed by parallels through A, B, C. The 12 sentences establish the midpoint claims using parallelograms, verify PQR is noncollinear, and identify the altitudes with its perpendicular bisectors before invoking the circumcenter theorem. The episode links to the previous proof.

The construction view widens once at sentence 3. Dragging keeps the scale fixed; “Fit construction” explicitly fits PQR again. An overview shows offscreen auxiliary points or H. Supporting side lines and right-angle marks cover obtuse triangles; right triangles label H at the right-angle vertex. Degenerate configurations pause the proof.

## The Basics: the shared allowed tools

`proof-episodes/basics/` is a reference, not a numbered proof episode. It imports the class Google Doc "The Basics" (document ID `1JgPxVVxsZd-uQ0Fo-s-2xSq_Tw8COb30pFlIf-H_gE0`), retaining C1–C5, T1–T6, P1–P2, and O1–O2. The isosceles theorem belongs inside T1; do not introduce T1a. Statements and illustrations have no proofs. Keep the same nondegeneracy assumptions and explicitly stated converses.

- Cite a tool with a relative link such as `../basics/#c4` from an episode. Use its label and named rule (for example, "T1 (SAS)"). The collection links to the reference before the episode list; the public homepage remains unchanged.
- Edit `proof-episodes/basics/tools.json` to extend a statement or add a tool. Preserve existing IDs and labels. Append new labels within their family without renumbering old entries. Add precise hypotheses and list any permitted converse explicitly.
- Add standalone SVGs in `proof-episodes/basics/figures/`, with a title and description, readable labels, and exact geometric relations. Add each figure's filename, caption, and text alternative to its tool's `figures` array. Figure IDs can name a subprinciple (such as `t1-sas`) without inventing another numbered section.
- Run `python3 .github/build-basics.py` after editing the data. The generated `index.html` is checked in and works without JavaScript; GitHub Pages requires no build dependency. Commit the data, figures, and regenerated page together.
- Verify every label and figure, direct links, keyboard access, and desktop/mobile layout. A drawing illustrates a fact; it never authorizes an additional fact based on its appearance.
- This is a maintained import, not an automatic live sync with Google Drive. Reconcile later additions to the class source deliberately.

## Shared-engine episodes (04–10)

The incenter, Euler line, angle-bisector, Thales, two nine-point-circle parts, and
Ceva episodes use `proof-episodes/shared/geometry.js`, `episode.js`, and
`episode.css`. Each sibling's `episode.js` supplies the theorem, prerequisites,
proof sentences, drawing instructions, and any explicitly stated proof-mode
constraints. The initial three episodes keep their existing implementations.

After editing lesson metadata, regenerate the static HTML with:

```sh
node .github/build-proof-episodes.cjs
```

The checked-in HTML is what GitHub Pages serves; there is no runtime build step.
Update the revision string in that generator whenever shared assets change, then
regenerate, so a returning visitor does not mix cached scripts with new pages.

Run the numerical geometry and diagram regressions with:

```sh
node .github/check-proof-episodes.cjs
```

These tests check the implementation, including right/obtuse triangles and
coincident named points; they do not replace the synthetic proofs. Browser QA
should additionally cover every sentence, genuine pointer dragging, keyboard
movement, collinear pause/recovery, explicit proof constraints and their release,
phone-width fact lists, and links to prerequisite episodes. Preserve the distinction
between an exact hypothesis and a drawing-precision approximation in dynamic text.

## Euler line: a candidate identified by similarity

The Euler-line episode begins with O ≠ G, draws OG, and constructs X on the
opposite ray from O through G with GX = 2GO. It compares triangles AGX and DGO,
where D is the midpoint of BC, then repeats cyclically to identify X as H.
SAS similarity is justified from C3 (dilation) and T1 (SAS congruence); do not
silently add it to the allowed AA/AAA tool. Handle both collapsed cases:
O on AD with O ≠ D, and O = D (then X = A). Keep X as the candidate's label until
the proof establishes all three altitude memberships. The construction stages
must not compute H from an altitude intersection before constructing X. No new
catalog object is needed: X is the existing orthocenter, once proved. Keep the
homework's references to this argument in sync with later proof revisions.

## Build first, then prove

All ten numbered episodes open with ABC alone. The numbered construction buttons
reveal cumulative stages; only the next stage and completed stages are available.
Undo removes one stage, Start over clears the construction without moving ABC,
and Reset restores the original triangle and blank stage. The proof becomes
available after the last construction stage. Closing it returns to the completed
construction. Vertex dragging and arrow-key movement remain available throughout.

For shared-engine episodes, edit `shared/constructions.js`. Each entry has
`steps` (button labels, captions, and optional one-time placement), `draw`,
`extent`, and optional handle and constraint functions. Level zero must draw
nothing beyond ABC; bounds and side handles must include only revealed objects.
Any constraint must be stated on screen. Thales places C on the diameter circle;
undoing that placement restores free movement. The angle-bisector and Ceva
placements happen once and leave their side points free afterward. The original
three episodes implement the same controls in their own scripts.

## All Centers: the growing comparison playground

`proof-episodes/all-centers/` is an unnumbered collection entry. It uses the shared
engine in studio mode and starts with every switch off. Its independent switches
come from `shared/geometry-catalog.js`; circles and lines never implicitly enable
center labels. The catalog currently includes G, O, H, I, N and fourteen auxiliary
objects. Show all centers enables just the centers; Clear all returns to ABC.

Whenever an episode introduces a center or reusable auxiliary construction:

1. Add the reusable calculation to `shared/geometry.js` if needed, and add a
   catalog entry with a stable ID, group, label, explanation, and related-episode
   link. Center entries provide `point`; other entries provide `draw` and `extent`.
2. The playground generates its switch from that entry automatically. Include
   complete circle bounds and only the selected geometry in its extent. Keep
   labels distinct from existing points, and handle right, obtuse, nearly flat,
   and coincident-center configurations honestly.
3. Add or extend the construction and catalog regressions, regenerate HTML, and
   update the asset revision. Check the new object both alone and in combination
   in the playground before publishing it with the episode.

`check-proof-episodes.cjs` includes the construction-stage and catalog checks.
They verify reveal order, independent switches, finite geometry, perpendicular
marks, and full circle bounds. Also check the real UI at desktop and phone widths:
blank entry, stage buttons, undo/reset, proof entry/exit, pointer and keyboard
movement, and independent toggle changes. Keep the collection unlisted from the
public homepage and retain its noindex metadata.

## Homework

The collection's Homework section links to `proof-episodes/homework/`. Keep
assignments separate from the numbered interactive episodes. Each assignment has
a readable web page and a direct same-origin Markdown download; keep the problems,
subparts, hypotheses, hints, and source-episode links identical in both versions.
Student pages contain no solutions. Retain noindex metadata and the collection's
unlisted placement.

For the first set, edit `homework/triangle-geometry/triangle-geometry.md`. Its
absolute episode URLs also work when the Markdown is downloaded. Generate the
web page from that source using the pinned development dependencies:

```sh
pnpm --dir .github/homework-build install --frozen-lockfile --ignore-scripts
node .github/build-homework.mjs
```

The generator converts LaTeX delimiters into native MathML at build time. Commit
the Markdown and generated HTML together; visitors need no math-rendering script.
The stylesheet is `homework/homework.css`, including phone and print layouts.
When shared styling changes, update its version query in the generator. Check
formula rendering, problem and subpart counts, source links, navigation anchors,
and the actual Markdown download before publication. Add future assignments to
the Homework listing with both read and download links.

Each problem ends with a `### Hints` subsection in the canonical Markdown. The
generator displays it as a closed native details panel; printing opens all hints
temporarily and restores the reader's choices afterward. Keep hints as prompts
for a next step, without complete proofs or numerical answers. Diagram Markdown
uses an absolute image URL, descriptive alt text, and a quoted caption. The
generator verifies the local SVG and renders it as a responsive, linked figure;
the downloaded source retains working image URLs. Store diagrams in the
assignment's `figures/` directory, with title and description elements, readable
labels, and checked geometric relations. Figures illustrate the configurations;
they do not establish the conclusions students are asked to prove.

## Student reading references

`episode-references.json` in `.github/` records precise theorem-statement locations
in Gerard A. Venema, *Exploring Advanced Euclidean Geometry with GeoGebra* (2013).
These references guide students to the results, not to the source of an episode's
proof. Do not cite proof exercises or imply that the episode follows the book's
argument. Named theorems are unnumbered; retain their names and section numbers.
The circumcenter entries identify a prose statement and an unnumbered theorem
without inventing a theorem title. No standalone angle-bisector ratio theorem was
located in this edition, so that episode currently has no book reference.

Use printed page numbers, with one-based PDF viewer pages in parentheses. Verify
both against the source edition before editing citations. The verified 146-page
PDF has seventeen pages before printed page 1. Do not publish the source PDF.

After changing reference data, run both generators:

```sh
node .github/build-proof-episodes.cjs
node .github/build-episode-references.cjs
```

The generated reading sections work without JavaScript and remain visible below
the diagram during a proof, including on phones. Their shared stylesheet is
`proof-episodes/shared/book-references.css`; update its revision in
`.github/episode-references.cjs` if it changes. Keep the proof scripts unchanged
when only adding or revising reading references.
