#!/usr/bin/env python3
"""
Stacks-project-style HTML compiler.

Usage:
    python3 compile.py papers/hodge-bundle/source.tex

Reads a skeletal LaTeX file and generates a mini Stacks-project site:
  - index.html        (table of contents + tag table)
  - section/*.html    (one page per section/subsection)
  - tag/*.html        (one page per labeled environment)

Tags are deterministic 4-hex-char hashes of the label string, stored in
papers/tag-registry.json to prevent collisions across papers.

The .tex file must use:
  - \\title{...}, \\author{...}
  - \\section{...}, \\subsection{...}
  - \\begin{theorem/lemma/definition/commentary/proof}...\\end{...}
  - \\label{...} on each environment
  - \\begin{proof}[Proof of Theorem~\\ref{...}] for named proofs
  - Standard math ($...$, \\[...\\], $$...$$)

Metadata is provided via a companion .json file (same name as .tex but
with .json extension), or via command-line flags. The .json should contain:
  {
    "arxiv": "2603.19052",
    "journal": "...",
    "slug": "hodge-bundle"
  }
If no .json exists, defaults are derived from the directory name.
"""

import os
import re
import sys
import json
import hashlib

# ============================================================
# CONFIGURATION
# ============================================================

SITE_ROOT = os.path.dirname(os.path.abspath(__file__))
TAG_REGISTRY_PATH = os.path.join(SITE_ROOT, "papers", "tag-registry.json")
FORMSUBMIT_EMAIL = "anand.patel@okstate.edu"


def load_registry():
    if os.path.exists(TAG_REGISTRY_PATH):
        with open(TAG_REGISTRY_PATH) as f:
            return json.load(f)
    return {}


def save_registry(reg):
    os.makedirs(os.path.dirname(TAG_REGISTRY_PATH), exist_ok=True)
    with open(TAG_REGISTRY_PATH, "w") as f:
        json.dump(reg, f, indent=2)


def label_to_tag(label, existing_tags):
    """Deterministic 4-char hex tag from a label string.
    Uses SHA-256 and takes the first 4 hex chars (uppercase) that
    don't collide with existing tags. If the first 4 collide, we
    try successive 4-char windows."""
    h = hashlib.sha256(label.encode()).hexdigest().upper()
    for i in range(0, len(h) - 3):
        candidate = h[i:i+4]
        if candidate not in existing_tags:
            return candidate
    # Extremely unlikely fallback: hash with salt
    for salt in range(1000):
        h2 = hashlib.sha256(f"{label}:{salt}".encode()).hexdigest().upper()
        candidate = h2[:4]
        if candidate not in existing_tags:
            return candidate
    raise RuntimeError(f"Cannot find unique tag for label {label}")


# ============================================================
# LATEX PARSER
# ============================================================

ENV_TYPES = {
    "theorem": "Theorem",
    "lemma": "Lemma",
    "definition": "Definition",
    "commentary": "Commentary",
    "proof": "Proof",
}


def parse_tex(tex_source):
    """Parse a skeletal .tex file into a structured document dict."""

    # Extract metadata
    title_m = re.search(r'\\title\{([^}]+)\}', tex_source)
    author_m = re.search(r'\\author\{([^}]+)\}', tex_source)
    title = title_m.group(1) if title_m else "Untitled"
    author = author_m.group(1) if author_m else "Unknown"

    # Extract body (between \begin{document} and \end{document})
    body_m = re.search(r'\\begin\{document\}(.*?)\\end\{document\}', tex_source, re.DOTALL)
    if not body_m:
        raise ValueError("Cannot find \\begin{document}...\\end{document}")
    body = body_m.group(1)

    # Remove \maketitle
    body = re.sub(r'\\maketitle', '', body)

    # Parse into sections
    sections = parse_sections(body)

    return {"title": title, "author": author, "sections": sections}


def parse_sections(body):
    """Split body into sections and subsections."""
    # Split on \section{...}
    sec_pattern = r'\\section\{([^}]+)\}'
    sec_splits = re.split(sec_pattern, body)

    # sec_splits: [preamble, title1, content1, title2, content2, ...]
    sections = []
    sec_num = 0
    for i in range(1, len(sec_splits), 2):
        sec_num += 1
        sec_title = sec_splits[i].strip()
        sec_content = sec_splits[i+1] if i+1 < len(sec_splits) else ""

        # Split subsections
        sub_pattern = r'\\subsection\{([^}]+)\}'
        sub_splits = re.split(sub_pattern, sec_content)

        # sub_splits: [pre-subsection content, sub_title1, sub_content1, ...]
        pre_content = sub_splits[0]
        subsections = []
        sub_num = 0
        for j in range(1, len(sub_splits), 2):
            sub_num += 1
            sub_title = sub_splits[j].strip()
            sub_content = sub_splits[j+1] if j+1 < len(sub_splits) else ""
            subsections.append({
                "id": f"S{sec_num}.SS{sub_num}",
                "number": f"{sec_num}.{sub_num}",
                "title": sub_title,
                "blocks": parse_blocks(sub_content, sec_num),
            })

        sections.append({
            "id": f"S{sec_num}",
            "number": str(sec_num),
            "title": sec_title,
            "blocks": parse_blocks(pre_content, sec_num),
            "subsections": subsections,
        })

    return sections


def parse_blocks(content, sec_num):
    """Parse content into a list of paragraph and environment blocks."""
    blocks = []
    content = content.strip()
    if not content:
        return blocks

    # Pattern to match \begin{env}...\end{env} including optional [...]
    env_pattern = re.compile(
        r'\\begin\{(' + '|'.join(ENV_TYPES.keys()) + r')\}'
        r'(\[[^\]]*\])?'  # optional argument like [Proof of Theorem~\ref{...}]
        r'(.*?)'
        r'\\end\{\1\}',
        re.DOTALL
    )

    pos = 0
    for m in env_pattern.finditer(content):
        # Text before this environment = paragraph(s)
        pre = content[pos:m.start()].strip()
        if pre:
            for para in split_paragraphs(pre):
                blocks.append({"type": "para", "content": tex_to_html(para)})

        env_name = m.group(1)
        opt_arg = m.group(2)  # e.g., [Proof of Theorem~\ref{thm:main}]
        env_body = m.group(3).strip()

        # Extract \label{...} from the environment body
        label = None
        label_m = re.search(r'\\label\{([^}]+)\}', env_body)
        if label_m:
            label = label_m.group(1)
            env_body = env_body[:label_m.start()] + env_body[label_m.end():]
            env_body = env_body.strip()

        # Determine display type
        display_type = ENV_TYPES[env_name]
        if env_name == "proof" and opt_arg:
            # Named proof, e.g., [Proof of Theorem~\ref{thm:main}]
            inner = opt_arg[1:-1]  # strip [ ]
            display_type = tex_to_html(inner)

        block = {
            "type": "env",
            "envType": display_type,
            "envName": env_name,
            "content": tex_to_html(env_body),
            "label": label,
        }
        blocks.append(block)
        pos = m.end()

    # Trailing text after last environment
    trailing = content[pos:].strip()
    if trailing:
        for para in split_paragraphs(trailing):
            blocks.append({"type": "para", "content": tex_to_html(para)})

    return blocks


def split_paragraphs(text):
    """Split text on blank lines into paragraphs."""
    paras = re.split(r'\n\s*\n', text.strip())
    return [p.strip() for p in paras if p.strip()]


def tex_to_html(tex):
    """Convert LaTeX markup to HTML for MathJax rendering."""
    s = tex

    # \emph{...} -> <em>...</em>
    s = re.sub(r'\\emph\{([^}]*)\}', r'<em>\1</em>', s)

    # \textbf{...} -> <strong>...</strong>
    s = re.sub(r'\\textbf\{([^}]*)\}', r'<strong>\1</strong>', s)

    # \textit{...} -> <em>...</em>
    s = re.sub(r'\\textit\{([^}]*)\}', r'<em>\1</em>', s)

    # \ref{...} -> leave as-is for now; we'll resolve in a post-pass
    # Actually, for MathJax pages we just display the number.
    # We handle \ref resolution in the tag assignment phase.

    # Theorem~\ref{...} etc. — keep the ~ as non-breaking space
    s = s.replace('~', '&nbsp;')

    # \[ ... \] -> $$ ... $$  (MathJax display math)
    s = re.sub(r'\\\[', '$$', s)
    s = re.sub(r'\\\]', '$$', s)

    # -- -> &ndash;   --- -> &mdash;
    s = s.replace('---', '&mdash;')
    s = s.replace('--', '&ndash;')

    # \"u -> ü etc. (common in this paper: Teichmüller)
    s = s.replace('\\"u', '&uuml;')
    s = s.replace('\\"o', '&ouml;')
    s = s.replace('\\"a', '&auml;')

    # \square at end of proofs — remove since we handle QED styling
    s = re.sub(r'\s*\\square\s*', '', s)

    # Newlines -> <br> for paragraph breaks within environments
    # (Double newlines become paragraph breaks)
    s = re.sub(r'\n\s*\n', '</p>\n<p>', s)

    return s.strip()


# ============================================================
# TAG ASSIGNMENT & REF RESOLUTION
# ============================================================

def assign_tags_and_numbers(paper, slug, registry, existing_tags):
    """Walk the parsed paper, assign tags and environment numbers,
    and resolve \\ref{} cross-references."""

    # First pass: collect all labeled environments and assign tags + numbers
    label_map = {}  # label -> {tag, number, envType, ...}
    env_counter = {}  # per-section counters for theorem-like envs

    all_envs = []  # ordered list of all tagged environments

    for sec in paper["sections"]:
        sec_n = int(sec["number"])
        env_counter[sec_n] = 0

        def process_blocks(blocks):
            for block in blocks:
                if block["type"] != "env":
                    continue
                if block["envName"] == "proof":
                    # Proofs get tags but not theorem-style numbers
                    label = block.get("label")
                    if label:
                        tag = label_to_tag(label, existing_tags)
                        existing_tags.add(tag)
                        block["tag"] = tag
                        block["number"] = ""
                        label_map[label] = {
                            "tag": tag,
                            "number": "",
                            "envType": block["envType"],
                        }
                        registry[tag] = {
                            "paper": slug,
                            "label": label,
                            "envType": block["envType"],
                            "number": "",
                        }
                        all_envs.append(block)
                else:
                    # Theorem-like environments get numbered
                    env_counter[sec_n] += 1
                    number = f"{sec_n}.{env_counter[sec_n]}"
                    block["number"] = number

                    label = block.get("label")
                    if label:
                        tag = label_to_tag(label, existing_tags)
                        existing_tags.add(tag)
                        block["tag"] = tag
                        label_map[label] = {
                            "tag": tag,
                            "number": number,
                            "envType": block["envType"],
                        }
                        registry[tag] = {
                            "paper": slug,
                            "label": label,
                            "envType": block["envType"],
                            "number": number,
                        }
                        all_envs.append(block)

        process_blocks(sec["blocks"])
        for sub in sec["subsections"]:
            process_blocks(sub["blocks"])

    # Second pass: resolve \ref{...} in all content
    def resolve_refs(html):
        def ref_replacer(m):
            label = m.group(1)
            if label in label_map:
                info = label_map[label]
                tag = info["tag"]
                number = info["number"]
                display = number if number else info["envType"]
                return display
            return f"??{label}"
        return re.sub(r'\\ref\{([^}]+)\}', ref_replacer, html)

    for sec in paper["sections"]:
        for block in sec["blocks"]:
            if "content" in block:
                block["content"] = resolve_refs(block["content"])
            if "envType" in block:
                block["envType"] = resolve_refs(block["envType"])
        for sub in sec["subsections"]:
            for block in sub["blocks"]:
                if "content" in block:
                    block["content"] = resolve_refs(block["content"])
                if "envType" in block:
                    block["envType"] = resolve_refs(block["envType"])

    # Also update the registry with resolved envType names
    for env in all_envs:
        tag = env.get("tag")
        if tag and tag in registry:
            registry[tag]["envType"] = env["envType"]

    return all_envs, label_map


# ============================================================
# HTML GENERATION
# ============================================================

def head(title, paper_title, depth=0):
    prefix = "../" * depth
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title} &mdash; {paper_title}</title>
  <link rel="stylesheet" href="{prefix}../../style.css">
  <link rel="stylesheet" href="{prefix}stacks.css">
  <script>
    window.MathJax = {{
      tex: {{
        inlineMath: [['$', '$']],
        displayMath: [['$$', '$$']],
        macros: {{
          operatorname: ['\\\\mathrm{{#1}}', 1]
        }}
      }},
      svg: {{ fontCache: 'global' }}
    }};
  </script>
  <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js" async></script>
</head>
<body>
"""


def nav_bar(author, paper_title, depth=0):
    prefix = "../" * depth
    return f"""<header class="stacks-header">
  <div class="stacks-header-inner">
    <a href="{prefix}../../index.html" class="stacks-home-link">{author}</a>
    <span class="stacks-separator">&rsaquo;</span>
    <a href="{prefix}index.html" class="stacks-paper-link">{paper_title}</a>
  </div>
</header>
"""


def breadcrumb_html(items, depth=0):
    prefix = "../" * depth
    parts = [f'<a href="{prefix}index.html">Table of contents</a>']
    for label, href in items:
        if href:
            parts.append(f'<a href="{prefix}{href}">{label}</a>')
        else:
            parts.append(f'<span>{label}</span>')
    return '<div class="stacks-breadcrumb">' + ' / '.join(parts) + '</div>\n'


def footer_html(arxiv_id):
    return f"""<footer class="stacks-footer">
  <div class="stacks-footer-inner">
    &copy; 2025 Anand Patel &middot; <a href="https://arxiv.org/abs/{arxiv_id}">arXiv:{arxiv_id}</a>
  </div>
</footer>
</body>
</html>"""


def render_block(block, depth=0):
    prefix = "../" * depth
    if block["type"] == "para":
        return f'<p class="stacks-para">{block["content"]}</p>\n'
    elif block["type"] == "env":
        tag = block.get("tag", "")
        env_type = block["envType"]
        number = block.get("number", "")

        # CSS class
        if block.get("envName") == "proof":
            css_class = "stacks-proof"
        elif env_type == "Theorem":
            css_class = "stacks-theorem"
        elif env_type == "Lemma":
            css_class = "stacks-lemma"
        elif env_type == "Definition":
            css_class = "stacks-definition"
        elif env_type == "Commentary":
            css_class = "stacks-commentary"
        else:
            css_class = "stacks-env"

        tag_link = f' <a href="{prefix}tag/{tag}.html" class="stacks-tag-link">({tag})</a>' if tag else ''

        # Label text
        if block.get("envName") == "proof":
            label_text = f"{env_type}." if env_type == "Proof" else f"{env_type}."
            head_html = f'<em>{label_text}</em>{tag_link}'
        else:
            label_text = f"{env_type}" + (f"&nbsp;{number}" if number else "")
            head_html = f'<strong>{label_text}.</strong>{tag_link}'

        eid = block.get("label", "").replace(":", "-") or ""

        return f"""<div class="{css_class}" id="{eid}">
  <div class="stacks-env-head">{head_html}</div>
  <div class="stacks-env-body"><p>{block["content"]}</p></div>
</div>
"""
    return ""


def comment_form(page_label, return_url, paper_title):
    return f"""
<hr>
<div class="stacks-comments">
  <h3>Comments</h3>
  <p class="stacks-comments-empty">No comments yet.</p>
  <div class="stacks-comment-form">
    <h4>Leave a comment</h4>
    <p>Comments are reviewed before appearing. Your comment will be emailed to the author for approval.</p>
    <form action="https://formsubmit.co/{FORMSUBMIT_EMAIL}" method="POST">
      <input type="hidden" name="_subject" value="Comment on {paper_title} &mdash; {page_label}">
      <input type="hidden" name="_next" value="{return_url}">
      <input type="hidden" name="_captcha" value="true">
      <label for="name">Name:</label>
      <input type="text" id="name" name="name" required>
      <label for="comment">Comment:</label>
      <textarea id="comment" name="comment" rows="5" required placeholder="You may use LaTeX: $..$ for inline, $$...$$ for display."></textarea>
      <button type="submit">Submit comment</button>
    </form>
  </div>
</div>
"""


# ============================================================
# MAIN
# ============================================================

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 compile.py papers/<slug>/source.tex")
        sys.exit(1)

    tex_path = sys.argv[1]
    if not os.path.isabs(tex_path):
        tex_path = os.path.join(SITE_ROOT, tex_path)

    out_dir = os.path.dirname(tex_path)
    slug = os.path.basename(out_dir)

    # Load optional metadata .json
    meta_path = tex_path.replace('.tex', '.json')
    meta = {}
    if os.path.exists(meta_path):
        with open(meta_path) as f:
            meta = json.load(f)

    arxiv_id = meta.get("arxiv", "")
    journal = meta.get("journal", "")
    base_url = f"https://anandpatel.github.io/papers/{slug}"

    # Read and parse .tex
    with open(tex_path) as f:
        tex_source = f.read()

    paper = parse_tex(tex_source)
    print(f"Parsed: {paper['title']} by {paper['author']}")
    print(f"  {len(paper['sections'])} sections")

    # Assign tags
    registry = load_registry()
    # Remove old tags for this paper (allows clean rebuild)
    registry = {k: v for k, v in registry.items() if v.get("paper") != slug}
    existing_tags = set(registry.keys())

    all_envs, label_map = assign_tags_and_numbers(paper, slug, registry, existing_tags)
    save_registry(registry)

    print(f"  {len(all_envs)} tagged environments")
    for env in all_envs:
        print(f"    Tag {env['tag']}: {env['envType']} {env.get('number','')}")

    # Create output dirs
    os.makedirs(os.path.join(out_dir, "tag"), exist_ok=True)
    os.makedirs(os.path.join(out_dir, "section"), exist_ok=True)

    # --- 1. Table of Contents ---
    toc = head("Table of Contents", paper["title"])
    toc += nav_bar(paper["author"], paper["title"])
    toc += '<main class="stacks-main">\n'
    toc += f'<h1 class="stacks-paper-title">{paper["title"]}</h1>\n'
    toc += f'<p class="stacks-paper-author">{paper["author"]}</p>\n'
    if journal or arxiv_id:
        toc += f'<p class="stacks-paper-meta">'
        if journal:
            toc += journal
        if arxiv_id:
            if journal:
                toc += '<br>'
            toc += f'<a href="https://arxiv.org/abs/{arxiv_id}">arXiv:{arxiv_id}</a>'
        toc += '</p>\n'
    toc += '<hr>\n<h2 class="stacks-toc-heading">Table of Contents</h2>\n'
    toc += '<ul class="stacks-toc">\n'

    for sec in paper["sections"]:
        toc += f'  <li><a href="section/{sec["id"]}.html">Section {sec["number"]}: {sec["title"]}</a>\n'
        if sec["subsections"]:
            toc += '    <ul>\n'
            for sub in sec["subsections"]:
                toc += f'      <li><a href="section/{sub["id"]}.html">{sub["number"]}. {sub["title"]}</a></li>\n'
            toc += '    </ul>\n'
        toc += '  </li>\n'
    toc += '</ul>\n'

    # Tag table
    toc += '<hr>\n<h2 class="stacks-toc-heading">Tags</h2>\n'
    toc += '<table class="stacks-tag-table">\n'
    toc += '<tr><th>Tag</th><th>Type</th><th>Number</th></tr>\n'
    for env in all_envs:
        toc += f'<tr><td><a href="tag/{env["tag"]}.html">{env["tag"]}</a></td>'
        toc += f'<td>{env["envType"]}</td><td>{env.get("number","")}</td></tr>\n'
    toc += '</table>\n</main>\n'
    toc += footer_html(arxiv_id)

    with open(os.path.join(out_dir, "index.html"), "w") as f:
        f.write(toc)
    print("Generated: index.html")

    # --- 2. Section pages ---
    for sec in paper["sections"]:
        sec_html = head(f'Section {sec["number"]}', paper["title"], depth=1)
        sec_html += nav_bar(paper["author"], paper["title"], depth=1)
        sec_html += breadcrumb_html(
            [(f'Section {sec["number"]}: {sec["title"]}', None)], depth=1)
        sec_html += '<main class="stacks-main">\n'
        sec_html += f'<h1 class="stacks-section-title">Section {sec["number"]}. {sec["title"]}</h1>\n'

        for block in sec["blocks"]:
            sec_html += render_block(block, depth=1)

        if sec["subsections"]:
            sec_html += '<h2 class="stacks-subsections-heading">Subsections</h2>\n<ul>\n'
            for sub in sec["subsections"]:
                sec_html += f'  <li><a href="{sub["id"]}.html">{sub["number"]}. {sub["title"]}</a></li>\n'
            sec_html += '</ul>\n'

        sec_html += comment_form(
            f'Section {sec["number"]}: {sec["title"]}',
            f'{base_url}/section/{sec["id"]}.html',
            paper["title"])
        sec_html += '</main>\n' + footer_html(arxiv_id)

        with open(os.path.join(out_dir, "section", f'{sec["id"]}.html'), "w") as f:
            f.write(sec_html)
        print(f"Generated: section/{sec['id']}.html")

        for sub in sec["subsections"]:
            sub_html = head(f'{sub["number"]}. {sub["title"]}', paper["title"], depth=1)
            sub_html += nav_bar(paper["author"], paper["title"], depth=1)
            sub_html += breadcrumb_html([
                (f'Section {sec["number"]}: {sec["title"]}', f'section/{sec["id"]}.html'),
                (f'{sub["number"]}. {sub["title"]}', None),
            ], depth=1)
            sub_html += '<main class="stacks-main">\n'
            sub_html += f'<h1 class="stacks-section-title">{sub["number"]}. {sub["title"]}</h1>\n'

            for block in sub["blocks"]:
                sub_html += render_block(block, depth=1)

            sub_html += comment_form(
                f'{sub["number"]}. {sub["title"]}',
                f'{base_url}/section/{sub["id"]}.html',
                paper["title"])
            sub_html += '</main>\n' + footer_html(arxiv_id)

            with open(os.path.join(out_dir, "section", f'{sub["id"]}.html'), "w") as f:
                f.write(sub_html)
            print(f"Generated: section/{sub['id']}.html")

    # --- 3. Tag pages ---
    for idx, env in enumerate(all_envs):
        tag = env["tag"]
        env_type = env["envType"]
        number = env.get("number", "")
        label_text = f"{env_type}" + (f" {number}" if number else "")

        # Find parent section/subsection
        parent_sec = None
        parent_sub = None
        for sec in paper["sections"]:
            for b in sec["blocks"]:
                if b.get("tag") == tag:
                    parent_sec = sec
            for sub in sec["subsections"]:
                for b in sub["blocks"]:
                    if b.get("tag") == tag:
                        parent_sec = sec
                        parent_sub = sub

        bc_items = []
        if parent_sec:
            bc_items.append((
                f'Section {parent_sec["number"]}: {parent_sec["title"]}',
                f'section/{parent_sec["id"]}.html'))
        if parent_sub:
            bc_items.append((
                f'{parent_sub["number"]}. {parent_sub["title"]}',
                f'section/{parent_sub["id"]}.html'))
        bc_items.append((f'{label_text} ({tag})', None))

        tag_html = head(f'{label_text} ({tag})', paper["title"], depth=1)
        tag_html += nav_bar(paper["author"], paper["title"], depth=1)
        tag_html += breadcrumb_html(bc_items, depth=1)
        tag_html += '<main class="stacks-main">\n'

        # Prev / Next
        nav_links = '<div class="stacks-tag-nav">'
        if idx > 0:
            pt = all_envs[idx - 1]
            pn = pt.get("number", "")
            nav_links += f'<a href="{pt["tag"]}.html">&laquo; {pt["envType"]} {pn}</a>'
        nav_links += f'<span class="stacks-tag-current">Tag {tag}</span>'
        if idx < len(all_envs) - 1:
            nt = all_envs[idx + 1]
            nn = nt.get("number", "")
            nav_links += f'<a href="{nt["tag"]}.html">{nt["envType"]} {nn} &raquo;</a>'
        nav_links += '</div>\n'
        tag_html += nav_links

        tag_html += render_block(env, depth=1)

        tag_html += comment_form(
            f'Tag {tag} ({label_text})',
            f'{base_url}/tag/{tag}.html',
            paper["title"])
        tag_html += '</main>\n' + footer_html(arxiv_id)

        with open(os.path.join(out_dir, "tag", f'{tag}.html'), "w") as f:
            f.write(tag_html)
        print(f"Generated: tag/{tag}.html")

    print(f"\nDone! {len(all_envs)} tag pages, "
          f"{sum(1 + len(s['subsections']) for s in paper['sections'])} section pages, "
          f"1 index page.")


if __name__ == "__main__":
    main()
