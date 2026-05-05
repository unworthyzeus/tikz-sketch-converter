import assert from 'node:assert/strict'
import test from 'node:test'
import { libraryPaletteItems } from '../src/tikzPaletteItems.js'

function paletteItem(id) {
  return libraryPaletteItems.find((item) => item.id === id)
}

function snippetText(id) {
  return paletteItem(id)?.snippet?.join('\n') ?? ''
}

test('spectrogram plot declares colormaps as a PGFPlots library', () => {
  const spectrogram = paletteItem('plot-spectrogram')

  assert.deepEqual(spectrogram?.pgfplotsLibraries, ['colormaps'])
  assert.equal(spectrogram?.libraries?.includes('colormaps'), false)
})

test('paper-ready telecom presets expose common signal-chain diagrams', () => {
  const requiredTelecomIds = [
    'telecom-ofdm-transmitter',
    'telecom-ofdm-receiver',
    'telecom-awgn-channel',
    'telecom-mimo-link',
    'rf-front-end',
  ]

  requiredTelecomIds.forEach((id) => {
    const item = paletteItem(id)
    assert.ok(item, id)
    assert.equal(item.group, 'Telecom')
    assert.ok(item.packages.some((pkg) => pkg.includes('tikz')), id)
    assert.ok(item.libraries.includes('arrows.meta'), id)
    assert.ok(item.libraries.includes('positioning'), id)
  })

  const telecomSnippets = requiredTelecomIds.map(snippetText).join('\n')
  assert.match(telecomSnippets, /S\/P/)
  assert.match(telecomSnippets, /IFFT/)
  assert.match(telecomSnippets, /CP/)
  assert.match(telecomSnippets, /AWGN/)
  assert.match(telecomSnippets, /\\mathbf\{H\}/)
  assert.match(telecomSnippets, /LNA/)
  assert.match(telecomSnippets, /BPF/)
})

test('paper-ready circuit presets expose idiomatic circuitikz schematics', () => {
  const requiredCircuitIds = [
    'circuit-opamp-lowpass',
    'circuit-common-emitter',
    'circuit-inverting-amplifier',
    'circuit-rlc-parallel',
  ]

  requiredCircuitIds.forEach((id) => {
    const item = paletteItem(id)
    assert.ok(item, id)
    assert.equal(item.group, 'Circuit')
    assert.ok(item.packages.some((pkg) => pkg.includes('circuitikz')), id)
  })

  const circuitSnippets = requiredCircuitIds.map(snippetText).join('\n')
  assert.match(circuitSnippets, /op amp/)
  assert.match(circuitSnippets, /node\[ground\]/)
  assert.match(circuitSnippets, /to\[R/)
  assert.match(circuitSnippets, /to\[C/)
  assert.match(circuitSnippets, /to\[L/)
  assert.match(circuitSnippets, /q\.B/)
  assert.match(circuitSnippets, /q\.C/)
  assert.match(circuitSnippets, /q\.E/)
})
