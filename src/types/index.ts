// ==============================================================================
// 类型定义
// ==============================================================================

// 通用类型
export interface ApiResponse<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// 模块1：总览 Dashboard
export interface SummaryStats {
  totalFlights: number;
  avgDepDelay: number;
  avgArrDelay: number;
  medianDepDelay: number;
  medianArrDelay: number;
  depOnTimeRate: number;
  arrOnTimeRate: number;
  severeDelayRate: number;
  extremeDelayRate: number;
  avgAirTime: number;
  avgDistance: number;
  avgSpeed: number;
}

export interface HourlyTrend {
  hour: number;
  flightCount: number;
  avgDepDelay: number;
  avgArrDelay: number;
  maxDepDelay: number;
  severeDelayCount: number;
  severeDelayRate: number;
}

export interface Destination {
  dest: string;
  dest_name: string;
  flightCount: number;
  avgArrDelay: number;
  avgDepDelay: number;
  onTimeRate: number;
  avgDistance: number;
  rank?: number;
}

export interface Airline {
  carrier: string;
  carrier_name: string;
  flightCount: number;
  avgDepDelay: number;
  avgArrDelay: number;
  onTimeRate: number;
  severeDelayRate: number;
  rank?: number;
}

export interface HeatmapData {
  hour: number;
  weekday: number;
  avgDelay: number;
  flightCount: number;
  weekdayName?: string;
}

export interface OntimePie {
  category: string;
  count: number;
  percentage: number;
}

// 模块2：时间规律
export interface TimeConclusions {
  morningAvgDelay: number;
  afternoonAvgDelay: number;
  eveningAvgDelay: number;
  afternoonIncrease: number;
  eveningIncrease: number;
  maxVarMonth: string;
  worstHour: number;
  bestHour: number;
  worstWeekday: string;
  bestWeekday: string;
}

// 模块3：航线分析
export interface RouteData {
  origin: string;
  dest: string;
  route: string;
  flightCount: number;
  avgDepDelay: number;
  avgArrDelay: number;
  avgDistance: number;
}

export interface BubbleData {
  dest: string;
  dest_name: string;
  dest_lat: number;
  dest_lon: number;
  flightCount: number;
  avgArrDelay: number;
  avgDistance: number;
  severeDelayRate: number;
}

// 模块4：空中追回
export interface RecoveryStats {
  totalHighDelayFlights: number;
  avgDepDelay: number;
  avgArrDelay: number;
  avgRecovery: number;
  medianRecovery: number;
  recoveryRate: number;
  fullRecoveryRate: number;
  avgSpeed: number;
  avgAirTime: number;
}

export interface RecoveryScatter {
  dep_delay: number;
  arr_delay: number;
  speed_mph: number;
  recovery_minutes: number;
  carrier: string;
  distance_group: string;
}

// 模块5：航司表现
export interface AirlineStats {
  carrier: string;
  carrier_name: string;
  flightCount: number;
  planeCount: number;
  destCount: number;
  routeCount: number;
  avgDepDelay: number;
  avgArrDelay: number;
  medianDepDelay: number;
  maxDepDelay: number;
  severeDelayRate: number;
  extremeDelayRate: number;
  onTimeRate: number;
  avgDistance: number;
  avgAirTime: number;
}

export interface QuadrantData {
  carrier: string;
  carrier_name: string;
  planeCount: number;
  onTimeRate: number;
  flightCount: number;
  quadrant: string;
}

// 模块6：延误传导
export interface PropagationStats {
  totalChains: number;
  avgPrevArrDelay: number;
  avgNextDepDelay: number;
  prevDelayedNextOnTime: number;
  prevDelayedNextDelayed: number;
  correlation: number;
  avgTasksPerDay: number;
}

export interface SankeyNode {
  name: string;
}

export interface SankeyLink {
  source: number;
  target: number;
  value: number;
}

// 模块7：延误归因
export interface AgeAnalysis {
  plane_age_group: string;
  flightCount: number;
  avgDepDelay: number;
  avgArrDelay: number;
  severeDelayRate: number;
  onTimeRate: number;
  avgPlaneAge: number;
}

export interface WeatherAnalysis {
  weather_condition: string;
  flightCount: number;
  avgDepDelay: number;
  avgArrDelay: number;
  severeDelayRate: number;
  onTimeRate: number;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
}

// 模块8：数据探索
export interface FlightDetail {
  year: number;
  month: number;
  day: number;
  date: string;
  airlineCode: string;
  airlineName: string;
  flightNumber: number;
  aircraftId: string;
  departureAirport: string;
  departureAirportName: string;
  arrivalAirport: string;
  arrivalAirportName: string;
  route: string;
  departureDelay: number;
  arrivalDelay: number;
  flightTime: number;
  flightDistance: number;
  flightSpeed: number;
  aircraftAge: number;
  aircraftAgeGroup: string;
  aircraftManufacturer: string;
  aircraftModel: string;
  weather_condition: string;
  delayLevel: string;
}

export interface FilterOption {
  [key: string]: string | number;
  count: number;
}

// Tab 导航
export interface TabItem {
  id: string;
  name: string;
  icon: string;
}
