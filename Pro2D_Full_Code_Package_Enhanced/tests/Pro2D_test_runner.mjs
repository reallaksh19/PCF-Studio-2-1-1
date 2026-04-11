import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tests = [
  'Pro2D_phase1.pass.test.mjs',
  'Pro2D_phase2.pass.test.mjs',
  'Pro2D_phase3.pass.test.mjs',
  'Pro2D_smoke.test.mjs',
];

const outDir = path.join(__dirname, 'results');
mkdirSync(outDir, { recursive: true });
const summary = [];
for (const test of tests) {
  const res = spawnSync(process.execPath, [path.join(__dirname, test)], { encoding: 'utf8' });
  summary.push({ test, status: res.status, stdout: res.stdout.trim(), stderr: res.stderr.trim() });
}
const bench = spawnSync(process.execPath, [path.join(__dirname, 'Pro2D_benchmark.mjs')], { encoding: 'utf8' });
writeFileSync(path.join(outDir, 'Pro2D_test_summary.json'), JSON.stringify(summary, null, 2));
writeFileSync(path.join(outDir, 'Pro2D_benchmark.json'), bench.stdout || '{}');
console.log(JSON.stringify({ summary, benchmark: JSON.parse(bench.stdout || '{}') }, null, 2));
