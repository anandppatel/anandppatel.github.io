#!/usr/bin/env python3
"""Rebuild the static reference after editing tools.json. No third-party packages."""
import html
import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "proof-episodes" / "basics"
data = json.loads((DEST / "tools.json").read_text())

def inline(text):
    return re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", html.escape(text))

def blocks(items):
    out = []
    for item in items:
        if item["type"] == "list":
            out.append("<ul>" + "".join("<li>" + inline(s) + "</li>" for s in item["items"]) + "</ul>")
        else:
            out.append("<p>" + inline(item["text"]) + "</p>")
    return "\n".join(out)

def figures(items):
    out = []
    for f in items:
        path = DEST / "figures" / f["file"]
        if not path.is_file():
            raise ValueError(f"Missing figure {path}")
        view_box = ET.parse(path).getroot().attrib["viewBox"].split()
        width, height = (float(n) for n in view_box[2:])
        anchor = f' id="{html.escape(f["id"])}"' if f.get("id") else ""
        revision = "?v=20261002-facts" if f["file"] in {"c3.svg", "t5.svg"} else ""
        out.append(f'<figure{anchor}><img src="figures/{html.escape(f["file"])}{revision}" alt="{html.escape(f["alt"], quote=True)}" width="{width:g}" height="{height:g}" loading="lazy" decoding="async"><figcaption>{inline(f["caption"])}</figcaption></figure>')
    return '<div class="illustrations">' + "\n".join(out) + "</div>"

tool_ids = [t["id"] for t in data["tools"]]
if len(set(tool_ids)) != len(tool_ids):
    raise ValueError("Tool IDs must be unique and permanent")
labels = [t["label"] for t in data["tools"]]
section_ids = {s["id"] for s in data["sections"]}
if len(set(labels)) != len(labels):
    raise ValueError("Tool labels must be unique")
if any(t["section"] not in section_ids for t in data["tools"]):
    raise ValueError("Every tool must belong to a listed section")
if any(not t["figures"] for t in data["tools"]):
    raise ValueError("Every allowed tool needs an illustration")

nav = []
sections = []
for section in data["sections"]:
    group = [t for t in data["tools"] if t["section"] == section["id"]]
    nav.append(f'<li class="nav-group"><a href="#{section["id"]}">{html.escape(section["title"])}</a><ul>')
    articles = []
    for t in group:
        nav.append(f'<li><a href="#{t["id"]}"><span>{t["label"]}</span> {html.escape(t["title"])}</a></li>')
        articles.append(f'''<article class="tool" id="{t["id"]}" aria-labelledby="{t["id"]}-title">
<div class="tool-heading"><h3 id="{t["id"]}-title"><a class="tool-label" href="#{t["id"]}" aria-label="Link to {t["label"]}">{t["label"]}</a> {html.escape(t["title"])}</h3><button class="copy-link" type="button" data-tool="{t["id"]}" aria-label="Copy link to {t["label"]}" hidden>Copy link</button></div>
<div class="statements">{blocks(t["blocks"])}</div>
{figures(t["figures"])}
</article>''')
    nav.append("</ul></li>")
    sections.append(f'<section class="tool-group" id="{section["id"]}" aria-labelledby="{section["id"]}-title"><h2 id="{section["id"]}-title">{html.escape(section["title"])}</h2>' + "\n".join(articles) + "</section>")

page = '''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="description" content="Illustrated Euclidean geometry facts that may be used without proof: constructions, congruence, similarity, area, parallel lines, and tangents.">
<title>The Basics — Proof episodes — Anand Patel</title>
<link rel="stylesheet" href="../../style.css">
<link rel="stylesheet" href="basics.css">
</head>
<body>
<a class="skip-link" href="#tools">Skip to the allowed tools</a>
<header><div class="header-inner"><h1><a href="../../">Anand Patel</a></h1><a class="collection-link" href="../">← Proof episodes</a></div></header>
<main class="basics-main">
<section class="basics-intro" aria-labelledby="page-title">
<p class="eyebrow">Geometry · Allowed tools</p>
<h2 id="page-title">The Basics</h2>
<p class="lede">Facts we may use without reproving them.</p>
<p>Use these statements in the proof episodes, checking the hypotheses each time. Cite the label and, when needed, the named rule: <a href="#t1">T1 (SAS)</a> or <a href="#o2">O2 (equal tangents)</a>. A problem may give a narrower list of allowed tools.</p>
<p class="growing-note">We will add tools as we need them. Each label has a permanent link, so earlier episodes can keep citing it.</p>
<details class="conventions"><summary>Conventions and how to read the diagrams</summary>''' + "".join("<p>" + inline(p) + "</p>" for p in data["intro"][1:]) + '''<p>The illustrations show the hypotheses and conclusions. They are not proofs.</p></details>
</section>
<div class="reference-layout">
<nav class="tool-nav" aria-label="Find a basic tool"><details open><summary>Find a tool</summary><ul>''' + "".join(nav) + '''</ul></details></nav>
<div id="tools">''' + "\n".join(sections) + '''</div>
</div>
<p class="reference-end"><a href="../">← Return to the proof episodes</a> <a href="#page-title">Back to the top ↑</a></p>
<p class="sr-only" id="copy-status" role="status" aria-live="polite"></p>
</main>
<footer><div class="footer-inner">Anand Patel · Proof episodes · The Basics</div></footer>
<script src="basics.js"></script>
</body>
</html>
'''
(DEST / "index.html").write_text(page)
print(f"Built {len(data['tools'])} tools and {sum(len(t['figures']) for t in data['tools'])} illustrations.")
