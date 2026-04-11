import React from 'react';
import { useSceneStore } from '../smart2dcanvas/Smart2Dcanvas_SceneStore';

const TOOLS = [
  { id: 'select', label: 'Select', icon: '🖱' },
  { id: 'pan', label: 'Pan', icon: '✋' },
  { id: 'line', label: 'Pipe', icon: '／' },
  { id: 'polyline', label: 'Polyline', icon: '〰' },
  { id: 'spline', label: 'Spline', icon: '∿' },
  { id: 'support', label: 'Support', icon: '✚' },
  { id: 'valve', label: 'Valve', icon: '◇' },
  { id: 'flange', label: 'Flange', icon: '▮' },
  { id: 'fvf', label: 'FVF', icon: '▮◇▮' },
  { id: 'reducer', label: 'Reducer', icon: '⬘' },
];

const Pro2D_LeftRail: React.FC = () => {
  const activeTool = useSceneStore((state) => state.activeTool);
  const setActiveTool = useSceneStore((state) => state.setActiveTool);
  return (
    <div className="w-20 border-r border-slate-800 bg-slate-950/80 p-2 flex flex-col gap-2 overflow-auto">
      {TOOLS.map((tool) => (
        <button
          key={tool.id}
          className={`rounded-lg border px-2 py-2 text-xs text-center ${activeTool === tool.id ? 'border-amber-500 bg-amber-500/10 text-amber-200' : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500'}`}
          onClick={() => setActiveTool(tool.id as any)}
          title={tool.label}
        >
          <div className="text-base">{tool.icon}</div>
          <div className="mt-1 leading-tight">{tool.label}</div>
        </button>
      ))}
    </div>
  );
};

export default Pro2D_LeftRail;
