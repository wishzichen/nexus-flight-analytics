export const FIELD_DEFINITIONS = [
  {
    fid: 'year',
    labels: { zh: '年份', en: 'Year' },
    description: { zh: '航班所属年份', en: 'Flight year' },
    semanticType: 'ordinal',
    analyticType: 'dimension',
  },
  {
    fid: 'month',
    labels: { zh: '月份', en: 'Month' },
    description: { zh: '航班所属月份', en: 'Flight month' },
    semanticType: 'ordinal',
    analyticType: 'dimension',
  },
  {
    fid: 'day',
    labels: { zh: '日期', en: 'Day' },
    description: { zh: '月内日期', en: 'Day of month' },
    semanticType: 'ordinal',
    analyticType: 'dimension',
  },
  {
    fid: 'hour',
    labels: { zh: '小时', en: 'Hour' },
    description: { zh: '计划起飞小时', en: 'Scheduled departure hour' },
    semanticType: 'ordinal',
    analyticType: 'dimension',
  },
  {
    fid: 'weekday',
    labels: { zh: '星期序号', en: 'Weekday Index' },
    description: { zh: '周一为 1，周日为 7', en: 'Monday is 1 and Sunday is 7' },
    semanticType: 'ordinal',
    analyticType: 'dimension',
  },
  {
    fid: 'weekdayName',
    labels: { zh: '星期', en: 'Weekday' },
    description: { zh: '航班出发星期', en: 'Departure weekday' },
    semanticType: 'nominal',
    analyticType: 'dimension',
  },
  {
    fid: 'airlineCode',
    labels: { zh: '航司代码', en: 'Airline Code' },
    description: { zh: '航空公司两字代码', en: 'Carrier code' },
    semanticType: 'nominal',
    analyticType: 'dimension',
  },
  {
    fid: 'airlineName',
    labels: { zh: '航空公司', en: 'Airline' },
    description: { zh: '航空公司名称', en: 'Carrier name' },
    semanticType: 'nominal',
    analyticType: 'dimension',
  },
  {
    fid: 'flightNumber',
    labels: { zh: '航班号', en: 'Flight Number' },
    description: { zh: '航班编号', en: 'Flight number' },
    semanticType: 'nominal',
    analyticType: 'dimension',
  },
  {
    fid: 'aircraftId',
    labels: { zh: '飞机编号', en: 'Aircraft ID' },
    description: { zh: '尾号或飞机编号', en: 'Tail number or aircraft id' },
    semanticType: 'nominal',
    analyticType: 'dimension',
  },
  {
    fid: 'departureAirport',
    labels: { zh: '出发机场', en: 'Origin Airport' },
    description: { zh: '出发机场代码', en: 'Origin airport code' },
    semanticType: 'nominal',
    analyticType: 'dimension',
  },
  {
    fid: 'departureAirportName',
    labels: { zh: '出发机场名称', en: 'Origin Airport Name' },
    description: { zh: '出发机场完整名称', en: 'Origin airport name' },
    semanticType: 'nominal',
    analyticType: 'dimension',
  },
  {
    fid: 'arrivalAirport',
    labels: { zh: '目的机场', en: 'Destination Airport' },
    description: { zh: '到达机场代码', en: 'Destination airport code' },
    semanticType: 'nominal',
    analyticType: 'dimension',
  },
  {
    fid: 'arrivalAirportName',
    labels: { zh: '目的机场名称', en: 'Destination Airport Name' },
    description: { zh: '到达机场完整名称', en: 'Destination airport name' },
    semanticType: 'nominal',
    analyticType: 'dimension',
  },
  {
    fid: 'route',
    labels: { zh: '航线', en: 'Route' },
    description: { zh: '出发机场到目的机场的航线', en: 'Origin to destination route' },
    semanticType: 'nominal',
    analyticType: 'dimension',
  },
  {
    fid: 'departureDelay',
    labels: { zh: '起飞延误', en: 'Departure Delay' },
    description: { zh: '实际起飞相对计划起飞的延误分钟数', en: 'Departure delay in minutes' },
    semanticType: 'quantitative',
    analyticType: 'measure',
  },
  {
    fid: 'arrivalDelay',
    labels: { zh: '到达延误', en: 'Arrival Delay' },
    description: { zh: '实际到达相对计划到达的延误分钟数', en: 'Arrival delay in minutes' },
    semanticType: 'quantitative',
    analyticType: 'measure',
  },
  {
    fid: 'flightTime',
    labels: { zh: '飞行时长', en: 'Flight Time' },
    description: { zh: '空中飞行分钟数', en: 'Air time in minutes' },
    semanticType: 'quantitative',
    analyticType: 'measure',
  },
  {
    fid: 'flightDistance',
    labels: { zh: '飞行距离', en: 'Distance' },
    description: { zh: '航段距离，单位为英里', en: 'Flight distance in miles' },
    semanticType: 'quantitative',
    analyticType: 'measure',
  },
  {
    fid: 'flightSpeed',
    labels: { zh: '平均速度', en: 'Average Speed' },
    description: { zh: '估算平均飞行速度，单位 mph', en: 'Estimated average speed in mph' },
    semanticType: 'quantitative',
    analyticType: 'measure',
  },
  {
    fid: 'date',
    labels: { zh: '航班日期', en: 'Flight Date' },
    description: { zh: '航班出发日期', en: 'Flight departure date' },
    semanticType: 'temporal',
    analyticType: 'dimension',
  },
  {
    fid: 'time_period',
    labels: { zh: '运营时段', en: 'Time Period' },
    description: { zh: '按起飞小时划分的运营时段', en: 'Operating period bucket by departure hour' },
    semanticType: 'nominal',
    analyticType: 'dimension',
  },
  {
    fid: 'distance_group',
    labels: { zh: '距离分组', en: 'Distance Group' },
    description: { zh: '按航段距离划分的分组', en: 'Flight distance bucket' },
    semanticType: 'nominal',
    analyticType: 'dimension',
  },
  {
    fid: 'aircraftAge',
    labels: { zh: '机龄', en: 'Aircraft Age' },
    description: { zh: '飞机服役年限', en: 'Aircraft age in years' },
    semanticType: 'quantitative',
    analyticType: 'measure',
  },
  {
    fid: 'aircraftAgeGroup',
    labels: { zh: '机龄分组', en: 'Aircraft Age Group' },
    description: { zh: '按机龄划分的新旧程度', en: 'Aircraft age bucket' },
    semanticType: 'nominal',
    analyticType: 'dimension',
  },
  {
    fid: 'aircraftManufacturer',
    labels: { zh: '制造商', en: 'Manufacturer' },
    description: { zh: '飞机制造商', en: 'Aircraft manufacturer' },
    semanticType: 'nominal',
    analyticType: 'dimension',
  },
  {
    fid: 'aircraftModel',
    labels: { zh: '机型', en: 'Aircraft Model' },
    description: { zh: '飞机型号', en: 'Aircraft model' },
    semanticType: 'nominal',
    analyticType: 'dimension',
  },
  {
    fid: 'weather_condition',
    labels: { zh: '天气状况', en: 'Weather Condition' },
    description: { zh: '出发机场天气状态', en: 'Weather condition at origin' },
    semanticType: 'nominal',
    analyticType: 'dimension',
  },
  {
    fid: 'wind_speed',
    labels: { zh: '风速', en: 'Wind Speed' },
    description: { zh: '出发机场风速', en: 'Wind speed at origin' },
    semanticType: 'quantitative',
    analyticType: 'measure',
  },
  {
    fid: 'visib',
    labels: { zh: '能见度', en: 'Visibility' },
    description: { zh: '出发机场能见度', en: 'Visibility at origin' },
    semanticType: 'quantitative',
    analyticType: 'measure',
  },
  {
    fid: 'precip',
    labels: { zh: '降水量', en: 'Precipitation' },
    description: { zh: '出发机场降水量', en: 'Precipitation at origin' },
    semanticType: 'quantitative',
    analyticType: 'measure',
  },
  {
    fid: 'delayLevel',
    labels: { zh: '延误等级', en: 'Delay Level' },
    description: { zh: '按起飞延误划分的等级', en: 'Delay severity bucket' },
    semanticType: 'nominal',
    analyticType: 'dimension',
  },
];

export const EDA_FIELD_IDS = FIELD_DEFINITIONS.map((field) => field.fid);

export function normalizeLanguage(language) {
  return language === 'en' ? 'en' : 'zh';
}

export function getLocalizedFields(language = 'zh') {
  const lang = normalizeLanguage(language);
  return FIELD_DEFINITIONS.map((field) => ({
    ...field,
    name: field.labels[lang],
    label: field.labels[lang],
    description: field.description[lang],
  }));
}

export function getGraphicWalkerFields(language = 'zh') {
  return getLocalizedFields(language).map((field) => ({
    fid: field.fid,
    name: field.name,
    semanticType: field.semanticType,
    analyticType: field.analyticType,
  }));
}

export function projectFlightRow(row) {
  const result = {};
  for (const field of FIELD_DEFINITIONS) {
    const value = row?.[field.fid];
    if (value !== undefined && value !== null) result[field.fid] = value;
  }
  return result;
}

export function getFieldLabel(fieldId, language = 'zh') {
  const lang = normalizeLanguage(language);
  const field = FIELD_DEFINITIONS.find((item) => item.fid === fieldId);
  return field?.labels?.[lang] || fieldId;
}
