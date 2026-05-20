# ==============================================================================
# 执行所有分析脚本
# ==============================================================================

# 设置工作目录为项目根目录，并记录 scripts 目录
# 自动检测脚本路径
args <- commandArgs(trailingOnly = FALSE)
file_arg <- grep("^--file=", args, value = TRUE)
if (length(file_arg) > 0) {
  script_path <- normalizePath(sub("^--file=", "", file_arg), winslash = "/", mustWork = FALSE)
  scripts_dir <- dirname(script_path)
  project_dir <- dirname(scripts_dir)
} else {
  if (!file.exists("01_data_preparation.R")) {
    possible_paths <- c(
      "e:/TJUTCM/Activities/第二届数据分析大赛/nexus-flight-analytics/scripts",
      "../scripts"
    )
    for (p in possible_paths) {
      if (file.exists(file.path(p, "01_data_preparation.R"))) {
        scripts_dir <- normalizePath(p, winslash = "/", mustWork = FALSE)
        break
      }
    }
  } else {
    scripts_dir <- normalizePath(getwd(), winslash = "/", mustWork = FALSE)
  }
  project_dir <- dirname(scripts_dir)
}

setwd(project_dir)

cat("当前项目目录:", getwd(), "\n")
cat("脚本目录:", scripts_dir, "\n")

cat("========================================\n")
cat("开始执行所有 R 分析脚本\n")
cat("========================================\n\n")

# 执行顺序
scripts <- c(
  "00_collect_multi_year_data.R",
  "01_data_preparation.R",
  "02_module1_dashboard.R",
  "03_module2_time.R",
  "04_module3_routes.R",
  "05_module4_recovery.R",
  "06_module5_airlines.R",
  "07_module6_propagation.R",
  "08_module7_attribution.R",
  "09_module8_explorer_full.R"
)

for (script in scripts) {
  cat(sprintf("\n>>> 执行: %s\n", script))
  tryCatch({
    source(file.path(scripts_dir, script), local = TRUE)
    setwd(project_dir)
    cat(sprintf(">>> 完成: %s\n", script))
  }, error = function(e) {
    cat(sprintf(">>> 错误: %s - %s\n", script, e$message))
    setwd(project_dir)
  })
}

cat("\n========================================\n")
cat("所有分析脚本执行完成！\n")
cat("========================================\n")

# 列出生成的数据文件
cat("\n生成的数据文件:\n")
data_dirs <- list.dirs("data", recursive = TRUE, full.names = FALSE)
for (dir in data_dirs) {
  files <- list.files(dir, pattern = "\\.json$|\\.rds$")
  if (length(files) > 0) {
    cat(sprintf("  %s: %s\n", dir, paste(files, collapse = ", ")))
  }
}
