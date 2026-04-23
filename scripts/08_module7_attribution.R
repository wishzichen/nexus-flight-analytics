# ==============================================================================
# 模块7：延误归因分析（机龄 vs 天气）
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

cat("正在执行模块7分析：延误归因...\n")

# 加载数据
flights <- readRDS("data/flights_enriched.rds")

# 创建输出目录
dir.create("data/module7", showWarnings = FALSE, recursive = TRUE)

# ==============================================================================
# 1. 机龄分析
# ==============================================================================

age_analysis <- flights %>%
  filter(!is.na(plane_age), !is.na(dep_delay)) %>%
  group_by(plane_age_group) %>%
  summarise(
    flightCount = n(),
    avgDepDelay = round(mean(dep_delay, na.rm = TRUE), 1),
    avgArrDelay = round(mean(arr_delay, na.rm = TRUE), 1),
    severeDelayRate = round(mean(dep_delay > 60, na.rm = TRUE) * 100, 1),
    onTimeRate = round(mean(dep_delay <= 15, na.rm = TRUE) * 100, 1),
    avgPlaneAge = round(mean(plane_age, na.rm = TRUE), 1)
  ) %>%
  arrange(avgPlaneAge)

# 机龄与延误的相关性
age_delay_cor <- flights %>%
  filter(!is.na(plane_age), !is.na(dep_delay)) %>%
  summarise(correlation = cor(plane_age, dep_delay, use = "complete.obs")) %>%
  pull(correlation)

# ==============================================================================
# 2. 天气分析
# ==============================================================================

weather_analysis <- flights %>%
  filter(!is.na(weather_condition), !is.na(dep_delay)) %>%
  group_by(weather_condition) %>%
  summarise(
    flightCount = n(),
    avgDepDelay = round(mean(dep_delay, na.rm = TRUE), 1),
    avgArrDelay = round(mean(arr_delay, na.rm = TRUE), 1),
    severeDelayRate = round(mean(dep_delay > 60, na.rm = TRUE) * 100, 1),
    onTimeRate = round(mean(dep_delay <= 15, na.rm = TRUE) * 100, 1)
  ) %>%
  arrange(desc(avgDepDelay))

# ==============================================================================
# 3. 天气变量与延误的相关性矩阵
# ==============================================================================

weather_vars <- flights %>%
  filter(!is.na(dep_delay)) %>%
  select(dep_delay, temp, humid, wind_speed, wind_gust, precip, pressure, visib) %>%
  filter(!is.na(temp), !is.na(humid), !is.na(wind_speed), !is.na(precip), !is.na(visib))

# 计算相关性
correlation_matrix <- data.frame(
  variable = c("温度", "湿度", "风速", "阵风", "降水", "气压", "能见度"),
  correlation = c(
    cor(weather_vars$dep_delay, weather_vars$temp, use = "complete.obs"),
    cor(weather_vars$dep_delay, weather_vars$humid, use = "complete.obs"),
    cor(weather_vars$dep_delay, weather_vars$wind_speed, use = "complete.obs"),
    cor(weather_vars$dep_delay, weather_vars$wind_gust, use = "complete.obs"),
    cor(weather_vars$dep_delay, weather_vars$precip, use = "complete.obs"),
    cor(weather_vars$dep_delay, weather_vars$pressure, use = "complete.obs"),
    cor(weather_vars$dep_delay, weather_vars$visib, use = "complete.obs")
  )
) %>%
  mutate(correlation = round(correlation, 3)) %>%
  arrange(desc(abs(correlation)))

# ==============================================================================
# 4. 老旧飞机在恶劣天气中的表现
# ==============================================================================

interaction_analysis <- flights %>%
  filter(!is.na(plane_age_group), !is.na(weather_condition)) %>%
  group_by(plane_age_group, weather_condition) %>%
  summarise(
    flightCount = n(),
    avgDepDelay = round(mean(dep_delay, na.rm = TRUE), 1),
    severeDelayRate = round(mean(dep_delay > 60, na.rm = TRUE) * 100, 1)
  ) %>%
  filter(flightCount >= 50)

# ==============================================================================
# 5. 机龄 × 风速 双变量分析
# ==============================================================================

age_wind_analysis <- flights %>%
  filter(!is.na(plane_age), !is.na(wind_speed), !is.na(dep_delay)) %>%
  mutate(
    age_group = case_when(
      plane_age <= 5 ~ "0-5年",
      plane_age <= 10 ~ "5-10年",
      plane_age <= 20 ~ "10-20年",
      TRUE ~ ">20年"
    ),
    wind_group = case_when(
      wind_speed <= 10 ~ "微风",
      wind_speed <= 20 ~ "轻风",
      wind_speed <= 30 ~ "中风",
      TRUE ~ "强风"
    )
  ) %>%
  group_by(age_group, wind_group) %>%
  summarise(
    flightCount = n(),
    avgDepDelay = round(mean(dep_delay, na.rm = TRUE), 1),
    avgWindSpeed = round(mean(wind_speed, na.rm = TRUE), 1)
  ) %>%
  filter(flightCount >= 20)

# ==============================================================================
# 6. 特征重要性（简化版）
# ==============================================================================

# 基于相关性绝对值排序
feature_importance <- data.frame(
  feature = c("机龄", "风速", "能见度", "降水", "湿度", "温度", "气压"),
  importance = c(
    abs(age_delay_cor),
    abs(correlation_matrix$correlation[correlation_matrix$variable == "风速"]),
    abs(correlation_matrix$correlation[correlation_matrix$variable == "能见度"]),
    abs(correlation_matrix$correlation[correlation_matrix$variable == "降水"]),
    abs(correlation_matrix$correlation[correlation_matrix$variable == "湿度"]),
    abs(correlation_matrix$correlation[correlation_matrix$variable == "温度"]),
    abs(correlation_matrix$correlation[correlation_matrix$variable == "气压"])
  )
) %>%
  mutate(importance = round(importance * 100, 1)) %>%
  arrange(desc(importance))

# ==============================================================================
# 7. 箱线图数据：不同天气条件下的延误分布
# ==============================================================================

weather_boxplot_stats <- flights %>%
  filter(!is.na(weather_condition), weather_condition != "数据缺失") %>%
  group_by(weather_condition) %>%
  summarise(
    min = round(min(dep_delay, na.rm = TRUE), 0),
    q1 = round(quantile(dep_delay, 0.25, na.rm = TRUE), 1),
    median = round(median(dep_delay, na.rm = TRUE), 1),
    q3 = round(quantile(dep_delay, 0.75, na.rm = TRUE), 1),
    max = round(max(dep_delay, na.rm = TRUE), 0),
    mean = round(mean(dep_delay, na.rm = TRUE), 1),
    count = n()
  )

# ==============================================================================
# 8. 雷达图数据：不同因素影响强度
# ==============================================================================

radar_data <- data.frame(
  factor = c("机龄", "天气", "时段", "航司", "航线"),
  value = c(
    round(abs(age_delay_cor) * 100, 1),
    round(abs(cor(weather_vars$dep_delay, weather_vars$wind_speed, use = "complete.obs")) * 100 +
          abs(cor(weather_vars$dep_delay, weather_vars$visib, use = "complete.obs")) * 100, 1),
    35,  # 时段影响（基于模块2分析估算）
    30,  # 航司影响（基于模块5分析估算）
    25   # 航线影响（基于模块3分析估算）
  )
)

# ==============================================================================
# 9. 综合归因结论
# ==============================================================================

# 计算各因素对延误的解释力
conclusions <- list(
  ageCorrelation = round(age_delay_cor, 3),
  topWeatherFactor = correlation_matrix$variable[1],
  topWeatherCorrelation = correlation_matrix$correlation[1],
  oldPlaneDelayIncrease = round(
    age_analysis$avgDepDelay[age_analysis$plane_age_group == "超龄飞机 (>20年)"] -
    age_analysis$avgDepDelay[age_analysis$plane_age_group == "新飞机 (0-5年)"],
    1
  ),
  badWeatherDelayIncrease = round(
    weather_analysis$avgDepDelay[weather_analysis$weather_condition == "低能见度"] -
    weather_analysis$avgDepDelay[weather_analysis$weather_condition == "正常"],
    1
  )
)

# ==============================================================================
# 保存结果
# ==============================================================================

result <- list(
  ageAnalysis = age_analysis %>% collect(),
  weatherAnalysis = weather_analysis %>% collect(),
  correlationMatrix = correlation_matrix,
  interactionAnalysis = interaction_analysis %>% collect(),
  ageWindAnalysis = age_wind_analysis %>% collect(),
  featureImportance = feature_importance,
  weatherBoxplotStats = weather_boxplot_stats %>% collect(),
  radarData = radar_data,
  conclusions = conclusions
)

write_json(result, "data/module7/attribution_analysis.json", auto_unbox = TRUE, pretty = TRUE)

cat("模块7分析完成！结果已保存到 data/module7/attribution_analysis.json\n")