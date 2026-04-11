import assert from 'node:assert/strict';
import { Pro2D_buildMockState, Pro2D_toSceneBundle } from '../js/pro2d/Pro2D_Canonical.mjs';
import { Pro2D_validateState } from '../js/pro2d/Pro2D_ValidationEngine.mjs';

const doc = Pro2D_buildMockState();
const validation = Pro2D_validateState(doc);
const bundle = Pro2D_toSceneBundle(doc);

assert.ok(Object.keys(doc.entities).length >= 10, 'phase1: expected mock state to contain at least 10 entities');
assert.ok(Object.keys(bundle.segments).length >= 8, 'phase1: expected at least 8 segments in scene bundle');
assert.equal(validation.summary.errors, 0, 'phase1: expected zero validation errors');
assert.ok(Object.keys(doc.headers.dynamic).length >= 0, 'phase1: dynamic headers registry should exist');

console.log('PASS phase1', {
  entities: Object.keys(doc.entities).length,
  nodes: Object.keys(doc.nodes).length,
  segments: Object.keys(bundle.segments).length,
  supports: Object.keys(bundle.supports).length,
  errors: validation.summary.errors,
  warnings: validation.summary.warnings,
});
