import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Line, Circle, Path, Group, Rect, Transformer } from 'react-konva';
import { useSceneStore } from './Smart2Dcanvas_SceneStore';
import useImage from 'use-image';
import { v4 as uuidv4 } from 'uuid';
import { calculateSnap, SnapResult } from './Smart2Dcanvas_SnapEngine';

const UnderlayImageRenderer: React.FC<{
  source: string;
  x: number;
  y: number;
  opacity: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (newAttrs: any) => void;
}> = ({ source, x, y, opacity, scaleX, scaleY, rotation, isSelected, onSelect, onChange }) => {
  const [image] = useImage(source);
  const shapeRef = useRef<any>(null);
  const trRef = useRef<any>(null);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return image ? (
    <React.Fragment>
      <KonvaImage
        ref={shapeRef}
        image={image}
        x={x}
        y={y}
        opacity={opacity}
        scaleX={scaleX}
        scaleY={scaleY}
        rotation={rotation}
        draggable={isSelected}
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => {
          onChange({
             x: e.target.x(),
             y: e.target.y(),
          });
        }}
        onTransformEnd={(e) => {
           const node = shapeRef.current;
           onChange({
             x: node.x(),
             y: node.y(),
             scaleX: node.scaleX(),
             scaleY: node.scaleY(),
             rotation: node.rotation(),
           });
        }}
      />
      {isSelected && (
         <Transformer
            ref={trRef}
            flipEnabled={false}
            boundBoxFunc={(oldBox, newBox) => {
               if (newBox.width < 5 || newBox.height < 5) return oldBox;
               return newBox;
            }}
         />
      )}
    </React.Fragment>
  ) : null;
};

// Math helpers
function dist(p1: {x: number, y: number}, p2: {x: number, y: number}) {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

function pointToSegmentDistance(pt: {x: number, y: number}, a: {x: number, y: number}, b: {x: number, y: number}) {
  const ab = { x: b.x - a.x, y: b.y - a.y };
  const ap = { x: pt.x - a.x, y: pt.y - a.y };
  const ab2 = ab.x * ab.x + ab.y * ab.y;
  if (ab2 <= 1e-9) return { dist: dist(pt, a), proj: a, t: 0 };
  let t = (ap.x * ab.x + ap.y * ab.y) / ab2;
  t = Math.max(0, Math.min(1, t));
  const proj = { x: a.x + ab.x * t, y: a.y + ab.y * t };
  return { dist: dist(pt, proj), proj, t };
}

const Smart2Dcanvas_CanvasViewport: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const scale = useSceneStore((state) => state.scale);
  const panX = useSceneStore((state) => state.panX);
  const panY = useSceneStore((state) => state.panY);
  const setScale = useSceneStore((state) => state.setScale);
  const setPan = useSceneStore((state) => state.setPan);
  const cursorX = useSceneStore((state) => state.cursorX);
  const cursorY = useSceneStore((state) => state.cursorY);
  const setCursor = useSceneStore((state) => state.setCursor);
  const activeTool = useSceneStore((state) => state.activeTool);
  const updateUnderlayImage = useSceneStore((state) => state.updateUnderlayImage);
  
  const segments = useSceneStore((state) => state.segments);
  const inlineItems = useSceneStore((state) => state.inlineItems);
  const supports = useSceneStore((state) => state.supports);
  
  const addSegment = useSceneStore((state) => state.addSegment);
  const removeSegment = useSceneStore((state) => state.removeSegment);
  const addInlineItem = useSceneStore((state) => state.addInlineItem);
  const addSupport = useSceneStore((state) => state.addSupport);
  
  const selectObject = useSceneStore((state) => state.selectObject);
  const clearSelection = useSceneStore((state) => state.clearSelection);
  const selectedIds = useSceneStore((state) => state.selectedIds);

  const stageRef = useRef<any>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [draftPoints, setDraftPoints] = useState<{x: number, y: number}[]>([]);
  const [snap, setSnap] = useState<SnapResult | null>(null);

  // Marquee State
  const [isMarqueeing, setIsMarqueeing] = useState(false);
  const [marqueeStart, setMarqueeStart] = useState({ x: 0, y: 0 });
  const [marqueeEnd, setMarqueeEnd] = useState({ x: 0, y: 0 });

  const [isOrtho, isOsnap] = useSceneStore((state) => [state.isOrtho, state.isOsnap]);
  const underlayImages = useSceneStore((state) => state.underlayImages);
  const undo = useSceneStore((state) => state.undo);
  const redo = useSceneStore((state) => state.redo);

  // Reducer HUD state
  const [reducerBore2, setReducerBore2] = useState('200');
  const [reducerType, setReducerType] = useState<'concentric' | 'eccentric'>('concentric');

  // Non-passive wheel handler to allow preventDefault (fixes browser warning)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;
      const scaleBy = 1.1;
      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };
      const newScale = e.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
      setScale(newScale);
      setPan(
        pointer.x - mousePointTo.x * newScale,
        pointer.y - mousePointTo.y * newScale,
      );
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, [setScale, setPan]);

  // Underlay Edit State
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

  // Dynamic HUD Dimensions
  const [hudDimensions, setHudDimensions] = useState({ length: "500", weight: "150" });

  const handleWheel = (e: any) => {
    // preventDefault is handled by the native non-passive listener above
    const stage = stageRef.current;
    if (!stage) return;

    const scaleBy = 1.1;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    setScale(newScale);

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    setPan(newPos.x, newPos.y);
  };

  const getRelativePointerPosition = () => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };
    const pointer = stage.getPointerPosition();
    if (!pointer) return { x: 0, y: 0 };
    return {
      x: (pointer.x - stage.x()) / stage.scaleX(),
      y: (pointer.y - stage.y()) / stage.scaleY(),
    };
  };

  const findNearestSegmentAndChop = (pos: {x: number, y: number}, itemLen: number) => {
    let nearest: any = null;
    let minDist = Infinity;

    Object.values(segments).forEach((seg) => {
      for (let i = 0; i < seg.points.length - 1; i++) {
        const p1 = seg.points[i];
        const p2 = seg.points[i+1];
        const res = pointToSegmentDistance(pos, p1, p2);
        if (res.dist < 20 / scale && res.dist < minDist) {
          minDist = res.dist;
          nearest = { seg, index: i, proj: res.proj, t: res.t, p1, p2 };
        }
      }
    });

    if (!nearest) return null;

    const { seg, p1, p2, proj } = nearest;
    const segLen = dist(p1, p2);
    if (segLen < itemLen && itemLen > 0) return null; // segment too short

    const currentElevation = useSceneStore.getState().currentElevation;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    
    const halfLen = itemLen / 2;
    const tGapStart = Math.max(0, nearest.t - (halfLen / segLen));
    const tGapEnd = Math.min(1, nearest.t + (halfLen / segLen));

    const pGapStart = { x: p1.x + dx * tGapStart, y: p1.y + dy * tGapStart };
    const pGapEnd = { x: p1.x + dx * tGapEnd, y: p1.y + dy * tGapEnd };

    removeSegment(seg.id);

    if (tGapStart > 0.001 || itemLen === 0) {
      addSegment({
        id: uuidv4(),
        startNodeId: seg.startNodeId,
        endNodeId: uuidv4(),
        geometryKind: seg.geometryKind,
        points: [
          ...seg.points.slice(0, nearest.index + 1),
          { id: uuidv4(), x: pGapStart.x, y: pGapStart.y, z: currentElevation }
        ]
      });
    }

    if (tGapEnd < 0.999 || itemLen === 0) {
      addSegment({
        id: uuidv4(),
        startNodeId: uuidv4(),
        endNodeId: seg.endNodeId,
        geometryKind: seg.geometryKind,
        points: [
          { id: uuidv4(), x: pGapEnd.x, y: pGapEnd.y, z: currentElevation },
          ...seg.points.slice(nearest.index + 1)
        ]
      });
    }

    return { proj, angle, seg };
  };

  const handlePointerDown = (e: any) => {
    if (e.evt.button === 1 || activeTool === 'pan') {
      setIsPanning(true);
      setPanStart({ x: e.evt.clientX, y: e.evt.clientY });
      return;
    }

    let pos = getRelativePointerPosition();
    if (snap) pos = snap.pt as any; // enforce object snap priority

    if (activeTool === 'line' || activeTool === 'polyline' || activeTool === 'spline') {
      if (!isDrawing) {
        setIsDrawing(true);
        setDraftPoints([pos, pos]);
      } else {
        setDraftPoints([...draftPoints.slice(0, -1), pos, pos]);
      }
      return;
    }

    if (activeTool === 'reducer') {
      try {
        const len = parseFloat(hudDimensions.length) || 300;
        const res = findNearestSegmentAndChop(pos, len);
        if (res) {
          const upBore = parseFloat(res.seg.sizeSpecFields?.bore) || 250;
          const downBore = parseFloat(reducerBore2) || 200;
          const skey = reducerType === 'eccentric' ? 'REBW' : 'RCON';
          addInlineItem({
            id: uuidv4(),
            type: 'reducer',
            insertionStation: 0,
            occupiedLength: len,
            x: res.proj.x,
            y: res.proj.y,
            angle: res.angle,
            upstreamBore: upBore,
            downstreamBore: downBore,
            reducerType,
            metadata: { skey },
          });
        } else {
          alert('Geometric Failure: Segment too short for reducer.');
        }
      } catch (err) {
        console.error('Failed to insert reducer:', err);
      }
      return;
    }

    if (['valve', 'flange', 'fvf'].includes(activeTool)) {
      try {
        const lenStr = hudDimensions.length;
        let len = parseFloat(lenStr);
        if (isNaN(len)) len = activeTool === 'valve' ? 500 : (activeTool === 'flange' ? 100 : 700);

        const res = findNearestSegmentAndChop(pos, len);
        if (res) {
          addInlineItem({
            id: uuidv4(),
            type: activeTool as any,
            insertionStation: 0,
            occupiedLength: len,
            x: res.proj.x,
            y: res.proj.y,
            angle: res.angle,
            weight: parseFloat(hudDimensions.weight) || 0
          });
        } else {
          alert('Geometric Failure: Segment length is likely too short to accommodate this CAD object length.');
        }
      } catch (e) {
          console.error("Failed to insert inline item topologically: ", e);
      }
      return;
    }

    if (activeTool === 'support') {
      // 0-length topological split for Support injection
      const res = findNearestSegmentAndChop(pos, 0);
      if (res) {
        addSupport({
          id: uuidv4(),
          nodeId: uuidv4(),
          supportType: 'CA150',
          x: res.proj.x,
          y: res.proj.y
        });
      }
      return;
    }

    if (activeTool === 'select') {
      if (e.target === e.target.getStage()) {
        setSelectedImageId(null);
        clearSelection();
        setIsMarqueeing(true);
        setMarqueeStart(pos);
        setMarqueeEnd(pos);
      }
    }
  };

  const handlePointerMove = (e: any) => {
    const rawPos = getRelativePointerPosition();
    setCursor(rawPos.x, rawPos.y);

    if (isPanning) {
      const dx = e.evt.clientX - panStart.x;
      const dy = e.evt.clientY - panStart.y;
      setPan(panX + dx, panY + dy);
      setPanStart({ x: e.evt.clientX, y: e.evt.clientY });
      return;
    }

    const currentSnap = isOsnap ? calculateSnap(rawPos.x, rawPos.y, scale) : null;
    setSnap(currentSnap);

    let pos = currentSnap ? (currentSnap.pt as any) : rawPos;

    // Apply Ortho mode logic strictly if activated and drafting
    if (isOrtho && isDrawing && draftPoints.length >= 2) {
       const p1 = draftPoints[draftPoints.length - 2];
       const dx = Math.abs(pos.x - p1.x);
       const dy = Math.abs(pos.y - p1.y);
       if (dx > dy) { // Snap to X axis
          pos = { x: pos.x, y: p1.y, z: pos.z };
       } else {       // Snap to Y axis
          pos = { x: p1.x, y: pos.y, z: pos.z };
       }
    }

    if (isDrawing && draftPoints.length >= 2) {
      const pts = [...draftPoints];
      pts[pts.length - 1] = pos;
      setDraftPoints(pts);
    }

    if (isMarqueeing) {
      setMarqueeEnd(rawPos);
    }
  };

  const executeMarqueeSelection = () => {
    const minX = Math.min(marqueeStart.x, marqueeEnd.x);
    const maxX = Math.max(marqueeStart.x, marqueeEnd.x);
    const minY = Math.min(marqueeStart.y, marqueeEnd.y);
    const maxY = Math.max(marqueeStart.y, marqueeEnd.y);
    
    // Left-to-Right is enclosing, Right-to-Left is crossing
    const isEnclosing = marqueeStart.x < marqueeEnd.x;

    Object.values(segments).forEach(seg => {
      let isInside = isEnclosing; // Start with strict requirement if enclosing
      let isCrossing = false;

      seg.points.forEach(pt => {
        const inBounds = pt.x >= minX && pt.x <= maxX && pt.y >= minY && pt.y <= maxY;
        if (!inBounds) isInside = false; // Fails enclosing rules
        if (inBounds) isCrossing = true;   // Satisfies crossing rules
      });

      if ((isEnclosing && isInside) || (!isEnclosing && isCrossing)) {
        selectObject(seg.id, true);
      }
    });

    Object.values(inlineItems).forEach(item => {
      if (item.x && item.y) {
         const inBounds = item.x >= minX && item.x <= maxX && item.y >= minY && item.y <= maxY;
         if (inBounds) selectObject(item.id, true);
      }
    });

    Object.values(supports).forEach(item => {
      if (item.x && item.y) {
         const inBounds = item.x >= minX && item.x <= maxX && item.y >= minY && item.y <= maxY;
         if (inBounds) selectObject(item.id, true);
      }
    });
  };

  const handlePointerUp = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (isMarqueeing) {
      setIsMarqueeing(false);
      executeMarqueeSelection();
    }

    if (activeTool === 'line' && isDrawing) {
      commitDraftPoints();
    }
  };

  const commitDraftPoints = () => {
    if (draftPoints.length < 2) return;
    const finalPts = draftPoints.slice(0, -1);
    if (finalPts.length < 2) return;

    const currentElevation = useSceneStore.getState().currentElevation;
    addSegment({
        id: uuidv4(),
        startNodeId: uuidv4(),
        endNodeId: uuidv4(),
        geometryKind: activeTool === 'line' ? 'line' : (activeTool === 'spline' ? 'spline' : 'polyline'),
        points: finalPts.map(p => ({ id: uuidv4(), x: p.x, y: p.y, z: currentElevation }))
    });
    setDraftPoints([]);
    setIsDrawing(false);
  };

  const handleDblClick = () => {
    if (isDrawing && (activeTool === 'polyline' || activeTool === 'spline')) {
      commitDraftPoints();
    }
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
        return;
      }
      if (e.key === 'F8') { e.preventDefault(); useSceneStore.getState().setOrtho(!useSceneStore.getState().isOrtho); return; }
      if (e.key === 'F3') { e.preventDefault(); useSceneStore.getState().setOsnap(!useSceneStore.getState().isOsnap); return; }
      if (e.key === 'Escape') {
        if (isDrawing) {
          commitDraftPoints();
        }
        useSceneStore.getState().setActiveTool('select');
        clearSelection();
        setIsMarqueeing(false);
      }
      if (e.key === 'Enter' && isDrawing) {
         // Auto-lock dynamic HUD dimension length and commit the current vector direction
         if (draftPoints.length >= 2) {
            const p1 = draftPoints[draftPoints.length - 2];
            let p2 = draftPoints[draftPoints.length - 1];
            
            const reqLen = parseFloat(hudDimensions.length);
            if (!isNaN(reqLen) && reqLen > 0) {
               const dx = p2.x - p1.x;
               const dy = p2.y - p1.y;
               const currentDist = Math.hypot(dx, dy);
               if (currentDist > 0) {
                 p2.x = p1.x + (dx / currentDist) * reqLen;
                 p2.y = p1.y + (dy / currentDist) * reqLen;
                 setDraftPoints([...draftPoints.slice(0,-1), p2, p2]);
               }
            } else {
               commitDraftPoints();
            }
         }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isDrawing, draftPoints, hudDimensions, undo, redo]);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateDimensions();
    const ro = new ResizeObserver(updateDimensions);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={`w-full h-full relative ${activeTool === 'pan' ? 'cursor-grab' : 'cursor-crosshair'}`}>
      
      {/* HUD Float Overlay */}
      { (isDrawing || ['valve', 'flange', 'fvf', 'support', 'reducer'].includes(activeTool)) && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gray-800 border border-blue-500 rounded p-2 flex space-x-2 z-20 shadow-lg" style={{ pointerEvents: activeTool === 'line' || activeTool === 'polyline' || activeTool === 'spline' ? 'none' : 'auto' }}>
          { isDrawing && (
             <div className="flex flex-col text-xs text-gray-300">
               <label>Length (Next Point)</label>
               <input
                 className="w-20 bg-gray-900 border border-gray-600 rounded px-1"
                 value={hudDimensions.length} onChange={(e) => setHudDimensions({...hudDimensions, length: e.target.value})}
               />
               <span className="text-gray-500 mt-1">Press Enter to lock vector</span>
             </div>
          )}
          { ['valve', 'flange', 'fvf'].includes(activeTool) && (
             <div className="flex space-x-2 text-xs text-gray-300">
               <div className="flex flex-col">
                 <label>Length (mm)</label>
                 <input className="w-16 bg-gray-900 border border-gray-600 rounded px-1" value={hudDimensions.length} onChange={(e) => setHudDimensions({...hudDimensions, length: e.target.value})} />
               </div>
               <div className="flex flex-col">
                 <label>Weight (kg)</label>
                 <input className="w-16 bg-gray-900 border border-gray-600 rounded px-1" value={hudDimensions.weight} onChange={(e) => setHudDimensions({...hudDimensions, weight: e.target.value})} />
               </div>
             </div>
          )}
          { activeTool === 'support' && (
             <div className="flex flex-col text-xs text-gray-300">
               <label>Support Name</label>
               <input className="w-24 bg-gray-900 border border-gray-600 rounded px-1" placeholder="CA150" />
               <span className="text-gray-500 mt-1">Click pipe to place</span>
             </div>
          )}
          { activeTool === 'reducer' && (
             <div className="flex space-x-2 text-xs text-gray-300">
               <div className="flex flex-col">
                 <label>⌀1 (pipe, auto)</label>
                 <span className="text-gray-400 py-0.5 px-1 bg-gray-900 border border-gray-700 rounded">auto</span>
               </div>
               <div className="flex flex-col">
                 <label>⌀2 (downstream mm)</label>
                 <input className="w-16 bg-gray-900 border border-gray-600 rounded px-1" value={reducerBore2} onChange={(e) => setReducerBore2(e.target.value)} />
               </div>
               <div className="flex flex-col">
                 <label>Len (mm)</label>
                 <input className="w-14 bg-gray-900 border border-gray-600 rounded px-1" value={hudDimensions.length} onChange={(e) => setHudDimensions({...hudDimensions, length: e.target.value})} />
               </div>
               <div className="flex flex-col">
                 <label>Type</label>
                 <select
                   className="bg-gray-900 border border-gray-600 rounded px-1 text-white"
                   value={reducerType}
                   onChange={(e) => setReducerType(e.target.value as 'concentric' | 'eccentric')}
                 >
                   <option value="concentric">Concentric</option>
                   <option value="eccentric">Eccentric</option>
                 </select>
               </div>
             </div>
          )}
        </div>
      )}

      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        scaleX={scale}
        scaleY={scale}
        x={panX}
        y={panY}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDblClick={handleDblClick}
      >
        <Layer>
          {Object.values(underlayImages).map((img) => (
            <UnderlayImageRenderer
              key={img.id}
              source={img.source}
              x={img.x}
              y={img.y}
              opacity={img.opacity}
              scaleX={img.scaleX}
              scaleY={img.scaleY}
              rotation={img.rotation}
              isSelected={selectedImageId === img.id}
              onSelect={() => {
                 if (activeTool === 'select') setSelectedImageId(img.id);
              }}
              onChange={(newAttrs) => {
                  updateUnderlayImage(img.id, newAttrs);
              }}
            />
          ))}
        </Layer>

        <Layer>
          {Object.values(segments).map((seg) => {
            const isSelected = selectedIds.has(seg.id);
            const strokeColor = isSelected ? '#eab308' : '#9ca3af';

            const p1 = seg.points[0];
            const p2 = seg.points[seg.points.length - 1];
            const isRiser = Math.abs(p1.x - p2.x) < 0.001 && Math.abs(p1.y - p2.y) < 0.001 && Math.abs((p1.z || 0) - (p2.z || 0)) > 0.001;

            if (isRiser) {
              return (
                <Circle
                  key={seg.id}
                  x={p1.x}
                  y={p1.y}
                  radius={5}
                  fill={strokeColor}
                  stroke="#1f2937"
                  strokeWidth={1}
                  onClick={() => { if (activeTool === 'select') selectObject(seg.id); }}
                />
              );
            }

            return (
              <Line
                key={seg.id}
                points={seg.points.flatMap((p) => [p.x, p.y])}
                stroke={strokeColor}
                strokeWidth={isSelected ? 3 : 2}
                tension={seg.geometryKind === 'spline' ? 0.5 : 0}
                hitStrokeWidth={10}
                onClick={() => { if (activeTool === 'select') selectObject(seg.id); }}
              />
            );
          })}

          {Object.values(inlineItems).map(item => {
            const isSelected = selectedIds.has(item.id);
            const color = isSelected ? '#eab308' : '#92400e';
            return (
              <Group
                key={item.id}
                x={item.x}
                y={item.y}
                rotation={item.angle}
                onClick={() => { if (activeTool === 'select') selectObject(item.id); }}
              >
                {item.type === 'valve' && (<Path data="M -8 -8 L 8 8 L -8 8 L 8 -8 Z" fill={color} />)}
                {item.type === 'flange' && (<Rect x={-4} y={-12} width={8} height={24} fill={color} />)}
                {item.type === 'fvf' && (
                  <Group>
                    <Rect x={-16} y={-12} width={8} height={24} fill={color} />
                    <Path data="M -8 -8 L 8 8 L -8 8 L 8 -8 Z" fill={color} />
                    <Rect x={8} y={-12} width={8} height={24} fill={color} />
                  </Group>
                )}
                {item.type === 'reducer' && (
                  <Line
                    points={[-10, -8, 10, -4, 10, 4, -10, 8, -10, -8]}
                    closed
                    fill={color}
                    stroke={isSelected ? '#fbbf24' : undefined}
                    strokeWidth={isSelected ? 1.5 : 0}
                    opacity={0.9}
                  />
                )}
              </Group>
            )
          })}

          {Object.values(supports).map(support => {
            const isSelected = selectedIds.has(support.id);
            const color = isSelected ? '#eab308' : '#16a34a';
            return (
               <Group
                  key={support.id}
                  x={support.x}
                  y={support.y}
                  onClick={() => { if (activeTool === 'select') selectObject(support.id); }}
               >
                 <Line points={[-10, 0, 10, 0]} stroke={color} strokeWidth={4} />
                 <Line points={[0, -10, 0, 10]} stroke={color} strokeWidth={4} />
                 <Circle radius={3} fill={color} />
               </Group>
            );
          })}

          {/* Marquee Drag Box */}
          {isMarqueeing && (
            <Rect
              x={Math.min(marqueeStart.x, marqueeEnd.x)}
              y={Math.min(marqueeStart.y, marqueeEnd.y)}
              width={Math.abs(marqueeEnd.x - marqueeStart.x)}
              height={Math.abs(marqueeEnd.y - marqueeStart.y)}
              fill="rgba(59, 130, 246, 0.2)"
              stroke={marqueeStart.x < marqueeEnd.x ? "#3b82f6" : "#22c55e"}
              strokeWidth={1 / scale}
              dash={marqueeStart.x < marqueeEnd.x ? [] : [5/scale, 5/scale]}
            />
          )}

          {/* OSNAP Visualization */}
          {snap && (
             <Group x={snap.pt.x} y={snap.pt.y}>
               {snap.type === 'endpoint' && <Rect x={-6/scale} y={-6/scale} width={12/scale} height={12/scale} stroke="#10b981" strokeWidth={2/scale} />}
               {snap.type === 'midpoint' && <Path data={`M 0 -${8/scale} L ${8/scale} ${6/scale} L -${8/scale} ${6/scale} Z`} stroke="#f59e0b" strokeWidth={2/scale} />}
               {snap.type === 'nearest' && (
                 <Group>
                    <Line points={[-(6/scale), -(6/scale), (6/scale), (6/scale)]} stroke="#ef4444" strokeWidth={2/scale} />
                    <Line points={[-(6/scale), (6/scale), (6/scale), -(6/scale)]} stroke="#ef4444" strokeWidth={2/scale} />
                 </Group>
               )}
             </Group>
          )}

          {isDrawing && draftPoints.length >= 2 && (
            <Line
              points={draftPoints.flatMap(p => [p.x, p.y])}
              stroke="#60a5fa"
              strokeWidth={2}
              dash={[5, 5]}
              tension={activeTool === 'spline' ? 0.5 : 0}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
};

export default Smart2Dcanvas_CanvasViewport;
