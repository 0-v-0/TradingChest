import { test, expect } from '@playwright/test'
import { waitForChart } from './helpers'

test.describe('Chart Types', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForChart(page)
  })

  test('switch to Heikin Ashi chart type', async ({ page }) => {
    // Use KLineChartPro's createOverlay/indicator methods which handle registration
    const result = await page.evaluate(async () => {
      const chart = globalThis.chartInstance
      if (!chart) return { error: 'no chartInstance' }
      const widget = chart.getChart()
      if (!widget) return { error: 'no widget' }
      // Chart types are already registered via src/index.ts
      // Just need isStack=true for overlay on candle_pane
      const paneId = widget.createIndicator({ name: 'HeikinAshi', paneId: 'candle_pane' } as any, true)
      return { paneId }
    })
    expect(result.paneId).toBeTruthy()

    const hasHeikinAshi = await page.evaluate(() => {
      const chart = globalThis.chartInstance.getChart()
      if (!chart) return false
      const indicators = chart.getIndicators()
      return indicators.some((ind: any) => ind.name === 'HeikinAshi')
    })
    expect(hasHeikinAshi).toBe(true)
  })

  test('switch to Renko chart type', async ({ page }) => {
    const paneId = await page.evaluate(() => {
      const chart = globalThis.chartInstance
      if (!chart) return null
      const widget = chart.getChart()
      if (!widget) return null
      return widget.createIndicator({ name: 'Renko', paneId: 'candle_pane' } as any, true)
    })
    expect(paneId).toBeTruthy()

    const hasRenko = await page.evaluate(() => {
      const chart = globalThis.chartInstance.getChart()
      if (!chart) return false
      const indicators = chart.getIndicators()
      return indicators.some((ind: any) => ind.name === 'Renko')
    })
    expect(hasRenko).toBe(true)
  })

  test('switch back to candlestick by removing chart-type indicator', async ({ page }) => {
    const indicatorId = await page.evaluate(() => {
      const chart = globalThis.chartInstance
      if (!chart) return null
      const widget = chart.getChart()
      if (!widget) return null
      return widget.createIndicator({ name: 'HeikinAshi', paneId: 'candle_pane' } as any, true)
    })
    expect(indicatorId).toBeTruthy()
    await page.waitForTimeout(500)

    // Remove using the indicator name and candle_pane (where it was stacked)
    const removed = await page.evaluate(() => {
      const chart = globalThis.chartInstance
      if (!chart) return false
      const widget = chart.getChart()
      if (!widget) return false
      return widget.removeIndicator({ name: 'HeikinAshi', paneId: 'candle_pane' })
    })
    expect(removed).toBe(true)

    const hasHeikinAshi = await page.evaluate(() => {
      const chart = globalThis.chartInstance.getChart()
      if (!chart) return false
      const indicators = chart.getIndicators()
      return indicators.some((ind: any) => ind.name === 'HeikinAshi')
    })
    expect(hasHeikinAshi).toBe(false)
  })
})
