# ==============================================================================
# 模块2：时间规律分析
# ==============================================================================

library(jsonlite)
library(dplyr)
library(lubridate)

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

cat("正在执行模块2分析：时间规律...\n")

# 加载数据
flights <- readRDS("data/flights_enriched.rds")

# 创建输出目录
dir.create("data/module2", showWarnings = FALSE, recursive = TRUE)

# ==============================================================================
# 1. 24小时起飞延误分析
# ==============================================================================

hourly_dep_delay <- flights %>%
  filter(!is.na(dep_delay), hour >= 5, hour <= 23) %>%
  group_by(hour) %>%
  summarise(
    flightCount = n(),
    avgDelay = round(mean(dep_delay, na.rm = TRUE), 1),
    medianDelay = round(median(dep_delay, na.rm = TRUE), 1),
    maxDelay = round(max(dep_delay, na.rm = TRUE), 0),
    sdDelay = round(sd(dep_delay, na.rm = TRUE), 1),
    severeDelayRate = round(mean(dep_delay > 60, na.rm = TRUE) * 100, 1)
  ) %>%
  arrange(hour)

# ==============================================================================
# 2. 24小时到达延误分析
# ==============================================================================

hourly_arr_delay <- flights %>%
  filter(!is.na(arr_delay), hour >= 5, hour <= 23) %>%
  group_by(hour) %>%
  summarise(
    flightCount = n(),
    avgDelay = round(mean(arr_delay, na.rm = TRUE), 1),
    medianDelay = round(median(arr_delay, na.rm = TRUE), 1),
    maxDelay = round(max(arr_delay, na.rm = TRUE), 0),
    sdDelay = round(sd(arr_delay, na.rm = TRUE), 1)
  ) %>%
  arrange(hour)

# ==============================================================================
# 3. 双折线数据（起飞延误 vs 到达延误）
# ==============================================================================

hourly_comparison <- flights %>%
  filter(!is.na(dep_delay), !is.na(arr_delay), hour >= 5, hour <= 23) %>%
  group_by(hour) %>%
  summarise(
    avgDepDelay = round(mean(dep_delay, na.rm = TRUE), 1),
    avgArrDelay = round(mean(arr_delay, na.rm = TRUE), 1),
    flightCount = n()
  ) %>%
  arrange(hour)

# ==============================================================================
# 4. 月份延误趋势
# ==============================================================================

monthly_trend <- flights %>%
  filter(!is.na(dep_delay)) %>%
  group_by(month) %>%
  summarise(
    flightCount = n(),
    avgDepDelay = round(mean(dep_delay, na.rm = TRUE), 1),
    avgArrDelay = round(mean(arr_delay, na.rm = TRUE), 1),
    maxDepDelay = round(max(dep_delay, na.rm = TRUE), 0),
    severeDelayRate = round(mean(dep_delay > 60, na.rm = TRUE) * 100, 1),
    onTimeRate = round(mean(dep_delay <= 15, na.rm = TRUE) * 100, 1)
  ) %>%
  mutate(
    monthName = c("1月", "2月", "3月", "4月", "5月", "6月",
                  "7月", "8月", "9月", "10月", "11月", "12月")[month]
  ) %>%
  arrange(month)

# ==============================================================================
# 5. 星期延误分析
# ==============================================================================

weekday_analysis <- flights %>%
  filter(!is.na(dep_delay), !is.na(weekday)) %>%
  group_by(weekday) %>%
  summarise(
    flightCount = n(),
    avgDepDelay = round(mean(dep_delay, na.rm = TRUE), 1),
    avgArrDelay = round(mean(arr_delay, na.rm = TRUE), 1),
    severeDelayRate = round(mean(dep_delay > 60, na.rm = TRUE) * 100, 1),
    onTimeRate = round(mean(dep_delay <= 15, na.rm = TRUE) * 100, 1)
  ) %>%
  mutate(
    weekdayName = c("周一", "周二", "周三", "周四", "周五", "周六", "周日")[weekday]
  ) %>%
  arrange(weekday)

# ==============================================================================
# 6. 星期 × 小时 热力图
# ==============================================================================

weekday_hour_heatmap <- flights %>%
  filter(!is.na(dep_delay), hour >= 5, hour <= 23, !is.na(weekday)) %>%
  group_by(weekday, hour) %>%
  summarise(
    avgDelay = round(mean(dep_delay, na.rm = TRUE), 1),
    flightCount = n(),
    severeDelayRate = round(mean(dep_delay > 60, na.rm = TRUE) * 100, 1)
  ) %>%
  mutate(
    weekdayName = c("周一", "周二", "周三", "周四", "周五", "周六", "周日")[weekday]
  ) %>%
  arrange(weekday, hour)

# ==============================================================================
# 7. 时段高延误占比分析
# ==============================================================================

period_analysis <- flights %>%
  filter(!is.na(dep_delay), !is.na(time_period)) %>%
  group_by(time_period) %>%
  summarise(
    flightCount = n(),
    avgDepDelay = round(mean(dep_delay, na.rm = TRUE), 1),
    avgArrDelay = round(mean(arr_delay, na.rm = TRUE), 1),
    severeDelayRate = round(mean(dep_delay > 60, na.rm = TRUE) * 100, 1),
    extremeDelayRate = round(mean(dep_delay > 120, na.rm = TRUE) * 100, 1),
    onTimeRate = round(mean(dep_delay <= 15, na.rm = TRUE) * 100, 1)
  ) %>%
  arrange(desc(avgDepDelay))

# ==============================================================================
# 8. 航班量与延误的关系（按小时）
# ==============================================================================

volume_delay_relation <- hourly_dep_delay %>%
  select(hour, flightCount, avgDelay) %>%
  mutate(
    volumeCategory = case_when(
      flightCount < quantile(flightCount, 0.33) ~ "低峰",
      flightCount < quantile(flightCount, 0.67) ~ "平峰",
      TRUE ~ "高峰"
    )
  )

# ==============================================================================
# 9. 累积延误效应分析
# ==============================================================================

# 分析延误是否随时间累积
cumulative_effect <- flights %>%
  filter(!is.na(dep_delay), hour >= 5, hour <= 23) %>%
  group_by(hour) %>%
  summarise(
    avgDelay = round(mean(dep_delay, na.rm = TRUE), 1),
    delayedFlightCount = sum(dep_delay > 15, na.rm = TRUE)
  ) %>%
  mutate(
    delayIncrease = avgDelay - lag(avgDelay, default = avgDelay[1]),
    cumulativeDelay = cumsum(avgDelay) / row_number()
  ) %>%
  arrange(hour)

# ==============================================================================
# 10. 关键结论
# ==============================================================================

# 判断延误是否在下午/晚间显著增加
morning_avg <- hourly_dep_delay %>%
  filter(hour >= 5, hour < 12) %>%
  summarise(avg = mean(avgDelay)) %>%
  pull(avg)

afternoon_avg <- hourly_dep_delay %>%
  filter(hour >= 12, hour < 18) %>%
  summarise(avg = mean(avgDelay)) %>%
  pull(avg)

evening_avg <- hourly_dep_delay %>%
  filter(hour >= 18, hour <= 23) %>%
  summarise(avg = mean(avgDelay)) %>%
  pull(avg)

# 找出波动最大的月份
max_var_month <- monthly_trend %>%
  filter(avgDepDelay == max(avgDepDelay)) %>%
  pull(monthName)

conclusions <- list(
  morningAvgDelay = round(morning_avg, 1),
  afternoonAvgDelay = round(afternoon_avg, 1),
  eveningAvgDelay = round(evening_avg, 1),
  afternoonIncrease = round(afternoon_avg - morning_avg, 1),
  eveningIncrease = round(evening_avg - morning_avg, 1),
  maxVarMonth = max_var_month,
  worstHour = hourly_dep_delay %>% filter(avgDelay == max(avgDelay)) %>% pull(hour),
  bestHour = hourly_dep_delay %>% filter(avgDelay == min(avgDelay)) %>% pull(hour),
  worstWeekday = weekday_analysis %>% filter(avgDepDelay == max(avgDepDelay)) %>% pull(weekdayName),
  bestWeekday = weekday_analysis %>% filter(avgDepDelay == min(avgDepDelay)) %>% pull(weekdayName)
)

# ==============================================================================
# 保存结果
# ==============================================================================

result <- list(
  hourlyDepDelay = hourly_dep_delay %>% collect(),
  hourlyArrDelay = hourly_arr_delay %>% collect(),
  hourlyComparison = hourly_comparison %>% collect(),
  monthlyTrend = monthly_trend %>% collect(),
  weekdayAnalysis = weekday_analysis %>% collect(),
  weekdayHourHeatmap = weekday_hour_heatmap %>% collect(),
  periodAnalysis = period_analysis %>% collect(),
  volumeDelayRelation = volume_delay_relation %>% collect(),
  cumulativeEffect = cumulative_effect %>% collect(),
  conclusions = conclusions
)

write_json(result, "data/module2/time_analysis.json", auto_unbox = TRUE, pretty = TRUE)

cat("模块2分析完成！结果已保存到 data/module2/time_analysis.json\n")
