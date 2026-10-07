#!/usr/bin/env python3
"""Build the student history page from verified source notes; no browser scripts."""
import json
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = json.loads((ROOT / '.github/episode-history.json').read_text())
entries = DATA['entries']
ids = [entry['id'] for entry in entries]
assert len(ids) == len(set(ids)), 'History anchors must be unique'
covered = {episode['slug'] for entry in entries for episode in entry['episodes']}
assert len(covered) == 10, 'History should cover all ten current episodes'

sections = []
for entry in entries:
    paragraphs = '\n'.join(f'<p>{escape(p)}</p>' for p in entry['paragraphs'])
    sources = '\n'.join(
        f'<li><span class="source-kind">{escape(source["kind"])}</span> '
        f'<a href="{escape(source["url"], quote=True)}">{escape(source["title"])}</a>'
        f'<span class="source-location">{escape(source["location"])}</span></li>'
        for source in entry['sources']
    )
    episodes = ' <span aria-hidden="true">·</span> '.join(
        f'<a href="../{escape(episode["slug"])}/">{escape(episode["label"])}</a>'
        for episode in entry['episodes']
    )
    sections.append(f'''<section class="history-entry" id="{entry['id']}" aria-labelledby="{entry['id']}-title">
<p class="period">{escape(entry['period'])}</p>
<h2 id="{entry['id']}-title">{escape(entry['title'])}</h2>
{paragraphs}
<div class="source-box"><h3>Read the sources</h3><ul>{sources}</ul></div>
<p class="episode-links">Explore: {episodes}</p>
</section>''')

navigation = '\n'.join(f'<li><a href="#{entry["id"]}">{escape(entry["shortTitle"])}</a></li>' for entry in entries)
html = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="description" content="Early surviving accounts of triangle centers and classical geometry, with precise references to original texts, translations, and historical scholarship.">
<title>Historical notes — Proof episodes — Anand Patel</title>
<link rel="stylesheet" href="../../style.css">
<link rel="stylesheet" href="history.css?v=20261007">
</head>
<body>
<a class="skip-link" href="#centroid">Skip to the historical notes</a>
<header><div class="header-inner"><p class="site-wordmark"><a href="../../">Anand Patel</a></p><nav aria-label="Breadcrumb"><a href="../">Proof episodes</a><span aria-hidden="true"> / </span>History</nav></div></header>
<main>
<div class="history-heading"><p class="eyebrow">Texts · People · Transmission</p><h1>Historical notes</h1>
<p class="lead">Early surviving accounts of the triangle centers and the results in our proof episodes.</p></div>
<aside class="reading-note" aria-label="How to read these references">
<p>A theorem’s name need not identify its first discoverer. These notes distinguish an early text we can locate from a later attribution. They do not claim to settle priority in every case.</p>
<p>Ancient dates refer approximately to the works, not to the surviving manuscripts or modern translations. Each source gives a book, proposition, section, or printed page to help you find the result. The episodes use modern notation and may give a different proof.</p>
</aside>
<nav class="topic-nav" aria-label="Find a historical note"><h2>Find a result</h2><ul>{navigation}</ul></nav>
{''.join(sections)}
<p class="history-footer"><a href="../">← All proof episodes</a><span>Sources checked {escape(DATA['checked'])}</span></p>
</main>
<footer><div class="footer-inner">Anand Patel · Proof episodes · History</div></footer>
</body>
</html>
'''
folder = ROOT / 'proof-episodes/history'
folder.mkdir(exist_ok=True)
(folder / 'index.html').write_text(html)
print(f'Built {len(entries)} historical notes covering {len(covered)} episodes.')
