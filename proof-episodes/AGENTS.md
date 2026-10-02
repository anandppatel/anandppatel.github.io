# Proof episodes maintenance

Read `.github/PROOF_EPISODES.md` at the repository root before extending this collection.

- Every numbered episode starts with triangle ABC alone, then reveals its construction through sequential buttons. Keep the proof separate, with each sentence highlighting its corresponding geometry.
- Whenever an episode adds a triangle center or reusable auxiliary construction, add it to `shared/geometry-catalog.js` and verify it in `all-centers/`. The playground generates independent switches from this catalog; selecting a line or circle must not silently select a center label.
- Keep vertex dragging, touch, keyboard movement, and explicit handling of degenerate configurations. Numerical proximity must not be presented as an exact equality.
- Regenerate shared pages and run `.github/check-proof-episodes.cjs`; inspect desktop and phone interactions before publication.
- Keep the collection unlisted from the main homepage and navigation, and retain noindex metadata.
