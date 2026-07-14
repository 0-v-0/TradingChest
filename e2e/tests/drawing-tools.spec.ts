import { test, expect } from '@playwright/test'
import { waitForChart, createOverlayViaAPI, removeOverlayViaAPI, getOverlaysViaAPI } from './helpers'

test.describe('Drawing Tools', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForChart(page)
  })

  test('drawing bar renders tool items', async ({ page }) => {
    const drawingBar = page.locator('.klinecharts-pro-drawing-bar')
    await expect(drawingBar).toBeVisible()
    const toolItems = drawingBar.locator('.tool-item')
    const count = await toolItems.count()
    expect(count).toBeGreaterThan(0)
  })

  test('create a horizontal straight line overlay via API', async ({ page }) => {
    const overlayId = await createOverlayViaAPI(page, 'horizontalStraightLine')
    expect(overlayId).toBeTruthy()

    const overlays = await getOverlaysViaAPI(page)
    expect(overlays.length).toBeGreaterThan(0)
  })

  test('remove an overlay via API', async ({ page }) => {
    const overlayId = await createOverlayViaAPI(page, 'horizontalStraightLine')
    expect(overlayId).toBeTruthy()

    const removed = await removeOverlayViaAPI(page, overlayId!)
    expect(removed).toBe(true)

    const overlays = await getOverlaysViaAPI(page)
    expect(overlays.find((o: any) => o.id === overlayId)).toBeUndefined()
  })

  test('drawing bar has lock, visible, and remove controls', async ({ page }) => {
    const drawingBar = page.locator('.klinecharts-pro-drawing-bar')
    await expect(drawingBar.locator('.lock')).toBeVisible()
    await expect(drawingBar.locator('.visible')).toBeVisible()
    await expect(drawingBar.locator('.remove')).toBeVisible()
  })

  test('magnet mode button is present', async ({ page }) => {
    const drawingBar = page.locator('.klinecharts-pro-drawing-bar')
    await expect(drawingBar.locator('.mode')).toBeVisible()
  })

  test('create and remove overlay via drawing bar remove button', async ({ page }) => {
    await createOverlayViaAPI(page, 'horizontalStraightLine')
    await page.waitForTimeout(300)

    await page.locator('.klinecharts-pro-drawing-bar .remove').click()
    await page.waitForTimeout(300)

    const overlays = await getOverlaysViaAPI(page)
    const drawingOverlays = overlays.filter((o: any) => o.groupId === 'drawing_tools')
    expect(drawingOverlays.length).toBe(0)
  })
})
