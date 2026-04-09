import { useSceneStore } from './Smart2Dcanvas_SceneStore';
import { Point } from './Smart2Dcanvas_GeometryTypes';

export type SnapType = 'endpoint' | 'midpoint' | 'nearest' | 'intersection' | null;

export interface SnapResult {
  pt: { x: number; y: number; z?: number };
  type: SnapType;
  dist: number;
}

export const calculateSnap = (
  mouseX: number,
  mouseY: number,
  scale: number,
  skipSegmentId: string | null = null
): SnapResult | null => {
  const state = useSceneStore.getState();
  const segments = Object.values(state.segments);
  const snapRadius = 15 / scale;

  let bestSnap: SnapResult | null = null;
  
  const updateBestSnap = (newSnap: SnapResult) => {
    if (!bestSnap || newSnap.dist < bestSnap.dist) {
      bestSnap = newSnap;
    }
  };

  segments.forEach(seg => {
    if (seg.id === skipSegmentId) return;
    
    // Check Endpoints
    seg.points.forEach(pt => {
      const dist = Math.hypot(pt.x - mouseX, pt.y - mouseY);
      if (dist <= snapRadius) {
        updateBestSnap({ pt: { x: pt.x, y: pt.y, z: pt.z }, type: 'endpoint', dist });
      }
    });

    // Check Midpoints and Nearest
    for (let i = 0; i < seg.points.length - 1; i++) {
      const p1 = seg.points[i];
      const p2 = seg.points[i + 1];
      
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      const midDist = Math.hypot(midX - mouseX, midY - mouseY);
      
      if (midDist <= snapRadius) {
        updateBestSnap({ pt: { x: midX, y: midY, z: p1.z }, type: 'midpoint', dist: midDist });
      }

      // Check Nearest
      const ab = { x: p2.x - p1.x, y: p2.y - p1.y };
      const ap = { x: mouseX - p1.x, y: mouseY - p1.y };
      const ab2 = ab.x * ab.x + ab.y * ab.y;
      
      let t = (ab2 === 0) ? 0 : (ap.x * ab.x + ap.y * ab.y) / ab2;
      t = Math.max(0, Math.min(1, t));
      
      const projX = p1.x + ab.x * t;
      const projY = p1.y + ab.y * t;
      const projDist = Math.hypot(projX - mouseX, projY - mouseY);
      
      if (projDist <= snapRadius) {
        updateBestSnap({ pt: { x: projX, y: projY, z: p1.z }, type: 'nearest', dist: projDist });
      }
    }
  });

  return bestSnap;
};
