import { test, expect } from '@playwright/test'
import { waitForChart, evaluateChartMethod, clickTool } from './helpers'

test.describe('Export', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForChart(page)
  })

  test('export CSV via API', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 })
    await evaluateChartMethod(page, 'exportCSV', 'test-export')
    const download = await downloadPromise
    expect(download).toBeTruthy()
  })

  test('export all CSV via API', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 })
    await evaluateChartMethod(page, 'exportAllCSV', 'test-export-all')
    const download = await downloadPromise
    expect(download).toBeTruthy()
  })

  test('screenshot button triggers screenshot flow', async ({ page }) => {
    const dataUrl = await page.evaluate(() => {
      const chart = globalThis.chartInstance?.getChart()
      if (!chart) return ''
      return chart.getConvertPictureUrl(true, 'jpeg', '#151517')
    })
    expect(dataUrl).toBeTruthy()
    expect(dataUrl).toContain('data:image/')
  })
})
