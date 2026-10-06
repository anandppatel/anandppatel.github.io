'use strict';
const references=require('./episode-references.json');
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const begin='<!-- BEGIN BOOK REFERENCE -->',end='<!-- END BOOK REFERENCE -->';
function renderReference(slug){
 const items=references.episodes[slug];if(!items)return '';
 const b=references.book;
 return `${begin}
<section class="book-reference" id="venema-reference" aria-labelledby="venema-title">
<h2 id="venema-title">Read in Venema</h2>
<p class="book-citation">${escape(b.author)}, <cite><a href="${escape(b.url)}">${escape(b.title)}</a></cite> (${b.year}).</p>
<ul>${items.map(r=>`<li><span class="book-location">§${escape(r.section)} · ${escape(r.sectionTitle)}</span><span class="book-statement">${escape(r.statement)}, <strong>p. ${r.page}</strong> <span class="book-pdf-page">(PDF page ${r.pdfPage})</span>.</span></li>`).join('\n')}</ul>
<p class="book-reference-note">Page numbers refer to the printed pages of the 2013 edition; PDF page numbers count from the beginning of the file.</p>
</section>
${end}`;
}
function referenceStyle(slug){return references.episodes[slug]?'<link rel="stylesheet" href="../shared/book-references.css?v=20261006-venema-v1">':'';}
module.exports={renderReference,referenceStyle,begin,end};
