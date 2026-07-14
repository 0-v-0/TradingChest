import { test, expect } from '@playwright/test'
import { waitForChart, clickTool, addIndicatorViaAPI, removeIndicatorViaAPI } from './helpers'

test.describe('Indicators', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForChart(page)
  })

  test('add a main indicator (EMA) via modal', async ({ page }) => {
    await clickTool(page, 'indicator')
    const modal = page.locator('.klinecharts-pro-modal')
    await expect(modal).toBeVisible()

    const emaRow = modal.locator('.main-indicator[data-name="EMA"]')
    await emaRow.click()

    // Close modal via close icon (Escape is intercepted by ShortcutManager)
    await modal.locator('.close-icon').click()
    await expect(modal).not.toBeVisible()

    const hasEma = await page.evaluate(() => {
      const chart = globalThis.chartInstance.getChart()
      if (!chart) return false
      const indicators = chart.getIndicators()
      return indicators.some((ind: any) => ind.name === 'EMA')
    })
    expect(hasEma).toBe(true)
  })

  test('add a sub indicator (MACD) via modal', async ({ page }) => {
    await clickTool(page, 'indicator')
    const modal = page.locator('.klinecharts-pro-modal')
    await expect(modal).toBeVisible()

    const macdRow = modal.locator('.sub-indicator[data-name="MACD"]')
    await macdRow.click()

    // Close modal via close icon (Escape is intercepted by ShortcutManager)
    await modal.locator('.close-icon').click()
    await expect(modal).not.toBeVisible()

    const hasMacd = await page.evaluate(() => {
      const chart = globalThis.chartInstance.getChart()
      if (!chart) return false
      const indicators = chart.getIndicators()
      return indicators.some((ind: any) => ind.name === 'MACD')
    })
    expect(hasMacd).toBe(true)
  })

  test('remove a main indicator via API', async ({ page }) => {
    await addIndicatorViaAPI(page, 'EMA', 'candle_pane')
    await page.waitForTimeout(500)

    const removed = await removeIndicatorViaAPI(page, 'EMA', 'candle_pane')
    expect(removed).toBe(true)
  })

  test('remove a sub indicator via API', async ({ page }) => {
    const indicatorId = await addIndicatorViaAPI(page, 'RSI')
    expect(indicatorId).toBeTruthy()
    await page.waitForTimeout(500)

    // Find the paneId for the created indicator
    const paneId = await page.evaluate((indId) => {
      const chart = globalThis.chartInstance.getChart()
      if (!chart) return null
      const ind = chart.getIndicators().find((i: any) => i.id === indId)
      return ind?.paneId ?? null
    }, indicatorId!)
    expect(paneId).toBeTruthy()

    const removed = await removeIndicatorViaAPI(page, 'RSI', paneId!)
    expect(removed).toBe(true)
  })

  test('search for an indicator in the modal', async ({ page }) => {
    await clickTool(page, 'indicator')
    const modal = page.locator('.klinecharts-pro-modal')
    await expect(modal).toBeVisible()

    const searchInput = modal.locator('.klinecharts-pro-indicator-modal-search input')
    await searchInput.fill('RSI')

    const rows = modal.locator('.row')
    const count = await rows.count()
    expect(count).toBeGreaterThan(0)
  })

  test('switch indicator category tabs', async ({ page }) => {
    await clickTool(page, 'indicator')
    const modal = page.locator('.klinecharts-pro-modal')
    await expect(modal).toBeVisible()

    const tabs = modal.locator('.klinecharts-pro-indicator-modal-tab')
    const tabCount = await tabs.count()
    expect(tabCount).toBeGreaterThan(1)

    await tabs.nth(1).click()
    await expect(tabs.nth(1)).toHaveClass(/active/)
  })
})
