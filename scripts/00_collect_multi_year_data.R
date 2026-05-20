# ==============================================================================
# 多年份航班数据采集脚本
# ------------------------------------------------------------------------------
# nycflights13 官方包只内置 2013 年纽约航班数据。若需要 2014+ 等年份，
# 推荐使用 anyflights 生成与 nycflights13 类似结构的数据，再交给
# 01_data_preparation.R 统一清洗分析。
# ==============================================================================

required_packages <- c("anyflights", "dplyr", "purrr", "readr")
missing_packages <- required_packages[!vapply(required_packages, requireNamespace, logical(1), quietly = TRUE)]

if (length(missing_packages) > 0) {
  stop(
    "缺少 R 包：", paste(missing_packages, collapse = ", "),
    "\n请先运行：install.packages(c(",
    paste(sprintf('\"%s\"', missing_packages), collapse = ", "),
    "))"
  )
}

library(anyflights)
library(dplyr)
library(purrr)

# 与其他分析脚本保持一致：优先切到项目根目录，避免从 scripts/ 运行时把数据写错位置。
full_args <- commandArgs(trailingOnly = FALSE)
file_arg <- grep("^--file=", full_args, value = TRUE)
if (length(file_arg) > 0) {
  script_path <- sub("^--file=", "", file_arg)
  if (grepl("scripts[/\\\\]", script_path)) {
    setwd(dirname(dirname(script_path)))
  } else if (file.exists("00_collect_multi_year_data.R") && basename(getwd()) == "scripts") {
    setwd("..")
  }
} else if (file.exists("00_collect_multi_year_data.R") && basename(getwd()) == "scripts") {
  setwd("..")
}

parse_integer_list <- function(value, default) {
  if (!nzchar(value)) return(default)
  parts <- unlist(strsplit(value, ",", fixed = TRUE))
  values <- unlist(lapply(parts, function(part) {
    part <- trimws(part)
    if (grepl("^\\d+\\s*:\\s*\\d+$", part)) {
      bounds <- as.integer(unlist(strsplit(gsub("\\s+", "", part), ":", fixed = TRUE)))
      return(seq(bounds[1], bounds[2]))
    }
    as.integer(part)
  }))
  values[!is.na(values)]
}

args <- commandArgs(trailingOnly = TRUE)
years_env <- Sys.getenv("ANYFLIGHTS_YEARS", unset = "")
years <- if (length(args) > 0) as.integer(args) else parse_integer_list(years_env, 2014)
airports <- c("JFK", "LGA", "EWR")
months_env <- Sys.getenv("ANYFLIGHTS_MONTHS", unset = "")
months <- parse_integer_list(months_env, 1:10)
force_refresh <- Sys.getenv("ANYFLIGHTS_FORCE", unset = "0") %in% c("1", "true", "TRUE", "yes", "YES")
max_retries <- as.integer(Sys.getenv("ANYFLIGHTS_RETRIES", unset = "2"))
if (is.na(max_retries) || max_retries < 1) max_retries <- 2
options(timeout = max(getOption("timeout"), 1800))

dir.create("data/raw_multi_year", recursive = TRUE, showWarnings = FALSE)

standard_flight_cols <- c(
  "year", "month", "day", "dep_time", "sched_dep_time", "dep_delay",
  "arr_time", "sched_arr_time", "arr_delay", "carrier", "flight",
  "tailnum", "origin", "dest", "air_time", "distance", "hour",
  "minute", "time_hour"
)

get_flight_table <- function(year_data) {
  if (is.data.frame(year_data)) return(year_data)
  if (is.list(year_data) && "flights" %in% names(year_data)) return(year_data$flights)
  NULL
}

read_existing_flights <- function(file_path) {
  if (!file.exists(file_path) || force_refresh) return(NULL)
  existing <- readRDS(file_path)
  flights <- get_flight_table(existing)
  if (is.null(flights) || !"month" %in% names(flights)) return(NULL)
  flights
}

collect_month_batch <- function(year, target_months) {
  request_months <- target_months

  for (attempt in seq_len(max_retries)) {
    result <- tryCatch(
      anyflights::get_flights(station = airports, year = year, month = request_months),
      error = function(e) e
    )
    if (!inherits(result, "error")) {
      flights <- get_flight_table(result)
      if (!is.null(flights)) return(flights %>% filter(month %in% target_months))
    }
    message_text <- if (inherits(result, "error")) result$message else paste("返回对象无法识别：", paste(class(result), collapse = "/"))
    message("  月份 ", paste(target_months, collapse = ","), " 第 ", attempt, "/", max_retries, " 次失败：", message_text)
    Sys.sleep(3 * attempt)
  }
  NULL
}

collect_2014_from_wiki <- function(file_path) {
  csv_sources <- c(
    "data/raw_multi_year/flights14.csv",
    "https://raw.githubusercontent.com/wiki/arunsrinivasan/flights/NYCflights14/flights14.csv",
    "https://gh.llkk.cc/https://raw.githubusercontent.com/wiki/arunsrinivasan/flights/NYCflights14/flights14.csv"
  )
  message("优先使用 arunsrinivasan/flights 的 flights14.csv 作为 2014 数据源...")

  result <- NULL
  for (csv_source in csv_sources) {
    if (!grepl("^https?://", csv_source) && !file.exists(csv_source)) next
    result <- tryCatch(
      readr::read_csv(csv_source, show_col_types = FALSE, progress = FALSE),
      error = function(e) e
    )
    if (!inherits(result, "error")) break
    message("  flights14.csv 来源失败：", csv_source, "；", result$message)
  }

  if (is.null(result) || inherits(result, "error")) {
    message("  flights14.csv 读取失败。")
    return(NULL)
  }

  if (!"minute" %in% names(result) && "min" %in% names(result)) {
    result <- result %>% rename(minute = min)
  }
  if (!"sched_dep_time" %in% names(result)) {
    result <- result %>% mutate(sched_dep_time = if_else(!is.na(hour) & !is.na(minute), hour * 100 + minute, dep_time))
  }
  if (!"sched_arr_time" %in% names(result)) {
    result <- result %>% mutate(sched_arr_time = arr_time)
  }
  if (!"time_hour" %in% names(result)) {
    result <- result %>%
      mutate(time_hour = as.POSIXct(sprintf("%d-%02d-%02d %02d:00:00", year, month, day, hour), tz = "UTC"))
  }

  flights <- result %>%
    filter(month %in% months) %>%
    select(any_of(standard_flight_cols)) %>%
    mutate(
      carrier = as.character(carrier),
      tailnum = as.character(tailnum),
      origin = as.character(origin),
      dest = as.character(dest)
    ) %>%
    distinct(year, month, day, carrier, flight, tailnum, origin, dest, sched_dep_time, .keep_all = TRUE) %>%
    arrange(year, month, day, sched_dep_time)

  if (nrow(flights) == 0) {
    message("  flights14.csv 中没有匹配请求月份的数据。")
    return(NULL)
  }

  saveRDS(flights, file_path)
  message("  已保存 flights14.csv 数据：", nrow(flights), " 条，月份：", paste(sort(unique(flights$month)), collapse = ","))
  flights
}

collect_one_year <- function(year) {
  file_path <- file.path("data/raw_multi_year", paste0("nyc_flights_", year, ".rds"))
  current_flights <- read_existing_flights(file_path)
  existing_months <- if (!is.null(current_flights)) sort(unique(current_flights$month)) else integer()
  missing_months <- setdiff(months, existing_months)

  if (length(missing_months) == 0) {
    message("跳过：", file_path, " 已包含请求月份。若需重下，请设置 ANYFLIGHTS_FORCE=1。")
    return(invisible(NULL))
  }

  if (year == 2014) {
    wiki_flights <- collect_2014_from_wiki(file_path)
    if (!is.null(wiki_flights)) {
      current_flights <- wiki_flights
      existing_months <- sort(unique(current_flights$month))
      missing_months <- setdiff(months, existing_months)
      if (length(missing_months) == 0) {
        message("完成：", file_path)
        return(invisible(NULL))
      }
    }
  }

  message("正在采集 ", year, " 年纽约三机场航班数据（缺失月份：", paste(missing_months, collapse = ","), "）...")
  failed_months <- integer()
  month_batches <- split(missing_months, ceiling(seq_along(missing_months) / 2))

  for (month_batch in month_batches) {
    message("  下载 ", year, " 年 ", paste(sprintf("%02d", month_batch), collapse = ","), " 月 ...")
    batch_flights <- collect_month_batch(year, month_batch)
    if (is.null(batch_flights) || nrow(batch_flights) == 0) {
      failed_months <- c(failed_months, month_batch)
      next
    }

    current_flights <- bind_rows(current_flights, batch_flights) %>%
      distinct(year, month, day, carrier, flight, tailnum, origin, dest, sched_dep_time, .keep_all = TRUE) %>%
      arrange(year, month, day, sched_dep_time)
    saveRDS(current_flights, file_path)
    message("  已保存 ", year, " 年 ", paste(sprintf("%02d", month_batch), collapse = ","), " 月，当前记录数：", nrow(current_flights))
  }

  if (length(failed_months) > 0) {
    warning("年份 ", year, " 仍有月份下载失败：", paste(failed_months, collapse = ", "))
  } else {
    message("完成：", file_path)
  }
}

walk(years, collect_one_year)

message("多年份数据采集完成。接下来运行 npm run r:all 重新生成分析数据。")
