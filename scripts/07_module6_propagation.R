# ==============================================================================
# 模块6：同机延误传导分析
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

cat("正在执行模块6分析：同机延误传导...\n")

# 加载数据
flights <- readRDS("data/flights_enriched.rds")

# 创建输出目录
dir.create("data/module6", showWarnings = FALSE, recursive = TRUE)

# ==============================================================================
# 1. 构建同机同日任务链
# ==============================================================================

# 按飞机号、年、月、日分组，并按时间排序
flight_chains <- flights %>%
  filter(!is.na(tailnum), !is.na(dep_time)) %>%
  arrange(tailnum, flight_year, month, day, dep_time) %>%
  group_by(tailnum, flight_year, month, day) %>%
  mutate(
    task_sequence = row_number(),
    total_tasks = n(),
    # 前序到达延误
    prev_arr_delay = lag(arr_delay),
    # 后续起飞延误
    next_dep_delay = lead(dep_delay),
    # 是否有前序航班
    has_prev = !is.na(lag(arr_delay)),
    # 是否有后续航班
    has_next = !is.na(lead(dep_delay))
  ) %>%
  ungroup()

# ==============================================================================
# 2. 传导统计汇总
# ==============================================================================

# 只看有前序航班的记录
with_prev <- flight_chains %>%
  filter(has_prev)

propagation_stats <- with_prev %>%
  summarise(
    totalChains = n(),
    avgPrevArrDelay = round(mean(prev_arr_delay, na.rm = TRUE), 1),
    avgNextDepDelay = round(mean(dep_delay, na.rm = TRUE), 1),
    # 前序晚到后续仍准点的比例
    prevDelayedNextOnTime = round(
      mean(prev_arr_delay > 15 & dep_delay <= 15, na.rm = TRUE) * 100, 1
    ),
    # 前序晚到后续也晚的比例
    prevDelayedNextDelayed = round(
      mean(prev_arr_delay > 15 & dep_delay > 15, na.rm = TRUE) * 100, 1
    ),
    # 传导强度（相关性）
    correlation = cor(prev_arr_delay, dep_delay, use = "complete.obs")
  ) %>%
  as.list()

# 同机同日平均执行航班数
avg_tasks_per_day <- flight_chains %>%
  group_by(tailnum, flight_year, month, day) %>%
  summarise(tasks = n()) %>%
  summarise(avgTasks = round(mean(tasks), 1)) %>%
  pull(avgTasks)

propagation_stats$avgTasksPerDay <- avg_tasks_per_day

# ==============================================================================
# 3. 任务序号 vs 平均延误
# ==============================================================================

sequence_delay <- flight_chains %>%
  group_by(task_sequence) %>%
  summarise(
    flightCount = n(),
    avgDepDelay = round(mean(dep_delay, na.rm = TRUE), 1),
    avgArrDelay = round(mean(arr_delay, na.rm = TRUE), 1),
    severeDelayRate = round(mean(dep_delay > 60, na.rm = TRUE) * 100, 1)
  ) %>%
  filter(task_sequence <= 8)  # 只看前8班

# ==============================================================================
# 4. 前序到达延误 vs 后续起飞延误 散点图
# ==============================================================================

propagation_scatter <- with_prev %>%
  filter(!is.na(prev_arr_delay), !is.na(dep_delay)) %>%
  select(tailnum, task_sequence, prev_arr_delay, dep_delay, carrier) %>%
  sample_n(min(500, n()))

# ==============================================================================
# 5. Sankey 图数据（延误状态流转）
# ==============================================================================

# 定义延误状态
get_delay_status <- function(delay) {
  ifelse(is.na(delay), "数据缺失",
         ifelse(delay <= 15, "准点", "延误"))
}

# 构建状态流转
sankey_data <- flight_chains %>%
  filter(has_prev, has_next) %>%
  mutate(
    prev_status = get_delay_status(prev_arr_delay),
    current_status = get_delay_status(dep_delay),
    next_status = get_delay_status(next_dep_delay)
  )

# 节点：前序状态 + 当前状态
nodes <- data.frame(
  name = c(
    "前序准点", "前序延误",
    "当前准点", "当前延误",
    "后续准点", "后续延误"
  )
)

# 链接：前序 -> 当前
links_prev_current <- sankey_data %>%
  group_by(prev_status, current_status) %>%
  summarise(value = n()) %>%
  mutate(
    source = case_when(
      prev_status == "准点" ~ 0,
      prev_status == "延误" ~ 1
    ),
    target = case_when(
      current_status == "准点" ~ 2,
      current_status == "延误" ~ 3
    )
  ) %>%
  select(source, target, value)

# 链接：当前 -> 后续
links_current_next <- sankey_data %>%
  group_by(current_status, next_status) %>%
  summarise(value = n()) %>%
  mutate(
    source = case_when(
      current_status == "准点" ~ 2,
      current_status == "延误" ~ 3
    ),
    target = case_when(
      next_status == "准点" ~ 4,
      next_status == "延误" ~ 5
    )
  ) %>%
  select(source, target, value)

links <- bind_rows(links_prev_current, links_current_next)

# ==============================================================================
# 6. 真实案例：展示某一飞机的任务链
# ==============================================================================

# 找一个有典型延误传导的案例
example_tailnum <- flight_chains %>%
  filter(has_prev, prev_arr_delay > 30, dep_delay > 30) %>%
  group_by(tailnum) %>%
  filter(n() >= 2) %>%
  slice(1) %>%
  pull(tailnum)

case_example <- flight_chains %>%
  filter(tailnum == example_tailnum) %>%
  arrange(flight_year, month, day, dep_time) %>%
  group_by(flight_year, month, day) %>%
  filter(n() >= 2) %>%
  slice(1:4) %>%  # 每天最多4班
  ungroup() %>%
  select(
    tailnum, flight_year, month, day, task_sequence,
    flight, origin, dest, dep_time, arr_time,
    dep_delay, arr_delay, prev_arr_delay
  ) %>%
  head(10)

# ==============================================================================
# 7. 不同任务序号的延误传导强度
# ==============================================================================

sequence_propagation <- flight_chains %>%
  filter(has_prev, task_sequence <= 6) %>%
  group_by(task_sequence) %>%
  summarise(
    count = n(),
    avgPrevDelay = round(mean(prev_arr_delay, na.rm = TRUE), 1),
    avgCurrentDelay = round(mean(dep_delay, na.rm = TRUE), 1),
    propagationRate = round(mean(prev_arr_delay > 15 & dep_delay > 15, na.rm = TRUE) * 100, 1),
    recoveryRate = round(mean(prev_arr_delay > 15 & dep_delay <= 15, na.rm = TRUE) * 100, 1)
  )

# ==============================================================================
# 8. 传导时间分布
# ==============================================================================

# 计算传导时间（前序到达到后续起飞的时间间隔）
# 注意：这里需要更精确的时间计算

# ==============================================================================
# 保存结果
# ==============================================================================

result <- list(
  propagationStats = propagation_stats,
  sequenceDelay = sequence_delay %>% collect(),
  propagationScatter = propagation_scatter %>% collect(),
  sankeyNodes = nodes,
  sankeyLinks = links %>% collect(),
  caseExample = case_example %>% collect(),
  sequencePropagation = sequence_propagation %>% collect()
)

write_json(result, "data/module6/propagation_analysis.json", auto_unbox = TRUE, pretty = TRUE)

cat("模块6分析完成！结果已保存到 data/module6/propagation_analysis.json\n")
