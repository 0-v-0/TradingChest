import { Page } from '@playwright/test'

/** Wait for the chart widget and chartInstance to be ready */
export async function waitForChart(page: Page) {
  await page.waitForSelector('.klinecharts-pro-widget', { timeout: 10000 })
  await page.waitForFunction(() => !!globalThis.chartInstance, { timeout: 10000 })
}

/** Click a tool button in the period bar by its class suffix */
export async function clickTool(page: Page, className: string) {
  await page.locator(`.klinecharts-pro-period-bar .${className}`).click()
}

/** Setup replay data via the chart API (load static data into the chart) */
export async function setupReplayData(page: Page) {
  await page.evaluate(() => {
    const chart = globalThis.chartInstance
    if (!chart) return
    const widget = chart.getChart()
    if (!widget) return
    const staticData = globalThis.staticData
    if (!staticData || staticData.length === 0) return
    ;(widget as any).setDataLoader({
      getBars: (params: any) => {
        params.callback(staticData, staticData.length > 0)
      },
    })
    const mockSymbol = globalThis.mockSymbol
    const mockPeriod = globalThis.mockPeriod
    ;(widget as any).setSymbol({
      ticker: mockSymbol.ticker,
      pricePrecision: mockSymbol.pricePrecision ?? 2,
      volumePrecision: mockSymbol.volumePrecision ?? 0,
    })
    ;(widget as any).setPeriod({ type: mockPeriod.timespan, span: mockPeriod.multiplier })
  })
  await page.waitForTimeout(2000)
}

/** Create an overlay via the chart API */
export async function createOverlayViaAPI(page: Page, name: string): Promise<string | null> {
  return page.evaluate((overlayName) => {
    const chart = globalThis.chartInstance
    if (!chart) return null
    return chart.createOverlay(overlayName as any) as string | null
  }, name)
}

/** Remove an overlay via the chart API */
export async function removeOverlayViaAPI(page: Page, id: string): Promise<boolean> {
  return page.evaluate((overlayId) => {
    const chart = globalThis.chartInstance
    if (!chart) return false
    return chart.removeOverlay(overlayId as any) as boolean
  }, id)
}

/** Get all overlays via the chart API */
export async function getOverlaysViaAPI(page: Page): Promise<any[]> {
  return page.evaluate(() => {
    const chart = globalThis.chartInstance
    if (!chart) return []
    return chart.getOverlays() as any[]
  })
}

/** Add an indicator via the chart API */
export async function addIndicatorViaAPI(page: Page, name: string, targetPaneId?: string): Promise<string | null> {
  return page.evaluate(({ indicatorName, paneId }) => {
    const chart = globalThis.chartInstance
    if (!chart) return null
    const widget = chart.getChart()
    if (!widget) return null
    const spec: Record<string, unknown> = { name: indicatorName }
    if (paneId) spec.paneId = paneId
    return widget.createIndicator(spec as any, !!paneId) as string | null
  }, { indicatorName: name, paneId: targetPaneId ?? undefined })
}

/** Remove an indicator via the chart API */
export async function removeIndicatorViaAPI(page: Page, name: string, targetPaneId: string): Promise<boolean> {
  return page.evaluate(({ indicatorName, paneId }) => {
    const chart = globalThis.chartInstance
    if (!chart) return false
    const widget = chart.getChart()
    if (!widget) return false
    return widget.removeIndicator({ name: indicatorName, paneId: paneId! }) as boolean
  }, { indicatorName: name, paneId: targetPaneId })
}

/** Call a method on globalThis.chartInstance and return the result */
export async function evaluateChartMethod<T = void>(page: Page, method: string, ...args: any[]): Promise<T | undefined> {
  return page.evaluate(({ method: m, args: a }) => {
    const chart = globalThis.chartInstance
    if (!chart || typeof (chart as any)[m] !== 'function') return undefined
    return (chart as any)[m](...a) as T
  }, { method, args })
}
