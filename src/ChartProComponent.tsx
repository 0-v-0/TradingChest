/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at

 * http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
  onMount,
  Show,
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
import t from './i18n'
import { translateTimezone } from './widget/timezone-modal/data'

export interface ChartProComponentProps extends Required<
  Omit<ChartProOptions, 'container' | 'onAlertTrigger' | 'onError'>
> {
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
    activeBackgroundColor: 'rgba(22, 119, 255, 0.15)',
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
          const features: TooltipFeatureStyle[] = []
          if (indicator.visible) {
            if (defaultFeatures[1]) features.push(defaultFeatures[1])
            if (defaultFeatures[2]) features.push(defaultFeatures[2])
            if (defaultFeatures[3]) features.push(defaultFeatures[3])
          } else {
            if (defaultFeatures[0]) features.push(defaultFeatures[0])
            if (defaultFeatures[2]) features.push(defaultFeatures[2])
            if (defaultFeatures[3]) features.push(defaultFeatures[3])
          }
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

const ChartProComponent: Component<ChartProComponentProps> = (props) => {
  let widgetRef: HTMLDivElement | undefined
  let widget: Nullable<Chart> = null

  let priceUnitDom: HTMLElement

  let fetchSeq = 0 // 单调递增的请求序号，用于丢弃过期响应

  const [theme, setTheme] = createSignal(props.theme)
  const [styles, setStyles] = createSignal(props.styles)
  const [locale, setLocale] = createSignal(props.locale)

  const [symbol, setSymbol] = createSignal(props.symbol)
  const [period, setPeriod] = createSignal(props.period)
  const [indicatorModalVisible, setIndicatorModalVisible] = createSignal(false)
  const [mainIndicators, setMainIndicators] = createSignal([...props.mainIndicators!])
  const [subIndicators, setSubIndicators] = createSignal({})

  const [timezoneModalVisible, setTimezoneModalVisible] = createSignal(false)
  const [timezone, setTimezone] = createSignal<SelectDataSourceItem>({
    key: props.timezone,
    text: translateTimezone(props.timezone, props.locale),
  })

  const [settingModalVisible, setSettingModalVisible] = createSignal(false)
  const [widgetDefaultStyles, setWidgetDefaultStyles] = createSignal<Styles>()

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
    const fallback = overlay.name === 'note' ? 'Note' : 'Text'
    const current =
      typeof overlay.extendData === 'string' && overlay.extendData.trim().length > 0
        ? overlay.extendData
        : fallback
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
          { paneId: 'candle_pane' },
        ) as Partial<Coordinate>
        x = (pixel?.x ?? 200) + 52
        y = (pixel?.y ?? 100) - 50
      }
      const fillOverlays = [
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
      ]
      const hasFill = fillOverlays.includes(overlay.name ?? '')
      setSelectedOverlay({
        id: overlay.id,
        x: Math.max(100, x),
        y: Math.max(10, y),
        color: '#1677ff',
        fillColor: hasFill ? 'rgba(22, 119, 255, 0.15)' : undefined,
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

  const pushOverlayCreateCmd = (overlay: Overlay) => {
    const mgr = props.undoRedoManager
    if (mgr && widget && overlay.id) {
      const o = widget.getOverlays({ id: overlay.id })[0] ?? overlay
      mgr.push(new OverlayCreateCommand(widget, {
        id: o.id,
        name: o.name,
        points: o.points,
        extendData: o.extendData,
        styles: o.styles,
        lock: o.lock,
        visible: o.visible,
      }))
    }
  }

  const pushOverlayRemoveCmd = (overlay: Overlay) => {
    const mgr = props.undoRedoManager
    if (mgr && widget && overlay.id) {
      mgr.push(new OverlayRemoveCommand(widget, {
        id: overlay.id,
        name: overlay.name,
        points: overlay.points,
        extendData: overlay.extendData,
        styles: overlay.styles,
        lock: overlay.lock,
        visible: overlay.visible,
      }))
    }
  }

  const handleOverlayRightClick = (overlay: Overlay, x: number, y: number) => {
    const textOverlays = ['textAnnotation', 'callout', 'note']
    const items: MenuItem[] = []

    if (textOverlays.includes(overlay.name ?? '')) {
      items.push({
         label: t('menu_edit', locale()),
         onClick: () => {
           const current =
            typeof overlay.extendData === 'string' && overlay.extendData.trim().length > 0
              ? overlay.extendData
              : overlay.name === 'note'
                ? 'Note'
                : 'Text'
          const input = window.prompt(t('menu_edit', locale()), current)
          if (input !== null && input.trim() !== '' && overlay.id) {
            widget?.overrideOverlay({ id: overlay.id, extendData: input.trim() })
          }
        },
      })
    }

    items.push(
      {
        label: t(overlay.lock ? 'menu_unlock' : 'menu_lock', locale()),
        onClick: () => {
          if (overlay.id) {
            widget?.overrideOverlay({ id: overlay.id, lock: !overlay.lock })
          }
        },
      },
      {
        label: t('menu_copy', locale()),
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
        label: t('menu_bring_forward', locale()),
        onClick: () => {
          if (!overlay.id || !overlay.paneId) return
          const allOnPane = widget!.getOverlays()
            .filter(o => o.paneId === overlay.paneId)
            .sort((a, b) => a.zLevel - b.zLevel)
          const idx = allOnPane.findIndex(o => o.id === overlay.id)
          if (idx < allOnPane.length - 1) {
            const front = allOnPane[idx + 1]
            const ownZ = overlay.zLevel
            const frontZ = front.zLevel
            if (ownZ === frontZ) {
              widget!.overrideOverlay({ id: overlay.id, zLevel: frontZ + 1 })
            } else {
              widget!.overrideOverlay({ id: overlay.id, zLevel: frontZ })
              widget!.overrideOverlay({ id: front.id, zLevel: ownZ })
            }
          }
        },
      },
      {
        label: t('menu_send_backward', locale()),
        onClick: () => {
          if (!overlay.id || !overlay.paneId) return
          const allOnPane = widget!.getOverlays()
            .filter(o => o.paneId === overlay.paneId)
            .sort((a, b) => a.zLevel - b.zLevel)
          const idx = allOnPane.findIndex(o => o.id === overlay.id)
          if (idx > 0) {
            const back = allOnPane[idx - 1]
            const ownZ = overlay.zLevel
            const backZ = back.zLevel
            if (ownZ === backZ) {
              widget!.overrideOverlay({ id: overlay.id, zLevel: backZ - 1 })
            } else {
              widget!.overrideOverlay({ id: overlay.id, zLevel: backZ })
              widget!.overrideOverlay({ id: back.id, zLevel: ownZ })
            }
          }
        },
      },
      {
        label: t('menu_delete', locale()),
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
        replayDataList = data as unknown as KLineData[]
        widget?.resetData()
      },
      onBarUpdate: (bar) => {
        const kData = bar as unknown as KLineData
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
    createOverlay: (value) => widget!.createOverlay(value),
    getOverlays: (filter) => widget!.getOverlays(filter),
    removeOverlay: (value) => widget!.removeOverlay(value),
    registerOverlay: (value) => registerOverlay(value),
    setTheme,
    getTheme: () => theme(),
    setStyles,
    getStyles: () => widget?.getStyles() ?? {} as Styles,
    setLocale,
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

  const documentResize = () => {
    widget?.resize()
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
    window.addEventListener('resize', documentResize)
    // 绑定到 container 而非 window，避免图表外的按键误触发
    widgetRef!.addEventListener('keydown', handleKeyDown)
    widget = init(widgetRef!, {
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
          const formatTable: Record<string, { xAxis: string; default: string }> = {
            ms: { xAxis: 'HH:mm:ss', default: 'YYYY-MM-DD HH:mm:ss' },
            second: { xAxis: 'HH:mm:ss', default: 'YYYY-MM-DD HH:mm:ss' },
            minute: { xAxis: 'HH:mm', default: 'YYYY-MM-DD HH:mm' },
            hour: { xAxis: 'MM-DD HH:mm', default: 'YYYY-MM-DD HH:mm' },
            day: { xAxis: 'YYYY-MM-DD', default: 'YYYY-MM-DD' },
            week: { xAxis: 'YYYY-MM-DD', default: 'YYYY-MM-DD' },
            month: { xAxis: 'YYYY-MM', default: 'YYYY-MM-DD' },
            year: { xAxis: 'YYYY', default: 'YYYY-MM-DD' },
          }
          const formatInfo = formatTable[period().timespan]
          return utils.formatDate(dateTimeFormat, timestamp,
            type === 'xAxis' ? formatInfo?.xAxis ?? 'YYYY-MM-DD HH:mm' :
              formatInfo?.default ?? 'YYYY-MM-DD HH:mm'
          )
        },
      },
    })

    if (widget) {
      const watermarkContainer = widget.getDom('candle_pane', 'main')
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

      const priceUnitContainer = widget.getDom('candle_pane', 'yAxis')
      priceUnitDom = document.createElement('span')
      priceUnitDom.className = 'klinecharts-pro-price-unit'
      priceUnitContainer?.appendChild(priceUnitDom)
    }

    // Capture default styles once for "restore defaults" in settings modal
    if (widget) {
      setWidgetDefaultStyles(structuredClone(widget.getStyles()))
    }

    ;(async () => {
      for (const indicator of mainIndicators()) {
        await createIndicator(widget, indicator, true, 'candle_pane')
      }
      const subIndicatorMap: Record<string, string> = {}
      for (const indicator of props.subIndicators!) {
        const paneId = await createIndicator(widget, indicator, true)
        if (paneId) {
          subIndicatorMap[indicator] = paneId
        }
      }
      setSubIndicators(subIndicatorMap)
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
    widget?.subscribeAction('onIndicatorTooltipFeatureClick', (data: unknown) => {
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
            if (d.paneId === 'candle_pane') {
              const newMainIndicators = [...mainIndicators()]
              widget?.removeIndicator({ paneId: 'candle_pane', name: d.indicatorName })
              newMainIndicators.splice(newMainIndicators.indexOf(d.indicatorName), 1)
              setMainIndicators(newMainIndicators)
            } else {
              const newIndicators: Record<string, string> = { ...subIndicators() }
              widget?.removeIndicator({ paneId: d.paneId, name: d.indicatorName })
              delete newIndicators[d.indicatorName]
              setSubIndicators(newIndicators)
            }
            break
        }
      }
    })
    // 点击蜡烛区域时清除 overlay 选中状态
    widget?.subscribeAction('onCandleBarClick', () => {
      setSelectedOverlay(null)
    })
    // 十字光标变化时更新数据窗口
    widget?.subscribeAction('onCrosshairChange', (data: unknown) => {
      const crosshair = data as Crosshair | undefined
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
        const allIndicators = widget.getIndicators()
        if (allIndicators && allIndicators.length > 0) {
          const paneGroups: Record<string, Indicator[]> = {}
          for (const ind of allIndicators) {
            if (!paneGroups[ind.paneId]) paneGroups[ind.paneId] = []
            paneGroups[ind.paneId].push(ind)
          }
          for (const [paneId, indicators] of Object.entries(paneGroups)) {
            if (paneId !== 'candle_pane') {
              rows.push({ label: `[${paneId}]`, value: '', color: '#888' })
            }
            for (const ind of indicators) {
              const vals = ind.result as Record<string, unknown>[] | undefined
              if (vals && vals.length > 0) {
                const last = vals[vals.length - 1]
                for (const k in last) {
                  if (k !== 'timestamp' && k !== 'dataIndex') {
                    addRow(`${ind.name}.${k}`, last[k])
                  }
                }
              }
            }
          }
        }
      }
      setDataWindowData(rows)
    })
  })

  onCleanup(() => {
    window.removeEventListener('resize', documentResize)
    widgetRef!.removeEventListener('keydown', handleKeyDown)
    // 取消实时数据订阅，防止组件卸载后幽灵回调
    props.datafeed.unsubscribe(symbol(), period())
    if (replayEngine) {
      replayEngine.stop()
      replayEngine.dispose()
      replayEngine = null
    }
    dispose(widgetRef!)
  })

  createEffect(() => {
    const s = symbol()
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
  })

  createEffect((prev?: PrevSymbolPeriod) => {
    if (prev) {
      props.datafeed.unsubscribe(prev.symbol, prev.period)
    }
    const s = symbol()
    const p = period()
    // 品种/周期切换，通知外层重置状态（如报警 prevPrice）
    if (prev) {
      props.onDataReset?.()
      props.undoRedoManager?.clear()
    }
    // 触发 chart 的 DataLoader 重新拉取数据
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
    widget?.setStyles({ indicator: { tooltip: { features: tooltipFeatures(t) } } })
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
      <Show when={symbolSearchModalVisible()}>
        <SymbolSearchModal
          locale={props.locale}
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
          locale={props.locale}
          mainIndicators={mainIndicators()}
          subIndicators={subIndicators()}
          onClose={() => {
            setIndicatorModalVisible(false)
          }}
          onMainIndicatorChange={async (data) => {
            const newMainIndicators = [...mainIndicators()]
            if (data.added) {
              await createIndicator(widget, data.name, true, 'candle_pane')
              newMainIndicators.push(data.name)
            } else {
              widget?.removeIndicator({ paneId: 'candle_pane', name: data.name })
              newMainIndicators.splice(newMainIndicators.indexOf(data.name), 1)
            }
            setMainIndicators(newMainIndicators)
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
          }}
        />
      </Show>
      <Show when={timezoneModalVisible()}>
        <TimezoneModal
          locale={props.locale}
          timezone={timezone()}
          onClose={() => {
            setTimezoneModalVisible(false)
          }}
          onConfirm={setTimezone}
        />
      </Show>
      <Show when={settingModalVisible()}>
        <SettingModal
          locale={props.locale}
          currentStyles={utils.clone(widget!.getStyles())}
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
          locale={props.locale}
          url={screenshotUrl()}
          onClose={() => {
            setScreenshotUrl('')
          }}
        />
      </Show>
      <Show when={themeEditorVisible()}>
        <ThemeEditor
          locale={props.locale}
          currentStyles={widget!.getStyles()}
          onClose={() => setThemeEditorVisible(false)}
          onApply={(style) => widget?.setStyles(style)}
        />
      </Show>
      <Show when={indicatorSettingModalParams().visible}>
        <IndicatorSettingModal
          locale={props.locale}
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
      <PeriodBar
        locale={props.locale}
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
          setTimeout(() => widget?.resize(), 0)
        }}
      />
      <div class="klinecharts-pro-content">
        <Show when={loadingVisible()}>
          <Loading />
        </Show>
        <Show when={drawingBarVisible()}>
          <DrawingBar
            locale={props.locale}
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
          locale={props.locale}
          visible={dataWindowVisible()}
          onToggle={() => setDataWindowVisible(false)}
          data={dataWindowData()}
        />
        {/* 绘图 overlay 浮动属性工具栏 */}
        <OverlayPropertyBar
          locale={props.locale}
          visible={selectedOverlay() !== null}
          position={{ x: selectedOverlay()?.x ?? 0, y: selectedOverlay()?.y ?? 0 }}
          overlayId={selectedOverlay()?.id ?? ''}
          currentColor={selectedOverlay()?.color ?? '#1677ff'}
          currentFillColor={selectedOverlay()?.fillColor}
          currentLineWidth={selectedOverlay()?.lineWidth ?? 1}
          currentLineStyle={selectedOverlay()?.lineStyle ?? 'solid'}
          locked={selectedOverlay()?.locked ?? false}
          onColorChange={(color) => {
            const info = selectedOverlay()
            if (info && widget) {
              const next = { ...info, color }
              widget.overrideOverlay({ id: info.id, styles: buildStyles(next) })
              setSelectedOverlay(next)
              notifySelectedOverlayUpdate('property-bar', info.id)
            }
          }}
          onFillColorChange={(fillColor) => {
            const info = selectedOverlay()
            if (info && widget) {
              const next = {
                ...info,
                fillColor: fillColor === 'transparent' ? 'rgba(0,0,0,0)' : fillColor,
              }
              widget.overrideOverlay({ id: info.id, styles: buildStyles(next) })
              setSelectedOverlay(next)
              notifySelectedOverlayUpdate('property-bar', info.id)
            }
          }}
          onLineWidthChange={(width) => {
            const info = selectedOverlay()
            if (info && widget) {
              const next = { ...info, lineWidth: width }
              widget.overrideOverlay({ id: info.id, styles: buildStyles(next) })
              setSelectedOverlay(next)
              notifySelectedOverlayUpdate('property-bar', info.id)
            }
          }}
          onLineStyleChange={(style) => {
            const info = selectedOverlay()
            if (info && widget) {
              const next = { ...info, lineStyle: style as LineStyle }
              widget.overrideOverlay({ id: info.id, styles: buildStyles(next) })
              setSelectedOverlay(next)
              notifySelectedOverlayUpdate('property-bar', info.id)
            }
          }}
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
          locale={props.locale}
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