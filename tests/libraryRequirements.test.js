import assert from 'node:assert/strict'
import test from 'node:test'
import { configDrivenRequirements } from '../src/libraryRequirements.js'

test('configDrivenRequirements adds TikZ libraries required by object styling options', () => {
  const requirements = configDrivenRequirements({
    shadow: true,
    pattern: 'north east lines',
    shapeVariant: 'callout',
  })

  assert.deepEqual(requirements.libraries, ['patterns', 'shadows', 'shapes.callouts'])
  assert.deepEqual(requirements.pgfplotsLibraries, [])
})

test('configDrivenRequirements adds shape and PGFPlots libraries for advanced variants', () => {
  assert.deepEqual(configDrivenRequirements({ shapeVariant: 'cloud' }).libraries, ['shapes.symbols'])
  assert.deepEqual(configDrivenRequirements({ shapeVariant: 'cylinder' }).libraries, ['shapes.geometric'])
  assert.deepEqual(configDrivenRequirements({ shapeVariant: 'diamond' }).libraries, ['shapes.geometric'])
  assert.deepEqual(configDrivenRequirements({ shapeVariant: 'ellipse' }).libraries, ['shapes.geometric'])
  assert.deepEqual(configDrivenRequirements({ shapeVariant: 'split' }).libraries, ['shapes.multipart'])
  assert.deepEqual(configDrivenRequirements({ colormap: 'viridis' }).pgfplotsLibraries, ['colormaps'])
})
