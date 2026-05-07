const plotAxisLimitFields = ['xmin', 'xmax', 'ymin', 'ymax']
const plotAxisStyleFields = [
  'xLabelStyle',
  'yLabelStyle',
  'tickLabelStyle',
  'legendStyle',
  'axisLineStyle',
  'gridLineStyle',
  'enlargeLimits',
]

const commonProfileSections = [
  {
    id: 'commonPaperStyle',
    title: 'Paper style',
    fields: [
      'lineCap',
      'lineJoin',
      'drawOpacity',
      'textOpacity',
      'dashPattern',
      'roundedCorners',
      'shadow',
      'pattern',
    ],
  },
  {
    id: 'commonTextNode',
    title: 'Text and node',
    fields: [
      'align',
      'anchor',
      'fontSize',
      'fontSeries',
      'innerSep',
      'outerSep',
      'minWidth',
      'minHeight',
      'textWidth',
    ],
  },
  {
    id: 'commonMetadata',
    title: 'Export metadata',
    fields: ['paperRole', 'datasetTag', 'referenceName', 'metadataJson'],
  },
]

function sectionsWithCommonControls(sections = []) {
  const seen = new Set(sections.flatMap((section) => section.fields))
  const merged = sections.map((section) => ({
    ...section,
    fields: [...section.fields],
  }))

  commonProfileSections.forEach((section) => {
    const fields = section.fields.filter((field) => !seen.has(field))
    fields.forEach((field) => seen.add(field))
    if (fields.length) merged.push({ ...section, fields })
  })

  return merged
}

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
          ...plotAxisLimitFields,
          'minorTicks',
          'xlabel',
          'ylabel',
          'plotTitle',
          'legendPos',
          'legendColumns',
          ...plotAxisStyleFields,
          'markStyle',
          'plotSmooth',
          'plotDomain',
          'samples',
          'addplotExtraOptions',
          'dataTable',
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
        fields: [
          'axisWidth',
          'axisHeight',
          'axisLines',
          'axisEqual',
          'gridMode',
          ...plotAxisLimitFields,
          'xlabel',
          'ylabel',
          'xtick',
          'ytick',
          ...plotAxisStyleFields,
        ],
      },
      {
        id: 'constellationSymbols',
        title: 'Symbols',
        fields: ['modulation', 'markStyle', 'dataTable', 'addplotExtraOptions', 'datasetTag'],
      },
    ],
  },
  plotBar: {
    id: 'plotBar',
    title: 'Bar chart',
    defaults: {
      axisWidth: 5,
      axisHeight: 3.2,
      gridMode: 'major',
      ymin: '0',
      ylabel: 'value',
      barCount: 3,
      barData: 'A,2\nB,3.5\nC,2.8',
    },
    sections: [
      {
        id: 'barChartBars',
        title: 'Barras',
        fields: [
          'barCount',
          'barData',
          'axisWidth',
          'axisHeight',
          'gridMode',
          'ymin',
          'ymax',
          'xlabel',
          'ylabel',
          'plotTitle',
          'axisExtraOptions',
          'addplotExtraOptions',
        ],
      },
    ],
  },
  ganttTimeline: {
    id: 'ganttTimeline',
    title: 'Gantt timeline',
    defaults: {
      barCount: 3,
      ganttStart: 1,
      ganttEnd: 7,
      ganttProgress: 0,
      plotTitle: 'Plan',
      ganttTasks: 'prep,1,2\ntrain,2,5\nwrite,5,7',
    },
    sections: [
      {
        id: 'ganttBars',
        title: 'Barras Gantt',
        fields: ['barCount', 'ganttStart', 'ganttEnd', 'ganttProgress', 'plotTitle', 'ganttTasks', 'datasetTag'],
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
        fields: [
          'axisWidth',
          'axisHeight',
          ...plotAxisLimitFields,
          'xlabel',
          'ylabel',
          'colorbar',
          'colormap',
          'viewAzimuth',
          'viewElevation',
          ...plotAxisStyleFields,
        ],
      },
      {
        id: 'spectrogramSurface',
        title: 'Surface rendering',
        fields: ['shader', 'pointMeta', 'samples', 'dataTable', 'axisExtraOptions', 'addplotExtraOptions'],
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
        fields: [
          'axisWidth',
          'axisHeight',
          'xMode',
          'yMode',
          'gridMode',
          ...plotAxisLimitFields,
          'minorTicks',
          'xlabel',
          'ylabel',
          'plotTitle',
          ...plotAxisStyleFields,
        ],
      },
      {
        id: 'spectrumTrace',
        title: 'Trace',
        fields: ['plotSmooth', 'plotDomain', 'samples', 'markStyle', 'dataTable', 'addplotExtraOptions'],
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
        fields: [
          'axisWidth',
          'axisHeight',
          'gridMode',
          ...plotAxisLimitFields,
          'xlabel',
          'ylabel',
          'plotTitle',
          ...plotAxisStyleFields,
        ],
      },
      {
        id: 'eyeTrace',
        title: 'Traces',
        fields: ['plotSmooth', 'samples', 'drawOpacity', 'dataTable', 'addplotExtraOptions', 'datasetTag'],
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
        fields: [
          'axisWidth',
          'axisHeight',
          'xMode',
          'yMode',
          'gridMode',
          ...plotAxisLimitFields,
          'minorTicks',
          'xlabel',
          'ylabel',
          'plotTitle',
          ...plotAxisStyleFields,
        ],
      },
      {
        id: 'frequencyTrace',
        title: 'Trace',
        fields: ['plotSmooth', 'plotDomain', 'samples', 'markStyle', 'dataTable', 'addplotExtraOptions'],
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
        fields: [
          'axisWidth',
          'axisHeight',
          'gridMode',
          ...plotAxisLimitFields,
          'xlabel',
          'ylabel',
          'plotTitle',
          'xtick',
          'ytick',
          ...plotAxisStyleFields,
        ],
      },
      {
        id: 'impulseSamples',
        title: 'Samples',
        fields: ['stemPlot', 'markStyle', 'dataTable', 'addplotExtraOptions', 'datasetTag'],
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
        fields: [
          'axisWidth',
          'axisHeight',
          ...plotAxisLimitFields,
          'xlabel',
          'ylabel',
          'colorbar',
          'colormap',
          'viewAzimuth',
          'viewElevation',
          ...plotAxisStyleFields,
        ],
      },
      {
        id: 'heatmapSurface',
        title: 'Cells',
        fields: ['shader', 'pointMeta', 'dataTable', 'axisExtraOptions', 'addplotExtraOptions'],
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
        fields: [
          'axisWidth',
          'axisHeight',
          'axisLines',
          'gridMode',
          ...plotAxisLimitFields,
          'xlabel',
          'ylabel',
          'plotTitle',
          'legendPos',
          'legendColumns',
          ...plotAxisStyleFields,
        ],
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
          ...plotAxisLimitFields,
          'xlabel',
          'ylabel',
          'plotTitle',
          'legendPos',
          'legendColumns',
          'minorTicks',
          ...plotAxisStyleFields,
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
      circuitLabel: 'U_1',
      circuitValue: '',
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
          'circuitLabel',
          'circuitValue',
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
  opampFilter: {
    id: 'opampFilter',
    title: 'Op-amp filter',
    defaults: {
      inputLabel: '$v_i$',
      outputLabel: '$v_o$',
      feedbackLabel: '',
      componentLabels: '$R$, $C$',
      circuitLabel: 'U_1',
      circuitValue: '',
      supplyLabel: '',
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
          'circuitLabel',
          'circuitValue',
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
      circuitLabel: 'X_1',
      circuitValue: '',
      supplyLabel: '$V_{CC}$',
      groundLabel: '',
      circuitStyle: 'american',
    },
    sections: [
      {
        id: 'schematicLabels',
        title: 'Schematic labels',
        fields: [
          'inputLabel',
          'outputLabel',
          'componentLabels',
          'circuitLabel',
          'circuitValue',
          'supplyLabel',
          'groundLabel',
          'circuitStyle',
          'terminalNames',
          'netName',
          'spiceModel',
          'referenceName',
        ],
      },
    ],
  },
  circuitWheatstone: {
    id: 'circuitWheatstone',
    title: 'Wheatstone bridge',
    defaults: {
      inputLabel: '',
      outputLabel: '$V_o$',
      componentLabels: '$R_1$, $R_2$, $R_3$, $R_4$',
      circuitLabel: 'X_1',
      circuitValue: '',
      supplyLabel: '',
      groundLabel: '',
      circuitStyle: 'american',
    },
    sections: [
      {
        id: 'schematicLabels',
        title: 'Schematic labels',
        fields: [
          'inputLabel',
          'outputLabel',
          'componentLabels',
          'circuitLabel',
          'circuitValue',
          'supplyLabel',
          'groundLabel',
          'circuitStyle',
          'terminalNames',
          'netName',
          'spiceModel',
          'referenceName',
        ],
      },
    ],
  },
  circuitDifferentialPair: {
    id: 'circuitDifferentialPair',
    title: 'Differential pair',
    defaults: {
      inputLabel: '$v_{id}$',
      outputLabel: '$v_o$',
      componentLabels: '$Q_1$, $Q_2$, $I_T$',
      circuitLabel: 'Q_1',
      circuitValue: '',
      supplyLabel: '',
      groundLabel: '',
      circuitStyle: 'american',
    },
    sections: [
      {
        id: 'schematicLabels',
        title: 'Schematic labels',
        fields: [
          'inputLabel',
          'outputLabel',
          'componentLabels',
          'circuitLabel',
          'circuitValue',
          'supplyLabel',
          'groundLabel',
          'circuitStyle',
          'terminalNames',
          'netName',
          'spiceModel',
          'referenceName',
        ],
      },
    ],
  },
  circuitCommonEmitter: {
    id: 'circuitCommonEmitter',
    title: 'Common emitter stage',
    defaults: {
      inputLabel: '$v_i$',
      outputLabel: '$v_o$',
      componentLabels: '$C_{in}$, $R_C$, $R_E$, $C_o$, $R_B$',
      circuitLabel: 'Q_1',
      circuitValue: '',
      supplyLabel: '$V_{CC}$',
      groundLabel: '',
      circuitStyle: 'american',
    },
    sections: [
      {
        id: 'schematicLabels',
        title: 'Schematic labels',
        fields: [
          'inputLabel',
          'outputLabel',
          'componentLabels',
          'circuitLabel',
          'circuitValue',
          'supplyLabel',
          'groundLabel',
          'circuitStyle',
          'terminalNames',
          'netName',
          'spiceModel',
          'referenceName',
        ],
      },
    ],
  },
  circuitRlcTank: {
    id: 'circuitRlcTank',
    title: 'RLC network',
    defaults: {
      inputLabel: '$v$',
      outputLabel: '',
      componentLabels: '$R$, $L$, $C$',
      circuitLabel: 'X_1',
      circuitValue: '',
      supplyLabel: '',
      groundLabel: '',
      circuitStyle: 'american',
    },
    sections: [
      {
        id: 'schematicLabels',
        title: 'Schematic labels',
        fields: [
          'inputLabel',
          'outputLabel',
          'componentLabels',
          'circuitLabel',
          'circuitValue',
          'supplyLabel',
          'groundLabel',
          'circuitStyle',
          'terminalNames',
          'netName',
          'spiceModel',
          'referenceName',
        ],
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
      symbolCount: 6,
      subcarrierCount: 4,
      pilotSpacing: 3,
      branchCount: 5,
    },
    sections: [
      {
        id: 'ofdmChain',
        title: 'OFDM chain',
        fields: [
          'inputLabel',
          'outputLabel',
          'blockLabels',
          'signalLabel',
          'carrierLabel',
          'modulation',
          'symbolCount',
          'subcarrierCount',
          'pilotSpacing',
          'branchCount',
          'noiseLabel',
        ],
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
      antennaCount: 3,
      branchCount: 3,
      modulation: 'MIMO',
    },
    sections: [
      {
        id: 'mimoLink',
        title: 'MIMO link',
        fields: ['inputLabel', 'outputLabel', 'channelLabel', 'blockLabels', 'antennaCount', 'branchCount', 'modulation', 'noiseLabel'],
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
  fecChain: {
    id: 'fecChain',
    title: 'FEC chain',
    defaults: {
      inputLabel: 'bits',
      outputLabel: 'decoded bits',
      blockLabels: 'CRC, LDPC encoder, Interleaver, QAM mapper, Channel, Demapper, LDPC decoder',
      signalLabel: '$c_k$',
      modulation: 'rate 1/2',
      branchCount: 7,
      noiseLabel: '$e_k$',
    },
    sections: [
      {
        id: 'fecChain',
        title: 'FEC chain',
        fields: ['inputLabel', 'outputLabel', 'blockLabels', 'signalLabel', 'modulation', 'branchCount', 'noiseLabel', 'datasetTag'],
      },
    ],
  },
  feedbackLoop: {
    id: 'feedbackLoop',
    title: 'Feedback loop',
    defaults: {
      inputLabel: 'reference',
      outputLabel: 'locked output',
      feedbackLabel: 'estimate',
      blockLabels: 'Timing error, Loop filter, NCO, Resampler',
      edgeLabels: 'error, filtered, control',
      signalLabel: '$e[n]$',
      carrierLabel: '$\\hat{\\tau}$',
      nodeDistance: 1.35,
    },
    sections: [
      {
        id: 'feedbackLoop',
        title: 'Feedback loop',
        fields: [
          'inputLabel',
          'outputLabel',
          'feedbackLabel',
          'blockLabels',
          'edgeLabels',
          'signalLabel',
          'carrierLabel',
          'nodeDistance',
          'referenceName',
        ],
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
        fields: [
          'inputLabel',
          'outputLabel',
          'blockLabels',
          'nodeLabels',
          'edgeLabels',
          'signalLabel',
          'carrierLabel',
          'modulation',
          'branchCount',
          'nodeDistance',
          'gainDb',
          'noiseLabel',
          'terminalNames',
        ],
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
  confusionMatrix: {
    id: 'confusionMatrix',
    title: 'Confusion matrix',
    defaults: {
      classLabels: 'negative, positive',
      matrixEntries: '42,3\n5,50',
      inputLabel: 'Actual',
      outputLabel: 'Predicted',
    },
    sections: [
      {
        id: 'confusionMatrix',
        title: 'Confusion matrix',
        fields: ['classLabels', 'matrixEntries', 'inputLabel', 'outputLabel', 'datasetTag'],
      },
    ],
  },
  telecomResourceGrid: {
    id: 'telecomResourceGrid',
    title: 'Resource grid',
    defaults: {
      symbolCount: 6,
      subcarrierCount: 4,
      pilotSpacing: 3,
      blockLabels: 'pilot,data,guard',
      inputLabel: 'subcarrier',
      outputLabel: 'symbol',
    },
    sections: [
      {
        id: 'resourceGrid',
        title: 'Resource grid',
        fields: ['symbolCount', 'subcarrierCount', 'pilotSpacing', 'blockLabels', 'inputLabel', 'outputLabel', 'datasetTag'],
      },
    ],
  },
  tannerGraph: {
    id: 'tannerGraph',
    title: 'Tanner graph',
    defaults: {
      variableCount: 4,
      checkCount: 2,
    },
    sections: [
      {
        id: 'tannerGraph',
        title: 'Tanner graph',
        fields: ['variableCount', 'checkCount', 'edgeLabels', 'nodeLabels', 'blockLabels', 'datasetTag'],
      },
    ],
  },
  mimoOfdmDiagram: {
    id: 'mimoOfdmDiagram',
    title: 'MIMO-OFDM downlink',
    defaults: {
      antennaCount: 3,
      inputLabel: 'layers',
      outputLabel: '$\\hat{s}_\\ell$',
      channelLabel: '$\\mathbf{H}[k]$',
      blockLabels: 'layers, precoder, OFDM TX, channel, equalizer',
    },
    sections: [
      {
        id: 'mimoOfdm',
        title: 'MIMO-OFDM',
        fields: ['antennaCount', 'inputLabel', 'outputLabel', 'channelLabel', 'blockLabels', 'modulation', 'datasetTag'],
      },
    ],
  },
  linkBudgetTable: {
    id: 'linkBudgetTable',
    title: 'Link budget',
    defaults: {
      budgetRows: 'Tx power,20 dBm\nAntenna gain,12 dBi\nPath loss,-102 dB\nRx power,-70 dBm',
    },
    sections: [
      {
        id: 'linkBudget',
        title: 'Link budget',
        fields: ['budgetRows', 'inputLabel', 'outputLabel', 'gainDb', 'datasetTag'],
      },
    ],
  },
  classDiagram: {
    id: 'classDiagram',
    title: 'UML class',
    defaults: {
      nodeLabels: 'Model',
      matrixEntries: '+ weights: Tensor\n+ train(): void',
      blockLabels: 'Model, + weights: Tensor, + train(): void',
    },
    sections: [
      {
        id: 'classDiagram',
        title: 'UML class',
        fields: ['nodeLabels', 'matrixEntries', 'blockLabels', 'minWidth', 'minHeight', 'align', 'referenceName'],
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
        fields: ['nodeLabels', 'edgeLabels', 'connectNodes', 'branchCount', 'nodeDistance', 'layerDistance', 'siblingDistance', 'edgeStyle', 'blockLabels'],
      },
    ],
  },
  flowDiagram: {
    id: 'flowDiagram',
    title: 'Flow diagram',
    defaults: {
      branchCount: 3,
    },
    sections: [
      {
        id: 'flowStructure',
        title: 'Flow structure',
        fields: ['blockLabels', 'edgeLabels', 'inputLabel', 'outputLabel', 'signalLabel', 'branchCount', 'nodeDistance', 'nodeLabels'],
      },
    ],
  },
  mlDiagram: {
    id: 'mlDiagram',
    title: 'ML/DL diagram',
    defaults: {
      branchCount: 3,
    },
    sections: [
      {
        id: 'mlStructure',
        title: 'Model structure',
        fields: [
          'blockLabels',
          'nodeLabels',
          'edgeLabels',
          'inputLabel',
          'outputLabel',
          'signalLabel',
          'branchCount',
          'layerDistance',
          'nodeDistance',
          'datasetTag',
        ],
      },
    ],
  },
  controlLoopDiagram: {
    id: 'controlLoopDiagram',
    title: 'Control loop',
    defaults: {
      branchCount: 4,
    },
    sections: [
      {
        id: 'controlLoop',
        title: 'Loop semantics',
        fields: ['blockLabels', 'edgeLabels', 'inputLabel', 'outputLabel', 'feedbackLabel', 'signalLabel', 'nodeDistance', 'referenceName'],
      },
    ],
  },
  commutativeDiagram: {
    id: 'commutativeDiagram',
    title: 'Commutative diagram',
    defaults: {},
    sections: [
      {
        id: 'commutativeLayout',
        title: 'Objects and arrows',
        fields: ['nodeLabels', 'edgeLabels', 'nodeDistance', 'layerDistance', 'referenceName'],
      },
    ],
  },
  setDiagram: {
    id: 'setDiagram',
    title: 'Set diagram',
    defaults: {},
    sections: [
      {
        id: 'setLabels',
        title: 'Sets',
        fields: ['nodeLabels', 'blockLabels', 'datasetTag', 'referenceName'],
      },
    ],
  },
  sequenceDiagram: {
    id: 'sequenceDiagram',
    title: 'Sequence diagram',
    defaults: {
      branchCount: 2,
    },
    sections: [
      {
        id: 'sequenceMessages',
        title: 'Actors and messages',
        fields: ['nodeLabels', 'edgeLabels', 'branchCount', 'nodeDistance', 'referenceName'],
      },
    ],
  },
  usecaseDiagram: {
    id: 'usecaseDiagram',
    title: 'Use case diagram',
    defaults: {},
    sections: [
      {
        id: 'usecaseActors',
        title: 'Actor and cases',
        fields: ['inputLabel', 'blockLabels', 'nodeLabels', 'referenceName'],
      },
    ],
  },
  entityDiagram: {
    id: 'entityDiagram',
    title: 'ER diagram',
    defaults: {},
    sections: [
      {
        id: 'entityRelation',
        title: 'Entities and relation',
        fields: ['blockLabels', 'matrixEntries', 'nodeLabels', 'referenceName'],
      },
    ],
  },
  panelDiagram: {
    id: 'panelDiagram',
    title: 'Paper panels',
    defaults: {
      branchCount: 3,
    },
    sections: [
      {
        id: 'panelLayout',
        title: 'Panel layout',
        fields: ['blockLabels', 'nodeLabels', 'branchCount', 'paperRole', 'datasetTag', 'referenceName'],
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
  ['gantt-paper', 'ganttTimeline'],
  ['pgfgantt-native', 'ganttTimeline'],
  ['plot-bar', 'plotBar'],
  ['plot-ber', 'plotBer'],
  ['plot-constellation', 'plotConstellation'],
  ['plot-spectrogram', 'plotSpectrogram'],
  ['plot-heatmap', 'plotHeatmap'],
  ['plot-spectrum', 'plotSpectrum'],
  ['plot-eye', 'plotEye'],
  ['plot-frequency-response', 'plotFrequencyResponse'],
  ['plot-impulse-response', 'plotImpulseResponse'],
  ['commutative-square', 'commutativeDiagram'],
  ['math-comm-triangle', 'commutativeDiagram'],
  ['math-venn', 'setDiagram'],
  ['ml-confusion', 'confusionMatrix'],
  ['telecom-ofdm-resource-grid', 'telecomResourceGrid'],
  ['telecom-5g-nr-frame', 'telecomResourceGrid'],
  ['telecom-ldpc-tanner', 'tannerGraph'],
  ['telecom-mimo-ofdm-downlink', 'mimoOfdmDiagram'],
  ['telecom-link-budget', 'linkBudgetTable'],
  ['uml-sequence', 'sequenceDiagram'],
  ['uml-usecase', 'usecaseDiagram'],
  ['uml-class', 'classDiagram'],
  ['er-entity', 'entityDiagram'],
  ['paper-multi-panel', 'panelDiagram'],
  ['control-kalman-filter', 'controlLoopDiagram'],
  ['circuit-wheatstone', 'circuitWheatstone'],
  ['circuit-rlc-series', 'circuitRlcTank'],
  ['circuit-differential-pair', 'circuitDifferentialPair'],
  ['circuit-inverting-amplifier', 'opampComposite'],
  ['circuit-opamp-lowpass', 'opampComposite'],
  ['circuit-opamp-filter', 'opampFilter'],
  ['circuit-opamp', 'opampComposite'],
  ['circuit-common-emitter', 'circuitCommonEmitter'],
  ['circuit-rlc-parallel', 'circuitRlcTank'],
  ['telecom-awgn-channel', 'telecomChannel'],
  ['telecom-channel', 'telecomChannel'],
  ['telecom-ofdm-transmitter', 'telecomOfdm'],
  ['telecom-ofdm-receiver', 'telecomOfdm'],
  ['telecom-ofdm-pilot-estimator', 'telecomOfdm'],
  ['telecom-ofdm-transceiver', 'telecomOfdm'],
  ['telecom-fec-chain', 'fecChain'],
  ['telecom-synchronization-loop', 'feedbackLoop'],
  ['telecom-pll', 'feedbackLoop'],
  ['telecom-feedback-loop', 'feedbackLoop'],
  ['telecom-adaptive-equalizer', 'feedbackLoop'],
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
  if (group === 'control') return 'controlLoopDiagram'
  if (group === 'paper' || text.includes('multi-panel')) return 'panelDiagram'
  if (group === 'flow') return 'flowDiagram'
  if (group === 'ml / dl' || preview === 'cube' || text.includes('pipeline')) return 'mlDiagram'
  if (group === 'uml') return 'flowDiagram'
  if (group === 'er') return 'entityDiagram'
  if (group === 'shapes' || text.includes('shape')) return 'shapeObject'
  if (preview === 'flow' || text.includes('flow')) return 'flowDiagram'
  if (group === 'annotation' || text.includes('annot')) return 'paperObject'
  return 'paperObject'
}

export function libraryObjectProfileForPreset(preset = {}) {
  const profileId = profileIdForPreset(preset)
  return exactProfiles[profileId] ?? exactProfiles.paperObject
}

export function libraryProfileSectionSpecsForPreset(preset = {}) {
  return sectionsWithCommonControls(libraryObjectProfileForPreset(preset).sections)
}

export function libraryProfileDefaultConfig(preset = {}) {
  return { ...libraryObjectProfileForPreset(preset).defaults }
}

export function libraryProfileFieldKeysForPreset(preset = {}) {
  return new Set(libraryProfileSectionSpecsForPreset(preset).flatMap((section) => section.fields))
}
