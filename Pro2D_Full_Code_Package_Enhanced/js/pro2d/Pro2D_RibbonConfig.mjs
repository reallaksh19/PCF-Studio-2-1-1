export const Pro2D_ribbonSections = [
  {
    id: 'file',
    title: 'File',
    actions: [
      { id: 'loadMock', label: 'Mock', icon: '🧪' },
      { id: 'pullInput', label: 'Pull Input', icon: '⟳' },
      { id: 'validate', label: 'Validate', icon: '✔' },
      { id: 'benchmark', label: 'Benchmark', icon: '⏱' },
      { id: 'clear', label: 'Clear', icon: '🗑' },
    ],
  },
  {
    id: 'draft',
    title: 'Draft',
    actions: [
      { id: 'tool_select', label: 'Select', icon: '🖱' },
      { id: 'tool_line', label: 'Pipe', icon: '／' },
      { id: 'tool_polyline', label: 'Polyline', icon: '〰' },
      { id: 'tool_spline', label: 'Spline', icon: '∿' },
      { id: 'tool_support', label: 'Support', icon: '✚' },
    ],
  },
  {
    id: 'fittings',
    title: 'CoorCanvas Fittings',
    actions: [
      { id: 'tool_valve', label: 'Valve', icon: '◇' },
      { id: 'tool_flange', label: 'Flange', icon: '▮' },
      { id: 'tool_fvf', label: 'FVF', icon: '▮◇▮' },
      { id: 'tool_reducer', label: 'Reducer', icon: '⬘' },
      { id: 'convertBend', label: 'Convert Bend', icon: '↷' },
      { id: 'convertTee', label: 'Convert Tee', icon: '┬' },
    ],
  },
  {
    id: 'topology',
    title: 'Topology / Repair',
    actions: [
      { id: 'break', label: 'Break', icon: '✂' },
      { id: 'connect', label: 'Connect', icon: '⛓' },
      { id: 'stretch', label: 'Stretch', icon: '↔' },
      { id: 'gapClean', label: 'Gap Clean', icon: '🧹' },
      { id: 'overlapSolver', label: 'Overlap', icon: '🧩' },
    ],
  },
  {
    id: 'interop',
    title: 'DXF / SVG / PCF',
    actions: [
      { id: 'exportSvg', label: 'SVG', icon: '🖼' },
      { id: 'exportDxf', label: 'DXF', icon: '📐' },
      { id: 'routeToPcf', label: 'Route→PCF', icon: '⇢' },
      { id: 'emitCuts', label: 'Emit Cuts', icon: '⚡' },
      { id: 'autoSupports', label: 'Auto Supports', icon: '📍' },
    ],
  },
];
