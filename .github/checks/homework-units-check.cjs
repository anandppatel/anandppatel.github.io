'use strict';
// Run after generating the episode pages and homework HTML.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const base = path.join(root, 'proof-episodes');
const units = [
  ['triangle-geometry', ['centroid', 'circumcenter', 'orthocenter', 'incenter', 'euler-line', 'angle-bisector', 'thales', 'nine-point-circle', 'nine-point-circle-altitudes', 'ceva']],
  ['cevians-and-area', ['trig-ceva', 'symmedian', 'nagel', 'gergonne', 'heron']],
  ['circle-geometry', ['inscribed-angles', 'cyclic-quadrilaterals', 'power-of-a-point', 'ptolemy', 'brahmagupta']]
];
const read = file => fs.readFileSync(file, 'utf8');
const landing = read(path.join(base, 'index.html'));
assert.equal((landing.match(/class="unit-card"/g) || []).length, 3, 'Landing page should contain three homework units');
assert.equal((landing.match(/class="episode-row"/g) || []).length, 0, 'Full episode lists belong on the unit pages');
const pages = [path.join(base, 'index.html'), path.join(base, 'homework/index.html')];
for (const [slug, episodes] of units) {
  assert(landing.includes(`href="units/${slug}/"`));
  const unitFile = path.join(base, 'units', slug, 'index.html');
  const unit = read(unitFile);
  assert.equal((unit.match(/class="episode-row"/g) || []).length, episodes.length);
  for (const episode of episodes) assert(unit.includes(`href="../../${episode}/"`), `Missing episode ${episode}`);
  assert(unit.includes(`href="../../homework/${slug}/"`));
  assert(unit.includes(`href="../../homework/${slug}/${slug}.md"`));
  const assignment = path.join(base, 'homework', slug, 'index.html');
  assert(read(assignment).includes(`href="../../units/${slug}/"`), 'Assignment must link back to its unit');
  pages.push(unitFile, assignment);
}
for (const page of pages) {
  const html = read(page);
  assert(/<meta name="robots" content="noindex, nofollow">/.test(html), `Missing noindex: ${page}`);
  assert(!html.includes('/Users/'), `Private path in public HTML: ${page}`);
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const ref = match[1].split(/[?#]/)[0];
    if (!ref || /^[a-z]+:/i.test(ref)) continue;
    let target = path.resolve(path.dirname(page), ref);
    assert(target.startsWith(root + path.sep) || target === root, 'Link escaped website root');
    if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');
    assert(fs.existsSync(target), `Missing local destination ${ref} from ${page}`);
  }
}
const md = read(path.join(base, 'homework/circle-geometry/circle-geometry.md'));
const html = read(path.join(base, 'homework/circle-geometry/index.html'));
assert.equal((md.match(/^## \d+\./gm) || []).length, 6);
assert.equal((md.match(/^\*\*\([ab]\)\*\*/gm) || []).length, 12);
assert.equal((md.match(/^### Hints$/gm) || []).length, 6);
assert.equal((html.match(/<section class="problem"/g) || []).length, 6);
assert.equal((html.match(/class="homework-hints"/g) || []).length, 6);
assert.equal((html.match(/<figure class="homework-figure"/g) || []).length, 3);
assert(html.includes('Problem set 03 · 6 problems'));
assert(html.includes('<math'));
assert(!html.includes('HWMATHTOKEN'));
assert(!/instructor key|\/Users\//i.test(html + md), 'Instructor material must remain private');
assert(!/href=["'][^"']*proof-episodes/.test(read(path.join(root, 'index.html'))), 'Collection must remain unlisted from the public homepage');
console.log('Homework units: three compact hubs, 20 episode links, stable homework routes, and six-problem assignment verified.');
