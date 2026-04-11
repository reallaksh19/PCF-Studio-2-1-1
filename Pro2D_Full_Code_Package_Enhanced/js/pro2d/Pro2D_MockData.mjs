export const Pro2D_mockRoute = [
  [0, 0], [0, 13000], [8000, 13000], [8000, 6000], [2000, 6000],
  [2000, -2000], [11000, -2000], [11000, 9000], [16000, 9000],
];

export const Pro2D_mockSupportPoints = [
  [-600, 4000], [700, 10000], [4000, 12400], [8600, 9500], [5000, 5400], [1400, 2000],
];

export const Pro2D_mockEmits = Pro2D_mockSupportPoints.map((pt, i) => ({
  id: `emit_${i+1}`,
  p1: pt,
  p2: [pt[0] + 1200, pt[1]],
}));

export const Pro2D_mockInlineItems = [
  { id: 'item_v1', type: 'valve', x: 0, y: 10000, angle: 90, occupiedLength: 500, insertionStation: 0, weight: 180 },
  { id: 'item_f1', type: 'flange', x: 8000, y: 9000, angle: 0, occupiedLength: 100, insertionStation: 0, weight: 35 },
  { id: 'item_r1', type: 'reducer', x: 2500, y: -2000, angle: 0, occupiedLength: 300, insertionStation: 0, upstreamBore: 250, downstreamBore: 200, reducerType: 'eccentric', metadata: { skey: 'REBW' } },
];
