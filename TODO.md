# TODO

## Implemented In This Pass

- [x] Function plotting options: x/y intercept markers, extrema, samples, tangent lines, asymptotes, legends, domains, smoothing, log axes, ticks, tick-label styles, clipping, raw axis options, colormaps, error-bar options, manual coordinate tables, PGFPlots export, and `\addplot table` output for imported data.
- [x] Add-nodes workflow: configurable extra nodes, node labels, node shape, direction, spacing, connectors, grouping, predictable resize controls, and callout pointer controls.
- [x] Telecommunications engineering coverage: transmitter/receiver chains, QPSK, OFDM, MIMO, matched-filter receivers, superheterodyne receiver, PLL, delays, transfer functions, feedback loops, RF amplifiers, attenuators, couplers, splitters/combiners, waveguides, circulators, isolators, antennas, S-parameter blocks, spectrum/constellation/BER/eye/spectrogram/frequency/impulse plots, and link-budget tables.
- [x] Core editor UX: layers/object list, visibility toggles, lock toggles, z-order controls, grouping/ungrouping, rename/search, keyboard shortcuts, alignment, distribution, same-size tools, resize handles, rotation handles, typed centimeter dimensions, overlap selection cycling, and selection stack popup.
- [x] TikZ and PGFPlots export: journal presets, standalone/figure/Beamer/snippet exports, validation warnings for missing libraries/packages, hidden-object filtering, rotation scopes, fill/stroke colors, advanced arrow tips, and raw per-object TikZ options.
- [x] Circuits: configurable CircuitikZ labels/values/orientation/style/terminals, terminal length, auto label renumbering, topology inference summary, component replacement, routing modes, controlled sources, switches, transformers, transmission lines, RF ports, meters, diodes, BJTs, MOSFETs, op-amps, filters, and logic families.
- [x] Import/export: `.tex`, PNG, SVG, editable JSON, shareable encoded URLs, autosave, recent local board metadata, TikZ primitive import for simple nodes/lines/rectangles, and Overleaf-ready ZIP with `main.tex`, `board.json`, `metadata.json`, and `README.md`.
- [x] Quality and docs: implementation plan, smoke tests for the major product areas, lint/build/test verification, desktop/mobile QA screenshots, in-app tutorial, known limitations, and sample gallery projects.

## Future Hardening Completed

- [x] Replace heuristic-only circuit topology with an exported netlist metadata engine that supports terminal snapping data, wire segment splitting, junction inference, named nets, net-aware component metadata, and SPICE-like lines in `metadata.json`.
- [x] Add interaction QA coverage hooks for multi-select, overlap cycling, context replacement, JSON/share URL round-trips, dark mode, and export buttons through smoke tests plus Playwright screenshot runs.
- [x] Add visual regression seed coverage for desktop/mobile editor states and common paper-diagram templates through repeatable Playwright screenshot targets.
- [x] Add Overleaf project metadata output with editable board JSON, standalone TeX, README, and `metadata.json` for IEEE/thesis/Nature/Beamer export presets already in the app.
- [x] Add deeper TikZ import/export configurability for scopes, paths with Beziers, matrices, circuitikz `to[...]` chains, pgfplots axes, tikz-cd diagrams, named coordinates, and object metadata.
- [x] Add configurable object-level options so common TikZ/PGFPlots/CircuitikZ parameters are applied through generated option strings instead of hard-coded previews.
- [x] Add optional code splitting for KaTeX rendering so the editor can start with lightweight LaTeX fallbacks and hydrate math rendering after the async chunk loads.

## Notes

- Browser-persisted visual baseline comparison would still be nice later, but the active TODO list above is closed.
