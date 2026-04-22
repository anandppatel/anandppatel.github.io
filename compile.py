#!/usr/bin/env python3
"""
Stacks-project-style HTML compiler.

Usage:
    python3 compile.py papers/hodge-bundle/source.tex
    python3 compile.py --all     (compiles all papers listed in main.tex)

Reads a skeletal LaTeX file and generates a mini Stacks-project site:
  - index.html        (table of contents + tag table)
  - section/*.html    (one page per section/subsection)
  - tag/*.html        (one page per labeled environment)

Tags are deterministic 4-hex-char hashes of the label string, stored in
papers/tag-registry.json to prevent collisions across papers.

The .tex file must use:
  - \\title{...}, \\author{...}
  - \\section{...}, \\subsection{...}
  - \\begin{theorem/lemma/definition/commentary/proof/...}...\\end{...}
  - \\label{...} on each environment
  - Standard math ($...$, \\[...\\], $$...$$)

Metadata is provided via a companion .json file (same name as .tex but
with .json extension). The .json should contain:
  {
    "arxiv": "2603.19052",
    "journal": "...",
    "slug": "hodge-bundle",
    "citations": {"key": "Label", ...}
  }
If no .json exists, defaults are derived from the directory name.
"""

import os
import re
import sys
import json
import hashlib
import html as html_mod

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
    don't collide with existing tags."""
    h = hashlib.sha256(label.encode()).hexdigest().upper()
    for i in range(0, len(h) - 3):
        candidate = h[i:i+4]
        if candidate not in existing_tags:
            return candidate
    for salt in range(1000):
        h2 = hashlib.sha256(f"{label}:{salt}".encode()).hexdigest().upper()
        candidate = h2[:4]
        if candidate not in existing_tags:
            return candidate
    raise RuntimeError(f"Cannot find unique tag for label {label}")


# ============================================================
# PREAMBLE & CITATION PARSING
# ============================================================

def parse_preamble_macros(tex_source):
    """Extract LaTeX macro definitions from the preamble for MathJax."""
    m = re.search(r'\\begin\{document\}', tex_source)
    if not m:
        return {}
    preamble = tex_source[:m.start()]

    macros = {}

    # \newcommand{\foo}{definition} or \newcommand{\foo}[n]{definition}
    # \renewcommand{\foo}{definition} or \renewcommand{\foo}[n]{definition}
    # Handle nested braces up to 2 levels deep in the definition
    for match in re.finditer(
        r'\\(?:new|renew)command\{?\\(\w+)\}?'
        r'(?:\[(\d+)\])?'
        r'\{((?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*)\}',
        preamble
    ):
        name = match.group(1)
        nargs = match.group(2)
        definition = match.group(3)
        # Skip non-math macros
        if name in ('labelitemi',):
            continue
        if nargs:
            macros[name] = [definition, int(nargs)]
        else:
            macros[name] = definition

    # \DeclareMathOperator{\foo}{text}
    for match in re.finditer(
        r'\\DeclareMathOperator\{?\\(\w+)\}?\{([^}]*)\}',
        preamble
    ):
        name = match.group(1)
        text = match.group(2).strip()
        macros[name] = "\\operatorname{" + text + "}"

    return macros


def parse_citations(meta, tex_dir):
    """Build a citation map from source.json or .bbl file."""
    # Check source.json for explicit citations
    if "citations" in meta:
        return meta["citations"]

    # Try to find .bbl file alongside source.tex
    bbl_path = os.path.join(tex_dir, "source.bbl")
    if os.path.exists(bbl_path):
        citations = {}
        with open(bbl_path) as f:
            bbl = f.read()
        for m in re.finditer(r'\\bibitem\[([^\]]*)\]\{([^}]*)\}', bbl):
            short_label = m.group(1)
            key = m.group(2)
            citations[key] = short_label
        return citations

    return {}


# ============================================================
# LATEX PARSER
# ============================================================

ENV_TYPES = {
    "theorem": "Theorem",
    "lemma": "Lemma",
    "definition": "Definition",
    "commentary": "Commentary",
    "proof": "Proof",
    "proposition": "Proposition",
    "corollary": "Corollary",
    "remark": "Remark",
    "question": "Question",
    "example": "Example",
    "claim": "Claim",
}

# Map envName to CSS class
ENV_CSS = {
    "theorem": "stacks-theorem",
    "lemma": "stacks-lemma",
    "proposition": "stacks-lemma",
    "corollary": "stacks-lemma",
    "definition": "stacks-definition",
    "commentary": "stacks-commentary",
    "remark": "stacks-commentary",
    "question": "stacks-env",
    "example": "stacks-env",
    "claim": "stacks-env",
    "proof": "stacks-proof",
}


def parse_tex(tex_source):
    """Parse a skeletal .tex file into a structured document dict."""

    title_m = re.search(r'\\title\{([^}]+)\}', tex_source)
    author_m = re.search(r'\\author\{([^}]+)\}', tex_source)
    title = title_m.group(1) if title_m else "Untitled"
    author = author_m.group(1) if author_m else "Unknown"

    body_m = re.search(r'\\begin\{document\}(.*?)\\end\{document\}', tex_source, re.DOTALL)
    if not body_m:
        raise ValueError("Cannot find \\begin{document}...\\end{document}")
    body = body_m.group(1)

    # Remove \maketitle
    body = re.sub(r'\\maketitle', '', body)

    # Remove section/subsection labels (we use them for navigation, not tags)
    body = re.sub(r'\\label\{section:[^}]*\}', '', body)
    body = re.sub(r'\\label\{subsection:[^}]*\}', '', body)

    # Remove \bibliographystyle and \bibliography commands
    body = re.sub(r'\\bibliographystyle\{[^}]*\}', '', body)
    body = re.sub(r'\\bibliography\{[^}]*\}', '', body)

    # Handle \begin{thebibliography}...\end{thebibliography} — just remove it
    body = re.sub(r'\\begin\{thebibliography\}.*?\\end\{thebibliography\}', '', body, flags=re.DOTALL)

    sections = parse_sections(body)

    return {"title": title, "author": author, "sections": sections}


def parse_sections(body):
    """Split body into sections and subsections."""
    # Regex handles one level of nested braces in section titles
    # e.g. \section{Geometry of $\transvectant_{m,n}$}
    sec_pattern = r'\\section\{((?:[^{}]|\{[^{}]*\})*)\}'
    sec_splits = re.split(sec_pattern, body)

    sections = []
    sec_num = 0
    for i in range(1, len(sec_splits), 2):
        sec_num += 1
        sec_title = sec_splits[i].strip()
        sec_content = sec_splits[i+1] if i+1 < len(sec_splits) else ""

        sub_pattern = r'\\subsection\{((?:[^{}]|\{[^{}]*\})*)\}'
        sub_splits = re.split(sub_pattern, sec_content)

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
    """Parse content into a list of paragraph, environment, and code blocks."""
    blocks = []
    content = content.strip()
    if not content:
        return blocks

    # First, handle lstlisting blocks (they must not be parsed for envs)
    lstlisting_pattern = re.compile(
        r'\\begin\{lstlisting\}(?:\[[^\]]*\])?(.*?)\\end\{lstlisting\}',
        re.DOTALL
    )

    parts = []
    pos = 0
    for m in lstlisting_pattern.finditer(content):
        if m.start() > pos:
            parts.append(("tex", content[pos:m.start()]))
        parts.append(("code", m.group(1)))
        pos = m.end()
    if pos < len(content):
        parts.append(("tex", content[pos:]))

    if not parts:
        parts = [("tex", content)]

    for part_type, part_content in parts:
        if part_type == "code":
            code_text = html_mod.escape(part_content.strip())
            blocks.append({
                "type": "code",
                "content": f'<pre class="stacks-code"><code>{code_text}</code></pre>'
            })
        else:
            _parse_tex_blocks(part_content.strip(), blocks, sec_num)

    return blocks


def _parse_tex_blocks(content, blocks, sec_num):
    """Parse tex content for environments and paragraphs."""
    if not content:
        return

    env_pattern = re.compile(
        r'\\begin\{(' + '|'.join(ENV_TYPES.keys()) + r')\}'
        r'(\[[^\]]*\])?'  # optional argument like [Proof of ...]
        r'(.*?)'
        r'\\end\{\1\}',
        re.DOTALL
    )

    pos = 0
    for m in env_pattern.finditer(content):
        pre = content[pos:m.start()].strip()
        if pre:
            for para in split_paragraphs(pre):
                blocks.append({"type": "para", "content": tex_to_html(para)})

        env_name = m.group(1)
        opt_arg = m.group(2)
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

    trailing = content[pos:].strip()
    if trailing:
        for para in split_paragraphs(trailing):
            blocks.append({"type": "para", "content": tex_to_html(para)})


def split_paragraphs(text):
    """Split text on blank lines into paragraphs."""
    paras = re.split(r'\n\s*\n', text.strip())
    return [p.strip() for p in paras if p.strip()]


def tex_to_html(tex):
    """Convert LaTeX markup to HTML for MathJax rendering."""
    s = tex

    # --- Block-level environments (before inline processing) ---

    # tikzcd → placeholder
    s = re.sub(
        r'\\begin\{tikzcd\}.*?\\end\{tikzcd\}',
        r'\\text{[Commutative diagram — see PDF]}',
        s, flags=re.DOTALL
    )

    # center → strip
    s = re.sub(r'\\begin\{center\}', '', s)
    s = re.sub(r'\\end\{center\}', '', s)

    # equation environment → display math
    def equation_replace(m):
        body = m.group(1)
        body = re.sub(r'\\label\{[^}]*\}', '', body)
        body = re.sub(r'\\nonumber', '', body)
        return '$$' + body.strip() + '$$'
    s = re.sub(r'\\begin\{equation\}(.*?)\\end\{equation\}',
               equation_replace, s, flags=re.DOTALL)

    # align/align* → display math with aligned
    def align_replace(m):
        body = m.group(1)
        body = re.sub(r'\\label\{[^}]*\}', '', body)
        body = re.sub(r'\\nonumber', '', body)
        return '$$\\begin{aligned}' + body.strip() + '\\end{aligned}$$'
    s = re.sub(r'\\begin\{align\*?\}(.*?)\\end\{align\*?\}',
               align_replace, s, flags=re.DOTALL)

    # enumerate → ordered list
    def enumerate_replace(m):
        body = m.group(1)
        items = re.split(r'\\item(?:\[([^\]]*)\])?', body)
        html_items = []
        i = 1
        while i < len(items):
            label = items[i]  # capture group from \item[label]
            item_content = items[i+1] if i+1 < len(items) else ""
            item_content = item_content.strip()
            if item_content:
                if label:
                    html_items.append(f'<li><strong>{label}</strong> {item_content}</li>')
                else:
                    html_items.append(f'<li>{item_content}</li>')
            i += 2
        return '<ol>' + '\n'.join(html_items) + '</ol>'
    s = re.sub(r'\\begin\{enumerate\}(.*?)\\end\{enumerate\}',
               enumerate_replace, s, flags=re.DOTALL)

    # itemize → unordered list
    def itemize_replace(m):
        body = m.group(1)
        items = re.split(r'\\item(?:\[([^\]]*)\])?', body)
        html_items = []
        i = 1
        while i < len(items):
            label = items[i]
            item_content = items[i+1] if i+1 < len(items) else ""
            item_content = item_content.strip()
            if item_content:
                html_items.append(f'<li>{item_content}</li>')
            i += 2
        return '<ul>' + '\n'.join(html_items) + '</ul>'
    s = re.sub(r'\\begin\{itemize\}(.*?)\\end\{itemize\}',
               itemize_replace, s, flags=re.DOTALL)

    # --- Inline formatting ---

    # \emph{...} -> <em>
    s = re.sub(r'\\emph\{([^}]*)\}', r'<em>\1</em>', s)

    # \textbf{...} -> <strong>
    s = re.sub(r'\\textbf\{((?:[^{}]|\{[^{}]*\})*)\}', r'<strong>\1</strong>', s)

    # \textit{...} -> <em>
    s = re.sub(r'\\textit\{([^}]*)\}', r'<em>\1</em>', s)

    # \textsl{...} -> <em>
    s = re.sub(r'\\textsl\{([^}]*)\}', r'<em>\1</em>', s)

    # \texttt{...} -> <code>
    s = re.sub(r'\\texttt\{([^}]*)\}', r'<code>\1</code>', s)

    # {\sl text} -> <em>
    s = re.sub(r'\{\\sl\s+([^}]*)\}', r'<em>\1</em>', s)

    # {\it text} -> <em>
    s = re.sub(r'\{\\it\s+([^}]*)\}', r'<em>\1</em>', s)

    # ~ -> non-breaking space
    s = s.replace('~', '&nbsp;')

    # \[ ... \] -> $$ ... $$
    s = re.sub(r'\\\[', '$$', s)
    s = re.sub(r'\\\]', '$$', s)

    # --- -> &mdash;   -- -> &ndash;
    s = s.replace('---', '&mdash;')
    s = s.replace('--', '&ndash;')

    # Accented characters
    s = s.replace('\\"u', '&uuml;')
    s = s.replace('\\"o', '&ouml;')
    s = s.replace('\\"a', '&auml;')
    s = s.replace("\\'e", '&eacute;')
    s = s.replace("\\'a", '&aacute;')

    # \square, \qedhere — remove
    s = re.sub(r'\s*\\square\s*', '', s)
    s = re.sub(r'\s*\\qedhere\s*', '', s)

    # Double newlines → paragraph breaks
    s = re.sub(r'\n\s*\n', '</p>\n<p>', s)

    return s.strip()


# ============================================================
# TAG ASSIGNMENT & REF RESOLUTION
# ============================================================

def assign_tags_and_numbers(paper, slug, registry, existing_tags):
    """Walk the parsed paper, assign tags and environment numbers,
    and resolve \\ref{}, \\Cref{}, and \\eqref{} cross-references."""

    label_map = {}  # label -> {tag, number, envType}
    env_counter = {}  # per-section counters for theorem-like envs
    all_envs = []  # ordered list of all tagged environments

    for sec in paper["sections"]:
        sec_n = int(sec["number"])
        env_counter[sec_n] = 0

        def process_blocks(blocks, _sec_n=sec_n):
            for block in blocks:
                if block["type"] != "env":
                    continue
                if block["envName"] == "proof":
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
                    env_counter[_sec_n] += 1
                    number = f"{_sec_n}.{env_counter[_sec_n]}"
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

    # Second pass: resolve \ref{}, \Cref{}, \eqref{} in all content
    def resolve_refs(text):
        def ref_replacer(m):
            label = m.group(1)
            if label in label_map:
                info = label_map[label]
                number = info["number"]
                return number if number else info["envType"]
            return f"??{label}"

        def cref_replacer(m):
            label = m.group(1)
            if label in label_map:
                info = label_map[label]
                env_type = info["envType"]
                number = info["number"]
                if number:
                    return f"{env_type}&nbsp;{number}"
                else:
                    return env_type
            return f"??{label}"

        def eqref_replacer(m):
            label = m.group(1)
            if label in label_map:
                info = label_map[label]
                number = info["number"]
                return f"({number})" if number else "(??)"
            return f"(??{label})"

        # Process \Cref before \ref to avoid partial matches
        text = re.sub(r'\\Cref\{([^}]+)\}', cref_replacer, text)
        text = re.sub(r'\\cref\{([^}]+)\}', cref_replacer, text)
        text = re.sub(r'\\eqref\{([^}]+)\}', eqref_replacer, text)
        text = re.sub(r'\\ref\{([^}]+)\}', ref_replacer, text)
        return text

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

    # Update registry with resolved envType names
    for env in all_envs:
        tag = env.get("tag")
        if tag and tag in registry:
            registry[tag]["envType"] = env["envType"]

    return all_envs, label_map


def resolve_citations(paper, citations):
    """Resolve \\cite{key} references in all blocks."""
    if not citations:
        return

    def cite_replacer(m):
        opt = m.group(1)  # optional argument like \cite[Section 2]{key}
        key = m.group(2)
        if key in citations:
            label = citations[key]
            if opt:
                return f'[{label}, {opt}]'
            return f'[{label}]'
        return f'[{key}]'

    def process_content(text):
        return re.sub(r'\\cite(?:\[([^\]]*)\])?\{([^}]+)\}', cite_replacer, text)

    for sec in paper["sections"]:
        for block in sec["blocks"]:
            if "content" in block:
                block["content"] = process_content(block["content"])
        for sub in sec["subsections"]:
            for block in sub["blocks"]:
                if "content" in block:
                    block["content"] = process_content(block["content"])


# ============================================================
# HTML GENERATION
# ============================================================

def mathjax_macros_js(macros):
    """Convert a dict of macros to MathJax config JavaScript."""
    if not macros:
        return ""
    lines = []
    for name, defn in macros.items():
        if isinstance(defn, list):
            escaped = defn[0].replace('\\', '\\\\').replace('"', '\\"')
            lines.append(f'          {name}: ["{escaped}", {defn[1]}]')
        else:
            escaped = defn.replace('\\', '\\\\').replace('"', '\\"')
            lines.append(f'          {name}: "{escaped}"')
    return ',\n'.join(lines)


def head(title, paper_title, depth=0, macros=None):
    prefix = "../" * depth
    macro_block = ""
    if macros:
        macro_js = mathjax_macros_js(macros)
        if macro_js:
            macro_block = f',\n{macro_js}'
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
          operatorname: ['\\\\mathrm{{#1}}', 1]{macro_block}
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
    elif block["type"] == "code":
        return block["content"] + '\n'
    elif block["type"] == "env":
        tag = block.get("tag", "")
        env_type = block["envType"]
        number = block.get("number", "")
        env_name = block.get("envName", "")

        # CSS class
        css_class = ENV_CSS.get(env_name, "stacks-env")

        tag_link = f' <a href="{prefix}tag/{tag}.html" class="stacks-tag-link">({tag})</a>' if tag else ''

        # Head text
        if env_name == "proof":
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
# COMPILE ONE PAPER
# ============================================================

def compile_paper(tex_path):
    """Compile a single paper from its .tex file."""

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

    # Read .tex source
    with open(tex_path) as f:
        tex_source = f.read()

    # Extract MathJax macros from preamble
    macros = parse_preamble_macros(tex_source)
    print(f"  Extracted {len(macros)} MathJax macros from preamble")

    # Parse citations
    citations = parse_citations(meta, out_dir)
    print(f"  Loaded {len(citations)} citation entries")

    # Parse document
    paper = parse_tex(tex_source)
    print(f"Parsed: {paper['title']} by {paper['author']}")
    print(f"  {len(paper['sections'])} sections")

    # Assign tags
    registry = load_registry()
    # Remove old tags for this paper (allows clean rebuild)
    registry = {k: v for k, v in registry.items() if v.get("paper") != slug}
    existing_tags = set(registry.keys())

    all_envs, label_map = assign_tags_and_numbers(paper, slug, registry, existing_tags)

    # Resolve citations (after ref resolution, so citations in env content are handled)
    resolve_citations(paper, citations)

    save_registry(registry)

    print(f"  {len(all_envs)} tagged environments")
    for env in all_envs:
        print(f"    Tag {env['tag']}: {env['envType']} {env.get('number','')}")

    # Create output dirs
    os.makedirs(os.path.join(out_dir, "tag"), exist_ok=True)
    os.makedirs(os.path.join(out_dir, "section"), exist_ok=True)

    # --- 1. Table of Contents ---
    toc = head("Table of Contents", paper["title"], macros=macros)
    toc += nav_bar(paper["author"], paper["title"])
    toc += '<main class="stacks-main">\n'
    toc += f'<h1 class="stacks-paper-title">{paper["title"]}</h1>\n'
    toc += f'<p class="stacks-paper-author">{paper["author"]}</p>\n'
    if journal or arxiv_id:
        toc += '<p class="stacks-paper-meta">'
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
        sec_html = head(f'Section {sec["number"]}', paper["title"], depth=1, macros=macros)
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
            sub_html = head(f'{sub["number"]}. {sub["title"]}', paper["title"], depth=1, macros=macros)
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

        tag_html = head(f'{label_text} ({tag})', paper["title"], depth=1, macros=macros)
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


# ============================================================
# MAIN
# ============================================================

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 compile.py papers/<slug>/source.tex")
        print("       python3 compile.py --all")
        sys.exit(1)

    if sys.argv[1] == "--all":
        # Compile all papers listed in main.tex
        main_tex = os.path.join(SITE_ROOT, "main.tex")
        if not os.path.exists(main_tex):
            print("Error: main.tex not found")
            sys.exit(1)
        with open(main_tex) as f:
            for line in f:
                line = line.strip()
                if line.startswith('#') or not line:
                    continue
                tex_path = os.path.join(SITE_ROOT, line)
                if os.path.exists(tex_path):
                    print(f"\n{'='*60}")
                    print(f"Compiling: {line}")
                    print(f"{'='*60}")
                    compile_paper(tex_path)
                else:
                    print(f"Warning: {tex_path} not found, skipping")
    else:
        tex_path = sys.argv[1]
        if not os.path.isabs(tex_path):
            tex_path = os.path.join(SITE_ROOT, tex_path)
        compile_paper(tex_path)


if __name__ == "__main__":
    main()
