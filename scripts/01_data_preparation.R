# ==============================================================================
# 数据准备脚本 - 加载 nycflights13 数据并进行预处理
# ==============================================================================

# 加载必要的包
library(nycflights13)
library(jsonlite)
library(dplyr)
library(lubridate)
library(tidyr)

# 设置工作目录（脚本所在目录的父目录）
# 自动检测脚本路径
args <- commandArgs(trailingOnly = FALSE)
file_arg <- grep("^--file=", args, value = TRUE)
if (length(file_arg) > 0) {
  script_path <- sub("^--file=", "", file_arg)
  setwd(dirname(dirname(script_path)))
} else {
  # 如果无法检测，使用相对路径
  if (file.exists("scripts/01_data_preparation.R")) {
    # 已经在项目根目录
  } else if (file.exists("01_data_preparation.R")) {
    # 在 scripts 目录下，切换到父目录
    setwd("..")
  }
}

cat("当前工作目录:", getwd(), "\n")

# 创建数据输出目录
dir.create("data", showWarnings = FALSE)

cat("正在加载航班数据...\n")

load_builtin_2013_data <- function() {
  data(flights, package = "nycflights13")
  data(planes, package = "nycflights13")
  data(weather, package = "nycflights13")
  data(airports, package = "nycflights13")
  data(airlines, package = "nycflights13")
  list(
    flights = flights,
    planes = planes,
    weather = weather,
    airports = airports,
    airlines = airlines
  )
}

extract_year_table <- function(year_data, table_name) {
  if (is.data.frame(year_data) && table_name == "flights") {
    return(year_data)
  }
  if (is.list(year_data) && table_name %in% names(year_data)) {
    return(year_data[[table_name]])
  }
  if (is.environment(year_data) && exists(table_name, envir = year_data)) {
    return(get(table_name, envir = year_data))
  }
  NULL
}

load_multi_year_data <- function(raw_dir = "data/raw_multi_year") {
  files <- list.files(raw_dir, pattern = "\\.rds$", full.names = TRUE)
  if (length(files) == 0) return(NULL)

  cat(sprintf("检测到多年份原始数据：%d 个文件\n", length(files)))
  yearly <- lapply(files, readRDS)
  bind_year_tables <- function(table_name) {
    tables <- Filter(Negate(is.null), lapply(yearly, extract_year_table, table_name))
    if (length(tables) == 0) return(NULL)
    bind_rows(tables)
  }

  tables <- list(
    flights = bind_year_tables("flights"),
    planes = bind_year_tables("planes"),
    weather = bind_year_tables("weather"),
    airports = bind_year_tables("airports"),
    airlines = bind_year_tables("airlines")
  )

  if (is.null(tables$flights) || nrow(tables$flights) == 0) {
    warning("多年份文件中没有可用 flights 表，回退到 nycflights13。")
    return(NULL)
  }

  if (!is.null(tables$airports)) tables$airports <- tables$airports %>% distinct()
  if (!is.null(tables$airlines)) tables$airlines <- tables$airlines %>% distinct()

  tables
}

base_data <- load_builtin_2013_data()
extra_data <- load_multi_year_data()

if (is.null(extra_data)) {
  cat("未检测到 data/raw_multi_year/*.rds，回退到 nycflights13 内置 2013 数据。\n")
  loaded_data <- base_data
} else {
  extra_years <- sort(unique(extra_data$flights$year))
  cat("正在合并 nycflights13 2013 基线数据与额外年份：", paste(extra_years, collapse = ", "), "\n")

  base_flights <- base_data$flights
  if (2013 %in% extra_years) {
    base_flights <- base_flights %>% filter(year != 2013)
  }

  loaded_data <- list(
    flights = bind_rows(base_flights, extra_data$flights) %>%
      distinct(year, month, day, carrier, flight, tailnum, origin, dest, sched_dep_time, .keep_all = TRUE),
    planes = bind_rows(base_data$planes, extra_data$planes) %>% distinct(tailnum, .keep_all = TRUE),
    weather = bind_rows(base_data$weather, extra_data$weather) %>% distinct(),
    airports = bind_rows(base_data$airports, extra_data$airports) %>% distinct(faa, .keep_all = TRUE),
    airlines = bind_rows(base_data$airlines, extra_data$airlines) %>% distinct(carrier, .keep_all = TRUE)
  )
}

flights <- loaded_data$flights
planes <- loaded_data$planes
weather <- loaded_data$weather
airports <- loaded_data$airports
airlines <- loaded_data$airlines

cat("数据加载完成！\n")
cat(sprintf("  - flights: %d 条记录\n", nrow(flights)))
cat(sprintf("  - planes: %d 条记录\n", nrow(planes)))
cat(sprintf("  - weather: %d 条记录\n", nrow(weather)))
cat(sprintf("  - airports: %d 条记录\n", nrow(airports)))
cat(sprintf("  - airlines: %d 条记录\n", nrow(airlines)))

# ==============================================================================
# 数据预处理
# ==============================================================================

cat("\n正在进行数据预处理...\n")

# 1. 处理时间数据
flights_processed <- flights %>%
  mutate(
    # 提取时间信息
    hour = as.integer(substr(sprintf("%04d", sched_dep_time), 1, 2)),
    minute = as.integer(substr(sprintf("%04d", sched_dep_time), 3, 4)),
    # 创建完整的日期时间
    datetime = ymd_hms(sprintf("%d-%02d-%02d %02d:%02d:00", year, month, day, hour, minute)),
    # 星期几 (1=周一, 7=周日)
    weekday = wday(datetime, week_start = 1),
    weekday_name = wday(datetime, label = TRUE, abbr = FALSE, week_start = 1),
    # 是否为周末
    is_weekend = weekday >= 6,
    # 时段分类
    time_period = case_when(
      hour >= 5 & hour < 9 ~ "早高峰 (5-9点)",
      hour >= 9 & hour < 12 ~ "上午 (9-12点)",
      hour >= 12 & hour < 14 ~ "午间 (12-14点)",
      hour >= 14 & hour < 18 ~ "下午 (14-18点)",
      hour >= 18 & hour < 21 ~ "晚高峰 (18-21点)",
      hour >= 21 | hour < 5 ~ "夜间 (21-5点)",
      TRUE ~ "未知"
    ),
    # 延误分类
    dep_delay_category = case_when(
      is.na(dep_delay) ~ "数据缺失",
      dep_delay <= 0 ~ "准点/提前",
      dep_delay > 0 & dep_delay <= 15 ~ "轻微延误 (0-15分钟)",
      dep_delay > 15 & dep_delay <= 30 ~ "中度延误 (15-30分钟)",
      dep_delay > 30 & dep_delay <= 60 ~ "严重延误 (30-60分钟)",
      dep_delay > 60 ~ "极端延误 (>60分钟)",
      TRUE ~ "其他"
    ),
    arr_delay_category = case_when(
      is.na(arr_delay) ~ "数据缺失",
      arr_delay <= 0 ~ "准点/提前",
      arr_delay > 0 & arr_delay <= 15 ~ "轻微延误 (0-15分钟)",
      arr_delay > 15 & arr_delay <= 30 ~ "中度延误 (15-30分钟)",
      arr_delay > 30 & arr_delay <= 60 ~ "严重延误 (30-60分钟)",
      arr_delay > 60 ~ "极端延误 (>60分钟)",
      TRUE ~ "其他"
    ),
    # 是否延误
    is_dep_delayed = !is.na(dep_delay) & dep_delay > 15,
    is_arr_delayed = !is.na(arr_delay) & arr_delay > 15,
    is_severe_dep_delay = !is.na(dep_delay) & dep_delay > 60,
    # 航线
    route = paste(origin, dest, sep = " → ")
  )

# 2. 合并飞机数据
planes_subset <- planes %>%
  select(tailnum, year, manufacturer, model, engines, seats, engine)

flights_enriched <- flights_processed %>%
  left_join(planes_subset, by = "tailnum", suffix = c("", "_plane")) %>%
  rename(
    plane_year = year_plane,
    flight_year = year
  ) %>%
  mutate(
    # 机龄（以航班年份为基准，适配多年份数据）
    plane_age = flight_year - plane_year,
    # 机龄分组
    plane_age_group = case_when(
      is.na(plane_age) ~ "未知",
      plane_age <= 5 ~ "新飞机 (0-5年)",
      plane_age > 5 & plane_age <= 10 ~ "中年飞机 (5-10年)",
      plane_age > 10 & plane_age <= 20 ~ "老飞机 (10-20年)",
      plane_age > 20 ~ "超龄飞机 (>20年)",
      TRUE ~ "未知"
    )
  )

# 3. 合并天气数据（按机场、年、月、日、小时）
weather_subset <- weather %>%
  select(origin, year, month, day, hour, temp, dewp, humid, wind_dir,
         wind_speed, wind_gust, precip, pressure, visib) %>%
  distinct()

flights_enriched <- flights_enriched %>%
  left_join(weather_subset, by = c("origin", "flight_year" = "year", "month", "day", "hour")) %>%
  mutate(
    # 天气条件分类
    weather_condition = case_when(
      is.na(visib) | is.na(wind_speed) ~ "数据缺失",
      visib < 3 ~ "低能见度",
      wind_speed > 25 | (!is.na(wind_gust) & wind_gust > 30) ~ "大风",
      precip > 0 ~ "降水",
      TRUE ~ "正常"
    ),
    # 极端天气标记
    is_extreme_weather = weather_condition != "正常" & weather_condition != "数据缺失"
  )

# 4. 合并航空公司名称
airlines_subset <- airlines %>%
  rename(carrier_name = name)

flights_enriched <- flights_enriched %>%
  left_join(airlines_subset, by = "carrier")

# 5. 合并机场信息（目的地）
airports_dest <- airports %>%
  select(faa, name, lat, lon) %>%
  rename(dest_name = name, dest_lat = lat, dest_lon = lon)

airports_origin <- airports %>%
  select(faa, name, lat, lon) %>%
  rename(origin_name = name, origin_lat = lat, origin_lon = lon)

flights_enriched <- flights_enriched %>%
  left_join(airports_origin, by = c("origin" = "faa")) %>%
  left_join(airports_dest, by = c("dest" = "faa"))

# 6. 计算衍生指标
flights_enriched <- flights_enriched %>%
  mutate(
    # 飞行速度 (英里/小时)
    speed_mph = distance / (air_time / 60),
    # 空中追回时间（起飞延误 - 到达延误，正值表示追回）
    recovery_minutes = dep_delay - arr_delay,
    # 是否成功追回
    is_recovered = !is.na(recovery_minutes) & recovery_minutes > 0,
    # 飞行距离分组
    distance_group = case_when(
      distance < 500 ~ "短途 (<500英里)",
      distance >= 500 & distance < 1000 ~ "中途 (500-1000英里)",
      distance >= 1000 & distance < 2000 ~ "长途 (1000-2000英里)",
      distance >= 2000 ~ "超长途 (>2000英里)",
      TRUE ~ "未知"
    )
  )

# ==============================================================================
# 保存处理后的数据
# ==============================================================================

cat("\n正在保存处理后的数据...\n")

# 保存完整宽表（RDS格式，用于后续分析）
saveRDS(flights_enriched, "data/flights_enriched.rds")
cat("  - 保存 flights_enriched.rds\n")

# 保存航空公司信息
airlines_info <- airlines %>%
  left_join(
    flights_enriched %>%
      group_by(carrier) %>%
      summarise(
        flight_count = n(),
        plane_count = n_distinct(tailnum, na.rm = TRUE)
      ),
    by = c("carrier")
  )
write_json(airlines_info, "data/airlines_info.json", auto_unbox = TRUE)
cat("  - 保存 airlines_info.json\n")

# 保存机场信息
airports_info <- airports %>%
  left_join(
    flights_enriched %>%
      group_by(dest) %>%
      summarise(
        dest_flight_count = n(),
        dest_avg_delay = round(mean(arr_delay, na.rm = TRUE), 1)
      ),
    by = c("faa" = "dest")
  ) %>%
  rename(flight_count = dest_flight_count, avg_delay = dest_avg_delay)
write_json(airports_info, "data/airports_info.json", auto_unbox = TRUE)
cat("  - 保存 airports_info.json\n")

cat("\n数据准备完成！\n")
cat(sprintf("处理后的数据集包含 %d 条记录，%d 个字段\n",
            nrow(flights_enriched), ncol(flights_enriched)))
