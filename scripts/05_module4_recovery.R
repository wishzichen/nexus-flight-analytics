# ==============================================================================
# 模块4：空中追回分析
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

cat("正在执行模块4分析：空中追回...\n")

# 加载数据
flights <- readRDS("data/flights_enriched.rds")

# 创建输出目录
dir.create("data/module4", showWarnings = FALSE, recursive = TRUE)

# ==============================================================================
# 筛选高起飞延误航班（dep_delay > 60）
# ==============================================================================

high_delay_flights <- flights %>%
  filter(
    dep_delay > 60,
    !is.na(arr_delay),
    !is.na(air_time),
    air_time > 0
  )

cat(sprintf("  高延误航班数: %d\n", nrow(high_delay_flights)))

# ==============================================================================
# 1. 追回统计汇总
# ==============================================================================

recovery_stats <- high_delay_flights %>%
  summarise(
    totalHighDelayFlights = n(),
    avgDepDelay = round(mean(dep_delay, na.rm = TRUE), 1),
    avgArrDelay = round(mean(arr_delay, na.rm = TRUE), 1),
    avgRecovery = round(mean(recovery_minutes, na.rm = TRUE), 1),
    medianRecovery = round(median(recovery_minutes, na.rm = TRUE), 1),
    recoveryRate = round(mean(recovery_minutes > 0, na.rm = TRUE) * 100, 1),
    fullRecoveryRate = round(mean(arr_delay <= 0, na.rm = TRUE) * 100, 1),
    avgSpeed = round(mean(speed_mph, na.rm = TRUE), 1),
    avgAirTime = round(mean(air_time, na.rm = TRUE), 1)
  ) %>%
  as.list()

# ==============================================================================
# 2. 速度 vs 到达延误 散点数据
# ==============================================================================

speed_scatter <- high_delay_flights %>%
  filter(!is.na(speed_mph), speed_mph > 100, speed_mph < 800) %>%
  select(dep_delay, arr_delay, speed_mph, recovery_minutes, carrier, distance_group) %>%
  sample_n(min(500, n()))  # 采样500个点用于可视化

# ==============================================================================
# 3. 起飞延误 vs 追回时间 散点数据
# ==============================================================================

recovery_scatter <- high_delay_flights %>%
  filter(!is.na(recovery_minutes)) %>%
  select(dep_delay, recovery_minutes, carrier, distance_group, distance) %>%
  sample_n(min(500, n()))

# ==============================================================================
# 4. 不同航司的追回能力
# ==============================================================================

airline_recovery <- high_delay_flights %>%
  group_by(carrier, carrier_name) %>%
  summarise(
    flightCount = n(),
    avgDepDelay = round(mean(dep_delay, na.rm = TRUE), 1),
    avgArrDelay = round(mean(arr_delay, na.rm = TRUE), 1),
    avgRecovery = round(mean(recovery_minutes, na.rm = TRUE), 1),
    recoveryRate = round(mean(recovery_minutes > 0, na.rm = TRUE) * 100, 1),
    avgSpeed = round(mean(speed_mph, na.rm = TRUE), 1)
  ) %>%
  filter(flightCount >= 10) %>%
  arrange(desc(avgRecovery))

# ==============================================================================
# 5. 航司追回时间分布（用于箱线图）
# ==============================================================================

airline_boxplot_data <- high_delay_flights %>%
  group_by(carrier) %>%
  filter(n() >= 20) %>%
  select(carrier, recovery_minutes) %>%
  collect()

# 计算箱线图统计量
airline_boxplot_stats <- high_delay_flights %>%
  group_by(carrier) %>%
  filter(n() >= 20) %>%
  summarise(
    min = round(min(recovery_minutes, na.rm = TRUE), 1),
    q1 = round(quantile(recovery_minutes, 0.25, na.rm = TRUE), 1),
    median = round(median(recovery_minutes, na.rm = TRUE), 1),
    q3 = round(quantile(recovery_minutes, 0.75, na.rm = TRUE), 1),
    max = round(max(recovery_minutes, na.rm = TRUE), 1),
    mean = round(mean(recovery_minutes, na.rm = TRUE), 1),
    count = n()
  ) %>%
  arrange(desc(mean))

# ==============================================================================
# 6. 不同目的地的追回成功率
# ==============================================================================

dest_recovery <- high_delay_flights %>%
  group_by(dest, dest_name) %>%
  summarise(
    flightCount = n(),
    avgDepDelay = round(mean(dep_delay, na.rm = TRUE), 1),
    avgArrDelay = round(mean(arr_delay, na.rm = TRUE), 1),
    avgRecovery = round(mean(recovery_minutes, na.rm = TRUE), 1),
    recoveryRate = round(mean(recovery_minutes > 0, na.rm = TRUE) * 100, 1),
    avgDistance = round(mean(distance, na.rm = TRUE), 0)
  ) %>%
  filter(flightCount >= 20) %>%
  arrange(desc(recoveryRate)) %>%
  head(15)

# ==============================================================================
# 7. 按距离分组的追回分析
# ==============================================================================

distance_recovery <- high_delay_flights %>%
  group_by(distance_group) %>%
  summarise(
    flightCount = n(),
    avgDepDelay = round(mean(dep_delay, na.rm = TRUE), 1),
    avgArrDelay = round(mean(arr_delay, na.rm = TRUE), 1),
    avgRecovery = round(mean(recovery_minutes, na.rm = TRUE), 1),
    recoveryRate = round(mean(recovery_minutes > 0, na.rm = TRUE) * 100, 1),
    avgSpeed = round(mean(speed_mph, na.rm = TRUE), 1),
    avgAirTime = round(mean(air_time, na.rm = TRUE), 1),
    avgDistance = round(mean(distance, na.rm = TRUE), 0)
  ) %>%
  arrange(desc(avgDistance))

# ==============================================================================
# 8. 速度与延误恢复关系（回归趋势）
# ==============================================================================

speed_recovery_trend <- high_delay_flights %>%
  filter(!is.na(speed_mph), speed_mph > 100, speed_mph < 800) %>%
  mutate(speed_bin = cut(speed_mph, breaks = seq(100, 800, 50))) %>%
  group_by(speed_bin) %>%
  summarise(
    avgSpeed = round(mean(speed_mph, na.rm = TRUE), 1),
    avgRecovery = round(mean(recovery_minutes, na.rm = TRUE), 1),
    avgArrDelay = round(mean(arr_delay, na.rm = TRUE), 1),
    count = n()
  ) %>%
  filter(count >= 5) %>%
  arrange(avgSpeed)

# ==============================================================================
# 9. 追回时间分布
# ==============================================================================

recovery_distribution <- high_delay_flights %>%
  mutate(
    recovery_category = case_when(
      recovery_minutes < -30 ~ "严重恶化 (<-30分钟)",
      recovery_minutes >= -30 & recovery_minutes < 0 ~ "轻微恶化 (-30~0分钟)",
      recovery_minutes >= 0 & recovery_minutes < 15 ~ "轻微追回 (0~15分钟)",
      recovery_minutes >= 15 & recovery_minutes < 30 ~ "中度追回 (15~30分钟)",
      recovery_minutes >= 30 ~ "大幅追回 (>30分钟)"
    )
  ) %>%
  group_by(recovery_category) %>%
  summarise(count = n()) %>%
  mutate(percentage = round(count / sum(count) * 100, 1))

# ==============================================================================
# 保存结果
# ==============================================================================

result <- list(
  recoveryStats = recovery_stats,
  speedScatter = speed_scatter %>% collect(),
  recoveryScatter = recovery_scatter %>% collect(),
  airlineRecovery = airline_recovery %>% collect(),
  airlineBoxplotStats = airline_boxplot_stats %>% collect(),
  destRecovery = dest_recovery %>% collect(),
  distanceRecovery = distance_recovery %>% collect(),
  speedRecoveryTrend = speed_recovery_trend %>% collect(),
  recoveryDistribution = recovery_distribution %>% collect()
)

write_json(result, "data/module4/recovery_analysis.json", auto_unbox = TRUE, pretty = TRUE)

cat("模块4分析完成！结果已保存到 data/module4/recovery_analysis.json\n")
