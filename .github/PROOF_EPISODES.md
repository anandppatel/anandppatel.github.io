# Proof episodes

The unlisted collection is served at `/proof-episodes/`.

## Adding an episode

1. Add a directory at `proof-episodes/<episode-slug>/` with an `index.html` and any local assets. Use relative asset URLs so the episode works under its subdirectory.
2. Add one entry to the ordered list in `proof-episodes/index.html`, with the episode number, topic, title, short description, and a slash-terminated link such as `centroid/`.
3. Add a visible link back to `../` in the episode, and include `<meta name="robots" content="noindex, nofollow">` in every episode HTML page.
4. Keep the collection out of the homepage, primary navigation, and any future sitemap. Search-engine tags are advisory; these are public pages, not access-controlled material.
5. Verify entry links, local assets, narrow-screen layout, proof steps, and movable diagrams. Keep proof statements, highlighted regions, and any nondegeneracy assumptions aligned.

No build step or new dependency is required. GitHub Pages publishes from the root of `main`.

## First episode

`centroid/` contains the centroid area proof: draggable vertices, 15 guided sentences, matching region highlights, backward navigation, replay, and a pause for degenerate triangles. Both `index.html` and `area-proof.js` are required.

The optional, feature-detected WebMCP tool only moves triangle vertices in the current page; ordinary browsers do not need it.
