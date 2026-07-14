import { test, expect } from '@playwright/test'
import { waitForChart, createOverlayViaAPI } from './helpers'

test.describe('Context Menu', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForChart(page)
  })

  test('right-click on overlay shows context menu', async ({ page }) => {
    await createOverlayViaAPI(page, 'horizontalStraightLine')
    await page.waitForTimeout(500)

    const chartWidget = page.locator('.klinecharts-pro-widget')
    await chartWidget.click({ button: 'right' })
  })

  test('Escape closes context menu if open', async ({ page }) => {
    const chartWidget = page.locator('.klinecharts-pro-widget')
    await chartWidget.click({ button: 'right' })

    await page.keyboard.press('Escape')
    await page.waitForTimeout(200)

    const contextMenu = page.locator('.klinecharts-pro-context-menu')
    await expect(contextMenu).not.toBeVisible()
  })
})
