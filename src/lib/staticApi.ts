import { buildInteractiveAnalysis, filterFlights, parseInteractiveFilters } from './interactiveAnalysis.js';
import { getLocalizedFields, projectFlightRow } from './fieldMetadata.js';

type EndpointSpec = {
  file: string;
  key?: string;
};

type FlightRecord = Record<string, unknown>;

const API_ENDPOINTS: Record<string, EndpointSpec> = {
  '/api/airports-info': { file: 'airports_info.json' },
  '/api/airlines-info': { file: 'airlines_info.json' },

  '/api/module1/summary': { file: 'module1/dashboard.json', key: 'summary' },
  '/api/module1/hourly-trend': { file: 'module1/dashboard.json', key: 'hourlyTrend' },
  '/api/module1/top-destinations': { file: 'module1/dashboard.json', key: 'topDestinations' },
  '/api/module1/delayed-destinations': { file: 'module1/dashboard.json', key: 'delayedDestinations' },
  '/api/module1/delayed-airlines': { file: 'module1/dashboard.json', key: 'delayedAirlines' },
  '/api/module1/heatmap': { file: 'module1/dashboard.json', key: 'heatmap' },
  '/api/module1/ontime-pie': { file: 'module1/dashboard.json', key: 'ontimePie' },
  '/api/module1/monthly-stats': { file: 'module1/dashboard.json', key: 'monthlyStats' },
  '/api/module1/origin-stats': { file: 'module1/dashboard.json', key: 'originStats' },

  '/api/module2/hourly-dep-delay': { file: 'module2/time_analysis.json', key: 'hourlyDepDelay' },
  '/api/module2/hourly-arr-delay': { file: 'module2/time_analysis.json', key: 'hourlyArrDelay' },
  '/api/module2/hourly-comparison': { file: 'module2/time_analysis.json', key: 'hourlyComparison' },
  '/api/module2/monthly-trend': { file: 'module2/time_analysis.json', key: 'monthlyTrend' },
  '/api/module2/weekday-analysis': { file: 'module2/time_analysis.json', key: 'weekdayAnalysis' },
  '/api/module2/weekday-hour-heatmap': { file: 'module2/time_analysis.json', key: 'weekdayHourHeatmap' },
  '/api/module2/period-analysis': { file: 'module2/time_analysis.json', key: 'periodAnalysis' },
  '/api/module2/conclusions': { file: 'module2/time_analysis.json', key: 'conclusions' },

  '/api/module3/top-destinations-volume': { file: 'module3/route_analysis.json', key: 'topDestinationsVolume' },
  '/api/module3/top-destinations-delay': { file: 'module3/route_analysis.json', key: 'topDestinationsDelay' },
  '/api/module3/route-analysis': { file: 'module3/route_analysis.json', key: 'routeAnalysis' },
  '/api/module3/bubble-data': { file: 'module3/route_analysis.json', key: 'bubbleData' },
  '/api/module3/origin-dest-heatmap': { file: 'module3/route_analysis.json', key: 'originDestHeatmap' },
  '/api/module3/jfk-risky-routes': { file: 'module3/route_analysis.json', key: 'jfkRiskyRoutes' },
  '/api/module3/ewr-risky-routes': { file: 'module3/route_analysis.json', key: 'ewrRiskyRoutes' },
  '/api/module3/lga-risky-routes': { file: 'module3/route_analysis.json', key: 'lgaRiskyRoutes' },
  '/api/module3/distance-distribution': { file: 'module3/route_analysis.json', key: 'distanceDistribution' },
  '/api/module3/dest-geo': { file: 'module3/route_analysis.json', key: 'destGeo' },
  '/api/module3/origin-geo': { file: 'module3/route_analysis.json', key: 'originGeo' },

  '/api/module4/recovery-stats': { file: 'module4/recovery_analysis.json', key: 'recoveryStats' },
  '/api/module4/speed-scatter': { file: 'module4/recovery_analysis.json', key: 'speedScatter' },
  '/api/module4/recovery-scatter': { file: 'module4/recovery_analysis.json', key: 'recoveryScatter' },
  '/api/module4/airline-recovery': { file: 'module4/recovery_analysis.json', key: 'airlineRecovery' },
  '/api/module4/airline-boxplot': { file: 'module4/recovery_analysis.json', key: 'airlineBoxplotStats' },
  '/api/module4/dest-recovery': { file: 'module4/recovery_analysis.json', key: 'destRecovery' },
  '/api/module4/distance-recovery': { file: 'module4/recovery_analysis.json', key: 'distanceRecovery' },
  '/api/module4/speed-recovery-trend': { file: 'module4/recovery_analysis.json', key: 'speedRecoveryTrend' },
  '/api/module4/recovery-distribution': { file: 'module4/recovery_analysis.json', key: 'recoveryDistribution' },

  '/api/module5/airline-stats': { file: 'module5/airline_analysis.json', key: 'airlineStats' },
  '/api/module5/fleet-scatter': { file: 'module5/airline_analysis.json', key: 'fleetDelayScatter' },
  '/api/module5/ontime-bubble': { file: 'module5/airline_analysis.json', key: 'ontimeBubble' },
  '/api/module5/delay-ranking': { file: 'module5/airline_analysis.json', key: 'airlineDelayRanking' },
  '/api/module5/ontime-ranking': { file: 'module5/airline_analysis.json', key: 'airlineOntimeRanking' },
  '/api/module5/quadrant-data': { file: 'module5/airline_analysis.json', key: 'quadrantData' },
  '/api/module5/quadrant-summary': { file: 'module5/airline_analysis.json', key: 'quadrantSummary' },
  '/api/module5/airline-monthly': { file: 'module5/airline_analysis.json', key: 'airlineMonthly' },
  '/api/module5/airline-comparison': { file: 'module5/airline_analysis.json', key: 'airlineComparison' },

  '/api/module6/propagation-stats': { file: 'module6/propagation_analysis.json', key: 'propagationStats' },
  '/api/module6/sequence-delay': { file: 'module6/propagation_analysis.json', key: 'sequenceDelay' },
  '/api/module6/propagation-scatter': { file: 'module6/propagation_analysis.json', key: 'propagationScatter' },
  '/api/module6/sankey-nodes': { file: 'module6/propagation_analysis.json', key: 'sankeyNodes' },
  '/api/module6/sankey-links': { file: 'module6/propagation_analysis.json', key: 'sankeyLinks' },
  '/api/module6/case-example': { file: 'module6/propagation_analysis.json', key: 'caseExample' },
  '/api/module6/sequence-propagation': { file: 'module6/propagation_analysis.json', key: 'sequencePropagation' },

  '/api/module7/age-analysis': { file: 'module7/attribution_analysis.json', key: 'ageAnalysis' },
  '/api/module7/weather-analysis': { file: 'module7/attribution_analysis.json', key: 'weatherAnalysis' },
  '/api/module7/correlation-matrix': { file: 'module7/attribution_analysis.json', key: 'correlationMatrix' },
  '/api/module7/interaction-analysis': { file: 'module7/attribution_analysis.json', key: 'interactionAnalysis' },
  '/api/module7/feature-importance': { file: 'module7/attribution_analysis.json', key: 'featureImportance' },
  '/api/module7/weather-boxplot': { file: 'module7/attribution_analysis.json', key: 'weatherBoxplotStats' },
  '/api/module7/radar-data': { file: 'module7/attribution_analysis.json', key: 'radarData' },
  '/api/module7/conclusions': { file: 'module7/attribution_analysis.json', key: 'conclusions' },
};

const MODULE8_OPTION_FILES: Record<string, { file: string; key: string }> = {
  '/api/module8/airline-options': { file: 'module8/airline_options.json', key: 'airlineOptions' },
  '/api/module8/dest-options': { file: 'module8/dest_options.json', key: 'destOptions' },
  '/api/module8/origin-options': { file: 'module8/origin_options.json', key: 'originOptions' },
  '/api/module8/delay-level-options': { file: 'module8/delay_level_options.json', key: 'delayLevelOptions' },
  '/api/module8/month-options': { file: 'module8/month_options.json', key: 'monthOptions' },
  '/api/module8/year-options': { file: 'module8/year_options.json', key: 'yearOptions' },
};

const DEFAULT_YEAR = '2013';
const DEFAULT_CHUNK_SIZE = 50000;
const DEFAULT_EDA_ROWS = 50000;
const MAX_EDA_ROWS = 400000;
const DEFAULT_ANALYSIS_CACHE_FILE = `module8/default_${DEFAULT_YEAR}_analysis.json`;
const DEFAULT_EDA_CACHE_FILES: Record<string, string> = {
  zh: `module8/default_${DEFAULT_YEAR}_eda_zh.json`,
  en: `module8/default_${DEFAULT_YEAR}_eda_en.json`,
};
const jsonCache = new Map<string, Promise<unknown>>();

declare global {
  interface Window {
    __NEXUS_STATIC_API_INSTALLED__?: boolean;
  }
}

function dataUrl(filePath: string): string {
  const base = new URL(import.meta.env.BASE_URL || './', window.location.href);
  return new URL(`data/${filePath}`, base).toString();
}

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...(init.headers || {}),
    },
  });
}

function csvResponse(csv: string): Response {
  return new Response('\ufeff' + csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="flights_export_${Date.now()}.csv"`,
    },
  });
}

function getApiPath(url: URL): string | null {
  const apiIndex = url.pathname.indexOf('/api/');
  return apiIndex >= 0 ? url.pathname.slice(apiIndex) : null;
}

function getByKey(data: unknown, key?: string): unknown {
  if (!key) return data;
  if (data && typeof data === 'object' && key in data) return (data as Record<string, unknown>)[key];
  return null;
}

function toPositiveInt(value: string | null, fallback: number): number {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function clampLimit(value: string | null, fallback = DEFAULT_EDA_ROWS): number {
  return Math.min(toPositiveInt(value, fallback), MAX_EDA_ROWS);
}

function hasAnyInteractiveFilter(filters: Record<string, string[]>): boolean {
  return ['years', 'months', 'airlines', 'origins', 'destinations', 'delayLevels']
    .some((key) => filters[key]?.length > 0);
}

function hasOnlyDefaultYear(filters: Record<string, string[]>): boolean {
  const years = filters.years || [];
  return years.length === 1
    && String(years[0]) === DEFAULT_YEAR
    && ['months', 'airlines', 'origins', 'destinations', 'delayLevels']
      .every((key) => !filters[key]?.length);
}

function normalizeDefaultFilters(filters: Record<string, string[]>): Record<string, string[]> {
  return hasAnyInteractiveFilter(filters) ? filters : { ...filters, years: [DEFAULT_YEAR] };
}

function resolveEdaRequest(params: URLSearchParams) {
  const requestedFullLoad = (params.get('limit') || '').toLowerCase() === 'all';
  const filters = parseInteractiveFilters(params);

  if (!hasAnyInteractiveFilter(filters)) {
    filters.years = [DEFAULT_YEAR];
  }

  return {
    filters,
    limit: requestedFullLoad ? MAX_EDA_ROWS : clampLimit(params.get('limit')),
    requestedFullLoad,
  };
}

function hasExplorerFilters(params: URLSearchParams): boolean {
  return ['q', 'airline', 'destination', 'delayLevel'].some((key) => (params.get(key) || '').trim());
}

function isDefaultYearOnlyParams(params: URLSearchParams): boolean {
  const filters = normalizeDefaultFilters(parseInteractiveFilters(params));
  return hasOnlyDefaultYear(filters);
}

function asText(value: unknown): string {
  return value === null || value === undefined ? '' : String(value).toLowerCase();
}

function matchesExplorerFlight(flight: FlightRecord, params: URLSearchParams): boolean {
  const q = (params.get('q') || '').toLowerCase().trim();
  const airline = params.get('airline') || '';
  const destination = params.get('destination') || '';
  const delayLevel = params.get('delayLevel') || '';

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
    flight.departureAirportName,
    flight.arrivalAirport,
    flight.arrivalAirportName,
  ].some((value) => asText(value).includes(q));
}

async function loadJson(filePath: string, nativeFetch: typeof fetch): Promise<unknown> {
  if (!jsonCache.has(filePath)) {
    jsonCache.set(
      filePath,
      nativeFetch(dataUrl(filePath)).then((response) => {
        if (!response.ok) throw new Error(`Static data not found: ${filePath}`);
        return response.json();
      }),
    );
  }
  return jsonCache.get(filePath)!;
}

async function loadArray(filePath: string, nativeFetch: typeof fetch): Promise<FlightRecord[]> {
  const data = await loadJson(filePath, nativeFetch);
  return Array.isArray(data) ? (data as FlightRecord[]) : [];
}

async function loadModule8Meta(nativeFetch: typeof fetch): Promise<Record<string, unknown>> {
  const meta = await loadJson('module8/explorer_metadata.json', nativeFetch).catch(() => null);
  if (meta && typeof meta === 'object') return meta as Record<string, unknown>;

  const legacy = await loadJson('module8/explorer_data.json', nativeFetch).catch(() => null);
  return legacy && typeof legacy === 'object' ? (legacy as Record<string, unknown>) : {};
}

async function loadModule8ChunkInfo(nativeFetch: typeof fetch) {
  const meta = await loadModule8Meta(nativeFetch);
  const summary = (meta.summaryStats || meta) as Record<string, unknown>;
  const totalRecords = Number(summary.totalRecords || meta.totalRecords || 336776);
  const chunkSize = Number(meta.chunkSize || DEFAULT_CHUNK_SIZE) || DEFAULT_CHUNK_SIZE;
  const chunkCount = Number(meta.chunkCount || Math.ceil(totalRecords / chunkSize)) || 1;
  return { chunkSize, chunkCount, totalRecords };
}

async function loadTotalRecords(nativeFetch: typeof fetch): Promise<number> {
  const { totalRecords } = await loadModule8ChunkInfo(nativeFetch);
  return totalRecords;
}

async function loadYearTotal(year: string, nativeFetch: typeof fetch): Promise<number | null> {
  const directData = await loadJson('module8/year_options.json', nativeFetch).catch(() => null);
  const meta = Array.isArray(directData) ? null : await loadModule8Meta(nativeFetch);
  const options = Array.isArray(directData)
    ? directData as any[]
    : Array.isArray(meta?.yearOptions) ? meta.yearOptions as any[] : [];
  const row = options.find((item) => String(item.year ?? item.label) === year);
  const count = Number(row?.count);
  return Number.isFinite(count) && count > 0 ? count : null;
}

async function loadChunk(chunkNumber: number, nativeFetch: typeof fetch): Promise<FlightRecord[]> {
  return loadArray(`module8/full_data_chunk_${chunkNumber}.json`, nativeFetch);
}

async function loadFirstPage(nativeFetch: typeof fetch): Promise<FlightRecord[]> {
  const fullFirstPage = await loadArray('module8/full_first_page.json', nativeFetch).catch(() => null);
  if (fullFirstPage) return fullFirstPage;
  return loadArray('module8/first_page.json', nativeFetch);
}

async function loadDefaultAnalysisCache(nativeFetch: typeof fetch): Promise<Record<string, any> | null> {
  const cache = await loadJson(DEFAULT_ANALYSIS_CACHE_FILE, nativeFetch).catch(() => null);
  return cache && typeof cache === 'object' ? cache as Record<string, any> : null;
}

async function loadDefaultEdaCache(language: string, nativeFetch: typeof fetch): Promise<Record<string, any> | null> {
  const cache = await loadJson(DEFAULT_EDA_CACHE_FILES[language] || DEFAULT_EDA_CACHE_FILES.zh, nativeFetch).catch(() => null);
  return cache && typeof cache === 'object' ? cache as Record<string, any> : null;
}

async function loadUnfilteredRange(startIndex: number, endIndex: number, nativeFetch: typeof fetch) {
  if (startIndex === 0 && endIndex <= 100) {
    const firstPage = await loadFirstPage(nativeFetch);
    return firstPage.slice(startIndex, endIndex);
  }

  const { chunkSize } = await loadModule8ChunkInfo(nativeFetch);
  const firstChunk = Math.floor(startIndex / chunkSize) + 1;
  const lastChunk = Math.floor((endIndex - 1) / chunkSize) + 1;
  const rows: FlightRecord[] = [];

  for (let chunkNumber = firstChunk; chunkNumber <= lastChunk; chunkNumber += 1) {
    const chunk = await loadChunk(chunkNumber, nativeFetch);
    const chunkStart = (chunkNumber - 1) * chunkSize;
    const localStart = Math.max(startIndex - chunkStart, 0);
    const localEnd = Math.min(endIndex - chunkStart, chunk.length);
    rows.push(...chunk.slice(localStart, localEnd));
  }

  return rows;
}

async function collectMatchingFlights(
  params: URLSearchParams,
  nativeFetch: typeof fetch,
  options: { mode: 'all' } | { mode: 'page'; start: number; end: number },
): Promise<{ rows: FlightRecord[]; total: number }> {
  const { chunkCount } = await loadModule8ChunkInfo(nativeFetch);
  const rows: FlightRecord[] = [];
  let total = 0;

  for (let chunkNumber = 1; chunkNumber <= chunkCount; chunkNumber += 1) {
    const chunk = await loadChunk(chunkNumber, nativeFetch);

    for (const flight of chunk) {
      if (!matchesExplorerFlight(flight, params)) continue;

      if (options.mode === 'all') {
        rows.push(flight);
      } else if (total >= options.start && total < options.end) {
        rows.push(flight);
      }

      total += 1;
    }
  }

  return { rows, total };
}

async function collectFilteredFlights(
  filters: Record<string, string[]>,
  nativeFetch: typeof fetch,
  limit: number | null,
): Promise<{ rows: FlightRecord[]; total: number }> {
  const { chunkCount } = await loadModule8ChunkInfo(nativeFetch);
  const rows: FlightRecord[] = [];
  let total = 0;

  for (let chunkNumber = 1; chunkNumber <= chunkCount; chunkNumber += 1) {
    const chunk = await loadChunk(chunkNumber, nativeFetch);
    const filtered = filterFlights(chunk, filters);
    total += filtered.length;

    if (limit === null) {
      rows.push(...filtered);
    } else if (rows.length < limit) {
      rows.push(...filtered.slice(0, limit - rows.length));
    }
  }

  return { rows, total };
}

async function handleSimpleEndpoint(pathname: string, nativeFetch: typeof fetch): Promise<Response | null> {
  const endpoint = API_ENDPOINTS[pathname];
  if (!endpoint) return null;

  const data = await loadJson(endpoint.file, nativeFetch);
  const payload = getByKey(data, endpoint.key);
  return payload === null || payload === undefined
    ? jsonResponse({ error: 'Data not found' }, { status: 404 })
    : jsonResponse(payload);
}

async function handleModule8Option(pathname: string, nativeFetch: typeof fetch): Promise<Response | null> {
  const option = MODULE8_OPTION_FILES[pathname];
  if (!option) return null;

  const directData = await loadJson(option.file, nativeFetch).catch(() => null);
  if (Array.isArray(directData)) return jsonResponse(directData);

  const meta = await loadModule8Meta(nativeFetch);
  return jsonResponse(meta[option.key] || []);
}

async function handleModule8Summary(nativeFetch: typeof fetch): Promise<Response> {
  const meta = await loadModule8Meta(nativeFetch);
  if (meta.summaryStats) return jsonResponse(meta.summaryStats);

  const fullSummary = await loadJson('module8/full_summary.json', nativeFetch).catch(() => null);
  return jsonResponse(fullSummary || meta);
}

async function handleDashboardSummary(nativeFetch: typeof fetch): Promise<Response> {
  const dashboard = (await loadJson('module1/dashboard.json', nativeFetch)) as Record<string, unknown>;
  const summary = (dashboard.summary || {}) as Record<string, unknown>;
  return jsonResponse({
    totalFlights: Number(summary.totalFlights || 0).toLocaleString(),
    avgDepDelay: summary.avgDepDelay,
    avgArrDelay: summary.avgArrDelay,
    delayedPercentage: summary.depOnTimeRate
      ? (100 - Number(summary.depOnTimeRate)).toFixed(1)
      : undefined,
  });
}

async function handleModule8Search(url: URL, nativeFetch: typeof fetch): Promise<Response> {
  const params = url.searchParams;
  const page = toPositiveInt(params.get('page'), 1);
  const pageSize = toPositiveInt(params.get('pageSize'), 20);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  if (!hasExplorerFilters(params)) {
    const total = await loadTotalRecords(nativeFetch);
    const rows = start >= total ? [] : await loadUnfilteredRange(start, Math.min(end, total), nativeFetch);
    return jsonResponse({ data: rows, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  }

  const filtered = await collectMatchingFlights(params, nativeFetch, {
    start,
    end,
    mode: 'page',
  });

  return jsonResponse({
    data: filtered.rows,
    total: filtered.total,
    page,
    pageSize,
    totalPages: Math.ceil(filtered.total / pageSize),
  });
}

function csvEscape(value: unknown): string {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function buildCsv(rows: FlightRecord[], language: string): string {
  const fields = getLocalizedFields(language);
  const header = fields.map((field: any) => csvEscape(field.label)).join(',');
  const body = rows.map((row) => fields.map((field: any) => csvEscape(row[field.fid])).join(','));
  return [header, ...body].join('\n');
}

async function handleModule8Export(url: URL, nativeFetch: typeof fetch): Promise<Response> {
  const params = url.searchParams;
  const mode = params.get('exportMode') || 'all';
  const pageSize = toPositiveInt(params.get('pageSize'), 20);
  const page = toPositiveInt(params.get('page'), 1);
  const language = params.get('lang') === 'en' ? 'en' : 'zh';
  let rows: FlightRecord[];

  if (!hasExplorerFilters(params) && mode !== 'all') {
    const startPage = mode === 'range' ? toPositiveInt(params.get('startPage'), 1) : page;
    const endPage = mode === 'range' ? toPositiveInt(params.get('endPage'), startPage) : page;
    rows = await loadUnfilteredRange((startPage - 1) * pageSize, endPage * pageSize, nativeFetch);
  } else {
    const collection = await collectMatchingFlights(params, nativeFetch, { mode: 'all' });
    rows = collection.rows;

    if (mode === 'current') {
      const start = (page - 1) * pageSize;
      rows = rows.slice(start, start + pageSize);
    } else if (mode === 'range') {
      const startPage = toPositiveInt(params.get('startPage'), 1);
      const endPage = toPositiveInt(params.get('endPage'), startPage);
      rows = rows.slice((startPage - 1) * pageSize, endPage * pageSize);
    }
  }

  if (rows.length === 0) return jsonResponse({ error: 'No matching flight records' }, { status: 404 });
  return csvResponse(buildCsv(rows, language));
}

async function handleInteractiveAnalysis(url: URL, nativeFetch: typeof fetch): Promise<Response> {
  const filters = normalizeDefaultFilters(parseInteractiveFilters(url.searchParams));

  if (isDefaultYearOnlyParams(url.searchParams)) {
    const cache = await loadDefaultAnalysisCache(nativeFetch);
    if (cache?.analysis) return jsonResponse(cache.analysis);
  }

  const filtered = await collectFilteredFlights(filters, nativeFetch, null);
  return jsonResponse({
    ...buildInteractiveAnalysis(filtered.rows, {}),
    filters,
    source: 'static-json',
  });
}

async function handleEdaRows(url: URL, nativeFetch: typeof fetch): Promise<Response> {
  const params = url.searchParams;
  const language = params.get('lang') === 'en' ? 'en' : 'zh';
  const { filters, limit, requestedFullLoad } = resolveEdaRequest(params);

  if (hasOnlyDefaultYear(filters)) {
    const cachedPayload = await loadDefaultEdaCache(language, nativeFetch);
    if (cachedPayload && limit <= DEFAULT_EDA_ROWS && !requestedFullLoad) {
      return jsonResponse({
        ...cachedPayload,
        rows: cachedPayload.rows.slice(0, limit),
        loaded: Math.min(cachedPayload.loaded, limit),
        limit,
        requestedFullLoad,
        filters,
      });
    }

    const total = await loadYearTotal(DEFAULT_YEAR, nativeFetch) || await loadTotalRecords(nativeFetch);
    const rows = (await loadUnfilteredRange(0, Math.min(limit, total), nativeFetch))
      .map((row: any) => projectFlightRow(row));

    return jsonResponse({
      rows,
      fields: getLocalizedFields(language),
      total,
      loaded: rows.length,
      limit,
      sampled: total > rows.length,
      requestedFullLoad,
      filters,
      source: 'static-json-sample',
    });
  }

  const filtered = await collectFilteredFlights(filters, nativeFetch, limit);
  const rows = filtered.rows.map((row: any) => projectFlightRow(row));

  return jsonResponse({
    rows,
    fields: getLocalizedFields(language),
    total: filtered.total,
    loaded: rows.length,
    limit,
    sampled: filtered.total > rows.length,
    requestedFullLoad,
    filters,
    source: 'static-json',
  });
}

async function handleApiRequest(url: URL, nativeFetch: typeof fetch): Promise<Response> {
  const pathname = getApiPath(url);
  if (!pathname) return jsonResponse({ error: 'Not an API request' }, { status: 404 });

  if (pathname === '/api/assistant/chat') {
    return jsonResponse(
      {
        code: 'STATIC_BACKEND_REQUIRED',
        error: 'AI assistant requires the Node/Express backend proxy and a server-side API key.',
      },
      { status: 501 },
    );
  }
  if (pathname === '/api/assistant/health') {
    const fallbackModels = ['gpt-5.4-mini', 'gpt-5.2-chat-latest', 'gpt-5.1', 'claude-haiku-4-5', 'grok-4.20-fast'];
    return jsonResponse({
      configured: false,
      backend: false,
      model: 'gpt-5.5',
      fallbackModels,
      modelOptions: ['gpt-5.5', ...fallbackModels],
    });
  }
  if (pathname === '/api/dashboard/summary') return handleDashboardSummary(nativeFetch);
  if (pathname === '/api/module8/summary') return handleModule8Summary(nativeFetch);
  if (pathname === '/api/module8/search' || pathname === '/api/module8/list') return handleModule8Search(url, nativeFetch);
  if (pathname === '/api/module8/export') return handleModule8Export(url, nativeFetch);
  if (pathname === '/api/interactive/analysis') return handleInteractiveAnalysis(url, nativeFetch);
  if (pathname === '/api/eda/rows') return handleEdaRows(url, nativeFetch);

  const optionResponse = await handleModule8Option(pathname, nativeFetch);
  if (optionResponse) return optionResponse;

  const simpleResponse = await handleSimpleEndpoint(pathname, nativeFetch);
  if (simpleResponse) return simpleResponse;

  return jsonResponse({ error: `Static API endpoint not found: ${pathname}` }, { status: 404 });
}

export function installStaticApi(): void {
  if (window.__NEXUS_STATIC_API_INSTALLED__) return;
  window.__NEXUS_STATIC_API_INSTALLED__ = true;

  const nativeFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const rawUrl = input instanceof Request ? input.url : input.toString();
    const url = new URL(rawUrl, window.location.href);

    if (getApiPath(url)) {
      try {
        return await handleApiRequest(url, nativeFetch);
      } catch (error) {
        console.error('[static-api]', error);
        return jsonResponse(
          { error: error instanceof Error ? error.message : 'Static API failed' },
          { status: 500 },
        );
      }
    }

    return nativeFetch(input, init);
  };
}
