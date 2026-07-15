import {
  init,
  dispose,
  utils,
  type Nullable,
  type Chart,
  type OverlayMode,
  type Styles,
  type TooltipFeaturePosition,
  type TooltipFeatureStyle,
  type Indicator,
  type IndicatorCreate,
  type Coordinate,
  type PeriodType,
  type Overlay,
  type KLineData,
  type Crosshair,
  registerOverlay,
} from 'klinecharts'
import {
  createSignal,
  createEffect,
  createMemo,
  onMount,
  Show,
  Suspense,
  onCleanup,
  startTransition,
  ErrorBoundary,
  type Component,
} from 'solid-js'
import type { ReplayState, ReplaySpeed } from './replay/types'
import type { OverlayLifecycleEvent, OverlayLifecycleSource } from './types'
import { Loading, type SelectDataSourceItem } from './component'
import { adjustFromTo } from './core/adjustFromTo'
import { buildStyles, type LineStyle } from './core/buildStyles'
import { deepSet } from './core/deepSet'
import { MethodNotAllowedError } from './core/MethodNotAllowedError'
import { indicatorRegistry } from './indicator'
import { ReplayEngine } from './replay/ReplayEngine'
import { OverlayCreateCommand, OverlayRemoveCommand } from './shortcut/overlayCommands'
import type { UndoRedoManager } from './shortcut/undoRedo'
import type { SymbolInfo, Period, ChartProOptions, ChartPro } from './types'
import { MAIN_PANE_ID, COLOR_PRIMARY, COLOR_PRIMARY_ALPHA_15 } from './types'
import {
  PeriodBar,
  DrawingBar,
  IndicatorModal,
  TimezoneModal,
  SettingModal,
  ScreenshotModal,
  IndicatorSettingModal,
  SymbolSearchModal,
  ThemeEditor,
  OverlayPropertyBar,
  ContextMenu,
  DataWindow,
  ReplayControlBar,
} from './widget'
import type { MenuItem } from './widget/context-menu'
import type { DataWindowRow } from './widget/data-window'
import t, { load as loadLocale, subscribeLocaleChange, getLocaleVersion } from './i18n'
import { translateTimezone } from './widget/timezone-modal/data'

export interface ChartProComponentProps extends Required<
  Omit<ChartProOptions, 'container' | 'onAlertTrigger' | 'onError' | 'locale'>
> {
  lang: string
  ref: (chart: ChartPro) => void
  /** 内部回调：实时数据到达时通知外层（用于报警检测） */
  onPriceUpdate?: (price: number) => void
  /** 内部回调：品种/周期切换时通知外层（用于重置报警状态等） */
  onDataReset?: () => void
  /** 内部错误回调 */
  onError?: (error: { type: string; message: string; raw?: unknown }) => void
  /** 撤销/重做管理器 */
  undoRedoManager?: UndoRedoManager
}

interface PrevSymbolPeriod {
  symbol: SymbolInfo
  period: Period
}

/** Internal klinecharts store shape — unstable, isolated here for upgrade safety */
interface KlcInternalStore {
  _crosshair?: { kLineData?: KLineData; paneId?: string; dataIndex?: number; x?: number; y?: number }
}

function readInternalCrosshair(chart: Chart): Crosshair | undefined {
  try {
    const store = (chart as unknown as { _chartStore?: KlcInternalStore })._chartStore
    if (store?._crosshair) {
      return store._crosshair as Crosshair
    }
  } catch {
    // klinecharts internal API changed — gracefully degrade
  }
  return undefined
}

const FORMAT_TABLE: Readonly<Record<string, { xAxis: string; default: string }>> = {
  ms: { xAxis: 'HH:mm:ss', default: 'YYYY-MM-DD HH:mm:ss' },
  second: { xAxis: 'HH:mm:ss', default: 'YYYY-MM-DD HH:mm:ss' },
  minute: { xAxis: 'HH:mm', default: 'YYYY-MM-DD HH:mm' },
  hour: { xAxis: 'MM-DD HH:mm', default: 'YYYY-MM-DD HH:mm' },
  day: { xAxis: 'YYYY-MM-DD', default: 'YYYY-MM-DD' },
  week: { xAxis: 'YYYY-MM-DD', default: 'YYYY-MM-DD' },
  month: { xAxis: 'YYYY-MM', default: 'YYYY-MM-DD' },
  year: { xAxis: 'YYYY', default: 'YYYY-MM-DD' },
}

const FILL_OVERLAY_NAMES: ReadonlySet<string> = new Set([
  'rect',
  'circle',
  'triangle',
  'parallelogram',
  'gannBox',
  'regressionChannel',
  'xabcd',
  'positionRange',
  'longPosition',
  'shortPosition',
  'dateAndPriceRange',
  'dateRange',
  'priceRange',
  'fibonacciCircle',
])

function tooltipFeatures(theme: string) {
  const color = theme === 'dark' ? '#929AA5' : '#76808F'
  const base = {
    position: 'middle' as TooltipFeaturePosition,
    type: 'icon_font' as const,
    marginTop: 7,
    marginBottom: 0,
    paddingLeft: 0,
    paddingTop: 0,
    paddingRight: 0,
    paddingBottom: 0,
    size: 14,
    color,
    activeColor: color,
    backgroundColor: 'transparent',
    activeBackgroundColor: COLOR_PRIMARY_ALPHA_15,
    borderRadius: 0,
    content: { family: 'icomoon', code: '' },
  }
  return [
    { ...base, id: 'visible', marginLeft: 8, marginRight: 0, content: { family: 'icomoon', code: '\ue901' } },
    { ...base, id: 'invisible', marginLeft: 8, marginRight: 0, content: { family: 'icomoon', code: '\ue903' } },
    { ...base, id: 'setting', marginLeft: 6, marginRight: 0, content: { family: 'icomoon', code: '\ue902' } },
    { ...base, id: 'close', marginLeft: 6, marginRight: 0, content: { family: 'icomoon', code: '\ue900' } },
  ]
}

const TOOLTIP_FEATURE_INDICES: Readonly<Record<'visible' | 'hidden', readonly number[]>> = Object.freeze({
  visible: Object.freeze([1, 2, 3]),
  hidden: Object.freeze([0, 2, 3]),
})

/** Overlay property bar X offset from the overlay point (px) */
const OVERLAY_BAR_OFFSET_X = 52
/** Overlay property bar Y offset from the overlay point (px) */
const OVERLAY_BAR_OFFSET_Y = 50

async function createIndicator(
  widget: Nullable<Chart>,
  indicatorName: string,
  isStack?: boolean,
  paneId?: string,
): Promise<Nullable<string>> {
  await indicatorRegistry.ensureRegistered(indicatorName)
  return (
    widget?.createIndicator(
      {
        name: indicatorName,
        paneId,
        createTooltipDataSource: ({
          indicator,
        }: {
          indicator: Indicator
        }) => {
          const defaultFeatures = (indicator.styles?.tooltip as { features?: TooltipFeatureStyle[] })?.features ?? []
          const indices = TOOLTIP_FEATURE_INDICES[indicator.visible ? 'visible' : 'hidden']
          const features: TooltipFeatureStyle[] = indices.flatMap((i) => {
            const f = defaultFeatures[i]
            return f ? [f] : []
          })
          return { name: indicator.name, calcParamsText: '', features, legends: [] }
        },
      } as unknown as IndicatorCreate,
      isStack,
    ) ?? null
  )
}

function snapshotOverlay(overlay: Overlay): OverlayLifecycleEvent['overlay'] {
  return {
    id: overlay.id,
    groupId: overlay.groupId,
    name: overlay.name,
    points: (overlay.points ?? []).map((point) => ({ ...point })),
    extendData: overlay.extendData,
    styles: overlay.styles,
    lock: overlay.lock,
    visible: overlay.visible,
  }
}

/** Get the text content for a text/note overlay, falling back to a default label */
function getTextOverlayContent(overlay: Overlay): string {
  return typeof overlay.extendData === 'string' && overlay.extendData.trim().length > 0
    ? overlay.extendData
    : overlay.name === 'note' ? 'Note' : 'Text'
}

const ChartProComponent: Component<ChartProComponentProps> = (props) => {
  let widgetRef: HTMLDivElement | undefined
  let widget: Nullable<Chart> = null
  let disposed = false

  let priceUnitDom: HTMLElement

  let fetchSeq = 0 // 单调递增的请求序号，用于丢弃过期响应

  const [theme, setTheme] = createSignal(props.theme)
  const tooltipFeaturesMemo = createMemo(() => tooltipFeatures(theme()))
  const [styles, setStyles] = createSignal(props.styles)
  const [locale, setLocale] = createSignal(props.lang)
  // Reactive locale version: subscribes to i18n module locale change events
  const [localeVersion, setLocaleVersion] = createSignal(getLocaleVersion())
  const setLocaleAndLoad = (newLocale: string) => {
    setLocale(newLocale)
    loadLocale(newLocale)
  }
  // Subscribe to i18n locale data changes
  onMount(() => {
    const unsub = subscribeLocaleChange(() => setLocaleVersion(v => v + 1))
    loadLocale(locale())
    onCleanup(unsub)
  })
  // Reactive translation: re-evaluates when locale or localeVersion changes
  const tr = (key: string) => { localeVersion(); return t(key, locale()) }

  const [symbol, setSymbol] = createSignal(props.symbol)
  const [period, setPeriod] = createSignal(props.period)
  const [indicatorModalVisible, setIndicatorModalVisible] = createSignal(false)
  const [mainIndicators, setMainIndicators] = createSignal([...props.mainIndicators!])
  const [subIndicators, setSubIndicators] = createSignal<Record<string, string>>({})
  const invalidateIndicatorCache = () => { cachedIndicatorGroups = null }

  const [timezoneModalVisible, setTimezoneModalVisible] = createSignal(false)
  const [timezone, setTimezone] = createSignal<SelectDataSourceItem>({
    key: props.timezone,
    text: translateTimezone(props.timezone, props.lang),
  })

  const [settingModalVisible, setSettingModalVisible] = createSignal(false)
  const [widgetDefaultStyles, setWidgetDefaultStyles] = createSignal<Styles>()
  // Snapshot styles only when the setting modal opens (avoids deep clone on every render)
  const settingModalStyles = createMemo((prev: Styles | null): Styles | null => {
    if (!settingModalVisible()) return null
    if (prev !== null) return prev // modal still open, keep snapshot
    return widget ? utils.clone(widget.getStyles()) : null
  }, null)

  const [screenshotUrl, setScreenshotUrl] = createSignal('')

  const [themeEditorVisible, setThemeEditorVisible] = createSignal(false)

  const [drawingBarVisible, setDrawingBarVisible] = createSignal(props.drawingBarVisible)
  const [drawingMode, setDrawingMode] = createSignal(false)
  const [dataWindowVisible, setDataWindowVisible] = createSignal(false)
  const [dataWindowData, setDataWindowData] = createSignal<DataWindowRow[]>([])

  const [symbolSearchModalVisible, setSymbolSearchModalVisible] = createSignal(false)

  const [loadingVisible, setLoadingVisible] = createSignal(false)

  const [indicatorSettingModalParams, setIndicatorSettingModalParams] = createSignal({
    visible: false,
    indicatorName: '',
    paneId: '',
    calcParams: [] as number[],
  })

  // 绘图 overlay 选中状态（浮动属性工具栏）
  type SelectedOverlay = NonNullable<ReturnType<typeof selectedOverlay>>
  const [selectedOverlay, setSelectedOverlay] = createSignal<{
    id: string
    x: number
    y: number
    color: string
    fillColor?: string
    lineWidth: number
    lineStyle: LineStyle
    locked: boolean
  } | null>(null)

  // 右键上下文菜单状态
  const [contextMenu, setContextMenu] = createSignal<{
    x: number
    y: number
    items: MenuItem[]
  } | null>(null)

  const notifyOverlay = (
    source: OverlayLifecycleSource,
    overlay: Overlay,
    kind: 'create' | 'update' | 'delete',
  ) => {
    const event = { overlay: snapshotOverlay(overlay), source }
    if (kind === 'create') {
      props.onOverlayCreate?.(event)
    } else if (kind === 'update') {
      props.onOverlayUpdate?.(event)
    } else {
      props.onOverlayDelete?.(event)
    }
  }

  const promptTextOverlay = (overlay: Overlay) => {
    if (overlay.name !== 'textAnnotation' && overlay.name !== 'note') return
    const current = getTextOverlayContent(overlay)
    const label =
      overlay.name === 'note' ? '输入便签内容 / Enter note:' : '输入标注文字 / Enter text:'
    const input = window.prompt(label, current)
    if (input !== null && input.trim() !== '') {
      overlay.extendData = input.trim()
    }
  }

  const markSelectedOverlay = (overlay: Overlay) => {
    if (overlay.id) {
      const points = overlay.points ?? []
      let x = 0,
        y = 0
      if (points.length > 0 && widget) {
        const pixel = widget.convertToPixel(
          { timestamp: points[0].timestamp, value: points[0].value },
          { paneId: MAIN_PANE_ID },
        ) as Partial<Coordinate>
        x = (pixel?.x ?? 200) + OVERLAY_BAR_OFFSET_X
        y = (pixel?.y ?? 100) - OVERLAY_BAR_OFFSET_Y
      }
      const hasFill = overlay.name != null && FILL_OVERLAY_NAMES.has(overlay.name)
      setSelectedOverlay({
        id: overlay.id,
        x: Math.max(100, x),
        y: Math.max(10, y),
        color: COLOR_PRIMARY,
        fillColor: hasFill ? COLOR_PRIMARY_ALPHA_15 : undefined,
        lineWidth: 1,
        lineStyle: 'solid',
        locked: overlay.lock ?? false,
      })
    }
  }

  const notifySelectedOverlayUpdate = (source: OverlayLifecycleSource, overlayId: string) => {
    const overlay = widget?.getOverlays({ id: overlayId })[0]
    if (overlay) {
      notifyOverlay(source, overlay, 'update')
    }
  }

  const applyOverlayStyleChange = <K extends 'color' | 'fillColor' | 'lineWidth' | 'lineStyle'>(
    propKey: K,
    rawValue: SelectedOverlay[K],
  ) => {
    const info = selectedOverlay()
    if (!info || !widget) return
    const value: SelectedOverlay[K] =
      propKey === 'fillColor' && rawValue === 'transparent'
        ? ('rgba(0,0,0,0)' as SelectedOverlay[K])
        : rawValue
    const next: SelectedOverlay = { ...info, [propKey]: value }
    widget.overrideOverlay({ id: info.id, styles: buildStyles(next) })
    setSelectedOverlay(next)
    notifySelectedOverlayUpdate('property-bar', info.id)
  }

  const pushOverlayCreateCmd = (overlay: Overlay) => {
    const mgr = props.undoRedoManager
    if (mgr && widget && overlay.id) {
      const o = widget.getOverlays({ id: overlay.id })[0] ?? overlay
      mgr.push(new OverlayCreateCommand(widget, snapshotOverlay(o)))
    }
  }

  const pushOverlayRemoveCmd = (overlay: Overlay) => {
    const mgr = props.undoRedoManager
    if (mgr && widget && overlay.id) {
      mgr.push(new OverlayRemoveCommand(widget, snapshotOverlay(overlay)))
    }
  }

  /** 交换 overlay 的 zLevel（direction: 1=前移, -1=后移） */
  const swapZLevel = (overlay: Overlay, direction: 1 | -1) => {
    if (!overlay.id || !overlay.paneId || !widget) return
    const allOnPane = widget.getOverlays()
      .filter(o => o.paneId === overlay.paneId)
      .sort((a, b) => a.zLevel - b.zLevel)
    const idx = allOnPane.findIndex(o => o.id === overlay.id)
    const targetIdx = idx + direction
    if (targetIdx < 0 || targetIdx >= allOnPane.length) return
    const target = allOnPane[targetIdx]
    const ownZ = overlay.zLevel
    const targetZ = target.zLevel
    if (ownZ === targetZ) {
      widget.overrideOverlay({ id: overlay.id, zLevel: targetZ + direction })
    } else {
      widget.overrideOverlay({ id: overlay.id, zLevel: targetZ })
      widget.overrideOverlay({ id: target.id, zLevel: ownZ })
    }
  }

  const handleOverlayRightClick = (overlay: Overlay, x: number, y: number) => {
    const textOverlays = ['textAnnotation', 'callout', 'note']
    const items: MenuItem[] = []

    if (textOverlays.includes(overlay.name ?? '')) {
      items.push({
        label: tr('menu_edit'),
        onClick: () => {
          const current = getTextOverlayContent(overlay)
          const input = window.prompt(tr('menu_edit'), current)
          if (input !== null && input.trim() !== '' && overlay.id) {
            widget?.overrideOverlay({ id: overlay.id, extendData: input.trim() })
          }
        },
      })
    }

    items.push(
      {
        label: tr(overlay.lock ? 'menu_unlock' : 'menu_lock'),
        onClick: () => {
          if (overlay.id) {
            widget?.overrideOverlay({ id: overlay.id, lock: !overlay.lock })
          }
        },
      },
      {
        label: tr('menu_copy'),
        onClick: () => {
          if (overlay.id) {
            const o = widget?.getOverlays({ id: overlay.id })[0]
            if (o) {
              widget?.createOverlay({
                name: o.name,
                points: o.points,
                extendData: o.extendData,
                lock: false,
              })
            }
          }
        },
      },
      {
        label: tr('menu_bring_forward'),
        onClick: () => swapZLevel(overlay, 1),
      },
      {
        label: tr('menu_send_backward'),
        onClick: () => swapZLevel(overlay, -1),
      },
      {
        label: tr('menu_delete'),
        danger: true,
        onClick: () => {
          if (overlay.id) {
            pushOverlayRemoveCmd(overlay)
            widget?.removeOverlay({ id: overlay.id })
            setSelectedOverlay(null)
          }
        },
      },
    )

    setContextMenu({ x, y, items })
  }

  // 回放状态
  const defaultReplayState: ReplayState = {
    active: false,
    playing: false,
    speed: 1,
    position: 0,
    totalBars: 0,
  }
  const [replayState, setReplayState] = createSignal<ReplayState>(defaultReplayState)
  let replayEngine: ReplayEngine | null = null
  let replayDataList: KLineData[] = []
  let subscribeBarCallback: ((data: KLineData) => void) | null = null

  const setChartPeriod = (nextPeriod: Period) => {
    if (replayEngine) return
    setPeriod(nextPeriod)
    props.onPeriodChange?.(nextPeriod)
  }

  const startReplay = (startPosition?: number) => {
    if (replayEngine || !widget) return
    const dataList = widget.getDataList()
    if (dataList.length === 0) return
    // 暂停实时数据订阅，防止实时数据污染回放时间线
    props.datafeed.unsubscribe(symbol(), period())
    const pos = startPosition ?? dataList.length >>> 1
    replayEngine = new ReplayEngine({
      onDataChange: (data) => {
        replayDataList = data
        widget?.resetData()
      },
      onBarUpdate: (bar) => {
        const kData = bar
        replayDataList.push(kData)
        subscribeBarCallback?.(kData)
      },
      onStateChange: (state) => {
        setReplayState(state)
      },
    })
    replayEngine.start(dataList, pos)
  }

  const stopReplay = () => {
    if (replayEngine) {
      replayEngine.stop()
      replayEngine.dispose()
      replayEngine = null
      setReplayState(defaultReplayState)
      // 重置数据，DataLoader 会自动拉取最新数据
      widget?.resetData()
    }
  }

  props.ref({
    createOverlay: (value) => widget?.createOverlay(value) ?? '',
    getOverlays: (filter) => widget?.getOverlays(filter) ?? [],
    removeOverlay: (value) => widget?.removeOverlay(value) ?? false,
    registerOverlay: (value) => registerOverlay(value),
    setTheme,
    getTheme: () => theme(),
    setStyles,
    getStyles: () => widget?.getStyles() ?? {} as Styles,
    setLocale: setLocaleAndLoad,
    getLocale: () => locale(),
    setTimezone: (tz: string) => {
      setTimezone({ key: tz, text: translateTimezone(tz, locale()) })
    },
    getTimezone: () => timezone().key,
    setSymbol: (s: SymbolInfo) => {
      if (!replayEngine) setSymbol(s)
    },
    getSymbol: () => symbol(),
    setPeriod: setChartPeriod,
    getPeriod: () => period(),
    getChart: () => widget,
    // 以下方法由 KLineChartPro 直接实现，不经过 _chartApi 代理
    // 如果有人绕过 KLineChartPro 直接调用组件 ref，给出明确错误
    exportCSV: () => {
      throw new MethodNotAllowedError('exportCSV')
    },
    exportAllCSV: () => {
      throw new MethodNotAllowedError('exportAllCSV')
    },
    exportScreenshot: () => {
      throw new MethodNotAllowedError('exportScreenshot')
    },
    getShortcutManager: () => {
      throw new MethodNotAllowedError('getShortcutManager')
    },
    addAlert: () => {
      throw new MethodNotAllowedError('addAlert')
    },
    updateAlert: () => {
      throw new MethodNotAllowedError('updateAlert')
    },
    removeAlert: () => {
      throw new MethodNotAllowedError('removeAlert')
    },
    getAlerts: () => {
      throw new MethodNotAllowedError('getAlerts')
    },
    addComparison: async () => {
      throw new MethodNotAllowedError('addComparison')
    },
    removeComparison: () => {
      throw new MethodNotAllowedError('removeComparison')
    },
    startReplay: (pos?: number) => {
      startReplay(pos)
    },
    stopReplay: () => {
      stopReplay()
    },
    getReplayEngine: () => replayEngine,
    createTradeVisualization: () => {
      throw new MethodNotAllowedError('createTradeVisualization')
    },
    feedPrice: () => {
      throw new MethodNotAllowedError('feedPrice')
    },
    dispose: () => {
      throw new MethodNotAllowedError('dispose')
    },
  })

  let resizeRaf = 0
  let crosshairRaf = 0
  /** Cached indicator grouping for crosshair data window — invalidated on indicator add/remove */
  let cachedIndicatorGroups: Record<string, Indicator[]> | null = null
  /** Action callback references for cleanup */
  let onTooltipClick: ((data: unknown) => void) | null = null
  let onBarClick: (() => void) | null = null
  let onCrosshair: ((data: unknown) => void) | null = null
  const documentResize = () => {
    if (resizeRaf) return
    resizeRaf = requestAnimationFrame(() => {
      resizeRaf = 0
      widget?.resize()
    })
  }

  // Backspace/Delete 删除选中的绘图
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Backspace' || e.key === 'Delete') {
      const info = selectedOverlay()
      if (info && widget) {
        const overlay = widget.getOverlays({ id: info.id })[0]
        if (overlay) pushOverlayRemoveCmd(overlay)
        widget.removeOverlay({ id: info.id })
        setSelectedOverlay(null)
        e.preventDefault()
      }
    }
    if (e.key === 'Escape') {
      setSelectedOverlay(null)
      setDrawingMode(false)
    }
  }

  onMount(() => {
    const ref = widgetRef
    if (!ref) return
    window.addEventListener('resize', documentResize)
    // 绑定到 container 而非 window，避免图表外的按键误触发
    ref.addEventListener('keydown', handleKeyDown)
    widget = init(ref, {
      formatter: {
        formatDate: ({
          dateTimeFormat,
          timestamp,
          type,
        }: {
          dateTimeFormat: Intl.DateTimeFormat
          timestamp: number
          template: string
          type: string
        }) => {
          const formatInfo = FORMAT_TABLE[period().timespan]
          return utils.formatDate(dateTimeFormat, timestamp,
            type === 'xAxis' ? formatInfo?.xAxis ?? 'YYYY-MM-DD HH:mm' :
              formatInfo?.default ?? 'YYYY-MM-DD HH:mm'
          )
        },
      },
    })

    if (widget) {
      const watermarkContainer = widget.getDom(MAIN_PANE_ID, 'main')
      if (watermarkContainer) {
        const watermark = document.createElement('div')
        watermark.className = 'klinecharts-pro-watermark'
        if (utils.isString(props.watermark)) {
          watermark.textContent = props.watermark.replace(/(^\s*)|(\s*$)/g, '')
        } else {
          watermark.appendChild(props.watermark)
        }
        watermarkContainer.appendChild(watermark)
      }

      const priceUnitContainer = widget.getDom(MAIN_PANE_ID, 'yAxis')
      priceUnitDom = document.createElement('span')
      priceUnitDom.className = 'klinecharts-pro-price-unit'
      priceUnitContainer?.appendChild(priceUnitDom)
    }

    // Capture default styles once for "restore defaults" in settings modal
    if (widget) {
      setWidgetDefaultStyles(structuredClone(widget.getStyles()))
    }

    ; (async () => {
      const mainPromises = mainIndicators().map(
        (indicator) => createIndicator(widget, indicator, true, MAIN_PANE_ID),
      )
      await Promise.all(mainPromises)
      if (disposed) return
      const subIndicatorMap: Record<string, string> = {}
      const subPromises = props.subIndicators!.map(async (indicator) => {
        const paneId = await createIndicator(widget, indicator, true)
        if (paneId) {
          subIndicatorMap[indicator] = paneId
        }
      })
      await Promise.all(subPromises)
      if (!disposed) {
        setSubIndicators(subIndicatorMap)
        invalidateIndicatorCache()
      }
    })().catch((e) => {
      props.onError?.({ type: 'indicator-init', message: 'indicator init failed', raw: e })
    })
    widget?.setDataLoader({
      getBars: async (params) => {
        if (replayEngine) {
          params.callback(replayDataList, false)
          return
        }
        const seq = ++fetchSeq
        const isInit = params.type === 'init'
        if (isInit) setLoadingVisible(true)
        try {
          const s = symbol()
          const p = period()
          if (isInit) {
            const [from, to] = adjustFromTo(p, new Date().getTime(), 500)
            const kLineDataList = await props.datafeed.getHistoryKLineData(s, p, from, to)
            if (seq !== fetchSeq) return
            params.callback(kLineDataList, kLineDataList.length > 0)
          } else if (params.type === 'backward') {
            const [to] = adjustFromTo(p, params.timestamp!, 1)
            const [from] = adjustFromTo(p, to, 500)
            const kLineDataList = await props.datafeed.getHistoryKLineData(s, p, from, to)
            if (seq !== fetchSeq) return
            params.callback(kLineDataList, kLineDataList.length > 0)
          }
        } catch (e) {
          props.onError?.({ type: 'data-fetch', message: 'data fetch failed', raw: e })
        } finally {
          if (seq === fetchSeq) {
            setLoadingVisible(false)
          }
        }
      },
      subscribeBar: (params) => {
        subscribeBarCallback = params.callback
        if (replayEngine) return
        const s = symbol()
        const p = period()
        props.datafeed.subscribe(s, p, (data) => {
          params.callback(data as unknown as KLineData)
          props.onPriceUpdate?.(data.close)
        })
      },
      unsubscribeBar: () => {
        props.datafeed.unsubscribe(symbol(), period())
      },
    })
    onTooltipClick = (data: unknown) => {
      const d = data as { indicatorName?: string; iconId?: string; paneId?: string }
      if (d.indicatorName) {
        switch (d.iconId) {
          case 'visible':
            widget?.overrideIndicator({ name: d.indicatorName, visible: true })
            break
          case 'invisible':
            widget?.overrideIndicator({ name: d.indicatorName, visible: false })
            break
          case 'setting':
            if (d.paneId) {
              const indicator = widget?.getIndicators({
                paneId: d.paneId,
                name: d.indicatorName,
              })[0] as Indicator
              setIndicatorSettingModalParams({
                visible: true,
                indicatorName: d.indicatorName!,
                paneId: d.paneId,
                calcParams: indicator.calcParams as number[],
              })
            }
            break
          case 'close':
            if (d.paneId === MAIN_PANE_ID) {
              const newMainIndicators = [...mainIndicators()]
              widget?.removeIndicator({ paneId: MAIN_PANE_ID, name: d.indicatorName })
              newMainIndicators.splice(newMainIndicators.indexOf(d.indicatorName), 1)
              setMainIndicators(newMainIndicators)
              invalidateIndicatorCache()
            } else {
              const newIndicators: Record<string, string> = { ...subIndicators() }
              widget?.removeIndicator({ paneId: d.paneId, name: d.indicatorName })
              delete newIndicators[d.indicatorName]
              setSubIndicators(newIndicators)
              invalidateIndicatorCache()
            }
            break
        }
      }
    }
    widget?.subscribeAction('onIndicatorTooltipFeatureClick', onTooltipClick)
    // 点击蜡烛区域时清除 overlay 选中状态
    onBarClick = () => { setSelectedOverlay(null) }
    widget?.subscribeAction('onCandleBarClick', onBarClick)
    // 十字光标变化时更新数据窗口（节流到 ~16ms）
    onCrosshair = (data: unknown) => {
      if (crosshairRaf) return
      crosshairRaf = requestAnimationFrame(() => {
        crosshairRaf = 0
        let crosshair = data as Crosshair | undefined
        // klinecharts v10 bug: subscribeAction callback receives the raw input {x, y, paneId}
        // without kLineData. Read the full internal crosshair state as a fallback.
        if (crosshair && !crosshair.kLineData && widget) {
          crosshair = readInternalCrosshair(widget) ?? crosshair
        }
        if (!crosshair || !crosshair.kLineData) {
          setDataWindowData([])
          return
        }
        const d = crosshair.kLineData as Record<string, unknown>
        const rows: DataWindowRow[] = []
        const addRow = (label: string, val: unknown, color?: string) => {
          rows.push({ label, value: val != null && !isNaN(+val) ? String(val) : '--', color })
        }
        addRow('O', d.open)
        addRow('H', d.high)
        addRow('L', d.low)
        addRow('C', d.close)
        if (d.volume != null) addRow('V', d.volume)
        // Extract indicator values from all panes (main + sub)
        if (widget) {
          if (!cachedIndicatorGroups) {
            const allIndicators = widget.getIndicators()
            const groups: Record<string, Indicator[]> = {}
            if (allIndicators && allIndicators.length > 0) {
              for (const ind of allIndicators) {
                if (!groups[ind.paneId]) groups[ind.paneId] = []
                groups[ind.paneId].push(ind)
              }
            }
            cachedIndicatorGroups = groups
          }
          const paneGroups = cachedIndicatorGroups
          if (Object.keys(paneGroups).length > 0) {
            const dataIndex = d.dataIndex as number | undefined
            for (const [paneId, indicators] of Object.entries(paneGroups)) {
              if (paneId !== MAIN_PANE_ID) {
                rows.push({ label: `[${paneId}]`, value: '', color: '#888' })
              }
              for (const ind of indicators) {
                const vals = ind.result as Record<string, unknown>[] | undefined
                if (vals && vals.length > 0) {
                  const row = (dataIndex != null && dataIndex >= 0 && dataIndex < vals.length)
                    ? vals[dataIndex]
                    : vals[vals.length - 1]
                  const figureKeys = Array.isArray(ind.figures) ? ind.figures.map(f => f.key) : Object.keys(row)
                  for (const k of figureKeys) {
                    addRow(`${ind.name}.${k}`, row[k])
                  }
                }
              }
            }
          }
        }
        setDataWindowData(rows)
      })
    }
    widget?.subscribeAction('onCrosshairChange', onCrosshair)
  })

  onCleanup(() => {
    if (disposed) return
    disposed = true
    // Capture signal values immediately — after Solid unmount these may be stale
    const currentSymbol = symbol()
    const currentPeriod = period()
    // 先取消实时数据订阅，防止组件卸载后幽灵回调
    props.datafeed.unsubscribe(currentSymbol, currentPeriod)
    window.removeEventListener('resize', documentResize)
    if (resizeRaf) cancelAnimationFrame(resizeRaf)
    if (crosshairRaf) cancelAnimationFrame(crosshairRaf)
    subscribeBarCallback = null
    cachedIndicatorGroups = null
    // Unsubscribe klinecharts actions to prevent stale callbacks
    if (widget) {
      if (onTooltipClick) widget.unsubscribeAction('onIndicatorTooltipFeatureClick', onTooltipClick!)
      if (onBarClick) widget.unsubscribeAction('onCandleBarClick', onBarClick!)
      if (onCrosshair) widget.unsubscribeAction('onCrosshairChange', onCrosshair!)
    }
    if (widgetRef) {
      widgetRef.removeEventListener('keydown', handleKeyDown)
      dispose(widgetRef)
    }
    if (replayEngine) {
      replayEngine.stop()
      replayEngine.dispose()
      replayEngine = null
    }
  })

  createEffect((prev?: PrevSymbolPeriod) => {
    const s = symbol()
    const p = period()
    if (prev) {
      props.datafeed.unsubscribe(prev.symbol, prev.period)
      props.onDataReset?.()
      props.undoRedoManager?.clear()
    }
    if (priceUnitDom) {
      if (s.priceCurrency) {
        priceUnitDom.textContent = s.priceCurrency.toLocaleUpperCase()
        priceUnitDom.style.display = 'flex'
      } else {
        priceUnitDom.style.display = 'none'
      }
    }
    widget?.setSymbol({
      ticker: s.ticker,
      pricePrecision: s.pricePrecision ?? 2,
      volumePrecision: s.volumePrecision ?? 0,
    })
    widget?.setPeriod({ type: p.timespan as PeriodType, span: p.multiplier })
    return { symbol: s, period: p }
  })

  createEffect(() => {
    const t = theme()
    // Two calls are required: setStyles(string) applies a theme preset,
    // setStyles(object) merges partial overrides. The API does not support
    // combining both in a single call.
    widget?.setStyles(t)
    widget?.setStyles({ indicator: { tooltip: { features: tooltipFeaturesMemo() } } })
  })

  createEffect(() => {
    widget?.setLocale(locale())
  })

  createEffect(() => {
    widget?.setTimezone(timezone().key)
  })

  createEffect(() => {
    if (styles()) {
      widget?.setStyles(styles())
    }
  })

  return (
    <ErrorBoundary
      fallback={(err) => (
        <div style={{ padding: '20px', color: 'red', 'font-family': 'monospace' }}>
          [TradingChest] Render error: {err?.message ?? String(err)}
        </div>
      )}
    >
      <i class="icon-close klinecharts-pro-load-icon" />
      <Suspense>
        <Show when={symbolSearchModalVisible()}>
          <SymbolSearchModal
            lang={locale()} localeKey={localeVersion()}
            datafeed={props.datafeed}
            onSymbolSelected={(symbol) => {
              setSymbol(symbol)
            }}
            onClose={() => {
              setSymbolSearchModalVisible(false)
            }}
          />
        </Show>
        <Show when={indicatorModalVisible()}>
          <IndicatorModal
            lang={locale()} localeKey={localeVersion()}
            mainIndicators={mainIndicators()}
            subIndicators={subIndicators()}
            onClose={() => {
              setIndicatorModalVisible(false)
            }}
            onMainIndicatorChange={async (data) => {
              const newMainIndicators = [...mainIndicators()]
              if (data.added) {
                await createIndicator(widget, data.name, true, MAIN_PANE_ID)
                newMainIndicators.push(data.name)
              } else {
                widget?.removeIndicator({ paneId: MAIN_PANE_ID, name: data.name })
                newMainIndicators.splice(newMainIndicators.indexOf(data.name), 1)
              }
              setMainIndicators(newMainIndicators)
              invalidateIndicatorCache()
            }}
            onSubIndicatorChange={async (data) => {
              const newSubIndicators: Record<string, string> = { ...subIndicators() }
              if (data.added) {
                const paneId = await createIndicator(widget, data.name)
                if (paneId) {
                  newSubIndicators[data.name] = paneId
                }
              } else {
                if (data.paneId) {
                  widget?.removeIndicator({ paneId: data.paneId, name: data.name })
                  delete newSubIndicators[data.name]
                }
              }
              setSubIndicators(newSubIndicators)
              invalidateIndicatorCache()
            }}
          />
        </Show>
        <Show when={timezoneModalVisible()}>
          <TimezoneModal
            lang={locale()} localeKey={localeVersion()}
            timezone={timezone()}
            onClose={() => {
              setTimezoneModalVisible(false)
            }}
            onConfirm={setTimezone}
          />
        </Show>
        <Show when={settingModalVisible()}>
          <SettingModal
            lang={locale()} localeKey={localeVersion()}
            currentStyles={settingModalStyles()!}
            onClose={() => {
              setSettingModalVisible(false)
            }}
            onChange={(style) => {
              widget?.setStyles(style)
            }}
            onRestoreDefault={(options: SelectDataSourceItem[]) => {
              const style = {}
              options.forEach((option) => {
                const key = option.key
                deepSet(style, key, utils.formatValue(widgetDefaultStyles() ?? {}, key))
              })
              widget?.setStyles(style)
            }}
          />
        </Show>
        <Show when={screenshotUrl().length > 0}>
          <ScreenshotModal
            lang={locale()} localeKey={localeVersion()}
            url={screenshotUrl()}
            onClose={() => {
              setScreenshotUrl('')
            }}
          />
        </Show>
        <Show when={themeEditorVisible()}>
          <ThemeEditor
            lang={locale()} localeKey={localeVersion()}
            currentStyles={widget!.getStyles()}
            onClose={() => setThemeEditorVisible(false)}
            onApply={(style) => widget?.setStyles(style)}
          />
        </Show>
        <Show when={indicatorSettingModalParams().visible}>
          <IndicatorSettingModal
            lang={locale()} localeKey={localeVersion()}
            params={indicatorSettingModalParams()}
            onClose={() => {
              setIndicatorSettingModalParams({
                visible: false,
                indicatorName: '',
                paneId: '',
                calcParams: [],
              })
            }}
            onConfirm={(params) => {
              const modalParams = indicatorSettingModalParams()
              widget?.overrideIndicator(
                { name: modalParams.indicatorName, calcParams: params },
              )
            }}
          />
        </Show>
      </Suspense>
      <PeriodBar
        lang={locale()} localeKey={localeVersion()}
        symbol={symbol()}
        spread={drawingBarVisible()}
        period={period()}
        periods={props.periods}
        onMenuClick={async () => {
          try {
            await startTransition(() => setDrawingBarVisible(!drawingBarVisible()))
            widget?.resize()
          } catch (e) {
            console.warn('[TradingChest] toggle drawing bar failed:', e)
          }
        }}
        onSymbolClick={() => {
          setSymbolSearchModalVisible(!symbolSearchModalVisible())
        }}
        onPeriodChange={setChartPeriod}
        onIndicatorClick={() => {
          setIndicatorModalVisible((visible) => !visible)
        }}
        onTimezoneClick={() => {
          setTimezoneModalVisible((visible) => !visible)
        }}
        onSettingClick={() => {
          setSettingModalVisible((visible) => !visible)
        }}
        onScreenshotClick={() => {
          if (widget) {
            const url = widget.getConvertPictureUrl(
              true,
              'jpeg',
              props.theme === 'dark' ? '#151517' : '#ffffff',
            )
            setScreenshotUrl(url)
          }
        }}
        onThemeClick={() => setThemeEditorVisible((v) => !v)}
        replayActive={replayState().active}
        onReplayClick={() => {
          if (replayState().active) {
            stopReplay()
          } else {
            startReplay()
          }
        }}
        dataWindowActive={dataWindowVisible()}
        onDataWindowClick={() => {
          setDataWindowVisible((v) => !v)
          requestAnimationFrame(() => widget?.resize())
        }}
      />
      <div class="klinecharts-pro-content">
        <Show when={loadingVisible()}>
          <Loading />
        </Show>
        <Show when={drawingBarVisible()}>
          <DrawingBar
            lang={locale()} localeKey={localeVersion()}
            onDrawingItemClick={(overlay) => {
              setDrawingMode(true)
              widget?.createOverlay({
                ...overlay,
                onDrawEnd: (event) => {
                  setDrawingMode(false)
                  promptTextOverlay(event.overlay)
                  notifyOverlay('drawing-bar', event.overlay, 'create')
                  pushOverlayCreateCmd(event.overlay)
                  return true
                },
                onPressedMoveEnd: (event) => {
                  notifyOverlay('drawing-bar', event.overlay, 'update')
                  return true
                },
                onSelected: (event) => {
                  markSelectedOverlay(event.overlay)
                  return true
                },
                onDeselected: () => {
                  setSelectedOverlay(null)
                  return true
                },
                onRemoved: (event) => {
                  setDrawingMode(false)
                  notifyOverlay('drawing-bar', event.overlay, 'delete')
                  pushOverlayRemoveCmd(event.overlay)
                  setSelectedOverlay(null)
                  return true
                },
                onRightClick: (event) => {
                  const rect = widgetRef?.getBoundingClientRect()
                  const x = (event.x ?? 0) + (rect?.left ?? 0)
                  const y = (event.y ?? 0) + (rect?.top ?? 0)
                  handleOverlayRightClick(event.overlay, x, y)
                  return true
                },
              })
            }}
            onModeChange={(mode) => {
              widget?.overrideOverlay({ mode: mode as OverlayMode })
            }}
            onLockChange={(lock) => {
              widget?.overrideOverlay({ lock })
            }}
            onVisibleChange={(visible) => {
              widget?.overrideOverlay({ visible })
            }}
            onRemoveClick={(groupId) => {
              widget?.removeOverlay({ groupId })
            }}
          />
        </Show>
        <div
          ref={(el) => {
            widgetRef = el
          }}
          class="klinecharts-pro-widget"
          classList={{ 'klinecharts-pro-drawing': drawingMode() }}
          data-drawing-bar-visible={drawingBarVisible()}
          data-data-window-visible={dataWindowVisible()}
        />
        <DataWindow
          lang={locale()} localeKey={localeVersion()}
          visible={dataWindowVisible()}
          onToggle={() => setDataWindowVisible(false)}
          data={dataWindowData()}
        />
        {/* 绘图 overlay 浮动属性工具栏 */}
        <OverlayPropertyBar
          lang={locale()} localeKey={localeVersion()}
          visible={selectedOverlay() !== null}
          position={{ x: selectedOverlay()?.x ?? 0, y: selectedOverlay()?.y ?? 0 }}
          overlayId={selectedOverlay()?.id ?? ''}
          currentColor={selectedOverlay()?.color ?? COLOR_PRIMARY}
          currentFillColor={selectedOverlay()?.fillColor}
          currentLineWidth={selectedOverlay()?.lineWidth ?? 1}
          currentLineStyle={selectedOverlay()?.lineStyle ?? 'solid'}
          locked={selectedOverlay()?.locked ?? false}
          onColorChange={(color) => applyOverlayStyleChange('color', color)}
          onFillColorChange={(fillColor) => applyOverlayStyleChange('fillColor', fillColor)}
          onLineWidthChange={(width) => applyOverlayStyleChange('lineWidth', width)}
          onLineStyleChange={(style) => applyOverlayStyleChange('lineStyle', style as LineStyle)}
          onLockChange={(locked) => {
            const info = selectedOverlay()
            if (info && widget) {
              widget.overrideOverlay({ id: info.id, lock: locked })
              setSelectedOverlay({ ...info, locked })
              notifySelectedOverlayUpdate('property-bar', info.id)
            }
          }}
          onDelete={() => {
            const info = selectedOverlay()
            if (info && widget) {
              const overlay = widget.getOverlays({ id: info.id })[0]
              if (overlay) pushOverlayRemoveCmd(overlay)
              widget.removeOverlay({ id: info.id })
              setSelectedOverlay(null)
            }
          }}
          onClose={() => setSelectedOverlay(null)}
        />
        <ReplayControlBar
          lang={locale()} localeKey={localeVersion()}
          state={replayState()}
          onPlay={() => {
            replayEngine?.play()
          }}
          onPause={() => {
            replayEngine?.pause()
          }}
          onStepForward={() => {
            replayEngine?.stepForward()
          }}
          onStepBackward={() => {
            replayEngine?.stepBackward()
          }}
          onSpeedChange={(speed: ReplaySpeed) => {
            replayEngine?.setSpeed(speed)
          }}
          onPositionChange={(pos: number) => {
            replayEngine?.goToPosition(pos)
          }}
          onStop={() => {
            stopReplay()
          }}
        />
      </div>
      <Show when={contextMenu()}>
        {(cm) => (
          <ContextMenu
            x={cm().x}
            y={cm().y}
            items={cm().items}
            onClose={() => setContextMenu(null)}
          />
        )}
      </Show>
    </ErrorBoundary>
  )
}

export default ChartProComponent