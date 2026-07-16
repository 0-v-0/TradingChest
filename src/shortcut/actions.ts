import type { Nullable, Chart } from 'klinecharts'

/** Minimal interface that shortcut actions need from the host */
export interface ShortcutActionContext {
  getChart(): Nullable<Chart>
  zoom(factor: number): void
  undo(): void
  redo(): void
  exportScreenshot(options?: { format?: 'png' | 'jpeg'; backgroundColor?: string; filename?: string }): void
}

/**
 * Build the default shortcut action map for a chart context.
 * Separates action wiring from KLineChartPro so the same set can be reused
 * or tested independently.
 */
export function createDefaultActions(ctx: ShortcutActionContext): Record<string, () => void> {
  return {
    // Navigation
    'nav:scrollToEnd': () => {
      ctx.getChart()?.scrollToRealTime()
    },
    'nav:scrollToStart': () => {
      ctx.getChart()?.scrollToDataIndex(0)
    },
    'nav:zoomIn': () => {
      ctx.zoom(1.2)
    },
    'nav:zoomOut': () => {
      ctx.zoom(0.8)
    },
    // Chart operations
    'chart:screenshot': () => {
      ctx.exportScreenshot()
    },
    'chart:undo': () => {
      ctx.undo()
    },
    'chart:redo': () => {
      ctx.redo()
    },
    'chart:cancelDraw': () => {
      ctx.getChart()?.removeOverlay()
    },
    'chart:deleteSelected': () => {
      ctx.getChart()?.removeOverlay()
    },
    // Drawing tools
    'draw:straightLine': () => {
      ctx.getChart()?.createOverlay('straightLine')
    },
    'draw:horizontalStraightLine': () => {
      ctx.getChart()?.createOverlay('horizontalStraightLine')
    },
    'draw:verticalStraightLine': () => {
      ctx.getChart()?.createOverlay('verticalStraightLine')
    },
    'draw:fibonacciLine': () => {
      ctx.getChart()?.createOverlay('fibonacciLine')
    },
    'draw:rect': () => {
      ctx.getChart()?.createOverlay('rect')
    },
    'draw:brush': () => {
      ctx.getChart()?.createOverlay('simpleAnnotation')
    },
    'draw:dateAndPriceRange': () => {
      ctx.getChart()?.createOverlay('dateAndPriceRange')
    },
    // Toggles
    'toggle:crosshair': () => {
      const chart = ctx.getChart()
      if (!chart) return
      const s = chart.getStyles()
      const show = s.crosshair?.show !== false
      chart.setStyles({ crosshair: { show: !show } })
    },
    'toggle:grid': () => {
      const chart = ctx.getChart()
      if (!chart) return
      const s = chart.getStyles()
      const show = s.grid?.show !== false
      chart.setStyles({ grid: { show: !show } })
    },
  }
}
