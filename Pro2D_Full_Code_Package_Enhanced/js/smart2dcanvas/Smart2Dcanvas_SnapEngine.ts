import { useSceneStore } from './Smart2Dcanvas_SceneStore';

export type SnapResult = {
  pt: { x: number; y: number; z?: number };
  kind: 'endpoint' | 'inline' | 'support';
  id: string;
  distance: number;
};

export function calculateSnap(x: number, y: number, scale = 1): SnapResult | null {
  const state = useSceneStore.getState();
  const threshold = 14 / Math.max(scale || 1, 0.001);
  let best: SnapResult | null = null;

  const consider = (pt: { x: number; y: number; z?: number }, kind: SnapResult['kind'], id: string) => {
    const dx = pt.x - x;
    const dy = pt.y - y;
    const d = Math.hypot(dx, dy);
    if (d > threshold) return;
    if (!best || d < best.distance) {
      best = { pt, kind, id, distance: d };
    }
  };

  Object.values(state.segments).forEach((seg) => {
    if (!seg.points?.length) return;
    consider(seg.points[0], 'endpoint', seg.id);
    consider(seg.points[seg.points.length - 1], 'endpoint', seg.id);
  });

  Object.values(state.inlineItems).forEach((item) => {
    consider({ x: item.x, y: item.y }, 'inline', item.id);
  });

  Object.values(state.supports).forEach((support) => {
    consider({ x: support.x, y: support.y }, 'support', support.id);
  });

  return best;
}
