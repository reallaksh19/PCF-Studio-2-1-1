import { Pro2D_buildMockState, Pro2D_buildFromRoutePoints, Pro2D_toSceneBundle } from './Pro2D_Canonical.mjs';
import { Pro2D_validateState } from './Pro2D_ValidationEngine.mjs';
import { Pro2D_runEmitPipeline } from './Pro2D_EmitEngine.mjs';
import { Pro2D_mockRoute, Pro2D_mockEmits } from './Pro2D_MockData.mjs';

function now() {
  if (typeof performance !== 'undefined' && performance.now) return performance.now();
  return Date.now();
}

export function Pro2D_generateLongRoute(segmentCount = 1000, step = 100) {
  const pts = [[0,0,0]];
  let x = 0, y = 0;
  for (let i = 0; i < segmentCount; i += 1) {
    if (i % 2 === 0) y += step;
    else x += step;
    pts.push([x, y, 0]);
  }
  return pts;
}

export function Pro2D_runBenchmark() {
  const t0 = now();
  const mock = Pro2D_buildMockState();
  const t1 = now();
  const validation = Pro2D_validateState(mock);
  const t2 = now();
  const bundle = Pro2D_toSceneBundle(mock);
  const t3 = now();
  const emit = Pro2D_runEmitPipeline({ route: Pro2D_mockRoute, bore: 250, emits: Pro2D_mockEmits });
  const t4 = now();

  const bigRoute = Pro2D_generateLongRoute(10000, 20);
  const tb0 = now();
  const bigState = Pro2D_buildFromRoutePoints(bigRoute, { nd: 250, sourceKind: 'manual' });
  const tb1 = now();
  const bigVal = Pro2D_validateState(bigState);
  const tb2 = now();

  return {
    phase1LoadMs: +(t1 - t0).toFixed(3),
    phase1ValidateMs: +(t2 - t1).toFixed(3),
    phase1SceneBundleMs: +(t3 - t2).toFixed(3),
    phase2EmitPipelineMs: +(t4 - t3).toFixed(3),
    phase3Load10kMs: +(tb1 - tb0).toFixed(3),
    phase3Validate10kMs: +(tb2 - tb1).toFixed(3),
    totals: {
      mockEntities: Object.keys(mock.entities).length,
      mockNodes: Object.keys(mock.nodes).length,
      mockIssues: validation.issues.length,
      bigEntities: Object.keys(bigState.entities).length,
      bigNodes: Object.keys(bigState.nodes).length,
      bigIssues: bigVal.issues.length,
      finalElements: emit.finalElements.length,
      autoSupports: emit.autoSupports.length,
    },
  };
}
