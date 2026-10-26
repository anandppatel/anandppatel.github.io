#!/usr/bin/env node
'use strict';
// The first three episodes predate the shared page generator. Keep their
// experiments in delimited sections so regeneration preserves each proof.
const fs = require('node:fs');
const path = require('node:path');
const {renderInterpretation, interpretationAssets} = require('./episode-interpretations.cjs');
const root = path.resolve(__dirname, '../proof-episodes');
const rev = '20261026-physical-interpretations-v2';
const slots = {
  content: ['<!-- BEGIN ORIGINAL EPISODE PHYSICAL SECTION -->', '<!-- END ORIGINAL EPISODE PHYSICAL SECTION -->'],
  style: ['<!-- BEGIN PHYSICAL STYLE -->', '<!-- END PHYSICAL STYLE -->'],
  scripts: ['<!-- BEGIN PHYSICAL SCRIPTS -->', '<!-- END PHYSICAL SCRIPTS -->'],
  jump: ['<!-- BEGIN PHYSICAL JUMP -->', '<!-- END PHYSICAL JUMP -->']
};
function removeSlot(html, [begin, end]) {
  const first = html.indexOf(begin), last = html.indexOf(end);
  if (first < 0 && last < 0) return html;
  if (first < 0 || last < first) throw new Error('Unclosed generated section: ' + begin);
  return html.slice(0, first) + html.slice(last + end.length).replace(/^\n/, '');
}
const wrap = (slot, text) => `${slots[slot][0]}\n${text}\n${slots[slot][1]}\n`;
for (const slug of ['centroid', 'circumcenter', 'orthocenter']) {
  const file = path.join(root, slug, 'index.html');
  let html = fs.readFileSync(file, 'utf8');
  for (const slot of Object.values(slots)) html = removeSlot(html, slot);
  const assets = interpretationAssets(slug, rev);
  html = html.replace('</head>', wrap('style', assets.style) + '</head>');
  html = html.replace(/<main>\n*/, '<main>\n' + wrap('jump', '<p class="physical-jump"><a href="#alternate-interpretation">Explore an alternate interpretation</a></p>'));
  const content = wrap('content', renderInterpretation(slug));
  if (html.includes('<!-- BEGIN BOOK REFERENCE -->')) {
    html = html.replace('<!-- BEGIN BOOK REFERENCE -->', content + '<!-- BEGIN BOOK REFERENCE -->');
  } else html = html.replace('</main>', content + '</main>');
  html = html.replace('</body>', wrap('scripts', `<script src="../shared/geometry.js?v=${rev}"></script>\n${assets.scripts}`) + '</body>');
  fs.writeFileSync(file, html);
}
console.log('Built alternate interpretations for the three original episodes.');
