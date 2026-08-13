import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const isCI = args.includes('--ci');
const summary = [];

const isWindows = process.platform === 'win32';

function runCommand(command, args) {
  const invoked = `${command} ${args.join(' ')}`;
  console.log(`\n> ${invoked}`);
  const result = spawnSync(command, args, {
    cwd: rootDir,
    stdio: 'inherit',
    shell: false,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(' ')}`);
  }
}

try {
  summary.push('Starting repository validation pipeline');

  runCommand(...(isWindows ? ['cmd.exe', ['/c', 'npm', 'run', 'lint']] : ['npm', ['run', 'lint']]));
  summary.push('lint passed');

  runCommand(...(isWindows ? ['cmd.exe', ['/c', 'npm', 'run', 'build']] : ['npm', ['run', 'build']]));
  summary.push('root production build passed');

  runCommand(...(isWindows ? ['cmd.exe', ['/c', 'npm', 'run', 'test']] : ['npm', ['run', 'test']]));
  summary.push('frontend tests passed');

  runCommand(...(isWindows ? ['cmd.exe', ['/c', 'npm', 'run', 'test:backend']] : ['npm', ['run', 'test:backend']]));
  summary.push('backend tests passed');

  runCommand(...(isWindows ? ['cmd.exe', ['/c', 'npm', '--prefix', 'functions', 'run', 'build']] : ['npm', ['--prefix', 'functions', 'run', 'build']]));
  summary.push('functions build passed');

  runCommand(...(isWindows ? ['cmd.exe', ['/c', 'npm', '--prefix', 'functions', 'run', 'lint']] : ['npm', ['--prefix', 'functions', 'run', 'lint']]));
  summary.push('functions lint passed');

  if (!isCI) {
    console.log('\nValidation summary:');
    summary.forEach((line) => console.log(`- ${line}`));
  }

  console.log('\nValidation completed successfully.');
  process.exit(0);
} catch (error) {
  console.error('\nValidation failed.');
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  if (!isCI) {
    console.log('\nValidation summary:');
    summary.forEach((line) => console.log(`- ${line}`));
  }
  process.exit(1);
}
