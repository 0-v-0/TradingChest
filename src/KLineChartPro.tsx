import {
  utils,
  registerIndicator,
  registerOverlay,
  type Nullable,
  type DeepPartial,
  type Styles,
  type KLineData,
  type OverlayCreate,
  type OverlayTemplate,
  type OverlayFilter,
  type Overlay,
} from 'klinecharts'
import { render } from 'solid-js/web'

import type { ChartIndicatorCreate } from './types'
import type { AlertConfig } from './alert/types'
import { AlertManager } from './alert'
import ChartProComponent from './ChartProComponent'
import { normalizeToPercent } from './compare'
import { findNearestIndex } from './core/findNearestIndex'
import { exportToCSV, exportAllToCSV, exportScreenshot } from './export'
import { load as loadLocale } from './i18n'
import {
  type TradeRecord,
  getTradeVisHitTargets,
  cleanupTradeVisInstance,
} from './indicator/trade/tradeVisualization'
import { ReplayEngine } from './replay/ReplayEngine'
import KeyboardShortcutManager from './shortcut'
import { createDefaultActions, type ShortcutActionContext } from './shortcut/actions'
import { UndoRedoManager } from './shortcut/undoRedo'
import type { SymbolInfo, Period, ChartPro, ChartProOptions } from './types'
import { MAIN_PANE_ID, COLOR_ALERT } from './types'

const DEFAULT_PERIODS: Period[] = [
  { multiplier: 1, timespan: 'minute' as const, text: '1m' },
  { multiplier: 5, timespan: 'minute' as const, text: '5m' },
  { multiplier: 15, timespan: 'minute' as const, text: '15m' },
  { multiplier: 1, timespan: 'hour' as const, text: '1H' },
  { multiplier: 2, timespan: 'hour' as const, text: '2H' },
  { multiplier: 4, timespan: 'hour' as const, text: '4H' },
  { multiplier: 1, timespan: 'day' as const, text: 'D' },
  { multiplier: 1, timespan: 'week' as const, text: 'W' },
  { multiplier: 1, timespan: 'month' as const, text: 'M' },
  { multiplier: 1, timespan: 'year' as const, text: 'Y' },
]

/** Lazy eager-registration for built-in overlays, chart types, and trade visualization.
 *  Called once on first KLineChartPro instantiation to avoid paying the cost at module load. */
let _coreRegistered = false
async function ensureCoreRegistered(): Promise<void> {
  if (_coreRegistered) return
  _coreRegistered = true
  const [overlays, chartTypes, tradeVisualization] = await Promise.all([
    import('./extension'),
    import('./chartType'),
    import('./indicator/trade/tradeVisualization'),
  ])
  overlays.default.forEach(registerOverlay)
  chartTypes.default.forEach(registerIndicator)
  registerIndicator(tradeVisualization.default)
}

/** Hit detection radius for trade visualization click (px) */
const TRADE_HIT_RADIUS = 40

export default class KLineChartPro implements ChartPro {
  /** Pre-load locale data before creating an instance (avoids initial flash of untranslated keys) */
  static async preloadLocale(locale: string): Promise<void> {
    await loadLocale(locale)
  }

  constructor(options: ChartProOptions) {
    // Fire-and-forget: eagerly register core overlays/chart types/tradeVis on first instantiation
    ensureCoreRegistered()
    this.#initContainer(options)
    this.#initSolidRender(options)
    this.#datafeed = options.datafeed
    this.#initTradeVisClickHandler(options)
    if (options.onAlertTrigger) {
      this.#alertManager.onTrigger = options.onAlertTrigger
    }
    this.#undoRedoManager = new UndoRedoManager()
    this.#initShortcutManager()
  }

  /** 1. 解析并设置容器元素 */
  #initContainer(options: ChartProOptions): void {
    if (utils.isString(options.container)) {
      this.#container = document.getElementById(options.container as string)
      if (!this.#container) {
        throw new Error('Container is null')
      }
    } else {
      this.#container = options.container as HTMLElement
    }
    this.#container.classList.add('klinecharts-pro')
    this.#container.setAttribute('data-theme', options.theme ?? 'light')
  }

  /** 2. Solid.js 渲染 ChartProComponent */
  #initSolidRender(options: ChartProOptions): void {
    this.#solidDispose = render(
      () => (
        <ChartProComponent
          ref={(chart: ChartPro) => {
            this.#chartApi = chart
          }}
          styles={options.styles ?? {}}
          watermark={options.watermark ?? ''}
          theme={options.theme ?? 'light'}
          lang={options.locale ?? 'zh-CN'}
          drawingBarVisible={options.drawingBarVisible ?? true}
          symbol={options.symbol}
          period={options.period}
          periods={options.periods ?? DEFAULT_PERIODS}
          timezone={options.timezone ?? 'Asia/Shanghai'}
          mainIndicators={options.mainIndicators ?? ['MA']}
          subIndicators={options.subIndicators ?? ['VOL']}
          datafeed={options.datafeed}
          onPeriodChange={options.onPeriodChange ?? (() => {})}
          onIndicatorClick={options.onIndicatorClick ?? (() => {})}
          onOverlayCreate={options.onOverlayCreate ?? (() => {})}
          onOverlayUpdate={options.onOverlayUpdate ?? (() => {})}
          onOverlayDelete={options.onOverlayDelete ?? (() => {})}
          onPriceUpdate={(price: number) => {
            this.#alertManager.checkPrice(price, Date.now())
          }}
          onDataReset={() => {
            this.#alertManager.resetPrevPrice()
            this.#clearComparisons()
          }}
          onError={options.onError}
          undoRedoManager={this.#undoRedoManager}
        />
      ),
      this.#container!,
    ) as () => void
  }

  /** 3. TradeVis 交易标签点击检测 */
  #initTradeVisClickHandler(options: ChartProOptions): void {
    const onIndClick = options.onIndicatorClick
    this.#clickTarget = this.#container!
    this.#clickHandler = (e: Event) => {
      const me = e as MouseEvent
        // hitTargets 的 x/y 是 pane canvas 内部坐标（xAxis/yAxis.convertToPixel）
        // 用 event.target（canvas）的 rect 匹配坐标系
      const target = me.target as HTMLElement
      const rect = target.getBoundingClientRect()
      const clickX = me.clientX - rect.left
      const clickY = me.clientY - rect.top

        // 从实例级 hitTargets 查找最近的交易标签
      const hitTargets = getTradeVisHitTargets(this.#instanceId)
      let closest: { x: number; y: number; trade: TradeRecord; type: string } | null = null
      let minDist = Infinity
      for (const ht of hitTargets) {
        const dx = clickX - ht.x
        const dy = clickY - ht.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < TRADE_HIT_RADIUS && dist < minDist) {
          minDist = dist
          closest = ht
        }
      }

      if (closest && onIndClick) {
        onIndClick({
          indicatorName: 'TradeVis',
          data: { ...closest.trade, type: closest.type },
          x: clickX,
          y: clickY,
        })
      }
    }
    this.#container!.addEventListener('click', this.#clickHandler, true)
  }

  /** 4. 初始化快捷键管理器 */
  #initShortcutManager(): void {
    this.#shortcutManager = new KeyboardShortcutManager()
    const ctx: ShortcutActionContext = {
      getChart: () => this.getChart(),
      zoom: (f) => this.#zoom(f),
      undo: () => this.#undoRedoManager.undo(),
      redo: () => this.#undoRedoManager.redo(),
      exportScreenshot: (o) => this.exportScreenshot(o),
    }
    this.#shortcutManager.registerActions(createDefaultActions(ctx))
    this.#shortcutManager.bindTo(this.#container!)
  }

  #container!: Nullable<HTMLElement>

  #chartApi: Nullable<ChartPro> = null

  #shortcutManager!: KeyboardShortcutManager
  #undoRedoManager!: UndoRedoManager

  #comparisons = new Map<string, string>() // ticker → indicatorName

  #datafeed: import('./types').Datafeed

  #alertManager: AlertManager = new AlertManager()

  #instanceId = `tc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

  #disposed = false
  #solidDispose?: (() => void)
  #clickHandler?: ((e: Event) => void)
  #clickTarget?: Element

  /** Throws if called before Solid.js render completes or after dispose. */
  #api(): ChartPro {
    if (this.#disposed) {
      throw new Error(
        '[TradingChest] Instance has been disposed. Create a new instance to continue.',
      )
    }
    if (!this.#chartApi) {
      throw new Error(
        '[TradingChest] Chart not initialized yet. Wait for render to complete before calling API methods.',
      )
    }
    return this.#chartApi
  }

  /** Throws if instance is disposed. For methods that don't need _chartApi. */
  #assertNotDisposed(): void {
    if (this.#disposed) {
      throw new Error(
        '[TradingChest] Instance has been disposed. Create a new instance to continue.',
      )
    }
  }

  /** Zoom the chart by factor, centering on the viewport midpoint */
  #zoom(factor: number): void {
    const chart = this.getChart()
    if (chart) {
      const size = chart.getSize()
      chart.zoomAtCoordinate(factor, { x: size?.width ? size.width / 2 : 400, y: size?.height ? size.height / 2 : 300 })
    }
  }

  createOverlay(value: string | OverlayCreate | Array<string | OverlayCreate>) {
    return this.#api().createOverlay(value)
  }

  getOverlays(id?: OverlayFilter): Overlay[] {
    return this.#api().getOverlays(id)
  }

  removeOverlay(value?: OverlayFilter): boolean {
    return this.#api().removeOverlay(value)
  }

  registerOverlay(template: OverlayTemplate): void {
    return this.#api().registerOverlay(template)
  }

  setTheme(theme: string): void {
    this.#container?.setAttribute('data-theme', theme)
    this.#api().setTheme(theme)
  }

  getTheme(): string {
    return this.#api().getTheme()
  }

  setStyles(styles: DeepPartial<Styles>): void {
    this.#api().setStyles(styles)
  }

  getStyles(): Styles {
    return this.#api().getStyles()
  }

  setLocale(locale: string): void {
    this.#api().setLocale(locale)
  }

  getLocale(): string {
    return this.#api().getLocale()
  }

  setTimezone(timezone: string): void {
    this.#api().setTimezone(timezone)
  }

  getTimezone(): string {
    return this.#api().getTimezone()
  }

  setSymbol(symbol: SymbolInfo): void {
    this.#api().setSymbol(symbol)
  }

  getSymbol(): SymbolInfo {
    return this.#api().getSymbol()
  }

  setPeriod(period: Period): void {
    this.#api().setPeriod(period)
  }

  getPeriod(): Period {
    return this.#api().getPeriod()
  }

  getChart() {
    return this.#api().getChart()
  }

  exportCSV(filename?: string): void {
    exportToCSV(this.getChart(), filename)
  }

  exportAllCSV(filename?: string): void {
    exportAllToCSV(this.getChart(), filename)
  }

  exportScreenshot(options?: {
    format?: 'png' | 'jpeg'
    backgroundColor?: string
    filename?: string
  }): void {
    exportScreenshot(this.getChart(), options)
  }

  getShortcutManager(): KeyboardShortcutManager {
    return this.#shortcutManager
  }

  createTradeVisualization(trades: TradeRecord[], paneOptions?: Record<string, unknown>): void {
    const chart = this.getChart()
    if (!chart) return
    chart.createIndicator(
      {
        name: 'TradeVis',
        extendData: { trades, _instanceId: this.#instanceId },
        paneId: (paneOptions as { id?: string })?.id ?? MAIN_PANE_ID,
      } as ChartIndicatorCreate,
      true,
    )
  }

  addAlert(config: AlertConfig): void {
    this.#assertNotDisposed()
    this.#alertManager.addAlert(config)
    const chart = this.getChart()
    if (chart) {
      chart.createOverlay({
        name: 'alertLine',
        id: `alert_${config.id}`,
        points: [{ value: config.price }],
        styles: { line: { color: config.color ?? COLOR_ALERT } },
        lock: true,
      })
    }
  }

  updateAlert(id: string, updates: Partial<Omit<AlertConfig, 'id'>>): boolean {
    this.#assertNotDisposed()
    const updated = this.#alertManager.updateAlert(id, updates)
    if (updated && updates.price !== undefined) {
      const chart = this.getChart()
      if (chart) {
        chart.removeOverlay({ id: `alert_${id}` })
        const alert = this.#alertManager.getAlert(id)
        if (alert) {
          chart.createOverlay({
            name: 'alertLine',
            id: `alert_${id}`,
            points: [{ value: alert.price }],
            styles: { line: { color: updates.color ?? alert.color ?? COLOR_ALERT } },
            lock: true,
          })
        }
      }
    }
    return updated
  }

  removeAlert(id: string): void {
    this.#assertNotDisposed()
    this.#alertManager.removeAlert(id)
    this.getChart()?.removeOverlay({ id: `alert_${id}` })
  }

  getAlerts(): AlertConfig[] {
    this.#assertNotDisposed()
    return this.#alertManager.getAlerts()
  }

  #clearComparisons(): void {
    for (const [, indicatorName] of this.#comparisons) {
      try {
        this.getChart()?.removeIndicator({ paneId: MAIN_PANE_ID, name: indicatorName })
      } catch {
        /* already disposing */
      }
    }
    this.#comparisons.clear()
  }

  /**
   * Add comparison overlay for another symbol.
   * Known limitation: comparison data is fetched once and not updated with new ticks.
   */
  async addComparison(symbol: SymbolInfo): Promise<void> {
    this.#assertNotDisposed()
    // 防止重复添加同一品种（先移除旧的）
    if (this.#comparisons.has(symbol.ticker)) {
      this.removeComparison(symbol.ticker)
    }
    const chart = this.getChart()
    if (!chart) return

    const p = this.getPeriod()
    const mainData = chart.getDataList()
    if (mainData.length === 0) return

    const from = mainData[0].timestamp
    const to = mainData[mainData.length - 1].timestamp
    const compData = await this.#datafeed.getHistoryKLineData(symbol, p, from, to)

    if (this.#disposed) return
    if (compData.length === 0) return

    const compPercent = normalizeToPercent(compData)
    const compTimestamps: number[] = new Array(compData.length)
    const compMap = new Map<number, number>()
    compData.forEach((d, i) => {
      compMap.set(d.timestamp, compPercent[i])
      compTimestamps[i] = d.timestamp
    })

    // Pre-build a lookup from mainData timestamps to comp percent values,
    // including nearest-timestamp resolution within 60s tolerance.
    // This avoids O(n²) binary search inside calc().
    const mainLookup = new Map<number, number | undefined>()
    for (const d of mainData) {
      let pct = compMap.get(d.timestamp)
      if (pct === undefined) {
        const idx = findNearestIndex(compTimestamps, d.timestamp, 60000)
        if (idx >= 0) {
          pct = compMap.get(compTimestamps[idx])
        }
      }
      mainLookup.set(d.timestamp, pct)
    }

    const indicatorName = `COMPARE_${symbol.ticker.replace(/[^A-Z0-9]/g, '_')}`
    registerIndicator({
      name: indicatorName,
      shortName: symbol.shortName ?? symbol.ticker,
      figures: [{ key: 'pct', title: `${symbol.ticker}: `, type: 'line' }],
      calc: (dataList: KLineData[]) => {
        return dataList.map((d: KLineData) => {
          return { pct: mainLookup.get(d.timestamp) }
        })
      },
    })

    chart.createIndicator({ name: indicatorName, paneId: MAIN_PANE_ID }, true)
    this.#comparisons.set(symbol.ticker, indicatorName)
  }

  removeComparison(ticker: string): void {
    this.#assertNotDisposed()
    const indicatorName = this.#comparisons.get(ticker)
    if (indicatorName) {
      this.getChart()?.removeIndicator({ paneId: MAIN_PANE_ID, name: indicatorName })
      this.#comparisons.delete(ticker)
    }
  }

  startReplay(startPosition?: number): void {
    this.#api().startReplay(startPosition)
  }

  stopReplay(): void {
    this.#api().stopReplay()
  }

  getReplayEngine(): ReplayEngine | null {
    return this.#api().getReplayEngine()
  }

  feedPrice(price: number): void {
    if (this.#disposed) return // feedPrice 静默忽略，不抛异常
    this.#alertManager.checkPrice(price, Date.now())
  }

  dispose(): void {
    if (this.#disposed) return // 幂等：重复调用安全
    this.#disposed = true
    // 1. Stop replay (safe — ChartProComponent.onCleanup also handles this)
    if (this.#chartApi) {
      try {
        this.#chartApi.stopReplay()
      } catch {
        /* already disposing */
      }
    }
    // 2. Remove comparisons
    this.#clearComparisons()
    // 3. Clear alerts & TradeVis instance data
    this.#alertManager.clearAll()
    this.#alertManager.onTrigger = undefined
    cleanupTradeVisInstance(this.#instanceId)
    // 4. Unbind shortcuts & clear undo/redo
    this.#shortcutManager.unbind()
    this.#undoRedoManager.clear()
    // 5. Remove click listener
    if (this.#clickHandler && this.#clickTarget) {
      this.#clickTarget.removeEventListener('click', this.#clickHandler, true)
      this.#clickHandler = undefined
      this.#clickTarget = undefined
    }
    // 6. Unmount Solid.js render tree (triggers onCleanup → unsubscribe datafeed)
    if (this.#solidDispose) {
      this.#solidDispose()
      this.#solidDispose = undefined
    }
    // 7. Release datafeed resources (WebSocket etc.) — wrap in try to avoid blocking cleanup
    try {
      this.#datafeed.dispose?.()
    } catch {
      /* datafeed cleanup failure must not prevent container/chart release */
    }
    // 8. Clean container and reset refs — always executed
    this.#container?.classList.remove('klinecharts-pro')
    this.#container?.removeAttribute('data-theme')
    this.#chartApi = null
  }
}
