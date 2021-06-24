#!/bin/bash

python3 tokeny.py
for f in tokeny_*.svg; do
  # NOTE: requires inkscape >= 1.0
  ~/bin/inkscape "$f" --export-area-page --batch-process --export-type=pdf;
done;
pdftk tokeny_*.pdf output tokeny.pdf
