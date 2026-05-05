# Telecom and Circuit Diagram Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add paper-ready telecom/RF and circuit diagram presets while fixing the library export path that can replace arbitrary snippets with generic rounded nodes.

**Architecture:** Keep palette data in `src/tikzPaletteItems.js`, add one small export-decision helper in `src/librarySnippetConfig.js`, and wire it into `src/App.jsx`. Tests stay focused on behavior and metadata rather than rendering LaTeX.

**Tech Stack:** React 19, Vite 8, Node `node:test`, TikZ/circuitikz/PGFPlots snippets.

---

### Task 1: Regression-Test Configured Snippet Selection

**Files:**
- Create: `src/librarySnippetConfig.js`
- Create: `tests/librarySnippetConfig.test.js`
- Modify: `src/App.jsx`

- [ ] **Step 1: Write the failing test**

```js
import assert from 'node:assert/strict'
import test from 'node:test'
import { shouldUseConfiguredLibrarySnippet } from '../src/librarySnippetConfig.js'

test('shape variants only replace snippets for configurable primitive presets', () => {
  assert.equal(
    shouldUseConfiguredLibrarySnippet({ id: 'circuit-rc-lowpass', group: 'Circuit', preview: 'circuit' }, { shapeVariant: 'rounded' }, { hasCircuitComponent: false }),
    false,
  )
  assert.equal(
    shouldUseConfiguredLibrarySnippet({ id: 'circuit-resistor', group: 'Circuit', preview: 'resistor' }, { shapeVariant: 'rounded' }, { hasCircuitComponent: true }),
    true,
  )
  assert.equal(
    shouldUseConfiguredLibrarySnippet({ id: 'telecom-ofdm-transmitter', group: 'Telecom', preview: 'flow' }, { blockLabels: '' }),
    false,
  )
  assert.equal(
    shouldUseConfiguredLibrarySnippet({ id: 'shape-process', group: 'Shapes', preview: 'flow' }, { shapeVariant: 'diamond' }),
    true,
  )
})
```

- [ ] **Step 2: Run the targeted test and verify it fails**

Run: `node --test tests/librarySnippetConfig.test.js`

Expected: FAIL because `src/librarySnippetConfig.js` does not exist or does not export the function yet.

- [ ] **Step 3: Implement the helper and wire it into App**

```js
const configurablePrimitiveIds = new Set([
  'shape-process',
  'shape-decision',
  'shape-ellipse-node',
  'shape-cylinder',
  'shape-cloud',
  'shape-callout',
  'shape-rounded-module',
  'math-equation-node',
  'math-theorem-box',
  'annotation-callout-arrow',
])

export function shouldUseConfiguredLibrarySnippet(preset = {}, config = {}, capabilities = {}) {
  if (capabilities.hasCircuitComponent) return true
  if (preset.id === 'shape-callout') return true
  if (config?.matrixEntries?.trim?.() && (preset.preview === 'matrix' || preset.id?.includes('matrix'))) return true
  if (preset.id?.includes('gantt') && (config.ganttStart !== 1 || config.ganttEnd !== 7 || config.ganttProgress > 0 || config.blockLabels?.trim?.())) return true
  if ((preset.group === 'Telecom' || preset.id?.startsWith('telecom-') || preset.id?.startsWith('rf-')) && config.blockLabels?.trim?.()) return true
  return configurablePrimitiveIds.has(preset.id)
}
```

In `src/App.jsx`, import `shouldUseConfiguredLibrarySnippet` and return `null` from `buildConfiguredLibrarySnippet` when the helper returns false.

- [ ] **Step 4: Run the targeted test and verify it passes**

Run: `node --test tests/librarySnippetConfig.test.js`

Expected: PASS.

### Task 2: Add Paper-Ready Telecom and RF Presets

**Files:**
- Modify: `src/tikzPaletteItems.js`
- Modify: `tests/paletteMetadata.test.js`
- Modify: `tests/smoke.test.js`

- [ ] **Step 1: Write failing palette tests**

Add assertions that `libraryPaletteItems` contains:

```js
const requiredTelecomIds = [
  'telecom-ofdm-transmitter',
  'telecom-ofdm-receiver',
  'telecom-awgn-channel',
  'telecom-mimo-link',
  'rf-front-end',
]
for (const id of requiredTelecomIds) assert.ok(libraryPaletteItems.find((item) => item.id === id), id)
```

Also assert that telecom snippets include normal labels such as `S/P`, `IFFT`, `CP`, `AWGN`, `\\mathbf{H}`, `LNA`, and `BPF`.

- [ ] **Step 2: Run the tests and verify they fail**

Run: `node --test tests/paletteMetadata.test.js tests/smoke.test.js`

Expected: FAIL because the new ids are absent.

- [ ] **Step 3: Add telecom/RF snippets**

Add compact presets to the final mapped section in `src/tikzPaletteItems.js` with packages `['\\usepackage{tikz}']`, telecom libraries `['arrows.meta', 'positioning', 'calc']`, and snippets using named nodes plus arrows:

```js
['telecom-ofdm-transmitter', 'Telecom', 'OFDM transmitter', 'Bits to RF OFDM waveform', 'flow', [
  '\\node[draw=__COLOR__, __FILL_STYLE__, minimum width=.9cm] (bits) at (0,0) {$b_k$};',
  '\\node[draw=__COLOR__, __FILL_STYLE__, right=.55cm of bits, minimum width=.9cm] (map) {QAM};',
  '\\node[draw=__COLOR__, __FILL_STYLE__, right=.55cm of map, minimum width=.9cm] (sp) {S/P};',
  '\\node[draw=__COLOR__, __FILL_STYLE__, right=.55cm of sp, minimum width=.9cm] (ifft) {IFFT};',
  '\\node[draw=__COLOR__, __FILL_STYLE__, right=.55cm of ifft, minimum width=.9cm] (cp) {CP};',
  '\\node[circle, draw=__COLOR__, right=.55cm of cp, minimum size=.65cm] (mix) {$\\times$};',
  '\\draw[-{Stealth}, draw=__COLOR__] (bits) -- (map) -- (sp) -- (ifft) -- (cp) -- (mix) -- ++(.8,0) node[right] {$s(t)$};',
  '\\draw[-{Stealth}, draw=__COLOR__] (mix.south) -- ++(0,-.65) node[below] {$e^{j2\\pi f_ct}$};',
]]
```

Repeat with receiver, AWGN channel, MIMO link, and RF front-end snippets.

- [ ] **Step 4: Run the palette tests and verify they pass**

Run: `node --test tests/paletteMetadata.test.js tests/smoke.test.js`

Expected: PASS.

### Task 3: Upgrade Circuit Presets

**Files:**
- Modify: `src/tikzPaletteItems.js`
- Modify: `tests/paletteMetadata.test.js`
- Modify: `tests/smoke.test.js`

- [ ] **Step 1: Write failing circuit tests**

Assert that circuit ids exist and use `circuitikz` metadata:

```js
const requiredCircuitIds = [
  'circuit-opamp-lowpass',
  'circuit-common-emitter',
  'circuit-inverting-amplifier',
  'circuit-rlc-parallel',
]
for (const id of requiredCircuitIds) {
  const item = libraryPaletteItems.find((preset) => preset.id === id)
  assert.ok(item, id)
  assert.ok(item.packages.some((pkg) => pkg.includes('circuitikz')), id)
}
```

Also assert snippets include idiomatic constructs such as `op amp`, `node[ground]`, `to[R`, `to[C`, `to[L`, and transistor anchors.

- [ ] **Step 2: Run the tests and verify they fail**

Run: `node --test tests/paletteMetadata.test.js tests/smoke.test.js`

Expected: FAIL because the new circuit ids are absent.

- [ ] **Step 3: Add circuit snippets**

Add presets to `src/tikzPaletteItems.js` that use circuitikz notation, stable node names, and package metadata:

```js
['circuit-inverting-amplifier', 'Circuit', 'Inverting op-amp', 'Classic inverting amplifier', 'opamp', [
  '\\node[op amp, draw=__COLOR__] (op) at (2,0) {};',
  '\\draw[draw=__COLOR__, line width=0.65pt] (-1,0) node[left] {$v_i$} to[R,l=$R_{in}$] (op.-);',
  '\\draw[draw=__COLOR__, line width=0.65pt] (op.+) -- ++(0,-.7) node[ground] {};',
  '\\draw[draw=__COLOR__, line width=0.65pt] (op.out) -- ++(.8,0) node[right] {$v_o$};',
  '\\draw[draw=__COLOR__, line width=0.65pt] (op.-) |- ++(.4,1.0) to[R,l=$R_f$] ++(2.1,0) -| (op.out);',
]]
```

Repeat for active low-pass, common-emitter stage, and parallel RLC tank.

- [ ] **Step 4: Run the targeted tests and verify they pass**

Run: `node --test tests/paletteMetadata.test.js tests/smoke.test.js`

Expected: PASS.

### Task 4: Full Verification and Publish

**Files:**
- Modify as needed from prior tasks only.

- [ ] **Step 1: Run full tests**

Run: `npm test`

Expected: all tests pass.

- [ ] **Step 2: Run lint**

Run: `npm run lint`

Expected: exit code 0.

- [ ] **Step 3: Run production build**

Run: `npm run build`

Expected: build completes. The existing Vite chunk-size warning is acceptable if unchanged.

- [ ] **Step 4: Review diff**

Run: `git diff --stat` and `git diff -- src tests docs`

Expected: only spec, plan, tests, helper, App import/wiring, and palette snippets changed.

- [ ] **Step 5: Commit and push**

Run:

```bash
git add docs/superpowers/specs/2026-05-05-telecom-circuit-diagrams-design.md docs/superpowers/plans/2026-05-05-telecom-circuit-diagrams.md src/librarySnippetConfig.js src/App.jsx src/tikzPaletteItems.js tests/librarySnippetConfig.test.js tests/paletteMetadata.test.js tests/smoke.test.js
git commit -m "Improve telecom and circuit diagram presets"
git push
```
