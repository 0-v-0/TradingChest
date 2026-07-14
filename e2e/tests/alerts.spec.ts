import { test, expect } from '@playwright/test'
import { waitForChart, evaluateChartMethod } from './helpers'

test.describe('Alerts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForChart(page)
    await page.evaluate(() => {
      // Clear existing arrays instead of reassigning (callbacks hold references to originals)
      if (globalThis.alertEvents) globalThis.alertEvents.length = 0
      else globalThis.alertEvents = []
    })
  })

  test('add a price alert via API', async ({ page }) => {
    await evaluateChartMethod(page, 'addAlert', {
      id: 'test-alert-1',
      price: 46000,
      condition: 'above',
    })
    await page.waitForTimeout(500)

    const alerts = await evaluateChartMethod<any[]>(page, 'getAlerts')
    expect(alerts?.length).toBeGreaterThan(0)
    expect(alerts?.find((a: any) => a.id === 'test-alert-1')).toBeTruthy()
  })

  test('alert triggers when price crosses threshold', async ({ page }) => {
    await evaluateChartMethod(page, 'addAlert', {
      id: 'test-alert-cross',
      price: 46000,
      condition: 'crossing',
    })
    await page.waitForTimeout(300)

    // Verify alert was added
    const alerts = await evaluateChartMethod<any[]>(page, 'getAlerts')
    expect(alerts?.length).toBeGreaterThan(0)

    // feedPrice first call sets prevPrice; second call triggers the crossing check
    await evaluateChartMethod(page, 'feedPrice', 45000)
    await page.waitForTimeout(100)
    await evaluateChartMethod(page, 'feedPrice', 46500)
    await page.waitForTimeout(500)

    const events = await page.evaluate(() => globalThis.alertEvents)
    expect(events.length).toBeGreaterThan(0)
  })

  test('remove a price alert', async ({ page }) => {
    await evaluateChartMethod(page, 'addAlert', { id: 'test-alert-remove', price: 46000, condition: 'above' })
    await page.waitForTimeout(300)

    await evaluateChartMethod(page, 'removeAlert', 'test-alert-remove')
    await page.waitForTimeout(300)

    const alerts = (await evaluateChartMethod<any[]>(page, 'getAlerts')) ?? []
    expect(alerts.find((a: any) => a.id === 'test-alert-remove')).toBeUndefined()
  })

  test('get all alerts returns correct list', async ({ page }) => {
    await evaluateChartMethod(page, 'addAlert', { id: 'alert-a', price: 46000, condition: 'above' })
    await evaluateChartMethod(page, 'addAlert', { id: 'alert-b', price: 44000, condition: 'below' })
    await page.waitForTimeout(300)

    const alerts = (await evaluateChartMethod<any[]>(page, 'getAlerts')) ?? []
    expect(alerts.length).toBeGreaterThanOrEqual(2)
    const ids = alerts.map((a: any) => a.id)
    expect(ids).toContain('alert-a')
    expect(ids).toContain('alert-b')
  })
})
