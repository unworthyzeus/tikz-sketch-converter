import assert from 'node:assert/strict'
import test from 'node:test'
import { libraryPaletteItems } from '../src/tikzPaletteItems.js'
import { libraryPresets } from '../src/tikzLibraryPresets.js'

function paletteItem(id) {
  return libraryPaletteItems.find((item) => item.id === id)
}

function snippetText(id) {
  return paletteItem(id)?.snippet?.join('\n') ?? ''
}

function presetItem(id) {
  return libraryPresets.find((item) => item.id === id)
}

test('spectrogram plot declares colormaps as a PGFPlots library', () => {
  const spectrogram = paletteItem('plot-spectrogram')

  assert.deepEqual(spectrogram?.pgfplotsLibraries, ['colormaps'])
  assert.equal(spectrogram?.libraries?.includes('colormaps'), false)
})

test('native TikZ electrical preset activates the IEC circuit style', () => {
  const preset = presetItem('tikz-ee-iec')
  const snippet = preset?.snippet?.join('\n') ?? ''

  assert.ok(preset?.libraries.includes('circuits.ee.IEC'))
  assert.match(snippet, /\\begin\{scope\}\[circuit ee IEC\]/)
  assert.match(snippet, /\\end\{scope\}/)
})

test('editable Gantt bars declare pgfgantt for configured timeline export', () => {
  const gantt = paletteItem('gantt-paper')

  assert.ok(gantt?.packages.includes('\\usepackage{pgfgantt}'))
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

test('paper-ready plot and object snippets expose exact configuration tokens', () => {
  assert.match(snippetText('circuit-inverting-amplifier'), /__INPUT_LABEL__/)
  assert.match(snippetText('circuit-inverting-amplifier'), /__OUTPUT_LABEL__/)
  assert.match(snippetText('circuit-inverting-amplifier'), /__COMPONENT_1__/)
  assert.match(snippetText('telecom-awgn-channel'), /__CHANNEL_LABEL__/)
  assert.match(snippetText('telecom-awgn-channel'), /__NOISE_LABEL__/)
  assert.match(snippetText('rf-front-end'), /__GAIN_DB__/)

  assert.match(snippetText('plot-spectrum'), /fill=__FILL__/)
  assert.match(snippetText('plot-ber'), /E_b\/N_0/)
  assert.match(snippetText('plot-eye'), /UI/)
  assert.match(snippetText('plot-spectrogram'), /colormap/)
})

test('paper-ready estimation and control diagrams cover communication analysis workflows', () => {
  const requiredIds = ['telecom-ofdm-pilot-estimator', 'telecom-adaptive-equalizer', 'plot-bode-margins']

  requiredIds.forEach((id) => assert.ok(paletteItem(id), id))

  ;['telecom-ofdm-pilot-estimator', 'telecom-adaptive-equalizer'].forEach((id) => {
    const item = paletteItem(id)
    assert.equal(item.group, 'Telecom')
    assert.ok(item.libraries.includes('arrows.meta'), id)
    assert.ok(item.libraries.includes('positioning'), id)
  })

  assert.equal(paletteItem('plot-bode-margins').group, 'Plots')
  assert.ok(paletteItem('plot-bode-margins').pgfplotsLibraries.includes('groupplots'))

  const snippets = requiredIds.map(snippetText).join('\n')
  assert.match(snippets, /pilot/i)
  assert.match(snippets, /\\hat\{H\}_k/)
  assert.match(snippets, /LMS/)
  assert.match(snippets, /e\[n\]/)
  assert.match(snippets, /phase margin/i)
  assert.match(snippets, /gain margin/i)
})

test('paper-ready coding and control diagrams cover deeper analysis workflows', () => {
  const requiredIds = ['telecom-ofdm-resource-grid', 'telecom-ldpc-tanner', 'control-kalman-filter']

  requiredIds.forEach((id) => assert.ok(paletteItem(id), id))

  ;['telecom-ofdm-resource-grid', 'telecom-ldpc-tanner'].forEach((id) => {
    const item = paletteItem(id)
    assert.equal(item.group, 'Telecom')
    assert.ok(item.libraries.includes('arrows.meta'), id)
    assert.ok(item.libraries.includes('positioning'), id)
  })

  const kalman = paletteItem('control-kalman-filter')
  assert.equal(kalman.group, 'Control')
  assert.ok(kalman.libraries.includes('arrows.meta'))
  assert.ok(kalman.libraries.includes('positioning'))

  const snippets = requiredIds.map(snippetText).join('\n')
  assert.match(snippets, /pilot/i)
  assert.match(snippets, /data/i)
  assert.match(snippets, /LDPC/)
  assert.match(snippets, /check/i)
  assert.match(snippets, /predict/i)
  assert.match(snippets, /update/i)
  assert.match(snippets, /\\nu_k/)
  assert.match(snippets, /K_k=/)
  assert.match(snippets, /F\\hat\{x\}/)
  assert.match(snippets, /H\\hat\{x\}/)
  assert.match(snippets, /\\hat\{x\}/)
})

test('common telecom diagram palette covers frame, FEC, link-budget, sync and MIMO-OFDM workflows', () => {
  const requiredIds = [
    'telecom-ofdm-transceiver',
    'telecom-5g-nr-frame',
    'telecom-mimo-ofdm-downlink',
    'telecom-fec-chain',
    'telecom-link-budget-chain',
    'telecom-synchronization-loop',
  ]

  requiredIds.forEach((id) => {
    const item = paletteItem(id)
    assert.ok(item, id)
    assert.equal(item.group, 'Telecom')
    assert.equal(item.paletteKind, 'diagram')
    assert.ok(item.libraries.includes('arrows.meta'), id)
    assert.ok(item.libraries.includes('positioning'), id)
  })

  const snippets = requiredIds.map(snippetText).join('\n')
  assert.match(snippets, /OFDM TX/i)
  assert.match(snippets, /OFDM RX/i)
  assert.match(snippets, /5G NR frame/i)
  assert.match(snippets, /PDCCH/i)
  assert.match(snippets, /PDSCH/i)
  assert.match(snippets, /layers/i)
  assert.match(snippets, /precoder/i)
  assert.match(snippets, /per-antenna OFDM/i)
  assert.match(snippets, /CRC/i)
  assert.match(snippets, /FEC/i)
  assert.match(snippets, /LLR/i)
  assert.match(snippets, /Path loss/i)
  assert.match(snippets, /G_t/i)
  assert.match(snippets, /CFO/i)
  assert.match(snippets, /timing/i)
})

test('technical diagrams avoid nonportable or semantically reversed snippets', () => {
  const allPaletteText = libraryPaletteItems.map((item) => item.snippet.join('\n')).join('\n')

  assert.doesNotMatch(allPaletteText, /contour gnuplot/)
  assert.doesNotMatch(allPaletteText, /\\hline/)
  assert.doesNotMatch(allPaletteText, /\(n\\x\)/)
  assert.doesNotMatch(allPaletteText, /n\d+\.\d+/)

  libraryPaletteItems.forEach((item) => {
    item.snippet.forEach((line, lineIndex) => {
      if (line.includes('\\\\') && line.includes('\\node[')) {
        assert.match(line, /align\s*=/, `${item.id}:${lineIndex} multiline node needs align`)
      }
    })
  })

  assert.match(snippetText('plot-boxplot'), /boxplot prepared/)
  assert.ok(paletteItem('plot-boxplot').pgfplotsLibraries.includes('statistics'))
  assert.match(snippetText('plot-contour'), /coordinates \{\(-1\.4,0\)/)
  assert.ok(paletteItem('uml-class').libraries.includes('shapes.multipart'))
  assert.match(snippetText('uml-class'), /rectangle split/)
  assert.match(snippetText('dl-rnn-cell'), /h_\{t-1\}/)

  assert.match(snippetText('telecom-awgn-channel'), /\$\(sum\.north\)\+\(0,\.72\)\$.*-- \(sum\.north\)/)
  assert.match(snippetText('telecom-channel'), /\$\(s\.north\)\+\(0,0\.7\)\$.*-- \(s\.north\)/)
  assert.match(snippetText('telecom-adaptive-equalizer'), /d\[n\].*-- node\[right, font=\\scriptsize\] \{\$\+\$\} \(err\.north\)/s)
  assert.match(snippetText('telecom-adaptive-equalizer'), /\(zbranch\) \|-/)
  assert.match(snippetText('telecom-feedback-loop'), /\$-\$/)
  assert.doesNotMatch(snippetText('rf-splitter'), /\\Sigma/)
  assert.match(snippetText('rf-sparameter'), /a_1/)
  assert.match(snippetText('rf-sparameter'), /b_1/)
  assert.match(snippetText('rf-sparameter'), /a_2/)
  assert.match(snippetText('rf-sparameter'), /b_2/)
})

test('palette and preset metadata declare snippet-driven TikZ libraries exactly once', () => {
  const libraryRules = [
    ['arrows.meta', /Stealth|Latex|Triangle|\\arrow\{Stealth\}/],
    ['circuits.logic.IEC', /gate IEC/],
    ['automata', /\bstate\b/],
    ['matrix', /matrix of/],
    ['fit', /\bfit=\{/],
    ['positioning', /\b(?:right|left|above|below)\s*=\s*[-.\d][^,\]]*/],
    ['decorations.pathreplacing', /decoration=\{brace|decorate[^\\]*(?:brace)/],
    ['patterns', /\bpattern=/],
    ['shadows', /drop shadow/],
    ['shapes.callouts', /callout/],
    ['shapes.geometric', /\b(?:diamond|ellipse|cylinder)\b/],
    ['shapes.multipart', /rectangle split/],
    ['shapes.symbols', /\bcloud\b/],
    ['graphs', /\\graph\b/],
    ['mindmap', /mindmap/],
    ['spy', /spy using outlines/],
    ['backgrounds', /on background layer/],
  ]
  const pgfplotsLibraryRules = [
    ['colormaps', /colormap/],
    ['fillbetween', /fill between/],
    ['groupplots', /\\begin\{groupplot\}|\\nextgroupplot/],
    ['polar', /\\begin\{polaraxis\}/],
    ['statistics', /boxplot prepared|boxplot\/draw direction/],
  ]

  const metadataIssues = []
  const allItems = [...libraryPaletteItems, ...libraryPresets]
  const metadataKeys = ['packages', 'libraries', 'pgfplotsLibraries', 'afterPreamble']

  allItems.forEach((item) => {
    metadataKeys.forEach((key) => {
      const values = item[key] ?? []
      const duplicates = [...new Set(values.filter((value, index) => values.indexOf(value) !== index))]
      duplicates.forEach((value) => metadataIssues.push(`${item.id} duplicates ${key}: ${value}`))
    })

    const snippet = item.snippet?.join('\n') ?? ''
    const libraries = new Set(item.libraries ?? [])
    libraryRules.forEach(([library, pattern]) => {
      if (pattern.test(snippet) && !libraries.has(library)) {
        metadataIssues.push(`${item.id} missing ${library}`)
      }
    })

    const pgfplotsLibraries = new Set(item.pgfplotsLibraries ?? [])
    pgfplotsLibraryRules.forEach(([library, pattern]) => {
      if (pattern.test(snippet) && !pgfplotsLibraries.has(library)) {
        metadataIssues.push(`${item.id} missing pgfplots ${library}`)
      }
    })
  })

  assert.deepEqual(metadataIssues, [])
})
