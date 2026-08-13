import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const testRoots = [path.join(rootDir, 'core'), path.join(rootDir, '9ja-ai')];
const testFiles = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }

    if (entry.isFile() && /\.test\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      const relativePath = path.relative(rootDir, fullPath).replaceAll(path.sep, '/');
      const content = fs.readFileSync(fullPath, 'utf8');
      const runner = /from\s+['"]vitest['"]/.test(content) ? 'vitest' : 'node';
      testFiles.push({ relativePath, runner });
    }
  }
}

for (const testRoot of testRoots) {
  if (fs.existsSync(testRoot)) {
    walk(testRoot);
  }
}

if (testFiles.length === 0) {
  console.error('No test files found.');
  process.exit(1);
}

const vitestFiles = testFiles.filter((entry) => entry.runner === 'vitest').map((entry) => entry.relativePath);
const nodeFiles = testFiles.filter((entry) => entry.runner === 'node').map((entry) => entry.relativePath);
const runGroup = (files, runner) => {
  if (files.length === 0) {
    return;
  }

  if (runner === 'vitest') {
    execFileSync(process.execPath, [path.join(rootDir, 'node_modules', 'vitest', 'vitest.mjs'), 'run', ...files], {
      cwd: rootDir,
      stdio: 'inherit',
    });
    return;
  }

  execFileSync(process.execPath, ['--import', 'tsx/esm', '--test', ...files], {
    cwd: rootDir,
    stdio: 'inherit',
  });
};

let hasFailed = false;

for (const group of [
  { files: nodeFiles, runner: 'node' },
  { files: vitestFiles, runner: 'vitest' },
]) {
  try {
    runGroup(group.files, group.runner);
  } catch {
    hasFailed = true;
    break;
  }
}

if (hasFailed) {
  process.exit(1);
}
