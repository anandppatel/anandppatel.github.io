#!/usr/bin/env python3
"""Watch paper sources and rebuild their Stacks pages when they change.

Usage:
    python3 watch.py
    python3 watch.py --all
    python3 watch.py papers/hodge-bundle/source.tex

By default, a changed paper source rebuilds only that paper and refreshes the
global bibliography. With --all, any changed source triggers a full rebuild.
"""

import argparse
import subprocess
import sys
import time
from pathlib import Path


ROOT = Path(__file__).resolve().parent
MAIN_TEX = ROOT / "main.tex"


def manifest_sources():
    if not MAIN_TEX.exists():
        return []
    sources = []
    for line in MAIN_TEX.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        path = (ROOT / line).resolve()
        if path.exists():
            sources.append(path)
    return sources


def file_signature(path):
    try:
        stat = path.stat()
    except FileNotFoundError:
        return None
    return (stat.st_mtime_ns, stat.st_size)


def run_compile(source=None, rebuild_all=False):
    if rebuild_all:
        cmd = [sys.executable, "compile.py", "--all"]
        label = "all papers"
    else:
        cmd = [sys.executable, "compile.py", str(source.relative_to(ROOT))]
        label = str(source.relative_to(ROOT))

    print(f"\n[{time.strftime('%H:%M:%S')}] Rebuilding {label}")
    result = subprocess.run(cmd, cwd=ROOT)
    if result.returncode:
        print(f"[{time.strftime('%H:%M:%S')}] Build failed with exit code {result.returncode}")
    else:
        print(f"[{time.strftime('%H:%M:%S')}] Build finished")
    return result.returncode


def parse_args():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "sources",
        nargs="*",
        help="Specific source.tex files to watch. Defaults to all papers in main.tex.",
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Rebuild all papers whenever any watched source changes.",
    )
    parser.add_argument(
        "--interval",
        type=float,
        default=1.0,
        help="Polling interval in seconds. Default: 1.0",
    )
    parser.add_argument(
        "--build-now",
        action="store_true",
        help="Run one build immediately before watching.",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    if args.sources:
        sources = [(ROOT / source).resolve() for source in args.sources]
    else:
        sources = manifest_sources()

    sources = [source for source in sources if source.exists()]
    if not sources:
        print("No source files found to watch.")
        sys.exit(1)

    if args.build_now:
        if args.all:
            run_compile(rebuild_all=True)
        else:
            for source in sources:
                run_compile(source)

    signatures = {source: file_signature(source) for source in sources}
    watched = ", ".join(str(source.relative_to(ROOT)) for source in sources)
    print(f"Watching {len(sources)} source file(s): {watched}")
    print("Press Ctrl-C to stop.")

    try:
        while True:
            time.sleep(args.interval)
            for source in sources:
                current = file_signature(source)
                if current == signatures.get(source):
                    continue
                signatures[source] = current
                if current is None:
                    print(f"[{time.strftime('%H:%M:%S')}] Missing: {source.relative_to(ROOT)}")
                    continue
                if args.all:
                    run_compile(rebuild_all=True)
                    signatures = {path: file_signature(path) for path in sources}
                    break
                run_compile(source)
    except KeyboardInterrupt:
        print("\nStopped watching.")


if __name__ == "__main__":
    main()
