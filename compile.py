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
Section and subsection page IDs are stored in papers/section-registry.json;
displayed numbering may change without silently reassigning an old URL.
New labeled environments get deterministic 4-hex-char hashes of the paper
slug and label string. Unlabeled environments first reuse an exact normalized
raw-source fingerprint; genuinely new environments receive a deterministic
tag whose seed includes their type, displayed number, and source position.

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
SECTION_REGISTRY_PATH = os.path.join(
    SITE_ROOT, "papers", "section-registry.json")
PROJECT_STYLESHEET_SOURCE = os.path.join(
    SITE_ROOT, "papers", "hodge-bundle", "stacks.css")
FORMSUBMIT_EMAIL = "anand.patel@okstate.edu"
COMMENTS_ASSET_VERSION = "comments-20260519"
LATEX_RENDERER_VERSION = "20260930-2"
TEX_RENDER_CONTEXT = {
    "preamble": "",
    "tikzset": "",
    "twoopt_macros": {},
    "tex_dir": SITE_ROOT,
    "cache_dir": os.path.join(SITE_ROOT, ".tikz-cache"),
    "svg_serial": 0,
}

# A label is normally the permanent identity of a tagged environment.  These
# entries repair historical registries in which a draft copy inside a LaTeX
# ``comment`` environment, or an intermediate rebuild, displaced the tag of
# the live labeled statement.  Keep this list deliberately small: unlabeled
# environments are matched by source fingerprints below, never by overrides.
CANONICAL_NAMED_TAGS = {
    ("equivariant-degenerations", "predegree"): "69D0",
    ("equivariant-degenerations", "doubleconic"): "B34A",
    ("orbits-equivariant-quantum", "PFAintro"): "3E13",
    ("orbits-equivariant-quantum", "siorbit"): "E453",
    ("orbits-equivariant-quantum", "finkformulas"): "C75C",
}

# A source correction inside this historically unlabeled proof changes its raw
# fingerprint.  Pin its existing public tag explicitly rather than retiring
# the permalink and allocating a new automatic tag.
CANONICAL_AUTOMATIC_TAGS = {
    (
        "invariants-branched-cover",
        "auto:invariants-branched-cover:proof:unnumbered:66",
    ): "54ED",
}

# Redirects whose source IDs were already absent from the working registry
# when permalink preservation was introduced.  Ordinary superseded tags are
# inferred from the previous registry and do not belong in this table.
HISTORICAL_TAG_REDIRECTS = {
    ("equivariant-degenerations", "669D"): "69D0",
    ("orbits-equivariant-quantum", "E134"): "3E13",
    ("orbits-equivariant-quantum", "453E"): "E453",
}

# The committed website predates the section registry.  Correct comment
# stripping removes one draft section from equivariant-degenerations and
# shifts every later source-position ID.  On the first registry-backed build,
# map the still-live pages back to their published IDs.  Subsequent builds use
# the registry identities below and do not consult source ordinals.
INITIAL_SECTION_ID_MIGRATIONS = {
    ("equivariant-degenerations", "S3"): "S4",
    ("equivariant-degenerations", "S4"): "S5",
    ("equivariant-degenerations", "S5"): "S6",
    ("equivariant-degenerations", "S6"): "S7",
    ("equivariant-degenerations", "S7"): "S8",
    ("equivariant-degenerations", "S8"): "S9",
    ("equivariant-degenerations", "S9"): "S10",
    ("equivariant-degenerations", "S10"): "S11",
    ("equivariant-degenerations", "S2.SS6"): "S3.SS3",
    ("equivariant-degenerations", "S4.SS1"): "S5.SS1",
    ("equivariant-degenerations", "S4.SS2"): "S5.SS2",
    ("equivariant-degenerations", "S5.SS1"): "S6.SS1",
    ("equivariant-degenerations", "S5.SS2"): "S6.SS2",
    ("equivariant-degenerations", "S5.SS3"): "S6.SS3",
    ("equivariant-degenerations", "S5.SS4"): "S6.SS4",
    ("equivariant-degenerations", "S5.SS5"): "S6.SS5",
    ("equivariant-degenerations", "S5.SS6"): "S6.SS6",
    ("equivariant-degenerations", "S5.SS7"): "S6.SS7",
    ("equivariant-degenerations", "S7.SS1"): "S8.SS1",
    ("equivariant-degenerations", "S7.SS2"): "S8.SS2",
    ("equivariant-degenerations", "S7.SS3"): "S8.SS3",
    ("equivariant-degenerations", "S7.SS4"): "S8.SS4",
    ("equivariant-degenerations", "S9.SS1"): "S10.SS1",
    ("equivariant-degenerations", "S9.SS2"): "S10.SS2",
    ("equivariant-degenerations", "S9.SS3"): "S10.SS3",
    ("equivariant-degenerations", "S9.SS4"): "S10.SS4",
    ("equivariant-degenerations", "S9.SS5"): "S10.SS5",
}

# These historical pages came entirely from LaTeX comment environments.  They
# must remain reserved tombstones rather than being rebound to whichever live
# heading later occupies the same source ordinal.
HISTORICAL_SECTION_TOMBSTONES = {
    ("equivariant-degenerations", "S3"): {
        "kind": "section",
        "title": "Summary of results",
    },
    ("equivariant-degenerations", "S3.SS1"): {
        "kind": "subsection",
        "title": "Orbits of quartic plane curves from degeneration",
    },
    ("equivariant-degenerations", "S3.SS2"): {
        "kind": "subsection",
        "title": "Simplifying notation in the case $r=2$.",
    },
    ("orbits-equivariant-quantum", "S4.SS7"): {
        "kind": "subsection",
        "title": "How does this story generalize?",
    },
    ("orbits-equivariant-quantum", "S10.SS5"): {
        "kind": "subsection",
        "title": (
            "Polytope proof of $[M]_\\hbar \\star [N]_\\hbar "
            "= [M \\oplus N]_\\hbar$"
        ),
    },
}

# A label placed on an unnumbered proof or starred display inherits TeX's
# previous ``\@currentlabel``; it does not name a new proof/equation counter.
# These are the only referenced instances in this corpus.  Their values and
# cleveref types were checked against fresh LaTeX .aux files.  Keeping these
# exceptional source constructs explicit is safer than pretending to emulate
# TeX's complete global current-label state.
REFERENCE_DISPLAY_OVERRIDES = {
    ("special-codimension-one", "proofslope45"): {
        "number": "4.5.7",
        "envType": "Section",
    },
    ("equivariant-degenerations", "proof:CANCBN"): {
        "number": "5.5",
        "envType": "Subsection",
    },
    # This label sits in an equation* and therefore inherits the preceding
    # unnumbered Setup heading rather than an equation counter.
    ("rank-two-p-curvature", "connectionmatrix"): {
        "number": "3.1",
        "envType": "Section",
    },
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
    "llbracket": "\\mathopen{[\\![}",
    "rrbracket": "\\mathclose{]\\!]}",
    "sslash": "\\mathbin{/\\!/}",
    "dasharrow": "\\dashrightarrow",
    "hdots": "\\cdots",
}


def read_latex_source(path):
    """Read a source file, accepting the legacy Windows-1252 papers."""
    with open(path, "rb") as source_file:
        data = source_file.read()
    try:
        return data.decode("utf-8")
    except UnicodeDecodeError:
        return data.decode("cp1252")


def load_registry():
    if os.path.exists(TAG_REGISTRY_PATH):
        with open(TAG_REGISTRY_PATH) as f:
            return json.load(f)
    return {}


def save_registry(reg):
    os.makedirs(os.path.dirname(TAG_REGISTRY_PATH), exist_ok=True)
    with open(TAG_REGISTRY_PATH, "w") as f:
        json.dump(reg, f, indent=2)


def load_section_registry():
    if os.path.exists(SECTION_REGISTRY_PATH):
        with open(SECTION_REGISTRY_PATH) as f:
            return json.load(f)
    return {}


def save_section_registry(registry):
    os.makedirs(os.path.dirname(SECTION_REGISTRY_PATH), exist_ok=True)
    with open(SECTION_REGISTRY_PATH, "w") as f:
        json.dump(registry, f, indent=2, sort_keys=True)
        f.write("\n")


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


def replace_latex_optional_arg_commands(text, command, callback):
    """Replace \\command[optional]{...} commands with balanced braces."""
    pieces = []
    output_pos = 0
    search_pos = 0
    needle = "\\" + command
    while True:
        start = text.find(needle, search_pos)
        if start == -1:
            break
        i = start + len(needle)
        if i < len(text) and (text[i].isalpha() or text[i] == "*"):
            search_pos = i
            continue

        while i < len(text) and text[i].isspace():
            i += 1

        optional = None
        if i < len(text) and text[i] == "[":
            opt_start = i + 1
            i += 1
            depth = 1
            while i < len(text) and depth:
                if text[i] == "[":
                    depth += 1
                elif text[i] == "]":
                    depth -= 1
                i += 1
            if depth:
                search_pos = start + len(needle)
                continue
            optional = text[opt_start:i - 1]

        while i < len(text) and text[i].isspace():
            i += 1
        if i >= len(text) or text[i] != "{":
            search_pos = start + len(needle)
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
        if depth:
            search_pos = start + len(needle)
            continue

        pieces.append(text[output_pos:start])
        pieces.append(callback(optional, text[arg_start:i - 1]))
        output_pos = i
        search_pos = i

    pieces.append(text[output_pos:])
    return "".join(pieces)


def remove_latex_commands(text, command):
    """Remove full \\command{...} commands with balanced braces."""
    return replace_latex_commands(text, command, lambda _argument: "")


def replace_latex_two_arg_commands(text, command, callback, allow_optional=False):
    """Replace full \\command{...}{...} commands with balanced braces."""
    pieces = []
    output_pos = 0
    search_pos = 0
    needle = "\\" + command
    while True:
        start = text.find(needle, search_pos)
        if start == -1:
            break
        i = start + len(needle)
        if i < len(text) and (text[i].isalpha() or text[i] == "*"):
            search_pos = i
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
            search_pos = start + len(needle)
            continue
        pieces.append(text[output_pos:start])
        pieces.append(callback(args[0], args[1]))
        output_pos = i
        search_pos = i
    pieces.append(text[output_pos:])
    return "".join(pieces)


def parse_latex_macro_definitions(text):
    """Yield simple \\newcommand-style macro definitions from LaTeX source."""
    command_re = re.compile(r'\\(?:new|renew|provide)command\*?(?=\s|\\|\{)')
    pos = 0
    while True:
        match = command_re.search(text, pos)
        if not match:
            break
        i = match.end()
        while i < len(text) and text[i].isspace():
            i += 1

        if i < len(text) and text[i] == "{":
            name_start = i + 1
            i += 1
            depth = 1
            while i < len(text) and depth:
                if text[i] == "{":
                    depth += 1
                elif text[i] == "}":
                    depth -= 1
                i += 1
            if depth != 0:
                pos = match.end()
                continue
            raw_name = text[name_start:i - 1].strip()
        elif i < len(text) and text[i] == "\\":
            name_start = i
            i += 1
            while i < len(text) and (text[i].isalpha() or text[i] == "@"):
                i += 1
            raw_name = text[name_start:i]
        else:
            pos = match.end()
            continue

        name_m = re.match(r'\\([A-Za-z@]+)$', raw_name)
        if not name_m:
            pos = match.end()
            continue
        name = name_m.group(1)

        while i < len(text) and text[i].isspace():
            i += 1
        nargs = None
        if i < len(text) and text[i] == "[":
            opt_start = i + 1
            i += 1
            depth = 1
            while i < len(text) and depth:
                if text[i] == "[":
                    depth += 1
                elif text[i] == "]":
                    depth -= 1
                i += 1
            if depth != 0:
                pos = match.end()
                continue
            opt = text[opt_start:i - 1].strip()
            if opt.isdigit():
                nargs = int(opt)

        while i < len(text) and text[i].isspace():
            i += 1
        if i >= len(text) or text[i] != "{":
            pos = match.end()
            continue
        def_start = i + 1
        i += 1
        depth = 1
        while i < len(text) and depth:
            if text[i] == "{":
                depth += 1
            elif text[i] == "}":
                depth -= 1
            i += 1
        if depth != 0:
            pos = match.end()
            continue

        yield {
            "start": match.start(),
            "end": i,
            "name": name,
            "nargs": nargs,
            "definition": text[def_start:i - 1],
        }
        pos = i


def parse_two_optional_macro_definitions(text):
    """Parse newcommandtwoopt definitions from the source preamble."""
    definitions = {}
    pattern = re.compile(
        r'\\newcommandtwoopt\s*\{\\([A-Za-z@]+)\}\s*'
        r'\[(\d+)\]\s*\[([^\]]*)\]\s*\[([^\]]*)\]\s*\{'
    )
    for match in pattern.finditer(text):
        i = match.end()
        body_start = i
        depth = 1
        while i < len(text) and depth:
            if text[i] == "{":
                depth += 1
            elif text[i] == "}":
                depth -= 1
            i += 1
        if depth or int(match.group(2)) != 3:
            continue
        definitions[match.group(1)] = {
            "defaults": (match.group(3), match.group(4)),
            "definition": text[body_start:i - 1].strip(),
        }
    return definitions


def expand_two_optional_macros(text):
    """Expand macros with two optional arguments for MathJax compatibility."""
    definitions = TEX_RENDER_CONTEXT.get("twoopt_macros", {})
    if not definitions:
        return text

    names = "|".join(
        sorted((re.escape(name) for name in definitions), key=len, reverse=True)
    )
    command_re = re.compile(r'\\(' + names + r')(?![A-Za-z@])')
    out = []
    pos = 0
    while True:
        match = command_re.search(text, pos)
        if not match:
            out.append(text[pos:])
            break
        out.append(text[pos:match.start()])
        i = match.end()
        defaults = definitions[match.group(1)]["defaults"]
        optional = []
        while len(optional) < 2:
            while i < len(text) and text[i].isspace():
                i += 1
            if i >= len(text) or text[i] != "[":
                break
            start = i + 1
            i += 1
            depth = 1
            while i < len(text) and depth:
                if text[i] == "[":
                    depth += 1
                elif text[i] == "]":
                    depth -= 1
                i += 1
            if depth:
                break
            optional.append(text[start:i - 1])

        while i < len(text) and text[i].isspace():
            i += 1
        if i >= len(text) or text[i] != "{":
            out.append(match.group(0))
            pos = match.end()
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
        if depth:
            out.append(text[match.start():])
            break

        args = [
            optional[0] if len(optional) > 0 else defaults[0],
            optional[1] if len(optional) > 1 else defaults[1],
            text[arg_start:i - 1],
        ]
        replacement = definitions[match.group(1)]["definition"]
        for index, argument in enumerate(args, start=1):
            replacement = replacement.replace(f"#{index}", argument)
        out.append(replacement)
        pos = i
    return "".join(out)


def remove_latex_macro_definitions(text):
    """Remove visible macro definitions from body text."""
    pieces = []
    pos = 0
    for macro in parse_latex_macro_definitions(text):
        pieces.append(text[pos:macro["start"]])
        pos = macro["end"]
    pieces.append(text[pos:])
    text = "".join(pieces)
    text = re.sub(
        r'\\DeclareMathOperator\*?\s*\{?\\\w+\}?\s*\{(?:[^{}]|\{[^{}]*\})*\}',
        '',
        text,
    )
    return text


def split_latex_heading_blocks(text, command):
    """Split text into [(title, content)] blocks for balanced LaTeX headings."""
    matches = list(iter_latex_heading_spans(text, command))
    blocks = []
    for idx, (start, end, title) in enumerate(matches):
        next_start = matches[idx + 1][0] if idx + 1 < len(matches) else len(text)
        blocks.append((clean_heading_title(title), text[end:next_start]))
    return text[:matches[0][0]] if matches else text, blocks


def split_latex_heading_blocks_with_star(text, command):
    """Split headings while retaining whether each command was starred."""
    matches = list(iter_latex_heading_records(text, command))
    blocks = []
    for idx, (start, end, title, starred) in enumerate(matches):
        next_start = matches[idx + 1][0] if idx + 1 < len(matches) else len(text)
        blocks.append((clean_heading_title(title), text[end:next_start], starred))
    return text[:matches[0][0]] if matches else text, blocks


def clean_heading_title(title):
    """Remove invisible LaTeX spacing commands from section-like headings."""
    title = re.sub(r'\\(?:unskip|ignorespaces)\b', '', title)
    return title.strip()


def iter_latex_heading_spans(text, command):
    """Yield (start, end, title) for \\section-like headings."""
    for start, end, title, _starred in iter_latex_heading_records(text, command):
        yield start, end, title


def iter_latex_heading_records(text, command):
    """Yield heading spans together with the LaTeX starred flag."""
    heading_re = re.compile(
        r'\\' + re.escape(command) + r'(?P<star>\*)?\s*\{')
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
            yield m.start(), i, text[arg_start:i - 1], bool(m.group('star'))
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
    """Extract LaTeX macro definitions from the source for MathJax."""
    macros = {}
    non_math_macros = {
        # Presentation macros used by the PDF source, not MathJax macros.
        "Aletheia", "human", "ai",
    }

    # \newcommand{\foo}{definition} or \newcommand{\foo}[n]{definition}
    # \renewcommand{\foo}{definition} or \renewcommand{\foo}[n]{definition}
    for macro in parse_latex_macro_definitions(tex_source):
        name = macro["name"]
        nargs = macro["nargs"]
        definition = normalize_geometric_alphabets(macro["definition"])
        # A command body containing #1, #2, ... is only meaningful when the
        # command declares arguments.  In particular, do not mistake a
        # \renewcommand nested inside a \newenvironment definition for a
        # top-level MathJax macro (as happens for custom theorem counters).
        if nargs is None and re.search(r'(?<!\\)#\d', definition):
            continue
        # Skip non-math macros
        if name in ('labelitemi',) or name in non_math_macros:
            continue
        if any(token in definition for token in (
            "\n", "\\begin", "\\end", "\\noindent", "\\vspace", "\\hspace",
            "\\errmessage", "\\renewcommand", "tcolorbox", "minipage",
            "flushleft", "flushright",
        )):
            continue
        if name == "o" and definition == "\\overline":
            macros[name] = ["\\overline{#1}", 1]
            continue
        if nargs:
            macros[name] = [definition, nargs]
        else:
            macros[name] = definition

    # \DeclareMathOperator{\foo}{text} — handles nested braces
    for match in re.finditer(
        r'\\DeclareMathOperator\s*\{?\\(\w+)\}?\s*\{((?:[^{}]|\{[^{}]*\})*)\}',
        tex_source
    ):
        name = match.group(1)
        text = normalize_geometric_alphabets(match.group(2).strip())
        macros[name] = "\\operatorname{" + text + "}"

    for name, definition in GEOMETRIC_ALPHABET_MACROS.items():
        macros.setdefault(name, definition)
    return macros


def parse_bibliography(meta, tex_dir, tex_source, render_html=True):
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
    citations, entries = parse_bibitems(bib_text, render_html=render_html)

    # Several legacy arXiv bundles were imported without their generated .bbl
    # files.  Their committed bibliography pages are nevertheless complete
    # and retain the original BibTeX keys in ``id="bib-..."``.  Treat that
    # structured page as a lossless fallback input instead of deleting it and
    # degrading every citation to a raw key on the next rebuild.
    if not entries:
        generated_path = os.path.join(tex_dir, "bibliography.html")
        if os.path.isfile(generated_path):
            with open(generated_path, encoding="utf-8") as f:
                generated_html = f.read()
            citations, entries = parse_generated_bibliography(generated_html)

    # source.json can provide lightweight labels for papers whose sources do
    # not include a bibliography file.
    if "citations" in meta:
        citations.update(meta["citations"])

    return {"citations": citations, "entries": entries}


def parse_generated_bibliography(generated_html):
    """Recover entries from a previously generated bibliography page."""
    citations = {}
    entries = []
    pattern = re.compile(
        r'<li\s+id="bib-([^"]+)">\s*'
        r'<span\s+class="stacks-bib-label">\[([^<]*)\]</span>\s*'
        r'(.*?)</li>',
        re.DOTALL | re.IGNORECASE,
    )
    for match in pattern.finditer(generated_html):
        key = html_mod.unescape(match.group(1))
        label = html_mod.unescape(match.group(2)).strip()
        entry_html = match.group(3).strip()
        entry_html = re.sub(r'\\MR(?:(?:MR)|(?:Mr))?(?=\d)', 'MR ', entry_html)
        entry_html = re.sub(
            r'\\itshape\s*(.*)$', r'<em>\1</em>', entry_html,
            flags=re.DOTALL,
        )
        entry_html = re.sub(r'\\bysame\b\s*,?', '&mdash;,', entry_html)
        entry_html = re.sub(r'\\penalty\d+\s*', '', entry_html)
        entry_html = entry_html.replace(r'\&', '&amp;')
        entry_html = replace_latex_accents(entry_html)
        citations[key] = label
        entries.append({
            "key": key,
            "label": label,
            "raw": html_to_plain_text(entry_html),
            "html": entry_html,
        })
    return citations, entries


def safe_latex_href_target(value):
    """Escape a LaTeX URL for an HTML href without turning ``~`` into space."""
    value = re.sub(r'\\textasciitilde(?:\{\})?\s*', '~', value.strip())
    return html_mod.escape(value.replace('~', '%7E'), quote=True)


def visible_latex_url(value):
    """Escape visible URL text while preserving a literal tilde."""
    value = re.sub(r'\\textasciitilde(?:\{\})?\s*', '~', value.strip())
    return html_mod.escape(value).replace('~', '&#126;')


def cleanup_bibliography_environment(bib_text):
    """Remove wrapper commands from .bbl/thebibliography text."""
    if not bib_text:
        return ""
    bib_text = re.sub(r'\\newcommand\{\\etalchar\}\[1\]\{\$\^\{#1\}\$\}\s*', '', bib_text)
    bib_text = re.sub(r'\\begin\{thebibliography\}\{[^\n]*\}\s*', '', bib_text)
    bib_text = re.sub(r'\\end\{thebibliography\}\s*', '', bib_text)
    return bib_text.strip()


def parse_bibitems(bib_text, render_html=True):
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
            "raw": body,
            "html": bibliography_entry_to_html(body) if render_html else bibliography_entry_to_light_html(body),
        })
    return citations, entries


def bibliography_entry_to_light_html(entry):
    """Cheap bibliography cleanup for the global pre-scan."""
    entry = entry.replace('\n', ' ')
    entry = re.sub(r'\s+', ' ', entry).strip()
    entry = cleanup_bibliography_environment(entry)
    entry = re.sub(r'\\MR(?:(?:MR)|(?:Mr))?(?=\d)', 'MR ', entry)
    entry = entry.replace(r'\&', '&amp;')
    entry = re.sub(r'\\itshape\s*(.*)$', r'\\emph{\1}', entry)
    entry = re.sub(r'\\bysame\b\s*,?', '&mdash;,', entry)
    entry = re.sub(r'\\penalty\d+\s*', '', entry)
    entry = replace_latex_accents(entry)
    entry = re.sub(
        r'\\leavevmode\\vrule\s+height\s+[-.\d]+pt\s+depth\s+[-.\d]+pt\s+width\s+[-.\d]+pt',
        '&mdash;',
        entry,
    )
    entry = re.sub(
        r'\\url\{([^}]*)\}',
        lambda match: (
            f'<a href="{safe_latex_href_target(match.group(1))}">'
            f'{visible_latex_url(match.group(1))}</a>'
        ),
        entry,
    )
    entry = re.sub(
        r'\\href\{([^}]*)\}\{([^}]*)\}',
        lambda match: (
            f'<a href="{safe_latex_href_target(match.group(1))}">'
            f'{match.group(2)}</a>'
        ),
        entry,
    )
    entry = re.sub(r'\\textasciitilde(?:\{\})?\s*', '&#126;', entry)
    entry = replace_latex_text_command(entry, "emph", "em")
    entry = replace_latex_text_command(entry, "textit", "em")
    entry = replace_latex_text_command(entry, "textsl", "em")
    entry = replace_latex_text_command(entry, "textbf", "strong")
    entry = replace_latex_text_command(entry, "texttt", "code")
    entry = replace_latex_declaration_group(entry, "sl", "em")
    entry = replace_latex_declaration_group(entry, "it", "em")
    entry = replace_latex_declaration_group(entry, "em", "em")
    entry = replace_latex_declaration_group(entry, "textbf", "strong")
    entry = replace_latex_declaration_group(entry, "bf", "strong")
    entry = replace_latex_declaration_group(entry, "tt", "code")
    entry = replace_latex_declaration_group(entry, "sc", "span", ' class="stacks-small-caps"')
    entry = entry.replace('~', '&nbsp;')
    entry = entry.replace('---', '&mdash;').replace('--', '&ndash;')
    entry = entry.replace('\\newblock', '')
    entry = strip_text_braces_outside_math(entry)
    return entry


def bibliography_entry_to_html(entry):
    """Lightweight LaTeX-to-HTML cleanup for bibliography entries."""
    entry = entry.replace('\n', ' ')
    entry = re.sub(r'\s+', ' ', entry).strip()
    entry = cleanup_bibliography_environment(entry)
    entry = re.sub(r'\\MR(?:(?:MR)|(?:Mr))?(?=\d)', 'MR ', entry)
    entry = entry.replace(r'\&', '&amp;')
    entry = re.sub(r'\\itshape\s*(.*)$', r'\\emph{\1}', entry)
    entry = re.sub(r'\\bysame\b\s*,?', '&mdash;,', entry)
    entry = re.sub(r'\\penalty\d+\s*', '', entry)
    # Plain BibTeX styles use a short rule for "same author as above".  In
    # HTML an em dash carries the same meaning without leaking raw TeX.
    entry = re.sub(
        r'\\leavevmode\\vrule\s+height\s+[-.\d]+pt\s+depth\s+[-.\d]+pt\s+width\s+[-.\d]+pt',
        '&mdash;',
        entry,
    )
    entry = re.sub(
        r'\\url\{([^}]*)\}',
        lambda match: (
            f'<a href="{safe_latex_href_target(match.group(1))}">'
            f'{visible_latex_url(match.group(1))}</a>'
        ),
        entry,
    )
    entry = re.sub(
        r'\\href\{([^}]*)\}\{([^}]*)\}',
        lambda match: (
            f'<a href="{safe_latex_href_target(match.group(1))}">'
            f'{match.group(2)}</a>'
        ),
        entry,
    )
    html = tex_to_html(entry)
    # BibTeX uses braces to preserve capitalization. Once formatting commands
    # are handled, those braces should not be visible in bibliography prose.
    html = strip_text_braces_outside_math(html)
    return html


def html_to_plain_text(text):
    """Collapse HTML-ish text to a normalized plain string."""
    text = re.sub(r'<[^>]+>', ' ', text)
    text = html_mod.unescape(text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def bibliography_title_key(entry):
    """Return a conservative identity for a complete bibliography entry.

    Bibliography styles do not share a reliable sentence structure: initials,
    journal abbreviations, and old MathSciNet fields all contain periods.  A
    previous attempt to infer the title from the second sentence therefore
    merged unrelated works under keys such as ``Math`` and ``Amer``.  Exact
    normalized full-entry text may retain harmless duplicates when two styles
    format one work differently, but it never conflates distinguishable works.
    """
    text = html_to_plain_text(entry.get("html", ""))
    text = re.sub(r'\s+', ' ', text).strip().casefold()
    if text:
        return "entry:" + text

    raw = replace_latex_accents(entry.get("raw", ""))
    raw = re.sub(r'\s+', ' ', raw).strip().casefold()
    return "raw:" + raw


def bibliography_global_id(key):
    """Create a deterministic, readable HTML id for a global bibliography key."""
    digest = hashlib.sha1(key.encode("utf-8")).hexdigest()[:8]
    words = re.findall(r'[a-z0-9]+', key.replace("title:", "").replace("entry:", ""))[:6]
    stem = "-".join(words)[:56].strip("-") or "entry"
    return f"{stem}-{digest}"


def collect_global_bibliography(tex_paths):
    """Collect and deduplicate bibliography entries across all papers."""
    entries_by_key = {}
    citation_targets = {}

    for tex_path in tex_paths:
        out_dir = os.path.dirname(tex_path)
        slug = os.path.basename(out_dir)
        meta_path = tex_path.replace('.tex', '.json')
        meta = {}
        if os.path.exists(meta_path):
            with open(meta_path) as f:
                meta = json.load(f)
        tex_source = read_latex_source(tex_path)

        bibliography = parse_bibliography(meta, out_dir, tex_source, render_html=False)
        for entry in bibliography["entries"]:
            dedupe_key = bibliography_title_key(entry)
            if not dedupe_key:
                dedupe_key = "entry:" + entry.get("key", "")
            if dedupe_key not in entries_by_key:
                global_id = bibliography_global_id(dedupe_key)
                entries_by_key[dedupe_key] = {
                    "id": global_id,
                    "label": entry["label"],
                    "html": entry["html"],
                    "title_key": dedupe_key,
                    "papers": [],
                    "aliases": [],
                }
            canonical = entries_by_key[dedupe_key]
            canonical["papers"].append(slug)
            alias = {
                "paper": slug,
                "key": entry["key"],
                "label": entry["label"],
            }
            canonical["aliases"].append(alias)
            citation_targets[(slug, entry["key"])] = canonical["id"]

    entries = sorted(
        entries_by_key.values(),
        key=lambda item: html_to_plain_text(item["html"]).lower(),
    )
    print(f"Built global bibliography: {len(entries)} unique entries")
    return {"entries": entries, "citation_targets": citation_targets}


def bibliography_entry_to_global_html(entry_html):
    """Normalize global bibliography typography across mixed BibTeX styles."""
    entry_html = re.sub(
        r'<span class="stacks-small-caps">(.*?)</span>',
        r'\1',
        entry_html,
        flags=re.DOTALL,
    )
    entry_html = re.sub(r'</?(?:em|strong|code)\b[^>]*>', '', entry_html)
    entry_html = re.sub(r'\\(?:itshape|bfseries|scshape)\s*', '', entry_html)
    return entry_html


def write_global_bibliography(global_bibliography):
    """Write the site-wide bibliography page."""
    entries = global_bibliography.get("entries", [])
    html = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Cache-Control" content="no-store, max-age=0">
  <meta http-equiv="Pragma" content="no-cache">
  <meta http-equiv="Expires" content="0">
  <title>Bibliography — Anand Patel</title>
  <link rel="stylesheet" href="style.css?v=stacks-20260517">
  <link rel="stylesheet" href="papers/hodge-bundle/stacks.css?v=stacks-20260519-qed">
  <style>
    .stacks-bibliography {
      padding-left: 3.75em;
    }
    .stacks-bibliography li {
      padding-left: 0.25em;
    }
  </style>
  <script>
    window.MathJax = {
      loader: { load: ['[tex]/bboldx'] },
      tex: {
        inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
        displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
        packages: { '[+]': ['bboldx'] }
      },
      svg: { fontCache: 'global' }
    };
  </script>
  <script src="https://cdn.jsdelivr.net/npm/mathjax@4/tex-svg.js" async></script>
</head>
<body>
<header class="stacks-header">
  <div class="stacks-header-inner">
    <a href="index.html" class="stacks-home-link">Anand Patel</a>
    <span class="stacks-separator">&rsaquo;</span>
    <span class="stacks-paper-link">Bibliography</span>
  </div>
</header>
<main class="stacks-main">
<h1 class="stacks-section-title">Bibliography</h1>
<ol class="stacks-bibliography">
"""
    for entry in entries:
        entry_html = bibliography_entry_to_global_html(entry["html"])
        html += f'  <li id="bib-{html_attr(entry["id"])}">{entry_html}</li>\n'
    html += """</ol>
</main>
<footer class="stacks-footer">
  &copy; 2025 Anand Patel
</footer>
</body>
</html>
"""
    write_html(os.path.join(SITE_ROOT, "bibliography.html"), html)


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
    label = label.replace('~', ' ')
    natbib_match = re.match(r'(.+?\(\d{4}[a-z]?\)).+', label)
    if natbib_match:
        label = natbib_match.group(1)
    label = re.sub(r'(?<!\s)\((\d{4}[a-z]?)\)', r' (\1)', label)
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
    text = text.replace(r'\\', ' ')
    text = text.replace(r'\&', '&')
    text = text.replace(r'\and', ', ')
    text = re.sub(r'\s+', ' ', text).strip()
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
    body = re.sub(
        r'\\begin\{restatable\}\{theorem\}\{[^{}]*\}',
        r'\\begin{theorem}',
        body,
    )
    body = body.replace(r'\end{restatable}', r'\end{theorem}')
    return body


def expand_restatable_invocations(body):
    r"""Expand thm-restate invocations without changing theorem counters.

    ``\begin{restatable}{theorem}{main} ...`` defines ``\main*`` as an
    unnumbered restatement carrying the original theorem number.  MathJax does
    not implement that document-level mechanism, so reproduce its visible
    result as a bold restatement heading followed by the original body.
    """
    pattern = re.compile(
        r'\\begin\{restatable\}\{([^{}]+)\}\{([A-Za-z@]+)\}'
        r'(.*?)\\end\{restatable\}',
        re.DOTALL,
    )
    definitions = []
    for match in pattern.finditer(body):
        env_name, command_name, env_body = match.groups()
        label_match = re.search(r'\\label\{([^}]+)\}', env_body)
        if not label_match:
            continue
        label = label_match.group(1)
        restated_body = (
            env_body[:label_match.start()] + env_body[label_match.end():]
        ).strip()
        title = ENV_TYPES.get(env_name, env_name.replace('-', ' ').title())
        heading = (
            rf'\textbf{{{title}~\ref{{{label}}} (restated).}}'
            + "\n"
        )
        definitions.append((command_name, heading + restated_body))

    for command_name, replacement in definitions:
        body = re.sub(
            r'\\' + re.escape(command_name) + r'\*(?![A-Za-z@])',
            lambda _match, value=replacement: value,
            body,
        )
    return body


def strip_latex_comment_environments(text):
    """Remove verbatim-style ``comment`` environments before parsing.

    The LaTeX ``comment`` package discards these blocks completely.  Leaving
    them in the HTML source exposes draft material and sends the literal
    environment to MathJax, which reports an unknown-environment error.
    """
    begin_token = r'\begin{comment}'
    end_token = r'\end{comment}'
    pieces = []
    pos = 0
    while True:
        start = text.find(begin_token, pos)
        if start == -1:
            pieces.append(text[pos:])
            break
        pieces.append(text[pos:start])
        end = text.find(end_token, start + len(begin_token))
        if end == -1:
            # The verbatim package's comment environment is not nestable: it
            # scans literally to the next \end{comment}.  An unmatched opener
            # therefore consumes the remaining input for website purposes.
            break
        pos = end + len(end_token)
    return ''.join(pieces)


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
    "exmp": "Example",
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
    "def": "Definition",
    "prin": "Principle",
    "clm": "Claim",
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
    "exmp": "stacks-env",
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
    "def": "stacks-definition",
    "prin": "stacks-env",
    "clm": "stacks-env",
    "Exer": "stacks-env",
    "ToDo": "stacks-env",
    "proof": "stacks-proof",
}


def parse_theorem_config(tex_source):
    """Read theorem names and counter relationships from the LaTeX preamble.

    The old website renderer put every theorem-like environment into one
    section counter.  That happens to fit many papers, but it misnumbers
    unnumbered environments, independent counters, and theorem families
    numbered within a subsection.  This small model covers the standard
    ``amsthm`` and ``thmtools`` declarations used by the paper sources.
    """
    preamble = tex_source.split(r'\begin{document}', 1)[0]
    preamble = re.sub(r'(?m)(?<!\\)%.*$', '', preamble)
    config = {}

    newtheorem_re = re.compile(
        r'\\newtheorem(?P<star>\*)?\s*\{(?P<env>[^}]+)\}\s*'
        r'(?:\[(?P<sibling>[^\]]+)\])?\s*'
        r'\{(?P<title>[^{}]*)\}\s*'
        r'(?:\[(?P<parent>[^\]]+)\])?'
    )
    declaretheorem_re = re.compile(
        r'\\declaretheorem\s*(?:\[([^\]]*)\])?\s*\{([^}]+)\}'
    )
    numberwithin_re = re.compile(
        r'\\numberwithin\s*\{([^}]+)\}\s*\{([^}]+)\}'
    )
    alph_format_re = re.compile(
        r'\\renewcommand\s*\{?\\the([^{}\s]+)\}?\s*'
        r'\{\s*\\Alph\s*\{\1\}\s*\}'
    )
    blank_format_re = re.compile(
        r'\\renewcommand\s*\{?\\the([^{}\s]+)\}?\s*\{\s*\}'
    )

    # Declaration order matters.  If ``rmk`` shares ``thm`` and is declared
    # before ``\numberwithin{thm}{section}``, LaTeX resets the shared counter
    # by section but keeps ``\thermk`` in its original, unprefixed form.  A
    # single ``within`` field cannot represent those two facts.  Replay the
    # relevant preamble commands and keep counter scope separate from display.
    events = []
    events.extend((m.start(), "newtheorem", m) for m in newtheorem_re.finditer(preamble))
    events.extend((m.start(), "declaretheorem", m) for m in declaretheorem_re.finditer(preamble))
    events.extend((m.start(), "numberwithin", m) for m in numberwithin_re.finditer(preamble))
    events.extend((m.start(), "format-alph", m) for m in alph_format_re.finditer(preamble))
    events.extend((m.start(), "format-blank", m) for m in blank_format_re.finditer(preamble))

    def root_counter(env):
        seen = set()
        current = env
        while current in config and current not in seen:
            seen.add(current)
            target = config[current].get("counter", current)
            if target == current:
                break
            current = target
        return current

    def declare(env, title, numbered=True, sibling=None, parent=None):
        # Later guarded declarations in several arXiv sources are fallbacks;
        # TeX keeps the first successful definition.
        if env in config:
            return
        if sibling:
            sibling_config = config.get(sibling, {})
            counter = sibling_config.get("counter", sibling)
            display_within = sibling_config.get("display_within")
            number_format = sibling_config.get("format", "arabic")
            counter_within = None
        else:
            counter = env
            display_within = parent
            number_format = "arabic"
            counter_within = parent
        config[env] = {
            "title": title or ENV_TYPES.get(env, env.replace('-', ' ').title()),
            "numbered": numbered,
            "counter": counter,
            "counter_within": counter_within,
            "display_within": display_within,
            # Retain ``within`` for callers outside the numbering pass.
            "within": display_within,
            "format": number_format,
        }

    for _position, kind, match in sorted(events, key=lambda event: event[0]):
        if kind == "newtheorem":
            env = match.group('env').strip()
            declare(
                env,
                match.group('title').strip(),
                numbered=not bool(match.group('star')),
                sibling=(match.group('sibling') or '').strip() or None,
                parent=(match.group('parent') or '').strip() or None,
            )
        elif kind == "declaretheorem":
            env = match.group(2).strip()
            options = {}
            flags = set()
            for raw_option in (match.group(1) or '').split(','):
                option = raw_option.strip()
                if not option:
                    continue
                if '=' in option:
                    key, value = option.split('=', 1)
                    options[key.strip()] = value.strip()
                else:
                    flags.add(option)
            declare(
                env,
                options.get('title', ENV_TYPES.get(env, env.replace('-', ' ').title())),
                numbered='unnumbered' not in flags,
                sibling=options.get('sibling'),
                parent=options.get('parent'),
            )
        elif kind == "numberwithin":
            counter = match.group(1).strip()
            parent = match.group(2).strip()
            if counter in config:
                root = root_counter(counter)
                if root in config:
                    config[root]["counter_within"] = parent
                config[counter]["display_within"] = parent
                config[counter]["within"] = parent
        else:
            env = match.group(1).strip()
            if env in config:
                config[env]["format"] = (
                    "Alph" if kind == "format-alph" else "blank")

    # rank-two-p-curvature uses a one-argument wrapper to restate an earlier
    # theorem with exactly the referenced number.
    for match in re.finditer(
        r'\\newenvironment\s*\{([^}]+)\}\s*\[1\]\s*'
        r'\{(?:(?!\\newenvironment).)*?\\renewcommand\s*\{?\\the[^{}\s]+\}?\s*\{#1\}',
        preamble,
        flags=re.DOTALL,
    ):
        env = match.group(1).strip()
        current = config.get(env, {
            "title": ENV_TYPES.get(env, env.replace('-', ' ').title()),
            "numbered": True,
            "counter": env,
            "counter_within": None,
            "display_within": None,
            "within": None,
            "format": "arabic",
        })
        current["explicit_arg_number"] = True
        config[env] = current

    return config


def initial_latex_counter(tex_source, counter_name, default=0):
    r"""Return the last pre-document ``\setcounter`` value for a counter."""
    preamble = tex_source.split(r'\begin{document}', 1)[0]
    values = re.findall(
        r'\\setcounter\s*\{' + re.escape(counter_name)
        + r'\}\s*\{\s*(-?\d+)\s*\}',
        preamble,
    )
    return int(values[-1]) if values else default


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

    # Strip LaTeX comments (lines starting with %)
    body = re.sub(r'(?m)^\s*%.*$', '', body)
    # Strip inline comments (% not preceded by \)
    body = re.sub(r'(?<!\\)%.*$', '', body, flags=re.MULTILINE)

    # Environment tokens on percent-commented lines are inert in TeX and
    # must not open or close a verbatim-style comment block here.
    body = strip_latex_comment_environments(body)
    body = expand_restatable_invocations(body)
    body = normalize_source_aliases(body)

    # Remove balanced body-level macro definitions while the complete body is
    # still available.  Waiting until tex_to_html() sees individual paragraphs
    # can split a multiline definition and expose its LaTeX source as prose.
    body = remove_latex_macro_definitions(body)

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

    initial_section_counter = initial_latex_counter(
        tex_source, "section", default=0)
    equation_labels = parse_equation_labels(
        body, tex_source, initial_section_counter)
    auxiliary_labels = parse_auxiliary_labels(body)
    custom_labels = parse_custom_labels(body)
    theorem_config = parse_theorem_config(tex_source)
    sections, section_labels = parse_sections(
        body, theorem_config, initial_section_counter)

    return {
        "title": title,
        "author": author,
        "sections": sections,
        "section_labels": section_labels,
        "equation_labels": equation_labels,
        "auxiliary_labels": auxiliary_labels,
        "custom_labels": custom_labels,
        "theorem_config": theorem_config,
    }


def split_top_level_math_rows(text):
    r"""Split an AMS multiline display at top-level ``\\`` row breaks.

    Row breaks inside braces or nested environments such as ``aligned``,
    ``split``, and matrices belong to the outer row and must not advance the
    equation counter.
    """
    rows = []
    row_start = 0
    brace_depth = 0
    environment_depth = 0
    i = 0
    while i < len(text):
        if text.startswith(r'\begin{', i) or text.startswith(r'\end{', i):
            is_begin = text.startswith(r'\begin{', i)
            close = text.find('}', i + (7 if is_begin else 5))
            if close != -1:
                environment_depth += 1 if is_begin else -1
                environment_depth = max(environment_depth, 0)
                i = close + 1
                continue
        char = text[i]
        if char == "{" and (i == 0 or text[i - 1] != "\\"):
            brace_depth += 1
        elif char == "}" and (i == 0 or text[i - 1] != "\\"):
            brace_depth = max(brace_depth - 1, 0)
        elif (
            char == "\\" and i + 1 < len(text) and text[i + 1] == "\\"
            and brace_depth == 0 and environment_depth == 0
        ):
            rows.append(text[row_start:i])
            i += 2
            if i < len(text) and text[i] == "*":
                i += 1
            while i < len(text) and text[i].isspace():
                i += 1
            if i < len(text) and text[i] == "[":
                bracket_depth = 1
                i += 1
                while i < len(text) and bracket_depth:
                    if text[i] == "[":
                        bracket_depth += 1
                    elif text[i] == "]":
                        bracket_depth -= 1
                    i += 1
            row_start = i
            continue
        i += 1
    rows.append(text[row_start:])
    return rows


def parse_equation_labels(body, tex_source="", initial_section_counter=0):
    """Reproduce the equation numbers used by the paper's LaTeX source.

    Equation counters are global unless the preamble explicitly places them
    within a section.  AMS align-like environments advance once per numbered
    row; starred displays and rows carrying ``\nonumber`` or ``\notag`` do
    not advance and do not acquire fabricated labels.
    """
    labels = {}
    preamble = tex_source.split(r'\begin{document}', 1)[0]
    within_matches = re.findall(
        r'\\(?:numberwithin|counterwithin)\s*\{equation\}\s*\{([^}]+)\}',
        preamble,
    )
    equation_within = within_matches[-1].strip() if within_matches else None
    equation_pattern = re.compile(
        r'\\begin\{'
        r'(equation|align|alignat|flalign|eqnarray|gather|multline)'
        r'(\*?)\}(.*?)\\end\{\1\2\}',
        re.DOTALL,
    )
    row_numbered_environments = {
        "align", "alignat", "flalign", "eqnarray", "gather",
    }
    leading, section_blocks = split_latex_heading_blocks_with_star(
        body, "section")
    section_counter = initial_section_counter
    appendix_counter = 0
    appendix_mode = bool(re.search(r'\\appendix\b', leading))
    current_section_number = initial_section_counter
    equation_counter = 0

    def shown_number():
        if equation_within == "section":
            return f"{current_section_number}.{equation_counter}"
        return str(equation_counter)

    def meaningful_row(row):
        without_controls = re.sub(
            r'\\(?:nonumber|notag)\b|\\label\{[^}]*\}|'
            r'\\(?:intertext|shortintertext)\s*\{.*?\}',
            '',
            row,
            flags=re.DOTALL,
        )
        # alignat's column-count argument is not a mathematical row.
        without_controls = re.sub(r'^\s*\{\s*\d+\s*\}', '', without_controls)
        return bool(without_controls.strip())

    def collect(content):
        nonlocal equation_counter
        for match in equation_pattern.finditer(content):
            env_name, star, env_body = match.groups()
            if star:
                continue
            rows = (
                split_top_level_math_rows(env_body)
                if env_name in row_numbered_environments
                else [env_body]
            )
            for row in rows:
                if not meaningful_row(row):
                    continue
                suppressed = bool(re.search(r'\\(?:nonumber|notag)\b', row))
                if suppressed:
                    continue
                equation_counter += 1
                number = shown_number()
                for label_match in re.finditer(r'\\label\{([^}]+)\}', row):
                    labels[label_match.group(1)] = number

    collect(leading)
    for _title, content, starred in section_blocks:
        if not starred:
            if appendix_mode:
                appendix_counter += 1
                current_section_number = chr(ord('A') + appendix_counter - 1)
            else:
                section_counter += 1
                current_section_number = section_counter
            if equation_within == "section":
                equation_counter = 0
        collect(content)
        if re.search(r'\\appendix\b', content):
            appendix_mode = True
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


def parse_sections(body, theorem_config=None, initial_section_counter=0):
    """Split body into sections and subsections."""
    leading_raw, section_blocks = split_latex_heading_blocks_with_star(
        body, "section")

    section_labels = {}  # label -> {"number": "2", "title": "..."} etc.

    def consume_heading_label(text, number, title):
        """Record only a label placed directly after a heading command."""
        match = re.match(r'\s*\\label\{([^}]+)\}', text)
        if not match:
            return text
        section_labels[match.group(1)] = {"number": number, "title": title}
        return text[:match.start()] + text[match.end():]

    def collect_heading_labels(text, base_number):
        _, subsub_blocks = split_latex_heading_blocks_with_star(
            text, "subsubsection")
        subsub_counter = 0
        for title, content, starred in subsub_blocks:
            if starred:
                continue
            subsub_counter += 1
            label_m = re.match(r'\s*\\label\{([^}]+)\}', content)
            if label_m:
                section_labels[label_m.group(1)] = {
                    "number": f"{base_number}.{subsub_counter}",
                    "title": title,
                }

    sections = []

    # One legacy paper begins with genuine numbered subsections (including
    # its three stated main theorems) before the first \section command.
    # LaTeX numbers these 0.1, 0.2, ...; retain that front matter instead of
    # silently dropping it from the website.
    if re.search(r'\\subsection\*?\s*\{', leading_raw):
        leading_pre, leading_subsections = split_latex_heading_blocks_with_star(
            leading_raw, "subsection")
        leading_pre = remove_latex_commands(leading_pre, "abstract")
        front_subsections = []
        front_counter = 0
        for sub_pos, (sub_title, sub_content, starred) in enumerate(
            leading_subsections, start=1
        ):
            if not starred:
                front_counter += 1
            sub_number = "" if starred else f"0.{front_counter}"
            sub_content = consume_heading_label(
                sub_content, sub_number, sub_title)
            if sub_number:
                collect_heading_labels(sub_content, sub_number)
            front_subsections.append({
                "id": f"S0.SS{sub_pos}",
                "number": sub_number,
                "counter_number": front_counter,
                "starred": starred,
                "title": sub_title,
                "sourceFingerprint": environment_source_fingerprint(
                    "subsection", f"{sub_title}\n{sub_content}"),
                "blocks": parse_blocks(sub_content, 0, theorem_config),
            })
        sections.append({
            "id": "S0",
            "number": "0",
            "counter_number": 0,
            "starred": False,
            "title": "Front matter",
            "sourceFingerprint": environment_source_fingerprint(
                "section", f"Front matter\n{leading_pre}"),
            "blocks": parse_blocks(leading_pre, 0, theorem_config),
            "subsections": front_subsections,
        })

    section_counter = initial_section_counter
    appendix_counter = 0
    appendix_mode = bool(re.search(r'\\appendix\b', leading_raw))
    current_section_number = initial_section_counter
    subsection_counter = 0
    for sec_pos, (sec_title, sec_content, section_starred) in enumerate(
        section_blocks, start=1
    ):
        if not section_starred:
            if appendix_mode:
                appendix_counter += 1
                current_section_number = chr(ord('A') + appendix_counter - 1)
            else:
                section_counter += 1
                current_section_number = section_counter
            subsection_counter = 0
        sec_number = "" if section_starred else str(current_section_number)

        # ``\appendix`` changes the numbering of the *following* section and
        # has no visible body content of its own.  It therefore occurs at the
        # end of the preceding section block after the heading split.
        starts_appendix_after_section = bool(
            re.search(r'\\appendix\b', sec_content))
        sec_content = re.sub(r'\\appendix\b', '', sec_content)

        # Split subsections FIRST, then extract labels per-piece
        pre_raw, subsection_blocks = split_latex_heading_blocks_with_star(
            sec_content, "subsection")

        # A structural label belongs to the heading only when it occurs
        # directly after that heading.  Prefix heuristics misclassified theorem
        # labels such as ``section5binglin`` and even ``section``.
        pre_raw = consume_heading_label(pre_raw, sec_number, sec_title)
        if sec_number:
            collect_heading_labels(pre_raw, sec_number)
        pre_content = pre_raw

        subsections = []
        for sub_pos, (sub_title, sub_content, sub_starred) in enumerate(
            subsection_blocks, start=1
        ):
            if not sub_starred:
                subsection_counter += 1
            sub_number = (
                "" if sub_starred
                else f"{current_section_number}.{subsection_counter}"
            )
            sub_content = consume_heading_label(
                sub_content, sub_number, sub_title)
            if sub_number:
                collect_heading_labels(sub_content, sub_number)
            subsections.append({
                # Keep source-position IDs stable; starred headings affect
                # counters, not the established page URL sequence.
                "id": f"S{sec_pos}.SS{sub_pos}",
                "number": sub_number,
                "counter_number": subsection_counter,
                "starred": sub_starred,
                "title": sub_title,
                "sourceFingerprint": environment_source_fingerprint(
                    "subsection", f"{sub_title}\n{sub_content}"),
                "blocks": parse_blocks(
                    sub_content, current_section_number, theorem_config),
            })

        sections.append({
            "id": f"S{sec_pos}",
            "number": sec_number,
            "counter_number": current_section_number,
            "starred": section_starred,
            "title": sec_title,
            "sourceFingerprint": environment_source_fingerprint(
                "section", f"{sec_title}\n{pre_content}"),
            "blocks": parse_blocks(
                pre_content, current_section_number, theorem_config),
            "subsections": subsections,
        })
        if starts_appendix_after_section:
            appendix_mode = True

    return sections, section_labels


def parse_blocks(content, sec_num, theorem_config=None):
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
            _parse_tex_blocks(
                part_content.strip(), blocks, sec_num, theorem_config or {})

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


def _consume_latex_optional_argument(text, start):
    r"""Return ``([argument], end)`` for an optional argument at ``start``.

    LaTeX closes an optional argument at the first ``]`` outside a brace
    group.  A flat ``[^\]]*`` match therefore truncates headings such as
    ``[{\cite[Theorem 1.1]{key}}]`` at the citation's inner bracket.  Keep
    the surrounding brackets in the returned value because downstream code
    uses them when fingerprinting the source environment.
    """
    i = start
    while i < len(text) and text[i].isspace():
        i += 1
    if i >= len(text) or text[i] != "[":
        return None, start

    argument_start = i
    i += 1
    brace_depth = 0
    while i < len(text):
        if text[i] == "{":
            brace_depth += 1
        elif text[i] == "}" and brace_depth:
            brace_depth -= 1
        elif text[i] == "]" and brace_depth == 0:
            return text[argument_start:i + 1], i + 1
        i += 1
    return None, start


def _unwrap_latex_outer_groups(text):
    """Remove brace groups that enclose an entire optional heading."""
    text = text.strip()
    while text.startswith("{") and text.endswith("}"):
        depth = 0
        encloses_all = True
        for index, char in enumerate(text):
            if char == "{":
                depth += 1
            elif char == "}":
                depth -= 1
                if depth == 0 and index != len(text) - 1:
                    encloses_all = False
                    break
        if not encloses_all or depth != 0:
            break
        text = text[1:-1].strip()
    return text


def environment_source_fingerprint(env_name, raw_payload):
    """Return a renderer-independent identity for one source environment.

    The fingerprint intentionally uses normalized raw TeX rather than rendered
    HTML, theorem numbers, or source ordinals.  Parser and numbering changes can
    therefore move an unchanged environment without changing its tag.  Exact
    matching is conservative: an edited unlabeled environment receives a new
    tag instead of silently inheriting the permalink of different content.
    """
    normalized_parts = []
    for value in (env_name, raw_payload):
        value = value.replace("\r\n", "\n").replace("\r", "\n")
        normalized_parts.append(re.sub(r'\s+', ' ', value).strip())
    payload = "\0".join(normalized_parts)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def _parse_tex_blocks(content, blocks, sec_num, theorem_config=None):
    """Parse tex content for environments and paragraphs.
    Uses depth-counting to correctly handle same-type nesting
    (e.g. proof inside proof)."""
    if not content:
        return

    theorem_config = theorem_config or {}
    env_names = set(ENV_TYPES) | set(theorem_config)
    env_names_alt = '|'.join(
        sorted((re.escape(k) for k in env_names), key=len, reverse=True))
    # Match the opening \begin{envname}; consume an optional theorem heading
    # separately so a protected ``]`` inside a citation does not end it.
    begin_pattern = re.compile(
        r'\\begin\{(' + env_names_alt + r')\}'
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
        opt_arg, body_start = _consume_latex_optional_argument(
            content, m.end())

        explicit_number = None
        env_config = theorem_config.get(env_name, {})
        if env_config.get("explicit_arg_number"):
            i = body_start
            while i < len(content) and content[i].isspace():
                i += 1
            if i < len(content) and content[i] == "{":
                arg_start = i + 1
                i += 1
                brace_depth = 1
                while i < len(content) and brace_depth:
                    if content[i] == "{":
                        brace_depth += 1
                    elif content[i] == "}":
                        brace_depth -= 1
                    i += 1
                if brace_depth == 0:
                    explicit_number = content[arg_start:i - 1].strip()
                    body_start = i

        # Find the correctly nested \end{env_name}
        body_end_after = _find_matching_end(content, env_name, body_start)
        if body_end_after == -1:
            # No matching end found; treat rest as paragraph
            pos = m.end()
            continue

        end_tag = '\\end{' + env_name + '}'
        body_end = body_end_after - len(end_tag)
        # Hash the complete raw payload following ``\\begin{env}``, including
        # optional and explicit-number arguments.  In particular, do not hash
        # the parser's partition of that payload: improving optional-argument
        # parsing must not change the identity of unchanged source text.
        source_fingerprint = environment_source_fingerprint(
            env_name, content[m.end():body_end])
        env_body = content[body_start:body_end].strip()

        # Extract the environment's own \label{...}.  It should occur near
        # the beginning of the environment; labels inside equations,
        # figures, tables, or list items belong to those objects instead.
        label = None
        labels = []
        first_begin_any = re.search(r'\\begin\{', env_body)
        search_region = env_body[:first_begin_any.start()] if first_begin_any else env_body[:300]
        non_env_label_prefixes = (
            "eq:", "eqn:", "equation:", "fig:", "figure:",
            "tab:", "table:", "item", "condition:", "criteria:",
        )
        own_label_matches = []
        for candidate in re.finditer(r'\\label\{([^}]+)\}', search_region):
            if not candidate.group(1).startswith(non_env_label_prefixes):
                own_label_matches.append(candidate)
                labels.append(candidate.group(1))
        if own_label_matches:
            label = labels[0]
            for label_match in reversed(own_label_matches):
                env_body = (
                    env_body[:label_match.start()]
                    + env_body[label_match.end():]
                )
            env_body = env_body.strip()

        # Determine display type
        display_type = env_config.get("title", ENV_TYPES.get(env_name, env_name.title()))
        env_note = None
        if env_name == "proof" and opt_arg:
            inner = _unwrap_latex_outer_groups(opt_arg[1:-1])
            display_type = tex_to_html(inner)
        elif opt_arg:
            env_note = tex_to_html(
                _unwrap_latex_outer_groups(opt_arg[1:-1]))

        # Check if the body contains nested tracked environments.
        # If so, recursively parse them instead of treating the whole
        # body as a single HTML blob.
        nested_env_check = begin_pattern.search(env_body)
        if nested_env_check:
            # Recursively parse to extract nested environments
            sub_blocks = []
            _parse_tex_blocks(
                env_body, sub_blocks, sec_num, theorem_config)
            # Wrap in the outer environment block with nested content
            block = {
                "type": "env",
                "envType": display_type,
                "envName": env_name,
                "content": "",  # content distributed across sub_blocks
                "label": label,
                "labels": labels,
                "children": sub_blocks,
                "envNote": env_note,
                "explicitNumber": explicit_number,
                "sourceFingerprint": source_fingerprint,
            }
            blocks.append(block)
        else:
            block = {
                "type": "env",
                "envType": display_type,
                "envName": env_name,
                "content": tex_to_html(env_body),
                "label": label,
                "labels": labels,
                "envNote": env_note,
                "explicitNumber": explicit_number,
                "sourceFingerprint": source_fingerprint,
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
        "enumerate", "itemize", "description",
        "asparaenum", "inparaenum", "compactenum",
        "asparaitem", "inparaitem", "compactitem",
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
    TEX_RENDER_CONTEXT["twoopt_macros"] = parse_two_optional_macro_definitions(tex_source)
    TEX_RENDER_CONTEXT["tex_dir"] = tex_dir
    TEX_RENDER_CONTEXT["cache_dir"] = os.path.join(tex_dir, ".tikz-cache")
    TEX_RENDER_CONTEXT["svg_serial"] = 0


def strip_svg_header(svg):
    """Remove XML/doctype wrappers so the SVG can be embedded inline."""
    svg = re.sub(r'<\?xml[^>]*>\s*', '', svg, count=1)
    svg = re.sub(r'<!DOCTYPE[^>]*(?:\[[\s\S]*?\]\s*)?>\s*', '', svg, count=1)
    svg = re.sub(r'<!--.*?-->\s*', '', svg, flags=re.DOTALL)
    return svg.strip()


def namespace_svg_ids(svg, prefix):
    """Make IDs and local references unique before an SVG is inlined."""
    id_pattern = re.compile(r'\bid=(["\'])([^"\']+)\1')
    ids = {match.group(2) for match in id_pattern.finditer(svg)}
    if not ids:
        return svg
    replacements = {old: f"{prefix}-{old}" for old in ids}

    svg = id_pattern.sub(
        lambda match: (
            f'id={match.group(1)}{replacements[match.group(2)]}{match.group(1)}'
        ),
        svg,
    )
    svg = re.sub(
        r'((?:xlink:)?href\s*=\s*)(["\'])#([^"\']+)\2',
        lambda match: (
            match.group(1)
            + match.group(2)
            + "#"
            + replacements.get(match.group(3), match.group(3))
            + match.group(2)
        ),
        svg,
    )
    svg = re.sub(
        r'url\(#([^)]+)\)',
        lambda match: f'url(#{replacements.get(match.group(1), match.group(1))})',
        svg,
    )
    svg = re.sub(
        r'url\((["\'])#([^"\']+)\1\)',
        lambda match: (
            f'url({match.group(1)}#{replacements.get(match.group(2), match.group(2))}'
            f'{match.group(1)})'
        ),
        svg,
    )
    return svg


def normalize_tikz_node_labels(text):
    """Repair empty and bare-math node labels used in legacy TikZ source."""
    text = re.sub(r'(node(?:\[[^]]*\])?)\{\$\$\}', r'\1{}', text)
    return re.sub(
        r'(node(?:\[[^]]*\])?)\{\\boxed\s*([A-Za-z0-9]+)\}',
        r'\1{$\\boxed{\2}$}',
        text,
    )


def latex_render_asset_paths(latex_source):
    """Return stable SVG/PDF cache paths for a standalone LaTeX fragment."""
    digest = hashlib.sha256(
        (
            LATEX_RENDERER_VERSION
            + "\n"
            + TEX_RENDER_CONTEXT["preamble"]
            + "\n"
            + TEX_RENDER_CONTEXT["tikzset"]
            + "\n"
            + latex_source
        ).encode()
    ).hexdigest()[:16]
    cache_dir = TEX_RENDER_CONTEXT["cache_dir"]
    return (
        os.path.join(cache_dir, f"{digest}.svg"),
        os.path.join(cache_dir, f"{digest}.pdf"),
    )


def render_tikz_block(
    tikz_source,
    aria_label="TikZ diagram",
    block_class="stacks-tikzcd",
    svg_class="stacks-tikzcd-svg",
    wrapper_tag="div",
    require_pdf=False,
):
    """Compile a TikZ/tikz-cd environment to inline SVG, with a readable fallback."""
    # A few source diagrams use ``{$$}`` for an intentionally empty node
    # label.  That starts and ends display math inside TikZ's existing math
    # context and makes otherwise valid diagrams fail to compile.
    tikz_source = normalize_tikz_node_labels(tikz_source)
    cache_dir = TEX_RENDER_CONTEXT["cache_dir"]
    os.makedirs(cache_dir, exist_ok=True)
    svg_path, pdf_path = latex_render_asset_paths(tikz_source)

    if not os.path.exists(svg_path) or (require_pdf and not os.path.exists(pdf_path)):
        document = r"""\documentclass[tikz,border=3pt]{standalone}
\usepackage{amsmath,amssymb,amsfonts,mathtools}
\usepackage{mathrsfs}
\usepackage{stmaryrd}
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
\providecommand{\stacksrendererref}[1]{\mbox{\ttfamily\detokenize{#1}}}
\providecommand{\Cref}[1]{\stacksrendererref{#1}}
\providecommand{\cref}[1]{\stacksrendererref{#1}}
\providecommand{\autoref}[1]{\stacksrendererref{#1}}
\renewcommand{\Cref}[1]{\stacksrendererref{#1}}
\renewcommand{\cref}[1]{\stacksrendererref{#1}}
\renewcommand{\autoref}[1]{\stacksrendererref{#1}}
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
                if require_pdf:
                    shutil.copyfile(os.path.join(tmpdir, pdf_for_svg), pdf_path)
                bundled_pdftocairo = os.path.expanduser(
                    "~/.cache/codex-runtimes/codex-primary-runtime/"
                    "dependencies/native/poppler/poppler/bin/pdftocairo"
                )
                pdftocairo = (
                    os.environ.get("PDFTOCAIRO")
                    or shutil.which("pdftocairo")
                    or (bundled_pdftocairo if os.path.exists(bundled_pdftocairo) else None)
                )
                if pdftocairo:
                    subprocess.run(
                        [pdftocairo, "-svg", pdf_for_svg, svg_path],
                        cwd=tmpdir,
                        env=env,
                        stdout=subprocess.PIPE,
                        stderr=subprocess.STDOUT,
                        text=True,
                        timeout=30,
                        check=True,
                    )
                elif shutil.which("dvisvgm"):
                    subprocess.run(
                        [
                            "dvisvgm", "--pdf", "--page=1", "--bbox=min",
                            "--no-fonts", f"--output={svg_path}", pdf_for_svg,
                        ],
                        cwd=tmpdir,
                        env=env,
                        stdout=subprocess.PIPE,
                        stderr=subprocess.STDOUT,
                        text=True,
                        timeout=30,
                        check=True,
                    )
                else:
                    raise FileNotFoundError(
                        "Neither pdftocairo nor dvisvgm is available"
                    )
            except (subprocess.CalledProcessError, subprocess.TimeoutExpired, FileNotFoundError) as exc:
                if os.environ.get("LATEX_RENDER_DEBUG"):
                    output = getattr(exc, "stdout", "") or ""
                    error_lines = [line for line in output.splitlines() if line.startswith("!") or line.startswith("l.")]
                    print("\n".join(error_lines[-6:]), file=sys.stderr)
                    numbered = document.splitlines()
                    print(
                        "\n".join(
                            f"{line_no + 1}: {line}"
                            for line_no, line in enumerate(numbered)
                            if line_no >= max(0, len(numbered) - 24)
                        ),
                        file=sys.stderr,
                    )
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

    TEX_RENDER_CONTEXT["svg_serial"] += 1
    asset_digest = os.path.splitext(os.path.basename(svg_path))[0]
    svg_prefix = f"latex-{asset_digest}-{TEX_RENDER_CONTEXT['svg_serial']}"
    svg = namespace_svg_ids(svg, svg_prefix)
    svg = re.sub(r'<svg\b', f'<svg class="{svg_class}"', svg, count=1)
    return (
        f'<{wrapper_tag} class="stacks-rendered-latex {block_class}" role="img" '
        f'aria-label="{html_attr(aria_label)}">'
        f'{svg}</{wrapper_tag}>'
    )


def render_tikzcd_block(tikz_source):
    """Compile a tikzcd environment to inline SVG, with a readable fallback."""
    return render_tikz_block(tikz_source, "Commutative diagram")


def render_tikzpicture_block(tikz_source):
    """Compile a tikzpicture environment to inline SVG, with a readable fallback."""
    return render_tikz_block(tikz_source, "TikZ diagram")


def replace_inline_tikz_commands(text):
    """Render standalone ``$\\tikz[...] {...}$`` notations as inline SVG."""
    pieces = []
    pos = 0
    for start, end, _argument in iter_latex_command_spans(
        text, "tikz", allow_optional=True
    ):
        replace_start = start
        replace_end = end
        # These source notations are complete inline-math spans. Drop their
        # outer delimiters so an HTML image never lands inside MathJax TeX.
        if (
            start > 0
            and end < len(text)
            and text[start - 1] == "$"
            and text[end] == "$"
        ):
            replace_start -= 1
            replace_end += 1
        pieces.append(text[pos:replace_start])
        pieces.append(
            render_tikz_block(
                text[start:end],
                "Diagrammatic operation",
                block_class="stacks-inline-tikz",
                svg_class="stacks-inline-tikz-svg",
                wrapper_tag="span",
            )
        )
        pos = replace_end
    pieces.append(text[pos:])
    return "".join(pieces)


def render_picture_block(picture_source):
    """Compile a LaTeX picture environment, including Inkscape overlays, to SVG."""
    return render_tikz_block(picture_source, "Figure")


def sanitize_display_source_for_latex(display_source):
    """Make display math friendlier to standalone LaTeX rendering."""
    def sanitize_text_arg(arg):
        arg = re.sub(r'\$([^$]+)\$', r'\\ensuremath{\1}', arg)
        return r'\text{' + arg + '}'

    return replace_latex_commands(display_source, "text", sanitize_text_arg)


def wrap_tikz_commands_for_math(display_source):
    """Replace bare TikZ commands in math mode with cached rendered assets."""
    pieces = []
    pos = 0
    for start, end, _argument in iter_latex_command_spans(
        display_source, "tikz", allow_optional=True
    ):
        command = normalize_tikz_node_labels(display_source[start:end])
        rendered = render_tikz_block(command, require_pdf=True)
        _svg_path, pdf_path = latex_render_asset_paths(command)
        pieces.append(display_source[pos:start])
        if "stacks-latex-fallback" in rendered or not os.path.exists(pdf_path):
            pieces.append(display_source[start:end])
        else:
            pieces.append(
                r'\vcenter{\hbox{\includegraphics{\detokenize{'
                + pdf_path.replace("\\", "/")
                + r'}}}}'
            )
        pos = end
    pieces.append(display_source[pos:])
    return "".join(pieces)


def render_latex_display_block(display_source):
    """Compile a display math block to inline SVG when MathJax is too fragile."""
    display_source = sanitize_display_source_for_latex(display_source)
    display_source = wrap_tikz_commands_for_math(display_source)
    return render_tikz_block(
        "\\[\n" + display_source + "\n\\]",
        "Display equation",
        block_class="stacks-display-equation",
        svg_class="stacks-display-equation-svg",
    )


def render_latex_align_block(display_source):
    """Compile a top-level align block, preserving intertext commands."""
    display_source = sanitize_display_source_for_latex(display_source)
    display_source = wrap_tikz_commands_for_math(display_source)
    return render_tikz_block(
        "\\begin{align*}\n" + display_source + "\n\\end{align*}",
        "Display equation",
        block_class="stacks-display-equation",
        svg_class="stacks-display-equation-svg",
    )


def has_rendered_latex_block(body):
    """Detect HTML blocks already rendered by the LaTeX-to-SVG pipeline."""
    return 'stacks-rendered-latex' in body or 'stacks-tikzcd' in body


def has_generated_html_block(body):
    """Detect HTML blocks that should not be wrapped in display math delimiters."""
    return (
        has_rendered_latex_block(body)
        or 'stacks-table-wrap' in body
        or 'stacks-caption' in body
        or 'stacks-figure' in body
        or 'stacks-latex-fallback' in body
    )


def render_xypic_block(xy_source):
    """Compile an Xy-pic graph to inline SVG, with a readable fallback."""
    return render_tikz_block("\\[\n" + xy_source + "\n\\]", "Xy-pic diagram")


def replace_xypic_commands(text):
    """Render Xy-pic commands, including xymatrix spacing modifiers, to SVG."""
    pieces = []
    pos = 0
    command_re = re.compile(r'\\(?:xygraph|xymatrix)\b')
    while True:
        match = command_re.search(text, pos)
        if not match:
            break
        brace = text.find("{", match.end())
        if brace == -1:
            break
        i = brace + 1
        depth = 1
        while i < len(text) and depth:
            if text[i] == "{":
                depth += 1
            elif text[i] == "}":
                depth -= 1
            i += 1
        if depth != 0:
            pos = match.end()
            continue
        pieces.append(text[pos:match.start()])
        pieces.append(render_xypic_block(text[match.start():i]))
        pos = i
    pieces.append(text[pos:])
    return "".join(pieces)


def normalize_geometric_alphabets(tex):
    """Normalize common geometric alphabet choices before MathJax rendering."""
    alphabet = "ACFGKNPQRZ"

    def normalize_letter(match):
        return "\\mathbb{" + match.group(1) + "}"

    tex = re.sub(r'\{\\bf\s+Gr\}', r'\\mathbb{G}', tex)
    tex = re.sub(r'\\bf\s+Gr\b', r'\\mathbb{G}', tex)
    tex = re.sub(r'\\mathbf\s*\{([' + alphabet + r'])\}', normalize_letter, tex)
    tex = re.sub(r'\\mathbf\s+([' + alphabet + r'])\b', normalize_letter, tex)
    tex = re.sub(r'\{\\bf\s+([' + alphabet + r'])\}', normalize_letter, tex)
    tex = re.sub(r'\\bf\s+([' + alphabet + r'])\b', normalize_letter, tex)
    tex = re.sub(r'\\mathbb\s+([' + alphabet + r'])\b', normalize_letter, tex)
    return tex


def replace_latex_accents(text):
    """Convert simple LaTeX accent commands in text mode to HTML entities."""
    text = text.replace(r'\uazvan', '&#259;zvan')
    text = re.sub(r'\\o(?=mme\b)', '&oslash;', text)
    text = re.sub(r'\\o(?:\{\})?(?![A-Za-z])', '&oslash;', text)

    # TeX uses the commands \i and \j for dotless letters under accents.
    # Normalize those spellings so the ordinary accent table can handle both
    # compact forms (\"\i) and braced forms (\'{\i}).
    dotless_accent = re.compile(
        r'(\\["\'`\^~v])\s*(?:\{\\([ij])\}|\\([ij])(?![A-Za-z]))'
    )
    text = dotless_accent.sub(
        lambda match: (
            match.group(1) + '{' + (match.group(2) or match.group(3)) + '}'
        ),
        text,
    )
    accent_entities = {
        '"': {
            'a': '&auml;', 'e': '&euml;', 'i': '&iuml;', 'o': '&ouml;', 'u': '&uuml;', 'y': '&yuml;',
            'A': '&Auml;', 'E': '&Euml;', 'I': '&Iuml;', 'O': '&Ouml;', 'U': '&Uuml;', 'Y': '&#376;',
        },
        "'": {
            'a': '&aacute;', 'e': '&eacute;', 'i': '&iacute;', 'o': '&oacute;', 'u': '&uacute;', 'y': '&yacute;',
            'A': '&Aacute;', 'E': '&Eacute;', 'I': '&Iacute;', 'O': '&Oacute;', 'U': '&Uacute;', 'Y': '&Yacute;',
        },
        '`': {
            'a': '&agrave;', 'e': '&egrave;', 'i': '&igrave;', 'o': '&ograve;', 'u': '&ugrave;',
            'A': '&Agrave;', 'E': '&Egrave;', 'I': '&Igrave;', 'O': '&Ograve;', 'U': '&Ugrave;',
        },
        '^': {
            'a': '&acirc;', 'e': '&ecirc;', 'i': '&icirc;', 'o': '&ocirc;', 'u': '&ucirc;',
            'A': '&Acirc;', 'E': '&Ecirc;', 'I': '&Icirc;', 'O': '&Ocirc;', 'U': '&Ucirc;',
        },
        '~': {
            'a': '&atilde;', 'n': '&ntilde;', 'o': '&otilde;',
            'A': '&Atilde;', 'N': '&Ntilde;', 'O': '&Otilde;',
        },
        'u': {
            'a': '&#259;', 'A': '&#258;',
        },
        'v': {
            'c': '&#269;', 'C': '&#268;',
            'e': '&#283;', 'E': '&#282;',
            'n': '&#328;', 'N': '&#327;',
            'r': '&#345;', 'R': '&#344;',
            's': '&#353;', 'S': '&#352;',
            'z': '&#382;', 'Z': '&#381;',
        },
    }

    def accent_replace(match):
        accent = match.group(1)
        letter = match.group(2) or match.group(3)
        return accent_entities.get(accent, {}).get(letter, letter)

    # Accept compact forms (\"u, \'{e}) and spaced forms emitted by some
    # source normalizers (\" uller).
    text = re.sub(
        r'\\(["\'`\^~])\s*(?:\{([A-Za-z])\}|([A-Za-z]))',
        accent_replace,
        text,
    )
    # Unlike the accent control symbols above, ``\v`` is a control word.
    # Require braces or separating whitespace so commands such as ``\vrule``
    # are not mistaken for a caron over ``r``.
    return re.sub(
        r'\\(v)(?:\s*\{([A-Za-z])\}|\s+([A-Za-z]))',
        accent_replace,
        text,
    )


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


def flatten_nested_tabulars_for_table_cells(body):
    """Flatten tabulars that occur inside table cells before row splitting."""
    out = []
    pos = 0
    env_re = re.compile(r'\\begin\{tabular\}')
    while True:
        match = env_re.search(body, pos)
        if not match:
            out.append(body[pos:])
            break

        i = match.end()
        if i < len(body) and body[i] == "[":
            i += 1
            depth = 1
            while i < len(body) and depth:
                if body[i] == "[":
                    depth += 1
                elif body[i] == "]":
                    depth -= 1
                i += 1
        while i < len(body) and body[i].isspace():
            i += 1
        if i >= len(body) or body[i] != "{":
            out.append(body[pos:match.end()])
            pos = match.end()
            continue

        i += 1
        depth = 1
        while i < len(body) and depth:
            if body[i] == "{":
                depth += 1
            elif body[i] == "}":
                depth -= 1
            i += 1
        if depth:
            out.append(body[pos:])
            break

        body_start = i
        end_token = r'\end{tabular}'
        end = body.find(end_token, body_start)
        if end == -1:
            out.append(body[pos:])
            break

        inner = body[body_start:end]
        inner = re.sub(r'\\(?:toprule|midrule|bottomrule|hline)\b', '', inner)
        inner_rows = []
        for row in split_latex_top_level(inner, r'\\'):
            row = row.strip()
            if not row:
                continue
            inner_rows.append(
                ' '.join(
                    cell.strip()
                    for cell in split_latex_top_level(row, '&')
                    if cell.strip()
                )
            )

        out.append(body[pos:match.start()])
        out.append('<br>'.join(inner_rows))
        pos = end + len(end_token)

    return ''.join(out)


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
    body = flatten_nested_tabulars_for_table_cells(body)
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


LATEX_LIST_ENVS = (
    "enumerate",
    "itemize",
    "description",
    "asparaenum",
    "inparaenum",
    "compactenum",
    "asparaitem",
    "inparaitem",
    "compactitem",
)
LATEX_LIST_ENV_PATTERN = "|".join(LATEX_LIST_ENVS)


def latex_list_tag(env):
    if env == "description":
        return "dl"
    return "ul" if env.endswith("item") or env == "itemize" else "ol"


def find_matching_latex_list_end(text, begin_match):
    """Find the end of a possibly nested enumerate/itemize environment."""
    token_re = re.compile(rf'\\(begin|end)\{{(?:{LATEX_LIST_ENV_PATTERN})\}}')
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
    token_re = re.compile(
        rf'\\begin\{{(?:{LATEX_LIST_ENV_PATTERN})\}}|'
        rf'\\end\{{(?:{LATEX_LIST_ENV_PATTERN})\}}|'
        r'\\item\b'
    )
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
            content = body[current_start:match.start()].strip()
            content = re.sub(r'(?:\\\\\s*)+$', '', content).rstrip()
            items.append((current_label, content))
        current_label, current_start = parse_latex_item_label(body, match.end())

    if current_start is not None:
        content = body[current_start:].strip()
        content = re.sub(r'(?:\\\\\s*)+$', '', content).rstrip()
        items.append((current_label, content))

    return [(label, content) for label, content in items if content]


def convert_latex_lists(text):
    """Convert nested LaTeX enumerate/itemize environments to HTML lists."""
    begin_re = re.compile(rf'\\begin\{{({LATEX_LIST_ENV_PATTERN})\}}')
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
        tag = latex_list_tag(env)
        body = text[begin.end():end_start]
        html_items = []
        for label, item_content in split_latex_list_items(body):
            # Render each item as its own block context.  A global paragraph
            # pass otherwise inserts unmatched ``</p><p>`` pairs around blank
            # lines and block diagrams inside ``<li>`` elements.
            item_html = wrap_content_html(tex_to_html(item_content)).strip()
            if tag == "dl":
                term = tex_to_html(label or "")
                html_items.append(f'<dt>{term}</dt><dd>{item_html}</dd>')
            elif label:
                label_html = tex_to_html(label)
                if item_html.startswith('<p>'):
                    item_html = item_html.replace(
                        '<p>', f'<p><strong>{label_html}</strong> ', 1)
                else:
                    item_html = f'<strong>{label_html}</strong> {item_html}'
                html_items.append(f'<li>{item_html}</li>')
            else:
                html_items.append(f'<li>{item_html}</li>')
        out.append(f'<{tag}>' + '\n'.join(html_items) + f'</{tag}>')
        pos = end_end

    return ''.join(out)


def protect_latex_math_fragments(text):
    """Temporarily replace TeX math spans with placeholders."""
    fragments = []
    out = []
    i = 0

    def is_escaped(pos):
        backslashes = 0
        j = pos - 1
        while j >= 0 and text[j] == "\\":
            backslashes += 1
            j -= 1
        return backslashes % 2 == 1

    delimiters = (("$$", "$$"), ("\\[", "\\]"), ("\\(", "\\)"), ("$", "$"))

    while i < len(text):
        matched = None
        if not is_escaped(i):
            for opener, closer in delimiters:
                if text.startswith(opener, i):
                    matched = (opener, closer)
                    break
        if not matched:
            out.append(text[i])
            i += 1
            continue

        opener, closer = matched
        start = i
        i += len(opener)
        while i < len(text):
            if text.startswith(closer, i) and not is_escaped(i):
                i += len(closer)
                token = f"@@LATEXMATH{len(fragments)}@@"
                fragments.append(text[start:i])
                out.append(token)
                break
            i += 1
        else:
            out.append(text[start:])
            break

    return ''.join(out), fragments


def restore_latex_math_fragments(text, fragments):
    for idx, fragment in enumerate(fragments):
        # TeX comparison/alignment characters are text as far as MathJax is
        # concerned, but raw <, >, and & have structural meaning to the HTML
        # parser.  Escape them in the serialized page; the browser decodes the
        # entities before MathJax reads the text node.
        # Some structural blocks make a second pass through tex_to_html.  First
        # decode any entities created by the earlier pass, then serialize the
        # TeX exactly once.  This avoids producing ``&amp;amp;`` in alignments.
        safe_fragment = html_mod.escape(
            html_mod.unescape(fragment).expandtabs(4), quote=False
        )
        text = text.replace(f"@@LATEXMATH{idx}@@", safe_fragment)
    return text


def tex_to_html(tex):
    """Convert LaTeX markup to HTML for MathJax rendering."""
    s = normalize_geometric_alphabets(expand_two_optional_macros(tex))
    # Normalize these before any ``$$...$$`` scan: an empty TikZ node written
    # as ``{$$}`` must not be mistaken for display-math delimiters.
    s = normalize_tikz_node_labels(s)

    # Text macros from the source preamble which are not MathJax macros.
    s = s.replace('\\Aletheia', '<em>Aletheia</em>')
    s = re.sub(r'\\Addresses\b', '', s)
    s = re.sub(r'\\texorpdfstring\{((?:[^{}]|\{[^{}]*\})*)\}\{(?:[^{}]|\{[^{}]*\})*\}', r'\1', s)
    s = remove_latex_macro_definitions(s)
    s = re.sub(r'\\def\s*\\svgwidth\s*\{[^{}]*\}', '', s)
    s = re.sub(r'\\def\s*\\cprime\s*\{[^{}]*\}', '', s)
    s = re.sub(
        r'\\catcode.\\@=10.*?\\catcode.\\@=10',
        '',
        s,
        flags=re.DOTALL,
    )
    s = re.sub(r'\\cdsep\s*=\s*[^\n]*', '', s)
    # Table coloring and font-size declarations control print presentation;
    # retain their content without exposing the commands as website prose.
    s = re.sub(
        r'\\rowcolors\s*\{[^{}]*\}\s*\{[^{}]*\}\s*\{[^{}]*\}',
        '',
        s,
    )
    s = replace_latex_commands(s, "rowcolor", lambda _color: "")
    s = replace_latex_two_arg_commands(
        s, "diagbox", lambda first, second: f"{first} / {second}")
    s = re.sub(
        r'\\(?:tiny|scriptsize|footnotesize|small|normalsize|large|Large|LARGE|huge|Huge)\b',
        '',
        s,
    )
    # Standalone pagination and theorem-style declarations affect only the
    # print layout.  Keep the match line-scoped so embedded uses are not
    # mistaken for body-level declarations.
    s = re.sub(
        r'(?m)^[ \t]*\\(?:theoremstyle[ \t]*\{[^{}\n]*\}'
        r'|(?:clearpage|newpage|pagebreak|nopagebreak|bigskip|medskip|smallskip|vfill)'
        r'(?:[ \t]*\[[^\]\n]*\])?)[ \t]*$',
        '',
        s,
    )

    def legacy_cd_arrow(direction, label):
        arrows = {
            "u": r'\uparrow',
            "d": r'\downarrow',
            "r": r'\longrightarrow',
            "l": r'\longleftarrow',
        }
        arrow = arrows.get(direction.strip(), r'\longrightarrow')
        if label.strip():
            return r'\mathop{' + arrow + r'}\limits^{' + label.strip() + '}'
        return arrow

    s = replace_latex_two_arg_commands(s, "arrow", legacy_cd_arrow)
    s = re.sub(r'\\cr(?![A-Za-z@])', lambda _match: r'\\', s)

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
    s = replace_xypic_commands(s)

    # figure/table/subfigure wrappers are layout hints in LaTeX; keep captions
    # and labels as plain HTML around any rendered diagrams or tables.
    s = re.sub(r'\\begin\{(?:figure|table)\}(?:\[[^\]]*\])?', '', s)
    s = re.sub(r'\\end\{(?:figure|table)\}', '', s)
    s = replace_latex_optional_arg_commands(
        s,
        "subfigure",
        lambda caption, body: (
            body.strip()
            + (
                '\n<div class="stacks-caption stacks-subcaption">'
                f'{tex_to_html(caption.strip())}</div>'
                if caption and caption.strip() else ''
            )
        ),
    )
    s = re.sub(r'\\begin\{subfigure\}(?:\[[^\]]*\])?(?:\{[^{}]*\})?', '', s)
    s = re.sub(r'\\end\{subfigure\}', '', s)
    s = re.sub(r'\\centering\b', '', s)
    s = re.sub(r'\\vspace\*?(?:\[[^\]]*\])?\{[^{}]*\}', '', s)
    s = replace_latex_two_arg_commands(s, "renewcommand", lambda _name, _value: "")

    # A few displays use tabular or inline TikZ inside large delimiters. Such
    # constructs belong to the display and must be rendered with LaTeX before
    # prose-level table and inline-command conversion runs.
    def display_with_fragile_latex_replace(m):
        body = m.group(1)
        if r'\begin{tabular}' not in body and r'\tikz' not in body:
            return m.group(0)
        return render_latex_display_block(body.strip())

    s = re.sub(
        r'\$\$(.*?)\$\$', display_with_fragile_latex_replace, s, flags=re.DOTALL
    )
    s = re.sub(
        r'\\\[(.*?)\\\]',
        display_with_fragile_latex_replace,
        s,
        flags=re.DOTALL,
    )

    # Convert ordinary multiline mathematics to MathJax.  Only constructs
    # MathJax cannot faithfully handle (embedded tabular/TikZ and intertext)
    # use the LaTeX-to-SVG path.
    def multiline_display(body):
        body = re.sub(r'\\label\{[^}]*\}', '', body)
        body = re.sub(r'\\nonumber', '', body)
        aligned = r'\begin{aligned}' + body.strip() + r'\end{aligned}'
        if r'\intertext' in body:
            return render_latex_align_block(body.strip())
        if any(token in body for token in (
            r'\begin{tabular}', r'\tikz',
        )):
            return render_latex_display_block(aligned)
        return '$$' + aligned + '$$'

    def align_replace(m):
        return multiline_display(m.group(1))
    s = re.sub(r'\\begin\{align\*?\}(.*?)\\end\{align\*?\}',
               align_replace, s, flags=re.DOTALL)
    s = re.sub(
        r'\\begin\{alignat\*?\}\s*\{[^{}]*\}(.*?)\\end\{alignat\*?\}',
        align_replace, s, flags=re.DOTALL)

    def eqnarray_replace(m):
        return multiline_display(m.group(1))
    s = re.sub(r'\\begin\{eqnarray\*?\}(.*?)\\end\{eqnarray\*?\}',
               eqnarray_replace, s, flags=re.DOTALL)

    # Any remaining bare TikZ command is an inline diagrammatic notation.
    s = replace_inline_tikz_commands(s)

    # tabular/longtable → semantic HTML table instead of fragile MathJax arrays.
    # Do this before general caption handling so longtable captions stay with
    # their tables instead of becoming bogus table rows.
    s = replace_table_environments(s)

    def caption_to_html(caption):
        inner = tex_to_html(caption.strip())
        # A caption is already enclosed by a block element.  Source paragraph
        # breaks must not leave unmatched paragraph markers inside that div.
        inner = re.sub(r'</p>\s*<p>', '<br><br>', inner)
        inner = re.sub(r'^\s*<p>', '', inner)
        inner = re.sub(r'</p>\s*$', '', inner)
        return f'<div class="stacks-caption">{inner}</div>'

    s = replace_latex_commands(
        s,
        "caption",
        caption_to_html,
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
        if has_generated_html_block(body):
            return body.strip()
        body = re.sub(r'\\label\{[^}]*\}', '', body)
        body = re.sub(r'\\nonumber', '', body)
        return '$$' + body.strip() + '$$'
    s = re.sub(r'\\begin\{equation\*?\}(.*?)\\end\{equation\*?\}',
               equation_replace, s, flags=re.DOTALL)

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
    s = re.sub(r'\\protect\s*\\footnotemark\b', '', s)
    s = re.sub(r'\\footnotemark\b', '', s)
    s = re.sub(r'\\footnotetext\{((?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*)\}',
               r' <span style="font-size:0.9em;color:#555;">(\1)</span>', s)
    s = re.sub(r'\\footnote\{((?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*)\}',
               r' <span style="font-size:0.9em;color:#555;">(\1)</span>', s)

    # Hyperlinks inside captions and prose should become ordinary HTML links
    # before inline formatting/maths are handled.
    s = replace_latex_two_arg_commands(
        s,
        "href",
        lambda url, label: (
            f'<a href="{safe_latex_href_target(url)}">'
            f'{tex_to_html(label.strip())}</a>'
        ),
    )
    s = replace_latex_commands(
        s,
        "url",
        lambda url: (
            f'<a href="{safe_latex_href_target(url)}">'
            f'{visible_latex_url(url)}</a>'
        ),
    )
    s = re.sub(r'\\textasciitilde(?:\{\})?\s*', '&#126;', s)
    s = re.sub(r'\\text\{\s*\\(?:sl|it|itshape)\s+', r'\\text{', s)
    s = re.sub(r'\\(?:qedhere|hfill)\b', '', s)

    # Normalize bracket displays while their TeX is still untouched.  This
    # must precede HTML entity escaping so LaTeX-rendered aligned blocks see
    # genuine alignment characters rather than &amp; text.
    def bracket_display_replace(m):
        body = m.group(1).strip()
        if has_generated_html_block(body):
            return body
        if re.match(r'\\begin\{(?:aligned|alignedat|gathered|split)\}', body):
            return render_latex_display_block(body)
        return '$$' + body + '$$'
    s = re.sub(r'\\\[(.*?)\\\]', bracket_display_replace, s, flags=re.DOTALL)

    # --- Inline formatting ---
    #
    # Protect math first: declaration-style text commands may wrap formulas,
    # and commands such as \text{\sl ...} may occur inside formulas.  HTML tags
    # inside a MathJax delimiter break rendering and expose literal "$$".
    s, math_fragments = protect_latex_math_fragments(s)
    s = re.sub(r'\\(?:quad|qquad)\b', ' ', s)
    s = re.sub(r'\\hspace\*?(?:\[[^\]]*\])?\{[^{}]*\}', ' ', s)
    s = replace_latex_accents(s)

    s = replace_latex_text_command(s, "emph", "em")
    s = replace_latex_text_command(s, "textit", "em")
    s = replace_latex_text_command(s, "textsl", "em")
    s = replace_latex_text_command(s, "textbf", "strong")
    s = replace_latex_text_command(s, "texttt", "code")
    s = replace_latex_text_command(s, "text", "span")
    s = replace_latex_text_command(s, "underline", "u")
    s = re.sub(r'\\S(?:\{\})?', '&sect;', s)
    s = re.sub(r'\\(?:appendix|nonumber|noindent)\b', '', s)
    s = s.replace(r'\&', '&amp;')

    # Declaration-style formatting from BibTeX .bbl output.  These often
    # contain capitalization braces, so regexes that stop at the first brace
    # corrupt titles; use balanced scanning instead.
    s = replace_latex_declaration_group(s, "sl", "em")
    s = replace_latex_declaration_group(s, "it", "em")
    s = replace_latex_declaration_group(s, "em", "em")
    s = replace_latex_declaration_group(s, "textbf", "strong")
    s = replace_latex_declaration_group(s, "bf", "strong")
    s = replace_latex_declaration_group(s, "tt", "code")
    s = replace_latex_declaration_group(s, "sc", "span", ' class="stacks-small-caps"')
    # ~ -> non-breaking space
    s = s.replace('~', '&nbsp;')

    # --- -> &mdash;   -- -> &ndash;
    s = s.replace('---', '&mdash;')
    s = s.replace('--', '&ndash;')

    # This second pass catches text exposed by earlier command conversions.
    s = replace_latex_accents(s)

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
    s = re.sub(r'</p>\s*<p>\s*(<(?:ol|ul|dl)\b)', r'\1', s)
    s = re.sub(r'<p>\s*(<(?:ol|ul|dl)\b)', r'\1', s)
    s = re.sub(r'(</(?:ol|ul|dl)>)\s*</p>\s*<p>', r'\1', s)
    s = re.sub(r'(</(?:ol|ul|dl)>)\s*</p>', r'\1', s)
    s = re.sub(r'<p>\s*</p>', '', s)

    s = restore_latex_math_fragments(s, math_fragments)
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
# SECTION PERMALINK ASSIGNMENT
# ============================================================

def normalize_section_identity_text(text):
    """Normalize a heading or paragraph for conservative identity matching."""
    text = str(text)
    text = re.sub(r'<svg\b[^>]*>.*?</svg>', ' [diagram] ', text,
                  flags=re.DOTALL | re.IGNORECASE)
    text = strip_html(text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip().casefold()


def section_block_identity(blocks):
    """Return stable anchors and a content hash for one section-page body.

    Raw theorem-environment fingerprints are renderer-independent.  Ordinary
    prose has already passed through tex_to_html, so SVG bodies are discarded
    and only normalized text contributes.  The hash is an exact secondary
    identity: an edited page normally continues to match by its structural
    label or title instead.
    """
    anchors = []
    parts = []

    def visit(items):
        for block in items:
            label = block.get("label")
            if label:
                anchors.append(label)
            fingerprint = block.get("sourceFingerprint")
            if fingerprint:
                parts.append(
                    f"env:{block.get('envName', '')}:{fingerprint}")
            else:
                normalized = normalize_section_identity_text(
                    str(block.get("content", "")))
                if normalized:
                    parts.append(f"{block.get('type', '')}:{normalized}")
            if block.get("children"):
                visit(block["children"])

    visit(blocks)
    digest = ""
    if parts:
        digest = hashlib.sha256("\n".join(parts).encode()).hexdigest()
    return sorted(set(anchors)), digest


def section_heading_labels(paper, page):
    """Return labels attached directly to this section-like heading."""
    number = str(page.get("number", ""))
    title = normalize_section_identity_text(page.get("title", ""))
    labels = []
    for label, info in paper.get("section_labels", {}).items():
        if str(info.get("number", "")) != number:
            continue
        if normalize_section_identity_text(info.get("title", "")) != title:
            continue
        labels.append(label)
    return sorted(set(labels))


def section_identity_entry(paper, page, kind, parent_id=None):
    anchors, fingerprint = section_block_identity(page.get("blocks", []))
    return {
        "kind": kind,
        "parent": parent_id,
        "labels": section_heading_labels(paper, page),
        "anchors": anchors,
        "title": normalize_section_identity_text(page.get("title", "")),
        "sourceFingerprint": page.get("sourceFingerprint", ""),
        "fingerprint": fingerprint,
        "starred": bool(page.get("starred")),
        "source_id": page.get("id", ""),
    }


def is_live_section_entry(info):
    return not info.get("retired") and not info.get("redirect")


def section_registry_indexes(entries):
    """Index prior live pages by identities that are safe when unique."""
    indexes = {
        "label": {},
        "sourceFingerprint": {},
        "fingerprint": {},
        "anchors": {},
        "scoped_title": {},
    }

    def add(name, key, page_id):
        if not key or (isinstance(key, tuple) and not all(key)):
            return
        indexes[name].setdefault(key, []).append(page_id)

    for page_id, info in entries.items():
        if not is_live_section_entry(info):
            continue
        kind = info.get("kind", "")
        for label in info.get("labels", []):
            add("label", (kind, label), page_id)
        add(
            "sourceFingerprint",
            (kind, info.get("sourceFingerprint", "")),
            page_id,
        )
        add("fingerprint", (kind, info.get("fingerprint", "")), page_id)
        anchors = tuple(info.get("anchors", []))
        if anchors:
            add("anchors", (kind, anchors), page_id)
        title = info.get("title", "")
        add(
            "scoped_title",
            (kind, info.get("parent") or "__root__", title),
            page_id,
        )
    return indexes


def unique_section_match(indexes, identity, used_ids):
    """Match only an unambiguous prior page; never fall back to its ordinal."""
    kind = identity["kind"]

    label_candidates = set()
    for label in identity.get("labels", []):
        label_candidates.update(indexes["label"].get((kind, label), []))
    if len(label_candidates) == 1:
        candidate = next(iter(label_candidates))
        if candidate not in used_ids:
            return candidate

    # Raw TeX is independent of the HTML renderer.  It therefore preserves a
    # permalink when a compiler correction changes the rendered text of an
    # otherwise untouched, unlabeled, blank-titled section.
    source_fingerprint = identity.get("sourceFingerprint", "")
    if source_fingerprint:
        candidates = indexes["sourceFingerprint"].get(
            (kind, source_fingerprint), [])
        if len(candidates) == 1 and candidates[0] not in used_ids:
            return candidates[0]

    fingerprint = identity.get("fingerprint", "")
    if fingerprint:
        candidates = indexes["fingerprint"].get((kind, fingerprint), [])
        if len(candidates) == 1 and candidates[0] not in used_ids:
            return candidates[0]

    anchors = tuple(identity.get("anchors", []))
    if anchors:
        candidates = indexes["anchors"].get((kind, anchors), [])
        if len(candidates) == 1 and candidates[0] not in used_ids:
            return candidates[0]

    title = identity.get("title", "")
    if title:
        scoped_key = (kind, identity.get("parent") or "__root__", title)
        candidates = indexes["scoped_title"].get(scoped_key, [])
        if len(candidates) == 1 and candidates[0] not in used_ids:
            return candidates[0]
    return None


def allocate_section_page_id(kind, parent_id, source_id, occupied_ids):
    """Allocate a readable ID without ever reusing a retired permalink."""
    if source_id and source_id not in occupied_ids:
        return source_id

    if kind == "section":
        numbers = [
            int(match.group(1))
            for page_id in occupied_ids
            for match in [re.fullmatch(r'S(\d+)', page_id)]
            if match
        ]
        number = max(numbers, default=-1) + 1
        while f"S{number}" in occupied_ids:
            number += 1
        return f"S{number}"

    base = parent_id or "S0"
    pattern = re.compile(re.escape(base) + r'\.SS(\d+)$')
    numbers = [
        int(match.group(1))
        for page_id in occupied_ids
        for match in [pattern.fullmatch(page_id)]
        if match
    ]
    number = max(numbers, default=0) + 1
    candidate = f"{base}.SS{number}"
    while candidate in occupied_ids:
        number += 1
        candidate = f"{base}.SS{number}"
    return candidate


def assign_section_page_ids(paper, slug, previous_entries):
    """Assign sticky section IDs and retain removed IDs as safe tombstones."""
    previous_entries = {
        page_id: dict(info) for page_id, info in previous_entries.items()
    }
    indexes = section_registry_indexes(previous_entries)
    has_live_history = any(
        is_live_section_entry(info) for info in previous_entries.values())
    historical_tombstones = {
        page_id: dict(info)
        for (paper_slug, page_id), info
        in HISTORICAL_SECTION_TOMBSTONES.items()
        if paper_slug == slug
    }
    migration_targets = {
        target
        for (paper_slug, _source_id), target
        in INITIAL_SECTION_ID_MIGRATIONS.items()
        if paper_slug == slug
    }
    reserved_ids = (
        set(previous_entries) | set(historical_tombstones) | migration_targets)
    used_ids = set()
    current_entries = {}

    def assign(page, kind, parent_id=None):
        source_id = page["id"]
        identity = section_identity_entry(
            paper, page, kind, parent_id=parent_id)
        page_id = unique_section_match(indexes, identity, used_ids)
        if page_id is None and not has_live_history:
            page_id = INITIAL_SECTION_ID_MIGRATIONS.get(
                (slug, source_id))
        if page_id is None:
            page_id = allocate_section_page_id(
                kind,
                parent_id,
                source_id,
                reserved_ids | used_ids,
            )
        if page_id in used_ids:
            raise ValueError(
                f"Section permalink {slug}:{page_id} assigned more than once")
        if page_id in historical_tombstones:
            raise ValueError(
                f"Live section {slug}:{page_id} collides with a tombstone")
        used_ids.add(page_id)
        page["source_id"] = source_id
        page["id"] = page_id
        identity["source_id"] = source_id
        current_entries[page_id] = identity
        return page_id

    for section in paper["sections"]:
        section_id = assign(section, "section")
        for subsection in section["subsections"]:
            assign(subsection, "subsection", parent_id=section_id)

    # If a prior live identity was deliberately reassigned to a new canonical
    # ID, redirect only on an exact unique label/fingerprint/anchor match.
    current_indexes = section_registry_indexes(current_entries)
    retired_entries = {}
    for old_id, old_info in previous_entries.items():
        if old_id in used_ids:
            continue
        info = dict(old_info)
        info["retired"] = True
        if old_info.get("retired"):
            if info.get("redirect") not in used_ids:
                info.pop("redirect", None)
            retired_entries[old_id] = info
            continue
        target = unique_section_match(
            current_indexes,
            info,
            used_ids=set(),
        )
        if target and target != old_id:
            info["redirect"] = target
        elif info.get("redirect") not in used_ids:
            info.pop("redirect", None)
        retired_entries[old_id] = info

    for page_id, historical in historical_tombstones.items():
        if page_id in used_ids:
            raise ValueError(
                f"Historical section tombstone {slug}:{page_id} is live")
        info = dict(historical)
        info.update({
            "retired": True,
            "labels": [],
            "anchors": [],
            "fingerprint": "",
            "sourceFingerprint": "",
            "parent": None,
            "starred": False,
            "source_id": page_id,
        })
        retired_entries[page_id] = info

    current_entries.update(retired_entries)
    return current_entries, retired_entries


def validate_section_registry(registry):
    """Reject malformed, dangling, or cyclic section redirects."""
    for slug, entries in registry.items():
        for page_id, info in entries.items():
            target = info.get("redirect")
            if not target:
                continue
            seen = {page_id}
            while target:
                if target not in entries:
                    raise ValueError(
                        f"Section redirect {slug}:{page_id} points to "
                        f"missing page {target}")
                if target in seen:
                    raise ValueError(
                        f"Cyclic section redirect involving "
                        f"{slug}:{page_id} and {target}")
                seen.add(target)
                target = entries[target].get("redirect")


# ============================================================
# TAG ASSIGNMENT & REF RESOLUTION
# ============================================================

def assign_tags_and_numbers(
        paper, slug, registry, existing_tags, previous_tags=None,
        previous_fingerprints=None, reserved_tags=None):
    """Walk the parsed paper, assign tags and environment numbers,
    and resolve \\ref{}, \\Cref{}, and \\eqref{} cross-references."""

    previous_tags = previous_tags or {}
    previous_fingerprints = previous_fingerprints or {}
    reserved_tags = set(reserved_tags or ())
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
    for (paper_slug, label), info in REFERENCE_DISPLAY_OVERRIDES.items():
        if paper_slug == slug:
            label_map[label] = {
                "tag": "",
                "number": info["number"],
                "envType": info["envType"],
            }
    theorem_config = paper.get("theorem_config", {})
    counter_values = {}
    all_envs = []  # ordered list of all tagged environments
    used_env_ids = set()

    def counter_root(env_name):
        """Follow amsthm sibling links to the counter that owns the value."""
        seen = set()
        current = env_name
        while current in theorem_config and current not in seen:
            seen.add(current)
            target = theorem_config[current].get("counter", current)
            if target == current:
                break
            current = target
        return current

    def alpha_number(value):
        r"""The positive-integer alphabetic format used by LaTeX's \Alph."""
        letters = []
        while value:
            value, remainder = divmod(value - 1, 26)
            letters.append(chr(ord('A') + remainder))
        return ''.join(reversed(letters))

    def explicit_number_text(value):
        if not value:
            return ""
        return re.sub(
            r'\\ref\{([^}]+)\}',
            lambda match: str(label_map.get(match.group(1), {}).get("number", "?")),
            value,
        ).strip()

    def next_environment_number(block, section_number, subsection_number=None):
        env_name = block["envName"]
        if env_name == "proof":
            return ""
        if block.get("explicitNumber"):
            return explicit_number_text(block["explicitNumber"])

        env_config = theorem_config.get(env_name)
        if env_config and not env_config.get("numbered", True):
            return ""

        if env_config:
            root = counter_root(env_name)
            root_config = theorem_config.get(root, env_config)
            counter_within = root_config.get(
                "counter_within", root_config.get("within"))
            display_within = env_config.get(
                "display_within", env_config.get("within"))
            number_format = env_config.get("format", "arabic")
        else:
            # Sources that receive theorem declarations through an unavailable
            # local style file retain the site's established section counter.
            root = "__default_theorem__"
            counter_within = "section"
            display_within = "section"
            number_format = "arabic"

        if counter_within == "subsection":
            scope = (root, section_number, subsection_number or 0)
        elif counter_within == "section":
            scope = (root, section_number)
        else:
            scope = (root,)
        counter_values[scope] = counter_values.get(scope, 0) + 1
        value = counter_values[scope]

        if number_format == "blank":
            return ""
        shown = alpha_number(value) if number_format == "Alph" else str(value)
        if display_within == "subsection":
            return f"{section_number}.{subsection_number or 0}.{shown}"
        if display_within == "section":
            return f"{section_number}.{shown}"
        return shown

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

        fingerprint = block.get("sourceFingerprint", "")
        tag = (
            CANONICAL_NAMED_TAGS.get((slug, label))
            if label else CANONICAL_AUTOMATIC_TAGS.get((slug, registry_key))
        )
        if tag and tag in existing_tags:
            raise ValueError(
                f"Canonical tag {tag} for {slug}:{label} is already in use")

        # An exact raw-source match is the safest identity across parser and
        # numbering changes, including when a better parser discovers a label
        # on an environment formerly classified as automatic.  When several
        # blocks have byte-equivalent normalized sources, retain their prior
        # tags in source order; no permalink can acquire different content.
        if not tag and fingerprint:
            candidates = [
                candidate
                for candidate in previous_fingerprints.get(fingerprint, [])
                if candidate not in existing_tags
            ]
            if candidates:
                tag = candidates[0]

        # A unique LaTeX label remains a stable identity when its prose is
        # edited.  With duplicate legacy labels, however, only a fingerprint
        # match or an explicit canonical override is safe.
        if not tag and label:
            previous_for_key = previous_tags.get(registry_key, [])
            if not isinstance(previous_for_key, list):
                previous_for_key = [previous_for_key]
            candidates = [
                candidate for candidate in previous_for_key
                if candidate and candidate not in existing_tags
            ]
            if len(candidates) == 1:
                tag = candidates[0]

        if not tag:
            tag = label_to_tag(tag_key, existing_tags | reserved_tags)
        existing_tags.add(tag)
        block["tag"] = tag

        # Preserve the traditional ``#label`` fragment for its first use,
        # but never emit an empty or duplicate HTML id.  Duplicate LaTeX
        # labels are invalid but do occur in a few source files; their tag
        # pages remain the canonical, unique links.
        if label:
            base_id = re.sub(r'[^A-Za-z0-9_.-]+', '-', label.replace(":", "-")).strip("-")
            if base_id:
                html_id = base_id if base_id not in used_env_ids else f"{base_id}-{tag}"
                used_env_ids.add(html_id)
                block["html_id"] = html_id

        label_aliases = block.get("labels") or ([label] if label else [])
        for alias in label_aliases:
            reference_info = {
                "tag": tag,
                "number": number,
                "envType": block["envType"],
            }
            reference_info.update(
                REFERENCE_DISPLAY_OVERRIDES.get((slug, alias), {}))
            label_map[alias] = reference_info

        registry[tag] = {
            "paper": slug,
            "label": registry_key,
            "envType": block["envType"],
            "number": number,
            "fingerprint": fingerprint,
        }
        all_envs.append(block)

    for sec in paper["sections"]:
        sec_n = sec.get("counter_number", sec.get("number") or 0)

        def process_blocks(blocks, _sec_n=sec_n, _sub_n=None):
            for block in blocks:
                if block["type"] != "env":
                    continue
                number = next_environment_number(block, _sec_n, _sub_n)
                block["number"] = number
                label = block.get("label")
                assign_env_tag(block, label, number)
                # Recurse into children
                if block.get("children"):
                    process_blocks(block["children"], _sec_n, _sub_n)

        process_blocks(sec["blocks"])
        for sub in sec["subsections"]:
            sub_n = int(sub.get("counter_number", 0))
            process_blocks(sub["blocks"], sec_n, sub_n)

    # Second pass: resolve \ref{}, \Cref{}, \eqref{} in all content
    def reference_type_text(value):
        """Plain environment type suitable for use inside another link."""
        value = re.sub(
            r'<span class="stacks-ref-tag">.*?</span>', '', str(value),
            flags=re.DOTALL,
        )
        return strip_html(value).strip()

    def display_ref(info, include_type=False):
        tag = info.get("tag")
        env_type = reference_type_text(info["envType"])
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

    def resolve_math_ref_list(labels, include_type=False):
        """Resolve references to TeX-safe, non-linked text inside mathematics."""
        parts = []
        for raw_label in labels.split(","):
            label = raw_label.strip()
            if label not in label_map:
                parts.append("?")
                continue
            info = label_map[label]
            number = info["number"]
            env_type = reference_type_text(info["envType"])
            if include_type:
                parts.append(f"{env_type}~{number}" if number else env_type)
            else:
                parts.append(number or env_type)
        if len(parts) <= 1:
            return "".join(parts)
        return ", ".join(parts)

    def resolve_math_refs(fragment):
        """Resolve source labels in MathJax without inserting HTML links."""
        def substitute(value, inside_text=False):
            def typed_replacer(match):
                label = resolve_math_ref_list(match.group(1), include_type=True)
                if inside_text:
                    return label.replace("~", " ")
                return r'\text{' + label.replace("~", " ") + '}'

            def ref_replacer(match):
                return resolve_math_ref_list(match.group(1), include_type=False)

            def eqref_replacer(match):
                label = match.group(1).strip()
                if label in label_map and label_map[label]["number"]:
                    return f'({label_map[label]["number"]})'
                return '(?)'

            value = re.sub(r'\\Cref\{([^}]+)\}', typed_replacer, value)
            value = re.sub(r'\\cref\{([^}]+)\}', typed_replacer, value)
            value = re.sub(r'\\autoref\{([^}]+)\}', typed_replacer, value)
            value = re.sub(r'\\eqref\{([^}]+)\}', eqref_replacer, value)
            value = re.sub(r'\\ref\{([^}]+)\}', ref_replacer, value)
            return value

        # A typed reference already inside \text{...} should stay in that
        # text command; references elsewhere need their own text wrapper.
        fragment = replace_latex_commands(
            fragment,
            "text",
            lambda argument: r'\text{' + substitute(argument, inside_text=True) + '}',
        )
        return substitute(fragment, inside_text=False)

    def resolve_refs(text, refs_include_type=False):
        text, math_fragments = protect_latex_math_fragments(text)
        math_fragments = [resolve_math_refs(fragment) for fragment in math_fragments]

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
        return restore_latex_math_fragments(text, math_fragments)

    def resolve_environment_types(blocks):
        for block in blocks:
            if "envType" in block:
                block["envType"] = resolve_refs(block["envType"], refs_include_type=True)
                aliases = block.get("labels") or (
                    [block["label"]] if block.get("label") else [])
                for alias in aliases:
                    if (
                        alias in label_map
                        and (slug, alias) not in REFERENCE_DISPLAY_OVERRIDES
                    ):
                        label_map[alias]["envType"] = block["envType"]
            if block.get("envNote"):
                block["envNote"] = resolve_refs(block["envNote"])
            if block.get("children"):
                resolve_environment_types(block["children"])

    def resolve_block_contents(blocks):
        for block in blocks:
            if "content" in block:
                block["content"] = resolve_refs(block["content"])
            if block.get("children"):
                resolve_block_contents(block["children"])

    for sec in paper["sections"]:
        sec["title"] = resolve_refs(tex_to_html(sec["title"]))
        for sub in sec["subsections"]:
            sub["title"] = resolve_refs(tex_to_html(sub["title"]))
        resolve_environment_types(sec["blocks"])
        for sub in sec["subsections"]:
            resolve_environment_types(sub["blocks"])
    for sec in paper["sections"]:
        resolve_block_contents(sec["blocks"])
        for sub in sec["subsections"]:
            resolve_block_contents(sub["blocks"])

    # Update registry with resolved envType names
    for env in all_envs:
        tag = env.get("tag")
        if tag and tag in registry:
            registry[tag]["envType"] = env["envType"]

    return all_envs, label_map


def resolve_citations(paper, citations, citation_targets=None):
    """Resolve \\cite{key} references in all blocks."""
    citation_targets = citation_targets or {}

    def format_cite_option(opt):
        opt = opt.replace("~", "&nbsp;")
        opt = opt.replace(r"\S", "&sect;")
        return opt

    def cite_replacer(m):
        # Optional arguments like \cite[Section 2]{key} or
        # natbib's \citep[see][Section 2]{key}.
        opts = [opt for opt in (m.group(1), m.group(2)) if opt]
        keys_str = m.group(3)
        # Handle multiple comma-separated keys like \cite{key1, key2}
        keys = [k.strip() for k in keys_str.split(',')]
        labels = []
        for key in keys:
            global_id = citation_targets.get(key)
            if key in citations:
                label = html_mod.escape(str(citations[key]))
            else:
                label = html_mod.escape(key)
            if global_id:
                label = (
                    f'<a class="stacks-cite" '
                    f'href="__SITE_ROOT__bibliography.html#bib-{html_attr(global_id)}">'
                    f'{label}</a>'
                )
            labels.append(label)
        label_text = ', '.join(labels)
        if opts:
            return f'[{label_text}, {", ".join(format_cite_option(opt) for opt in opts)}]'
        return f'[{label_text}]'

    def process_content(text):
        return re.sub(
            r'\\cite(?:p|t|alp|alt)?\*?(?:\[([^\]]*)\])?(?:\[([^\]]*)\])?\{([^}]+)\}',
            cite_replacer,
            text,
        )

    def process_blocks(blocks):
        for block in blocks:
            if "content" in block:
                block["content"] = process_content(block["content"])
            if "envType" in block:
                block["envType"] = process_content(block["envType"])
            if block.get("envNote"):
                block["envNote"] = process_content(block["envNote"])
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
            macro_block = macro_js
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
  <link rel="stylesheet" href="{prefix}stacks.css?v=stacks-20260519-qed">
  <script src="{prefix}../../comments-config.js?v={COMMENTS_ASSET_VERSION}" defer></script>
  <script src="{prefix}../../comments.js?v={COMMENTS_ASSET_VERSION}" defer></script>
  <script>
    window.MathJax = {{
      loader: {{ load: ['[tex]/bboldx'] }},
      tex: {{
        inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
        displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
        packages: {{ '[+]': ['bboldx'] }},
        macros: {{
{macro_block}
        }}
      }},
      svg: {{ fontCache: 'global' }}
    }};
  </script>
  <script src="https://cdn.jsdelivr.net/npm/mathjax@4/tex-svg.js" async></script>
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


def section_page_label(section, include_title=True):
    """Human-readable label for numbered and starred section pages."""
    title = strip_html(section.get("title", ""))
    number = section.get("number", "")
    if number:
        return f"Section {number}: {title}" if include_title else f"Section {number}"
    return title or "Unnumbered section"


def subsection_page_label(subsection, include_title=True):
    """Human-readable label for numbered and starred subsection pages."""
    title = strip_html(subsection.get("title", ""))
    number = subsection.get("number", "")
    if number:
        return f"{number}. {title}" if include_title else number
    return title or "Unnumbered subsection"


def page_navigation_map(paper):
    """Return previous/next page data for section and subsection pages."""
    pages = []
    for sec in paper["sections"]:
        pages.append({
            "id": sec["id"],
            "href": f'section/{sec["id"]}.html',
            "label": section_page_label(sec),
        })
        for sub in sec["subsections"]:
            pages.append({
                "id": sub["id"],
                "href": f'section/{sub["id"]}.html',
                "label": subsection_page_label(sub),
            })

    nav = {}
    for idx, page in enumerate(pages):
        nav[page["id"]] = {
            "prev": pages[idx - 1] if idx > 0 else None,
            "next": pages[idx + 1] if idx + 1 < len(pages) else None,
        }
    return nav


def breadcrumb_html(items, depth=0, page_nav=None):
    prefix = "../" * depth
    parts = [f'<a href="{prefix}index.html">Table of contents</a>']
    for label, href in items:
        if href:
            parts.append(f'<a href="{prefix}{href}">{html_mod.escape(strip_html(label))}</a>')
        else:
            parts.append(f'<span>{label}</span>')
    breadcrumb = ' / '.join(parts)
    if not page_nav:
        return '<div class="stacks-breadcrumb">' + breadcrumb + '</div>\n'

    nav_links = []
    if page_nav.get("prev"):
        prev = page_nav["prev"]
        nav_links.append(
            f'<a class="stacks-page-arrow stacks-page-arrow-prev" '
            f'href="{prefix}{prev["href"]}" '
            f'aria-label="Previous: {html_attr(prev["label"])}" '
            f'title="Previous: {html_attr(prev["label"])}">&larr;</a>')
    if page_nav.get("next"):
        next_page = page_nav["next"]
        nav_links.append(
            f'<a class="stacks-page-arrow stacks-page-arrow-next" '
            f'href="{prefix}{next_page["href"]}" '
            f'aria-label="Next: {html_attr(next_page["label"])}" '
            f'title="Next: {html_attr(next_page["label"])}">&rarr;</a>')

    nav_html = (
        '<nav class="stacks-page-nav" aria-label="Page navigation">'
        + ''.join(nav_links)
        + '</nav>'
    )
    return (
        '<div class="stacks-breadcrumb stacks-breadcrumb-with-nav">'
        f'<div class="stacks-breadcrumb-path">{breadcrumb}</div>{nav_html}</div>\n'
    )


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


def site_root_prefix(depth=0):
    """Relative prefix from a generated paper page back to the site root."""
    return "../" * depth + "../../"


def resolve_site_root_placeholders(text, depth=0):
    return text.replace("__SITE_ROOT__", site_root_prefix(depth))


def append_qed_marker(body_html):
    """Place the proof-ending square on the proof's final text line."""
    marker = '<span class="stacks-qed" aria-hidden="true"></span>'
    last_paragraph_end = body_html.rfind("</p>")
    if last_paragraph_end != -1:
        return body_html[:last_paragraph_end] + marker + body_html[last_paragraph_end:]
    return body_html + marker


def render_block(block, depth=0):
    prefix = "../" * depth
    if block["type"] == "para":
        content = resolve_site_root_placeholders(block["content"], depth)
        stripped = content.strip()
        if stripped.startswith('<div class="interaction-') or stripped == '</div>':
            return stripped + '\n'
        return wrap_content_html(content, "stacks-para")
    elif block["type"] == "code":
        return block["content"] + '\n'
    elif block["type"] == "env":
        tag = block.get("tag", "")
        env_type = block["envType"]
        number = block.get("number", "")
        env_name = block.get("envName", "")
        env_note = block.get("envNote")

        # CSS class
        css_class = ENV_CSS.get(env_name)
        if not css_class:
            plain_type = strip_html(env_type).lower()
            if "theorem" in plain_type:
                css_class = "stacks-theorem"
            elif any(word in plain_type for word in (
                "lemma", "proposition", "corollary",
            )):
                css_class = "stacks-lemma"
            elif "definition" in plain_type:
                css_class = "stacks-definition"
            elif any(word in plain_type for word in ("remark", "warning")):
                css_class = "stacks-commentary"
            else:
                css_class = "stacks-env"

        tag_link = f' <a href="{prefix}tag/{tag}.html" class="stacks-tag-link">({tag})</a>' if tag else ''

        # Head text
        if env_name == "proof":
            # amsthm's \@addpunct does not add a full stop when a custom
            # proof heading already ends in punctuation (notably ``:``).
            plain_env_type = strip_html(env_type).rstrip()
            label_text = (
                env_type
                if plain_env_type.endswith((".", ",", ";", ":", "?", "!"))
                else f"{env_type}."
            )
            head_html = f'<em>{label_text}</em>{tag_link}'
        else:
            label_text = f"{env_type}" + (f"&nbsp;{number}" if number else "")
            if env_note:
                label_text += f" ({env_note})"
            head_html = f'<strong>{label_text}.</strong>{tag_link}'
        head_html = resolve_site_root_placeholders(head_html, depth)

        eid = block.get("html_id", "")
        id_attr = f' id="{html_attr(eid)}"' if eid else ''

        # Render body: either direct content or recursive children
        if block.get("children"):
            inner_html = ""
            for child in block["children"]:
                inner_html += render_block(child, depth)
            body_html = inner_html
        else:
            content = resolve_site_root_placeholders(block["content"], depth)
            body_html = wrap_content_html(content)
        if env_name == "proof":
            body_html = append_qed_marker(body_html)

        return f"""<div class="{css_class}"{id_attr}>
  <div class="stacks-env-head">{head_html}</div>
  <div class="stacks-env-body">{body_html}</div>
</div>
"""
    return ""


def find_matching_html_list_end(content, start):
    """Find the end of a top-level HTML list, including nested lists."""
    list_re = re.compile(r'</?(ol|ul|dl)\b[^>]*>')
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
        r'<(?:ol|ul|dl)\b'
        r'|<h[2-4]\b[^>]*class="[^"]*stacks-subsections-heading[^"]*"'
        r'|<(div|pre)\b[^>]*class="[^"]*'
        r'(?:stacks-rendered-latex|stacks-tikzcd|stacks-table-wrap|stacks-caption|stacks-latex-fallback|stacks-figure|stacks-figure-file|stacks-figure-missing)'
        r'[^"]*"'
    )
    heading_re = re.compile(
        r'<(?P<tag>h[2-4])\b[^>]*class="[^"]*stacks-subsections-heading[^"]*"[\s\S]*?</(?P=tag)>'
    )
    div_pre_re = re.compile(
        r'<(?P<tag>div|pre)\b[^>]*class="[^"]*'
        r'(?:stacks-rendered-latex|stacks-tikzcd|stacks-table-wrap|stacks-caption|stacks-latex-fallback|stacks-figure|stacks-figure-file|stacks-figure-missing)'
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

        if start.group(0).startswith(('<ol', '<ul', '<dl')):
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

    def wrap_text_piece(piece):
        # tex_to_html marks source paragraph breaks with ``</p><p>`` before
        # the surrounding block context is known.  Normalize both complete
        # and boundary-only markers here so lists and theorem bodies receive
        # balanced paragraph elements.
        piece = piece.strip()
        if not piece:
            return []
        paragraphs = re.split(
            r'</p>\s*<p(?:\s+class="[^"]*")?>', piece)
        wrapped = []
        for paragraph in paragraphs:
            paragraph = re.sub(
                r'^\s*<p(?:\s+class="[^"]*")?>', '', paragraph)
            paragraph = re.sub(r'</p>\s*$', '', paragraph).strip()
            if paragraph:
                wrapped.append(f'<p{class_attr}>{paragraph}</p>\n')
        return wrapped

    html = []
    for kind, piece in pieces:
        if not piece or not piece.strip():
            continue
        if kind == "block":
            html.append(piece.strip() + '\n')
        else:
            html.extend(wrap_text_piece(piece))
    return ''.join(html)


def comment_form(page_label, return_url, paper_title):
    subject = html_attr(f"Comment on {paper_title} — {page_label}")
    next_url = html_mod.escape(return_url, quote=True)
    page_id = html_attr(return_url)
    page_title = html_attr(f"{paper_title} — {page_label}")
    page_label_attr = html_attr(page_label)
    paper_title_attr = html_attr(paper_title)
    return f"""
<hr>
<div class="stacks-comments"
     data-comment-page-id="{page_id}"
     data-comment-page-url="{next_url}"
     data-comment-page-title="{page_title}"
     data-comment-page-label="{page_label_attr}"
     data-comment-paper-title="{paper_title_attr}">
  <h3>Comments</h3>
  <p class="stacks-comments-empty">No comments yet.</p>
  <div class="stacks-comment-form">
    <h4>Leave a comment</h4>
    <p>Comments are reviewed before appearing.</p>
    <form action="https://formsubmit.co/{FORMSUBMIT_EMAIL}" method="POST">
      <input type="hidden" name="_subject" value="{subject}">
      <input type="hidden" name="_next" value="{next_url}">
      <input type="hidden" name="_template" value="table">
      <input type="hidden" name="_captcha" value="true">
      <input type="hidden" name="page" value="{next_url}">
      <input type="hidden" name="paper" value="{paper_title_attr}">
      <input type="hidden" name="location" value="{page_label_attr}">
      <label for="name">Name:</label>
      <input type="text" id="name" name="name" required>
      <label for="email">Email:</label>
      <input type="email" id="email" name="email" required>
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


def ensure_project_stylesheet(out_dir):
    """Keep every generated paper on the shared project-page stylesheet."""
    src = PROJECT_STYLESHEET_SOURCE
    dst = os.path.join(out_dir, "stacks.css")
    if not os.path.exists(src):
        print(f"  Warning: missing shared stylesheet {src}")
        return
    if os.path.abspath(src) == os.path.abspath(dst):
        return
    if os.path.exists(dst):
        with open(src, "rb") as f:
            src_bytes = f.read()
        with open(dst, "rb") as f:
            dst_bytes = f.read()
        if src_bytes == dst_bytes:
            return
    shutil.copyfile(src, dst)


def is_live_tag_entry(info):
    """Whether a registry entry names a currently rendered environment."""
    return not info.get("retired") and not info.get("redirect")


def previous_tag_indexes(entries):
    """Index prior live tags by label and by exact source fingerprint."""
    by_label = {}
    by_fingerprint = {}
    for tag, info in entries.items():
        if not is_live_tag_entry(info):
            continue
        label = info.get("label", "")
        if label:
            by_label.setdefault(label, []).append(tag)
        fingerprint = info.get("fingerprint")
        if fingerprint:
            # The raw payload includes any source-level ``\\label`` command,
            # so the fingerprint itself is a complete conservative identity.
            # Do not key it by the registry's old label classification: parser
            # improvements may discover a label on an environment that was
            # historically stored as an auto tag, without changing its source.
            by_fingerprint.setdefault(fingerprint, []).append(tag)
    return by_label, by_fingerprint


def preserve_retired_tags(slug, previous_entries, registry, all_envs):
    """Keep superseded tag IDs as redirects or non-reassignable tombstones.

    A removed prior tag is redirected only when a unique live environment has
    the same LaTeX label (or an explicit historical redirect says so).  Auto
    tags and vanished labels become tombstones; they are never rebound to the
    environment that happens to occupy their old ordinal.
    """
    live_tags = {env["tag"] for env in all_envs}
    live_by_label = {}
    live_by_identity = {}
    for env in all_envs:
        label = env.get("label")
        if label:
            live_by_label.setdefault(label, []).append(env["tag"])
            fingerprint = env.get("sourceFingerprint")
            if fingerprint:
                live_by_identity.setdefault((label, fingerprint), []).append(
                    env["tag"])

    retired = {}
    for old_tag, old_info in previous_entries.items():
        if old_tag in live_tags:
            continue
        info = dict(old_info)
        info["paper"] = slug
        info["retired"] = True

        target = None
        label = info.get("label", "")
        fingerprint = info.get("fingerprint")
        if label and not label.startswith("auto:"):
            exact_targets = live_by_identity.get((label, fingerprint), []) \
                if fingerprint else []
            if len(exact_targets) == 1:
                target = exact_targets[0]
            else:
                current_targets = live_by_label.get(label, [])
                if len(current_targets) == 1:
                    target = current_targets[0]
        if info.get("redirect") in live_tags:
            target = info["redirect"]
        if target and target != old_tag:
            info["redirect"] = target
        else:
            info.pop("redirect", None)
        retired[old_tag] = info

    for (redirect_slug, old_tag), target in HISTORICAL_TAG_REDIRECTS.items():
        if redirect_slug != slug or old_tag in live_tags:
            continue
        if target not in live_tags:
            raise ValueError(
                f"Historical redirect {slug}:{old_tag} has no live target {target}")
        retired[old_tag] = {
            "paper": slug,
            "label": previous_entries.get(old_tag, {}).get("label", ""),
            "retired": True,
            "redirect": target,
        }

    registry.update(retired)
    return retired


def validate_tag_registry(registry):
    """Reject dangling/cyclic redirects and malformed live fingerprints."""
    for tag, info in registry.items():
        target = info.get("redirect")
        if not target:
            continue
        seen = {tag}
        while target:
            if target not in registry:
                raise ValueError(f"Tag redirect {tag} points to missing tag {target}")
            if target in seen:
                raise ValueError(f"Cyclic tag redirect involving {tag} and {target}")
            seen.add(target)
            target = registry[target].get("redirect")


def retired_tag_html(tag, info, paper_title, base_url):
    """Render a static redirect or a non-reassignable retired-tag notice."""
    escaped_title = html_mod.escape(paper_title)
    target = info.get("redirect")
    if target:
        target_file = f"{target}.html"
        canonical = f"{base_url}/tag/{target_file}"
        return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="refresh" content="0; url={html_attr(target_file)}">
  <link rel="canonical" href="{html_attr(canonical)}">
  <title>Tag {html_mod.escape(tag)} moved — {escaped_title}</title>
  <link rel="stylesheet" href="../stacks.css">
</head>
<body><main class="stacks-main">
  <h1 class="stacks-section-title">Tag {html_mod.escape(tag)} has moved</h1>
  <p>This permanent link now refers to
  <a href="{html_attr(target_file)}">Tag {html_mod.escape(target)}</a>.</p>
</main></body>
</html>"""

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>Retired tag {html_mod.escape(tag)} — {escaped_title}</title>
  <link rel="stylesheet" href="../stacks.css">
</head>
<body><main class="stacks-main">
  <h1 class="stacks-section-title">Retired tag {html_mod.escape(tag)}</h1>
  <p>This tag no longer names material in the published paper. It has been
  reserved and will not be reassigned to different content.</p>
  <p><a href="../index.html">Return to the table of contents</a>.</p>
</main></body>
</html>"""


def retired_section_html(page_id, info, paper_title, base_url):
    """Render a static redirect or a non-reassignable retired-page notice."""
    escaped_title = html_mod.escape(paper_title)
    target = info.get("redirect")
    if target:
        target_file = f"{target}.html"
        canonical = f"{base_url}/section/{target_file}"
        return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="refresh" content="0; url={html_attr(target_file)}">
  <link rel="canonical" href="{html_attr(canonical)}">
  <title>Page moved — {escaped_title}</title>
  <link rel="stylesheet" href="../stacks.css">
</head>
<body><main class="stacks-main">
  <h1 class="stacks-section-title">This page has moved</h1>
  <p>This permanent link now refers to
  <a href="{html_attr(target_file)}">{html_mod.escape(target)}</a>.</p>
</main></body>
</html>"""

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>Retired page {html_mod.escape(page_id)} — {escaped_title}</title>
  <link rel="stylesheet" href="../stacks.css">
</head>
<body><main class="stacks-main">
  <h1 class="stacks-section-title">Retired section page</h1>
  <p>This URL no longer names material in the published paper and has been
  reserved so it cannot silently acquire different content.</p>
  <p><a href="../index.html">Return to the table of contents</a>.</p>
</main></body>
</html>"""


# ============================================================
# COMPILE ONE PAPER
# ============================================================

def compile_paper(tex_path, global_bibliography=None):
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
    artwork = meta.get("artwork", "")
    artwork_alt_meta = meta.get("artwork_alt", "")
    base_url = f"https://anandpatel.github.io/papers/{slug}"

    # Read .tex source
    tex_source = read_latex_source(tex_path)
    configure_tex_renderer(tex_source, out_dir)

    # Extract MathJax macros from preamble
    macros = parse_preamble_macros(tex_source)
    print(f"  Extracted {len(macros)} MathJax macros from source")

    # Parse citations and bibliography
    bibliography = parse_bibliography(meta, out_dir, tex_source)
    citations = bibliography["citations"]
    bibliography_entries = bibliography["entries"]
    has_bibliography = bool(bibliography_entries)
    print(f"  Loaded {len(citations)} citation entries")
    print(f"  Loaded {len(bibliography_entries)} bibliography entries")

    # Parse document
    paper = parse_tex(tex_source)
    artwork_alt = artwork_alt_meta or f"Pencil sketch artwork for {paper['title']}"
    print(f"Parsed: {paper['title']} by {paper['author']}")
    print(f"  {len(paper['sections'])} sections")

    # Assign sticky page IDs before tags and navigation capture section links.
    section_registry = load_section_registry()
    previous_section_entries = {
        page_id: dict(info)
        for page_id, info in section_registry.get(slug, {}).items()
    }
    paper_section_entries, retired_sections = assign_section_page_ids(
        paper, slug, previous_section_entries)
    section_registry[slug] = paper_section_entries
    validate_section_registry(section_registry)
    save_section_registry(section_registry)

    # Assign tags
    registry = load_registry()
    previous_entries = {
        tag: dict(info)
        for tag, info in registry.items()
        if info.get("paper") == slug
    }
    previous_tags, previous_fingerprints = previous_tag_indexes(
        previous_entries)
    # Remove old tags for this paper (allows clean rebuild)
    registry = {k: v for k, v in registry.items() if v.get("paper") != slug}
    existing_tags = set(registry.keys())
    reserved_tags = set(previous_entries)
    reserved_tags.update(
        old_tag for (redirect_slug, old_tag) in HISTORICAL_TAG_REDIRECTS
        if redirect_slug == slug)
    reserved_tags.update(
        tag for (canonical_slug, _label), tag in CANONICAL_NAMED_TAGS.items()
        if canonical_slug == slug)

    all_envs, label_map = assign_tags_and_numbers(
        paper, slug, registry, existing_tags, previous_tags,
        previous_fingerprints, reserved_tags)
    page_nav = page_navigation_map(paper)

    # Resolve citations (after ref resolution, so citations in env content are handled)
    citation_targets = {}
    if global_bibliography:
        all_targets = global_bibliography.get("citation_targets", {})
        citation_targets = {
            key: global_id
            for (target_slug, key), global_id in all_targets.items()
            if target_slug == slug
        }
    resolve_citations(paper, citations, citation_targets)

    retired_tags = preserve_retired_tags(
        slug, previous_entries, registry, all_envs)
    validate_tag_registry(registry)
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
    ensure_project_stylesheet(out_dir)

    # --- 1. Table of Contents ---
    toc = head("Table of Contents", paper["title"], macros=macros)
    toc += nav_bar(paper["author"], paper["title"])
    toc += '<main class="stacks-main">\n'
    if artwork:
        toc += '<div class="stacks-paper-hero">\n'
        toc += '<div class="stacks-paper-hero-text">\n'
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
    if artwork:
        toc += '</div>\n'
        toc += (
            '<img class="stacks-paper-artwork" '
            f'src="{html_mod.escape(artwork, quote=True)}" '
            f'alt="{html_attr(artwork_alt)}" loading="lazy">\n'
        )
        toc += '</div>\n'
    toc += '<hr>\n<h2 class="stacks-toc-heading">Table of Contents</h2>\n'
    toc += '<ul class="stacks-toc">\n'

    for sec in paper["sections"]:
        sec_title_plain = html_mod.escape(strip_html(sec["title"]))
        sec_toc_label = (
            f'Section {sec["number"]}: {sec_title_plain}'
            if sec.get("number") else sec_title_plain
        )
        toc += f'  <li><a href="section/{sec["id"]}.html">{sec_toc_label}</a>\n'
        if sec["subsections"]:
            toc += '    <ul>\n'
            for sub in sec["subsections"]:
                sub_title_plain = html_mod.escape(strip_html(sub["title"]))
                sub_toc_label = (
                    f'{sub["number"]}. {sub_title_plain}'
                    if sub.get("number") else sub_title_plain
                )
                toc += f'      <li><a href="section/{sub["id"]}.html">{sub_toc_label}</a></li>\n'
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
        env_type = resolve_site_root_placeholders(env["envType"], depth=0)
        toc += f'<tr><td><a href="tag/{env["tag"]}.html">{env["tag"]}</a></td>'
        toc += f'<td>{env_type}</td><td>{env.get("number","")}</td></tr>\n'
    toc += '</table>\n</main>\n'
    toc += footer_html(arxiv_id, has_bibliography=has_bibliography)

    write_html(os.path.join(out_dir, "index.html"), toc)
    print("Generated: index.html")

    # --- 1b. Bibliography page ---
    bibliography_path = os.path.join(out_dir, "bibliography.html")
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
        write_html(bibliography_path, bib_html)
        print("Generated: bibliography.html")
    elif os.path.isfile(bibliography_path):
        # A previous source bundle may have supplied a .bbl even when the
        # current bundle does not. Leaving that generated page in place
        # publishes stale entries and stale LaTeX indefinitely, despite the
        # rebuilt index and footers no longer linking it.
        os.remove(bibliography_path)
        print("Removed stale: bibliography.html")

    # --- 2. Section pages ---
    for sec in paper["sections"]:
        sec_label = section_page_label(sec)
        sec_html = head(sec_label, paper["title"], depth=1, macros=macros)
        sec_html += nav_bar(paper["author"], paper["title"], depth=1)
        sec_html += breadcrumb_html(
            [(sec_label, None)],
            depth=1,
            page_nav=page_nav.get(sec["id"]))
        sec_html += '<main class="stacks-main">\n'
        sec_heading = (
            f'Section {sec["number"]}. {sec["title"]}'
            if sec.get("number") else sec["title"]
        )
        sec_html += f'<h1 class="stacks-section-title">{sec_heading}</h1>\n'

        for block in sec["blocks"]:
            sec_html += render_block(block, depth=1)

        if sec["subsections"]:
            sec_html += '<h2 class="stacks-subsections-heading">Subsections</h2>\n<ul>\n'
            for sub in sec["subsections"]:
                sub_title_plain = html_mod.escape(strip_html(sub["title"]))
                sub_list_label = (
                    f'{sub["number"]}. {sub_title_plain}'
                    if sub.get("number") else sub_title_plain
                )
                sec_html += f'  <li><a href="{sub["id"]}.html">{sub_list_label}</a></li>\n'
            sec_html += '</ul>\n'

        sec_html += comment_form(
            sec_label,
            f'{base_url}/section/{sec["id"]}.html',
            paper["title"])
        sec_html += '</main>\n' + footer_html(
            arxiv_id, depth=1, has_bibliography=has_bibliography)

        write_html(os.path.join(out_dir, "section", f'{sec["id"]}.html'), sec_html)
        print(f"Generated: section/{sec['id']}.html")

        for sub in sec["subsections"]:
            sub_label = subsection_page_label(sub)
            sub_html = head(sub_label, paper["title"], depth=1, macros=macros)
            sub_html += nav_bar(paper["author"], paper["title"], depth=1)
            sub_html += breadcrumb_html([
                (sec_label, f'section/{sec["id"]}.html'),
                (sub_label, None),
            ], depth=1, page_nav=page_nav.get(sub["id"]))
            sub_html += '<main class="stacks-main">\n'
            sub_heading = (
                f'{sub["number"]}. {sub["title"]}'
                if sub.get("number") else sub["title"]
            )
            sub_html += f'<h1 class="stacks-section-title">{sub_heading}</h1>\n'

            for block in sub["blocks"]:
                sub_html += render_block(block, depth=1)

            sub_html += comment_form(
                sub_label,
                f'{base_url}/section/{sub["id"]}.html',
                paper["title"])
            sub_html += '</main>\n' + footer_html(
                arxiv_id, depth=1, has_bibliography=has_bibliography)

            write_html(os.path.join(out_dir, "section", f'{sub["id"]}.html'), sub_html)
            print(f"Generated: section/{sub['id']}.html")

    for page_id, info in sorted(retired_sections.items()):
        write_html(
            os.path.join(out_dir, "section", f"{page_id}.html"),
            retired_section_html(
                page_id, info, paper["title"], base_url),
        )
        destination = (
            f" -> {info['redirect']}" if info.get("redirect") else "")
        print(
            f"Generated: section/{page_id}.html "
            f"(retired{destination})")

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
                section_page_label(parent_sec),
                f'section/{parent_sec["id"]}.html'))
        if parent_sub:
            bc_items.append((
                subsection_page_label(parent_sub),
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

    for tag, info in sorted(retired_tags.items()):
        write_html(
            os.path.join(out_dir, "tag", f"{tag}.html"),
            retired_tag_html(tag, info, paper["title"], base_url),
        )
        destination = f" -> {info['redirect']}" if info.get("redirect") else ""
        print(f"Generated: tag/{tag}.html (retired{destination})")

    print(f"\nDone! {len(all_envs)} live tag pages, "
          f"{len(retired_tags)} retired tag pages, "
          f"{sum(1 + len(s['subsections']) for s in paper['sections'])} "
          f"live section pages, {len(retired_sections)} retired section pages, "
          f"1 index page.")


# ============================================================
# MAIN
# ============================================================

def manifest_tex_paths():
    main_tex = os.path.join(SITE_ROOT, "main.tex")
    if not os.path.exists(main_tex):
        return []
    tex_paths = []
    with open(main_tex) as f:
        for line in f:
            line = line.strip()
            if line.startswith('#') or not line:
                continue
            tex_path = os.path.join(SITE_ROOT, line)
            if os.path.exists(tex_path):
                tex_paths.append(tex_path)
    return tex_paths


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 compile.py papers/<slug>/source.tex")
        print("       python3 compile.py --all")
        sys.exit(1)

    if sys.argv[1] == "--all":
        # Compile all papers listed in main.tex
        tex_paths = manifest_tex_paths()
        if not tex_paths:
            print("Error: main.tex not found")
            sys.exit(1)
        global_bibliography = collect_global_bibliography(tex_paths)
        write_global_bibliography(global_bibliography)
        for tex_path in tex_paths:
            rel_path = os.path.relpath(tex_path, SITE_ROOT)
            print(f"\n{'='*60}")
            print(f"Compiling: {rel_path}")
            print(f"{'='*60}")
            compile_paper(tex_path, global_bibliography)
    else:
        tex_path = sys.argv[1]
        if not os.path.isabs(tex_path):
            tex_path = os.path.join(SITE_ROOT, tex_path)
        tex_paths = manifest_tex_paths()
        if tex_path not in tex_paths:
            tex_paths.append(tex_path)
        global_bibliography = collect_global_bibliography(tex_paths)
        write_global_bibliography(global_bibliography)
        compile_paper(tex_path, global_bibliography)


if __name__ == "__main__":
    main()
