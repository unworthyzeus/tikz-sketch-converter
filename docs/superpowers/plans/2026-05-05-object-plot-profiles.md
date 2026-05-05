# Object And Plot Profiles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give plots and library objects exact, per-object configuration profiles instead of broad generic panels.

**Architecture:** Add a small declarative registry that maps palette presets to profile sections, exact field keys, and default values. Keep TikZ generation in the existing app flow, but make option injection robust for multi-line PGFPlots blocks so configured values actually win.

**Tech Stack:** React, Vite, Node test runner, TikZ/PGFPlots/CircuitikZ snippets.

---

### Task 1: Profile Registry

**Files:**
- Create: `src/libraryObjectProfiles.js`
- Test: `tests/libraryObjectProfiles.test.js`

- [ ] **Step 1: Write failing tests**

Test exact field profiles for representative objects:

```js
assert.deepEqual(
  libraryProfileSectionSpecsForPreset({ id: 'plot-ber', group: 'Plots', preview: 'plot' }).flatMap((section) => section.fields),
  ['axisWidth', 'axisHeight', 'xMode', 'yMode', 'gridMode', 'minorTicks', 'xlabel', 'ylabel', 'plotTitle', 'legendPos', 'legendColumns', 'markStyle', 'plotSmooth', 'plotDomain', 'samples', 'addplotExtraOptions'],
)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/libraryObjectProfiles.test.js`

- [ ] **Step 3: Implement registry**

Create profile helpers:

```js
libraryObjectProfileForPreset(preset)
libraryProfileSectionSpecsForPreset(preset)
libraryProfileDefaultConfig(preset)
```

- [ ] **Step 4: Run profile tests**

Run: `npm test tests/libraryObjectProfiles.test.js`

### Task 2: UI Wiring

**Files:**
- Modify: `src/App.jsx`
- Test: `tests/libraryObjectProfiles.test.js`

- [ ] **Step 1: Import profile helpers**

Use the registry to build default library config and selected advanced sections.

- [ ] **Step 2: Map profile fields to existing field definitions**

Keep existing field rendering; replace domain-only section filtering with exact profile section specs.

- [ ] **Step 3: Run tests**

Run: `npm test tests/libraryObjectProfiles.test.js`

### Task 3: Configurable Plot Options That Actually Override Snippets

**Files:**
- Create: `src/tikzOptionInjection.js`
- Modify: `src/App.jsx`
- Test: `tests/tikzOptionInjection.test.js`

- [ ] **Step 1: Write failing injection tests**

Multi-line axis options must be inserted just before the closing `]`, so user config overrides hardcoded snippet defaults.

- [ ] **Step 2: Implement line-aware injection**

Replace line-local axis injection with block-aware injection for `axis`, `polaraxis`, `semilogyaxis`, and `groupplot`.

- [ ] **Step 3: Run injection tests**

Run: `npm test tests/tikzOptionInjection.test.js`

### Task 4: Richer Plot/Object Presets

**Files:**
- Modify: `src/tikzPaletteItems.js`
- Test: `tests/paletteMetadata.test.js`

- [ ] **Step 1: Add/upgrade plot presets**

Improve telecom/statistical plot snippets for spectrum, constellation, BER, eye diagram, spectrogram, frequency response, and impulse response.

- [ ] **Step 2: Add exact profile metadata where helpful**

Use IDs that resolve to existing profiles and add package/library metadata.

- [ ] **Step 3: Run palette tests**

Run: `npm test tests/paletteMetadata.test.js`

### Task 5: Full Verification And Push

**Files:**
- No new production files unless tests expose a bug.

- [ ] **Step 1: Full test suite**

Run: `npm test`

- [ ] **Step 2: Lint and build**

Run: `npm run lint`
Run: `npm run build`

- [ ] **Step 3: Commit and push**

Commit the focused changes and push the current branch.
