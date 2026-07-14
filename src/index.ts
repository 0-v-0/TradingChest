import { registerOverlay, registerIndicator } from 'klinecharts'
import chartTypes from './chartType'
import DefaultDatafeed from './DefaultDatafeed'
import overlays from './extension'
import { load } from './i18n'
import tradeVisualization from './indicator/trade/tradeVisualization'
import KLineChartPro from './KLineChartPro'
import './index.css'
import type {
  Datafeed,
  SymbolInfo,
  Period,
  DatafeedSubscribeCallback,
  ChartProOptions,
  ChartPro,
} from './types'

overlays.forEach((o) => {
  registerOverlay(o)
})
chartTypes.forEach((ct) => {
  registerIndicator(ct)
})
registerIndicator(tradeVisualization)

import { exportToCSV, exportAllToCSV, exportScreenshot } from './export'
import { indicatorCategories, indicatorRegistry } from './indicator'
import { saveLayout, loadLayout, deleteLayout, listLayouts } from './persistence'
import KeyboardShortcutManager from './shortcut'
// 新模块导出
import { themePresets, getThemeByName } from './theme'

export {
  DefaultDatafeed,
  KLineChartPro,
  load as loadLocales,
  // 主题
  themePresets,
  getThemeByName,
  // 数据导出
  exportToCSV,
  exportAllToCSV,
  exportScreenshot,
  // 布局持久化
  saveLayout,
  loadLayout,
  deleteLayout,
  listLayouts,
  // 快捷键
  KeyboardShortcutManager,
  // 指标分类
  indicatorCategories,
  // 懒加载注册表
  indicatorRegistry,
}

export type { Datafeed, SymbolInfo, Period, DatafeedSubscribeCallback, ChartProOptions, ChartPro }

export type { ThemePreset } from './theme'
export type { ChartLayout } from './persistence'
export type { ShortcutBinding } from './shortcut'
export type { IndicatorClickEvent } from './types'
export { AlertManager } from './alert'
export type { AlertConfig, AlertEvent } from './alert/types'
export { normalizeToPercent } from './compare'
export { ReplayEngine } from './replay/ReplayEngine'
export type { ReplayState, ReplaySpeed } from './replay/types'
export {
  getTradeVisHitTargets,
  cleanupTradeVisInstance,
  defaultTradeVisColors,
  darkTradeVisColors,
} from './indicator/trade/tradeVisualization'
export type { TradeRecord, TradeVisExtendData, TradeVisColors } from './indicator/trade/tradeVisualization'
export type { ConnectionState } from './DefaultDatafeed'
export { LiveSharpeChart, type LiveSharpeChartProps } from './widget/LiveSharpeChart'
export { DrawdownAreaChart, type DrawdownAreaChartProps } from './widget/DrawdownAreaChart'
