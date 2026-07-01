import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildInteractiveAnalysis, filterFlights } from '../src/lib/interactiveAnalysis.js';
import { getLocalizedFields, projectFlightRow } from '../src/lib/fieldMetadata.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const module8Dir = path.join(rootDir, 'data', 'module8');
const DEFAULT_YEAR = '2013';
const DEFAULT_EDA_ROWS = 50000;

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function getChunkFiles() {
  if (!fs.existsSync(module8Dir)) return [];
  return fs.readdirSync(module8Dir)
    .filter((name) => /^full_data_chunk_\d+\.json$/.test(name))
    .sort((a, b) => Number(a.match(/\d+/)?.[0] || 0) - Number(b.match(/\d+/)?.[0] || 0))
    .map((name) => path.join(module8Dir, name));
}

function loadYearRows(year) {
  const rows = [];
  for (const chunkFile of getChunkFiles()) {
    const chunkRows = readJson(chunkFile);
    if (!Array.isArray(chunkRows)) continue;
    rows.push(...chunkRows.filter((row) => String(row.year) === year));
  }
  return rows;
}

const started = Date.now();
const filters = {
  years: [DEFAULT_YEAR],
  months: [],
  airlines: [],
  origins: [],
  destinations: [],
  delayLevels: [],
};
const rows = loadYearRows(DEFAULT_YEAR);

if (rows.length === 0) {
  throw new Error(`No ${DEFAULT_YEAR} rows found in data/module8/full_data_chunk_*.json.`);
}

const analysis = {
  ...buildInteractiveAnalysis(rows, filters),
  source: 'static-cache',
};

const edaRows = filterFlights(rows, filters)
  .slice(0, DEFAULT_EDA_ROWS)
  .map(projectFlightRow);

const payload = {
  filters,
  analysis,
  generatedAt: new Date().toISOString(),
};

const edaPayloads = {
  zh: {
    rows: edaRows,
    fields: getLocalizedFields('zh'),
    total: rows.length,
    loaded: edaRows.length,
    limit: DEFAULT_EDA_ROWS,
    sampled: rows.length > edaRows.length,
    requestedFullLoad: false,
    filters,
    source: 'static-cache',
  },
  en: {
    rows: edaRows,
    fields: getLocalizedFields('en'),
    total: rows.length,
    loaded: edaRows.length,
    limit: DEFAULT_EDA_ROWS,
    sampled: rows.length > edaRows.length,
    requestedFullLoad: false,
    filters,
    source: 'static-cache',
  },
};

const outputFiles = [
  [`default_${DEFAULT_YEAR}_analysis.json`, payload],
  [`default_${DEFAULT_YEAR}_eda_zh.json`, edaPayloads.zh],
  [`default_${DEFAULT_YEAR}_eda_en.json`, edaPayloads.en],
];

for (const [fileName, filePayload] of outputFiles) {
  const outputPath = path.join(module8Dir, fileName);
  fs.writeFileSync(outputPath, `${JSON.stringify(filePayload)}\n`);
  console.log(`[static-cache] Wrote ${path.relative(rootDir, outputPath)}.`);
}

console.log(`[static-cache] Cached ${rows.length.toLocaleString()} ${DEFAULT_YEAR} rows in ${Date.now() - started}ms.`);
