export interface Point {
  id: string;
  x: number;
  y: number;
  z: number;
}

export interface Node {
  id: string;
  x: number;
  y: number;
  z: number;
  type: string;
  attachedItemIds: string[];
}

export interface Segment {
  id: string;
  startNodeId: string;
  endNodeId: string;
  geometryKind: 'line' | 'polyline' | 'spline';
  points: Point[];
  sizeSpecFields?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface InlineItem {
  id: string;
  type: 'valve' | 'flange' | 'fvf' | 'reducer';
  hostSegmentId?: string;
  hostNodeId?: string;
  insertionStation: number;
  occupiedLength: number;
  weight?: number;
  metadata?: Record<string, any>;
  inheritanceState?: any;
  x?: number;
  y?: number;
  angle?: number;
  // Reducer-specific fields
  upstreamBore?: number;
  downstreamBore?: number;
  reducerType?: 'concentric' | 'eccentric';
}

export interface Support {
  id: string;
  nodeId: string;
  supportType: string;
  tag?: string;
  load?: number;
  metadata?: Record<string, any>;
  x?: number;
  y?: number;
}

export interface Fitting {
  id: string;
  type: 'bend' | 'tee' | 'olet';
  centerNodeId: string;
  angle?: number;
  branchInfo?: Record<string, any>;
  takeoutFields?: Record<string, any>;
  sizeSpec?: Record<string, any>;
}

export interface UnderlayImage {
  id: string;
  source: string;
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  opacity: number;
  locked: boolean;
  width: number;
  height: number;
}
