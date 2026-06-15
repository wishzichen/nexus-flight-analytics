import type { Language } from '../contexts/LanguageContext';

type DisplayLabel = { zh: string; en: string };

const DISPLAY_LABELS: Record<string, DisplayLabel> = {
  准点: { zh: '准点', en: 'On-time' },
  提前: { zh: '提前', en: 'Early' },
  '提前/准点': { zh: '提前/准点', en: 'Early / On-time' },
  轻微: { zh: '轻微', en: 'Light' },
  轻微延误: { zh: '轻微延误', en: 'Light Delay' },
  中度: { zh: '中度', en: 'Moderate' },
  中度延误: { zh: '中度延误', en: 'Moderate Delay' },
  严重: { zh: '严重', en: 'Severe' },
  严重延误: { zh: '严重延误', en: 'Severe Delay' },
  极端延误: { zh: '极端延误', en: 'Extreme Delay' },
  数据缺失: { zh: '数据缺失', en: 'Missing Data' },
  延误: { zh: '延误', en: 'Delayed' },

  周一: { zh: '周一', en: 'Mon' },
  周二: { zh: '周二', en: 'Tue' },
  周三: { zh: '周三', en: 'Wed' },
  周四: { zh: '周四', en: 'Thu' },
  周五: { zh: '周五', en: 'Fri' },
  周六: { zh: '周六', en: 'Sat' },
  周日: { zh: '周日', en: 'Sun' },

  morning_peak: { zh: '早高峰', en: 'Morning Peak' },
  daytime: { zh: '白天平峰', en: 'Daytime' },
  evening_peak: { zh: '晚高峰', en: 'Evening Peak' },
  night: { zh: '夜间', en: 'Night' },
  short: { zh: '短途', en: 'Short-haul' },
  medium: { zh: '中途', en: 'Medium-haul' },
  long: { zh: '长途', en: 'Long-haul' },

  '早高峰 (5-9点)': { zh: '早高峰 (5-9点)', en: 'Morning Peak (05:00-09:00)' },
  '上午 (9-12点)': { zh: '上午 (9-12点)', en: 'Morning (09:00-12:00)' },
  '午间 (12-14点)': { zh: '午间 (12:00-14:00)', en: 'Midday (12:00-14:00)' },
  '下午 (14-18点)': { zh: '下午 (14:00-18:00)', en: 'Afternoon (14:00-18:00)' },
  '晚高峰 (18-21点)': { zh: '晚高峰 (18:00-21:00)', en: 'Evening Peak (18:00-21:00)' },
  '夜间 (21-5点)': { zh: '夜间 (21:00-05:00)', en: 'Night (21:00-05:00)' },

  '短途 (<500英里)': { zh: '短途 (<500英里)', en: 'Short-haul (<500 mi)' },
  '中途 (500-1000英里)': { zh: '中途 (500-1000英里)', en: 'Medium-haul (500-1000 mi)' },
  '长途 (1000-2000英里)': { zh: '长途 (1000-2000英里)', en: 'Long-haul (1000-2000 mi)' },
  '超长途 (>2000英里)': { zh: '超长途 (>2000英里)', en: 'Ultra long-haul (>2000 mi)' },

  降水: { zh: '降水', en: 'Precipitation' },
  低能见度: { zh: '低能见度', en: 'Low Visibility' },
  大风: { zh: '大风', en: 'High Wind' },
  正常: { zh: '正常', en: 'Normal' },
  湿度: { zh: '湿度', en: 'Humidity' },
  气压: { zh: '气压', en: 'Pressure' },
  能见度: { zh: '能见度', en: 'Visibility' },
  温度: { zh: '温度', en: 'Temperature' },
  风速: { zh: '风速', en: 'Wind Speed' },
  阵风: { zh: '阵风', en: 'Wind Gust' },
  天气: { zh: '天气', en: 'Weather' },
  时段: { zh: '时段', en: 'Time Period' },
  航司: { zh: '航司', en: 'Airline' },
  航线: { zh: '航线', en: 'Route' },
  机龄: { zh: '机龄', en: 'Aircraft Age' },
};

const MOJIBAKE_LABELS: Record<string, DisplayLabel> = {
  '鍑嗙偣': DISPLAY_LABELS.准点,
  '鎻愬墠': DISPLAY_LABELS.提前,
  '杞诲井': DISPLAY_LABELS.轻微,
  '杞诲井寤惰': DISPLAY_LABELS.轻微延误,
  '涓害': DISPLAY_LABELS.中度,
  '涓害寤惰': DISPLAY_LABELS.中度延误,
  '涓ラ噸': DISPLAY_LABELS.严重,
  '涓ラ噸寤惰': DISPLAY_LABELS.严重延误,
  '鏁版嵁缂哄け': DISPLAY_LABELS.数据缺失,
  '寤惰': DISPLAY_LABELS.延误,
  '鍛ㄤ竴': DISPLAY_LABELS.周一,
  '鍛ㄤ簩': DISPLAY_LABELS.周二,
  '鍛ㄤ笁': DISPLAY_LABELS.周三,
  '鍛ㄥ洓': DISPLAY_LABELS.周四,
  '鍛ㄤ簲': DISPLAY_LABELS.周五,
  '鍛ㄥ叚': DISPLAY_LABELS.周六,
  '鍛ㄦ棩': DISPLAY_LABELS.周日,
  '鏃╅珮宄': DISPLAY_LABELS.morning_peak,
  '鐧藉ぉ骞冲嘲': DISPLAY_LABELS.daytime,
  '鏅氶珮宄': DISPLAY_LABELS.evening_peak,
  '澶滈棿': DISPLAY_LABELS.night,
  '鐭€': DISPLAY_LABELS.short,
  '涓▼': DISPLAY_LABELS.medium,
  '闀块€': DISPLAY_LABELS.long,
};

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function localizeDisplayValue(value: unknown, language: Language) {
  const text = String(value ?? '');
  if (!text) return text;
  const direct = DISPLAY_LABELS[text] || MOJIBAKE_LABELS[text];
  if (direct) return direct[language];

  const monthMatch = text.match(/^(\d{1,2})月$/);
  if (monthMatch) {
    const month = Number(monthMatch[1]);
    return language === 'zh' ? `${month}月` : MONTH_SHORT[month - 1] || text;
  }

  return text;
}

export function localizeWeekdayByIndex(index: unknown, language: Language) {
  const labels = language === 'zh'
    ? ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const numeric = Number(index);
  return labels[numeric - 1] || '';
}

export function localizeDelayLevel(value: unknown, language: Language) {
  return localizeDisplayValue(value, language);
}

export function delayLevelKey(value: unknown) {
  const text = String(value ?? '');
  if (
    text.includes('准点') ||
    text.includes('提前') ||
    text.includes('鍑嗙偣') ||
    text.includes('鎻愬墠') ||
    text === 'On-time' ||
    text === 'Early'
  ) return 'onTime';
  if (text.includes('轻微') || text.includes('杞诲井') || text === 'Light') return 'light';
  if (text.includes('中度') || text.includes('涓害') || text === 'Moderate') return 'moderate';
  if (text.includes('缺失') || text.includes('缂哄け') || text === 'Missing Data') return 'missing';
  return 'severe';
}
