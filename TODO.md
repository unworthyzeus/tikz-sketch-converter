# TODO

## Near-Term Work

- Add more options to function plotting, such as marking x-intercepts and y-intercepts, extrema, roots, samples, tangent lines, asymptotes, legends, domains, clipping, labels, and other TikZ/PGFPlots-style controls.
- Make the "add nodes" workflow make sense: clearer node placement, labels, connectors, directions, grouping behavior, and predictable editing for node-heavy objects.
- Focus on missing features for telecommunications engineering, especially block diagrams, signal-flow diagrams, RF/microwave chains, modulation/demodulation blocks, filters, antennas, channels, noise sources, spectrum plots, constellation diagrams, and link-budget style diagrams.

## Core Editor UX

- Add a proper layers/object list with visibility toggles, lock toggles, z-order controls, grouping, rename, and search.
- Add keyboard shortcuts for selection, delete, duplicate, copy/paste, undo/redo, pan, zoom, snap toggles, and export.
- Add alignment and distribution tools for paper diagrams: align left/right/center, equal spacing, same size, snap to baseline, and snap to guides.
- Improve object resizing with handles, rotation handles, anchor-point editing, and typed dimensions in centimeters.
- Add better overlap selection: hover candidates, cycle indicator, and a small selection stack popup when many objects sit under the cursor.

## TikZ And PGFPlots

- Add PGFPlots-specific inspector options: axis type, axis labels, ticks, tick labels, legends, grid style, domain, samples, colormaps, markers, error bars, and log scales.
- Add reusable plot data import from CSV/JSON, manual coordinate tables, and export as `\addplot table` when useful.
- Add named styles and presets for journal-ready figures: IEEE-like, Nature-like monochrome, thesis, slides, and compact two-column plots.
- Add support for clipping scopes, node anchors, named coordinates, fit nodes, backgrounds, decorations, patterns, shadows, and advanced arrow tips.
- Add validation/warnings for snippets that require packages or TikZ libraries not included in the generated preamble.

## Circuits

- Build true circuit topology: snap-to-terminal, junction inference, net naming, wire splitting, and net-preserving component replacement.
- Add component-specific panels for values, units, polarity, labels, orientation, mirroring, IEC/American style, and terminal naming.
- Add more CircuitikZ components: controlled sources, switches, transformers, transmission lines, ports, meters, diodes, BJTs, MOSFETs, op-amps, filters, and logic families.
- Add circuit auto-label numbering that updates intelligently after deletion, duplication, and replacement.
- Add wire routing modes: straight, Manhattan, stepped, bus, bundled, and avoid-object routing.

## Telecommunications Engineering

- Add block-diagram palettes for transmitters, receivers, PLLs, mixers, LOs, ADC/DAC, DSP blocks, equalizers, coders, interleavers, channel blocks, and feedback loops.
- Add signal-flow graph objects with gains, summing junctions, branch nodes, delays, `z^{-1}` blocks, transfer functions, and feedback connectors.
- Add RF/microwave drawing objects: antennas, waveguides, couplers, splitters, combiners, filters, amplifiers, attenuators, circulators, isolators, and S-parameter blocks.
- Add communications plots: spectrum, spectrogram, eye diagram, constellation diagram, BER curve, impulse response, frequency response, and link-budget tables.
- Add telecom-oriented examples: QPSK chain, OFDM chain, MIMO channel, superheterodyne receiver, link budget, and matched-filter receiver.

## Import Export

- Add SVG/PNG export settings: transparent background, scale factor, crop to content, margin, monochrome, and paper-size presets.
- Add import from TikZ snippets into editable objects for common primitives, not just custom blocks.
- Add export presets for standalone LaTeX, figure environment, Beamer slides, Overleaf-ready project zip, and clipboard snippets.
- Add board autosave, local recent files, and explicit version migrations for old board JSON.

## Quality And Docs

- Add a short in-app tutorial project and a sample gallery of paper-ready diagrams.
- Add unit tests for TikZ generation and board serialization.
- Add browser interaction tests for selection, multi-select, export buttons, dark mode, and JSON/share URL round-trips.
- Add visual regression screenshots for the main editor at desktop and mobile sizes.
