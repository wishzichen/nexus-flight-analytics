// simple-server.mjs - 简化的启动脚本，避免中文路径问题
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// 数据目录
const DATA_DIR = path.join(__dirname, 'data');

console.log('正在启动航班延误分析系统...');
console.log('工作目录:', __dirname);
console.log('数据目录:', DATA_DIR);

// 辅助函数：读取JSON文件
function readJsonFile(filePath) {
  try {
    const fullPath = path.join(DATA_DIR, filePath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      return JSON.parse(content);
    }
    return null;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return null;
  }
}

// 辅助函数：安全返回JSON
function safeJsonResponse(res, data) {
  if (data === null) {
    return res.status(404).json({ error: '数据未找到，请先运行 R 分析脚本生成数据' });
  }
  return res.json(data);
}

// =============================================================================
// 模块1：总览 Dashboard API
// =============================================================================

app.get('/api/module1/summary', (req, res) => {
  const data = readJsonFile('module1/dashboard.json');
  safeJsonResponse(res, data?.summary);
});

app.get('/api/module1/hourly-trend', (req, res) => {
  const data = readJsonFile('module1/dashboard.json');
  safeJsonResponse(res, data?.hourlyTrend);
});

app.get('/api/module1/top-destinations', (req, res) => {
  const data = readJsonFile('module1/dashboard.json');
  safeJsonResponse(res, data?.topDestinations);
});

app.get('/api/module1/delayed-destinations', (req, res) => {
  const data = readJsonFile('module1/dashboard.json');
  safeJsonResponse(res, data?.delayedDestinations);
});

app.get('/api/module1/delayed-airlines', (req, res) => {
  const data = readJsonFile('module1/dashboard.json');
  safeJsonResponse(res, data?.delayedAirlines);
});

app.get('/api/module1/heatmap', (req, res) => {
  const data = readJsonFile('module1/dashboard.json');
  safeJsonResponse(res, data?.heatmap);
});

app.get('/api/module1/ontime-pie', (req, res) => {
  const data = readJsonFile('module1/dashboard.json');
  safeJsonResponse(res, data?.ontimePie);
});

app.get('/api/module1/monthly-stats', (req, res) => {
  const data = readJsonFile('module1/dashboard.json');
  safeJsonResponse(res, data?.monthlyStats);
});

app.get('/api/module1/origin-stats', (req, res) => {
  const data = readJsonFile('module1/dashboard.json');
  safeJsonResponse(res, data?.originStats);
});

// =============================================================================
// 模块2：时间规律分析 API
// =============================================================================

app.get('/api/module2/hourly-dep-delay', (req, res) => {
  const data = readJsonFile('module2/time_analysis.json');
  safeJsonResponse(res, data?.hourlyDepDelay);
});

app.get('/api/module2/hourly-arr-delay', (req, res) => {
  const data = readJsonFile('module2/time_analysis.json');
  safeJsonResponse(res, data?.hourlyArrDelay);
});

app.get('/api/module2/hourly-comparison', (req, res) => {
  const data = readJsonFile('module2/time_analysis.json');
  safeJsonResponse(res, data?.hourlyComparison);
});

app.get('/api/module2/monthly-trend', (req, res) => {
  const data = readJsonFile('module2/time_analysis.json');
  safeJsonResponse(res, data?.monthlyTrend);
});

app.get('/api/module2/weekday-analysis', (req, res) => {
  const data = readJsonFile('module2/time_analysis.json');
  safeJsonResponse(res, data?.weekdayAnalysis);
});

app.get('/api/module2/weekday-hour-heatmap', (req, res) => {
  const data = readJsonFile('module2/time_analysis.json');
  safeJsonResponse(res, data?.weekdayHourHeatmap);
});

app.get('/api/module2/period-analysis', (req, res) => {
  const data = readJsonFile('module2/time_analysis.json');
  safeJsonResponse(res, data?.periodAnalysis);
});

app.get('/api/module2/conclusions', (req, res) => {
  const data = readJsonFile('module2/time_analysis.json');
  safeJsonResponse(res, data?.conclusions);
});

// =============================================================================
// 模块3：目的地/航线分析 API
// =============================================================================

app.get('/api/module3/top-destinations-volume', (req, res) => {
  const data = readJsonFile('module3/route_analysis.json');
  safeJsonResponse(res, data?.topDestinationsVolume);
});

app.get('/api/module3/top-destinations-delay', (req, res) => {
  const data = readJsonFile('module3/route_analysis.json');
  safeJsonResponse(res, data?.topDestinationsDelay);
});

app.get('/api/module3/route-analysis', (req, res) => {
  const data = readJsonFile('module3/route_analysis.json');
  safeJsonResponse(res, data?.routeAnalysis);
});

app.get('/api/module3/bubble-data', (req, res) => {
  const data = readJsonFile('module3/route_analysis.json');
  safeJsonResponse(res, data?.bubbleData);
});

app.get('/api/module3/origin-dest-heatmap', (req, res) => {
  const data = readJsonFile('module3/route_analysis.json');
  safeJsonResponse(res, data?.originDestHeatmap);
});

app.get('/api/module3/jfk-risky-routes', (req, res) => {
  const data = readJsonFile('module3/route_analysis.json');
  safeJsonResponse(res, data?.jfkRiskyRoutes);
});

app.get('/api/module3/ewr-risky-routes', (req, res) => {
  const data = readJsonFile('module3/route_analysis.json');
  safeJsonResponse(res, data?.ewrRiskyRoutes);
});

app.get('/api/module3/lga-risky-routes', (req, res) => {
  const data = readJsonFile('module3/route_analysis.json');
  safeJsonResponse(res, data?.lgaRiskyRoutes);
});

app.get('/api/module3/distance-distribution', (req, res) => {
  const data = readJsonFile('module3/route_analysis.json');
  safeJsonResponse(res, data?.distanceDistribution);
});

app.get('/api/module3/dest-geo', (req, res) => {
  const data = readJsonFile('module3/route_analysis.json');
  safeJsonResponse(res, data?.destGeo);
});

app.get('/api/module3/origin-geo', (req, res) => {
  const data = readJsonFile('module3/route_analysis.json');
  safeJsonResponse(res, data?.originGeo);
});

// =============================================================================
// 模块4：空中追回分析 API
// =============================================================================

app.get('/api/module4/recovery-stats', (req, res) => {
  const data = readJsonFile('module4/recovery_analysis.json');
  safeJsonResponse(res, data?.recoveryStats);
});

app.get('/api/module4/speed-scatter', (req, res) => {
  const data = readJsonFile('module4/recovery_analysis.json');
  safeJsonResponse(res, data?.speedScatter);
});

app.get('/api/module4/recovery-scatter', (req, res) => {
  const data = readJsonFile('module4/recovery_analysis.json');
  safeJsonResponse(res, data?.recoveryScatter);
});

app.get('/api/module4/airline-recovery', (req, res) => {
  const data = readJsonFile('module4/recovery_analysis.json');
  safeJsonResponse(res, data?.airlineRecovery);
});

app.get('/api/module4/airline-boxplot', (req, res) => {
  const data = readJsonFile('module4/recovery_analysis.json');
  safeJsonResponse(res, data?.airlineBoxplotStats);
});

app.get('/api/module4/dest-recovery', (req, res) => {
  const data = readJsonFile('module4/recovery_analysis.json');
  safeJsonResponse(res, data?.destRecovery);
});

app.get('/api/module4/distance-recovery', (req, res) => {
  const data = readJsonFile('module4/recovery_analysis.json');
  safeJsonResponse(res, data?.distanceRecovery);
});

app.get('/api/module4/speed-recovery-trend', (req, res) => {
  const data = readJsonFile('module4/recovery_analysis.json');
  safeJsonResponse(res, data?.speedRecoveryTrend);
});

app.get('/api/module4/recovery-distribution', (req, res) => {
  const data = readJsonFile('module4/recovery_analysis.json');
  safeJsonResponse(res, data?.recoveryDistribution);
});

// =============================================================================
// 模块5：航司表现分析 API
// =============================================================================

app.get('/api/module5/airline-stats', (req, res) => {
  const data = readJsonFile('module5/airline_analysis.json');
  safeJsonResponse(res, data?.airlineStats);
});

app.get('/api/module5/fleet-scatter', (req, res) => {
  const data = readJsonFile('module5/airline_analysis.json');
  safeJsonResponse(res, data?.fleetDelayScatter);
});

app.get('/api/module5/ontime-bubble', (req, res) => {
  const data = readJsonFile('module5/airline_analysis.json');
  safeJsonResponse(res, data?.ontimeBubble);
});

app.get('/api/module5/delay-ranking', (req, res) => {
  const data = readJsonFile('module5/airline_analysis.json');
  safeJsonResponse(res, data?.airlineDelayRanking);
});

app.get('/api/module5/ontime-ranking', (req, res) => {
  const data = readJsonFile('module5/airline_analysis.json');
  safeJsonResponse(res, data?.airlineOntimeRanking);
});

app.get('/api/module5/quadrant-data', (req, res) => {
  const data = readJsonFile('module5/airline_analysis.json');
  safeJsonResponse(res, data?.quadrantData);
});

app.get('/api/module5/quadrant-summary', (req, res) => {
  const data = readJsonFile('module5/airline_analysis.json');
  safeJsonResponse(res, data?.quadrantSummary);
});

app.get('/api/module5/airline-monthly', (req, res) => {
  const data = readJsonFile('module5/airline_analysis.json');
  safeJsonResponse(res, data?.airlineMonthly);
});

app.get('/api/module5/airline-comparison', (req, res) => {
  const data = readJsonFile('module5/airline_analysis.json');
  safeJsonResponse(res, data?.airlineComparison);
});

// =============================================================================
// 模块6：同机延误传导分析 API
// =============================================================================

app.get('/api/module6/propagation-stats', (req, res) => {
  const data = readJsonFile('module6/propagation_analysis.json');
  safeJsonResponse(res, data?.propagationStats);
});

app.get('/api/module6/sequence-delay', (req, res) => {
  const data = readJsonFile('module6/propagation_analysis.json');
  safeJsonResponse(res, data?.sequenceDelay);
});

app.get('/api/module6/propagation-scatter', (req, res) => {
  const data = readJsonFile('module6/propagation_analysis.json');
  safeJsonResponse(res, data?.propagationScatter);
});

app.get('/api/module6/sankey-nodes', (req, res) => {
  const data = readJsonFile('module6/propagation_analysis.json');
  safeJsonResponse(res, data?.sankeyNodes);
});

app.get('/api/module6/sankey-links', (req, res) => {
  const data = readJsonFile('module6/propagation_analysis.json');
  safeJsonResponse(res, data?.sankeyLinks);
});

app.get('/api/module6/case-example', (req, res) => {
  const data = readJsonFile('module6/propagation_analysis.json');
  safeJsonResponse(res, data?.caseExample);
});

app.get('/api/module6/sequence-propagation', (req, res) => {
  const data = readJsonFile('module6/propagation_analysis.json');
  safeJsonResponse(res, data?.sequencePropagation);
});

// =============================================================================
// 模块7：延误归因分析 API
// =============================================================================

app.get('/api/module7/age-analysis', (req, res) => {
  const data = readJsonFile('module7/attribution_analysis.json');
  safeJsonResponse(res, data?.ageAnalysis);
});

app.get('/api/module7/weather-analysis', (req, res) => {
  const data = readJsonFile('module7/attribution_analysis.json');
  safeJsonResponse(res, data?.weatherAnalysis);
});

app.get('/api/module7/correlation-matrix', (req, res) => {
  const data = readJsonFile('module7/attribution_analysis.json');
  safeJsonResponse(res, data?.correlationMatrix);
});

app.get('/api/module7/interaction-analysis', (req, res) => {
  const data = readJsonFile('module7/attribution_analysis.json');
  safeJsonResponse(res, data?.interactionAnalysis);
});

app.get('/api/module7/feature-importance', (req, res) => {
  const data = readJsonFile('module7/attribution_analysis.json');
  safeJsonResponse(res, data?.featureImportance);
});

app.get('/api/module7/weather-boxplot', (req, res) => {
  const data = readJsonFile('module7/attribution_analysis.json');
  safeJsonResponse(res, data?.weatherBoxplotStats);
});

app.get('/api/module7/radar-data', (req, res) => {
  const data = readJsonFile('module7/attribution_analysis.json');
  safeJsonResponse(res, data?.radarData);
});

app.get('/api/module7/conclusions', (req, res) => {
  const data = readJsonFile('module7/attribution_analysis.json');
  safeJsonResponse(res, data?.conclusions);
});

// =============================================================================
// 模块8：数据探索 API
// =============================================================================

app.get('/api/module8/summary', (req, res) => {
  const data = readJsonFile('module8/explorer_data.json');
  safeJsonResponse(res, data?.summaryStats);
});

app.get('/api/module8/list', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageData = readJsonFile(`module8/page_${page}.json`);
  if (pageData) {
    return res.json(pageData);
  }
  const data = readJsonFile('module8/explorer_data.json');
  safeJsonResponse(res, data?.firstPage);
});

app.get('/api/module8/airline-options', (req, res) => {
  const data = readJsonFile('module8/explorer_data.json');
  safeJsonResponse(res, data?.airlineOptions);
});

app.get('/api/module8/dest-options', (req, res) => {
  const data = readJsonFile('module8/explorer_data.json');
  safeJsonResponse(res, data?.destOptions);
});

app.get('/api/module8/origin-options', (req, res) => {
  const data = readJsonFile('module8/explorer_data.json');
  safeJsonResponse(res, data?.originOptions);
});

app.get('/api/module8/delay-level-options', (req, res) => {
  const data = readJsonFile('module8/explorer_data.json');
  safeJsonResponse(res, data?.delayLevelOptions);
});

app.get('/api/module8/month-options', (req, res) => {
  const data = readJsonFile('module8/explorer_data.json');
  safeJsonResponse(res, data?.monthOptions);
});

// =============================================================================
// 静态文件服务
// =============================================================================

// 检查 dist 目录是否存在
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  // 静态文件服务（放在 API 路由之后，但在通配符路由之前）
  app.use(express.static(distPath));

  // 对于所有未匹配的路由，返回 index.html (SPA)
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  console.log('\n⚠️  dist 目录不存在，请先运行 npm run build:frontend');
  console.log('或者使用 npm run vite 启动开发服务器\n');
}

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ 服务器运行于 http://localhost:${PORT}`);
  console.log(`📁 数据目录: ${DATA_DIR}\n`);

  // 检查数据文件
  if (!fs.existsSync(path.join(DATA_DIR, 'module1', 'dashboard.json'))) {
    console.log('⚠️  警告: 数据文件不存在！');
    console.log('请先运行 R 分析脚本生成数据:');
    console.log('  cd scripts && E:/R-4.5.2/bin/x64/Rscript.exe run_all_analyses.R\n');
  }
});