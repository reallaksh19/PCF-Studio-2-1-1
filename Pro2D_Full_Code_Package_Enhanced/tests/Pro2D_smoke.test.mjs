import assert from 'node:assert/strict';
import { Pro2D_buildMockState, Pro2D_toSceneBundle, Pro2D_fromCoord2PcfSnapshot } from '../js/pro2d/Pro2D_Canonical.mjs';
import { Pro2D_validateState } from '../js/pro2d/Pro2D_ValidationEngine.mjs';

const mock = Pro2D_buildMockState();
const validation = Pro2D_validateState(mock);
const bundle = Pro2D_toSceneBundle(mock);
const imported = Pro2D_fromCoord2PcfSnapshot({ parsedRuns: [{ points: [{ x:0,y:0,z:0 }, { x:0,y:1000,z:0 }, { x:1000,y:1000,z:0 }] }], supportPoints: [[0,500]], canvasFittings: [{ type:'valve', x:0, y:700 }], options: { bore: 200, pipelineRef: 'MOCK-01' } });

assert.equal(validation.summary.errors, 0, 'smoke: mock validation should have zero errors');
assert.ok(Object.keys(bundle.segments).length > 0, 'smoke: scene bundle should contain segments');
assert.ok(Object.keys(imported.entities).length >= 4, 'smoke: imported snapshot should generate entities');

console.log('PASS smoke', {
  mockEntities: Object.keys(mock.entities).length,
  bundleSegments: Object.keys(bundle.segments).length,
  importedEntities: Object.keys(imported.entities).length,
});
