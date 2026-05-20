PYTHON ?= python3
PAPER ?= papers/hodge-bundle/source.tex

.PHONY: all paper watch watch-all hodge bibliography

all:
	$(PYTHON) compile.py --all

paper:
	$(PYTHON) compile.py $(PAPER)

watch:
	$(PYTHON) watch.py

watch-all:
	$(PYTHON) watch.py --all

hodge:
	$(PYTHON) compile.py papers/hodge-bundle/source.tex

bibliography:
	$(PYTHON) -c "import compile; tex_paths = compile.manifest_tex_paths(); global_bib = compile.collect_global_bibliography(tex_paths); compile.write_global_bibliography(global_bib)"
