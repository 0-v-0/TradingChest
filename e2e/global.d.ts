import type KLineChartPro from '../src/KLineChartPro'
import type { SymbolInfo, Period, OverlayLifecycleEvent } from '../src/types'
import type { AlertEvent } from '../src/alert/types'
import type { KLineData } from 'klinecharts'

declare global {
  var chartInstance: KLineChartPro
  var staticData: KLineData[]
  var ethData: KLineData[]
  var mockSymbol: SymbolInfo
  var mockPeriod: Period
  var alertEvents: AlertEvent[]
  var overlayEvents: (OverlayLifecycleEvent & { type: 'create' | 'update' | 'delete' })[]
}
