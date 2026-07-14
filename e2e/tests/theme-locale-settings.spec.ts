import { test, expect } from '@playwright/test'
import { waitForChart, clickTool, evaluateChartMethod } from './helpers'

test.describe('Theme, Locale, and Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForChart(page)
  })

  test('switch theme from dark to light', async ({ page }) => {
    await evaluateChartMethod(page, 'setTheme', 'light')
    await page.waitForTimeout(500)

    const theme = await page.evaluate(() => {
      const container = document.querySelector('.klinecharts-pro')
      return container?.getAttribute('data-theme')
    })
    expect(theme).toBe('light')
  })

  test('switch theme back to dark', async ({ page }) => {
    await evaluateChartMethod(page, 'setTheme', 'light')
    await page.waitForTimeout(300)
    await evaluateChartMethod(page, 'setTheme', 'dark')
    await page.waitForTimeout(300)

    const theme = await page.evaluate(() => {
      const container = document.querySelector('.klinecharts-pro')
      return container?.getAttribute('data-theme')
    })
    expect(theme).toBe('dark')
  })

  test('switch locale changes UI text', async ({ page }) => {
    // First, wait for initial locale to load
    await page.waitForFunction(() => {
      const btn = document.querySelector('.klinecharts-pro-period-bar .indicator span')
      return btn && btn.textContent !== 'indicator'
    }, { timeout: 10000 })

    const indicatorBtn = page.locator('.klinecharts-pro-period-bar .indicator span')
    const initialText = await indicatorBtn.textContent()

    await evaluateChartMethod(page, 'setLocale', 'zh-CN')
    // Wait for zh-CN locale to load and UI to re-render
    await page.waitForFunction((initText) => {
      const btn = document.querySelector('.klinecharts-pro-period-bar .indicator span')
      return btn && btn.textContent !== initText
    }, initialText, { timeout: 10000 })

    const newText = await indicatorBtn.textContent()
    expect(newText).not.toBe(initialText)
  })

  test('settings modal opens and renders', async ({ page }) => {
    await clickTool(page, 'setting')
    const modal = page.locator('.klinecharts-pro-modal')
    await expect(modal).toBeVisible()

    const groupLabels = modal.locator('.klinecharts-pro-setting-modal-group-label')
    const count = await groupLabels.count()
    expect(count).toBeGreaterThan(0)
  })

  test('theme editor opens and renders', async ({ page }) => {
    await clickTool(page, 'theme')
    const editor = page.locator('.klinecharts-pro-modal').filter({ has: page.locator('.klinecharts-pro-theme-editor') })
    await expect(editor).toBeVisible()

    const rows = editor.locator('.klinecharts-pro-theme-editor-row')
    const count = await rows.count()
    expect(count).toBeGreaterThan(0)
  })

  test('timezone modal opens and renders', async ({ page }) => {
    await clickTool(page, 'timezone')
    const modal = page.locator('.klinecharts-pro-modal')
    await expect(modal).toBeVisible()
  })
})
