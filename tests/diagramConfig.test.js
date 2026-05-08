import assert from 'node:assert/strict'
import test from 'node:test'
import {
  circuitLabelsForConfig,
  defaultDiagramConfigForKind,
  diagramConfigForElement,
  dlLayersForConfig,
  ganttTasksForConfig,
  mlStepsForConfig,
} from '../src/diagramConfig.js'

test('native Gantt diagrams parse arbitrary editable bars', () => {
  const config = {
    ...defaultDiagramConfigForKind('gantt'),
    taskRows: 'Ingest,0,1.2,0\nFeatures,1.3,2.9,1\nTrain,2.4,5.8,2\nDeploy,5.6,6.4,3',
  }

  assert.deepEqual(
    ganttTasksForConfig(config).map(({ label, start, end, row }) => ({ label, start, end, row })),
    [
      { label: 'Ingest', start: 0, end: 1.2, row: 0 },
      { label: 'Features', start: 1.3, end: 2.9, row: 1 },
      { label: 'Train', start: 2.4, end: 5.8, row: 2 },
      { label: 'Deploy', start: 5.6, end: 6.4, row: 3 },
    ],
  )
})

test('native ML pipeline diagrams expose every block label', () => {
  const config = {
    ...defaultDiagramConfigForKind('ml'),
    blockLabels: 'Raw data,QC,Embeddings,Model,Review,Ship',
  }

  assert.deepEqual(mlStepsForConfig(config), ['Raw data', 'QC', 'Embeddings', 'Model', 'Review', 'Ship'])
})

test('native deep-learning diagrams pair editable layer names with editable counts', () => {
  const config = {
    ...defaultDiagramConfigForKind('dl'),
    layerLabels: 'Sensors,Encoder,Bottleneck,Decoder,Heads',
    layerCounts: '3,6,2,6,4',
  }

  assert.deepEqual(dlLayersForConfig(config), [
    { label: 'Sensors', count: 3 },
    { label: 'Encoder', count: 6 },
    { label: 'Bottleneck', count: 2 },
    { label: 'Decoder', count: 6 },
    { label: 'Heads', count: 4 },
  ])
})

test('native circuit diagrams expose component labels independently', () => {
  const labels = circuitLabelsForConfig({
    ...defaultDiagramConfigForKind('circuit'),
    sourceLabel: '$V_s$',
    resistorLabel: '$R_1$',
    capacitorLabel: '$C_f$',
    outputLabel: '$V_o$',
  })

  assert.deepEqual(labels, {
    sourceLabel: '$V_s$',
    resistorLabel: '$R_1$',
    capacitorLabel: '$C_f$',
    outputLabel: '$V_o$',
  })
})

test('diagram config defaults are merged into imported board elements', () => {
  const config = diagramConfigForElement({
    type: 'diagram',
    diagramKind: 'dl',
    diagramConfig: { layerCounts: '2,3,1' },
  })

  assert.equal(config.layerCounts, '2,3,1')
  assert.equal(config.layerLabels, defaultDiagramConfigForKind('dl').layerLabels)
})
