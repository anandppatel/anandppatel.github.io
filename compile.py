#!/usr/bin/env python3
"""
Stacks-project-style HTML compiler.

Usage:
    python3 compile.py papers/hodge-bundle/source.tex
    python3 compile.py --all     (compiles all papers listed in main.tex)

Reads a skeletal LaTeX file and generates a mini Stacks-project site:
  - index.html        (table of contents + tag table)
  - section/*.html    (one page per section/subsection)
  - tag/*.html        (one page per environment)

Tags are stored in papers/tag-registry.json so existing tags stay stable.
New labeled environments get deterministic 4-hex-char hashes of the paper
slug and label string. Unlabeled environments get deterministic tags from
their paper, environment type, number, and position.

The .tex file must use:
  - \\title{...}, \\author{...}
  - \\section{...}, \\subsection{...}
  - \\begin{theorem/lemma/definition/commentary/proof/...}...\\end{...}
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
import shutil
import subprocess
import tempfile

# ============================================================
# CONFIGURATION
# ============================================================

SITE_ROOT = os.path.dirname(os.path.abspath(__file__))
TAG_REGISTRY_PATH = os.path.join(SITE_ROOT, "papers", "tag-registry.json")
FORMSUBMIT_EMAIL = "anand.patel@okstate.edu"
TEX_RENDER_CONTEXT = {
    "preamble": "",
    "tikzset": "",
    "tex_dir": SITE_ROOT,
    "cache_dir": os.path.join(SITE_ROOT, ".tikz-cache"),
}
GEOMETRIC_ALPHABET_MACROS = {
    # Keep the common ambient spaces and number systems visually uniform
    # across papers whose source preambles use different local conventions.
    "A": "\\mathbb{A}",
    "AA": "\\mathbb{A}",
    "ba": "\\mathbb{A}",
    "bbA": "\\mathbb{A}",
    "C": "\\mathbb{C}",
    "CC": "\\mathbb{C}",
    "bc": "\\mathbb{C}",
    "bbC": "\\mathbb{C}",
    "F": "\\mathbb{F}",
    "FF": "\\mathbb{F}",
    "bbF": "\\mathbb{F}",
    "G": "\\mathbb{G}",
    "Gr": "\\mathbb{G}",
    "Grass": "\\mathbb{G}",
    "Ga": "\\mathbb{G}_{a}",
    "Gm": "\\mathbb{G}_{m}",
    "K": "\\mathbb{K}",
    "KK": "\\mathbb{K}",
    "bbK": "\\mathbb{K}",
    "N": "\\mathbb{N}",
    "NN": "\\mathbb{N}",
    "bn": "\\mathbb{N}",
    "bbN": "\\mathbb{N}",
    "P": "\\mathbb{P}",
    "PP": "\\mathbb{P}",
    "bP": "\\mathbb{P}",
    "bp": "\\mathbb{P}",
    "bbP": "\\mathbb{P}",
    "Q": "\\mathbb{Q}",
    "QQ": "\\mathbb{Q}",
    "bq": "\\mathbb{Q}",
    "bbQ": "\\mathbb{Q}",
    "R": "\\mathbb{R}",
    "RR": "\\mathbb{R}",
    "br": "\\mathbb{R}",
    "bbR": "\\mathbb{R}",
    "Z": "\\mathbb{Z}",
    "ZZ": "\\mathbb{Z}",
    "bz": "\\mathbb{Z}",
    "bbZ": "\\mathbb{Z}",
}


def load_registry():
    if os.path.exists(TAG_REGISTRY_PATH):
        with open(TAG_REGISTRY_PATH) as f:
            return json.load(f)
    return {}


def save_registry(reg):
    os.makedirs(os.path.dirname(TAG_REGISTRY_PATH), exist_ok=True)
    with open(TAG_REGISTRY_PATH, "w") as f:
        json.dump(reg, f, indent=2)


def iter_latex_command_spans(text, command, allow_optional=False):
    """Yield (start, end, argument) for \\command{...} with balanced braces."""
    needle = "\\" + command
    pos = 0
    while True:
        start = text.find(needle, pos)
        if start == -1:
            break
        i = start + len(needle)
        if i < len(text) and (text[i].isalpha() or text[i] == "*"):
            pos = i
            continue
        while i < len(text) and text[i].isspace():
            i += 1
        if allow_optional and i < len(text) and text[i] == "[":
            i += 1
            depth = 1
            while i < len(text) and depth:
                if text[i] == "[":
                    depth += 1
                elif text[i] == "]":
                    depth -= 1
                i += 1
            while i < len(text) and text[i].isspace():
                i += 1
        if i >= len(text) or text[i] != "{":
            pos = start + len(needle)
            continue
        arg_start = i + 1
        i += 1
        depth = 1
        while i < len(text) and depth:
            if text[i] == "{":
                depth += 1
            elif text[i] == "}":
                depth -= 1
            i += 1
        if depth == 0:
            yield start, i, text[arg_start:i - 1]
            pos = i
        else:
            pos = start + len(needle)


def extract_latex_commands(text, command):
    """Extract full \\command{...} commands with balanced braces."""
    return [text[start:end] for start, end, _ in iter_latex_command_spans(text, command)]


def replace_latex_commands(text, command, callback, allow_optional=False):
    """Replace full \\command{...} commands using a callback on the argument."""
    pieces = []
    pos = 0
    for start, end, argument in iter_latex_command_spans(text, command, allow_optional):
        pieces.append(text[pos:start])
        pieces.append(callback(argument))
        pos = end
    pieces.append(text[pos:])
    return "".join(pieces)


def remove_latex_commands(text, command):
    """Remove full \\command{...} commands with balanced braces."""
    return replace_latex_commands(text, command, lambda _argument: "")


def replace_latex_two_arg_commands(text, command, callback, allow_optional=False):
    """Replace full \\command{...}{...} commands with balanced braces."""
    pieces = []
    pos = 0
    needle = "\\" + command
    while True:
        start = text.find(needle, pos)
        if start == -1:
            break
        i = start + len(needle)
        if i < len(text) and (text[i].isalpha() or text[i] == "*"):
            pos = i
            continue
        while i < len(text) and text[i].isspace():
            i += 1
        if allow_optional and i < len(text) and text[i] == "[":
            i += 1
            depth = 1
            while i < len(text) and depth:
                if text[i] == "[":
                    depth += 1
                elif text[i] == "]":
                    depth -= 1
                i += 1
            while i < len(text) and text[i].isspace():
                i += 1
        args = []
        ok = True
        for _ in range(2):
            if i >= len(text) or text[i] != "{":
                ok = False
                break
            arg_start = i + 1
            i += 1
            depth = 1
            while i < len(text) and depth:
                if text[i] == "{":
                    depth += 1
                elif text[i] == "}":
                    depth -= 1
                i += 1
            if depth != 0:
                ok = False
                break
            args.append(text[arg_start:i - 1])
            if len(args) < 2:
                while i < len(text) and text[i].isspace():
                    i += 1
        if not ok:
            pos = start + len(needle)
            continue
        pieces.append(text[pos:start])
        pieces.append(callback(args[0], args[1]))
        pos = i
    pieces.append(text[pos:])
    return "".join(pieces)


def split_latex_heading_blocks(text, command):
    """Split text into [(title, content)] blocks for balanced LaTeX headings."""
    matches = list(iter_latex_heading_spans(text, command))
    blocks = []
    for idx, (start, end, title) in enumerate(matches):
        next_start = matches[idx + 1][0] if idx + 1 < len(matches) else len(text)
        blocks.append((clean_heading_title(title), text[end:next_start]))
    return text[:matches[0][0]] if matches else text, blocks


def clean_heading_title(title):
    """Remove invisible LaTeX spacing commands from section-like headings."""
    title = re.sub(r'\\(?:unskip|ignorespaces)\b', '', title)
    return title.strip()


def iter_latex_heading_spans(text, command):
    """Yield (start, end, title) for \\section-like headings."""
    heading_re = re.compile(r'\\' + re.escape(command) + r'\*?\s*\{')
    pos = 0
    while True:
        m = heading_re.search(text, pos)
        if not m:
            break
        i = m.end()
        arg_start = i
        depth = 1
        while i < len(text) and depth:
            if text[i] == "{":
                depth += 1
            elif text[i] == "}":
                depth -= 1
            i += 1
        if depth == 0:
            yield m.start(), i, text[arg_start:i - 1]
            pos = i
        else:
            pos = m.end()


def replace_latex_heading_commands(text, command, callback):
    """Replace \\section-like headings using a callback on the balanced title."""
    pieces = []
    pos = 0
    for start, end, title in iter_latex_heading_spans(text, command):
        pieces.append(text[pos:start])
        pieces.append(callback(title.strip()))
        pos = end
    pieces.append(text[pos:])
    return "".join(pieces)


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
    non_math_macros = {
        # Presentation macros used by the PDF source, not MathJax macros.
        "Aletheia", "human", "ai",
    }

    # \newcommand{\foo}{definition} or \newcommand{\foo}[n]{definition}
    # \renewcommand{\foo}{definition} or \renewcommand{\foo}[n]{definition}
    # Handle nested braces up to 2 levels deep in the definition
    for match in re.finditer(
        r'\\(?:new|renew|provide)command\s*\{?\\(\w+)\}?'
        r'(?:\[(\d+)\])?'
        r'\s*\{((?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*)\}',
        preamble
    ):
        name = match.group(1)
        nargs = match.group(2)
        definition = normalize_geometric_alphabets(match.group(3))
        # Skip non-math macros
        if name in ('labelitemi',) or name in non_math_macros:
            continue
        if any(token in definition for token in (
            "\n", "\\begin", "\\end", "\\noindent", "\\vspace", "\\hspace",
            "tcolorbox", "minipage", "flushleft", "flushright",
        )):
            continue
        if nargs:
            macros[name] = [definition, int(nargs)]
        else:
            macros[name] = definition

    # \DeclareMathOperator{\foo}{text} — handles nested braces
    for match in re.finditer(
        r'\\DeclareMathOperator\s*\{?\\(\w+)\}?\s*\{((?:[^{}]|\{[^{}]*\})*)\}',
        preamble
    ):
        name = match.group(1)
        text = normalize_geometric_alphabets(match.group(2).strip())
        macros[name] = "\\operatorname{" + text + "}"

    for name, definition in GEOMETRIC_ALPHABET_MACROS.items():
        if name in {"A", "C", "F", "G", "Gr", "Grass", "K", "N", "P", "Q", "R", "Z"}:
            macros[name] = definition
        else:
            macros.setdefault(name, definition)
    return macros


def parse_bibliography(meta, tex_dir, tex_source):
    """Build citation labels and bibliography entries."""
    bib_text = ""

    # Prefer the compiled bibliography if arXiv supplied one.
    bbl_path = os.path.join(tex_dir, "source.bbl")
    if os.path.exists(bbl_path):
        with open(bbl_path) as f:
            bib_text = f.read()
    else:
        bib_m = re.search(
            r'\\begin\{thebibliography\}(?:\{[^}]*\})?(.*?)\\end\{thebibliography\}',
            tex_source,
            re.DOTALL,
        )
        if bib_m:
            bib_text = bib_m.group(1)

    bib_text = cleanup_bibliography_environment(bib_text)
    citations, entries = parse_bibitems(bib_text)

    # source.json can provide lightweight labels for papers whose sources do
    # not include a bibliography file.
    if "citations" in meta:
        citations.update(meta["citations"])

    return {"citations": citations, "entries": entries}


def cleanup_bibliography_environment(bib_text):
    """Remove wrapper commands from .bbl/thebibliography text."""
    if not bib_text:
        return ""
    bib_text = re.sub(r'\\newcommand\{\\etalchar\}\[1\]\{\$\^\{#1\}\$\}\s*', '', bib_text)
    bib_text = re.sub(r'\\begin\{thebibliography\}\{[^\n]*\}\s*', '', bib_text)
    bib_text = re.sub(r'\\end\{thebibliography\}\s*', '', bib_text)
    return bib_text.strip()


def parse_bibitems(bib_text):
    citations = {}
    entries = []
    if not bib_text:
        return citations, entries

    bibitem_pattern = re.compile(r'\\bibitem(?:\[([^\]]*)\])?\{([^}]*)\}')
    matches = list(bibitem_pattern.finditer(bib_text))
    for idx, match in enumerate(matches, start=1):
        raw_label = match.group(1)
        key = match.group(2)
        label = clean_bib_label(raw_label) if raw_label else str(idx)
        body_start = match.end()
        body_end = matches[idx].start() if idx < len(matches) else len(bib_text)
        body = bib_text[body_start:body_end].strip()
        citations[key] = label
        entries.append({
            "key": key,
            "label": label,
            "html": bibliography_entry_to_html(body),
        })
    return citations, entries


def bibliography_entry_to_html(entry):
    """Lightweight LaTeX-to-HTML cleanup for bibliography entries."""
    entry = entry.replace('\n', ' ')
    entry = re.sub(r'\s+', ' ', entry).strip()
    entry = cleanup_bibliography_environment(entry)
    # Plain BibTeX styles use a short rule for "same author as above".  In
    # HTML an em dash carries the same meaning without leaking raw TeX.
    entry = re.sub(
        r'\\leavevmode\\vrule\s+height\s+[-.\d]+pt\s+depth\s+[-.\d]+pt\s+width\s+[-.\d]+pt',
        '&mdash;',
        entry,
    )
    entry = re.sub(r'\\url\{([^}]*)\}', r'<a href="\1">\1</a>', entry)
    entry = re.sub(r'\\href\{([^}]*)\}\{([^}]*)\}', r'<a href="\1">\2</a>', entry)
    html = tex_to_html(entry)
    # BibTeX uses braces to preserve capitalization. Once formatting commands
    # are handled, those braces should not be visible in bibliography prose.
    html = strip_text_braces_outside_math(html)
    return html


def strip_text_braces_outside_math(text):
    """Remove BibTeX capitalization braces while leaving MathJax braces alone."""
    pieces = []
    current = []
    in_math = False
    i = 0
    while i < len(text):
        char = text[i]
        prev = text[i - 1] if i else ""
        if char == "$" and prev != "\\":
            if not in_math:
                segment = "".join(current).replace("{", "").replace("}", "")
                pieces.append(segment)
                current = ["$"]
                in_math = True
            else:
                current.append("$")
                pieces.append("".join(current))
                current = []
                in_math = False
            i += 1
            continue
        current.append(char)
        i += 1
    segment = "".join(current)
    if not in_math:
        segment = segment.replace("{", "").replace("}", "")
    pieces.append(segment)
    return "".join(pieces)


def clean_bib_label(label):
    """Convert BibTeX's small LaTeX label fragments into plain HTML text."""
    label = re.sub(r'\{\\etalchar\{([^}]*)\}\}', r'\1', label)
    label = label.replace('{', '').replace('}', '')
    return label


def extract_latex_command_bodies(tex_source, command):
    """Return braced bodies for \\command{...}, allowing nested braces."""
    bodies = []
    needle = "\\" + command
    pos = 0
    while True:
        start = tex_source.find(needle, pos)
        if start == -1:
            break
        i = start + len(needle)
        while i < len(tex_source) and tex_source[i].isspace():
            i += 1
        if i < len(tex_source) and tex_source[i] == "[":
            depth = 1
            i += 1
            while i < len(tex_source) and depth:
                if tex_source[i] == "[":
                    depth += 1
                elif tex_source[i] == "]":
                    depth -= 1
                i += 1
            while i < len(tex_source) and tex_source[i].isspace():
                i += 1
        if i >= len(tex_source) or tex_source[i] != "{":
            pos = i
            continue
        body_start = i + 1
        depth = 1
        i = body_start
        while i < len(tex_source) and depth:
            if tex_source[i] == "{":
                depth += 1
            elif tex_source[i] == "}":
                depth -= 1
            i += 1
        if depth == 0:
            bodies.append(tex_source[body_start:i - 1].strip())
        pos = i
    return bodies


def clean_latex_metadata(text):
    """Lightweight cleanup for title/author strings displayed as HTML."""
    text = re.sub(r'\s+', ' ', text).strip()
    text = re.sub(r'\\(?:unskip|ignorespaces)\b', '', text)
    text = text.replace(r'\&', '&')
    text = text.replace(r'\and', ', ')
    text = text.replace(' ,', ',')
    return text


def strip_html(text):
    """Plain-text version of generated HTML fragments for titles/attributes."""
    text = re.sub(r'<[^>]+>', '', str(text))
    text = text.replace('&nbsp;', ' ')
    return html_mod.unescape(text)


def html_attr(text):
    return html_mod.escape(strip_html(text), quote=True)


def normalize_source_aliases(body):
    """Normalize simple section aliases used in some arXiv sources."""
    alias_pairs = (
        (r'\ssec', r'\subsection'),
        (r'\sssec', r'\subsubsection'),
    )
    for alias, target in alias_pairs:
        if (
            re.search(r'\\(?:new|renew|provide)command\s*\{?' + re.escape(alias) + r'\}?\s*\{?' + re.escape(target) + r'\}?', body)
            or alias in body
        ):
            body = body.replace(alias + "{", target + "{")
    return body


# ============================================================
# LATEX PARSER
# ============================================================

ENV_TYPES = {
    "theorem": "Theorem",
    "Theorem": "Theorem",
    "Thm": "Theorem",
    "Thm*": "Theorem",
    "thm": "Theorem",
    "thm*": "Theorem",
    "maintheorem": "Theorem",
    "Main": "Main Theorem",
    "thm-defn": "Theorem/Definition",
    "lemma": "Lemma",
    "Lem": "Lemma",
    "lem": "Lemma",
    "definition": "Definition",
    "Def": "Definition",
    "defn": "Definition",
    "commentary": "Commentary",
    "proof": "Proof",
    "proposition": "Proposition",
    "Prop": "Proposition",
    "Prop*": "Proposition",
    "prop": "Proposition",
    "corollary": "Corollary",
    "Corollary": "Corollary",
    "Cor": "Corollary",
    "cor": "Corollary",
    "remark": "Remark",
    "Rem": "Remark",
    "rmk": "Remark",
    "question": "Question",
    "example": "Example",
    "Exam": "Example",
    "eg": "Example",
    "claim": "Claim",
    "Claim": "Claim",
    "calc": "Calculation",
    "fact": "Fact",
    "Fact": "Fact",
    "Fact*": "Fact",
    "notn": "Notation",
    "warn": "Warning",
    "Pro": "Problem",
    "Pro*": "Problem",
    "prob": "Problem",
    "problem": "Problem",
    "assumption": "Assumption",
    "conjecture": "Conjecture",
    "Conj": "Conjecture",
    "conj": "Conjecture",
    "construction": "Construction",
    "Exer": "Exercise",
    "ToDo": "To Do",
}

# Map envName to CSS class
ENV_CSS = {
    "theorem": "stacks-theorem",
    "Theorem": "stacks-theorem",
    "Thm": "stacks-theorem",
    "Thm*": "stacks-theorem",
    "thm": "stacks-theorem",
    "thm*": "stacks-theorem",
    "maintheorem": "stacks-theorem",
    "Main": "stacks-theorem",
    "thm-defn": "stacks-theorem",
    "lemma": "stacks-lemma",
    "Lem": "stacks-lemma",
    "lem": "stacks-lemma",
    "proposition": "stacks-lemma",
    "Prop": "stacks-lemma",
    "Prop*": "stacks-lemma",
    "prop": "stacks-lemma",
    "corollary": "stacks-lemma",
    "Corollary": "stacks-lemma",
    "Cor": "stacks-lemma",
    "cor": "stacks-lemma",
    "definition": "stacks-definition",
    "Def": "stacks-definition",
    "defn": "stacks-definition",
    "commentary": "stacks-commentary",
    "remark": "stacks-commentary",
    "Rem": "stacks-commentary",
    "rmk": "stacks-commentary",
    "question": "stacks-env",
    "example": "stacks-env",
    "Exam": "stacks-env",
    "eg": "stacks-env",
    "claim": "stacks-env",
    "Claim": "stacks-env",
    "calc": "stacks-env",
    "fact": "stacks-env",
    "Fact": "stacks-env",
    "Fact*": "stacks-env",
    "notn": "stacks-env",
    "warn": "stacks-commentary",
    "Pro": "stacks-env",
    "Pro*": "stacks-env",
    "prob": "stacks-env",
    "problem": "stacks-env",
    "assumption": "stacks-env",
    "conjecture": "stacks-env",
    "Conj": "stacks-env",
    "conj": "stacks-env",
    "construction": "stacks-env",
    "Exer": "stacks-env",
    "ToDo": "stacks-env",
    "proof": "stacks-proof",
}


def parse_tex(tex_source):
    """Parse a skeletal .tex file into a structured document dict."""

    title_bodies = extract_latex_command_bodies(tex_source, "title")
    author_bodies = extract_latex_command_bodies(tex_source, "author")
    title = clean_latex_metadata(title_bodies[0]) if title_bodies else "Untitled"
    authors = []
    for author_body in author_bodies:
        author_text = clean_latex_metadata(author_body)
        if author_text and author_text not in authors:
            authors.append(author_text)
    author = ", ".join(authors) if authors else "Unknown"

    body_m = re.search(r'\\begin\{document\}(.*?)\\end\{document\}', tex_source, re.DOTALL)
    if not body_m:
        raise ValueError("Cannot find \\begin{document}...\\end{document}")
    body = body_m.group(1)

    body = normalize_source_aliases(body)

    # Strip LaTeX comments (lines starting with %)
    body = re.sub(r'(?m)^\s*%.*$', '', body)
    # Strip inline comments (% not preceded by \)
    body = re.sub(r'(?<!\\)%.*$', '', body, flags=re.MULTILINE)

    # Remove \maketitle
    body = re.sub(r'\\maketitle', '', body)

    # Extract section/subsection labels before removing them
    # These are labels like \label{sec:translation}, \label{subsection:foo}, etc.
    section_labels = {}  # will be populated after section parsing

    # Remove \bibliographystyle and \bibliography commands
    body = re.sub(r'\\bibliographystyle\{[^}]*\}', '', body)
    body = re.sub(r'\\bibliography\{[^}]*\}', '', body)

    # Handle \begin{thebibliography}...\end{thebibliography} — just remove it
    body = re.sub(r'\\begin\{thebibliography\}.*?\\end\{thebibliography\}', '', body, flags=re.DOTALL)

    equation_labels = parse_equation_labels(body)
    auxiliary_labels = parse_auxiliary_labels(body)
    custom_labels = parse_custom_labels(body)
    sections, section_labels = parse_sections(body)

    return {
        "title": title,
        "author": author,
        "sections": sections,
        "section_labels": section_labels,
        "equation_labels": equation_labels,
        "auxiliary_labels": auxiliary_labels,
        "custom_labels": custom_labels,
    }


def parse_equation_labels(body):
    """Find numbered equation labels before TeX fragments are HTML-converted."""
    labels = {}
    sec_pattern = r'\\section\*?\{((?:[^{}]|\{[^{}]*\})*)\}'
    sec_splits = re.split(sec_pattern, body)
    equation_pattern = re.compile(
        r'\\begin\{(equation|align|eqnarray|gather|multline)\}(.*?)\\end\{\1\}',
        re.DOTALL,
    )
    if len(sec_splits) == 1:
        sec_splits = ["", "", body]
    for sec_idx in range(1, len(sec_splits), 2):
        sec_num = (sec_idx + 1) // 2
        sec_content = sec_splits[sec_idx + 1] if sec_idx + 1 < len(sec_splits) else ""
        number = 0
        for m in equation_pattern.finditer(sec_content):
            number += 1
            for label_m in re.finditer(r'\\label\{([^}]+)\}', m.group(2)):
                labels[label_m.group(1)] = f"{sec_num}.{number}"
    return labels


def parse_custom_labels(body):
    r"""Find labels created with \customlabel{key}{shown-value}."""
    labels = {}
    for m in re.finditer(r'\\customlabel\{([^}]+)\}\{([^}]+)\}', body):
        labels[m.group(1)] = tex_to_html(m.group(2))
    return labels


def parse_auxiliary_labels(body):
    """Find non-theorem labels for figures, tables, and list items."""
    labels = {}

    for env_name, env_type in (("figure", "Figure"), ("table", "Table")):
        pattern = re.compile(
            r'\\begin\{' + env_name + r'\*?\}(.*?)\\end\{' + env_name + r'\*?\}',
            re.DOTALL,
        )
        number = 0
        for m in pattern.finditer(body):
            number += 1
            for label_m in re.finditer(r'\\label\{([^}]+)\}', m.group(1)):
                labels[label_m.group(1)] = {"number": str(number), "envType": env_type}

    enum_pattern = re.compile(r'\\begin\{enumerate\}(.*?)\\end\{enumerate\}', re.DOTALL)
    for enum in enum_pattern.finditer(body):
        pieces = re.split(r'\\item(?:\[([^\]]*)\])?', enum.group(1))
        item_number = 0
        idx = 1
        while idx < len(pieces):
            optional_label = pieces[idx]
            item_content = pieces[idx + 1] if idx + 1 < len(pieces) else ""
            item_number += 1
            custom = re.search(r'\\customlabel\{([^}]+)\}\{([^}]+)\}', optional_label or "")
            if custom:
                labels[custom.group(1)] = {"number": tex_to_html(custom.group(2)), "envType": "Item"}
            for label_m in re.finditer(r'\\label\{([^}]+)\}', item_content):
                labels[label_m.group(1)] = {"number": str(item_number), "envType": "Item"}
            idx += 2

    return labels


def parse_sections(body):
    """Split body into sections and subsections."""
    _, section_blocks = split_latex_heading_blocks(body, "section")

    section_labels = {}  # label -> {"number": "2", "title": "..."} etc.

    theorem_label_prefixes = (
        'theorem:', 'lemma:', 'proposition:', 'corollary:',
        'definition:', 'remark:', 'example:', 'claim:',
        'problem:', 'question:', 'proof:', 'assumption:',
        'commentary:', 'cor:', 'prop:', 'thm:', 'def:',
        'lem:', 'conj:', 'conjecture:',
    )

    def collect_heading_labels(text, base_number):
        _, subsub_blocks = split_latex_heading_blocks(text, "subsubsection")
        for idx, (title, content) in enumerate(subsub_blocks, start=1):
            label_region = content[:300]
            label_m = re.search(r'\\label\{([^}]+)\}', label_region)
            if label_m:
                section_labels[label_m.group(1)] = {
                    "number": f"{base_number}.{idx}",
                    "title": title,
                }

    sections = []
    for sec_num, (sec_title, sec_content) in enumerate(section_blocks, start=1):

        # Split subsections FIRST, then extract labels per-piece
        pre_raw, subsection_blocks = split_latex_heading_blocks(sec_content, "subsection")

        # Extract section labels from pre-subsection content
        for lm in re.finditer(r'\\label\{([^}]+)\}', pre_raw[:300]):
            label = lm.group(1)
            if not any(label.startswith(p) for p in theorem_label_prefixes):
                section_labels[label] = {"number": str(sec_num), "title": sec_title}
        collect_heading_labels(pre_raw, str(sec_num))
        pre_content = re.sub(r'\\label\{(?:sec|section|subsec|subsection|sub:)[^}]*\}', '', pre_raw)

        subsections = []
        for sub_num, (sub_title, sub_content) in enumerate(subsection_blocks, start=1):
            # Extract subsection labels from the beginning of content
            for lm in re.finditer(r'\\label\{([^}]+)\}', sub_content[:300]):
                label = lm.group(1)
                if not any(label.startswith(p) for p in theorem_label_prefixes):
                    section_labels[label] = {"number": f"{sec_num}.{sub_num}", "title": sub_title}
            collect_heading_labels(sub_content, f"{sec_num}.{sub_num}")
            # Remove section/subsection labels from content
            sub_content = re.sub(r'\\label\{(?:sec|section|subsec|subsection|sub:)[^}]*\}', '', sub_content)

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

    return sections, section_labels


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


def _find_matching_end(content, env_name, start_after):
    """Find the matching \\end{env_name} for a \\begin{env_name} that has
    already been consumed.  Handles same-type nesting by counting depth.
    Returns the index of the character right after \\end{env_name}, or -1."""
    begin_tag = '\\begin{' + env_name + '}'
    end_tag = '\\end{' + env_name + '}'
    depth = 1
    pos = start_after
    while pos < len(content):
        next_begin = content.find(begin_tag, pos)
        next_end = content.find(end_tag, pos)
        if next_end == -1:
            return -1  # unmatched
        if next_begin != -1 and next_begin < next_end:
            depth += 1
            pos = next_begin + len(begin_tag)
        else:
            depth -= 1
            if depth == 0:
                return next_end + len(end_tag)
            pos = next_end + len(end_tag)
    return -1


def _parse_tex_blocks(content, blocks, sec_num):
    """Parse tex content for environments and paragraphs.
    Uses depth-counting to correctly handle same-type nesting
    (e.g. proof inside proof)."""
    if not content:
        return

    env_names_alt = '|'.join(re.escape(k) for k in ENV_TYPES.keys())
    # Match the opening \begin{envname}[optional arg]
    begin_pattern = re.compile(
        r'\\begin\{(' + env_names_alt + r')\}(\[[^\]]*\])?'
    )

    pos = 0
    while pos < len(content):
        m = begin_pattern.search(content, pos)
        if m is None:
            break

        # Text before this environment
        pre = content[pos:m.start()].strip()
        if pre:
            for para in split_paragraphs(pre):
                blocks.append({"type": "para", "content": tex_to_html(para)})

        env_name = m.group(1)
        opt_arg = m.group(2)
        body_start = m.end()

        # Find the correctly nested \end{env_name}
        body_end_after = _find_matching_end(content, env_name, body_start)
        if body_end_after == -1:
            # No matching end found; treat rest as paragraph
            pos = m.end()
            continue

        end_tag = '\\end{' + env_name + '}'
        env_body = content[body_start:body_end_after - len(end_tag)].strip()

        # Extract the environment's own \label{...}.  It should occur near
        # the beginning of the environment; labels inside equations,
        # figures, tables, or list items belong to those objects instead.
        label = None
        first_begin_any = re.search(r'\\begin\{', env_body)
        search_region = env_body[:first_begin_any.start()] if first_begin_any else env_body[:300]
        label_m = None
        non_env_label_prefixes = (
            "eq:", "eqn:", "equation:", "fig:", "figure:",
            "tab:", "table:", "item", "condition:", "criteria:",
        )
        for candidate in re.finditer(r'\\label\{([^}]+)\}', search_region):
            if not candidate.group(1).startswith(non_env_label_prefixes):
                label_m = candidate
                break
        if label_m:
            label = label_m.group(1)
            env_body = env_body[:label_m.start()] + env_body[label_m.end():]
            env_body = env_body.strip()

        # Determine display type
        display_type = ENV_TYPES[env_name]
        if env_name == "proof" and opt_arg:
            inner = opt_arg[1:-1]  # strip [ ]
            display_type = tex_to_html(inner)

        # Check if the body contains nested tracked environments.
        # If so, recursively parse them instead of treating the whole
        # body as a single HTML blob.
        nested_env_check = begin_pattern.search(env_body)
        if nested_env_check:
            # Recursively parse to extract nested environments
            sub_blocks = []
            _parse_tex_blocks(env_body, sub_blocks, sec_num)
            # Wrap in the outer environment block with nested content
            block = {
                "type": "env",
                "envType": display_type,
                "envName": env_name,
                "content": "",  # content distributed across sub_blocks
                "label": label,
                "children": sub_blocks,
            }
            blocks.append(block)
        else:
            block = {
                "type": "env",
                "envType": display_type,
                "envName": env_name,
                "content": tex_to_html(env_body),
                "label": label,
            }
            blocks.append(block)

        pos = body_end_after

    trailing = content[pos:].strip()
    if trailing:
        for para in split_paragraphs(trailing):
            blocks.append({"type": "para", "content": tex_to_html(para)})


def split_paragraphs(text):
    """Split text on blank lines without cutting through display environments."""
    protected_envs = {
        "figure", "table", "center", "equation", "equation*",
        "align", "align*", "tikzcd", "tikzpicture", "tabular", "longtable",
    }
    paras = []
    current = []
    depth = 0
    for line in text.strip().splitlines():
        begins = re.findall(r'\\begin\{([^}]+)\}', line)
        ends = re.findall(r'\\end\{([^}]+)\}', line)
        is_blank = not line.strip()
        if is_blank and depth == 0:
            if current:
                paras.append("\n".join(current).strip())
                current = []
            continue
        current.append(line)
        depth += sum(1 for env in begins if env in protected_envs)
        depth -= sum(1 for env in ends if env in protected_envs)
        depth = max(depth, 0)
    if current:
        paras.append("\n".join(current).strip())
    return [p for p in paras if p]


def configure_tex_renderer(tex_source, tex_dir):
    """Store enough source context to render embedded LaTeX graphics."""
    declarations = []
    for name, definition in parse_preamble_macros(tex_source).items():
        if isinstance(definition, list):
            body, nargs = definition
            arg_spec = f"[{nargs}]"
            empty_args = "".join("{}" for _ in range(nargs))
            declarations.append(f"\\providecommand{{\\{name}}}{arg_spec}{empty_args}")
            declarations.append(f"\\renewcommand{{\\{name}}}{arg_spec}{{{body}}}")
        else:
            declarations.append(f"\\providecommand{{\\{name}}}{{}}")
            declarations.append(f"\\renewcommand{{\\{name}}}{{{definition}}}")
    TEX_RENDER_CONTEXT["preamble"] = "\n".join(declarations)
    TEX_RENDER_CONTEXT["tikzset"] = "\n".join(extract_latex_commands(tex_source, "tikzset"))
    TEX_RENDER_CONTEXT["tex_dir"] = tex_dir
    TEX_RENDER_CONTEXT["cache_dir"] = os.path.join(tex_dir, ".tikz-cache")


def strip_svg_header(svg):
    """Remove XML/doctype wrappers so the SVG can be embedded inline."""
    svg = re.sub(r'<\?xml[^>]*>\s*', '', svg, count=1)
    svg = re.sub(r'<!DOCTYPE[^>]*(?:\[[\s\S]*?\]\s*)?>\s*', '', svg, count=1)
    svg = re.sub(r'<!--.*?-->\s*', '', svg, flags=re.DOTALL)
    return svg.strip()


def render_tikz_block(tikz_source, aria_label="TikZ diagram"):
    """Compile a TikZ/tikz-cd environment to inline SVG, with a readable fallback."""
    cache_dir = TEX_RENDER_CONTEXT["cache_dir"]
    os.makedirs(cache_dir, exist_ok=True)
    digest = hashlib.sha256(
        (
            TEX_RENDER_CONTEXT["preamble"]
            + "\n"
            + TEX_RENDER_CONTEXT["tikzset"]
            + "\n"
            + tikz_source
        ).encode()
    ).hexdigest()[:16]
    svg_path = os.path.join(cache_dir, f"{digest}.svg")

    if not os.path.exists(svg_path):
        document = r"""\documentclass[tikz,border=3pt]{standalone}
\usepackage{amsmath,amssymb,amsfonts,mathtools}
\usepackage{mathrsfs}
\IfFileExists{mathbbol.sty}{\usepackage{mathbbol}}{}
\usepackage{xcolor}
\usepackage{graphicx}
\usepackage{transparent}
\usepackage{calc}
\usepackage{xparse}
\usepackage{tikz}
\usepackage{tikz-cd}
\usepackage[all]{xy}
\usepackage{pgfplots}
\pgfplotsset{compat=1.9}
\usetikzlibrary{matrix,arrows,arrows.meta,positioning,shapes,decorations.markings,decorations.pathmorphing,plotmarks,calc,patterns,fit,backgrounds}
""" + TEX_RENDER_CONTEXT["preamble"] + r"""
""" + TEX_RENDER_CONTEXT["tikzset"] + r"""
\providecommand{\Cref}[1]{#1}
\providecommand{\cref}[1]{#1}
\providecommand{\autoref}[1]{#1}
\ProvideDocumentCommand{\op}{O{r} O{n} m}{\mathcal{O}_{#3}}
\ProvideDocumentCommand{\opc}{O{r} O{n} m}{[\mathcal{O}_{#3}]}
\ProvideDocumentCommand{\og}{O{r+1} O{n} m}{\mathcal{O}(#3)}
\ProvideDocumentCommand{\ogc}{O{r+1} O{n} m}{[\mathcal{O}(#3)]}
\ProvideDocumentCommand{\oa}{O{(r+1)} O{n} m}{\mathcal{O}(#3)}
\ProvideDocumentCommand{\oac}{O{(r+1)} O{n} m}{[\mathcal{O}(#3)]}
\graphicspath{{""" + TEX_RENDER_CONTEXT["tex_dir"].replace("\\", "/") + r"""/}}
\begin{document}
""" + tikz_source + r"""
\end{document}
"""
        with tempfile.TemporaryDirectory() as tmpdir:
            tex_file = os.path.join(tmpdir, "diagram.tex")
            with open(tex_file, "w", encoding="utf-8") as f:
                f.write(document)
            env = os.environ.copy()
            tex_dir = TEX_RENDER_CONTEXT["tex_dir"]
            env["TEXINPUTS"] = (
                tex_dir + os.pathsep
                + tex_dir + "//" + os.pathsep
                + env.get("TEXINPUTS", "")
            )
            try:
                subprocess.run(
                    ["pdflatex", "-interaction=nonstopmode", "-halt-on-error", "diagram.tex"],
                    cwd=tmpdir,
                    env=env,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    text=True,
                    timeout=30,
                    check=True,
                )
                pdf_for_svg = "diagram.pdf"
                if shutil.which("pdfcrop"):
                    subprocess.run(
                        ["pdfcrop", "diagram.pdf", "diagram-crop.pdf"],
                        cwd=tmpdir,
                        env=env,
                        stdout=subprocess.PIPE,
                        stderr=subprocess.STDOUT,
                        text=True,
                        timeout=30,
                        check=True,
                    )
                    pdf_for_svg = "diagram-crop.pdf"
                subprocess.run(
                    ["pdftocairo", "-svg", pdf_for_svg, svg_path],
                    cwd=tmpdir,
                    env=env,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    text=True,
                    timeout=30,
                    check=True,
                )
            except (subprocess.CalledProcessError, subprocess.TimeoutExpired, FileNotFoundError) as exc:
                message = html_mod.escape(str(exc))
                source = html_mod.escape(tikz_source)
                return (
                    '<pre class="stacks-latex-fallback" '
                    f'title="{message}">{source}</pre>'
                )

    try:
        with open(svg_path, encoding="utf-8") as f:
            svg = strip_svg_header(f.read())
    except OSError:
        source = html_mod.escape(tikz_source)
        return f'<pre class="stacks-latex-fallback">{source}</pre>'

    svg = re.sub(r'<svg\b', '<svg class="stacks-tikzcd-svg"', svg, count=1)
    return (
        '<div class="stacks-tikzcd" role="img" '
        f'aria-label="{html_attr(aria_label)}">'
        f'{svg}</div>'
    )


def render_tikzcd_block(tikz_source):
    """Compile a tikzcd environment to inline SVG, with a readable fallback."""
    return render_tikz_block(tikz_source, "Commutative diagram")


def render_tikzpicture_block(tikz_source):
    """Compile a tikzpicture environment to inline SVG, with a readable fallback."""
    return render_tikz_block(tikz_source, "TikZ diagram")


def render_picture_block(picture_source):
    """Compile a LaTeX picture environment, including Inkscape overlays, to SVG."""
    return render_tikz_block(picture_source, "Figure")


def render_xypic_block(xy_source):
    """Compile an Xy-pic graph to inline SVG, with a readable fallback."""
    return render_tikz_block("\\[\n" + xy_source + "\n\\]", "Xy-pic diagram")


def normalize_geometric_alphabets(tex):
    """Normalize common geometric alphabet choices before MathJax rendering."""
    alphabet = "ACFGKNPQRZ"

    def normalize_letter(match):
        return "\\mathbb{" + match.group(1) + "}"

    tex = re.sub(r'\\operatorname\s*\{Gr\}', r'\\mathbb{G}', tex)
    tex = re.sub(r'\{\\bf\s+Gr\}', r'\\mathbb{G}', tex)
    tex = re.sub(r'\\bf\s+Gr\b', r'\\mathbb{G}', tex)
    tex = re.sub(r'\\mathbf\s*\{([' + alphabet + r'])\}', normalize_letter, tex)
    tex = re.sub(r'\\mathbf\s+([' + alphabet + r'])\b', normalize_letter, tex)
    tex = re.sub(r'\{\\bf\s+([' + alphabet + r'])\}', normalize_letter, tex)
    tex = re.sub(r'\\bf\s+([' + alphabet + r'])\b', normalize_letter, tex)
    tex = re.sub(r'\\mathbb\s+([' + alphabet + r'])\b', normalize_letter, tex)
    return tex


def resolve_graphics_path(name):
    """Find a graphics file referenced by \\includegraphics, if it is present."""
    cleaned = name.strip()
    if not cleaned:
        return None
    tex_dir = TEX_RENDER_CONTEXT["tex_dir"]
    base = os.path.normpath(os.path.join(tex_dir, cleaned))
    candidates = [base]
    root, ext = os.path.splitext(base)
    if not ext:
        candidates.extend(root + suffix for suffix in (
            ".png", ".jpg", ".jpeg", ".svg", ".gif", ".webp", ".pdf",
        ))
    for candidate in candidates:
        if os.path.isfile(candidate):
            return candidate
    return None


def render_includegraphics(argument):
    """Render an \\includegraphics command or a clean placeholder."""
    source_name = argument.strip()
    graphics_path = resolve_graphics_path(source_name)
    if not graphics_path:
        label = html_mod.escape(source_name)
        return (
            '<div class="stacks-figure-missing">'
            f'Figure file not available: <code>{label}</code>'
            '</div>'
        )

    rel_path = os.path.relpath(graphics_path, TEX_RENDER_CONTEXT["tex_dir"])
    rel_href = "../" + rel_path.replace(os.sep, "/")
    escaped_href = html_mod.escape(rel_href, quote=True)
    escaped_label = html_mod.escape(os.path.basename(graphics_path))
    if os.path.splitext(graphics_path)[1].lower() == ".pdf":
        return (
            '<div class="stacks-figure-file">'
            f'<a href="{escaped_href}">{escaped_label}</a>'
            '</div>'
        )
    return (
        '<div class="stacks-figure">'
        f'<img src="{escaped_href}" alt="{escaped_label}">'
        '</div>'
    )


def split_latex_top_level(text, delimiter):
    """Split on a LaTeX delimiter outside braces and inline math."""
    parts = []
    start = 0
    depth = 0
    in_math = False
    i = 0
    while i < len(text):
        char = text[i]
        prev = text[i - 1] if i else ''
        if char == '$' and prev != '\\':
            in_math = not in_math
            i += 1
            continue
        if not in_math:
            if char == '{':
                depth += 1
            elif char == '}' and depth:
                depth -= 1
            elif depth == 0 and text.startswith(delimiter, i):
                parts.append(text[start:i])
                i += len(delimiter)
                start = i
                continue
        i += 1
    parts.append(text[start:])
    return parts


def table_body_to_html(body):
    """Convert simple LaTeX table bodies to HTML tables."""
    captions = []

    def capture_caption(caption):
        captions.append(
            f'<div class="stacks-caption">{tex_to_html(caption.strip())}</div>'
        )
        return ''

    body = replace_latex_commands(body, "caption", capture_caption, allow_optional=True)
    body = re.sub(r'\\label\{[^}]*\}', '', body)
    body = re.sub(r'\\(?:endfirsthead|endhead|endfoot|endlastfoot)\b', '', body)
    body = re.sub(r'\\(?:toprule|midrule|bottomrule|hline)\b', '', body)
    rows = []
    for row in split_latex_top_level(body, r'\\'):
        row = row.strip()
        if not row:
            continue
        cells = [cell.strip() for cell in split_latex_top_level(row, '&')]
        html_cells = []
        for cell in cells:
            cell = re.sub(
                r'\\multicolumn\{\d+\}\{[^}]*\}\{((?:[^{}]|\{[^{}]*\})*)\}',
                r'\1',
                cell,
            )
            html_cells.append(f'<td>{tex_to_html(cell)}</td>')
        rows.append('<tr>' + ''.join(html_cells) + '</tr>')

    if not rows:
        return ''.join(captions)
    return (
        ''.join(captions) +
        '<div class="stacks-table-wrap">'
        '<table class="stacks-table"><tbody>'
        + ''.join(rows)
        + '</tbody></table></div>'
    )


def tabular_to_html(m):
    """Convert simple LaTeX tabular blocks to HTML tables."""
    return table_body_to_html(m.group(2))


def replace_table_environments(text):
    """Replace tabular/longtable environments, allowing nested braces in specs."""
    out = []
    pos = 0
    env_re = re.compile(r'\\begin\{(tabular|longtable)\}')
    while True:
        match = env_re.search(text, pos)
        if not match:
            out.append(text[pos:])
            break

        env_name = match.group(1)
        i = match.end()
        if i < len(text) and text[i] == "[":
            i += 1
            depth = 1
            while i < len(text) and depth:
                if text[i] == "[":
                    depth += 1
                elif text[i] == "]":
                    depth -= 1
                i += 1
        while i < len(text) and text[i].isspace():
            i += 1
        if i >= len(text) or text[i] != "{":
            out.append(text[pos:match.end()])
            pos = match.end()
            continue

        i += 1
        depth = 1
        while i < len(text) and depth:
            if text[i] == "{":
                depth += 1
            elif text[i] == "}":
                depth -= 1
            i += 1
        if depth:
            out.append(text[pos:])
            break

        body_start = i
        end_token = rf'\end{{{env_name}}}'
        end = text.find(end_token, body_start)
        if end == -1:
            out.append(text[pos:])
            break

        out.append(text[pos:match.start()])
        out.append(table_body_to_html(text[body_start:end]))
        pos = end + len(end_token)

    return ''.join(out)


def parse_latex_item_label(text, pos):
    """Return (optional label, content_start) after a LaTeX \\item token."""
    while pos < len(text) and text[pos].isspace():
        pos += 1
    if pos >= len(text) or text[pos] != '[':
        return None, pos

    start = pos + 1
    depth = 0
    pos = start
    while pos < len(text):
        ch = text[pos]
        if ch == '{':
            depth += 1
        elif ch == '}':
            depth = max(0, depth - 1)
        elif ch == ']' and depth == 0:
            return text[start:pos].strip(), pos + 1
        pos += 1

    return None, start - 1


def find_matching_latex_list_end(text, begin_match):
    """Find the end of a possibly nested enumerate/itemize environment."""
    token_re = re.compile(r'\\(begin|end)\{(?:enumerate|itemize)\}')
    depth = 1
    for match in token_re.finditer(text, begin_match.end()):
        if match.group(1) == "begin":
            depth += 1
        else:
            depth -= 1
            if depth == 0:
                return match.start(), match.end()
    return None, None


def split_latex_list_items(body):
    """Split a LaTeX list body at top-level \\item commands."""
    token_re = re.compile(r'\\begin\{(?:enumerate|itemize)\}|\\end\{(?:enumerate|itemize)\}|\\item\b')
    items = []
    depth = 0
    current_label = None
    current_start = None

    for match in token_re.finditer(body):
        token = match.group(0)
        if token.startswith('\\begin'):
            depth += 1
            continue
        if token.startswith('\\end'):
            depth = max(0, depth - 1)
            continue
        if depth != 0:
            continue

        if current_start is not None:
            items.append((current_label, body[current_start:match.start()].strip()))
        current_label, current_start = parse_latex_item_label(body, match.end())

    if current_start is not None:
        items.append((current_label, body[current_start:].strip()))

    return [(label, content) for label, content in items if content]


def convert_latex_lists(text):
    """Convert nested LaTeX enumerate/itemize environments to HTML lists."""
    begin_re = re.compile(r'\\begin\{(enumerate|itemize)\}')
    out = []
    pos = 0
    while True:
        begin = begin_re.search(text, pos)
        if not begin:
            out.append(text[pos:])
            break

        end_start, end_end = find_matching_latex_list_end(text, begin)
        if end_start is None:
            out.append(text[pos:])
            break

        out.append(text[pos:begin.start()])
        env = begin.group(1)
        tag = "ol" if env == "enumerate" else "ul"
        body = text[begin.end():end_start]
        html_items = []
        for label, item_content in split_latex_list_items(body):
            item_html = convert_latex_lists(item_content)
            if label:
                item_html = f'<strong>{label}</strong> {item_html}'
            html_items.append(f'<li>{item_html}</li>')
        out.append(f'<{tag}>' + '\n'.join(html_items) + f'</{tag}>')
        pos = end_end

    return ''.join(out)


def tex_to_html(tex):
    """Convert LaTeX markup to HTML for MathJax rendering."""
    s = normalize_geometric_alphabets(tex)

    # Text macros from the source preamble which are not MathJax macros.
    s = s.replace('\\Aletheia', '<em>Aletheia</em>')
    s = re.sub(r'\\texorpdfstring\{((?:[^{}]|\{[^{}]*\})*)\}\{(?:[^{}]|\{[^{}]*\})*\}', r'\1', s)

    # --- Block-level environments (before inline processing) ---

    # Human-AI interaction card.
    def interaction_begin_replace(m):
        raw_link = html_mod.escape(m.group(2).strip())
        link_html = (
            f'<div class="interaction-source">'
            f'<a href="{raw_link}">Raw prompts and outputs</a></div>'
            if raw_link else ''
        )
        return (
            '<div class="interaction-log">'
            '<div class="interaction-title">Human-AI Interaction Card</div>'
            + link_html
        )

    s = re.sub(
        r'\\begin\{interactionlog\}(?:\[([^\]]*)\])?\{([^}]*)\}',
        interaction_begin_replace,
        s,
    )
    s = s.replace('\\end{interactionlog}', '</div>')

    def human_replace(m):
        message = tex_to_html(m.group(1).strip())
        return (
            '<div class="interaction-row interaction-human">'
            f'<div class="interaction-bubble">{message}</div>'
            '<div class="interaction-speaker">Human</div>'
            '</div>'
        )

    s = re.sub(r'\\human\{((?:[^{}]|\{[^{}]*\})*)\}', human_replace, s, flags=re.DOTALL)

    def ai_replace(m):
        name = tex_to_html(m.group(1).strip())
        message = tex_to_html(m.group(2).strip())
        return (
            '<div class="interaction-row interaction-ai">'
            f'<div class="interaction-speaker">{name}</div>'
            f'<div class="interaction-bubble">{message}</div>'
            '</div>'
        )

    s = re.sub(
        r'\\ai\{((?:[^{}]|\{[^{}]*\})*)\}\{((?:[^{}]|\{[^{}]*\})*)\}',
        ai_replace,
        s,
        flags=re.DOTALL,
    )

    # tikzcd → inline SVG rendered by LaTeX when possible.
    s = re.sub(
        r'\\begin\{tikzcd\}(?:\[[^\]]*\])?.*?\\end\{tikzcd\}',
        lambda m: render_tikzcd_block(m.group(0)),
        s, flags=re.DOTALL
    )
    s = re.sub(
        r'\\begin\{tikzpicture\}(?:\[[^\]]*\])?.*?\\end\{tikzpicture\}',
        lambda m: render_tikzpicture_block(m.group(0)),
        s, flags=re.DOTALL
    )
    s = remove_latex_commands(s, "tikzset")
    s = re.sub(
        r'\\begingroup\b.*?\\begin\{picture\}.*?\\end\{picture\}.*?\\endgroup\b',
        lambda m: render_picture_block(m.group(0)),
        s,
        flags=re.DOTALL,
    )
    s = re.sub(
        r'\\begin\{picture\}.*?\\end\{picture\}',
        lambda m: render_picture_block(m.group(0)),
        s,
        flags=re.DOTALL,
    )
    s = replace_latex_commands(
        s,
        "xygraph",
        lambda body: render_xypic_block("\\xygraph{" + body + "}"),
    )

    # figure/table/subfigure wrappers are layout hints in LaTeX; keep captions
    # and labels as plain HTML around any rendered diagrams or tables.
    s = re.sub(r'\\begin\{(?:figure|table)\}(?:\[[^\]]*\])?', '', s)
    s = re.sub(r'\\end\{(?:figure|table)\}', '', s)
    s = re.sub(r'\\begin\{subfigure\}(?:\[[^\]]*\])?(?:\{[^{}]*\})?', '', s)
    s = re.sub(r'\\end\{subfigure\}', '', s)
    s = re.sub(r'\\centering\b', '', s)
    s = replace_latex_two_arg_commands(s, "renewcommand", lambda _name, _value: "")

    # tabular/longtable → semantic HTML table instead of fragile MathJax arrays.
    # Do this before general caption handling so longtable captions stay with
    # their tables instead of becoming bogus table rows.
    s = replace_table_environments(s)

    s = replace_latex_commands(
        s,
        "caption",
        lambda caption: f'<div class="stacks-caption">{tex_to_html(caption.strip())}</div>',
        allow_optional=True,
    )
    s = re.sub(r'\\label\{[^}]*\}', '', s)
    s = replace_latex_commands(
        s,
        "includegraphics",
        render_includegraphics,
        allow_optional=True,
    )

    # center → strip
    s = re.sub(r'\\begin\{center\}', '', s)
    s = re.sub(r'\\end\{center\}', '', s)

    # equation environment → display math
    def equation_replace(m):
        body = m.group(1)
        if 'stacks-tikzcd' in body:
            return body.strip()
        body = re.sub(r'\\label\{[^}]*\}', '', body)
        body = re.sub(r'\\nonumber', '', body)
        return '$$' + body.strip() + '$$'
    s = re.sub(r'\\begin\{equation\*?\}(.*?)\\end\{equation\*?\}',
               equation_replace, s, flags=re.DOTALL)

    # align/align* → display math with aligned
    def align_replace(m):
        body = m.group(1)
        body = re.sub(r'\\label\{[^}]*\}', '', body)
        body = re.sub(r'\\nonumber', '', body)
        return '$$\\begin{aligned}' + body.strip() + '\\end{aligned}$$'
    s = re.sub(r'\\begin\{align\*?\}(.*?)\\end\{align\*?\}',
               align_replace, s, flags=re.DOTALL)

    # eqnarray/eqnarray* → display math with aligned
    def eqnarray_replace(m):
        body = m.group(1)
        body = re.sub(r'\\label\{[^}]*\}', '', body)
        body = re.sub(r'\\nonumber', '', body)
        return '$$\\begin{aligned}' + body.strip() + '\\end{aligned}$$'
    s = re.sub(r'\\begin\{eqnarray\*?\}(.*?)\\end\{eqnarray\*?\}',
               eqnarray_replace, s, flags=re.DOTALL)

    # enumerate/itemize → ordered/unordered lists.  This is recursive so
    # nested lists and optional labels such as \item[$\O^{[3]}$:] survive.
    s = convert_latex_lists(s)

    # Authors sometimes write adjacent inline math fragments separated by a
    # spacing command, e.g. "$f=0$ \quad $(A_1)$".  The spacing command is
    # text in HTML unless we move it back inside the math span.
    spacing_pattern = re.compile(r'\$([^$]+)\$\s*\\(quad|qquad)\s*\$([^$]+)\$')
    while True:
        s_next = spacing_pattern.sub(r'$\1 \\\2 \3$', s)
        if s_next == s:
            break
        s = s_next

    # \subsubsection{...} → inline heading
    s = replace_latex_heading_commands(
        s,
        "subsubsection",
        lambda title: f'<h3 class="stacks-subsections-heading">{tex_to_html(title)}</h3>',
    )

    # \customlabel{key}{shown-value} should display just its shown value.
    s = re.sub(r'\\customlabel\{[^}]+\}\{([^}]+)\}', r'\1', s)

    # \footnote{...} → parenthetical note
    s = re.sub(r'\\footnote\{((?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*)\}',
               r' <span style="font-size:0.9em;color:#555;">(\1)</span>', s)

    # Hyperlinks inside captions and prose should become ordinary HTML links
    # before inline formatting/maths are handled.
    s = replace_latex_two_arg_commands(
        s,
        "href",
        lambda url, label: (
            f'<a href="{html_mod.escape(url.strip(), quote=True)}">'
            f'{tex_to_html(label.strip())}</a>'
        ),
    )
    s = replace_latex_commands(
        s,
        "url",
        lambda url: (
            f'<a href="{html_mod.escape(url.strip(), quote=True)}">'
            f'{html_mod.escape(url.strip())}</a>'
        ),
    )

    # --- Inline formatting ---

    s = replace_latex_text_command(s, "emph", "em")
    s = replace_latex_text_command(s, "textit", "em")
    s = replace_latex_text_command(s, "textsl", "em")
    s = replace_latex_text_command(s, "textbf", "strong")
    s = replace_latex_text_command(s, "texttt", "code")

    # Declaration-style formatting from BibTeX .bbl output.  These often
    # contain capitalization braces, so regexes that stop at the first brace
    # corrupt titles; use balanced scanning instead.
    s = replace_latex_declaration_group(s, "sl", "em")
    s = replace_latex_declaration_group(s, "it", "em")
    s = replace_latex_declaration_group(s, "em", "em")
    s = replace_latex_declaration_group(s, "bf", "strong")
    s = replace_latex_declaration_group(s, "tt", "code")
    s = replace_latex_declaration_group(s, "sc", "span", ' class="stacks-small-caps"')

    # ~ -> non-breaking space
    s = s.replace('~', '&nbsp;')

    # \[ ... \] -> $$ ... $$, except rendered diagram blocks.
    def bracket_display_replace(m):
        body = m.group(1).strip()
        if 'stacks-tikzcd' in body:
            return body
        return '$$' + body + '$$'
    s = re.sub(r'\\\[(.*?)\\\]', bracket_display_replace, s, flags=re.DOTALL)

    # --- -> &mdash;   -- -> &ndash;
    s = s.replace('---', '&mdash;')
    s = s.replace('--', '&ndash;')

    # Accented characters
    s = s.replace('\\"u', '&uuml;')
    s = s.replace('\\"o', '&ouml;')
    s = s.replace('\\"a', '&auml;')
    s = s.replace("\\'e", '&eacute;')
    s = s.replace("\\'{e}", '&eacute;')
    s = s.replace("\\'a", '&aacute;')
    s = s.replace("\\'{a}", '&aacute;')
    s = re.sub(r'\\o(?![a-zA-Z])', '&oslash;', s)

    # \square, \qedhere — remove
    s = re.sub(r'\s*\\square\s*', '', s)
    s = re.sub(r'\s*\\qedhere\s*', '', s)

    # \todo{...} — remove
    s = re.sub(r'\\todo\{(?:[^{}]|\{[^{}]*\})*\}', '', s)

    # \newblock — remove (from bibliography)
    s = s.replace('\\newblock', '')
    s = re.sub(r'\\newline\b', '<br>', s)

    # Double newlines → paragraph breaks
    s = re.sub(r'\n\s*\n', '</p>\n<p>', s)
    s = re.sub(r'</p>\s*<p>\s*(<(?:ol|ul)\b)', r'\1', s)
    s = re.sub(r'<p>\s*(<(?:ol|ul)\b)', r'\1', s)
    s = re.sub(r'(</(?:ol|ul)>)\s*</p>\s*<p>', r'\1', s)
    s = re.sub(r'(</(?:ol|ul)>)\s*</p>', r'\1', s)
    s = re.sub(r'<p>\s*</p>', '', s)

    return s.strip()


def replace_latex_text_command(text, command, html_tag):
    """Replace simple text commands while respecting nested TeX braces."""
    needle = "\\" + command + "{"
    out = []
    pos = 0
    while True:
        start = text.find(needle, pos)
        if start == -1:
            out.append(text[pos:])
            break
        out.append(text[pos:start])
        body_start = start + len(needle)
        depth = 1
        i = body_start
        while i < len(text) and depth:
            if text[i] == "{":
                depth += 1
            elif text[i] == "}":
                depth -= 1
            i += 1
        if depth:
            out.append(text[start:])
            break
        body = text[body_start:i - 1]
        out.append(f"<{html_tag}>{body}</{html_tag}>")
        pos = i
    return "".join(out)


def replace_latex_declaration_group(text, command, html_tag, attrs=""):
    """Replace groups like {\\em ...} or {\\sc ...} using balanced braces."""
    out = []
    pos = 0
    pattern = re.compile(r'\{\\' + re.escape(command) + r'(?![A-Za-z])')
    while True:
        match = pattern.search(text, pos)
        if not match:
            out.append(text[pos:])
            break
        out.append(text[pos:match.start()])
        i = match.end()
        if i < len(text) and text[i].isspace():
            i += 1
        body_start = i
        depth = 1
        while i < len(text) and depth:
            if text[i] == "{":
                depth += 1
            elif text[i] == "}":
                depth -= 1
            i += 1
        if depth:
            out.append(text[match.start():])
            break
        body = text[body_start:i - 1]
        out.append(f"<{html_tag}{attrs}>{body}</{html_tag}>")
        pos = i
    return "".join(out)


# ============================================================
# TAG ASSIGNMENT & REF RESOLUTION
# ============================================================

def assign_tags_and_numbers(paper, slug, registry, existing_tags, previous_tags=None):
    """Walk the parsed paper, assign tags and environment numbers,
    and resolve \\ref{}, \\Cref{}, and \\eqref{} cross-references."""

    previous_tags = previous_tags or {}
    label_map = {}  # label -> {tag, number, envType}

    # Add section/subsection labels to the label map
    for label, info in paper.get("section_labels", {}).items():
        label_map[label] = {
            "tag": "",
            "number": info["number"],
            "envType": "Section",
        }
    for label, number in paper.get("equation_labels", {}).items():
        label_map[label] = {
            "tag": "",
            "number": number,
            "envType": "Equation",
        }
    for label, info in paper.get("auxiliary_labels", {}).items():
        label_map[label] = {
            "tag": "",
            "number": info["number"],
            "envType": info["envType"],
        }
    for label, number in paper.get("custom_labels", {}).items():
        label_map[label] = {
            "tag": "",
            "number": number,
            "envType": "Item",
        }
    env_counter = {}  # per-section counters for theorem-like envs
    all_envs = []  # ordered list of all tagged environments

    def assign_env_tag(block, label, number):
        if label:
            registry_key = label
            tag_key = f"{slug}:{label}"
        else:
            ordinal = len(all_envs) + 1
            registry_key = (
                f"auto:{slug}:{block['envName']}:"
                f"{number or 'unnumbered'}:{ordinal}"
            )
            tag_key = registry_key

        tag = None
        previous_for_key = previous_tags.get(registry_key)
        if isinstance(previous_for_key, list) and previous_for_key:
            tag = previous_for_key.pop(0)
        elif previous_for_key:
            tag = previous_for_key
        if not tag or tag in existing_tags:
            tag = label_to_tag(tag_key, existing_tags)
        existing_tags.add(tag)
        block["tag"] = tag

        if label:
            label_map[label] = {
                "tag": tag,
                "number": number,
                "envType": block["envType"],
            }

        registry[tag] = {
            "paper": slug,
            "label": registry_key,
            "envType": block["envType"],
            "number": number,
        }
        all_envs.append(block)

    for sec in paper["sections"]:
        sec_n = int(sec["number"])
        env_counter[sec_n] = 0

        def process_blocks(blocks, _sec_n=sec_n):
            for block in blocks:
                if block["type"] != "env":
                    continue
                if block["envName"] == "proof":
                    label = block.get("label")
                    block["number"] = ""
                    assign_env_tag(block, label, "")
                else:
                    env_counter[_sec_n] += 1
                    number = f"{_sec_n}.{env_counter[_sec_n]}"
                    block["number"] = number

                    label = block.get("label")
                    assign_env_tag(block, label, number)
                # Recurse into children
                if block.get("children"):
                    process_blocks(block["children"], _sec_n)

        process_blocks(sec["blocks"])
        for sub in sec["subsections"]:
            process_blocks(sub["blocks"])

    # Second pass: resolve \ref{}, \Cref{}, \eqref{} in all content
    def display_ref(info, include_type=False):
        tag = info.get("tag")
        env_type = info["envType"]
        number = info["number"]
        if tag:
            label = f"{env_type}&nbsp;{number}" if include_type and number else (number or env_type)
            href = f"/papers/{slug}/tag/{tag}.html"
            return f'<a href="{href}" class="stacks-ref-link">{label} <span class="stacks-ref-tag">[{tag}]</span></a>'
        if include_type:
            return f"{env_type}&nbsp;{number}" if number else env_type
        return number if number else env_type

    def format_unresolved_ref(label, include_type=False):
        """Readable fallback for labels outside the generated tag universe."""
        prefixes = (
            (("fig:", "figure:"), "Figure"),
            (("tab:", "table:"), "Table"),
            (("sec:", "section:", "subsec:", "subsection:", "ssec:", "sssec:"), "Section"),
            (("eq:", "eqn:", "equation:"), "Equation"),
            (("item", "condition:", "criteria:"), "Item"),
        )
        for starts, env_type in prefixes:
            if label.startswith(starts):
                return f"{env_type}&nbsp;{html_mod.escape(label)}" if include_type else html_mod.escape(label)
        return html_mod.escape(label)

    def resolve_ref_list(labels, include_type=False):
        parts = []
        for raw_label in labels.split(","):
            label = raw_label.strip()
            if label in label_map:
                parts.append(display_ref(label_map[label], include_type=include_type))
            else:
                parts.append(format_unresolved_ref(label, include_type=include_type))
        if len(parts) <= 1:
            return "".join(parts)
        return ", ".join(parts[:-1]) + ", and " + parts[-1]

    def resolve_refs(text, refs_include_type=False):
        def ref_replacer(m):
            return resolve_ref_list(m.group(1), include_type=False)

        def cref_replacer(m):
            return resolve_ref_list(m.group(1), include_type=True)

        def eqref_replacer(m):
            label = m.group(1)
            if label in label_map:
                info = label_map[label]
                number = info["number"]
                return f"({number})" if number else "(?)"
            return f"({html_mod.escape(label)})"

        # Process \Cref before \ref to avoid partial matches
        text = re.sub(r'\\Cref\{([^}]+)\}', cref_replacer, text)
        text = re.sub(r'\\cref\{([^}]+)\}', cref_replacer, text)
        text = re.sub(r'\\autoref\{([^}]+)\}', cref_replacer, text)
        text = re.sub(r'\\eqref\{([^}]+)\}', eqref_replacer, text)
        text = re.sub(r'\\ref\{([^}]+)\}', ref_replacer, text)
        return text

    def resolve_blocks(blocks):
        for block in blocks:
            if "content" in block:
                block["content"] = resolve_refs(block["content"])
            if "envType" in block:
                block["envType"] = resolve_refs(block["envType"], refs_include_type=True)
            if block.get("children"):
                resolve_blocks(block["children"])

    for sec in paper["sections"]:
        sec["title"] = resolve_refs(tex_to_html(sec["title"]))
        for sub in sec["subsections"]:
            sub["title"] = resolve_refs(tex_to_html(sub["title"]))
        resolve_blocks(sec["blocks"])
        for sub in sec["subsections"]:
            resolve_blocks(sub["blocks"])

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

    def format_cite_option(opt):
        opt = opt.replace("~", "&nbsp;")
        opt = opt.replace(r"\S", "&sect;")
        return opt

    def cite_replacer(m):
        opt = m.group(1)  # optional argument like \cite[Section 2]{key}
        keys_str = m.group(2)
        # Handle multiple comma-separated keys like \cite{key1, key2}
        keys = [k.strip() for k in keys_str.split(',')]
        labels = []
        for key in keys:
            if key in citations:
                labels.append(citations[key])
            else:
                labels.append(key)
        label_text = ', '.join(labels)
        if opt:
            return f'[{label_text}, {format_cite_option(opt)}]'
        return f'[{label_text}]'

    def process_content(text):
        return re.sub(r'\\cite(?:\[([^\]]*)\])?\{([^}]+)\}', cite_replacer, text)

    def process_blocks(blocks):
        for block in blocks:
            if "content" in block:
                block["content"] = process_content(block["content"])
            if block.get("children"):
                process_blocks(block["children"])

    for sec in paper["sections"]:
        process_blocks(sec["blocks"])
        for sub in sec["subsections"]:
            process_blocks(sub["blocks"])


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
    document_title = html_attr(f"{title} — {paper_title}")
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
  <meta http-equiv="Cache-Control" content="no-store, max-age=0">
  <meta http-equiv="Pragma" content="no-cache">
  <meta http-equiv="Expires" content="0">
  <title>{document_title}</title>
  <link rel="stylesheet" href="{prefix}../../style.css?v=stacks-20260517">
  <link rel="stylesheet" href="{prefix}stacks.css?v=stacks-20260517">
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
            parts.append(f'<a href="{prefix}{href}">{html_mod.escape(strip_html(label))}</a>')
        else:
            parts.append(f'<span>{label}</span>')
    return '<div class="stacks-breadcrumb">' + ' / '.join(parts) + '</div>\n'


def footer_html(arxiv_id, depth=0, has_bibliography=False):
    prefix = "../" * depth
    bibliography_link = (
        f' &middot; <a href="{prefix}bibliography.html">Bibliography</a>'
        if has_bibliography else ''
    )
    return f"""<footer class="stacks-footer">
  <div class="stacks-footer-inner">
    &copy; 2025 Anand Patel &middot; <a href="https://arxiv.org/abs/{arxiv_id}">arXiv:{arxiv_id}</a>{bibliography_link}
  </div>
</footer>
</body>
</html>"""


def render_block(block, depth=0):
    prefix = "../" * depth
    if block["type"] == "para":
        stripped = block["content"].strip()
        if stripped.startswith('<div class="interaction-') or stripped == '</div>':
            return stripped + '\n'
        return wrap_content_html(block["content"], "stacks-para")
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

        eid = (block.get("label") or "").replace(":", "-")

        # Render body: either direct content or recursive children
        if block.get("children"):
            inner_html = ""
            for child in block["children"]:
                inner_html += render_block(child, depth)
            body_html = inner_html
        else:
            body_html = wrap_content_html(block["content"])

        return f"""<div class="{css_class}" id="{eid}">
  <div class="stacks-env-head">{head_html}</div>
  <div class="stacks-env-body">{body_html}</div>
</div>
"""
    return ""


def find_matching_html_list_end(content, start):
    """Find the end of a top-level HTML list, including nested lists."""
    list_re = re.compile(r'</?(ol|ul)\b[^>]*>')
    depth = 0
    for match in list_re.finditer(content, start):
        if match.group(0).startswith('</'):
            depth -= 1
            if depth == 0:
                return match.end()
        else:
            depth += 1
    return None


def split_content_html_blocks(content):
    """Split converted content into text and block-HTML pieces."""
    block_start_re = re.compile(
        r'<(?:ol|ul)\b'
        r'|<h[2-4]\b[^>]*class="[^"]*stacks-subsections-heading[^"]*"'
        r'|<(div|pre)\b[^>]*class="[^"]*'
        r'(?:stacks-tikzcd|stacks-table-wrap|stacks-caption|stacks-latex-fallback|stacks-figure|stacks-figure-file|stacks-figure-missing)'
        r'[^"]*"'
    )
    heading_re = re.compile(
        r'<(?P<tag>h[2-4])\b[^>]*class="[^"]*stacks-subsections-heading[^"]*"[\s\S]*?</(?P=tag)>'
    )
    div_pre_re = re.compile(
        r'<(?P<tag>div|pre)\b[^>]*class="[^"]*'
        r'(?:stacks-tikzcd|stacks-table-wrap|stacks-caption|stacks-latex-fallback|stacks-figure|stacks-figure-file|stacks-figure-missing)'
        r'[^"]*"[\s\S]*?</(?P=tag)>'
    )

    pieces = []
    pos = 0
    while True:
        start = block_start_re.search(content, pos)
        if not start:
            pieces.append(("text", content[pos:]))
            break
        if start.start() > pos:
            pieces.append(("text", content[pos:start.start()]))

        if start.group(0).startswith('<ol') or start.group(0).startswith('<ul'):
            end = find_matching_html_list_end(content, start.start())
            if end is None:
                pieces.append(("text", content[start.start():]))
                break
            pieces.append(("block", content[start.start():end]))
            pos = end
            continue

        if start.group(0).startswith('<h'):
            block = heading_re.match(content, start.start())
            if not block:
                pieces.append(("text", content[start.start():start.end()]))
                pos = start.end()
                continue
            pieces.append(("block", block.group(0)))
            pos = block.end()
            continue

        block = div_pre_re.match(content, start.start())
        if not block:
            pieces.append(("text", content[start.start():start.end()]))
            pos = start.end()
            continue
        pieces.append(("block", block.group(0)))
        pos = block.end()

    return pieces


def wrap_content_html(content, paragraph_class=None):
    """Wrap converted LaTeX in paragraphs while letting block HTML stand alone."""
    class_attr = f' class="{paragraph_class}"' if paragraph_class else ''
    pieces = split_content_html_blocks(content.strip())
    if all(kind == "text" for kind, _ in pieces):
        newline = '\n' if paragraph_class else ''
        return f'<p{class_attr}>{content}</p>{newline}'

    html = []
    for kind, piece in pieces:
        if not piece or not piece.strip():
            continue
        if kind == "block":
            html.append(piece.strip() + '\n')
        else:
            html.append(f'<p{class_attr}>{piece.strip()}</p>\n')
    return ''.join(html)


def comment_form(page_label, return_url, paper_title):
    subject = html_attr(f"Comment on {paper_title} — {page_label}")
    next_url = html_mod.escape(return_url, quote=True)
    return f"""
<hr>
<div class="stacks-comments">
  <h3>Comments</h3>
  <p class="stacks-comments-empty">No comments yet.</p>
  <div class="stacks-comment-form">
    <h4>Leave a comment</h4>
    <p>Comments are reviewed before appearing. Your comment will be emailed to the author for approval.</p>
    <form action="https://formsubmit.co/{FORMSUBMIT_EMAIL}" method="POST">
      <input type="hidden" name="_subject" value="{subject}">
      <input type="hidden" name="_next" value="{next_url}">
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


def write_html(path, html):
    """Write generated HTML with stable line endings and no trailing spaces."""
    html = re.sub(r'<p(?:\s+class="[^"]*")?>\s*</p>\n?', '', html)
    cleaned = "\n".join(line.rstrip() for line in html.splitlines()) + "\n"
    with open(path, "w") as f:
        f.write(cleaned)


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
    with open(tex_path, errors="replace") as f:
        tex_source = f.read()
    configure_tex_renderer(tex_source, out_dir)

    # Extract MathJax macros from preamble
    macros = parse_preamble_macros(tex_source)
    print(f"  Extracted {len(macros)} MathJax macros from preamble")

    # Parse citations and bibliography
    bibliography = parse_bibliography(meta, out_dir, tex_source)
    citations = bibliography["citations"]
    bibliography_entries = bibliography["entries"]
    has_bibliography = bool(bibliography_entries)
    print(f"  Loaded {len(citations)} citation entries")
    print(f"  Loaded {len(bibliography_entries)} bibliography entries")

    # Parse document
    paper = parse_tex(tex_source)
    print(f"Parsed: {paper['title']} by {paper['author']}")
    print(f"  {len(paper['sections'])} sections")

    # Assign tags
    registry = load_registry()
    previous_tags = {}
    for tag, info in registry.items():
        if info.get("paper") == slug and info.get("label"):
            previous_tags.setdefault(info.get("label"), []).append(tag)
    # Remove old tags for this paper (allows clean rebuild)
    registry = {k: v for k, v in registry.items() if v.get("paper") != slug}
    existing_tags = set(registry.keys())

    all_envs, label_map = assign_tags_and_numbers(
        paper, slug, registry, existing_tags, previous_tags)

    # Resolve citations (after ref resolution, so citations in env content are handled)
    resolve_citations(paper, citations)

    save_registry(registry)

    print(f"  {len(all_envs)} tagged environments")
    for env in all_envs:
        print(f"    Tag {env['tag']}: {env['envType']} {env.get('number','')}")

    # Create output dirs
    for subdir in ("tag", "section"):
        old_dir = os.path.join(out_dir, subdir)
        if os.path.isdir(old_dir):
            shutil.rmtree(old_dir)
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
        sec_title_plain = html_mod.escape(strip_html(sec["title"]))
        toc += f'  <li><a href="section/{sec["id"]}.html">Section {sec["number"]}: {sec_title_plain}</a>\n'
        if sec["subsections"]:
            toc += '    <ul>\n'
            for sub in sec["subsections"]:
                sub_title_plain = html_mod.escape(strip_html(sub["title"]))
                toc += f'      <li><a href="section/{sub["id"]}.html">{sub["number"]}. {sub_title_plain}</a></li>\n'
            toc += '    </ul>\n'
        toc += '  </li>\n'
    if has_bibliography:
        toc += '  <li><a href="bibliography.html">Bibliography</a></li>\n'
    toc += '</ul>\n'

    # Tag table
    toc += '<hr>\n<h2 class="stacks-toc-heading">Tags</h2>\n'
    toc += '<table class="stacks-tag-table">\n'
    toc += '<tr><th>Tag</th><th>Type</th><th>Number</th></tr>\n'
    for env in all_envs:
        toc += f'<tr><td><a href="tag/{env["tag"]}.html">{env["tag"]}</a></td>'
        toc += f'<td>{env["envType"]}</td><td>{env.get("number","")}</td></tr>\n'
    toc += '</table>\n</main>\n'
    toc += footer_html(arxiv_id, has_bibliography=has_bibliography)

    write_html(os.path.join(out_dir, "index.html"), toc)
    print("Generated: index.html")

    # --- 1b. Bibliography page ---
    if has_bibliography:
        bib_html = head("Bibliography", paper["title"], macros=macros)
        bib_html += nav_bar(paper["author"], paper["title"])
        bib_html += breadcrumb_html([("Bibliography", None)])
        bib_html += '<main class="stacks-main">\n'
        bib_html += '<h1 class="stacks-section-title">Bibliography</h1>\n'
        bib_html += '<ol class="stacks-bibliography">\n'
        for entry in bibliography_entries:
            label = html_mod.escape(entry["label"])
            bib_html += (
                f'  <li id="bib-{html_attr(entry["key"])}">'
                f'<span class="stacks-bib-label">[{label}]</span> '
                f'{entry["html"]}</li>\n'
            )
        bib_html += '</ol>\n'
        bib_html += '</main>\n' + footer_html(
            arxiv_id, has_bibliography=has_bibliography)
        write_html(os.path.join(out_dir, "bibliography.html"), bib_html)
        print("Generated: bibliography.html")

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
                sub_title_plain = html_mod.escape(strip_html(sub["title"]))
                sec_html += f'  <li><a href="{sub["id"]}.html">{sub["number"]}. {sub_title_plain}</a></li>\n'
            sec_html += '</ul>\n'

        sec_html += comment_form(
            f'Section {sec["number"]}: {sec["title"]}',
            f'{base_url}/section/{sec["id"]}.html',
            paper["title"])
        sec_html += '</main>\n' + footer_html(
            arxiv_id, depth=1, has_bibliography=has_bibliography)

        write_html(os.path.join(out_dir, "section", f'{sec["id"]}.html'), sec_html)
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
            sub_html += '</main>\n' + footer_html(
                arxiv_id, depth=1, has_bibliography=has_bibliography)

            write_html(os.path.join(out_dir, "section", f'{sub["id"]}.html'), sub_html)
            print(f"Generated: section/{sub['id']}.html")

    # --- 3. Tag pages ---
    for idx, env in enumerate(all_envs):
        tag = env["tag"]
        env_type = env["envType"]
        number = env.get("number", "")
        label_text = f"{env_type}" + (f" {number}" if number else "")
        plain_label_text = strip_html(label_text)

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
        bc_items.append((f'{plain_label_text} ({tag})', None))

        tag_html = head(f'{plain_label_text} ({tag})', paper["title"], depth=1, macros=macros)
        tag_html += nav_bar(paper["author"], paper["title"], depth=1)
        tag_html += breadcrumb_html(bc_items, depth=1)
        tag_html += '<main class="stacks-main">\n'

        # Prev / Next
        nav_links = '<div class="stacks-tag-nav">'
        if idx > 0:
            pt = all_envs[idx - 1]
            pn = pt.get("number", "")
            nav_links += f'<a href="{pt["tag"]}.html">&laquo; {strip_html(pt["envType"])} {pn}</a>'
        nav_links += f'<span class="stacks-tag-current">Tag {tag}</span>'
        if idx < len(all_envs) - 1:
            nt = all_envs[idx + 1]
            nn = nt.get("number", "")
            nav_links += f'<a href="{nt["tag"]}.html">{strip_html(nt["envType"])} {nn} &raquo;</a>'
        nav_links += '</div>\n'
        tag_html += nav_links

        tag_html += render_block(env, depth=1)

        tag_html += comment_form(
            f'Tag {tag} ({plain_label_text})',
            f'{base_url}/tag/{tag}.html',
            paper["title"])
        tag_html += '</main>\n' + footer_html(
            arxiv_id, depth=1, has_bibliography=has_bibliography)

        write_html(os.path.join(out_dir, "tag", f'{tag}.html'), tag_html)
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
