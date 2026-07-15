import type { Overlay, KLineData, Styles, DeepPartial, Chart, OverlayTemplate, Nullable } from 'klinecharts'

// ─── Project-wide constants ───────────────────────────────────────────

/** klinecharts 主图 pane ID */
export const MAIN_PANE_ID = 'candle_pane'

/** Trend / up color (green) */
export const COLOR_UP = '#26a69a'
/** Trend / down color (red) */
export const COLOR_DOWN = '#ef5350'
/** Primary accent (blue) */
export const COLOR_PRIMARY = '#1677ff'
/** Alert / warning accent (orange) */
export const COLOR_ALERT = '#ff9800'
/** Forecast / secondary blue */
export const COLOR_FORECAST = '#3498db'
/** Neutral gray (kagi flat segments) */
export const COLOR_NEUTRAL = '#999999'

/** Up color with alpha variants */
export const COLOR_UP_ALPHA_12 = 'rgba(38, 166, 154, 0.12)'
export const COLOR_UP_ALPHA_15 = 'rgba(38, 166, 154, 0.15)'
export const COLOR_UP_ALPHA_40 = 'rgba(38, 166, 154, 0.4)'
export const COLOR_UP_ALPHA_50 = 'rgba(38, 166, 154, 0.5)'
export const COLOR_UP_ALPHA_60 = 'rgba(38, 166, 154, 0.6)'
export const COLOR_UP_ALPHA_80 = 'rgba(38, 166, 154, 0.8)'
export const COLOR_UP_ALPHA_90 = 'rgba(38, 166, 154, 0.9)'
export const COLOR_UP_ALPHA_95 = 'rgba(38, 166, 154, 0.95)'

/** Down color with alpha variants */
export const COLOR_DOWN_ALPHA_12 = 'rgba(239, 83, 80, 0.12)'
export const COLOR_DOWN_ALPHA_15 = 'rgba(239, 83, 80, 0.15)'
export const COLOR_DOWN_ALPHA_40 = 'rgba(239, 83, 80, 0.4)'
export const COLOR_DOWN_ALPHA_50 = 'rgba(239, 83, 80, 0.5)'
export const COLOR_DOWN_ALPHA_60 = 'rgba(239, 83, 80, 0.6)'
export const COLOR_DOWN_ALPHA_80 = 'rgba(239, 83, 80, 0.8)'
export const COLOR_DOWN_ALPHA_90 = 'rgba(239, 83, 80, 0.9)'
export const COLOR_DOWN_ALPHA_95 = 'rgba(239, 83, 80, 0.95)'

/** Primary color with alpha variants */
export const COLOR_PRIMARY_ALPHA_15 = 'rgba(22, 119, 255, 0.15)'
import type KeyboardShortcutManager from './shortcut'
import type { AlertConfig, AlertEvent } from './alert/types'

/** 交易方向 */
export type Direction = 'long' | 'short'

/** 支持的时间周期 */
export type TimespanUnit = 'ms' | 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year'

export interface SymbolInfo {
  ticker: string
  name?: string
  shortName?: string
  exchange?: string
  market?: string
  pricePrecision?: number
  volumePrecision?: number
  priceCurrency?: string
  type?: string
  logo?: string
}

export interface Period {
  multiplier: number
  timespan: TimespanUnit
  text: string
}

export type DatafeedSubscribeCallback = (data: KLineData) => void

export interface Datafeed {
  searchSymbols(search?: string): Promise<SymbolInfo[]>
  getHistoryKLineData(
    symbol: SymbolInfo,
    period: Period,
    from: number,
    to: number,
  ): Promise<KLineData[]>
  subscribe(symbol: SymbolInfo, period: Period, callback: DatafeedSubscribeCallback): void
  unsubscribe(symbol: SymbolInfo, period: Period): void
  /** 释放 datafeed 持有的资源（如 WebSocket 连接）。可选实现。 */
  dispose?(): void
}

/** 指标图形点击事件 */
export interface IndicatorClickEvent {
  /** 指标名称 */
  indicatorName: string
  /** 点击的图形数据（TradeRecord + type） */
  data: Record<string, unknown>
  /** 点击像素坐标（相对于 widget） */
  x: number
  y: number
}

export type OverlayLifecycleSource = 'drawing-bar' | 'property-bar' | 'keyboard' | 'programmatic'

export type OverlaySnapshot = Pick<
  Overlay,
  'id' | 'groupId' | 'name' | 'points' | 'extendData' | 'styles' | 'lock' | 'visible'
>

export interface OverlayLifecycleEvent {
  overlay: OverlaySnapshot
  source: OverlayLifecycleSource
}

export interface ChartProOptions {
  container: string | HTMLElement
  styles?: DeepPartial<Styles>
  watermark?: string | Node
  theme?: string
  locale?: string
  drawingBarVisible?: boolean
  symbol: SymbolInfo
  period: Period
  periods?: Period[]
  timezone?: string
  mainIndicators?: string[]
  subIndicators?: string[]
  datafeed: Datafeed
  /** 周期切换回调 */
  onPeriodChange?: (period: Period) => void
  /** 指标图形被点击时的回调 */
  onIndicatorClick?: (event: IndicatorClickEvent) => void
  /** 绘图 overlay 创建完成时的回调 */
  onOverlayCreate?: (event: OverlayLifecycleEvent) => void
  /** 绘图 overlay 被移动或属性变更时的回调 */
  onOverlayUpdate?: (event: OverlayLifecycleEvent) => void
  /** 绘图 overlay 被删除时的回调 */
  onOverlayDelete?: (event: OverlayLifecycleEvent) => void
  /** 报警触发时的回调 */
  onAlertTrigger?: (event: AlertEvent) => void
  /** 内部错误回调（数据加载失败、指标初始化失败等） */
  onError?: (error: { type: string; message: string; raw?: unknown }) => void
}

export interface ChartPro {
  createOverlay: Chart['createOverlay']
  getOverlays: Chart['getOverlays']
  removeOverlay: Chart['removeOverlay']
  registerOverlay(template: OverlayTemplate): void
  setTheme(theme: string): void
  getTheme(): string
  setStyles(styles: DeepPartial<Styles>): void
  getStyles(): Styles
  setLocale(locale: string): void
  getLocale(): string
  setTimezone(timezone: string): void
  getTimezone(): string
  setSymbol(symbol: SymbolInfo): void
  getSymbol(): SymbolInfo
  setPeriod(period: Period): void
  getPeriod(): Period
  /** 获取内部 klinecharts Chart 实例，用于自定义 overlay 操作 */
  getChart(): Nullable<Chart>
  /** 导出可见区间数据为 CSV */
  exportCSV(filename?: string): void
  /** 导出全部数据为 CSV */
  exportAllCSV(filename?: string): void
  /** 导出截图 */
  exportScreenshot(options?: {
    format?: 'png' | 'jpeg'
    backgroundColor?: string
    filename?: string
  }): void
  /** 获取快捷键管理器 */
  getShortcutManager(): KeyboardShortcutManager
  /** 添加报警线 */
  addAlert(config: AlertConfig): void
  /** 更新报警配置（保留触发状态） */
  updateAlert(
    id: string,
    updates: Partial<Omit<AlertConfig, 'id'>>,
  ): boolean
  /** 移除报警线 */
  removeAlert(id: string): void
  /** 获取所有报警 */
  getAlerts(): AlertConfig[]
  /** 添加对比品种（归一化为百分比变化叠加在主图） */
  addComparison(symbol: SymbolInfo): Promise<void>
  /** 移除对比品种 */
  removeComparison(ticker: string): void
  /** 进入回放模式 */
  startReplay(startPosition?: number): void
  /** 退出回放模式 */
  stopReplay(): void
  /** 获取回放引擎 */
  getReplayEngine(): import('./replay/ReplayEngine').ReplayEngine | null
  /** 创建交易可视化指标（自动连接点击检测） */
  createTradeVisualization(
    trades: import('./indicator/trade/tradeVisualization').TradeRecord[],
    paneOptions?: Record<string, unknown>,
  ): void
  /** 向报警系统传入最新价格（实时数据到达时调用） */
  feedPrice(price: number): void
  /** 销毁图表实例，释放所有资源。调用后实例不可再使用。 */
  dispose(): void
}
