import assert from 'node:assert/strict';
import { Pro2D_mockRoute, Pro2D_mockEmits } from '../js/pro2d/Pro2D_MockData.mjs';
import { Pro2D_runEmitPipeline } from '../js/pro2d/Pro2D_EmitEngine.mjs';

const result = Pro2D_runEmitPipeline({ route: Pro2D_mockRoute, bore: 250, emits: Pro2D_mockEmits, supportName: 'CA150' });

assert.ok(result.baseElements.length > 0, 'phase2: base elements should be created');
assert.ok(result.finalElements.length >= result.baseElements.length, 'phase2: final elements should be >= base elements after cuts');
assert.ok(result.autoSupports.length > 0, 'phase2: auto supports should be created from emit hits');
assert.equal(result.metrics.emitCount, Pro2D_mockEmits.length, 'phase2: emit count mismatch');

console.log('PASS phase2', {
  baseElements: result.baseElements.length,
  finalElements: result.finalElements.length,
  autoSupports: result.autoSupports.length,
  emitHits: result.emitHits.filter(Boolean).length,
});
