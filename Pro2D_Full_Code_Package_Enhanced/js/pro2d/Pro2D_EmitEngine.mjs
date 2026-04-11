import {
  Pro2D_buildBaseElements,
  Pro2D_computeEmitHits,
  Pro2D_applyEmitCuts,
  Pro2D_buildAutoSupports,
  Pro2D_mergeSupports,
} from './Pro2D_CoorMath.mjs';

export function Pro2D_runEmitPipeline({ route, bore = 250, emits = [], supportName = 'CA150', manualSupports = [] }) {
  const baseElements = Pro2D_buildBaseElements(route, bore);
  const emitHits = Pro2D_computeEmitHits(emits, baseElements);
  const finalElements = Pro2D_applyEmitCuts(baseElements, emitHits);
  const autoSupports = Pro2D_buildAutoSupports(emitHits, supportName);
  const mergedSupports = Pro2D_mergeSupports(autoSupports, manualSupports);
  return {
    baseElements,
    emitHits,
    finalElements,
    autoSupports,
    mergedSupports,
    metrics: {
      routePointCount: route.length,
      emitCount: emits.length,
      autoSupportCount: autoSupports.length,
      finalElementCount: finalElements.length,
    },
  };
}
