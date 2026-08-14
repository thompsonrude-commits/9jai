import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const ignoreDirs = new Set(['node_modules', 'dist', 'build', '.git', '.next', '.venv', 'coverage', '.idea']);
const allowedFileNames = new Set(['.env.example', 'secret-scan.mjs', 'README.md']);

const patterns = [
  /gh[pousr]_[A-Za-z0-9_]{10,}/i,
  /github_pat_[A-Za-z0-9_]+/i,
  /AIza[0-9A-Za-z\-_]{20,}/,
  /sk_live_[A-Za-z0-9]+/i,
  /-----BEGIN (RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/i,
  /Bearer\s+[A-Za-z0-9._~+\-/=]{20,}/i,
  /VITE_[A-Z0-9_]*(KEY|TOKEN|PASSWORD)/i,
  /private_key/i,
  /api\.individual\.githubcopilot\.com|githubcopilot/i,
];

const results = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && entry.name !== '.env.example') continue;
    if (ignoreDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile()) {
      const rel = path.relative(root, full).replace(/\\/g, '/');
      if (rel.includes('node_modules') || rel.includes('dist') || rel.includes('build')) continue;
      const text = fs.readFileSync(full, 'utf8');
      let matched = false;
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          matched = true;
          break;
        }
      }
      if (matched && !allowedFileNames.has(path.basename(full))) {
        results.push(rel);
      }
    }
  }
}

walk(root);

if (results.length) {
  console.error('Potential secret patterns found:');
  for (const item of results) console.error(`- ${item}`);
  process.exit(1);
}

console.log('Secret scan passed.');
