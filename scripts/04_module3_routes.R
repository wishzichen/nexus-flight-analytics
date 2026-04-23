# ==============================================================================
# 模块3：目的地/航线分析
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

cat("正在执行模块3分析：目的地/航线...\n")

# 加载数据
flights <- readRDS("data/flights_enriched.rds")

# 创建输出目录
dir.create("data/module3", showWarnings = FALSE, recursive = TRUE)

# ==============================================================================
# 1. 目的地航班量 Top 10
# ==============================================================================

top_destinations_volume <- flights %>%
  group_by(dest, dest_name) %>%
  summarise(
    flightCount = n(),
    avgDistance = round(mean(distance, na.rm = TRUE), 0),
    avgAirTime = round(mean(air_time, na.rm = TRUE), 1)
  ) %>%
  arrange(desc(flightCount)) %>%
  head(10) %>%
  mutate(rank = row_number())

# ==============================================================================
# 2. 目的地平均到达延误 Top 10
# ==============================================================================

top_destinations_delay <- flights %>%
  group_by(dest, dest_name) %>%
  summarise(
    flightCount = n(),
    avgArrDelay = round(mean(arr_delay, na.rm = TRUE), 1),
    avgDepDelay = round(mean(dep_delay, na.rm = TRUE), 1),
    severeDelayRate = round(mean(arr_delay > 60, na.rm = TRUE) * 100, 1),
    onTimeRate = round(mean(arr_delay <= 15, na.rm = TRUE) * 100, 1)
  ) %>%
  filter(flightCount >= 100) %>%
  arrange(desc(avgArrDelay)) %>%
  head(10) %>%
  mutate(rank = row_number())

# ==============================================================================
# 3. 航线分析（出发机场 × 目的地）
# ==============================================================================

route_analysis <- flights %>%
  group_by(origin, dest, route) %>%
  summarise(
    flightCount = n(),
    avgDepDelay = round(mean(dep_delay, na.rm = TRUE), 1),
    avgArrDelay = round(mean(arr_delay, na.rm = TRUE), 1),
    avgDistance = round(mean(distance, na.rm = TRUE), 0),
    avgAirTime = round(mean(air_time, na.rm = TRUE), 1),
    severeDelayRate = round(mean(dep_delay > 60, na.rm = TRUE) * 100, 1),
    onTimeRate = round(mean(dep_delay <= 15, na.rm = TRUE) * 100, 1)
  ) %>%
  filter(flightCount >= 50) %>%
  arrange(desc(avgDepDelay)) %>%
  head(20)

# ==============================================================================
# 4. 气泡图数据（航班量 vs 延误程度）
# ==============================================================================

bubble_data <- flights %>%
  group_by(dest, dest_name, dest_lat, dest_lon) %>%
  summarise(
    flightCount = n(),
    avgArrDelay = round(mean(arr_delay, na.rm = TRUE), 1),
    avgDistance = round(mean(distance, na.rm = TRUE), 0),
    severeDelayRate = round(mean(arr_delay > 60, na.rm = TRUE) * 100, 1)
  ) %>%
  filter(flightCount >= 100, !is.na(dest_lat), !is.na(dest_lon)) %>%
  arrange(desc(flightCount))

# ==============================================================================
# 5. origin × dest 矩阵热力图
# ==============================================================================

origin_dest_heatmap <- flights %>%
  group_by(origin, dest) %>%
  summarise(
    avgDelay = round(mean(dep_delay, na.rm = TRUE), 1),
    flightCount = n()
  ) %>%
  filter(flightCount >= 50) %>%
  arrange(origin, dest)

# ==============================================================================
# 6. 各出发机场的高风险航线
# ==============================================================================

jfk_risky_routes <- flights %>%
  filter(origin == "JFK") %>%
  group_by(dest, dest_name) %>%
  summarise(
    flightCount = n(),
    avgDepDelay = round(mean(dep_delay, na.rm = TRUE), 1),
    avgArrDelay = round(mean(arr_delay, na.rm = TRUE), 1),
    severeDelayRate = round(mean(dep_delay > 60, na.rm = TRUE) * 100, 1)
  ) %>%
  filter(flightCount >= 50) %>%
  arrange(desc(avgDepDelay)) %>%
  head(5)

ewr_risky_routes <- flights %>%
  filter(origin == "EWR") %>%
  group_by(dest, dest_name) %>%
  summarise(
    flightCount = n(),
    avgDepDelay = round(mean(dep_delay, na.rm = TRUE), 1),
    avgArrDelay = round(mean(arr_delay, na.rm = TRUE), 1),
    severeDelayRate = round(mean(dep_delay > 60, na.rm = TRUE) * 100, 1)
  ) %>%
  filter(flightCount >= 50) %>%
  arrange(desc(avgDepDelay)) %>%
  head(5)

lga_risky_routes <- flights %>%
  filter(origin == "LGA") %>%
  group_by(dest, dest_name) %>%
  summarise(
    flightCount = n(),
    avgDepDelay = round(mean(dep_delay, na.rm = TRUE), 1),
    avgArrDelay = round(mean(arr_delay, na.rm = TRUE), 1),
    severeDelayRate = round(mean(dep_delay > 60, na.rm = TRUE) * 100, 1)
  ) %>%
  filter(flightCount >= 50) %>%
  arrange(desc(avgDepDelay)) %>%
  head(5)

# ==============================================================================
# 7. 航线距离分布
# ==============================================================================

distance_distribution <- flights %>%
  group_by(distance_group) %>%
  summarise(
    flightCount = n(),
    avgDepDelay = round(mean(dep_delay, na.rm = TRUE), 1),
    avgArrDelay = round(mean(arr_delay, na.rm = TRUE), 1),
    avgDistance = round(mean(distance, na.rm = TRUE), 0)
  ) %>%
  arrange(avgDistance)

# ==============================================================================
# 8. 目的地地理信息（用于地图）
# ==============================================================================

dest_geo <- flights %>%
  group_by(dest, dest_name, dest_lat, dest_lon) %>%
  summarise(
    flightCount = n(),
    avgArrDelay = round(mean(arr_delay, na.rm = TRUE), 1),
    avgDistance = round(mean(distance, na.rm = TRUE), 0)
  ) %>%
  filter(!is.na(dest_lat), !is.na(dest_lon)) %>%
  arrange(desc(flightCount)) %>%
  head(30)

# ==============================================================================
# 9. 出发机场坐标
# ==============================================================================

origin_geo <- flights %>%
  group_by(origin, origin_name, origin_lat, origin_lon) %>%
  summarise(flightCount = n()) %>%
  filter(!is.na(origin_lat), !is.na(origin_lon))

# ==============================================================================
# 保存结果
# ==============================================================================

result <- list(
  topDestinationsVolume = top_destinations_volume %>% collect(),
  topDestinationsDelay = top_destinations_delay %>% collect(),
  routeAnalysis = route_analysis %>% collect(),
  bubbleData = bubble_data %>% collect(),
  originDestHeatmap = origin_dest_heatmap %>% collect(),
  jfkRiskyRoutes = jfk_risky_routes %>% collect(),
  ewrRiskyRoutes = ewr_risky_routes %>% collect(),
  lgaRiskyRoutes = lga_risky_routes %>% collect(),
  distanceDistribution = distance_distribution %>% collect(),
  destGeo = dest_geo %>% collect(),
  originGeo = origin_geo %>% collect()
)

write_json(result, "data/module3/route_analysis.json", auto_unbox = TRUE, pretty = TRUE)

cat("模块3分析完成！结果已保存到 data/module3/route_analysis.json\n")