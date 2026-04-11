export function Pro2D_validateState(state) {
  const issues = [];
  const entityIds = new Set();
  for (const [id, entity] of Object.entries(state.entities || {})) {
    if (entityIds.has(id)) issues.push({ severity: 'error', code: 'DUPLICATE_ID', message: `Duplicate entity ID ${id}` });
    entityIds.add(id);
    if (!state.layers[entity.layerId]) issues.push({ severity: 'error', code: 'LAYER_MISSING', entityId: id, message: `Entity ${id} references missing layer ${entity.layerId}` });
    if (entity.type === 'PIPE') {
      if ((entity.geometry.nodeIds || []).length !== 2) issues.push({ severity: 'error', code: 'PIPE_NODE_COUNT', entityId: id, message: `Pipe ${id} must have exactly 2 nodes` });
      if ((entity.geometry.path || []).length < 2) issues.push({ severity: 'error', code: 'PIPE_PATH', entityId: id, message: `Pipe ${id} must have at least 2 path points` });
    }
    if (entity.type === 'SUPPORT') {
      if (!entity.topology.attachedToEntityId) issues.push({ severity: 'warning', code: 'SUPPORT_UNRESOLVED', entityId: id, message: `Support ${id} has no host entity` });
    }
    if (entity.type === 'REDUCER') {
      const a = Number(entity.engineering.boreA || 0);
      const b = Number(entity.engineering.boreB || 0);
      if (!a || !b || a === b) issues.push({ severity: 'warning', code: 'REDUCER_DIRECTION', entityId: id, message: `Reducer ${id} should have distinct boreA/boreB values` });
    }
    if (entity.type === 'BEND') {
      // A bend must connect exactly two nodes and define a centre point
      if ((entity.geometry.nodeIds || []).length !== 2) issues.push({ severity: 'error', code: 'BEND_NODE_COUNT', entityId: id, message: `Bend ${id} must have exactly 2 nodes` });
      if (!entity.geometry.center) issues.push({ severity: 'error', code: 'BEND_CENTER', entityId: id, message: `Bend ${id} is missing a centre point` });
    }
    if (entity.type === 'TEE') {
      // A tee should have at least one connection node and engineering data for run/branch bores
      if ((entity.geometry.nodeIds || []).length < 1) issues.push({ severity: 'error', code: 'TEE_NODE_COUNT', entityId: id, message: `Tee ${id} must have at least one node` });
      const run = Number(entity.engineering.boreRun || 0);
      const branch = Number(entity.engineering.boreBranch || 0);
      if (!run || !branch) issues.push({ severity: 'warning', code: 'TEE_BORE', entityId: id, message: `Tee ${id} has incomplete bore information` });
    }
    for (const nodeId of entity.geometry.nodeIds || []) {
      if (!state.nodes[nodeId]) issues.push({ severity: 'error', code: 'NODE_MISSING', entityId: id, message: `Entity ${id} references missing node ${nodeId}` });
    }
  }

  for (const [routeId, route] of Object.entries(state.routes || {})) {
    let prev = null;
    for (const entityId of route.entityIds || []) {
      const entity = state.entities[entityId];
      if (!entity) {
        issues.push({ severity: 'error', code: 'ROUTE_ENTITY_MISSING', routeId, message: `Route ${routeId} references missing entity ${entityId}` });
        continue;
      }
      if (prev && state.entities[prev]?.topology?.nextEntityId !== entityId) {
        issues.push({ severity: 'warning', code: 'ROUTE_CONTINUITY', routeId, entityId, message: `Route ${routeId} has a continuity gap between ${prev} and ${entityId}` });
      }
      prev = entityId;
    }
  }

  const summary = {
    errors: issues.filter((i) => i.severity === 'error').length,
    warnings: issues.filter((i) => i.severity === 'warning').length,
    totalEntities: Object.keys(state.entities || {}).length,
    totalRoutes: Object.keys(state.routes || {}).length,
    totalNodes: Object.keys(state.nodes || {}).length,
  };

  state.validation = { issues, lastRunAt: new Date().toISOString(), summary };
  return state.validation;
}
