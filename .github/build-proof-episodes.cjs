#!/usr/bin/env node
// Regenerate the shared-engine episodes and All Centers playground.
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const slugs=['incenter','euler-line','angle-bisector','thales','nine-point-circle','nine-point-circle-altitudes','ceva','all-centers'];
const rev='20261002-build-v1';
const escape=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const lessons=slugs.map(slug=>{const window={};if(slug==='all-centers')vm.runInNewContext(fs.readFileSync(path.join(root,'proof-episodes/shared/geometry-catalog.js'),'utf8'),{window});vm.runInNewContext(fs.readFileSync(path.join(root,'proof-episodes',slug,'episode.js'),'utf8'),{window});return window.ProofEpisode;});
for(let i=0;i<lessons.length;i++){
 const c=lessons[i],slug=slugs[i],prev=i?lessons[i-1]:{slug:'orthocenter',title:'The orthocenter'},next=lessons[i+1];
 const sidebar=c.studio?`<aside class="sidebar studio-sidebar"><section><p class="kicker">Choose what to show</p><h2>Centers &amp; constructions</h2><p class="small">Each switch adds or removes just that object. Drag A, B, or C to change the triangle.</p><div id="studio-controls"></div>${(c.notes||[]).map(n=>`<details><summary>${escape(n.title)}</summary><p>${escape(n.body)}</p></details>`).join('')}</section></aside>`:`<aside class="sidebar">
<section><p class="kicker">The theorem</p><h2>${escape(c.title)}</h2><p>${escape(c.observation)}</p></section>
<section><p class="kicker">Before the proof</p><p>${escape(c.prediction)}</p><button class="primary" id="proof-start" type="button" disabled aria-controls="proof-panel" aria-expanded="false">See the proof</button><p class="small" id="proof-gate">Build the diagram first, then follow the proof one sentence at a time.</p></section>
<section><h2>What we use</h2><ul>${(c.prerequisites||[]).map(p=>`<li><a href="${escape(p.href)}">${escape(p.label)}</a></li>`).join('')}</ul>${(c.notes||[]).map(n=>`<details><summary>${escape(n.title)}</summary><p>${escape(n.body)}</p></details>`).join('')}</section>
</aside>`;
 const html=`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="description" content="${escape(c.observation)}">
<title>${escape(c.title)} — Proof episodes — Anand Patel</title>
<link rel="stylesheet" href="../shared/episode.css?v=${rev}">
</head>
<body>
<header><div><p class="eyebrow"><a href="../">Proof episodes</a> / ${c.studio?'Geometry playground':'Episode '+String(i+4).padStart(2,'0')}</p><h1>${escape(c.title)}</h1></div><p class="header-note">${escape(c.subtitle)}</p></header>
<main><div class="workspace${c.studio?' studio':''}" id="workspace">
<section aria-label="Interactive triangle">
<div class="drawing">
<div class="toolbar"><p><strong>Move the triangle.</strong><br>Drag a vertex to explore.</p><div class="toolbar-buttons"><button id="fit" type="button">Fit construction</button><button id="fit-triangle" type="button">Fit triangle</button><button id="reset" type="button">Reset</button><div class="extra-controls" id="extra-controls"></div></div></div>
<div class="board" id="board"><svg id="diagram" role="img" aria-labelledby="diagram-title diagram-desc"><title id="diagram-title">${escape(c.title)}: an interactive construction in triangle ABC</title><desc id="diagram-desc">${escape(c.observation)}</desc><g id="scene"></g></svg></div>
<p class="notice" id="notice" role="status" hidden></p><p class="status" id="status" role="status"></p>
<div class="overview" id="overview" hidden><div><strong>The construction extends beyond this view.</strong><p>This overview shows the same figure. Use Fit construction to bring it into the main drawing.</p></div><svg viewBox="0 0 220 165" role="img" aria-label="Overview of the full construction"><g id="overview-scene"></g></svg></div>
${c.studio?'':`<section class="build-panel" id="build-panel" aria-label="Step-by-step construction">
<div class="build-top"><h2>Build the diagram</h2><span id="build-progress">0 / 0</span></div>
<p id="build-caption" class="build-caption" aria-live="polite">Start with triangle ABC.</p>
<div class="build-steps" id="build-steps"></div>
<p class="proof-pause" id="build-pause" hidden>Move a vertex off the line to continue the construction.</p>
<div class="build-controls"><button id="build-prev" type="button">Undo a step</button><button id="build-reset" type="button">Start over</button><button id="build-proof" type="button" class="primary" hidden>See why it works</button></div>
</section>`}
<section id="proof-panel" class="proof-panel" aria-label="Guided proof" hidden>
<div class="proof-top"><strong id="proof-stage"></strong><span id="proof-progress"></span><button id="proof-close" type="button">Close proof</button></div>
<div aria-live="polite" aria-atomic="true"><p class="proof-sentence" id="proof-sentence"></p><div class="proof-equation" id="proof-equation"></div></div>
<p class="proof-pause" id="proof-pause" role="status" hidden></p><p class="proof-key" id="proof-key"></p>
<div class="proof-controls"><button id="proof-prev" type="button">Previous</button><button id="proof-next" class="primary" type="button">Next sentence</button></div>
<p class="after-question" id="after-question" hidden></p>
</section></div>
<p class="keyboard-hint" id="keyboard-help">Use a mouse or touch. Focus a labeled point and use the arrow keys; hold Shift for larger steps. Measurements illustrate the construction; the argument proves it.</p>
<p id="announcement" class="sr-only" aria-live="polite"></p>
</section>
${sidebar}</div>
<nav class="episode-nav" aria-label="Episode order"><a href="../${escape(prev.slug)}/">← ${escape(prev.title)}</a>${next?`<a href="../${escape(next.slug)}/">${escape(next.title)} →</a>`:'<a href="../">All proof episodes →</a>'}</nav>
</main>
<script src="../shared/geometry.js?v=${rev}"></script>${c.studio?`<script src="../shared/geometry-catalog.js?v=${rev}"></script>`:`<script src="../shared/constructions.js?v=${rev}"></script>`}<script src="episode.js?v=${rev}"></script><script src="../shared/episode.js?v=${rev}"></script>
</body></html>
`;
 fs.writeFileSync(path.join(root,'proof-episodes',slug,'index.html'),html);
}
console.log(`Built ${lessons.length} episode and playground pages.`);
