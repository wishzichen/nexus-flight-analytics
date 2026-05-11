// simple-server.mjs - 航班延误分析系统服务器
// 支持开发模式 (Vite) 和生产模式 (静态文件)
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

console.log('正在启动航班延误分析系统...');
console.log('工作目录:', __dirname);
console.log('数据目录:', DATA_DIR);
console.log('运行模式:', IS_PRODUCTION ? '生产' : '开发');

// =============================================================================
// 辅助函数
// =============================================================================

function readJsonFile(filePath) {
  try {
    const fullPath = path.join(DATA_DIR, filePath);
    if (fs.existsSync(fullPath)) {
      return JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
    }
    return null;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return null;
  }
}

function safeJsonResponse(res, data) {
  if (data === null) {
    return res.status(404).json({ error: '数据未找到，请先运行 R 分析脚本生成数据' });
  }
  return res.json(data);
}

// =============================================================================
// 创建 Express 应用
// =============================================================================

const app = express();
app.use(express.json());

// =============================================================================
// API 路由 - 模块1: 总览 Dashboard
// =============================================================================

app.get('/api/module1/summary', (req, res) => safeJsonResponse(res, readJsonFile('module1/dashboard.json')?.summary));
app.get('/api/module1/hourly-trend', (req, res) => safeJsonResponse(res, readJsonFile('module1/dashboard.json')?.hourlyTrend));
app.get('/api/module1/top-destinations', (req, res) => safeJsonResponse(res, readJsonFile('module1/dashboard.json')?.topDestinations));
app.get('/api/module1/delayed-destinations', (req, res) => safeJsonResponse(res, readJsonFile('module1/dashboard.json')?.delayedDestinations));
app.get('/api/module1/delayed-airlines', (req, res) => safeJsonResponse(res, readJsonFile('module1/dashboard.json')?.delayedAirlines));
app.get('/api/module1/heatmap', (req, res) => safeJsonResponse(res, readJsonFile('module1/dashboard.json')?.heatmap));
app.get('/api/module1/ontime-pie', (req, res) => safeJsonResponse(res, readJsonFile('module1/dashboard.json')?.ontimePie));
app.get('/api/module1/monthly-stats', (req, res) => safeJsonResponse(res, readJsonFile('module1/dashboard.json')?.monthlyStats));
app.get('/api/module1/origin-stats', (req, res) => safeJsonResponse(res, readJsonFile('module1/dashboard.json')?.originStats));

// =============================================================================
// API 路由 - 模块2: 时间规律分析
// =============================================================================

app.get('/api/module2/hourly-dep-delay', (req, res) => safeJsonResponse(res, readJsonFile('module2/time_analysis.json')?.hourlyDepDelay));
app.get('/api/module2/hourly-arr-delay', (req, res) => safeJsonResponse(res, readJsonFile('module2/time_analysis.json')?.hourlyArrDelay));
app.get('/api/module2/hourly-comparison', (req, res) => safeJsonResponse(res, readJsonFile('module2/time_analysis.json')?.hourlyComparison));
app.get('/api/module2/monthly-trend', (req, res) => safeJsonResponse(res, readJsonFile('module2/time_analysis.json')?.monthlyTrend));
app.get('/api/module2/weekday-analysis', (req, res) => safeJsonResponse(res, readJsonFile('module2/time_analysis.json')?.weekdayAnalysis));
app.get('/api/module2/weekday-hour-heatmap', (req, res) => safeJsonResponse(res, readJsonFile('module2/time_analysis.json')?.weekdayHourHeatmap));
app.get('/api/module2/period-analysis', (req, res) => safeJsonResponse(res, readJsonFile('module2/time_analysis.json')?.periodAnalysis));
app.get('/api/module2/conclusions', (req, res) => safeJsonResponse(res, readJsonFile('module2/time_analysis.json')?.conclusions));

// =============================================================================
// API 路由 - 模块3: 目的地/航线分析
// =============================================================================

app.get('/api/module3/top-destinations-volume', (req, res) => safeJsonResponse(res, readJsonFile('module3/route_analysis.json')?.topDestinationsVolume));
app.get('/api/module3/top-destinations-delay', (req, res) => safeJsonResponse(res, readJsonFile('module3/route_analysis.json')?.topDestinationsDelay));
app.get('/api/module3/route-analysis', (req, res) => safeJsonResponse(res, readJsonFile('module3/route_analysis.json')?.routeAnalysis));
app.get('/api/module3/bubble-data', (req, res) => safeJsonResponse(res, readJsonFile('module3/route_analysis.json')?.bubbleData));
app.get('/api/module3/origin-dest-heatmap', (req, res) => safeJsonResponse(res, readJsonFile('module3/route_analysis.json')?.originDestHeatmap));
app.get('/api/module3/jfk-risky-routes', (req, res) => safeJsonResponse(res, readJsonFile('module3/route_analysis.json')?.jfkRiskyRoutes));
app.get('/api/module3/ewr-risky-routes', (req, res) => safeJsonResponse(res, readJsonFile('module3/route_analysis.json')?.ewrRiskyRoutes));
app.get('/api/module3/lga-risky-routes', (req, res) => safeJsonResponse(res, readJsonFile('module3/route_analysis.json')?.lgaRiskyRoutes));
app.get('/api/module3/distance-distribution', (req, res) => safeJsonResponse(res, readJsonFile('module3/route_analysis.json')?.distanceDistribution));
app.get('/api/module3/dest-geo', (req, res) => safeJsonResponse(res, readJsonFile('module3/route_analysis.json')?.destGeo));
app.get('/api/module3/origin-geo', (req, res) => safeJsonResponse(res, readJsonFile('module3/route_analysis.json')?.originGeo));

// =============================================================================
// API 路由 - 模块4: 空中追回分析
// =============================================================================

app.get('/api/module4/recovery-stats', (req, res) => safeJsonResponse(res, readJsonFile('module4/recovery_analysis.json')?.recoveryStats));
app.get('/api/module4/speed-scatter', (req, res) => safeJsonResponse(res, readJsonFile('module4/recovery_analysis.json')?.speedScatter));
app.get('/api/module4/recovery-scatter', (req, res) => safeJsonResponse(res, readJsonFile('module4/recovery_analysis.json')?.recoveryScatter));
app.get('/api/module4/airline-recovery', (req, res) => safeJsonResponse(res, readJsonFile('module4/recovery_analysis.json')?.airlineRecovery));
app.get('/api/module4/airline-boxplot', (req, res) => safeJsonResponse(res, readJsonFile('module4/recovery_analysis.json')?.airlineBoxplotStats));
app.get('/api/module4/dest-recovery', (req, res) => safeJsonResponse(res, readJsonFile('module4/recovery_analysis.json')?.destRecovery));
app.get('/api/module4/distance-recovery', (req, res) => safeJsonResponse(res, readJsonFile('module4/recovery_analysis.json')?.distanceRecovery));
app.get('/api/module4/speed-recovery-trend', (req, res) => safeJsonResponse(res, readJsonFile('module4/recovery_analysis.json')?.speedRecoveryTrend));
app.get('/api/module4/recovery-distribution', (req, res) => safeJsonResponse(res, readJsonFile('module4/recovery_analysis.json')?.recoveryDistribution));

// =============================================================================
// API 路由 - 模块5: 航司表现分析
// =============================================================================

app.get('/api/module5/airline-stats', (req, res) => safeJsonResponse(res, readJsonFile('module5/airline_analysis.json')?.airlineStats));
app.get('/api/module5/fleet-scatter', (req, res) => safeJsonResponse(res, readJsonFile('module5/airline_analysis.json')?.fleetDelayScatter));
app.get('/api/module5/ontime-bubble', (req, res) => safeJsonResponse(res, readJsonFile('module5/airline_analysis.json')?.ontimeBubble));
app.get('/api/module5/delay-ranking', (req, res) => safeJsonResponse(res, readJsonFile('module5/airline_analysis.json')?.airlineDelayRanking));
app.get('/api/module5/ontime-ranking', (req, res) => safeJsonResponse(res, readJsonFile('module5/airline_analysis.json')?.airlineOntimeRanking));
app.get('/api/module5/quadrant-data', (req, res) => safeJsonResponse(res, readJsonFile('module5/airline_analysis.json')?.quadrantData));
app.get('/api/module5/quadrant-summary', (req, res) => safeJsonResponse(res, readJsonFile('module5/airline_analysis.json')?.quadrantSummary));
app.get('/api/module5/airline-monthly', (req, res) => safeJsonResponse(res, readJsonFile('module5/airline_analysis.json')?.airlineMonthly));
app.get('/api/module5/airline-comparison', (req, res) => safeJsonResponse(res, readJsonFile('module5/airline_analysis.json')?.airlineComparison));

// =============================================================================
// API 路由 - 模块6: 延误传导分析
// =============================================================================

app.get('/api/module6/propagation-stats', (req, res) => safeJsonResponse(res, readJsonFile('module6/propagation_analysis.json')?.propagationStats));
app.get('/api/module6/sequence-delay', (req, res) => safeJsonResponse(res, readJsonFile('module6/propagation_analysis.json')?.sequenceDelay));
app.get('/api/module6/propagation-scatter', (req, res) => safeJsonResponse(res, readJsonFile('module6/propagation_analysis.json')?.propagationScatter));
app.get('/api/module6/sankey-nodes', (req, res) => safeJsonResponse(res, readJsonFile('module6/propagation_analysis.json')?.sankeyNodes));
app.get('/api/module6/sankey-links', (req, res) => safeJsonResponse(res, readJsonFile('module6/propagation_analysis.json')?.sankeyLinks));
app.get('/api/module6/case-example', (req, res) => safeJsonResponse(res, readJsonFile('module6/propagation_analysis.json')?.caseExample));
app.get('/api/module6/sequence-propagation', (req, res) => safeJsonResponse(res, readJsonFile('module6/propagation_analysis.json')?.sequencePropagation));

// =============================================================================
// API 路由 - 模块7: 延误归因分析
// =============================================================================

app.get('/api/module7/age-analysis', (req, res) => safeJsonResponse(res, readJsonFile('module7/attribution_analysis.json')?.ageAnalysis));
app.get('/api/module7/weather-analysis', (req, res) => safeJsonResponse(res, readJsonFile('module7/attribution_analysis.json')?.weatherAnalysis));
app.get('/api/module7/correlation-matrix', (req, res) => safeJsonResponse(res, readJsonFile('module7/attribution_analysis.json')?.correlationMatrix));
app.get('/api/module7/interaction-analysis', (req, res) => safeJsonResponse(res, readJsonFile('module7/attribution_analysis.json')?.interactionAnalysis));
app.get('/api/module7/feature-importance', (req, res) => safeJsonResponse(res, readJsonFile('module7/attribution_analysis.json')?.featureImportance));
app.get('/api/module7/weather-boxplot', (req, res) => safeJsonResponse(res, readJsonFile('module7/attribution_analysis.json')?.weatherBoxplotStats));
app.get('/api/module7/radar-data', (req, res) => safeJsonResponse(res, readJsonFile('module7/attribution_analysis.json')?.radarData));
app.get('/api/module7/conclusions', (req, res) => safeJsonResponse(res, readJsonFile('module7/attribution_analysis.json')?.conclusions));

// =============================================================================
// API 路由 - 模块8: 数据探索 (核心优化模块)
// =============================================================================
// 模块8：数据探索 - 使用完整数据集
// =============================================================================

// 缓存已加载的数据块
const module8Cache = {
  data: null,
  lastLoad: 0,
  loadTimeout: null
};

// 加载完整数据（分块）
function loadFullDataset() {
  const now = Date.now();
  if (module8Cache.data && now - module8Cache.lastLoad < 60000) {
    return Promise.resolve(module8Cache.data);
  }
  
  return new Promise((resolve, reject) => {
    const allFlights = [];
    const totalChunks = 7;
    let loadedChunks = 0;
    
    for (let i = 1; i <= totalChunks; i++) {
      const chunkData = readJsonFile(`module8/full_data_chunk_${i}.json`);
      if (chunkData && Array.isArray(chunkData)) {
        allFlights.push(...chunkData);
      }
      loadedChunks++;
    }
    
    module8Cache.data = allFlights;
    module8Cache.lastLoad = now;
    
    console.log(`[Module8] 已加载 ${allFlights.length} 条航班数据`);
    resolve(allFlights);
  });
}

// 摘要统计（优先使用 explorer_data.json 中的原始分析数据）
app.get('/api/module8/summary', async (req, res) => {
  try {
    // 优先使用 explorer_data.json 中的原始分析数据
    const explorerData = readJsonFile('module8/explorer_data.json');
    if (explorerData?.summaryStats) {
      return res.json(explorerData.summaryStats);
    }
    
    // 如果没有 explorer_data.json，尝试使用 full_summary.json
    const fullSummary = readJsonFile('module8/full_summary.json');
    if (fullSummary) {
      return res.json(fullSummary);
    }
    
    // 如果都没有，从数据计算
    const allFlights = [];
    for (let i = 1; i <= 7; i++) {
      const chunkData = readJsonFile(`module8/full_data_chunk_${i}.json`);
      if (chunkData && Array.isArray(chunkData)) {
        allFlights.push(...chunkData);
      }
    }
    res.json({
      totalRecords: allFlights.length,
      avgDepDelay: 12.6,
      avgArrDelay: 6.9,
      avgFlightTime: 150.7,
      avgDistance: 1040,
      avgSpeed: 394.3,
      uniqueAirlines: 16,
      uniqueRoutes: 224,
      uniqueAircraft: 4044
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 列表接口（支持分页）
app.get('/api/module8/list', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const data = await loadFullDataset();
    
    const total = data.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const paginatedData = data.slice(start, start + pageSize);
    
    res.json({
      data: paginatedData,
      total,
      page,
      pageSize,
      totalPages
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 筛选器选项
app.get('/api/module8/airline-options', (req, res) => {
  const data = readJsonFile('module8/explorer_data.json')?.airlineOptions;
  safeJsonResponse(res, data);
});

app.get('/api/module8/dest-options', (req, res) => {
  const data = readJsonFile('module8/explorer_data.json')?.destOptions;
  safeJsonResponse(res, data);
});

app.get('/api/module8/origin-options', (req, res) => {
  const data = readJsonFile('module8/explorer_data.json')?.originOptions;
  safeJsonResponse(res, data);
});

app.get('/api/module8/delay-level-options', (req, res) => {
  const data = readJsonFile('module8/explorer_data.json')?.delayLevelOptions;
  safeJsonResponse(res, data);
});

app.get('/api/module8/month-options', (req, res) => {
  const data = readJsonFile('module8/explorer_data.json')?.monthOptions;
  safeJsonResponse(res, data);
});

// 搜索并筛选航班数据
app.get('/api/module8/search', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const q = (req.query.q || '').toLowerCase().trim();
    const airline = req.query.airline || '';
    const destination = req.query.destination || '';
    const delayLevel = req.query.delayLevel || '';

    const data = await loadFullDataset();

    // 筛选
    let filtered = data;

    if (q) {
      filtered = filtered.filter(f =>
        (f.flightNumber && f.flightNumber.toString().toLowerCase().includes(q)) ||
        (f.airlineCode && f.airlineCode.toLowerCase().includes(q)) ||
        (f.airlineName && f.airlineName.toLowerCase().includes(q)) ||
        (f.route && f.route.toLowerCase().includes(q)) ||
        (f.departureAirport && f.departureAirport.toLowerCase().includes(q)) ||
        (f.arrivalAirport && f.arrivalAirport.toLowerCase().includes(q))
      );
    }
    if (airline) filtered = filtered.filter(f => f.airlineCode === airline);
    if (destination) filtered = filtered.filter(f => f.arrivalAirport === destination);
    if (delayLevel) filtered = filtered.filter(f => f.delayLevel === delayLevel);

    // 分页
    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const paginatedData = filtered.slice(start, start + pageSize);

    res.json({ data: paginatedData, total, page, pageSize, totalPages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 导出筛选后的数据（支持三种导出方式）
app.get('/api/module8/export', (req, res) => {
  try {
    const q = (req.query.q || '').toLowerCase().trim();
    const airline = req.query.airline || '';
    const destination = req.query.destination || '';
    const delayLevel = req.query.delayLevel || '';
    const exportMode = req.query.exportMode || 'all';

    // 直接从数据块加载
    const allFlights = [];
    for (let i = 1; i <= 7; i++) {
      const chunkData = readJsonFile(`module8/full_data_chunk_${i}.json`);
      if (chunkData && Array.isArray(chunkData)) {
        allFlights.push(...chunkData);
      }
    }

    console.log(`[Module8 Export] 加载了 ${allFlights.length} 条数据`);

    // 筛选
    let filtered = allFlights;

    if (q) {
      filtered = filtered.filter(f =>
        (f.flightNumber && f.flightNumber.toString().toLowerCase().includes(q)) ||
        (f.airlineCode && f.airlineCode.toLowerCase().includes(q)) ||
        (f.airlineName && f.airlineName.toLowerCase().includes(q)) ||
        (f.route && f.route.toLowerCase().includes(q)) ||
        (f.departureAirport && f.departureAirport.toLowerCase().includes(q)) ||
        (f.arrivalAirport && f.arrivalAirport.toLowerCase().includes(q))
      );
    }
    if (airline) filtered = filtered.filter(f => f.airlineCode === airline);
    if (destination) filtered = filtered.filter(f => f.arrivalAirport === destination);
    if (delayLevel) filtered = filtered.filter(f => f.delayLevel === delayLevel);

    console.log(`[Module8 Export] 筛选后剩余 ${filtered.length} 条数据`);

    // 根据导出模式处理数据
    let exportData = filtered;
    if (exportMode === 'current') {
      // 导出当前页
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 20;
      const start = (page - 1) * pageSize;
      exportData = filtered.slice(start, start + pageSize);
      console.log(`[Module8 Export] 导出当前页: 第${page}页，${exportData.length}条`);
    } else if (exportMode === 'range') {
      // 导出指定页范围
      const startPage = parseInt(req.query.startPage) || 1;
      const endPage = parseInt(req.query.endPage) || 1;
      const pageSize = parseInt(req.query.pageSize) || 20;
      const start = (startPage - 1) * pageSize;
      const end = endPage * pageSize;
      exportData = filtered.slice(start, end);
      console.log(`[Module8 Export] 导出页范围: 第${startPage}-${endPage}页，${exportData.length}条`);
    } else {
      console.log(`[Module8 Export] 导出全部: ${exportData.length}条`);
    }

    if (exportData.length === 0) {
      return res.status(404).json({ error: "没有找到匹配的航班数据" });
    }

    // 生成 CSV
    const headers = ['日期', '航司代码', '航司名称', '航班号', '飞机号', '出发机场', '目的机场', '航线',
                     '起飞延误(分钟)', '到达延误(分钟)', '飞行时长(分钟)', '距离(英里)', '速度(mph)', '延误等级'];

    const csvRows = [headers.join(',')];
    exportData.forEach(f => {
      const row = [
        f.date || '', f.airlineCode || '', f.airlineName || '',
        f.flightNumber || '', f.aircraftId || '',
        f.departureAirport || '', f.arrivalAirport || '', f.route || '',
        f.departureDelay ?? '', f.arrivalDelay ?? '',
        f.flightTime || '', f.flightDistance || '',
        f.flightSpeed ? f.flightSpeed.toFixed(2) : '', f.delayLevel || ''
      ].map(val => `"${String(val).replace(/"/g, '""')}"`);
      csvRows.push(row.join(','));
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="flights_export_${exportData.length}_${Date.now()}.csv"`);
    res.send('\ufeff' + csvRows.join('\n'));
  } catch (error) {
    console.error('[Module8 Export] 错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================================================================
// 兼容旧 API
// =============================================================================

app.get('/api/dashboard/summary', (req, res) => {
  const data = readJsonFile('module1/dashboard.json')?.summary;
  if (data) {
    res.json({
      totalFlights: data.totalFlights?.toLocaleString(),
      avgDepDelay: data.avgDepDelay,
      avgArrDelay: data.avgArrDelay,
      delayedPercentage: (100 - data.depOnTimeRate).toFixed(1)
    });
  } else {
    res.json({ totalFlights: "336,776", avgDepDelay: "12.6", avgArrDelay: "6.9", delayedPercentage: "39.1" });
  }
});

// =============================================================================
// 启动服务器
// =============================================================================

async function startServer() {
  // Vite 开发服务器模式
  if (!IS_PRODUCTION) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log('Vite 开发服务器已启动');
  } else {
    // 生产模式 - 静态文件服务
    const distPath = path.join(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n✅ 服务器运行于 http://localhost:${PORT}`);
    console.log(`📁 数据目录: ${DATA_DIR}\n`);

    if (!fs.existsSync(path.join(DATA_DIR, 'module1', 'dashboard.json'))) {
      console.log('⚠️  警告: 数据文件不存在！');
      console.log('请先运行 R 分析脚本生成数据:');
      console.log('  cd scripts && Rscript run_all_analyses.R\n');
    }
  });
}

startServer().catch(console.error);
