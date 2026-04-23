# ==============================================================================
# 模块1：总览 Dashboard 分析
# ==============================================================================

library(jsonlite)
library(dplyr)
library(lubridate)

# 自动检测工作目录
args <- commandArgs(trailingOnly = FALSE)
file_arg <- grep("^--file=", args, value = TRUE)
if (length(file_arg) > 0) {
  script_path <- sub("^--file=", "", file_arg)
  setwd(dirname(dirname(script_path)))
} else {
  if (file.exists("data/flights_enriched.rds")) {
    # 已经在项目根目录
  } else if (file.exists("../data/flights_enriched.rds")) {
    setwd("..")
  }
}

cat("正在执行模块1分析：总览 Dashboard...\n")

# 加载数据
flights <- readRDS("data/flights_enriched.rds")

# 创建输出目录
dir.create("data/module1", showWarnings = FALSE, recursive = TRUE)

# ==============================================================================
# 1. KPI 汇总指标
# ==============================================================================

summary_stats <- flights %>%
  summarise(
    totalFlights = n(),
    avgDepDelay = round(mean(dep_delay, na.rm = TRUE), 1),
    avgArrDelay = round(mean(arr_delay, na.rm = TRUE), 1),
    medianDepDelay = round(median(dep_delay, na.rm = TRUE), 1),
    medianArrDelay = round(median(arr_delay, na.rm = TRUE), 1),
    # 准点率（延误<=15分钟视为准点）
    depOnTimeRate = round(mean(dep_delay <= 15, na.rm = TRUE) * 100, 1),
    arrOnTimeRate = round(mean(arr_delay <= 15, na.rm = TRUE) * 100, 1),
    # 重度延误比例（延误>60分钟）
    severeDelayRate = round(mean(dep_delay > 60, na.rm = TRUE) * 100, 1),
    # 极端延误比例（延误>120分钟）
    extremeDelayRate = round(mean(dep_delay > 120, na.rm = TRUE) * 100, 1),
    # 平均飞行时长
    avgAirTime = round(mean(air_time, na.rm = TRUE), 1),
    # 平均飞行距离
    avgDistance = round(mean(distance, na.rm = TRUE), 1),
    # 平均飞行速度
    avgSpeed = round(mean(speed_mph, na.rm = TRUE), 1)
  ) %>%
  as.list()

cat(sprintf("  总航班数: %s\n", format(summary_stats$totalFlights, big.mark = ",")))
cat(sprintf("  平均起飞延误: %.1f 分钟\n", summary_stats$avgDepDelay))
cat(sprintf("  起飞准点率: %.1f%%\n", summary_stats$depOnTimeRate))

# ==============================================================================
# 2. 全天延误趋势（按小时）
# ==============================================================================

hourly_trend <- flights %>%
  filter(!is.na(dep_delay), hour >= 5, hour <= 23) %>%
  group_by(hour) %>%
  summarise(
    flightCount = n(),
    avgDepDelay = round(mean(dep_delay, na.rm = TRUE), 1),
    avgArrDelay = round(mean(arr_delay, na.rm = TRUE), 1),
    maxDepDelay = round(max(dep_delay, na.rm = TRUE), 0),
    severeDelayCount = sum(dep_delay > 60, na.rm = TRUE),
    severeDelayRate = round(mean(dep_delay > 60, na.rm = TRUE) * 100, 1)
  ) %>%
  arrange(hour)

# ==============================================================================
# 3. 最繁忙目的地 Top 10
# ==============================================================================

top_destinations <- flights %>%
  group_by(dest, dest_name) %>%
  summarise(
    flightCount = n(),
    avgArrDelay = round(mean(arr_delay, na.rm = TRUE), 1),
    avgDepDelay = round(mean(dep_delay, na.rm = TRUE), 1),
    onTimeRate = round(mean(arr_delay <= 15, na.rm = TRUE) * 100, 1),
    avgDistance = round(mean(distance, na.rm = TRUE), 0)
  ) %>%
  arrange(desc(flightCount)) %>%
  head(10) %>%
  mutate(rank = row_number())

# ==============================================================================
# 4. 最易延误目的地 Top 10
# ==============================================================================

delayed_destinations <- flights %>%
  group_by(dest, dest_name) %>%
  summarise(
    flightCount = n(),
    avgArrDelay = round(mean(arr_delay, na.rm = TRUE), 1),
    avgDepDelay = round(mean(dep_delay, na.rm = TRUE), 1),
    severeDelayRate = round(mean(dep_delay > 60, na.rm = TRUE) * 100, 1)
  ) %>%
  filter(flightCount >= 100) %>%  # 至少100个航班
  arrange(desc(avgDepDelay)) %>%
  head(10) %>%
  mutate(rank = row_number())

# ==============================================================================
# 5. 最易延误航司 Top 10
# ==============================================================================

delayed_airlines <- flights %>%
  group_by(carrier, carrier_name) %>%
  summarise(
    flightCount = n(),
    avgDepDelay = round(mean(dep_delay, na.rm = TRUE), 1),
    avgArrDelay = round(mean(arr_delay, na.rm = TRUE), 1),
    onTimeRate = round(mean(dep_delay <= 15, na.rm = TRUE) * 100, 1),
    severeDelayRate = round(mean(dep_delay > 60, na.rm = TRUE) * 100, 1)
  ) %>%
  filter(flightCount >= 100) %>%
  arrange(desc(avgDepDelay)) %>%
  head(10) %>%
  mutate(rank = row_number())

# ==============================================================================
# 6. 小时 × 星期 热力图
# ==============================================================================

heatmap_data <- flights %>%
  filter(!is.na(dep_delay), hour >= 5, hour <= 23) %>%
  group_by(hour, weekday) %>%
  summarise(
    avgDelay = round(mean(dep_delay, na.rm = TRUE), 1),
    flightCount = n()
  ) %>%
  mutate(
    weekdayName = case_when(
      weekday == 1 ~ "周一",
      weekday == 2 ~ "周二",
      weekday == 3 ~ "周三",
      weekday == 4 ~ "周四",
      weekday == 5 ~ "周五",
      weekday == 6 ~ "周六",
      weekday == 7 ~ "周日"
    )
  ) %>%
  arrange(weekday, hour)

# ==============================================================================
# 7. 准点率环形图数据
# ==============================================================================

ontime_pie <- flights %>%
  filter(!is.na(dep_delay)) %>%
  mutate(
    category = case_when(
      dep_delay <= 0 ~ "提前/准点",
      dep_delay > 0 & dep_delay <= 15 ~ "轻微延误",
      dep_delay > 15 & dep_delay <= 30 ~ "中度延误",
      dep_delay > 30 & dep_delay <= 60 ~ "严重延误",
      dep_delay > 60 ~ "极端延误"
    )
  ) %>%
  group_by(category) %>%
  summarise(count = n()) %>%
  mutate(percentage = round(count / sum(count) * 100, 1)) %>%
  arrange(match(category, c("提前/准点", "轻微延误", "中度延误", "严重延误", "极端延误")))

# ==============================================================================
# 8. 最易延误时段
# ==============================================================================

worst_hours <- hourly_trend %>%
  arrange(desc(avgDepDelay)) %>%
  head(5) %>%
  mutate(hourLabel = paste0(hour, ":00"))

# ==============================================================================
# 9. 月份统计
# ==============================================================================

monthly_stats <- flights %>%
  group_by(month) %>%
  summarise(
    flightCount = n(),
    avgDepDelay = round(mean(dep_delay, na.rm = TRUE), 1),
    avgArrDelay = round(mean(arr_delay, na.rm = TRUE), 1),
    onTimeRate = round(mean(dep_delay <= 15, na.rm = TRUE) * 100, 1)
  ) %>%
  mutate(
    monthName = case_when(
      month == 1 ~ "1月",
      month == 2 ~ "2月",
      month == 3 ~ "3月",
      month == 4 ~ "4月",
      month == 5 ~ "5月",
      month == 6 ~ "6月",
      month == 7 ~ "7月",
      month == 8 ~ "8月",
      month == 9 ~ "9月",
      month == 10 ~ "10月",
      month == 11 ~ "11月",
      month == 12 ~ "12月"
    )
  ) %>%
  arrange(month)

# ==============================================================================
# 10. 出发机场统计
# ==============================================================================

origin_stats <- flights %>%
  group_by(origin, origin_name) %>%
  summarise(
    flightCount = n(),
    avgDepDelay = round(mean(dep_delay, na.rm = TRUE), 1),
    avgArrDelay = round(mean(arr_delay, na.rm = TRUE), 1),
    onTimeRate = round(mean(dep_delay <= 15, na.rm = TRUE) * 100, 1)
  )

# ==============================================================================
# 保存结果
# ==============================================================================

result <- list(
  summary = summary_stats,
  hourlyTrend = hourly_trend %>% collect(),
  topDestinations = top_destinations %>% collect(),
  delayedDestinations = delayed_destinations %>% collect(),
  delayedAirlines = delayed_airlines %>% collect(),
  heatmap = heatmap_data %>% collect(),
  ontimePie = ontime_pie %>% collect(),
  worstHours = worst_hours %>% collect(),
  monthlyStats = monthly_stats %>% collect(),
  originStats = origin_stats %>% collect()
)

write_json(result, "data/module1/dashboard.json", auto_unbox = TRUE, pretty = TRUE)

cat("模块1分析完成！结果已保存到 data/module1/dashboard.json\n")
