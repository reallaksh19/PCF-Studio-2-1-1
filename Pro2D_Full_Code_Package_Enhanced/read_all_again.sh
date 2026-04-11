echo "=== js/converter/ca-builder.js ==="
grep -n -C 5 "console.info" js/converter/ca-builder.js

echo "=== js/ray-concept/rc-stage4-emitter.js ==="
grep -n -C 5 "ANGLE 90" js/ray-concept/rc-stage4-emitter.js
grep -n -C 5 "supportsOnBridge" js/ray-concept/rc-stage4-emitter.js

echo "=== index.html ==="
grep -n -C 5 "importmap" index.html

echo "=== js/coord2pcf/coord2pcf-tab.js ==="
grep -n -C 5 "Smart2Dcanvas_AppShell" js/coord2pcf/coord2pcf-tab.js

echo "=== js/ray-concept/rc-tab.js ==="
grep -n -C 5 "data-manager.js" js/ray-concept/rc-tab.js

echo "=== js/viewer/viewer-3d.js ==="
grep -n -C 5 "console.log" js/viewer/viewer-3d.js

