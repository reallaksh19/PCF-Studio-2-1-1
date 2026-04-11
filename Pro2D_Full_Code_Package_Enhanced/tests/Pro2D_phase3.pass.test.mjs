import assert from 'node:assert/strict';
import { Pro2D_buildMockState, Pro2D_toSceneBundle } from '../js/pro2d/Pro2D_Canonical.mjs';
import { Pro2D_exportSimpleSvg, Pro2D_importSimpleSvg } from '../js/pro2d/Pro2D_SvgAdapter.mjs';
import { Pro2D_exportSimpleDxf, Pro2D_importSimpleDxf } from '../js/pro2d/Pro2D_DxfAdapter.mjs';

const doc = Pro2D_buildMockState();
const svg = Pro2D_exportSimpleSvg(doc);
const svgRoundtrip = Pro2D_importSimpleSvg(svg);
const dxf = Pro2D_exportSimpleDxf(Pro2D_toSceneBundle(doc));
const dxfRoundtrip = Pro2D_importSimpleDxf(dxf);

assert.ok(svg.includes('data-pro2d-id='), 'phase3: svg should preserve Pro2D ids');
assert.ok(svgRoundtrip.length >= 8, 'phase3: svg roundtrip should recover lines');
assert.ok(dxfRoundtrip.length >= 8, 'phase3: dxf roundtrip should recover entities');

console.log('PASS phase3', {
  svgLength: svg.length,
  svgRoundtrip: svgRoundtrip.length,
  dxfLines: dxf.split('\n').length,
  dxfRoundtrip: dxfRoundtrip.length,
});
