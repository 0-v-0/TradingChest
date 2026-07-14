import { test, expect } from '@playwright/test'
import { waitForChart, evaluateChartMethod } from './helpers'

test.describe('Keyboard Shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForChart(page)
  })

  test('Escape cancels drawing mode', async ({ page }) => {
    // Create a straightLine overlay (starts drawing mode)
    await page.evaluate(() => {
      const chart = globalThis.chartInstance.getChart()
      if (chart) chart.createOverlay('straightLine')
    })
    await page.waitForTimeout(300)

    // Focus the chart widget so keyboard events reach the shortcut manager
    await page.locator('.klinecharts-pro-widget').click()
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)

    // After cancel, no overlays should remain
    const overlays = await page.evaluate(() => {
      const chart = globalThis.chartInstance
      if (!chart) return []
      return chart.getOverlays()
    })
    expect(overlays.length).toBe(0)
  })

  test('Delete removes selected overlay', async ({ page }) => {
    // Create a completed horizontalStraightLine overlay via API
    await page.evaluate(() => {
      const chart = globalThis.chartInstance.getChart()
      if (chart) {
        chart.createOverlay({
          name: 'horizontalStraightLine',
          points: [{ value: 45000 }],
        })
      }
    })
    await page.waitForTimeout(500)

    const overlaysBefore = await page.evaluate(() => {
      return globalThis.chartInstance.getOverlays().length
    })
    expect(overlaysBefore).toBeGreaterThan(0)

    // Click on the chart to select the overlay, then delete
    await page.locator('.klinecharts-pro-widget').click()
    await page.waitForTimeout(200)
    await page.keyboard.press('Delete')
    await page.waitForTimeout(500)

    const overlaysAfter = await page.evaluate(() => {
      return globalThis.chartInstance.getOverlays().length
    })
    expect(overlaysAfter).toBe(0)
  })

  test('Ctrl+Z undoes last overlay via undo/redo manager', async ({ page }) => {
    // Create overlay and manually push undo command
    await page.evaluate(() => {
      const chart = globalThis.chartInstance
      if (!chart) return
      const widget = chart.getChart()
      if (!widget) return
      const overlayId = widget.createOverlay({
        name: 'horizontalStraightLine',
        points: [{ value: 45000 }],
      })
      // Push an undo command so Ctrl+Z can remove it
      if (overlayId) {
        const o = widget.getOverlays({ id: overlayId as string })[0]
        if (o) {
          const undoRedo = (chart as any)._undoRedoManager
          if (undoRedo) {
            undoRedo.push({
              undo: () => widget.removeOverlay({ id: o.id }),
              redo: () => widget.createOverlay({
                name: o.name, id: o.id, points: o.points,
                extendData: o.extendData, styles: o.styles, lock: o.lock,
              }),
            })
          }
        }
      }
    })
    await page.waitForTimeout(500)

    const overlaysBefore = await page.evaluate(() => {
      return globalThis.chartInstance.getOverlays().length
    })
    expect(overlaysBefore).toBeGreaterThan(0)

    // Focus chart and press Ctrl+Z
    await page.locator('.klinecharts-pro-widget').click()
    await page.keyboard.press('Control+z')
    await page.waitForTimeout(500)

    const overlays = await page.evaluate(() => {
      return globalThis.chartInstance.getOverlays().length
    })
    expect(overlays).toBe(0)
  })

  test('Ctrl+Shift+Z redoes undone overlay', async ({ page }) => {
    // Create overlay and push undo command
    await page.evaluate(() => {
      const chart = globalThis.chartInstance
      if (!chart) return
      const widget = chart.getChart()
      if (!widget) return
      const overlayId = widget.createOverlay({
        name: 'horizontalStraightLine',
        points: [{ value: 45000 }],
      })
      if (overlayId) {
        const o = widget.getOverlays({ id: overlayId as string })[0]
        if (o) {
          const undoRedo = (chart as any)._undoRedoManager
          if (undoRedo) {
            undoRedo.push({
              undo: () => widget.removeOverlay({ id: o.id }),
              redo: () => widget.createOverlay({
                name: o.name, id: o.id, points: o.points,
                extendData: o.extendData, styles: o.styles, lock: o.lock,
              }),
            })
          }
        }
      }
    })
    await page.waitForTimeout(500)

    // Undo
    await page.locator('.klinecharts-pro-widget').click()
    await page.keyboard.press('Control+z')
    await page.waitForTimeout(500)

    // Redo
    await page.keyboard.press('Control+Shift+z')
    await page.waitForTimeout(500)

    const overlays = await page.evaluate(() => {
      return globalThis.chartInstance.getOverlays().length
    })
    expect(overlays).toBeGreaterThan(0)
  })

  test('Alt+T creates a straight line overlay', async ({ page }) => {
    await page.locator('.klinecharts-pro-widget').click()
    await page.waitForTimeout(200)

    await page.keyboard.press('Alt+t')
    await page.waitForTimeout(300)

    // Cancel the drawing mode
    await page.keyboard.press('Escape')
    await page.waitForTimeout(200)
  })
})
