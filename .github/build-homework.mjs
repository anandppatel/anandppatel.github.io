#!/usr/bin/env node
// Install pinned build dependencies in .github/homework-build, then run this file.
// Markdown is the source; the checked-in HTML needs no client-side math library.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const here=path.dirname(fileURLToPath(import.meta.url));
const require=createRequire(path.join(here,'homework-build/package.json'));
const katex=require('katex');
const {marked}=await import(require.resolve('marked'));
const root=path.resolve(here,'..');
const folder=path.join(root,'proof-episodes/homework/triangle-geometry');
const source=fs.readFileSync(path.join(folder,'triangle-geometry.md'),'utf8');
const escape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let formulaCount=0;
let figureCount=0;
marked.use({renderer:{paragraph({tokens}){
 if(tokens.length!==1||tokens[0].type!=='image')return false;
 const {href,title,text}=tokens[0];
 const prefix='https://anandppatel.github.io/proof-episodes/homework/triangle-geometry/';
 if(!href.startsWith(prefix+'figures/')||!title||!text)throw new Error('Homework figures need a local asset, caption, and text alternative');
 const relative=href.slice(prefix.length);
 const svg=fs.readFileSync(path.join(folder,relative),'utf8');
 const viewBox=svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
 if(!viewBox)throw new Error(`Missing figure dimensions: ${relative}`);
 figureCount++;
 return `<figure class="homework-figure"><a href="${escape(relative)}"><img src="${escape(relative)}" alt="${escape(text)}" width="${viewBox[1]}" height="${viewBox[2]}" decoding="async"></a><figcaption>${escape(title)}</figcaption></figure>\n`;
}}});
function render(markdown){
 const formulas=[];
 const protectedText=markdown.replace(/\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)/g,(_,display,inline)=>{
  const block=display!==undefined;
  const token=`HWMATHTOKEN${formulas.length}END`;
  const tex=(block?display:inline).trim();
  // Independent formulas separated by a wide space can wrap as a group on phones.
  const pieces=block?tex.split(/\\qquad\s*/):[tex];
  const rendered=pieces.map(piece=>katex.renderToString(piece.trim(),{output:'mathml',displayMode:block,throwOnError:true,strict:'error',trust:false})).join('');
  formulas.push({token,block,rendered,tex});formulaCount++;
  return block?`\n\n${token}\n\n`:token;
 });
 let html=marked.parse(protectedText,{gfm:true});
 for(const {token,block,rendered,tex}of formulas){
  if(block)html=html.replace(`<p>${token}</p>`,`<div class="display-math" data-tex="${escape(tex)}">${rendered}</div>`);
  else html=html.replaceAll(token,rendered);
 }
 if(html.includes('HWMATHTOKEN'))throw new Error('Unrendered math token');
 return html;
}
const sections=source.split(/(?=^## \d+\.)/m);
const intro=sections.shift();
const title=intro.match(/^# (.+)$/m)?.[1];
if(!title||sections.length!==10)throw new Error('Expected a title and ten problems');
const problems=sections.map((section,i)=>{
 const match=section.match(/^## (\d+)\. (.+)\n/);
 if(!match||Number(match[1])!==i+1)throw new Error('Problems must remain numbered 1 through 10');
 const titleHtml=render(match[2]).replace(/^<p>/,'').replace(/<\/p>\n$/,'');
 const parts=section.slice(match[0].length).split(/^### Hints\s*$/m);
 if(parts.length!==2||!parts[1].trim())throw new Error(`Problem ${i+1} needs one Hints section`);
 const expectedParts=i===4?4:3;
 if((parts[0].match(/^\*\*\([a-d]\)\*\*/gm)||[]).length!==expectedParts)throw new Error(`Unexpected subpart count in problem ${i+1}`);
 return {number:i+1,title:match[2],titleHtml,body:render(parts[0]),hints:render(parts[1])};
});
if(figureCount!==6)throw new Error('Expected six homework figures');
const introduction=render(intro.replace(/^# .+\n/,''));
const html=`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="description" content="Ten triangle geometry homework problems from Proof episodes, with optional hints, six diagrams, and a Markdown download.">
<title>${escape(title)} — Anand Patel</title>
<link rel="stylesheet" href="../../../style.css">
<link rel="stylesheet" href="../homework.css?v=20261006-homework-hints">
</head>
<body>
<a class="skip-link" href="#problem-1">Skip to the problems</a>
<header><div class="header-inner"><p class="site-wordmark"><a href="../../../">Anand Patel</a></p><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="../../">Proof episodes</a><span aria-hidden="true"> / </span><a href="../">Homework</a></nav></div></header>
<main class="homework-main">
<div class="homework-heading"><p class="eyebrow">Problem set 01 · 10 problems</p><h1>${escape(title)}</h1>
<div class="actions"><a class="download" href="triangle-geometry.md" download="triangle-geometry.md">Download Markdown (.md)</a><button type="button" id="print-homework" hidden>Print problem set</button></div></div>
<section class="instructions" aria-label="Instructions">${introduction}</section>
<nav class="problem-nav" aria-label="Jump to a problem"><details><summary>Jump to a problem</summary><ol>${problems.map(p=>`<li><a href="#problem-${p.number}">${p.titleHtml}</a></li>`).join('')}</ol></details></nav>
<div class="problems">${problems.map(p=>`<section class="problem" id="problem-${p.number}" aria-labelledby="problem-${p.number}-title"><h2 id="problem-${p.number}-title"><a href="#problem-${p.number}">${p.number}. ${p.titleHtml}</a></h2>${p.body}<details class="homework-hints" id="hints-${p.number}"><summary>Hints for Problem ${p.number}</summary><div class="hint-content">${p.hints}</div></details></section>`).join('\n')}</div>
<nav class="homework-footer" aria-label="Homework navigation"><a href="../">← All homework</a><a href="triangle-geometry.md" download="triangle-geometry.md">Download this set as Markdown</a></nav>
</main>
<footer><div class="footer-inner">Anand Patel · Proof episodes · Homework</div></footer>
<script>
const printButton=document.getElementById('print-homework');
printButton.hidden=false;
printButton.addEventListener('click',()=>window.print());
let printHintStates;
window.addEventListener('beforeprint',()=>{
 if(printHintStates)return;
 printHintStates=[...document.querySelectorAll('.homework-hints')].map(panel=>[panel,panel.open]);
 printHintStates.forEach(([panel])=>{panel.open=true;});
});
window.addEventListener('afterprint',()=>{
 (printHintStates||[]).forEach(([panel,wasOpen])=>{panel.open=wasOpen;});
 printHintStates=undefined;
});
</script>
</body>
</html>
`;
fs.writeFileSync(path.join(folder,'index.html'),html);
console.log(`Built triangle geometry homework: ${problems.length} problems with hints, ${figureCount} figures, ${formulaCount} typeset formulas.`);
