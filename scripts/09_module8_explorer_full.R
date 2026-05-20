# ==============================================================================
# 模块8：数据探索与明细表 (完整数据版)
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

cat("正在执行模块8分析：数据探索（完整数据版）...\n")

# 加载数据
flights <- readRDS("data/flights_enriched.rds")
cat(sprintf("原始数据加载完成: %d 条记录\n", nrow(flights)))

# 创建输出目录
dir.create("data/module8", showWarnings = FALSE, recursive = TRUE)

# ==============================================================================
# 1. 构建明细表数据
# ==============================================================================

detail_table <- flights %>%
  select(
    # 日期信息
    flight_year, month, day,
    # 航班信息
    carrier, carrier_name, flight, tailnum,
    # 机场信息
    origin, origin_name, dest, dest_name, route,
    # 延误信息
    dep_delay, arr_delay, dep_delay_category, arr_delay_category,
    # 飞行信息
    air_time, distance, speed_mph, distance_group,
    # 机龄信息
    plane_age, plane_age_group, manufacturer, model,
    # 天气信息
    weather_condition, wind_speed, visib, precip,
    # 其他
    hour, weekday_name, time_period
  ) %>%
  mutate(
    # 格式化日期
    date = sprintf("%d-%02d-%02d", flight_year, month, day),
    # 格式化延误等级
    delayLevel = case_when(
      is.na(dep_delay) ~ "数据缺失",
      dep_delay <= 0 ~ "准点",
      dep_delay <= 15 ~ "轻微",
      dep_delay <= 60 ~ "中度",
      TRUE ~ "严重"
    )
  ) %>%
  rename(
    year = flight_year,
    airlineCode = carrier,
    airlineName = carrier_name,
    flightNumber = flight,
    aircraftId = tailnum,
    departureAirport = origin,
    departureAirportName = origin_name,
    arrivalAirport = dest,
    arrivalAirportName = dest_name,
    departureDelay = dep_delay,
    arrivalDelay = arr_delay,
    flightTime = air_time,
    flightDistance = distance,
    flightSpeed = speed_mph,
    aircraftAge = plane_age,
    aircraftAgeGroup = plane_age_group,
    aircraftManufacturer = manufacturer,
    aircraftModel = model
  )

cat(sprintf("明细表构建完成: %d 条记录\n", nrow(detail_table)))

# ==============================================================================
# 2. 统计摘要
# ==============================================================================

summary_stats <- detail_table %>%
  summarise(
    totalRecords = n(),
    avgDepDelay = round(mean(departureDelay, na.rm = TRUE), 1),
    avgArrDelay = round(mean(arrivalDelay, na.rm = TRUE), 1),
    avgFlightTime = round(mean(flightTime, na.rm = TRUE), 1),
    avgDistance = round(mean(flightDistance, na.rm = TRUE), 0),
    avgSpeed = round(mean(flightSpeed, na.rm = TRUE), 1),
    avgAircraftAge = round(mean(aircraftAge, na.rm = TRUE), 1),
    uniqueAirlines = n_distinct(airlineCode),
    uniqueRoutes = n_distinct(route),
    uniqueAircraft = n_distinct(aircraftId)
  ) %>%
  as.list()

# ==============================================================================
# 3. 筛选器选项
# ==============================================================================

# 航司列表
airline_options <- detail_table %>%
  group_by(airlineCode, airlineName) %>%
  summarise(count = n(), .groups = 'drop') %>%
  arrange(desc(count))

# 目的地列表
dest_options <- detail_table %>%
  group_by(arrivalAirport, arrivalAirportName) %>%
  summarise(count = n(), .groups = 'drop') %>%
  arrange(desc(count))

# 出发机场列表
origin_options <- detail_table %>%
  group_by(departureAirport, departureAirportName) %>%
  summarise(count = n(), .groups = 'drop') %>%
  arrange(desc(count))

# 延误等级列表
delay_level_options <- detail_table %>%
  group_by(delayLevel) %>%
  summarise(count = n(), .groups = 'drop') %>%
  arrange(desc(count))

# 月份列表
month_options <- detail_table %>%
  group_by(month) %>%
  summarise(count = n(), .groups = 'drop') %>%
  mutate(monthName = c("1月", "2月", "3月", "4月", "5月", "6月",
                       "7月", "8月", "9月", "10月", "11月", "12月")[month]) %>%
  arrange(month)

# 年份列表
year_options <- detail_table %>%
  group_by(year) %>%
  summarise(count = n(), .groups = 'drop') %>%
  mutate(label = as.character(year)) %>%
  arrange(year)

# ==============================================================================
# 4. 按日期排序并收集所有数据
# ==============================================================================

detail_table_sorted <- detail_table %>%
  arrange(year, month, day, hour) %>%
  collect()

# ==============================================================================
# 5. 保存完整数据（分块写入避免内存问题）
# ==============================================================================

cat("正在保存完整数据到 JSON...\n")

# 先保存元数据（筛选选项等）
metadata <- list(
  summaryStats = summary_stats,
  airlineOptions = airline_options,
  destOptions = dest_options,
  originOptions = origin_options,
  delayLevelOptions = delay_level_options,
  monthOptions = month_options,
  yearOptions = year_options,
  totalRecords = nrow(detail_table_sorted),
  chunkSize = 50000,
  chunkCount = ceiling(nrow(detail_table_sorted) / 50000)
)

# 保存元数据
write_json(metadata, "data/module8/explorer_metadata.json", auto_unbox = TRUE, pretty = TRUE)
write_json(metadata, "data/module8/explorer_data.json", auto_unbox = TRUE, pretty = TRUE)
write_json(summary_stats, "data/module8/full_summary.json", auto_unbox = TRUE, pretty = TRUE)
cat("元数据保存完成\n")

# 分块保存完整数据（每块50000条）
chunk_size <- 50000
total_records <- nrow(detail_table_sorted)
num_chunks <- ceiling(total_records / chunk_size)
unlink(list.files("data/module8", pattern = "^full_data_chunk_\\d+\\.json$", full.names = TRUE))

for (i in 1:num_chunks) {
  start_idx <- (i - 1) * chunk_size + 1
  end_idx <- min(i * chunk_size, total_records)
  
  chunk_data <- detail_table_sorted[start_idx:end_idx, ]
  chunk_file <- sprintf("data/module8/full_data_chunk_%d.json", i)
  write_json(chunk_data, chunk_file, auto_unbox = TRUE, matrix = "rowmajor")
  
  cat(sprintf("  块 %d/%d 完成: %d - %d 条\n", i, num_chunks, start_idx, end_idx))
}

# 保存第一页数据用于快速加载
first_page <- detail_table_sorted[1:100, ]
write_json(first_page, "data/module8/first_page.json", auto_unbox = TRUE, pretty = TRUE)
write_json(first_page, "data/module8/full_first_page.json", auto_unbox = TRUE, pretty = TRUE)
cat("第一页数据保存完成\n")

# ==============================================================================
# 6. 保存筛选器选项（单独文件便于后端加载）
# ==============================================================================

write_json(airline_options, "data/module8/airline_options.json", auto_unbox = TRUE, pretty = TRUE)
write_json(dest_options, "data/module8/dest_options.json", auto_unbox = TRUE, pretty = TRUE)
write_json(origin_options, "data/module8/origin_options.json", auto_unbox = TRUE, pretty = TRUE)
write_json(delay_level_options, "data/module8/delay_level_options.json", auto_unbox = TRUE, pretty = TRUE)
write_json(month_options, "data/module8/month_options.json", auto_unbox = TRUE, pretty = TRUE)
write_json(year_options, "data/module8/year_options.json", auto_unbox = TRUE, pretty = TRUE)

cat("筛选器选项保存完成\n")

# ==============================================================================
# 完成
# ==============================================================================

cat("\n========================================\n")
cat("模块8分析完成！\n")
cat(sprintf("  总记录数: %d\n", nrow(detail_table_sorted)))
cat(sprintf("  数据块数: %d\n", num_chunks))
cat(sprintf("  文件位置: data/module8/\n"))
cat("========================================\n")
