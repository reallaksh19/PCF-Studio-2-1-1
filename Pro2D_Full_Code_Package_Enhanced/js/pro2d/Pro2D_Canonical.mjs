import { Pro2D_createHeaderRegistry, Pro2D_registerDynamicHeaders } from './Pro2D_HeaderRegistry.mjs';
import { Pro2D_mockRoute, Pro2D_mockSupportPoints, Pro2D_mockInlineItems } from './Pro2D_MockData.mjs';

let __seq = 0;
function Pro2D_nextId(prefix) {
  __seq += 1;
  return `${prefix}_${String(__seq).padStart(4,'0')}`;
}

export function Pro2D_createEmptyState(name = 'Pro 2D Canvas Document') {
  return {
    schemaVersion: '1.0.0',
    document: {
      documentId: Pro2D_nextId('doc'),
      name,
      units: 'mm',
      coordinateSystem: '2d-world',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sourceKinds: [],
    },
    nodes: {},
    entities: {},
    routes: {},
    layers: {
      L_PROCESS: { id: 'L_PROCESS', name: 'Process', color: '#93c5fd', visible: true },
      L_SUPPORT: { id: 'L_SUPPORT', name: 'Supports', color: '#4ade80', visible: true },
      L_HELPER: { id: 'L_HELPER', name: 'Helpers', color: '#f59e0b', visible: true },
      L_UNKNOWN: { id: 'L_UNKNOWN', name: 'Unknown', color: '#cbd5e1', visible: true },
    },
    headers: Pro2D_createHeaderRegistry(),
    provenance: [],
    validation: { issues: [], lastRunAt: null, summary: null },
  };
}

export function Pro2D_addNode(state, pt, kind = 'FREE', provenance = []) {
  const id = Pro2D_nextId('node');
  state.nodes[id] = { id, pt: { x: pt.x, y: pt.y, z: pt.z ?? 0 }, kind, entityIds: [], dynamic: {}, provenance };
  return id;
}

export function Pro2D_attachNode(state, nodeId, entityId) {
  if (!state.nodes[nodeId]) return;
  if (!state.nodes[nodeId].entityIds.includes(entityId)) state.nodes[nodeId].entityIds.push(entityId);
}

export function Pro2D_addEntity(state, entity) {
  state.entities[entity.id] = entity;
  entity.geometry?.nodeIds?.forEach((nodeId) => Pro2D_attachNode(state, nodeId, entity.id));
  for (const ref of entity.provenance || []) {
    if (ref.sourceKind) state.document.sourceKinds = Array.from(new Set([...(state.document.sourceKinds || []), ref.sourceKind]));
    if (entity.metadata?.imported?.[ref.sourceKind]) {
      Pro2D_registerDynamicHeaders(state.headers, ref.sourceKind, entity.metadata.imported[ref.sourceKind]);
    }
  }
  return entity.id;
}

export function Pro2D_addRoute(state, route) {
  state.routes[route.id] = route;
  return route.id;
}

export function Pro2D_makePipeEntity(state, a, b, options = {}) {
  const n1 = Pro2D_addNode(state, { x: a[0], y: a[1], z: a[2] ?? 0 }, 'PIPE_ENDPOINT', options.provenance || []);
  const n2 = Pro2D_addNode(state, { x: b[0], y: b[1], z: b[2] ?? 0 }, 'PIPE_ENDPOINT', options.provenance || []);
  const id = options.id || Pro2D_nextId('ent');
  return {
    id,
    type: 'PIPE',
    routeId: options.routeId,
    layerId: options.layerId || 'L_PROCESS',
    geometry: {
      nodeIds: [n1, n2],
      path: [state.nodes[n1].pt, state.nodes[n2].pt],
    },
    topology: {
      connectionNodeIds: [n1, n2],
      prevEntityId: options.prevEntityId,
      nextEntityId: options.nextEntityId,
    },
    engineering: {
      nd: options.nd ?? 250,
      boreA: options.nd ?? 250,
      wallThickness: options.wallThickness ?? 9.53,
      specKey: options.specKey || 'BEBW',
      material: options.material || '106',
    },
    display: { visible: true, color: '#9ca3af', strokeWidth: 2, lineType: 'CONTINUOUS' },
    metadata: { imported: options.imported || {}, appState: options.appState || {}, datatable: options.datatable || {} },
    provenance: options.provenance || [{ sourceKind: 'manual' }],
    dynamic: options.dynamic || {},
  };
}

export function Pro2D_makeSupportEntity(state, pt, hostEntityId, options = {}) {
  const nodeId = Pro2D_addNode(state, { x: pt[0], y: pt[1], z: pt[2] ?? 0 }, 'SUPPORT_POINT', options.provenance || []);
  return {
    id: options.id || Pro2D_nextId('ent'),
    type: 'SUPPORT',
    routeId: options.routeId,
    layerId: options.layerId || 'L_SUPPORT',
    geometry: { nodeIds: [nodeId], center: state.nodes[nodeId].pt },
    topology: {
      connectionNodeIds: [nodeId],
      attachedToEntityId: hostEntityId,
      attachedAtNodeId: nodeId,
      attachmentRole: 'POINT',
    },
    engineering: {
      supportType: options.supportType || 'CA150',
      specKey: options.specKey || 'SUPT',
    },
    display: { visible: true, color: '#16a34a', label: options.supportType || 'CA150', iconKey: 'support' },
    metadata: { imported: options.imported || {}, appState: options.appState || {}, datatable: options.datatable || {} },
    provenance: options.provenance || [{ sourceKind: 'manual' }],
    dynamic: options.dynamic || {},
  };
}

export function Pro2D_makeInlineEntity(state, type, pt, options = {}) {
  const nodeId = Pro2D_addNode(state, { x: pt[0], y: pt[1], z: pt[2] ?? 0 }, 'INLINE', options.provenance || []);
  const entityType = String(type || '').toUpperCase() === 'REDUCER' ? 'REDUCER' : String(type || '').toUpperCase();
  const base = {
    id: options.id || Pro2D_nextId('ent'),
    type: entityType,
    routeId: options.routeId,
    layerId: options.layerId || 'L_PROCESS',
    geometry: { nodeIds: [nodeId], center: state.nodes[nodeId].pt },
    topology: { connectionNodeIds: [nodeId], attachedToEntityId: options.hostEntityId, attachmentRole: 'INLINE' },
    engineering: {
      nd: options.nd ?? 250,
      boreA: options.upstreamBore ?? options.nd ?? 250,
      boreB: options.downstreamBore ?? options.nd ?? 250,
      specKey: options.specKey || options.skey || (entityType === 'VALVE' ? 'VLBT' : entityType === 'FLANGE' ? 'FLWN' : entityType === 'REDUCER' ? 'RCON' : 'GEN'),
      valveType: entityType === 'VALVE' ? (options.valveType || 'GATE') : undefined,
      reducerType: entityType === 'REDUCER' ? (options.reducerType || 'CONCENTRIC') : undefined,
    },
    display: { visible: true, color: '#a16207', label: entityType },
    metadata: { imported: options.imported || {}, appState: options.appState || {}, datatable: options.datatable || {} },
    provenance: options.provenance || [{ sourceKind: 'manual' }],
    dynamic: options.dynamic || {},
  };
  return base;
}

/**
 * Construct a new bend entity linking two nodes. Bends are modeled separately
 * from pipes so that curved geometry and engineering metadata may be
 * preserved. The caller supplies the entry and exit points as well as the
 * curve center; radius and angle are derived automatically. All nodes will be
 * created within the provided state and attached to the returned entity.
 *
 * @param {object} state Canonical state to mutate
 * @param {[number,number,number]} ep1 Start point of the bend (x,y,z)
 * @param {[number,number,number]} center Center point of the bend (x,y,z)
 * @param {[number,number,number]} ep2 End point of the bend (x,y,z)
 * @param {object} options Additional fields such as routeId, layerId, nd, specKey
 */
export function Pro2D_makeBendEntity(state, ep1, center, ep2, options = {}) {
  // Create two endpoint nodes; treat bend endpoints as inline nodes to
  // differentiate from pipe endpoints which are always line segments.
  const n1 = Pro2D_addNode(state, { x: ep1[0], y: ep1[1], z: ep1[2] ?? 0 }, 'BEND_ENDPOINT', options.provenance || []);
  const n2 = Pro2D_addNode(state, { x: ep2[0], y: ep2[1], z: ep2[2] ?? 0 }, 'BEND_ENDPOINT', options.provenance || []);
  const dx1 = ep1[0] - center[0];
  const dy1 = ep1[1] - center[1];
  const dx2 = ep2[0] - center[0];
  const dy2 = ep2[1] - center[1];
  const r1 = Math.hypot(dx1, dy1);
  const r2 = Math.hypot(dx2, dy2);
  // Choose the average of radii if they differ slightly due to rounding.
  const radius = (r1 + r2) / 2;
  // Compute the swept angle in degrees between entry and exit vectors. The
  // cross and dot products determine orientation; assume CCW positive.
  const dot = dx1 * dx2 + dy1 * dy2;
  const det = dx1 * dy2 - dy1 * dx2;
  let angle = Math.atan2(det, dot) * 180 / Math.PI;
  if (angle < 0) angle += 360;
  const id = options.id || Pro2D_nextId('ent');
  return {
    id,
    type: 'BEND',
    routeId: options.routeId,
    layerId: options.layerId || 'L_PROCESS',
    geometry: {
      nodeIds: [n1, n2],
      path: [state.nodes[n1].pt, state.nodes[n2].pt],
      center: { x: center[0], y: center[1], z: center[2] ?? 0 },
      radius,
    },
    topology: {
      connectionNodeIds: [n1, n2],
      prevEntityId: options.prevEntityId,
      nextEntityId: options.nextEntityId,
    },
    engineering: {
      nd: options.nd ?? 250,
      radius,
      angle_deg: angle,
      specKey: options.specKey || options.skey || 'ELBW',
    },
    display: { visible: true, color: '#fbbf24', strokeWidth: 2, lineType: 'CURVE' },
    metadata: { imported: options.imported || {}, appState: options.appState || {}, datatable: options.datatable || {} },
    provenance: options.provenance || [{ sourceKind: 'manual' }],
    dynamic: options.dynamic || {},
  };
}

/**
 * Construct a new tee entity at a junction point. Tees are three‑way
 * connection fittings that attach to an existing host pipe; by default a
 * single node is created to represent the tee. Additional nodes may be
 * supplied via options. Engineering data captures the bore diameters and
 * specification code. The tee entity is always assigned to the process layer.
 *
 * @param {object} state Canonical state to mutate
 * @param {[number,number,number]} pt Centre point of the tee
 * @param {object} options Additional fields such as bore sizes, hostEntityId and routeId
 */
export function Pro2D_makeTeeEntity(state, pt, options = {}) {
  const nodeId = Pro2D_addNode(state, { x: pt[0], y: pt[1], z: pt[2] ?? 0 }, 'TEE', options.provenance || []);
  return {
    id: options.id || Pro2D_nextId('ent'),
    type: 'TEE',
    routeId: options.routeId,
    layerId: options.layerId || 'L_PROCESS',
    geometry: { nodeIds: [nodeId], center: state.nodes[nodeId].pt },
    topology: {
      connectionNodeIds: [nodeId],
      attachedToEntityId: options.hostEntityId,
      attachmentRole: 'INLINE',
    },
    engineering: {
      nd: options.nd ?? 250,
      boreRun: options.boreRun ?? options.nd ?? 250,
      boreBranch: options.boreBranch ?? options.nd ?? 250,
      specKey: options.specKey || options.skey || 'TEE',
    },
    display: { visible: true, color: '#a855f7', label: 'TEE' },
    metadata: { imported: options.imported || {}, appState: options.appState || {}, datatable: options.datatable || {} },
    provenance: options.provenance || [{ sourceKind: 'manual' }],
    dynamic: options.dynamic || {},
  };
}

export function Pro2D_buildFromRoutePoints(routePoints, options = {}) {
  const state = Pro2D_createEmptyState(options.name || 'Pro2D Route Import');
  const routeId = Pro2D_nextId('route');
  const entityIds = [];
  for (let i = 0; i < routePoints.length - 1; i += 1) {
    const pipe = Pro2D_makePipeEntity(state, routePoints[i], routePoints[i+1], {
      routeId,
      nd: options.nd ?? 250,
      specKey: options.specKey || 'BEBW',
      provenance: options.provenance || [{ sourceKind: options.sourceKind || 'app-state' }],
      imported: options.imported || {},
    });
    if (entityIds.length) pipe.topology.prevEntityId = entityIds[entityIds.length - 1];
    Pro2D_addEntity(state, pipe);
    const prev = entityIds[entityIds.length - 1];
    if (prev) state.entities[prev].topology.nextEntityId = pipe.id;
    entityIds.push(pipe.id);
  }
  Pro2D_addRoute(state, {
    id: routeId,
    name: options.routeName || 'Main Route',
    entityIds,
    startNodeId: entityIds.length ? state.entities[entityIds[0]].geometry.nodeIds[0] : undefined,
    endNodeId: entityIds.length ? state.entities[entityIds[entityIds.length-1]].geometry.nodeIds[1] : undefined,
    branchRouteIds: [],
    routeKind: 'PRIMARY',
    dynamic: {},
  });
  state.document.updatedAt = new Date().toISOString();
  return state;
}

export function Pro2D_addSupportsToState(state, supportPoints = []) {
  const firstEntityId = Object.keys(state.entities)[0];
  supportPoints.forEach((pt) => {
    const support = Pro2D_makeSupportEntity(state, pt, firstEntityId, { provenance: [{ sourceKind: 'manual' }] });
    Pro2D_addEntity(state, support);
  });
  return state;
}

export function Pro2D_addInlineItemsToState(state, items = []) {
  const firstEntityId = Object.keys(state.entities)[0];
  items.forEach((item) => {
    const type = item.type === 'valve' ? 'VALVE' : item.type === 'flange' ? 'FLANGE' : item.type === 'reducer' ? 'REDUCER' : 'VALVE';
    const ent = Pro2D_makeInlineEntity(state, type, [item.x, item.y, 0], {
      hostEntityId: firstEntityId,
      nd: item.upstreamBore || 250,
      upstreamBore: item.upstreamBore,
      downstreamBore: item.downstreamBore,
      reducerType: item.reducerType ? item.reducerType.toUpperCase() : undefined,
      skey: item.metadata?.skey,
      provenance: [{ sourceKind: 'manual' }],
    });
    Pro2D_addEntity(state, ent);
  });
  return state;
}

export function Pro2D_toSceneBundle(state) {
  const segments = {};
  const inlineItems = {};
  const supports = {};
  const fittings = {};
  Object.values(state.entities).forEach((entity) => {
    if (entity.type === 'PIPE') {
      const points = (entity.geometry.path || []).map((p, idx) => ({ id: `${entity.id}_pt${idx}`, x: p.x, y: p.y, z: p.z || 0 }));
      segments[entity.id] = {
        id: entity.id,
        startNodeId: entity.geometry.nodeIds[0],
        endNodeId: entity.geometry.nodeIds[entity.geometry.nodeIds.length - 1],
        geometryKind: points.length > 2 ? 'polyline' : 'line',
        points,
        sizeSpecFields: {
          bore: entity.engineering.nd,
          wallThickness: entity.engineering.wallThickness,
          specKey: entity.engineering.specKey,
          material: entity.engineering.material,
        },
        metadata: entity.metadata,
      };
    }
    if (['VALVE', 'FLANGE', 'REDUCER'].includes(entity.type)) {
      inlineItems[entity.id] = {
        id: entity.id,
        type: entity.type === 'VALVE' ? 'valve' : entity.type === 'FLANGE' ? 'flange' : 'reducer',
        insertionStation: 0,
        occupiedLength: entity.type === 'FLANGE' ? 100 : entity.type === 'VALVE' ? 500 : 300,
        x: entity.geometry.center?.x ?? entity.geometry.path?.[0]?.x ?? 0,
        y: entity.geometry.center?.y ?? entity.geometry.path?.[0]?.y ?? 0,
        angle: 0,
        upstreamBore: entity.engineering.boreA,
        downstreamBore: entity.engineering.boreB,
        reducerType: entity.engineering.reducerType ? String(entity.engineering.reducerType).toLowerCase() : undefined,
        metadata: { ...entity.metadata, skey: entity.engineering.specKey },
      };
    }
    if (entity.type === 'SUPPORT') {
      supports[entity.id] = {
        id: entity.id,
        nodeId: entity.geometry.nodeIds[0],
        supportType: entity.engineering.supportType || 'CA150',
        x: entity.geometry.center?.x ?? 0,
        y: entity.geometry.center?.y ?? 0,
        metadata: entity.metadata,
      };
    }
    if (entity.type === 'BEND') {
      // Map bends into the fittings bag. Consumers can choose to render them
      // either as arcs or approximate them as straight segments. The centre
      // coordinates, radius and angle are preserved in engineering fields.
      fittings[entity.id] = {
        id: entity.id,
        type: 'bend',
        startNodeId: entity.geometry.nodeIds[0],
        endNodeId: entity.geometry.nodeIds[1],
        x: entity.geometry.center?.x ?? 0,
        y: entity.geometry.center?.y ?? 0,
        radius: entity.geometry.radius,
        angle_deg: entity.engineering.angle_deg,
        metadata: entity.metadata,
      };
    }
    if (entity.type === 'TEE') {
      // Tees are represented as fittings at a single node. The additional
      // bores and spec keys are included for downstream consumers.
      fittings[entity.id] = {
        id: entity.id,
        type: 'tee',
        nodeId: entity.geometry.nodeIds[0],
        x: entity.geometry.center?.x ?? 0,
        y: entity.geometry.center?.y ?? 0,
        boreRun: entity.engineering.boreRun,
        boreBranch: entity.engineering.boreBranch,
        metadata: entity.metadata,
      };
    }
  });
  return { segments, inlineItems, supports, fittings };
}

export function Pro2D_fromCoord2PcfSnapshot(snapshot = {}) {
  const runs = snapshot.parsedRuns || [];
  const routePoints = runs.flatMap((run) => (run.points || []).map((p) => [p.x, p.y, p.z || 0]));
  const state = Pro2D_buildFromRoutePoints(routePoints.length ? routePoints : Pro2D_mockRoute.map((p) => [p[0], p[1], 0]), {
    name: 'Coord2PCF Import',
    nd: Number(snapshot.options?.bore || 250),
    specKey: snapshot.options?.pipeSpecKey || 'BEBW',
    sourceKind: 'app-state',
    imported: { coord2pcf: { runCount: runs.length, pipelineRef: snapshot.options?.pipelineRef || '' } },
    provenance: [{ sourceKind: 'app-state', sourceId: 'coord2pcf-window' }],
  });
  Pro2D_addSupportsToState(state, (snapshot.supportPoints || Pro2D_mockSupportPoints).map((pt) => [pt[0], pt[1], 0]));
  Pro2D_addInlineItemsToState(state, snapshot.canvasFittings || Pro2D_mockInlineItems);
  return state;
}

export function Pro2D_buildMockState() {
  const state = Pro2D_buildFromRoutePoints(Pro2D_mockRoute.map((p) => [p[0], p[1], 0]), {
    name: 'Pro2D Mock Project',
    nd: 250,
    specKey: 'BEBW',
    sourceKind: 'manual',
  });
  Pro2D_addSupportsToState(state, Pro2D_mockSupportPoints.map((pt) => [pt[0], pt[1], 0]));
  Pro2D_addInlineItemsToState(state, Pro2D_mockInlineItems);
  return state;
}
