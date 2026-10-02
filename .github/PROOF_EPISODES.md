# Proof episodes

The unlisted collection is served at `/proof-episodes/`.

## Adding an episode

1. Add a directory at `proof-episodes/<episode-slug>/` with an `index.html` and any local assets. Use relative asset URLs so the episode works under its subdirectory.
2. Add one entry to the ordered list in `proof-episodes/index.html`, with the episode number, topic, title, short description, and a slash-terminated link such as `centroid/`.
3. Add a visible link back to `../` in the episode, and include `<meta name="robots" content="noindex, nofollow">` in every episode HTML page.
4. Keep the collection out of the homepage, primary navigation, and any future sitemap. Search-engine tags are advisory; these are public pages, not access-controlled material.
5. Verify entry links, local assets, narrow-screen layout, proof steps, and movable diagrams. Keep proof statements, highlighted regions, and any nondegeneracy assumptions aligned.

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
