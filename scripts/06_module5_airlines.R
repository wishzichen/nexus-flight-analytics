# ==============================================================================
# 模块5：航司表现分析
# ==============================================================================

library(jsonlite)
library(dplyr)

# Auto-detect working directory
args <- commandArgs(trailingOnly = FALSE)
file_arg <- grep("^--file=", args, value = TRUE)
if (length(file_arg) > 0) {
  script_path <- sub("^--file=", "", file_arg)
  setwd(dirname(dirname(script_path)))
} else {
  if (file.exists("data/flights_enriched.rds")) {
    # Already in project root
  } else if (file.exists("../data/flights_enriched.rds")) {
    setwd("..")
  }
}

cat("正在执行模块5分析：航司表现...\n")

# 加载数据
flights <- readRDS("data/flights_enriched.rds")

# 创建输出目录
dir.create("data/module5", showWarnings = FALSE, recursive = TRUE)

# ==============================================================================
# 1. 航司基础统计
# ==============================================================================

airline_stats <- flights %>%
  group_by(carrier, carrier_name) %>%
  summarise(
    flightCount = n(),
    planeCount = n_distinct(tailnum, na.rm = TRUE),
    destCount = n_distinct(dest, na.rm = TRUE),
    routeCount = n_distinct(route, na.rm = TRUE),
    avgDepDelay = round(mean(dep_delay, na.rm = TRUE), 1),
    avgArrDelay = round(mean(arr_delay, na.rm = TRUE), 1),
    medianDepDelay = round(median(dep_delay, na.rm = TRUE), 1),
    maxDepDelay = round(max(dep_delay, na.rm = TRUE), 0),
    severeDelayRate = round(mean(dep_delay > 60, na.rm = TRUE) * 100, 1),
    extremeDelayRate = round(mean(dep_delay > 120, na.rm = TRUE) * 100, 1),
    onTimeRate = round(mean(dep_delay <= 15, na.rm = TRUE) * 100, 1),
    avgDistance = round(mean(distance, na.rm = TRUE), 0),
    avgAirTime = round(mean(air_time, na.rm = TRUE), 1)
  ) %>%
  arrange(desc(flightCount))

# ==============================================================================
# 2. 机队规模 vs 平均延误（散点图数据）
# ==============================================================================

fleet_delay_scatter <- airline_stats %>%
  filter(flightCount >= 100) %>%
  select(carrier, carrier_name, planeCount, avgDepDelay, flightCount) %>%
  mutate(
    sizeCategory = case_when(
      planeCount < 50 ~ "小型",
      planeCount < 100 ~ "中型",
      planeCount < 200 ~ "大型",
      TRUE ~ "超大型"
    )
  )

# ==============================================================================
# 3. 准点率气泡图数据
# ==============================================================================

ontime_bubble <- airline_stats %>%
  filter(flightCount >= 100) %>%
  select(carrier, carrier_name, flightCount, onTimeRate, planeCount, avgDepDelay) %>%
  arrange(desc(onTimeRate))

# ==============================================================================
# 4. 航司延误排名柱状图
# ==============================================================================

airline_delay_ranking <- airline_stats %>%
  filter(flightCount >= 100) %>%
  select(carrier, carrier_name, avgDepDelay, avgArrDelay, flightCount) %>%
  arrange(desc(avgDepDelay)) %>%
  mutate(rank = row_number())

# ==============================================================================
# 5. 航司准点率排名
# ==============================================================================

airline_ontime_ranking <- airline_stats %>%
  filter(flightCount >= 100) %>%
  select(carrier, carrier_name, onTimeRate, severeDelayRate, flightCount) %>%
  arrange(desc(onTimeRate)) %>%
  mutate(rank = row_number())

# ==============================================================================
# 6. 象限分析数据
# ==============================================================================

# 以中位数为分界线
median_fleet <- median(airline_stats$planeCount[airline_stats$flightCount >= 100], na.rm = TRUE)
median_ontime <- median(airline_stats$onTimeRate[airline_stats$flightCount >= 100], na.rm = TRUE)

quadrant_data <- airline_stats %>%
  filter(flightCount >= 100) %>%
  mutate(
    quadrant = case_when(
      planeCount >= median_fleet & onTimeRate >= median_ontime ~ "大规模高准点",
      planeCount >= median_fleet & onTimeRate < median_ontime ~ "大规模低准点",
      planeCount < median_fleet & onTimeRate >= median_ontime ~ "小规模高准点",
      TRUE ~ "小规模低准点"
    )
  ) %>%
  select(carrier, carrier_name, planeCount, onTimeRate, flightCount, quadrant)

# 统计各象限航司数量
quadrant_summary <- quadrant_data %>%
  group_by(quadrant) %>%
  summarise(count = n(), avgOnTimeRate = round(mean(onTimeRate), 1))

# ==============================================================================
# 7. 航司月度表现趋势
# ==============================================================================

airline_monthly <- flights %>%
  group_by(carrier, month) %>%
  summarise(
    flightCount = n(),
    avgDepDelay = round(mean(dep_delay, na.rm = TRUE), 1),
    onTimeRate = round(mean(dep_delay <= 15, na.rm = TRUE) * 100, 1)
  ) %>%
  mutate(
    monthName = c("1月", "2月", "3月", "4月", "5月", "6月",
                  "7月", "8月", "9月", "10月", "11月", "12月")[month]
  )

# ==============================================================================
# 8. 航司时段表现
# ==============================================================================

airline_hourly <- flights %>%
  filter(hour >= 5, hour <= 23) %>%
  group_by(carrier, hour) %>%
  summarise(
    flightCount = n(),
    avgDepDelay = round(mean(dep_delay, na.rm = TRUE), 1),
    onTimeRate = round(mean(dep_delay <= 15, na.rm = TRUE) * 100, 1)
  ) %>%
  filter(flightCount >= 10)

# ==============================================================================
# 9. 航司对比表（详细）
# ==============================================================================

airline_comparison <- airline_stats %>%
  filter(flightCount >= 100) %>%
  select(
    carrier, carrier_name, flightCount, planeCount,
    avgDepDelay, avgArrDelay, onTimeRate, severeDelayRate,
    avgDistance, destCount
  ) %>%
  arrange(desc(flightCount))

# ==============================================================================
# 保存结果
# ==============================================================================

result <- list(
  airlineStats = airline_stats %>% collect(),
  fleetDelayScatter = fleet_delay_scatter %>% collect(),
  ontimeBubble = ontime_bubble %>% collect(),
  airlineDelayRanking = airline_delay_ranking %>% collect(),
  airlineOntimeRanking = airline_ontime_ranking %>% collect(),
  quadrantData = quadrant_data %>% collect(),
  quadrantSummary = quadrant_summary %>% collect(),
  airlineMonthly = airline_monthly %>% collect(),
  airlineHourly = airline_hourly %>% collect(),
  airlineComparison = airline_comparison %>% collect()
)

write_json(result, "data/module5/airline_analysis.json", auto_unbox = TRUE, pretty = TRUE)

cat("模块5分析完成！结果已保存到 data/module5/airline_analysis.json\n")
