import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import yauzl from 'yauzl';
import { parse } from 'csv-parse';

const __filename = fileURLToPath(import.meta.url);
const ROOT_DIR = path.dirname(path.dirname(__filename));
const DATA_DIR = path.join(ROOT_DIR, 'data');
const MODULE8_DIR = path.join(DATA_DIR, 'module8');
const RAW_DIR = path.join(DATA_DIR, 'raw_multi_year');
const BTS_CACHE_DIR = path.join(RAW_DIR, 'bts_cache');
const DB_PATH = path.join(DATA_DIR, 'flights.sqlite');
const AIRPORTS = new Set(['JFK', 'LGA', 'EWR']);
const NONE_FILTER_TOKEN = '__none__';

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, value = 'true'] = arg.replace(/^--/, '').split('=');
    return [key, value];
  }),
);

const importJson = args.get('import-json') !== 'false';
const importBts = args.get('import-bts') === 'true';
const startYear = Number(args.get('start-year') || 2015);
const endYear = Number(args.get('end-year') || 2026);
const endMonth = Number(args.get('end-month') || 2);
const force = args.get('force') === 'true';
const skipFailedBts = args.get('skip-failed') !== 'false';
const downloadTimeoutMs = Number(args.get('download-timeout-ms') || 120000);

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(RAW_DIR, { recursive: true });
fs.mkdirSync(BTS_CACHE_DIR, { recursive: true });

if (force && fs.existsSync(DB_PATH)) {
  fs.rmSync(DB_PATH, { force: true });
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = DELETE');
db.pragma('synchronous = NORMAL');

db.exec(`
CREATE TABLE IF NOT EXISTS flights (
  id INTEGER PRIMARY KEY,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  day INTEGER,
  hour INTEGER,
  weekday INTEGER,
  weekdayName TEXT,
  airlineCode TEXT,
  airlineName TEXT,
  flightNumber TEXT,
  aircraftId TEXT,
  departureAirport TEXT,
  departureAirportName TEXT,
  arrivalAirport TEXT,
  arrivalAirportName TEXT,
  route TEXT,
  departureDelay REAL,
  arrivalDelay REAL,
  flightTime REAL,
  flightDistance REAL,
  flightSpeed REAL,
  delayLevel TEXT,
  source TEXT,
  uniqueKey TEXT NOT NULL UNIQUE
);

CREATE INDEX IF NOT EXISTS idx_flights_year ON flights(year);
CREATE INDEX IF NOT EXISTS idx_flights_month ON flights(month);
CREATE INDEX IF NOT EXISTS idx_flights_airline ON flights(airlineCode);
CREATE INDEX IF NOT EXISTS idx_flights_origin ON flights(departureAirport);
CREATE INDEX IF NOT EXISTS idx_flights_dest ON flights(arrivalAirport);
CREATE INDEX IF NOT EXISTS idx_flights_delay_level ON flights(delayLevel);
`);

const insertFlight = db.prepare(`
INSERT OR REPLACE INTO flights (
  year, month, day, hour, weekday, weekdayName,
  airlineCode, airlineName, flightNumber, aircraftId,
  departureAirport, departureAirportName, arrivalAirport, arrivalAirportName,
  route, departureDelay, arrivalDelay, flightTime, flightDistance, flightSpeed,
  delayLevel, source, uniqueKey
) VALUES (
  @year, @month, @day, @hour, @weekday, @weekdayName,
  @airlineCode, @airlineName, @flightNumber, @aircraftId,
  @departureAirport, @departureAirportName, @arrivalAirport, @arrivalAirportName,
  @route, @departureDelay, @arrivalDelay, @flightTime, @flightDistance, @flightSpeed,
  @delayLevel, @source, @uniqueKey
)`);

function toNumber(value) {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getDelayLevel(depDelay) {
  const delay = toNumber(depDelay);
  if (delay === null) return '数据缺失';
  if (delay <= 0) return '准点';
  if (delay <= 15) return '轻微';
  if (delay <= 60) return '中度';
  return '严重';
}

function getWeekday(year, month, day) {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(date.getTime())) return { weekday: null, weekdayName: '' };
  const mondayBased = date.getUTCDay() === 0 ? 7 : date.getUTCDay();
  return {
    weekday: mondayBased,
    weekdayName: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'][mondayBased - 1],
  };
}

function normalizeFlight(row, source) {
  const year = toNumber(row.year ?? row.Year);
  const month = toNumber(row.month ?? row.Month);
  const day = toNumber(row.day ?? row.DayofMonth);
  const schedDepTime = toNumber(row.sched_dep_time ?? row.CRSDepTime);
  const hour = toNumber(row.hour) ?? (schedDepTime !== null ? Math.floor(schedDepTime / 100) : null);
  const departureAirport = String(row.departureAirport ?? row.origin ?? row.Origin ?? '');
  const arrivalAirport = String(row.arrivalAirport ?? row.dest ?? row.Dest ?? '');
  const airlineCode = String(row.airlineCode ?? row.carrier ?? row.Reporting_Airline ?? '');
  const flightNumber = String(row.flightNumber ?? row.flight ?? row.Flight_Number_Reporting_Airline ?? '');
  const aircraftId = String(row.aircraftId ?? row.tailnum ?? row.Tail_Number ?? '');
  const departureDelay = toNumber(row.departureDelay ?? row.dep_delay ?? row.DepDelay);
  const arrivalDelay = toNumber(row.arrivalDelay ?? row.arr_delay ?? row.ArrDelay);
  const flightTime = toNumber(row.flightTime ?? row.air_time ?? row.AirTime);
  const flightDistance = toNumber(row.flightDistance ?? row.distance ?? row.Distance);
  const flightSpeed = toNumber(row.flightSpeed) ?? (flightTime ? flightDistance / (flightTime / 60) : null);
  const { weekday, weekdayName } = row.weekday
    ? { weekday: toNumber(row.weekday), weekdayName: row.weekdayName || row.weekday_name || '' }
    : getWeekday(year, month, day);

  return {
    year,
    month,
    day,
    hour,
    weekday,
    weekdayName,
    airlineCode,
    airlineName: String(row.airlineName ?? row.carrier_name ?? row.airlineCode ?? row.carrier ?? row.Reporting_Airline ?? ''),
    flightNumber,
    aircraftId,
    departureAirport,
    departureAirportName: String(row.departureAirportName ?? row.origin_name ?? departureAirport),
    arrivalAirport,
    arrivalAirportName: String(row.arrivalAirportName ?? row.dest_name ?? arrivalAirport),
    route: row.route || `${departureAirport} → ${arrivalAirport}`,
    departureDelay,
    arrivalDelay,
    flightTime,
    flightDistance,
    flightSpeed,
    delayLevel: row.delayLevel || getDelayLevel(departureDelay),
    source,
    uniqueKey: [
      year,
      month,
      day,
      airlineCode,
      flightNumber,
      aircraftId,
      departureAirport,
      arrivalAirport,
      schedDepTime ?? hour ?? '',
    ].join('|'),
  };
}

function getChunkFiles() {
  if (!fs.existsSync(MODULE8_DIR)) return [];
  return fs.readdirSync(MODULE8_DIR)
    .filter((name) => /^full_data_chunk_\d+\.json$/.test(name))
    .sort((a, b) => Number(a.match(/\d+/)?.[0] || 0) - Number(b.match(/\d+/)?.[0] || 0))
    .map((name) => path.join(MODULE8_DIR, name));
}

function importRows(rows, source) {
  const tx = db.transaction((records) => {
    for (const row of records) {
      const flight = normalizeFlight(row, source);
      if (!flight.year || !flight.month || !flight.departureAirport || !flight.arrivalAirport) continue;
      insertFlight.run(flight);
    }
  });
  tx(rows);
}

function importModule8Json() {
  const chunkFiles = getChunkFiles();
  if (chunkFiles.length === 0) {
    console.log('[db] 未找到 module8 JSON chunks，跳过 JSON 导入。');
    return;
  }

  for (const chunkFile of chunkFiles) {
    const rows = JSON.parse(fs.readFileSync(chunkFile, 'utf8'));
    importRows(rows, 'module8-json');
    console.log(`[db] 导入 ${path.basename(chunkFile)}：${rows.length.toLocaleString()} 条`);
  }
}

function btsUrl(year, month) {
  return `https://transtats.bts.gov/PREZIP/On_Time_Reporting_Carrier_On_Time_Performance_1987_present_${year}_${month}.zip`;
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const tempDest = `${dest}.part`;
    fs.rmSync(tempDest, { force: true });
    const request = https.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        downloadFile(response.headers.location, dest).then(resolve, reject);
        return;
      }
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode} for ${url}`));
        return;
      }
      pipeline(response, fs.createWriteStream(tempDest))
        .then(() => {
          fs.renameSync(tempDest, dest);
          resolve();
        })
        .catch((error) => {
          fs.rmSync(tempDest, { force: true });
          reject(error);
        });
    });
    request.setTimeout(downloadTimeoutMs, () => {
      request.destroy(new Error(`下载超时（${Math.round(downloadTimeoutMs / 1000)} 秒）：${url}`));
    });
    request.on('error', (error) => {
      fs.rmSync(tempDest, { force: true });
      reject(error);
    });
  });
}

function openZip(zipPath) {
  return new Promise((resolve, reject) => {
    yauzl.open(zipPath, { lazyEntries: true }, (error, zipFile) => {
      if (error) reject(error);
      else resolve(zipFile);
    });
  });
}

async function findLargestCsvEntry(zipFile) {
  return new Promise((resolve, reject) => {
    let best = null;
    zipFile.readEntry();
    zipFile.on('entry', (entry) => {
      if (/\.csv$/i.test(entry.fileName) && (!best || entry.uncompressedSize > best.uncompressedSize)) {
        best = entry;
      }
      zipFile.readEntry();
    });
    zipFile.on('end', () => (best ? resolve(best) : reject(new Error('zip 中没有 CSV 文件'))));
    zipFile.on('error', reject);
  });
}

function openReadStream(zipFile, entry) {
  return new Promise((resolve, reject) => {
    zipFile.openReadStream(entry, (error, stream) => {
      if (error) reject(error);
      else resolve(stream);
    });
  });
}

async function importBtsMonth(year, month) {
  const zipPath = path.join(BTS_CACHE_DIR, `bts_${year}_${String(month).padStart(2, '0')}.zip`);
  let zipFile = null;

  if (fs.existsSync(zipPath) && fs.statSync(zipPath).size >= 1024) {
    try {
      zipFile = await openZip(zipPath);
    } catch (error) {
      console.warn(`[db] 缓存 zip 损坏，重新下载 ${path.basename(zipPath)}：${error.message}`);
      fs.rmSync(zipPath, { force: true });
    }
  }

  if (!zipFile) {
    console.log(`[db] 下载 BTS ${year}-${String(month).padStart(2, '0')}...`);
    await downloadFile(btsUrl(year, month), zipPath);
    zipFile = await openZip(zipPath);
  }

  const entry = await findLargestCsvEntry(zipFile);
  const stream = await openReadStream(zipFile, entry);
  const parser = stream.pipe(parse({ columns: true, bom: true, relax_column_count: true }));
  const batch = [];
  let imported = 0;

  for await (const row of parser) {
    if (!AIRPORTS.has(row.Origin)) continue;
    batch.push(row);
    if (batch.length >= 5000) {
      importRows(batch, 'bts-prezip');
      imported += batch.length;
      batch.length = 0;
    }
  }

  if (batch.length) {
    importRows(batch, 'bts-prezip');
    imported += batch.length;
  }
  zipFile.close();
  console.log(`[db] 导入 BTS ${year}-${String(month).padStart(2, '0')}：${imported.toLocaleString()} 条纽约三机场航班`);
}

async function importBtsRange() {
  const failures = [];
  for (let year = startYear; year <= endYear; year += 1) {
    const lastMonth = year === endYear ? endMonth : 12;
    for (let month = 1; month <= lastMonth; month += 1) {
      try {
        await importBtsMonth(year, month);
      } catch (error) {
        const label = `${year}-${String(month).padStart(2, '0')}`;
        failures.push(`${label}: ${error.message}`);
        console.warn(`[db] 跳过 BTS ${label}：${error.message}`);
        if (!skipFailedBts) throw error;
      }
    }
  }
  if (failures.length > 0) {
    console.warn('[db] 以下 BTS 月份未导入，可稍后重新运行同一命令续跑：');
    failures.forEach((failure) => console.warn(`  - ${failure}`));
  }
}

if (importJson) importModule8Json();
if (importBts) await importBtsRange();

const summary = db.prepare('SELECT MIN(year) AS minYear, MAX(year) AS maxYear, COUNT(*) AS total FROM flights').get();
db.exec('ANALYZE;');
db.close();

console.log(`[db] 完成：${DB_PATH}`);
console.log(`[db] 年份范围：${summary.minYear}-${summary.maxYear}，总记录：${Number(summary.total).toLocaleString()}`);
