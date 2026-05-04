# TikZ Figure Workbench Four-Feature Roadmap Design

## Context

The editor already supports drawing, object palettes, PGFPlots export, CircuitikZ metadata, JSON/share URLs, Overleaf ZIP export, keyboard shortcuts, and recent preview overlays for function legends/markers and selected object badges/terminals. The next product pass should add all four requested directions, but as staged capabilities rather than one large tangled change.

Approved order:

1. Paper Composer
2. Pro Editing Flow
3. Intelligent Function Preview
4. Visual TikZ Importer

## Phase 1: Paper Composer

Goal: make the app feel like a paper-figure production tool, not only a canvas-to-TikZ exporter.

User-facing features:

- A composer panel for figure targets: IEEE single column, IEEE double column, Nature-style compact, thesis, Beamer.
- Real output dimensions in cm/in and visible safe-area guides on the canvas.
- Subfigure layouts: one panel, 1x2, 2x1, 2x2, and custom panel labels `(a)`, `(b)`, etc.
- Caption and label assistant: validates `fig:*` labels, warns on empty/long captions, and previews final wrapper.
- Export checklist: missing packages/libraries, hidden objects excluded, monochrome mode, crop/margins, grid exclusion, and compile-readiness.

Architecture:

- Add pure helpers for journal presets, figure dimensions, subfigure layout generation, and export validation.
- Keep composer UI in `App.jsx` initially, but isolate logic in small modules so the large component does not grow more behavioral code.
- Reuse existing `buildTikz`, `collectRequirements`, and export settings rather than creating a parallel export path.

Testing:

- Unit tests for preset dimensions, label/caption validation, subfigure panel geometry, and export checklist warnings.
- Existing smoke tests remain green.
- Browser QA at desktop and mobile widths for composer panel and canvas guides.

## Phase 2: Pro Editing Flow

Goal: make repeated editing fast once the figure has many objects.

User-facing features:

- Command palette opened with `Ctrl/Cmd+K`.
- Searchable commands: align, distribute, group/ungroup, same size, duplicate, export, toggle grid/snap, bring front/back.
- Smart guides while moving/resizing: centerlines, equal spacing, baseline alignment, terminal alignment.
- Contextual quick actions near selected objects: replace circuit component, add label, route connector, edit function, export selected.

Architecture:

- Add a command registry module with command ids, labels, shortcuts, enabled states, and handlers.
- Add pure guide-calculation helpers that take element bounds and pointer state and return guide lines/snap suggestions.
- Keep keyboard registration through the existing `editorKeyboard` helper and route palette commands through the same actions.

Testing:

- Unit tests for command filtering/enabled state.
- Unit tests for guide generation and snap suggestions.
- Browser QA for palette opening, command execution, and guide rendering.

## Phase 3: Intelligent Function Preview

Goal: turn function plotting into a mathematical inspection surface before export.

User-facing features:

- Cursor readout over a function plot: nearest series, `x`, `y`, and series label.
- Function diagnostics: discontinuities, large jumps, non-finite samples, log-axis invalid regions, flat domains, and sample density warnings.
- Optional table view of sampled points and imported data table points.
- Quick normalize/fit controls for y-scale, domain, and visible bounds.
- Better visual distinction between analytic curves, imported tables, marked points, tangent, extrema, and asymptotes.

Architecture:

- Add pure analysis helpers that consume sampled series and return diagnostics/readout data.
- Extend the existing `functionPreview` module for marker/readout display decisions.
- Keep export behavior compatible with existing PGFPlots options.

Testing:

- Unit tests for diagnostics, nearest-point readout, discontinuity detection, log-axis warnings, and sample table parsing.
- Browser QA for hover/readout and multiple series.

## Phase 4: Visual TikZ Importer

Goal: let users paste existing TikZ and recover editable objects where practical.

User-facing features:

- Paste/import modal with source TikZ, parse summary, warnings, and preview before committing.
- First supported primitives: `\node`, `\draw` paths, rectangles, circles/ellipses, simple arrows, named coordinates.
- Second supported set: scopes with shift/scale/rotate, matrices, simple `circuitikz to[...]` chains, PGFPlots axes as library/function objects.
- Unsupported fragments remain preserved as custom TikZ blocks with clear warnings.

Architecture:

- Build an incremental parser module that emits an intermediate representation before creating board elements.
- Keep importer conservative: never silently drop source lines. Unsupported lines become custom snippets or warnings.
- Add versioned import metadata so round-trips can preserve source snippets and parser confidence.

Testing:

- Unit tests with small TikZ fixtures for each supported primitive.
- Round-trip tests for board JSON after import.
- Error tests for malformed TikZ and unsupported commands.
- Browser QA for paste/import modal and warning UX.

## Cross-Cutting Design Rules

- Every feature gets pure helper tests before UI wiring.
- New UI must reuse existing compact panel/card styles and avoid adding another large design language.
- Large stateful behavior should move out of `App.jsx` when practical.
- Export output remains deterministic and paper-safe.
- Mobile must remain usable, but dense authoring features may prioritize desktop ergonomics.

## Implementation Sequence

For each phase:

1. Write focused helper tests.
2. Implement pure helper modules.
3. Wire the smallest useful UI slice.
4. Run `npm test`, `npm run lint`, `npm run build`.
5. Do a Playwright visual pass for the main workflow.

Phase 1 should be implemented first because it defines the paper-size/export target model that later guides, previews, and import warnings can reference.
