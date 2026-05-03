# TikZ Sketch Converter

Browser-only React app for drawing geometry, freehand sketches, labels, and sampled math functions, then exporting the result as TikZ code.

## Features

- SVG paint-style canvas with grid, axes, snapping, selection, moving, undo, and redo.
- Tools for freehand paths, lines, rectangles, ellipses, text labels, erasing, and math functions.
- Function sampler for expressions such as `sin(x)`, `cos(2*x)`, `0.2*x^2 - 2`, `exp(-x^2)`.
- Insertable diagram blocks for circuits, Gantt schedules, ML pipelines, and dense DL networks.
- Searchable TikZ/PGF library gallery with presets for `arrows.meta`, `positioning`, `fit`, `calc`, `intersections`, `angles`, `quotes`, `matrix`, `graphs`, `trees`, `automata`, `mindmap`, `petri`, `er`, `shapes.*`, `decorations.*`, `patterns`, `fadings`, `shadows`, `backgrounds`, `spy`, `3d`, `circuits.logic.IEC`, `circuits.ee.IEC`, `circuitikz`, `pgfplots`, `pgfgantt`, and `tikz-cd`.
- Custom TikZ snippet blocks for any package or library that is not represented by a built-in preset yet.
- Live TikZ generation with color definitions, optional grid export, copy, and `.tex` download.
- Basic freehand recognition to convert selected scribbles into lines, rectangles, or ellipses.

The exported code includes preamble suggestions for each inserted block, including `\usepackage`, `\usetikzlibrary`, `\usepgfplotslibrary`, and compatibility hints where needed.

Circuit blocks emit `circuitikz`-style component commands, so LaTeX documents that use them include:

```tex
\usepackage[american]{circuitikz}
```

## Run

```bash
npm install
npm run dev
```

The app runs locally with Vite. In this workspace it is currently available at:

```text
http://127.0.0.1:5173
```

## Checks

```bash
npm run lint
npm run build
```
