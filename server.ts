import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // 数据目录
  const DATA_DIR = path.join(process.cwd(), "data");

  // 辅助函数：读取JSON文件
  function readJsonFile(filePath: string) {
    try {
      const fullPath = path.join(DATA_DIR, filePath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, "utf-8");
        return JSON.parse(content);
      }
      return null;
    } catch (error) {
      console.error(`Error reading ${filePath}:`, error);
      return null;
    }
  }

  // 辅助函数：安全返回JSON
  function safeJsonResponse(res: express.Response, data: any) {
    if (data === null) {
      return res.status(404).json({ error: "数据未找到，请先运行 R 分析脚本" });
    }
    return res.json(data);
  }

  // ==============================================================================
  // 模块1：总览 Dashboard API
  // ==============================================================================

  app.get("/api/module1/summary", (req, res) => {
    const data = readJsonFile("module1/dashboard.json");
    safeJsonResponse(res, data?.summary);
  });

  app.get("/api/module1/hourly-trend", (req, res) => {
    const data = readJsonFile("module1/dashboard.json");
    safeJsonResponse(res, data?.hourlyTrend);
  });

  app.get("/api/module1/top-destinations", (req, res) => {
    const data = readJsonFile("module1/dashboard.json");
    safeJsonResponse(res, data?.topDestinations);
  });

  app.get("/api/module1/delayed-destinations", (req, res) => {
    const data = readJsonFile("module1/dashboard.json");
    safeJsonResponse(res, data?.delayedDestinations);
  });

  app.get("/api/module1/delayed-airlines", (req, res) => {
    const data = readJsonFile("module1/dashboard.json");
    safeJsonResponse(res, data?.delayedAirlines);
  });

  app.get("/api/module1/heatmap", (req, res) => {
    const data = readJsonFile("module1/dashboard.json");
    safeJsonResponse(res, data?.heatmap);
  });

  app.get("/api/module1/ontime-pie", (req, res) => {
    const data = readJsonFile("module1/dashboard.json");
    safeJsonResponse(res, data?.ontimePie);
  });

  app.get("/api/module1/monthly-stats", (req, res) => {
    const data = readJsonFile("module1/dashboard.json");
    safeJsonResponse(res, data?.monthlyStats);
  });

  app.get("/api/module1/origin-stats", (req, res) => {
    const data = readJsonFile("module1/dashboard.json");
    safeJsonResponse(res, data?.originStats);
  });

  // ==============================================================================
  // 模块2：时间规律分析 API
  // ==============================================================================

  app.get("/api/module2/hourly-dep-delay", (req, res) => {
    const data = readJsonFile("module2/time_analysis.json");
    safeJsonResponse(res, data?.hourlyDepDelay);
  });

  app.get("/api/module2/hourly-arr-delay", (req, res) => {
    const data = readJsonFile("module2/time_analysis.json");
    safeJsonResponse(res, data?.hourlyArrDelay);
  });

  app.get("/api/module2/hourly-comparison", (req, res) => {
    const data = readJsonFile("module2/time_analysis.json");
    safeJsonResponse(res, data?.hourlyComparison);
  });

  app.get("/api/module2/monthly-trend", (req, res) => {
    const data = readJsonFile("module2/time_analysis.json");
    safeJsonResponse(res, data?.monthlyTrend);
  });

  app.get("/api/module2/weekday-analysis", (req, res) => {
    const data = readJsonFile("module2/time_analysis.json");
    safeJsonResponse(res, data?.weekdayAnalysis);
  });

  app.get("/api/module2/weekday-hour-heatmap", (req, res) => {
    const data = readJsonFile("module2/time_analysis.json");
    safeJsonResponse(res, data?.weekdayHourHeatmap);
  });

  app.get("/api/module2/period-analysis", (req, res) => {
    const data = readJsonFile("module2/time_analysis.json");
    safeJsonResponse(res, data?.periodAnalysis);
  });

  app.get("/api/module2/conclusions", (req, res) => {
    const data = readJsonFile("module2/time_analysis.json");
    safeJsonResponse(res, data?.conclusions);
  });

  // ==============================================================================
  // 模块3：目的地/航线分析 API
  // ==============================================================================

  app.get("/api/module3/top-destinations-volume", (req, res) => {
    const data = readJsonFile("module3/route_analysis.json");
    safeJsonResponse(res, data?.topDestinationsVolume);
  });

  app.get("/api/module3/top-destinations-delay", (req, res) => {
    const data = readJsonFile("module3/route_analysis.json");
    safeJsonResponse(res, data?.topDestinationsDelay);
  });

  app.get("/api/module3/route-analysis", (req, res) => {
    const data = readJsonFile("module3/route_analysis.json");
    safeJsonResponse(res, data?.routeAnalysis);
  });

  app.get("/api/module3/bubble-data", (req, res) => {
    const data = readJsonFile("module3/route_analysis.json");
    safeJsonResponse(res, data?.bubbleData);
  });

  app.get("/api/module3/origin-dest-heatmap", (req, res) => {
    const data = readJsonFile("module3/route_analysis.json");
    safeJsonResponse(res, data?.originDestHeatmap);
  });

  app.get("/api/module3/jfk-risky-routes", (req, res) => {
    const data = readJsonFile("module3/route_analysis.json");
    safeJsonResponse(res, data?.jfkRiskyRoutes);
  });

  app.get("/api/module3/ewr-risky-routes", (req, res) => {
    const data = readJsonFile("module3/route_analysis.json");
    safeJsonResponse(res, data?.ewrRiskyRoutes);
  });

  app.get("/api/module3/lga-risky-routes", (req, res) => {
    const data = readJsonFile("module3/route_analysis.json");
    safeJsonResponse(res, data?.lgaRiskyRoutes);
  });

  app.get("/api/module3/distance-distribution", (req, res) => {
    const data = readJsonFile("module3/route_analysis.json");
    safeJsonResponse(res, data?.distanceDistribution);
  });

  app.get("/api/module3/dest-geo", (req, res) => {
    const data = readJsonFile("module3/route_analysis.json");
    safeJsonResponse(res, data?.destGeo);
  });

  app.get("/api/module3/origin-geo", (req, res) => {
    const data = readJsonFile("module3/route_analysis.json");
    safeJsonResponse(res, data?.originGeo);
  });

  // ==============================================================================
  // 模块4：空中追回分析 API
  // ==============================================================================

  app.get("/api/module4/recovery-stats", (req, res) => {
    const data = readJsonFile("module4/recovery_analysis.json");
    safeJsonResponse(res, data?.recoveryStats);
  });

  app.get("/api/module4/speed-scatter", (req, res) => {
    const data = readJsonFile("module4/recovery_analysis.json");
    safeJsonResponse(res, data?.speedScatter);
  });

  app.get("/api/module4/recovery-scatter", (req, res) => {
    const data = readJsonFile("module4/recovery_analysis.json");
    safeJsonResponse(res, data?.recoveryScatter);
  });

  app.get("/api/module4/airline-recovery", (req, res) => {
    const data = readJsonFile("module4/recovery_analysis.json");
    safeJsonResponse(res, data?.airlineRecovery);
  });

  app.get("/api/module4/airline-boxplot", (req, res) => {
    const data = readJsonFile("module4/recovery_analysis.json");
    safeJsonResponse(res, data?.airlineBoxplotStats);
  });

  app.get("/api/module4/dest-recovery", (req, res) => {
    const data = readJsonFile("module4/recovery_analysis.json");
    safeJsonResponse(res, data?.destRecovery);
  });

  app.get("/api/module4/distance-recovery", (req, res) => {
    const data = readJsonFile("module4/recovery_analysis.json");
    safeJsonResponse(res, data?.distanceRecovery);
  });

  app.get("/api/module4/speed-recovery-trend", (req, res) => {
    const data = readJsonFile("module4/recovery_analysis.json");
    safeJsonResponse(res, data?.speedRecoveryTrend);
  });

  app.get("/api/module4/recovery-distribution", (req, res) => {
    const data = readJsonFile("module4/recovery_analysis.json");
    safeJsonResponse(res, data?.recoveryDistribution);
  });

  // ==============================================================================
  // 模块5：航司表现分析 API
  // ==============================================================================

  app.get("/api/module5/airline-stats", (req, res) => {
    const data = readJsonFile("module5/airline_analysis.json");
    safeJsonResponse(res, data?.airlineStats);
  });

  app.get("/api/module5/fleet-scatter", (req, res) => {
    const data = readJsonFile("module5/airline_analysis.json");
    safeJsonResponse(res, data?.fleetDelayScatter);
  });

  app.get("/api/module5/ontime-bubble", (req, res) => {
    const data = readJsonFile("module5/airline_analysis.json");
    safeJsonResponse(res, data?.ontimeBubble);
  });

  app.get("/api/module5/delay-ranking", (req, res) => {
    const data = readJsonFile("module5/airline_analysis.json");
    safeJsonResponse(res, data?.airlineDelayRanking);
  });

  app.get("/api/module5/ontime-ranking", (req, res) => {
    const data = readJsonFile("module5/airline_analysis.json");
    safeJsonResponse(res, data?.airlineOntimeRanking);
  });

  app.get("/api/module5/quadrant-data", (req, res) => {
    const data = readJsonFile("module5/airline_analysis.json");
    safeJsonResponse(res, data?.quadrantData);
  });

  app.get("/api/module5/quadrant-summary", (req, res) => {
    const data = readJsonFile("module5/airline_analysis.json");
    safeJsonResponse(res, data?.quadrantSummary);
  });

  app.get("/api/module5/airline-monthly", (req, res) => {
    const data = readJsonFile("module5/airline_analysis.json");
    safeJsonResponse(res, data?.airlineMonthly);
  });

  app.get("/api/module5/airline-comparison", (req, res) => {
    const data = readJsonFile("module5/airline_analysis.json");
    safeJsonResponse(res, data?.airlineComparison);
  });

  // ==============================================================================
  // 模块6：同机延误传导分析 API
  // ==============================================================================

  app.get("/api/module6/propagation-stats", (req, res) => {
    const data = readJsonFile("module6/propagation_analysis.json");
    safeJsonResponse(res, data?.propagationStats);
  });

  app.get("/api/module6/sequence-delay", (req, res) => {
    const data = readJsonFile("module6/propagation_analysis.json");
    safeJsonResponse(res, data?.sequenceDelay);
  });

  app.get("/api/module6/propagation-scatter", (req, res) => {
    const data = readJsonFile("module6/propagation_analysis.json");
    safeJsonResponse(res, data?.propagationScatter);
  });

  app.get("/api/module6/sankey-nodes", (req, res) => {
    const data = readJsonFile("module6/propagation_analysis.json");
    safeJsonResponse(res, data?.sankeyNodes);
  });

  app.get("/api/module6/sankey-links", (req, res) => {
    const data = readJsonFile("module6/propagation_analysis.json");
    safeJsonResponse(res, data?.sankeyLinks);
  });

  app.get("/api/module6/case-example", (req, res) => {
    const data = readJsonFile("module6/propagation_analysis.json");
    safeJsonResponse(res, data?.caseExample);
  });

  app.get("/api/module6/sequence-propagation", (req, res) => {
    const data = readJsonFile("module6/propagation_analysis.json");
    safeJsonResponse(res, data?.sequencePropagation);
  });

  // ==============================================================================
  // 模块7：延误归因分析 API
  // ==============================================================================

  app.get("/api/module7/age-analysis", (req, res) => {
    const data = readJsonFile("module7/attribution_analysis.json");
    safeJsonResponse(res, data?.ageAnalysis);
  });

  app.get("/api/module7/weather-analysis", (req, res) => {
    const data = readJsonFile("module7/attribution_analysis.json");
    safeJsonResponse(res, data?.weatherAnalysis);
  });

  app.get("/api/module7/correlation-matrix", (req, res) => {
    const data = readJsonFile("module7/attribution_analysis.json");
    safeJsonResponse(res, data?.correlationMatrix);
  });

  app.get("/api/module7/interaction-analysis", (req, res) => {
    const data = readJsonFile("module7/attribution_analysis.json");
    safeJsonResponse(res, data?.interactionAnalysis);
  });

  app.get("/api/module7/feature-importance", (req, res) => {
    const data = readJsonFile("module7/attribution_analysis.json");
    safeJsonResponse(res, data?.featureImportance);
  });

  app.get("/api/module7/weather-boxplot", (req, res) => {
    const data = readJsonFile("module7/attribution_analysis.json");
    safeJsonResponse(res, data?.weatherBoxplotStats);
  });

  app.get("/api/module7/radar-data", (req, res) => {
    const data = readJsonFile("module7/attribution_analysis.json");
    safeJsonResponse(res, data?.radarData);
  });

  app.get("/api/module7/conclusions", (req, res) => {
    const data = readJsonFile("module7/attribution_analysis.json");
    safeJsonResponse(res, data?.conclusions);
  });

  // ==============================================================================
  // 模块8：数据探索 API
  // ==============================================================================

  app.get("/api/module8/summary", (req, res) => {
    const data = readJsonFile("module8/explorer_data.json");
    safeJsonResponse(res, data?.summaryStats);
  });

  app.get("/api/module8/list", (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 100;

    // 尝试读取分页文件
    const pageData = readJsonFile(`module8/page_${page}.json`);
    if (pageData) {
      return res.json(pageData);
    }

    // 如果分页文件不存在，返回第一页
    const data = readJsonFile("module8/explorer_data.json");
    safeJsonResponse(res, data?.firstPage);
  });

  app.get("/api/module8/airline-options", (req, res) => {
    const data = readJsonFile("module8/explorer_data.json");
    safeJsonResponse(res, data?.airlineOptions);
  });

  app.get("/api/module8/dest-options", (req, res) => {
    const data = readJsonFile("module8/explorer_data.json");
    safeJsonResponse(res, data?.destOptions);
  });

  app.get("/api/module8/origin-options", (req, res) => {
    const data = readJsonFile("module8/explorer_data.json");
    safeJsonResponse(res, data?.originOptions);
  });

  app.get("/api/module8/delay-level-options", (req, res) => {
    const data = readJsonFile("module8/explorer_data.json");
    safeJsonResponse(res, data?.delayLevelOptions);
  });

  app.get("/api/module8/month-options", (req, res) => {
    const data = readJsonFile("module8/explorer_data.json");
    safeJsonResponse(res, data?.monthOptions);
  });

  // ==============================================================================
  // 模块8：数据探索 - 搜索与筛选 API (新增)
  // ==============================================================================

  // 搜索并筛选航班数据
  app.get("/api/module8/search", (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 100;
    const q = (req.query.q as string || '').toLowerCase().trim();
    const airline = req.query.airline as string || '';
    const destination = req.query.destination as string || '';
    const delayLevel = req.query.delayLevel as string || '';

    // 读取所有分页文件进行筛选
    const allFlights: any[] = [];
    
    // 读取主数据文件
    const mainData = readJsonFile("module8/explorer_data.json");
    if (mainData?.allFlights) {
      allFlights.push(...mainData.allFlights);
    }
    
    // 读取所有分页文件
    for (let i = 1; i <= 10; i++) {
      const pageData = readJsonFile(`module8/page_${i}.json`);
      if (pageData && Array.isArray(pageData)) {
        allFlights.push(...pageData);
      }
    }

    // 去重
    const uniqueFlights = allFlights.filter((flight, index, self) =>
      index === self.findIndex(f => f.flightNumber === flight.flightNumber && f.date === flight.date)
    );

    // 筛选
    let filtered = uniqueFlights;
    
    if (q) {
      filtered = filtered.filter((f: any) =>
        (f.flightNumber && f.flightNumber.toLowerCase().includes(q)) ||
        (f.airlineCode && f.airlineCode.toLowerCase().includes(q)) ||
        (f.airlineName && f.airlineName.toLowerCase().includes(q)) ||
        (f.route && f.route.toLowerCase().includes(q))
      );
    }
    
    if (airline) {
      filtered = filtered.filter((f: any) => f.airlineCode === airline);
    }
    
    if (destination) {
      filtered = filtered.filter((f: any) => f.arrivalAirport === destination);
    }
    
    if (delayLevel) {
      filtered = filtered.filter((f: any) => f.delayLevel === delayLevel);
    }

    // 分页
    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedData = filtered.slice(start, end);

    res.json({
      data: paginatedData,
      total: total,
      page: page,
      pageSize: pageSize
    });
  });

  // 导出筛选后的数据（支持多种导出模式）
  app.get("/api/module8/export", (req, res) => {
    const q = (req.query.q as string || '').toLowerCase().trim();
    const airline = req.query.airline as string || '';
    const destination = req.query.destination as string || '';
    const delayLevel = req.query.delayLevel as string || '';
    const exportMode = req.query.exportMode as string || 'all';
    const startPage = parseInt(req.query.startPage as string) || 1;
    const endPage = parseInt(req.query.endPage as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 100;

    // 读取所有分页文件
    const allFlights: any[] = [];
    
    // 读取主数据文件
    const mainData = readJsonFile("module8/explorer_data.json");
    if (mainData?.allFlights) {
      allFlights.push(...mainData.allFlights);
    }
    
    // 读取所有分页文件
    for (let i = 1; i <= 10; i++) {
      const pageData = readJsonFile(`module8/page_${i}.json`);
      if (pageData && Array.isArray(pageData)) {
        allFlights.push(...pageData);
      }
    }

    // 去重
    const uniqueFlights = allFlights.filter((flight, index, self) =>
      index === self.findIndex(f => f.flightNumber === flight.flightNumber && f.date === flight.date)
    );

    // 筛选
    let filtered = uniqueFlights;
    
    if (q) {
      filtered = filtered.filter((f: any) =>
        (f.flightNumber && f.flightNumber.toLowerCase().includes(q)) ||
        (f.airlineCode && f.airlineCode.toLowerCase().includes(q)) ||
        (f.airlineName && f.airlineName.toLowerCase().includes(q)) ||
        (f.route && f.route.toLowerCase().includes(q))
      );
    }
    
    if (airline) {
      filtered = filtered.filter((f: any) => f.airlineCode === airline);
    }
    
    if (destination) {
      filtered = filtered.filter((f: any) => f.arrivalAirport === destination);
    }
    
    if (delayLevel) {
      filtered = filtered.filter((f: any) => f.delayLevel === delayLevel);
    }

    // 根据导出模式处理数据
    let exportData: any[] = [];
    
    if (exportMode === 'all') {
      // 导出所有结果
      exportData = filtered;
    } else {
      // 导出指定页数范围
      const start = (startPage - 1) * pageSize;
      const end = endPage * pageSize;
      exportData = filtered.slice(start, end);
    }

    // 生成 CSV
    if (exportData.length === 0) {
      return res.status(404).json({ error: "没有找到匹配的航班数据" });
    }

    const headers = ['日期', '航司代码', '航司名称', '航班号', '飞机号', '航线', '出发机场', '目的机场',
                     '起飞延误(分钟)', '到达延误(分钟)', '飞行时长(分钟)', '距离(英里)', '速度(mph)', '延误等级'];
    
    const csvRows = [headers.join(',')];
    
    exportData.forEach((f: any) => {
      const row = [
        f.date || '',
        f.airlineCode || '',
        f.airlineName || '',
        f.flightNumber || '',
        f.aircraftId || '',
        f.route || '',
        f.departureAirport || '',
        f.arrivalAirport || '',
        f.departureDelay ?? '',
        f.arrivalDelay ?? '',
        f.flightTime || '',
        f.flightDistance || '',
        f.flightSpeed ? f.flightSpeed.toFixed(2) : '',
        f.delayLevel || ''
      ].map(val => `"${String(val).replace(/"/g, '""')}"`);
      
      csvRows.push(row.join(','));
    });

    const csvContent = '\uFEFF' + csvRows.join('\n');
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="flights_export_${Date.now()}.csv"`);
    res.send(csvContent);
  });

  // ==============================================================================
  // 兼容旧 API（保持向后兼容）
  // ==============================================================================

  app.get("/api/dashboard/summary", (req, res) => {
    const data = readJsonFile("module1/dashboard.json");
    if (data?.summary) {
      res.json({
        totalFlights: data.summary.totalFlights?.toLocaleString(),
        avgDepDelay: data.summary.avgDepDelay,
        avgArrDelay: data.summary.avgArrDelay,
        delayedPercentage: (100 - data.summary.depOnTimeRate).toFixed(1)
      });
    } else {
      res.json({
        totalFlights: "336,776",
        avgDepDelay: "12.6",
        avgArrDelay: "6.9",
        delayedPercentage: "39.1"
      });
    }
  });

  app.get("/api/dashboard/hourly-delay", (req, res) => {
    const data = readJsonFile("module1/dashboard.json");
    if (data?.hourlyTrend) {
      res.json({
        hours: data.hourlyTrend.map((d: any) => String(d.hour).padStart(2, '0')),
        delays: data.hourlyTrend.map((d: any) => d.avgDepDelay)
      });
    } else {
      res.json({
        hours: ["05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23"],
        delays: [1, 2, 4, 6, 8, 10, 12, 15, 18, 22, 25, 28, 30, 32, 35, 33, 25, 15, 8]
      });
    }
  });

  app.get("/api/dashboard/destinations", (req, res) => {
    const data = readJsonFile("module1/dashboard.json");
    if (data?.topDestinations) {
      res.json(data.topDestinations.map((d: any) => ({
        name: d.dest,
        delay: d.avgArrDelay,
        volume: d.flightCount
      })));
    } else {
      res.json([
        { name: "ORD", delay: 24, volume: 17283 },
        { name: "ATL", delay: 22, volume: 17215 },
        { name: "LAX", delay: 18, volume: 16174 },
        { name: "BOS", delay: 16, volume: 15508 },
        { name: "MCO", delay: 15, volume: 14082 }
      ]);
    }
  });

  app.get("/api/dashboard/speed-recovery", (req, res) => {
    const data = readJsonFile("module4/recovery_analysis.json");
    if (data?.speedScatter) {
      res.json(data.speedScatter.map((d: any) => [d.dep_delay, d.arr_delay]));
    } else {
      const mockData = [];
      for (let i = 0; i < 200; i++) {
        const depDelay = Math.random() * 120;
        const arrDelay = depDelay * 0.8 + (Math.random() * 20 - 10);
        mockData.push([depDelay, arrDelay]);
      }
      res.json(mockData);
    }
  });

  app.get("/api/dashboard/airlines", (req, res) => {
    const data = readJsonFile("module5/airline_analysis.json");
    if (data?.airlineStats) {
      res.json(data.airlineStats.map((d: any) => ({
        name: d.carrier,
        delay: d.avgDepDelay,
        size: d.flightCount
      })));
    } else {
      res.json([
        { name: "EV", delay: 20.1, size: 54173 },
        { name: "B6", delay: 13.0, size: 54635 },
        { name: "UA", delay: 12.1, size: 58665 },
        { name: "DL", delay: 9.3, size: 48110 }
      ]);
    }
  });

  app.get("/api/dashboard/attribution", (req, res) => {
    res.json([
      { cause: '飞机晚到', value: 45 },
      { cause: '天气原因', value: 25 },
      { cause: '航司原因', value: 15 },
      { cause: '空管原因', value: 12 },
      { cause: '安全检查', value: 3 }
    ]);
  });

  // ==============================================================================
  // Vite 中间件
  // ==============================================================================

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`服务器运行于 http://localhost:${PORT}`);
    console.log(`数据目录: ${DATA_DIR}`);

    // 检查数据文件是否存在
    if (!fs.existsSync(path.join(DATA_DIR, "module1"))) {
      console.log("\n⚠️  警告: 数据文件不存在！");
      console.log("请先运行 R 分析脚本生成数据:");
      console.log("  cd scripts && Rscript run_all_analyses.R\n");
    }
  });
}

startServer();
