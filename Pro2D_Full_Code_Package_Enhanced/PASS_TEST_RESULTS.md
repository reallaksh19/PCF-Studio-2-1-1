# Pro2D Phase-wise Pass / Smoke / Benchmark Results

## Executed command
```bash
node tests/Pro2D_test_runner.mjs
```

## Phase 1 pass test
- Status: PASS
- Entities: 17
- Nodes: 25
- Scene segments: 8
- Supports: 6
- Errors: 0
- Warnings: 0

## Phase 2 pass test
- Status: PASS
- Base elements: 15
- Final elements after emit cuts: 17
- Auto supports: 2
- Emit hits: 2

## Phase 3 pass test
- Status: PASS
- SVG output length: 2333 chars
- SVG round-trip recovered line entities: 8
- DXF output lines: 11
- DXF round-trip recovered entities: 11

## Smoke test
- Status: PASS
- Mock entities: 17
- Scene bundle segments: 8
- Imported entities from app-state snapshot: 4

## Benchmark
| Metric | Result |
|---|---:|
| Phase 1 mock load | 2.356 ms |
| Phase 1 validate | 0.489 ms |
| Phase 1 scene bundle | 0.498 ms |
| Phase 2 emit pipeline | 1.245 ms |
| Phase 3 load 10k route entities | 123.281 ms |
| Phase 3 validate 10k route entities | 31.013 ms |

## Totals
- Mock entities: 17
- Mock nodes: 25
- Mock issues: 0
- Large-state entities: 10000
- Large-state nodes: 20000
- Large-state issues: 0
- Final elements in emit benchmark: 17
- Auto supports in emit benchmark: 2

## Key added files
- `js/pro2d/Pro2D_AppShell.tsx`
- `js/pro2d/Pro2D_Canonical.mjs`
- `js/pro2d/Pro2D_ValidationEngine.mjs`
- `js/pro2d/Pro2D_EmitEngine.mjs`
- `js/pro2d/Pro2D_DxfAdapter.mjs`
- `js/pro2d/Pro2D_SvgAdapter.mjs`
- `js/pro2d/Pro2D_Benchmark.mjs`
- `js/pro2d/Pro2D_RibbonConfig.mjs`
- `tests/Pro2D_phase1.pass.test.mjs`
- `tests/Pro2D_phase2.pass.test.mjs`
- `tests/Pro2D_phase3.pass.test.mjs`
- `tests/Pro2D_smoke.test.mjs`

## Integration patches
- `index.html`
- `js/coord2pcf/coord2pcf-tab.js`
- `js/smart2dcanvas/Smart2Dcanvas_SceneStore.ts`
- `js/smart2dcanvas/Smart2Dcanvas_AppShell.tsx`
- `js/smart2dcanvas/Smart2Dcanvas_GeometryTypes.ts`
- `js/smart2dcanvas/Smart2Dcanvas_SnapEngine.ts`
