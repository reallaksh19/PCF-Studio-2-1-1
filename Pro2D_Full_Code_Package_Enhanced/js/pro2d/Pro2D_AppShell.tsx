import React, { useMemo, useState } from 'react';
import Smart2Dcanvas_CanvasViewport from '../smart2dcanvas/Smart2Dcanvas_CanvasViewport';
import Smart2Dcanvas_StatusBar from '../smart2dcanvas/Smart2Dcanvas_StatusBar';
import { useSceneStore } from '../smart2dcanvas/Smart2Dcanvas_SceneStore';
import Pro2D_Ribbon from './Pro2D_Ribbon';
import Pro2D_LeftRail from './Pro2D_LeftRail';
import Pro2D_PropertyPanel from './Pro2D_PropertyPanel';
import { Pro2D_buildMockState, Pro2D_fromCoord2PcfSnapshot, Pro2D_toSceneBundle, Pro2D_createEmptyState } from './Pro2D_Canonical.mjs';
import { Pro2D_validateState } from './Pro2D_ValidationEngine.mjs';
import { Pro2D_runBenchmark } from './Pro2D_Benchmark.mjs';
import { Pro2D_exportSimpleSvg } from './Pro2D_SvgAdapter.mjs';
import { Pro2D_exportSimpleDxf } from './Pro2D_DxfAdapter.mjs';
import { Pro2D_mockRoute, Pro2D_mockEmits } from './Pro2D_MockData.mjs';
import { Pro2D_runEmitPipeline } from './Pro2D_EmitEngine.mjs';

function pushToStore(bundle: any) {
  useSceneStore.getState().loadSceneBundle(bundle);
}

const Coor2PcfPanel: React.FC<{ inputSnapshot: any; benchmark: any; pipelineMetrics: any }> = ({ inputSnapshot, benchmark, pipelineMetrics }) => (
  <div className="p-3 border-t border-slate-800 text-xs text-slate-300 bg-slate-950 space-y-2">
    <div className="text-[11px] uppercase tracking-wide text-amber-400">CoorCanvas / Coor2PCF integration panel</div>
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded border border-slate-800 bg-slate-900/60 p-2">
        <div className="font-semibold text-slate-200 mb-1">Imported input snapshot</div>
        <div>Runs: {inputSnapshot?.parsedRuns?.length || 0}</div>
        <div>Support points: {inputSnapshot?.supportPoints?.length || 0}</div>
        <div>Canvas fittings: {inputSnapshot?.canvasFittings?.length || 0}</div>
        <div>Bore: {inputSnapshot?.options?.bore || 250}</div>
        <div>Pipeline Ref: {inputSnapshot?.options?.pipelineRef || '—'}</div>
      </div>
      <div className="rounded border border-slate-800 bg-slate-900/60 p-2">
        <div className="font-semibold text-slate-200 mb-1">Emit / support pipeline</div>
        <div>Route points: {pipelineMetrics?.routePointCount || Pro2D_mockRoute.length}</div>
        <div>Emits: {pipelineMetrics?.emitCount || Pro2D_mockEmits.length}</div>
        <div>Auto supports: {pipelineMetrics?.autoSupportCount || 0}</div>
        <div>Final elements: {pipelineMetrics?.finalElementCount || 0}</div>
      </div>
      <div className="rounded border border-slate-800 bg-slate-900/60 p-2 col-span-2">
        <div className="font-semibold text-slate-200 mb-1">Benchmark snapshot</div>
        <div className="grid grid-cols-3 gap-2">
          <div>Mock load: {benchmark?.phase1LoadMs ?? '—'} ms</div>
          <div>Validate: {benchmark?.phase1ValidateMs ?? '—'} ms</div>
          <div>Scene bundle: {benchmark?.phase1SceneBundleMs ?? '—'} ms</div>
          <div>Emit pipeline: {benchmark?.phase2EmitPipelineMs ?? '—'} ms</div>
          <div>10k load: {benchmark?.phase3Load10kMs ?? '—'} ms</div>
          <div>10k validate: {benchmark?.phase3Validate10kMs ?? '—'} ms</div>
        </div>
      </div>
    </div>
  </div>
);

const Pro2D_AppShell: React.FC = () => {
  const [doc, setDoc] = useState<any>(() => Pro2D_createEmptyState('Pro2D Empty'));
  const [validation, setValidation] = useState<any>({ issues: [], summary: { errors: 0, warnings: 0, totalEntities: 0, totalRoutes: 0, totalNodes: 0 } });
  const [benchmark, setBenchmark] = useState<any>(null);
  const [lastSvg, setLastSvg] = useState('');
  const [lastDxf, setLastDxf] = useState('');
  const [inputSnapshot, setInputSnapshot] = useState<any>({ parsedRuns: [], supportPoints: [], canvasFittings: [], options: {} });
  const [pipelineMetrics, setPipelineMetrics] = useState<any>(null);
  const clearSelection = useSceneStore((state) => state.clearSelection);

  const summaryText = useMemo(() => {
    const s = validation?.summary;
    return `${s?.totalEntities ?? 0} entities · ${s?.totalNodes ?? 0} nodes · ${s?.errors ?? 0} errors · ${s?.warnings ?? 0} warnings`;
  }, [validation]);

  const loadDoc = (nextDoc: any) => {
    const validated = Pro2D_validateState(nextDoc);
    setDoc({ ...nextDoc });
    setValidation({ ...validated });
    pushToStore(Pro2D_toSceneBundle(nextDoc));
    clearSelection();
  };

  const onAction = (actionId: string) => {
    if (actionId === 'loadMock') {
      loadDoc(Pro2D_buildMockState());
      return;
    }
    if (actionId === 'pullInput') {
      const getter = (window as any).__getCoord2PcfSnapshot;
      const snapshot = typeof getter === 'function' ? getter() : {};
      setInputSnapshot(snapshot);
      loadDoc(Pro2D_fromCoord2PcfSnapshot(snapshot));
      return;
    }
    if (actionId === 'validate') {
      const next = { ...doc };
      setValidation({ ...Pro2D_validateState(next) });
      return;
    }
    if (actionId === 'benchmark') {
      setBenchmark(Pro2D_runBenchmark());
      return;
    }
    if (actionId === 'clear') {
      loadDoc(Pro2D_createEmptyState('Pro2D Empty'));
      return;
    }
    if (actionId === 'exportSvg') {
      setLastSvg(Pro2D_exportSimpleSvg(doc));
      return;
    }
    if (actionId === 'exportDxf') {
      setLastDxf(Pro2D_exportSimpleDxf(Pro2D_toSceneBundle(doc)));
      return;
    }
    if (actionId === 'emitCuts' || actionId === 'autoSupports' || actionId === 'routeToPcf') {
      const metrics = Pro2D_runEmitPipeline({ route: Pro2D_mockRoute, bore: 250, emits: Pro2D_mockEmits }).metrics;
      setPipelineMetrics(metrics);
      return;
    }
    if (actionId.startsWith('tool_')) {
      useSceneStore.getState().setActiveTool(actionId.replace('tool_', '') as any);
      return;
    }
    // Placeholder commands kept visible on ribbon for phase 3 tools.
    console.info('[Pro2D] Ribbon action invoked:', actionId);
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-200">
      <Pro2D_Ribbon onAction={onAction} />
      <div className="px-3 py-2 border-b border-slate-800 bg-slate-900/80 text-xs flex items-center justify-between">
        <div>
          <span className="font-semibold text-amber-300">Pro 2D Canvas</span>
          <span className="ml-2 text-slate-400">Unified Smart2D shell + CoorCanvas domain tools + canonical state</span>
        </div>
        <div className="text-slate-300">{summaryText}</div>
      </div>
      <div className="flex min-h-0 flex-1">
        <Pro2D_LeftRail />
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 relative">
            <Smart2Dcanvas_CanvasViewport />
          </div>
          <Coor2PcfPanel inputSnapshot={inputSnapshot} benchmark={benchmark} pipelineMetrics={pipelineMetrics} />
          {(lastSvg || lastDxf) && (
            <div className="border-t border-slate-800 bg-slate-950 text-xs grid grid-cols-2 gap-0 max-h-44 overflow-auto">
              <div className="border-r border-slate-800 p-2">
                <div className="uppercase text-[10px] tracking-wide text-cyan-400 mb-1">SVG export preview</div>
                <pre className="whitespace-pre-wrap break-all text-slate-300">{lastSvg || '—'}</pre>
              </div>
              <div className="p-2">
                <div className="uppercase text-[10px] tracking-wide text-emerald-400 mb-1">DXF export preview</div>
                <pre className="whitespace-pre-wrap break-all text-slate-300">{lastDxf || '—'}</pre>
              </div>
            </div>
          )}
          <Smart2Dcanvas_StatusBar />
        </div>
        <div className="w-[360px] min-w-[360px]">
          <Pro2D_PropertyPanel doc={doc} validation={validation} />
        </div>
      </div>
    </div>
  );
};

export default Pro2D_AppShell;
