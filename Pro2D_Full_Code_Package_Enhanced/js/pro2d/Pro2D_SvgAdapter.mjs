export function Pro2D_exportSimpleSvg(state) {
  const parts = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="-1000 -3000 19000 17000">'];
  Object.values(state.entities || {}).forEach((entity) => {
    if (entity.type === 'PIPE') {
      const p1 = entity.geometry.path[0];
      const p2 = entity.geometry.path[entity.geometry.path.length - 1];
      parts.push(`<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="#94a3b8" stroke-width="40" data-pro2d-id="${entity.id}" data-pro2d-type="PIPE" data-pro2d-route="${entity.routeId || ''}" />`);
    }
    if (entity.type === 'SUPPORT') {
      const c = entity.geometry.center;
      parts.push(`<circle cx="${c.x}" cy="${c.y}" r="60" fill="#16a34a" data-pro2d-id="${entity.id}" data-pro2d-type="SUPPORT" />`);
    }
    if (['VALVE','FLANGE','REDUCER'].includes(entity.type)) {
      const c = entity.geometry.center;
      parts.push(`<rect x="${c.x - 80}" y="${c.y - 40}" width="160" height="80" fill="#a16207" data-pro2d-id="${entity.id}" data-pro2d-type="${entity.type}" />`);
    }
    if (entity.type === 'BEND') {
      // Render bends using SVG arc commands. Use the first and last points of
      // the path as start/end and derive radius from engineering data. The
      // sweep flag is set to 1 to draw the smaller arc segment. Data
      // attributes preserve canonical identifiers and type information.
      const p1 = entity.geometry.path[0];
      const p2 = entity.geometry.path[entity.geometry.path.length - 1];
      const r = entity.geometry.radius || entity.engineering.radius || 0;
      parts.push(`<path d="M ${p1.x} ${p1.y} A ${r} ${r} 0 0 1 ${p2.x} ${p2.y}" stroke="#fbbf24" stroke-width="40" fill="none" data-pro2d-id="${entity.id}" data-pro2d-type="BEND" />`);
    }
    if (entity.type === 'TEE') {
      // Represent tees as small circles at their centre. These could be
      // extended into three‑branch symbols in future revisions.
      const c = entity.geometry.center;
      parts.push(`<circle cx="${c.x}" cy="${c.y}" r="60" fill="#a855f7" data-pro2d-id="${entity.id}" data-pro2d-type="TEE" />`);
    }
  });
  parts.push('</svg>');
  return parts.join('');
}

export function Pro2D_importSimpleSvg(svg) {
  const lines = [];
  const lineRegex = /<line[^>]*x1="([^"]+)"[^>]*y1="([^"]+)"[^>]*x2="([^"]+)"[^>]*y2="([^"]+)"[^>]*data-pro2d-id="([^"]+)"[^>]*data-pro2d-type="([^"]+)"[^>]*>/g;
  let m;
  while ((m = lineRegex.exec(svg)) !== null) {
    lines.push({ id: m[5], type: m[6], start: [Number(m[1]), Number(m[2])], end: [Number(m[3]), Number(m[4])] });
  }
  return lines;
}
