import assert from 'node:assert/strict'
import test from 'node:test'
import {
  applyLibraryPlotDataTable,
  libraryAddPlotTikzOptions,
  parseLibraryPlotDataTable,
} from '../src/libraryPlotOptions.js'

test('parseLibraryPlotDataTable accepts comma and whitespace rows', () => {
  assert.deepEqual(parseLibraryPlotDataTable('0,0\n1 0.8\n2, 0.4'), [
    [0, 0],
    [1, 0.8],
    [2, 0.4],
  ])
})

test('parseLibraryPlotDataTable keeps a third numeric column for plot metadata', () => {
  assert.deepEqual(parseLibraryPlotDataTable('0,0,0.1\n1,0.8,0.4'), [
    [0, 0, 0.1],
    [1, 0.8, 0.4],
  ])
})

test('applyLibraryPlotDataTable replaces hard-coded coordinates with table rows', () => {
  assert.deepEqual(
    applyLibraryPlotDataTable(
      [
        '\\begin{axis}[width=5cm,height=3cm]',
        '  \\addplot[draw=__COLOR__, line width=.7pt] coordinates {(0,0) (1,1)};',
        '  \\addlegendentry{fit}',
        '\\end{axis}',
      ],
      '0,0\n1,0.8\n2,0.4',
    ),
    [
      '\\begin{axis}[width=5cm,height=3cm]',
      '  \\addplot[draw=__COLOR__, line width=.7pt] table[row sep=\\\\] {',
      '    x y\\\\',
      '    0 0\\\\',
      '    1 0.8\\\\',
      '    2 0.4\\\\',
      '  };',
      '  \\addlegendentry{fit}',
      '\\end{axis}',
    ],
  )
})

test('applyLibraryPlotDataTable handles split addplot coordinate blocks', () => {
  assert.deepEqual(
    applyLibraryPlotDataTable(
      [
        '  \\addplot+[only marks, draw=__COLOR__]',
        '    coordinates {(1,0.42) +- (0,0.05) (2,0.56) +- (0,0.04)};',
        '  \\addlegendentry{measurements}',
      ],
      '1,0.5\n2,0.7',
    ),
    [
      '  \\addplot+[only marks, draw=__COLOR__] table[row sep=\\\\] {',
      '    x y\\\\',
      '    1 0.5\\\\',
      '    2 0.7\\\\',
      '  };',
      '  \\addlegendentry{measurements}',
    ],
  )
})

test('libraryAddPlotTikzOptions emits error bars only when enabled', () => {
  assert.equal(
    libraryAddPlotTikzOptions({
      samples: 120,
      markStyle: '',
      plotSmooth: false,
      errorBars: false,
      errorBarOptions: '/pgfplots/error bars/y dir=both',
    }).includes('/pgfplots/error bars/y dir=both'),
    false,
  )

  assert.ok(
    libraryAddPlotTikzOptions({
      samples: 120,
      markStyle: '',
      plotSmooth: false,
      errorBars: true,
      errorBarOptions: '/pgfplots/error bars/y dir=both',
    }).includes('/pgfplots/error bars/y dir=both'),
  )
})
