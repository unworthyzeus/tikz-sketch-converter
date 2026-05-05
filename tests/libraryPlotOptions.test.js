import assert from 'node:assert/strict'
import test from 'node:test'
import {
  applyLibraryPlotDataTable,
  applyLibraryPlotModulation,
  applyPgfplotsAxisMode,
  functionPgfplotsAxisSettings,
  pgfplotsAxisEnvironmentForModes,
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

test('pgfplotsAxisEnvironmentForModes switches semilog environments from explicit axis modes', () => {
  assert.equal(
    pgfplotsAxisEnvironmentForModes('semilogyaxis', { xMode: 'linear', yMode: 'linear' }, { yMode: true }),
    'axis',
  )
  assert.equal(
    pgfplotsAxisEnvironmentForModes('semilogyaxis', { xMode: 'log', yMode: 'log' }, { xMode: true }),
    'loglogaxis',
  )
  assert.equal(
    pgfplotsAxisEnvironmentForModes('semilogyaxis', { xMode: 'linear', yMode: 'log' }, {}),
    'semilogyaxis',
  )
  assert.equal(
    pgfplotsAxisEnvironmentForModes('polaraxis', { xMode: 'log', yMode: 'log' }, { xMode: true, yMode: true }),
    'polaraxis',
  )
})

test('applyPgfplotsAxisMode rewrites matching begin and end environments together', () => {
  assert.deepEqual(
    applyPgfplotsAxisMode(
      ['\\begin{semilogyaxis}[grid=major]', '  \\addplot coordinates {(0,1)};', '\\end{semilogyaxis}'],
      { xMode: 'log', yMode: 'log' },
      { xMode: true },
    ),
    ['\\begin{loglogaxis}[grid=major]', '  \\addplot coordinates {(0,1)};', '\\end{loglogaxis}'],
  )
})

test('functionPgfplotsAxisSettings maps function log toggles to the exported environment', () => {
  assert.deepEqual(functionPgfplotsAxisSettings({ axisType: 'axis', logX: true, logY: true }), {
    environment: 'loglogaxis',
    xMode: 'log',
    yMode: 'log',
  })
  assert.deepEqual(functionPgfplotsAxisSettings({ axisType: 'semilogyaxis', logX: true, logY: false }), {
    environment: 'loglogaxis',
    xMode: 'log',
    yMode: 'log',
  })
  assert.deepEqual(functionPgfplotsAxisSettings({ axisType: 'polaraxis', logX: true, logY: true }), {
    environment: 'polaraxis',
    xMode: 'log',
    yMode: 'log',
  })
})

test('applyLibraryPlotModulation rewrites constellation coordinates from the modulation control', () => {
  assert.deepEqual(
    applyLibraryPlotModulation(
      [
        '\\begin{axis}[axis equal image]',
        '  \\addplot[only marks, mark=*] coordinates {(-1,-1) (-1,1) (1,-1) (1,1)};',
        '\\end{axis}',
      ],
      'plot-constellation',
      { modulation: 'BPSK' },
    ),
    [
      '\\begin{axis}[axis equal image]',
      '  \\addplot[only marks, mark=*] coordinates {(-1,0) (1,0)};',
      '\\end{axis}',
    ],
  )

  const qam16 = applyLibraryPlotModulation(
    ['\\addplot[only marks] coordinates {(-1,-1) (-1,1) (1,-1) (1,1)};'],
    'plot-constellation',
    { modulation: '16-QAM' },
  )[0]

  assert.equal((qam16.match(/\([^)]*\)/g) ?? []).length, 16)
  assert.match(qam16, /\(-3,-3\)/)
  assert.match(qam16, /\(3,3\)/)
})
