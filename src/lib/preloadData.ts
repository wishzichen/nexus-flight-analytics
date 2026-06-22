export const FILTER_OPTION_ENDPOINTS = {
  years: '/api/module8/year-options',
  airlines: '/api/module8/airline-options',
  destinations: '/api/module8/dest-options',
  origins: '/api/module8/origin-options',
  months: '/api/module8/month-options',
  delayLevels: '/api/module8/delay-level-options',
} as const;

export const DASHBOARD_PRELOAD_URLS = [
  ...Object.values(FILTER_OPTION_ENDPOINTS),
  '/api/interactive/analysis?years=2013',
  '/api/module1/summary',
  '/api/module1/hourly-trend',
  '/api/module1/top-destinations',
  '/api/module1/heatmap',
  '/api/module1/ontime-pie',
  '/api/module1/delayed-airlines',
  '/api/module3/route-analysis',
  '/api/module3/dest-geo',
  '/api/module3/origin-geo',
  '/api/airports-info',
] as const;

export const EXPLORER_EDA_PRELOAD_URLS = [
  '/api/module8/summary',
  '/api/module8/search?page=1&pageSize=20',
  '/api/eda/rows?years=2013&limit=12000&lang=zh',
  '/api/module3/dest-geo',
  '/api/module3/origin-geo',
] as const;

const responseCache = new Map<string, Promise<any>>();
let dashboardPreloadStarted = false;
let explorerEdaPreloadStarted = false;

export function cachedJson<T = any>(url: string): Promise<T> {
  if (!responseCache.has(url)) {
    responseCache.set(
      url,
      fetch(url)
        .then(async (response) => {
          if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
          return response.json();
        })
        .catch((error) => {
          responseCache.delete(url);
          throw error;
        }),
    );
  }
  return responseCache.get(url)!;
}

export function preloadJson(url: string) {
  cachedJson(url).catch((error) => {
    console.warn('[preload]', url, error);
    responseCache.delete(url);
  });
}

export function preloadDashboardData() {
  if (dashboardPreloadStarted) return;
  dashboardPreloadStarted = true;

  DASHBOARD_PRELOAD_URLS.forEach((url, index) => {
    window.setTimeout(() => preloadJson(url), index * 35);
  });

  window.setTimeout(
    () => preloadExplorerAndEdaData(),
    DASHBOARD_PRELOAD_URLS.length * 35 + 250,
  );
}

export function preloadExplorerAndEdaData() {
  if (explorerEdaPreloadStarted) return;
  explorerEdaPreloadStarted = true;

  EXPLORER_EDA_PRELOAD_URLS.forEach((url, index) => {
    window.setTimeout(() => preloadJson(url), index * 45);
  });
}

export function scheduleDashboardPreload() {
  const run = () => preloadDashboardData();
  const idleCallback = window.requestIdleCallback;
  if (typeof idleCallback === 'function') {
    idleCallback(run, { timeout: 1200 });
  } else {
    globalThis.setTimeout(run, 350);
  }
}
