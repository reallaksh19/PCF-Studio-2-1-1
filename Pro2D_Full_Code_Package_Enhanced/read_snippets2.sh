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

echo "=== js/ray-concept/rc-stage2-extractor.js ==="
grep -n -C 5 "ANGLE 90" js/ray-concept/rc-stage2-extractor.js

