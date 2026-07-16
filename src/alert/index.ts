import type { AlertConfig, AlertEvent } from './types'

export type { AlertConfig, AlertEvent } from './types'

export class AlertManager {
  #alerts = new Map<string, AlertConfig>()
  #prevPrice?: number

  onTrigger?: (event: AlertEvent) => void

  addAlert(config: AlertConfig): void {
    if (!Number.isFinite(config.price)) return
    this.#alerts.set(config.id, { ...config, triggered: false })
  }

  /** 更新报警配置，保留触发状态 */
  updateAlert(id: string, updates: Partial<Omit<AlertConfig, 'id'>>): boolean {
    const existing = this.#alerts.get(id)
    if (!existing) return false
    this.#alerts.set(id, { ...existing, ...updates, id })
    return true
  }

  removeAlert(id: string): void {
    this.#alerts.delete(id)
  }

  getAlert(id: string): AlertConfig | undefined {
    return this.#alerts.get(id)
  }

  getAlerts(): AlertConfig[] {
    return Array.from(this.#alerts.values())
  }

  clearAll(): void {
    this.#alerts.clear()
  }

  checkPrice(currentPrice: number, timestamp: number): void {
    if (!Number.isFinite(currentPrice)) return
    if (this.#prevPrice === undefined) {
      this.#prevPrice = currentPrice
      return
    }

    const prevPrice = this.#prevPrice
    this.#prevPrice = currentPrice

    for (const alert of this.#alerts.values()) {
      if (alert.triggered) continue

      let triggered = false
      switch (alert.condition) {
        case 'crossing':
          triggered =
            (prevPrice < alert.price && currentPrice >= alert.price) ||
            (prevPrice > alert.price && currentPrice <= alert.price)
          break
        case 'above':
          triggered = prevPrice <= alert.price && currentPrice > alert.price
          break
        case 'below':
          triggered = prevPrice >= alert.price && currentPrice < alert.price
          break
      }

      if (triggered) {
        const updated = { ...alert, triggered: true }
        this.#alerts.set(alert.id, updated)
        try {
          this.onTrigger?.({
            alert,
            triggerPrice: currentPrice,
            timestamp,
          })
        } catch (e) {
          console.warn('[TradingChest] alert onTrigger handler threw:', e)
        }
      }
    }
  }

  /** 重置前价格记录（品种切换时调用，防止跨品种误触发） */
  resetPrevPrice(): void {
    this.#prevPrice = undefined
  }

  resetAll(): void {
    for (const [id, alert] of this.#alerts) {
      if (alert.triggered) {
        this.#alerts.set(id, { ...alert, triggered: false })
      }
    }
  }
}
