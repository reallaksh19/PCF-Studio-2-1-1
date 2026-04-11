import React from 'react';
import { useSceneStore } from './Smart2Dcanvas_SceneStore';

const Smart2Dcanvas_StatusBar: React.FC = () => {
  const scale = useSceneStore((state) => state.scale);
  const selectedIds = useSceneStore((state) => state.selectedIds);
  const activeTool = useSceneStore((state) => state.activeTool);
  const cursorX = useSceneStore((state) => state.cursorX);
  const cursorY = useSceneStore((state) => state.cursorY);
  const isOrtho = useSceneStore((state) => state.isOrtho);
  const setOrtho = useSceneStore((state) => state.setOrtho);
  const isOsnap = useSceneStore((state) => state.isOsnap);
  const setOsnap = useSceneStore((state) => state.setOsnap);

  return (
    <div className="h-8 bg-gray-800 border-t border-gray-700 flex items-center px-4 shrink-0 text-xs text-gray-400 justify-between">
      <div className="flex space-x-6">
        <span>Tool: <span className="text-gray-200 capitalize">{activeTool}</span></span>
        <span>Selected: <span className="text-gray-200">{selectedIds.size}</span></span>
      </div>
      <div className="flex space-x-6 items-center">
        <div className="flex space-x-2 border-r border-gray-700 pr-4">
          <button 
             onClick={() => setOrtho(!isOrtho)} 
             className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${isOrtho ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'}`}
          >
             ORTHO
          </button>
          <button 
             onClick={() => setOsnap(!isOsnap)} 
             className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${isOsnap ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'}`}
          >
             OSNAP
          </button>
        </div>
        <span>X: <span className="text-gray-200">{cursorX.toFixed(2)}</span></span>
        <span>Y: <span className="text-gray-200">{cursorY.toFixed(2)}</span></span>
        <span>Zoom: <span className="text-gray-200">{Math.round(scale * 100)}%</span></span>
      </div>
    </div>
  );
};

export default Smart2Dcanvas_StatusBar;
