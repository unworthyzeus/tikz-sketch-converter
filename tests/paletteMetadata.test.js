import assert from 'node:assert/strict'
import test from 'node:test'
import { libraryPaletteItems } from '../src/tikzPaletteItems.js'

test('spectrogram plot declares colormaps as a PGFPlots library', () => {
  const spectrogram = libraryPaletteItems.find((item) => item.id === 'plot-spectrogram')

  assert.deepEqual(spectrogram?.pgfplotsLibraries, ['colormaps'])
  assert.equal(spectrogram?.libraries?.includes('colormaps'), false)
})
