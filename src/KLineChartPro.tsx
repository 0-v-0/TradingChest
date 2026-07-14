import {
  utils,
  registerIndicator,
  type Nullable,
  type DeepPartial,
  type Styles,
  type IndicatorCreate,
  type KLineData,
  type OverlayCreate,
  type OverlayTemplate,
  type OverlayFilter,
  type Overlay,
} from 'klinecharts'
import { render } from 'solid-js/web'
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
import { UndoRedoManager } from './shortcut/undoRedo'
import type { SymbolInfo, Period, ChartPro, ChartProOptions } from './types'

export default class KLineChartPro implements ChartPro {
  /** Pre-load locale data before creating an instance (avoids initial flash of untranslated keys) */
  static async preloadLocale(locale: string): Promise<void> {
    await loadLocale(locale)
  }

  constructor(options: ChartProOptions) {
    this._initContainer(options)
    this._initSolidRender(options)
    this._datafeed = options.datafeed
    this._initTradeVisClickHandler(options)
    if (options.onAlertTrigger) {
      this._alertManager.onTrigger = options.onAlertTrigger
    }
    this._undoRedoManager = new UndoRedoManager()
    this._initShortcutManager()
  }

  /** 1. 解析并设置容器元素 */
  private _initContainer(options: ChartProOptions): void {
    if (utils.isString(options.container)) {
      this._container = document.getElementById(options.container as string)
      if (!this._container) {
        throw new Error('Container is null')
      }
    } else {
      this._container = options.container as HTMLElement
    }
    this._container.classList.add('klinecharts-pro')
    this._container.setAttribute('data-theme', options.theme ?? 'light')
  }

  /** 2. Solid.js 渲染 ChartProComponent */
  private _initSolidRender(options: ChartProOptions): void {
    this._solidDispose = render(
      () => (
        <ChartProComponent
          ref={(chart: ChartPro) => {
            this._chartApi = chart
          }}
          styles={options.styles ?? {}}
          watermark={options.watermark ?? ''}
          theme={options.theme ?? 'light'}
          lang={options.locale ?? 'zh-CN'}
          drawingBarVisible={options.drawingBarVisible ?? true}
          symbol={options.symbol}
          period={options.period}
          periods={
            options.periods ?? [
              { multiplier: 1, timespan: 'minute', text: '1m' },
              { multiplier: 5, timespan: 'minute', text: '5m' },
              { multiplier: 15, timespan: 'minute', text: '15m' },
              { multiplier: 1, timespan: 'hour', text: '1H' },
              { multiplier: 2, timespan: 'hour', text: '2H' },
              { multiplier: 4, timespan: 'hour', text: '4H' },
              { multiplier: 1, timespan: 'day', text: 'D' },
              { multiplier: 1, timespan: 'week', text: 'W' },
              { multiplier: 1, timespan: 'month', text: 'M' },
              { multiplier: 1, timespan: 'year', text: 'Y' },
            ]
          }
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
            this._alertManager.checkPrice(price, Date.now())
          }}
          onDataReset={() => {
            this._alertManager.resetPrevPrice()
            this._clearComparisons()
          }}
          onError={options.onError}
          undoRedoManager={this._undoRedoManager}
        />
      ),
      this._container!,
    ) as () => void
  }

  /** 3. TradeVis 交易标签点击检测 */
  private _initTradeVisClickHandler(options: ChartProOptions): void {
    const onIndClick = options.onIndicatorClick
    this._clickTarget = this._container!
    this._clickHandler = (e: Event) => {
      const me = e as MouseEvent
        // hitTargets 的 x/y 是 pane canvas 内部坐标（xAxis/yAxis.convertToPixel）
        // 用 event.target（canvas）的 rect 匹配坐标系
      const target = me.target as HTMLElement
      const rect = target.getBoundingClientRect()
      const clickX = me.clientX - rect.left
      const clickY = me.clientY - rect.top

        // 从实例级 hitTargets 查找最近的交易标签
      const hitTargets = getTradeVisHitTargets(this._instanceId)
      let closest: { x: number; y: number; trade: TradeRecord; type: string } | null = null
      let minDist = Infinity
      for (const ht of hitTargets) {
        const dx = clickX - ht.x
        const dy = clickY - ht.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 40 && dist < minDist) {
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
    this._container!.addEventListener('click', this._clickHandler, true)
  }

  /** 4. 初始化快捷键管理器 */
  private _initShortcutManager(): void {
    this._shortcutManager = new KeyboardShortcutManager()
    this._shortcutManager.registerActions({
      'nav:scrollToEnd': () => {
        this.getChart()?.scrollToRealTime()
      },
      'nav:scrollToStart': () => {
        this.getChart()?.scrollToDataIndex(0)
      },
      'nav:zoomIn': () => {
        const chart = this.getChart()
        if (chart) {
          const size = chart.getSize()
          chart.zoomAtCoordinate(1.2, { x: size?.width ? size.width / 2 : 400, y: 0 })
        }
      },
      'nav:zoomOut': () => {
        const chart = this.getChart()
        if (chart) {
          const size = chart.getSize()
          chart.zoomAtCoordinate(0.8, { x: size?.width ? size.width / 2 : 400, y: 0 })
        }
      },
      // 图表操作
      'chart:screenshot': () => {
        this.exportScreenshot()
      },
      'chart:undo': () => {
        this._undoRedoManager.undo()
      },
      'chart:redo': () => {
        this._undoRedoManager.redo()
      },
      'chart:cancelDraw': () => {
        this.getChart()?.removeOverlay()
      },
      'chart:deleteSelected': () => {
        this.getChart()?.removeOverlay()
      },
      // 绘图工具
      'draw:straightLine': () => {
        this.getChart()?.createOverlay('straightLine')
      },
      'draw:horizontalStraightLine': () => {
        this.getChart()?.createOverlay('horizontalStraightLine')
      },
      'draw:verticalStraightLine': () => {
        this.getChart()?.createOverlay('verticalStraightLine')
      },
      'draw:fibonacciLine': () => {
        this.getChart()?.createOverlay('fibonacciLine')
      },
      'draw:rect': () => {
        this.getChart()?.createOverlay('rect')
      },
      'draw:brush': () => {
        this.getChart()?.createOverlay('simpleAnnotation')
      },
      'draw:dateAndPriceRange': () => {
        this.getChart()?.createOverlay('dateAndPriceRange')
      },
      // 显示切换
      'toggle:crosshair': () => {
        const chart = this.getChart()
        if (!chart) return
        const s = chart.getStyles()
        const show = s.crosshair?.show !== false
        chart.setStyles({ crosshair: { show: !show } })
      },
      'toggle:grid': () => {
        const chart = this.getChart()
        if (!chart) return
        const s = chart.getStyles()
        const show = s.grid?.show !== false
        chart.setStyles({ grid: { show: !show } })
      },
    })
    this._shortcutManager.bindTo(this._container!)
  }

  private _container!: Nullable<HTMLElement>

  private _chartApi: Nullable<ChartPro> = null

  private _shortcutManager!: KeyboardShortcutManager
  private _undoRedoManager!: UndoRedoManager

  private _comparisons = new Map<string, string>() // ticker → indicatorName

  private _datafeed: import('./types').Datafeed

  private _alertManager: AlertManager = new AlertManager()

  private _instanceId = `tc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

  private _disposed = false
  private _solidDispose: (() => void) | null = null
  private _clickHandler: ((e: Event) => void) | null = null
  private _clickTarget: Element | null = null

  /** Throws if called before Solid.js render completes or after dispose. */
  private _api(): ChartPro {
    if (this._disposed) {
      throw new Error(
        '[TradingChest] Instance has been disposed. Create a new instance to continue.',
      )
    }
    if (!this._chartApi) {
      throw new Error(
        '[TradingChest] Chart not initialized yet. Wait for render to complete before calling API methods.',
      )
    }
    return this._chartApi
  }

  /** Throws if instance is disposed. For methods that don't need _chartApi. */
  private _assertNotDisposed(): void {
    if (this._disposed) {
      throw new Error(
        '[TradingChest] Instance has been disposed. Create a new instance to continue.',
      )
    }
  }

  createOverlay(value: string | OverlayCreate | Array<string | OverlayCreate>) {
    return this._chartApi!.createOverlay(value)
  }

  getOverlays(id?: OverlayFilter): Overlay[] {
    return this._chartApi!.getOverlays(id)
  }

  removeOverlay(value?: OverlayFilter): boolean {
    return this._chartApi!.removeOverlay(value)
  }

  registerOverlay(template: OverlayTemplate): void {
    return this._chartApi!.registerOverlay(template)
  }

  setTheme(theme: string): void {
    this._container?.setAttribute('data-theme', theme)
    this._api().setTheme(theme)
  }

  getTheme(): string {
    return this._api().getTheme()
  }

  setStyles(styles: DeepPartial<Styles>): void {
    this._api().setStyles(styles)
  }

  getStyles(): Styles {
    return this._api().getStyles()
  }

  setLocale(locale: string): void {
    this._api().setLocale(locale)
  }

  getLocale(): string {
    return this._api().getLocale()
  }

  setTimezone(timezone: string): void {
    this._api().setTimezone(timezone)
  }

  getTimezone(): string {
    return this._api().getTimezone()
  }

  setSymbol(symbol: SymbolInfo): void {
    this._api().setSymbol(symbol)
  }

  getSymbol(): SymbolInfo {
    return this._api().getSymbol()
  }

  setPeriod(period: Period): void {
    this._api().setPeriod(period)
  }

  getPeriod(): Period {
    return this._api().getPeriod()
  }

  getChart() {
    return this._api().getChart()
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
    return this._shortcutManager
  }

  createTradeVisualization(trades: TradeRecord[], paneOptions?: Record<string, unknown>): void {
    this._assertNotDisposed()
    const chart = this.getChart()
    if (!chart) return
    chart.createIndicator(
      {
        name: 'TradeVis',
        extendData: { trades, _instanceId: this._instanceId },
        paneId: (paneOptions as { id?: string })?.id ?? 'candle_pane',
      } as unknown as IndicatorCreate,
      true,
    )
  }

  addAlert(config: AlertConfig): void {
    this._assertNotDisposed()
    this._alertManager.addAlert(config)
    const chart = this.getChart()
    if (chart) {
      chart.createOverlay({
        name: 'alertLine',
        id: `alert_${config.id}`,
        points: [{ value: config.price }],
        styles: { line: { color: config.color ?? '#ff9800' } },
        lock: true,
      })
    }
  }

  updateAlert(id: string, updates: Partial<Omit<AlertConfig, 'id'>>): boolean {
    this._assertNotDisposed()
    const updated = this._alertManager.updateAlert(id, updates)
    if (updated && updates.price !== undefined) {
      const chart = this.getChart()
      if (chart) {
        chart.removeOverlay({ id: `alert_${id}` })
        const alert = this._alertManager.getAlert(id)
        if (alert) {
          chart.createOverlay({
            name: 'alertLine',
            id: `alert_${id}`,
            points: [{ value: alert.price }],
            styles: { line: { color: updates.color ?? alert.color ?? '#ff9800' } },
            lock: true,
          })
        }
      }
    }
    return updated
  }

  removeAlert(id: string): void {
    this._assertNotDisposed()
    this._alertManager.removeAlert(id)
    this.getChart()?.removeOverlay({ id: `alert_${id}` })
  }

  getAlerts(): AlertConfig[] {
    this._assertNotDisposed()
    return this._alertManager.getAlerts()
  }

  private _clearComparisons(): void {
    for (const [, indicatorName] of this._comparisons) {
      try {
        this.getChart()?.removeIndicator({ paneId: 'candle_pane', name: indicatorName })
      } catch {
        /* already disposing */
      }
    }
    this._comparisons.clear()
  }

  /**
   * Add comparison overlay for another symbol.
   * Known limitation: comparison data is fetched once and not updated with new ticks.
   */
  async addComparison(symbol: SymbolInfo): Promise<void> {
    this._assertNotDisposed()
    // 防止重复添加同一品种（先移除旧的）
    if (this._comparisons.has(symbol.ticker)) {
      this.removeComparison(symbol.ticker)
    }
    const chart = this.getChart()
    if (!chart) return

    const p = this.getPeriod()
    const mainData = chart.getDataList()
    if (mainData.length === 0) return

    const from = mainData[0].timestamp
    const to = mainData[mainData.length - 1].timestamp
    const compData = await this._datafeed.getHistoryKLineData(symbol, p, from, to)
    if (compData.length === 0) return

    const compPercent = normalizeToPercent(compData)
    const compMap = new Map<number, number>()
    compData.forEach((d, i) => {
      compMap.set(d.timestamp, compPercent[i])
    })

    // Pre-build a lookup from mainData timestamps to comp percent values,
    // including nearest-timestamp resolution within 60s tolerance.
    // This avoids O(n²) binary search inside calc().
    const compTimestamps = compData.map((d) => d.timestamp)
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

    chart.createIndicator({ name: indicatorName, paneId: 'candle_pane' }, true)
    this._comparisons.set(symbol.ticker, indicatorName)
  }

  removeComparison(ticker: string): void {
    this._assertNotDisposed()
    const indicatorName = this._comparisons.get(ticker)
    if (indicatorName) {
      this.getChart()?.removeIndicator({ paneId: 'candle_pane', name: indicatorName })
      this._comparisons.delete(ticker)
    }
  }

  startReplay(startPosition?: number): void {
    this._api().startReplay(startPosition)
  }

  stopReplay(): void {
    this._api().stopReplay()
  }

  getReplayEngine(): ReplayEngine | null {
    return this._api().getReplayEngine()
  }

  feedPrice(price: number): void {
    if (this._disposed) return // feedPrice 静默忽略，不抛异常
    this._alertManager.checkPrice(price, Date.now())
  }

  dispose(): void {
    if (this._disposed) return // 幂等：重复调用安全
    this._disposed = true
    // 1. Stop replay (safe — ChartProComponent.onCleanup also handles this)
    if (this._chartApi) {
      try {
        this._chartApi.stopReplay()
      } catch {
        /* already disposing */
      }
    }
    // 2. Remove comparisons
    this._clearComparisons()
    // 3. Clear alerts & TradeVis instance data
    this._alertManager.clearAll()
    this._alertManager.onTrigger = null
    cleanupTradeVisInstance(this._instanceId)
    // 4. Unbind shortcuts & clear undo/redo
    this._shortcutManager.unbind()
    this._undoRedoManager.clear()
    // 5. Remove click listener
    if (this._clickHandler && this._clickTarget) {
      this._clickTarget.removeEventListener('click', this._clickHandler, true)
      this._clickHandler = null
      this._clickTarget = null
    }
    // 6. Unmount Solid.js render tree (triggers onCleanup → unsubscribe datafeed)
    if (this._solidDispose) {
      this._solidDispose()
      this._solidDispose = null
    }
    // 7. Release datafeed resources (WebSocket etc.) — wrap in try to avoid blocking cleanup
    try {
      this._datafeed.dispose?.()
    } catch {
      /* datafeed cleanup failure must not prevent container/chart release */
    }
    // 8. Clean container and reset refs — always executed
    this._container?.classList.remove('klinecharts-pro')
    this._container?.removeAttribute('data-theme')
    this._chartApi = null
  }
}
