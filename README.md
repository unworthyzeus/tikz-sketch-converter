# TikZ Figure Workbench

Browser-only React app for drawing paper-ready TikZ figures with geometry, math functions, circuit symbols, ML/DL diagrams, arrows, labels, and reusable TikZ objects.

Made by Guillem Moreno Garcia.

## Features

- SVG canvas with a publication-oriented visual style, grid, axes, snapping, selection, moving, undo, and redo.
- Tools for freehand paths, lines, configurable arrows, rectangles, ellipses, editable text labels, sweep erasing, and math functions.
- Function sampler for expressions such as `sin(x)`, `cos(2*x)`, `0.2*x^2 - 2`, `exp(-x^2)`.
- Insertable diagram blocks for circuits, Gantt schedules, ML pipelines, and dense DL networks.
- LaTeX symbol picker with searchable Greek letters, relations, AMS operators, arrows, calculus symbols, set notation, delimiters, accents, alphabets, units, and ML notation. Accent commands wrap the current label or selected symbol instead of inserting a fixed placeholder.
- Searchable, draggable TikZ object palette with concrete items such as resistors, capacitors, sources, diodes, transistors, op amps, logic gates, PGFPlots axes, error bars, scatter plots, bar charts, histograms, heatmaps, automata states, matrices, commutative diagrams, flowchart shapes, neural layers, CNN stacks, transformer blocks, pipelines, Gantt bars, Petri nets, trees, angle markers, Venn diagrams, and brace annotations.
- Each dropped object carries its required package and TikZ library dependencies automatically, including `circuitikz`, `pgfplots`, `arrows.meta`, `positioning`, `matrix`, `automata`, `angles`, `quotes`, and `decorations.pathreplacing`.
- Custom TikZ snippet blocks for any package or library that is not represented by a built-in preset yet.
- Live TikZ generation with monochrome export, optional `figure` wrapper, caption/label fields, copy, and prominent `.TeX` download.
- Header actions for erasing, clearing the full board, exporting `.TeX`, copying TikZ, toggling the grid, and opening the GitHub repository.
- Basic freehand recognition to convert selected scribbles into lines, rectangles, or ellipses.
- Header link back to the GitHub repository for quick access while editing.

The exported code includes preamble suggestions for each inserted block and label symbol, including `\usepackage`, `\usetikzlibrary`, `\usepgfplotslibrary`, and compatibility hints where needed.

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

## License

Apache-2.0. See [LICENSE](LICENSE).
