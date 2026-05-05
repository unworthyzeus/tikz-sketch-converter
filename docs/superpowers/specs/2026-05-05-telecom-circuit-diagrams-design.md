# Telecom and Circuit Diagram Upgrade Design

## Scope

Improve the TikZ library palette with paper-ready telecom/RF and circuit presets while fixing export inconsistencies found during QA. The chosen direction is the "paper-ready package": common, technically idiomatic diagrams that users can drop into reports, lectures, and papers.

## Diagram Goals

- Replace weak sketch-level telecom snippets with conventional signal-chain diagrams: OFDM transmitter/receiver, QAM mapper, channel plus AWGN, MIMO channel, superheterodyne receiver, PLL loop, RF front-end, directional coupler, and link-budget style blocks.
- Add or improve circuit presets that are recognizable as normal engineering schematics: op-amp active filter, RC low-pass, RLC series branch, Wheatstone bridge, transistor stage/front-end, transmission line, meters, and dependent sources.
- Keep snippets compact and editable. Presets should use stable anchors, readable labels, and package/library declarations that match the TikZ code they emit.

## Export and Option Behavior

- Library presets must export their actual snippet unless the preset is intentionally a configurable primitive such as a shape, circuit bipole, matrix, gantt, or telecom custom block.
- Configured options should be injected without duplicating incompatible TikZ options.
- Required packages and libraries must be declared through preset metadata or config-driven requirements, including `circuitikz`, `pgfplots`, `arrows.meta`, `positioning`, `calc`, matrix libraries, and shape libraries where needed.
- Existing object controls remain compatible; no broad UI redesign is in scope.

## Testing

- Add regression tests for the export bug where generic library objects can be replaced by a rounded node because every object has a default `shapeVariant`.
- Add palette metadata tests that verify new telecom/circuit presets have package/library metadata and contain expected idiomatic TikZ constructs.
- Keep the current suite green and run lint/build before push.

## Out of Scope

- Full visual system redesign across every object.
- Browser-rendered PDF/LaTeX compilation.
- New drag/drop editor interactions beyond existing palette behavior.
