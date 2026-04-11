import { create } from 'zustand';
import { enableMapSet } from 'immer';
import { immer } from 'zustand/middleware/immer';
import type {
  Node,
  Segment,
  InlineItem,
  Support,
  Fitting,
  UnderlayImage,
} from './Smart2Dcanvas_GeometryTypes';

enableMapSet();

export type ToolType = 'select' | 'pan' | 'line' | 'polyline' | 'spline' | 'support' | 'valve' | 'flange' | 'fvf' | 'reducer';

interface SceneSnapshot {
  segments: Record<string, Segment>;
  inlineItems: Record<string, InlineItem>;
  supports: Record<string, Support>;
  fittings: Record<string, Fitting>;
}

interface SceneBundle {
  segments?: Record<string, Segment>;
  inlineItems?: Record<string, InlineItem>;
  supports?: Record<string, Support>;
  fittings?: Record<string, Fitting>;
}

const MAX_HISTORY = 50;

interface SceneState {
  // View State
  scale: number;
  panX: number;
  panY: number;
  cursorX: number;
  cursorY: number;

  // Tool State
  activeTool: ToolType;

  // Elevation State
  currentElevation: number;

  // Selection
  selectedIds: Set<string>;

  // Geometry & Topology
  nodes: Record<string, Node>;
  segments: Record<string, Segment>;
  inlineItems: Record<string, InlineItem>;
  supports: Record<string, Support>;
  fittings: Record<string, Fitting>;

  // Underlay
  underlayImages: Record<string, UnderlayImage>;

  // Drafting State
  currentDraftingSegment?: Partial<Segment>;
  isOrtho: boolean;
  isOsnap: boolean;
  setOrtho: (val: boolean) => void;
  setOsnap: (val: boolean) => void;

  // History
  history: SceneSnapshot[];
  future: SceneSnapshot[];
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;

  // Actions
  setScale: (scale: number) => void;
  setPan: (x: number, y: number) => void;
  setCursor: (x: number, y: number) => void;
  setActiveTool: (tool: ToolType) => void;
  setCurrentElevation: (elevation: number) => void;
  selectObject: (id: string, additive?: boolean) => void;
  selectNext: () => void;
  selectPrev: () => void;
  clearSelection: () => void;
  deleteSelected: () => void;

  addSegment: (segment: Segment) => void;
  updateSegment: (id: string, updates: Partial<Segment>) => void;
  removeSegment: (id: string) => void;

  addInlineItem: (item: InlineItem) => void;
  updateInlineItem: (id: string, updates: Partial<InlineItem>) => void;
  addSupport: (support: Support) => void;
  updateSupport: (id: string, updates: Partial<Support>) => void;
  addFitting: (fitting: Fitting) => void;

  addUnderlayImage: (image: UnderlayImage) => void;
  updateUnderlayImage: (id: string, updates: Partial<UnderlayImage>) => void;
  resetScene: () => void;
  loadSceneBundle: (bundle: SceneBundle) => void;
}

function takeSnapshot(state: SceneState): SceneSnapshot {
  return {
    segments: JSON.parse(JSON.stringify(state.segments)),
    inlineItems: JSON.parse(JSON.stringify(state.inlineItems)),
    supports: JSON.parse(JSON.stringify(state.supports)),
    fittings: JSON.parse(JSON.stringify(state.fittings)),
  };
}

export const useSceneStore = create<SceneState>()(
  immer((set, get) => ({
    scale: 1,
    panX: 0,
    panY: 0,
    cursorX: 0,
    cursorY: 0,
    activeTool: 'select',
    currentElevation: 0,
    selectedIds: new Set(),
    nodes: {},
    segments: {},
    inlineItems: {},
    supports: {},
    fittings: {},
    underlayImages: {},
    history: [],
    future: [],

    setScale: (scale) => set((state) => { state.scale = scale; }),
    setPan: (x, y) => set((state) => { state.panX = x; state.panY = y; }),
    setCursor: (x, y) => set((state) => { state.cursorX = x; state.cursorY = y; }),
    setActiveTool: (tool) => set((state) => { state.activeTool = tool; }),
    setCurrentElevation: (elevation) => set((state) => { state.currentElevation = elevation; }),

    isOrtho: false,
    isOsnap: true,
    setOrtho: (val) => set({ isOrtho: val }),
    setOsnap: (val) => set({ isOsnap: val }),

    pushHistory: () => set((state) => {
      const snap = takeSnapshot(state as unknown as SceneState);
      state.history.push(snap);
      if (state.history.length > MAX_HISTORY) state.history.shift();
      state.future = [];
    }),

    undo: () => set((state) => {
      if (state.history.length === 0) return;
      const snap = state.history.pop()!;
      state.future.push(takeSnapshot(state as unknown as SceneState));
      state.segments = snap.segments;
      state.inlineItems = snap.inlineItems;
      state.supports = snap.supports;
      state.fittings = snap.fittings;
      state.selectedIds.clear();
    }),

    redo: () => set((state) => {
      if (state.future.length === 0) return;
      const snap = state.future.pop()!;
      state.history.push(takeSnapshot(state as unknown as SceneState));
      state.segments = snap.segments;
      state.inlineItems = snap.inlineItems;
      state.supports = snap.supports;
      state.fittings = snap.fittings;
      state.selectedIds.clear();
    }),

    selectObject: (id, additive = false) => set((state) => {
      if (!additive) {
        state.selectedIds.clear();
      }
      if (state.selectedIds.has(id)) {
        state.selectedIds.delete(id);
      } else {
        state.selectedIds.add(id);
      }
    }),

    selectNext: () => set((state) => {
      const allIds = Object.keys(state.segments);
      if (allIds.length === 0) return;

      const currentArr = Array.from(state.selectedIds);
      let nextIndex = 0;

      if (currentArr.length > 0) {
        const lastSelected = currentArr[currentArr.length - 1];
        const currentIndex = allIds.indexOf(lastSelected);
        if (currentIndex !== -1) {
          nextIndex = (currentIndex + 1) % allIds.length;
        }
      }

      state.selectedIds.clear();
      state.selectedIds.add(allIds[nextIndex]);
    }),

    selectPrev: () => set((state) => {
      const allIds = Object.keys(state.segments);
      if (allIds.length === 0) return;

      const currentArr = Array.from(state.selectedIds);
      let prevIndex = allIds.length - 1;

      if (currentArr.length > 0) {
        const lastSelected = currentArr[currentArr.length - 1];
        const currentIndex = allIds.indexOf(lastSelected);
        if (currentIndex !== -1) {
          prevIndex = (currentIndex - 1 + allIds.length) % allIds.length;
        }
      }

      state.selectedIds.clear();
      state.selectedIds.add(allIds[prevIndex]);
    }),

    clearSelection: () => set((state) => { state.selectedIds.clear(); }),

    deleteSelected: () => set((state) => {
      // push history before delete
      const snap = takeSnapshot(state as unknown as SceneState);
      state.history.push(snap);
      if (state.history.length > MAX_HISTORY) state.history.shift();
      state.future = [];

      state.selectedIds.forEach(id => {
        if (state.segments[id]) delete state.segments[id];
        if (state.inlineItems[id]) delete state.inlineItems[id];
        if (state.supports[id]) delete state.supports[id];
      });
      state.selectedIds.clear();
    }),

    addSegment: (segment) => set((state) => {
      const snap = takeSnapshot(state as unknown as SceneState);
      state.history.push(snap);
      if (state.history.length > MAX_HISTORY) state.history.shift();
      state.future = [];
      state.segments[segment.id] = segment;
    }),

    updateSegment: (id, updates) => set((state) => {
      if (state.segments[id]) {
        state.segments[id] = { ...state.segments[id], ...updates };
      }
    }),

    removeSegment: (id) => set((state) => {
      delete state.segments[id];
    }),

    addInlineItem: (item) => set((state) => {
      const snap = takeSnapshot(state as unknown as SceneState);
      state.history.push(snap);
      if (state.history.length > MAX_HISTORY) state.history.shift();
      state.future = [];
      state.inlineItems[item.id] = item;
    }),

    updateInlineItem: (id, updates) => set((state) => {
      if (state.inlineItems[id]) {
        state.inlineItems[id] = { ...state.inlineItems[id], ...updates };
      }
    }),

    addSupport: (support) => set((state) => {
      const snap = takeSnapshot(state as unknown as SceneState);
      state.history.push(snap);
      if (state.history.length > MAX_HISTORY) state.history.shift();
      state.future = [];
      state.supports[support.id] = support;
    }),

    updateSupport: (id, updates) => set((state) => {
      if (state.supports[id]) {
        state.supports[id] = { ...state.supports[id], ...updates };
      }
    }),

    addFitting: (fitting) => set((state) => {
      state.fittings[fitting.id] = fitting;
    }),

    addUnderlayImage: (image) => set((state) => {
      state.underlayImages[image.id] = image;
    }),

    updateUnderlayImage: (id, updates) => set((state) => {
      if (state.underlayImages[id]) {
        state.underlayImages[id] = { ...state.underlayImages[id], ...updates };
      }
    }),

    resetScene: () => set((state) => {
      state.nodes = {};
      state.segments = {};
      state.inlineItems = {};
      state.supports = {};
      state.fittings = {};
      state.selectedIds.clear();
      state.history = [];
      state.future = [];
    }),

    loadSceneBundle: (bundle) => set((state) => {
      state.nodes = {};
      state.segments = bundle.segments || {};
      state.inlineItems = bundle.inlineItems || {};
      state.supports = bundle.supports || {};
      state.fittings = bundle.fittings || {};
      state.selectedIds.clear();
      state.history = [];
      state.future = [];
    }),
  }))
);
