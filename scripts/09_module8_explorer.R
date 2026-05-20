# ==============================================================================
# 模块8：数据探索与明细表
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

cat("正在执行模块8分析：数据探索...\n")

# 加载数据
flights <- readRDS("data/flights_enriched.rds")

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

# ==============================================================================
# 2. 分页数据（每页100条，生成前10页示例）
# ==============================================================================

# 按日期排序
detail_table_sorted <- detail_table %>%
  arrange(year, month, day, hour)

# 生成前10页数据
for (page in 1:10) {
  start_idx <- (page - 1) * 100 + 1
  end_idx <- page * 100

  page_data <- detail_table_sorted %>%
    slice(start_idx:end_idx) %>%
    collect()

  write_json(page_data, sprintf("data/module8/page_%d.json", page), auto_unbox = TRUE)
}

# ==============================================================================
# 3. 统计摘要
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
# 4. 筛选器选项
# ==============================================================================

# 航司列表
airline_options <- detail_table %>%
  group_by(airlineCode, airlineName) %>%
  summarise(count = n()) %>%
  arrange(desc(count))

# 目的地列表
dest_options <- detail_table %>%
  group_by(arrivalAirport, arrivalAirportName) %>%
  summarise(count = n()) %>%
  arrange(desc(count))

# 出发机场列表
origin_options <- detail_table %>%
  group_by(departureAirport, departureAirportName) %>%
  summarise(count = n()) %>%
  arrange(desc(count))

# 延误等级列表
delay_level_options <- detail_table %>%
  group_by(delayLevel) %>%
  summarise(count = n()) %>%
  arrange(desc(count))

# 月份列表
month_options <- detail_table %>%
  group_by(month) %>%
  summarise(count = n()) %>%
  mutate(monthName = c("1月", "2月", "3月", "4月", "5月", "6月",
                       "7月", "8月", "9月", "10月", "11月", "12月")[month]) %>%
  arrange(month)

# 年份列表
year_options <- detail_table %>%
  group_by(year) %>%
  summarise(count = n()) %>%
  mutate(label = as.character(year)) %>%
  arrange(year)

# ==============================================================================
# 5. 第一页数据（用于初始加载）
# ==============================================================================

first_page <- detail_table_sorted %>%
  slice(1:100) %>%
  collect()

# ==============================================================================
# 保存结果
# ==============================================================================

result <- list(
  summaryStats = summary_stats,
  firstPage = first_page,
  airlineOptions = airline_options %>% collect(),
  destOptions = dest_options %>% collect(),
  originOptions = origin_options %>% collect(),
  delayLevelOptions = delay_level_options %>% collect(),
  monthOptions = month_options %>% collect(),
  yearOptions = year_options %>% collect(),
  totalPages = ceiling(nrow(detail_table) / 100)
)

write_json(result, "data/module8/explorer_data.json", auto_unbox = TRUE, pretty = TRUE)

cat("模块8分析完成！结果已保存到 data/module8/explorer_data.json\n")
cat(sprintf("  总记录数: %d\n", nrow(detail_table)))
cat(sprintf("  总页数: %d\n", ceiling(nrow(detail_table) / 100)))
