export function Pro2D_importSimpleDxf(doc) {
  const lines = String(doc || '').split(/\r?\n/);
  const entities = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const parts = line.split(',').map((s) => s.trim());
    if (parts[0] === 'LINE') {
      entities.push({ type: 'PIPE', start: [Number(parts[1]), Number(parts[2])], end: [Number(parts[3]), Number(parts[4])], imported: { layer: parts[5] || '0' } });
    } else if (parts[0] === 'ARC') {
      // Convert simple ARC definitions into bend primitives. Real DXF arcs may
      // specify sweep direction and bulge but for this simple adapter we only
      // preserve centre, radius and start/end angles. Callers are expected
      // to resolve to canonical nodes via higher‑level logic.
      entities.push({ type: 'BEND', center: [Number(parts[1]), Number(parts[2])], radius: Number(parts[3]), startAngle: Number(parts[4]), endAngle: Number(parts[5]), imported: { layer: parts[6] || '0' } });
    } else if (parts[0] === 'TEXT') {
      entities.push({ type: 'UNKNOWN', text: parts.slice(3).join(','), at: [Number(parts[1]), Number(parts[2])] });
    }
  }
  return entities;
}

export function Pro2D_exportSimpleDxf(sceneBundle) {
  const out = [];
  Object.values(sceneBundle.segments || {}).forEach((seg) => {
    const p1 = seg.points[0], p2 = seg.points[seg.points.length - 1];
    out.push(`LINE,${p1.x},${p1.y},${p2.x},${p2.y},${seg.metadata?.imported?.dxf?.layer || '0'}`);
  });
  Object.values(sceneBundle.inlineItems || {}).forEach((item) => {
    out.push(`TEXT,${item.x},${item.y},${item.type.toUpperCase()}`);
  });
  // Export fittings: bends as ARC and tees as TEXT. Compute start and end
  // angles from the node geometry if available; fallback to a zero‑sweep
  // representation when insufficient data is supplied.
  Object.values(sceneBundle.fittings || {}).forEach((fit) => {
    if (fit.type === 'bend') {
      const cx = fit.x;
      const cy = fit.y;
      const r = fit.radius;
      // Determine start and end angles by computing the vector from the
      // centre to the start/end nodes. Without access to the full state we
      // approximate using provided metadata; fall back to 0/angle when
      // undefined.
      let sa = 0;
      let ea = fit.angle_deg ?? 90;
      try {
        const p1 = fit.startPoint || null;
        if (p1) {
          const dx = p1.x - cx;
          const dy = p1.y - cy;
          sa = Math.atan2(dy, dx) * 180 / Math.PI;
          if (sa < 0) sa += 360;
          ea = sa + (fit.angle_deg || 90);
        }
      } catch (e) {
        // ignore
      }
      out.push(`ARC,${cx},${cy},${r},${sa},${ea},${fit.metadata?.imported?.dxf?.layer || '0'}`);
    } else if (fit.type === 'tee') {
      out.push(`TEXT,${fit.x},${fit.y},TEE`);
    }
  });
  return out.join('\n');
}
