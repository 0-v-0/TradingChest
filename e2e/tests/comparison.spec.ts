import { test, expect } from '@playwright/test'
import { waitForChart, evaluateChartMethod } from './helpers'

test.describe('Symbol Comparison', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForChart(page)
  })

  test('add a comparison symbol', async ({ page }) => {
    await evaluateChartMethod(page, 'addComparison', {
      ticker: 'ETH/USDT',
      name: 'Ethereum',
      pricePrecision: 2,
      volumePrecision: 0,
      priceCurrency: 'USDT',
    })
    await page.waitForTimeout(2000)

    const hasCompare = await page.evaluate(() => {
      const chart = globalThis.chartInstance.getChart()
      if (!chart) return false
      const indicators = chart.getIndicators()
      return Object.values(indicators).some((ind: any) =>
        ind.name?.startsWith('COMPARE_')
      )
    })
    expect(hasCompare).toBe(true)
  })

  test('remove a comparison symbol', async ({ page }) => {
    await evaluateChartMethod(page, 'addComparison', {
      ticker: 'ETH/USDT',
      name: 'Ethereum',
      pricePrecision: 2,
      volumePrecision: 0,
      priceCurrency: 'USDT',
    })
    await page.waitForTimeout(2000)

    await evaluateChartMethod(page, 'removeComparison', 'ETH/USDT')
    await page.waitForTimeout(500)

    const hasCompare = await page.evaluate(() => {
      const chart = globalThis.chartInstance.getChart()
      if (!chart) return false
      const indicators = chart.getIndicators()
      return Object.values(indicators).some((ind: any) =>
        ind.name?.startsWith('COMPARE_ETH')
      )
    })
    expect(hasCompare).toBe(false)
  })
})
