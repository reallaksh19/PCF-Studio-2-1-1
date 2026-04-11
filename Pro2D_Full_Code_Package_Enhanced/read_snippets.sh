echo "=== js/ui/table/TableDataBuilder.js ==="
grep -n -C 5 "attrs.pipingClass" js/ui/table/TableDataBuilder.js
grep -n -C 15 "matRes = materialService.resolveAttributes" js/ui/table/TableDataBuilder.js

echo "=== js/ui/table/TableRegenerator.js ==="
grep -n -C 3 "COMPONENT-ATTRIBUTE4" js/ui/table/TableRegenerator.js

echo "=== js/services/weight-service.js ==="
grep -n -C 5 "rating =" js/services/weight-service.js

echo "=== js/output/pcf-cleaner.js ==="
grep -n -C 5 "_Injected" js/output/pcf-cleaner.js
grep -n -C 5 "UNDEFINED" js/output/pcf-cleaner.js

echo "=== js/viewer/pcf-parser.js ==="
grep -n -C 3 "COMP_TYPES" js/viewer/pcf-parser.js

echo "=== js/converter/ca-builder.js ==="
grep -n -C 3 "COMPONENT-ATTRIBUTE20" js/converter/ca-builder.js
grep -n -C 3 "Density" js/converter/ca-builder.js

echo "=== js/ray-concept/rc-stage1-parser.js ==="
grep -n -C 5 "ca1:" js/ray-concept/rc-stage1-parser.js
grep -n -C 10 "canonType === 'BEND'" js/ray-concept/rc-stage1-parser.js

echo "=== js/ui/table/TableRenderer.js ==="
grep -n -C 5 "i = 26" js/ui/table/TableRenderer.js
grep -n -C 5 "addHeaderGroup" js/ui/table/TableRenderer.js
grep -n -C 5 "console.log(\`\[FillDown\]" js/ui/table/TableRenderer.js
grep -n -C 3 "_columnFilters =" js/ui/table/TableRenderer.js

echo "=== js/ui/pcf-table-controller.js ==="
grep -n -C 5 "REFNO_COL =" js/ui/pcf-table-controller.js

echo "=== index.html ==="
grep -n -C 10 "react-konva" index.html
grep -n -C 10 "importmap" index.html

echo "=== js/coord2pcf/coord2pcf-tab.js ==="
grep -n -C 10 "Smart2Dcanvas_AppShell.tsx" js/coord2pcf/coord2pcf-tab.js

echo "=== js/ray-concept/rc-stage4-emitter.js ==="
grep -n -C 3 "ANGLE 90" js/ray-concept/rc-stage4-emitter.js
grep -n -C 3 "supportsOnBridge" js/ray-concept/rc-stage4-emitter.js

echo "=== js/ray-concept/rc-stage2-extractor.js ==="
grep -n -C 3 "ANGLE 90" js/ray-concept/rc-stage2-extractor.js

echo "=== js/ray-concept/rc-tab.js ==="
grep -n -C 3 "import(" js/ray-concept/rc-tab.js

echo "=== js/viewer/viewer-3d.js ==="
grep -n -C 3 "Debug-Support-Info" js/viewer/viewer-3d.js

