# Pro2D implementation package

This package adds a cumulative **Pro 2D Canvas** implementation across three phases.

## Phase 1
- Canonical `Professional2DStateTable`
- Dynamic header registry
- Property panel binding
- Mock/app-state import bridge
- Scene bundle bridge into Smart2D viewport

## Phase 2
- CoorCanvas route/emit/support service layer
- Dedicated Coor2PCF ribbon section
- Auto-support generation from emit hits
- Topology/repair ribbon placeholders

## Phase 3
- SVG export/import with `data-pro2d-*` metadata
- Simple DXF export/import bridge
- Benchmarks and test runner
- Pro2D shell replacing missing Smart2D app shell mount

## Dedicated Pro2D ribbons / panels
- File ribbon
- Draft ribbon
- CoorCanvas fittings ribbon
- Topology / Repair ribbon
- DXF / SVG / PCF ribbon
- Left tool rail
- Right property/validation panel
- Lower Coor2PCF integration panel

## Test commands
```bash
node tests/Pro2D_test_runner.mjs
```

## Outputs
- `tests/results/Pro2D_test_summary.json`
- `tests/results/Pro2D_benchmark.json`
