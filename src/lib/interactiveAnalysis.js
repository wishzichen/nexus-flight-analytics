const WEEKDAY_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const NONE_FILTER_TOKEN = '__none__';

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === '') return [];
  return String(value).split(',').map((item) => item.trim()).filter(Boolean);
}

function toNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function round(value, digits = 1) {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function average(rows, selector) {
  const values = rows.map(selector).map(toNumber).filter((value) => value !== null);
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function countBy(rows, keyFn) {
  const groups = new Map();
  rows.forEach((row) => {
    const key = keyFn(row);
    if (key === undefined || key === null || key === '') return;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  });
  return groups;
}

function getWeekdayIndex(row) {
  const raw = row.weekday ?? row.weekdayIndex;
  const numeric = toNumber(raw);
  if (numeric && numeric >= 1 && numeric <= 7) return numeric;

  const name = row.weekdayName || row.weekday_name || '';
  if (name.includes('一') || name === 'Monday') return 1;
  if (name.includes('二') || name === 'Tuesday') return 2;
  if (name.includes('三') || name === 'Wednesday') return 3;
  if (name.includes('四') || name === 'Thursday') return 4;
  if (name.includes('五') || name === 'Friday') return 5;
  if (name.includes('六') || name === 'Saturday') return 6;
  if (name.includes('日') || name === 'Sunday') return 7;
  return null;
}

function groupRows(rows, keyFn, mapper) {
  return Array.from(countBy(rows, keyFn).entries()).map(([key, group]) => mapper(key, group));
}

function getRoute(row) {
  return row.route || `${row.departureAirport || row.origin || ''} -> ${row.arrivalAirport || row.dest || ''}`;
}

function matchesAny(value, selected) {
  if (selected.includes(NONE_FILTER_TOKEN)) return false;
  return selected.length === 0 || selected.includes(String(value ?? ''));
}

export function parseInteractiveFilters(source) {
  const get = (key) => typeof source.get === 'function' ? source.get(key) : source[key];
  return {
    years: asArray(get('years')),
    months: asArray(get('months')),
    airlines: asArray(get('airlines')),
    origins: asArray(get('origins')),
    destinations: asArray(get('destinations')),
    delayLevels: asArray(get('delayLevels')),
  };
}

export function filterFlights(rows, filters) {
  const normalizedFilters = {
    years: filters?.years || [],
    months: filters?.months || [],
    airlines: filters?.airlines || [],
    origins: filters?.origins || [],
    destinations: filters?.destinations || [],
    delayLevels: filters?.delayLevels || [],
  };

  return rows.filter((row) => (
    matchesAny(row.year, normalizedFilters.years) &&
    matchesAny(row.month, normalizedFilters.months) &&
    matchesAny(row.airlineCode || row.carrier, normalizedFilters.airlines) &&
    matchesAny(row.departureAirport || row.origin, normalizedFilters.origins) &&
    matchesAny(row.arrivalAirport || row.dest, normalizedFilters.destinations) &&
    matchesAny(row.delayLevel, normalizedFilters.delayLevels)
  ));
}

export function buildInteractiveAnalysis(rows, filters = {}) {
  const normalizedFilters = {
    years: filters.years || [],
    months: filters.months || [],
    airlines: filters.airlines || [],
    origins: filters.origins || [],
    destinations: filters.destinations || [],
    delayLevels: filters.delayLevels || [],
  };
  const filtered = filterFlights(rows, normalizedFilters);
  const depDelay = (row) => row.departureDelay ?? row.dep_delay;
  const arrDelay = (row) => row.arrivalDelay ?? row.arr_delay;
  const onTimeRows = filtered.filter((row) => (toNumber(depDelay(row)) ?? 0) <= 15);
  const severeRows = filtered.filter((row) => (toNumber(depDelay(row)) ?? 0) > 60);
  const uniqueAirlines = new Set(filtered.map((row) => row.airlineCode || row.carrier).filter(Boolean));
  const uniqueRoutes = new Set(filtered.map(getRoute).filter(Boolean));
  const uniqueAircraft = new Set(filtered.map((row) => row.aircraftId || row.tailnum).filter(Boolean));

  const summary = {
    totalFlights: filtered.length,
    avgDepDelay: round(average(filtered, depDelay), 1),
    avgArrDelay: round(average(filtered, arrDelay), 1),
    depOnTimeRate: filtered.length ? round((onTimeRows.length / filtered.length) * 100, 1) : 0,
    arrOnTimeRate: filtered.length ? round((filtered.filter((row) => (toNumber(arrDelay(row)) ?? 0) <= 15).length / filtered.length) * 100, 1) : 0,
    severeDelayRate: filtered.length ? round((severeRows.length / filtered.length) * 100, 1) : 0,
    uniqueAirlines: uniqueAirlines.size,
    uniqueRoutes: uniqueRoutes.size,
    uniqueAircraft: uniqueAircraft.size,
  };

  const hourlyComparison = groupRows(filtered, (row) => toNumber(row.hour), (hour, group) => ({
    hour: Number(hour),
    flightCount: group.length,
    avgDepDelay: round(average(group, depDelay), 1),
    avgArrDelay: round(average(group, arrDelay), 1),
    severeDelayRate: round((group.filter((row) => (toNumber(depDelay(row)) ?? 0) > 60).length / group.length) * 100, 1),
  })).filter((item) => item.hour >= 0 && item.hour <= 23).sort((a, b) => a.hour - b.hour);

  const weekdayHourHeatmap = groupRows(
    filtered,
    (row) => {
      const weekday = getWeekdayIndex(row);
      const hour = toNumber(row.hour);
      return weekday && hour !== null ? `${weekday}|${hour}` : null;
    },
    (key, group) => {
      const [weekday, hour] = String(key).split('|').map(Number);
      return {
        weekday,
        hour,
        avgDelay: round(average(group, depDelay), 1),
        flightCount: group.length,
        severeDelayRate: round((group.filter((row) => (toNumber(depDelay(row)) ?? 0) > 60).length / group.length) * 100, 1),
        weekdayName: WEEKDAY_LABELS[weekday - 1],
      };
    },
  ).sort((a, b) => a.weekday - b.weekday || a.hour - b.hour);

  const topDestinations = groupRows(filtered, (row) => row.arrivalAirport || row.dest, (dest, group) => ({
    dest,
    dest_name: group[0]?.arrivalAirportName || group[0]?.dest_name || dest,
    flightCount: group.length,
    avgArrDelay: round(average(group, arrDelay), 1),
    avgDepDelay: round(average(group, depDelay), 1),
    avgDistance: round(average(group, (row) => row.flightDistance ?? row.distance), 0),
    onTimeRate: round((group.filter((row) => (toNumber(depDelay(row)) ?? 0) <= 15).length / group.length) * 100, 1),
  })).sort((a, b) => b.flightCount - a.flightCount);

  const topDestinationsDelay = [...topDestinations]
    .filter((item) => item.flightCount >= 20)
    .sort((a, b) => b.avgArrDelay - a.avgArrDelay);

  const routeAnalysis = groupRows(filtered, getRoute, (route, group) => ({
    route,
    origin: group[0]?.departureAirport || group[0]?.origin,
    dest: group[0]?.arrivalAirport || group[0]?.dest,
    flightCount: group.length,
    avgDepDelay: round(average(group, depDelay), 1),
    avgArrDelay: round(average(group, arrDelay), 1),
    avgDistance: round(average(group, (row) => row.flightDistance ?? row.distance), 0),
  })).sort((a, b) => b.flightCount - a.flightCount);

  const airlineStats = groupRows(filtered, (row) => row.airlineCode || row.carrier, (carrier, group) => {
    const planes = new Set(group.map((row) => row.aircraftId || row.tailnum).filter(Boolean));
    const routes = new Set(group.map(getRoute).filter(Boolean));
    return {
      carrier,
      carrier_name: group[0]?.airlineName || group[0]?.carrier_name || carrier,
      flightCount: group.length,
      planeCount: planes.size,
      routeCount: routes.size,
      avgDepDelay: round(average(group, depDelay), 1),
      avgArrDelay: round(average(group, arrDelay), 1),
      severeDelayRate: round((group.filter((row) => (toNumber(depDelay(row)) ?? 0) > 60).length / group.length) * 100, 1),
      onTimeRate: round((group.filter((row) => (toNumber(depDelay(row)) ?? 0) <= 15).length / group.length) * 100, 1),
    };
  }).sort((a, b) => b.flightCount - a.flightCount);

  return {
    filtered: true,
    filters: normalizedFilters,
    recordCount: filtered.length,
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
