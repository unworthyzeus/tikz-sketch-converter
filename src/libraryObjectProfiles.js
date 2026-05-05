const exactProfiles = {
  plotBer: {
    id: 'plotBer',
    title: 'BER semilog plot',
    defaults: {
      axisWidth: 4.8,
      axisHeight: 3.2,
      xMode: 'linear',
      yMode: 'log',
      gridMode: 'major',
      xlabel: 'SNR (dB)',
      ylabel: 'BER',
      markStyle: '*',
      plotSmooth: true,
      samples: 80,
    },
    sections: [
      {
        id: 'berAxis',
        title: 'BER axis',
        fields: [
          'axisWidth',
          'axisHeight',
          'xMode',
          'yMode',
          'gridMode',
          'minorTicks',
          'xlabel',
          'ylabel',
          'plotTitle',
          'legendPos',
          'legendColumns',
          'markStyle',
          'plotSmooth',
          'plotDomain',
          'samples',
          'addplotExtraOptions',
        ],
      },
    ],
  },
  plotConstellation: {
    id: 'plotConstellation',
    title: 'I/Q constellation',
    defaults: {
      axisWidth: 3.8,
      axisHeight: 3.8,
      axisLines: 'middle',
      axisEqual: true,
      gridMode: 'both',
      xlabel: '$I$',
      ylabel: '$Q$',
      xtick: '-1,0,1',
      ytick: '-1,0,1',
      markStyle: '*',
      modulation: 'QPSK',
    },
    sections: [
      {
        id: 'constellationAxis',
        title: 'Constellation axis',
        fields: ['axisWidth', 'axisHeight', 'axisLines', 'axisEqual', 'gridMode', 'xlabel', 'ylabel', 'xtick', 'ytick'],
      },
      {
        id: 'constellationSymbols',
        title: 'Symbols',
        fields: ['modulation', 'markStyle', 'addplotExtraOptions', 'datasetTag'],
      },
    ],
  },
  plotSpectrogram: {
    id: 'plotSpectrogram',
    title: 'Time-frequency heatmap',
    defaults: {
      axisWidth: 4.8,
      axisHeight: 3.2,
      xlabel: 'time',
      ylabel: 'frequency',
      colorbar: true,
      colormap: 'viridis',
      shader: 'interp',
      viewAzimuth: 0,
      viewElevation: 90,
      pointMeta: 'explicit',
    },
    sections: [
      {
        id: 'spectrogramAxis',
        title: 'Time-frequency axis',
        fields: ['axisWidth', 'axisHeight', 'xlabel', 'ylabel', 'colorbar', 'colormap', 'viewAzimuth', 'viewElevation'],
      },
      {
        id: 'spectrogramSurface',
        title: 'Surface rendering',
        fields: ['shader', 'pointMeta', 'samples', 'axisExtraOptions', 'addplotExtraOptions'],
      },
    ],
  },
  plotSpectrum: {
    id: 'plotSpectrum',
    title: 'Spectrum plot',
    defaults: {
      axisWidth: 5,
      axisHeight: 3,
      gridMode: 'major',
      xlabel: '$f$',
      ylabel: 'PSD',
      plotSmooth: true,
      samples: 160,
    },
    sections: [
      {
        id: 'spectrumAxis',
        title: 'Frequency axis',
        fields: ['axisWidth', 'axisHeight', 'xMode', 'yMode', 'gridMode', 'minorTicks', 'xlabel', 'ylabel', 'plotTitle'],
      },
      {
        id: 'spectrumTrace',
        title: 'Trace',
        fields: ['plotSmooth', 'plotDomain', 'samples', 'markStyle', 'addplotExtraOptions'],
      },
    ],
  },
  plotEye: {
    id: 'plotEye',
    title: 'Eye diagram',
    defaults: {
      axisWidth: 4.5,
      axisHeight: 2.8,
      xlabel: 'time / UI',
      ylabel: 'amplitude',
      gridMode: 'major',
      plotSmooth: true,
      drawOpacity: 0.72,
      samples: 96,
    },
    sections: [
      {
        id: 'eyeAxis',
        title: 'Eye axis',
        fields: ['axisWidth', 'axisHeight', 'gridMode', 'xlabel', 'ylabel', 'plotTitle'],
      },
      {
        id: 'eyeTrace',
        title: 'Traces',
        fields: ['plotSmooth', 'samples', 'drawOpacity', 'addplotExtraOptions', 'datasetTag'],
      },
    ],
  },
  plotFrequencyResponse: {
    id: 'plotFrequencyResponse',
    title: 'Frequency response',
    defaults: {
      axisWidth: 4.8,
      axisHeight: 3.2,
      xMode: 'log',
      gridMode: 'major',
      xlabel: '$\\omega$',
      ylabel: '$|H(j\\omega)|$',
      plotSmooth: true,
    },
    sections: [
      {
        id: 'frequencyAxis',
        title: 'Frequency response axis',
        fields: ['axisWidth', 'axisHeight', 'xMode', 'yMode', 'gridMode', 'minorTicks', 'xlabel', 'ylabel', 'plotTitle'],
      },
      {
        id: 'frequencyTrace',
        title: 'Trace',
        fields: ['plotSmooth', 'plotDomain', 'samples', 'markStyle', 'addplotExtraOptions'],
      },
    ],
  },
  plotImpulseResponse: {
    id: 'plotImpulseResponse',
    title: 'Impulse response',
    defaults: {
      axisWidth: 4.8,
      axisHeight: 3.2,
      xlabel: '$n$',
      ylabel: '$h[n]$',
      gridMode: 'major',
      stemPlot: true,
      markStyle: '*',
    },
    sections: [
      {
        id: 'impulseAxis',
        title: 'Discrete-time axis',
        fields: ['axisWidth', 'axisHeight', 'gridMode', 'xlabel', 'ylabel', 'plotTitle', 'xtick', 'ytick'],
      },
      {
        id: 'impulseSamples',
        title: 'Samples',
        fields: ['stemPlot', 'markStyle', 'addplotExtraOptions', 'datasetTag'],
      },
    ],
  },
  plotHeatmap: {
    id: 'plotHeatmap',
    title: 'Heatmap',
    defaults: {
      axisWidth: 4.4,
      axisHeight: 3.4,
      colorbar: true,
      colormap: 'viridis',
      shader: 'flat',
      viewAzimuth: 0,
      viewElevation: 90,
    },
    sections: [
      {
        id: 'heatmapAxis',
        title: 'Heatmap axis',
        fields: ['axisWidth', 'axisHeight', 'xlabel', 'ylabel', 'colorbar', 'colormap', 'viewAzimuth', 'viewElevation'],
      },
      {
        id: 'heatmapSurface',
        title: 'Cells',
        fields: ['shader', 'pointMeta', 'axisExtraOptions', 'addplotExtraOptions'],
      },
    ],
  },
  plotStatistical: {
    id: 'plotStatistical',
    title: 'Statistical plot',
    defaults: {
      axisWidth: 5,
      axisHeight: 3.2,
      gridMode: 'major',
      markStyle: '*',
    },
    sections: [
      {
        id: 'statAxis',
        title: 'Statistical axis',
        fields: ['axisWidth', 'axisHeight', 'axisLines', 'gridMode', 'xlabel', 'ylabel', 'plotTitle', 'legendPos', 'legendColumns'],
      },
      {
        id: 'statMarks',
        title: 'Marks and data',
        fields: ['markStyle', 'plotSmooth', 'constPlot', 'errorBars', 'errorBarOptions', 'dataTable', 'addplotExtraOptions'],
      },
    ],
  },
  genericPlot: {
    id: 'genericPlot',
    title: 'PGFPlots object',
    defaults: {},
    sections: [
      {
        id: 'plotAxis',
        title: 'Plot axis',
        fields: [
          'axisWidth',
          'axisHeight',
          'axisLines',
          'gridMode',
          'xMode',
          'yMode',
          'xlabel',
          'ylabel',
          'plotTitle',
          'legendPos',
          'legendColumns',
          'minorTicks',
        ],
      },
      {
        id: 'plotTrace',
        title: 'Plot trace',
        fields: [
          'plotDomain',
          'samples',
          'markStyle',
          'plotSmooth',
          'axisEqual',
          'reverseX',
          'reverseY',
          'colormap',
          'constPlot',
          'dataTable',
          'errorBars',
          'errorBarOptions',
          'axisExtraOptions',
          'addplotExtraOptions',
        ],
      },
    ],
  },
  opampComposite: {
    id: 'opampComposite',
    title: 'Op-amp schematic',
    defaults: {
      inputLabel: '$v_i$',
      outputLabel: '$v_o$',
      feedbackLabel: '$R_f$',
      componentLabels: '$R_{in}$, $R_f$, $C_f$',
      supplyLabel: '$V_{CC}$',
      groundLabel: '',
      circuitStyle: 'american',
    },
    sections: [
      {
        id: 'opampLabels',
        title: 'Op-amp labels',
        fields: [
          'inputLabel',
          'outputLabel',
          'feedbackLabel',
          'componentLabels',
          'supplyLabel',
          'groundLabel',
          'circuitStyle',
          'terminalNames',
          'netName',
          'referenceName',
        ],
      },
    ],
  },
  circuitPrimitive: {
    id: 'circuitPrimitive',
    title: 'CircuitikZ bipole',
    defaults: {
      circuitStyle: 'american',
    },
    sections: [
      {
        id: 'bipole',
        title: 'CircuitikZ bipole',
        fields: [
          'autoLabel',
          'circuitLabel',
          'circuitValue',
          'circuitLabelPosition',
          'voltageLabel',
          'currentLabel',
          'circuitOrientation',
          'circuitStyle',
          'terminalStyle',
          'terminalLength',
          'bipoleLength',
          'mirrorComponent',
          'invertComponent',
          'terminalNames',
          'netName',
          'spiceModel',
          'referenceName',
        ],
      },
    ],
  },
  circuitComposite: {
    id: 'circuitComposite',
    title: 'Circuit schematic',
    defaults: {
      inputLabel: '$v_i$',
      outputLabel: '$v_o$',
      componentLabels: '$R$, $L$, $C$',
      supplyLabel: '$V_{CC}$',
      groundLabel: '',
      circuitStyle: 'american',
    },
    sections: [
      {
        id: 'schematicLabels',
        title: 'Schematic labels',
        fields: ['inputLabel', 'outputLabel', 'componentLabels', 'supplyLabel', 'groundLabel', 'circuitStyle', 'terminalNames', 'netName', 'spiceModel', 'referenceName'],
      },
    ],
  },
  telecomChannel: {
    id: 'telecomChannel',
    title: 'Telecom channel',
    defaults: {
      inputLabel: '$x(t)$',
      outputLabel: '$y(t)$',
      channelLabel: '$h(t)$',
      noiseLabel: '$n(t)$',
      snrLabel: 'SNR',
      modulation: 'QPSK',
      carrierLabel: '$f_c$',
      gainDb: 0,
    },
    sections: [
      {
        id: 'channelLabels',
        title: 'Channel model',
        fields: ['inputLabel', 'outputLabel', 'channelLabel', 'noiseLabel', 'snrLabel', 'modulation', 'carrierLabel', 'gainDb'],
      },
    ],
  },
  telecomOfdm: {
    id: 'telecomOfdm',
    title: 'OFDM chain',
    defaults: {
      inputLabel: '$b_k$',
      outputLabel: '$s(t)$',
      blockLabels: 'Bits, QAM, S/P, IFFT, CP',
      signalLabel: '$X_k$',
      carrierLabel: '$e^{j2\\pi f_c t}$',
      modulation: 'OFDM/QAM',
      branchCount: 5,
    },
    sections: [
      {
        id: 'ofdmChain',
        title: 'OFDM chain',
        fields: ['inputLabel', 'outputLabel', 'blockLabels', 'signalLabel', 'carrierLabel', 'modulation', 'branchCount', 'noiseLabel'],
      },
    ],
  },
  telecomMimo: {
    id: 'telecomMimo',
    title: 'MIMO link',
    defaults: {
      inputLabel: '$\\mathbf{s}$',
      outputLabel: '$\\hat{\\mathbf{s}}$',
      channelLabel: '$\\mathbf{H}$',
      blockLabels: 'precoder, equalizer',
      branchCount: 3,
      modulation: 'MIMO',
    },
    sections: [
      {
        id: 'mimoLink',
        title: 'MIMO link',
        fields: ['inputLabel', 'outputLabel', 'channelLabel', 'blockLabels', 'branchCount', 'modulation', 'noiseLabel'],
      },
    ],
  },
  rfChain: {
    id: 'rfChain',
    title: 'RF chain',
    defaults: {
      inputLabel: '$r_{RF}(t)$',
      outputLabel: '$r_{IF}(t)$',
      blockLabels: 'Antenna, LNA, BPF, Mixer, IF',
      carrierLabel: 'LO',
      gainDb: 20,
      noiseLabel: 'NF',
      terminalNames: 'RF in, IF out',
    },
    sections: [
      {
        id: 'rfChain',
        title: 'RF chain',
        fields: ['inputLabel', 'outputLabel', 'blockLabels', 'carrierLabel', 'gainDb', 'noiseLabel', 'terminalNames'],
      },
    ],
  },
  telecomBlock: {
    id: 'telecomBlock',
    title: 'Telecom block',
    defaults: {},
    sections: [
      {
        id: 'telecomBlock',
        title: 'Telecom block',
        fields: ['inputLabel', 'outputLabel', 'signalLabel', 'carrierLabel', 'modulation', 'gainDb', 'noiseLabel', 'terminalNames'],
      },
    ],
  },
  matrixObject: {
    id: 'matrixObject',
    title: 'Matrix object',
    defaults: {},
    sections: [
      {
        id: 'matrixLayout',
        title: 'Matrix layout',
        fields: ['matrixDelimiter', 'rowSep', 'columnSep', 'matrixEntries', 'minWidth', 'minHeight', 'align'],
      },
    ],
  },
  graphObject: {
    id: 'graphObject',
    title: 'Graph or flow object',
    defaults: {},
    sections: [
      {
        id: 'graphLayout',
        title: 'Graph layout',
        fields: ['nodeDistance', 'layerDistance', 'siblingDistance', 'edgeStyle', 'edgeLabels', 'nodeLabels', 'connectNodes'],
      },
    ],
  },
  shapeObject: {
    id: 'shapeObject',
    title: 'Shape object',
    defaults: {},
    sections: [
      {
        id: 'shapeGeometry',
        title: 'Shape geometry',
        fields: ['shapeVariant', 'shapeAspect', 'cloudPuffs', 'splitParts', 'calloutPointerX', 'calloutPointerY', 'innerSep', 'minWidth', 'minHeight', 'textWidth'],
      },
    ],
  },
  paperObject: {
    id: 'paperObject',
    title: 'Paper annotation',
    defaults: {},
    sections: [
      {
        id: 'paperAnnotation',
        title: 'Paper annotation',
        fields: ['paperRole', 'datasetTag', 'referenceName', 'metadataJson', 'align', 'fontSize', 'fontSeries'],
      },
    ],
  },
}

const exactProfileIds = new Map([
  ['plot-ber', 'plotBer'],
  ['plot-constellation', 'plotConstellation'],
  ['plot-spectrogram', 'plotSpectrogram'],
  ['plot-heatmap', 'plotHeatmap'],
  ['plot-spectrum', 'plotSpectrum'],
  ['plot-eye', 'plotEye'],
  ['plot-frequency-response', 'plotFrequencyResponse'],
  ['plot-impulse-response', 'plotImpulseResponse'],
  ['circuit-inverting-amplifier', 'opampComposite'],
  ['circuit-opamp-lowpass', 'opampComposite'],
  ['circuit-opamp-filter', 'opampComposite'],
  ['circuit-opamp', 'opampComposite'],
  ['telecom-awgn-channel', 'telecomChannel'],
  ['telecom-channel', 'telecomChannel'],
  ['telecom-ofdm-transmitter', 'telecomOfdm'],
  ['telecom-ofdm-receiver', 'telecomOfdm'],
  ['telecom-mimo-link', 'telecomMimo'],
  ['telecom-mimo-tx', 'telecomMimo'],
  ['telecom-mimo-channel', 'telecomMimo'],
  ['telecom-mimo-rx', 'telecomMimo'],
  ['rf-front-end', 'rfChain'],
  ['telecom-superhet', 'rfChain'],
])

const statisticalPlotIds = new Set([
  'plot-scatter',
  'plot-bar',
  'plot-histogram',
  'plot-boxplot',
  'plot-error-bars',
  'plot-confidence-band',
  'stats-qq',
  'stats-violin',
  'ml-roc',
  'ml-training-curve',
])

const primitiveCircuitPreviews = new Set([
  'resistor',
  'capacitor',
  'inductor',
  'diode',
  'source',
  'current-source',
  'switch',
  'port',
  'transmission-line',
  'voltmeter',
  'ammeter',
  'controlled-source',
])

function profileIdForPreset(preset = {}) {
  if (exactProfileIds.has(preset.id)) return exactProfileIds.get(preset.id)
  const id = `${preset.id ?? ''}`.toLowerCase()
  const group = `${preset.group ?? ''}`.toLowerCase()
  const preview = `${preset.preview ?? ''}`.toLowerCase()
  const title = `${preset.title ?? ''}`.toLowerCase()
  const text = `${id} ${group} ${preview} ${title}`

  if (statisticalPlotIds.has(preset.id)) return 'plotStatistical'
  if (group === 'plots' || preview === 'plot' || id.startsWith('plot-')) return 'genericPlot'
  if (primitiveCircuitPreviews.has(preview) || (group === 'circuit' && !text.includes('opamp') && !text.includes('bridge'))) {
    return 'circuitPrimitive'
  }
  if (group === 'circuit' || text.includes('circuit')) return 'circuitComposite'
  if (id.startsWith('rf-')) return 'rfChain'
  if (group === 'telecom' || id.startsWith('telecom-')) return 'telecomBlock'
  if (preview === 'matrix' || text.includes('matrix') || text.includes('table')) return 'matrixObject'
  if (preview === 'network' || text.includes('graph') || text.includes('automata') || text.includes('petri')) return 'graphObject'
  if (group === 'shapes' || preview === 'flow' || text.includes('shape') || text.includes('flow')) return 'shapeObject'
  if (group === 'annotation' || group === 'paper' || text.includes('annot')) return 'paperObject'
  return 'paperObject'
}

export function libraryObjectProfileForPreset(preset = {}) {
  const profileId = profileIdForPreset(preset)
  return exactProfiles[profileId] ?? exactProfiles.paperObject
}

export function libraryProfileSectionSpecsForPreset(preset = {}) {
  return libraryObjectProfileForPreset(preset).sections.map((section) => ({
    ...section,
    fields: [...section.fields],
  }))
}

export function libraryProfileDefaultConfig(preset = {}) {
  return { ...libraryObjectProfileForPreset(preset).defaults }
}

export function libraryProfileFieldKeysForPreset(preset = {}) {
  return new Set(libraryProfileSectionSpecsForPreset(preset).flatMap((section) => section.fields))
}
