import assert from 'node:assert/strict'
import test from 'node:test'
import { rasterSafeSvgText } from '../src/svgRasterExport.js'

test('rasterSafeSvgText removes foreignObject content that taints canvas PNG export', () => {
  const svg = '<svg><style>@font-face{src:url(font.woff2)} .x{background:url(icon.svg)}</style><rect width="10" height="10"/><foreignObject><div>HTML label</div></foreignObject><text>safe</text></svg>'

  const safe = rasterSafeSvgText(svg)

  assert.match(safe, /<rect/)
  assert.match(safe, /<text>safe<\/text>/)
  assert.doesNotMatch(safe, /foreignObject/)
  assert.doesNotMatch(safe, /HTML label/)
  assert.doesNotMatch(safe, /@font-face/)
  assert.doesNotMatch(safe, /url\(/)
})
