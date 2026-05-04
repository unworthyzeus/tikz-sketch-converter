# Paper Composer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Paper Composer slice to TikZ Sketch Converter so figures can be designed against paper/journal targets with visible canvas guides, subfigure layouts, metadata validation, and an export readiness checklist.

**Architecture:** Keep domain logic in a pure `src/paperComposer.js` helper module with node tests. Wire the helper into the existing `App.jsx` settings/export/canvas flow with small computed values and a compact export-panel UI. Add only focused CSS for the new guide and checklist surfaces.

**Tech Stack:** React + Vite, lucide-react icons already present, `node --test`, ESLint, existing SVG canvas.

---

## Task 1: Helper API And Tests

- [x] Add failing tests in `tests/paperComposer.test.js` for paper target dimensions, safe-area guide geometry, subfigure panels, metadata validation, and export checklist entries.
- [x] Implement `src/paperComposer.js` with preset definitions, setting resolution, guide geometry, subfigure label parsing, metadata validation, and checklist generation.
- [x] Run `npm test` and make the new helper tests pass without weakening existing tests.

## Task 2: App State And Computed Composer Model

- [x] Add Paper Composer defaults to `defaultEditorSettings`.
- [x] Import helper exports in `src/App.jsx`.
- [x] Compute `paperComposer`, `paperGuide`, and `paperChecklist` with `useMemo`.
- [x] Add a target-change handler that applies target dimensions plus the matching journal/export defaults when useful.

## Task 3: Canvas Guides

- [x] Render the paper frame, safe area, and subfigure panels as a non-interactive SVG guide layer when enabled.
- [x] Keep guides hidden for the content-bound target or invalid dimensions.
- [x] Style the guides for light and dark themes without interfering with element selection or draft drawing.

## Task 4: Export Panel UI

- [x] Add Paper Composer controls to the TikZ export panel: target, dimensions, safe margin, subfigure layout, labels, and guide toggle.
- [x] Surface metadata warnings/checklist items in a compact readable list.
- [x] Preserve the existing export controls and TikZ code behavior.

## Task 5: Verification

- [x] Run `npm test`.
- [x] Run `npm run lint`.
- [x] Run `npm run build`.
- [x] Run `git diff --check`.
- [x] Verify desktop and mobile canvas/export UI visually with a browser/Playwright fallback if Browser Use is unavailable.
