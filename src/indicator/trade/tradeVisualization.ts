/**
 * 交易可视化指标
 * calc 中将交易数据映射到每根 K 线，draw 中直接用数据索引绘制
 */
import type { Indicator, IndicatorTemplate, KLineData } from 'klinecharts'
import { type Direction, COLOR_UP_ALPHA_12, COLOR_UP_ALPHA_15, COLOR_UP_ALPHA_40, COLOR_UP_ALPHA_50, COLOR_UP_ALPHA_90, COLOR_UP_ALPHA_95, COLOR_DOWN_ALPHA_12, COLOR_DOWN_ALPHA_15, COLOR_DOWN_ALPHA_40, COLOR_DOWN_ALPHA_50, COLOR_DOWN_ALPHA_90, COLOR_DOWN_ALPHA_95 } from '../../types'
import { findNearestIndex } from '../../core/findNearestIndex'

/** Label connector line length (px) */
const LABEL_OFFSET = 35
/** Label box height (px) */
const LABEL_HEIGHT = 18

export interface TradeRecord {
  entryTs: number
  exitTs: number
  entryPrice: number
  exitPrice: number
  pnl: number
  direction: Direction
}

interface BarTradeInfo {
  // 该 K 线是入场点
  entry?: { price: number; direction: Direction; pnl: number; trade: TradeRecord }
  // 该 K 线是出场点
  exit?: { price: number; direction: Direction; pnl: number; trade: TradeRecord }
  // 该 K 线所在的交易区间列表（用于画矩形）
  ranges?: Array<{
    entryPrice: number
    exitPrice: number
    pnl: number
    isStart: boolean
    isEnd: boolean
  }>
}

/** 主题感知的交易可视化颜色配置 */
export interface TradeVisColors {
  /** 盈利区间背景色 */
  profitBg: string
  /** 亏损区间背景色 */
  lossBg: string
  /** 盈利区间边框色 */
  profitBorder: string
  /** 亏损区间边框色 */
  lossBorder: string
  /** 做多入场/做空出场标记色 */
  longColor: string
  /** 做空入场/做多出场标记色 */
  shortColor: string
  /** 标签文字颜色 */
  labelTextColor: string
}

/** 默认颜色（light 主题） */
export const defaultTradeVisColors: TradeVisColors = {
  profitBg: COLOR_UP_ALPHA_12,
  lossBg: COLOR_DOWN_ALPHA_12,
  profitBorder: COLOR_UP_ALPHA_40,
  lossBorder: COLOR_DOWN_ALPHA_40,
  longColor: COLOR_UP_ALPHA_90,
  shortColor: COLOR_DOWN_ALPHA_90,
  labelTextColor: '#fff',
}

/** Dark 主题颜色 */
export const darkTradeVisColors: TradeVisColors = {
  profitBg: COLOR_UP_ALPHA_15,
  lossBg: COLOR_DOWN_ALPHA_15,
  profitBorder: COLOR_UP_ALPHA_50,
  lossBorder: COLOR_DOWN_ALPHA_50,
  longColor: COLOR_UP_ALPHA_95,
  shortColor: COLOR_DOWN_ALPHA_95,
  labelTextColor: '#fff',
}

/** extendData shape for TradeVis indicator */
export interface TradeVisExtendData {
  trades: TradeRecord[]
  /** 实例 ID，用于多图表隔离点击检测数据 */
  _instanceId?: string
  /** 可选：主题感知颜色配置，未提供时使用 defaultTradeVisColors */
  colors?: Partial<TradeVisColors>
}

type HitTarget = { x: number; y: number; trade: TradeRecord; type: 'entry' | 'exit' }
type BarIndex = { trade: TradeRecord; entryIdx: number; exitIdx: number }

/** Per-instance hit targets and bar indices, keyed by _instanceId (default: '_default') */
const _hitTargetsMap = new Map<string, HitTarget[]>()
const _tradeBarIndicesMap = new Map<string, BarIndex[]>()

/** Get the latest visible trade marker positions for a specific instance. */
export function getTradeVisHitTargets(
  instanceId?: string,
): ReadonlyArray<{ x: number; y: number; trade: TradeRecord; type: string }> {
  return _hitTargetsMap.get(instanceId ?? '_default') ?? []
}

/** Clean up per-instance data when a chart instance is disposed. */
export function cleanupTradeVisInstance(instanceId: string): void {
  _hitTargetsMap.delete(instanceId)
  _tradeBarIndicesMap.delete(instanceId)
}

/**
 * Binary search: find index of bar with timestamp closest to target.
 * Assumes dataList is sorted by timestamp ascending.
 * Exported for testing.
 */
export function findClosestBar(dataList: Pick<KLineData, 'timestamp'>[], targetTs: number): number {
  return findNearestIndex(dataList, targetTs, Infinity, d => d.timestamp)
}

const tradeVisualization: IndicatorTemplate<BarTradeInfo, number> = {
  name: 'TradeVis',
  shortName: 'Trades',
  calcParams: [],
  figures: [],
  calc: (dataList: KLineData[], indicator: Indicator<BarTradeInfo, number>) => {
    const ext = indicator.extendData as TradeVisExtendData | TradeRecord[] | undefined
    const trades = Array.isArray(ext) ? ext : ext?.trades
    const instanceId = (!Array.isArray(ext) && ext?._instanceId) || '_default'
    if (!trades || trades.length === 0) {
      _tradeBarIndicesMap.set(instanceId, [])
      return dataList.map(() => ({}))
    }

    const n = dataList.length
    const entryMap = new Map<
      number,
      { price: number; direction: Direction; pnl: number; trade: TradeRecord }
    >()
    const exitMap = new Map<
      number,
      { price: number; direction: Direction; pnl: number; trade: TradeRecord }
    >()
    const barIndices: Array<{ trade: TradeRecord; entryIdx: number; exitIdx: number }> = []

    for (const t of trades) {
      // O(log n) binary search instead of O(n) linear scan
      const entryIdx = findClosestBar(dataList, t.entryTs)
      const exitIdx = findClosestBar(dataList, t.exitTs)

      if (entryIdx >= 0) {
        entryMap.set(entryIdx, {
          price: t.entryPrice,
          direction: t.direction,
          pnl: t.pnl,
          trade: t,
        })
      }
      if (exitIdx >= 0) {
        exitMap.set(exitIdx, { price: t.exitPrice, direction: t.direction, pnl: t.pnl, trade: t })
      }
      if (entryIdx >= 0 && exitIdx >= 0) {
        barIndices.push({ trade: t, entryIdx, exitIdx })
      }
    }

    // Sweep-line (difference array) for range population: O(n + trades)
    // For each trade, mark +1 at lo and -1 after hi; prefix sum gives active count per bar.
    // Then in a second pass, assign trade ranges to bars where count > 0.
    const diff = new Int32Array(n)
    // Group trades by their range start (lo) for the sweep pass
    const tradesStartingAt: TradeRecord[][] = new Array(n)
    for (const { trade: t, entryIdx, exitIdx } of barIndices) {
      const lo = Math.min(entryIdx, exitIdx)
      const hi = Math.max(entryIdx, exitIdx)
      diff[lo]++
      if (hi + 1 < n) diff[hi + 1]--
      if (!tradesStartingAt[lo]) tradesStartingAt[lo] = []
      tradesStartingAt[lo].push(t)
    }

    const rangeSet = new Map<
      number,
      Array<{ entryPrice: number; exitPrice: number; pnl: number }>
    >()
    const activeTrades: TradeRecord[] = []
    // Track each trade's hi boundary for removal
    const tradeHi = new Map<TradeRecord, number>()
    for (const { trade: t, entryIdx, exitIdx } of barIndices) {
      tradeHi.set(t, Math.max(entryIdx, exitIdx))
    }

    let sweepCount = 0
    for (let i = 0; i < n; i++) {
      // Add trades starting at this bar
      const starting = tradesStartingAt[i]
      if (starting) {
        for (const t of starting) activeTrades.push(t)
      }
      sweepCount += diff[i]
      // Remove trades whose range ended before this bar (hi < i)
      if (activeTrades.length > 0) {
        let w = 0
        for (let j = 0; j < activeTrades.length; j++) {
          const t = activeTrades[j]
          if (tradeHi.get(t)! >= i) {
            activeTrades[w++] = t
          }
        }
        activeTrades.length = w
      }
      if (sweepCount > 0 && activeTrades.length > 0) {
        const ranges: Array<{ entryPrice: number; exitPrice: number; pnl: number }> = []
        for (let j = 0; j < activeTrades.length; j++) {
          const t = activeTrades[j]
          ranges.push({ entryPrice: t.entryPrice, exitPrice: t.exitPrice, pnl: t.pnl })
        }
        rangeSet.set(i, ranges)
      }
    }

    // Store for draw to use directly (avoids O(n*m) re-scan in draw)
    _tradeBarIndicesMap.set(instanceId, barIndices)

    return dataList.map((_, i) => {
      const info: BarTradeInfo = {}
      if (entryMap.has(i)) info.entry = entryMap.get(i)!
      if (exitMap.has(i)) info.exit = exitMap.get(i)!
      if (rangeSet.has(i)) {
        info.ranges = rangeSet.get(i)!.map((r) => ({
          ...r,
          isStart: entryMap.has(i),
          isEnd: exitMap.has(i),
        }))
      }
      return info
    })
  },
  /* c8 ignore start */
  draw: ({ ctx, indicator, bounding, xAxis, yAxis, chart }) => {
    const visibleRange = chart.getVisibleRange()
    const result = indicator.result as BarTradeInfo[]
    if (!result || result.length === 0) return false

    const ext = indicator.extendData as TradeVisExtendData | TradeRecord[] | undefined
    const instanceId = (!Array.isArray(ext) && ext?._instanceId) || '_default'
    const c: TradeVisColors = { ...defaultTradeVisColors, ...((!Array.isArray(ext) && ext?.colors) ?? {}) }

    ctx.save()

    // ── 第一遍：画持仓区间矩形（使用 calc 阶段预计算的 barIndices，O(trades) 而非 O(trades*bars)） ──
    const tradeBarIndices = _tradeBarIndicesMap.get(instanceId) ?? []
    for (const { trade: t, entryIdx, exitIdx } of tradeBarIndices) {
      const isProfit = t.pnl >= 0
      const bgColor = isProfit ? c.profitBg : c.lossBg
      const borderColor = isProfit ? c.profitBorder : c.lossBorder

      const x1 = xAxis.convertToPixel(entryIdx)
      const x2 = xAxis.convertToPixel(exitIdx)
      const y1 = yAxis.convertToPixel(t.entryPrice)
      const y2 = yAxis.convertToPixel(t.exitPrice)

      const left = Math.min(x1, x2)
      const right = Math.max(x1, x2)
      const top = Math.min(y1, y2)
      const bottom = Math.max(y1, y2)

      if (right >= 0 && left <= bounding.width && bottom >= 0 && top <= bounding.height) {
        ctx.fillStyle = bgColor
        ctx.fillRect(left, top, right - left, bottom - top)
        ctx.strokeStyle = borderColor
        ctx.lineWidth = 1
        ctx.setLineDash([4, 3])
        ctx.strokeRect(left, top, right - left, bottom - top)
        ctx.setLineDash([])
      }
    }

    // ── 第二遍：画入场/出场标记 + 收集可见标记像素坐标用于点击检测 ──
    const hitTargets: Array<{ x: number; y: number; trade: TradeRecord; type: 'entry' | 'exit' }> =
      []

    for (let i = visibleRange.from; i < visibleRange.to; i++) {
      const info = result[i]
      if (!info) continue

      const barX = xAxis.convertToPixel(i)

      if (info.entry) {
        const y = yAxis.convertToPixel(info.entry.price)
        const isLong = info.entry.direction === 'long'
        const color = isLong ? c.longColor : c.shortColor
        const label = isLong ? 'B' : 'S'
        drawLabel(ctx, barX, y, label, color, c.labelTextColor)
        // trade reference is pre-stored in calc phase — no trades.find() needed
        hitTargets.push({ x: barX, y: y - LABEL_OFFSET - LABEL_HEIGHT / 2, trade: info.entry.trade, type: 'entry' })
      }

      if (info.exit) {
        const y = yAxis.convertToPixel(info.exit.price)
        const isLong = info.exit.direction === 'long'
        const color = isLong ? c.shortColor : c.longColor
        const label = isLong ? 'S' : 'B'
        const pnlStr = `${label} ${info.exit.pnl >= 0 ? '+' : ''}${info.exit.pnl.toFixed(0)}`
        drawLabel(ctx, barX, y, pnlStr, color, c.labelTextColor)
        hitTargets.push({ x: barX, y: y - LABEL_OFFSET - LABEL_HEIGHT / 2, trade: info.exit.trade, type: 'exit' })
      }
    }

    // Update per-instance targets (for KLineChartPro click detection)
    _hitTargetsMap.set(instanceId, hitTargets)

    ctx.restore()
    return false
  },
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  color: string,
  textColor = '#fff',
) {
  const offset = LABEL_OFFSET

  ctx.strokeStyle = color
  ctx.lineWidth = 1
  ctx.setLineDash([2, 2])
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x, y - offset + 5)
  ctx.stroke()
  ctx.setLineDash([])

  ctx.font = '11px sans-serif'
  const tw = ctx.measureText(text).width
  const w = tw + 10
  const h = LABEL_HEIGHT
  const lx = x - w / 2
  const ly = y - offset - h
  const r = 3

  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(lx + r, ly)
  ctx.lineTo(lx + w - r, ly)
  ctx.quadraticCurveTo(lx + w, ly, lx + w, ly + r)
  ctx.lineTo(lx + w, ly + h - r)
  ctx.quadraticCurveTo(lx + w, ly + h, lx + w - r, ly + h)
  ctx.lineTo(lx + r, ly + h)
  ctx.quadraticCurveTo(lx, ly + h, lx, ly + h - r)
  ctx.lineTo(lx, ly + r)
  ctx.quadraticCurveTo(lx, ly, lx + r, ly)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = textColor
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x, ly + h / 2)
}
/* c8 ignore stop */

export default tradeVisualization
