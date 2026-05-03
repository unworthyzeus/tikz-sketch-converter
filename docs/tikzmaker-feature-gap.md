# TikzMaker feature gap

Inspected on 2026-05-04 from https://tikzmaker.com/editor.

Local evidence captures live in `output/tikzmaker-*` and are intentionally ignored by `.gitignore`.

## Features we have

- Browser-only React/Vite editor that exports clean TikZ, optional full `.TeX` figure output, PNG canvas previews, and editable board JSON.
- Paper-focused canvas with grid, axes, snap, undo/redo, eraser, delete-selected, clear-board, copy-code, GitHub link, favicon, and "Made by Guillem Moreno Garcia" byline.
- Freehand pen, line, arrow, rectangle, ellipse, editable text labels, rendered inline LaTeX with KaTeX, and function plots.
- Function plots with domain, samples, smoothing, y-offset after selection, and now extended functions such as `min`, `max`, `nin`, `sinc`, `erf`, `gamma`, `factorial`, `besselj(n,x)`, `besselj0`, `besselj1`, `j0`, `j1`, hyperbolic trig, `log10`, `log2`, `mod`, `clamp`, `step`, `rect`, and `tri`.
- Stroke color, fill color, fill opacity, stroke width, dashed lines, arrowhead style, object scale, and custom TikZ options per selected object.
- LaTeX symbol picker with 363 symbols, accent commands that apply to the current math text, and rendered symbol previews on the board.
- Diagram presets for RC circuits, Gantt/Planning, ML pipelines, and dense DL networks.
- TikZ object palette with 105 draggable presets across Annotation, Automata, Circuit, ER, Flow, Geometry, Graph, Logic, ML / DL, Math, Paper, Petri, Planning, Plots, Shapes, Stats, and UML.
- Preset-level packages/libraries, custom TikZ snippets, standalone PGFPlots/TikZ-CD/automata/planning snippets, and preview thumbnails.

## Features observed in TikzMaker

- WYSIWYG web editor focused mainly on CircuitikZ / circuit diagrams.
- Left tool rail with draw/pencil, eraser, move/pan-style control, grid controls, and undo/redo.
- Component palette with category icons, component search, and two-column component cards.
- Live right inspector with `Code` and `Edit Component` tabs, collapsible side panel, generated CircuitikZ code, and `Copy Code`.
- Selection workflows for copy component, copy selection, delete component, delete selection, replace component, add to selection, and edit components inside a selection.
- Canvas zoom/pan state and explicit zoom controls.
- Theme controls including dark mode, plus a settings entry point.
- Export/download support seen in the bundle for `circuit.png`.
- File import support seen in the bundle via hidden `.txt` input and JSON parsing.
- Auto-labeling of circuit components with labels such as `R_1`, `C_1`, `D_1`, etc.
- Tutorial, updates, known-bugs, contact, beta branding, and cookie consent UI.
- Component set observed in the bundle: Text, Wire, End node, Rectangle, Parallelogram, Rhombus, Dashed Rectangle, Circle, Dashed Circle, Ellipse, Dashed Ellipse, Line, Dashed Line, Arrow, Dashed Arrow, Double-headed arrow, Dashed Double-headed arrow, Junction node, Resistor (IEC), American Resistor, Potentiometer (IEC), Capacitor (IEC), Variable Capacitor, Polarized Capacitor, Inductor, Variable Inductor, Diode, Zener Diode, Tunnel Diode, Photo Diode, Light emitting diode (LED), Schottky Diode, Varicap Diode, Voltage Source (American), Controlled Voltage Source (American), Current source (American), Controlled current source (American), Sinewave Source, Squarewave Source, Trianglewave Source, Ammeter, Ohmmeter, Fuse, Asymmetric Fuse, Crystal Oscillator, Open Switch, Closing Switch, Opening Switch, Closed Push Button, Push Button, Normally Closed Button, Normally Closed Button Open, Cell, Cell2, Battery, Bare Antenna, DIN Antenna, Transmission line, Microstrip transmission line, Microstrip port, Microstrip linear stub, Microstrip radial stub, Mux/Demux, Dual in-line package, MCU, Raspberry Pi, Arduino Uno, Arduino Nano, And port, Nand port, Or port, Nor port, Xor port, Xnor port, Buffer, Not port, Flip-flops, Bulb, Lamp, Speaker, and Microphone.

## Missing before this pass

- Palette category filtering comparable to TikzMaker's category buttons.
- Canvas zoom controls.
- A broader function parser for math-heavy plots, especially special functions such as Bessel functions.
- A written feature-gap artifact in the repo.

## Added in this pass

- Added palette group filters above `Objetos TikZ`.
- Added canvas zoom controls with zoom out, zoom in, reset, and percentage readout.
- Expanded the function expression parser with special functions, aliases, constants, and example chips for paper-style plots.
- Added PNG export for the current canvas preview.
- Added editable board import/export as JSON.
- Added this comparison document and kept browser research captures under ignored `output/`.

## Added after the future-work pass

- Added a circuit-specific object editor for CircuitikZ-like components with label, value, terminal style, terminal length, orientation, IEC/American selector, and auto-numbered labels.
- Added basic topology helpers: snap-to-terminal, two-terminal inference for circuit components and wires, and optional right-angle wire routing for new line/cable strokes.
- Added independent canvas pan mode in the left rail.
- Added SVG export for the current canvas preview and renamed the main copy action to `Copy .TeX code`.
- Added shareable encoded board URLs alongside editable board JSON import/export.
- Added dark mode and an app settings modal.
- Added multi-select editing, copy/paste/duplicate selection controls, and a replace-component flow in the inspector and context menu.
- Added tutorial/help, updates, and known-bugs modal pages inside the app.

## Still missing or future work

- Full netlist-level circuit semantics: robust junction inference, electrical-net validation, and net-aware replacement that preserves named nets across complex edits.
- Rich SVG/PNG export settings such as transparent background, scale presets, and paper-size crop boxes.
- Board collaboration/persistence beyond encoded local URLs, such as cloud saves or multi-user sessions.
