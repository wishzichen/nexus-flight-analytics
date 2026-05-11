import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const errors = [];
const warnings = [];

function fail(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

function exists(relativePath) {
  return fs.existsSync(path.join(distDir, relativePath));
}

function readText(relativePath) {
  return fs.readFileSync(path.join(distDir, relativePath), 'utf8');
}

function walkFiles(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolutePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(absolutePath));
    } else {
      files.push(absolutePath);
    }
  }

  return files;
}

if (!fs.existsSync(distDir)) {
  fail('dist/ does not exist. Run `npm run build` first.');
} else {
  if (!exists('index.html')) {
    fail('dist/index.html is missing.');
  } else {
    const indexHtml = readText('index.html');
    if (indexHtml.includes('/src/main.tsx')) {
      fail('dist/index.html still points at /src/main.tsx, which means the Vite build output was not used.');
    }
    if (!indexHtml.includes('./assets/')) {
      fail('dist/index.html should use relative ./assets/ URLs for GitHub Pages.');
    }
  }

  if (!exists('.nojekyll')) {
    fail('dist/.nojekyll is missing. GitHub Pages may process static files with Jekyll.');
  }

  const requiredDataFiles = [
    'data/module1/dashboard.json',
    'data/module8/full_first_page.json',
    'data/module8/full_summary.json',
  ];

  for (const relativePath of requiredDataFiles) {
    if (!exists(relativePath)) {
      fail(`Required static data file is missing: dist/${relativePath}`);
    }
  }

  const module8Dir = path.join(distDir, 'data', 'module8');
  const chunkFiles = fs.existsSync(module8Dir)
    ? fs.readdirSync(module8Dir).filter((name) => /^full_data_chunk_\d+\.json$/.test(name))
    : [];

  if (chunkFiles.length === 0) {
    warn('No module8 full_data_chunk_*.json files found. Full data export/search may be limited.');
  }

  const allFiles = walkFiles(distDir);
  const totalBytes = allFiles.reduce((sum, file) => sum + fs.statSync(file).size, 0);
  const totalMb = totalBytes / 1024 / 1024;
  const rdsFiles = allFiles.filter((file) => file.toLowerCase().endsWith('.rds'));

  if (rdsFiles.length > 0) {
    fail(`RDS files should not be published to Pages: ${rdsFiles.map((file) => path.relative(rootDir, file)).join(', ')}`);
  }

  if (totalMb > 900) {
    warn(`dist/ is ${totalMb.toFixed(1)} MB, close to GitHub Pages' practical 1 GB site size limit.`);
  }

  console.log(`[pages-check] dist/ files: ${allFiles.length}`);
  console.log(`[pages-check] dist/ size: ${totalMb.toFixed(1)} MB`);
  console.log(`[pages-check] module8 chunks: ${chunkFiles.length}`);
}

for (const message of warnings) {
  console.warn(`[pages-check] warning: ${message}`);
}

if (errors.length > 0) {
  for (const message of errors) {
    console.error(`[pages-check] error: ${message}`);
  }
  process.exit(1);
}

console.log('[pages-check] GitHub Pages artifact looks ready.');
