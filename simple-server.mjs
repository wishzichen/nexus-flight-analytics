import express from 'express';
import path, { dirname } from 'path';
import fs from 'fs';
import zlib from 'zlib';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import {
  buildInteractiveAnalysis,
  filterFlights,
  parseInteractiveFilters,
} from './src/lib/interactiveAnalysis.js';
import {
  FIELD_DEFINITIONS,
  getLocalizedFields,
  projectFlightRow,
} from './src/lib/fieldMetadata.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'flights.sqlite');
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const DEFAULT_YEAR = '2013';
const DEFAULT_EDA_ROWS = 50000;
const MAX_EDA_ROWS = 400000;
const ASSISTANT_SAMPLE_ROWS = 4;
const DEFAULT_ASSISTANT_MODEL = 'gpt-5.5';
const DEFAULT_ASSISTANT_FALLBACK_MODELS = [
  'gpt-5.4-mini',
  'gpt-5.2-chat-latest',
  'gpt-5.1',
  'claude-haiku-4-5',
  'grok-4.20-fast',
];
const ASSISTANT_MODEL_PATTERN = /^[A-Za-z0-9._:/+-]{1,120}$/;

const FLIGHT_COLUMNS = [
  'year',
  'month',
  'day',
  'hour',
  'weekday',
  'weekdayName',
  'airlineCode',
  'airlineName',
  'flightNumber',
  'aircraftId',
  'departureAirport',
  'departureAirportName',
  'arrivalAirport',
  'arrivalAirportName',
  'route',
  'departureDelay',
  'arrivalDelay',
  'flightTime',
  'flightDistance',
  'flightSpeed',
  'delayLevel',
];

const DB_SELECT_COLUMNS = [
  ...FLIGHT_COLUMNS,
  "printf('%04d-%02d-%02d', year, month, day) AS date",
  `CASE
    WHEN hour BETWEEN 5 AND 8 THEN 'morning_peak'
    WHEN hour BETWEEN 9 AND 15 THEN 'daytime'
    WHEN hour BETWEEN 16 AND 20 THEN 'evening_peak'
    ELSE 'night'
  END AS time_period`,
  `CASE
    WHEN flightDistance < 500 THEN 'short'
    WHEN flightDistance < 1500 THEN 'medium'
    ELSE 'long'
  END AS distance_group`,
];

const MODULE_ENDPOINTS = [
  ['/api/module1/summary', 'module1/dashboard.json', 'summary'],
  ['/api/module1/hourly-trend', 'module1/dashboard.json', 'hourlyTrend'],
  ['/api/module1/top-destinations', 'module1/dashboard.json', 'topDestinations'],
  ['/api/module1/delayed-destinations', 'module1/dashboard.json', 'delayedDestinations'],
  ['/api/module1/delayed-airlines', 'module1/dashboard.json', 'delayedAirlines'],
  ['/api/module1/heatmap', 'module1/dashboard.json', 'heatmap'],
  ['/api/module1/ontime-pie', 'module1/dashboard.json', 'ontimePie'],
  ['/api/module1/monthly-stats', 'module1/dashboard.json', 'monthlyStats'],
  ['/api/module1/origin-stats', 'module1/dashboard.json', 'originStats'],

  ['/api/module2/hourly-dep-delay', 'module2/time_analysis.json', 'hourlyDepDelay'],
  ['/api/module2/hourly-arr-delay', 'module2/time_analysis.json', 'hourlyArrDelay'],
  ['/api/module2/hourly-comparison', 'module2/time_analysis.json', 'hourlyComparison'],
  ['/api/module2/monthly-trend', 'module2/time_analysis.json', 'monthlyTrend'],
  ['/api/module2/weekday-analysis', 'module2/time_analysis.json', 'weekdayAnalysis'],
  ['/api/module2/weekday-hour-heatmap', 'module2/time_analysis.json', 'weekdayHourHeatmap'],
  ['/api/module2/period-analysis', 'module2/time_analysis.json', 'periodAnalysis'],
  ['/api/module2/conclusions', 'module2/time_analysis.json', 'conclusions'],

  ['/api/module3/top-destinations-volume', 'module3/route_analysis.json', 'topDestinationsVolume'],
  ['/api/module3/top-destinations-delay', 'module3/route_analysis.json', 'topDestinationsDelay'],
  ['/api/module3/route-analysis', 'module3/route_analysis.json', 'routeAnalysis'],
  ['/api/module3/bubble-data', 'module3/route_analysis.json', 'bubbleData'],
  ['/api/module3/origin-dest-heatmap', 'module3/route_analysis.json', 'originDestHeatmap'],
  ['/api/module3/jfk-risky-routes', 'module3/route_analysis.json', 'jfkRiskyRoutes'],
  ['/api/module3/ewr-risky-routes', 'module3/route_analysis.json', 'ewrRiskyRoutes'],
  ['/api/module3/lga-risky-routes', 'module3/route_analysis.json', 'lgaRiskyRoutes'],
  ['/api/module3/distance-distribution', 'module3/route_analysis.json', 'distanceDistribution'],
  ['/api/module3/dest-geo', 'module3/route_analysis.json', 'destGeo'],
  ['/api/module3/origin-geo', 'module3/route_analysis.json', 'originGeo'],

  ['/api/module4/recovery-stats', 'module4/recovery_analysis.json', 'recoveryStats'],
  ['/api/module4/speed-scatter', 'module4/recovery_analysis.json', 'speedScatter'],
  ['/api/module4/recovery-scatter', 'module4/recovery_analysis.json', 'recoveryScatter'],
  ['/api/module4/airline-recovery', 'module4/recovery_analysis.json', 'airlineRecovery'],
  ['/api/module4/airline-boxplot', 'module4/recovery_analysis.json', 'airlineBoxplotStats'],
  ['/api/module4/dest-recovery', 'module4/recovery_analysis.json', 'destRecovery'],
  ['/api/module4/distance-recovery', 'module4/recovery_analysis.json', 'distanceRecovery'],
  ['/api/module4/speed-recovery-trend', 'module4/recovery_analysis.json', 'speedRecoveryTrend'],
  ['/api/module4/recovery-distribution', 'module4/recovery_analysis.json', 'recoveryDistribution'],

  ['/api/module5/airline-stats', 'module5/airline_analysis.json', 'airlineStats'],
  ['/api/module5/fleet-scatter', 'module5/airline_analysis.json', 'fleetDelayScatter'],
  ['/api/module5/ontime-bubble', 'module5/airline_analysis.json', 'ontimeBubble'],
  ['/api/module5/delay-ranking', 'module5/airline_analysis.json', 'airlineDelayRanking'],
  ['/api/module5/ontime-ranking', 'module5/airline_analysis.json', 'airlineOntimeRanking'],
  ['/api/module5/quadrant-data', 'module5/airline_analysis.json', 'quadrantData'],
  ['/api/module5/quadrant-summary', 'module5/airline_analysis.json', 'quadrantSummary'],
  ['/api/module5/airline-monthly', 'module5/airline_analysis.json', 'airlineMonthly'],
  ['/api/module5/airline-comparison', 'module5/airline_analysis.json', 'airlineComparison'],

  ['/api/module6/propagation-stats', 'module6/propagation_analysis.json', 'propagationStats'],
  ['/api/module6/sequence-delay', 'module6/propagation_analysis.json', 'sequenceDelay'],
  ['/api/module6/propagation-scatter', 'module6/propagation_analysis.json', 'propagationScatter'],
  ['/api/module6/sankey-nodes', 'module6/propagation_analysis.json', 'sankeyNodes'],
  ['/api/module6/sankey-links', 'module6/propagation_analysis.json', 'sankeyLinks'],
  ['/api/module6/case-example', 'module6/propagation_analysis.json', 'caseExample'],
  ['/api/module6/sequence-propagation', 'module6/propagation_analysis.json', 'sequencePropagation'],

  ['/api/module7/age-analysis', 'module7/attribution_analysis.json', 'ageAnalysis'],
  ['/api/module7/weather-analysis', 'module7/attribution_analysis.json', 'weatherAnalysis'],
  ['/api/module7/correlation-matrix', 'module7/attribution_analysis.json', 'correlationMatrix'],
  ['/api/module7/interaction-analysis', 'module7/attribution_analysis.json', 'interactionAnalysis'],
  ['/api/module7/feature-importance', 'module7/attribution_analysis.json', 'featureImportance'],
  ['/api/module7/weather-boxplot', 'module7/attribution_analysis.json', 'weatherBoxplotStats'],
  ['/api/module7/radar-data', 'module7/attribution_analysis.json', 'radarData'],
  ['/api/module7/conclusions', 'module7/attribution_analysis.json', 'conclusions'],
];

console.log('Starting Nexus Flight Analytics server...');
console.log('Workspace:', __dirname);
console.log('Data directory:', DATA_DIR);
console.log('Mode:', IS_PRODUCTION ? 'production' : 'development');

function readJsonFile(filePath) {
  try {
    const fullPath = path.join(DATA_DIR, filePath);
    if (!fs.existsSync(fullPath)) return null;
    return JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return null;
  }
}

function safeJsonResponse(res, data) {
  if (data === null || data === undefined) {
    return res.status(404).json({ error: 'Data not found. Run the R analysis scripts first.' });
  }
  return res.json(data);
}

function getByKey(data, key) {
  if (!key) return data;
  return data && typeof data === 'object' ? data[key] : undefined;
}

function clampLimit(rawLimit, fallback = DEFAULT_EDA_ROWS) {
  const parsed = Number.parseInt(rawLimit || '', 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, MAX_EDA_ROWS);
}

function clampPageSize(rawSize, fallback = 20) {
  const parsed = Number.parseInt(rawSize || '', 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, 1000);
}

function hasAnyInteractiveFilter(filters = {}) {
  return ['years', 'months', 'airlines', 'origins', 'destinations', 'delayLevels']
    .some((key) => Array.isArray(filters[key]) && filters[key].length > 0);
}

function hasOnlyDefaultYear(filters = {}) {
  const years = filters.years || [];
  return years.length === 1
    && String(years[0]) === DEFAULT_YEAR
    && ['months', 'airlines', 'origins', 'destinations', 'delayLevels']
      .every((key) => !Array.isArray(filters[key]) || filters[key].length === 0);
}

function normalizeDefaultFilters(filters = {}) {
  if (hasAnyInteractiveFilter(filters)) return filters;
  return { ...filters, years: [DEFAULT_YEAR] };
}

function resolveEdaRequest(rawLimit, filters = {}) {
  const wantsFullLoad = String(rawLimit || '').toLowerCase() === 'all';
  const normalizedFilters = { ...filters };

  if (wantsFullLoad && !hasAnyInteractiveFilter(normalizedFilters)) {
    normalizedFilters.years = [DEFAULT_YEAR];
  }

  return {
    filters: normalizedFilters,
    limit: wantsFullLoad ? MAX_EDA_ROWS : clampLimit(rawLimit),
    requestedFullLoad: wantsFullLoad,
  };
}

function roundNumber(value, digits = 1) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return 0;
  const factor = 10 ** digits;
  return Math.round(numberValue * factor) / factor;
}

function getModule8ChunkFiles() {
  const module8Dir = path.join(DATA_DIR, 'module8');
  if (!fs.existsSync(module8Dir)) return [];
  return fs.readdirSync(module8Dir)
    .filter((name) => /^full_data_chunk_\d+\.json$/.test(name))
    .sort((a, b) => Number(a.match(/\d+/)?.[0] || 0) - Number(b.match(/\d+/)?.[0] || 0));
}

function readModule8Option(fileName, legacyKey) {
  return readJsonFile(`module8/${fileName}`)
    || readJsonFile('module8/explorer_metadata.json')?.[legacyKey]
    || readJsonFile('module8/explorer_data.json')?.[legacyKey];
}

const module8Cache = {
  data: null,
  lastLoad: 0,
};

async function loadFullDataset() {
  const now = Date.now();
  if (module8Cache.data && now - module8Cache.lastLoad < 60000) return module8Cache.data;

  const allFlights = [];
  for (const chunkFile of getModule8ChunkFiles()) {
    const chunkData = readJsonFile(`module8/${chunkFile}`);
    if (Array.isArray(chunkData)) allFlights.push(...chunkData);
  }

  module8Cache.data = allFlights;
  module8Cache.lastLoad = now;
  console.log(`[Module8] Loaded ${allFlights.length.toLocaleString()} flight rows from JSON chunks.`);
  return allFlights;
}

let flightDb = null;

function hasFlightDatabase() {
  return fs.existsSync(DB_PATH);
}

function getFlightDb() {
  if (!hasFlightDatabase()) return null;
  if (!flightDb) {
    flightDb = new Database(DB_PATH, { readonly: true, fileMustExist: true });
    flightDb.pragma('query_only = ON');
    console.log(`[DB] Using readonly flight database: ${DB_PATH}`);
  }
  return flightDb;
}

function buildDbWhere(filters = {}) {
  const clauses = [];
  const params = {};

  const addInFilter = (column, key, values) => {
    if (!Array.isArray(values) || values.length === 0) return;
    if (values.includes('__none__')) {
      clauses.push('1 = 0');
      return;
    }
    const placeholders = values.map((value, index) => {
      const paramName = `${key}${index}`;
      params[paramName] = String(value);
      return `@${paramName}`;
    });
    clauses.push(`CAST(${column} AS TEXT) IN (${placeholders.join(', ')})`);
  };

  addInFilter('year', 'year', filters.years);
  addInFilter('month', 'month', filters.months);
  addInFilter('airlineCode', 'airline', filters.airlines);
  addInFilter('departureAirport', 'origin', filters.origins);
  addInFilter('arrivalAirport', 'destination', filters.destinations);
  addInFilter('delayLevel', 'delayLevel', filters.delayLevels);

  return {
    where: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '',
    params,
  };
}

function queryFlightsFromDatabase(filters = {}, options = {}) {
  const db = getFlightDb();
  if (!db) return null;

  const { where, params } = buildDbWhere(filters);
  const limit = options.limit ? clampLimit(options.limit) : null;
  const offset = Number.parseInt(options.offset || 0, 10) || 0;
  const orderBy = 'ORDER BY year, month, day, hour, airlineCode, flightNumber';
  const selectColumns = DB_SELECT_COLUMNS.join(',\n      ');
  const count = db.prepare(`SELECT COUNT(*) AS total FROM flights ${where}`).get(params).total;
  const rows = db.prepare(`
    SELECT
      ${selectColumns}
    FROM flights
    ${where}
    ${orderBy}
    ${limit ? 'LIMIT @limit' : ''}
    ${limit && offset ? 'OFFSET @offset' : ''}
  `).all(limit ? { ...params, limit, offset } : params);

  return { rows, total: count };
}

function loadFlightsFromDatabase(filters = {}) {
  return queryFlightsFromDatabase(filters)?.rows || null;
}

function getDefault2013Filters() {
  return {
    years: [DEFAULT_YEAR],
    months: [],
    airlines: [],
    origins: [],
    destinations: [],
    delayLevels: [],
  };
}

function buildModule8Where(query = {}) {
  const clauses = [];
  const params = {};

  const addExact = (column, key) => {
    const value = String(query[key] || '').trim();
    if (!value) return;
    clauses.push(`${column} = @${key}`);
    params[key] = value;
  };

  addExact('airlineCode', 'airline');
  addExact('arrivalAirport', 'destination');
  addExact('departureAirport', 'origin');
  addExact('delayLevel', 'delayLevel');

  const q = String(query.q || '').trim().toLowerCase();
  if (q) {
    params.q = `%${q}%`;
    clauses.push(`(
      LOWER(COALESCE(flightNumber, '')) LIKE @q OR
      LOWER(COALESCE(airlineCode, '')) LIKE @q OR
      LOWER(COALESCE(airlineName, '')) LIKE @q OR
      LOWER(COALESCE(route, '')) LIKE @q OR
      LOWER(COALESCE(departureAirport, '')) LIKE @q OR
      LOWER(COALESCE(arrivalAirport, '')) LIKE @q
    )`);
  }

  return {
    where: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '',
    params,
  };
}

function queryModule8RowsFromDatabase(query = {}, options = {}) {
  const db = getFlightDb();
  if (!db) return null;

  const { where, params } = buildModule8Where(query);
  const page = Math.max(Number.parseInt(options.page || 1, 10) || 1, 1);
  const pageSize = clampPageSize(options.pageSize || 20);
  const limit = options.limit === null ? null : clampLimit(options.limit || pageSize, pageSize);
  const offset = options.offset ?? ((page - 1) * pageSize);
  const selectColumns = DB_SELECT_COLUMNS.join(',\n      ');
  const total = db.prepare(`SELECT COUNT(*) AS total FROM flights ${where}`).get(params).total;
  const rows = db.prepare(`
    SELECT
      ${selectColumns}
    FROM flights
    ${where}
    ORDER BY year, month, day, hour, airlineCode, flightNumber
    ${limit ? 'LIMIT @limit OFFSET @offset' : ''}
  `).all(limit ? { ...params, limit, offset } : params);

  return {
    data: rows,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

function buildDatabaseInteractiveAnalysis(filters = {}) {
  const db = getFlightDb();
  if (!db) return null;

  const { where, params } = buildDbWhere(filters);
  const summaryRow = db.prepare(`
    SELECT
      COUNT(*) AS totalFlights,
      AVG(departureDelay) AS avgDepDelay,
      AVG(arrivalDelay) AS avgArrDelay,
      SUM(CASE WHEN departureDelay <= 15 THEN 1 ELSE 0 END) AS depOnTime,
      SUM(CASE WHEN arrivalDelay <= 15 THEN 1 ELSE 0 END) AS arrOnTime,
      SUM(CASE WHEN departureDelay > 60 THEN 1 ELSE 0 END) AS severeDelay,
      COUNT(DISTINCT airlineCode) AS uniqueAirlines,
      COUNT(DISTINCT route) AS uniqueRoutes,
      COUNT(DISTINCT aircraftId) AS uniqueAircraft
    FROM flights
    ${where}
  `).get(params);

  const totalFlights = summaryRow.totalFlights || 0;
  const summary = {
    totalFlights,
    avgDepDelay: roundNumber(summaryRow.avgDepDelay, 1),
    avgArrDelay: roundNumber(summaryRow.avgArrDelay, 1),
    depOnTimeRate: totalFlights ? roundNumber((summaryRow.depOnTime / totalFlights) * 100, 1) : 0,
    arrOnTimeRate: totalFlights ? roundNumber((summaryRow.arrOnTime / totalFlights) * 100, 1) : 0,
    severeDelayRate: totalFlights ? roundNumber((summaryRow.severeDelay / totalFlights) * 100, 1) : 0,
    uniqueAirlines: summaryRow.uniqueAirlines || 0,
    uniqueRoutes: summaryRow.uniqueRoutes || 0,
    uniqueAircraft: summaryRow.uniqueAircraft || 0,
  };

  const hourlyComparison = db.prepare(`
    SELECT
      hour,
      COUNT(*) AS flightCount,
      AVG(departureDelay) AS avgDepDelay,
      AVG(arrivalDelay) AS avgArrDelay,
      SUM(CASE WHEN departureDelay > 60 THEN 1 ELSE 0 END) AS severeDelay
    FROM flights
    ${where}
    GROUP BY hour
    HAVING hour IS NOT NULL
    ORDER BY hour
  `).all(params).map((row) => ({
    hour: Number(row.hour),
    flightCount: row.flightCount,
    avgDepDelay: roundNumber(row.avgDepDelay, 1),
    avgArrDelay: roundNumber(row.avgArrDelay, 1),
    severeDelayRate: row.flightCount ? roundNumber((row.severeDelay / row.flightCount) * 100, 1) : 0,
  }));

  const weekdayHourHeatmap = db.prepare(`
    SELECT
      weekday,
      hour,
      COUNT(*) AS flightCount,
      AVG(departureDelay) AS avgDelay,
      SUM(CASE WHEN departureDelay > 60 THEN 1 ELSE 0 END) AS severeDelay
    FROM flights
    ${where}
    GROUP BY weekday, hour
    HAVING weekday IS NOT NULL AND hour IS NOT NULL
    ORDER BY weekday, hour
  `).all(params).map((row) => ({
    weekday: Number(row.weekday),
    hour: Number(row.hour),
    avgDelay: roundNumber(row.avgDelay, 1),
    flightCount: row.flightCount,
    severeDelayRate: row.flightCount ? roundNumber((row.severeDelay / row.flightCount) * 100, 1) : 0,
    weekdayName: ['鍛ㄤ竴', '鍛ㄤ簩', '鍛ㄤ笁', '鍛ㄥ洓', '鍛ㄤ簲', '鍛ㄥ叚', '鍛ㄦ棩'][Number(row.weekday) - 1] || '',
  }));

  const topDestinations = db.prepare(`
    SELECT
      arrivalAirport AS dest,
      COALESCE(NULLIF(arrivalAirportName, ''), arrivalAirport) AS dest_name,
      COUNT(*) AS flightCount,
      AVG(arrivalDelay) AS avgArrDelay,
      AVG(departureDelay) AS avgDepDelay,
      AVG(flightDistance) AS avgDistance,
      SUM(CASE WHEN departureDelay <= 15 THEN 1 ELSE 0 END) AS depOnTime
    FROM flights
    ${where}
    GROUP BY arrivalAirport, arrivalAirportName
    ORDER BY flightCount DESC
  `).all(params).map((row) => ({
    dest: row.dest,
    dest_name: row.dest_name,
    flightCount: row.flightCount,
    avgArrDelay: roundNumber(row.avgArrDelay, 1),
    avgDepDelay: roundNumber(row.avgDepDelay, 1),
    avgDistance: roundNumber(row.avgDistance, 0),
    onTimeRate: row.flightCount ? roundNumber((row.depOnTime / row.flightCount) * 100, 1) : 0,
  }));

  const routeAnalysis = db.prepare(`
    SELECT
      route,
      departureAirport AS origin,
      arrivalAirport AS dest,
      COUNT(*) AS flightCount,
      AVG(departureDelay) AS avgDepDelay,
      AVG(arrivalDelay) AS avgArrDelay,
      AVG(flightDistance) AS avgDistance
    FROM flights
    ${where}
    GROUP BY route, departureAirport, arrivalAirport
    ORDER BY flightCount DESC
  `).all(params).map((row) => ({
    route: row.route,
    origin: row.origin,
    dest: row.dest,
    flightCount: row.flightCount,
    avgDepDelay: roundNumber(row.avgDepDelay, 1),
    avgArrDelay: roundNumber(row.avgArrDelay, 1),
    avgDistance: roundNumber(row.avgDistance, 0),
  }));

  const airlineStats = db.prepare(`
    SELECT
      airlineCode AS carrier,
      COALESCE(NULLIF(airlineName, ''), airlineCode) AS carrier_name,
      COUNT(*) AS flightCount,
      COUNT(DISTINCT aircraftId) AS planeCount,
      COUNT(DISTINCT route) AS routeCount,
      AVG(departureDelay) AS avgDepDelay,
      AVG(arrivalDelay) AS avgArrDelay,
      SUM(CASE WHEN departureDelay > 60 THEN 1 ELSE 0 END) AS severeDelay,
      SUM(CASE WHEN departureDelay <= 15 THEN 1 ELSE 0 END) AS depOnTime
    FROM flights
    ${where}
    GROUP BY airlineCode, airlineName
    ORDER BY flightCount DESC
  `).all(params).map((row) => ({
    carrier: row.carrier,
    carrier_name: row.carrier_name,
    flightCount: row.flightCount,
    planeCount: row.planeCount,
    routeCount: row.routeCount,
    avgDepDelay: roundNumber(row.avgDepDelay, 1),
    avgArrDelay: roundNumber(row.avgArrDelay, 1),
    severeDelayRate: row.flightCount ? roundNumber((row.severeDelay / row.flightCount) * 100, 1) : 0,
    onTimeRate: row.flightCount ? roundNumber((row.depOnTime / row.flightCount) * 100, 1) : 0,
  }));

  const topDestinationsDelay = [...topDestinations]
    .filter((item) => item.flightCount >= 20)
    .sort((a, b) => b.avgArrDelay - a.avgArrDelay);

  return {
    filtered: true,
    filters,
    recordCount: totalFlights,
    summary,
    hourlyTrend: hourlyComparison,
    hourlyComparison,
    heatmap: weekdayHourHeatmap,
    weekdayHourHeatmap,
    topDestinations,
    topDestinationsVolume: topDestinations.slice(0, 10),
    topDestinationsDelay: topDestinationsDelay.slice(0, 10),
    bubbleData: topDestinations,
    routeAnalysis,
    airlineStats,
    fleetScatter: airlineStats,
    ontimeBubble: airlineStats,
    delayRanking: [...airlineStats].sort((a, b) => b.avgDepDelay - a.avgDepDelay),
    ontimeRanking: [...airlineStats].sort((a, b) => b.onTimeRate - a.onTimeRate),
  };
}

const default2013Cache = {
  promise: null,
  rows: null,
  projectedRows: null,
  analysis: null,
  edaJsonByLanguage: new Map(),
  edaGzipByLanguage: new Map(),
  total: 0,
  loadedAt: 0,
};

function buildDefaultEdaPayload(language, limit, requestedFullLoad, filters) {
  const cacheKey = `${language}:${requestedFullLoad ? 'all' : limit}`;
  if (!default2013Cache.edaJsonByLanguage.has(cacheKey)) {
    const payload = JSON.stringify({
      rows: default2013Cache.projectedRows,
      fields: getLocalizedFields(language),
      total: default2013Cache.total,
      loaded: default2013Cache.projectedRows.length,
      limit,
      sampled: false,
      requestedFullLoad,
      filters,
      source: 'sqlite-cache',
    });
    default2013Cache.edaJsonByLanguage.set(cacheKey, payload);
    default2013Cache.edaGzipByLanguage.set(cacheKey, zlib.gzipSync(Buffer.from(payload)));
  }

  return {
    json: default2013Cache.edaJsonByLanguage.get(cacheKey),
    gzip: default2013Cache.edaGzipByLanguage.get(cacheKey),
  };
}

async function warmDefault2013Cache() {
  if (default2013Cache.rows && default2013Cache.projectedRows && default2013Cache.analysis) {
    return default2013Cache;
  }
  if (default2013Cache.promise) return default2013Cache.promise;

  default2013Cache.promise = Promise.resolve().then(() => {
    const started = Date.now();
    const filters = getDefault2013Filters();
    const dbQuery = queryFlightsFromDatabase(filters);
    if (!dbQuery) return default2013Cache;

    default2013Cache.rows = dbQuery.rows;
    default2013Cache.projectedRows = dbQuery.rows.map(projectFlightRow);
    default2013Cache.analysis = {
      ...buildDatabaseInteractiveAnalysis(filters),
      source: 'sqlite-cache',
    };
    default2013Cache.total = dbQuery.total;
    default2013Cache.loadedAt = Date.now();
    console.log(`[Cache] Warmed ${DEFAULT_YEAR} default dataset: ${dbQuery.total.toLocaleString()} rows in ${Date.now() - started}ms.`);
    return default2013Cache;
  }).finally(() => {
    default2013Cache.promise = null;
  });

  return default2013Cache.promise;
}

function getDatabaseOptionRows() {
  const db = getFlightDb();
  if (!db) return null;

  return {
    years: db.prepare('SELECT year, CAST(year AS TEXT) AS label, COUNT(*) AS count FROM flights GROUP BY year ORDER BY year').all(),
    months: db.prepare("SELECT month, CAST(month AS TEXT) || '月' AS monthName, COUNT(*) AS count FROM flights GROUP BY month ORDER BY month").all(),
    airlines: db.prepare('SELECT airlineCode, COALESCE(NULLIF(airlineName, \'\'), airlineCode) AS airlineName, COUNT(*) AS count FROM flights GROUP BY airlineCode, airlineName ORDER BY count DESC').all(),
    origins: db.prepare('SELECT departureAirport, COALESCE(NULLIF(departureAirportName, \'\'), departureAirport) AS departureAirportName, COUNT(*) AS count FROM flights GROUP BY departureAirport, departureAirportName ORDER BY count DESC').all(),
    destinations: db.prepare('SELECT arrivalAirport, COALESCE(NULLIF(arrivalAirportName, \'\'), arrivalAirport) AS arrivalAirportName, COUNT(*) AS count FROM flights GROUP BY arrivalAirport, arrivalAirportName ORDER BY count DESC').all(),
    delayLevels: db.prepare('SELECT delayLevel, COUNT(*) AS count FROM flights GROUP BY delayLevel ORDER BY count DESC').all(),
  };
}

function filterModule8Rows(rows, query) {
  const q = (query.q || '').toLowerCase().trim();
  const airline = query.airline || '';
  const destination = query.destination || '';
  const delayLevel = query.delayLevel || '';

  return rows.filter((flight) => {
    if (airline && flight.airlineCode !== airline) return false;
    if (destination && flight.arrivalAirport !== destination) return false;
    if (delayLevel && flight.delayLevel !== delayLevel) return false;
    if (!q) return true;

    return [
      flight.flightNumber,
      flight.airlineCode,
      flight.airlineName,
      flight.route,
      flight.departureAirport,
      flight.arrivalAirport,
    ].some((value) => String(value ?? '').toLowerCase().includes(q));
  });
}

function buildCsv(rows, language = 'zh') {
  const fields = getLocalizedFields(language);
  const header = fields.map((field) => csvEscape(field.label)).join(',');
  const body = rows.map((row) => fields.map((field) => csvEscape(row[field.fid])).join(','));
  return [header, ...body].join('\n');
}

function csvEscape(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function compactAnalysis(analysis) {
  return {
    filters: analysis.filters,
    recordCount: analysis.recordCount,
    summary: analysis.summary,
    hourlyTrend: analysis.hourlyTrend?.slice(0, 24),
    topDestinationsVolume: analysis.topDestinationsVolume?.slice(0, 10),
    topDestinationsDelay: analysis.topDestinationsDelay?.slice(0, 10),
    delayRanking: analysis.delayRanking?.slice(0, 10),
    ontimeRanking: analysis.ontimeRanking?.slice(0, 10),
    routeAnalysis: analysis.routeAnalysis?.slice(0, 10),
  };
}

async function buildAssistantContext(filters, language) {
  const normalizedFilters = normalizeDefaultFilters(filters);
  const dbQuery = queryFlightsFromDatabase(normalizedFilters, { limit: ASSISTANT_SAMPLE_ROWS });
  if (dbQuery) {
    const cached = hasOnlyDefaultYear(normalizedFilters) ? await warmDefault2013Cache() : null;
    const analysis = cached?.analysis || buildDatabaseInteractiveAnalysis(normalizedFilters);
    return {
      source: 'sqlite',
      totalRows: dbQuery.total,
      fields: getLocalizedFields(language),
      analysis: compactAnalysis(analysis),
      samples: dbQuery.rows.map(projectFlightRow),
    };
  }

  const allRows = await loadFullDataset();
  const filtered = filterFlights(allRows, normalizedFilters);
  const analysis = buildInteractiveAnalysis(filtered, {});
  return {
    source: 'json',
    totalRows: filtered.length,
    fields: getLocalizedFields(language),
    analysis: compactAnalysis(analysis),
    samples: filtered.slice(0, ASSISTANT_SAMPLE_ROWS).map(projectFlightRow),
  };
}

function getAssistantSystemPrompt(language) {
  if (language === 'en') {
    return [
      'You are an aviation delay analytics assistant embedded in Nexus Flight Analytics.',
      'Answer from the supplied aggregate metrics, field metadata, filters, and sample rows only.',
      'Do not claim access to rows not summarized in the context.',
      'Use concise, evidence-based English and mention relevant numbers when available.',
      'Markdown is allowed and will be rendered in the UI.',
      'Prefer brief headings, bullets, bold labels, inline code, and simple tables only when they improve readability.',
      'Do not use raw HTML.',
    ].join(' ');
  }

  return [
    '你是嵌入 Nexus Flight Analytics 的航班延误分析助手。',
    '只能依据提供的聚合指标、字段元数据、当前筛选条件、当前页面内容和样本行回答。',
    '不要声称访问了上下文没有提供的明细数据，也不要编造数据库之外的事实。',
    '用简洁、可执行的中文回答；能引用数字时尽量引用具体数字。',
    '可以使用 Markdown，前端会渲染它。',
    '优先使用短标题、要点、加粗标签、行内代码；只有确实更清楚时才使用简单表格。',
    '不要使用原始 HTML。',
  ].join(' ');
}

function compactClientContext(clientContext = {}) {
  if (!clientContext || typeof clientContext !== 'object') return {};
  return {
    activeTab: String(clientContext.activeTab || '').slice(0, 80),
    tabLabel: String(clientContext.tabLabel || '').slice(0, 120),
    recordCount: clientContext.recordCount,
    summary: clientContext.summary,
    hourlyTrend: Array.isArray(clientContext.hourlyTrend) ? clientContext.hourlyTrend.slice(0, 24) : undefined,
    topDestinationsVolume: Array.isArray(clientContext.topDestinationsVolume)
      ? clientContext.topDestinationsVolume.slice(0, 8)
      : undefined,
    topDestinationsDelay: Array.isArray(clientContext.topDestinationsDelay)
      ? clientContext.topDestinationsDelay.slice(0, 8)
      : undefined,
    delayRanking: Array.isArray(clientContext.delayRanking) ? clientContext.delayRanking.slice(0, 8) : undefined,
    ontimeRanking: Array.isArray(clientContext.ontimeRanking) ? clientContext.ontimeRanking.slice(0, 8) : undefined,
  };
}

function normalizeAssistantModel(value) {
  if (typeof value !== 'string') return '';
  const model = value.trim();
  return ASSISTANT_MODEL_PATTERN.test(model) ? model : '';
}

function parseAssistantModelList(rawModels) {
  if (rawModels === undefined || rawModels === null || rawModels === '') {
    return DEFAULT_ASSISTANT_FALLBACK_MODELS;
  }
  return String(rawModels)
    .split(',')
    .map(normalizeAssistantModel)
    .filter(Boolean);
}

function getAssistantBaseUrl() {
  const configuredBase = (process.env.SUB2API_BASE_URL || 'https://sub2api.cian.fun/v1').replace(/\/+$/, '');
  return configuredBase.endsWith('/v1') ? configuredBase : `${configuredBase}/v1`;
}

function getAssistantModelOptions(preferredModel) {
  const primaryModel = normalizeAssistantModel(process.env.SUB2API_MODEL) || DEFAULT_ASSISTANT_MODEL;
  const fallbackModels = parseAssistantModelList(process.env.SUB2API_FALLBACK_MODELS);
  return Array.from(new Set([
    normalizeAssistantModel(preferredModel),
    primaryModel,
    ...fallbackModels,
  ].filter(Boolean)));
}

async function callSub2Api({ messages, language, preferredModel }) {
  const apiKey = process.env.SUB2API_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const error = new Error('SUB2API_API_KEY is not configured on the server.');
    error.statusCode = 503;
    throw error;
  }

  const baseUrl = getAssistantBaseUrl();
  const models = getAssistantModelOptions(preferredModel);
  const timeoutMs = Number(process.env.SUB2API_TIMEOUT_MS || 45000);
  let lastError = null;

  for (const model of models) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.2,
          max_tokens: 900,
        }),
      });

      if (!response.ok) {
        const details = await response.text().catch(() => '');
        const error = new Error(`Sub2API request failed on ${model}: ${response.status} ${details.slice(0, 300)}`);
        error.statusCode = response.status;
        lastError = error;
        if ([404, 429, 500, 502, 503, 504].includes(response.status)) continue;
        throw error;
      }

      const payload = await response.json();
      return {
        model,
        language,
        content: payload.choices?.[0]?.message?.content || '',
        usage: payload.usage,
      };
    } catch (error) {
      lastError = error;
      if (error?.name !== 'AbortError') {
        const status = error.statusCode || 500;
        if (![404, 429, 500, 502, 503, 504].includes(status)) throw error;
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  const error = lastError || new Error('Sub2API request failed.');
  error.statusCode = error.statusCode || 503;
  throw error;
}

const app = express();
app.use(express.json({ limit: '1mb' }));

for (const [route, file, key] of MODULE_ENDPOINTS) {
  app.get(route, (req, res) => safeJsonResponse(res, getByKey(readJsonFile(file), key)));
}

app.get('/api/module8/summary', async (req, res) => {
  try {
    const explorerData = readJsonFile('module8/explorer_data.json');
    if (explorerData?.summaryStats) return res.json(explorerData.summaryStats);

    const fullSummary = readJsonFile('module8/full_summary.json');
    if (fullSummary) return res.json(fullSummary);

    const allFlights = await loadFullDataset();
    return res.json({
      totalRecords: allFlights.length,
      avgDepDelay: 12.6,
      avgArrDelay: 6.9,
      avgFlightTime: 150.7,
      avgDistance: 1040,
      avgSpeed: 394.3,
      uniqueAirlines: 16,
      uniqueRoutes: 224,
      uniqueAircraft: 4044,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/module8/list', async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page, 10) || 1;
    const pageSize = clampPageSize(req.query.pageSize);
    const dbResult = queryModule8RowsFromDatabase(req.query, { page, pageSize });
    if (dbResult) {
      return res.json(dbResult);
    }

    const data = await loadFullDataset();
    const total = data.length;
    const start = (page - 1) * pageSize;
    res.json({
      data: data.slice(start, start + pageSize),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/module8/airline-options', (req, res) => {
  const dbOptions = getDatabaseOptionRows();
  if (dbOptions) return res.json(dbOptions.airlines);
  safeJsonResponse(res, readModule8Option('airline_options.json', 'airlineOptions'));
});

app.get('/api/module8/dest-options', (req, res) => {
  const dbOptions = getDatabaseOptionRows();
  if (dbOptions) return res.json(dbOptions.destinations);
  safeJsonResponse(res, readModule8Option('dest_options.json', 'destOptions'));
});

app.get('/api/module8/origin-options', (req, res) => {
  const dbOptions = getDatabaseOptionRows();
  if (dbOptions) return res.json(dbOptions.origins);
  safeJsonResponse(res, readModule8Option('origin_options.json', 'originOptions'));
});

app.get('/api/module8/delay-level-options', (req, res) => {
  const dbOptions = getDatabaseOptionRows();
  if (dbOptions) return res.json(dbOptions.delayLevels);
  safeJsonResponse(res, readModule8Option('delay_level_options.json', 'delayLevelOptions'));
});

app.get('/api/module8/month-options', (req, res) => {
  const dbOptions = getDatabaseOptionRows();
  if (dbOptions) return res.json(dbOptions.months);
  safeJsonResponse(res, readModule8Option('month_options.json', 'monthOptions'));
});

app.get('/api/module8/year-options', async (req, res) => {
  try {
    const dbOptions = getDatabaseOptionRows();
    if (dbOptions) return res.json(dbOptions.years);

    const directData = readJsonFile('module8/year_options.json');
    if (directData) return res.json(directData);

    const explorerData = readJsonFile('module8/explorer_data.json');
    if (explorerData?.yearOptions) return res.json(explorerData.yearOptions);

    const data = await loadFullDataset();
    const counts = new Map();
    data.forEach((flight) => {
      if (flight.year) counts.set(flight.year, (counts.get(flight.year) || 0) + 1);
    });
    res.json(Array.from(counts.entries())
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([year, count]) => ({ year, label: String(year), count })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/module8/search', async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page, 10) || 1;
    const pageSize = clampPageSize(req.query.pageSize);
    const dbResult = queryModule8RowsFromDatabase(req.query, { page, pageSize });
    if (dbResult) {
      return res.json(dbResult);
    }

    const data = await loadFullDataset();
    const filtered = filterModule8Rows(data, req.query);
    const total = filtered.length;
    const start = (page - 1) * pageSize;
    res.json({
      data: filtered.slice(start, start + pageSize),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/interactive/analysis', async (req, res) => {
  try {
    const filters = normalizeDefaultFilters(parseInteractiveFilters(req.query));
    if (hasOnlyDefaultYear(filters)) {
      const cache = await warmDefault2013Cache();
      return res.json({
        ...cache.analysis,
        filters,
        source: 'sqlite-cache',
      });
    }

    const dbAnalysis = buildDatabaseInteractiveAnalysis(filters);
    if (dbAnalysis) {
      return res.json({
        ...dbAnalysis,
        filters,
        source: 'sqlite',
      });
    }

    const data = await loadFullDataset();
    return res.json(buildInteractiveAnalysis(data, filters));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/eda/rows', async (req, res) => {
  try {
    const language = req.query.lang === 'en' ? 'en' : 'zh';
    const edaRequest = resolveEdaRequest(req.query.limit, parseInteractiveFilters(req.query));
    const { filters, limit, requestedFullLoad } = edaRequest;
    const normalizedFilters = normalizeDefaultFilters(filters);

    if (requestedFullLoad && hasOnlyDefaultYear(normalizedFilters)) {
      const cache = await warmDefault2013Cache();
      const payload = buildDefaultEdaPayload(language, limit, requestedFullLoad, normalizedFilters);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Vary', 'Accept-Encoding');
      if (String(req.headers['accept-encoding'] || '').includes('gzip')) {
        res.setHeader('Content-Encoding', 'gzip');
        return res.send(payload.gzip);
      }
      return res.send(payload.json);
    }

    const dbQuery = queryFlightsFromDatabase(normalizedFilters, { limit });
    if (dbQuery) {
      const rows = dbQuery.rows.map(projectFlightRow);
      return res.json({
        rows,
        fields: getLocalizedFields(language),
        total: dbQuery.total,
        loaded: rows.length,
        limit,
        sampled: dbQuery.total > rows.length,
        requestedFullLoad,
        filters: normalizedFilters,
        source: 'sqlite',
      });
    }

    const data = await loadFullDataset();
    const filtered = filterFlights(data, normalizedFilters);
    const rows = filtered.slice(0, limit).map(projectFlightRow);
    return res.json({
      rows,
      fields: getLocalizedFields(language),
      total: filtered.length,
      loaded: rows.length,
      limit,
      sampled: filtered.length > rows.length,
      requestedFullLoad,
      filters: normalizedFilters,
      source: 'json',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/assistant/chat', async (req, res) => {
  try {
    const {
      message,
      filters: rawFilters = {},
      activeTab = 'overview',
      language = 'zh',
      clientContext = {},
      history = [],
      model,
    } = req.body || {};

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const filters = parseInteractiveFilters(rawFilters);
    const context = await buildAssistantContext(filters, language === 'en' ? 'en' : 'zh');
    const messages = [
      { role: 'system', content: getAssistantSystemPrompt(language) },
      {
        role: 'user',
        content: JSON.stringify({
          activeTab,
          currentPageContext: compactClientContext(clientContext),
          context,
          instruction: language === 'en'
            ? 'Answer the next user question using this context.'
            : '请使用这些上下文回答下一条用户问题。',
        }),
      },
      ...history.slice(-6).map((item) => ({
        role: item.role === 'assistant' ? 'assistant' : 'user',
        content: String(item.content || '').slice(0, 2000),
      })),
      { role: 'user', content: message },
    ];

    const preferredModel = normalizeAssistantModel(model);
    const answer = await callSub2Api({ messages, language, preferredModel });
    res.json({
      ...answer,
      contextSummary: {
        source: context.source,
        totalRows: context.totalRows,
        filters,
      },
    });
  } catch (error) {
    const status = error.statusCode || 500;
    console.error('[assistant]', error);
    res.status(status).json({ error: error.message || 'Assistant request failed.' });
  }
});

app.get('/api/assistant/health', (req, res) => {
  const baseUrl = getAssistantBaseUrl();
  const model = normalizeAssistantModel(process.env.SUB2API_MODEL) || DEFAULT_ASSISTANT_MODEL;
  const fallbackModels = parseAssistantModelList(process.env.SUB2API_FALLBACK_MODELS);
  const modelOptions = getAssistantModelOptions();
  res.json({
    configured: Boolean(process.env.SUB2API_API_KEY || process.env.OPENAI_API_KEY),
    baseUrl,
    model,
    fallbackModels,
    modelOptions,
    backend: true,
  });
});

app.get('/api/module8/export', async (req, res) => {
  try {
    const exportMode = req.query.exportMode || 'all';
    const page = Number.parseInt(req.query.page, 10) || 1;
    const pageSize = clampPageSize(req.query.pageSize);
    const language = req.query.lang === 'en' ? 'en' : 'zh';
    const dbResult = queryModule8RowsFromDatabase(req.query, { page, pageSize, limit: null });
    const filtered = dbResult?.data || filterModule8Rows(await loadFullDataset(), req.query);

    let exportData = filtered;
    if (exportMode === 'current') {
      const start = (page - 1) * pageSize;
      exportData = filtered.slice(start, start + pageSize);
    } else if (exportMode === 'range') {
      const startPage = Number.parseInt(req.query.startPage, 10) || 1;
      const endPage = Number.parseInt(req.query.endPage, 10) || startPage;
      exportData = filtered.slice((startPage - 1) * pageSize, endPage * pageSize);
    }

    if (exportData.length === 0) {
      return res.status(404).json({ error: 'No matching flight records.' });
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="flights_export_${exportData.length}_${Date.now()}.csv"`);
    res.send('\ufeff' + buildCsv(exportData, language));
  } catch (error) {
    console.error('[Module8 Export]', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/dashboard/summary', (req, res) => {
  const data = readJsonFile('module1/dashboard.json')?.summary;
  if (data) {
    return res.json({
      totalFlights: data.totalFlights?.toLocaleString(),
      avgDepDelay: data.avgDepDelay,
      avgArrDelay: data.avgArrDelay,
      delayedPercentage: (100 - data.depOnTimeRate).toFixed(1),
    });
  }
  res.json({ totalFlights: '336,776', avgDepDelay: '12.6', avgArrDelay: '6.9', delayedPercentage: '39.1' });
});

async function startServer() {
  if (!IS_PRODUCTION) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite development middleware started.');
  } else {
    const distPath = path.join(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\nServer running at http://localhost:${PORT}`);
    console.log(`Data directory: ${DATA_DIR}\n`);
    warmDefault2013Cache().catch((error) => {
      console.warn('[Cache] Failed to warm default 2013 dataset:', error.message);
    });

    if (!fs.existsSync(path.join(DATA_DIR, 'module1', 'dashboard.json'))) {
      console.log('Warning: data files are missing. Run the R analysis scripts first.');
      console.log('  cd scripts && Rscript run_all_analyses.R\n');
    }
  });
}

startServer().catch(console.error);
