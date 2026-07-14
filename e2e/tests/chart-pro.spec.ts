import { test, expect } from '@playwright/test'
import { waitForChart, clickTool, setupReplayData } from './helpers'

test.describe('ChartProComponent E2E', () => {
  test('chart renders with candlestick data', async ({ page }) => {
    await page.goto('/')
    await waitForChart(page)
    const chartWidget = page.locator('.klinecharts-pro-widget')
    await expect(chartWidget).toBeVisible()
  })

  test('period bar displays periods', async ({ page }) => {
    await page.goto('/')
    await waitForChart(page)
    const periodBar = page.locator('.klinecharts-pro-period-bar')
    await expect(periodBar).toBeVisible()
    const periodBtns = page.locator('.klinecharts-pro-period-bar .period')
    const count = await periodBtns.count()
    expect(count).toBeGreaterThan(0)
  })

  test('drawing bar is visible', async ({ page }) => {
    await page.goto('/')
    await waitForChart(page)
    const drawingBar = page.locator('.klinecharts-pro-drawing-bar')
    await expect(drawingBar).toBeVisible()
  })

  test('indicator modal opens when clicking indicator button', async ({ page }) => {
    await page.goto('/')
    await waitForChart(page)
    await clickTool(page, 'indicator')
    const modal = page.locator('.klinecharts-pro-modal')
    await expect(modal).toBeVisible()
  })

  test('data window opens when clicking data window button', async ({ page }) => {
    await page.goto('/')
    await waitForChart(page)
    await clickTool(page, 'data-window')
    const dataWindow = page.locator('.klinecharts-pro-data-window')
    await expect(dataWindow).toBeVisible()
  })

  test('period change works', async ({ page }) => {
    await page.goto('/')
    await waitForChart(page)
    const firstPeriod = page.locator('.klinecharts-pro-period-bar .period').first()
    await firstPeriod.click()
    await expect(firstPeriod).toHaveClass(/selected/)
  })

  test('setting modal opens when clicking setting button', async ({ page }) => {
    await page.goto('/')
    await waitForChart(page)
    await clickTool(page, 'setting')
    const modal = page.locator('.klinecharts-pro-modal')
    await expect(modal).toBeVisible()
  })

  test('symbol search modal opens when clicking symbol name', async ({ page }) => {
    await page.goto('/')
    await waitForChart(page)
    await page.locator('.klinecharts-pro-period-bar .symbol').click()
    const modal = page.locator('.klinecharts-pro-modal')
    await expect(modal).toBeVisible()
  })

  test('symbol search returns results', async ({ page }) => {
    await page.goto('/')
    await waitForChart(page)
    await page.locator('.klinecharts-pro-period-bar .symbol').click()
    const modal = page.locator('.klinecharts-pro-modal')
    await expect(modal).toBeVisible()
    const input = modal.locator('input')
    await input.fill('BTC')
    const listItems = modal.locator('li')
    await expect(listItems.first()).toBeVisible({ timeout: 5000 })
  })

  test('data window shows OHLCV rows', async ({ page }) => {
    await page.goto('/')
    await waitForChart(page)
    await clickTool(page, 'data-window')
    const dataWindow = page.locator('.klinecharts-pro-data-window')
    await expect(dataWindow).toBeVisible()
    // Move mouse over the chart to trigger crosshair change
    const widgetBox = await page.locator('.klinecharts-pro-widget').boundingBox()
    if (widgetBox) {
      await page.mouse.move(widgetBox.x + widgetBox.width / 2, widgetBox.y + widgetBox.height / 2)
    }
    await page.waitForTimeout(500)
    const rows = dataWindow.locator('.klinecharts-pro-data-window-row')
    const count = await rows.count()
    expect(count).toBeGreaterThan(0)
  })
})

test.describe('Replay functionality', () => {
  test('replay bar appears when starting replay', async ({ page }) => {
    await page.goto('/')
    await waitForChart(page)
    await setupReplayData(page)
    await clickTool(page, 'replay')
    const replayBar = page.locator('.klinecharts-pro-replay-bar')
    await expect(replayBar).toBeVisible({ timeout: 5000 })
  })

  test('replay play/pause toggle works', async ({ page }) => {
    await page.goto('/')
    await waitForChart(page)
    await setupReplayData(page)
    await clickTool(page, 'replay')
    const replayBar = page.locator('.klinecharts-pro-replay-bar')
    await expect(replayBar).toBeVisible({ timeout: 5000 })
    const playPauseBtn = page.locator('.klinecharts-pro-replay-bar .play-pause')
    await playPauseBtn.click()
    await page.waitForTimeout(500)
    await playPauseBtn.click()
  })

  test('replay step forward works', async ({ page }) => {
    await page.goto('/')
    await waitForChart(page)
    await setupReplayData(page)
    await clickTool(page, 'replay')
    const replayBar = page.locator('.klinecharts-pro-replay-bar')
    await expect(replayBar).toBeVisible({ timeout: 5000 })
    const stepForwardBtn = page.locator('.klinecharts-pro-replay-bar .step-forward')
    await stepForwardBtn.click()
  })

  test('replay step backward works', async ({ page }) => {
    await page.goto('/')
    await waitForChart(page)
    await setupReplayData(page)
    await clickTool(page, 'replay')
    const replayBar = page.locator('.klinecharts-pro-replay-bar')
    await expect(replayBar).toBeVisible({ timeout: 5000 })
    await page.locator('.klinecharts-pro-replay-bar .step-forward').click()
    await page.locator('.klinecharts-pro-replay-bar .step-backward').click()
  })

  test('replay speed changes when clicking speed label', async ({ page }) => {
    await page.goto('/')
    await waitForChart(page)
    await setupReplayData(page)
    await clickTool(page, 'replay')
    const speedLabel = page.locator('.klinecharts-pro-replay-bar .replay-speed')
    await expect(speedLabel).toBeVisible({ timeout: 5000 })
    const initialSpeed = await speedLabel.textContent()
    expect(initialSpeed).toBe('1x')
    await speedLabel.click()
    const newSpeed = await speedLabel.textContent()
    expect(newSpeed).toBe('2x')
  })

  test('replay progress slider is interactive', async ({ page }) => {
    await page.goto('/')
    await waitForChart(page)
    await setupReplayData(page)
    await clickTool(page, 'replay')
    const progressSlider = page.locator('.klinecharts-pro-replay-bar .replay-progress-slider')
    await expect(progressSlider).toBeVisible({ timeout: 5000 })
    await progressSlider.fill('70')
  })

  test('replay exits when clicking exit button', async ({ page }) => {
    await page.goto('/')
    await waitForChart(page)
    await setupReplayData(page)
    await clickTool(page, 'replay')
    const replayBar = page.locator('.klinecharts-pro-replay-bar')
    await expect(replayBar).toBeVisible({ timeout: 5000 })
    const exitBtn = page.locator('.klinecharts-pro-replay-bar .replay-exit')
    await exitBtn.click()
    await expect(replayBar).not.toBeVisible()
  })
})
