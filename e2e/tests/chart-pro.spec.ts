import { test, expect, Page } from '@playwright/test'

test.describe('ChartProComponent E2E', () => {
  test('chart renders with candlestick data', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.klinecharts-pro-widget', { timeout: 10000 })
    const chartContainer = page.locator('.klinecharts-pro-widget')
    await expect(chartContainer).toBeVisible()
  })

  test('period bar displays periods', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.klinecharts-pro-widget', { timeout: 10000 })
    const periodBar = page.locator('.klinecharts-pro-period-bar')
    await expect(periodBar).toBeVisible()
    const periodButtons = periodBar.locator('.period')
    const count = await periodButtons.count()
    expect(count).toBeGreaterThan(0)
  })

  test('drawing bar is visible', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.klinecharts-pro-widget', { timeout: 10000 })
    const drawingBar = page.locator('.klinecharts-pro-drawing-bar')
    await expect(drawingBar).toBeVisible()
  })

  test('indicator modal opens when clicking indicator button', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.klinecharts-pro-widget', { timeout: 10000 })
    const periodBar = page.locator('.klinecharts-pro-period-bar')
    const tools = periodBar.locator('.tools')
    const indicatorTool = tools.first()
    await indicatorTool.click()
    const modal = page.locator('.klinecharts-pro-modal')
    await expect(modal).toBeVisible()
  })

  test('data window opens when clicking data window button', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.klinecharts-pro-widget', { timeout: 10000 })
    const periodBar = page.locator('.klinecharts-pro-period-bar')
    const tools = periodBar.locator('.tools')
    const dataWindowTool = tools.nth(2)
    await dataWindowTool.click()
    const dataWindow = page.locator('.klinecharts-pro-data-window')
    await expect(dataWindow).toBeVisible()
  })

  test('period change works', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.klinecharts-pro-widget', { timeout: 10000 })
    const periodBar = page.locator('.klinecharts-pro-period-bar')
    const periodButtons = periodBar.locator('.period')
    const firstPeriod = periodButtons.first()
    const firstText = await firstPeriod.textContent()
    expect(firstText).toBeTruthy()
    await firstPeriod.click()
    await expect(firstPeriod).toHaveClass(/selected/)
  })

  test.describe('Replay functionality', () => {
    const setupData = async (page: Page) => {
      await page.evaluate(() => {
        const chart = (window as any).chartInstance
        if (!chart) return
        const widget = chart.getChart?.()
        if (!widget) return
        const staticData = (window as any).staticData
        if (!staticData || staticData.length === 0) return
        widget.setDataLoader({
          getBars: (params: any) => {
            params.callback(staticData, staticData.length > 0)
          }
        })
        const mockSymbol = (window as any).mockSymbol
        const mockPeriod = (window as any).mockPeriod
        widget.setSymbol({
          ticker: mockSymbol.ticker,
          pricePrecision: mockSymbol.pricePrecision ?? 2,
          volumePrecision: mockSymbol.volumePrecision ?? 0,
        })
        widget.setPeriod({ type: mockPeriod.timespan, span: mockPeriod.multiplier })
      })
      await page.waitForTimeout(2000)
    }

    const startReplay = async (page: Page) => {
      const periodBar = page.locator('.klinecharts-pro-period-bar')
      const tools = periodBar.locator('.tools')
      const replayTool = tools.nth(4)
      await replayTool.click()
      const replayBar = page.locator('.klinecharts-pro-replay-bar')
      await expect(replayBar).toBeVisible({ timeout: 5000 })
      return replayBar
    }

    test('replay bar appears when starting replay', async ({ page }) => {
      await page.goto('/')
      await page.waitForSelector('.klinecharts-pro-widget', { timeout: 10000 })
      await setupData(page)
      await startReplay(page)
    })

    test('replay play/pause toggle works', async ({ page }) => {
      await page.goto('/')
      await page.waitForSelector('.klinecharts-pro-widget', { timeout: 10000 })
      await setupData(page)
      const replayBar = await startReplay(page)
      const playPauseBtn = replayBar.locator('.replay-btn').nth(1)
      await playPauseBtn.click()
      await page.waitForTimeout(500)
      await playPauseBtn.click()
    })

    test('replay step forward works', async ({ page }) => {
      await page.goto('/')
      await page.waitForSelector('.klinecharts-pro-widget', { timeout: 10000 })
      await setupData(page)
      const replayBar = await startReplay(page)
      const stepForwardBtn = replayBar.locator('.replay-btn').nth(2)
      await stepForwardBtn.click()
      const positionSpan = replayBar.locator('.replay-progress span').first()
      const position = await positionSpan.textContent()
      expect(position).toBeTruthy()
    })

    test('replay step backward works', async ({ page }) => {
      await page.goto('/')
      await page.waitForSelector('.klinecharts-pro-widget', { timeout: 10000 })
      await setupData(page)
      const replayBar = await startReplay(page)
      const stepBackwardBtn = replayBar.locator('.replay-btn').first()
      await stepBackwardBtn.click()
      const positionSpan = replayBar.locator('.replay-progress span').first()
      const position = await positionSpan.textContent()
      expect(position).toBeTruthy()
    })

    test('replay speed changes when clicking speed label', async ({ page }) => {
      await page.goto('/')
      await page.waitForSelector('.klinecharts-pro-widget', { timeout: 10000 })
      await setupData(page)
      const replayBar = await startReplay(page)
      const speedLabel = replayBar.locator('.replay-speed')
      const initialSpeed = await speedLabel.textContent()
      expect(initialSpeed).toBe('1x')
      await speedLabel.click()
      const newSpeed = await speedLabel.textContent()
      expect(newSpeed).toBe('2x')
    })

    test('replay progress slider is interactive', async ({ page }) => {
      await page.goto('/')
      await page.waitForSelector('.klinecharts-pro-widget', { timeout: 10000 })
      await setupData(page)
      const replayBar = await startReplay(page)
      const progressSlider = replayBar.locator('input[type="range"]')
      await expect(progressSlider).toBeVisible()
      await progressSlider.fill('70')
      const positionSpan = replayBar.locator('.replay-progress span').first()
      const position = await positionSpan.textContent()
      expect(parseInt(position ?? '0')).toBeGreaterThan(0)
    })

    test('replay exits when clicking exit button', async ({ page }) => {
      await page.goto('/')
      await page.waitForSelector('.klinecharts-pro-widget', { timeout: 10000 })
      await setupData(page)
      const periodBar = page.locator('.klinecharts-pro-period-bar')
      const tools = periodBar.locator('.tools')
      const replayTool = tools.nth(4)
      await replayTool.click()
      const replayBar = page.locator('.klinecharts-pro-replay-bar')
      await expect(replayBar).toBeVisible()
      const exitBtn = replayBar.locator('.replay-exit')
      await exitBtn.click()
      await expect(replayBar).not.toBeVisible()
    })
  })
})
